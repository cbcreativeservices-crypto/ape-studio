/**
 * vinylArt — Screen 17's detail drawings (screen points), each drawn from
 * the turntable's model (model/djVinyl) and the booth's state, every object a
 * real one at ONE scale per drawing (visual review 2, blockers 1–2, #11):
 *
 *   ArmSide    the tonearm in SIDE ELEVATION, authored in mm: the plinth on
 *              its feet, the platter rim with its strobe dots, the slipmat and
 *              the record; the arm base with its height collar, the gimbal
 *              (ring and yoke), the S-tube's straight run, the headshell with
 *              its finger lift and the cartridge with its cantilever and
 *              stylus; the counterweight as a lit cylinder with its printed
 *              0–4 g ring (read at the pointer line, magnified in a loupe);
 *              the anti-skate knob (knurled); the cue lever; the arm rest and
 *              its clip. PLAYING the tube is PARALLEL to the record (the VTA
 *              reference). LIFTED on the cue lever and swung clear of the
 *              record (the platter drawn aside), the arm tilts about the gimbal by its
 *              own imbalance — front dips (still in the air), tail heavy
 *              rises, level and a green spirit line when balanced. The
 *              stylus scale is a real digital gauge under the stylus, its LCD
 *              reading the true force.
 *   PhonoChain the four-block chain (cartridge → turntable preamp → mixer
 *              input → channel) counting the phono stages, a REAR INSET of
 *              what the learner actually changes — the turntable's PHONO /
 *              LINE switch, its RCA pair and its ground lug, the leads to
 *              the mixer's PHONO or LINE pair and its GND post (a loose spade
 *              hangs off the post, humming) — and the RIAA playback curve
 *              (the analog curve from its three time constants: −19.6 dB at
 *              20 kHz; the audio runs a digital fit of it).
 *   RoomView   the booth in SIDE ELEVATION at one stated scale: a table with
 *              its apron and legs in pairs, the turntable in profile on its
 *              feet (or isolation pucks), the booth monitor in three-quarter
 *              view on a pad on the table or on its own pole stand; the AIR
 *              path drawn as wavefronts from the monitor to the platter
 *              (thicker and brighter with the loop gain), and the ELECTRICAL
 *              path drawn apart as a labelled overlay (stylus → mixer →
 *              monitor).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { RcaSocket } from './parts';
import { SceneText } from './sceneText';
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

/** A box with a vertical form gradient (a lit, rounded solid). */
function Solid({ x, y, w, h, c, r = 0.8 }: { x: number; y: number; w: number; h: number; c: readonly string[]; r?: number }) {
  return (
    <RoundedRect x={x} y={y} width={w} height={h} r={Math.min(r, h / 2, w / 2)}>
      <LinearGradient start={vec(0, y)} end={vec(0, y + h)} colors={c as string[]} />
    </RoundedRect>
  );
}
const METAL = ['#eef1f4', '#b9bec6', '#6c727b', '#3a3e45'] as const;
const GRAPHITE = ['#3a3d44', '#24262b', '#121316'] as const;

/* ── the arm, side elevation ─────────────────────────────────────────── */

/** ArmSide's geometry (mm; x right, y DOWN, the plinth's top at y = 0). */
export const ARM_SIDE = {
  /** The stylus on the record at play; the pivot an effective length behind. */
  stylusX: 34,
  pivotX: 34 + 230,
  /** The record's top surface; the tube's centre line (parallel at play). */
  recTop: -21,
  tubeY: -43,
  L: 230,
} as const;

/** The arm's angle in the side view (radians, + = the FRONT down), and the
 *  stylus tip's height above the record (mm). Pure (tests reach it). */
export function armSidePose(v: Pick<VinylState, 'armUp' | 'weight' | 'scale'>): { angle: number; tipAbove: number; onCue: boolean } {
  const { L } = ARM_SIDE;
  if (v.armUp) {
    // lifted clear on the cue lever and swung off the record (beside the
    // platter), the arm floats free by its own imbalance: the front dips —
    // never down to the plinth — or the tail sinks; level when balanced
    const room = -ARM_SIDE.recTop - 4; // the stylus stays 4 mm over the plinth
    const angle = Math.max(-0.09, Math.min(Math.asin(room / L), floatTilt(v as VinylState) * 0.7));
    return { angle, tipAbove: -Math.sin(angle) * L, onCue: false };
  }
  if (v.scale) {
    // on a stylus gauge: the tip rests on its 8 mm pad
    const a = -Math.asin(8 / L);
    return { angle: a, tipAbove: 8, onCue: false };
  }
  return { angle: 0, tipAbove: 0, onCue: false };
}

