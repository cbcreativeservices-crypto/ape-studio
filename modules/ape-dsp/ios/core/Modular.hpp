// ape-dsp — MODULAR SYNTH TEACHING VOICE (wave-2 expansion labs 2026-07-26).
//
// One canonical subtractive voice with the classic modulation sources, built
// to teach SECTIONS and SIGNAL FLOW (the lab UI draws the patch):
//
//   VCO (polyBLEP saw / square / triangle / sine)
//     → VCF (ZDF state-variable low-pass, cutoff + resonance)
//       → VCA (ADSR envelope)
//         → soft saturation (tanh — the analog-style output stage; also the
//           hard bound that keeps a resonant peak inside the Q4 cap chain)
//
//   MOD SOURCES:
//     • ADSR — always the VCA envelope; optionally routed to the VCF cutoff
//       (envToCutoff, ±4 octaves — the classic filter-envelope patch).
//     • LFO — sine, routed to ONE destination: pitch (vibrato, ± semitones),
//       cutoff (filter wobble, ± octaves) or amp (tremolo).
//     • SEQUENCER — 8 steps of semitone offsets; each active step retunes the
//       VCO and retriggers the envelope (gate ≈ 60 % of the step). Sequencer
//       OFF = a sustained drone (explorable knobs); a retrigger is the strike.
//
// RT-SAFE: bridge writes atomics via ONE scalar setter (the fxSet idiom);
// render hoists once per call; continuous params (cutoff, resonance, level,
// LFO depth) ramp slope-limited (~8 ms full swing). Pitch steps are
// INSTANT — phase-continuous by construction, and stepping IS the sequencer
// sound. Envelope retriggers attack from the CURRENT level (click-free).
// Published live state (env level, active step) feeds the honest UI meters.
//
// LEVEL (Q4): level clamped ≤ −12 dBFS; the tanh stage bounds |sample| ≤ 1
// before the gain, so the cap chain holds even at full resonance.
//
// Pure C++17, header-only.
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>

#include "Biquad.hpp"

namespace apedsp {

namespace modular {
constexpr double kCapDb = -12.0;
constexpr double kRampSec = 0.008;
constexpr uint32_t kSteps = 8;
constexpr double kEnvToCutOct = 4.0;   // envToCutoff full-scale sweep (octaves)
constexpr double kLfoPitchSemis = 7.0; // LFO→pitch full-depth vibrato (± semitones)
constexpr double kLfoCutOct = 3.0;     // LFO→cutoff full-depth wobble (± octaves)
// Scalar parameter ids (bridge ↔ native; keep in lockstep with index.ts).
enum Param : int {
  Shape = 1,        // 0 saw · 1 square · 2 triangle · 3 sine
  BaseFreq = 2,     // Hz (27.5–1760)
  Cutoff = 3,       // Hz (60–14000)
  Resonance = 4,    // 0..1
  EnvA = 5,         // s
  EnvD = 6,         // s
  EnvS = 7,         // 0..1
  EnvR = 8,         // s
  EnvToCutoff = 9,  // −1..1 (± kEnvToCutOct octaves)
  LfoRate = 10,     // Hz (0.05–30)
  LfoDepth = 11,    // 0..1
  LfoDest = 12,     // 0 off · 1 pitch · 2 cutoff · 3 amp
  SeqOn = 13,       // 0/1
  SeqRate = 14,     // steps/s (0.5–16)
  LevelDb = 16,     // ≤ −12 (Q4 cap, no unlock)
  SeqStep0 = 20,    // .. SeqStep0+7: semitone offset per step
  SeqGate0 = 28,    // .. SeqGate0+7: step active (0/1)
};
enum class Shape_ : int { Saw = 0, Square = 1, Tri = 2, Sine = 3 };
}  // namespace modular

class ModularVoice {
 public:
  void configure(double fs) {
    fs_.store(fs);
    const uint32_t n = static_cast<uint32_t>(fs * 0.010);
    fadeSamples_.store(n < 1 ? 1 : n, std::memory_order_relaxed);
  }

