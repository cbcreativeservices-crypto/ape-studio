/**
 * I02 CAJÓN — the technical truth (charter §2 layer 1). Keys point into
 * docs/labs/miking/cajon/SOURCES.md; geometry from cajon/GEOMETRY_PROPOSAL.md
 * (Frame J). The small-percussion family's helpers, with its own SEATED
 * player (the standing body is not used).
 *
 * FRAME J: mm; origin on the floor under the box's centre; +x toward the
 * audience (the front plate faces +x); +y DOWN (a height h is y = −h); +z the
 * player's right. The player sits astride the top, facing +x, leaning over
 * to strike the front plate between the knees.
 *
 * TWO STATES (a source control — "do not assume every cajón has a rear
 * hole"): REAR PORT — the measured museum box, its port on the back; FRONT
 * PORT — a front-port model: the playing surface set back above a low front
 * ledge whose port faces UP (the maker's "upward facing front port"). The
 * set-back plate is drawn vertical (the real one slants: a simplification).
 */
import type { Dim, DocumentedZone, Vec3, VariantId } from '../../engine/model/types.ts';
import { drawingDefault, elbowOf, ill, src, targetZone, v3, type Arm } from '../shared/smallperc/geom.ts';

export const CAJ_DIMS = {
  w: { mm: 317.5, prov: src('GRIN-CAJ', '12.5 in. width') } as Dim,
  d: { mm: 317.5, prov: src('GRIN-CAJ', '12.5 in. depth') } as Dim,
  h: { mm: 480.06, prov: src('GRIN-CAJ', '18.9 in. height') } as Dim,
  port: { mm: 177.8, prov: src('GRIN-CAJ', '7 in. diameter of soundhole') } as Dim,
  portH: drawingDefault(300, 'the rear port’s height on the back (not measured)'),
  plateT: drawingDefault(4, 'the front plate’s thickness'),
  wall: { mm: 12, prov: { kind: 'trial', src: 'MEINL-BUL', note: '9-Ply, 12mm thick Baltic Birch resonating body (another model)' } } as Dim,
  setBack: drawingDefault(69, 'how far a front-port model’s playing surface sits behind the front'),
  ledgeH: drawingDefault(170, 'the front-port ledge’s height'),
  portF: drawingDefault(100, 'the upward front port’s diameter'),
  feet: drawingDefault(8, 'the feet’s height'),
  near: { mm: 152.4, prov: src('S-DUVEL', 'one dead center, 6–7" from the front at a slight angle') } as Dim,
  far: { mm: 177.8, prov: src('S-DUVEL', 'one dead center, 6–7" from the front at a slight angle') } as Dim,
} as const;

export const HX = CAJ_DIMS.d.mm / 2;
export const HZ = CAJ_DIMS.w.mm / 2;
export const BH = CAJ_DIMS.h.mm;
export const PORT_R = CAJ_DIMS.port.mm / 2;

/** The SEATED player (ILLUSTRATIVE, proposal Frame J): hips on the top,
 *  torso leaning forward SLIGHTLY, knees either side of the plate, feet on
 *  the floor. Owner review 2026-10-10: from above the head covered the front
 *  plate between the hands — a player sitting ON the box keeps the head over
 *  its back half (shoulders ≈ 65 mm ahead of the hips, ≈ 9° of lean; the
 *  head ≈ 40 mm ahead of the shoulders), the arms reaching forward and down
 *  to the front edge. */
export const SEAT = {
  hip: v3(-150, -525, 0),
  hipZ: 105,
  shoulder: v3(-85, -930, 0),
  shoulderZ: 185,
  head: v3(-45, -1110, 0),
  knee: v3(235, -480, 0),
  kneeZ: 190,
  ankle: v3(260, -75, 0),
  ankleZ: 200,
  toe: v3(365, -28, 0),
  upperArm: 300,
  forearm: 265,
} as const;

export type CajId = 'rear' | 'frontport';
export type CajState = {
  id: CajId;
  /** The playing surface: its plane x, its centre (the lesson's reference). */
  plateX: number;
  plate: Vec3;
  /** The port: its centre, the way it faces, and its radius. */
  port: Vec3;
  portN: Vec3;
  portR: number;
  /** The two hands: R at a top corner (the slap), L at the centre (bass). */
  R: Arm;
  L: Arm;
};

