/**
 * ampModel — the Amplifier Principles Lab's centralized calculation and
 * simulation core (build spec Part 3 §1–§4).
 *
 * Pure functions, no React, no UI. Two kinds of values leave this module:
 *  - CALCULATED values from valid equations (gain, dB, RMS, power, impedance,
 *    transformer ratios, efficiency) — correct units, guarded inputs;
 *  - CONCEPTUAL values normalized 0..1 for teaching (relative heat, device
 *    stress, energy flow) — the UI must label these "relative"/"illustrative".
 *
 * The class models are EDUCATIONAL models, not transistor-level circuit
 * simulations, and the UI labels them so. Deterministic: same inputs, same
 * outputs. Verified by test/ampModel.test.ts (npm test).
 */

/* ── numeric guards ─────────────────────────────────────────────────────── */

export const isFiniteNum = (v: number): boolean => typeof v === 'number' && Number.isFinite(v);

/** Positive finite number, else null — invalid values never reach the UI. */
const pos = (v: number): number | null => (isFiniteNum(v) && v > 0 ? v : null);

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/* ── gain and decibels (Part 3 §4) ──────────────────────────────────────── */

/** Voltage gain Av = Vout/Vin. Null when Vin is not a positive finite value. */
export function voltageGain(vin: number, vout: number): number | null {
  if (pos(vin) == null || !isFiniteNum(vout) || vout < 0) return null;
  return vout / vin;
}

/** 20·log10 of a voltage ratio. Null for non-positive ratios. */
export function voltageGainDb(ratio: number): number | null {
  if (pos(ratio) == null) return null;
  return 20 * Math.log10(ratio);
}

/** Power gain Ap = Pout/Pin. Null for invalid inputs. */
export function powerGain(pin: number, pout: number): number | null {
  if (pos(pin) == null || !isFiniteNum(pout) || pout < 0) return null;
  return pout / pin;
}

/** 10·log10 of a power ratio. Null for non-positive ratios. */
export function powerGainDb(ratio: number): number | null {
  if (pos(ratio) == null) return null;
  return 10 * Math.log10(ratio);
}

/** Level change between two powers: ΔdB = 10·log10(P2/P1). */
export function powerDeltaDb(p1: number, p2: number): number | null {
  if (pos(p1) == null || pos(p2) == null) return null;
  return 10 * Math.log10(p2 / p1);
}

/* ── RMS and resistive-load power (labeled resistive TEACHING examples) ─── */

export function sineVrms(vpeak: number): number | null {
  if (!isFiniteNum(vpeak) || vpeak < 0) return null;
  return vpeak / Math.SQRT2;
}

export function ohmsCurrent(v: number, r: number): number | null {
  const R = pos(r);
  if (R == null || !isFiniteNum(v)) return null;
  return v / R;
}

/** P = Vrms²/R for a defined resistive teaching load. */
export function resistivePower(vrms: number, r: number): number | null {
  const R = pos(r);
  if (R == null || !isFiniteNum(vrms) || vrms < 0) return null;
  return (vrms * vrms) / R;
}

/* ── series / parallel loads ────────────────────────────────────────────── */

export function seriesImpedance(zs: number[]): number | null {
  if (!zs.length) return null;
  let t = 0;
  for (const z of zs) {
    const Z = pos(z);
    if (Z == null) return null;
    t += Z;
  }
  return t;
}

export function parallelImpedance(zs: number[]): number | null {
  if (!zs.length) return null;
  let inv = 0;
  for (const z of zs) {
    const Z = pos(z);
    if (Z == null) return null;
    inv += 1 / Z;
  }
  return inv > 0 ? 1 / inv : null;
}

/* ── transformer (ideal relationships; real transformers have losses) ───── */

