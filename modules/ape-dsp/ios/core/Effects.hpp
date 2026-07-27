// ape-dsp — effects-processing path (Pillar B audio-effect labs + the Signal
// Chain Builder). A source (the generator today; audio stems / live mic later)
// is fed through an ordered chain of effect NODES to the output; each node
// processes stereo in place, has atomic params (bridge writes, RT reads), and a
// bypass. A single-effect lab enables just its node; the Signal Chain Builder
// enables several. Pure C++17, header-only — shared iOS/Android, golden-tested.
//
// Bridge surface: ONE scalar setter — EffectChain::set(effectId, paramId, v) —
// so the whole roster rides one JNI/ObjC method. Param 0 of every effect is
// enabled (0/1). Dynamics publish live gain-reduction (grStatus) so the lab UIs
// can show a REAL GR meter (honest-metrics: measured, not simulated).
//
// RT rules: no allocation in process paths (buffers sized in configure());
// params are atomics; coefficient redesigns happen on the render thread via
// dirty flags. Numerical rules per tech spec §3.1 (float32 path, double math).
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>
#include <vector>

#include "Biquad.hpp"

namespace apedsp {

namespace fx {
// Effect IDs (chain order is fixed & canonical — spec §8; IDs are stable API).
enum Id : int {
  Eq = 0,
  Comp = 1,
  Gate = 2,
  Dist = 3,
  Mod = 4,     // chorus / flanger / phaser (mode param)
  Delay = 5,
  Reverb = 6,
  Stereo = 7,  // stereo imaging + phase lab
  Limiter = 8,
};
constexpr double kPi = 3.14159265358979323846;
// One-pole smoothing coefficient for a time constant in ms.
inline double onePole(double ms, double fs) {
  return 1.0 - std::exp(-1.0 / (0.001 * (ms < 0.01 ? 0.01 : ms) * fs));
}
inline double clampd(double v, double lo, double hi) {
  return !(v >= lo) ? lo : (v > hi ? hi : v);  // NaN → lo
}
}  // namespace fx

// ───────────────────────────────────────────────────────────── EQ (Lab 1) ──
// Parametric EQ: a small bank of RBJ bands over stereo. Coefficients are
// (re)designed on the RENDER thread only when a param changed (dirty flag), so
// the bridge can push updates at UI rate. Per-channel biquad state.
class EqEffect {
 public:
  static constexpr int kMaxBands = 6;
  enum BandType { Off = 0, Peak = 1, LowShelf = 2, HighShelf = 3, LowPass = 4, HighPass = 5 };

  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    dirty_.store(true, std::memory_order_relaxed);
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }

  void setBand(int i, int type, double freq, double q, double gainDb) {
    if (i < 0 || i >= kMaxBands) return;
    bands_[i].type.store(type, std::memory_order_relaxed);
    bands_[i].freq.store(fx::clampd(freq, 1.0, 20000.0), std::memory_order_relaxed);
    bands_[i].q.store(fx::clampd(q, 0.05, 36.0), std::memory_order_relaxed);
    bands_[i].gainDb.store(fx::clampd(gainDb, -36.0, 36.0), std::memory_order_relaxed);
    dirty_.store(true, std::memory_order_relaxed);
  }
  // Scalar param routing: 100 + band*10 + {0 type, 1 freq, 2 q, 3 gain}.
  void setParam(int paramId, double v) {
    if (paramId == 0) { setEnabled(v > 0.5); return; }
    if (paramId < 100) return;
    const int band = (paramId - 100) / 10, field = (paramId - 100) % 10;
    if (band < 0 || band >= kMaxBands) return;
    BandParam& b = bands_[band];
    switch (field) {
      case 0: b.type.store((int)v, std::memory_order_relaxed); break;
      case 1: b.freq.store(fx::clampd(v, 1.0, 20000.0), std::memory_order_relaxed); break;
      case 2: b.q.store(fx::clampd(v, 0.05, 36.0), std::memory_order_relaxed); break;
      case 3: b.gainDb.store(fx::clampd(v, -36.0, 36.0), std::memory_order_relaxed); break;
      default: return;
    }
    dirty_.store(true, std::memory_order_relaxed);
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    if (dirty_.exchange(false, std::memory_order_relaxed)) redesign();
    for (uint32_t i = 0; i < n; ++i) {
      double l = L[i], r = R[i];
      for (int b = 0; b < activeCount_; ++b) {
        l = static_cast<double>(secL_[b].process(static_cast<float>(l)));
        r = static_cast<double>(secR_[b].process(static_cast<float>(r)));
      }
      L[i] = static_cast<float>(l);
      R[i] = static_cast<float>(r);
    }
  }

