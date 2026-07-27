// ape-dsp — Android JNI bridge + Oboe audio engine (ruling R3, 2026-07-23).
//
// The Android analog of iOS ApeDspCore.mm. Owns the SPSC ring, the portable
// EngineHub + Generator (shared golden-tested C++ core at ../ios/core), the
// analysis thread, and TWO Oboe streams (input capture + generator output).
// Threading model is identical to iOS:
//   RT capture thread  → ring write only (Oboe input callback)
//   RT output thread   → generator render only (Oboe output callback)
//   analysis thread    → drain ring → EngineHub::processChunk + analysisTick
//   bridge (JNI) thread→ snapshot getters (mutex-guarded copies in EngineHub)
//
// Kotlin does the Expo DSL + Map/ByteArray marshalling; this shim is a thin
// C-ABI over the core (jlong handle, primitives / jdoubleArray / jbyteArray).
#include <jni.h>

#include <atomic>
#include <chrono>
#include <cstdint>
#include <memory>
#include <mutex>
#include <thread>
#include <vector>

#include <oboe/Oboe.h>

#include "Effects.hpp"
#include "EngineHub.hpp"
#include "Generator.hpp"
#include "SpscRing.hpp"

namespace {

constexpr size_t kRingCapacity = 1 << 18;  // 262144 frames ≈ 5.5 s @ 48 kHz
constexpr size_t kScratchSize = 8192;
constexpr double kStallSeconds = 0.5;
constexpr size_t kMaxWaveBuckets = 120;

double nowSeconds() {
  using namespace std::chrono;
  return duration<double>(steady_clock::now().time_since_epoch()).count();
}

}  // namespace

// ---------------------------------------------------------------------------
// NativeEngine — everything the module needs, per process instance.
//
// DISCONNECT POLICY (v1, review 2026-07-23): NO in-callback auto-recovery. A
// headset/USB unplug closes the Oboe stream; capture then stalls, which the
// meter frame surfaces (captureStalled → the UI's "engine not active" state),
// and the user re-arms with STOP→START (the JS hook drives that cleanly). This
// deliberately avoids the detached-recovery-thread use-after-free / member
// races that thread-in-the-error-callback recovery would introduce — that
// robustness lands in a later pass once on-device capture is validated.
// ---------------------------------------------------------------------------
class NativeEngine {
 public:
  NativeEngine() {
    ring_ = new apedsp::SpscRing(kRingCapacity);
    scratch_ = new float[kScratchSize];
    engine_.configureSampleRate(48000.0);
    gen_.configure(48000.0);
    lastWriteAt_.store(0.0);
    running_.store(false);
  }

  ~NativeEngine() {
    stopCapture();
    genStop();
    delete ring_;
    delete[] scratch_;
  }

  // ---- Capture ----------------------------------------------------------
  // Returns: [ok, actualRate, framesPerBurst, measurementMode]. Opens the
  // input stream, configures the engine at the ACTUAL rate, starts the
  // analysis thread. `unprocessedSupported` comes from Kotlin's
  // PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED check.
  void startCapture(bool unprocessedSupported, double out[4]) {
    unprocessedSupported_ = unprocessedSupported;
    out[0] = openInput() ? 1.0 : 0.0;
    out[1] = inRate_;
    out[2] = static_cast<double>(framesBurst_);
    out[3] = measurementMode_ ? 1.0 : 0.0;
  }

  void stopCapture() {
    // Stop draining first, then close the stream so no callback outlives it.
    if (running_.exchange(false)) {
      if (analysisThread_.joinable()) analysisThread_.join();
    }
    if (inStream_) {
      inStream_->requestStop();
      inStream_->close();
      inStream_.reset();
    }
    engine_.processChunk(nullptr, 0, ring_->dropped(), false);
  }

  bool captureRunning() const { return running_.load(std::memory_order_relaxed); }
  bool captureStalled() const {
    return running_.load(std::memory_order_relaxed) &&
           (nowSeconds() - lastWriteAt_.load(std::memory_order_relaxed)) > kStallSeconds;
  }

