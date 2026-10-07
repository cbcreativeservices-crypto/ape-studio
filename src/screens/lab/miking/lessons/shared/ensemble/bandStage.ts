/**
 * THE STAGE-PLOT PRESETS (group 4: E09 complete band, E15 jazz combo, E08
 * acoustic small groups) — frame S (frameS.ts), built on the seating core
 * (seating.ts: `seatingOf` calls `bandSeating` for these ids). Pure; tested
 * (test/mikingLab5Bands.test.ts). Research: docs/labs/miking/
 * rhythm_section_band/, jazz_combo/, acoustic_small_group/ (SOURCES.md,
 * GEOMETRY_PROPOSAL.md) — "All token positions = drawing defaults (lesson
 * gives none)".
 *
 *   band.stage     a rock band on a stage: the kit on a riser upstage, the
 *                  guitar and bass in front of their amps, keys at the side,
 *                  the singer downstage centre; a wedge for each player, a
 *                  drum fill, the PA at the front corners
 *   band.room      the same band tracking in one room: facing each other,
 *                  the amps turned toward the walls (a gobo by the guitar
 *                  amp), the singer facing the drummer, no wedges
 *   jazz.quartet   piano, upright bass, drums, tenor sax on a club stage
 *   jazz.guitar    guitar (its amp turned away from the drums — the move in
 *                  the jazz research), upright bass, drums, trumpet
 *   acoustic.duo   a seated guitar and mandolin
 *   acoustic.trio  guitar, fiddle and upright bass on an arc
 *
 * Left and right are said as the AUDIENCE sees the stage (`viewer`): the
 * plan is a stage plot, downstage at the bottom; +x is the audience's right,
 * so the players' own left.
 *
 * REUSED, NEVER RE-DERIVED: the drum kit is Lab 1's shared kit
 * (kitPlanModel.ts, the kick's own geometry), placed whole; the amps are
 * Lab 4's cabinets (speakerModel.ts CABINETS, cabLayout — their sourced
 * sizes and speaker positions); the singer's lips sit at the voice family's
 * standing height (voiceSpec VOICE_DIMS.lipStanding) and offset (HEAD_C).
 * Every POSITION here is a drawing default.
 */
import type { Vec3 } from '../../../engine/model/types.ts';
import type { BandSeatingId, Family, Gear, GearKind, Kind, Posture, Seat, Seating, Section } from './seating.ts';
import { add, mul, planDir, v3 } from './frameS.ts';
import { KIT, KIT_DRUMS, KIT_FLOOR_Y } from '../kitPlanModel.ts';
import { KICK_ANCHORS } from '../../m01Kick/geometry.ts';
import { cabLayout, type CabKind } from '../speakers/speakerModel.ts';
import { BASS_HEAD } from '../speakers/ampModel.ts';
import { HEAD_C, VOICE_DIMS } from '../voice/voiceSpec.ts';

const BAND_IDS: readonly BandSeatingId[] = ['band.stage', 'band.room', 'jazz.quartet', 'jazz.guitar', 'acoustic.duo', 'acoustic.trio'];
export const isBandSeating = (id: string): id is BandSeatingId => (BAND_IDS as readonly string[]).includes(id);

/* ── frames ── */
/** A plan direction's RIGHT (as one faces `face`): the engine's left-handed
 *  frame, so facing +z (downstage) the right is −x. */
export const rightOf = (face: number): Vec3 => v3(Math.cos((face * Math.PI) / 180), 0, Math.sin((face * Math.PI) / 180));
/** A point `fwd` ahead, `right` to the right and `up` above a floor point. */
export function local(p: Vec3, face: number, fwd: number, right: number, up: number): Vec3 {
  return add(add(add(p, mul(planDir(face), fwd)), mul(rightOf(face), right)), v3(0, -up, 0));
}

