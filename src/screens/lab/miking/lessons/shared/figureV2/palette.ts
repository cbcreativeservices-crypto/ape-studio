/**
 * FIGURE V2 — the materials (D78, 2026-11-22). Muted, so the figure never
 * outshines the instrument (charter §6), lit by the drums' own key light from
 * the upper left. Each material is a FORM ramp, lit side → shadow side:
 *   [highlight, light, half-tone, core shadow, reflected light]
 * laid ACROSS a form (a limb as a cylinder, the torso round its axis), so a
 * form turns from the light instead of being tinted across its bounding box.
 * The skin keeps the existing figure's warm, neutral tone family (FIGURE_SKIN),
 * richer: warmth where the light turns (the half-tone), a cooler core shadow,
 * a warm bounce on the shadow side.
 */
export type Material = {
  form: string[];
  pos: number[];
  rim: string;
  edge: string;
  deep: string;
};

const POS = [0, 0.2, 0.52, 0.8, 1];

export const MAT = {
  skin: {
    form: ['#d5b9a3', '#bf9e86', '#9c7965', '#6f5143', '#86624f'],
    pos: POS,
    rim: '#f1dcca',
    edge: '#4b3328',
    deep: '#3a271f',
  },
  hair: {
    form: ['#6a5849', '#463830', '#2e241f', '#1a1411', '#2a201b'],
    pos: POS,
    rim: '#9b8676',
    edge: '#120d0b',
    deep: '#0e0a08',
  },
  shirt: {
    form: ['#8794ad', '#66728d', '#4a5570', '#2b3242', '#3b4558'],
    pos: POS,
    rim: '#bcc7dd',
    edge: '#151922',
    deep: '#121620',
  },
  trousers: {
    form: ['#747982', '#585d67', '#3e424a', '#24262b', '#353840'],
    pos: POS,
    rim: '#a2a9b5',
    edge: '#121317',
    deep: '#0e0f12',
  },
  leather: {
    form: ['#7a5a44', '#54392a', '#352419', '#1a110c', '#2c1f16'],
    pos: POS,
    rim: '#c4a184',
    edge: '#0d0806',
    deep: '#0a0605',
  },
} as const satisfies Record<string, Material>;

export const SOLE = {
  top: '#3a3836',
  bottom: '#151416',
  edge: '#5a5754',
} as const;
export const BELT = {
  form: ['#4a362a', '#2c1f17', '#17100c'],
  edge: '#0b0806',
} as const;
export const LIP = '#8e5a4c';
export const NAIL = { fill: '#d9bfae', edge: '#7a5d4c' } as const;
