/**
 * WIND PROTECTION, DRAWN (Lab 6 group 2; wind.ts holds the words): a short
 * shotgun at true size (Ø 19 × 250 mm, the shared field mic) and the layers
 * it can wear, as the real objects —
 *
 *   FOAM          a close foam sleeve over the tube, its open cells
 *   FUR · FOAM    a long-hair cover slipped over the foam, its strands
 *   BASKET        a rigid open cage round the whole mic: end caps, rings,
 *                 a fine mesh, the mic held inside on a suspension, a
 *                 pistol grip under it
 *   BASKET · FUR  the same basket under a long-hair cover
 *
 * Air arrives from the left; its streamlines bend round the protection. The
 * curls at the capsule are the "wind on the capsule" cue — ILLUSTRATIVE, a
 * count from wind.ts, never a level. Behind it all, the SITE as a plain backdrop
 * (forest, grassland, plaza): scenery in code, not to scale. Static (D8).
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { ShotgunMountMic } from '../../../../../../features/lab/micDrawings';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { SoundCanvas } from '../smallperc/soundKit';
import { seeded } from '../foley/StageArt';
import { WIND_LAYERS, windVerdict, type ExposureId, type WindLayerId } from './wind.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();

/** The drawing's box (mm): the mic along u, its front (the tube's tip) at +u. */
export const WIND_BOX = { u0: -250, u1: 280, v0: -135, v1: 258 };
/** The shotgun: Ø 19 × 250 mm, the capsule 200 mm behind the grille. */
const SG = { r: 9.5, len: 50, fore: 200 };
/** Where the mic sits: its capsule at u = CAP_U, the tube tip at CAP_U + fore. */
const CAP_U = -40;
const TIP_U = CAP_U + SG.fore;
const TAIL_U = CAP_U - SG.len;
/** The basket round it (mm, a drawing default). */
const BASKET = { u0: -175, u1: 235, r: 48 };

function capsuleShape(u0: number, u1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, -r, u1 - u0, 2 * r), r, r));
  return p;
}

function furStrands(u0: number, u1: number, r: number, seed: number, len: number): SkPath {
  const rnd = seeded(seed);
  const p = make();
  const n = Math.round((u1 - u0) / 3.2);
  for (let k = 0; k < n; k++) {
    const u = u0 + r * 0.4 + rnd() * (u1 - u0 - r * 0.8);
    for (const side of [-1, 1]) {
      const v = side * r * (0.75 + rnd() * 0.2);
      p.moveTo(u, v);
      p.quadTo(u - len * (0.3 + rnd() * 0.4), v + side * len * 0.5, u - len * (0.5 + rnd() * 0.5), v + side * len * (0.8 + rnd() * 0.4));
    }
  }
  // the end tufts
  for (let k = 0; k < 18; k++) {
    const a = -Math.PI / 2 + (k / 17) * Math.PI;
    for (const [cu, dir] of [[u0 + r, -1], [u1 - r, 1]] as const) {
      const x = cu + dir * Math.cos(a) * r * 0.95;
      const y = Math.sin(a) * r * 0.95;
      p.moveTo(x, y);
      p.lineTo(x + dir * Math.cos(a) * len * 0.8, y + Math.sin(a) * len * 0.8);
    }
  }
  return p;
}

function foamCells(u0: number, u1: number, r: number): SkPath {
  const rnd = seeded(5);
  const p = make();
  for (let k = 0; k < 140; k++) {
    const u = u0 + 6 + rnd() * (u1 - u0 - 12);
    const v = (rnd() * 2 - 1) * r * 0.85;
    p.addCircle(u, v, 1.1 + rnd() * 1.4);
  }
  return p;
}

