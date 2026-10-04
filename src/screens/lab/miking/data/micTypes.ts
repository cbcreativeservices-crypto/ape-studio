/**
 * Microphones BY PROPERTY (lesson L96: "chooses a microphone by properties
 * rather than by brand"). Each type is generic; its SIZE comes from a named
 * model's own documentation, and that model appears only as provenance
 * (owner rule: brand names only in cited facts; mics are drawn as generic
 * types, never a brand's likeness). Pure data.
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
    blurb: 'A purpose-built kick dynamic with a large head and a supercardioid pattern. Needs no power. The guide keeps it off the head and the damping.',
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
    blurb: 'A kick dynamic with a cardioid pattern. Needs no power. Shapes differ between models, so two cardioid kick mics are not interchangeable references.',
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
    blurb: 'A low plate designed to rest INSIDE the drum on a pillow — allowed by its own manual only. Needs phantom power. Leave its grille uncovered.',
  },
  sdc: {
    id: 'sdc',
    label: 'High-SPL condenser (kick)',
    short: 'CONDENSER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'unstated', label: 'open cardioid (the maker’s word; not drawn)', prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Directional pattern Open Cardioid' } },
      { id: 'cardioid', label: 'cardioid (generic ideal)', prov: generic },
      { id: 'omni', label: 'omni (generic ideal)', prov: generic },
    ],
    body: {
      length: { mm: 132, prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Microphone length 132 mm' } },
      radius: { mm: 28.5, prov: { kind: 'sourced', src: 'DPA-4055', quote: 'Microphone diameter 57 mm' } },
    },
    power: 'phantom power (P48, 2.0 mA for the cited example)',
    mount: 'stand',
    examples: [
      { model: 'DPA 4055 (named in the DPA article the lesson cites)', fact: '"Open Cardioid"; Ø 57 × 132 mm; "P48 (Phantom Power)"; THD < 1% at "156dB SPL RMS".', src: 'DPA-4055' },
    ],
    art: 'sdc',
    blurb: 'A high-SPL condenser — DPA’s flatter-response approach. A tonal objective, not proof condensers are better. Needs phantom power.',
  },
};

export function micType(id: string): MicType {
  return MIC_TYPES[id] ?? MIC_TYPES.kickDynCard;
}
