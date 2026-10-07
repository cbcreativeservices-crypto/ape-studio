/**
 * E10 HORN SECTIONS — where things are, frame S. Research:
 * docs/labs/miking/horn_section/ (SOURCES.md, GEOMETRY_PROPOSAL.md), the
 * Batch 3 wind lessons (A01 trumpet, A02 trombone, A04a tuba, A05 saxes) and
 * the array register full_orchestra/SOURCES.md §A; corrections G5-E10-*.
 *
 *   ON STAGE   four players standing in a line (seating.ts horns.line):
 *              trumpet, alto sax, trombone, bass trombone, 1 m apart. Close
 *              mics: the trumpet 30–50 cm from the bell, slightly off its
 *              axis (DPA-TPT); the sax 30–60 cm, beside the bell on the
 *              player's right, aimed a third of the way up the horn (the
 *              lesson's trial; SW-SAX — G5-OR-3); the trombones 30–60 cm
 *              above and beside the slide, aimed across the bell (A02, ROY-
 *              BRASS 1–2 ft). One mic for two players 0.8–1.2 m out (the big-
 *              band lesson's trial). A section pair in front and a little
 *              above (S-SM4-UG's 1–6 ft; ROY-BRASS "above and in front").
 *   STUDIO     the same idea round one mic: four players seated on an arc
 *              1.5 m round it (horns.arc; S-SM4-UG "an equal distance from
 *              the microphone"); the pair at the centre, at bell height or
 *              above; close mics on each for the expanded plan; the tuba
 *              from above its bell, aimed across the opening (A04a, MDAT).
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { aimOf, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { HORN_ARC, seatingOf, seatsOf, soundPoint, type Seating } from '../shared/ensemble/seating.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { bellOf, inFrame, meanOf, spotAt } from '../shared/ensemble/spots.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E10_SEATS = { line: seatingOf('horns.line'), arc: seatingOf('horns.arc') } as const;
const LN = E10_SEATS.line;
const AR = E10_SEATS.arc;
const one = (s: Seating, sec: string) => seatsOf(s, sec)[0];
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });

/* ── the close mics (each from its own instrument lesson's start) ── */
/** Trumpet: 40 cm from the bell, 15° off its axis toward the player's right (DPA-TPT 30–50 cm, "slightly off axis"). */
const tptSpot = (s: Seating) => spotAt(bellOf(one(s, 'tpt')), inFrame(one(s, 'tpt'), Math.cos((15 * Math.PI) / 180), Math.sin((15 * Math.PI) / 180), 0), 400);
/** Sax: 45 cm out, beside the bell on the player's right and a little above, aimed a third of the way up the horn. */
const saxSpot = (s: Seating, sec: string) => spotAt(soundPoint(one(s, sec)), inFrame(one(s, sec), 0.75, 0.55, 0.35), 450);
/** Trombone: 45 cm from the bell, above and beside the slide on the bell's side, aimed across the bell. */
const tbnSpot = (s: Seating, sec: string) => spotAt(bellOf(one(s, sec)), inFrame(one(s, sec), 0.6, -0.6, 0.5), 450);
/** Tuba: about 61 cm above its upward bell, a little to the side, aimed across the opening (A04a, 56–66 cm). */
const tubaSpot = (s: Seating) => spotAt(bellOf(one(s, 'tu')), inFrame(one(s, 'tu'), 0.25, 0.3, 0.92), 610);

export const LN_TPT = tptSpot(LN);
export const LN_AS = saxSpot(LN, 'as');
export const LN_TBN = tbnSpot(LN, 'tbn');
export const LN_BTB = tbnSpot(LN, 'btb');
export const AR_TPT = tptSpot(AR);
export const AR_TS = saxSpot(AR, 'ts');
export const AR_TBN = tbnSpot(AR, 'tbn');
export const AR_TU = tubaSpot(AR);
/** One mic for two neighbours: 1 m from their middle, in front and a little above (0.8–1.2 m trial). */
const shared = (s: Seating, a: string, b: string) => {
  const T = meanOf([soundPoint(one(s, a)), soundPoint(one(s, b))]);
  return spotAt(T, unit(v3(0, -0.35, 1)), 1000);
};
export const LN_PAIR1 = shared(LN, 'tpt', 'as');
export const LN_PAIR2 = shared(LN, 'tbn', 'btb');