/**
 * THE KIT, PLACED (Lab 1's shared kit, kitPlanModel.ts frame K: origin the
 * kick's batter-head centre, +x toward the audience, +y down, +z the
 * drummer's right, the floor at y = KIT_FLOOR_Y). A drumkit seat is the
 * drummer on the throne; the whole kit follows from it: K's +x is the way
 * the drummer faces, K's +z the drummer's right.
 */
export function kitOrigin(seat: Pick<Seat, 'p' | 'face'>): Vec3 {
  // The throne sits at K (−770, ·, −110): step forward 770 and right 110.
  return local(seat.p, seat.face, -KIT.throne.c.u, -KIT.throne.c.v, 0);
}
/** A frame-K point of the kit in frame S, for the drummer at `seat`. */
export function kitPoint(seat: Pick<Seat, 'p' | 'face'>, k: Vec3): Vec3 {
  const O = kitOrigin(seat);
  return add(add(add(v3(O.x, seat.p.y, O.z), mul(planDir(seat.face), k.x)), mul(rightOf(seat.face), k.z)), v3(0, k.y - KIT_FLOOR_Y, 0));
}
/** The snare head's centre (the kit's sound centre in this lab: a drawing
 *  default — a kit is a large, spread source). */
export const kitSnare = (seat: Pick<Seat, 'p' | 'face'>): Vec3 => kitPoint(seat, KIT_DRUMS.snare.c);
/** The kick's front head: its centre and its port (M01's own anchors). */
export const kitKickFront = (seat: Pick<Seat, 'p' | 'face'>): { c: Vec3; port: Vec3 } => ({ c: kitPoint(seat, KICK_ANCHORS['bd.reso.center']), port: kitPoint(seat, KICK_ANCHORS['bd.port.center']) });

/**
 * THE AMPS — Lab 4's cabinets (speakerModel.ts: the combo's 24.5 × 17.5 ×
 * 9.5 in, the 4×10's 30 × 24 × 19 in, sourced) standing on the floor; a
 * gear's `p` is the floor under its footprint's centre, `face` the way its
 * grille faces. The bass head (a drawing default) sits on the 4×10.
 */
export type AmpGeom = { w: number; h: number; d: number; head: number; speaker: { fwd: number; right: number; up: number }; centre: { up: number; right: number } };
const ampCache = new Map<CabKind, AmpGeom>();
export function ampGeom(kind: 'combo' | 'bassRig'): AmpGeom {
  const cab: CabKind = kind === 'combo' ? 'combo12' : 'bass410';
  const hit = ampCache.get(cab);
  if (hit) return hit;
  const L = cabLayout(cab);
  const b = L.box;
  const xc = (b.x0 + b.x1) / 2;
  const zc = (b.z0 + b.z1) / 2;
  const g: AmpGeom = {
    w: L.spec.w.mm,
    h: L.spec.h.mm,
    d: L.spec.d.mm,
    head: kind === 'bassRig' ? BASS_HEAD.h.mm : 0,
    // The active speaker's centre on the GRILLE plane (frame C: x = GRILLE_X).
    speaker: { fwd: b.x1 - xc, right: -zc, up: L.floorY },
    // The baffle's centre (all drivers together).
    centre: { up: L.floorY - L.centre.y, right: L.centre.z - zc },
  };
  ampCache.set(cab, g);
  return g;
}
/** The active speaker's centre on an amp's grille (frame S). */
export function ampSpeaker(g: Pick<Gear, 'kind' | 'p' | 'face'>): Vec3 {
  const a = ampGeom(g.kind === 'bassRig' ? 'bassRig' : 'combo');
  return local(g.p, g.face, a.speaker.fwd, a.speaker.right, a.speaker.up);
}
/** An amp's sound centre: the combo's speaker; the 4×10's baffle centre. */
export function ampSound(g: Pick<Gear, 'kind' | 'p' | 'face'>): Vec3 {
  const a = ampGeom(g.kind === 'bassRig' ? 'bassRig' : 'combo');
  return g.kind === 'bassRig' ? local(g.p, g.face, a.d / 2, a.centre.right, a.centre.up) : ampSpeaker(g);
}

