/**
 * aParts — what the six "A" instrument strips are built from: the strip's
 * frame, its two kinds of words, the level bar, the lamp, and the ONE clock
 * a strip may run.
 *
 * THE LOOK is the rack's own: silk-screened legends in the label face
 * (Oswald, as the bezel's keys), values in the readout face (Share Tech
 * Mono, amber, as the bezel's values), on the same recessed band, lit from
 * the upper left, as the lab's other strips (cKit, bKit). A level is drawn
 * on a decibel scale with the house loudness ramp laid along the WHOLE scale
 * and uncovered up to the level: the same scale and the same colors as the
 * mix strip's meters and the scene's rings, so the three always agree.
 *
 * SIZES. Everything is measured in units of `k` = the strip's height over
 * its phone height (1 on the glass, 1.5 in FULL SCREEN). The smallest word
 * is 9 pt x k. The words are part of a drawing of fixed height, like the
 * scene's own (Skia) labels, so they are sized by the box, not by the OS
 * text size.
 *
 * THE CLOCK (`useHudNow`). A strip is drawn from the model's state and the
 * model's clock (model/gaStore `gaNow`, the clock that stamps `state.t` and
 * every voice's `born`). Between state changes it may run ONE frame loop,
 * and only while something it shows is really moving; a thing that changes
 * by itself at a known moment (a late layer starts, a mark ends) gets one
 * timer instead. With decorative motion off (`useDecorativeMotion`) the loop
 * never runs: the strip is redrawn on every state change and at those known
 * moments, and `still` tells it to show a fade at its end, never mid-way.
 */
import { memo, useEffect, useReducer, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { levelColorForDb } from '../../../../../features/tools/levelColor';
import { fitValue } from '../../../../../theme/legibility';
import { colors, fonts } from '../../../../../theme/tokens';
import { gaNow } from '../../model/gaStore';
import { GA_HUD_H } from './gaHudTypes';
import { A_COLOR_MAX_DB, A_COLOR_MIN_DB, A_METER_MAX_DB, A_METER_MIN_DB, aDb, aMeterFrac } from './aModel';

/* ── the strip's own palette (the rack's glass and bezel) ───────────────── */

export const HUD = {
  /** The strip's face: the same band as the lab's other strips. */
  ground: '#0c0d11',
  groundHi: '#16171d',
  rim: '#2f313a',
  rimDark: '#050506',
  rule: '#26272d',
  slot: '#07080a',
  slotRim: '#262830',
  /** A legend (what a thing is). */
  legend: colors.textSub,
  /** A legend whose thing is idle. */
  idle: '#74757f',
  /** A name that is live. */
  live: colors.textPrimary,
  value: colors.amber,
  /** Peak / fault red (the house peak-readout red). */
  red: '#ff5a48',
  warn: colors.orange,
  lampOff: '#15161b',
  lampRim: '#3d3e47',
} as const;

/** The strip's scale: 1 on the glass, larger in FULL SCREEN. */
export const hudK = (h: number): number => Math.max(1, (Number.isFinite(h) && h > 0 ? h : GA_HUD_H) / GA_HUD_H);

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/* ── the clock ──────────────────────────────────────────────────────────── */

/** At most this often does a running strip redraw (about 30 a second). */
const FRAME_MS = 30;

/**
 * Scene time for a strip.
 *   run     something it shows is moving right now (a fade, a play position)
 *   wakeAt  the scene time at which its picture next changes by itself
 */
export function useHudNow(run: boolean, wakeAt: number | null): { now: number; still: boolean } {
  const decorative = useDecorativeMotion();
  const [, redraw] = useReducer((n: number) => (n + 1) % 1_000_000, 0);
  const loop = run && decorative;
  useEffect(() => {
    if (!loop) return;
    let raf = 0;
    let last = 0;
    const tick = (ts: number) => {
      if (ts - last >= FRAME_MS) {
        last = ts;
        redraw();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);
  useEffect(() => {
    if (wakeAt == null || !Number.isFinite(wakeAt)) return;
    const id = setTimeout(redraw, Math.max(0, (wakeAt - gaNow()) * 1000) + 12);
    return () => clearTimeout(id);
  }, [wakeAt]);
  return { now: gaNow(), still: !decorative };
}

/* ── the frame ──────────────────────────────────────────────────────────── */

/** The strip: one labelled image for a screen reader, nothing to touch. */
export function HudFrame({ w, h, label, children, style }: { w: number; h: number; label: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={[styles.frame, { width: w, height: h }]}>
      <LinearGradient colors={[HUD.groundHi, HUD.ground]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.edge, { top: 0, backgroundColor: HUD.rim }]} />
      <View style={[styles.edge, { bottom: 0, backgroundColor: HUD.rimDark }]} />
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </View>
  );
}

/** A hairline between two cells. */
export function Rule({ k, style }: { k: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ width: 1, alignSelf: 'stretch', marginVertical: 4 * k, backgroundColor: HUD.rule }, style]} />;
}

/* ── words ──────────────────────────────────────────────────────────────── */

type WordProps = { k: number; children: ReactNode; color?: string; size?: number; style?: StyleProp<TextStyle> };

/** A legend, in the label face. Never under 9 pt. */
export function Lbl({ k, children, color = HUD.legend, size = 9.5, style }: WordProps) {
  const fs = size * k;
  return (
    <Text allowFontScaling={false} {...fitValue(fs)} style={[styles.lbl, { fontSize: fs, lineHeight: Math.round(fs * 1.24), letterSpacing: 0.35 * k, color }, style]}>
      {children}
    </Text>
  );
}

/** A value, in the readout face. Never under 9 pt. */
export function Val({ k, children, color = HUD.value, size = 9, style }: WordProps) {
  const fs = size * k;
  return (
    <Text allowFontScaling={false} {...fitValue(fs)} style={[styles.val, { fontSize: fs, lineHeight: Math.round(fs * 1.24), color }, style]}>
      {children}
    </Text>
  );
}

/* ── the level bar ──────────────────────────────────────────────────────── */

const RAMP_STEPS = 9;
/** The house ramp along the meter's scale, quiet end to loud end. */
const RAMP = (() => {
  const cs: string[] = [];
  const ls: number[] = [];
  for (let i = 0; i < RAMP_STEPS; i++) {
    const f = i / (RAMP_STEPS - 1);
    cs.push(levelColorForDb(A_METER_MIN_DB + f * (A_METER_MAX_DB - A_METER_MIN_DB), A_COLOR_MIN_DB, A_COLOR_MAX_DB));
    ls.push(f);
  }
  return { colors: cs as [string, string, ...string[]], locations: ls as [number, number, ...number[]] };
})();
/** The marks printed in every level slot: every 12 dB, the 0 dB one strong. */
const MARKS_DB = [-36, -24, -12, 0] as const;

/** The color of a level on the house ramp (a lamp, a word). */
export const levelTint = (level: number): string => levelColorForDb(aDb(level), A_COLOR_MIN_DB, A_COLOR_MAX_DB);

/**
 * A computed level (linear; 1 = 0 dB) on the meters' decibel scale. The ramp
 * is laid along the WHOLE slot and uncovered up to the level, so the color
 * at the tip is the color of that level.
 */
export const Bar = memo(function Bar({ w, h, level }: { w: number; h: number; level: number }) {
  const fill = Math.round(aMeterFrac(aDb(level)) * w * 2) / 2;
  return (
    <View style={{ width: w, height: h, borderRadius: 1.5, backgroundColor: HUD.slot, borderWidth: 1, borderColor: HUD.slotRim, overflow: 'hidden' }}>
      {fill > 0 ? (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill, overflow: 'hidden' }}>
          <LinearGradient colors={RAMP.colors} locations={RAMP.locations} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w }} />
          <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
        </View>
      ) : null}
      {MARKS_DB.map((db) => (
        <View key={db} style={{ position: 'absolute', left: Math.round(aMeterFrac(db) * w) - 1, top: 0, bottom: 0, width: 1, backgroundColor: db === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)' }} />
      ))}
    </View>
  );
});

