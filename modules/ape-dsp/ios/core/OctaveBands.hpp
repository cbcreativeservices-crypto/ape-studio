// ape-dsp — fractional-octave band analysis from the FFT power spectrum
// (engine build 2026-07-23, tech spec §5 RTA path). 1/1 and 1/3 octave, IEC
// nominal centers. Q2 RULING (honest gray-out): bands below the
// FFT-resolvable limit carry resolvable=false and must render grayed —
// NEVER fabricated. Pure C++17, header-only.
#pragma once

#include <cmath>
#include <cstddef>
#include <vector>

namespace apedsp {

struct BandDef {
  double center;  // nominal center Hz
  double lo, hi;  // edge frequencies Hz
};

struct BandFrame {
  std::vector<double> centers;
  std::vector<double> levelsDb;
  std::vector<bool> resolvable;  // Q2: false = insufficient FFT resolution
};

class OctaveBands {
 public:
  // fraction: 1 (octave) or 3 (1/3-octave).
  static std::vector<BandDef> bands(int fraction) {
    std::vector<BandDef> out;
    if (fraction == 1) {
      static const double centers[] = {31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000};
      for (double c : centers) out.push_back({c, c / kSqrt2, c * kSqrt2});
    } else {
      static const double centers[] = {25,   31.5, 40,   50,   63,   80,   100,  125,  160,  200,
                                       250,  315,  400,  500,  630,  800,  1000, 1250, 1600, 2000,
                                       2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000};
      const double k = std::pow(2.0, 1.0 / 6.0);  // half of a 1/3-octave
      for (double c : centers) out.push_back({c, c / k, c * k});
    }
    return out;
  }

  // Sum FFT power bins into band levels. spectrum has `bins` one-sided power
  // values with bin width fs/fftSize. A band is RESOLVABLE only when it spans
  // at least one full interior bin (and sits below Nyquist).
  static BandFrame analyze(const double* spectrum, size_t bins, double fs, size_t fftSize,
                           int fraction) {
    const double df = fs / static_cast<double>(fftSize);
    BandFrame f;
    for (const BandDef& b : bands(fraction)) {
      const size_t kLo = static_cast<size_t>(std::ceil(b.lo / df));
      const size_t kHi = static_cast<size_t>(std::floor(b.hi / df));
      const bool belowNyquist = b.lo < fs / 2.0;
      // Q2 honest gray-out: need ≥1 interior bin, excluding DC.
      const bool resolvable = belowNyquist && kHi >= kLo && kLo >= 1;
      double p = 0.0;
      if (resolvable) {
        const size_t kEnd = kHi < bins - 1 ? kHi : bins - 1;
        for (size_t k = kLo; k <= kEnd; ++k) p += spectrum[k];
      }
      f.centers.push_back(b.center);
      f.levelsDb.push_back(10.0 * std::log10(p + 1e-12));
      f.resolvable.push_back(resolvable);
    }
    return f;
  }

 private:
  static constexpr double kSqrt2 = 1.4142135623730951;
};

}  // namespace apedsp