function arm(side: 'R' | 'L', W: Vec3, G: Vec3): Arm {
  const S = v3(SEAT.shoulder.x, SEAT.shoulder.y, side === 'R' ? SEAT.shoulderZ : -SEAT.shoulderZ);
  return { S, E: elbowOf(S, W, v3(-0.2, 0.3, side === 'R' ? 0.9 : -0.9), SEAT.upperArm, SEAT.forearm), W, G };
}

function state(id: CajId): CajState {
  const front = id === 'frontport';
  const plateX = front ? HX - CAJ_DIMS.setBack.mm : HX;
  const lo = front ? CAJ_DIMS.ledgeH.mm : 0;
  const plate = v3(plateX, -(lo + (BH - lo) / 2), 0);
  const port = front ? v3((plateX + HX) / 2, -CAJ_DIMS.ledgeH.mm, 0) : v3(-HX, -CAJ_DIMS.portH.mm, 0);
  return {
    id,
    plateX,
    plate,
    port,
    portN: front ? v3(0, -1, 0) : v3(-1, 0, 0),
    portR: front ? CAJ_DIMS.portF.mm / 2 : PORT_R,
    R: arm('R', v3(plateX - 10, -545, 100), v3(plateX + 14, -440, 95)),
    L: arm('L', v3(plateX - 4, -435, -70), v3(plateX + 14, -330, -55)),
  };
}

export const STATES: Readonly<Record<CajId, CajState>> = { rear: state('rear'), frontport: state('frontport') };
export const stateOf = (v: VariantId): CajState => STATES[v === 'frontport' ? 'frontport' : 'rear'];

/** The hands' strike volume in front of the plate (proposal ko.hands, drawn
 *  narrower — out to 130 mm — so the published close point can be shown;
 *  the player check decides): one capsule for the CLEAR readout, and the
 *  box keep-out round both hands' arcs. */
export function motionOf(s: CajState): { a: Vec3; b: Vec3; r: number } {
  return { a: v3(s.plateX + 50, -180, 0), b: v3(s.plateX + 50, -520, 0), r: 80 };
}
export const handsBox = (s: CajState) => ({ min: v3(s.plateX, -560, -250), max: v3(s.plateX + 130, -150, 250) });

const BOTH = ['orchSdc', 'kickDynCard'];