function basketMesh(): { cage: SkPath; rings: SkPath; mesh: SkPath; caps: SkPath } {
  const cage = capsuleShape(BASKET.u0, BASKET.u1, BASKET.r);
  const rings = make();
  for (let u = BASKET.u0 + BASKET.r + 30; u < BASKET.u1 - BASKET.r; u += 70) {
    rings.moveTo(u, -BASKET.r);
    rings.lineTo(u, BASKET.r);
  }
  const mesh = make();
  for (let v = -BASKET.r + 8; v < BASKET.r; v += 8) {
    mesh.moveTo(BASKET.u0 + BASKET.r * 0.6, v);
    mesh.lineTo(BASKET.u1 - BASKET.r * 0.6, v);
  }
  const caps = make();
  caps.addArc(Skia.XYWHRect(BASKET.u0, -BASKET.r, BASKET.r * 2, BASKET.r * 2), 90, 180);
  caps.addArc(Skia.XYWHRect(BASKET.u1 - BASKET.r * 2, -BASKET.r, BASKET.r * 2, BASKET.r * 2), -90, 180);
  return { cage, rings, mesh, caps };
}

function grip(): { grip: SkPath; arm: SkPath } {
  const g = make();
  g.moveTo(-40, BASKET.r + 14);
  g.lineTo(-10, BASKET.r + 14);
  g.lineTo(6, 240);
  g.quadTo(-12, 252, -34, 246);
  g.lineTo(-52, BASKET.r + 30);
  g.close();
  const arm = make();
  arm.addRRect(Skia.RRectXY(Skia.XYWHRect(-70, BASKET.r - 4, 90, 20), 6, 6));
  return { grip: g, arm };
}

/** Streamlines from the left, bending round the outermost layer (radius R). */
function streamlines(R: number): SkPath {
  const p = make();
  for (const v0 of [-110, -80, 80, 110]) {
    const bend = Math.sign(v0) * Math.max(0, R + 22 - Math.abs(v0));
    p.moveTo(-250, v0);
    p.cubicTo(-120, v0, -60, v0 + bend, 60, v0 + bend);
    p.cubicTo(160, v0 + bend, 210, v0, 270, v0);
  }
  return p;
}
function arrowHeads(): SkPath {
  const p = make();
  for (const v0 of [-110, -80, 80, 110]) {
    p.moveTo(-212, v0 - 7);
    p.lineTo(-200, v0);
    p.lineTo(-212, v0 + 7);
  }
  return p;
}

/** The "wind on the capsule" curls: n small spirals at the capsule (illustrative). */
function curls(n: number): SkPath {
  const p = make();
  const spots: [number, number][] = [
    [CAP_U - 6, -26],
    [CAP_U + 26, 22],
    [CAP_U - 34, 18],
  ];
  for (let k = 0; k < n; k++) {
    const [cx, cy] = spots[k];
    p.moveTo(cx + 13, cy);
    for (let t = 0; t <= 1.9 * Math.PI * 2; t += 0.3) {
      const r = 13 * (1 - t / (1.9 * Math.PI * 2.1));
      p.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
    }
  }
  return p;
}

