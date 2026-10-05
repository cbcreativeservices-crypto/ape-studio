/**
 * A05c TENOR SAXOPHONE — where things are: the shared saxophone family's
 * tenor row (lessons/shared/sax/saxSpec.ts) on a neck strap, lower and
 * farther to the player's right than an alto (tenor_sax/GEOMETRY_PROPOSAL.md),
 * STANDING or SEATED (a big band's section sits; the right elbow is the
 * seated height cue for a farther mic, SW-SAX).
 */
import { TENOR } from '../shared/sax/saxSpec.ts';
import { saxFamily } from '../shared/sax/saxFamily.ts';

export const TENOR_VIEWS = {
  side: { u0: -260, u1: 840, v0: -250, v1: 980 },
  top: { u0: -260, u1: 840, v0: -320, v1: 600 },
};

export const TENOR_SAX = saxFamily(TENOR, TENOR_VIEWS, {
  standing: 'The player stands, the tenor on a neck strap: the body angled across to the right, lower than an alto, the bell beside the right thigh.',
  seated: 'The player sits, as in a big band’s sax section: the same hold — the horn hangs beside the right knee, close to the chair, and the floor comes closer.',
});
export const TENOR_MODEL = TENOR_SAX.MODEL;