/** Gear sizes (mm: across, deep, high). Amps from their cabinets; the rest
 *  drawing defaults (a floor wedge, a DI box, a PA box on a stand, a gobo). */
export const GEAR_SIZE: Record<GearKind, { w: number; d: number; h: number }> = {
  combo: { w: ampGeom('combo').w, d: ampGeom('combo').d, h: ampGeom('combo').h },
  bassRig: { w: ampGeom('bassRig').w, d: ampGeom('bassRig').d, h: ampGeom('bassRig').h + ampGeom('bassRig').head },
  wedge: { w: 560, d: 400, h: 330 },
  di: { w: 110, d: 150, h: 55 },
  pa: { w: 450, d: 380, h: 1900 },
  gobo: { w: 1200, d: 80, h: 1500 },
};
/** A PA box on its stand: the box's height and where it sits (drawing defaults). */
export const PA_BOX = { h: 700, bottom: 1200 } as const;

/** The singer's lip point (the voice family's standing height and offset
 *  ahead of the head's axis) and the mouth's directions — a VoiceAnchor. */
export function singerAnchor(seat: Pick<Seat, 'p' | 'face'>): { lip: Vec3; fwd: Vec3; up: Vec3; right: Vec3 } {
  const ahead = -HEAD_C.x;
  return { lip: local(seat.p, seat.face, ahead, 0, VOICE_DIMS.lipStanding.mm), fwd: planDir(seat.face), up: v3(0, -1, 0), right: rightOf(seat.face) };
}

/**
 * THE GUITAR FAMILY ON A PLAYER (BandArt.tsx draws it from these; the
 * lessons aim their spots at the same points): the body's tail at the
 * player's right hip (standing, on a strap) or right thigh (seated), its
 * top facing forward `fwd` mm ahead of the player, the axis rising to the
 * player's left at `ang`°; body and neck lengths. Drawing defaults.
 */
export type GuitarKind = 'eguitar' | 'ebass' | 'aguitar' | 'mandolin';
export const GUITAR_POSE: Record<GuitarKind, { tailR: number; tailUp: number; fwd: number; ang: number; L: number; neck: number }> = {
  eguitar: { tailR: 180, tailUp: 820, fwd: 170, ang: 24, L: 450, neck: 450 },
  ebass: { tailR: 180, tailUp: 820, fwd: 170, ang: 24, L: 500, neck: 700 },
  aguitar: { tailR: 170, tailUp: 470, fwd: 230, ang: 18, L: 500, neck: 430 },
  mandolin: { tailR: 170, tailUp: 760, fwd: 230, ang: 32, L: 330, neck: 300 },
};
/** A point `s` mm along a held guitar's axis from its tail (frame S). */
export function guitarPoint(seat: Pick<Seat, 'p' | 'face'>, k: GuitarKind, s: number): Vec3 {
  const g = GUITAR_POSE[k];
  const a = (g.ang * Math.PI) / 180;
  return local(seat.p, seat.face, g.fwd, g.tailR - Math.cos(a) * s, g.tailUp + Math.sin(a) * s);
}
/** Where the sound leaves a held acoustic: its sound hole (about 62 % up the body). */
export const soundHole = (seat: Pick<Seat, 'p' | 'face'>, k: 'aguitar' | 'mandolin'): Vec3 => guitarPoint(seat, k, GUITAR_POSE[k].L * 0.62);

