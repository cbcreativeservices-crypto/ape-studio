/**
 * LAB 5 GROUP 2 — VOICES on the seating builder (frame S, frameS.ts): the
 * small vocal groups of E02 (background vocals) and E04 (duets and small
 * groups), the choirs of E05 and the children's choir of E06. Pure; tested
 * (test/mikingLab5Groups.test.ts). Wired into seating.ts (`seatingOf`) and
 * drawn by SeatingArt.tsx like every other preset.
 *
 * Research: docs/labs/miking/{background_vocals,duets_small_vocal,choir,
 * childrens_choir}/GEOMETRY_PROPOSAL.md; the singer is frame V's
 * (lessons/shared/voice: the lips 1550 mm above the floor, the body behind
 * them); the risers are WENGER-SIG's (8 in rise, 18 in tread, a 42 in back
 * rail, 6 ft units, straight or semicircular).
 *
 * A singer's SEAT point is the floor under the body's centre; the LIPS are
 * `lipAhead` in front of it and `lip` above the standing surface (KIND in
 * seating.ts). Every count, pitch, radius and child dimension here is a
 * DRAWING DEFAULT (UNKNOWN in the research) — logged OWNER REVIEW G2-OR-*.
 *
 * One-way import: this file takes only TYPES from seating.ts, so the two
 * modules never wait on each other at load.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import type { Kind, Riser, Seat, Seating, Section } from './seating.ts';
import { add, DEG, dot, length, mul, planDir, sub, unit, v3 } from './frameS.ts';
import { VOICE_DIMS } from '../voice/voiceSpec.ts';

/** The voices' dimensions (mm). */
export const VOX = {
  /** An adult singer: frame V's figure (lips 1550 above the floor, 124 ahead
   *  of the body's centre; the head's centre 87 behind and 54 above the lips,
   *  radius 114; the top of the head 1720). */
  adult: { lip: VOICE_DIMS.lipStanding.mm, lipAhead: 124, head: 1720, headR: 114, headBack: 87, headUp: 54, scale: 1 },
  /** A child (about 8–11 years): the adult figure at 0.76 (DRAWING DEFAULT,
   *  no source gives a child's size; E06 draws children from above only). */
  child: { lip: 1180, lipAhead: 95, head: 1310, headR: 87, headBack: 66, headUp: 41, scale: 0.76 },
  /** Choir singers side by side (centre to centre). */
  pitch: { adult: 560, child: 480 },
  /** WENGER-SIG: "Steps are 18" (457 mm) deep and the rise of each step is
   *  8" (203 mm)"; a "42" (1067 mm) high back rail"; a 3-step unit "6'
   *  (1829 mm) wide at back of third step". */
  riser: { rise: 203.2, tread: 457.2, rail: 1066.8, unitW: 1828.8 },
  /** A stand's base keeps this far from a singer's feet (plan, mm). ILLUSTRATIVE. */
  footClear: 280,
} as const;
type Body = (typeof VOX)['adult'] | (typeof VOX)['child'];
export const bodyOf = (k: Kind): Body => (k === 'child' ? VOX.child : VOX.adult);

/** A singer's right (as they face), frame S. */
export const rightOf = (face: number): Vec3 => v3(Math.cos(face * DEG), 0, Math.sin(face * DEG));
/** A singer's lips (frame S): `lipAhead` in front of the seat, `lip` above its surface. */
export function lipOf(q: Seat): Vec3 {
  const b = bodyOf(q.kind);
  return add(add(q.p, mul(planDir(q.face), b.lipAhead)), v3(0, -b.lip, 0));
}
/** The singer's mouth as a frame-V anchor (voiceSpec.VoiceAnchor): the lips,
 *  the mouth's axis (level, the way they face), up, and their right. */
export function mouthOf(q: Seat): { lip: Vec3; fwd: Vec3; up: Vec3; right: Vec3 } {
  return { lip: lipOf(q), fwd: planDir(q.face), up: v3(0, -1, 0), right: rightOf(q.face) };
}
/** The centre of the singer's head (frame S). */
export function headCentreOf(q: Seat): Vec3 {
  const b = bodyOf(q.kind);
  return add(add(lipOf(q), mul(planDir(q.face), -b.headBack)), v3(0, -b.headUp, 0));
}

/** Does a point (a mic's front) touch a singer — the head, or the body below
 *  the chin, as frame V draws them? ILLUSTRATIVE clearances (15 mm round the
 *  head, 20 mm round the body). */
