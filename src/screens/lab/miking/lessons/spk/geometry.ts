/**
 * SPEAKER CABINET & LESLIE MODULE — where things are (charter §2 layer 2).
 * One InstrumentModel PER CABINET (each with its own view boxes, so a small
 * 1×12 is not drawn tiny inside a 4×12's box), all in frame C: origin at the
 * active speaker's centre on the baffle's front plane, +x toward the mic,
 * +y down, +z to the listener's right. The zones are shared (they are
 * measured from the grille and the active speaker's axis); the open-back
 * zone is the 1×12's alone.
 *
 * Each zone carries its own DRAWING (`draw`): both views are sections
 * through the cone axis, so a radial band about that axis is exact there —
 * two strips (or one, when it starts at the axis) at the zone's distances.
 */
import type { DocumentedZone, InstrumentModel, Part, Provenance, ViewBox } from '../../engine/model/types.ts';
import { CABINETS, GRILLE_X, SPEAKER_12, type CabKind } from '../shared/speakers/speakerModel.ts';
import { cabDraw, speakerSection, type Back } from '../shared/speakers/cabGeometry.ts';
import { SPK_FRONT_ZONES, rearZone } from './model.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const G = GRILLE_X.mm;

/** The zone's drawn bands in both sections (u = x; v = the radial offset). */
function withDrawing(z: DocumentedZone, xBack: number): DocumentedZone {
  const sign = z.refSurface === 'back' ? -1 : 1;
  const ref = z.refSurface === 'back' ? xBack : G; // the reference plane's x
  const a = ref + sign * z.distance.min;
  const b = ref + sign * z.distance.max;
  const u0 = Math.min(a, b);
  const u1 = Math.max(a, b);
  const r0 = z.radial?.min ?? 0;
  const r1 = z.radial?.max ?? SPEAKER_12.rCone.mm;
  const strip = (v0: number, v1: number) => ({ poly: [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] as const });
  const polys = r0 <= 0 ? [strip(-r1, r1)] : [strip(-r1, -r0), strip(r0, r1)];
  return { ...z, draw: { side: polys, top: polys } };
}

export type SpkCab = { kind: CabKind; model: InstrumentModel; zones: DocumentedZone[] };

function partsFor(kind: CabKind): Part[] {
  const c = cabDraw(kind, 'closed');
  const s = speakerSection(c.drivers[0].nominal);
  const spec = CABINETS[kind];
  const boxSolid = { kind: 'box' as const, min: { x: c.box.x0, y: c.box.y0, z: c.box.z0 }, max: { x: c.box.x1, y: c.box.y1, z: c.box.z1 } };
  const parts: Part[] = [
    { id: 'spk.cabinet', label: 'cabinet', short: 'cabinet', role: 'The wooden box. It holds the speaker and shapes how much of the back of the cone is heard.', solid: boxSolid, clearance: { mm: 5, prov: ill('keep the mic off the cabinet and its cloth: 5 mm is the lab’s margin (no source gives one)') }, prov: spec.w.prov },
    { id: 'spk.grille', label: 'grille cloth', short: 'grille', role: 'Woven cloth stretched in front of the baffle. It protects the speaker and hides it — mark where the speaker is before you place a mic, and never press a mic against the cloth.', prov: GRILLE_X.prov },
    { id: 'spk.baffle', label: 'baffle', short: 'baffle', role: 'The front board the speakers are mounted to, each one behind a round cut-out.', prov: ill('panel thickness is a drawing default') },
    { id: 'spk.cone', label: 'cone', short: 'cone', role: 'The paper cone. The voice coil drives it back and forth, and it pushes the air: this is what the mic hears.', prov: SPEAKER_12.dCut.prov },
    { id: 'spk.dust', label: 'dust cap', short: 'dust cap', role: 'The dome in the middle of the cone, over the voice coil. Its edge is a common first aiming point.', prov: SPEAKER_12.rDust.prov },
    { id: 'spk.surround', label: 'surround', short: 'surround', role: 'The flexible edge that joins the cone to the frame and lets it move.', prov: SPEAKER_12.rSurroundIn.prov },
    { id: 'spk.frame', label: 'frame (basket)', short: 'frame', role: 'The metal basket that holds the cone, the surround and the magnet; its flange is bolted to the baffle.', prov: SPEAKER_12.dFrame.prov },
    { id: 'spk.magnet', label: 'magnet and voice coil', short: 'magnet', role: 'The magnet behind the cone, and the voice coil in its gap: the signal in the coil pushes against the magnet’s field and moves the cone.', prov: SPEAKER_12.magnetD.prov },
    { id: 'spk.back', label: 'closed back', short: 'back', role: 'A closed back panel: the sound from the back of the cone stays inside the box.', variants: ['closed'], prov: spec.backProv },
    { id: 'spk.openBack', label: 'open back', short: 'open back', role: 'An open back: the back of the cone also sounds out behind the cabinet — opposite in polarity to the front.', variants: ['open'], prov: spec.backProv },
  ];
  if (c.horn) parts.push({ id: 'spk.horn', label: 'horn (high frequencies)', short: 'horn', role: 'A small horn for the highest frequencies. A mic on one cone may not hear it — listen for what the horn adds.', prov: c.spec.horn!.prov });
  void s;
  return parts;
}