export function ArmSide({ b, v, k = 1 }: { b: Box; v: VinylState; k?: number }) {
  const fs = 9.5 * k;
  const S = ARM_SIDE;
  // the drawing's mm box: x −14 … 342, y −62 … 60 (the feet), beside the loupe
  const loupeW = 78 * k;
  const head = 20 * k;
  const foot = 14 * k;
  const mmW = 348;
  const mmH = 122;
  const s = Math.min((b.w - loupeW - 22) / mmW, (b.h - head - foot) / mmH);
  const ox = b.x + 8 + 6 * s;
  // centred in the height left between the title and the footer line
  const oy = b.y + head + Math.max(0, (b.h - head - foot - mmH * s) / 2) + 62 * s;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy + y * s;
  const pose = armSidePose(v);
  const F = trueForce(v);
  const balanced = v.armUp && isBalanced(v);
  const dial = dialReads(v);
  const P = { x: S.pivotX, y: S.tubeY };
  // the cue lever's bar: up under the tube when lifted
  const cueX = P.x - 58;
  const tubeUnder = (x: number) => P.y + 4.25 + Math.sin(pose.angle) * (P.x - x);
  // the bar rests down: lowered at play, and free of the floating arm
  void tubeUnder;
  const barTop = P.y + 12;
  // balancing, the arm is swung clear of the record: the platter is drawn
  // behind it, moved aside
  const platterShift = v.armUp ? -96 : 0;
  const knurl = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i <= 8; i++) {
      const x = -8 + i * 2;
      p.moveTo(x, -26);
      p.lineTo(x, -8);
    }
    return p.detach();
  }, []);
  const asKnurl = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i <= 7; i++) {
      p.moveTo(-7 + i * 2, -10);
      p.lineTo(-7 + i * 2, -1);
    }
    return p.detach();
  }, []);
  const lift = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(S.stylusX - 2, -40);
    p.quadTo(S.stylusX - 16, -42, S.stylusX - 22, -54);
    return p.detach();
  }, [S.stylusX]);
  const cart = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const x0 = S.stylusX + 1;
    p.moveTo(x0, -38);
    p.lineTo(x0 + 28, -38);
    p.lineTo(x0 + 28, -28);
    p.lineTo(x0 + 8, -25);
    p.lineTo(x0, -29);
    p.close();
    return p.detach();
  }, [S.stylusX]);
  // the dial ring's printed scale, unrolled, for the loupe: 0.1 g ticks, a
  // number every gram, read at the pointer line in the middle
  const loupe = { x: b.x + b.w - loupeW - 8, y: b.y + head + 2, w: loupeW, h: b.h - head - foot - 2 };
  const gPt = 26 * k;
  const ringTicks = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const cy = loupe.y + loupe.h / 2;
    for (let i = -40; i <= 80; i++) {
      const g = i / 10;
      const y = cy + (dial - g) * gPt;
      if (y < loupe.y + 4 || y > loupe.y + loupe.h - 4) continue;
      const long = i % 10 === 0;
      const mid = i % 5 === 0;
      p.moveTo(loupe.x + loupe.w * 0.5, y);
      p.lineTo(loupe.x + loupe.w * 0.5 + (long ? 16 : mid ? 11 : 7) * k, y);
    }
    return p.detach();
  }, [dial, loupe.x, loupe.y, loupe.w, loupe.h, gPt, k]);
  const status = v.armUp ? (balanced ? 'FLOATS LEVEL: BALANCED' : F > 0 ? 'FRONT DIPS' : 'TAIL HEAVY') : v.scale ? 'ON THE STYLUS SCALE' : 'ON THE RECORD · PARALLEL';
  const statusTint = v.armUp ? (balanced ? INK.green : INK.amber) : INK.print;
  const inRangeF = F >= FORCE_RANGE.min - 0.05 && F <= FORCE_RANGE.max + 0.05;
  return (
    <Group>
      <Frame b={b} title="TONEARM · SIDE VIEW" k={k} right={status} rightTint={statusTint} />
      <Group clip={Skia.XYWHRect(b.x + 2, b.y + head - 2, loupe.x - b.x - 4, b.h - head)}>
        <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: s }]}>
          {/* the plinth on its domed feet */}
          {[22, 300].map((x) => (
            <Group key={x}>
              <RoundedRect x={x - 18} y={44} width={36} height={14} r={7}>
                <LinearGradient start={vec(0, 44)} end={vec(0, 58)} colors={['#3a3c42', '#121317']} />
              </RoundedRect>
            </Group>
          ))}
          <Solid x={-14} y={0} w={356} h={44} c={['#3a3d44', '#24262b', '#15161a']} r={4} />
          <Line p1={vec(-14, 0.6)} p2={vec(342, 0.6)} color="rgba(255,255,255,0.22)" strokeWidth={0.8} />
          {/* the platter: its rim (strobe dots), the slipmat and the record */}
          <Group transform={[{ translateX: platterShift }]} opacity={v.armUp ? 0.55 : 1}>
          <Solid x={-14} y={-16} w={118} h={14} c={METAL} r={1.5} />
          {Array.from({ length: 19 }, (_, i) => (
            <RoundedRect key={i} x={-12 + i * 6} y={-12} width={2.6} height={3} r={0.6} color="#3a3e45" />
          ))}
          <Solid x={-14} y={-2} w={110} h={2} c={['#0b0c0e', '#0b0c0e']} r={0} />
          <Solid x={-14} y={-19} w={112} h={3} c={['#3a3b40', '#2a2b30']} r={0.6} />
          <Solid x={-14} y={-21} w={106} h={2.2} c={['#2a2b30', '#060607']} r={0.8} />
          <Line p1={vec(-14, -20.8)} p2={vec(91, -20.8)} color="rgba(255,255,255,0.25)" strokeWidth={0.5} />
          </Group>
          {/* the arm rest and its clip (behind the arm) */}
          <Group opacity={0.7}>
            <Solid x={P.x - 132} y={-34} w={6} h={34} c={GRAPHITE} r={1} />
            <Path path={(() => { const p = Skia.PathBuilder.Make(); p.moveTo(P.x - 135, -50); p.lineTo(P.x - 135, -34); p.lineTo(P.x - 123, -34); p.lineTo(P.x - 123, -50); return p.detach(); })()} style="stroke" strokeWidth={1.6} color="#4a4e56" />
          </Group>
          {/* the anti-skate knob (knurled), beside the arm base */}
          <Group transform={[{ translateX: P.x - 34 }, { translateY: 0 }]}>
            <Solid x={-8} y={-10} w={16} h={10} c={['#4a4e56', '#24262b', '#121316']} r={1.5} />
            <Path path={asKnurl} style="stroke" strokeWidth={0.5} color="rgba(0,0,0,0.6)" />
            <RoundedRect x={-8} y={-11.5} width={16} height={2} r={1} color="#8a9099" />
          </Group>
          {/* the cue lever: its post, its bar, its handle */}
          <Solid x={cueX - 3} y={-28} w={6} h={28} c={METAL} r={1} />
          <Solid x={cueX - 7} y={barTop} w={14} h={3} c={['#6c727b', '#2a2c31']} r={1} />
          <Line p1={vec(cueX, -24)} p2={vec(cueX + 14, v.armUp ? -36 : -26)} color="#9aa0a8" strokeWidth={2.4} strokeCap="round" />
          {/* the arm base: the plate, the height collar (knurled), the yoke */}
          <Solid x={P.x - 22} y={-6} w={44} h={6} c={['#3e4148', '#16171a']} r={2} />
          <Group transform={[{ translateX: P.x }, { translateY: 0 }]}>
            <Solid x={-9} y={-30} w={18} h={24} c={METAL} r={1.5} />
            <Solid x={-11} y={-26} w={22} h={8} c={['#c9ced5', '#6f757e', '#3a3e45']} r={1.5} />
            <Path path={knurl} style="stroke" strokeWidth={0.45} color="rgba(0,0,0,0.45)" />
          </Group>
          <Solid x={P.x - 11} y={P.y - 4} w={4} h={18} c={['#6c727b', '#3a3e45']} r={1} />
          <Solid x={P.x + 7} y={P.y - 4} w={4} h={18} c={['#6c727b', '#3a3e45']} r={1} />
          {/* THE ARM — one rigid part, turned about the gimbal's axis */}
          <Group origin={vec(P.x, P.y)} transform={[{ rotate: -pose.angle }]}>
            {/* the stub and the counterweight: a lit cylinder, its ring at the front */}
            <Solid x={P.x} y={P.y - 3} w={66} h={6} c={METAL} r={3} />
            <Solid x={P.x + 30} y={P.y - 15} w={34} h={30} c={['#eef1f4', '#b9bec6', '#6c727b', '#2a2d33']} r={3} />
            <RoundedRect x={P.x + 30} y={P.y - 15} width={7} height={30} r={1.5} color="#16171a" />
            {Array.from({ length: 11 }, (_, i) => (
              <Line key={i} p1={vec(P.x + 30, P.y - 13 + i * 2.6)} p2={vec(P.x + (i % 5 === 0 ? 35 : 33), P.y - 13 + i * 2.6)} color="#e1e5ea" strokeWidth={0.4} />
            ))}
            {/* the pointer line the ring is read at */}
            <Line p1={vec(P.x + 28, P.y - 6)} p2={vec(P.x + 28, P.y + 6)} color={INK.white} strokeWidth={0.8} />
            {/* the tube: a round 8.5 mm tube, parallel to the record at play */}
            <Solid x={S.stylusX + 40} y={P.y - 4.25} w={P.x - S.stylusX - 40} h={8.5} c={['#eef1f4', '#b9bec6', '#5c626b']} r={4} />
            <Line p1={vec(S.stylusX + 42, P.y - 2.6)} p2={vec(P.x - 4, P.y - 2.6)} color="rgba(255,255,255,0.7)" strokeWidth={0.7} />
            {balanced ? (
              <Group>
                <Line p1={vec(P.x - 150, P.y - 6)} p2={vec(P.x - 60, P.y - 6)} color={INK.green} strokeWidth={1.2} />
                <Circle cx={P.x - 105} cy={P.y - 6} r={2} color={INK.green} />
              </Group>
            ) : null}
            {/* the headshell: its collar, its plate, the finger lift */}
            <Solid x={S.stylusX + 34} y={P.y - 5.5} w={12} h={11} c={['#d8dce2', '#8a9099', '#3a3e45']} r={1.5} />
            <Solid x={S.stylusX - 4} y={-41} w={42} h={3.2} c={['#c9ced5', '#6c727b']} r={1} />
            <Path path={lift} style="stroke" strokeWidth={1.8} color="#c9ced5" strokeCap="round" />
            {/* the cartridge (body parallel to the record), its cantilever and stylus */}
            <Path path={cart} color="#16171a" />
            <Path path={cart} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.22)" />
            <RoundedRect x={S.stylusX + 3} y={-37} width={22} height={2} r={0.5} color={INK.amber} opacity={0.6} />
            <Line p1={vec(S.stylusX + 6, -26)} p2={vec(S.stylusX, S.recTop)} color="#c9ced5" strokeWidth={0.9} strokeCap="round" />
            <Circle cx={S.stylusX} cy={S.recTop} r={0.8} color={INK.amber} />
          </Group>
          {/* the gimbal: its bearing ring over the arm's axis */}
          <Circle cx={P.x} cy={P.y} r={9}>
            <RadialGradient c={vec(P.x - 3, P.y - 3)} r={11} colors={['#eef1f4', '#8a9099', '#3a3e45']} />
          </Circle>
          <Circle cx={P.x} cy={P.y} r={9} style="stroke" strokeWidth={0.6} color="rgba(0,0,0,0.5)" />
          <Circle cx={P.x} cy={P.y} r={3} color="#16171a" />
          {/* the stylus scale: a digital gauge on the record, its LCD */}
          {v.scale && !v.armUp ? (
            <Group>
              <Solid x={S.stylusX - 30} y={S.recTop - 8} w={70} h={8} c={['#2a2c31', '#121316']} r={2} />
              <RoundedRect x={S.stylusX - 4} y={S.recTop - 9.5} width={8} height={1.6} r={0.6} color="#8a9099" />
              {/* its LCD, lit, on the gauge's front face */}
              <RoundedRect x={S.stylusX - 26} y={S.recTop - 6.4} width={18} height={4.6} r={0.8} color={inRangeF ? '#1d6b3a' : '#6b1d1d'} />
            </Group>
          ) : null}
        </Group>
      </Group>
      {/* words, in screen points, in the free space */}
      {v.scale && !v.armUp ? (
        <Group>
          <SceneText x={b.x + 10} y={b.y + b.h - 4} size={fs} text={`STYLUS SCALE READS ${Math.max(0, F).toFixed(2)} g: THE TRUE FORCE`} color={inRangeF ? INK.green : '#ff8a7e'} face="label" minPt={9.5} />
        </Group>
      ) : (
        <SceneText x={b.x + 10} y={b.y + b.h - 4} size={fs} text={`THIS CARTRIDGE: ${FORCE_RANGE.min}–${FORCE_RANGE.max} g`} color={INK.printDim} face="label" minPt={9.5} />
      )}
      <SceneText x={X(P.x - 34)} y={Y(30)} size={fs} text={`ANTI-SKATE ${v.antiSkate.toFixed(0)}`} color={INK.print} face="label" align="center" minPt={9.5} />
      {/* the loupe: the counterweight's dial ring, read at its pointer line */}
      <Line p1={vec(X(P.x + 46), Y(P.y - 16))} p2={vec(loupe.x, loupe.y + loupe.h / 2)} color="rgba(255,198,77,0.45)" strokeWidth={1} />
      <RoundedRect x={loupe.x} y={loupe.y} width={loupe.w} height={loupe.h} r={8} color="#0b0c0f" />
      <Group clip={Skia.RRectXY(Skia.XYWHRect(loupe.x, loupe.y, loupe.w, loupe.h), 8, 8)}>
        <RoundedRect x={loupe.x + loupe.w * 0.42} y={loupe.y} width={loupe.w * 0.5} height={loupe.h}>
          <LinearGradient start={vec(loupe.x + loupe.w * 0.42, 0)} end={vec(loupe.x + loupe.w * 0.92, 0)} colors={['#1a1b1f', '#2e3036', '#121316']} />
        </RoundedRect>
        <Path path={ringTicks} style="stroke" strokeWidth={1} color="#e1e5ea" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((g) => {
          const y = loupe.y + loupe.h / 2 + (dial - g) * gPt;
          return y > loupe.y + 6 && y < loupe.y + loupe.h - 2 ? <SceneText key={g} x={loupe.x + loupe.w * 0.5 + 18 * k} y={y + fs * 0.36} size={fs} text={String(g)} color="#e1e5ea" face="mono" minPt={9.5} /> : null;
        })}
      </Group>
      <Line p1={vec(loupe.x + 4, loupe.y + loupe.h / 2)} p2={vec(loupe.x + loupe.w - 4, loupe.y + loupe.h / 2)} color={INK.amber} strokeWidth={1.4} />
      <SceneText x={loupe.x + 4} y={loupe.y + loupe.h / 2 - 4} size={fs} text="DIAL" color={INK.amber} face="label" minPt={9.5} />
      <SceneText x={loupe.x + 4} y={loupe.y + loupe.h / 2 + fs + 2} size={fs} text={`${dial.toFixed(1)} g`} color={INK.white} face="mono" minPt={9.5} />
      <RoundedRect x={loupe.x} y={loupe.y} width={loupe.w} height={loupe.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,198,77,0.45)" />
    </Group>
  );
}

