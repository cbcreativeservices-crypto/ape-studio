/**
 * TurntableTop — a direct-drive DJ turntable seen from above, AUTHORED IN
 * MILLIMETRES (453 × 353, geometry/boothGeometry.TT; class dimensions:
 * platter Ø 332 mm, 12-inch record Ø 302 mm, a tonearm of 230 mm effective
 * length whose pivot stands 215 mm from the spindle). Generic: no brand
 * likeness.
 *
 * THE ARM is one rigid part (charter §5): an 8.5 mm S-tube from its gimbal
 * to an offset headshell (22°), the counterweight on the stub behind the
 * pivot; it only ever ROTATES about the pivot. At rest it lies in its rest
 * clip; playing, the stylus rides the groove from the lead-in toward the
 * run-out as the track plays (the angle solved from the arm's true length,
 * per frame, from the one clock). The cue lever stands on its own base.
 *
 * THE STROBE: a real strobe lamp lights whenever the deck is powered, and
 * under it the rim's dots stand STILL at exactly 33⅓ rpm and drift slowly in
 * proportion to the pitch offset — the stroboscopic truth, drawn as the eye
 * sees it (at true speed 90 dots would only alias on a 60 Hz screen).
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, SweepGradient, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { DeckState } from '../model/djModel';
import { trackSeconds } from '../engine/djMusic';
import { TT, TT_D, TT_W } from '../geometry/boothGeometry';
import { ARM_AT_REST, ARM_HALOS, AX, COLLAR, L, TUBE, armAngleAt, turntablePartBox, type TurntablePart } from '../geometry/armGeometry';

export * from '../geometry/armGeometry';
import { INK } from './ink';
import { Fader, Halo, Key } from './parts';
import { useDeckPos, useMotion } from './motion';
import { SceneText } from './sceneText';

const LEG = 4;

export const TurntableTop = memo(function TurntableTop({ x, y, d, playing, highlight = [], showRecord = true, powered = true, slipmat = true, record = 'music' }: { x: number; y: number; d: DeckState; playing: boolean; highlight?: readonly TurntablePart[]; showRecord?: boolean; powered?: boolean; /** Stage 2 (additive): the felt slipmat under the record. */ slipmat?: boolean; /** Stage 2 (additive): a DVS CONTROL record (white vinyl, black label) instead of music. */ record?: 'music' | 'control' }) {
  const P = TT.platter;
  const R = P.d / 2;
  const rr = TT.record.d / 2;
  const { clock } = useMotion();
  // the platter and record turn at the TRUE 33⅓ rpm × the pitch rate
  const rate = 1 + d.pitch / 100;
  const at = d.at;
  const base = (d.posSec / 60) * (100 / 3) * 2 * Math.PI;
  const spinning = playing && !!d.track;
  const spin = useDerivedValue(() => {
    const dt = spinning ? Math.max(0, clock.value - at) : 0;
    return [{ rotate: base + (dt * rate * (100 / 3) * 2 * Math.PI) / 60 }];
  });
  // the strobe dots as the eye sees them under the lamp: still at 0 %,
  // drifting by the pitch offset alone
  const drift = useDerivedValue(() => {
    const dt = spinning ? Math.max(0, clock.value - at) : 0;
    return [{ rotate: (dt * (rate - 1) * (100 / 3) * 2 * Math.PI) / 60 }];
  });
  // the arm: rest, or riding the groove as the track plays
  const pos = useDeckPos({ ...d, playing: spinning });
  const total = d.track ? trackSeconds(d.track) : 1;
  const armXf = useDerivedValue(() => [{ rotate: armAngleAt(pos.value, total, spinning) }]);
  const grooves = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let r = TT.record.label / 2 + 6; r < rr - 3; r += 1.6) p.addCircle(P.cx, P.cy, r);
    return p.detach();
  }, [P.cx, P.cy, rr]);
  const bands = useMemo(() => {
    // the gaps between tracks: slightly wider, darker rings
    const p = Skia.PathBuilder.Make();
    for (const r of [rr - 30, rr - 64, rr - 92]) p.addCircle(P.cx, P.cy, r);
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
  const labelPrint = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addArc(Skia.XYWHRect(P.cx - 34, P.cy - 34, 68, 68), 205, 130);
    return p.detach();
  }, [P.cx, P.cy]);
  const labelPrintSmall = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addArc(Skia.XYWHRect(P.cx - 28, P.cy - 28, 56, 56), 35, 50);
    p.addArc(Skia.XYWHRect(P.cx - 28, P.cy - 28, 56, 56), 100, 45);
    return p.detach();
  }, [P.cx, P.cy]);
  const sideMarks = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.moveTo(P.cx + Math.cos(a) * 38, P.cy + Math.sin(a) * 38);
      p.lineTo(P.cx + Math.cos(a) * 46, P.cy + Math.sin(a) * 46);
    }
    return p.detach();
  }, [P.cx, P.cy]);
  const leadIn = useMemo(() => {
    // a printed arrow in the lead-in band, along the direction of play
    const p = Skia.PathBuilder.Make();
    const r0 = rr - 9;
    const a0 = -Math.PI * 0.62;
    const pt = (r: number, a: number) => [P.cx + Math.cos(a) * r, P.cy + Math.sin(a) * r] as const;
    const [x1, y1] = pt(r0, a0);
    const [x2, y2] = pt(r0 + 4.5, a0 - 0.1);
    const [x3, y3] = pt(r0 - 4.5, a0 - 0.1);
    p.moveTo(x1, y1);
    p.lineTo(x2, y2);
    p.lineTo(x3, y3);
    p.close();
    return p.detach();
  }, [P.cx, P.cy, rr]);
  const knurl = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const pv = TT.armPivot;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      p.moveTo(pv.x + Math.cos(a) * 15, pv.y + Math.sin(a) * 15);
      p.lineTo(pv.x + Math.cos(a) * 19, pv.y + Math.sin(a) * 19);
    }
    return p.detach();
  }, []);
  const tube = useMemo((): SkPath => {
    const p = Skia.PathBuilder.Make();
    const { p0, p1, p2, p3 } = TUBE;
    p.moveTo(p0.x, p0.y);
    p.cubicTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    return p.detach();
  }, []);
  const headshell = useMemo((): SkPath => {
    // the headshell plate in its own axis: from the collar to the front,
    // 18 mm wide, tapering to the finger lift
    const p = Skia.PathBuilder.Make();
    const nx = AX.y;
    const ny = -AX.x;
    const P0 = { x: COLLAR.x, y: COLLAR.y };
    const P1 = { x: COLLAR.x + 44 * AX.x, y: COLLAR.y + 44 * AX.y };
    const w0 = 5;
    const w1 = 9;
    p.moveTo(P0.x + nx * w0, P0.y + ny * w0);
    p.lineTo(P1.x + nx * w1, P1.y + ny * w1);
    p.lineTo(P1.x - nx * w1, P1.y - ny * w1);
    p.lineTo(P0.x - nx * w0, P0.y - ny * w0);
    p.close();
    return p.detach();
  }, []);
  const cart = useMemo((): SkPath => {
    const p = Skia.PathBuilder.Make();
    const nx = AX.y;
    const ny = -AX.x;
    const c = { x: COLLAR.x + 30 * AX.x, y: COLLAR.y + 30 * AX.y };
    const hw = 8;
    const hl = 9;
    p.moveTo(c.x + nx * hw - AX.x * hl, c.y + ny * hw - AX.y * hl);
    p.lineTo(c.x + nx * hw + AX.x * hl, c.y + ny * hw + AX.y * hl);
    p.lineTo(c.x - nx * hw + AX.x * hl, c.y - ny * hw + AX.y * hl);
    p.lineTo(c.x - nx * hw - AX.x * hl, c.y - ny * hw - AX.y * hl);
    p.close();
    return p.detach();
  }, []);
  const lift = useMemo(() => {
    // the finger lift: out of the headshell's right side, curling up
    const p = Skia.PathBuilder.Make();
    const nx = AX.y;
    const ny = -AX.x;
    const b = { x: COLLAR.x + 40 * AX.x + nx * 8.5, y: COLLAR.y + 40 * AX.y + ny * 8.5 };
    p.moveTo(b.x, b.y);
    p.quadTo(b.x + nx * 8, b.y + ny * 8, b.x + nx * 13 - AX.x * 3, b.y + ny * 13 - AX.y * 3);
    return p.detach();
  }, []);
  const sweep = ['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)'];
  const sweepPos = [0, 0.12, 0.26, 0.5, 0.62, 0.76, 1];
  const restPt = ARM_AT_REST.rest;
  const cwY = -TT.arm.stub + 12;
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
      {/* platter: machined aluminium, its strobe dots on the rim */}
      <Circle cx={P.cx + 3} cy={P.cy + 5} r={R + 1} color="rgba(0,0,0,0.65)">
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={P.cx} cy={P.cy} r={R}>
        <SweepGradient c={vec(P.cx, P.cy)} colors={['#a3a9b2', '#dadee4', '#868c95', '#cdd2d8', '#9097a0', '#e1e5ea', '#a3a9b2']} />
      </Circle>
      <Group origin={vec(P.cx, P.cy)} transform={drift}>
        <Path path={strobe} color="#3a3e45" />
      </Group>
      {powered ? (
        // the lamp's warm light falls on the dots nearest it
        <Circle cx={TT.strobe.cx + 10} cy={TT.strobe.cy - 3} r={12} color="rgba(255,122,74,0.12)">
          <BlurMask blur={5} style="normal" />
        </Circle>
      ) : null}
      <Circle cx={P.cx} cy={P.cy} r={R - 9} color="#1a1b1e" />
      {/* slipmat + record, turning together */}
      <Group origin={vec(P.cx, P.cy)} transform={spin}>
        {slipmat ? <Circle cx={P.cx} cy={P.cy} r={rr + 1.5} color={INK.slipmat} /> : null}
        {showRecord && record === 'control' ? (
          <Group>
            <Circle cx={P.cx} cy={P.cy} r={rr}>
              <RadialGradient c={vec(P.cx, P.cy)} r={rr} colors={['#c9ccd2', '#e4e6ea', '#b9bdc6']} positions={[0.35, 0.8, 1]} />
            </Circle>
            {/* the timecode grooves, dark enough to read at 1× (visual review 2 #12) */}
            <Path path={grooves} style="stroke" strokeWidth={0.5} color="rgba(0,0,0,0.18)" />
            <Circle cx={P.cx} cy={P.cy} r={rr - 2} style="stroke" strokeWidth={1.2} color="rgba(0,0,0,0.3)" />
            {/* the printed lead-in arrow on the vinyl, pointing the way it plays */}
            <Path path={leadIn} color="rgba(0,0,0,0.55)" />
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2} color="#121316" />
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2 - 5} style="stroke" strokeWidth={1.4} color="#d9dbe0" opacity={0.8} />
            <Path path={labelPrint} style="stroke" strokeWidth={3.2} color="#d9dbe0" opacity={0.7} strokeCap="round" />
            {/* the label's printed side marks (every 45°) */}
            <Path path={sideMarks} style="stroke" strokeWidth={1.6} color="#d9dbe0" opacity={0.85} />
            <Circle cx={P.cx} cy={P.cy} r={9} color="#2a2c31" />
          </Group>
        ) : showRecord ? (
          <Group>
            <Circle cx={P.cx} cy={P.cy} r={rr}>
              <RadialGradient c={vec(P.cx, P.cy)} r={rr} colors={['#0a0a0c', '#121216', '#0a0a0c']} positions={[0.35, 0.8, 1]} />
            </Circle>
            <Path path={grooves} style="stroke" strokeWidth={0.35} color="rgba(255,255,255,0.10)" />
            <Path path={bands} style="stroke" strokeWidth={1.6} color="#050506" />
            {/* the run-out and the lead-in */}
            <Circle cx={P.cx} cy={P.cy} r={rr - 2} style="stroke" strokeWidth={1.2} color="#050506" />
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2 + 5} style="stroke" strokeWidth={4} color="#08080a" />
            {/* label: paper, a printed ring and two lines of print along the curve */}
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2}>
              <RadialGradient c={vec(P.cx - 12, P.cy - 14)} r={TT.record.label * 0.7} colors={['#ffd36b', '#e0a028']} />
            </Circle>
            <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2 - 4} style="stroke" strokeWidth={0.8} color="#7a5208" opacity={0.7} />
            <Path path={labelPrint} style="stroke" strokeWidth={3.2} color="#5a3a06" opacity={0.75} strokeCap="round" />
            <Path path={labelPrintSmall} style="stroke" strokeWidth={2} color="#5a3a06" opacity={0.6} strokeCap="round" />
            <Circle cx={P.cx} cy={P.cy} r={9} color="#f2c254" />
          </Group>
        ) : null}
      </Group>
      {/* the vinyl's sheen stays put (it is the light, not the record): two
          soft conic bands, upper left and lower right */}
      {showRecord ? (
        <Group>
          {/* one conic pass, turned by a transform (start/end angles past 360°
              left a hard seam on the web renderer — visual review 2 #24) */}
          <Group origin={vec(P.cx, P.cy)} transform={[{ rotate: (150 * Math.PI) / 180 }]}>
            <Circle cx={P.cx} cy={P.cy} r={rr - 1}>
              <SweepGradient c={vec(P.cx, P.cy)} colors={sweep} positions={sweepPos} />
            </Circle>
          </Group>
          <Circle cx={P.cx} cy={P.cy} r={TT.record.label / 2}>
            <RadialGradient c={vec(P.cx - 18, P.cy - 20)} r={TT.record.label * 0.6} colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']} />
          </Circle>
        </Group>
      ) : null}
      {/* spindle */}
      <Circle cx={P.cx} cy={P.cy} r={3.6}>
        <RadialGradient c={vec(P.cx - 1, P.cy - 1)} r={4} colors={[INK.metalHi, INK.metalLo]} />
      </Circle>
      {/* target light (pop-up) and the strobe lamp: lit whenever powered */}
      <Circle cx={TT.targetLight.x} cy={TT.targetLight.y} r={7} color="#0a0b0d" />
      <Circle cx={TT.targetLight.x} cy={TT.targetLight.y} r={4.5}>
        <RadialGradient c={vec(TT.targetLight.x - 1, TT.targetLight.y - 1)} r={5} colors={['#dfe3e8', '#6c727b']} />
      </Circle>
      <Circle cx={TT.strobe.cx} cy={TT.strobe.cy} r={8} color="#08090a" />
      {powered ? (
        <Circle cx={TT.strobe.cx} cy={TT.strobe.cy} r={6} color="#ff7a4a" opacity={0.5}>
          <BlurMask blur={2.5} style="normal" />
        </Circle>
      ) : null}
      <Circle cx={TT.strobe.cx} cy={TT.strobe.cy} r={5} color={powered ? '#ff7a4a' : '#3a2018'} />
      <Circle cx={TT.strobe.cx - 1.4} cy={TT.strobe.cy - 1.6} r={1.6} color="rgba(255,255,255,0.4)" />
      {/* the tonearm base: plate, knurled height ring, gimbal housing; the anti-skate dial beside it */}
      <Circle cx={TT.armPivot.x + 2} cy={TT.armPivot.y + 3} r={27} color="rgba(0,0,0,0.6)">
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={TT.armPivot.x} cy={TT.armPivot.y} r={26}>
        <RadialGradient c={vec(TT.armPivot.x - 8, TT.armPivot.y - 9)} r={32} colors={['#3e4148', '#16171a']} />
      </Circle>
      <Circle cx={TT.armPivot.x} cy={TT.armPivot.y} r={19}>
        <RadialGradient c={vec(TT.armPivot.x - 6, TT.armPivot.y - 6)} r={24} colors={['#c9ced5', '#6f757e', '#3a3e45']} />
      </Circle>
      <Path path={knurl} style="stroke" strokeWidth={0.8} color="rgba(0,0,0,0.45)" />
      <Circle cx={TT.armPivot.x + 26} cy={TT.armPivot.y + 36} r={7}>
        <RadialGradient c={vec(TT.armPivot.x + 24, TT.armPivot.y + 34)} r={9} colors={['#4a4e56', '#141518']} />
      </Circle>
      <Line p1={vec(TT.armPivot.x + 26, TT.armPivot.y + 36)} p2={vec(TT.armPivot.x + 26, TT.armPivot.y + 30)} color={INK.white} strokeWidth={1.2} strokeCap="round" />
      {/* the arm rest: a post with its clip (the tube sits in it at rest) */}
      <Circle cx={restPt.x + 1} cy={restPt.y + 3} r={8} color="rgba(0,0,0,0.55)">
        <BlurMask blur={2.5} style="normal" />
      </Circle>
      <Circle cx={restPt.x} cy={restPt.y} r={7} color="#0b0c0e" />
      <Circle cx={restPt.x} cy={restPt.y} r={5.4}>
        <RadialGradient c={vec(restPt.x - 2, restPt.y - 2)} r={7} colors={['#3a3d44', '#141518']} />
      </Circle>
      {/* the cue lever on its own base */}
      <Circle cx={TT.lift.x + 1} cy={TT.lift.y + 2.5} r={8} color="rgba(0,0,0,0.5)">
        <BlurMask blur={2} style="normal" />
      </Circle>
      <Circle cx={TT.lift.x} cy={TT.lift.y} r={7.5}>
        <RadialGradient c={vec(TT.lift.x - 2, TT.lift.y - 2)} r={9} colors={['#c9ced5', '#4a4f57']} />
      </Circle>
      <Line p1={vec(TT.lift.x, TT.lift.y)} p2={vec(TT.lift.x - 4, TT.lift.y + 20)} color="#0b0c0e" strokeWidth={5} strokeCap="round" />
      <Line p1={vec(TT.lift.x, TT.lift.y)} p2={vec(TT.lift.x - 4, TT.lift.y + 20)} color="#9aa0a8" strokeWidth={3.4} strokeCap="round" />
      {/* THE ARM — one rigid part, turned about the pivot */}
      <Group transform={[{ translateX: TT.armPivot.x }, { translateY: TT.armPivot.y }]}>
        <Group transform={armXf}>
          {/* its shadow on the plinth / record */}
          <Group transform={[{ translateX: 3 }, { translateY: 5 }]}>
            <Path path={tube} style="stroke" strokeWidth={TT.arm.tube + 1} color="rgba(0,0,0,0.5)" strokeCap="round">
              <BlurMask blur={2.5} style="normal" />
            </Path>
            <Path path={headshell} color="rgba(0,0,0,0.5)">
              <BlurMask blur={2.5} style="normal" />
            </Path>
          </Group>
          {/* stub and counterweight behind the pivot */}
          <Line p1={vec(0, 0)} p2={vec(0, -TT.arm.stub)} color="#0b0c0e" strokeWidth={7} strokeCap="round" />
          <Line p1={vec(0, 0)} p2={vec(0, -TT.arm.stub)} color="#b9bec6" strokeWidth={5} strokeCap="round" />
          <RoundedRect x={-13} y={cwY - 16} width={26} height={30} r={7}>
            <LinearGradient start={vec(-13, 0)} end={vec(13, 0)} colors={['#5c626b', '#e1e5ea', '#8a9099', '#3a3e45']} positions={[0, 0.35, 0.65, 1]} />
          </RoundedRect>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Line key={i} p1={vec(-13, cwY - 12 + i * 4.4)} p2={vec(13, cwY - 12 + i * 4.4)} color="rgba(0,0,0,0.28)" strokeWidth={0.6} />
          ))}
          <RoundedRect x={-13} y={cwY - 16} width={26} height={30} r={7} style="stroke" strokeWidth={0.6} color="rgba(0,0,0,0.5)" />
          {/* the gimbal housing over the pivot */}
          <Circle cx={0} cy={0} r={12}>
            <RadialGradient c={vec(-4, -4)} r={15} colors={['#e6e9ee', '#8a9099', '#4a4f57']} />
          </Circle>
          <Circle cx={-4} cy={-4} r={3} color="rgba(255,255,255,0.55)">
            <BlurMask blur={2} style="normal" />
          </Circle>
          {/* the S-tube: a round 8.5 mm tube, lit along its upper-left side */}
          <Path path={tube} style="stroke" strokeWidth={TT.arm.tube + 1.4} color="#141518" strokeCap="round" />
          <Path path={tube} style="stroke" strokeWidth={TT.arm.tube} color="#aab0b8" strokeCap="round" />
          <Path path={tube} style="stroke" strokeWidth={TT.arm.tube * 0.45} color="#d8dce2" strokeCap="round" transform={[{ translateX: -1.2 }, { translateY: -0.6 }]} />
          <Path path={tube} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.85)" strokeCap="round" transform={[{ translateX: -1.8 }, { translateY: -0.9 }]} />
          {/* headshell, cartridge, finger lift, stylus */}
          <Path path={headshell}>
            <LinearGradient start={vec(COLLAR.x - 10, COLLAR.y)} end={vec(COLLAR.x + 10, COLLAR.y + 40)} colors={['#5a5f68', '#a3a9b2', '#2a2c31']} />
          </Path>
          <Path path={headshell} style="stroke" strokeWidth={0.6} color="rgba(0,0,0,0.6)" />
          <Path path={cart} color="#141518" />
          <Path path={cart} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.18)" />
          <Path path={lift} style="stroke" strokeWidth={2.6} color="#0b0c0e" strokeCap="round" />
          <Path path={lift} style="stroke" strokeWidth={1.8} color="#c9ced5" strokeCap="round" />
          <Circle cx={0} cy={L} r={1.5} color={INK.amber} />
        </Group>
      </Group>
      {/* controls */}
      <Key x={TT.startStop.x} y={TT.startStop.y} w={TT.startStop.w} h={TT.startStop.h} lit={playing} colour={INK.green} />
      <Key x={TT.speed33.x} y={TT.speed33.y} w={TT.speed33.w} h={TT.speed33.h} lit={powered} colour={INK.amber} />
      <Key x={TT.speed45.x} y={TT.speed45.y} w={TT.speed45.w} h={TT.speed45.h} />
      <SceneText x={TT.startStop.x + TT.startStop.w / 2} y={TT.startStop.y + TT.startStop.h / 2 + 1.5} size={LEG} text="START" color={INK.print} face="label" align="center" />
      <SceneText x={TT.startStop.x + TT.startStop.w / 2} y={TT.startStop.y - 3} size={3.4} text="START / STOP" color={INK.printDim} face="label" align="center" />
      <SceneText x={TT.speed33.x + TT.speed33.w / 2} y={TT.speed33.y + TT.speed33.h / 2 + 1.5} size={LEG} text="33" color={INK.print} face="label" align="center" />
      <SceneText x={TT.speed45.x + TT.speed45.w / 2} y={TT.speed45.y + TT.speed45.h / 2 + 1.5} size={LEG} text="45" color={INK.print} face="label" align="center" />
      <Fader x={TT.pitch.x} y={TT.pitch.top} len={TT.pitch.len} value={1 - (d.pitch + 8) / 16} capW={TT.pitch.capW} capL={TT.pitch.capL} ticks={9} accent={Math.abs(d.pitch) < 0.05 ? INK.green : INK.white} />
      <SceneText x={TT.pitch.x} y={TT.pitch.top - 9} size={LEG} text="PITCH" color={INK.print} face="label" align="center" />
      <SceneText x={TT.pitch.x - 12} y={TT.pitch.top + 2} size={LEG} text="−" color={INK.printDim} face="label" align="right" />
      <SceneText x={TT.pitch.x - 12} y={TT.pitch.top + TT.pitch.len + 2} size={LEG} text="+" color={INK.printDim} face="label" align="right" />
      {highlight
        .filter((h) => !ARM_HALOS.includes(h))
        .map((h) => {
          const b = turntablePartBox(h);
          return <Halo key={h} b={b} round={b.round} />;
        })}
      {/* the arm's own halos ride the arm's transform (the same one the
          drawing uses), so they stay on the headshell and the counterweight
          wherever the arm has swung */}
      <Group transform={[{ translateX: TT.armPivot.x }, { translateY: TT.armPivot.y }]}>
        <Group transform={armXf}>
          {highlight
            .filter((h) => ARM_HALOS.includes(h))
            .map((h) => {
              const b = turntablePartBox(h, 0);
              return <Halo key={h} b={{ x: b.x - TT.armPivot.x, y: b.y - TT.armPivot.y, w: b.w, h: b.h }} round={b.round} />;
            })}
        </Group>
      </Group>
    </Group>
  );
});
