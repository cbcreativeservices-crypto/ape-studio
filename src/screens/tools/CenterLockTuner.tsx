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
 *  • string strip with per-string status; tap a string to lock it (MANUAL),
 *    tap again for AUTO; AUTO re-targets only after a stable candidate;
 *  • presets one tap deep: instrument (guitar 6/7, bass 4/5/6, violin in
 *    perfect fifths or equal temperament), tuning, capo, A4;
 *  • low-string honesty: octave always visible, a coaching hint when a low
 *    target stays unstable; an input confidence bar; the microphone line;
 *  • silent by default; keeps the screen awake; portrait and landscape;
 *    controls fade after 2 s of no touch; STROBE is an expert view, not default.
 * All decision logic is pure and tested in features/tools/tuner/centerLock.ts.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '../../theme/tokens';
import { hapticsEnabled } from '../../features/settings/store';
import { optionalModule } from '../../features/tools/capture/optionalModule';
import { lockPortrait, unlockOrientation } from '../../lib/screenOrientationSafe';
import { closeCenterLock, readTunerFrame, useTunerFrame } from '../../features/tools/tuner/tunerFrameStore';
import {
  buildTargets,
  centsBetween,
  CLOSE_CENTS,
  dampCents,
  directionText,
  fmtCents,
  IN_TUNE_CENTS,
  INITIAL_LOCK,
  INSTRUMENTS,
  lowStringHint,
  magnitudeColor,
  nearestTarget,
  OCTAVE_CENTS,
  stepLock,
  stepTarget,
  TUNINGS,
  type InstrumentKey,
  type LockState,
  type TargetState,
  type Temperament,
} from '../../features/tools/tuner/centerLock';

const A4_CHOICES = [415, 432, 435, 438, 440, 441, 442, 443, 444];
const INSTRUMENT_ORDER: InstrumentKey[] = ['guitar6', 'guitar7', 'bass4', 'bass5', 'bass6', 'violin'];
const CONTROLS_FADE_MS = 2000;
const METER_RANGE = 50; // ±50 ¢ fixed scale

type KeepAwakeLib = { activateKeepAwakeAsync?: (tag?: string) => Promise<void>; deactivateKeepAwake?: (tag?: string) => Promise<void> | void };

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
  const [strobe, setStrobe] = useState(false);
  const targets = useMemo(
    () => buildTargets(instrument, tuningKey, a4, capo, instrument === 'violin' ? temperament : 'equal'),
    [instrument, tuningKey, a4, capo, temperament],
  );

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
  const instrumentChips = INSTRUMENT_ORDER.map((k) => (
    <Chip
      key={k}
      label={INSTRUMENTS[k].name.toUpperCase()}
      on={instrument === k}
      onPress={() => {
        touch();
        setInstrument(k);
        setTuningKey('standard');
        setCapo(0);
        setManual(false);
      }}
    />
  ));
  const cycleA4 = () => {
    touch();
    setA4((v) => {
      const i = A4_CHOICES.indexOf(v);
      return A4_CHOICES[(i < 0 ? A4_CHOICES.indexOf(440) : i + 1) % A4_CHOICES.length];
    });
  };
  const setupChips = (
    <>
      {TUNINGS[instrument].map((t) => (
        <Chip key={t.key} label={t.name.toUpperCase()} on={tuningKey === t.key} onPress={() => { touch(); setTuningKey(t.key); }} />
      ))}
      <View style={styles.chipGap} />
      {instrument === 'violin' ? (
        <>
          <Chip label="PERFECT FIFTHS" on={temperament === 'fifths'} onPress={() => { touch(); setTemperament('fifths'); }} />
          <Chip label="EQUAL / PIANO" on={temperament === 'equal'} onPress={() => { touch(); setTemperament('equal'); }} />
        </>
      ) : (
        <Chip label={`CAPO ${capo}`} on={capo > 0} onPress={() => { touch(); setCapo((c) => (c + 1) % 8); }} />
      )}
      <View style={styles.chipGap} />
      <Chip label={`A4 ${a4}`} on={a4 !== 440} onPress={cycleA4} small accessibilityHint="Cycles the reference pitch" />
      <Chip label={strobe ? 'STROBE ±0.1¢' : 'STROBE'} on={strobe} onPress={() => { touch(); setStrobe((s) => !s); }} small />
    </>
  );

  return (
    <Pressable
      style={[styles.root, { paddingTop: Math.max(insets.top, landscape ? 8 : 24) + 6, paddingBottom: Math.max(insets.bottom, 10) + 6, paddingLeft: insets.left, paddingRight: insets.right }]}
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
        <Pressable onPress={closeCenterLock} hitSlop={16} style={styles.closeKey} accessibilityRole="button" accessibilityLabel="Close CenterLock">
          <Text style={styles.closeX}>✕</Text>
        </Pressable>
      </View>

      <LiveReadout
        targets={targets}
        manual={manual}
        targetOverride={targetOverride}
        strobe={strobe}
        landscape={landscape}
        width={width}
        height={height}
        controlsShown={controlsShown}
        onPickString={pickString}
      />

      <View style={[styles.foot, { opacity: controlsShown ? 1 : 0.35 }]}>
        <Text style={styles.honesty}>
          Phone microphone · it listens to the room, not a pedal · needle ±1¢ · strobe view ±0.1¢ (estimate) · silent by design
        </Text>
      </View>
    </Pressable>
  );
}

