/**
 * E12 PERCUSSION ENSEMBLES — where things are, frame S. Research:
 * docs/labs/miking/percussion_ensemble/ (SOURCES.md, GEOMETRY_PROPOSAL.md),
 * the Lab 1 and Lab 2 instrument lessons (M04a congas, I08 marimba, I07
 * vibraphone, M06 timpani, M07 concert drums) and the array register
 * full_orchestra/SOURCES.md §A; corrections G5-E12-*.
 *
 *   STATIONS   (seating.ts perc.trio) a hand-drum station, a marimba and a
 *              small-percussion table with a cymbal — the lesson's own
 *              practice group. A main mic or pair 2–3 m in front, 2–2.5 m up
 *              (the lesson's suggested trial). Supports: one mic above and
 *              between the congas, just above the heads (S-REC; M04a's
 *              5–15 cm); the marimba from above — one mic 10–15 cm (4–6 in)
 *              over the bars, or a pair about 46 cm (18 in) up, 61 cm (2 ft)
 *              apart (S-REC); a station mic over the table (a drawing default).
 *   TWO ROWS   (perc.large) congas, marimba and vibraphone in front; timpani,
 *              a concert bass drum and a snare with cymbals behind. The same
 *              main trial; area mics 1–1.5 m from three or four sources
 *              (DPA-MULTI's section-support rule).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { add, aimOf, mul, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { seatingOf, soundPoint, type Seat, type Seating } from '../shared/ensemble/seating.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, supportPose, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { frameOf, inFrame, spotAt } from '../shared/ensemble/spots.ts';
import { SHURE_H, SHURE_SPACING } from '../shared/mallets/malletModel.ts';
import { ROWS } from '../shared/mallets/malletSpec.ts';
import { CONGA_DIMS, JUST_ABOVE } from '../m04aCongas/model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E12_SEATS = { trio: seatingOf('perc.trio'), large: seatingOf('perc.large') } as const;
const TR = E12_SEATS.trio;
const LG = E12_SEATS.large;
const seat = (s: Seating, id: string): Seat => s.seats.find((q) => q.id === id)!;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });
type Spot = ReturnType<typeof spotAt>;

/* ── supports, each from its own instrument lesson's start ── */
/** Between the two conga heads, 10 cm above them, aimed down (S-REC; M04a 5–15 cm). Its boom comes from in front. */
function congaMic(q: Seat): { spot: Spot; foot: Vec3 } {
  const f = frameOf(q);
  const heads = add(add(q.p, mul(f.fwd, 380)), v3(0, -CONGA_DIMS.height.mm, 0));
  const spot = spotAt(heads, unit(add(v3(0, -1, 0), mul(f.fwd, 0.08))), (JUST_ABOVE.min + JUST_ABOVE.max) / 2);
  return { spot, foot: add(q.p, mul(f.fwd, 1050)) };
}
/** The middle of a mallet keyboard's bars (Lab 2's ROWS: its bar height, the bars from 220 mm ahead). */
function barsOf(q: Seat): Vec3 {
  const row = q.kind === 'marimba' ? ROWS.marimba43 : ROWS.vibe;
  return add(add(q.p, mul(frameOf(q).fwd, 220 + row.Dlow.mm * 0.32)), v3(0, -row.hBars.mm, 0));
}
/** One mic 12.5 cm over the bars at the middle, aimed down (S-REC "4 - 6 inches above bars"). */
function malletOne(q: Seat): { spot: Spot; foot: Vec3 } {
  const spot = spotAt(barsOf(q), unit(add(v3(0, -1, 0), mul(frameOf(q).fwd, 0.05))), 127);
  return { spot, foot: add(add(q.p, mul(frameOf(q).fwd, 1500)), mul(frameOf(q).right, 400)) };
}
/** Shure's pair: about 18 in above the bars, 2 ft apart, aimed down. */
function malletPair(q: Seat): { spots: Spot[]; feet: Vec3[] } {
  const f = frameOf(q);
  const c = barsOf(q);
  const spots = [-1, 1].map((sx) => {
    const t = add(c, mul(f.right, (sx * SHURE_SPACING) / 2));
    return { ...spotAt(t, unit(add(v3(0, -1, 0), mul(f.fwd, 0.04))), SHURE_H) };
  });
  return { spots, feet: spots.map((s) => add(v3(s.p.x, 0, s.p.z), mul(f.fwd, 950))) };
}
/** A station mic over the small-percussion table: 60 cm out, in front and above (a drawing default). */
function stationMic(q: Seat): { spot: Spot; foot: Vec3 } {
  const spot = spotAt(soundPoint(q), inFrame(q, 0.5, 0, 0.87), 600);
  return { spot, foot: add(q.p, mul(frameOf(q).fwd, 1150)) };
}

