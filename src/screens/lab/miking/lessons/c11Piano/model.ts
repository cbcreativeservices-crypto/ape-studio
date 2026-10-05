/**
 * C11 PIANO (grand, baby grand, upright) — the technical truth (charter §2
 * layer 1). Source keys point into docs/labs/miking/acoustic_piano/SOURCES.md
 * (and acoustic_guitar/SOURCES.md §0 for the shared Lab 4 keys); the
 * geometry follows acoustic_piano/GEOMETRY_PROPOSAL.md through the shared
 * piano family (lessons/shared/piano/pianoSpec.ts).
 *
 * ONE LESSON, a piano-type selector (decision 2026-10-05, CORRECTIONS_LOG
 * C11-D1): the grand, the baby grand and the upright share the journey, the
 * mic choice, the mono check and the safety rules; what differs — where the
 * strings are, which starting points exist, the lid or the panels — is the
 * selector's job. Five set-ups: a grand on the full stick, on the short
 * stick, a baby grand, an upright with its top open, and with its upper
 * front panel off.
 *
 * LESSON FRAME K (pianoSpec.ts): origin = the hammer strike line at the
 * keyboard's middle, at a grand's string height; +x away from the pianist;
 * +y DOWN (the floor at y = 780); +z toward the treble.
 */
import type { DocumentedZone, MicPose, Provenance, Vec3, ViewId, ZoneDraw } from '../../engine/model/types.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { grandGeom, uprightGeom, type GrandId, type LidState } from '../shared/piano/pianoSpec.ts';

export type PianoVariant = 'grand' | 'short' | 'baby' | 'upright' | 'uprightFront';
export const GRAND_VARIANTS: readonly PianoVariant[] = ['grand', 'short', 'baby'];
export const UPRIGHT_VARIANTS: readonly PianoVariant[] = ['upright', 'uprightFront'];

/** What each set-up draws: the grand model and its lid, or the upright and
 *  its upper front panel. */
export const SETUP: Record<PianoVariant, { kind: 'grand'; id: GrandId; lid: LidState } | { kind: 'upright'; panel: boolean }> = {
  grand: { kind: 'grand', id: 'B', lid: 'full' },
  short: { kind: 'grand', id: 'B', lid: 'short' },
  baby: { kind: 'grand', id: 'S', lid: 'full' },
  upright: { kind: 'upright', panel: true },
  uprightFront: { kind: 'upright', panel: false },
};

export const GB = grandGeom('B');
export const GS = grandGeom('S');
export const UP = uprightGeom();

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

const DEG = Math.PI / 180;
/** A pose whose front is at p, aimed along the unit direction d. */
export function aimedAlong(p: Vec3, d: Vec3): MicPose {
  const l = Math.hypot(d.x, d.y, d.z);
  const u = { x: d.x / l, y: d.y / l, z: d.z / l };
  // aimVec(az, el) = (−cos az cos el, −sin el, sin az cos el).
  const el = -Math.asin(u.y) / DEG;
  const az = Math.atan2(u.z, -u.x) / DEG;
  return { p, az, el };
}
/** A pose at p aimed at the point t. */
export function aimedAt(p: Vec3, t: Vec3): MicPose {
  return aimedAlong(p, { x: t.x - p.x, y: t.y - p.y, z: t.z - p.z });
}

/* ── the register bands at the hammer line (proposal §2: drawing defaults —
 *  the real split is UNKNOWN; the bass strings cross over) ── */
export const BANDS = { bass: [-609, -200], middle: [-200, 200], treble: [200, 609] } as const;

const IN = 25.4;
const shureGrand = (row: string): Provenance => src('S-REC', row);
const tol = ill('a ±5 cm band round the guide’s single figure: the lab’s drawing of “about”');


/** How a curve zone is drawn: from above, a ring sector out from the curve
 *  point, round its outward direction (±25°); from the side, the band of x
 *  it covers and its heights (the same numbers as the zone). */