export type TransformerResult = {
  /** Vp/Vs = Np/Ns */
  voltageRatio: number;
  /** Vs for a given Vp */
  vs: number;
  /** Zp/Zs = (Np/Ns)² */
  impedanceRatio: number;
  /** Reflected primary-side impedance for a given secondary load. */
  zReflected: number | null;
  /** Ideal secondary current for a given primary current (inverse ratio). */
  isFromIp: (ip: number) => number;
  kind: 'step-up' | 'step-down' | 'isolation';
};

export function transformer(np: number, ns: number, vp: number, zs?: number): TransformerResult | null {
  const NP = pos(np), NS = pos(ns);
  if (NP == null || NS == null || !isFiniteNum(vp) || vp < 0) return null;
  const ratio = NP / NS;
  const vs = vp / ratio;
  const zRatio = ratio * ratio;
  return {
    voltageRatio: ratio,
    vs,
    impedanceRatio: zRatio,
    zReflected: zs != null && pos(zs) != null ? zs * zRatio : null,
    isFromIp: (ip: number) => ip * ratio,
    kind: ratio < 1 ? 'step-up' : ratio > 1 ? 'step-down' : 'isolation',
  };
}

/** Ideal check the UI relies on: output power never exceeds input power. */
export function transformerIdealPowerOk(vp: number, ip: number, np: number, ns: number): boolean {
  const t = transformer(np, ns, vp);
  if (!t || !isFiniteNum(ip) || ip < 0) return false;
  const pIn = vp * ip;
  const pOut = t.vs * (ip * t.voltageRatio);
  return pOut <= pIn + 1e-9;
}

/* ── efficiency and loss ────────────────────────────────────────────────── */

export type Efficiency = { etaPct: number; lossW: number };

/** η = Pout/Pin, constrained to physical range. Null when inputs invalid. */
export function efficiency(pinW: number, poutW: number): Efficiency | null {
  if (!isFiniteNum(pinW) || !isFiniteNum(poutW) || pinW < 0 || poutW < 0) return null;
  if (pinW === 0) return poutW === 0 ? { etaPct: 0, lossW: 0 } : null;
  if (poutW > pinW) return null; // the modeled complete amplifier cannot exceed unity
  return { etaPct: clamp((poutW / pinW) * 100, 0, 100), lossW: pinW - poutW };
}

/* ── bridged operation (conceptual ideal bridge) ────────────────────────── */

export type BridgeResult = {
  /** Vload = VchA − VchB (equal/opposite drive → approaches 2× one channel). */
  vLoad: number;
  /** Each channel sees ≈ half the bridged load impedance. */
  effectivePerChannelZ: number;
};

export function bridge(vA: number, vB: number, loadZ: number): BridgeResult | null {
  const Z = pos(loadZ);
  if (Z == null || !isFiniteNum(vA) || !isFiniteNum(vB)) return null;
  return { vLoad: vA - vB, effectivePerChannelZ: Z / 2 };
}

/* ── shared signal model (Part 3 §2) ────────────────────────────────────── */

export const WAVE_N = 256; // one 360° cycle, enough points for any display

/** One cycle of A·sin(2πt), t in [0,1). Deterministic. */
export function sineCycle(amplitude: number, n = WAVE_N): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((2 * Math.PI * i) / n);
  return out;
}

/** y = clamp(G·x, −vLimit, +vLimit) — symmetrical rail clipping. */
export function amplify(x: Float32Array, gain: number, vLimit: number): Float32Array {
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = clamp(gain * x[i], -vLimit, vLimit);
  return out;
}

export function isClipping(x: Float32Array, gain: number, vLimit: number): boolean {
  for (let i = 0; i < x.length; i++) if (Math.abs(gain * x[i]) > vLimit) return true;
  return false;
}

/** RMS of a cycle buffer (for level-derived displays). */
export function cycleRms(x: Float32Array): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}

/* ── bias and conduction (Module 3 — educational) ───────────────────────── */