export function WindLayerArt({ layer, exposure }: { layer: WindLayerId; exposure: ExposureId }) {
  const v = windVerdict(exposure, layer);
  const g = useMemo(() => {
    const foam = capsuleShape(CAP_U - 20, TIP_U + 22, 19);
    const softie = capsuleShape(CAP_U - 34, TIP_U + 36, 30);
    return { foam, cells: foamCells(CAP_U - 20, TIP_U + 22, 19), softie, softieFur: furStrands(CAP_U - 34, TIP_U + 36, 30, 3, 22), basket: basketMesh(), basketFur: furStrands(BASKET.u0, BASKET.u1, BASKET.r + 10, 9, 30), basketFurBody: capsuleShape(BASKET.u0 - 6, BASKET.u1 + 6, BASKET.r + 12), grip: grip() };
  }, []);
  const outer = layer === 'none' ? SG.r : layer === 'foam' ? 19 : layer === 'softie' ? 30 + 18 : layer === 'basket' ? BASKET.r : BASKET.r + 34;
  const inBasket = layer === 'basket' || layer === 'basketFur';
  return (
    <Group>
      {/* the air: streamlines from the left, bending round the outer layer */}
      <Path path={streamlines(outer)} style="stroke" strokeWidth={3.4} strokeCap="round" color="#8fbcff" opacity={0.55}>
        <DashPathEffect intervals={[16, 10]} />
      </Path>
      <Path path={arrowHeads()} style="stroke" strokeWidth={3.4} strokeCap="round" strokeJoin="round" color="#8fbcff" opacity={0.8} />
      {inBasket ? (
        <Group>
          <Path path={g.grip.grip}>
            <LinearGradient start={vec(-50, 0)} end={vec(6, 0)} colors={['#4d515b', '#1c1d22']} />
          </Path>
          <Path path={g.grip.grip} style="stroke" strokeWidth={1.6} color="#060607" />
          <Path path={g.grip.arm} color="#2c2e34" />
        </Group>
      ) : null}
      {/* the mic itself (pointing right: its tube's tip at +u) */}
      <Group transform={[{ translateX: CAP_U }, { rotate: Math.PI / 2 }]}>
        <ShotgunMountMic r={SG.r} len={SG.len} fore={SG.fore} mount={!inBasket} />
      </Group>
      {inBasket ? (
        <Group>
          {/* the suspension: two cradles on elastic cords, inside the cage */}
          <Path path={(() => { const p = make(); for (const u of [CAP_U - 30, CAP_U + 90]) { p.moveTo(u, -SG.r - 2); p.lineTo(u - 14, -BASKET.r + 6); p.moveTo(u, SG.r + 2); p.lineTo(u - 14, BASKET.r - 6); } return p; })()} style="stroke" strokeWidth={2.2} strokeCap="round" color="#c9a24a" />
        </Group>
      ) : null}
      {layer === 'foam' || layer === 'softie' ? (
        <Group>
          <Path path={g.foam}>
            <LinearGradient start={vec(0, -19)} end={vec(0, 19)} colors={['#5a5d64', '#34363c', '#1d1e22']} />
          </Path>
          <Path path={g.cells} color="#141518" opacity={0.75} />
          <Path path={g.foam} style="stroke" strokeWidth={1.4} color="#08080a" />
        </Group>
      ) : null}
      {layer === 'softie' ? (
        <Group>
          <Path path={g.softie} color="#8d8a83" opacity={0.92} />
          <Path path={g.softieFur} style="stroke" strokeWidth={1.3} strokeCap="round" color="#c8c4ba" opacity={0.85} />
          <Path path={g.softieFur} style="stroke" strokeWidth={0.7} strokeCap="round" color="#5c5a54" opacity={0.6} />
        </Group>
      ) : null}
      {layer === 'basket' ? (
        <Group>
          <Path path={g.basket.cage} color="#20232a" opacity={0.45} />
          <Path path={g.basket.mesh} style="stroke" strokeWidth={0.8} color="#9aa0ab" opacity={0.35} />
          <Path path={g.basket.rings} style="stroke" strokeWidth={3} color="#2c2f36" />
          <Path path={g.basket.rings} style="stroke" strokeWidth={1.2} color="#8a909b" opacity={0.6} />
          <Path path={g.basket.caps} style="stroke" strokeWidth={4} color="#2c2f36" />
          <Path path={g.basket.cage} style="stroke" strokeWidth={2.4} color="#08090b" />
          <Path path={g.basket.cage} style="stroke" strokeWidth={1} color="#c9ced8" opacity={0.35} />
        </Group>
      ) : null}
      {layer === 'basketFur' ? (
        <Group>
          <Path path={g.basketFurBody}>
            <LinearGradient start={vec(0, -BASKET.r)} end={vec(0, BASKET.r)} colors={['#b4b0a6', '#8a867d', '#5f5c56']} />
          </Path>
          <Path path={g.basketFur} style="stroke" strokeWidth={1.6} strokeCap="round" color="#d6d2c8" opacity={0.85} />
          <Path path={g.basketFur} style="stroke" strokeWidth={0.8} strokeCap="round" color="#5c5a54" opacity={0.55} />
        </Group>
      ) : null}
      {/* the "wind on the capsule" cue: illustrative curls, never a level */}
      {v.marks > 0 ? <Path path={curls(v.marks)} style="stroke" strokeWidth={3} strokeCap="round" color="#ff8a5c" opacity={0.95} /> : null}
      <Circle cx={CAP_U} cy={0} r={3} color="#ffc64d" />
    </Group>
  );
}

/* ── the place behind the mic ── */

/** A plain scenery sketch, not to scale and no real location. It reaches far past
 *  WIND_BOX so a tall stage and full screen stay covered; `ground` = the horizon. */
const BACK = { u0: -1400, u1: 1400, v0: -900, v1: 900, ground: 128 };

