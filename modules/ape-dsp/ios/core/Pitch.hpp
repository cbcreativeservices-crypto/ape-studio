// ape-dsp — YIN pitch detection with confidence (engine build 2026-07-23,
// spec Tool 7: autocorrelation/YIN for monophonic signals + confidence
// estimation + harmonic rejection via the YIN cumulative-mean rule).
// Pure C++17, header-only. Window ~50 ms; f range ~[fs/maxLag .. fs/minLag].
#pragma once

#include <cmath>
#include <cstddef>
#include <vector>

namespace apedsp {

struct PitchEstimate {
  double freq = 0.0;        // Hz; 0 = no stable pitch
  double confidence = 0.0;  // 0..1 (1 − CMND minimum, clamped)
  bool voiced = false;      // confidence above threshold
};

class PitchDetector {
 public:
  // window: analysis size in samples (e.g. 2400 @ 48 kHz = 50 ms).
  // maxLag bounds the lowest detectable frequency (fs/maxLag).
  PitchDetector(size_t window, size_t maxLag) : w_(window), maxLag_(maxLag), d_(maxLag + 1), cmnd_(maxLag + 1) {}

  // samples must hold at least window + maxLag values.
  PitchEstimate estimate(const float* samples, double fs) {
    PitchEstimate out;
    // 1) Difference function d(tau) over the window.
    for (size_t tau = 1; tau <= maxLag_; ++tau) {
      double sum = 0.0;
      for (size_t i = 0; i < w_; ++i) {
        const double diff = static_cast<double>(samples[i]) - static_cast<double>(samples[i + tau]);
        sum += diff * diff;
      }
      d_[tau] = sum;
    }
    // 2) Cumulative mean normalized difference (harmonic rejection: CMND
    //    penalizes octave-up errors that plain autocorrelation makes).
    cmnd_[0] = 1.0;
    double running = 0.0;
    for (size_t tau = 1; tau <= maxLag_; ++tau) {
      running += d_[tau];
      cmnd_[tau] = running > 0.0 ? d_[tau] * static_cast<double>(tau) / running : 1.0;
    }
    // 3) Absolute threshold: first tau where CMND dips below kThreshold, then
    //    slide to its local minimum.
    const size_t minLag = 2;
    size_t tauEst = 0;
    for (size_t tau = minLag; tau <= maxLag_; ++tau) {
      if (cmnd_[tau] < kThreshold) {
        while (tau + 1 <= maxLag_ && cmnd_[tau + 1] < cmnd_[tau]) ++tau;
        tauEst = tau;
        break;
      }
    }
    // Fallback: global minimum (low confidence path).
    if (tauEst == 0) {
      double best = 1e9;
      for (size_t tau = minLag; tau <= maxLag_; ++tau)
        if (cmnd_[tau] < best) {
          best = cmnd_[tau];
          tauEst = tau;
        }
    }
    if (tauEst == 0) return out;
    // 4) Parabolic interpolation around tauEst on the CMND curve.
    double tauF = static_cast<double>(tauEst);
    if (tauEst > minLag && tauEst < maxLag_) {
      const double s0 = cmnd_[tauEst - 1], s1 = cmnd_[tauEst], s2 = cmnd_[tauEst + 1];
      const double denom = 2.0 * (2.0 * s1 - s0 - s2);
      if (std::fabs(denom) > 1e-12) tauF += (s2 - s0) / denom;
    }
    const double conf = 1.0 - cmnd_[tauEst];
    out.freq = fs / tauF;
    out.confidence = conf < 0.0 ? 0.0 : (conf > 1.0 ? 1.0 : conf);
    out.voiced = cmnd_[tauEst] < kThreshold;
    return out;
  }

  size_t window() const { return w_; }
  size_t maxLag() const { return maxLag_; }
  size_t needed() const { return w_ + maxLag_; }

 private:
  static constexpr double kThreshold = 0.15;
  size_t w_, maxLag_;
  std::vector<double> d_, cmnd_;
};

}  // namespace apedsp
