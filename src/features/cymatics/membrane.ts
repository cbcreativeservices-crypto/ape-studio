/**
 * Cymatics Lab — membrane + loudspeaker model (spec §1.5, Phase 3). PURE +
 * import-light (Bessel from plateModes, the J_n zero table from faraday) so
 * node:test pins it and the viz worklets consume plain numbers / typed arrays.
 *
 * WHAT IS EXACT, WHAT IS APPROXIMATED (every screen labels this honestly):
 *  • IDEAL CLAMPED MEMBRANE — exact: modes W_ns(r,θ) = J_n(k r)·cos(nθ) with
 *    k R = j_{n,s} (the s-th zero of J_n), frequency
 *      f_ns = (j_ns / 2πR) · √(T / σ)      (T tension N/m, σ areal density kg/m²)
 *    so f ∝ √T, ∝ 1/R, ∝ 1/√σ. The ratios 1 : 1.594 : 2.136 : 2.296 : 2.653
 *    are NOT integers — a bare drumhead has no clear pitch. CALCULATED.
 *  • KETTLE (timpani) — the air in the bowl and radiation loading pull the
 *    (n,1) "principal" modes toward 1 : 1.5 : 2 : 2.5 : 3 (Rossing, *Science of
 *    Percussion Instruments*, measured), which is why a timpani HAS a pitch (the
 *    missing fundamental of that near-harmonic series). We apply Rossing's
 *    measured ratios to the principal series and a plain air-mass factor to
 *    the rest. APPROXIMATED, and labelled so.
 *  • STRIKE POINT — a mode is excited in proportion to |W| at the strike: a
 *    centre strike drives only the n = 0 ring modes (the dull "thud"); the
 *    timpanist strikes ~¼ of the way in to favour the pitched (1,1) mode.
 *  • RESPONSE — single-DOF magnitude per mode (plateModes.modeResponse), Q
 *    from the head with the user's damping control.
 *  • LOUDSPEAKER CONE — an ILLUSTRATIVE stage ladder in frequency relative to
 *    the driver's resonance f_s and its first cone-bending (breakup) frequency,
 *    with the CALCULATED parts stated: excursion ∝ 1/f² above resonance in the
 *    mass-controlled piston band, ka = π f D / c the piston/beaming number.
 *    The cone's motion in each stage is drawn from the membrane engine with a
 *    stiffness profile (piston = uniform, flex = J₀ profile, radial = J_n
 *    cos nθ, breakup = several at once). No cone FEM runs on the phone.
 */
import { besselJ, modeResponse, modeResponseSigned, type PlateMode } from './plateModes';
import { J_ZEROS } from './faraday';

// ── heads ───────────────────────────────────────────────────────────────────
export type HeadId = 'mylar10' | 'mylar7' | 'calfskin' | 'latex' | 'kevlar';
export type Head = {
  id: HeadId;
  label: string;
  /** Areal density, kg/m². */
  sigma: number;
  /** Typical modal Q of the bare head in air. */
  Q: number;
  blurb: string;
  /** Visual: head tint + how translucent it renders. */
  tint: string;
  alpha: number;
};
export const HEADS: readonly Head[] = [
  { id: 'mylar10', label: 'Mylar 10 mil', sigma: 0.35, Q: 60, blurb: 'The standard batter head: 0.25 mm polyester film — bright, even, long ring.', tint: '#e9e4d2', alpha: 0.82 },
  { id: 'mylar7', label: 'Mylar 7 mil', sigma: 0.25, Q: 50, blurb: 'Thinner film: lighter, so every mode sits higher at the same tension.', tint: '#eee9d8', alpha: 0.7 },
  { id: 'calfskin', label: 'Calfskin', sigma: 0.55, Q: 25, blurb: 'The historical head — heavier and more damped; warmer, shorter ring, weather-sensitive.', tint: '#d9c08f', alpha: 0.95 },
  { id: 'latex', label: 'Latex sheet', sigma: 0.2, Q: 12, blurb: 'A rubber sheet: very light, heavily damped — figures blur quickly.', tint: '#d6b28a', alpha: 0.75 },
  { id: 'kevlar', label: 'Kevlar (marching)', sigma: 0.6, Q: 90, blurb: 'Woven aramid tensioned very high — rigid, loud, the crack of a marching snare.', tint: '#ddd9c7', alpha: 0.98 },
];
export const HEAD_BY_ID: Record<HeadId, Head> = Object.fromEntries(HEADS.map((h) => [h.id, h])) as Record<HeadId, Head>;

