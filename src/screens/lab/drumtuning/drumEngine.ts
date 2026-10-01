/**
 * Drum Tuning Lab — the PURE ENGINE (owner spec 2026-10-01). No React, no
 * Metro-only imports, so every rule is unit-tested in node
 * (test/drumTuningEngine.test.ts).
 *
 * WHAT IS PHYSICS, WHAT IS SIMPLIFIED (every display badge says so):
 *
 *  • A HEAD is an ideal clamped circular membrane. Its modes sit at the
 *    Bessel-zero ratios j_ns / j_01 — (0,1) = 1, (1,1) ≈ 1.594,
 *    (2,1) ≈ 2.136, (0,2) ≈ 2.296, (3,1) ≈ 2.653 … — read from the same
 *    J_n zero table the Cymatics Lab uses. CALCULATED.
 *  • PITCH: f_01 = (j_01 / 2πR) · √(T / σ), so f ∝ √T / D. More tension,
 *    higher pitch; a bigger head, lower. CALCULATED.
 *  • LUG-TO-LUG TENSION is a map around the rim, one value per rod. The mean
 *    sets the pitch; the UNEVENNESS splits every degenerate (n ≥ 1) mode
 *    into a pair, by first-order perturbation theory: the pair of cos nθ /
 *    sin nθ shapes feels the 2n-th angular harmonic of the tension map, so
 *    the split is (f_hi − f_lo) / f ≈ |c_2n| / (2 T̄) (half from f ∝ √T).
 *    The two tones BEAT at that difference: the audible "warble". The map is
 *    exact arithmetic; the split is the first-order ESTIMATE.
 *  • TWO HEADS are two oscillators coupled through the enclosed air (the
 *    Rossing two-headed-drum model): with x the inward displacement of each
 *    head, the air adds a stiffness on (x_b + x_r). The 2×2 eigenproblem gives
 *    two (0,1)-family modes — a LOWER one where the heads move the same way in
 *    space (no air compression, a weak dipole radiator, long sustain) and a
 *    HIGHER one where they compress the air (a monopole, radiates and dies
 *    fast). Each mode's decay is the shape-weighted blend of the two heads'
 *    own losses, so WHERE the energy sits decides how long the note lasts,
 *    and the batter/resonant relationship decides where it sits. The air
 *    coupling frequency is set as a fraction of the head frequency chosen
 *    for a plausible tom — a MODEL constant, not a measured cavity.
 *  • PITCH BEND: the geometric nonlinearity of a membrane — tension rises
 *    with amplitude, ΔT/T ∝ (A/R)² / T — so a hard strike starts sharp and
 *    glides DOWN as it decays. Depth ∝ strike² / T: lower tension and a
 *    harder hit bend more. The head relationship adds its own apparent bend
 *    through the coupled modes above (the late sound is whichever mode
 *    sustains). MODEL; the sign is physics.
 *  • DAMPING (a pillow, gel, felt): shortens every decay and takes the upper
 *    modes first — loss grows with mode number. MODEL.
 *  • SNARE WIRES: filtered noise gated by the snare-side head's velocity:
 *    the wires only rattle while the head is moving them past the strainer's
 *    threshold. Strainer tension raises that threshold (less sensitive) and
 *    presses the wires into the head (more damping — the choke). MODEL.
 *  • BASS DRUM: a beater click (a short noise burst + a damped 2.5 kHz knock)
 *    over the low coupled fundamental; the front head open, ported or
 *    removed changes the coupling and the resonant loss. MODEL.
 *
 * Synthesis is additive: every partial is a sinusoid with its own decay and
 * its own instantaneous frequency (for the bend), summed per sample at the
 * app's 48 kHz, then peak-normalised. The waveform the stage draws is a
 * min/max overview of THIS buffer on its real time base (the Mastering
 * Lab's `overview`); the envelope and T60 are measured from it.
 */
import { SR, type Mono, type Stereo } from '../../../features/ear/earDsp.ts';
import { J_ZEROS } from '../../../features/cymatics/faraday';
import { besselJ } from '../../../features/cymatics/plateModes';
import { overview, type Overview } from '../mastering/masteringEngine';

export { overview, type Overview };

/* ── drums ───────────────────────────────────────────────────────────────── */

export type DrumKind = 'snare' | 'rack' | 'floor' | 'kick';
export type LugCount = 6 | 8 | 10;

export type DrumSpec = {
  kind: DrumKind;
  name: string;
  diameterIn: number;
  depthIn: number;
  lugs: LugCount;
  /** Batter head areal density, kg/m² (a 10-mil film ≈ 0.35). */
  sigmaBatter: number;
  /** Resonant / snare-side head areal density. */
  sigmaReso: number;
  /** The tension range the TENSION control covers, N/m. */
  tensionRange: [number, number];
  /** Where this drum tends to respond well: a fundamental range, Hz. Not a
   *  rule — a band to start listening in. */
  usefulHz: [number, number];
  /** Loss rate of the batter head alone, 1/s (1/τ). */
  lossBatter: number;
  lossReso: number;
  /** Air-coupling frequency as a fraction of the batter (0,1) frequency. */
  airCouple: number;
  /** Clip length, seconds. */
  seconds: number;
};

