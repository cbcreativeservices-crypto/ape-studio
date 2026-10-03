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
import { MEMBERSHIP_NOT_CONFIRMED, tierOf } from '../../features/commercial/tier';
import { notify } from '../../lib/confirm';
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
  const { isMember, resolved, tierKnown, entitlement } = useEntitlement();
  // KNOWN, NOT MERELY RESOLVED (hunt 4, 2026-10-03). `resolved` also flips
  // when the read FAILED, and a member with no remembered tier then reads
  // 'anonymous' — so the library, LEARN and DEMO showed "🔒 Academy membership
  // required · SEE MEMBERSHIP" to a paying member (the provider's own contract
  // for a failed read: "never an upsell, never a 🔒"). Same `known` as
  // useSaveGate below; until then the member-favouring state above holds.
  const tier = tierOf(entitlement, resolved);
  const known = tierKnown || tier === 'free' || tier === 'member';
  return known && !isMember;
}

/** SAVE gate (owner ruling 2026-09-01): saving a measurement is an Academy
 *  perk, because the Saved Measurements library is. Free and anonymous users
 *  used to get a cheerful "SAVED ✓" for a record they could never open — and a
 *  guest's records are wiped on the next launch, so the tick was doubly untrue.
 *  The SAVE control now greys with a 🔒 and routes to membership instead.
 *
 *  `label('SAVE LOG')` prefixes the lock when locked; `prompt()` opens the
 *  standard membership dialog; `locked` drives the greyed style. */
export function useSaveGate(): {
  locked: boolean;
  checking: boolean;
  unconfirmed: boolean;
  label: (base: string) => string;
  prompt: () => void;
} {
  const { isMember, resolved, tierKnown, tierReadFailed, entitlement } = useEntitlement();
  /**
   * SAVE WAITS FOR THE TIER (final round A, 2026-10-02). This was
   * useToolsLocked() — `resolved && !isMember` — which is UNLOCKED before the
   * first read lands, so a free user's SAVE in that window wrote a record they
   * can never open. And a member whose read FAILED (no remembered tier) read
   * 'anonymous' and got the 🔒 and the membership gate.
   *
   * Known = a read produced the tier this session, or the provider restored
   * this account's last server-confirmed tier. Until then a non-member's SAVE
   * reads "CHECKING…" and does nothing (`locked` is true so every call site's
   * existing `if (saveGate.locked)` branch stops the save; `prompt` is a no-op
   * while checking). A remembered member saves straight away, as before.
   */
  const tier = tierOf(entitlement, resolved);
  const known = tierKnown || tier === 'free' || tier === 'member';
  /**
   * THE CHECK GAVE UP (owner ruling 2026-10-03: "once it fails — it should
   * know and stop checking"). The provider spent its retries without a tier,
   * so this is no longer "CHECKING…" — that label would wait forever. SAVE
   * reads plainly (no 🔒: that would tell a member they are free), still does
   * not save (`locked`), and a tap says why.
   */
  const unconfirmed = !isMember && !known && tierReadFailed;
  const checking = !isMember && !known && !tierReadFailed;
  const locked = !isMember; // includes `checking` and `unconfirmed`
  return {
    locked,
    checking,
    unconfirmed,
    label: (base: string) => (checking ? 'CHECKING…' : unconfirmed ? base : locked ? `🔒 ${base}` : base),
    // App-themed popup, not the native Alert (owner 2026-09-10) — one styled
    // MembershipGateHost at the App root serves every gate.
    prompt: () => {
      if (checking) return;
      if (unconfirmed) {
        notify(
          'Membership not confirmed',
          'Couldn’t confirm your membership on this phone. Check your connection and reopen the app.',
        );
        return;
      }
      openMembershipGate({
        body: 'Saved measurements live in your Academy library — membership keeps them, with their settings, calibration status and notes.',
      });
    },
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

/** The members-only DESTINATIONS (LEARN, DEMO, concept modules, the Saved
 *  Measurements library) while the gate is neither 'open' nor 'locked' (hunt 5,
 *  2026-10-03). useToolsLocked above is LOCK-COPY only: it is false while the
 *  tier is unknown, so the destinations that gated their CONTENT on it opened
 *  the members-only training to anyone whose membership read failed — a free
 *  account offline with no remembered tier read every tutorial. Nothing
 *  unlocks on a failed read (tier sweep 2026-10-03): 'checking' is neutral
 *  (blank, never a 🔒), 'unconfirmed' says so plainly — TubeCardScreen's
 *  four states. Callers render the content only for gate === 'open'. */
export function ToolGatePending({ gate }: { gate: 'checking' | 'unconfirmed' }) {
  // A quiet line, never an empty body (tidy hunt 5, 2026-10-03): the caller
  // keeps its header + back; the body says what it is waiting on.
  if (gate === 'checking') return <Text style={styles.note}>Checking your account…</Text>;
  return (
    <View style={styles.pendingCard}>
      <Text style={styles.pendingEyebrow}>MEMBERSHIP NOT CONFIRMED</Text>
      <Text style={styles.note}>{MEMBERSHIP_NOT_CONFIRMED}</Text>
    </View>
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
  pendingCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    padding: 16,
    gap: 8,
  },
  pendingEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.textSub },
});