/* ── the section arrays ── */
/** On stage: 1.4 m in front of the line, 2 m up (inside 1.2–1.83 m and "above and in front"). */
export const LN_C = v3(0, -2000, 1400);
/** In the studio: at the arc's centre, a little above the bells (1.3 m up), 1.5 m from every player. */
export const AR_C = v3(HORN_ARC.c.x, -1300, HORN_ARC.c.z);
const AR_MID = v3(0, -1050, -350);

export const E10_SURFACES = [
  targetSurface('t.tpt', sectionPartId('line', 'tpt'), 'the trumpet’s bell', LN_TPT.target, inFrame(one(LN, 'tpt'), 1, 0, 0)),
  targetSurface('t.as', sectionPartId('line', 'as'), 'the alto sax', LN_AS.target, LN_AS.dir),
  targetSurface('t.tbn', sectionPartId('line', 'tbn'), 'the trombone’s bell', LN_TBN.target, LN_TBN.dir),
  targetSurface('t.atpt', sectionPartId('arc', 'tpt'), 'the trumpet’s bell', AR_TPT.target, inFrame(one(AR, 'tpt'), 1, 0, 0)),
];
const surf = (id: string) => E10_SURFACES.find((s) => s.id === id)!;
const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];
const tptZone = (id: string, variant: string, sid: string, start: MicPose): DocumentedZone =>
  targetZone({
    id,
    label: 'Close on the trumpet, a little off the bell',
    band: 'About 30–50 cm (12–20 in) from the bell, a little off its axis, aimed at the bell — then move it while the player plays.',
    src: 'DPA-TPT',
    quote: '30–50 cm from the bell, slightly off axis (horn_section/SOURCES.md; Batch 3 trumpet)',
    kind: 'sourced',
    surface: surf(sid),
    side: v3(1, 0, 0),
    d: [300, 500],
    coneMax: 30,
    aimMax: 25,
    start,
    variants: [variant],
    micTypeIds: ['instDynCard', 'sdcCard'],
    tendency: 'On the axis: brighter and more biting. A little off it: softer edges — with the same distance.',
    checks: ['The loudest passage: no overload', 'Brightness on and off the axis', 'The sax and trombone in it'],
    prov: ill('off the bell’s axis up to 30°: the lab’s cone'),
  });