export const TR_CG = congaMic(seat(TR, 'cg.1'));
export const TR_MAR1 = malletOne(seat(TR, 'mar.1'));
export const TR_MAR2 = malletPair(seat(TR, 'mar.1'));
export const TR_TBL = stationMic(seat(TR, 'tbl.1'));
export const LG_CG = congaMic(seat(LG, 'cg.1'));
export const LG_MAR2 = malletPair(seat(LG, 'mar.1'));
/** Area mics 1.25 m from three or four sources (DPA-MULTI): over the mallets, and over the back row. */
export const LG_AREA_F = supportPose(LG, ['mar', 'vib'], { r: 1250, lift: 58 });
export const LG_AREA_B = supportPose(LG, ['timp', 'perc'], { r: 1250, lift: 62 });

/** The main mic or pair: 2.5 m in front, 2.2 m up (inside the 2–3 m and 2–2.5 m trial). */
export const TR_C = v3(0, -2200, 2500);
export const LG_C = v3(0, -2300, 2600);
const TR_MID = v3(0, -900, -700);
const LG_MID = v3(-300, -900, -1800);

export const E12_SURFACES = [
  targetSurface('t.cg', sectionPartId('trio', 'cg'), 'the conga heads', TR_CG.spot.target, TR_CG.spot.dir),
  targetSurface('t.mar', sectionPartId('trio', 'mar'), 'the marimba’s bars', TR_MAR1.spot.target, TR_MAR1.spot.dir),
];
const surf = (id: string) => E12_SURFACES.find((s) => s.id === id)!;
const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];
const main = (id: string, variant: string, c: Vec3, mid: Vec3): DocumentedZone =>
  mainZone({
    id,
    label: 'In front of the group, a little above',
    band: 'For a compact group about 3–4 m wide, try a main mic or pair about 2–3 m (6.5–10 ft) in front and 2–2.5 m (6.5–8 ft) up — then move the whole array and listen.',
    kind: 'trial',
    src: 'LESSON-PERC',
    quote: 'audition a main microphone or array roughly 2–3 m in front of the group, with capsules around 2–2.5 m above the floor (L39, a suggested trial)',
    ref: 'front',
    d: [2000, 3000],
    box: { min: v3(-900, -2500, 2000), max: v3(900, -2000, 3000) },
    start: toward(c, mid),
    variants: [variant],
    micTypeIds: PAIR_TYPES,
    tendency: 'The whole group with the room. Closer favours the front instruments; higher changes which surfaces and instruments dominate — not always a better blend.',
    checks: ['The quietest part and the loudest accent', 'The edges and the middle', 'The mono sum'],
  });

