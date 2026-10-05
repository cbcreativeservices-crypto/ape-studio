/**
 * THE AMPLIFIED CHAIN — the speaker family extended for Lab 4's electric
 * string lessons (C02 electric guitar, C08 electric bass, C04 pedal and lap
 * steel; 2026-10-05). Pure TypeScript; tested (test/mikingLab4Amps.test.ts).
 *
 * What it adds beside speakerModel.ts / cabGeometry.ts (which it reuses
 * unchanged):
 *   • the COMBO's own parts: the control panel band across the top of the
 *     front, the chassis hanging inside the top, and the clearance the
 *     maker asks for behind the unit (sourced);
 *   • a bass HEAD on top of the bass cabinet (a drawing default);
 *   • `ampModel()`: one InstrumentModel per (cabinet, lesson) in frame C, with
 *     the speaker family's parts plus these, the vent keep-out behind an open
 *     combo, and room in the view boxes for a mic behind it;
 *   • `withBands()`: each zone's drawing (both views are sections through the
 *     cone axis, so a radial band about that axis is exact there).
 *
 * Sources: docs/labs/miking/electric_guitar_amp/ and electric_bass_amp/
 * (SOURCES.md, GEOMETRY_PROPOSAL.md). Every UNKNOWN the drawing needs is a
 * flagged PLACEHOLDER ("a drawing default, not a published figure").
 */
import type { Dim, DocumentedZone, Envelope, InstrumentModel, Part, Provenance, ViewBox } from '../../../engine/model/types.ts';
import { CABINETS, GRILLE_X, IN, PANEL, SPEAKER_12, type CabKind } from './speakerModel.ts';
import { cabDraw, speakerSection, type Back } from './cabGeometry.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const placeholder = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

/* ── the combo's own parts (frame C: origin at the speaker's centre on the baffle) ── */
export const COMBO = {
  /** The control panel: a band across the top of the front. */
  panelH: placeholder(90, 'the control panel band across the top of the combo’s front: drawing default 90'),
  /** The chassis (the amplifier itself) hanging inside the top of the box. */
  chassisH: placeholder(80, 'the chassis height inside the top of the combo: drawing default 80'),
  /** The valves hang below the chassis toward the open back. */
  tubeL: placeholder(70, 'how far the valves hang below the chassis: drawing default 70'),
  /** "Maintain at least 6 inches (15.25 cm) of unobstructed air space behind the unit." */
  ventBehind: { mm: 6 * IN, prov: src('FEN-65DR-MAN', 'Maintain at least 6 inches (15.25 cm) of unobstructed air space behind the unit') } as Dim,
  /** The speaker the maker fits (drawn with the 12 in reference's sizes). */
  speakerProv: src('FEN-65DR-MAN', 'SPEAKER COMPLEMENT: 12-inch, 8Ω'),
  /** "A speaker must always be connected at this jack when the amplifier is ON." */
  loadRule: src('FEN-65DR-MAN', 'A speaker must always be connected at this jack when the amplifier is ON. A speaker impedance load of 8Ω should be used'),
} as const;

/** A bass HEAD resting on top of the bass cabinet (W × H × D, mm). */
export const BASS_HEAD = {
  w: placeholder(330, 'the bass head’s width: drawing default 330'),
  h: placeholder(75, 'the bass head’s height: drawing default 75'),
  d: placeholder(250, 'the bass head’s depth: drawing default 250'),
} as const;

/** The combo's control panel band and chassis in frame C. */
export function comboParts(back: Back = 'open') {
  const c = cabDraw('combo12', back);
  const P = c.panel;
  const panel = { x0: c.grilleX - 30, x1: c.grilleX, y0: c.box.y0, y1: c.box.y0 + COMBO.panelH.mm, z0: c.box.z0, z1: c.box.z1 };
  const chassis = { x0: c.box.x0 + 40, x1: -P - 6, y0: c.box.y0 + P, y1: c.box.y0 + P + COMBO.chassisH.mm, z0: c.box.z0 + P + 20, z1: c.box.z1 - P - 20 };
  // Five valves in a row across the chassis, hanging toward the back (drawing default).
  const tubes = [0, 1, 2, 3, 4].map((i) => ({ x: c.box.x0 + 70, z: chassis.z0 + 80 + (i * (chassis.z1 - chassis.z0 - 160)) / 4, y0: chassis.y1, y1: chassis.y1 + COMBO.tubeL.mm, r: 14 }));
  return { c, panel, chassis, tubes };
}

