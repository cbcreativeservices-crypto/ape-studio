/**
 * A05b ALTO SAXOPHONE — where things are (charter §2 layer 2): the shared
 * saxophone family's alto row (lessons/shared/sax/saxSpec.ts) on a neck
 * strap, the body angled across to the player's right and the bell beside
 * the right thigh, STANDING or SEATED (alto_sax/GEOMETRY_PROPOSAL.md §2).
 * In the lesson frame the horn stays put (the reed tip is the origin); the
 * floor, the legs and the chair move.
 */
import { ALTO } from '../shared/sax/saxSpec.ts';
import { saxFamily } from '../shared/sax/saxFamily.ts';

export const ALTO_VIEWS = {
  side: { u0: -260, u1: 720, v0: -250, v1: 800 },
  top: { u0: -260, u1: 720, v0: -320, v1: 470 },
};

export const ALTO_SAX = saxFamily(ALTO, ALTO_VIEWS, {
  standing: 'The player stands, the alto on a neck strap: the body angled across to the right, the bell beside the right thigh.',
  seated: 'The player sits, as in a big band’s sax section: the same hold — the horn hangs beside the right knee, and the floor and the chair come closer.',
});
export const ALTO_MODEL = ALTO_SAX.MODEL;
