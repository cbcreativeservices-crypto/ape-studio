// ape-dsp — test-signal generator (engine build 2026-07-23, spec Tool 6 +
// RULING Q4: output defaults to −20 dBFS, HARD CAP −12 dBFS; levels above the
// cap require an explicit unlock that lasts for the session only. The cap is
// enforced HERE, in the native output path, in one place).
//
// RT-SAFE render: called from the audio output callback — no locks, no
// allocation; parameters are read from atomics once per render call. A 10 ms
// LINEAR envelope fades starts and stops; a retrigger on a RUNNING generator
// (in-place mode switch, sweep reprogram) dips that envelope to zero, applies
// the per-trigger reset at the bottom, and fades back up — so mode changes
// are click-free whether or not the tone is sounding (spec Tool 6 dev notes).
// Pure C++17, header-only.
//
// HV-2 Build 1 (2026-07-25): ADDITIVE mode — 12 harmonics of f0, each with a
// relative amp (0..1) and phase offset (degrees). Band-limited by
// construction (harmonics at/above Nyquist silently omitted), normalized so
// the summed output can never pierce the Q4 cap chain, and click-free via
// slope-limited linear ramps on amp/gain (≤8 ms for a full 0→1 swing —
// smaller changes finish proportionally faster) and a slewed phase offset.
// See the GenMode::Additive block below for the full design notes.
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>

#include "Biquad.hpp"  // route-aware speaker-safety high-pass (2nd-order Butterworth)

namespace apedsp {

namespace genlevel {
constexpr double kDefaultDb = -20.0;  // Q4 default
constexpr double kCapDb = -12.0;      // Q4 hard cap (unlock required above)
}  // namespace genlevel

namespace genfm {
// FM voice bounds (wave-2 expansion labs 2026-07-26). Index = peak phase
// deviation in radians (Chowning convention: sidebands at fc ± k·fm with
// amplitudes J_k(I)). Ranges keep Carson bandwidth ≈ 2·fm·(I+1) sane for the
// lab's carrier range; extremes CAN alias (documented — the Distortion lab
// teaches aliasing; the FM lab UI shows Carson bandwidth vs Nyquist honestly).
constexpr double kMaxIndex = 12.0;
constexpr double kMaxRatio = 16.0;
// Index ramp: full 0→kMaxIndex swing in ~24 ms (slope-limited, same click-free
// rationale as the additive amp ramps; smaller changes finish faster).
constexpr double kIndexRampSec = 0.024;
}  // namespace genfm

namespace genadd {
constexpr uint32_t kHarmonics = 12;  // fixed HV-2 model size (matches JS MODEL_HARMONICS)
// Slope-limited linear ramps (amps, gain, phase slew): a FULL 0→1 amp swing
// takes ~8 ms; smaller changes finish proportionally faster (the rate is
// fixed, not the duration — the click-free guarantee is the bounded slope).
constexpr double kRampSec = 0.008;
// Phase-offset slew cap: a slewing harmonic may be detuned by at most this
// fraction of its OWN frequency. The fixed-rate slew alone is a constant
// 1/(2·kRampSec) = 62.5 Hz instantaneous offset — fine at 1 kHz+, but at a
// low fundamental (60–100 Hz is in range) it exceeds the harmonic's own
// frequency and reads as a chirp, not a "tiny detune". Large flips at low
// frequencies therefore slew slower but proportionally gentle.
constexpr double kPhaseSlewDetune = 0.05;
}  // namespace genadd

enum class GenMode : int {
  Off = 0,
  Sine = 1,
  White = 2,
  Pink = 3,
  Brown = 4,
  Blue = 5,
  Violet = 6,
  SweepLin = 7,
  SweepLog = 8,
  Impulse = 9,
  Click = 10,
  Burst = 11,
  Additive = 12,  // HV-2: 12-harmonic additive synth (never renumber)
  Fm = 13,        // wave-2: carrier+modulator FM voice (never renumber)
};

class Generator {
 public:
  void configure(double fs) {
    fs_.store(fs);
    // Atomic + floor of 1 (review 2026-07-23: render reads this concurrently;
    // 0 would make the fade step +inf).
    const uint32_t n = static_cast<uint32_t>(fs * 0.010);  // 10 ms
    fadeSamples_.store(n < 1 ? 1 : n, std::memory_order_relaxed);
  }