export const DRUMS: Record<DrumKind, DrumSpec> = {
  snare: { kind: 'snare', name: '14" × 5.5" snare', diameterIn: 14, depthIn: 5.5, lugs: 10, sigmaBatter: 0.35, sigmaReso: 0.12, tensionRange: [2000, 7000], usefulHz: [170, 300], lossBatter: 6, lossReso: 5, airCouple: 0.3, seconds: 1.4 },
  rack: { kind: 'rack', name: '12" × 8" rack tom', diameterIn: 12, depthIn: 8, lugs: 6, sigmaBatter: 0.35, sigmaReso: 0.25, tensionRange: [1200, 5500], usefulHz: [130, 260], lossBatter: 3.2, lossReso: 2.0, airCouple: 0.35, seconds: 2.0 },
  floor: { kind: 'floor', name: '16" × 16" floor tom', diameterIn: 16, depthIn: 16, lugs: 8, sigmaBatter: 0.35, sigmaReso: 0.25, tensionRange: [900, 4500], usefulHz: [80, 170], lossBatter: 2.8, lossReso: 1.8, airCouple: 0.3, seconds: 2.4 },
  kick: { kind: 'kick', name: '22" × 16" bass drum', diameterIn: 22, depthIn: 16, lugs: 8, sigmaBatter: 0.5, sigmaReso: 0.4, tensionRange: [600, 3200], usefulHz: [45, 90], lossBatter: 5, lossReso: 3, airCouple: 0.3, seconds: 1.6 },
};

export const DRUM_LIST: readonly DrumSpec[] = [DRUMS.snare, DRUMS.rack, DRUMS.floor, DRUMS.kick];

/* ── membrane modes ──────────────────────────────────────────────────────── */

export type ModeRatio = { n: number; s: number; ratio: number; label: string };

/** The clamped-membrane mode table, ascending, relative to (0,1). Read from
 *  the shared Bessel-zero table so the Cymatics Lab and this lab agree. */
export const MODE_RATIOS: readonly ModeRatio[] = (() => {
  const out: ModeRatio[] = [];
  const j01 = J_ZEROS[0][0];
  for (let n = 0; n < J_ZEROS.length; n++) {
    for (let si = 0; si < J_ZEROS[n].length; si++) {
      out.push({ n, s: si + 1, ratio: J_ZEROS[n][si] / j01, label: `(${n},${si + 1})` });
    }
  }
  out.sort((a, b) => a.ratio - b.ratio);
  return out.slice(0, 10);
})();

export const modeRatio = (n: number, s: number): number => MODE_RATIOS.find((m) => m.n === n && m.s === s)?.ratio ?? NaN;

/** (0,1) frequency of a head: (j_01 / 2πR) · √(T/σ). */
export function fundamentalHz(diameterIn: number, tensionNpm: number, sigma: number): number {
  const R = (diameterIn * 0.0254) / 2;
  return (J_ZEROS[0][0] / (2 * Math.PI * R)) * Math.sqrt(Math.max(1, tensionNpm) / sigma);
}

/** Tension for a wanted (0,1) frequency — the inverse, for the ladder. */
export function tensionForHz(diameterIn: number, hz: number, sigma: number): number {
  const R = (diameterIn * 0.0254) / 2;
  const c = (hz * 2 * Math.PI * R) / J_ZEROS[0][0];
  return c * c * sigma;
}

/* ── the lug map ─────────────────────────────────────────────────────────── */

/** One full turn of a tension rod changes that lug's tension by this
 *  fraction (a MODEL constant: a quarter turn ≈ 6 %, about half a semitone
 *  at the lug — in the range players report). */
export const TURN_GAIN = 0.25;

export type HeadState = {
  /** The head's mean tension when every rod sits at 0 turns, N/m. */
  tension: number;
  /** Per-rod offset in TURNS (−1 … +1), lug 0 at 12 o'clock, clockwise. */
  turns: number[];
};

export const evenHead = (tension: number, lugs: LugCount): HeadState => ({ tension, turns: new Array(lugs).fill(0) });

export const lugAngle = (i: number, lugs: number): number => (i / lugs) * 2 * Math.PI - Math.PI / 2;

/** The cross (star) pattern on each real lug count: every move goes to the
 *  rod OPPOSITE the last one, then round the star — lug 0 at 12 o'clock,
 *  clockwise. Pinned by test/drumTuningLab.test.ts. */
export const STAR_ORDER: Record<LugCount, readonly number[]> = {
  6: [0, 3, 1, 4, 2, 5],
  8: [0, 4, 2, 6, 1, 5, 3, 7],
  10: [0, 5, 2, 7, 4, 9, 6, 1, 8, 3],
};

/** Tension at each lug, N/m. */
export function lugTensions(h: HeadState): number[] {
  return h.turns.map((t) => Math.max(50, h.tension * (1 + TURN_GAIN * t)));
}

export const meanTension = (h: HeadState): number => {
  const t = lugTensions(h);
  return t.reduce((a, b) => a + b, 0) / t.length;
};

/** Each lug's tap pitch relative to the head's mean, in cents (f ∝ √T →
 *  600 · log2(T_i / T̄)). The evenness map. */
export function lugCents(h: HeadState): number[] {
  const t = lugTensions(h);
  const m = t.reduce((a, b) => a + b, 0) / t.length;
  return t.map((v) => 600 * Math.log2(v / m));
}

/** Highest minus lowest lug, cents — the number a tuning pass drives down. */
export function spreadCents(h: HeadState): number {
  const c = lugCents(h);
  return Math.max(...c) - Math.min(...c);
}

/**
 * The 2n-th angular harmonic of the relative tension map, |c_2n| / T̄ —
 * what splits the (n, s) pair. Lugs are point samples around the rim.
 */
