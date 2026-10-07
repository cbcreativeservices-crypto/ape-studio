/**
 * THE SEATING-PLAN / STAGE-PLOT BUILDER CORE (frame S, frameS.ts) — shared
 * by every Lab 5 ensemble lesson. Pure; tested (test/mikingLab5Arrays.test.ts).
 * Research: docs/labs/miking/full_orchestra/SOURCES.md §B, GEOMETRY_PROPOSAL.md
 * §1, §3; string_section/, mixed_classical_ensemble/.
 *
 * A SEATING is a list of SEATS (one player each: kind, section, where the
 * player sits or stands on the floor or a riser, the way they face, their
 * music stand) grouped into SECTIONS, with the risers, the podium and the
 * stage's extent. Built from a PRESET:
 *
 *   orch.american   strings high to low, left to right as the conductor
 *                   faces them: 1st violins, 2nd violins, violas, cellos,
 *                   basses behind the cellos (JAX-SEAT, the modern layout)
 *   orch.german     1st violins left, 2nd violins right facing them, cellos
 *                   and basses beside the 1st violins, violas beside the
 *                   2nds (JAX-SEAT, antiphonal)
 *   strings.american / strings.german   the same strings, no winds or brass
 *                   (a string orchestra; larger string sections)
 *   chamber.mixed   a mixed chamber group about 3.5 m wide, no conductor
 *   quartet.arc     a string quartet on an arc, 1st violin to cello left to
 *                   right; quartet.arcVa puts the viola on the outside
 *
 * Later builders ADD presets here (a choir on risers, a big band, a horn
 * section, percussion stations, a rock or jazz stage plot): a preset is one
 * function returning a Seating; the drawing (SeatingArt.tsx), the hit test,
 * the section boxes, the sound points and the support-mic helper all follow.
 *
 * Every position, count, chair pitch, desk depth and riser height is a
 * DRAWING DEFAULT (the research found none: SOURCES.md §B "UNKNOWN") — the
 * lesson lists them in its unknowns. Only the ORDER of the string sections
 * per preset and the section-support rule (1–1.5 m, three or four players:
 * DPA-MULTI) are sourced.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import { add, dist, mul, planDir, sub, unit, v3, DEG } from './frameS.ts';

export type Kind =
  | 'violin'
  | 'viola'
  | 'cello'
  | 'bass'
  | 'flute'
  | 'oboe'
  | 'clarinet'
  | 'bassoon'
  | 'horn'
  | 'trumpet'
  | 'trombone'
  | 'tuba'
  | 'timpani'
  | 'percussion'
  | 'harp'
  | 'piano'
  | 'celesta'
  | 'conductor';
export type Family = 'strings' | 'winds' | 'brass' | 'percussion' | 'keys' | 'conductor';
export type Posture = 'seated' | 'standing';

export type Seat = {
  id: string;
  kind: Kind;
  section: string;
  /** The floor (or riser top) point under the player: chair centre, or
   *  between the feet when standing. y = −(the riser's height). */
  p: Vec3;
  /** The plan direction the player faces (frameS.planDir degrees: 180 =
   *  toward the conductor and the hall). */
  face: number;
  posture: Posture;
  /** The music stand's foot (null: none). */
  stand: Vec3 | null;
};
export type Section = {
  id: string;
  label: string;
  short: string;
  family: Family;
  seats: string[];
  /** Where its sound leaves, in words (MEET IT). */
  radiates: string;
};
export type Riser = { x0: number; x1: number; z0: number; z1: number; h: number };
export type Podium = { c: Vec3; w: number; d: number; h: number };
export type SeatingId = 'orch.american' | 'orch.german' | 'strings.american' | 'strings.german' | 'chamber.mixed' | 'quartet.arc' | 'quartet.arcVa';
export type Seating = {
  id: SeatingId;
  label: string;
  /** One line (the variant's blurb). */
  blurb: string;
  seats: Seat[];
  sections: Section[];
  risers: Riser[];
  podium: Podium | null;
  /** The conductor, standing on the podium (null: none). */
  conductor: Seat | null;
  /** The stage's extent in plan (mm). */
  stage: { x0: number; x1: number; z0: number; z1: number };
};

