/**
 * CONCERT DRUMS — an EXTENSION beside the shared drum family (drumSpec.ts is
 * used as committed in 4a63fb8a and not modified; builder note 2026-10-05).
 * The specs Lab 1's concert lessons draw with the family's art: the concert
 * snare (M07b) and the concert bass drum (M07a). Pure; the tests read it.
 *
 * SIZES are sourced (Yamaha concert percussion catalogue, YMH-CPCAT:
 * concert_snare/SOURCES.md, concert_bass_drum/SOURCES.md). Everything no
 * source gives is a DRAWING DEFAULT (`placeholder: true`), drawn, never a
 * readout reference, and listed in the lesson's unknowns.
 */
import type { Dim, Provenance } from '../../../engine/model/types.ts';
import type { DrumSpec } from './drumSpec.ts';

const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const trial = (s: string, note: string): Provenance => ({ kind: 'trial', src: s, note });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/** The 14 × 6-1/2 in concert snare (YMH-CPCAT CSM 1465): 10 lugs, a 2.3 mm
 *  triple-flange steel rim, 14-strand brass cable snares. */
export const CONCERT_SNARE_14x65: DrumSpec = {
  id: 'concertSnare',
  name: '14 × 6½ in concert snare drum',
  d: { mm: 14 * IN, prov: src('YMH-CPCAT', 'CSM 1465 Size: 14"×6 1/2"') },
  depth: { mm: 6.5 * IN, prov: trial('YMH-CPCAT', '6½ in nominal depth; heads drawn as flat planes at the shell ends') },
  tShell: dd(6, 'concert snare shell thickness'),
  plies: 6,
  hoop: {
    kind: 'triple',
    t: { mm: 2.3, prov: src('YMH-CPCAT', '2.3 mm steel, triple-flange') },
    above: dd(10, 'hoop height above the head'),
    below: dd(14, 'how far a triple-flange hoop runs down past the head'),
    gap: dd(3, 'gap between the shell and the hoop'),
  },
  rods: { n: { mm: 10, prov: src('YMH-CPCAT', 'the 14-inch models feature a 10-lug design') }, phaseDeg: dd(18, 'tension-rod phase on the concert snare') },
  lug: { len: dd(30, 'lug length along the shell'), out: dd(24, 'how far a lug stands off the shell'), inset: dd(8, 'lug distance from the shell edge') },
  batter: 'coated',
  reso: 'snareSide',
  wires: {
    strands: { mm: 14, prov: src('YMH-CPCAT', '0.6 mm brass cable; 14 strand') },
    width: dd(75, 'snare set width'),
    length: dd(320, 'snare set length (0.9 × the diameter)'),
    strainerDeg: dd(180, 'which side the strainer (throw-off) sits on'),
    buttDeg: dd(0, 'which side the butt plate sits on'),
    dropOff: dd(6, 'how far released snares hang below the head'),
  },
};

/** The 36 × 16 in concert bass drum (YMH-CPCAT CB 636). Hoop material, rod
 *  count and every hardware size are drawing defaults. */
export const CONCERT_BD_36x16 = {
  id: 'concertBassDrum',
  name: '36 × 16 in concert bass drum',
  d: { mm: 36 * IN, prov: src('YMH-CPCAT', 'CB 636 "36"16"" (36 × 16 in)') } as Dim,
  depth: { mm: 16 * IN, prov: trial('YMH-CPCAT', '16 in nominal depth; heads drawn as flat planes at the shell ends') } as Dim,
  tShell: dd(8, 'concert bass drum shell thickness'),
  plies: 8,
  hoop: { t: dd(14, 'hoop thickness (material unknown: drawn as wood)'), h: dd(32, 'hoop height (axial width)'), gap: dd(3, 'gap between the shell and the hoop'), inset: dd(8, 'how far the hoop stands past the head plane') },
  rods: { n: dd(12, 'tension rods per head'), phaseDeg: dd(15, 'tension-rod phase') },
} as const;

/** The drawing defaults this extension adds (for the lessons' unknowns). */
export const CONCERT_DRAWING_DEFAULTS: readonly string[] = [
  'concert snare shell thickness, hoop height and skirt, lug size, rod phase, snare set size and strainer side',
  'concert bass drum shell thickness, hoop material and size, tension-rod count and phase',
];
