/**
 * Topic Foundations popup (D47, owner GO 2026-11-03).
 *
 * A short scrollable lesson read before a topic's flashcards. Two buttons:
 *  - LATER — closes. Flashcards stay usable; it shows again the next time the
 *    topic's flashcards open.
 *  - I'VE READ THIS — closes and marks it read for this learner and topic
 *    (createLocalStore; the button waits for the write result). It then no
 *    longer pops up on Flashcards.
 * Opened again from the Study Dashboard's TOPIC FOUNDATIONS row, an already-
 * read lesson shows a single CLOSE (there is nothing left to mark).
 *
 * Flashcards are NEVER locked by it, and a topic with no Foundations text —
 * or a server that does not have the column yet — shows nothing at all.
 *
 * Two parts:
 *  - FoundationsSheet: the Modal itself, presented by whoever owns it.
 *  - FoundationsAutoPopup: the Flashcards self-presenting popup. It waits for
 *    the screen's other first-visit surfaces (the T1 intro, then the topic
 *    Welcome) through `hold`, then for the closing Modal's fade
 *    (rootModalHoldMs) — never beside another root Modal, never during a
 *    dismiss — exactly as TopicWelcomeSheet waits for the T1 intro.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Modal, rootModalHoldMs } from '../../components/DimModal';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { useLatchedPress } from '../../lib/latch';
import { colors, fonts } from '../../theme/tokens';
import { loadFoundations } from './foundationsSource';
import { foundationsAutoDue, type FoundationsLesson } from './foundationsText';
import { useFoundationsRead } from './useFoundationsRead';

export const FOUNDATIONS_KICKER = 'TOPIC FOUNDATIONS';
export const FOUNDATIONS_SUB = 'Start here before studying the terms';

export function FoundationsSheet({
  lesson,
  alreadyRead,
  onLater,
  onRead,
}: {
  lesson: FoundationsLesson;
  /** Read before this opening: one CLOSE button instead of the two. */
  alreadyRead: boolean;
  onLater: () => void;
  /** Mark read, then close. Latched: a double tap is one write. */
  onRead: () => Promise<unknown>;
}) {
  const pressRead = useLatchedPress(onRead);
  return (
    <Modal
      supportedOrientations={ALL_ORIENTATIONS}
      accessibilityViewIsModal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onLater}
    >
      {/* The scrim does not close it: a stray tap beside a lesson someone is
          reading must not throw it away. LATER, I'VE READ THIS, Android BACK
          and the screen-reader escape gesture close it. */}
      <View style={styles.scrim} accessible={false} onAccessibilityEscape={onLater}>
        <View style={styles.card}>
          <Text style={styles.kicker}>{FOUNDATIONS_KICKER}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {lesson.title}
          </Text>
          <Text style={styles.sub}>{FOUNDATIONS_SUB}</Text>
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyPad} showsVerticalScrollIndicator>
            {lesson.paragraphs.map((p, i) => (
              <Text key={i} style={[styles.para, i > 0 && styles.paraGap]}>
                {p}
              </Text>
            ))}
          </ScrollView>
          {alreadyRead ? (
            <View style={styles.btnRow}>
              <Pressable
                onPress={onLater}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              >
                <Text style={[styles.btnText, styles.btnTextPrimary]}>CLOSE</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Pressable
                onPress={onLater}
                accessibilityRole="button"
                accessibilityLabel="Later. Close the lesson and read it another time"
                style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
              >
                <Text style={[styles.btnText, styles.btnTextSecondary]}>LATER</Text>
              </Pressable>
              <Pressable
                onPress={pressRead}
                accessibilityRole="button"
                accessibilityLabel="I have read this. Close the lesson and mark it read"
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              >
                <Text style={[styles.btnText, styles.btnTextPrimary]}>I'VE READ THIS</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * The Flashcards popup: on every open of the topic's flashcards until the
 * learner taps I'VE READ THIS. Never while the read state is unknown, never in
 * Low-Light mode (deferred, not lost — nothing is written), only while the
 * screen is focused, and only after the `hold` lets go.
 */
export function FoundationsAutoPopup({
  achievementId,
  enabled = true,
  hold = false,
  onOwedChange,
}: {
  achievementId: string;
  enabled?: boolean;
  /** Another first-visit popup is up or still to come (the T1 intro, the
   *  topic Welcome) or one of the screen's own Modals is open. DEFERS. */
  hold?: boolean;
  /** Told whether the popup is still OWED this visit (its lookups have not
   *  answered, or it is due and not closed) so the screen's own timed popups
   *  (the 45 s tutorial, the guest reminder) wait for it. */
  onOwedChange?: (owed: boolean) => void;
}) {
  const on = enabled && !!achievementId;
  const [lesson, setLesson] = useState<FoundationsLesson | null>(null);
  const [looked, setLooked] = useState(false);
  const [closed, setClosed] = useState(false);
  const focused = useIsFocused();
  const suppressed = useOverlaysSuppressed();
  const rs = useFoundationsRead(on ? achievementId : '');

  useEffect(() => {
    if (!on) {
      setLooked(true);
      return undefined;
    }
    let alive = true;
    setLooked(false);
    void loadFoundations(achievementId)
      .then((l) => {
        if (alive) setLesson(l);
      })
      // Answered on EVERY exit, so a host waiting on onOwedChange never waits forever.
      .finally(() => {
        if (alive) setLooked(true);
      });
    return () => {
      alive = false;
    };
  }, [on, achievementId]);

  const due = foundationsAutoDue({ hasLesson: !!lesson, readKnown: rs.known, read: rs.read, closedThisVisit: closed });
  const owed = on && (!looked || (!!lesson && !rs.settled) || due);
  const onOwedRef = useRef(onOwedChange);
  onOwedRef.current = onOwedChange;
  useEffect(() => {
    onOwedRef.current?.(owed);
  }, [owed]);

  const later = useCallback(() => setClosed(true), []);
  const markRead = rs.markRead;
  // Closes on the write RESULT, whichever way: a refused write is told by the
  // shared save-failure notice, and the lesson simply comes back next time
  // (the mark was taken back). FoundationsSheet latches the button
  // (useLatchedPress), so a double tap is one write.
  const read = useCallback(() => markRead().then(() => setClosed(true)), [markRead]);

  // ⛔ NEVER BESIDE, NEVER DURING A DISMISS (the TopicWelcomeSheet rule, K10):
  // wait for `hold`, then for the closing Modal's fade. Once up, it stays.
  const wanted = due && focused && !suppressed;
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
  if (!show || !lesson) return null;

  return <FoundationsSheet lesson={lesson} alreadyRead={false} onLater={later} onRead={read} />;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(6,6,8,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '86%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    backgroundColor: '#161616',
    padding: 20,
    gap: 8,
  },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 21, lineHeight: 27, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginBottom: 4 },
  bodyScroll: { flexGrow: 0, flexShrink: 1 },
  bodyPad: { paddingBottom: 4 },
  para: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22.5, color: colors.textPrimary },
  paraGap: { marginTop: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, borderRadius: 9, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.12)' },
  btnPrimaryPressed: { backgroundColor: 'rgba(255,198,77,.22)' },
  btnSecondary: { borderColor: '#3a3a3a', backgroundColor: 'rgba(255,255,255,.03)' },
  btnSecondaryPressed: { backgroundColor: 'rgba(255,255,255,.09)' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.4, textAlign: 'center' },
  btnTextPrimary: { color: colors.amber },
  btnTextSecondary: { color: colors.textSecondary },
});
