/**
 * ModularLabScreen — WAVE-2 expansion lab "Modular Synth" (owner 2026-07-26)
 * on the shared LabShell. The canonical subtractive voice with its sections
 * and SIGNAL FLOW made explicit: VCO → VCF → VCA plus the three mod sources
 * (ADSR, LFO, sequencer), each explained and each routing drawn.
 *
 * HERO: a Eurorack case patched exactly like the native signal path (lab-art
 * fix 2026-10-16, was a flow chart of boxes) — control sources on the left,
 * the audio path right to OUT, a cable for exactly the routings currently
 * active (env→VCA always; env→cutoff, LFO→dest, SEQ→pitch + gate as
 * configured), every knob at the patch's value. PATCH IDEAS presets set every parameter and state WHY that
 * routing makes that classic sound.
 *
 * LIVE + HONEST: the env meter and the running step highlight read the REAL
 * native modStatus (no fake meters, §1.7). Audio needs engineVersion ≥ 7 —
 * below it the diagram + lessons work and the build requirement is stated.
 *
 * RACK UNIT (2026-08-23, APE_LAB_UX_PROPOSAL): the live diagram pins on the
 * stage — its env meter and step LEDs ARE the lab's real readouts (they can't
 * split out without faking them, §1.7), so the bezel carries the patch STATE
 * instead (PATCH · VCO · LFO · SEQ). The dock holds a continuous CUTOFF fader
 * (the subtractive-synthesis teaching param, pre-bound — the discrete cutoff
 * chips grew up into the lane; the native target ramps) plus PATCH/VCO/MOD/SEQ
 * trays; only the prose scrolls. The dominant start/stop (RUN SEQUENCE / PLAY
 * DRONE) stays the compact HeaderPlayButton via LabShell's headerAction.
 */
import { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../components/DimModal';
import { useLabClearedUnits, useLabCompletionUnreadable } from '../../features/lab/labCompletion';
import { UNDERSTANDING_UNIT } from '../../features/lab/understanding';
import { safeGoBack } from '../../lib/safeGoBack';
import { runSoon } from '../../lib/afterInteractions';
import { LabEndLink, LabEndScreen } from './kit/LabEndScreen';
import type { LabEndUnit } from './kit/labEnd';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ApeDsp, AUDIO_UNAVAILABLE_MESSAGE, MOD_PARAM } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { startFenced } from '../../features/audio/startFenced';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { CheckQuestion } from './foundations/bits';
import { LabShell, LabChip, HeaderPlayButton } from './LabShell';
import { StageAspectReport, useStageTextScale } from './rack/stageAspect';
import { useStopOnAudioMute } from '../../features/audio/useStopOnAudioMute';
import { useStopWhenSilenced } from '../../features/audio/useStopWhenSilenced';
import { useStopOnClose } from '../../features/audio/useStopOnBlur';
import { ModularSpectrum } from './modular/ModularSpectrum';

const ACTIVITY_MS = 500;
const STATUS_MS = 100; // live env/step poll while running (10 Hz)

// Blurbs are FILTER-fodder-focused: in a modular patch the VCO's job is to
// feed the filter harmonics to carve (owner 2026-08-28).
const SHAPES = [
  { v: 0, label: 'SAW', blurb: 'Every harmonic — the richest raw material. The filter has the most to carve; sweeps sound biggest here.' },
  { v: 1, label: 'SQUARE', blurb: 'Odd harmonics only: hollow and woody. The filter still has plenty to grab.' },
  { v: 2, label: 'TRI', blurb: 'Weak, fast-fading harmonics — the filter has little to remove, so sweeps are subtle.' },
  { v: 3, label: 'SINE', blurb: 'No harmonics at all. The filter can only make it quieter — sweep and hear almost nothing change. That IS the lesson.' },
] as const;
// CUTOFF is the dock's pre-bound fader (2026-08-23): a LOG sweep 250 Hz →
// 8 kHz replacing the old discrete chips — the native cutoff target ramps, so
// riding the lane IS the filter-sweep lesson. Presets land on exact positions.
const CUT_MIN = 250;
const CUT_MAX = 8000;
const cutFromPos = (v: number) =>
  Math.round(CUT_MIN * Math.pow(CUT_MAX / CUT_MIN, Math.max(0, Math.min(1, v))));
const cutPosFromHz = (hz: number) =>
  Math.log(Math.max(CUT_MIN, Math.min(CUT_MAX, hz)) / CUT_MIN) / Math.log(CUT_MAX / CUT_MIN);
