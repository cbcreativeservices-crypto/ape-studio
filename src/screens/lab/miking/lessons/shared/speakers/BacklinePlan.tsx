/**
 * WHERE IT SITS for the amplified-chain lessons (LESSON_JOURNEY §8): a stage
 * (or a studio room) from above, at its real scale in mm, the amp at the
 * origin (frame C's x toward the audience = u, z across the stage = v — the
 * SAME frame the Studio-or-live page's monitors use), with the neighbours
 * drawn as illustrated objects seen from above: the player and their
 * instrument, the pedalboard (or a steel's pedals and knee levers) as the
 * player's KEEP-CLEAR space, the wedge, the drum kit, the other amp, the PA
 * and the audience. Positions are a typical layout, never a measurement
 * (`prov` internal). Static: it changes only on a tap or a switch (D8).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from './speakerModel.ts';
import { bassHead } from './ampModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

export type Backline = 'guitar' | 'bass' | 'steel';
export type BacklineScene = 'stage' | 'studio';

/** Typical positions (mm, plan u/v), ILLUSTRATIVE. */
export const BACKLINE_POS = {
  guitar: { player: { u: 950, v: 560 }, pedals: { u: 1380, v: 560 }, di: { u: 560, v: 1050 } },
  bass: { player: { u: 1050, v: 620 }, pedals: { u: 1480, v: 620 }, di: { u: 620, v: 1150 } },
  steel: { player: { u: 950, v: 720 }, pedals: { u: 1300, v: 720 }, di: { u: 600, v: 1250 } },
  drums: { u: -350, v: -1550 },
  otherAmp: { u: -60, v: 1750 },
  audience: 3300,
} as const;
export const BACKLINE_BOX = { stage: { u0: -1000, u1: 3750, v0: -2350, v1: 2350 }, studio: { u0: -1000, u1: 3100, v0: -2200, v1: 2300 } } as const;

/** Item ids on the plan and where each sits (taps and highlights). */
export function backlineItems(who: Backline, scene: BacklineScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const P = BACKLINE_POS[who];
  const out = [
    { id: 'amp', u: -100, v: 0, r: 420 },
    { id: 'player', u: P.player.u, v: P.player.v, r: 300 },
    { id: 'pedals', u: P.pedals.u, v: P.pedals.v, r: who === 'steel' ? 420 : 260 },
    { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
    { id: 'otherAmp', u: BACKLINE_POS.otherAmp.u, v: BACKLINE_POS.otherAmp.v, r: 420 },
  ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: BACKLINE_POS.drums.u + 200, v: BACKLINE_POS.drums.v, r: 760 });
    for (const w of wedges) out.push({ id: w.id === wedges[0].id ? 'wedge' : w.id, u: w.p.x, v: w.p.z, r: 330 });
    out.push({ id: 'audience', u: BACKLINE_POS.audience + 150, v: 0, r: 700 });
  } else out.push({ id: 'room', u: 2500, v: -1700, r: 500 });
  return out;
}

