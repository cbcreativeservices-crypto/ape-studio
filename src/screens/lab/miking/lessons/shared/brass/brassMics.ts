/**
 * Microphones by property for Lab 3's brass (generic types; the products
 * their sizes come from stay in `examples` and every `prov` — the INTERNAL
 * record; owner ruling 2026-10-04: no brand or model name on screen).
 *
 * The stand mics are the shared `instDynCard` (a cardioid instrument
 * dynamic) and `sdcCard` (a pencil condenser), defined once in
 * micTypes.ts. `brClip` is new: a miniature supercardioid condenser on a
 * gooseneck held by a clip on the BELL RIM (trumpet/SOURCES.md DPA-MOUNT:
 * "position it between the center position and the bell's edge"). Its
 * length and the gooseneck's 140 mm reach are the retailer listing's
 * (SOURCES_SHARED.md MKT-4099); the capsule's diameter is a drawing default.
 * Merged into MIC_TYPES by micTypes.ts.
 */
import type { MicType } from '../../../engine/model/types.ts';

const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;
const unk = (needed: string) => ({ kind: 'unknown', needed }) as const;

export const BRASS_MIC_TYPES = {
  brClip: {
    id: 'brClip',
    label: 'Miniature condenser on a bell clip, supercardioid',
    short: 'BELL CLIP',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('MKT-4099', 'Directional Pattern: "Supercardioid" (retailer listing)') }],
    body: {
      length: { mm: 50, prov: src('MKT-4099', 'Microphone Length: "1.97" (50mm)" (retailer listing)') },
      radius: { mm: 9, prov: unk('the capsule’s diameter (the listing’s 5.7 mm looks like the gooseneck; drawing default Ø 18 mm)'), placeholder: true },
    },
    power: 'phantom power through its adapter',
    mount: 'clip',
    // The gooseneck is the clip's reach from the bell rim to the capsule.
    clip: { reach: { mm: 140, prov: src('MKT-4099', 'Gooseneck Length: "5.5" (140mm)" (retailer listing)') } },
    examples: [{ model: 'DPA 4099 with its brass clip', fact: 'DPA-MOUNT: "do not point the microphone directly into the center of the bell, but position it between the center position and the bell’s edge. All types of mutes can be used together with the 4099."; low-cut 80 Hz in the wireless adapter.', src: 'DPA-MOUNT' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, clipped to the bell rim: it moves with the horn, so the distance holds as the player turns. Needs phantom power through its adapter. Only a clip made for this bell, with the player’s agreement.',
  },
} satisfies Record<string, MicType>;
