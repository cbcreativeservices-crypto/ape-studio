/**
 * THE BOWED FAMILY'S AUTHORED HANDS, PLACED (2026-11-25, "batches by family"). Every hand the bowed lessons show at
 * their default views (C09a violin standing and seated, C09b viola, C09c cello, C06a/C06b double bass; side view from
 * the player's right and the view from above) is an AUTHORED 2-D drawing (figureV2/bowedHand*.tsx, painted by
 * figureV2/bowedHandPaint.tsx) in place of the projected 3-D hand. Nothing of the posture moves: each drawing is set on
 * the arm's own cuff (the sleeve ends where it always ended) and turned so that the lesson's own point on what it holds
 * (the posed hand's axis point: on the bow's stick, on the neck) falls where the drawing has it.
 *
 * Paint: a bow hand all over the instrument (its thumb, the bow repainted over the thumb, the fingers); a stopping
 * hand's palm and thumb BEHIND the neck (under the instrument), its fingers over the board.
 */
import type { ReactElement } from 'react';
import { ColorMatrix, Group, Paint } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import type { FamPlan } from '../figureV2/familyV2';
import { FAR_SKIN_DIM } from '../figureV2/FigureV2Side';
import { BowedHandCast, BowedHandLayer, heldFrontPath, localLight, type BowedHandArt } from '../figureV2/bowedHandPaint';
import { smoothClosed, unionOf } from '../figureV2/paths';
import { P, type Pt } from '../figureV2/geom.ts';
import { BOWED_HAND_VIOLIN_BOW_SIDE } from '../figureV2/bowedHandViolinBowSide';
import { BOWED_HAND_VIOLIN_BOW_TOP } from '../figureV2/bowedHandViolinBowTop';
import { BOWED_HAND_VIOLIN_STOP_SIDE } from '../figureV2/bowedHandViolinStopSide';
import { BOWED_HAND_VIOLIN_STOP_TOP } from '../figureV2/bowedHandViolinStopTop';
import { BOWED_HAND_CELLO_BOW_SIDE } from '../figureV2/bowedHandCelloBowSide';
import { BOWED_HAND_CELLO_BOW_TOP } from '../figureV2/bowedHandCelloBowTop';
import { BOWED_HAND_CELLO_STOP_SIDE } from '../figureV2/bowedHandCelloStopSide';
import { BOWED_HAND_CELLO_STOP_TOP } from '../figureV2/bowedHandCelloStopTop';
import { BOWED_HAND_BASS_BOW_SIDE } from '../figureV2/bowedHandBassBowSide';
import { BOWED_HAND_BASS_BOW_TOP } from '../figureV2/bowedHandBassBowTop';
import { BOWED_HAND_BASS_STOP_SIDE } from '../figureV2/bowedHandBassStopSide';
import { BOWED_HAND_BASS_STOP_TOP } from '../figureV2/bowedHandBassStopTop';
import { BOWED_HAND_BASS_PIZZ_SIDE } from '../figureV2/bowedHandBassPizzSide';
import { BOWED_HAND_BASS_PIZZ_TOP } from '../figureV2/bowedHandBassPizzTop';
import type { DrawnHands } from './bowedHands.ts';
import type { Posture } from './posture.ts';

export type BowedHandMode = 'bow' | 'stop' | 'pizz';
type Fam = 'violin' | 'cello' | 'bass';
const famOf = (id: string): Fam => (id === 'cello' ? 'cello' : id === 'bass' ? 'bass' : 'violin');

/** One drawing of the review sheet: its number, its art, what it serves. */
export type BowedHandEntry = { n: number; id: string; art: BowedHandArt; fam: Fam; view: ViewId; mode: BowedHandMode; serves: string; status: 'NEW' | 'KEPT'; /** the builder's honest doubt, shown under the caption */ doubt?: string };

