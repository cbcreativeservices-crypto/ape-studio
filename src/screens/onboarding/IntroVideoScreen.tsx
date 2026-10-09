/**
 * IntroVideoScreen — the onboarding video (owner spec 2026-10-09).
 *
 * Plays once, automatically, on the first Academy menu visit, then hands off
 * to the one-time landing page (OnboardingLandingScreen). "Replay intro" on
 * the Academy menu and "Watch again" on the landing page play it again.
 *
 * Owner rulings:
 *  - NO skip ("people skip then complain they don't understand it"): no
 *    button, no tap-to-pause, Android back does nothing, iOS swipe-back is off.
 *  - The video is bundled in the app (works offline and for the reviewer); a
 *    new cut can still go out by update.
 *  - If it cannot play, go straight to the landing page and do NOT mark it
 *    seen, so it is offered again on the next Academy menu visit.
 *
 * The file is silent (on-screen text only), so it is muted and never touches
 * the audio session the tools share.
 */
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useBackWhileFocused } from '../../lib/useBackWhileFocused';
import { useScreenIntro } from '../../features/intro/ScreenIntroOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'IntroVideo'>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const INTRO_VIDEO = require('../../../assets/onboarding/intro_v1_1080p30.mp4');
/** A file that has not started within this long is treated as failed. */
const LOAD_TIMEOUT_MS = 8000;

export function IntroVideoScreen({ navigation, route }: Props) {
  const replay = route.params?.replay === true;
  // Its dismiss writes the first-run seen-flag (the one write, ScreenIntroOverlay).
  const { dismiss } = useScreenIntro('introVideo');
  const doneRef = useRef(false);
  const startedRef = useRef(false);

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
      // Only a video that actually played to the end retires the first-run flag.
      if (played && !replay) dismiss();
      navigation.replace('OnboardingLanding');
    },
    [navigation, replay, dismiss],
  );

  useEventListener(player, 'playToEnd', () => finish(true));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      startedRef.current = true;
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

  // No skip: Android back is consumed while the video plays.
  useBackWhileFocused(true, useCallback(() => true, []));

  return (
    <View style={styles.root} accessibilityLabel="Introduction video" accessible>
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
});
