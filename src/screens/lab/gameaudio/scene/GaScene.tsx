/**
 * GaScene — the Game Audio lab's shared scene, drawn from model/gaWorld: a
 * courtyard and a workshop from above. What is drawn is the model, not a
 * picture of one: every object sits at its world position, the door leaf is
 * open or closed as the state says, and the SOUND you see is the sound the
 * model has playing.
 *
 *   ground     gravel, a stone path to the door, the workshop's wood floor —
 *              the three surfaces a footstep switches between
 *   objects    the generator(s), the fountain, the crate, the door in the wall
 *   people     the player and the guide: the house top-view figure
 *              (miking/lessons/shared/players), turned to face where the
 *              model says they face
 *   the        a wedge in front of the listener (where the ears point), or
 *   listener   a camera over the middle in the overhead view
 *   sound      rings spreading from each object that has a voice playing,
 *              coloured on the house level ramp by how loud it is AT THE
 *              LISTENER after distance, the wall AND the mix (blue = faint …
 *              red = loud). A generator's rings spread faster as its speed
 *              rises. The alarm has its own, broken rings. A source that is
 *              tracked but not rendered (virtual), or that the mix has
 *              silenced (mute, another bus soloed), keeps one dashed grey
 *              ring. A speech mark stands by the guide while a line plays.
 *   selection  the selected source's minimum and maximum distance, dashed
 *
 * Objects and people are drawn LARGER than life (a 0.5 m person would be
 * 10 pt wide on a phone); positions and distances are true. The lab says
 * this once, on its first page.
 *
 * Units: world metres inside one scaled Group. Text goes through SceneText
 * (dj/art), which refuses anything that would render under 9 pt.
 */
import { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, rect, vec } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, useDerivedValue, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../features/settings/decorativeMotion';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import { SceneFontsProvider, SceneText, useLabelMm } from '../../dj/art/sceneText';
import { PlayerBehind, PlayerInFront } from '../../miking/lessons/shared/players/PlayerFigure';
import { SINGER_TOP } from '../../miking/lessons/shared/voice/voicePose';
import { useStageTextScale } from '../../rack/stageAspect';
import { GA_EVENTS } from '../model/gaDefs';
import { gaListenDistance, gaVoiceLevel, listenerOf, type GaState } from '../model/gaModel';
import { DOOR_Y0, DOOR_Y1, PLACES, WALL_X, WORLD_H, WORLD_W, attenuationGain, gainDb, obstruction, type GaPoint } from '../model/gaWorld';

export const GA_SCENE_ASPECT = WORLD_W / WORLD_H;
const WORLD_CLIP = rect(0, 0, WORLD_W, WORLD_H);

/** People and objects are drawn this much larger than life. */
const PERSON_K = 2.5;
const WALL_T = 0.34;

export type GaSceneSelect = 'generator-1' | 'generator-2' | 'fountain' | 'door' | 'crate' | 'guide' | null;

type Sounding = {
  key: string;
  /** What it is, in words (the screen reader's list). */
  name: string;
  at: GaPoint;
  db: number;
  virtual: boolean;
  /** The mix has silenced it: its bus is muted, or another bus is soloed. */
  muted: boolean;
  muffled: boolean;
  /** How fast the rings spread: 1, 2 or 3 (a generator's speed). */
  pace: 1 | 2 | 3;
  alarm: boolean;
};

const SOURCE_NAME: Record<string, string> = { 'generator-1': 'generator 1', 'generator-2': 'generator 2', fountain: 'the fountain', crate: 'the crate', door: 'the door', player: 'your footsteps', guide: 'the guide' };

/** Every object with a positioned voice, and its level at the listener:
 *  distance, the wall, and the mix (the bus fader, mute, solo, the duck).
 *  The alarm is listed apart from the generator it sits on. */
function soundingOf(s: GaState): Sounding[] {
  const L = listenerOf(s);
  const out = new Map<string, Sounding>();
  for (const i of s.inst) {
    const def = GA_EVENTS[i.event];
    if (!def.spatial || !i.pos || !def.atten) continue;
    const vs = s.voices.filter((v) => v.inst === i.id);
    if (!vs.length) continue;
    const ob = obstruction(L, i.pos, s.doorOpen);
    let mix = 0;
    for (const v of vs) mix = Math.max(mix, gaVoiceLevel(s, v));
    const g = attenuationGain(gaListenDistance(L, i.pos), def.atten) * ob.gain * mix;
    const alarm = i.event === 'alarm';
    const key = `${alarm ? 'alarm' : i.owner}:${Math.round(i.pos.x * 10)}:${Math.round(i.pos.y * 10)}`;
    const virtual = vs.every((v) => v.state === 'virtual');
    const muted = mix <= 0;
    const db = muted ? -120 : gainDb(g);
    const speed = i.event === 'generator' ? (s.machines.find((m) => m.id === i.owner)?.speed ?? 0.4) : 0;
    const pace: 1 | 2 | 3 = speed >= 0.67 ? 3 : speed >= 0.34 ? 2 : 1;
    const prev = out.get(key);
    if (!prev || db > prev.db) out.set(key, { key, name: alarm ? 'the alarm' : (SOURCE_NAME[i.owner] ?? i.owner), at: i.pos, db, virtual, muted, muffled: ob.obstructed, pace, alarm });
  }
  return [...out.values()];
}

/* ── ground ─────────────────────────────────────────────────────────────── */