type LiveReadoutProps = {
  targets: ReturnType<typeof buildTargets>;
  manual: boolean;
  /** A string index the user tapped; consumed on the next frame. */
  targetOverride: React.MutableRefObject<number | null>;
  strobe: boolean;
  landscape: boolean;
  width: number;
  height: number;
  controlsShown: boolean;
  onPickString: (i: number, current: boolean) => void;
};

/**
 * Everything that moves at frame rate: the note, meter, cents, string strip
 * and confidence bar. It subscribes to the pitch store itself and holds the
 * pure state machines in refs, so a frame re-renders THIS subtree only.
 */
const LiveReadout = memo(function LiveReadout({
  targets,
  manual,
  targetOverride,
  strobe,
  landscape,
  width,
  height,
  controlsShown,
  onPickString,
}: LiveReadoutProps) {
  const frame = useTunerFrame();
  const targetRef = useRef<TargetState>({ target: 0, candidate: null, candidateSince: null });
  const lockRef = useRef<LockState>(INITIAL_LOCK);
  const shownRef = useRef(0);
  const lastFrameAt = useRef(0);
  const lastAcceptedAt = useRef(Date.now());
  const [view, setView] = useState<{ targetIdx: number; rawCents: number | null; shownCents: number; confirmed: boolean }>({
    targetIdx: 0,
    rawCents: null,
    shownCents: 0,
    confirmed: false,
  });
  const [tuned, setTuned] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Preset changed — the old target index means nothing now.
    targetRef.current = { target: Math.min(targetRef.current.target, targets.length - 1), candidate: null, candidateSince: null };
    lockRef.current = INITIAL_LOCK;
    setTuned(new Set());
  }, [targets]);

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
    if (hz != null && hz > 0) {
      const near = nearestTarget(hz, targets);
      targetRef.current = stepTarget(targetRef.current, near.i, now, manual);
      rawCents = centsBetween(hz, targets[targetRef.current.target].hz);
    }
    const lockInput = rawCents != null && Math.abs(rawCents) < OCTAVE_CENTS ? rawCents : null;
    const lock = stepLock(lockRef.current, lockInput, now);
    lockRef.current = { inZoneSince: lock.inZoneSince, confirmed: lock.confirmed };
    if (lock.justConfirmed) {
      if (hapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      AccessibilityInfo.announceForAccessibility(`${targets[targetRef.current.target].note} in tune`);
      const idx = targetRef.current.target;
      setTuned((s) => (s.has(idx) ? s : new Set(s).add(idx)));
    }
    if (rawCents != null) shownRef.current = dampCents(shownRef.current, Math.max(-METER_RANGE, Math.min(METER_RANGE, rawCents)), dt);
    setView({ targetIdx: targetRef.current.target, rawCents, shownCents: shownRef.current, confirmed: lock.confirmed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.freq, frame.accepted, targets, manual]);

  const target = targets[Math.min(view.targetIdx, targets.length - 1)];
  const cents = view.rawCents;
  const octaveOff = cents != null && Math.abs(cents) >= OCTAVE_CENTS;
  const tint = magnitudeColor(octaveOff ? null : cents);
  const direction = directionText(cents, view.confirmed);
  const unstableMs = Date.now() - lastAcceptedAt.current;
  const hint = lowStringHint(target.hz, frame.accepted ? 0 : unstableMs);
  const noteName = target.note.replace(/\d/g, '');
  const octave = target.note.replace(/\D/g, '');
  // Portrait: the note is the display — half the screen width. Landscape: the
  // note owns the left column at half the height; the meter, cents, string
  // strip and input bar stack in the right column (visual pass 2026-09-06 —
  // a single centred row overflowed and clipped the note off the left edge).
  const NOTE_COL_W = 280;
  const bigSize = Math.round(landscape ? height * 0.5 : Math.min(width * 0.48, height * 0.26));
  const meterW = landscape ? Math.min(Math.max(240, width - NOTE_COL_W - 76), 720) : Math.min(width - 32, 720);
  const pointerX = (view.shownCents / METER_RANGE) * (meterW / 2);
  const zoneW = (IN_TUNE_CENTS / METER_RANGE) * (meterW / 2);
  const closeW = (CLOSE_CENTS / METER_RANGE) * (meterW / 2);
  const confidencePct = Math.round(Math.max(0, Math.min(1, frame.confidence)) * 100);
  const isViolin = targets.length === 4 && targets[0].note === 'G3';
  // String keys share one row: 6 keys on a 375-wide phone, 7 for the 7-string.
  const stripW = (landscape ? meterW : width) - 24;
  const keyW = Math.min(58, Math.floor((stripW - (targets.length - 1) * 6) / targets.length));

  const strip = (
    <View style={[styles.strip, { width: stripW }]}>
      {targets.map((t, i) => {
        const current = i === view.targetIdx;
        return (
          <Pressable
            key={t.index}
            onPress={() => onPickString(i, current)}
            style={[styles.stringKey, { width: keyW }, current && styles.stringKeyOn, current && { borderColor: tint }]}
            accessibilityRole="button"
            accessibilityState={{ selected: current }}
            accessibilityLabel={`${t.label} ${t.note}${tuned.has(i) ? ', in tune' : ''}${current && manual ? ', locked' : ''}`}
          >
            <Text style={[styles.stringNote, current && { color: tint }]}>{t.note}</Text>
            <Text style={styles.stringLabel}>{tuned.has(i) ? '✓' : t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  const input = (
    <View style={[styles.confWrap, { opacity: controlsShown ? 1 : 0.35 }]}>
      <View style={styles.confRow}>
        <Text style={styles.footLabel}>INPUT</Text>
        <View style={styles.confTrack}>
          <View style={[styles.confFill, { width: `${confidencePct}%`, backgroundColor: confidencePct > 60 ? '#37e05f' : confidencePct > 30 ? colors.amber : '#f0603a' }]} />
        </View>
        <Text style={styles.footLabel}>{`${confidencePct}%`}</Text>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );

  const noteBlock = (
    <View style={[styles.noteBlock, landscape && { width: NOTE_COL_W }]} accessible accessibilityRole="text" accessibilityLabel={`${target.note}, ${direction}, ${fmtCents(cents)}`}>
      <View style={styles.identityRow}>
        <Text style={[styles.identity, { color: tint }]}>{`${isViolin ? '' : `STRING ${target.index} · `}${target.label}`}</Text>
        <View style={[styles.modeTag, manual && { borderColor: colors.amber }]}>
          <Text style={[styles.modeText, manual && { color: colors.amber }]}>{manual ? 'MANUAL' : 'AUTO'}</Text>
        </View>
      </View>
      <View style={styles.noteRow}>
        <Text style={[styles.note, { fontSize: bigSize, lineHeight: bigSize * 1.05, color: view.confirmed ? '#37e05f' : colors.textPrimary }]}>{noteName}</Text>
        <Text style={[styles.octave, { fontSize: Math.round(bigSize * 0.42), marginBottom: Math.round(bigSize * 0.08), color: view.confirmed ? '#37e05f' : colors.textSecondary }]}>{octave}</Text>
      </View>
      <Text style={[styles.direction, landscape && styles.directionLandscape, { color: tint }]} accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit>
        {direction}
      </Text>
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
        <View style={[styles.scaleRow, { width: meterW }]}>
          <Text style={styles.scaleText}>−50 FLAT</Text>
          <Text style={styles.scaleText}>0</Text>
          <Text style={styles.scaleText}>SHARP +50</Text>
        </View>
        {strobe ? <StrobeBand cents={octaveOff ? null : cents} width={meterW} tint={tint} /> : null}
        <Text style={[styles.cents, { color: tint }]}>{octaveOff ? (cents! > 0 ? '+1 OCT' : '−1 OCT') : fmtCents(cents)}</Text>
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
      <View style={styles.main}>
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

  main: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 },
  mainLandscape: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 16 },
  rightCol: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  noteBlock: { alignItems: 'center', minWidth: 200 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identity: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 2.2 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-end' },
  note: { fontFamily: fonts.oswaldBold, letterSpacing: -2 },
  octave: { fontFamily: fonts.oswaldMedium, marginLeft: 6 },
  direction: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, letterSpacing: 2.4, marginTop: 2, textAlign: 'center' },
  directionLandscape: { fontSize: 19, letterSpacing: 1.8 },

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
  cents: { fontFamily: fonts.oswaldSemiBold, fontSize: 40, letterSpacing: 1, marginTop: 4 },
  strobe: { height: 22, overflow: 'hidden', borderRadius: 4, backgroundColor: '#101116', marginTop: 6 },
  stripe: { position: 'absolute', top: 0, bottom: 0, width: STRIPE_PERIOD / 2, opacity: 0.85 },

  strip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 8 },
  stringKey: { paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2b31', backgroundColor: '#101116', alignItems: 'center' },
  stringKeyOn: { backgroundColor: '#141a16' },
  stringNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSecondary },
  stringLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: '#6b6f7a', marginTop: 1 },
  modeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#2a2b31' },
  modeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#8a8b93' },

  foot: { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  confWrap: { alignSelf: 'stretch', paddingHorizontal: 16, gap: 6, alignItems: 'center', paddingBottom: 6 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 520 },
  confTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#17181d', overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 3 },
  footLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#6b6f7a', minWidth: 36 },
  hint: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amber, textAlign: 'center' },
  honesty: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.8, color: '#6b6f7a', textAlign: 'center', lineHeight: 14 },
});
