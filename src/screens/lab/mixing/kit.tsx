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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { navigationRef } from '../../../navigation/navigationRef';
import { EarClipPlayer } from '../../../features/ear/earPlayer';
import { Btn, Row, useMarkWhen } from '../tuning/components/primitives';
import { GearButton, GearFader, GearKnob, ScribbleStrip, StripFrame } from '../kit/gear';
import type { PageCtx } from '../kit/PagedLab';
import {
  FLAT,
  matchGainDb,
  renderMix,
  type MixSettings,
  type RenderedMix,
  type SharedVerb,
  type TrackSettings,
} from './audio/mixAudio.ts';
import { SESSION_TRACKS, type TrackId } from './engine/mixModel.ts';

/* ── the learner's focal-point decision (page 1 → reused later) ──────────── */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FOCAL_KEY = 'ape:mixing:focal';
let focalCurrent: string | null = null;
const focalListeners = new Set<() => void>();
void AsyncStorage.getItem(FOCAL_KEY).then((v) => {
  if (v != null) {
    focalCurrent = v;
    focalListeners.forEach((l) => l());
  }
});

/** The song's declared focal point — a COMMITMENT, not a correct answer.
 *  Persisted so later pages (static-mix anchor) can honour it. */
export function useFocalChoice(): [string | null, (id: string) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    focalListeners.add(l);
    return () => {
      focalListeners.delete(l);
    };
  }, []);
  const set = useCallback((id: string) => {
    focalCurrent = id;
    focalListeners.forEach((l) => l());
    void AsyncStorage.setItem(FOCAL_KEY, id).catch(() => {});
  }, []);
  return [focalCurrent, set];
}

/* ── the AML mix-priorities commitment (page 2 → echoed at the final) ────── */

const PRIORITIES_KEY = 'ape:mixing:priorities';
let prioritiesCurrent: string[] = [];
const prioritiesListeners = new Set<() => void>();
void AsyncStorage.getItem(PRIORITIES_KEY).then((v) => {
  if (v) {
    try {
      prioritiesCurrent = JSON.parse(v) as string[];
      prioritiesListeners.forEach((l) => l());
    } catch {
      /* corrupt value: start empty */
    }
  }
});

/** The learner's three declared mix priorities — a commitment, not an answer. */
export function useMixPriorities(): [readonly string[], (id: string) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    prioritiesListeners.add(l);
    return () => {
      prioritiesListeners.delete(l);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    prioritiesCurrent = prioritiesCurrent.includes(id)
      ? prioritiesCurrent.filter((x) => x !== id)
      : prioritiesCurrent.length >= 3
        ? prioritiesCurrent
        : [...prioritiesCurrent, id];
    prioritiesListeners.forEach((l) => l());
    void AsyncStorage.setItem(PRIORITIES_KEY, JSON.stringify(prioritiesCurrent)).catch(() => {});
  }, []);
  return [prioritiesCurrent, toggle];
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
  const seen = useRef<boolean[]>(goals.map(() => false));
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

  // New variant set → old renders (AND old listening credit) are stale.
  useEffect(() => {
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
        if (v.matchTo && byId[v.matchTo]) {
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
        // Natural end of a clip → the ▶/■ state stops claiming "playing" over
        // silence (design pass 2).
        playerRef.current.onEnded = () => {
          if (aliveRef.current) setActive(null);
        };
      }
      // The superseded-render check sits BEFORE load() on purpose: load() is
      // what writes the temp WAVs, so a loser never creates files to strand.
      const player = playerRef.current;
      await player.load(out.map((o) => o.mix.stereo));
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
      if (want) {
        const i = idsRef.current.indexOf(want);
        if (i >= 0) {
          playerRef.current.play(i);
          setActive(want);
          setHeard((h) => (h.includes(want) ? h : [...h, want]));
        }
      }
    } finally {
      // Only the generation that still owns the slot may release it.
      if (my === renderSeqRef.current) renderingSigRef.current = null;
    }
  }, [signature, variants]);

  const play = useCallback(
    (id: string) => {
      void (async () => {
        if (!(await requestAudioOutput())) return;
        if (!aliveRef.current) return;
        // REFS, not `status`: the gate above is an await, and this closure's
        // `status` is the value from the render that created it. idsRef is set
        // and cleared in lockstep with status ('ready' ⇔ non-empty), so it is
        // the same test read from live state; renderAll's own synchronous
        // guard collapses a double tap instead of a stale `!== 'rendering'`.
        if (idsRef.current.length === 0) {
          pendingRef.current = id;
          setPending(id);
          void renderAll();
          return;
        }
        const i = idsRef.current.indexOf(id);
        if (i < 0 || !playerRef.current) return;
        playerRef.current.play(i);
        setActive(id);
        setHeard((h) => (h.includes(id) ? h : [...h, id]));
      })();
    },
    [renderAll, requestAudioOutput],
  );

  const stop = useCallback(() => {
    playerRef.current?.stop();
    setActive(null);
  }, []);

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
  onChange: (next: MixSettings) => void;
  show?: ConsoleShow;
}) {
  const change = (id: TrackId, next: Partial<TrackSettings>) =>
    onChange({ ...value, [id]: { ...FLAT, ...(value[id] ?? {}), ...next } });
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
