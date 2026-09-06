/**
 * CenterLockTuner — the tuner's FULL SCREEN stage display (owner 2026-09-06;
 * "CenterLock" is the code name only, the user sees FULL SCREEN). Opened by
 * the FULL SCREEN key inside the Frequency Counter's tuner mode; an
 * absolute-fill overlay at the screen root (never a Modal — the SPL lessons:
 * nested modals go black on iOS, and a modal whose orientations don't overlap
 * the locked one crashes).
 *
 * The design is the merged result of the two research reports
 * (docs/design/TUNER_STAGE_COMPARISON_2026_09_06.md §5), then the design and
 * bug/usability reviews of 2026-09-06:
 *  • read from standing height: enormous note + octave, string identity
 *    (numbered from the top, as players count), direction WORDS, animated
 *    chevrons, a meter on a fixed −50…+50 ¢ scale filled from centre toward
 *    the reading, a large signed cents value, magnitude as a colour spectrum;
 *  • fast acquisition, heavier damping near centre;
 *  • IN TUNE only after 350 ms stable inside ±2 ¢, one haptic, no repeat until
 *    the pitch leaves the zone and returns — timed by a 100 ms tick so a
 *    perfectly steady tone (identical frames are deduped) still confirms;
 *  • string strip with per-course status; tap a course to lock it, tap again
 *    to release; the ✓ clears when a tuned string drifts;
 *  • presets one tap deep: an instrument picker grouped by family with the
 *    three most recent on top (25 presets + piano), tuning, capo, A4, perfect
 *    fifths / equal for the bowed family; tuning/capo/A4 remembered;
 *  • double courses: an octave pair is two targets on one key, with coaching;
 *  • chromatic / winds & brass: nearest note with hysteresis, written pitch
 *    for six transpositions, a trailing-window hold readout;
 *  • piano: stretch curve, key lock with stepper and octave jumps, partial
 *    reading on bass keys;
 *  • low-string honesty: octave always visible, a coaching hint when a low
 *    target stays unstable; a signal bar; the microphone line;
 *  • silent by default; keeps the screen awake; portrait and landscape;
 *    the chip bar dims after 5 s and a tap on it only wakes it.
 * All decision logic is pure and tested in features/tools/tuner/centerLock.ts.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../theme/tokens';
import { hapticsEnabled } from '../../features/settings/store';
import { animationsAllowed } from '../../features/settings/a11y';
import { optionalModule } from '../../features/tools/capture/optionalModule';
import { lockPortrait, unlockOrientation } from '../../lib/screenOrientationSafe';
import { closeCenterLock, readTunerFrame, useTunerFrame, type TunerFrame } from '../../features/tools/tuner/tunerFrameStore';
import {
  buildTargets,
  centsBetween,
  CLOSE_CENTS,
  courseHint,
  courses,
  dampCents,
  directionText,
  displayNote,
  fmtCents,
  holdSummary,
  IN_TUNE_CENTS,
  INITIAL_HOLD,
  INITIAL_LOCK,
  INSTRUMENT_KEYS,
  INSTRUMENTS,
  instrumentsByFamily,
  lowStringHint,
  magnitudeColor,
  nearestTarget,
  OCTAVE_CENTS,
  PIANO_HIGH_MIDI,
  PIANO_LOW_MIDI,
  pianoRangeHint,
  pianoTarget,
  readAgainstPartials,
  steadinessText,
  stepChromatic,
  stepHold,
  stepLock,
  stepPianoKey,
  stepTarget,
  STRETCH_LEVELS,
  stringNumber,
  TRANSPOSITIONS,
  TUNINGS,
  wrongKeyText,
  type HoldState,
  type InstrumentKey,
  type LockState,
  type StretchKey,
  type StringTarget,
  type TargetState,
  type Temperament,
  type TranspositionKey,
} from '../../features/tools/tuner/centerLock';

const A4_CHOICES = [415, 432, 435, 438, 440, 441, 442, 443, 444];
const CONTROLS_FADE_MS = 5000;
const METER_RANGE = 50; // ±50 ¢ fixed scale
const PREFS_KEY = 'ape:centerlock:v1';
const RECENTS_MAX = 3;
const TICK_MS = 100; // the readout's clock when no new pitch frame arrives
const DRIFT_CLEAR_MS = 1000; // a ✓ clears after this long outside ±5 ¢
const PIANO_WORKFLOW_HINT = 'Set F3–F4 first, then tune outward by octaves · stretch is an average';
const PIANO_UNISON_HINT = 'Unisons are by ear · mute two strings, tune one to the display';

type KeepAwakeLib = { activateKeepAwakeAsync?: (tag?: string) => Promise<void>; deactivateKeepAwake?: (tag?: string) => Promise<void> | void };
type Prefs = { recents: InstrumentKey[]; a4?: number; per?: Partial<Record<InstrumentKey, { tuning: string; capo: number }>> };

const isKey = (k: unknown): k is InstrumentKey => typeof k === 'string' && (INSTRUMENT_KEYS as string[]).includes(k);
const haptic = (kind: 'success' | 'light') => {
  if (Platform.OS === 'web' || !hapticsEnabled()) return;
  const p = kind === 'success' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  p.catch(() => {});
};

export function CenterLockTuner() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  // ── presets ── (initial A4 from the tuner mode, read ONCE: this parent must
  // not subscribe to the pitch store, or every chip re-renders per frame)
  const [instrument, setInstrument] = useState<InstrumentKey>('guitar6');
  const [tuningKey, setTuningKey] = useState('standard');
  const [capo, setCapo] = useState(0);
  const [a4, setA4] = useState(() => readTunerFrame().a4 || 440);
  const [temperament, setTemperament] = useState<Temperament>('fifths');
  const [transpose, setTranspose] = useState<TranspositionKey>('C');
  const [stretch, setStretch] = useState<StretchKey>('typical');
  const [strobe, setStrobe] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recents, setRecents] = useState<InstrumentKey[]>([]);
  const inst = INSTRUMENTS[instrument];
  const targets = useMemo(() => buildTargets(instrument, tuningKey, a4, capo, temperament), [instrument, tuningKey, a4, capo, temperament]);
  const transposeSemis = inst.piano ? 0 : TRANSPOSITIONS.find((t) => t.key === transpose)?.semis ?? 0;
  const stretchAmount = STRETCH_LEVELS.find((s) => s.key === stretch)?.amount ?? 1;

  // Remembered: recents, A4, and tuning/capo per instrument. The stored
  // values only apply while the user has not touched anything yet.
  const prefs = useRef<Prefs>({ recents: [] });
  const chosen = useRef(false);
  const save = useCallback(() => {
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs.current)).catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        const list = (Array.isArray(parsed.recents) ? parsed.recents : []).filter(isKey).slice(0, RECENTS_MAX);
        const per = parsed.per && typeof parsed.per === 'object' ? parsed.per : {};
        prefs.current = { recents: chosen.current ? prefs.current.recents : list, a4: parsed.a4, per: { ...per, ...prefs.current.per } };
        if (chosen.current) return; // the user was faster than the disk
        setRecents(list);
        if (typeof parsed.a4 === 'number' && A4_CHOICES.includes(parsed.a4)) setA4(parsed.a4);
        if (list[0]) {
          setInstrument(list[0]);
          const p = per[list[0]];
          if (p) {
            setTuningKey(p.tuning);
            setCapo(p.capo);
          }
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const choose = useCallback(
    (k: InstrumentKey) => {
      chosen.current = true;
      const p = prefs.current.per?.[k];
      setInstrument(k);
      setTuningKey(p?.tuning ?? 'standard');
      setCapo(p?.capo ?? 0);
      setManual(false);
      setPickerOpen(false);
      setRecents((r) => {
        const next = [k, ...r.filter((x) => x !== k)].slice(0, RECENTS_MAX);
        prefs.current.recents = next;
        save();
        return next;
      });
    },
    [save],
  );
  const rememberSetup = useCallback(
    (tuning: string, c: number) => {
      chosen.current = true;
      prefs.current.per = { ...prefs.current.per, [instrument]: { tuning, capo: c } };
      save();
    },
    [instrument, save],
  );
  const rememberA4 = useCallback(
    (v: number) => {
      chosen.current = true;
      prefs.current.a4 = v;
      save();
    },
    [save],
  );

  // The per-frame machinery lives in <LiveReadout/> below, which subscribes to
  // the pitch store ITSELF — so this parent (preset chips, close key, foot)
  // never re-renders at frame rate. Owner report 2026-09-06: the buttons
  // "take a long time to respond" — every chip was re-rendering ~15×/s.
  const [manual, setManual] = useState(false);
  const targetOverride = useRef<number | null>(null);
  const [overrideTick, setOverrideTick] = useState(0); // bumps so a re-lock while already MANUAL is seen
  const pickString = useCallback((i: number, current: boolean) => {
    touch();
    if (manual && current) {
      setManual(false);
    } else {
      targetOverride.current = i;
      setManual(true);
      setOverrideTick((t) => t + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual]);

  // ── stage rules: keep awake, allow rotation, dim controls ──
  useEffect(() => {
    const ka = optionalModule<KeepAwakeLib>('expo-keep-awake');
    void ka?.activateKeepAwakeAsync?.('centerlock').catch(() => {});
    unlockOrientation();
    return () => {
      // Web throws ERR_KEEP_AWAKE_TAG_INVALID when the lock never activated.
      Promise.resolve()
        .then(() => ka?.deactivateKeepAwake?.('centerlock'))
        .catch(() => {});
      lockPortrait();
    };
  }, []);
  const [controlsShown, setControlsShown] = useState(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useCallback(() => {
    setControlsShown(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setControlsShown(false), CONTROLS_FADE_MS);
  }, []);
  useEffect(() => {
    touch();
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [touch]);

  // Preset chips. Portrait gets TWO short rows (instrument / tuning-capo-A4-
  // strobe) so far less hides off-screen; landscape has the width for one.
  // A4 is one cycling chip (415…444; long-press = 440) and CAPO one stepping
  // chip (long-press = 0). Dimmed rows do not take taps: a tap wakes them.
  const instrumentChips = (
    <>
      <Chip label={inst.name.toUpperCase()} on caret onPress={() => { touch(); setPickerOpen(true); }} accessibilityHint="Opens the instrument picker" />
      {recents
        .filter((k) => k !== instrument)
        .map((k) => (
          <Chip key={k} label={INSTRUMENTS[k].short} on={false} onPress={() => { touch(); choose(k); }} />
        ))}
    </>
  );
  const cycleA4 = () => {
    touch();
    setA4((v) => {
      const i = A4_CHOICES.indexOf(v);
      const next = A4_CHOICES[(i < 0 ? A4_CHOICES.indexOf(440) : i + 1) % A4_CHOICES.length];
      rememberA4(next);
      return next;
    });
  };
  const tunings = TUNINGS[instrument];
  const setupChips = (
    <>
      {inst.piano
        ? STRETCH_LEVELS.map((s) => (
            <Chip key={s.key} label={s.name} on={stretch === s.key} onPress={() => { touch(); setStretch(s.key); }} accessibilityHint="Sets how far the bass runs flat and the treble sharp" />
          ))
        : inst.chromatic
          ? TRANSPOSITIONS.map((t) => (
              <Chip key={t.key} label={t.name} on={transpose === t.key} onPress={() => { touch(); setTranspose(t.key); }} />
            ))
          : null}
      {tunings.length > 1
        ? tunings.map((t) => (
            <Chip key={t.key} label={t.name.toUpperCase()} on={tuningKey === t.key} onPress={() => { touch(); setTuningKey(t.key); rememberSetup(t.key, capo); }} />
          ))
        : null}
      {inst.fifths ? (
        <>
          <Chip label="PERFECT FIFTHS" on={temperament === 'fifths'} onPress={() => { touch(); setTemperament('fifths'); }} />
          <Chip label="EQUAL / PIANO" on={temperament === 'equal'} onPress={() => { touch(); setTemperament('equal'); }} />
        </>
      ) : null}
      {inst.capo ? (
        <Chip
          label={`CAPO ${capo}`}
          on={capo > 0}
          onPress={() => {
            touch();
            const next = (capo + 1) % 8;
            setCapo(next);
            rememberSetup(tuningKey, next);
          }}
          onLongPress={() => {
            touch();
            setCapo(0);
            rememberSetup(tuningKey, 0);
          }}
          accessibilityHint="Tap for the next fret, hold to remove the capo"
        />
      ) : null}
      <View style={styles.chipGap} />
      <Chip
        label={`A4 ${a4}`}
        on={a4 !== 440}
        onPress={cycleA4}
        onLongPress={() => {
          touch();
          setA4(440);
          rememberA4(440);
        }}
        small
        accessibilityHint="Tap for the next reference pitch, hold for 440"
      />
      <Chip label={strobe ? 'STROBE ±0.1¢' : 'STROBE'} on={strobe} onPress={() => { touch(); setStrobe((s) => !s); }} small />
    </>
  );

  const padTop = Math.max(insets.top, landscape ? 8 : 24) + 6;
  const padBottom = Math.max(insets.bottom, 10) + 6;
  return (
    <Pressable
      style={[styles.root, { paddingTop: padTop, paddingBottom: padBottom, paddingLeft: insets.left, paddingRight: insets.right }]}
      onPress={touch}
      accessible={false}
    >
      {/* Top bar — presets, one tap deep; dims after 5 s, a tap wakes it */}
      <View style={styles.bar}>
        <View style={[styles.barChips, { opacity: controlsShown ? 1 : 0.18 }]} pointerEvents={controlsShown ? 'auto' : 'none'}>
          {landscape ? (
            <ChipRow>
              {instrumentChips}
              <View style={styles.chipGap} />
              {setupChips}
            </ChipRow>
          ) : (
            <View style={styles.barRows}>
              <ChipRow>{instrumentChips}</ChipRow>
              <ChipRow>{setupChips}</ChipRow>
            </View>
          )}
        </View>
        <Pressable
          onPress={closeCenterLock}
          hitSlop={16}
          style={[styles.closeKey, { opacity: controlsShown ? 1 : 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Close full screen"
        >
          <Text style={styles.closeX}>✕</Text>
        </Pressable>
      </View>

      <LiveReadout
        instrument={instrument}
        targets={targets}
        a4={a4}
        transposeSemis={transposeSemis}
        stretchAmount={stretchAmount}
        manual={manual}
        targetOverride={targetOverride}
        overrideTick={overrideTick}
        strobe={strobe}
        landscape={landscape}
        width={width}
        height={height}
        padTop={padTop}
        padBottom={padBottom}
        onPickString={pickString}
        onTouch={touch}
      />

      <View style={styles.foot}>
        <Text style={styles.honesty}>
          Phone microphone · it listens to the room, not a pedal · needle ±1¢ · strobe view ±0.1¢ (estimate) · silent by design
        </Text>
      </View>

      {pickerOpen ? <InstrumentPicker current={instrument} recents={recents} onPick={choose} onClose={() => setPickerOpen(false)} /> : null}
    </Pressable>
  );
}

/** The instrument picker: recents on top, then every preset by family. */
function InstrumentPicker({ current, recents, onPick, onClose }: { current: InstrumentKey; recents: InstrumentKey[]; onPick: (k: InstrumentKey) => void; onClose: () => void }) {
  const groups = useMemo(() => instrumentsByFamily(), []);
  return (
    <View style={styles.pickerScrim} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill as object} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the instrument picker" />
      <View style={styles.pickerPanel}>
        <View style={styles.pickerHead}>
          <Text style={styles.pickerTitle}>INSTRUMENT</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.pickerClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeX}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerContent} keyboardShouldPersistTaps="handled">
          {recents.length > 0 ? (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerFamily}>RECENT</Text>
              <View style={styles.recentRow}>
                {recents.map((k) => (
                  <Chip key={k} label={INSTRUMENTS[k].short} on={k === current} onPress={() => onPick(k)} />
                ))}
              </View>
            </View>
          ) : null}
          {groups.map((g) => (
            <View key={g.family} style={styles.pickerSection}>
              <Text style={styles.pickerFamily}>{g.family.toUpperCase()}</Text>
              {g.keys.map((k) => {
                const d = INSTRUMENTS[k];
                const on = k === current;
                return (
                  <Pressable
                    key={k}
                    onPress={() => onPick(k)}
                    style={[styles.pickerRow, on && styles.pickerRowOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${d.name}, ${d.blurb}`}
                  >
                    <Text style={[styles.pickerName, on && { color: colors.amber }]}>{d.name}</Text>
                    <Text style={styles.pickerBlurb}>{d.blurb}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

type LiveReadoutProps = {
  instrument: InstrumentKey;
  targets: StringTarget[];
  a4: number;
  transposeSemis: number;
  /** Piano stretch curve scale: 0 = equal temperament, 1 = typical. */
  stretchAmount: number;
  manual: boolean;
  /** A target index the user tapped; consumed on the next tick. */
  targetOverride: React.MutableRefObject<number | null>;
  /** Changes on every tap so a re-lock while already MANUAL is processed. */
  overrideTick: number;
  strobe: boolean;
  landscape: boolean;
  width: number;
  height: number;
  /** Root paddings (safe area) so the note can be sized from the space left. */
  padTop: number;
  padBottom: number;
  onPickString: (i: number, current: boolean) => void;
  onTouch: () => void;
};

const NO_TARGET: StringTarget = { index: 0, label: 'CONCERT', note: 'A4', hz: 440, course: 0 };

type ViewState = {
  target: StringTarget;
  targetIdx: number;
  rawCents: number | null;
  shownCents: number;
  confirmed: boolean;
  partial: number;
  hold: ReturnType<typeof holdSummary>;
  hadNote: boolean;
  quietMs: number;
};

/**
 * Everything that moves at frame rate: the note, meter, cents, string strip
 * and signal bar. It subscribes to the pitch store itself and holds the pure
 * state machines in refs, so a frame re-renders THIS subtree only. A 100 ms
 * tick keeps the clocks (lock hold, hysteresis, hint timers) running when the
 * store has nothing new to say.
 */
const LiveReadout = memo(function LiveReadout({
  instrument,
  targets,
  a4,
  transposeSemis,
  stretchAmount,
  manual,
  targetOverride,
  overrideTick,
  strobe,
  landscape,
  width,
  height,
  padTop,
  padBottom,
  onPickString,
  onTouch,
}: LiveReadoutProps) {
  const frame = useTunerFrame();
  const inst = INSTRUMENTS[instrument];
  const chromatic = !!inst.chromatic;
  const piano = !!inst.piano;
  // Piano: the key being tuned. null = AUTO (nearest key); a number LOCKS the
  // key so bass strings can be read against their partials and a wrong
  // octave shows as such. Lives here because only this subtree needs it.
  const [lockedMidi, setLockedMidi] = useState<number | null>(null);
  const targetRef = useRef<TargetState>({ target: 0, candidate: null, candidateSince: null });
  const lockRef = useRef<LockState>(INITIAL_LOCK);
  const holdRef = useRef<HoldState>(INITIAL_HOLD);
  const chromMidi = useRef<number | null>(null);
  const partialRef = useRef(1);
  const shownRef = useRef(0);
  const lastTickAt = useRef(0);
  const lastFrameAt = useRef(0);
  const lastAcceptedAt = useRef(Date.now());
  const driftSince = useRef<number | null>(null);
  const tunedRef = useRef<Set<number>>(new Set());
  const [tuned, setTuned] = useState<Set<number>>(new Set());
  const [view, setView] = useState<ViewState>({
    target: targets[0] ?? NO_TARGET,
    targetIdx: 0,
    rawCents: null,
    shownCents: 0,
    confirmed: false,
    partial: 1,
    hold: null,
    hadNote: false,
    quietMs: 0,
  });
  const [mainH, setMainH] = useState(0);

  useEffect(() => {
    // Instrument changed — the piano key, chromatic note and hold mean nothing now.
    chromMidi.current = null;
    holdRef.current = INITIAL_HOLD;
    partialRef.current = 1;
    setLockedMidi(null);
  }, [instrument]);
  useEffect(() => {
    // Targets changed (tuning, capo, A4, temperament) — keep the course, re-arm the lock.
    targetRef.current = { target: Math.max(0, Math.min(targetRef.current.target, targets.length - 1)), candidate: null, candidateSince: null };
    lockRef.current = INITIAL_LOCK;
    driftSince.current = null;
    tunedRef.current = new Set();
    setTuned(new Set());
  }, [targets]);

  /** One step of the readout. Called on every new frame AND on the tick. */
  const process = useRef<(f: TunerFrame, now: number) => void>(() => {});
  process.current = (f: TunerFrame, now: number) => {
    const dt = lastTickAt.current ? now - lastTickAt.current : 16.7;
    lastTickAt.current = now;
    if (targetOverride.current != null) {
      targetRef.current = { target: Math.max(0, Math.min(targetOverride.current, targets.length - 1)), candidate: null, candidateSince: null };
      lockRef.current = INITIAL_LOCK;
      targetOverride.current = null;
    }
    const hz = f.accepted ? f.freq : null;
    if (hz != null) lastAcceptedAt.current = now;

    let rawCents: number | null = null;
    let target: StringTarget = chromatic ? view.target : (targets[targetRef.current.target] ?? NO_TARGET);
    if (piano && lockedMidi != null) {
      // Locked key: the stretched target stands; read the mic against the
      // fundamental or, on bass strings, the partial it actually hears. The
      // partial label is held between notes so it does not flicker.
      target = pianoTarget(lockedMidi, a4, stretchAmount);
      chromMidi.current = lockedMidi;
      if (hz != null && hz > 0) {
        const r = readAgainstPartials(hz, target.hz, target.hz < 80 ? 3 : 2);
        rawCents = r.cents;
        partialRef.current = r.partial;
      }
    } else if (hz != null && hz > 0) {
      if (piano) {
        const midi = stepPianoKey(chromMidi.current, hz, a4, stretchAmount);
        if (midi !== chromMidi.current) lockRef.current = INITIAL_LOCK;
        chromMidi.current = midi;
        target = pianoTarget(midi, a4, stretchAmount);
        rawCents = centsBetween(hz, target.hz);
        partialRef.current = 1;
      } else if (chromatic) {
        const step = stepChromatic(chromMidi.current, hz, a4, transposeSemis);
        if (step.midi !== chromMidi.current) lockRef.current = INITIAL_LOCK;
        chromMidi.current = step.midi;
        target = step.target;
        rawCents = centsBetween(hz, target.hz);
      } else {
        if (manual) {
          // MANUAL locks a COURSE: either string of an octave pair may be tuned.
          const lockedCourse = targets[targetRef.current.target]?.course ?? 0;
          let best = targetRef.current.target;
          let bestAbs = Infinity;
          targets.forEach((t, i) => {
            if (t.course !== lockedCourse) return;
            const c = Math.abs(centsBetween(hz, t.hz));
            if (c < bestAbs) {
              bestAbs = c;
              best = i;
            }
          });
          targetRef.current = { target: best, candidate: null, candidateSince: null };
        } else {
          const near = nearestTarget(hz, targets);
          targetRef.current = stepTarget(targetRef.current, near.i, now, false);
        }
        target = targets[targetRef.current.target] ?? NO_TARGET;
        rawCents = centsBetween(hz, target.hz);
      }
    } else if (chromatic && !piano) {
      // Silence in chromatic mode keeps the last written note on screen.
      target = view.target;
    } else if (piano) {
      target = chromMidi.current != null ? pianoTarget(chromMidi.current, a4, stretchAmount) : view.target;
    }
    const lockInput = rawCents != null && Math.abs(rawCents) < OCTAVE_CENTS ? rawCents : null;
    const lock = stepLock(lockRef.current, lockInput, now);
    lockRef.current = { inZoneSince: lock.inZoneSince, confirmed: lock.confirmed };
    const idx = targetRef.current.target;
    if (lock.justConfirmed) {
      haptic('success');
      AccessibilityInfo.announceForAccessibility(`${displayNote(target.note)} in tune`);
      if (!chromatic && !tunedRef.current.has(idx)) {
        tunedRef.current = new Set(tunedRef.current).add(idx);
        setTuned(tunedRef.current);
      }
    }
    // A ✓ is only worth showing while it is true: clear it once the string
    // has sat outside ±5 ¢ for a second with signal present.
    if (!chromatic && tunedRef.current.has(idx) && rawCents != null && Math.abs(rawCents) > CLOSE_CENTS && Math.abs(rawCents) < OCTAVE_CENTS) {
      if (driftSince.current == null) driftSince.current = now;
      else if (now - driftSince.current >= DRIFT_CLEAR_MS) {
        const next = new Set(tunedRef.current);
        next.delete(idx);
        tunedRef.current = next;
        setTuned(next);
        driftSince.current = null;
      }
    } else {
      driftSince.current = null;
    }
    if (rawCents != null) shownRef.current = dampCents(shownRef.current, Math.max(-METER_RANGE, Math.min(METER_RANGE, rawCents)), dt);
    holdRef.current = chromatic ? stepHold(holdRef.current, hz != null ? target.note : null, lockInput, now) : INITIAL_HOLD;
    const next: ViewState = {
      target,
      targetIdx: idx,
      rawCents,
      shownCents: shownRef.current,
      confirmed: lock.confirmed,
      partial: partialRef.current,
      hold: chromatic ? holdSummary(holdRef.current, now) : null,
      hadNote: view.hadNote || hz != null,
      quietMs: hz != null ? 0 : now - lastAcceptedAt.current,
    };
    setView((prev) =>
      prev.target === next.target &&
      prev.targetIdx === next.targetIdx &&
      prev.rawCents === next.rawCents &&
      prev.shownCents === next.shownCents &&
      prev.confirmed === next.confirmed &&
      prev.partial === next.partial &&
      prev.hold === next.hold &&
      prev.hadNote === next.hadNote &&
      Math.abs(prev.quietMs - next.quietMs) < 250
        ? prev
        : next,
    );
  };

  // New frame → process now. Tick → process the current frame if none came
  // in the last TICK_MS, so the lock/hint clocks advance on a steady tone.
  useEffect(() => {
    lastFrameAt.current = Date.now();
    process.current(frame, lastFrameAt.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, targets, manual, overrideTick, chromatic, piano, a4, transposeSemis, stretchAmount, lockedMidi]);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastFrameAt.current >= TICK_MS) process.current(readTunerFrame(), now);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── piano key navigation ──
  const stepKey = (delta: number) => {
    onTouch();
    setLockedMidi((m) => {
      const base = m ?? chromMidi.current ?? 69;
      return Math.max(PIANO_LOW_MIDI, Math.min(PIANO_HIGH_MIDI, base + delta));
    });
    lockRef.current = INITIAL_LOCK;
  };
  const toggleKeyLock = () => {
    onTouch();
    setLockedMidi((m) => (m == null ? (chromMidi.current ?? 69) : null));
    lockRef.current = INITIAL_LOCK;
  };

  const target = view.target;
  const cents = view.rawCents;
  const octaveOff = cents != null && Math.abs(cents) >= OCTAVE_CENTS;
  const tint = magnitudeColor(octaveOff ? null : cents);
  const wrongKey = piano && lockedMidi != null && cents != null ? wrongKeyText(cents) : null;
  const direction = wrongKey ?? directionText(cents, view.confirmed);
  const lowHint = piano ? null : lowStringHint(target.hz, view.quietMs);
  const hint = piano
    ? lockedMidi != null
      ? pianoRangeHint(target.hz, view.partial) ?? PIANO_UNISON_HINT
      : PIANO_WORKFLOW_HINT
    : lowHint ?? (chromatic ? null : courseHint(target, targets));
  const showNote = !chromatic || view.hadNote;
  const noteName = showNote ? displayNote(target.note.replace(/\d/g, '')) : '—';
  const octave = showNote ? target.note.replace(/\D/g, '') : '';
  // Animated arrows (owner 2026-09-06: "which direction the user should be
  // tuning is not clear"): flat → arrows flow UP (raise the pitch), sharp →
  // DOWN. None inside the ±2 ¢ zone or with no pitch.
  const arrowDir: -1 | 0 | 1 = cents == null || view.confirmed || wrongKey != null || Math.abs(cents) <= IN_TUNE_CENTS ? 0 : cents < 0 ? 1 : -1;
  const a4Tag = a4 !== 440 ? ` · A4 ${a4}` : '';
  const identity = piano
    ? `${target.label} · ${displayNote(target.note)}${view.partial > 1 ? ` · ${view.partial === 2 ? '2ND' : '3RD'} PARTIAL` : ''}${a4Tag}`
    : chromatic
      ? `${target.label.replace(/[A-G]#?\d/, (n) => displayNote(n))}${a4Tag}`
      : inst.numbered
        ? `STRING ${stringNumber(target, targets)} · ${target.label}${a4Tag}`
        : `${target.label}${a4Tag}`;
  // Portrait: the note is the display — half the screen width. Landscape: the
  // note, direction and cents own the left column; the meter, string strip
  // and signal bar stack in the right column (design review 2026-09-06 — a
  // single centred row overflowed and clipped the note off the left edge; the
  // usability review moved the cents beside the note so the eye stays put).
  const NOTE_COL_W = 280;
  const dirRowH = landscape ? 36 : 48;
  // The note's line box is 1.05 em. On iOS/Android the font's tall ascender
  // (Oswald: 1.19 em) overflows ABOVE that box and collided with the identity
  // line on the owner's phone (2026-09-06); the web preview centres the
  // leading and never showed it. Native gets 0.14 em of room above the glyph.
  const NOTE_TOP_EM = Platform.OS === 'web' ? 0 : 0.14;
  const NOTE_ROW_EM = 1.05 + NOTE_TOP_EM;
  // 229 = identity 24 + direction row 48 + main gap 18 + meter block 139.
  const FIXED_ABOVE_NOTE = 24 + dirRowH + 18 + 139;
  // Space left for the note block: measured when the platform reports it,
  // otherwise the arithmetic of the fixed chrome (bar 78/38, foot 32, the
  // strip/stepper/hold box, SIGNAL row and hint) — react-native-web did not
  // deliver onLayout for this view in the preview.
  const stripH = piano ? 92 : chromatic ? 68 : 74;
  const inputH = 23 + (hint ? 44 : 0);
  const estimatedMainH = height - padTop - padBottom - (landscape ? 38 : 78) - 32 - stripH - inputH;
  const mainAvail = mainH > 0 ? mainH : estimatedMainH;
  const landscapeAvail = height - padTop - padBottom - 38 - 32;
  const bigSize = Math.round(
    landscape
      ? Math.max(96, Math.min(height * 0.45, (landscapeAvail - 24 - dirRowH - 44) / NOTE_ROW_EM))
      : Math.max(96, Math.min(180, Math.min(width * 0.48, (mainAvail - FIXED_ABOVE_NOTE) / NOTE_ROW_EM))),
  );
  // One gutter: meter, keys, hold box and SIGNAL share the same width.
  const meterW = landscape ? Math.min(Math.max(240, width - NOTE_COL_W - 76), 720) : Math.min(width - 24, 720);
  const pointerX = (view.shownCents / METER_RANGE) * (meterW / 2);
  const zoneW = (IN_TUNE_CENTS / METER_RANGE) * (meterW / 2);
  const closeW = (CLOSE_CENTS / METER_RANGE) * (meterW / 2);
  const signalPct = Math.round(Math.max(0, Math.min(1, frame.confidence)) * 100);
  // One key per COURSE, sized to share a single row (7 keys on a 375 phone).
  const groups = useMemo(() => courses(targets), [targets]);
  const stripW = (landscape ? meterW : width) - 24;
  const keyW = groups.length ? Math.min(60, Math.floor((stripW - (groups.length - 1) * 6) / groups.length)) : 0;
  const currentBorder = cents == null ? '#e8ecf2' : tint;

  const holdBox = (
    <View style={[styles.holdWrap, { width: landscape ? meterW : stripW }, piano && styles.holdWrapPiano]} accessibilityLiveRegion="polite">
      {view.hold ? (
        piano ? (
          <Text style={[styles.holdLine, { color: magnitudeColor(view.hold.avg) }]} numberOfLines={1}>
            {`LAST 1.5 s · AVG ${fmtCents(view.hold.avg)} · ${steadinessText(view.hold.spread)} · SPREAD ±${view.hold.spread.toFixed(0)}¢`}
          </Text>
        ) : (
          <>
            <Text style={[styles.holdMain, { color: magnitudeColor(view.hold.avg) }]}>{`LAST 1.5 s · AVG ${fmtCents(view.hold.avg)}`}</Text>
            <Text style={styles.holdSub}>{`${steadinessText(view.hold.spread)} · SPREAD ±${view.hold.spread.toFixed(1)}¢ · HELD ${(view.hold.ms / 1000).toFixed(1)} s`}</Text>
          </>
        )
      ) : (
        <Text style={styles.holdIdle}>{piano ? 'HOLD A KEY FOR THE STEADINESS READOUT' : 'SUSTAIN A NOTE FOR THE HOLD READOUT'}</Text>
      )}
    </View>
  );
  const atLow = lockedMidi != null && lockedMidi <= PIANO_LOW_MIDI;
  const atHigh = lockedMidi != null && lockedMidi >= PIANO_HIGH_MIDI;
  const strip = piano ? (
    <View style={[styles.pianoBlock, { width: stripW }]}>
      <View style={styles.keyRow}>
        <RepeatKey label="−OCT" onStep={() => stepKey(-12)} disabled={atLow} accessibilityLabel="Down an octave" narrow />
        <RepeatKey label="◀" onStep={() => stepKey(-1)} disabled={atLow} accessibilityLabel="Previous key" />
        <Pressable
          onPress={toggleKeyLock}
          style={[styles.keyLock, lockedMidi != null && styles.keyLockOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: lockedMidi != null }}
          accessibilityLabel={lockedMidi != null ? `Key ${target.index} ${displayNote(target.note)} locked, tap for auto` : 'Auto key, tap to lock the key being tuned'}
        >
          <Text style={[styles.keyLockMain, lockedMidi != null && { color: colors.amber }]}>{`${target.label} · ${displayNote(target.note)}`}</Text>
          <Text style={styles.keyLockSub}>{lockedMidi != null ? `LOCKED · STRETCH ${fmtCents((target as { stretch?: number }).stretch ?? 0)}` : 'AUTO · TAP TO LOCK THE KEY'}</Text>
        </Pressable>
        <RepeatKey label="▶" onStep={() => stepKey(1)} disabled={atHigh} accessibilityLabel="Next key" />
        <RepeatKey label="+OCT" onStep={() => stepKey(12)} disabled={atHigh} accessibilityLabel="Up an octave" narrow />
      </View>
      {holdBox}
    </View>
  ) : chromatic ? (
    holdBox
  ) : (
    <View style={[styles.strip, { width: stripW }]}>
      {groups.map((g) => {
        const first = targets.indexOf(g[0]);
        const current = g.some((t) => targets.indexOf(t) === view.targetIdx);
        const locked = current && manual;
        const done = g.every((t) => tuned.has(targets.indexOf(t)));
        const pair = g.length > 1;
        return (
          <Pressable
            key={g[0].index}
            onPress={() => onPickString(first, current)}
            style={[styles.stringKey, { width: keyW }, current && styles.stringKeyOn, current && { borderColor: currentBorder }, locked && styles.stringKeyLocked]}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            accessibilityLabel={`${g[0].label} ${g.map((t) => displayNote(t.note)).join(' and ')}${done ? ', in tune' : ''}${locked ? ', locked' : ''}`}
            accessibilityHint={locked ? 'Tap to release' : 'Tap to lock this string'}
          >
            <Text style={[styles.stringNote, pair && styles.stringNotePair, pair && keyW < 48 && styles.stringNotePairNarrow, current && { color: locked ? colors.amber : currentBorder }]} numberOfLines={1}>
              {pair ? `${displayNote(g[0].note)}·${displayNote(g[1].note)}` : displayNote(g[0].note)}
            </Text>
            <Text style={[styles.stringLabel, locked && { color: colors.amber }]} numberOfLines={1}>{locked ? 'LOCKED' : g[0].label}</Text>
            {done ? (
              <View style={styles.tunedMark}>
                <Text style={styles.tunedMarkText}>✓</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
  const input = (
    <View style={[styles.confWrap, landscape && styles.confWrapLandscape]}>
      <View style={styles.confRow}>
        <Text style={styles.footLabel}>SIGNAL</Text>
        <View style={styles.confTrack} accessible accessibilityRole="progressbar" accessibilityLabel="Pitch signal confidence" accessibilityValue={{ min: 0, max: 100, now: signalPct }}>
          <View style={[styles.confFill, { width: `${signalPct}%`, backgroundColor: signalPct > 60 ? '#37e05f' : signalPct > 30 ? colors.amber : '#f0603a' }]} />
        </View>
        <Text style={styles.confPct}>{`${signalPct}%`}</Text>
      </View>
      {hint ? <Text style={styles.hint} numberOfLines={landscape ? 1 : 2}>{hint}</Text> : null}
    </View>
  );

  const centsText = (
    <Text style={[styles.cents, landscape && styles.centsLandscape, { color: tint }]}>{octaveOff ? (cents! > 0 ? '+1 OCT' : '−1 OCT') : fmtCents(cents)}</Text>
  );
  const noteBlock = (
    <View style={[styles.noteBlock, landscape ? { width: NOTE_COL_W } : { maxWidth: width - 16 }]} accessible accessibilityRole="text" accessibilityLabel={`${displayNote(target.note)}, ${direction}, ${fmtCents(cents)}`}>
      <View style={styles.identityRow}>
        <Text style={[styles.identity, { color: tint }]} numberOfLines={1}>{identity}</Text>
        {!chromatic && manual ? (
          <View style={[styles.modeTag, { borderColor: colors.amber }]}>
            <Text style={[styles.modeText, { color: colors.amber }]}>LOCKED</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.noteRow, { paddingTop: Math.round(bigSize * NOTE_TOP_EM) }]}>
        <Text style={[styles.note, { fontSize: bigSize, lineHeight: Math.round(bigSize * 1.05), color: view.confirmed ? '#37e05f' : colors.textPrimary }]}>{noteName}</Text>
        {octave ? (
          <Text style={[styles.octave, { fontSize: Math.round(bigSize * 0.42), marginBottom: Math.round(bigSize * 0.08), color: view.confirmed ? '#37e05f' : colors.textSecondary }]}>{octave}</Text>
        ) : null}
      </View>
      <View style={[styles.directionRow, { height: dirRowH }]}>
        {arrowDir ? <TuneArrows dir={arrowDir} tint={tint} compact={landscape} /> : <View style={[styles.arrowSpacer, landscape && styles.arrowSpacerCompact]} />}
        <Text style={[styles.direction, landscape && styles.directionLandscape, { color: tint }]} accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit>
          {chromatic && cents == null ? 'PLAY A NOTE' : direction}
        </Text>
        {arrowDir ? <TuneArrows dir={arrowDir} tint={tint} compact={landscape} /> : <View style={[styles.arrowSpacer, landscape && styles.arrowSpacerCompact]} />}
      </View>
      {landscape ? centsText : null}
    </View>
  );

  // An element, not a nested component: a component defined inside render
  // would remount the meter (and kill the strobe's animation loop) every frame.
  // The fill runs from centre TOWARD the reading, so the lit side is the side
  // the pitch is on (usability review: mirrored wedges hid direction).
  const fillW = Math.abs(pointerX);
  const meter = (
    <View style={styles.meterBlock}>
      <View style={[styles.meter, { width: meterW }]} accessible accessibilityRole="adjustable" accessibilityLabel="Tuning meter" accessibilityValue={{ min: -50, max: 50, now: Math.round(view.shownCents) }}>
        <View style={styles.meterTrack} />
        <View style={[styles.closeBand, { width: closeW * 2, left: meterW / 2 - closeW }]} />
        {cents != null && !octaveOff ? (
          <View style={[styles.fill, { backgroundColor: tint, width: Math.max(0, fillW), left: pointerX < 0 ? meterW / 2 - fillW : meterW / 2 }]} />
        ) : null}
        <View style={[styles.zone, { width: zoneW * 2, left: meterW / 2 - zoneW }, view.confirmed && styles.zoneLocked]} />
        {[-50, -25, 0, 25, 50].map((t) => (
          <View key={t} style={[styles.tick, { left: meterW / 2 + (t / METER_RANGE) * (meterW / 2) - 1 }, t === 0 && styles.tickZero]} />
        ))}
        {cents != null && !octaveOff ? <View style={[styles.pointer, { backgroundColor: tint, left: meterW / 2 + pointerX - 5 }]} /> : null}
      </View>
      {strobe && landscape ? null : (
        <View style={[styles.scaleRow, { width: meterW }]}>
          <Text style={styles.scaleText}>−50 FLAT</Text>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>SHARP +50</Text>
        </View>
      )}
      {strobe ? <StrobeBand cents={octaveOff ? null : cents} width={meterW} tint={tint} endLabels={landscape} /> : null}
      {landscape ? null : centsText}
    </View>
  );

  if (landscape) {
    return (
      <View style={styles.mainLandscape}>
        {noteBlock}
        <View style={[styles.rightCol, { width: meterW }]}>
          {meter}
          {strip}
          {input}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.main} onLayout={(e) => setMainH(Math.round(e.nativeEvent.layout.height))}>
        {noteBlock}
        {meter}
      </View>
      {strip}
      {input}
    </>
  );
});

/** A stepper key that repeats while held (piano technicians step a lot). */
function RepeatKey({ label, onStep, disabled, accessibilityLabel, narrow }: { label: string; onStep: () => void; disabled: boolean; accessibilityLabel: string; narrow?: boolean }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (interval.current) clearInterval(interval.current);
    timer.current = null;
    interval.current = null;
  };
  useEffect(() => stop, []);
  return (
    <Pressable
      onPress={() => {
        if (!disabled) onStep();
      }}
      onPressIn={() => {
        if (disabled) return;
        stop();
        timer.current = setTimeout(() => {
          interval.current = setInterval(onStep, 90);
        }, 450);
      }}
      onPressOut={stop}
      disabled={disabled}
      hitSlop={6}
      style={[styles.keyStep, narrow && styles.keyStepNarrow, disabled && styles.keyStepOff]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      accessibilityHint="Hold to repeat"
    >
      <Text style={[styles.keyStepText, narrow && styles.keyStepTextNarrow]}>{label}</Text>
    </Pressable>
  );
}

/** A horizontal chip row that shows a chevron while more chips hide off the
 *  right edge — on a phone the row is wider than the screen. */
function ChipRow({ children }: { children: React.ReactNode }) {
  const [more, setMore] = useState(false);
  const sizes = useRef({ content: 0, layout: 0, x: 0 });
  const recompute = () => {
    const { content, layout, x } = sizes.current;
    setMore(content > layout + 2 && x + layout < content - 6);
  };
  return (
    <View style={styles.chipRowWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        onContentSizeChange={(w) => {
          sizes.current.content = w;
          recompute();
        }}
        onLayout={(e) => {
          sizes.current.layout = e.nativeEvent.layout.width;
          recompute();
        }}
        onScroll={(e) => {
          sizes.current.x = e.nativeEvent.contentOffset.x;
          recompute();
        }}
        scrollEventThrottle={48}
      >
        {children}
      </ScrollView>
      {more ? (
        <View pointerEvents="none" style={styles.chipMore}>
          <Text style={styles.chipMoreText}>›</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Three chevrons flowing in the direction the pitch must move: up to raise,
 * down to lower. Colour is the magnitude tint; the words carry the meaning,
 * so the arrows are decorative for assistive tech. Reduce-motion shows a
 * still stack.
 */
const ARROW_SIZE = 24;
const ARROW_TRAVEL = 14;
function TuneArrows({ dir, tint, compact }: { dir: -1 | 1; tint: string; compact?: boolean }) {
  const progress = useSharedValue(0);
  const allowed = animationsAllowed();
  useEffect(() => {
    if (!allowed) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(progress);
  }, [allowed, progress]);
  return (
    <View style={[styles.arrows, compact && styles.arrowsCompact]} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => (
        <Chevron key={i} i={i} dir={dir} tint={tint} progress={progress} allowed={allowed} scale={compact ? 0.8 : 1} />
      ))}
    </View>
  );
}

function Chevron({ i, dir, tint, progress, allowed, scale }: { i: number; dir: -1 | 1; tint: string; progress: SharedValue<number>; allowed: boolean; scale: number }) {
  const style = useAnimatedStyle(() => {
    const rotate = dir > 0 ? '45deg' : '225deg';
    if (!allowed) {
      // Still stack: three chevrons spaced along the direction, fading away.
      return { opacity: 1 - i * 0.3, transform: [{ translateY: -dir * (i - 1) * ARROW_SIZE * 0.75 * scale }, { rotate }, { scale }] };
    }
    const phase = (progress.value + i / 3) % 1;
    const y = dir * (ARROW_TRAVEL - 2 * ARROW_TRAVEL * phase) * scale;
    return { opacity: Math.sin(phase * Math.PI), transform: [{ translateY: y }, { rotate }, { scale }] };
  }, [allowed, dir, i, scale]);
  return <Animated.View style={[styles.chevron, { borderColor: tint }, style]} />;
}

/** Expert strobe view: stripes drift left when flat, right when sharp, and
 *  stand still in tune. Rate is proportional to cents; no engine changes.
 *  `endLabels` prints FLAT/SHARP inside the band when the scale row is hidden. */
function StrobeBand({ cents, width, tint, endLabels }: { cents: number | null; width: number; tint: string; endLabels?: boolean }) {
  const [offset, setOffset] = useState(0);
  const centsRef = useRef<number | null>(cents);
  centsRef.current = cents;
  useEffect(() => {
    let raf: ReturnType<typeof requestAnimationFrame> | null = null;
    let last = Date.now();
    let off = 0;
    const tick = () => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      const c = centsRef.current;
      if (c != null) off = (off + c * 12 * dt + STRIPE_PERIOD * 1000) % STRIPE_PERIOD; // 12 px/s per cent
      setOffset(off);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);
  const n = Math.ceil(width / STRIPE_PERIOD) + 2;
  return (
    <View style={[styles.strobe, { width }]} accessible accessibilityLabel="Strobe view: stripes stand still when in tune">
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[styles.stripe, { left: i * STRIPE_PERIOD - STRIPE_PERIOD + offset, backgroundColor: tint }]} />
      ))}
      {endLabels ? (
        <>
          <Text style={[styles.strobeEnd, { left: 6 }]}>FLAT</Text>
          <Text style={[styles.strobeEnd, { right: 6 }]}>SHARP</Text>
        </>
      ) : null}
    </View>
  );
}
const STRIPE_PERIOD = 24;

function Chip({
  label,
  on,
  onPress,
  onLongPress,
  small,
  caret,
  accessibilityHint,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  small?: boolean;
  caret?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={6}
      style={[styles.chip, on && styles.chipOn, small && styles.chipSmall, caret && styles.chipWithCaret]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
      {caret ? <View style={[styles.caret, { borderColor: on ? colors.amber : colors.textSecondary }]} /> : null}
    </Pressable>
  );
}

const DIM = '#9a9ea8';

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#050506', zIndex: 80 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
  barChips: { flex: 1 },
  barRows: { flex: 1, gap: 6 },
  chipRowWrap: { flex: 1 },
  chips: { gap: 6, alignItems: 'center', paddingRight: 28 },
  chipGap: { width: 10 },
  chipMore: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, alignItems: 'flex-end', justifyContent: 'center', backgroundColor: '#050506' },
  chipMoreText: { fontSize: 22, lineHeight: 24, color: colors.amber, fontWeight: '700' },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2a2b31', backgroundColor: '#121318', paddingVertical: 8, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  chipSmall: { paddingHorizontal: 9 },
  chipWithCaret: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caret: { width: 8, height: 8, borderRightWidth: 2, borderBottomWidth: 2, transform: [{ rotate: '45deg' }], marginTop: -4 },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  chipTextOn: { color: colors.amber },
  closeKey: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111214', borderWidth: 1, borderColor: '#2a2b31' },
  closeX: { fontSize: 17, color: '#e8ecf2', fontWeight: '600' },

  // minHeight 0: on web a flex:1 box will not shrink below its content, which
  // made the measured height feed the note size in a loop and overflow the SE.
  main: { flex: 1, minHeight: 0, justifyContent: 'center', alignItems: 'center', gap: 18 },
  mainLandscape: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 16 },
  rightCol: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  noteBlock: { alignItems: 'center', minWidth: 200 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identity: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 2.2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: Platform.OS === 'web' ? -8 : 0 },
  note: { fontFamily: fonts.oswaldBold, letterSpacing: -2, includeFontPadding: false },
  octave: { fontFamily: fonts.oswaldMedium, marginLeft: 6 },
  directionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 2, alignSelf: 'stretch', overflow: 'hidden' },
  direction: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, letterSpacing: 2.4, textAlign: 'center', flexShrink: 1 },
  directionLandscape: { fontSize: 19, letterSpacing: 1.8 },
  arrows: { width: ARROW_SIZE + 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  arrowsCompact: { width: ARROW_SIZE, height: 36 },
  arrowSpacer: { width: ARROW_SIZE + 12, height: 48 },
  arrowSpacerCompact: { width: ARROW_SIZE, height: 36 },
  chevron: { position: 'absolute', width: ARROW_SIZE, height: ARROW_SIZE, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#fff', borderTopLeftRadius: 2 },

  meterBlock: { alignItems: 'center', gap: 6 },
  meter: { height: 56, justifyContent: 'center' },
  meterTrack: { position: 'absolute', left: 0, right: 0, height: 10, top: 23, borderRadius: 5, backgroundColor: '#17181d' },
  closeBand: { position: 'absolute', top: 19, height: 18, borderRadius: 4, backgroundColor: 'rgba(155,224,74,0.14)' },
  fill: { position: 'absolute', top: 20, height: 16, borderRadius: 4, opacity: 0.85 },
  zone: { position: 'absolute', top: 12, height: 32, borderRadius: 6, borderWidth: 2, borderColor: '#37e05f', backgroundColor: 'transparent' },
  zoneLocked: { backgroundColor: 'rgba(55,224,95,0.35)' },
  tick: { position: 'absolute', top: 44, width: 2, height: 8, backgroundColor: '#3a3b43' },
  tickZero: { top: 42, height: 12, backgroundColor: '#8a8b93' },
  pointer: { position: 'absolute', top: 6, width: 10, height: 44, borderRadius: 5 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: DIM },
  cents: { fontFamily: fonts.oswaldSemiBold, fontSize: 46, lineHeight: 52, letterSpacing: 1, marginTop: 4 },
  centsLandscape: { fontSize: 40, lineHeight: 44, marginTop: 0 },
  strobe: { height: 22, overflow: 'hidden', borderRadius: 4, backgroundColor: '#101116', marginTop: 6 },
  stripe: { position: 'absolute', top: 0, bottom: 0, width: STRIPE_PERIOD / 2, opacity: 0.85 },
  strobeEnd: { position: 'absolute', top: 4, fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#050506', backgroundColor: 'rgba(232,236,242,0.85)', paddingHorizontal: 4, borderRadius: 3 },

  strip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 6, paddingBottom: 12 },
  stringKey: { height: 56, paddingHorizontal: 3, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center' },
  stringKeyOn: { backgroundColor: '#141a16' },
  stringKeyLocked: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  stringNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 24, color: colors.textSecondary },
  stringNotePair: { fontSize: 14, letterSpacing: 0.2 },
  stringNotePairNarrow: { fontSize: 12 },
  stringLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, lineHeight: 13, letterSpacing: 1.2, color: DIM, marginTop: 1 },
  tunedMark: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#37e05f', alignItems: 'center', justifyContent: 'center' },
  tunedMarkText: { fontSize: 11, lineHeight: 13, fontWeight: '800', color: '#050506' },
  modeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#2a2b31' },
  modeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: DIM },
  holdWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 68, gap: 4, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1f2026', backgroundColor: '#0c0d11' },
  holdMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.6, textAlign: 'center' },
  holdSub: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.0, color: DIM, textAlign: 'center' },
  holdIdle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: DIM, textAlign: 'center' },
  holdLine: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.0, textAlign: 'center' },
  holdWrapPiano: { minHeight: 0, paddingVertical: 8, width: '100%' },
  pianoBlock: { alignSelf: 'center', gap: 6, paddingTop: 2, paddingBottom: 4 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyStep: { width: 44, height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center' },
  keyStepNarrow: { width: 44 },
  keyStepOff: { opacity: 0.35 },
  keyStepText: { fontSize: 16, color: colors.textSecondary },
  keyStepTextNarrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.8 },
  keyLock: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, gap: 1 },
  keyLockOn: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  keyLockMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.2, color: colors.textPrimary },
  keyLockSub: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.1, color: DIM },

  foot: { paddingHorizontal: 16, paddingTop: 4, gap: 6, alignItems: 'center' },
  confWrap: { alignSelf: 'stretch', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  confWrapLandscape: { paddingHorizontal: 0 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 720 },
  confTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#17181d', overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 3 },
  footLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: DIM, minWidth: 44 },
  confPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: DIM, minWidth: 36, textAlign: 'right' },
  hint: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amber, textAlign: 'center' },
  honesty: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.4, color: '#6b6f7a', textAlign: 'center', lineHeight: 14 },

  pickerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  pickerPanel: { width: '100%', maxWidth: 560, maxHeight: '88%', borderRadius: 16, borderWidth: 1, borderColor: '#2a2b31', backgroundColor: '#0e0f13', overflow: 'hidden' },
  pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1f2026' },
  pickerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 2.4, color: colors.amber },
  pickerClose: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#15161b' },
  pickerScroll: { flexGrow: 0 },
  pickerContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 20 },
  pickerSection: { gap: 8 },
  pickerFamily: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 2, color: DIM, paddingHorizontal: 4 },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 },
  pickerRow: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1f2026', backgroundColor: '#121318', minHeight: 48, justifyContent: 'center' },
  pickerRowOn: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  pickerName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  pickerBlurb: { fontFamily: fonts.barlowMedium, fontSize: 12, color: '#8a8b93', marginTop: 1 },
});
