/**
 * bMusic — the MUSIC strip (pages 14 and 22): TIME.
 *
 * The four-bar phrase from left to right: four bars, sixteen beats, and a
 * PLAY LINE that crosses it once every phrase, placed from the model's own
 * clock (scene time − music.t0, at the music's tempo). Under it, one lane for
 * each layer:
 *
 *   filled         the layer SOUNDS (the set last applied, not the set asked)
 *   outline        it plays at zero level
 *   dashed, amber  it WAITS: from the marker onward it will come in (▸) or
 *                  go out (the filled lane ends at the marker)
 *
 * A change that waits is a solid amber diamond ON THE BOUNDARY IT WILL LAND
 * ON, with a line down through the lanes, and the time left counts down
 * beside the lane names. When nothing waits, a hollow diamond shows where a
 * change asked for NOW would land: it hops beat to beat, bar to bar, sits on
 * the phrase end, or rides the play line, as CHANGE AT says. A withdrawn
 * change keeps its diamond for one bar, struck through. A stinger is a flag
 * on its boundary: hollow while it waits, filled while it sounds.
 *
 * MOTION. One frame clock (bClock.useBNow) moves the play line and the
 * countdown, and redraws the marks that depend on time. It runs while the
 * music does. With motion reduced the play line steps once per beat.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Line, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { gaNow } from '../../model/gaStore';
import type { GaState } from '../../model/gaModel';
import type { GaHudProps } from './gaHudTypes';
import { B, BGlass, BText } from './bKit';
import { useBMemo, useBNow } from './bClock';
import { B_BARS, B_BEATS, B_BEAT_S, B_WITHDRAWN_SHOW_S, bBeatStep01, bChange, bGhostAt, bLand01, bLanes, bMusicSummary, bPlay01, bStingers, type BMemo } from './bModel';

const LANE_Y = [19.5, 30, 40.5] as const;
const LANE_H = 7;
const HEAD_Y = 7;

const DIAMOND = (() => {
  const p = Skia.Path.Make();
  p.moveTo(0, -4.6);
  p.lineTo(3.6, 0);
  p.lineTo(0, 4.6);
  p.lineTo(-3.6, 0);
  p.close();
  return p;
})();
/** A pennant flying LEFT of its pole (the bar numbers stand right of a line). */
const PENNANT = (() => {
  const p = Skia.Path.Make();
  p.moveTo(0, -5);
  p.lineTo(-7, -2.2);
  p.lineTo(0, 0.6);
  p.close();
  return p;
})();
const PLAY_CAP = (() => {
  const p = Skia.Path.Make();
  p.moveTo(-3.2, 1);
  p.lineTo(3.2, 1);
  p.lineTo(0, 5.6);
  p.close();
  return p;
})();
/** ▸ on a lane: this layer comes in here. */
const ENTER = (() => {
  const p = Skia.Path.Make();
  p.moveTo(0, -3.5);
  p.lineTo(4.2, 0);
  p.lineTo(0, 3.5);
  p.close();
  return p;
})();

function Diamond({ x, kind }: { x: number; kind: 'waiting' | 'ghost' | 'withdrawn' }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: HEAD_Y }]}>
      {kind === 'waiting' ? <Path path={DIAMOND} color={B.amber} /> : <Path path={DIAMOND} color={B.ground} />}
      <Path path={DIAMOND} style="stroke" strokeWidth={1.1} strokeJoin="round" color={kind === 'withdrawn' ? B.muted : B.amber} />
      {kind === 'withdrawn' ? <Line p1={vec(-5.5, 5)} p2={vec(5.5, -5)} color={B.refuse} strokeWidth={1.5} strokeCap="round" /> : null}
    </Group>
  );
}

export function BMusicHud({ w, h, state }: GaHudProps) {
  const m = useBMemo();
  // the frame clock (outside the canvas: the strip is redrawn with its time):
  // it runs while the music does; with motion reduced the play line steps
  // once per beat (the clock is woken often enough to land on each)
  const at = gaNow();
  const keep = state.music.on || (!!m.withdrawn && at - m.withdrawn.at < B_WITHDRAWN_SHOW_S);
  const [now, smooth] = useBNow(keep, 0.1);
  // the words change at most once a beat, not once a frame
  const label = bMusicSummary(state, Math.floor(now / B_BEAT_S) * B_BEAT_S);
  return (
    <BGlass w={w} h={h} label={label}>
      {(W) => <MusicStrip W={W} s={state} m={m} now={now} smooth={smooth} />}
    </BGlass>
  );
}

