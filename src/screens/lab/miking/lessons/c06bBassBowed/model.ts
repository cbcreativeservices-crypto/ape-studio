/**
 * C06b UPRIGHT BASS, BOWED — the recommended starting points (charter §2
 * layer 1), on the shared bass with its bow (lessons/shared/bowed/bass.ts).
 * Source keys: docs/labs/miking/upright_bass_bowed/SOURCES.md (and the
 * plucked file's). Corrections UB-01 … UB-05.
 *
 *   front  as the plucked lesson — and here it must sit outside the bow's
 *          sweep: the bow plays 4–17 cm up from the bridge, right where the
 *          mic looks (upright_bass_bowed/GEOMETRY_PROPOSAL.md);
 *   fhole  a few inches from the f-hole;
 *   under  the approved under-bridge miniature, clear of the bow;
 *   spot   an orchestral section spot: on a stand in front of the section,
 *          about 80 cm out, 1–1.5 m above the floor (the proposal's drawing
 *          default; the section layout is the ensemble lesson's).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { around, zoneSection } from '../shared/bowed/bowedModel.ts';
import { ABOVE, BASS_BOW, BASS_BOW_MODEL, BASS_FHOLE, BASS_FRONT, BASS_UNDER, FHOLE_GEN, FRONT_GEN, UNDER_GEN, bassStart } from '../shared/bowed/bass.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ax = BASS_BOW.ax;
const floor = BASS_BOW.floorY;

const SPOT_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ub.spot',
  label: 'A section spot, on a stand in front',
  band: 'For a bass section in an orchestra: a spot on a stand in front of the section, about 70–110 cm out and 1–1.5 m above the floor, aimed at the basses — a support for the main pickup, not one close mic per player.',
  kind: 'trial',
  src: 'SCH-MK4V',
  quote: 'Preferred applications: as spot microphone in orchestra',
  bandProv: ill('the proposal’s drawing default: 1000–1500 high above the floor and about 800 in front; section seating is the ensemble lesson’s'),
  refSurface: 'above',
  side: 'outside',
  distance: { min: 700, max: 1100 },
  cone: { min: 0, max: 40, prov: ill('in front of the section: within 40°') },
  aim: { maxOffAxis: 30, prov: ill('aimed at the basses: within 30°') },
  box: { min: { x: -2000, y: floor - 1500, z: -2000 }, max: { x: 3000, y: floor - 1000, z: 2000 }, prov: ill('1–1.5 m above the floor (the proposal’s drawing default)') },
  requires: { micTypeIds: ['strSdc'] },
  draw: { side: zoneSection('side', ABOVE, ax.z, 40, 700, 1100), top: zoneSection('top', ABOVE, ax.z, 40, 700, 1100) },
  tendency: 'Pitch and articulation for the whole section, without one player’s bow noise standing out. Bring it into the main pickup gradually; check mono and the section’s image.',
  checks: ['It helps the section, not one player', 'Mono, and the image against the main pair', 'Stable stand, away from the endpins and the bows'],
};

export const BASS_BOW_ZONES: DocumentedZone[] = [
  bassStart(BASS_BOW_MODEL, BASS_FRONT, FRONT_GEN()),
  bassStart(BASS_BOW_MODEL, BASS_FHOLE, FHOLE_GEN()),
  bassStart(BASS_BOW_MODEL, BASS_UNDER, UNDER_GEN()),
  bassStart(BASS_BOW_MODEL, SPOT_Z, around(ABOVE, ax.z, [850, 800, 900, 750, 950, 1000], 38, ABOVE, ax.y)),
];
