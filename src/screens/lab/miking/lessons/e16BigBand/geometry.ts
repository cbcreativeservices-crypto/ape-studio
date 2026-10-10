/**
 * E16 JAZZ BIG BAND — where things are, frame S. Research:
 * docs/labs/miking/jazz_big_band/ (SOURCES.md §a the seating orders, §b the
 * lesson's claims; GEOMETRY_PROPOSAL.md), the Batch 3 brass and sax lessons,
 * C11 piano, C06a bass, C02 guitar amp, M09 overheads; corrections G5-E16-*.
 *
 *   ROWS       (seating.ts bb.standard) saxes in front — tenor 1, alto 2,
 *              alto 1, tenor 2, baritone; trombones 2–1–3–4 seated on a short
 *              riser; trumpets 2–1–3–4 standing on the riser behind; the
 *              rhythm section on the conductor's left (EMAC-BB). A main horn
 *              pair 2–3 m in front from an elevated view (the lesson's
 *              suggested trial), the hall example at about 3 m (S-SM27-XEP).
 *              Close mics: trumpets 30–50 cm, slightly off the bell's axis
 *              (DPA-TPT); trombones a ribbon 30–60 cm each (ROY-BRASS 1–2 ft)
 *              above and beside the slide; saxes 30–60 cm with a view of body
 *              and bell (the lesson's trial); one mic for two neighbours
 *              0.8–1.2 m (trial). Rhythm: the piano from outside its curve
 *              30 cm–1 m (C11), the bass 15–30 cm in front of the strings
 *              above the bridge (C06a), the amp's speaker 1.5–5 cm from the
 *              grille (C02), a kit overhead about 1 m over the snare (M09).
 *   HORSESHOE  (bb.horseshoe) the U with the drums at its base (S-BREIT); two
 *              M/S pairs inside it; a figure-8 ribbon on each horn.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, Wedge } from '../../engine/model/types.ts';
import { add, aimOf, mul, sub, unit, v3 } from '../shared/ensemble/frameS.ts';
import { BB_DIMS, seatingOf, seatsOf, soundPoint, type Seat, type Seating } from '../shared/ensemble/seating.ts';
import { ensembleModel, mainZone, sectionPartId, stageViews, targetSurface, targetZone } from '../shared/ensemble/ensembleModel.ts';
import type { EnsembleSetup, PlaceZone } from '../shared/ensemble/ensembleData.ts';
import { bellOf, frameOf, inFrame, meanOf, spotAt } from '../shared/ensemble/spots.ts';
import { KIT, KIT_DRUMS } from '../shared/kitPlanModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const E16_SEATS = { rows: seatingOf('bb.standard'), horseshoe: seatingOf('bb.horseshoe') } as const;
const BB = E16_SEATS.rows;
const HS = E16_SEATS.horseshoe;
const seat = (s: Seating, id: string): Seat => s.seats.find((q) => q.id === id)!;
const toward = (from: Vec3, to: Vec3): MicPose => ({ p: from, ...aimOf(sub(to, from)) });
type Spot = ReturnType<typeof spotAt>;

/* ── close mics (each from its own instrument lesson's start) ── */
const tptSpot = (q: Seat): Spot => spotAt(bellOf(q), inFrame(q, Math.cos((15 * Math.PI) / 180), Math.sin((15 * Math.PI) / 180), 0), 400);
/** A ribbon on a trombone, above and beside the slide on the bell's side (ROY-BRASS 1–2 ft; A02). */
const tbnSpot = (q: Seat): Spot => spotAt(bellOf(q), inFrame(q, 0.6, -0.6, 0.5), 450);
/** A sax: 45 cm out, beside the bell on the player's right and a little above (the lesson's 30–60 cm trial). */
const saxSpot = (q: Seat): Spot => spotAt(soundPoint(q), inFrame(q, 0.75, 0.55, 0.35), 450);
/** A ribbon in front of a horseshoe trumpet: 45 cm out, about 15 cm below the bell line (ROY-BRASS). */
const tptRibbon = (q: Seat): Spot => spotAt(bellOf(q), inFrame(q, 0.95, 0, -0.33), 450);
/** One mic for two neighbours: 0.9 m from their middle, in front and a little above (0.8–1.2 m trial). */
const twoSpot = (a: Seat, b: Seat, d = 900): Spot => spotAt(meanOf([soundPoint(a), soundPoint(b)]), inFrame(a, 0.94, 0, 0.35), d);