/* ── drawing defaults (mm) ── */
export const DIMS = {
  /** The podium: 0.9 m square, 0.2 m high, its centre 1.3 m downstage of the
   *  front row's line. */
  podium: { w: 900, d: 900, h: 200, z: 1300 },
  /** String rows on arcs round the podium: radii of the desks' centres. */
  rows: [1600, 2700, 3800] as const,
  /** Two players per desk, ±340 mm along the arc. */
  deskHalf: 340,
  /** The music stand, toward the podium from the desk centre. */
  standIn: 450,
  chairSeat: 460,
  seatedShoulder: 1050,
  seatedHead: 1300,
  standingHead: 1720,
  /** Risers: winds, brass, timpani and percussion. */
  risers: { winds: 200, brass: 400, back: 600 },
} as const;

/* ── where each kind's sound leaves (above its floor point), and how far its
 *  instrument reaches in front of the player (plan). Drawing defaults built
 *  from the Labs 1–4 families' geometry. ── */
export const KIND: Record<Kind, { label: string; family: Family; sound: number; reach: number; posture: Posture }> = {
  violin: { label: 'violin', family: 'strings', sound: 1050, reach: 420, posture: 'seated' },
  viola: { label: 'viola', family: 'strings', sound: 1040, reach: 450, posture: 'seated' },
  cello: { label: 'cello', family: 'strings', sound: 600, reach: 380, posture: 'seated' },
  bass: { label: 'double bass', family: 'strings', sound: 950, reach: 420, posture: 'standing' },
  flute: { label: 'flute', family: 'winds', sound: 1150, reach: 300, posture: 'seated' },
  oboe: { label: 'oboe', family: 'winds', sound: 760, reach: 450, posture: 'seated' },
  clarinet: { label: 'clarinet', family: 'winds', sound: 680, reach: 450, posture: 'seated' },
  bassoon: { label: 'bassoon', family: 'winds', sound: 1100, reach: 300, posture: 'seated' },
  horn: { label: 'horn', family: 'brass', sound: 900, reach: 250, posture: 'seated' },
  trumpet: { label: 'trumpet', family: 'brass', sound: 1100, reach: 550, posture: 'seated' },
  trombone: { label: 'trombone', family: 'brass', sound: 1050, reach: 900, posture: 'seated' },
  tuba: { label: 'tuba', family: 'brass', sound: 1450, reach: 350, posture: 'seated' },
  timpani: { label: 'timpani', family: 'percussion', sound: 850, reach: 900, posture: 'standing' },
  percussion: { label: 'percussion', family: 'percussion', sound: 950, reach: 650, posture: 'standing' },
  harp: { label: 'harp', family: 'strings', sound: 1000, reach: 500, posture: 'seated' },
  piano: { label: 'piano', family: 'keys', sound: 850, reach: 1900, posture: 'seated' },
  celesta: { label: 'celesta', family: 'keys', sound: 850, reach: 650, posture: 'seated' },
  conductor: { label: 'conductor', family: 'conductor', sound: 1500, reach: 300, posture: 'standing' },
};

/** The point a seat's sound leaves from (frame S). */
export function soundPoint(s: Seat): Vec3 {
  const k = KIND[s.kind];
  const fwd = planDir(s.face);
  // Strings, keys and percussion sound in front of the player; a horn's bell
  // points back past the player's right; the rest at the player.
  const ahead = s.kind === 'horn' ? -150 : s.kind === 'timpani' || s.kind === 'percussion' || s.kind === 'piano' || s.kind === 'celesta' || s.kind === 'harp' ? k.reach * 0.6 : s.kind === 'trumpet' || s.kind === 'trombone' ? k.reach : 120;
  return add(add(s.p, mul(fwd, ahead)), v3(0, -k.sound, 0));
}
/** The top of a player's head above the floor (mm, as a height). */
export function headTop(s: Seat): number {
  return -s.p.y + (s.posture === 'standing' ? DIMS.standingHead : DIMS.seatedHead);
}