function curveDrawn(g: typeof GB): Partial<Record<ViewId, ZoneDraw>> {
  const a = (Math.atan2(g.curve.n.z, g.curve.n.x) * 180) / Math.PI;
  return {
    top: { cu: g.curve.p.x, cv: g.curve.p.z, r0: 300, r1: 1000, a0: a - 25, a1: a + 25 },
    side: { u0: g.curve.p.x + 300 * g.curve.n.x, u1: g.curve.p.x + 1000 * g.curve.n.x, v0: g.rimTop - 450, v1: g.rimTop + 100 },
  };
}
/** A sound-hole zone: the hole's circle from above, the heights above it from the side. */
function holeDrawn(g: typeof GB): Partial<Record<ViewId, ZoneDraw>> {
  const h = g.holes[0].c;
  return { top: { cu: h.x, cv: h.z, r0: 0, r1: 85, a0: 0, a1: 360 }, side: { u0: h.x - 85, u1: h.x + 85, v0: -300, v1: -120 } };
}

/* ── RECOMMENDED STARTING POINTS. Learner-facing: label, band, tendency,
 *  checks (starting-points voice, owner ruling 2026-10-04). `kind`, `src`,
 *  `quote` and every `prov` are the internal record. ── */
const DYN_OR_COND = ['sdcCard', 'instDynCard'];
const COND = ['sdcCard'];