/* ── building blocks ── */
type SecDef = { id: string; label: string; short: string; family: Family; radiates: string };
const SEC: Record<string, SecDef> = {
  drums: { id: 'drums', label: 'drum kit', short: 'DRUMS', family: 'percussion', radiates: 'From every head and cymbal at once — loud, and spread across about two metres: the kit reaches every open mic on the stage.' },
  gtr: { id: 'gtr', label: 'electric guitar', short: 'GUITAR', family: 'amplified', radiates: 'From its amp’s speaker, not the guitar: strongest straight out of the grille, the highs in the narrowest beam. Which way the amp faces decides who hears it.' },
  bass: { id: 'bass', label: 'electric bass', short: 'BASS', family: 'amplified', radiates: 'From the bass amp’s speakers — the low notes spread all round the stage — and, as a clean electrical copy, from its DI box.' },
  keys: { id: 'keys', label: 'keyboard', short: 'KEYS', family: 'keys', radiates: 'Nothing acoustic worth a mic: it leaves by its line output, through a DI box. On the stage it is heard from the wedges and the PA.' },
  vox: { id: 'vox', label: 'lead vocal', short: 'VOCAL', family: 'voice', radiates: 'From the singer’s mouth, forward — the quietest source on a band stage, which is why its mic is the closest one.' },
  pno: { id: 'pno', label: 'grand piano', short: 'PIANO', family: 'keys', radiates: 'From the soundboard and strings under the lid; the open lid throws much of it toward the audience — and the drums reach in under the lid too.' },
  ub: { id: 'ub', label: 'upright bass', short: 'BASS', family: 'strings', radiates: 'From the top plate and the f-holes, low and wide, and into the floor through the endpin: easily masked by the drums and the piano.' },
  sax: { id: 'sax', label: 'tenor sax', short: 'SAX', family: 'winds', radiates: 'From the bell AND the open tone holes along the body — not the bell alone — and the player moves as they solo.' },
  tpt: { id: 'tpt', label: 'trumpet', short: 'TRUMPET', family: 'brass', radiates: 'From the bell, forward and narrow in the highs: loud on its axis, much less to the side.' },
  jgtr: { id: 'jgtr', label: 'guitar', short: 'GUITAR', family: 'amplified', radiates: 'From its amp’s speaker. Here the amp is turned away from the drums, so less of it reaches the drum mics.' },
  ag: { id: 'ag', label: 'acoustic guitar', short: 'GUITAR', family: 'strings', radiates: 'From the top and the sound hole, forward from the player’s lap: a mic straight at the hole hears it boomy; toward the 12th fret, more balanced.' },
  mdn: { id: 'mdn', label: 'mandolin', short: 'MANDOLIN', family: 'strings', radiates: 'From a small top and its openings — bright, and strongest straight out from the picking hand.' },
  fid: { id: 'fid', label: 'fiddle', short: 'FIDDLE', family: 'strings', radiates: 'Up and out from the top plate and the f-holes, under the player’s chin — bright along the bow’s line.' },
};
function sections(seats: readonly Seat[], order: readonly string[]): Section[] {
  return order.filter((id) => seats.some((s) => s.section === id)).map((id) => ({ ...SEC[id], seats: seats.filter((s) => s.section === id).map((s) => s.id) }));
}
function seat(id: string, kind: Kind, section: string, p: Vec3, face: number, posture: Posture, extra: Partial<Seat> = {}): Seat {
  return { id, kind, section, p, face, posture, stand: null, ...extra };
}
function gear(id: string, kind: GearKind, p: Vec3, face: number, label: string, short: string, section?: string): Gear {
  return { id, kind, p, face, label, short, ...(section ? { section } : {}) };
}
/** An amplified player: the sound leaves from the amp (Seat.src). */
function ampPlayer(id: string, kind: Kind, section: string, p: Vec3, face: number, amp: Gear): Seat {
  return seat(id, kind, section, p, face, 'standing', { src: ampSound(amp), srcFace: amp.face });
}
/** A drummer on the throne at `p` (the kit follows, kitPoint). */
function drummer(id: string, p: Vec3, face: number): Seat {
  const s = seat(id, 'drumkit', 'drums', p, face, 'seated');
  return { ...s, src: kitSnare(s) };
}
/** A standing singer (the sound leaves at the lips). */
function singer(id: string, p: Vec3, face: number): Seat {
  const s = seat(id, 'singer', 'vox', p, face, 'standing');
  return { ...s, src: singerAnchor(s).lip };
}
/** A wedge `ahead` mm in front of a player, facing back at them. */
function wedgeFor(id: string, q: Seat, ahead = 900, label = 'a floor wedge'): Gear {
  const at = local(q.p, q.face, ahead, 0, 0);
  return gear(id, 'wedge', v3(at.x, q.p.y, at.z), (q.face + 180) % 360, label, 'WEDGE', q.section);
}

