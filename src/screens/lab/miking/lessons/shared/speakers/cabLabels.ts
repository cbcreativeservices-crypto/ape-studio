/**
 * Speaker-cabinet LABELS and TAPS, from the same geometry the art draws
 * (cabGeometry.ts) — pure, tested. Views: 'side' / 'top' are the sections
 * (u = x; v = y or z), 'front' is the cabinet seen from the mic (u = z, v = y).
 * Part ids are the module's (`spk.*`), stable: taps and progress key on them.
 */
import { CABINETS, SPEAKER_12, type CabKind } from './speakerModel.ts';
import { cabDraw, cutDrivers, frontDrivers, speakerSection, type Back } from './cabGeometry.ts';

export type CabView = 'side' | 'top' | 'front';
export type CabLabel = { id: string; text: string; short?: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative'; at?: { u: number; v: number } };

export function cabLabels(kind: CabKind, back: Back, view: CabView): CabLabel[] {
  const c = cabDraw(kind, back);
  if (view === 'front') {
    const act = frontDrivers(c).find((d) => d.active)!;
    const out: CabLabel[] = [
      { id: 'active', text: 'MIKED SPEAKER', short: 'MIKED', u: act.u, v: act.v + act.rCut + 46, align: 'center' },
      { id: 'grille', text: 'GRILLE CLOTH', short: 'GRILLE', u: c.box.z0 + 30, v: c.box.y0 - 30, align: 'left' },
    ];
    if (c.horn) out.push({ id: 'horn', text: 'HORN', u: c.horn.z, v: c.horn.y - c.horn.h / 2 - 24, align: 'center', tone: 'illustrative' });
    return out;
  }
  const s = speakerSection(c.drivers[0].nominal);
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  // Labels sit clear of the zones (in front of the grille, |v| ≤ the cone's
  // radius) and of the mic's lobe tag (above the drawing): the grille's below
  // the cone in front of the cloth, the back's beside the back panel.
  const out: CabLabel[] = [
    { id: 'grille', text: 'GRILLE CLOTH', short: 'GRILLE', u: c.grilleX + 14, v: Math.min(v1 - 40, s.rCut + 48), align: 'left' },
    // Behind the cabinet, a leader to the magnet: a label inside the box sits on the cabinet's air.
    { id: 'speaker', text: 'SPEAKER', u: c.box.x0 - 14, v: (v0 + v1) / 2 - 60, align: 'right', tone: 'muted', at: { u: s.xMagnetBack, v: 0 } },
    { id: 'back', text: back === 'open' ? 'OPEN BACK' : 'CLOSED BACK', short: back === 'open' ? 'OPEN' : 'BACK', u: c.box.x0 - 14, v: (v0 + v1) / 2 + 60, align: 'right', tone: 'muted' },
    { id: 'axis', text: 'CONE AXIS', u: 820, v: -26, align: 'right', tone: 'illustrative' },
  ];
  if (view === 'side') out.push({ id: 'floor', text: 'FLOOR', u: 980, v: c.floorY - 22, align: 'right', tone: 'illustrative' });
  return out;
}

/** The part under (u, v) in a SECTION view; `tol` in mm. */
export function cabHitTest(kind: CabKind, back: Back, view: 'side' | 'top', u: number, v: number, tol: number): string | null {
  const c = cabDraw(kind, back);
  const P = c.panel;
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  const inSpan = v >= v0 - tol && v <= v1 + tol;
  if (!inSpan) return null;
  if (Math.abs(u - c.grilleX) <= tol + 4) return 'spk.grille';
  for (const d of cutDrivers(c, view)) {
    const s = d.sec;
    const r = Math.abs(v - d.v);
    if (r <= s.rMagnet + tol && u >= s.xMagnetBack - tol && u <= s.xMagnetFront + tol) return 'spk.magnet';
    if (r <= s.rDust + tol && u >= s.dustX(Math.min(r, s.rDust)) - 18 - tol && u <= s.dustX(Math.min(r, s.rDust)) + tol) return d.active ? 'spk.dust' : 'spk.cone';
    if (r > s.rDust && r <= s.rSurroundIn && Math.abs(u - s.coneX(r)) <= 14 + tol) return 'spk.cone';
    if (r > s.rSurroundIn && r <= s.rCut + 2 && u >= s.xFlange - 14 - tol && u <= s.xFlange + tol) return 'spk.surround';
    if (r > s.rCut && r <= s.rFrame + tol && u >= s.xFlange - 8 - tol && u <= s.xFlange + tol) return 'spk.frame';
  }
  if (u >= -P - tol && u <= tol) return 'spk.baffle';
  if (u >= c.box.x0 - tol && u <= c.box.x0 + P + tol) return back === 'open' ? 'spk.openBack' : 'spk.back';
  if (u >= c.box.x0 && u <= c.grilleX) return 'spk.cabinet';
  return null;
}

/** The part under (u, v) in the FRONT view (u = z, v = y). */
export function cabFrontHit(kind: CabKind, u: number, v: number, tol: number): string | null {
  const c = cabDraw(kind, 'closed');
  if (c.horn && Math.abs(u - c.horn.z) <= c.horn.w / 2 + tol && Math.abs(v - c.horn.y) <= c.horn.h / 2 + tol) return 'spk.horn';
  for (const d of frontDrivers(c)) {
    const r = Math.hypot(u - d.u, v - d.v);
    if (r <= d.rDust + tol * 0.5) return d.active ? 'spk.dust' : 'spk.cone';
    if (r <= d.rSurroundIn) return 'spk.cone';
    if (r <= d.rCut) return 'spk.surround';
    if (r <= d.rFrame + tol * 0.5) return 'spk.frame';
  }
  if (u >= c.box.z0 && u <= c.box.z1 && v >= c.box.y0 && v <= c.box.y1) {
    const inset = 26;
    return u > c.box.z0 + inset && u < c.box.z1 - inset && v > c.box.y0 + inset && v < c.box.y1 - inset ? 'spk.grille' : 'spk.cabinet';
  }
  return null;
}

/** The front view's box (u = z, v = y) with room for the labels. */
export function frontBox(kind: CabKind): { u0: number; u1: number; v0: number; v1: number } {
  const c = cabDraw(kind, 'closed');
  return { u0: c.box.z0 - 60, u1: c.box.z1 + 60, v0: c.box.y0 - 60, v1: c.box.y1 + 80 };
}

/** One face-on speaker's box (the anatomy close-up), local centre at 0, 0. */
export function faceBox(): { u0: number; u1: number; v0: number; v1: number } {
  const r = SPEAKER_12.dFrame.mm / 2 + 70;
  return { u0: -r - 40, u1: r + 40, v0: -r, v1: r };
}

export const CAB_KINDS = Object.keys(CABINETS) as CabKind[];
