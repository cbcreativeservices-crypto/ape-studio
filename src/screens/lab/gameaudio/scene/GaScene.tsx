/**
 * GaScene — the Game Audio lab's shared scene, drawn from model/gaWorld: a
 * courtyard and a workshop from above. What is drawn is the model, not a
 * picture of one: every object sits at its world position, the door leaf is
 * open or closed as the state says, and the SOUND you see is the sound the
 * model has playing. The rules are in scene/gaSceneLogic.ts (pure, tested);
 * this file only draws what that file decides.
 *
 *   ground     gravel, a stone path to the door, the workshop's wood floor —
 *              the three surfaces a footstep switches between
 *   objects    the generator(s), the fountain, the crate, the door in the wall
 *              (and a bird, drawn where it calls, only while it calls)
 *   people     the player and the guide: the house top-view figure
 *              (miking/lessons/shared/players), turned to face where the
 *              model says they face. A figure GLIDES to a new place and turns
 *              (a short tween); the door leaf swings
 *   the        a wedge in front of the listener (where the ears point), or
 *   listener   a labeled camera over the middle in the overhead view
 *   sound      a LOOP is a train of rings spreading from its object; a
 *              generator's rings leave more often, and sit closer, as its
 *              SPEED rises. A ONE-SHOT is one ring per sounding voice that
 *              leaves when the voice starts and fades over the sound's own
 *              length (a layer that starts late has no ring until then).
 *              Rings are colored on the house level ramp by how loud the
 *              source is AT THE LISTENER after distance, the wall AND the mix
 *              (blue = faint … red = loud); a quiet source keeps rings a
 *              learner can see. The alarm has its own, broken rings. A source
 *              heard THROUGH THE CLOSED DOOR has rings that stop at the wall
 *              and go on beyond it thin and dashed. A source that is tracked
 *              but not rendered (virtual, or its voice was stolen), or that
 *              the mix has silenced, keeps one still, dashed grey ring. A
 *              speech mark stands by the guide while a line plays.
 *   selection  the selected source's minimum and maximum distance, dashed,
 *              each with its number, always whole inside the picture
 *   on request (`show`, off by default) a page can ask for: instance ids by a
 *              generator's rings, the MOOD state across the picture, a
 *              listener wedge on the guide, the surface or the take by the
 *              foot that stepped, and a mark for each ambience bed
 *
 * MOTION. Every moving thing is driven from the model's state. With motion
 * reduced (useDecorativeMotion) nothing moves and nothing is lost: rings
 * stand still at the spacing their pace gives, figures and the door are
 * drawn where they are, a bed's mark shows its level.
 *
 * Objects and people are drawn LARGER than life (a 0.5 m person would be
 * 10 pt wide on a phone); positions and distances are true. The lab says
 * this once, on its first page.
 *
 * Units: world meters inside one scaled Group. Text is drawn at a size given
 * in points on the glass (useLabelMm) and is refused under 9 pt.
 */
import { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, Text, rect, vec, type SkFont, type SkRect } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, useDerivedValue, useFrameCallback, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../features/settings/decorativeMotion';
import { useSafeSkiaFont } from '../../../../lib/skiaSafeAssets';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import { MIN_TEXT_PT, SceneFontsContext, SceneFontsProvider, useLabelMm } from '../../dj/art/sceneText';
import { PlayerBehind, PlayerInFront } from '../../miking/lessons/shared/players/PlayerFigure';
import { SINGER_TOP } from '../../miking/lessons/shared/voice/voicePose';
import { useStageTextScale } from '../../rack/stageAspect';
import { GA_EVENTS } from '../model/gaDefs';
import { listenerOf, type GaState } from '../model/gaModel';
import { gaNow } from '../model/gaStore';
import { DOOR_Y0, DOOR_Y1, PLACES, WALL_X, WORLD_H, WORLD_W, zoneAt, type GaPoint } from '../model/gaWorld';
import {
  GA_ALARM_GAP,
  GA_RING_DB_MAX,
  GA_RING_DB_MIN,
  GA_RING_SPEED,
  gaBedFadeSeconds,
  gaBedMarks,
  gaClampLabelX,
  gaFootMarks,
  gaFootText,
  gaHeard,
  gaNextRingChange,
  gaOtherZone,
  gaPersonLabel,
  gaRangeLabels,
  gaRingGap,
  gaRingLook,
  gaSceneSummary,
  gaSelected,
  gaSelectedBehind,
  gaSoundingOf,
  gaTextBox,
  gaBoxesHit,
  gaWallCrossing,
  gaWallPieceOwner,
  gaZoneRect,
  type GaBox,
  type GaSceneSelect,
  type GaShotRing,
  type GaSounding,
} from './gaSceneLogic';

export { gaSceneSummary, type GaSceneSelect };

export const GA_SCENE_ASPECT = WORLD_W / WORLD_H;
const WORLD_CLIP = rect(0, 0, WORLD_W, WORLD_H);

/** People and objects are drawn this much larger than life. */
const PERSON_K = 2.5;
const WALL_T = 0.34;

/** What a page may ask the picture to show as well. Every field is OFF
 *  unless the page's rack spec turns it on (GaRackSpec.show), so no page
 *  changes until its own fixer asks. */
export type GaSceneShow = {
  /** Page 7: print the INSTANCE id by each generator's rings ("two
   *  instances" read on the glass; an orphan loop shows its id with no
   *  machine under it). */
  ids?: boolean;
  /** Page 8: the game's MOOD state, the one thing that changes everywhere
   *  at once: the words MOOD · CALM / MOOD · ALERT, and while it is ALERT a
   *  border around the whole picture (a shape and words, never color alone). */
  mood?: boolean;
  /** Page 18: the GUIDE is the other player: draw a second, blue listener
   *  wedge on the guide ("the other player's ears"). */
  guideListens?: boolean;
  /** Page 8: for a moment after a footstep, name the SURFACE the sound was
   *  chosen for, by the foot that stepped (GRAVEL, STONE PATH, WOOD FLOOR). */
  surface?: boolean;
  /** Page 9: for a moment after a footstep, print the TAKE that played
   *  (TAKE 3), by the foot that stepped. */
  take?: boolean;
  /** Pages 1 and 10: a soft, slow mark over each zone while its ambience
   *  bed plays (courtyard wind, workshop room tone), dimmer as its level
   *  falls, with the words · WIND / · ROOM TONE beside the zone's name. */
  beds?: boolean;
};

