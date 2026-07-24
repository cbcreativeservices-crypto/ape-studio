// ape-dsp — EngineHub: the integrated measurement engine (engine build
// 2026-07-23, tech spec §5 per-tool paths). Extends the Spike-0 threading
// model unchanged:
//   RT thread      → ring write only (SpscRing; untouched)
//   analysis thread → processChunk() per drained chunk + analysisTick() per
//                     drain pass (FFT / banding / pitch on the rolling buffer)
//   bridge thread  → snapshot getters (mutex-guarded copies; never blocks RT)
//
// Paths: meter (Z/A/C weighted RMS, Fast+Slow ballistics, true peak beyond
// 0 dBFS per finding F1, peak-hold, clip runs, Leq), spectrum (Hann FFT →
// 1/1 & 1/3-octave bands with Q2 honest gray-out + averaged fine spectrum for
// the spectrogram), pitch (YIN + confidence), waveform (min/max/RMS envelope).
// Pure C++17, header-only.
#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <memory>
#include <mutex>
#include <vector>

#include <atomic>

#include "Ballistics.hpp"
#include "Biquad.hpp"
#include "Fft.hpp"
#include "OctaveBands.hpp"
#include "Pitch.hpp"
#include "Rt60.hpp"
#include "WaveEnvelope.hpp"

namespace apedsp {

struct EngineConfig {
  uint32_t fftSize = 4096;      // ≤16384 (Q5 ruling)
  int fraction = 3;             // 1 or 3 (octave / 1/3-octave)
  bool spectrumEnabled = false; // RTA / spectrogram
  bool pitchEnabled = false;    // tuner / counter sound mode
  bool waveformEnabled = false; // waveform viewer
  double bandAvgAlpha = 0.35;   // exponential averaging weight per tick (new fraction)
};

struct MeterFrame {
  uint32_t version = 2;  // engine build — v1 was the spike (rms/peak only)
  uint64_t sequence = 0;
  uint32_t settingsEpoch = 0;
  // Weighted RMS in dBFS, Fast (125 ms) and Slow (1 s) ballistics.
  float zFastDb = -120.0f, zSlowDb = -120.0f;
  float aFastDb = -120.0f, aSlowDb = -120.0f;
  float cFastDb = -120.0f, cSlowDb = -120.0f;
  float peakDb = -120.0f;      // may exceed 0 dBFS on overload (finding F1)
  float peakHoldDb = -120.0f;
  uint64_t clipRuns = 0;       // ≥3 consecutive samples at/over full scale
  // Leq since reset (energy average), Z and A weighted, + elapsed seconds.
  float leqZDb = -120.0f;
  float leqADb = -120.0f;
  double elapsedSec = 0.0;
  uint64_t droppedFrames = 0;
  bool running = false;
};

struct BandsSnapshot {
  uint64_t sequence = 0;
  int fraction = 3;
  uint32_t fftSize = 4096;
  double sampleRate = 48000.0;
  std::vector<float> centers;
  std::vector<float> levelsDb;    // averaged (bandAvgAlpha)
  std::vector<float> peakHoldDb;  // per-band peak hold
  std::vector<uint8_t> resolvable;  // Q2 honest gray-out flags
};

struct SpectrumSnapshot {
  uint64_t sequence = 0;
  uint32_t fftSize = 4096;
  double sampleRate = 48000.0;
  std::vector<float> binsDb;  // one-sided, dB power
};

struct PitchSnapshot {
  uint64_t sequence = 0;
  float freq = 0.0f;
  float confidence = 0.0f;
  bool voiced = false;
  float levelDb = -120.0f;  // Z-fast level, for low-signal gating in UI
};

/// RT60 guided-capture states (spec §13 staged rollout — engine side).
enum class Rt60State : int { Off = 0, Armed = 1, Recording = 2, Done = 3 };

class EngineHub {
 public:
  // PRECONDITION (review 2026-07-23): the analysis thread must be QUIESCED
  // (joined) before calling — the bridge (ApeDspCore) enforces this. The mu_
  // guard below covers the remaining bridge-thread snapshot readers.
  void configureSampleRate(double fs) {
    std::lock_guard<std::mutex> lock(mu_);
    fs_ = fs;
    aChain_ = weighting::designA(fs);
    cChain_ = weighting::designC(fs);
    zFast_.configure(0.125, fs);
    zSlow_.configure(1.0, fs);
    aFast_.configure(0.125, fs);
    aSlow_.configure(1.0, fs);
    cFast_.configure(0.125, fs);
    cSlow_.configure(1.0, fs);
    // Pitch: 50 ms window, 25 ms max lag → ~40 Hz floor at 48 kHz.
    pitch_ = PitchDetector(static_cast<size_t>(fs * 0.05), static_cast<size_t>(fs * 0.025));
    wave_.configure(static_cast<size_t>(fs * 0.05), 120);  // 50 ms × 120 = 6 s
    roll_.assign(kRollSize, 0.0f);
    rollHead_ = 0;
    rollFilled_ = 0;
    // RT60 capture buffer: 3.5 s at the actual rate (analysis-thread-only).
    rt60Buf_.assign(static_cast<size_t>(fs * 3.5), 0.0f);
    rt60Written_ = 0;
    rt60State_.store(static_cast<int>(Rt60State::Off));
    rt60ArmPending_.store(false);  // stale arm must not survive a reconfigure
    resetMetersLocked();  // already holding mu_ — never resetMeters() here
  }

