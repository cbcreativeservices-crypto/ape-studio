/**
 * AmpRig — the lab's central synchronized visualization (build spec Part 2 §1):
 * input waveform · device currents · output waveform, drawn as ONE stack with
 * a shared playhead so cause and effect stay visibly synchronized.
 *
 * RACK REBUILD (owner, TestFlight build 32, 2026-09-30): "We've got displays
 * below controls, which means your fingers block what you see." The stack is
 * now a STAGE drawing only — it sits on the Rack Unit's glass (AmpRack.tsx),
 * its status numbers (supply, heat, efficiency, load) print on the BEZEL and
 * its transport (RUN / SLOW / STEP) is a dock key. Nothing here renders a
 * control; nothing here renders under a control.
 *
 * Everything animated is driven by ONE Animated loop (native driver,
 * transforms only) — waveform paths are computed once per parameter change,
 * never per frame. Reduced motion (settings toggle OR OS): the loop is
 * replaced by a STEP key that moves the playhead a quarter cycle at a time.
 *
 * The rig is a CONCEPTUAL teaching display and says so on its badge. The input
 * and output traces carry the app-wide AMPLITUDE COLOUR STANDARD (owner
 * 2026-09-05, `features/tools/levelColor`): MIDI-0 blue at the mid line,
 * climbing green → yellow → orange → red at ±full scale — and full scale on the
 * output panel IS the rail, so a clipped peak is red because it is at the
 * rail, with the heavier fault overlay on top. Cyan/green stay the lab's
 * LABEL colours for "input"/"output" (legends, diagram arrows), not trace paint.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Polyline, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { WAVE_LEVEL_STOPS, levelColor } from '../../../features/tools/levelColor';
import { animationsAllowed } from '../../../features/settings/a11y';
import { cycleRms } from '../../../features/amp/ampModel';
import { useStageTextScale } from '../rack/stageAspect';
import type { BezelItem } from '../rack/rackTypes';
import { AMP_COLORS } from './kit';

const W = 340;
const PANEL_H = 58;
const Y_MAX = 1.15;
/** Panel title line and the gaps, in the same units as W/PANEL_H — the
 *  waveform stack's shape (aspect) is computed from these. */
const TITLE_FONT = 10;
const TITLE_LINE = 14;
const TITLE_GAP = 2;
const PANEL_GAP = 6;
const stackHeight = (n: number) => n * (TITLE_LINE + TITLE_GAP + PANEL_H) + (n - 1) * PANEL_GAP;

export const CONCEPT_NOTE = 'Conceptual visualization — not a component-level circuit simulation.';

/** y for a signal value on a panel of height h (same mapping everywhere). */
const yFor = (v: number, h: number, yMax = Y_MAX) => h / 2 - (v / yMax) * (h / 2 - 4);

