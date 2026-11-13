/**
 * bOutput — the OUTPUT strip (pages 13 and 3): what reaches each ear.
 *
 * PAGE 13 (no `arg`). YOU, seen from above and always facing up the strip
 * (the picture above is a map; this is the listener's own view), between two
 * level bars: LEFT EAR and RIGHT EAR, the model's computed levels on the
 * house ramp (bModel.bEars). Where the output puts a source is drawn on the
 * head:
 *
 *   STEREO        a point on ONE line through the ears. Turn, and it slides
 *                 between left and right; a source ahead and one behind land
 *                 on the same point, and the two bars are the same.
 *   HEADPHONE 3D  a point on a circle AROUND the head: ahead and behind are
 *                 now different places. The bars are the level part only, and
 *                 the strip says so.
 *   MONO          one point in the middle; both bars equal at every facing.
 *
 * PAGE 3 (`arg` = a listening setup). Nothing plays there: the strip draws
 * the setup from above (where its loudspeakers are, and which ear each one
 * reaches) beside what pages/data/gaPlatforms says it means for the sound.
 *
 * Nothing here runs on a timer: every mark moves when the state does.
 */
import { useMemo } from 'react';
import { Circle, DashPathEffect, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { levelColorForDb, rampColors } from '../../../../../features/tools/levelColor';
import { PlayerBehind, PlayerInFront } from '../../../miking/lessons/shared/players/PlayerFigure';
import { SINGER_TOP } from '../../../miking/lessons/shared/voice/voicePose';
import { gaNow } from '../../model/gaStore';
import type { GaHudProps } from './gaHudTypes';
import { useBNow } from './bClock';
import { B, BGlass, BH, BText } from './bKit';
import { B_DB_FLOOR, bDbWord, bEars, bRampsUntil, bLevel01, bListening, bOutputSummary, bOutputWords, type BEars, type BListening } from './bModel';

/** The house top-view figure, millimetres → strip units. */
const FIG = 0.07;
const CY = BH / 2;
/** How far from the head a source is drawn. */
const ORBIT = 18.5;

function Head({ x, y, turn }: { x: number; y: number; turn: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: turn }, { scale: FIG }]}>
      <PlayerBehind pose={SINGER_TOP} />
      <PlayerInFront pose={SINGER_TOP} hands={false} />
    </Group>
  );
}

/** One ear's level: a bar that grows AWAY from the head, blue at its foot and
 *  the level's own color at its tip (the house ramp). */
function EarBar({ x0, x1, db }: { x0: number; x1: number; db: number }) {
  const y = CY - 5;
  const lo = Math.min(x0, x1);
  const len = Math.abs(x1 - x0);
  const dir = x1 > x0 ? 1 : -1;
  const level = bLevel01(db);
  const fill = len * level;
  return (
    <Group>
      <RoundedRect x={lo} y={y} width={len} height={10} r={2} color={B.well} />
      <RoundedRect x={lo} y={y} width={len} height={10} r={2} style="stroke" strokeWidth={1} color={B.hair} />
      {fill > 0.5 ? (
        <RoundedRect x={dir > 0 ? x0 : x0 - fill} y={y + 1} width={fill} height={8} r={1.5}>
          <LinearGradient start={vec(x0, 0)} end={vec(x0 + dir * fill, 0)} colors={rampColors(level)} />
        </RoundedRect>
      ) : null}
      {/* every 12 dB */}
      {[-24, -12].map((t) => {
        const tx = x0 + dir * len * bLevel01(t);
        return <Line key={t} p1={vec(tx, y + 10)} p2={vec(tx, y + 13)} color={B.rule} strokeWidth={1} />;
      })}
    </Group>
  );
}

