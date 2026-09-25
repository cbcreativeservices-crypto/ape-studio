/**
 * ScreenIntroOverlay — placeholder intro/tutorial overlay (Booth 2026-07-18).
 *
 * Shown on entry to a screen per the registry in screenIntros.ts. In dev with
 * DEV_BYPASS.alwaysShowIntros it appears on EVERY entry (nothing persisted);
 * otherwise it shows once and retires via `ape:intro:<key>`.
 *
 * Deliberately minimal: a dimmed sheet + title/body + PLACEHOLDER tag, so real
 * tutorial designs can replace the content without touching the wiring.
 */
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../../config/devMode';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import { useSamplingActive } from './onboardingSampling';
import { colors, fonts } from '../../theme/tokens';
import { LowLightDim } from '../settings/LowLightLayer';
import { INTRO_STORAGE_PREFIX, SCREEN_INTROS, type IntroKey } from './screenIntros';

// Session-only "seen" flags — in-memory, cleared on app process restart — for
// intros that must reshow once each new app session instead of retiring forever
// (e.g. the Commitment popup for free users, owner 2026-08-01).
const sessionShownIntros = new Set<IntroKey>();

/**
 * @param sessionOnly when true, the intro shows once per APP SESSION (tracked in
 *   memory, resets on relaunch) rather than once-ever (persisted). Used to give
 *   free users a per-session Commitment popup while paid users see it once.
 */
export function useScreenIntro(key: IntroKey, sessionOnly = false, hold = false) {
  const [visible, setVisible] = useState(false);
  // Suppression: NOTHING shows when the dev kill-switch is on OR Low-Light
  // Production Mode is engaged — this wins even over DEV_BYPASS.alwaysShowIntros.
  // The first-run sampler loop (§2.1) also hushes screen intros while sampling,
  // so a sampled destination opens clean. Both hooks run every render.
  const overlaysSuppressed = useOverlaysSuppressed();
  const sampling = useSamplingActive();
  const suppressed = overlaysSuppressed || sampling;
  // An intro must only show while its host screen is actually FOCUSED — never
  // when the screen is merely mounted underneath another (e.g. the Dashboard is
  // the Study stack's initial route, so it mounts under the Glossary; without
  // this gate its "Method Cards" intro flashed before the Glossary appeared).
  const focused = useIsFocused();

  useEffect(() => {
    let alive = true;
    if (devBypass('alwaysShowIntros')) {
      setVisible(true); // every entry = first time (dev, incl. placeholders so they can be felt)
      return;
    }
    // Never show an UNFINISHED (placeholder) intro to real users — its copy
    // isn't final and it carries a PLACEHOLDER badge. It reappears the moment
    // its copy is finalized (placeholder:false). Launch sweep 2026-09-07.
    if (SCREEN_INTROS[key].placeholder !== false) return;
    if (sessionOnly) {
      // Once per app session: mark shown on first entry so it can't reappear
      // later this session; the flag clears on relaunch, so it returns next time.
      if (!sessionShownIntros.has(key)) {
        sessionShownIntros.add(key);
        setVisible(true);
      }
      return;
    }
    (async () => {
      const seen = await AsyncStorage.getItem(INTRO_STORAGE_PREFIX + key);
      if (alive && seen == null) setVisible(true);
    })();
    return () => {
      alive = false;
    };
  }, [key, sessionOnly]);

  const dismiss = useCallback(() => {
    setVisible(false);
    // Dev bypass never persists; sessionOnly is tracked in memory only (above),
    // so it also never persists — either way it returns on the next app launch.
    if (!devBypass('alwaysShowIntros') && !sessionOnly) {
      void AsyncStorage.setItem(INTRO_STORAGE_PREFIX + key, '1').catch(() => {});
    }
  }, [key, sessionOnly]);

  /**
   * ⛔ `hold` DEFERS, IT DOES NOT RETIRE (owner 2026-09-22: "fix the overlays").
   *
   * On a fresh install the Glossary drew its welcome card AND the device-key
   * consent dialog at the same moment, text through text — both illegible, with
   * AGREE and NOT NOW buried in the middle of a paragraph. Two overlays, each
   * correct on its own, neither aware of the other.
   *
   * A host passes `hold` while something else owns the screen. Crucially this
   * only suppresses the RENDER: `dismiss` is what persists the seen flag, so an
   * intro held here is not consumed — it appears the moment the blocking thing
   * resolves, which is the whole point. Same shape as `suppressed` above.
   */
  return { visible: visible && focused && !suppressed && !hold, dismiss };
}

