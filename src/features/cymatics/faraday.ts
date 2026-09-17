/**
 * Cymatics Lab — Faraday-wave model for the Liquid Studio (spec §1.4). PURE
 * (imports only the liquid table + Bessel), node-tested, consumed by the viz
 * worklets as plain numbers / Float32Arrays.
 *
 * WHAT IS CALCULATED, WHAT IS APPROXIMATED, WHAT IS ILLUSTRATIVE — every
 * screen prints this honestly:
 *  • DISPERSION (Calculated): ω² = (g k + σ k³/ρ) · tanh(k d). Solved for k
 *    at the RESPONSE frequency, which for Faraday waves is HALF the drive
 *    frequency (the subharmonic parametric resonance, Faraday 1831).
 *  • CONTAINER MODES (Calculated): a circular dish has standing modes
 *    J_n(k r)·cos(nθ) with k R = a tabulated zero of J_n' (free contact line)
 *    or of J_n (pinned contact line); a square dish has cos(mπx/L)cos(nπy/L).
 *  • ONSET THRESHOLD (Approximated): the damped-Mathieu first tongue gives
 *    a_c = 4 γ ω_r / (k tanh(k d)) with γ the wave damping rate — bulk
 *    viscous 2νk², bottom boundary layer k√(νω_r/2)/sinh(2kd) (Miles), and a
 *    contact-line/meniscus term c·√(νω_r)/R that dominates in small dishes
 *    (pinned c ≈ 4, free c ≈ 1.2). Low-viscosity theory; no CFD.
 *  • PATTERN FAMILY (Approximated, curated): which standing pattern appears
 *    above onset follows the published phase maps (Douady 1990; Kudrolli &
 *    Gollub 1996; Binks & van de Water 1997; Edwards & Fauve 1994): low ν →
 *    squares, moderate ν at low f → hexagons, high ν or high f → stripes,
 *    two-frequency drive → quasiperiodic; when the wavelength is comparable
 *    to the dish, the dish's own modes (rings, lobes, spokes) win. The app
 *    never invents a pattern outside its region.
 *  • BEHAVIOUR STAGES (Illustrative bands of a/a_c): flat → sloshing → small
 *    ripples → onset → stable → mode transition → mixed → unstable →
 *    chaotic → splashing warning.
 */
import { besselJ } from './plateModes';
import { kinematicViscosity, surfaceTension, LIQUID_BY_ID, type LiquidId } from './liquids';

export const G = 9.80665;

export type ContainerShape = 'circle' | 'square' | 'rect' | 'ring';
export type ContactLine = 'pinned' | 'free';
export type BottomShape = 'flat' | 'bowl';
export type Waveform = 'sine' | 'square' | 'triangle' | 'pulse';

export type LiquidSpec = {
  liquid: LiquidId;
  /** Temperature, °C (advanced). */
  tempC: number;
  /** Depth, mm. */
  depthMm: number;
  shape: ContainerShape;
  /** Diameter (circle/ring) or side (square) or long side (rect), mm. */
  sizeMm: number;
  /** Rect short/long ratio. */
  aspect: number;
  /** Wall height above the liquid, mm — sets the splash margin. */
  wallMm: number;
  bottom: BottomShape;
  contact: ContactLine;
  waveform: Waveform;
  /** Second drive frequency as a ratio of the first (null = single). */
  dualRatio: number | null;
  /** Relative phase of the second tone, degrees (visual). */
  dualPhaseDeg: number;
};

export const DEFAULT_LIQUID: LiquidSpec = {
  liquid: 'water',
  tempC: 20,
  depthMm: 4,
  shape: 'circle',
  sizeMm: 100,
  aspect: 0.7,
  wallMm: 20,
  bottom: 'flat',
  contact: 'pinned',
  waveform: 'sine',
  dualRatio: null,
  dualPhaseDeg: 0,
};

// ── dispersion ───────────────────────────────────────────────────────────────
/** Angular frequency of a free-surface wave of wavenumber k (rad/m). */
export function omegaOf(k: number, d: number, sigma: number, rho: number): number {
  return Math.sqrt((G * k + (sigma * k * k * k) / rho) * Math.tanh(k * d));
}

