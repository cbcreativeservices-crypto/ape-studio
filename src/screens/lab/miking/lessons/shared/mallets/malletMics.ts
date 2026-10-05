/**
 * MALLET-BAR FAMILY — microphones BY PROPERTY (vibraphone, marimba,
 * xylophone, glockenspiel). The lessons say: "Condenser mics are a common
 * practical option for a detailed mallet instrument. A suitable dynamic can
 * also work in a difficult live setup" (vibraphone L13; the same in the
 * marimba, xylophone and glockenspiel texts). Generic types; the products
 * their sizes were read from are the INTERNAL record (`examples`, `prov`) —
 * never shown (owner ruling 2026-10-04). Registered in data/micTypes.ts.
 *
 * Source keys: snare/SOURCES.md (S-SM57-UG), hihat/SOURCES.md (AX-SCX1),
 * overheads/GEOMETRY_PROPOSAL.md (the pencil condenser's Ø 21 mm drawing
 * default). A size no maker sheet confirmed is a flagged placeholder.
 */
import type { MicType, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const generic = src('WP-MIC', 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)');

export const MALLET_MIC_TYPES: Record<string, MicType> = {
  mlSdc: {
    id: 'mlSdc',
    label: 'Small-diaphragm condenser (pencil), cardioid',
    short: 'CONDENSER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: generic },
      { id: 'omni', label: 'omni capsule (textbook shape)', prov: generic },
    ],
    body: {
      length: { mm: 104, prov: src('AX-SCX1', '104 mm / 4.1 in (overheads/GEOMETRY_PROPOSAL.md)') },
      radius: { mm: 10.5, prov: unk('a pencil condenser’s body diameter (drawing default Ø 21 mm, overheads/GEOMETRY_PROPOSAL.md)'), placeholder: true },
    },
    power: 'phantom power from the desk',
    mount: 'stand',
    examples: [{ model: 'Audix SCX1 (length only)', fact: '"104 mm / 4.1 in"; the diameter is a drawing default (Ø 21 mm).', src: 'AX-SCX1' }],
    art: 'sdc',
    blurb: 'A slim, light condenser with a cardioid pattern — a common choice over a mallet keyboard, detailed across the whole range. Needs phantom power. Keep it, its boom and its cable above the raised mallets.',
  },
  mlDynCard: {
    id: 'mlDynCard',
    label: 'Compact dynamic, cardioid',
    short: 'DYN · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM57-UG', 'Cardioid') }],
    body: {
      length: { mm: 157, prov: src('S-SM57-UG', '157 mm (6 3/16 in.) overall length (p.6 drawing)') },
      radius: { mm: 16, prov: src('S-SM57-UG', '32 mm (1 1/4 in.) grille/front diameter (p.6 drawing)') },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, 32 mm grille; no max SPL printed.', src: 'S-SM57-UG' }],
    art: 'smallDynamic',
    blurb: 'A rugged, compact dynamic with a cardioid pattern — one that can work in a difficult live setup. Needs no power. Its grille is not made to be struck: keep it above the mallets’ travel.',
  },
};