export const PIANO_ZONES: DocumentedZone[] = [
  {
    id: 'gp.over',
    label: 'Over the middle strings, back from the hammers',
    band: 'Start about 30 cm (12 in) above the middle strings and about 20 cm (8 in) back from the hammer line, lid on the full stick (or off).',
    kind: 'sourced',
    src: 'S-REC',
    quote: '12 inches above middle strings, 8 inches horizontally from hammers with lid off or at full stick',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 12 * IN - 50, max: 12 * IN + 50 },
    bandProv: tol,
    radial: { line: 'hammers', min: 8 * IN - 50, max: 8 * IN + 50, prov: tol },
    requires: { variants: ['grand', 'baby'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 50, prov: ill('“above … strings”: the lab counts a front within 50° of straight down at them') },
    box: { min: { x: -1000, y: -1000, z: BANDS.middle[0] }, max: { x: 1000, y: 0, z: BANDS.middle[1] }, prov: ill('the middle band at the hammer line (drawing default)') },
    drawn: { side: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: -12 * IN - 50, v1: -12 * IN + 50 }, top: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: BANDS.middle[0], v1: BANDS.middle[1] } },
    start: { p: { x: 8 * IN, y: -12 * IN, z: 0 }, az: 0, el: -70 },
    tendency: 'A balanced, direct view of the middle of the keyboard. Nearer the hammers tends to bring more attack and mechanism; farther back, a softer attack. Move it and listen.',
    checks: ['The lid on its stick, set by someone who knows the piano, before anything goes under it', 'Clear of the strings, dampers, hammers and the lid', 'Low, middle and high passages: is one register missing?'],
  },
  {
    id: 'gp.treble',
    label: 'Over the treble strings',
    band: 'Start about 20 cm (8 in) above the treble strings, about 20 cm (8 in) back from the hammer line.',
    kind: 'sourced',
    src: 'S-REC',
    quote: '8 inches above treble strings, as above (8 inches horizontally from hammers with lid off or at full stick)',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 8 * IN - 50, max: 8 * IN + 50 },
    bandProv: tol,
    radial: { line: 'hammers', min: 8 * IN - 50, max: 8 * IN + 50, prov: tol },
    requires: { variants: ['grand', 'baby'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 50, prov: ill('“above … strings”: a front within 50° of straight down') },
    box: { min: { x: -1000, y: -1000, z: BANDS.treble[0] }, max: { x: 1000, y: 0, z: BANDS.treble[1] }, prov: ill('the treble band at the hammer line (drawing default)') },
    drawn: { side: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: -8 * IN - 50, v1: -8 * IN + 50 }, top: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: BANDS.treble[0], v1: BANDS.treble[1] } },
    start: { p: { x: 8 * IN, y: -8 * IN, z: 400 }, az: 0, el: -70 },
    tendency: 'More of the upper strings’ articulation. On its own it can leave the bass thin — the treble half of a split pair.',
    checks: ['Clearance from the lid, the stick and the dampers', 'Paired with a bass mic? Check the two in mono'],
  },
  {
    id: 'gp.bass',
    label: 'Over the bass strings, a little farther back',
    band: 'Start about 20 cm (8 in) above the bass strings and about 35 cm (14 in) back from the hammer line — moved back from the treble mic’s position.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'Moving “low” mic away from keyboard six inches provides truer reproduction of the bass strings while reducing damper noise.',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 8 * IN - 50, max: 8 * IN + 50 },
    bandProv: ill('the height is the treble mic’s 8 in (the guide gives the bass mic’s move only): a ±5 cm band'),
    radial: { line: 'hammers', min: 14 * IN - 50, max: 14 * IN + 50, prov: ill('8 in + the guide’s 6 in farther from the keyboard = 14 in, ±5 cm') },
    requires: { variants: ['grand', 'baby'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 50, prov: ill('a front within 50° of straight down') },
    box: { min: { x: -1000, y: -1000, z: BANDS.bass[0] }, max: { x: 1500, y: 0, z: BANDS.bass[1] }, prov: ill('the bass band at the hammer line (drawing default)') },
    drawn: { side: { u0: 14 * IN - 50, u1: 14 * IN + 50, v0: -8 * IN - 50, v1: -8 * IN + 50 }, top: { u0: 14 * IN - 50, u1: 14 * IN + 50, v0: BANDS.bass[0], v1: BANDS.bass[1] } },
    start: { p: { x: 14 * IN, y: -8 * IN, z: -300 }, az: 0, el: -70 },
    tendency: 'A truer view of the bass strings, with less damper noise than right by the hammers. The low half of a split pair — splay the two apart a little to reduce their overlap in the middle.',
    checks: ['Clearance from the lid and the bass rim', 'With a treble mic: listen in mono for a hollow middle'],
  },
  {
    id: 'gp.short',
    label: 'Close over the strings, lid on the short stick',
    band: 'Start about 15 cm (6 in) above the middle strings, about 20 cm (8 in) back from the hammer line, with the lid on the short stick.',
    kind: 'sourced',
    src: 'S-REC',
    quote: '6 inches over middle strings, 8 inches from hammers, with lid on short stick',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 6 * IN - 40, max: 6 * IN + 40 },
    bandProv: ill('a ±4 cm band round the guide’s 6 in (the lid leaves less room)'),
    radial: { line: 'hammers', min: 8 * IN - 50, max: 8 * IN + 50, prov: tol },
    requires: { variant: 'short', micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 50, prov: ill('a front within 50° of straight down') },
    box: { min: { x: -1000, y: -1000, z: BANDS.middle[0] }, max: { x: 1000, y: 0, z: BANDS.middle[1] }, prov: ill('the middle band (drawing default)') },
    drawn: { side: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: -6 * IN - 40, v1: -6 * IN + 40 }, top: { u0: 8 * IN - 50, u1: 8 * IN + 50, v0: BANDS.middle[0], v1: BANDS.middle[1] } },
    start: { p: { x: 8 * IN, y: -6 * IN, z: 0 }, az: 0, el: -70 },
    tendency: 'A close, isolated view for a loud stage: more separation, a more percussive sound with less room. Mind the little space under the lid.',
    checks: ['Space under the short-stick lid for the mic AND its stand arm', 'Lid rattle and mount contact at show level', 'Gain before feedback with the monitors on'],
  },
  {
    id: 'gp.ortf',
    label: 'A stereo pair over the strings, angled down toward the pianist',
    band: 'Start the pair about 30 cm (12 in) over the strings at mid-frame, each mic pointed about 45° down toward the pianist (two cardioids 17 cm apart, 110° between them).',
    kind: 'sourced',
    src: 'DPA-PIANO',
    quote: 'ORTF stereo set-up using cardioids approximately 30 cm (12 in) over the strings at mid frame. The mics should be pointed at 45° downwards, towards the pianist.',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 250, max: 350 },
    bandProv: tol,
    radial: { line: 'hammers', min: 450, max: 750, prov: ill('“mid frame”: 45–75 cm back from the hammer line on the grand, the lab’s drawing') },
    requires: { variants: ['grand'], micTypeIds: COND },
    aim: { maxOffAxis: 60, minOffAxis: 30, prov: ill('45° ± 15° from straight down (the lab’s tolerance)') },
    aimAt: { surface: 'strings', r: 560, prov: ill('“towards the pianist”: the axis meets the strings in front of the mic, toward the keys') },
    box: { min: { x: -1000, y: -1000, z: -250 }, max: { x: 1500, y: 0, z: 250 }, prov: ill('over the middle of the frame') },
    drawn: { side: { u0: 450, u1: 750, v0: -350, v1: -250 }, top: { u0: 450, u1: 750, v0: -250, v1: 250 } },
    start: { p: { x: 600, y: -300, z: 0 }, az: 0, el: -45 },
    tendency: 'A direct, balanced stereo picture of the whole keyboard from inside the lid. Keep the pair’s designed spacing and angle — one mic on bass and one on treble is a different technique.',
    checks: ['The pair’s spacing and angle kept as designed', 'Mono: does the sum stay full?', 'Clearance from the lid and the stick'],
  },
  {
    id: 'bg.ortf',
    label: 'A stereo pair over the strings, angled down toward the pianist',
    band: 'Start the pair about 30 cm (12 in) over the strings, nearer the middle of this smaller frame, each mic pointed about 45° down toward the pianist.',
    kind: 'sourced',
    src: 'DPA-PIANO',
    quote: 'ORTF stereo set-up using cardioids approximately 30 cm (12 in) over the strings at mid frame. The mics should be pointed at 45° downwards, towards the pianist.',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 250, max: 350 },
    bandProv: tol,
    radial: { line: 'hammers', min: 280, max: 520, prov: ill('“mid frame” on the shorter frame: 28–52 cm back from the hammer line, the lab’s drawing') },
    requires: { variants: ['baby'], micTypeIds: COND },
    aim: { maxOffAxis: 60, minOffAxis: 30, prov: ill('45° ± 15° from straight down') },
    aimAt: { surface: 'strings', r: 420, prov: ill('toward the pianist: the axis meets the strings in front of the mic') },
    box: { min: { x: -1000, y: -1000, z: -250 }, max: { x: 1500, y: 0, z: 250 }, prov: ill('over the middle of the frame') },
    drawn: { side: { u0: 280, u1: 520, v0: -350, v1: -250 }, top: { u0: 280, u1: 520, v0: -250, v1: 250 } },
    start: { p: { x: 400, y: -300, z: 0 }, az: 0, el: -45 },
    tendency: 'The same compact pair on a smaller instrument. Check what actually fits under the lid; an outside viewpoint may suit a baby grand better.',
    checks: ['What fits under this lid', 'Mono: does the sum stay full?'],
  },
  {
    id: 'gp.curve',
    label: 'Outside, in the curve of the case',
    band: 'Start outside the curved side, roughly level with the rim, about 30 cm–1 m (1–3 ft) out, facing into the piano under the raised lid — for a solo piano in a room worth hearing.',
    kind: 'sourced',
    src: 'DPA-PIANO',
    quote: 'An AB placement with a pair of omnis just outside the piano on a microphone stand spaced 30 cm (12 in) apart is a particularly good starting position. / placing the ORTF setup in the curve of the pianos with the lid on “full stick”',
    refSurface: 'curve',
    side: 'either',
    distance: { min: 300, max: 1000 },
    bandProv: ill('“just outside … relatively low”: 30 cm to 1 m out, from 10 cm below to 45 cm above the rim — the lab’s drawing'),
    radial: { line: 'rimTop', min: -100, max: 450, prov: ill('“relatively low”: the lab’s drawing') },
    requires: { variants: ['grand'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 45, prov: ill('facing into the piano: within 45° of the curve’s inward direction') },
    drawn: curveDrawn(GB),
    start: aimedAlong({ x: GB.curve.p.x + 600 * GB.curve.n.x, y: GB.rimTop - 150, z: GB.curve.p.z + 600 * GB.curve.n.z }, { x: -GB.curve.n.x, y: 0, z: -GB.curve.n.z }),
    tendency: 'The instrument and the room together — the whole keyboard blended, with more of the room and of anything else in it. A poor default beside drums or loud monitors.',
    checks: ['The room: is it worth hearing?', 'Other sources near the piano', 'Stands and cables out of the audience’s and the pianist’s way'],
  },
  {
    id: 'bg.curve',
    label: 'Outside, in the curve of the case',
    band: 'Start outside the curved side, roughly level with the rim, about 30 cm–1 m (1–3 ft) out, facing into the piano under the raised lid.',
    kind: 'sourced',
    src: 'DPA-PIANO',
    quote: 'An AB placement with a pair of omnis just outside the piano … / placing the ORTF setup in the curve of the pianos with the lid on “full stick”',
    refSurface: 'curveS',
    side: 'either',
    distance: { min: 300, max: 1000 },
    bandProv: ill('as the grand: the lab’s drawing'),
    radial: { line: 'rimTop', min: -100, max: 450, prov: ill('“relatively low”: the lab’s drawing') },
    requires: { variants: ['baby'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 45, prov: ill('facing into the piano') },
    drawn: curveDrawn(GS),
    start: aimedAlong({ x: GS.curve.p.x + 600 * GS.curve.n.x, y: GS.rimTop - 150, z: GS.curve.p.z + 600 * GS.curve.n.z }, { x: -GS.curve.n.x, y: 0, z: -GS.curve.n.z }),
    tendency: 'On a baby grand an outside view can be the easier start: the whole instrument and the room, without crowding the small space under the lid.',
    checks: ['The room and other sources', 'Stands out of the pianist’s and the audience’s way'],
  },
  {
    id: 'gp.hole',
    label: 'Aimed into a sound hole in the iron frame',
    band: 'Start a single mic about 12–30 cm (5–12 in) above one of the frame’s round holes, aimed into it — a focused, one-mic option for live sound.',
    kind: 'sourced',
    src: 'S-RHYTHM',
    quote: 'A single SM58 pointing into one of the soundboard holes will also do the trick if you have only one input and the piano is going through the monitors. / Aiming into sound holes',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 120, max: 300 },
    bandProv: ill('no height is given: 12–30 cm above the frame is the lab’s drawing'),
    requires: { variants: ['grand', 'short'], micTypeIds: DYN_OR_COND },
    aimAt: { surface: 'holeHigh', r: 85, prov: ill('“pointing into … the holes”: the axis meets the hole within 3.5 cm of its edge') },
    drawn: holeDrawn(GB),
    start: aimedAt({ x: GB.holes[0].c.x + 20, y: -190, z: GB.holes[0].c.z }, GB.holes[0].c),
    tendency: 'A focused colour of the piano, not the whole instrument — useful when you have one input and the piano must go through the monitors.',
    checks: ['Clear of the lid on either stick', 'Is the whole keyboard there, or just one part?'],
  },
  {
    id: 'bg.hole',
    label: 'Aimed into a sound hole in the iron frame',
    band: 'Start a single mic about 12–30 cm (5–12 in) above one of the frame’s round holes, aimed into it.',
    kind: 'sourced',
    src: 'S-RHYTHM',
    quote: 'A single SM58 pointing into one of the soundboard holes … / Aiming into sound holes',
    refSurface: 'strings',
    side: 'either',
    distance: { min: 120, max: 300 },
    bandProv: ill('the lab’s drawing'),
    requires: { variants: ['baby'], micTypeIds: DYN_OR_COND },
    aimAt: { surface: 'holeHighS', r: 85, prov: ill('the axis meets the hole') },
    drawn: holeDrawn(GS),
    start: aimedAt({ x: GS.holes[0].c.x + 20, y: -190, z: GS.holes[0].c.z }, GS.holes[0].c),
    tendency: 'A focused colour of the piano for one input — not the whole instrument.',
    checks: ['Clear of the lid', 'Is the whole keyboard there?'],
  },
  {
    id: 'gp.under',
    label: 'Underneath, aimed up at the soundboard',
    band: 'Start under the piano, about 15–45 cm (6–18 in) below the case, aimed straight up at the soundboard, clear of the legs, the pedals and the pianist’s feet.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'Underneath the piano, aiming up at the soundboard',
    refSurface: 'under',
    side: 'either',
    distance: { min: 150, max: 450 },
    bandProv: ill('no distance is given: 15–45 cm below the case is the lab’s drawing'),
    requires: { variants: ['grand', 'short', 'baby'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 30, prov: ill('“aiming up”: within 30° of straight up') },
    box: { min: { x: 100, y: 0, z: -560 }, max: { x: 1150, y: 1000, z: 560 }, prov: ill('under the soundboard, away from the legs and the pedals (drawing default)') },
    drawn: { side: { u0: 100, u1: 1150, v0: GB.caseBottom + 150, v1: GB.caseBottom + 450 }, top: { u0: 100, u1: 1150, v0: -560, v1: 560 } },
    start: { p: { x: 500, y: 500, z: -100 }, az: 0, el: 80 },
    tendency: 'A darker, rounder view from under the soundboard, with little of the hammers. Often a blend with a mic above, not a whole piano on its own. It faces the other side of the soundboard from any mic above, so blended with one it starts out roughly opposite in polarity in the lows: try this mic’s polarity both ways, in mono, at matched levels.',
    checks: ['The pianist’s feet and the pedals', 'Floor noise and stand thumps', 'Blended with a mic above: compare both polarity states in mono'],
  },
  {
    id: 'up.top',
    label: 'Just over the open top',
    band: 'Start just above the open top, about 5–25 cm (2–10 in) up, one mic over the treble strings and one over the bass for a split pair.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'Just over open top, above treble strings / … above bass strings',
    refSurface: 'uTop',
    side: 'either',
    distance: { min: 30, max: 250 },
    bandProv: ill('“just over”: 3–25 cm above the top, the lab’s drawing'),
    requires: { variants: ['upright', 'uprightFront'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 50, prov: ill('looking down into the piano: within 50° of straight down') },
    box: { min: { x: UP.panel.x - 30, y: -2000, z: -UP.hw }, max: { x: UP.xBack + 20, y: 0, z: UP.hw }, prov: ill('over the case top') },
    drawn: { side: { u0: UP.panel.x - 30, u1: UP.xBack + 20, v0: UP.yTop - 250, v1: UP.yTop - 30 }, top: { u0: UP.panel.x - 30, u1: UP.xBack + 20, v0: -UP.hw, v1: UP.hw } },
    start: { p: { x: -80, y: UP.yTop - 120, z: 380 }, az: 0, el: -70 },
    tendency: 'A direct, articulate view from above, with some hammer and key noise. Farther up tends to bring more body and less mechanism.',
    checks: ['The top lid propped safely or off, with the owner’s agreement', 'Paired? Check the two in mono'],
  },
  {
    id: 'up.inside',
    label: 'Inside the top, aimed slightly toward the hammers',
    band: 'Start inside the open top, about 5–25 cm (2–10 in) below its rim, above the action, the pair split between bass and treble and angled a little toward the hammers.',
    kind: 'sourced',
    src: 'S-RHYTHM',
    quote: 'Open the top and place a split pair of microphones inside, aiming slightly toward the hammers',
    refSurface: 'uTop',
    side: 'either',
    distance: { min: -250, max: -50 },
    bandProv: ill('“inside”: 5–25 cm below the top, above the action — the lab’s drawing'),
    requires: { variants: ['upright', 'uprightFront'], micTypeIds: COND },
    aim: { maxOffAxis: 50, prov: ill('down and slightly toward the hammers: within 50° of straight down') },
    box: { min: { x: UP.top.x0, y: UP.yTop, z: -UP.hw }, max: { x: -20, y: 0, z: UP.hw }, prov: ill('in front of the strings, over the action') },
    drawn: { side: { u0: UP.top.x0, u1: -20, v0: UP.yTop + 50, v1: UP.yTop + 250 }, top: { u0: UP.top.x0, u1: -20, v0: -UP.hw + 40, v1: UP.hw - 40 } },
    start: { p: { x: -120, y: UP.yTop + 140, z: 300 }, az: 0, el: -75 },
    tendency: 'A close, direct, articulate view with more of the hammers — useful live, where a room view would bring too much spill.',
    checks: ['Clear of the action, the dampers and the strings', 'Nothing resting on the piano’s parts', 'Mic arm out through the top, not across the keys'],
  },
  {
    id: 'up.rear',
    label: 'Behind the piano, facing the soundboard',
    band: 'Start about 20 cm (8 in) behind the soundboard, toward its bass or treble side — with the piano pulled out from the wall, and time to find the sweet spot.',
    kind: 'sourced',
    src: 'S-REC',
    quote: '8 inches from bass side of soundboard / 8 inches from treble side of soundboard',
    refSurface: 'uBoard',
    side: 'either',
    distance: { min: 8 * IN - 50, max: 8 * IN + 50 },
    bandProv: tol,
    requires: { variants: ['upright', 'uprightFront'], micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 40, prov: ill('facing the soundboard: within 40° of square to it') },
    box: { min: { x: 0, y: UP.soundboard.y0, z: -UP.hw + 60 }, max: { x: 2000, y: UP.soundboard.y1 - 100, z: UP.hw - 60 }, prov: ill('in line with the soundboard') },
    drawn: { side: { u0: UP.soundboard.x1 + 8 * IN - 50, u1: UP.soundboard.x1 + 8 * IN + 50, v0: UP.soundboard.y0, v1: UP.soundboard.y1 - 100 }, top: { u0: UP.soundboard.x1 + 8 * IN - 50, u1: UP.soundboard.x1 + 8 * IN + 50, v0: -UP.hw + 60, v1: UP.hw - 60 } },
    start: { p: { x: UP.soundboard.x1 + 8 * IN, y: -100, z: -380 }, az: 0, el: 0 },
    tendency: 'More body and less key and action noise — but it depends strongly on the wall, the room and the piano: listen for the sweet spot. It faces the other side of the soundboard from a mic at the top or the hammers, so blended with one it starts out roughly opposite in polarity in the lows: try this mic’s polarity both ways, in mono, at matched levels.',
    checks: ['The piano pulled out from the wall (its owner moves it)', 'The wall and the room: move and listen', 'Cables clear of the pianist’s feet'],
  },
  {
    id: 'up.front',
    label: 'Front panel off: in front of the hammers',
    band: 'With the owner’s agreement and the upper panel taken off by them, start about 6–20 cm (2–8 in) in front of the hammers, aimed at them.',
    kind: 'sourced',
    src: 'S-REC',
    quote: 'Aiming at hammers from front, several inches away (remove front panel)',
    refSurface: 'uHammers',
    side: 'either',
    distance: { min: 60, max: 200 },
    bandProv: ill('“several inches”: 6–20 cm, the lab’s drawing'),
    requires: { variant: 'uprightFront', micTypeIds: DYN_OR_COND },
    aim: { maxOffAxis: 35, prov: ill('“aiming at hammers”: within 35° of square to them') },
    box: { min: { x: -2000, y: UP.hammerY - 200, z: -UP.hw }, max: { x: 0, y: UP.hammerY + 120, z: UP.hw }, prov: ill('level with the hammer line') },
    drawn: { side: { u0: -70 - 200, u1: -70 - 60, v0: UP.hammerY - 200, v1: UP.hammerY + 120 }, top: { u0: -70 - 200, u1: -70 - 60, v0: -UP.hw, v1: UP.hw } },
    start: { p: { x: -70 - 120, y: UP.hammerY - 60, z: 150 }, az: 180, el: -10 },
    tendency: 'The most hammer attack of any upright position, with more key and action noise. A choice for a percussive part.',
    checks: ['The panel removed by the owner or a technician, and kept safe', 'Clear of the pianist’s hands and the music', 'Key and pedal noise'],
  },
];

/** The aim a pose points along (for tests). */
export const aimOf = (p: MicPose) => aimVec(p.az, p.el);
