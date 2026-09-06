/**
 * CenterLockTuner — the ONE fullscreen stage display of the tuner (owner
 * 2026-09-06). Opened by the CENTERLOCK key inside the Frequency Counter's
 * tuner mode; an absolute-fill overlay at the screen root (never a Modal — the
 * SPL lessons: nested modals go black on iOS, and a modal whose orientations
 * don't overlap the locked one crashes).
 *
 * The design is the merged result of the two research reports
 * (docs/design/TUNER_STAGE_COMPARISON_2026_09_06.md §5):
 *  • read from standing height: enormous note + octave, string identity,
 *    direction WORDS, a converging meter on a fixed −50…+50 ¢ scale, a large
 *    signed cents value, magnitude as a colour spectrum — never colour alone;
 *  • fast acquisition, heavier damping near centre;
 *  • IN TUNE only after 350 ms stable inside ±2 ¢, one haptic, no repeat until
 *    the pitch leaves the zone and returns;
 *  • string strip with per-course status; tap a course to lock it (MANUAL),
 *    tap again for AUTO; AUTO re-targets only after a stable candidate;
 *  • presets one tap deep: an instrument picker grouped by family with the
 *    three most recent on top (25 presets, owner brief 2026-09-06), tuning,
 *    capo, A4, perfect fifths / equal for the bowed family;
 *  • double courses: an octave pair is two targets on one key, with coaching
 *    to tune one string at a time;
 *  • chromatic / winds & brass: nearest note with hysteresis, written pitch
 *    for B♭, E♭ and F instruments, a sustained-tone hold readout;
 *  • low-string honesty: octave always visible, a coaching hint when a low
 *    target stays unstable; an input confidence bar; the microphone line;
 *  • silent by default; keeps the screen awake; portrait and landscape;
 *    controls fade after 2 s of no touch; STROBE is an expert view, not default.
 * All decision logic is pure and tested in features/tools/tuner/centerLock.ts.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../theme/tokens';
import { hapticsEnabled } from '../../features/settings/store';
import { animationsAllowed } from '../../features/settings/a11y';
import { optionalModule } from '../../features/tools/capture/optionalModule';
import { lockPortrait, unlockOrientation } from '../../lib/screenOrientationSafe';
import { closeCenterLock, readTunerFrame, useTunerFrame } from '../../features/tools/tuner/tunerFrameStore';
import {
  buildTargets,
  centsBetween,
  CLOSE_CENTS,
  courseHint,
  courses,
  dampCents,
  directionText,
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
  stepTarget,
  STRETCH_LEVELS,
  TRANSPOSITIONS,
  TUNINGS,
  type HoldState,
  type InstrumentKey,
  type LockState,
  type StretchKey,
  type StringTarget,
  type TargetState,
  type Temperament,
  type TranspositionKey,
} from '../../features/tools/tuner/centerLock';

const PIANO_WORKFLOW_HINT = 'Set F3–F4 first, then tune outward by octaves · stretch is an average';
const PIANO_UNISON_HINT = 'A waver in the hold readout hints at unison beats · the final beat rates are yours';

const A4_CHOICES = [415, 432, 435, 438, 440, 441, 442, 443, 444];
const CONTROLS_FADE_MS = 2000;
const METER_RANGE = 50; // ±50 ¢ fixed scale
const RECENTS_KEY = 'ape:centerlock:v1';
const RECENTS_MAX = 3;

type KeepAwakeLib = { activateKeepAwakeAsync?: (tag?: string) => Promise<void>; deactivateKeepAwake?: (tag?: string) => Promise<void> | void };

const isKey = (k: unknown): k is InstrumentKey => typeof k === 'string' && (INSTRUMENT_KEYS as string[]).includes(k);

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

  // Recents: the last instrument comes back on the next open.
  const chosen = useRef(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(RECENTS_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        const parsed = JSON.parse(raw) as { recents?: unknown[] };
        const list = (parsed.recents ?? []).filter(isKey).slice(0, RECENTS_MAX);
        setRecents(list);
        if (list[0] && !chosen.current) setInstrument(list[0]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const choose = useCallback((k: InstrumentKey) => {
    chosen.current = true;
    setInstrument(k);
    setTuningKey('standard');
    setCapo(0);
    setManual(false);
    setPickerOpen(false);
    setRecents((r) => {
      const next = [k, ...r.filter((x) => x !== k)].slice(0, RECENTS_MAX);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify({ recents: next })).catch(() => {});
      return next;
    });
  }, []);

  // The per-frame machinery lives in <LiveReadout/> below, which subscribes to
  // the pitch store ITSELF — so this parent (preset chips, close key, foot)
  // never re-renders at frame rate. Owner report 2026-09-06: the buttons
  // "take a long time to respond" — every chip was re-rendering ~15×/s.
  const [manual, setManual] = useState(false);
  const targetOverride = useRef<number | null>(null);
  const pickString = useCallback((i: number, current: boolean) => {
    touch();
    if (manual && current) {
      setManual(false);
    } else {
      targetOverride.current = i;
      setManual(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual]);

  // ── stage rules: keep awake, allow rotation, fade controls ──
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
  // A4 is one cycling chip (415…444) — nine separate keys buried CAPO and
  // STROBE a full screen-width to the right on a phone.
  const instrumentChips = (
    <>
      <Chip label={`${inst.name.toUpperCase()}  ▾`} on onPress={() => { touch(); setPickerOpen(true); }} accessibilityHint="Opens the instrument picker" />
      {recents
        .filter((k) => k !== instrument)
        .map((k) => (
          <Chip key={k} label={INSTRUMENTS[k].name.toUpperCase()} on={false} onPress={() => { touch(); choose(k); }} />
        ))}
    </>
  );
  const cycleA4 = () => {
    touch();
    setA4((v) => {
      const i = A4_CHOICES.indexOf(v);
      return A4_CHOICES[(i < 0 ? A4_CHOICES.indexOf(440) : i + 1) % A4_CHOICES.length];
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
            <Chip key={t.key} label={t.name.toUpperCase()} on={tuningKey === t.key} onPress={() => { touch(); setTuningKey(t.key); }} />
          ))
        : null}
      {inst.fifths ? (
        <>
          <Chip label="PERFECT FIFTHS" on={temperament === 'fifths'} onPress={() => { touch(); setTemperament('fifths'); }} />
          <Chip label="EQUAL / PIANO" on={temperament === 'equal'} onPress={() => { touch(); setTemperament('equal'); }} />
        </>
      ) : null}
      {inst.capo ? <Chip label={`CAPO ${capo}`} on={capo > 0} onPress={() => { touch(); setCapo((c) => (c + 1) % 8); }} /> : null}
      <View style={styles.chipGap} />
      <Chip label={`A4 ${a4}`} on={a4 !== 440} onPress={cycleA4} small accessibilityHint="Cycles the reference pitch" />
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
      {/* Top bar — presets, one tap deep; fades after 2 s */}
      <View style={[styles.bar, { opacity: controlsShown ? 1 : 0.18 }]}>
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
        <Pressable onPress={closeCenterLock} hitSlop={16} style={styles.closeKey} accessibilityRole="button" accessibilityLabel="Close full screen">
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
        strobe={strobe}
        landscape={landscape}
        width={width}
        height={height}
        padTop={padTop}
        padBottom={padBottom}
        controlsShown={controlsShown}
        onPickString={pickString}
      />

      <View style={[styles.foot, { opacity: controlsShown ? 1 : 0.35 }]}>
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
                  <Chip key={k} label={INSTRUMENTS[k].name.toUpperCase()} on={k === current} onPress={() => onPick(k)} />
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
  /** A target index the user tapped; consumed on the next frame. */
  targetOverride: React.MutableRefObject<number | null>;
  strobe: boolean;
  landscape: boolean;
  width: number;
  height: number;
  /** Root paddings (safe area) so the note can be sized from the space left. */
  padTop: number;
  padBottom: number;
  controlsShown: boolean;
  onPickString: (i: number, current: boolean) => void;
};

