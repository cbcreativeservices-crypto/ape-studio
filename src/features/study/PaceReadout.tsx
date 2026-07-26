/**
 * PaceReadout — the in-screen pace CONTAINER (redesigned 2026-07-25).
 *
 * Layout (top → bottom):
 *   • header row — STATUS WORD (AHEAD / ON PACE / BEHIND / TIME'S UP) on the
 *     left; an on/off toggle + a RESET button on the right.
 *   • animated BEHIND ◄──●──► AHEAD scale (paced only) — the marker starts
 *     CENTERED (on-time) and moves RIGHT when ahead, LEFT when behind.
 *   • a two-row clock block (elapsed clock / signed offset) beside a metrics
 *     block: CURRENT PACE, Questions/min, ± questions, Hz and BPM.
 *
 * STOPWATCH mode (no lap target) drops the scale, the status and the ± metric —
 * a pure count-up: elapsed + Questions/min + Hz + BPM.
 *
 * The toggle/reset are optional (a caller that omits them — e.g. Matching while
 * another task owns it — simply renders neither), so the component stays
 * backward-compatible.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ResetIcon } from '../../components/ResetIcon';
import { TimerIcon } from '../../components/TimerIcon';
import { colors, fonts } from '../../theme/tokens';
import { fmtClock, fmtSigned, quantizeOffset, type PaceStatus, type PacePreset } from './paceStore';
import { PresetFader } from './PresetFader';
import type { TimeTrialSnapshot } from './timeTrial';

/** Play triangle — shown on the flip button while the timer is PAUSED. */
function PlayGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 5 L19 12 L7 19 Z" fill={color} />
    </Svg>
  );
}

/** Pause bars — shown on the flip button while the timer is RUNNING. */
function PauseGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6} y={5} width={4} height={14} rx={1} fill={color} />
      <Rect x={14} y={5} width={4} height={14} rx={1} fill={color} />
    </Svg>
  );
}

/** Fader glyph — a line with a knob; the tap-to-open pace-preset control. */
function FaderGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={4} y1={9} x2={20} y2={9} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9} cy={9} r={3} fill={color} />
      <Line x1={4} y1={16} x2={20} y2={16} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={15} cy={16} r={3} fill={color} />
    </Svg>
  );
}

// Ahead = GREEN, behind = AMBER (owner request 2026-07-25) — consistent across
// the normal readout, the trial HUD, and the fullscreen strip (all read here).
// On-pace stays neutral amber; overtime stays gold.
const STATUS_COLOR: Record<PaceStatus, string> = {
  // GREEN on-pace/ahead (dot starts green at center), AMBER only once you fall
  // behind and the dot moves LEFT (user request 2026-07-25).
  ahead: colors.green,
  onpace: colors.green,
  behind: colors.amberDeep, // #ffb400
  overtime: colors.amberDeep,
};

const STATUS_WORD: Record<PaceStatus, string> = {
  ahead: 'AHEAD',
  onpace: 'ON PACE',
  behind: 'BEHIND',
  overtime: "TIME'S UP",
};

/** Trial HUD reuses the status colors but a slightly different vocabulary. */
const TRIAL_STATUS_WORD: Record<PaceStatus, string> = {
  ahead: 'AHEAD',
  onpace: 'ON TRACK',
  behind: 'BEHIND',
  overtime: 'ON TRACK',
};

/** Compact pace-multiplier tag for the track-center label: a large number + a
 *  smaller "x"/"x faster" suffix (user request 2026-07-25). null = stopwatch. */
function paceTag(preset: PacePreset): { num: string; suffix: string } | null {
  switch (preset) {
    case 'x2_faster':
      return { num: '2', suffix: 'x faster' };
    case 'x1_5_faster':
      return { num: '1.5', suffix: 'x faster' };
    case 'quiz':
      return { num: '1', suffix: 'x' };
    case 'x1_5':
      return { num: '1.5', suffix: 'x' };
    case 'x2':
      return { num: '2', suffix: 'x' };
    case 'x3':
      return { num: '3', suffix: 'x' };
    case 'x4':
      return { num: '4', suffix: 'x' };
    case 'stopwatch':
      return null;
  }
}

