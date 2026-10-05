/**
 * C15 SARASWATI VEENA — where things are: the veena built by the shared lute
 * family (seated cross-legged, the resonator on the floor at the player's
 * right, the neck across the lap to the left thigh, the face tilted up and a
 * little toward the player), its zones, its stage sources.
 */
import { buildLute, luteZone, type PartWords } from '../shared/lutes/luteModel.ts';
import { veenaWedges } from '../shared/lutes/lutesContent.ts';
import { c15ZoneSpecs } from './model.ts';

const WORDS: Record<string, PartWords> = {
  plate: { label: 'top plate (soundboard)', short: 'top plate', role: 'The wooden plate over the big resonator, driven by the strings through the bridge. In the measured radiation it mattered most.' },
  resonator: { label: 'main resonator (kudam)', short: 'resonator', role: 'The large carved wooden bowl under the top plate. It closes in the air the plate works with, and rests on the floor at the player’s right.' },
  bridge: { label: 'main bridge', short: 'bridge', role: 'A broad, flat bridge: the strings vibrate against its top — the buzz the player intends. A small curved side bridge carries the tala strings.' },
  strings: { label: 'melody strings', short: 'strings', role: 'Four melody strings over the frets, plucked with the fingers; the left hand presses and pulls them for the gamakas (bends).' },
  frets: { label: 'frets on wax', short: 'frets', role: 'Twenty-four brass frets set in ridges of black wax along the neck.' },
  neck: { label: 'neck (dandi)', short: 'neck', role: 'A long hollow neck, decorated along its sides; the left hand travels along it.' },
  tala: { label: 'tala (drone) strings', short: 'tala strings', role: 'Three open strings along the side of the neck, struck by the plucking hand’s little finger for rhythm and drone.' },
  pegs: { label: 'pegs', short: 'pegs', role: 'Large pegs near the head end hold the melody strings; smaller side pegs hold the tala strings.' },
  gourd: { label: 'neck-end gourd', short: 'gourd', role: 'A smaller gourd under the neck, resting on the left thigh: mainly a SUPPORT — not a second main soundboard.' },
  yali: { label: 'yali (carved head)', short: 'yali', role: 'The carved dragon head at the end of the neck. Fragile, often painted and gilded — nothing rests on it.' },
};

export const C15_BUILT = buildLute('veena', WORDS, 'Saraswati veena');
export const C15_MODEL = C15_BUILT.model;
const SC = C15_BUILT.scene;
export const C15_ZONES = c15ZoneSpecs(SC).map((z) => luteZone(SC, z));
export const C15_WEDGES = veenaWedges(SC);
/** The veena's body (resonator slices, plate, neck): the context page's "in path". */
export const C15_SHIELD = C15_MODEL.parts.filter((p) => /^veena\.(resonator\d+|plate|neck)$/.test(p.id)).map((p) => p.id);
