/**
 * UpgradeSheet — the upgrade surface (CM2, Booth 2026-07-11). Shown when a
 * non-academy user taps academy-locked content (Audio Tools card, locked
 * course cards, etc.). Copy is VERBATIM from src/lib/copy.ts (§2) — do not
 * reword. This is NOT the paywall (CM7): no products, no purchase wiring —
 * an upgrade message + auth affordances.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/GlassButton';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';

export function UpgradeSheet({
  visible,
  onClose,
  onSignIn,
  onCreateAccount,
  onSeePlans,
}: {
  visible: boolean;
  onClose: () => void;
  /** Present on pre-auth surfaces (Landing); omit where the user is signed in. */
  onSignIn?: () => void;
  onCreateAccount?: () => void;
  /** Present on post-auth surfaces → the paywall (CM7). */
  onSeePlans?: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.backdrop}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <Text style={styles.eyebrow}>ACADEMY MODE</Text>
        <Text style={styles.title}>{COPY.upgradePhrase}</Text>
        <Text style={styles.body}>{COPY.marketingLine}</Text>

        {/* The $99 lifetime deal is NOT surfaced here as its own pre-popup
            (user request 2026-07-17). All plans — with the end-of-year
            introductory deadline — live together on the plans screen. */}

        {onSeePlans && (
          <GlassButton label="SEE PLANS" tint="gold" height={50} fontSize={14} onPress={onSeePlans} />
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