  // ---- Control surface (bridge thread; atomics only) ----
  void setMode(GenMode m) {
    mode_.store(static_cast<int>(m));
    retrigger_.store(true);
  }
  void setFrequency(double hz) { freq_.store(hz); }
  void setLevelDb(double db) { requestedDb_.store(db); }
  void setSweep(double startHz, double endHz, double seconds, bool repeat) {
    // Positive floor, NaN-proof (review 2026-07-23: log sweep with startHz≤0
    // renders NaN samples; the !(x>=1) form also rejects NaN inputs).
    sweepStart_.store(!(startHz >= 1.0) ? 1.0 : startHz);
    sweepEnd_.store(!(endHz >= 1.0) ? 1.0 : endHz);
    sweepSecs_.store(seconds <= 0.05 ? 0.05 : seconds);
    sweepRepeat_.store(repeat);
    retrigger_.store(true);
  }
  void setClickBpm(double bpm) { clickBpm_.store(bpm < 20 ? 20 : (bpm > 300 ? 300 : bpm)); }
  /// FM voice (wave-2): modulator = ratio × carrier (freq_); index I = peak
  /// phase deviation (radians, Chowning) — TARGET, slope-limit-ramped on the
  /// render thread; decaySec > 0 puts an exponential decay on the index per
  /// trigger (the classic FM bell/pluck "brightness fades" envelope; 0 =
  /// sustained/static index). A retrigger (genStart on a running tone) is the
  /// STRIKE — the env dip + per-trigger reset restarts the decay click-free.
  /// NaN-proofed (the !(x>=k) form rejects NaN); safe at UI rate.
  void setFm(double ratio, double index, double decaySec) {
    fmRatio_.store(!(ratio >= 0.05) ? 0.05 : (ratio > genfm::kMaxRatio ? genfm::kMaxRatio : ratio));
    fmIndexT_.store(!(index >= 0.0) ? 0.0 : (index > genfm::kMaxIndex ? genfm::kMaxIndex : index));
    fmDecay_.store(!(decaySec >= 0.0) ? 0.0 : decaySec);
  }
  /// ROUTE-AWARE SPEAKER-SAFETY HIGH-PASS. The platform layer detects the
  /// output route and sets the cutoff: a positive Hz ENGAGES a 2nd-order
  /// Butterworth high-pass on the generator output (built-in speaker — protects
  /// the micro-driver from low-frequency over-excursion); 0 BYPASSES it
  /// (headphones/line-out — full range, no excursion risk). Applied to EVERY
  /// mode (sine/noise/additive/sweep) since it sits after sample(). The cutoff
  /// matches the JS speakerSafety response so app displays and audio agree.
  /// Default 0 (off) so the golden vectors — which assume a flat path — stay
  /// green; the route layer turns it on. NaN-proofed (the !(x>=0) form).
  void setHpf(double hz) { hpfHz_.store(!(hz >= 0.0) ? 0.0 : hz); }
  /// STEREO dual-oscillator: when on, the output is L = sine(fL), R = sine(fR),
  /// HARD-PANNED — used by stereo lab tools (e.g. the Harmonograph: harmonic
  /// n1 → Left, n2 → Right, matching the XY figure). Off → the selected mode
  /// plays mono (L == R). No retrigger: frequency changes glide phase-
  /// continuously, so it is safe to call at UI rate. NaN-proofed (!(x>=1)).
  void setStereo(bool on, double fL, double fR) {
    stereoFreqL_.store(!(fL >= 1.0) ? 1.0 : fL);
    stereoFreqR_.store(!(fR >= 1.0) ? 1.0 : fR);
    stereoOn_.store(on);
  }
  bool stereoOn() const { return stereoOn_.load(); }
  /// ADDITIVE (HV-2): flat layout [f0, a1..a12, p1..p12] — 25 doubles. The
  /// SAME ordering crosses every bridge (JSI/JNI) verbatim; amps are relative
  /// 0..1, phases in degrees. These are TARGETS only: the render thread ramps
  /// toward them (slope-limited, ≤8 ms for a full swing), so this is safe to
  /// call at UI rate. NaN-proofed in
  /// the setSweep style (the !(x>=k) form also rejects NaN). Does NOT
  /// retrigger — a running additive tone glides to the new parameters.
  void setAdditive(const double* vals, uint32_t count) {
    if (vals == nullptr || count < 1 + 2 * genadd::kHarmonics) return;
    const double f0 = vals[0];
    additiveF0_.store(!(f0 >= 1.0) ? 1.0 : f0);
    for (uint32_t h = 0; h < genadd::kHarmonics; ++h) {
      double a = vals[1 + h];
      a = !(a > 0.0) ? 0.0 : (a > 1.0 ? 1.0 : a);  // NaN → 0, clamp 0..1
      addAmpT_[h].store(a);
      double deg = vals[1 + genadd::kHarmonics + h];
      if (!(deg > -1.0e9 && deg < 1.0e9)) deg = 0.0;  // NaN/inf → 0
      double rad = deg * (kPi / 180.0);
      rad -= std::floor(rad / (2.0 * kPi)) * (2.0 * kPi);  // wrap [0, 2π)
      addPhaseT_[h].store(rad);
    }
  }
  /// Current additive normalization gain (1 = not attenuating; <1 = the
  /// 1/max(1, Σaₙ) peak bound is pulling levels down). Published from the
  /// render path for honest genStatus display.
  double additiveNorm() const { return addNormPub_.load(std::memory_order_relaxed); }
  /// Speaker-safety HPF cutoff in Hz (0 = bypassed) and whether it's engaged —
  /// published for honest genStatus display (the app shows the exact filter).
  double hpfHz() const { return hpfHz_.load(std::memory_order_relaxed); }
  bool hpfEngaged() const { return hpfHz_.load(std::memory_order_relaxed) > 0.0; }
  /// Q4 tap-through confirm — session-scoped unlock above the −12 dBFS cap.
  void unlockCap() { capUnlocked_.store(true); }
  void relockCap() { capUnlocked_.store(false); }
  void start() {
    // Retrigger FIRST so the render thread never sees running with stale
    // per-trigger state (review 2026-07-23: stop→start in Impulse mode stayed
    // silent forever; finished non-repeat sweeps restarted silent).
    retrigger_.store(true);
    running_.store(true);
  }
  void stop() { running_.store(false); }  // render fades out then silences