  // ---- Engine surface (accessed directly by the JNI shim) ----------------
  apedsp::EngineHub engine_;
  apedsp::Generator gen_;
  apedsp::EffectChain chain_;
  apedsp::SpscRing* ring_ = nullptr;
  std::atomic<double> lastWriteAt_;

  // ---- Generator output --------------------------------------------------
  // Returns false if the output stream failed to open (so the UI doesn't show
  // a silent "running" generator — review 2026-07-23).
  bool genStart() {
    std::lock_guard<std::mutex> lk(outStreamMu_);
    const bool ok = outStream_ ? true : openOutput();
    if (ok) gen_.start();
    return ok;
  }
  void genStop() {
    // gen_.stop() only requests the 10 ms fade-out — the render callback must
    // keep running long enough to actually render it, so the stream close is
    // DEFERRED ~150 ms (iOS parity: ApeDspModule.swift genStop does the same
    // via asyncAfter). Closing synchronously truncated the fade and popped on
    // every stop. Blocking here is safe: this runs on the bridge thread
    // (Expo AsyncFunction / OnDestroy), never the RT callback. If a genStart
    // lands during the wait (calls are serialized by outStreamMu_ +
    // JS awaiting genStop-before-start is not guaranteed), the generator is
    // running again — keep the stream.
    gen_.stop();
    // Wait whenever an output stream exists — not just when the generator was
    // still flagged running: a second genStop inside the first one's window
    // (STOP then blur) sees running()==false but the fade may still be
    // rendering, and closing early would truncate it all the same.
    if (outStream_ != nullptr) std::this_thread::sleep_for(std::chrono::milliseconds(150));
    std::lock_guard<std::mutex> lk(outStreamMu_);
    if (gen_.running()) return;  // restarted during the wait — stream stays up
    if (outStream_) {
      outStream_->requestStop();
      outStream_->close();
      outStream_.reset();
    }
  }

 private:
  // Input data callback — RT-safe: ring write + timestamp only. No JNI/locks.
  struct InputCallback : oboe::AudioStreamDataCallback {
    NativeEngine* eng;
    oboe::DataCallbackResult onAudioReady(oboe::AudioStream*, void* data, int32_t numFrames) override {
      const float* in = static_cast<const float*>(data);  // mono float
      const float* ch[1] = {in};
      eng->ring_->writeChannels(ch, 1, static_cast<size_t>(numFrames));
      eng->lastWriteAt_.store(nowSeconds(), std::memory_order_relaxed);
      return oboe::DataCallbackResult::Continue;
    }
  };
  // Output data callback — RT-safe: generator render only.
  struct OutputCallback : oboe::AudioStreamDataCallback {
    NativeEngine* eng;
    oboe::DataCallbackResult onAudioReady(oboe::AudioStream*, void* data, int32_t numFrames) override {
      float* out = static_cast<float*>(data);
      const uint32_t nf = static_cast<uint32_t>(numFrames);
      // Stereo (2-ch, interleaved LRLR). Render deinterleaved into the
      // preallocated scratch, then interleave. Falls back to silence if a burst
      // ever exceeds the reserved size (it shouldn't).
      if (nf <= eng->outL_.size()) {
        eng->gen_.renderStereo(eng->outL_.data(), eng->outR_.data(), nf);
        // Effects-processing path: source → chain → output (skipped when idle).
        if (eng->chain_.anyActive()) eng->chain_.processStereo(eng->outL_.data(), eng->outR_.data(), nf);
        for (uint32_t i = 0; i < nf; ++i) {
          out[2 * i] = eng->outL_[i];
          out[2 * i + 1] = eng->outR_[i];
        }
      } else {
        for (uint32_t i = 0; i < nf * 2u; ++i) out[i] = 0.0f;
      }
      return oboe::DataCallbackResult::Continue;
    }
  };

