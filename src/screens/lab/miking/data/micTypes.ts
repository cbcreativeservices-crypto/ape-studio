/**
 * Microphones BY PROPERTY (lesson L96: "chooses a microphone by properties
 * rather than by brand"). Each type is generic; its SIZE comes from a named
 * model's own documentation, kept in `examples` and every `prov` as the
 * INTERNAL record only — owner ruling 2026-10-04: no brand or model name is
 * shown to the learner. Mics are drawn as generic types, never a brand's
 * likeness. Pure data.
 *
 * Source keys: docs/labs/miking/kick/SOURCES.md and SOURCES_SHARED.md.
 * Reference point: the mic's FRONT (grille front; element end of a boundary
 * plate) — not its acoustic centre (Kick L39; GEOMETRY_PROPOSAL §5).
 */
import type { MicType } from '../engine/model/types.ts';
import { KIT_MIC_TYPES } from './micTypesKit.ts';
import { CONCERT_MIC_TYPES } from './micTypesConcert.ts';

const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;

export const MIC_TYPES: Record<string, MicType> = {
  // Lab 1's kit-level lessons (overheads, room, complete kit): micTypesKit.ts.
  ...KIT_MIC_TYPES,
  kickDynSuper: {
    id: 'kickDynSuper',
    label: 'End-address dynamic, large head, supercardioid',
    short: 'DYN · SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'S-B52-UG', quote: 'Supercardioid' } }],
    body: {
      length: { mm: 113.0, prov: { kind: 'sourced', src: 'S-B52-WEB', quote: 'depth "113.0"' } },
      radius: { mm: 47.0, prov: { kind: 'sourced', src: 'S-B52-WEB', quote: 'width "94.0" (front diameter, read as the grille)' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [
      { model: 'Shure Beta 52A', fact: 'Spec field: "Supercardioid"; description: "modified supercardioid". 94.0 × 162.0 × 113.0 mm product data. Max SPL 174 dB (1 kHz, 1% THD, 1 kΩ load).', src: 'S-B52-UG' },
    ],
    art: 'kickDynamic',
    blurb: 'A purpose-built kick dynamic with a large head and a supercardioid pattern. Needs no power. Keep it off the head and the damping.',
  },
  kickDynCard: {
    id: 'kickDynCard',
    label: 'End-address dynamic, cardioid',
    short: 'DYN · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'SN-902-SPEC', quote: 'Pick-up pattern cardioid' } }],
    body: {
      length: { mm: 128.5, prov: { kind: 'sourced', src: 'SN-902-SPEC', quote: 'Ø 60 x 128.5 mm' } },
      radius: { mm: 30, prov: { kind: 'sourced', src: 'SN-902-SPEC', quote: 'Ø 60' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [
      { model: 'Sennheiser e 902', fact: '"Pick-up pattern cardioid"; Ø 60 × 128.5 mm; 440 g. No maximum SPL is printed.', src: 'SN-902-SPEC' },
      { model: 'AKG D112 MkII', fact: '"Polar pattern Cardioid"; length 115 mm, diameter 70 mm; max SPL "> 160 dB (calculated)" for 0.5 % THD.', src: 'AKG-CUT' },
    ],
    art: 'kickDynamic',
    blurb: 'A kick dynamic with a cardioid pattern. Needs no power. Their sound differs from one model to the next, so two cardioid kick mics are not interchangeable.',
  },
  boundaryHalf: {
    id: 'boundaryHalf',
    label: 'Boundary condenser (half-cardioid), on the pillow',
    short: 'BOUNDARY',
    transducer: 'condenser',
    address: 'boundary',
    patterns: [{ id: 'halfCardioid', label: 'half-cardioid (hemisphere above the surface)', prov: { kind: 'sourced', src: 'S-B91-UG', quote: 'Half-cardioid (cardioid in hemisphere above mounting surface)' } }],
    body: {
      length: { mm: 139.1, prov: { kind: 'sourced', src: 'S-B91-UG', quote: '139,1 mm' } },
      radius: { mm: 10.15, prov: { kind: 'sourced', src: 'S-B91-UG', quote: '20,3 mm (height; half of it)' } },
      width: { mm: 95.11, prov: { kind: 'sourced', src: 'S-B91-UG', quote: '95,11 mm' } },
    },
    power: 'phantom power: 11–52 V DC, 5.4 mA (best at 48 V)',
    mount: 'surface',
    surfacePartId: 'kick.pillow',
    examples: [
      { model: 'Shure Beta 91A', fact: '"Electret Condenser" boundary mic; 139.1 × 95.11 × 20.3 mm; contour switch "7 dB of attenuation centered at 400 Hz"; "Keep sound sources within a 60° range above this surface."', src: 'S-B91-UG' },
    ],
    art: 'boundary',
    blurb: 'A low plate made to rest INSIDE the drum on a pillow. Needs phantom power. Leave its grille uncovered.',
  },
  sdc: {
    id: 'sdc',
    label: 'High-SPL condenser (kick)',
    short: 'CONDENSER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'unstated', label: 'open cardioid (not drawn)', prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Directional pattern Open Cardioid' } },
      { id: 'cardioid', label: 'cardioid (textbook shape)', prov: generic },
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
    ],
    body: {
      length: { mm: 132, prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Microphone length 132 mm' } },
      radius: { mm: 28.5, prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Microphone diameter 57 mm' } },
    },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [
      { model: 'DPA 4055 (named in the DPA article the lesson cites)', fact: '"Open Cardioid"; Ø 57 × 132 mm; "P48 (Phantom Power)"; THD < 1% at "156dB SPL RMS".', src: 'DPA-4055' },
    ],
    art: 'sdc',
    blurb: 'A high-SPL condenser — a flatter-response approach some engineers like on kick. One tonal aim, not proof that condensers are better. Needs phantom power.',
  },
  // Added 2026-10-05 for the speaker-cabinet / Leslie module, tonbak and tabla
  // (speaker_leslie/, tonbak/, tabla/ SOURCES; the size facts are snare/SOURCES).
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
    art: 'instDynamic',
    blurb: 'A compact instrument dynamic with a cardioid pattern — a common first choice in front of a guitar speaker and on loud sources. Needs no power.',
  },
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
      length: { mm: 104, prov: { kind: 'trial', src: 'AX-SCX1', note: 'one pencil condenser’s documented length ("104 mm / 4.1 in"), used for the generic type (room/kit GEOMETRY_PROPOSAL)' } },
      radius: { mm: 10.5, prov: { kind: 'unknown', needed: 'a pencil condenser’s body diameter: drawing default Ø 21 mm' }, placeholder: true },
    },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'Audix SCX1 (length); Shure KSM137 (the tabla account’s mic)', fact: 'pencil condensers: 104 mm long (SCX1); Ø drawn 21 mm (drawing default).', src: 'AX-SCX1' }],
    art: 'sdc',
    blurb: 'A slim small-diaphragm condenser, usually cardioid (some take an omni capsule): detailed, light, easy to place. Needs phantom power.',
  },
  // Lab 1's concert lessons (M06–M08): data/micTypesConcert.ts.
  ...CONCERT_MIC_TYPES,
};

