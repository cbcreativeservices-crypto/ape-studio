// ape-dsp — effects-processing path (Pillar B audio-effect labs + the Signal
// Chain Builder). A source (the generator today; audio stems / live mic later)
// is fed through an ordered chain of effect NODES to the output; each node
// processes stereo in place, has atomic params (bridge writes, RT reads), and a
// bypass. A single-effect lab enables just its node; the Signal Chain Builder
// enables several. Pure C++17, header-only — shared iOS/Android, golden-tested.
//
// Node roster grows as each effect's DSP lands (Phase 3): EQ (here) → Delay →
// Chorus/Flanger/Phaser → Compressor/Gate/Limiter → Distortion → Stereo/Phase →
// Reverb. This header currently hosts EQ + the chain scaffold.
#pragma once

#include <atomic>
#include <cstdint>

#include "Biquad.hpp"

namespace apedsp {

// Parametric EQ (Lab 1): a small bank of RBJ bands over stereo. Params are
// atomic; coefficients are (re)designed on the RENDER thread only when a param
// changed (dirty flag), so the bridge can push updates at UI rate. Per-channel
// biquad state (bands cascade). Bypassed → passthrough.
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

  // Configure one band. type=Off disables it. Safe to call at UI rate.
  void setBand(int i, int type, double freq, double q, double gainDb) {
    if (i < 0 || i >= kMaxBands) return;
    bands_[i].type.store(type, std::memory_order_relaxed);
    bands_[i].freq.store(!(freq >= 1.0) ? 1.0 : freq, std::memory_order_relaxed);
    bands_[i].q.store(!(q >= 0.05) ? 0.05 : q, std::memory_order_relaxed);
    bands_[i].gainDb.store(!(gainDb > -80.0 && gainDb < 80.0) ? 0.0 : gainDb, std::memory_order_relaxed);
    dirty_.store(true, std::memory_order_relaxed);
  }

  // Process n stereo frames in place. Passthrough when disabled.
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

  // Rebuild the active section cascade from the current params (render thread).
  // NOTE: this resets section state, so a live param change can transient on a
  // large move — acceptable for the lab; coefficient smoothing is a later pass.
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
      secL_[activeCount_] = bq;  // copies coeffs; zero state
      secR_[activeCount_] = bq;
      ++activeCount_;
    }
  }

  std::atomic<bool> enabled_{false};
  std::atomic<bool> dirty_{true};
  double fs_ = 48000.0;
  BandParam bands_[kMaxBands];
  // Render-thread only:
  Biquad secL_[kMaxBands];
  Biquad secR_[kMaxBands];
  int activeCount_ = 0;
};

// The effects-processing path. A fixed roster of nodes in the canonical
// Signal-Chain order (Generator → EQ → … → Output), each bypassable. Sits
// between the generator render and the output write. More nodes are added here
// as their DSP lands.
class EffectChain {
 public:
  void configure(double fs) {
    fs_ = fs;
    eq_.configure(fs);
  }
  // Any node active? Lets the output path skip the whole chain cheaply.
  bool anyActive() const { return eq_.enabled(); }
  void processStereo(float* L, float* R, uint32_t n) {
    if (!anyActive()) return;
    eq_.processStereo(L, R, n);
    // (future) delay_/mod_/dyn_/dist_/spatial_/reverb_.processStereo(...);
  }
  EqEffect& eq() { return eq_; }

 private:
  double fs_ = 48000.0;
  EqEffect eq_;
};

}  // namespace apedsp