function area(u0: number, v0: number, u1: number, v1: number): SkPath {
  const p = make();
  p.addRect(Skia.XYWHRect(u0, v0, u1 - u0, v1 - v0));
  return p;
}

/** Inside a forest: tree trunks crowd in, the canopy closes overhead. */
function ForestBack() {
  const g = useMemo(() => {
    const rnd = seeded(23);
    const far = make();
    const near = make();
    const canopy = make();
    const litter = make();
    for (let u = BACK.u0; u < BACK.u1; u += 58) far.addRect(Skia.XYWHRect(u + rnd() * 26, BACK.v0, 9 + rnd() * 8, BACK.ground + 8 - BACK.v0));
    for (let u = BACK.u0; u < BACK.u1; u += 150) {
      const x = u + rnd() * 70;
      const half = 13 + rnd() * 8;
      near.moveTo(x - half, BACK.v0);
      near.lineTo(x + half, BACK.v0);
      near.lineTo(x + half * 1.6, BACK.ground + 26);
      near.lineTo(x - half * 1.6, BACK.ground + 26);
      near.close();
    }
    for (let u = BACK.u0; u < BACK.u1; u += 46) canopy.addCircle(u + rnd() * 24, -118 - rnd() * 44, 44 + rnd() * 32);
    canopy.addRect(Skia.XYWHRect(BACK.u0, BACK.v0, BACK.u1 - BACK.u0, -130 - BACK.v0));
    for (let k = 0; k < 260; k++) {
      const u = BACK.u0 + rnd() * (BACK.u1 - BACK.u0);
      const v = BACK.ground + 12 + rnd() * 260;
      litter.moveTo(u, v);
      litter.lineTo(u + 7 + rnd() * 9, v + rnd() * 3);
    }
    return { all: area(BACK.u0, BACK.v0, BACK.u1, BACK.v1), floor: area(BACK.u0, BACK.ground, BACK.u1, BACK.v1), far, near, canopy, litter };
  }, []);
  return (
    <Group>
      <Path path={g.all} color="#16261c" />
      <Path path={g.far} color="#243a2c" />
      <Path path={g.floor}>
        <LinearGradient start={vec(0, BACK.ground)} end={vec(0, BACK.ground + 260)} colors={['#3a3a20', '#222414']} />
      </Path>
      <Path path={g.litter} style="stroke" strokeWidth={3} strokeCap="round" color="#6b6330" opacity={0.7} />
      <Path path={g.near}>
        <LinearGradient start={vec(0, -130)} end={vec(0, BACK.ground + 26)} colors={['#3a2c20', '#5a4532']} />
      </Path>
      <Path path={g.canopy} color="#1f4a2e" />
    </Group>
  );
}

/** Open grassland: a wide sky, a low far rise, grass to the horizon. */
function OpenBack() {
  const g = useMemo(() => {
    const rnd = seeded(31);
    const rise = make();
    rise.moveTo(BACK.u0, BACK.ground + 4);
    rise.lineTo(BACK.u0, BACK.ground - 16);
    rise.cubicTo(-420, BACK.ground - 62, -120, BACK.ground - 8, 110, BACK.ground - 24);
    rise.cubicTo(300, BACK.ground - 40, 560, BACK.ground - 44, BACK.u1, BACK.ground - 10);
    rise.lineTo(BACK.u1, BACK.ground + 4);
    rise.close();
    const tufts = make();
    for (let k = 0; k < 520; k++) {
      const u = BACK.u0 + rnd() * (BACK.u1 - BACK.u0);
      const depth = rnd();
      const v = BACK.ground + 8 + depth * depth * 280;
      const tall = 7 + depth * 20;
      for (const lean of [4, 9, 14]) {
        tufts.moveTo(u, v);
        tufts.quadTo(u + lean * 0.3, v - tall * 0.7, u + lean, v - tall);
      }
    }
    return { sky: area(BACK.u0, BACK.v0, BACK.u1, BACK.ground + 1), grass: area(BACK.u0, BACK.ground, BACK.u1, BACK.v1), rise, tufts };
  }, []);
  return (
    <Group>
      <Path path={g.sky}>
        <LinearGradient start={vec(0, -200)} end={vec(0, BACK.ground)} colors={['#1d3147', '#3f6072']} />
      </Path>
      <Path path={g.rise} color="#3d5a44" />
      <Path path={g.grass}>
        <LinearGradient start={vec(0, BACK.ground)} end={vec(0, BACK.ground + 240)} colors={['#5d7030', '#2f3e19']} />
      </Path>
      <Path path={g.tufts} style="stroke" strokeWidth={1.6} strokeCap="round" color="#8ba34a" opacity={0.65} />
    </Group>
  );
}

