/**
 * bWall — the WALL strip (page 12): what the wall does to a source, and what
 * the room adds. Three windows, left to right:
 *
 *   RESPONSE  the treatment as a frequency response, 50 Hz … 16 kHz on a
 *             logarithmic axis (ticks at 100 Hz, 1 kHz, 10 kHz). Flat on the
 *             0 dB line when nothing is in the way. Through the closed door
 *             it is the model's own treatment: the whole curve lower by the
 *             wall's level change, and bent by its second-order low-pass
 *             (bModel.bTreatmentDb: the true magnitude, never a sketch). The
 *             0 dB line stays as a dashed reference, so BOTH changes read.
 *   READOUT   the source, the level change in dB, the filter's corner.
 *   REVERB    the workshop's impulse response itself (sounds/ir_room): the
 *             lowest and highest sample of each column over its 1.5 s, on the
 *             house amplitude ramp, drawn as tall as the source's send. DRY,
 *             or a source that does not feed the room: a flat line and a word.
 *
 * NOT PLAYING is said, and drawn: the curve is dashed and the tail dimmed,
 * because it is then the treatment the source WOULD get.
 *
 * MOTION. When the treatment changes (the door, a walk through it) the curve
 * moves to the new one over 0.25 s, the time the model gives the engine for
 * the same change; the corner slides on the logarithmic axis. With motion
 * reduced it changes at once. Nothing else moves, and the clock stops.
 */
import { useMemo, useRef } from 'react';
import { DashPathEffect, Group, Line, LinearGradient, Path, Skia, rect, vec } from '@shopify/react-native-skia';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../../../features/tools/levelColor';
import type { GaHudProps } from './gaHudTypes';
import { useTextWidthMm } from '../../../dj/art/sceneText';
import { B, BGlass, BText, B_TEXT } from './bKit';
import { gaNow } from '../../model/gaStore';
import { useBNow } from './bClock';
import { B_F_TICKS, bCurveY, bWallLayout, bCurveYRaw, bFreqAt, bFreqX, bHzWord, bIrEnvelope, bReverbWord, bTreatment, bTreatmentDb, bWallSource, bWallSummary } from './bModel';

/** Seconds the curve takes to reach a new treatment (the model's door ramp). */
const MOVE_S = 0.25;
/** The send at which the tail is drawn at full height (a drawing scale). */
const SEND_FULL = 0.3;

const PY0 = 5;
const PH = 28;
const POINTS = 56;

type Shape = { wallDb: number; lowpassHz: number };

/** The response as an SVG path inside the plot box. */
function curveD(t: Shape, x0: number, pw: number, close: boolean): string {
  let d = '';
  for (let i = 0; i <= POINTS; i++) {
    const u = i / POINTS;
    // not clamped: where the response falls below the window the curve leaves
    // the plot (it is clipped there), never runs along its floor
    const y = PY0 + PH * bCurveYRaw(bTreatmentDb(t, bFreqAt(u)));
    d += `${i ? 'L' : 'M'}${(x0 + u * pw).toFixed(2)} ${y.toFixed(2)}`;
  }
  return close ? `${d}L${(x0 + pw).toFixed(2)} ${PY0 + PH + 40}L${x0.toFixed(2)} ${PY0 + PH + 40}Z` : d;
}

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const between = (a: Shape, b: Shape, u: number): Shape => ({ wallDb: lerp(a.wallDb, b.wallDb, u), lowpassHz: Math.exp(lerp(Math.log(a.lowpassHz), Math.log(b.lowpassHz), u)) });

export function BWallHud({ w, h, state, arg }: GaHudProps) {
  const t = useMemo(() => bTreatment(state, bWallSource(arg)), [state, arg]);
  /* the curve moves from the treatment shown to the new one (the frame clock
     is out here, outside the canvas: the strip is redrawn with its time) */
  const target: Shape = { wallDb: t.wallDb, lowpassHz: t.lowpassHz };
  const from = useRef<Shape>(target);
  const goal = useRef<Shape>(target);
  const startAt = useRef(-Infinity);
  if (goal.current.wallDb !== target.wallDb || goal.current.lowpassHz !== target.lowpassHz) {
    // start from where the curve is drawn now
    const at = gaNow();
    const u0 = Math.min(1, (at - startAt.current) / MOVE_S);
    from.current = u0 >= 1 ? goal.current : between(from.current, goal.current, u0 * u0 * (3 - 2 * u0));
    goal.current = target;
    startAt.current = at;
  }
  const [now, smooth] = useBNow(gaNow() - startAt.current < MOVE_S, MOVE_S);
  const u = smooth ? Math.min(1, Math.max(0, (now - startAt.current) / MOVE_S)) : 1;
  const cur = u >= 1 ? goal.current : between(from.current, goal.current, u * u * (3 - 2 * u));
  return (
    <BGlass w={w} h={h} label={bWallSummary(t)}>
      {(W) => <WallStrip W={W} t={t} cur={cur} />}
    </BGlass>
  );
}