/* ── motion: glide from the old value to the new ────────────────────────── */

/** A number that follows `target`: a short tween, or at once when motion is
 *  reduced. */
function useGlide(target: number, ms: number, on: boolean, linear = false): SharedValue<number> {
  const v = useSharedValue(target);
  useEffect(() => {
    if (!on) {
      cancelAnimation(v);
      v.value = target;
      return;
    }
    v.value = withTiming(target, { duration: ms, easing: linear ? Easing.linear : Easing.out(Easing.cubic) });
  }, [target, ms, on, linear, v]);
  return v;
}

type Glided = { x: SharedValue<number>; y: SharedValue<number>; facing: SharedValue<number> };

/** A figure's place and facing as it is DRAWN: it walks to a new place (the
 *  farther, the longer, 0.16 … 0.62 s) and turns the short way round. */
function useGlidedChar(c: { x: number; y: number; facing: number }, on: boolean): Glided {
  const x = useSharedValue(c.x);
  const y = useSharedValue(c.y);
  const facing = useSharedValue(c.facing);
  const last = useRef({ x: c.x, y: c.y, turn: c.facing });
  useEffect(() => {
    const d = Math.hypot(c.x - last.current.x, c.y - last.current.y);
    // the short way round: 350° → 10° is +20°, not −340°
    const delta = ((((c.facing - last.current.turn) % 360) + 540) % 360) - 180;
    const turn = last.current.turn + delta;
    last.current = { x: c.x, y: c.y, turn };
    if (!on) {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(facing);
      x.value = c.x;
      y.value = c.y;
      facing.value = turn;
      return;
    }
    if (d > 1e-4) {
      const ms = Math.max(160, Math.min(620, 110 + d * 110));
      x.value = withTiming(c.x, { duration: ms, easing: Easing.out(Easing.cubic) });
      y.value = withTiming(c.y, { duration: ms, easing: Easing.out(Easing.cubic) });
    }
    if (Math.abs(delta) > 1e-4) facing.value = withTiming(turn, { duration: 140, easing: Easing.out(Easing.cubic) });
  }, [c.x, c.y, c.facing, on, x, y, facing]);
  return { x, y, facing };
}

/* ── text ───────────────────────────────────────────────────────────────── */

/** The label face at 100 units. The lab's shared scene font (dj/art
 *  sceneText) is 10 units; drawn through a scale, its letter widths are
 *  rounded to whole units and a gap opens after some letters ("FOUNT AIN",
 *  audit 2 W1 F23). This is the SAME typeface file at ten times the size, so
 *  the spacing is ten times finer; sizes on the glass and the 9 pt floor are
 *  unchanged. Loaded once for the scene through the house's guarded loader;
 *  until it arrives the shared font draws the words, as before. */
const LABEL_TTF = require('@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf');
const NOMINAL = 100;
type Fine = { font: SkFont; nominal: number };
const FineFontContext = createContext<SkFont | null>(null);
/** Kept for the lab's whole visit: every scene after the first has it on
 *  its first frame, so the words never shift when a page opens. */
let fineKept: SkFont | null = null;
function useFineFont(): SkFont | null {
  const loaded = useSafeSkiaFont(LABEL_TTF, NOMINAL);
  if (loaded && loaded !== fineKept) {
    try {
      loaded.setSubpixel(true);
      loaded.setLinearMetrics(true);
    } catch {
      // a Skia without these setters draws the same face, a little less exactly
    }
    fineKept = loaded;
  }
  return loaded ?? fineKept;
}
function useFine(): Fine | null {
  const f = useContext(SceneFontsContext);
  const fine = useContext(FineFontContext);
  return useMemo(() => (fine ? { font: fine, nominal: NOMINAL } : f.label ? { font: f.label, nominal: 10 } : null), [fine, f.label]);
}

/** A text's width in meters at `size`. Before the font loads: an estimate. */
function useMeasure(): (text: string, size: number) => number {
  const ff = useFine();
  return useMemo(() => (text: string, size: number) => (ff ? (ff.font.getTextWidth(text) * size) / ff.nominal : text.length * size * 0.5), [ff]);
}

/** Label text at (x, y) (meters; y = baseline), `size` meters tall. Refuses
 *  to draw anything that would render under 9 pt (the house floor), exactly
 *  as the shared SceneText does. */
function GaText({ x, y, size, text, color, align = 'left', opacity }: { x: number; y: number; size: number; text: string; color: string; align?: 'left' | 'center' | 'right'; opacity?: number }) {
  const f = useContext(SceneFontsContext);
  const ff = useFine();
  if (!ff || size * f.s < MIN_TEXT_PT - 1e-3) return null;
  const k = size / ff.nominal;
  const w = align === 'left' ? 0 : ff.font.getTextWidth(text);
  const dx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: k }]} opacity={opacity}>
      <Text x={dx} y={0} text={text} font={ff.font} color={color} />
    </Group>
  );
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

