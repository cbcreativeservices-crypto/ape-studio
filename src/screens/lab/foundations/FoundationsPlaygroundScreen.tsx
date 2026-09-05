/**
 * FoundationsPlaygroundScreen — the Foundations of Sound SANDBOX (owner
 * 2026-07-26: "include all controls"). Every adjustment updates every view at
 * the same time.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): this screen now
 * renders the RackUnit frame directly (own header kept; no LabShell). The law:
 * *reading may scroll; operating may not.*
 *   STAGE (L) — ALL views pinned in one glass: speaker cone + air particles
 *     side by side (the animated conceptual model), analytic waveform and
 *     analytic spectrum beneath (EQ curve applied via the SAME RBJ math the
 *     DSP runs — lockstep). Pre-Skia clients get the honest card in the glass
 *     while audio still works (§1.7).
 *   BEZEL — FREQ / λ / PERIOD readouts (source-aware) + LEVEL (dBFS ·
 *     relative, MIDI-ramp tint).
 *   DOCK — FREQ + LEVEL faders (FREQ pre-bound: the teaching parameter),
 *     SOURCE group tray (wave/noise/sweep + harmonics + phase/polarity), FX
 *     group tray (stereo balance + delay + EQ low-pass + Q), PLAY toggle key.
 *   WELL — the honesty disclosures in full, the teaching captions, the level
 *     bar, and the lab-review credit button. Long-press anything (bezel cells,
 *     dock keys, tray chips) → the per-control guided lesson, as before.
 *
 * HONESTY (§1.7): particle/cone motion is the slowed CONCEPTUAL model
 * (badged); waveform/spectrum are ANALYTIC — drawn from the settings, not
 * measured (badged); the meter is the COMMANDED output level, labeled
 * "LEVEL (dBFS · relative)" (owner ruling — "SPL" is reserved for the real
 * mic-based meter). Phase/polarity captions state they are inaudible ALONE
 * (mono, single source) — the setup for Module 10. Stereo/delay/EQ audio
 * needs the v6 effects path. The stage badge is the condensed one-liner; the
 * full disclosure texts read verbatim in the well.
 *
 * AUDIO: house idiom throughout — audio-output gate, additive/sine/noise/sweep
 * through the ONE generator lifecycle, fx via fxSet with fxReset on every stop
 * path (no leakage), speaker-safety guards, keepalive, teardown on blur.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApeDsp, FX, FX_PARAM, EQ_BAND_TYPES, GEN_MODES } from '../../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../features/audio/audioOutputStore';
import { guardAdditiveForEngine, guardNoiseLevelForEngine, guardToneLevelForEngine } from '../../../features/audio/speakerSafety';
import { eqResponseDb } from '../../../features/lab/fxViz';
import { LabReviewButton } from '../../../features/lab/LabReviewButton';
import { CheckQuestion } from './bits';
import { EngineGate } from '../../tools/EngineGate';
import type { EngineState } from '../../../features/tools/engine/useDspEngine';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { levelColor } from '../../../features/tools/levelColor';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { LabChip } from '../LabShell';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam } from '../rack/rackTypes';
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

  // Per-control help (owner request 2026-07-26): long-press a chip / key / a
  // bezel cell → the two-tier "what it does" popup from the foundations lesson.
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
  const gainDbAt = useMemo(() => {
    if (eqCut <= 0) return null;
    const band = [{ type: 'lowPass' as const, freq: eqCut, q: eqQ, gainDb: 0 }];
    return (f: number) => eqResponseDb(band, f);
  }, [eqCut, eqQ]);

  // ── Rack declarations ──────────────────────────────────────────────────────
  const levelCell: BezelItem = {
    k: 'LEVEL',
    v: `${levelDb} dBFS`,
    tint: levelColor(lvl01),
    helpKey: 'amplitude',
  };
  const bezel: BezelItem[] =
    source === 'wave'
      ? [
          { k: 'FREQ', v: `${freq} Hz`, helpKey: 'readouts' },
          { k: 'λ', v: `${(SPEED_OF_SOUND / freq).toFixed(2)} m`, helpKey: 'readouts' },
          { k: 'PERIOD', v: `${((1 / freq) * 1000).toFixed(2)} ms`, helpKey: 'readouts' },
          levelCell,
        ]
      : source === 'sweep'
        ? [{ k: 'SWEEP', v: '100 Hz → 8 kHz', flex: 2.4, helpKey: 'sweep' }, levelCell]
        : [{ k: 'CONTENT', v: 'BROADBAND — NO SINGLE PITCH', flex: 2.4, helpKey: 'noise' }, levelCell];

  const sourceValue =
    source === 'wave'
      ? WAVES.find((w) => w.key === wave)!.label
      : source === 'noise'
        ? NOISES.find((n) => n.key === noise)!.label
        : sweepKey === 'slow'
          ? 'SWP·S'
          : 'SWP·F';
  const panOn = Math.abs(balance - 0.5) > 0.02;
  const fxValue =
    [panOn ? 'PAN' : null, delayMs > 0 ? 'DLY' : null, eqCut > 0 ? 'EQ' : null]
      .filter(Boolean)
      .join('·') || 'OFF';

  // TRY THIS — guided-exploration prompts (learning pass 2026-08-31: the
  // sandbox graded D on scaffolding — free play with no hypotheses to test).
  // Predict → act → where to look; the linked views are the feedback. Filtered
  // per source so a prompt never references a control that is not on stage.
  const TRY_THIS: { when: 'wave' | 'noise' | 'sweep' | 'any'; text: string }[] = [
    { when: 'wave', text: 'Drop a SQUARE to FIRST 3 harmonics — predict first: do the corners get sharper or rounder? Watch WAVEFORM.' },
    { when: 'wave', text: 'LPF 500 Hz on a SAW — count the spectrum lines that should survive before you look.' },
    { when: 'wave', text: 'Flip POLARITY while playing. The drawing flips — the sound does not. Why not? Module 10 answers.' },
    { when: 'wave', text: 'Double FREQ and watch the bezel: λ should halve. Does it?' },
    { when: 'noise', text: 'Step WHITE → PINK → BROWN and watch the spectrum tilt. Which end loses energy each step?' },
    { when: 'sweep', text: 'Listen for the moment the sweep passes the pitch of your speaking voice — then check where the level meter sits.' },
    { when: 'any', text: 'Set LEVEL to the bottom of its range and watch all three views shrink together — same signal, three tellings.' },
  ];
  const [tryIdx, setTryIdx] = useState(0);
  const prompts = TRY_THIS.filter((t) => t.when === 'any' || t.when === source);
  const prompt = prompts[tryIdx % prompts.length];
  const [everPlayed, setEverPlayed] = useState(false);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: freq01,
      onChange: setFreq01,
      format: () => `${freq} Hz`,
      helpKey: 'frequency',
    },
    {
      kind: 'fader',
      id: 'level',
      label: 'LEVEL',
      level: true,
      value: lvl01,
      onChange: setLvl01,
      format: () => `${levelDb} dBFS`,
      formatShort: () => `${levelDb} dB`,
      // No frame tint: beside the genuinely BOUND key it read as a second
      // selected state (design pass 2026-08-31). The amplitude ramp still
      // carries the value on the bezel cell and the meter bar.
      helpKey: 'amplitude',
    },
    {
      kind: 'group',
      id: 'source',
      label: 'SOURCE',
      valueLabel: sourceValue,
      helpKey: 'waveform',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.sectionHead}>WAVE</Text>
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
          <Text style={styles.sectionHead}>NOISE · SWEEP</Text>
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
          {source === 'wave' ? (
            <>
              <Text style={styles.sectionHead}>HARMONIC RICHNESS</Text>
              <View style={styles.chipRow}>
                {RICHNESS.map((r) => (
                  <LabChip
                    key={r.key}
                    label={r.label}
                    selected={keep === r.key}
                    onPress={() => setKeep(r.key)}
                    onLongPress={() => help('harmonics')}
                  />
                ))}
              </View>
              <Text style={styles.sectionHead}>PHASE · POLARITY</Text>
              <View style={styles.chipRow}>
                {PHASES.map((p) => (
                  <LabChip
                    key={p}
                    label={`PHASE ${p}°`}
                    selected={phase === p}
                    onPress={() => setPhase(p)}
                    onLongPress={() => help('phase')}
                  />
                ))}
                <LabChip
                  label={inverted ? 'POLARITY −' : 'POLARITY +'}
                  selected={inverted}
                  onPress={() => setInverted((v) => !v)}
                  onLongPress={() => help('polarity')}
                />
              </View>
            </>
          ) : null}
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'fx',
      label: 'FX',
      valueLabel: fxValue,
      helpKey: 'eq',
      render: () => (
        <View style={{ gap: 10 }}>
          <DragSlider
            value={balance}
            onChange={setBalance}
            label="STEREO BALANCE"
            readout={
              balance < 0.48
                ? `L ${Math.round((0.5 - balance) * 200)}%`
                : balance > 0.52
                  ? `R ${Math.round((balance - 0.5) * 200)}%`
                  : 'CENTER'
            }
            onHelp={() => help('stereo_balance')}
          />
          <Text style={styles.sectionHead}>DELAY</Text>
          <View style={styles.chipRow}>
            {DELAYS.map((d) => (
              <LabChip
                key={d.key}
                label={d.label}
                selected={delayMs === d.key}
                onPress={() => setDelayMs(d.key)}
                onLongPress={() => help('delay')}
              />
            ))}
          </View>
          <Text style={styles.sectionHead}>EQ LOW-PASS</Text>
          <View style={styles.chipRow}>
            {EQ_CUTS.map((c) => (
              <LabChip
                key={c.key}
                label={c.label}
                selected={eqCut === c.key}
                onPress={() => setEqCut(c.key)}
                onLongPress={() => help('eq')}
              />
            ))}
            {QS.map((q) => (
              // Ghosted, not unmounted, while EQ is OFF: the chips appearing
              // out of nowhere reflowed the tray mid-read (design pass
              // 2026-08-31), and a ghosted Q quietly teaches that Q exists and
              // belongs to a filter.
              <View key={q.key} style={eqCut > 0 ? null : { opacity: 0.35 }}>
                <LabChip
                  label={q.label}
                  selected={eqCut > 0 && eqQ === q.key}
                  onPress={() => (eqCut > 0 ? setEqQ(q.key) : help('filter_q'))}
                  onLongPress={() => help('filter_q')}
                />
              </View>
            ))}
          </View>
          {/* UNCONDITIONAL (fix 2026-08-28): this note used to render only when
              the v6 effects path was ABSENT — i.e. it vanished on exactly the
              build where the user can hear balance/delay and would most expect
              to see them drawn. */}
          <Text style={styles.caption}>
            EQ shapes the drawings above. BALANCE and DELAY change what you HEAR only — they have
            no drawn twin yet.
            {!fxReady && engineReady ? ' (Their audio needs the v6+ effects build.)' : ''}
          </Text>
        </View>
      ),
    },
    ...(engineReady
      ? [
          {
            kind: 'toggle',
            id: 'play',
            label: playing ? 'STOP' : 'PLAY',
            value: playing,
            onToggle: () => {
              if (playing) stop();
              else {
                setEverPlayed(true);
                void start();
              }
            },
          } satisfies DockParam,
        ]
      : []),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>FOUNDATIONS PLAYGROUND</Text>
          {/* Was "Every control drives every view" — an overclaim: BALANCE and
              DELAY reach the audio but have no drawn twin (fix 2026-08-28). */}
          <Text style={styles.subtitle}>Drive the views, hear the change — experiment freely</Text>
        </View>
        <AccuracyNote compact />
      </View>

      <RackUnit
        initialParam="freq"
        params={params}
        onHelp={(k) => {
          if (k) help(k);
        }}
        stage={{
          // The floating drag tag sat OVER the air window — the exact view the
          // captions say to watch (owner rule: no hover objects over the
          // display). The pinned bezel cells under the glass carry the live
          // value already; M9 set the hideDragTag precedent.
          hideDragTag: true,
          size: 'L', // the whole playground of views — earns the tall glass
          badge: 'CONCEPTUAL MODEL — SLOWED · WAVEFORM/SPECTRUM ANALYTIC, NOT MEASURED',
          onGuide: () => help('waveform'),
          bezel,
          render: (w, h) =>
            viz ? (
              <StageViz
                viz={viz}
                w={w}
                h={h}
                visHz={displayVisHz}
                amp={0.25 + amp01 * 0.75}
                airMode={airMode}
                running={playing}
                source={source}
                freq01={freq01}
                freq={freq}
                amps={amps}
                phases={phases}
                level={0.35 + amp01 * 0.65}
                noiseKind={source === 'noise' ? noise : null}
                gainDbAt={gainDbAt}
              />
            ) : (
              <View style={styles.unavailWrap}>
                <VizUnavailableCard />
              </View>
            ),
        }}
      >
        {!engineReady ? <EngineGate state={gate} /> : null}

        {/* First-15-seconds nudge (design pass 2026-08-31): the sandbox opens
            SILENT with the PLAY key sitting far right looking disabled — and
            hearing the change is half this screen's premise. Never autoplay
            (speaker-safety rules); invite. */}
        {engineReady && !everPlayed && !playing ? (
          <Text style={styles.playNudge}>Press PLAY — you are looking at a sound. Hear every change you make.</Text>
        ) : null}

        {/* TRY THIS — one prompt at a time; ↻ advances. The views themselves
            are the feedback, so nothing is stored or graded. */}
        <View style={styles.tryCard}>
          <View style={styles.tryHead}>
            <Text style={styles.tryEyebrow}>TRY THIS</Text>
            <Pressable
              onPress={() => setTryIdx((i) => i + 1)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Another suggestion"
            >
              <Text style={styles.tryNext}>↻ ANOTHER</Text>
            </Pressable>
          </View>
          <Text style={styles.tryText}>{prompt.text}</Text>
        </View>

        {/* LEVEL (dBFS · relative) — the commanded output level, never "SPL". */}
        <Pressable
          onLongPress={() => help('amplitude')}
          delayLongPress={260}
          accessibilityRole="image"
          accessibilityLabel="Output level meter. Press and hold for an explanation."
        >
          <LevelMeterBar levelDb={levelDb} minDb={-48} maxDb={-16} />
        </Pressable>
        {genError ? <Text style={styles.error}>{genError}</Text> : null}

        {/* Source-aware teaching captions (reading — they may scroll). */}
        {source === 'wave' ? (
          <>
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
          <Text style={styles.caption}>
            Sweeping 100 Hz → 8 kHz, repeating — listen to the pitch climb. The waveform and
            spectrum drawings pause (a fixed frame would misrepresent a signal that never holds
            still); watch the air motion and the level instead.
          </Text>
        ) : (
          <Text style={styles.caption}>
            Noise is BROADBAND — every frequency at once, so there is no single pitch and the
            particles jitter instead of waving. White = equal energy per Hz; pink −3 dB/oct;
            brown −6 dB/oct.
          </Text>
        )}
        <Text style={styles.caption}>
          AIR — spacing tightens as pitch rises (that spacing IS wavelength). WAVEFORM — pressure
          vs time, one “window” of the signal. SPECTRUM — which frequencies, how strong
          {eqCut > 0 ? ' (EQ curve applied)' : ''}.
        </Text>

        {/* Full honesty disclosures, verbatim (the stage badge is the condensed
            one-liner — these are the complete texts). */}
        <ConceptBadge />
        <Text style={styles.badge}>
          ANALYTIC — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT (the measurement tools do the
          real thing)
        </Text>

        {/* Retrieval BEFORE the self-report (learning pass 2026-08-31): one
            combined-context check — deliberately the null-result experiment,
            because unexplained nothing-happened moments are where sandbox
            learners lose trust. Not a gate (dev-stage no-gating rule); placed
            so recall precedes the credit press. */}
        <CheckQuestion
          spec={{
            question: 'You low-pass a 295 Hz sine with the cutoff at 2 kHz. What changes?',
            options: [
              'The tone gets duller — highs are cut',
              'Nothing — its only partial sits far below the cutoff',
              'The pitch drops toward the cutoff',
            ],
            correctIdx: 1,
            reveal:
              'A pure sine has ONE partial. A low-pass at 2 kHz only removes energy ABOVE 2 kHz — and there is none. Filters change a sound only when something lives on the far side of the cutoff. Try the same filter on a SAW and count what survives.',
            wrongHint: 'Look at the spectrum pane: how many lines does a sine have, and where is yours relative to 2 kHz?',
          }}
        />

        {/* R6c: sandbox — no modules/challenge; explicit review records credit. */}
        <LabReviewButton labKey="af_sound_playground" />
      </RackUnit>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('foundations')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </View>
  );
}