/** A city plaza: plain blocks round a paved square, their window grids. */
function PlazaBack() {
  const g = useMemo(() => {
    const rnd = seeded(47);
    const FOOT = 92;
    const blocks: { path: SkPath; color: string }[] = [];
    const panes = make();
    const lit = make();
    const shades = ['#2c3140', '#384054', '#262b38', '#323a4c'];
    const wide = [210, 150, 260, 180];
    const tall = [-300, -210, -380, -250];
    let u = BACK.u0;
    for (let k = 0; u < BACK.u1; k++) {
      const w = wide[k % 4];
      const top = tall[k % 4];
      blocks.push({ path: area(u, top, u + w, FOOT), color: shades[k % 4] });
      for (let x = u + 22; x + 22 < u + w - 8; x += 36) {
        for (let y = top + 24; y + 34 < FOOT - 16; y += 52) (rnd() < 0.2 && (y > -90 || y < -190) ? lit : panes).addRect(Skia.XYWHRect(x, y, 20, 32)); // no lit pane behind the top labels
      }
      u += w;
    }
    const joints = make();
    for (let x = -3000; x <= 3000; x += 170) {
      joints.moveTo(x * 0.14, FOOT);
      joints.lineTo(x, BACK.v1);
    }
    for (const v of [106, 126, 156, 196, 250, 320, 410]) {
      joints.moveTo(BACK.u0, v);
      joints.lineTo(BACK.u1, v);
    }
    return { sky: area(BACK.u0, BACK.v0, BACK.u1, FOOT), paving: area(BACK.u0, FOOT, BACK.u1, BACK.v1), blocks, panes, lit, joints, foot: FOOT };
  }, []);
  return (
    <Group>
      <Path path={g.sky} color="#171b25" />
      {g.blocks.map((b, i) => (
        <Path key={i} path={b.path} color={b.color} />
      ))}
      <Path path={g.panes} color="#6c7a96" opacity={0.42} />
      <Path path={g.lit} color="#d9b868" opacity={0.5} />
      <Path path={g.paving}>
        <LinearGradient start={vec(0, g.foot)} end={vec(0, g.foot + 240)} colors={['#65656b', '#3b3b41']} />
      </Path>
      <Path path={g.joints} style="stroke" strokeWidth={1.8} color="#26262b" opacity={0.75} />
    </Group>
  );
}

/** The place, behind the wind marks: what SITE changes besides the words. */
export function WindSiteBack({ exposure }: { exposure: ExposureId }) {
  if (exposure === 'forest') return <ForestBack />;
  if (exposure === 'open') return <OpenBack />;
  return <PlazaBack />;
}

/** The wind step's display: the place, the mic and its layer, labelled. */
export function WindScene({ w, h, layer, exposure, accessibilityLabel }: { w: number; h: number; layer: WindLayerId; exposure: ExposureId; accessibilityLabel: string }) {
  const L = WIND_LAYERS.find((l) => l.id === layer)!;
  const v = windVerdict(exposure, layer);
  const labels: StaticLabel[] = [
    { id: 'air', text: 'WIND →', u: -245, v: -122, align: 'left', tone: 'blue' },
    { id: 'layer', text: L.label.toUpperCase(), short: L.short, u: 265, v: -122, align: 'right', tone: 'amber' },
    { id: 'cap', text: v.marks > 0 ? 'WIND ON THE CAPSULE' : 'THE CAPSULE · STILL AIR', short: 'CAPSULE', u: CAP_U, v: 150, align: 'center', tone: v.marks > 0 ? 'amber' : undefined },
  ];
  return (
    <SoundCanvas w={w} h={h} box={WIND_BOX} label={accessibilityLabel} labels={labels}>
      <WindSiteBack exposure={exposure} />
      <WindLayerArt layer={layer} exposure={exposure} />
    </SoundCanvas>
  );
}
