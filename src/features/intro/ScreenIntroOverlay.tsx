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
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../../config/devMode';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
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
export function useScreenIntro(key: IntroKey, sessionOnly = false) {
  const [visible, setVisible] = useState(false);
  // Suppression: NOTHING shows when the dev kill-switch is on OR Low-Light
  // Production Mode is engaged — this wins even over DEV_BYPASS.alwaysShowIntros.
  const suppressed = useOverlaysSuppressed();
  // An intro must only show while its host screen is actually FOCUSED — never
  // when the screen is merely mounted underneath another (e.g. the Dashboard is
  // the Study stack's initial route, so it mounts under the Glossary; without
  // this gate its "Method Cards" intro flashed before the Glossary appeared).
  const focused = useIsFocused();

  useEffect(() => {
    let alive = true;
    if (devBypass('alwaysShowIntros')) {
      setVisible(true); // every entry = first time (dev)
      return;
    }
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
      void AsyncStorage.setItem(INTRO_STORAGE_PREFIX + key, '1');
    }
  }, [key, sessionOnly]);

  return { visible: visible && focused && !suppressed, dismiss };
}

export function IntroSheet({
  introKey,
  onDismiss,
  delayMs = 0,
}: {
  introKey: IntroKey;
  onDismiss: () => void;
  /** Minimum time (ms) the sheet stays before it can be tapped away. The
   *  "tap to continue" affordance appears only after it elapses. */
  delayMs?: number;
}) {
  const copy = SCREEN_INTROS[introKey];
  // `instantIntros` (dev-only) zeroes every governed read-timer so intros are
  // immediately dismissable during screen sweeps; the delayMs values passed by
  // callers are left untouched so flipping the flag restores them exactly.
  const holdMs = devBypass('instantIntros') ? 0 : delayMs;
  const [ready, setReady] = useState(holdMs <= 0);
  useEffect(() => {
    if (holdMs <= 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const t = setTimeout(() => setReady(true), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);

  return (
    <Modal accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={ready ? onDismiss : undefined}
    >
      <Pressable
        style={styles.backdrop}
        onPress={ready ? onDismiss : undefined}
        disabled={!ready}
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
          {/* Until the timer elapses, show NOTHING and swallow taps. After it
              elapses, show the (green) dismiss affordance. */}
          {!ready ? null : !copy.button || /^tap /i.test(copy.button) ? (
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
}: {
  introKey: IntroKey;
  delayMs?: number;
  /** Show once per app session (resets on relaunch) instead of once-ever. */
  sessionOnly?: boolean;
}) {
  const { visible, dismiss } = useScreenIntro(introKey, sessionOnly);
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
