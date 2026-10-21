/**
 * stemArt — Screen 15's STEM LANES: a deck's four parts (drums, bass, chords,
 * melody) as their own scrolling waveforms, each the real measurement of that
 * part (engine/djStems.stemOverview — the true parts, or the SIMULATED
 * separation's four outputs, where the leakage shows up as sound in the wrong
 * lane), under one playhead at the deck's position.
 *
 * THE HOUSE WAVEFORM (visual review 2 #8): every lane draws the shared stack
 * (waveDraw.WaveBand) — the peak envelope at 55 % over the RMS core, in the
 * stem's own colour — with the deck's beat and bar grid ON TOP, keylined
 * (waveDraw.GridOver). One scale for all four lanes (the track's own headroom
 * gain), so a quiet part looks quiet.
 *
 * THREE LOOKS that are never confused:
 *   playing  the lane in full colour, its pad lit (a rubber cap glowing from
 *            inside);
 *   MUTED    the lane hatched at 45° under the word MUTED, the wave a faint
 *            outline, the pad dark;
 *   GHOST    (SEPARATED, melody muted) what the separation LEFT IN, drawn as a
 *            bright thin trace over the hatch with its level ("LEFT IN −18 dB")
 *            — the leak, not the part.
 *
 * Two decks playing → two compact columns (A left, B right), each with its
 * channel's level going TO THE MIX beside it, so a blend's stems and both
 * faders are in one picture (learning review 2, p15 #1). Screen points.
 */
import { memo, useMemo } from 'react';
import { BlurMask, Group, Line, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { useDeckPos } from './motion';
import { SceneText } from './sceneText';
import { GridOver, WaveBand, waveGain } from './waveDraw';
import { STEM_IDS, trueGrid, type StemId } from '../engine/djMusic';
import { STEM_WORDS, type StemOverview } from '../engine/djStems';
import type { DeckState, StemGains } from '../model/djModel';
import type { Box } from '../geometry/boothGeometry';

export const STEM_COLOUR: Record<StemId, string> = { drums: '#c9a2ff', bass: '#ffb04d', chords: '#6fa8ff', lead: '#5bff85' };

type StemPaths = { peak: SkPath; rms: SkPath };
const pathCache = new WeakMap<StemOverview, Record<StemId, StemPaths>>();
/** Each stem's peak band and RMS core, x in seconds, y in ±1 (up = +). */
function stemPaths(o: StemOverview): Record<StemId, StemPaths> {
  const hit = pathCache.get(o);
  if (hit) return hit;
  const out = {} as Record<StemId, StemPaths>;
  const band = (top: ArrayLike<number>, bot: (c: number) => number, n: number) => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(0, -top[0]);
    for (let c = 1; c < n; c++) p.lineTo(c * o.colSec, -top[c]);
    for (let c = n - 1; c >= 0; c--) p.lineTo(c * o.colSec, -bot(c));
    p.close();
    return p.detach();
  };
  for (const s of STEM_IDS) {
    const hi = o.hi[s];
    const lo = o.lo[s];
    const rm = o.rms?.[s];
    out[s] = { peak: band(hi, (c) => lo[c], hi.length), rms: rm ? band(rm, (c) => -rm[c], rm.length) : band(hi, () => 0, 0) };
  }
  pathCache.set(o, out);
  return out;
}

/** A 45° hatch over a box (screen points). */
function hatchPath(b: Box, step: number): SkPath {
  const p = Skia.PathBuilder.Make();
  for (let x = b.x - b.h; x < b.x + b.w; x += step) {
    p.moveTo(x, b.y + b.h);
    p.lineTo(x + b.h, b.y);
  }
  return p.detach();
}

/** A player's stem pad: a rubber cap seen from above — a radial body, a
 *  top-left rim light, an inner glow when lit — with its name printed as a
 *  silk legend UNDER the pad. */