  // ---- RT60 guided capture (bridge thread arms; analysis thread records) ----
  // Arming rides an atomic flag serviced by the ANALYSIS thread at the next
  // chunk boundary — same pattern as resetLeq() (review 2026-07-23):
  // rt60Written_/rt60Buf_ are analysis-thread-owned, and a bridge-side write
  // could race an in-flight recording (double-tap ARM within the poll lag).
  void rt60Arm() { rt60ArmPending_.store(true, std::memory_order_release); }
  void rt60Cancel() { rt60State_.store(static_cast<int>(Rt60State::Off)); }
  Rt60State rt60State() const { return static_cast<Rt60State>(rt60State_.load()); }
  Rt60Analysis rt60Result() const {
    std::lock_guard<std::mutex> lock(mu_);
    return rt60Result_;
  }

  void setConfig(const EngineConfig& cfg) {
    std::lock_guard<std::mutex> lock(mu_);
    cfg_ = cfg;
    if (cfg_.fftSize < 256) cfg_.fftSize = 256;
    if (cfg_.fftSize > 16384) cfg_.fftSize = 16384;  // Q5 ceiling
    // Fft requires a power of two — round UP (stays ≤16384 after the clamp;
    // review 2026-07-23: a non-pow2 size would index out of bounds).
    {
      uint32_t p2 = 256;
      while (p2 < cfg_.fftSize) p2 <<= 1;
      cfg_.fftSize = p2;
    }
    if (cfg_.fraction != 1) cfg_.fraction = 3;
    meter_.settingsEpoch++;
    bandAvg_.clear();       // averaging state restarts on reconfig
    bandPeakHold_.clear();
  }

  EngineConfig config() const {
    std::lock_guard<std::mutex> lock(mu_);
    return cfg_;
  }

  void reset() {
    std::lock_guard<std::mutex> lock(mu_);
    resetMetersLocked();
    meter_.settingsEpoch++;
  }

  void resetPeakHold() {
    std::lock_guard<std::mutex> lock(mu_);
    peakHoldLin_ = 0.0f;
    meter_.peakHoldDb = -120.0f;
    for (auto& v : bandPeakHold_) v = -120.0f;
  }

  // Leq reset rides an atomic flag serviced by the ANALYSIS thread at the next
  // chunk boundary (review 2026-07-23): the accumulators are analysis-thread-
  // owned; zeroing them from the bridge under mu_ would race the unlocked fold
  // loop. Latency ≤ one ~50 ms chunk — imperceptible for Leq.
  void resetLeq() { leqResetPending_.store(true, std::memory_order_release); }

