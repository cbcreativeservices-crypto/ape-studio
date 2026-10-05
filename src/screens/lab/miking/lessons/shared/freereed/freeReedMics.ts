/**
 * Microphones by property for Lab 3's free reeds (A10 harmonica, A11
 * accordion). Generic types; the products their sizes come from stay in
 * `examples` and every `prov` — the INTERNAL record (owner ruling
 * 2026-10-04: no brand or model name on screen). Merged into MIC_TYPES by
 * data/micTypes.ts.
 *
 *   harpBullet  the hand-held harp mic: a high-impedance OMNI dynamic in a
 *               bullet body, cupped with the harmonica (its size SOURCED).
 *               It is never put on a stand in the lab: no starting point
 *               names it, so the placement scene does not offer it.
 *   accMini     a miniature hypercardioid condenser on a gooseneck, mounted
 *               on the accordion's bass side (AKG-416) — a mount, shown in
 *               words and drawings, never dragged.
 */
import type { MicType } from '../../../engine/model/types.ts';
import { BULLET } from './freeReedSpec.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });

export const FREE_REED_MIC_TYPES = {
  harpBullet: {
    id: 'harpBullet',
    label: 'Hand-held harp mic, omni dynamic (high impedance)',
    short: 'HARP MIC',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni — no rear null', prov: BULLET.pattern }],
    body: { length: BULLET.l, radius: { mm: BULLET.d.mm / 2, prov: BULLET.d.prov } },
    power: 'none (a dynamic) — with a volume knob on the body and an attached cable for a high-impedance amp input',
    mount: 'stand',
    examples: [{ model: 'Shure 520DX', fact: 'omnidirectional dynamic, high impedance, attached 1/4-in cable; 63 mm × 82.6 mm, 737 g', src: 'S-520DX' }],
    art: 'kickDynamic',
    blurb: 'A rounded bullet body made to be cupped with the harmonica: the hands and the mic make one chamber. It is omni, so there is no rear null to aim at a wedge, and it is made for a high-impedance amp input — not a standard desk mic input.',
  },
  accMini: {
    id: 'accMini',
    label: 'Miniature condenser on a gooseneck, hypercardioid',
    short: 'MINI GOOSENECK',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'hypercardioid', label: 'hypercardioid', prov: { kind: 'sourced', src: 'AKG-416', quote: 'The C 416III is a miniature hypercardioid condenser microphone' } }],
    body: { length: placeholder(25, 'the miniature capsule’s length'), radius: placeholder(5, 'the miniature capsule’s radius') },
    power: 'phantom power (through its own adapter or bodypack)',
    mount: 'clip',
    clip: { reach: placeholder(150, 'the gooseneck’s reach from its mount to the capsule') },
    examples: [{ model: 'AKG C 416III', fact: 'miniature hypercardioid condenser; mounted on the bass side, aimed at a sound hole', src: 'AKG-416' }],
    art: 'gooseneck',
    blurb: 'A tiny condenser on a short gooseneck, held by a mount made for the accordion: it moves with the side it is on, so the distance to that side stays the same. Needs phantom power. Only hardware made for the instrument, and only with the player’s agreement.',
  },
} satisfies Record<string, MicType>;
