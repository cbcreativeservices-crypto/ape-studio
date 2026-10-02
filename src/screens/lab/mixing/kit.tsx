/**
 * Mixing lab — shared page kit (owner GO 2026-09-11). COPY IS NEW — owner
 * ratification pending; copy sheet: docs/APE_MIXING_LAB_COPY_2026_09_11.md.
 *
 * Machinery shared by both mixing labs:
 *  • MixMantra — the central lesson, repeated deliberately.
 *  • useVisitGoals / GoalChips — the patchbay latched-goals pattern.
 *  • useMixPlayback — decide → RENDER (real DSP, off the tap) → listen. Wraps
 *    the ear-lab player; renders are async with an honest RENDERING state,
 *    playback stops on unmount so page navigation never overlaps audio, and
 *    every play sits behind the app-wide audio output gate.
 *  • AbPlayer — level-matchable A/B comparisons (matched by measured RMS —
 *    never compare at different loudness).
 *  • MiniConsole — fader/pan/mute/Ø strips with stepper controls (44 pt,
 *    screen-reader adjustable; steppers, not drags — WCAG 2.5.7).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts } from '../../../theme/tokens';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { useStopWhenSilenced } from '../../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../../features/audio/useStopOnBlur';
import { armFence, startFenced } from '../../../features/audio/startFenced';
import { navigationRef } from '../../../navigation/navigationRef';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { Btn, Row, useMarkWhen } from '../tuning/components/primitives';
import { GearButton, GearFader, GearKnob, ScribbleStrip, StripFrame } from '../kit/gear';
import type { PageCtx } from '../kit/PagedLab';
import { useLabEndGuest } from '../kit/LabEndScreen';
import {
  FLAT,
  matchGainDb,
  soloActiveIn,
  renderMix,
  type MixSettings,
  type RenderedMix,
  type SharedVerb,
  type TrackSettings,
} from './audio/mixAudio.ts';
import { SESSION_TRACKS, type TrackId } from './engine/mixModel.ts';

/* ── the learner's focal-point decision (page 1 → reused later) ──────────── */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalStore } from '../../../features/storage/localStore';

const FOCAL_KEY = 'ape:mixing:focal';
let focalCurrent: string | null = null;
/** Chosen in THIS app run (never read from storage) — what a guest sees. */
let focalSession: string | null = null;
const focalListeners = new Set<() => void>();
/** Set by a choice or an account wipe (full run 2, 2026-10-01): the
 *  import-time read below then lost the race and must not land. It wrote a
 *  previous account's stored choice back over resetMixingCommitments(), or
 *  an older stored choice over one just made. */
let focalTouched = false;
/** The read THREW (wave 2, 2026-10-02): the stored choice is unknown, not
 *  "none" — the next screen that shows it reads again. Nothing is written
 *  from it: the focal point is ONE value, written only as the learner's own
 *  new choice (a deliberate replacement), so a failed read has no copy to
 *  write over. */
let focalUnreadable = false;
// A MODULE-LEVEL read: it runs at import time, so a rejection here has no
// component to surface in and becomes a bare unhandled rejection at startup.
// Failing it just leaves the default (and the flag above).
function readFocal(): void {
  focalUnreadable = false;
  void AsyncStorage.getItem(FOCAL_KEY)
    .then((v) => {
      if (v != null && !focalTouched) {
        focalCurrent = v;
        focalListeners.forEach((l) => l());
      }
    })
    .catch(() => {
      focalUnreadable = true;
    });
}
readFocal();

/** The song's declared focal point — a COMMITMENT, not a correct answer.
 *  Persisted so later pages (static-mix anchor) can honour it. */
/**
 * Forget both Mixing-lab commitments — the account-wipe entry point.
 *
 * `focalCurrent` and the priorities list are the LEARNER'S OWN decisions: the
 * focal point they chose on page 1 and the mix priorities they committed to on
 * page 2, both echoed back to them later in the lab as "what you said". They
 * are module-level, so the stored keys were swept on an account change and the
 * values were not — and the next person was shown a stranger's answers as their
 * own (2026-09-17, caught by the registry test rather than by eye).
 */
export function resetMixingCommitments(): void {
  focalTouched = true;
  focalUnreadable = false;
  focalCurrent = null;
  focalSession = null;
  prioritiesSession = null;
  // A new generation: a read or write in flight for the departing account
  // lands nowhere (the shared store also registers this with the wipe).
  prioritiesStore.reset();
  focalListeners.forEach((l) => l());
  prioritiesListeners.forEach((l) => l());
}