type Built = ReturnType<typeof build>;
const builtCache = new Map<Backline, Built>();
function build(who: Backline) {
  const P = BACKLINE_POS[who];
  // The amp from above (u = x, v = z of frame C).
  const c = cabLayout(who === 'bass' ? 'bass410' : 'combo12');
  const amp = rr(c.box.x0, c.box.z0, c.box.x1, c.box.z1, 16);
  const ampFront = rr(c.box.x1 - 20, c.box.z0 + 24, c.box.x1, c.box.z1 - 24, 4);
  const hd = who === 'bass' ? bassHead() : null;
  const head = hd ? rr(hd.x0, hd.z0, hd.x1, hd.z1, 10) : null;
  const handle = who === 'bass' ? null : rr((c.box.x0 + c.box.x1) / 2 - 20, (c.box.z0 + c.box.z1) / 2 - 80, (c.box.x0 + c.box.x1) / 2 + 20, (c.box.z0 + c.box.z1) / 2 + 80, 12);
  // The player from above (minimal line art), facing the audience (+u).
  const shoulders = make();
  shoulders.addOval(Skia.XYWHRect(-120, -230, 240, 460));
  const headTop = make();
  headTop.addCircle(0, 0, 95);
  // The instrument across the body (guitar / bass), or the steel in front.
  const inst = make();
  if (who === 'steel') inst.addRRect(Skia.RRectXY(Skia.XYWHRect(170, -450, 300, 900), 26, 26));
  else {
    inst.addOval(Skia.XYWHRect(70, -230, 170, 250));
    inst.addRRect(Skia.RRectXY(Skia.XYWHRect(140, -10, 38, who === 'bass' ? 640 : 460), 10, 10));
  }
  const strings = make();
  if (who === 'steel') for (let k = 0; k < 10; k++) {
    strings.moveTo(270 + k * 10, -420);
    strings.lineTo(270 + k * 10, 420);
  }
  // The player's keep-clear space: a pedalboard at the feet, or the steel's
  // pedals, knee levers and volume pedal under the instrument.
  const keep = who === 'steel' ? rr(P.player.u - 80, P.player.v - 520, P.player.u + 520, P.player.v + 520, 50) : rr(P.pedals.u - 180, P.pedals.v - 260, P.pedals.u + 180, P.pedals.v + 260, 40);
  const board = who === 'steel' ? null : rr(-90, -220, 90, 220, 14);
  const stomp = who === 'steel' ? [] : [-150, -50, 50, 150].map((v) => rr(-60, v - 38, 60, v + 38, 8));
  // A DI box, the other amp, the kit, wedge, PA and the audience.
  const di = rr(-60, -45, 60, 45, 10);
  const other = rr(-200, -320, 200, 320, 16);
  const drums: { u: number; v: number; r: number; kind: 'drum' | 'cym' }[] = [
    { u: 0, v: 0, r: 279, kind: 'drum' },
    { u: 350, v: -380, r: 178, kind: 'drum' },
    { u: 160, v: 220, r: 152, kind: 'drum' },
    { u: 360, v: 330, r: 203, kind: 'drum' },
    { u: 420, v: -620, r: 178, kind: 'cym' },
    { u: 520, v: 120, r: 228, kind: 'cym' },
    { u: 80, v: -480, r: 203, kind: 'cym' },
  ];
  const wedge = rr(-150, -280, 150, 280, 18);
  const wedgeGrille = rr(-40, -258, 136, 258, 14);
  const pa = rr(-300, -300, 300, 300, 20);
  const heads = make();
  for (let v = -2100; v <= 2100; v += 420) heads.addCircle(BACKLINE_POS.audience, v, 95);
  for (let v = -1890; v <= 1890; v += 420) heads.addCircle(BACKLINE_POS.audience + 330, v, 95);
  const room = rr(-950, -2150, 3050, 2250, 40);
  const deck = rr(BACKLINE_BOX.stage.u0, BACKLINE_BOX.stage.v0, BACKLINE_POS.audience - 450, BACKLINE_BOX.stage.v1, 0);
  return { amp, ampFront, head, handle, shoulders, headTop, inst, strings, keep, board, stomp, di, other, drums, wedge, wedgeGrille, pa, heads, room, deck };
}

