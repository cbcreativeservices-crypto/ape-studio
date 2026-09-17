/**
 * TopicWelcomeSheet — the first-open welcome for a topic's flashcards.
 *
 * Computer B authored 166 of these and Computer A QA'd and loaded them into two
 * nullable columns on `achievements` (`flashcard_welcome_title`,
 * `flashcard_welcome_body`), keyed by achievement id. This is the screen half:
 * the FIRST time a learner opens a topic's flashcards, show the title + body
 * once, dismissible, and never again for that topic.
 *
 * WHY IT FETCHES ITSELF rather than riding the Dashboard query: the seen-flag is
 * checked first, so a returning learner costs ZERO network — the common path is
 * one AsyncStorage read and no query at all. It also keeps the feature out of
 * the shared study/dashboard data path, which every topic screen depends on.
 *
 * RULES THIS OBEYS
 *  - Low-Light Production Mode: nothing may auto-appear. `useOverlaysSuppressed`
 *    hard-blocks the sheet, and because the seen flag is only written on an
 *    explicit dismiss, a suppressed learner still gets their welcome later
 *    rather than silently losing it.
 *  - Renders ONLY when both columns are non-null (they are non-null on exactly
 *    the 166 active study topics, null on the other achievements).
 *  - Only while the host screen is focused, so it cannot flash over a screen
 *    that merely mounted underneath another.
 *  - Never blocks: any failure to read the copy means no sheet, and the cards
 *    behave exactly as they did before this existed.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { LowLightDim } from '../settings/LowLightLayer';
import { colors, fonts } from '../../theme/tokens';

export const WELCOME_SEEN_PREFIX = 'ape:welcome:seen:';

/** Per user + topic, so two accounts on one device each get their welcome and a
 *  signed-out learner keeps a stable 'guest' identity. */
function seenKey(uid: string, topicId: string): string {
  return `${WELCOME_SEEN_PREFIX}${uid}:${topicId}`;
}

type Copy = { title: string; body: string };

async function currentUid(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? 'guest';
  } catch {
    return 'guest';
  }
}

/** The welcome copy for a topic, or null when the topic has none (or on any
 *  error — a missing welcome must never interrupt studying). */
async function fetchWelcome(topicId: string): Promise<Copy | null> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('flashcard_welcome_title, flashcard_welcome_body')
      .eq('id', topicId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { flashcard_welcome_title?: string | null; flashcard_welcome_body?: string | null };
    const title = row.flashcard_welcome_title?.trim();
    const body = row.flashcard_welcome_body?.trim();
    // Both or nothing: a half-filled row is not a welcome.
    return title && body ? { title, body } : null;
  } catch {
    return null;
  }
}

export function TopicWelcomeSheet({ topicId, enabled = true }: { topicId: string; enabled?: boolean }) {
  const [copy, setCopy] = useState<Copy | null>(null);
  const [visible, setVisible] = useState(false);
  const focused = useIsFocused();
  const suppressed = useOverlaysSuppressed();
  // One lookup per mount, whatever re-renders happen around it.
  const askedRef = useRef(false);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !topicId || askedRef.current) return undefined;
    askedRef.current = true;
    let alive = true;
    void (async () => {
      const uid = await currentUid();
      if (!alive) return;
      uidRef.current = uid;
      // Seen check FIRST — the returning-learner path costs one storage read.
      let seen = false;
      try {
        seen = (await AsyncStorage.getItem(seenKey(uid, topicId))) != null;
      } catch {
        seen = false;
      }
      if (!alive || seen) return;
      const found = await fetchWelcome(topicId);
      if (!alive || !found) return;
      setCopy(found);
      setVisible(true);
    })();
    return () => {
      alive = false;
    };
  }, [enabled, topicId]);

  const dismiss = useCallback(() => {
    setVisible(false);
    const uid = uidRef.current;
    // Written ONLY here: a learner who never actually saw it (suppressed, or
    // the app died first) still gets it next time.
    if (uid) void AsyncStorage.setItem(seenKey(uid, topicId), new Date().toISOString()).catch(() => {});
  }, [topicId]);

  const show = visible && !!copy && focused && !suppressed;
  if (!show || !copy) return null;

  return (
    <Modal
      accessibilityViewIsModal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        style={styles.scrim}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss the topic introduction"
      >
        {/* The card swallows taps so a stray press inside it does not dismiss. */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="none">
          <Text style={styles.eyebrow}>WELCOME TO THIS TOPIC</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>{copy.body}</Text>
          </ScrollView>
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Start studying"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>START STUDYING</Text>
          </Pressable>
        </Pressable>
      </Pressable>
      <LowLightDim />
    </Modal>
  );
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
    maxWidth: 460,
    maxHeight: '82%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    backgroundColor: '#161616',
    padding: 20,
    gap: 12,
  },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.2, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 21, lineHeight: 27, color: colors.textPrimary },
  bodyScroll: { flexGrow: 0 },
  bodyPad: { paddingBottom: 2 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22.5, color: colors.textSecondary },
  cta: {
    marginTop: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,198,77,.7)',
    backgroundColor: 'rgba(255,198,77,.12)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaPressed: { backgroundColor: 'rgba(255,198,77,.22)' },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.4, color: colors.amber },
});
