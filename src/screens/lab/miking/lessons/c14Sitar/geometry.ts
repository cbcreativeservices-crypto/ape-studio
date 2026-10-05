/**
 * C14 SITAR — where things are: the sitar built by the shared lute family
 * (seated on the floor, the gourd on the left foot's sole, the neck rising
 * to the player's left), its zones, its stage sources.
 */
import { buildLute, luteZone, type PartWords } from '../shared/lutes/luteModel.ts';
import { sitarWedges } from '../shared/lutes/lutesContent.ts';
import { c14ZoneSpecs } from './model.ts';

const WORDS: Record<string, PartWords> = {
  tabli: { label: 'tabli (soundboard)', short: 'tabli', role: 'The thin wooden board over the gourd, running up as the neck’s face. Driven by the strings through the main bridge, much of the sound leaves from here.' },
  gourd: { label: 'main gourd (resonator)', short: 'gourd', role: 'The large dried gourd behind the board. It closes in the air the board works with; on many sitars it is lacquered and inlaid — fragile: nothing rests on it.' },
  jawari: { label: 'main bridge (jawari)', short: 'jawari', role: 'A broad, flat bone bridge. The strings graze its gently curved top as they swing — the bright, buzzing edge the player shapes. Never adjusted for a mic.' },
  tarafBridge: { label: 'sympathetic-string bridge', short: 'small bridge', role: 'A small, low bridge below the main one: the sympathetic strings cross it.' },
  strings: { label: 'main strings', short: 'strings', role: 'Seven on this sitar: four run to the nut and are played along the neck; three are drones, tuned and struck for rhythm, running to pegs on the neck’s side.' },
  sympathetic: { label: 'sympathetic strings', short: 'sympathetic', role: 'Thirteen on this sitar, running under the frets to small pegs along the neck. Never plucked: they ring when a played note matches their tuning. Some sitars have none — ask.' },
  frets: { label: 'arched frets', short: 'frets', role: 'Curved metal frets tied to the neck. The main strings pass over their tops; the sympathetic strings pass under them. The player pulls strings sideways across them to bend notes.' },
  neck: { label: 'neck (dand)', short: 'neck', role: 'A long hollow neck; the left hand travels along it and pulls strings across the frets.' },
  pegs: { label: 'pegs', short: 'pegs', role: 'The large pegs at the top and the side hold the main strings; a row of small pegs holds the sympathetic strings.' },
  upperGourd: { label: 'upper gourd', short: 'upper gourd', role: 'A second, smaller gourd behind the top of the neck on some sitars. What it adds varies — ask the player.' },
};

export const C14_BUILT = buildLute('sitar', WORDS, 'sitar');
export const C14_MODEL = C14_BUILT.model;
const SC = C14_BUILT.scene;
export const C14_ZONES = c14ZoneSpecs(SC).map((z) => luteZone(SC, z));
export const C14_WEDGES = sitarWedges(SC);
/** The sitar's body (gourd slices and board): the context page's "in path". */
export const C14_SHIELD = C14_MODEL.parts.filter((p) => /^sitar\.(gourd\d+|tabli|neck)$/.test(p.id)).map((p) => p.id);
