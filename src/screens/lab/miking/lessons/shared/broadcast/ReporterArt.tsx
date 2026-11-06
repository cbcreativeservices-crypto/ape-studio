/**
 * THE FIELD REPORTER — the look (Lab 7 group 3; B03). Real objects lit from
 * the upper left, in the engine's two views (side: u = x, v = y; top: u = x,
 * v = z — frame V, mm). Static (D8).
 *
 *   Roadway          the street behind the guest: asphalt, the curb, a
 *                    dashed lane line — a vehicle path nobody stands in.
 *   LoudSource       a loud public loudspeaker on its pole, turned to face
 *                    the interview from any bearing (the "background source"
 *                    the pair is rotated against).
 *   HandheldWindArt  the reporter’s handheld close up, its grille into the air, with
 *                    its layer — the bare grille, a foam ball, a fitted fur
 *                    — the air arriving from the left and bending round it;
 *                    the curls at the capsule are the "wind on the capsule"
 *                    cue: ILLUSTRATIVE (reporterWind.ts), never a level.
 *   ReporterSiteBack  the place behind it as a plain backdrop (open street,
 *                    doorway, waterfront): scenery in code, not to scale.
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

/** The roadway behind the guest: from `x1` (the curb, nearer the talkers)
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

/* ── the place behind the handheld ── */

/** A plain scenery sketch, not to scale and no real location. It reaches far past
 *  HANDHELD_WIND_BOX so a tall stage and full screen stay covered. */
const BACK = { u0: -1400, u1: 1400, v0: -900, v1: 900 };

function area(u0: number, v0: number, u1: number, v1: number): SkPath {
  const p = make();
  p.addRect(Skia.XYWHRect(u0, v0, u1 - u0, v1 - v0));
  return p;
}

/** An open street: a row of plain fronts, the pavement, the kerb, a lane line. */
function StreetBack() {
  const g = useMemo(() => {
    const rnd = seeded(53);
    const PAVE = 42;
    const KERB = 72;
    const fronts: { path: SkPath; color: string }[] = [];
    const panes = make();
    const lit = make();
    const shades = ['#3a3440', '#2f3644', '#433a38', '#343a48'];
    const wide = [170, 220, 150, 200];
    const tall = [-330, -420, -280, -380];
    let u = BACK.u0;
    for (let k = 0; u < BACK.u1; k++) {
      const w = wide[k % 4];
      fronts.push({ path: area(u, tall[k % 4], u + w, PAVE), color: shades[k % 4] });
      for (let x = u + 20; x + 28 < u + w - 8; x += 44) {
        for (let y = tall[k % 4] + 24; y + 42 < PAVE - 22; y += 66) (rnd() < 0.18 && (y > -100 || y < -200) ? lit : panes).addRect(Skia.XYWHRect(x, y, 26, 42)); // no lit pane behind the top labels
      }
      u += w;
    }
    const lane = make();
    for (let x = BACK.u0; x < BACK.u1; x += 150) lane.addRect(Skia.XYWHRect(x, 196, 90, 9));
    const lamp = make();
    lamp.addRect(Skia.XYWHRect(-247, -300, 7, PAVE + 300));
    lamp.addRect(Skia.XYWHRect(-247, -300, 62, 6));
    lamp.addRect(Skia.XYWHRect(-197, -298, 20, 11));
    return { sky: area(BACK.u0, BACK.v0, BACK.u1, PAVE), pave: area(BACK.u0, PAVE, BACK.u1, KERB), kerb: area(BACK.u0, KERB, BACK.u1, KERB + 9), road: area(BACK.u0, KERB + 9, BACK.u1, BACK.v1), fronts, panes, lit, lane, lamp, roadTop: KERB + 9 };
  }, []);
  return (
    <Group>
      <Path path={g.sky} color="#1a1f2c" />
      {g.fronts.map((b, i) => (
        <Path key={i} path={b.path} color={b.color} />
      ))}
      <Path path={g.panes} color="#7686a0" opacity={0.4} />
      <Path path={g.lit} color="#d9b868" opacity={0.5} />
      <Path path={g.lamp} color="#15171c" />
      <Path path={g.pave} color="#5c5d63" />
      <Path path={g.kerb} color="#a3a7ae" />
      <Path path={g.road}>
        <LinearGradient start={vec(0, g.roadTop)} end={vec(0, g.roadTop + 180)} colors={['#3c3e45', '#26282d']} />
      </Path>
      <Path path={g.lane} color="#e8e3d0" opacity={0.7} />
    </Group>
  );
}

/** A sheltered doorway: a brick wall close behind, the door set back in its
 *  frame under a lintel, a step at its foot. */
