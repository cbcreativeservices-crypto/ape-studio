/**
 * E05 CHOIRS, CHORUSES, A CAPPELLA — where things are, frame S. Research:
 * docs/labs/miking/choir/ (SOURCES.md, GEOMETRY_PROPOSAL.md); the 3:1
 * register lead_vocal/SOURCES.md §0.2; arrays full_orchestra/SOURCES.md §A.
 * Corrections E5-* in CORRECTIONS_LOG.md.
 *
 *   RISERS  a choir of 38 on a floor row and three 8 in steps (seatingVoices
 *           'choir.risers', the risers WENGER-SIG's). AREA MICS: 2–4 ft in
 *           front of the first row, 1–3 ft above its heads, aimed at the
 *           middle rows (S-LIVE), one for each 6–9 ft of width (S-REC) — two
 *           mics 9 ft apart, which keeps 3:1 at the drawn distance; three at
 *           6 ft (the church spacing, S-CHURCH) do not (D-CH1, shown as a
 *           readout, never chosen for you). MAIN PAIR: a few feet in front
 *           and above (S-REC "a few feet"), or farther where the choir fills
 *           a 17 cm pair's 95° recording angle (DERIVED). SPOTS: one per
 *           section under the pair (AKG-C414), farther than a solo vocal mic
 *           and above mouth level (the lesson).
 *   ARC     a twelve-voice chamber choir on a shallow arc ('choir.arc'): ONE
 *           area mic 2–3 ft in front, aimed at the back row (S-CHURCH; one
 *           mic per 15–20 voices, S-LIVE), or a pair.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimOf, add, dirOf, dist, mul, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, seatsOf, type Seat, type Seating } from '../shared/ensemble/seating.ts';
import { lipOf, VOX } from '../shared/ensemble/seatingVoices.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import { threeToOneMics } from '../shared/ensemble/voiceGroup.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E05_SEATS = { risers: seatingOf('choir.risers'), arc: seatingOf('choir.arc') } as const;
const RS = E05_SEATS.risers;
const AR = E05_SEATS.arc;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });
const mean = (pts: readonly Vec3[]) => mul(pts.reduce((a, b) => add(a, b), v3(0, 0, 0)), 1 / Math.max(1, pts.length));

/** S-LIVE choral row (mm, conv.): "1 to 3 feet above and 2 to 4 feet in front of the first row". */
export const LIVE = { above: { min: 304.8, max: 914.4 }, ahead: { min: 609.6, max: 1219.2 } } as const;
/** S-CHURCH: "2-3 feet in front of the choir … aimed toward the back row". */
export const CHURCH = { ahead: { min: 609.6, max: 914.4 } } as const;
/** S-REC: one mic "for each lateral section of approximately 6 to 9 feet". */
export const SECTION_W = { min: 1828.8, max: 2743.2 } as const;
/** The front row's heads (adults on the floor). */
const HEADS = VOX.adult.head;
const above = (h: number) => -(HEADS + h);

const rowOf = (q: Seat) => Math.round(-q.p.y / VOX.riser.rise);
const lipsWhere = (s: Seating, f: (q: Seat) => boolean) => s.seats.filter((q) => q.kind === 'chorister' && f(q)).map(lipOf);

/* ── the choir on risers ── */
/** The middle rows' mouths on each half (rows 1 and 2): what the area mics aim at. */
const MID_L = mean(lipsWhere(RS, (q) => q.p.x < 0 && (rowOf(q) === 1 || rowOf(q) === 2)));
const MID_R = mean(lipsWhere(RS, (q) => q.p.x > 0 && (rowOf(q) === 1 || rowOf(q) === 2)));
/** Two area mics 9 ft apart (the wide end of S-REC's 6–9 ft), 650 mm in front, 330 mm above the front heads. */
export const AREA_X = SECTION_W.max / 2;
export const AREA_L = toward(v3(-AREA_X, above(330), 650), MID_L);
export const AREA_R = toward(v3(AREA_X, above(330), 650), MID_R);
/** Three area mics 6 ft apart (S-CHURCH's "adjacent mics about 4–6 feet apart"): D-CH1. */
const MID_C = mean(lipsWhere(RS, (q) => Math.abs(q.p.x) < 900 && (rowOf(q) === 1 || rowOf(q) === 2)));
export const AREA3 = [toward(v3(-SECTION_W.min, above(330), 650), MID_L), toward(v3(0, above(330), 650), MID_C), toward(v3(SECTION_W.min, above(330), 650), MID_R)];

