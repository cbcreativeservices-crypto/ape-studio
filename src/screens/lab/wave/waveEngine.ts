/**
 * Wave Physics Lab — the Room Builder engine (owner spec v4 MASTER §9,
 * green-lit 2D-HYBRID §11.1; launch = the GEOMETRIC/ANALYTIC half, pure JS).
 *
 * All 15 modules are presets of THIS one model: a rectangular (plus optional
 * angled interior walls) 2-D room in METERS, point/speaker sources, a
 * listener; solved by IMAGE-SOURCE reflections + complex point-source
 * superposition. That yields, honestly and cheaply: wavefronts, interference
 * fields, SPL heat maps, reflection paths, arrival times, comb responses,
 * modal patterns, coverage, array/steering behavior, echo timelines and
 * Sabine-style decay. The native real-time FDTD pressure sim remains the
 * separate future track (feasibility spike, [[project-wavelab-spike]]) —
 * every display here is an ILLUSTRATIVE MODEL and badged so (§1.7).
 *
 * NO Skia in this file — pure math, consumed by vizWave (render) and the
 * module screens (readouts) so readouts work even on pre-Skia clients.
 */

export type MaterialKey =
  | 'concrete' | 'glass' | 'drywall' | 'curtain' | 'carpet'
  | 'foam' | 'fiberglass' | 'wood' | 'audience' | 'open';

/** Absorption α at [125, 250, 500, 1k, 2k, 4k] Hz + scattering coefficient.
 *  Textbook-typical teaching values — NOT ISO 354 product data (disclosed). */
export const MATERIALS: Record<MaterialKey, { label: string; alpha: number[]; scatter: number }> = {
  concrete: { label: 'Concrete', alpha: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03], scatter: 0.05 },
  glass: { label: 'Glass', alpha: [0.18, 0.06, 0.04, 0.03, 0.02, 0.02], scatter: 0.05 },
  drywall: { label: 'Drywall', alpha: [0.29, 0.1, 0.05, 0.04, 0.07, 0.09], scatter: 0.08 },
  curtain: { label: 'Curtains', alpha: [0.14, 0.35, 0.55, 0.72, 0.7, 0.65], scatter: 0.25 },
  carpet: { label: 'Carpet', alpha: [0.08, 0.24, 0.57, 0.69, 0.71, 0.73], scatter: 0.15 },
  foam: { label: 'Acoustic foam', alpha: [0.11, 0.3, 0.62, 0.9, 0.98, 0.99], scatter: 0.2 },
  fiberglass: { label: 'Fiberglass', alpha: [0.29, 0.6, 0.98, 0.99, 0.99, 0.99], scatter: 0.2 },
  wood: { label: 'Wood', alpha: [0.15, 0.11, 0.1, 0.07, 0.06, 0.07], scatter: 0.12 },
  audience: { label: 'Audience', alpha: [0.39, 0.57, 0.8, 0.94, 0.92, 0.87], scatter: 0.6 },
  open: { label: 'Opening', alpha: [1, 1, 1, 1, 1, 1], scatter: 0 },
};

/** Authored dock-chip short codes (design pass 2026-08-31): the chips used
 *  `label.slice(0, 5)` which produced blind truncations — DRYWA, CONCR, CURTA —
 *  reading as bugs rather than console tape. */
export const MATERIAL_SHORT: Record<MaterialKey, string> = {
  concrete: 'CONC',
  glass: 'GLASS',
  drywall: 'DRYWL',
  curtain: 'CURT',
  carpet: 'CARPT',
  foam: 'FOAM',
  fiberglass: 'FGLAS',
  wood: 'WOOD',
  audience: 'AUDNC',
  open: 'OPEN',
};

/** Tray blurbs (owner 2026-08-28) — each material's absorption STORY, matching
 *  the alpha table above: what it eats, what it leaves. */
export const MATERIAL_BLURBS: Record<MaterialKey, string> = {
  concrete: 'Reflects almost everything at every frequency — the hardest wall in the kit. Whatever hits it comes back.',
  glass: 'Hard like concrete for mids and highs, but the pane FLEXES at low frequencies and eats a little bass.',
  drywall: 'A light wall that vibrates: absorbs some LOWS, reflects the mids and highs — the opposite of foam.',
  curtain: 'Soft and porous: eats mids and highs, but the lows sail straight through the fabric.',
  carpet: 'Thin porous absorption — good above 500 Hz, useless for bass. Why a carpeted room can still boom.',
  foam: 'The studio wedge: superb above 1 kHz, weak below 250 Hz. Treats echo and sizzle, NOT boom.',
  fiberglass: 'The serious absorber — thick enough to eat mids AND much of the low end. What real treatment is made of.',
  audience: 'People are excellent absorbers — soft, thick, and scattering. A full house darkens and dries the whole room.',
  wood: 'Mostly reflective with a little low-end flex — the warm-sounding hard surface.',
  open: 'No wall at all: everything leaves and nothing returns. Perfect absorption, by definition.',
};

