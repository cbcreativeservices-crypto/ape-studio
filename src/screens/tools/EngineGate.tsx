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
import { useContext, useEffect, useRef } from 'react';
import { AppState, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { GlassButton } from '../../components/GlassButton';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { ApeDsp } from '../../../modules/ape-dsp';
import { colors, fonts } from '../../theme/tokens';

function openSystemSettings(): void {
  Linking.openSettings().catch(() => {
    /* best-effort — the card's copy already names the manual path */
  });
}

/**
 * ── EVERY HOST MUST PASS `onRetry` (2026-09-17, bug-hunt pass 3) ──────────
 *
 * Until that date NONE of the mic tools did, and the consequences were larger
 * than an optional prop suggests:
 *
 *   • TRY AGAIN never rendered, so the engine's own 12-second start watchdog —
 *     added precisely because "'starting' froze forever with no TRY AGAIN" —
 *     landed the user on a card whose only advice was to leave the tool and
 *     come back. A microphone held by another app is the most likely failure in
 *     the field, and it routes here.
 *   • On Android ALLOW MICROPHONE never rendered either, because `canReRequest`
 *     depends on `onRetry`, even though Android will happily re-show the OS
 *     dialog.
 *   • On the RT60 screen the gate card is the ONLY thing in the scroll area, so
 *     the tool's entire recovery path was a sentence telling the user to leave.
 *
 * The component shipped with the fix; the wiring did not. A new tool that
 * renders this without `onRetry` is a bug, not a style choice.
 */
export function EngineGate({
  state,
  lastError,
  onRetry,
  noSignal,
}: {
  state: EngineState;
  lastError?: string;
  /** The host's engine start() — renders an honest retry key on 'error' (and,
   *  on Android, a re-request key on 'denied'). Optional so existing hosts
   *  keep compiling; without it the copy claims no in-card recovery. */
  onRetry?: () => void;
  /** useDspEngine's `noSignal` (iPad pass 2026-10-07): the capture is RUNNING
   *  but the microphone has never delivered a live frame. Without this card a
   *  mic tool sat on blank readouts forever ("did not work at all"). */
  noSignal?: boolean;
}) {
  // iOS DENIED → SETTINGS → BACK (toddler pass 2026-09-30). The card sends the
  // user to Settings and says "then return here" — but on iOS it has no retry
  // key (iOS never re-asks), so after switching the microphone ON they came
  // back to the same MICROPHONE ACCESS IS OFF card with no way forward except
  // leaving the tool. Returning to the app is the one signal we get, so retry
  // then. iOS only: a denied start there fails silently (no dialog), whereas
  // Android's start() re-requests and would pop the OS prompt on every return.
  // Only while this screen is the one in front: a denied tool left under a
  // pushed screen must never open the mic behind it (spec §18).
  const nav = useContext(NavigationContext);
  const navRef = useRef(nav);
  navRef.current = nav;
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;
  const retryOnReturn = Platform.OS === 'ios' && state === 'denied' && !!onRetry;
  useEffect(() => {
    if (!retryOnReturn) return undefined;
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      if (navRef.current && !navRef.current.isFocused()) return;
      retryRef.current?.();
    });
    return () => sub.remove();
  }, [retryOnReturn]);
  if (state === 'running' && noSignal) {
    // A short line the owner can read back from a device we cannot reach
    // (the route and the rate the native side actually opened at).
    let detail = '';
    try {
      const info = ApeDsp.getInfo();
      if (info) {
        const rate = info.sampleRate > 0 ? `${Math.round(info.sampleRate)} Hz` : 'no sample rate';
        detail = `Input: ${info.routeName || 'none'} · ${rate}${info.lastError ? ` · ${info.lastError}` : ''}`;
      }
    } catch {
      detail = '';
    }
    return (
      <View style={styles.card}>
        <Text style={styles.title}>NO SOUND FROM THE MICROPHONE</Text>
        <Text style={styles.body}>
          {onRetry
            ? 'The microphone is switched on, but no sound is reaching the app. Tap TRY AGAIN. If it keeps happening, close other apps that use the microphone (calls, recorders, video chat), then try again — restarting the device clears a stuck audio system.'
            : 'The microphone is switched on, but no sound is reaching the app. Go back and re-open this tool. If it keeps happening, close other apps that use the microphone (calls, recorders, video chat) — restarting the device clears a stuck audio system.'}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        {onRetry ? <GlassButton label="TRY AGAIN" tint="gold" height={46} fontSize={13} onPress={onRetry} /> : null}
      </View>
    );
  }
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
  detail: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSecondary, opacity: 0.8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionFlex: { flex: 1 },
});