const StemPad = memo(function StemPad({ b, colour, on, word, fs }: { b: Box; colour: string; on: boolean; word: string; fs: number }) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = Math.min(6, b.h * 0.22);
  return (
    <Group>
      <RoundedRect x={b.x + 1} y={b.y + 2} width={b.w} height={b.h} r={r} color="rgba(0,0,0,0.65)">
        <BlurMask blur={2} style="normal" />
      </RoundedRect>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r}>
        <RadialGradient c={vec(cx - b.w * 0.18, cy - b.h * 0.22)} r={Math.max(b.w, b.h) * 0.8} colors={on ? ['#ffffff', colour, '#1a1b1f'] : ['#3a3c43', '#202227', '#121317']} positions={on ? [0, 0.42, 1] : [0, 0.55, 1]} />
      </RoundedRect>
      {on ? (
        <RoundedRect x={b.x + 3} y={b.y + 3} width={b.w - 6} height={b.h - 6} r={r * 0.7} color={colour} opacity={0.45}>
          <BlurMask blur={4} style="normal" />
        </RoundedRect>
      ) : (
        <RoundedRect x={b.x + 2} y={b.y + 2} width={b.w - 4} height={b.h - 4} r={r * 0.8} style="stroke" strokeWidth={1} color={colour} opacity={0.35} />
      )}
      {/* the rim light on the cap's upper-left edge */}
      <RoundedRect x={b.x + 0.5} y={b.y + 0.5} width={b.w - 1} height={b.h - 1} r={r} style="stroke" strokeWidth={1}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.w, b.y + b.h)} colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.4)']} />
      </RoundedRect>
      <SceneText x={cx} y={b.y + b.h + fs + 1} size={fs} text={word} color={on ? colour : INK.printDim} face="label" align="center" minPt={9} />
    </Group>
  );
});

type Column = { deck: 'A' | 'B'; d: DeckState; ov: StemOverview | null; gains: StemGains; source: 'ORIGINAL' | 'SEPARATED'; ghostDb: number | null; level: number };

/** One deck's four lanes in box `b`. */
function DeckLanes({ b, col, k, spanSec, compact }: { b: Box; col: Column; k: number; spanSec: number; compact: boolean }) {
  const { d, ov, gains, source, deck } = col;
  const pos = useDeckPos(d);
  const paths = useMemo(() => (ov ? stemPaths(ov) : null), [ov]);
  const fs = 9.5 * k;
  const head = b.y + 17 * k;
  const laneH = (b.h - 18 * k) / 4;
  const padW = (compact ? 34 : 50) * k;
  const lx = b.x + padW + 6;
  const lw = b.w - padW - 6;
  const pps = lw / spanSec;
  const cx = lx + lw / 2;
  const xf = useDerivedValue(() => [{ translateX: cx - pos.value * pps }, { scaleX: pps }]);
  const g = (d.track ? waveGain(d.track) : 1) * 1.25;
  const grid = useMemo(() => (d.track ? trueGrid(d.track) : null), [d.track]);
  const ghostLin = col.ghostDb != null ? Math.pow(10, col.ghostDb / 20) : 0;
  return (
    <Group>
      <SceneText x={b.x + 2} y={b.y + 12 * k} size={fs} text={compact ? `DECK ${deck}` : `DECK ${deck} · STEMS`} color={INK.amber} face="label" minPt={9.5} />
      <SceneText x={b.x + b.w - 2} y={b.y + 12 * k} size={fs} text={source === 'ORIGINAL' ? (compact ? 'ORIGINAL' : 'ORIGINAL STEMS') : compact ? 'SEPARATED' : 'SEPARATED (SIMULATED)'} color={source === 'ORIGINAL' ? INK.green : '#ff8a7e'} face="label" align="right" minPt={9.5} />
      {STEM_IDS.map((s, i) => {
        const y0 = head + i * laneH;
        const on = gains[s] > 0;
        const c = STEM_COLOUR[s];
        const lane = { x: lx, y: y0 + 2, w: lw, h: laneH - 4 };
        const mid = lane.y + lane.h / 2;
        const half = lane.h / 2 - 1;
        const padH = Math.max(16, laneH - fs - 9);
        const ghost = !on && s === 'lead' && source === 'SEPARATED' && ghostLin > 0;
        return (
          <Group key={s}>
            <StemPad b={{ x: b.x + 2, y: y0 + 2, w: padW - 4, h: padH }} colour={c} on={on} word={STEM_WORDS[s]} fs={compact ? Math.max(9, fs * 0.92) : fs} />
            <RoundedRect x={lane.x} y={lane.y} width={lane.w} height={lane.h} r={4} color={on ? '#040a11' : '#0a0b0e'} />
            <Group clip={Skia.XYWHRect(lane.x, lane.y, lane.w, lane.h)}>
              <Line p1={vec(lane.x, mid)} p2={vec(lane.x + lane.w, mid)} color="rgba(47,116,255,0.22)" strokeWidth={0.8} />
              {paths && d.track && grid ? (
                <Group transform={[{ translateY: mid }, { scaleY: half }]}>
                  <Group transform={xf}>
                    {on ? (
                      <WaveBand peak={paths[s].peak} rms={paths[s].rms} colour={c} gain={g} />
                    ) : (
                      // muted: only a faint shadow of what is not playing
                      <WaveBand peak={paths[s].peak} rms={paths[s].rms} colour="#8a8f99" gain={g} opacity={0.12} />
                    )}
                    {ghost ? (
                      // the separation's leftover: the melody at the ghost's level, BRIGHT
                      <Group transform={[{ scaleY: g * ghostLin }]}>
                        <Path path={paths[s].peak} color={c} opacity={0.95} />
                      </Group>
                    ) : null}
                    <GridOver id={d.track} grid={grid} pps={pps} k={Math.min(k, 1.6)} />
                  </Group>
                </Group>
              ) : null}
              {!on ? (
                <Group>
                  <Path path={hatchPath(lane, 7 * k)} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.12)" />
                  <RoundedRect x={lane.x + 4} y={mid - fs * 0.75} width={fs * 4.1} height={fs * 1.5} r={3} color="rgba(10,11,14,0.85)" />
                  <SceneText x={lane.x + 6} y={mid + fs * 0.36} size={fs} text="MUTED" color={INK.print} face="label" minPt={9} />
                </Group>
              ) : null}
            </Group>
            {ghost && col.ghostDb != null ? (
              <Group>
                <RoundedRect x={lane.x + lane.w - fs * 7.4 - 4} y={lane.y + 2} width={fs * 7.4} height={fs * 1.4} r={3} color="rgba(10,11,14,0.85)" />
                <SceneText x={lane.x + lane.w - 6} y={lane.y + 2 + fs * 1.05} size={fs} text={`LEFT IN ${col.ghostDb.toFixed(0)} dB`} color={c} face="label" align="right" minPt={9} />
              </Group>
            ) : null}
          </Group>
        );
      })}
      {!paths ? <SceneText x={lx + lw / 2} y={head + 2 * laneH} size={fs} text="MEASURING THE PARTS…" color={INK.printDim} face="label" align="center" minPt={9.5} /> : null}
      <Line p1={vec(cx, head)} p2={vec(cx, head + 4 * laneH)} color="rgba(0,0,0,0.7)" strokeWidth={3.4} />
      <Line p1={vec(cx, head)} p2={vec(cx, head + 4 * laneH)} color={INK.white} strokeWidth={1.6} />
    </Group>
  );
}

