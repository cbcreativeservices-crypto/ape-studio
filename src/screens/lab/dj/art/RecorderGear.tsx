/**
 * RecorderGear — screen 21's recorder, drawn as the real object and AUTHORED
 * IN MILLIMETRES, and the TAKE lane drawn from the captured samples.
 *
 *   Recorder   a handheld stereo recorder (top face 72 × 156): the crossed
 *              pair of capsules under their guard, the display (input meters
 *              that read the recorder's own taps, the REC time, the CLIP
 *              light), the transport keys and the round REC key; its LINE IN
 *              jack on the left side and the INPUT gain wheel on the right.
 *   SplitLead  the lead from the mixer's REC OUT (two RCA legs, white and
 *              red, into one moulded Y) to the recorder's 3.5 mm LINE IN —
 *              ONE cable with two legs, each leg its own traceable line,
 *              each leg's plug drawn seated in its jack (R3-DJ-01).
 *   TakeLane   the take's waveform (min / max per column of the real
 *              capture), where the mic is in it, the playhead.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { LedColumn, Led, PlugFace } from './parts';
import { ColumnWave } from './waveDraw';
import { SceneText, useLabelMm } from './sceneText';
import { useExtTapDb } from './eventMotion';
import type { TakeView } from '../booth/takeStore';

export const REC_W = 72;
export const REC_H = 156;
/** Local mm of the recorder's sockets and controls. */
export const REC = { lineIn: { x: 0, y: 96 }, wheel: { x: REC_W, y: 100 }, screen: { x: 10, y: 50, w: 52, h: 38 }, rec: { x: 36, y: 128 } } as const;

/** The recorder's input meters (its own taps, before its clip). */
function RecMeters({ x, y, h }: { x: number; y: number; h: number }) {
  const l = useExtTapDb('recL');
  const lh = useExtTapDb('recL', 'hold');
  const r = useExtTapDb('recR');
  const rh = useExtTapDb('recR', 'hold');
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: Math.PI / 2 }]}>
      <LedColumn x={0} y={-h} w={3.2} h={h} level={l} hold={lh} />
      <LedColumn x={-6} y={-h} w={3.2} h={h} level={r} hold={rh} />
    </Group>
  );
}

export const Recorder = memo(function Recorder({ x, y, armed, clip, gain, elapsed }: { x: number; y: number; armed: boolean; clip: boolean; gain: number; elapsed: string }) {
  const guard = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(8, 34);
    p.cubicTo(8, 4, 64, 4, 64, 34);
    return p.detach();
  }, []);
  const S = REC.screen;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* the INPUT wheel on the right side, the LINE IN jack on the left */}
      <RoundedRect x={REC_W - 3} y={REC.wheel.y - 13} width={7} height={26} r={2.4}>
        <LinearGradient start={vec(REC_W - 3, 0)} end={vec(REC_W + 4, 0)} colors={['#2a2c31', '#8a9099', '#2a2c31']} />
      </RoundedRect>
      {Array.from({ length: 9 }, (_, i) => (
        <Line key={i} p1={vec(REC_W - 2, REC.wheel.y - 11 + i * 2.75)} p2={vec(REC_W + 3.4, REC.wheel.y - 11 + i * 2.75)} color="rgba(0,0,0,0.5)" strokeWidth={0.5} />
      ))}
      <RoundedRect x={-4} y={REC.lineIn.y - 5} width={6} height={10} r={1.6} color="#16171a" />
      <LineInLegend />
      {/* body */}
      <RoundedRect x={3} y={6} width={REC_W} height={REC_H} r={10} color="rgba(0,0,0,0.65)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={REC_W} height={REC_H} r={10}>
        <LinearGradient start={vec(0, 0)} end={vec(REC_W, REC_H)} colors={['#3a3d43', '#202226', '#121316']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={REC_W - 1.2} height={REC_H - 1.2} r={9.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      {/* the crossed capsules under their guard */}
      <Path path={guard} style="stroke" strokeWidth={3.4} color="#0b0c0e" strokeCap="round" />
      <Path path={guard} style="stroke" strokeWidth={2.2} strokeCap="round">
        <LinearGradient start={vec(8, 0)} end={vec(64, 0)} colors={['#6f757e', '#d8dce2', '#4a4f57']} />
      </Path>
      {[
        { cx: 26, a: -0.6 },
        { cx: 46, a: 0.6 },
      ].map((c) => (
        <Group key={c.cx} transform={[{ translateX: c.cx }, { translateY: 26 }, { rotate: c.a }]}>
          <RoundedRect x={-6} y={-9} width={12} height={18} r={5}>
            <RadialGradient c={vec(-2, -4)} r={12} colors={['#9aa0a8', '#2a2c31']} />
          </RoundedRect>
          {[-5, -2, 1, 4].map((g) => (
            <Line key={g} p1={vec(-5, g)} p2={vec(5, g)} color="rgba(0,0,0,0.45)" strokeWidth={0.6} />
          ))}
        </Group>
      ))}
      {/* the display */}
      <RoundedRect x={S.x - 1.5} y={S.y - 1.5} width={S.w + 3} height={S.h + 3} r={3} color="#050506" />
      <RoundedRect x={S.x} y={S.y} width={S.w} height={S.h} r={2}>
        <LinearGradient start={vec(0, S.y)} end={vec(0, S.y + S.h)} colors={[INK.lcdHi, INK.lcdLo]} />
      </RoundedRect>
      <RecMeters x={S.x + 4} y={S.y + S.h - 9} h={S.w - 8} />
      <SceneText x={S.x + 3} y={S.y + 8} size={5} text={armed ? `REC ${elapsed}` : `STOP ${elapsed}`} color={armed ? INK.red : INK.print} face="mono" />
      <SceneText x={S.x + S.w - 3} y={S.y + 8} size={4.2} text={`IN ${gain >= 0 ? '+' : '−'}${Math.abs(gain).toFixed(0)}`} color={INK.amber} face="mono" align="right" />
      <Led cx={S.x + S.w - 4} cy={S.y + S.h - 5} r={1.3} on={clip} colour={INK.peak} />
      <Rect x={S.x} y={S.y} width={S.w} height={S.h * 0.4} color="rgba(120,170,220,0.06)" />
      {/* transport and the REC key */}
      {[14, 36, 58].map((kx) => (
        <RoundedRect key={kx} x={kx - 8} y={100} width={16} height={9} r={3}>
          <LinearGradient start={vec(0, 100)} end={vec(0, 109)} colors={[INK.padHi, INK.padLo]} />
        </RoundedRect>
      ))}
      <Circle cx={REC.rec.x} cy={REC.rec.y} r={9.5} color="#0b0c0e" />
      {armed ? (
        <Circle cx={REC.rec.x} cy={REC.rec.y} r={11} color={INK.red} opacity={0.45}>
          <BlurMask blur={4} style="normal" />
        </Circle>
      ) : null}
      <Circle cx={REC.rec.x} cy={REC.rec.y} r={8}>
        <RadialGradient c={vec(REC.rec.x - 2.5, REC.rec.y - 3)} r={10} colors={armed ? ['#ff8f84', '#b3281e'] : ['#9a3a32', '#4a1410']} />
      </Circle>
    </Group>
  );
});

