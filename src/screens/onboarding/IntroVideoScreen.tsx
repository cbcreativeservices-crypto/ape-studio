/**
 * IntroVideoScreen — the onboarding video (owner spec 2026-10-09).
 *
 * Plays once, automatically, on the first Academy menu visit, then hands off
 * to the one-time landing page (OnboardingLandingScreen). "Replay intro" on
 * the Academy menu and "Watch again" on the landing page play it again.
 *
 * Owner rulings:
 *  - NO skip on the FIRST run ("people skip then complain they don't understand
 *    it"): no button, no tap-to-pause, Android back does nothing, iOS swipe-back
 *    is off.
 *  - A voluntary REPLAY can be left (owner 2026-11-05, bug test report item 5):
 *    a Close button and Android BACK return to where it was started from. Close
 *    is the same on iOS, which has no BACK; swipe-back stays off.
 *  - A LATER viewing can be skipped (owner 2026-11-05, launch feedback): the
 *    first viewing stays no-skip, but one that was interrupted restarted from
 *    zero for 2:35 with no way past it. Skip counts as seen. A new account on
 *    a phone that has played it still gets the video, with Skip.
 *  - The video is bundled in the app (works offline and for the reviewer); a
 *    new cut can still go out by update.
 *  - If it cannot play, go straight to the landing page and do NOT mark it
 *    seen, so it is offered again on the next Academy menu visit.
 *
 * The file is silent (on-screen text only), so it is muted and never touches
 * the audio session the tools share.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { safeGoBack } from '../../lib/safeGoBack';
import { useBackWhileFocused } from '../../lib/useBackWhileFocused';
import { markIntroVideoSeenOnAccount } from '../../features/profile/api';
import { introVideoStartedBefore, markIntroVideoStarted } from '../../features/intro/introVideoAttempt';
import { useScreenIntro } from '../../features/intro/ScreenIntroOverlay';
import { fonts } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'IntroVideo'>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const INTRO_VIDEO = require('../../../assets/onboarding/intro_v1_1080p30.mp4');
/** A file that has not started within this long is treated as failed. */
const LOAD_TIMEOUT_MS = 8000;
export const ORIENTATION_NOTICE = 'Orientation video: the Academy is huge, so here is a quick look around before you enter.';

export function IntroVideoScreen({ navigation, route }: Props) {
  const replay = route.params?.replay === true;
  const returnToLanding = route.params?.returnTo === 'landing';
  const insets = useSafeAreaInsets();
  // Its dismiss writes the first-run seen-flag (the one write, ScreenIntroOverlay).
  const { dismiss } = useScreenIntro('introVideo');
  const doneRef = useRef(false);
  const startedRef = useRef(false);
  // Read once, before this viewing marks itself.
  const [startedBefore] = useState(() => introVideoStartedBefore().catch(() => false));
  const [canSkip, setCanSkip] = useState(false);
  useEffect(() => {
    let alive = true;
    void startedBefore.then((before) => {
      if (alive) setCanSkip(before);
    });
    return () => {
      alive = false;
    };
  }, [startedBefore]);

  const player = useVideoPlayer(INTRO_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
    p.keepScreenOnWhilePlaying = true;
    p.play();
  });

  const finish = useCallback(
    (played: boolean) => {
      if (doneRef.current) return;
      doneRef.current = true;
      // Only a video that actually played to the end retires the first-run flag
      // — on this phone, and on the account when one is signed in (once per
      // ACCOUNT, owner 2026-10-26; a no-op for a guest or before Comp A's mark).
      if (played && !replay) {
        dismiss();
        void markIntroVideoSeenOnAccount();
      }
      navigation.replace('OnboardingLanding');
    },
    [navigation, replay, dismiss],
  );

  useEventListener(player, 'playToEnd', () => finish(true));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      startedRef.current = true;
      if (!replay) void startedBefore.then(() => markIntroVideoStarted());
      // The setup's play() can land before the view is attached (web does
      // this); ask again once the file is ready.
      if (!player.playing) player.play();
    }
    if (status === 'error') finish(false);
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (!startedRef.current) finish(false);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [finish]);

  // HOME → return froze the video for good (live toddler pass 2026-10-13): the
  // OS pauses playback in the background and nothing resumed it, and with no
  // skip and BACK swallowed the learner was trapped. Resume on return; if it
  // still is not playing a few seconds later, leave for the landing page (a
  // finish(false) never retires the first-run flag, so the intro can replay).
  useEffect(() => {
    let stall: ReturnType<typeof setTimeout> | null = null;
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' || doneRef.current) return;
      try {
        if (!player.playing) player.play();
      } catch {
        finish(false);
        return;
      }
      if (stall) clearTimeout(stall);
      stall = setTimeout(() => {
        if (!doneRef.current && !player.playing) finish(false);
      }, 4000);
    });
    return () => {
      sub.remove();
      if (stall) clearTimeout(stall);
    };
  }, [player, finish]);

  // Leaving a replay. "Watch again" swapped the landing page out, so that page
  // comes back; from the Academy menu the menu is underneath. finish(false)
  // never retires the first-run flag, and nothing to go back to still leaves.
  const leaveReplay = useCallback(() => {
    if (doneRef.current) return;
    if (!returnToLanding && safeGoBack(navigation)) {
      doneRef.current = true;
      return;
    }
    finish(false);
  }, [navigation, returnToLanding, finish]);

  // First run, no skip: Android back is consumed while the video plays.
  // A replay leaves. Either way BACK stops here.
  useBackWhileFocused(
    true,
    useCallback(() => {
      if (replay) leaveReplay();
      return true;
    }, [replay, leaveReplay]),
  );

  return (
    <View style={styles.root}>
      <View style={styles.video} accessibilityLabel="Introduction video" accessible>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={false}
          contentFit="contain"
          allowsPictureInPicture={false}
          // Taps do nothing (owner 2026-10-09: no pause / resume).
          pointerEvents="none"
        />
      </View>
      {replay ? (
        <Pressable
          style={[styles.close, { top: insets.top + 8 }]}
          onPress={leaveReplay}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close video"
        >
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      ) : canSkip ? (
        <Pressable
          style={[styles.close, { top: insets.top + 8 }]}
          onPress={() => finish(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip video"
        >
          <Text style={styles.closeText}>Skip</Text>
        </Pressable>
      ) : null}
      {/* A notice, not a control: it says what this is (owner 2026-11-05). */}
      <View pointerEvents="none" style={[styles.notice, { bottom: insets.bottom + 12 }]}>
        <Text style={styles.noticeText}>{ORIENTATION_NOTICE}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  close: {
    position: 'absolute',
    right: 12,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  closeText: { fontFamily: fonts.barlowMedium, fontSize: 16, color: '#fff' },
  notice: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  noticeText: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 19,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