 private:
  struct BandParam {
    std::atomic<int> type{Off};
    std::atomic<double> freq{1000.0};
    std::atomic<double> q{1.0};
    std::atomic<double> gainDb{0.0};
  };
  void redesign() {
    activeCount_ = 0;
    for (int i = 0; i < kMaxBands && activeCount_ < kMaxBands; ++i) {
      const int t = bands_[i].type.load(std::memory_order_relaxed);
      if (t == Off) continue;
      const double f = bands_[i].freq.load(std::memory_order_relaxed);
      const double q = bands_[i].q.load(std::memory_order_relaxed);
      const double g = bands_[i].gainDb.load(std::memory_order_relaxed);
      Biquad bq;
      switch (t) {
        case Peak: bq = Biquad::peaking(f, q, g, fs_); break;
        case LowShelf: bq = Biquad::lowShelf(f, q, g, fs_); break;
        case HighShelf: bq = Biquad::highShelf(f, q, g, fs_); break;
        case LowPass: bq = Biquad::lowpass(f, q, fs_); break;
        case HighPass: bq = Biquad::highpass(f, fs_); break;
        default: continue;
      }
      secL_[activeCount_] = bq;
      secR_[activeCount_] = bq;
      ++activeCount_;
    }
  }
  std::atomic<bool> enabled_{false};
  std::atomic<bool> dirty_{true};
  double fs_ = 48000.0;
  BandParam bands_[kMaxBands];
  Biquad secL_[kMaxBands];
  Biquad secR_[kMaxBands];
  int activeCount_ = 0;
};

// ──────────────────────────────────────────────────────── Delay (Lab 2) ──
// Stereo delay: fractional-interpolated read, glided delay time (a time change
// pitch-bends tape-style instead of clicking), feedback with one-pole HF
// damping in the loop (repeats recede), optional ping-pong (cross-feedback).
// Params: 1 timeMs · 2 feedback · 3 mix · 4 pingpong · 5 dampHz.
class DelayEffect {
 public:
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    const size_t cap = static_cast<size_t>(fs_ * 2.2);  // 2 s max + headroom
    bufL_.assign(cap, 0.0f);
    bufR_.assign(cap, 0.0f);
    w_ = 0;
    curDelay_ = timeMs_.load() * 0.001 * fs_;
    lpL_ = lpR_ = 0.0;
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: timeMs_.store(fx::clampd(v, 1.0, 2000.0)); break;
      case 2: feedback_.store(fx::clampd(v, 0.0, 0.95)); break;
      case 3: mix_.store(fx::clampd(v, 0.0, 1.0)); break;
      case 4: pingpong_.store(v > 0.5); break;
      case 5: dampHz_.store(fx::clampd(v, 200.0, 20000.0)); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    const double target = timeMs_.load() * 0.001 * fs_;
    const double fb = feedback_.load();
    const double mix = mix_.load();
    const bool pp = pingpong_.load();
    const double dampC = fx::onePole(1000.0 / dampHz_.load() * 1.0, fs_ * 0.001) > 0
                             ? 1.0 - std::exp(-2.0 * fx::kPi * dampHz_.load() / fs_)
                             : 1.0;
    const size_t cap = bufL_.size();
    for (uint32_t i = 0; i < n; ++i) {
      // Exponential glide toward the target delay (~50 ms time constant).
      curDelay_ += (target - curDelay_) * 0.0004;
      const double rp = static_cast<double>(w_) - curDelay_;
      const double rpw = rp < 0.0 ? rp + static_cast<double>(cap) : rp;
      const size_t i0 = static_cast<size_t>(rpw) % cap;
      const size_t i1 = (i0 + 1) % cap;
      const double frac = rpw - std::floor(rpw);
      const double dl = (1.0 - frac) * bufL_[i0] + frac * bufL_[i1];
      const double dr = (1.0 - frac) * bufR_[i0] + frac * bufR_[i1];
      // HF damping inside the loop (one-pole LP on the fed-back signal).
      lpL_ += dampC * (dl - lpL_);
      lpR_ += dampC * (dr - lpR_);
      const double inL = L[i], inR = R[i];
      // Ping-pong: each side's repeat feeds the OTHER side's line.
      bufL_[w_] = static_cast<float>(inL + (pp ? lpR_ : lpL_) * fb);
      bufR_[w_] = static_cast<float>(inR + (pp ? lpL_ : lpR_) * fb);
      w_ = (w_ + 1) % cap;
      L[i] = static_cast<float>(inL * (1.0 - mix) + dl * mix);
      R[i] = static_cast<float>(inR * (1.0 - mix) + dr * mix);
    }
  }

 private:
  std::atomic<bool> enabled_{false};
  std::atomic<double> timeMs_{375.0}, feedback_{0.35}, mix_{0.35}, dampHz_{6000.0};
  std::atomic<bool> pingpong_{false};
  double fs_ = 48000.0;
  std::vector<float> bufL_, bufR_;
  size_t w_ = 0;
  double curDelay_ = 0.0, lpL_ = 0.0, lpR_ = 0.0;
};

