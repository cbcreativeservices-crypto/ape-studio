// ape-dsp — ObjC++ implementation: owns the SPSC ring, the analysis thread,
// the EngineHub (engine build 2026-07-23), and the Generator. Threading model
// per tech spec §1.1, unchanged from the validated spike:
//   RT capture thread → writeChannels (ring write only)
//   RT output thread  → genRender (generator only — atomics, no locks)
//   analysis          → drain ring every ~50 ms → EngineHub::processChunk,
//                       then EngineHub::analysisTick (FFT/banding/pitch)
//   bridge            → snapshot getters (mutex-guarded copies)
#import "ApeDspCore.h"

#include <atomic>
#include <chrono>
#include <thread>
#include <vector>

#include "core/EngineHub.hpp"
#include "core/Generator.hpp"
#include "core/SpscRing.hpp"

namespace {
constexpr size_t kRingCapacity = 1 << 18;  // 262144 frames ≈ 5.5 s @ 48 kHz (≥2 s spec)
constexpr size_t kScratchSize = 8192;
constexpr double kStallSeconds = 0.5;  // tech spec §2.2 watchdog
constexpr size_t kMaxWaveBuckets = 120;

double nowSeconds() {
  using namespace std::chrono;
  return duration<double>(steady_clock::now().time_since_epoch()).count();
}

NSArray<NSNumber *> *floatArray(const std::vector<float> &v) {
  NSMutableArray<NSNumber *> *a = [NSMutableArray arrayWithCapacity:v.size()];
  for (float x : v) [a addObject:@(x)];
  return a;
}
}  // namespace

@implementation ApeDspCore {
  apedsp::SpscRing *_ring;
  apedsp::EngineHub *_engine;
  apedsp::Generator *_gen;
  std::thread _analysisThread;
  std::atomic<bool> _running;
  std::atomic<double> _lastWriteAt;
  float *_scratch;
}

+ (uint32_t)engineVersion {
  return apedsp::kEngineVersion;
}

- (instancetype)init {
  if (self = [super init]) {
    _ring = new apedsp::SpscRing(kRingCapacity);
    _engine = new apedsp::EngineHub();
    _gen = new apedsp::Generator();
    _engine->configureSampleRate(48000.0);
    _gen->configure(48000.0);
    _scratch = new float[kScratchSize];
    _running.store(false);
    _lastWriteAt.store(0.0);
  }
  return self;
}

- (void)dealloc {
  [self stop];
  delete _ring;
  delete _engine;
  delete _gen;
  delete[] _scratch;
}

- (void)configureSampleRate:(double)sampleRate {
  if (sampleRate <= 0) return;
  // QUIESCE the analysis thread first (review 2026-07-23): configureSampleRate
  // reallocates pitch/roll/wave state that the analysis thread reads — join it,
  // reconfigure, restart. Costs at most one ~50 ms tick.
  const bool wasRunning = _running.exchange(false);
  if (wasRunning && _analysisThread.joinable()) _analysisThread.join();
  _engine->configureSampleRate(sampleRate);
  _gen->configure(sampleRate);
  if (wasRunning) [self start];
}

- (void)setEngineConfig:(NSDictionary<NSString *, id> *)config {
  apedsp::EngineConfig cfg = _engine->config();
  if (NSNumber *v = config[@"fftSize"]) cfg.fftSize = v.unsignedIntValue;
  if (NSNumber *v = config[@"fraction"]) cfg.fraction = v.intValue;
  if (NSNumber *v = config[@"spectrumEnabled"]) cfg.spectrumEnabled = v.boolValue;
  if (NSNumber *v = config[@"pitchEnabled"]) cfg.pitchEnabled = v.boolValue;
  if (NSNumber *v = config[@"waveformEnabled"]) cfg.waveformEnabled = v.boolValue;
  if (NSNumber *v = config[@"bandAvgAlpha"]) cfg.bandAvgAlpha = v.doubleValue;
  _engine->setConfig(cfg);
}

