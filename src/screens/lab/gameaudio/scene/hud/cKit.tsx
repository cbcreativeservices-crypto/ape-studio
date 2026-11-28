/**
 * cKit — the small parts the MIX, VOICES and NET strips and the tool-window
 * stage share: the scene clock, a level bar on the house loudness ramp, and
 * the strip's own face (so the three read as one instrument under the scene).
 *
 * MOTION. Everything that moves here is anchored to the model's time, and
 * both clocks ask the house gate themselves (useDecorativeMotion): with
 * "Reduce animations" or Low-Light on they do not run at all.
 *   useSceneClock   ONE frame clock per display. It writes the scene's own
 *                   time (model/gaStore `gaNow`) into a shared value while
 *                   something is on its way, and stops itself when nothing
 *                   is. With decorative motion off it holds the state's own
 *                   time, so the same picture is drawn still on each change.
 *   useSceneSeconds the same time as a number, a few times a second, for a
 *                   reading that is text.
 *   useRamped       a value that moves to its new target over a time the
 *                   MODEL gives (the duck's attack and release); 0 = at once.
 * Read-only: nothing here takes a touch.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { levelColorForDb } from '../../../../../features/tools/levelColor';
import { colors, fonts } from '../../../../../theme/tokens';
import { gaNow } from '../../model/gaStore';
import { C_COLOR_MAX_DB, C_COLOR_MIN_DB, C_METER_MAX_DB, C_METER_MIN_DB } from './cModel';

/* ── the face ───────────────────────────────────────────────────────────── */

export const C_FACE = {
  ground: '#0c0d11',
  groundHi: '#16171d',
  rim: '#2f313a',
  rimDark: '#050506',
  well: '#07080a',
  wellRim: '#262830',
  ink: colors.textPrimary,
  sub: colors.textSub,
  mute: colors.textMuted,
  amber: colors.amber,
  you: '#ffc64d',
  other: '#9fd0ff',
  steal: colors.orange,
  refuse: '#ff5a48',
  ok: colors.greenBright,
} as const;

/** Type sizes for a strip: 9 pt is the floor on a phone; FULL SCREEN grows. */
export type CType = { label: number; size: number; line: number; full: boolean };
export const cType = (h: number): CType => (h >= 64 ? { label: 11.5, size: 11, line: 15, full: true } : { label: 9.5, size: 9, line: 12, full: false });

/** The strip's ground: a recessed band with a lit upper edge, the same light
 *  as the tool-window figure (from the upper left). */
export const StripFace = memo(function StripFace({ w, h }: { w: number; h: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: w, height: h }]}>
      <LinearGradient colors={[C_FACE.groundHi, C_FACE.ground]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.edge, { backgroundColor: C_FACE.rim }]} />
      <View style={[styles.edge, { top: undefined, bottom: 0, backgroundColor: C_FACE.rimDark }]} />
    </View>
  );
});

/* ── time ───────────────────────────────────────────────────────────────── */

/**
 * The scene's time as a shared value. It runs (one requestAnimationFrame
 * loop) only while `runUntil` is ahead of the scene's clock and stops itself
 * there; pass Infinity for something that goes on (the music's play line) and
 * null when nothing is moving. `still` is the state's own time: with motion
 * reduced the clock holds it, so positions change only when the state does.
 */
