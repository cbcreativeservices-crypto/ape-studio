/**
 * FoundationsPlaygroundScreen — the Foundations of Sound SANDBOX (owner
 * 2026-07-26: "include all controls"). Every adjustment updates every view at
 * the same time:
 *
 *   CONTROLS: frequency · amplitude · waveform (sine/square/saw/triangle) ·
 *   harmonic richness · phase · speaker polarity · noise colors · sweep rate ·
 *   stereo balance · delay · EQ low-pass + filter Q
 *   VIEWS: air particles · speaker cone · analytic waveform · analytic
 *   spectrum (EQ curve applied via the SAME RBJ math the DSP runs — lockstep)
 *   · LEVEL (dBFS · relative) · frequency / wavelength / period readouts
 *
 * HONESTY (§1.7): particle/cone motion is the slowed CONCEPTUAL model
 * (badged); waveform/spectrum are ANALYTIC — drawn from the settings, not
 * measured (badged); the meter is the COMMANDED output level, labeled
 * "LEVEL (dBFS · relative)" (owner ruling — "SPL" is reserved for the real
 * mic-based meter). Phase/polarity captions state they are inaudible ALONE
 * (mono, single source) — the setup for Module 10. Stereo/delay/EQ audio
 * needs the v6 effects path; pre-Skia clients get the honest card for the
 * animated views while audio still works.
 *
 * AUDIO: house idiom throughout — audio-output gate, additive/sine/noise/sweep
 * through the ONE generator lifecycle, fx via fxSet with fxReset on every stop
 * path (no leakage), speaker-safety guards, keepalive, teardown on blur.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApeDsp, FX, FX_PARAM, EQ_BAND_TYPES, GEN_MODES } from '../../../../modules/ape-dsp';
import { GlassButton } from '../../../components/GlassButton';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, guardNoiseLevelForEngine, guardToneLevelForEngine } from '../../../features/audio/speakerSafety';
import { eqResponseDb } from '../../../features/lab/fxViz';
import { LabReviewButton } from '../../../features/lab/LabReviewButton';
import { EngineGate } from '../../tools/EngineGate';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { LabChip, ScrollLockProvider } from '../LabShell';
import { ConceptBadge, DragSlider, LevelMeterBar, VizUnavailableCard } from './bits';
import { requireViz, type VizModule } from './skiaGate';
import { visHzFor } from './FoundationsCourseScreen';

const ACTIVITY_MS = 500;
const SPEED_OF_SOUND = 343;

type SourceKind = 'wave' | 'noise' | 'sweep';
type WaveKind = 'sine' | 'square' | 'saw' | 'triangle';
type NoiseKind = 'white' | 'pink' | 'brown';

const WAVES: { key: WaveKind; label: string }[] = [
  { key: 'sine', label: 'SINE' },
  { key: 'square', label: 'SQUARE' },
  { key: 'saw', label: 'SAW' },
  { key: 'triangle', label: 'TRIANGLE' },
];
const NOISES: { key: NoiseKind; label: string; mode: number }[] = [
  { key: 'white', label: 'WHITE', mode: GEN_MODES.white },
  { key: 'pink', label: 'PINK', mode: GEN_MODES.pink },
  { key: 'brown', label: 'BROWN', mode: GEN_MODES.brown },
];
const RICHNESS = [
  { key: 12, label: 'ALL HARMONICS' },
  { key: 3, label: 'FIRST 3' },
  { key: 1, label: 'FUNDAMENTAL' },
] as const;
const PHASES = [0, 90, 180] as const;
const SWEEPS = [
  { key: 'slow', label: 'SLOW SWEEP', secs: 8 },
  { key: 'fast', label: 'FAST SWEEP', secs: 2 },
] as const;
const DELAYS = [
  { key: 0, label: 'DELAY OFF' },
  { key: 120, label: '120 ms' },
  { key: 400, label: '400 ms' },
] as const;
const EQ_CUTS = [
  { key: 0, label: 'EQ OFF' },
  { key: 2000, label: 'LPF 2 kHz' },
  { key: 500, label: 'LPF 500 Hz' },
] as const;
const QS = [
  { key: 0.7, label: 'Q 0.7' },
  { key: 4, label: 'Q 4' },
] as const;

/** Additive recipe for a classic wave, truncated to `keep` harmonics. Phase:
 *  waveform PHASE shift = n·φ per harmonic (a time shift); POLARITY = +180 on
 *  every harmonic (a sign flip). Triangle needs its own alternating signs. */
