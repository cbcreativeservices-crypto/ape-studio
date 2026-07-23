// ape-dsp — meter ballistics (engine build 2026-07-23, tech spec §5 SPL path).
// One-pole exponential averaging on POWER (the standard sound-level-meter
// model): Fast τ=125 ms, Slow τ=1000 ms. Per-sample smoothing keeps the
// response exact regardless of chunk size. Pure C++17, header-only.
#pragma once

#include <cmath>

namespace apedsp {

class PowerBallistics {
 public:
  void configure(double tauSeconds, double fs) {
    coef_ = std::exp(-1.0 / (tauSeconds * fs));
    oneMinus_ = 1.0 - coef_;
  }

  inline void push(float sample) {
    const double p = static_cast<double>(sample) * static_cast<double>(sample);
    state_ = coef_ * state_ + oneMinus_ * p;
  }

  void reset() { state_ = 0.0; }

  // Level in dB (power domain; log floor per tech spec §3.1).
  double db() const { return 10.0 * std::log10(state_ + 1e-12); }
  double power() const { return state_; }

 private:
  double coef_ = 0.0, oneMinus_ = 1.0, state_ = 0.0;
};

}  // namespace apedsp
