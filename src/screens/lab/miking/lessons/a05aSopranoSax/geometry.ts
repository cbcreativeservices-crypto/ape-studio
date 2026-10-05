/**
 * A05a SOPRANO SAXOPHONE — where things are: the shared saxophone family's
 * soprano row (lessons/shared/sax/saxSpec.ts) — straight, held down and
 * forward about 30° from the vertical ("a downward-looking position",
 * Y-HUB-SAX; soprano_sax/GEOMETRY_PROPOSAL.md), STANDING or SEATED (the
 * knees part and the bell sits between them). The curved-neck and
 * curved-bell sopranos exist; this lab draws the common straight one.
 */
import { SOPRANO } from '../shared/sax/saxSpec.ts';
import { saxFamily } from '../shared/sax/saxFamily.ts';

export const SOPRANO_VIEWS = {
  side: { u0: -260, u1: 840, v0: -250, v1: 820 },
  top: { u0: -260, u1: 840, v0: -330, v1: 430 },
};

export const SOPRANO_SAX = saxFamily(SOPRANO, SOPRANO_VIEWS, {
  standing: 'The player stands, the straight soprano held in front, pointing down and forward, the bell about level with the hips.',
  seated: 'The player sits: the same hold — the knees part and the bell sits between them; the floor and the chair come closer.',
});
export const SOPRANO_MODEL = SOPRANO_SAX.MODEL;