export function tensionHarmonic(h: HeadState, k: number): number {
  const t = lugTensions(h);
  const N = t.length;
  const m = t.reduce((a, b) => a + b, 0) / N;
  let re = 0;
  let im = 0;
  for (let i = 0; i < N; i++) {
    const d = t[i] / m - 1;
    const th = lugAngle(i, N);
    re += d * Math.cos(k * th);
    im += d * Math.sin(k * th);
  }
  // Fourier amplitude of harmonic k over N samples (k = 0 would be the mean).
  return (2 / N) * Math.sqrt(re * re + im * im);
}

/** Relative split of the (n, s) pair, (f_hi − f_lo) / f. First order. */
export function modeSplit(h: HeadState, n: number): number {
  if (n === 0) return 0;
  const N = h.turns.length;
  // Harmonic 2n folds onto the mean when it equals the lug count: no split
  // resolvable from point samples — the first-order picture ends there.
  if (2 * n >= N) return 0;
  return tensionHarmonic(h, 2 * n) / 2;
}

/** Beat rate of the (1,1) pair, Hz — the warble you hear on an uneven head. */
export function beatRateHz(h: HeadState, diameterIn: number, sigma: number): number {
  const f = fundamentalHz(diameterIn, meanTension(h), sigma) * modeRatio(1, 1);
  return f * modeSplit(h, 1);
}

/** The lug tap pitch, Hz: the (1,1) partial heard near the rim, scaled by
 *  the local tension. */
export function lugTapHz(h: HeadState, i: number, diameterIn: number, sigma: number): number {
  const t = lugTensions(h);
  const m = t.reduce((a, b) => a + b, 0) / t.length;
  return fundamentalHz(diameterIn, m, sigma) * modeRatio(1, 1) * Math.sqrt(t[i] / m);
}

export type Evenness = { verdict: 'even' | 'close' | 'uneven'; outlier: { lug: number; cents: number } | null; message: string };

/** The feedback line of the Tune-the-Head interactive. `prev` is the spread
 *  before the last turn, so the text can say "becoming more even". */
export function evenness(h: HeadState, prevSpread?: number): Evenness {
  const c = lugCents(h);
  const spread = Math.max(...c) - Math.min(...c);
  let outlier: Evenness['outlier'] = null;
  let best = 0;
  for (let i = 0; i < c.length; i++) {
    if (Math.abs(c[i]) > best) {
      best = Math.abs(c[i]);
      outlier = { lug: i, cents: c[i] };
    }
  }
  const second = [...c].map(Math.abs).sort((a, b) => b - a)[1] ?? 0;
  const lone = outlier != null && best >= 20 && best > 2 * second;
  if (spread <= 10) return { verdict: 'even', outlier: null, message: `The head reads even: every lug within ${Math.ceil(spread)} cents. Play it from the seat and listen.` };
  const trend = prevSpread != null ? (spread < prevSpread - 1 ? ' The head is becoming more even.' : spread > prevSpread + 1 ? ' That turn made it less even.' : '') : '';
  if (lone && outlier) {
    const dir = outlier.cents > 0 ? 'higher' : 'lower';
    return { verdict: spread <= 25 ? 'close' : 'uneven', outlier, message: `One area is noticeably ${dir}: lug ${outlier.lug + 1} sits ${Math.abs(Math.round(outlier.cents))} cents ${dir} than the rest.${trend}` };
  }
  if (spread <= 25) return { verdict: 'close', outlier, message: `Close: ${Math.round(spread)} cents between the highest and lowest lug. Small moves now — an eighth of a turn.${trend}` };
  return { verdict: 'uneven', outlier, message: `Uneven: ${Math.round(spread)} cents between lugs. Bring the low ones up and the high ones down in small, opposing steps.${trend}` };
}

/** A seeded uneven head for a practice run — never the same twice, never
 *  trivially even. */
export function randomUnevenHead(tension: number, lugs: LugCount, seed: number, maxTurn = 0.6): HeadState {
  let s = seed >>> 0 || 1;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const turns = Array.from({ length: lugs }, () => (rnd() * 2 - 1) * maxTurn);
  // Guarantee at least one clear outlier so there is something to find.
  const k = Math.floor(rnd() * lugs);
  turns[k] = (rnd() > 0.5 ? 1 : -1) * Math.max(Math.abs(turns[k]), maxTurn * 0.8);
  return { tension, turns };
}

/* ── the two-head system ─────────────────────────────────────────────────── */

/** Radiation loss of the air-compressing (monopole) mode, 1/s per unit
 *  (vb + vr)². A MODEL constant. */
export const RADIATION_LOSS = 3;

export type CoupledMode = {
  hz: number;
  /** Decay rate, 1/s. */
  loss: number;
  /** Normalised shape (batter, resonant) — inward displacement. */
  vb: number;
  vr: number;
  /** Excitation from a batter strike: ∝ the batter component. */
  excite: number;
  /** Radiated weight: the monopole (both inward) radiates more than the dipole. */
  radiate: number;
};

/**
 * The (0,1) pair of a two-headed drum. `fb`, `fr` are the two heads' own
 * (0,1) frequencies; `couple` is the air-coupling frequency as a fraction
 * of fb (0 = no resonant head). Returns the two normal modes, lower first.
 */