/** A small deterministic generator for the gravel and the wood grain. */
function lcg(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

const Ground = memo(function Ground() {
  const art = useMemo(() => {
    const r = lcg(77);
    const hi = Skia.Path.Make();
    const lo = Skia.Path.Make();
    for (let i = 0; i < 380; i++) {
      const x = 0.15 + r() * (WALL_X - 0.3);
      const y = 0.15 + r() * (WORLD_H - 0.3);
      if (y > DOOR_Y0 - 0.12 && y < DOOR_Y1 + 0.12) continue;
      const rad = 0.03 + r() * 0.045;
      (r() > 0.45 ? hi : lo).addOval({ x: x - rad, y: y - rad * 0.8, width: rad * 2, height: rad * 1.6 });
    }
    // paving: two courses of slabs, the joints staggered
    const slabs: { x: number; y: number; w: number; h: number; tone: number }[] = [];
    for (let row = 0; row < 2; row++) {
      let x = row ? -0.7 : 0;
      while (x < WALL_X) {
        const w = 1.25 + r() * 0.5;
        const x0 = Math.max(0.06, x + 0.04);
        const x1 = Math.min(WALL_X - 0.02, x + w - 0.04);
        if (x1 - x0 > 0.3) slabs.push({ x: x0, y: DOOR_Y0 + row * 1 + 0.05, w: x1 - x0, h: 0.9, tone: r() });
        x += w;
      }
    }
    // floorboards run east–west; butt joints staggered board to board
    const boards: { x: number; y: number; w: number; h: number; tone: number }[] = [];
    const bh = 0.5;
    for (let k = 0; k * bh < WORLD_H; k++) {
      let x = WALL_X + WALL_T / 2 - r() * 1.6;
      while (x < WORLD_W) {
        const w = 2.2 + r() * 1.6;
        const x0 = Math.max(WALL_X + WALL_T / 2, x);
        const x1 = Math.min(WORLD_W - WALL_T / 2, x + w);
        if (x1 - x0 > 0.2) boards.push({ x: x0, y: k * bh, w: x1 - x0, h: bh, tone: r() });
        x += w;
      }
    }
    const grain = Skia.Path.Make();
    for (const b of boards) {
      for (let g = 0; g < 2; g++) {
        const gy = b.y + 0.12 + r() * (b.h - 0.24);
        grain.moveTo(b.x + 0.1, gy);
        grain.lineTo(b.x + b.w - 0.1, gy + (r() - 0.5) * 0.05);
      }
    }
    return { hi, lo, slabs, boards, grain };
  }, []);
  return (
    <Group>
      {/* gravel */}
      <Rect x={0} y={0} width={WALL_X} height={WORLD_H}>
        <LinearGradient start={vec(0, 0)} end={vec(WALL_X, WORLD_H)} colors={['#514d45', '#423f39', '#34322d']} />
      </Rect>
      <Path path={art.lo} color="#24221e" opacity={0.7} />
      <Path path={art.hi} color="#8a8477" opacity={0.5} />
      {/* the stone path */}
      <Rect x={0} y={DOOR_Y0 - 0.02} width={WALL_X} height={DOOR_Y1 - DOOR_Y0 + 0.04} color="#1a1b1e" />
      {art.slabs.map((b, i) => (
        <Group key={i}>
          <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={0.07}>
            <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.w, b.y + b.h)} colors={[b.tone > 0.5 ? '#8a8e96' : '#7c8088', b.tone > 0.5 ? '#5d6169' : '#555860']} />
          </RoundedRect>
          <Line p1={vec(b.x + 0.06, b.y + 0.035)} p2={vec(b.x + b.w - 0.06, b.y + 0.035)} color="rgba(255,255,255,0.22)" strokeWidth={0.03} />
        </Group>
      ))}
      {/* the workshop floor */}
      <Rect x={WALL_X} y={0} width={WORLD_W - WALL_X} height={WORLD_H} color="#2a1a0e" />
      {art.boards.map((b, i) => (
        <Rect key={i} x={b.x + 0.012} y={b.y + 0.012} width={b.w - 0.024} height={b.h - 0.024}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + b.h)} colors={b.tone > 0.5 ? ['#8a6238', '#6d4a28'] : ['#7c5630', '#5f3f21']} />
        </Rect>
      ))}
      <Path path={art.grain} style="stroke" strokeWidth={0.014} color="#3a2412" opacity={0.55} />
      {/* depth: the far corners fall off */}
      <Rect x={0} y={0} width={WORLD_W} height={WORLD_H}>
        <RadialGradient c={vec(WORLD_W * 0.42, WORLD_H * 0.4)} r={WORLD_W * 0.72} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']} />
      </Rect>
    </Group>
  );
});

/* ── walls and the door ─────────────────────────────────────────────────── */