function WallStrip({ W, t, cur }: { W: number; t: ReturnType<typeof bTreatment>; cur: Shape }) {
  const acting0 = t.obstructed;
  const would0 = !t.playing;
  // the readout's words, measured: the title (a shorter one if the full one
  // does not fit), and the widest value line
  const shortName = t.name.replace(/^GENERATOR /, 'GEN ');
  const fullTitle = would0 ? `IF ${t.name} PLAYED` : `${t.name} · PLAYING`;
  const shortTitle = would0 ? `IF ${shortName} PLAYED` : `${shortName} · PLAYING`;
  const fullW = useTextWidthMm(fullTitle, B_TEXT);
  const shortW = useTextWidthMm(shortTitle, B_TEXT);
  const levelW = useTextWidthMm(acting0 ? `−${Math.abs(Math.round(t.wallDb))} dB` : 'NO CHANGE', B_TEXT, acting0 ? 'mono' : 'label');
  const filterW = useTextWidthMm(acting0 ? bHzWord(t.lowpassHz) : 'NONE', B_TEXT, acting0 ? 'mono' : 'label');
  const roomW = useTextWidthMm('ROOM REVERB', B_TEXT);
  const secW = useTextWidthMm('0.0 s', B_TEXT, 'mono');
  const readNeed = Math.max(shortW, 32 + levelW, (acting0 ? 46 : 32) + filterW) + 6;
  const revNeed = roomW + secW + 8;
  const { ax0, apw, rx, bx0, bpw, colW } = bWallLayout(W, readNeed, revNeed);
  const title = fullW <= colW ? fullTitle : shortTitle;
  const line = curveD(cur, ax0, apw, false);
  const fill = curveD(cur, ax0, apw, true);

  const y0 = PY0 + PH * bCurveY(0);
  const acting = t.obstructed;
  const would = !t.playing;

  /* the tail: the impulse's own envelope */
  const tail = useMemo(() => {
    const cols = Math.max(8, Math.round(bpw * 2));
    const env = bIrEnvelope(cols);
    const p = Skia.Path.Make();
    if (!(env.peak > 0)) return { p, seconds: env.seconds };
    const mid = PY0 + PH / 2;
    const half = PH / 2 - 1;
    for (let c = 0; c < cols; c++) p[c ? 'lineTo' : 'moveTo'](bx0 + (c / (cols - 1)) * bpw, mid - (env.max[c] / env.peak) * half);
    for (let c = cols - 1; c >= 0; c--) p.lineTo(bx0 + (c / (cols - 1)) * bpw, mid - (env.min[c] / env.peak) * half);
    p.close();
    return { p, seconds: env.seconds };
  }, [bx0, bpw]);
  const mid = PY0 + PH / 2;
  // drawn taller for a stronger send (a drawing scale: the square root, so a
  // weak send stays readable); the number beside it is the model's send
  const tailScale = Math.min(1, Math.sqrt(t.send / SEND_FULL));
  const none = bReverbWord(t);
  const fed = none == null;

  return (
    <Group>
      {/* RESPONSE */}
      {B_F_TICKS.map((f) => {
        const x = ax0 + apw * bFreqX(f);
        return (
          <Group key={f}>
            <Line p1={vec(x, PY0)} p2={vec(x, PY0 + PH + 2.5)} color={B.hair} strokeWidth={1} />
            <BText x={x} y={45} text={bHzWord(f)} face="mono" color={B.muted} align="center" />
          </Group>
        );
      })}
      <Line p1={vec(ax0, PY0 + PH)} p2={vec(ax0 + apw, PY0 + PH)} color={B.hair} strokeWidth={1} />
      <Line p1={vec(ax0, y0)} p2={vec(ax0 + apw, y0)} color={B.rule} strokeWidth={1}>
        <DashPathEffect intervals={[2, 3]} />
      </Line>
      <Group clip={rect(ax0, PY0 - 1, apw, PH + 1)}>
        <Path path={fill} color="rgba(244,246,248,0.07)" />
        <Path path={line} style="stroke" strokeWidth={1.6} strokeJoin="round" strokeCap="round" color={would ? B.sub : B.ink}>
          {would ? <DashPathEffect intervals={[4, 2.5]} /> : null}
        </Path>
      </Group>

      {/* READOUT */}
      <BText x={rx} y={13} text={title} color={would ? B.amber : B.ink} />
      <BText x={rx} y={28.5} text="LEVEL" />
      <BText x={rx + 32} y={28.5} text={acting ? `−${Math.abs(Math.round(t.wallDb))} dB` : 'NO CHANGE'} face={acting ? 'mono' : 'label'} color={B.ink} />
      <BText x={rx} y={43} text={acting ? 'LOW-PASS' : 'FILTER'} />
      <BText x={rx + (acting ? 46 : 32)} y={43} text={acting ? bHzWord(t.lowpassHz) : 'NONE'} face={acting ? 'mono' : 'label'} color={B.ink} />

      {/* REVERB */}
      <Line p1={vec(bx0 - 9, 6)} p2={vec(bx0 - 9, 42)} color={B.hair} strokeWidth={1} />
      <Line p1={vec(bx0, mid)} p2={vec(bx0 + bpw, mid)} color={MIDLINE_BLUE} strokeWidth={1} opacity={fed ? 0.9 : 0.5} />
      {fed ? (
        <Group transform={[{ translateY: mid }, { scaleY: tailScale }, { translateY: -mid }]} opacity={would ? 0.5 : 1}>
          <Path path={tail.p}>
            <LinearGradient start={vec(0, mid - (PH / 2 - 1))} end={vec(0, mid + (PH / 2 - 1))} colors={WAVE_LEVEL_STOPS.map((s) => s.color)} positions={WAVE_LEVEL_STOPS.map((s) => s.offset)} />
          </Path>
        </Group>
      ) : null}
      {none == null ? (
        <BText x={bx0 + bpw} y={13} text={`SEND −${Math.abs(Math.round(t.sendDb))} dB`} face="mono" color={B.ink} align="right" />
      ) : (
        <BText x={bx0 + bpw / 2} y={13} text={none} color={B.amber} align="center" />
      )}
      <BText x={bx0} y={45} text="ROOM REVERB" />
      <BText x={bx0 + bpw} y={45} text={`${tail.seconds.toFixed(1)} s`} face="mono" color={B.muted} align="right" />
    </Group>
  );
}