export function PaceReadout({
  mode,
  secPerQ,
  status,
  offsetSeconds,
  markerPos,
  answered,
  total,
  elapsed,
  brainOutputs,
  enabled,
  onToggle,
  onReset,
  running,
  onToggleRunning,
  onRemove,
  preset,
  onPresetChange,
  trial,
  onTrialRestart,
  onTrialExit,
  variant = 'full',
  autoTrack,
  onToggleAutoTrack,
}: {
  mode: 'paced' | 'stopwatch';
  /** paced only — seconds/question, used for the ± questions metric. */
  secPerQ?: number | null;
  /** paced only */
  status?: PaceStatus;
  offsetSeconds?: number;
  /** −1..+1 */
  markerPos?: number;
  answered: number;
  total: number;
  elapsed: number;
  /** Session tally of INDIVIDUAL correct-answer presses (per correct pair in
   *  Matching) — drives the BrainoutputsPM metric. Defaults to 0. */
  brainOutputs?: number;
  /** Current on/off value (legacy Switch path; unused by the new controls). */
  enabled?: boolean;
  /** @deprecated the header on/off Switch was removed 2026-07-25. */
  onToggle?: (enabled: boolean) => void;
  /** Zeroes the parent screen's elapsed + answered session counters. */
  onReset?: () => void;
  /** Whether the clock is currently ticking — drives the flip button glyph. */
  running?: boolean;
  /** Toggle the running (ticking) state; renders the START/STOP flip button. */
  onToggleRunning?: () => void;
  /** REMOVE the timer (setEnabled(false)); renders the stopwatch REMOVE button. */
  onRemove?: () => void;
  /** Current pace preset — seeds the hold-press fader. */
  preset?: PacePreset;
  /** Apply a pace preset from the hold-press fader; renders the fader button. */
  onPresetChange?: (preset: PacePreset) => void;
  /** When an official TIME TRIAL is running (or its result is on screen), the
   *  readout switches to the trial HUD instead of the normal pace readout. */
  trial?: TimeTrialSnapshot;
  /** Restart a finished trial (reuses the same topic + method). */
  onTrialRestart?: () => void;
  /** Dismiss a finished trial's result panel / exit the HUD. */
  onTrialExit?: () => void;
  /** 'full' (default) = the normal container. 'fullscreen' = a very thin,
   *  border-less strip showing ONLY elapsed + signed offset + the marker line,
   *  for mounting at the top of a study screen's full-screen mode. */
  variant?: 'full' | 'fullscreen';
  /** SILENT background tracking is on — collapse the readout to the minimal
   *  "AUTO ●" chip (normal 'full' variant only). */
  autoTrack?: boolean;
  /** Toggle auto-track; renders the AUTO button (off) / stop chip (on). */
  onToggleAutoTrack?: () => void;
}) {
  const [faderOpen, setFaderOpen] = useState(false);

  // FULLSCREEN variant — a thin, seamless, border-less strip: elapsed + signed
  // AHEAD/BEHIND offset (green/amber) + the marker line only. No status words,
  // no metrics, no buttons. Takes precedence over the trial HUD so it always
  // stays thin. Reuses the same 5s-quantized marker + grace-centered offset.
  if (variant === 'fullscreen') {
    const fsStopwatch = mode === 'stopwatch';
    const fsStatus: PaceStatus = status ?? 'onpace';
    const fsTint = fsStopwatch ? colors.cyanBright : STATUS_COLOR[fsStatus];
    const fsOffset = quantizeOffset(offsetSeconds ?? 0);
    const fsRaw = Math.max(-1, Math.min(1, markerPos ?? 0));
    const fsStep = secPerQ && secPerQ > 0 ? 5 / (secPerQ * 2) : 0;
    const fsPos =
      fsStep > 0 ? Math.max(-1, Math.min(1, Math.round(fsRaw / fsStep) * fsStep)) : fsRaw;
    const fsLeftPct = ((fsPos + 1) / 2) * 100;
    const fsRunning = running ?? true;
    return (
      <View style={styles.fsStrip}>
        <Text style={styles.fsClock}>{fmtClock(elapsed)}</Text>
        {!fsStopwatch ? (
          <>
            <Text style={[styles.fsSigned, { color: fsTint }]}>{fmtSigned(fsOffset)}</Text>
            {/* Long-press the visual line to reset the clock (user 2026-07-25). */}
            <Pressable
              style={styles.fsTrack}
              onLongPress={onReset}
              delayLongPress={500}
              accessibilityRole="button"
              accessibilityLabel="Hold to reset the pace clock"
            >
              <View style={styles.trackLine} />
              <View style={styles.centerTick} />
              <View style={[styles.marker, { left: `${fsLeftPct}%`, backgroundColor: fsTint }]} />
            </Pressable>
          </>
        ) : null}
        {/* Far-right play/pause — start/stop the clock without leaving fullscreen
            (user 2026-07-25). marginLeft:auto pins it right in stopwatch mode too. */}
        {onToggleRunning ? (
          <Pressable
            onPress={onToggleRunning}
            hitSlop={10}
            style={styles.fsPlayBtn}
            accessibilityRole="button"
            accessibilityLabel={fsRunning ? 'Pause timer' : 'Start timer'}
          >
            {fsRunning ? (
              <PauseGlyph color={colors.textSub} size={16} />
            ) : (
              <PlayGlyph color={colors.green} size={16} />
            )}
          </Pressable>
        ) : null}
      </View>
    );
  }

  // A live trial takes over the readout entirely (big countdown HUD).
  if (trial && (trial.active || trial.result)) {
    return <TrialHud trial={trial} onRestart={onTrialRestart} onExit={onTrialExit} />;
  }

  // AUTO TRACK on → collapse to a minimal, silent "AUTO ●" chip. The elapsed
  // clock + brain-output counter keep running underneath; tapping stops & saves.
  if (autoTrack) {
    return (
      <Pressable
        style={styles.autoWrap}
        onPress={onToggleAutoTrack}
        accessibilityRole="button"
        accessibilityLabel="Auto-tracking in the background. Tap to stop and save the session."
      >
        <View style={styles.autoDot} />
        <Text style={styles.autoText}>AUTO</Text>
        <Text style={styles.autoHint} numberOfLines={1}>
          Tracking silently · tap to stop &amp; save
        </Text>
      </Pressable>
    );
  }

  const isStopwatch = mode === 'stopwatch';
  const s: PaceStatus = status ?? 'onpace';
  const tint = isStopwatch ? colors.cyanBright : STATUS_COLOR[s];

  // Actual pace = answered / (elapsed in minutes). Guard divide-by-zero.
  const minutes = elapsed / 60;
  const hasRate = minutes > 0 && answered > 0;
  const qpm = hasRate ? answered / minutes : 0;
  const hz = qpm / 60; // (Questions/min) / 60
  // Compact multiplier tag ("2x" / "2x faster") parked at the track center.
  const tag = preset ? paceTag(preset) : null;
  // BrainoutputsPM = individual correct-answer presses per minute (per correct
  // pair in Matching). Sourced from the brainOutputs tally, NOT the pace count,
  // so it reflects every correct press. Guard divide-by-zero → 0 until elapsed>0.
  const bpm = minutes > 0 ? Math.round((brainOutputs ?? 0) / minutes) : 0;

  // Quantize the displayed offset to 5-second steps so it clicks UP as the
  // learner gets ahead and DOWN as they fall behind, instead of sliding
  // continuously (sign preserved by the round).
  const qOffset = quantizeOffset(offsetSeconds ?? 0);

  // ± questions = round(offset / secPerQ). Positive = ahead. (paced only)
  const plusMinusQ = secPerQ && secPerQ > 0 ? Math.round(qOffset / secPerQ) : 0;
  const pmStr = `${plusMinusQ >= 0 ? '+' : '−'}${Math.abs(plusMinusQ)} question${
    Math.abs(plusMinusQ) === 1 ? '' : 's'
  }`;

  // −1..+1 marker, STEPPED to the same 5-second granularity so the indicator
  // visibly jumps between stops rather than gliding. One 5s step spans
  // 5/(secPerQ*2) of the scale; quantizing the normalized position to that unit
  // keeps the grace-lap centering (pos 0 stays 0) while making the marker step.
  const rawPos = Math.max(-1, Math.min(1, markerPos ?? 0));
  const stepUnit = secPerQ && secPerQ > 0 ? 5 / (secPerQ * 2) : 0;
  const pos =
    stepUnit > 0 ? Math.max(-1, Math.min(1, Math.round(rawPos / stepUnit) * stepUnit)) : rawPos;
  const leftPct = ((pos + 1) / 2) * 100;
  // How many 5s steps the dot sits from center. The amber multiplier tag is
  // parked at the CENTER of the track; reveal it as soon as the dot moves ≥1 step
  // (ahead or behind) so it isn't sitting under the centered dot (user 2026-07-25).
  const stepsFromCenter = stepUnit > 0 ? Math.round(rawPos / stepUnit) : 0;
  const showTrackPace = Math.abs(stepsFromCenter) >= 1 && !!tag;

  const isRunning = running ?? true;
  const showControls = !!(
    onToggleRunning ||
    onReset ||
    onRemove ||
    onToggleAutoTrack ||
    (onPresetChange && preset)
  );
  const controls = showControls ? (
    <View style={styles.controls}>
      {/* START/STOP flip — Play when paused, Pause when running. */}
      {onToggleRunning ? (
        <Pressable
          onPress={onToggleRunning}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause pace timer' : 'Start pace timer'}
        >
          {isRunning ? <PauseGlyph color={colors.textSub} size={20} /> : <PlayGlyph color={colors.green} size={20} />}
        </Pressable>
      ) : null}
      {/* Tap to open the preset fader (user 2026-07-25 — no longer a hold). */}
      {onPresetChange && preset ? (
        <Pressable
          onPress={() => setFaderOpen(true)}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Change pace preset"
        >
          <FaderGlyph color={colors.textSub} size={20} />
        </Pressable>
      ) : null}
      {onReset ? (
        <Pressable
          onPress={onReset}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Reset pace timer"
        >
          <ResetIcon color={colors.textSub} size={19} />
        </Pressable>
      ) : null}
      {/* AUTO TRACK — silent background tracking; saves to records on stop. */}
      {onToggleAutoTrack ? (
        <Pressable
          onPress={onToggleAutoTrack}
          hitSlop={8}
          style={styles.resetBtn}
          accessibilityRole="button"
          accessibilityLabel="Auto track — silent background tracking, saves on stop"
        >
          <Text style={styles.resetText}>AUTO</Text>
        </Pressable>
      ) : null}
      {/* REMOVE the timer — same stopwatch glyph as the header button. */}
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Remove pace timer"
        >
          <TimerIcon color={colors.blue} size={22} />
        </Pressable>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={styles.wrap}>
      {/* Status word ABOVE the scale, controls on the right. */}
      <View style={styles.headerRow}>
        <Text style={[styles.statusWord, { color: tint }]} numberOfLines={1}>
          {isStopwatch ? 'STOPWATCH' : STATUS_WORD[s]}
        </Text>
        {controls}
      </View>

      {/* Animated BEHIND ◄──●──► AHEAD scale — paced only. */}
      {!isStopwatch ? (
        <View style={styles.scaleWrap}>
          <Text style={styles.scaleEnd}>BEHIND</Text>
          <View style={styles.track}>
            <View style={styles.trackLine} />
            <View style={styles.centerTick} />
            {/* Amber multiplier tag parked at track CENTER; shown once the dot is
                ≥1 step out. Large number + smaller x/faster (user 2026-07-25). */}
            {showTrackPace && tag ? (
              <View style={styles.trackLabelWrap} pointerEvents="none">
                <Text style={styles.trackPaceLabel} numberOfLines={1}>
                  <Text style={styles.trackPaceNum}>{tag.num}</Text>
                  {tag.suffix}
                </Text>
              </View>
            ) : null}
            <View style={[styles.marker, { left: `${leftPct}%`, backgroundColor: tint }]} />
          </View>
          <Text style={styles.scaleEnd}>AHEAD</Text>
        </View>
      ) : null}

      {/* Two-row clock block + pace metrics. */}
      <View style={styles.metricsRow}>
        <View style={styles.clockCol}>
          <Text style={styles.clockBig}>{fmtClock(elapsed)}</Text>
          {isStopwatch ? (
            <Text style={styles.clockCaption}>ELAPSED</Text>
          ) : (
            <Text style={[styles.clockSigned, { color: tint }]}>{fmtSigned(qOffset)}</Text>
          )}
        </View>

        <View style={styles.metricsCol}>
          <View style={styles.metricsLabelRow}>
            {/* Questions/min readout pulled UP next to CURRENT PACE (user
                2026-07-25). answered/total stays a right-aligned count chip. */}
            <Text style={styles.metricsLabel} numberOfLines={1}>
              CURRENT PACE{'  '}
              <Text style={styles.metricNum}>{hasRate ? qpm.toFixed(1) : '—'}</Text>
              <Text style={styles.metricUnit}> Questions/min</Text>
            </Text>
            <Text style={styles.answeredCount}>{answered}/{total}</Text>
          </View>
          <Text style={styles.metricMeta} numberOfLines={1}>
            {isStopwatch ? '' : `${pmStr} · `}
            {hz.toFixed(3)} Hz · {bpm} BrainoutputsPM
          </Text>
        </View>
      </View>

      {/* Hold-press preset fader popup. */}
      {onPresetChange && preset ? (
        <PresetFader
          visible={faderOpen}
          preset={preset}
          onChange={onPresetChange}
          onClose={() => setFaderOpen(false)}
        />
      ) : null}
    </View>
  );
}