const Walls = memo(function Walls({ doorOpen }: { doorOpen: boolean }) {
  const wall = useMemo(() => {
    const p = Skia.Path.Make();
    const t = WALL_T;
    const rect = (x: number, y: number, w: number, h: number) => p.addRect({ x, y, width: w, height: h });
    rect(WALL_X - t / 2, 0, t, DOOR_Y0); // west wall, above the door
    rect(WALL_X - t / 2, DOOR_Y1, t, WORLD_H - DOOR_Y1); // west wall, below it
    rect(WALL_X - t / 2, 0, WORLD_W - WALL_X + t / 2, t); // north
    rect(WALL_X - t / 2, WORLD_H - t, WORLD_W - WALL_X + t / 2, t); // south
    rect(WORLD_W - t, 0, t, WORLD_H); // east
    return p;
  }, []);
  // the leaf hangs on the north jamb and swings into the room
  const a = doorOpen ? (-80 * Math.PI) / 180 : 0;
  const leafLen = DOOR_Y1 - DOOR_Y0;
  return (
    <Group>
      <Path path={wall} color="rgba(0,0,0,0.5)" transform={[{ translateX: 0.1 }, { translateY: 0.12 }]} />
      <Path path={wall}>
        <LinearGradient start={vec(WALL_X, 0)} end={vec(WORLD_W, WORLD_H)} colors={['#b9bcc4', '#8b8f98', '#666a73']} />
      </Path>
      <Path path={wall} style="stroke" strokeWidth={0.035} color="rgba(255,255,255,0.28)" />
      {/* the threshold */}
      <Rect x={WALL_X - WALL_T / 2} y={DOOR_Y0} width={WALL_T} height={leafLen} color="#3b3d43" />
      {/* the swing, so a closed door still reads as a door */}
      <Path
        path={`M ${WALL_X} ${DOOR_Y1} A ${leafLen} ${leafLen} 0 0 0 ${WALL_X + leafLen * Math.sin((80 * Math.PI) / 180)} ${DOOR_Y0 + leafLen * Math.cos((80 * Math.PI) / 180)}`}
        style="stroke"
        strokeWidth={0.03}
        color="rgba(255,255,255,0.2)"
      >
        <DashPathEffect intervals={[0.16, 0.14]} />
      </Path>
      <Group origin={vec(WALL_X, DOOR_Y0)} transform={[{ rotate: a }]}>
        <RoundedRect x={WALL_X - 0.09 + 0.02} y={DOOR_Y0 + 0.04} width={0.2} height={leafLen} r={0.05} color="rgba(0,0,0,0.5)" />
        <RoundedRect x={WALL_X - 0.09} y={DOOR_Y0} width={0.18} height={leafLen} r={0.05}>
          <LinearGradient start={vec(WALL_X - 0.09, 0)} end={vec(WALL_X + 0.09, 0)} colors={['#c98a4a', '#8c5a2a', '#5e3a18']} />
        </RoundedRect>
        <Circle cx={WALL_X + 0.14} cy={DOOR_Y1 - 0.22} r={0.075} color="#d8dce2" />
        <Circle cx={WALL_X + 0.125} cy={DOOR_Y1 - 0.235} r={0.03} color="#ffffff" opacity={0.8} />
      </Group>
      <Circle cx={WALL_X} cy={DOOR_Y0} r={0.07} color="#2a2c31" />
    </Group>
  );
});

/* ── objects ────────────────────────────────────────────────────────────── */

/** A portable open-frame generator from above, as one stands on a site:
 *  two wheels at one end and two folding handles at the other; a tube frame;
 *  the fuel tank on top (the largest thing you see from above) with its
 *  filler cap and gauge; beside it the engine's finned cylinder head, the
 *  silver muffler with its outlet, and the pull-start handle; the outlet
 *  panel at the handle end with the run lamp. */