const Walls = memo(function Walls({ doorOpen, moving }: { doorOpen: boolean; moving: boolean }) {
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
  // the leaf hangs on the north jamb and SWINGS into the room (a quarter of
  // a second; at once when motion is reduced)
  const a = useGlide(doorOpen ? (-80 * Math.PI) / 180 : 0, 260, moving);
  const leaf = useDerivedValue(() => [{ rotate: a.value }]);
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
      <Group origin={vec(WALL_X, DOOR_Y0)} transform={leaf}>
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
 *  The figure's own frame has its chest toward +x, in millimeters. `ears` =
 *  this figure is a listener now (a figure that is not keeps a broken ring). */
function Person({ g, ring, second = false, ears = true }: { g: Glided; ring: string; second?: boolean; ears?: boolean }) {
  const k = 0.001 * PERSON_K;
  const at = useDerivedValue(() => [{ translateX: g.x.value }, { translateY: g.y.value }]);
  const turn = useDerivedValue(() => [{ rotate: ((g.facing.value - 90) * Math.PI) / 180 }, { scale: k }]);
  return (
    <Group transform={at}>
      <Circle cx={0.06} cy={0.1} r={0.52} color="rgba(0,0,0,0.42)" />
      <Circle cx={0} cy={0} r={0.74} style="stroke" strokeWidth={0.05} color={ears ? ring : '#a9abb3'} opacity={0.9}>
        {ears ? null : <DashPathEffect intervals={[0.2, 0.16]} />}
      </Circle>
      {/* the guide is told from YOU by shape as well as color: a second, broken ring */}
      {second ? (
        <Circle cx={0} cy={0} r={0.9} style="stroke" strokeWidth={0.04} color={ring} opacity={0.8}>
          <DashPathEffect intervals={[0.12, 0.16]} />
        </Circle>
      ) : null}
      <Group transform={turn}>
        <PlayerBehind pose={SINGER_TOP} />
        <PlayerInFront pose={SINGER_TOP} hands={false} />
      </Group>
    </Group>
  );
}

const WEDGE_R = 2.2;
function wedgePath(R: number, halfDeg: number): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  const half = (halfDeg * Math.PI) / 180;
  p.moveTo(0, 0);
  for (let i = 0; i <= 16; i++) {
    const a = -half + (2 * half * i) / 16;
    p.lineTo(R * Math.sin(a), -R * Math.cos(a));
  }
  p.close();
  return p;
}

/** Where a listener's ears point: a soft wedge ahead of the figure. Amber
 *  for YOU; blue for the guide when a page shows the other player's ears.
 *  `behind` adds the BACK of the head: a grey, broken wedge the other way,
 *  drawn when the selected source is behind the ears. */
function ListenerWedge({ g, tone, behind = false }: { g: Glided; tone: 'you' | 'guide'; behind?: boolean }) {
  const path = useMemo(() => wedgePath(WEDGE_R, 50), []);
  const back = useMemo(() => wedgePath(1.55, 50), []);
  const t = useDerivedValue(() => [{ translateX: g.x.value }, { translateY: g.y.value }, { rotate: (g.facing.value * Math.PI) / 180 }]);
  const rgb = tone === 'you' ? '255,198,77' : '111,168,255';
  return (
    <Group transform={t}>
      <Path path={path}>
        <RadialGradient c={vec(0, 0)} r={WEDGE_R} colors={[`rgba(${rgb},0.26)`, `rgba(${rgb},0.02)`]} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={0.025} color={`rgba(${rgb},0.34)`} />
      {behind ? (
        <Group transform={[{ rotate: Math.PI }]}>
          <Path path={back} color="rgba(200,204,212,0.16)" />
          <Path path={back} style="stroke" strokeWidth={0.045} color="rgba(226,229,235,0.85)">
            <DashPathEffect intervals={[0.16, 0.13]} />
          </Path>
        </Group>
      ) : null}
    </Group>
  );
}

/** The overhead listener: a camera above the middle of the scene, with the
 *  start of its view toward each corner (it looks down on the whole picture). */
const CameraMark = memo(function CameraMark() {
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  return (
    <Group>
      {[
        [0, 0],
        [WORLD_W, 0],
        [0, WORLD_H],
        [WORLD_W, WORLD_H],
      ].map(([tx, ty], i) => {
        const d = Math.hypot(tx - cx, ty - cy);
        const ux = (tx - cx) / d;
        const uy = (ty - cy) / d;
        return (
          <Line key={i} p1={vec(cx + ux * 0.92, cy + uy * 0.92)} p2={vec(cx + ux * 1.55, cy + uy * 1.55)} color="rgba(255,198,77,0.6)" strokeWidth={0.04}>
            <DashPathEffect intervals={[0.14, 0.12]} />
          </Line>
        );
      })}
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
 *  over the generator — a shape and a word, never color alone. */
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
      <GaText x={0} y={-0.82} size={size} text="OVERHEAT" color="#ffc64d" align="center" />
    </Group>
  );
}

/* ── sound ──────────────────────────────────────────────────────────────── */

const toRect = (b: GaBox): SkRect => rect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);

/** Where a loop's rings begin and how far they are drawn, in meters. */
const TRAIN = { r0: 0.75, span: 1.5 };
const ALARM_TRAIN = { r0: 1.05, span: 1.85 };
/** A one-shot's ring travels this far over the sound's own length. */
const SHOT = { r0: 0.75, span: 1.6 };
/** Ring slots: enough to fill the span at the smallest gap. The phase runs
 *  to a common multiple, so neither set jumps when it wraps. */
const SLOTS = 7;
const WALL_SLOTS = 8;
const PHASE_WRAP = SLOTS * WALL_SLOTS;
/** Beyond the wall the sound is duller: its rings are thinner and dashed. */
const DULL_STROKE = 0.6;
const DULL_DASH = [0.2, 0.18];
const ALARM_DASH = [0.42, 0.26];
/** The wall's own piece of a far source's rings: from this far before the
 *  wall to this far beyond it. */
const WALL_BEFORE = 0.7;
const WALL_WINDOW = 1.8;
const WALL_HALF = 0.95;
const UNDER = 'rgba(0,0,0,0.6)';

/** How a muffled source's rings meet the wall (see gaSceneLogic). */
type Muffle = {
  /** The source's side of the wall: its rings stop there. */
  src: SkRect;
  /** The listener's side: the rings go on, thin and dashed. */
  lis: SkRect;
  /** The source is too far for its own rings to reach the wall: the piece at
   *  the wall is drawn apart, `d` meters from the source. */
  far: { d: number; src: SkRect; lis: SkRect } | null;
};

function muffleOf(x: GaSounding, L: GaPoint, reach: number, wallPiece: boolean): Muffle | null {
  if (!x.muffled) return null;
  const zone = zoneAt(x.at);
  const cross = gaWallCrossing(x.at, L);
  const srcBox = gaZoneRect(zone);
  const lisBox = gaZoneRect(gaOtherZone(zone));
  if (cross.d <= reach || !wallPiece) return { src: toRect(srcBox), lis: toRect(lisBox), far: null };
  // a short piece of the ring, so two sources' pieces do not cross at the wall
  const y0 = Math.max(0, cross.at.y - WALL_HALF);
  const y1 = Math.min(WORLD_H, cross.at.y + WALL_HALF);
  const win = (b: GaBox): SkRect => toRect({ x0: Math.max(b.x0, WALL_X - 2), x1: Math.min(b.x1, WALL_X + 2), y0, y1 });
  return { src: toRect(srcBox), lis: toRect(lisBox), far: { d: cross.d, src: win(srcBox), lis: win(lisBox) } };
}

/** One ring of a loop's train. `phi` counts rings that have left; this slot
 *  is `j` rings behind. `bell` = fade in and out (the piece at the wall). */
function TrainRing({ at, j, n, phi, gap, base, span, bell = false, color, stroke, opacity, dash }: { at: GaPoint; j: number; n: number; phi: SharedValue<number>; gap: SharedValue<number>; base: number; span: number; bell?: boolean; color: string; stroke: number; opacity: number; dash?: number[] }) {
  const r = useDerivedValue(() => base + Math.min(((phi.value + j) % n) * gap.value, span));
  const o = useDerivedValue(() => {
    const k = (((phi.value + j) % n) * gap.value) / span;
    if (k >= 1) return 0;
    return opacity * (bell ? Math.pow(Math.sin(Math.PI * k), 0.6) : 1 - Math.pow(k, 1.7));
  });
  return (
    <Group opacity={o}>
      <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={stroke + 0.06} color={UNDER}>
        {dash ? <DashPathEffect intervals={dash} /> : null}
      </Circle>
      <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={stroke} color={color}>
        {dash ? <DashPathEffect intervals={dash} /> : null}
      </Circle>
    </Group>
  );
}

const slots = (n: number) => Array.from({ length: n }, (_, j) => j);

/** A LOOP: a train of rings. They travel at one speed; `gapM` (from the
 *  model's SPEED) sets how often one leaves and so how close they sit. With
 *  motion reduced the train stands still at that same spacing. */
function LoopRings({ x, L, moving, wallPiece }: { x: GaSounding; L: GaPoint; moving: boolean; wallPiece: boolean }) {
  const shape = x.alarm ? ALARM_TRAIN : TRAIN;
  const gapM = x.alarm ? GA_ALARM_GAP : gaRingGap(x.speed);
  const phi = useSharedValue(0.5);
  const gap = useSharedValue(gapM);
  useEffect(() => {
    gap.value = gapM;
  }, [gapM, gap]);
  const frame = useFrameCallback((info) => {
    const dt = Math.min(info.timeSincePreviousFrame ?? 0, 64) / 1000;
    phi.value = (phi.value + (dt * GA_RING_SPEED) / gap.value) % PHASE_WRAP;
  }, false);
  useEffect(() => {
    frame.setActive(moving);
    if (!moving) phi.value = 0.5;
    return () => frame.setActive(false);
  }, [moving, frame, phi]);

  const color = levelColorForDb(x.db, GA_RING_DB_MIN, GA_RING_DB_MAX);
  const look = gaRingLook(x.db);
  const stroke = look.stroke + (x.alarm ? 0.02 : 0);
  const m = muffleOf(x, L, shape.r0 + shape.span, wallPiece);
  const train = (dull: boolean) =>
    slots(SLOTS).map((j) => (
      <TrainRing key={j} at={x.at} j={j} n={SLOTS} phi={phi} gap={gap} base={shape.r0} span={shape.span} color={color} stroke={dull ? stroke * DULL_STROKE : stroke} opacity={look.opacity} dash={dull ? DULL_DASH : x.alarm ? ALARM_DASH : undefined} />
    ));
  if (!m) return <Group>{train(false)}</Group>;
  const atWall = (dull: boolean) =>
    slots(WALL_SLOTS).map((j) => (
      <TrainRing key={j} at={x.at} j={j} n={WALL_SLOTS} phi={phi} gap={gap} base={(m.far?.d ?? 0) - WALL_BEFORE} span={WALL_WINDOW} bell color={color} stroke={dull ? stroke * DULL_STROKE : stroke} opacity={look.opacity} dash={dull ? DULL_DASH : x.alarm ? ALARM_DASH : undefined} />
    ));
  return (
    <Group>
      <Group clip={m.src}>{train(false)}</Group>
      {m.far ? (
        <>
          <Group clip={m.far.src}>{atWall(false)}</Group>
          <Group clip={m.far.lis}>{atWall(true)}</Group>
        </>
      ) : (
        <Group clip={m.lis}>{train(true)}</Group>
      )}
    </Group>
  );
}

function ShotCircle({ at, p, base, moving, color, stroke, opacity, dash }: { at: GaPoint; p: SharedValue<number>; base: number; moving: boolean; color: string; stroke: number; opacity: number; dash?: number[] }) {
  const r = useDerivedValue(() => Math.max(0.05, base + p.value * SHOT.span));
  const o = useDerivedValue(() => (moving ? opacity * (1 - p.value * p.value) : opacity));
  return (
    <Group opacity={o}>
      <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={stroke + 0.06} color={UNDER}>
        {dash ? <DashPathEffect intervals={dash} /> : null}
      </Circle>
      <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={stroke} color={color}>
        {dash ? <DashPathEffect intervals={dash} /> : null}
      </Circle>
    </Group>
  );
}

/** A ONE-SHOT voice: one ring that leaves when the voice starts and fades
 *  over the sound's own length. With motion reduced: one still ring for as
 *  long as the voice sounds. */
function ShotRing({ x, ring, L, moving, wallPiece }: { x: GaSounding; ring: GaShotRing; L: GaPoint; moving: boolean; wallPiece: boolean }) {
  const p = useSharedValue(0.5);
  useEffect(() => {
    if (!moving) {
      cancelAnimation(p);
      p.value = 0.5;
      return;
    }
    const p0 = Math.max(0, Math.min(1, (gaNow() - ring.start) / ring.len));
    p.value = p0;
    p.value = withTiming(1, { duration: Math.max(0, 1 - p0) * ring.len * 1000, easing: Easing.linear });
    return () => cancelAnimation(p);
  }, [moving, ring.start, ring.len, p]);
  const color = levelColorForDb(ring.db, GA_RING_DB_MIN, GA_RING_DB_MAX);
  const look = gaRingLook(ring.db);
  const m = muffleOf(x, L, SHOT.r0 + SHOT.span, wallPiece);
  if (!m) return <ShotCircle at={x.at} p={p} base={SHOT.r0} moving={moving} color={color} stroke={look.stroke} opacity={look.opacity} />;
  return (
    <Group>
      <Group clip={m.src}>
        <ShotCircle at={x.at} p={p} base={SHOT.r0} moving={moving} color={color} stroke={look.stroke} opacity={look.opacity} />
      </Group>
      <Group clip={m.far ? m.far.lis : m.lis}>
        <ShotCircle at={x.at} p={p} base={m.far ? m.far.d - 0.4 : SHOT.r0} moving={moving} color={color} stroke={look.stroke * DULL_STROKE} opacity={look.opacity} dash={DULL_DASH} />
      </Group>
    </Group>
  );
}

/** `wallPiece`: this source draws the piece of its rings AT the wall (where
 *  two sources share one place, the alarm on its generator, only the louder
 *  one does, so the wall shows one clear piece). */
function SoundRings({ x, L, moving, wallPiece }: { x: GaSounding; L: GaPoint; moving: boolean; wallPiece: boolean }) {
  // tracked but not played, or silenced by the mix: one still, dashed ring
  if (!gaHeard(x)) {
    return (
      <Group>
        <Circle cx={x.at.x} cy={x.at.y} r={x.alarm ? 1.45 : 1.15} style="stroke" strokeWidth={0.11} color={UNDER}>
          <DashPathEffect intervals={x.alarm ? ALARM_DASH : [0.14, 0.14]} />
        </Circle>
        <Circle cx={x.at.x} cy={x.at.y} r={x.alarm ? 1.45 : 1.15} style="stroke" strokeWidth={0.06} color="#a9abb3">
          <DashPathEffect intervals={x.alarm ? ALARM_DASH : [0.14, 0.14]} />
        </Circle>
      </Group>
    );
  }
  if (x.kind === 'loop') return <LoopRings x={x} L={L} moving={moving} wallPiece={wallPiece} />;
  // the newest few: a burst of twelve impacts is twelve voices, not twelve
  // pictures on one spot
  return (
    <Group>
      {x.rings.slice(-6).map((r) => (
        <ShotRing key={r.id} x={x} ring={r} L={L} moving={moving} wallPiece={wallPiece} />
      ))}
    </Group>
  );
}

/** A bird that is calling, from above: the courtyard's spot sound has a
 *  place (the model picks one for each call), so its ring needs a source to
 *  come from. Drawn only while the call sounds. */
const BirdMark = memo(function BirdMark({ at }: { at: GaPoint }) {
  const wings = useMemo(() => {
    const p = Skia.Path.Make();
    // two swept wings, tips back
    p.moveTo(0.06, -0.05);
    p.quadTo(0.02, -0.3, -0.2, -0.42);
    p.quadTo(-0.1, -0.2, -0.12, -0.04);
    p.close();
    p.moveTo(0.06, 0.05);
    p.quadTo(0.02, 0.3, -0.2, 0.42);
    p.quadTo(-0.1, 0.2, -0.12, 0.04);
    p.close();
    // the tail, a narrow fan
    p.moveTo(-0.16, -0.035);
    p.lineTo(-0.36, -0.09);
    p.lineTo(-0.36, 0.09);
    p.lineTo(-0.16, 0.035);
    p.close();
    return p;
  }, []);
  const beak = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0.27, -0.03);
    p.lineTo(0.36, 0);
    p.lineTo(0.27, 0.03);
    p.close();
    return p;
  }, []);
  return (
    <Group transform={[{ translateX: at.x }, { translateY: at.y }, { rotate: -0.6 }]}>
      <Path path={wings} color="rgba(0,0,0,0.45)" transform={[{ translateX: 0.05 }, { translateY: 0.07 }]} />
      <Path path={wings} color="#6b4a2f" />
      <Path path={wings} style="stroke" strokeWidth={0.02} color="#d8b98a" />
      <RoundedRect x={-0.18} y={-0.085} width={0.4} height={0.17} r={0.085} color="#8a6240" />
      <Circle cx={0.2} cy={0} r={0.085} color="#3b2a1c" />
      <Path path={beak} color="#e6b34a" />
    </Group>
  );
});

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