  bool running() const { return running_.load(); }
  bool capUnlocked() const { return capUnlocked_.load(); }
  /// The level actually applied after the Q4 cap (for honest UI display).
  double effectiveLevelDb() const {
    const double req = requestedDb_.load();
    const double cap = capUnlocked_.load() ? 0.0 : genlevel::kCapDb;
    return req > cap ? cap : req;
  }

  // ---- Render (audio thread) ----
  // Mono callers pass R = nullptr (fills L only — goldens + any mono path).
  // Stereo callers pass both deinterleaved L and R. When stereo playback is
  // engaged (stereoOn_ + a stereo caller) the two channels are INDEPENDENT sine
  // oscillators (stereoFreqL_/R_) — hard-panned tools like the Harmonograph
  // (harmonic n1 → Left, n2 → Right, matching the XY figure). Otherwise both
  // channels carry the same mono signal (L == R — perceptually identical to the
  // old mono output). Each channel has its own speaker-safety HPF state.
  void render(float* out, uint32_t n) { renderInto(out, nullptr, n); }
  void renderStereo(float* left, float* right, uint32_t n) { renderInto(left, right, n); }

  void renderInto(float* L, float* R, uint32_t n) {
    const double fs = fs_.load();
    const auto modeTarget = static_cast<GenMode>(mode_.load());
    const bool wantRun = running_.load() && modeTarget != GenMode::Off && fs > 0;
    const bool stereo = (R != nullptr) && stereoOn_.load();
    if (retrigger_.exchange(false)) {
      // A retrigger while AUDIBLE (in-place mode switch — HV-2 Build 3's solo
      // ↔ model retune idiom — sweep reprogram, stop→start overlap) must not
      // step the output: resetting the phase accumulators / snapping ramps
      // under a non-zero envelope is an instantaneous jump (worst case ~2×
      // amp — an audible pop even at −20 dBFS). Defer it: dip the 10 ms env
      // to 0, apply the reset at the bottom, fade back up. While silent,
      // apply immediately — the original start behavior, byte-identical.
      if (env_ > 0.0) trigPending_ = true;
      else applyTrigger(modeTarget);
    } else if (!trigPending_ && modeCur_ != modeTarget) {
      // Defensive: every setMode() sets retrigger_, but never adopt a new
      // mode without the same dip discipline.
      if (env_ > 0.0) trigPending_ = true;
      else applyTrigger(modeTarget);
    }
    const double ampTarget = std::pow(10.0, effectiveLevelDb() / 20.0);
    // One atomic load per render call (review 2026-07-23).
    const double fadeStep = 1.0 / static_cast<double>(fadeSamples_.load(std::memory_order_relaxed));
    // HV-2: level (gain) changes glide instead of stepping — slope-limited at
    // the kRampSec full-scale rate — same Q4 cap chain as before, only the
    // capped TARGET is ramped. While silent there is nothing to glide from,
    // so snap.
    const double rampSamples = fs * genadd::kRampSec;
    const double gainStep = 1.0 / (rampSamples < 1.0 ? 1.0 : rampSamples);
    if (env_ <= 0.0) ampCur_ = ampTarget;
    // Prepare when EITHER side of a pending switch is additive: targets must
    // be hoisted before a mid-block applyTrigger adopts the mode.
    if ((modeCur_ == GenMode::Additive || modeTarget == GenMode::Additive) && fs > 0)
      additivePrepare(fs);
    // FM hoist (same rationale — one atomic read per render call).
    if ((modeCur_ == GenMode::Fm || modeTarget == GenMode::Fm) && fs > 0) fmPrepare(fs);
    // Speaker-safety HPF. Read the cutoff once. Design the biquad when an ACTIVE
    // cutoff first appears / changes (fixed 150 Hz in practice → designed once);
    // a 0 (bypass, e.g. headphones) KEEPS the last design and rides the crossfade
    // below to zero mix. The ON/OFF is a short CROSSFADE between the raw and the
    // high-passed signal, never an abrupt insert — an abrupt one steps the low
    // end on a route change (speaker↔headphone) and clicks loudly. The biquad is
    // run every audible sample once designed, so its state never goes stale and a
    // re-engage never clicks either.
    const double hpfHz = hpfHz_.load(std::memory_order_relaxed);
    if (hpfHz > 0.0 && fs > 0.0 && (hpfHz != hpfDesignedHz_ || fs != hpfDesignedFs_)) {
      hpf_ = Biquad::highpass(hpfHz, fs);
      hpfR_ = hpf_;  // same coefficients; independent state for the R channel
      hpfDesignedHz_ = hpfHz;
      hpfDesignedFs_ = fs;
    }
    const bool hpfDesigned = hpfDesignedHz_ > 0.0;
    const double hpfMixTarget = (hpfHz > 0.0) ? 1.0 : 0.0;
    // ~40 ms linear raw↔filtered crossfade (route on/off), fixed-rate like the
    // amp/gain ramps.
    const double hpfMixStep = 1.0 / (fs * 0.040 < 1.0 ? 1.0 : fs * 0.040);
    // Route-change gate: fire ONLY on a mid-tone, audible cutoff change (env up
    // + running). At start hpfHz is set before the first audible sample and
    // applyTrigger has already synced prevHpfHz_, so the tone start is never
    // gated. A change while silent just snaps the crossfade.
    if (hpfHz != prevHpfHz_) {
      // Gate ONLY a steady-state route change. A change during the onset ramp
      // (the route layer sets the HPF right after start — a real ordering race)
      // just snaps the crossfade, masked by the low onset env — no gate, no puff.
      if (envSettled_ && wantRun && routeGatePhase_ == 0) routeGatePhase_ = 1;
      else hpfMix_ = hpfMixTarget;
      prevHpfHz_ = hpfHz;
    }
    const double gateOutStep = 1.0 / (fs * 0.004 < 1.0 ? 1.0 : fs * 0.004);  // ~4 ms mute
    const double gateInStep = 1.0 / (fs * 0.120 < 1.0 ? 1.0 : fs * 0.120);   // ~120 ms rolloff back
    const int gateHoldSamples = static_cast<int>(fs * 0.030);                 // ~30 ms silent hold
    for (uint32_t i = 0; i < n; ++i) {
      // Fade envelope toward the run target (click-free start/stop, Q4-safe);
      // a pending trigger holds the target at 0 until the reset has landed.
      const double target = (wantRun && !trigPending_) ? 1.0 : 0.0;
      if (env_ < target)
        env_ = env_ + fadeStep > target ? target : env_ + fadeStep;
      else if (env_ > target)
        env_ = env_ - fadeStep < target ? target : env_ - fadeStep;
      // Onset complete once the env reaches full — after this a route change may
      // gate (see the pre-loop gate trigger).
      if (wantRun && env_ >= 0.999) envSettled_ = true;
      if (trigPending_ && env_ <= 0.0) applyTrigger(modeTarget);
      if (env_ <= 0.0 && !wantRun) {
        L[i] = 0.0f;
        if (R) R[i] = 0.0f;
        continue;
      }
      ampCur_ = ramp(ampCur_, ampTarget, gainStep);
      // Raw signal(s): stereo = two independent sine oscillators (hard L/R);
      // mono = the selected mode, duplicated.
      double rawL, rawR;
      if (stereo) {
        rawL = stereoStep(stereoPhL_, stereoFreqL_.load(), fs);
        rawR = stereoStep(stereoPhR_, stereoFreqR_.load(), fs);
      } else {
        rawL = sample(modeCur_, fs);
        rawR = rawL;
      }
      // HPF sits on the raw signal, BEFORE the Q4 level/cap gain (the cap chain
      // ampCur_*env_ stays the single amplitude authority). Raw↔filtered is
      // crossfaded by hpfMix_ (shared) for click-free route on/off; the biquad
      // STATE is per-channel (hpf_ / hpfR_).
      double sL = rawL, sR = rawR;
      if (hpfDesigned) {
        hpfMix_ = hpfMix_ < hpfMixTarget
                      ? (hpfMix_ + hpfMixStep > hpfMixTarget ? hpfMixTarget : hpfMix_ + hpfMixStep)
                      : (hpfMix_ - hpfMixStep < hpfMixTarget ? hpfMixTarget : hpfMix_ - hpfMixStep);
        sL = rawL * (1.0 - hpfMix_) + static_cast<double>(hpf_.process(static_cast<float>(rawL))) * hpfMix_;
        sR = stereo ? rawR * (1.0 - hpfMix_) + static_cast<double>(hpfR_.process(static_cast<float>(rawR))) * hpfMix_
                    : sL;
      }
      // Route-change gate envelope: fast out → silent hold (snap the HPF here,
      // masked) → slow fade in.
      if (routeGatePhase_ == 1) {
        routeGate_ -= gateOutStep;
        if (routeGate_ <= 0.0) {
          routeGate_ = 0.0;
          hpfMix_ = hpfMixTarget;  // swap the filter while silent — inaudible
          routeGateHoldLeft_ = gateHoldSamples;
          routeGatePhase_ = 2;
        }
      } else if (routeGatePhase_ == 2) {
        if (--routeGateHoldLeft_ <= 0) routeGatePhase_ = 3;
      } else if (routeGatePhase_ == 3) {
        routeGate_ += gateInStep;
        if (routeGate_ >= 1.0) {
          routeGate_ = 1.0;
          routeGatePhase_ = 0;
        }
      }
      const double g = ampCur_ * env_ * routeGate_;
      L[i] = static_cast<float>(g * sL);
      if (R) R[i] = static_cast<float>(g * sR);
    }
  }

