/**
 * THE AMPLIFIED CHAIN — the look of the combo's control panel and chassis
 * and of the bass head, drawn over the speaker family's own cabinet art
 * (SpeakerArt.tsx, unchanged) from ampModel.ts, and the LessonArt the
 * engine's placement scene draws with for Lab 4's amp lessons.
 *
 *   combo, front   the control panel across the top of the front: a chrome
 *                  plate with the player's knobs and the input jacks
 *   combo, side    the same panel in section, and the chassis hanging inside
 *                  the top of the box with its valves below it (hot and live:
 *                  never a place for a mic, a hand or a stand)
 *   bass head      the amplifier in its own box on top of the cabinet (front
 *                  and side)
 *
 * Generic finishes, no maker's likeness or logo. Static (D8).
 */
import { Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import { CabSection, SPK } from './SpeakerArt';
import { cabHitTest, cabLabels } from './cabLabels.ts';
import { bassHead, cabOf, comboParts, type AmpRig } from './ampModel.ts';
import type { CabExplorerView, CabExtras } from './CabExplorer';
import type { Back } from './cabGeometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}
const AMBER = '#ffc64d';

/* ── the combo ── */
function ComboFront({ hi }: { hi: string | null }) {
  const { c, panel } = comboParts();
  const { z0, z1, y0 } = c.box;
  const plate = rr(z0 + 14, y0 + 12, z1 - 14, panel.y1 - 6, 6);
  const knobs = Array.from({ length: 9 }, (_, i) => z0 + 150 + (i * (z1 - z0 - 230)) / 8);
  return (
    <Group>
      <Path path={rr(z0 + 4, y0 + 4, z1 - 4, panel.y1, 8)} color="#0d0d10" />
      <Path path={plate}>
        <LinearGradient start={vec(z0, y0)} end={vec(z0, panel.y1)} colors={['#f2f4f8', '#b4b9c3', '#6a6f7a']} />
      </Path>
      <Path path={plate} style="stroke" strokeWidth={1.2} color="#08080a" />
      {/* Input jacks at the left, the knobs, a pilot lamp at the right. */}
      {[0, 1].map((i) => (
        <Group key={`j${i}`}>
          <Circle cx={z0 + 55 + i * 40} cy={y0 + 50} r={12} color="#141518" />
          <Circle cx={z0 + 55 + i * 40} cy={y0 + 50} r={5} color="#000" />
        </Group>
      ))}
      {knobs.map((u, i) => (
        <Group key={`k${i}`}>
          <Circle cx={u + 2} cy={y0 + 52} r={13} color="#000" opacity={0.4} />
          <Circle cx={u} cy={y0 + 49} r={13}>
            <RadialGradient c={vec(u - 4, y0 + 44)} r={18} colors={['#4b4e57', '#1b1c20', '#0b0b0d']} />
          </Circle>
          <Path path={(() => { const p = make(); p.moveTo(u, y0 + 49); p.lineTo(u - 6, y0 + 39); return p; })()} style="stroke" strokeWidth={2} color="#e1e4ea" />
        </Group>
      ))}
      <Circle cx={z1 - 45} cy={y0 + 49} r={11}>
        <RadialGradient c={vec(z1 - 48, y0 + 45)} r={14} colors={['#ffd9a0', '#d0602a', '#5a1a08']} />
      </Circle>
      {hi === 'amp.panel' ? <Path path={rr(z0 + 4, y0 + 2, z1 - 4, panel.y1 + 2, 10)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

function ComboSide({ hi }: { hi: string | null }) {
  const { c, panel, chassis, tubes } = comboParts();
  const plate = rr(c.grilleX - 6, c.box.y0 + 2, c.grilleX + 2, panel.y1, 2);
  const knobs = [c.box.y0 + 49];
  const ch = rr(chassis.x0, chassis.y0, chassis.x1, chassis.y1, 4);
  return (
    <Group>
      {/* The chassis (steel) hanging in the top of the box, its valves below. */}
      <Path path={ch}>
        <LinearGradient start={vec(chassis.x0, chassis.y0)} end={vec(chassis.x1, chassis.y1)} colors={['#c8ccd4', '#7c818c', '#3a3d45']} />
      </Path>
      <Path path={ch} style="stroke" strokeWidth={1} color="#08080a" />
      {tubes.slice(0, 1).map((t, i) => (
        <Group key={`t${i}`}>
          {[-26, 0, 26].map((dx) => (
            <Path key={dx} path={rr(t.x - t.r + dx * 2.2, t.y0, t.x + t.r + dx * 2.2, t.y1, t.r)} opacity={0.9}>
              <LinearGradient start={vec(t.x - t.r + dx * 2.2, 0)} end={vec(t.x + t.r + dx * 2.2, 0)} colors={['rgba(230,236,245,0.55)', 'rgba(150,160,175,0.35)', 'rgba(60,64,72,0.6)']} />
            </Path>
          ))}
        </Group>
      ))}
      {/* The control panel at the front of the top, a knob standing proud. */}
      <Path path={plate}>
        <LinearGradient start={vec(0, c.box.y0)} end={vec(0, panel.y1)} colors={['#f2f4f8', '#b4b9c3', '#6a6f7a']} />
      </Path>
      {knobs.map((v) => (
        <Path key={v} path={rr(c.grilleX + 2, v - 13, c.grilleX + 22, v + 13, 5)}>
          <LinearGradient start={vec(0, v - 13)} end={vec(0, v + 13)} colors={['#4b4e57', '#1b1c20', '#0b0b0d']} />
        </Path>
      ))}
      {hi === 'amp.panel' ? <Path path={rr(c.grilleX - 14, c.box.y0 - 6, c.grilleX + 30, panel.y1 + 6, 8)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
      {hi === 'amp.chassis' ? <Path path={rr(chassis.x0 - 8, chassis.y0 - 6, chassis.x1 + 8, chassis.y1 + 78, 8)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── the bass head ── */
function HeadArt({ view, hi }: { view: 'front' | 'side'; hi: string | null }) {
  const h = bassHead();
  const u0 = view === 'front' ? h.z0 : h.x0;
  const u1 = view === 'front' ? h.z1 : h.x1;
  const box = rr(u0, h.y0, u1, h.y1 - 2, 6);
  return (
    <Group>
      <Path path={box}>
        <LinearGradient start={vec(u0, h.y0)} end={vec(u1, h.y1)} colors={[...SPK.tolex]} />
      </Path>
      <Path path={box} style="stroke" strokeWidth={1.4} color="#55585f" opacity={0.8} />
      {view === 'front' ? (
        <>
          <Path path={rr(u0 + 10, h.y0 + 10, u1 - 10, h.y1 - 12, 4)}>
            <LinearGradient start={vec(0, h.y0)} end={vec(0, h.y1)} colors={['#2a2b30', '#16171a', '#0b0b0d']} />
          </Path>
          {Array.from({ length: 7 }, (_, i) => u0 + 60 + (i * (u1 - u0 - 110)) / 6).map((u, i) => (
            <Circle key={i} cx={u} cy={(h.y0 + h.y1) / 2} r={10}>
              <RadialGradient c={vec(u - 3, (h.y0 + h.y1) / 2 - 3)} r={14} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
            </Circle>
          ))}
          <Circle cx={u0 + 28} cy={(h.y0 + h.y1) / 2} r={9} color="#050506" />
        </>
      ) : (
        <Path path={rr(u1 - 6, h.y0 + 8, u1 + 10, h.y1 - 10, 3)} color="#3a3d45" />
      )}
      {hi === 'amp.head' ? <Path path={rr(u0 - 8, h.y0 - 8, u1 + 14, h.y1 + 4, 10)} style="stroke" strokeWidth={5} color={AMBER} /> : null}
    </Group>
  );
}

/* ── the explorer's extras (page 1) ── */
export function ampExtras(rig: AmpRig, highlight: string | null): CabExtras {
  if (rig === 'combo') {
    const { c, panel, chassis } = comboParts();
    return {
      render: (view: CabExplorerView) => (view === 'front' ? <ComboFront hi={highlight} /> : view === 'side' ? <ComboSide hi={highlight} /> : null),
      hit: (view, u, v, tol) => {
        if (view === 'front' && v >= c.box.y0 - tol && v <= panel.y1 && u >= c.box.z0 && u <= c.box.z1) return 'amp.panel';
        if (view === 'side') {
          if (u >= c.grilleX - 20 - tol && u <= c.grilleX + 30 && v >= c.box.y0 && v <= panel.y1) return 'amp.panel';
          if (u >= chassis.x0 && u <= chassis.x1 && v >= chassis.y0 && v <= chassis.y1 + 70) return 'amp.chassis';
        }
        return null;
      },
      labels: (view) =>
        view === 'front'
          ? [{ id: 'panel', text: 'CONTROL PANEL', short: 'CONTROLS', u: (c.box.z0 + c.box.z1) / 2, v: c.box.y0 - 30, align: 'center', tone: 'muted' }]
          : view === 'side'
            ? [{ id: 'chassis', text: 'CHASSIS · VALVES', short: 'CHASSIS', u: chassis.x0 - 10, v: c.box.y0 - 30, align: 'left', tone: 'muted' } as StaticLabel]
            : [],
    };
  }
  const h = bassHead();
  return {
    above: 90,
    render: (view) => (view === 'front' || view === 'side' ? <HeadArt view={view} hi={highlight} /> : null),
    hit: (view, u, v, tol) => {
      if (v < h.y0 - tol || v > h.y1) return null;
      if (view === 'front' && u >= h.z0 && u <= h.z1) return 'amp.head';
      if (view === 'side' && u >= h.x0 && u <= h.x1) return 'amp.head';
      return null;
    },
    labels: (view) => (view === 'front' || view === 'side' ? [{ id: 'head', text: 'HEAD', u: view === 'front' ? h.z1 + 16 : h.x0 - 16, v: (h.y0 + h.y1) / 2, align: view === 'front' ? 'left' : 'right', tone: 'muted' }] : []),
  };
}

/* ── the placement scene's art ── */
const made = new Map<AmpRig, LessonArt>();
const backOf = (rig: AmpRig): Back => (rig === 'combo' ? 'open' : 'closed');

export function ampLessonArt(rig: AmpRig): LessonArt {
  let a = made.get(rig);
  if (a) return a;
  const kind = cabOf(rig);
  const back = backOf(rig);
  const ex = ampExtras(rig, null);
  a = {
    Instrument: ({ view }: { view: ViewId; variant: VariantId }) => (
      <Group>
        <CabSection kind={kind} back={back} view={view} />
        {view === 'side' ? ex.render?.('side') ?? null : null}
      </Group>
    ),
    labels: (view) => [...cabLabels(kind, back, view), ...(view === 'side' ? (ex.labels?.('side') ?? []).map((l) => ({ ...l, tone: 'muted' as const })) : [])],
    hitTest: (view, _variant, u, v, tol) => ex.hit?.(view, u, v, tol) ?? cabHitTest(kind, back, view, u, v, tol),
  };
  made.set(rig, a);
  return a;
}