const fmtCut = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${Math.round(hz)} Hz`);
const fmtCutShort = (hz: number) => (hz >= 1000 ? `${(hz / 1000).toFixed(1)}k` : `${Math.round(hz)}`);
const RESONANCES = [
  { v: 0, label: 'RES 0' },
  { v: 0.5, label: 'RES ½' },
  { v: 1, label: 'RES MAX' },
] as const;
const ENV_PRESETS = [
  { key: 'pluck', label: 'PLUCK', a: 0.003, d: 0.18, s: 0.0, r: 0.12 },
  { key: 'pad', label: 'PAD', a: 0.6, d: 0.3, s: 0.8, r: 0.8 },
  { key: 'organ', label: 'ORGAN', a: 0.005, d: 0.05, s: 1.0, r: 0.08 },
] as const;
const ENV_TO_CUT = [
  { v: 0, label: 'ENV→VCF OFF' },
  { v: 0.5, label: '+50%' },
  { v: 1, label: '+100%' },
] as const;
const LFO_RATES = [0.5, 2, 6] as const;
const LFO_DEPTHS = [
  { v: 0, label: 'DEPTH 0' },
  { v: 0.5, label: '½' },
  { v: 1, label: 'MAX' },
] as const;
const LFO_DESTS = [
  { v: 0, label: 'OFF' },
  { v: 1, label: '→PITCH' },
  { v: 2, label: '→CUTOFF' },
  { v: 3, label: '→AMP' },
] as const;
const SEQ_RATES = [2, 4, 8] as const;
/** Step cycle values: semitone offsets + rest. */
const STEP_CYCLE = [0, 3, 5, 7, 12, -1] as const; // −1 = rest
const BASE_FREQ = 110;

type Patch = {
  shape: number;
  cutoff: number;
  res: number;
  envKey: (typeof ENV_PRESETS)[number]['key'];
  envToCut: number;
  lfoRate: number;
  lfoDepth: number;
  lfoDest: number;
  seqOn: boolean;
  seqRate: number;
  steps: number[]; // semitones, −1 = rest
};

const DEFAULT_PATCH: Patch = {
  shape: 0,
  cutoff: 2000,
  res: 0,
  envKey: 'organ',
  envToCut: 0,
  lfoRate: 2,
  lfoDepth: 0,
  lfoDest: 0,
  seqOn: false,
  seqRate: 4,
  steps: [0, 0, 7, 0, 3, 0, 12, -1],
};

/** PATCH IDEAS — classic routings with the WHY (the signal-flow lesson). */
const PATCH_IDEAS: { key: string; label: string; why: string; patch: Patch }[] = [
  {
    key: 'drone',
    label: 'RAW DRONE',
    why: 'Just VCO → open VCF → VCA: the unshaped starting point every patch carves from.',
    patch: { ...DEFAULT_PATCH, cutoff: 8000, envKey: 'organ' },
  },
  {
    key: 'bass',
    label: 'ACID BASS',
    why: 'Env → cutoff with a fast decay: every sequencer note opens bright and slams shut — the squelch is the filter envelope, not the oscillator.',
    patch: { ...DEFAULT_PATCH, cutoff: 800, res: 1, envKey: 'pluck', envToCut: 1, seqOn: true, seqRate: 8 },
  },
  {
    key: 'wobble',
    label: 'WOBBLE',
    why: 'LFO → cutoff: the filter sweeps rhythmically while pitch holds still — movement without melody.',
    patch: { ...DEFAULT_PATCH, cutoff: 800, res: 0.5, lfoRate: 2, lfoDepth: 1, lfoDest: 2 },
  },
  {
    key: 'vibrato',
    label: 'VIBRATO LEAD',
    why: 'LFO → pitch at low depth: the singing wobble — the SAME LFO that wobbles the filter, just re-routed.',
    patch: { ...DEFAULT_PATCH, shape: 2, cutoff: 8000, lfoRate: 6, lfoDepth: 0.5, lfoDest: 1 },
  },
  {
    key: 'tremolo',
    label: 'TREMOLO',
    why: 'LFO → amp: loudness pulses while pitch and tone stay put — the third classic destination.',
    patch: { ...DEFAULT_PATCH, shape: 2, cutoff: 8000, lfoRate: 6, lfoDepth: 1, lfoDest: 3 },
  },
];

const INTRO =
  'One oscillator, one filter, one amplifier — and three modulators that automate them. ' +
  'Every classic synth sound is a routing decision: what modulates what. The case below is ' +
  'patched exactly like the audio engine: every cable you see is a live routing.';

export function ModularLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const modReady = engineReady && ApeDsp.wave2Available();

  const [patch, setPatch] = useState<Patch>(DEFAULT_PATCH);
  const [patchKey, setPatchKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  // Something else can silence this lab — backgrounding, shake-to-mute, the
  // idle auto-mute. Without this the transport stayed lit over silence.
  useStopOnAudioMute(setRunning);

  const [envLevel, setEnvLevel] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  /** Push the WHOLE patch through the scalar setter (targets ramp natively). */
  const pushPatch = useCallback((p: Patch) => {
    const env = ENV_PRESETS.find((e) => e.key === p.envKey)!;
    ApeDsp.modSet(MOD_PARAM.shape, p.shape);
    ApeDsp.modSet(MOD_PARAM.baseFreq, BASE_FREQ);
    ApeDsp.modSet(MOD_PARAM.cutoff, p.cutoff);
    ApeDsp.modSet(MOD_PARAM.resonance, p.res);
    ApeDsp.modSet(MOD_PARAM.envA, env.a);
    ApeDsp.modSet(MOD_PARAM.envD, env.d);
    ApeDsp.modSet(MOD_PARAM.envS, env.s);
    ApeDsp.modSet(MOD_PARAM.envR, env.r);
    ApeDsp.modSet(MOD_PARAM.envToCutoff, p.envToCut);
    ApeDsp.modSet(MOD_PARAM.lfoRate, p.lfoRate);
    ApeDsp.modSet(MOD_PARAM.lfoDepth, p.lfoDepth);
    ApeDsp.modSet(MOD_PARAM.lfoDest, p.lfoDest);
    ApeDsp.modSet(MOD_PARAM.seqOn, p.seqOn ? 1 : 0);
    ApeDsp.modSet(MOD_PARAM.seqRate, p.seqRate);
    p.steps.forEach((s, i) => {
      ApeDsp.modSet(MOD_PARAM.seqStep(i), s < 0 ? 0 : s);
      ApeDsp.modSet(MOD_PARAM.seqGate(i), s < 0 ? 0 : 1);
    });
    ApeDsp.modSet(MOD_PARAM.levelDb, -18);
  }, []);

  /** Change patch state and (while running) push live. */
  const update = useCallback(
    (patchPatch: Partial<Patch>, fromPreset: string | null = null) => {
      setPatch((prev) => {
        const next = { ...prev, ...patchPatch };
        pushPatch(next);
        if (running) noteAudioActivity();
        return next;
      });
      setPatchKey(fromPreset);
    },
    [pushPatch, running],
  );

  /** CUTOFF lane (2026-10-14): one bridge call per tick — the single native
   *  target that moved — not the whole ~50-call patch push, and no side effect
   *  inside the state updater. Presets and ▶ still push the whole patch. */
  const setCutoff = useCallback(
    (hz: number) => {
      ApeDsp.modSet(MOD_PARAM.cutoff, hz);
      if (running) noteAudioActivity();
      setPatch((prev) => (prev.cutoff === hz ? prev : { ...prev, cutoff: hz }));
      setPatchKey(null);
    },
    [running],
  );

  // Generation guard (fix 2026-08-28) — see BinauralLabScreen: backing out while
  // modStart() was still in flight left the sequencer sounding with no stop
  // affordance. Same pattern as BassLabScreen/AutotuneLabScreen.
  const genRef = useRef(0);
  // Double-tap ▶ (bug hunt 2026-09-30, FmLab's pattern): a superseded start
  // only stops the sequencer when nothing newer wants it.
  const wantRef = useRef(false);

  const start = useCallback(async () => {
    if (!modReady) return;
    const gen = ++genRef.current;
    wantRef.current = true;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    pushPatch(patch);
    try {
      // The fence (startFenced): a mute, a leave, or a stop-all that lands
      // while the native start is in flight wins — this start never sounds on.
      const fenced = await startFenced({
        start: () => ApeDsp.modStart(),
        // A newer ▶ owns the sequencer; a leave/stop meanwhile silences it.
        stop: (_s, why) => (why === 'superseded' && wantRef.current ? undefined : ApeDsp.modStop()),
        isCurrent: () => gen === genRef.current,
      });
      if (fenced.status !== 'started') return;
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(AUDIO_UNAVAILABLE_MESSAGE);
    }
  }, [modReady, requestAudioOutput, pushPatch, patch]);

  const stop = useCallback(() => {
    genRef.current++;
    wantRef.current = false;
    void ApeDsp.modStop();
    setRunning(false);
    setEnvLevel(0);
    setActiveStep(-1);
  }, []);
  // Shake-to-mute (and the idle/background lock) silences the voices from
  // outside this screen; without this the transport would keep saying it is
  // playing. See useStopWhenSilenced.
  useStopWhenSilenced(running, stop);

  useStopOnClose(stop); // on CLOSE, not blur - keeps playing under other screens (owner 2026-09-29, useStopOnBlur.ts)
  useEffect(() => {
    if (!running) return;
    const keep = setInterval(noteAudioActivity, ACTIVITY_MS);
    // REAL live state (native modStatus): env meter + running step (§1.7).
    const poll = setInterval(() => {
      const st = ApeDsp.modStatus();
      if (st) {
        setEnvLevel(st.envLevel);
        setActiveStep(st.activeStep);
      }
    }, STATUS_MS);
    return () => {
      clearInterval(keep);
      clearInterval(poll);
    };
  }, [running]);

  const cycleStep = (i: number) => {
    const cur = patch.steps[i];
    const idx = STEP_CYCLE.indexOf(cur as (typeof STEP_CYCLE)[number]);
    const next = STEP_CYCLE[(idx + 1) % STEP_CYCLE.length];
    update({ steps: patch.steps.map((s, k) => (k === i ? next : s)) });
  };

  const env = ENV_PRESETS.find((e) => e.key === patch.envKey)!;
  const shapeLabel = SHAPES.find((s) => s.v === patch.shape)?.label ?? '—';
  const patchIdea = PATCH_IDEAS.find((p) => p.key === patchKey) ?? null;
  // LFO state for the bezel/MOD key — a routing only exists with depth > 0.
  const lfoLive = patch.lfoDepth > 0 && patch.lfoDest > 0;
  const lfoShort = lfoLive ? ['OFF', '→PIT', '→CUT', '→AMP'][patch.lfoDest] : 'OFF';
  const resShort = patch.res >= 1 ? 'MAX' : patch.res > 0 ? '½' : '0';

  // ── RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23) ────────────────────────────
  // The live diagram pins on the stage (env meter + step LEDs are the REAL
  // readouts); the bezel names the patch state; CUTOFF rides the pre-bound
  // lane; the chip collections become STICKY trays so the cables/audio react
  // while comparing. Only the teaching prose scrolls.
  return (
    <LabShell
      labId="modular"
      title="MODULAR SYNTH LAB"
      subtitle="VCO · VCF · VCA · LFO · Envelope · Sequencer"
      intro={INTRO}
      exploreCaption="Route the modulators and watch the patch cables move — the case is patched exactly like the sound you hear."
      checkEnd={<ModularLabEnd onOpen={stop} />}
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!modReady}
          onPress={() => (running ? stop() : void start())}
          label={running ? 'Stop' : patch.seqOn ? 'Run the sequence' : 'Play the drone'}
        />
      }
      rack={{
        initialParam: 'cutoff',
        onHelp: openLesson,
        stage: {
          size: 'L', // the live signal path IS the lab — earns the tall glass
          // …but not at the well's expense (follow-up 2026-10-15): on a
          // 411 × 731 phone this five-window bezel, two-line badge and
          // five-key dock left a ~50 dp well — the prose and FINISH · SEE
          // WHAT'S LEFT reachable only after HIDE DISPLAY, and the SEQ tray's
          // step chips under its "more ↓". The rack lowers the glass just
          // enough to keep this much well (and the trays gain the same room).
          minWell: 132,
          fullScreen: true, // the rack's ⤢ FULL SCREEN (full-screen build 2026-09-30)
          badge: 'THE PATCH — EVERY CABLE IS LIVE · KNOBS AT YOUR SETTINGS',
          onGuide: () => openLesson('display'),
          bezel: [
            {
              k: 'PATCH',
              v: patchIdea?.label ?? 'CUSTOM',
              flex: 1.4,
              helpKey: patchIdea ? `patch_${patchIdea.key}` : 'display',
            },
            { k: 'VCO', v: shapeLabel, helpKey: 'vco' },
            // RES on the bezel (emulator pass 2026-10-14): it was readable only
            // inside the MOD tray, unlike every other patch setting.
            { k: 'RES', v: resShort, helpKey: 'vcf' },
            { k: 'LFO', v: lfoShort, tint: lfoLive ? LFO_COLOR : undefined, helpKey: 'lfo' },
            {
              k: 'SEQ',
              v: patch.seqOn ? `${patch.seqRate}/s` : 'OFF',
              tint: patch.seqOn ? SEQ_COLOR : undefined,
              helpKey: 'sequencer',
            },
          ],
          render: (w, h) => (
            <PatchDiagram
              w={w}
              h={h}
              patch={patch}
              envLevel={envLevel}
              activeStep={activeStep}
              running={running}
              onBox={openLesson}
            />
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'cutoff',
            label: 'CUTOFF',
            // Log sweep 250 Hz → 8 kHz; the native cutoff target ramps, so the
            // lane IS the filter-sweep lesson (audible live while running).
            value: cutPosFromHz(patch.cutoff),
            onChange: (v) => setCutoff(cutFromPos(v)),
            format: () => fmtCut(patch.cutoff),
            formatShort: () => fmtCutShort(patch.cutoff),
            helpKey: 'vcf',
          },
          {
            kind: 'group',
            id: 'patch',
            label: 'PATCH',
            valueLabel: patchIdea?.label ?? 'CUSTOM',
            helpKey: patchIdea ? `patch_${patchIdea.key}` : 'display',
            // Group (not options) so the WHY stays co-visible with the chips —
            // pick a routing, read why it makes that sound, watch cables light.
            render: () => (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionHead}>PATCH IDEAS — CLASSIC ROUTINGS</Text>
                <View style={styles.chipRow}>
                  {PATCH_IDEAS.map((p) => (
                    <LabChip
                      key={p.key}
                      label={p.label}
                      selected={patchKey === p.key}
                      onPress={() => update(p.patch, p.key)}
                      onLongPress={() => openLesson(`patch_${p.key}`)}
                    />
                  ))}
                </View>
                {patchIdea ? <Text style={styles.whyText}>{patchIdea.why}</Text> : null}
              </View>
            ),
          },
          {
            kind: 'options',
            id: 'vco',
            label: 'VCO',
            valueLabel: shapeLabel,
            options: SHAPES.map((s) => ({ id: String(s.v), label: s.label, blurb: s.blurb })),
            selectedId: String(patch.shape),
            onSelect: (id) => update({ shape: Number(id) }),
            sticky: true, // A/B the timbres while the drone plays
            helpKey: 'vco',
          },
          {
            kind: 'group',
            id: 'mod',
            label: 'MOD',
            // Env preset + live LFO routing stay visible on the key.
            valueLabel: `${env.label.slice(0, 3)}·${lfoLive ? ['', 'PIT', 'CUT', 'AMP'][patch.lfoDest] : 'OFF'}`,
            helpKey: 'lfo',
            render: () => (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionHead}>VCF — RESONANCE</Text>
                <View style={styles.chipRow}>
                  {RESONANCES.map((r) => (
                    <LabChip
                      key={r.label}
                      label={r.label}
                      selected={patch.res === r.v}
                      onPress={() => update({ res: r.v })}
                      onLongPress={() => openLesson('vcf')}
                    />
                  ))}
                </View>
                <Text style={styles.sectionHead}>ENVELOPE (ADSR) — VCA + OPTIONAL → CUTOFF</Text>
                <View style={styles.chipRow}>
                  {ENV_PRESETS.map((e) => (
                    <LabChip
                      key={e.key}
                      label={e.label}
                      selected={patch.envKey === e.key}
                      onPress={() => update({ envKey: e.key })}
                      onLongPress={() => openLesson('envelope')}
                    />
                  ))}
                  {ENV_TO_CUT.map((e) => (
                    <LabChip
                      key={e.label}
                      label={e.label}
                      selected={patch.envToCut === e.v}
                      onPress={() => update({ envToCut: e.v })}
                      onLongPress={() => openLesson('envelope')}
                    />
                  ))}
                </View>
                <Text style={styles.sectionHead}>LFO — ONE MODULATOR, THREE EFFECTS</Text>
                {/* Selected-routing readout (standing tray-blurb pattern,
                    2026-08-31): the DEPTH-0 trap used to leave a highlighted
                    destination with a vanished cable and no explanation. */}
                <Text style={styles.caption}>
                  {patch.lfoDepth <= 0 || patch.lfoDest === 0
                    ? 'Routing OFF — a routing is live only with DEPTH above zero AND a destination. A cable in the case is the proof.'
                    : `LIVE: LFO ${patch.lfoRate} Hz ${LFO_DESTS.find((d) => d.v === patch.lfoDest)?.label ?? ''} — the blue cable in the case confirms it.`}
                </Text>
                <View style={styles.chipRow}>
                  {LFO_RATES.map((r) => (
                    <LabChip
                      key={r}
                      label={`${r} Hz`}
                      selected={patch.lfoRate === r}
                      onPress={() => update({ lfoRate: r })}
                      onLongPress={() => openLesson('lfo')}
                    />
                  ))}
                  {LFO_DEPTHS.map((d) => (
                    <LabChip
                      key={d.label}
                      label={d.label}
                      selected={patch.lfoDepth === d.v}
                      onPress={() => update({ lfoDepth: d.v })}
                      onLongPress={() => openLesson('lfo')}
                    />
                  ))}
                </View>
                <View style={styles.chipRow}>
                  {LFO_DESTS.map((d) => (
                    <LabChip
                      key={d.label}
                      label={d.label}
                      selected={patch.lfoDest === d.v}
                      onPress={() => update({ lfoDest: d.v })}
                      onLongPress={() => openLesson('lfo')}
                    />
                  ))}
                </View>
              </View>
            ),
          },
          {
            kind: 'group',
            id: 'seq',
            label: 'SEQ',
            valueLabel: patch.seqOn ? `${patch.seqRate}/s` : 'OFF',
            helpKey: 'sequencer',
            render: () => (
              <View style={{ gap: 10 }}>
                <View style={styles.chipRow}>
                  <LabChip
                    label={patch.seqOn ? 'SEQ ON' : 'SEQ OFF'}
                    selected={patch.seqOn}
                    onPress={() => update({ seqOn: !patch.seqOn })}
                    onLongPress={() => openLesson('sequencer')}
                  />
                  {/* A rate is a SEQ-ON choice (emulator pass 2026-10-14): while
                      OFF no rate is lit (a lit "4/s" beside SEQ OFF read as
                      running), the rates sit dimmed, and tapping one turns the
                      sequencer ON at that rate — never a silent tap. */}
                  <View style={[styles.chipRow, !patch.seqOn && styles.dimmed]}>
                    {SEQ_RATES.map((r) => (
                      <LabChip
                        key={r}
                        label={`${r}/s`}
                        selected={patch.seqOn && patch.seqRate === r}
                        onPress={() => update({ seqOn: true, seqRate: r })}
                        onLongPress={() => openLesson('sequencer')}
                      />
                    ))}
                  </View>
                </View>
                {/* CONTROLS FIRST (follow-up 2026-10-15): the rates, then the
                    STEPS straight under them, then the words. With the
                    heading and the OFF note above them the eight step chips
                    sat under the tray's "more ↓" on a 731 dp phone — the
                    sequencer's own controls hidden behind its explanation.
                    The heading now names the row it sits under. */}
                <View style={styles.stepRow}>
                  {patch.steps.map((s, i) => (
                    <View key={i} style={{ flex: 1 }}>
                      <LabChip
                        compact
                        label={s < 0 ? '✕' : `+${s}`}
                        selected={running && patch.seqOn && activeStep === i}
                        onPress={() => cycleStep(i)}
                        onLongPress={() => openLesson('sequencer')}
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.sectionHead}>SEQUENCER — 8 STEPS (TAP TO CYCLE · ✕ = REST)</Text>
                {!patch.seqOn ? (
                  <Text style={styles.caption}>Sequencer OFF — the voice is a steady drone. Tap a rate to turn it on at that speed.</Text>
                ) : null}
                <Text style={styles.caption}>
                  Steps are semitone offsets from {BASE_FREQ} Hz; each active step retunes the VCO
                  and retriggers the envelope (the SEQ’s CV and GATE cables). The lit step (in
                  the tray AND on the SEQ module’s step
                  LEDs) is the REAL native sequencer position.
                </Text>
              </View>
            ),
          },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>READING THE CASE</Text>
        <Text style={styles.caption}>
          Seven modules in one row of a Eurorack case. Right side, AMBER cables: the audio path —
          the VCO’s waveform output into the VCF, then the VCA, then OUT. Left side: the control
          sources. Each control cable takes its source’s colour (the line under the module’s
          name: SEQ red, LFO blue, ENV green). It carries control voltage (CV) — it turns a
          setting for you and makes no sound itself. The envelope always opens the VCA; every
          other cable is a routing you choose. Tap any module for what it does.
        </Text>
        <Text style={styles.caption}>
          Labels sit above each jack; outputs are in the shaded boxes; each knob sits at your
          setting. V/OCT and PITCH = pitch inputs · GATE = note on/off · MAN = the envelope’s
          hand gate, held down for the drone when the sequencer is off · CV1 / CV2 = control
          inputs (the VCF’s CV1 knob sets how far the envelope moves the filter) · the ENV has
          two OUT jacks carrying the same envelope, so it can feed two places · the VCA is a pair
          in a row: OFS 1 closed (the envelope opens it), OFS 2 open (the LFO can only dip it) ·
          LVL = output level.
        </Text>
        <Text style={styles.caption}>
          Every cable is a live routing — nothing decorative. While the voice runs, the ENV light
          glows with the real envelope level, the lit SEQ step button is the real sequencer step
          and OUT’s ON light is lit.
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE VOICE, AS SOUND</Text>
        {/* The RESULT, computed (lab-art fix 2026-10-16): the VCO's harmonics
            and what the VCF leaves of them, from the patch's own numbers. */}
        <ModularSpectrum shape={patch.shape} f0={BASE_FREQ} cutoff={patch.cutoff} res={patch.res} cutLabel={fmtCut(patch.cutoff)} />
        <Text style={styles.caption}>
          Each bar is one harmonic of the {BASE_FREQ} Hz note — taller is louder. Grey shows
          what the VCF removed; drag CUTOFF and watch the bars right of the line turn grey.
          Calculated from your patch with the engine’s filter formula: the steady note at the
          CUTOFF setting, before the envelope or LFO move it and before the output stage’s soft
          saturation. Learn here; measure real gear with a calibrated analyzer.
        </Text>
        {/* AUDIO — engine-gated ≥ v7, honest below. RUN/PLAY lives in the
            header (▶ = run sequence with SEQ on, play drone with it off). */}
        {engineReady ? (
          modReady ? (
            <>
              <Text style={styles.caption}>
                {patch.seqOn ? 'RUN SEQUENCE' : 'PLAY DRONE'} (header ▶) outputs −18 dBFS ·
                uncalibrated. The output stage saturates softly at high resonance (analog-style,
                stated). Sequencer off = a sustained drone so every knob is explorable.
              </Text>
              {genError ? <Text style={styles.error}>{genError}</Text> : null}
            </>
          ) : (
            <Text style={styles.caption}>
              Modular audio needs the v7 engine build — this dev client predates it. The patched
              case and lessons are fully functional; install the v7 build to hear the voice.
            </Text>
          )
        ) : null}
      </View>

{/* Retrieval (learning pass 2026-08-31) — NEW COPY, owner review. */}
      <CheckQuestion
        spec={{
          question: 'The loudness pulses steadily but the pitch holds. Which routing is patched?',
          options: ['LFO → AMP (tremolo)', 'LFO → PITCH (vibrato)', 'ENV → CUTOFF'],
          correctIdx: 0,
          reveal:
            'A slow modulator into the AMPLIFIER wobbles volume — tremolo. Into PITCH it wobbles frequency — vibrato. Same LFO, different destination: the destination IS the effect.',
          wrongHint: 'Patch LFO →AMP and watch which cable lights.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'A note starts bright and mellows as it decays. What creates that?',
          options: ['The envelope routed to the filter CUTOFF', 'A faster LFO', 'More resonance'],
          correctIdx: 0,
          reveal:
            'ENV → CUTOFF sweeps the filter open at the attack and closes it through the decay — brightness that follows the note\u2019s shape. That one routing is most of what people mean by "synth bass".',
          wrongHint: 'Enable ENV→CUT in the MOD tray and strike a note.',
        }}
      />

      <ModularLabEnd onOpen={stop} />

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('modular')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/** The lab's one credited unit: LabShell's understanding check (CHECK tab). */
const MODULAR_END_UNITS: LabEndUnit[] = [
  {
    id: UNDERSTANDING_UNIT,
    label: 'Understanding check',
    detail: 'The CHECK tab at the top of this lab — every answer correct, retry until you are.',
    kind: 'check',
  },
];

/**
 * The "what's left" END SCREEN (owner hard rule: every lab ends on one;
 * emulator pass 2026-10-14 — this lab ended on the CHECK's "Lab complete"
 * card with no DONE / BACK TO LABS / practise-again). Same shape as
 * kit/ReviewLabEnd: a FINISH · SEE WHAT'S LEFT link at the foot of the well
 * opens the shared LabEndScreen as a full-screen layer, so the patch stays as
 * left underneath. The unit is the understanding check, read from the banked
 * record (never cleared — practising again only returns to the lab). Nothing
 * auto-appears (Low-Light): only a tap opens it.
 */
function ModularLabEnd({ onOpen }: { onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cleared = useLabClearedUnits('modular');
  const unreadable = useLabCompletionUnreadable();
  const close = () => setOpen(false);
  return (
    <>
      <LabEndLink
        onPress={() => {
          onOpen();
          setOpen(true);
        }}
      />
      <Modal visible={open} animationType="none" onRequestClose={close} statusBarTranslucent>
        <View style={[styles.endRoot, { paddingTop: insets.top + 8 }]}>
          <View style={styles.endHeader}>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back to the Modular Synth lab">
              <Text style={styles.endBack}>‹ BACK TO THE LAB</Text>
            </Pressable>
            <Text style={styles.endTitle} accessibilityRole="header">Where you are</Text>
          </View>
          <LabEndScreen
            labTitle="Modular Synth Lab"
            units={MODULAR_END_UNITS}
            cleared={cleared}
            unreadable={unreadable}
            mode="credit"
            noun="check"
            onJump={close}
            onPracticeAgain={close}
            onDone={() => {
              close();
              // Off this tap, once the layer is closing (never two screens at once).
              runSoon(() => safeGoBack(navigation));
            }}
            bottomInset
          />
        </View>
      </Modal>
    </>
  );
}

// Routing identity colors — shared by the cables AND the bezel tints.
const LFO_COLOR = '#6fa8ff';
const ENV_COLOR = '#5bff85';
const SEQ_COLOR = '#ff8d7a';

// ── THE EURORACK CASE (lab-art fix 2026-10-16) ──────────────────────────────
// The graded flow chart (rounded boxes VCO → VCF → VCA → OUT, LFO · ENV · SEQ)
// is now the real thing: seven Eurorack modules at true HP widths (1 HP =
// 5.08 mm) and 3U height (128.5 mm), mounted in one row of a case between
// its rails, every knob turned to the lab's actual value and every jack
// labelled. Patch cables run between the actual jacks — one cable per
// routing, each its own lane (own jacks, own sag depth), hanging under
// gravity from plug to plug and colour-coded: amber = the AUDIO path, the
// source's colour = a CONTROL (CV) cable. Control sources sit on the left,
// the audio path runs left → right to OUT on the right, and a bracket above
// the case names each group (outside the panels — labels never on objects).
//
// Real conventions kept: jacks low on the panel with their legend above;
// OUTPUTS sit in shaded boxes (inputs do not); the VCO has one output per
// waveform (the VCO tray's choice IS which jack the audio cable leaves from);
// the envelope's amount into the filter is the VCF's CV1 attenuverter
// (centre = 0); the sequencer's GATE drives the envelope's GATE input and its
// CV drives the VCO's 1 V/oct input — exactly the engine's retune + retrigger
// (Modular.hpp). Live readouts stay REAL (§1.7): the ENV LED glows with the
// native envelope level, the SEQ step button lights at the native step, the
// OUT LED is lit while the voice runs.
const HP_MM = 5.08;
const U3_MM = 128.5;

type JackSpec = {
  id: string;
  /** Centre, in HP from the module's left edge. */
  x: number;
  /** 0 = the bottom jack row, 1 = the row above it. */
  row: 0 | 1;
  out?: boolean;
  label?: string;
  /** VCO waveform outputs carry the classic panel glyph instead of a word. */
  glyph?: number;
};
type KnobSpec = { id: string; x: number; f: number; big?: boolean; label: string; bipolar?: boolean };
type ModuleSpec = { key: string; name: string; hp: number; help: string; trim: string; jacks: JackSpec[]; knobs: KnobSpec[] };

/** Left → right in the case. Widths are true HP for modules of this kind. */
const RACK: ModuleSpec[] = [
  {
    key: 'seq',
    name: 'SEQ',
    hp: 12,
    help: 'sequencer',
    trim: SEQ_COLOR,
    knobs: [{ id: 'rate', x: 2.6, f: 1, label: 'RATE' }],
    jacks: [
      { id: 'cv', x: 6, row: 0, out: true, label: 'CV' },
      { id: 'gate', x: 10, row: 0, out: true, label: 'GATE' },
    ],
  },
  {
    key: 'lfo',
    name: 'LFO',
    hp: 6,
    help: 'lfo',
    trim: LFO_COLOR,
    knobs: [
      { id: 'rate', x: 3, f: 0.15, big: true, label: 'RATE' },
      { id: 'level', x: 3, f: 0.85, label: 'LEVEL' },
    ],
    jacks: [{ id: 'out', x: 3, row: 0, out: true, label: 'OUT' }],
  },
  {
    key: 'env',
    name: 'ENV',
    hp: 8,
    help: 'envelope',
    trim: ENV_COLOR,
    knobs: [
      { id: 'a', x: 2, f: 0.1, label: 'A' },
      { id: 'd', x: 6, f: 0.1, label: 'D' },
      { id: 's', x: 2, f: 0.9, label: 'S' },
      { id: 'r', x: 6, f: 0.9, label: 'R' },
    ],
    jacks: [
      // Outputs staggered: the upper one's cable leaves rightward, past
      // (never across) the lower one.
      { id: 'gate', x: 1.8, row: 0, label: 'GATE' },
      { id: 'outF', x: 6.3, row: 1, out: true, label: 'OUT' },
      { id: 'outA', x: 4.8, row: 0, out: true, label: 'OUT' },
    ],
  },
  {
    key: 'vco',
    name: 'VCO',
    hp: 12,
    help: 'vco',
    trim: colors.amber,
    knobs: [{ id: 'tune', x: 6, f: 0.4, big: true, label: 'TUNE' }],
    // Inputs high on the left (their cables leave leftward, toward the
    // control sources); the four waveform outputs low on the right.
    jacks: [
      // PITCH = a second (exponential) pitch-CV input: the LFO's vibrato
      // moves the note in semitones, as the engine does — not linear FM.
      { id: 'voct', x: 1.8, row: 1, label: 'V/OCT' },
      { id: 'fm', x: 5.6, row: 1, label: 'PITCH' },
      { id: 'w0', x: 5.6, row: 0, out: true, glyph: 0 },
      { id: 'w1', x: 7.3, row: 0, out: true, glyph: 1 },
      { id: 'w2', x: 9, row: 0, out: true, glyph: 2 },
      { id: 'w3', x: 10.7, row: 0, out: true, glyph: 3 },
    ],
  },
  {
    key: 'vcf',
    name: 'VCF',
    hp: 8,
    help: 'vcf',
    trim: colors.amber,
    knobs: [
      { id: 'freq', x: 4, f: 0.1, big: true, label: 'FREQ' },
      { id: 'res', x: 2, f: 0.95, label: 'RES' },
      { id: 'cv1', x: 6, f: 0.95, label: 'CV1', bipolar: true },
    ],
    jacks: [
      { id: 'cv1', x: 1.8, row: 1, label: 'CV1' },
      { id: 'cv2', x: 4.4, row: 1, label: 'CV2' },
      { id: 'in', x: 4.2, row: 0, label: 'IN' },
      { id: 'out', x: 6.6, row: 0, out: true, label: 'OUT' },
    ],
  },
  {
    key: 'vca',
    name: 'VCA',
    hp: 8,
    help: 'vca',
    trim: colors.amber,
    // A DUAL VCA, channel 1 normalled into channel 2 (the engine MULTIPLIES:
    // gain = env × tremolo): CV1 = the envelope opening channel 1 from
    // OFFSET 1 = 0; CV2 = the LFO dipping channel 2, whose OFFSET 2 sits fully
    // open. IN feeds channel 1, OUT leaves channel 2.
    knobs: [
      { id: 'ofs1', x: 2, f: 0.5, label: 'OFS 1' },
      { id: 'ofs2', x: 6, f: 0.5, label: 'OFS 2' },
    ],
    jacks: [
      { id: 'cv1', x: 1.8, row: 1, label: 'CV1' },
      { id: 'cv2', x: 4.4, row: 1, label: 'CV2' },
      { id: 'in', x: 4.2, row: 0, label: 'IN' },
      { id: 'out', x: 6.6, row: 0, out: true, label: 'OUT' },
    ],
  },
  {
    key: 'out',
    name: 'OUT',
    hp: 4,
    help: 'out',
    trim: colors.amber,
    knobs: [{ id: 'level', x: 2, f: 0.35, label: 'LVL' }],
    jacks: [{ id: 'in', x: 2, row: 0, label: 'IN' }],
  },
];
const RACK_HP = RACK.reduce((s, m) => s + m.hp, 0); // 58 HP
/** The glass's own shape — full screen opens at it, so 1× is the glass drawing. */
const CASE_ASPECT = 1.5;

/** Knob position 0..1 at the lab's REAL value (log where the parameter is). */
const logPos = (v: number, lo: number, hi: number) => Math.log(Math.max(lo, Math.min(hi, v)) / lo) / Math.log(hi / lo);
function knobPos(mod: string, id: string, p: Patch): number {
  const env = ENV_PRESETS.find((e) => e.key === p.envKey)!;
  switch (`${mod}.${id}`) {
    case 'seq.rate':
      return logPos(p.seqRate, 0.5, 16); // engine range, steps/s
    case 'lfo.rate':
      return logPos(p.lfoRate, 0.05, 30);
    case 'lfo.level':
      return p.lfoDepth;
    case 'env.a':
      return logPos(env.a, 0.001, 5);
    case 'env.d':
      return logPos(env.d, 0.001, 5);
    case 'env.s':
      return env.s;
    case 'env.r':
      return logPos(env.r, 0.001, 5);
    case 'vco.tune':
      return 0.5; // 110 Hz (A2) — the lab's fixed root
    case 'vcf.freq':
      return logPos(p.cutoff, 60, 14000); // engine range
    case 'vcf.res':
      return p.res;
    case 'vcf.cv1':
      return 0.5 + 0.5 * p.envToCut; // attenuverter: centre = none
    case 'vca.ofs1':
      return 0; // channel 1 closed — only the envelope opens it
    case 'vca.ofs2':
      return 1; // channel 2 open — the LFO (tremolo) only ever turns it down
    case 'out.level':
      return (-18 - -60) / (-12 - -60); // −18 dBFS on a −60…−12 dB pot
    default:
      return 0;
  }
}

/** The live patch, drawn as a Eurorack case. Same taps (a module → its
 *  lesson), same state, same honest live readouts as the old flow chart. */
function PatchDiagram({
  w: pw,
  h: ph,
  patch,
  envLevel,
  activeStep,
  running,
  onBox,
}: {
  /** Stage glass inner size (RackUnit's stage.render contract). */
  w: number;
  h: number;
  patch: Patch;
  envLevel: number;
  /** REAL native sequencer position (−1 when idle) — lights the step buttons. */
  activeStep: number;
  running: boolean;
  /** Tap a module → open that section's "what it does" help. */
  onBox: (key: string) => void;
}) {
  // FULL SCREEN (D35 "everything zooms"): authored in GLASS pixels and painted
  // through a viewBox of (pw ÷ ts) × (ph ÷ ts) — the case, knobs, jacks,
  // plugs, cables, LEDs and every legend grow with the step. ts = 1 on the glass.
  const ts = useStageTextScale();
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.aspect(CASE_ASPECT, 0);
  }, [report]);
  const w = pw / ts;
  const h = ph / ts;

  // ── Geometry: one 3U row, scaled to the glass (width first). ──
  const TOP = 19; // group brackets above the case
  const RAIL = 4; // case rail band above / below the panels
  const CHEEK = 5; // case side cheeks
  // Room under the case for the cables to hang: 34 px, given up (to 14) on a
  // short glass before the case — and its 9 pt legends — would shrink.
  const kW = (w - CHEEK * 2 - 6) / (RACK_HP * HP_MM);
  const hang = Math.max(14, Math.min(34, h - TOP - RAIL * 2 - U3_MM * kW));
  const k = Math.max(0.5, Math.min(kW, (h - TOP - RAIL * 2 - hang) / U3_MM));
  const hpPx = HP_MM * k;
  const H = U3_MM * k;
  const caseW = RACK_HP * hpPx + CHEEK * 2;
  const caseX = (w - caseW) / 2;
  const panelX0 = caseX + CHEEK;
  const panelTop = TOP + RAIL;
  const caseBottom = panelTop + H + RAIL;
  const starts: number[] = [];
  RACK.reduce((x, m) => (starts.push(x), x + m.hp), 0);
  const mx = (i: number) => panelX0 + starts[i] * hpPx;
  const idx = (key: string) => RACK.findIndex((m) => m.key === key);

  // Hardware at true size (mm × k), floored so it stays drawable when small.
  const rNut = Math.max(3.2, 3.2 * k);
  const rHole = rNut * 0.52;
  const rPlug = Math.max(4, 4 * k);
  const rKnobBig = Math.max(6, 6.4 * k);
  const rKnob = Math.max(4.6, 4.6 * k);
  const LEG = 9; // legend size — the 9 pt floor (rendered 1:1 on the glass)
  // Jack rows from the panel bottom; a row needs legend + nut + air.
  const rowGap = Math.max(17.5 * k, LEG + rNut * 2 + 5);
  const jackY = (row: number) => panelTop + H - Math.max(11 * k, rNut + 7) - row * rowGap;
  const jackPos = (mod: string, id: string) => {
    const i = idx(mod);
    const j = RACK[i].jacks.find((q) => q.id === id)!;
    return { x: mx(i) + j.x * hpPx, y: jackY(j.row) };
  };
  const zone = (m: ModuleSpec) => {
    const rows = m.jacks.reduce((r, j) => Math.max(r, j.row + 1), 0);
    return { top: panelTop + 22, bot: jackY(rows - 1) - rNut - LEG - 6 };
  };

  // ── Cables: one per ACTIVE routing (nothing decorative). ──
  type Cable = { key: string; a: { x: number; y: number }; b: { x: number; y: number }; color: string };
  const cables: Cable[] = [];
  const add = (key: string, from: [string, string], to: [string, string], color: string) =>
    cables.push({ key, a: jackPos(from[0], from[1]), b: jackPos(to[0], to[1]), color });
  // The audio path — always patched (the engine's fixed VCO → VCF → VCA → out).
  add('a-vco', ['vco', `w${patch.shape}`], ['vcf', 'in'], colors.amber);
  add('a-vcf', ['vcf', 'out'], ['vca', 'in'], colors.amber);
  add('a-vca', ['vca', 'out'], ['out', 'in'], colors.amber);
  // Control (CV) — the envelope always opens the VCA.
  add('env-vca', ['env', 'outA'], ['vca', 'cv1'], ENV_COLOR);
  if (patch.envToCut > 0) add('env-vcf', ['env', 'outF'], ['vcf', 'cv1'], ENV_COLOR);
  if (patch.lfoDepth > 0 && patch.lfoDest === 1) add('lfo-vco', ['lfo', 'out'], ['vco', 'fm'], LFO_COLOR);
  if (patch.lfoDepth > 0 && patch.lfoDest === 2) add('lfo-vcf', ['lfo', 'out'], ['vcf', 'cv2'], LFO_COLOR);
  if (patch.lfoDepth > 0 && patch.lfoDest === 3) add('lfo-vca', ['lfo', 'out'], ['vca', 'cv2'], LFO_COLOR);
  if (patch.seqOn) {
    add('seq-cv', ['seq', 'cv'], ['vco', 'voct'], SEQ_COLOR);
    add('seq-gate', ['seq', 'gate'], ['env', 'gate'], SEQ_COLOR);
  }
  // Sag: a longer cable is a longer cable — it hangs lower. Each gets its own
  // depth (≥ 5 px from every other), clamped inside the glass, so no two
  // cables ever share a run.
  // The case stands on a desktop stand; the desk top is the glass's foot —
  // a cable too long to hang free rests on it (never through it).
  const DESK = 5;
  const floor = h - DESK - 2;
  const hung = cables
    .map((c) => {
      const span = Math.abs(c.b.x - c.a.x);
      const low = Math.max(c.a.y, c.b.y) + 8 + span * 0.3;
      return { ...c, span, low };
    })
    .sort((p, q) => p.low - q.low);
  for (let i = 1; i < hung.length; i++) hung[i].low = Math.max(hung[i].low, hung[i - 1].low + 5);
  const over = hung.length ? hung[hung.length - 1].low - floor : 0;
  if (over > 0) {
    // Squeeze the depths into the glass, keeping their order and spacing.
    const base = Math.max(caseBottom - 4, hung[0].low - over);
    const top = hung[0].low;
    const span = hung[hung.length - 1].low - top || 1;
    hung.forEach((c) => {
      const nl = base + ((c.low - top) / span) * (floor - base);
      c.low = Math.max(Math.max(c.a.y, c.b.y) + 6, nl);
    });
  }
  /** Plug → hanging loop → plug. Both control points sit below the low point
   *  so the curve leaves each plug falling, angled toward its far end. */
  const cablePath = (c: (typeof hung)[number]) => {
    const { a, b } = c;
    const yC = (c.low - 0.25 * Math.min(a.y, b.y)) / 0.75; // cubic low point = c.low
    const lean = (b.x - a.x) * 0.4;
    return `M${a.x} ${a.y} C ${a.x + lean} ${yC}, ${b.x - lean} ${yC}, ${b.x} ${b.y}`;
  };

  const plugAt = new Map<string, string>(); // "x,y" → cable colour
  hung.forEach((c) => {
    plugAt.set(`${c.a.x},${c.a.y}`, c.color);
    plugAt.set(`${c.b.x},${c.b.y}`, c.color);
  });

  /** A knob: skirt, scale ticks, cap and white pointer at pos (0..1 over 270°). */
  const knob = (cx: number, cy: number, r: number, pos: number, bipolar: boolean | undefined, key: string) => {
    const ang = (-135 + 270 * Math.max(0, Math.min(1, pos))) * (Math.PI / 180);
    const ticks = r > 6 ? 11 : 7;
    return (
      <G key={key}>
        {Array.from({ length: ticks }, (_, t) => {
          const ta = (-135 + (270 * t) / (ticks - 1)) * (Math.PI / 180);
          const long = bipolar && t === (ticks - 1) / 2;
          const r1 = r + 1.4;
          const r2 = r + (long ? 4.2 : 2.8);
          return (
            <Line
              key={t}
              x1={cx + r1 * Math.sin(ta)}
              y1={cy - r1 * Math.cos(ta)}
              x2={cx + r2 * Math.sin(ta)}
              y2={cy - r2 * Math.cos(ta)}
              stroke="#c9ccd4"
              strokeOpacity={long ? 0.9 : 0.55}
              strokeWidth={0.8}
            />
          );
        })}
        <Circle cx={cx + 0.6} cy={cy + 1.2} r={r} fill="#000000" opacity={0.5} />
        <Circle cx={cx} cy={cy} r={r} fill="url(#mkSkirt)" stroke="#4a4b55" strokeWidth={0.6} />
        <Circle cx={cx} cy={cy} r={r * 0.74} fill="url(#mkCap)" />
        <Line
          x1={cx + r * 0.18 * Math.sin(ang)}
          y1={cy - r * 0.18 * Math.cos(ang)}
          x2={cx + r * 0.94 * Math.sin(ang)}
          y2={cy - r * 0.94 * Math.cos(ang)}
          stroke="#f4f4f6"
          strokeWidth={Math.max(1.1, r * 0.17)}
          strokeLinecap="round"
        />
      </G>
    );
  };

  /** One cycle of a waveform — the VCO output's panel glyph. */
  const glyph = (shape: number, cx: number, cy: number, key: string) => {
    const gw = 4;
    const gh = 3;
    const d =
      shape === 0
        ? `M${cx - gw} ${cy + gh} L${cx + gw * 0.6} ${cy - gh} L${cx + gw * 0.6} ${cy + gh} L${cx + gw} ${cy + gh * 0.2}`
        : shape === 1
          ? `M${cx - gw} ${cy + gh} L${cx - gw} ${cy - gh} L${cx} ${cy - gh} L${cx} ${cy + gh} L${cx + gw} ${cy + gh} L${cx + gw} ${cy - gh}`
          : shape === 2
            ? `M${cx - gw} ${cy + gh} L${cx - gw / 2} ${cy - gh} L${cx + gw / 2} ${cy + gh} L${cx + gw} ${cy - gh * 0.2}`
            : `M${cx - gw} ${cy} Q ${cx - gw / 2} ${cy - gh * 2} ${cx} ${cy} T ${cx + gw} ${cy}`;
    return <Path key={key} d={d} stroke="#e4e6ec" strokeWidth={1.1} fill="none" strokeLinejoin="round" />;
  };

  const legend = (x: number, y: number, text: string, key: string, fill = '#dfe1e7') => (
    <SvgText key={key} x={x} y={y} fill={fill} fontSize={LEG} fontFamily={fonts.barlowCondensedSemiBold} textAnchor="middle">
      {text}
    </SvgText>
  );

  const ctrlEnd = mx(idx('env')) + RACK[idx('env')].hp * hpPx;
  const audioStart = mx(idx('vco'));
  const audioEnd = mx(RACK.length - 1) + RACK[RACK.length - 1].hp * hpPx;

  return (
    <View>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={pw} height={ph} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="mdBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#16161c" />
            <Stop offset="100%" stopColor="#0a0a0e" />
          </LinearGradient>
          {/* Black-anodised aluminium panel, lit from above. */}
          <LinearGradient id="mkPanel" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2a2b32" />
            <Stop offset="55%" stopColor="#1d1e23" />
            <Stop offset="100%" stopColor="#16171b" />
          </LinearGradient>
          <LinearGradient id="mkRail" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#9a9da6" />
            <Stop offset="50%" stopColor="#5d6069" />
            <Stop offset="100%" stopColor="#3a3c43" />
          </LinearGradient>
          <LinearGradient id="mkCheek" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#3a3b42" />
            <Stop offset="100%" stopColor="#141418" />
          </LinearGradient>
          <RadialGradient id="mkScrew" cx="35%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="#d4d6dd" />
            <Stop offset="100%" stopColor="#5a5c66" />
          </RadialGradient>
          <RadialGradient id="mkNut" cx="38%" cy="32%" r="75%">
            <Stop offset="0%" stopColor="#e9ebf0" />
            <Stop offset="70%" stopColor="#8d9099" />
            <Stop offset="100%" stopColor="#5b5e67" />
          </RadialGradient>
          <RadialGradient id="mkSkirt" cx="40%" cy="35%" r="80%">
            <Stop offset="0%" stopColor="#3a3b43" />
            <Stop offset="100%" stopColor="#0d0d10" />
          </RadialGradient>
          <RadialGradient id="mkCap" cx="38%" cy="30%" r="80%">
            <Stop offset="0%" stopColor="#4a4b54" />
            <Stop offset="100%" stopColor="#141418" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} rx={8} fill="url(#mdBg)" />

        {/* What is what — named ABOVE the case, never on a panel. */}
        <SvgText x={(mx(0) + ctrlEnd) / 2} y={10} fill={colors.textSub} fontSize={9.5} fontFamily={fonts.oswaldSemiBold} letterSpacing={0.8} textAnchor="middle">
          CONTROL SOURCES (CV)
        </SvgText>
        <Path d={`M${mx(0) + 2} ${TOP - 2} L${mx(0) + 2} ${TOP - 5} L${ctrlEnd - 2} ${TOP - 5} L${ctrlEnd - 2} ${TOP - 2}`} stroke={colors.textSub} strokeOpacity={0.7} strokeWidth={1} fill="none" />
        <SvgText x={(audioStart + audioEnd) / 2} y={10} fill={colors.amber} fontSize={9.5} fontFamily={fonts.oswaldSemiBold} letterSpacing={0.8} textAnchor="middle">
          AUDIO PATH → OUT
        </SvgText>
        <Path d={`M${audioStart + 2} ${TOP - 2} L${audioStart + 2} ${TOP - 5} L${audioEnd - 6} ${TOP - 5}`} stroke={colors.amber} strokeOpacity={0.8} strokeWidth={1} fill="none" />
        <Path d={`M${audioEnd - 7} ${TOP - 8} L${audioEnd - 2} ${TOP - 5} L${audioEnd - 7} ${TOP - 2} Z`} fill={colors.amber} fillOpacity={0.85} />

        {/* The desk under the stand (the cables hang free above it). */}
        <Rect x={0} y={h - DESK} width={w} height={DESK} fill="#1a1611" />
        <Line x1={0} y1={h - DESK + 0.4} x2={w} y2={h - DESK + 0.4} stroke="#4a3f31" strokeWidth={0.8} />
        {/* Stand legs under the cheeks: the case is raised, not floating. */}
        {[caseX + 0.5, caseX + caseW - CHEEK + 0.5].map((lx, li) => (
          <Fragment key={`leg${li}`}>
            <Rect x={lx} y={caseBottom - 2} width={CHEEK - 1} height={h - DESK - caseBottom + 2} fill="url(#mkCheek)" />
            <Rect x={lx - 3} y={h - DESK - 2} width={CHEEK + 5} height={2} rx={1} fill="#2a2b31" />
          </Fragment>
        ))}

        {/* The case: side cheeks, top + bottom rails behind the panels. */}
        <Rect x={caseX + 1.5} y={TOP + 2.5} width={caseW} height={caseBottom - TOP} rx={2} fill="#000000" opacity={0.5} />
        <Rect x={caseX} y={TOP} width={caseW} height={caseBottom - TOP} rx={2} fill="#111114" />
        <Rect x={panelX0} y={TOP} width={RACK_HP * hpPx} height={RAIL + 2} fill="url(#mkRail)" />
        <Rect x={panelX0} y={caseBottom - RAIL - 2} width={RACK_HP * hpPx} height={RAIL + 2} fill="url(#mkRail)" />
        <Rect x={caseX} y={TOP} width={CHEEK} height={caseBottom - TOP} rx={1.5} fill="url(#mkCheek)" />
        <Rect x={caseX + caseW - CHEEK} y={TOP} width={CHEEK} height={caseBottom - TOP} rx={1.5} fill="url(#mkCheek)" />

        {/* The modules — tap one for what it does. */}
        {RACK.map((m, i) => {
          const x = mx(i);
          const pw2 = m.hp * hpPx;
          const z = zone(m);
          const screwX = Math.min(7.5 * k, pw2 / 2);
          const screwY = [panelTop + 3 * k, panelTop + H - 3 * k];
          return (
            <G key={m.key} onPress={() => onBox(m.help)}>
              <Rect x={x + 0.35} y={panelTop} width={pw2 - 0.7} height={H} fill="url(#mkPanel)" />
              <Rect x={x + 0.35} y={panelTop} width={pw2 - 0.7} height={H} fill="none" stroke="#ffffff" strokeOpacity={0.08} strokeWidth={0.6} />
              <Line x1={x + 0.35} y1={panelTop} x2={x + 0.35} y2={panelTop + H} stroke="#000000" strokeOpacity={0.7} strokeWidth={0.7} />
              {/* Mounting screws: two on a narrow panel, four from 10 HP. */}
              {(m.hp >= 10 ? [screwX, pw2 - screwX] : [screwX]).flatMap((sx, s) =>
                screwY.map((sy, t) => (
                  <Fragment key={`sc${s}${t}`}>
                    <Circle cx={x + sx} cy={sy} r={Math.max(1.4, 1.5 * k)} fill="url(#mkScrew)" />
                    <Line x1={x + sx - 1} y1={sy + 1} x2={x + sx + 1} y2={sy - 1} stroke="#1a1a1e" strokeWidth={0.6} />
                  </Fragment>
                )),
              )}
              {/* Title + its routing-colour trim. */}
              <SvgText x={x + pw2 / 2} y={panelTop + 14.5} fill={colors.textPrimary} fontSize={10.5} fontFamily={fonts.oswaldSemiBold} letterSpacing={0.5} textAnchor="middle">
                {m.name}
              </SvgText>
              <Line x1={x + pw2 / 2 - Math.min(9, pw2 * 0.3)} y1={panelTop + 17.5} x2={x + pw2 / 2 + Math.min(9, pw2 * 0.3)} y2={panelTop + 17.5} stroke={m.trim} strokeWidth={1.4} strokeOpacity={0.9} />

              {/* Knobs, each at the lab's actual value. */}
              {m.knobs.map((kn) => {
                const r = kn.big ? rKnobBig : rKnob;
                const yTop = z.top + LEG + r + 4;
                const yBot = Math.max(yTop, z.bot - r - 3);
                const cy = kn.id === 'rate' && m.key === 'seq' ? jackY(0) : yTop + kn.f * (yBot - yTop);
                const cx = x + kn.x * hpPx;
                return (
                  <Fragment key={kn.id}>
                    {legend(cx, cy - r - 4.5, kn.label, `kl${kn.id}`)}
                    {knob(cx, cy, r, knobPos(m.key, kn.id, patch), kn.bipolar, `k${kn.id}`)}
                  </Fragment>
                );
              })}

              {/* SEQ: eight step knobs (semitones 0…+12) over their gate
                  buttons — lit = the REAL native step, dark = a rest. */}
              {m.key === 'seq'
                ? patch.steps.map((s, sI) => {
                    const col = sI % 4;
                    const rowI = Math.floor(sI / 4);
                    const cx = x + (1.5 + col * 3) * hpPx;
                    const bandTop = z.top + 2;
                    const bandBot = jackY(0) - rKnob - LEG - 10;
                    const rowH = (bandBot - bandTop) / 2;
                    const cy = bandTop + rowH * rowI + LEG + rKnob + 2;
                    const by = cy + rKnob + 3;
                    const lit = running && patch.seqOn && activeStep === sI;
                    return (
                      <Fragment key={`st${sI}`}>
                        {legend(cx, cy - rKnob - 3, String(sI + 1), `sn${sI}`, '#b9bcc5')}
                        {knob(cx, cy, rKnob * 0.92, s < 0 ? 0 : s / 12, false, `sk${sI}`)}
                        {lit ? <Rect x={cx - 6} y={by - 2} width={12} height={8} rx={3} fill={SEQ_COLOR} opacity={0.35} /> : null}
                        <Rect
                          x={cx - 4}
                          y={by}
                          width={8}
                          height={4}
                          rx={1}
                          fill={lit ? '#ffe3da' : s >= 0 ? SEQ_COLOR : '#26262c'}
                          fillOpacity={lit ? 1 : s >= 0 ? (patch.seqOn ? 0.6 : 0.3) : 1}
                          stroke={s >= 0 ? SEQ_COLOR : '#55565f'}
                          strokeOpacity={0.8}
                          strokeWidth={0.6}
                        />
                      </Fragment>
                    );
                  })
                : null}

              {/* LEDs that read REAL engine state. */}
              {m.key === 'env' ? (
                <Fragment>
                  {running && envLevel > 0.02 ? (
                    <Circle cx={x + pw2 - 6} cy={panelTop + 11} r={4.5} fill={ENV_COLOR} opacity={0.35 * Math.min(1, envLevel)} />
                  ) : null}
                  <Circle cx={x + pw2 - 6} cy={panelTop + 11} r={1.9} fill={running ? ENV_COLOR : '#1d3324'} fillOpacity={running ? 0.25 + 0.75 * Math.max(0, Math.min(1, envLevel)) : 1} />
                </Fragment>
              ) : null}
              {m.key === 'out' ? (
                <Fragment>
                  {running ? <Circle cx={x + pw2 / 2} cy={jackY(0) - rNut - LEG - 10} r={4.2} fill={colors.amber} opacity={0.35} /> : null}
                  <Circle cx={x + pw2 / 2} cy={jackY(0) - rNut - LEG - 10} r={1.9} fill={running ? '#ffe7b0' : '#3a3220'} />
                  {legend(x + pw2 / 2, jackY(0) - rNut - LEG - 15, 'ON', 'onl')}
                </Fragment>
              ) : null}
              {m.key === 'env' ? (
                // MAN(ual) gate: with the sequencer OFF the engine holds the
                // envelope's gate open while the voice runs — the drone. Lit
                // exactly then (on real gear an unplugged GATE never opens).
                <Fragment>
                  {legend(x + 1.8 * hpPx, jackY(1) - rNut - 3, 'MAN', 'manl')}
                  {running && !patch.seqOn ? <Circle cx={x + 1.8 * hpPx} cy={jackY(1)} r={rNut + 2.5} fill={ENV_COLOR} opacity={0.3} /> : null}
                  <Rect x={x + 1.8 * hpPx - rNut} y={jackY(1) - rNut} width={rNut * 2} height={rNut * 2} rx={1.5} fill="#2b2c33" stroke="#6a6c76" strokeWidth={0.7} />
                  <Rect x={x + 1.8 * hpPx - rNut * 0.6} y={jackY(1) - rNut * 0.6} width={rNut * 1.2} height={rNut * 1.2} rx={1} fill={running && !patch.seqOn ? '#c8ffd6' : '#1d3324'} />
                </Fragment>
              ) : null}

              {/* Jacks: legend above; outputs sit in a shaded box. */}
              {m.jacks.map((j) => {
                const cx = x + j.x * hpPx;
                const cy = jackY(j.row);
                const bw = Math.max(rNut * 2 + 4, (j.label?.length ?? 2) * 4.7 + 3);
                return (
                  <Fragment key={j.id}>
                    {j.out && j.glyph == null ? (
                      <Rect x={cx - bw / 2} y={cy - rNut - LEG - 4} width={bw} height={rNut * 2 + LEG + 6} rx={2} fill="#4a4c56" fillOpacity={0.55} />
                    ) : null}
                    {j.glyph === 0 ? (
                      // One shared output box under the four waveform jacks.
                      <Rect x={cx - hpPx * 1.05} y={cy - rNut - LEG - 4} width={hpPx * (10.7 - 5.6 + 2.1)} height={rNut * 2 + LEG + 6} rx={2} fill="#4a4c56" fillOpacity={0.55} />
                    ) : null}
                    {j.glyph != null ? glyph(j.glyph, cx, cy - rNut - 6, `g${j.id}`) : legend(cx, cy - rNut - 3, j.label ?? '', `jl${j.id}`)}
                    <Circle cx={cx} cy={cy} r={rNut} fill="url(#mkNut)" />
                    <Circle cx={cx} cy={cy} r={rHole} fill="#050506" />
                  </Fragment>
                );
              })}
            </G>
          );
        })}

        {/* Patch cables — drawn deepest first, plugs over their jacks. */}
        {[...hung].reverse().map((c) => {
          const d = cablePath(c);
          return (
            <Fragment key={c.key}>
              <Path d={d} stroke="#000000" strokeWidth={4.6} fill="none" opacity={0.45} strokeLinecap="round" transform="translate(1.2 2)" />
              <Path d={d} stroke="#000000" strokeWidth={4} fill="none" opacity={0.7} strokeLinecap="round" />
              <Path d={d} stroke={c.color} strokeWidth={2.9} fill="none" strokeLinecap="round" />
              <Path d={d} stroke="#ffffff" strokeWidth={0.8} fill="none" opacity={0.3} strokeLinecap="round" transform="translate(-0.5 -0.5)" />
            </Fragment>
          );
        })}
        {[...plugAt.entries()].map(([pos, color]) => {
          const [px, py] = pos.split(',').map(Number);
          return (
            <G key={`p${pos}`}>
              <Circle cx={px + 0.8} cy={py + 1.4} r={rPlug} fill="#000000" opacity={0.5} />
              <Circle cx={px} cy={py} r={rPlug} fill={color} stroke="#000000" strokeOpacity={0.55} strokeWidth={0.8} />
              <Circle cx={px} cy={py} r={rPlug * 0.58} fill="#000000" opacity={0.28} />
              <Circle cx={px - rPlug * 0.35} cy={py - rPlug * 0.4} r={rPlug * 0.28} fill="#ffffff" opacity={0.45} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepRow: { flexDirection: 'row', gap: 4 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  whyText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  dimmed: { opacity: 0.55 },
  endRoot: { flex: 1, backgroundColor: colors.screenBg },
  endHeader: { paddingHorizontal: 16, paddingBottom: 4, gap: 4 },
  endBack: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, minHeight: 44, textAlignVertical: 'center', paddingTop: 12 },
  endTitle: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1 },
});
