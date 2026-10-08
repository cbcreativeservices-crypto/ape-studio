/**
 * F07 WILDLIFE AND DISTANT SOURCES — the shared pages' words on the field
 * family's words (lessons/shared/field/fieldCopy.ts). Starting-points voice;
 * no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { fieldCopy } from '../shared/field/fieldCopy.ts';

export const F07_COPY: Partial<LessonCopy> = fieldCopy({
  variantKey: 'TARGET',
  variantShort: { bird: 'one bird', flock: 'a flock', distant: 'a low call far off' },
  sceneSubject: { bird: 'an observation point at a woodland edge, one bird calling 26 m away', flock: 'an observation point on open grassland, a flock crossing', distant: 'an observation point on open ground, a large animal 70 m away' },
  instrument: {
    figureBadge: 'The site, cut along the view toward the target',
    figureLabel: 'A section from the observation point toward the target: the ground, the trees or open grass, and the animal.',
    partsBadge: 'A wildlife site · tap a part to name it',
    partsLooking: { side: 'Section · the target to the right', top: 'Site plan · the target to the right' },
    partsIdle: 'A distant source is heard from a safe, permitted point. Tap the bird, the setback ring, the trail, the brook — or the flock, or the animal far off.',
    variantNotes: {
      bird: 'ONE BIRD: a clear call from one direction — the case a dish suits best. Its setback ring is drawn: you work from outside it.',
      flock: 'A FLOCK: many birds moving fast across a wide field — a shotgun or a wider pickup copes better than a narrow dish.',
      distant: 'FAR AND LOW: a deep call from far away — a small dish gives little help at such long wavelengths, and distance does not disappear.',
    },
  },
  worked: { bird: 'wl.bird.shotgun', flock: 'wl.flock.shotgun', distant: 'wl.far.shotgun' },
  ref: 'the target',
  reveal: 'From a permitted point the target stays where it is: a directional mic or a dish changes the balance between it and its surroundings — at the pitches they can — but never makes the distance disappear.',
  tendencies: 'A shotgun: less of the off-axis surroundings in the upper pitches, the tone changing off its axis. A dish: the call’s mid and high pitches gathered while the aim holds, little help low down. An omni: the place as it is. Tendencies to check on headphones — your ears and the place decide.',
  practice: { gain: 'wl.prac.gain', second: 'wl.prac.3', mixed: ['wl.mix.1', 'wl.mix.2', 'wl.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the dish and its wavelength, a moving flock, and what one call can prove.' },
  startIntro: 'This lesson is about recording wildlife and other distant sounds — one bird, a flock, a low call far away — from a safe, permitted observation point. First the target and its surroundings, then real starting setups drawn at the observation point, the microphones and the dish, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  otherRef: 'Every starting point here is measured from the target to the mic — and the mic always stays outside the animal’s setback ring.',
  blocked: 'The mic would be inside the setback ring, on the trail or in the brook — move it back.',
  typeNotes: {
    shotgunShort: 'Ideas to try with the shotgun: aim its axis at the call and sweep slowly on headphones — off its axis the tone changes.',
    dishMic: 'Ideas to try with the dish: aim it precisely and keep it steady through a phrase; a small turn off the call loses the high pitches first.',
  },
});