export type BiasSim = {
  /** AC-coupled output: what the load hears. */
  out: Float32Array;
  /** Device current (≥ 0, conceptual): quiescent level + signal swing. */
  iDev: Float32Array;
  /** Which educational region the operating point sits in. */
  region: 'cutoff' | 'linear' | 'saturation';
  idleCurrent: number; // conceptual 0..1
  heat: number; // relative 0..1
  /** True when part of the waveform is lost to cutoff or saturation. */
  distorted: boolean;
};

/**
 * Single active device with an adjustable operating point. bias 0..1 sets
 * the quiescent current; the device can only conduct between 0 (cutoff) and
 * 1 (fully driven / saturation), so too little bias clips one half of the
 * swing and too much clips the other — with more idle current and heat.
 */
export function simulateSingleDeviceBias(drive: number, bias: number, n = WAVE_N): BiasSim {
  const d = clamp(drive, 0, 1);
  const q = clamp(bias, 0, 1);
  const x = sineCycle(d * 0.5, n); // ±0.5 swing around the operating point
  const iDev = new Float32Array(n);
  const out = new Float32Array(n);
  let lostLow = false, lostHigh = false;
  for (let i = 0; i < n; i++) {
    const raw = q + x[i];
    const c = clamp(raw, 0, 1);
    if (raw < 0) lostLow = true;
    if (raw > 1) lostHigh = true;
    iDev[i] = c;
    out[i] = (c - q) * 2; // AC-coupled, back to ±1 units
  }
  const region = q < 0.25 ? 'cutoff' : q > 0.75 ? 'saturation' : 'linear';
  return {
    out, iDev, region,
    idleCurrent: q,
    heat: clamp(0.1 + 0.7 * q + 0.15 * d, 0, 1),
    distorted: lostLow || lostHigh,
  };
}

/**
 * Device current for a stated conduction angle on a unit sine: the device
 * conducts while sin(φ) exceeds a threshold, so 360° ↔ always, 180° ↔ the
 * positive half, 90° ↔ only near the peak.
 */
export function conductionCurrent(angleDeg: number, n = WAVE_N): { iDev: Float32Array; threshold: number } {
  const a = clamp(angleDeg, 1, 360);
  // Conducts where sin(φ) > threshold. The arc where sin exceeds t spans
  // 180° − 2·asin(t), so t = cos(a·π/360): 360° → −1, 180° → 0, 90° → 0.707.
  const threshold = Math.cos((a / 360) * Math.PI);
  const iDev = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = Math.sin((2 * Math.PI * i) / n);
    iDev[i] = Math.max(0, s - threshold);
  }
  return { iDev, threshold };
}

/* ── amplifier-class models (Part 3 §3 — educational, labeled so) ───────── */

export type AmpClass = 'A' | 'B' | 'AB' | 'C' | 'D';

export type ClassSim = {
  /** Output voltage waveform (normalized to input peak = 1 at unity drive). */
  out: Float32Array;
  /** Positive-side device current (conceptual units, ≥ 0). */
  iPos: Float32Array;
  /** Negative-side device current (conceptual units, ≥ 0). */
  iNeg: Float32Array;
  /** Degrees of the cycle each device conducts (per device). */
  conductionDeg: number;
  /** Idle (zero-signal) device current, conceptual units. */
  idleCurrent: number;
  /** Illustrative efficiency at THIS drive level, % (never a fixed maximum). */
  efficiencyPct: number;
  /** Relative heat 0..1 — NORMALIZED teaching value, includes idle loss. */
  heat: number;
  /** True when a visible crossover notch exists near zero crossing. */
  crossoverNotch: boolean;
};

/**
 * Class A/B/AB share one push-pull-capable model. `bias` is 0..1:
 *   - Class A ignores it (single device conducts the full cycle).
 *   - Class B is the bias=0 end (each device needs |v| > deadZone to conduct).
 *   - Class AB is bias>0: the dead zone shrinks to nothing and overlap grows.
 * `drive` is 0..1 of full output.
 */