/* ── the phono chain, the rear inset and the RIAA curve ──────────────── */

/** Phono stages in the chain; -1 = no signal reaches the channel at all
 *  (nothing plugged into the selected input). */
export type PhonoCount = -1 | 0 | 1 | 2;

const T1 = 3180e-6;
const T2 = 318e-6;
const T3 = 75e-6;
/** The ANALOG RIAA playback curve (dB re 1 kHz) from its three time
 *  constants: +19.3 dB at 20 Hz, −19.6 dB at 20 kHz (visual review 2 #25).
 *  The audio runs a digital fit of it (engine/djDsp.RIAA_PLAYBACK), within
 *  about 1 dB to 10 kHz and shallower near 20 kHz. Pure. */
export function riaaPlaybackDb(f: number): number {
  const m = (ff: number) => {
    const w = 2 * Math.PI * ff;
    return Math.sqrt(1 + (w * T2) ** 2) / (Math.sqrt(1 + (w * T1) ** 2) * Math.sqrt(1 + (w * T3) ** 2));
  };
  return 20 * Math.log10(m(f) / m(1000));
}

/** The rear inset: the turntable's rear (switch, RCA pair, ground lug) and
 *  the mixer's rear (LINE and PHONO pairs, GND post), with the leads. */
function RearInset({ b, preamp, plugTo, gnd, k }: { b: Box; preamp: 'PHONO' | 'LINE'; plugTo: 'phono' | 'line' | 'none'; gnd: boolean; k: number }) {
  const fs = 9.5 * k;
  const pw = Math.min(66 * k, b.w * 0.34);
  const tt = { x: b.x + 2, y: b.y + fs + 5, w: pw, h: b.h - fs - 7 };
  const mx = { x: b.x + b.w - pw - 2, y: tt.y, w: pw, h: tt.h };
  // rows, top down: the ground, then the RCA rows. The turntable: GND, L, R
  // and its switch at the foot; the mixer: GND, PHONO L, PHONO R, LINE L,
  // LINE R. Its PHONO rows line up with the turntable's, so each lead runs
  // in its OWN lane and none crosses another (charter §2, D69).
  const step = tt.h / 5.4;
  const row = (i: number) => tt.y + step * (i + 0.7);
  const d = Math.min(10.5 * k, step * 0.78);
  const tx = tt.x + tt.w * 0.72;
  const mxs = mx.x + mx.w * 0.3;
  const lug = { x: tx, y: row(0) };
  const post = { x: mxs, y: row(0) };
  const ttL = { x: tx, y: row(1) };
  const ttR = { x: tx, y: row(2) };
  const jL = { x: mxs, y: plugTo === 'line' ? row(3) : row(1) };
  const jR = { x: mxs, y: plugTo === 'line' ? row(4) : row(2) };
  const gapX0 = tt.x + tt.w;
  const gapX1 = mx.x;
  const laneW = gapX0 + (gapX1 - gapX0) * 0.62;
  const laneR = gapX0 + (gapX1 - gapX0) * 0.36;
  const whiteRun: [number, number][] = plugTo === 'line' ? [[ttL.x, ttL.y], [laneW, ttL.y], [laneW, jL.y], [jL.x, jL.y]] : [[ttL.x, ttL.y], [jL.x, jL.y]];
  const redRun: [number, number][] = plugTo === 'line' ? [[ttR.x, ttR.y], [laneR, ttR.y], [laneR, jR.y], [jR.x, jR.y]] : [[ttR.x, ttR.y], [jR.x, jR.y]];
  const cableW = 3 * k;
  const gapMid = (gapX0 + gapX1) / 2;
  const hum = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const x0 = gapMid - 10 * k;
    const y0 = (row(0) + row(1)) / 2;
    for (let i = 0; i <= 20; i++) {
      const x = x0 + i * k;
      const y = y0 - Math.sin((i / 20) * Math.PI * 4) * 2.6 * k;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapMid, tt.y, step, k]);
  const plate = (r: Box, title: string) => (
    <Group>
      <RoundedRect x={r.x} y={r.y} width={r.w} height={r.h} r={4}>
        <LinearGradient start={vec(0, r.y)} end={vec(0, r.y + r.h)} colors={['#2a2c31', '#17181c']} />
      </RoundedRect>
      <RoundedRect x={r.x + 0.5} y={r.y + 0.5} width={r.w - 1} height={r.h - 1} r={4} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
      <SceneText x={r.x + r.w / 2} y={r.y - 3} size={fs} text={title} color={INK.print} face="label" align="center" minPt={9.5} />
    </Group>
  );
  const plug = (p: { x: number; y: number }, ring: string) => (
    <Group>
      <Circle cx={p.x} cy={p.y} r={d * 0.6}>
        <RadialGradient c={vec(p.x - d * 0.15, p.y - d * 0.2)} r={d * 0.7} colors={['#e1e5ea', '#8a9099', '#3a3e45']} />
      </Circle>
      <Circle cx={p.x} cy={p.y} r={d * 0.6} style="stroke" strokeWidth={d * 0.16} color={ring} />
    </Group>
  );
  const pairLabel = (y0: number, y1: number, t: string, on: boolean) => <SceneText x={mx.x + mx.w - 3} y={(y0 + y1) / 2 + fs * 0.36} size={fs} text={t} color={on ? INK.amber : INK.printDim} face="label" align="right" minPt={9.5} />;
  const sy = row(3.75);
  const sw = { x: tt.x + tt.w * 0.32, w: tt.w * 0.36, h: 7 * k };
  return (
    <Group>
      {plate(tt, 'TURNTABLE')}
      {plate(mx, 'MIXER REAR')}
      {/* the turntable's ground lug, its RCA pair, its PHONO / LINE switch */}
      <Circle cx={lug.x} cy={lug.y} r={d * 0.4}>
        <RadialGradient c={vec(lug.x - 1, lug.y - 1)} r={d * 0.5} colors={['#e1e5ea', '#6c727b']} />
      </Circle>
      <Line p1={vec(lug.x - d * 0.24, lug.y)} p2={vec(lug.x + d * 0.24, lug.y)} color="#2a2c31" strokeWidth={1.2} />
      <SceneText x={tt.x + 4} y={lug.y + fs * 0.36} size={fs} text="GND" color={INK.printDim} face="label" minPt={9.5} />
      <RcaSocket cx={ttL.x} cy={ttL.y} d={d} ring="#e9ecef" />
      <RcaSocket cx={ttR.x} cy={ttR.y} d={d} ring="#d9453a" />
      <SceneText x={tt.x + 4} y={ttL.y + fs * 0.36} size={fs} text="L" color={INK.printDim} face="label" minPt={9.5} />
      <SceneText x={tt.x + 4} y={ttR.y + fs * 0.36} size={fs} text="R" color={INK.printDim} face="label" minPt={9.5} />
      <RoundedRect x={sw.x} y={sy - sw.h / 2} width={sw.w} height={sw.h} r={3 * k} color="#050506" />
      <RoundedRect x={sw.x + (preamp === 'PHONO' ? 1 : sw.w / 2)} y={sy - sw.h / 2 + 1} width={sw.w / 2 - 1} height={sw.h - 2} r={2 * k}>
        <LinearGradient start={vec(0, sy - sw.h / 2)} end={vec(0, sy + sw.h / 2)} colors={['#b9bec6', '#5c626b']} />
      </RoundedRect>
      <SceneText x={sw.x - 2} y={sy + fs * 0.36} size={fs} text="PH" color={preamp === 'PHONO' ? INK.amber : INK.printDim} face="label" align="right" minPt={9.5} />
      <SceneText x={sw.x + sw.w + 2} y={sy + fs * 0.36} size={fs} text="LN" color={preamp === 'LINE' ? INK.amber : INK.printDim} face="label" minPt={9.5} />
      {/* the mixer's GND post and its PHONO and LINE pairs */}
      <Circle cx={post.x} cy={post.y} r={d * 0.46}>
        <RadialGradient c={vec(post.x - 1.5, post.y - 1.5)} r={d * 0.6} colors={['#f2d27a', '#9a7a2a']} />
      </Circle>
      <Circle cx={post.x} cy={post.y} r={d * 0.18} color="#3a2e10" />
      {[1, 2, 3, 4].map((i) => (
        <RcaSocket key={i} cx={mxs} cy={row(i)} d={d} ring={i % 2 ? '#e9ecef' : '#d9453a'} />
      ))}
      {pairLabel(post.y, post.y, 'GND', false)}
      {pairLabel(row(1), row(2), 'PHONO', plugTo === 'phono')}
      {pairLabel(row(3), row(4), 'LINE', plugTo === 'line')}
      {/* the ground lead (grey), along the top lane; LOOSE: the spade hangs */}
      {gnd ? (
        <Group>
          <Path path={polyPath([[lug.x, lug.y], [post.x, post.y]])} style="stroke" strokeWidth={1.6 * k} color="#8a9099" />
          <RoundedRect x={post.x - 4 * k} y={post.y - 2 * k} width={5 * k} height={4 * k} r={1} color="#c9ced5" />
        </Group>
      ) : (
        <Group>
          <Path path={polyPath([[lug.x, lug.y], [gapMid - 14 * k, lug.y], [gapMid - 16 * k, lug.y + step * 0.7]])} style="stroke" strokeWidth={1.6 * k} color="#8a9099" />
          <RoundedRect x={gapMid - 19 * k} y={lug.y + step * 0.7} width={6 * k} height={4 * k} r={1} color="#c9ced5" />
          <Path path={hum} style="stroke" strokeWidth={1.4 * k} color={INK.peak} />
          <SceneText x={gapMid} y={b.y + fs} size={fs} text="60 Hz HUM" color={INK.peak} face="label" align="center" minPt={9.5} />
        </Group>
      )}
      {/* the RCA leads, L white and R red, each in its own lane */}
      {plugTo !== 'none' ? (
        <Group>
          <Path path={polyPath(redRun)} style="stroke" strokeWidth={cableW} color="#c0392b" strokeJoin="round" strokeCap="round" />
          <Path path={polyPath(whiteRun)} style="stroke" strokeWidth={cableW} color="#c9ccd2" strokeJoin="round" strokeCap="round" />
          {plug(ttL, '#e9ecef')}
          {plug(ttR, '#d9453a')}
          {plug(jL, '#e9ecef')}
          {plug(jR, '#d9453a')}
        </Group>
      ) : null}
    </Group>
  );
}

