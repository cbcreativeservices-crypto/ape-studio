/**
 * PaceTimerBar — thin math wrapper around the redesigned PaceReadout container.
 * Computes the paced math from the current preset (stopwatch just passes the
 * count-up through) and forwards the on/off + reset handlers. The old gear /
 * settings button was removed (2026-07-25): settings now open only from the
 * StudyHeader stopwatch button. `onOpenSettings` is retained on the prop type
 * for backward compatibility with callers that still pass it, but is unused.
 *
 * TIME TRIAL (2026-07-25): the bar also subscribes to the method's time-trial
 * snapshot. When a trial is live the PaceReadout takes over with the trial HUD;
 * otherwise the normal pace readout renders exactly as before.
 */
import { useCallback, useRef } from 'react';
import { PaceReadout } from './PaceReadout';
import { recordPaceSession } from './paceRecords';
import {
  paceMath,
  SEC_PER_Q,
  setAutoTrack,
  setRunning,
  useAutoTrack,
  useBrainOutputs,
  type PaceMethodKey,
  type PacePreset,
} from './paceStore';
import { dismissTimeTrial, restartTimeTrial, useTimeTrial } from './timeTrial';

export function PaceTimerBar({
  method,
  preset,
  answered,
  total,
  elapsed,
  enabled,
  onToggle,
  onReset,
  running,
  onToggleRunning,
  onRemove,
  onPresetChange,
  variant,
}: {
  /** The study method — drives the time-trial subscription. */
  method: PaceMethodKey;
  preset: PacePreset;
  answered: number;
  total: number;
  elapsed: number;
  /** @deprecated settings now open from the StudyHeader stopwatch button. */
  onOpenSettings?: () => void;
  enabled?: boolean;
  /** @deprecated the header on/off Switch was removed 2026-07-25. */
  onToggle?: (enabled: boolean) => void;
  onReset?: () => void;
  /** Whether the clock is ticking — drives the flip button glyph. */
  running?: boolean;
  /** Toggle the running (ticking) state. */
  onToggleRunning?: () => void;
  /** REMOVE the timer (setEnabled(false)). */
  onRemove?: () => void;
  /** Apply a pace preset from the hold-press fader. */
  onPresetChange?: (preset: PacePreset) => void;
  /** 'fullscreen' renders the thin, border-less top strip; omit for the normal
   *  container. */
  variant?: 'full' | 'fullscreen';
}) {
  const secPerQ = SEC_PER_Q[preset];
  const isStopwatch = secPerQ == null;

  const trial = useTimeTrial(method);
  const brainOutputs = useBrainOutputs(method);
  const autoTrack = useAutoTrack(method);
  // Pace advances on CORRECT answers only (user 2026-07-25): a wrong answer must
  // NOT gain you time — the clock just keeps running, so you fall behind. The
  // brain-output tally (correct outputs this session) drives the ahead/behind
  // math; `answered` stays the topic-progress count for the readout's chip.
  const math = isStopwatch ? null : paceMath({ secPerQ, answered: brainOutputs, total, elapsed });

  // Keep the live elapsed + brain-output values reachable from the toggle
  // callback without re-creating it every tick.
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const brainRef = useRef(brainOutputs);
  brainRef.current = brainOutputs;
  // Dedupe guard so one AUTO TRACK stop records at most once.
  const recordedRef = useRef(false);

  // AUTO TRACK toggle. ON: ensure the clock is ticking (running=true) and arm
  // recording. OFF (the deliberate stop): log the session ONCE — elapsed +
  // correct-output tally — skipping trivially short / empty sessions.
  const onToggleAutoTrack = useCallback(() => {
    if (autoTrack) {
      setAutoTrack(method, false);
      const secs = elapsedRef.current;
      const outs = brainRef.current;
      if (!recordedRef.current && secs >= 2 && outs > 0) {
        recordedRef.current = true;
        void recordPaceSession(method, secs, outs);
      }
    } else {
      recordedRef.current = false; // arm for the next stop
      setRunning(method, true); // don't let a paused clock stall tracking
      setAutoTrack(method, true);
    }
  }, [autoTrack, method]);

  return (
    <PaceReadout
      mode={isStopwatch ? 'stopwatch' : 'paced'}
      secPerQ={secPerQ}
      status={math?.status}
      offsetSeconds={math?.offsetSeconds}
      markerPos={math?.markerPos}
      answered={answered}
      total={total}
      elapsed={elapsed}
      brainOutputs={brainOutputs}
      enabled={enabled}
      onToggle={onToggle}
      onReset={onReset}
      running={running}
      onToggleRunning={onToggleRunning}
      onRemove={onRemove}
      preset={preset}
      onPresetChange={onPresetChange}
      trial={trial}
      onTrialRestart={() => restartTimeTrial(method)}
      onTrialExit={() => dismissTimeTrial(method)}
      variant={variant}
      autoTrack={autoTrack}
      onToggleAutoTrack={onToggleAutoTrack}
    />
  );
}
