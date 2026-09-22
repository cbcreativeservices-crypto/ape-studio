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
import { LinearGradient } from 'expo-linear-gradient';
import { heatColor, levelColor, rampColors } from '../../../features/tools/levelColor';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { EngineGate } from '../../tools/EngineGate';
import { LabChip, LabShell, HeaderPlayButton, HeaderTextButton } from '../LabShell';
import type { DockParam } from '../rack/rackTypes';
import { MATERIALS, type MaterialId } from '../../../features/cymatics/materials';
import { DEFAULT_PLATE, effectiveQ, plateAspect, plateModes, readResonance, sampleField, type EdgeCondition, type PlateShape, type PlateSpec } from '../../../features/cymatics/plateModes';
import { LIBRARY_SHAPES, isLibraryShape, loadLibraryShape } from '../../../features/cymatics/modalLibrary';
import { formatHz, formatWavelength, nearestNote, wavelengthAir } from '../../../features/cymatics/music';
import { EXPERIMENT_BY_PRESET, PRESET_BY_ID, type FreqStrategy } from '../../../features/cymatics/presets';
import { newPattern, patternStore } from '../../../features/cymatics/patternStore';
import { defaultPatternName } from '../../../features/cymatics/patternField';
import { ExperimentWell } from './ExperimentWell';
import type { RootStackParamList } from '../../../navigation/types';
import { requireVizPlate, skiaAvailable } from './skiaGate';
import type { PlateViewMode } from './vizPlate';
import { useDriveTone } from './useDriveTone';
import { RES_TINT } from '../../../features/cymatics/resTint';
import { START_LEVEL_01 } from '../../../features/audio/startLevel';
import { goToCymatics } from './goToCymatics';

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
/** The three shapes with closed-form solutions; everything else is the solved
 *  FEM library, which behaves differently (fixed edge, no grain). */