// ─────────────────────────────── Chorus / Flanger / Phaser (Labs 4/5/6) ──
// One node, three modes (they share the machinery — the labs configure it):
//  Chorus  — longer modulated delay (~15–35 ms), detuned voice + dry.
//  Flanger — short modulated delay (0.1–10 ms) + feedback → sweeping comb.
//  Phaser  — cascade of first-order all-passes (2..8 stages), swept corner →
//            few, unevenly spaced notches (the defining contrast).
// Params: 1 mode · 2 rateHz · 3 depth · 4 feedback · 5 mix · 6 centerMs ·
//         7 centerHz · 8 stages.
class ModEffect {
 public:
  enum Mode { Chorus = 0, Flanger = 1, Phaser = 2 };
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    buf_.assign(static_cast<size_t>(fs_ * 0.06) + 8, 0.0f);  // ≤ 50 ms lines
    bufR_.assign(buf_.size(), 0.0f);
    w_ = 0;
    lfo_ = 0.0;
    fbL_ = fbR_ = 0.0;
    for (int c = 0; c < 2; ++c)
      for (int s = 0; s < kMaxStages; ++s) apX_[c][s] = apY_[c][s] = 0.0;
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: mode_.store((int)fx::clampd(v, 0, 2)); break;
      case 2: rateHz_.store(fx::clampd(v, 0.01, 10.0)); break;
      case 3: depth_.store(fx::clampd(v, 0.0, 1.0)); break;
      case 4: feedback_.store(fx::clampd(v, -0.95, 0.95)); break;
      case 5: mix_.store(fx::clampd(v, 0.0, 1.0)); break;
      case 6: centerMs_.store(fx::clampd(v, 0.1, 40.0)); break;
      case 7: centerHz_.store(fx::clampd(v, 100.0, 8000.0)); break;
      case 8: stages_.store((int)fx::clampd(v, 2, kMaxStages)); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    const int mode = mode_.load();
    const double rate = rateHz_.load(), depth = depth_.load();
    const double fb = feedback_.load(), mix = mix_.load();
    const size_t cap = buf_.size();
    if (mode == Phaser) {
      const int stages = stages_.load();
      const double c0 = centerHz_.load();
      for (uint32_t i = 0; i < n; ++i) {
        lfo_ += rate / fs_;
        if (lfo_ >= 1.0) lfo_ -= 1.0;
        const double sweep = std::sin(2.0 * fx::kPi * lfo_);
        // Corner sweeps ±2 octaves around center, scaled by depth.
        const double fc = fx::clampd(c0 * std::pow(2.0, 2.0 * depth * sweep), 40.0, fs_ * 0.45);
        const double t = std::tan(fx::kPi * fc / fs_);
        // First-order all-pass with −90° at fc: a = (t−1)/(t+1) (sign matters —
        // the +form pushes the phase transition to Nyquist and kills the notches;
        // caught by the golden "a deep notch exists").
        const double a = (t - 1.0) / (t + 1.0);
        double xl = L[i] + fbL_ * fb, xr = R[i] + fbR_ * fb;
        for (int s = 0; s < stages; ++s) {
          // First-order all-pass: y = a·x + x[n-1] − a·y[n-1].
          const double yl = a * xl + apX_[0][s] - a * apY_[0][s];
          apX_[0][s] = xl; apY_[0][s] = yl; xl = yl;
          const double yr = a * xr + apX_[1][s] - a * apY_[1][s];
          apX_[1][s] = xr; apY_[1][s] = yr; xr = yr;
        }
        fbL_ = xl; fbR_ = xr;
        L[i] = static_cast<float>(L[i] * (1.0 - mix) + xl * mix);
        R[i] = static_cast<float>(R[i] * (1.0 - mix) + xr * mix);
      }
      return;
    }
    // Chorus / Flanger: modulated fractional delay (+ feedback for flanger).
    const double baseMs = centerMs_.load();
    const double sweepMs = (mode == Flanger) ? baseMs * 0.85 : 6.0;  // chorus ±6 ms
    for (uint32_t i = 0; i < n; ++i) {
      lfo_ += rate / fs_;
      if (lfo_ >= 1.0) lfo_ -= 1.0;
      const double sL = std::sin(2.0 * fx::kPi * lfo_);
      const double sR = std::sin(2.0 * fx::kPi * (lfo_ + 0.25));  // 90° stereo offset
      const double dMsL = fx::clampd(baseMs + depth * sweepMs * sL, 0.05, 50.0);
      const double dMsR = fx::clampd(baseMs + depth * sweepMs * sR, 0.05, 50.0);
      const double dL = dMsL * 0.001 * fs_, dR = dMsR * 0.001 * fs_;
      auto read = [&](std::vector<float>& b, double d) {
        double rp = static_cast<double>(w_) - d;
        if (rp < 0.0) rp += static_cast<double>(cap);
        const size_t i0 = static_cast<size_t>(rp) % cap;
        const size_t i1 = (i0 + 1) % cap;
        const double frac = rp - std::floor(rp);
        return (1.0 - frac) * b[i0] + frac * b[i1];
      };
      const double wetL = read(buf_, dL), wetR = read(bufR_, dR);
      buf_[w_] = static_cast<float>(L[i] + wetL * fb);
      bufR_[w_] = static_cast<float>(R[i] + wetR * fb);
      w_ = (w_ + 1) % cap;
      L[i] = static_cast<float>(L[i] * (1.0 - mix) + wetL * mix);
      R[i] = static_cast<float>(R[i] * (1.0 - mix) + wetR * mix);
    }
  }

 private:
  static constexpr int kMaxStages = 8;
  std::atomic<bool> enabled_{false};
  std::atomic<int> mode_{Chorus}, stages_{4};
  std::atomic<double> rateHz_{0.25}, depth_{0.5}, feedback_{0.0}, mix_{0.5};
  std::atomic<double> centerMs_{20.0}, centerHz_{1000.0};
  double fs_ = 48000.0;
  std::vector<float> buf_, bufR_;
  size_t w_ = 0;
  double lfo_ = 0.0, fbL_ = 0.0, fbR_ = 0.0;
  double apX_[2][kMaxStages] = {}, apY_[2][kMaxStages] = {};
};

