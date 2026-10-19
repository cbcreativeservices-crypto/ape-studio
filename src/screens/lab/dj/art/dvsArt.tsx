/**
 * dvsArt — Screen 18's drawings (screen points):
 *
 *   DvsScope  the control signal as the DVS software sees it: its two sides
 *             plotted against each other (L across, R up), the ring a
 *             quadrature tone draws — from the render's own samples after
 *             the mixer's phono stage (engine/djStage2.controlScope). Round
 *             and sharp = good; hum wobbles it, a hot signal squares it, a
 *             dirty record fuzzes it, a stopped platter is a dot.
 *   DvsRoute  where each signal goes: the turntable's CONTROL tone into the
 *             mixer's PHONO jacks and over USB to the software; the software's
 *             MUSIC back over USB 1/2 to channel 1 and the crowd — and, in
 *             red, a control tone on its way to the speakers.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { SceneText } from './sceneText';
import { DNode, DWire } from './s2Diagram';
import type { Box } from '../geometry/boothGeometry';
import { DVS_MODE_WORDS, type DvsLock, type DvsMode } from '../model/djDvs';

export function DvsScope({ b, scope, quality, lock, mode, k = 1 }: { b: Box; scope: { l: number[]; r: number[] } | null; quality: number; lock: DvsLock; mode: DvsMode; k?: number }) {
  const fs = 9.5 * k;
  const cx = b.x + b.w / 2;
  const top = b.y + 18 * k;
  const bot = b.y + b.h - 26 * k;
  const R = Math.min(b.w - 16, bot - top) / 2;
  const cy = (top + bot) / 2;
  const dots = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (scope) for (let i = 0; i < scope.l.length; i++) p.addCircle(cx + scope.l[i] * R, cy - scope.r[i] * R, 1.1);
    return p.detach();
  }, [scope, cx, cy, R]);
  const tint = lock === 'LOCKED' ? INK.green : lock === 'UNSTABLE' ? INK.amber : lock === 'IGNORED' ? INK.printDim : INK.peak;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={fs} text="CONTROL SIGNAL" color={INK.amber} face="label" minPt={9.5} />
      <Line p1={vec(cx - R, cy)} p2={vec(cx + R, cy)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Line p1={vec(cx, cy - R)} p2={vec(cx, cy + R)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={R * 0.5} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.18)">
        <DashPathEffect intervals={[3, 3]} />
      </Circle>
      <Path path={dots} color={tint} opacity={0.4}>
        <BlurMask blur={2} style="normal" />
      </Path>
      <Path path={dots} color={tint} />
      <SceneText x={b.x + 8} y={b.y + b.h - 15 * k} size={fs} text={`${Math.round(quality * 100)} % · ${lock}`} color={tint} face="label" minPt={9.5} />
      <SceneText x={b.x + 8} y={b.y + b.h - 4} size={fs} text={DVS_MODE_WORDS[mode]} color={INK.white} face="label" minPt={9.5} />
    </Group>
  );
}

export function DvsRoute({ b, ttPlaying, toneOnCh1, thru, lock, chInput, musicLive, k = 1 }: { b: Box; ttPlaying: boolean; toneOnCh1: boolean; thru: boolean; lock: DvsLock; chInput: string; musicLive: boolean; k?: number }) {
  const fs = 10.6 * k;
  const w = (b.w - 24) / 2;
  const h = 32 * k;
  const gx = b.x + 8;
  const gx2 = gx + w + 8;
  const ry = (i: number) => b.y + 20 * k + i * (h + 12 * k);
  const tt: Box = { x: gx, y: ry(0), w, h };
  const ph: Box = { x: gx2, y: ry(0), w, h };
  const sw: Box = { x: gx2, y: ry(1), w, h };
  const ch: Box = { x: gx, y: ry(2), w, h };
  const cr: Box = { x: gx2, y: ry(2), w, h };
  const R = (x: Box): [number, number] => [x.x + x.w, x.y + x.h / 2];
  const L = (x: Box): [number, number] => [x.x, x.y + x.h / 2];
  const B = (x: Box): [number, number] => [x.x + x.w / 2, x.y + x.h];
  const T = (x: Box): [number, number] => [x.x + x.w / 2, x.y];
  const ctrlLive = ttPlaying;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={9.5 * k} text="WHERE EACH SIGNAL GOES" color={INK.amber} face="label" minPt={9.5} />
      <DNode b={tt} title="TURNTABLE" sub="CONTROL REC." live={ttPlaying} tone="amber" size={fs} />
      <DNode b={ph} title="MIXER PHONO" sub="IN, TO USB" live={ttPlaying} tone="amber" size={fs} />
      <DNode b={sw} title="SOFTWARE" sub={lock === 'IGNORED' ? 'INTERNAL' : lock} live={musicLive || thru} tone={lock === 'LOST' ? 'red' : 'blue'} size={fs} />
      <DNode b={ch} title="CHANNEL 1" sub={`INPUT ${chInput}`} live={musicLive || toneOnCh1} tone={toneOnCh1 ? 'red' : 'blue'} size={fs} />
      <DNode b={cr} title="CROWD" sub={toneOnCh1 ? 'HEARS THE TONE' : 'MASTER'} live={musicLive || toneOnCh1} tone={toneOnCh1 ? 'red' : 'blue'} size={fs} />
      <DWire pts={[R(tt), L(ph)]} kind="control" live={ctrlLive} />
      <DWire pts={[B(ph), T(sw)]} kind="control" live={ctrlLive && chInput !== 'x'} />
      <SceneText x={sw.x + sw.w / 2 + 6} y={ph.y + ph.h + 10 * k} size={fs} text="USB" color={INK.amber} face="label" minPt={9.5} />
      <DWire pts={[[sw.x, sw.y + sw.h / 2], [ch.x + ch.w / 2, sw.y + sw.h / 2], T(ch)]} kind={thru ? 'loop' : 'audio'} live={(musicLive || thru) && chInput === 'USB'} />
      <SceneText x={ch.x + 4} y={sw.y + sw.h / 2 - 4} size={fs} text={thru ? 'USB 1/2 · TONE (THRU)' : 'USB 1/2 · MUSIC'} color={thru ? INK.peak : INK.blue} face="label" minPt={9.5} />
      {toneOnCh1 && chInput === 'PHONO' ? <DWire pts={[[ph.x, ph.y + ph.h - 4], [tt.x + tt.w - 8, ph.y + ph.h - 4], [tt.x + tt.w - 8, ch.y]]} kind="loop" live /> : null}
      <DWire pts={[R(ch), L(cr)]} kind={toneOnCh1 ? 'loop' : 'audio'} live={musicLive || toneOnCh1} />
    </Group>
  );
}
