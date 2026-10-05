/**
 * C13 OUD — where things are: the oud built by the shared lute family
 * (seated on a chair, the bowl on the right thigh, the face to the
 * audience), its zones, its stage sources.
 */
import { buildLute, luteZone, type PartWords } from '../shared/lutes/luteModel.ts';
import { oudWedges } from '../shared/lutes/lutesContent.ts';
import { c13ZoneSpecs } from './model.ts';

const WORDS: Record<string, PartWords> = {
  face: { label: 'face (soundboard)', short: 'face', role: 'The thin wooden face, driven by the strings through the bridge. Much of the oud’s sound leaves from here.' },
  roseMain: { label: 'main rosette', short: 'main rose', role: 'The large carved rosette under the strings. The air inside the bowl breathes through it — a big part of the warm, low bloom.' },
  roseSmall: { label: 'small rosettes', short: 'small roses', role: 'Two small carved rosettes low on the face, either side of the strings: more openings for the bowl’s air.' },
  bridge: { label: 'bridge', short: 'bridge', role: 'Glued low on the face; the strings are tied to it. They pull on it and it rocks with them, driving the face.' },
  strings: { label: 'strings (courses)', short: 'strings', role: 'Usually paired strings in courses, plucked with the risha. On their own they move very little air.' },
  board: { label: 'fingerboard (fretless)', short: 'fingerboard', role: 'No frets: the left hand slides between notes, including the notes between the semitones. Those slides and the fingers are part of the sound.' },
  neck: { label: 'neck', short: 'neck', role: 'A short neck; the left hand moves along it.' },
  pegbox: { label: 'pegbox and pegs', short: 'pegbox', role: 'Bent sharply back from the neck; the pegs hold and tune the strings. It swings as the player moves — keep a mic well clear.' },
  bowl: { label: 'bowl (back)', short: 'bowl', role: 'The deep rounded back, built of many thin staves. It closes in the air the face and the rosettes work with, and rests against the player.' },
};

export const C13_BUILT = buildLute('oud', WORDS, 'oud');
export const C13_MODEL = C13_BUILT.model;
const SC = C13_BUILT.scene;
export const C13_ZONES = c13ZoneSpecs(SC).map((z) => luteZone(SC, z));
export const C13_WEDGES = oudWedges(SC);
/** The oud's body (its face slices): the context page's "in path". */
export const C13_SHIELD = C13_MODEL.parts.filter((p) => /^oud\.face\d+$/.test(p.id)).map((p) => p.id);