/** Solve the gravity–capillary dispersion for k at angular frequency ω (bisection). */
export function solveK(omega: number, d: number, sigma: number, rho: number): number {
  let lo = 1e-3;
  let hi = 1e6;
  for (let i = 0; i < 80; i++) {
    const mid = Math.sqrt(lo * hi);
    if (omegaOf(mid, d, sigma, rho) < omega) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// ── container modes ─────────────────────────────────────────────────────────
/** Zeros of J_n' (free contact line — the surface slope vanishes at the wall). */
const JP_ZEROS: number[][] = [
  [3.8317, 7.0156, 10.1735, 13.3237],
  [1.8412, 5.3314, 8.5363, 11.706],
  [3.0542, 6.7061, 9.9695, 13.1704],
  [4.2012, 8.0152, 11.3459, 14.5858],
  [5.3176, 9.2824, 12.6819, 15.9641],
  [6.4156, 10.5199, 13.9872, 17.3128],
  [7.5013, 11.7349, 15.2682, 18.6374],
];
/** Zeros of J_n (pinned contact line — the surface is held at the wall). */
const J_ZEROS: number[][] = [
  [2.4048, 5.5201, 8.6537, 11.7915],
  [3.8317, 7.0156, 10.1735, 13.3237],
  [5.1356, 8.4172, 11.6198, 14.796],
  [6.3802, 9.761, 13.0152, 16.2235],
  [7.5883, 11.0647, 14.3725, 17.616],
  [8.7715, 12.3386, 15.7002, 18.9801],
  [9.9361, 13.5893, 17.0038, 20.3208],
];

export type ContainerMode = {
  id: string;
  /** Nodal diameters (circle) / x half-waves (square). */
  n: number;
  /** Nodal circles (circle) / y half-waves (square). */
  s: number;
  /** Wavenumber, rad/m. */
  k: number;
  /** Natural frequency of the free-surface mode, Hz. */
  hz: number;
  label: string;
  family: 'rings' | 'lobes' | 'spokes' | 'star' | 'checker' | 'stripes';
};

/** The dish's standing-wave modes below `maxHz`, ascending. */
export function containerModes(spec: LiquidSpec, maxHz = 400): ContainerMode[] {
  const L = LIQUID_BY_ID[spec.liquid];
  const d = spec.depthMm / 1000;
  const sigma = surfaceTension(L, spec.tempC);
  const rho = L.rho;
  const out: ContainerMode[] = [];
  if (spec.shape === 'circle' || spec.shape === 'ring') {
    const R = spec.sizeMm / 2000;
    const table = spec.contact === 'pinned' ? J_ZEROS : JP_ZEROS;
    for (let n = 0; n < table.length; n++) {
      for (let s = 0; s < table[n].length; s++) {
        if (spec.shape === 'ring' && n === 0 && s === 0) continue;
        const k = table[n][s] / R;
        const hz = omegaOf(k, d, sigma, rho) / (2 * Math.PI);
        if (hz > maxHz) continue;
        const family = n === 0 ? 'rings' : n <= 3 ? 'lobes' : n <= 5 ? 'spokes' : 'star';
        out.push({ id: `c-${n}-${s}`, n, s, k, hz, label: n === 0 ? `${s + 1} ring${s === 0 ? '' : 's'}` : `${n} lobe${n === 1 ? '' : 's'} · ${s + 1} ring${s === 0 ? '' : 's'}`, family });
      }
    }
  } else {
    const a = spec.sizeMm / 1000;
    const b = spec.shape === 'square' ? a : a * Math.max(0.5, Math.min(1, spec.aspect));
    for (let m = 0; m <= 8; m++) {
      for (let n = 0; n <= 8; n++) {
        if (m + n === 0) continue;
        const k = Math.PI * Math.sqrt((m / a) ** 2 + (n / b) ** 2);
        const hz = omegaOf(k, d, sigma, rho) / (2 * Math.PI);
        if (hz > maxHz) continue;
        out.push({ id: `s-${m}-${n}`, n: m, s: n, k, hz, label: `(${m},${n})`, family: m === 0 || n === 0 ? 'stripes' : 'checker' });
      }
    }
  }
  out.sort((p, q) => p.hz - q.hz);
  return out;
}

// ── threshold ───────────────────────────────────────────────────────────────
export type Damping = { bulk: number; bottom: number; contact: number; total: number };

/** Wave damping rate γ (1/s) at wavenumber k and response ω_r. */
export function dampingRate(spec: LiquidSpec, k: number, omegaR: number, nuOverride?: number): Damping {
  const L = LIQUID_BY_ID[spec.liquid];
  const nu = nuOverride ?? kinematicViscosity(L, spec.tempC);
  const d = spec.depthMm / 1000;
  const R = spec.shape === 'circle' || spec.shape === 'ring' ? spec.sizeMm / 2000 : spec.sizeMm / 2000;
  const bulk = 2 * nu * k * k;
  const bottom = (k * Math.sqrt((nu * omegaR) / 2)) / Math.sinh(2 * k * d);
  const cCl = spec.contact === 'pinned' ? 4 : 1.2;
  const contact = (cCl * Math.sqrt(nu * omegaR)) / R;
  return { bulk, bottom, contact, total: bulk + bottom + contact };
}

/** Effective kinematic viscosity — cornstarch stiffens with acceleration. */
export function effectiveNu(spec: LiquidSpec, accelG: number): number {
  const L = LIQUID_BY_ID[spec.liquid];
  const nu = kinematicViscosity(L, spec.tempC);
  if (!L.shearThickening) return nu;
  return nu * (1 + (accelG / 0.25) ** 2);
}

export type FaradayRead = {
  /** Response (Faraday) frequency, Hz = f_drive / 2. */
  responseHz: number;
  /** Wavenumber of the response wave, rad/m, and its wavelength, mm. */
  k: number;
  lambdaMm: number;
  /** Onset acceleration in g. */
  thresholdG: number;
  damping: Damping;
  /** Platform displacement amplitude at this drive, µm. */
  displacementUm: number;
  /** Dish radius (or half-side) over wavelength — small = the dish's modes dominate. */
  sizeOverLambda: number;
};

/** The Faraday numbers for a drive frequency + acceleration. */
export function readFaraday(spec: LiquidSpec, driveHz: number, accelG: number): FaradayRead {
  const L = LIQUID_BY_ID[spec.liquid];
  const d = spec.depthMm / 1000;
  const sigma = surfaceTension(L, spec.tempC);
  const responseHz = driveHz / 2;
  const omegaR = 2 * Math.PI * responseHz;
  const k = solveK(omegaR, d, sigma, L.rho);
  const damping = dampingRate(spec, k, omegaR, effectiveNu(spec, accelG));
  const aC = (4 * damping.total * omegaR) / (k * Math.tanh(k * d));
  const lambdaMm = (2 * Math.PI * 1000) / k;
  const omegaD = 2 * Math.PI * driveHz;
  const displacementUm = ((accelG * G) / (omegaD * omegaD)) * 1e6;
  const half = spec.sizeMm / 2000;
  return { responseHz, k, lambdaMm, thresholdG: aC / G, damping, displacementUm, sizeOverLambda: half / (lambdaMm / 1000) };
}

// ── stages + pattern family ─────────────────────────────────────────────────
export type Stage =
  | 'flat'
  | 'sloshing'
  | 'ripples'
  | 'onset'
  | 'stable'
  | 'transition'
  | 'mixed'
  | 'unstable'
  | 'chaotic'
  | 'splash'
  | 'damped';

export const STAGE_LABEL: Record<Stage, string> = {
  flat: 'FLAT SURFACE',
  sloshing: 'GENTLE SLOSHING',
  ripples: 'SMALL RIPPLES',
  onset: 'PATTERN ONSET',
  stable: 'STABLE STANDING PATTERN',
  transition: 'MODE TRANSITION',
  mixed: 'COMPETING PATTERNS',
  unstable: 'UNSTABLE MOTION',
  chaotic: 'CHAOTIC SURFACE',
  splash: 'SPLASHING — ATOMISATION WARNING',
  damped: 'VISCOUS — NO PATTERN IN RANGE',
};
export const STAGE_NUM: Record<Stage, number> = { flat: 1, sloshing: 2, ripples: 3, onset: 4, stable: 5, transition: 6, mixed: 7, unstable: 8, chaotic: 9, splash: 10, damped: 0 };

export type PatternFamily =
  | 'none'
  | 'rings'
  | 'lobes'
  | 'spokes'
  | 'star'
  | 'checker'
  | 'squares'
  | 'stripes'
  | 'hexagons'
  | 'quasiperiodic'
  | 'traveling'
  | 'chaotic';

export const FAMILY_LABEL: Record<PatternFamily, string> = {
  none: '—',
  rings: 'Concentric rings',
  lobes: 'Circular lobes',
  spokes: 'Radial spokes',
  star: 'Star pattern',
  checker: 'Checkerboard (dish mode)',
  squares: 'Squares',
  stripes: 'Stripes',
  hexagons: 'Hexagons',
  quasiperiodic: 'Quasiperiodic (superlattice)',
  traveling: 'Travelling pattern',
  chaotic: 'Spatiotemporal chaos',
};

export type LiquidState = {
  stage: Stage;
  /** a / a_c. */
  ratio: number;
  /** Primary + secondary families (secondary for transition/mixed blends). */
  family: PatternFamily;
  family2: PatternFamily;
  /** 0..1 blend toward family2. */
  blend: number;
  /** The dish mode that carries a container-regime pattern (or the harmonic sloshing mode). */
  mode: ContainerMode | null;
  /** Standing-wave amplitude envelope, 0..1. */
  envelope: number;
  /** Which frequency the visible surface oscillates at. */
  oscHz: number;
  /** Whether the response is the subharmonic (f/2) or harmonic (f) — sloshing/ripples are harmonic. */
  subharmonic: boolean;
  /** Human "why" line. */
  why: string;
};

/** Nearest dish mode to wavenumber k (by log distance). */
export function nearestMode(modes: ContainerMode[], k: number): ContainerMode | null {
  let best: ContainerMode | null = null;
  let bd = Infinity;
  for (const m of modes) {
    const d = Math.abs(Math.log(m.k / k));
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best;
}

/** Bulk-regime family from the published phase maps (Approximated). */
export function bulkFamily(nu: number, driveHz: number, dual: boolean): PatternFamily {
  if (dual) return 'quasiperiodic';
  // Kudrolli & Gollub 1996 / Binks & van de Water 1997: squares at low ν,
  // a hexagon band at moderate ν (~5–15 cSt) and low frequency, stripes
  // beyond. Boundaries are the published order of magnitude, not sharp lines.
  if (nu <= 4e-6) return driveHz < 90 ? 'squares' : 'stripes';
  if (nu <= 1.5e-5) return driveHz < 50 ? 'hexagons' : 'stripes';
  return 'stripes';
}

/** The next family a pattern hands over to as the drive climbs. */
function successor(f: PatternFamily): PatternFamily {
  switch (f) {
    case 'squares':
      return 'stripes';
    case 'hexagons':
      return 'stripes';
    case 'stripes':
      return 'squares';
    case 'rings':
      return 'lobes';
    case 'lobes':
      return 'spokes';
    case 'spokes':
      return 'star';
    case 'star':
      return 'stripes';
    case 'checker':
      return 'stripes';
    case 'quasiperiodic':
      return 'stripes';
    default:
      return 'stripes';
  }
}

/** Classify the surface for a drive frequency + acceleration. */
export function readLiquid(spec: LiquidSpec, driveHz: number, accelG: number): LiquidState {
  const L = LIQUID_BY_ID[spec.liquid];
  const fr = readFaraday(spec, driveHz, accelG);
  const modes = containerModes(spec);
  const ratio = accelG / fr.thresholdG;
  const nu = effectiveNu(spec, accelG);
  const dual = spec.dualRatio != null;
  // Splash: the platform's peak acceleration flings liquid once the standing
  // wave's crest height nears the free wall height, or far above onset.
  const crestMm = fr.lambdaMm * 0.12 * Math.min(4, Math.max(0, ratio - 1));
  const splash = accelG >= 1.0 && (crestMm > spec.wallMm * 0.8 || ratio > 7);

  const containerRegime = fr.sizeOverLambda < 2.5;
  const mode = nearestMode(modes, fr.k);
  const baseFamily: PatternFamily = containerRegime && mode ? mode.family : bulkFamily(nu, driveHz, dual);
  if (spec.shape === 'ring' && (baseFamily === 'lobes' || baseFamily === 'checker')) {
    /* annulus: lobes/checker still read fine; rings/spokes preferred by the mode table */
  }

  // Below onset: harmonic (at f) sloshing when a low dish mode is near the DRIVE
  // frequency; otherwise meniscus ripples that grow toward onset.
  const sloshMode = modes.find((m) => Math.abs(Math.log(m.hz / driveHz)) < 0.08) ?? null;
  const thresholdHuge = fr.thresholdG > 2.5;

  if (thresholdHuge) {
    const env = Math.min(0.25, accelG * 0.15);
    return {
      stage: accelG < 0.05 ? 'flat' : 'damped',
      ratio,
      family: 'none',
      family2: 'none',
      blend: 0,
      mode: null,
      envelope: env,
      oscHz: driveHz,
      subharmonic: false,
      why: L.shearThickening
        ? `Shear-thickening: shaking harder raises the effective viscosity (≈ ${(nu * 1e6).toFixed(0)} cSt now), so the surface stiffens instead of organising. Holes and fingers appear only far above this rig’s range.`
        : `Viscous damping dominates: onset would need ≈ ${fr.thresholdG.toFixed(1)} g, beyond this rig. The surface just follows the platform.`,
    };
  }
  if (ratio < 0.15) {
    return { stage: 'flat', ratio, family: 'none', family2: 'none', blend: 0, mode: null, envelope: 0.02 * ratio, oscHz: driveHz, subharmonic: false, why: 'Well below the Faraday threshold — the free surface rides up and down with the platform, essentially flat.' };
  }
  if (ratio < 0.6) {
    return sloshMode
      ? { stage: 'sloshing', ratio, family: sloshMode.family, family2: 'none', blend: 0, mode: sloshMode, envelope: 0.12 + 0.2 * ratio, oscHz: driveHz, subharmonic: false, why: `The drive is near the dish’s own ${sloshMode.label} sloshing mode (${sloshMode.hz.toFixed(1)} Hz), so the whole surface rocks gently AT the drive frequency — a forced response, not yet a Faraday pattern.` }
      : { stage: 'ripples', ratio, family: 'rings', family2: 'none', blend: 0, mode: null, envelope: 0.06 + 0.1 * ratio, oscHz: driveHz, subharmonic: false, why: 'Small ripples spread from the wall where the meniscus is driven directly. They oscillate at the drive frequency and stay faint — the bulk surface has not yet gone unstable.' };
  }
  if (ratio < 1.0) {
    return { stage: 'ripples', ratio, family: 'rings', family2: 'none', blend: 0, mode: sloshMode, envelope: 0.1 + 0.15 * ratio, oscHz: driveHz, subharmonic: false, why: `Approaching onset (${(ratio * 100).toFixed(0)} % of the threshold). Edge ripples strengthen; the subharmonic pattern is still damped out.` };
  }
  if (splash) {
    return { stage: 'splash', ratio, family: 'chaotic', family2: 'chaotic', blend: 0.5, mode, envelope: 1, oscHz: fr.responseHz, subharmonic: true, why: `Crests (~${crestMm.toFixed(0)} mm) reach the wall height and the peak acceleration is ${accelG.toFixed(2)} g — droplets eject. Real rigs mist and splash here; back the level off.` };
  }
  if (ratio < 1.15) {
    return { stage: 'onset', ratio, family: baseFamily, family2: 'none', blend: 0, mode, envelope: 0.25 + (ratio - 1) * 3, oscHz: fr.responseHz, subharmonic: true, why: `Just above threshold: a faint ${FAMILY_LABEL[baseFamily].toLowerCase()} pattern emerges, oscillating at HALF the drive frequency (${fr.responseHz.toFixed(1)} Hz) — the Faraday subharmonic.` };
  }
  if (ratio < 1.8) {
    return { stage: 'stable', ratio, family: baseFamily, family2: 'none', blend: 0, mode, envelope: 0.7 + (ratio - 1.15) * 0.4, oscHz: fr.responseHz, subharmonic: true, why: containerRegime && mode ? `The wavelength (${fr.lambdaMm.toFixed(0)} mm) is comparable to the dish, so the dish’s ${mode.label} mode sets the pattern.` : `A stable ${FAMILY_LABEL[baseFamily].toLowerCase()} lattice at λ ≈ ${fr.lambdaMm.toFixed(0)} mm — the classic Faraday pattern for this viscosity and frequency.` };
  }
  if (ratio < 2.6) {
    const f2 = successor(baseFamily);
    return { stage: 'transition', ratio, family: baseFamily, family2: f2, blend: (ratio - 1.8) / 0.8, mode, envelope: 1, oscHz: fr.responseHz, subharmonic: true, why: `Further above onset the lattice deforms and hands over toward ${FAMILY_LABEL[f2].toLowerCase()} — a secondary instability of the first pattern.` };
  }
  if (ratio < 3.5) {
    return { stage: 'mixed', ratio, family: baseFamily, family2: successor(baseFamily), blend: 0.5, mode, envelope: 1, oscHz: fr.responseHz, subharmonic: true, why: 'Two patterns compete for the surface and neither wins — domains of each form, drift and dissolve.' };
  }
  if (ratio < 5) {
    return { stage: 'unstable', ratio, family: 'traveling', family2: baseFamily, blend: 0.4, mode, envelope: 1, oscHz: fr.responseHz, subharmonic: true, why: 'The standing lattice breaks into slowly travelling fronts and defects. Order comes and goes.' };
  }
  return { stage: 'chaotic', ratio, family: 'chaotic', family2: 'chaotic', blend: 0.5, mode, envelope: 1, oscHz: fr.responseHz, subharmonic: true, why: 'Spatiotemporal chaos: many wavevectors excited at once, no lasting structure. One more step and the surface starts to throw droplets.' };
}

// ── surface height basis ────────────────────────────────────────────────────
/**
 * Sample a unit-amplitude standing-wave basis for a pattern family on an N×N
 * grid over the dish (plate-normalised x,y ∈ [0,1]; NaN outside the dish).
 * `phaseB` requests the quadrature partner used for travelling / mixed
 * animation (sin instead of cos along the pattern's primary axis).
 */
export function sampleSurface(spec: LiquidSpec, family: PatternFamily, k: number, mode: ContainerMode | null, N: number, phaseB = false, seed = 1): Float32Array {
  const out = new Float32Array(N * N);
  const circle = spec.shape === 'circle' || spec.shape === 'ring';
  const aspect = spec.shape === 'rect' ? Math.max(0.5, Math.min(1, spec.aspect)) : 1;
  const sizeM = spec.sizeMm / 1000;
  const kk = k * sizeM; // radians across the dish width
  const ringInner = 0.35;
  const c30 = Math.cos(Math.PI / 6);
  const s30 = 0.5;
  let peak = 1e-9;
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / N;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N;
      const dx = (x - 0.5) * 2;
      const dy = (y - 0.5) * 2;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (circle && (r > 1 || (spec.shape === 'ring' && r < ringInner))) {
        out[j * N + i] = NaN;
        continue;
      }
      if (!circle && y > aspect + 1e-6) {
        out[j * N + i] = NaN;
        continue;
      }
      // Bowl bottom: shallower at the edge → shorter local wavelength (k ∝ 1/√d
      // in the shallow limit). Applied as a radial stretch of the phase.
      const bowl = spec.bottom === 'bowl' ? 1 + 0.35 * r * r : 1;
      const px = (x - 0.5) * kk * bowl;
      const py = (y - 0.5) * kk * bowl;
      const th = Math.atan2(dy, dx);
      const rr = r * (kk / 2) * bowl; // k·r in radians (r normalised to the radius)
      let v = 0;
      switch (family) {
        case 'squares':
          v = phaseB ? Math.sin(px) + Math.sin(py) : Math.cos(px) + Math.cos(py);
          break;
        case 'stripes':
          v = phaseB ? Math.sin(px) : Math.cos(px);
          break;
        case 'hexagons': {
          const a1 = px;
          const a2 = -0.5 * px + c30 * py;
          const a3 = -0.5 * px - c30 * py;
          v = phaseB ? Math.sin(a1) + Math.sin(a2) + Math.sin(a3) : Math.cos(a1) + Math.cos(a2) + Math.cos(a3);
          break;
        }
        case 'quasiperiodic': {
          const b1 = px;
          const b2 = py;
          const b3 = (px + py) * 0.7071;
          const b4 = (px - py) * 0.7071;
          v = phaseB ? Math.sin(b1) + Math.sin(b2) + Math.sin(b3) + Math.sin(b4) : Math.cos(b1) + Math.cos(b2) + Math.cos(b3) + Math.cos(b4);
          break;
        }
        case 'rings':
          v = besselJ(0, phaseB ? rr + Math.PI / 2 : rr);
          break;
        case 'lobes':
        case 'spokes':
        case 'star': {
          const n = mode ? mode.n : family === 'lobes' ? 2 : family === 'spokes' ? 5 : 7;
          const kr = mode ? r * (mode.k * (sizeM / 2)) * bowl : rr;
          v = besselJ(n, kr) * (phaseB ? Math.sin(n * th) : Math.cos(n * th));
          break;
        }
        case 'checker': {
          const m = mode ? mode.n : 3;
          const n = mode ? mode.s : 3;
          v = phaseB ? Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * (y / aspect)) : Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * (y / aspect));
          break;
        }
        case 'traveling':
          v = phaseB ? Math.sin(px * 0.9 + 0.3 * py) : Math.cos(px * 0.9 + 0.3 * py);
          break;
        case 'chaotic': {
          // Several random-orientation waves (seeded) — no lasting structure.
          let acc = 0;
          for (let q = 0; q < 6; q++) {
            const ang = ((seed * 7 + q * 53) % 360) * (Math.PI / 180) + (phaseB ? 0.9 : 0);
            const ph = ((seed * 13 + q * 29) % 100) / 100 * 2 * Math.PI;
            const sc = 0.7 + ((seed * 3 + q * 17) % 50) / 100;
            acc += Math.cos((px * Math.cos(ang) + py * Math.sin(ang)) * sc + ph) / 6;
          }
          v = acc * 2.2;
          break;
        }
        case 'none':
        default:
          v = 0;
      }
      out[j * N + i] = v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
  }
  for (let q = 0; q < out.length; q++) if (!Number.isNaN(out[q])) out[q] /= peak;
  return out;
}

/**
 * Caustic brightness for the refraction view: light through a wavy surface
 * focuses where the surface is concave (negative curvature). Returns 0..1
 * per cell; NaN outside. Illustrative — a paraxial single-bounce estimate.
 */
export function causticMap(h: Float32Array, N: number, strength = 0.9): Float32Array {
  const out = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const c = h[j * N + i];
      if (Number.isNaN(c)) {
        out[j * N + i] = NaN;
        continue;
      }
      const l = i > 0 ? h[j * N + i - 1] : c;
      const rgt = i < N - 1 ? h[j * N + i + 1] : c;
      const u = j > 0 ? h[(j - 1) * N + i] : c;
      const dn = j < N - 1 ? h[(j + 1) * N + i] : c;
      const lap = (safe(l, c) + safe(rgt, c) + safe(u, c) + safe(dn, c) - 4 * c) * (N / 24);
      // intensity ∝ 1 / (1 + strength·∇²h): concave (lap < 0) brightens.
      const inten = 1 / (1 + strength * lap);
      out[j * N + i] = Math.max(0, Math.min(1, inten * 0.5));
    }
  }
  return out;
}
function safe(v: number, fallback: number): number {
  return Number.isNaN(v) ? fallback : v;
}