export function coupledModes(fb: number, fr: number, couple: number, lossB: number, lossR: number): CoupledMode[] {
  const wb2 = (2 * Math.PI * fb) ** 2;
  const wr2 = (2 * Math.PI * fr) ** 2;
  const wc2 = (2 * Math.PI * fb * couple) ** 2;
  if (couple <= 0) {
    return [{ hz: fb, loss: lossB, vb: 1, vr: 0, excite: 1, radiate: 1 }];
  }
  const A = wb2 + wc2;
  const B = wr2 + wc2;
  const C = wc2;
  const mid = (A + B) / 2;
  const d = Math.sqrt(((A - B) / 2) ** 2 + C * C);
  const out: CoupledMode[] = [];
  for (const lam of [mid - d, mid + d]) {
    // Eigenvector of [[A, C], [C, B]] for eigenvalue lam.
    let vb = C;
    let vr = lam - A;
    if (Math.abs(vb) + Math.abs(vr) < 1e-9) {
      vb = 1;
      vr = 0;
    }
    const norm = Math.hypot(vb, vr);
    vb /= norm;
    vr /= norm;
    // Volume velocity ∝ vb + vr (both inward = compression = monopole).
    const mono = Math.abs(vb + vr);
    // The monopole radiates a little more at the attack; most of what
    // separates the two is how fast it SPENDS that energy (the loss below).
    const radiate = 0.9 + 0.1 * mono;
    // Shape-weighted head losses plus RADIATION loss: the monopole pumps
    // air and spends its energy fast; the dipole barely radiates (the
    // reason a tom's low mode is the one that sings). MODEL constant.
    const loss = lossB * vb * vb + lossR * vr * vr + RADIATION_LOSS * mono * mono;
    out.push({ hz: Math.sqrt(Math.max(1, lam)) / (2 * Math.PI), loss, vb, vr, excite: Math.abs(vb), radiate });
  }
  return out;
}

/* ── one strike ──────────────────────────────────────────────────────────── */

export type DampingKind = 'none' | 'gel' | 'felt' | 'pillow';

export type StrikeParams = {
  drum: DrumKind;
  batter: HeadState;
  reso: HeadState;
  /** 0 = resonant head removed. 1 = as built. */
  resoPresent: boolean;
  /** 0..1 — a pillow / gel / felt; the kind only changes the amount in this
   *  model, the labels teach the real difference. */
  damping: number;
  /** 0.2 (light tap) … 1 (hard strike). */
  strike: number;
  /** Strike radius as a fraction of R: 0 = centre, 0.85 = near the rim. */
  strikeR: number;
  /** Strike angle, radians (which lug it is near). */
  strikeTheta: number;
  /** Snare only: strainer tension 0 (wires off / loose) … 1 (choked). */
  strainer?: number;
  /** Kick only. */
  frontHead?: 'open' | 'ported' | 'removed';
};

export type Partial = {
  label: string;
  n: number;
  s: number;
  hz: number;
  /** Linear amplitude at t = 0 (relative). */
  amp: number;
  /** Decay rate 1/s. */
  loss: number;
  /** Which head family. */
  head: 'coupled' | 'batter';
  /** The other member of a split pair sits `pairHz` away (0 = unsplit). */
  pairHz: number;
  /** Coupled modes only: the resonant head's share of the shape (|vr|). */
  vr?: number;
};

/** The bend depth constant: at strike 1 and 2000 N/m the fundamental starts
 *  about 80 cents sharp (β = 0.097). */
export const BEND_K = 0.097 * 2000;

/** Relative tension rise at the strike moment, β = BEND_K · strike² / T. */
export function bendBeta(strike: number, tensionNpm: number): number {
  return (BEND_K * strike * strike) / Math.max(200, tensionNpm);
}

/** Initial sharpness of the bend, cents: 600 · log2(1 + β). Positive = starts
 *  sharp, glides down — the bend is always DOWNWARD. */
export function bendCents(strike: number, tensionNpm: number): number {
  return 600 * Math.log2(1 + bendBeta(strike, tensionNpm));
}

/** Loss multiplier for damping amount d on mode number k (0 = fundamental). */
export function dampingLoss(d: number, k: number): number {
  const a = Math.max(0, Math.min(1, d));
  return 1 + 6 * a * (1 + 0.5 * k);
}

/** The partial list of one strike — what the spectrum stage draws and what
 *  the synth sums. Pure. */
