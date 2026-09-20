/**
 * withMembershipPreview — the members-only Training-Lab gate, at the SCREEN.
 *
 * The Ear Lab landing arms the free-user preview (startLabPreview) before it
 * navigates to a locked lab, so a row tap is gated. But a lab screen can also
 * be reached WITHOUT passing that landing:
 *   • a custom-scheme deep link — `proaudio://labs/compression` — which React
 *     Navigation resolves straight to the screen via linking.config, and
 *   • a pendingLink resume after sign-in (navigateToPath in Auth / Paywall).
 * Both bypass the Ear Lab entirely, so before this the lab opened LIVE for a
 * non-member (navigation/notifications bug hunt 2026-09-14, finding E1).
 *
 * This wrapper closes every one of those routes in one place: wrapped ONCE in
 * RootNavigator's gated registry, it arms the SAME preview the Ear Lab uses the
 * moment a resolved non-member lands on a members-only lab. The root
 * LabPreviewOverlay then draws the grayed UpgradeSheet over the live lab, the
 * AudioOutputGate stays muted, and labCompletion refuses credit — identical to a
 * locked row tap. Members (and anyone before entitlement resolves) see the lab
 * untouched, so a paying member never gets a paywall (the "gate once, at the
 * door" rule — the deep link IS a door a non-member can cross).
 *
 * Cold-boot flash: a deep link can mount the lab BEFORE the first server
 * entitlement read resolves. Mounting the live lab in that window would flash
 * the paid content (and start its engine/mic) at a non-member for a beat. So —
 * exactly like withAmplitudeOrientation's hydration beat — a members-only route
 * renders NOTHING until entitlement is known, and a resolved non-member renders
 * nothing until the preview is actually armed, so the lab only ever mounts
 * behind the scrim.
 *
 * The membership decision is read from labCatalog (isMemberOnlyLabRoute), the
 * one source of truth the Ear Lab's row locks also use, so the list and the gate
 * can never disagree. A route that is not members-only no-ops, so this is safe
 * to compose over any lab screen.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { useEntitlement } from '../commercial/EntitlementProvider';
import { isMemberOnlyLabRoute, labRouteName } from '../../screens/lab/labCatalog';
import { endLabPreview, getLabPreview, startLabPreview, useLabPreview } from './labPreviewStore';

/**
 * The hold shown before the lab may mount.
 *
 * ── IT USED TO BE AN EMPTY VIEW, AND THAT WAS A TRAP (2026-09-17) ─────────
 *
 * "Sub-second beat" is the happy path. The condition is `!resolved`, the
 * entitlement read has no timeout of its own, and these routes are registered
 * with `gestureEnabled: false` and no header — so on a connection that accepts
 * the request and never answers, a blank screen with no text, no spinner and no
 * way back was the whole app until a force-quit. It hits PAYING MEMBERS, whose
 * read is exactly as likely to hang, and it is reachable on ~40 routes.
 *
 * So: say what is happening, and after a few seconds offer the way out. Nothing
 * about the gate's caution changes — the lab still never mounts in this window;
 * the user simply stops being trapped in it.
 */
function GateHold({ onBack }: { onBack?: () => void }) {
  // Only after a beat, so the ordinary sub-second hold stays clean.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // W16 (2026-09-18): `accessibilityLiveRegion` is Android-only. On iOS a
  // VoiceOver user sat on a spinner with no spoken reason and no idea a GO
  // BACK had appeared. Announced only once the wait turns slow — the ordinary
  // sub-second hold should stay silent, exactly as it stays visually quiet.
  useEffect(() => {
    if (!slow || Platform.OS !== 'ios') return;
    AccessibilityInfo.announceForAccessibility(
      'Still checking your membership. A go back button is available.',
    );
  }, [slow]);

  return (
    <View style={styles.hold}>
      <ActivityIndicator color={colors.textSub} />
      <Text style={styles.holdText} accessibilityLiveRegion="polite">
        {slow ? 'Still checking your membership…' : 'Checking your membership…'}
      </Text>
      {slow && onBack ? (
        <Pressable onPress={onBack} style={styles.holdBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.holdBtnText}>GO BACK</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hold: { flex: 1, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  holdText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, textAlign: 'center' },
  holdBtn: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 9, paddingVertical: 11, paddingHorizontal: 22 },
  holdBtnText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8 },
});