function EarsStrip({ W, e }: { W: number; e: BEars }) {
  const cx = W / 2;
  const inner = 35;
  const [wordL, wordR] = bOutputWords(e);
  const on = e.sources.length > 0;
  return (
    <Group>
      <BText x={8} y={12.5} text="LEFT EAR" />
      <BText x={cx - inner} y={12.5} text={on ? bDbWord(e.lDb) : '—'} face="mono" color={B.ink} align="right" />
      <BText x={W - 8} y={12.5} text="RIGHT EAR" align="right" />
      <BText x={cx + inner} y={12.5} text={on ? bDbWord(e.rDb) : '—'} face="mono" color={B.ink} />
      <EarBar x0={cx - inner} x1={8} db={on ? e.lDb : B_DB_FLOOR} />
      <EarBar x0={cx + inner} x1={W - 8} db={on ? e.rDb : B_DB_FLOOR} />
      <BText x={8} y={44} text={wordL} color={on ? B.ink : B.sub} />
      <BText x={W - 8} y={44} text={wordR} align="right" color={e.mode === 'hrtf' && on ? B.amber : B.sub} />

      {/* where this output can put a sound: a circle, a line, or one point */}
      {e.mode === 'hrtf' ? (
        <Group>
          <Circle cx={cx} cy={CY} r={ORBIT} style="stroke" strokeWidth={1} color={B.rule} />
          <Line p1={vec(cx, CY - ORBIT - 2.5)} p2={vec(cx, CY - ORBIT + 2.5)} color={B.sub} strokeWidth={1} />
        </Group>
      ) : e.mode === 'stereo' ? (
        <Group>
          <Line p1={vec(cx - ORBIT, CY)} p2={vec(cx + ORBIT, CY)} color={B.rule} strokeWidth={1} />
          <Line p1={vec(cx - ORBIT, CY - 3)} p2={vec(cx - ORBIT, CY + 3)} color={B.sub} strokeWidth={1} />
          <Line p1={vec(cx + ORBIT, CY - 3)} p2={vec(cx + ORBIT, CY + 3)} color={B.sub} strokeWidth={1} />
        </Group>
      ) : (
        <Circle cx={cx} cy={CY} r={ORBIT} style="stroke" strokeWidth={1} color={B.hair}>
          <DashPathEffect intervals={[2, 3]} />
        </Circle>
      )}
      <Head x={cx} y={CY} turn={-Math.PI / 2} />
      {[...e.passing.slice(0, 3).map((src) => ({ src, held: false })), ...e.sources.slice(0, 3).map((src) => ({ src, held: true }))].map(({ src, held }) => {
        const a = (src.bearingDeg * Math.PI) / 180;
        const x = e.mode === 'hrtf' ? cx + ORBIT * Math.sin(a) : e.mode === 'stereo' ? cx + ORBIT * src.pan : cx;
        const y = e.mode === 'hrtf' ? CY - ORBIT * Math.cos(a) : CY;
        const color = levelColorForDb(src.db, B_DB_FLOOR, 0);
        // a passing one-shot is a small ring; the source the bars follow is a full dot
        return held ? (
          <Group key={src.key}>
            <Circle cx={x} cy={y} r={4.6} color="#060709" />
            <Circle cx={x} cy={y} r={3.4} color={color} />
            <Circle cx={x} cy={y} r={3.4} style="stroke" strokeWidth={0.8} color={B.ink} />
          </Group>
        ) : (
          <Group key={src.key}>
            <Circle cx={x} cy={y} r={3.2} color="#060709" />
            <Circle cx={x} cy={y} r={2.2} style="stroke" strokeWidth={1.2} color={color} />
          </Group>
        );
      })}
    </Group>
  );
}

/* ── page 3: a listening setup, from above ──────────────────────────────── */

/** The listener faces right; the left ear is the upper one. */
const HX = 24;
const EAR = 5.6;
const earL = vec(HX + 1, CY - EAR);
const earR = vec(HX + 1, CY + EAR);

function Rays({ from }: { from: { x: number; y: number }[] }) {
  return (
    <Group>
      {from.flatMap((p, i) => [earL, earR].map((ear, j) => <Line key={`${i}${j}`} p1={vec(p.x, p.y)} p2={ear} color="rgba(244,246,248,0.42)" strokeWidth={0.9} />))}
    </Group>
  );
}

function Cups({ mic = false }: { mic?: boolean }) {
  const boom = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(HX + 2.5, CY - EAR - 2.2);
    p.quadTo(HX + 11.5, CY - EAR - 1.5, HX + 10.5, CY - 1.2);
    return p;
  }, []);
  return (
    <Group>
      {/* the band, over the top of the head */}
      <Line p1={vec(HX + 1, CY - EAR - 1)} p2={vec(HX + 1, CY + EAR + 1)} color="#5d616b" strokeWidth={1.6} strokeCap="round" />
      {[-1, 1].map((sgn) => (
        <Group key={sgn}>
          <RoundedRect x={HX - 2.6} y={CY + sgn * (EAR + 1.9) - 2} width={7.2} height={4} r={1.8} color="#17181c" />
          <RoundedRect x={HX - 2.6} y={CY + sgn * (EAR + 1.9) - 2} width={7.2} height={4} r={1.8} style="stroke" strokeWidth={0.9} color={B.ink} />
        </Group>
      ))}
      {mic ? (
        <Group>
          <Path path={boom} style="stroke" strokeWidth={1.1} strokeCap="round" color={B.ink} />
          <Circle cx={HX + 10.5} cy={CY - 0.6} r={1.7} color={B.amber} />
        </Group>
      ) : null}
      <BText x={HX + 9} y={CY - EAR - 4.5} text="L" color={B.ink} />
      <BText x={HX + 9} y={CY + EAR + 11.5} text="R" color={B.ink} />
    </Group>
  );
}

