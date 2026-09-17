/**
 * LiquidStudioScreen — Cymatics Lab › Liquid Cymatics Studio (spec §1.4, §3,
 * Phase 2): a shallow illuminated dish on a loudspeaker-style shaker, on the
 * shared LabShell RACK faceplate.
 *
 *   STAGE  the dish (vizLiquid) — rig side view, lit surface, height map,
 *          contours, refraction (caustics), 3D, cross-section.
 *   BEZEL  DRIVE Hz · RESPONSE Hz (f/2) · λ · a/a_c.
 *   DOCK   FREQ (lane + "drive at twice a dish mode" chooser) · SHAKE ·
 *          LIQUID · DISH · DRIVE · VIEW.
 *   WELL   the behaviour-stage ladder (1–10) with the physics "why", the
 *          onset threshold vs the current acceleration, the damping
 *          breakdown, actions, the rig safety note, the honesty note.
 *
 * SCIENCE PATH: controls → LiquidSpec → readFaraday (dispersion at f/2,
 * damping, threshold) → readLiquid (stage + pattern family) →
 * sampleSurface (basis fields) → vizLiquid. Every number on screen comes
 * from that chain; the badge names the approximation.
 *
 * SOUND: our native generator (useDriveTone) — sine / square / triangle /
 * pulse drive; a second tone via GEN_MODES.dual on engine ≥ 8 (visual-only
 * on the current dev client, stated in the tray).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { heatColor } from '../../../features/tools/levelColor';
import { LinearGradient } from 'expo-linear-gradient';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { EngineGate } from '../../tools/EngineGate';
import { LabChip, LabShell, HeaderPlayButton } from '../LabShell';
import type { DockParam } from '../rack/rackTypes';
import { CONTROL_PAIRS, LIQUIDS, LIQUID_BY_ID, TEMPERATURES, kinematicViscosity, surfaceTension, type LiquidId } from '../../../features/cymatics/liquids';
import {
  DEFAULT_LIQUID,
  FAMILY_LABEL,
  STAGE_LABEL,
  STAGE_NUM,
  containerModes,
  readFaraday,
  readLiquid,
  sampleSurface,
  type BottomShape,
  type ContactLine,
  type ContainerShape,
  type LiquidSpec,
  type Stage,
  type Waveform,
} from '../../../features/cymatics/faraday';
import { formatHz, nearestNote } from '../../../features/cymatics/music';
import { EXPERIMENT_BY_PRESET, LIQUID_PRESET_BY_ID } from '../../../features/cymatics/presets';
import { ExperimentWell } from './ExperimentWell';
import type { RootStackParamList } from '../../../navigation/types';
import { requireVizLiquid, skiaAvailable } from './skiaGate';
import type { LiquidViewMode } from './vizLiquid';
import { useDriveTone } from './useDriveTone';

const F_MIN = 10;
const F_MAX = 200;
const A_MIN = 0.02;
const A_MAX = 1.5;
const GRID_N = 64;
const hzFromPos = (v: number) => F_MIN * Math.pow(F_MAX / F_MIN, Math.max(0, Math.min(1, v)));
const posFromHz = (hz: number) => Math.log(Math.max(F_MIN, Math.min(F_MAX, hz)) / F_MIN) / Math.log(F_MAX / F_MIN);
const gFromPos = (v: number) => A_MIN * Math.pow(A_MAX / A_MIN, Math.max(0, Math.min(1, v)));
const posFromG = (g: number) => Math.log(Math.max(A_MIN, Math.min(A_MAX, g)) / A_MIN) / Math.log(A_MAX / A_MIN);

const SHAPES: { id: ContainerShape; label: string }[] = [
  { id: 'circle', label: 'Circle' },
  { id: 'square', label: 'Square' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'ring', label: 'Ring' },
];
const SIZES = [60, 100, 150, 200, 300];
const DEPTHS = [2, 4, 8, 15];
const WALLS = [10, 20, 40];
const BOTTOMS: { id: BottomShape; label: string }[] = [
  { id: 'flat', label: 'Flat bottom' },
  { id: 'bowl', label: 'Shallow bowl' },
];
const CONTACTS: { id: ContactLine; label: string }[] = [
  { id: 'pinned', label: 'Pinned rim (wets)' },
  { id: 'free', label: 'Free rim' },
];
const WAVES: { id: Waveform; label: string }[] = [
  { id: 'sine', label: 'Sine' },
  { id: 'square', label: 'Square' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'pulse', label: 'Pulse' },
];
const DUALS: { id: string; label: string; ratio: number | null }[] = [
  { id: 'off', label: 'Single frequency', ratio: null },
  { id: 'oct', label: '+ 2:1', ratio: 2 },
  { id: 'fifth', label: '+ 3:2', ratio: 1.5 },
  { id: 'fourth', label: '+ 4:3', ratio: 4 / 3 },
];
const VIEWS: { id: LiquidViewMode; label: string; short: string; blurb: string }[] = [
  { id: 'rig', label: 'The rig', short: 'Rig', blurb: 'Side view of the apparatus: lamp, dish, liquid layer, coupling platform, shaker. The platform bobs at the drive frequency; the surface answers at half of it.' },
  { id: 'surface', label: 'Liquid surface', short: 'Surf', blurb: 'The lit, glossy surface as a camera above the dish would see it.' },
  { id: 'height', label: 'Height map', short: 'Height', blurb: 'Surface displacement in the Academy ramp: dark = still, red = the highest crests and deepest troughs.' },
  { id: 'contours', label: 'Contours', short: 'Cont', blurb: 'Iso-height lines over the dimmed height map: amber = crests, blue = troughs.' },
  { id: 'refraction', label: 'Refraction', short: 'Refr', blurb: 'The classic cymatics photograph: light through the liquid focuses into a bright web where the surface is concave.' },
  { id: 'liquid3d', label: '3D surface', short: '3D', blurb: 'Exaggerated surface height, strobed to a few hertz so you can see it (the real surface moves at the response frequency).' },
  { id: 'section', label: 'Cross-section', short: 'Slice', blurb: 'A slice through the surface. Drag on the dish to move the slice.' },
];

const LIQUID_SHORT: Record<string, string> = { water: 'Water', saltwater: 'Salt', glycerin50: 'Glyc', silicone10: 'Sil10', lightoil: 'LtOil', thickoil: 'Thick', gel: 'Gel', cornstarch: 'Strch' };
const HEAT_KEY = Array.from({ length: 9 }, (_, i) => heatColor(i / 8)) as [string, string, ...string[]];
const STAGE_TINT: Record<Stage, string> = {
  flat: colors.textSub,
  damped: colors.textSub,
  sloshing: '#7fbfff',
  ripples: '#7fbfff',
  onset: '#ffc64d',
  stable: '#37e05f',
  transition: '#ffc64d',
  mixed: '#ffc64d',
  unstable: '#ff9f43',
  chaotic: '#ff6b5e',
  splash: '#ff6b5e',
};

export function LiquidStudioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsLiquidStudio'>>();
  const preset = route.params?.preset ? LIQUID_PRESET_BY_ID[route.params.preset] : undefined;
  const experiment = preset ? EXPERIMENT_BY_PRESET[preset.id] : undefined;

  const [spec, setSpec] = useState<LiquidSpec>(() => ({ ...DEFAULT_LIQUID, ...(preset?.spec ?? {}) }));
  const [freq, setFreq] = useState(preset?.hz ?? 40);
  const [accel, setAccel] = useState(() => (typeof preset?.accelG === 'number' ? preset.accelG : 0.25));
  const [view, setView] = useState<LiquidViewMode>(preset?.view ?? 'surface');
  const [dualId, setDualId] = useState('off');
  const [slowMo, setSlowMo] = useState(false);
  const [silentDrive, setSilentDrive] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sectionY, setSectionY] = useState(0.5);
  const [lessonKey, setLessonKey] = useState<string | undefined>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  const liquid = LIQUID_BY_ID[spec.liquid];
  const ratio = DUALS.find((d) => d.id === dualId)?.ratio ?? null;
  const specLive = useMemo<LiquidSpec>(() => ({ ...spec, dualRatio: ratio }), [spec, ratio]);

  // ── science chain ────────────────────────────────────────────────────────
  const fr = useMemo(() => readFaraday(specLive, freq, accel), [specLive, freq, accel]);
  const st = useMemo(() => readLiquid(specLive, freq, accel), [specLive, freq, accel]);
  const modes = useMemo(() => containerModes(specLive), [specLive]);
  const kUsed = st.mode && !st.subharmonic ? st.mode.k : fr.k;
  const gridA = useMemo(() => sampleSurface(specLive, st.family, kUsed, st.mode, GRID_N, false, 1), [specLive, st.family, st.mode, kUsed]);
  const gridB = useMemo(() => {
    if (st.stage === 'transition' || st.stage === 'mixed') return sampleSurface(specLive, st.family2, kUsed, st.mode, GRID_N, false, 2);
    if (st.stage === 'chaotic' || st.stage === 'splash') return sampleSurface(specLive, 'chaotic', kUsed, null, GRID_N, true, 2);
    return sampleSurface(specLive, st.family, kUsed, st.mode, GRID_N, true, 1);
  }, [specLive, st.stage, st.family, st.family2, st.mode, kUsed]);

  // Preset "drive at twice dish mode k" resolves once the modes exist, then
  // "land just above onset" once the threshold at that frequency is known.
  const landedF = useRef(false);
  useEffect(() => {
    if (landedF.current || preset?.driveMode == null) return;
    const m = modes[Math.min(preset.driveMode, modes.length - 1)];
    if (!m) return;
    landedF.current = true;
    setFreq(Math.round(2 * m.hz * 10) / 10);
  }, [preset, modes]);
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || preset?.accelG !== 'onset') return;
    if (preset.driveMode != null && !landedF.current) return;
    landed.current = true;
    setAccel(Math.min(A_MAX, Math.max(A_MIN, fr.thresholdG * 1.3)));
  }, [preset, fr.thresholdG]);

  // ── sound ────────────────────────────────────────────────────────────────
  const freqB = ratio ? freq * ratio : null;
  const tone = useDriveTone(freq, freqB, posFromG(accel), spec.waveform);
  const driving = tone.running || silentDrive;

  // Sweep: log 15 → 150 Hz over 40 s, loops.
  useEffect(() => {
    if (!sweeping) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const u = ((Date.now() - t0) % 40000) / 40000;
      setFreq(Math.round(15 * Math.pow(10, u) * 10) / 10);
    }, 125);
    return () => clearInterval(id);
  }, [sweeping]);

  const patch = (o: Partial<LiquidSpec>) => setSpec((s) => ({ ...s, ...o }));
  const note = nearestNote(freq);
  const viz = skiaAvailable ? requireVizLiquid() : null;
  const nu = kinematicViscosity(liquid, spec.tempC);
  const sigma = surfaceTension(liquid, spec.tempC);
  const tint = STAGE_TINT[st.stage];
  const ratioLabel = fr.thresholdG > 2.5 ? '—' : `${st.ratio.toFixed(2)}×`;

  const modeOptions = modes.slice(0, 10).map((m) => ({
    id: m.id,
    label: `${formatHz(2 * m.hz)} · ${m.label}`,
    blurb: `Dish mode ${m.label} lives at ${m.hz.toFixed(1)} Hz. Driving at TWICE that (${formatHz(2 * m.hz)}) lets the half-frequency (subharmonic) response land on it.`,
  }));

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: posFromHz(freq),
      onChange: (v) => {
        setSweeping(false);
        setFreq(Math.round(hzFromPos(v) * 10) / 10);
      },
      format: () => (st.subharmonic ? `${formatHz(freq)} drive → ${formatHz(freq / 2)} response (f/2)` : `${formatHz(freq)} drive · no half-frequency response yet`),
      formatShort: () => (freq >= 100 ? `${Math.round(freq)}Hz` : `${freq.toFixed(1)}Hz`),
      helpKey: 'frequency',
      chooser: {
        title: 'DRIVE AT TWICE A DISH MODE',
        options: modeOptions,
        selectedId: st.mode && st.subharmonic && st.stage !== 'flat' ? st.mode.id : null,
        onSelect: (id) => {
          const m = modes.find((x) => x.id === id);
          if (m) {
            setSweeping(false);
            setFreq(Math.round(2 * m.hz * 10) / 10);
          }
        },
      },
    },
    {
      kind: 'fader',
      id: 'shake',
      label: 'SHAKE',
      value: posFromG(accel),
      onChange: (v) => setAccel(Math.round(gFromPos(v) * 1000) / 1000),
      format: () => `${accel.toFixed(2)} g · platform travel ${fr.displacementUm < 1000 ? `${fr.displacementUm.toFixed(0)} µm` : `${(fr.displacementUm / 1000).toFixed(2)} mm`}`,
      formatShort: () => `${accel.toFixed(2)}g`,
      level: true,
      helpKey: 'acceleration',
    },
    {
      kind: 'group',
      id: 'liquid',
      label: 'LIQUID',
      valueLabel: LIQUID_SHORT[spec.liquid] ?? liquid.label.split(' ')[0].slice(0, 8),
      helpKey: 'liquid',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>LIQUID</Text>
          <View style={styles.chips}>
            {LIQUIDS.map((l) => (
              <LabChip key={l.id} label={l.label} selected={spec.liquid === l.id} onPress={() => patch({ liquid: l.id as LiquidId })} onLongPress={() => openLesson('liquid')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>{liquid.blurb}</Text>
          <Text style={styles.trayHead}>TEMPERATURE (advanced)</Text>
          <View style={styles.chips}>
            {TEMPERATURES.map((t) => (
              <LabChip key={t} label={`${t} °C`} selected={spec.tempC === t} onPress={() => patch({ tempC: t })} onLongPress={() => openLesson('viscosity')} />
            ))}
          </View>
          <Text style={styles.trayHead}>PLAIN WORDS ↔ THE PROPERTY</Text>
          {CONTROL_PAIRS.map((c) => (
            <View key={c.student} style={styles.pairRow}>
              <Text style={styles.pairStudent}>{c.student}</Text>
              <Text style={styles.pairScience}>{c.science}</Text>
            </View>
          ))}
          <Text style={styles.trayMono}>
            ν = {(nu * 1e6).toFixed(nu * 1e6 < 10 ? 2 : 0)} cSt · σ = {(sigma * 1000).toFixed(1)} mN/m · ρ = {liquid.rho} kg/m³ · consistency: {liquid.consistency}
          </Text>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'dish',
      label: 'DISH',
      valueLabel: `${spec.shape === 'circle' || spec.shape === 'ring' ? 'Ø' : '□'}${spec.sizeMm}`,
      helpKey: 'dish',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>CONTAINER</Text>
          <View style={styles.chips}>
            {SHAPES.map((s) => (
              <LabChip key={s.id} label={s.label} selected={spec.shape === s.id} onPress={() => patch({ shape: s.id })} onLongPress={() => openLesson('dish')} />
            ))}
          </View>
          <Text style={styles.trayHead}>{spec.shape === 'square' ? 'SIDE (mm)' : spec.shape === 'rect' ? 'LONG SIDE (mm)' : 'DIAMETER (mm)'}</Text>
          <View style={styles.chips}>
            {SIZES.map((s) => (
              <LabChip key={s} label={`${s}`} selected={spec.sizeMm === s} onPress={() => patch({ sizeMm: s })} onLongPress={() => openLesson('dish')} />
            ))}
          </View>
          {spec.shape === 'rect' ? (
            <>
              <Text style={styles.trayHead}>ASPECT (short / long)</Text>
              <View style={styles.chips}>
                {[0.5, 0.6, 0.7, 0.8].map((a) => (
                  <LabChip key={a} label={`${a}`} selected={Math.abs(spec.aspect - a) < 1e-6} onPress={() => patch({ aspect: a })} />
                ))}
              </View>
            </>
          ) : null}
          <Text style={styles.trayHead}>LIQUID DEPTH (mm)</Text>
          <View style={styles.chips}>
            {DEPTHS.map((d) => (
              <LabChip key={d} label={`${d}`} selected={spec.depthMm === d} onPress={() => patch({ depthMm: d })} onLongPress={() => openLesson('depth')} />
            ))}
          </View>
          <Text style={styles.trayHead}>WALL ABOVE THE LIQUID (mm)</Text>
          <View style={styles.chips}>
            {WALLS.map((w) => (
              <LabChip key={w} label={`${w}`} selected={spec.wallMm === w} onPress={() => patch({ wallMm: w })} onLongPress={() => openLesson('stages')} />
            ))}
          </View>
          <Text style={styles.trayHead}>BOTTOM</Text>
          <View style={styles.chips}>
            {BOTTOMS.map((b) => (
              <LabChip key={b.id} label={b.label} selected={spec.bottom === b.id} onPress={() => patch({ bottom: b.id })} onLongPress={() => openLesson('dish')} />
            ))}
          </View>
          <Text style={styles.trayHead}>CONTACT LINE AT THE RIM</Text>
          <View style={styles.chips}>
            {CONTACTS.map((c) => (
              <LabChip key={c.id} label={c.label} selected={spec.contact === c.id} onPress={() => patch({ contact: c.id })} onLongPress={() => openLesson('contact_line')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>A rim the liquid wets pins the edge and damps the wave — the threshold rises. Container size matters most when the wavelength is comparable to the dish.</Text>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'drive',
      label: 'DRIVE',
      valueLabel: `${WAVES.find((w) => w.id === spec.waveform)!.label.slice(0, 4)}${dualId !== 'off' ? '+' : ''}`,
      helpKey: 'waveform',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>EXCITATION WAVEFORM</Text>
          <View style={styles.chips}>
            {WAVES.map((w) => (
              <LabChip key={w.id} label={w.label} selected={spec.waveform === w.id} onPress={() => patch({ waveform: w.id })} onLongPress={() => openLesson('waveform')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>
            {spec.waveform === 'sine'
              ? 'A sine isolates one drive frequency — the cleanest demonstration.'
              : spec.waveform === 'pulse'
                ? 'Tone bursts (four per second) at the drive frequency — the surface builds and relaxes each burst.'
                : `A ${spec.waveform} adds odd harmonics of the drive (${tone.additiveReady ? 'played by the additive engine' : 'shown only on this build'}). Faraday onset still keys on the fundamental.`}
          </Text>
          <Text style={styles.trayHead}>RUN</Text>
          <View style={styles.chips}>
            <LabChip label={sweeping ? '■ Stop sweep' : '▶ Sweep 15 → 150 Hz'} selected={sweeping} onPress={() => setSweeping((s) => !s)} />
            <LabChip label={slowMo ? 'Slow motion ON' : 'Slow motion'} selected={slowMo} onPress={() => setSlowMo((s) => !s)} />
            <LabChip label={silentDrive ? 'Silent drive ON' : 'Silent drive'} selected={silentDrive} onPress={() => setSilentDrive((s) => !s)} onLongPress={() => openLesson('silent')} />
          </View>
          <Text style={styles.trayBlurb}>The sweep loops every 40 s. SILENT shakes the dish without the tone.</Text>
          <Text style={styles.trayHead}>SECOND FREQUENCY</Text>
          <View style={styles.chips}>
            {DUALS.map((d) => (
              <LabChip key={d.id} label={d.label} selected={dualId === d.id} onPress={() => setDualId(d.id)} onLongPress={() => openLesson('dual_liquid')} />
            ))}
          </View>
          {dualId !== 'off' ? (
            <>
              <Text style={styles.trayHead}>RELATIVE PHASE</Text>
              <View style={styles.chips}>
                {[0, 90, 180].map((d) => (
                  <LabChip key={d} label={`${d}°`} selected={spec.dualPhaseDeg === d} onPress={() => patch({ dualPhaseDeg: d })} />
                ))}
              </View>
            </>
          ) : null}
          <Text style={styles.trayBlurb}>
            {dualId === 'off'
              ? 'One drive frequency. Two-frequency forcing is how the quasiperiodic “superlattice” patterns are made.'
              : tone.dualReady
                ? `Two tones summed in one channel (${formatHz(freq)} + ${formatHz(freqB!)}) — heard AND shown. The surface prefers a quasiperiodic lattice.`
                : 'The second tone is SHOWN only — this build’s sound engine plays one tone at a time.'}
          </Text>
        </View>
      ),
    },
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: VIEWS.find((v) => v.id === view)!.short,
      options: VIEWS.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      selectedId: view,
      onSelect: (id) => setView(id as LiquidViewMode),
      sticky: true,
      helpKey: 'liquid_display',
    },
  ];

  const bezel = [
    { k: 'DRIVE', v: formatHz(freq), helpKey: 'frequency' },
    { k: 'RESP', v: st.subharmonic ? `${formatHz(fr.responseHz)} f/2` : `${formatHz(freq)} f`, helpKey: 'faraday' },
    { k: 'SHAKE', v: `${accel.toFixed(2)} g`, helpKey: 'acceleration' },
    { k: 'a/a꜀', v: ratioLabel, tint, helpKey: 'threshold', flex: 1.1 },
  ];

  const togglePlay = () => (tone.running ? tone.stop() : void tone.start());
  const stageNum = STAGE_NUM[st.stage];
  const dampTotal = fr.damping.total || 1;

  return (
    <>
      <LabShell
        labId="cymatics"
        title="LIQUID CYMATICS STUDIO"
        subtitle="Cymatics Lab: Sound Made Visible"
        intro="A shallow dish on a shaker. Below a threshold the liquid just rides the platform; above it the surface breaks into standing Faraday waves that oscillate at HALF the drive frequency. Which pattern appears depends on the liquid, the depth, the dish and how hard it is shaken — not on the frequency alone."
        exploreCaption="Raise SHAKE past the threshold and watch the stage ladder climb. Swap the liquid, the depth or the dish and the same drive stops working — or works differently."
        headerAction={<HeaderPlayButton playing={tone.running} onPress={togglePlay} disabled={!tone.engineReady} label={tone.running ? 'Stop the drive tone' : 'Play the drive tone'} />}
        rack={{
          initialParam: 'shake',
          onHelp: openLesson,
          stage: {
            size: 'L',
            badge:
              st.stage === 'flat' || st.stage === 'sloshing' || st.stage === 'ripples' || st.stage === 'damped'
                ? 'SIMULATION · CALCULATED dish modes · APPROXIMATED threshold'
                : `SIMULATION · APPROXIMATED — Faraday pattern map (${FAMILY_LABEL[st.family].toLowerCase()})`,
            onGuide: () => openLesson('liquid_display'),
            bezel,
            hideDragTag: true, // SHAKE (the bound lane) is printed on the bezel
            render: (w, h) =>
              viz ? (
                <viz.LiquidView
                  width={w}
                  height={h}
                  spec={specLive}
                  state={st}
                  gridA={gridA}
                  gridB={gridB}
                  N={GRID_N}
                  view={view}
                  running={driving}
                  slowMo={slowMo}
                  driveHz={freq}
                  accelG={accel}
                  displacementUm={fr.displacementUm}
                  tint={liquid.tint}
                  gloss={liquid.gloss}
                  sectionY={sectionY}
                  dragTarget={view === 'section' ? 'section' : null}
                  onSection={setSectionY}
                />
              ) : (
                <View style={[styles.noSkia, { width: w, height: h }]}>
                  <Text style={styles.noSkiaText}>The dish display needs the current app build (Skia). Controls and readouts still work.</Text>
                </View>
              ),
          },
          params,
          // The experiment the learner arrived to run — pinned above the notes.
          wellTop: experiment ? <ExperimentWell experiment={experiment} /> : undefined,
        }}
      >
        {!tone.engineReady ? <EngineGate state={tone.gate} /> : null}
        {tone.error ? <Text style={styles.err}>{tone.error}</Text> : null}
        {view === 'height' || view === 'contours' || view === 'liquid3d' || view === 'section' ? (
          <View style={styles.keyRow} accessible accessibilityLabel="Colour key: black is still, red is the largest motion">
            <Text style={styles.keyText}>STILL</Text>
            <LinearGradient colors={HEAT_KEY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.keyBar} />
            <Text style={styles.keyText}>LARGEST MOTION</Text>
          </View>
        ) : null}

        {/* Stage ladder */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={[styles.stageLabel, { color: tint }]}>{STAGE_LABEL[st.stage]}</Text>
            <Text style={styles.stageNum}>{stageNum > 0 ? `STAGE ${stageNum} / 10` : '—'}</Text>
          </View>
          <View style={styles.ladder}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <View key={n} style={[styles.rung, n <= stageNum && { backgroundColor: n === stageNum ? tint : '#2c2e38' }, n === stageNum && styles.rungOn]} />
            ))}
          </View>
          <Text style={styles.caption}>{st.why}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.readK}>
              THRESHOLD ≈ {fr.thresholdG > 2.5 ? `${fr.thresholdG.toFixed(0)} g (out of range)` : `${fr.thresholdG.toFixed(2)} g`} · NOW {accel.toFixed(2)} g
            </Text>
            <View style={styles.nudgeRow}>
              <Pressable onPress={() => setAccel((a) => Math.max(A_MIN, Math.round(a * 0.95 * 1000) / 1000))} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Shake a little less">
                <Text style={styles.nudgeText}>‹ −5%</Text>
              </Pressable>
              <Pressable onPress={() => setAccel((a) => Math.min(A_MAX, Math.round(a * 1.05 * 1000) / 1000))} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Shake a little more">
                <Text style={styles.nudgeText}>+5% ›</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.readK}>
            damping: bulk {Math.round((fr.damping.bulk / dampTotal) * 100)} % · bottom {Math.round((fr.damping.bottom / dampTotal) * 100)} % · rim {Math.round((fr.damping.contact / dampTotal) * 100)} % · pattern: {FAMILY_LABEL[st.family]}
            {st.family2 !== 'none' && st.family2 !== st.family ? ` → ${FAMILY_LABEL[st.family2]}` : ''}
          </Text>
        </View>

        <Text style={styles.caption}>The dish moves only while it is driven — press ▶ to play the tone, or DRIVE › SILENT to shake it without sound. DRIVE › SWEEP walks 15 → 150 Hz. Displays are strobed to a few hertz; the real surface moves at the response frequency.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>WHAT THIS RIG IS</Text>
          <Text style={styles.body}>
            {liquid.label}, {spec.depthMm} mm deep, in a {spec.shape === 'circle' ? `Ø ${spec.sizeMm} mm` : spec.shape === 'ring' ? `Ø ${spec.sizeMm} mm ring` : spec.shape === 'rect' ? `${spec.sizeMm} × ${Math.round(spec.sizeMm * spec.aspect)} mm` : `${spec.sizeMm} mm square`} dish with a {spec.contact === 'pinned' ? 'pinned' : 'free'} rim and a {spec.bottom} bottom, on a platform shaken vertically at {formatHz(freq)} and {accel.toFixed(2)} g. Dish / wavelength ≈ {fr.sizeOverLambda.toFixed(1)} — {fr.sizeOverLambda < 2.5 ? 'the dish’s own modes shape the pattern' : 'bulk Faraday lattice regime'}. Above threshold the surface answers at half the drive frequency (the subharmonic).
          </Text>
          <Text style={styles.body}>
            Surface wavelength λ = {fr.lambdaMm.toFixed(fr.lambdaMm < 10 ? 1 : 0)} mm. Lowest dish modes: {modes.slice(0, 4).map((m) => `${m.hz.toFixed(1)} Hz`).join(' · ')}. Drive at twice a mode frequency to land the half-frequency response on it.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: 'rgba(255,107,94,.45)' }]}>
          <Text style={[styles.cardTitle, { color: '#ff6b5e' }]}>RIG SAFETY</Text>
          <Text style={styles.body}>
            This virtual rig is a sealed dish on a coupling platform over a shaker. Never pour liquid into a loudspeaker — it ruins the driver and can short the amplifier. The physics here is the same whether the dish sits on a speaker cabinet, a mechanical shaker or a subwoofer with a plate on top.
          </Text>
        </View>

        <View style={styles.chips}>
          <LabChip label="Guided experiments ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'experiments' })} />
          <LabChip label="Chladni plate studio ›" selected={false} onPress={() => navigation.navigate('CymaticsPlateStudio', {})} />
          <LabChip label="Evidence vs myth ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'myth' })} />
        </View>
        <Text style={styles.honest}>SIMULATION — no fluid-dynamics solver runs on the phone.</Text>
        <Text style={styles.honest}>· Calculated: the dispersion relation and the dish’s own modes.</Text>
        <Text style={styles.honest}>· Approximated: the onset threshold (low-viscosity Faraday estimate with bottom and rim damping) and which lattice forms above it (the published phase maps, blended by hand for the transition stages).</Text>
        <Text style={styles.honest}>· A real dish also depends on cleanliness, the meniscus and the shaker’s true motion.</Text>
      </LabShell>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingBottom: 4 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub, marginTop: 6 },
  trayBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  trayMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, marginTop: 4 },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 2 },
  pairStudent: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textPrimary },
  pairScience: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 8 },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stageLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, flexShrink: 1 },
  stageNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  ladder: { flexDirection: 'row', gap: 4 },
  rung: { flex: 1, height: 8, borderRadius: 3, backgroundColor: '#1b1c22' },
  rungOn: { height: 12, marginTop: -2 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyBar: { flex: 1, height: 8, borderRadius: 4 },
  keyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  readK: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, flexShrink: 1 },
  nudgeRow: { flexDirection: 'row', gap: 8 },
  nudge: { borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 10, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  nudgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 4 },
  err: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ff6b5e' },
  noSkia: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noSkiaText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, textAlign: 'center' },
});