// ─────────────────────────── Compressor / Gate / Limiter (Labs 7/8/9) ──
// One class, three modes; the chain holds THREE instances (comp, gate, limiter
// are separate nodes in the canonical chain). Stereo-linked peak detector with
// attack/release; per-mode gain computer. Publishes live gain-reduction (dB)
// for a REAL GR meter in the UI.
// Params: 1 thresholdDb · 2 ratio · 3 attackMs · 4 releaseMs · 5 makeupDb ·
//         6 rangeDb (gate floor) · 7 holdMs · 8 ceilingDb (limiter).
class DynamicsEffect {
 public:
  enum Mode { Compressor = 0, GateMode = 1, LimiterMode = 2 };
  explicit DynamicsEffect(Mode m = Compressor) : mode_(m) {}
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    env_ = 0.0;
    gGate_ = 1.0;
    holdLeft_ = 0;
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  /// Live gain reduction in dB (≥ 0 = amount of reduction) — honest UI meter.
  double grDb() const { return grPub_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: thresholdDb_.store(fx::clampd(v, -80.0, 0.0)); break;
      case 2: ratio_.store(fx::clampd(v, 1.0, 20.0)); break;
      case 3: attackMs_.store(fx::clampd(v, 0.05, 500.0)); break;
      case 4: releaseMs_.store(fx::clampd(v, 5.0, 2000.0)); break;
      case 5: makeupDb_.store(fx::clampd(v, 0.0, 24.0)); break;
      case 6: rangeDb_.store(fx::clampd(v, -80.0, 0.0)); break;
      case 7: holdMs_.store(fx::clampd(v, 0.0, 500.0)); break;
      // Wide ceiling range: lab sources play at −20 dBFS (Q4), so teaching
      // ceilings must reach well below that to show real gain reduction.
      case 8: ceilingDb_.store(fx::clampd(v, -60.0, 0.0)); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) {
      grPub_.store(0.0, std::memory_order_relaxed);
      return;
    }
    const double thr = thresholdDb_.load(), ratio = ratio_.load();
    const double aA = fx::onePole(mode_ == LimiterMode ? 0.1 : attackMs_.load(), fs_);
    const double aR = fx::onePole(releaseMs_.load(), fs_);
    const double makeup = std::pow(10.0, makeupDb_.load() / 20.0);
    const double range = rangeDb_.load();
    const double ceiling = ceilingDb_.load();
    const int holdSamples = static_cast<int>(holdMs_.load() * 0.001 * fs_);
    double grOut = 0.0;
    for (uint32_t i = 0; i < n; ++i) {
      const double x = std::max(std::fabs((double)L[i]), std::fabs((double)R[i]));
      // Peak detector: fast toward rises (attack), slow away (release).
      if (x > env_) env_ += aA * (x - env_);
      else env_ += aR * (x - env_);
      const double envDb = 20.0 * std::log10(env_ + 1e-9);
      double gain = 1.0;
      if (mode_ == Compressor) {
        const double over = envDb - thr;
        const double gr = over > 0.0 ? over * (1.0 - 1.0 / ratio) : 0.0;
        gain = std::pow(10.0, -gr / 20.0) * makeup;
        grOut = gr;
      } else if (mode_ == LimiterMode) {
        const double over = envDb - ceiling;
        const double gr = over > 0.0 ? over : 0.0;
        gain = std::pow(10.0, -gr / 20.0);
        grOut = gr;
      } else {  // Gate: open above threshold; hold; then close toward range.
        if (envDb > thr) {
          holdLeft_ = holdSamples;
          gGate_ += aA * (1.0 - gGate_);  // open fast (attack)
        } else if (holdLeft_ > 0) {
          --holdLeft_;  // hold: stay where we are
        } else {
          const double floorG = std::pow(10.0, range / 20.0);
          gGate_ += aR * (floorG - gGate_);  // close at release speed
        }
        gain = gGate_;
        grOut = -20.0 * std::log10(gGate_ + 1e-9);
      }
      L[i] = static_cast<float>(L[i] * gain);
      R[i] = static_cast<float>(R[i] * gain);
    }
    grPub_.store(grOut < 0.0 ? 0.0 : grOut, std::memory_order_relaxed);
  }

 private:
  const Mode mode_;
  std::atomic<bool> enabled_{false};
  std::atomic<double> thresholdDb_{-24.0}, ratio_{4.0}, attackMs_{10.0}, releaseMs_{120.0};
  std::atomic<double> makeupDb_{0.0}, rangeDb_{-40.0}, holdMs_{10.0}, ceilingDb_{-1.0};
  std::atomic<double> grPub_{0.0};
  double fs_ = 48000.0, env_ = 0.0, gGate_ = 1.0;
  int holdLeft_ = 0;
};