/** The builder's remaining doubt per drawing (the sheet shows it under each caption). */
const DOUBT: Record<number, string> = {
  1: 'each finger now goes over the top of the stick and its end curls round behind it, the stick crossing in front of the ends; the index end and the thumb tip meet in one soft mass under the palm, which may read unclear.',
  2: 'the fingers lie over the stick and bend down just past it, the stick showing on both sides of the hand; from above the thumb meets the stick under the index, out of sight, and its base beside the wrist may read broad.',
  3: 'seen along the little-finger edge, the four finger arches stack into one clump over the board; the thumb is hidden behind the neck.',
  4: 'the fingertips coming down onto the strings read as short knobs with their nails; the palm under the neck is one smooth mass.',
  5: 'the bow’s end shows inside the ring of the curled fingers and thumb; the thumb is long and the whole hand may still read like a hanging claw.',
  6: 'a fist from the back with the stick under it; the thumb shows only as a small bump at the top edge.',
  7: 'the fingertips beyond the neck form a row of knobs with nails; the palm is behind the neck, as it really is.',
  8: 'the long bent thumb lies along the back of the neck; the ring and little fingers are mostly hidden under the neck.',
  9: 'the bow’s butt end now shows inside the curled fingers, toward us; the thumb still runs along under the palm like a rod before it curls in.',
  10: 'a fist from the back with the stick under it; the little finger reads a little short and stubby.',
  11: 'the thumb points toward us, so it is short and seen mostly by its nail; the fingertips beyond the neck are small.',
  12: 'the thumb curls in a hook under the neck; its nail is turned away, so none shows.',
  13: 'the thumb is the nearest and longest form, hanging down to the board’s edge; the ring and little fingers show only past the board.',
  14: 'the thumb lies under the wrist from above and is not drawn at all; the fingertips that hook the strings turn under, out of sight.',
};

export const BOWED_HANDS: BowedHandEntry[] = [
  { n: 1, id: 'violinBowSide', art: BOWED_HAND_VIOLIN_BOW_SIDE, fam: 'violin', view: 'side', mode: 'bow', serves: 'C09a (standing and seated), C09b', status: 'NEW' },
  { n: 2, id: 'violinBowTop', art: BOWED_HAND_VIOLIN_BOW_TOP, fam: 'violin', view: 'top', mode: 'bow', serves: 'C09a (standing and seated), C09b, their setting plans', status: 'NEW' },
  { n: 3, id: 'violinStopSide', art: BOWED_HAND_VIOLIN_STOP_SIDE, fam: 'violin', view: 'side', mode: 'stop', serves: 'C09a (standing and seated), C09b', status: 'NEW' },
  { n: 4, id: 'violinStopTop', art: BOWED_HAND_VIOLIN_STOP_TOP, fam: 'violin', view: 'top', mode: 'stop', serves: 'C09a (standing and seated), C09b, their setting plans', status: 'NEW' },
  { n: 5, id: 'celloBowSide', art: BOWED_HAND_CELLO_BOW_SIDE, fam: 'cello', view: 'side', mode: 'bow', serves: 'C09c', status: 'NEW' },
  { n: 6, id: 'celloBowTop', art: BOWED_HAND_CELLO_BOW_TOP, fam: 'cello', view: 'top', mode: 'bow', serves: 'C09c and its setting plan', status: 'NEW' },
  { n: 7, id: 'celloStopSide', art: BOWED_HAND_CELLO_STOP_SIDE, fam: 'cello', view: 'side', mode: 'stop', serves: 'C09c', status: 'NEW' },
  { n: 8, id: 'celloStopTop', art: BOWED_HAND_CELLO_STOP_TOP, fam: 'cello', view: 'top', mode: 'stop', serves: 'C09c and its setting plan', status: 'NEW' },
  { n: 9, id: 'bassBowSide', art: BOWED_HAND_BASS_BOW_SIDE, fam: 'bass', view: 'side', mode: 'bow', serves: 'C06b', status: 'NEW' },
  { n: 10, id: 'bassBowTop', art: BOWED_HAND_BASS_BOW_TOP, fam: 'bass', view: 'top', mode: 'bow', serves: 'C06b and its setting plan', status: 'NEW' },
  { n: 11, id: 'bassStopSide', art: BOWED_HAND_BASS_STOP_SIDE, fam: 'bass', view: 'side', mode: 'stop', serves: 'C06a, C06b', status: 'NEW' },
  { n: 12, id: 'bassStopTop', art: BOWED_HAND_BASS_STOP_TOP, fam: 'bass', view: 'top', mode: 'stop', serves: 'C06a, C06b and their setting plans', status: 'NEW' },
  { n: 13, id: 'bassPizzSide', art: BOWED_HAND_BASS_PIZZ_SIDE, fam: 'bass', view: 'side', mode: 'pizz', serves: 'C06a', status: 'NEW' },
  { n: 14, id: 'bassPizzTop', art: BOWED_HAND_BASS_PIZZ_TOP, fam: 'bass', view: 'top', mode: 'pizz', serves: 'C06a and its setting plan', status: 'NEW' },
].map((e) => (DOUBT[e.n] ? { ...e, doubt: DOUBT[e.n] } : e)) as BowedHandEntry[];

/** The drawing for one hand of a lesson's picture (null: none authored — the shared hand draws it). */
export function bowedHandFor(specId: string, view: ViewId, mode: BowedHandMode): BowedHandEntry | null {
  const f = famOf(specId);
  return BOWED_HANDS.find((e) => e.fam === f && e.view === view && e.mode === mode) ?? null;
}

