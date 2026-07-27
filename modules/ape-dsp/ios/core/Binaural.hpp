// ape-dsp — BINAURAL PANNER BUS (wave-2 expansion labs 2026-07-26).
//
// Up to 3 mono sources (sine / white / pink), each placed around the head by
// azimuth + distance and rendered to a binaural HEADPHONE mix with a
// SIMPLIFIED localization model — deliberately NOT a measured HRTF (owner
// decision 2026-07-26; the lab UI badges this honestly):
//
//   * ITD  — interaural time difference via the Woodworth sphere model:
//            itd = (a/c)·(θ + sin θ), head radius a = 8.75 cm, c = 343 m/s
//            (max ≈ 656 µs at ±90°). Applied to the FAR ear as a smoothly
//            ramped fractional delay — dragging a source therefore produces a
//            slight, physically plausible Doppler.
//   * ILD  — broadband far-ear attenuation growing to ~8 dB at ±90°.
//   * HEAD SHADOW — one-pole low-pass on the far ear whose cutoff falls from
//            16 kHz (front) to ~1.2 kHz (full side): the frequency-dependent
//            part of the level cue.
//   * BEHIND — |az| > 90° mirrors ITD/ILD (a sphere is front/back symmetric)
//            and adds a gentle low-pass on BOTH ears (16 k → 6 k toward 180°):
//            a crude front/back cue. Elevation is NOT modeled.
//   * DISTANCE — inverse-distance gain re 1 m (0.5–4 m).
//
// RT-SAFE: bridge writes per-source atomics; the render thread hoists them
// once per render call and slope-limits every audible parameter (gains,
// delays, cutoffs — full-swing ≈ 8 ms, the generator's kRampSec idiom), so
// dragging a source is click-free by construction. A 10 ms envelope fades the
// whole bus at start/stop; each source has its own ramped on/off gate.
//
// LEVEL POLICY (Q4): per-source level is clamped at the −12 dBFS cap (no
// unlock path on this bus), and the bus normalizes by
// 1/max(1, Σ sourcePeaks/cap) — the additive engine's "1/max(1,Σ)" idiom — so
// the SUM can never pierce the cap either. The applied norm is published for
// honest display. A route-aware speaker-safety HPF (same setHpf contract as
// the generator) protects the built-in speaker if the user ignores the
// headphone requirement.
//
// Pure C++17, header-only.
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>

#include "Biquad.hpp"

namespace apedsp {

namespace binaural {
constexpr uint32_t kMaxSources = 3;
constexpr double kHeadRadiusM = 0.0875;  // Woodworth sphere
constexpr double kSpeedOfSound = 343.0;
constexpr double kMaxIldDb = 8.0;        // broadband far-ear attenuation at ±90°
constexpr double kShadowMinHz = 1200.0;  // far-ear LPF cutoff at full side
constexpr double kShadowMaxHz = 16000.0; // …and when frontal (≈ bypass)
constexpr double kBackMinHz = 6000.0;    // both-ear LPF cutoff at 180° (crude back cue)
constexpr double kMinDist = 0.5, kMaxDist = 4.0;  // meters (gain re 1 m)
constexpr double kCapDb = -12.0;         // Q4 hard cap (per source AND the bus)
constexpr double kRampSec = 0.008;       // full-swing slope limit (generator idiom)
constexpr uint32_t kDelayLen = 256;      // per-source delay line (≥ max ITD @ 96 kHz)
enum class Src : int { Sine = 0, White = 1, Pink = 2 };
}  // namespace binaural

class BinauralBus {
 public:
  void configure(double fs) {
    fs_.store(fs);
    const uint32_t n = static_cast<uint32_t>(fs * 0.010);
    fadeSamples_.store(n < 1 ? 1 : n, std::memory_order_relaxed);
  }