function polyPath(pts: readonly [number, number][]) {
  const p = Skia.PathBuilder.Make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  return p.detach();
}

export function PhonoChain({ b, preamp, input, count, plugTo, gnd, k = 1 }: { b: Box; preamp: 'PHONO' | 'LINE'; input: 'LINE' | 'PHONO' | 'USB'; count: PhonoCount; plugTo: 'phono' | 'line' | 'none'; gnd: boolean; k?: number }) {
  const fs = 9.5 * k;
  const verdict = count === 1 ? 'ONE PHONO STAGE: RIGHT' : count === 0 ? 'NO PHONO STAGE: THIN, QUIET' : count === 2 ? 'TWO PHONO STAGES: BOOMY' : 'NO SIGNAL: CHECK THE INPUT';
  const tint = count === 1 ? INK.green : '#ff8a7e';
  const rowY = b.y + 20 * k;
  const bh = 26 * k;
  const gap = 6;
  const bw = (b.w - 16 - gap * 3) / 4;
  const box = (i: number, title: string, sub: string, lit: boolean, bad = false) => {
    const x = b.x + 8 + i * (bw + gap);
    return (
      <Group key={title}>
        <RoundedRect x={x} y={rowY} width={bw} height={bh} r={5} color={lit ? '#101a28' : '#121317'} />
        <RoundedRect x={x} y={rowY} width={bw} height={bh} r={5} style="stroke" strokeWidth={1} color={bad ? '#ff8a7e' : lit ? INK.blue : 'rgba(255,255,255,0.2)'} />
        <SceneText x={x + bw / 2} y={rowY + 11 * k} size={fs} text={title} color={INK.white} face="label" align="center" minPt={9.5} />
        <SceneText x={x + bw / 2} y={rowY + 22.5 * k} size={fs} text={sub} color={bad ? '#ff8a7e' : lit ? INK.blue : INK.printDim} face="label" align="center" minPt={9.5} />
        {i < 3 ? <Line p1={vec(x + bw, rowY + bh / 2)} p2={vec(x + bw + gap, rowY + bh / 2)} color={INK.blue} strokeWidth={1.4} /> : null}
      </Group>
    );
  };
  // below the chain: the rear inset (left) and the RIAA curve (right)
  const lower = { y: rowY + bh + 8 * k, h: b.y + b.h - (rowY + bh + 8 * k) - 4 };
  const insetW = Math.round((b.w - 20) * 0.56);
  const inset = { x: b.x + 6, y: lower.y, w: insetW, h: lower.h };
  const plot = { x: b.x + 8 + insetW + 30 * k, y: lower.y + fs + 6, w: b.w - insetW - 22 - 30 * k, h: lower.h - fs - 6 - 14 * k };
  const fx = (f: number) => plot.x + (Math.log(f / 20) / Math.log(1000)) * plot.w;
  const fy = (db: number) => plot.y + ((22 - Math.max(-22, Math.min(22, db))) / 44) * plot.h;
  const curve = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i <= 120; i++) {
      const f = 20 * Math.pow(1000, i / 120);
      const db = riaaPlaybackDb(f);
      if (i === 0) p.moveTo(fx(f), fy(db));
      else p.lineTo(fx(f), fy(db));
    }
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot.x, plot.y, plot.w, plot.h]);
  const hiEnd = riaaPlaybackDb(20000);
  return (
    <Group>
      <Frame b={b} title="THE PHONO STAGE" k={k} right={verdict} rightTint={tint} />
      {box(0, 'CARTRIDGE', 'ABOUT 5 mV', true)}
      {box(1, 'TT PREAMP', preamp === 'LINE' ? 'ON (+RIAA)' : 'OFF', preamp === 'LINE')}
      {box(2, 'MIXER IN', input === 'PHONO' ? 'PHONO +RIAA' : input, input === 'PHONO', count === 2)}
      {box(3, 'CHANNEL', count === 1 ? 'LINE LEVEL' : count === 0 ? 'TOO QUIET' : count === 2 ? 'OVERLOAD' : 'NO SIGNAL', count === 1, count !== 1)}
      <RearInset b={inset} preamp={preamp} plugTo={plugTo} gnd={gnd} k={k} />
      {[-20, -10, 0, 10, 20].map((dd) => (
        <Line key={dd} p1={vec(plot.x, fy(dd))} p2={vec(plot.x + plot.w, fy(dd))} color={dd === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'} strokeWidth={1} />
      ))}
      <Path path={curve} style="stroke" strokeWidth={4} color={INK.blue} opacity={0.35}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={curve} style="stroke" strokeWidth={2} color={INK.blue} />
      <Circle cx={fx(20000)} cy={fy(hiEnd)} r={2.6} color={INK.blue} />
      <SceneText x={fx(20000) - 4} y={fy(hiEnd) - 5} size={fs} text={hiEnd.toFixed(1)} color={INK.blue} face="mono" align="right" minPt={9.5} />
      <SceneText x={plot.x - 4} y={fy(20) + 3.5} size={fs} text="+20" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x - 4} y={fy(0) + 3.5} size={fs} text="0" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x - 4} y={fy(-20) + 3.5} size={fs} text="−20" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={fx(20)} y={plot.y + plot.h + 11 * k} size={fs} text="20 Hz" color={INK.printDim} minPt={9.5} />
      <SceneText x={fx(20000)} y={plot.y + plot.h + 11 * k} size={fs} text="20 kHz" color={INK.printDim} align="right" minPt={9.5} />
      <SceneText x={plot.x} y={plot.y - 4} size={fs} text="RIAA PLAYBACK (dB)" color={INK.print} face="label" minPt={9.5} />
    </Group>
  );
}