export const E10_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'ln.main',
    label: 'In front of the line and a little above',
    band: 'For a section pair: about 1.2–1.8 m (4–6 ft) in front of the line, about 2 m (6.5 ft) up, aimed at its middle — the players arranged so the balance is right before any mic.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'horns 1–6 feet (30 cm–2 m); for a horn or string section, arrange players at an equal distance from the microphone (with ROY-BRASS "above and in front of the brass group")',
    ref: 'front',
    d: [1200, 1830],
    box: { min: v3(-700, -2200, 1200), max: v3(700, -1800, 1830) },
    start: toward(LN_C, v3(0, -1300, -300)),
    variants: ['line'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The line as one sound, with some room. Closer favours the nearest player; higher evens the four out.',
    checks: ['Each player’s loudest passage', 'The balance between the four', 'The mono sum'],
  }),
  tptZone('ln.tpt', 'line', 't.tpt', LN_TPT.pose),
  targetZone({
    id: 'ln.sax',
    label: 'Beside the sax, on the player’s right',
    band: 'About 30–60 cm (12–24 in) out, beside the bell on the player’s right, aimed a third of the way up the horn — not straight into the bell.',
    src: 'LESSON-BIGBAND',
    quote: 'a view encompassing body tone holes and bell, 30–60 cm (E16 L58, a suggested trial); SW-SAX 12–24 in, a third of the way up the horn',
    kind: 'trial',
    surface: surf('t.as'),
    side: v3(0, 1, 0),
    d: [300, 600],
    coneMax: 35,
    aimMax: 25,
    start: LN_AS.pose,
    variants: ['line'],
    micTypeIds: ['saxDynSuper', 'instDynCard'],
    tendency: 'The body and the bell together: fuller and more even across the range. Toward the bell: more focus; toward the body: more warmth and key noise.',
    checks: ['Low and high notes', 'Key noise', 'The trumpet beside it'],
    prov: ill('beside the bell on the right, up to 35° round it: the lab’s cone (G5-OR-3)'),
  }),
  targetZone({
    id: 'ln.tbn',
    label: 'Above and beside the trombone’s slide',
    band: 'About 30–60 cm (12–24 in) from the bell, above and beside the slide, aimed across the bell — never in the slide’s path.',
    src: 'ROY-BRASS',
    quote: 'one R-121 per musician at a distance of 1 to 2 feet (section); A02: above or beside the slide, aimed across the bell',
    kind: 'sourced',
    surface: surf('t.tbn'),
    side: v3(1, 0, 0),
    d: [300, 610],
    coneMax: 30,
    aimMax: 25,
    start: LN_TBN.pose,
    variants: ['line'],
    micTypeIds: ['instDynCard', 'lbRibbon'],
    tendency: 'The trombone with its low notes and some bite; clear of the slide at every position.',
    checks: ['The slide at full extension', 'Low notes and headroom', 'The bass trombone beside it'],
    prov: ill('above and beside the slide, up to 30° round it: the lab’s cone'),
  }),
  mainZone({
    id: 'arc.main',
    label: 'At the centre of the arc',
    band: 'For a studio section: one mic or a pair at the centre, about 1.5 m (5 ft) from every player, at the bells’ height or a little above.',
    kind: 'sourced',
    src: 'S-SM4-UG',
    quote: 'For a horn or string section, arrange players at an equal distance from the microphone; horns 1–6 feet',
    ref: 'front',
    d: [650, 1050],
    box: { min: v3(-300, -2100, 650), max: v3(300, -1000, 1050) },
    start: toward(AR_C, AR_MID),
    variants: ['arc'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The section’s own blend and the room. Every player about the same distance away, so the players set the balance.',
    checks: ['Each player alone, then all four', 'The tuba’s low notes', 'The mono sum'],
  }),
  tptZone('arc.tpt', 'arc', 't.atpt', AR_TPT.pose),
];

const views = stageViews([LN, AR]);
export const E10_MODEL = ensembleModel({
  id: 'e10-horns',
  name: 'horn section on its stage',
  variants: [
    { id: 'line', label: 'A horn line on stage', short: 'Stage', blurb: LN.blurb, seating: LN },
    { id: 'arc', label: 'A section round one mic', short: 'Studio', blurb: AR.blurb, seating: AR },
  ],
  views,
  viewsByVariant: { line: stageViews([LN], { zMax: 2400, hMax: 2600 }), arc: stageViews([AR], { zMax: 2400, hMax: 2600 }) },
  extraSurfaces: E10_SURFACES,
});

