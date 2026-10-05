/**
 * Microphones BY PROPERTY for Lab 1's kit-level lessons (M09 overheads, M10
 * room, M11 complete kit). Generic types; their sizes come from named
 * products' own documents, kept in `examples` and every `prov` as the
 * INTERNAL record only (owner ruling 2026-10-04: no brand or model name is
 * shown). Merged into MIC_TYPES (micTypes.ts). Source keys:
 * docs/labs/miking/overheads/SOURCES.md, room/SOURCES.md, snare/SOURCES.md.
 *
 * Reference point: the mic's FRONT — the grille front of an end-address mic,
 * the FACE of a side-address one — not its acoustic centre.
 */
import type { MicType } from '../engine/model/types.ts';

const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;
const unk = (needed: string) => ({ kind: 'unknown', needed }) as const;

const pencilBody = {
  length: { mm: 104, prov: { kind: 'sourced', src: 'AX-DPE8', quote: 'SCX1 length "104 mm / 4.1 in"' } as const },
  radius: { mm: 10.5, prov: unk('a pencil condenser’s diameter (drawing default Ø 21 mm)'), placeholder: true },
};
const sideBody = {
  // Product data (Medium: whether this is the mic alone or with its mount is
  // not stated): width 118.008, height 80.01, depth 254.991 mm — drawn as a
  // body 255 mm long (upright), 118 wide, 80 deep (front to back).
  length: { mm: 80.01, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'height "80.01" (product data), drawn as the depth front to back' } as const },
  radius: { mm: 59.004, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'width "118.008" (product data)' } as const },
  width: { mm: 254.991, prov: { kind: 'sourced', src: 'S-SM4-WEB', quote: 'depth "254.991" (product data), drawn as the upright length' } as const },
};
const PENCIL_EX = [{ model: 'Audix SCX1 / SCX1C', fact: 'Length "104 mm / 4.1 in"; the DP Elite 8 sheet: "2 x SCX1C Overhead Mics" and the overhead tip ("4 feet is a good starting point… keep the mics in a vertical position").', src: 'AX-DPE8' }];
const SIDE_EX = [{ model: 'Shure SM4', fact: '"versatile side-address cardioid condenser"; "Polar Pattern: Cardioid"; "Make sure the logo on the front of the mic faces your sound source."; "Drums 3–6 feet (1–2 m)"; "Maximum SPL … 140 dB SPL"; "48 V DC phantom power (5.3 mA)".', src: 'S-SM4-UG' }];

export const KIT_MIC_TYPES: Record<string, MicType> = {
  ohPencil: {
    id: 'ohPencil',
    label: 'Small-diaphragm condenser on a boom',
    short: 'PENCIL',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: { kind: 'trial', src: 'AX-DPE8', note: 'the overhead model’s "C" capsule read as cardioid' } },
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
    ],
    body: pencilBody,
    power: 'phantom power (48 V) for most',
    mount: 'boom',
    examples: PENCIL_EX,
    art: 'sdc',
    blurb: 'A pencil-shaped condenser with a small capsule — a common overhead choice, light on a boom. Needs phantom power. A cardioid favours what it faces; an omni hears all round, room included.',
  },
  ohLdc: {
    id: 'ohLdc',
    label: 'Large-diaphragm condenser, side-address, on a boom',
    short: 'LARGE SIDE',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM4-UG', quote: 'Polar Pattern: Cardioid' } }],
    body: sideBody,
    power: 'phantom power (48 V)',
    mount: 'boom',
    examples: SIDE_EX,
    art: 'sideLdc',
    blurb: 'A larger condenser that hears out of the FACE of its body — aim the face at the kit, not the end. Heavier on a boom: counterweight it. Needs phantom power.',
  },
  roomPencil: {
    id: 'roomPencil',
    label: 'Small-diaphragm condenser on a floor stand',
    short: 'PENCIL',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
      { id: 'cardioid', label: 'cardioid (textbook shape)', prov: generic },
    ],
    body: pencilBody,
    power: 'phantom power (48 V) for most',
    mount: 'stand',
    examples: PENCIL_EX,
    art: 'sdc',
    blurb: 'A small condenser on a floor stand, out in the room. As an omni it hears the room from every side; as a cardioid it favours the kit in front of it. Needs phantom power.',
  },
  roomLdc: {
    id: 'roomLdc',
    label: 'Large-diaphragm condenser, side-address, on a floor stand',
    short: 'LARGE SIDE',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM4-UG', quote: 'Polar Pattern: Cardioid' } }],
    body: sideBody,
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: SIDE_EX,
    art: 'sideLdc',
    blurb: 'A side-address cardioid condenser in front of the kit: aim its FACE at the kit. Needs phantom power.',
  },
  spotDyn: {
    id: 'spotDyn',
    label: 'Small dynamic, cardioid (a spot mic)',
    short: 'SPOT DYN',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'Cardioid' } }],
    body: {
      length: { mm: 157, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '157 mm (6 3/16 in.)' } },
      radius: { mm: 16, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '32 mm (1 1/4 in.) grille diameter' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, 32 mm grille (user guide drawing). No maximum SPL is printed.', src: 'S-SM57-UG' }],
    art: 'smallDynamic',
    blurb: 'A small cardioid dynamic on a short boom: a common spot mic for a snare, a tom or a hi-hat. Needs no power; keep its grille out of the sticks’ path.',
  },
};
