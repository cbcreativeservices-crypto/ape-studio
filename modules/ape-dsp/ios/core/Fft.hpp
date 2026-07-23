// ape-dsp — iterative radix-2 FFT + Hann-windowed real power spectrum (engine
// build 2026-07-23, tech spec §5 FFT backend). Pure C++17, header-only.
// Sizes up to 16384 (Q5 ruling ceiling). Double twiddle math, float data.
#pragma once

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace apedsp {

class Fft {
 public:
  // n must be a power of two (2..16384).
  explicit Fft(size_t n) : n_(n) {
    // Bit-reversal table.
    rev_.resize(n_);
    size_t log2n = 0;
    while ((size_t{1} << log2n) < n_) ++log2n;
    for (size_t i = 0; i < n_; ++i) {
      size_t r = 0;
      for (size_t b = 0; b < log2n; ++b)
        if (i & (size_t{1} << b)) r |= size_t{1} << (log2n - 1 - b);
      rev_[i] = r;
    }
    // Twiddles per stage (precomputed, double).
    cosTab_.resize(n_ / 2);
    sinTab_.resize(n_ / 2);
    for (size_t i = 0; i < n_ / 2; ++i) {
      const double ang = -2.0 * kPi * static_cast<double>(i) / static_cast<double>(n_);
      cosTab_[i] = std::cos(ang);
      sinTab_[i] = std::sin(ang);
    }
    // Hann window + its power compensation (for band-energy sums).
    hann_.resize(n_);
    double winPow = 0.0;
    for (size_t i = 0; i < n_; ++i) {
      hann_[i] = 0.5 * (1.0 - std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n_)));
      winPow += hann_[i] * hann_[i];
    }
    winPowerNorm_ = winPow / static_cast<double>(n_);  // mean(w^2)
    re_.resize(n_);
    im_.resize(n_);
  }

  size_t size() const { return n_; }
  size_t bins() const { return n_ / 2 + 1; }

  // In-place complex FFT over the internal work buffers.
  void transform() {
    for (size_t i = 0; i < n_; ++i) {
      const size_t j = rev_[i];
      if (j > i) {
        std::swap(re_[i], re_[j]);
        std::swap(im_[i], im_[j]);
      }
    }
    for (size_t len = 2; len <= n_; len <<= 1) {
      const size_t half = len >> 1;
      const size_t step = n_ / len;
      for (size_t base = 0; base < n_; base += len) {
        for (size_t k = 0; k < half; ++k) {
          const double c = cosTab_[k * step];
          const double s = sinTab_[k * step];
          const size_t i0 = base + k;
          const size_t i1 = i0 + half;
          const double tr = re_[i1] * c - im_[i1] * s;
          const double ti = re_[i1] * s + im_[i1] * c;
          re_[i1] = re_[i0] - tr;
          im_[i1] = im_[i0] - ti;
          re_[i0] += tr;
          im_[i0] += ti;
        }
      }
    }
  }

  // Hann-windowed POWER spectrum of n real samples → out[bins()] (linear
  // power, window-compensated so a band SUM approximates true band power;
  // one-sided doubling applied to interior bins). Caller converts to dB.
  void powerSpectrum(const float* samples, double* out) {
    for (size_t i = 0; i < n_; ++i) {
      re_[i] = static_cast<double>(samples[i]) * hann_[i];
      im_[i] = 0.0;
    }
    transform();
    const double norm = 1.0 / (static_cast<double>(n_) * static_cast<double>(n_) * winPowerNorm_);
    const size_t nb = bins();
    for (size_t k = 0; k < nb; ++k) {
      double p = (re_[k] * re_[k] + im_[k] * im_[k]) * norm;
      if (k != 0 && k != n_ / 2) p *= 2.0;  // one-sided
      out[k] = p;
    }
  }

 private:
  static constexpr double kPi = 3.14159265358979323846;
  size_t n_;
  std::vector<size_t> rev_;
  std::vector<double> cosTab_, sinTab_, hann_;
  double winPowerNorm_ = 1.0;
  std::vector<double> re_, im_;
};

}  // namespace apedsp