/* ── the beds ───────────────────────────────────────────────────────────── */

const YARD_CLIP = rect(0, 0, WALL_X - WALL_T / 2, WORLD_H);
const WIND_PERIOD = 4;

/** The two ambience beds have no place in the scene, so each gets a mark
 *  over its whole zone while its voice plays: slow streaks drifting across
 *  the courtyard for the wind, a soft band inside the workshop's walls for
 *  the room tone. Each is as strong as that bed's level now (the model's
 *  cross-fade at the doorway: one fades down as the other comes up). */
function BedMarks({ yard, room, fadeS, clock, moving }: { yard: { playing: boolean; level: number }; room: { playing: boolean; level: number }; fadeS: number; clock: SharedValue<number>; moving: boolean }) {
  const wind = useMemo(() => {
    const p = Skia.Path.Make();
    const rows = [0.75, 2.9, 3.55, 6.6, 7.45, 9.2];
    rows.forEach((y, k) => {
      const from = -WIND_PERIOD + (k % 3) * 0.9;
      p.moveTo(from, y);
      for (let x = from; x <= WALL_X + WIND_PERIOD; x += 0.25) p.lineTo(x, y + 0.13 * Math.sin(((x + k * 1.3) * 2 * Math.PI) / WIND_PERIOD));
    });
    return p;
  }, []);
  const yardLevel = useGlide(yard.playing ? yard.level : 0, fadeS * 1000, moving, true);
  const roomLevel = useGlide(room.playing ? room.level : 0, fadeS * 1000, moving, true);
  const drift = useDerivedValue(() => [{ translateX: (clock.value * 0.45) % WIND_PERIOD }]);
  // a bed that plays at zero level (the other zone's) keeps a faint trace
  const yardO = useDerivedValue(() => 0.07 + 0.36 * yardLevel.value);
  const roomO = useDerivedValue(() => (0.06 + 0.3 * roomLevel.value) * (0.86 + 0.14 * Math.sin((clock.value * 2 * Math.PI) / 5)));
  const rx = WALL_X + WALL_T / 2;
  const rw = WORLD_W - WALL_T - rx;
  const rh = WORLD_H - 2 * WALL_T;
  return (
    <Group>
      {yard.playing ? (
        <Group clip={YARD_CLIP} opacity={yardO}>
          <Group transform={drift}>
            <Path path={wind} style="stroke" strokeWidth={0.07} strokeCap="round" color="#e4f1ff">
              <DashPathEffect intervals={[1.5, 0.9]} />
            </Path>
          </Group>
        </Group>
      ) : null}
      {room.playing ? (
        <Group opacity={roomO}>
          {[0.2, 0.5, 0.8].map((inset, k) => (
            <RoundedRect key={k} x={rx + inset} y={WALL_T + inset} width={rw - inset * 2} height={rh - inset * 2} r={0.3} style="stroke" strokeWidth={0.22} color="#ffe2b0" opacity={1 - k * 0.3} />
          ))}
        </Group>
      ) : null}
    </Group>
  );
}