/* ── the presets ── */
/** How far a singer's wedge sits in front of them: past the vocal mic
 *  stand's boom and base (a drawing default; E01 draws 1 m with no stand). */
export const VOCAL_WEDGE = 1350;

/** Where the band's drummer and singer stand in BOTH band seatings (the
 *  same kit and the same vocal mic on the stage and in the room, so the
 *  shared pages' mics sit on them in either): drawing defaults. */
export const BAND_KIT = { p: v3(130, 0, -3820), face: 180 } as const;
export const BAND_SINGER = { p: v3(0, 0, -400), face: 180 } as const;

function bandStage(): Seating {
  const gAmp = gear('amp.gtr', 'combo', v3(-2700, 0, -2700), 180, 'the guitar amp', 'GUITAR AMP', 'gtr');
  const bAmp = gear('amp.bass', 'bassRig', v3(2700, 0, -2800), 180, 'the bass amp', 'BASS AMP', 'bass');
  const dr = drummer('drums.1', BAND_KIT.p, BAND_KIT.face);
  const gt = ampPlayer('gtr.1', 'eguitar', 'gtr', v3(-2600, 0, -1200), 180, gAmp);
  const bs = ampPlayer('bass.1', 'ebass', 'bass', v3(2500, 0, -1200), 180, bAmp);
  const ky = seat('keys.1', 'keys', 'keys', v3(4000, 0, -600), 205, 'standing');
  const vx = singer('vox.1', BAND_SINGER.p, BAND_SINGER.face);
  const seats = [dr, gt, bs, ky, vx];
  const fill = gear('mon.drums', 'wedge', v3(1050, 0, -3650), 270, 'the drummer’s monitor', 'DRUM FILL', 'drums');
  return {
    id: 'band.stage',
    label: 'A band on a stage',
    blurb: 'Drums upstage centre, guitar and bass in front of their amps, keys at the side, the singer downstage centre — a wedge for each player and the PA at the front corners.',
    seats,
    sections: sections(seats, ['drums', 'gtr', 'bass', 'keys', 'vox']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -5200, x1: 5200, z0: -5000, z1: 1900 },
    gear: [
      gAmp,
      bAmp,
      gear('di.bass', 'di', v3(2200, 0, -2150), 180, 'the bass DI box', 'DI', 'bass'),
      gear('di.keys', 'di', v3(4350, 0, -1150), 205, 'the keyboard DI box', 'DI', 'keys'),
      wedgeFor('mon.vox', vx, VOCAL_WEDGE, 'the singer’s wedge'),
      wedgeFor('mon.gtr', gt, 900, 'the guitarist’s wedge'),
      wedgeFor('mon.bass', bs, 900, 'the bassist’s wedge'),
      wedgeFor('mon.keys', ky, 900, 'the keyboard player’s wedge'),
      fill,
      gear('pa.L', 'pa', v3(-4800, 0, 1450), 180, 'the PA, audience left', 'PA'),
      gear('pa.R', 'pa', v3(4800, 0, 1450), 180, 'the PA, audience right', 'PA'),
    ],
    viewer: 'audience',
  };
}