/* the rows */
export const BB_A1 = saxSpot(seat(BB, 'sax.a1'));
export const BB_SAX = ['sax.t1', 'sax.a2', 'sax.a1', 'sax.t2', 'sax.bari'].map((id) => saxSpot(seat(BB, id)));
export const BB_TBN = ['tbn.2', 'tbn.1', 'tbn.3', 'tbn.4'].map((id) => tbnSpot(seat(BB, id)));
export const BB_TPT = ['tpt.2', 'tpt.1', 'tpt.3', 'tpt.4'].map((id) => tptSpot(seat(BB, id)));
/** Each trumpet mic's stand stands on the trumpet riser between two players (a drawing default). */
const tptFoot = (q: Seat) => add(q.p, add(mul(frameOf(q).right, -450), mul(frameOf(q).fwd, 380)));
export const BB_SAX2 = [twoSpot(seat(BB, 'sax.t1'), seat(BB, 'sax.a2')), twoSpot(seat(BB, 'sax.a1'), seat(BB, 'sax.t2')), saxSpot(seat(BB, 'sax.bari'))];
export const BB_TPT2 = [twoSpot(seat(BB, 'tpt.2'), seat(BB, 'tpt.1'), 800), twoSpot(seat(BB, 'tpt.3'), seat(BB, 'tpt.4'), 800)];
/** The shared trumpet mics stand on the trombone riser, between two trombone chairs. */
const tpt2Foot = (s: Spot) => v3(s.p.x, -BB_DIMS.tbnRiser, BB_DIMS.tbnZ - 250);
/** The pair from an elevated view: 2.5 m in front of the sax row's front, 2.4 m up (the 2–3 m trial). */
export const BB_C = v3(0, -2400, 2500);
/** The hall example: about 3 m (10 ft) in front, a spaced pair, a little higher. */
export const BB_C10 = v3(0, -2700, 3000);
const BB_MID = v3(0, -1300, -1900);

/* the rhythm section */
const PNO = seat(BB, 'pno.1');
const pnoF = frameOf(PNO);
/** The soundboard's middle (a 2.1 m grand: about half-way along, rim height). */
const PNO_BOARD = add(add(PNO.p, mul(pnoF.fwd, 330 + 2100 * 0.5)), v3(0, -950, 0));
/** Outside the curved side, level with the rim, 0.6 m out (C11: 30 cm–1 m), facing in under the lid. */
export const BB_PNO = spotAt(PNO_BOARD, unit(add(mul(pnoF.right, 1), v3(0, -0.08, 0))), 1300);
const CB = seat(BB, 'cb.1');
const cbF = frameOf(CB);
/** In front of the bass's strings, a little above the bridge (C06a: 15–30 cm). */
const CB_BRIDGE = add(add(add(CB.p, mul(cbF.fwd, 300)), mul(cbF.right, -120)), v3(0, -900, 0));
export const BB_CB = spotAt(CB_BRIDGE, inFrame(CB, 0.95, 0, 0.3), 230);
const GTR = seat(BB, 'gtr.1');
/** At the amp's speaker, about 3 cm from the grille at the dust cap's edge (C02: 1.5–5 cm); the cone sits about 7 cm behind the grille. */
const AMP = add(soundPoint(GTR), mul(frameOf(GTR).fwd, 70));
export const BB_AMP = spotAt(add(AMP, mul(frameOf(GTR).right, 50)), frameOf(GTR).fwd, 100);
/** A kit overhead about 1 m above the snare (M09), on a boom from behind the drummer's left. */
function kitOver(dr: Seat): { spot: Spot; foot: Vec3 } {
  const f = frameOf(dr);
  const sn = KIT_DRUMS.snare.c;
  const snare = add(add(add(dr.p, mul(f.right, sn.z + 110)), mul(f.fwd, sn.x + 770)), v3(0, -(KIT.floorY - sn.y), 0));
  const spot = spotAt(snare, unit(add(v3(0, -1, 0), mul(f.fwd, -0.12))), 1000);
  return { spot, foot: add(add(dr.p, mul(f.right, -650)), mul(f.fwd, -450)) };
}
export const BB_OH = kitOver(seat(BB, 'dr.1'));

