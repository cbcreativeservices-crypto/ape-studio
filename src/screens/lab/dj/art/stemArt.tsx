/**
 * stemArt — Screen 15's STEM LANES: one deck's four parts (drums, bass,
 * chords, melody) as their own scrolling waveforms, each the real min/max of
 * that part (engine/djStems.stemOverview — the true parts, or the SIMULATED
 * separation's four outputs, where the leakage shows up as sound in the wrong
 * lane), under one playhead at the deck's position. A muted stem's lane goes
 * dark with its pad unlit. Screen points; fills only, so the scroll is one
 * transform per frame.
 */
import { useMemo } from 'react';
import { Group, Line, Path, RoundedRect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { INK } from './ink';
import { useDeckPos } from './motion';
import { SceneText } from './sceneText';
import { STEM_IDS, type StemId } from '../engine/djMusic';
import { STEM_WORDS, type StemOverview } from '../engine/djStems';
import type { DeckState, StemGains } from '../model/djModel';
import type { Box } from '../geometry/boothGeometry';

export const STEM_COLOUR: Record<StemId, string> = { drums: '#c9a2ff', bass: '#ffb04d', chords: '#6fa8ff', lead: '#5bff85' };

const pathCache = new WeakMap<StemOverview, Record<StemId, SkPath>>();
/** Each stem's min/max band, x in seconds, y in ±1 (up = positive). */
function stemPaths(o: StemOverview): Record<StemId, SkPath> {
  const hit = pathCache.get(o);
  if (hit) return hit;
  const out = {} as Record<StemId, SkPath>;
  for (const s of STEM_IDS) {
    const hi = o.hi[s];
    const lo = o.lo[s];
    const p = Skia.PathBuilder.Make();
    p.moveTo(0, -hi[0]);
    for (let c = 1; c < hi.length; c++) p.lineTo(c * o.colSec, -hi[c]);
    for (let c = hi.length - 1; c >= 0; c--) p.lineTo(c * o.colSec, -lo[c]);
    p.close();
    out[s] = p.detach();
  }
  pathCache.set(o, out);
  return out;
}

export function StemLanes({ b, d, deck, ov, gains, source, k = 1, spanSec = 6, gain = 1.6 }: { b: Box; d: DeckState; deck: 'A' | 'B'; ov: StemOverview | null; gains: StemGains; source: 'ORIGINAL' | 'SEPARATED'; k?: number; spanSec?: number; gain?: number }) {
  const pos = useDeckPos(d);
  const paths = useMemo(() => (ov ? stemPaths(ov) : null), [ov]);
  const head = b.y + 18 * k;
  const laneH = (b.h - 22 * k) / 4;
  const padW = 64 * k;
  const lx = b.x + padW + 6;
  const lw = b.w - padW - 10;
  const pps = lw / spanSec;
  const cx = lx + lw / 2;
  const xf = useDerivedValue(() => [{ translateX: cx - pos.value * pps }, { scaleX: pps }]);
  const fs = 9.5 * k;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} color="rgba(6,7,9,0.94)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={8} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      <SceneText x={b.x + 8} y={b.y + 13 * k} size={fs} text={`DECK ${deck} · STEMS`} color={INK.amber} face="label" minPt={9.5} />
      <SceneText x={b.x + b.w - 8} y={b.y + 13 * k} size={fs} text={source === 'ORIGINAL' ? 'ORIGINAL STEMS' : 'SEPARATED (SIMULATED)'} color={source === 'ORIGINAL' ? INK.green : '#ff8a7e'} face="label" align="right" minPt={9.5} />
      {STEM_IDS.map((s, i) => {
        const y0 = head + i * laneH;
        const on = gains[s] > 0;
        const mid = y0 + laneH / 2;
        const c = STEM_COLOUR[s];
        return (
          <Group key={s}>
            {/* the stem's pad: lit when the stem plays */}
            <RoundedRect x={b.x + 6} y={y0 + 3} width={padW - 4} height={laneH - 6} r={5} color={on ? c : '#1d1f24'} opacity={on ? 0.85 : 1} />
            <RoundedRect x={b.x + 6} y={y0 + 3} width={padW - 4} height={laneH - 6} r={5} style="stroke" strokeWidth={1} color={on ? 'rgba(255,255,255,0.45)' : c} opacity={on ? 1 : 0.5} />
            <SceneText x={b.x + 6 + (padW - 4) / 2} y={mid + fs * 0.36} size={fs} text={STEM_WORDS[s]} color={on ? '#0b0c0f' : c} face="label" align="center" minPt={9.5} />
            <RoundedRect x={lx} y={y0 + 2} width={lw} height={laneH - 4} r={4} color="#040a11" />
            <Group clip={Skia.XYWHRect(lx, y0 + 2, lw, laneH - 4)}>
              <Line p1={vec(lx, mid)} p2={vec(lx + lw, mid)} color="rgba(47,116,255,0.25)" strokeWidth={0.8} />
              {paths && d.track ? (
                <Group transform={[{ translateY: mid }, { scaleY: ((laneH - 6) / 2) * gain }]}>
                  <Group transform={xf}>
                    <Path path={paths[s]} color={c} opacity={on ? 0.9 : 0.18} />
                  </Group>
                </Group>
              ) : null}
            </Group>
          </Group>
        );
      })}
      {!paths ? <SceneText x={lx + lw / 2} y={head + 2 * laneH} size={fs} text="MEASURING THE PARTS…" color={INK.printDim} face="label" align="center" minPt={9.5} /> : null}
      <Line p1={vec(cx, head)} p2={vec(cx, head + 4 * laneH)} color="rgba(0,0,0,0.7)" strokeWidth={3.4} />
      <Line p1={vec(cx, head)} p2={vec(cx, head + 4 * laneH)} color={INK.white} strokeWidth={1.6} />
    </Group>
  );
}