/** The channel's level going TO THE MIX (its fader), a slim bar. */
function MixBar({ x, y, h, level, ch, k }: { x: number; y: number; h: number; level: number; ch: 1 | 2; k: number }) {
  const w = 8 * k;
  const fill = Math.max(0, Math.min(1, level));
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={2} color="#0b0c10" />
      <RoundedRect x={x} y={y + h * (1 - fill)} width={w} height={h * fill} r={2}>
        <LinearGradient start={vec(0, y + h)} end={vec(0, y)} colors={['#1d6b3a', INK.green]} />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={h} r={2} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.18)" />
      <SceneText x={x + w / 2} y={y - 4} size={9.5 * k} text={`CH${ch}`} color={fill > 0.02 ? INK.green : INK.printDim} face="label" align="center" minPt={9} />
    </Group>
  );
}

/**
 * The stems display. `cols`: one deck (the selected one), or both decks when
 * both play. Each column carries its channel's level to the mix.
 */
export function StemLanes({ b, cols, k = 1 }: { b: Box; cols: readonly Column[]; k?: number }) {
  const two = cols.length > 1;
  const fs = 9.5 * k;
  const barW = 8 * k;
  const gap = 8 * k;
  const colW = two ? (b.w - 16 - gap - 2 * (barW + 6 * k)) / 2 : b.w - 16 - (barW + 6 * k);
  const top = b.y + 6;
  const h = b.h - 12;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      {cols.map((c, i) => {
        const x0 = b.x + 8 + i * (colW + barW + 6 * k + gap);
        return (
          <Group key={c.deck}>
            <DeckLanes b={{ x: x0, y: top, w: colW, h }} col={c} k={k} spanSec={two ? 3 : 6} compact={two} />
            <MixBar x={x0 + colW + 4 * k} y={top + 17 * k + fs * 0.6} h={h - 17 * k - fs * 0.6} level={c.level} ch={c.deck === 'A' ? 1 : 2} k={k} />
          </Group>
        );
      })}
    </Group>
  );
}

export type { Column as StemColumn };