// ─────────────────────────────────────────────────── Distortion (Lab 10) ──
// Waveshapers: hard clip (odd), soft/tanh (odd, rounder), tube (asymmetric →
// even harmonics), bitcrush (quantization noise), decimate (sample-rate
// reduction → aliasing). 4× oversampling TOGGLE on the clippers — aliasing is
// itself a teaching target here (spec R5), so it must be audible on demand.
// DC-blocked after asymmetric shaping. Params: 1 type · 2 driveDb · 3 mix ·
// 4 oversample · 5 bits · 6 rateDiv · 7 outTrimDb.
class DistortionEffect {
 public:
  enum Type { Hard = 0, Soft = 1, Tube = 2, Bitcrush = 3, Decimate = 4 };
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    // Anti-alias LPs for the 4× oversampled path (two cascaded 2nd-order at
    // 0.45·fs of the BASE rate, designed at the 4× rate).
    for (int c = 0; c < 2; ++c) {
      up1_[c] = Biquad::lowpass(fs_ * 0.45, 0.707, fs_ * 4.0);
      up2_[c] = Biquad::lowpass(fs_ * 0.45, 0.707, fs_ * 4.0);
    }
    dcL_ = dcR_ = dcXL_ = dcXR_ = 0.0;
    holdL_ = holdR_ = 0.0;
    holdCount_ = 0;
    prevL_ = prevR_ = 0.0;
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: type_.store((int)fx::clampd(v, 0, 4)); break;
      case 2: driveDb_.store(fx::clampd(v, 0.0, 36.0)); break;
      case 3: mix_.store(fx::clampd(v, 0.0, 1.0)); break;
      case 4: oversample_.store(v > 0.5); break;
      case 5: bits_.store(fx::clampd(v, 3.0, 16.0)); break;
      case 6: rateDiv_.store((int)fx::clampd(v, 1, 32)); break;
      case 7: outTrimDb_.store(fx::clampd(v, -24.0, 6.0)); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    const int type = type_.load();
    const double drive = std::pow(10.0, driveDb_.load() / 20.0);
    const double mix = mix_.load();
    const double trim = std::pow(10.0, outTrimDb_.load() / 20.0);
    const bool os = oversample_.load() && type <= Tube;
    const double bits = bits_.load();
    const int rateDiv = rateDiv_.load();
    const double qStep = std::pow(2.0, -(bits - 1.0));  // bitcrush step
    for (uint32_t i = 0; i < n; ++i) {
      const double inL = L[i], inR = R[i];
      double yl, yr;
      if (type == Bitcrush) {
        yl = qStep * std::floor(inL * drive / qStep + 0.5);
        yr = qStep * std::floor(inR * drive / qStep + 0.5);
      } else if (type == Decimate) {
        if (holdCount_ == 0) { holdL_ = inL * drive; holdR_ = inR * drive; }
        holdCount_ = (holdCount_ + 1) % rateDiv;
        yl = holdL_; yr = holdR_;
      } else if (os) {
        // 4× oversample: linear-interp upsample → shape → LP ×2 → decimate.
        yl = shapeOversampled(0, prevL_, inL, drive, type);
        yr = shapeOversampled(1, prevR_, inR, drive, type);
      } else {
        yl = shape(inL * drive, type);
        yr = shape(inR * drive, type);
      }
      prevL_ = inL; prevR_ = inR;
      // DC block (one-pole HP ~10 Hz) — asymmetric shaping builds offset.
      const double R1 = 1.0 - 2.0 * fx::kPi * 10.0 / fs_;
      const double hl = yl - dcXL_ + R1 * dcL_;
      dcXL_ = yl; dcL_ = hl;
      const double hr = yr - dcXR_ + R1 * dcR_;
      dcXR_ = yr; dcR_ = hr;
      L[i] = static_cast<float>((inL * (1.0 - mix) + hl * mix) * trim);
      R[i] = static_cast<float>((inR * (1.0 - mix) + hr * mix) * trim);
    }
  }

 private:
  static double shape(double x, int type) {
    switch (type) {
      case Hard: return x > 1.0 ? 1.0 : (x < -1.0 ? -1.0 : x);
      case Soft: return std::tanh(x);
      // Tube: bias-based asymmetry (classic model) — tanh(x + b) − tanh(b).
      // Zero at rest, strongly asymmetric under drive → solid EVEN harmonics
      // (the teaching contrast with the symmetric clip's odd-only series).
      case Tube: return std::tanh(x + 0.4) - 0.37994896225522488;  // tanh(0.4)
      default: return x;
    }
  }
  double shapeOversampled(int ch, double x0, double x1, double drive, int type) {
    double out = 0.0;
    for (int k = 1; k <= 4; ++k) {
      const double t = static_cast<double>(k) / 4.0;
      const double xi = (x0 + (x1 - x0) * t) * drive;
      double s = shape(xi, type);
      s = static_cast<double>(up1_[ch].process(static_cast<float>(s)));
      s = static_cast<double>(up2_[ch].process(static_cast<float>(s)));
      out = s;  // take the last (filtered) sub-sample = decimation
    }
    return out;
  }
  std::atomic<bool> enabled_{false}, oversample_{true};
  std::atomic<int> type_{Soft}, rateDiv_{8};
  std::atomic<double> driveDb_{12.0}, mix_{1.0}, bits_{8.0}, outTrimDb_{0.0};
  double fs_ = 48000.0;
  Biquad up1_[2], up2_[2];
  double dcL_ = 0.0, dcR_ = 0.0, dcXL_ = 0.0, dcXR_ = 0.0;
  double holdL_ = 0.0, holdR_ = 0.0, prevL_ = 0.0, prevR_ = 0.0;
  int holdCount_ = 0;
};