/**
 * TrialHud — the TIME TRIAL takeover: a big 15:00→0:00 countdown, the live
 * CORRECT count, current average pace vs target, an AHEAD/ON TRACK/BEHIND marker
 * on the same scale as the normal readout, and a PROJECTED pass/short hint.
 * At 0:00 it swaps to a friendly PASS / "keep at it" result with a restart.
 */
function TrialHud({
  trial,
  onRestart,
  onExit,
}: {
  trial: TimeTrialSnapshot;
  onRestart?: () => void;
  onExit?: () => void;
}) {
  const tint = STATUS_COLOR[trial.status];
  const pos = Math.max(-1, Math.min(1, trial.markerPos));
  const leftPct = ((pos + 1) / 2) * 100;

  // ---- Result panel (fired at 0:00) ----
  if (trial.result) {
    const passed = trial.result.passed;
    const resTint = passed ? colors.green : colors.orange;
    return (
      <View style={[styles.wrap, styles.trialWrap, { borderColor: passed ? 'rgba(55,224,95,.5)' : 'rgba(255,138,30,.45)' }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.trialTitle, { color: resTint }]} numberOfLines={1}>
            TIME TRIAL · {passed ? 'CLEARED' : 'RESULT'}
          </Text>
          {onExit ? (
            <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close time trial">
              <Text style={styles.trialExit}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.resultWord, { color: resTint }]}>
          {passed ? 'PASS' : 'NOT THIS TIME'}
        </Text>
        <Text style={styles.resultBody}>
          {passed
            ? `You held quiz pace — ${trial.result.correctCount} correct in 15:00. This study method is cleared toward unlocking the quiz.`
            : `${trial.result.correctCount} correct in 15:00 — just short of quiz pace. No penalty. Keep at it and run it again.`}
        </Text>

        {onRestart ? (
          <Pressable
            style={[styles.trialBtn, { borderColor: resTint }]}
            onPress={onRestart}
            accessibilityRole="button"
            accessibilityLabel="Restart 15-minute time trial"
          >
            <Text style={[styles.trialBtnText, { color: resTint }]}>RUN IT AGAIN</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // ---- Live HUD (countdown running) ----
  const projStr = trial.projectedPass ? 'PASS' : 'short';
  const projColor = trial.projectedPass ? colors.green : colors.orange;
  return (
    <View style={[styles.wrap, styles.trialWrap, { borderColor: 'rgba(47,155,255,.35)' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.trialTitle, { color: colors.cyanBright }]} numberOfLines={1}>
          TIME TRIAL
        </Text>
        <Text style={[styles.trialStatus, { color: tint }]} numberOfLines={1}>
          {TRIAL_STATUS_WORD[trial.status]}
        </Text>
        {onExit ? (
          <Pressable onPress={onExit} hitSlop={8} accessibilityRole="button" accessibilityLabel="End time trial">
            <Text style={styles.trialExit}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Big countdown. */}
      <Text style={styles.countdown} accessibilityLabel={`Time remaining ${fmtClock(trial.remainingSeconds)}`}>
        {fmtClock(trial.remainingSeconds)}
      </Text>

      {/* BEHIND ◄──●──► AHEAD scale vs target (same visual language). */}
      <View style={styles.scaleWrap}>
        <Text style={styles.scaleEnd}>BEHIND</Text>
        <View style={styles.track}>
          <View style={styles.trackLine} />
          <View style={styles.centerTick} />
          <View style={[styles.marker, { left: `${leftPct}%`, backgroundColor: tint }]} />
        </View>
        <Text style={styles.scaleEnd}>AHEAD</Text>
      </View>

      {/* Correct count + average vs target + projection. */}
      <View style={styles.metricsRow}>
        <View style={styles.clockCol}>
          <Text style={[styles.clockBig, { color: tint }]}>{trial.correctCount}</Text>
          <Text style={styles.clockCaption}>CORRECT</Text>
        </View>
        <View style={styles.metricsCol}>
          <Text style={styles.metricsLabel}>AVG PACE · TARGET {trial.targetPace.toFixed(1)}</Text>
          <Text style={styles.metricLine} numberOfLines={1}>
            <Text style={[styles.metricNum, { color: tint }]}>{trial.averagePace.toFixed(1)}</Text> / {trial.targetPace.toFixed(1)} Q/min
          </Text>
          <Text style={styles.metricMeta} numberOfLines={1}>
            PROJECTED: <Text style={{ color: projColor }}>{projStr}</Text> · {trial.needed} to clear
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    backgroundColor: '#0e0e10',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusWord: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // WIDE-AND-SHORT control buttons (2026-07-25) — elongated horizontally and
  // trimmed in height so the control row is shorter, keeping the container thin
  // while staying comfortably tappable.
  iconBtn: {
    width: 48,
    height: 30,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 6,
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 6,
    backgroundColor: '#1b1b1b',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  resetText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.textSub },

  // ---- AUTO TRACK collapsed chip (silent background tracking) ----
  // Compact, border-consistent with the container; a live dot + tap-to-stop.
  autoWrap: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.35)',
    backgroundColor: '#0e0e10',
  },
  autoDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.green },
  autoText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.green },
  autoHint: { flex: 1, fontFamily: fonts.barlowCondensedMedium, fontSize: 12, color: colors.textMuted },

  // ---- FULLSCREEN thin strip (variant='fullscreen') ----
  // Transparent, border-less, no dividers — blends seamlessly into the
  // full-screen view beneath it. paddingRight clears the top-right ✕ close btn.
  fsStrip: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
    paddingLeft: 14,
    paddingRight: 44,
    backgroundColor: 'transparent',
  },
  fsClock: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },
  fsSigned: { fontFamily: fonts.mono, fontSize: 13 },
  fsTrack: { flex: 1, height: 12, justifyContent: 'center' },
  fsPlayBtn: { marginLeft: 'auto', paddingHorizontal: 4, paddingVertical: 2 },

  // BEHIND ◄──●──► AHEAD scale.
  scaleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scaleEnd: { fontFamily: fonts.barlowCondensedMedium, fontSize: 10, letterSpacing: 0.6, color: colors.textMuted },
  track: { flex: 1, height: 14, justifyContent: 'center' },
  trackLine: { height: 2, borderRadius: 1, backgroundColor: colors.hairlineAlt },
  centerTick: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: colors.hairline,
  },
  marker: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5, // center the dot on its left%
  },

  // Clock + metrics — tightened vertically (2026-07-25) so the container reads
  // compact rather than spaced out.
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clockCol: { minWidth: 62 },
  clockBig: { fontFamily: fonts.mono, fontSize: 19, color: colors.textPrimary, lineHeight: 20 },
  clockSigned: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 14 },
  clockCaption: { fontFamily: fonts.barlowCondensedMedium, fontSize: 10, letterSpacing: 1, color: colors.textMuted },
  metricsCol: { flex: 1 },
  // "CURRENT PACE" label + the answered/total count chip pushed to the right.
  metricsLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricsLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.amberLabel },
  // Amber pace-setting label parked at the CENTER of the track (shown only when
  // the dot is ≥3 steps out, so it never sits behind the dot).
  trackLabelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -5, // extra vertical room so the larger number isn't clipped
    bottom: -5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // lineHeight set explicitly so the nested 14px number gets a tall-enough line
  // box (was cropping the bottom of the digit).
  trackPaceLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: colors.amberDeep,
  },
  // The multiplier number — larger than the "x"/"faster" text beside it, but
  // not full body size.
  trackPaceNum: { fontSize: 14, color: colors.amberDeep },
  answeredCount: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.amberLabel,
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,180,0,.10)',
    overflow: 'hidden',
  },
  metricLine: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12, color: colors.textSubAlt },
  metricNum: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },
  metricUnit: { fontFamily: fonts.barlowCondensedMedium, fontSize: 10, color: colors.textSubAlt },
  metricMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted },

  // ---- TIME TRIAL HUD ----
  trialWrap: { borderWidth: 1.5, gap: 8 },
  trialTitle: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  trialStatus: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  trialExit: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textMuted, paddingHorizontal: 4 },
  countdown: {
    fontFamily: fonts.mono,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  resultWord: {
    fontFamily: fonts.oswaldBold,
    fontSize: 26,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 2,
  },
  resultBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSub,
    textAlign: 'center',
  },
  trialBtn: {
    marginTop: 2,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  trialBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
});