  // ---- Control surface (bridge thread; atomics only) ----
  /// Program source i (0..2). All values are TARGETS — the render thread ramps
  /// toward them, so this is safe at UI (drag) rate. NaN-proofed (!(x>=k)).
  void setSource(uint32_t i, bool on, int type, double freqHz, double levelDb,
                 double azDeg, double dist) {
    if (i >= binaural::kMaxSources) return;
    S& s = src_[i];
    s.on.store(on);
    s.type.store(type < 0 ? 0 : (type > 2 ? 2 : type));
    s.freq.store(!(freqHz >= 20.0) ? 20.0 : (freqHz > 16000.0 ? 16000.0 : freqHz));
    double db = !(levelDb > -120.0) ? -120.0 : levelDb;
    s.levelDb.store(db > binaural::kCapDb ? binaural::kCapDb : db);  // Q4 cap, no unlock
    double az = !(azDeg > -1.0e6 && azDeg < 1.0e6) ? 0.0 : azDeg;
    while (az > 180.0) az -= 360.0;
    while (az < -180.0) az += 360.0;
    s.azDeg.store(az);
    s.dist.store(!(dist >= binaural::kMinDist) ? binaural::kMinDist
                                               : (dist > binaural::kMaxDist ? binaural::kMaxDist : dist));
  }
  /// Route-aware speaker-safety high-pass — same contract as Generator::setHpf.
  void setHpf(double hz) { hpfHz_.store(!(hz >= 0.0) ? 0.0 : hz); }
  void start() { running_.store(true); }
  void stop() { running_.store(false); }  // render fades out then silences
  bool running() const { return running_.load(); }
  /// The bus normalization actually applied (1 = not attenuating) — published
  /// from the render path for honest display.
  double busNorm() const { return normPub_.load(std::memory_order_relaxed); }

