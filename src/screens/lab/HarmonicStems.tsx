/**
 * HarmonicStems — the STEM EDITOR for the Ear Lab's editable analytic
 * harmonic model (HV-1 Build A).
 *
 * Classic additive-synth orientation: harmonic number 1..12 on X, level on
 * Y over a dB scale (−60..0 re model full scale — log-friendly editing).
 * One vertical stem + circular handle per harmonic, H1..H12 labels under
 * each. Disabled/muted harmonics render dim + hollow. Odd stems green /
 * even stems cyan; the ODD/EVEN HIGHLIGHT toggle (Build B) re-tints the
 * groups orange (odd) / blue (even) so the two families pop apart. The
 * selected stem highlights amber either way.
 *
 * BUILD B OVERLAYS (all pointerEvents="none" — they never eat a gesture):
 *  - ENVELOPE: a line tracing the tops of CONTRIBUTING stems — enabled,
 *    unmuted, above the floor (the dB/oct lesson; caption in HarmonicsView).
 *  - SPACING: connective baseline + ticks at every slot — the "evenly
 *    spaced by f0" teaching aid (caption in HarmonicsView).
 *  - GHOST (A/B): dashed stem-top dashes from snapshot A, so before/after
 *    is visually comparable while editing B.
 *
 * GESTURES (per-stem Pressables + ONE panel-level PanResponder):
 *  - drag ↕ = level (dy → dB → amp; the bottom of the scale = silent)
 *  - tap = select (identity card) · double-tap = reset that harmonic to the
 *    active preset's canonical value
 *  - long-press = DETAIL sheet: phase slider 0–360°, polarity flip (+180°),
 *    enable/disable, mute, REAL solo (a sine at n×f0 through the existing
 *    tone path — HarmonicsView owns the audio lifecycle), reset
 *
 * SCROLL INTERPLAY: the Explore panel lives in a ScrollView, so vertical
 * stem drags must WIN. onMoveShouldSetPanResponder claims on dy dominance,
 * onPanResponderTerminationRequest refuses handoff, AND onDragActive(true/
 * false) is threaded up (HarmonicsView → EarLabScreen) so the ScrollView
 * sets scrollEnabled={false} for the drag's duration — belt and braces,
 * because an Android ScrollView can still steal from a responder that
 * refuses termination.
 *
 * PERF: onSetAmp commits are COALESCED to one per animation frame (an rAF
 * latch of the newest level — 120 Hz-touch devices otherwise commit a full
 * view recompute per input event) plus a 0.05 dB dead-band; no timers. The
 * touched slot is identified by the stem Pressable's onPressIn (reliable —
 * no hit-math on gesture coordinates).
 */
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import Svg, { Line, Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';
import { rampColors } from '../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
import {
  AMP_FLOOR,
  DBC_FLOOR_DB,
  dbcOf,
  effectiveAmp,
  type Harmonic,
  type HarmonicSet,
} from './harmonicModel';

// The musical interval each harmonic sounds relative to the fundamental — the
// harmonic series' pitch content, labeled across the top of the sliders (owner
// 2026-08-05). True series: H10 = M3, H12 = P5 (the "13" is the 13th harmonic,
// beyond the 12 shown). Index = harmonic number − 1.
const HARMONIC_INTERVALS = ['Root', '8ve', 'P5', '8ve', 'M3', 'P5', '♭7', '8ve', '9', 'M3', '♯11', 'P5'] as const;

const PLOT_H = 132; // stem plot area height (classic ~120-140 px)
const HANDLE_D = 14; // handle diameter
const TRAVEL = PLOT_H - HANDLE_D; // px of handle travel = the full dBc range
const RANGE_DB = -DBC_FLOOR_DB; // 60
const DOUBLE_TAP_MS = 300;
const DRAG_SLOP = 6; // px of dy before a drag claims the gesture
const GRID_DB = [0, -20, -40, -60] as const;
const PHASE_THUMB_W = 22;
// Screen-reader adjust steps (accessibilityActions increment/decrement).
const A11Y_DB_STEP = 3;
const A11Y_PHASE_STEP = 15;

/** y of a dB gridline inside the plot (handle-center coordinates). */
const gridTop = (db: number) => HANDLE_D / 2 + (db / DBC_FLOOR_DB) * TRAVEL;

function SheetChip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.sheetChip, selected && styles.sheetChipSel, disabled && styles.sheetChipDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.sheetChipText,
          selected && styles.sheetChipTextSel,
          disabled && styles.sheetChipTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function HarmonicStems({
  set,
  f0,
  selectedN,
  onSelect,
  onSetAmp,
  onSetPhase,
  onToggleEnabled,
  onToggleMuted,
  onResetHarmonic,
  onDragActive,
  highlightOddEven,
  showEnvelope,
  showSpacing,
  ghostSet,
  soloN,
  canSolo,
  onToggleSolo,
}: {
  set: HarmonicSet;
  f0: number;
  selectedN: number | null;
  onSelect: (n: number) => void;
  onSetAmp: (n: number, amp: number) => void;
  onSetPhase: (n: number, phaseDeg: number) => void;
  onToggleEnabled: (n: number) => void;
  onToggleMuted: (n: number) => void;
  onResetHarmonic: (n: number) => void;
  onDragActive?: (active: boolean) => void;
  /** ODD/EVEN highlight — re-tints the groups orange (odd) / blue (even). */
  highlightOddEven: boolean;
  /** ENVELOPE overlay — line tracing enabled stems' tops. */
  showEnvelope: boolean;
  /** SPACING overlay — baseline + ticks (evenly spaced by f0 teaching aid). */
  showSpacing: boolean;
  /** A/B ghost — snapshot A's stem tops as dashed dashes (null = off). */
  ghostSet: HarmonicSet | null;
  /** Currently solo-audible harmonic (real sine at n×f0), or null. */
  soloN: number | null;
  /** False when the measurement engine is absent — solo needs the tone path. */
  canSolo: boolean;
  onToggleSolo: (n: number) => void;
}) {
  const [detailN, setDetailN] = useState<number | null>(null);
  const [phaseTrackW, setPhaseTrackW] = useState(0);
  const [plotW, setPlotW] = useState(0); // for the overlay SVG's x positions

  // Latest props/state for the PanResponders (created ONCE in useRef —
  // callbacks read through this ref so they never go stale).
  const liveRef = useRef({ set, onSelect, onSetAmp, onSetPhase, onDragActive, detailN, phaseTrackW });
  liveRef.current = { set, onSelect, onSetAmp, onSetPhase, onDragActive, detailN, phaseTrackW };

  const activeSlotRef = useRef<number | null>(null); // set by onPressIn — the touched stem
  const lastTapRef = useRef<{ n: number; t: number } | null>(null);
  const dragRef = useRef<{ n: number; startDb: number; lastDb: number } | null>(null);

  // rAF COALESCING: gesture-move events can arrive at 120 Hz while the
  // display refreshes at 60 — latch only the NEWEST level and commit once
  // per animation frame, so a drag costs at most one full-view recompute
  // per frame instead of one per input event.
  const pendingAmpRef = useRef<{ n: number; amp: number } | null>(null);
  const ampRafRef = useRef<number | null>(null);
  const flushAmp = () => {
    ampRafRef.current = null;
    const p = pendingAmpRef.current;
    if (p) {
      pendingAmpRef.current = null;
      liveRef.current.onSetAmp(p.n, p.amp);
    }
  };
  const queueAmp = (n: number, amp: number) => {
    pendingAmpRef.current = { n, amp };
    if (ampRafRef.current == null) ampRafRef.current = requestAnimationFrame(flushAmp);
  };

  const endDrag = () => {
    // Commit any latched level synchronously — release must never drop the
    // final position the finger reached.
    if (ampRafRef.current != null) {
      cancelAnimationFrame(ampRafRef.current);
      ampRafRef.current = null;
    }
    const p = pendingAmpRef.current;
    if (p) {
      pendingAmpRef.current = null;
      liveRef.current.onSetAmp(p.n, p.amp);
    }
    if (dragRef.current) {
      dragRef.current = null;
      liveRef.current.onDragActive?.(false);
    }
    activeSlotRef.current = null;
  };

  // If the editor unmounts MID-DRAG (e.g. a second finger taps a mode tab —
  // they stay pressable during a PanResponder drag), no release fires: free
  // the parent scroll lock and the pending frame here.
  useEffect(
    () => () => {
      if (ampRafRef.current != null) cancelAnimationFrame(ampRafRef.current);
      if (dragRef.current) liveRef.current.onDragActive?.(false);
    },
    [],
  );

  // Panel-level vertical-drag responder. Claims on dy dominance only, so a
  // clean tap/long-press still reaches the stem Pressables underneath.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Claims only for a SINGLE touch: with two fingers down gestureState.dy
      // is the multi-touch centroid and activeSlotRef may name whichever stem
      // was pressed LAST — never start a drag from that. Also never while the
      // detail sheet is open (a surviving long-press touch must not edit
      // invisibly behind the modal).
      onMoveShouldSetPanResponder: (_evt, g) =>
        activeSlotRef.current != null &&
        liveRef.current.detailN == null &&
        g.numberActiveTouches === 1 &&
        Math.abs(g.dy) > DRAG_SLOP &&
        Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_evt) => {
        const n = activeSlotRef.current;
        if (n == null) return;
        const h = liveRef.current.set[n - 1];
        const startDb = dbcOf(h);
        // PanResponder resets gestureState.dx/dy to 0 immediately before this
        // grant fires, so move dy values are already grant-relative — no slop
        // offset to compensate.
        dragRef.current = { n, startDb, lastDb: startDb };
        lastTapRef.current = null; // a drag is not a tap
        liveRef.current.onSelect(n); // the identity card follows the edit
        liveRef.current.onDragActive?.(true);
      },
      onPanResponderMove: (_evt, g) => {
        const d = dragRef.current;
        if (!d) return;
        // A second touch turns dy into the centroid (half-rate/jumping
        // edits) — hold the level until the gesture is single-touch again.
        if (g.numberActiveTouches > 1) return;
        const db = Math.max(DBC_FLOOR_DB, Math.min(0, d.startDb - (g.dy / TRAVEL) * RANGE_DB));
        if (Math.abs(db - d.lastDb) < 0.05) return; // dead-band: skip no-op setState
        d.lastDb = db;
        // Bottom of the scale = silent (amp 0), never a fabricated −60 dB tail.
        queueAmp(d.n, db <= DBC_FLOOR_DB + 0.25 ? 0 : 10 ** (db / 20));
      },
      onPanResponderRelease: endDrag,
      onPanResponderTerminate: endDrag,
    }),
  ).current;

  // Phase slider responder (detail sheet — inside a Modal, no scroll rivalry).
  const phaseStartRef = useRef(0);
  const phasePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { detailN: n, phaseTrackW: w, onSetPhase: setPhase } = liveRef.current;
        if (n == null) return;
        // The thumb renders over w − PHASE_THUMB_W (its left edge spans that
        // range) — map touches over the SAME span, centered on the thumb, so
        // finger and visual agree at the ends of the range.
        const span = w - PHASE_THUMB_W;
        if (span > 0) {
          // Jump so the thumb CENTER lands under the touch point (children
          // are pointerEvents="none", so locationX is track-relative).
          const p = Math.max(
            0,
            Math.min(360, ((evt.nativeEvent.locationX - PHASE_THUMB_W / 2) / span) * 360),
          );
          phaseStartRef.current = p;
          setPhase(n, Math.round(p));
        } else {
          phaseStartRef.current = liveRef.current.set[n - 1].phaseDeg;
        }
      },
      onPanResponderMove: (_evt, g) => {
        const { detailN: n, phaseTrackW: w, onSetPhase: setPhase } = liveRef.current;
        const span = w - PHASE_THUMB_W;
        if (n == null || span <= 0) return;
        const p = Math.max(0, Math.min(360, phaseStartRef.current + (g.dx / span) * 360));
        setPhase(n, Math.round(p));
      },
    }),
  ).current;

  const detail: Harmonic | null = detailN != null ? set[detailN - 1] : null;
  const closeDetail = () => setDetailN(null);

  // Overlay geometry — slot-center x for harmonic n (slots are equal flex).
  const xOf = (n: number) => ((n - 0.5) * plotW) / set.length;

  // ENVELOPE path: tops of CONTRIBUTING stems — enabled, unmuted, above the
  // floor (effectiveAmp; matches envelopeSlopeDbPerOct's qualifier, so the
  // drawn envelope and the SLOPE readout always describe the same stems the
  // waveform/THD/spectrum panels are built from).
  let envelopePath = '';
  if (showEnvelope && plotW > 0) {
    let started = false;
    for (const h of set) {
      if (effectiveAmp(h) <= AMP_FLOOR) continue;
      envelopePath += `${started ? 'L' : 'M'}${xOf(h.n).toFixed(1)},${gridTop(dbcOf(h)).toFixed(1)}`;
      started = true;
    }
  }

  const overlaysOn = plotW > 0 && (showEnvelope || showSpacing || ghostSet != null);

  return (
    <View style={styles.card}>
      <Text style={styles.head}>HARMONIC STEMS — EDITABLE MODEL</Text>

      {/* Interval names across the TOP — the musical equivalent of each
          harmonic (owner 2026-08-05), aligned above each stem. */}
      <View style={styles.intervalRow}>
        {set.map((h) => (
          <Text
            key={h.n}
            style={[styles.intervalLabel, h.n === selectedN && styles.slotLabelSel]}
            numberOfLines={1}
          >
            {HARMONIC_INTERVALS[h.n - 1] ?? ''}
          </Text>
        ))}
      </View>

      <View
        style={styles.plot}
        onLayout={(e) => setPlotW(Math.round(e.nativeEvent.layout.width))}
        {...pan.panHandlers}
        // Scoped scroll-lock (owner 2026-08-14): touching the PLOT locks the host
        // ScrollView so a vertical stem drag wins over page scroll from the first
        // pixel — the belt-and-braces for the move-based PanResponder above.
        // Scoped HERE (not over the whole view) so the rest of the lab scrolls
        // freely. Plain touch events don't collide with pan.panHandlers' responder
        // handlers; the PanResponder's own grant/release also toggle onDragActive.
        onTouchStart={() => onDragActive?.(true)}
        onTouchEnd={() => onDragActive?.(false)}
        onTouchCancel={() => onDragActive?.(false)}
      >
        {GRID_DB.map((db) => (
          <View key={db} style={[styles.gridLine, { top: gridTop(db) }]} pointerEvents="none" />
        ))}
        <Text style={[styles.gridLabel, { top: gridTop(0) - 2 }]} pointerEvents="none">
          0
        </Text>
        <Text style={[styles.gridLabel, { top: gridTop(-60) - 13 }]} pointerEvents="none">
          −60
        </Text>

        <View style={styles.slotRow}>
          {set.map((h) => {
            const db = dbcOf(h);
            const frac = h.amp <= AMP_FLOOR ? 0 : (db - DBC_FLOOR_DB) / RANGE_DB;
            const stemH = frac * TRAVEL;
            const off = !h.enabled || h.muted;
            const sel = h.n === selectedN;
            // Odd/even base hues; the ODD/EVEN highlight swaps to a louder
            // orange/blue pair; selection always overrides with amber.
            const hue = sel
              ? colors.amber
              : highlightOddEven
                ? h.n % 2 === 1
                  ? colors.orange
                  : colors.blue
                : h.n % 2 === 1
                  ? colors.green
                  : colors.cyan;
            return (
              <Pressable
                key={h.n}
                style={styles.slot}
                onPressIn={() => {
                  activeSlotRef.current = h.n;
                }}
                onPress={() => {
                  const now = Date.now();
                  const last = lastTapRef.current;
                  if (last && last.n === h.n && now - last.t < DOUBLE_TAP_MS) {
                    lastTapRef.current = null;
                    onResetHarmonic(h.n); // double-tap: back to the preset value
                  } else {
                    lastTapRef.current = { n: h.n, t: now };
                    onSelect(h.n);
                  }
                }}
                onLongPress={() => {
                  lastTapRef.current = null;
                  // The sheet owns the interaction now — clear the slot so the
                  // still-down finger can never claim a drag behind the modal.
                  activeSlotRef.current = null;
                  setDetailN(h.n);
                }}
                delayLongPress={380}
                accessibilityRole="adjustable"
                accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(e) => {
                  // Screen-reader adjust: fixed dB steps over the same scale
                  // as the drag; the bottom of the scale = silent (amp 0).
                  const next = Math.max(
                    DBC_FLOOR_DB,
                    Math.min(
                      0,
                      dbcOf(h) +
                        (e.nativeEvent.actionName === 'increment' ? A11Y_DB_STEP : -A11Y_DB_STEP),
                    ),
                  );
                  onSetAmp(h.n, next <= DBC_FLOOR_DB ? 0 : 10 ** (next / 20));
                }}
                accessibilityLabel={`Harmonic ${h.n}, ${h.n * f0} hertz, ${
                  h.amp <= AMP_FLOOR ? 'silent' : `${db.toFixed(0)} dB relative to full scale`
                }${off ? ', inactive' : ''}`}
                accessibilityHint="Drag vertically to change level. Double tap to reset. Long press for details."
              >
                {/* The STEM SLIDE LINE is coloured by LEVEL via the MIDI ramp
                    (owner 2026-08-05): higher = red, lower = blue. The node
                    (handle) keeps its odd/even/selected identity hue. */}
                <GradientView
                  colors={rampColors(frac)}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.stem, { height: stemH + HANDLE_D / 2, opacity: off ? 0.3 : 0.95 }]}
                />
                <View
                  style={[
                    styles.handle,
                    { bottom: stemH, borderColor: hue },
                    off
                      ? styles.handleHollow // dim + hollow = disabled/muted
                      : { backgroundColor: hue },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* OVERLAYS — ghost (A/B), envelope, spacing. pointerEvents="none":
            they must never intercept a stem tap or drag. */}
        {overlaysOn ? (
          <Svg width={plotW} height={PLOT_H} style={StyleSheet.absoluteFill} pointerEvents="none">
            {ghostSet
              ? ghostSet.map((h) => {
                  // Ghost tops only for harmonics that CONTRIBUTED in A —
                  // disabled/muted/silent snapshot stems drew nothing then.
                  if (effectiveAmp(h) <= AMP_FLOOR) return null;
                  const y = gridTop(dbcOf(h));
                  return (
                    <Line
                      key={`g${h.n}`}
                      x1={xOf(h.n) - 7}
                      x2={xOf(h.n) + 7}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                  );
                })
              : null}
            {showEnvelope && envelopePath !== '' ? (
              <Path d={envelopePath} stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} fill="none" />
            ) : null}
            {showSpacing ? (
              <>
                <Line
                  x1={xOf(1)}
                  x2={xOf(set.length)}
                  y1={PLOT_H - 5}
                  y2={PLOT_H - 5}
                  stroke="rgba(91,255,133,0.55)"
                  strokeWidth={1}
                />
                {set.map((h) => (
                  <Line
                    key={`s${h.n}`}
                    x1={xOf(h.n)}
                    x2={xOf(h.n)}
                    y1={PLOT_H - 11}
                    y2={PLOT_H}
                    stroke="rgba(91,255,133,0.55)"
                    strokeWidth={1}
                  />
                ))}
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>

      <View style={styles.labelRow}>
        {set.map((h) => (
          <Text key={h.n} style={[styles.slotLabel, h.n === selectedN && styles.slotLabelSel]}>
            {`H${h.n}`}
          </Text>
        ))}
      </View>

      <Text style={styles.hint}>
        Drag ↕ level (dB re full scale) · tap select · double-tap reset · hold for phase & more
      </Text>

      {/* DETAIL SHEET — long-press target: phase / polarity / enable / mute /
          solo placeholder / reset. Reads the LIVE harmonic each render, so
          edits reflect immediately. */}
      {detail ? (
        <Modal accessibilityViewIsModal visible transparent animationType="fade" statusBarTranslucent onRequestClose={closeDetail}>
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeDetail}
              accessibilityRole="button"
              accessibilityLabel="Dismiss harmonic detail"
            />
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>
                {`H${detail.n} — ${detail.n % 2 === 1 ? 'ODD' : 'EVEN'}-ORDER · ${detail.n * f0} Hz`}
              </Text>
              <Text style={styles.sheetMeta}>
                {`level ${detail.amp <= AMP_FLOOR ? 'silent' : `${dbcOf(detail).toFixed(1)} dB re full scale`} · phase ${Math.round(detail.phaseDeg)}°`}
              </Text>

              <Text style={styles.sheetLabel}>PHASE 0–360°</Text>
              <View style={styles.phaseRow}>
                <View
                  style={styles.phaseTrack}
                  onLayout={(e) => setPhaseTrackW(Math.round(e.nativeEvent.layout.width))}
                  {...phasePan.panHandlers}
                  accessibilityRole="adjustable"
                  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                  onAccessibilityAction={(e) => {
                    // Screen-reader adjust: fixed degree steps, clamped 0–360.
                    const next = Math.max(
                      0,
                      Math.min(
                        360,
                        detail.phaseDeg +
                          (e.nativeEvent.actionName === 'increment'
                            ? A11Y_PHASE_STEP
                            : -A11Y_PHASE_STEP),
                      ),
                    );
                    onSetPhase(detail.n, Math.round(next));
                  }}
                  accessibilityLabel={`Phase, ${Math.round(detail.phaseDeg)} degrees`}
                >
                  <View style={styles.phaseGroove} pointerEvents="none" />
                  {phaseTrackW > 0 ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.phaseThumb,
                        { left: (detail.phaseDeg / 360) * (phaseTrackW - PHASE_THUMB_W) },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={styles.phaseValue}>{`${Math.round(detail.phaseDeg)}°`}</Text>
              </View>

              <View style={styles.sheetChips}>
                <SheetChip
                  label="POLARITY +180°"
                  onPress={() => onSetPhase(detail.n, (detail.phaseDeg + 180) % 360)}
                />
                <SheetChip
                  label={detail.enabled ? 'ENABLED' : 'DISABLED'}
                  selected={detail.enabled}
                  onPress={() => onToggleEnabled(detail.n)}
                />
                <SheetChip label="MUTE" selected={detail.muted} onPress={() => onToggleMuted(detail.n)} />
                <SheetChip
                  label="SOLO"
                  selected={detail.n === soloN}
                  disabled={!canSolo}
                  onPress={() => onToggleSolo(detail.n)}
                />
                <SheetChip label="RESET" onPress={() => onResetHarmonic(detail.n)} />
              </View>
              <Text style={styles.sheetNote}>
                {canSolo
                  ? detail.n === soloN
                    ? `SOLO H${detail.n} · ${detail.n * f0} Hz sine — this harmonic alone as a real sine; the full mixture needs the additive engine.`
                    : 'SOLO plays this harmonic alone as a real sine at its exact frequency.'
                  : 'Solo playback needs the measurement engine.'}
              </Text>

              <Pressable
                style={styles.doneBtn}
                onPress={closeDetail}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={styles.doneText}>DONE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Card chrome matches the vizCard idiom.
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    gap: 6,
  },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel },

  plot: { height: PLOT_H, backgroundColor: '#0a0a0c', borderRadius: 4, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  gridLabel: { position: 'absolute', left: 4, fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
  slotRow: { flexDirection: 'row', height: PLOT_H },
  slot: { flex: 1, height: PLOT_H },
  stem: { position: 'absolute', bottom: 0, left: '50%', marginLeft: -1.5, width: 3, borderRadius: 1.5 },
  handle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -HANDLE_D / 2,
    width: HANDLE_D,
    height: HANDLE_D,
    borderRadius: HANDLE_D / 2,
    borderWidth: 1.5,
  },
  handleHollow: { backgroundColor: 'transparent', opacity: 0.55 },

  labelRow: { flexDirection: 'row' },
  slotLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  slotLabelSel: { color: colors.amber },
  // Interval names across the top — one per stem, aligned by flex.
  intervalRow: { flexDirection: 'row', marginBottom: 2 },
  intervalLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: colors.textSub,
  },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  // Detail sheet (PresetFader popup idiom, green-tinted for the Ear Lab).
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,8,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  sheet: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.35)',
    padding: 18,
    gap: 8,
  },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textPrimary },
  sheetMeta: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt },
  sheetLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.amberLabel,
    marginTop: 4,
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseTrack: { flex: 1, height: 30, justifyContent: 'center' },
  phaseGroove: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#050506',
    borderWidth: 1,
    borderColor: '#000',
  },
  phaseThumb: {
    position: 'absolute',
    width: PHASE_THUMB_W,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#c6c9cf', // brushed-metal cap fill (PresetFader idiom)
    borderWidth: 1,
    borderColor: '#83868c',
  },
  phaseValue: { width: 44, textAlign: 'right', fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  sheetChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sheetChipSel: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  sheetChipDisabled: { opacity: 0.4 },
  sheetChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  sheetChipTextSel: { color: colors.amber },
  sheetChipTextDisabled: { color: colors.textMuted },
  sheetNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  doneBtn: {
    marginTop: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(55,224,95,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.green },
});