 private:
  // Per-trigger reset (render thread): deterministic generator state for the
  // (possibly new) mode. Only ever called with env_ at 0 — silent, or at the
  // bottom of the retrigger dip — so nothing here can step audible output.
  void applyTrigger(GenMode m) {
    modeCur_ = m;
    sweepPhase01_ = 0.0;
    clickTimer_ = 0.0;
    burstTimer_ = 0.0;
    impulseDone_ = false;
    // Additive: deterministic start (phase accumulators from 0) and snap the
    // ramps straight to their targets — the env fade covers the (re)start.
    // aT_/pT_ are fresh whenever m is Additive (additivePrepare hoists before
    // a mid-block trigger can adopt the mode); addSnap_ re-snaps from the
    // freshest targets on the next prepare regardless.
    for (uint32_t h = 0; h < genadd::kHarmonics; ++h) {
      addPhase_[h] = 0.0;
      aCur_[h] = aT_[h];
      pCur_[h] = pT_[h];
    }
    addSnap_ = true;
    // FM: deterministic strike — phases from 0, index decay restarted, the
    // ramping index snapped to its target (the env fade covers the (re)start).
    fmPhC_ = 0.0;
    fmPhM_ = 0.0;
    fmDecayEnv_ = 1.0;
    fmSnap_ = true;
    // Clean the HPF state on every (re)trigger — this only runs with env_ at 0
    // (silent), so clearing the biquad memory can't step audible output and a
    // re-engage never clicks from stale state. Snap the crossfade to the current
    // route (silent, so no click) — the 40 ms crossfade is only for MID-TONE
    // route changes, not for the start of a fresh tone.
    hpf_.reset();
    hpfR_.reset();
    stereoPhL_ = 0.0;
    stereoPhR_ = 0.0;
    hpfMix_ = (hpfHz_.load() > 0.0) ? 1.0 : 0.0;
    // Open the route gate and sync the change detector: a fresh tone starts at
    // full level with the correct filter, and its initial hpfHz (set before the
    // first audible sample) is NOT treated as a mid-tone route change.
    routeGate_ = 1.0;
    routeGatePhase_ = 0;
    envSettled_ = false;  // block the gate until this new tone's onset completes
    prevHpfHz_ = hpfHz_.load();
    trigPending_ = false;
  }