// ─────────────────────────────────────────────────────── Reverb (Lab 3) ──
// 4-line FDN with a Householder feedback matrix, per-line one-pole HF damping,
// decay gains derived from the RT60 target (gᵢ = 10^(−3·Dᵢ/(fs·RT60)) — the
// teaching formula), pre-delay, and decorrelated ± output taps.
// Params: 1 rt60 · 2 preDelayMs · 3 dampHz · 4 mix · 5 size.
class ReverbEffect {
 public:
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    const double scale = fs_ / 48000.0;
    for (int i = 0; i < 4; ++i) {
      len_[i] = static_cast<size_t>(kBase[i] * scale * size_.load());
      if (len_[i] < 64) len_[i] = 64;
      line_[i].assign(len_[i] + 4, 0.0f);
      idx_[i] = 0;
      lp_[i] = 0.0;
    }
    pre_.assign(static_cast<size_t>(fs_ * 0.12) + 8, 0.0f);
    preIdx_ = 0;
    sizeUsed_ = size_.load();
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: rt60_.store(fx::clampd(v, 0.2, 10.0)); break;
      case 2: preDelayMs_.store(fx::clampd(v, 0.0, 100.0)); break;
      case 3: dampHz_.store(fx::clampd(v, 500.0, 20000.0)); break;
      case 4: mix_.store(fx::clampd(v, 0.0, 1.0)); break;
      case 5: size_.store(fx::clampd(v, 0.5, 1.5)); sizeDirty_.store(true); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    // Size changes re-derive line lengths (render thread; brief zipper is
    // acceptable for the lab — a full crossfaded resize is a later pass).
    if (sizeDirty_.exchange(false, std::memory_order_relaxed)) reconfigureLines();
    const double rt60 = rt60_.load();
    const double mix = mix_.load();
    const double dampC = 1.0 - std::exp(-2.0 * fx::kPi * dampHz_.load() / fs_);
    const size_t preLen = pre_.size();
    const size_t preD = static_cast<size_t>(preDelayMs_.load() * 0.001 * fs_);
    double g[4];
    for (int i = 0; i < 4; ++i)
      g[i] = std::pow(10.0, -3.0 * static_cast<double>(len_[i]) / (fs_ * rt60));
    for (uint32_t s = 0; s < n; ++s) {
      // Pre-delayed mono input.
      const double inMono = 0.5 * ((double)L[s] + (double)R[s]);
      pre_[preIdx_] = static_cast<float>(inMono);
      const size_t rp = (preIdx_ + preLen - (preD % preLen)) % preLen;
      const double x = pre_[rp];
      preIdx_ = (preIdx_ + 1) % preLen;
      // Read the four delay lines.
      double d[4];
      for (int i = 0; i < 4; ++i) d[i] = line_[i][idx_[i]];
      // Householder feedback: y_i = d_i − ½·Σd.
      const double sum = d[0] + d[1] + d[2] + d[3];
      for (int i = 0; i < 4; ++i) {
        double v = (d[i] - 0.5 * sum) * g[i];
        lp_[i] += dampC * (v - lp_[i]);  // in-loop HF damping
        line_[i][idx_[i]] = static_cast<float>(lp_[i] + x * 0.25);
        idx_[i] = (idx_[i] + 1) % len_[i];
      }
      const double outL = d[0] - d[1] + d[2] - d[3];
      const double outR = d[0] + d[1] - d[2] - d[3];
      L[s] = static_cast<float>((double)L[s] * (1.0 - mix) + outL * mix);
      R[s] = static_cast<float>((double)R[s] * (1.0 - mix) + outR * mix);
    }
  }

 private:
  void reconfigureLines() {
    const double scale = fs_ / 48000.0;
    for (int i = 0; i < 4; ++i) {
      size_t nl = static_cast<size_t>(kBase[i] * scale * size_.load());
      if (nl < 64) nl = 64;
      if (nl + 4 > line_[i].size()) line_[i].assign(nl + 4, 0.0f);
      len_[i] = nl;
      if (idx_[i] >= len_[i]) idx_[i] = 0;
    }
  }
  static constexpr double kBase[4] = {1499.0, 1889.0, 2381.0, 2833.0};  // ~31–59 ms
  std::atomic<bool> enabled_{false};
  std::atomic<bool> sizeDirty_{false};
  std::atomic<double> rt60_{1.2}, preDelayMs_{20.0}, dampHz_{5500.0}, mix_{0.35}, size_{1.0};
  double fs_ = 48000.0, sizeUsed_ = 1.0;
  std::vector<float> line_[4], pre_;
  size_t len_[4] = {}, idx_[4] = {}, preIdx_ = 0;
  double lp_[4] = {};
};