export function voiceTouches(q: Seat, c: Vec3): boolean {
  const b = bodyOf(q.kind);
  const k = b.scale;
  const hc = headCentreOf(q);
  if (length(sub(c, hc)) < b.headR + 15) return true;
  const h = -(c.y - q.p.y);
  if (h < 0 || h > b.lip - 100 * k) return false;
  const d = sub(c, q.p);
  const a = dot(d, planDir(q.face));
  const r = dot(d, rightOf(q.face));
  return Math.abs(a) < 140 * k && Math.abs(r) < 235 * k;
}

/* ── building ── */
/** The face (frameS.planDir degrees) from p toward a point. */
export function faceToward(p: Vec3, t: Vec3): number {
  return Math.atan2(t.x - p.x, -(t.z - p.z)) / DEG;
}
/** A standing singer whose LIPS are at `lip` (x, z; the height comes from the
 *  kind and the surface `h`), facing `face`. */
function atLips(id: string, kind: Kind, section: string, lip: { x: number; z: number }, face: number, h = 0): Seat {
  const b = bodyOf(kind);
  const f = planDir(face);
  return { id, kind, section, p: v3(lip.x - f.x * b.lipAhead, -h, lip.z - f.z * b.lipAhead), face, posture: 'standing', stand: null };
}
/** A standing singer on the floor point `p` (on a surface `h` high), facing a point. */
function standAt(id: string, kind: Kind, section: string, x: number, z: number, toward: Vec3, h = 0): Seat {
  const p = v3(x, -h, z);
  return { id, kind, section, p, face: faceToward(p, toward), posture: 'standing', stand: null };
}
function sectionsFrom(seats: readonly Seat[], defs: readonly Omit<Section, 'seats'>[]): Section[] {
  return defs.map((d) => ({ ...d, seats: seats.filter((s) => s.section === d.id).map((s) => s.id) })).filter((d) => d.seats.length);
}

const SINGS = 'From the singer’s mouth: forward and round the front of the head — the highest frequencies mostly straight ahead, the lows all round.';
const voiceSec = (id: string, label: string, short: string, radiates = SINGS): Omit<Section, 'seats'> => ({ id, label, short, family: 'voices', radiates });
const TRIO = [voiceSec('hi', 'high harmony', 'HIGH'), voiceSec('mid', 'middle part', 'MIDDLE'), voiceSec('lo', 'low harmony', 'LOW')];
const SATB = (what: string) => [
  voiceSec('sop', 'sopranos', 'SOPRANOS', `From the sopranos’ mouths, toward the conductor: ${what}`),
  voiceSec('alt', 'altos', 'ALTOS', `From the altos’ mouths, toward the conductor: ${what}`),
  voiceSec('ten', 'tenors', 'TENORS', `From the tenors’ mouths, toward the conductor: ${what}`),
  voiceSec('bas', 'basses', 'BASSES', `From the basses’ mouths, toward the conductor: ${what}`),
];
const QUARTET = [voiceSec('sop', 'soprano', 'SOPRANO'), voiceSec('alt', 'alto', 'ALTO'), voiceSec('ten', 'tenor', 'TENOR'), voiceSec('bas', 'bass', 'BASS')];

/** A director on a low podium in front (choirs). */
function director(z: number, h = 150) {
  const podium = { c: v3(0, -h, z), w: 900, d: 900, h };
  const conductor: Seat = { id: 'cond', kind: 'conductor', section: 'cond', p: v3(0, -h, z + 80), face: 0, posture: 'standing', stand: v3(0, -h, z - 300) };
  return { podium, conductor };
}

/** THE PRESETS. */
export const VOICE_SEATING_IDS = ['vocal.line', 'vocal.shared', 'vocal.circle', 'duo.shared', 'duo.fig8', 'vocal.quartet', 'choir.risers', 'choir.arc', 'choir.children', 'choir.childrenSolo'] as const;
export type VoiceSeatingId = (typeof VOICE_SEATING_IDS)[number];

/** Where a shared mic stands (frame S): the centre the singers' lips are
 *  measured from, at their mouth height. */