/** The bass head on the bass cabinet, in frame C (flush with the cabinet's front). */
export function bassHead() {
  const c = cabDraw('bass410', 'closed');
  const zc = (c.box.z0 + c.box.z1) / 2;
  return { x0: c.grilleX - 12 - BASS_HEAD.d.mm, x1: c.grilleX - 12, y0: c.box.y0 - BASS_HEAD.h.mm, y1: c.box.y0, z0: zc - BASS_HEAD.w.mm / 2, z1: zc + BASS_HEAD.w.mm / 2 };
}

/* ── the model ── */
export type AmpRig = 'combo' | 'bass';
const cabOf = (rig: AmpRig): CabKind => (rig === 'combo' ? 'combo12' : 'bass410');

function parts(rig: AmpRig): Part[] {
  const kind = cabOf(rig);
  const c = cabDraw(kind, rig === 'combo' ? 'open' : 'closed');
  const spec = CABINETS[kind];
  const boxSolid = { kind: 'box' as const, min: { x: c.box.x0, y: c.box.y0, z: c.box.z0 }, max: { x: c.box.x1, y: c.box.y1, z: c.box.z1 } };
  const out: Part[] = [
    { id: 'spk.cabinet', label: rig === 'combo' ? 'combo cabinet' : 'cabinet', short: 'cabinet', role: rig === 'combo' ? 'The wooden box that holds the amplifier at the top and the speaker below it.' : 'The wooden box that holds the four speakers and the horn.', solid: boxSolid, clearance: { mm: 5, prov: ill('keep the mic off the cabinet and its cloth: 5 mm is the lab’s margin (no source gives one)') }, prov: spec.w.prov },
    { id: 'spk.grille', label: 'grille cloth', short: 'grille', role: 'Woven cloth in front of the speaker. It hides the speaker — find the speaker before you place a mic, and never press a mic against the cloth.', prov: GRILLE_X.prov },
    { id: 'spk.baffle', label: 'baffle', short: 'baffle', role: 'The front board the speaker is mounted to, behind a round cut-out.', prov: PANEL.prov },
    { id: 'spk.cone', label: 'cone', short: 'cone', role: 'The paper cone. The voice coil drives it back and forth, and it pushes the air: this is what the mic hears.', prov: SPEAKER_12.dCut.prov },
    { id: 'spk.dust', label: 'dust cap', short: 'dust cap', role: 'The dome in the middle of the cone, over the voice coil. Its edge is a common first aiming point.', prov: SPEAKER_12.rDust.prov },
    { id: 'spk.surround', label: 'surround', short: 'surround', role: 'The flexible edge that joins the cone to the frame and lets it move.', prov: SPEAKER_12.rSurroundIn.prov },
    { id: 'spk.frame', label: 'frame (basket)', short: 'frame', role: 'The metal basket that holds the cone and the magnet; its flange is bolted to the baffle.', prov: SPEAKER_12.dFrame.prov },
    { id: 'spk.magnet', label: 'magnet and voice coil', short: 'magnet', role: 'The magnet behind the cone, and the voice coil in its gap: the signal in the coil pushes against the magnet’s field and moves the cone.', prov: SPEAKER_12.magnetD.prov },
  ];
  if (rig === 'combo') {
    out.push(
      { id: 'spk.openBack', label: 'open back', short: 'open back', role: 'The back is open: the back of the cone sounds out behind the amp too — opposite in polarity to the front. The amp needs the air behind it to stay clear.', prov: spec.backProv },
      { id: 'amp.panel', label: 'control panel', short: 'controls', role: 'The player’s knobs and the input jack. These settings are the player’s sound: leave them as they set them.', prov: COMBO.panelH.prov },
      { id: 'amp.chassis', label: 'amplifier chassis', short: 'chassis', role: 'The amplifier itself, hanging inside the top of the box, with its valves (tubes) below it. Hot and live inside: no mic, hand or stand goes in there.', prov: COMBO.chassisH.prov },
    );
  } else {
    out.push(
      { id: 'spk.back', label: 'closed back', short: 'back', role: 'A closed back: the sound from the back of the cones stays in the box.', prov: spec.backProv },
      { id: 'spk.horn', label: 'horn (high frequencies)', short: 'horn', role: 'A small horn for the highest frequencies — string noise, pick and slap detail. A mic on one cone may not hear it.', prov: spec.horn!.prov },
      { id: 'amp.head', label: 'bass head (the amplifier)', short: 'head', role: 'The amplifier, in its own box on top of the cabinet. A speaker cable carries its power to the cabinet; its direct (DI) output is a separate, electrical path.', prov: BASS_HEAD.w.prov },
    );
  }
  return out;
}

