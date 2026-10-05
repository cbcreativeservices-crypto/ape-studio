/**
 * A02 TROMBONE AND BASS TROMBONE — where things are (charter §2 layer 2):
 * the shared brass family's tenor and bass trombone rows (lessons/shared/
 * brass/brassSpec.ts) in the standing hold (brassPosture.ts: the slide
 * straight out from the lips, below and to the right of the bell; the bell
 * section over the left shoulder). The slide is drawn at 1st position; its
 * travel to 7th (DERIVED, 559 mm) is a keep-out with a buffer (brassModel).
 * The bass trombone's two rotary valves and their loops sit in its bell
 * section, worked by the left thumb. One model, the instrument as the
 * variant: the bass's larger bell has its own rim (`bell.bass`).
 */
import type { InstrumentModel, ViewBox } from '../../engine/model/types.ts';
import { brassModel, mergeBrass } from '../shared/brass/brassModel.ts';
import { slidePose } from '../shared/brass/brassPosture.ts';
import { BASS_TB, TENOR } from '../shared/brass/brassSpec.ts';

export const TB = slidePose(TENOR);
export const BT = slidePose(BASS_TB);

/** The views: the player at the left, the slide and the bell to the right
 *  (the slide reaches past the bell), room for the farther starting points. */
const VIEWS: { side: ViewBox; top: ViewBox } = {
  side: { u0: -800, u1: 1350, v0: -760, v1: 723 },
  top: { u0: -800, u1: 1350, v0: -740, v1: 743 },
};
export const A02_VIEWS = { tenor: VIEWS, bass: VIEWS };

const VARIANTS: InstrumentModel['variants'] = [
  { id: 'tenor', label: 'TENOR', blurb: 'A tenor trombone: a bell about 20 cm across, the slide in the right hand.' },
  { id: 'bass', label: 'BASS', blurb: 'A bass trombone: the same tube length, a wider bore and a bell about 24 cm across — and valves in the bell section, worked by the left thumb.' },
];

export const A02_MODEL: InstrumentModel = mergeBrass(
  [
    { variant: 'tenor', model: brassModel(TB, { id: 'trombone', name: 'trombone', views: VIEWS, variants: VARIANTS }) },
    { variant: 'bass', model: brassModel(BT, { id: 'trombone', name: 'trombone', views: VIEWS, variants: VARIANTS }) },
  ],
  { tenor: VIEWS, bass: VIEWS },
);
