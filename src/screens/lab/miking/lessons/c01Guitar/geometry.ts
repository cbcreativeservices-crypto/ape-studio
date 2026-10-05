/**
 * C01 ACOUSTIC GUITAR — where things are (charter §2 layer 2): the three
 * bodies built by the shared guitar family (frame G = the engine frame for a
 * seated player: +x to the nut, +y to the treble side, down; +z out of the
 * top), their zones, and the stage sources the Studio-or-live page uses.
 */
import type { Provenance, Wedge } from '../../engine/model/types.ts';
import { buildGuitarModel, partIdOf, zoneFor } from '../shared/guitars/guitarModel.ts';
import { C01_VARIANTS, c01ZoneSpecs } from './model.ts';

export const C01_BUILT = buildGuitarModel({ id: 'acousticGuitar', name: 'acoustic guitar', variants: C01_VARIANTS, defaultVariant: 'steel' });
export const C01_MODEL = C01_BUILT.model;
export const C01_ZONES = C01_VARIANTS.flatMap((v) => c01ZoneSpecs(C01_BUILT.scenes[v.id]).map((z) => zoneFor(C01_BUILT.scenes[v.id], z)));

const STEEL = C01_BUILT.scenes.steel;
const stage: Provenance = { kind: 'illustrative', reason: 'a typical small stage; no source gives the positions' };

/** The stage sources (lesson frame, the steel body's scene): a floor wedge
 *  downstage facing the player, and the player's own voice. */
export const C01_WEDGES: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, downstage, facing the player',
    short: 'WEDGE',
    p: { x: 120, y: STEEL.floorY, z: 1200 },
    lift: 150,
    faces: { x: 0, y: 0, z: -1 },
    note: 'In front of the player on the floor, about 1.2 m out, facing back at them. A mic aimed at the guitar has it behind and below — where a pattern’s rejection can help.',
    prov: stage,
  },
  {
    id: 'voice',
    label: 'the player’s own voice (a singer-guitarist)',
    short: 'VOICE',
    p: STEEL.fit.mouth,
    lift: 0,
    faces: { x: 0, y: 0, z: 1 },
    note: 'Just above and behind the guitar mic’s front: in the front half of any pattern aimed at the guitar, so no null reaches it. Plan the balance instead.',
    prov: stage,
    glyph: 'none',
  },
];

/** The body's parts that stand between a mic and a source (page 4's "in path"). */
export const C01_SHIELD = C01_MODEL.parts.filter((p) => p.variants?.includes('steel') && /\.body\d+$/.test(p.id)).map((p) => p.id);
export const pid = partIdOf;
