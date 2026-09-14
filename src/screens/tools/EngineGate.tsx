/**
 * EngineGate — the honest not-ready states for live measurement screens
 * (engine build 2026-07-23; measurement-tools §1.7: no fake meters, ever).
 * Renders the right card for module-absent / spike-build / permission-denied /
 * error; renders nothing when the engine is usable ('idle'/'starting'/
 * 'running' are the caller's to handle).
 *
 * Recovery controls (store-review fix 2026-09-13 — error_triad.md): the card
 * must never promise a recovery it doesn't offer. When the host passes
 * `onRetry` (its engine start()), the 'error' card renders a real TRY AGAIN
 * key and the Android 'denied' card an ALLOW MICROPHONE key (Android re-shows
 * the OS dialog unless the user picked "Don't ask again"; iOS never re-asks,
 * so there the only honest path is Settings). The 'denied' card always offers
 * OPEN SETTINGS — self-contained via Linking.openSettings(), no host wiring
 * needed. Copy adapts to which controls are actually present.
 */
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../components/GlassButton';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';

function openSystemSettings(): void {
  Linking.openSettings().catch(() => {
    /* best-effort — the card's copy already names the manual path */
  });
}

export function EngineGate({
  state,
  lastError,
  onRetry,
}: {
  state: EngineState;
  lastError?: string;
  /** The host's engine start() — renders an honest retry key on 'error' (and,
   *  on Android, a re-request key on 'denied'). Optional so existing hosts
   *  keep compiling; without it the copy claims no in-card recovery. */
  onRetry?: () => void;
}) {
  if (state === 'idle' || state === 'starting' || state === 'running') return null;
  // Android can re-show the OS mic dialog via a plain re-request (unless the
  // user chose "Don't ask again" — then the request resolves denied instantly
  // and Settings remains the path). iOS asks exactly once, ever: only the
  // system Settings toggle can change a refusal, so a "try again" key there
  // would be a lie.
  const canReRequest = Platform.OS === 'android' && !!onRetry;
  const copy =
    state === 'absent'
      ? {
          title: 'MEASUREMENT ENGINE — NOT IN THIS BUILD',
          body:
            'This install does not include the native audio engine (it ships in the app’s full iOS and Android builds). ' +
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
              body: canReRequest
                ? 'Live measurement needs the microphone. Tap ALLOW MICROPHONE to be asked again — ' +
                  'if Android no longer shows the request, enable it in Settings instead.'
                : 'Live measurement needs the microphone. Enable microphone access for this app in ' +
                  'system Settings, then return here.',
            }
          : {
              title: 'CAPTURE ERROR',
              body: onRetry
                ? `The audio engine could not start.${lastError ? ` (${lastError})` : ''} Tap TRY AGAIN; if it persists, close other audio apps first.`
                : `The audio engine could not start.${lastError ? ` (${lastError})` : ''} Go back and re-open this tool to try again; if it persists, close other audio apps first.`,
            };
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
      {state === 'error' && onRetry ? (
        <GlassButton label="TRY AGAIN" tint="gold" height={46} fontSize={13} onPress={onRetry} />
      ) : null}
      {state === 'denied' ? (
        <View style={styles.actions}>
          {canReRequest ? (
            <View style={styles.actionFlex}>
              <GlassButton label="ALLOW MICROPHONE" tint="gold" height={46} fontSize={12} onPress={onRetry} />
            </View>
          ) : null}
          <View style={styles.actionFlex}>
            <GlassButton label="OPEN SETTINGS" tint="steel" height={46} fontSize={12} onPress={openSystemSettings} />
          </View>
        </View>
      ) : null}
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionFlex: { flex: 1 },
});