function recipe(kind: WaveKind, keep: number, phaseDeg: number, inverted: boolean) {
  const amps = new Array(12).fill(0);
  const phases = new Array(12).fill(0);
  for (let n = 1; n <= 12; n++) {
    let a = 0;
    let extra = 0;
    if (kind === 'sine') a = n === 1 ? 1 : 0;
    else if (kind === 'square') a = n % 2 === 1 ? 1 / n : 0;
    else if (kind === 'saw') a = 1 / n;
    else {
      // triangle: odd 1/n², alternating sign (n = 3, 7, 11 flipped).
      a = n % 2 === 1 ? 1 / (n * n) : 0;
      if (n % 4 === 3) extra = 180;
    }
    if (n > keep) a = 0;
    amps[n - 1] = a;
    phases[n - 1] = (phaseDeg * n + extra + (inverted ? 180 : 0)) % 360;
  }
  return { amps, phases };
}

export function FoundationsPlaygroundScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const additiveReady = engineReady && ApeDsp.engineVersion() >= 3;
  const fxReady = engineReady && ApeDsp.fxAvailable();
  const viz = useMemo(() => requireViz(), []);

  // Per-control help (owner request 2026-07-26): long-press a chip / tap a
  // slider's ⓘ → the two-tier "what it does" popup from the foundations lesson.
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = useCallback((key: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // ── Control state ──────────────────────────────────────────────────────────
  const [source, setSource] = useState<SourceKind>('wave');
  const [wave, setWave] = useState<WaveKind>('sine');
  const [noise, setNoise] = useState<NoiseKind>('pink');
  const [sweepKey, setSweepKey] = useState<(typeof SWEEPS)[number]['key']>('slow');
  const [freq01, setFreq01] = useState(0.4); // log 55..3520
  const [lvl01, setLvl01] = useState(0.7); // −48..−16
  const [keep, setKeep] = useState<number>(12);
  const [phase, setPhase] = useState<number>(0);
  const [inverted, setInverted] = useState(false);
  const [balance, setBalance] = useState(0.5); // 0 L .. 1 R
  const [delayMs, setDelayMs] = useState<number>(0);
  const [eqCut, setEqCut] = useState<number>(0);
  const [eqQ, setEqQ] = useState<number>(0.7);
  const [playing, setPlaying] = useState(false);
  const [genError, setGenError] = useState('');

  const freq = Math.round(55 * Math.pow(3520 / 55, freq01));
  const levelDb = Math.round(-48 + lvl01 * 32);
  const { amps, phases } = useMemo(
    () => recipe(wave, keep, phase, inverted),
    [wave, keep, phase, inverted],
  );

  // ── Audio push (targets-first; safe at UI rate) ────────────────────────────
  const genRef = useRef(0);
  const stateRef = useRef({ source, wave, noise, sweepKey, freq, levelDb, amps, phases });
  stateRef.current = { source, wave, noise, sweepKey, freq, levelDb, amps, phases };

  const pushSource = useCallback(() => {
    const s = stateRef.current;
    if (s.source === 'noise') {
      const n = NOISES.find((x) => x.key === s.noise)!;
      // Per-color speaker guard (NoiseLab idiom) — broadband content can't be
      // JS-filtered, so the interim level cut applies below the v4 native HPF.
      ApeDsp.genSet({ mode: n.mode, levelDb: guardNoiseLevelForEngine(s.levelDb, s.noise) });
      return;
    }
    if (s.source === 'sweep') {
      const sw = SWEEPS.find((x) => x.key === s.sweepKey)!;
      ApeDsp.genSet({
        mode: GEN_MODES.sweepLog,
        sweep: { startHz: 100, endHz: 8000, seconds: sw.secs, repeat: true },
        levelDb: guardToneLevelForEngine(s.levelDb, 100),
      });
      return;
    }
    // Waves ride the additive path (phase/polarity/harmonics need it); a
    // sine-only v2 engine falls back to the plain sine mode (stated below).
    if (additiveReady) {
      // RAW levelDb here (Harmonograph idiom): guardAdditiveForEngine already
      // high-passes each partial by construction, so also guarding the mix
      // level would double-attenuate on pre-v4 clients and break the see==hear
      // contract. On v4+ both wrappers pass through raw anyway.
      ApeDsp.genSet({
        mode: GEN_MODES.additive,
        additive: guardAdditiveForEngine([s.freq, ...s.amps, ...s.phases]),
        levelDb: s.levelDb,
      });
    } else {
      ApeDsp.genSet({
        mode: GEN_MODES.sine,
        frequency: s.freq,
        levelDb: guardToneLevelForEngine(s.levelDb, s.freq),
      });
    }
  }, [additiveReady]);

  const pushFx = useCallback(() => {
    if (!fxReady) return;
    // Stereo balance (pan) — enabled only when off-center.
    const pan = (balance - 0.5) * 2;
    ApeDsp.fxSet(FX.stereo, FX_PARAM.pan, pan);
    ApeDsp.fxSet(FX.stereo, FX_PARAM.widthPct, 100);
    ApeDsp.fxSet(FX.stereo, FX_PARAM.enabled, Math.abs(pan) > 0.02 ? 1 : 0);
    // Delay.
    if (delayMs > 0) {
      ApeDsp.fxSet(FX.delay, FX_PARAM.timeMs, delayMs);
      ApeDsp.fxSet(FX.delay, FX_PARAM.delayFeedback, 0.25);
      ApeDsp.fxSet(FX.delay, FX_PARAM.delayMix, 0.35);
      ApeDsp.fxSet(FX.delay, FX_PARAM.enabled, 1);
    } else {
      ApeDsp.fxSet(FX.delay, FX_PARAM.enabled, 0);
    }
    // EQ low-pass + Q on band 0.
    if (eqCut > 0) {
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'type'), EQ_BAND_TYPES.lowPass);
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'freq'), eqCut);
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(0, 'q'), eqQ);
      ApeDsp.fxSet(FX.eq, FX_PARAM.enabled, 1);
    } else {
      ApeDsp.fxSet(FX.eq, FX_PARAM.enabled, 0);
    }
  }, [fxReady, balance, delayMs, eqCut, eqQ]);

  const start = useCallback(async () => {
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    pushSource();
    pushFx();
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        return;
      }
      setPlaying(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [requestAudioOutput, pushSource, pushFx]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    ApeDsp.fxReset(); // no effect leakage into other labs (house rule)
    setPlaying(false);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [playing]);

  // Live retarget while sounding.
  useEffect(() => {
    if (playing) {
      pushSource();
      noteAudioActivity();
    }
  }, [source, wave, noise, sweepKey, freq, levelDb, amps, phases]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (playing) pushFx();
  }, [balance, delayMs, eqCut, eqQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Display derivations (lockstep with the audio settings) ─────────────────
  const amp01 = (levelDb + 48) / 32;
  const airMode = source === 'noise' ? 'noise' : 'wave';
  const displayVisHz = source === 'sweep' ? visHzFor(900) : visHzFor(freq);
  const [width, setWidth] = useState(0);
  // Drag-vs-scroll (owner 2026-07-30): DragSliders lock this screen's scroll
  // during a drag via the ScrollLockProvider below — no per-slider wiring.
  const [scrollLocked, setScrollLocked] = useState(false);
  // Air-window wavelength (px): wide at low pitch, tight at high pitch — only
  // for a single-frequency wave (noise/sweep have no single λ).
  const airLambdaPx = source === 'wave' && width > 0 ? width / (1.3 + 4.7 * freq01) : undefined;
  const gainDbAt = useMemo(() => {
    if (eqCut <= 0) return null;
    const band = [{ type: 'lowPass' as const, freq: eqCut, q: eqQ, gainDb: 0 }];
    return (f: number) => eqResponseDb(band, f);
  }, [eqCut, eqQ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>FOUNDATIONS PLAYGROUND</Text>
          <Text style={styles.subtitle}>Every control drives every view — experiment freely</Text>
        </View>
        <AccuracyNote compact />
      </View>

      <ScrollLockProvider value={setScrollLocked}>
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
        {!engineReady ? <EngineGate state={gate} /> : null}

        {/* LEVEL (dBFS · relative) — ABOVE the displays (owner 2026-08-05). */}
        <Pressable onLongPress={() => help('amplitude')} delayLongPress={260}>
          <LevelMeterBar levelDb={levelDb} minDb={-48} maxDb={-16} />
        </Pressable>

        {/* ── THE VIEWS at the TOP — all driven by the same settings ─────── */}
        <View
          style={styles.panelCard}
          onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 24)}
        >
          {width > 0 ? (
            viz ? (
              <PlaygroundViz
                viz={viz}
                width={width}
                visHz={displayVisHz}
                amp={0.25 + amp01 * 0.75}
                airMode={airMode}
                running={playing}
                lambdaPx={airLambdaPx}
              />
            ) : (
              <VizUnavailableCard />
            )
          ) : null}
          <ConceptBadge />
          <DisplayGuideButton onPress={() => help('waveform')} />
          {width > 0 && viz ? (
            source === 'sweep' ? (
              <Text style={styles.caption}>
                Sweep is a moving tone — the waveform and spectrum drawings pause (a fixed frame
                would misrepresent a signal that never holds still). Watch the air motion and the
                level instead.
              </Text>
            ) : (
              <>
                <Text style={styles.winLabel}>WAVEFORM — pressure vs time (one “window” of the signal)</Text>
                <viz.AnalyticWaveformView
                  width={width}
                  amps={amps}
                  phasesDeg={phases}
                  level={0.35 + amp01 * 0.65}
                  noise={source === 'noise' ? noise : null}
                />
                <Text style={styles.winLabel}>
                  SPECTRUM — which frequencies, how strong{eqCut > 0 ? ' (EQ curve applied)' : ''}{' '}
                  · {source === 'noise' ? 'log axis 40 Hz–16 kHz' : `linear axis to ${13 * freq} Hz`}
                </Text>
                <viz.AnalyticSpectrumView
                  width={width}
                  f0={freq}
                  amps={amps}
                  gainDbAt={gainDbAt}
                  noise={source === 'noise' ? noise : null}
                />
                <Text style={styles.badge}>
                  ANALYTIC — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT (the measurement tools do
                  the real thing)
                </Text>
              </>
            )
          ) : null}
          <Pressable style={styles.readoutRow} onLongPress={() => help('readouts')} delayLongPress={260}>
            {source === 'wave' ? (
              <>
                <Readout label="FREQUENCY" value={`${freq} Hz`} />
                <Readout label="WAVELENGTH" value={`${(SPEED_OF_SOUND / freq).toFixed(2)} m`} />
                <Readout label="PERIOD" value={`${((1 / freq) * 1000).toFixed(2)} ms`} />
              </>
            ) : source === 'sweep' ? (
              <Readout label="SWEEP" value="100 Hz → 8 kHz" />
            ) : (
              <Readout label="CONTENT" value="broadband — no single pitch" />
            )}
          </Pressable>
        </View>

        {/* ── SIGNAL CONTROLS ────────────────────────────────────────────── */}
        {source === 'wave' ? (
          <>
            <DragSlider value={freq01} onChange={setFreq01} label="FREQUENCY" readout={`${freq} Hz`} onHelp={() => help('frequency')} />
            <View style={styles.chipRow}>
              {RICHNESS.map((r) => (
                <LabChip key={r.key} label={r.label} selected={keep === r.key} onPress={() => setKeep(r.key)} onLongPress={() => help('harmonics')} />
              ))}
            </View>
            <View style={styles.chipRow}>
              {PHASES.map((p) => (
                <LabChip key={p} label={`PHASE ${p}°`} selected={phase === p} onPress={() => setPhase(p)} onLongPress={() => help('phase')} />
              ))}
              <LabChip
                label={inverted ? 'POLARITY −' : 'POLARITY +'}
                selected={inverted}
                onPress={() => setInverted((v) => !v)}
                onLongPress={() => help('polarity')}
              />
            </View>
            <Text style={styles.caption}>
              Phase shifts and polarity flips change the DRAWING but are inaudible on a single
              mono source — hold that thought for Module 10, where two copies collide.
            </Text>
            {!additiveReady && engineReady ? (
              <Text style={styles.caption}>
                This dev build predates the additive engine — audio falls back to a pure sine;
                the drawings stay exact.
              </Text>
            ) : null}
          </>
        ) : source === 'sweep' ? (
          <Text style={styles.caption}>Sweeping 100 Hz → 8 kHz, repeating — listen to the pitch climb.</Text>
        ) : (
          <Text style={styles.caption}>
            Noise is BROADBAND — every frequency at once, so there is no single pitch and the
            particles jitter instead of waving. White = equal energy per Hz; pink −3 dB/oct;
            brown −6 dB/oct.
          </Text>
        )}

        <DragSlider value={lvl01} onChange={setLvl01} label="AMPLITUDE (LEVEL)" readout={`${levelDb} dBFS`} onHelp={() => help('amplitude')} levelTint />

        {/* ── PROCESSING (v6 effects path) ───────────────────────────────── */}
        <Text style={styles.sectionHead}>PROCESSING</Text>
        <DragSlider
          value={balance}
          onChange={setBalance}
          label="STEREO BALANCE"
          readout={balance < 0.48 ? `L ${Math.round((0.5 - balance) * 200)}%` : balance > 0.52 ? `R ${Math.round((balance - 0.5) * 200)}%` : 'CENTER'}
          onHelp={() => help('stereo_balance')}
        />
        <View style={styles.chipRow}>
          {DELAYS.map((d) => (
            <LabChip key={d.key} label={d.label} selected={delayMs === d.key} onPress={() => setDelayMs(d.key)} onLongPress={() => help('delay')} />
          ))}
        </View>
        <View style={styles.chipRow}>
          {EQ_CUTS.map((c) => (
            <LabChip key={c.key} label={c.label} selected={eqCut === c.key} onPress={() => setEqCut(c.key)} onLongPress={() => help('eq')} />
          ))}
          {eqCut > 0
            ? QS.map((q) => (
                <LabChip key={q.key} label={q.label} selected={eqQ === q.key} onPress={() => setEqQ(q.key)} onLongPress={() => help('filter_q')} />
              ))
            : null}
        </View>
        {!fxReady && engineReady ? (
          <Text style={styles.caption}>
            Balance / delay / EQ audio need the v6+ effects build — the drawings below still
            respond.
          </Text>
        ) : null}

        {/* ── SOURCE — below the other controls, above PLAY (owner 2026-08-05). */}
        <Text style={styles.sectionHead}>SOURCE</Text>
        <View style={styles.chipRow}>
          {WAVES.map((wv) => (
            <LabChip
              key={wv.key}
              label={wv.label}
              selected={source === 'wave' && wave === wv.key}
              onPress={() => {
                setSource('wave');
                setWave(wv.key);
              }}
              onLongPress={() => help('waveform')}
            />
          ))}
        </View>
        <View style={styles.chipRow}>
          {NOISES.map((nz) => (
            <LabChip
              key={nz.key}
              label={`${nz.label} NOISE`}
              selected={source === 'noise' && noise === nz.key}
              onPress={() => {
                setSource('noise');
                setNoise(nz.key);
              }}
              onLongPress={() => help('noise')}
            />
          ))}
          {SWEEPS.map((sw) => (
            <LabChip
              key={sw.key}
              label={sw.label}
              selected={source === 'sweep' && sweepKey === sw.key}
              onPress={() => {
                setSource('sweep');
                setSweepKey(sw.key);
              }}
              onLongPress={() => help('sweep')}
            />
          ))}
        </View>

        {/* ── PLAY ───────────────────────────────────────────────────────── */}
        {engineReady ? (
          <>
            <GlassButton
              label={playing ? 'STOP' : 'PLAY'}
              tint="green"
              height={52}
              fontSize={15}
              onPress={() => (playing ? stop() : void start())}
            />
            {genError ? <Text style={styles.error}>{genError}</Text> : null}
          </>
        ) : null}

        {/* R6c: sandbox — no modules/challenge; explicit review records credit. */}
        <LabReviewButton labKey="af_sound_playground" />
      </ScrollView>
      </ScrollLockProvider>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('foundations')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </View>
  );
}