  // ---- Control surface: ONE scalar setter (fxSet idiom). NaN-proofed. ----
  void set(int param, double v) {
    const bool bad = !(v > -1.0e9 && v < 1.0e9);  // rejects NaN/inf
    if (bad) return;
    using namespace modular;
    if (param >= SeqStep0 && param < SeqStep0 + (int)kSteps) {
      double s = v < -24.0 ? -24.0 : (v > 24.0 ? 24.0 : v);
      seqStep_[param - SeqStep0].store(s);
      return;
    }
    if (param >= SeqGate0 && param < SeqGate0 + (int)kSteps) {
      seqGate_[param - SeqGate0].store(v >= 0.5);
      return;
    }
    switch (param) {
      case Shape: shape_.store(v < 0 ? 0 : (v > 3 ? 3 : (int)v)); break;
      case BaseFreq: baseFreq_.store(v < 27.5 ? 27.5 : (v > 1760.0 ? 1760.0 : v)); break;
      case Cutoff: cutoff_.store(v < 60.0 ? 60.0 : (v > 14000.0 ? 14000.0 : v)); break;
      case Resonance: res_.store(v < 0.0 ? 0.0 : (v > 1.0 ? 1.0 : v)); break;
      case EnvA: envA_.store(v < 0.001 ? 0.001 : (v > 5.0 ? 5.0 : v)); break;
      case EnvD: envD_.store(v < 0.001 ? 0.001 : (v > 5.0 ? 5.0 : v)); break;
      case EnvS: envS_.store(v < 0.0 ? 0.0 : (v > 1.0 ? 1.0 : v)); break;
      case EnvR: envR_.store(v < 0.001 ? 0.001 : (v > 5.0 ? 5.0 : v)); break;
      case EnvToCutoff: envToCut_.store(v < -1.0 ? -1.0 : (v > 1.0 ? 1.0 : v)); break;
      case LfoRate: lfoRate_.store(v < 0.05 ? 0.05 : (v > 30.0 ? 30.0 : v)); break;
      case LfoDepth: lfoDepth_.store(v < 0.0 ? 0.0 : (v > 1.0 ? 1.0 : v)); break;
      case LfoDest: lfoDest_.store(v < 0 ? 0 : (v > 3 ? 3 : (int)v)); break;
      case SeqOn: seqOn_.store(v >= 0.5); break;
      case SeqRate: seqRate_.store(v < 0.5 ? 0.5 : (v > 16.0 ? 16.0 : v)); break;
      case LevelDb: {
        double db = v > modular::kCapDb ? modular::kCapDb : v;  // Q4 cap, no unlock
        levelDb_.store(db < -120.0 ? -120.0 : db);
        break;
      }
      default: break;
    }
  }
  /// Route-aware speaker-safety high-pass — same contract as Generator::setHpf.
  void setHpf(double hz) { hpfHz_.store(!(hz >= 0.0) ? 0.0 : hz); }
  void start() {
    retrigger_.store(true);
    running_.store(true);
  }
  void stop() { running_.store(false); }
  bool running() const { return running_.load(); }
  /// Live state for the honest UI: current envelope level (0..1) + active step.
  double envLevel() const { return envPub_.load(std::memory_order_relaxed); }
  int activeStep() const { return stepPub_.load(std::memory_order_relaxed); }