  bool openInput() {
    oboe::AudioStreamBuilder b;
    b.setDirection(oboe::Direction::Input)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Exclusive)
        ->setFormat(oboe::AudioFormat::Float)
        ->setChannelCount(oboe::ChannelCount::Mono)
        ->setSampleRate(48000)
        ->setSampleRateConversionQuality(oboe::SampleRateConversionQuality::None)
        // Unprocessed = raw signal (no AGC/NS) when the DEVICE supports it;
        // else VoiceRecognition (CDD-mandated to disable NS, not always
        // honored). The honesty flag (measurementMode_) records which we got.
        ->setInputPreset(unprocessedSupported_ ? oboe::InputPreset::Unprocessed
                                               : oboe::InputPreset::VoiceRecognition)
        ->setDataCallback(&inputCb_);
    inputCb_.eng = this;
    oboe::Result r = b.openStream(inStream_);
    if (r != oboe::Result::OK || !inStream_) {
      inStream_.reset();
      return false;
    }
    // set*() are only validated at open — READ BACK the actual configuration.
    // The callback assumes MONO FLOAT interleaved; if negotiation substituted
    // stereo or I16 the bytes would be misread, so REFUSE rather than feed the
    // DSP garbage (review 2026-07-23). A stereo→mono path is a later refinement.
    if (inStream_->getChannelCount() != 1 ||
        inStream_->getFormat() != oboe::AudioFormat::Float) {
      inStream_->close();
      inStream_.reset();
      return false;
    }
    inRate_ = static_cast<double>(inStream_->getSampleRate());  // drive the DSP at THIS rate
    framesBurst_ = inStream_->getFramesPerBurst();
    measurementMode_ =
        unprocessedSupported_ && inStream_->getInputPreset() == oboe::InputPreset::Unprocessed;

    engine_.configureSampleRate(inRate_);  // analysis thread not running yet — safe
    ring_->clear();
    lastWriteAt_.store(nowSeconds());

    running_.store(true);
    startAnalysisThread();
    if (inStream_->requestStart() != oboe::Result::OK) {
      stopCapture();
      return false;
    }
    return true;
  }

  bool openOutput() {
    oboe::AudioStreamBuilder b;
    b.setDirection(oboe::Direction::Output)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Exclusive)
        ->setFormat(oboe::AudioFormat::Float)
        ->setChannelCount(oboe::ChannelCount::Stereo)
        ->setSampleRate(48000)
        ->setSampleRateConversionQuality(oboe::SampleRateConversionQuality::None)
        ->setUsage(oboe::Usage::Media)
        ->setContentType(oboe::ContentType::Sonification)
        ->setDataCallback(&outputCb_);
    outputCb_.eng = this;
    // Preallocate the deinterleave scratch generously (bursts are far smaller).
    outL_.assign(8192, 0.0f);
    outR_.assign(8192, 0.0f);
    oboe::Result r = b.openStream(outStream_);
    if (r != oboe::Result::OK || !outStream_) {
      outStream_.reset();
      return false;
    }
    outRate_ = static_cast<double>(outStream_->getSampleRate());
    gen_.configure(outRate_);  // generate at the ACTUAL output rate
    chain_.configure(outRate_);  // effect buffers sized pre-start (not RT)
    if (outStream_->requestStart() != oboe::Result::OK) {
      outStream_->close();
      outStream_.reset();
      return false;
    }
    return true;
  }

  void startAnalysisThread() {
    apedsp::SpscRing* ring = ring_;
    apedsp::EngineHub* engine = &engine_;
    float* scratch = scratch_;
    std::atomic<bool>* running = &running_;
    analysisThread_ = std::thread([ring, engine, scratch, running]() {
      while (running->load(std::memory_order_relaxed)) {
        size_t total = 0, n;
        while ((n = ring->read(scratch, kScratchSize)) > 0) {
          engine->processChunk(scratch, n, ring->dropped(), true);
          total += n;
          if (total > kRingCapacity) break;
        }
        if (total == 0) engine->processChunk(nullptr, 0, ring->dropped(), true);
        engine->analysisTick();
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
      }
    });
  }

  float* scratch_ = nullptr;
  std::thread analysisThread_;
  std::atomic<bool> running_{false};

  std::shared_ptr<oboe::AudioStream> inStream_;
  std::shared_ptr<oboe::AudioStream> outStream_;
  // Serializes output-stream open/close across genStart and genStop's
  // deferred close (never touched from the RT callback).
  std::mutex outStreamMu_;
  InputCallback inputCb_{};
  OutputCallback outputCb_{};

  bool unprocessedSupported_ = false;
  bool measurementMode_ = false;
  double inRate_ = 48000.0;
  double outRate_ = 48000.0;
  int32_t framesBurst_ = 0;
  // Deinterleaved stereo scratch for the output callback (renderStereo writes
  // separate L/R; Oboe wants interleaved LRLR). Preallocated in openOutput —
  // never resized in the RT callback.
  std::vector<float> outL_, outR_;

 public:
  bool measurementMode() const { return measurementMode_; }
  double inRate() const { return inRate_; }
};

