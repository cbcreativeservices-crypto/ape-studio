/**
 * Vocal folds, laryngoscopic view — the MODEL behind the drawing (owner GO
 * 2026-10-14: redraw at the current standard; the 2026-09 drawing was two
 * wide skin-toned lobes and read as a body part, not a larynx).
 *
 * Pure and worklet-safe: every function carries 'worklet' so the drawing in
 * speechViz.tsx can build each frame on the UI thread, and the node tests
 * (test/vocalFolds_20261014.test.ts) can check the same geometry.
 *
 * The view (viewBox 340 × 130; the larynx occupies the left ~200):
 *   looking DOWN the larynx, FRONT (anterior) at the TOP, as a laryngoscope
 *   or endoscope shows it. Front to back: epiglottis (arch) → anterior
 *   commissure where the two TRUE folds meet → the folds run back as a V to
 *   the vocal processes of the two arytenoid cartilages (bottom). Lateral to
 *   each true fold: the ventricle (a dark slit) and the VENTRICULAR (false)
 *   fold. The aryepiglottic folds rim the inlet from the epiglottis back to
 *   the arytenoids; the pyriform sinuses are the dark pockets outside them.
 *
 * Motion model (one clock, `cycles`, plus `ab` = abduction 0 → 1):
 *   • Voiced (ab = 0): only the MEMBRANOUS front ~2/3 of each fold vibrates
 *     (the back third is cartilage — the vocal process — and stays closed).
 *     The glottal opening follows the Rosenberg glottal-pulse shape: opens
 *     over 42 % of the cycle, closes much faster over 16 %, closed for the
 *     remaining 42 % (open quotient 0.58; opening ≈ 2.6× the closing, as in speech).
 *     The mucosal wave travels laterally across the upper surface of each
 *     fold as a ripple, starting at the free edge and fading by about half
 *     the fold's width. The trace on the right is the same pulse — the
 *     airflow puffs that pass the glottis — so drawing and trace stay in step.
 *   • Unvoiced (ab = 1): the arytenoids swing the vocal processes apart into
 *     the breathing V (~40° included angle); the folds do not vibrate; the
 *     trachea's cartilage rings show through the open glottis.
 *   • The shown rate is about 100× slower than a typical adult voice
 *     (VF_SHOWN_HZ vs VF_TYPICAL_F0_HZ) — the drawing says so.
 */

export const VF_W = 340;
export const VF_H = 130;
/** Anterior commissure (where the folds meet, under the epiglottis). */
export const VF_AX = 120;
export const VF_AY = 41;
/** Posterior end (vocal process) y when adducted. */
const PY0 = 91;
/** Fraction of each fold (from the front) that is membranous and vibrates. */
export const VF_MEMBRANOUS = 0.66;
/** Half-gap at the widest point of a voiced cycle (viewBox units). */
export const VF_OPEN_MAX = 4.2;
/** Displayed vibration rate and the voice it stands for. */
export const VF_SHOWN_HZ = 1.2;
export const VF_TYPICAL_F0_HZ = 120;
export const VF_SLOWDOWN = Math.round(VF_TYPICAL_F0_HZ / VF_SHOWN_HZ);
/** Reduced motion, voiced: the still frame (part-way open — "mid-cycle"). */
export const VF_STILL_PHASE = 0.2;
/** Rosenberg pulse: opening and closing fractions of the cycle. */
export const VF_T_OPEN = 0.42;
export const VF_T_CLOSE = 0.16;
/** Points per fold edge. */
const N = 11;
/** Trace (WHAT COMES OUT): x0, width, baseline, pulse height, cycles shown. */
export const VF_TRACE = { x0: 205, w: 125, base: 70, amp: 28, cycles: 6, samples: 160, noise: 12 } as const;

/** Tissue colours. Mucosa is pink-red; the true folds are pearly ivory —
 *  never a skin tone (the test checks hue/saturation). */