export function simulateLinearClass(cls: 'A' | 'B' | 'AB', drive: number, bias: number, n = WAVE_N): ClassSim {
  const d = clamp(drive, 0, 1);
  const b = clamp(bias, 0, 1);
  const x = sineCycle(d, n);
  const out = new Float32Array(n);
  const iPos = new Float32Array(n);
  const iNeg = new Float32Array(n);

  if (cls === 'A') {
    // Single device, quiescent current large enough to pass the whole wave.
    const iq = 1.0; // conceptual quiescent current (normalized)
    for (let i = 0; i < n; i++) {
      out[i] = x[i];
      iPos[i] = iq + x[i]; // conducts the ENTIRE cycle
      iNeg[i] = 0;
    }
    // Illustrative efficiency: rises with drive, small at idle, far below the
    // theoretical 25%/50% maxima at ordinary levels.
    const eff = 25 * d * d;
    return {
      out, iPos, iNeg,
      conductionDeg: 360,
      idleCurrent: iq,
      efficiencyPct: eff,
      heat: clamp(0.55 + 0.2 * d, 0, 1), // idle dissipation dominates
      crossoverNotch: false,
    };
  }

  // Push-pull. Class B: each device conducts only past a dead zone, so the
  // handoff leaves a notch AT ZERO CROSSING. Class AB: bias shrinks the dead
  // zone and extends each device's conduction PAST zero (overlap), trading
  // idle current and heat for a clean handoff.
  const deadZone = cls === 'B' ? 0.1 : clamp(0.1 * (1 - b), 0, 0.1);
  const overlap = cls === 'AB' ? 0.12 * b : 0; // how far past zero each device conducts
  const effDead = Math.max(0, deadZone - overlap);
  const iq = overlap * 0.8; // idle current grows with overlap
  let notch = false;
  let posConducting = 0;
  for (let i = 0; i < n; i++) {
    const v = x[i];
    const posDrive = Math.max(0, v + overlap - effDead);
    const negDrive = Math.max(0, -v + overlap - effDead);
    iPos[i] = iq + posDrive;
    iNeg[i] = iq + negDrive;
    if (posDrive > 0) posConducting++;
    if (v > effDead) out[i] = v - effDead;
    else if (v < -effDead) out[i] = v + effDead;
    else out[i] = 0;
    if (effDead > 0.005 && Math.abs(v) <= effDead && d > effDead) notch = true;
  }
  const eff = cls === 'B' ? 60 * d : 55 * d - 8 * b * d;
  return {
    out, iPos, iNeg,
    conductionDeg: clamp((posConducting / n) * 360, 0, 360),
    idleCurrent: iq,
    efficiencyPct: clamp(eff, 0, 78.5),
    heat: clamp(0.12 + 0.35 * d + 0.3 * iq, 0, 1),
    crossoverNotch: notch,
  };
}

/**
 * Class C — conduction well under 180°, pulsed device current, and a tuned
 * resonant circuit that recovers a sine ONLY near its tuned frequency.
 * `detune` = fTuned/fSignal (1 = tuned). Educational resonance model.
 */
export function simulateClassC(drive: number, detune: number, n = WAVE_N): ClassSim & { recovered: Float32Array; resonanceGain: number } {
  const d = clamp(drive, 0, 1);
  const x = sineCycle(d, n);
  const iPos = new Float32Array(n);
  const iNeg = new Float32Array(n);
  const out = new Float32Array(n);
  const threshold = 0.55 * d + 0.2; // conducts only near positive peaks
  let conducting = 0;
  for (let i = 0; i < n; i++) {
    const c = x[i] > threshold ? x[i] - threshold : 0;
    iPos[i] = c;
    out[i] = c; // RAW pulsed output before the tank
    if (c > 0) conducting++;
  }
  // Resonant recovery: a simple quality-factor response around the tuned freq.
  const q = 8;
  const dt = Math.max(detune, 1e-3);
  const resonanceGain = 1 / Math.sqrt(1 + q * q * Math.pow(dt - 1 / dt, 2));
  const recovered = sineCycle(d * resonanceGain, n);
  return {
    out, iPos, iNeg,
    conductionDeg: (conducting / n) * 360,
    idleCurrent: 0,
    efficiencyPct: clamp(80 * resonanceGain * d, 0, 90),
    heat: clamp(0.1 + 0.2 * d * (1 - resonanceGain), 0, 1),
    crossoverNotch: false,
    recovered,
    resonanceGain,
  };
}