/* ── building blocks ── */
type SecDef = { id: string; label: string; short: string; family: Family; radiates: string };
const SECTIONS: Record<string, SecDef> = {
  vn1: { id: 'vn1', label: '1st violins', short: '1ST VIOLINS', family: 'strings', radiates: 'From the top plate and the f-holes, up and out from under the player’s chin — and from the strings where the bow meets them.' },
  vn2: { id: 'vn2', label: '2nd violins', short: '2ND VIOLINS', family: 'strings', radiates: 'The same as the 1st violins: up and out from the top plate and f-holes, each instrument a little different.' },
  va: { id: 'va', label: 'violas', short: 'VIOLAS', family: 'strings', radiates: 'Up and out from a larger top plate, lower in pitch: often an inner voice the main pair can lose.' },
  vc: { id: 'vc', label: 'cellos', short: 'CELLOS', family: 'strings', radiates: 'Forward from the top plate between the player’s knees, low — and into the floor it stands on.' },
  cb: { id: 'cb', label: 'double basses', short: 'BASSES', family: 'strings', radiates: 'From a large body standing on the floor: wide and low, with weight the main pair may already carry.' },
  fl: { id: 'fl', label: 'flutes', short: 'FLUTES', family: 'winds', radiates: 'From the embouchure and the first open holes, out to the player’s right.' },
  ob: { id: 'ob', label: 'oboes', short: 'OBOES', family: 'winds', radiates: 'From the open tone holes along the body and the bell, low in front of the player.' },
  cl: { id: 'cl', label: 'clarinets', short: 'CLARINETS', family: 'winds', radiates: 'From the open holes along the body and the bell, down in front of the knees.' },
  bn: { id: 'bn', label: 'bassoons', short: 'BASSOONS', family: 'winds', radiates: 'From the holes along a long body and a bell high above the player’s head.' },
  hn: { id: 'hn', label: 'horns', short: 'HORNS', family: 'brass', radiates: 'From bells that point BACK, past the players’ right: much of what the hall hears comes off the wall behind them.' },
  tpt: { id: 'tpt', label: 'trumpets', short: 'TRUMPETS', family: 'brass', radiates: 'From bells pointing forward, toward the conductor and the hall: strong and direct.' },
  tbn: { id: 'tbn', label: 'trombones and tuba', short: 'TROMBONES · TUBA', family: 'brass', radiates: 'Trombone bells point forward over the slides; the tuba’s bell points up.' },
  timp: { id: 'timp', label: 'timpani', short: 'TIMPANI', family: 'percussion', radiates: 'From the heads, up and out — loud peaks from the back of the stage.' },
  perc: { id: 'perc', label: 'percussion', short: 'PERCUSSION', family: 'percussion', radiates: 'From each instrument struck: the bass drum’s heads, the snare, the cymbals — sharp, loud attacks.' },
  harp: { id: 'harp', label: 'harp', short: 'HARP', family: 'strings', radiates: 'From the soundboard under the strings, angled toward the player: quiet against the orchestra.' },
  kbd: { id: 'kbd', label: 'celesta', short: 'CELESTA', family: 'keys', radiates: 'From a small case: a quiet instrument that can need its own support.' },
};

/** Desks on an arc round the podium: (radius, θ list, section per desk). θ in
 *  degrees from upstage, + toward the conductor's right. */
function fanDesks(P: Vec3, R: number, thetas: readonly number[], sections: readonly string[], out: Seat[], kinds: Record<string, Kind>) {
  thetas.forEach((th, i) => {
    const sec = sections[i];
    const kind = kinds[sec];
    const c = v3(P.x + R * Math.sin(th * DEG), 0, P.z - R * Math.cos(th * DEG));
    const t = v3(Math.cos(th * DEG), 0, Math.sin(th * DEG));
    const toP = unit(sub(v3(P.x, 0, P.z), c));
    const stand = add(c, mul(toP, DIMS.standIn));
    for (const k of [-1, 1] as const) {
      const n = out.filter((s) => s.section === sec).length + 1;
      out.push({ id: `${sec}.${n}`, kind, section: sec, p: add(c, mul(t, k * DIMS.deskHalf)), face: th + 180, posture: KIND[kind].posture, stand: k === -1 ? stand : null });
    }
  });
}
function row(out: Seat[], sec: string, kind: Kind, z: number, xs: readonly number[], h: number, face = 180, posture: Posture = KIND[kind].posture) {
  xs.forEach((x, i) => out.push({ id: `${sec}.${i + 1}`, kind, section: sec, p: v3(x, -h, z), face, posture, stand: posture === 'seated' ? v3(x, -h, z + 450) : null }));
}
function sectionsOf(seats: readonly Seat[], order: readonly string[]): Section[] {
  return order.filter((id) => seats.some((s) => s.section === id)).map((id) => ({ ...SECTIONS[id], seats: seats.filter((s) => s.section === id).map((s) => s.id) }));
}