// ---------------------------------------------------------------------------
// JNI shim. Symbols: Java_expo_modules_apedsp_ApeDspModule_<method>.
// ---------------------------------------------------------------------------
static inline NativeEngine* eng(jlong h) { return reinterpret_cast<NativeEngine*>(h); }

extern "C" {

// apedsp::kEngineVersion (EngineHub.hpp) — the one source of truth for the
// engine capability version. Kotlin reads THIS for getInfo()/getFrame() so a
// core bump can never skew the platforms (no handle needed — it's a constant).
JNIEXPORT jint JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeEngineVersion(JNIEnv*, jobject) {
  return static_cast<jint>(apedsp::kEngineVersion);
}

JNIEXPORT jlong JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeCreate(JNIEnv*, jobject) {
  return reinterpret_cast<jlong>(new NativeEngine());
}

JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeDestroy(JNIEnv*, jobject, jlong h) {
  delete eng(h);
}

JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeStartCapture(JNIEnv* env, jobject, jlong h,
                                                         jboolean unprocessedSupported) {
  double out[4];
  eng(h)->startCapture(unprocessedSupported == JNI_TRUE, out);
  jdoubleArray a = env->NewDoubleArray(4);
  env->SetDoubleArrayRegion(a, 0, 4, out);
  return a;
}

JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeStopCapture(JNIEnv*, jobject, jlong h) {
  eng(h)->stopCapture();
}

JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeResetPeakHold(JNIEnv*, jobject, jlong h) {
  eng(h)->engine_.resetPeakHold();
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeResetLeq(JNIEnv*, jobject, jlong h) {
  eng(h)->engine_.resetLeq();
}

JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeSetEngineConfig(JNIEnv*, jobject, jlong h,
                                                            jint fftSize, jint fraction,
                                                            jboolean spectrum, jboolean pitch,
                                                            jboolean waveform, jdouble bandAvgAlpha) {
  apedsp::EngineConfig cfg;
  cfg.fftSize = static_cast<uint32_t>(fftSize);
  cfg.fraction = fraction;
  cfg.spectrumEnabled = spectrum == JNI_TRUE;
  cfg.pitchEnabled = pitch == JNI_TRUE;
  cfg.waveformEnabled = waveform == JNI_TRUE;
  cfg.bandAvgAlpha = bandAvgAlpha;
  eng(h)->engine_.setConfig(cfg);
}

// Meter — 18 scalars in a fixed order (see Kotlin unpack).
JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeMeterFrame(JNIEnv* env, jobject, jlong h) {
  const apedsp::MeterFrame f = eng(h)->engine_.meterFrame();
  const bool running = eng(h)->captureRunning();
  const bool stalled = eng(h)->captureStalled();
  double v[18] = {
      static_cast<double>(f.version),       static_cast<double>(f.sequence),
      static_cast<double>(f.settingsEpoch), f.zFastDb,
      f.zSlowDb,                            f.aFastDb,
      f.aSlowDb,                            f.cFastDb,
      f.cSlowDb,                            f.peakDb,
      f.peakHoldDb,                         static_cast<double>(f.clipRuns),
      f.leqZDb,                             f.leqADb,
      f.elapsedSec,                         static_cast<double>(f.droppedFrames),
      running ? 1.0 : 0.0,                  stalled ? 1.0 : 0.0};
  jdoubleArray a = env->NewDoubleArray(18);
  env->SetDoubleArrayRegion(a, 0, 18, v);
  return a;
}

static jfloatArray floatArrayOf(JNIEnv* env, const std::vector<float>& v) {
  jfloatArray a = env->NewFloatArray(static_cast<jsize>(v.size()));
  if (!v.empty()) env->SetFloatArrayRegion(a, 0, static_cast<jsize>(v.size()), v.data());
  return a;
}

// Bands — ONE snapshot packed into a single float array so every array + the
// scalars are internally consistent (iOS-parity; review 2026-07-23: separate
// per-array calls could straddle a mid-poll setConfig resize). Layout:
//   [0]=sequence [1]=fraction [2]=fftSize [3]=sampleRate [4]=count(N)
//   then N centers, N levelsDb, N peakHoldDb, N resolvable(1/0).
JNIEXPORT jfloatArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeBandsPacked(JNIEnv* env, jobject, jlong h) {
  const apedsp::BandsSnapshot b = eng(h)->engine_.bandsSnapshot();
  const size_t n = b.centers.size();
  std::vector<float> out;
  out.reserve(5 + n * 4);
  out.push_back(static_cast<float>(b.sequence));
  out.push_back(static_cast<float>(b.fraction));
  out.push_back(static_cast<float>(b.fftSize));
  out.push_back(static_cast<float>(b.sampleRate));
  out.push_back(static_cast<float>(n));
  for (size_t i = 0; i < n; ++i) out.push_back(b.centers[i]);
  for (size_t i = 0; i < n; ++i) out.push_back(b.levelsDb[i]);
  for (size_t i = 0; i < n; ++i) out.push_back(b.peakHoldDb[i]);
  for (size_t i = 0; i < n; ++i) out.push_back(b.resolvable[i] ? 1.0f : 0.0f);
  return floatArrayOf(env, out);
}

JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativePitchFrame(JNIEnv* env, jobject, jlong h) {
  const apedsp::PitchSnapshot p = eng(h)->engine_.pitchSnapshot();
  double v[5] = {static_cast<double>(p.sequence), p.freq, p.confidence, p.voiced ? 1.0 : 0.0,
                 p.levelDb};
  jdoubleArray a = env->NewDoubleArray(5);
  env->SetDoubleArrayRegion(a, 0, 5, v);
  return a;
}

JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeSpectrumMeta(JNIEnv* env, jobject, jlong h) {
  const apedsp::SpectrumSnapshot s = eng(h)->engine_.spectrumSnapshot();
  double v[4] = {static_cast<double>(s.sequence), static_cast<double>(s.fftSize), s.sampleRate,
                 static_cast<double>(s.binsDb.size())};
  jdoubleArray a = env->NewDoubleArray(4);
  env->SetDoubleArrayRegion(a, 0, 4, v);
  return a;
}
JNIEXPORT jbyteArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeSpectrumData(JNIEnv* env, jobject, jlong h) {
  const apedsp::SpectrumSnapshot s = eng(h)->engine_.spectrumSnapshot();
  const jsize bytes = static_cast<jsize>(s.binsDb.size() * sizeof(float));
  jbyteArray a = env->NewByteArray(bytes);
  if (bytes > 0)
    env->SetByteArrayRegion(a, 0, bytes, reinterpret_cast<const jbyte*>(s.binsDb.data()));
  return a;
}
JNIEXPORT jbyteArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeWaveformData(JNIEnv* env, jobject, jlong h) {
  apedsp::WaveBucket buckets[kMaxWaveBuckets];
  const size_t n = eng(h)->engine_.waveSnapshot(buckets, kMaxWaveBuckets);
  std::vector<float> quads;
  quads.reserve(n * 4);
  for (size_t i = 0; i < n; ++i) {
    quads.push_back(buckets[i].mn);
    quads.push_back(buckets[i].mx);
    quads.push_back(buckets[i].rms);
    quads.push_back(buckets[i].clipped ? 1.0f : 0.0f);
  }
  const jsize bytes = static_cast<jsize>(quads.size() * sizeof(float));
  jbyteArray a = env->NewByteArray(bytes);
  if (bytes > 0) env->SetByteArrayRegion(a, 0, bytes, reinterpret_cast<const jbyte*>(quads.data()));
  return a;
}

// Cheap running probe for getInfo() (avoids allocating a meter frame).
JNIEXPORT jboolean JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeCaptureRunning(JNIEnv*, jobject, jlong h) {
  return eng(h)->captureRunning() ? JNI_TRUE : JNI_FALSE;
}

// ---- Generator ----
JNIEXPORT jboolean JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenStart(JNIEnv*, jobject, jlong h) {
  return eng(h)->genStart() ? JNI_TRUE : JNI_FALSE;
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenStop(JNIEnv*, jobject, jlong h) {
  eng(h)->genStop();
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetMode(JNIEnv*, jobject, jlong h, jint mode) {
  eng(h)->gen_.setMode(static_cast<apedsp::GenMode>(mode));
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetFrequency(JNIEnv*, jobject, jlong h, jdouble hz) {
  eng(h)->gen_.setFrequency(hz);
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetLevelDb(JNIEnv*, jobject, jlong h, jdouble db) {
  eng(h)->gen_.setLevelDb(db);
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetSweep(JNIEnv*, jobject, jlong h, jdouble s0,
                                                        jdouble s1, jdouble secs, jboolean repeat) {
  eng(h)->gen_.setSweep(s0, s1, secs, repeat == JNI_TRUE);
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetClickBpm(JNIEnv*, jobject, jlong h, jdouble bpm) {
  eng(h)->gen_.setClickBpm(bpm);
}
// Route-aware speaker-safety high-pass cutoff (Hz); 0 = bypass. Kotlin sets it
// from the current OUTPUT route (built-in speaker → 150, else 0).
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetHpf(JNIEnv*, jobject, jlong h, jdouble hz) {
  eng(h)->gen_.setHpf(hz);
}
// Stereo dual-oscillator (hard-panned L/R) — on + the two channel frequencies.
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetStereo(JNIEnv*, jobject, jlong h, jboolean on,
                                                         jdouble fL, jdouble fR) {
  eng(h)->gen_.setStereo(on == JNI_TRUE, fL, fR);
}
// ---- Effects chain (one scalar setter for the whole roster; see fx::Id) ----
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeFxSet(JNIEnv*, jobject, jlong h, jint effectId,
                                                  jint paramId, jdouble v) {
  eng(h)->chain_.set(effectId, paramId, v);
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeFxReset(JNIEnv*, jobject, jlong h) {
  eng(h)->chain_.reset();
}
// [compGr, gateGr, limiterGr] dB — live gain-reduction for honest UI meters.
JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeFxGrStatus(JNIEnv* env, jobject, jlong h) {
  double g[3];
  eng(h)->chain_.grStatus(g);
  jdoubleArray a = env->NewDoubleArray(3);
  env->SetDoubleArrayRegion(a, 0, 3, g);
  return a;
}
// ADDITIVE (HV-2): flat [f0, a1..a12, p1..p12] — 25 doubles (Hz, 0..1, degrees).
// Same ordering as iOS/JS. Copy semantics per the existing convention (region
// copy, no pinning); the core NaN-proofs/clamps and ignores short arrays
// (count < 25). NOTE: nativeGenSetFrequency does NOT retune the additive f0 —
// JS resends the full additive array to retune (phase-continuous in core).
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenSetAdditive(JNIEnv* env, jobject, jlong h,
                                                           jdoubleArray vals) {
  if (vals == nullptr) return;
  const jsize n = env->GetArrayLength(vals);
  if (n < 1) return;
  std::vector<double> buf(static_cast<size_t>(n));
  env->GetDoubleArrayRegion(vals, 0, n, buf.data());
  eng(h)->gen_.setAdditive(buf.data(), static_cast<uint32_t>(n));
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenUnlockCap(JNIEnv*, jobject, jlong h) {
  eng(h)->gen_.unlockCap();
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenRelockCap(JNIEnv*, jobject, jlong h) {
  eng(h)->gen_.relockCap();
}
// 8 slots, fixed order (see Kotlin genStatusMap): [running, capUnlocked,
// effectiveLevelDb, defaultLevelDb, capDb, additiveNorm, genHpfHz,
// genHpfEngaged]. additiveNorm (HV-2): 1 = not attenuating; <1 = the
// 1/max(1, Σaₙ) peak bound is pulling levels down. v4: genHpfHz (0 = bypassed)
// + genHpfEngaged are the route-aware speaker-safety HPF state. KEEP the writer
// and the Kotlin index reader in lockstep — the index contract is load-bearing.
JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeGenStatus(JNIEnv* env, jobject, jlong h) {
  double v[8] = {eng(h)->gen_.running() ? 1.0 : 0.0, eng(h)->gen_.capUnlocked() ? 1.0 : 0.0,
                 eng(h)->gen_.effectiveLevelDb(), apedsp::genlevel::kDefaultDb,
                 apedsp::genlevel::kCapDb, eng(h)->gen_.additiveNorm(),
                 eng(h)->gen_.hpfHz(), eng(h)->gen_.hpfEngaged() ? 1.0 : 0.0};
  jdoubleArray a = env->NewDoubleArray(8);
  env->SetDoubleArrayRegion(a, 0, 8, v);
  return a;
}

// ---- RT60 ----
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60Arm(JNIEnv*, jobject, jlong h) {
  eng(h)->engine_.rt60Arm();
}
JNIEXPORT void JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60Cancel(JNIEnv*, jobject, jlong h) {
  eng(h)->engine_.rt60Cancel();
}
JNIEXPORT jint JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60State(JNIEnv*, jobject, jlong h) {
  return static_cast<jint>(eng(h)->engine_.rt60State());
}
// Bands flattened 9 per band: [bandHz, edt, t20, t30, r2, t20R2, t30R2, decayRange, valid].
JNIEXPORT jdoubleArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60Bands(JNIEnv* env, jobject, jlong h) {
  const apedsp::Rt60Analysis a = eng(h)->engine_.rt60Result();
  std::vector<double> flat;
  flat.reserve(a.bands.size() * 9);
  for (const auto& b : a.bands) {
    flat.push_back(b.bandHz);
    flat.push_back(b.edtSec);
    flat.push_back(b.t20Rt60Sec);
    flat.push_back(b.t30Rt60Sec);
    flat.push_back(b.r2);
    flat.push_back(b.t20R2);
    flat.push_back(b.t30R2);
    flat.push_back(b.decayRangeDb);
    flat.push_back(b.valid ? 1.0 : 0.0);
  }
  jdoubleArray arr = env->NewDoubleArray(static_cast<jsize>(flat.size()));
  if (!flat.empty()) env->SetDoubleArrayRegion(arr, 0, static_cast<jsize>(flat.size()), flat.data());
  return arr;
}
JNIEXPORT jfloatArray JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60Curve(JNIEnv* env, jobject, jlong h) {
  return floatArrayOf(env, eng(h)->engine_.rt60Result().curveDb);
}
JNIEXPORT jdouble JNICALL
Java_expo_modules_apedsp_ApeDspModule_nativeRt60CurveStep(JNIEnv*, jobject, jlong h) {
  return eng(h)->engine_.rt60Result().curveStepSec;
}

}  // extern "C"
