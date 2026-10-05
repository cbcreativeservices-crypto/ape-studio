/**
 * Microphones by property for Lab 4's plucked strings (the guitar family).
 * Generic types; the products their sizes come from stay in `examples` and
 * every `prov` — the INTERNAL record (owner ruling 2026-10-04: no brand or
 * model name on screen). Merged into MIC_TYPES by micTypes.ts.
 *
 * `sdcCard` and `instDynCard` are the speaker module's types (miking-w5),
 * defined ONCE in micTypes.ts (with the purpose-drawn instrument dynamic,
 * art 'instDynamic'); the guitar lessons use those. `clipCond` is new: the miniature supercardioid
 * condenser on a guitar clip (acoustic_guitar/SOURCES.md DPA-MOUNT; its
 * capsule size and the gooseneck's reach are drawing defaults).
 */
import type { MicType } from '../engine/model/types.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

export const STRINGS_MIC_TYPES = {
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
