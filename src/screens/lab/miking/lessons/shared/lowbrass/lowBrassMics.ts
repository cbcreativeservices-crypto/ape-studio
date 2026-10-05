/**
 * Microphones BY PROPERTY for Lab 3's low / coiled brass (horn, tuba,
 * euphonium). Generic types; the products and documents behind them stay in
 * `examples` and every `prov` — the INTERNAL record (owner ruling
 * 2026-10-04: no brand or model name on screen). Merged into MIC_TYPES by
 * data/micTypes.ts (one appended line).
 *
 * The small dynamic (`smallDynCard`) and the pencil condenser (`sdcCard`)
 * are the shared types. New here:
 *   lbRibbon  a side-address ribbon, figure-8 — the lessons name a ribbon
 *             (tuba, euphonium: "follow its airflow … guidance") and a
 *             figure-8 front spot above the horn (french_horn/SOURCES.md
 *             IHS-ROSTRUP). Its body size is a drawing default.
 *   lbLdc     a side-address large-diaphragm cardioid condenser on a stand —
 *             the horn session's spot "from beneath the horn". Its size is
 *             the kit lessons' side-address body (a drawing default).
 */
import type { MicType } from '../../../engine/model/types.ts';

const placeholder = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;

export const LOW_BRASS_MIC_TYPES = {
  lbRibbon: {
    id: 'lbRibbon',
    label: 'Ribbon, figure-8, side-address',
    short: 'RIBBON',
    transducer: 'ribbon',
    address: 'side',
    patterns: [{ id: 'figure8', label: 'figure-8', prov: { kind: 'sourced', src: 'IHS-ROSTRUP', quote: 'One figure-8 microphone side-rejecting the piano sound from above the horn' } }],
    body: { length: placeholder(160, 'a ribbon mic’s body length'), radius: placeholder(28, 'a ribbon mic’s body radius'), width: placeholder(160, 'a ribbon mic’s long extent') },
    power: 'none needed for a passive ribbon — check the model’s own manual before sending phantom power',
    mount: 'stand',
    examples: [{ model: 'a figure-8 spot over the horn (session account); ribbons on solo brass (maker’s brass page)', fact: 'figure-8: equal front and back, deep nulls at the sides; the body size is a drawing default', src: 'IHS-ROSTRUP' }],
    art: 'sideLdc',
    blurb: 'A ribbon hears equally from its front and back and rejects its SIDES — aim a side at what you do not want. Ribbons are delicate: keep them out of a bell’s blast of air and follow the maker’s rules on phantom power.',
  },
  lbLdc: {
    id: 'lbLdc',
    label: 'Large-diaphragm condenser, side-address, cardioid',
    short: 'LARGE COND',
    transducer: 'condenser',
    address: 'side',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'IHS-ROSTRUP', quote: 'a vacuum tube large diaphragm cardioid from beneath the horn' } },
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
    ],
    body: { length: placeholder(190, 'a large side-address condenser’s depth on its mount'), radius: placeholder(30, 'its body radius'), width: placeholder(190, 'its long, upright extent') },
    power: 'phantom power (48 V) — or its own supply for a valve model',
    mount: 'stand',
    examples: [{ model: 'a large-diaphragm cardioid spot beneath the horn (session account)', fact: 'cardioid, side-address; the size is the kit lessons’ side-address drawing default', src: 'IHS-ROSTRUP' }],
    art: 'sideLdc',
    blurb: 'A larger condenser that hears out of the FACE of its body: aim the face at the instrument. Needs phantom power (some need their own supply). A larger diaphragm is not a promise of a rounder sound.',
  },
} satisfies Record<string, MicType>;