export type MembraneSpec = {
  head: HeadId;
  /** Head diameter, mm. */
  diameterMm: number;
  /** Membrane tension, N/m (typical drumheads 1–6 kN/m; timpani ~3–5 kN/m). */
  tensionNpm: number;
  /** 0..1 — scales the head's Q down (1 = a hand resting on the head). */
  damping: number;
  /** Strike point: fraction of the radius from the centre, and angle. */
  strike: { r: number; thetaDeg: number };
  /** Timpani bowl under the head (air loading → near-harmonic principal modes). */
  kettle: boolean;
};

export const DEFAULT_MEMBRANE: MembraneSpec = {
  head: 'mylar10',
  diameterMm: 355, // a 14" snare / floor tom head
  tensionNpm: 3000,
  damping: 0.15,
  strike: { r: 0.25, thetaDeg: 0 },
  kettle: false,
};

/** Rossing's measured timpani ratios for the principal (n,1) series, relative
 *  to (1,1) = 1 — the near-harmonic 1 : 1.5 : 2 : 2.5 : 3 that gives the
 *  kettledrum its pitch. (0,1) sits at ≈ 0.85 and is damped by the bowl. */
const KETTLE_PRINCIPAL: Record<number, number> = { 0: 0.85, 1: 1.0, 2: 1.5, 3: 1.99, 4: 2.44, 5: 2.89, 6: 3.34 };
/** Ideal (in vacuo) ratio of (1,1) to (0,1): j11 / j01. */
const IDEAL_11 = 3.8317 / 2.4048;

export type MembraneMode = PlateMode & {
  /** Nodal diameters. */
  n: number;
  /** Radial index (s = 1 is the first zero: no interior nodal circle). */
  s: number;
  /** k·R = j_{n,s}. */
  j: number;
};

/** Fundamental (0,1) of the bare head, Hz — the tuning readout. */
export function fundamentalHz(spec: MembraneSpec): number {
  const R = spec.diameterMm / 2000;
  const sigma = HEAD_BY_ID[spec.head].sigma;
  return (J_ZEROS[0][0] / (2 * Math.PI * R)) * Math.sqrt(spec.tensionNpm / sigma);
}

/** The head's modes for the current spec, ascending, with the strike
 *  weighting applied. `shape(x, y)` takes plate-normalised (x, y) ∈ [0,1]²
 *  (the disc inscribed), 0 outside — the plate contract, so the same samplers
 *  and readouts work. */