const nearestTo = (s: Seating, p: Vec3) => [...s.seats.filter((q) => q.kind === 'chorister')].sort((a, b) => dist(lipOf(a), p) - dist(lipOf(b), p))[0];
/** The 3:1 readouts the lesson states: two mics 9 ft apart pass; three at 6 ft do not. */
export const E05_31 = {
  two: threeToOneMics(AREA_L.p, nearestTo(RS, AREA_L.p), AREA_R.p, nearestTo(RS, AREA_R.p)),
  three: threeToOneMics(AREA3[0].p, nearestTo(RS, AREA3[0].p), AREA3[1].p, nearestTo(RS, AREA3[1].p)),
};

/** The main pair: near (a few feet in front and above) and farther (the choir fills 95°). */
export const PAIR_NEAR = v3(0, above(600), 850);
export const PAIR_FAR = v3(0, above(900), 1700);
const CENTRE = mean(lipsWhere(RS, () => true));

/** Section spots (AKG-C414: one each for S, A, T, B) — in front, above mouth level. */
const secCentre = (s: Seating, id: string) => mean(seatsOf(s, id).map(lipOf));
const SPOT = {
  sop: toward(v3(-1650, above(450), 950), secCentre(RS, 'sop')),
  alt: toward(v3(1650, above(450), 950), secCentre(RS, 'alt')),
  ten: toward(v3(-650, above(850), 950), secCentre(RS, 'ten')),
  bas: toward(v3(650, above(850), 950), secCentre(RS, 'bas')),
};
export const SPOT_SOP = SPOT.sop;
const SOP_C = secCentre(RS, 'sop');
const SOP_DIR = unit(sub(SPOT.sop.p, SOP_C));

/* ── the chamber choir on an arc ── */
const BACK_A = mean(lipsWhere(AR, (q) => q.p.z < -400));
export const ONE_ARC = toward(v3(0, above(280), 760), BACK_A);
export const ARC_PAIR = v3(0, above(700), 1300);

export const E05_SURFACES = [targetSurface('t.sop', sectionPartId('risers', 'sop'), 'the sopranos', SOP_C, SOP_DIR)];
const PAIR = ['arrCard', 'arrOmni', 'arrFig8'];

