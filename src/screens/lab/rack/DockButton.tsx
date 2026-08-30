/**
 * DockButton — one channel-strip key in the Rack Unit dock. SplMeter's
 * ctrlBarBtn anatomy (flex:1, r10, #26262c border, #131316 face, label over
 * mono amber value — SplMeterScreen ctrlBar, owner standard 2026-08-18) with
 * fonts raised to the app floor: Oswald 12 label / mono 14 value (the tools'
 * 9.5 is legacy, not precedent — judge-panel ruling).
 *
 * Two verbs, visually distinct (judge-panel coherence rule):
 *   ▪  fader param — tap BINDS the shared lane
 *   ▸  options/group param — tap OPENS a tray
 * Toggles render as ON/OFF keys; actions as plain keys. Long-press = the
 * param's guided lesson (v4 §5), wired via RackUnit.
 */
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '../../../theme/tokens';
import { hapticsEnabled } from '../../../features/settings/store';

export function DockButton({
  label,
  value,
  glyph,
  selected,
  variant = 'value',
  led,
  frameTint,
  onPress,
  onLongPress,
  a11y,
}: {
  label: string;
  /** Current value (mono amber). Key-variant buttons pass ''. */
  value: string;
  /** '▪' bind-lane · '▸' open-tray · undefined for key-variant buttons. */
  glyph?: '▪' | '▸';
  selected?: boolean;
  /** 'value' = the value-button (fader/tray keys). 'key' = the DISTINCT flat
   *  skin for toggles/actions — amber-selected stays reserved for bound/open
   *  (the two-verb rule; judge-panel coherence ruling). */
  variant?: 'value' | 'key';
  /** Key-variant toggles: LED dot state (green = on). */
  led?: boolean;
  /** Identity-colour frame (owner 2026-08-23): a fader key whose param has an
   *  identity tint (e.g. the Harmonograph's per-arm colours) wears it on the
   *  border. Bound/open stays amber — the two-verb rule outranks identity. */
  frameTint?: string;
  onPress: () => void;
  onLongPress?: () => void;
  /** Full accessibility sentence, e.g. "ROOM WIDTH: 8.4 m. Tap to adjust." */
  a11y: string;
}) {
  const isKey = variant === 'key';
  // Toggles and actions share the flat KEY skin; only a toggle carries an LED.
  // A toggle already acknowledges itself by flipping that LED, so the flash is
  // reserved for actions, whose only effect happens elsewhere on screen.
  const isAction = isKey && led == null;

  /**
   * ACTION CONFIRMATION (owner 2026-08-30: "replay button stays gray — no
   * action / animation / haptic or anything - thats bad design").
   *
   * Dock buttons had NO pressed state and NO haptic, so every key in every lab
   * looked identical before, during and after a tap. That is worst for an
   * ACTION: a toggle at least flips its LED, but REPLAY's only effect is
   * out on the glass, so the key itself has to acknowledge the press. It
   * flashes amber for a moment — long enough to see, short enough not to be
   * mistaken for a selected state.
   */
  const [fired, setFired] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePress = useCallback(() => {
    if (hapticsEnabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAction) {
      setFired(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFired(false), 220);
    }
    onPress();
  }, [isAction, onPress]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        isKey && styles.key,
        // frameTint applies to KEY buttons as well (a green REPLAY border) —
        // it used to be value-buttons only.
        !selected && frameTint ? { borderColor: frameTint + (isKey ? 'aa' : '88') } : null,
        !isKey && selected && styles.btnSel,
        // Every key now answers the finger.
        pressed && styles.btnPressed,
        fired && styles.btnFired,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected || !!led }}
      accessibilityLabel={a11y}
    >
      {isKey ? (
        <View style={styles.keyRow}>
          {led != null ? <View style={[styles.ledDot, led && styles.ledDotOn]} /> : null}
          <Text style={[styles.label, fired && styles.labelSel]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.label, selected && styles.labelSel]} numberOfLines={1}>
            {label}
            {glyph ? <Text style={[styles.glyph, selected && styles.labelSel]}> {glyph}</Text> : null}
          </Text>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  // Selected = bound/open — the PopupOpt selected treatment, so labs and tools
  // light up identically.
  btnSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  /** Held down — a small, immediate lift so the key never feels dead. */
  btnPressed: { backgroundColor: '#23232a', borderColor: '#3a3a44' },
  /** An action just ran — a brief amber acknowledgement. */
  btnFired: { borderColor: 'rgba(255,198,77,.85)', backgroundColor: '#241a06' },
  // Toggles/actions: the flat KEY skin — no value slot, no amber-selected.
  key: { backgroundColor: '#17171c', borderColor: '#2c2c33' },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ledDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#33333c' },
  ledDotOn: { backgroundColor: colors.green },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.textSub },
  labelSel: { color: colors.amber },
  // The verb glyph is load-bearing (▪ binds, ▸ opens) — MIN_FONT 12, never 9.
  glyph: { fontSize: 12, color: colors.textSub },
  value: { fontFamily: fonts.mono, fontSize: 14, color: colors.amber },
});