function Generator({ at, on, alarm, pulse }: { at: GaPoint; on: boolean; alarm: boolean; pulse: SharedValue<number> }) {
  const w = 1.9;
  const h = 1.3;
  const x = at.x - w / 2;
  const y = at.y - h / 2;
  const lx = x + w - 0.21; // the run lamp
  const ly = at.y + 0.24;
  const lamp = useDerivedValue(() => (alarm ? 0.35 + 0.65 * (pulse.value < 0.5 ? 1 : 0) : 1));
  const halo = useDerivedValue(() => (alarm ? 0.2 + 0.2 * ((pulse.value * 2) % 1) : 0.17));
  const haloO = useDerivedValue(() => (alarm ? 0.5 * (1 - ((pulse.value * 2) % 1)) + 0.12 : on ? 0.3 : 0));
  return (
    <Group>
      <RoundedRect x={x + 0.1} y={y + 0.13} width={w} height={h} r={0.16} color="rgba(0,0,0,0.5)" />
      {/* wheels, at the heavy end */}
      {[y - 0.06, y + h - 0.3].map((wy, k) => (
        <Group key={k}>
          <RoundedRect x={x - 0.1} y={wy} width={0.46} height={0.36} r={0.1} color="#141518" />
          <RoundedRect x={x - 0.06} y={wy + 0.05} width={0.38} height={0.07} r={0.03} color="rgba(255,255,255,0.16)" />
          <Line p1={vec(x + 0.02, wy + 0.18)} p2={vec(x + 0.28, wy + 0.18)} color="#3a3c42" strokeWidth={0.04} />
        </Group>
      ))}
      {/* folding handles, at the other end */}
      {[y + 0.17, y + h - 0.17].map((hy, k) => (
        <Group key={k}>
          <Line p1={vec(x + w - 0.05, hy)} p2={vec(x + w + 0.3, hy)} color="#9aa0a9" strokeWidth={0.07} strokeCap="round" />
          <Line p1={vec(x + w + 0.14, hy)} p2={vec(x + w + 0.34, hy)} color="#17181b" strokeWidth={0.11} strokeCap="round" />
        </Group>
      ))}
      {/* tube frame, with its two cross rails */}
      <RoundedRect x={x} y={y} width={w} height={h} r={0.16} style="stroke" strokeWidth={0.11} color="#2b2d32" />
      <RoundedRect x={x} y={y} width={w} height={h} r={0.16} style="stroke" strokeWidth={0.045} color="#9aa0a9" />
      <Line p1={vec(x + 1.2, y + 0.04)} p2={vec(x + 1.2, y + h - 0.04)} color="#5b5f68" strokeWidth={0.05} />
      {/* the fuel tank, on top */}
      <RoundedRect x={x + 0.16} y={y + 0.15} width={1.0} height={h - 0.3} r={0.2}>
        <LinearGradient start={vec(x, y)} end={vec(x + 1.1, y + h)} colors={['#ea6a5c', '#bb3d30', '#70211a']} />
      </RoundedRect>
      <RoundedRect x={x + 0.26} y={y + 0.21} width={0.8} height={0.07} r={0.035} color="rgba(255,255,255,0.34)" />
      <RoundedRect x={x + 0.16} y={y + 0.15} width={1.0} height={h - 0.3} r={0.2} style="stroke" strokeWidth={0.03} color="rgba(0,0,0,0.45)" />
      {/* filler cap, and the fuel gauge beside it */}
      <Circle cx={x + 0.5} cy={at.y - 0.08} r={0.17} color="rgba(0,0,0,0.4)" />
      <Circle cx={x + 0.49} cy={at.y - 0.1} r={0.15}>
        <RadialGradient c={vec(x + 0.45, at.y - 0.15)} r={0.2} colors={['#3d4047', '#17181b']} />
      </Circle>
      <Line p1={vec(x + 0.39, at.y - 0.1)} p2={vec(x + 0.59, at.y - 0.1)} color="#6f737c" strokeWidth={0.035} strokeCap="round" />
      <Circle cx={x + 0.9} cy={at.y + 0.2} r={0.085} color="#f1f3f6" />
      <Line p1={vec(x + 0.9, at.y + 0.2)} p2={vec(x + 0.95, at.y + 0.15)} color="#c0392b" strokeWidth={0.025} />
      {/* the engine: finned cylinder head */}
      <RoundedRect x={x + 1.26} y={y + 0.46} width={0.32} height={0.5} r={0.05} color="#1d1e22" />
      {[0, 1, 2, 3].map((k) => (
        <Line key={k} p1={vec(x + 1.28, y + 0.53 + k * 0.12)} p2={vec(x + 1.56, y + 0.53 + k * 0.12)} color="#7c8089" strokeWidth={0.035} />
      ))}
      {/* the muffler and its outlet */}
      <RoundedRect x={x + 1.26} y={y + 0.13} width={0.4} height={0.26} r={0.1}>
        <LinearGradient start={vec(x + 1.26, y + 0.13)} end={vec(x + 1.26, y + 0.39)} colors={['#eceef2', '#9ba0aa', '#5b5f68']} />
      </RoundedRect>
      {[0, 1, 2].map((k) => (
        <Circle key={k} cx={x + 1.35 + k * 0.11} cy={y + 0.26} r={0.025} color="#2b2d32" />
      ))}
      <RoundedRect x={x + 1.4} y={y - 0.03} width={0.12} height={0.18} r={0.03} color="#4a4d55" />
      {/* the pull-start handle */}
      <Line p1={vec(x + 1.42, y + h - 0.3)} p2={vec(x + 1.42, y + h + 0.06)} color="#c9ccd2" strokeWidth={0.03} />
      <Line p1={vec(x + 1.32, y + h + 0.08)} p2={vec(x + 1.52, y + h + 0.08)} color="#17181b" strokeWidth={0.09} strokeCap="round" />
      {/* the outlet panel and the run lamp */}
      <RoundedRect x={x + w - 0.34} y={y + 0.16} width={0.26} height={h - 0.32} r={0.06}>
        <LinearGradient start={vec(x + w - 0.34, y)} end={vec(x + w - 0.08, y + h)} colors={['#3a3d45', '#121316']} />
      </RoundedRect>
      <RoundedRect x={x + w - 0.29} y={y + 0.26} width={0.16} height={0.14} r={0.03} color="#6f737c" />
      <RoundedRect x={x + w - 0.29} y={y + 0.46} width={0.16} height={0.14} r={0.03} color="#6f737c" />
      <Circle cx={lx} cy={ly} r={halo} color={alarm ? '#ff5a48' : '#5bff85'} opacity={haloO} />
      <Circle cx={lx} cy={ly} r={0.085} color={alarm ? '#ff5a48' : on ? '#5bff85' : '#2a2d33'} opacity={lamp} />
    </Group>
  );
}

