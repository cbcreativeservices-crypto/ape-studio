/**
 * THE BOUNDARY AND PLANT TOOLS, drawn (boundary.ts). Built once by group 2
 * (lab7-g5). Static Skia, millimetres, lit from the upper left.
 *
 *   BoundarySection  a section through a hard floor: the capsule `h` above it
 *                    (a small condenser on a low clamp) or AT it (a boundary
 *                    plate lying on the floor), the source point, the direct
 *                    path (blue), the reflected path through its bounce point
 *                    (amber) and the source's image below the floor (dashed)
 *                    — u along the floor, v = −height (up the screen).
 *   PlantSection     a structure (a padded support post) with an airborne
 *                    mic on an isolated mount or a rigid clamp, or a contact
 *                    sensor on it; the vibration path from an impact drawn as
 *                    a wave along the structure — reaching the capsule through
 *                    a rigid clamp, stopped at the suspension.
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { ShockMountArt } from '../fieldmics/FieldMicArt';
import { bouncePoint, type BoundaryGeom, type PlantMount } from './boundary.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#8fbcff';
const RED = '#ff6b5e';

/** The floor slab under u0 … u1 (a hardwood court on its subfloor). */
function Floor({ u0, u1, px }: { u0: number; u1: number; px: number }) {
  const g = useMemo(() => {
    const slab = make();
    slab.addRect(Skia.XYWHRect(u0, 0, u1 - u0, 90));
    const boards = make();
    for (let u = u0 + 120; u < u1; u += 380) {
      boards.moveTo(u, 0);
      boards.lineTo(u, 34);
    }
    const sub = make();
    sub.addRect(Skia.XYWHRect(u0, 34, u1 - u0, 56));
    return { slab, boards, sub };
  }, [u0, u1]);
  return (
    <Group>
      <Path path={g.slab}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 34)} colors={['#c08a52', '#8c5a2e']} />
      </Path>
      <Path path={g.sub} color="#2d2a26" />
      <Path path={g.boards} style="stroke" strokeWidth={Math.max(2, 1 * px)} color="#5a3a1c" opacity={0.6} />
      <Path path={g.slab} style="stroke" strokeWidth={1.2 * px} color="#0b0c0f" opacity={0.6} />
    </Group>
  );
}

export function BoundarySection({ g, px, u0 = -900, u1 }: { g: BoundaryGeom; px: number; u0?: number; u1?: number }) {
  const end = u1 ?? g.x + 900;
  const b = bouncePoint(g);
  const rays = useMemo(() => {
    const direct = make();
    direct.moveTo(g.x, -g.hs);
    direct.lineTo(0, -g.h);
    const refl = make();
    refl.moveTo(g.x, -g.hs);
    refl.lineTo(b, 0);
    refl.lineTo(0, -g.h);
    const image = make();
    image.moveTo(b, 0);
    image.lineTo(g.x, g.hs);
    return { direct, refl, image };
  }, [g.x, g.h, g.hs, b]);
  const atSurface = g.h <= 0.5;
  return (
    <Group>
      <Floor u0={u0} u1={end} px={px} />
      {/* The image source below the floor (the mirror picture). */}
      <Path path={rays.image} style="stroke" strokeWidth={1.4 * px} color={AMBER} opacity={0.45}>
        <DashPathEffect intervals={[5 * px, 5 * px]} />
      </Path>
      <Circle cx={g.x} cy={g.hs} r={6 * px} style="stroke" strokeWidth={1.4 * px} color={AMBER} opacity={0.5}>
        <DashPathEffect intervals={[3 * px, 3 * px]} />
      </Circle>
      <Path path={rays.refl} style="stroke" strokeWidth={2.2 * px} color={AMBER} opacity={atSurface ? 0.35 : 0.95} strokeJoin="round" />
      <Path path={rays.direct} style="stroke" strokeWidth={2.4 * px} color={BLUE} />
      {/* The source: a ring at the clap's height. */}
      <Circle cx={g.x} cy={-g.hs} r={9 * px} color={AMBER} opacity={0.2} />
      <Circle cx={g.x} cy={-g.hs} r={9 * px} style="stroke" strokeWidth={2 * px} color={AMBER} />
      {atSurface ? (
        // A boundary plate lying on the floor, its capsule at the surface.
        <Group transform={[{ translateX: -70 }, { translateY: -2 }, { rotate: -Math.PI / 2 }]}>
          <MikingMicArt art="boundary" r={10} len={140} cross={22} />
        </Group>
      ) : (
        <Group>
          {/* A low clamp stand rising from the floor to the capsule. */}
          <Path
            path={(() => {
              const p = make();
              p.moveTo(-60, -g.h);
              p.lineTo(-60, 0);
              p.moveTo(-140, 0);
              p.lineTo(20, 0);
              return p;
            })()}
            style="stroke"
            strokeWidth={14}
            strokeCap="round"
            color="#3a3d45"
          />
          <Group transform={[{ translateX: 0 }, { translateY: -g.h }, { rotate: Math.atan2(g.h - g.hs, g.x) + Math.PI / 2 }]}>
            <MikingMicArt art="sdc" r={10.5} len={104} />
          </Group>
        </Group>
      )}
    </Group>
  );
}