function bandRoom(): Seating {
  // Hybrid tracking in one room: the rhythm section live, facing in; the
  // amps face the walls, away from the vocal mic and the room pair, a gobo
  // by the guitar amp's open back; the singer screened by a gobo behind.
  const gAmp = gear('amp.gtr', 'combo', v3(-3500, 0, -3000), 300, 'the guitar amp, facing the wall', 'GUITAR AMP', 'gtr');
  const bAmp = gear('amp.bass', 'bassRig', v3(3500, 0, -3100), 60, 'the bass amp, facing the wall', 'BASS AMP', 'bass');
  const dr = drummer('drums.1', BAND_KIT.p, BAND_KIT.face);
  const gt = ampPlayer('gtr.1', 'eguitar', 'gtr', v3(-2400, 0, -2000), 80, gAmp);
  const bs = ampPlayer('bass.1', 'ebass', 'bass', v3(2400, 0, -2000), 280, bAmp);
  const vx = singer('vox.1', BAND_SINGER.p, BAND_SINGER.face);
  const seats = [dr, gt, bs, vx];
  return {
    id: 'band.room',
    label: 'The band in one room',
    blurb: 'Tracking together in a studio room: the rhythm section faces in, the amps face the walls with a gobo by the guitar amp, the singer screened by a gobo — headphones, no wedges.',
    seats,
    sections: sections(seats, ['drums', 'gtr', 'bass', 'vox']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -4600, x1: 4600, z0: -5000, z1: 1300 },
    gear: [
      gAmp,
      bAmp,
      gear('gobo.gtr', 'gobo', v3(-2950, 0, -2500), 120, 'a gobo between the guitar amp and the room', 'GOBO', 'gtr'),
      gear('gobo.vox', 'gobo', v3(0, 0, -1150), 180, 'a gobo screening the singer from the band', 'GOBO', 'vox'),
      gear('di.bass', 'di', v3(2950, 0, -2500), 280, 'the bass DI box', 'DI', 'bass'),
    ],
    viewer: 'audience',
  };
}

/** The jazz kit (the drummer turned a little toward the band), the upright
 *  bass and the soloist — the same in both jazz seatings. */
const JAZZ_KIT = { p: v3(1700, 0, -2500), face: 205 } as const;
export const JAZZ_BASS = { p: v3(-350, 0, -2100), face: 195 } as const;
export const JAZZ_SOLO = { p: v3(650, 0, -300), face: 180 } as const;
/** A soloist's wedge: past the soloist's mic stand (a drawing default). */
export const SOLO_WEDGE = 1400;
/** A tenor's bell, from the player's floor point: ahead, to the right, up
 *  (a drawing default matching BandArt's tenor). */
export const SAX_BELL = { fwd: 250, right: 210, up: 820 } as const;
/** An upright bass's bridge, from the standing player's floor point (the
 *  seating drawing's bass: its body ahead of the player; a drawing default). */
export const UB_BRIDGE = { fwd: 470, right: -60, up: 830 } as const;
/** A standing upright bass whose sound is read at its bridge. */
function uprightBass(id: string, section: string, p: Vec3, face: number): Seat {
  const s = seat(id, 'bass', section, p, face, 'standing');
  return { ...s, src: local(p, face, UB_BRIDGE.fwd, UB_BRIDGE.right, UB_BRIDGE.up) };
}

function jazzQuartet(): Seating {
  const dr = drummer('drums.1', JAZZ_KIT.p, JAZZ_KIT.face);
  // The grand: the pianist faces the audience's right; the curved side and
  // the open lid toward the audience (the chamber group's layout).
  const pn = seat('pno.1', 'piano', 'pno', v3(-3400, 0, -900), 90, 'seated');
  const ub = uprightBass('ub.1', 'ub', JAZZ_BASS.p, JAZZ_BASS.face);
  const sx = seat('sax.1', 'sax', 'sax', JAZZ_SOLO.p, JAZZ_SOLO.face, 'standing');
  const sxs = { ...sx, src: local(sx.p, sx.face, SAX_BELL.fwd, SAX_BELL.right, SAX_BELL.up) };
  const seats = [dr, pn, ub, sxs];
  return {
    id: 'jazz.quartet',
    label: 'Piano, bass, drums and sax',
    blurb: 'A horn with a rhythm section on a club stage: the grand on the audience’s left with its lid open toward them, the upright bass between the piano and the drums, the sax out front.',
    seats,
    sections: sections(seats, ['pno', 'ub', 'drums', 'sax']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -4500, x1: 3700, z0: -3700, z1: 2000 },
    gear: [wedgeFor('mon.sax', sxs, SOLO_WEDGE, 'the sax player’s wedge'), wedgeFor('mon.ub', ub, 1000, 'the bassist’s wedge'), gear('pa.L', 'pa', v3(-4200, 0, 1550), 180, 'the PA, audience left', 'PA'), gear('pa.R', 'pa', v3(3400, 0, 1550), 180, 'the PA, audience right', 'PA')],
    viewer: 'audience',
  };
}