/** Room noise between the listener and the far loudspeakers: a fixed stipple. */
const NOISE = (() => {
  const p = Skia.Path.Make();
  let x = 77;
  const r = () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
  for (let i = 0; i < 46; i++) p.addCircle(50 + r() * 66, 5 + r() * (BH - 10), 0.55 + r() * 0.5);
  return p;
})();

function SetupPicture({ picture }: { picture: BListening['picture'] }) {
  const far = 132;
  return (
    <Group>
      {picture === 'phone' ? (
        <Group>
          <Rays from={[{ x: HX + 22, y: CY + 6.5 }]} />
          {/* a phone held in front of the face, seen edge-on from above */}
          <RoundedRect x={HX + 21} y={CY - 9} width={3.6} height={18} r={1.6} color="#17181c" />
          <RoundedRect x={HX + 21} y={CY - 9} width={3.6} height={18} r={1.6} style="stroke" strokeWidth={0.9} color={B.ink} />
          <Circle cx={HX + 22} cy={CY + 6.5} r={1.5} color={B.amber} />
        </Group>
      ) : null}
      {picture === 'tv' || picture === 'bar' ? (
        <Group>
          <Path path={NOISE} color="rgba(244,246,248,0.3)" />
          <Rays from={[{ x: far, y: CY - (picture === 'tv' ? 17 : 13) }, { x: far, y: CY + (picture === 'tv' ? 17 : 13) }]} />
          {/* the screen, edge-on */}
          <RoundedRect x={far + (picture === 'tv' ? 1 : 7)} y={3} width={3} height={BH - 6} r={1} color="#17181c" />
          <RoundedRect x={far + (picture === 'tv' ? 1 : 7)} y={3} width={3} height={BH - 6} r={1} style="stroke" strokeWidth={0.9} color={picture === 'tv' ? B.ink : B.muted} />
          {picture === 'tv' ? (
            [-17, 17].map((dy) => <Circle key={dy} cx={far + 0.4} cy={CY + dy} r={1.5} color={B.amber} />)
          ) : (
            <Group>
              <RoundedRect x={far - 1} y={CY - 16} width={5} height={32} r={2.4} color="#17181c" />
              <RoundedRect x={far - 1} y={CY - 16} width={5} height={32} r={2.4} style="stroke" strokeWidth={0.9} color={B.ink} />
              {[-13, -6.5, 0, 6.5, 13].map((dy) => (
                <Circle key={dy} cx={far - 0.2} cy={CY + dy} r={1.2} color={B.amber} />
              ))}
            </Group>
          )}
          <BText x={far - 5} y={CY - 13} text="L" color={B.ink} align="right" />
          <BText x={far - 5} y={CY + 20} text="R" color={B.ink} align="right" />
        </Group>
      ) : null}
      <Head x={HX} y={CY} turn={0} />
      {picture === 'phones' ? <Cups /> : null}
      {picture === 'headset' ? <Cups mic /> : null}
    </Group>
  );
}

function SetupStrip({ setup }: { setup: BListening }) {
  const near = setup.picture === 'phone' || setup.picture === 'phones' || setup.picture === 'headset';
  const tx = near ? 62 : 154;
  return (
    <Group>
      <SetupPicture picture={setup.picture} />
      <BText x={tx} y={13} text={setup.title} color={B.ink} size={10.5} />
      <BText x={tx} y={28} text={setup.lines[0]} />
      <BText x={tx} y={42} text={setup.lines[1]} />
      {near ? null : <Line p1={vec(tx - 8, 6)} p2={vec(tx - 8, BH - 6)} color={B.hair} strokeWidth={1} />}
    </Group>
  );
}

export function BOutputHud({ w, h, state, arg }: GaHudProps) {
  const setup = bListening(arg);
  // levels follow the model's own ramps (the lab LEVEL, a bus): the clock
  // runs only until the last of them ends
  const [now] = useBNow(!arg && gaNow() < bRampsUntil(state));
  const ears = arg ? null : bEars(state, now);
  const label = setup ? `How the player hears the game: ${setup.title.toLowerCase()}, seen from above. ${setup.lines.join('. ').toLowerCase()}.` : ears ? bOutputSummary(ears) : 'How the player hears the game: no listening setup is chosen yet.';
  return (
    <BGlass w={w} h={h} label={label}>
      {(W) =>
        setup ? (
          <SetupStrip setup={setup} />
        ) : ears ? (
          <EarsStrip W={W} e={ears} />
        ) : (
          <Group>
            <Head x={HX} y={CY} turn={0} />
            <BText x={62} y={13} text="LISTENING" color={B.ink} size={10.5} />
            <BText x={62} y={28} text="NO SETUP IS CHOSEN YET" />
          </Group>
        )
      }
    </BGlass>
  );
}