  // ---- Analysis thread: fold one drained chunk ----
  void processChunk(const float* samples, size_t n, uint64_t droppedFrames, bool running) {
    EngineConfig cfg;
    {
      std::lock_guard<std::mutex> lock(mu_);
      cfg = cfg_;
    }
    // Service a pending Leq reset on the owning thread (see resetLeq()).
    if (leqResetPending_.exchange(false, std::memory_order_acq_rel)) {
      leqZSum_ = leqASum_ = 0.0;
      leqCount_ = 0;
    }
    // Service a pending RT60 arm on the owning thread (see rt60Arm()).
    if (rt60ArmPending_.exchange(false, std::memory_order_acq_rel)) {
      rt60Written_ = 0;
      rt60State_.store(static_cast<int>(Rt60State::Armed), std::memory_order_relaxed);
    }
    float maxAbs = 0.0f;
    if (samples != nullptr && n > 0) {
      for (size_t i = 0; i < n; ++i) {
        const float z = samples[i];
        const float a = aChain_.process(z);
        const float c = cChain_.process(z);
        zFast_.push(z);
        zSlow_.push(z);
        aFast_.push(a);
        aSlow_.push(a);
        cFast_.push(c);
        cSlow_.push(c);
        leqZSum_ += static_cast<double>(z) * z;
        leqASum_ += static_cast<double>(a) * a;
        const float ab = std::fabs(z);
        if (ab > maxAbs) maxAbs = ab;
        if (ab >= 0.999f) {
          if (++clipRun_ == 3) ++clipRuns_;  // count each run once
        } else {
          clipRun_ = 0;
        }
        // Rolling buffer for FFT/pitch.
        roll_[rollHead_] = z;
        rollHead_ = (rollHead_ + 1) & (kRollSize - 1);
      }
      leqCount_ += n;
      if (rollFilled_ < kRollSize) rollFilled_ = std::min(rollFilled_ + n, kRollSize);

      // RT60 capture (analysis thread owns the buffer; state is atomic).
      const auto rtState = static_cast<Rt60State>(rt60State_.load(std::memory_order_relaxed));
      if (rtState == Rt60State::Armed) {
        // Trigger: first sample above ~−35 dBFS starts the recording.
        for (size_t i = 0; i < n; ++i) {
          if (std::fabs(samples[i]) >= 0.0178f) {
            rt60Written_ = 0;
            const size_t take = std::min(n - i, rt60Buf_.size());
            for (size_t k = 0; k < take; ++k) rt60Buf_[rt60Written_++] = samples[i + k];
            rt60State_.store(static_cast<int>(Rt60State::Recording), std::memory_order_relaxed);
            break;
          }
        }
      } else if (rtState == Rt60State::Recording && rt60Written_ < rt60Buf_.size()) {
        const size_t take = std::min(n, rt60Buf_.size() - rt60Written_);
        for (size_t k = 0; k < take; ++k) rt60Buf_[rt60Written_ + k] = samples[k];
        rt60Written_ += take;
        // Buffer full → analyze on this (analysis) thread, publish under mu_.
        if (rt60Written_ >= rt60Buf_.size()) {
          Rt60Analysis res = Rt60::analyze(rt60Buf_.data(), rt60Buf_.size(), fs_);
          {
            std::lock_guard<std::mutex> lk(mu_);
            rt60Result_ = std::move(res);
          }
          rt60State_.store(static_cast<int>(Rt60State::Done), std::memory_order_relaxed);
        }
      }
    }

    std::lock_guard<std::mutex> lock(mu_);
    // Inside the lock: waveSnapshot() reads the same ring from the bridge
    // thread — pushing under mu_ makes that read race-free.
    if (samples != nullptr && n > 0 && cfg.waveformEnabled) wave_.push(samples, n);
    if (samples != nullptr && n > 0) {
      if (maxAbs > peakHoldLin_) peakHoldLin_ = maxAbs;
      meter_.zFastDb = static_cast<float>(zFast_.db());
      meter_.zSlowDb = static_cast<float>(zSlow_.db());
      meter_.aFastDb = static_cast<float>(aFast_.db());
      meter_.aSlowDb = static_cast<float>(aSlow_.db());
      meter_.cFastDb = static_cast<float>(cFast_.db());
      meter_.cSlowDb = static_cast<float>(cSlow_.db());
      meter_.peakDb = static_cast<float>(20.0 * std::log10(static_cast<double>(maxAbs) + 1e-12));
      meter_.peakHoldDb =
          static_cast<float>(20.0 * std::log10(static_cast<double>(peakHoldLin_) + 1e-12));
      meter_.clipRuns = clipRuns_;
      if (leqCount_ > 0) {
        meter_.leqZDb = static_cast<float>(10.0 * std::log10(leqZSum_ / leqCount_ + 1e-12));
        meter_.leqADb = static_cast<float>(10.0 * std::log10(leqASum_ / leqCount_ + 1e-12));
        meter_.elapsedSec = static_cast<double>(leqCount_) / fs_;
      }
      meter_.sequence++;
    }
    meter_.droppedFrames = droppedFrames;
    meter_.running = running;
  }

