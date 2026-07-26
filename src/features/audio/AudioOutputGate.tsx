/**
 * AudioOutputGate — the app-root gate that turns "the app is muted by default"
 * into a real choke point (owner request 2026-07-25). Mounted once alongside
 * the other root providers (App.tsx), it:
 *
 *  1. Exposes an imperative async API — `const { requestAudioOutput } =
 *     useAudioOutputGate();` → `requestAudioOutput(): Promise<boolean>` — that
 *     every sound-producing site calls BEFORE it emits anything:
 *       • already enabled → noteAudioActivity() + resolve(true) immediately;
 *       • muted → POPUP 1 (explains the setting: CLOSE → false, PROCEED →) →
 *         POPUP 2 (the 5-second HoldToActivate) → hold completes →
 *         enableAudioOutput() + noteAudioActivity() → resolve(true); dismiss →
 *         resolve(false).
 *
 *  2. Wires the AUTO-RE-MUTE triggers that need the framework:
 *       • login — supabase.auth.onAuthStateChange SIGNED_IN → disableAudioOutput();
 *       • foreground-after-idle — AppState 'active' & (now − lastActivity) >
 *         IDLE_MS → disableAudioOutput().
 *     (Relaunch re-mute is automatic — the store is session-only — and the
 *     10-min while-open idle timer lives in the store itself.)
 *
 * Popups use the app's Modal backdrop+card idiom (see PrePaywallPrompt).
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HoldToActivate } from '../../components/HoldToActivate';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import {
  disableAudioOutput,
  enableAudioOutput,
  getLastAudioActivity,
  IDLE_MS,
  isAudioOutputEnabled,
  noteAudioActivity,
} from './audioOutputStore';

type GateApi = { requestAudioOutput: () => Promise<boolean> };

const AudioOutputGateContext = createContext<GateApi | null>(null);

/** Imperative gate API. Call requestAudioOutput() before producing any sound. */
export function useAudioOutputGate(): GateApi {
  const ctx = useContext(AudioOutputGateContext);
  if (!ctx) throw new Error('useAudioOutputGate must be used within <AudioOutputGate>');
  return ctx;
}

type Phase = 'closed' | 'explain' | 'hold';

export function AudioOutputGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('closed');
  // The resolver for the promise handed to the current requester.
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const settle = (ok: boolean) => {
    const r = resolver.current;
    resolver.current = null;
    setPhase('closed');
    r?.(ok);
  };

  const api = useMemo<GateApi>(
    () => ({
      requestAudioOutput: () =>
        new Promise<boolean>((resolve) => {
          // Fast path — already enabled: just refresh activity and go.
          if (isAudioOutputEnabled()) {
            noteAudioActivity();
            resolve(true);
            return;
          }
          // If a request is already mid-flight, deny this one rather than
          // stack modals (the user is already deciding).
          if (resolver.current) {
            resolve(false);
            return;
          }
          resolver.current = resolve;
          setPhase('explain');
        }),
    }),
    [],
  );

  // AUTO-RE-MUTE (login + foreground-after-idle). Registered once at root.
  useEffect(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') disableAudioOutput();
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAudioOutputEnabled() && Date.now() - getLastAudioActivity() > IDLE_MS) {
        disableAudioOutput();
      }
    });
    return () => {
      authSub.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  return (
    <AudioOutputGateContext.Provider value={api}>
      {children}

      {/* POPUP 1 — explain the setting. */}
      <Modal
        visible={phase === 'explain'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settle(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => settle(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View style={styles.card}>
            <Text style={styles.title}>Audio output is off</Text>
            <Text style={styles.body}>
              This setting must be turned on to allow any sound from the app to be heard.
            </Text>
            <Pressable
              style={styles.btn}
              onPress={() => setPhase('hold')}
              accessibilityRole="button"
              accessibilityLabel="Proceed to enable audio output"
            >
              <Text style={styles.btnText}>PROCEED</Text>
            </Pressable>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => settle(false)}
              accessibilityRole="button"
              accessibilityLabel="Close, keep muted"
            >
              <Text style={styles.btnSecondaryText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* POPUP 2 — the 5-second hold to enable. */}
      <Modal
        visible={phase === 'hold'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settle(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => settle(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          />
          <View style={styles.card}>
            <Text style={styles.title}>Enable audio output</Text>
            <Text style={styles.body}>
              Hold the button for 5 seconds to allow sound. It mutes again automatically after 10
              minutes idle, or when you reopen the app.
            </Text>
            <HoldToActivate
              label="HOLD 5s TO ENABLE AUDIO OUTPUT"
              onComplete={() => {
                enableAudioOutput();
                noteAudioActivity();
                settle(true);
              }}
            />
            <Pressable
              style={styles.btnSecondary}
              onPress={() => settle(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel, keep muted"
            >
              <Text style={styles.btnSecondaryText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AudioOutputGateContext.Provider>
  );
}

const GREEN = colors.green;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#17181a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(55,224,95,.35)', padding: 18, gap: 10 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  btn: { marginTop: 2, borderRadius: 9, backgroundColor: 'rgba(55,224,95,.12)', borderWidth: 1.5, borderColor: 'rgba(55,224,95,.7)', paddingVertical: 11, alignItems: 'center' },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: GREEN },
  btnSecondary: { borderRadius: 9, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#141414', paddingVertical: 11, alignItems: 'center' },
  btnSecondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
});
