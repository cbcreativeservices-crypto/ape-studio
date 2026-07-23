// ape-dsp — biquad sections + IEC 61672 A/C weighting designs (engine build
// 2026-07-23, tech spec §5 weighting path). Pure C++17, header-only, no
// platform deps. Numerical rules per tech spec §3.1: float32 audio path,
// double coefficient math, log floor 1e-12.
//
// Design approach: the analog A/C prototypes are factored into second-order
// sections and bilinear-transformed at the actual sample rate. The cascade is
// then normalized EMPIRICALLY to 0 dB at 1 kHz by measuring its own response,
// which guarantees exact 1 kHz unity regardless of bilinear warping. Verified
// by the golden-vector harness against the IEC 61672 table values.
#pragma once

#include <cmath>
#include <cstddef>
#include <vector>

namespace apedsp {

// One Direct-Form-II-transposed biquad section.
struct Biquad {
  double b0 = 1.0, b1 = 0.0, b2 = 0.0, a1 = 0.0, a2 = 0.0;  // a0 normalized to 1
  double z1 = 0.0, z2 = 0.0;

  inline float process(float x) {
    const double in = static_cast<double>(x);
    const double out = b0 * in + z1;
    z1 = b1 * in - a1 * out + z2;
    z2 = b2 * in - a2 * out;
    return static_cast<float>(out);
  }

  void reset() { z1 = z2 = 0.0; }

  // RBJ cookbook bandpass (constant 0 dB peak gain) — octave-band filtering
  // for the RT60 path (engine build 2026-07-23).
  static Biquad bandpass(double f0, double q, double fs) {
    const double w = 2.0 * 3.14159265358979323846 * f0 / fs;
    const double alpha = std::sin(w) / (2.0 * q);
    const double a0 = 1.0 + alpha;
    Biquad b;
    b.b0 = alpha / a0;
    b.b1 = 0.0;
    b.b2 = -alpha / a0;
    b.a1 = -2.0 * std::cos(w) / a0;
    b.a2 = (1.0 - alpha) / a0;
    return b;
  }

  // Bilinear transform of an analog section (B2 s^2 + B1 s + B0)/(A2 s^2 + A1 s + A0).
  static Biquad fromAnalog(double B2, double B1, double B0, double A2, double A1, double A0,
                           double fs) {
    const double K = 2.0 * fs;
    const double K2 = K * K;
    const double b0d = B2 * K2 + B1 * K + B0;
    const double b1d = 2.0 * B0 - 2.0 * B2 * K2;
    const double b2d = B2 * K2 - B1 * K + B0;
    const double a0d = A2 * K2 + A1 * K + A0;
    const double a1d = 2.0 * A0 - 2.0 * A2 * K2;
    const double a2d = A2 * K2 - A1 * K + A0;
    Biquad q;
    q.b0 = b0d / a0d;
    q.b1 = b1d / a0d;
    q.b2 = b2d / a0d;
    q.a1 = a1d / a0d;
    q.a2 = a2d / a0d;
    return q;
  }
};

// A cascade of biquads with an output gain.
class BiquadCascade {
 public:
  std::vector<Biquad> sections;
  double gain = 1.0;

  inline float process(float x) {
    float y = x;
    for (auto& s : sections) y = s.process(y);
    return static_cast<float>(gain * y);
  }

  void reset() {
    for (auto& s : sections) s.reset();
  }

  // Measured magnitude response at f (Hz): run a sine through a COPY of the
  // cascade and compare steady-state RMS. Used for 1 kHz normalization and by
  // the golden tests. `seconds` of settle+measure at fs.
  double measureGainAt(double f, double fs, double seconds = 0.5) const {
    BiquadCascade c = *this;  // copy: fresh state
    c.reset();
    const size_t settle = static_cast<size_t>(fs * 0.2);
    const size_t n = static_cast<size_t>(fs * seconds);
    const double w = 2.0 * 3.14159265358979323846 * f / fs;
    double sumSqIn = 0.0, sumSqOut = 0.0;
    for (size_t i = 0; i < settle + n; ++i) {
      const float x = static_cast<float>(std::sin(w * static_cast<double>(i)));
      const float y = c.process(x);
      if (i >= settle) {
        sumSqIn += static_cast<double>(x) * x;
        sumSqOut += static_cast<double>(y) * y;
      }
    }
    return std::sqrt((sumSqOut + 1e-30) / (sumSqIn + 1e-30));
  }
};

namespace weighting {

// IEC 61672 analog pole frequencies (Hz).
constexpr double kF1 = 20.598997;
constexpr double kF2 = 107.65265;
constexpr double kF3 = 737.86223;
constexpr double kF4 = 12194.217;

inline double w(double f) { return 2.0 * 3.14159265358979323846 * f; }

// A-weighting: A(s) = k s^4 / [ (s+w1)^2 (s+w2)(s+w3)(s+w4)^2 ]
// Sections: s^2/(s+w1)^2 · s/((s+w2)(s+w3)) · s/(s+w4)^2
inline BiquadCascade designA(double fs) {
  const double w1 = w(kF1), w2 = w(kF2), w3 = w(kF3), w4 = w(kF4);
  BiquadCascade c;
  c.sections.push_back(Biquad::fromAnalog(1, 0, 0, 1, 2 * w1, w1 * w1, fs));
  c.sections.push_back(Biquad::fromAnalog(0, 1, 0, 1, w2 + w3, w2 * w3, fs));
  c.sections.push_back(Biquad::fromAnalog(0, 1, 0, 1, 2 * w4, w4 * w4, fs));
  // Normalize to exactly 0 dB at 1 kHz (measured, so warping cancels out).
  c.gain = 1.0;
  c.gain = 1.0 / c.measureGainAt(1000.0, fs);
  return c;
}

// C-weighting: C(s) = k s^2 / [ (s+w1)^2 (s+w4)^2 ]
// Sections: s/(s+w1)^2 · s/(s+w4)^2
inline BiquadCascade designC(double fs) {
  const double w1 = w(kF1), w4 = w(kF4);
  BiquadCascade c;
  c.sections.push_back(Biquad::fromAnalog(0, 1, 0, 1, 2 * w1, w1 * w1, fs));
  c.sections.push_back(Biquad::fromAnalog(0, 1, 0, 1, 2 * w4, w4 * w4, fs));
  c.gain = 1.0;
  c.gain = 1.0 / c.measureGainAt(1000.0, fs);
  return c;
}

}  // namespace weighting
}  // namespace apedsp
