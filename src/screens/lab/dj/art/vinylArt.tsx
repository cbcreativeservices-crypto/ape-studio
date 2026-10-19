/**
 * vinylArt — Screen 17's detail drawings (screen points), each drawn from
 * the turntable's model (model/djVinyl) and the booth's state:
 *
 *   ArmSide    the tonearm in SIDE ELEVATION: pillar, arm tube, headshell
 *              and cartridge, the counterweight with its dial ring. Lifted
 *              for balancing, the arm tilts by its true imbalance and FLOATS
 *              level at 0 g; lowered, the stylus rests in the groove. The
 *              dial's reading and — with the stylus scale under the needle —
 *              the TRUE force, side by side. The anti-skate dial beside it.
 *   PhonoChain the cartridge's tiny signal through the turntable's own
 *              preamp (or not) and the mixer input class, counting the phono
 *              stages (one is right; none is thin and quiet; two is boomy
 *              and distorted), over the RIAA playback curve the stage
 *              applies (engine/djDsp.RIAA_PLAYBACK — the same curve the
 *              audio runs through).
 *   RoomView   the booth in side view: the table, the turntable on its feet
 *              (or isolation feet), the booth monitor near or far, and the
 *              acoustic loop drawn as a dashed path with its loop gain.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { SceneText } from './sceneText';
import { biquadMag, linToDb, RIAA_PLAYBACK } from '../engine/djDsp';
import { FORCE_RANGE, dialReads, floatTilt, isBalanced, trueForce, type VinylState } from '../model/djVinyl';
import type { Box } from '../geometry/boothGeometry';

function Frame({ b, title, k, right, rightTint }: { b: Box; title: string; k: number; right?: string; rightTint?: string }) {
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={9.5 * k} text={title} color={INK.amber} face="label" minPt={9.5} />
      {right ? <SceneText x={b.x + b.w - 8} y={b.y + 13 * k} size={9.5 * k} text={right} color={rightTint ?? INK.print} face="label" align="right" minPt={9.5} /> : null}
    </Group>
  );
}

/* ── the arm, side elevation ─────────────────────────────────────────── */