export function useFocalChoice(): [string | null, (id: string) => void] {
  const [, force] = useState(0);
  // HOUSE GUEST RULE (bug hunt 2026-09-30 pass 2): kit/PagedLab saves no
  // page progress for a signed-out guest (its end screen: "nothing here is
  // saved"), but this commitment was written and came back on the next open.
  // A guest's choice now lives in memory for the session only.
  const guestRef = useRef(false);
  guestRef.current = useLabEndGuest();
  useEffect(() => {
    const l = () => force((n) => n + 1);
    focalListeners.add(l);
    if (focalUnreadable && !focalTouched) readFocal(); // the boot read failed: try again
    return () => {
      focalListeners.delete(l);
    };
  }, []);
  const set = useCallback((id: string) => {
    focalTouched = true;
    focalCurrent = id;
    focalSession = id;
    focalListeners.forEach((l) => l());
    if (!guestRef.current) void AsyncStorage.setItem(FOCAL_KEY, id).catch(() => {});
  }, []);
  // ...and nothing is RESTORED for a guest either (bug pass 3, 2026-09-30):
  // the import-time read above restored the stored choice for everyone, so a
  // signed-out device showed the previous account's focal point as "what you
  // said". A guest sees only what they chose this session. useLabEndGuest
  // waits for `resolved`, so a signed-in learner is never hidden their own.
  return [guestRef.current ? focalSession : focalCurrent, set];
}

/* ── the AML mix-priorities commitment (page 2 → echoed at the final) ────── */

const PRIORITIES_KEY = 'ape:mixing:priorities';
/** The stored list, on the shared safe store (pattern catalog 2026-10-02,
 *  wave 2). A toggle is an EDIT of the list, so it must land on the stored
 *  one: a read that THREW used to leave the list empty, and the next toggle
 *  saved a one-item list over the three priorities on the device; a toggle
 *  before the import-time read landed did the same. Now a failed read is
 *  never written over, a toggle is applied to the HYDRATED list (queued
 *  until the read lands), and a read or write in flight across the account
 *  wipe lands nowhere. */
const prioritiesStore = createLocalStore<readonly string[]>({
  key: PRIORITIES_KEY,
  empty: () => [],
  parse: (p) => {
    if (!Array.isArray(p)) throw new Error('not a priority list');
    return p.filter((x): x is string => typeof x === 'string');
  },
});
/** Committed in THIS app run (never read from storage) — what a guest sees. */
let prioritiesSession: string[] | null = null;
const prioritiesListeners = new Set<() => void>();

/** Pure: the list after toggling `id` — at most three. */
function togglePriority(base: readonly string[], id: string, add: boolean): string[] {
  if (!add) return base.filter((x) => x !== id);
  return base.includes(id) || base.length >= 3 ? [...base] : [...base, id];
}

