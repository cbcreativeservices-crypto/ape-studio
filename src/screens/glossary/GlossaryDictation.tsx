/**
 * GlossaryDictation — the search-field mic button + speech-to-text wiring
 * (owner 2026-08-01).
 *
 * Isolated in its own module ON PURPOSE: expo-speech-recognition calls
 * requireNativeModule("ExpoSpeechRecognition") AT IMPORT, which THROWS in any
 * build that predates the dependency. GlossaryScreen loads this via a guarded
 * require(), so a dev client without the native module shows NO mic instead of
 * crashing the whole screen. The mic appears — and works — once a new EAS build
 * bundles the native module.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { colors } from '../../theme/tokens';

/** Microphone glyph (line-art, matches the app's monochrome icon style).
 *  Red while actively listening. */
function MicGlyph({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={9} y={3} width={6} height={11} rx={3} fill={color} />
      <Path d="M6 11 a6 6 0 0 0 12 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 17 v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 20.5 h7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Mic button: tap to dictate the glossary search; results stream into `onText`
 *  (routed through the same handler as typed text). */
export function GlossaryDictation({ onText }: { onText: (t: string) => void }) {
  const [dictating, setDictating] = useState(false);

  useSpeechRecognitionEvent('start', () => setDictating(true));
  useSpeechRecognitionEvent('end', () => setDictating(false));
  useSpeechRecognitionEvent('error', () => setDictating(false));
  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results?.[0]?.transcript;
    if (typeof t === 'string') onText(t);
  });

  // Release the recognizer on unmount (fix 2026-08-28). The only stop() was the
  // user tapping the mic again — so navigating away mid-dictation (tap a term,
  // switch tabs) left the OS recording indicator lit and the mic held until the
  // platform's own silence timeout, contending with the tools' DSP stream.
  useEffect(
    () => () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // already stopped / module absent — nothing to release
      }
    },
    [],
  );

  const toggle = useCallback(async () => {
    if (dictating) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone needed',
          'Allow microphone and speech recognition access to dictate your search.',
        );
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      setDictating(false);
    }
  }, [dictating]);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={dictating ? 'Stop dictation' : 'Dictate your search'}
    >
      <MicGlyph color={dictating ? '#ff5a48' : colors.textMuted} />
    </Pressable>
  );
}
