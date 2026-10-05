/**
 * Speaker-cabinet GEOMETRY (charter §2 layer 2): the shapes every cabinet
 * drawing, hit test and label reads, built from speakerModel.ts. Pure; tested.
 * Frame C (speakerModel.ts): origin at the active speaker's centre on the
 * baffle's front plane, +x toward the mic, +y down, +z to the listener's right.
 *
 * A 12-in speaker is mounted BEHIND the baffle (its flange against the
 * baffle's back face — the usual arrangement, a drawing default) and faces
 * out through a cut-out the size of its cone opening.
 */
import { CABINETS, GRILLE_X, PANEL, SPEAKER_12 as S, cabLayout, speakerScale, type CabKind, type CabLayout } from './speakerModel.ts';

export type Back = 'closed' | 'open';
const P = PANEL.mm;

/** A speaker's section profile (local: x = 0 at the baffle FRONT, x < 0 into
 *  the cabinet; r = distance from the axis), scaled for its nominal size. */
export type SpeakerSection = {
  k: number;
  /** The flange's front face (against the baffle's back face). */
  xFlange: number;
  rFrame: number;
  rCut: number;
  rCone: number;
  rSurroundIn: number;
  rDust: number;
  rCoil: number;
  rMagnet: number;
  /** Cone apex (the voice coil's top), magnet front and back faces. */
  xApex: number;
  xMagnetFront: number;
  xMagnetBack: number;
  /** The cone's surface x at radius r (a gently curved cone, drawing default). */
  coneX: (r: number) => number;
  /** The dust cap's dome surface x at radius r ≤ rDust. */
  dustX: (r: number) => number;
};

export function speakerSection(nominal: number): SpeakerSection {
  const k = speakerScale(nominal);
  const xFlange = -P;
  const rCone = S.rCone.mm * k;
  const rSurroundIn = S.rSurroundIn.mm * k;
  const rDust = S.rDust.mm * k;
  const rCoil = (S.voiceCoilD.mm / 2) * k;
  const xApex = xFlange - S.coneDepth.mm * k;
  // The cone surface: from the surround's inner edge (just behind the flange)
  // to the apex, slightly curved (a "curvilinear" cone; drawing default).
  const xEdge = xFlange - 5 * k;
  const coneX = (r: number) => {
    const t = Math.max(0, Math.min(1, (r - rCoil) / (rSurroundIn - rCoil)));
    // t = 0 at the coil, 1 at the surround; a slight bow toward the front.
    return xApex + (xEdge - xApex) * (t + 0.18 * t * (1 - t));
  };
  const xDustBase = coneX(rDust);
  const dome = S.domeH.mm * k;
  const dustX = (r: number) => xDustBase + dome * Math.sqrt(Math.max(0, 1 - (r / rDust) ** 2));
  return {
    k,
    xFlange,
    rFrame: (S.dFrame.mm / 2) * k,
    rCut: rCone,
    rCone,
    rSurroundIn,
    rDust,
    rCoil,
    rMagnet: (S.magnetD.mm / 2) * k,
    xApex,
    xMagnetFront: xFlange - S.chassisDepth.mm * k,
    xMagnetBack: xFlange - S.overallDepth.mm * k,
    coneX,
    dustX,
  };
}

/** A cabinet's drawing layout: the model's layout plus the back type. */
export type CabDraw = CabLayout & { back: Back; panel: number; grilleX: number };

export function cabDraw(kind: CabKind, back: Back): CabDraw {
  const l = cabLayout(kind);
  const ok = CABINETS[kind].backs.includes(back);
  return { ...l, back: ok ? back : 'closed', panel: P, grilleX: GRILLE_X.mm };
}

/** Drivers whose cut-out the SECTION passes through: the side view is cut at
 *  z = 0, the top view at y = 0. Each with the half-chord of its cut-out
 *  (and of its frame) in that plane. */
export function cutDrivers(c: CabDraw, view: 'side' | 'top'): { v: number; off: number; nominal: number; active: boolean; sec: SpeakerSection; chord: number }[] {
  const out: { v: number; off: number; nominal: number; active: boolean; sec: SpeakerSection; chord: number }[] = [];
  for (const d of c.drivers) {
    const sec = speakerSection(d.nominal);
    const off = view === 'side' ? d.z : d.y;
    if (Math.abs(off) >= sec.rCut) continue;
    out.push({ v: view === 'side' ? d.y : d.z, off, nominal: d.nominal, active: d.active, sec, chord: Math.sqrt(sec.rCut * sec.rCut - off * off) });
  }
  return out;
}

/** The angled top of a 4×12: the front sets back by this much at height y
 *  (0 below the bend at the baffle's centre line). */
export function angledSetback(c: CabDraw, y: number): number {
  const deg = c.spec.angledTop?.mm ?? 0;
  if (!deg || y >= c.centre.y) return 0;
  return Math.tan((deg * Math.PI) / 180) * (c.centre.y - y);
}

/** The driver centres seen from the front (u = z, v = y), for the FRONT
 *  elevation, with each driver's frame radius. */
export function frontDrivers(c: CabDraw): { u: number; v: number; rFrame: number; rCut: number; rDust: number; rSurroundIn: number; active: boolean; nominal: number }[] {
  return c.drivers.map((d) => {
    const sec = speakerSection(d.nominal);
    return { u: d.z, v: d.y, rFrame: sec.rFrame, rCut: sec.rCut, rDust: sec.rDust, rSurroundIn: sec.rSurroundIn, active: d.active, nominal: d.nominal };
  });
}

/** The smallest gap between any two driver FRAMES on a baffle (mm), and the
 *  smallest margin from a frame to the cabinet's outer edge — the invariant
 *  test's "drivers fit with room to spare". */
export function driverClearances(kind: CabKind): { between: number; toEdge: number } {
  const c = cabDraw(kind, 'closed');
  const fd = frontDrivers(c);
  let between = Infinity;
  for (let i = 0; i < fd.length; i++)
    for (let j = i + 1; j < fd.length; j++) between = Math.min(between, Math.hypot(fd[i].u - fd[j].u, fd[i].v - fd[j].v) - fd[i].rFrame - fd[j].rFrame);
  let toEdge = Infinity;
  for (const d of fd) toEdge = Math.min(toEdge, d.u - d.rFrame - c.box.z0, c.box.z1 - d.u - d.rFrame, d.v - d.rFrame - c.box.y0, c.box.y1 - d.v - d.rFrame);
  return { between, toEdge };
}