export const E12_ZONES: DocumentedZone[] = [
  main('pc.main', 'trio', TR_C, TR_MID),
  targetZone({
    id: 'pc.conga',
    label: 'Above and between the congas',
    band: 'One mic between the two drums, just above the heads — about 5–15 cm (2–6 in) — aimed down.',
    src: 'S-REC',
    quote: 'One microphone aiming down between pair of drums, just above top heads (Congas, Bongos, Timbales)',
    kind: 'sourced',
    surface: surf('t.cg'),
    side: v3(1, 0, 0),
    d: [JUST_ABOVE.min, JUST_ABOVE.max],
    coneMax: 20,
    aimMax: 25,
    start: TR_CG.spot.pose,
    variants: ['trio'],
    micTypeIds: ['hdDynCard', 'hdDynHyper'],
    tendency: 'Both drums on one channel with their attack — open tones, slaps and bass strokes; the marimba next to it as spill.',
    checks: ['Every stroke on both drums', 'The hands’ clearance', 'The marimba in it'],
    prov: ill('above the heads, within 20° of straight down: the lab’s cone'),
  }),
  targetZone({
    id: 'pc.mar',
    label: 'One mic just over the marimba’s bars',
    band: 'One mic about 10–15 cm (4–6 in) above the bars at the middle, aimed down — then play the low, middle and high registers: one close mic favours the bars nearest it.',
    src: 'S-REC',
    quote: 'single "4 - 6 inches above bars" (percussion_ensemble/SOURCES.md L46 row)',
    kind: 'sourced',
    surface: surf('t.mar'),
    side: v3(1, 0, 0),
    d: [101.6, 152.4],
    coneMax: 20,
    aimMax: 25,
    start: TR_MAR1.spot.pose,
    variants: ['trio'],
    micTypeIds: ['mlSdc', 'mlDynCard'],
    tendency: 'Clear attack from the bars nearest the mic; the ends of the keyboard fall away — a pair or more distance evens the range.',
    checks: ['Low, middle and high notes', 'The mallets’ path above the bars', 'Resonator openings left clear'],
    prov: ill('above the bars, within 20° of straight down: the lab’s cone'),
  }),
  main('pl.main', 'large', LG_C, LG_MID),
];

const views = stageViews([TR, LG]);
export const E12_MODEL = ensembleModel({
  id: 'e12-perc',
  name: 'percussion ensemble on its stage',
  variants: [
    { id: 'trio', label: 'Three stations', short: 'Stations', blurb: TR.blurb, seating: TR },
    { id: 'large', label: 'Two rows of stations', short: 'Two rows', blurb: LG.blurb, seating: LG },
  ],
  views,
  viewsByVariant: { trio: stageViews([TR], { zMax: 3200, hMax: 2800 }), large: stageViews([LG], { zMax: 3200, hMax: 2800 }) },
  extraSurfaces: E12_SURFACES,
});

/** A floor wedge in front of the congas, facing the player (a drawing default). */
export const E12_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor wedge in front of the congas', short: 'MONITOR', p: v3(-1300, 0, 300), lift: 300, faces: unit(v3(-0.35, 0, -1)), note: 'A floor wedge facing the conga player: turn the conga mic so the wedge sits in its rejection.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
type Art = 'instDynamic' | 'smallDynamic' | 'sdc';
const sgl = (key: string, s: Spot, label: string, o: { pattern?: 'cardioid' | 'supercardioid' | 'omni'; art?: Art; foot?: Vec3 } = {}) => {
  const art = o.art ?? 'sdc';
  return { key, p: s.p, aim: s.aim, pattern: o.pattern ?? ('cardioid' as const), label, art, len: art === 'sdc' ? 104 : 120, cross: art === 'sdc' ? 21 : 36, ...(o.foot ? { foot: o.foot } : {}) };
};
const trRig = (id: 'xy' | 'ortf' | 'ab', params = {}) => ({ id, params, place: { c: TR_C, face: 0, tilt: 25 }, mount: { kind: 'stand' as const } });
const lgRig = (id: 'xy' | 'ab' | 'ms', params = {}) => ({ id, params, place: { c: LG_C, face: 0, tilt: 25 }, mount: { kind: 'stand' as const } });
const CG_TR = sgl('cg', TR_CG.spot, 'CONGAS', { art: 'smallDynamic', foot: TR_CG.foot });
const TBL_TR = sgl('tbl', TR_TBL.spot, 'STATION', { foot: TR_TBL.foot });
const MAR_TR = TR_MAR2.spots.map((s, i) => sgl(`m${i}`, s, i ? 'MARIMBA HIGH' : 'MARIMBA LOW', { foot: TR_MAR2.feet[i] }));
const MAR_LG = LG_MAR2.spots.map((s, i) => sgl(`m${i}`, s, i ? 'MARIMBA HIGH' : 'MARIMBA LOW', { foot: LG_MAR2.feet[i] }));
const area = (key: string, a: typeof LG_AREA_F, label: string, foot: Vec3) => ({ key, p: a.pose.p, aim: unit(sub(a.target, a.pose.p)), pattern: 'cardioid' as const, label, art: 'sdc' as const, len: 104, cross: 21, foot });