/** One InstrumentModel per amp rig, in frame C. */
export function ampModel(rig: AmpRig, id: string, name: string, reach = 1000): InstrumentModel {
  const kind = cabOf(rig);
  const back: Back = rig === 'combo' ? 'open' : 'closed';
  const c = cabDraw(kind, back);
  const s = speakerSection(c.drivers[0].nominal);
  const G = GRILLE_X.mm;
  // Room behind an open combo for the rear mic and its stand (beyond the vent clearance).
  const behind = rig === 'combo' ? 560 : 230;
  const headTop = rig === 'bass' ? bassHead().y0 : c.box.y0;
  const side: ViewBox = { u0: c.box.x0 - behind, u1: reach, v0: headTop - 70, v1: c.floorY + 30 };
  const top: ViewBox = { u0: c.box.x0 - behind, u1: reach, v0: c.box.z0 - 70, v1: c.box.z1 + 70 };
  const envelopes: Envelope[] =
    rig === 'combo'
      ? [{ id: 'ko.vent', label: 'the air space behind the amp', shape: { kind: 'box', min: { x: c.box.x0 - COMBO.ventBehind.mm, y: c.box.y0, z: c.box.z0 }, max: { x: c.box.x0 - 1, y: c.box.y1, z: c.box.z1 } }, prov: COMBO.ventBehind.prov }]
      : [];
  return {
    id,
    name,
    parts: parts(rig),
    regions: [
      { id: 'r.cone', partId: 'spk.cone', label: 'front of the cone', anchor: { x: s.dustX(0), y: 0, z: 0 }, prov: SPEAKER_12.dCut.prov, note: 'The front of the cone pushes the air toward you: the sound the front mic hears.' },
      ...(rig === 'combo' ? [{ id: 'r.back', partId: 'spk.openBack', label: 'back of the cone', anchor: { x: s.xApex, y: 0, z: 0 }, prov: ill('the back of the cone, drawn as one point at the cone’s apex (a simplified source)'), note: 'The back of the cone moves the air the opposite way: the same sound, opposite in polarity.' }] : []),
    ],
    surfaces: [
      { id: 'grille', partId: 'spk.grille', label: 'the grille', point: { x: G, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
      ...(rig === 'combo' ? [{ id: 'back', partId: 'spk.openBack', label: 'the open back', point: { x: c.box.x0, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 } }] : []),
    ],
    lines: [{ id: 'axis', label: 'the cone axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }],
    envelopes,
    variants: [{ id: back, label: back === 'open' ? 'OPEN BACK' : 'CLOSED BACK', blurb: back === 'open' ? 'The back is open: the back of the cone sounds out behind the amp too.' : 'The back is closed: the back of the cones sounds into the box.' }],
    defaultVariant: back,
    views: { side, top },
    viewTags: { side: 'SIDE · CUT THROUGH THE SPEAKER', top: 'TOP · CUT THROUGH THE SPEAKER' },
    aimAzLimit: 180,
    yFloor: { mm: c.floorY, prov: { kind: 'unknown', needed: 'the amp’s height above the floor (drawn standing on the floor: is it raised or tilted back?)' }, placeholder: true },
    interior: { x0: c.box.x0, x1: 0, rIn: SPEAKER_12.rCone.mm * s.k, c: { x: 0, y: 0, z: 0 } },
    ports: { [back]: null },
  };
}

/** Each zone's drawn bands in both sections (u = x; v = the radial offset). */
export function withBands(z: DocumentedZone, xBack: number, rCone: number): DocumentedZone {
  const sign = z.refSurface === 'back' ? -1 : 1;
  const ref = z.refSurface === 'back' ? xBack : GRILLE_X.mm;
  const a = ref + sign * z.distance.min;
  const b = ref + sign * z.distance.max;
  const u0 = Math.min(a, b);
  const u1 = Math.max(a, b);
  const r0 = z.radial?.min ?? 0;
  const r1 = z.radial?.max ?? rCone;
  const strip = (v0: number, v1: number) => ({ poly: [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] as const });
  const polys = r0 <= 0 ? [strip(-r1, r1)] : [strip(-r1, -r0), strip(r0, r1)];
  return { ...z, draw: { side: polys, top: polys } };
}

/** The x of the open back (frame C) for a rig. */
export function backX(rig: AmpRig): number {
  return cabDraw(cabOf(rig), rig === 'combo' ? 'open' : 'closed').box.x0;
}
export { cabOf };
