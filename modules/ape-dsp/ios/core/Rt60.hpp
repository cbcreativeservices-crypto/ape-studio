// ape-dsp — RT60 / reverb-decay analysis (engine build 2026-07-23, spec §13 +
// tech spec §5 RT60 path). Offline analysis of a captured decay event:
//   octave-band filter (RBJ bandpass) → Schroeder backward integration →
//   least-squares line fits (EDT 0..−10, T20 −5..−25, T30 −5..−35) → RT60
//   extrapolation, per band + broadband.
//
// INTEGRITY (the spec's whole point for this tool): every result carries the
// available decay range and fit quality (R²); a band without enough range
// above the noise floor is INVALID — never a fabricated number. Method is
// always labeled (T20 vs T30 — spec §13 "always labeled with the method").
// Pure C++17, header-only. Verified by golden vectors with synthetic decays.
#pragma once

#include <cmath>
#include <cstddef>
#include <vector>

#include "Biquad.hpp"

namespace apedsp {

struct Rt60BandResult {
  double bandHz = 0.0;      // 0 = broadband
  double edtSec = 0.0;      // early decay time (0..−10 fit ×6); 0 = unavailable
  double t20Rt60Sec = 0.0;  // RT60 extrapolated from T20 (−5..−25 ×3); 0 = unavailable
  double t30Rt60Sec = 0.0;  // RT60 extrapolated from T30 (−5..−35 ×2); 0 = unavailable
  double r2 = 0.0;          // R² of the best available fit (validity gate)
  // Per-fit R² so a displayed value carries ITS OWN fit quality — never the
  // other method's (review 2026-07-23; §13 method-honesty). 0 = fit unavailable.
  double t20R2 = 0.0;
  double t30R2 = 0.0;
  double decayRangeDb = 0.0;  // peak-to-noise-floor headroom actually available
  bool valid = false;         // true when at least T20 had range + a sane fit
};

struct Rt60Analysis {
  std::vector<Rt60BandResult> bands;  // octave bands 125..4000 + broadband last
  // Downsampled broadband Schroeder curve in dB (for the decay display).
  std::vector<float> curveDb;
  double curveStepSec = 0.0;
};

class Rt60 {
 public:
  static const std::vector<double>& octaveCenters() {
    static const std::vector<double> c = {125, 250, 500, 1000, 2000, 4000};
    return c;
  }

  // Analyze a captured decay event (mono float samples). The capture should
  // start at/just before the excitation peak and run past audibility.
  static Rt60Analysis analyze(const float* samples, size_t n, double fs) {
    Rt60Analysis out;
    if (n < static_cast<size_t>(fs * 0.4)) return out;  // too short to say anything

    // Broadband first (also fills the display curve).
    std::vector<float> band(samples, samples + n);
    out.bands.reserve(octaveCenters().size() + 1);
    for (double f0 : octaveCenters()) {
      std::vector<float> filtered(n);
      // Octave bandpass: Q = f0/BW with BW = f0·(√2·−√2⁻¹) → Q ≈ 1.414. Run
      // the RBJ section twice for steeper skirts (4th-order response).
      Biquad b1 = Biquad::bandpass(f0, 1.4142135623730951, fs);
      Biquad b2 = Biquad::bandpass(f0, 1.4142135623730951, fs);
      for (size_t i = 0; i < n; ++i) filtered[i] = b2.process(b1.process(samples[i]));
      Rt60BandResult r = analyzeBand(filtered.data(), n, fs, nullptr, 0.0);
      r.bandHz = f0;
      out.bands.push_back(r);
    }
    Rt60BandResult bb = analyzeBand(band.data(), n, fs, &out.curveDb, fs > 0 ? 0.01 : 0.0);
    bb.bandHz = 0.0;
    out.bands.push_back(bb);
    out.curveStepSec = 0.01;
    return out;
  }

