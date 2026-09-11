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
  }, [signature]);

  const renderAll = useCallback(async () => {
    setStatus('rendering');
    AccessibilityInfo.announceForAccessibility?.('Rendering the mix.');
    // Yield a frame so the RENDERING state paints before the DSP burst.
    await new Promise((r) => setTimeout(r, 30));
    const out: { id: string; mix: RenderedMix }[] = [];
    const byId: Record<string, RenderedMix> = {};
    for (const v of variants) {
      let master = v.masterDb ?? 0;
      const ropts = { mono: v.mono, sharedVerb: v.sharedVerb, busComp: v.busComp, busDriveDb: v.busDriveDb, masterWidth: v.masterWidth };
      let mix = renderMix(v.settings, master, ropts);
      if (v.matchTo && byId[v.matchTo]) {
        master += matchGainDb(byId[v.matchTo], mix);
        mix = renderMix(v.settings, master, ropts);
      }
      byId[v.id] = mix;
      out.push({ id: v.id, mix });
      await new Promise((r) => setTimeout(r, 0)); // keep the UI thread breathing
      if (!aliveRef.current) return;
    }
    if (!playerRef.current) {
      playerRef.current = new EarClipPlayer();
      // Natural end of a clip → the ▶/■ state stops claiming "playing" over
      // silence (design pass 2).
      playerRef.current.onEnded = () => {
        if (aliveRef.current) setActive(null);
      };
    }
    await playerRef.current.load(out.map((o) => o.mix.stereo));
    if (!aliveRef.current) return;
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
  }, [variants]);

  const play = useCallback(
    (id: string) => {
      void (async () => {
        if (!(await requestAudioOutput())) return;
        if (status !== 'ready' || idsRef.current.length === 0) {
          pendingRef.current = id;
          setPending(id);
          if (status !== 'rendering') void renderAll();
          return;
        }
        const i = idsRef.current.indexOf(id);
        if (i < 0 || !playerRef.current) return;
        playerRef.current.play(i);
        setActive(id);
        setHeard((h) => (h.includes(id) ? h : [...h, id]));
      })();
    },
    [renderAll, requestAudioOutput, status],
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

/** One channel strip. Steppers, not drags: every control is a 44 pt button.
 *  The strip itself is NOT an accessible container — an `accessible` ancestor
 *  would flatten the buttons away from VoiceOver (design pass 1; the patchbay
 *  jack lesson). Each inner button's label carries the track name. */
function Strip({
  id,
  value,
  onChange,
  show,
}: {
  id: TrackId;
  value: TrackSettings;
  onChange: (id: TrackId, next: Partial<TrackSettings>) => void;
  show: ConsoleShow;
}) {
  const t = SESSION_TRACKS.find((x) => x.id === id)!;
  const faderLabel = value.faderDb <= -60 ? '−∞' : `${value.faderDb > 0 ? '+' : ''}${value.faderDb}`;
  const panLabel = value.pan === 0 ? 'C' : value.pan < 0 ? `L${Math.abs(value.pan)}` : `R${value.pan}`;
  return (
    <View style={styles.strip}>
      <Text style={styles.stripName} accessibilityRole="header">
        {t.name}
      </Text>
      {show.fader !== false ? (
        <View style={styles.stripBlock}>
          <Btn label="+" onPress={() => onChange(id, { faderDb: stepValue(value.faderDb, 2, -60, 12) })} a11y={`${t.name} fader up 2 dB, now ${faderLabel} dB`} />
          <Text style={styles.stripValue} accessible accessibilityLabel={`${t.name} fader ${faderLabel} dB`}>
            {faderLabel}
          </Text>
          <Btn label="−" onPress={() => onChange(id, { faderDb: stepValue(value.faderDb, -2, -60, 12) })} a11y={`${t.name} fader down 2 dB, now ${faderLabel} dB`} />
        </View>
      ) : null}
      {show.pan ? (
        <View style={styles.stripBlock}>
          <Btn label="◀" onPress={() => onChange(id, { pan: stepValue(value.pan, -25, -100, 100) })} a11y={`${t.name} pan left, now ${panLabel}`} />
          <Text style={styles.stripValue} accessible accessibilityLabel={`${t.name} pan ${panLabel}`}>
            {panLabel}
          </Text>
          <Btn label="▶" onPress={() => onChange(id, { pan: stepValue(value.pan, 25, -100, 100) })} a11y={`${t.name} pan right, now ${panLabel}`} />
        </View>
      ) : null}
      {/* Full-width stacked toggles: side-by-side pairs fell under 44 pt
          (design pass 8). Mute keeps the DAW-red convention deliberately. */}
      {show.mute ? (
        <Btn label={value.mute ? 'MUTED' : 'MUTE'} tone={value.mute ? 'danger' : 'plain'} selected={value.mute} onPress={() => onChange(id, { mute: !value.mute })} a11y={`${t.name} ${value.mute ? 'unmute' : 'mute'}`} />
      ) : null}
      {show.pol ? (
        <Btn label={value.polarity ? 'Ø ON' : 'Ø'} tone={value.polarity ? 'primary' : 'plain'} selected={value.polarity} onPress={() => onChange(id, { polarity: !value.polarity })} a11y={`${t.name} polarity ${value.polarity ? 'back to normal' : 'invert'}`} />
      ) : null}
    </View>
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
  return (
    <View>
      <Text style={styles.consoleCue}>{tracks.length} CHANNELS — SWIPE →</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.console}>
        {tracks.map((id) => (
          <Strip key={id} id={id} value={{ ...FLAT, ...(value[id] ?? {}) }} onChange={change} show={show} />
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
  strip: { width: 88, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 8, gap: 8, alignItems: 'stretch' },
  stripName: { color: colors.amberLabel, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, textAlign: 'center' },
  stripBlock: { gap: 6 },
  stripValue: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 13, textAlign: 'center' },
  conceptList: { gap: 8 },
  conceptRow: { gap: 4 },
  conceptNote: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
