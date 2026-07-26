/**
 * SpeakButton — device text-to-speech for a glossary term (Feature 2, Booth
 * kickoff 2026-07-10): tap speaks "{term}. {plain-English explanation}" via
 * expo-speech — built-in device voice, offline, no cloud, no audio files.
 * ONE utterance app-wide: starting a new one cancels any in-progress speech;
 * tapping the active button stops it. The icon shows playing state (amber,
 * waves lit). English voice pinned (no translation — kickoff ruling).
 */
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { useAudioOutputGate } from '../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../features/audio/audioOutputStore';

// Single global owner: whichever button is speaking registered its resetter.
let activeReset: (() => void) | null = null;

/** Stop any in-progress speech app-wide (also used on screen blur). */
export function stopAllSpeech() {
  Speech.stop();
  activeReset?.();
  activeReset = null;
}

export function SpeakButton({
  text,
  size = 20,
  accessibilityLabel = 'Play pronunciation and explanation',
}: {
  text: string;
  size?: number;
  accessibilityLabel?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const mine = useRef(false); // is the global utterance this button's?
  const { requestAudioOutput } = useAudioOutputGate();

  useEffect(
    () => () => {
      // Unmounting while speaking (row recycled, popup closed) → stop.
      if (mine.current) stopAllSpeech();
    },
    [],
  );

  const reset = () => {
    mine.current = false;
    setPlaying(false);
  };

  const onPress = async () => {
    if (playing) {
      stopAllSpeech();
      return;
    }
    // AUDIO-OUTPUT GATE (owner request 2026-07-25): TTS is app-emitted sound and
    // must be silent unless output is enabled. Runs the enable flow when muted.
    const ok = await requestAudioOutput();
    if (!ok) return;
    stopAllSpeech(); // cancel whichever term was speaking
    mine.current = true;
    setPlaying(true);
    activeReset = reset;
    noteAudioActivity();
    Speech.speak(text, {
      language: 'en-US', // device's default ENGLISH voice, regardless of locale
      onDone: () => {
        if (mine.current) {
          reset();
          activeReset = null;
        }
      },
      onStopped: () => {
        if (mine.current) reset();
      },
      onError: () => {
        if (mine.current) {
          reset();
          activeReset = null;
        }
      },
    });
  };

  const c = playing ? '#ffc64d' : '#8a8a8a';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: playing }}
      style={playing && Platform.OS === 'ios' ? styles.glow : null}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* speaker body */}
        <Path d="M4 9.5 L8 9.5 L13 5 L13 19 L8 14.5 L4 14.5 Z" fill={c} />
        {/* waves — lit while playing */}
        <Path
          d="M16 9 Q 17.8 12, 16 15"
          stroke={c}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          opacity={playing ? 1 : 0.55}
        />
        <Path
          d="M18.5 7 Q 21.5 12, 18.5 17"
          stroke={c}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          opacity={playing ? 1 : 0.3}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowColor: 'rgba(255,180,0,0.8)',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
