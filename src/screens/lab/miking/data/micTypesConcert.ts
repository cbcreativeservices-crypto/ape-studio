/**
 * Microphones BY PROPERTY for Lab 1's concert lessons (M06 timpani, M07a
 * concert bass drum, M07b concert snare, M08 headed tambourine). Merged into
 * MIC_TYPES (micTypes.ts); a separate file so lessons built in parallel do
 * not collide. Same rules as micTypes.ts: generic types on screen; the
 * products a size was read from live only in `examples` / `prov` (the
 * internal record, never shown — owner ruling 2026-10-04).
 *
 * Source keys: docs/labs/miking/snare/SOURCES.md (S-SM57-UG), overheads/
 * GEOMETRY_PROPOSAL.md §5 (the pencil condenser's length, AX-DPE8), and the
 * lessons' own words (timpani L35: "A cardioid condenser is well documented
 * for spots"; tambourine L32: "either a small- or large-diaphragm condenser …
 * a ribbon or dynamic mic").
 *
 * NOTE for the lead: M02 (kit snare) may add its own SM57-type entry; the
 * two can merge into one id once both branches land.
 */
import type { MicType } from '../engine/model/types.ts';

const generic = { kind: 'sourced', src: 'WP-MIC', quote: 'a superposition of an omnidirectional (pressure) and a figure-8 (pressure gradient)' } as const;

export const CONCERT_MIC_TYPES: Record<string, MicType> = {
  orchSdc: {
    id: 'orchSdc',
    label: 'Small condenser, cardioid (pencil type)',
    short: 'SMALL COND.',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'cardioid', label: 'cardioid', prov: { kind: 'sourced', src: 'LESSON-TIMP', quote: 'A cardioid condenser is well documented for spots in both small orchestras and amplified shows.' } },
      { id: 'omni', label: 'omni (textbook shape)', prov: generic },
    ],
    body: {
      length: { mm: 104, prov: { kind: 'sourced', src: 'AX-DPE8', quote: 'SCX1 length "104 mm / 4.1 in" (overheads/GEOMETRY_PROPOSAL.md §5)' } },
      radius: { mm: 10.5, prov: { kind: 'unknown', needed: 'a pencil condenser body diameter (drawing default Ø 21 mm, overheads proposal §5)' }, placeholder: true },
    },
    power: 'phantom power from the desk',
    mount: 'stand',
    examples: [{ model: 'Audix SCX1 (length only)', fact: '"104 mm / 4.1 in"; the diameter is a drawing default (Ø 21 mm).', src: 'AX-DPE8' }],
    art: 'sdc',
    blurb: 'A small, light condenser with a cardioid pattern — a common choice for an orchestral spot. Needs phantom power. Keep it, its stand and its cable out of the player’s reach.',
  },
};