export type ClassDSim = {
  /** The audio/control waveform. */
  audio: Float32Array;
  /** Triangular carrier (visually slowed — label it). */
  carrier: Float32Array;
  /** PWM comparator result: +1 / −1 per sample. */
  pwm: Float32Array;
  /** Low-pass reconstructed output. */
  recovered: Float32Array;
  /** Duty cycle averaged over the cycle, 0..1 (0.5 = silence). */
  meanDuty: number;
  /** Illustrative efficiency, % — NEVER 100. */
  efficiencyPct: number;
  heat: number;
};

/**
 * Class D PWM teaching model: compare the audio wave against a triangle
 * carrier (carrierRatio cycles per audio cycle — reduced for visibility),
 * then low-pass the switch states back into audio.
 */
export function simulateClassD(drive: number, carrierRatio = 12, n = WAVE_N): ClassDSim {
  const d = clamp(drive, 0, 0.95);
  const audio = sineCycle(d, n);
  const carrier = new Float32Array(n);
  const pwm = new Float32Array(n);
  const recovered = new Float32Array(n);
  let high = 0;
  for (let i = 0; i < n; i++) {
    const ph = ((i * carrierRatio) / n) % 1;
    carrier[i] = 4 * Math.abs(ph - 0.5) - 1; // triangle −1..+1
    pwm[i] = audio[i] > carrier[i] ? 1 : -1;
    if (pwm[i] > 0) high++;
  }
  // One-pole low-pass run twice for a cleaner reconstruction (educational).
  const a = 0.18;
  let y = 0;
  const tmp = new Float32Array(n);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? pwm : tmp;
    const dst = pass === 0 ? tmp : recovered;
    y = 0;
    // Warm up on the cycle once so the loop's seam does not show.
    for (let i = 0; i < n; i++) y = y + a * (src[i] - y);
    for (let i = 0; i < n; i++) {
      y = y + a * (src[i] - y);
      dst[i] = y;
    }
  }
  return {
    audio, carrier, pwm, recovered,
    meanDuty: high / n,
    // Illustrative: high but explicitly lossy (conduction + switching + gate
    // drive + filter). Never fixed at 100.
    efficiencyPct: clamp(88 - 6 * (1 - d), 60, 92),
    heat: clamp(0.08 + 0.12 * d, 0, 1),
  };
}

/* ── protection priority (Part 3 §7 — educational feedback order) ───────── */

export type FaultId =
  | 'short'
  | 'bad-bridge'
  | 'load-below-min'
  | 'overcurrent'
  | 'dc-protect'
  | 'thermal-shutdown'
  | 'thermal-limiting'
  | 'output-clipping'
  | 'upstream-clipping'
  | 'poor-gain-structure';

const FAULT_PRIORITY: FaultId[] = [
  'short', 'bad-bridge', 'load-below-min', 'overcurrent', 'dc-protect',
  'thermal-shutdown', 'thermal-limiting', 'output-clipping',
  'upstream-clipping', 'poor-gain-structure',
];

export type ProtectionVerdict = {
  primary: FaultId | null;
  secondary: FaultId[];
};

/** Order active faults by teaching priority: one primary, the rest listed. */
export function prioritizeFaults(active: FaultId[]): ProtectionVerdict {
  const seen = new Set(active);
  const ordered = FAULT_PRIORITY.filter((f) => seen.has(f));
  return { primary: ordered[0] ?? null, secondary: ordered.slice(1) };
}

/* ── gain structure (Module 7) ──────────────────────────────────────────── */

export type GainStage = 'source' | 'mixer' | 'amp';