const STRING_KINDS: Record<string, Kind> = { vn1: 'violin', vn2: 'violin', va: 'viola', vc: 'cello', cb: 'bass' };
const ROW_THETAS = [[-63, -21, 21, 63], [-70, -42, -14, 14, 42, 70], [-84, -56, -28, 0, 28, 56, 84]] as const;
const STRING_ROWS: Record<'american' | 'german', readonly (readonly string[])[]> = {
  // As the conductor faces them, left → right (JAX-SEAT).
  american: [
    ['vn1', 'vn2', 'va', 'vc'],
    ['vn1', 'vn1', 'vn2', 'va', 'vc', 'vc'],
    ['vn1', 'vn1', 'vn2', 'vn2', 'va', 'cb', 'cb'],
  ],
  german: [
    ['vn1', 'vc', 'va', 'vn2'],
    ['vn1', 'vn1', 'vc', 'vc', 'va', 'vn2'],
    ['vn1', 'vn1', 'cb', 'cb', 'va', 'vn2', 'vn2'],
  ],
};

function podiumAt(): { podium: Podium; conductor: Seat; P: Vec3 } {
  const P = v3(0, 0, DIMS.podium.z);
  const podium: Podium = { c: v3(0, -DIMS.podium.h, DIMS.podium.z), w: DIMS.podium.w, d: DIMS.podium.d, h: DIMS.podium.h };
  const conductor: Seat = { id: 'cond', kind: 'conductor', section: 'cond', p: v3(0, -DIMS.podium.h, DIMS.podium.z + 80), face: 0, posture: 'standing', stand: v3(0, -DIMS.podium.h, DIMS.podium.z - 300) };
  return { podium, conductor, P };
}

function strings(layout: 'american' | 'german'): Seat[] {
  const { P } = podiumAt();
  const out: Seat[] = [];
  DIMS.rows.forEach((R, r) => fanDesks(P, R, ROW_THETAS[r], STRING_ROWS[layout][r], out, STRING_KINDS));
  return out;
}

function orchestraRest(): { seats: Seat[]; risers: Riser[] } {
  const H = DIMS.risers;
  const out: Seat[] = [];
  row(out, 'fl', 'flute', -3600, [-1050, -350], H.winds);
  row(out, 'ob', 'oboe', -3600, [350, 1050], H.winds);
  row(out, 'cl', 'clarinet', -4700, [-1050, -350], H.winds);
  row(out, 'bn', 'bassoon', -4700, [350, 1050], H.winds);
  row(out, 'hn', 'horn', -5800, [-3150, -2450, -1750, -1050], H.brass);
  row(out, 'tpt', 'trumpet', -5800, [-250, 450], H.brass);
  row(out, 'tbn', 'trombone', -5800, [1350, 2050, 2750], H.brass);
  out.push({ id: 'tbn.4', kind: 'tuba', section: 'tbn', p: v3(3450, -H.brass, -5800), face: 180, posture: 'seated', stand: v3(3450, -H.brass, -5350) });
  out.push({ id: 'timp.1', kind: 'timpani', section: 'timp', p: v3(-750, -H.back, -7350), face: 180, posture: 'standing', stand: null });
  out.push({ id: 'perc.1', kind: 'percussion', section: 'perc', p: v3(1500, -H.back, -7350), face: 180, posture: 'standing', stand: null });
  out.push({ id: 'perc.2', kind: 'percussion', section: 'perc', p: v3(2700, -H.back, -7350), face: 180, posture: 'standing', stand: null });
  out.push({ id: 'harp.1', kind: 'harp', section: 'harp', p: v3(-4350, 0, -2500), face: 150, posture: 'seated', stand: v3(-4150, 0, -2050) });
  out.push({ id: 'kbd.1', kind: 'celesta', section: 'kbd', p: v3(-4200, 0, -4300), face: 160, posture: 'seated', stand: null });
  const risers: Riser[] = [
    { x0: -2000, x1: 2000, z0: -5200, z1: -3150, h: H.winds },
    { x0: -3800, x1: 4000, z0: -6400, z1: -5200, h: H.brass },
    { x0: -2600, x1: 3400, z0: -7900, z1: -6400, h: H.back },
  ];
  return { seats: out, risers };
}

const ORDER = ['vn1', 'vn2', 'va', 'vc', 'cb', 'harp', 'fl', 'ob', 'cl', 'bn', 'hn', 'tpt', 'tbn', 'timp', 'perc', 'kbd'];