  // ---- Analysis thread: once per drain pass (~50 ms cadence) ----
  void analysisTick() {
    EngineConfig cfg;
    {
      std::lock_guard<std::mutex> lock(mu_);
      cfg = cfg_;
    }
    if (cfg.spectrumEnabled && rollFilled_ >= cfg.fftSize) {
      computeSpectrum(cfg);
    }
    if (cfg.pitchEnabled && rollFilled_ >= pitch_.needed()) {
      computePitch();
    }
  }

  // ---- Bridge thread: snapshots ----
  MeterFrame meterFrame() const {
    std::lock_guard<std::mutex> lock(mu_);
    return meter_;
  }
  BandsSnapshot bandsSnapshot() const {
    std::lock_guard<std::mutex> lock(mu_);
    return bands_;
  }
  SpectrumSnapshot spectrumSnapshot() const {
    std::lock_guard<std::mutex> lock(mu_);
    return spectrum_;
  }
  PitchSnapshot pitchSnapshot() const {
    std::lock_guard<std::mutex> lock(mu_);
    return pitchSnap_;
  }
  size_t waveSnapshot(WaveBucket* out, size_t maxOut) const {
    // WaveEnvelope is analysis-thread-owned; the ring is stable enough for a
    // read-mostly copy — guard with the same mutex for simplicity.
    std::lock_guard<std::mutex> lock(mu_);
    return wave_.snapshot(out, maxOut);
  }

 private:
  void resetMeters() {
    std::lock_guard<std::mutex> lock(mu_);
    resetMetersLocked();
  }
  void resetMetersLocked() {
    zFast_.reset();
    zSlow_.reset();
    aFast_.reset();
    aSlow_.reset();
    cFast_.reset();
    cSlow_.reset();
    aChain_.reset();
    cChain_.reset();
    peakHoldLin_ = 0.0f;
    clipRun_ = 0;
    clipRuns_ = 0;
    leqZSum_ = leqASum_ = 0.0;
    leqCount_ = 0;
    meter_.sequence = 0;
    meter_.zFastDb = meter_.zSlowDb = meter_.aFastDb = meter_.aSlowDb = meter_.cFastDb =
        meter_.cSlowDb = meter_.peakDb = meter_.peakHoldDb = meter_.leqZDb = meter_.leqADb =
            -120.0f;
    meter_.clipRuns = 0;
    meter_.elapsedSec = 0.0;
    wave_.reset();
    bandAvg_.clear();
    bandPeakHold_.clear();
  }

  // Copy the newest n samples from the rolling ring into dst (oldest→newest).
  void copyRecent(float* dst, size_t n) const {
    const size_t start = (rollHead_ + kRollSize - n) & (kRollSize - 1);
    for (size_t i = 0; i < n; ++i) dst[i] = roll_[(start + i) & (kRollSize - 1)];
  }

