// ape-dsp — test-signal generator (engine build 2026-07-23, spec Tool 6 +
// RULING Q4: output defaults to −20 dBFS, HARD CAP −12 dBFS; levels above the
// cap require an explicit unlock that lasts for the session only. The cap is
// enforced HERE, in the native output path, in one place).
//
// RT-SAFE render: called from the audio output callback — no locks, no
// allocation; parameters are read from atomics once per render call. 10 ms
// raised-cosine fades on start/stop/mode changes prevent clicks (spec Tool 6
// dev notes). Pure C++17, header-only.
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>

namespace apedsp {

namespace genlevel {
constexpr double kDefaultDb = -20.0;  // Q4 default
constexpr double kCapDb = -12.0;      // Q4 hard cap (unlock required above)
}  // namespace genlevel

enum class GenMode : int {
  Off = 0,
  Sine = 1,
  White = 2,
  Pink = 3,
  Brown = 4,
  Blue = 5,
  Violet = 6,
  SweepLin = 7,
  SweepLog = 8,
  Impulse = 9,
  Click = 10,
  Burst = 11,
};

class Generator {
 public:
  void configure(double fs) {
    fs_.store(fs);
    // Atomic + floor of 1 (review 2026-07-23: render reads this concurrently;
    // 0 would make the fade step +inf).
    const uint32_t n = static_cast<uint32_t>(fs * 0.010);  // 10 ms
    fadeSamples_.store(n < 1 ? 1 : n, std::memory_order_relaxed);
  }

  // ---- Control surface (bridge thread; atomics only) ----
  void setMode(GenMode m) {
    mode_.store(static_cast<int>(m));
    retrigger_.store(true);
  }
  void setFrequency(double hz) { freq_.store(hz); }
  void setLevelDb(double db) { requestedDb_.store(db); }
  void setSweep(double startHz, double endHz, double seconds, bool repeat) {
    // Positive floor, NaN-proof (review 2026-07-23: log sweep with startHz≤0
    // renders NaN samples; the !(x>=1) form also rejects NaN inputs).
    sweepStart_.store(!(startHz >= 1.0) ? 1.0 : startHz);
    sweepEnd_.store(!(endHz >= 1.0) ? 1.0 : endHz);
    sweepSecs_.store(seconds <= 0.05 ? 0.05 : seconds);
    sweepRepeat_.store(repeat);
    retrigger_.store(true);
  }
  void setClickBpm(double bpm) { clickBpm_.store(bpm < 20 ? 20 : (bpm > 300 ? 300 : bpm)); }
  /// Q4 tap-through confirm — session-scoped unlock above the −12 dBFS cap.
  void unlockCap() { capUnlocked_.store(true); }
  void relockCap() { capUnlocked_.store(false); }
  void start() {
    // Retrigger FIRST so the render thread never sees running with stale
    // per-trigger state (review 2026-07-23: stop→start in Impulse mode stayed
    // silent forever; finished non-repeat sweeps restarted silent).
    retrigger_.store(true);
    running_.store(true);
  }
  void stop() { running_.store(false); }  // render fades out then silences

  bool running() const { return running_.load(); }
  bool capUnlocked() const { return capUnlocked_.load(); }
  /// The level actually applied after the Q4 cap (for honest UI display).
  double effectiveLevelDb() const {
    const double req = requestedDb_.load();
    const double cap = capUnlocked_.load() ? 0.0 : genlevel::kCapDb;
    return req > cap ? cap : req;
  }

  // ---- Render (audio thread): fill n mono samples ----
  void render(float* out, uint32_t n) {
    const double fs = fs_.load();
    const auto mode = static_cast<GenMode>(mode_.load());
    const bool wantRun = running_.load() && mode != GenMode::Off && fs > 0;
    if (retrigger_.exchange(false)) {
      sweepPhase01_ = 0.0;
      clickTimer_ = 0.0;
      burstTimer_ = 0.0;
      impulseDone_ = false;
    }
    const double amp = std::pow(10.0, effectiveLevelDb() / 20.0);
    // One atomic load per render call (review 2026-07-23).
    const double fadeStep = 1.0 / static_cast<double>(fadeSamples_.load(std::memory_order_relaxed));
    for (uint32_t i = 0; i < n; ++i) {
      // Fade envelope toward the run target (click-free start/stop, Q4-safe).
      const double target = wantRun ? 1.0 : 0.0;
      if (env_ < target)
        env_ = env_ + fadeStep > target ? target : env_ + fadeStep;
      else if (env_ > target)
        env_ = env_ - fadeStep < target ? target : env_ - fadeStep;
      if (env_ <= 0.0 && !wantRun) {
        out[i] = 0.0f;
        continue;
      }
      out[i] = static_cast<float>(amp * env_ * sample(mode, fs));
    }
  }

