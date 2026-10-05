/**
 * WHERE IT SITS for the electric pianos (LESSON_JOURNEY §8): a stage (or a
 * studio room) from above, at its real scale in mm, the audience to the
 * right (+u), with the neighbours drawn as illustrated objects seen from
 * above. The SAME frame the Studio-or-live page's monitors use:
 *
 *   tine piano   u = x, v = z of the combo's frame C — the combo at the
 *                origin facing the audience, the keyboard 1500 mm to its side
 *                (a drawing default), the player seated behind it
 *   reed piano   u = −x, v = z of frame W — the instrument at the origin, its
 *                speakers facing the PLAYER, who sits on the stage side and
 *                faces the audience over it
 *
 * The player's KEEP-CLEAR space (hands, knees, the sustain pedal) is drawn
 * dashed. Positions are a typical layout, never a measurement (`prov`
 * internal). Static: it changes only on a tap or a switch (D8).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from '../speakers/speakerModel.ts';
import { RHODES, WURLI } from './keysSpec.ts';
import { C_BASS, C_TREBLE, W } from './wurliModel.ts';
import { KEYS } from './KeysArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const GREY = '#8a8f9c';
function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

export type KeysRig = 'rhodes' | 'wurli';
export type KeysScene = 'stage' | 'studio';

/** Typical positions (mm, plan u/v), ILLUSTRATIVE. */
const SIDE = RHODES.sideBySide.mm;
export const KEYS_POS = {
  rhodes: {
    keyboard: { u: 560, v: SIDE },
    player: { u: 40, v: SIDE },
    pedal: { u: 330, v: SIDE + 110 },
    di: { u: 150, v: SIDE + 720 },
    drums: { u: -350, v: -1950 },
    otherAmp: { u: -60, v: -1050 },
  },
  wurli: {
    player: { u: -620, v: 0 },
    pedal: { u: -230, v: 100 },
    di: { u: 250, v: -820 },
    drums: { u: -1450, v: -1850 },
    otherAmp: { u: -900, v: 1650 },
  },
  audience: 3300,
} as const;
export const KEYS_BOX = {
  rhodes: { stage: { u0: -800, u1: 3650, v0: -2750, v1: 2500 }, studio: { u0: -900, u1: 2900, v0: -1300, v1: 2600 } },
  wurli: { stage: { u0: -2200, u1: 3650, v0: -2600, v1: 2300 }, studio: { u0: -1700, u1: 2600, v0: -1800, v1: 1800 } },
} as const;

/** Item ids on the plan and where each sits (taps and highlights). */
export function keysItems(rig: KeysRig, scene: KeysScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const P = KEYS_POS[rig];
  const out: { id: string; u: number; v: number; r: number }[] =
    rig === 'rhodes'
      ? [
          { id: 'amp', u: -100, v: 0, r: 420 },
          { id: 'keys', u: KEYS_POS.rhodes.keyboard.u, v: KEYS_POS.rhodes.keyboard.v, r: 480 },
          { id: 'musician', u: P.player.u, v: P.player.v, r: 300 },
          { id: 'pedal', u: P.pedal.u, v: P.pedal.v, r: 140 },
          { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
          { id: 'otherAmp', u: P.otherAmp.u, v: P.otherAmp.v, r: 420 },
        ]
      : [
          { id: 'amp', u: 230, v: 0, r: 500 },
          { id: 'musician', u: P.player.u, v: P.player.v, r: 300 },
          { id: 'pedal', u: P.pedal.u, v: P.pedal.v, r: 140 },
          { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
          { id: 'otherAmp', u: P.otherAmp.u, v: P.otherAmp.v, r: 420 },
        ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: P.drums.u + 200, v: P.drums.v, r: 760 });
    for (const w of wedges) {
      const pu = rig === 'rhodes' ? w.p.x : -w.p.x;
      out.push({ id: w.id === wedges[0].id ? 'wedge' : w.id, u: pu, v: w.p.z, r: 330 });
    }
    out.push({ id: 'audience', u: KEYS_POS.audience + 150, v: 0, r: 700 });
  } else out.push({ id: 'room', u: rig === 'rhodes' ? 2300 : 1900, v: rig === 'rhodes' ? -900 : -1300, r: 420 });
  return out;
}

type Built = ReturnType<typeof build>;
const cache = new Map<KeysRig, Built>();

function keyboardTop(cu: number, cv: number, width: number, depth: number, keyDepth: number, nWhite: number) {
  // From above with the player at −u: the case, a dark lid, the keys on the −u edge.
  const body = rr(cu - depth / 2, cv - width / 2, cu + depth / 2, cv + width / 2, 40);
  const lid = rr(cu - depth / 2 + keyDepth + 40, cv - width / 2 + 30, cu + depth / 2 - 24, cv + width / 2 - 30, 30);
  const whites = make();
  const lines = make();
  const blacks = make();
  const k0 = cv - width / 2 + 70;
  const kw = (width - 140) / nWhite;
  const u0 = cu - depth / 2 + 14;
  const u1 = u0 + keyDepth;
  whites.addRRect(Skia.RRectXY(Skia.XYWHRect(u0, k0, keyDepth, width - 140), 6, 6));
  const pat = [true, true, false, true, true, true, false];
  for (let i = 1; i < nWhite; i++) {
    lines.moveTo(u0, k0 + i * kw);
    lines.lineTo(u1, k0 + i * kw);
    if (pat[(i - 1) % 7]) blacks.addRRect(Skia.RRectXY(Skia.XYWHRect(u0 + keyDepth * 0.38, k0 + i * kw - kw * 0.3, keyDepth * 0.62, kw * 0.6), 4, 4));
  }
  return { body, lid, whites, lines, blacks };
}

