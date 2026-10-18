/**
 * TurntableTop — a direct-drive DJ turntable seen from above, AUTHORED IN
 * MILLIMETRES (453 × 353, geometry/boothGeometry.TT; class dimensions:
 * platter Ø 332 mm, 12-inch record Ø 302 mm, a ~230 mm effective tonearm).
 * Generic: no brand likeness.
 *
 * Parts, as on the real machine: the plinth, the platter with its strobe
 * dots on the rim, the slipmat, the record with its grooves and label, the
 * spindle; the tonearm on its pivot base with the counterweight behind and
 * the headshell and stylus out on the record; the arm rest and cue lever;
 * START/STOP, 33/45, the pitch fader, the target light.
 *
 * When `playing`, the record, the slipmat and the strobe dots turn at the
 * TRUE 33⅓ rpm (× the pitch rate) from the one clock; the label carries a
 * printed mark so the rotation is visible.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, SweepGradient, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { DeckState } from '../model/djModel';
import { TT, TT_D, TT_W } from '../geometry/boothGeometry';
import { INK } from './ink';
import { Fader, Halo, Key } from './parts';
import { useSpinAngle } from './motion';

export type TurntablePart = 'platter' | 'slipmat' | 'tonearm' | 'headshell' | 'counterweight' | 'startStop' | 'speed' | 'pitch';

export function turntablePartBox(p: TurntablePart): { x: number; y: number; w: number; h: number; round?: boolean } {
  const P = TT.platter;
  switch (p) {
    case 'platter': return { x: P.cx - P.d / 2 - 4, y: P.cy - P.d / 2 - 4, w: P.d + 8, h: P.d + 8, round: true };
    case 'slipmat': return { x: P.cx - TT.record.d / 2 - 2, y: P.cy - TT.record.d / 2 - 2, w: TT.record.d + 4, h: TT.record.d + 4, round: true };
    case 'tonearm': return { x: 286, y: 40, w: 132, h: 224 };
    case 'headshell': return { x: TT.stylusPlay.x - 22, y: TT.stylusPlay.y - 22, w: 44, h: 44, round: true };
    case 'counterweight': return { x: TT.counterweight.x - 18, y: TT.counterweight.y - 18, w: 36, h: 36, round: true };
    case 'startStop': return { x: TT.startStop.x - 4, y: TT.startStop.y - 4, w: TT.startStop.w + 8, h: TT.startStop.h + 8 };
    case 'speed': return { x: TT.speed33.x - 4, y: TT.speed33.y - 4, w: TT.speed45.x + TT.speed45.w - TT.speed33.x + 8, h: TT.speed33.h + 8 };
    case 'pitch': return { x: TT.pitch.x - 14, y: TT.pitch.top - 12, w: 28, h: TT.pitch.len + 24 };
  }
}

/** The arm's angle about its pivot (radians, 0 = pointing down the page):
 *  at rest it lies along the rest; playing, the stylus is on the record. */
function armGeometry(playing: boolean) {
  const pv = TT.armPivot;
  const tip = playing ? TT.stylusPlay : TT.armRest;
  const len = Math.hypot(tip.x - pv.x, tip.y - pv.y);
  const ang = Math.atan2(tip.x - pv.x, tip.y - pv.y);
  return { pv, tip, len, ang };
}