/* the horseshoe */
export const HS_MS1 = v3(-1000, -1500, -2300);
export const HS_MS2 = v3(1000, -1500, -2300);
export const HS_SAX = ['sax.t1', 'sax.a2', 'sax.a1', 'sax.t2', 'sax.bari'].map((id) => saxSpot(seat(HS, id)));
export const HS_TBN = ['tbn.2', 'tbn.1', 'tbn.3', 'tbn.4'].map((id) => tbnSpot(seat(HS, id)));
export const HS_TPT = ['tpt.2', 'tpt.1', 'tpt.3', 'tpt.4'].map((id) => tptRibbon(seat(HS, id)));
export const HS_OH = kitOver(seat(HS, 'dr.1'));

export const E16_SURFACES = [
  targetSurface('t.a1', sectionPartId('rows', 'sax'), 'the lead alto sax', BB_A1.target, BB_A1.dir),
  targetSurface('t.two', sectionPartId('rows', 'sax'), 'two saxes', BB_SAX2[0].target, BB_SAX2[0].dir),
  targetSurface('t.htpt', sectionPartId('horseshoe', 'tpt'), 'a trumpet’s bell', HS_TPT[1].target, HS_TPT[1].dir),
];
const surf = (id: string) => E16_SURFACES.find((s) => s.id === id)!;
const PAIR_TYPES = ['arrCard', 'arrOmni', 'arrFig8'];