function build(rig: KeysRig) {
  const c = cabLayout('combo12');
  const amp = rig === 'rhodes' ? rr(c.box.x0, c.box.z0, c.box.x1, c.box.z1, 16) : null;
  const ampFront = rig === 'rhodes' ? rr(c.box.x1 - 20, c.box.z0 + 24, c.box.x1, c.box.z1 - 24, 4) : null;
  const handle = rig === 'rhodes' ? rr((c.box.x0 + c.box.x1) / 2 - 20, (c.box.z0 + c.box.z1) / 2 - 80, (c.box.x0 + c.box.x1) / 2 + 20, (c.box.z0 + c.box.z1) / 2 + 80, 12) : null;
  const kb =
    rig === 'rhodes'
      ? keyboardTop(KEYS_POS.rhodes.keyboard.u, KEYS_POS.rhodes.keyboard.v, RHODES.stage.w.mm, RHODES.stage.d.mm, 150, 36)
      : keyboardTop((-W.slipX - W.caseBackX) / 2, 0, WURLI.w.mm, WURLI.d.mm, 168, 38);
  // the reed piano's two speakers seen from above, facing the player (−u)
  const ovals = make();
  if (rig === 'wurli')
    for (const c2 of [C_BASS, C_TREBLE]) ovals.addRRect(Skia.RRectXY(Skia.XYWHRect(-c2.x - 4, c2.z - 102, 30, 204), 10, 10));
  // the player from above (minimal line art), facing the audience (+u)
  const shoulders = make();
  shoulders.addOval(Skia.XYWHRect(-120, -230, 240, 460));
  const headTop = make();
  headTop.addCircle(0, 0, 95);
  const bench = rr(-330, -380, -70, 380, 20);
  const P = KEYS_POS[rig];
  const keep = rig === 'rhodes' ? rr(P.player.u - 260, SIDE - 520, KEYS_POS.rhodes.keyboard.u - RHODES.stage.d.mm / 2 + 170, SIDE + 520, 60) : rr(P.player.u - 330, -560, 30, 560, 60);
  const pedal = rr(-70, -45, 70, 45, 14);
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
  for (let v = -2100; v <= 2100; v += 420) heads.addCircle(KEYS_POS.audience, v, 95);
  for (let v = -1890; v <= 1890; v += 420) heads.addCircle(KEYS_POS.audience + 330, v, 95);
  const B = KEYS_BOX[rig];
  const deck = rr(B.stage.u0, B.stage.v0, KEYS_POS.audience - 450, B.stage.v1, 0);
  const room = rr(B.studio.u0 + 50, B.studio.v0 + 50, B.studio.u1 - 50, B.studio.v1 - 50, 40);
  return { amp, ampFront, handle, kb, ovals, shoulders, headTop, bench, keep, pedal, di, other, drums, wedge, wedgeGrille, pa, heads, deck, room };
}