export function strikePartials(p: StrikeParams): Partial[] {
  const spec = DRUMS[p.drum];
  const Tb = meanTension(p.batter);
  const Tr = meanTension(p.reso);
  const fb = fundamentalHz(spec.diameterIn, Tb, spec.sigmaBatter);
  const fr = fundamentalHz(spec.diameterIn, Tr, spec.sigmaReso);
  const kickFront = p.drum === 'kick' ? (p.frontHead ?? 'open') : 'open';
  const resoOn = p.resoPresent && kickFront !== 'removed';
  let couple = resoOn ? spec.airCouple : 0;
  let lossR = spec.lossReso;
  if (kickFront === 'ported') {
    couple *= 0.55;
    lossR *= 2.2;
  }
  if (p.drum === 'snare' && p.strainer != null) {
    // Wires pressed into the snare-side head: more loss on that head.
    lossR *= 1 + 2.5 * Math.max(0, Math.min(1, p.strainer));
  }
  const lossB = spec.lossBatter;
  const out: Partial[] = [];
  // (0,1) family: the coupled pair (or the batter alone).
  const cm = coupledModes(fb, fr, couple, lossB, lossR);
  const centreW = Math.abs(besselJ(0, J_ZEROS[0][0] * p.strikeR));
  for (const m of cm) {
    out.push({ label: m.vr > 0.7 ? '(0,1) reso' : m.hz > fb * 1.15 ? '(0,1) air' : '(0,1)', n: 0, s: 1, hz: m.hz, amp: m.excite * m.radiate * centreW * dampingLossInv(p.damping, 0), loss: m.loss * dampingLoss(p.damping, 0), head: 'coupled', pairHz: 0, vr: Math.abs(m.vr) });
  }
  // Upper batter modes: uncoupled (they move no net air), split by the map.
  let k = 1;
  for (const mr of MODE_RATIOS) {
    if (mr.n === 0 && mr.s === 1) continue;
    if (k > 8) break;
    const hz = fb * mr.ratio;
    const w = Math.abs(besselJ(mr.n, J_ZEROS[mr.n][mr.s - 1] * p.strikeR) * (mr.n === 0 ? 1 : Math.cos(mr.n * p.strikeTheta)));
    const w2 = mr.n === 0 ? 0 : Math.abs(besselJ(mr.n, J_ZEROS[mr.n][mr.s - 1] * p.strikeR) * Math.sin(mr.n * p.strikeTheta));
    const loss = lossB * Math.pow(mr.ratio, 0.7) * dampingLoss(p.damping, k);
    const base = (0.75 / Math.pow(mr.ratio, 0.6)) * dampingLossInv(p.damping, k);
    const split = modeSplit(p.batter, mr.n);
    if (split > 1e-6) {
      const lo = hz * (1 - split / 2);
      const hi = hz * (1 + split / 2);
      out.push({ label: `${mr.label}a`, n: mr.n, s: mr.s, hz: lo, amp: base * Math.max(w, 0.15), loss, head: 'batter', pairHz: hi - lo });
      out.push({ label: `${mr.label}b`, n: mr.n, s: mr.s, hz: hi, amp: base * Math.max(w2, 0.15), loss, head: 'batter', pairHz: lo - hi });
    } else {
      out.push({ label: mr.label, n: mr.n, s: mr.s, hz, amp: base * Math.max(mr.n === 0 ? w : Math.hypot(w, w2), 0.1), loss, head: 'batter', pairHz: 0 });
    }
    k++;
  }
  return out;
}

/** Amplitude loss from damping at the attack (a pillow also mutes). */
function dampingLossInv(d: number, k: number): number {
  return 1 / Math.sqrt(dampingLoss(d, k));
}

/* ── synthesis ───────────────────────────────────────────────────────────── */

/** A tiny deterministic noise source (the ear lab's LCG idiom). */
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000 - 0.5;
  };
}

/** One-pole low-pass / high-pass helpers for the noise bands. */
function onePole(fc: number): number {
  return Math.exp((-2 * Math.PI * fc) / SR);
}

export type PitchTrace = {
  label: string;
  /** One point per 10 ms: instantaneous pitch in cents relative to the
   *  batter's own (0,1), and the relative amplitude (0..1) at that moment. */
  pts: { t: number; cents: number; amp: number }[];
};

export type RenderResult = {
  mono: Mono;
  partials: Partial[];
  seconds: number;
  /** One trace per (0,1)-family mode: the bend glide of each, with its
   *  amplitude — the ear follows whichever is loudest at that moment. */
  pitchTraces: PitchTrace[];
};

/** The loudest (0,1)-family mode at time t — what the ear follows — in
 *  cents relative to the batter's (0,1). */
export function dominantCents(traces: readonly PitchTrace[], t: number): number {
  let best = -1;
  let cents = 0;
  for (const tr of traces) {
    const i = Math.min(tr.pts.length - 1, Math.max(0, Math.round(t / 0.01)));
    const p = tr.pts[i];
    if (p && p.amp > best) {
      best = p.amp;
      cents = p.cents;
    }
  }
  return cents;
}

/**
 * Render one strike at 48 kHz. Additive: each partial is a sinusoid with
 * its own decay and a frequency that glides down with the bend as the
 * (0,1) amplitude decays. Peak-normalised to −3 dBFS (the strike's own
 * level is carried by the decay shape, not by the peak).
 */
export function renderStrike(p: StrikeParams): RenderResult {
  const spec = DRUMS[p.drum];
  const seconds = spec.seconds;
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const parts = strikePartials(p);
  const Tb = meanTension(p.batter);
  const beta = bendBeta(p.strike, Tb);
  const fb = fundamentalHz(spec.diameterIn, Tb, spec.sigmaBatter);
  // The bend follows the fundamental family's own decay.
  const fundLoss = Math.min(...parts.filter((q) => q.head === 'coupled').map((q) => q.loss));
  const phases = new Float64Array(parts.length);
  const strikeGain = 0.35 + 0.65 * p.strike;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const envF = Math.exp(-fundLoss * t);
    const sharp = Math.sqrt(1 + beta * envF * envF);
    let v = 0;
    for (let k = 0; k < parts.length; k++) {
      const q = parts[k];
      const a = q.amp * Math.exp(-q.loss * t);
      if (a < 1e-5) continue;
      // The bend acts on every partial (tension is shared), strongest on the
      // fundamental family where the amplitude is.
      const f = q.hz * (q.head === 'coupled' ? sharp : 1 + (sharp - 1) * 0.5);
      phases[k] += (2 * Math.PI * f) / SR;
      v += a * Math.sin(phases[k]);
    }
    // A 3 ms attack so the hit does not click.
    const att = t < 0.003 ? t / 0.003 : 1;
    out[i] = v * att * strikeGain;
  }
  if (p.drum === 'snare') addSnareWires(out, p, parts);
  if (p.drum === 'kick') addBeaterClick(out, p);
  normalise(out, 0.7);
  const cm = parts.filter((q) => q.head === 'coupled');
  const peakAmp = Math.max(1e-9, ...cm.map((q) => q.amp));
  const traces: PitchTrace[] = cm.map((q) => ({ label: q.label, pts: [] }));
  for (let t = 0; t < seconds; t += 0.01) {
    const envF = Math.exp(-fundLoss * t);
    const sharp = Math.sqrt(1 + beta * envF * envF);
    cm.forEach((q, k) => {
      traces[k].pts.push({ t, cents: 1200 * Math.log2((q.hz * sharp) / fb), amp: (q.amp * Math.exp(-q.loss * t)) / peakAmp });
    });
  }
  return { mono: out, partials: parts, seconds, pitchTraces: traces };
}

