/**
 * CabExplorer — the speaker cabinet as an ORIENT display (no mic): the
 * cabinet from the FRONT (with the grille cloth, or with it taken away in the
 * drawing to find the speaker behind it), cut open from the SIDE or from
 * ABOVE, or ONE speaker face-on (the anatomy close-up). Tap a part to name
 * it; the page names it in the well. Static: it changes only when the
 * learner taps or switches (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, FillType, Group, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../../../../../theme/tokens';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CabFront, CabSection, SpeakerFace, type FrontMode } from './SpeakerArt';
import { bassHead, comboParts } from './ampModel.ts';
import { cabDraw, frontDrivers, speakerSection, type Back, type CabDraw } from './cabGeometry.ts';
import { cabFrontHit, cabHitTest, cabLabels, faceBox, frontBox } from './cabLabels.ts';
import { CONE_SPOTS, type CabKind } from './speakerModel.ts';

export type CabExplorerView = 'front' | 'side' | 'top' | 'face';

function sectionBox(kind: CabKind, view: 'side' | 'top') {
  const c = cabDraw(kind, 'closed');
  return view === 'side' ? { u0: c.box.x0 - 70, u1: 220, v0: c.box.y0 - 60, v1: c.floorY + 26 } : { u0: c.box.x0 - 70, u1: 220, v0: c.box.z0 - 60, v1: c.box.z1 + 40 };
}

/** The face close-up's hit test (local centre 0, 0). */
function faceHit(u: number, v: number, tol: number): string | null {
  const s = speakerSection(12);
  const r = Math.hypot(u, v);
  if (r <= s.rDust + tol * 0.4) return 'spk.dust';
  if (r <= s.rSurroundIn) return 'spk.cone';
  if (r <= s.rCut + 2) return 'spk.surround';
  if (r <= s.rFrame + tol) return 'spk.frame';
  return null;
}

function faceLabels(): StaticLabel[] {
  const s = speakerSection(12);
  return [
    { id: 'dust', text: 'DUST CAP', u: 0, v: 4, align: 'center', tone: 'amber' },
    { id: 'cone', text: 'CONE', u: s.rSurroundIn * 0.62, v: s.rSurroundIn * 0.55, align: 'center' },
    { id: 'sur', text: 'SURROUND', u: s.rFrame + 16, v: -s.rCut * 0.55, align: 'left', tone: 'muted' },
    { id: 'frame', text: 'FRAME · 4 BOLT HOLES', short: 'FRAME', u: s.rFrame + 16, v: s.rCut * 0.7, align: 'left', tone: 'muted' },
  ];
}

/** A lesson's own additions to the drawing (Lab 4's amplified chain, added
 *  2026-10-05): drawn inside the same transform, a taller box, tapped first. */
export type CabExtras = {
  /** Extra room above the cabinet (mm) — e.g. a head resting on it. */
  above?: number;
  render?: (view: CabExplorerView) => ReactElement | null;
  hit?: (view: CabExplorerView, u: number, v: number, tol: number) => string | null;
  labels?: (view: CabExplorerView) => StaticLabel[];
};

