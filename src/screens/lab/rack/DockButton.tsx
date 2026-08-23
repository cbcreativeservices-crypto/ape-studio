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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';

export function DockButton({
  label,
  value,
  glyph,
  selected,
  variant = 'value',
  led,
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
  onPress: () => void;
  onLongPress?: () => void;
  /** Full accessibility sentence, e.g. "ROOM WIDTH: 8.4 m. Tap to adjust." */
  a11y: string;
}) {
  const isKey = variant === 'key';
  return (
    <Pressable
      style={[styles.btn, isKey && styles.key, !isKey && selected && styles.btnSel]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected || !!led }}
      accessibilityLabel={a11y}
    >
      {isKey ? (
        <View style={styles.keyRow}>
          {led != null ? <View style={[styles.ledDot, led && styles.ledDotOn]} /> : null}
          <Text style={styles.label} numberOfLines={1}>
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
