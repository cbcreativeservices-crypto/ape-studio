/**
 * aLevels — the three strips that are made of LEVEL BARS:
 *
 *   level (page 1)   the three sounds SCENE starts, each with its computed
 *                    level, and the lab LEVEL as one line across all three
 *   cats  (page 5)   one cell for each kind of game sound: a lamp, its name,
 *                    its computed level; a kind the mix has silenced says so
 *   beds  (page 10)  the two ambience beds crossfading, each loop drawn from
 *                    its own samples with the play position on it, the join,
 *                    and how many copies of the bed are playing
 *
 * Every number comes from aModel (pure, tested). Read-only: no control lives
 * on the glass.
 */
import { memo } from 'react';
import { View } from 'react-native';
import { levelColor } from '../../../../../features/tools/levelColor';
import type { GaState } from '../../model/gaModel';
import { gaNow } from '../../model/gaStore';
import type { GaHudProps } from './gaHudTypes';
import { A_LOOP_SHAPES, aJoinStep } from './aLoopShapes';
import { A_SYNC_MARK_S, aBeds, aRamping, aBedsSummary, aCats, aCatsSummary, aLevelRows, aLevelSummary, aLevelWord, aNextStart, aPct, type ABed, type ACat } from './aModel';
import { Bar, HUD, HudFrame, Lamp, Lbl, Rule, Val, barX, hudK, levelTint, useHudNow, type LampState } from './aParts';

/** The clock for a strip that shows the beds: it runs while they crossfade
 *  (and while `run`), and wakes when a late layer starts. */
function useLevelClock(s: GaState, run: boolean, wakeAt: number | null) {
  const t = gaNow();
  const next = aNextStart(s, t);
  return useHudNow(run || aRamping(s, t), wakeAt != null && (next == null || wakeAt < next) ? wakeAt : next);
}

/* ── level (page 1) ─────────────────────────────────────────────────────── */

function LevelHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const { now, still } = useLevelClock(s, false, null);
  const rows = aLevelRows(s, now, still);
  const pad = 8 * k;
  const gap = 7 * k;
  const headW = 50 * k;
  const nameW = 88 * k;
  const valW = 38 * k;
  const barW = Math.max(40, w - 2 * pad - headW - 1 - 2 * gap - nameW - valW);
  const rowH = (h - 2 - 6 * k) / rows.length;
  const master = Math.max(0, Math.min(1, s.master));
  return (
    <HudFrame w={w} h={h} label={aLevelSummary(s, rows)} style={{ flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: pad }}>
      {/* the lab LEVEL: the line it draws across the three bars is named here */}
      <View style={{ width: headW, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
          <View style={{ width: 1.5 * k, height: 9 * k, backgroundColor: HUD.value }} />
          <Lbl k={k}>LEVEL</Lbl>
        </View>
        <Val k={k} size={13}>
          {aPct(master)}
        </Val>
        <Val k={k} color={HUD.legend}>
          {aLevelWord(master)}
        </Val>
      </View>
      <Rule k={k} style={{ marginHorizontal: gap }} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {rows.map((r) => (
          <View key={r.event} style={{ height: rowH, flexDirection: 'row', alignItems: 'center' }}>
            <Lbl k={k} color={r.playing ? HUD.live : HUD.idle} style={{ width: nameW }}>
              {r.name}
            </Lbl>
            <Bar w={barW} h={7 * k} level={r.level} />
            <Val k={k} color={!r.playing ? HUD.idle : r.level > 0 ? HUD.value : HUD.legend} style={{ width: valW, textAlign: 'right' }}>
              {r.playing ? aLevelWord(r.level) : 'OFF'}
            </Val>
          </View>
        ))}
        {/* LEVEL, as one line over the three bars: no single sound passes it */}
        <View style={{ position: 'absolute', left: nameW + Math.round(barX(master, barW)) - 0.75 * k, top: 2 * k, bottom: 2 * k, width: 1.5 * k, backgroundColor: HUD.value }} />
      </View>
    </HudFrame>
  );
}

/* ── cats (page 5) ──────────────────────────────────────────────────────── */

const CAT_LAMP: Record<ACat['state'], LampState> = { idle: 'off', shut: 'cut', sounding: 'on', zero: 'ring', muted: 'cut', silent: 'cut' };

const CatCell = memo(function CatCell({ k, w, h, label, state, level, part }: { k: number; w: number; h: number; label: string; state: ACat['state']; level: number; part: boolean }) {
  const live = state === 'sounding' || state === 'zero';
  // running, and the mix lets none of it through
  const closed = state === 'muted' || state === 'silent';
  const struck = closed || state === 'shut';
  return (
    <View style={{ width: w, height: h, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
        <Lamp d={6 * k} state={CAT_LAMP[state]} color={closed ? HUD.legend : state === 'shut' ? HUD.idle : levelTint(level)} />
        {/* part of this kind is sounding and part is shut out: both lamps */}
        {part ? <Lamp d={6 * k} state="cut" color={HUD.legend} /> : null}
        <Lbl k={k} color={live ? HUD.live : HUD.idle} style={[{ flex: 1 }, struck ? { textDecorationLine: 'line-through' } : null]}>
          {label}
        </Lbl>
        {closed ? <Lbl k={k}>{state === 'muted' ? 'MUTED' : 'SILENT'}</Lbl> : live ? <Val k={k} color={level > 0 ? HUD.value : HUD.legend}>{aLevelWord(level)}</Val> : null}
      </View>
      <Bar w={w} h={3.5 * k} level={closed ? 0 : level} />
    </View>
  );
});

function CatsHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const { now, still } = useLevelClock(s, false, null);
  const cats = aCats(s, now, still);
  const pad = 8 * k;
  const gap = 10 * k;
  const cols = 3;
  const cellW = Math.floor((w - 2 * pad - (cols - 1) * gap) / cols);
  const rowsN = Math.ceil(cats.length / cols);
  const cellH = (h - 2 - 2 * k) / rowsN;
  return (
    <HudFrame w={w} h={h} label={aCatsSummary(cats)} style={{ paddingHorizontal: pad, justifyContent: 'center' }}>
      {Array.from({ length: rowsN }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {cats.slice(r * cols, r * cols + cols).map((c) => (
            <CatCell key={c.id} k={k} w={cellW} h={cellH} label={c.label} state={c.state} level={c.level} part={c.part} />
          ))}
        </View>
      ))}
    </HudFrame>
  );
}

/* ── beds (page 10) ─────────────────────────────────────────────────────── */

/** A join whose level steps by this much or more (hundredths of full scale,
 *  from the loop's own samples) is a jump the ear hears. */
const JOIN_JUMP = 15;

/** A loop from its own samples: one bar for each quarter second, as tall as
 *  the largest sample in it (the tallest fills the line), in the house
 *  loudness colors of the sample's true size. */
const LoopShape = memo(function LoopShape({ asset, w, h }: { asset: string; w: number; h: number }) {
  const shape = A_LOOP_SHAPES[asset];
  if (!shape?.length) return <View style={{ width: w, height: 1, backgroundColor: HUD.slotRim }} />;
  const top = Math.max(...shape, 1);
  const colW = w / shape.length;
  return (
    <View style={{ width: w, height: h, flexDirection: 'row', alignItems: 'center' }}>
      {shape.map((v, i) => (
        <View key={i} style={{ width: colW, height: h, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: Math.max(1, colW - 1), height: Math.max(1, Math.round((v / top) * h)), borderRadius: 0.5, backgroundColor: levelColor(v / 100) }} />
        </View>
      ))}
    </View>
  );
});

type BedCols = { name: number; bar: number; val: number; loop: number; join: number; copies: number; gap: number };

function BedRow({ k, b, cols, h }: { k: number; b: ABed; cols: BedCols; h: number }) {
  const on = b.copies > 0;
  const shape = b.asset ? A_LOOP_SHAPES[b.asset] : undefined;
  const jump = shape ? Math.abs(aJoinStep(shape)) >= JOIN_JUMP : false;
  // the mark: lit for a moment each time the play position passes the join
  const passing = on && jump && b.passes > 0 && b.sinceJoin < A_SYNC_MARK_S;
  const loopH = h - 3 * k;
  const endW = jump ? 2 * k : 1;
  const endColor = jump ? HUD.red : HUD.legend;
  return (
    <View style={{ height: h, flexDirection: 'row', alignItems: 'center' }}>
      <Lbl k={k} color={on ? HUD.live : HUD.idle} style={{ width: cols.name }}>
        {b.name}
      </Lbl>
      <Bar w={cols.bar} h={6 * k} level={b.level} />
      <Val k={k} color={!on ? HUD.idle : b.level > 0 ? HUD.value : HUD.legend} style={{ width: cols.val, textAlign: 'right' }}>
        {on ? aLevelWord(b.level) : 'OFF'}
      </Val>
      <View style={{ width: cols.loop, height: loopH, marginLeft: cols.gap, justifyContent: 'center' }}>
        {on && b.asset ? <LoopShape asset={b.asset} w={cols.loop} h={loopH} /> : <View style={{ height: 1, backgroundColor: HUD.slotRim }} />}
        {on ? (
          <>
            {/* the join: where the loop's end meets its start (both ends of the line) */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: endW, backgroundColor: endColor }} />
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: endW, backgroundColor: endColor }} />
            {/* the play position */}
            <View style={{ position: 'absolute', left: Math.round(b.pos * (cols.loop - 1.5 * k) * 2) / 2, top: -1 * k, bottom: -1 * k, width: 1.5 * k, backgroundColor: HUD.live }} />
          </>
        ) : null}
      </View>
      <View style={{ width: cols.join, marginLeft: cols.gap, flexDirection: 'row', alignItems: 'center', gap: 4 * k }}>
        {on ? (
          <>
            <Val k={k} color={HUD.legend}>{`${b.loopS} s`}</Val>
            {jump ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * k, paddingHorizontal: 2 * k, borderRadius: 2, backgroundColor: passing ? HUD.red : 'transparent' }}>
                {/* how many times the play position has passed the join */}
                <Lbl k={k} color={passing ? '#12080a' : HUD.red}>
                  {b.passes > 0 ? 'JUMPS' : 'JUMP'}
                </Lbl>
                {b.passes > 0 ? <Val k={k} color={passing ? '#12080a' : HUD.red}>{String(b.passes)}</Val> : null}
              </View>
            ) : (
              <Lbl k={k}>SMOOTH</Lbl>
            )}
          </>
        ) : null}
      </View>
      <View style={{ width: cols.copies, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 * k }}>
        {on && b.copies > 1 && b.copies < 10 ? (
          // more than one copy: a stack, as well as the number
          <View style={{ width: 7 * k, height: 9 * k, justifyContent: 'space-between' }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ height: 2 * k, backgroundColor: HUD.red }} />
            ))}
          </View>
        ) : null}
        <Val k={k} color={!on ? HUD.idle : b.copies > 1 ? HUD.red : HUD.legend}>{`×${b.copies}`}</Val>
      </View>
    </View>
  );
}