- (void)start {
  if (_running.exchange(true)) return;
  _lastWriteAt.store(nowSeconds());
  apedsp::SpscRing *ring = _ring;
  apedsp::EngineHub *engine = _engine;
  float *scratch = _scratch;
  std::atomic<bool> *running = &_running;
  _analysisThread = std::thread([ring, engine, scratch, running]() {
    while (running->load(std::memory_order_relaxed)) {
      size_t total = 0;
      size_t n;
      // Drain everything available this tick, folding chunk-by-chunk.
      while ((n = ring->read(scratch, kScratchSize)) > 0) {
        engine->processChunk(scratch, n, ring->dropped(), true);
        total += n;
        if (total > kRingCapacity) break;  // paranoia bound
      }
      if (total == 0) {
        engine->processChunk(nullptr, 0, ring->dropped(), true);
      }
      // FFT / banding / pitch on the freshly drained rolling buffer.
      engine->analysisTick();
      std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
  });
}

- (void)stop {
  if (!_running.exchange(false)) return;
  if (_analysisThread.joinable()) _analysisThread.join();
  _engine->processChunk(nullptr, 0, _ring->dropped(), false);
}

- (void)reset {
  _ring->clear();
  _engine->reset();
  _lastWriteAt.store(nowSeconds());
}

- (void)resetPeakHold {
  _engine->resetPeakHold();
}

- (void)resetLeq {
  _engine->resetLeq();
}

- (void)writeChannels:(const float *const *)channels
         channelCount:(int)channelCount
           frameCount:(size_t)frameCount {
  _ring->writeChannels(channels, channelCount, frameCount);
  _lastWriteAt.store(nowSeconds(), std::memory_order_relaxed);
}

// Legacy Spike-0 frame — rmsDb maps to the Z-weighted FAST meter so the
// existing DspDebug screen keeps reading sensible values on the new engine.
- (NSDictionary<NSString *, id> *)frame {
  const apedsp::MeterFrame f = _engine->meterFrame();
  const bool running = _running.load(std::memory_order_relaxed);
  const bool stalled = running && (nowSeconds() - _lastWriteAt.load(std::memory_order_relaxed)) > kStallSeconds;
  return @{
    @"version" : @(f.version),
    @"sequence" : @(f.sequence),
    @"settingsEpoch" : @(f.settingsEpoch),
    @"rmsDb" : @(f.zFastDb),
    @"peakDb" : @(f.peakDb),
    @"peakHoldDb" : @(f.peakHoldDb),
    @"droppedFrames" : @(f.droppedFrames),
    @"running" : @(running),
    @"captureStalled" : @(stalled),
    @"engineVersion" : @(apedsp::kEngineVersion),  // 3 = additive generator (HV-2)
  };
}

- (NSDictionary<NSString *, id> *)meterFrame {
  const apedsp::MeterFrame f = _engine->meterFrame();
  const bool running = _running.load(std::memory_order_relaxed);
  const bool stalled = running && (nowSeconds() - _lastWriteAt.load(std::memory_order_relaxed)) > kStallSeconds;
  return @{
    @"version" : @(f.version),
    @"sequence" : @(f.sequence),
    @"settingsEpoch" : @(f.settingsEpoch),
    @"zFastDb" : @(f.zFastDb),
    @"zSlowDb" : @(f.zSlowDb),
    @"aFastDb" : @(f.aFastDb),
    @"aSlowDb" : @(f.aSlowDb),
    @"cFastDb" : @(f.cFastDb),
    @"cSlowDb" : @(f.cSlowDb),
    @"peakDb" : @(f.peakDb),
    @"peakHoldDb" : @(f.peakHoldDb),
    @"clipRuns" : @(f.clipRuns),
    @"leqZDb" : @(f.leqZDb),
    @"leqADb" : @(f.leqADb),
    @"elapsedSec" : @(f.elapsedSec),
    @"droppedFrames" : @(f.droppedFrames),
    @"running" : @(running),
    @"captureStalled" : @(stalled),
  };
}

- (NSDictionary<NSString *, id> *)bandsFrame {
  const apedsp::BandsSnapshot b = _engine->bandsSnapshot();
  NSMutableArray<NSNumber *> *resolvable = [NSMutableArray arrayWithCapacity:b.resolvable.size()];
  for (uint8_t r : b.resolvable) [resolvable addObject:@(r != 0)];
  return @{
    @"sequence" : @(b.sequence),
    @"fraction" : @(b.fraction),
    @"fftSize" : @(b.fftSize),
    @"sampleRate" : @(b.sampleRate),
    @"centers" : floatArray(b.centers),
    @"levelsDb" : floatArray(b.levelsDb),
    @"peakHoldDb" : floatArray(b.peakHoldDb),
    @"resolvable" : resolvable,
  };
}

- (NSDictionary<NSString *, id> *)pitchFrame {
  const apedsp::PitchSnapshot p = _engine->pitchSnapshot();
  return @{
    @"sequence" : @(p.sequence),
    @"freq" : @(p.freq),
    @"confidence" : @(p.confidence),
    @"voiced" : @(p.voiced),
    @"levelDb" : @(p.levelDb),
  };
}

- (NSDictionary<NSString *, id> *)spectrumMeta {
  const apedsp::SpectrumSnapshot s = _engine->spectrumSnapshot();
  return @{
    @"sequence" : @(s.sequence),
    @"fftSize" : @(s.fftSize),
    @"sampleRate" : @(s.sampleRate),
    @"bins" : @(s.binsDb.size()),
  };
}

- (NSData *)spectrumData {
  const apedsp::SpectrumSnapshot s = _engine->spectrumSnapshot();
  return [NSData dataWithBytes:s.binsDb.data() length:s.binsDb.size() * sizeof(float)];
}

- (NSData *)waveformData {
  apedsp::WaveBucket buckets[kMaxWaveBuckets];
  const size_t n = _engine->waveSnapshot(buckets, kMaxWaveBuckets);
  std::vector<float> quads;
  quads.reserve(n * 4);
  for (size_t i = 0; i < n; ++i) {
    quads.push_back(buckets[i].mn);
    quads.push_back(buckets[i].mx);
    quads.push_back(buckets[i].rms);
    quads.push_back(buckets[i].clipped ? 1.0f : 0.0f);
  }
  return [NSData dataWithBytes:quads.data() length:quads.size() * sizeof(float)];
}

// ---- RT60 guided capture ----

- (void)rt60Arm {
  _engine->rt60Arm();
}
- (void)rt60Cancel {
  _engine->rt60Cancel();
}
- (NSDictionary<NSString *, id> *)rt60Frame {
  const apedsp::Rt60State st = _engine->rt60State();
  NSMutableArray *bands = [NSMutableArray array];
  NSMutableArray<NSNumber *> *curve = [NSMutableArray array];
  double curveStep = 0.0;
  if (st == apedsp::Rt60State::Done) {
    const apedsp::Rt60Analysis res = _engine->rt60Result();
    for (const auto &b : res.bands) {
      [bands addObject:@{
        @"bandHz" : @(b.bandHz),
        @"edtSec" : @(b.edtSec),
        @"t20Rt60Sec" : @(b.t20Rt60Sec),
        @"t30Rt60Sec" : @(b.t30Rt60Sec),
        @"r2" : @(b.r2),
        @"t20R2" : @(b.t20R2),
        @"t30R2" : @(b.t30R2),
        @"decayRangeDb" : @(b.decayRangeDb),
        @"valid" : @(b.valid),
      }];
    }
    for (float v : res.curveDb) [curve addObject:@(v)];
    curveStep = res.curveStepSec;
  }
  return @{
    @"state" : @(static_cast<int>(st)),
    @"bands" : bands,
    @"curveDb" : curve,
    @"curveStepSec" : @(curveStep),
  };
}

// ---- Generator ----

- (void)genSetMode:(int)mode {
  _gen->setMode(static_cast<apedsp::GenMode>(mode));
}
- (void)genSetFrequency:(double)hz {
  _gen->setFrequency(hz);
}
- (void)genSetLevelDb:(double)db {
  _gen->setLevelDb(db);
}
- (void)genSetSweepStart:(double)startHz end:(double)endHz seconds:(double)seconds repeat:(BOOL)repeat {
  _gen->setSweep(startHz, endHz, seconds, repeat);
}
- (void)genSetClickBpm:(double)bpm {
  _gen->setClickBpm(bpm);
}
// Route-aware speaker-safety high-pass cutoff (Hz); 0 = bypass. The Swift route
// layer sets this from the current OUTPUT route (speaker → 150, else 0).
- (void)genSetHpf:(double)hz {
  _gen->setHpf(hz);
}
// ADDITIVE (HV-2): flat [f0, a1..a12, p1..p12] — 25 doubles (Hz, 0..1, degrees).
// Copy out of the NSArray and forward; the core NaN-proofs/clamps and ignores
// short arrays (count < 25). NOTE: genSetFrequency does NOT retune the additive
// f0 — JS resends the full additive array to retune (phase-continuous in core).
- (void)genSetAdditive:(NSArray<NSNumber *> *)values {
  std::vector<double> v;
  v.reserve(values.count);
  for (NSNumber *n in values) v.push_back(n.doubleValue);
  _gen->setAdditive(v.data(), static_cast<uint32_t>(v.size()));
}
- (void)genUnlockCap {
  _gen->unlockCap();
}
- (void)genRelockCap {
  _gen->relockCap();
}
- (void)genStart {
  _gen->start();
}
- (void)genStop {
  _gen->stop();
}
- (NSDictionary<NSString *, id> *)genStatus {
  return @{
    @"running" : @(_gen->running()),
    @"capUnlocked" : @(_gen->capUnlocked()),
    @"effectiveLevelDb" : @(_gen->effectiveLevelDb()),
    @"defaultLevelDb" : @(apedsp::genlevel::kDefaultDb),
    @"capDb" : @(apedsp::genlevel::kCapDb),
    // HV-2: additive normalization gain (1 = not attenuating; <1 = the
    // 1/max(1, Σaₙ) peak bound is pulling levels down) — honest UI display.
    @"additiveNorm" : @(_gen->additiveNorm()),
    // v4: route-aware speaker-safety HPF state (0 Hz = bypassed) — honest display.
    @"genHpfHz" : @(_gen->hpfHz()),
    @"genHpfEngaged" : @(_gen->hpfEngaged()),
  };
}
- (void)genRender:(float *)buffer frames:(uint32_t)frames {
  _gen->render(buffer, frames);
}

@end
