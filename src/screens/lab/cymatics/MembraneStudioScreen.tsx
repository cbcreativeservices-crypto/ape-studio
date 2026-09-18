/**
 * MembraneStudioScreen — Cymatics Lab › Membrane & Loudspeaker Studio (spec
 * §1.5, §3 item 4, Phase 3): a drumhead you can tune, strike and damp, and a
 * loudspeaker cone from piston motion to breakup — on the shared LabShell
 * RACK faceplate.
 *
 *   STAGE  vizMembrane — the drum from above (lit head), heat / phase / node
 *          views, 3D head, cross-section; or the loudspeaker cutaway with a
 *          front view of the cone.
 *   BEZEL  drum: DRIVE Hz · FUNDAMENTAL · MODE · RESPONSE %
 *          speaker: DRIVE Hz · f_s · ka · STAGE
 *   DOCK   FREQ (lane + jump-to-mode chooser) · HEAD · STRIKE · CONE ·
 *          VIEW · LEVEL.
 *   WELL   the tuning card (fundamental, the mode ratios, why a drum has no
 *          pitch and a timpani does), the response meter, actions, the cone
 *          stage ladder, the honesty lines, cross-links, the guided lesson.
 *
 * SCIENCE PATH: controls → MembraneSpec → membraneModes() (exact Bessel modes,
 * exact tension/size/density scaling; Rossing's measured kettle ratios,
 * Approximated) → membraneStrength() → sampleMembrane() (signed ±1 grid) →
 * vizMembrane. Loudspeaker: DriverId → readCone() (stage ladder, Illustrative;
 * f_s response, ka and the 1/f² piston law, Calculated) → sampleCone().
 *
 * SOUND: our native generator (useDriveTone) — a sine at the drive frequency.
 * The cone in the cutaway moves at exactly what the tone is playing.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { heatColor, levelColor, rampColors } from '../../../features/tools/levelColor';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { EngineGate } from '../../tools/EngineGate';
import { LabChip, LabShell, HeaderPlayButton, HeaderTextButton } from '../LabShell';
import type { DockParam } from '../rack/rackTypes';
import {
  CONE_STAGE_LABEL,
  CONE_STAGE_NUM,
  DEFAULT_MEMBRANE,
  DRIVERS,
  DRIVER_BY_ID,
  HEADS,
  HEAD_BY_ID,
  fundamentalHz,
  membraneModes,
  membraneQ,
  membraneStrength,
  readCone,
  sampleCone,
  sampleMembrane,
  type DriverId,
  type HeadId,
  type MembraneSpec,
} from '../../../features/cymatics/membrane';
import { formatHz, nearestNote } from '../../../features/cymatics/music';
import { EXPERIMENT_BY_PRESET, MEMBRANE_PRESET_BY_ID } from '../../../features/cymatics/presets';
import { newPattern, patternStore } from '../../../features/cymatics/patternStore';
import { defaultPatternName } from '../../../features/cymatics/patternField';
import type { RootStackParamList } from '../../../navigation/types';
import { ExperimentWell } from './ExperimentWell';
import { requireVizMembrane, skiaAvailable } from './skiaGate';
import type { MembraneViewMode } from './vizMembrane';
import { useDriveTone } from './useDriveTone';
import { RES_TINT } from '../../../features/cymatics/resTint';

const F_MIN = 20;
const F_MAX = 6000;
const GRID_N = 56;
const hzFromPos = (v: number) => F_MIN * Math.pow(F_MAX / F_MIN, Math.max(0, Math.min(1, v)));
const posFromHz = (hz: number) => Math.log(Math.max(F_MIN, Math.min(F_MAX, hz)) / F_MIN) / Math.log(F_MAX / F_MIN);

const DIAMETERS: { mm: number; label: string }[] = [
  { mm: 254, label: '10" tom' },
  { mm: 305, label: '12" tom' },
  { mm: 355, label: '14" snare' },
  { mm: 406, label: '16" floor tom' },
  { mm: 660, label: '26" timpani' },
];
const TENSIONS = [1000, 2000, 3000, 4000, 6000];
const DAMPS: { id: number; label: string }[] = [
  { id: 0.15, label: 'Open' },
  { id: 0.5, label: 'Muffled' },
  { id: 0.95, label: 'Hand on the head' },
];
const STRIKES: { id: string; label: string; r: number; theta: number }[] = [
  { id: 'centre', label: 'Centre', r: 0, theta: 0 },
  { id: 'quarter', label: 'Quarter in (timpani)', r: 0.25, theta: 0 },
  { id: 'half', label: 'Halfway', r: 0.5, theta: 30 },
  { id: 'edge', label: 'Near the rim', r: 0.85, theta: 30 },
];
const VIEWS: { id: MembraneViewMode; label: string; short: string; blurb: string }[] = [
  { id: 'head', label: 'The drum', short: 'Drum', blurb: 'The head from above, lit — it bulges and dips in the mode you are driving, strobed to a few hertz.' },
  { id: 'heat', label: 'Heat map', short: 'Heat', blurb: 'How much each point of the head moves, on the Academy ramp: black = still, red = the most. Dark between resonances.' },
  { id: 'phase', label: 'Phase', short: 'Phase', blurb: 'Amber rises while violet falls — the lobes either side of a nodal diameter move in opposite directions. Neither colour is on the amplitude ramp: this is direction, not level.' },
  { id: 'nodes', label: 'Node lines', short: 'Nodes', blurb: 'The nodal diameters and circles of the nearest mode — the lines a pinch of sand would gather on.' },
  { id: 'head3d', label: '3D head', short: '3D', blurb: 'Exaggerated head motion, strobed so you can see it (the real head moves at the drive frequency).' },
  { id: 'section', label: 'Cross-section', short: 'Slice', blurb: 'A slice through the head. Drag on the drum to move the slice.' },
  { id: 'speaker', label: 'Loudspeaker', short: 'Cone', blurb: 'A cutaway of a driver playing this frequency, plus the cone seen from the front: piston, edge flexing, radial modes, breakup.' },
];
const HEAT_KEY = Array.from({ length: 9 }, (_, i) => heatColor(i / 8)) as [string, string, ...string[]];

// The cone stage is ORDINAL, not an amplitude: categorical tints (the Liquid ladder idiom), never the ramp.
const CONE_TINT: Record<number, string> = { 1: colors.textSub, 2: '#37e05f', 3: '#37e05f', 4: '#ffc64d', 5: '#ff9f43', 6: '#ff6b5e' };
const HEAD_SHORT: Record<HeadId, string> = { mylar10: 'M10', mylar7: 'M7', calfskin: 'Calf', latex: 'Ltx', kevlar: 'Kev' };

export function MembraneStudioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsMembraneStudio'>>();
  const preset = route.params?.preset ? MEMBRANE_PRESET_BY_ID[route.params.preset] : undefined;
  const experiment = preset ? EXPERIMENT_BY_PRESET[preset.id] : undefined;

  const [spec, setSpec] = useState<MembraneSpec>(() => ({ ...DEFAULT_MEMBRANE, ...(preset?.spec ?? {}) }));
  const [freq, setFreq] = useState(typeof preset?.hz === 'number' ? preset.hz : 180);
  const [amplitude, setAmplitude] = useState(0.7);
  const [view, setView] = useState<MembraneViewMode>(preset?.view ?? 'head');
  const [driverId, setDriverId] = useState<DriverId>(preset?.driver ?? 'woofer200');
  const [slowMo, setSlowMo] = useState(false);
  const [silentDrive, setSilentDrive] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [sectionY, setSectionY] = useState(0.5);
  const [dragTarget, setDragTarget] = useState<'strike' | 'section' | null>(null);
  const [lessonKey, setLessonKey] = useState<string | undefined>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState<{ id: string; name: string } | 'failed' | null>(null);
  const [reopened, setReopened] = useState<string | null>(null);
  const openLesson = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };
  const isSpeaker = view === 'speaker';

  // ── science chain: the head ───────────────────────────────────────────────
  const modes = useMemo(() => membraneModes(spec, 16), [spec]);
  const Q = useMemo(() => membraneQ(spec), [spec]);
  const f01 = useMemo(() => fundamentalHz(spec), [spec]);
  const st = useMemo(() => membraneStrength(modes, freq, Q), [modes, freq, Q]);
  const grid = useMemo(() => sampleMembrane(modes, freq, Q, GRID_N), [modes, freq, Q]);
  const head = HEAD_BY_ID[spec.head];

  // ── science chain: the cone ───────────────────────────────────────────────
  const driver = DRIVER_BY_ID[driverId];
  const cone = useMemo(() => readCone(driver, freq), [driver, freq]);
  const coneGrid = useMemo(() => sampleCone(cone, 40), [cone]);

  // Preset "land on mode (n,s)" resolves once the modes exist.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || !preset) return;
    const target = preset.hz;
    if (typeof target === 'number') return;
    const m = modes.find((x) => x.n === target.n && x.s === target.s) ?? modes[0];
    if (!m) return;
    landed.current = true;
    setFreq(Math.round(m.hz * 10) / 10);
  }, [preset, modes]);

  // Reopen a saved pattern's EXACT configuration (Gallery → OPEN IN STUDIO).
  const savedId = route.params?.saved;
  useEffect(() => {
    if (!savedId) return;
    let alive = true;
    void patternStore()
      .getPattern(savedId)
      .then((p) => {
        if (!alive || !p || p.state.studio !== 'membrane') return;
        const s = p.state;
        landed.current = true;
        setSpec(s.spec);
        setFreq(s.hz);
        setAmplitude(s.amplitude);
        setView(s.view as MembraneViewMode);
        setDriverId(s.driverId as DriverId);
        setReopened(p.name);
      });
    return () => {
      alive = false;
    };
  }, [savedId]);

  // ── sound ────────────────────────────────────────────────────────────────
  const tone = useDriveTone(freq, null, amplitude);
  const driving = tone.running || silentDrive;

  // Dwell sweep over the head's driven modes (the plate idiom); in the
  // loudspeaker view it walks the cone's stages instead: f_s → piston → ka=1
  // → edge → radial → breakup.
  useEffect(() => {
    if (!sweeping) return;
    const stops = isSpeaker
      ? [driver.fs * 0.5, driver.fs, driver.fs * 2.5, (343 / (Math.PI * (driver.diameterMm / 1000))) * 1.05, driver.breakupHz * 0.45, driver.breakupHz * 0.75, driver.breakupHz * 1.5]
      : modes.filter((m) => m.drive > 0.05).map((m) => m.hz);
    const ex = stops.filter((f) => f >= F_MIN && f <= F_MAX);
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
  }, [sweeping, modes, isSpeaker, driver]);

  const patch = (o: Partial<MembraneSpec>) => setSpec((s) => ({ ...s, ...o }));
  const land = (hz: number) => {
    setSweeping(false);
    setFreq(Math.round(hz * 10) / 10);
  };
  const viz = skiaAvailable ? requireVizMembrane() : null;
  const note = nearestNote(freq);

  // ── dock ─────────────────────────────────────────────────────────────────
  const modeOptions = isSpeaker
    ? [
        { id: 'fs', hz: driver.fs, label: `${formatHz(driver.fs)} · resonance f_s`, blurb: 'The suspension resonance: the cone travels furthest here for the least drive.' },
        { id: 'piston', hz: driver.fs * 3, label: `${formatHz(driver.fs * 3)} · piston band`, blurb: 'Mass-controlled: the whole cone moves as one and excursion falls as 1/f² while the output stays flat.' },
        { id: 'ka1', hz: 343 / (Math.PI * (driver.diameterMm / 1000)), label: `${formatHz(343 / (Math.PI * (driver.diameterMm / 1000)))} · ka = 1`, blurb: 'The wavelength equals the cone circumference: above this the driver begins to beam.' },
        { id: 'edge', hz: driver.breakupHz * 0.45, label: `${formatHz(driver.breakupHz * 0.45)} · edge flexing`, blurb: 'The surround and outer cone stop following the coil rigidly — the centre leads the rim.' },
        { id: 'breakup', hz: driver.breakupHz * 1.3, label: `${formatHz(driver.breakupHz * 1.3)} · breakup`, blurb: 'Above the first bending frequency the cone no longer moves as one: peaks, dips, distortion.' },
      ]
    : modes
        .filter((m) => m.drive > 0.05)
        .slice(0, 10)
        .map((m) => ({ id: m.id, hz: m.hz, label: `${formatHz(m.hz)} · ${m.label}`, blurb: `Mode ${m.label}: ${m.n} nodal diameter${m.n === 1 ? '' : 's'}, ${m.s - 1} interior circle${m.s - 1 === 1 ? '' : 's'}. Jump the drive onto this resonance.` }));

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
        title: isSpeaker ? 'JUMP TO A CONE STAGE' : 'JUMP TO A MODE',
        options: modeOptions.map((o) => ({ id: o.id, label: o.label, blurb: o.blurb })),
        selectedId: isSpeaker ? null : st.dominant && st.strength > 0.5 ? st.dominant.id : null,
        onSelect: (id) => {
          const o = modeOptions.find((x) => x.id === id);
          if (o) land(o.hz);
        },
      },
    },
    {
      kind: 'group',
      id: 'head',
      label: 'HEAD',
      valueLabel: `${Math.round(spec.diameterMm / 25.4)}″${HEAD_SHORT[spec.head]}`,
      helpKey: 'head',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>HEAD MATERIAL</Text>
          <View style={styles.chips}>
            {HEADS.map((h) => (
              <LabChip key={h.id} label={h.label} selected={spec.head === h.id} onPress={() => patch({ head: h.id })} onLongPress={() => openLesson('head')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>{head.blurb}</Text>
          <Text style={styles.trayHead}>DIAMETER</Text>
          <View style={styles.chips}>
            {DIAMETERS.map((d) => (
              <LabChip key={d.mm} label={d.label} selected={spec.diameterMm === d.mm} onPress={() => patch({ diameterMm: d.mm })} onLongPress={() => openLesson('tension')} />
            ))}
          </View>
          <Text style={styles.trayHead}>TENSION (N/m)</Text>
          <View style={styles.chips}>
            {TENSIONS.map((t) => (
              <LabChip key={t} label={`${(t / 1000).toFixed(0)} kN/m`} selected={spec.tensionNpm === t} onPress={() => patch({ tensionNpm: t })} onLongPress={() => openLesson('tension')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>Tighter, smaller, lighter → higher: f ∝ √T, ∝ 1/diameter, ∝ 1/√(areal density). The fundamental is on the bezel.</Text>
          <Text style={styles.trayHead}>DAMPING</Text>
          <View style={styles.chips}>
            {DAMPS.map((d) => (
              <LabChip key={d.id} label={d.label} selected={Math.abs(spec.damping - d.id) < 1e-6} onPress={() => patch({ damping: d.id })} onLongPress={() => openLesson('damping')} />
            ))}
          </View>
          <Text style={styles.trayHead}>UNDER THE HEAD</Text>
          <View style={styles.chips}>
            <LabChip label="Open shell" selected={!spec.kettle} onPress={() => patch({ kettle: false })} onLongPress={() => openLesson('kettle')} />
            <LabChip label="Timpani kettle" selected={spec.kettle} onPress={() => patch({ kettle: true })} onLongPress={() => openLesson('kettle')} />
          </View>
          <Text style={styles.trayBlurb}>
            {spec.kettle
              ? 'The bowl’s air loads the head: the (1,1), (2,1), (3,1)… modes slide toward 1 : 1.5 : 2 : 2.5 — near-harmonic, so the ear hears a pitch (Rossing’s measurements; Approximated).'
              : 'A bare head’s modes sit at 1 : 1.59 : 2.14 : 2.30 : 2.65 — not integers, so a drum has no clear pitch.'}
          </Text>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'strike',
      label: 'STRIKE',
      valueLabel: STRIKES.find((x) => Math.abs(spec.strike.r - x.r) < 0.02 && Math.abs(spec.strike.thetaDeg - x.theta) < 1)?.id === 'quarter' ? 'Qtr' : spec.strike.r < 0.05 ? 'Ctr' : spec.strike.r > 0.7 ? 'Rim' : 'Half',
      helpKey: 'strike',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>RUN</Text>
          <View style={styles.chips}>
            <LabChip label={sweeping ? '■ Stop sweep' : isSpeaker ? '▶ Sweep the cone stages' : '▶ Sweep the modes'} selected={sweeping} onPress={() => setSweeping((s) => !s)} />
            <LabChip label={slowMo ? 'Slow motion ON' : 'Slow motion'} selected={slowMo} onPress={() => setSlowMo((s) => !s)} />
            <LabChip label={silentDrive ? 'Silent drive ON' : 'Silent drive'} selected={silentDrive} onPress={() => setSilentDrive((s) => !s)} onLongPress={() => openLesson('silent')} />
          </View>
          <Text style={styles.trayHead}>WHERE THE MALLET LANDS</Text>
          <View style={styles.chips}>
            {STRIKES.map((s) => (
              <LabChip key={s.id} label={s.label} selected={Math.abs(spec.strike.r - s.r) < 0.02 && Math.abs(spec.strike.thetaDeg - s.theta) < 1} onPress={() => patch({ strike: { r: s.r, thetaDeg: s.theta } })} onLongPress={() => openLesson('strike')} />
            ))}
            <LabChip label="Drag on drum" selected={dragTarget === 'strike'} onPress={() => setDragTarget(dragTarget === 'strike' ? null : 'strike')} />
          </View>
          <Text style={styles.trayBlurb}>A mode is driven in proportion to how much it moves under the mallet. Dead centre wakes only the ring modes (the dull thud); a quarter of the way in favours the (1,1) mode the timpanist tunes to.</Text>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'speaker',
      label: 'CONE',
      valueLabel: driver.label.split(' ')[0].replace(' mm', ''),
      helpKey: 'cone',
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>DRIVER</Text>
          <View style={styles.chips}>
            {DRIVERS.map((d) => (
              <LabChip key={d.id} label={d.label} selected={driverId === d.id} onPress={() => setDriverId(d.id)} onLongPress={() => openLesson('cone')} />
            ))}
          </View>
          <Text style={styles.trayBlurb}>{driver.blurb}</Text>
          <Text style={styles.trayMono}>f_s {driver.fs} Hz · Q_ts {driver.qts} · Ø {driver.diameterMm} mm · breakup ≈ {driver.breakupHz < 1000 ? `${driver.breakupHz} Hz` : `${(driver.breakupHz / 1000).toFixed(1)} kHz`} · {driver.cone}</Text>
          <View style={styles.chips}>
            <LabChip label={isSpeaker ? 'Showing the loudspeaker' : 'Show the loudspeaker'} selected={isSpeaker} onPress={() => setView(isSpeaker ? 'head' : 'speaker')} />
          </View>
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
        setView(id as MembraneViewMode);
        if (id === 'section') setDragTarget('section');
        else if (dragTarget === 'section') setDragTarget(null);
      },
      sticky: true,
      helpKey: 'membrane_display',
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
  ];

  const ex = modes.filter((m) => m.drive > 0.05);
  const bezel = isSpeaker
    ? [
        { k: 'DRIVE', v: formatHz(freq), helpKey: 'frequency' },
        { k: 'f_s', v: formatHz(driver.fs), helpKey: 'cone' },
        { k: 'ka', v: cone.ka.toFixed(2), helpKey: 'cone' },
        { k: 'STAGE', v: `${CONE_STAGE_NUM[cone.stage]} / 6`, tint: CONE_TINT[CONE_STAGE_NUM[cone.stage]], helpKey: 'breakup', flex: 1.1 },
      ]
    : [
        { k: 'DRIVE', v: formatHz(freq), helpKey: 'frequency' },
        { k: 'FUNDAMENTAL', v: formatHz(f01), helpKey: 'tension', flex: 1.2 },
        { k: 'MODE', v: st.dominant && st.strength > 0.5 ? st.dominant.label.split(' · ')[0] : '—', helpKey: 'modes' },
        // Tap the cell to land on the nearest driven mode (the bezel-cell verb).
        { k: 'RESPONSE', v: `${Math.round(st.strength * 100)} %`, tint: levelColor(st.strength), helpKey: 'resonance', onPress: ex.length && st.strength <= 0.5 ? () => land(ex.reduce((a, b) => (Math.abs(a.hz - freq) < Math.abs(b.hz - freq) ? a : b)).hz) : undefined },
      ];

  const togglePlay = () => (tone.running ? tone.stop() : void tone.start());
  const badge = isSpeaker
    ? `SIMULATION · ILLUSTRATIVE cone stages · CALCULATED f_s, ka, 1/f² excursion — ${cone.label === 'CALCULATED' ? 'this stage is calculated' : 'this stage is illustrative'}`
    : spec.kettle
      ? 'SIMULATION · CALCULATED Bessel head modes · APPROXIMATED kettle loading (Rossing)'
      : 'SIMULATION · CALCULATED — clamped-membrane Bessel modes';
  // SAVE → the Pattern Gallery (Phase 4): the full state, never a picture.
  const savePattern = () => {
    const state = { studio: 'membrane' as const, spec, hz: freq, amplitude, view, driverId };
    const p = newPattern(state, badge, defaultPatternName(state));
    void patternStore()
      .upsertPattern(p)
      .then((ok) => setSavedMsg(ok ? { id: p.id, name: p.name } : 'failed'));
  };
  const ref11 = modes.find((m) => m.n === 1 && m.s === 1);
  const ratioBase = spec.kettle && ref11 ? ref11 : ex[0];

  return (
    <>
      <LabShell
        labId="cymatics"
        title="MEMBRANE & LOUDSPEAKER STUDIO"
        subtitle="Cymatics Lab: Sound Made Visible"
        intro="A drumhead is a membrane: it has no stiffness of its own, only tension, so its modes are the exact Bessel patterns — and their frequencies are NOT a harmonic series, which is why a drum has no clear pitch and a timpani (with its kettle) does. A loudspeaker cone is the opposite bargain: a stiff shell asked to move as one piston until, at its breakup frequency, it stops obeying."
        exploreCaption="Tune the head, move the mallet, sweep the modes. Then show the loudspeaker and sweep from its resonance up through breakup."
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
            onGuide: () => openLesson('membrane_display'),
            bezel,
            hideDragTag: true,
            render: (w, h) =>
              viz ? (
                <viz.MembraneView
                  width={w}
                  height={h}
                  spec={spec}
                  grid={grid}
                  N={GRID_N}
                  strength={st.strength}
                  amplitude={amplitude}
                  view={view}
                  running={driving}
                  slowMo={slowMo}
                  sectionY={sectionY}
                  dragTarget={dragTarget}
                  onStrike={(r, th) => patch({ strike: { r, thetaDeg: th } })}
                  onSection={setSectionY}
                  cone={{ read: cone, grid: coneGrid, driver, hz: freq }}
                />
              ) : (
                <View style={[styles.noSkia, { width: w, height: h }]}>
                  <Text style={styles.noSkiaText}>The drum display needs the current app build (Skia). Controls and readouts still work.</Text>
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
            {savedMsg !== 'failed' ? <LabChip label="Open the gallery ›" selected={false} onPress={() => navigation.navigate('CymaticsGallery', { id: savedMsg.id })} /> : null}
          </View>
        ) : null}
        {view === 'heat' || view === 'head3d' || view === 'section' || view === 'speaker' ? (
          <View style={styles.keyRow} accessible accessibilityLabel="Colour key: black is still, red is the most motion">
            <Text style={styles.keyText}>STILL</Text>
            <LinearGradient colors={HEAT_KEY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.keyBar} />
            <Text style={styles.keyText}>MOST MOTION</Text>
          </View>
        ) : null}

        {!isSpeaker ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.resLabel, { color: RES_TINT[st.strength > 0.5 ? 'at' : st.strength > 0.15 ? 'approaching' : 'between'] }]}>{st.strength > 0.5 ? 'AT RESONANCE' : st.strength > 0.15 ? 'APPROACHING' : 'BETWEEN RESONANCES'}</Text>
              <Text style={styles.resPct}>{Math.round(st.strength * 100)} %</Text>
            </View>
            <View style={styles.meterTrack}>
              <LinearGradient colors={rampColors(st.strength)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.meterFill, { width: `${Math.max(2, Math.round(st.strength * 100))}%` }]} />
            </View>
            <Text style={styles.caption}>
              {st.dominant && st.strength > 0.5
                ? `Mode ${st.dominant.label} at ${formatHz(st.dominant.hz)} · Q ≈ ${Math.round(Q)}. LEVEL ${Math.round(amplitude * 100)} % sets how far the head moves — not which mode.`
                : ex.length
                  ? `Nearest driven mode: ${ex.reduce((a, b) => (Math.abs(a.hz - freq) < Math.abs(b.hz - freq) ? a : b)).label} at ${formatHz(ex.reduce((a, b) => (Math.abs(a.hz - freq) < Math.abs(b.hz - freq) ? a : b)).hz)}.`
                  : 'No mode is driven from this strike point.'}
            </Text>
          </View>
        ) : null}

        {!isSpeaker ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>TUNING — WHY A DRUM HAS NO PITCH{spec.kettle ? ' AND A TIMPANI DOES' : ''}</Text>
            <Text style={styles.body}>
              {head.label}, Ø {spec.diameterMm} mm at {(spec.tensionNpm / 1000).toFixed(1)} kN/m: fundamental (0,1) at {formatHz(f01)} · {nearestNote(f01).label}.
            </Text>
            <Text style={styles.body}>
              Mode ratios to {ratioBase ? ratioBase.label.split(' · ')[0] : '—'}:{' '}
              {ratioBase ? modes.filter((m) => m.s === 1 || m.n === 0).slice(0, 6).map((m) => (m.hz / ratioBase.hz).toFixed(2)).join(' : ') : '—'}
              {spec.kettle ? ' — near 1 : 1.5 : 2 : 2.5, a harmonic series missing its fundamental, so the ear supplies a pitch.' : ' — not 1 : 2 : 3 : 4. A bare membrane is inharmonic.'}
            </Text>
            <Text style={styles.readK}>
              (0,1) {formatHz(f01)} · (1,1) {ref11 ? formatHz(ref11.hz) : '—'} · Q ≈ {Math.round(Q)}
            </Text>
          </View>
        ) : null}

        {isSpeaker ? (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={[styles.stageLabel, { color: CONE_TINT[CONE_STAGE_NUM[cone.stage]] }]}>{CONE_STAGE_LABEL[cone.stage]}</Text>
              <Text style={styles.stageNum}>STAGE {CONE_STAGE_NUM[cone.stage]} / 6</Text>
            </View>
            <View style={styles.ladder}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <View key={n} style={[styles.rung, n <= CONE_STAGE_NUM[cone.stage] && { backgroundColor: n === CONE_STAGE_NUM[cone.stage] ? CONE_TINT[n] : '#2c2e38' }, n === CONE_STAGE_NUM[cone.stage] && styles.rungOn]} />
              ))}
            </View>
            <Text style={styles.caption}>{cone.why}</Text>
            <Text style={styles.readK}>
              excursion {Math.round(cone.excursion * 100)} % of the resonant peak · ka {cone.ka.toFixed(2)} ({cone.beamDeg != null ? `beam ≈ ${cone.beamDeg}°` : 'omnidirectional'}) · {cone.label}
            </Text>
            <Text style={styles.body}>
              {driver.label}: f_s {driver.fs} Hz, Q_ts {driver.qts}, first bending frequency ≈ {driver.breakupHz < 1000 ? `${driver.breakupHz} Hz` : `${(driver.breakupHz / 1000).toFixed(1)} kHz`}. The tone you hear is what the cone is doing.
            </Text>
          </View>
        ) : null}

        <Text style={styles.caption}>Nothing moves without a drive — press ▶ to play the tone, or STRIKE › SILENT to shake without sound. STRIKE › SWEEP walks the modes (or the cone stages). Displays are strobed to a few hertz; the real head and cone move at the drive frequency.</Text>

        <View style={styles.chips}>
          <LabChip label="Guided experiments ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'experiments' })} />
          <LabChip label="Harmonics vs modes ›" selected={false} onPress={() => navigation.navigate('CymaticsModule', { id: 'harmonics' })} />
          <LabChip label="Chladni plate studio ›" selected={false} onPress={() => navigation.navigate('CymaticsPlateStudio', {})} />
        </View>
        <Text style={styles.honest}>SIMULATION.</Text>
        <Text style={styles.honest}>· Calculated: the clamped membrane’s Bessel modes and the exact tension / size / density scaling; the driver’s resonance response, ka and the 1/f² piston law.</Text>
        <Text style={styles.honest}>· Approximated: the kettle’s air loading (Rossing’s measured ratios on the principal modes; a plain air-mass factor on the rest).</Text>
        <Text style={styles.honest}>· Illustrative: the six cone stages and the cone’s drawn motion — a stiffness profile, not a cone finite-element model. Real drivers differ in surround, spider and cone geometry.</Text>
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
  stageLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, flexShrink: 1 },
  stageNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  ladder: { flexDirection: 'row', gap: 4 },
  rung: { flex: 1, height: 8, borderRadius: 3, backgroundColor: '#1b1c22' },
  rungOn: { height: 12, marginTop: -2 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  readK: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, flexShrink: 1 },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 4 },
  err: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ff6b5e' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  savedText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  noSkia: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noSkiaText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, textAlign: 'center' },
});