function BedsHud({ w, h, state: s }: GaHudProps) {
  const k = hudK(h);
  const playing = s.inst.some((i) => i.event === 'bed_yard' || i.event === 'bed_room');
  // with motion reduced the count of passes still has to follow the clock:
  // one wake at the next join (a whole millisecond, so the same pass asks
  // for the same wake), and one when that pass's mark goes out
  const t0 = gaNow();
  const nextJoin = aBeds(s, t0).reduce<number | null>((at, b) => {
    if (!b.copies || !(b.loopS > 0)) return at;
    // the next pass, or (just after one) the moment its mark goes out
    const lit = b.passes > 0 && b.sinceJoin < A_SYNC_MARK_S;
    const t = Math.round((t0 + ((lit ? A_SYNC_MARK_S : b.loopS) - b.sinceJoin)) * 1000) / 1000;
    return at === null || t < at ? t : at;
  }, null);
  const { now, still } = useLevelClock(s, playing, nextJoin);
  const list = aBeds(s, now, still);
  const pad = 8 * k;
  const gap = 6 * k;
  const cols: BedCols = { name: 80 * k, bar: 40 * k, val: 36 * k, loop: 0, join: 62 * k, copies: 22 * k, gap };
  cols.loop = Math.max(60, w - 2 * pad - cols.name - cols.bar - cols.val - cols.join - cols.copies - 2 * gap);
  const headH = 12 * k;
  const rowH = (h - 2 - headH - 2 * k) / list.length;
  return (
    <HudFrame w={w} h={h} label={aBedsSummary(list, s)} style={{ paddingHorizontal: pad, justifyContent: 'center' }}>
      <View style={{ height: headH, flexDirection: 'row', alignItems: 'center' }}>
        <Lbl k={k} style={{ width: cols.name }}>
          BED
        </Lbl>
        <Lbl k={k} style={{ width: cols.bar + cols.val }}>
          LEVEL
        </Lbl>
        <Lbl k={k} style={{ width: cols.loop, marginLeft: gap }}>
          LOOP · POSITION
        </Lbl>
        <Lbl k={k} style={{ marginLeft: gap }}>JOIN</Lbl>
        {/* the last legend is wider than its column: it sits against the right edge */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Lbl k={k}>COPIES</Lbl>
        </View>
      </View>
      {list.map((b) => (
        <BedRow key={b.event} k={k} b={b} cols={cols} h={rowH} />
      ))}
    </HudFrame>
  );
}

export const A_LEVEL_HUDS = { level: LevelHud, cats: CatsHud, beds: BedsHud };