export const VF_PALETTE = {
  fieldCentre: '#6e2a2e',
  fieldMid: '#43181b',
  pyriform: '#1c090b',
  vestibuleCentre: '#9a3c40',
  vestibuleEdge: '#6a2328',
  falseFold: '#b14d51',
  falseFoldHi: '#c4605f',
  ventricle: '#2b0c0f',
  gapCentre: '#1a0a0c',
  gapEdge: '#050405',
  ring: '#5a2a2e',
  foldMedial: '#fbf8f2',
  foldLateral: '#d3cfc8',
  waveCrest: '#ffffff',
  waveShadow: '#aaa49b',
  interarytenoid: '#a5474a',
  arytenoid: '#c0605f',
  arytenoidHi: '#d98380',
  corniculate: '#d98582',
  aeRim: '#d27a78',
  aeRimHi: '#eda7a1',
  epiglottis: '#de8f8b',
  epiglottisRim: '#f0b2ac',
  vessel: '#b4545a',
} as const;

const f = (n: number): string => {
  'worklet';
  return n.toFixed(1);
};

export function frac(x: number): number {
  'worklet';
  return x - Math.floor(x);
}

/** Glottal opening 0..1 at a point in the cycle (Rosenberg shape). */
export function glottalPulse(cycles: number): number {
  'worklet';
  const p = frac(cycles);
  if (p < VF_T_OPEN) return 0.5 * (1 - Math.cos((Math.PI * p) / VF_T_OPEN));
  if (p < VF_T_OPEN + VF_T_CLOSE) return Math.cos((Math.PI * (p - VF_T_OPEN)) / (2 * VF_T_CLOSE));
  return 0;
}

/** Mucosal-wave progress 0 (at the free edge) → 1 (half-way across). */
export function mucosalWave(cycles: number): number {
  'worklet';
  const p = frac(cycles);
  return Math.min(1, Math.max(0, (p - 0.04) / 0.72));
}

/** Vocal-process position for side s (−1 = viewer's left, +1 = right). */
export function posterior(s: number, ab: number): [number, number] {
  'worklet';
  return [VF_AX + s * (0.5 + 19 * ab), PY0 - 1.5 * ab];
}

/** A point on the fold's resting free edge, u = 0 (front) … 1 (vocal process). */
export function foldBase(s: number, u: number, ab: number): [number, number] {
  'worklet';
  const p = posterior(s, ab);
  return [VF_AX + (p[0] - VF_AX) * u, VF_AY + (p[1] - VF_AY) * u];
}

/** Vibration envelope along the fold: 0 at the commissure, peak at the middle
 *  of the membranous part, 0 over the cartilaginous back third. */
export function foldProfile(u: number): number {
  'worklet';
  return u < VF_MEMBRANOUS ? Math.sin((Math.PI * u) / VF_MEMBRANOUS) : 0;
}

/** Visible width of the fold's upper surface (thin band, ~7.5 at most). */
export function foldWidth(u: number): number {
  'worklet';
  return 0.8 + 6 * Math.pow(Math.sin(Math.PI * (0.02 + 0.88 * u)), 0.85);
}

/** Free-edge x for side s with the glottis `open` (0..1, already × (1 − ab)). */
export function medialX(s: number, u: number, ab: number, open: number): number {
  'worklet';
  return foldBase(s, u, ab)[0] + s * open * VF_OPEN_MAX * foldProfile(u);
}

function smoothThrough(xs: number[], ys: number[], move: boolean): string {
  'worklet';
  const n = xs.length;
  let d = (move ? 'M' : 'L') + f(xs[0]) + ' ' + f(ys[0]);
  for (let i = 1; i < n - 1; i++) {
    d += 'Q' + f(xs[i]) + ' ' + f(ys[i]) + ' ' + f((xs[i] + xs[i + 1]) / 2) + ' ' + f((ys[i] + ys[i + 1]) / 2);
  }
  return d + 'L' + f(xs[n - 1]) + ' ' + f(ys[n - 1]);
}

function smoothClosed(xs: number[], ys: number[]): string {
  'worklet';
  const n = xs.length;
  let d = 'M' + f((xs[n - 1] + xs[0]) / 2) + ' ' + f((ys[n - 1] + ys[0]) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    d += 'Q' + f(xs[i]) + ' ' + f(ys[i]) + ' ' + f((xs[i] + xs[j]) / 2) + ' ' + f((ys[i] + ys[j]) / 2);
  }
  return d + 'Z';
}