export function IntroSheet({
  introKey,
  onDismiss,
  delayMs = 0,
}: {
  introKey: IntroKey;
  onDismiss: () => void;
  /** @deprecated Accepted so existing call sites keep compiling; IGNORED.
   *  See the read-timer note below. */
  delayMs?: number;
}) {
  const copy = SCREEN_INTROS[introKey];
  /**
   * ⛔ NO READ-TIMER. INTROS CLOSE ON THE FIRST TAP (owner 2026-09-20: "take
   * the timer off of the intro pop ups, make them tappable to close
   * immediately").
   *
   * This supersedes the ratified dwell times (app welcome 9 s, commitment
   * 8 s — APE_BACKEND_HANDOFF_2026_07_23 §2.3). The owner ratified those and
   * has now withdrawn them, so the constants are not "bypassed" any more;
   * the gate is gone.
   *
   * It was also the honest call. A dead screen with no button for nine
   * seconds is indistinguishable from a freeze — which is why this file grew
   * a VoiceOver announcement to explain the wait rather than let a blind user
   * conclude the app had hung. A hold that needs an accessibility workaround
   * to stop reading as a crash is not making anyone read more carefully.
   *
   * `delayMs` is still accepted so the call sites compile unchanged, and is
   * deliberately unused.
   */
  void delayMs;

  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss intro"
      >
        <View style={styles.card}>
          {copy.placeholder !== false ? (
            <Text style={styles.tag}>INTRO / TUTORIAL — PLACEHOLDER</Text>
          ) : null}
          <Text style={styles.title}>{copy.title}</Text>
          <View style={styles.rule} />
          <Text style={styles.body}>{copy.body}</Text>
          {/* The dismiss affordance is there from the first frame — there is
              nothing to wait for any more. */}
          {!copy.button || /^tap /i.test(copy.button) ? (
            <Text style={styles.dismissHint}>{(copy.button ?? 'Tap anywhere to continue').toUpperCase()}</Text>
          ) : (
            <View style={styles.introBtn}>
              <Text style={styles.introBtnText}>{copy.button}</Text>
            </View>
          )}
        </View>
      </Pressable>
      <LowLightDim />
    </Modal>
  );
}

export function ScreenIntroOverlay({
  introKey,
  delayMs = 0,
  sessionOnly = false,
  hold = false,
}: {
  introKey: IntroKey;
  delayMs?: number;
  /** Show once per app session (resets on relaunch) instead of once-ever. */
  sessionOnly?: boolean;
  /** Hold the intro back while the host has something more important on
   *  screen — a consent dialog, a lock. DEFERS; never marks it seen. */
  hold?: boolean;
}) {
  const { visible, dismiss } = useScreenIntro(introKey, sessionOnly, hold);
  if (!visible) return null;
  return <IntroSheet introKey={introKey} onDismiss={dismiss} delayMs={delayMs} />;
}

/**
 * Two-step intro chain (e.g. Home: app welcome → first-user tutorial). Shows
 * `first` until dismissed, then `second`. Each key keeps its own seen-state.
 */
export function ScreenIntroSequence({ first, second }: { first: IntroKey; second: IntroKey }) {
  const a = useScreenIntro(first);
  const b = useScreenIntro(second);
  if (a.visible) return <IntroSheet introKey={first} onDismiss={a.dismiss} />;
  if (b.visible) return <IntroSheet introKey={second} onDismiss={b.dismiss} />;
  return null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    // Match the sibling sheets (LearningIntroSheet, TopicWelcomeSheet), which
    // already cap here. Without it this card stretched to 934pt on an iPad —
    // and this one is the FIRST thing a new tablet user sees.
    maxWidth: 460,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 20,
    gap: 10,
  },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: '#b98a20' },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, color: colors.textPrimary },
  rule: { width: 44, height: 2, backgroundColor: colors.amber, borderRadius: 1 },
  body: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  dismissHint: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: '#37e05f',
    marginTop: 6,
    textAlign: 'center',
  },
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
  introBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: colors.amber },
});