/** Snare wires: band-limited noise gated by the snare-side head's motion. */
function addSnareWires(out: Float32Array, p: StrikeParams, parts: Partial[]): void {
  const strainer = Math.max(0, Math.min(1, p.strainer ?? 0.5));
  if (strainer <= 0.02) return; // thrown off: no wires
  const reso = parts.filter((q) => q.head === 'coupled');
  const rnd = lcg(0x5a5a);
  const n = out.length;
  const lp = onePole(7000);
  const hp = onePole(1800);
  let lpz = 0;
  let hpz = 0;
  let gate = 0;
  // The threshold is a fraction of the snare-side head's own peak motion:
  // sensitivity falls as the strainer tightens (the wires need more motion
  // to lift off the head and rattle back).
  const thresh = 0.04 + 0.55 * strainer;
  const gateRel = Math.exp(-1 / (0.012 * SR));
  const chokeLoss = 1 + 4 * strainer; // choke: the wires die with the head
  const vPeak = Math.max(1e-9, reso.reduce((s, q) => s + q.amp * (q.vr ?? 0.5), 0));
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Snare-side head velocity ∝ Σ a·cos — the resonant components.
    let v = 0;
    for (const q of reso) v += q.amp * (q.vr ?? 0.5) * Math.exp(-q.loss * chokeLoss * t) * Math.cos(2 * Math.PI * q.hz * t);
    const drive = Math.max(0, Math.abs(v) / vPeak - thresh);
    gate = drive > gate ? drive : gate * gateRel;
    if (gate < 1e-4) continue;
    let x = rnd();
    lpz = lpz * lp + x * (1 - lp);
    x = lpz;
    hpz = hpz * hp + x * (1 - hp);
    x = x - hpz;
    out[i] += x * gate * 1.4 * (1.1 - 0.6 * strainer);
  }
}

/** Beater: a short noise burst plus a damped knock at ~2.5 kHz. */
function addBeaterClick(out: Float32Array, p: StrikeParams): void {
  const rnd = lcg(0x1234);
  const n = Math.min(out.length, Math.round(0.02 * SR));
  const lp = onePole(4000);
  let z = 0;
  const g = 0.4 + 0.6 * p.strike;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    z = z * lp + rnd() * (1 - lp);
    const burst = z * Math.exp(-t / 0.003) * 1.6;
    const knock = Math.sin(2 * Math.PI * 2500 * t) * Math.exp(-t / 0.004) * 0.35;
    out[i] += (burst + knock) * g;
  }
}

function normalise(x: Float32Array, peak: number): void {
  let m = 1e-9;
  for (let i = 0; i < x.length; i++) {
    const a = Math.abs(x[i]);
    if (a > m) m = a;
  }
  const g = peak / m;
  for (let i = 0; i < x.length; i++) x[i] *= g;
}

/** A lug TAP: a light stick tap an inch in from the rim at lug `i`. The
 *  rim-side partials dominate and every one of them is scaled by the local
 *  tension — the "lug pitch" a tuner listens for. 0.45 s. */
export function renderTap(h: HeadState, i: number, drum: DrumKind, which: 'batter' | 'reso' = 'batter'): RenderResult {
  const spec = DRUMS[drum];
  const sigma = which === 'batter' ? spec.sigmaBatter : spec.sigmaReso;
  const t = lugTensions(h);
  const m = t.reduce((a, b) => a + b, 0) / t.length;
  const local = Math.sqrt(t[i] / m);
  const f01 = fundamentalHz(spec.diameterIn, m, sigma);
  const seconds = 0.45;
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const parts: Partial[] = [];
  const weights: [number, number, number, number][] = [
    [1, 1, 1.0, 9], // (1,1): the lug tone
    [2, 1, 0.55, 12],
    [3, 1, 0.3, 15],
    [0, 1, 0.25, 8],
  ];
  for (const [nn, ss, amp, loss] of weights) {
    parts.push({ label: `(${nn},${ss})`, n: nn, s: ss, hz: f01 * modeRatio(nn, ss) * local, amp, loss, head: 'batter', pairHz: 0 });
  }
  const phases = new Float64Array(parts.length);
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    let v = 0;
    for (let q = 0; q < parts.length; q++) {
      const pr = parts[q];
      phases[q] += (2 * Math.PI * pr.hz) / SR;
      v += pr.amp * Math.exp(-pr.loss * tt) * Math.sin(phases[q]);
    }
    const att = tt < 0.002 ? tt / 0.002 : 1;
    out[k] = v * att;
  }
  normalise(out, 0.6);
  return { mono: out, partials: parts, seconds, pitchTraces: [] };
}

export const toStereo = (m: Mono): Stereo => ({ l: m, r: m });

/* ── measurement of a render ─────────────────────────────────────────────── */

