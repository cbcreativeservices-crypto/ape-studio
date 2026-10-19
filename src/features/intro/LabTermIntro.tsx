/**
 * LabTermIntro — the first-open glossary popup for a lab (owner 2026-10-19).
 *
 * "When a lab is opened for the first time, I want a popup to appear first
 * with the lab's title and the plain english definition underneath it … then
 * a continue button and on into the lab."
 *
 * A centred popup in the house intro style (never a pulldown, never a raw
 * Alert): the glossary TERM as the title, its PLAIN-ENGLISH text exactly as
 * the glossary has it underneath, one CONTINUE. Which term each lab gets, and
 * the labs still on HOLD, are in labTermIntroData.ts.
 *
 * Mounted ONCE, by withMembershipPreview (the wrapper every lab route goes
 * through), beside the lab screen — `require`d there on first use, so none of
 * this is in the app-start graph.
 *
 * THE RULES (state machine: labTermIntroState in labTermIntros.ts)
 *  • MEMBERS ONLY (owner 2026-10-19: "do not show the glossary pop up for
 *    free non-members … free users should be going straight to the
 *    membership gate denial"). useMemberGate() must be 'open'; 'locked',
 *    'checking' and 'unconfirmed' show nothing, and a members-only preview
 *    scrim is never covered. Nothing is marked seen for a non-member, so the
 *    first open AS a member still gets it.
 *  • ONCE per lab per device: CONTINUE writes the seen flag (ape:intro:labTerms,
 *    labTermSeenStore). A failed read shows nothing and writes nothing.
 *  • FIRST: while it is owed, the lab's own first-open popups wait
 *    (useScreenIntro → ProNote; GuestStartReminder) — setLabTermIntroOwed.
 *  • NEVER STACKED: not while another DimModal is open, not during a closing
 *    Modal's fade (rootModalHoldMs), not mid-push (transitionEnd), not over
 *    the amplitude orientation page (holdLabTermIntro).
 *  • LOW-LIGHT: nothing auto-appears (useOverlaysSuppressed, which is also the
 *    dev kill switch) and the first-run sampler hushes it too. It stays owed
 *    and unseen, so it comes the first time it can.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Modal, rootModalHoldMs, useModalHostOpen } from '../../components/DimModal';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { devBypass } from '../../config/devMode';
import { colors, fonts } from '../../theme/tokens';
import { useMemberGate } from '../commercial/useTier';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { useLabPreview } from '../lab/labPreviewStore';
import { useSamplingActive } from './onboardingSampling';
import { labTermSignalId, setLabTermIntroOwed, useLabTermIntroHeld } from './screenIntros';
import { labTermIntroState, labTermKey, labTermTitle, wiredLabTerm, type WiredLabTerm } from './labTermIntros';
import { markLabTermSeen, useLabTermSeen } from './labTermSeenStore';

/** After the push animation (GuestStartReminder's rule): transitionEnd + a
 *  beat, or this fallback for a screen that mounted after its push ended. */
const AFTER_PUSH_MS = 120;
const PUSH_FALLBACK_MS = 900;

export function LabTermIntroHost({ routeName, params }: { routeName: string; params?: unknown }) {
  const term = wiredLabTerm(labTermKey(routeName, params));
  if (!term) return null; // not a catalog lab, or on HOLD: nothing, and nothing owed
  return <LabTermIntro term={term} />;
}

function LabTermIntro({ term }: { term: WiredLabTerm }) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const gate = useMemberGate();
  const previewActive = useLabPreview().active;
  // Both hooks run every render (never short-circuit a hook).
  const overlaysSuppressed = useOverlaysSuppressed();
  const sampling = useSamplingActive();
  const suppressed = overlaysSuppressed || sampling;
  const held = useLabTermIntroHeld();
  const stored = useLabTermSeen(term.key);
  const bypass = devBypass('alwaysShowIntros'); // dev: every entry is a first entry
  const seen = bypass ? false : stored;
  const otherModalOpen = useModalHostOpen();
  const [dismissed, setDismissed] = useState(false);
  const [pushSettled, setPushSettled] = useState(false);
  const presentedRef = useRef(false);
  const [id] = useState(labTermSignalId);

  useEffect(() => {
    let later: ReturnType<typeof setTimeout> | null = null;
    const settle = () => setPushSettled(true);
    const nav = navigation as unknown as {
      addListener?: (e: 'transitionEnd', cb: (ev: { data?: { closing?: boolean } }) => void) => () => void;
    };
    const unsub = nav.addListener?.('transitionEnd', (ev) => {
      if (!ev?.data?.closing) later = setTimeout(settle, AFTER_PUSH_MS);
    });
    const fallback = setTimeout(settle, PUSH_FALLBACK_MS);
    return () => {
      clearTimeout(fallback);
      if (later) clearTimeout(later);
      unsub?.();
    };
  }, [navigation]);

  const base = {
    wired: true,
    gate,
    previewActive,
    seen,
    dismissed,
    focused,
    suppressed,
    held,
    pushSettled,
    otherModalOpen,
    presented: presentedRef.current,
  };
  // The fade wait is read only when everything else is clear (it is a clock).
  const ready = labTermIntroState({ ...base, holdMs: 0 });
  const holdMs = ready.show && !presentedRef.current ? rootModalHoldMs() : 0;
  const { owed, show } = labTermIntroState({ ...base, holdMs });
  const [, setTick] = useState(0);
  useEffect(() => {
    if (holdMs <= 0) return undefined;
    const t = setTimeout(() => setTick((n) => n + 1), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);
  if (show) presentedRef.current = true;
  if (!owed) presentedRef.current = false;

  // Published before paint, so the lab's own intros never get a frame first.
  useLayoutEffect(() => {
    setLabTermIntroOwed(id, owed);
  }, [id, owed]);
  // Unmount only ([] deps — `id` never changes): the popup is no longer owed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => () => setLabTermIntroOwed(id, false), []);

  const onContinue = useCallback(() => {
    setDismissed(true);
    // The dev bypass never persists (the useScreenIntro rule).
    if (!devBypass('alwaysShowIntros')) void markLabTermSeen(term.key);
  }, [term.key]);

  if (!show) return null;
  return <LabTermSheet term={term.term} plainEnglish={term.plainEnglish} onContinue={onContinue} />;
}

/** The popup itself — also what a "show the definition again" link would open. */
export function LabTermSheet({
  term,
  plainEnglish,
  onContinue,
}: {
  term: string;
  plainEnglish: string;
  onContinue: () => void;
}) {
  const title = labTermTitle(term);
  return (
    <Modal
      supportedOrientations={ALL_ORIENTATIONS}
      accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      // Android BACK is CONTINUE: never a trap, and the lab is right behind it.
      onRequestClose={onContinue}
    >
      {/* The scrim does not dismiss: CONTINUE is the one way on. */}
      <View style={styles.backdrop}>
        {/* Not an accessibility element itself, so a screen reader reaches the
            title, the text and CONTINUE one by one (the TopicWelcomeSheet lesson). */}
        <View style={styles.card}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{plainEnglish}</Text>
          </ScrollView>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.ctaText}>CONTINUE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // The house intro card (ScreenIntroOverlay / ProNote): dim scrim, amber edge.
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '86%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 20,
    gap: 14,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollBody: { gap: 10 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 26, lineHeight: 32, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1 },
  body: { fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24, color: colors.textSecondary },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.amberLabel,
  },
  ctaPressed: { opacity: 0.8 },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: '#141310' },
});
