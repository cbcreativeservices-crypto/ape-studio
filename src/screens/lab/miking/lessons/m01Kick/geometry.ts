/**
 * M01 KICK DRUM — where things are (charter §2 layer 2). Anchors and solids
 * are BUILT from model.ts dims; the art (art.tsx) and the labels read only
 * these anchors, so the drawing, the hit areas and the readouts agree at
 * every zoom. Anchor ids follow kick/GEOMETRY_PROPOSAL.md §3.
 */
import type { InstrumentModel, Part, Provenance, Vec3 } from '../../engine/model/types.ts';
import { KICK_DIMS as D, L, PILLOW_TOP, R, R_IN, STRIKE_Y } from './model.ts';

const DEG = Math.PI / 180;
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const from = (prov: Provenance): Provenance => prov;

/* ── ANCHORS (mm, instrument frame) ── */
const hoopIn = R + D.cHoop.mm;
const hoopOut = hoopIn + D.tHoop.mm;
const portR = D.portD.mm / 2;
const beaterLen = D.beaterLen.mm;
const headR = D.beaterHeadR.mm;
/** The beater head CENTRE at the strike: its face touches the batter head at
 *  the strike point (0, STRIKE_Y, 0). */
const strikeAngle = -60 * DEG; // the shaft's angle at the strike, from +x toward +y (illustrative)
const beaterAtStrike: Vec3 = { x: -headR, y: STRIKE_Y, z: 0 };
const axle: Vec3 = { x: beaterAtStrike.x - beaterLen * Math.cos(strikeAngle), y: beaterAtStrike.y - beaterLen * Math.sin(strikeAngle), z: 0 };
const restAngle = strikeAngle - D.beaterSwingDeg.mm * DEG;

export const KICK_ANCHORS = {
  'bd.batter.center': { x: 0, y: 0, z: 0 },
  'bd.reso.center': { x: L, y: 0, z: 0 },
  'bd.port.center': { x: L, y: D.portY.mm, z: D.portZ.mm },
  'pedal.beater.strike': { x: 0, y: STRIKE_Y, z: 0 },
  'pedal.beater.headAtStrike': beaterAtStrike,
  'pedal.beater.headAtRest': { x: axle.x + beaterLen * Math.cos(restAngle), y: axle.y + beaterLen * Math.sin(restAngle), z: 0 },
  'pedal.axle': axle,
  'bd.shell.innerBottom': { x: L / 2, y: R_IN, z: 0 },
  'damping.pillow.top': { x: D.pillowLen.mm / 2, y: PILLOW_TOP, z: 0 },
} as const satisfies Record<string, Vec3>;

export const KICK_GEOM = {
  R,
  L,
  rIn: R_IN,
  tShell: D.tShell.mm,
  hoopIn,
  hoopOut,
  hoopX: { batter: [-(D.hHoop.mm - D.hoopInset.mm), D.hoopInset.mm] as const, reso: [L - D.hoopInset.mm, L + D.hHoop.mm - D.hoopInset.mm] as const },
  portR,
  strikeY: STRIKE_Y,
  beater: { axle, headR, len: beaterLen, strikeAngle, restAngle },
  pillow: { x0: 1, x1: D.pillowLen.mm, top: PILLOW_TOP, bottom: R_IN, halfW: D.pillowHalfW.mm },
  yFloor: D.yFloor.mm,
  /** Tension rods per head at φ0 + k·36° (φ measured from +y (bottom) toward +z). */
  rodAngles: Array.from({ length: D.nRods.mm }, (_, k) => D.rodPhaseDeg.mm + (k * 360) / D.nRods.mm),
  spurs: [-1, 1].map((side) => ({
    side,
    top: { x: D.spurX.mm, y: R * 0.35, z: side * (R + 4) },
    foot: { x: D.spurX.mm - 70, y: D.yFloor.mm, z: side * (R + 130) },
  })),
  pedal: { x0: axle.x - 230, x1: axle.x + 40, top: D.yFloor.mm - 55 },
};

