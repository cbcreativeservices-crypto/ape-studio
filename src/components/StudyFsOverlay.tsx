/**
 * StudyFsOverlay — full-screen distraction-free mode for the interactive study
 * methods (Fill-in-the-Blank, Matching) (Booth 2026-07-11). Shows the question
 * only — no nav, no prev/next, no progress bar — with a top-right ✕. Shake goes
 * back a question. A short instruction guide shows the FIRST TWO times full
 * screen is opened, then never again.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts } from '../theme/tokens';
import { LowLightDim } from '../features/settings/LowLightLayer';
import { FullscreenIcon } from './FullscreenIcon';
import { useShake } from '../lib/useShake';

export function StudyFsOverlay({
  visible,
  onClose,
  onShakePrev,
  onSwipePrev,
  onSwipeNext,
  guideKey,
  topSlot,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onShakePrev: () => void;
  /** Swipe ‹ › anywhere on the full screen (user feedback 2026-07-17: the
   *  swipe strip stays on the normal screen, so full screen had NO swipe at
   *  all). Loose thresholds — a short flick is enough. */
  onSwipePrev?: () => void;
  onSwipeNext?: () => void;
  /** AsyncStorage key holding how many times the guide has shown (max 2). */
  guideKey: string;
  /** Optional thin content pinned to the VERY TOP (e.g. the fullscreen pace
   *  strip). Renders above the centered body, border-less. */
  topSlot?: ReactNode;
  children: ReactNode;
}) {
  const [showGuide, setShowGuide] = useState(false);
  const guideCount = useRef(0);
  const wasVisible = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(guideKey).then((v) => {
      if (v) guideCount.current = Number(v) || 0;
    });
  }, [guideKey]);

  useEffect(() => {
    if (visible && !wasVisible.current && guideCount.current < 2) {
      setShowGuide(true);
      guideCount.current += 1;
      void AsyncStorage.setItem(guideKey, String(guideCount.current));
    }
    if (!visible) setShowGuide(false);
    wasVisible.current = visible;
  }, [visible, guideKey]);

  useShake(onShakePrev, visible);

  // Whole-screen swipe ‹ › (user feedback 2026-07-17). Callbacks live in a ref
  // so the once-created responder always calls the latest closures. Short
  // distance OR a quick flick triggers — full screen should feel immediate.
  const swipeRef = useRef({ onSwipePrev, onSwipeNext });
  swipeRef.current = { onSwipePrev, onSwipeNext };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -30 || (g.dx < -12 && g.vx <= -0.3)) swipeRef.current.onSwipeNext?.();
        else if (g.dx >= 30 || (g.dx > 12 && g.vx >= 0.3)) swipeRef.current.onSwipePrev?.();
      },
    }),
  ).current;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.root} {...pan.panHandlers}>
        <Pressable style={styles.close} onPress={onClose} hitSlop={16} accessibilityRole="button" accessibilityLabel="Close full screen">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        {topSlot ? <View style={styles.topSlot}>{topSlot}</View> : null}
        <View style={styles.body}>{children}</View>
        {showGuide ? (
          <View style={styles.guideBackdrop}>
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>FULL SCREEN</Text>
              <Text style={styles.guideLine}>Answer as usual — tap your choice</Text>
              <Text style={styles.guideLine}>Swipe or Next to advance</Text>
              <Text style={styles.guideLine}>Shake to go back a question</Text>
              <Text style={styles.guideLine}>Tap ✕ (top-right) to exit</Text>
              <Pressable style={styles.guideBtn} onPress={() => setShowGuide(false)}>
                <Text style={styles.guideBtnText}>GOT IT</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
      <LowLightDim />
    </Modal>
  );
}

/** Full-screen button for the LED row — same green glyph as flashcards (user
 *  request 2026-07-25). */
export function FsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.fsBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel="Full screen">
      <FullscreenIcon color={colors.green} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0b' },
  // Very top, above the centered body. paddingTop clears the status bar; no
  // border/background so it blends seamlessly into the view below.
  topSlot: { paddingTop: 40 },
  close: { position: 'absolute', top: 44, right: 16, zIndex: 2, padding: 8 },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 24, color: '#c8c8c8' },
  body: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40 },
  fsBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#141414',
  },
  fsBtnIcon: { fontSize: 18, color: '#7fbfff' },
  guideBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  guideCard: { backgroundColor: '#16171a', borderRadius: 14, borderWidth: 1, borderColor: '#2c2d31', padding: 22, gap: 8, width: '100%', maxWidth: 340 },
  guideTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amber, marginBottom: 4 },
  guideLine: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  guideBtn: { marginTop: 12, backgroundColor: '#1d1607', borderWidth: 1, borderColor: 'rgba(255,180,0,.5)', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  guideBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
});