const NO_TARGET: StringTarget = { index: 0, label: 'CONCERT', note: 'A4', hz: 440, course: 0 };

/**
 * Everything that moves at frame rate: the note, meter, cents, string strip
 * and confidence bar. It subscribes to the pitch store itself and holds the
 * pure state machines in refs, so a frame re-renders THIS subtree only.
 */
const LiveReadout = memo(function LiveReadout({
  instrument,
  targets,
  a4,
  transposeSemis,
  stretchAmount,
  manual,
  targetOverride,
  strobe,
  landscape,
  width,
  height,
  padTop,
  padBottom,
  controlsShown,
  onPickString,
}: LiveReadoutProps) {
  const frame = useTunerFrame();
  const inst = INSTRUMENTS[instrument];
  const chromatic = !!inst.chromatic;
  const piano = !!inst.piano;
  // Piano: the key being tuned. null = AUTO (nearest key); a number LOCKS the
  // key so bass strings can be read against their partials and a wrong
  // octave shows as such. Lives here because only this subtree needs it.
  const [lockedMidi, setLockedMidi] = useState<number | null>(null);
  const [partial, setPartial] = useState(1);
  // Portrait: the measured height of the main region sizes the note, so the
  // piano stack and a two-line hint never push the readout under the chips
  // (design review 2026-09-06: SE 375×667 and landscape piano overflowed).
  const [mainH, setMainH] = useState(0);
  const targetRef = useRef<TargetState>({ target: 0, candidate: null, candidateSince: null });
  const lockRef = useRef<LockState>(INITIAL_LOCK);
  const holdRef = useRef<HoldState>(INITIAL_HOLD);
  const chromMidi = useRef<number | null>(null);
  const shownRef = useRef(0);
  const lastFrameAt = useRef(0);
  const lastAcceptedAt = useRef(Date.now());
  const [view, setView] = useState<{ target: StringTarget; targetIdx: number; rawCents: number | null; shownCents: number; confirmed: boolean; hold: ReturnType<typeof holdSummary> }>({
    target: targets[0] ?? NO_TARGET,
    targetIdx: 0,
    rawCents: null,
    shownCents: 0,
    confirmed: false,
    hold: null,
  });
  const [tuned, setTuned] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Preset changed — the old target index means nothing now.
    targetRef.current = { target: Math.max(0, Math.min(targetRef.current.target, targets.length - 1)), candidate: null, candidateSince: null };
    lockRef.current = INITIAL_LOCK;
    holdRef.current = INITIAL_HOLD;
    chromMidi.current = null;
    setTuned(new Set());
    setLockedMidi(null);
    setPartial(1);
  }, [targets, transposeSemis, instrument]);

  useEffect(() => {
    const now = Date.now();
    const dt = lastFrameAt.current ? now - lastFrameAt.current : 16.7;
    lastFrameAt.current = now;
    if (targetOverride.current != null) {
      targetRef.current = { target: targetOverride.current, candidate: null, candidateSince: null };
      lockRef.current = INITIAL_LOCK;
      targetOverride.current = null;
    }
    const hz = frame.accepted ? frame.freq : null;
    if (hz != null) lastAcceptedAt.current = now;

    let rawCents: number | null = null;
    let target: StringTarget = chromatic ? view.target : (targets[targetRef.current.target] ?? NO_TARGET);
    let readPartial = 1;
    if (piano && lockedMidi != null) {
      // Locked key: the stretched target stands; read the mic against the
      // fundamental or, on bass strings, the partial it actually hears.
      target = pianoTarget(lockedMidi, a4, stretchAmount);
      chromMidi.current = lockedMidi;
      if (hz != null && hz > 0) {
        const r = readAgainstPartials(hz, target.hz, target.hz < 80 ? 3 : 2);
        rawCents = r.cents;
        readPartial = r.partial;
      }
    } else if (hz != null && hz > 0) {
      if (piano) {
        const step = stepChromatic(chromMidi.current, hz, a4, 0);
        if (step.midi !== chromMidi.current) lockRef.current = INITIAL_LOCK;
        chromMidi.current = step.midi;
        target = pianoTarget(step.midi, a4, stretchAmount);
        rawCents = centsBetween(hz, target.hz);
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
    }
    const lockInput = rawCents != null && Math.abs(rawCents) < OCTAVE_CENTS ? rawCents : null;
    const lock = stepLock(lockRef.current, lockInput, now);
    lockRef.current = { inZoneSince: lock.inZoneSince, confirmed: lock.confirmed };
    if (lock.justConfirmed) {
      if (hapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      AccessibilityInfo.announceForAccessibility(`${target.note} in tune`);
      if (!chromatic) {
        const idx = targetRef.current.target;
        setTuned((s) => (s.has(idx) ? s : new Set(s).add(idx)));
      }
    }
    if (rawCents != null) shownRef.current = dampCents(shownRef.current, Math.max(-METER_RANGE, Math.min(METER_RANGE, rawCents)), dt);
    holdRef.current = chromatic ? stepHold(holdRef.current, hz != null ? target.note : null, lockInput, now) : INITIAL_HOLD;
    setPartial(readPartial);
    setView({
      target,
      targetIdx: targetRef.current.target,
      rawCents,
      shownCents: shownRef.current,
      confirmed: lock.confirmed,
      hold: chromatic ? holdSummary(holdRef.current, now) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.freq, frame.accepted, targets, manual, chromatic, piano, a4, transposeSemis, stretchAmount, lockedMidi]);

  const stepKey = (delta: number) => {
    setLockedMidi((m) => {
      const base = m ?? chromMidi.current ?? 69;
      return Math.max(PIANO_LOW_MIDI, Math.min(PIANO_HIGH_MIDI, base + delta));
    });
    lockRef.current = INITIAL_LOCK;
  };
  const toggleKeyLock = () => {
    setLockedMidi((m) => (m == null ? (chromMidi.current ?? 69) : null));
    lockRef.current = INITIAL_LOCK;
  };

  const target = view.target;
  const cents = view.rawCents;
  const octaveOff = cents != null && Math.abs(cents) >= OCTAVE_CENTS;
  const tint = magnitudeColor(octaveOff ? null : cents);
  const direction = directionText(cents, view.confirmed);
  const unstableMs = Date.now() - lastAcceptedAt.current;
  const lowHint = piano ? null : lowStringHint(target.hz, frame.accepted ? 0 : unstableMs);
  const hint = piano
    ? lockedMidi != null
      ? pianoRangeHint(target.hz, partial) ?? PIANO_UNISON_HINT
      : PIANO_WORKFLOW_HINT
    : lowHint ?? (chromatic ? null : courseHint(target, targets));
  const noteName = target.note.replace(/\d/g, '');
  const octave = target.note.replace(/\D/g, '');
  // Animated arrows (owner 2026-09-06: "which direction the user should be
  // tuning is not clear"): flat → arrows flow UP (raise the pitch), sharp →
  // DOWN. None inside the ±2 ¢ zone or with no pitch.
  const arrowDir: -1 | 0 | 1 = cents == null || view.confirmed || Math.abs(cents) <= IN_TUNE_CENTS ? 0 : cents < 0 ? 1 : -1;
  const identity = piano
    ? `${target.label} · ${target.note}${partial > 1 ? ` · ${partial === 2 ? '2ND' : '3RD'} PARTIAL` : ''}`
    : chromatic
      ? target.label
      : inst.numbered
        ? `STRING ${target.index} · ${target.label}`
        : target.label;
  // Portrait: the note is the display — half the screen width. Landscape: the
  // note owns the left column at half the height; the meter, cents, string
  // strip and input bar stack in the right column (visual pass 2026-09-06 —
  // a single centred row overflowed and clipped the note off the left edge).
  const NOTE_COL_W = 280;
  // 229 = identity 24 + direction row 48 + main gap 18 + meter block 139.
  const FIXED_ABOVE_NOTE = 229;
  // Space left for the note block in portrait: measured when the platform
  // reports it, otherwise the arithmetic of the fixed chrome (bar 78, foot
  // 32, the strip/stepper/hold box, INPUT row and hint) — react-native-web
  // did not deliver onLayout for this view in the preview.
  const stripH = piano ? 92 : chromatic ? 68 : 74;
  const inputH = 23 + (hint ? 44 : 0);
  const estimatedMainH = height - padTop - padBottom - 78 - 32 - stripH - inputH;
  const mainAvail = mainH > 0 ? mainH : estimatedMainH;
  const bigSize = Math.round(
    landscape ? height * 0.5 : Math.max(96, Math.min(180, Math.min(width * 0.48, (mainAvail - FIXED_ABOVE_NOTE) / 1.05))),
  );
  // One gutter: meter, keys, hold box and INPUT share the same width.
  const meterW = landscape ? Math.min(Math.max(240, width - NOTE_COL_W - 76), 720) : Math.min(width - 24, 720);
  const pointerX = (view.shownCents / METER_RANGE) * (meterW / 2);
  const zoneW = (IN_TUNE_CENTS / METER_RANGE) * (meterW / 2);
  const closeW = (CLOSE_CENTS / METER_RANGE) * (meterW / 2);
  const confidencePct = Math.round(Math.max(0, Math.min(1, frame.confidence)) * 100);
  // One key per COURSE, sized to share a single row (7 keys on a 375 phone).
  const groups = useMemo(() => courses(targets), [targets]);
  const stripW = (landscape ? meterW : width) - 24;
  const keyW = groups.length ? Math.min(60, Math.floor((stripW - (groups.length - 1) * 6) / groups.length)) : 0;

  const holdBox = (
    <View style={[styles.holdWrap, { width: landscape ? meterW : stripW }, piano && styles.holdWrapPiano]} accessibilityLiveRegion="polite">
      {view.hold ? (
        piano ? (
          <Text style={[styles.holdLine, { color: magnitudeColor(view.hold.avg) }]} numberOfLines={1}>
            {`HOLD ${(view.hold.ms / 1000).toFixed(1)} s · AVG ${fmtCents(view.hold.avg)} · ${steadinessText(view.hold.spread)} · SPREAD ±${view.hold.spread.toFixed(0)}¢`}
          </Text>
        ) : (
          <>
            <Text style={[styles.holdMain, { color: magnitudeColor(view.hold.avg) }]}>{`HOLD ${(view.hold.ms / 1000).toFixed(1)} s · AVG ${fmtCents(view.hold.avg)}`}</Text>
            <Text style={styles.holdSub}>{`${steadinessText(view.hold.spread)} · SPREAD ±${view.hold.spread.toFixed(1)}¢`}</Text>
          </>
        )
      ) : (
        <Text style={styles.holdIdle}>{piano ? 'HOLD A KEY FOR THE STEADINESS READOUT' : 'SUSTAIN A NOTE FOR THE HOLD READOUT'}</Text>
      )}
    </View>
  );
  const strip = piano ? (
    <View style={[styles.pianoBlock, { width: stripW }]}>
      <View style={styles.keyRow}>
        <Pressable onPress={() => stepKey(-1)} hitSlop={8} style={styles.keyStep} accessibilityRole="button" accessibilityLabel="Previous key">
          <Text style={styles.keyStepText}>◀</Text>
        </Pressable>
        <Pressable
          onPress={toggleKeyLock}
          style={[styles.keyLock, lockedMidi != null && styles.keyLockOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: lockedMidi != null }}
          accessibilityLabel={lockedMidi != null ? `Key ${target.index} ${target.note} locked, tap for auto` : 'Auto key, tap to lock the key being tuned'}
        >
          <Text style={[styles.keyLockMain, lockedMidi != null && { color: colors.amber }]}>{`${target.label} · ${target.note}`}</Text>
          <Text style={styles.keyLockSub}>{lockedMidi != null ? `LOCKED · STRETCH ${fmtCents((target as { stretch?: number }).stretch ?? 0)}` : 'AUTO · TAP TO LOCK THE KEY'}</Text>
        </Pressable>
        <Pressable onPress={() => stepKey(1)} hitSlop={8} style={styles.keyStep} accessibilityRole="button" accessibilityLabel="Next key">
          <Text style={styles.keyStepText}>▶</Text>
        </Pressable>
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
        const done = g.every((t) => tuned.has(targets.indexOf(t)));
        const pair = g.length > 1;
        return (
          <Pressable
            key={g[0].index}
            onPress={() => onPickString(first, current)}
            style={[styles.stringKey, { width: keyW }, current && styles.stringKeyOn, current && { borderColor: tint }]}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            accessibilityLabel={`${g[0].label} ${g.map((t) => t.note).join(' and ')}${done ? ', in tune' : ''}${current && manual ? ', locked' : ''}`}
          >
            <Text style={[styles.stringNote, pair && styles.stringNotePair, current && { color: tint }]} numberOfLines={1}>
              {pair ? `${g[0].note}·${g[1].note}` : g[0].note}
            </Text>
            <Text style={styles.stringLabel} numberOfLines={1}>{done ? '✓' : g[0].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  const input = (
    <View style={[styles.confWrap, landscape && styles.confWrapLandscape, { opacity: controlsShown ? 1 : 0.35 }]}>
      <View style={styles.confRow}>
        <Text style={styles.footLabel}>INPUT</Text>
        <View style={styles.confTrack}>
          <View style={[styles.confFill, { width: `${confidencePct}%`, backgroundColor: confidencePct > 60 ? '#37e05f' : confidencePct > 30 ? colors.amber : '#f0603a' }]} />
        </View>
        <Text style={styles.confPct}>{`${confidencePct}%`}</Text>
      </View>
      {hint ? <Text style={styles.hint} numberOfLines={landscape ? 1 : 2}>{hint}</Text> : null}
    </View>
  );

  const noteBlock = (
    <View style={[styles.noteBlock, landscape && { width: NOTE_COL_W }]} accessible accessibilityRole="text" accessibilityLabel={`${target.note}, ${direction}, ${fmtCents(cents)}`}>
      <View style={styles.identityRow}>
        <Text style={[styles.identity, { color: tint }]} numberOfLines={1}>{identity}</Text>
        {chromatic ? null : (
          <View style={[styles.modeTag, manual && { borderColor: colors.amber }]}>
            <Text style={[styles.modeText, manual && { color: colors.amber }]}>{manual ? 'MANUAL' : 'AUTO'}</Text>
          </View>
        )}
      </View>
      <View style={styles.noteRow}>
        <Text style={[styles.note, { fontSize: bigSize, lineHeight: bigSize * 1.05, color: view.confirmed ? '#37e05f' : colors.textPrimary }]}>{noteName}</Text>
        <Text style={[styles.octave, { fontSize: Math.round(bigSize * 0.42), marginBottom: Math.round(bigSize * 0.08), color: view.confirmed ? '#37e05f' : colors.textSecondary }]}>{octave}</Text>
      </View>
      <View style={styles.directionRow}>
        {arrowDir ? <TuneArrows dir={arrowDir} tint={tint} /> : <View style={styles.arrowSpacer} />}
        <Text style={[styles.direction, landscape && styles.directionLandscape, { color: tint }]} accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit>
          {chromatic && cents == null ? 'PLAY A NOTE' : direction}
        </Text>
        {arrowDir ? <TuneArrows dir={arrowDir} tint={tint} /> : <View style={styles.arrowSpacer} />}
      </View>
    </View>
  );

  // An element, not a nested component: a component defined inside render
  // would remount the meter (and kill the strobe's animation loop) every frame.
  const meter = (
    <View style={styles.meterBlock}>
      <View style={[styles.meter, { width: meterW }]} accessible accessibilityRole="adjustable" accessibilityLabel="Tuning meter" accessibilityValue={{ min: -50, max: 50, now: Math.round(view.shownCents) }}>
        <View style={styles.meterTrack} />
        <View style={[styles.closeBand, { width: closeW * 2, left: meterW / 2 - closeW }]} />
        <View style={[styles.zone, { width: zoneW * 2, left: meterW / 2 - zoneW }, view.confirmed && styles.zoneLocked]} />
        {[-50, -25, 0, 25, 50].map((t) => (
          <View key={t} style={[styles.tick, { left: meterW / 2 + (t / METER_RANGE) * (meterW / 2) - 1 }, t === 0 && styles.tickZero]} />
        ))}
        {cents != null && !octaveOff ? (
          <>
            <View style={[styles.wedge, styles.wedgeLeft, { backgroundColor: tint, left: meterW / 2 - Math.abs(pointerX) - 14 }]} />
            <View style={[styles.wedge, styles.wedgeRight, { backgroundColor: tint, left: meterW / 2 + Math.abs(pointerX) }]} />
            <View style={[styles.pointer, { backgroundColor: tint, left: meterW / 2 + pointerX - 3 }]} />
          </>
        ) : null}
      </View>
      {strobe && landscape ? null : (
        <View style={[styles.scaleRow, { width: meterW }]}>
          <Text style={styles.scaleText}>−50 FLAT</Text>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>SHARP +50</Text>
        </View>
      )}
      {strobe ? <StrobeBand cents={octaveOff ? null : cents} width={meterW} tint={tint} /> : null}
      <Text style={[styles.cents, landscape && styles.centsLandscape, { color: tint }]}>{octaveOff ? (cents! > 0 ? '+1 OCT' : '−1 OCT') : fmtCents(cents)}</Text>
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
const ARROW_SIZE = 18;
const ARROW_TRAVEL = 16;
function TuneArrows({ dir, tint }: { dir: -1 | 1; tint: string }) {
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
    <View style={styles.arrows} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => (
        <Chevron key={i} i={i} dir={dir} tint={tint} progress={progress} allowed={allowed} />
      ))}
    </View>
  );
}

function Chevron({ i, dir, tint, progress, allowed }: { i: number; dir: -1 | 1; tint: string; progress: SharedValue<number>; allowed: boolean }) {
  const style = useAnimatedStyle(() => {
    if (!allowed) {
      // Still stack: three chevrons spaced along the direction, fading away.
      return { opacity: 1 - i * 0.3, transform: [{ translateY: -dir * (i - 1) * ARROW_SIZE * 0.75 }, { rotate: dir > 0 ? '45deg' : '225deg' }] };
    }
    const phase = (progress.value + i / 3) % 1;
    const y = dir * (ARROW_TRAVEL - 2 * ARROW_TRAVEL * phase);
    return { opacity: Math.sin(phase * Math.PI), transform: [{ translateY: y }, { rotate: dir > 0 ? '45deg' : '225deg' }] };
  }, [allowed, dir, i]);
  return <Animated.View style={[styles.chevron, { borderColor: tint }, style]} />;
}

/** Expert strobe view: stripes drift left when flat, right when sharp, and
 *  stand still in tune. Rate is proportional to cents; no engine changes. */
function StrobeBand({ cents, width, tint }: { cents: number | null; width: number; tint: string }) {
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
    </View>
  );
}
const STRIPE_PERIOD = 24;

function Chip({ label, on, onPress, small, accessibilityHint }: { label: string; on: boolean; onPress: () => void; small?: boolean; accessibilityHint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[styles.chip, on && styles.chipOn, small && styles.chipSmall]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#050506', zIndex: 80 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
  barRows: { flex: 1, gap: 6 },
  chipRowWrap: { flex: 1 },
  chips: { gap: 6, alignItems: 'center', paddingRight: 28 },
  chipGap: { width: 10 },
  chipMore: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, alignItems: 'flex-end', justifyContent: 'center', backgroundColor: '#050506' },
  chipMoreText: { fontSize: 22, lineHeight: 24, color: colors.amber, fontWeight: '700' },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2a2b31', backgroundColor: '#121318', paddingVertical: 8, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  chipSmall: { paddingHorizontal: 9 },
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
  noteRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -8 },
  note: { fontFamily: fonts.oswaldBold, letterSpacing: -2 },
  octave: { fontFamily: fonts.oswaldMedium, marginLeft: 6 },
  directionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, marginTop: 2 },
  direction: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, letterSpacing: 2.4, textAlign: 'center', flexShrink: 1 },
  directionLandscape: { fontSize: 19, letterSpacing: 1.8 },
  arrows: { width: ARROW_SIZE + 10, height: 48, alignItems: 'center', justifyContent: 'center' },
  arrowSpacer: { width: ARROW_SIZE + 10, height: 48 },
  chevron: { position: 'absolute', width: ARROW_SIZE, height: ARROW_SIZE, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff', borderTopLeftRadius: 2 },

  meterBlock: { alignItems: 'center', gap: 6 },
  meter: { height: 56, justifyContent: 'center' },
  meterTrack: { position: 'absolute', left: 0, right: 0, height: 10, top: 23, borderRadius: 5, backgroundColor: '#17181d' },
  closeBand: { position: 'absolute', top: 19, height: 18, borderRadius: 4, backgroundColor: 'rgba(155,224,74,0.14)' },
  zone: { position: 'absolute', top: 12, height: 32, borderRadius: 6, borderWidth: 2, borderColor: '#37e05f', backgroundColor: 'transparent' },
  zoneLocked: { backgroundColor: 'rgba(55,224,95,0.35)' },
  tick: { position: 'absolute', top: 44, width: 2, height: 8, backgroundColor: '#3a3b43' },
  tickZero: { top: 42, height: 12, backgroundColor: '#8a8b93' },
  wedge: { position: 'absolute', top: 20, width: 14, height: 16, opacity: 0.9 },
  wedgeLeft: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  wedgeRight: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  pointer: { position: 'absolute', top: 6, width: 6, height: 44, borderRadius: 3 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#6b6f7a' },
  cents: { fontFamily: fonts.oswaldSemiBold, fontSize: 46, lineHeight: 52, letterSpacing: 1, marginTop: 4 },
  centsLandscape: { fontSize: 40, lineHeight: 46 },
  strobe: { height: 22, overflow: 'hidden', borderRadius: 4, backgroundColor: '#101116', marginTop: 6 },
  stripe: { position: 'absolute', top: 0, bottom: 0, width: STRIPE_PERIOD / 2, opacity: 0.85 },

  strip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, alignSelf: 'center', paddingTop: 6, paddingBottom: 12 },
  stringKey: { height: 56, paddingHorizontal: 3, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center' },
  stringKeyOn: { backgroundColor: '#141a16' },
  stringNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 24, color: colors.textSecondary },
  stringNotePair: { fontSize: 14, letterSpacing: 0.2 },
  stringLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, lineHeight: 13, letterSpacing: 1.2, color: '#6b6f7a', marginTop: 1 },
  modeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#2a2b31' },
  modeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#8a8b93' },
  holdWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 68, gap: 4, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1f2026', backgroundColor: '#0c0d11' },
  holdMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.6, textAlign: 'center' },
  holdSub: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.0, color: '#8a8b93', textAlign: 'center' },
  holdIdle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: '#6b6f7a', textAlign: 'center' },
  holdLine: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.0, textAlign: 'center' },
  holdWrapPiano: { minHeight: 0, paddingVertical: 8, width: '100%' },
  pianoBlock: { alignSelf: 'center', gap: 6, paddingTop: 2, paddingBottom: 4 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyStep: { width: 48, height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center' },
  keyStepText: { fontSize: 16, color: colors.textSecondary },
  keyLock: { flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, gap: 1 },
  keyLockOn: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  keyLockMain: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.2, color: colors.textPrimary },
  keyLockSub: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: '#6b6f7a' },

  foot: { paddingHorizontal: 16, paddingTop: 4, gap: 6, alignItems: 'center' },
  confWrap: { alignSelf: 'stretch', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  confWrapLandscape: { paddingHorizontal: 0 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 720 },
  confTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#17181d', overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 3 },
  footLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#6b6f7a', minWidth: 36 },
  confPct: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: '#8a8b93', minWidth: 36, textAlign: 'right' },
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
  pickerFamily: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 2, color: '#6b6f7a', paddingHorizontal: 4 },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4 },
  pickerRow: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1f2026', backgroundColor: '#121318', minHeight: 48, justifyContent: 'center' },
  pickerRowOn: { borderColor: colors.amber, backgroundColor: '#1d1708' },
  pickerName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.6, color: colors.textPrimary },
  pickerBlurb: { fontFamily: fonts.barlowMedium, fontSize: 12, color: '#8a8b93', marginTop: 1 },
});