export function ArmSide({ b, v, k = 1 }: { b: Box; v: VinylState; k?: number }) {
  const fs = 9.5 * k;
  const plinth = b.y + b.h * 0.8;
  const recTop = plinth - b.h * 0.1;
  const px = b.x + b.w * 0.74;
  const py = plinth - b.h * 0.36;
  const La = b.w * 0.56;
  const Lc = b.w * 0.12;
  // the arm's angle: lifted, it floats by its imbalance; lowered, the stylus
  // sits on the record
  const rest = Math.asin(Math.max(-0.9, Math.min(0.9, (recTop - 6 * k - py) / La)));
  const ang = v.armUp ? Math.min(rest, floatTilt(v) * 1.6) : rest;
  const tip = { x: px - La * Math.cos(ang), y: py + La * Math.sin(ang) };
  const cw = { x: px + Lc * Math.cos(ang), y: py - Lc * Math.sin(ang) };
  const F = trueForce(v);
  const balanced = v.armUp && isBalanced(v);
  const dial = dialReads(v);
  return (
    <Group>
      <Frame b={b} title="TONEARM · SIDE VIEW" k={k} right={v.armUp ? (balanced ? 'FLOATS LEVEL: BALANCED' : F > 0 ? 'FRONT DIPS' : 'TAIL HEAVY') : 'ON THE RECORD'} rightTint={v.armUp ? (balanced ? INK.green : INK.amber) : INK.print} />
      {/* plinth, platter and record */}
      <Rect3 x={b.x + 8} y={plinth} w={b.w - 16} h={b.h * 0.12} c0="#2e3036" c1="#121316" />
      <Rect3 x={b.x + b.w * 0.06} y={plinth - b.h * 0.07} w={b.w * 0.6} h={b.h * 0.07} c0="#dfe3e8" c1="#7d838c" />
      <Rect3 x={b.x + b.w * 0.08} y={recTop - 1} w={b.w * 0.56} h={b.h * 0.03 + 1} c0="#26272c" c1="#08080a" />
      {/* the pillar and the anti-skate dial */}
      <Rect3 x={px - 8 * k} y={py} w={16 * k} h={plinth - py} c0="#c9ced5" c1="#4a4f57" />
      <Circle cx={px + 26 * k} cy={plinth - 8 * k} r={8 * k}>
        <LinearGradientCircle cx={px + 26 * k} cy={plinth - 8 * k} r={8 * k} />
      </Circle>
      <SceneText x={px + 26 * k} y={plinth - 20 * k} size={fs} text={`A-S ${v.antiSkate.toFixed(1)}`} color={INK.print} face="mono" align="center" minPt={9.5} />
      {/* the arm: tube, headshell + cartridge, counterweight with its ring */}
      <Group origin={vec(px, py)} transform={[{ rotate: -ang }]}>
        <Line p1={vec(px - La, py)} p2={vec(px + Lc * 0.6, py)} color="#141518" strokeWidth={7 * k} strokeCap="round" />
        <Line p1={vec(px - La, py)} p2={vec(px + Lc * 0.6, py)} color="#b9bec6" strokeWidth={5 * k} strokeCap="round" />
        <Line p1={vec(px - La, py - 1.2 * k)} p2={vec(px + Lc * 0.6, py - 1.2 * k)} color="rgba(255,255,255,0.6)" strokeWidth={1 * k} />
        <RoundedRect x={px - La - 22 * k} y={py - 4 * k} width={30 * k} height={8 * k} r={2} color="#8a9099" />
        <RoundedRect x={px - La - 18 * k} y={py + 3 * k} width={18 * k} height={9 * k} r={2} color="#16171a" />
        <Line p1={vec(px - La - 12 * k, py + 12 * k)} p2={vec(px - La - 13 * k, py + 16 * k)} color={INK.amber} strokeWidth={1.2 * k} />
        <RoundedRect x={px + Lc - 10 * k} y={py - 13 * k} width={24 * k} height={26 * k} r={5 * k}>
          <LinearGradient start={vec(0, py - 13 * k)} end={vec(0, py + 13 * k)} colors={['#e1e5ea', '#8a9099', '#3a3e45']} />
        </RoundedRect>
        <RoundedRect x={px + Lc - 13 * k} y={py - 14 * k} width={5 * k} height={28 * k} r={2} color="#141518" />
        <Pivot x={px} y={py} k={k} />
      </Group>
      {/* the readings */}
      <SceneText x={cw.x} y={cw.y - 22 * k} size={11 * k} text={`DIAL ${dial.toFixed(1)} g`} color={INK.white} face="mono" align="center" minPt={9.5} />
      {v.scale && !v.armUp ? (
        <Group>
          <RoundedRect x={tip.x - 26 * k} y={recTop - 2} width={52 * k} height={b.h * 0.1} r={3} color="#0b0c0f" />
          <RoundedRect x={tip.x - 22 * k} y={recTop + 1} width={44 * k} height={b.h * 0.07} r={2} color="#0f2233" />
          <SceneText x={tip.x} y={recTop + b.h * 0.07 - 1} size={10.5 * k} text={`${Math.max(0, F).toFixed(1)} g`} color={F >= FORCE_RANGE.min - 0.05 && F <= FORCE_RANGE.max + 0.05 ? INK.green : '#ff8a7e'} face="mono" align="center" minPt={9.5} />
          <SceneText x={tip.x} y={b.y + b.h - 4} size={fs} text="STYLUS SCALE" color={INK.printDim} face="label" align="center" minPt={9.5} />
        </Group>
      ) : (
        <SceneText x={b.x + 10} y={b.y + b.h - 4} size={fs} text={`THIS CARTRIDGE: ${FORCE_RANGE.min}–${FORCE_RANGE.max} g`} color={INK.printDim} face="label" minPt={9.5} />
      )}
    </Group>
  );
}

