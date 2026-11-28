/**
 * PrivacyNotice — the privacy popup (owner 2026-11-20) [MD:D72]. Words:
 * GUEST_PRIVACY_NOTICE / ACCOUNT_PRIVACY_NOTICE in screenIntros.ts. Same card
 * as the intro sheets.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { Modal, rootModalHoldMs } from '../../components/DimModal';
import { useLatchedPress } from '../../lib/latch';
import { colors, fonts } from '../../theme/tokens';
import { ACCOUNT_PRIVACY_NOTICE, GUEST_PRIVACY_NOTICE } from './screenIntros';

/**
 * The privacy notice (owner 2026-11-20) [MD:D72]: the GUEST version on every
 * guest sign-in, the ACCOUNT version once per account. The main menu decides
 * WHETHER it is due (`wanted`: owed, the right tier, focused, not Low-Light)
 * and holds the intro video until it is answered. Loaded on demand by the
 * menu (start graph cap, perfStartTrim).
 *
 * Like FoundationsAutoPopup it waits for the host's `hold` and then for a
 * closing Modal's fade (rootModalHoldMs): never beside another root Modal,
 * never during a dismiss. Once up, it stays. The scrim does not close it;
 * GOT IT (latched) and Android BACK do.
 */
export function PrivacyNotice({
  variant,
  wanted,
  hold = false,
  onGotIt,
}: {
  variant: 'guest' | 'account';
  wanted: boolean;
  hold?: boolean;
  onGotIt: () => void;
}) {
  const gotIt = useLatchedPress(onGotIt);
  const presentedRef = useRef(false);
  if (!wanted) presentedRef.current = false;
  const holdMs = wanted && !hold && !presentedRef.current ? rootModalHoldMs() : 0;
  const [, setHoldTick] = useState(0);
  useEffect(() => {
    if (holdMs <= 0) return undefined;
    const t = setTimeout(() => setHoldTick((n) => n + 1), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);
  const show = wanted && (presentedRef.current || (!hold && holdMs <= 0));
  if (show) presentedRef.current = true;
  if (!show) return null;
  const copy = variant === 'guest' ? GUEST_PRIVACY_NOTICE : ACCOUNT_PRIVACY_NOTICE;
  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={gotIt}
    >
      <View style={styles.backdrop} accessible={false} onAccessibilityEscape={gotIt}>
        <View style={styles.card}>
          <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator>
            <Text style={styles.title} accessibilityRole="header">
              {copy.title}
            </Text>
            <View style={styles.rule} />
            {copy.paragraphs.map((p, i) => (
              <Text key={i} style={styles.body}>
                {p}
              </Text>
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.introBtn, pressed && styles.introBtnPressed]}
            onPress={gotIt}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={copy.button}
          >
            <Text style={styles.introBtnText}>{copy.button.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 20,
    gap: 10,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1 },
  body: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  introBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.7)',
    backgroundColor: '#241d08',
  },
  introBtnPressed: { backgroundColor: '#3a2f0c' },
  introBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: colors.amber },
});