export function alphaAt(mat: MaterialKey, freq: number): number {
  const bands = [125, 250, 500, 1000, 2000, 4000];
  const a = MATERIALS[mat].alpha;
  if (freq <= bands[0]) return a[0];
  if (freq >= bands[5]) return a[5];
  for (let i = 0; i < 5; i++) {
    if (freq <= bands[i + 1]) {
      const t = (Math.log(freq / bands[i])) / Math.log(bands[i + 1] / bands[i]);
      return a[i] + t * (a[i + 1] - a[i]);
    }
  }
  return a[5];
}

export type SourceKind = 'point' | 'speaker' | 'sub';

export type WaveSource = {
  id: string;
  x: number; // meters
  y: number;
  freq: number; // Hz
  levelDb: number; // relative
  delayMs: number;
  polarity: 1 | -1;
  kind: SourceKind;
  /** speakers only: aim + nominal coverage (deg). */
  aimDeg?: number;
  coverageDeg?: number;
  muted?: boolean;
};

export type WaveScene = {
  /** Room size in meters. */
  w: number;
  h: number;
  /** Per-boundary material: [top, right, bottom, left]. */
  boundary: [MaterialKey, MaterialKey, MaterialKey, MaterialKey];
  sources: WaveSource[];
  listener: { x: number; y: number };
  tempC: number;
};

export function speedOfSound(tempC: number): number {
  return 331.3 * Math.sqrt(1 + tempC / 273.15);
}

// ── Image sources (first + second order, rectangular boundaries) ────────────

export type ImageSource = {
  x: number;
  y: number;
  /** Linear pressure reflection factor left after each bounce: Π√(1−α). */
  gain: number;
  /** Which boundaries produced it (for ray drawing), 0=top 1=right 2=bottom 3=left. */
  bounces: number[];
  parent: WaveSource;
};

/** Mirror a real source across the rectangle's boundaries, order ≤ 2.
 *  The image-source construct is a MODELING device, not a real source —
 *  Module 1's own Common Mistake; keep the wording in UIs. */
export function imageSources(scene: WaveScene, src: WaveSource, freq: number, maxOrder = 2): ImageSource[] {
  const refl = (b: number) => Math.sqrt(Math.max(0, 1 - alphaAt(scene.boundary[b], freq)));
  const mirror = (x: number, y: number, b: number): [number, number] =>
    b === 0 ? [x, -y] : b === 1 ? [2 * scene.w - x, y] : b === 2 ? [x, 2 * scene.h - y] : [-x, y];
  const out: ImageSource[] = [{ x: src.x, y: src.y, gain: 1, bounces: [], parent: src }];
  const first: ImageSource[] = [];
  for (let b = 0; b < 4; b++) {
    const [x, y] = mirror(src.x, src.y, b);
    first.push({ x, y, gain: refl(b), bounces: [b], parent: src });
  }
  out.push(...first);
  if (maxOrder >= 2) {
    for (const f of first) {
      for (let b = 0; b < 4; b++) {
        if (b === f.bounces[0]) continue;
        const [x, y] = mirror(f.x, f.y, b);
        out.push({ x, y, gain: f.gain * refl(b), bounces: [...f.bounces, b], parent: src });
      }
    }
  }
  return out;
}

/** Simple nominal-coverage directivity: full inside the wedge, smooth −12 dB
 *  toward the rear (teaching model; real polars are frequency-dependent —
 *  Module 9 teaches exactly that with its frequency slider). */
export function directivityGain(src: WaveSource, dx: number, dy: number, freq: number): number {
  if (src.kind === 'point' || src.kind === 'sub') return 1;
  const aim = ((src.aimDeg ?? 0) * Math.PI) / 180;
  const ang = Math.atan2(dx, dy); // 0 = +y (into the room)
  let d = Math.abs(ang - aim);
  if (d > Math.PI) d = 2 * Math.PI - d;
  // Coverage narrows with frequency: nominal at 1 kHz, wider low, narrower high.
  const nominal = ((src.coverageDeg ?? 90) * Math.PI) / 360; // half-angle
  const half = nominal * Math.max(0.45, Math.min(2.4, Math.sqrt(1000 / Math.max(60, freq))));
  const edge = Math.exp(-Math.pow(Math.max(0, d - half) / (half * 0.55 + 1e-6), 2));
  return Math.max(0.25, edge); // −12 dB floor behind
}

// ── The field: complex superposition of sources + their images ──────────────

export type FieldTerm = { re: number; im: number };

/** Complex pressure at (x,y) for one frequency — the heart of every module.
 *  Sums each unmuted source and its image sources: (g·D/r)·pol·e^{i(kr+ωt0)}. */
export function fieldAt(
  scene: WaveScene,
  x: number,
  y: number,
  freq: number,
  images: ImageSource[][],
): FieldTerm {
  const c = speedOfSound(scene.tempC);
  const k = (2 * Math.PI * freq) / c;
  let re = 0;
  let im = 0;
  for (const imgSet of images) {
    for (const img of imgSet) {
      const s = img.parent;
      if (s.muted) continue;
      const dx = x - img.x;
      const dy = y - img.y;
      const r = Math.max(0.15, Math.hypot(dx, dy));
      const amp = (Math.pow(10, s.levelDb / 20) * img.gain * directivityGain(s, dx, dy, freq)) / r;
      const phase = k * r + 2 * Math.PI * freq * (s.delayMs / 1000);
      const pol = s.polarity;
      re += pol * amp * Math.cos(phase);
      im += pol * amp * Math.sin(phase);
    }
  }
  return { re, im };
}

