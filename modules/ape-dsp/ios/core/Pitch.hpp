// ape-dsp — YIN pitch detection with confidence (engine build 2026-07-23,
// spec Tool 7: autocorrelation/YIN for monophonic signals + confidence
// estimation + harmonic rejection via the YIN cumulative-mean rule).
// Pure C++17, header-only. Window ~50 ms; f range ~[fs/maxLag .. fs/minLag].
//
// TUNER PHASE 2 (2026-10-24): the difference function d(tau) is computed
// through the FFT — d(tau) = E0 + E(tau) − 2·r(tau), with r the windowed
// cross-correlation — O(N log N) instead of O(window × maxLag). That is what
// lets the engine run pitch every ~15 ms (and a longer low-note window) for
// about the CPU the 50 ms direct version used. `estimateDirect` keeps the
// original arithmetic as the golden reference.
#pragma once

#include <cmath>
#include <cstddef>
#include <vector>

#include "Fft.hpp"

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
  PitchDetector(size_t window, size_t maxLag)
      : w_(window), maxLag_(maxLag), d_(maxLag + 1), cmnd_(maxLag + 1), prefix_(window + maxLag + 1),
        fft_(pow2AtLeast(window + maxLag)), aRe_(fft_.size()), aIm_(fft_.size()) {}

  // samples must hold at least window + maxLag values.
  PitchEstimate estimate(const float* samples, double fs) {
    differenceFft(samples);
    return fromDifference(fs);
  }

  // The original O(window × maxLag) difference function — golden reference.
  PitchEstimate estimateDirect(const float* samples, double fs) {
    for (size_t tau = 1; tau <= maxLag_; ++tau) {
      double sum = 0.0;
      for (size_t i = 0; i < w_; ++i) {
        const double diff = static_cast<double>(samples[i]) - static_cast<double>(samples[i + tau]);
        sum += diff * diff;
      }
      d_[tau] = sum;
    }
    return fromDifference(fs);
  }

  size_t window() const { return w_; }
  size_t maxLag() const { return maxLag_; }
  size_t needed() const { return w_ + maxLag_; }

 private:
  static size_t pow2AtLeast(size_t n) {
    size_t p = 2;
    while (p < n) p <<= 1;
    return p;
  }

  // d(tau) for tau = 1..maxLag through the FFT:
  //   d(tau) = Σ_{j<W} x_j² + Σ_{j<W} x_{j+tau}² − 2·Σ_{j<W} x_j·x_{j+tau}
  void differenceFft(const float* x) {
    const size_t n = fft_.size();
    const size_t total = w_ + maxLag_;
    // Energy prefix sums for the sliding term.
    prefix_[0] = 0.0;
    for (size_t j = 0; j < total; ++j) prefix_[j + 1] = prefix_[j] + static_cast<double>(x[j]) * x[j];
    const double e0 = prefix_[w_];
    // A = FFT(x[0..W) zero-padded), kept.
    double* re = fft_.re();
    double* im = fft_.im();
    for (size_t i = 0; i < n; ++i) {
      re[i] = i < w_ ? static_cast<double>(x[i]) : 0.0;
      im[i] = 0.0;
    }
    fft_.transform();
    for (size_t i = 0; i < n; ++i) {
      aRe_[i] = re[i];
      aIm_[i] = im[i];
    }
    // B = FFT(x[0..W+L) zero-padded).
    for (size_t i = 0; i < n; ++i) {
      re[i] = i < total ? static_cast<double>(x[i]) : 0.0;
      im[i] = 0.0;
    }
    fft_.transform();
    // r = IFFT(conj(A)·B) via ifft(X) = conj(fft(conj(X)))/n: load conj(conj(A)·B).
    for (size_t i = 0; i < n; ++i) {
      const double br = re[i], bi = im[i];
      const double pr = aRe_[i] * br + aIm_[i] * bi;  // Re(conj(A)·B)
      const double pi = aRe_[i] * bi - aIm_[i] * br;  // Im(conj(A)·B)
      re[i] = pr;
      im[i] = -pi;
    }
    fft_.transform();
    const double inv = 1.0 / static_cast<double>(n);
    for (size_t tau = 1; tau <= maxLag_; ++tau) {
      const double r = re[tau] * inv;  // the real part survives the final conj
      const double et = prefix_[tau + w_] - prefix_[tau];
      const double d = e0 + et - 2.0 * r;
      d_[tau] = d > 0.0 ? d : 0.0;  // rounding can dip a true zero below 0
    }
  }

  // Steps 2–4 of YIN on d_.
  PitchEstimate fromDifference(double fs) {
    PitchEstimate out;
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

  static constexpr double kThreshold = 0.15;
  size_t w_, maxLag_;
  std::vector<double> d_, cmnd_, prefix_;
  Fft fft_;
  std::vector<double> aRe_, aIm_;
};

}  // namespace apedsp