export function membraneModes(spec: MembraneSpec, count = 16): MembraneMode[] {
  const R = spec.diameterMm / 2000;
  const head = HEAD_BY_ID[spec.head];
  const c = Math.sqrt(spec.tensionNpm / head.sigma); // wave speed on the head, m/s
  const f01 = (J_ZEROS[0][0] / (2 * Math.PI * R)) * c;
  // With a kettle the (1,1) mode is the pitch reference; its in-vacuo value is
  // pulled down ~10 % by air loading, then the principal series follows Rossing.
  const f11Kettle = f01 * IDEAL_11 * 0.9;
  const out: MembraneMode[] = [];
  for (let n = 0; n < J_ZEROS.length; n++) {
    for (let si = 0; si < J_ZEROS[n].length; si++) {
      const j = J_ZEROS[n][si];
      const s = si + 1;
      let hz = (j / (2 * Math.PI * R)) * c;
      if (spec.kettle) {
        // Principal series (s = 1): measured ratios. Others: the plain air-mass
        // loading (≈ −8 %) — the bowl mostly damps them anyway.
        hz = s === 1 && KETTLE_PRINCIPAL[n] != null ? f11Kettle * KETTLE_PRINCIPAL[n] : hz * 0.92;
      }
      const shape = (x: number, y: number) => {
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 1) return 0;
        const th = Math.atan2(dy, dx);
        return besselJ(n, j * r) * Math.cos(n * th);
      };
      out.push({
        id: `m-${n}-${s}`,
        label: n === 0 ? `(0,${s}) · ${s === 1 ? 'no' : s - 1} nodal circle${s - 1 === 1 ? '' : 's'}` : `(${n},${s}) · ${n} diameter${n === 1 ? '' : 's'}${s > 1 ? ` · ${s - 1} circle${s - 1 === 1 ? '' : 's'}` : ''}`,
        lam2: j * j,
        hz,
        drive: 1,
        nodalLines: n + (s - 1),
        shape,
        n,
        s,
        j,
      });
    }
  }
  // Strike weighting: |W| at the strike point (polar → plate-normalised).
  const th = (spec.strike.thetaDeg * Math.PI) / 180;
  const sx = 0.5 + 0.5 * Math.max(0, Math.min(0.98, spec.strike.r)) * Math.cos(th);
  const sy = 0.5 + 0.5 * Math.max(0, Math.min(0.98, spec.strike.r)) * Math.sin(th);
  for (const m of out) m.drive = Math.max(0, Math.min(1, Math.abs(m.shape(sx, sy)) * (spec.kettle && m.n === 0 ? 0.35 : 1)));
  out.sort((p, q) => p.hz - q.hz);
  return out.slice(0, count);
}

/** Effective Q after the damping control (a hand on the head kills the ring). */
export function membraneQ(spec: MembraneSpec): number {
  const Q = HEAD_BY_ID[spec.head].Q;
  return Math.max(3, Q * (1 - 0.9 * Math.max(0, Math.min(1, spec.damping))));
}

/**
 * Sample the drive-frequency displacement field of the head on an N×N grid
 * (row-major, y outer): SIGNED, normalised to ±1, NaN outside the disc — the
 * same contract as plateModes.sampleField so the viz idioms carry over.
 */
export function sampleMembrane(modes: MembraneMode[], f: number, Q: number, N: number): Float32Array {
  const out = new Float32Array(N * N);
  const active = modes.map((m) => ({ m, w: modeResponseSigned(f, m.hz, Q) * m.drive })).filter((e) => Math.abs(e.w) > 1e-3);
  let peak = 1e-9;
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / N;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      const dx = (x - 0.5) * 2;
      const dy = (y - 0.5) * 2;
      if (dx * dx + dy * dy > 1) {
        out[j * N + i] = NaN;
        continue;
      }
      let v = 0;
      for (const e of active) v += e.w * e.m.shape(x, y);
      out[j * N + i] = v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
  }
  for (let k = 0; k < out.length; k++) if (!Number.isNaN(out[k])) out[k] /= peak;
  return out;
}

/** Strength 0..1 of the head's response at f (the best-driven mode's response
 *  relative to a perfect resonance), plus the dominant mode. */
export function membraneStrength(modes: MembraneMode[], f: number, Q: number): { strength: number; dominant: MembraneMode | null } {
  let best = 0;
  let dom: MembraneMode | null = null;
  for (const m of modes) {
    const r = (modeResponse(f, m.hz, Q) / Q) * m.drive;
    if (r > best) {
      best = r;
      dom = m;
    }
  }
  return { strength: Math.min(1, best), dominant: dom };
}