/** dB magnitude of the field relative to a 1 m free-field single source. */
export function fieldDb(t: FieldTerm): number {
  return 20 * Math.log10(Math.max(1e-6, Math.hypot(t.re, t.im)));
}

// ── Listener-position analysis ───────────────────────────────────────────────

export type Arrival = {
  t: number; // seconds after the earliest source fires
  levelDb: number;
  bounces: number[];
  source: WaveSource;
  pathLen: number;
};

/** Direct + reflected arrivals at a point (for ETC / echo / comb teaching). */
export function arrivalsAt(scene: WaveScene, x: number, y: number, freq: number, maxOrder = 2): Arrival[] {
  const c = speedOfSound(scene.tempC);
  const out: Arrival[] = [];
  for (const s of scene.sources) {
    if (s.muted) continue;
    for (const img of imageSources(scene, s, freq, maxOrder)) {
      // An image mirrored in an OPENING (α = 1 → gain 0) returns nothing, so it
      // is not an arrival at all — listing it would print the −120 dB floor
      // as a phantom tick/tag over the real ones (B-104).
      if (img.gain <= 0) continue;
      const r = Math.max(0.15, Math.hypot(x - img.x, y - img.y));
      out.push({
        t: r / c + s.delayMs / 1000,
        levelDb: s.levelDb + 20 * Math.log10(img.gain / r || 1e-6),
        bounces: img.bounces,
        source: s,
        pathLen: r,
      });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Frequency response at the listener from the full arrival set (comb lab). */
export function responseAt(scene: WaveScene, x: number, y: number, f: number, maxOrder = 1): number {
  const images = scene.sources.map((s) => imageSources(scene, s, f, maxOrder));
  return fieldDb(fieldAt(scene, x, y, f, images));
}

// ── Standing waves (rect room modes) ─────────────────────────────────────────

export function modeFrequency(scene: WaveScene, nx: number, ny: number): number {
  const c = speedOfSound(scene.tempC);
  return (c / 2) * Math.hypot(nx / scene.w, ny / scene.h);
}

/** Modal pressure pattern (±1) — the standing-wave module's map. */
export function modePressure(scene: WaveScene, nx: number, ny: number, x: number, y: number): number {
  return Math.cos((nx * Math.PI * x) / scene.w) * Math.cos((ny * Math.PI * y) / scene.h);
}

// ── Sabine decay (absorption + reverb modules) ───────────────────────────────

/** Sabine RT60 for the 2-D room treated as 3 m tall (disclosed teaching model). */
export function sabineRT(scene: WaveScene, freq: number): number {
  const H = 3;
  const V = scene.w * scene.h * H;
  const areas = [scene.w * H, scene.h * H, scene.w * H, scene.h * H]; // walls only
  let A = scene.w * scene.h * 2 * 0.1; // floor+ceiling fixed modest absorption
  for (let b = 0; b < 4; b++) A += areas[b] * alphaAt(scene.boundary[b], freq);
  return Math.min(9.9, (0.161 * V) / Math.max(0.5, A));
}

// ── Diffraction (Maekawa knife-edge) & refraction (linear gradient rays) ─────

/** Maekawa barrier attenuation: N = 2δ/λ → ≈ 10·log10(3 + 20N) dB (N>−0.2). */
export function maekawaAttenuationDb(pathOver: number, pathDirect: number, freq: number, tempC: number): number {
  const lambda = speedOfSound(tempC) / freq;
  const N = (2 * (pathOver - pathDirect)) / lambda;
  if (N < -0.2) return 0;
  return 10 * Math.log10(3 + 20 * Math.max(0, N));
}

/** Ray curvature under a linear sound-speed gradient (refraction module):
 *  radius R ≈ c / (dc/dz); returns the height of a ray after distance x
 *  launched horizontally at h0. Positive gradient (inversion) bends DOWN. */
export function refractedRayHeight(h0: number, x: number, gradPerM: number, tempC: number): number {
  const c = speedOfSound(tempC);
  if (Math.abs(gradPerM) < 1e-5) return h0;
  const R = c / gradPerM; // signed
  return h0 + (x * x) / (2 * R) * -1;
}

/** Line-array positions: N boxes, splay per box (deg), hung from (x, yTop). */
export function arrayPositions(x: number, yTop: number, n: number, boxH: number, splayDeg: number): { x: number; y: number; aimDeg: number }[] {
  const out: { x: number; y: number; aimDeg: number }[] = [];
  let y = yTop;
  let aim = 0;
  for (let i = 0; i < n; i++) {
    out.push({ x, y, aimDeg: aim });
    aim += splayDeg;
    y += boxH * Math.cos((aim * Math.PI) / 180);
  }
  return out;
}