  void computeSpectrum(const EngineConfig& cfg) {
    if (!fft_ || fft_->size() != cfg.fftSize) fft_.reset(new Fft(cfg.fftSize));
    scratch_.resize(cfg.fftSize);
    power_.resize(fft_->bins());
    copyRecent(scratch_.data(), cfg.fftSize);
    fft_->powerSpectrum(scratch_.data(), power_.data());

    BandFrame bf = OctaveBands::analyze(power_.data(), fft_->bins(), fs_, cfg.fftSize, cfg.fraction);

    std::lock_guard<std::mutex> lock(mu_);
    // Exponential band averaging + per-band peak hold (RTA controls).
    if (bandAvg_.size() != bf.levelsDb.size()) {
      bandAvg_.assign(bf.levelsDb.begin(), bf.levelsDb.end());
      bandPeakHold_.assign(bf.levelsDb.size(), -120.0);
    }
    const double alpha = cfg.bandAvgAlpha <= 0.0 ? 1.0 : (cfg.bandAvgAlpha > 1.0 ? 1.0 : cfg.bandAvgAlpha);
    bands_.centers.assign(bf.centers.begin(), bf.centers.end());
    bands_.levelsDb.resize(bf.levelsDb.size());
    bands_.peakHoldDb.resize(bf.levelsDb.size());
    bands_.resolvable.resize(bf.resolvable.size());
    for (size_t i = 0; i < bf.levelsDb.size(); ++i) {
      // Average in the POWER domain so quiet flickers don't dominate.
      const double newPow = std::pow(10.0, bf.levelsDb[i] / 10.0);
      const double oldPow = std::pow(10.0, bandAvg_[i] / 10.0);
      const double avg = alpha * newPow + (1.0 - alpha) * oldPow;
      bandAvg_[i] = 10.0 * std::log10(avg + 1e-12);
      bands_.levelsDb[i] = static_cast<float>(bandAvg_[i]);
      if (bandAvg_[i] > bandPeakHold_[i]) bandPeakHold_[i] = bandAvg_[i];
      bands_.peakHoldDb[i] = static_cast<float>(bandPeakHold_[i]);
      bands_.resolvable[i] = bf.resolvable[i] ? 1 : 0;
    }
    bands_.fraction = cfg.fraction;
    bands_.fftSize = cfg.fftSize;
    bands_.sampleRate = fs_;
    bands_.sequence++;

    // Fine spectrum for the spectrogram (dB).
    spectrum_.binsDb.resize(power_.size());
    for (size_t k = 0; k < power_.size(); ++k)
      spectrum_.binsDb[k] = static_cast<float>(10.0 * std::log10(power_[k] + 1e-12));
    spectrum_.fftSize = cfg.fftSize;
    spectrum_.sampleRate = fs_;
    spectrum_.sequence++;
  }

  void computePitch() {
    pitchBuf_.resize(pitch_.needed());
    copyRecent(pitchBuf_.data(), pitch_.needed());
    const PitchEstimate est = pitch_.estimate(pitchBuf_.data(), fs_);
    std::lock_guard<std::mutex> lock(mu_);
    pitchSnap_.freq = static_cast<float>(est.freq);
    pitchSnap_.confidence = static_cast<float>(est.confidence);
    pitchSnap_.voiced = est.voiced;
    pitchSnap_.levelDb = meter_.zFastDb;
    pitchSnap_.sequence++;
  }

  static constexpr size_t kRollSize = 32768;  // power of two ≥ max FFT + pitch window

  mutable std::mutex mu_;
  EngineConfig cfg_{};
  double fs_ = 48000.0;

  // Meter path.
  BiquadCascade aChain_, cChain_;
  PowerBallistics zFast_, zSlow_, aFast_, aSlow_, cFast_, cSlow_;
  float peakHoldLin_ = 0.0f;
  int clipRun_ = 0;
  uint64_t clipRuns_ = 0;
  double leqZSum_ = 0.0, leqASum_ = 0.0;
  uint64_t leqCount_ = 0;
  MeterFrame meter_{};

  // Spectrum path.
  std::unique_ptr<Fft> fft_;
  std::vector<float> scratch_;
  std::vector<double> power_;
  std::vector<double> bandAvg_, bandPeakHold_;
  BandsSnapshot bands_{};
  SpectrumSnapshot spectrum_{};

  // Pitch path.
  PitchDetector pitch_{2400, 1200};
  std::vector<float> pitchBuf_;
  PitchSnapshot pitchSnap_{};

  // Waveform path.
  WaveEnvelope wave_;

  // Rolling analysis buffer (analysis thread only).
  std::vector<float> roll_ = std::vector<float>(kRollSize, 0.0f);
  size_t rollHead_ = 0;
  size_t rollFilled_ = 0;

  // Leq reset flag (bridge sets, analysis thread services — review 2026-07-23).
  std::atomic<bool> leqResetPending_{false};

  // RT60 guided capture (buffer analysis-thread-only; state atomic; result mu_).
  std::atomic<int> rt60State_{0};
  std::atomic<bool> rt60ArmPending_{false};
  std::vector<float> rt60Buf_;
  size_t rt60Written_ = 0;
  Rt60Analysis rt60Result_{};
};

}  // namespace apedsp