/** The LINE IN legend printed up the recorder's left side, at 9 pt. */
function LineInLegend() {
  const lm = useLabelMm(9);
  return (
    <Group transform={[{ translateX: -5 }, { translateY: REC.lineIn.y - 9 }, { rotate: -Math.PI / 2 }]}>
      <SceneText x={0} y={0} size={lm} text="LINE IN" color={INK.print} face="label" />
    </Group>
  );
}

/** The two legs' lanes into the Y (mm apart). */
export const SPLIT_LANE_GAP = 5;

/**
 * The lane each leg drops in, and the height of its run into the Y
 * (R3-DJ-01): a leg with `jog` leaves its plug SIDEWAYS to that lane before
 * it drops (BOOTH L, whose straight drop would cross the BOOTH R plug under
 * it); the leg whose lane is further from the Y runs LOWER, so the two legs
 * never cross; each starts exactly at its own jack.
 */
export function splitLanes(from: readonly [{ x: number; y: number }, { x: number; y: number }], y0: number, jog?: readonly [number | null, number | null]): { x: number; y: number }[] {
  const lx = from.map((f, i) => jog?.[i] ?? f.x);
  const outer = lx[0] <= lx[1] ? 0 : 1;
  return lx.map((x, i) => ({ x, y: i === outer ? y0 + SPLIT_LANE_GAP : y0 }));
}

/** The split lead's two legs (fixed at the mixer's REC OUT — RCA — or its
 *  BOOTH OUT — 6.35 mm jacks) into one moulded Y, then one cable to the
 *  3.5 mm plug. */