function PlaygroundViz({
  viz,
  width,
  visHz,
  amp,
  airMode,
  running,
  lambdaPx,
}: {
  viz: VizModule;
  width: number;
  visHz: number;
  amp: number;
  airMode: 'wave' | 'noise';
  running: boolean;
  /** Spatial wavelength (px) for the air window — tightens with pitch so the
   *  spacing matches the WAVELENGTH readout. Undefined for noise (no λ). */
  lambdaPx?: number;
}) {
  const clock = viz.useVizClock(running);
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.winLabel}>SPEAKER</Text>
      <viz.SpeakerConeView clock={clock} width={width} visHz={visHz} amp={amp} mode={airMode} />
      <Text style={styles.winLabel}>AIR — spacing tightens as pitch rises (that spacing IS wavelength)</Text>
      <viz.AirParticlesView clock={clock} width={width} visHz={visHz} amp={amp} mode={airMode} lambdaPx={lambdaPx} />
    </View>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Text style={styles.readoutLabel}>{label}</Text>
      <Text style={styles.readoutValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  panelCard: {
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  winLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.1, color: colors.textSecondary },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  readoutRow: { flexDirection: 'row', gap: 22, flexWrap: 'wrap' },
  readoutLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.1, color: colors.textSub },
  readoutValue: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.4, color: colors.amber },
});
