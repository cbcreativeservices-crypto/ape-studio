/**
 * ToolLockUi — shared "Academy membership required" lock visuals for the audio
 * tools (owner 2026-08-05). Free accounts keep OPEN TOOL free, but the training
 * layer (LEARN / DEMO / concept modules), the Saved Measurements library, and
 * the Frequency Counter's Light Pulse mode are Academy-only: shown grayed with a
 * 🔒 lock and an "Academy membership required" note. Tapping a locked control
 * routes to the Paywall (the app's standard 🔒 idiom).
 *
 * Gating is by REAL academy standing (the provider's `isMember`), never caps —
 * matching the AudioLearning / EarLab training gate, so the dev academy-bypass on
 * caps doesn't hide these while the owner tests the free experience. `isMember`
 * is the single source for this idiom (see EntitlementProvider).
 */
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { openMembershipGate } from '../../features/commercial/MembershipGate';
import { colors, fonts } from '../../theme/tokens';

export const MEMBERSHIP_REQUIRED = 'Academy membership required';

/** True when the current user may NOT use the Academy tool extras.
 *
 *  Gates on `resolved` (entitlement gate roll-out 2026-09-11): the provider
 *  boots at 'anonymous' and only learns the real tier once the server read
 *  lands, so without this every tool screen first-painted its LOCKED state —
 *  "🔒 SAVE LOG", greyed LEARN/DEMO — at a paying member, and a tap inside that
 *  window popped the membership gate for a membership they already hold. One
 *  central fix: every consumer of useToolsLocked / useSaveGate /
 *  useFullScreenGate now holds the member-favouring (unlocked) state until the
 *  tier is known. */
export function useToolsLocked(): boolean {
  const { isMember, resolved } = useEntitlement();
  return resolved && !isMember;
}

/** SAVE gate (owner ruling 2026-09-01): saving a measurement is an Academy
 *  perk, because the Saved Measurements library is. Free and anonymous users
 *  used to get a cheerful "SAVED ✓" for a record they could never open — and a
 *  guest's records are wiped on the next launch, so the tick was doubly untrue.
 *  The SAVE control now greys with a 🔒 and routes to membership instead.
 *
 *  `label('SAVE LOG')` prefixes the lock when locked; `prompt()` opens the
 *  standard membership dialog; `locked` drives the greyed style. */
export function useSaveGate(): { locked: boolean; label: (base: string) => string; prompt: () => void } {
  const locked = useToolsLocked();
  return {
    locked,
    label: (base: string) => (locked ? `🔒 ${base}` : base),
    // App-themed popup, not the native Alert (owner 2026-09-10) — one styled
    // MembershipGateHost at the App root serves every gate.
    prompt: () =>
      openMembershipGate({
        body: 'Saved measurements live in your Academy library — membership keeps them, with their settings, calibration status and notes.',
      }),
  };
}

/** FULL-SCREEN gate — NOW OPEN TO EVERYONE (owner 2026-09-13: "Make the full
 *  screens and custom color options available to all user free, account,
 *  member"). This REVERSES the 2026-09-10 ruling that made the immersive views
 *  (Full VU, Full Gauge, fullscreen waveform, the CenterLock tuner/counter
 *  stage) Academy-only.
 *
 *  The hook is kept rather than deleted, and every call site still reads
 *  `fs.gate(() => ...)`. That is deliberate: the three tool screens keep one
 *  shared place where this policy lives, so if it is ever re-gated it changes
 *  here once instead of in three screens. `locked` is now always false, so the
 *  call sites' locked styling simply never applies.
 *
 *  ⚠️ This is the FULL-SCREEN policy only. Saved Measurements (useSaveGate) and
 *  the LEARN/DEMO training layer are separate gates and remain Academy-only —
 *  do not "tidy" them to match this one. */
export function useFullScreenGate(): { locked: boolean; gate: (proceed: () => void) => void } {
  return { locked: false, gate: (proceed: () => void) => proceed() };
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