function jazzGuitar(): Seating {
  const dr = drummer('drums.1', JAZZ_KIT.p, JAZZ_KIT.face);
  // The amp faces down and away from the drums (toward the audience's left).
  const gAmp = gear('amp.gtr', 'combo', v3(-3000, 0, -1900), 235, 'the guitar amp, turned away from the drums', 'GUITAR AMP', 'jgtr');
  const gt = ampPlayer('jgtr.1', 'eguitar', 'jgtr', v3(-2300, 0, -900), 165, gAmp);
  const ub = uprightBass('ub.1', 'ub', JAZZ_BASS.p, JAZZ_BASS.face);
  const tp = seat('tpt.1', 'trumpet', 'tpt', JAZZ_SOLO.p, JAZZ_SOLO.face, 'standing');
  const tps = { ...tp, src: local(tp.p, tp.face, 560, 0, 1500) };
  const seats = [dr, gt, ub, tps];
  return {
    id: 'jazz.guitar',
    label: 'Guitar, bass, drums and trumpet',
    blurb: 'A guitar group on a club stage: the guitar amp turned away from the drums, the upright bass between them, the trumpet out front.',
    seats,
    sections: sections(seats, ['jgtr', 'ub', 'drums', 'tpt']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -4300, x1: 3700, z0: -3700, z1: 2000 },
    gear: [gAmp, wedgeFor('mon.tpt', tps, SOLO_WEDGE, 'the trumpet player’s wedge'), wedgeFor('mon.ub', ub, 1000, 'the bassist’s wedge'), gear('pa.L', 'pa', v3(-4000, 0, 1550), 180, 'the PA, audience left', 'PA'), gear('pa.R', 'pa', v3(3400, 0, 1550), 180, 'the PA, audience right', 'PA')],
    viewer: 'audience',
  };
}

/** The small groups sit on an arc round a point in front of them (the
 *  "equal distance" idea for a main mic): centre and radius, drawing
 *  defaults; the guitarist at the same place in the duo and the trio. */
export const TRIO_ARC = { c: v3(0, 0, 700), r: 1500, at: [-40, 0, 40] } as const;
/** A player at angle `th` on the arc, set back by how far ahead of them their
 *  instrument's sound leaves (`ahead`, mm), so the SOUND sits on the arc. */
const onArc = (th: number, ahead = 0) => {
  const R = TRIO_ARC.r + ahead;
  return v3(TRIO_ARC.c.x + R * Math.sin((th * Math.PI) / 180), 0, TRIO_ARC.c.z - R * Math.cos((th * Math.PI) / 180));
};
/** How far ahead of the player each small-group instrument's sound leaves (the drawings). */
const AHEAD = { aguitar: 230, mandolin: 230, violin: 120, bass: 470 } as const;

/** A seated guitar or mandolin whose sound is read at its sound hole. */
function heldAcoustic(id: string, kind: 'aguitar' | 'mandolin', section: string, p: Vec3, face: number): Seat {
  const s = seat(id, kind, section, p, face, 'seated');
  return { ...s, src: soundHole(s, kind) };
}