  // One stereo-channel sine sample; advances `phase` (in cycles) in place.
  double stereoStep(double& phase, double freq, double fs) {
    const double v = std::sin(2.0 * kPi * phase);
    phase += freq / fs;
    if (phase >= 1.0) phase -= std::floor(phase);
    return v;
  }

  // One raw sample of the selected signal at unit level.
  double sample(GenMode mode, double fs) {
    switch (mode) {
      case GenMode::Sine:
        return stepSine(freq_.load(), fs);
      case GenMode::White:
        return white();
      case GenMode::Pink:
        return pink();
      case GenMode::Brown:
        return brown();
      case GenMode::Blue:
        return blue();
      case GenMode::Violet:
        return violet();
      case GenMode::SweepLin:
      case GenMode::SweepLog: {
        const double s0 = sweepStart_.load(), s1 = sweepEnd_.load();
        const double dur = sweepSecs_.load();
        sweepPhase01_ += 1.0 / (fs * dur);
        if (sweepPhase01_ >= 1.0) {
          if (sweepRepeat_.load()) sweepPhase01_ -= 1.0;
          else {
            sweepPhase01_ = 1.0;
            return 0.0;  // finished, hold silent (env fade already applied)
          }
        }
        const double f = mode == GenMode::SweepLin
                             ? s0 + (s1 - s0) * sweepPhase01_
                             : s0 * std::pow(s1 / s0, sweepPhase01_);
        return stepSine(f, fs);
      }
      case GenMode::Impulse: {
        // Single one-sample unit impulse per trigger (timing demos).
        if (impulseDone_) return 0.0;
        impulseDone_ = true;
        return 1.0;
      }
      case GenMode::Click: {
        // Short 1 kHz ping repeating at the click BPM.
        const double interval = 60.0 / clickBpm_.load();
        clickTimer_ += 1.0 / fs;
        if (clickTimer_ >= interval) clickTimer_ -= interval;
        const double t = clickTimer_;
        if (t < 0.005) {
          const double win = 0.5 * (1.0 - std::cos(2.0 * kPi * t / 0.005));
          return win * std::sin(2.0 * kPi * 1000.0 * t);
        }
        return 0.0;
      }
      case GenMode::Burst: {
        // Tone burst: 50 ms on / 200 ms off at the set frequency.
        burstTimer_ += 1.0 / fs;
        if (burstTimer_ >= 0.25) burstTimer_ -= 0.25;
        if (burstTimer_ < 0.05) {
          const double win = 0.5 * (1.0 - std::cos(2.0 * kPi * burstTimer_ / 0.05));
          return win * stepSine(freq_.load(), fs);
        }
        stepSine(freq_.load(), fs);  // keep phase moving for continuity
        return 0.0;
      }
      case GenMode::Additive:
        return additiveSample(fs);
      case GenMode::Fm:
        return fmSample(fs);
      case GenMode::Off:
      default:
        return 0.0;
    }
  }