export function KeysPlan({ w, h, rig, scene, wedges, highlight, onTap, shortOf, accessibilityLabel }: { w: number; h: number; rig: KeysRig; scene: KeysScene; wedges: readonly Wedge[]; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = KEYS_BOX[rig][scene];
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  let g = cache.get(rig);
  if (!g) {
    g = build(rig);
    cache.set(rig, g);
  }
  const P = KEYS_POS[rig];
  const items = keysItems(rig, scene, wedges);
  const hi = items.find((i) => i.id === highlight);
  const labels: StaticLabel[] = items.map((i) => ({ id: i.id, text: shortOf(i.id), u: i.u, v: i.v + i.r * 0.72 + 90, align: 'center' as const, tone: i.id === 'amp' ? ('amber' as const) : i.id === 'pedal' ? ('muted' as const) : undefined }));
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
  const wedgeAt = (wd: Wedge) => (rig === 'rhodes' ? { u: wd.p.x, v: wd.p.z, a: Math.atan2(wd.faces.z, wd.faces.x) } : { u: -wd.p.x, v: wd.p.z, a: Math.atan2(wd.faces.z, -wd.faces.x) });
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'stage' ? (
              <Path path={g.deck}>
                <LinearGradient start={vec(0, box.v0)} end={vec(0, box.v1)} colors={['#1a1714', '#141210', '#0e0c0b']} />
              </Path>
            ) : (
              <>
                <Path path={g.room} color="#121216" />
                <Path path={g.room} style="stroke" strokeWidth={40} color="#2a2a31" />
              </>
            )}
            {/* the player's keep-clear space: hands, knees and the sustain pedal */}
            <Path path={g.keep} color={GREY} opacity={0.08} />
            <Path path={g.keep} style="stroke" strokeWidth={22} color={GREY} opacity={0.6}>
              <DashPathEffect intervals={[70, 50]} />
            </Path>
            {scene === 'stage'
              ? g.drums.map((d, i) => (
                  <Group key={`d${i}`} transform={[{ translateX: P.drums.u + d.u }, { translateY: P.drums.v + d.v }]}>
                    <Circle cx={0} cy={0} r={d.r}>
                      {d.kind === 'drum' ? <RadialGradient c={vec(-d.r * 0.35, -d.r * 0.35)} r={d.r * 1.5} colors={['#ece6da', '#c9c1b0', '#8c8474']} /> : <RadialGradient c={vec(-d.r * 0.3, -d.r * 0.3)} r={d.r * 1.4} colors={['#e6c574', '#b48a33', '#6e5017']} />}
                    </Circle>
                    <Circle cx={0} cy={0} r={d.r} style="stroke" strokeWidth={d.kind === 'drum' ? 24 : 8} color={d.kind === 'drum' ? '#9aa0ab' : '#5a4210'} />
                  </Group>
                ))
              : null}
            {/* the other amp */}
            <Group transform={[{ translateX: P.otherAmp.u }, { translateY: P.otherAmp.v }]}>
              <Path path={g.other}>
                <LinearGradient start={vec(-200, -320)} end={vec(200, 320)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
              </Path>
              <Path path={rr(180, -296, 200, 296, 4)} color="#2b2d33" />
            </Group>
            {/* the combo (tine piano) */}
            {g.amp ? (
              <>
                <Path path={g.amp} color="#000" opacity={0.5}>
                  <BlurMask blur={40} style="normal" />
                </Path>
                <Path path={g.amp}>
                  <LinearGradient start={vec(-300, -400)} end={vec(200, 400)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
                </Path>
                <Path path={g.ampFront!}>
                  <LinearGradient start={vec(0, -300)} end={vec(0, 300)} colors={['#3d3f46', '#2b2d33', '#1b1c20']} />
                </Path>
                <Path path={g.handle!} color="#0a0a0c" />
              </>
            ) : null}
            {/* the keyboard */}
            <Path path={g.kb.body} color="#000" opacity={0.5}>
              <BlurMask blur={30} style="normal" />
            </Path>
            <Path path={g.kb.body}>
              <LinearGradient start={vec(0, -600)} end={vec(600, 600)} colors={rig === 'rhodes' ? [...KEYS.tolex] : [...KEYS.plastic]} />
            </Path>
            <Path path={g.kb.lid}>
              <LinearGradient start={vec(0, -500)} end={vec(500, 500)} colors={rig === 'rhodes' ? ['#4d4f57', '#2a2c31', '#141519'] : ['#a85a46', '#6e3226', '#3a1810']} />
            </Path>
            <Path path={g.kb.whites}>
              <LinearGradient start={vec(0, 0)} end={vec(200, 0)} colors={[...KEYS.ivory]} />
            </Path>
            <Path path={g.kb.lines} style="stroke" strokeWidth={4} color="#7d796f" opacity={0.7} />
            <Path path={g.kb.blacks} color="#0d0d10" />
            {rig === 'wurli' ? <Path path={g.ovals} color="#16110e" /> : null}
            {/* the DI box */}
            <Group transform={[{ translateX: P.di.u }, { translateY: P.di.v }]}>
              <Path path={g.di}>
                <LinearGradient start={vec(-60, -45)} end={vec(60, 45)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
              </Path>
            </Group>
            {/* the sustain pedal */}
            <Group transform={[{ translateX: P.pedal.u }, { translateY: P.pedal.v }]}>
              <Path path={g.pedal}>
                <LinearGradient start={vec(-70, -45)} end={vec(70, 45)} colors={[...KEYS.chrome]} />
              </Path>
            </Group>
            {/* the player on the bench */}
            <Group transform={[{ translateX: P.player.u }, { translateY: P.player.v }]}>
              <Path path={g.bench} color="#26272c" />
              <Path path={g.shoulders}>
                <RadialGradient c={vec(-40, -80)} r={300} colors={['#5a5d66', '#33363d', '#1c1d22']} />
              </Path>
              <Path path={g.headTop}>
                <RadialGradient c={vec(-25, -30)} r={120} colors={['#d9b99a', '#a8835f', '#6e5236']} />
              </Path>
            </Group>
            {scene === 'stage'
              ? wedges.map((wd) => {
                  const a = wedgeAt(wd);
                  return (
                    <Group key={wd.id} transform={[{ translateX: a.u }, { translateY: a.v }, { rotate: a.a }]}>
                      <Path path={g!.wedge}>
                        <LinearGradient start={vec(-150, 0)} end={vec(150, 0)} colors={['#1d1e22', '#3a3b41', '#55585f']} />
                      </Path>
                      <Path path={g!.wedgeGrille} color="#2b2d33" />
                    </Group>
                  );
                })
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
                  <RadialGradient c={vec(KEYS_POS.audience, -600)} r={3000} colors={['#5a5d66', '#2c2e34', '#17181c']} />
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
