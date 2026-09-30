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
 *
 * ⛔ WHILE ANOTHER MODAL IS OPEN THE POPUPS ARE HOSTED, NOT PRESENTED (bug hunt
 * 2026-09-29). A lab's FULL SCREEN view, a sheet or a guided lesson is itself a
 * Modal; a second, root-level Modal asked for on top of it never appears on iOS
 * and is drawn BEHIND it on Android, so requestAudioOutput() waited on a popup
 * nobody could see and every ▶ that asked for sound was dead. While any
 * DimModal is open, the current card is handed to the topmost one
 * (`setHostedOverlay`) and drawn inside its tree. See DimModal.tsx.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { HOST_DISMISS_MS, Modal, setHostedOverlay, useModalHostOpen } from '../../components/DimModal';
import { HoldToActivate } from '../../components/HoldToActivate';
import { getLabPreview } from '../lab/labPreviewStore';
import { supabase } from '../../lib/supabase';
import { safeUser } from '../../lib/getSessionSafe';
import { isRealAccount } from '../commercial/realAccount';
import { colors, fonts } from '../../theme/tokens';
import { SoundSafetyWarning } from './SoundSafetyWarning';
import { soundSafetyFullText } from './soundSafetyText';
import { isAcknowledged, loadSoundSafetyAck, recordSoundSafetyAck } from './soundSafetyAck';
import { optionalModule } from '../tools/capture/optionalModule';

/** The running build's version, for the acknowledgment record.
 *
 *  Behind `optionalModule` in the house idiom: expo-application ships in builds
 *  after 2026-09-06, and a record with a null version is far better than a gate
 *  that throws and leaves the user unable to enable sound at all. */
function appVersion(): string | null {
  return optionalModule<{ nativeApplicationVersion: string | null }>('expo-application')
    ?.nativeApplicationVersion ?? null;
}
import {
  disableAudioOutput,
  enableAudioOutput,
  getLastAudioActivity,
  IDLE_MS,
  isAudioOutputEnabled,
  isIdleBypass,
  noteAudioActivity,
  setIdleBypass,
} from './audioOutputStore';
import { panicMuteAudio } from './panicMute';
import { onOutputLost } from '../../../modules/ape-dsp';

type GateApi = { requestAudioOutput: () => Promise<boolean> };

const AudioOutputGateContext = createContext<GateApi | null>(null);

/** Imperative gate API. Call requestAudioOutput() before producing any sound. */
export function useAudioOutputGate(): GateApi {
  const ctx = useContext(AudioOutputGateContext);
  if (!ctx) throw new Error('useAudioOutputGate must be used within <AudioOutputGate>');
  return ctx;
}

/**
 * 'safety' is the FIRST-USE step (owner 2026-09-17) and runs once ever, before
 * the per-session explain → hold. Declining it leaves the app muted exactly as
 * declining any other step does.
 */
type Phase = 'closed' | 'safety' | 'explain' | 'hold';