/* ── Lab 1: the snare and the toms (snare/SOURCES.md, toms/SOURCES.md §b) ── */
const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

Object.assign(MIC_TYPES, {
  smallDynCard: {
    id: 'smallDynCard',
    label: 'End-address dynamic, small, cardioid',
    short: 'DYN · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'S-SM57-UG', quote: 'Cardioid' } }],
    body: {
      length: { mm: 157, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '157 mm (6 3/16 in.) overall length (p.6 drawing)' } },
      radius: { mm: 16, prov: { kind: 'sourced', src: 'S-SM57-UG', quote: '32 mm (1 1/4 in.) front diameter (p.6 drawing)' } },
    },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure SM57', fact: '"Dynamic (moving coil)"; "Cardioid"; 157 mm long, Ø 32 mm front, Ø 23 mm tail; 284 g; no maximum SPL is printed.', src: 'S-SM57-UG' }],
    art: 'smallDynamic',
    blurb: 'The common small instrument dynamic, on a stand. Needs no power. Its grille is not made to be struck: keep it out of the sticks’ path.',
  },
  tomDynSuper: {
    id: 'tomDynSuper',
    label: 'End-address dynamic, supercardioid',
    short: 'DYN · SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'S-B56A-UG', quote: 'Supercardioid; greatest sound rejection at points 120° toward the rear' } }],
    // Its outline is not published: drawn as the small dynamic's silhouette
    // with a wider grille (toms/GEOMETRY_PROPOSAL.md §4, drawing default).
    body: { length: placeholder(157, 'supercardioid drum dynamic length (no drawing published)'), radius: placeholder(25, 'supercardioid drum dynamic grille (no drawing published)') },
    power: 'none needed (dynamic)',
    mount: 'stand',
    examples: [{ model: 'Shure Beta 56A', fact: '"Supercardioid"; null "120° toward the rear"; integrated locking stand adapter; 468 g; dimensions not published.', src: 'S-B56A-UG' }],
    art: 'smallDynamic',
    blurb: 'A drum dynamic with a supercardioid pattern and a built-in stand adapter. Needs no power. Its deepest rejection is off to each side of the rear, not straight behind.',
  },
  clipDynCard: {
    id: 'clipDynCard',
    label: 'Clip-on dynamic, cardioid, on a rim clamp',
    short: 'CLIP · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Pick-up pattern cardioid' } }],
    body: {
      length: { mm: 63, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Ø 41 mm, length 63 mm' } },
      radius: { mm: 20.5, prov: { kind: 'sourced', src: 'SN-904-2019', quote: 'Ø 41 mm' } },
    },
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: { reach: placeholder(120, 'the rim clamp’s reach from the hoop to the mic') },
    examples: [{ model: 'Sennheiser e 904', fact: '"cardioid"; Ø 41 × 63 mm; 125 g; delivered with its MZH 604 rim clamp (clamp size not published).', src: 'SN-904-2019' }],
    art: 'clipDynamic',
    blurb: 'A compact dynamic that rides a clamp on the drum’s hoop. Needs no power. Low profile and out of the stand forest — check the clamp suits the hoop and the player agrees.',
  },
  rimCondenser: {
    id: 'rimCondenser',
    label: 'Condenser on a gooseneck, rim-mounted, cardioid',
    short: 'COND · RIM',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'EW-DM20', quote: 'Polar Pattern Cardioid' } }],
    // The head is the body that collides; the gooseneck (sourced) is the
    // reach back to the rim mount.
    body: { length: placeholder(40, 'the condenser head’s length on its gooseneck'), radius: { mm: 11, prov: { kind: 'sourced', src: 'EW-DM20', quote: 'Dimensions L x D 11.12 x .860 inches (282.44mm x 22mm)' } } },
    power: 'phantom power (24–48 V)',
    mount: 'clip',
    clip: { reach: { mm: 160, prov: { kind: 'trial', src: 'EW-DM20', note: 'the 120.65 mm gooseneck plus a drawing default for the rim mount' } } },
    examples: [{ model: 'Earthworks DM20 on RM1', fact: '"Cardioid"; 282.44 × 22 mm; gooseneck 120.65 × 9.53 mm; "Peak Acoustic Input 150dB SPL"; "24-48V Phantom"; RM1 rim mount, top or bottom of a tom or snare.', src: 'EW-DM20' }],
    art: 'gooseneck',
    blurb: 'A slim condenser on a short gooseneck that clamps to the hoop. Needs phantom power. Keep its head angled toward the drumhead, never flat to it.',
  },
} satisfies Record<string, MicType>);

export function micType(id: string): MicType {
  return MIC_TYPES[id] ?? MIC_TYPES.kickDynCard;
}

/* Lab 1 hand drums (M04a–c, M05): their mic types sit beside the kick’s.
 * Registered here, after the table, so other lessons’ additions merge cleanly. */
import { HAND_DRUM_MIC_TYPES } from '../lessons/shared/handdrums/handMics.ts';
Object.assign(MIC_TYPES, HAND_DRUM_MIC_TYPES);