// ─────────────────────────────────── Stereo Imaging + Phase (Labs 15/12) ──
// M/S width, pan, mono-fold, R-polarity invert, inter-channel micro-delay
// (Haas / comb teaching), bass-mono (S high-passed below the crossover).
// Params: 1 widthPct · 2 pan · 3 monoFold · 4 invertR · 5 delayRms · 6 bassMonoHz.
class StereoEffect {
 public:
  void configure(double fs) {
    fs_ = fs > 0.0 ? fs : 48000.0;
    dbuf_.assign(static_cast<size_t>(fs_ * 0.04) + 8, 0.0f);
    di_ = 0;
    sHp_ = Biquad::highpass(120.0, fs_);
    hpDesignedHz_ = 120.0;
  }
  void setEnabled(bool on) { enabled_.store(on, std::memory_order_relaxed); }
  bool enabled() const { return enabled_.load(std::memory_order_relaxed); }
  void setParam(int p, double v) {
    switch (p) {
      case 0: setEnabled(v > 0.5); break;
      case 1: widthPct_.store(fx::clampd(v, 0.0, 200.0)); break;
      case 2: pan_.store(fx::clampd(v, -1.0, 1.0)); break;
      case 3: monoFold_.store(v > 0.5); break;
      case 4: invertR_.store(v > 0.5); break;
      case 5: delayRms_.store(fx::clampd(v, 0.0, 30.0)); break;
      case 6: bassMonoHz_.store(fx::clampd(v, 0.0, 300.0)); break;
      default: break;
    }
  }