export const E16_ZONES: DocumentedZone[] = [
  mainZone({
    id: 'bb.main',
    label: 'In front of the horns, from an elevated view',
    band: 'Start a main horn pair about 2–3 m (6.5–10 ft) in front of the horn rows, from an approved elevated view (about 2.2–3 m up), then compare fore and aft and the height.',
    kind: 'trial',
    src: 'LESSON-BIGBAND',
    quote: 'start roughly 2–3 m in front of the horn rows from an approved elevated view (L64, a suggested trial); one hall example used a pair about 10 ft in front (S-SM27-XEP)',
    ref: 'front',
    d: [2000, 3000],
    box: { min: v3(-1000, -3000, 2000), max: v3(1000, -2200, 3000) },
    start: toward(BB_C, BB_MID),
    variants: ['rows'],
    micTypeIds: PAIR_TYPES,
    tendency: 'The band as one picture: closer, the saxes in front and the trumpets distant; higher and farther, the rows even out with more room.',
    checks: ['Quiet reeds against a full brass chord', 'The centre image', 'The mono sum'],
  }),
  targetZone({
    id: 'bb.sax',
    label: 'Close on the lead alto, body and bell',
    band: 'About 30–60 cm (12–24 in) out, with a view of the body’s tone holes and the bell, aimed above the bell rather than down into it.',
    src: 'LESSON-BIGBAND',
    quote: '30–60 cm from a view encompassing body tone holes and bell, with aim above the bell rather than only down its opening (L58, a suggested trial)',
    kind: 'trial',
    surface: surf('t.a1'),
    side: v3(0, 1, 0),
    d: [300, 600],
    coneMax: 35,
    aimMax: 25,
    start: BB_A1.pose,
    variants: ['rows'],
    micTypeIds: ['saxDynSuper', 'instDynCard', 'sdcCard'],
    tendency: 'The lead alto’s line with its body and bell; the neighbouring saxes behind it, a little off its axis.',
    checks: ['Low and high notes', 'Key noise and standing up for a solo', 'The trumpets above it'],
    prov: ill('beside and above the bell, up to 35° round it: the lab’s cone'),
  }),
  targetZone({
    id: 'bb.two',
    label: 'One mic for two neighbouring saxes',
    band: 'About 0.8–1.2 m (2.5–4 ft) from the two players’ shared middle, in front and a little above — then compare their passages one at a time.',
    src: 'LESSON-BIGBAND',
    quote: 'put the capsule roughly 0.8–1.2 m from their combined target area (L61, a suggested trial)',
    kind: 'trial',
    surface: surf('t.two'),
    side: v3(1, 0, 0),
    d: [800, 1200],
    coneMax: 30,
    aimMax: 25,
    start: BB_SAX2[0].pose,
    variants: ['rows'],
    micTypeIds: ['sdcCard', 'arrCard'],
    tendency: 'Both players together, with less clutter; the nearer or more on-axis player tends to dominate.',
    checks: ['Each player’s passage alone', 'Their balance together', 'A solo may still need its own mic'],
    prov: ill('in front and above, up to 30° round it: the lab’s cone'),
  }),
  mainZone({
    id: 'hs.main',
    label: 'Inside the U, at about head height',
    band: 'Inside the U, a pair at about the players’ head height or a little above, each facing the side it covers.',
    kind: 'sourced',
    src: 'S-BREIT',
    quote: 'Two Mid-Side stereo setups positioned "inside the U" (Breitberg’s horseshoe); their heights are drawing defaults',
    ref: 'floor',
    d: [1300, 2000],
    box: { min: v3(-1500, -2000, -3000), max: v3(1500, -1300, -1600) },
    start: toward(HS_MS1, v3(-2400, -1000, -2300)),
    variants: ['horseshoe'],
    micTypeIds: ['arrCard', 'arrFig8', 'arrOmni'],
    tendency: 'Each side of the U as its own picture, the players facing in; the rest of the band arrives from the sides and behind.',
    checks: ['Each section alone, then the band', 'The drums from inside the U', 'Mid and Side in mono'],
    bandProv: ill('Breitberg gives no height: the lab draws 1.3–2 m'),
  }),
  targetZone({
    id: 'hs.tpt',
    label: 'A ribbon in front of each trumpet',
    band: 'About 30–60 cm (1–2 ft) from the bell, a little below its line, the ribbon’s sides toward the neighbours.',
    src: 'ROY-BRASS',
    quote: 'one R-121 per musician at a distance of 1 to 2 feet; about 6 inches below the line of sight of the bell (solo)',
    kind: 'sourced',
    surface: surf('t.htpt'),
    side: v3(1, 0, 0),
    d: [300, 610],
    coneMax: 30,
    aimMax: 25,
    start: HS_TPT[1].pose,
    variants: ['horseshoe'],
    micTypeIds: ['lbRibbon', 'instDynCard'],
    tendency: 'A rounder brass tone, its sides rejecting the players beside it; its back also hears — here, the drums across the U.',
    checks: ['The blast of air: keep the ribbon off the bell’s axis', 'The neighbours in its sides', 'What its back hears'],
    prov: ill('below the bell line, up to 30° round it: the lab’s cone'),
  }),
];