/** A floor wedge in front of the trumpet, facing the player (a drawing default). */
export const E10_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor monitor in front of the trumpet', short: 'MONITOR', p: v3(-1300, 0, 1300), lift: 300, faces: unit(v3(-0.15, 0, -1)), note: 'A floor wedge facing the trumpet player: turn the close mic so the wedge sits in its rejection.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
const sgl = (key: string, s: ReturnType<typeof spotAt>, label: string, o: { pattern?: 'cardioid' | 'supercardioid' | 'figure8'; art?: 'instDynamic' | 'smallDynamic' | 'sdc' | 'sideLdc' } = {}) => ({ key, p: s.p, aim: s.aim, pattern: o.pattern ?? ('cardioid' as const), label, art: o.art ?? ('instDynamic' as const), len: o.art === 'sdc' ? 104 : 150, cross: o.art === 'sdc' ? 21 : 38 });
const LINE_CLOSE = [sgl('tpt', LN_TPT, 'TRUMPET'), sgl('as', LN_AS, 'ALTO SAX', { pattern: 'supercardioid', art: 'smallDynamic' }), sgl('tbn', LN_TBN, 'TROMBONE'), sgl('btb', LN_BTB, 'BASS TROMBONE')];
const ARC_CLOSE = [sgl('tpt', AR_TPT, 'TRUMPET'), sgl('ts', AR_TS, 'TENOR SAX', { pattern: 'supercardioid', art: 'smallDynamic' }), sgl('tbn', AR_TBN, 'TROMBONE'), sgl('tu', AR_TU, 'TUBA', { art: 'sdc' })];
const lnRig = (id: 'xy' | 'ortf', params = {}) => ({ id, params, place: { c: LN_C, face: 0, tilt: 22 }, mount: { kind: 'stand' as const } });
const arRig = (id: 'xy' | 'ab' | 'ms', c: Vec3, params = {}, tilt = 10) => ({ id, params, place: { c, face: 0, tilt }, mount: { kind: 'stand' as const } });
export const AR_BACK = v3(0, -1750, HORN_ARC.c.z + 150);

export const E10_SETUPS: EnsembleSetup[] = [
  { id: 'lnClose', role: 'ONE MIC PER PLAYER · CLOSE', title: 'A close mic on each player', variants: ['line'], singles: LINE_CLOSE, mics: 'Cardioid dynamics on the trumpet and both trombones, a supercardioid dynamic beside the sax — each on its own short boom stand.', start: 'Trumpet 30–50 cm (12–20 in) from the bell, a little off its axis; sax 30–60 cm out on the player’s right, aimed a third of the way up; trombones 30–60 cm from the bell, above and beside the slide.', line: 'Control for the PA and later balance; each mic also hears its neighbours. The mics are about 2:1, not 3:1 — check them together, in mono.', core: true, view: 'plan' },
  { id: 'lnPairs', role: 'ONE MIC FOR TWO PLAYERS', title: 'A shared mic on each pair of players', variants: ['line'], singles: [sgl('p1', LN_PAIR1, 'TRUMPET + SAX', { art: 'sdc' }), sgl('p2', LN_PAIR2, 'TROMBONES', { art: 'sdc' })], mics: 'Two cardioid small condensers on tall stands, each aimed at the middle of two players.', start: 'About 0.8–1.2 m (2.5–4 ft) from the two players’ shared middle, a little above the bells.', line: 'Fewer open mics and a natural blend for each pair; one player can dominate — the players set the balance.', core: true, view: 'plan' },
  { id: 'lnPair', role: 'SECTION PAIR · COINCIDENT', title: 'An X/Y pair in front of the line', variants: ['line'], rig: lnRig('xy', { angle: 110 }), mics: 'Two matched cardioid small condensers, capsules together, on one tall stand.', start: 'About 1.2–1.8 m (4–6 ft) in front of the line and about 2 m up, aimed at its middle; 110° to take in all four.', line: 'The section as one sound with some room — useful for a recording or a stream; on a loud stage it hears the PA too.', core: true, view: 'section' },
  { id: 'lnExpanded', role: 'CLOSE MICS + SECTION PAIR', title: 'Close mics and the pair', variants: ['line'], rig: lnRig('xy', { angle: 110 }), singles: LINE_CLOSE, mics: 'The four close mics plus the X/Y pair.', start: 'Each mic at its own start; the pair raised from silence under them.', line: 'The most control; treat it as one system — solo and mute each mic, listen in mono, and check the pair adds something.', core: true, view: 'front' },
  { id: 'lnOrtf', role: 'SECTION PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair in front of the line', variants: ['line'], rig: lnRig('ortf'), mics: 'Two cardioid small condensers 17 cm (6.7 in) apart, 110° between them.', start: 'The same place as the X/Y; move the whole pair, never its spacing.', line: 'A wider picture from time and level; check the ends of the line and the mono sum.', core: false, view: 'plan' },
  { id: 'arcOne', role: 'ONE SECTION MIC', title: 'One mic at the centre of the arc', variants: ['arc'], singles: [{ key: 'one', p: AR_C, aim: unit(sub(AR_MID, AR_C)), pattern: 'cardioid', label: 'SECTION MIC', art: 'sdc' }], mics: 'One cardioid condenser on a stand at the centre, facing the middle of the arc.', start: 'At the centre, about 1.5 m (5 ft) from every player, a little above the bells — the players arrange themselves for the balance.', line: 'The simplest plan: blend and no phase problems between mics. Stronger players sit a little farther back if they need to.', core: true, view: 'plan' },
  { id: 'arcXY', role: 'SECTION PAIR · COINCIDENT', title: 'An X/Y pair at the centre of the arc', variants: ['arc'], rig: arRig('xy', AR_C, { angle: 110 }), mics: 'Two matched cardioid small condensers, capsules together, 110° apart.', start: 'At the centre, about 1.5 m from every player, about 1.3 m up — angled to take in all four.', line: 'The section’s blend in stereo, with the room; a dependable mono sum.', core: true, view: 'section' },
  { id: 'arcAB', role: 'SECTION PAIR · SPACED', title: 'A spaced pair, a little higher', variants: ['arc'], rig: arRig('ab', AR_BACK, { spacing: 500 }, 20), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'Above the centre, about 1.75 m up, so every player stays about 1.5–1.8 m away.', line: 'More room and width; listen for a weak middle and check mono.', core: true, view: 'section' },
  { id: 'arcExpanded', role: 'CLOSE MICS + SECTION PAIR', title: 'Close mics on each player and the pair', variants: ['arc'], rig: arRig('xy', AR_C, { angle: 110 }), singles: ARC_CLOSE, mics: 'The X/Y pair at the centre, plus a mic on each player: dynamics on the trumpet and trombone, a supercardioid beside the sax, a condenser above the tuba.', start: 'Each close mic at its own start — the tuba about 60 cm above its bell, a little to the side.', line: 'Isolated tracks for later balance, with the pair for the blend; listen in mono and to each mic alone.', core: true, view: 'plan' },
  { id: 'arcMS', role: 'SECTION PAIR · MID-SIDE', title: 'A Mid-Side pair at the centre', variants: ['arc'], rig: arRig('ms', AR_C), mics: 'A forward cardioid (Mid) and a sideways figure-8 (Side) just above it.', start: 'The same place; Left = Mid + Side, Right = Mid − Side.', line: 'Width set later in the matrix; the mono sum is the Mid alone.', core: false, view: 'plan' },
];