/** The learner's three declared mix priorities — a commitment, not an answer. */
export function useMixPriorities(): [readonly string[], (id: string) => void] {
  const [, force] = useState(0);
  const stored = prioritiesStore.use();
  // HOUSE GUEST RULE — see useFocalChoice.
  const guestRef = useRef(false);
  guestRef.current = useLabEndGuest();
  useEffect(() => {
    const l = () => force((n) => n + 1);
    prioritiesListeners.add(l);
    return () => {
      prioritiesListeners.delete(l);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    if (guestRef.current) {
      // A guest edits their OWN session list, never the restored one, and
      // nothing is written.
      const base = prioritiesSession ?? [];
      prioritiesSession = togglePriority(base, id, !base.includes(id));
      prioritiesListeners.forEach((l) => l());
      return;
    }
    // The intent comes from the list the learner SEES; the edit is applied to
    // the HYDRATED list.
    const add = !prioritiesStore.get().includes(id);
    void prioritiesStore.mutate((list) => togglePriority(list, id, add));
    prioritiesSession = [...prioritiesStore.get()];
    prioritiesListeners.forEach((l) => l());
  }, []);
  // Nothing restored for a guest (bug pass 3, 2026-09-30) — see useFocalChoice.
  return [guestRef.current ? (prioritiesSession ?? []) : stored, toggle];
}

/** The lab's central lesson (owner brief, verbatim) — repeated on purpose. */
export const MIX_MANTRA =
  'Mixing is a sequence of listening decisions used to create balance, clarity, depth, movement, and emotional focus.';

export function MixMantra() {
  return (
    <View style={styles.mantra}>
      <Text style={styles.mantraEyebrow}>THE MIXER’S MANTRA</Text>
      <Text style={styles.mantraText}>{MIX_MANTRA}</Text>
    </View>
  );
}

/** Sticky exploration goals (patchbay pattern): each goal latches once its
 *  predicate has been true; all latched → the page marks itself done. */
export function useVisitGoals(ctx: PageCtx, goals: { label: string; hit: boolean }[]): boolean[] {
  const seen = useRef<boolean[]>(goals.map(() => ctx.isDone));
  // A page already finished (this visit or an earlier one — isDone can arrive
  // after the first render, once saved progress loads) shows every goal met.
  // The chips used to restart at ○ / "not yet" on every mount (bug hunt
  // 2026-09-29). Before the loop, so a finished page announces nothing.
  if (ctx.isDone && !seen.current.every(Boolean)) seen.current = goals.map(() => true);
  goals.forEach((g, i) => {
    if (g.hit && !seen.current[i]) {
      seen.current[i] = true;
      // A chip flipping at the page's foot is invisible mid-page — announce
      // the latch for assistive tech (design pass 11).
      AccessibilityInfo.announceForAccessibility?.(`Goal complete: ${g.label}`);
    }
  });
  const all = seen.current.every(Boolean);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return [...seen.current];
}

export function GoalChips({ goals, latched }: { goals: { label: string }[]; latched: boolean[] }) {
  return (
    <View style={styles.chips} accessibilityRole="list">
      {goals.map((g, i) => (
        <View
          key={g.label}
          style={[styles.chip, latched[i] && styles.chipDone]}
          accessible
          accessibilityLabel={`${g.label}: ${latched[i] ? 'done' : 'not yet'}`}
        >
          <Text style={[styles.chipText, latched[i] && { color: colors.green }]}>
            {latched[i] ? '✓ ' : '○ '}
            {g.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── playback ────────────────────────────────────────────────────────────── */

export interface MixVariant {
  id: string;
  label: string;
  settings: MixSettings;
  masterDb?: number;
  mono?: boolean;
  /** The shared reverb return this variant's `verbSendDb` sends feed. WITHOUT
   *  this, sends are silently ignored — cognition audit P1-1 (2026-09-11)
   *  caught page 10 playing three identical renders. */
  sharedVerb?: SharedVerb;
  /** AML bus stages, passed straight to the renderer. */
  busComp?: { thresholdDb: number; ratio: number; attackMs: number; releaseMs: number };
  busDriveDb?: number;
  masterWidth?: number;
  /** Level-match this variant to another variant's measured RMS before it is
   *  ever heard (§honesty: loudness-changed comparisons must be matched). */
  matchTo?: string;
}

type PlaybackStatus = 'idle' | 'rendering' | 'ready';

export interface MixPlayback {
  status: PlaybackStatus;
  /** Render (once) then play the variant; stops anything else. */
  play: (id: string) => void;
  stop: () => void;
  /** The currently sounding variant id, or null. */
  active: string | null;
  /** The variant queued to play once the render finishes (design pass 4). */
  pending: string | null;
  /** Measurements, available once ready. */
  measured: Record<string, { peakDb: number; rmsDb: number }>;
  /** Ids that have been listened to (for listening-goal chips). */
  heard: readonly string[];
}

/** Armed: a settled console edit re-renders and replays after this pause. */
const REPLAY_MS = 350;

/** Decide → render → listen. Renders ALL variants of the set on first play
 *  (so A/B switching is instant afterwards), with real measurements. */
export function useMixPlayback(variants: readonly MixVariant[]): MixPlayback {
  const { requestAudioOutput } = useAudioOutputGate();
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [active, setActive] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [measured, setMeasured] = useState<Record<string, { peakDb: number; rmsDb: number }>>({});
  const [heard, setHeard] = useState<string[]>([]);
  const playerRef = useRef<EarClipPlayer | null>(null);
  const idsRef = useRef<string[]>([]);
  const pendingRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  /** In-flight render bookkeeping — SYNCHRONOUS refs, set before the first
   *  await, because `status` cannot close this window: play() awaits the audio
   *  gate first, so a second tap arrives hundreds of ms later still holding the
   *  PRE-render `status` from its own closure. Both taps then ran a full
   *  renderAll; the loser still reached EarClipPlayer.load(), which overwrites
   *  its `files` list — stranding that render's temp WAVs (up to ~2 MB each)
   *  in the cache dir with nothing left to delete them.
   *  • renderingSigRef — the variant signature currently rendering; a second
   *    call for the SAME set returns immediately.
   *  • renderSeqRef — generation counter, so a render superseded by a genuine
   *    variant change (the repair page's console edits) aborts at its next
   *    await instead of racing the new one to load(). */
  const renderingSigRef = useRef<string | null>(null);
  const renderSeqRef = useRef(0);
  /** The armed replay (night pass 3, 2026-10-01 — the Mastering lab's fix).
   *  The variant outlives one effect run: a fader DRAG changes the set on
   *  every tick, and by the second tick `active` and `pending` were already
   *  null, so the replay was forgotten and a drag silently stopped the sound
   *  it promised to replay. Cleared when the replay fires or is cancelled;
   *  a ▶ press or a stop/mute/close inside the pause cancels it, so the old
   *  variant cannot start over the one just pressed. */
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayIdRef = useRef<string | null>(null);
  const cancelReplay = useCallback(() => {
    if (replayTimerRef.current != null) clearTimeout(replayTimerRef.current);
    replayTimerRef.current = null;
    replayIdRef.current = null;
  }, []);

  const signature = useMemo(() => JSON.stringify(variants), [variants]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      playerRef.current?.stop();
      void playerRef.current?.dispose?.();
      playerRef.current = null;
    };
  }, []);

  /**
   * ⛔ STOP ON BLUR, NOT ONLY ON UNMOUNT.
   *
   * Unmount is the wrong hook for this lab, because this lab PUSHES siblings:
   * `OpenLabLink` below navigates to the EQ Lab and to the other mixing lab,
   * and React Navigation keeps the pushed-from screen mounted. So the 10-second
   * stem loop carried on playing UNDER the EQ Lab and mixed with that lab's own
   * audition tone — with the transport on the covered screen, there was nothing
   * on the visible one that could stop it. Only Back, shake-to-mute or
   * backgrounding silenced it.
   *
   * Every other audio lab already does exactly this (AutotuneLabScreen:191,
   * BassLabScreen:178, BinauralLabScreen:151, cymatics/useDriveTone:134); the
   * mixing labs build their own shell and were missed. Dispose stays on
   * unmount — blur should silence the lab, not throw away the render the
   * learner comes back to.
   */
  //
  // Bug hunt 2026-09-29 — two holes the stop-on-blur left open:
  //  • ■ OVER SILENCE: blur paused the player but never cleared `active`, so
  //    the pressed button still read "■ MY MIX" when the learner came back to
  //    a silent page. Blur now also drops `active`.
  //  • A QUEUED PLAY UNDER THE NEXT SCREEN: tap ▶ MY MIX, then OPEN THE EQ LAB
  //    while it is RENDERING — the render finished under the pushed EQ Lab and
  //    played `pendingRef`. focusedRef AND the output gate are checked before
  //    anything is started.
  //
  // SUPERSEDED IN PART (owner 2026-09-29, later): "only stop when closed, keep
  // playing when switching screens". What is SOUNDING now plays on under a
  // pushed screen and stops on close (useStopOnClose below); opening a lab
  // that makes its own sound (the EQ Lab's audition) stops it first, through
  // labOutputOwner — never two labs at once. A NEW start (a queued render
  // finishing, a console-edit replay) still never begins under another
  // screen: focusedRef stays the gate for starts.
  const focusedRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, []),
  );

  // STAYS ARMED (owner 2026-09-29: ▶ arms a lab — every change plays the new
  // sound until ■). A console edit while a variant is sounding (or has rung
  // out with ■ still lit) re-renders the set and plays that SAME variant
  // again once the console settles (REPLAY_MS) — it used to drop to ▶ and wait
  // for a press. activeRef mirrors `active` for this effect.
  const activeRef = useRef<string | null>(null);
  activeRef.current = active;

  // New variant set → old renders (AND old listening credit) are stale.
  useEffect(() => {
    const again = activeRef.current ?? pendingRef.current ?? replayIdRef.current;
    replayIdRef.current = again;
    // Stop the sounding render FIRST. It is now stale — the console moved under
    // it — and without this the scribble strips light the new solo state while
    // the learner's ears carry on with the previous, un-soloed mix for the rest
    // of the loop. Worse, `active` goes null, so the button they pressed
    // reverts to the play glyph and NOTHING on the page stops the sound.
    playerRef.current?.stop();
    setStatus('idle');
    setActive(null);
    setPending(null);
    setMeasured({});
    setHeard([]);
    idsRef.current = [];
    pendingRef.current = null;
    // Retire any render still in flight for the OLD set: bumping the generation
    // makes it abort at its next await (so it can't reach load() and publish
    // stale ids as 'ready'), and clearing the in-flight signature keeps the
    // double-tap guard from blocking a set the user edits back to a previous
    // value.
    renderSeqRef.current++;
    renderingSigRef.current = null;
    if (!again) return;
    // Armed: replay the same variant on the new console. The queued play goes
    // through renderAll's own focus + open-gate checks; a blur or a mute
    // inside the pause forgets it here.
    // …and so does leaving the app with "Mute audio when I leave the app" OFF
    // (full run 1, 2026-10-01; the Mastering lab's useMasterPlayback fix):
    // stopAllSound leaves the gate OPEN, and inside this pause `active` and
    // `pending` are both null, so useStopWhenSilenced did not cancel it — the
    // replay rendered and played behind the user. The fence is armed now and
    // asked when the timer fires (armFence).
    const blocked = armFence(() => aliveRef.current && focusedRef.current);
    const t = setTimeout(() => {
      replayTimerRef.current = null;
      replayIdRef.current = null;
      if (blocked()) return; // muted, left, or every sound was stopped meanwhile: stay quiet
      pendingRef.current = again;
      setPending(again);
      void renderAllRef.current();
    }, REPLAY_MS);
    replayTimerRef.current = t;
    return () => {
      clearTimeout(t);
      if (replayTimerRef.current === t) replayTimerRef.current = null;
    };
  }, [signature]);

  const renderAll = useCallback(async () => {
    // Synchronous double-tap guard (see the ref declarations above). MUST run
    // before the first await, and MUST be a ref — a useState flag is not
    // visible to the second tap until React has re-rendered.
    if (renderingSigRef.current === signature) return;
    renderingSigRef.current = signature;
    const my = ++renderSeqRef.current;
    /** Still the render this screen wants? (mounted AND not superseded) */
    const current = () => aliveRef.current && my === renderSeqRef.current;
    try {
      setStatus('rendering');
      AccessibilityInfo.announceForAccessibility?.('Rendering the mix.');
      // Yield a frame so the RENDERING state paints before the DSP burst.
      await new Promise((r) => setTimeout(r, 30));
      if (!current()) return;
      const out: { id: string; mix: RenderedMix }[] = [];
      const byId: Record<string, RenderedMix> = {};
      for (const v of variants) {
        let master = v.masterDb ?? 0;
        const ropts = { mono: v.mono, sharedVerb: v.sharedVerb, busComp: v.busComp, busDriveDb: v.busDriveDb, masterWidth: v.masterWidth };
        let mix = renderMix(v.settings, master, ropts);
        // A SOLOED render is a monitor feed, not a comparison. Loudness-matching
        // one channel up to a full mix is both a lie and a clip — soloing the
        // snare asked for +14.6 dB and landed at +8 dBFS, under a page note
        // promising the render is matched "so any improvement you hear is
        // decisions, not loudness" (audit 2026-09-12).
        if (v.matchTo && byId[v.matchTo] && !soloActiveIn(v.settings)) {
          master += matchGainDb(byId[v.matchTo], mix);
          // Breathe between the probe render and the matched re-render — two
          // full renders in one tick is the freeze class the null-test page
          // hit on device (2026-09-11).
          await new Promise((r) => setTimeout(r, 0));
          if (!current()) return;
          mix = renderMix(v.settings, master, ropts);
        }
        byId[v.id] = mix;
        out.push({ id: v.id, mix });
        await new Promise((r) => setTimeout(r, 0)); // keep the UI thread breathing
        if (!current()) return;
      }
      if (!playerRef.current) {
        playerRef.current = new EarClipPlayer();
        // Natural end of a clip: ■ STAYS LIT (owner 2026-09-29 — ▶ arms the
        // lab; the next console change plays the new mix). It used to drop
        // back to ▶ here (design pass 2), so a change after the clip ended
        // was silent until the learner pressed again.
        playerRef.current.onEnded = null;
      }
      // The superseded-render check sits BEFORE load() on purpose: load() is
      // what writes the temp WAVs, so a loser never creates files to strand.
      const player = playerRef.current;
      // The fence (startFenced): a mute, a leave, or a stop-all during the
      // load means the queued play never fires; the render still lands.
      const fenced = await startFenced({
        start: () => player.load(out.map((o) => o.mix.stereo)),
        stop: () => {}, // loaded, not sounding: nothing to silence
        isCurrent: current,
      });
      if (!current()) {
        // UNMOUNTED DURING load() (perf audit 2026-09-11). load() is the slow
        // part — WAV encode + base64 + file write, ~0.5–2 s on device for up to
        // four 10 s stereo variants — and the last liveness check before it sits
        // at the end of the render loop. Leaving the screen inside that window
        // runs the unmount cleanup (dispose + playerRef = null) BEFORE load()
        // resolves, so the instance it just populated is orphaned: its
        // expo-audio players are never .remove()d and its temp WAVs (~2 MB each)
        // are never deleted. Nothing else holds a reference to do it.
        // `playerRef.current !== player` is exactly the unmounted case — a
        // merely SUPERSEDED render on a live screen leaves the ref pointing at
        // this same instance, which the winning render reuses (load() unloads
        // the old files itself), so that path is untouched.
        if (playerRef.current !== player) player.dispose();
        return;
      }
      idsRef.current = out.map((o) => o.id);
      setMeasured(Object.fromEntries(out.map((o) => [o.id, { peakDb: o.mix.peakDb, rmsDb: o.mix.rmsDb }])));
      setStatus('ready');
      const want = pendingRef.current;
      pendingRef.current = null;
      setPending(null);
      // A queued play fires only onto a screen that is still in front AND an
      // output gate that is still open (the fence above). Shake-to-mute, the
      // idle auto-mute or backgrounding can land inside the 0.5–2 s render;
      // playing then would sound with the gate locked (bug hunt 2026-09-29).
      // Either check failing drops the request — the learner presses ▶ again.
      if (fenced.status === 'started' && want && focusedRef.current) {
        const i = idsRef.current.indexOf(want);
        if (i >= 0) {
          playerRef.current.play(i);
          setActive(want);
          setHeard((h) => (h.includes(want) ? h : [...h, want]));
        }
      }
    } catch {
      // A clip write failing (disk full, cache cleared — EarClipPlayer.load
      // rethrows) escaped the `void renderAll()` callers as an unhandled
      // rejection and left the page reading RENDERING with the queued play
      // stuck (night pass 3, 2026-10-01 — the Mastering lab's fix). Back to
      // idle: the next ▶ renders afresh.
      if (current()) {
        idsRef.current = [];
        pendingRef.current = null;
        setPending(null);
        setStatus('idle');
      }
    } finally {
      // Only the generation that still owns the slot may release it.
      if (my === renderSeqRef.current) renderingSigRef.current = null;
    }
  }, [signature, variants]);
  /** play() awaits the audio gate before it may start a render; the renderAll
   *  its closure captured can be a render stale by then (a fader moved while
   *  the gate was up) and would render the OLD console (bug hunt 2026-09-29).
   *  Always call the newest one after the await. */
  const renderAllRef = useRef(renderAll);
  renderAllRef.current = renderAll;

  const play = useCallback(
    (id: string) => {
      cancelReplay();
      void (async () => {
        if (!(await requestAudioOutput())) return;
        if (!aliveRef.current || !focusedRef.current) return;
        // REFS, not `status`: the gate above is an await, and this closure's
        // `status` is the value from the render that created it. idsRef is set
        // and cleared in lockstep with status ('ready' ⇔ non-empty), so it is
        // the same test read from live state; renderAll's own synchronous
        // guard collapses a double tap instead of a stale `!== 'rendering'`.
        if (idsRef.current.length === 0) {
          pendingRef.current = id;
          setPending(id);
          void renderAllRef.current();
          return;
        }
        const i = idsRef.current.indexOf(id);
        if (i < 0 || !playerRef.current) return;
        playerRef.current.play(i);
        setActive(id);
        setHeard((h) => (h.includes(id) ? h : [...h, id]));
      })();
    },
    [requestAudioOutput, cancelReplay],
  );

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setActive(null);
  }, []);

  // Backgrounding, shake-to-mute and the idle auto-mute close the output gate
  // from outside the lab — unwind ■ (and any queued play) with it, so the
  // transport never reads "playing" over silence (bug hunt 2026-09-29).
  const stopAll = useCallback(() => {
    cancelReplay();
    pendingRef.current = null;
    setPending(null);
    stop();
  }, [stop, cancelReplay]);
  useStopWhenSilenced(active != null || pending != null, stopAll);
  // Stops on CLOSE, or when another sound lab comes to the front — not on
  // blur (owner 2026-09-29; see the focus note above).
  useStopOnClose(stopAll);

  return { status, play, stop, active, pending, measured, heard };
}

/** A/B(/C…) comparison row driven by useMixPlayback. The RENDERING banner
 *  shows only when the pending variant belongs to THIS row, and the pressed
 *  button itself carries the pending state (design pass 4). */
export function AbPlayer({ pb, variants, note }: { pb: MixPlayback; variants: readonly MixVariant[]; note?: string }) {
  const pendingHere = pb.pending != null && variants.some((v) => v.id === pb.pending);
  return (
    <View style={styles.ab}>
      <Row>
        {variants.map((v) => {
          const isActive = pb.active === v.id;
          const isPending = pb.pending === v.id;
          return (
            <Btn
              key={v.id}
              label={isActive ? `■ ${v.label}` : isPending ? `… ${v.label}` : `▶ ${v.label}`}
              tone={isActive || isPending ? 'primary' : 'plain'}
              selected={isActive || isPending}
              onPress={() => (isActive ? pb.stop() : pb.play(v.id))}
              a11y={isActive ? `Stop ${v.label}` : isPending ? `${v.label} is rendering` : `Play ${v.label}`}
            />
          );
        })}
      </Row>
      {pb.status === 'rendering' && pendingHere ? (
        <Text style={styles.rendering} accessibilityLiveRegion="polite">
          RENDERING THE MIX — real DSP, one moment…
        </Text>
      ) : null}
      {note ? <Text style={styles.abNote}>{note}</Text> : null}
    </View>
  );
}

/** The concept-list pattern the design pass standardised (page 11's term-row
 *  grammar): a short button that opens LEFT-ALIGNED prose beneath it — never
 *  a paragraph baked into a button label. */
export function ConceptList({
  items,
  opened,
  onOpen,
}: {
  items: readonly { id: string; name: string; blurb: string }[];
  opened: ReadonlySet<string>;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={styles.conceptList}>
      {items.map((it) => {
        const open = opened.has(it.id);
        return (
          <View key={it.id} style={styles.conceptRow}>
            <Btn label={open ? `✓ ${it.name}` : it.name} tone={open ? 'primary' : 'plain'} selected={open} onPress={() => onOpen(it.id)} a11y={open ? `${it.name}: ${it.blurb}` : `Open ${it.name}`} />
            {open ? <Text style={styles.conceptNote}>{it.blurb}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

/* ── the mini console ────────────────────────────────────────────────────── */

export type ConsoleShow = { fader?: boolean; pan?: boolean; mute?: boolean; pol?: boolean };

function stepValue(v: number, delta: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v + delta));
}

/** One channel strip — now drawn as GEAR (owner design pass 2026-09-11: "our
 *  console is switches and buttons… it creates no familiarity with the gear").
 *  Same wired state, same 2 dB / 25-step increments, same a11y reach — but the
 *  student now faces what they will face on a real desk, in the real order:
 *  input-section polarity at the top, PAN pot, illuminated MUTE, a long-throw
 *  fader with a true (non-linear) dB taper, and the channel name on a scribble
 *  strip at the BOTTOM — where consoles actually put the tape, and itself a
 *  recognition detail worth teaching.
 *
 *  The strip is still NOT an accessible container — an `accessible` ancestor
 *  would flatten the controls away from VoiceOver (design pass 1; the patchbay
 *  jack lesson). Each gear control carries the track name in its own label,
 *  is screen-reader `adjustable`, and keeps a visible tap path (WCAG 2.5.7 —
 *  the drag is never the only way). */
function Strip({
  id,
  value,
  onChange,
  show,
  anySolo,
  onPanGesture,
}: {
  id: TrackId;
  value: TrackSettings;
  onChange: (id: TrackId, next: Partial<TrackSettings>) => void;
  show: ConsoleShow;
  /** Freeze/unfreeze the channel scroller while a pot is being turned. */
  onPanGesture: (active: boolean) => void;
  /** True while ANY channel on the console is soloed — drives the desk-wide
   *  tape lighting (owner ruling 2026-09-11: soloed tape glows amber, every
   *  other tape turns light blue). */
  anySolo: boolean;
}) {
  const t = SESSION_TRACKS.find((x) => x.id === id)!;
  return (
    <StripFrame>
      {show.pol ? (
        <GearButton
          label="Ø"
          engaged={!!value.polarity}
          ledColor={colors.amber}
          onPress={() => onChange(id, { polarity: !value.polarity })}
          a11y={`${t.name} polarity ${value.polarity ? 'back to normal' : 'invert'}`}
        />
      ) : null}
      {show.pan ? (
        <GearKnob
          name={t.name}
          value={value.pan}
          onChange={(pan) => onChange(id, { pan: stepValue(pan, 0, -100, 100) })}
          onGestureActive={onPanGesture}
        />
      ) : null}
      {show.mute ? (
        <GearButton
          label={value.mute ? 'MUTED' : 'MUTE'}
          engaged={!!value.mute}
          onPress={() => onChange(id, { mute: !value.mute })}
          a11y={`${t.name} ${value.mute ? 'unmute' : 'mute'}`}
        />
      ) : null}
      {show.fader !== false ? (
        <GearFader
          name={t.name}
          valueDb={value.faderDb}
          onChangeDb={(db) => onChange(id, { faderDb: stepValue(db, 0, -60, 12) })}
        />
      ) : null}
      {/* The tape is also the SOLO switch (owner ruling 2026-09-11) — real
          solo-in-place, rendered by mixAudio: while any tape is lit, the
          un-lit channels are silenced in the render only; nobody's MUTE
          state is rewritten, so dropping out of solo returns the exact mix. */}
      <ScribbleStrip
        name={t.name}
        solo={value.solo ? 'soloed' : anySolo ? 'others-soloed' : 'none'}
        onToggleSolo={() => onChange(id, { solo: !value.solo })}
      />
    </StripFrame>
  );
}

/** The session console: a horizontal strip row (scrolls on phones), with an
 *  explicit swipe cue and the scroll indicator ON — off-screen strips must be
 *  discoverable (design pass 6). */
export function MiniConsole({
  tracks,
  value,
  onChange,
  show = { fader: true, pan: true, mute: true, pol: false },
}: {
  tracks: readonly TrackId[];
  value: MixSettings;
  /** A state DISPATCHER, not a plain callback: two faders moved in the same
   *  frame each spread the same stale `value`, and the second write erased the
   *  first. The functional updater merges onto the latest state instead (bug
   *  hunt 2026-09-29). Every caller passes its useState setter. */
  onChange: Dispatch<SetStateAction<MixSettings>>;
  show?: ConsoleShow;
}) {
  const change = (id: TrackId, next: Partial<TrackSettings>) =>
    onChange((prev) => ({ ...prev, [id]: { ...FLAT, ...(prev[id] ?? {}), ...next } }));
  const anySolo = tracks.some((id) => !!value[id]?.solo);
  // Owner ruling 2026-09-11: the pan band is off limits to the channel
  // scroller. Refusing the gesture in JS was not enough on device — the native
  // scroller took it anyway — so the row is genuinely DISABLED for exactly as
  // long as a pot is being turned. Same remedy the page scroller needed.
  const [panBusy, setPanBusy] = useState(false);
  return (
    <View>
      <Text style={styles.consoleCue}>{tracks.length} CHANNELS — SWIPE →</Text>
      {/* directionalLockEnabled mirrors the graphic-EQ board: iOS keeps the
          axes separate, so a fader's vertical pull cannot creep the channel
          row sideways while the page itself is frozen by the drag lock. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        directionalLockEnabled
        scrollEnabled={!panBusy}
        contentContainerStyle={styles.console}
      >
        {tracks.map((id) => (
          <Strip
            key={id}
            id={id}
            value={{ ...FLAT, ...(value[id] ?? {}) }}
            onChange={change}
            show={show}
            anySolo={anySolo}
            onPanGesture={setPanBusy}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** Cross-lab link ("link to, not duplicate" — brief requirement): navigates
 *  the ROOT stack to a sibling lab. Inert in the web preview harness (route
 *  not registered there) — guarded, never throws. */
export function OpenLabLink({ route, label }: { route: string; label: string }) {
  return (
    <Btn
      label={label}
      onPress={() => {
        try {
          if (navigationRef.isReady()) (navigationRef as { navigate: (r: string) => void }).navigate(route);
        } catch {
          /* preview harness: route absent — the button is a no-op there */
        }
      }}
      a11y={label}
    />
  );
}

/** How many tracks the learner has actually shaped (page 5 + the final). */
export function countTouched(mix: MixSettings, tracks: readonly TrackId[]): number {
  return tracks.filter((id) => {
    const s = mix[id];
    return s && ((s.faderDb ?? 0) !== 0 || (s.pan ?? 0) !== 0 || s.mute || s.polarity || s.hpHz || s.eq);
  }).length;
}

/* ── styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  mantra: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.06)', padding: 12, gap: 5 },
  mantraEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  mantraText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 9, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  chipDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
  ab: { gap: 8 },
  abNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  rendering: { color: colors.amber, fontFamily: fonts.mono, fontSize: 11.5 },
  console: { gap: 8, paddingVertical: 4 },
  consoleCue: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.4, marginBottom: 2 },
  // The stepper-column strip styles left with the stepper column itself —
  // the strip is drawn by the gear kit now (../kit/gear.tsx).
  conceptList: { gap: 8 },
  conceptRow: { gap: 4 },
  conceptNote: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