export const SHARED_AT: Record<'vocal.shared' | 'duo.shared' | 'vocal.circle' | 'duo.fig8', Vec3> = {
  'vocal.shared': v3(0, -VOX.adult.lip, 0),
  'duo.shared': v3(0, -VOX.adult.lip, 0),
  'vocal.circle': v3(0, -VOX.adult.lip, -900),
  'duo.fig8': v3(0, -VOX.adult.lip, -500),
};
/** The singers' lips round a shared mic (mm): a DRAWING DEFAULT (no source
 *  gives the radius; the proposal's 400). The circle and the figure-8 duet a
 *  little wider (500, 300 each side). */
export const SHARED_R = { arc: 400, circle: 500, fig8: 300 } as const;

function lineOf(): Seating {
  // Three backing singers in a row beside the band, facing the hall, 1.1 m apart.
  const xs = [-1100, 0, 1100];
  const secs = ['hi', 'mid', 'lo'];
  const seats = xs.map((x, i) => atLips(`${secs[i]}.1`, 'singer', secs[i], { x, z: -150 }, 180));
  return {
    id: 'vocal.line',
    label: 'Three singers in a row',
    blurb: 'Three backing singers in a row on a stage, about 1.1 m apart, each at a microphone of their own — the band behind them.',
    seats,
    sections: sectionsFrom(seats, TRIO),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -1700, x1: 1700, z0: -800, z1: 1300 },
  };
}

function arcRound(id: 'vocal.shared' | 'duo.shared', angles: readonly number[], secs: readonly string[], defs: readonly Omit<Section, 'seats'>[], label: string, blurb: string): Seating {
  const M = SHARED_AT[id];
  const seats = angles.map((th, i) => {
    const lip = { x: M.x + SHARED_R.arc * Math.sin(th * DEG), z: M.z - SHARED_R.arc * Math.cos(th * DEG) };
    return atLips(`${secs[i]}.1`, 'singer', secs[i], lip, faceToward(v3(lip.x, 0, lip.z), M));
  });
  return { id, label, blurb, seats, sections: sectionsFrom(seats, defs), risers: [], podium: null, conductor: null, stage: { x0: -1200, x1: 1200, z0: -1000, z1: 900 } };
}

function circleOf(): Seating {
  const M = SHARED_AT['vocal.circle'];
  const secs = ['sop', 'alt', 'ten', 'bas'];
  // Round a centre, the voices at 45° to the room's axes (so two face each side of a back-to-back pair).
  const angles = [-45, 45, 135, 225];
  const seats = angles.map((th, i) => {
    const lip = { x: M.x + SHARED_R.circle * Math.sin(th * DEG), z: M.z - SHARED_R.circle * Math.cos(th * DEG) };
    return atLips(`${secs[i]}.1`, 'singer', secs[i], lip, faceToward(v3(lip.x, 0, lip.z), M));
  });
  return {
    id: 'vocal.circle',
    label: 'Four singers round one mic',
    blurb: 'Four singers standing in a circle round one microphone in a studio, facing it — they balance themselves by stepping in and out.',
    seats,
    sections: sectionsFrom(seats, QUARTET),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -1300, x1: 1300, z0: -2000, z1: 200 },
  };
}

function fig8Of(): Seating {
  const M = SHARED_AT['duo.fig8'];
  const seats = [atLips('hi.1', 'singer', 'hi', { x: M.x - SHARED_R.fig8, z: M.z }, 90), atLips('lo.1', 'singer', 'lo', { x: M.x + SHARED_R.fig8, z: M.z }, 270)];
  return {
    id: 'duo.fig8',
    label: 'Two singers face to face',
    blurb: 'A duet in a studio: the two singers face each other across one microphone, one in front of it and one behind.',
    seats,
    sections: sectionsFrom(seats, [voiceSec('hi', 'higher voice', 'HIGH'), voiceSec('lo', 'lower voice', 'LOW')]),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -1100, x1: 1100, z0: -1100, z1: 300 },
  };
}

function quartetOf(): Seating {
  // Four singers 75 cm apart on a shallow arc, all facing a point well in front.
  const P = v3(0, 0, 3000);
  const R = 3200;
  const xs = [-1125, -375, 375, 1125];
  const secs = ['sop', 'alt', 'ten', 'bas'];
  const seats = xs.map((x, i) => {
    const lip = { x, z: P.z - Math.sqrt(R * R - x * x) - 200 + (R - P.z) };
    return atLips(`${secs[i]}.1`, 'singer', secs[i], lip, faceToward(v3(lip.x, 0, lip.z), P));
  });
  return {
    id: 'vocal.quartet',
    label: 'An a cappella quartet',
    blurb: 'Four singers about 75 cm apart on a shallow arc, facing the room: one pair in front of them, or a mic each.',
    seats,
    sections: sectionsFrom(seats, QUARTET),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -1700, x1: 1700, z0: -800, z1: 1900 },
  };
}