export const E10_PLACE: PlaceZone[] = [
  { id: 'pz.ln.near', label: 'Nearer: 1.2–1.5 m in front', band: 'About 1.2–1.5 m (4–5 ft) in front of the line, 1.8–2.2 m (6–7 ft) up.', box: { min: v3(-700, -2200, 1200), max: v3(700, -1800, 1500) }, variants: ['line'], tendency: 'More direct sound; the nearest players can dominate.' },
  { id: 'pz.ln.far', label: 'Farther: 1.5–1.8 m in front', band: 'About 1.5–1.8 m (5–6 ft) in front, 1.8–2.2 m (6–7 ft) up.', box: { min: v3(-700, -2200, 1500), max: v3(700, -1800, 1830) }, variants: ['line'], tendency: 'More blend across the four and more of the room.' },
  { id: 'pz.arc.low', label: 'At the centre, near bell height', band: 'At the centre of the arc, 1.0–1.5 m (3–5 ft) up: about 1.5 m from every player.', box: { min: v3(-300, -1500, 650), max: v3(300, -1000, 1050) }, variants: ['arc'], tendency: 'The bells head-on: direct and present.' },
  { id: 'pz.arc.high', label: 'At the centre, above the bells', band: 'At the centre, 1.5–2.1 m (5–7 ft) up, looking down at the section: about 1.5–1.8 m from every player.', box: { min: v3(-300, -2100, 650), max: v3(300, -1500, 1050) }, variants: ['arc'], tendency: 'A little off the bells’ axes: softer edges and more blend.' },
];