function Rect3({ x, y, w, h, c0, c1 }: { x: number; y: number; w: number; h: number; c0: string; c1: string }) {
  return (
    <RoundedRect x={x} y={y} width={w} height={h} r={Math.min(3, h / 3)}>
      <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={[c0, c1]} />
    </RoundedRect>
  );
}
function LinearGradientCircle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#4a4e56', '#141518']} />;
}
function Pivot({ x, y, k }: { x: number; y: number; k: number }) {
  return (
    <Group>
      <Circle cx={x} cy={y} r={7 * k} color="#0b0c0e" />
      <Circle cx={x} cy={y} r={5.5 * k} color="#c9ced5" />
      <Circle cx={x - 1.5 * k} cy={y - 1.5 * k} r={1.6 * k} color="rgba(255,255,255,0.7)" />
    </Group>
  );
}

/* ── the phono chain and the RIAA curve ──────────────────────────────── */

export type PhonoCount = 0 | 1 | 2;

export function PhonoChain({ b, preamp, input, count, k = 1 }: { b: Box; preamp: 'PHONO' | 'LINE'; input: 'LINE' | 'PHONO' | 'USB'; count: PhonoCount; k?: number }) {
  const fs = 9.5 * k;
  const verdict = count === 1 ? 'ONE PHONO STAGE: RIGHT' : count === 0 ? 'NO PHONO STAGE — THIN, QUIET' : 'TWO PHONO STAGES — BOOMY, DISTORTED';
  const tint = count === 1 ? INK.green : '#ff8a7e';
  const rowY = b.y + 26 * k;
  const bh = 30 * k;
  const gap = 8;
  const bw = (b.w - 16 - gap * 3) / 4;
  const box = (i: number, title: string, sub: string, lit: boolean, bad = false) => {
    const x = b.x + 8 + i * (bw + gap);
    return (
      <Group key={title}>
        <RoundedRect x={x} y={rowY} width={bw} height={bh} r={5} color={lit ? '#101a28' : '#121317'} />
        <RoundedRect x={x} y={rowY} width={bw} height={bh} r={5} style="stroke" strokeWidth={1} color={bad ? '#ff8a7e' : lit ? INK.blue : 'rgba(255,255,255,0.2)'} />
        <SceneText x={x + bw / 2} y={rowY + 12.5 * k} size={fs} text={title} color={INK.white} face="label" align="center" minPt={9.5} />
        <SceneText x={x + bw / 2} y={rowY + 25 * k} size={fs} text={sub} color={bad ? '#ff8a7e' : lit ? INK.blue : INK.printDim} face="label" align="center" minPt={9.5} />
        {i < 3 ? <Line p1={vec(x + bw, rowY + bh / 2)} p2={vec(x + bw + gap, rowY + bh / 2)} color={INK.blue} strokeWidth={1.4} /> : null}
      </Group>
    );
  };
  // the RIAA playback curve, 20 Hz – 20 kHz
  const plot = { x: b.x + 34 * k, y: rowY + bh + 30 * k, w: b.w - 46 * k, h: b.h - (rowY - b.y) - bh - 44 * k };
  const fx = (f: number) => plot.x + (Math.log(f / 20) / Math.log(1000)) * plot.w;
  const fy = (db: number) => plot.y + ((22 - Math.max(-22, Math.min(22, db))) / 44) * plot.h;
  const curve = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i <= 120; i++) {
      const f = 20 * Math.pow(1000, i / 120);
      const db = linToDb(biquadMag(RIAA_PLAYBACK, f));
      if (i === 0) p.moveTo(fx(f), fy(db));
      else p.lineTo(fx(f), fy(db));
    }
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot.x, plot.y, plot.w, plot.h]);
  return (
    <Group>
      <Frame b={b} title="THE PHONO STAGE" k={k} right={verdict} rightTint={tint} />
      {box(0, 'CARTRIDGE', 'ABOUT 5 mV', true)}
      {box(1, 'TT PREAMP', preamp === 'LINE' ? 'ON (+RIAA)' : 'OFF', preamp === 'LINE')}
      {box(2, 'MIXER IN', input === 'PHONO' ? 'PHONO +RIAA' : input, input === 'PHONO', count === 2)}
      {box(3, 'CHANNEL', count === 1 ? 'LINE LEVEL' : count === 0 ? 'TOO QUIET' : 'OVERLOAD', count === 1, count !== 1)}
      {[-20, -10, 0, 10, 20].map((d) => (
        <Line key={d} p1={vec(plot.x, fy(d))} p2={vec(plot.x + plot.w, fy(d))} color={d === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'} strokeWidth={1} />
      ))}
      <Path path={curve} style="stroke" strokeWidth={4} color={INK.blue} opacity={0.35}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={curve} style="stroke" strokeWidth={2} color={INK.blue} />
      <SceneText x={plot.x - 4} y={fy(20) + 3.5} size={fs} text="+20" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x - 4} y={fy(0) + 3.5} size={fs} text="0" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x - 4} y={fy(-20) + 3.5} size={fs} text="−20" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={fx(20)} y={plot.y + plot.h + 12 * k} size={fs} text="20 Hz" color={INK.printDim} minPt={9.5} />
      <SceneText x={fx(1000)} y={plot.y + plot.h + 12 * k} size={fs} text="1 kHz" color={INK.printDim} align="center" minPt={9.5} />
      <SceneText x={fx(20000)} y={plot.y + plot.h + 12 * k} size={fs} text="20 kHz" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x + 4} y={plot.y - 4} size={fs} text="RIAA PLAYBACK: BASS UP, TREBLE DOWN (dB)" color={INK.print} face="label" minPt={9.5} />
    </Group>
  );
}

