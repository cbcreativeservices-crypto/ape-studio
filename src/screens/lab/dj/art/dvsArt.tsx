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
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { RcaSocket, UsbB } from './parts';
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

/**
 * The DVS CABLING, face-on at the rear (visual review 2 #12): the turntable's
 * rear (ground lug, RCA pair), the mixer's rear (GND post, PHONO 1 pair, its
 * USB-B socket) and the laptop seen from its left side (base, keyboard deck,
 * lid, its USB-A port). The control tone's RCA leads, the ground lead and the
 * USB cable each run in their OWN lane, flagged on the run ("CTRL L/R",
 * "USB"); a loose ground spade hangs off its post. Screen points.
 */
export function DvsRig({ b, gnd, ttPlaying, usbLive, k = 1 }: { b: Box; gnd: boolean; ttPlaying: boolean; usbLive: boolean; k?: number }) {
  const fs = 9.5 * k;
  const top = b.y + fs + 6;
  const h = b.h - fs - 10;
  const ttW = Math.min(50 * k, b.w * 0.24);
  const mxW = Math.min(58 * k, b.w * 0.28);
  const lpW = Math.min(46 * k, b.w * 0.22);
  const gap = (b.w - ttW - mxW - lpW - 8) / 2;
  const tt = { x: b.x + 4, y: top, w: ttW, h };
  const mx = { x: tt.x + ttW + gap, y: top, w: mxW, h };
  const lp = { x: mx.x + mxW + gap, y: top, w: lpW, h };
  const step = h / 4.6;
  const row = (i: number) => top + step * (i + 0.65);
  const d = Math.min(10 * k, step * 0.74);
  const tx = tt.x + tt.w * 0.68;
  const mxs = mx.x + mx.w * 0.3;
  const lug = { x: tx, y: row(0) };
  const post = { x: mxs, y: row(0) };
  const L = { y: row(1) };
  const R = { y: row(2) };
  const usb = { x: mx.x + mx.w * 0.72, y: row(3) };
  const port = { x: lp.x + 6 * k, y: row(3) };
  const plate = (r: Box, title: string) => (
    <Group>
      <RoundedRect x={r.x} y={r.y} width={r.w} height={r.h} r={4}>
        <LinearGradient start={vec(0, r.y)} end={vec(0, r.y + r.h)} colors={['#2a2c31', '#17181c']} />
      </RoundedRect>
      <RoundedRect x={r.x + 0.5} y={r.y + 0.5} width={r.w - 1} height={r.h - 1} r={4} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
      <SceneText x={r.x + r.w / 2} y={r.y - 3} size={fs} text={title} color={INK.print} face="label" align="center" minPt={9.5} />
    </Group>
  );
  const plug = (x: number, y: number, ring: string) => (
    <Group>
      <Circle cx={x} cy={y} r={d * 0.6}>
        <RadialGradient c={vec(x - d * 0.15, y - d * 0.2)} r={d * 0.7} colors={['#e1e5ea', '#8a9099', '#3a3e45']} />
      </Circle>
      <Circle cx={x} cy={y} r={d * 0.6} style="stroke" strokeWidth={d * 0.16} color={ring} />
    </Group>
  );
  const flag = (x: number, y: number, t: string, c: string) => {
    const w = t.length * fs * 0.56 + 8;
    return (
      <Group>
        <RoundedRect x={x - w / 2} y={y - fs * 0.75} width={w} height={fs * 1.5} r={3} color="rgba(8,8,10,0.9)" />
        <RoundedRect x={x - w / 2} y={y - fs * 0.75} width={w} height={fs * 1.5} r={3} style="stroke" strokeWidth={1} color={c} opacity={0.7} />
        <SceneText x={x} y={y + fs * 0.36} size={fs} text={t} color={c} face="label" align="center" minPt={9.5} />
      </Group>
    );
  };
  const g1 = (tt.x + tt.w + mx.x) / 2;
  const g2 = (mx.x + mx.w + lp.x) / 2;
  const ctrl = ttPlaying ? INK.amber : INK.printDim;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      {plate(tt, 'TURNTABLE')}
      {plate(mx, 'MIXER REAR')}
      {/* the laptop, seen from its left side: base, lid, its USB port */}
      <SceneText x={lp.x + lp.w / 2} y={lp.y - 3} size={fs} text="LAPTOP" color={INK.print} face="label" align="center" minPt={9.5} />
      <RoundedRect x={lp.x} y={row(3) - 5 * k} width={lp.w} height={10 * k} r={3 * k}>
        <LinearGradient start={vec(0, row(3) - 5 * k)} end={vec(0, row(3) + 5 * k)} colors={['#5a5e66', '#33363c', '#1e2024']} />
      </RoundedRect>
      {/* the lid, open and leaning back from its hinge at the rear: its
          outer shell and, inside it, the screen's edge */}
      {(() => {
        const hx = lp.x + lp.w - 4 * k;
        const hy = row(3) - 5 * k;
        const len = Math.min(lp.w * 0.95, hy - lp.y - 4);
        const a = (100 * Math.PI) / 180;
        const tx = hx - Math.cos(a) * len;
        const ty = hy - Math.sin(a) * len;
        const p = Skia.PathBuilder.Make();
        p.moveTo(hx, hy);
        p.lineTo(tx, ty);
        p.lineTo(tx - 4.5 * k, ty + 0.8 * k);
        p.lineTo(hx - 5 * k, hy);
        p.close();
        return (
          <Group>
            <Path path={p.detach()}>
              <LinearGradient start={vec(hx - 5 * k, 0)} end={vec(hx, 0)} colors={['#1a1b1f', '#4a4e56']} />
            </Path>
            <Line p1={vec(hx - 4.6 * k, hy - 2 * k)} p2={vec(tx - 4 * k, ty + 2 * k)} color="#0f2233" strokeWidth={1.4 * k} />
            <Circle cx={hx - 2.5 * k} cy={hy} r={2 * k} color="#5a5e66" />
          </Group>
        );
      })()}
      <RoundedRect x={port.x - 2 * k} y={port.y - 2 * k} width={6 * k} height={4 * k} r={1} color="#050506" />
      {/* the turntable's ground lug and RCA pair */}
      <Circle cx={lug.x} cy={lug.y} r={d * 0.4}>
        <RadialGradient c={vec(lug.x - 1, lug.y - 1)} r={d * 0.5} colors={['#e1e5ea', '#6c727b']} />
      </Circle>
      <RcaSocket cx={tx} cy={L.y} d={d} ring="#e9ecef" />
      <RcaSocket cx={tx} cy={R.y} d={d} ring="#d9453a" />
      <SceneText x={tt.x + 3} y={lug.y + fs * 0.36} size={fs} text="GND" color={INK.printDim} face="label" minPt={9.5} />
      {/* the mixer's GND post, PHONO 1 pair and USB-B socket */}
      <Circle cx={post.x} cy={post.y} r={d * 0.46}>
        <RadialGradient c={vec(post.x - 1.5, post.y - 1.5)} r={d * 0.6} colors={['#f2d27a', '#9a7a2a']} />
      </Circle>
      <RcaSocket cx={mxs} cy={L.y} d={d} ring="#e9ecef" />
      <RcaSocket cx={mxs} cy={R.y} d={d} ring="#d9453a" />
      <UsbB x={usb.x - 6 * (d / 10)} y={usb.y - 5.5 * (d / 10)} s={d / 10} />
      <SceneText x={mx.x + mx.w - 3} y={(L.y + R.y) / 2 + fs * 0.36} size={fs} text="PH 1" color={INK.amber} face="label" align="right" minPt={9.5} />
      <SceneText x={mx.x + 3} y={usb.y + fs * 0.36} size={fs} text="USB" color={INK.print} face="label" minPt={9.5} />
      {/* the leads, each in its own lane */}
      {gnd ? (
        <Line p1={vec(lug.x, lug.y)} p2={vec(post.x, post.y)} color="#8a9099" strokeWidth={1.6 * k} />
      ) : (
        <Group>
          <Path path={(() => { const p = Skia.PathBuilder.Make(); p.moveTo(lug.x, lug.y); p.lineTo(g1 - 4 * k, lug.y); p.lineTo(g1 - 6 * k, lug.y + step * 0.55); return p.detach(); })()} style="stroke" strokeWidth={1.6 * k} color="#8a9099" />
          <RoundedRect x={g1 - 9 * k} y={lug.y + step * 0.55} width={6 * k} height={4 * k} r={1} color="#c9ced5" />
          <SceneText x={g1} y={b.y + fs} size={fs} text="LOOSE" color={INK.peak} face="label" align="center" minPt={9.5} />
        </Group>
      )}
      <Line p1={vec(tx, L.y)} p2={vec(mxs, L.y)} color="#c9ccd2" strokeWidth={3 * k} strokeCap="round" />
      <Line p1={vec(tx, R.y)} p2={vec(mxs, R.y)} color="#c0392b" strokeWidth={3 * k} strokeCap="round" />
      {ttPlaying ? <Line p1={vec(tx, (L.y + R.y) / 2)} p2={vec(mxs, (L.y + R.y) / 2)} color={INK.amber} strokeWidth={6 * k} opacity={0.18} /> : null}
      {plug(tx, L.y, '#e9ecef')}
      {plug(tx, R.y, '#d9453a')}
      {plug(mxs, L.y, '#e9ecef')}
      {plug(mxs, R.y, '#d9453a')}
      <Line p1={vec(usb.x, usb.y)} p2={vec(port.x, port.y)} color="#3a3d43" strokeWidth={3.4 * k} strokeCap="round" />
      {usbLive ? <Line p1={vec(usb.x, usb.y)} p2={vec(port.x, port.y)} color={INK.blue} strokeWidth={7 * k} opacity={0.22} /> : null}
      <RoundedRect x={usb.x - 4 * k} y={usb.y - 4 * k} width={8 * k} height={8 * k} r={2} color="#2a2c31" />
      <RoundedRect x={port.x - 8 * k} y={port.y - 3.5 * k} width={10 * k} height={7 * k} r={2} color="#2a2c31" />
      {flag(g1, (L.y + R.y) / 2, 'CTRL L/R', ctrl)}
      {flag(g2, usb.y, 'USB', usbLive ? INK.blue : INK.printDim)}
    </Group>
  );
}