function tracePoints(data: Float32Array, h: number, yMax = Y_MAX): string {
  const pts: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W;
    pts.push(`${x.toFixed(1)},${yFor(data[i], h, yMax).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Contiguous |v| ≥ limit segments, drawn as the warning overlay. */
function clippedSegments(data: Float32Array, limit: number, h: number, yMax = Y_MAX): string[] {
  const segs: string[] = [];
  let cur: string[] = [];
  const n = data.length;
  for (let i = 0; i < n; i++) {
    if (Math.abs(data[i]) >= limit * 0.999) {
      const x = (i / (n - 1)) * W;
      cur.push(`${x.toFixed(1)},${yFor(data[i], h, yMax).toFixed(1)}`);
    } else if (cur.length) {
      segs.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length > 1) segs.push(cur.join(' '));
  return segs.filter((s) => s.includes(' '));
}

/**
 * One panel of the stack, drawn at the width the stage was given: the SVG's
 * pixel height follows the width (svgH ≈ w × PANEL_H / W), so the
 * `preserveAspectRatio="none"` box keeps the viewBox's own ratio and nothing
 * stretches sideways in FULL SCREEN (the SVG trap, legibility pass
 * 2026-09-25). The title is React Native text over the drawing — it grows
 * with the zoom through `scale` (the Skia/overlay trap), 1 on the glass.
 */
function WavePanel({
  title, children, w, svgH, scale,
}: { title: string; children: ReactNode; w: number; svgH: number; scale: number }) {
  const h = PANEL_H;
  return (
    <View style={styles.panel}>
      <Text style={[styles.panelTitle, { fontSize: TITLE_FONT * scale, lineHeight: TITLE_LINE * scale }]} numberOfLines={1}>
        {title}
      </Text>
      <Svg width={w} height={svgH} viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={h} fill="#0a0a0c" />
        <Line x1={0} y1={h / 2} x2={W} y2={h / 2} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
        {children}
      </Svg>
    </View>
  );
}

/**
 * Amplitude-ramp gradient for a zero-centred trace, mapped to ±`fullScale` in
 * PANEL pixels (userSpaceOnUse) so the colour reads TRUE level: MIDI-0 blue at
 * the mid line, red exactly at ±full scale — the rail, on the output panel.
 */
function WaveGradient({ id, fullScale, h = PANEL_H }: { id: string; fullScale: number; h?: number }) {
  return (
    <Defs>
      <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yFor(fullScale, h)} x2={0} y2={yFor(-fullScale, h)}>
        {WAVE_LEVEL_STOPS.map((s) => (
          <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </LinearGradient>
    </Defs>
  );
}

/** A ± pair of horizontal reference lines (rails). */
function RailPair({ at, stroke, dash, width = 1 }: { at: number; stroke: string; dash?: string; width?: number }) {
  return (
    <>
      <Line x1={0} y1={yFor(at, PANEL_H)} x2={W} y2={yFor(at, PANEL_H)} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
      <Line x1={0} y1={yFor(-at, PANEL_H)} x2={W} y2={yFor(-at, PANEL_H)} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
    </>
  );
}

export type RigTrace = { data: Float32Array; color: string; dash?: string; width?: number; label: string };

/** The PICTURE the stack draws — the model's output for this page. */
export type RigPicture = {
  input?: Float32Array;
  /** Positive/negative device currents (gold solid / purple dashed). An
   *  all-zero iNeg is a SINGLE-device picture (Module 3's bias rig, Class A,
   *  Class C): its trace is not drawn and the default title names one
   *  device — a dashed line at zero was a decoy "second device" (review
   *  2026-09-30). */
  devices?: { iPos: Float32Array; iNeg: Float32Array };
  /** Full scale of the device panel in current units (default 2.1 — Class A
   *  reaches 2.0). A single device that runs 0..1 sets ≈1.05 so its swing and
   *  its clipping at the floor/ceiling are visible instead of a near-flat
   *  line in the top half of the panel. */
  deviceYMax?: number;
  output?: Float32Array;
  /** Output rail level (same units as output); at/above it draws warning red. */
  clipAt?: number;
  /** Nominal (idle) rail level, drawn as a faint reference OUTSIDE `clipAt`
   *  when the working rails have sagged below it — so "the rail lines moved
   *  inward" is something the learner can actually see. */
  nominalRailAt?: number;
  /** Extra overlay traces on the OUTPUT panel (carrier, PWM, recovered…). */
  extraOut?: RigTrace[];
  /** Extra overlay traces on the INPUT panel. */
  extraIn?: RigTrace[];
  /** 0..1 — conceptual supply-energy draw rate. */
  supplyFlow: number;
  /** 0..1 — relative heat (normalized teaching value). */
  heat: number;
  /** % — labeled illustrative; null hides the readout. */
  efficiencyPct?: number | null;
  speaker?: boolean;
  faulted?: boolean;
  /** One-sentence accessible summary of the current state. */
  a11ySummary: string;
  deviceTitle?: string;
  outputTitle?: string;
};

/** Panels this picture draws (1–3). */
export const rigPanelCount = (p: RigPicture) => Math.max(1, (p.input ? 1 : 0) + (p.devices ? 1 : 0) + (p.output ? 1 : 0));

/** width ÷ height of the stack in drawing units — the FULL SCREEN canvas is
 *  exactly this shape at every zoom (StageFit reports it). */
export const rigAspect = (p: RigPicture) => W / stackHeight(rigPanelCount(p));

/** The legend lines the page prints under the stage (rail limit, overlays). */
export function rigLegend(p: RigPicture): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = [];
  if (p.clipAt != null && p.output) out.push({ text: '┄ rail limit', color: colors.red });
  if (showNominalRail(p)) out.push({ text: '┄ nominal rail (idle)', color: colors.textSub });
  for (const t of [...(p.extraIn ?? []), ...(p.extraOut ?? [])]) out.push({ text: `${t.dash ? '┄' : '▬'} ${t.label}`, color: t.color });
  return out;
}

/** A second (negative-side) device exists only if its current is ever non-zero. */
export function hasNegDevice(d: { iNeg: Float32Array }): boolean {
  for (let i = 0; i < d.iNeg.length; i++) if (d.iNeg[i] !== 0) return true;
  return false;
}

const showNominalRail = (p: RigPicture) => p.clipAt != null && p.nominalRailAt != null && p.nominalRailAt > p.clipAt + 0.01;

/* ── the status readouts (bezel cells, not a row under the display) ─────── */

// Heat is NOT amplitude: blue (cool) → green → yellow → red (dangerously
// hot) is the kit's fault language, and the word beside it says the same.
export const heatWord = (heat: number) => (heat < 0.35 ? 'cool' : heat < 0.6 ? 'warm' : heat < 0.8 ? 'hot' : 'DANGER');
export const heatTint = (heat: number) => (heat < 0.35 ? '#3f6fae' : heat < 0.6 ? '#3fae52' : heat < 0.8 ? '#e8c341' : '#ff5f4e');

/** Loudspeaker drive, 0..1 of full, from the output cycle. */
export const rigLoadLevel = (p: RigPicture) => (p.output ? Math.min(1, cycleRms(p.output) * Math.SQRT2) : 0);

/**
 * The rig's status cells for the BEZEL: SUPPLY · HEAT · EFFICIENCY · LOAD, in
 * the words the old status row used. A page composes these with its own
 * readouts (≤5 cells on a 375-wide phone; BezelReadouts drops a cropped
 * cell's label, never its number).
 */
export function rigStatusBezel(p: RigPicture, pick: ('supply' | 'heat' | 'eff' | 'load')[] = ['supply', 'heat', 'eff', 'load']): BezelItem[] {
  const items: BezelItem[] = [];
  for (const k of pick) {
    if (k === 'supply') items.push({ k: 'SUPPLY', v: `${Math.round(p.supplyFlow * 100)}%`, tint: AMP_COLORS.supply });
    else if (k === 'heat') items.push({ k: 'HEAT', v: heatWord(p.heat), tint: heatTint(p.heat) });
    else if (k === 'eff' && p.efficiencyPct != null) items.push({ k: 'EFFIC.', v: `${Math.round(p.efficiencyPct)}%`, tint: colors.green });
    else if (k === 'load' && p.speaker) {
      const l = rigLoadLevel(p);
      items.push({ k: 'LOAD', v: `${Math.round(l * 100)}%`, tint: levelColor(l) });
    }
  }
  return items;
}

/* ── the shared playhead ────────────────────────────────────────────────── */

export type RigPlayhead = {
  motion: boolean;
  running: boolean;
  slow: boolean;
  stepPhase: number;
  phase: Animated.Value;
  setRunning: (v: boolean) => void;
  setSlow: (v: boolean) => void;
  step: () => void;
};

/** One Animated loop for the page's stack (native driver, transforms only).
 *  Reduced motion: no loop; `step` moves the playhead a quarter cycle. */
export function useRigPlayhead(): RigPlayhead {
  const motion = animationsAllowed();
  const [running, setRunning] = useState(true);
  const [slow, setSlow] = useState(false);
  const [stepPhase, setStepPhase] = useState(0); // reduced-motion playhead ⅛s
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!motion || !running) return;
    phase.setValue(0);
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: slow ? 6000 : 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, running, slow, phase]);

  return useMemo(
    () => ({ motion, running, slow, stepPhase, phase, setRunning, setSlow, step: () => setStepPhase((s) => (s + 2) % 9) }),
    [motion, running, slow, stepPhase, phase],
  );
}

/* ── the stack ──────────────────────────────────────────────────────────── */

/**
 * The waveform panels at (w, h): the panels share the height the title lines
 * leave over, so the stack fills the box exactly and each panel is
 * w × PANEL_H / W — the viewBox's own shape. One playhead sweeps them all.
 * Drawn on the glass and again in FULL SCREEN at the zoomed size — the panel
 * titles grow with it (useStageTextScale), the SVG scales with its viewBox.
 */
export function WaveStack({
  w, h, p, play,
}: {
  w: number;
  h: number;
  p: RigPicture;
  play: RigPlayhead;
}) {
  const scale = useStageTextScale();
  // Gradient ids must be unique per stack — several stacks can share one
  // document (web), and their rails can differ.
  const gid = useRef(`amprig${Math.floor(Math.random() * 1e9).toString(36)}`).current;
  const n = rigPanelCount(p);
  const titleLine = TITLE_LINE * scale;
  const svgH = Math.max(16, Math.floor((h - n * (titleLine + TITLE_GAP) - (n - 1) * PANEL_GAP) / n));
  const { motion, phase, stepPhase } = play;
  const playX = useMemo(
    () => (motion ? phase.interpolate({ inputRange: [0, 1], outputRange: [0, w] }) : new Animated.Value((stepPhase / 8) * w)),
    [motion, phase, w, stepPhase],
  );
  const showNominal = showNominalRail(p);
  return (
    <View style={{ width: w, height: h, gap: PANEL_GAP }} accessible accessibilityRole="image" accessibilityLabel={p.a11ySummary}>
      {p.input ? (
        <WavePanel title="INPUT (signal)" w={w} svgH={svgH} scale={scale}>
          <WaveGradient id={`${gid}in`} fullScale={1} />
          <Polyline points={tracePoints(p.input, PANEL_H)} fill="none" stroke={`url(#${gid}in)`} strokeWidth={1.6} />
          {p.extraIn?.map((t) => (
            <Polyline key={t.label} points={tracePoints(t.data, PANEL_H)} fill="none" stroke={t.color} strokeWidth={t.width ?? 1.2} strokeDasharray={t.dash} />
          ))}
        </WavePanel>
      ) : null}
      {p.devices ? (
        <WavePanel title={p.deviceTitle ?? (hasNegDevice(p.devices) ? 'DEVICE CURRENTS (+ gold solid · − purple dashed)' : 'DEVICE CURRENT (gold)')} w={w} svgH={svgH} scale={scale}>
          {/* yMax 2.1, not 1.6. Class A is `iq(1.0) + sine(drive)`, so device
              current reaches 2.0 at full drive — a 1.6 ceiling flat-topped
              the trace and drew the universal picture of SATURATION directly
              under copy explaining full-cycle conduction, which is the one
              thing class A does not do. */}
          <Polyline points={tracePoints(p.devices.iPos, PANEL_H, p.deviceYMax ?? 2.1)} fill="none" stroke={AMP_COLORS.pos} strokeWidth={1.6} />
          {hasNegDevice(p.devices) ? (
            <Polyline points={tracePoints(p.devices.iNeg, PANEL_H, p.deviceYMax ?? 2.1)} fill="none" stroke={AMP_COLORS.neg} strokeWidth={1.6} strokeDasharray="5,3" />
          ) : null}
        </WavePanel>
      ) : null}
      {p.output ? (
        <WavePanel title={p.outputTitle ?? 'OUTPUT (to load)'} w={w} svgH={svgH} scale={scale}>
          {showNominal ? <RailPair at={p.nominalRailAt!} stroke="rgba(255,255,255,0.18)" dash="2,5" /> : null}
          {p.clipAt != null ? <RailPair at={p.clipAt} stroke="rgba(255,75,58,0.45)" dash="4,4" /> : null}
          <WaveGradient id={`${gid}out`} fullScale={p.clipAt ?? 1} />
          <Polyline points={tracePoints(p.output, PANEL_H)} fill="none" stroke={`url(#${gid}out)`} strokeWidth={2} />
          {p.clipAt != null
            ? clippedSegments(p.output, p.clipAt, PANEL_H).map((s, i) => (
                <Polyline key={i} points={s} fill="none" stroke={AMP_COLORS.fault} strokeWidth={2.6} />
              ))
            : null}
          {p.extraOut?.map((t) => (
            <Polyline key={t.label} points={tracePoints(t.data, PANEL_H)} fill="none" stroke={t.color} strokeWidth={t.width ?? 1.2} strokeDasharray={t.dash} />
          ))}
        </WavePanel>
      ) : null}
      {/* the shared playhead */}
      <Animated.View
        pointerEvents="none"
        style={[styles.playhead, { top: titleLine + TITLE_GAP, width: 1.5 * scale, transform: [{ translateX: playX }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: TITLE_GAP },
  panelTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: TITLE_FONT, letterSpacing: 1.2 },
  playhead: { position: 'absolute', bottom: 0, left: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
});