function orchestra(layout: 'american' | 'german', withRest: boolean): Seating {
  const { podium, conductor } = podiumAt();
  const str = strings(layout);
  const rest = withRest ? orchestraRest() : { seats: [], risers: [] };
  const seats = [...str, ...rest.seats];
  const id: SeatingId = withRest ? (layout === 'american' ? 'orch.american' : 'orch.german') : layout === 'american' ? 'strings.american' : 'strings.german';
  return {
    id,
    label: layout === 'american' ? 'Violins together on the left' : 'Violins facing each other',
    blurb:
      layout === 'american'
        ? 'Strings from high to low, left to right as the conductor faces them: 1st and 2nd violins on the left, violas and cellos on the right, the basses behind the cellos.'
        : '1st violins on the conductor’s left and 2nds on the right, facing each other; the cellos and basses beside the 1sts, the violas beside the 2nds.',
    seats,
    sections: sectionsOf(seats, ORDER),
    risers: rest.risers,
    podium,
    conductor,
    stage: withRest ? { x0: -5200, x1: 5200, z0: -8000, z1: 3400 } : { x0: -4700, x1: 4700, z0: -3300, z1: 3400 },
  };
}

function chamber(): Seating {
  const C = v3(0, 0, 1500);
  const at = (R: number, th: number) => v3(C.x + R * Math.sin(th * DEG), 0, C.z - R * Math.cos(th * DEG));
  const seat = (id: string, kind: Kind, section: string, R: number, th: number): Seat => ({ id, kind, section, p: at(R, th), face: th + 180, posture: KIND[kind].posture, stand: KIND[kind].posture === 'seated' ? add(at(R, th), mul(unit(sub(C, at(R, th))), 450)) : null });
  const back = (id: string, kind: Kind, section: string, x: number): Seat => ({ id, kind, section, p: v3(x, 0, -1500), face: 180, posture: 'seated', stand: v3(x, 0, -1050) });
  const seats: Seat[] = [
    seat('vn.1', 'violin', 'vn', 1600, -48),
    seat('va.1', 'viola', 'va', 1600, -16),
    seat('vc.1', 'cello', 'vc', 1600, 16),
    seat('cb.1', 'bass', 'cb', 1600, 48),
    back('fl.1', 'flute', 'fl', -1150),
    back('cl.1', 'clarinet', 'cl', -400),
    back('hn.1', 'horn', 'hn', 400),
    // The grand piano across the back, the pianist at its keyboard on the
    // left facing the conductor's right: its curved side (and the open
    // lid) toward the hall.
    { id: 'pno.1', kind: 'piano', section: 'pno', p: v3(-1550, 0, -2700), face: 90, posture: 'seated', stand: null },
  ];
  const sec = (id: string, label: string, short: string, family: Family, radiates: string): Section => ({ id, label, short, family, radiates, seats: seats.filter((s) => s.section === id).map((s) => s.id) });
  return {
    id: 'chamber.mixed',
    label: 'A mixed chamber group',
    blurb: 'Strings, winds, a horn and a grand piano — about 3.5 m wide, no conductor: the players see each other.',
    seats,
    sections: [
      sec('vn', 'violin', 'VIOLIN', 'strings', SECTIONS.vn1.radiates),
      sec('va', 'viola', 'VIOLA', 'strings', SECTIONS.va.radiates),
      sec('vc', 'cello', 'CELLO', 'strings', SECTIONS.vc.radiates),
      sec('cb', 'double bass', 'BASS', 'strings', SECTIONS.cb.radiates),
      sec('fl', 'flute', 'FLUTE', 'winds', SECTIONS.fl.radiates),
      sec('cl', 'clarinet', 'CLARINET', 'winds', SECTIONS.cl.radiates),
      sec('hn', 'horn', 'HORN', 'brass', 'From a bell that points back past the player’s right: the hall hears much of it off the wall behind.'),
      sec('pno', 'grand piano', 'PIANO', 'keys', 'From the soundboard and strings under the lid; the open lid throws the sound toward the hall on its open side.'),
    ],
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -2600, x1: 2600, z0: -3700, z1: 1300 },
  };
}