export function DvsRoute({ b, ttPlaying, toneOnCh1, thru, lock, chInput, musicLive, k = 1, flow = false }: { b: Box; ttPlaying: boolean; toneOnCh1: boolean; thru: boolean; lock: DvsLock; chInput: string; musicLive: boolean; k?: number; flow?: boolean }) {
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
      <DWire pts={[R(tt), L(ph)]} kind="control" live={ctrlLive} flow={flow} />
      <DWire pts={[B(ph), T(sw)]} kind="control" live={ctrlLive && chInput !== 'x'} flow={flow} />
      <SceneText x={sw.x + sw.w / 2 + 6} y={ph.y + ph.h + 10 * k} size={fs} text="USB" color={INK.amber} face="label" minPt={9.5} />
      <DWire pts={[[sw.x, sw.y + sw.h / 2], [ch.x + ch.w / 2, sw.y + sw.h / 2], T(ch)]} kind={thru ? 'loop' : 'audio'} live={(musicLive || thru) && chInput === 'USB'} flow={flow} />
      <SceneText x={ch.x + 4} y={sw.y + sw.h / 2 - 4} size={fs} text={thru ? 'USB 1/2 · TONE (THRU)' : 'USB 1/2 · MUSIC'} color={thru ? INK.peak : INK.blue} face="label" minPt={9.5} />
      {toneOnCh1 && chInput === 'PHONO' ? <DWire pts={[[ph.x, ph.y + ph.h - 4], [tt.x + tt.w - 8, ph.y + ph.h - 4], [tt.x + tt.w - 8, ch.y]]} kind="loop" live flow={flow} /> : null}
      <DWire pts={[R(ch), L(cr)]} kind={toneOnCh1 ? 'loop' : 'audio'} live={musicLive || toneOnCh1} flow={flow} />
    </Group>
  );
}