  // ---- Render (audio thread): ADDS the voice into L/R (mono → both) ----
  void renderAddInto(float* L, float* R, uint32_t n) {
    const double fs = fs_.load();
    if (fs <= 0.0) return;
    const bool wantRun = running_.load();
    // Fully idle once the bus fade lands at 0 (the drone gate keeps env_ high,
    // so the bus fade — not the ADSR — is the authoritative silence condition).
    if (!wantRun && busEnv_ <= 0.0) return;

    // Hoist once per render call (idiom).
    const double rampSamples = fs * modular::kRampSec;
    const double step = 1.0 / (rampSamples < 1.0 ? 1.0 : rampSamples);
    const double fadeStep = 1.0 / static_cast<double>(fadeSamples_.load(std::memory_order_relaxed));
    const auto shape = static_cast<modular::Shape_>(shape_.load());
    const double baseFreq = baseFreq_.load();
    cutT_ = cutoff_.load();
    resT_ = res_.load();
    const double aStep = 1.0 / (fs * envA_.load());
    const double dStep = 1.0 / (fs * envD_.load());
    const double rStep = 1.0 / (fs * envR_.load());
    const double sus = envS_.load();
    const double envToCut = envToCut_.load();
    const double lfoRate = lfoRate_.load();
    depthT_ = lfoDepth_.load();
    const int lfoDest = lfoDest_.load();
    const bool seqOn = seqOn_.load();
    const double seqRate = seqRate_.load();
    lvlT_ = std::pow(10.0, levelDb_.load() / 20.0);
    double steps[modular::kSteps];
    bool gates[modular::kSteps];
    for (uint32_t i = 0; i < modular::kSteps; ++i) {
      steps[i] = seqStep_[i].load();
      gates[i] = seqGate_[i].load();
    }
    if (retrigger_.exchange(false)) {
      // The STRIKE: restart the envelope attack (from the current level —
      // click-free) and the sequencer from step 0.
      envState_ = 1;
      seqPos_ = 0;
      seqTimer_ = 0.0;
      gateOpen_ = true;
    }
    // Speaker-safety HPF (design-on-change + crossfade, the shared idiom).
    const double hpfHz = hpfHz_.load(std::memory_order_relaxed);
    if (hpfHz > 0.0 && (hpfHz != hpfDesignedHz_ || fs != hpfDesignedFs_)) {
      hpf_ = Biquad::highpass(hpfHz, fs);
      hpfDesignedHz_ = hpfHz;
      hpfDesignedFs_ = fs;
    }
    const bool hpfDesigned = hpfDesignedHz_ > 0.0;
    const double hpfMixT = hpfHz > 0.0 ? 1.0 : 0.0;

    const double stepDur = 1.0 / seqRate;   // seconds per step
    const double gateDur = stepDur * 0.6;   // gate ≈ 60 % of the step

    for (uint32_t k = 0; k < n; ++k) {
      // Bus fade (start/stop click-free).
      const double busT = wantRun ? 1.0 : 0.0;
      if (busEnv_ < busT)
        busEnv_ = busEnv_ + fadeStep > busT ? busT : busEnv_ + fadeStep;
      else if (busEnv_ > busT)
        busEnv_ = busEnv_ - fadeStep < busT ? busT : busEnv_ - fadeStep;
      if (busEnv_ <= 0.0 && !wantRun) {
        envPub_.store(0.0, std::memory_order_relaxed);
        return;
      }

      // --- SEQUENCER: advance, retune, retrigger. ---
      if (seqOn) {
        if (seqTimer_ <= 0.0) {
          // Entering step seqPos_ (timer initialized below); nothing here —
          // handled by the boundary logic underneath.
        }
        seqTimer_ += 1.0 / fs;
        if (seqTimer_ >= stepDur) {
          seqTimer_ -= stepDur;
          seqPos_ = (seqPos_ + 1) % modular::kSteps;
          if (gates[seqPos_]) {
            envState_ = 1;  // retrigger (attack from current level)
            gateOpen_ = true;
          } else {
            gateOpen_ = false;  // rest step → release
            envState_ = 4;
          }
        }
        // Gate closes at 60 % of the step (release tail shapes the note end).
        if (gateOpen_ && seqTimer_ > gateDur) {
          gateOpen_ = false;
          if (envState_ != 0) envState_ = 4;
        }
      } else {
        // Drone: gate follows running (sustained, knobs explorable).
        if (!gateOpen_) {
          gateOpen_ = true;
          if (envState_ == 0 || envState_ == 4) envState_ = 1;
        }
        seqPos_ = 0;
      }
      const double semis = seqOn && gates[seqPos_] ? steps[seqPos_] : (seqOn ? 0.0 : 0.0);

      // --- ADSR (linear attack, one-pole-ish linear decay/release). ---
      switch (envState_) {
        case 1:  // attack
          env_ += aStep;
          if (env_ >= 1.0) {
            env_ = 1.0;
            envState_ = 2;
          }
          break;
        case 2:  // decay
          env_ -= dStep;
          if (env_ <= sus) {
            env_ = sus;
            envState_ = 3;
          }
          break;
        case 3:  // sustain
          env_ = sus;
          if (!gateOpen_) envState_ = 4;
          break;
        case 4:  // release
          env_ -= rStep;
          if (env_ <= 0.0) {
            env_ = 0.0;
            envState_ = 0;
          }
          break;
        default:
          break;
      }
      // Gate closed mid-attack or mid-decay → straight to release.
      if ((envState_ == 1 || envState_ == 2) && !gateOpen_) envState_ = 4;

      // --- LFO. ---
      depth_ = ramp(depth_, depthT_, step);
      const double lfo = std::sin(2.0 * kPi * lfoPhase_);
      lfoPhase_ += lfoRate / fs;
      if (lfoPhase_ >= 1.0) lfoPhase_ -= std::floor(lfoPhase_);
      const double lfoPitch = lfoDest == 1 ? lfo * depth_ * modular::kLfoPitchSemis : 0.0;
      const double lfoCut = lfoDest == 2 ? lfo * depth_ * modular::kLfoCutOct : 0.0;
      const double trem = lfoDest == 3 ? 1.0 - depth_ * (0.5 + 0.5 * lfo) : 1.0;

      // --- VCO (polyBLEP band-limited). ---
      const double f0 = baseFreq * std::pow(2.0, (semis + lfoPitch) / 12.0);
      const double dt = f0 / fs;
      double x;
      switch (shape) {
        case modular::Shape_::Sine:
          x = std::sin(2.0 * kPi * vcoPhase_);
          break;
        case modular::Shape_::Square: {
          x = vcoPhase_ < 0.5 ? 1.0 : -1.0;
          x += polyBlep(vcoPhase_, dt);
          double p2 = vcoPhase_ + 0.5;
          if (p2 >= 1.0) p2 -= 1.0;
          x -= polyBlep(p2, dt);
          break;
        }
        case modular::Shape_::Tri: {
          // Leaky-integrated polyBLEP square → band-limited triangle.
          double sq = vcoPhase_ < 0.5 ? 1.0 : -1.0;
          sq += polyBlep(vcoPhase_, dt);
          double p2 = vcoPhase_ + 0.5;
          if (p2 >= 1.0) p2 -= 1.0;
          sq -= polyBlep(p2, dt);
          triInt_ = 0.999 * triInt_ + (4.0 * dt) * sq;
          x = triInt_;
          break;
        }
        case modular::Shape_::Saw:
        default:
          x = 2.0 * vcoPhase_ - 1.0;
          x -= polyBlep(vcoPhase_, dt);
          break;
      }
      vcoPhase_ += dt;
      if (vcoPhase_ >= 1.0) vcoPhase_ -= std::floor(vcoPhase_);

      // --- VCF (ZDF SVF low-pass; cutoff modulated by env + LFO). ---
      cut_ = ramp(cut_, cutT_, 14000.0 * step);
      resCur_ = ramp(resCur_, resT_, step);
      double fc = cut_ * std::pow(2.0, envToCut * env_ * modular::kEnvToCutOct + lfoCut);
      const double fcMax = fs * 0.45;
      if (fc > fcMax) fc = fcMax;
      if (fc < 20.0) fc = 20.0;
      const double g = std::tan(kPi * fc / fs);
      const double kDamp = 2.0 - 1.6 * resCur_;  // Q up to ~2.5 (+8 dB peak)
      const double a1 = 1.0 / (1.0 + g * (g + kDamp));
      const double a2 = g * a1;
      const double a3 = g * a2;
      const double v3 = x - ic2_;
      const double v1 = a1 * ic1_ + a2 * v3;
      const double v2 = ic2_ + a2 * ic1_ + a3 * v3;
      ic1_ = 2.0 * v1 - ic1_;
      ic2_ = 2.0 * v2 - ic2_;
      double y = v2;  // low-pass tap

      // --- VCA + analog-style soft stage (also the Q4 unit bound). ---
      y = std::tanh(y);
      lvl_ = ramp(lvl_, lvlT_, step);
      double s = y * env_ * trem * lvl_ * busEnv_;

      if (hpfDesigned) {
        hpfMix_ = ramp(hpfMix_, hpfMixT, step);
        s = s * (1.0 - hpfMix_) + static_cast<double>(hpf_.process(static_cast<float>(s))) * hpfMix_;
      }
      L[k] += static_cast<float>(s);
      R[k] += static_cast<float>(s);
    }
    envPub_.store(env_, std::memory_order_relaxed);
    stepPub_.store(seqOn ? (int)seqPos_ : -1, std::memory_order_relaxed);
  }