/** Which hold each arm has in a picture. */
export function bowedModes(D: DrawnHands, bowed: boolean): { L: BowedHandMode; R: BowedHandMode | null } {
  return { L: 'stop', R: D.R ? (bowed ? 'bow' : 'pizz') : null };
}

/** Where a drawing goes on the page: its cuff on the arm's cuff, its grip on the lesson's point. */
export type BowedHandPlaced = { e: BowedHandEntry; x: number; y: number; rot: number; s: number; L: Pt; far: boolean; side: 'L' | 'R' };

const proj = (view: ViewId, p: { x: number; y: number; z: number }): Pt => (view === 'side' ? P(p.x, p.y) : P(p.x, p.z));

/** The similarity that puts the drawing's cuff (its origin) on `C` and its grip on `G` (the scale held near 1). */
export function placeBy(art: BowedHandArt, C: Pt, G: Pt): { x: number; y: number; rot: number; s: number } {
  const g = art.grip;
  const rot = Math.atan2(G.v - C.v, G.u - C.u) - Math.atan2(g.v, g.u);
  const s = Math.max(0.9, Math.min(1.15, Math.hypot(G.u - C.u, G.v - C.v) / (Math.hypot(g.u, g.v) || 1)));
  return { x: C.u, y: C.v, rot, s };
}

export function bowedHandPlacements(P0: Posture, D: DrawnHands, view: ViewId, bowed: boolean, fp: FamPlan): BowedHandPlaced[] {
  const modes = bowedModes(D, bowed);
  const out: BowedHandPlaced[] = [];
  for (const a of fp.arms) {
    if (!a.handElsewhere) continue;
    const mode = a.side === 'L' ? modes.L : modes.R;
    if (!mode) continue;
    const e = bowedHandFor(P0.spec.id, view, mode);
    const ph = a.side === 'L' ? D.L : D.R;
    if (!e || !ph) continue;
    const C = a.arm.opening.e.c;
    const G = proj(view, ph.axis.p);
    const pl = placeBy(e.art, C, G);
    out.push({ e, ...pl, L: localLight(pl.rot), far: a.far, side: a.side });
  }
  return out;
}

const FAR_SKIN = (
  <Paint>
    <ColorMatrix matrix={[FAR_SKIN_DIM, 0, 0, 0, 0, 0, FAR_SKIN_DIM, 0, 0, 0, 0, 0, FAR_SKIN_DIM, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

const xf = (p: BowedHandPlaced) => [{ translateX: p.x }, { translateY: p.y }, { rotate: p.rot }, { scale: p.s }];
const inv = (p: BowedHandPlaced) => [{ scale: 1 / p.s }, { rotate: -p.rot }, { translateX: -p.x }, { translateY: -p.y }];

/**
 * One placed hand, the part painted at one depth: 'behind' (under the instrument: a stopping hand's palm and thumb)
 * or 'front' (over it). A bow hand paints everything in front: its thumb, the bow's stick and frog repainted over the
 * thumb only (`bowOver`, page frame), then its fingers.
 */
export function BowedHandNode({ p, part, bowOver }: { p: BowedHandPlaced; part: 'behind' | 'front'; bowOver?: ReactElement | null }): ReactElement | null {
  const art = p.e.art;
  const bow = p.e.mode === 'bow';
  let body: ReactElement | null;
  if (bow) {
    if (part === 'behind') return null;
    const thumbs = art.behind.length ? unionOf(...art.behind.map((q) => smoothClosed(q.outline, q.tension ?? 0.5))) : null;
    const hf = heldFrontPath(art);
    body = (
      <Group transform={xf(p)}>
        <BowedHandLayer art={art} part="behind" L={p.L} />
        {thumbs && bowOver ? (
          <Group clip={thumbs}>
            <Group transform={inv(p)}>{bowOver}</Group>
          </Group>
        ) : null}
        <BowedHandCast art={art} />
        <BowedHandLayer art={art} part="front" L={p.L} />
        {/* (where the stick lies nearer than a finger crossing it — the finger going over the top and round behind —
            the stick and frog again over the finger: each finger is seen wrapping round it) */}
        {hf && bowOver ? (
          <Group clip={hf}>
            <Group transform={inv(p)}>{bowOver}</Group>
          </Group>
        ) : null}
      </Group>
    );
  } else {
    body = (
      <Group transform={xf(p)}>
        {part === 'front' ? <BowedHandCast art={art} /> : null}
        <BowedHandLayer art={art} part={part} L={p.L} />
      </Group>
    );
  }
  return p.far ? <Group layer={FAR_SKIN}>{body}</Group> : body;
}