  // ---- ADDITIVE (HV-2) ----------------------------------------------------
  // Hoist the additive atomics ONCE per render call (idiom: one atomic read
  // per render) and refresh the ramp steps; publishes the current norm for
  // honest genStatus display. Called from render(), audio thread only.
  void additivePrepare(double fs) {
    addF0R_ = additiveF0_.load();
    for (uint32_t h = 0; h < genadd::kHarmonics; ++h) {
      aT_[h] = addAmpT_[h].load();
      pT_[h] = addPhaseT_[h].load();
    }
    const double rampSamples = fs * genadd::kRampSec;
    ampStep_ = 1.0 / (rampSamples < 1.0 ? 1.0 : rampSamples);
    // Fixed-rate CEILING for the phase slew (180° in ~8 ms); additiveSample
    // additionally caps each harmonic's step at kPhaseSlewDetune of its own
    // frequency so the slew never reads as a chirp at low f0.
    phStep_ = kPi * ampStep_;
    if (addSnap_) {
      addSnap_ = false;
      for (uint32_t h = 0; h < genadd::kHarmonics; ++h) {
        aCur_[h] = aT_[h];
        pCur_[h] = pT_[h];
      }
    }
    double sumA = 0.0;
    for (uint32_t h = 0; h < genadd::kHarmonics; ++h) sumA += aCur_[h];
    addNormPub_.store(1.0 / (sumA > 1.0 ? sumA : 1.0), std::memory_order_relaxed);
  }

  // One unit-level additive sample: norm × Σ aₙ·sin(2π·phaseₙ + φₙ).
  //  * Band-limited by construction: harmonics at/above Nyquist are silently
  //    omitted from the sum. Their accumulators keep stepping (Burst idiom,
  //    "keep phase moving") so the set stays coherent if f0 drops back down.
  //  * Phase-continuous retune: each accumulator steps by n·f0/fs exactly like
  //    stepSine, so f0 changes never reset phase.
  //  * norm is DERIVED each sample from the RAMPING amps — 1/max(1, Σ aCur) —
  //    not ramped independently. That makes it smooth by construction (the
  //    amps are piecewise-linear) AND keeps |sample| ≤ 1 even mid-transition;
  //    an independently ramped norm can transiently exceed the bound when
  //    amps fall while norm rises. The Σ intentionally includes Nyquist-
  //    omitted harmonics: strictly conservative, and norm stays stable when a
  //    retune sweeps harmonics across the Nyquist boundary.
  //  * Amp targets ramp linearly (slope-limited: ≤8 ms for a full 0→1 swing,
  //    proportionally faster for smaller changes); the phase OFFSET slews
  //    shortest-path at the LESSER of that fixed rate and a kPhaseSlewDetune
  //    (±5%) instantaneous detune of the harmonic's own frequency. The fixed
  //    rate alone is a constant 62.5 Hz offset — >100% of H1 at a low
  //    fundamental, i.e. a chirp; the per-harmonic cap keeps the slew a
  //    gentle bend at any f0 (180° flips finish in ~8 ms above ~1.25 kHz,
  //    slower but proportionally tiny below). Never a hard discontinuity.
  //  * Unit-level contract: render() applies gain/env exactly as for sine, so
  //    the Q4 cap chain covers this mode with no level logic here.
  double additiveSample(double fs) {
    const double nyq = fs * 0.5;
    double s = 0.0, sumA = 0.0;
    for (uint32_t h = 0; h < genadd::kHarmonics; ++h) {
      const double fh = addF0R_ * static_cast<double>(h + 1);
      addPhase_[h] += fh / fs;
      if (addPhase_[h] >= 1.0) addPhase_[h] -= std::floor(addPhase_[h]);
      aCur_[h] = ramp(aCur_[h], aT_[h], ampStep_);
      // Per-harmonic phase slew: fixed-rate ceiling (phStep_) capped at a
      // ±kPhaseSlewDetune instantaneous detune of THIS harmonic's frequency.
      double phStep = genadd::kPhaseSlewDetune * 2.0 * kPi * fh / fs;
      if (phStep > phStep_) phStep = phStep_;
      pCur_[h] = rampPhase(pCur_[h], pT_[h], phStep);
      sumA += aCur_[h];
      if (fh >= nyq || aCur_[h] <= 0.0) continue;
      s += aCur_[h] * std::sin(2.0 * kPi * addPhase_[h] + pCur_[h]);
    }
    return s * (1.0 / (sumA > 1.0 ? sumA : 1.0));
  }

  // ---- FM (wave-2) ---------------------------------------------------------
  // Hoist the FM atomics once per render call + refresh the per-sample decay
  // multiplier and index ramp step. Audio thread only.
  void fmPrepare(double fs) {
    fmRatioR_ = fmRatio_.load();
    fmIdxTR_ = fmIndexT_.load();
    const double decay = fmDecay_.load();
    // Per-sample exponential decay multiplier for the index envelope
    // (e^(−1/(fs·τ)) per sample ⇒ e^(−t/τ) overall); 1.0 = sustained.
    fmDecayMul_ = decay > 0.0 ? std::exp(-1.0 / (fs * decay)) : 1.0;
    const double rampSamples = fs * genfm::kIndexRampSec;
    fmIdxStep_ = genfm::kMaxIndex / (rampSamples < 1.0 ? 1.0 : rampSamples);
    if (fmSnap_) {
      fmSnap_ = false;
      fmIdxCur_ = fmIdxTR_;
    }
  }