export function SplitLead({ from, y0, to, live, trs, jog }: { from: [{ x: number; y: number }, { x: number; y: number }]; y0: number; to: { x: number; y: number }; live: boolean; trs: boolean; jog?: readonly [number | null, number | null] }) {
  const yX = { x: to.x - 34, y: y0 };
  const legs = useMemo(
    () => {
      const lanes = splitLanes(from, y0, jog);
      return from.map((f, i) => {
        const { x: lx, y: ly } = lanes[i];
        const p = Skia.PathBuilder.Make();
        p.moveTo(f.x, f.y);
        if (Math.abs(lx - f.x) > 0.5) {
          const sg = Math.sign(lx - f.x);
          p.lineTo(lx - sg * 6, f.y);
          p.quadTo(lx, f.y, lx, f.y + 6);
        }
        p.lineTo(lx, ly - 10);
        p.quadTo(lx, ly, lx + 10, ly);
        p.lineTo(yX.x - 8, ly);
        return p.detach();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from[0].x, from[0].y, from[1].x, from[1].y, y0, yX.x, jog?.[0], jog?.[1]],
  );
  const tail = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(yX.x + 6, y0);
    p.cubicTo(yX.x + 20, y0, to.x - 18, to.y, to.x - 6, to.y);
    return p.detach();
  }, [yX.x, y0, to.x, to.y]);
  const leg = (i: number) => (trs ? ['#101113', '#101113'][i] : ['#8d9097', '#7a2018'][i]);
  return (
    <Group>
      {live ? (
        <Group>
          {legs.map((p, i) => (
            <Path key={`g${i}`} path={p} style="stroke" strokeWidth={8} color={INK.blue} opacity={0.3} strokeCap="round">
              <BlurMask blur={3} style="normal" />
            </Path>
          ))}
          <Path path={tail} style="stroke" strokeWidth={9} color={INK.blue} opacity={0.3} strokeCap="round">
            <BlurMask blur={3} style="normal" />
          </Path>
        </Group>
      ) : null}
      {legs.map((p, i) => (
        <Group key={i}>
          <Path path={p} style="stroke" strokeWidth={3.9} color="rgba(0,0,0,0.75)" strokeCap="round" />
          <Path path={p} style="stroke" strokeWidth={3.2} color={leg(i)} strokeCap="round" />
          <Path path={p} style="stroke" strokeWidth={0.7} color={INK.cableHi} strokeCap="round" transform={[{ translateY: -0.7 }]} />
        </Group>
      ))}
      {/* each leg's plug, seated in its jack: 6.35 mm jacks in BOOTH OUT,
          white and red RCA in REC OUT */}
      {from.map((f, i) => (
        <PlugFace key={`p${i}`} cx={f.x} cy={f.y} kind={trs ? 'trs' : 'rca'} colour={trs ? '#101113' : i === 0 ? INK.rcaWhite : INK.rcaRed} />
      ))}
      <Path path={tail} style="stroke" strokeWidth={4.6} color="rgba(0,0,0,0.75)" strokeCap="round" />
      <Path path={tail} style="stroke" strokeWidth={3.8} color="#1a1b1f" strokeCap="round" />
      {/* the moulded Y */}
      <RoundedRect x={yX.x - 9} y={y0 - 4} width={16} height={13} r={4}>
        <LinearGradient start={vec(0, y0 - 4)} end={vec(0, y0 + 9)} colors={['#3a3c42', '#0b0b0d']} />
      </RoundedRect>
      {/* the 3.5 mm TRS plug, seated in the recorder's LINE IN: the boot,
          its strain relief, the metal shell, and the two insulating rings of
          the tip and ring contacts showing at the socket (review #18) */}
      <RoundedRect x={to.x - 28} y={to.y - 3} width={8} height={6} r={2.4} color="#141518" />
      <RoundedRect x={to.x - 22} y={to.y - 5} width={16} height={10} r={3}>
        <LinearGradient start={vec(0, to.y - 5)} end={vec(0, to.y + 5)} colors={['#3a3c42', '#0b0b0d']} />
      </RoundedRect>
      <Rect x={to.x - 7} y={to.y - 3} width={5} height={6}>
        <LinearGradient start={vec(0, to.y - 3)} end={vec(0, to.y + 3)} colors={['#eef1f4', '#8a9099', '#4a4f57']} />
      </Rect>
      <Rect x={to.x - 2} y={to.y - 1.75} width={1.2} height={3.5} color="#0b0b0d" />
      <Rect x={to.x - 0.8} y={to.y - 1.75} width={1.4} height={3.5}>
        <LinearGradient start={vec(0, to.y - 2)} end={vec(0, to.y + 2)} colors={['#eef1f4', '#8a9099']} />
      </Rect>
      <Rect x={to.x + 0.6} y={to.y - 1.75} width={0.9} height={3.5} color="#0b0b0d" />
    </Group>
  );
}

/** dBFS marks on the take lane's edge, and the capture target. */
const LANE_MARKS = [
  { db: 0, t: '0' },
  { db: -6, t: '−6' },
  { db: -12, t: '−12' },
  { db: -24, t: '−24' },
] as const;
export const TAKE_TARGET = { lo: -12, hi: -3 } as const;
const amp = (db: number) => Math.pow(10, db / 20);