  // ---- Render (audio thread): ADDS the binaural mix into L/R ----
  void renderAddInto(float* L, float* R, uint32_t n) {
    const double fs = fs_.load();
    if (fs <= 0.0) return;
    const bool wantRun = running_.load();
    if (!wantRun && env_ <= 0.0) return;  // fully idle — no work, no state decay

    // Hoist targets once per render call (idiom) + refresh ramp steps.
    const double rampSamples = fs * binaural::kRampSec;
    const double step = 1.0 / (rampSamples < 1.0 ? 1.0 : rampSamples);
    const double fadeStep = 1.0 / static_cast<double>(fadeSamples_.load(std::memory_order_relaxed));
    const double capPeak = std::pow(10.0, binaural::kCapDb / 20.0);

    double sumPeak = 0.0;
    for (uint32_t i = 0; i < binaural::kMaxSources; ++i) {
      S& s = src_[i];
      R_& r = rs_[i];
      r.gateT = s.on.load() ? 1.0 : 0.0;
      r.type = s.type.load();
      r.freq = s.freq.load();
      const double az = s.azDeg.load() * (3.14159265358979323846 / 180.0);
      const double lvl = std::pow(10.0, s.levelDb.load() / 20.0);
      const double dist = s.dist.load();
      // Mirror behind onto the front hemisphere (sphere symmetry) for ITD/ILD.
      const double azAbs = std::fabs(az);
      const double theta = azAbs > kHalfPi ? (kPi - azAbs) : azAbs;  // 0..π/2
      const double side = az >= 0.0 ? 1.0 : -1.0;                    // + = right
      const double itdSec =
          (binaural::kHeadRadiusM / binaural::kSpeedOfSound) * (theta + std::sin(theta));
      const double itdSamp = itdSec * fs;
      // Far ear: LEFT when the source is right of center, RIGHT when left.
      r.dLT = side > 0.0 ? itdSamp : 0.0;
      r.dRT = side < 0.0 ? itdSamp : 0.0;
      const double ild = std::pow(10.0, -binaural::kMaxIldDb * std::sin(theta) / 20.0);
      const double dGain = 1.0 / (dist < binaural::kMinDist ? binaural::kMinDist : dist);
      const double g = lvl * dGain;
      r.gLT = g * (side > 0.0 ? ild : 1.0);
      r.gRT = g * (side < 0.0 ? ild : 1.0);
      // Head-shadow LPF on the far ear (log interp 16 k → 1.2 k with sin θ);
      // near ear stays open. Behind: BOTH ears darken toward kBackMinHz.
      const double shadowHz = binaural::kShadowMaxHz *
                              std::pow(binaural::kShadowMinHz / binaural::kShadowMaxHz, std::sin(theta));
      const double backAmt = azAbs > kHalfPi ? (azAbs - kHalfPi) / kHalfPi : 0.0;  // 0..1
      const double backHz = binaural::kShadowMaxHz *
                            std::pow(binaural::kBackMinHz / binaural::kShadowMaxHz, backAmt);
      const double nearHz = backHz;
      const double farHz = shadowHz < backHz ? shadowHz : backHz;
      r.kLT = onePoleK(side > 0.0 ? farHz : nearHz, fs);
      r.kRT = onePoleK(side < 0.0 ? farHz : nearHz, fs);
      // Peak the source can contribute (post ILD it's ≤ g) for the bus norm.
      // A source ramping OFF still sounds through its gate fade — include it
      // so the bound holds during the fade too (conservative, no overshoot).
      if (s.on.load() || rs_[i].gate > 0.0) sumPeak += g;
    }
    // Bus normalization (additive idiom): the theoretical peak sum can never
    // pierce the Q4 cap. Published for honest display.
    const double norm = 1.0 / (sumPeak / capPeak > 1.0 ? sumPeak / capPeak : 1.0);
    normPub_.store(norm, std::memory_order_relaxed);

    // Speaker-safety HPF (bus output) — design on change, crossfade on/off.
    const double hpfHz = hpfHz_.load(std::memory_order_relaxed);
    if (hpfHz > 0.0 && (hpfHz != hpfDesignedHz_ || fs != hpfDesignedFs_)) {
      hpfL_ = Biquad::highpass(hpfHz, fs);
      hpfR2_ = hpfL_;
      hpfDesignedHz_ = hpfHz;
      hpfDesignedFs_ = fs;
    }
    const bool hpfDesigned = hpfDesignedHz_ > 0.0;
    const double hpfMixT = hpfHz > 0.0 ? 1.0 : 0.0;

    for (uint32_t k = 0; k < n; ++k) {
      const double target = wantRun ? 1.0 : 0.0;
      if (env_ < target)
        env_ = env_ + fadeStep > target ? target : env_ + fadeStep;
      else if (env_ > target)
        env_ = env_ - fadeStep < target ? target : env_ - fadeStep;
      if (env_ <= 0.0 && !wantRun) return;  // fully faded — nothing more to add

      double mixL = 0.0, mixR = 0.0;
      for (uint32_t i = 0; i < binaural::kMaxSources; ++i) {
        R_& r = rs_[i];
        // Ramp the audible params (gate, gains, delays, cutoffs).
        r.gate = ramp(r.gate, r.gateT, step);
        if (r.gate <= 0.0 && r.gateT <= 0.0) continue;  // silent source
        r.gL = ramp(r.gL, r.gLT, step);
        r.gR = ramp(r.gR, r.gRT, step);
        // Delay slew ≤ 0.01 samples/sample (≤1% momentary pitch shift): a drag
        // across the head glides the ITD as a subtle, plausible Doppler — never
        // a chirp. Full ITD swing (≈31 samples @48 k) completes in ~65 ms.
        r.dL = ramp(r.dL, r.dLT, 0.01);
        r.dR = ramp(r.dR, r.dRT, 0.01);
        r.kL = ramp(r.kL, r.kLT, step);
        r.kR = ramp(r.kR, r.kRT, step);
        // Mono source sample → delay line.
        double x;
        switch (static_cast<binaural::Src>(r.type)) {
          case binaural::Src::White: x = r.white(); break;
          case binaural::Src::Pink: x = r.pinkSample(); break;
          case binaural::Src::Sine:
          default:
            x = std::sin(2.0 * kPi * r.phase);
            r.phase += r.freq / fs;
            if (r.phase >= 1.0) r.phase -= std::floor(r.phase);
            break;
        }
        r.dl[r.w] = static_cast<float>(x);
        // Fractional (linear-interp) reads for each ear.
        const double eL = r.readDelay(r.dL);
        const double eR = r.readDelay(r.dR);
        r.w = (r.w + 1) & (binaural::kDelayLen - 1);
        // Head-shadow one-poles, then gains + gate.
        r.lpL += r.kL * (eL - r.lpL);
        r.lpR += r.kR * (eR - r.lpR);
        mixL += r.gate * r.gL * r.lpL;
        mixR += r.gate * r.gR * r.lpR;
      }
      double sL = mixL * norm, sR = mixR * norm;
      if (hpfDesigned) {
        hpfMix_ = ramp(hpfMix_, hpfMixT, step);
        sL = sL * (1.0 - hpfMix_) + static_cast<double>(hpfL_.process(static_cast<float>(sL))) * hpfMix_;
        sR = sR * (1.0 - hpfMix_) + static_cast<double>(hpfR2_.process(static_cast<float>(sR))) * hpfMix_;
      }
      L[k] += static_cast<float>(env_ * sL);
      R[k] += static_cast<float>(env_ * sR);
    }
  }

