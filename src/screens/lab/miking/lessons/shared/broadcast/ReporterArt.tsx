/**
 * THE FIELD REPORTER — the look (Lab 7 group 3; B03). Real objects lit from
 * the upper left, in the engine's two views (side: u = x, v = y; top: u = x,
 * v = z — frame V, mm). Static (D8).
 *
 *   Roadway          the street behind the guest: asphalt, the kerb, a
 *                    dashed lane line — a vehicle path nobody stands in.
 *   LoudSource       a loud public loudspeaker on its pole, turned to face
 *                    the interview from any bearing (the "background source"
 *                    the pair is rotated against).
 *   HandheldWindArt  the reporter’s handheld close up, its grille into the air, with
 *                    its layer — the bare grille, a foam ball, a fitted fur
 *                    — the air arriving from the left and bending round it;
 *                    the curls at the capsule are the "wind on the capsule"
 *                    cue: ILLUSTRATIVE (reporterWind.ts), never a level.
 *   ReporterWindScene  the wind step's display, labelled.
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { SoundCanvas } from '../smallperc/soundKit';
import { seeded } from '../foley/StageArt';
import { PaSpeaker } from './BroadcastArt';
import { REPORTER_COVERS, coverVerdict, type ReporterCover, type ReporterSite } from './reporterWind.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();

/* ── the street ── */

/** The roadway behind the guest: from `x1` (the kerb, nearer the talkers)
 *  back to `x0`, across z0..z1. From the side: the road surface a kerb's
 *  height below the pavement. */
export function Roadway({ view, x0, x1, z0, z1, floor }: { view: ViewId; x0: number; x1: number; z0: number; z1: number; floor: number }) {
  const p = useMemo(() => {
    const road = make();
    const kerb = make();
    const lane = make();
    if (view === 'top') {
      road.addRect(Skia.XYWHRect(x0, z0, x1 - x0, z1 - z0));
      kerb.addRect(Skia.XYWHRect(x1 - 150, z0, 150, z1 - z0));
      const lx = (x0 + x1 - 150) / 2;
      for (let z = z0 + 120; z < z1; z += 900) {
        lane.moveTo(lx, z);
        lane.lineTo(lx, Math.min(z1, z + 500));
      }
    } else {
      road.addRect(Skia.XYWHRect(x0, floor + 150, x1 - x0, 260));
      kerb.addRect(Skia.XYWHRect(x1 - 150, floor, 150, 410));
    }
    return { road, kerb, lane };
  }, [view, x0, x1, z0, z1, floor]);
  const b = p.road.getBounds();
  return (
    <Group>
      <Path path={p.road}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#3a3d44', '#24262b']} />
      </Path>
      <Path path={p.kerb}>
        <LinearGradient start={vec(b.x + b.width - 150, b.y)} end={vec(b.x + b.width, b.y)} colors={['#8f949c', '#c9ced6']} />
      </Path>
      <Path path={p.kerb} style="stroke" strokeWidth={8} color="#121317" opacity={0.7} />
      {view === 'top' ? (
        <Path path={p.lane} style="stroke" strokeWidth={60} strokeCap="butt" color="#e8e3d0" opacity={0.75} />
      ) : null}
    </Group>
  );
}

/** A loud public loudspeaker on its pole, at `c` (its cabinet's centre),
 *  turned to face `toward` (plan). Drawn with the broadcast kit's cabinet. */
export function LoudSource({ view, c, toward, floor }: { view: ViewId; c: Vec3; toward: Vec3; floor: number }) {
  if (view === 'side') return <PaSpeaker view="side" c={c} faces={toward.x >= c.x ? 1 : -1} floor={floor} />;
  const a = Math.atan2(toward.z - c.z, toward.x - c.x);
  return (
    <Group transform={[{ translateX: c.x }, { translateY: c.z }, { rotate: a }]}>
      <PaSpeaker view="top" c={{ x: 0, y: 0, z: 0 }} faces={1} floor={floor} pole={false} />
    </Group>
  );
}

/* ── the handheld in the wind ── */

/** The close-up’s box (mm): the grille’s front at u = 0 facing −u (into the air), the handle running to +u. */
export const HANDHELD_WIND_BOX = { u0: -310, u1: 270, v0: -150, v1: 150 };
/** The reporter's handheld as drawn here (repOmni's body). */
const MIC = { r: 24, len: 230 };
/** The layers' outer radii round the grille's centre (mm, drawing defaults). */
const FOAM_R = 40;
const FUR_R = 58;
const HEAD_U = -MIC.r;