export function AudioOutputGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('closed');
  /** `phase` for the stable API closure (it is created once). */
  const phaseRef = useRef<Phase>('closed');
  phaseRef.current = phase;
  // Idle-bypass checkbox (owner 2026-08-01) — session-only, ALWAYS starts unticked
  // when the popup opens (so it never silently persists across launches).
  const [bypassTimer, setBypassTimer] = useState(false);
  // The resolver for the promise handed to the current requester.
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  /** Re-render once the persisted acknowledgment has been read at start-up. */
  const [, setAckLoaded] = useState(false);
  /** Bumped every time a request is settled — an async step that started under
   *  an older value must not act (bug hunt 2026-09-29, see onAccept). A JOINED
   *  tap swaps `resolver.current` but not this, so joining never cancels it. */
  const requestGen = useRef(0);
  /** The Sound Safety acknowledgment is being written (ACCEPT pressed). */
  const [savingAck, setSavingAck] = useState(false);

  const settle = (ok: boolean) => {
    const r = resolver.current;
    resolver.current = null;
    requestGen.current += 1;
    setPhase('closed');
    r?.(ok);
  };

  /** A DimModal is on screen: the popups must be hosted inside it. The gate's
   *  own popups are hosts too (overlayPublisher="gate", so a confirm raised
   *  over one is drawn inside it) — they are skipped here, or the gate would
   *  flip itself in and out. */
  const hostOpen = useModalHostOpen('gate');
  /** `hostOpen` for the stable API closure. */
  const hostOpenRef = useRef(hostOpen);
  hostOpenRef.current = hostOpen;
  /**
   * The host just CLOSED with a popup still pending. Its dismissal is still
   * animating, and iOS will not present a new Modal mid-dismissal — so the root
   * Modal waits out the transition instead of silently failing to appear.
   */
  const [rootHold, setRootHold] = useState(false);
  const prevHostOpen = useRef(hostOpen);
  useEffect(() => {
    const was = prevHostOpen.current;
    prevHostOpen.current = hostOpen;
    if (hostOpen || !was) {
      setRootHold(false);
      return;
    }
    setRootHold(true);
    const t = setTimeout(() => setRootHold(false), 450);
    return () => clearTimeout(t);
  }, [hostOpen]);
  const rootShown = !hostOpen && !rootHold;

  const api = useMemo<GateApi>(
    () => ({
      requestAudioOutput: () =>
        new Promise<boolean>((resolve) => {
          // Free-user lab PREVIEW (behind glass): never produce output and never
          // raise the "audio output is off" popup — the user is only viewing, not
          // using the lab (owner 2026-08-02). Mic INPUT/readouts are unaffected.
          if (getLabPreview().active) {
            resolve(false);
            return;
          }
          // Fast path — already enabled: just refresh activity and go.
          if (isAudioOutputEnabled()) {
            noteAudioActivity();
            resolve(true);
            return;
          }
          // A request is already mid-flight: JOIN it rather than stack modals
          // (the user is already deciding). This used to resolve(false) — a
          // silent refusal, so a second tap on a lab's ▶ while the popup was
          // still up (or had failed to appear) did nothing at all and read as
          // a dead play button (owner report 2026-09-27, Bass Guitar Lab).
          // Both taps now get the one answer the learner gives.
          if (resolver.current) {
            const first = resolver.current;
            resolver.current = (ok: boolean) => {
              first(ok);
              resolve(ok);
            };
            // …and RE-PRESENT it. A tap that reached a ▶ behind the popup proves
            // the popup is not on screen (a Modal asked for mid-transition can
            // fail to present on iOS). Close and reopen the same step so it
            // actually appears; if it was visible, this is one frame's blink.
            //
            // Bug hunt 2026-09-30, pass 2: (a) a HOSTED card is drawn in-tree
            // and is always on screen, so it is left alone; (b) a root popup
            // that WAS on screen is still fading out 60 ms later, and iOS
            // refuses to present over a dismissal in progress — the re-present
            // itself failed and the popup vanished for good. Wait out the
            // dismissal (HOST_DISMISS_MS), and only for THIS request: a
            // cancel + new request meanwhile must not be jumped to this step.
            const current = phaseRef.current;
            if (current !== 'closed' && !hostOpenRef.current) {
              const gen = requestGen.current;
              setPhase('closed');
              setTimeout(() => {
                if (resolver.current && requestGen.current === gen) setPhase(current);
              }, HOST_DISMISS_MS);
            }
            return;
          }
          resolver.current = resolve;
          setBypassTimer(false); // checkbox resets every time the popup opens
          // FIRST USE: the Sound Safety Warning comes before anything else.
          // isAcknowledged() is false until loadSoundSafetyAck() has resolved,
          // so the very first request of a launch may show the warning to
          // someone who has already accepted it — which is why the load is
          // kicked off at mount below, long before any sound is asked for.
          setPhase(isAcknowledged() ? 'explain' : 'safety');
        }),
    }),
    [],
  );

  // Read the persisted Sound Safety acknowledgment once, at mount — well
  // before any screen asks for sound, so a returning user never sees the
  // warning again just because the read had not finished.
  useEffect(() => {
    let alive = true;
    void loadSoundSafetyAck().then(() => {
      if (alive) setAckLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // HEADPHONES UNPLUGGED / BLUETOOTH DROPPED (build after 2026-09-30): the
  // native engine has already stopped every voice; muting here brings every
  // screen's transport to STOPPED (useStopWhenSilenced) instead of RUN over
  // silence, and a restart asks for output again — never straight to the
  // loudspeaker. Builds without the event never fire it.
  useEffect(() => onOutputLost(() => panicMuteAudio()), []);

  // AUTO-RE-MUTE (login + foreground-after-idle). Registered once at root.
  useEffect(() => {
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      // Only a real sign-in re-mutes. Opening the glossary mints an ANONYMOUS
      // session, which arrives here as SIGNED_IN — silencing the app mid-lab
      // for a reason the user could never connect to what they just did.
      // PASSWORD_RECOVERY is how auth-js announces the in-app password-reset
      // sign-in (bug pass 2026-09-30) — the same new-session mute applies.
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && isRealAccount(session)) disableAudioOutput();
    });
    const appSub = AppState.addEventListener('change', (state) => {
      // ── LEAVING THE APP SILENCES IT (2026-09-17, bug-hunt pass 2) ──────────
      //
      // This listener had exactly one branch, `state === 'active'`, and there
      // is no AppState handling anywhere under src/screens/lab — in seventeen
      // labs that can start a native voice. So pressing Home during a lab left
      // the tone playing: on Android the ape-dsp Oboe stream holds no audio
      // focus and is not bound to the activity, so it simply continues, with no
      // notification, nothing to pause, and no way to stop it short of force-
      // quitting. `tuningAudio.ts` is the only class in the app that handled
      // this on its own.
      //
      // `panicMuteAudio()` is the right call rather than a per-lab teardown:
      // it stops the generator, the binaural bus, the modular voice, speech and
      // every file player in one synchronous pass, and re-locks the gate — and
      // it needs no cooperation from seventeen screens that have each forgotten
      // to ask. Re-locking is consistent with the app's rule that sound is
      // always turned on deliberately.
      //
      // 'background' ONLY, NOT 'inactive' (corrected 2026-09-17 after a
      // verification pass). On iOS `inactive` also fires for Control Centre,
      // the app switcher, a notification banner and — worst — the microphone
      // permission prompt. Since this re-locks the gate, treating those as
      // "the user left" would silence a lab the user is still looking at and
      // demand another five-second hold to get it back; in the permission-prompt
      // case it would kill the very lab that raised the prompt.
      //
      // 'background' is the state that actually means they have gone, and it is
      // the one where the Android Oboe stream would otherwise play on forever.
      if (state === 'background') {
        // Unconditional (bug pass 2026-09-30): a native generator still live
        // while the gate already reads muted must stop too. Muting an already
        // muted gate changes nothing else.
        panicMuteAudio();
        return;
      }
      if (
        state === 'active' &&
        isAudioOutputEnabled() &&
        !isIdleBypass() &&
        Date.now() - getLastAudioActivity() > IDLE_MS
      ) {
        disableAudioOutput();
      }
    });
    return () => {
      authSub.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  const acceptSafety = () => {
    if (savingAck) return; // one write per ACCEPT — the button is disabled too
    // The request this ACCEPT belongs to. The write below can take up to
    // five seconds (bounded getUser + storage); a DECLINE, scrim tap or
    // BACK in that window settles the request as "no". Without this
    // check the late write then opened "Audio output is off" for a
    // request that no longer existed — an orphan popup with nobody
    // awaiting its answer (bug hunt 2026-09-29).
    const gen = requestGen.current;
    setSavingAck(true);
    // Record FIRST. If the acknowledgment cannot be written we do not
    // enable sound: an acknowledgment nobody wrote down did not happen,
    // and proceeding would leave audio on with no evidence of consent.
    void (async () => {
      let stored = false;
      try {
        stored = await recordSoundSafetyAck({
          text: soundSafetyFullText(),
          appVersion: appVersion(),
          // Bounded: this write settles the AUDIO GATE. A stalled getUser
          // here never reaches settle(), so the learner could not enable
          // audio at all — a hang on a safety gate, not just a slow read.
          userId: (await safeUser(supabase.auth.getUser(), 'soundSafetyAck')).data.user?.id ?? null,
        });
      } catch {
        stored = false;
      } finally {
        setSavingAck(false);
      }
      if (requestGen.current !== gen) return; // declined meanwhile
      if (!stored) {
        settle(false);
        return;
      }
      // Accepted and recorded — now the ordinary per-session steps.
      setPhase('explain');
    })();
  };

  /* POPUP 1 — explain the setting. */
  const explainBody = (
    <View style={styles.backdrop} accessibilityViewIsModal>
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
  );

  /* POPUP 2 — the 5-second hold to enable. */
  const holdBody = (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => settle(false)}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      />
      {/* Emergency-mute notice (owner 2026-08-01: moved ABOVE the enable
          card) — its own RED container so users know it exists BEFORE they
          need it. ⚠️ It named only the shake gesture, which does nothing
          where the accelerometer is unavailable and says so to nobody. The
          tap always works, so it leads. */}
      <View style={styles.shakeCard}>
        <Text style={styles.shakeText}>
          ⚠ TAP THE RED AUDIO OUTPUT ROW AT ANY TIME TO MUTE IMMEDIATELY — OR, ON A PHONE WITH
          A MOTION SENSOR, SHAKE THE DEVICE.
        </Text>
      </View>
      {/* Enable-audio card. */}
      <View style={[styles.card, { marginTop: 10 }]}>
        <Text style={styles.title}>Enable audio output</Text>
        {/* Owner 2026-09-13, on the Pixel. Two corrections, and the second
            is the one that matters.

            1. "or when you reopen the app" was a guess at a mechanism that
               does not exist. Closing the app mutes nothing — no code runs —
               and reopening triggers no mute either. The setting is simply
               never SAVED (audioOutputStore is session-only; `enabled`
               starts false on every JS launch), so each visit begins silent.

            2. Owner, on a draft that listed every re-mute trigger including
               sign-in: "the user is signed in, they are there using the app
               … maybe you are trying to be too general rather than what's
               needed here." Correct. THIS POPUP IS READ AT ONE MOMENT — the
               user just asked for sound and is deciding. It needs the two
               facts that bear on that decision, not a spec of the store:
               sound stays on while they use the app, and it auto-mutes after
               20 minutes untouched (which the bypass checkbox below refers
               to, so it cannot be dropped). Sign-in is a transition they
               already made; relaunch is a problem for a future visit, where
               they will simply hold again. Shake-to-mute is already stated
               in the red card above — saying it twice is not clearer.

            CORRECTED 2026-09-17. The clause about switching away was true
            when it was written: leaving the app did NOT mute it inside the
            idle window. It does now — backgrounding runs panicMuteAudio(),
            which was added because seventeen labs could otherwise leave a
            tone playing indefinitely after the user pressed Home. The
            sentence had become a promise the app no longer keeps, on the
            dialog where the user decides to allow sound at all. */}
        <Text style={styles.body}>
          Hold the button for 5 seconds to allow sound. It stays on while you're using the app,
          mutes itself after 20 minutes untouched, and mutes when you leave the app — so nothing
          is left playing behind you.
        </Text>
        <HoldToActivate
          label="HOLD 5s TO ENABLE AUDIO OUTPUT"
          onComplete={() => {
            setIdleBypass(bypassTimer); // defeat auto-off if the box is ticked
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
      {/* Idle-bypass checkbox (owner 2026-08-01) — BELOW the enable card. Tick
          to keep audio on past the auto-off timer for this session. Resets each
          time the popup opens. */}
      <Pressable
        style={styles.bypassCard}
        onPress={() => setBypassTimer((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: bypassTimer }}
        // RNW 0.21 drops the accessibilityState object; aria-checked is what
        // reaches the DOM, and it is valid (and required) on role=checkbox.
        aria-checked={bypassTimer}
        accessibilityLabel="Keep audio on and defeat the auto-off timer for this session"
      >
        <View style={[styles.checkbox, bypassTimer && styles.checkboxOn]}>
          {bypassTimer ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.bypassText}>
          Keep audio on for this session — defeat the {Math.round(IDLE_MS / 60000)}-minute
          auto-off timer (audio stays on until you mute it).
        </Text>
      </Pressable>
    </View>
  );

  // Hosted mode — a DimModal is open, so the current card is drawn INSIDE it
  // (see the note at the top of this file). Re-published every render so the
  // card's closures stay current; cleared when closed or back at root.
  const hostedBody = !hostOpen || phase === 'closed'
    ? null
    : phase === 'safety'
      ? (
        <SoundSafetyWarning
          embedded
          visible
          busy={savingAck}
          onDecline={() => settle(false)}
          onAccept={acceptSafety}
        />
      )
      : phase === 'explain'
        ? explainBody
        : holdBody;
  useEffect(() => {
    setHostedOverlay(hostedBody ? { node: hostedBody, onBack: () => settle(false) } : null);
  });
  useEffect(() => () => setHostedOverlay(null), []);

  return (
    <AudioOutputGateContext.Provider value={api}>
      {children}

      {/* POPUP 0 — the first-use Sound Safety Warning. Once ever, until the
          warning's version changes. Root Modals below show only while no other
          Modal is open (`rootShown`); otherwise the card is hosted. */}
      <SoundSafetyWarning
        visible={phase === 'safety' && rootShown}
        busy={savingAck}
        onDecline={() => settle(false)}
        onAccept={acceptSafety}
      />

      {/* POPUP 1 — explain the setting. */}
      <Modal accessibilityViewIsModal
        overlayPublisher="gate"
        visible={phase === 'explain' && rootShown}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settle(false)}
      >
        {explainBody}
      </Modal>

      {/* POPUP 2 — the 5-second hold to enable. */}
      <Modal accessibilityViewIsModal
        overlayPublisher="gate"
        visible={phase === 'hold' && rootShown}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => settle(false)}
      >
        {holdBody}
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
  shakeCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,42,42,.7)',
    backgroundColor: 'rgba(255,42,42,.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  shakeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.6, lineHeight: 18, color: '#ff6b5e', textAlign: 'center' },
  // Idle-bypass checkbox container (owner 2026-08-01) — below the enable card.
  bypassCard: {
    width: '100%',
    maxWidth: 340,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#5a5a5a',
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { borderColor: 'rgba(55,224,95,.85)', backgroundColor: 'rgba(55,224,95,.16)' },
  checkboxMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, lineHeight: 16, color: GREEN },
  bypassText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