const views = stageViews([BB, HS]);
export const E16_MODEL = ensembleModel({
  id: 'e16-bigband',
  name: 'big band on its stage',
  variants: [
    { id: 'rows', label: 'Saxes, trombones, trumpets in rows', short: 'Rows', blurb: BB.blurb, seating: BB },
    { id: 'horseshoe', label: 'A horseshoe in the studio', short: 'Horseshoe', blurb: HS.blurb, seating: HS },
  ],
  views,
  viewsByVariant: { rows: stageViews([BB], { zMax: 3400, hMax: 3200 }), horseshoe: stageViews([HS], { hMax: 2600 }) },
  extraSurfaces: E16_SURFACES,
});

/** A floor wedge in front of the saxes, facing them (a drawing default). */
export const E16_WEDGES: Wedge[] = [
  { id: 'mon', label: 'a floor wedge in front of the saxes', short: 'MONITOR', p: v3(500, 0, 900), lift: 300, faces: unit(v3(-0.3, 0, -1)), note: 'A floor wedge facing the sax row: turn the lead alto’s mic so the wedge sits in its rejection.', prov: ill('a typical position: a drawing default') },
];

/* ── STARTING SETUPS ── */
type Art = 'instDynamic' | 'smallDynamic' | 'sdc' | 'sideLdc' | 'ribbon';
const sgl = (key: string, s: Spot, label: string, o: { pattern?: 'cardioid' | 'supercardioid' | 'figure8'; art?: Art; foot?: Vec3 } = {}) => {
  const art = o.art ?? 'instDynamic';
  return { key, p: s.p, aim: s.aim, pattern: o.pattern ?? ('cardioid' as const), label, art, len: art === 'sdc' ? 104 : art === 'sideLdc' || art === 'ribbon' ? 60 : 150, cross: art === 'sdc' ? 21 : art === 'sideLdc' || art === 'ribbon' ? 160 : 38, ...(o.foot ? { foot: o.foot } : {}) };
};
const ribbon = { pattern: 'figure8' as const, art: 'ribbon' as const };
const SAX_IDS = ['T1', 'A2', 'A1', 'T2', 'BARI'];
const BB_SAX_M = BB_SAX.map((s, i) => sgl(`sx${i}`, s, `SAX ${SAX_IDS[i]}`, { pattern: 'supercardioid', art: 'smallDynamic' }));
const BB_TBN_M = BB_TBN.map((s, i) => sgl(`tb${i}`, s, `TBN ${['2', '1', '3', '4'][i]}`, ribbon));
const BB_TPT_M = BB_TPT.map((s, i) => sgl(`tp${i}`, s, `TPT ${['2', '1', '3', '4'][i]}`, { foot: tptFoot(seatsOf(BB, 'tpt')[i]) }));
const BB_RHYTHM = [sgl('pno', BB_PNO, 'PIANO', { art: 'sdc' }), sgl('cb', BB_CB, 'BASS', { art: 'sdc' }), sgl('amp', BB_AMP, 'GUITAR AMP'), sgl('oh', BB_OH.spot, 'KIT', { art: 'sdc', foot: BB_OH.foot })];
const bbRig = (id: 'xy' | 'ab' | 'ortf', c: Vec3, params = {}) => ({ id, params, place: { c, face: 0, tilt: 25 }, mount: { kind: 'stand' as const } });
const hsRig = (c: Vec3, face: number) => ({ id: 'ms' as const, params: {}, place: { c, face, tilt: 10 }, mount: { kind: 'stand' as const } });
const HS_ALL = [
  ...HS_SAX.map((s, i) => sgl(`sx${i}`, s, `SAX ${SAX_IDS[i]}`, ribbon)),
  ...HS_TBN.map((s, i) => sgl(`tb${i}`, s, `TBN ${['2', '1', '3', '4'][i]}`, ribbon)),
  ...HS_TPT.map((s, i) => sgl(`tp${i}`, s, `TPT ${['2', '1', '3', '4'][i]}`, ribbon)),
];

