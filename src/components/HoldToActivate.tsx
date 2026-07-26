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
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

const HOLD_MS = 5000;
const HOLD_SECS = 5;

export function HoldToActivate({
  label,
  holdingLabel = 'KEEP HOLDING',
  onComplete,
  tint = colors.green,
  disabled = false,
}: {
  /** Resting label, e.g. "HOLD 5s TO ENABLE AUDIO OUTPUT". */
  label: string;
  /** Prefix shown while holding; the live countdown is appended (" · 5"). */
  holdingLabel?: string;
  onComplete: () => void;
  /** Accent colour for the fill + label (default house green). */
  tint?: string;
  disabled?: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [holding, setHolding] = useState(false);
  const [secs, setSecs] = useState(HOLD_SECS);

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
    anim.current?.stop();
    clearTick();
    setHolding(false);
    setSecs(HOLD_SECS);
    Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  };

  const start = () => {
    if (disabled) return;
    setHolding(true);
    setSecs(HOLD_SECS);
    progress.setValue(0);
    let left = HOLD_SECS;
    tick.current = setInterval(() => {
      left -= 1;
      setSecs(Math.max(0, left));
      if (left <= 0) clearTick();
    }, 1000);
    anim.current = Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false });
    anim.current.start(({ finished }) => {
      clearTick();
      setHolding(false);
      Animated.timing(progress, { toValue: 0, duration: 140, useNativeDriver: false }).start();
      if (finished) onComplete();
    });
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={reset}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Press and hold for five seconds.`}
      style={[styles.btn, { borderColor: hexAlpha(tint, 0.6) }, disabled && styles.btnDisabled]}
    >
      <Animated.View style={[styles.fill, { width: fillWidth, backgroundColor: hexAlpha(tint, 0.26) }]} />
      <Text style={[styles.label, { color: tint }]}>
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
    backgroundColor: '#0f1a12',
  },
  btnDisabled: { opacity: 0.5 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, textAlign: 'center' },
});
