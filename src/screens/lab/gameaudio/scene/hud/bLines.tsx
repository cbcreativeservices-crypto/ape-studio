/**
 * bLines — the LINES strip (page 15): one line at a time, and the same line
 * is a different FILE in each language.
 *
 * One row for each of the guide's lines, on one time axis in seconds. A
 * row's bar is exactly as long as the take that row would play: the file of
 * the chosen language (bModel.bLineRows reads each file's real length), so
 * switching LANGUAGE makes both bars longer or shorter where the learner is
 * looking. Beside the bar: the line's name and its priority.
 *
 *   speaking     the bar FILLS from the line's own start time, over the
 *                take's length
 *   interrupted  the fill stops where the line was cut, a cross marks the
 *                place, and the row says INTERRUPTED AT and the time
 *   refused      a cross and REFUSED, with the reason, on the row of the
 *                line that was asked for; IGNORED when the same line was
 *                asked for while it speaks
 *
 * A state is always a word and a shape, never a color alone. The caption
 * stays where the page has it.
 *
 * MOTION. One frame clock fills the speaking bar and stops when nobody
 * speaks and no mark is waiting to clear. With motion reduced the fill
 * advances in half-second steps.
 */
import { Group, Line, RoundedRect, rect, vec } from '@shopify/react-native-skia';
import { gaNow } from '../../model/gaStore';
import type { GaState } from '../../model/gaModel';
import type { GaHudProps } from './gaHudTypes';
import { B, BGlass, BText } from './bKit';
import { useBMemo, useBNow } from './bClock';
import { B_CUT_SHOW_S, B_LINE_IDS, B_REFUSAL_SHOW_S, bFill01, bLineRows, bLinesAxisS, bLinesSummary, type BMemo } from './bModel';

const ROW_Y = [4, 20] as const;
const ROW_H = 13;
/** Reduced motion: the fill moves in steps this long, in seconds. */
const STEP_S = 0.5;

function Cross({ x, y }: { x: number; y: number }) {
  return (
    <Group>
      <Line p1={vec(x - 3, y - 3)} p2={vec(x + 3, y + 3)} color={B.refuse} strokeWidth={1.6} strokeCap="round" />
      <Line p1={vec(x - 3, y + 3)} p2={vec(x + 3, y - 3)} color={B.refuse} strokeWidth={1.6} strokeCap="round" />
    </Group>
  );
}

export function BLinesHud({ w, h, state }: GaHudProps) {
  const m = useBMemo();
  // the frame clock (outside the canvas: the strip is redrawn with its time):
  // it runs while a line speaks or a mark waits to clear
  const at = gaNow();
  const busy = state.inst.some((i) => (B_LINE_IDS as readonly string[]).includes(i.event)) || (!!m.cut && at - m.cut.at < B_CUT_SHOW_S) || (!!m.refusal && at - m.refusal.at < B_REFUSAL_SHOW_S);
  const [now, smooth] = useBNow(busy, STEP_S);
  return (
    <BGlass w={w} h={h} label={bLinesSummary(state, m, now)}>
      {(W) => <LinesStrip W={W} s={state} m={m} now={now} smooth={smooth} />}
    </BGlass>
  );
}

function LinesStrip({ W, s, m, now, smooth }: { W: number; s: GaState; m: BMemo; now: number; smooth: boolean }) {
  const x0 = 110;
  const x1 = W - 12;
  const axisS = bLinesAxisS();
  const pps = (x1 - x0) / axisS;
  const rows = bLineRows(s);
  const cut = m.cut && now - m.cut.at < B_CUT_SHOW_S ? m.cut : null;
  const refusal = m.refusal && now - m.refusal.at < B_REFUSAL_SHOW_S ? m.refusal : null;
  /** How far a speaking take has played, in units of the strip. */
  const filled = (born: number, seconds: number): number => bFill01(born, seconds, smooth ? now : born + Math.floor((now - born) / STEP_S) * STEP_S) * seconds * pps;

  return (
    <Group>
      {/* the time axis, in seconds */}
      {Array.from({ length: axisS + 1 }, (_, n) => {
        const x = x0 + n * pps;
        return (
          <Group key={n}>
            <Line p1={vec(x, 2)} p2={vec(x, 37)} color={B.hair} strokeWidth={1} />
            <BText x={x} y={45.5} text={n === axisS ? `${n} s` : String(n)} face="mono" color={B.muted} align={n === axisS ? 'right' : n === 0 ? 'left' : 'center'} />
          </Group>
        );
      })}

      {rows.slice(0, 2).map((r, i) => {
        const y = ROW_Y[i];
        const len = r.seconds * pps;
        const speaking = r.born != null;
        const mid = y + ROW_H / 2;
        const base = y + ROW_H / 2 + 3.4;
        const wasCut = cut && cut.id === r.id && !speaking ? cut : null;
        const cutLen = wasCut ? wasCut.seconds * pps : 0;
        const cutX = wasCut ? x0 + wasCut.frac * cutLen : 0;
        const refused = refusal && refusal.id === r.id ? refusal : null;
        const boxLen = wasCut ? cutLen : len;
        const word = refused
          ? refused.why === 'refused'
            ? 'REFUSED: A MORE IMPORTANT LINE SPEAKS'
            : 'IGNORED: THIS LINE IS SPEAKING'
          : wasCut
            ? `INTERRUPTED AT ${(wasCut.frac * wasCut.seconds).toFixed(1)} s`
            : `${r.langWord} FILE · ${r.seconds.toFixed(1)} s`;
        // an interrupted line's words stand clear of its cross
        const wordX = refused ? x0 + 15 : wasCut && cutX - x0 < 96 ? cutX + 9 : x0 + 5;
        return (
          <Group key={r.id}>
            <BText x={6} y={base} text={r.name} color={speaking ? B.ink : B.sub} />
            <BText x={x0 - 8} y={base} text={`PRIORITY ${r.priority}`} color={speaking ? B.ink : B.muted} align="right" />
            <RoundedRect x={x0} y={y} width={boxLen} height={ROW_H} r={2.5} color={B.well} />
            {speaking ? (
              <Group clip={rect(x0, y, len, ROW_H)}>
                <RoundedRect x={x0} y={y} width={filled(r.born as number, r.seconds)} height={ROW_H} r={2.5} color={B.guide} opacity={0.42} />
              </Group>
            ) : null}
            {wasCut ? <RoundedRect x={x0} y={y} width={Math.max(0, cutX - x0)} height={ROW_H} r={2.5} color={B.muted} opacity={0.34} /> : null}
            <RoundedRect x={x0} y={y} width={boxLen} height={ROW_H} r={2.5} style="stroke" strokeWidth={speaking ? 1.3 : 1} color={speaking ? B.guide : B.rule} />
            {/* while the row reads REFUSED its words run from the start, so the
                old cut's cross would sit on them (round 2, R2-GA2-05) */}
            {wasCut && !refused ? <Cross x={cutX} y={mid} /> : null}
            {refused ? <Cross x={x0 + 7} y={mid} /> : null}
            <BText x={wordX} y={base} text={word} color={refused || wasCut ? B.refuse : speaking ? B.ink : B.sub} />
          </Group>
        );
      })}
    </Group>
  );
}