/**
 * The take lane (second visual review 2026-10-18, #18): the captured
 * waveform drawn TRUE to scale by the shared renderer (waveDraw.ColumnWave:
 * peak envelope over an RMS core, in the loudness ramp), a dBFS scale on its
 * left edge (0, -6, -12, -24), the capture target (-12 ... -3 dBFS peaks)
 * shaded, the voice marks under it and the playhead — so a quiet take reads
 * as too quiet, not just small.
 */
export function TakeLane({ b, take, pos, k = 1, recording }: { b: { x: number; y: number; w: number; h: number }; take: TakeView | null; pos: SharedValue<number>; k?: number; recording: boolean }) {
  const fs = 9 * k;
  const scaleW = 26 * k;
  const titleH = fs + 8 * k;
  const lane = { x: b.x + scaleW, y: b.y + titleH, w: b.w - scaleW, h: b.h - titleH - 6 * k };
  const mid = lane.y + lane.h / 2;
  const half = lane.h / 2;
  const yOf = (a: number) => mid - a * half;
  const voice = useMemo(() => {
    if (!take || take.seconds < 0.05) return null;
    const n = take.cols.voice.length;
    const p = Skia.PathBuilder.Make();
    for (let c = 0; c < n; c++) if (take.cols.voice[c]) p.addRect(Skia.XYWHRect(lane.x + (c / n) * lane.w, lane.y + lane.h + 1, Math.max(0.8, lane.w / n), 4 * k));
    return p.detach();
  }, [take, lane.x, lane.y, lane.w, lane.h, k]);
  const head = useDerivedValue(() => (take && take.seconds > 0 ? lane.x + Math.min(1, pos.value / take.seconds) * lane.w : lane.x));
  const p1 = useDerivedValue(() => vec(head.value, lane.y));
  const p2 = useDerivedValue(() => vec(head.value, lane.y + lane.h));
  const tLo = amp(TAKE_TARGET.lo);
  const tHi = amp(TAKE_TARGET.hi);
  return (
    <Group>
      <RoundedRect x={b.x - 4} y={b.y - 2} width={b.w + 8} height={b.h + 6 * k} r={6} color="rgba(8,8,10,0.85)" />
      {/* the capture target, both halves */}
      <Rect x={lane.x} y={yOf(tHi)} width={lane.w} height={(tHi - tLo) * half} color="rgba(91,255,133,0.10)" />
      <Rect x={lane.x} y={yOf(-tLo)} width={lane.w} height={(tHi - tLo) * half} color="rgba(91,255,133,0.10)" />
      {LANE_MARKS.map((m) => (
        <Group key={m.db}>
          <Line p1={vec(lane.x, yOf(amp(m.db)))} p2={vec(lane.x + lane.w, yOf(amp(m.db)))} color={m.db === 0 ? 'rgba(255,90,72,0.35)' : 'rgba(255,255,255,0.08)'} strokeWidth={1} />
          <Line p1={vec(lane.x, yOf(-amp(m.db)))} p2={vec(lane.x + lane.w, yOf(-amp(m.db)))} color={m.db === 0 ? 'rgba(255,90,72,0.35)' : 'rgba(255,255,255,0.08)'} strokeWidth={1} />
          <SceneText x={lane.x - 3 * k} y={yOf(amp(m.db)) + fs * 0.36} size={fs} text={m.t} color={m.db === 0 ? INK.peak : INK.printDim} face="label" align="right" />
        </Group>
      ))}
      <Line p1={vec(lane.x, mid)} p2={vec(lane.x + lane.w, mid)} color="rgba(255,255,255,0.12)" strokeWidth={1} />
      {take && take.seconds >= 0.05 ? <ColumnWave x={lane.x} y={lane.y} w={lane.w} h={lane.h} lo={take.cols.lo} hi={take.cols.hi} rms={take.cols.rms} /> : null}
      {voice ? <Path path={voice} color={INK.green} /> : null}
      <Line p1={p1} p2={p2} color={INK.white} strokeWidth={1.6} />
      <SceneText x={b.x} y={b.y + fs + 1} size={fs} text={take ? `TAKE · ${take.seconds.toFixed(1)} s${recording ? ' · RECORDING' : ''}${take.clipped > 0 ? ' · CLIPPED' : ''}` : 'NO TAKE YET'} color={take && take.clipped > 0 ? INK.peak : recording ? INK.red : INK.print} face="label" />
      <SceneText x={b.x + b.w} y={b.y + fs + 1} size={fs} text={take?.hasVoice ? 'VOICE IN THE TAKE' : 'NO VOICE IN THE TAKE'} color={take?.hasVoice ? INK.green : INK.printDim} face="label" align="right" />
      <SceneText x={lane.x + lane.w - 2} y={yOf(tHi) + fs + 1} size={fs} text="TARGET PEAKS" color="rgba(125,255,159,0.8)" face="label" align="right" />
    </Group>
  );
}