export type GainStructure = {
  /** Relative level leaving each stage, 1.0 = that stage's clip point. */
  levels: Record<GainStage, number>;
  /** The FIRST stage that clips, or null. */
  firstClip: GainStage | null;
  /** Stage output is unhealthily low (noise floor creeps up). */
  starved: GainStage | null;
};

/**
 * Three-stage chain. Each control scales its stage; a stage cannot pass more
 * than its own clip point (1.0) downstream, so a hot source clips the SOURCE,
 * not the amplifier — turning the amplifier down cannot fix it.
 */
export function evaluateGainStructure(source: number, mixer: number, ampInput: number, railLimit = 1): GainStructure {
  const s = clamp(source, 0, 1) * 1.6;
  const m = Math.min(s, 1) * clamp(mixer, 0, 1) * 1.6;
  const a = (Math.min(m, 1) * clamp(ampInput, 0, 1) * 1.6) / Math.max(railLimit, 0.05);
  const levels = { source: s, mixer: m, amp: a };
  const firstClip = s > 1 ? 'source' : m > 1 ? 'mixer' : a > 1 ? 'amp' : null;
  const starved = s > 0 && s < 0.15 ? 'source' : m > 0 && m < 0.15 ? 'mixer' : null;
  return { levels, firstClip, starved };
}

/* ── operating-condition evaluation (rig/challenge scenarios) ───────────── */

export type RigState = {
  /** Source/mixer/amp-input drive levels 0..1 (upstream chain). */
  sourceLevel: number;
  mixerLevel: number;
  ampInput: number;
  /** Rail limit as a fraction of full modeled output, 0.2..1. */
  railLimit: number;
  /** Modeled nominal load in ohms. */
  loadZ: number;
  /** Amplifier minimum rated load in ohms (per channel, stereo mode). */
  minLoadZ: number;
  bridged: boolean;
  bridgeSupported: boolean;
  /** 0 = clear vents, 1 = fully blocked. */
  ventBlocked: number;
  /** Using instrument cable in the speaker path. */
  instrumentCable: boolean;
  /** Output wiring shorted. */
  shorted: boolean;
};

export type RigVerdict = ProtectionVerdict & {
  upstreamClips: boolean;
  outputClips: boolean;
  effectiveLoadZ: number | null;
  currentDemand: number; // relative 0..1 — conceptual
  thermal: number; // relative 0..1 — conceptual
};

export function evaluateRig(s: RigState): RigVerdict {
  const faults: FaultId[] = [];
  const upstreamDrive = s.sourceLevel * s.mixerLevel * 2.2;
  const upstreamClips = upstreamDrive > 1;
  const demanded = Math.min(upstreamDrive, 1) * s.ampInput * 1.6;
  const outputClips = demanded > s.railLimit;
  const effectiveLoadZ = s.bridged ? s.loadZ / 2 : s.loadZ;
  const currentDemand = clamp((Math.min(demanded, s.railLimit) * 8) / Math.max(effectiveLoadZ, 0.5), 0, 1);
  const thermal = clamp(currentDemand * (0.5 + 0.8 * s.ventBlocked) + 0.25 * s.ventBlocked, 0, 1);

  if (s.shorted) faults.push('short');
  if (s.bridged && !s.bridgeSupported) faults.push('bad-bridge');
  if (effectiveLoadZ < s.minLoadZ - 1e-9) faults.push('load-below-min');
  if (currentDemand >= 0.98) faults.push('overcurrent');
  if (thermal >= 0.95) faults.push('thermal-shutdown');
  else if (thermal >= 0.75) faults.push('thermal-limiting');
  if (outputClips) faults.push('output-clipping');
  if (upstreamClips) faults.push('upstream-clipping');
  if (!upstreamClips && !outputClips && demanded > 0 && demanded < 0.15) faults.push('poor-gain-structure');

  return { ...prioritizeFaults(faults), upstreamClips, outputClips, effectiveLoadZ, currentDemand, thermal };
}