export function CabExplorer({ w, h, kind, back, view, frontMode = 'cloth', highlight, spot, onTapPart, accessibilityLabel, extras }: { w: number; h: number; kind: CabKind; back: Back; view: CabExplorerView; frontMode?: FrontMode; highlight?: string | null; spot?: 'centre' | 'boundary' | 'edge' | null; onTapPart?: (id: string) => void; accessibilityLabel: string; extras?: CabExtras }) {
  const ts = useStageTextScale();
  const box0 = view === 'front' ? frontBox(kind) : view === 'face' ? faceBox() : sectionBox(kind, view);
  const box = extras?.above && (view === 'front' || view === 'side') ? { ...box0, v0: box0.v0 - extras.above } : box0;
  const xf = useMemo(() => fitXform(view === 'side' ? 'side' : 'top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const mark = useMemo(() => cabPartMark(kind, back, view, highlight ?? null, frontMode, xf.s), [kind, back, view, highlight, frontMode, xf.s]);
  const hi = useMemo(() => (mark ? markPath(mark) : null), [mark]);
  // The words naming a part this view does not draw come first: they keep their place.
  const labels: StaticLabel[] = [...(mark?.note ? [{ id: 'partMark', ...mark.note }] : []), ...(view === 'face' ? faceLabels() : (cabLabels(kind, back, view).filter((l) => l.id !== 'axis' && l.id !== 'floor') as StaticLabel[])), ...(extras?.labels?.(view) ?? [])];
  const tap = (x: number, y: number) => {
    if (!onTapPart) return;
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const tol = 22 / xf.s;
    const id = extras?.hit?.(view, u, v, tol) ?? (view === 'face' ? faceHit(u, v, tol) : view === 'front' ? cabFrontHit(kind, u, v, tol) : cabHitTest(kind, back, view, u, v, tol));
    if (id) onTapPart(id);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {view === 'front' ? <CabFront kind={kind} mode={frontMode} spot={spot ?? null} /> : view === 'face' ? <SpeakerFace spot={spot ?? null} /> : <CabSection kind={kind} back={back} view={view} showAxis={false} />}
            {extras?.render?.(view) ?? null}
            {hi ? (
              <>
                <Path path={hi} color={PART_MARK} opacity={0.3} />
                <Path path={hi} style="stroke" strokeWidth={3.5 / xf.s} color={PART_MARK}>
                  {mark?.hidden ? <DashPathEffect intervals={[11 / xf.s, 7 / xf.s]} /> : null}
                </Path>
              </>
            ) : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}

/* ── the chosen part's mark ── pure, from the same geometry the art draws.
 * Every part the page lists gets a mark in every view (owner 2026-11-05: a
 * control passes only if the learner can SEE what it promises at 375 wide). The
 * amber ring always marks the miked speaker, so the chosen part is GREEN and
 * filled. A part this view does not draw is marked where it really sits, DASHED,
 * and named in words on the glass. Sizes are the shared scene's: at least
 * MARK_MIN_PX long and MARK_THIN_PX wide (PlacementScene). */
export const PART_MARK = colors.greenBright;
export const CAB_MARK_MIN_PX = 44;
export const CAB_MARK_THIN_PX = 16;
export type CabMarkShape = { kind: 'disc'; u: number; v: number; r: number } | { kind: 'box'; u0: number; v0: number; u1: number; v1: number; rx: number } | { kind: 'poly'; pts: readonly (readonly [number, number])[] };
/** `shapes` fill even-odd, so a second shape inside the first is a hole. */
export type CabMark = { shapes: CabMarkShape[]; hidden: boolean; note?: { text: string; short: string; u: number; v: number; align: 'left' | 'center' | 'right' } };

const disc = (u: number, v: number, r: number): CabMarkShape => ({ kind: 'disc', u, v, r });
const rect = (u0: number, v0: number, u1: number, v1: number, rx = 6): CabMarkShape & { kind: 'box' } => ({ kind: 'box', u0: Math.min(u0, u1), v0: Math.min(v0, v1), u1: Math.max(u0, u1), v1: Math.max(v0, v1), rx });
/** A box the learner can find: never under the minimum, whatever the drawing's scale. */
function sized(b: CabMarkShape & { kind: 'box' }, s: number): CabMarkShape {
  const w = b.u1 - b.u0;
  const h = b.v1 - b.v0;
  const thin = CAB_MARK_THIN_PX / s;
  const long = CAB_MARK_MIN_PX / s;
  const W = w >= h ? Math.max(w, long) : Math.max(w, thin);
  const H = w >= h ? Math.max(h, thin) : Math.max(h, long);
  const cu = (b.u0 + b.u1) / 2;
  const cv = (b.v0 + b.v1) / 2;
  return rect(cu - W / 2, cv - H / 2, cu + W / 2, cv + H / 2, b.rx);
}
const bandEnd = (sh: CabMarkShape) => (sh.kind === 'box' ? sh.u1 : 0);
const solidDisc = (u: number, v: number, r: number, s: number) => disc(u, v, Math.max(r, CAB_MARK_MIN_PX / 2 / s));
/** A band round a centre, wide enough to see beside the amber ring. */
function band(u: number, v: number, rIn: number, rOut: number, s: number): CabMarkShape[] {
  const R = Math.max(rOut, CAB_MARK_MIN_PX / 2 / s);
  return [disc(u, v, R), disc(u, v, Math.min(rIn, R - CAB_MARK_THIN_PX / 2 / s))];
}

const backWords = (c: CabDraw) => (c.back === 'open' ? 'OPEN BACK' : 'CLOSED BACK');

function faceMark(c: CabDraw, id: string, s: number): CabMark | null {
  const sec = speakerSection(12);
  const b = faceBox();
  const edge = (inset: number) => rect(b.u0 + inset, b.v0 + inset, b.u1 - inset, b.v1 - inset, 10);
  const say = (text: string, short: string) => ({ text, short, u: 0, v: b.v0 + 54, align: 'center' as const });
  const deep = Math.max(24, CAB_MARK_THIN_PX / s);
  const atTop = rect(b.u0 + 6, b.v0 + 6, b.u1 - 6, b.v0 + 6 + deep, 8);
  switch (id) {
    case 'spk.dust':
      return { shapes: [solidDisc(0, 0, sec.rDust, s)], hidden: false };
    case 'spk.cone':
      return { shapes: band(0, 0, sec.rDust, sec.rSurroundIn, s), hidden: false };
    case 'spk.surround':
      return { shapes: band(0, 0, sec.rSurroundIn, sec.rCut, s), hidden: false };
    case 'spk.frame':
      return { shapes: band(0, 0, sec.rCut, sec.rFrame, s), hidden: false };
    case 'spk.magnet':
      return { shapes: [disc(0, 0, Math.max(sec.rMagnet + 5, (CAB_MARK_MIN_PX / 2 + CAB_MARK_THIN_PX / 2) / s))], hidden: true, note: say('MAGNET · BEHIND THE CONE', 'BEHIND THE CONE') };
    case 'spk.grille':
      return { shapes: [edge(6)], hidden: true, note: say('GRILLE CLOTH · IN FRONT OF THIS SPEAKER', 'CLOTH IN FRONT') };
    case 'spk.baffle':
      return { shapes: [edge(6), disc(0, 0, sec.rCut)], hidden: true, note: say('BAFFLE · THE BOARD ROUND THE SPEAKER', 'BAFFLE AROUND') };
    case 'spk.cabinet':
      return { shapes: [edge(6), edge(36)], hidden: true, note: say('CABINET · ROUND THIS SPEAKER', 'CABINET AROUND') };
    case 'spk.back':
    case 'spk.openBack':
      return { shapes: [edge(6), edge(20)], hidden: true, note: say(`${backWords(c)} · BEHIND THIS SPEAKER`, 'BEHIND THIS SPEAKER') };
    case 'spk.horn': {
      if (!c.horn) return null;
      // On the glass's edge, on the side the horn lies from the miked speaker.
      const up = Math.abs(c.horn.y) >= Math.abs(c.horn.z);
      const shape = up ? (c.horn.y < 0 ? atTop : rect(b.u0 + 6, b.v1 - 6 - deep, b.u1 - 6, b.v1 - 6, 8)) : c.horn.z < 0 ? rect(b.u0 + 6, b.v0 + 6, b.u0 + 6 + deep, b.v1 - 6, 8) : rect(b.u1 - 6 - deep, b.v0 + 6, b.u1 - 6, b.v1 - 6, 8);
      return { shapes: [shape], hidden: true, note: say(`HORN · ${up ? (c.horn.y < 0 ? 'ABOVE' : 'BELOW') : c.horn.z < 0 ? 'LEFT OF' : 'RIGHT OF'} THIS SPEAKER`, 'HORN THAT WAY') };
    }
    case 'amp.panel':
      return { shapes: [atTop], hidden: true, note: say('CONTROL PANEL · ABOVE THIS SPEAKER', 'CONTROLS ABOVE') };
    case 'amp.chassis':
      return { shapes: [atTop], hidden: true, note: say('CHASSIS · ABOVE THIS SPEAKER', 'CHASSIS ABOVE') };
    case 'amp.head':
      return { shapes: [atTop], hidden: true, note: say('HEAD · ON TOP OF THE CABINET', 'HEAD ON TOP') };
    default:
      return null;
  }
}

function frontMark(kind: CabKind, c: CabDraw, id: string, mode: FrontMode, s: number): CabMark | null {
  const b = c.box;
  const fd = frontDrivers(c);
  const act = fd.find((d) => d.active)!;
  const say = (text: string, short: string) => ({ text, short, u: (b.z0 + b.z1) / 2, v: b.y1 + 48, align: 'center' as const });
  // The cloth and the board stop under a combo's control panel.
  const top = kind === 'combo12' ? comboParts().panel.y1 + 8 : b.y0 + 22;
  const inner = rect(b.z0 + 22, top, b.z1 - 22, b.y1 - 22, 8);
  switch (id) {
    case 'spk.cabinet':
      return { shapes: [rect(b.z0 - 8, b.y0 - 8, b.z1 + 8, b.y1 + 8, 14), rect(b.z0 + 22, b.y0 + 22, b.z1 - 22, b.y1 - 22, 8)], hidden: false };
    case 'spk.grille':
      return { shapes: [inner], hidden: mode === 'baffle' };
    case 'spk.baffle':
      return { shapes: [inner, ...fd.map((d) => disc(d.u, d.v, d.rCut))], hidden: false };
    case 'spk.cone':
      return { shapes: band(act.u, act.v, act.rDust, act.rSurroundIn, s), hidden: false };
    case 'spk.dust':
      return { shapes: [solidDisc(act.u, act.v, act.rDust, s)], hidden: false };
    case 'spk.surround':
      return { shapes: band(act.u, act.v, act.rSurroundIn, act.rCut, s), hidden: false };
    case 'spk.frame':
      return { shapes: band(act.u, act.v, act.rCut, act.rFrame, s), hidden: false };
    case 'spk.magnet':
      return { shapes: [disc(act.u, act.v, Math.max(speakerSection(act.nominal).rMagnet + 5, (CAB_MARK_MIN_PX / 2 + CAB_MARK_THIN_PX / 2) / s))], hidden: true, note: say('MAGNET · BEHIND THE CONE', 'BEHIND THE CONE') };
    case 'spk.back':
    case 'spk.openBack':
      return { shapes: [rect(b.z0 - 13, b.y0 - 13, b.z1 + 13, b.y1 + 13, 14), rect(b.z0 - 3, b.y0 - 3, b.z1 + 3, b.y1 + 3, 10)], hidden: true, note: say(`${backWords(c)} · BEHIND THE CABINET`, 'BEHIND THE CABINET') };
    case 'spk.horn':
      return c.horn ? { shapes: [sized(rect(c.horn.z - c.horn.w / 2 - 8, c.horn.y - c.horn.h / 2 - 8, c.horn.z + c.horn.w / 2 + 8, c.horn.y + c.horn.h / 2 + 8), s)], hidden: false } : null;
    case 'amp.panel': {
      if (kind !== 'combo12') return null;
      const { panel } = comboParts();
      return { shapes: [rect(b.z0 + 4, b.y0 + 2, b.z1 - 4, panel.y1 + 2, 10)], hidden: false };
    }
    case 'amp.chassis': {
      if (kind !== 'combo12') return null;
      const { chassis } = comboParts();
      return { shapes: [rect(chassis.z0, chassis.y0, chassis.z1, chassis.y1)], hidden: true, note: say('CHASSIS · BEHIND THE CONTROL PANEL', 'BEHIND THE PANEL') };
    }
    case 'amp.head': {
      if (kind !== 'bass410') return null;
      const h = bassHead();
      return { shapes: [rect(h.z0 - 8, h.y0 - 8, h.z1 + 14, h.y1 + 4, 10)], hidden: false };
    }
    default:
      return null;
  }
}

function sectionMark(kind: CabKind, c: CabDraw, view: 'side' | 'top', id: string, s: number): CabMark | null {
  const sec = speakerSection(c.drivers[0].nominal);
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  const P = c.panel;
  const R = (x0: number, y0: number, x1: number, y1: number) => sized(rect(x0 - 6, Math.min(y0, y1) - 6, x1 + 6, Math.max(y0, y1) + 6), s);
  const shown = (...shapes: CabMarkShape[]): CabMark => ({ shapes, hidden: false });
  // Above the cut in the view from above: named over the drawing.
  const above = (text: string, short: string) => ({ text, short, u: (c.box.x0 + c.grilleX) / 2, v: v0 - 30, align: 'center' as const });
  switch (id) {
    case 'spk.cabinet':
      return shown(rect(c.box.x0 - 6, v0 - 6, c.grilleX + 6, v1 + 6), rect(c.box.x0 + P, v0 + P, -P, v1 - P));
    case 'spk.grille':
      return shown(R(c.grilleX - 4, v0 + P, c.grilleX + 2, v1 - P));
    case 'spk.baffle':
      return shown(R(-P, v0 + P, 0, v1 - P));
    case 'spk.back':
    case 'spk.openBack':
      return shown(R(c.box.x0, v0, c.box.x0 + P, v1));
    case 'spk.magnet':
      return shown(R(sec.xMagnetBack, -sec.rMagnet, sec.xMagnetFront, sec.rMagnet));
    case 'spk.frame':
      // The basket: from the flange, either side of the cut, back to the magnet.
      return shown(...[-1, 1].map((sgn): CabMarkShape => ({ kind: 'poly', pts: [[sec.xFlange + 4, sgn * sec.rFrame], [sec.xFlange + 4, sgn * (sec.rCut - 6)], [sec.xMagnetFront - 4, sgn * (sec.rMagnet - 8)], [sec.xMagnetFront - 4, sgn * (sec.rMagnet + 12)]] })));
    case 'spk.surround':
      return shown(R(sec.xFlange - 12, -sec.rCut, sec.xFlange, -sec.rSurroundIn), R(sec.xFlange - 12, sec.rSurroundIn, sec.xFlange, sec.rCut));
    case 'spk.dust':
      return shown(solidDisc(sec.dustX(0) - 8, 0, sec.rDust + 6, s));
    case 'spk.cone':
      return shown(
        ...[-1, 1].map((sgn): CabMarkShape => {
          const half = Math.max(8, CAB_MARK_THIN_PX / 2 / s);
          const at = (i: number) => sec.rDust + ((sec.rSurroundIn - sec.rDust) * i) / 16;
          const idx = Array.from({ length: 17 }, (_, i) => i);
          return { kind: 'poly', pts: [...idx.map((i) => [sec.coneX(at(i)) + half, sgn * at(i)] as const), ...idx.reverse().map((i) => [sec.coneX(at(i)) - half, sgn * at(i)] as const)] };
        }),
      );
    case 'spk.horn': {
      if (!c.horn) return null;
      const mid = view === 'side' ? c.horn.y : c.horn.z;
      const half = (view === 'side' ? c.horn.h : c.horn.w) / 2;
      const shape = R(-P, mid - half, c.grilleX + 2, mid + half);
      return { shapes: [shape], hidden: true, note: { text: 'HORN · NOT IN THIS CUT', short: 'HORN', u: bandEnd(shape) + 8 / s, v: mid, align: 'left' } };
    }
    case 'amp.panel': {
      if (kind !== 'combo12') return null;
      const { panel } = comboParts();
      return view === 'side' ? shown(rect(c.grilleX - 14, c.box.y0 - 6, c.grilleX + 30, panel.y1 + 6, 8)) : { shapes: [R(panel.x0, panel.z0, panel.x1, panel.z1)], hidden: true, note: above('CONTROL PANEL · ABOVE THIS CUT', 'ABOVE THIS CUT') };
    }
    case 'amp.chassis': {
      if (kind !== 'combo12') return null;
      const { chassis } = comboParts();
      return view === 'side' ? shown(rect(chassis.x0 - 8, chassis.y0 - 6, chassis.x1 + 8, chassis.y1 + 78, 8)) : { shapes: [rect(chassis.x0, chassis.z0, chassis.x1, chassis.z1)], hidden: true, note: above('CHASSIS · ABOVE THIS CUT', 'ABOVE THIS CUT') };
    }
    case 'amp.head': {
      if (kind !== 'bass410') return null;
      const h = bassHead();
      return view === 'side' ? shown(rect(h.x0 - 8, h.y0 - 8, h.x1 + 14, h.y1 + 4, 10)) : { shapes: [rect(h.x0, h.z0, h.x1, h.z1)], hidden: true, note: above('HEAD · ON TOP OF THE CABINET', 'ABOVE THIS CUT') };
    }
    default:
      return null;
  }
}

/** The chosen part's mark in this view; `s` is the drawing's px per mm. */
export function cabPartMark(kind: CabKind, back: Back, view: CabExplorerView, id: string | null, frontMode: FrontMode = 'cloth', s = 0.5): CabMark | null {
  if (!id) return null;
  const c = cabDraw(kind, back);
  return view === 'face' ? faceMark(c, id, s) : view === 'front' ? frontMark(kind, c, id, frontMode, s) : sectionMark(kind, c, view, id, s);
}

function markPath(m: CabMark) {
  const p = Skia.Path.Make();
  p.setFillType(FillType.EvenOdd);
  for (const sh of m.shapes) {
    if (sh.kind === 'disc') p.addCircle(sh.u, sh.v, sh.r);
    else if (sh.kind === 'box') p.addRRect(Skia.RRectXY(Skia.XYWHRect(sh.u0, sh.v0, sh.u1 - sh.u0, sh.v1 - sh.v0), sh.rx, sh.rx));
    else {
      sh.pts.forEach(([u, v], i) => (i ? p.lineTo(u, v) : p.moveTo(u, v)));
      p.close();
    }
  }
  return p;
}

/** The three lateral spots, in words (centre → dust-cap edge → edge). */
export const SPOT_WORDS: Record<'centre' | 'boundary' | 'edge', { title: string; text: string; r: number }> = {
  centre: { title: 'THE CENTER', text: 'Over the middle of the dust cap. Most often the brightest, most present spot on the speaker — check it on this one.', r: CONE_SPOTS.centre },
  boundary: { title: 'THE DUST-CAP EDGE', text: 'Where the dust cap meets the cone: a common first aiming point, between bright and mellow.', r: CONE_SPOTS.boundary },
  edge: { title: 'TOWARD THE EDGE', text: 'Over the outer part of the cone, inside the surround. Most often mellower and warmer than the center.', r: CONE_SPOTS.edge },
};
