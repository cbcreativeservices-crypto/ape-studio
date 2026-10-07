/**
 * The shared pages' words for a Lab 5 ensemble (shared/hand/handPages
 * HandSpec): the frame-S axes, the arrays' cards for the microphones page,
 * and `ensembleHandSpec` — the HandSpec with the fields Lab 5's own pages
 * replace (the parts page, the setting plan, the placement) filled in, so a
 * lesson gives only what the shared pages read: its art, the microphones
 * words, the studio-or-live and two-mic pages, the practice, the words.
 */
import type { ReactNode } from 'react';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { InstrumentModel } from '../../../engine/model/types.ts';
import { Body, Card, Point } from '../../../engine/kit';
import type { HandSpec } from '../hand/handPages';
import { fmtM } from './frameS.ts';

export const ENSEMBLE_AXES: HandSpec['axes'] = {
  x: { label: 'ACROSS', short: 'ACROSS', blurb: 'To the conductor’s left or right (x).', fmt: (v) => (Math.abs(v) < 25 ? 'on the centre line' : `${fmtM(Math.abs(v))} to the conductor’s ${v < 0 ? 'left' : 'right'}`) },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Higher or lower (y).', fmt: (v) => `${fmtM(Math.max(0, -v))} above the floor` },
  z: { label: 'TOWARD–AWAY', short: 'TOWARD', blurb: 'Toward the players, or back toward the conductor and the hall (z).', fmt: (v) => (v >= 0 ? `${fmtM(v)} in front of the front row` : `${fmtM(-v)} behind the front row`) },
};

/** The main arrays, by property (the microphones page's extra cards). */
export const ARRAY_CARDS: ReactNode = (
  <>
    <Card>
      <Point title="A SPACED PAIR (A/B)">Two omnis 40–60 cm apart to start: a broad view of the ensemble and the hall. Very wide spacing can open a hole in the middle — and it needs a mono check.</Point>
      <Point title="A NEAR-COINCIDENT PAIR">Two cardioids 17 cm (6.7 in) apart, 110° between their axes: time and level differences for width, its 95° recording angle taking in the ensemble. A fixed geometry — move the pair, never the spacing.</Point>
      <Point title="A COINCIDENT PAIR (X/Y, M/S)">The capsules together: a stable image and a dependable mono sum. M/S lets you set the width later in the matrix: Left = Mid + Side, Right = Mid − Side.</Point>
      <Point title="THE THREE-OMNI TREE">Left and right 2 m apart, the centre 1.5 m ahead, every pair at least 1.5 m apart; the centre fed to both sides a few dB down. Outriggers, each on its own stand, add the outer players.</Point>
    </Card>
    <Body>Choose by what the music, the room and the delivery need: the internal balance, a stable image, the amount of room, the tone in mono. No method is best everywhere — compare.</Body>
  </>
);

export function ensembleHandSpec(o: { art: LessonArt; model: InstrumentModel; title: string; mic: HandSpec['mic']; ctx: HandSpec['ctx']; two: HandSpec['two']; practice: HandSpec['practice']; words: NonNullable<HandSpec['words']>; firstZone: string; firstMic: string }): HandSpec {
  const V = o.model.views;
  return {
    art: o.art,
    intro: '',
    figure: { view: 'top', title: o.title, badge: '', label: '', box: V.top! },
    partsBox: { side: V.side!, top: V.top! },
    partsBadge: '',
    partsLooking: () => '',
    partsNote: '',
    partsWarn: '',
    plan: { items: [], label: () => '', looking: () => '', first: '', before: [] },
    mic: o.mic,
    axes: ENSEMBLE_AXES,
    aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the hall).' },
    outside: 'clear of the players',
    worked: { zone: o.firstZone, mic: o.firstMic, looking: '', pieces: () => [], done: '', label: '' },
    place: { zone: o.firstZone, mic: o.firstMic, looking: '', prompt: '', tried: () => '', label: '' },
    learnZones: [],
    ctx: o.ctx,
    two: o.two,
    practice: o.practice,
    words: o.words,
  };
}
