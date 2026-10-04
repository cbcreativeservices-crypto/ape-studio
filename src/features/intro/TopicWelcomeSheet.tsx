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
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { safeSessionResult } from '../../lib/getSessionSafe';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { Modal, rootModalHoldMs } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';

export const WELCOME_SEEN_PREFIX = 'ape:welcome:seen:';

/** Per user + topic, so two accounts on one device each get their welcome and a
 *  signed-out learner keeps a stable 'guest' identity. */
function seenKey(uid: string, topicId: string): string {
  return `${WELCOME_SEEN_PREFIX}${uid}:${topicId}`;
}

type Copy = { title: string; body: string };

/**
 * Whose seen-flag to read, or null when the session read did not answer.
 *
 * ⛔ AN UNANSWERED READ IS NOT A GUEST (hunt 11, 2026-10-04; catalog K1). This
 * used `getUser()` — a round trip to the auth server — and answered 'guest'
 * whenever it stalled (5 s) or failed. A member on a weak connection then
 * read the GUEST flag, which is never set for them, and was shown a welcome
 * they had already dismissed (and the dismiss filed it under 'guest'). The
 * stored session carries the same uid without a round trip; a read that did
 * not answer (`timedOut`) shows nothing — the welcome is never more than a
 * nicety, and the next visit asks again.
 */
async function currentUid(): Promise<string | null> {
  try {
    const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'TopicWelcomeSheet');
    if (timedOut) return null;
    return result.data.session?.user?.id ?? 'guest';
  } catch {
    return null;
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

export function TopicWelcomeSheet({
  topicId,
  enabled = true,
  hold = false,
  onOwedChange,
}: {
  topicId: string;
  enabled?: boolean;
  /** The host has another popup up or still to come (Flashcards: its own
   *  first-visit intro). DEFERS, never marks seen — the ScreenIntroOverlay
   *  `hold` rule (2026-10-04). */
  hold?: boolean;
  /** Told whether the welcome is still OWED on this visit: its lookup has not
   *  answered, or it is due and not dismissed (even while held, suppressed or
   *  unfocused). The host's own timed popups wait on it (Flashcards' 45 s
   *  tutorial, 2026-10-04): a second root Modal beside this one is refused
   *  on iOS. */
  onOwedChange?: (owed: boolean) => void;
}) {
  const [copy, setCopy] = useState<Copy | null>(null);
  const [visible, setVisible] = useState(false);
  /** The lookup has answered, whichever way (or none was needed). */
  const [looked, setLooked] = useState(false);
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
      if (!alive || uid == null) return;
      uidRef.current = uid;
      // Seen check FIRST — the returning-learner path costs one storage read.
      let seen = false;
      try {
        seen = (await AsyncStorage.getItem(seenKey(uid, topicId))) != null;
      } catch {
        // READ failed (wave 2, 2026-10-02): treat as SEEN. It used to read as
        // "not seen", so a learner whose storage could not answer got the
        // welcome on every visit to the topic. Nothing is written here (only
        // an explicit dismiss writes), so a later good read still gives a
        // learner who never saw it their welcome.
        seen = true;
      }
      if (!alive || seen) return;
      const found = await fetchWelcome(topicId);
      if (!alive || !found) return;
      setCopy(found);
      setVisible(true);
    })()
      // Answered on EVERY exit — shown, seen, none, failed, or abandoned —
      // so a host waiting on `onOwedChange` is never left waiting.
      .catch(() => {})
      .finally(() => setLooked(true));
    return () => {
      alive = false;
    };
  }, [enabled, topicId]);
  const owed = enabled && !!topicId && (!looked || visible);
  const onOwedRef = useRef(onOwedChange);
  onOwedRef.current = onOwedChange;
  useEffect(() => {
    onOwedRef.current?.(owed);
  }, [owed]);

  const dismiss = useCallback(() => {
    setVisible(false);
    const uid = uidRef.current;
    // Written ONLY here: a learner who never actually saw it (suppressed, or
    // the app died first) still gets it next time.
    // Silent on purpose: the app's seen-flag — a lost flag shows the welcome once more.
    if (uid) void AsyncStorage.setItem(seenKey(uid, topicId), new Date().toISOString()).catch(() => {});
  }, [topicId]);

  /**
   * ⛔ NEVER BESIDE, NEVER DURING A DISMISS (2026-10-04; catalog K10). On the
   * first-ever Flashcards visit the `flashcards` intro and this welcome were
   * both due: iOS refuses the second root Modal, nothing showed, and since
   * the seen flag is written only on dismiss the welcome came back on a later
   * visit instead. `hold` waits for the host's other popup; once it lets go,
   * the closing Modal's fade is waited out (rootModalHoldMs — the
   * GlossaryLockView / AppDialog rule) before this one presents. Once up, it
   * stays.
   */
  const wanted = visible && !!copy && focused && !suppressed;
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
  if (!show || !copy) return null;

  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS}
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
