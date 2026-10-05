/**
 * Microphones by property for Lab 4's plucked strings (the guitar family).
 * Generic types; the products their sizes come from stay in `examples` and
 * every `prov` — the INTERNAL record (owner ruling 2026-10-04: no brand or
 * model name on screen). Merged into MIC_TYPES by micTypes.ts.
 *
 * `sdcCard` and `instDynCard` carry the same ids, words and sizes as the
 * speaker module's types (miking-w5), so the two branches describe one
 * microphone each, not two. `clipCond` is new: the miniature supercardioid
 * condenser on a guitar clip (acoustic_guitar/SOURCES.md DPA-MOUNT; its
 * capsule size and the gooseneck's reach are drawing defaults).
 */
import type { MicType } from '../engine/model/types.ts';

const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;
const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

export const STRINGS_MIC_TYPES = {
  sdcCard: {
    id: 'sdcCard',
    label: 'Small-diaphragm condenser (pencil)',
    short: 'SMALL COND',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: generic },
      { id: 'omni', label: 'omni capsule (textbook shape)', prov: generic },
    ],
    body: {
      length: { mm: 104, prov: { kind: 'trial', src: 'AX-SCX1', note: 'one pencil condenser’s documented length ("104 mm / 4.1 in"), used for the generic type' } },
      radius: placeholder(10.5, 'a pencil condenser’s body diameter: drawing default Ø 21 mm'),
    },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'Audix SCX1 (length)', fact: 'pencil condensers: 104 mm long (SCX1); Ø drawn 21 mm (drawing default).', src: 'AX-SCX1' }],
    art: 'sdc',
    blurb: 'A slim small-diaphragm condenser, usually cardioid (some take an omni capsule): detailed, light, easy to place. Needs phantom power.',
  },
  instDynCard: {
    id: 'instDynCard',
    label: 'End-address instrument dynamic, cardioid',
    short: 'INST DYN',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'Cardioid' } }],
    body: {
      length: { mm: 157, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'p.6 drawing: "157 mm (6 3/16 in.)" overall length' } },
      radius: { mm: 16, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'p.6 drawing: "32 mm (1 1/4 in.)" grille/front diameter' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, 32 mm grille, 23 mm tail; no maximum SPL stated.', src: 'S-SM57-UG' }],
    art: 'smallDynamic',
    blurb: 'A compact instrument dynamic with a cardioid pattern — a robust close option on a loud stage. Needs no power.',
  },
  clipCond: {
    id: 'clipCond',
    label: 'Miniature condenser on a clip, supercardioid',
    short: 'MINI CLIP',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'DPA-UKE', quote: 'The miniature supercardioid 4099 CORE+ Instrument Microphone' } }],
    body: { length: placeholder(30, 'the miniature capsule’s length'), radius: placeholder(6, 'the miniature capsule’s radius') },
    power: 'phantom power (through its adapter)',
    mount: 'clip',
    clip: { reach: placeholder(200, 'the clip’s gooseneck reach from the body’s edge to the capsule') },
    examples: [{ model: 'DPA 4099 on the GC4099 / VC4099 clips', fact: 'supercardioid; GC4099 fits a body "between 35 mm (1.4 in) and 122 mm (4.8 in)" deep; VC4099 35–55 mm.', src: 'DPA-MOUNT' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, held by a clip on the body’s edge: it moves with the instrument. Needs phantom power. Only a clip made for this body depth, and only with the owner’s OK.',
  },
} satisfies Record<string, MicType>;