function modelFor(kind: CabKind): InstrumentModel {
  const c = cabDraw(kind, 'closed');
  const spec = CABINETS[kind];
  const backs = spec.backs;
  // An open back needs room behind the cabinet for the rear mic and its stand.
  const behind = backs.includes('open') ? 600 : 230;
  const side: ViewBox = { u0: c.box.x0 - behind, u1: 1000, v0: c.box.y0 - 70, v1: c.floorY + 30 };
  const top: ViewBox = { u0: c.box.x0 - behind, u1: 1000, v0: c.box.z0 - 70, v1: c.box.z1 + 70 };
  return {
    id: `cab-${kind}`,
    name: spec.label,
    parts: partsFor(kind),
    regions: [
      { id: 'r.cone', partId: 'spk.cone', label: 'front of the cone', anchor: { x: speakerSection(c.drivers[0].nominal).dustX(0), y: 0, z: 0 }, prov: SPEAKER_12.dCut.prov, note: 'The front of the cone pushes the air toward you: the sound the front mic hears.' },
      { id: 'r.back', partId: 'spk.openBack', label: 'back of the cone', anchor: { x: speakerSection(c.drivers[0].nominal).xApex, y: 0, z: 0 }, prov: ill('the back of the cone, drawn as one point at the cone’s apex (a simplified source)'), variants: ['open'], note: 'The back of the cone moves the air the opposite way: the same sound, opposite in polarity.' },
    ],
    surfaces: [
      { id: 'grille', partId: 'spk.grille', label: 'the grille', point: { x: G, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
      { id: 'back', partId: 'spk.openBack', label: 'the open back', point: { x: c.box.x0, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
    ],
    lines: [{ id: 'axis', label: 'the cone axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }],
    envelopes: [],
    variants: backs.map((b) => ({ id: b, label: b === 'open' ? 'OPEN BACK' : 'CLOSED BACK', blurb: b === 'open' ? 'The back is open: the back of the cone sounds out behind the cabinet too.' : 'The back is closed: the back of the cone sounds into the box.' })),
    defaultVariant: 'closed',
    views: { side, top },
    aimAzLimit: 180,
    yFloor: { mm: c.floorY, prov: { kind: 'unknown', needed: 'the cabinet’s height above the floor (drawn standing on the floor: is it raised or tilted back?)' }, placeholder: true },
    interior: { x0: c.box.x0, x1: 0, rIn: SPEAKER_12.rCone.mm, c: { x: 0, y: 0, z: 0 } },
    ports: Object.fromEntries(backs.map((b) => [b, null])) as Record<string, null>,
  };
}

function zonesFor(kind: CabKind): DocumentedZone[] {
  const c = cabDraw(kind, 'closed');
  const front = SPK_FRONT_ZONES.map((z) => withDrawing(z, c.box.x0));
  return CABINETS[kind].backs.includes('open') ? [...front, withDrawing(rearZone(c.box.x0), c.box.x0)] : front;
}

export const SPK_CABS: Record<CabKind, SpkCab> = {
  '1x12': { kind: '1x12', model: modelFor('1x12'), zones: zonesFor('1x12') },
  '4x12': { kind: '4x12', model: modelFor('4x12'), zones: zonesFor('4x12') },
  bass410: { kind: 'bass410', model: modelFor('bass410'), zones: zonesFor('bass410') },
};

export const CAB_ORDER: readonly CabKind[] = ['1x12', '4x12', 'bass410'];
export type { Back };