// ── loudspeaker ─────────────────────────────────────────────────────────────
export type DriverId = 'tweeter25' | 'full100' | 'mid130' | 'woofer200' | 'woofer300' | 'sub380';
export type Driver = {
  id: DriverId;
  label: string;
  /** Effective cone / dome diameter, mm. */
  diameterMm: number;
  /** Free-air resonance, Hz. */
  fs: number;
  /** Total Q at resonance. */
  qts: number;
  /** First cone-bending ("breakup") frequency, Hz — where the cone stops moving as one. */
  breakupHz: number;
  /** Cone material, for the copy. */
  cone: string;
  blurb: string;
};
export const DRIVERS: readonly Driver[] = [
  { id: 'tweeter25', label: '25 mm dome tweeter', diameterMm: 25, fs: 800, qts: 0.7, breakupHz: 22000, cone: 'aluminium dome', blurb: 'A stiff metal dome: pistonic to the top of hearing, then one violent breakup above it.' },
  { id: 'full100', label: '100 mm full-range', diameterMm: 100, fs: 90, qts: 0.6, breakupHz: 4500, cone: 'paper cone', blurb: 'Small and light: rigid low, cone flexing by the mid-treble, breakup in the presence region.' },
  { id: 'mid130', label: '130 mm midrange', diameterMm: 130, fs: 60, qts: 0.45, breakupHz: 3200, cone: 'polypropylene cone', blurb: 'Damped plastic cone: the breakup is soft and broad rather than a single peak.' },
  { id: 'woofer200', label: '200 mm woofer', diameterMm: 200, fs: 40, qts: 0.4, breakupHz: 2000, cone: 'paper cone', blurb: 'A classic 8": mass-controlled piston through the bass, edge flexing in the low mids.' },
  { id: 'woofer300', label: '300 mm woofer', diameterMm: 300, fs: 30, qts: 0.35, breakupHz: 1200, cone: 'treated paper cone', blurb: 'A 12": large piston area, low resonance, breakup already in the mids — hence the crossover.' },
  { id: 'sub380', label: '380 mm subwoofer', diameterMm: 380, fs: 22, qts: 0.5, breakupHz: 700, cone: 'aluminium cone', blurb: 'A 15" sub: stiff cone for large excursion; used far below its breakup.' },
];
export const DRIVER_BY_ID: Record<DriverId, Driver> = Object.fromEntries(DRIVERS.map((d) => [d.id, d])) as Record<DriverId, Driver>;

export type ConeStage = 'stiffness' | 'resonance' | 'piston' | 'edge' | 'radial' | 'breakup';
export const CONE_STAGE_LABEL: Record<ConeStage, string> = {
  stiffness: 'BELOW RESONANCE — STIFFNESS-CONTROLLED',
  resonance: 'AT RESONANCE — MAXIMUM EXCURSION',
  piston: 'PISTON BAND — THE CONE MOVES AS ONE',
  edge: 'EDGE FLEXING — SURROUND DECOUPLES',
  radial: 'RADIAL MODES — BELL-LIKE CONE MODES',
  breakup: 'BREAKUP — THE CONE NO LONGER MOVES AS ONE',
};
export const CONE_STAGE_NUM: Record<ConeStage, number> = { stiffness: 1, resonance: 2, piston: 3, edge: 4, radial: 5, breakup: 6 };

export type ConeRead = {
  stage: ConeStage;
  /** Relative excursion 0..1 (1 = at resonance for this driver). */
  excursion: number;
  /** ka — piston/beaming number: π f D / c. */
  ka: number;
  /** −3 dB beamwidth estimate, degrees (∞ below ka ≈ 1). */
  beamDeg: number | null;
  /** Which mode family the drawing uses: 0 = piston, 1 = J₀ flex, n ≥ 2 = radial n. */
  drawMode: number;
  why: string;
  /** Honesty label for this stage. */
  label: 'CALCULATED' | 'ILLUSTRATIVE';
};

const C_AIR = 343;

