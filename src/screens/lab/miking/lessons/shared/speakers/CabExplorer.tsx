/**
 * CabExplorer — the speaker cabinet as an ORIENT display (no mic): the
 * cabinet from the FRONT (with the grille cloth, or with it taken away in the
 * drawing to find the speaker behind it), cut open from the SIDE or from
 * ABOVE, or ONE speaker face-on (the anatomy close-up). Tap a part to name
 * it; the page names it in the well. Static: it changes only when the
 * learner taps or switches (D8).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { CabFront, CabSection, SpeakerFace, type FrontMode } from './SpeakerArt';
import { cabDraw, frontDrivers, speakerSection, type Back } from './cabGeometry.ts';
import { cabFrontHit, cabHitTest, cabLabels, faceBox, frontBox } from './cabLabels.ts';
import { CONE_SPOTS, type CabKind } from './speakerModel.ts';

export type CabExplorerView = 'front' | 'side' | 'top' | 'face';
const AMBER = '#ffc64d';

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

export function CabExplorer({ w, h, kind, back, view, frontMode = 'cloth', highlight, spot, onTapPart, accessibilityLabel }: { w: number; h: number; kind: CabKind; back: Back; view: CabExplorerView; frontMode?: FrontMode; highlight?: string | null; spot?: 'centre' | 'boundary' | 'edge' | null; onTapPart?: (id: string) => void; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = view === 'front' ? frontBox(kind) : view === 'face' ? faceBox() : sectionBox(kind, view);
  const xf = useMemo(() => fitXform(view === 'side' ? 'side' : 'top', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels: StaticLabel[] = view === 'face' ? faceLabels() : (cabLabels(kind, back, view).filter((l) => l.id !== 'axis' && l.id !== 'floor') as StaticLabel[]);
  const hi = useMemo(() => highlightPath(kind, back, view, highlight ?? null), [kind, back, view, highlight]);
  const tap = (x: number, y: number) => {
    if (!onTapPart) return;
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const tol = 22 / xf.s;
    const id = view === 'face' ? faceHit(u, v, tol) : view === 'front' ? cabFrontHit(kind, u, v, tol) : cabHitTest(kind, back, view, u, v, tol);
    if (id) onTapPart(id);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {view === 'front' ? <CabFront kind={kind} mode={frontMode} spot={spot ?? null} /> : view === 'face' ? <SpeakerFace spot={spot ?? null} /> : <CabSection kind={kind} back={back} view={view} showAxis={false} />}
            {hi ? <Path path={hi} style="stroke" strokeWidth={3.5 / xf.s} color={AMBER} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}

/** An amber outline round a tapped part, from the same geometry. */
function highlightPath(kind: CabKind, back: Back, view: CabExplorerView, id: string | null) {
  if (!id) return null;
  const c = cabDraw(kind, back);
  const p = Skia.Path.Make();
  if (view === 'face') {
    const s = speakerSection(12);
    const r = id === 'spk.dust' ? s.rDust : id === 'spk.cone' ? s.rSurroundIn : id === 'spk.surround' ? s.rCut : id === 'spk.frame' ? s.rFrame : 0;
    if (!r) return null;
    p.addCircle(0, 0, r + 4);
    return p;
  }
  if (view === 'front') {
    const act = frontDrivers(c).find((d) => d.active)!;
    if (id === 'spk.cabinet') p.addRRect(Skia.RRectXY(Skia.XYWHRect(c.box.z0 - 8, c.box.y0 - 8, c.box.z1 - c.box.z0 + 16, c.box.y1 - c.box.y0 + 16), 14, 14));
    else if (id === 'spk.grille') p.addRRect(Skia.RRectXY(Skia.XYWHRect(c.box.z0 + 22, c.box.y0 + 22, c.box.z1 - c.box.z0 - 44, c.box.y1 - c.box.y0 - 44), 8, 8));
    else if (id === 'spk.horn' && c.horn) p.addRect(Skia.XYWHRect(c.horn.z - c.horn.w / 2 - 8, c.horn.y - c.horn.h / 2 - 8, c.horn.w + 16, c.horn.h + 16));
    else {
      const r = id === 'spk.dust' ? act.rDust : id === 'spk.cone' ? act.rSurroundIn : id === 'spk.surround' ? act.rCut : id === 'spk.frame' ? act.rFrame : 0;
      if (!r) return null;
      p.addCircle(act.u, act.v, r + 5);
    }
    return p;
  }
  const s = speakerSection(c.drivers[0].nominal);
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  const R = (x0: number, y0: number, x1: number, y1: number) => p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1) - 6, Math.min(y0, y1) - 6, Math.abs(x1 - x0) + 12, Math.abs(y1 - y0) + 12), 6, 6));
  switch (id) {
    case 'spk.cabinet':
      R(c.box.x0, v0, c.grilleX, v1);
      break;
    case 'spk.grille':
      R(c.grilleX - 4, v0 + c.panel, c.grilleX + 2, v1 - c.panel);
      break;
    case 'spk.baffle':
      R(-c.panel, v0 + c.panel, 0, v1 - c.panel);
      break;
    case 'spk.back':
    case 'spk.openBack':
      R(c.box.x0, v0, c.box.x0 + c.panel, v1);
      break;
    case 'spk.magnet':
      R(s.xMagnetBack, -s.rMagnet, s.xMagnetFront, s.rMagnet);
      break;
    case 'spk.frame':
      R(s.xFlange - 6, -s.rFrame, s.xFlange, s.rFrame);
      break;
    case 'spk.surround':
      R(s.xFlange - 12, -s.rCut, s.xFlange, -s.rSurroundIn);
      R(s.xFlange - 12, s.rSurroundIn, s.xFlange, s.rCut);
      break;
    case 'spk.dust':
      p.addCircle(s.dustX(0) - 8, 0, s.rDust + 6);
      break;
    case 'spk.cone':
      for (const sgn of [-1, 1]) {
        p.moveTo(s.coneX(s.rCoil), sgn * s.rCoil);
        for (let i = 1; i <= 16; i++) {
          const r = s.rCoil + ((s.rSurroundIn - s.rCoil) * i) / 16;
          p.lineTo(s.coneX(r) + 6, sgn * r);
        }
      }
      break;
    default:
      return null;
  }
  return p;
}

/** The three lateral spots, in words (centre → dust-cap edge → edge). */
export const SPOT_WORDS: Record<'centre' | 'boundary' | 'edge', { title: string; text: string; r: number }> = {
  centre: { title: 'THE CENTRE', text: 'Over the middle of the dust cap. Most often the brightest, most present spot on the speaker — check it on this one.', r: CONE_SPOTS.centre },
  boundary: { title: 'THE DUST-CAP EDGE', text: 'Where the dust cap meets the cone: a common first aiming point, between bright and mellow.', r: CONE_SPOTS.boundary },
  edge: { title: 'TOWARD THE EDGE', text: 'Over the outer part of the cone, inside the surround. Most often mellower and warmer than the centre.', r: CONE_SPOTS.edge },
};
