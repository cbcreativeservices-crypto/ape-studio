/**
 * Microphones by property for the Lab 2 cymbal lessons (generic types; the
 * products their sizes come from stay in `examples` and every `prov` — the
 * INTERNAL record; owner ruling 2026-10-04: no brand or model on screen).
 * Merged into MIC_TYPES by data/micTypes.ts (one appended line).
 *
 * `standClip`: the miniature condenser that clamps to a cymbal or hi-hat
 * STAND, under the cymbal (hihat/SOURCES.md DPA-HH: "can be mounted
 * underneath the hi-hat using the universal U-CLIP"). Its capsule size and
 * the gooseneck's reach are drawing defaults. The pencil condenser and the
 * small dynamic are the kit's own types (sdcCard, smallDynCard).
 */
import type { MicType } from '../../../engine/model/types.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

export const CYMBAL_MIC_TYPES = {
  standClip: {
    id: 'standClip',
    label: 'Miniature condenser on a stand clip, supercardioid',
    short: 'STAND CLIP',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: { kind: 'sourced', src: 'DPA-HH', quote: 'the 4099 CORE+ Instrument Microphone (a supercardioid miniature), mounted underneath the hi-hat using the universal U-CLIP' } }],
    body: { length: placeholder(30, 'the miniature capsule’s length'), radius: placeholder(6, 'the miniature capsule’s radius') },
    power: 'phantom power (through its adapter)',
    mount: 'clip',
    clip: { reach: placeholder(200, 'the clip’s gooseneck reach from the stand to the capsule') },
    examples: [{ model: 'DPA 4099 on the U-CLIP', fact: 'supercardioid miniature; the hi-hat page: "can be mounted underneath the hi-hat using the universal U-CLIP Universal Microphone Clip".', src: 'DPA-HH' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, clamped to the stand under the cymbal: out of the stick’s path. Needs phantom power. Check the clip holds, and keep the cable away from the pedal and the player’s feet.',
  },
} satisfies Record<string, MicType>;