/** RMS envelope in dB, one point per `blockMs`, relative to the loudest block. */
export function envelopeDb(x: Mono, blockMs = 10): number[] {
  const bl = Math.max(1, Math.round((blockMs / 1000) * SR));
  const out: number[] = [];
  let peak = -Infinity;
  for (let i = 0; i < x.length; i += bl) {
    let s = 0;
    const e = Math.min(x.length, i + bl);
    for (let k = i; k < e; k++) s += x[k] * x[k];
    const db = 10 * Math.log10(Math.max(1e-12, s / (e - i)));
    out.push(db);
    if (db > peak) peak = db;
  }
  return out.map((d) => d - peak);
}

/** Time for the envelope to fall 40 dB from its peak, seconds, scaled ×1.5
 *  to a T60 estimate (the last 20 dB are below the floor of a 16-bit clip).
 *  Returns the clip length when it never gets there. */
export function sustainT60(x: Mono, blockMs = 10): number {
  const env = envelopeDb(x, blockMs);
  const peakAt = env.indexOf(Math.max(...env));
  for (let i = peakAt; i < env.length; i++) {
    if (env[i] <= -40) return ((i - peakAt) * blockMs) / 1000 * 1.5;
  }
  return (x.length / SR) * 1.5;
}

/** How much of the energy sits above 3 × the fundamental: ring vs body. */
export function upperRatio(parts: readonly Partial[], fb: number): number {
  let hi = 0;
  let all = 0;
  for (const q of parts) {
    const e = (q.amp * q.amp) / Math.max(0.5, q.loss);
    all += e;
    if (q.hz > 3 * fb) hi += e;
  }
  return all > 0 ? hi / all : 0;
}

/* ── the kit ─────────────────────────────────────────────────────────────── */

export const semitones = (hiHz: number, loHz: number): number => 12 * Math.log2(hiHz / loHz);

export type IntervalVerdict = { kind: 'distinct' | 'close' | 'unbalanced'; semitones: number; message: string };

/** Rack vs floor tom: is the step between them distinct, too close, or
 *  unbalanced (one drum pushed out of its useful range, or a gap so wide
 *  the pair no longer reads as one kit)? */
export function tomInterval(rackHz: number, floorHz: number): IntervalVerdict {
  const st = semitones(rackHz, floorHz);
  const rackIn = rackHz >= DRUMS.rack.usefulHz[0] && rackHz <= DRUMS.rack.usefulHz[1];
  const floorIn = floorHz >= DRUMS.floor.usefulHz[0] && floorHz <= DRUMS.floor.usefulHz[1];
  if (st < 0) return { kind: 'unbalanced', semitones: st, message: 'The floor tom sits ABOVE the rack tom — the kit reads upside down.' };
  if (!rackIn || !floorIn) {
    const which = !rackIn ? 'rack tom' : 'floor tom';
    return { kind: 'unbalanced', semitones: st, message: `Unbalanced: the ${which} is outside the range where it responds well (${!rackIn ? `${DRUMS.rack.usefulHz[0]}–${DRUMS.rack.usefulHz[1]}` : `${DRUMS.floor.usefulHz[0]}–${DRUMS.floor.usefulHz[1]}`} Hz here). Forcing a drum there costs tone before it buys an interval.` };
  }
  if (st < 2.5) return { kind: 'close', semitones: st, message: `Too close: ${st.toFixed(1)} semitones. The two toms crowd each other — a fill reads as one drum.` };
  if (st > 7.5) return { kind: 'unbalanced', semitones: st, message: `A wide step: ${st.toFixed(1)} semitones. Both drums respond, but the pair no longer reads as one kit — a fill jumps instead of falling.` };
  return { kind: 'distinct', semitones: st, message: `Distinct: ${st.toFixed(1)} semitones between the toms — each drum keeps its own pitch and the fall reads as one kit.` };
}

/* ── goals (Tune a drum for a sound) ─────────────────────────────────────── */

export type GoalId = 'short' | 'open' | 'low' | 'bend';

export type GoalMeasure = { t60: number; f0: number; bendCents: number; upper: number; drum: DrumKind };

export type GoalVerdict = { met: boolean; lines: string[] };

/** Judge a strike against a stated goal. Thresholds are the lab's own
 *  teaching bands, stated on the page. */
export function judgeGoal(goal: GoalId, m: GoalMeasure): GoalVerdict {
  const spec = DRUMS[m.drum];
  const lines: string[] = [];
  const lowBand = spec.usefulHz[0] + (spec.usefulHz[1] - spec.usefulHz[0]) * 0.3;
  switch (goal) {
    case 'short': {
      const ok = m.t60 <= 0.55 && m.upper <= 0.25;
      lines.push(m.t60 <= 0.55 ? `Sustain ${m.t60.toFixed(2)} s — short.` : `Sustain ${m.t60.toFixed(2)} s — still ringing; more damping, or a resonant head tuned away from the batter, shortens it.`);
      lines.push(m.upper <= 0.25 ? 'Upper partials controlled.' : 'The upper partials still ring — damping takes those first.');
      return { met: ok, lines };
    }
    case 'open': {
      const ok = m.t60 >= 0.9 && m.upper >= 0.08;
      lines.push(m.t60 >= 0.9 ? `Sustain ${m.t60.toFixed(2)} s — open.` : `Sustain ${m.t60.toFixed(2)} s — choked; take the damping off, and listen to what tuning the two heads closer together does.`);
      lines.push(m.upper >= 0.08 ? 'The overtones are alive.' : 'The overtones are muffled — less damping.');
      return { met: ok, lines };
    }
    case 'low': {
      const ok = m.f0 <= lowBand && m.t60 >= 0.6;
      lines.push(m.f0 <= lowBand ? `Fundamental ${m.f0.toFixed(0)} Hz — in the low part of this drum's range.` : `Fundamental ${m.f0.toFixed(0)} Hz — still high for "low and full"; lower the batter tension (and keep it above where the head wrinkles).`);
      lines.push(m.t60 >= 0.6 ? 'Full: the note has body.' : 'The note dies early — ease the damping.');
      return { met: ok, lines };
    }
    case 'bend': {
      const ok = m.bendCents >= 35 && m.t60 >= 0.5;
      lines.push(m.bendCents >= 35 ? `Bend ${m.bendCents.toFixed(0)} cents — a clear downward glide.` : `Bend ${m.bendCents.toFixed(0)} cents — subtle; lower tension and a harder strike deepen it, and a resonant head tuned lower than the batter leaves the late sound lower.`);
      lines.push(m.t60 >= 0.5 ? 'Long enough to hear the glide.' : 'Too short to hear the glide — less damping.');
      return { met: ok, lines };
    }
  }
}

