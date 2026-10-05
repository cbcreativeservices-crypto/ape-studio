/**
 * Microphones by property for Lab 3's woodwinds. Generic types; the products
 * their sizes come from stay in `examples` and every `prov` — the INTERNAL
 * record (owner ruling 2026-10-04: no brand or model on screen). Merged into
 * MIC_TYPES by data/micTypes.ts. The stand condenser is the shared `sdcCard`.
 *
 *   wwMini     the miniature supercardioid on an instrument clip (DPA's
 *              U-CLIP on a flute's foot or near a reed instrument's bell;
 *              flute/SOURCES.md DPA-CLIPS, soprano_clarinet/SOURCES.md §0.3);
 *   wwHeadset  a miniature on a headset, fixed to the player's head (DPA-
 *              FLUTE: "The headset gives a fixed position").
 * Capsule sizes and reaches: drawing defaults (no source read gives them).
 */
import type { MicType } from '../../../engine/model/types.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const generic = { kind: 'illustrative', reason: 'a textbook pattern for the generic type' } as const;

export const WIND_MIC_TYPES = {
  wwMini: {
    id: 'wwMini',
    label: 'Miniature condenser on an instrument clip, supercardioid',
    short: 'MINI CLIP',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'DPA-MOUNT', quote: 'The 4099 holds a supercardioid directionality and may end up creating an uneven timbre' } },
      { id: 'omni', label: 'omni capsule (textbook shape)', prov: generic },
    ],
    body: { length: placeholder(32, 'a miniature capsule’s length on its gooseneck'), radius: placeholder(4.5, 'a miniature capsule’s radius') },
    power: 'phantom power through its adapter',
    mount: 'clip',
    clip: { reach: placeholder(170, 'the gooseneck’s reach from the clip’s strap to the capsule') },
    examples: [{ model: 'DPA 4099 on the U-CLIP (UC4099); 4099S for saxophones and bass clarinet', fact: 'U-CLIP "fixed around the flute end … Point it towards the keys"; on clarinet / oboe / bassoon "close to the bell, but not necessarily pointed into the bell! Point it toward the keys instead"', src: 'DPA-CLIPS' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, held by a clip made for this instrument — a strap round a flute’s foot, or round a reed instrument near its bell. It moves with the player. Needs phantom power through its adapter.',
  },
  wwHeadset: {
    id: 'wwHeadset',
    label: 'Miniature condenser on a headset, omni',
    short: 'HEADSET',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni', prov: { kind: 'sourced', src: 'DPA-FLUTE', quote: 'The headset gives a fixed position' } }],
    body: { length: placeholder(14, 'a headset capsule’s length'), radius: placeholder(3, 'a headset capsule’s radius') },
    power: 'phantom power through its adapter',
    mount: 'clip',
    clip: { reach: placeholder(165, 'the headset boom’s reach from the ear to the capsule') },
    examples: [{ model: 'DPA headset (d:fine class)', fact: 'a head-worn miniature; DPA: "The headset gives a fixed position"', src: 'DPA-FLUTE' }],
    art: 'gooseneck',
    blurb: 'A tiny omni capsule on a thin boom from a headset over the ear: it stays at one place by the player’s face however they move. Needs phantom power through its adapter. Only one the player has agreed to wear.',
  },
} satisfies Record<string, MicType>;