/* ── the room: the booth in side elevation ───────────────────────────── */

/** RoomView's scene, in mm (x right, y UP from the floor). */
export const ROOM_SIDE = {
  tableTop: 900,
  tableEnd: 1000,
  tt: { x: 110, w: 453, plinth: 60 },
  near: { x: 640, base: 930 },
  away: { x: 1260, base: 1250 },
  mon: { w: 250, h: 380, d: 240 },
  view: { x0: -40, x1: 1560, y0: 760, y1: 1530 },
} as const;

export function RoomView({ b, v, gain, howlDb, k = 1 }: { b: Box; v: VinylState; gain: number; howlDb: number; k?: number }) {
  const fs = 9.5 * k;
  const R = ROOM_SIDE;
  const head = 30 * k;
  const s = Math.min((b.w - 12) / (R.view.x1 - R.view.x0), (b.h - head - 6) / (R.view.y1 - R.view.y0));
  const ox = b.x + (b.w - (R.view.x1 - R.view.x0) * s) / 2 - R.view.x0 * s;
  const oy = b.y + head + R.view.y1 * s;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy - y * s;
  const status = gain >= 1 ? 'HOWL' : gain >= 0.6 ? 'BOOMY' : gain > 0.02 ? 'QUIET' : 'NO LOOP';
  const tint = gain >= 1 ? INK.peak : gain >= 0.6 ? INK.amber : INK.green;
  const feetH = v.feet ? 34 : 18;
  const ttBase = R.tableTop + feetH;
  const ttTop = ttBase + R.tt.plinth;
  const platterTop = ttTop + 18;
  const recTop = platterTop + 5;
  const M = v.monitorNear ? R.near : R.away;
  const mon = { x: M.x, y: M.base, w: R.mon.w, h: R.mon.h };
  const depth = R.mon.d * 0.42; // the side face, foreshortened (three-quarter view)
  // the woofer and tweeter on the front baffle (facing the turntable, left)
  const baffle = { x0: X(mon.x), x1: X(mon.x + depth), y0: Y(mon.y + mon.h), y1: Y(mon.y) };
  const woof = { x: X(mon.x + depth * 0.5), y: Y(mon.y + mon.h * 0.36), rx: depth * 0.5 * s * 0.82, ry: 82 * s };
  const tw = { x: X(mon.x + depth * 0.5), y: Y(mon.y + mon.h * 0.78), rx: depth * 0.5 * s * 0.36, ry: 16 * s };
  const g = Math.min(1.4, gain);
  const air = useMemo(() => {
    // three wavefronts from the woofer toward the platter, a quarter turn wide
    const out = [];
    const cx = woof.x;
    const cy = woof.y;
    const reach = Math.max(30, cx - X(R.tt.x + R.tt.w * 0.55));
    for (let i = 1; i <= 3; i++) {
      const r = (reach * i) / 3.2;
      const p = Skia.PathBuilder.Make();
      p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), 150, 75);
      out.push(p.detach());
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [woof.x, woof.y, s, ox]);
  const wire = useMemo(() => {
    // the ELECTRICAL path, drawn apart as an overlay: stylus → mixer → monitor
    const p = Skia.PathBuilder.Make();
    const sx = X(R.tt.x + 150);
    const sy = Y(recTop + 6);
    const top = Y(R.view.y1 - 40);
    p.moveTo(sx, sy);
    p.lineTo(sx, top);
    p.lineTo(X(mon.x + depth + R.mon.w * 0.6), top);
    p.lineTo(X(mon.x + depth + R.mon.w * 0.6), Y(mon.y + mon.h) - 2);
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, ox, oy, recTop, mon.x, mon.y]);
  const arrow = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const x = X(mon.x + depth + R.mon.w * 0.6);
    const y = Y(mon.y + mon.h) - 2;
    p.moveTo(x, y);
    p.lineTo(x - 4 * k, y - 7 * k);
    p.lineTo(x + 4 * k, y - 7 * k);
    p.close();
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, ox, oy, mon.x, mon.y, k]);
  const leg = (x: number, back: boolean) => (
    <RoundedRect key={`${x}${back}`} x={X(x)} y={Y(R.tableTop - 80)} width={40 * s} height={(R.tableTop - 80 - R.view.y0 + 40) * s} r={1} color={back ? '#1c1d21' : '#2a2c31'} />
  );
  return (
    <Group>
      <Frame b={b} title="THE BOOTH · SIDE VIEW, TO SCALE" k={k} right={`LOOP ×${gain.toFixed(2)} · ${status}`} rightTint={tint} />
            <Group clip={Skia.XYWHRect(b.x + 2, b.y + head - 4, b.w - 4, b.h - head + 2)}>
        {/* the table: back legs (further, darker), the apron, the top, front legs */}
        {leg(40, true)}
        {leg(R.tableEnd - 20, true)}
        <Solid x={X(R.view.x0)} y={Y(R.tableTop - 30)} w={(R.tableEnd - 30 - R.view.x0) * s} h={50 * s} c={['#2a2c31', '#17181c']} r={0} />
        <Solid x={X(R.view.x0)} y={Y(R.tableTop)} w={(R.tableEnd - R.view.x0) * s} h={30 * s} c={['#4a4d54', '#2a2c31', '#1a1b1f']} r={2} />
        <Line p1={vec(X(R.view.x0), Y(R.tableTop) + 0.6)} p2={vec(X(R.tableEnd), Y(R.tableTop) + 0.6)} color="rgba(255,255,255,0.25)" strokeWidth={0.8} />
        {leg(0, false)}
        {leg(R.tableEnd - 60, false)}
        {/* the turntable in profile: feet, plinth, platter rim (strobe dots), record, arm */}
        {[R.tt.x + 40, R.tt.x + R.tt.w - 40].map((x) => (
          <RoundedRect key={x} x={X(x - (v.feet ? 34 : 22))} y={Y(R.tableTop + feetH)} width={(v.feet ? 68 : 44) * s} height={feetH * s} r={feetH * s * 0.45}>
            <LinearGradient start={vec(0, Y(R.tableTop + feetH))} end={vec(0, Y(R.tableTop))} colors={v.feet ? ['#8a7ab8', '#4a3f6e'] : ['#3a3c42', '#121317']} />
          </RoundedRect>
        ))}
        <Solid x={X(R.tt.x)} y={Y(ttTop)} w={R.tt.w * s} h={R.tt.plinth * s} c={['#3e4148', '#24262b', '#121316']} r={3} />
        <Solid x={X(R.tt.x + 24)} y={Y(platterTop)} w={332 * s} h={18 * s} c={METAL} r={1} />
        {Array.from({ length: 22 }, (_, i) => (
          <RoundedRect key={i} x={X(R.tt.x + 30 + i * 15)} y={Y(platterTop - 6)} width={Math.max(1, 5 * s)} height={Math.max(1, 5 * s)} r={0.5} color="#3a3e45" />
        ))}
        <Solid x={X(R.tt.x + 40)} y={Y(recTop)} w={302 * s} h={Math.max(1.2, 5 * s)} c={['#2a2b30', '#060607']} r={0.5} />
        {/* the arm pillar, counterweight and tube over the record */}
        <Solid x={X(R.tt.x + 385)} y={Y(ttTop + 42)} w={26 * s} h={42 * s} c={METAL} r={1} />
        <Solid x={X(R.tt.x + 400)} y={Y(ttTop + 58)} w={40 * s} h={30 * s} c={['#eef1f4', '#8a9099', '#3a3e45']} r={2} />
        <Line p1={vec(X(R.tt.x + 398), Y(ttTop + 43))} p2={vec(X(R.tt.x + 160), Y(ttTop + 43))} color="#b9bec6" strokeWidth={Math.max(1.2, 8.5 * s)} strokeCap="round" />
        <Solid x={X(R.tt.x + 140)} y={Y(ttTop + 46)} w={34 * s} h={(46 - (recTop - ttTop)) * s} c={['#3a3d44', '#121316']} r={1} />
        {/* the monitor: a pad on the table, or a pole stand of its own */}
        {v.monitorNear ? (
          <Solid x={X(mon.x - 10)} y={Y(mon.y)} w={(depth + R.mon.w + 20) * s} h={30 * s} c={['#4a3f6e', '#2a2440']} r={2} />
        ) : (
          <Group>
            <Solid x={X(mon.x + depth + 70)} y={Y(mon.y)} w={36 * s} h={(mon.y - R.view.y0 + 40) * s} c={['#4a4e56', '#2a2c31']} r={1} />
            <Solid x={X(mon.x + depth + 40)} y={Y(mon.y)} w={100 * s} h={18 * s} c={['#3a3d44', '#1a1b1f']} r={2} />
          </Group>
        )}
        {/* the side face (depth), then the front baffle facing the turntable */}
        <Path path={(() => { const p = Skia.PathBuilder.Make(); p.moveTo(X(mon.x + depth), Y(mon.y)); p.lineTo(X(mon.x + depth + R.mon.w), Y(mon.y + 30)); p.lineTo(X(mon.x + depth + R.mon.w), Y(mon.y + mon.h + 20)); p.lineTo(X(mon.x + depth), Y(mon.y + mon.h)); p.close(); return p.detach(); })()}>
          <LinearGradient start={vec(X(mon.x + depth), 0)} end={vec(X(mon.x + depth + R.mon.w), 0)} colors={['#2e3036', '#16171a']} />
        </Path>
        <RoundedRect x={baffle.x0} y={baffle.y0} width={baffle.x1 - baffle.x0} height={baffle.y1 - baffle.y0} r={3 * s}>
          <LinearGradient start={vec(baffle.x0, baffle.y0)} end={vec(baffle.x1, baffle.y1)} colors={['#3a3d44', '#1a1b1f', '#0d0e11']} />
        </RoundedRect>
        <Circle cx={woof.x} cy={woof.y} r={1} color="transparent" />
        <Group transform={[{ translateX: woof.x }, { translateY: woof.y }, { scaleX: woof.rx / woof.ry }]}>
          <Circle cx={0} cy={0} r={woof.ry}>
            <RadialGradient c={vec(-woof.ry * 0.2, -woof.ry * 0.25)} r={woof.ry} colors={['#3a3c42', '#0b0c0e']} />
          </Circle>
          <Circle cx={0} cy={0} r={woof.ry * 0.32} color="#24262b" />
          <Circle cx={0} cy={0} r={woof.ry} style="stroke" strokeWidth={woof.ry * 0.08} color="#4a4e56" />
        </Group>
        <Group transform={[{ translateX: tw.x }, { translateY: tw.y }, { scaleX: tw.rx / tw.ry }]}>
          <Circle cx={0} cy={0} r={tw.ry}>
            <RadialGradient c={vec(-tw.ry * 0.3, -tw.ry * 0.3)} r={tw.ry} colors={['#9aa0a8', '#2a2c31']} />
          </Circle>
        </Group>
        <RoundedRect x={X(mon.x + depth * 0.25)} y={Y(mon.y + 40)} width={depth * 0.5 * s} height={Math.max(1.5, 14 * s)} r={2} color="#050506" />
        {/* the AIR path: wavefronts from the woofer to the platter, its loop gain in their weight */}
        {air.map((p, i) => (
          <Path key={i} path={p} style="stroke" strokeWidth={(1 + g * 2.2) * Math.min(k, 1.6)} color={INK.amber} opacity={gain > 0.02 ? 0.35 + 0.45 * Math.min(1, g) - i * 0.08 : 0.16} strokeCap="round" />
        ))}
        {/* the ELECTRICAL path, an overlay: stylus → mixer → monitor */}
        <Path path={wire} style="stroke" strokeWidth={1.4} color={INK.blue} opacity={0.85}>
          <DashPathEffect intervals={[6, 4]} />
        </Path>
        <Path path={arrow} color={INK.blue} opacity={0.85} />
      </Group>
      <SceneText x={(X(R.tt.x + 150) + X(mon.x + depth + R.mon.w * 0.6)) / 2} y={Y(R.view.y1 - 40) - 4} size={fs} text="ELECTRICAL (OVERLAY): STYLUS TO MIXER TO MONITOR" color={INK.blue} face="label" align="center" minPt={9.5} />
      <SceneText x={woof.x - Math.max(30, woof.x - X(R.tt.x + R.tt.w * 0.55)) * 0.55} y={Y(recTop + 330)} size={fs} text="AIR" color={INK.amber} face="label" align="center" minPt={9.5} />
      {howlDb > -60 ? (
        <Group>
          <RoundedRect x={b.x + 6} y={b.y + b.h - fs - 7} width={fs * 21} height={fs + 6} r={3} color="rgba(8,8,10,0.88)" />
          <SceneText x={b.x + 10} y={b.y + b.h - 6} size={fs} text={`80 Hz BUILD-UP ${howlDb.toFixed(0)} dBFS (HELD SAFE)`} color={tint} face="label" minPt={9.5} />
        </Group>
      ) : null}
      {v.feet ? <SceneText x={X(R.tt.x + R.tt.w / 2)} y={Y(R.tableTop - 40) + fs} size={fs} text="ISOLATION FEET" color="#c9b8f0" face="label" align="center" minPt={9.5} /> : null}
    </Group>
  );
}
