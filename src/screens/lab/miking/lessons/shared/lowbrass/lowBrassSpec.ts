/**
 * THE LOW / COILED BRASS FAMILY — the technical truth (charter §2 layer 1)
 * for Lab 3's turned-bell lessons: A03 French horn, A04a tuba, A04b
 * euphonium. Keys point into docs/labs/miking/{french_horn,tuba,euphonium}/
 * SOURCES.md and trumpet/SOURCES.md §0 (the Lab 3 general keys). Owner
 * ruling 2026-10-04: every `prov`, `src` and quote is the INTERNAL record —
 * the learner sees starting points only.
 *
 * Pure data, no React (node-testable).
 *
 * What is sourced and what is a DRAWING DEFAULT (never a published figure):
 *   • horn: 4 rotary valves, F/B♭ double, ≈ 3.75 m of tube on the F side —
 *     sourced; the BELL DIAMETER IS NOT PUBLISHED (the maker prints a size
 *     letter only): 310 mm is a drawing default (correction LB-01);
 *   • tuba: bell Ø 443 mm, 4 top pistons — sourced; the body height (900) is
 *     a drawing default;
 *   • euphonium: bell Ø 300 mm, 3 top + 1 side valve, compensating —
 *     sourced; the body height (650) is a drawing default.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });

export type LowBrassId = 'horn' | 'tuba' | 'euph';
/** Where the bell points while it is played: the horn's to the rear; a tuba
 *  or euphonium up (the usual concert form) or to the front. */
export type Orient = 'back' | 'up' | 'front';

export type LowBrassSpec = {
  id: LowBrassId;
  name: string;
  /** The bell's rim diameter. */
  bell: Dim;
  /** Length of tube, as a LABEL only (never a drawn length). */
  tube: { m: number; words: string; prov: Provenance } | null;
  valves: { n: number; kind: 'rotary' | 'piston'; words: string; prov: Provenance };
  /** The lowest note in the maker's table — context only, never a filter
   *  setting (the lessons' own warning). */
  lowest: { name: string; hz: number; prov: Provenance } | null;
  /** The orientations this lesson draws. */
  orients: readonly Orient[];
  /** Height of the instrument from its lowest bow to the bell rim. */
  bodyH: Dim;
};

export const HORN: LowBrassSpec = {
  id: 'horn',
  name: 'double horn in F/B♭',
  bell: placeholder(310, 'the horn’s bell diameter (the maker prints a size letter only, “M”)'),
  tube: { m: 3.75, words: 'about 3.75 m of tube on the F side', prov: src('PL-2010', 'The common length of the F-tuned horn is approximately 3.75 m.') },
  valves: { n: 4, kind: 'rotary', words: 'four rotary valves (a double horn in F and B♭)', prov: src('Y-YHR567', 'F/Bb; Number of Valves 4; Bell Type Fixed') },
  lowest: { name: 'B1', hz: 61.74, prov: src('DPA-TABLE', 'French horn | H₁ (61.7 Hz) / F² (698 Hz)') },
  orients: ['back'],
  bodyH: placeholder(560, 'the horn’s overall height as held (coil and bell)'),
};

export const TUBA: LowBrassSpec = {
  id: 'tuba',
  name: 'B♭ tuba, four top valves',
  bell: { mm: 443, prov: src('Y-YBB321', '443mm (17 1/2")') },
  tube: { m: 5.5, words: 'about 5.5 m of tube in B♭ (shorter in C, E♭ or F)', prov: src('Y-HUB-TUBA', 'B♭ "18 feet (5.5 meters)", C "16 feet (4.9 meters)", E♭ "13 feet (4 meters)", F "12 feet (3.7 meters)"') },
  valves: { n: 4, kind: 'piston', words: 'four top-action piston valves', prov: src('Y-YBB321', '4 top pistons') },
  lowest: { name: 'E♭1', hz: 38.89, prov: src('DPA-TABLE', 'Tuba | Eb1 (39 Hz) / G¹ (392 Hz)') },
  orients: ['up', 'front'],
  bodyH: placeholder(900, 'the tuba’s height from its lowest bow to the bell rim'),
};

export const EUPH: LowBrassSpec = {
  id: 'euph',
  name: 'B♭ euphonium, compensating, four valves',
  bell: { mm: 300, prov: src('Y-YEP642', '300mm (11 4/5")') },
  tube: null,
  valves: { n: 4, kind: 'piston', words: 'three valves on top and a fourth at the side, compensating', prov: src('Y-YEP642', '3 top + 1 side, compensating') },
  lowest: null,
  orients: ['up', 'front'],
  bodyH: placeholder(650, 'the euphonium’s height from its lowest bow to the bell rim'),
};

/** Speed of sound used by the lab (the Kick's and every Lab's: 343 m/s). */
export const C_SOUND = 343;