/* ── the mood ───────────────────────────────────────────────────────────── */

const MOOD_ALERT = '#ff8a1e';

/** MOOD is a STATE: one value for the whole game. While it is ALERT the
 *  whole picture wears a border (the words are printed by Labels). */
function MoodFrame() {
  return (
    <Group>
      <Rect x={0.3} y={0.3} width={WORLD_W - 0.6} height={WORLD_H - 0.6} style="stroke" strokeWidth={0.6} color={MOOD_ALERT} opacity={0.16} />
      <Rect x={0.09} y={0.09} width={WORLD_W - 0.18} height={WORLD_H - 0.18} style="stroke" strokeWidth={0.18} color={MOOD_ALERT} />
    </Group>
  );
}

/* ── labels ─────────────────────────────────────────────────────────────── */

type FootNote = { who: 'player' | 'guide'; text: string };

/** Every word in the picture, placed so that none lands on another and none
 *  leaves the picture. Returned boxes are in world meters. */
function Labels({ s, select, showNames, show, sounding, you, guide, foot }: { s: GaState; select: GaSceneSelect; showNames: boolean; show: GaSceneShow; sounding: GaSounding[]; you: Glided; guide: Glided; foot: FootNote[] }) {
  const zone = useLabelMm(10);
  const tag = useLabelMm(9.5);
  const small = useLabelMm(9);
  const measure = useMeasure();
  const p = s.chars.player;
  const g = s.chars.guide;
  const L = listenerOf(s);
  const shown = (key: Exclude<GaSceneSelect, null>) => showNames || select === key;
  const beds = show.beds ? gaBedMarks(s) : null;

  type Line = { key: string; x: number; y: number; text: string; color: string; size: number; align: 'left' | 'center' | 'right'; opacity?: number };
  const lines: Line[] = [];
  const still: GaBox[] = [];
  const boxOf = (l: { x: number; y: number; text: string; size: number; align: 'left' | 'center' | 'right' }): GaBox => {
    const w = measure(l.text, l.size);
    const cx = l.align === 'left' ? l.x + w / 2 : l.align === 'right' ? l.x - w / 2 : l.x;
    return gaTextBox(cx, l.y, w, l.size);
  };
  const put = (l: Line) => {
    lines.push(l);
    still.push(boxOf(l));
  };

  // the two zones; a bed that plays adds its name, as bright as its level
  const zoneColor = 'rgba(244,246,248,0.62)';
  put({ key: 'yard', x: 0.35, y: WORLD_H - 0.35, text: 'COURTYARD', color: zoneColor, size: zone, align: 'left' });
  if (beds?.yard.playing) put({ key: 'yard-bed', x: 0.35 + measure('COURTYARD ', zone), y: WORLD_H - 0.35, text: '· WIND', color: '#e4f1ff', size: zone, align: 'left', opacity: 0.45 + 0.55 * beds.yard.level });
  // in the room's north-west corner: clear of both generators' rings and of the guide
  put({ key: 'room', x: WALL_X + 0.45, y: 0.98, text: 'WORKSHOP', color: zoneColor, size: zone, align: 'left' });
  if (beds?.room.playing) put({ key: 'room-bed', x: WALL_X + 0.45 + measure('WORKSHOP ', zone), y: 0.98, text: '· ROOM TONE', color: '#ffe2b0', size: zone, align: 'left', opacity: 0.45 + 0.55 * beds.room.level });
  if (show.mood) put({ key: 'mood', x: 0.4, y: 0.4 + zone * 0.8, text: s.mood === 'alert' ? 'MOOD · ALERT' : 'MOOD · CALM', color: s.mood === 'alert' ? MOOD_ALERT : zoneColor, size: zone, align: 'left' });

  // the names of things (centered on the thing)
  const white = '#f4f6f8';
  if (shown('generator-1')) put({ key: 'generator-1', x: PLACES.generator.x, y: PLACES.generator.y + 1.45, text: 'GENERATOR 1', color: white, size: tag, align: 'center' });
  if (s.machines.length > 1 && shown('generator-2')) put({ key: 'generator-2', x: PLACES.generator2.x, y: PLACES.generator2.y - 0.95, text: 'GENERATOR 2', color: white, size: tag, align: 'center' });
  if (shown('fountain')) put({ key: 'fountain', x: PLACES.fountain.x, y: PLACES.fountain.y + 1.85, text: 'FOUNTAIN', color: white, size: tag, align: 'center' });
  if (shown('crate')) put({ key: 'crate', x: PLACES.crate.x, y: PLACES.crate.y - 0.85, text: 'CRATE', color: white, size: tag, align: 'center' });
  // right-aligned: it ends before the wall
  // above the doorway, or below it while YOU or the GUIDE stand on the words
  // (page 22 at 320 wide, after GO: GRAVEL; round 2, R2-GA2-13)
  if (shown('door')) {
    const doorLine: Line = { key: 'door', x: WALL_X - 0.42, y: DOOR_Y0 - 0.3, text: s.doorOpen ? 'DOOR OPEN' : 'DOOR CLOSED', color: white, size: tag, align: 'right' };
    const figure = (c: GaPoint): GaBox => ({ x0: c.x - 0.7, x1: c.x + 0.7, y0: c.y - 0.7, y1: c.y + 0.7 });
    const covered = (l: Line) => [p, g].some((c) => gaBoxesHit(boxOf(l), figure(c)));
    // a little room around each name, so two never touch ("CLOSEDGENERATOR 1")
    const crowded = (l: Line) => {
      const b = boxOf(l);
      const near = { x0: b.x0 - 0.25, x1: b.x1 + 0.25, y0: b.y0 - 0.1, y1: b.y1 + 0.1 };
      return still.some((o) => gaBoxesHit(o, near));
    };
    const below: Line = { ...doorLine, y: DOOR_Y1 + 0.3 + tag };
    // the first place clear of the figures and of every name already placed
    // (CRATE sits under the doorway, GENERATOR 1 over it in the workshop),
    // else one clear of the figures: over the doorway on the courtyard side,
    // under it, then the same two on the workshop side
    const roomSide: Line = { ...doorLine, x: WALL_X + 0.42, align: 'left' };
    const spots = [doorLine, below, roomSide, { ...below, x: WALL_X + 0.42, align: 'left' as const }];
    put(spots.find((l) => !covered(l) && !crowded(l)) ?? spots.find((l) => !covered(l)) ?? doorLine);
  }
  if (s.listenerMode === 'camera') put({ key: 'camera', x: WALL_X - 0.42, y: WORLD_H / 2 + 0.95 + tag, text: 'CAMERA · LISTENER', color: '#ffc64d', size: tag, align: 'right' });

  // a bird is named while it calls (it is in the picture only then)
  for (const x of sounding) {
    if (x.owner !== 'bird') continue;
    const w = measure('BIRD', small);
    const cx = gaClampLabelX(x.at.x, w);
    const y = x.at.y + 0.62 + small > WORLD_H - 0.1 ? x.at.y - 0.6 : x.at.y + 0.62 + small * 0.75;
    put({ key: `bird-${x.key}`, x: cx, y, text: 'BIRD', color: white, size: small, align: 'center' });
  }

  // page 7: which INSTANCE each generator's rings are (under the name in the
  // top half of the room, over it in the bottom half)
  if (show.ids) {
    for (const x of sounding) {
      if (x.kind !== 'loop' || x.alarm || x.speed == null) continue;
      const text = `INSTANCE ${x.ids.join(' + ')}`;
      const y = x.at.y < WORLD_H / 2 ? x.at.y + 1.45 + small * 1.2 : x.at.y - 0.95 - tag * 1.2;
      put({ key: `id-${x.key}`, x: gaClampLabelX(x.at.x, measure(text, small)), y, text, color: '#5bff85', size: small, align: 'center' });
    }
  }

  // the selected source's distances, whole inside the picture
  const sel = gaSelected(select);
  const atten = sel ? GA_EVENTS[sel.event].atten : undefined;
  if (sel && atten) {
    const body = (c: GaPoint, rx: number, ry: number): GaBox => ({ x0: c.x - rx, x1: c.x + rx, y0: c.y - ry, y1: c.y + ry });
    const bodies: GaBox[] = [body(PLACES.fountain, 1.2, 1.2), body(PLACES.crate, 0.66, 0.66), body(p, 0.95, 0.95), body(g, 0.95, 0.95), ...s.machines.map((m) => ({ x0: m.x - 1.1, x1: m.x + 1.35, y0: m.y - 0.75, y1: m.y + 0.75 }))];
    if (s.listenerMode === 'camera') bodies.push(body({ x: WORLD_W / 2, y: WORLD_H / 2 }, 0.9, 0.9));
    for (const r of gaRangeLabels({ at: sel.at, min: atten.min, max: atten.max, listener: L, size: small, measure: (t) => measure(t, small), avoid: [...still, ...bodies] })) {
      lines.push({ key: `range-${r.tone}`, x: r.cx, y: r.baseline, text: r.text, color: r.tone === 'min' ? '#5bff85' : '#8fbcff', size: small, align: 'center' });
      still.push(r.box);
    }
  }

  // YOU and the GUIDE: under the figure, or above where that is taken; the
  // words by the foot that stepped sit one line further out
  const person = (c: GaPoint, name: string, color: string, who: 'player' | 'guide') => {
    const note = foot.find((f) => f.who === who);
    const at = gaPersonLabel(c, measure(name, tag), tag, still, note ? { w: measure(note.text, small), size: small } : undefined);
    still.push(at.box);
    const out: Line[] = [{ key: who, x: at.cx, y: at.baseline, text: name, color, size: tag, align: 'center' }];
    if (note && at.note) {
      still.push(at.note.box);
      out.push({ key: `${who}-foot`, x: at.note.cx, y: at.note.baseline, text: note.text, color: white, size: small, align: 'center' });
    }
    return out;
  };
  const youLines = person(p, 'YOU', '#ffc64d', 'player');
  const guideLines = person(g, 'GUIDE', '#9fd0ff', 'guide');
  // a person's words walk with the figure
  const youAt = useDerivedValue(() => [{ translateX: you.x.value - p.x }, { translateY: you.y.value - p.y }]);
  const guideAt = useDerivedValue(() => [{ translateX: guide.x.value - g.x }, { translateY: guide.y.value - g.y }]);

  // page 11: the selected source is behind the ears
  const behind = gaSelectedBehind(s, select);
  let behindLine: Line | null = null;
  if (behind) {
    const a = (p.facing * Math.PI) / 180;
    const text = 'BEHIND YOU';
    const w = measure(text, small);
    // behind the listener, as near as the words fit clear of every other
    // label (YOUR name sits there at some facings: audit 2, page 11)
    const spot = (d: number) => {
      const bx = gaClampLabelX(p.x - Math.sin(a) * d, w);
      const by = Math.max(small + 0.12, Math.min(WORLD_H - 0.14, p.y + Math.cos(a) * d + small * 0.35));
      return { bx, by, box: gaTextBox(bx, by, w, small) };
    };
    const tries = [1.95, 2.5, 3.1, 3.7].map(spot);
    const youBox = gaTextBox(youLines[0].x, youLines[0].y, measure('YOU', tag), tag);
    const pick = tries.find((t) => !gaBoxesHit(t.box, youBox) && !still.some((b) => gaBoxesHit(b, t.box))) ?? tries.find((t) => !gaBoxesHit(t.box, youBox)) ?? tries[0];
    behindLine = { key: 'behind', x: pick.bx, y: pick.by, text, color: '#e2e5eb', size: small, align: 'center' };
  }

  const draw = (l: Line) => <GaText key={l.key} x={l.x} y={l.y} size={l.size} text={l.text} color={l.color} align={l.align} opacity={l.opacity} />;
  return (
    <Group>
      {lines.map(draw)}
      {behindLine ? draw(behindLine) : null}
      <Group transform={youAt}>{youLines.map(draw)}</Group>
      <Group transform={guideAt}>{guideLines.map(draw)}</Group>
    </Group>
  );
}