  // One unit-level FM sample: sin(2π·φc + I(t)·sin(2π·φm)) with fm = ratio·fc
  // (Chowning FM — sidebands at fc ± k·fm with amplitudes J_k(I)).
  //  * Phase-continuous: both accumulators step like stepSine, so carrier or
  //    ratio changes glide without a phase reset.
  //  * I(t) = (ramped index target) × (per-trigger exponential decay env) —
  //    the classic "brightness fades" bell/pluck; a retrigger is the strike.
  //  * No internal band-limiting: Carson bandwidth ≈ 2·fm·(I+1) CAN cross
  //    Nyquist at extreme settings — the lab UI displays that bound honestly
  //    (aliasing is itself taught in the Distortion lab).
  //  * Unit-level contract: render() applies gain/env exactly as for sine, so
  //    the Q4 cap chain covers this mode (|sin| ≤ 1 by construction).
  double fmSample(double fs) {
    fmIdxCur_ = ramp(fmIdxCur_, fmIdxTR_, fmIdxStep_);
    if (fmDecayMul_ < 1.0) fmDecayEnv_ *= fmDecayMul_;
    const double I = fmIdxCur_ * fmDecayEnv_;
    const double fc = freq_.load();
    const double fm = fc * fmRatioR_;
    const double y = std::sin(2.0 * kPi * fmPhC_ + I * std::sin(2.0 * kPi * fmPhM_));
    fmPhC_ += fc / fs;
    if (fmPhC_ >= 1.0) fmPhC_ -= std::floor(fmPhC_);
    fmPhM_ += fm / fs;
    if (fmPhM_ >= 1.0) fmPhM_ -= std::floor(fmPhM_);
    return y;
  }

  // Linear ramp toward target, clamped (never overshoots, no denormal tail —
  // it lands exactly on the target).
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

  // Shortest-path phase slew on the circle, state kept in [0, 2π).
  static inline double rampPhase(double cur, double target, double step) {
    double d = target - cur;
    if (d > kPi)
      d -= 2.0 * kPi;
    else if (d < -kPi)
      d += 2.0 * kPi;
    if (d > step)
      cur += step;
    else if (d < -step)
      cur -= step;
    else
      return target;
    if (cur >= 2.0 * kPi)
      cur -= 2.0 * kPi;
    else if (cur < 0.0)
      cur += 2.0 * kPi;
    return cur;
  }

  inline double stepSine(double f, double fs) {
    phase_ += f / fs;
    if (phase_ >= 1.0) phase_ -= std::floor(phase_);
    return std::sin(2.0 * kPi * phase_);
  }

  // xorshift32 white noise in [-1, 1).
  inline double white() {
    uint32_t x = rng_;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    rng_ = x;
    return (static_cast<double>(x) / 2147483648.0) - 1.0;
  }

  // Paul Kellet pink-noise filter (−3 dB/oct), ~0 dB matched level.
  inline double pink() {
    const double w = white();
    pk0_ = 0.99886 * pk0_ + w * 0.0555179;
    pk1_ = 0.99332 * pk1_ + w * 0.0750759;
    pk2_ = 0.96900 * pk2_ + w * 0.1538520;
    pk3_ = 0.86650 * pk3_ + w * 0.3104856;
    pk4_ = 0.55000 * pk4_ + w * 0.5329522;
    pk5_ = -0.7616 * pk5_ - w * 0.0168980;
    const double p = pk0_ + pk1_ + pk2_ + pk3_ + pk4_ + pk5_ + pk6_ + w * 0.5362;
    pk6_ = w * 0.115926;
    return p * 0.11;  // scale into ~[-1,1]
  }

  // Brown (red, −6 dB/oct): leaky integration of white.
  inline double brown() {
    br_ = 0.998 * br_ + 0.02 * white();
    const double v = br_ * 8.0;
    return v > 1.0 ? 1.0 : (v < -1.0 ? -1.0 : v);
  }

  // Blue (+3 dB/oct): differentiated pink; Violet (+6 dB/oct): differentiated white.
  inline double blue() {
    const double p = pink();
    const double v = (p - lastPink_) * 4.0;
    lastPink_ = p;
    return v > 1.0 ? 1.0 : (v < -1.0 ? -1.0 : v);
  }
  inline double violet() {
    const double w = white();
    const double v = (w - lastWhite_) * 0.5;
    lastWhite_ = w;
    return v;
  }

  static constexpr double kPi = 3.14159265358979323846;

  // Control atomics (bridge writes, render reads).
  std::atomic<double> fs_{48000.0};
  std::atomic<int> mode_{0};
  std::atomic<double> freq_{1000.0};
  std::atomic<double> requestedDb_{genlevel::kDefaultDb};
  std::atomic<bool> capUnlocked_{false};
  std::atomic<bool> running_{false};
  std::atomic<bool> retrigger_{false};
  std::atomic<double> sweepStart_{20.0}, sweepEnd_{20000.0}, sweepSecs_{5.0};
  std::atomic<bool> sweepRepeat_{true};
  std::atomic<double> clickBpm_{120.0};
  // Speaker-safety HPF cutoff (Hz), 0 = bypassed. Route layer writes it.
  std::atomic<double> hpfHz_{0.0};
  // Stereo dual-oscillator (hard-panned L/R) — off by default (mono, L == R).
  std::atomic<bool> stereoOn_{false};
  std::atomic<double> stereoFreqL_{440.0}, stereoFreqR_{440.0};

