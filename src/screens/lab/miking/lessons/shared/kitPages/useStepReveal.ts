/**
 * A STEPPED REVEAL for a HOW IT SOUNDS sequence (LESSON_JOURNEY §6 stage 2,
 * motion rules): STEP to any event, or PLAY ONCE — a staged reveal that stops
 * at the last event (not a loop, D8); PAUSE stops it where it is; under
 * reduced motion PLAY advances one step, instantly. It stops when the page is
 * covered or loses focus. The same mechanics as the drum lessons' PSound.
 */
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';

const STEP_MS = 1300;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

export type StepReveal = {
  reveal: SharedValue<number>;
  shown: number;
  playing: boolean;
  motion: boolean;
  goTo: (k: number) => void;
  play: () => void;
};

export function useStepReveal(n: number, hidden: boolean): StepReveal {
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  useAnimatedReaction(
    () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(setShown, cur);
    },
  );
  const stop = () => {
    cancelAnimation(reveal);
    setPlaying(false);
  };
  const goTo = (k: number) => {
    cancelAnimation(reveal);
    setPlaying(false);
    reveal.value = k;
    setShown(k);
  };
  const play = () => {
    if (playing) {
      stop();
      return;
    }
    const from = shown >= n ? 1 : Math.floor(reveal.value);
    if (!motion) {
      goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
      return;
    }
    reveal.value = from;
    setPlaying(true);
    reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(setPlaying, false);
    });
  };
  useEffect(() => {
    if ((hidden || !focused) && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused]);
  useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
  return { reveal, shown, playing, motion, goTo, play };
}
