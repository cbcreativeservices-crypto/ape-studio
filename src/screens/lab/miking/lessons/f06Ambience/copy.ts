/**
 * F06 NATURAL AND URBAN AMBIENCE — the shared pages' words (engine/model/
 * copy.ts) on the field family's words (lessons/shared/field/fieldCopy.ts):
 * the sites, the worked starting points, the practice items. Starting-points
 * voice; no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { fieldCopy } from '../shared/field/fieldCopy.ts';

export const F06_COPY: Partial<LessonCopy> = fieldCopy({
  variantKey: 'SITE',
  variantShort: { woodland: 'a woodland stream', plaza: 'a city plaza' },
  sceneSubject: { woodland: 'a listening point by a woodland stream, a path behind it, birds in the canopy', plaza: 'a listening point in a city plaza, the road ahead and a facade behind' },
  instrument: {
    figureBadge: 'The place, cut along the view from the listening point',
    figureLabel: 'A section along the view from the listening point: the ground, the trees or buildings, and what lies ahead.',
    partsBadge: 'A field site · tap a part to name it',
    partsLooking: { side: 'Section · the scene to the right', top: 'Site plan · the scene to the right' },
    partsIdle: 'An ambience is the sound of a place at a time: a steady bed and events on top of it. Tap the stream, the path, the birds — or the road, the café and the facade.',
    variantNotes: {
      woodland: 'WOODLAND: a stream ahead as the steady bed, birds calling in the canopy, a walking path just behind the listening point. Switch SITE for a city plaza.',
      plaza: 'CITY PLAZA: the road’s traffic as the bed, the café and the footsteps nearer, the facade behind as a reflector. Lanes, sidewalks and walkways are kept clear.',
    },
  },
  worked: { woodland: 'amb.wood.one', plaza: 'amb.plaza.one' },
  ref: 'the water’s edge or the kerb',
  reveal: 'Nearer the main bed it takes over; farther back the events and the whole place come forward. A second position is a second take to compare — not a better one by rule.',
  tendencies: 'Nearer the bed: more of it, fewer events. Farther back: more of the whole place, and more of anything you did not want. An omni hears all round; a directional mic leans toward a region but never erases the rest. Tendencies to check by ear — your ears and the place decide.',
  practice: { gain: 'amb.prac.gain', second: 'amb.prac.3', mixed: ['amb.mix.1', 'amb.mix.2', 'amb.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: where you listen, the wind, and a pair in mono.' },
  startIntro: 'This lesson is about putting microphones in a place — a woodland stream, a city plaza — to capture its ambience. First the place itself: what it sounds like and where you listen from, then real starting setups drawn at the listening point, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  otherRef: 'Every starting point here is measured from the water’s edge (or the kerb) back to the mic. A few steps change the balance between the steady bed and the events.',
  blocked: 'The stand would be on a path, a lane, an access route or in the water — move it clear.',
});