/** A round stone basin with water; ripples spread while it is running. */
function Fountain({ at, running, phase }: { at: GaPoint; running: boolean; phase: SharedValue<number> }) {
  const r1 = useDerivedValue(() => 0.12 + ((phase.value * 1.0) % 1) * 0.72);
  const o1 = useDerivedValue(() => (running ? 0.5 * (1 - ((phase.value * 1.0) % 1)) : 0));
  const r2 = useDerivedValue(() => 0.12 + ((phase.value + 0.5) % 1) * 0.72);
  const o2 = useDerivedValue(() => (running ? 0.5 * (1 - ((phase.value + 0.5) % 1)) : 0));
  return (
    <Group>
      <Circle cx={at.x + 0.1} cy={at.y + 0.13} r={1.16} color="rgba(0,0,0,0.5)" />
      <Circle cx={at.x} cy={at.y} r={1.16}>
        <RadialGradient c={vec(at.x - 0.4, at.y - 0.45)} r={1.9} colors={['#c9ccd2', '#8a8e96', '#4b4e55']} />
      </Circle>
      <Circle cx={at.x} cy={at.y} r={0.9}>
        <RadialGradient c={vec(at.x - 0.25, at.y - 0.3)} r={1.2} colors={['#5fa6d8', '#2c6a9c', '#123552']} />
      </Circle>
      <Circle cx={at.x} cy={at.y} r={0.9} style="stroke" strokeWidth={0.05} color="rgba(0,0,0,0.45)" />
      <Circle cx={at.x} cy={at.y} r={r1} style="stroke" strokeWidth={0.035} color="#d6ecff" opacity={o1} />
      <Circle cx={at.x} cy={at.y} r={r2} style="stroke" strokeWidth={0.035} color="#d6ecff" opacity={o2} />
      <Circle cx={at.x} cy={at.y} r={0.17}>
        <RadialGradient c={vec(at.x - 0.05, at.y - 0.06)} r={0.2} colors={['#ffffff', '#9aa0a9', '#4a4f57']} />
      </Circle>
    </Group>
  );
}

/** A wooden crate from above: boards, a diagonal brace, corner nails. */
const Crate = memo(function Crate({ at }: { at: GaPoint }) {
  const s = 1.15;
  const x = at.x - s / 2;
  const y = at.y - s / 2;
  return (
    <Group>
      <RoundedRect x={x + 0.09} y={y + 0.11} width={s} height={s} r={0.05} color="rgba(0,0,0,0.5)" />
      <RoundedRect x={x} y={y} width={s} height={s} r={0.05}>
        <LinearGradient start={vec(x, y)} end={vec(x + s, y + s)} colors={['#d9a561', '#a8733a', '#6d4720']} />
      </RoundedRect>
      {[1, 2, 3].map((k) => (
        <Line key={k} p1={vec(x + (s * k) / 4, y + 0.08)} p2={vec(x + (s * k) / 4, y + s - 0.08)} color="#4a2f14" strokeWidth={0.03} />
      ))}
      <Line p1={vec(x + 0.1, y + 0.1)} p2={vec(x + s - 0.1, y + s - 0.1)} color="#5e3a18" strokeWidth={0.16} />
      <Line p1={vec(x + 0.1, y + 0.07)} p2={vec(x + s - 0.13, y + s - 0.13)} color="#e0b070" strokeWidth={0.03} opacity={0.7} />
      <RoundedRect x={x} y={y} width={s} height={s} r={0.05} style="stroke" strokeWidth={0.09} color="#5e3a18" />
      <RoundedRect x={x + 0.02} y={y + 0.02} width={s - 0.04} height={s - 0.04} r={0.04} style="stroke" strokeWidth={0.02} color="rgba(255,255,255,0.3)" />
      {[[0.09, 0.09], [s - 0.09, 0.09], [0.09, s - 0.09], [s - 0.09, s - 0.09]].map(([dx, dy], i) => (
        <Circle key={i} cx={x + dx} cy={y + dy} r={0.03} color="#2a1a0e" />
      ))}
    </Group>
  );
});

/** The house top-view person, at world position, facing a compass bearing.
 *  The figure's own frame has its chest toward +x, in millimetres. */
function Person({ at, facing, ring, second = false }: { at: GaPoint; facing: number; ring: string; second?: boolean }) {
  const k = 0.001 * PERSON_K;
  return (
    <Group>
      <Circle cx={at.x + 0.06} cy={at.y + 0.1} r={0.52} color="rgba(0,0,0,0.42)" />
      <Circle cx={at.x} cy={at.y} r={0.74} style="stroke" strokeWidth={0.05} color={ring} opacity={0.9} />
      {/* the guide is told from YOU by shape as well as color: a second, broken ring */}
      {second ? (
        <Circle cx={at.x} cy={at.y} r={0.9} style="stroke" strokeWidth={0.04} color={ring} opacity={0.8}>
          <DashPathEffect intervals={[0.12, 0.16]} />
        </Circle>
      ) : null}
      <Group transform={[{ translateX: at.x }, { translateY: at.y }, { rotate: ((facing - 90) * Math.PI) / 180 }, { scale: k }]}>
        <PlayerBehind pose={SINGER_TOP} />
        <PlayerInFront pose={SINGER_TOP} hands={false} />
      </Group>
    </Group>
  );
}

/** Where the listener's ears point: a soft wedge ahead of the player. */
function ListenerWedge({ at, facing }: { at: GaPoint; facing: number }) {
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const R = 2.2;
    const half = (50 * Math.PI) / 180;
    p.moveTo(0, 0);
    for (let i = 0; i <= 16; i++) {
      const a = -half + (2 * half * i) / 16;
      p.lineTo(R * Math.sin(a), -R * Math.cos(a));
    }
    p.close();
    return p;
  }, []);
  return (
    <Group transform={[{ translateX: at.x }, { translateY: at.y }, { rotate: (facing * Math.PI) / 180 }]}>
      <Path path={path}>
        <RadialGradient c={vec(0, 0)} r={2.2} colors={['rgba(255,198,77,0.26)', 'rgba(255,198,77,0.02)']} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={0.025} color="rgba(255,198,77,0.34)" />
    </Group>
  );
}

