/**
 * plots — the DJ Systems Lab's data pictures (abstract by nature, so clean
 * geometry is right — but styled: soft glow, gradient fills, weight
 * hierarchy). Each is computed from the SAME model the audio runs through:
 *
 *   CurvePlot   the crossfader's gain for side A and side B across its travel
 *               (model/djModel.xfGains), the current position marked, the
 *               centre level printed.
 *   EqPlot      the channel's EQ + filter magnitude, 20 Hz – 20 kHz on a log
 *               axis (engine/djDsp.isolatorMag × filterMag).
 *   WaveLane    one deck's zoomed waveform (min/max of the real audio) with
 *               its ANALYSED grid, scrolling past a fixed playhead.
 *
 * Plots draw in SCREEN points inside a given box; text is ≥ 9.5 pt.
 */
import { useMemo } from 'react';
import { BlurMask, Group, Line, LinearGradient, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { dbToLin, filterMag, filterOf, isolatorMag, linToDb } from '../engine/djDsp';
import { eqDb, filterQ, xfGains, type ChannelState, type DeckState, type XfCurve } from '../model/djModel';
import { analysedGrid } from '../model/djDeck';
import { CUE_COLOURS, INK } from './ink';
import { useDeckPos } from './motion';
import { WAVE_LOW } from './waves';
import { GridOver, WaveBody } from './waveDraw';
import { textWidthPt } from './Scene';
import { SceneText } from './sceneText';

export type PlotBox = { x: number; y: number; w: number; h: number };

function Frame({ b, title }: { b: PlotBox; title: string }) {
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.92)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 14} size={10} text={title} color={INK.amber} face="label" minPt={9.5} />
    </Group>
  );
}

/** Crossfader curves: A (white) and B (blue) gain in dB from −40 to +3 dB. */
export function CurvePlot({ b, curve, x }: { b: PlotBox; curve: XfCurve; x: number }) {
  const inner = { x: b.x + 10, y: b.y + 22, w: b.w - 20, h: b.h - 40 };
  const yOf = (g: number) => {
    const db = Math.max(-40, linToDb(g));
    return inner.y + ((3 - db) / 43) * inner.h;
  };
  const paths = useMemo(() => {
    const pa = Skia.PathBuilder.Make();
    const pb = Skia.PathBuilder.Make();
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const g = xfGains(t, curve);
      const px = inner.x + t * inner.w;
      if (i === 0) {
        pa.moveTo(px, yOf(g.a));
        pb.moveTo(px, yOf(g.b));
      } else {
        pa.lineTo(px, yOf(g.a));
        pb.lineTo(px, yOf(g.b));
      }
    }
    return { a: pa.detach(), b: pb.detach() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve, inner.x, inner.y, inner.w, inner.h]);
  const g = xfGains(x, curve);
  const mid = xfGains(0.5, curve);
  const px = inner.x + x * inner.w;
  const zero = yOf(1);
  return (
    <Group>
      <Frame b={b} title={`CROSSFADER · ${curve}`} />
      {/* which line is which side (learning review p08 #2) */}
      <Line p1={vec(b.x + b.w - 118, b.y + 10)} p2={vec(b.x + b.w - 104, b.y + 10)} color={INK.white} strokeWidth={2.2} />
      <SceneText x={b.x + b.w - 100} y={b.y + 14} size={9.5} text="SIDE A" color={INK.white} face="label" minPt={9.5} />
      <Line p1={vec(b.x + b.w - 60, b.y + 10)} p2={vec(b.x + b.w - 46, b.y + 10)} color={INK.blue} strokeWidth={2.2} />
      <SceneText x={b.x + b.w - 42} y={b.y + 14} size={9.5} text="SIDE B" color={INK.blue} face="label" minPt={9.5} />
      <Line p1={vec(inner.x, zero)} p2={vec(inner.x + inner.w, zero)} color="rgba(255,255,255,0.18)" strokeWidth={1} />
      <Line p1={vec(inner.x + inner.w / 2, inner.y)} p2={vec(inner.x + inner.w / 2, inner.y + inner.h)} color="rgba(255,255,255,0.10)" strokeWidth={1} />
      <Path path={paths.a} style="stroke" strokeWidth={2.2} color={INK.white} strokeCap="round" />
      <Path path={paths.b} style="stroke" strokeWidth={2.2} color={INK.blue} strokeCap="round" />
      <Line p1={vec(px, inner.y)} p2={vec(px, inner.y + inner.h)} color={INK.amber} strokeWidth={1.4} />
      <Rect x={px - 3} y={yOf(g.a) - 3} width={6} height={6} color={INK.white} />
      <Rect x={px - 3} y={yOf(g.b) - 3} width={6} height={6} color={INK.blue} />
      <SceneText x={inner.x} y={b.y + b.h - 6} size={10} text="A" color={INK.white} face="label" minPt={9.5} />
      <SceneText x={inner.x + inner.w} y={b.y + b.h - 6} size={10} text="B" color={INK.blue} face="label" align="right" minPt={9.5} />
      <SceneText x={inner.x + inner.w / 2} y={b.y + b.h - 6} size={10} text={`centre ${fmtDb(mid.a)}`} color={INK.print} align="center" minPt={9.5} />
    </Group>
  );
}