/* ── the room: the acoustic loop ─────────────────────────────────────── */

export function RoomView({ b, v, gain, howlDb, k = 1 }: { b: Box; v: VinylState; gain: number; howlDb: number; k?: number }) {
  const fs = 9.5 * k;
  const floor = b.y + b.h - 10 * k;
  const tableTop = b.y + b.h * 0.55;
  const tx0 = b.x + 14;
  const tx1 = b.x + b.w * 0.58;
  const footH = v.feet ? 9 * k : 3 * k;
  const ttY = tableTop - footH - 16 * k;
  const monX = v.monitorNear ? tx1 + 6 * k : b.x + b.w - 52 * k;
  const monW = 40 * k;
  const monH = 56 * k;
  const monTop = v.monitorNear ? tableTop - monH : floor - monH - 50 * k;
  const status = gain >= 1 ? 'HOWL' : gain >= 0.6 ? 'BOOMY' : gain > 0.02 ? 'QUIET' : 'NO LOOP';
  const tint = gain >= 1 ? INK.peak : gain >= 0.6 ? INK.amber : INK.green;
  const loop = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const sx = monX;
    const sy = monTop + monH * 0.45;
    p.moveTo(sx, sy);
    p.quadTo((sx + tx1) / 2, sy - 30 * k, tx1 - 40 * k, ttY - 2);
    return p.detach();
  }, [monX, monTop, monH, tx1, ttY, k]);
  const back = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(tx0 + 40 * k, tableTop + 4);
    p.quadTo(tx0 + 30 * k, floor - 6 * k, (tx0 + monX) / 2, floor - 8 * k);
    p.quadTo(monX - 10 * k, floor - 10 * k, monX + monW / 2, monTop + monH + 2);
    return p.detach();
  }, [tx0, tableTop, floor, monX, monW, monTop, monH, k]);
  return (
    <Group>
      <Frame b={b} title="THE BOOTH · SIDE VIEW" k={k} right={`LOOP x${gain.toFixed(2)} · ${status}`} rightTint={tint} />
      <Line p1={vec(b.x + 6, floor)} p2={vec(b.x + b.w - 6, floor)} color="rgba(255,255,255,0.18)" strokeWidth={1} />
      {/* the table */}
      <Rect3 x={tx0} y={tableTop} w={tx1 - tx0} h={7 * k} c0="#3a3d43" c1="#1a1b1f" />
      <Rect3 x={tx0 + 6} y={tableTop + 7 * k} w={5 * k} h={floor - tableTop - 7 * k} c0="#2a2c31" c1="#16171a" />
      <Rect3 x={tx1 - 11 * k} y={tableTop + 7 * k} w={5 * k} h={floor - tableTop - 7 * k} c0="#2a2c31" c1="#16171a" />
      {/* the turntable on its feet */}
      {[0.12, 0.88].map((f) => (
        <RoundedRect key={f} x={tx0 + 10 + f * (tx1 - tx0 - 40 * k) - 4 * k} y={tableTop - footH} width={10 * k} height={footH} r={2} color={v.feet ? '#5a4a8a' : '#0b0c0e'} />
      ))}
      <Rect3 x={tx0 + 8} y={ttY} w={tx1 - tx0 - 36 * k} h={16 * k} c0="#33363d" c1="#121316" />
      <Rect3 x={tx0 + 16} y={ttY - 4 * k} w={(tx1 - tx0) * 0.6} h={4 * k} c0="#dfe3e8" c1="#7d838c" />
      <SceneText x={(tx0 + tx1) / 2 - 10 * k} y={ttY + 11.5 * k} size={fs} text="TURNTABLE" color={INK.print} face="label" align="center" minPt={9.5} />
      {v.feet ? <SceneText x={tx0 + 10} y={tableTop + 20 * k} size={fs} text="ISOLATION FEET" color="#c9a2ff" face="label" minPt={9.5} /> : null}
      {/* the booth monitor (side), on the table end or on a stand */}
      {!v.monitorNear ? <Rect3 x={monX + monW / 2 - 2 * k} y={monTop + monH} w={4 * k} h={floor - monTop - monH} c0="#4a4e56" c1="#1a1b1f" /> : null}
      <RoundedRect x={monX} y={monTop} width={monW} height={monH} r={4 * k}>
        <LinearGradient start={vec(monX, monTop)} end={vec(monX + monW, monTop + monH)} colors={['#3a3d44', '#1a1b1f', '#0d0e11']} />
      </RoundedRect>
      <RoundedRect x={monX} y={monTop} width={5 * k} height={monH} r={2} color="#5c626b" />
      <SceneText x={monX + monW / 2 + 2 * k} y={monTop + monH - 6 * k} size={fs} text="MONITOR" color={INK.print} face="label" align="center" minPt={9.5} />
      {/* the loop */}
      <Path path={loop} style="stroke" strokeWidth={2.2} color={tint} opacity={gain > 0.02 ? 0.95 : 0.3}>
        <DashPathEffect intervals={[6, 5]} />
      </Path>
      <Path path={back} style="stroke" strokeWidth={1.6} color={INK.blue} opacity={gain > 0.02 ? 0.8 : 0.3} />
      <SceneText x={monX - 6 * k} y={ttY - 12 * k} size={fs} text="SOUND SHAKES THE TABLE" color={tint} face="label" align="right" minPt={9.5} />
      <SceneText x={(tx0 + monX) / 2} y={floor - 12 * k} size={fs} text="STYLUS, MIXER, MONITOR: A LOOP" color={INK.blue} face="label" align="center" minPt={9.5} />
      {howlDb > -60 ? <SceneText x={b.x + 10} y={b.y + 27 * k} size={fs} text={`80 Hz BUILD-UP ${howlDb.toFixed(0)} dBFS (HELD SAFE)`} color={tint} face="label" minPt={9.5} /> : null}
    </Group>
  );
}