/* ── symptoms (Chapter 7) ─────────────────────────────────────────────────── */

export type SymptomId = 'warble' | 'choked' | 'ring' | 'snare' | 'drift';

export type SymptomCase = {
  id: SymptomId;
  title: string;
  symptom: string;
  /** Areas to investigate — the spec table. */
  areas: readonly string[];
  /** Drum the case runs on. */
  drum: DrumKind;
  /** Fix options offered; exactly one clears THIS case (`fix`). */
  fixes: readonly { id: string; label: string; why: string }[];
  fix: string;
};

export const SYMPTOMS: readonly SymptomCase[] = [
  {
    id: 'warble', title: 'Uneven or "warbling" tone', symptom: 'The tom wobbles in pitch after every hit — a slow warble under the note.', drum: 'rack',
    areas: ['Lug-to-lug pitch differences', 'Head seating', 'Head condition'],
    fixes: [
      { id: 'even', label: 'Tap each lug and even the head', why: 'Two or more lugs sit at different pitches: the degenerate modes split and beat.' },
      { id: 'damp', label: 'Add a gel pad', why: 'Damping shortens the warble but does not remove its cause; the beat is still there under the gel.' },
      { id: 'reso', label: 'Retune the resonant head', why: 'The resonant head sets sustain and the relationship, not a lug-to-lug beat on the batter.' },
    ],
    fix: 'even',
  },
  {
    id: 'choked', title: 'Drum sounds choked', symptom: 'The floor tom has no note — a dead "thup" with nothing after it.', drum: 'floor',
    areas: ['Excessive or uneven tension', 'Head condition', 'Damping'],
    fixes: [
      { id: 'undamp', label: 'Take the pillow out', why: 'A thick damper in a floor tom kills the fundamental along with the ring.' },
      { id: 'tighten', label: 'Tighten the batter a full turn', why: 'More tension raises the pitch; it does not give a muffled drum its sustain back.' },
      { id: 'wires', label: 'Loosen the snare strainer', why: 'A floor tom has no snare wires.' },
    ],
    fix: 'undamp',
  },
  {
    id: 'ring', title: 'Excessive ring', symptom: 'The rack tom rings on and on with a high overtone over the note.', drum: 'rack',
    areas: ['Head relationship', 'Tuning range', 'Room sound', 'Damping'],
    fixes: [
      { id: 'reso', label: 'Retune the resonant head away from the batter', why: 'Two heads near the same pitch exchange energy and sustain each other; moving the resonant head changes the sustain and where the ring sits.' },
      { id: 'even', label: 'Even the batter lugs', why: 'The batter is already even in this case — evening it again changes nothing.' },
      { id: 'tighten', label: 'Tighten both heads a full turn', why: 'Higher tension moves the ring up; it does not shorten it.' },
    ],
    fix: 'reso',
  },
  {
    id: 'snare', title: 'Weak snare response', symptom: 'Soft strokes on the snare give no wire sound — only a tom-like thud.', drum: 'snare',
    areas: ['Snare-side head tension', 'Wire adjustment', 'Head condition', 'Hardware'],
    fixes: [
      { id: 'strainer', label: 'Back the strainer off', why: 'A strainer wound tight raises the threshold the head must move the wires past — sensitivity drops and the sound chokes.' },
      { id: 'tighten', label: 'Tighten the batter', why: 'The batter sets feel and pitch; the wires respond to the snare-side head.' },
      { id: 'damp', label: 'Add a felt strip', why: 'Damping shortens the ring; it does not wake the wires.' },
    ],
    fix: 'strainer',
  },
  {
    id: 'drift', title: 'Drum will not hold tuning', symptom: 'The rack tom is even after tuning, then one lug drops within a few minutes of playing.', drum: 'rack',
    areas: ['Rods', 'Lugs', 'Washers', 'Tension consistency', 'Damaged hardware'],
    fixes: [
      { id: 'hardware', label: 'Fit a nylon washer / lug lock on the slipping rod', why: 'A rod that backs out under vibration needs friction or a lock; retuning alone repeats the drift.' },
      { id: 'even', label: 'Retune the dropped lug', why: 'It evens the head for a moment — and drifts again, because the rod is backing out.' },
      { id: 'damp', label: 'Add damping', why: 'Damping changes the sound; it does nothing for a rod that will not stay put.' },
    ],
    fix: 'hardware',
  },
];

export const symptomById = (id: SymptomId): SymptomCase => SYMPTOMS.find((s) => s.id === id) ?? SYMPTOMS[0];