/** The CHOIR ON RISERS: a floor row in front, then three rows on three
 *  Wenger-size steps (8 in rise, 18 in tread) — three 6 ft units side by
 *  side, straight; a back rail on the top step. Sopranos front left, altos
 *  front right, tenors behind the sopranos, basses behind the altos. */
export const CHOIR = {
  /** The floor row's seat line, and the risers' front edge (mm, z). */
  floorRowZ: -130,
  riserFront: -450,
  units: 3,
  rows: [10, 9, 10, 9],
  /** The conductor's podium centre, 3 m in front: room for a main pair on a
   *  stand between the choir and the conductor. */
  director: 3000,
  /** The chamber choir's conductor. */
  arcDirector: 3000,
} as const;
function risersOf(): Seating {
  const R = VOX.riser;
  const half = (CHOIR.units * R.unitW) / 2;
  const D = v3(0, 0, 3200);
  const seats: Seat[] = [];
  const zOf = (row: number) => (row === 0 ? CHOIR.floorRowZ : CHOIR.riserFront - (row - 0.5) * R.tread);
  CHOIR.rows.forEach((n, row) => {
    const x0 = -((n - 1) * VOX.pitch.adult) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * VOX.pitch.adult;
      const sec = row < 2 ? (x < 0 ? 'sop' : 'alt') : x < 0 ? 'ten' : 'bas';
      const k = seats.filter((s) => s.section === sec).length + 1;
      seats.push(standAt(`${sec}.${k}`, 'chorister', sec, x, zOf(row), D, row * R.rise));
    }
  });
  const back = CHOIR.riserFront - 3 * R.tread;
  const risers: Riser[] = [1, 2, 3].map((k) => ({ x0: -half, x1: half, z0: back, z1: CHOIR.riserFront - (k - 1) * R.tread, h: k * R.rise, ...(k === 3 ? { rail: R.rail } : {}) }));
  const { podium, conductor } = director(CHOIR.director);
  return {
    id: 'choir.risers',
    label: 'A choir on risers',
    blurb: 'A choir of 38 in four rows: one on the floor, three on 8 in steps behind — sopranos and altos in front, tenors and basses behind, a conductor in front.',
    seats,
    sections: sectionsFrom(seats, SATB('the rows behind sing over the heads in front, the steps lifting them.')),
    risers,
    podium,
    conductor,
    stage: { x0: -3300, x1: 3300, z0: back - 400, z1: CHOIR.director + 900 },
  };
}

/** A twelve-voice chamber choir on a shallow arc, two rows on the floor. */
function choirArc(): Seating {
  const D = v3(0, 0, 3200);
  const seats: Seat[] = [];
  // The arc curves toward the conductor: the outer singers a little nearer.
  const rowAt = (xs: readonly number[], z0: number, secs: readonly [string, string]) => {
    for (const x of xs) {
      const sec = x < 0 ? secs[0] : secs[1];
      const k = seats.filter((s) => s.section === sec).length + 1;
      seats.push(standAt(`${sec}.${k}`, 'chorister', sec, x, z0 + (x * x) / (2 * 3300), D));
    }
  };
  rowAt([-1500, -900, -300, 300, 900, 1500], -130, ['sop', 'alt']);
  rowAt([-1650, -990, -330, 330, 990, 1650], -760, ['ten', 'bas']);
  const { podium, conductor } = director(CHOIR.arcDirector);
  return {
    id: 'choir.arc',
    label: 'A chamber choir on an arc',
    blurb: 'Twelve singers in two rows on a shallow arc, on the floor: sopranos and altos in front, tenors and basses behind, a conductor in front.',
    seats,
    sections: sectionsFrom(seats, SATB('two rows close together, the back row between the heads in front.')),
    risers: [],
    podium,
    conductor,
    stage: { x0: -2500, x1: 2500, z0: -1500, z1: CHOIR.arcDirector + 900 },
  };
}

/** A CHILDREN'S CHOIR in two rows — the front on the floor, the back on one
 *  8 in step — sopranos to the conductor's left, altos to the right. Drawn
 *  from above only (E06, the lead ruling). */
