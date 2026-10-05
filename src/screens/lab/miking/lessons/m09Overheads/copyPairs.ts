/**
 * M09 — the words of the TWO OVERHEADS page (the snare-distance aid and the
 * stereo pairs). Starting points; no names of people, makers or sources
 * (owner ruling 2026-10-04). Walked by test/mikingKitLessons.test.ts.
 */
import type { PairId } from './pairs.ts';

export const TWO_WORDS = {
  title: 'Equal snare distance',
  looking: 'The floor-tom method · a mic over the snare and one beside the floor tom',
  prompt: 'Move a mic (POSITION) so the snare distances differ, then bring them level again. Then set SOURCE to the kick.',
  reveal: 'Matching the two snare distances lines up the snare only. From the kick the two mics are different distances away — so the kick still arrives at two times.',
  pairsTitle: 'Stereo pairs',
  pairsPrompt: 'Step through PAIR and read each one’s spacing, angle and the time difference it gives each SOURCE.',
  shoulderWarn: 'In this drawing the shoulder method’s second mic lands inside the sticks’ reach, near the player’s right shoulder. The 81 cm is a described example — it is never a reason to crowd the player. Move the mic clear, then re-measure.',
  xyWide: 'Wider than about 135°, the capsules start to aim past the kit; lowering the pair, or a smaller angle, gives a more direct sound.',
  ms: 'A Mid mic faces the kit; a figure-8 Side mic sits with it, its two lobes across the kit. A matrix (in the desk or software, not a rewired cable) makes left = Mid + Side and right = Mid − Side, so the width is set by the Side’s level. Summed to mono, the Side cancels and only the Mid is left — a mono-safe pair, as long as the decode is right.',
  comb: 'What you just saw: sound reaches two mics at different times. Summed, the later copy cancels where it is half a period late — comb-filter notches. Polarity flips the sign: it moves the notches, it does not remove the delay. 0 dB on the graph is the two arrivals in step.',
} as const;

export const PAIRS_WORDS: Record<PairId, { label: string; short: string; blurb: string; how: string; tradeoff: string; mono: string }> = {
  xy: {
    label: 'X/Y coincident pair',
    short: 'X/Y',
    blurb: 'Two directional capsules together, angled apart without touching — about 90° is a common start.',
    how: 'Two cardioid capsules at the same point — as close as they go without touching — angled apart, here over the snare. About 90° is a common start; up to about 135° is used. Their bisector aims at the snare.',
    tradeoff: 'A stable, fairly compact image. Width comes from the angle, not from time differences.',
    mono: 'The pair hears each source at the same moment, so it adds no time difference of its own — it does not fix differences with the close mics.',
  },
  ortf: {
    label: 'ORTF near-coincident pair',
    short: 'ORTF',
    blurb: 'Two cardioids about 17 cm apart and 110° apart, on a stereo bar.',
    how: 'Two cardioid capsules about 17 cm (7 in) apart, angled 110° apart, on a stereo bar over the snare.',
    tradeoff: 'More width and a little time difference compared with X/Y — a source off to one side reaches one capsule up to about half a millisecond first.',
    mono: 'Small time differences can colour the mono sum a little. Listen to this kit in this room rather than trusting the textbook geometry.',
  },
  spaced: {
    label: 'Spaced pair',
    short: 'SPACED',
    blurb: 'Two separate mics across the kit, each the same distance from the snare — about 1.2 m (4 ft) is a starting point.',
    how: 'Two mics placed separately across the kit, pointing straight down, each about 1.2 m (4 ft) from the snare’s centre, so the snare arrives at both together.',
    tradeoff: 'A wide image and more control of each side. Every source but the snare reaches the two mics at different times.',
    mono: 'The arrival differences can thin or colour the mono sum. Check the distances for the loud sources, and listen in mono.',
  },
  floortom: {
    label: 'The floor-tom method',
    short: 'FLOOR-TOM',
    blurb: 'A mic about 1 m over the snare and a side mic just beyond the floor tom, both the same distance from the snare.',
    how: 'One mic about 1 m (40 in) over the snare, aimed at it; one beside the floor tom, about 15 cm above its rim and just beyond it, aimed across at the snare — both the same distance from the snare’s centre. A close kick mic, and sometimes a close snare, complete the method; three or four mics in all.',
    tradeoff: 'A whole-kit picture from few mics, deliberately uneven: the side mic is not a second high overhead. Pan the two to taste — partway and wider is one idea, nothing is fixed.',
    mono: 'The snare is lined up; the kick, toms and cymbals are not. Listen in mono and to each mic alone.',
  },
  shoulder: {
    label: 'The shoulder method',
    short: 'SHOULDER',
    blurb: 'One mic about 81 cm (32 in) over the snare; another near the player’s right shoulder, also 81 cm from the snare and the same distance from the kick.',
    how: 'One mic 81 cm (32 in) straight above the snare’s centre, aimed down; the other near the drummer’s right shoulder, also 81 cm from the snare’s centre, aimed at the snare, placed so both mics are the same distance from the kick.',
    tradeoff: 'It references both the snare and the kick — still not every drum and cymbal, and the second mic sits close to the player.',
    mono: 'Snare and kick are lined up; the toms and cymbals are not. Listen in mono.',
  },
  ms: {
    label: 'Mid-Side pair',
    short: 'MID-SIDE',
    blurb: 'A Mid mic facing the kit with a figure-8 Side mic at nearly the same point, decoded to left and right.',
    how: 'A cardioid Mid capsule aimed down at the kit, and a figure-8 Side capsule with it, its lobes across the kit. A matrix decodes them to left and right.',
    tradeoff: 'Width you can set after the fact with the Side’s level; the Side can bring up the room. Raw Mid and Side are not left and right until they are decoded.',
    mono: 'Decoded correctly, the Side cancels in mono and the Mid is left. Check the matrix and the wiring.',
  },
};