/** A padded support post (a structure), section, standing on the floor at u = 0. */
export function PlantSection({ mount, px, struck = true }: { mount: PlantMount; px: number; struck?: boolean }) {
  const g = useMemo(() => {
    const post = make();
    post.addRRect(Skia.RRectXY(Skia.XYWHRect(-90, -1800, 180, 1800), 18, 18));
    const pad = make();
    pad.addRRect(Skia.RRectXY(Skia.XYWHRect(-130, -1350, 260, 900), 60, 60));
    const base = make();
    base.addRect(Skia.XYWHRect(-420, -60, 840, 60));
    // The vibration from an impact high on the post, down the post, as a wave.
    const wave = make();
    const y0 = -1700;
    const y1 = mount === 'contact' ? -700 : -700;
    for (let i = 0; i <= 40; i++) {
      const y = y0 + ((y1 - y0) * i) / 40;
      const x = 105 + Math.sin(i * 1.4) * 18;
      if (i === 0) wave.moveTo(x, y);
      else wave.lineTo(x, y);
    }
    const clamp = make();
    clamp.addRRect(Skia.RRectXY(Skia.XYWHRect(90, -760, 120, 120), 12, 12));
    const arm = make();
    arm.moveTo(210, -700);
    arm.lineTo(mount === 'isolated' ? 330 : 360, -700);
    return { post, pad, base, wave, clamp, arm };
  }, [mount]);
  const reaches = mount !== 'isolated';
  return (
    <Group>
      <Path path={g.base} color="#2a2b30" />
      <Path path={g.post}>
        <LinearGradient start={vec(-90, 0)} end={vec(90, 0)} colors={['#9aa0ab', '#5b5f69', '#2a2c32']} />
      </Path>
      <Path path={g.pad}>
        <LinearGradient start={vec(-130, -1350)} end={vec(130, -450)} colors={['#3d5a80', '#23344d']} />
      </Path>
      {struck ? (
        <Group>
          <Path path={g.wave} style="stroke" strokeWidth={2.4 * px} color={RED} opacity={0.9} />
          <Circle cx={105} cy={-1720} r={10 * px} style="stroke" strokeWidth={2 * px} color={RED} />
        </Group>
      ) : null}
      {mount === 'contact' ? (
        <Group>
          <Path
            path={(() => {
              const p = make();
              p.addRRect(Skia.RRectXY(Skia.XYWHRect(90, -730, 40, 60), 10, 10));
              return p;
            })()}
            color="#c9a24a"
          />
          <Path
            path={(() => {
              const p = make();
              p.moveTo(130, -700);
              p.cubicTo(260, -700, 300, -400, 420, -380);
              return p;
            })()}
            style="stroke"
            strokeWidth={8}
            strokeCap="round"
            color="#0b0c0f"
          />
        </Group>
      ) : (
        <Group>
          <Path path={g.clamp}>
            <LinearGradient start={vec(90, -760)} end={vec(210, -640)} colors={['#6b707b', '#30333a']} />
          </Path>
          <Path path={g.arm} style="stroke" strokeWidth={18} strokeCap="round" color="#3a3d45" />
          {mount === 'isolated' ? <ShockMountArt x={430} y={-700} r={14} angleDeg={0} /> : null}
          <Group transform={[{ translateX: mount === 'isolated' ? 500 : 470 }, { translateY: -700 }, { rotate: -Math.PI / 2 + Math.PI }]}>
            <MikingMicArt art="sdc" r={10.5} len={104} />
          </Group>
          {/* Where the vibration goes: on into the capsule (rigid) or stopped (isolated). */}
          <Path
            path={(() => {
              const p = make();
              p.moveTo(212, -716);
              p.lineTo(reaches ? 440 : 360, -716);
              return p;
            })()}
            style="stroke"
            strokeWidth={2 * px}
            color={RED}
            opacity={reaches ? 0.9 : 0.4}
          >
            <DashPathEffect intervals={[4 * px, 4 * px]} />
          </Path>
        </Group>
      )}
    </Group>
  );
}