/** Where a level sits along a bar `w` wide, in points from its quiet end. */
export const barX = (level: number, w: number): number => aMeterFrac(aDb(level)) * w;

/** A 0 … 1 setting that is NOT a level (a speed): one flat color, never the
 *  loudness ramp. `hollow` = it is set, but nothing is following it. */
export const Gauge = memo(function Gauge({ w, h, value, color, hollow }: { w: number; h: number; value: number; color: string; hollow?: boolean }) {
  const fill = Math.round(clamp01(Number.isFinite(value) ? value : 0) * w * 2) / 2;
  return (
    <View style={{ width: w, height: h, borderRadius: 1.5, backgroundColor: HUD.slot, borderWidth: 1, borderColor: HUD.slotRim, overflow: 'hidden' }}>
      {fill > 0 ? <View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill }, hollow ? { borderWidth: 1, borderColor: color } : { backgroundColor: color }]} /> : null}
    </View>
  );
});

/* ── the lamp ───────────────────────────────────────────────────────────── */

/** off = dark · on = lit · ring = an outline (there, at no level; or held
 *  from the last press) · cut = an outline with a stroke through it
 *  (silenced, or broken). A state is always a SHAPE as well as a color. */
export type LampState = 'off' | 'on' | 'ring' | 'cut';

export const Lamp = memo(function Lamp({ d, state, color = HUD.value }: { d: number; state: LampState; color?: string }) {
  const base: ViewStyle = { width: d, height: d, borderRadius: d / 2, alignItems: 'center', justifyContent: 'center' };
  if (state === 'on') return <View style={[base, { backgroundColor: color, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }]} />;
  if (state === 'ring') return <View style={[base, { borderWidth: 1.5, borderColor: color }]} />;
  if (state === 'cut') {
    return (
      <View style={[base, { borderWidth: 1, borderColor: color }]}>
        <View style={{ width: d + 3, height: 1.5, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
      </View>
    );
  }
  return <View style={[base, { backgroundColor: HUD.lampOff, borderWidth: 1, borderColor: HUD.lampRim }]} />;
});

const styles = StyleSheet.create({
  frame: { backgroundColor: HUD.ground, overflow: 'hidden', pointerEvents: 'none' },
  edge: { position: 'absolute', left: 0, right: 0, height: 1 },
  lbl: { fontFamily: fonts.oswaldMedium, includeFontPadding: false },
  val: { fontFamily: fonts.mono, includeFontPadding: false },
});