export const TurntableTop = memo(function TurntableTop({ x, y, d, playing, highlight = [], showRecord = true }: { x: number; y: number; d: DeckState; playing: boolean; highlight?: readonly TurntablePart[]; showRecord?: boolean }) {
  const P = TT.platter;
  const R = P.d / 2;
  const rr = TT.record.d / 2;
  const spinDeck = useMemo(() => ({ ...d, playing }), [d, playing]);
  const angle = useSpinAngle(spinDeck);
  const spin = useDerivedValue(() => [{ rotate: angle.value }]);
  const grooves = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let r = TT.record.label / 2 + 6; r < rr - 3; r += 2.2) p.addCircle(P.cx, P.cy, r);
    return p.detach();
  }, [P.cx, P.cy, rr]);
  const strobe = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      p.addCircle(P.cx + Math.cos(a) * (R - 4.5), P.cy + Math.sin(a) * (R - 4.5), 1.1);
    }
    return p.detach();
  }, [P.cx, P.cy, R]);
  const sheen = useSheen(P.cx, P.cy, rr);
  const arm = armGeometry(playing);
  const armPath = useMemo((): SkPath => {
    // an S-shaped tube: out from the pivot, a gentle double bend, to the headshell
    const { pv, tip } = arm;
    const p = Skia.PathBuilder.Make();
    const mx = (pv.x + tip.x) / 2;
    const my = (pv.y + tip.y) / 2;
    const nx = -(tip.y - pv.y);
    const ny = tip.x - pv.x;
    const k = 0.09;
    p.moveTo(pv.x, pv.y);
    p.cubicTo(pv.x + (mx - pv.x) * 0.6 + nx * k, pv.y + (my - pv.y) * 0.6 + ny * k, mx - nx * k * 1.2, my - ny * k * 1.2, tip.x - (tip.x - pv.x) * 0.12, tip.y - (tip.y - pv.y) * 0.12);
    return p.detach();
  }, [arm]);
  const head = arm.tip;
  const headAng = Math.atan2(head.x - arm.pv.x, head.y - arm.pv.y);
  const cw = TT.counterweight;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* plinth */}
      <RoundedRect x={6} y={10} width={TT_W} height={TT_D} r={16} color="rgba(0,0,0,0.75)">
        <BlurMask blur={12} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={TT_W} height={TT_D} r={16}>
        <LinearGradient start={vec(0, 0)} end={vec(TT_W, TT_D)} colors={['#2e3036', '#1b1c20', '#101113']} positions={[0, 0.5, 1]} />
      </RoundedRect>
      <RoundedRect x={0.7} y={0.7} width={TT_W - 1.4} height={TT_D - 1.4} r={15.3} style="stroke" strokeWidth={1.4} color={INK.bevel} />
      {/* platter: machined aluminium with its strobe dots */}
      <Circle cx={P.cx + 3} cy={P.cy + 5} r={R + 1} color="rgba(0,0,0,0.65)">
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={P.cx} cy={P.cy} r={R}>
        <SweepGradient c={vec(P.cx, P.cy)} colors={['#a3a9b2', '#dadee4', '#868c95', '#cdd2d8', '#9097a0', '#e1e5ea', '#a3a9b2']} />
      </Circle>
      <Group origin={vec(P.cx, P.cy)} transform={spin}>
        <Path path={strobe} color="#3a3e45" />
      </Group>
      <Circle cx={P.cx} cy={P.cy} r={R - 9} color="#1a1b1e" />
      {/* slipmat + record, turning together */}
      <Group origin={vec(P.cx, P.cy)} transform={spin}>
        <Circle cx={P.cx} cy={P.cy} r={rr + 1.5} color={INK.slipmat} />
        {showRecord ? (
          <Group>
            <Circle cx={P.cx} cy={P.cy} r={rr}>
              <RadialGradient c={vec(P.cx, P.cy)} r={rr} colors={['#0a0a0c', '#121216', '#0a0a0c']} positions={[0.35, 0.8, 1]} />
            </Circle>
            <Path path={grooves} style="stroke" strokeWidth={0.5} color={INK.vinylGroove} />
            {/* the run-out and the lead-in bands */}
            <Circle cx={P.cx} cy={P.cy} r={rr - 2} style="stroke" strokeWidth={1.2} color="#050506" />
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2 + 5} style="stroke" strokeWidth={4} color="#08080a" />
            {/* label */}
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2}>
              <RadialGradient c={vec(P.cx - 12, P.cy - 14)} r={TT.record.label * 0.7} colors={['#ffd36b', '#e0a028']} />
            </Circle>
            <RoundedRect x={P.cx - 26} y={P.cy - 31} width={52} height={10} r={3} color="#3a2a08" opacity={0.75} />
            <RoundedRect x={P.cx - 16} y={P.cy + 20} width={32} height={6} r={2} color="#3a2a08" opacity={0.5} />
          </Group>
        ) : null}
      </Group>
      {/* the vinyl's sheen stays put (it is the light, not the record) */}
      {showRecord ? (
        <Group>
          <Path path={sheen} color="rgba(255,255,255,0.07)" />
        </Group>
      ) : null}
      {/* spindle */}
      <Circle cx={P.cx} cy={P.cy} r={3.6}>
        <RadialGradient c={vec(P.cx - 1, P.cy - 1)} r={4} colors={[INK.metalHi, INK.metalLo]} />
      </Circle>
      {/* target light (pop-up) and strobe light */}
      <Circle cx={TT.targetLight.x} cy={TT.targetLight.y} r={7} color="#0a0b0d" />
      <Circle cx={TT.targetLight.x} cy={TT.targetLight.y} r={4.5}>
        <RadialGradient c={vec(TT.targetLight.x - 1, TT.targetLight.y - 1)} r={5} colors={['#dfe3e8', '#6c727b']} />
      </Circle>
      <Circle cx={TT.strobe.cx} cy={TT.strobe.cy} r={8} color="#08090a" />
      <Circle cx={TT.strobe.cx} cy={TT.strobe.cy} r={5} color={playing ? '#ff7a4a' : '#3a2018'} />
      {/* the tonearm base, the counterweight, the arm and the headshell */}
      <Circle cx={arm.pv.x + 2} cy={arm.pv.y + 3} r={22} color="rgba(0,0,0,0.6)">
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={arm.pv.x} cy={arm.pv.y} r={21}>
        <RadialGradient c={vec(arm.pv.x - 6, arm.pv.y - 7)} r={26} colors={['#4a4e56', '#1a1b1e']} />
      </Circle>
      <Circle cx={arm.pv.x} cy={arm.pv.y} r={13} style="stroke" strokeWidth={1.4} color="rgba(255,255,255,0.12)" />
      {/* counterweight on its stub, behind the pivot */}
      <Line p1={vec(arm.pv.x, arm.pv.y)} p2={vec(cw.x, cw.y)} color="#b9bec6" strokeWidth={5} strokeCap="round" />
      <RoundedRect x={cw.x - 11} y={cw.y - 13} width={22} height={24} r={6}>
        <LinearGradient start={vec(cw.x - 11, 0)} end={vec(cw.x + 11, 0)} colors={['#5c626b', '#d9dde3', '#7d838c']} />
      </RoundedRect>
      {[0, 1, 2, 3, 4].map((i) => (
        <Line key={i} p1={vec(cw.x - 11, cw.y - 9 + i * 4)} p2={vec(cw.x + 11, cw.y - 9 + i * 4)} color="rgba(0,0,0,0.25)" strokeWidth={0.6} />
      ))}
      {/* arm rest + cue lever */}
      <RoundedRect x={TT.armRest.x - 6} y={TT.armRest.y - 6} width={14} height={20} r={3} color="#0b0c0e" />
      <RoundedRect x={TT.armRest.x + 14} y={TT.armRest.y - 40} width={8} height={26} r={3}>
        <LinearGradient start={vec(TT.armRest.x + 14, 0)} end={vec(TT.armRest.x + 22, 0)} colors={['#9aa0a8', '#4c5159']} />
      </RoundedRect>
      <Path path={armPath} style="stroke" strokeWidth={7.5} color="rgba(0,0,0,0.55)" strokeCap="round" />
      <Path path={armPath} style="stroke" strokeWidth={6} color="#c9ced5" strokeCap="round" />
      <Path path={armPath} style="stroke" strokeWidth={1.8} color="rgba(255,255,255,0.65)" strokeCap="round" />
      {/* headshell (with its finger lift) and the cartridge */}
      <Group origin={vec(head.x, head.y)} transform={[{ rotate: -headAng + 0.35 }]}>
        <RoundedRect x={head.x - 8} y={head.y - 26} width={16} height={30} r={3}>
          <LinearGradient start={vec(head.x - 8, 0)} end={vec(head.x + 8, 0)} colors={['#3a3d44', '#9aa0a8', '#2a2c31']} />
        </RoundedRect>
        <RoundedRect x={head.x - 6} y={head.y - 12} width={12} height={16} r={2} color="#16171a" />
        <Line p1={vec(head.x + 8, head.y - 20)} p2={vec(head.x + 20, head.y - 26)} color="#c9ced5" strokeWidth={2.4} strokeCap="round" />
        <Circle cx={head.x} cy={head.y + 2} r={1.6} color={INK.amber} />
      </Group>
      {/* controls */}
      <Key x={TT.startStop.x} y={TT.startStop.y} w={TT.startStop.w} h={TT.startStop.h} lit={playing} colour={INK.green} />
      <Key x={TT.speed33.x} y={TT.speed33.y} w={TT.speed33.w} h={TT.speed33.h} lit colour={INK.amber} />
      <Key x={TT.speed45.x} y={TT.speed45.y} w={TT.speed45.w} h={TT.speed45.h} />
      <Fader x={TT.pitch.x} y={TT.pitch.top} len={TT.pitch.len} value={1 - (d.pitch + 8) / 16} capW={TT.pitch.capW} capL={TT.pitch.capL} ticks={9} accent={Math.abs(d.pitch) < 0.05 ? INK.green : INK.white} />
      {highlight.map((h) => {
        const b = turntablePartBox(h);
        return <Halo key={h} b={b} round={b.round} />;
      })}
    </Group>
  );
});

function useSheen(cx: number, cy: number, r: number): SkPath {
  return useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(cx, cy);
    p.addArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), 200, 28);
    p.lineTo(cx, cy);
    p.close();
    p.moveTo(cx, cy);
    p.addArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), 20, 28);
    p.lineTo(cx, cy);
    p.close();
    return p.detach();
  }, [cx, cy, r]);
}