  void processStereo(float* L, float* R, uint32_t n) {
    if (!enabled_.load(std::memory_order_relaxed)) return;
    const double width = widthPct_.load() / 100.0;
    const double pan = pan_.load();
    const bool fold = monoFold_.load(), inv = invertR_.load();
    const size_t dSamp = static_cast<size_t>(delayRms_.load() * 0.001 * fs_);
    const double bassHz = bassMonoHz_.load();
    if (bassHz > 0.0 && bassHz != hpDesignedHz_) {
      sHp_ = Biquad::highpass(bassHz, fs_);
      hpDesignedHz_ = bassHz;
    }
    const size_t cap = dbuf_.size();
    // Constant-power pan of the FINAL stereo signal.
    const double panL = std::cos((pan + 1.0) * fx::kPi / 4.0);
    const double panR = std::sin((pan + 1.0) * fx::kPi / 4.0);
    for (uint32_t i = 0; i < n; ++i) {
      double l = L[i], r = R[i];
      if (inv) r = -r;
      // Inter-channel micro-delay on R (Haas widening / comb-in-mono teaching).
      if (dSamp > 0) {
        dbuf_[di_] = static_cast<float>(r);
        r = dbuf_[(di_ + cap - dSamp) % cap];
        di_ = (di_ + 1) % cap;
      }
      // M/S width (S optionally bass-monoed via high-pass).
      double m = 0.5 * (l + r), sSig = 0.5 * (l - r);
      if (bassHz > 0.0) sSig = static_cast<double>(sHp_.process(static_cast<float>(sSig)));
      sSig *= width;
      l = m + sSig;
      r = m - sSig;
      if (fold) { l = r = 0.5 * (l + r); }
      L[i] = static_cast<float>(l * panL * 1.41421356);
      R[i] = static_cast<float>(r * panR * 1.41421356);
    }
  }

 private:
  std::atomic<bool> enabled_{false}, monoFold_{false}, invertR_{false};
  std::atomic<double> widthPct_{100.0}, pan_{0.0}, delayRms_{0.0}, bassMonoHz_{0.0};
  double fs_ = 48000.0;
  std::vector<float> dbuf_;
  size_t di_ = 0;
  Biquad sHp_;
  double hpDesignedHz_ = 0.0;
};

// ───────────────────────────────────────────────────────── The chain ──
// Canonical order (spec §8): Source → EQ → Comp → Gate → Distortion →
// Modulation → Delay → Reverb → Stereo → Limiter → Output. Every node is
// bypassable; a single-effect lab enables just one; the Signal Chain Builder
// enables several. anyActive() lets the output path skip everything cheaply.
class EffectChain {
 public:
  EffectChain() : comp_(DynamicsEffect::Compressor), gate_(DynamicsEffect::GateMode),
                  limiter_(DynamicsEffect::LimiterMode) {}
  void configure(double fs) {
    eq_.configure(fs);
    comp_.configure(fs);
    gate_.configure(fs);
    dist_.configure(fs);
    mod_.configure(fs);
    delay_.configure(fs);
    reverb_.configure(fs);
    stereo_.configure(fs);
    limiter_.configure(fs);
  }
  bool anyActive() const {
    return eq_.enabled() || comp_.enabled() || gate_.enabled() || dist_.enabled() ||
           mod_.enabled() || delay_.enabled() || reverb_.enabled() || stereo_.enabled() ||
           limiter_.enabled();
  }
  void processStereo(float* L, float* R, uint32_t n) {
    if (!anyActive()) return;
    eq_.processStereo(L, R, n);
    comp_.processStereo(L, R, n);
    gate_.processStereo(L, R, n);
    dist_.processStereo(L, R, n);
    mod_.processStereo(L, R, n);
    delay_.processStereo(L, R, n);
    reverb_.processStereo(L, R, n);
    stereo_.processStereo(L, R, n);
    limiter_.processStereo(L, R, n);
  }
  /// The ONE bridge setter: route a scalar param to an effect (see fx::Id).
  void set(int effectId, int paramId, double v) {
    switch (effectId) {
      case fx::Eq: eq_.setParam(paramId, v); break;
      case fx::Comp: comp_.setParam(paramId, v); break;
      case fx::Gate: gate_.setParam(paramId, v); break;
      case fx::Dist: dist_.setParam(paramId, v); break;
      case fx::Mod: mod_.setParam(paramId, v); break;
      case fx::Delay: delay_.setParam(paramId, v); break;
      case fx::Reverb: reverb_.setParam(paramId, v); break;
      case fx::Stereo: stereo_.setParam(paramId, v); break;
      case fx::Limiter: limiter_.setParam(paramId, v); break;
      default: break;
    }
  }
  /// Disable every node (a lab's stop path — leaves no effect armed).
  void reset() {
    for (int id = fx::Eq; id <= fx::Limiter; ++id) set(id, 0, 0.0);
  }
  /// Live gain-reduction readout [compGr, gateGr, limiterGr] (dB) — honest meters.
  void grStatus(double out[3]) const {
    out[0] = comp_.grDb();
    out[1] = gate_.grDb();
    out[2] = limiter_.grDb();
  }
  EqEffect& eq() { return eq_; }

 private:
  EqEffect eq_;
  DynamicsEffect comp_, gate_, limiter_;
  DistortionEffect dist_;
  ModEffect mod_;
  DelayEffect delay_;
  ReverbEffect reverb_;
  StereoEffect stereo_;
};

}  // namespace apedsp