/** The overhead listener: a camera above the middle of the scene. */
const CameraMark = memo(function CameraMark() {
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  return (
    <Group>
      {/* kept inside 0.8 m, so it stands clear of the door (1 m east) and its label */}
      <Circle cx={cx} cy={cy} r={0.8} style="stroke" strokeWidth={0.05} color="rgba(255,198,77,0.8)">
        <DashPathEffect intervals={[0.2, 0.14]} />
      </Circle>
      <RoundedRect x={cx - 0.46} y={cy - 0.3} width={0.92} height={0.6} r={0.1}>
        <LinearGradient start={vec(cx - 0.46, cy - 0.3)} end={vec(cx + 0.46, cy + 0.3)} colors={['#4a4d55', '#1c1d21']} />
      </RoundedRect>
      <Circle cx={cx} cy={cy} r={0.22}>
        <RadialGradient c={vec(cx - 0.06, cy - 0.08)} r={0.27} colors={['#9fd0ff', '#2c5a8c', '#0a1522']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={0.22} style="stroke" strokeWidth={0.04} color="#d8dce2" />
      <RoundedRect x={cx + 0.2} y={cy - 0.42} width={0.2} height={0.12} r={0.03} color="#6f737c" />
    </Group>
  );
});

/** The alarm's VISUAL equivalent (an accessibility option): a warning sign
 *  over the generator — a shape and a word, never colour alone. */
function AlarmSign({ at }: { at: GaPoint }) {
  const size = useLabelMm(10);
  const tri = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, -0.62);
    p.lineTo(0.6, 0.42);
    p.lineTo(-0.6, 0.42);
    p.close();
    return p;
  }, []);
  return (
    <Group transform={[{ translateX: at.x - 1.75 }, { translateY: at.y }]}>
      <Path path={tri} color="#1a1205" />
      <Path path={tri} style="stroke" strokeWidth={0.12} strokeJoin="round" color="#ffc64d" />
      <Line p1={vec(0, -0.26)} p2={vec(0, 0.12)} color="#ffc64d" strokeWidth={0.12} strokeCap="round" />
      <Circle cx={0} cy={0.28} r={0.07} color="#ffc64d" />
      <SceneText x={0} y={-0.82} size={size} text="OVERHEAT" color="#ffc64d" face="label" align="center" />
    </Group>
  );
}

/* ── sound ──────────────────────────────────────────────────────────────── */

/** One spreading ring. `pace` (a whole number, so the loop has no jump) is
 *  how many times it spreads per cycle. The alarm's rings are wider, start
 *  further out and are BROKEN into segments: told apart by shape, since the
 *  color is the level on the house ramp for every source. */
function Ring({ at, k, phase, color, strength, moving, pace, alarm }: { at: GaPoint; k: number; phase: SharedValue<number>; color: string; strength: number; moving: boolean; pace: number; alarm: boolean }) {
  const frac = useDerivedValue(() => (moving ? (phase.value * pace + k / 3) % 1 : (k + 1) / 3.4));
  const r = useDerivedValue(() => (alarm ? 1.05 + frac.value * 1.85 : 0.75 + frac.value * 1.5));
  const o = useDerivedValue(() => strength * (moving ? 1 - frac.value : 0.85 - k * 0.25));
  return (
    <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={alarm ? 0.1 : 0.07} color={color} opacity={o}>
      {alarm ? <DashPathEffect intervals={[0.42, 0.26]} /> : null}
    </Circle>
  );
}

function SoundRings({ s, phase, moving }: { s: Sounding; phase: SharedValue<number>; moving: boolean }) {
  // tracked but not played, or silenced by the mix: one still, dashed ring
  if (s.virtual || s.muted) {
    return (
      <Circle cx={s.at.x} cy={s.at.y} r={s.alarm ? 1.45 : 1.15} style="stroke" strokeWidth={0.05} color="#8a8b93">
        <DashPathEffect intervals={s.alarm ? [0.42, 0.26] : [0.14, 0.14]} />
      </Circle>
    );
  }
  const color = levelColorForDb(s.db, -36, 0);
  const strength = 0.35 + 0.65 * Math.max(0, Math.min(1, (s.db + 36) / 36));
  return (
    <Group>
      {[0, 1, 2].map((k) => (
        <Ring key={k} at={s.at} k={k} phase={phase} color={color} strength={strength} moving={moving} pace={s.pace} alarm={s.alarm} />
      ))}
    </Group>
  );
}

/** The guide is speaking a line: a speech mark beside the figure (a spoken
 *  line has no position in this scene, so it has no rings). */
function Speaking({ at }: { at: GaPoint }) {
  const bx = at.x + 0.5;
  const by = at.y - 1.72;
  const tail = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(bx + 0.16, by + 0.62);
    p.lineTo(bx - 0.06, by + 1.0);
    p.lineTo(bx + 0.5, by + 0.62);
    p.close();
    return p;
  }, [bx, by]);
  return (
    <Group>
      <RoundedRect x={bx + 0.05} y={by + 0.07} width={1.3} height={0.68} r={0.26} color="rgba(0,0,0,0.45)" />
      <Path path={tail} color="#f4f6f8" />
      <RoundedRect x={bx} y={by} width={1.3} height={0.68} r={0.26} color="#f4f6f8" />
      {[0, 1, 2].map((k) => (
        <Circle key={k} cx={bx + 0.35 + k * 0.3} cy={by + 0.34} r={0.085} color="#1c1d21" />
      ))}
    </Group>
  );
}