/** A string quartet on an arc, 1st violin to the left; `vaOut` swaps the viola and cello (viola on the right). */
function quartet(vaOut: boolean): Seating {
  const C = v3(0, 0, 1000);
  const R = 1300;
  const at = (th: number) => v3(C.x + R * Math.sin(th * DEG), 0, C.z - R * Math.cos(th * DEG));
  const order: [string, Kind][] = vaOut
    ? [
        ['vn1', 'violin'],
        ['vn2', 'violin'],
        ['vc', 'cello'],
        ['va', 'viola'],
      ]
    : [
        ['vn1', 'violin'],
        ['vn2', 'violin'],
        ['va', 'viola'],
        ['vc', 'cello'],
      ];
  const TH = [-60, -20, 20, 60];
  const seats: Seat[] = order.map(([sec, kind], i) => ({ id: `${sec}.1`, kind, section: sec, p: at(TH[i]), face: TH[i] + 180, posture: 'seated', stand: add(at(TH[i]), mul(unit(sub(C, at(TH[i]))), 450)) }));
  const lbl: Record<string, [string, string]> = { vn1: ['1st violin', '1ST VIOLIN'], vn2: ['2nd violin', '2ND VIOLIN'], va: ['viola', 'VIOLA'], vc: ['cello', 'CELLO'] };
  const rad: Record<string, string> = { vn1: SECTIONS.vn1.radiates, vn2: SECTIONS.vn2.radiates, va: SECTIONS.va.radiates, vc: SECTIONS.vc.radiates };
  return {
    id: vaOut ? 'quartet.arcVa' : 'quartet.arc',
    label: vaOut ? 'Viola on the right' : 'Cello on the right',
    blurb: vaOut ? 'On an arc, as the audience faces them: 1st violin, 2nd violin, cello, viola.' : 'On an arc, as the audience faces them: 1st violin, 2nd violin, viola, cello.',
    seats,
    sections: order.map(([sec]) => ({ id: sec, label: lbl[sec][0], short: lbl[sec][1], family: 'strings' as const, radiates: rad[sec], seats: [`${sec}.1`] })),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -2000, x1: 2000, z0: -1600, z1: 1300 },
  };
}

const cache = new Map<SeatingId, Seating>();
/** A seating preset (built once). */
export function seatingOf(id: SeatingId): Seating {
  const hit = cache.get(id);
  if (hit) return hit;
  const s =
    id === 'orch.american'
      ? orchestra('american', true)
      : id === 'orch.german'
        ? orchestra('german', true)
        : id === 'strings.american'
          ? orchestra('american', false)
          : id === 'strings.german'
            ? orchestra('german', false)
            : id === 'chamber.mixed'
              ? chamber()
              : quartet(id === 'quartet.arcVa');
  cache.set(id, s);
  return s;
}

export const seatsOf = (s: Seating, sectionId: string): Seat[] => s.seats.filter((q) => q.section === sectionId);

/** A section's box (frame S, mm): its players, their instruments' reach and
 *  their heads, plus `pad` all round — the collision solid and the hit area. */
export function sectionBox(s: Seating, sectionId: string, pad = 120): { min: Vec3; max: Vec3 } {
  const seats = seatsOf(s, sectionId);
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  let top = 0;
  let floor = 0;
  for (const q of seats) {
    const r = 330 + pad;
    const f = mul(planDir(q.face), KIND[q.kind].reach);
    for (const pt of [q.p, add(q.p, f)]) {
      x0 = Math.min(x0, pt.x - r);
      x1 = Math.max(x1, pt.x + r);
      z0 = Math.min(z0, pt.z - r);
      z1 = Math.max(z1, pt.z + r);
    }
    top = Math.max(top, headTop(q) + pad);
    floor = Math.min(floor, q.p.y);
  }
  return { min: v3(x0, -top, z0), max: v3(x1, floor, z1) };
}

/** A section's sound centre (the mean of its players' sound points). */
export function sectionCentre(s: Seating, sectionId: string): Vec3 {
  const pts = seatsOf(s, sectionId).map(soundPoint);
  const n = Math.max(1, pts.length);
  return pts.reduce((a, b) => add(a, mul(b, 1 / n)), v3(0, 0, 0));
}

/** The section under a plan point (u = x, v = z), within `tol` mm. */
export function sectionAtPlan(s: Seating, x: number, z: number, tol = 0): string | null {
  let best: { id: string; d: number } | null = null;
  for (const q of s.seats) {
    const d = Math.hypot(x - q.p.x, z - q.p.z);
    if (d <= 420 + tol && (!best || d < best.d)) best = { id: q.section, d };
  }
  if (best) return best.id;
  if (s.podium && Math.abs(x - s.podium.c.x) <= s.podium.w / 2 + tol && Math.abs(z - s.podium.c.z) <= s.podium.d / 2 + tol) return 'cond';
  return null;
}