 private:
  static constexpr double kPi = 3.14159265358979323846;

  /// Standard 2-sample polyBLEP residual for a rising unit step at phase 0
  /// (canonical signs: saw SUBTRACTS this; square adds at the rising edge and
  /// subtracts at the falling edge — as the call sites do).
  static inline double polyBlep(double t, double dt) {
    if (dt <= 0.0) return 0.0;
    if (t < dt) {
      const double u = t / dt;
      return u + u - u * u - 1.0;
    }
    if (t > 1.0 - dt) {
      const double u = (t - 1.0) / dt;
      return u * u + u + u + 1.0;
    }
    return 0.0;
  }
  static inline double ramp(double cur, double target, double stepv) {
    if (cur < target) {
      cur += stepv;
      return cur > target ? target : cur;
    }
    if (cur > target) {
      cur -= stepv;
      return cur < target ? target : cur;
    }
    return cur;
  }

  // Control atomics.
  std::atomic<double> fs_{48000.0};
  std::atomic<bool> running_{false};
  std::atomic<bool> retrigger_{false};
  std::atomic<uint32_t> fadeSamples_{480};
  std::atomic<int> shape_{0};
  std::atomic<double> baseFreq_{110.0};
  std::atomic<double> cutoff_{2000.0};
  std::atomic<double> res_{0.0};
  std::atomic<double> envA_{0.01};
  std::atomic<double> envD_{0.2};
  std::atomic<double> envS_{0.7};
  std::atomic<double> envR_{0.25};
  std::atomic<double> envToCut_{0.0};
  std::atomic<double> lfoRate_{2.0};
  std::atomic<double> lfoDepth_{0.0};
  std::atomic<int> lfoDest_{0};
  std::atomic<bool> seqOn_{false};
  std::atomic<double> seqRate_{4.0};
  std::atomic<double> levelDb_{-20.0};
  std::atomic<double> seqStep_[modular::kSteps] = {{0}, {0}, {0}, {0}, {0}, {0}, {0}, {0}};
  std::atomic<bool> seqGate_[modular::kSteps] = {{true}, {true}, {true}, {true},
                                                 {true}, {true}, {true}, {true}};
  std::atomic<double> hpfHz_{0.0};
  std::atomic<double> envPub_{0.0};
  std::atomic<int> stepPub_{-1};

  // Render state.
  double busEnv_ = 0.0;
  double env_ = 0.0;
  int envState_ = 0;  // 0 idle · 1 att · 2 dec · 3 sus · 4 rel
  bool gateOpen_ = false;
  uint32_t seqPos_ = 0;
  double seqTimer_ = 0.0;
  double vcoPhase_ = 0.0;
  double triInt_ = 0.0;
  double lfoPhase_ = 0.0;
  double ic1_ = 0.0, ic2_ = 0.0;  // SVF integrator states
  double cut_ = 2000.0, cutT_ = 2000.0;
  double resCur_ = 0.0, resT_ = 0.0;
  double depth_ = 0.0, depthT_ = 0.0;
  double lvl_ = 0.1, lvlT_ = 0.1;
  Biquad hpf_;
  double hpfDesignedHz_ = 0.0, hpfDesignedFs_ = 0.0;
  double hpfMix_ = 0.0;
};

}  // namespace apedsp