export const E05_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'ch.live',
    label: 'In front of the first row, a little above the heads',
    band: 'Try each area mic about 0.6–1.2 m (2–4 ft) in front of the first row and 0.3–0.9 m (1–3 ft) above their heads, aimed at the middle rows — one mic for each 1.8–2.7 m (6–9 ft) of the choir’s width.',
    kind: 'sourced',
    src: 'S-LIVE',
    quote: 'Choral groups: 1 to 3 feet above and 2 to 4 feet in front of the first row of the choir, aimed toward the middle row(s) of the choir, approximately 1 microphone per 15-20 people (S-LIVE); one microphone for each lateral section of approximately 6 to 9 feet (S-REC p.6)',
    ref: 'front',
    d: [LIVE.ahead.min, LIVE.ahead.max],
    box: { min: v3(-AREA_X - 700, above(LIVE.above.max), LIVE.ahead.min), max: v3(-AREA_X + 700, above(LIVE.above.min), LIVE.ahead.max) },
    start: AREA_L,
    variants: ['risers'],
    micTypeIds: ['arrCard'],
    tendency: 'The section’s blend, with a little of the room; closer and lower favours the first row, higher and farther evens the rows out.',
    checks: ['The front row against the back rows', 'The 3:1 spacing to the next mic, and the sum in mono', 'Where the monitor sits against the pattern'],
  }),
  mainZone({
    id: 'ch.pair',
    label: 'A main pair a few feet in front, above the heads',
    band: 'Try the pair a few feet in front of the first row and above their heads — about 0.6–2.2 m (2–7 ft) out, 0.3–1.3 m (1–4 ft) above the heads — centred, aimed at the middle and back rows. Then move it toward or away and listen.',
    kind: 'trial',
    src: 'S-REC',
    quote: 'a few feet in front of, and a few feet above, the heads of the first row. It should be centered in front of the choir and aimed at the last row (S-REC p.6, one mic); the pair is moved toward or away while listening (the lesson L14)',
    bandProv: ill('"a few feet": 0.6–2.2 m out and 0.3–1.3 m above the heads is the lab’s drawing, the near end S-LIVE’s choral band; the far end where the choir fills a 17 cm pair’s 95° recording angle (DERIVED from the drawn width)'),
    ref: 'front',
    d: [LIVE.ahead.min, 2200],
    box: { min: v3(-700, above(1300), LIVE.ahead.min), max: v3(700, above(LIVE.above.min), 2200) },
    start: toward(PAIR_NEAR, CENTRE),
    variants: ['risers'],
    micTypeIds: PAIR,
    tendency: 'The whole choir as one sound with the room: nearer gives more of the front rows and diction; farther, more blend and room.',
    checks: ['Every section, quiet and loud', 'The outer sections against the centre', 'The sum in mono'],
  }),
  targetZone({
    id: 'ch.spot',
    label: 'A spot on the sopranos, under the pair',
    band: 'For a weak section only: a cardioid about 1–2 m (3–6 ft) from the section’s middle, in front and above their mouths — farther than a solo vocal mic — raised under the pair until the line is just clear.',
    src: 'AKG-C414',
    quote: 'one stereo microphone plus one spot microphone each for the soprano, alto, tenor, and bass sections (§4.6.2); spots farther from the singers than a solo vocal microphone and above mouth level (the lesson L16)',
    kind: 'trial',
    surface: E05_SURFACES[0],
    side: v3(1, 0, 0),
    d: [900, 2000],
    coneMax: 40,
    aimMax: 25,
    start: SPOT.sop,
    variants: ['risers'],
    micTypeIds: ['arrCard'],
    tendency: 'The section clearer and a little closer; too much and the choir turns into separate soloists, or the image pulls toward the spot.',
    checks: ['It alone, then under the pair', 'The image as it comes up', 'The sum in mono'],
    prov: ill('1–2 m from the section’s middle, in front and above: the lab’s drawing of "farther than a solo vocal mic, above mouth level"'),
  }),
  mainZone({
    id: 'ch.church',
    label: 'One mic 2–3 ft in front, aimed at the back row',
    band: 'For a small choir: one cardioid about 0.6–0.9 m (2–3 ft) in front of the first row, a little above the singers, aimed at the back row — one mic can cover 15–20 voices.',
    kind: 'sourced',
    src: 'S-CHURCH',
    quote: 'position the mic 2-3 feet in front of the choir with the most sensitive point of the mic aimed toward the back row of the choir (S-CHURCH); "slightly above the choir" (S-CHOIR); "approximately 1 microphone per 15-20 people" (S-LIVE)',
    bandProv: ill('"a little above": 0.1–0.7 m above the front heads is the lab’s drawing'),
    ref: 'front',
    d: [CHURCH.ahead.min, CHURCH.ahead.max],
    box: { min: v3(-500, above(700), CHURCH.ahead.min), max: v3(500, above(100), CHURCH.ahead.max) },
    start: ONE_ARC,
    variants: ['arc'],
    micTypeIds: ['arrCard'],
    tendency: 'The whole small choir from one place: aimed at the back row, the rows arrive more evenly than aimed at the front.',
    checks: ['The back row against the front', 'The outer singers', 'The monitor against the pattern'],
  }),
  mainZone({
    id: 'ch.arcPair',
    label: 'A pair in front of the chamber choir',
    band: 'Try the pair a few feet in front and above the heads — about 0.6–2 m (2–6.5 ft) out, 0.3–1.3 m (1–4 ft) above — centred, then move it toward or away and listen.',
    kind: 'trial',
    src: 'S-REC',
    quote: 'a few feet in front of, and a few feet above, the heads of the first row (S-REC p.6); the pair moved toward or away while listening (the lesson L14)',
    bandProv: ill('"a few feet": 0.6–2 m out, 0.3–1.3 m above the heads — the lab’s drawing'),
    ref: 'front',
    d: [LIVE.ahead.min, 2000],
    box: { min: v3(-600, above(1300), LIVE.ahead.min), max: v3(600, above(LIVE.above.min), 2000) },
    start: toward(ARC_PAIR, BACK_A),
    variants: ['arc'],
    micTypeIds: PAIR,
    tendency: 'Twelve voices as one, with the room. Nearer: diction and the front row; farther: blend.',
    checks: ['The outer singers', 'The back row', 'The sum in mono'],
  }),
];

