/**
 * HoldToActivate — a deliberate press-and-HOLD confirm (owner request
 * 2026-07-25), modeled on features/settings/DeleteAccountButton.tsx: an
 * animated progress fill over HOLD_MS plus a live countdown; completing the
 * full hold fires onComplete(), releasing early cancels and resets.
 *
 * Reusable — used both by the Profile "turn on audio output" row and inside the
 * audio-output gate popup. Label + tint are configurable; the default green
 * tint reads as "enable / go" (house success hue).
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

const HOLD_MS = 5000;

export function HoldToActivate({
  label,
  holdingLabel = 'KEEP HOLDING',
  onComplete,
  tint = colors.green,
  disabled = false,
  holdMs = HOLD_MS,
  bg = '#0f1a12',
  compact = false,
}: {
  /** Resting label, e.g. "HOLD 5s TO ENABLE AUDIO OUTPUT". */
  label: string;
  /** Prefix shown while holding; the live countdown is appended (" · 5"). */
  holdingLabel?: string;
  onComplete: () => void;
  /** Accent colour for the fill + label (default house green). */
  tint?: string;
  disabled?: boolean;
  /** How long the hold must last. Default 5 s — the audio-output gate's. */
  holdMs?: number;
  /** Resting background. Default is the green-tinted dark the gate uses; pass
   *  a neutral one for a non-green tint. */
  bg?: string;
  /** Tighter padding + smaller type, for a button sharing a row. */
  compact?: boolean;
}) {
  const holdSecs = Math.max(1, Math.round(holdMs / 1000));
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);
  const [secs, setSecs] = useState(holdSecs);
  /** True while a hold was started by an assistive-technology ACTIVATE rather
   *  than a finger — a stray onPressOut must not cancel it (bug hunt 2026-09-29). */
  const a11yHold = useRef(false);

  const clearTick = () => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  };

  // Stop everything on unmount (popup dismissed mid-hold, row recycled).
  useEffect(() => () => {
    anim.current?.stop();
    clearTick();
  }, []);

  const reset = () => {
    a11yHold.current = false;
    anim.current?.stop();
    clearTick();
    setHolding(false);
    setSecs(holdSecs);
    Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  };

  const start = () => {
    if (disabled) return;
    // A second start over a live hold (a screen-reader ACTIVATE, then a finger
    // press-in) overwrote `tick` without clearing it: the orphan interval ran
    // forever and, on reaching 0, cleared the NEW countdown (bug hunt 2026-09-30).
    anim.current?.stop();
    clearTick();
    setHolding(true);
    setSecs(holdSecs);
    progress.setValue(0);
    let left = holdSecs;
    tick.current = setInterval(() => {
      left -= 1;
      setSecs(Math.max(0, left));
      if (left <= 0) clearTick();
    }, 1000);
    anim.current = Animated.timing(progress, { toValue: 1, duration: holdMs, useNativeDriver: false });
    anim.current.start(({ finished }) => {
      clearTick();
      setHolding(false);
      Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
      const viaA11y = a11yHold.current;
      a11yHold.current = false;
      if (finished) {
        if (viaA11y) AccessibilityInfo.announceForAccessibility(`${label}. Done.`);
        onComplete();
      }
    });
  };

  /**
   * ⛔ A HOLD NOBODY CAN PERFORM (bug hunt 2026-09-29). The button listened only
   * to onPressIn/onPressOut — a finger held down. TalkBack, VoiceOver, Switch
   * Access and Voice Access deliver a single ACTIVATE, not a held touch, so for
   * those users the gate's one way to turn sound on could never complete.
   *
   * ACTIVATE now runs the same timed hold on their behalf, announced at start
   * and finish so the wait is not silent; ACTIVATE again during the countdown
   * cancels. The deliberate five seconds are kept — only the finger is not
   * required.
   */
  const onAccessibilityAction = (e: { nativeEvent: { actionName: string } }) => {
    if (e.nativeEvent.actionName !== 'activate' || disabled) return;
    if (holding) {
      reset();
      AccessibilityInfo.announceForAccessibility('Cancelled.');
      return;
    }
    start();
    a11yHold.current = true;
    AccessibilityInfo.announceForAccessibility(
      `Holding for ${holdSecs} seconds. Activate again to cancel.`,
    );
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={() => {
        if (!a11yHold.current) reset();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Press and hold for ${holdSecs} seconds.`}
      accessibilityHint={`Or activate once to start a ${holdSecs}-second timed hold.`}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onAccessibilityAction}
      style={[
        styles.btn,
        compact && styles.btnCompact,
        { borderColor: hexAlpha(tint, 0.6), backgroundColor: bg },
        disabled && styles.btnDisabled,
      ]}
    >
      <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: hexAlpha(tint, 0.26) }]} />
      <Text style={[styles.label, compact && styles.labelCompact, { color: tint }]}>
        {holding ? `${holdingLabel} · ${secs}` : label}
      </Text>
    </Pressable>
  );
}

/** Apply an alpha to a #rrggbb token (the theme tokens are all 6-digit hex). */
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  btn: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 13,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCompact: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
  btnDisabled: { opacity: 0.5 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, textAlign: 'center' },
  labelCompact: { fontSize: 10.5 },
});