const fmtDb = (g: number) => {
  const db = linToDb(g);
  return db <= -119 ? '−∞ dB' : `${db > 0.005 ? '+' : db < -0.005 ? '−' : ''}${Math.abs(db).toFixed(1)} dB`;
};

const F_MIN = 20;
const F_MAX = 20000;

/** The channel's EQ + filter response, ±dB on a log-frequency axis. */
export function EqPlot({ b, ch, resonance, label }: { b: PlotBox; ch: ChannelState; resonance: number; label: string }) {
  const inner = { x: b.x + 10, y: b.y + 22, w: b.w - 20, h: b.h - 38 };
  const TOP = 9;
  const BOT = -36;
  const yOf = (db: number) => inner.y + ((TOP - Math.max(BOT, Math.min(TOP, db))) / (TOP - BOT)) * inner.h;
  const xOf = (f: number) => inner.x + (Math.log(f / F_MIN) / Math.log(F_MAX / F_MIN)) * inner.w;
  const g = { lo: dbToLin(eqDb(ch.eq.lo)), mid: dbToLin(eqDb(ch.eq.mid)), hi: dbToLin(eqDb(ch.eq.hi)) };
  const fs = filterOf(ch.filter, filterQ(resonance));
  const { line, fill } = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const q = Skia.PathBuilder.Make();
    const n = 160;
    q.moveTo(inner.x, yOf(BOT));
    for (let i = 0; i <= n; i++) {
      const f = F_MIN * Math.pow(F_MAX / F_MIN, i / n);
      const db = linToDb(isolatorMag(g, f) * filterMag(fs, f));
      const px = xOf(f);
      const py = yOf(db);
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
      q.lineTo(px, py);
    }
    q.lineTo(inner.x + inner.w, yOf(BOT));
    q.close();
    return { line: p.detach(), fill: q.detach() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.lo, g.mid, g.hi, fs.kind, (fs as { hz?: number }).hz, (fs as { q?: number }).q, inner.x, inner.y, inner.w, inner.h]);
  const grid = [100, 1000, 10000];
  return (
    <Group>
      <Frame b={b} title={label} />
      {[0, -12, -24].map((d) => (
        <Line key={d} p1={vec(inner.x, yOf(d))} p2={vec(inner.x + inner.w, yOf(d))} color={d === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'} strokeWidth={1} />
      ))}
      {grid.map((f) => (
        <Line key={f} p1={vec(xOf(f), inner.y)} p2={vec(xOf(f), inner.y + inner.h)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {[250, 2500].map((f) => (
        <Line key={`x${f}`} p1={vec(xOf(f), inner.y)} p2={vec(xOf(f), inner.y + inner.h)} color="rgba(255,198,77,0.25)" strokeWidth={1} />
      ))}
      <Path path={fill}>
        <LinearGradient start={vec(0, inner.y)} end={vec(0, inner.y + inner.h)} colors={['rgba(111,168,255,0.35)', 'rgba(111,168,255,0.02)']} />
      </Path>
      <Path path={line} style="stroke" strokeWidth={4} color={INK.blue} opacity={0.35}>
        <BlurMask blur={3} style="normal" />
      </Path>
      <Path path={line} style="stroke" strokeWidth={2} color={INK.blue} />
      <SceneText x={xOf(100)} y={b.y + b.h - 4} size={9.5} text="100" color={INK.printDim} align="center" minPt={9.5} />
      <SceneText x={xOf(1000)} y={b.y + b.h - 4} size={9.5} text="1k" color={INK.printDim} align="center" minPt={9.5} />
      <SceneText x={xOf(10000)} y={b.y + b.h - 4} size={9.5} text="10k Hz" color={INK.printDim} align="center" minPt={9.5} />
      <SceneText x={inner.x + inner.w} y={yOf(0) - 3} size={9.5} text="0 dB" color={INK.printDim} align="right" minPt={9.5} />
    </Group>
  );
}

/**
 * One deck's zoomed waveform in a screen-space lane: the real audio's layers
 * (peak envelope, RMS core, low band — waveDraw) scrolling past a fixed
 * playhead at the deck's position, the ANALYSED grid drawn ON TOP with
 * keylines (bars bold amber, beats thin white), a label and the played BPM.
 * `k` grows the words and strokes with the full-screen zoom.
 */
export function WaveLane({ b, d, label, spanSec = 4, colourHead = INK.white, marks = false, k = 1, lowKey = false }: { b: PlotBox; d: DeckState; label: string; spanSec?: number; colourHead?: string; marks?: boolean; k?: number; lowKey?: boolean }) {
  const pos = useDeckPos(d);
  const grid = analysedGrid(d);
  const pps = b.w / spanSec;
  const head = b.x + b.w / 2;
  const mid = b.y + b.h / 2;
  const halfH = b.h / 2 - 2;
  const xf = useDerivedValue(() => [{ translateX: head - pos.value * pps }, { translateY: mid }, { scaleX: pps }, { scaleY: halfH }]);
  const fs = 10 * k;
  const chipW = textWidthPt(label, k) * 0.95 + 12 * k;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={6} color="#040a11" />
      <Group clip={Skia.XYWHRect(b.x, b.y, b.w, b.h)}>
        <Line p1={vec(b.x, mid)} p2={vec(b.x + b.w, mid)} color="rgba(47,116,255,0.35)" strokeWidth={0.8} />
        {d.track ? (
          <Group transform={xf}>
            {marks && d.loop ? <Rect x={d.loop.startSec} y={-1} width={d.loop.lengthSec} height={2} color="rgba(91,255,133,0.16)" /> : null}
            <WaveBody id={d.track} kicks={(2.6 * k) / pps} />
            {grid ? <GridOver id={d.track} grid={grid} pps={pps} k={k} /> : null}
            {marks && d.loop ? (
              <Group>
                <Rect x={d.loop.startSec} y={-1} width={(2 * k) / pps} height={2} color={INK.green} />
                <Rect x={d.loop.startSec + d.loop.lengthSec - (2 * k) / pps} y={-1} width={(2 * k) / pps} height={2} color={INK.green} />
              </Group>
            ) : null}
            {marks ? <Rect x={d.cueSec - (0.8 * k) / pps} y={-1} width={(1.6 * k) / pps} height={2} color={INK.amber} /> : null}
            {marks
              ? d.hotCues.map((c, i) => (c == null ? null : <Rect key={i} x={c - (1.2 * k) / pps} y={-1} width={(2.4 * k) / pps} height={0.5} color={CUE_COLOURS[i]} />))
              : null}
          </Group>
        ) : null}
      </Group>
      {d.track ? (
        <Group>
          <Line p1={vec(head, b.y - 2)} p2={vec(head, b.y + b.h + 2)} color="rgba(0,0,0,0.7)" strokeWidth={3.4 * k} />
          <Line p1={vec(head, b.y - 2)} p2={vec(head, b.y + b.h + 2)} color={colourHead} strokeWidth={1.6 * k} />
        </Group>
      ) : null}
      <RoundedRect x={b.x + 4} y={b.y + 4} width={chipW} height={15 * k} r={4} color="rgba(0,0,0,0.66)" />
      <SceneText x={b.x + 4 + 6 * k} y={b.y + 4 + 11 * k} size={fs} text={label} color={INK.amber} face="label" minPt={9.5} />
      {lowKey ? (
        <Group>
          <RoundedRect x={b.x + b.w - 58 * k} y={b.y + 4} width={54 * k} height={15 * k} r={4} color="rgba(0,0,0,0.66)" />
          <RoundedRect x={b.x + b.w - 54 * k} y={b.y + 4 + 4.5 * k} width={8 * k} height={6 * k} r={1.5} color={WAVE_LOW} />
          <SceneText x={b.x + b.w - 43 * k} y={b.y + 4 + 11 * k} size={fs} text="KICKS" color={INK.print} face="label" minPt={9.5} />
        </Group>
      ) : null}
    </Group>
  );
}