const views = stageViews([RS, AR], { zMax: 3600, hMax: 3300 });
export const E05_MODEL = ensembleModel({
  id: 'e05-choir',
  name: 'choir on its risers',
  variants: [
    { id: 'risers', label: 'A choir on risers', short: 'Risers', blurb: RS.blurb, seating: RS },
    { id: 'arc', label: 'A chamber choir', short: 'Chamber', blurb: AR.blurb, seating: AR },
  ],
  views,
  viewsByVariant: { risers: stageViews([RS], { hMax: 3300 }), arc: stageViews([AR], { hMax: 3000 }) },
  extraSurfaces: E05_SURFACES,
});

/** A floor monitor in front of the choir, facing it: where a stage often puts one. */
export const E05_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor monitor in front of the choir, facing it', short: 'MONITOR', p: v3(-AREA_X, 0, 1700), lift: 300, faces: v3(0, 0, -1), note: 'On the floor in front of the choir, facing the singers, below and in front of the area mic: its rejection can be tilted toward it. It carries the piano, never the choir’s own mics.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
const single = (key: string, pose: MicPose, label: string, s?: Seating) => ({ key, p: pose.p, aim: dirOf(pose.az, pose.el), pattern: 'cardioid' as const, label, ...(s ? { dimTo: lipOf(nearestTo(s, pose.p)) } : {}) });
const rig = (id: 'xy' | 'ortf' | 'ab', c: Vec3, params = {}, tilt = 20) => ({ id, params, place: { c, face: 0, tilt }, mount: { kind: 'stand' as const } });