export const E16_SETUPS: EnsembleSetup[] = [
  { id: 'bbPair', role: 'MAIN PAIR · COINCIDENT', title: 'An X/Y pair in front of the horns', variants: ['rows'], rig: bbRig('xy', BB_C), mics: 'Two matched cardioid small condensers, capsules together, on one tall stand.', start: 'About 2–3 m (6.5–10 ft) in front of the horn rows, from an elevated view about 2.4 m up; 90° to start.', line: 'A concert perspective: the rows as the hall hears them. Section balance depends on the seating and this position — fixes are limited.', core: true, view: 'section' },
  { id: 'bbHall', role: 'MAIN PAIR · SPACED', title: 'A spaced pair about 3 m out', variants: ['rows'], rig: bbRig('ab', BB_C10, { spacing: 500 }), mics: 'Two omni small condensers, 50 cm (20 in) apart on one bar.', start: 'About 3 m (10 ft) in front of the horns, about 2.7 m up — one hall’s example, not a fixed rule.', line: 'More room and width; listen for a weak middle and check mono with the full band.', core: true, view: 'section' },
  { id: 'bbRhythm', role: 'MAIN PAIR + RHYTHM SUPPORT', title: 'The pair with the rhythm section’s mics', variants: ['rows'], rig: bbRig('xy', BB_C), singles: BB_RHYTHM, mics: 'The X/Y pair, plus a condenser outside the piano’s curve, one in front of the bass, a dynamic on the guitar amp and one overhead above the kit.', start: 'Piano 30 cm–1 m outside its curve, level with the rim; bass 15–30 cm in front of the strings above the bridge; amp 1.5–5 cm from the grille; the overhead about 1 m over the snare.', line: 'The concert view with clearer bass, piano and time; each support only for a stated need.', core: true, view: 'plan' },
  { id: 'bbSections', role: 'SECTION MICS', title: 'A mic for every two horns', variants: ['rows'], singles: [...BB_SAX2.map((s, i) => sgl(`s${i}`, s, i === 2 ? 'BARI' : 'SAXES', { art: 'sdc' })), ...BB_TBN_M, ...BB_TPT2.map((s, i) => sgl(`t${i}`, s, 'TRUMPETS', { art: 'sdc', foot: tpt2Foot(s) }))], mics: 'Cardioid condensers shared by two saxes and two trumpets, the baritone on its own; a ribbon on each trombone, its sides toward the neighbours.', start: 'Shared mics 0.8–1.2 m from the two players’ middle; the trumpets’ on stands between the trombone chairs; the ribbons 30–60 cm from each trombone bell, above the slide.', line: 'A middle ground: some control per section with fewer mics. The nearest player can dominate a shared mic.', core: true, view: 'plan' },
  { id: 'bbEach', role: 'ONE MIC PER HORN + THE PAIR', title: 'A mic on every horn, and the pair', variants: ['rows'], rig: bbRig('xy', BB_C), singles: [...BB_SAX_M, ...BB_TBN_M, ...BB_TPT_M], mics: 'Supercardioid dynamics beside each sax, a ribbon on each trombone, cardioid dynamics on the trumpets — plus the X/Y pair.', start: 'Saxes 30–60 cm with a view of body and bell; trombones 30–60 cm above the slide; trumpets 30–50 cm, a little off the bell’s axis, on stands on the riser.', line: 'Detailed balance for changing soloists or a loud stage — more spill paths and open channels; individual tones must still blend.', core: true, view: 'plan' },
  { id: 'bbOrtf', role: 'MAIN PAIR · NEAR-COINCIDENT', title: 'A 17 cm, 110° pair in front of the horns', variants: ['rows'], rig: bbRig('ortf', BB_C), mics: 'Two cardioid small condensers 17 cm (6.7 in) apart, 110° between them.', start: 'The same place as the X/Y; move the whole pair, never its spacing.', line: 'A wider picture from time and level; check the ends of the rows and mono.', core: false, view: 'plan' },
  { id: 'hsMS', role: 'TWO MID-SIDE PAIRS', title: 'Two M/S pairs inside the U', variants: ['horseshoe'], rig: hsRig(HS_MS1, 270), extraRigs: [hsRig(HS_MS2, 90)], mics: 'Two M/S pairs: each a forward cardioid (Mid) with a sideways figure-8 (Side) just above it.', start: 'Inside the U at about head height, one facing the saxes, one facing the trombones.', line: 'Each side of the U as its own stereo picture. They do not make every close mic phase-coherent by themselves — check in mono.', core: true, view: 'plan' },
  { id: 'hsRibbons', role: 'A RIBBON ON EACH HORN + THE M/S PAIRS', title: 'A figure-8 ribbon on every horn', variants: ['horseshoe'], rig: hsRig(HS_MS1, 270), extraRigs: [hsRig(HS_MS2, 90)], singles: HS_ALL, mics: 'A figure-8 ribbon on each horn, its sides toward the players beside it, with the two M/S pairs.', start: 'About 30–60 cm from each bell (the trumpets a little below the bell line), the sides toward the neighbours.', line: 'Separation from the figure-8’s sides; its back still hears — check what lies behind each ribbon, and keep it out of the bell’s blast of air.', core: true, view: 'plan' },
  { id: 'hsOne', role: 'ONE M/S PAIR', title: 'One M/S pair in the middle of the U', variants: ['horseshoe'], rig: hsRig(v3(0, -1600, -2000), 0), mics: 'One M/S pair: a forward cardioid with a sideways figure-8 above it.', start: 'In the middle of the U at about head height, facing the drums; the Side’s lobes toward the saxes and the trombones.', line: 'The whole U from its middle — the smallest plan, a starting reference before the spots.', core: true, view: 'plan' },
  { id: 'hsKit', role: 'RHYTHM · THE KIT', title: 'One overhead above the kit', variants: ['horseshoe'], rig: hsRig(v3(0, -1600, -2000), 0), singles: [sgl('oh', HS_OH.spot, 'KIT', { art: 'sdc', foot: HS_OH.foot })], mics: 'The M/S pair, plus one condenser about 1 m above the snare, aimed down.', start: 'Establish the kit’s balance with the overhead first; add close drum mics only as needed.', line: 'Ride, hi-hat and brushes audible without swamping the horns.', core: true, view: 'section' },
];