 private:
  static constexpr double kPi = 3.14159265358979323846;
  static constexpr double kHalfPi = 1.57079632679489661923;

  static inline double onePoleK(double fc, double fs) {
    const double k = 1.0 - std::exp(-2.0 * kPi * fc / fs);
    return k > 1.0 ? 1.0 : (k < 0.0 ? 0.0 : k);
  }
  static inline double ramp(double cur, double target, double step) {
    if (cur < target) {
      cur += step;
      return cur > target ? target : cur;
    }
    if (cur > target) {
      cur -= step;
      return cur < target ? target : cur;
    }
    return cur;
  }

  // Per-source control atomics (bridge writes).
  struct S {
    std::atomic<bool> on{false};
    std::atomic<int> type{0};
    std::atomic<double> freq{440.0};
    std::atomic<double> levelDb{-20.0};
    std::atomic<double> azDeg{0.0};
    std::atomic<double> dist{1.0};
  };
  // Per-source render state (audio thread only).
  struct R_ {
    // Hoisted targets.
    double gateT = 0.0, gLT = 0.0, gRT = 0.0, dLT = 0.0, dRT = 0.0, kLT = 1.0, kRT = 1.0;
    int type = 0;
    double freq = 440.0;
    // Ramped currents.
    double gate = 0.0, gL = 0.0, gR = 0.0, dL = 0.0, dR = 0.0, kL = 1.0, kR = 1.0;
    // Source state.
    double phase = 0.0;
    uint32_t rng = 0x9e3779b9;
    double pk0 = 0, pk1 = 0, pk2 = 0, pk3 = 0, pk4 = 0, pk5 = 0, pk6 = 0;
    // Delay line (power-of-two) + one-pole shadow state.
    float dl[binaural::kDelayLen] = {};
    uint32_t w = 0;
    double lpL = 0.0, lpR = 0.0;

    inline double white() {
      uint32_t x = rng;
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      rng = x;
      return (static_cast<double>(x) / 2147483648.0) - 1.0;
    }
    inline double pinkSample() {
      const double w0 = white();
      pk0 = 0.99886 * pk0 + w0 * 0.0555179;
      pk1 = 0.99332 * pk1 + w0 * 0.0750759;
      pk2 = 0.96900 * pk2 + w0 * 0.1538520;
      pk3 = 0.86650 * pk3 + w0 * 0.3104856;
      pk4 = 0.55000 * pk4 + w0 * 0.5329522;
      pk5 = -0.7616 * pk5 - w0 * 0.0168980;
      const double p = pk0 + pk1 + pk2 + pk3 + pk4 + pk5 + pk6 + w0 * 0.5362;
      pk6 = w0 * 0.115926;
      return p * 0.11;
    }
    /// Fractional read `d` samples behind the CURRENT write position (the
    /// sample just written is d=0); linear interpolation.
    inline double readDelay(double d) const {
      if (d < 0.0) d = 0.0;
      const double maxD = static_cast<double>(binaural::kDelayLen - 2);
      if (d > maxD) d = maxD;
      const uint32_t di = static_cast<uint32_t>(d);
      const double frac = d - di;
      const uint32_t i0 = (w - di + binaural::kDelayLen) & (binaural::kDelayLen - 1);
      const uint32_t i1 = (i0 - 1 + binaural::kDelayLen) & (binaural::kDelayLen - 1);
      return (1.0 - frac) * dl[i0] + frac * dl[i1];
    }
  };

  S src_[binaural::kMaxSources];
  R_ rs_[binaural::kMaxSources];

  std::atomic<double> fs_{48000.0};
  std::atomic<bool> running_{false};
  std::atomic<uint32_t> fadeSamples_{480};
  std::atomic<double> hpfHz_{0.0};
  std::atomic<double> normPub_{1.0};

  double env_ = 0.0;
  Biquad hpfL_, hpfR2_;
  double hpfDesignedHz_ = 0.0, hpfDesignedFs_ = 0.0;
  double hpfMix_ = 0.0;
};

}  // namespace apedsp
