/**
 * ToolLockUi — shared "Academy membership required" lock visuals for the audio
 * tools (owner 2026-08-05). Free accounts keep OPEN TOOL free, but the training
 * layer (LEARN / DEMO / concept modules), the Saved Measurements library, and
 * the Frequency Counter's Light Pulse mode are Academy-only: shown grayed with a
 * 🔒 lock and an "Academy membership required" note. Tapping a locked control
 * routes to the Paywall (the app's standard 🔒 idiom).
 *
 * Gating is by ENTITLEMENT (`entitlement === 'academy'`), never caps — matching
 * the AudioLearning / EarLab training gate, so the dev academy-bypass on caps
 * doesn't hide these while the owner tests the free experience.
 */
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export const MEMBERSHIP_REQUIRED = 'Academy membership required';

/** True when the current entitlement may NOT use the Academy tool extras. */
export function useToolsLocked(entitlement: string): boolean {
  return entitlement !== 'academy';
}

/** A grayed, locked stand-in for a tool button. Looks disabled (steel/lock) but
 *  is tappable so it can route to the Paywall — matching the app's other 🔒
 *  academy controls. */
export function LockedButton({
  label,
  onPress,
  height = 46,
  fontSize = 14,
  style,
}: {
  label: string;
  onPress: () => void;
  height?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.locked, { height }, style]}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${MEMBERSHIP_REQUIRED}`}
    >
      <Text style={[styles.lockedText, { fontSize }]} numberOfLines={1}>
        🔒 {label}
      </Text>
    </Pressable>
  );
}

/** One-line "🔒 Academy membership required…" caption under a locked control. */
export function MembershipRequiredNote({ what, style }: { what?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Text style={[styles.note, style]}>
      🔒 {MEMBERSHIP_REQUIRED}
      {what ? ` to ${what}` : ''}.
    </Text>
  );
}

const styles = StyleSheet.create({
  locked: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  lockedText: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 1.2, color: colors.textSub },
  note: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