export const E16_PLACE: PlaceZone[] = [
  { id: 'pz.bb.near', label: 'Nearer: 2–2.5 m in front', band: 'About 2–2.5 m (6.5–8 ft) in front of the horn rows, 2.2–3 m (7–10 ft) up.', box: { min: v3(-1000, -3000, 2000), max: v3(1000, -2200, 2500) }, variants: ['rows'], tendency: 'The saxes nearer and clearer; the trumpets farther back.' },
  { id: 'pz.bb.far', label: 'Farther: 2.5–3 m in front', band: 'About 2.5–3 m (8–10 ft) in front, 2.2–3 m (7–10 ft) up.', box: { min: v3(-1000, -3000, 2500), max: v3(1000, -2200, 3000) }, variants: ['rows'], tendency: 'The rows more even, with more of the room.' },
  { id: 'pz.hs.sax', label: 'Inside the U, toward the saxes', band: 'Inside the U on the saxes’ side, at about head height (1.3–2 m).', box: { min: v3(-1500, -2000, -3000), max: v3(-300, -1300, -1600) }, variants: ['horseshoe'], tendency: 'The saxes close and clear; the trombones across the U.' },
  { id: 'pz.hs.mid', label: 'Inside the U, in the middle', band: 'In the middle of the U, at about head height (1.3–2 m).', box: { min: v3(-300, -2000, -3000), max: v3(300, -1300, -1600) }, variants: ['horseshoe'], tendency: 'Both sides more evenly, with the drums ahead.' },
];
