/**
 * A05d BARITONE SAXOPHONE — where things are: the shared saxophone family's
 * baritone row (lessons/shared/sax/saxSpec.ts) — the loop at the top of the
 * neck, the long body, a low-A bell (one hole more), on a harness at the
 * hip (baritone_sax/GEOMETRY_PROPOSAL.md), STANDING or SEATED. Its swing is
 * the widest of the family (±25°): a stand must clear the player's turn.
 */
import { BARITONE } from '../shared/sax/saxSpec.ts';
import { saxFamily } from '../shared/sax/saxFamily.ts';

export const BARITONE_VIEWS = {
  side: { u0: -290, u1: 1000, v0: -300, v1: 1080 },
  top: { u0: -290, u1: 1000, v0: -330, v1: 600 },
};

export const BARITONE_SAX = saxFamily(BARITONE, BARITONE_VIEWS, {
  standing: 'The player stands, the baritone on a harness: the body angled across to the right, the loop above the shoulder, the bell at the hip.',
  seated: 'The player sits, as in a big band’s sax section: the same hold — the big horn hangs beside the right knee, close to the chair and the floor.',
});
export const BARITONE_MODEL = BARITONE_SAX.MODEL;