export const E12_SETUPS: EnsembleSetup[] = [
  { id: 'pcOne', role: 'ONE MAIN MIC', title: 'One mic in front of the group', variants: ['trio'], singles: [{ key: 'one', p: TR_C, aim: unit(sub(TR_MID, TR_C)), pattern: 'cardioid', label: 'MAIN MIC', art: 'sdc' }], mics: 'One cardioid condenser on a tall stand, aimed at the middle of the group.', start: 'About 2–3 m (6.5–10 ft) in front and 2–2.5 m (6.5–8 ft) up.', line: 'Mono documentation, or a compact group that already balances: every essential instrument must stay audible.', core: true, view: 'section' },
  { id: 'pcXY', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of the group', variants: ['trio'], rig: trRig('xy', { angle: 90 }), mics: 'Two matched cardioid small condensers, capsules together, 90° apart.', start: 'About 2–3 m in front and 2–2.5 m up; 90° to start, then adjust the coverage on purpose.', line: 'Stereo from level differences and a dependable mono sum; check the quiet instruments at the edges.', core: true, view: 'section' },
  { id: 'pcOrtf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair in front of the group', variants: ['trio'], rig: trRig('ortf'), mics: 'Two cardioid small condensers 17 cm (6.7 in) apart, 110° between them.', start: 'The same place; move the whole pair to change its coverage, never its spacing.', line: 'A wider picture from time and level; the quiet edges and mono need checking.', core: true, view: 'plan' },
  { id: 'pcSpots', role: 'MAIN PAIR + TWO SUPPORTS', title: 'The pair, the congas and the station', variants: ['trio'], rig: trRig('xy', { angle: 90 }), singles: [CG_TR, TBL_TR], mics: 'The X/Y pair, a compact dynamic above and between the congas, and a condenser over the small-percussion table.', start: 'The conga mic just above the heads, between the drums, aimed down; the station mic about 60 cm out, in front and above the table. Each brought up from silence under the pair.', line: 'At most two supports at first, each for a named problem: the drums’ strokes clearer, the shakers’ whole movement covered.', core: true, view: 'plan' },
  { id: 'pcMallet', role: 'MAIN PAIR + MARIMBA PAIR', title: 'The pair and a pair over the marimba', variants: ['trio'], rig: trRig('xy', { angle: 90 }), singles: MAR_TR, mics: 'The X/Y pair, plus two small condensers over the marimba, aimed down.', start: 'About 46 cm (18 in) above the bars, 61 cm (2 ft) apart — then play every register.', line: 'The marimba’s whole range even and clear; an instrument-level start, not a position for the whole group.', core: false, view: 'section' },
  { id: 'pcAB', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair in front of the group', variants: ['trio'], rig: trRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'The same place; spacing, distance and height judged together.', line: 'More room and width; listen for a weak middle and tone changes in mono.', core: false, view: 'front' },
  { id: 'plAB', role: 'MAIN PAIR · SPACED', title: 'A spaced omni pair in front of both rows', variants: ['large'], rig: lgRig('ab', { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'About 2–3 m in front and 2–2.5 m up — a deeper group may need a different approach; compare.', line: 'The group with its room; the back row arrives later and quieter — move the whole array to balance front and back.', core: true, view: 'section' },
  { id: 'plXY', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of both rows', variants: ['large'], rig: lgRig('xy', { angle: 100 }), mics: 'Two matched cardioid small condensers, capsules together.', start: 'About 2–3 m in front and 2–2.5 m up; widened a little for a wider group.', line: 'A stable picture and a dependable mono sum; check the instruments at the edges.', core: true, view: 'plan' },
  { id: 'plAreas', role: 'MAIN PAIR + AREA MICS', title: 'The pair and two area mics', variants: ['large'], rig: lgRig('xy', { angle: 100 }), singles: [area('af', LG_AREA_F, 'MALLETS AREA', v3(LG_AREA_F.pose.p.x - 300, 0, 400)), area('ab', LG_AREA_B, 'BACK ROW AREA', v3(LG_AREA_B.pose.p.x + 900, 0, -2650))], mics: 'The X/Y pair, plus a cardioid over the mallets and one over the back row.', start: 'Each area mic about 1–1.5 m from the instruments it covers, above and in front, aimed across them.', line: 'Fewer channels than a mic on everything; check the overlap between areas and avoid covering one loud cymbal equally with both.', core: true, view: 'section' },
  { id: 'plSpots', role: 'MAIN PAIR + SUPPORTS', title: 'The pair, the marimba pair and the congas', variants: ['large'], rig: lgRig('xy', { angle: 100 }), singles: [...MAR_LG, sgl('cg', LG_CG.spot, 'CONGAS', { art: 'smallDynamic', foot: LG_CG.foot })], mics: 'The X/Y pair, a pair of small condensers over the marimba, and a compact dynamic over the congas.', start: 'The marimba pair about 46 cm above the bars, 61 cm apart; the conga mic just above the heads, between the drums.', line: 'Supports for parts the pair loses; for the bass drum and timpani, check first whether the pair already carries their weight.', core: true, view: 'plan' },
  { id: 'plMS', role: 'MAIN PAIR · MID-SIDE', title: 'A Mid-Side pair in front of both rows', variants: ['large'], rig: lgRig('ms'), mics: 'A forward cardioid (Mid) and a sideways figure-8 (Side) just above it.', start: 'The same place; Left = Mid + Side, Right = Mid − Side.', line: 'Width set later in the matrix; the mono sum is the Mid alone.', core: false, view: 'plan' },
];

export const E12_PLACE: PlaceZone[] = [
  { id: 'pz.tr.near', label: 'Nearer: 2–2.5 m in front', band: 'About 2–2.5 m (6.5–8 ft) in front of the group, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 2000), max: v3(900, -2000, 2500) }, variants: ['trio'], tendency: 'More direct sound and attack; the nearest instrument can dominate.' },
  { id: 'pz.tr.far', label: 'Farther: 2.5–3 m in front', band: 'About 2.5–3 m (8–10 ft) in front, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 2500), max: v3(900, -2000, 3000) }, variants: ['trio'], tendency: 'More blend and more of the room.' },
  { id: 'pz.lg.near', label: 'Nearer: 2–2.5 m in front', band: 'About 2–2.5 m (6.5–8 ft) in front of the front row, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 2000), max: v3(900, -2000, 2500) }, variants: ['large'], tendency: 'The front row forward; the back row distant.' },
  { id: 'pz.lg.far', label: 'Farther: 2.5–3 m in front', band: 'About 2.5–3 m (8–10 ft) in front, 2–2.5 m (6.5–8 ft) up.', box: { min: v3(-900, -2500, 2500), max: v3(900, -2000, 3000) }, variants: ['large'], tendency: 'The two rows more even, with more of the room.' },
];

export const MAIN_AT = { trio: TR_C, large: LG_C } as const;