function MusicStrip({ W, s, m, now, smooth }: { W: number; s: GaState; m: BMemo; now: number; smooth: boolean }) {
  const x0 = 54;
  const x1 = W - 9;
  const tw = x1 - x0;
  const on = s.music.on;
  const t0 = s.music.t0;
  const lanes = bLanes(s);
  const change = bChange(s, now);
  const rides = change ? change.rides : s.options.musicBoundary === 'now';
  const landX = change && !rides ? x0 + tw * bLand01(t0, change.landAt) : null;
  const ghostX = on && !change && !rides ? x0 + tw * bLand01(t0, bGhostAt(s, now)) : null;
  const withdrawn = on && m.withdrawn && now - m.withdrawn.at < B_WITHDRAWN_SHOW_S ? m.withdrawn : null;
  const stingers = bStingers(s, now);
  const p = bPlay01(s, now);
  const playX = x0 + tw * (smooth ? p : bBeatStep01(p));
  // the time left: to the change that waits, else to a stinger's line
  const due = change ? change.landAt : Math.min(Infinity, ...stingers.filter((x) => !x.sounding).map((x) => x.landAt));
  const count = on && due !== Infinity ? `${Math.max(0, due - now).toFixed(1)} s` : '';

  const bars = useMemo(() => Array.from({ length: B_BARS }, (_, b) => b), []);
  const beats = useMemo(() => Array.from({ length: B_BEATS + 1 }, (_, b) => b), []);

  return (
    <Group>
      {/* the grid: four bars, sixteen beats */}
      {beats.map((b) => {
        const x = x0 + (tw * b) / B_BEATS;
        const bar = b % (B_BEATS / B_BARS) === 0;
        return <Line key={b} p1={vec(x, bar ? 2 : 12)} p2={vec(x, bar ? 46 : 15)} color={bar ? B.rule : B.muted} strokeWidth={1} opacity={bar ? 1 : 0.8} />;
      })}
      {bars.map((b) => (
        <BText key={b} x={x0 + (tw * b) / B_BARS + 6} y={10.6} text={String(b + 1)} face="mono" color={on ? B.sub : B.muted} />
      ))}

      {/* the lanes */}
      {lanes.map((l, i) => {
        const y = LANE_Y[i] - LANE_H / 2;
        const cut = landX;
        const fillTo = l.sounding ? (l.waiting === 'out' && cut != null ? cut : x1) : x0;
        return (
          <Group key={l.layer}>
            <BText x={6} y={LANE_Y[i] + 3.5} text={l.name} color={l.sounding ? B.ink : B.sub} />
            <RoundedRect x={x0} y={y} width={tw} height={LANE_H} r={2} style="stroke" strokeWidth={1} color={B.rule} />
            {fillTo > x0 + 0.5 ? <RoundedRect x={x0} y={y} width={fillTo - x0} height={LANE_H} r={2} color={B.layer} opacity={0.88} /> : null}
            {l.waiting && cut != null && x1 - cut > 1 ? (
              <RoundedRect x={cut} y={y} width={x1 - cut} height={LANE_H} r={2} style="stroke" strokeWidth={1.2} color={B.amber}>
                <DashPathEffect intervals={[3, 2.4]} />
              </RoundedRect>
            ) : null}
            {l.waiting && cut != null ? (
              <Group transform={[{ translateX: Math.min(cut, x1 - 4.4) }, { translateY: LANE_Y[i] }]}>
                <Path path={ENTER} color={l.waiting === 'in' ? B.amber : B.ground} />
                <Path path={ENTER} style="stroke" strokeWidth={1} strokeJoin="round" color={B.amber} />
              </Group>
            ) : null}
          </Group>
        );
      })}

      {/* a withdrawn change: its diamond stays for one bar, struck through */}
      {withdrawn ? <Diamond x={x0 + tw * bLand01(t0, withdrawn.landAt)} kind="withdrawn" /> : null}

      {/* the change that waits, on its boundary */}
      {landX != null ? (
        <Group>
          <Line p1={vec(landX, HEAD_Y + 4)} p2={vec(landX, 46)} color={B.amber} strokeWidth={1.2} />
          <Diamond x={landX} kind="waiting" />
        </Group>
      ) : null}
      {ghostX != null ? <Diamond x={ghostX} kind="ghost" /> : null}

      {/* stingers: a flag on the boundary */}
      {stingers.map((x) => {
        const sx = x0 + tw * bLand01(t0, x.landAt);
        // a change and a stinger can share a line: the pennant then flies to the
        // right of the diamond instead of under it (the pole stays on the line)
        const marks = [landX, ghostX, withdrawn ? x0 + tw * bLand01(t0, withdrawn.landAt) : null];
        const shared = marks.some((mx) => mx != null && Math.abs(mx - sx) < 5);
        return (
          <Group key={x.key} transform={[{ translateX: sx }, { translateY: HEAD_Y }]}>
            <Line p1={vec(0, -5)} p2={vec(0, 7)} color={B.guide} strokeWidth={1.3} />
            <Group transform={shared ? [{ translateX: 4 }, { scaleX: -1 }] : []}>
              <Path path={PENNANT} color={x.sounding ? B.guide : B.ground} />
              <Path path={PENNANT} style="stroke" strokeWidth={1.1} strokeJoin="round" color={B.guide} />
            </Group>
          </Group>
        );
      })}

      {/* the play line, from the music's clock */}
      {on ? (
        <Group transform={[{ translateX: playX }]}>
          <Line p1={vec(0, 3)} p2={vec(0, 46)} color={B.ink} strokeWidth={1.4} />
          <Path path={PLAY_CAP} color={B.ink} />
          {rides ? <Diamond x={0} kind={change ? 'waiting' : 'ghost'} /> : null}
        </Group>
      ) : null}

      {/* over the lane names: the time left, or that the music is stopped */}
      {on ? <BText x={6} y={10.6} text={count} face="mono" color={B.amber} /> : <BText x={6} y={10.6} text="STOPPED" color={B.sub} />}
    </Group>
  );
}