function DoorwayBack() {
  const g = useMemo(() => {
    const DOOR = { u0: -215, u1: 95, top: -188, foot: 160 };
    const courses = make();
    for (let v = BACK.v0, row = 0; v < DOOR.foot; v += 30, row++) {
      courses.moveTo(BACK.u0, v);
      courses.lineTo(BACK.u1, v);
      for (let u = BACK.u0 + (row % 2) * 34; u < BACK.u1; u += 68) {
        courses.moveTo(u, v);
        courses.lineTo(u, v + 30);
      }
    }
    const frame = area(DOOR.u0 - 18, DOOR.top - 6, DOOR.u1 + 18, DOOR.foot);
    const door = area(DOOR.u0, DOOR.top, DOOR.u1, DOOR.foot);
    const panels = make();
    for (const [u0, u1] of [[DOOR.u0 + 26, DOOR.u0 + 142], [DOOR.u0 + 168, DOOR.u1 - 26]] as const) {
      panels.addRect(Skia.XYWHRect(u0, DOOR.top + 30, u1 - u0, 120));
      panels.addRect(Skia.XYWHRect(u0, DOOR.top + 176, u1 - u0, 148));
    }
    return { wall: area(BACK.u0, BACK.v0, BACK.u1, DOOR.foot), courses, frame, door, panels, lintel: area(DOOR.u0 - 44, DOOR.top - 44, DOOR.u1 + 44, DOOR.top - 6), step: area(DOOR.u0 - 44, DOOR.foot, DOOR.u1 + 44, DOOR.foot + 24), ground: area(BACK.u0, DOOR.foot + 24, BACK.u1, BACK.v1), walk: area(BACK.u0, DOOR.foot, BACK.u1, DOOR.foot + 24) };
  }, []);
  return (
    <Group>
      <Path path={g.wall} color="#5a3a2e" />
      <Path path={g.courses} style="stroke" strokeWidth={2} color="#32211b" opacity={0.85} />
      <Path path={g.frame} color="#7f7666" />
      <Path path={g.door} color="#20302c" />
      <Path path={g.panels} style="stroke" strokeWidth={3} color="#3f5a52" />
      <Path path={g.lintel} color="#a79c88" />
      <Path path={g.walk} color="#4a4a50" />
      <Path path={g.step} color="#8c8c92" />
      <Path path={g.ground} color="#303035" />
    </Group>
  );
}

/** An exposed waterfront: open sky, the water out to a flat horizon, a rail. */
function WaterfrontBack() {
  const g = useMemo(() => {
    const rnd = seeded(61);
    const HORIZON = 34;
    const DECK = 214;
    const waves = make();
    for (let k = 0; k < 230; k++) {
      const u = BACK.u0 + rnd() * (BACK.u1 - BACK.u0);
      const d = rnd();
      const v = HORIZON + 7 + d * d * (DECK - HORIZON);
      const half = 7 + d * 24;
      waves.moveTo(u - half, v);
      waves.quadTo(u, v - 3 - d * 3, u + half, v);
    }
    const rail = make();
    rail.addRect(Skia.XYWHRect(BACK.u0, 160, BACK.u1 - BACK.u0, 8));
    rail.addRect(Skia.XYWHRect(BACK.u0, 186, BACK.u1 - BACK.u0, 5));
    for (let u = BACK.u0; u < BACK.u1; u += 130) rail.addRect(Skia.XYWHRect(u, 160, 8, DECK - 160));
    const planks = make();
    for (const v of [DECK + 14, DECK + 34, DECK + 62, DECK + 100]) {
      planks.moveTo(BACK.u0, v);
      planks.lineTo(BACK.u1, v);
    }
    return { sky: area(BACK.u0, BACK.v0, BACK.u1, HORIZON + 1), water: area(BACK.u0, HORIZON, BACK.u1, DECK), deck: area(BACK.u0, DECK, BACK.u1, BACK.v1), waves, rail, planks, horizon: HORIZON, deckTop: DECK };
  }, []);
  return (
    <Group>
      <Path path={g.sky}>
        <LinearGradient start={vec(0, -240)} end={vec(0, g.horizon)} colors={['#203a54', '#54788a']} />
      </Path>
      <Path path={g.water}>
        <LinearGradient start={vec(0, g.horizon)} end={vec(0, g.deckTop)} colors={['#2d6478', '#123a4c']} />
      </Path>
      <Path path={g.waves} style="stroke" strokeWidth={2} strokeCap="round" color="#a7d3de" opacity={0.5} />
      <Path path={g.deck} color="#4a3f33" />
      <Path path={g.planks} style="stroke" strokeWidth={2} color="#2a231b" />
      <Path path={g.rail} color="#9aa0aa" />
    </Group>
  );
}

/** The place, behind the wind marks: what PLACE changes besides the words. */
export function ReporterSiteBack({ site }: { site: ReporterSite }) {
  if (site === 'street') return <StreetBack />;
  if (site === 'sheltered') return <DoorwayBack />;
  return <WaterfrontBack />;
}

/** The wind step's display. */
export function ReporterWindScene({ w, h, cover, site, accessibilityLabel }: { w: number; h: number; cover: ReporterCover; site: ReporterSite; accessibilityLabel: string }) {
  const C = REPORTER_COVERS.find((q) => q.id === cover)!;
  const v = coverVerdict(site, cover);
  const labels: StaticLabel[] = [
    { id: 'air', text: 'WIND →', u: -300, v: -140, align: 'left', tone: 'blue' },
    { id: 'layer', text: C.label.toUpperCase(), short: C.short, u: 262, v: -140, align: 'right', tone: 'amber' },
    { id: 'cap', text: v.marks > 0 ? 'WIND ON THE CAPSULE' : 'THE CAPSULE · STILL AIR', short: 'CAPSULE', u: HEAD_U, v: 140, align: 'center', tone: v.marks > 0 ? 'amber' : undefined },
    { id: 'hand', text: 'HANDLE · HOLD BELOW THE FLAG', short: 'HANDLE', u: 70, v: 104, align: 'left' },
  ];
  return (
    <SoundCanvas w={w} h={h} box={HANDHELD_WIND_BOX} label={accessibilityLabel} labels={labels}>
      <ReporterSiteBack site={site} />
      <HandheldWindArt cover={cover} site={site} />
    </SoundCanvas>
  );
}