export function withMembershipPreview<P extends object>(
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  function Guarded(props: P) {
    const route = useRoute();
    const navigation = useNavigation();
    // Real academy standing; `resolved` false until the first server read lands.
    const { isMember, resolved } = useEntitlement();
    const memberOnly = isMemberOnlyLabRoute(route.name);
    // A resolved non-member on a members-only route is the one case we gate.
    const gated = memberOnly && resolved && !isMember;
    const preview = useLabPreview();
    const armedForThis = preview.active && preview.route === route.name;
    /**
     * ⛔ ARM ONLY WHILE THIS SCREEN IS ON TOP.
     *
     * React Navigation keeps the previous screen MOUNTED across a push (there
     * is no freezeOnBlur anywhere in this repo), so a gated lab that is pushed
     * over is still alive and still subscribed to the preview store. The root
     * safety net in App.tsx clears the preview the moment the top route stops
     * being the previewed one — correct for a pop, but after a PUSH it fed
     * straight back into the effect below, which re-armed instantly. The
     * UpgradeSheet is a plain root sibling, not a native modal, so the scrim
     * and the upgrade card then drew over the UNRELATED screen on top, every
     * further navigation repeated it, and NOT NOW popped the innocent screen
     * instead of the lab. Recovery was a force-quit.
     *
     * Focus breaks the loop at the source: a blurred lab does not re-arm, and
     * the safety net's clear stays cleared. Coming back to the lab focuses it
     * and arms it again, which is the behaviour that was intended all along.
     */
    const focused = useIsFocused();

    useEffect(() => {
      if (gated) {
        // Arm the preview if it isn't already (the Ear Lab arms it BEFORE
        // navigating, so a row tap arrives armed — don't re-arm and flicker).
        if (focused && !armedForThis) startLabPreview(route.name, labRouteName(route.name) ?? 'This lab');
        return;
      }
      // Entitled (or unknown, or not a members-only route): clear only a stale
      // preview WE would own for this route — e.g. entitlement upgraded while
      // the lab is open. The LabPreviewOverlay owns the ordinary leave.
      if (memberOnly && armedForThis) endLabPreview();
    }, [gated, memberOnly, armedForThis, focused, route.name]);

    // Unknown beat: hold rather than flash the paid lab (or a paywall at a
    // member). Non-member: hold until the scrim is actually up, so the lab
    // mounts behind it, never in front of it.
    const goBack = () => {
      if (navigation.canGoBack()) navigation.goBack();
    };
    if (memberOnly && !resolved) return <GateHold onBack={goBack} />;
    // Unarmed AND focused means the arm has not landed yet — hold. Unarmed
    // while BLURRED is the pushed-over case above: nothing is visible, and the
    // hold is what the user comes back to right before the arm re-fires.
    if (gated && !armedForThis) return <GateHold onBack={focused ? goBack : undefined} />;

    // ── A SCRIM STOPS FINGERS, NOT A SCREEN READER ────────────────────
    //
    // The free-user preview draws `UpgradeSheet` over the live lab and relies on
    // that overlay to stop interaction. It does, for touch. It does NOT for
    // assistive technology (2026-09-17, bug-hunt pass 5):
    //
    //   Android — TalkBack's ACTION_CLICK goes through
    //   ReactAccessibilityDelegate.performAccessibilityAction →
    //   View.performClick() → the Pressable's onPress. That path NEVER HIT-TESTS,
    //   so the scrim is simply irrelevant to it: a free user with TalkBack on
    //   could read AND operate the whole paid lab.
    //
    //   iOS — accessibilityActivate synthesises a tap at the element's
    //   activation point, which the scrim does intercept; but the lab was still
    //   fully READABLE through it.
    //
    // Hiding the subtree from the accessibility tree fixes both, and it is the
    // correct thing regardless: a lab you are not allowed to use should not be
    // something a screen reader walks you through. The scrim itself stays
    // visible and focusable, so the upgrade path is still reachable.
    if (gated) {
      return (
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Screen {...props} />
        </View>
      );
    }

    return <Screen {...props} />;
  }
  Guarded.displayName = `WithMembershipPreview(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Guarded;
}