/* ── PARTS (ids stable: progress and taps key on them) ── */
const shellProv = from(D.R.prov);
const parts: Part[] = [
  { id: 'kick.batter', label: 'batter head', short: 'batter', role: 'The head the beater strikes, on the player’s side. Its attack starts here.', moving: true, clearance: D.headClear, prov: shellProv, solid: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: R, x0: -0.5, x1: 0.5 } },
  { id: 'kick.reso', label: 'resonant head (intact)', short: 'front head', role: 'The front head, facing the audience. With no port, outside pickup is the normal option.', moving: true, clearance: D.headClear, prov: shellProv, variants: ['intact'], solid: { kind: 'slab', c: { x: L, y: 0, z: 0 }, r: R, x0: L - 0.5, x1: L + 0.5 } },
  { id: 'kick.resoPorted', label: 'resonant head (ported)', short: 'front head', role: 'The front head, facing the audience. An existing port lets an internal mic in — never cut one to match a diagram.', moving: true, clearance: D.headClear, prov: shellProv, variants: ['ported'], solid: { kind: 'slab', c: { x: L, y: 0, z: 0 }, r: R, x0: L - 0.5, x1: L + 0.5, hole: { c: KICK_ANCHORS['bd.port.center'], r: portR } } },
  { id: 'kick.port', label: 'port (5 in, offset; position illustrative)', short: 'port', role: 'An opening in the front head. Air leaves here too: port air can make a pop or wind-like burst.', prov: D.portD.prov, variants: ['ported'] },
  { id: 'kick.shell', label: 'shell', short: 'shell', role: 'The wooden cylinder between the heads. With the air inside, it shapes the drum’s resonance.', prov: D.tShell.prov, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: R_IN, rOut: R, x0: 0, x1: L } },
  { id: 'kick.hoopBatter', label: 'batter hoop', short: 'hoop', role: 'The wood hoop holding the batter head; the pedal clamps to it.', prov: D.tHoop.prov, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: hoopIn, rOut: hoopOut, x0: -(D.hHoop.mm - D.hoopInset.mm), x1: D.hoopInset.mm } },
  { id: 'kick.hoopReso', label: 'front hoop', short: 'hoop', role: 'The wood hoop holding the front head.', prov: D.tHoop.prov, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: hoopIn, rOut: hoopOut, x0: L - D.hoopInset.mm, x1: L + D.hHoop.mm - D.hoopInset.mm } },
  { id: 'kick.pillow', label: 'damping pillow (size illustrative)', short: 'pillow', role: 'Damping on the bottom of the drum, against the beater head. Mics stay off it — except a boundary mic made to rest on it.', clearance: D.dampClear, prov: { kind: 'sourced', src: 'S-B52-UG', quote: 'place a pillow or blanket on bottom of the drum against the beater head' }, solid: { kind: 'box', min: { x: 1, y: PILLOW_TOP, z: -D.pillowHalfW.mm }, max: { x: D.pillowLen.mm, y: R_IN, z: D.pillowHalfW.mm } } },
  ...KICK_GEOM.spurs.map<Part>((s) => ({ id: s.side < 0 ? 'kick.spurL' : 'kick.spurR', label: s.side < 0 ? 'left spur (illustrative)' : 'right spur (illustrative)', short: 'spur', role: 'A leg on each side of the shell that keeps the drum from creeping.', prov: { kind: 'sourced', src: 'YMH-HUB', quote: 'attached to each side of the shell' }, solid: { kind: 'capsule', a: s.top, b: s.foot, r: 8 } })),
  { id: 'kick.beater', label: 'beater (illustrative)', short: 'beater', role: 'Driven by the pedal; it strikes the batter head at the centre or 1–2 in above it.', moving: true, prov: D.strikeY.prov },
  { id: 'kick.pedal', label: 'pedal (illustrative)', short: 'pedal', role: 'The player’s foot drives the beater. Cables and stands keep clear of its action.', prov: ill('no source gives pedal dimensions'), solid: { kind: 'box', min: { x: KICK_GEOM.pedal.x0, y: KICK_GEOM.pedal.top, z: -45 }, max: { x: KICK_GEOM.pedal.x1, y: D.yFloor.mm, z: 45 } } },
];