/* ── labels ─────────────────────────────────────────────────────────────── */

/** A label's place: its centre, baseline and text (for keeping labels off
 *  each other). */
type Placed = { x: number; y: number; text: string };

function Labels({ s, select, showNames }: { s: GaState; select: GaSceneSelect; showNames: boolean }) {
  const zone = useLabelMm(10);
  const tag = useLabelMm(9.5);
  const p = s.chars.player;
  const g = s.chars.guide;
  const shown = (key: Exclude<GaSceneSelect, null>) => showNames || select === key;
  // the labels that never move (x = centre)
  const letter = tag * 0.66;
  const doorText = s.doorOpen ? 'DOOR OPEN' : 'DOOR CLOSED';
  const doorRight = WALL_X - 0.42; // right-aligned: it ends before the wall
  const fixed: (Placed & { key: Exclude<GaSceneSelect, null> })[] = [];
  if (shown('generator-1')) fixed.push({ key: 'generator-1', x: PLACES.generator.x, y: PLACES.generator.y + 1.45, text: s.machines.length > 1 ? 'GENERATOR 1' : 'GENERATOR' });
  if (s.machines.length > 1 && shown('generator-2')) fixed.push({ key: 'generator-2', x: PLACES.generator2.x, y: PLACES.generator2.y - 0.95, text: 'GENERATOR 2' });
  if (shown('fountain')) fixed.push({ key: 'fountain', x: PLACES.fountain.x, y: PLACES.fountain.y + 1.85, text: 'FOUNTAIN' });
  if (shown('crate')) fixed.push({ key: 'crate', x: PLACES.crate.x, y: PLACES.crate.y - 0.85, text: 'CRATE' });
  const door: Placed | null = shown('door') ? { x: doorRight - (doorText.length * letter) / 2, y: DOOR_Y0 - 0.3, text: doorText } : null;
  const hits = (a: Placed, b: Placed) => Math.abs(a.x - b.x) < ((a.text.length + b.text.length) * letter) / 2 + 0.2 && Math.abs(a.y - b.y) < tag * 1.15;
  // a person's label sits under the figure; where that would land on
  // another label or leave the picture, it goes above the figure instead
  const beside = (c: GaPoint, text: string, others: Placed[]): Placed => {
    const below = { x: c.x, y: c.y + 1.45, text };
    const above = { x: c.x, y: c.y - 0.98, text };
    const bad = (q: Placed) => q.y > WORLD_H - 0.25 || q.y < tag + 0.2 || others.some((o) => hits(q, o));
    return bad(below) && !bad(above) ? above : below;
  };
  const still: Placed[] = [...fixed, ...(door ? [door] : [])];
  const you = beside(p, 'YOU', still);
  const guide = beside(g, 'GUIDE', [...still, you]);
  return (
    <Group>
      <SceneText x={0.35} y={WORLD_H - 0.35} size={zone} text="COURTYARD" color="rgba(244,246,248,0.62)" face="label" />
      {/* in the room's north-west corner: clear of both generators' rings and of the guide */}
      <SceneText x={WALL_X + 0.45} y={0.98} size={zone} text="WORKSHOP" color="rgba(244,246,248,0.62)" face="label" />
      <SceneText x={you.x} y={you.y} size={tag} text="YOU" color="#ffc64d" face="label" align="center" />
      <SceneText x={guide.x} y={guide.y} size={tag} text="GUIDE" color="#9fd0ff" face="label" align="center" />
      {fixed.map((f) => (
        <SceneText key={f.key} x={f.x} y={f.y} size={tag} text={f.text} color="#f4f6f8" face="label" align="center" />
      ))}
      {door ? <SceneText x={doorRight} y={door.y} size={tag} text={door.text} color="#f4f6f8" face="label" align="right" /> : null}
    </Group>
  );
}