/** The pinned stage: speaker + air side by side (one shared clock — phase-
 *  locked), analytic waveform + spectrum beneath. Height-parametric: every
 *  pane is sized from the glass height the rack grants. */
function StageViz({
  viz,
  w,
  h,
  visHz,
  amp,
  airMode,
  running,
  source,
  freq01,
  freq,
  amps,
  phases,
  level,
  noiseKind,
  gainDbAt,
}: {
  viz: VizModule;
  w: number;
  h: number;
  visHz: number;
  amp: number;
  airMode: 'wave' | 'noise';
  running: boolean;
  source: SourceKind;
  freq01: number;
  freq: number;
  amps: number[];
  phases: number[];
  level: number;
  noiseKind: NoiseKind | null;
  gainDbAt: ((f: number) => number) | null;
}) {
  const clock = viz.useVizClock(running);
  const GAP = 3;
  const LABEL_H = 12;
  // Air row 40% → 30% (design pass 2026-08-31): the two TEACHING panes were
  // squeezed to ~59px — below the visual resolution of the effects being
  // taught (harmonic corners, EQ tilt) — while the air row took 40%.
  const rowH = Math.max(56, Math.round(h * 0.3));
  const paneH = Math.max(30, Math.floor((h - rowH - 2 * (LABEL_H + GAP)) / 2));
  const spkW = Math.min(110, Math.max(84, Math.round(w * 0.32)));
  const airW = Math.max(60, w - spkW - GAP);
  // Air-window wavelength (px): wide at low pitch, tight at high pitch — only
  // for a single-frequency wave (noise/sweep have no single λ).
  const airLambdaPx = source === 'wave' ? airW / (1.3 + 4.7 * freq01) : undefined;

  return (
    <View style={{ width: w, height: h }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        <viz.SpeakerConeView clock={clock} width={spkW} height={rowH} visHz={visHz} amp={amp} mode={airMode} />
        <viz.AirParticlesView
          clock={clock}
          width={airW}
          height={rowH}
          visHz={visHz}
          amp={amp}
          mode={airMode}
          lambdaPx={airLambdaPx}
        />
      </View>
      {source === 'sweep' ? (
        <View style={[styles.sweepPause, { height: h - rowH }]}>
          <Text style={styles.sweepPauseText}>
            SWEEP — a moving tone: the waveform and spectrum drawings pause. Watch the air motion
            and the level.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.stageLabel, { height: LABEL_H, marginTop: GAP }]} numberOfLines={1}>
            WAVEFORM — PRESSURE VS TIME
          </Text>
          <viz.AnalyticWaveformView
            width={w}
            height={paneH}
            amps={amps}
            phasesDeg={phases}
            level={level}
            noise={noiseKind}
            f0={freq}
            gainDbAt={gainDbAt}
          />
          <Text style={[styles.stageLabel, { height: LABEL_H, marginTop: GAP }]} numberOfLines={1}>
            SPECTRUM — {noiseKind ? 'LOG 40 Hz–16 kHz' : `LINEAR TO ${13 * freq} Hz`}
            {!noiseKind && amps.filter((a) => a > 0.001).length === 1 ? ' · 1 PARTIAL — PURE TONE' : ''}
            {gainDbAt ? ' · EQ APPLIED' : ''}
          </Text>
          <viz.AnalyticSpectrumView width={w} height={paneH} f0={freq} amps={amps} gainDbAt={gainDbAt} noise={noiseKind} level={level} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  // Stage chrome
  stageLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: '#9a9ca8',
    paddingHorizontal: 4,
  },
  sweepPause: { justifyContent: 'center', paddingHorizontal: 16 },
  playNudge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: '#37e05f',
    textAlign: 'center',
  },
  tryCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#161310',
    padding: 11,
    gap: 6,
  },
  tryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tryEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.7, color: colors.amber },
  tryNext: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amberLabel },
  tryText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  sweepPauseText: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSub,
    textAlign: 'center',
  },
  unavailWrap: { flex: 1, justifyContent: 'center', padding: 10 },
});