export const KICK_MODEL: InstrumentModel = {
  id: 'kick22x18',
  name: '22 × 18 in bass (kick) drum',
  parts,
  regions: [
    { id: 'r.strike', partId: 'kick.batter', label: 'beater strike', anchor: KICK_ANCHORS['pedal.beater.strike'], prov: D.strikeY.prov, note: 'The beater strikes the batter head: beater articulation (the attack) starts here.' },
    { id: 'r.reso', partId: 'kick.reso', label: 'resonant head', anchor: KICK_ANCHORS['bd.reso.center'], prov: D.L.prov, note: 'The front head is where much of the drum’s resonance radiates; it rings together with the batter head, the air inside and the shell.' },
    { id: 'r.port', partId: 'kick.port', label: 'port', anchor: KICK_ANCHORS['bd.port.center'], prov: D.portY.prov, variants: ['ported'], note: 'Sound and moving air leave through the port — port air can pop a mic.' },
    { id: 'r.shell', partId: 'kick.shell', label: 'shell', anchor: { x: L / 2, y: -R, z: 0 }, prov: D.tShell.prov, note: 'The shell, the heads’ tuning and any damping shape how long the drum rings.' },
  ],
  surfaces: [
    { id: 'batter', partId: 'kick.batter', label: 'the batter head', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
    { id: 'reso', partId: 'kick.reso', label: 'the front head', point: { x: L, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, minus: { words: 'inside the drum from', key: 'INSIDE FROM' } },
  ],
  lines: [
    { id: 'beater', label: 'the beater line', point: KICK_ANCHORS['pedal.beater.strike'], dir: { x: 1, y: 0, z: 0 } },
    { id: 'axis', label: 'the drum’s axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } },
  ],
  envelopes: [
    {
      id: 'env.beater',
      label: 'beater travel (illustrative)',
      shape: { kind: 'sweep', pivot: axle, r0: beaterLen - 40, r1: beaterLen + headR, a0: restAngle, a1: strikeAngle, halfW: 35 },
      prov: ill('the pedal’s pivot, shaft length and swing are unknown; drawn so the head just reaches the batter head'),
    },
    {
      id: 'env.player',
      label: 'the player’s foot and leg (illustrative)',
      shape: { kind: 'box', min: { x: -720, y: -260, z: -230 }, max: { x: KICK_GEOM.pedal.x0 + 60, y: D.yFloor.mm, z: 230 } },
      prov: ill('no source gives the player’s reach'),
    },
  ],
  variants: [
    { id: 'ported', label: 'PORTED', blurb: 'An existing 5 in offset port (Remo’s size; its position is unknown and drawn illustratively). An internal mic can go in through it.' },
    { id: 'intact', label: 'INTACT', blurb: 'No port. Mic it from outside — or use an internal mic that is appropriately installed. Never cut a hole to match a diagram.' },
  ],
  defaultVariant: 'ported',
  views: {
    side: { u0: -400, u1: 900, v0: -330, v1: D.yFloor.mm + 22 },
    top: { u0: -400, u1: 900, v0: -440, v1: 440 },
  },
  yFloor: D.yFloor,
  interior: { x0: 0, x1: L, rIn: R_IN, c: { x: 0, y: 0, z: 0 } },
  ports: { ported: { c: KICK_ANCHORS['bd.port.center'], r: portR }, intact: null },
};

/**
 * The PORT as the drawing shows it in each view: an OPENING in the front-head
 * film at x = L, spanning the port's extent along the view's vertical axis
 * (side: y; top: z). The port lies off both cut planes (side cut z = 0, top
 * cut y = 0), so it is drawn PROJECTED onto the head line — a gap in the head,
 * where the boom passes through — never as a disc beyond the head plane
 * (geometry fix 2026-10-04). Pure; the art and the tests read the same span.
 */
export function portOpening(view: 'side' | 'top'): { x: number; lo: number; hi: number } {
  const c = KICK_ANCHORS['bd.port.center'];
  const v = view === 'side' ? c.y : c.z;
  return { x: c.x, lo: v - KICK_GEOM.portR, hi: v + KICK_GEOM.portR };
}

/**
 * Rods whose silhouette the cut leaves visible: side view = the far half
 * (z ≤ 0) at the top/bottom silhouette; top view = the lower half (y ≥ 0) at
 * the left/right silhouette. φ is measured from +y toward +z (geometry.ts).
 */
export function silhouetteRods(view: 'side' | 'top'): { phi: number; sgn: 1 | -1 }[] {
  const out: { phi: number; sgn: 1 | -1 }[] = [];
  for (const phi of KICK_GEOM.rodAngles) {
    const a = phi * DEG;
    const across = view === 'side' ? Math.cos(a) : Math.sin(a); // the projected axis
    const depth = view === 'side' ? Math.sin(a) : -Math.cos(a); // > 0: removed with the near half
    if (depth > 0.02 || Math.abs(across) < 0.94) continue;
    out.push({ phi, sgn: across < 0 ? -1 : 1 });
  }
  return out;
}