/** One true fold as a closed band: free edge front → back, lateral edge back → front. */
export function foldPath(s: number, ab: number, open: number): string {
  'worklet';
  const mx: number[] = [], my: number[] = [], lx: number[] = [], ly: number[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const b = foldBase(s, u, ab);
    const amp = open * VF_OPEN_MAX * foldProfile(u);
    mx.push(b[0] + s * amp);
    my.push(b[1]);
    lx.unshift(b[0] + s * (foldWidth(u) + 0.45 * amp));
    ly.unshift(b[1]);
  }
  return smoothThrough(mx, my, true) + smoothThrough(lx, ly, false) + 'Z';
}

/** The glottis (dark airway) — tucked 1 unit under each free edge. */
export function gapPath(ab: number, open: number): string {
  'worklet';
  const lx: number[] = [], ly: number[] = [], rx: number[] = [], ry: number[] = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const y = foldBase(-1, u, ab)[1];
    lx.push(medialX(-1, u, ab, open) - 1);
    ly.push(y);
    rx.unshift(medialX(1, u, ab, open) + 1);
    ry.unshift(y);
  }
  const py = posterior(1, ab)[1];
  return smoothThrough(lx, ly, true) + 'Q' + f(VF_AX) + ' ' + f(py + 4 * ab + 0.5) + ' ' + f(rx[0]) + ' ' + f(ry[0]) + smoothThrough(rx, ry, false) + 'Z';
}

/** Tracheal rings seen through the open glottis: C-shaped, open at the back,
 *  so each shows as an arc bulging toward the front. */
export function ringsPath(ab: number, open: number): string {
  'worklet';
  let d = '';
  const us = [0.5, 0.68, 0.84];
  for (let k = 0; k < us.length; k++) {
    const u = us[k];
    const y = foldBase(-1, u, ab)[1];
    const x1 = medialX(-1, u, ab, open) + 1.2;
    const x2 = medialX(1, u, ab, open) - 1.2;
    if (x2 - x1 > 2) d += 'M' + f(x1) + ' ' + f(y) + 'Q' + f(VF_AX) + ' ' + f(y - 2.5) + ' ' + f(x2) + ' ' + f(y);
  }
  return d === '' ? 'M0 0' : d;
}

/** Mucosal-wave ripple on the fold's upper surface (crest; `shadow` = the
 *  darker trough just lateral to it). */
export function wavePath(s: number, ab: number, open: number, wave: number, shadow: boolean): string {
  'worklet';
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < 7; i++) {
    const u = 0.06 + (i / 6) * 0.56;
    const pr = foldProfile(u);
    xs.push(medialX(s, u, ab, open) + s * ((0.7 + wave * 4) * pr + (shadow ? 0.9 : 0)));
    ys.push(foldBase(s, u, ab)[1]);
  }
  return smoothThrough(xs, ys, true);
}

/** Ventricular (false) fold. It follows the arytenoid less than the true
 *  fold does, so in the breathing V it overhangs the true fold's outer edge. */
function falseFoldEdges(s: number, ab: number): { ix: number[]; iy: number[]; ox: number[]; oy: number[] } {
  'worklet';
  const a = ab * 0.75;
  const ix: number[] = [], iy: number[] = [], ox: number[] = [], oy: number[] = [];
  for (let i = 0; i < 9; i++) {
    const u = 0.05 + (i / 8) * 0.95;
    const b = foldBase(s, u, a);
    const inner = b[0] + s * (foldWidth(u) + 1.6);
    ix.push(inner);
    iy.push(b[1]);
    ox.unshift(inner + s * (4 + 4 * Math.sin(Math.PI * u)));
    oy.unshift(b[1] + 0.5);
  }
  return { ix, iy, ox, oy };
}

export function falseFoldPath(s: number, ab: number): string {
  'worklet';
  const e = falseFoldEdges(s, ab);
  return smoothThrough(e.ix, e.iy, true) + smoothThrough(e.ox, e.oy, false) + 'Z';
}

/** The ventricle: the dark slit under the false fold's free edge. */
export function ventriclePath(s: number, ab: number): string {
  'worklet';
  const e = falseFoldEdges(s, ab);
  const xs: number[] = [];
  for (let i = 0; i < e.ix.length; i++) xs.push(e.ix[i] - s * 0.7);
  return smoothThrough(xs, e.iy, true);
}

