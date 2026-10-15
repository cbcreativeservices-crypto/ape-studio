/**
 * LabPreviewOverlay — root overlay for a free-user Training-Lab preview (owner
 * 2026-08-02). Mounted beside the navigator; when a preview is active it renders
 * the shared UpgradeSheet OVER the live lab. UpgradeSheet is already a
 * full-screen grayed backdrop that intercepts every touch + shows the Academy
 * upgrade popup at the bottom — so the lab keeps running (readouts, animations,
 * mic) behind it, visible but grayed and non-interactive.
 *
 * Exits pop the lab off the stack so a free user never lands back on a live,
 * interactive members-only lab.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { UpgradeSheet } from '../commercial/UpgradeSheet';
import { useEntitlement } from '../commercial/EntitlementProvider';
import { navigationRef, rootBack } from '../../navigation/navigationRef';
import { safeGoBack } from '../../lib/safeGoBack';
import { beginLabPreviewLeave, coverLabPreview, endLabPreview, getLabPreview, useLabPreview } from './labPreviewStore';

function FreeLookBar({ onCover, onClose, bottomInset }: { onCover: () => void; onClose: () => void; bottomInset: number }) {
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable
        style={{ flex: 1 }}
        onPress={onCover}
        accessibilityRole="button"
        accessibilityLabel="This lab is for members. Shows how to unlock it."
      />
      <View style={[styles.bar, { paddingBottom: 12 + bottomInset }]}>
        <Text style={styles.eyebrow}>FREE LOOK · MEMBERS-ONLY LAB</Text>
        <Text style={styles.body}>This is the lab as members see it. Tap anywhere to see how to unlock it.</Text>
        <View style={styles.row}>
          <Pressable onPress={onClose} style={styles.btn} accessibilityRole="button" accessibilityLabel="Close the free look">
            <Text style={styles.btnText}>CLOSE</Text>
          </Pressable>
          <Pressable onPress={onCover} style={[styles.btn, styles.btnMain]} accessibilityRole="button" accessibilityLabel="How to unlock this lab">
            <Text style={[styles.btnText, { color: colors.amber }]}>HOW TO UNLOCK</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(12,12,12,0.94)',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  eyebrow: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  body: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnMain: { borderColor: `${colors.amber}88` },
  btnText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8 },
});

/**
 * Show the member face? (toddler hunt #32, owner 2026-10-14.) Only when the
 * person BECAME a member (false → true) while a preview was up and not being
 * left. Pure, so the rule is testable without mounting the overlay.
 */
export function becameMemberDuringPreview(
  wasMember: boolean,
  isMember: boolean,
  preview: { active: boolean; leaving: boolean },
): boolean {
  return !wasMember && isMember && preview.active && !preview.leaving;
}

export function LabPreviewOverlay() {
  const { active, covered, leaving, route } = useLabPreview();
  const insets = useSafeAreaInsets();
  const { isMember } = useEntitlement();

  /**
   * BECAME A MEMBER WHILE THE SHEET WAS UP (toddler hunt #32, owner
   * 2026-10-14). The sheet kept selling membership to somebody who had just
   * become a member (a purchase that completed in the background, a restore,
   * a code). Now its content swaps to "You're a member — open the lab", and
   * its one button closes the SHEET ONLY — the lab stays open, now unlocked
   * (withMembershipPreview stops gating it the moment the gate opens). Held
   * here, not in the preview store, because that gate ends the preview in the
   * same moment. Cleared by the button, by any navigation away from that lab,
   * and if membership goes again.
   */
  const [memberRoute, setMemberRoute] = useState<string | null>(null);
  const wasMember = useRef(isMember);
  useEffect(() => {
    const was = wasMember.current;
    wasMember.current = isMember;
    if (!isMember) {
      setMemberRoute(null);
      return;
    }
    if (becameMemberDuringPreview(was, isMember, { active, leaving })) setMemberRoute(route);
    // Only a change in standing decides this; the preview values are read as
    // they were rendered alongside it (the gate ends the preview in the same
    // commit, so a later read would already say "not active").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);
  useEffect(() => {
    if (memberRoute === null) return;
    const unsub = navigationRef.addListener('state', () => {
      if (navigationRef.getCurrentRoute()?.name !== memberRoute) setMemberRoute(null);
    });
    return unsub;
  }, [memberRoute]);
  const openLabAsMember = () => {
    setMemberRoute(null);
    endLabPreview(); // idempotent; the lab underneath is left exactly where it is
  };

  // ONE pending clear (final round C, 2026-10-03): an uncancelled 350 ms
  // endLabPreview from a previous leave could land on — and end — a NEWER
  // preview opened inside that window. Re-arming clears the old one; so does
  // unmount.
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armEnd = () => {
    if (endTimer.current) clearTimeout(endTimer.current);
    endTimer.current = setTimeout(() => {
      endTimer.current = null;
      // Only the preview being LEFT: a newer one (startLabPreview resets
      // `leaving`) opened inside the window keeps its scrim.
      if (getLabPreview().leaving) endLabPreview();
    }, 350);
  };
  useEffect(() => () => {
    if (endTimer.current) clearTimeout(endTimer.current);
    endTimer.current = null;
  }, []);

  // Leave the previewed lab back to the list. The scrim must stay up THROUGH the
  // stack-pop animation: clearing it at/before goBack() reveals the live
  // (ungrayed) lab for a beat as it slides out (user report 2026-08-12). The
  // overlay is a root sibling above the navigator, so keeping it visible covers
  // the whole transition; clear it once the pop has settled.
  const leaveLab = () => {
    beginLabPreviewLeave(); // hold the scrim through the pop; safety net stands down
    // ⛔ ONLY CLEAR IF THE POP ACTUALLY HAPPENED. If there is nothing to go back
    //    to, dropping the scrim 350 ms later would leave a free user sitting on
    //    a live, fully interactive members-only lab. Leaving the scrim up keeps
    //    the gate closed; the sheet is still there to exit by.
    // ONE pop per tap burst (P9b, 2026-10-02): the sheet stays up through the
    // pop, so a double tap on Close popped the lab AND the list under it.
    if (safeGoBack(rootBack)) armEnd();
  };

  if (memberRoute !== null) {
    return <UpgradeSheet visible onClose={openLabAsMember} onMemberOpen={openLabAsMember} />;
  }

  // FREE LOOK (toddler hunt 2026-10-14 #31g): the lab shows uncovered; a clear
  // catcher still takes every touch (the lab is not operable), and the sheet
  // rises only when the learner taps the lab or HOW TO UNLOCK.
  if (active && !covered) {
    return <FreeLookBar onCover={coverLabPreview} onClose={leaveLab} bottomInset={insets.bottom} />;
  }

  return (
    <UpgradeSheet
      visible={active}
      onClose={leaveLab}
      onSeePlans={() => {
        // Pop the previewed lab, then push the Paywall over the top.
        //
        // ⛔ THE SAME HOLD AS leaveLab, FOR THE SAME REASON. This used to clear
        //    the preview immediately, on the assumption that "the Paywall hides
        //    the lab, so there's nothing to flash" — but the push is ANIMATED,
        //    and clearing before it lands drops the scrim off the live lab for
        //    the length of the transition. beginLabPreviewLeave() stands the
        //    safety net down so the scrim can cover both moves.
        beginLabPreviewLeave();
        safeGoBack(rootBack);
        if (navigationRef.isReady()) navigationRef.navigate('Paywall');
        armEnd();
      }}
    />
  );
}
