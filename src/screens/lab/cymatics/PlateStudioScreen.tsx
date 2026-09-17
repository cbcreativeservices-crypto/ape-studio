/**
 * PlateStudioScreen — Cymatics Lab › Chladni Plate Studio (spec §1, §3): the
 * central experience, on the shared LabShell RACK faceplate.
 *
 *   STAGE  the illustrated plate (vizPlate) — sand / heat / phase / node /
 *          3D / cross-section views, driver puck + clamp, drag-to-place.
 *   BEZEL  Hz · nearest note + cents · dominant mode · RESONANCE state.
 *   DOCK   FREQ (lane + jump-to-mode chooser) · LEVEL · PLATE · DRIVE ·
 *          VIEW · SAND.
 *   WELL   description, resonance strength meter, fine ± nudge, actions
 *          (sweep · reset sand · slow motion · silent drive), the honesty
 *          note, experiments / theory links, the guided-lesson entry.
 *
 * SCIENCE PATH: controls → PlateSpec → plateModes() (analytic modes + the
 * exact scaling law) → readResonance() → sampleField() (signed ±1 grid) →
 * vizPlate. Every number on screen is derived from that one chain; the badge
 * says APPROXIMATED because the rectangular free plate has no closed form
 * and the disc shapes omit the small I_n term (plateModes.ts header).
 *
 * SOUND: our native generator (useDriveTone) — sine at the drive frequency;
 * the second tone (MULTI) uses GEN_MODES.dual on engine ≥ 8 and is visual-
 * only on the current dev client, stated in the tray.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor } from '../../../features/tools/levelColor';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { EngineGate } from '../../tools/EngineGate';
import { LabChip, LabShell, HeaderPlayButton } from '../LabShell';
import type { DockParam } from '../rack/rackTypes';
import { MATERIALS, type MaterialId } from '../../../features/cymatics/materials';
import { DEFAULT_PLATE, effectiveQ, plateAspect, plateModes, readResonance, sampleField, type EdgeCondition, type PlateShape, type PlateSpec } from '../../../features/cymatics/plateModes';
import { LIBRARY_SHAPES, isLibraryShape, loadLibraryShape } from '../../../features/cymatics/modalLibrary';
import { formatHz, formatWavelength, nearestNote, wavelengthAir } from '../../../features/cymatics/music';
import { PRESET_BY_ID, type FreqStrategy } from '../../../features/cymatics/presets';
import type { RootStackParamList } from '../../../navigation/types';
import { requireVizPlate, skiaAvailable } from './skiaGate';
import type { PlateViewMode } from './vizPlate';
import { useDriveTone } from './useDriveTone';

const F_MIN = 30;
const F_MAX = 3000;
const GRID_N = 56;
const hzFromPos = (v: number) => F_MIN * Math.pow(F_MAX / F_MIN, Math.max(0, Math.min(1, v)));
const posFromHz = (hz: number) => Math.log(Math.max(F_MIN, Math.min(F_MAX, hz)) / F_MIN) / Math.log(F_MAX / F_MIN);

// Analytic shapes first, then the eight solved MODAL-LIBRARY shapes (spec
// 1.3; Computer B 2026-09-16) - no longer planned rows.
const SHAPES: { id: PlateShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rect', label: 'Rectangle' },
  { id: 'circle', label: 'Circle' },
  ...LIBRARY_SHAPES.map((s) => ({ id: s.id as PlateShape, label: s.label })),
];
const SIZES = [100, 160, 240, 320, 400];
const THICKS = [0.5, 1, 2, 3, 4];
const EDGES: { id: EdgeCondition; label: string }[] = [
  { id: 'free', label: 'Free edges' },
  { id: 'supported', label: 'Supported' },
  { id: 'clamped', label: 'Clamped' },
];
const GRAINS = [0, 30, 60, 90];
const DAMPS: { id: number; label: string }[] = [
  { id: 0.05, label: 'Low' },
  { id: 0.4, label: 'Medium' },
  { id: 0.85, label: 'High' },
];
const EXCITERS: { id: string; label: string; p: { x: number; y: number } }[] = [
  { id: 'centre', label: 'Centre', p: { x: 0.5, y: 0.5 } },
  { id: 'edge', label: 'Edge', p: { x: 0.9, y: 0.5 } },
  { id: 'corner', label: 'Corner', p: { x: 0.85, y: 0.85 } },
];
const MULTI: { id: string; label: string; ratio: number | null }[] = [
  { id: 'off', label: 'Single tone', ratio: null },
  { id: 'oct', label: '+ octave 2:1', ratio: 2 },
  { id: 'fifth', label: '+ fifth 3:2', ratio: 1.5 },
  { id: 'fourth', label: '+ fourth 4:3', ratio: 4 / 3 },
];
const SAND_AMOUNTS = [1500, 3000, 5000];
const VIEWS: { id: PlateViewMode; label: string; blurb: string }[] = [
  { id: 'particles', label: 'Particles', blurb: 'Sand on the plate — it walks off the moving regions and settles on the still lines.' },
  { id: 'heat', label: 'Heat map', blurb: 'Displacement amplitude in the Academy ramp: dark blue = still, red = maximum motion.' },
  { id: 'overlay', label: 'Particles + heat', blurb: 'Both at once: the prediction (heat) under the confirmation (sand).' },
  { id: 'phase', label: 'Phase', blurb: 'Amber regions rise while blue regions fall — opposite sides of a nodal line move in opposite directions.' },
  { id: 'nodes', label: 'Node lines', blurb: 'Only the finished nodal pattern — the Chladni figure itself.' },
  { id: 'plate3d', label: '3D plate', blurb: 'Exaggerated vertical motion, strobed to a few hertz so you can see it (the real plate moves at the drive frequency).' },
  { id: 'section', label: 'Cross-section', blurb: 'A slice through the plate. Drag on the plate to move the slice.' },
];

const RES_LABEL = {
  below: 'BELOW FIRST RESONANCE',
  approaching: 'APPROACHING RESONANCE',
  at: 'AT RESONANCE',
  between: 'BETWEEN RESONANCES',
} as const;
const RES_TINT = { below: colors.textSub, approaching: '#ffc64d', at: '#37e05f', between: '#7fbfff' } as const;

export function PlateStudioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsPlateStudio'>>();
  const preset = route.params?.preset ? PRESET_BY_ID[route.params.preset] : undefined;

  const [spec, setSpec] = useState<PlateSpec>(() => ({ ...DEFAULT_PLATE, ...(preset?.spec ?? {}) }));
  const [freq, setFreq] = useState(preset?.freq.kind === 'hz' ? preset.freq.hz : 240);
  const [amplitude, setAmplitude] = useState(0.7);
  const [view, setView] = useState<PlateViewMode>(preset?.view ?? 'particles');
  const [multi, setMulti] = useState('off');
  const [sandCount, setSandCount] = useState(3000);
  const [sandSize, setSandSize] = useState(0.45);
  const [friction, setFriction] = useState(0.4);
  const [slowMo, setSlowMo] = useState(false);
  const [silentDrive, setSilentDrive] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [sectionY, setSectionY] = useState(0.5);
  const [dragTarget, setDragTarget] = useState<'exciter' | 'support' | 'section' | null>(null);
  const [lessonKey, setLessonKey] = useState<string | undefined>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  // ── science chain ────────────────────────────────────────────────────────
  const modes = useMemo(() => plateModes(spec, 16), [spec]);
  const Q = useMemo(() => effectiveQ(spec.material, spec.damping), [spec.material, spec.damping]);
  const ratio = MULTI.find((m) => m.id === multi)?.ratio ?? null;
  const freqB = ratio ? freq * ratio : null;
  const res = useMemo(() => readResonance(freq, modes, Q), [freq, modes, Q]);
  const resB = useMemo(() => (freqB ? readResonance(freqB, modes, Q) : null), [freqB, modes, Q]);
  const grid = useMemo(() => {
    const g = sampleField(spec, modes, freq, Q, GRID_N);
    if (!freqB) return g;
    // Multi-frequency: linear plate → superpose the second drive's field.
    const g2 = sampleField(spec, modes, freqB, Q, GRID_N);
    const out = new Float32Array(g.length);
    let peak = 1e-9;
    for (let i = 0; i < g.length; i++) {
      const v = g[i] * res.strength + g2[i] * (resB?.strength ?? 0);
      out[i] = v;
      if (!Number.isNaN(v) && Math.abs(v) > peak) peak = Math.abs(v);
    }
    for (let i = 0; i < out.length; i++) if (!Number.isNaN(out[i])) out[i] /= peak;
    return out;
  }, [spec, modes, freq, freqB, Q, res.strength, resB]);
  const strength = Math.max(res.strength, resB?.strength ?? 0);

  // Preset "land on mode k" resolves once the modes exist.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || !preset || preset.freq.kind !== 'mode') return;
    landed.current = true;
    const excitable = modes.filter((m) => m.drive > 0.05);
    const target = excitable[Math.min(preset.freq.index, excitable.length - 1)];
    if (target) setFreq(target.hz * ((preset.freq as Extract<FreqStrategy, { kind: 'mode' }>).detuneRatio ?? 1));
  }, [preset, modes]);

  // ── sound ────────────────────────────────────────────────────────────────
  const tone = useDriveTone(freq, freqB, amplitude);
  const driving = tone.running || silentDrive;

  // ── sweep: log 40 → 2500 Hz over 45 s, loops; the audio follows the same f
  useEffect(() => {
    if (!sweeping) return;
    const t0 = Date.now();
    const f0 = 40;
    const f1 = 2500;
    const dur = 45000;
    const id = setInterval(() => {
      const u = ((Date.now() - t0) % dur) / dur;
      setFreq(Math.round(f0 * Math.pow(f1 / f0, u) * 10) / 10);
    }, 60);
    return () => clearInterval(id);
  }, [sweeping]);

  const note = nearestNote(freq);
  const mat = MATERIALS.find((m) => m.id === spec.material)!;
  const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
  const asp = plateAspect(spec);
  const patch = (o: Partial<PlateSpec>) => setSpec((s) => ({ ...s, ...o }));
  const nudge = (pct: number) => setFreq((f) => Math.max(F_MIN, Math.min(F_MAX, Math.round(f * (1 + pct) * 10) / 10)));

  const viz = skiaAvailable ? requireVizPlate() : null;

  // ── dock ─────────────────────────────────────────────────────────────────
  const modeOptions = modes
    .filter((m) => m.drive > 0.05)
    .slice(0, 10)
    .map((m) => ({ id: m.id, label: `${formatHz(m.hz)} · ${m.label}`, blurb: `Mode ${m.label}: ${m.nodalLines} nodal line${m.nodalLines === 1 ? '' : 's'}. Jump the drive frequency onto this resonance.` }));
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
      format: () => `${formatHz(freq)} · ${note.label} ${note.centsLabel}`,
      formatShort: () => formatHz(freq),
      helpKey: 'frequency',
      chooser: {
        title: 'JUMP TO A MODE',
        options: modeOptions,
        selectedId: res.dominant && res.state === 'at' ? res.dominant.id : null,
        onSelect: (id) => {
          const m = modes.find((x) => x.id === id);
          if (m) {
            setSweeping(false);
            setFreq(Math.round(m.hz * 10) / 10);
          }
        },
      },
    },
    {
      kind: 'fader',
      id: 'level',
      label: 'LEVEL',
      value: amplitude,
      onChange: setAmplitude,
      format: (v) => `Drive ${Math.round(v * 100)} %`,
      formatShort: (v) => `${Math.round(v * 100)}%`,
      level: true,
      home: 0.7,
      helpKey: 'amplitude',
    },
    {
      kind: 'group',
      id: 'plate',
      label: 'PLATE',
      valueLabel: `${mat.label.slice(0, 5)} ${spec.sizeMm}`,
      helpKey: 'plate',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>SHAPE</Text>
          <View style={styles.chips}>
            {SHAPES.map((s) => (
              <LabChip key={s.id} label={s.label} selected={spec.shape === s.id} onPress={() => patch({ shape: s.id })} onLongPress={() => openLesson('shape')} />
            ))}
          </View>
          {lib ? <Text style={styles.trayBlurb}>{lib.info.blurb} Solved numerically (finite elements) — {lib.validated ? 'validated against the exact solution' : 'calculated'}.</Text> : null}
          <Text style={styles.trayHead}>MATERIAL</Text>
          <View style={styles.chips}>
            {MATERIALS.map((m) => (
              <LabChip key={m.id} label={m.label} selected={spec.material === m.id} onPress={() => patch({ material: m.id as MaterialId })} onLongPress={() => openLesson('material')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>{mat.blurb}</Text>
          <Text style={styles.trayHead}>SIZE (mm){lib ? ` — ${lib.info.unitLabel}` : spec.shape === 'circle' ? ' — diameter' : spec.shape === 'rect' ? ' — long side' : ''}</Text>
          <View style={styles.chips}>
            {SIZES.map((s) => (
              <LabChip key={s} label={`${s}`} selected={spec.sizeMm === s} onPress={() => patch({ sizeMm: s })} onLongPress={() => openLesson('size')} />
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
          <Text style={styles.trayHead}>THICKNESS (mm)</Text>
          <View style={styles.chips}>
            {THICKS.map((t) => (
              <LabChip key={t} label={`${t}`} selected={spec.thicknessMm === t} onPress={() => patch({ thicknessMm: t })} onLongPress={() => openLesson('thickness')} />
            ))}
          </View>
          <Text style={styles.trayHead}>EDGES</Text>
          {lib ? (
            <>
              <View style={styles.chips}>
                <LabChip label={lib.info.boundaryLabel} selected onPress={() => openLesson('edges')} onLongPress={() => openLesson('edges')} />
              </View>
              <Text style={styles.trayBlurb}>For a solved shape the edge condition is part of the solution, not a control — the modes were computed with exactly this boundary.</Text>
            </>
          ) : (
            <View style={styles.chips}>
              {EDGES.map((e) => (
                <LabChip key={e.id} label={e.label} selected={spec.edge === e.id} onPress={() => patch({ edge: e.id })} onLongPress={() => openLesson('edges')} />
              ))}
            </View>
          )}
          {spec.material === 'wood' ? (
            <>
              <Text style={styles.trayHead}>GRAIN ANGLE</Text>
              <View style={styles.chips}>
                {GRAINS.map((g) => (
                  <LabChip key={g} label={`${g}°`} selected={spec.grainDeg === g} onPress={() => patch({ grainDeg: g })} onLongPress={() => openLesson('material')} />
                ))}
              </View>
              <Text style={styles.trayBlurb}>
                {lib
                  ? 'Solid wood is ~10× stiffer along the grain than across it. The solved shapes are isotropic, so here wood takes the geometric-mean stiffness and the grain angle does not re-order the modes — use the square or rectangle to see that.'
                  : 'Solid wood is ~10× stiffer along the grain than across it. Rotating the grain changes which modes come first.'}
              </Text>
            </>
          ) : null}
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'drive',
      label: 'DRIVE',
      valueLabel: multi === 'off' ? 'single' : MULTI.find((m) => m.id === multi)!.label.slice(2, 8),
      helpKey: 'exciter',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>EXCITER POSITION</Text>
          <View style={styles.chips}>
            {EXCITERS.map((e) => (
              <LabChip key={e.id} label={e.label} selected={Math.abs(spec.exciter.x - e.p.x) < 0.02 && Math.abs(spec.exciter.y - e.p.y * asp) < 0.02} onPress={() => patch({ exciter: { x: e.p.x, y: e.p.y * asp } })} onLongPress={() => openLesson('exciter')} />
            ))}
            <LabChip label="Drag on plate" selected={dragTarget === 'exciter'} onPress={() => setDragTarget(dragTarget === 'exciter' ? null : 'exciter')} />
          </View>
          <Text style={styles.trayBlurb}>A mode is driven in proportion to how much it moves under the driver. Put the driver on a nodal line and that mode goes quiet.</Text>
          <Text style={styles.trayHead}>SUPPORT / CLAMP</Text>
          <View style={styles.chips}>
            <LabChip label="None (free on post)" selected={spec.support == null} onPress={() => patch({ support: null })} onLongPress={() => openLesson('support')} />
            <LabChip label="Clamp centre" selected={!!spec.support && Math.abs(spec.support.x - 0.5) < 0.02} onPress={() => patch({ support: { x: 0.5, y: 0.5 * asp } })} onLongPress={() => openLesson('support')} />
            <LabChip label="Drag on plate" selected={dragTarget === 'support'} onPress={() => setDragTarget(dragTarget === 'support' ? null : 'support')} />
          </View>
          <Text style={styles.trayHead}>DAMPING</Text>
          <View style={styles.chips}>
            {DAMPS.map((d) => (
              <LabChip key={d.id} label={d.label} selected={Math.abs(spec.damping - d.id) < 1e-6} onPress={() => patch({ damping: d.id })} onLongPress={() => openLesson('damping')} />
            ))}
          </View>
          <Text style={styles.trayHead}>SECOND TONE</Text>
          <View style={styles.chips}>
            {MULTI.map((m) => (
              <LabChip key={m.id} label={m.label} selected={multi === m.id} onPress={() => setMulti(m.id)} onLongPress={() => openLesson('multi')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>
            {multi === 'off'
              ? 'One drive frequency. Add a second to see two modes share the plate.'
              : tone.dualReady
                ? `Two tones summed in one channel (${formatHz(freq)} + ${formatHz(freqB!)}) — heard AND shown.`
                : `Second tone is SHOWN only on this build — playing two tones at once needs the next app build (engine 8).`}
          </Text>
        </View>
      ),
    },
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: VIEWS.find((v) => v.id === view)!.label.slice(0, 9),
      options: VIEWS.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      selectedId: view,
      onSelect: (id) => {
        setView(id as PlateViewMode);
        if (id === 'section') setDragTarget('section');
        else if (dragTarget === 'section') setDragTarget(null);
      },
      sticky: true,
      helpKey: 'display',
    },
    {
      kind: 'group',
      id: 'sand',
      label: 'SAND',
      valueLabel: `${sandCount / 1000}k`,
      helpKey: 'particles',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>AMOUNT</Text>
          <View style={styles.chips}>
            {SAND_AMOUNTS.map((n) => (
              <LabChip key={n} label={`${n / 1000}k grains`} selected={sandCount === n} onPress={() => setSandCount(n)} />
            ))}
          </View>
          <Text style={styles.trayHead}>GRAIN SIZE</Text>
          <View style={styles.chips}>
            {[
              { v: 0.15, l: 'Fine' },
              { v: 0.45, l: 'Medium' },
              { v: 0.9, l: 'Coarse' },
            ].map((g) => (
              <LabChip key={g.l} label={g.l} selected={Math.abs(sandSize - g.v) < 1e-6} onPress={() => setSandSize(g.v)} />
            ))}
          </View>
          <Text style={styles.trayHead}>FRICTION</Text>
          <View style={styles.chips}>
            {[
              { v: 0.1, l: 'Low' },
              { v: 0.4, l: 'Medium' },
              { v: 0.9, l: 'High' },
            ].map((g) => (
              <LabChip key={g.l} label={g.l} selected={Math.abs(friction - g.v) < 1e-6} onPress={() => setFriction(g.v)} />
            ))}
          </View>
          <View style={styles.chips}>
            <LabChip label="⟲ Reset sand" selected={false} onPress={() => setResetToken((t) => t + 1)} />
            <LabChip label={slowMo ? 'Slow motion ON' : 'Slow motion'} selected={slowMo} onPress={() => setSlowMo((s) => !s)} />
          </View>
        </View>
      ),
    },
  ];

  const bezel = [
    { k: 'DRIVE', v: formatHz(freq), helpKey: 'frequency' },
    { k: 'NOTE', v: `${note.label} ${note.centsLabel}`, helpKey: 'frequency' },
    { k: 'MODE', v: res.dominant && res.state !== 'below' && res.state !== 'between' ? res.dominant.label : '—', helpKey: 'modes' },
    { k: 'RES', v: res.state.toUpperCase(), tint: RES_TINT[res.state], helpKey: 'resonance', flex: 1.2 },
  ];

  const togglePlay = () => (tone.running ? tone.stop() : void tone.start());

  return (
    <>
      <LabShell
        labId="cymatics"
        title="CHLADNI PLATE STUDIO"
        subtitle="Cymatics Lab: Sound Made Visible"
        intro="Build a plate, drive it with a tone, and watch sand find the lines where the plate stands still. Patterns snap in only near the plate’s own resonances — and which resonances those are depends on the whole plate, not on the frequency alone."
        exploreCaption="Sweep the frequency, or jump straight to a mode from the FREQ key. Change the plate and watch the same frequency stop being a resonance."
        headerAction={<HeaderPlayButton playing={tone.running} onPress={togglePlay} disabled={!tone.engineReady} label={tone.running ? 'Stop the drive tone' : 'Play the drive tone'} />}
        rack={{
          initialParam: 'freq',
          onHelp: openLesson,
          stage: {
            size: 'L',
            badge: lib
              ? `SIMULATION — ${lib.info.label.toUpperCase()}: FEM MODAL LIBRARY (${lib.validated ? 'CALCULATED · VALIDATED' : 'CALCULATED'})`
              : spec.shape === 'circle'
                ? 'SIMULATION — DISC MODES: BESSEL SHAPES, TABULATED EIGENVALUES (APPROXIMATED)'
                : 'SIMULATION — FREE-PLATE MODES: RITZ APPROXIMATION (APPROXIMATED)',
            onGuide: () => openLesson('display'),
            bezel,
            hideDragTag: true,
            render: (w, h) =>
              viz ? (
                <viz.PlateView
                  width={w}
                  height={h}
                  spec={spec}
                  grid={grid}
                  N={GRID_N}
                  strength={strength}
                  amplitude={amplitude}
                  view={view}
                  running={driving}
                  slowMo={slowMo}
                  particleCount={sandCount}
                  particleSize={sandSize}
                  friction={friction}
                  resetToken={resetToken}
                  sectionY={sectionY}
                  dragTarget={dragTarget}
                  onPlace={(kind, x, y) => patch(kind === 'exciter' ? { exciter: { x, y } } : { support: { x, y } })}
                  onSection={setSectionY}
                />
              ) : (
                <View style={[styles.noSkia, { width: w, height: h }]}>
                  <Text style={styles.noSkiaText}>The plate display needs the current app build (Skia). Controls and readouts still work.</Text>
                </View>
              ),
          },
          params,
        }}
      >
        {!tone.engineReady ? <EngineGate state={tone.gate} /> : null}
        {tone.error ? <Text style={styles.err}>{tone.error}</Text> : null}

        {/* Resonance strength — the honest readout of how hard the plate moves */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={[styles.resLabel, { color: RES_TINT[res.state] }]}>{RES_LABEL[res.state]}</Text>
            <Text style={styles.resPct}>{Math.round(strength * 100)} %</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.max(2, Math.round(strength * 100))}%`, backgroundColor: levelColor(strength) }]} />
          </View>
          <Text style={styles.caption}>
            {res.state === 'at' && res.dominant
              ? `Mode ${res.dominant.label} at ${formatHz(res.dominant.hz)} · Q ≈ ${Math.round(Q)} · ${res.dominant.nodalLines} nodal line${res.dominant.nodalLines === 1 ? '' : 's'}.`
              : res.state === 'approaching' && res.next
                ? `Next resonance: ${res.next.label} at ${formatHz(res.next.hz)}.`
                : res.state === 'below'
                  ? `First excitable resonance is at ${res.next ? formatHz(res.next.hz) : '—'} — below it the plate only flexes as a whole.`
                  : 'The plate is being pushed off-resonance — small motion, no stable figure. The sand shivers but does not organise.'}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.readK}>λ in air {formatWavelength(wavelengthAir(freq))}</Text>
            <View style={styles.nudgeRow}>
              <Pressable onPress={() => nudge(-0.005)} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Fine down">
                <Text style={styles.nudgeText}>‹ −½%</Text>
              </Pressable>
              <Pressable onPress={() => nudge(0.005)} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Fine up">
                <Text style={styles.nudgeText}>+½% ›</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.chips}>
          <LabChip label={sweeping ? '■ Stop sweep' : '▶ Sweep 40 → 2.5k Hz'} selected={sweeping} onPress={() => setSweeping((s) => !s)} />
          <LabChip label="⟲ Reset sand" selected={false} onPress={() => setResetToken((t) => t + 1)} />
          <LabChip label={slowMo ? 'Slow motion ON' : 'Slow motion'} selected={slowMo} onPress={() => setSlowMo((s) => !s)} />
          <LabChip label={silentDrive ? 'Silent drive ON' : 'Silent drive'} selected={silentDrive} onPress={() => setSilentDrive((s) => !s)} onLongPress={() => openLesson('silent')} />
        </View>
        <Text style={styles.caption}>
          The sand moves only while the plate is driven — press ▶ to play the tone, or SILENT DRIVE to shake the plate without sound.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>WHAT THIS PLATE IS</Text>
          <Text style={styles.body}>
            {mat.label} · {lib ? `${lib.info.label.toLowerCase()}, ${lib.info.unitLabel} ${spec.sizeMm} mm` : spec.shape === 'circle' ? `Ø ${spec.sizeMm} mm` : spec.shape === 'rect' ? `${spec.sizeMm} × ${Math.round(spec.sizeMm * spec.aspect)} mm` : `${spec.sizeMm} × ${spec.sizeMm} mm`} · {spec.thicknessMm} mm thick · {lib ? lib.info.boundaryLabel.replace(' (solved)', '').toLowerCase() : EDGES.find((e) => e.id === spec.edge)!.label.toLowerCase()} · driven at ({spec.exciter.x.toFixed(2)}, {spec.exciter.y.toFixed(2)}){spec.support ? ' · clamped' : ''}.
          </Text>
          <Text style={styles.body}>
            Lowest excitable modes: {modes.filter((m) => m.drive > 0.05).slice(0, 4).map((m) => formatHz(m.hz)).join(' · ')}. Ratios to the first: {(() => {
              const ex = modes.filter((m) => m.drive > 0.05).slice(0, 4);
              return ex.length ? ex.map((m) => (m.hz / ex[0].hz).toFixed(2)).join(' : ') : '—';
            })()} — not 1 : 2 : 3 : 4. Plate modes are inharmonic.
          </Text>
        </View>

        <View style={styles.chips}>
          <LabChip label="Guided experiments ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'experiments' })} />
          <LabChip label="Nodes & modes ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'nodes' })} />
          <LabChip label="Evidence vs myth ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'myth' })} />
        </View>
        <Text style={styles.honest}>
          SIMULATION. Rectangular free plates have no exact solution — these figures use the standard Ritz approximation; disc modes use Bessel shapes with tabulated free-edge eigenvalues. Triangle, hexagon, ring, bell and instrument plates are solved numerically (finite elements, 16 modes each) and looked up — Calculated{lib ? `; this shape: ${lib.validationNote}` : ''}. The size / thickness / material scaling law is exact. A real plate’s figures also depend on its flatness, mounting and the sand itself.
        </Text>
      </LabShell>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingBottom: 4 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSub, marginTop: 6 },
  trayBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 8 },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  resPct: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: '#1b1c22', overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  readK: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  nudgeRow: { flexDirection: 'row', gap: 8 },
  nudge: { borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 10, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  nudgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 4 },
  err: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ff6b5e' },
  noSkia: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noSkiaText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, textAlign: 'center' },
});