export const E05_SETUPS: EnsembleSetup[] = [
  { id: 'area', role: 'AREA MICS · TWO', title: 'Two area mics, 9 ft apart', short: 'AREA MICS', variants: ['risers'], singles: [single('l', AREA_L, 'LEFT AREA', RS), single('r', AREA_R, 'RIGHT AREA', RS)], mics: 'Two cardioid small condensers on tall stands, one for each half of the choir.', start: 'Each about 0.65 m (2 ft) in front of the first row and 0.3 m (1 ft) above their heads, aimed at the middle rows; 2.7 m (9 ft) apart — at least three times each mic’s distance to its nearest singer.', line: 'Practical coverage with two channels and a 3:1 spacing; check the outer singers and the back row.', core: true, view: 'plan' },
  { id: 'xy', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair a few feet in front', variants: ['risers'], rig: rig('xy', PAIR_NEAR, { angle: 110 }, 25), mics: 'Two matched cardioid small condensers, capsules together, on one tall stand.', start: 'A few feet in front of the first row and above their heads, centred, aimed at the middle rows; widen the angle if the outer sections sound weak.', line: 'A stable image and a dependable mono sum; closer gives diction, farther the blend.', core: true, view: 'section' },
  { id: 'ortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair farther back', variants: ['risers'], rig: rig('ortf', PAIR_FAR), mics: 'Two cardioid small condensers, 17 cm (6.7 in) apart, 110° between them — a fixed geometry.', start: 'Far enough back that the whole choir fills its 95° recording angle — about 1.7 m in front here — and above the heads.', line: 'Width from time and level, the choir filling the angle; check the edges and mono.', core: true, view: 'plan' },
  { id: 'spots', role: 'MAIN PAIR + SECTION SPOTS', title: 'The pair and a spot for each section', short: 'PAIR + SPOTS', variants: ['risers'], rig: rig('ortf', PAIR_FAR), singles: [single('s', SPOT.sop, 'SOPRANOS'), single('a', SPOT.alt, 'ALTOS'), single('t', SPOT.ten, 'TENORS'), single('b', SPOT.bas, 'BASSES')], mics: 'The 17 cm pair, plus a cardioid on its own stand for each of the four sections.', start: 'Each spot about 1–2 m (3–6 ft) from its section, in front and above their mouths; muted, then raised only until a weak section is just clear.', line: 'Limited correction under a natural main pair; too much and the choir becomes separate soloists.', core: true, view: 'plan' },
  { id: 'area3', role: 'AREA MICS · THREE', title: 'Three area mics, 6 ft apart', short: 'AREA MICS', variants: ['risers'], singles: AREA3.map((m, i) => single(`a${i}`, m, ['LEFT', 'CENTRE', 'RIGHT'][i])), mics: 'Three cardioid small condensers on tall stands.', start: `At the same distance and height, 1.8 m (6 ft) apart — under 3:1 here: about ${(E05_31.three.ratio).toFixed(1)} to 1. Use fewer mics, or move them closer to the singers.`, line: 'More even coverage across the width, but more overlap: listen for a hollow sound in mono.', core: false, view: 'plan' },
  { id: 'ab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair', variants: ['risers'], rig: rig('ab', PAIR_FAR, { spacing: 600 }), mics: 'Two omni small condensers, 60 cm (2 ft) apart on one bar.', start: 'The same place as the 17 cm pair; only in a good, quiet room.', line: 'Natural and spacious in a fine room — more room, more low end, more noise; rarely a live choice.', core: false, view: 'front' },
  { id: 'one', role: 'ONE AREA MIC', title: 'One mic, aimed at the back row', short: 'AREA MIC', variants: ['arc'], singles: [single('one', ONE_ARC, 'AREA MIC', AR)], mics: 'One cardioid small condenser on a tall stand.', start: 'About 0.75 m (2.5 ft) in front of the first row, a little above the heads, aimed at the back row — twelve voices, one mic.', line: 'The fewest open mics: the whole small choir from one place. Check the outer singers.', core: true, view: 'section' },
  { id: 'axy', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of the chamber choir', variants: ['arc'], rig: rig('xy', ARC_PAIR, { angle: 100 }, 25), mics: 'Two matched cardioid small condensers, capsules together.', start: 'About 1.3 m (4 ft) in front and 0.7 m above the heads, centred.', line: 'A stable, compact picture of the group; a dependable mono sum.', core: true, view: 'plan' },
  { id: 'aortf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm pair in front of the chamber choir', variants: ['arc'], rig: rig('ortf', ARC_PAIR), mics: 'Two cardioid small condensers, 17 cm apart, 110° between them.', start: 'The same place; move the whole pair, never its spacing.', line: 'More width than the X/Y; check the outer singers and mono.', core: true, view: 'plan' },
  { id: 'aab', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair in front of the chamber choir', variants: ['arc'], rig: rig('ab', ARC_PAIR, { spacing: 500 }), mics: 'Two omni small condensers, 50 cm apart.', start: 'The same place, in a good room.', line: 'Spacious and natural; more room and noise, and the centre to check in mono.', core: true, view: 'front' },
];

export const E05_PLACE: PlaceZone[] = [
  { id: 'pz.near', label: 'Near: 0.6–1.2 m in front', band: 'About 0.6–1.2 m (2–4 ft) in front of the first row, 0.3–0.9 m (1–3 ft) above their heads.', box: { min: v3(-700, above(LIVE.above.max), LIVE.ahead.min), max: v3(700, above(LIVE.above.min), LIVE.ahead.max) }, variants: ['risers', 'arc'], tendency: 'More diction and more of the first rows; the outer sections can fall outside the pair’s angle.' },
  { id: 'pz.far', label: 'Farther: 1.2–2.2 m in front, higher', band: 'About 1.2–2.2 m (4–7 ft) in front, 0.6–1.3 m (2–4 ft) above the heads — where the whole choir fills the pair’s angle.', box: { min: v3(-700, above(1300), LIVE.ahead.max), max: v3(700, above(600), 2200) }, variants: ['risers', 'arc'], tendency: 'More blend between the rows and more of the room; the choir fills the pair’s angle.' },
];
