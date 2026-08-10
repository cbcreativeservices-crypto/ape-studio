/**
 * EngineGate — the honest not-ready states for live measurement screens
 * (engine build 2026-07-23; measurement-tools §1.7: no fake meters, ever).
 * Renders the right card for module-absent / spike-build / permission-denied /
 * error; renders nothing when the engine is usable ('idle'/'starting'/
 * 'running' are the caller's to handle).
 */
import { StyleSheet, Text, View } from 'react-native';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';

export function EngineGate({ state, lastError }: { state: EngineState; lastError?: string }) {
  if (state === 'idle' || state === 'starting' || state === 'running') return null;
  const copy =
    state === 'absent'
      ? {
          title: 'MEASUREMENT ENGINE — NOT IN THIS BUILD',
          body:
            'This install does not include the native audio engine (it ships in iOS development builds). ' +
            'No simulated readings are shown in its place — a meter that looks live but isn’t would ' +
            'violate the measurement-integrity rules this module is built on.',
        }
      : state === 'spike'
        ? {
            title: 'NOT SUPPORTED IN THIS APP BUILD',
            body:
              'This build carries the first-generation capture module only. The full measurement engine ' +
              '(weighted metering, spectrum, pitch, signal generator) is not part of this app build, so ' +
              'this tool cannot run live here.',
          }
        : state === 'denied'
          ? {
              title: 'MICROPHONE ACCESS IS OFF',
              body:
                'Live measurement needs the microphone. Enable microphone access for this app in system ' +
                'Settings, then return here.',
            }
          : {
              title: 'CAPTURE ERROR',
              body: `The audio engine could not start.${lastError ? ` (${lastError})` : ''} Try again; if it persists, close other audio apps and retry.`,
            };
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 14,
    gap: 6,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
});