function rearZones(): DocumentedZone[] {
  const s = STATES.rear;
  return [
    targetZone({
      id: 'caj.close.rear',
      label: 'Close, dead centre on the plate (rear port)',
      band: 'About 15–18 cm (6–7 in) from the middle of the plate, dead centre, at a slight angle — outside both hands’ arcs. One working example; check the player’s flourishes.',
      kind: 'sourced',
      src: 'S-DUVEL',
      quote: 'one dead center, 6–7" from the front at a slight angle',
      surface: 'plate.rear',
      c: s.plate,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [CAJ_DIMS.near.mm, CAJ_DIMS.far.mm],
      a: [0, 15],
      aimTol: 20,
      startD: 165,
      startA: 6,
      variants: ['rear'],
      micTypeIds: ['orchSdc'],
      clear: { line: 'clear.rear', min: 20 },
      tendency: 'Hand attack and the plate’s body together; close, so the hands’ reach decides it. Does the bass read?',
      checks: ['Both hands’ whole arcs, flourishes included', 'Bass strokes against slaps', 'Knees and the player standing up'],
    }),
    targetZone({
      id: 'caj.front.rear',
      label: 'Just below the top edge, angled down (rear port)',
      band: 'About 30–40 cm from the middle of the plate, just below the top edge’s height and in front, angled down at the middle of the plate — between the knees, out of the hands’ reach.',
      kind: 'sourced',
      src: 'SOS-WHITE',
      quote: 'just below the top edge of the box, angled downwards so that it aims at the centre of the playing surface',
      surface: 'plate.rear',
      c: s.plate,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [300, 400],
      a: [28, 45],
      aimTol: 25,
      startD: 350,
      startA: 37,
      variants: ['rear'],
      micTypeIds: BOTH,
      clear: { line: 'clear.rear', min: 100 },
      tendency: 'An integrated picture of the box: hand attack, slaps and body, with more room than the close spot.',
      checks: ['Does the bass read?', 'Slaps and the snare wires', 'The player’s head and the mic’s stand'],
    }),
    targetZone({
      id: 'caj.back.rear',
      label: 'Behind, offset about 45° toward the port (rear port)',
      band: 'About 20 cm out from the back, offset to one side by about 45°, pointing toward the port — out of its air and clear of the box rocking back.',
      kind: 'sourced',
      src: 'SOS-WHITE',
      quote: 'points towards the hole from one side at an angle of around 45 degrees, and is placed around 20cm away from the box',
      surface: 'port.rear',
      c: s.port,
      n: v3(-1, 0, 0),
      side: v3(0, 0, 1),
      d: [200, 340],
      a: [35, 55],
      aimTol: 25,
      startD: 240,
      startA: 45,
      variants: ['rear'],
      micTypeIds: BOTH,
      tendency: 'More of the box’s low end from the port; offset, so the air from the port passes by. Check the bass is not excessive.',
      checks: ['Air pops on the strongest bass strokes', 'Too much low end', 'The exit path and the cable'],
    }),
    targetZone({
      id: 'caj.clamp.rear',
      label: 'At the port, on a padded port clamp (rear port)',
      band: 'At the port’s mouth on a clamp made for cajón ports, a little off its axis — never a loose mic inside the box.',
      kind: 'sourced',
      src: 'S-DUVEL',
      quote: 'right inside the sound hole',
      surface: 'port.rear',
      c: s.port,
      n: v3(-1, 0, 0),
      side: v3(0, 0, 1),
      d: [25, 70],
      a: [20, 50],
      aimTol: 40,
      startD: 45,
      startA: 35,
      variants: ['rear'],
      micTypeIds: ['portClip'],
      mount: 'clip',
      bandProv: ill('the mouth of the port, off its axis: the lab draws no inside (a drawing default)'),
      tendency: 'A strong, bass-heavy view of the port — and its air. It can cut some boom in one example and pop in another.',
      checks: ['Air pops on the strongest bass strokes', 'The clamp suits this port; the player agrees', 'Nothing touches the snare wires'],
    }),
  ];
}

function frontPortZones(): DocumentedZone[] {
  const s = STATES.frontport;
  return [
    targetZone({
      id: 'caj.front.frontport',
      label: 'In front, angled down at the plate (front port)',
      band: 'About 30–40 cm from the middle of the set-back plate, in front and a little higher, angled down at it — out of the hands’ reach.',
      kind: 'sourced',
      src: 'SOS-WHITE',
      quote: 'just below the top edge of the box, angled downwards so that it aims at the centre of the playing surface',
      surface: 'plate.frontport',
      c: s.plate,
      n: v3(1, 0, 0),
      side: v3(0, -1, 0),
      d: [300, 400],
      a: [18, 40],
      aimTol: 25,
      startD: 340,
      startA: 28,
      variants: ['frontport'],
      micTypeIds: BOTH,
      clear: { line: 'clear.frontport', min: 100 },
      tendency: 'Hand attack and slaps, with the box’s body; the port below now adds to what it hears.',
      checks: ['Does the bass read?', 'The port’s air below the mic', 'Both hands’ arcs'],
    }),
    targetZone({
      id: 'caj.port.frontport',
      label: 'In front of the upward port, offset (front port)',
      band: 'About 20–35 cm from the upward-facing port, in front of it and offset — not straight down its axis — clear of the hands and shins.',
      kind: 'trial',
      src: 'LESSON-CAJON',
      quote: 'Aim or offset the microphone to avoid a blast of air and excessive low-frequency concentration',
      surface: 'port.frontport',
      c: s.port,
      n: v3(0, -1, 0),
      side: v3(1, 0, 0),
      d: [200, 350],
      a: [40, 70],
      aimTol: 30,
      startD: 270,
      startA: 55,
      variants: ['frontport'],
      micTypeIds: BOTH,
      clear: { line: 'clear.frontport', min: 60 },
      tendency: 'More of the port’s low end — the port is in front now, so this mic faces the audience side of the box.',
      checks: ['Air from the port on bass strokes', 'Too much low end', 'The shins and feet'],
    }),
  ];
}

/* ── SUGGESTED STARTING POINTS (lesson L11-L12, L32-L33; corrections CJ-xx). ── */
export const CAJ_ZONES: DocumentedZone[] = [...rearZones(), ...frontPortZones()];