  // Additive (HV-2) control atomics — TARGETS only; render ramps toward them.
  // Defaults: fundamental only (a1=1), phases 0, f0 1 kHz.
  std::atomic<double> additiveF0_{1000.0};
  std::atomic<double> addAmpT_[genadd::kHarmonics] = {{1.0}, {0.0}, {0.0}, {0.0},
                                                     {0.0}, {0.0}, {0.0}, {0.0},
                                                     {0.0}, {0.0}, {0.0}, {0.0}};
  std::atomic<double> addPhaseT_[genadd::kHarmonics] = {{0.0}, {0.0}, {0.0}, {0.0},
                                                       {0.0}, {0.0}, {0.0}, {0.0},
                                                       {0.0}, {0.0}, {0.0}, {0.0}};
  // Published norm (render writes, bridge reads for genStatus).
  std::atomic<double> addNormPub_{1.0};

  // FM voice (wave-2) control atomics — defaults: ratio 2, index 4, sustained.
  std::atomic<double> fmRatio_{2.0};
  std::atomic<double> fmIndexT_{4.0};
  std::atomic<double> fmDecay_{0.0};

  // Fade length (bridge writes via configure, render reads — atomic).
  std::atomic<uint32_t> fadeSamples_{480};

  // Render-thread state (audio thread only).
  double env_ = 0.0;
  // The mode actually RENDERED. mode_ (the atomic) is the target; adoption
  // happens only in applyTrigger with env_ at 0, so a running mode switch
  // keeps rendering the old waveform through the dip (click-free).
  GenMode modeCur_ = GenMode::Off;
  bool trigPending_ = false;  // retrigger deferred until the env dips to 0
  double ampCur_ = 0.0;  // slope-limited gain ramp state (all modes)
  double phase_ = 0.0;
  // Additive render-thread state.
  double addPhase_[genadd::kHarmonics] = {};  // per-harmonic accumulators (cycles)
  double aCur_[genadd::kHarmonics] = {};      // ramping amps
  double pCur_[genadd::kHarmonics] = {};      // slewing phase offsets (rad)
  double aT_[genadd::kHarmonics] = {};        // targets hoisted per render call
  double pT_[genadd::kHarmonics] = {};
  double addF0R_ = 1000.0;
  double ampStep_ = 1.0 / 384.0, phStep_ = kPi / 384.0;
  bool addSnap_ = true;
  // FM render-thread state.
  double fmPhC_ = 0.0, fmPhM_ = 0.0;  // carrier/modulator accumulators (cycles)
  double fmIdxCur_ = 0.0;             // ramping index
  double fmDecayEnv_ = 1.0;           // per-trigger exponential index envelope
  double fmRatioR_ = 2.0, fmIdxTR_ = 4.0, fmDecayMul_ = 1.0, fmIdxStep_ = 1.0;
  bool fmSnap_ = true;
  // Speaker-safety HPF render state (audio thread). Re-designed only when the
  // cutoff or sample rate changes; default coeffs are a no-op pass-through.
  Biquad hpf_;
  Biquad hpfR_;          // R-channel HPF (same coeffs, independent state)
  double hpfDesignedHz_ = 0.0;
  double hpfDesignedFs_ = 0.0;
  double hpfMix_ = 0.0;  // raw↔filtered crossfade (0 = bypassed, 1 = filtered)
  double stereoPhL_ = 0.0, stereoPhR_ = 0.0;  // stereo sine accumulators (cycles)
  // Route-change GATE: a mid-tone cutoff change (headphone plug/unplug) mutes
  // the output fast, holds silent while the HPF swaps + the OS route settles,
  // then fades back in slowly — masking the filter transition AND the hardware
  // route-switch transient (a crossfade alone can't hide the latter). Idle
  // (phase 0, gate 1.0) it is a no-op.
  double routeGate_ = 1.0;    // output multiplier
  int routeGatePhase_ = 0;    // 0 idle · 1 fade-out · 2 hold · 3 fade-in
  int routeGateHoldLeft_ = 0;
  double prevHpfHz_ = 0.0;    // detects a route-driven cutoff change
  bool envSettled_ = false;   // env has reached full since the last trigger —
                              // gate only a STEADY-STATE route change, never one
                              // that lands during the onset ramp (that would
                              // duck the tone start = a soft "puff").
  double sweepPhase01_ = 0.0;
  double clickTimer_ = 0.0;
  double burstTimer_ = 0.0;
  bool impulseDone_ = false;
  uint32_t rng_ = 0x9e3779b9;
  double pk0_ = 0, pk1_ = 0, pk2_ = 0, pk3_ = 0, pk4_ = 0, pk5_ = 0, pk6_ = 0;
  double br_ = 0, lastPink_ = 0, lastWhite_ = 0;
};

}  // namespace apedsp
