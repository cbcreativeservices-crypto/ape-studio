/**
 * cymatics/patternField — a saved pattern's GEOMETRY and READOUT, recomputed
 * from its exact state through the same science chain the studios use
 * (plateModes / membrane / faraday). Nothing is stored twice: the gallery, the
 * art board, the compare canvas and the Lab Print all derive from the state.
 */
import { HEAD_BY_ID, fundamentalHz, membraneModes, membraneQ, membraneStrength, sampleMembrane } from './membrane';
import { FAMILY_LABEL, STAGE_LABEL, readFaraday, readLiquid, sampleSurface } from './faraday';
import { LIQUID_BY_ID } from './liquids';
import { MATERIAL_BY_ID } from './materials';
import { isLibraryShape, loadLibraryShape } from './modalLibrary';
import { formatHz, nearestNote, type NoteReadout } from './music';
import { effectiveQ, plateAspect, plateModes, readResonance, sampleField } from './plateModes';
import { TONE_RATIOS, type PatternState } from './patternStore';
import type { Pt } from './contours';

export type Outline =
  | { kind: 'circle' }
  | { kind: 'rect'; rx: number }
  | { kind: 'ring'; inner: number }
  | { kind: 'poly'; outline: Pt[]; holes: Pt[][] };

export type PatternGeometry = {
  field: Float32Array;
  N: number;
  aspect: number;
  outline: Outline;
  /** Face / edge colours of the real object (material, head, liquid). */
  face: string;
  edge: string;
  /** The plate finish family, for the drawn face. */
  texture: 'brushed' | 'polished' | 'matte' | 'glass' | 'grain' | 'head' | 'liquid';
  /** Resonance / response strength 0..1 at the saved drive. */
  strength: number;
};

/** Node field + outline for any saved state, at grid size N. */
export function patternGeometry(state: PatternState, N: number): PatternGeometry {
  if (state.studio === 'plate') {
    const { spec } = state;
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    const res = readResonance(state.hz, modes, Q);
    const ratio = TONE_RATIOS[state.multi] ?? null;
    let field = sampleField(spec, modes, state.hz, Q, N);
    let strength = res.strength;
    if (ratio) {
      const resB = readResonance(state.hz * ratio, modes, Q);
      const g2 = sampleField(spec, modes, state.hz * ratio, Q, N);
      const out = new Float32Array(field.length);
      let peak = 1e-9;
      for (let i = 0; i < field.length; i++) {
        const v = field[i] * res.strength + g2[i] * resB.strength;
        out[i] = v;
        if (v === v && Math.abs(v) > peak) peak = Math.abs(v);
      }
      for (let i = 0; i < out.length; i++) if (out[i] === out[i]) out[i] /= peak;
      field = out;
      strength = Math.max(res.strength, resB.strength);
    }
    const mat = MATERIAL_BY_ID[spec.material];
    const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
    const outline: Outline = lib
      ? { kind: 'poly', outline: lib.outline, holes: lib.holes }
      : spec.shape === 'circle'
        ? { kind: 'circle' }
        : { kind: 'rect', rx: 0.025 };
    return { field, N, aspect: plateAspect(spec), outline, face: mat.face, edge: mat.edge, texture: mat.texture, strength };
  }
  if (state.studio === 'membrane') {
    const { spec } = state;
    const modes = membraneModes(spec, 16);
    const Q = membraneQ(spec);
    const field = sampleMembrane(modes, state.hz, Q, N);
    const head = HEAD_BY_ID[spec.head];
    return { field, N, aspect: 1, outline: { kind: 'circle' }, face: head.tint, edge: '#6b5a3a', texture: 'head', strength: membraneStrength(modes, state.hz, Q).strength };
  }
  const { spec } = state;
  const st = readLiquid(spec, state.hz, state.accelG);
  const fr = readFaraday(spec, state.hz, state.accelG);
  const kUsed = st.mode && !st.subharmonic ? st.mode.k : fr.k;
  const field = sampleSurface(spec, st.family, kUsed, st.mode, N, false, 1);
  const liquid = LIQUID_BY_ID[spec.liquid];
  const outline: Outline =
    spec.shape === 'circle' ? { kind: 'circle' } : spec.shape === 'ring' ? { kind: 'ring', inner: 0.35 } : { kind: 'rect', rx: 0.04 };
  const aspect = spec.shape === 'rect' ? Math.max(0.5, Math.min(1, spec.aspect)) : 1;
  return { field, N, aspect, outline, face: liquid.tint, edge: '#9aa0a8', texture: 'liquid', strength: st.envelope };
}