 private:
  // Least-squares fit of curveDb over sample index range [i0, i1) →
  // slope dB/sample + R². Returns false when degenerate.
  static bool lineFit(const std::vector<double>& curveDb, size_t i0, size_t i1, double* slope,
                      double* r2) {
    const size_t n = i1 > i0 ? i1 - i0 : 0;
    if (n < 8) return false;
    double sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    for (size_t i = i0; i < i1; ++i) {
      const double x = static_cast<double>(i - i0);
      const double y = curveDb[i];
      sx += x;
      sy += y;
      sxx += x * x;
      sxy += x * y;
      syy += y * y;
    }
    const double nn = static_cast<double>(n);
    const double denom = nn * sxx - sx * sx;
    if (std::fabs(denom) < 1e-12) return false;
    *slope = (nn * sxy - sx * sy) / denom;
    const double varY = syy - sy * sy / nn;
    if (varY < 1e-12) return false;
    const double ssRes = varY - (*slope) * (sxy - sx * sy / nn);
    *r2 = 1.0 - (ssRes < 0 ? 0 : ssRes) / varY;
    return true;
  }

  // First index where the Schroeder curve crosses `db` (curve starts at 0
  // and decreases). Returns SIZE_MAX when never reached.
  static size_t crossing(const std::vector<double>& curveDb, double db) {
    for (size_t i = 0; i < curveDb.size(); ++i)
      if (curveDb[i] <= db) return i;
    return static_cast<size_t>(-1);
  }

  static Rt60BandResult analyzeBand(const float* x, size_t n, double fs,
                                    std::vector<float>* displayCurve, double displayStepSec) {
    Rt60BandResult r;
    // Noise floor: mean power of the final 10% of the capture. The decay must
    // clear this floor by a safety margin for a fit range to count (spec §13
    // "insufficient decay range" discipline).
    const size_t tail = n / 10 > 256 ? n / 10 : 256;
    double floorPow = 0.0;
    for (size_t i = n - tail; i < n; ++i) floorPow += static_cast<double>(x[i]) * x[i];
    floorPow /= static_cast<double>(tail);

    // Schroeder backward integration (power), normalized to 0 dB at start.
    std::vector<double> curve(n);
    double acc = 0.0;
    for (size_t i = n; i-- > 0;) {
      acc += static_cast<double>(x[i]) * x[i];
      curve[i] = acc;
    }
    const double total = curve[0] + 1e-30;
    for (size_t i = 0; i < n; ++i) curve[i] = 10.0 * std::log10(curve[i] / total + 1e-30);

    // Decay range: where the tail noise sits relative to the integrated total.
    const double floorDb = 10.0 * std::log10((floorPow * static_cast<double>(n)) / total + 1e-30);
    r.decayRangeDb = -floorDb;

    // Fits (indices via level crossings on the Schroeder curve).
    const size_t i5 = crossing(curve, -5.0);
    const size_t i10 = crossing(curve, -10.0);
    const size_t i25 = crossing(curve, -25.0);
    const size_t i35 = crossing(curve, -35.0);
    const size_t none = static_cast<size_t>(-1);
    double slope, r2;

    // EDT: 0 → −10 (×6). Needs ~15 dB of honest range.
    if (i10 != none && r.decayRangeDb > 15.0 && lineFit(curve, 0, i10, &slope, &r2) && slope < 0) {
      r.edtSec = (-60.0 / slope) / fs;
    }
    // T20: −5 → −25 (×3). Needs range beyond −25 − safety 10 dB.
    if (i5 != none && i25 != none && r.decayRangeDb > 35.0 &&
        lineFit(curve, i5, i25, &slope, &r2) && slope < 0) {
      r.t20Rt60Sec = (-60.0 / slope) / fs;
      r.t20R2 = r2;
      r.r2 = r2;
      r.valid = r2 > 0.90;
    }
    // T30: −5 → −35 (×2). Needs range beyond −35 − safety 10 dB.
    if (i5 != none && i35 != none && r.decayRangeDb > 45.0 &&
        lineFit(curve, i5, i35, &slope, &r2) && slope < 0) {
      r.t30Rt60Sec = (-60.0 / slope) / fs;
      r.t30R2 = r2;
      if (r2 > r.r2) r.r2 = r2;
    }

    if (displayCurve != nullptr && displayStepSec > 0) {
      const size_t step = static_cast<size_t>(fs * displayStepSec);
      displayCurve->clear();
      for (size_t i = 0; i < n; i += step > 0 ? step : 1)
        displayCurve->push_back(static_cast<float>(curve[i]));
    }
    return r;
  }
};

}  // namespace apedsp