function acousticDuo(): Seating {
  const [a, , c] = TRIO_ARC.at;
  const ag = heldAcoustic('ag.1', 'aguitar', 'ag', onArc(a, AHEAD.aguitar), a + 180);
  const md = heldAcoustic('mdn.1', 'mandolin', 'mdn', onArc(c, AHEAD.mandolin), c + 180);
  const seats = [ag, md];
  return {
    id: 'acoustic.duo',
    label: 'Guitar and mandolin',
    blurb: 'A seated duo turned a little toward each other, both open to the audience: one pair in front can hear them as one group.',
    seats,
    sections: sections(seats, ['ag', 'mdn']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -2600, x1: 2600, z0: -1700, z1: 2600 },
    gear: [wedgeFor('mon.ag', ag, 1000, 'the guitarist’s wedge'), gear('di.ag', 'di', local(ag.p, ag.face, 120, 420, 0), ag.face, 'the guitar’s pickup DI box', 'DI', 'ag')],
    viewer: 'audience',
  };
}

function acousticTrio(): Seating {
  const [a, b, c] = TRIO_ARC.at;
  const ag = heldAcoustic('ag.1', 'aguitar', 'ag', onArc(a, AHEAD.aguitar), a + 180);
  const fd = seat('fid.1', 'violin', 'fid', onArc(b, AHEAD.violin), b + 180, 'seated');
  const ub = uprightBass('ub.1', 'ub', onArc(c, AHEAD.bass), c + 180);
  const seats = [ag, fd, ub];
  return {
    id: 'acoustic.trio',
    label: 'Guitar, fiddle and bass',
    blurb: 'A folk trio on an arc, each player about the same distance from a point in front of them — where one main pair can hear them evenly.',
    seats,
    sections: sections(seats, ['ag', 'fid', 'ub']),
    risers: [],
    podium: null,
    conductor: null,
    stage: { x0: -2600, x1: 2600, z0: -1800, z1: 2600 },
    gear: [wedgeFor('mon.ag', ag, 1000, 'the guitarist’s wedge')],
    viewer: 'audience',
  };
}

/** A stage-plot preset (seating.ts caches it). */
export function bandSeating(id: BandSeatingId): Seating {
  switch (id) {
    case 'band.stage':
      return bandStage();
    case 'band.room':
      return bandRoom();
    case 'jazz.quartet':
      return jazzQuartet();
    case 'jazz.guitar':
      return jazzGuitar();
    case 'acoustic.duo':
      return acousticDuo();
    case 'acoustic.trio':
      return acousticTrio();
  }
}

/** A CLOSE MIC for a stage plot (an EnsembleSetup single): `d` mm out from
 *  its source point `own` along the unit direction `from` (the side it is
 *  approached from), aimed back at the source. `d` comes from the source
 *  instrument's own lesson zone (the lesson geometry asserts it). */
export type CloseMic = { key: string; p: Vec3; aim: Vec3; pattern: 'cardioid' | 'omni' | 'supercardioid'; label: string; src: string; own: Vec3; typeId: string };
export function closeMic(o: { key: string; label: string; src: string; own: Vec3; from: Vec3; d: number; pattern?: CloseMic['pattern']; typeId: string; aimAt?: Vec3 }): CloseMic {
  const L = Math.hypot(o.from.x, o.from.y, o.from.z) || 1;
  const f = v3(o.from.x / L, o.from.y / L, o.from.z / L);
  const p = add(o.own, mul(f, o.d));
  const t = o.aimAt ?? o.own;
  const a = v3(t.x - p.x, t.y - p.y, t.z - p.z);
  const la = Math.hypot(a.x, a.y, a.z) || 1;
  return { key: o.key, label: o.label, src: o.src, own: o.own, typeId: o.typeId, pattern: o.pattern ?? 'cardioid', p, aim: v3(a.x / la, a.y / la, a.z / la) };
}

/** The gear of one section (an amp, its DI, its wedge). */
export const gearOf = (s: Seating, sectionId: string): Gear[] => (s.gear ?? []).filter((g) => g.section === sectionId);
/** An amp in a seating, by section. */
export const ampOf = (s: Seating, sectionId: string): Gear | undefined => gearOf(s, sectionId).find((g) => g.kind === 'combo' || g.kind === 'bassRig');
