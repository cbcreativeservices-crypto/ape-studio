/**
 * The "?" on My Enrollments Dashboard (owner 2026-10-15): a small centred
 * popup menu (popups, never pulldowns) with two choices —
 *   • "How Your Learning Is Organized" → the first-visit intro again
 *   • "Help with this screen" → the Help hub, filtered to enrolment answers
 *     (what the plain HelpKey did before).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Modal, useAfterModalsClose } from '../../components/DimModal';
import { IntroSheet } from '../../features/intro/ScreenIntroOverlay';

import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { useModalHandoff } from '../../lib/confirm';
import { colors, fonts } from '../../theme/tokens';

export function EnrollmentHelpMenu() {
  const navigation = useNavigation<any>();
  const afterClose = useAfterModalsClose();
  // Opening a SCREEN from inside a popup goes through the house handoff (P5).
  const handoff = useModalHandoff();
  const [menu, setMenu] = useState(false);
  const [intro, setIntro] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setMenu(true)}
        hitSlop={10}
        style={({ pressed }) => [styles.key, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Help for this screen"
      >
        <Text style={styles.glyph}>?</Text>
      </Pressable>

      <Modal
        visible={menu}
        transparent
        animationType="fade"
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => setMenu(false)}
      >
        {/* The scrim is not an accessibility element (the keys inside must be
            reachable on iOS); CLOSE and the escape gesture close it. */}
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)} accessible={false} onAccessibilityEscape={() => setMenu(false)}>
          <Pressable style={styles.card} onPress={() => {}} accessible={false}>
            <Text style={styles.tag}>HELP</Text>
            <Pressable
              style={styles.item}
              onPress={() => {
                setMenu(false);
                afterClose(() => setIntro(true));
              }}
              accessibilityRole="button"
            >
              <Text style={styles.itemText}>How Your Learning Is Organized</Text>
            </Pressable>
            <Pressable
              style={styles.item}
              onPress={() => {
                setMenu(false);
                // Same call the plain HelpKey makes (pop: true keeps one Help).
                handoff(() => navigation.navigate('Help', { search: 'enroll' }, { pop: true }));
              }}
              accessibilityRole="button"
            >
              <Text style={styles.itemText}>Help with this screen</Text>
            </Pressable>
            <Pressable style={styles.close} onPress={() => setMenu(false)} accessibilityRole="button">
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {intro ? <IntroSheet introKey="enrollments" onDismiss={() => setIntro(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  // Same key as HelpKey (amber ring), so the header looks unchanged.
  key: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#2a2210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, lineHeight: 15, color: colors.amber },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 18,
    gap: 10,
  },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: '#b98a20' },
  item: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#1a1814' },
  itemText: { fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.textPrimary },
  close: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.textSub },
});