function ball(r: number): SkPath {
  const p = make();
  p.addCircle(HEAD_U + 6, 0, r);
  return p;
}
function foamCells(r: number): SkPath {
  const rnd = seeded(41);
  const p = make();
  for (let k = 0; k < 90; k++) {
    const a = rnd() * Math.PI * 2;
    const q = Math.sqrt(rnd()) * (r - 4);
    p.addCircle(HEAD_U + 6 + Math.cos(a) * q, Math.sin(a) * q, 1.2 + rnd() * 1.6);
  }
  return p;
}
function furStrands(r: number): SkPath {
  const rnd = seeded(17);
  const p = make();
  for (let k = 0; k < 150; k++) {
    const a = rnd() * Math.PI * 2;
    const r0 = r * (0.62 + rnd() * 0.2);
    const l = 14 + rnd() * 14;
    const x0 = HEAD_U + 6 + Math.cos(a) * r0;
    const y0 = Math.sin(a) * r0;
    // strands swept back by the air (to the right)
    p.moveTo(x0, y0);
    p.quadTo(x0 + Math.cos(a) * l * 0.6 + 6, y0 + Math.sin(a) * l * 0.6, x0 + Math.cos(a) * l + 10 + rnd() * 6, y0 + Math.sin(a) * l);
  }
  return p;
}
/** Streamlines from the left, bending round a body of radius `r`. */
function streamlines(r: number): SkPath {
  const p = make();
  for (const v of [-118, -82, -46, 46, 82, 118]) {
    const s = Math.sign(v);
    const near = Math.abs(v) < r + 30;
    p.moveTo(-320, v);
    p.lineTo(HEAD_U - r - 70, v);
    if (near) p.quadTo(HEAD_U, s * (r + 30), HEAD_U + r + 70, v);
    else p.lineTo(HEAD_U + r + 70, v);
    p.lineTo(262, v);
  }
  return p;
}
function arrowHeads(): SkPath {
  const p = make();
  for (const v of [-118, -46, 46, 118]) {
    p.moveTo(-262, v - 9);
    p.lineTo(-250, v);
    p.lineTo(-262, v + 9);
  }
  return p;
}
/** The illustrative curls at the capsule (0–3): never a level. */
function curls(n: number): SkPath {
  const p = make();
  const at = [
    [HEAD_U - 10, -12],
    [HEAD_U + 14, 16],
    [HEAD_U - 26, 22],
  ];
  for (let k = 0; k < n; k++) {
    const [cx, cy] = at[k];
    p.addArc(Skia.XYWHRect(cx - 9, cy - 9, 18, 18), 0, 300);
    p.addArc(Skia.XYWHRect(cx - 4, cy - 4, 8, 8), 60, 260);
  }
  return p;
}

export function HandheldWindArt({ cover, site }: { cover: ReporterCover; site: ReporterSite }) {
  const v = coverVerdict(site, cover);
  const g = useMemo(() => ({ foam: ball(FOAM_R), cells: foamCells(FOAM_R), fur: ball(FUR_R - 14), strands: furStrands(FUR_R) }), []);
  const outer = cover === 'grille' ? MIC.r : cover === 'foam' ? FOAM_R : FUR_R;
  return (
    <Group>
      <Path path={streamlines(outer)} style="stroke" strokeWidth={3.4} strokeCap="round" color="#8fbcff" opacity={0.55}>
        <DashPathEffect intervals={[16, 10]} />
      </Path>
      <Path path={arrowHeads()} style="stroke" strokeWidth={3.4} strokeCap="round" strokeJoin="round" color="#8fbcff" opacity={0.8} />
      {/* the mic itself, pointing left into the air: its grille's front at u = 0 → drawn with the front toward −u */}
      <Group transform={[{ rotate: -Math.PI / 2 }]}>
        <MikingMicArt art="flagHandheld" r={MIC.r} len={MIC.len} />
      </Group>
      {cover === 'foam' || cover === 'fur' ? (
        <Group>
          <Path path={g.foam}>
            <RadialGradient c={vec(HEAD_U - 6, -14)} r={FOAM_R * 1.3} colors={['#6a6d75', '#3b3d43', '#1f2024']} />
          </Path>
          <Path path={g.cells} color="#141518" opacity={0.7} />
          <Path path={g.foam} style="stroke" strokeWidth={1.6} color="#08080a" />
        </Group>
      ) : null}
      {cover === 'fur' ? (
        <Group>
          <Path path={g.fur} color="#8d8a83" opacity={0.95} />
          <Path path={g.strands} style="stroke" strokeWidth={1.5} strokeCap="round" color="#cdc9bf" opacity={0.85} />
          <Path path={g.strands} style="stroke" strokeWidth={0.7} strokeCap="round" color="#5c5a54" opacity={0.6} />
        </Group>
      ) : null}
      {v.marks > 0 ? <Path path={curls(v.marks)} style="stroke" strokeWidth={3} strokeCap="round" color="#ff8a5c" opacity={0.95} /> : null}
      <Circle cx={HEAD_U + 6} cy={0} r={3.4} color="#ffc64d" />
    </Group>
  );
}

/** The wind step's display. */
export function ReporterWindScene({ w, h, cover, site, accessibilityLabel }: { w: number; h: number; cover: ReporterCover; site: ReporterSite; accessibilityLabel: string }) {
  const C = REPORTER_COVERS.find((q) => q.id === cover)!;
  const v = coverVerdict(site, cover);
  const labels: StaticLabel[] = [
    { id: 'air', text: 'WIND →', u: -300, v: -140, align: 'left', tone: 'blue' },
    { id: 'layer', text: C.label.toUpperCase(), short: C.short, u: 262, v: -140, align: 'right', tone: 'amber' },
    { id: 'cap', text: v.marks > 0 ? 'WIND ON THE CAPSULE' : 'THE CAPSULE · STILL AIR', short: 'CAPSULE', u: HEAD_U, v: 140, align: 'center', tone: v.marks > 0 ? 'amber' : 'muted' },
    { id: 'hand', text: 'HANDLE · HOLD BELOW THE FLAG', short: 'HANDLE', u: 70, v: 104, align: 'left', tone: 'muted' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={HANDHELD_WIND_BOX} label={accessibilityLabel} labels={labels}>
      <HandheldWindArt cover={cover} site={site} />
    </SoundCanvas>
  );
}