/** Arytenoid body centre (mucosa-covered cartilage at the back). */
export function arytenoidCentre(s: number, ab: number): [number, number] {
  'worklet';
  return [VF_AX + s * (7 + 9 * ab), 98 + 0.5 * ab];
}

/** Rounded-triangular arytenoid mound whose front tip IS the vocal process. */
export function arytenoidPath(s: number, ab: number): string {
  'worklet';
  const p = posterior(s, ab);
  const c = arytenoidCentre(s, ab);
  const xs = [p[0] + s * 0.3, c[0] + s * 6.5, c[0] + s * 4.5, c[0] - s * 1.5, c[0] - s * 4.5];
  const ys = [p[1] - 6, c[1], c[1] + 5.5, c[1] + 6, c[1] + 1.5];
  return smoothClosed(xs, ys);
}

/** Interarytenoid mucosa (the posterior commissure) between the arytenoids. */
export function interarytenoidPath(ab: number): string {
  'worklet';
  const pl = posterior(-1, ab), pr = posterior(1, ab);
  const cl = arytenoidCentre(-1, ab), cr = arytenoidCentre(1, ab);
  return 'M' + f(pl[0]) + ' ' + f(pl[1] - 1) + 'Q' + f(VF_AX) + ' ' + f(pl[1] - 1 + 4 * ab) + ' ' + f(pr[0]) + ' ' + f(pr[1] - 1) + 'L' + f(cr[0] - 4.5) + ' ' + f(cr[1] + 2)
    + 'Q' + f(VF_AX) + ' ' + f(cr[1] + 7) + ' ' + f(cl[0] + 4.5) + ' ' + f(cl[1] + 2) + 'Z';
}

/** Inlet outline points for one side: epiglottis edge → aryepiglottic fold → arytenoid. */
function inletSide(s: number, ab: number): { xs: number[]; ys: number[] } {
  'worklet';
  return {
    xs: [VF_AX + s * 34, VF_AX + s * 44, VF_AX + s * 45, VF_AX + s * (37 + 4 * ab), VF_AX + s * (24 + 8 * ab), VF_AX + s * (13 + 9 * ab)],
    ys: [36, 48, 68, 88, 101, 108],
  };
}

/** The vestibule: everything inside the laryngeal inlet. */
export function inletPath(ab: number): string {
  'worklet';
  const l = inletSide(-1, ab), r = inletSide(1, ab);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < l.xs.length; i++) { xs.push(l.xs[i]); ys.push(l.ys[i]); }
  xs.push(VF_AX); ys.push(109);
  for (let i = r.xs.length - 1; i >= 0; i--) { xs.push(r.xs[i]); ys.push(r.ys[i]); }
  xs.push(VF_AX); ys.push(26);
  return smoothClosed(xs, ys);
}

/** Aryepiglottic fold rim (an open stroke), optionally nudged up-left for its
 *  lit edge (light from the upper left, the house convention). */
export function aeRimPath(s: number, ab: number, dx: number, dy: number): string {
  'worklet';
  const e = inletSide(s, ab);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < 5; i++) { xs.push(e.xs[i] + dx); ys.push(e.ys[i] + dy); }
  return smoothThrough(xs, ys, true);
}

/** One rising air chevron (unvoiced): it climbs out of the glottis toward the
 *  viewer, growing as it comes closer and fading out. */
export function airChevron(k: number, cycles: number, ab: number): { d: string; opacity: number } {
  'worklet';
  const prog = frac(k / 3 + cycles * 0.45);
  const y = 88 - prog * 24;
  const sz = 2.4 + prog * 1.8;
  const d = 'M' + f(VF_AX - sz) + ' ' + f(y + sz) + 'L' + f(VF_AX) + ' ' + f(y) + 'L' + f(VF_AX + sz) + ' ' + f(y + sz);
  return { d, opacity: Math.max(0, Math.min(1, (ab - 0.5) * 2)) * Math.sin(Math.PI * prog) };
}

/** The WHAT COMES OUT trace: the glottal airflow puffs (same pulse as the
 *  folds, the right edge is "now"), cross-fading to breath noise as the folds
 *  part. */