function Range({ s, select }: { s: GaState; select: GaSceneSelect }) {
  const size = useLabelMm(9);
  if (!select || select === 'guide') return null;
  const at = select === 'generator-1' ? PLACES.generator : select === 'generator-2' ? PLACES.generator2 : select === 'fountain' ? PLACES.fountain : select === 'crate' ? PLACES.crate : PLACES.door;
  const def = GA_EVENTS[select === 'fountain' ? 'fountain' : select === 'crate' ? 'crate_impact' : select === 'door' ? 'door_open' : 'generator'];
  if (!def.atten) return null;
  const L = listenerOf(s);
  return (
    <Group>
      <Circle cx={at.x} cy={at.y} r={def.atten.min} style="stroke" strokeWidth={0.05} color="#5bff85">
        <DashPathEffect intervals={[0.2, 0.14]} />
      </Circle>
      <Circle cx={at.x} cy={at.y} r={def.atten.max} style="stroke" strokeWidth={0.05} color="#6fa8ff">
        <DashPathEffect intervals={[0.34, 0.2]} />
      </Circle>
      <Line p1={vec(L.x, L.y)} p2={vec(at.x, at.y)} color="rgba(244,246,248,0.7)" strokeWidth={0.04}>
        <DashPathEffect intervals={[0.1, 0.12]} />
      </Line>
      {/* above its ring; where the picture's edge leaves no room there, beside
          the ring (never under it: the object's own name is printed there) */}
      {at.y - def.atten.min - 0.12 < 0.7 ? (
        <SceneText x={at.x + def.atten.min + 0.18} y={at.y + size * 0.35} size={size} text={`MIN ${def.atten.min} m`} color="#5bff85" face="label" />
      ) : (
        <SceneText x={at.x} y={at.y - def.atten.min - 0.12} size={size} text={`MIN ${def.atten.min} m`} color="#5bff85" face="label" align="center" />
      )}
      {/* the maximum's label sits on its ring: at the point nearest the
          listener that is still clear of the listener's figure and label */}
      {(() => {
        let best: GaPoint | null = null;
        let bestScore = -1;
        for (let n = 0; n < 60; n++) {
          const a = (n / 60) * Math.PI * 2;
          const mx = at.x + Math.cos(a) * def.atten.max;
          const my = at.y + Math.sin(a) * def.atten.max;
          if (mx < 1.3 || mx > WORLD_W - 1.3 || my < 0.9 || my > WORLD_H - 0.5) continue;
          const d = Math.hypot(mx - L.x, my - L.y);
          const score = d >= 2.1 ? 100 - d : d;
          if (score > bestScore) {
            bestScore = score;
            best = { x: mx, y: my };
          }
        }
        return best ? <SceneText x={best.x} y={best.y - 0.15} size={size} text={`MAX ${def.atten.max} m`} color="#6fa8ff" face="label" align="center" /> : null;
      })()}
    </Group>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */

export type GaSceneProps = {
  w: number;
  h: number;
  state: GaState;
  select?: GaSceneSelect;
  /** Print every object's name (first pages); otherwise only the selected. */
  showNames?: boolean;
};

/** In words, for a screen reader: what is where and what is sounding. */
export function gaSceneSummary(s: GaState): string {
  const L = listenerOf(s);
  const p = s.chars.player;
  const where = p.x >= WALL_X ? 'in the workshop' : 'in the courtyard';
  const all = soundingOf(s);
  const heard = all.filter((x) => !x.virtual && !x.muted).map((x) => x.name);
  const silenced = all.filter((x) => !x.virtual && x.muted).map((x) => x.name);
  const speaking = s.inst.some((i) => i.event === 'vo_greeting' || i.event === 'vo_warning');
  return (
    `A courtyard on the left and a workshop on the right, seen from above. You are ${where}, facing ${Math.round(p.facing)} degrees. ` +
    `The door is ${s.doorOpen ? 'open' : 'closed'}. The listener is ${s.listenerMode === 'camera' ? 'an overhead camera' : 'the player'} at ${L.x.toFixed(1)}, ${L.y.toFixed(1)} metres. ` +
    (heard.length ? `Sounding now: ${[...new Set(heard)].join(', ')}.` : 'Nothing positioned is sounding.') +
    (silenced.length ? ` Silenced by the mix: ${[...new Set(silenced)].join(', ')}.` : '') +
    (speaking ? ' The guide is speaking a line.' : '')
  );
}

export function GaScene({ w, h, state: s, select = null, showNames = false }: GaSceneProps) {
  const k = Math.min(w / WORLD_W, h / WORLD_H);
  const ox = (w - WORLD_W * k) / 2;
  const oy = (h - WORLD_H * k) / 2;
  const textScale = useStageTextScale();
  const decorative = useDecorativeMotion();
  const phase = useSharedValue(0);
  const sounding = useMemo(() => soundingOf(s), [s]);
  const anyMoving = sounding.some((x) => !x.virtual && !x.muted) || s.inst.some((i) => i.event === 'alarm');
  useEffect(() => {
    if (!anyMoving || !decorative) {
      cancelAnimation(phase);
      return;
    }
    phase.value = 0;
    phase.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
  }, [anyMoving, decorative, phase]);

  const p = s.chars.player;
  const g = s.chars.guide;
  const alarm = s.inst.some((i) => i.event === 'alarm');
  const fountainOn = s.inst.some((i) => i.event === 'fountain');
  const guideSpeaks = s.inst.some((i) => i.event === 'vo_greeting' || i.event === 'vo_warning');
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={gaSceneSummary(s)}>
      <Canvas style={{ width: w, height: h }}>
        <SceneFontsProvider s={k} textScale={textScale}>
          <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: k }]} clip={WORLD_CLIP}>
            <Ground />
            <Fountain at={PLACES.fountain} running={fountainOn && decorative} phase={phase} />
            <Crate at={PLACES.crate} />
            <Walls doorOpen={s.doorOpen} />
            {s.machines.map((m) => (
              <Generator key={m.id} at={m} on={m.on} alarm={alarm && m.id === 'generator-1'} pulse={phase} />
            ))}
            {s.listenerMode === 'player' ? <ListenerWedge at={p} facing={p.facing} /> : null}
            <Range s={s} select={select} />
            {sounding.map((x) => (
              <SoundRings key={x.key} s={x} phase={phase} moving={decorative} />
            ))}
            <Person at={g} facing={g.facing} ring="#6fa8ff" second />
            <Person at={p} facing={p.facing} ring="#ffc64d" />
            {guideSpeaks ? <Speaking at={g} /> : null}
            {s.listenerMode === 'camera' ? <CameraMark /> : null}
            {alarm && s.options.visualCue ? <AlarmSign at={PLACES.generator} /> : null}
            <Labels s={s} select={select} showNames={showNames} />
          </Group>
        </SceneFontsProvider>
      </Canvas>
    </View>
  );
}
