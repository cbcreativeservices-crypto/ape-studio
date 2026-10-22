/**
 * UpgradeSheet — the upgrade surface (CM2, Booth 2026-07-11). Shown when a
 * non-academy user taps academy-locked content (Audio Tools card, locked
 * course cards, etc.). Copy is VERBATIM from src/lib/copy.ts (§2) — do not
 * reword. This is NOT the paywall (CM7): no products, no purchase wiring —
 * an upgrade message + auth affordances.
 */
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '../../components/GlassButton';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';

export function UpgradeSheet({
  visible,
  onClose,
  onSignIn,
  onCreateAccount,
  onSeePlans,
  onMemberOpen,
}: {
  visible: boolean;
  onClose: () => void;
  /**
   * The person is a member NOW (toddler hunt #32, 2026-10-14): the sheet stops
   * selling and shows "You're a member — open the lab" with one button that
   * calls this (and so does a tap on the backdrop). Used by LabPreviewOverlay
   * when membership lands while the sheet is up over a lab preview.
   */
  onMemberOpen?: () => void;
  /** Present on pre-auth surfaces (Landing); omit where the user is signed in. */
  onSignIn?: () => void;
  onCreateAccount?: () => void;
  /** Present on post-auth surfaces → the paywall (CM7). */
  onSeePlans?: () => void;
}) {
  // NOT NOW sat under Android's three-button bar (live toddler pass 2026-10-13):
  // a tap there hit HOME. The sheet is pinned to bottom:0, so add the inset.
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  if (onMemberOpen) {
    // No membership copy to a member (house rule): the member face only.
    return (
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable style={{ flex: 1 }} onPress={onMemberOpen} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: 28 + insets.bottom }]}>
          <Text style={styles.eyebrow}>{COPY.membershipEyebrow}</Text>
          <Text style={styles.title} accessibilityLiveRegion="polite">
            {COPY.labPreviewMemberTitle}
          </Text>
          <GlassButton
            label={COPY.labPreviewMemberButton}
            tint="gold"
            height={50}
            fontSize={14}
            onPress={onMemberOpen}
          />
        </View>
      </View>
    );
  }
  return (
    // accessibilityViewIsModal keeps VoiceOver inside the sheet (pass 5, W1):
    // this backdrop is a plain sibling, so without it VoiceOver walks straight
    // past the sheet into the screen the sheet is covering.
    <View style={styles.backdrop} accessibilityViewIsModal>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <View style={[styles.sheet, { paddingBottom: 28 + insets.bottom }]}>
        {/* One name everywhere (owner H5, 2026-10-22): this sheet leads to the
            plans, so it speaks the paywall's words — not the retired upgradePhrase
            mode names, which the buyer never met anywhere else. */}
        <Text style={styles.eyebrow}>{COPY.membershipEyebrow}</Text>
        <Text style={styles.title}>{COPY.membershipTitle}</Text>
        {/* The allowance runs INLINE at the end of the first paragraph — the
            one that calls the glossary free (owner, governance R7).

            It was a separate muted BLOCK first. That read correctly but cost a
            margin above, a margin below and its own two lines, pushing the plan
            cards further below the fold — on a PURCHASE screen, where the owner
            called it out: "too much vertical spacing … requiring more
            scrolling". Tuning the ratio between those margins was optimising a
            local detail while making the screen worse globally.

            Nested inside the paragraph it keeps the muted colour that marks it
            as a qualifier rather than a sales line, is as tight to the claim as
            text can be, and costs only the line it wraps onto. The ratified
            string is still split at its own '\n\n' and `bodyNext` is back to
            exactly the blank line that break used to draw. */}
        {COPY.upgradeSheetBody.split('\n\n').map((para, i) => (
          <Text key={i} style={[styles.body, i > 0 && styles.bodyNext]}>
            {para}
            {i === 0 ? (
              <Text style={styles.allowance}>
                {' ' + COPY.glossaryFreeAllowance + ' ' + COPY.calcFreeAllowance}
              </Text>
            ) : null}
          </Text>
        ))}

        {/* The $99 lifetime deal is NOT surfaced here as its own pre-popup
            (user request 2026-07-17). All plans — with the end-of-year
            introductory deadline — live together on the plans screen. */}

        {onSeePlans && (
          <GlassButton label={COPY.seeMembershipPlans} tint="gold" height={50} fontSize={14} onPress={onSeePlans} />
        )}

        {(onSignIn || onCreateAccount) && (
          <View style={styles.actions}>
            {onCreateAccount && (
              <View style={{ flex: 1 }}>
                <GlassButton label="CREATE ACCOUNT" tint="gold" height={48} fontSize={14} onPress={onCreateAccount} />
              </View>
            )}
            {onSignIn && (
              <View style={{ flex: 1 }}>
                <GlassButton label="SIGN IN" tint="steel" height={48} fontSize={14} onPress={onSignIn} />
              </View>
            )}
          </View>
        )}

        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Not now">
          <Text style={styles.dismiss}>NOT NOW</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 19, lineHeight: 24, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  allowance: { color: colors.textMuted },
  // 6 above against the paragraph break's 2x below: proximity is what says
  // this line belongs to the CLAIM, not to the paragraph after it (owner, seen
  // on the Pixel — at 10 it read as floating between the two). The break below
  // stays exactly one lineHeight, so the ratified paragraph rhythm is untouched.
  // Reinstates the blank line the single <Text> drew for '\n\n' (= one lineHeight).
  bodyNext: { marginTop: 21 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  dismiss: {
    alignSelf: 'center',
    marginTop: 8,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.textSub,
  },
});