 private:
  // One raw sample of the selected signal at unit level.
  double sample(GenMode mode, double fs) {
    switch (mode) {
      case GenMode::Sine:
        return stepSine(freq_.load(), fs);
      case GenMode::White:
        return white();
      case GenMode::Pink:
        return pink();
      case GenMode::Brown:
        return brown();
      case GenMode::Blue:
        return blue();
      case GenMode::Violet:
        return violet();
      case GenMode::SweepLin:
      case GenMode::SweepLog: {
        const double s0 = sweepStart_.load(), s1 = sweepEnd_.load();
        const double dur = sweepSecs_.load();
        sweepPhase01_ += 1.0 / (fs * dur);
        if (sweepPhase01_ >= 1.0) {
          if (sweepRepeat_.load()) sweepPhase01_ -= 1.0;
          else {
            sweepPhase01_ = 1.0;
            return 0.0;  // finished, hold silent (env fade already applied)
          }
        }
        const double f = mode == GenMode::SweepLin
                             ? s0 + (s1 - s0) * sweepPhase01_
                             : s0 * std::pow(s1 / s0, sweepPhase01_);
        return stepSine(f, fs);
      }
      case GenMode::Impulse: {
        // Single one-sample unit impulse per trigger (timing demos).
        if (impulseDone_) return 0.0;
        impulseDone_ = true;
        return 1.0;
      }
      case GenMode::Click: {
        // Short 1 kHz ping repeating at the click BPM.
        const double interval = 60.0 / clickBpm_.load();
        clickTimer_ += 1.0 / fs;
        if (clickTimer_ >= interval) clickTimer_ -= interval;
        const double t = clickTimer_;
        if (t < 0.005) {
          const double win = 0.5 * (1.0 - std::cos(2.0 * kPi * t / 0.005));
          return win * std::sin(2.0 * kPi * 1000.0 * t);
        }
        return 0.0;
      }
      case GenMode::Burst: {
        // Tone burst: 50 ms on / 200 ms off at the set frequency.
        burstTimer_ += 1.0 / fs;
        if (burstTimer_ >= 0.25) burstTimer_ -= 0.25;
        if (burstTimer_ < 0.05) {
          const double win = 0.5 * (1.0 - std::cos(2.0 * kPi * burstTimer_ / 0.05));
          return win * stepSine(freq_.load(), fs);
        }
        stepSine(freq_.load(), fs);  // keep phase moving for continuity
        return 0.0;
      }
      case GenMode::Off:
      default:
        return 0.0;
    }
  }

  inline double stepSine(double f, double fs) {
    phase_ += f / fs;
    if (phase_ >= 1.0) phase_ -= std::floor(phase_);
    return std::sin(2.0 * kPi * phase_);
  }

  // xorshift32 white noise in [-1, 1).
  inline double white() {
    uint32_t x = rng_;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    rng_ = x;
    return (static_cast<double>(x) / 2147483648.0) - 1.0;
  }

  // Paul Kellet pink-noise filter (−3 dB/oct), ~0 dB matched level.
  inline double pink() {
    const double w = white();
    pk0_ = 0.99886 * pk0_ + w * 0.0555179;
    pk1_ = 0.99332 * pk1_ + w * 0.0750759;
    pk2_ = 0.96900 * pk2_ + w * 0.1538520;
    pk3_ = 0.86650 * pk3_ + w * 0.3104856;
    pk4_ = 0.55000 * pk4_ + w * 0.5329522;
    pk5_ = -0.7616 * pk5_ - w * 0.0168980;
    const double p = pk0_ + pk1_ + pk2_ + pk3_ + pk4_ + pk5_ + pk6_ + w * 0.5362;
    pk6_ = w * 0.115926;
    return p * 0.11;  // scale into ~[-1,1]
  }

  // Brown (red, −6 dB/oct): leaky integration of white.
  inline double brown() {
    br_ = 0.998 * br_ + 0.02 * white();
    const double v = br_ * 8.0;
    return v > 1.0 ? 1.0 : (v < -1.0 ? -1.0 : v);
  }

  // Blue (+3 dB/oct): differentiated pink; Violet (+6 dB/oct): differentiated white.
  inline double blue() {
    const double p = pink();
    const double v = (p - lastPink_) * 4.0;
    lastPink_ = p;
    return v > 1.0 ? 1.0 : (v < -1.0 ? -1.0 : v);
  }
  inline double violet() {
    const double w = white();
    const double v = (w - lastWhite_) * 0.5;
    lastWhite_ = w;
    return v;
  }

  static constexpr double kPi = 3.14159265358979323846;

  // Control atomics (bridge writes, render reads).
  std::atomic<double> fs_{48000.0};
  std::atomic<int> mode_{0};
  std::atomic<double> freq_{1000.0};
  std::atomic<double> requestedDb_{genlevel::kDefaultDb};
  std::atomic<bool> capUnlocked_{false};
  std::atomic<bool> running_{false};
  std::atomic<bool> retrigger_{false};
  std::atomic<double> sweepStart_{20.0}, sweepEnd_{20000.0}, sweepSecs_{5.0};
  std::atomic<bool> sweepRepeat_{true};
  std::atomic<double> clickBpm_{120.0};

  // Fade length (bridge writes via configure, render reads — atomic).
  std::atomic<uint32_t> fadeSamples_{480};

  // Render-thread state (audio thread only).
  double env_ = 0.0;
  double phase_ = 0.0;
  double sweepPhase01_ = 0.0;
  double clickTimer_ = 0.0;
  double burstTimer_ = 0.0;
  bool impulseDone_ = false;
  uint32_t rng_ = 0x9e3779b9;
  double pk0_ = 0, pk1_ = 0, pk2_ = 0, pk3_ = 0, pk4_ = 0, pk5_ = 0, pk6_ = 0;
  double br_ = 0, lastPink_ = 0, lastWhite_ = 0;
};

}  // namespace apedsp