export const CHILDREN = { frontZ: -110, riserFront: -380, front: 8, back: 7, /** A featured child steps forward to a stand mic (the lips this far in front). */ soloZ: 900 } as const;
function childrenOf(solo = false): Seating {
  const R = VOX.riser;
  const P = VOX.pitch.child;
  const D = v3(0, 0, 2800);
  const seats: Seat[] = [];
  const row = (n: number, z: number, h: number) => {
    const x0 = -((n - 1) * P) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * P;
      const sec = x < 0 ? 'sop' : 'alt';
      const k = seats.filter((s) => s.section === sec).length + 1;
      seats.push(standAt(`${sec}.${k}`, 'child', sec, x, z, D, h));
    }
  };
  row(CHILDREN.front, CHILDREN.frontZ, 0);
  row(CHILDREN.back, CHILDREN.riserFront - R.tread / 2, R.rise);
  // The featured child: stepped forward of the front row, a little to the
  // conductor's left of centre, facing the hall.
  if (solo) seats.push(atLips('solo.1', 'child', 'solo', { x: -500, z: CHILDREN.soloZ }, 180));
  const half = (CHILDREN.front * P) / 2 + 200;
  const { podium, conductor } = director(solo ? 3100 : 2800);
  const kid = (what: string) => `From each child’s mouth, lower than an adult’s: ${what}`;
  return {
    id: solo ? 'choir.childrenSolo' : 'choir.children',
    label: solo ? 'A featured child at a stand mic' : 'A children’s choir in two rows',
    blurb: solo
      ? 'The same choir, one child stepped forward to sing a solo at a stand mic an adult has set — the conductor in front. Shown from above only.'
      : 'Fifteen children in two rows — the front row on the floor, the back row on one 8 in step — a conductor in front. Shown from above only.',
    seats,
    sections: sectionsFrom(seats, [
      voiceSec('sop', 'sopranos', 'SOPRANOS', kid('forward, toward the conductor — often quieter than adult voices.')),
      voiceSec('alt', 'altos', 'ALTOS', kid('forward, toward the conductor; the back row a step higher.')),
      voiceSec('solo', 'featured singer', 'SOLOIST', kid('forward, toward the hall — one young voice, close to its own mic.')),
    ]),
    risers: [{ x0: -half, x1: half, z0: CHILDREN.riserFront - R.tread, z1: CHILDREN.riserFront, h: R.rise }],
    podium,
    conductor,
    stage: { x0: -2600, x1: 2600, z0: CHILDREN.riserFront - R.tread - 500, z1: solo ? 4000 : 3700 },
  };
}

export function voiceSeating(id: VoiceSeatingId): Seating {
  switch (id) {
    case 'vocal.line':
      return lineOf();
    case 'vocal.shared':
      return arcRound('vocal.shared', [-60, 0, 60], ['hi', 'mid', 'lo'], TRIO, 'Three singers round one mic', 'Three singers on an arc round one shared microphone, each mouth about the same distance from it — they balance by stepping in and out.');
    case 'vocal.circle':
      return circleOf();
    case 'duo.shared':
      return arcRound('duo.shared', [-40, 40], ['hi', 'lo'], [voiceSec('hi', 'higher voice', 'HIGH'), voiceSec('lo', 'lower voice', 'LOW')], 'A duet at one mic', 'Two singers side by side on a semicircle in front of one microphone, each mouth the same distance from it.');
    case 'duo.fig8':
      return fig8Of();
    case 'vocal.quartet':
      return quartetOf();
    case 'choir.risers':
      return risersOf();
    case 'choir.arc':
      return choirArc();
    case 'choir.children':
      return childrenOf();
    case 'choir.childrenSolo':
      return childrenOf(true);
  }
}

/** The 3:1 readout between two separate mics, each on its nearest singer
 *  (lead ruling, lead_vocal/SOURCES.md §0.2): mic-to-mic over the larger
 *  mic-to-source distance. */
export function mouthDistance(q: Seat, mic: Vec3): number {
  return length(sub(lipOf(q), mic));
}
/** The singer nearest a mic (by the lips). */
export function nearestSinger(s: Seating, mic: Vec3): Seat {
  const voices = s.seats.filter((q) => q.kind === 'singer' || q.kind === 'chorister' || q.kind === 'child');
  return [...voices].sort((a, b) => mouthDistance(a, mic) - mouthDistance(b, mic))[0];
}
/** A direction from a point to another (unit). */
export const toward = (from: Vec3, to: Vec3): Vec3 => unit(sub(to, from));