const ANALYTIC_SHAPE_IDS = new Set<PlateShape>(['square', 'rect', 'circle']);
const SIZES = [100, 160, 240, 320, 400];
const THICKS = [0.5, 1, 2, 3, 4];
const EDGES: { id: EdgeCondition; label: string }[] = [
  { id: 'free', label: 'Free edges' },
  { id: 'supported', label: 'Supported' },
  { id: 'clamped', label: 'Clamped' },
];
const GRAINS = [0, 30, 60, 90];
const DAMPS: { id: number; label: string }[] = [
  { id: 0.1, label: 'Low' },
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
const VIEWS: { id: PlateViewMode; label: string; short: string; blurb: string }[] = [
  { id: 'particles', label: 'Particles', short: 'Sand', blurb: 'Sand on the plate — it walks off the moving regions and settles on the still lines.' },
  { id: 'heat', label: 'Heat map', short: 'Heat', blurb: 'How much each point moves, on the Academy ramp: black = still, blue = a little, red = the most. Off a resonance the whole map goes dark — the plate is barely moving.' },
  { id: 'overlay', label: 'Particles + heat', short: 'S+H', blurb: 'Both at once: the prediction (heat) under the confirmation (sand).' },
  { id: 'phase', label: 'Phase', short: 'Phase', blurb: 'Amber regions rise while violet regions fall — opposite sides of a nodal line move in opposite directions. Neither colour is on the amplitude ramp: this view shows DIRECTION, not level. Fades between resonances.' },
  { id: 'nodes', label: 'Node lines', short: 'Nodes', blurb: 'The nodal pattern of the nearest mode — the Chladni figure that WOULD form. Fades between resonances.' },
  { id: 'plate3d', label: '3D plate', short: '3D', blurb: 'Exaggerated vertical motion, strobed to a few hertz so you can see it (the real plate moves at the drive frequency).' },
  { id: 'section', label: 'Cross-section', short: 'Slice', blurb: 'A slice through the plate. Drag on the plate to move the slice.' },
];
const MAT_SHORT: Record<MaterialId, string> = { aluminum: 'Al', steel: 'Steel', brass: 'Brass', copper: 'Cu', acrylic: 'Acryl', glass: 'Glass', plywood: 'Ply', wood: 'Wood' };
const HEAT_KEY = Array.from({ length: 9 }, (_, i) => heatColor(i / 8)) as [string, string, ...string[]];

const RES_LABEL = {
  below: 'BELOW FIRST RESONANCE',
  approaching: 'APPROACHING RESONANCE',
  at: 'AT RESONANCE',
  between: 'BETWEEN RESONANCES',
} as const;


export function PlateStudioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsPlateStudio'>>();
  const preset = route.params?.preset ? PRESET_BY_ID[route.params.preset] : undefined;
  const experiment = preset ? EXPERIMENT_BY_PRESET[preset.id] : undefined;

  const [spec, setSpec] = useState<PlateSpec>(() => ({ ...DEFAULT_PLATE, ...(preset?.spec ?? {}) }));
  const [freq, setFreq] = useState(preset?.freq.kind === 'hz' ? preset.freq.hz : 240);
  const [amplitude, setAmplitude] = useState(preset?.id === 'turn-it-up' ? 0.2 : START_LEVEL_01);
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
  const [savedMsg, setSavedMsg] = useState<{ id: string; name: string } | 'failed' | null>(null);
  const [reopened, setReopened] = useState<string | null>(null);
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

  // Reopen a saved pattern's EXACT configuration (Gallery → OPEN IN STUDIO).
  // Every field lands in one batch; the preset landing is disarmed first.
  const savedId = route.params?.saved;
  useEffect(() => {
    if (!savedId) return;
    let alive = true;
    void patternStore()
      .getPattern(savedId)
      .then((p) => {
        if (!alive || !p || p.state.studio !== 'plate') return;
        const s = p.state;
        landed.current = true;
        setSpec(s.spec);
        setFreq(s.hz);
        setAmplitude(s.amplitude);
        setView(s.view as PlateViewMode);
        setMulti(s.multi);
        setSandCount(s.sandCount);
        setSandSize(s.sandSize);
        setFriction(s.friction);
        setReopened(p.name);
      });
    return () => {
      alive = false;
    };
  }, [savedId]);

  // ── sound ────────────────────────────────────────────────────────────────
  const tone = useDriveTone(freq, freqB, amplitude);
  const driving = tone.running || silentDrive;

  // ── sweep: a DWELL sweep (learning pass 2026-09-17, D1). Metal plates have
  // Q in the hundreds, so a plain log sweep crossed each resonance in ~20 ms
  // and never read AT. This one glides 1.5 s from mode to mode and HOLDS 3 s
  // on each, so every excitable resonance is seen forming. The audio follows
  // the same frequency. 8 Hz ticks (B7) — each tick re-samples the field.
  useEffect(() => {
    if (!sweeping) return;
    /**
     * ⛔ A SWEEP WITH NOTHING DRIVING IS A LIE (owner ruling 2026-09-22).
     *
     * This depended on `sweeping` alone, so stopping the tone froze the plate
     * correctly — the physics is gated on `driving` — while the sweep kept
     * walking the DRIVE readout across the whole decade in silence, and the
     * chip still offered "Stop sweep". The one number on screen that claims to
     * say what is being played went on changing with nothing playing.
     *
     * Ending the sweep rather than pausing it keeps the chip honest: the
     * control says what is actually happening, and restarting is one tap.
     */
    if (!driving) {
      setSweeping(false);
      return;
    }
    const ex = modes.filter((m) => m.drive > 0.05 && m.hz >= F_MIN && m.hz <= F_MAX).map((m) => m.hz);
    if (ex.length === 0) {
      setSweeping(false);
      return;
    }
    const GLIDE = 1500;
    const HOLD = 3000;
    const segs = ex.map((f, i) => ({ from: i === 0 ? Math.max(F_MIN, f * 0.8) : ex[i - 1], to: f }));
    const period = segs.length * (GLIDE + HOLD);
    const t0 = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - t0) % period;
      const k = Math.floor(t / (GLIDE + HOLD));
      const u = t - k * (GLIDE + HOLD);
      const sg = segs[k];
      const f = u < GLIDE ? sg.from * Math.pow(sg.to / sg.from, u / GLIDE) : sg.to;
      setFreq(Math.round(f * 10) / 10);
    }, 125);
    return () => clearInterval(id);
  }, [sweeping, driving, modes]);

  const note = nearestNote(freq);
  const mat = MATERIALS.find((m) => m.id === spec.material)!;
  const lib = isLibraryShape(spec.shape) ? loadLibraryShape(spec.shape) : null;
  const asp = plateAspect(spec);
  const patch = (o: Partial<PlateSpec>) => setSpec((s) => ({ ...s, ...o }));
  const nudge = (pct: number) => {
    setSweeping(false);
    setFreq((f) => Math.max(F_MIN, Math.min(F_MAX, Math.round(f * (1 + pct) * 10) / 10)));
  };
  const land = (hz: number) => {
    setSweeping(false);
    setFreq(Math.round(hz * 10) / 10);
  };

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
      formatShort: () => (freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${Math.round(freq)}Hz`),
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
      kind: 'group',
      id: 'plate',
      label: 'PLATE',
      valueLabel: `${MAT_SHORT[spec.material]}${spec.sizeMm}`,
      helpKey: 'plate',
      render: () => (
        <View style={styles.tray}>
          {/* ── THE TWO KINDS OF SHAPE ARE NOT THE SAME KIND (2026-09-18, #13) ──
              Eleven chips used to sit in one undifferentiated wrap: three
              analytic shapes and eight solved FEM library shapes. The
              distinction is load-bearing — the solved shapes carry a FIXED edge
              condition and wood loses its grain behaviour on them — and it was
              discoverable only by picking one and reading the blurb underneath.
              A sub-head costs a line and makes the group visible before the
              choice rather than after it. */}
          <Text style={styles.trayHead}>SHAPE</Text>
          <View style={styles.chips}>
            {SHAPES.filter((s) => ANALYTIC_SHAPE_IDS.has(s.id)).map((s) => (
              <LabChip key={s.id} label={s.label} selected={spec.shape === s.id} onPress={() => patch({ shape: s.id })} onLongPress={() => openLesson('shape')} />
            ))}
          </View>
          <Text style={styles.trayHead}>SOLVED SHAPES — fixed edges, no wood grain</Text>
          <View style={styles.chips}>
            {SHAPES.filter((s) => !ANALYTIC_SHAPE_IDS.has(s.id)).map((s) => (
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
          <Text style={styles.trayHead}>DAMPING</Text>
          <View style={styles.chips}>
            {DAMPS.map((d) => (
              <LabChip key={d.id} label={d.label} selected={Math.abs(spec.damping - d.id) < 1e-6} onPress={() => patch({ damping: d.id })} onLongPress={() => openLesson('damping')} />
            ))}
          </View>
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
      valueLabel: multi === 'off' ? 'one' : MULTI.find((m) => m.id === multi)!.label.slice(-3),
      helpKey: 'exciter',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>DRIVER POSITION</Text>
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
          <Text style={styles.trayHead}>RUN</Text>
          <View style={styles.chips}>
            <LabChip label={sweeping ? '■ Stop sweep' : '▶ Sweep the modes'} selected={sweeping} onPress={() => setSweeping((s) => !s)} />
            <LabChip label={slowMo ? 'Slow motion ON' : 'Slow motion'} selected={slowMo} onPress={() => setSlowMo((s) => !s)} />
            <LabChip label={silentDrive ? 'Silent drive ON' : 'Silent drive'} selected={silentDrive} onPress={() => setSilentDrive((s) => !s)} onLongPress={() => openLesson('silent')} />
          </View>
          <Text style={styles.trayBlurb}>SWEEP glides from mode to mode and dwells on each. SILENT drives the plate without the tone.</Text>
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
                : 'Second tone is SHOWN only — this build’s sound engine plays one tone at a time.'}
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
      onSelect: (id) => {
        setView(id as PlateViewMode);
        if (id === 'section') setDragTarget('section');
        else if (dragTarget === 'section') setDragTarget(null);
      },
      sticky: true,
      helpKey: 'display',
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
      // Double-tap reset goes to the same place as first open: one number,
      // so a reset can never be louder than where you started (2026-09-19).
      home: START_LEVEL_01,
      helpKey: 'amplitude',
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
          <View style={styles.chips}>
            <LabChip label="⟲ Reset sand" selected={false} onPress={() => setResetToken((t) => t + 1)} />
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
        </View>
      ),
    },
  ];

  const bezel = [
    { k: 'DRIVE', v: formatHz(freq), helpKey: 'frequency' },
    { k: 'RESPONSE', v: `${Math.round(strength * 100)} %`, tint: levelColor(strength), helpKey: 'resonance' },
    { k: 'MODE', v: res.dominant && res.state !== 'below' && res.state !== 'between' ? res.dominant.label : '—', helpKey: 'modes' },
    // Tap the RES cell to land on the nearest mode (the bezel-cell verb; no control in the scroller).
    { k: 'RES', v: res.state.toUpperCase(), tint: RES_TINT[res.state], helpKey: 'resonance', flex: 1.2, onPress: res.state !== 'at' && res.next ? () => land(res.next!.hz) : undefined },
  ];

  const togglePlay = () => (tone.running ? tone.stop() : void tone.start());
  const badge = lib
    ? `SIMULATION · ${lib.validated ? 'CALCULATED · VALIDATED' : 'CALCULATED'} — ${lib.info.label} FEM modal library`
    : spec.shape === 'circle'
      ? 'SIMULATION · APPROXIMATED — Bessel disc modes, tabulated eigenvalues'
      : 'SIMULATION · APPROXIMATED — Ritz free-plate modes';
  // SAVE → the Pattern Gallery (Phase 4): numbers, not a picture — the full
  // state, so the figure is reproducible; the badge it carried rides along.
  const savePattern = () => {
    const state = { studio: 'plate' as const, spec, hz: freq, amplitude, view, multi, sandCount, sandSize, friction };
    const p = newPattern(state, badge, defaultPatternName(state));
    void patternStore()
      .upsertPattern(p)
      .then((ok) => setSavedMsg(ok ? { id: p.id, name: p.name } : 'failed'));
  };

  return (
    <>
      <LabShell
        labId="cymatics"
        title="CHLADNI PLATE STUDIO"
        subtitle="Cymatics Lab: Sound Made Visible"
        intro="Build a plate, drive it with a tone, and watch sand find the lines where the plate stands still. Patterns snap in only near the plate’s own resonances — and which resonances those are depends on the whole plate, not on the frequency alone."
        exploreCaption="Sweep the frequency, or jump straight to a mode from the FREQ key. Change the plate and watch the same frequency stop being a resonance."
        headerAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <HeaderTextButton label="SAVE" onPress={savePattern} accessibilityLabel="Save this pattern to the gallery" />
            <HeaderPlayButton playing={tone.running} onPress={togglePlay} disabled={!tone.engineReady} label={tone.running ? 'Stop the drive tone' : 'Play the drive tone'} />
          </View>
        }
        rack={{
          initialParam: 'freq',
          onHelp: openLesson,
          stage: {
            size: 'L',
            badge,
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
          // The experiment the learner arrived to run — pinned above the notes.
          wellTop: experiment ? <ExperimentWell experiment={experiment} /> : undefined,
        }}
      >
        {!tone.engineReady ? <EngineGate state={tone.gate} /> : null}
        {tone.error ? <Text style={styles.err}>{tone.error}</Text> : null}
        {reopened ? <Text style={styles.savedText}>REOPENED FROM THE GALLERY · {reopened}</Text> : null}
        {savedMsg ? (
          <View style={styles.savedRow}>
            <Text style={styles.savedText}>{savedMsg === 'failed' ? 'SAVE FAILED — TRY AGAIN' : 'SAVED TO THE GALLERY ✓'}</Text>
            {savedMsg !== 'failed' ? <LabChip label="Open the gallery ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsGallery', { id: savedMsg.id })} /> : null}
            {/* ── SAY WHY YOU WOULD COMPARE (2026-09-18, design review #12) ──
                The gallery offers browse / colour / compare and never says what
                compare is FOR. Its verdict line states the lab's whole thesis in
                data form, and nothing routed a learner to it — they had to
                stumble on it. The moment they have just saved is the moment the
                next move is obvious, so it is said here. */}
            {savedMsg !== 'failed' ? (
              <Text style={styles.compareHint}>
                Now change ONE thing — the plate, the material, the thickness — save that too, and compare the
                two side by side.
              </Text>
            ) : null}
          </View>
        ) : null}
        {view === 'heat' || view === 'overlay' || view === 'plate3d' || view === 'section' ? (
          <View style={styles.keyRow} accessible accessibilityLabel="Colour key: black is still, red is the most motion">
            <Text style={styles.keyText}>STILL</Text>
            <LinearGradient colors={HEAT_KEY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.keyBar} />
            <Text style={styles.keyText}>MOST MOTION</Text>
          </View>
        ) : null}

        {/* Resonance strength — the honest readout of how hard the plate moves */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={[styles.resLabel, { color: RES_TINT[res.state] }]}>{RES_LABEL[res.state]}</Text>
            <Text style={styles.resPct}>{Math.round(strength * 100)} %</Text>
          </View>
          {/* A bar whose SIZE is a level shows the ramp climbing to the level's colour (colour standard 2026-08-16). */}
          <View style={styles.meterTrack}>
            <LinearGradient colors={rampColors(strength)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.meterFill, { width: `${Math.max(2, Math.round(strength * 100))}%` }]} />
          </View>
          <Text style={styles.caption}>
            {res.state === 'at' && res.dominant
              ? `Mode ${res.dominant.label} at ${formatHz(res.dominant.hz)} · ${res.dominant.nodalLines} nodal line${res.dominant.nodalLines === 1 ? '' : 's'}. LEVEL ${Math.round(amplitude * 100)} % sets how far it moves — not which mode.`
              : res.state === 'approaching' && res.next
                ? `Next resonance: ${res.next.label} at ${formatHz(res.next.hz)}.`
                : res.state === 'below'
                  ? `First excitable resonance is at ${res.next ? formatHz(res.next.hz) : '—'} — below it the plate only flexes as a whole.`
                  : `Off resonance — small motion, no stable figure; the sand shivers but does not organise.${res.next ? ` Nearest: ${res.next.label} at ${formatHz(res.next.hz)} — tap RES on the bezel to land on it.` : ''}`}
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.readK}>Q ≈ {Math.round(Q)} · {tone.running && freqB ? `B: ${formatHz(freqB)} ${resB?.state ?? ''}` : `λ in air ${formatWavelength(wavelengthAir(freq))}`}</Text>
            <View style={styles.nudgeRow}>
              <Pressable onPress={() => nudge(-0.001)} onLongPress={() => nudge(-0.005)} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Fine down 0.1 percent; hold for half a percent">
                <Text style={styles.nudgeText}>‹ −0.1%</Text>
              </Pressable>
              <Pressable onPress={() => nudge(0.001)} onLongPress={() => nudge(0.005)} hitSlop={8} style={styles.nudge} accessibilityRole="button" accessibilityLabel="Fine up 0.1 percent; hold for half a percent">
                <Text style={styles.nudgeText}>+0.1% ›</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.caption}>
          The sand moves only while the plate is driven — press ▶ to play the tone, or DRIVE › SILENT to shake the plate without sound. DRIVE › SWEEP glides from mode to mode and dwells on each. 3D and CROSS-SECTION are strobed to a few hertz.
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
          <LabChip label="Guided experiments ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsModule', { id: 'experiments' })} />
          <LabChip label="Nodes & modes ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsModule', { id: 'nodes' })} />
          <LabChip label="Evidence vs myth ›" selected={false} onPress={() => goToCymatics(navigation, 'CymaticsModule', { id: 'myth' })} />
        </View>
        <Text style={styles.honest}>SIMULATION.</Text>
        <Text style={styles.honest}>· Exact: the size / thickness / material scaling law.</Text>
        <Text style={styles.honest}>
          · Calculated: triangle, hexagon, ring, bell and instrument plates — solved numerically (finite elements, 16 modes each) and looked up{lib ? `; this shape: ${lib.validationNote}` : ''}.
        </Text>
        <Text style={styles.honest}>· Approximated: rectangular free plates (no exact solution — the standard Ritz form) and disc modes (Bessel shapes, tabulated eigenvalues).</Text>
        <Text style={styles.honest}>· A real plate’s figures also depend on its flatness, its mounting and the sand itself.</Text>
      </LabShell>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingBottom: 4 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSub, marginTop: 6 },
  trayBlurb: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 8 },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4 },
  resPct: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: '#1b1c22', overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4 },
  landBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.6)', backgroundColor: 'rgba(255,198,77,.08)', paddingHorizontal: 10, paddingVertical: 6 },
  landText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyBar: { flex: 1, height: 8, borderRadius: 4 },
  keyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  readK: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  nudgeRow: { flexDirection: 'row', gap: 8 },
  // 44pt: the smallest control in the lab and a precision one used one-handed
  // (a11y worklist / design review #15). hitSlop stays as well.
  nudge: { borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 10, paddingVertical: 6, minHeight: 44, justifyContent: 'center' },
  compareHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginTop: 6 },
  nudgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 4 },
  err: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ff6b5e' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  savedText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  noSkia: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noSkiaText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, textAlign: 'center' },
});
