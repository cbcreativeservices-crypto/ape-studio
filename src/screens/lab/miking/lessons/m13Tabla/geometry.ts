/**
 * M13 TABLA — where things are (charter §2 layer 2), frame H (model.ts).
 *
 *   per drum: B (base centre, on its support ring), u (axis, up and tilted
 *   toward the audience), H (head centre = B + height·u), the head's radius
 *   and its black patch (centred on the dayan; off-centre toward the player
 *   on the bayan)
 *   MID  the area between the two heads (the shared-mic target)
 *
 * Solids: one cylinder per drum (its widest radius, base to head). The art,
 * the taps, the zones and the readouts read only these anchors.
 */
import type { DocumentedZone, InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { DEG, add, approachPose, aimTo, headBandPolys, mul, sectorPolys, sub, unit, v3 } from '../shared/handGeom.ts';
import { TABLA as D, type DrumId } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const trial = (note: string): Provenance => ({ kind: 'trial', src: 'LESSON-M13', note });
const AUD = v3(1, 0, 0);
const UP = v3(0, -1, 0);

export type TablaDrum = { id: DrumId; B: Vec3; u: Vec3; H: Vec3; height: number; maxR: number; headR: number; patchR: number; patchC: Vec3; tiltDeg: number; ex: Vec3 };

function drum(id: DrumId): TablaDrum {
  const dayan = id === 'dayan';
  const tilt = (dayan ? D.dayanTilt.mm : D.bayanTilt.mm) * DEG;
  const u = v3(Math.sin(tilt), -Math.cos(tilt), 0);
  const B = v3(-40, -D.ringH.mm, dayan ? D.dayanZ.mm : D.bayanZ.mm);
  const height = dayan ? D.dayanH.mm : D.bayanH.mm;
  const H = add(B, mul(u, height));
  const headR = (dayan ? D.dayanHeadD.mm : D.bayanHeadD.mm) / 2;
  // The head's in-plane direction toward the audience (square to u).
  const ex = unit(sub(AUD, mul(u, u.x)));
  const patchR = headR * (dayan ? D.dayanPatch.mm : D.bayanPatch.mm);
  const patchC = dayan ? H : add(H, mul(ex, -headR * D.bayanOffset.mm));
  return { id, B, u, H, height, maxR: (dayan ? D.dayanW.mm : D.bayanW.mm) / 2, headR, patchR, patchC, tiltDeg: tilt / DEG, ex };
}

export const DAYAN = drum('dayan');
export const BAYAN = drum('bayan');
export const DRUMS: readonly TablaDrum[] = [DAYAN, BAYAN];
/** The area between the heads (the shared mic's target). */
export const MID: Vec3 = mul(add(DAYAN.H, BAYAN.H), 0.5);

const CLEAR = { mm: 10, prov: ill('keep the mic off the drums: 10 mm is the lab’s margin (no source gives one)') };
const EZ = v3(0, 0, 1);

const parts: Part[] = [
  { id: 'ta.dayanHead', label: 'dayan head', short: 'dayan head', role: 'The smaller drum’s head, on the player’s right here. It rings with a clear pitch; ringing and damped strokes both live here.', prov: D.dayanHeadD.prov },
  { id: 'ta.dayanPatch', label: 'black patch (dayan, centred)', short: 'dayan patch', role: 'The black patch (syahi), built up in layers at the middle of the dayan’s head. Its weight is what lets the dayan ring with a clear pitch.', prov: D.dayanPatch.prov },
  { id: 'ta.dayanBody', label: 'dayan body (wood)', short: 'dayan body', role: 'The dayan’s wooden shell: a thick, near-cylindrical body.', solid: { kind: 'cyl', a: DAYAN.B, b: DAYAN.H, r: DAYAN.maxR }, clearance: CLEAR, prov: D.dayanW.prov },
  { id: 'ta.dayanLacing', label: 'lacing and tuning blocks', short: 'lacing', role: 'Straps laced from the head’s braided rim to the base, over wooden blocks that are tapped to tune the dayan. Tuning is the player’s, never the engineer’s.', prov: ill('lacing drawn generically') },
  { id: 'ta.bayanHead', label: 'bayan head', short: 'bayan head', role: 'The larger drum’s head, on the player’s left here. The player presses it with the heel of the hand to bend the pitch — the hand moves across it all the time.', prov: D.bayanHeadD.prov },
  { id: 'ta.bayanPatch', label: 'black patch (bayan, off-centre)', short: 'bayan patch', role: 'The bayan’s black patch sits OFF-centre (drawn here toward the player) — unlike the dayan’s.', prov: D.bayanOffset.prov },
  { id: 'ta.bayanBody', label: 'bayan body (metal kettle)', short: 'bayan body', role: 'The bayan’s kettle-shaped body — metal in the museum’s pair; clay in some others.', solid: { kind: 'cyl', a: BAYAN.B, b: BAYAN.H, r: BAYAN.maxR }, clearance: CLEAR, prov: D.bayanW.prov },
  { id: 'ta.rings', label: 'support rings', short: 'rings', role: 'Cloth rings the drums sit in, steady and tilted toward the player. Keep cables away from them.', prov: D.ringH.prov },
];

const handBox = (d: TablaDrum, half: number) => ({ kind: 'box' as const, min: v3(d.H.x - 230, d.H.y - 160, d.H.z - half), max: v3(d.H.x + 30, d.H.y + 10, d.H.z + half) });
const envelopes = [
  { id: 'env.handR', label: 'the player’s right hand', shape: handBox(DAYAN, DAYAN.headR + 22), prov: ill('the hand’s reach over the dayan: a drawing default') },
  { id: 'env.handL', label: 'the player’s left hand', shape: handBox(BAYAN, BAYAN.headR + 22), prov: ill('the hand’s reach over the bayan, pressing and sliding: a drawing default') },
  { id: 'env.body', label: 'the player', shape: { kind: 'box' as const, min: v3(-850, -950, -380), max: v3(-300, 0, 380) }, prov: ill('a player seated on the floor: a drawing default') },
  { id: 'env.legs', label: 'the player’s folded legs', shape: { kind: 'box' as const, min: v3(-520, -220, -480), max: v3(-170, 0, 480) }, prov: ill('folded legs in front of the player: a drawing default') },
];

/** A close mic over one head: `along` mm above its plane, offset in the head's
 *  plane, aimed at a point on the head (toward the outer side: "angled for
 *  isolation between the mics"). */
function overHead(d: TablaDrum, along: number, toAud: number, toOther: number, aimOuter: number) {
  const out = d.id === 'dayan' ? EZ : mul(EZ, -1);
  const p = add(add(add(d.H, mul(d.u, along)), mul(d.ex, toAud)), mul(out, -toOther));
  const target = add(d.H, mul(out, aimOuter));
  return { p, ...aimTo(p, target) };
}

const closeZone = (d: TablaDrum): DocumentedZone => ({
  id: `ta.${d.id}.close`,
  label: d.id === 'dayan' ? 'Close over the dayan' : 'Close over the bayan',
  band: `About 7.5–10 cm (3–4 in) from the ${d.id}’s head, angled so the two mics point away from each other — clear of the hand.`,
  kind: 'sourced',
  src: 'S-DUVEL',
  quote: 'Two KSM137s, positioned 3–4" from the drumhead, angled for isolation between the mics.',
  refSurface: `${d.id}Head`,
  side: 'outside',
  distance: { min: 76.2, max: 101.6 },
  radial: { line: `${d.id}Axis`, max: d.headR + 20, prov: ill('over the head: within its radius + 2 cm of its axis') },
  aim: { maxOffAxis: 50, prov: ill('"angled for isolation": up to 50° off the head’s line is the lab’s tolerance') },
  requires: { micTypeIds: ['sdcCard', 'instDynCard'] },
  start: overHead(d, 89, 45, 30, d.headR * 0.45),
  draw: headBandPolys(d.H, d.u, d.headR + 20, 76.2, 101.6),
  tendency: d.id === 'dayan' ? 'Close detail of the dayan’s ringing and damped strokes, with some of the bayan too. Close in, quiet tabla can carry in a mix.' : 'Close detail of the bayan’s low tones and pitch glides, with some of the dayan too. Check that the moving hand never blocks or knocks the mic.',
  checks: ['The hand’s whole path, pitch gestures included', 'How much of the other drum it hears', 'The pair in mono'],
});

const fartherZone = (d: TablaDrum): DocumentedZone => ({
  id: `ta.${d.id}.B`,
  label: d.id === 'dayan' ? 'A little farther over the dayan' : 'A little farther over the bayan',
  band: `For a less intrusive start, try about 15–25 cm (6–10 in) from the ${d.id}’s head, then come closer only as the hand’s path and the sound allow.`,
  kind: 'trial',
  src: 'LESSON-M13',
  quote: 'Method B: begin farther back at 15–25 cm from each head, then approach only as clearance and the sound permit',
  refSurface: `${d.id}Head`,
  side: 'outside',
  distance: { min: 150, max: 250 },
  radial: { line: `${d.id}Axis`, max: d.headR + 90, prov: ill('a viewpoint over or beside the head: within its radius + 9 cm of its axis') },
  aim: { maxOffAxis: 45, prov: ill('aimed across the head: ±45° is the lab’s tolerance') },
  start: overHead(d, 200, 70, 20, d.headR * 0.3),
  draw: headBandPolys(d.H, d.u, d.headR + 90, 150, 250),
  tendency: 'A gentler, more open sound of this drum, with more of its partner. Compare a target between the patch and the outer head with one the player suggests.',
  checks: ['The hand’s path stays clear', 'Ringing against damped strokes', 'The other drum’s share'],
});

const sector = (o: { id: string; label: string; band: string; quote: string; d: [number, number]; a: [number, number]; aim: number; start: [number, number]; tendency: string; checks: string[] }): DocumentedZone => ({
  id: o.id,
  label: o.label,
  band: o.band,
  kind: 'trial',
  src: 'LESSON-M13',
  quote: o.quote,
  refSurface: 'pair',
  side: 'outside',
  distance: { min: o.d[0], max: o.d[1] },
  cone: { min: o.a[0], max: o.a[1], toward: AUD, prov: trial('"above and in front of" / "from the set": the audience side, these angles from straight up, are the lab’s drawing') },
  aim: { maxOffAxis: o.aim, prov: ill('aimed at the pair: the lab’s tolerance') },
  start: approachPose(MID, UP, AUD, o.start[0], o.start[1]),
  draw: sectorPolys(MID, UP, AUD, o.d[0], o.d[1], o.a[0], o.a[1]),
  tendency: o.tendency,
  checks: o.checks,
});

export const TABLA_ZONES: DocumentedZone[] = [
  closeZone(DAYAN),
  closeZone(BAYAN),
  fartherZone(DAYAN),
  fartherZone(BAYAN),
  sector({
    id: 'ta.A',
    label: 'One mic above and in front of the pair',
    band: 'Start about 30–50 cm (12–20 in) above and in front of the area between the heads, aimed at the pair — from the audience side.',
    quote: 'Method A: one cardioid microphone 30–50 cm above and in front of the area between the heads, aimed toward the pair',
    d: [300, 500],
    a: [20, 60],
    aim: 25,
    start: [400, 40],
    tendency: 'Both drums in one simple picture. If one dominates, move the mic toward the weaker drum, or change its view in small steps — moving it is different from only turning it.',
    checks: ['Both hands’ full paths clear', 'Each drum alone, then together', 'Room spill'],
  }),
  sector({
    id: 'ta.C',
    label: 'An X/Y pair, farther back',
    band: 'For a studio stereo picture, try a coincident X/Y pair about 50–80 cm (20–31 in) from the set, centred on it.',
    quote: 'Method C: [as a trial] place the pair 50–80 cm from the tabla set, with the array centered on the musical source',
    d: [500, 800],
    a: [35, 75],
    aim: 25,
    start: [650, 55],
    tendency: 'A stereo picture of the pair with some room. Check the image and the mono fold-down; spreading the two drums hard left and right is not the aim.',
    checks: ['The image position', 'The mono fold-down', 'Whether stereo earns its place'],
  }),
  sector({
    id: 'ta.D',
    label: 'A room mic',
    band: 'In a good studio room, try a separate mic about 1–2 m (3–6½ ft) away, placed by the room’s sound — blended in softly.',
    quote: 'Method D: test an additional room microphone roughly 1–2 m away, choosing its actual position by the room sound',
    d: [1000, 2000],
    a: [30, 85],
    aim: 35,
    start: [1050, 65],
    tendency: 'The room around the pair. If it blurs the rhythm or turns the sound hollow, lower it, move it or leave it out. On stage it is a capture-only channel, not a PA feed.',
    checks: ['Rhythmic detail kept', 'The blend in mono', 'Kept out of the PA live'],
  }),
];

export const TABLA_MODEL: InstrumentModel = {
  id: 'tabla',
  name: 'tabla pair (dayan and bayan)',
  parts,
  regions: [
    { id: 'r.dayan', partId: 'ta.dayanHead', label: 'the dayan', anchor: DAYAN.H, prov: D.dayanHeadD.prov, note: 'The dayan’s head: ringing and damped strokes, a clear pitch.' },
    { id: 'r.bayan', partId: 'ta.bayanHead', label: 'the bayan', anchor: BAYAN.H, prov: D.bayanHeadD.prov, note: 'The bayan’s head: the low tones and the pressure glides.' },
  ],
  surfaces: [
    { id: 'dayanHead', partId: 'ta.dayanHead', label: 'the dayan head', point: DAYAN.H, normal: DAYAN.u },
    { id: 'bayanHead', partId: 'ta.bayanHead', label: 'the bayan head', point: BAYAN.H, normal: BAYAN.u },
    { id: 'pair', partId: 'ta.dayanHead', label: 'the pair', point: MID, normal: UP, target: true },
  ],
  lines: [
    // First (the readouts' default): the line up through the middle of the pair.
    { id: 'pairLine', label: 'the pair’s midline', point: MID, dir: UP },
    { id: 'dayanAxis', label: 'the dayan’s axis', point: DAYAN.H, dir: DAYAN.u },
    { id: 'bayanAxis', label: 'the bayan’s axis', point: BAYAN.H, dir: BAYAN.u },
  ],
  envelopes,
  variants: [{ id: 'pair', label: 'RIGHT-HANDED', blurb: 'The dayan on the player’s right, the bayan on the left — a left-handed player may set them the other way round. Name each drum by what it is, not by “left” or “right”.' }],
  defaultVariant: 'pair',
  views: { side: { u0: -850, u1: 1100, v0: -1150, v1: 40 }, top: { u0: -850, u1: 1100, v0: -560, v1: 560 } },
  viewTags: { side: 'FROM THE PLAYER’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: 0, prov: ill('frame H: the floor is y = 0') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { pair: null },
};