/** The players a SECTION SUPPORT covers and where it goes: a directional mic
 *  `r` (1000–1500 mm, DPA-MULTI) from the centre of `n` (3–4) players of the
 *  section nearest the conductor, toward the podium and `lift` degrees up,
 *  aimed at them. */
export function supportOf(s: Seating, sectionId: string, o: { r?: number; n?: number; lift?: number; toward?: Vec3 } = {}): { p: Vec3; target: Vec3; seats: Seat[] } {
  const r = o.r ?? 1250;
  const n = o.n ?? 4;
  const toward = o.toward ?? (s.podium ? v3(s.podium.c.x, 0, s.podium.c.z) : v3(0, 0, 2500));
  const seats = [...seatsOf(s, sectionId)].sort((a, b) => dist(a.p, toward) - dist(b.p, toward)).slice(0, n);
  const target = seats.map(soundPoint).reduce((a, b) => add(a, mul(b, 1 / seats.length)), v3(0, 0, 0));
  const flat = unit(v3(toward.x - target.x, 0, toward.z - target.z));
  const lift = (o.lift ?? 50) * DEG;
  const d = add(mul(flat, Math.cos(lift)), v3(0, -Math.sin(lift), 0));
  return { p: add(target, mul(d, r)), target, seats };
}

/** How many players' sound points lie inside a directional mic's acceptance
 *  cone (half-angle `half`, an illustrative tolerance) and within `reach`. */
export function covered(s: Seating, p: Vec3, aimDir: Vec3, half = 60, reach = 2200): Seat[] {
  const a = unit(aimDir);
  return s.seats.filter((q) => {
    if (q.kind === 'conductor') return false;
    const d = sub(soundPoint(q), p);
    const L = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
    if (L > reach || L < 1) return false;
    const c = (d.x * a.x + d.y * a.y + d.z * a.z) / L;
    return Math.acos(Math.max(-1, Math.min(1, c))) / DEG <= half;
  });
}

/** The ensemble's nearest and farthest players' sound points from a point. */
export function nearFar(s: Seating, p: Vec3): { near: Seat; far: Seat } {
  const players = s.seats.filter((q) => q.kind !== 'conductor');
  const by = [...players].sort((a, b) => dist(soundPoint(a), p) - dist(soundPoint(b), p));
  return { near: by[0], far: by[by.length - 1] };
}

/** The outermost players left and right (as the conductor faces them). */
export function edges(s: Seating): { left: Seat; right: Seat } {
  const players = s.seats.filter((q) => q.kind !== 'conductor');
  const by = [...players].sort((a, b) => a.p.x - b.p.x);
  return { left: by[0], right: by[by.length - 1] };
}

/** The front edge of the ensemble at a given x (the most downstage player's
 *  chair front near that x, mm): where outriggers stand off from. */
export function frontAt(s: Seating, x: number, band = 900): number {
  const near = s.seats.filter((q) => q.kind !== 'conductor' && Math.abs(q.p.x - x) <= band);
  if (!near.length) return 0;
  return Math.max(...near.map((q) => q.p.z + 225));
}

/** Is an array (its capsules, its stand's foot) clear of the players and the
 *  conductor's space? Null when clear, else what it would touch (words).
 *  ILLUSTRATIVE clearances: 450 mm round a player below head height + 150,
 *  the conductor's arms and baton to 600 above the head and 800 round the feet. */
export function arrayClear(s: Seating, caps: readonly { p: Vec3 }[], foot: Vec3): string | null {
  const all = [...s.seats, ...(s.conductor ? [s.conductor] : [])];
  const who = (q: Seat) => (q.kind === 'conductor' ? 'the conductor' : `the ${s.sections.find((x) => x.id === q.section)?.label ?? 'players'}`);
  for (const q of all) {
    const top = headTop(q) + (q.kind === 'conductor' ? 600 : 150);
    for (const c of caps) if (-c.p.y < top && Math.hypot(c.p.x - q.p.x, c.p.z - q.p.z) < 450) return who(q);
    if (Math.hypot(foot.x - q.p.x, foot.z - q.p.z) < (q.kind === 'conductor' ? 800 : 450)) return who(q);
  }
  return null;
}