export function BacklinePlan({ w, h, who, scene, wedges, highlight, onTap, shortOf, accessibilityLabel }: { w: number; h: number; who: Backline; scene: BacklineScene; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = BACKLINE_BOX[scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  let g = builtCache.get(who);
  if (!g) {
    g = build(who);
    builtCache.set(who, g);
  }
  const P = BACKLINE_POS[who];
  const items = backlineItems(who, scene, wedges);
  const hi = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = items
    .filter((i) => i.id !== 'room' || scene === 'studio')
    .map((i) => ({ id: i.id, text: shortOf(i.id), u: i.id === 'audience' ? i.u : i.u, v: i.v + i.r * 0.72 + 90, align: 'center' as const, tone: i.id === 'amp' ? ('amber' as const) : i.id === 'pedals' ? ('muted' as const) : undefined }));
  const tap = (x: number, y: number) => {
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    let best: string | null = null;
    let bd = Infinity;
    for (const it of items) {
      const d = Math.hypot(u - it.u, v - it.v) - it.r;
      if (d < bd && d < 260) {
        bd = d;
        best = it.id;
      }
    }
    if (best) onTap(best);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'stage' ? (
              <Path path={g.deck}>
                <LinearGradient start={vec(0, BACKLINE_BOX.stage.v0)} end={vec(0, BACKLINE_BOX.stage.v1)} colors={['#1a1714', '#141210', '#0e0c0b']} />
              </Path>
            ) : (
              <>
                <Path path={g.room} color="#121216" />
                <Path path={g.room} style="stroke" strokeWidth={40} color="#2a2a31" />
              </>
            )}
            {/* The player's keep-clear space (grey dashes). */}
            <Path path={g.keep} color={GREY} opacity={0.08} />
            <Path path={g.keep} style="stroke" strokeWidth={22} color={GREY} opacity={0.6}>
              <DashPathEffect intervals={[70, 50]} />
            </Path>
            {/* The drum kit (stage only). */}
            {scene === 'stage'
              ? g.drums.map((d, i) => (
                  <Group key={`d${i}`} transform={[{ translateX: BACKLINE_POS.drums.u + d.u }, { translateY: BACKLINE_POS.drums.v + d.v }]}>
                    <Circle cx={0} cy={0} r={d.r}>
                      {d.kind === 'drum' ? <RadialGradient c={vec(-d.r * 0.35, -d.r * 0.35)} r={d.r * 1.5} colors={['#ece6da', '#c9c1b0', '#8c8474']} /> : <RadialGradient c={vec(-d.r * 0.3, -d.r * 0.3)} r={d.r * 1.4} colors={['#e6c574', '#b48a33', '#6e5017']} />}
                    </Circle>
                    <Circle cx={0} cy={0} r={d.r} style="stroke" strokeWidth={d.kind === 'drum' ? 24 : 8} color={d.kind === 'drum' ? '#9aa0ab' : '#5a4210'} />
                  </Group>
                ))
              : null}
            {/* The other amp on the backline. */}
            <Group transform={[{ translateX: BACKLINE_POS.otherAmp.u }, { translateY: BACKLINE_POS.otherAmp.v }]}>
              <Path path={g.other}>
                <LinearGradient start={vec(-200, -320)} end={vec(200, 320)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
              </Path>
              <Path path={rr(180, -296, 200, 296, 4)} color="#2b2d33" />
            </Group>
            {/* THE amp (the miked one), its front edge, and a bass head on top. */}
            <Path path={g.amp} color="#000" opacity={0.5}>
              <BlurMask blur={40} style="normal" />
            </Path>
            <Path path={g.amp}>
              <LinearGradient start={vec(-300, -400)} end={vec(200, 400)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
            </Path>
            <Path path={g.ampFront}>
              <LinearGradient start={vec(0, -300)} end={vec(0, 300)} colors={['#3d3f46', '#2b2d33', '#1b1c20']} />
            </Path>
            {g.head ? (
              <Path path={g.head}>
                <LinearGradient start={vec(-300, -200)} end={vec(0, 200)} colors={['#4b4e57', '#26282e', '#121316']} />
              </Path>
            ) : null}
            {g.handle ? <Path path={g.handle} color="#0a0a0c" /> : null}
            {/* The DI box. */}
            <Group transform={[{ translateX: P.di.u }, { translateY: P.di.v }]}>
              <Path path={g.di}>
                <LinearGradient start={vec(-60, -45)} end={vec(60, 45)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
              </Path>
            </Group>
            {/* Pedalboard (guitar / bass). */}
            {g.board ? (
              <Group transform={[{ translateX: P.pedals.u }, { translateY: P.pedals.v }]}>
                <Path path={g.board} color="#17181c" />
                {g.stomp.map((s, i) => (
                  <Path key={`st${i}`} path={s}>
                    <LinearGradient start={vec(-60, -40)} end={vec(60, 40)} colors={i % 2 ? ['#3d8a5a', '#1f5236', '#0f2a1c'] : ['#8a5a2a', '#55361a', '#2a1a0c']} />
                  </Path>
                ))}
              </Group>
            ) : null}
            {/* The player and the instrument. */}
            <Group transform={[{ translateX: P.player.u }, { translateY: P.player.v }]}>
              <Path path={g.inst}>
                <LinearGradient start={vec(0, -400)} end={vec(300, 400)} colors={who === 'steel' ? ['#c98b4a', '#8a5426', '#4a2a10'] : who === 'bass' ? ['#2c3d5c', '#16213a', '#0a101e'] : ['#9a2a22', '#4a0f0c', '#260706']} />
              </Path>
              {who === 'steel' ? <Path path={g.strings} style="stroke" strokeWidth={4} color="#c9ccd3" opacity={0.7} /> : null}
              <Path path={g.shoulders}>
                <RadialGradient c={vec(-40, -80)} r={300} colors={['#5a5d66', '#33363d', '#1c1d22']} />
              </Path>
              <Path path={g.headTop}>
                <RadialGradient c={vec(-25, -30)} r={120} colors={['#d9b99a', '#a8835f', '#6e5236']} />
              </Path>
            </Group>
            {/* Monitors (stage), PA and the audience. */}
            {scene === 'stage'
              ? wedges.map((wd) => (
                  <Group key={wd.id} transform={[{ translateX: wd.p.x }, { translateY: wd.p.z }, { rotate: Math.atan2(wd.faces.z, wd.faces.x) }]}>
                    <Path path={g!.wedge}>
                      <LinearGradient start={vec(-150, 0)} end={vec(150, 0)} colors={['#1d1e22', '#3a3b41', '#55585f']} />
                    </Path>
                    <Path path={g!.wedgeGrille} color="#2b2d33" />
                  </Group>
                ))
              : null}
            {scene === 'stage' ? (
              <>
                {[-1950, 1950].map((v) => (
                  <Group key={v} transform={[{ translateX: 2850 }, { translateY: v }]}>
                    <Path path={g!.pa}>
                      <LinearGradient start={vec(-300, -300)} end={vec(300, 300)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
                    </Path>
                  </Group>
                ))}
                <Path path={g.heads}>
                  <RadialGradient c={vec(BACKLINE_POS.audience, -600)} r={3000} colors={['#5a5d66', '#2c2e34', '#17181c']} />
                </Path>
              </>
            ) : null}
            {hi ? <Circle cx={hi.u} cy={hi.v} r={hi.r + 40} style="stroke" strokeWidth={34} color={AMBER} opacity={0.9} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