export function traceD(cycles: number, ab: number): string {
  'worklet';
  const T = VF_TRACE;
  const shift = Math.floor(cycles * 10);
  let d = '';
  for (let i = 0; i < T.samples; i++) {
    const t = i / (T.samples - 1);
    const pulse = glottalPulse(cycles - (1 - t) * T.cycles);
    const j = i + shift;
    // real (pseudo-random) noise per sample — never a sum of sines
    const hn = Math.sin(j * 12.9898) * 43758.5453;
    const noise = (hn - Math.floor(hn)) * 2 - 1;
    const y = T.base - T.amp * pulse * (1 - ab) - T.noise * noise * ab;
    d += (i === 0 ? 'M' : 'L') + f(T.x0 + t * T.w) + ' ' + f(y);
  }
  return d;
}

/** Leader-line targets (left side), so each label stays on its structure. */
export function leaderTargets(ab: number, open: number): { falseFold: [number, number]; fold: [number, number]; glottis: [number, number]; arytenoid: [number, number] } {
  'worklet';
  const e = falseFoldEdges(-1, ab);
  const ffx2 = e.ix[2] * 0.3 + e.ox[e.ox.length - 3] * 0.7;
  const uf = 0.42;
  const fb = foldBase(-1, uf, ab);
  const fm = medialX(-1, uf, ab, open);
  const ug = 0.7;
  const c = arytenoidCentre(-1, ab);
  return {
    falseFold: [ffx2, e.iy[2]],
    fold: [fm - foldWidth(uf) * 0.5, fb[1]],
    glottis: [(medialX(-1, ug, ab, open) + VF_AX) / 2, foldBase(-1, ug, ab)[1]],
    arytenoid: [c[0] + 1, c[1] + 2],
  };
}

export type FoldsFrame = {
  inlet: string; aeL: string; aeR: string; aeHiL: string; aeHiR: string;
  gap: string; rings: string; ringsOpacity: number; inter: string;
  foldL: string; foldR: string;
  crestL: string; crestR: string; troughL: string; troughR: string; waveOpacity: number;
  ventL: string; ventR: string; ffL: string; ffR: string;
  aryL: string; aryR: string; cornLx: number; cornRx: number; cornY: number;
  air0: string; air1: string; air2: string; airO0: number; airO1: number; airO2: number;
  trace: string;
  lead: ReturnType<typeof leaderTargets>;
};

/** Everything that moves, for one instant. */
export function foldsFrame(cycles: number, ab: number): FoldsFrame {
  'worklet';
  const open = glottalPulse(cycles) * (1 - ab);
  const wave = mucosalWave(cycles);
  const a0 = airChevron(0, cycles, ab), a1 = airChevron(1, cycles, ab), a2 = airChevron(2, cycles, ab);
  const cl = arytenoidCentre(-1, ab), cr = arytenoidCentre(1, ab);
  return {
    inlet: inletPath(ab),
    aeL: aeRimPath(-1, ab, 0, 0), aeR: aeRimPath(1, ab, 0, 0),
    aeHiL: aeRimPath(-1, ab, -0.8, -0.9), aeHiR: aeRimPath(1, ab, -0.8, -0.9),
    gap: gapPath(ab, open), rings: ringsPath(ab, open), ringsOpacity: 0.75 * ab, inter: interarytenoidPath(ab),
    foldL: foldPath(-1, ab, open), foldR: foldPath(1, ab, open),
    crestL: wavePath(-1, ab, open, wave, false), crestR: wavePath(1, ab, open, wave, false),
    troughL: wavePath(-1, ab, open, wave, true), troughR: wavePath(1, ab, open, wave, true),
    waveOpacity: Math.sin(Math.PI * wave) * (1 - ab),
    ventL: ventriclePath(-1, ab), ventR: ventriclePath(1, ab), ffL: falseFoldPath(-1, ab), ffR: falseFoldPath(1, ab),
    aryL: arytenoidPath(-1, ab), aryR: arytenoidPath(1, ab), cornLx: cl[0] + 0.5, cornRx: cr[0] - 0.5, cornY: cl[1] + 2,
    air0: a0.d, air1: a1.d, air2: a2.d, airO0: a0.opacity, airO1: a1.opacity, airO2: a2.opacity,
    trace: traceD(cycles, ab),
    lead: leaderTargets(ab, open),
  };
}