export function useSceneClock(runUntil: number | null, still: number): SharedValue<number> {
  const moving = useDecorativeMotion();
  const t = useSharedValue(still);
  useEffect(() => {
    if (!moving) {
      t.value = still;
      return;
    }
    const now0 = gaNow();
    t.value = now0;
    if (runUntil == null || !(runUntil > now0)) return;
    let live = true;
    let raf = 0;
    const step = () => {
      if (!live) return;
      const now = gaNow();
      t.value = now;
      if (now < runUntil) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, [moving, runUntil, still, t]);
  return t;
}

/** The scene's time as a NUMBER that re-renders its owner `hz` times a
 *  second until `runUntil` (Infinity = goes on, null = stopped): for a
 *  counter that is text, or a reading that changes between actions.
 *
 *  `still` is the state's own time. A change can reach the screen late (a
 *  busy frame): if `runUntil` has already passed when the effect runs, the
 *  clock jumps to where things settled, never back to the START of a ramp
 *  that is over. With motion reduced it shows that settled end at once
 *  (a finite `runUntil`), or holds `still` (Infinity: a counter steps on
 *  each change of state). Keep the owner small. */
export function useSceneSeconds(runUntil: number | null, still: number, hz = 8): number {
  const moving = useDecorativeMotion();
  const [now, setNow] = useState(still);
  useEffect(() => {
    if (!moving || runUntil == null) {
      setNow(still);
      return;
    }
    const t0 = gaNow();
    setNow(t0);
    if (!(runUntil > t0)) return;
    const id = setInterval(() => {
      const t = gaNow();
      setNow(t);
      if (t >= runUntil) clearInterval(id);
    }, 1000 / hz);
    return () => clearInterval(id);
  }, [moving, runUntil, still, hz]);
  if (!moving) return runUntil != null && Number.isFinite(runUntil) ? Math.max(still, runUntil) : still;
  return Math.max(now, still);
}

/** A shared value that goes to `target` over `seconds` (a straight ramp, as
 *  the sound engine ramps a gain); 0 = at once. */
export function useRamped(target: number, seconds: number): SharedValue<number> {
  const v = useSharedValue(target);
  // the time belongs to the change of `target` it arrives with
  const dur = useRef(seconds);
  dur.current = seconds;
  useEffect(() => {
    if (!(dur.current > 0)) {
      cancelAnimation(v);
      v.value = target;
    } else {
      v.value = withTiming(target, { duration: dur.current * 1000, easing: Easing.linear });
    }
  }, [target, v]);
  // on unmount only (the shared value is the same for the component's life)
  useEffect(() => () => cancelAnimation(v), []);
  return v;
}

/* ── the level bar ──────────────────────────────────────────────────────── */

const RAMP_STEPS = 9;
/** The house ramp along the meter's scale (C_METER_MIN_DB … C_METER_MAX_DB). */
function useRamp(): { colors: [string, string, ...string[]]; locations: [number, number, ...number[]] } {
  return useMemo(() => {
    const cs: string[] = [];
    const ls: number[] = [];
    for (let k = 0; k < RAMP_STEPS; k++) {
      const f = k / (RAMP_STEPS - 1);
      cs.push(levelColorForDb(C_METER_MIN_DB + f * (C_METER_MAX_DB - C_METER_MIN_DB), C_COLOR_MIN_DB, C_COLOR_MAX_DB));
      ls.push(f);
    }
    return { colors: cs as [string, string, ...string[]], locations: ls as [number, number, ...number[]] };
  }, []);
}

/** dB marks drawn in every track: −36, −24, −12 and 0 (the strong one). */
const MARKS_DB = [-36, -24, -12, 0] as const;
const fracOf = (db: number) => (db - C_METER_MIN_DB) / (C_METER_MAX_DB - C_METER_MIN_DB);

/**
 * A level bar: a dark track, the house ramp revealed up to the level, and
 * hairline marks every 12 dB. `level` is a shared 0 … 1 fraction of the
 * scale (cModel `cMeterFrac`). Horizontal (left = quiet) or vertical
 * (bottom = quiet).
 */
export const LevelBar = memo(function LevelBar({ len, thick, level, vertical = false, dim = false }: { len: number; thick: number; level: SharedValue<number>; vertical?: boolean; dim?: boolean }) {
  const ramp = useRamp();
  const reveal = useAnimatedStyle(() => {
    const px = Math.max(0, Math.min(1, level.value)) * len;
    return vertical ? { height: px } : { width: px };
  });
  const box: ViewStyle = vertical ? { width: thick, height: len } : { width: len, height: thick };
  return (
    <View style={[styles.track, box, dim && styles.trackDim]}>
      <Animated.View style={[vertical ? styles.revealV : styles.revealH, reveal]}>
        <LinearGradient
          colors={ramp.colors}
          locations={ramp.locations}
          start={vertical ? { x: 0, y: 1 } : { x: 0, y: 0 }}
          end={vertical ? { x: 0, y: 0 } : { x: 1, y: 0 }}
          style={vertical ? { position: 'absolute', left: 0, bottom: 0, width: thick, height: len } : { width: len, height: thick }}
        />
      </Animated.View>
      {MARKS_DB.map((db) => {
        const at = Math.round(fracOf(db) * len);
        const strong = db === 0;
        return <View key={db} style={vertical ? [styles.markV, { bottom: at }, strong && styles.markStrong] : [styles.markH, { left: at }, strong && styles.markStrong]} />;
      })}
    </View>
  );
});

/** Pixels from the quiet end for a dB value on a bar `len` long. */
export const cBarX = (db: number, len: number): number => Math.max(0, Math.min(1, fracOf(db))) * len;
export const cPxPerDb = (len: number): number => len / (C_METER_MAX_DB - C_METER_MIN_DB);

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, top: 0, height: 1 },
  track: { backgroundColor: C_FACE.well, borderRadius: 2, overflow: 'hidden' },
  trackDim: { opacity: 0.55 },
  revealH: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  revealV: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  markH: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  markV: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  markStrong: { backgroundColor: 'rgba(255,255,255,0.5)' },
});

export const cFonts = fonts;