/** The selected source's two distances and the line to the listener. The
 *  numbers are printed by Labels. */
function Range({ s, select, you }: { s: GaState; select: GaSceneSelect; you: Glided }) {
  const sel = gaSelected(select);
  const camera = s.listenerMode === 'camera';
  const from = useDerivedValue(() => (camera ? { x: WORLD_W / 2, y: WORLD_H / 2 } : { x: you.x.value, y: you.y.value }));
  const atten = sel ? GA_EVENTS[sel.event].atten : undefined;
  if (!sel || !atten) return null;
  const at = sel.at;
  return (
    <Group>
      <Circle cx={at.x} cy={at.y} r={atten.min} style="stroke" strokeWidth={0.05} color="#5bff85">
        <DashPathEffect intervals={[0.2, 0.14]} />
      </Circle>
      <Circle cx={at.x} cy={at.y} r={atten.max} style="stroke" strokeWidth={0.05} color="#6fa8ff">
        <DashPathEffect intervals={[0.34, 0.2]} />
      </Circle>
      <Line p1={from} p2={vec(at.x, at.y)} color="rgba(244,246,248,0.7)" strokeWidth={0.04}>
        <DashPathEffect intervals={[0.1, 0.12]} />
      </Line>
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
  /** What else this page asks the picture to show (all off by default). */
  show?: GaSceneShow;
};

const NO_SHOW: GaSceneShow = {};
/** How long the words by a foot stay after the step, in seconds (the step
 *  itself is 0.4 s: too short to read). */
const FOOT_NOTE_S = 1.6;

export function GaScene({ w, h, state: s, select = null, showNames = false, show = NO_SHOW }: GaSceneProps) {
  const k = Math.min(w / WORLD_W, h / WORLD_H);
  const ox = (w - WORLD_W * k) / 2;
  const oy = (h - WORLD_H * k) / 2;
  const textScale = useStageTextScale();
  const decorative = useDecorativeMotion();
  const fineFont = useFineFont();

  // The picture is drawn again when the model changes, AND when a late
  // layer begins to sound or a foot's words expire (nothing is dispatched
  // then, so the scene asks for that one redraw itself).
  const [, redraw] = useState(0);
  const now = gaNow();
  const sounding = gaSoundingOf(s, now);

  const feet = useRef(new Map<string, { inst: string; text: string; until: number }>());
  const wantFeet = !!(show.surface || show.take);
  if (wantFeet) {
    for (const m of gaFootMarks(s)) {
      if (feet.current.get(m.who)?.inst !== m.inst) feet.current.set(m.who, { inst: m.inst, text: gaFootText(m, show), until: now + FOOT_NOTE_S });
    }
  } else if (feet.current.size) feet.current.clear();
  const foot: FootNote[] = [];
  let nextFoot: number | null = null;
  for (const [who, f] of feet.current) {
    if (f.until <= now || !f.text) continue;
    foot.push({ who: who as 'player' | 'guide', text: f.text });
    nextFoot = nextFoot === null ? f.until : Math.min(nextFoot, f.until);
  }
  const nextRing = gaNextRingChange(s, now);
  const next = nextRing === null ? nextFoot : nextFoot === null ? nextRing : Math.min(nextRing, nextFoot);
  useEffect(() => {
    if (next === null) return;
    const id = setTimeout(() => redraw((n) => n + 1), Math.max(0, (next - gaNow()) * 1000) + 20);
    return () => clearTimeout(id);
  }, [next]);

  const p = s.chars.player;
  const g = s.chars.guide;
  const L = listenerOf(s);
  const alarm = s.inst.some((i) => i.event === 'alarm');
  const fountainOn = s.inst.some((i) => i.event === 'fountain');
  const guideSpeaks = s.inst.some((i) => i.event === 'vo_greeting' || i.event === 'vo_warning');
  const beds = show.beds ? gaBedMarks(s) : null;
  const bedPlays = !!beds && (beds.yard.playing || beds.room.playing);

  // one clock for what repeats in the picture (ripples, the alarm lamp, the
  // beds' marks); each loop's rings keep their own count
  const clock = useSharedValue(0);
  const tick = useFrameCallback((info) => {
    clock.value += Math.min(info.timeSincePreviousFrame ?? 0, 64) / 1000;
  }, false);
  const anyMoving = fountainOn || alarm || bedPlays;
  useEffect(() => {
    tick.setActive(anyMoving && decorative);
    return () => tick.setActive(false);
  }, [anyMoving, decorative, tick]);
  const phase = useDerivedValue(() => (clock.value / 1.7) % 1);

  const you = useGlidedChar(p, decorative);
  const guide = useGlidedChar(g, decorative);
  const camera = s.listenerMode === 'camera';
  const behind = gaSelectedBehind(s, select) === true;

  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={gaSceneSummary(s, now)}>
      <Canvas style={{ width: w, height: h }}>
        <SceneFontsProvider s={k} textScale={textScale}>
          <FineFontContext.Provider value={fineFont}>
          <Group transform={[{ translateX: ox }, { translateY: oy }, { scale: k }]} clip={WORLD_CLIP}>
            <Ground />
            {beds ? <BedMarks yard={beds.yard} room={beds.room} fadeS={gaBedFadeSeconds(s)} clock={clock} moving={decorative} /> : null}
            <Fountain at={PLACES.fountain} running={fountainOn && decorative} phase={phase} />
            <Crate at={PLACES.crate} />
            <Walls doorOpen={s.doorOpen} moving={decorative} />
            {s.machines.map((m) => (
              <Generator key={m.id} at={m} on={m.on} alarm={alarm && m.id === 'generator-1'} pulse={phase} />
            ))}
            {camera ? null : <ListenerWedge g={you} tone="you" behind={behind} />}
            {show.guideListens ? <ListenerWedge g={guide} tone="guide" /> : null}
            <Range s={s} select={select} you={you} />
            {sounding.map((x) => (x.owner === 'bird' ? <BirdMark key={`bird-${x.key}`} at={x.at} /> : null))}
            {sounding.map((x) => (
              <SoundRings key={x.key} x={x} L={L} moving={decorative} wallPiece={gaWallPieceOwner(sounding, x)} />
            ))}
            <Person g={guide} ring="#6fa8ff" second />
            <Person g={you} ring="#ffc64d" ears={!camera} />
            {guideSpeaks ? <Speaking at={g} /> : null}
            {camera ? <CameraMark /> : null}
            {alarm && s.options.visualCue ? <AlarmSign at={PLACES.generator} /> : null}
            {show.mood && s.mood === 'alert' ? <MoodFrame /> : null}
            <Labels s={s} select={select} showNames={showNames} show={show} sounding={sounding} you={you} guide={guide} foot={foot} />
          </Group>
          </FineFontContext.Provider>
        </SceneFontsProvider>
      </Canvas>
    </View>
  );
}
