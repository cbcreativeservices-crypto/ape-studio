/**
 * FIGURE V2 — WHO IS DRAWN (wave 3 of D78, 2026-11-23; the owner's "Small
 * cast": "not everyone is the drummer"). The approved drawing paints every
 * person from the same masses; what differs between people is their LOOK —
 * the skin, the hair, the shirt, the trousers and the shoes — and, in the
 * head's plan, their hair style and face (cast.ts).
 *
 * The look reaches the painters through a React context (inside the Canvas).
 * Where none is given the look is the kit drummer's — the approved figure's
 * own materials, so he is drawn exactly as he was.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { HEAD_SKIN as DRUMMER_HEAD_SKIN, LIP as DRUMMER_LIP, MAT as DRUMMER_MAT, NAIL as DRUMMER_NAIL, type Material } from './palette.ts';

export type MatSet = { skin: Material; hair: Material; shirt: Material; trousers: Material; leather: Material };

export type Look = {
  MAT: MatSet;
  /** The head's own skin ramp (only darkening: no ring, palette.HEAD_SKIN). */
  HEAD_SKIN: Material;
  /** The trousers as one garment (FigureV2Side.CLOTH). */
  CLOTH: Material;
  LIP: string;
  NAIL: { fill: string; edge: string };
  /** The hand's one skin light, lit end to shadow end (authored hands). */
  HAND: string[];
};

/** The trousers' cloth as one garment: the same ramp on seat, thigh, knee and
 *  shin, its lit side held a step below the cloth's brightest. */
export const clothOf = (t: Material): Material => ({ ...t, form: [t.form[1], mix(t.form[1], t.form[2], 0.45), t.form[2], t.form[3], t.form[4]] });

function mix(a: string, b: string, k: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a);
  const y = p(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
}

/** The kit drummer's look: the approved figure's own materials, unchanged. */
export const DRUMMER_LOOK: Look = {
  MAT: DRUMMER_MAT as unknown as MatSet,
  HEAD_SKIN: DRUMMER_HEAD_SKIN,
  // (exactly the CLOTH the approved figure had)
  CLOTH: { ...DRUMMER_MAT.trousers, form: [DRUMMER_MAT.trousers.form[1], '#474b53', DRUMMER_MAT.trousers.form[2], DRUMMER_MAT.trousers.form[3], DRUMMER_MAT.trousers.form[4]] },
  LIP: DRUMMER_LIP,
  NAIL: DRUMMER_NAIL,
  HAND: ['#cfb19b', DRUMMER_MAT.skin.form[1], DRUMMER_MAT.skin.form[2], '#7f5d4c'],
};

const Ctx = createContext<Look>(DRUMMER_LOOK);

/** Dress the figures under it (inside a Canvas). */
export function FigureLook({ look, children }: { look: Look; children: ReactNode }) {
  return <Ctx.Provider value={look}>{children}</Ctx.Provider>;
}

/** The look here (the drummer's where none is given). */
export function useLook(): Look {
  const v = useContext(Ctx) as Look | undefined;
  return v && (v as Partial<Look>).MAT ? v : DRUMMER_LOOK;
}
