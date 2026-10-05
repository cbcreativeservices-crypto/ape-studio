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

const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;

export const MIC_TYPES: Record<string, MicType> = {
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
};

export function micType(id: string): MicType {
  return MIC_TYPES[id] ?? MIC_TYPES.kickDynCard;
}