/** Read the cone's behaviour at drive frequency f. */
export function readCone(driver: Driver, f: number): ConeRead {
  const r = f / driver.fs;
  // Second-order mass-spring response magnitude, normalised to its resonant peak.
  const mag = 1 / Math.sqrt((1 - r * r) ** 2 + (r / driver.qts) ** 2);
  const peak = driver.qts; // |H| at r = 1
  const excursion = Math.min(1, mag / peak);
  const ka = (Math.PI * f * (driver.diameterMm / 1000)) / C_AIR;
  const beamDeg = ka > 1 ? Math.max(8, Math.round((58 / ka) * 2)) : null;
  const b = f / driver.breakupHz;
  let stage: ConeStage;
  let drawMode = 0;
  let why: string;
  let label: ConeRead['label'] = 'ILLUSTRATIVE';
  if (r < 0.7) {
    stage = 'stiffness';
    why = 'Below the suspension resonance the cone is stiffness-controlled: it barely moves and the excursion rises toward resonance. A sealed box raises f_s and stiffens this region further.';
  } else if (r <= 1.4) {
    stage = 'resonance';
    why = `At f_s ≈ ${driver.fs} Hz the moving mass and the suspension exchange energy freely: the cone travels furthest here for the least drive (Q_ts ${driver.qts}). Above it the cone becomes mass-controlled.`;
    label = 'CALCULATED';
  } else if (b < 0.35 && ka < 1.2) {
    stage = 'piston';
    why = 'Mass-controlled piston band: the whole cone moves as one rigid piston and its excursion falls as 1/f² while the radiated pressure stays flat — the reason a driver has a flat passband at all.';
    label = 'CALCULATED';
  } else if (b < 0.55) {
    stage = 'edge';
    drawMode = 1;
    why = 'Edge flexing: the surround and the outer cone can no longer follow the voice coil rigidly — the centre moves more than the rim (a J₀-like profile). ka has passed 1, so the output begins to beam.';
  } else if (b < 1) {
    stage = 'radial';
    drawMode = 2 + Math.min(3, Math.floor((b - 0.55) / 0.15));
    why = 'Radial (bell-like) modes: the cone rim splits into lobes that move in opposite directions — the same J_n cos nθ family as the drumhead, on a stiff shell. Response ripples; off-axis output falls apart.';
  } else {
    stage = 'breakup';
    drawMode = 5;
    why = `Above the first bending frequency (≈ ${driver.breakupHz < 1000 ? `${driver.breakupHz} Hz` : `${(driver.breakupHz / 1000).toFixed(1)} kHz`}) the ${driver.cone} no longer moves as one: several modes ring at once, the response peaks and dips, and distortion rises. This is why crossovers hand over below it.`;
  }
  return { stage, excursion, ka, beamDeg, drawMode, why, label };
}

/**
 * The cone's displacement profile for the drawing, sampled over the cone
 * (plate-normalised disc, NaN outside): piston = flat, flex = J₀(k r) shell
 * profile, radial n = J_n(k r) cos nθ, breakup = a J₀ + two radial modes.
 * Illustrative — a stiffness-profile stand-in, not a cone FEM.
 */
export function sampleCone(read: ConeRead, N: number, phase = 0): Float32Array {
  const out = new Float32Array(N * N);
  let peak = 1e-9;
  const modeAt = (n: number, kR: number, r: number, th: number) => besselJ(n, kR * r) * Math.cos(n * th);
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / N;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      const dx = (x - 0.5) * 2;
      const dy = (y - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) {
        out[j * N + i] = NaN;
        continue;
      }
      const th = Math.atan2(dy, dx);
      let v: number;
      if (read.drawMode === 0) v = 1; // piston: the cone moves as one
      else if (read.drawMode === 1) v = 0.35 + 0.65 * besselJ(0, 2.0 * r); // centre leads the rim
      else if (read.drawMode === 5) v = 0.5 * besselJ(0, 3.5 * r) + 0.6 * modeAt(2, 4.5, r, th + phase) + 0.45 * modeAt(3, 5.8, r, th - phase * 0.7);
      else v = 0.25 + modeAt(read.drawMode, 2.2 + read.drawMode * 0.9, r, th); // radial lobes on a moving cone
      out[j * N + i] = v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
  }
  for (let k = 0; k < out.length; k++) if (!Number.isNaN(out[k])) out[k] /= peak;
  return out;
}