export type PatternReadout = {
  /** One-line identity: "Aluminum 240 mm square · 412 Hz (G♯4 +12¢)". */
  title: string;
  hz: number;
  note: NoteReadout;
  /** Settings block rows for the Lab Print — every value is the real state. */
  rows: { k: string; v: string }[];
  /** Short studio tag. */
  studioLabel: string;
};

const mm = (v: number) => `${Math.round(v * 10) / 10} mm`;
const pos = (p: { x: number; y: number }) => `${Math.round(p.x * 100)} %, ${Math.round(p.y * 100)} %`;

export function patternReadout(state: PatternState): PatternReadout {
  const note = nearestNote(state.hz);
  const noteStr = `${note.label} ${note.centsLabel}`;
  if (state.studio === 'plate') {
    const { spec } = state;
    const mat = MATERIAL_BY_ID[spec.material];
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    const res = readResonance(state.hz, modes, Q);
    const shape = isLibraryShape(spec.shape)
      ? loadLibraryShape(spec.shape).info.label
      : spec.shape === 'circle'
        ? 'disc'
        : spec.shape === 'rect'
          ? `rectangle ${Math.round(spec.aspect * 100) / 100}`
          : 'square';
    const ratio = TONE_RATIOS[state.multi] ?? null;
    const rows = [
      { k: 'Plate', v: `${mat.label} · ${shape} · ${mm(spec.sizeMm)}` },
      { k: 'Thickness', v: mm(spec.thicknessMm) },
      { k: 'Edges', v: spec.edge === 'free' ? 'free' : spec.edge === 'supported' ? 'simply supported' : 'clamped' },
      { k: 'Driver', v: `at ${pos(spec.exciter)}` },
      { k: 'Support', v: spec.support ? `clamp at ${pos(spec.support)}` : 'centre post' },
      { k: 'Damping', v: `${Math.round(spec.damping * 100)} % (Q ≈ ${Math.round(Q)})` },
      { k: 'Drive', v: `${formatHz(state.hz)} · ${noteStr}${ratio ? ` + second tone ×${Math.round(ratio * 100) / 100}` : ''}` },
      { k: 'Resonance', v: `${res.state.toUpperCase()}${res.dominant ? ` · mode ${res.dominant.label}` : ''} · strength ${Math.round(res.strength * 100)} %` },
      { k: 'Level', v: `${Math.round(state.amplitude * 100)} %` },
    ];
    if (mat.texture === 'grain') rows.splice(2, 0, { k: 'Grain', v: `${spec.grainDeg}° from x` });
    return { title: `${mat.label} ${Math.round(spec.sizeMm)} mm ${shape} · ${formatHz(state.hz)} (${noteStr})`, hz: state.hz, note, rows, studioLabel: 'CHLADNI PLATE' };
  }
  if (state.studio === 'membrane') {
    const { spec } = state;
    const head = HEAD_BY_ID[spec.head];
    const modes = membraneModes(spec, 16);
    const Q = membraneQ(spec);
    const st = membraneStrength(modes, state.hz, Q);
    const rows = [
      { k: 'Head', v: `${head.label} · Ø ${mm(spec.diameterMm)}${spec.kettle ? ' · timpani kettle' : ''}` },
      { k: 'Tension', v: `${Math.round(spec.tensionNpm)} N/m` },
      { k: 'Fundamental', v: formatHz(fundamentalHz(spec)) },
      { k: 'Strike', v: `${Math.round(spec.strike.r * 100)} % of radius at ${Math.round(spec.strike.thetaDeg)}°` },
      { k: 'Damping', v: `${Math.round(spec.damping * 100)} % (Q ≈ ${Math.round(Q)})` },
      { k: 'Drive', v: `${formatHz(state.hz)} · ${noteStr}` },
      { k: 'Response', v: `${st.dominant ? `mode ${st.dominant.label}` : '—'} · strength ${Math.round(st.strength * 100)} %` },
      { k: 'Level', v: `${Math.round(state.amplitude * 100)} %` },
    ];
    return { title: `${head.label} Ø ${Math.round(spec.diameterMm)} mm · ${formatHz(state.hz)} (${noteStr})`, hz: state.hz, note, rows, studioLabel: 'DRUMHEAD' };
  }
  const { spec } = state;
  const liquid = LIQUID_BY_ID[spec.liquid];
  const st = readLiquid(spec, state.hz, state.accelG);
  const fr = readFaraday(spec, state.hz, state.accelG);
  const dish =
    spec.shape === 'circle'
      ? `Ø ${mm(spec.sizeMm)} dish`
      : spec.shape === 'ring'
        ? `Ø ${mm(spec.sizeMm)} ring`
        : spec.shape === 'rect'
          ? `${mm(spec.sizeMm)} × ${mm(spec.sizeMm * spec.aspect)} dish`
          : `${mm(spec.sizeMm)} square dish`;
  const rows = [
    { k: 'Liquid', v: `${liquid.label} · ${mm(spec.depthMm)} deep · ${spec.tempC} °C` },
    { k: 'Dish', v: `${dish} · ${spec.bottom} bottom · ${spec.contact} rim · wall ${mm(spec.wallMm)}` },
    { k: 'Drive', v: `${formatHz(state.hz)} ${spec.waveform} · ${noteStr}${spec.dualRatio ? ` + second tone ×${Math.round(spec.dualRatio * 100) / 100}` : ''}` },
    { k: 'Shake', v: `${state.accelG.toFixed(2)} g · onset ≈ ${fr.thresholdG > 2.5 ? 'out of range' : `${fr.thresholdG.toFixed(2)} g`} · a/a꜀ ${st.ratio.toFixed(2)}` },
    { k: 'Response', v: `${st.subharmonic ? formatHz(fr.responseHz) : `${formatHz(state.hz)} (not yet subharmonic)`} · λ ${fr.lambdaMm.toFixed(1)} mm` },
    { k: 'Stage', v: `${STAGE_LABEL[st.stage]} · ${FAMILY_LABEL[st.family]}` },
  ];
  return { title: `${liquid.label} ${dish} · ${formatHz(state.hz)} (${noteStr})`, hz: state.hz, note, rows, studioLabel: 'LIQUID DISH' };
}

/** A name for a freshly saved pattern — the identity line without the note. */
export function defaultPatternName(state: PatternState): string {
  if (state.studio === 'plate') {
    const mat = MATERIAL_BY_ID[state.spec.material];
    const shape = isLibraryShape(state.spec.shape) ? loadLibraryShape(state.spec.shape).info.label.toLowerCase() : state.spec.shape === 'circle' ? 'disc' : state.spec.shape;
    return `${mat.label} ${Math.round(state.spec.sizeMm)} mm ${shape} · ${formatHz(state.hz)}`;
  }
  if (state.studio === 'membrane') return `${HEAD_BY_ID[state.spec.head].label} Ø ${Math.round(state.spec.diameterMm)} · ${formatHz(state.hz)}`;
  return `${LIQUID_BY_ID[state.spec.liquid].label} Ø ${Math.round(state.spec.sizeMm)} · ${formatHz(state.hz)}`;
}
