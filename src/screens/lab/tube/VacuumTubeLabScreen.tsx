/**
 * VacuumTubeLabScreen — "Vacuum Tube Fundamentals" (owner 2026-07-29).
 * Single mission: HOW A TUBE AMPLIFIES BY CONTROLLING ELECTRON FLOW.
 *
 * VISUAL-FIRST LAUNCH: an interactive-animation lab — no audio playback;
 * stated on-screen. Every drawing is an ILLUSTRATIVE MODEL (schematic
 * cross-sections, a normalized tanh transfer curve) — never measured tube
 * data (§1.7), and each panel badges that.
 *
 * THE STAR (owner spec): the global ELECTRON VIEW toggle — Physical view
 * (glass, electrodes, filament glow) vs Electron view (blue cloud, flow
 * lines, the grid's field) — one switch connecting the outside of the tube
 * to what happens inside it.
 *
 * SHAPE: sectioned lab (10 topics on a chip-jump row): Inside · Flow · Grid ·
 * Amplify · High Voltage · Types · Bias · Saturation · vs Transistor ·
 * Classics — with answer→reveal checks on the grid and bias beats.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { requireTubeViz, skiaAvailable, type TubeVizModule } from './skiaGate';

// ── Screen-owned data (no Skia dependency) ──────────────────────────────────

type TubePart = 'envelope' | 'heater' | 'cathode' | 'grid' | 'screen' | 'suppressor' | 'plate' | 'vacuum';

const PARTS: { key: TubePart; label: string; note: string; pentodeOnly?: boolean }[] = [
  { key: 'envelope', label: 'GLASS', note: 'The glass envelope seals the vacuum in and the air out. Break the seal and the tube dies — oxygen would burn the hot cathode instantly.' },
  { key: 'heater', label: 'HEATER', note: 'The filament — a resistance wire that glows to heat the cathode. It is the reason tubes need warm-up time (and why they glow).' },
  { key: 'cathode', label: 'CATHODE', note: 'The electron source: a coated sleeve around the heater that BOILS OFF electrons when hot (thermionic emission).' },
  { key: 'grid', label: 'CONTROL GRID', note: 'A sparse spiral of wire between cathode and plate. Its small negative voltage gates the whole electron stream — the heart of amplification.' },
  { key: 'screen', label: 'SCREEN GRID', note: 'Tetrode/pentode only: a second, positive grid that pulls electrons along and shields the control grid from the plate — faster, more stable gain.', pentodeOnly: true },
  { key: 'suppressor', label: 'SUPPRESSOR', note: 'Pentode only: a third grid near the plate that pushes secondary electrons (knocked off the plate) back where they belong.', pentodeOnly: true },
  { key: 'plate', label: 'PLATE', note: 'The anode — a metal box around everything, held at high positive voltage. It attracts the electron stream; its current is the amplified signal.' },
  { key: 'vacuum', label: 'VACUUM', note: 'The nothing that makes it work: with no air molecules in the way, electrons fly freely from cathode to plate. No vacuum, no tube.' },
];

const FLOW_STAGES: { until: number; text: string }[] = [
  { until: 0.15, text: '1 · Cold: nothing moves. A tube does nothing until the heater warms up.' },
  { until: 0.35, text: '2 · The heater glows, warming the cathode sleeve around it.' },
  { until: 0.6, text: '3 · The hot cathode boils off electrons — an invisible cloud (space charge) forms around it.' },
  { until: 0.85, text: '4 · The positive plate attracts the cloud — electrons begin streaming across the vacuum.' },
  { until: 1.01, text: '5 · Steady current flows, cathode → plate. The tube is alive and ready to amplify.' },
];

const CLASSICS: { name: string; kind: 'preamp' | 'power'; role: string; gear: string }[] = [
  { name: '12AX7', kind: 'preamp', role: 'High-gain dual triode — THE preamp tube', gear: 'Nearly every guitar amp input stage; countless mic preamps' },
  { name: '12AU7', kind: 'preamp', role: 'Low-gain dual triode — clean drivers', gear: 'Hi-fi line stages, studio gear, driver circuits' },
  { name: '12AT7', kind: 'preamp', role: 'Medium-gain dual triode', gear: 'Reverb drivers, phase inverters' },
  { name: 'EL34', kind: 'power', role: 'Power pentode — the British crunch', gear: 'Marshall stacks, Hiwatt' },
  { name: 'EL84', kind: 'power', role: 'Small power pentode — chime', gear: 'Vox AC30, boutique combos' },
  { name: '6L6GC', kind: 'power', role: 'Beam power tube — the American clean', gear: 'Fender Twin & Bassman, Mesa' },
  { name: 'KT88', kind: 'power', role: 'Big beam power tube — authority', gear: 'Hi-fi power amps, bass rigs, McIntosh' },
  { name: '6550', kind: 'power', role: 'Big beam power tube — headroom', gear: 'Ampeg SVT bass stacks, studio power amps' },
];

// ── Shared bits ─────────────────────────────────────────────────────────────

function IllustrationBadge({ text }: { text?: string }) {
  return <Text style={styles.badge}>{text ?? 'ILLUSTRATIVE MODEL — SCHEMATIC CROSS-SECTION, NOT MEASURED TUBE DATA'}</Text>;
}

function MeterBar({ label, frac, color }: { label: string; frac: number; color: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.max(2, Math.min(100, frac * 100))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

type SectionProps = { viz: TubeVizModule | null; width: number; focused: boolean; electron: boolean; help: (k: string) => void };

// ── 1 · What's inside ───────────────────────────────────────────────────────

function InsideSection({ viz, width, focused, electron, help }: SectionProps) {
  const [part, setPart] = useState<TubePart | null>(null);
  const sel = PARTS.find((p) => p.key === part) ?? null;
  return (
    <View style={styles.panelCard}>
      {viz ? <CutawayViz viz={viz} width={width} kind="pentode" highlight={part} electron={electron} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge />
      <DisplayGuideButton onPress={() => help('cutaway')} />
      <View style={styles.chipRow}>
        {PARTS.map((p) => (
          <LabChip key={p.key} label={p.label} selected={part === p.key} onPress={() => setPart(part === p.key ? null : p.key)} onLongPress={() => help('cutaway')} />
        ))}
      </View>
      <Text style={styles.caption}>
        {sel ? sel.note : 'Tap any part to highlight it in the cutaway and read what it does. (Drawn as a pentode — the fullest version; the Types section strips it back down.)'}
      </Text>
    </View>
  );
}
function CutawayViz({ viz, width, kind, highlight, electron, running, secondary }: { viz: TubeVizModule; width: number; kind: 'triode' | 'tetrode' | 'pentode'; highlight: TubePart | null; electron: boolean; running: boolean; secondary?: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.TubeCutawayView phase={phase} width={width} kind={kind} highlight={highlight} electronView={electron} showSecondary={secondary} />;
}

// ── 2 · Electron flow (warm-up) ─────────────────────────────────────────────

function FlowSection({ viz, width, focused, help }: SectionProps) {
  const [heat, setHeat] = useState(0);
  const stage = FLOW_STAGES.find((s) => heat < s.until) ?? FLOW_STAGES[4];
  const current = heat > 0.75 ? (heat - 0.75) / 0.25 : 0;
  return (
    <View style={styles.panelCard}>
      {viz ? <FlowViz viz={viz} width={width} heat={heat} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL — the warm-up sequence, slowed and drawn; real electrons are invisible and countless" />
      <DisplayGuideButton onPress={() => help('warm_up')} />
      <DragSlider value={heat} onChange={setHeat} label="WARM-UP" readout={heat < 0.15 ? 'cold' : heat < 0.75 ? 'warming…' : 'conducting'} onHelp={() => help('warm_up')} />
      <MeterBar label="PLATE CURRENT" frac={current} color="#5bff85" />
      <Text style={styles.readout}>{stage.text}</Text>
      <Text style={styles.caption}>
        This is why the vacuum matters: electrons can only fly freely because there is NOTHING in
        the way. And it is why tube gear needs warm-up — no heat, no electrons, no sound.
      </Text>
    </View>
  );
}
function FlowViz({ viz, width, heat, running }: { viz: TubeVizModule; width: number; heat: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.ElectronFlowView phase={phase} width={width} heat01={heat} />;
}

// ── 3 · The control grid ────────────────────────────────────────────────────

const GRID_CHECK: CheckSpec = {
  question: 'The control grid sits between cathode and plate. How does it control the LARGE plate current?',
  options: [
    'It physically blocks electrons like a shutter',
    'Its small NEGATIVE voltage repels electrons — a tiny voltage change gates the whole stream',
    'It heats up and emits extra electrons',
  ],
  correctIdx: 1,
  reveal:
    'The grid is a sparse spiral — most electrons could fly right through the gaps. What stops them is its FIELD: a small negative voltage repels the (negative) electrons back toward the cathode. Nudge that voltage slightly and the entire stream swells or starves — a tiny voltage controlling a large current IS amplification.',
  wrongHint: 'Drag the slider and watch — do the grid wires move, or does something invisible change?',
};

function GridSection({ viz, width, focused, electron, help }: SectionProps) {
  const [v, setV] = useState(0.5);
  return (
    <View style={styles.panelCard}>
      {viz ? <GridViz viz={viz} width={width} cond={v} electron={electron} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL — electron view adds the grid's repelling field lines; conduction is illustrative" />
      <DisplayGuideButton onPress={() => help('grid_voltage')} />
      <DragSlider
        value={v}
        onChange={setV}
        label="GRID VOLTAGE"
        readout={v < 0.15 ? 'very negative — cutoff' : v > 0.85 ? 'barely negative — full flow' : 'partly negative'}
        onHelp={() => help('grid_voltage')}
      />
      <MeterBar label="PLATE CURRENT" frac={v} color={v > 0.9 ? '#ffd76b' : '#5bff85'} />
      <Text style={styles.caption}>
        A very small voltage change at the grid controls a much larger current through the tube.
        That sentence is the entire reason vacuum tubes changed the world — read it again while
        dragging the slider.
      </Text>
      <CheckQuestion spec={GRID_CHECK} />
    </View>
  );
}
function GridViz({ viz, width, cond, electron, running }: { viz: TubeVizModule; width: number; cond: number; electron: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.GridControlView phase={phase} width={width} cond={cond} electronView={electron} />;
}

// ── 4 · Amplification ───────────────────────────────────────────────────────

function AmplifySection({ viz, width, focused, help }: SectionProps) {
  return (
    <View style={styles.panelCard}>
      {viz ? <AmplifyViz viz={viz} width={width} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="ILLUSTRATIVE — gain drawn ~×7; the output is INVERTED (that sign-flip is real tube behavior)" />
      <DisplayGuideButton onPress={() => help('amplification')} />
      <Text style={styles.caption}>
        Small control → large response. The tiny waveform wiggles the grid; the grid gates the big
        plate current; the plate current, pulled through a resistor, becomes a LARGE copy of the
        input — flipped upside-down, because MORE grid signal means MORE current means the plate
        voltage DROPS.
      </Text>
      <Text style={styles.caption}>
        Every tube mic preamp, guitar amp, compressor and broadcast console ever made is this one
        picture, repeated.
      </Text>
    </View>
  );
}
function AmplifyViz({ viz, width, running }: { viz: TubeVizModule; width: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.AmplifyView phase={phase} width={width} />;
}

// ── 5 · Why high voltage ────────────────────────────────────────────────────

function HighVoltSection({ viz, width, focused, help }: SectionProps) {
  const [highB, setHighB] = useState(false);
  return (
    <View style={styles.panelCard}>
      {viz ? <HvViz viz={viz} width={width} highB={highB} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="CONCEPTUAL — attraction strength drawn as arrow length and electron count" />
      <DisplayGuideButton onPress={() => help('high_voltage')} />
      <View style={styles.chipRow}>
        <LabChip label="SMALL SUPPLY" selected={!highB} onPress={() => setHighB(false)} onLongPress={() => help('high_voltage')} />
        <LabChip label="HIGH-VOLTAGE SUPPLY (B+)" selected={highB} onPress={() => setHighB(true)} onLongPress={() => help('high_voltage')} />
      </View>
      <Text style={styles.caption}>
        {highB
          ? 'A high-voltage plate pulls HARD: a dense, fast electron stream with room to swing. This is why tube circuits run at hundreds of volts — the “B+” supply.'
          : 'A small supply barely attracts the cloud: few electrons cross, weakly. Not enough current — and no headroom to swing a big signal.'}
      </Text>
      <Text style={styles.caption}>
        (It is also why tube gear deserves respect when the cover comes off — those voltages
        remain stored in capacitors after power-down.)
      </Text>
    </View>
  );
}
function HvViz({ viz, width, highB, running }: { viz: TubeVizModule; width: number; highB: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.HighVoltageView phase={phase} width={width} highB={highB} />;
}

// ── 6 · Tube types ──────────────────────────────────────────────────────────

const TYPES: { kind: 'triode' | 'tetrode' | 'pentode'; label: string; note: string }[] = [
  { kind: 'triode', label: 'TRIODE', note: 'One grid. Simple, warm, linear — the classic preamp element (both halves of a 12AX7 are triodes). Its weakness: the plate’s field reaches back through the grid, limiting gain and speed.' },
  { kind: 'tetrode', label: 'TETRODE', note: 'Adds the SCREEN grid: a positive grid that shields the control grid from the plate — much higher gain and speed. New problem (shown in red): electrons knock SECONDARY electrons off the plate, and the screen steals them.' },
  { kind: 'pentode', label: 'PENTODE', note: 'Adds the SUPPRESSOR grid by the plate: it turns the secondary electrons back (red dots now die at the suppressor). High gain, high power, well-behaved — the classic output tube (EL34, EL84).' },
];

function TypesSection({ viz, width, focused, electron, help }: SectionProps) {
  const [idx, setIdx] = useState(0);
  const t = TYPES[idx];
  return (
    <View style={styles.panelCard}>
      {viz ? <CutawayViz viz={viz} width={width} kind={t.kind} highlight={null} electron={electron} running={focused} secondary={idx > 0} /> : <VizUnavailableCard />}
      <IllustrationBadge text="ILLUSTRATIVE — red dots = secondary emission (the tetrode's problem, the pentode's fix)" />
      <DisplayGuideButton onPress={() => help('tube_types')} />
      <View style={styles.chipRow}>
        {TYPES.map((ty, i) => (
          <LabChip key={ty.kind} label={ty.label} selected={idx === i} onPress={() => setIdx(i)} onLongPress={() => help('tube_types')} />
        ))}
      </View>
      <Text style={styles.caption}>{t.note}</Text>
    </View>
  );
}

// ── 7 · Bias ────────────────────────────────────────────────────────────────

const BIAS_CHECK: CheckSpec = {
  question: 'A tube biased FAR too negative sits in cutoff. What does the output do?',
  options: [
    'It distorts with a bright, fizzy edge',
    'Little or nothing — the stream is already shut off, so the signal’s wiggles can’t modulate it',
    'It gets louder, because the tube works harder',
  ],
  correctIdx: 1,
  reveal:
    'Bias sets WHERE on the transfer curve the tube idles. Too negative and the stream is already cut off — the input wiggles a closed valve (the output flatlines, or only half the wave sneaks through). Correct bias parks the idle point mid-curve so the whole swing stays on the straight part. Too positive and it slams into saturation instead.',
  wrongHint: 'Drag the bias slider to the far left and watch the output wave on the right.',
};

function BiasSection({ viz, width, focused, help }: SectionProps) {
  const [b, setB] = useState(0.5);
  const zone = b < 0.22 ? 'TOO NEGATIVE — CUTOFF: the bottom of the swing flatlines' : b > 0.8 ? 'TOO POSITIVE — SATURATION: the top of the swing flattens' : 'CORRECT BIAS — the swing rides the straight part of the curve';
  return (
    <View style={styles.panelCard}>
      {viz ? <BiasViz viz={viz} width={width} bias={b} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="ILLUSTRATIVE TRANSFER CURVE (normalized) — left: the operating point riding the curve · right: the resulting output" />
      <DisplayGuideButton onPress={() => help('bias')} />
      <DragSlider value={b} onChange={setB} label="BIAS" readout={b < 0.22 ? 'too negative' : b > 0.8 ? 'too positive' : 'correct'} onHelp={() => help('bias')} />
      <Text style={[styles.readout, b < 0.22 || b > 0.8 ? styles.readoutBad : null]}>{zone}</Text>
      <Text style={styles.caption}>
        Bias is the idle point — where the tube rests with no signal. Set it mid-curve and the
        whole wave amplifies cleanly; mis-set it and one side of the wave dies first. (This is
        what “biasing your amp” after a tube change is about.)
      </Text>
      <CheckQuestion spec={BIAS_CHECK} />
    </View>
  );
}
function BiasViz({ viz, width, bias, running }: { viz: TubeVizModule; width: number; bias: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.5);
  return <viz.BiasView phase={phase} width={width} bias01={bias} />;
}

// ── 8 · Saturation ──────────────────────────────────────────────────────────

function SaturationSection({ viz, width, focused, help }: SectionProps) {
  const [drive, setDrive] = useState(0.2);
  return (
    <View style={styles.panelCard}>
      {viz ? <SatViz viz={viz} width={width} drive={drive} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="ILLUSTRATIVE — normalized tanh curve (left, vs the straight dashed ideal) · input & output waves (right)" />
      <DisplayGuideButton onPress={() => help('saturation')} />
      <DragSlider
        value={drive}
        onChange={setDrive}
        label="DRIVE"
        readout={drive < 0.3 ? 'clean — straight-line region' : drive < 0.7 ? 'warming — peaks rounding' : 'saturated — soft clipping'}
        onHelp={() => help('saturation')}
      />
      <Text style={styles.caption}>
        Push past the straight region and the curve ROUNDS the peaks instead of chopping them:
        SOFT clipping. Rounding compresses the loudest moments (tube “give”) and adds new
        harmonics related to the note — which the ear reads as warmth and grit rather than fizz.
        That gentle bend is most of what “tube sound” means.
      </Text>
    </View>
  );
}
function SatViz({ viz, width, drive, running }: { viz: TubeVizModule; width: number; drive: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.SaturationView phase={phase} width={width} drive01={drive} />;
}

// ── 9 · Tube vs transistor ──────────────────────────────────────────────────

function VersusSection({ viz, width, focused, help }: SectionProps) {
  return (
    <View style={styles.panelCard}>
      {viz ? <VersusViz viz={viz} width={width} running={focused} /> : <VizUnavailableCard />}
      <IllustrationBadge text="ILLUSTRATIVE — left: electrons crossing a vacuum · right: carriers crossing semiconductor junctions" />
      <DisplayGuideButton onPress={() => help('tube_vs_transistor')} />
      <View style={styles.vsRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.vsHead}>TUBE</Text>
          <Text style={styles.caption}>Electron cloud · vacuum flight · a GRID’s field gates the stream · hundreds of volts · glows, warms up, wears out</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.vsHead}>TRANSISTOR</Text>
          <Text style={styles.caption}>Charge carriers · semiconductor junctions · a tiny BASE current gates the flow · a few volts · instant-on, tiny, lasts</Text>
        </View>
      </View>
      <Text style={styles.caption}>
        Both are amplifiers — a small signal controlling a large one — built on completely
        different physics. Neither is “better”: the transistor won on size, cost and reliability;
        the tube survives wherever its soft overload behavior IS the sound.
      </Text>
    </View>
  );
}
function VersusViz({ viz, width, running }: { viz: TubeVizModule; width: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.TubeVsTransistorView phase={phase} width={width} />;
}

// ── 10 · Classic audio tubes ────────────────────────────────────────────────

function ClassicsSection({ viz, width, help }: SectionProps) {
  const cardW = Math.max(180, (width - 10) / 2);
  return (
    <View style={styles.panelCard}>
      <DisplayGuideButton onPress={() => help('classic_tubes')} />
      <ScrollView horizontal snapToInterval={cardW + 10} decelerationRate="fast" showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {CLASSICS.map((c) => (
            <Pressable key={c.name} style={[styles.tubeCard, { width: cardW }]} onLongPress={() => help('classic_tubes')} delayLongPress={300}>
              {viz ? <viz.TubeGlyph width={cardW - 20} kind={c.kind} /> : <VizUnavailableCard />}
              <Text style={styles.tubeName}>{c.name}</Text>
              <Text style={styles.tubeKind}>{c.kind === 'preamp' ? 'PREAMP TUBE' : 'POWER TUBE'}</Text>
              <Text style={styles.caption}>{c.role}</Text>
              <Text style={styles.caption}>{c.gear}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Text style={styles.caption}>
        Small bottles amplify VOLTAGE at the front of the chain (preamp tubes); big bottles move
        CURRENT into speakers at the end (power tubes). Eight names cover most of audio history.
      </Text>
    </View>
  );
}

// ── The sectioned shell ─────────────────────────────────────────────────────

const SECTIONS: { key: string; label: string; title: string; blurb: string; usesElectron: boolean; Comp: (p: SectionProps) => React.JSX.Element }[] = [
  { key: 'inside', label: 'INSIDE', title: 'WHAT’S INSIDE A VACUUM TUBE?', blurb: 'Glass, metal, wire, and nothing at all — tap each part to learn its job.', usesElectron: true, Comp: InsideSection },
  { key: 'flow', label: 'FLOW', title: 'ELECTRON FLOW', blurb: 'Drag the warm-up and watch heat become a cloud, and the cloud become current.', usesElectron: false, Comp: FlowSection },
  { key: 'grid', label: 'GRID', title: 'THE CONTROL GRID', blurb: 'The heart of amplification: a whisper of voltage gating a river of current.', usesElectron: true, Comp: GridSection },
  { key: 'amplify', label: 'AMPLIFY', title: 'SIGNAL AMPLIFICATION', blurb: 'Small control → large response, drawn as waveforms.', usesElectron: false, Comp: AmplifySection },
  { key: 'highv', label: 'HIGH V', title: 'WHY TUBES NEED HIGH VOLTAGE', blurb: 'Weak attraction, weak current — why tube circuits live at hundreds of volts.', usesElectron: false, Comp: HighVoltSection },
  { key: 'types', label: 'TYPES', title: 'TRIODE · TETRODE · PENTODE', blurb: 'What each added grid fixes — and the problem it introduces.', usesElectron: true, Comp: TypesSection },
  { key: 'bias', label: 'BIAS', title: 'TUBE BIAS', blurb: 'Cutoff · linear · saturation — one slider on the transfer curve.', usesElectron: false, Comp: BiasSection },
  { key: 'sat', label: 'SATURATE', title: 'TUBE SATURATION', blurb: 'The straight line that rounds — soft clipping, compression, harmonics.', usesElectron: false, Comp: SaturationSection },
  { key: 'versus', label: 'VS', title: 'TUBE vs TRANSISTOR', blurb: 'Two completely different physics doing the same job.', usesElectron: false, Comp: VersusSection },
  { key: 'classics', label: 'CLASSICS', title: 'COMMON AUDIO TUBES', blurb: 'The eight bottles behind most of recorded music.', usesElectron: false, Comp: ClassicsSection },
];

export function VacuumTubeLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focused = useIsFocused();
  const [sectionIdx, setSectionIdx] = useState(0);
  const [electron, setElectron] = useState(false);
  const [width, setWidth] = useState(0);
  const viz = useState(() => requireTubeViz())[0];

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  const s = SECTIONS[sectionIdx];
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>VACUUM TUBE FUNDAMENTALS</Text>
          <Text style={styles.subtitle}>Amplification by controlling electron flow</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.futureNote}>
          🔈 Audio demonstrations — coming in a future release. This lab teaches visually first.
        </Text>
        {!skiaAvailable ? <VizUnavailableCard /> : null}
        <View style={styles.chipRow}>
          {SECTIONS.map((sec, i) => (
            <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
          ))}
        </View>
        <Text style={styles.sectionTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.blurb}</Text>
        {s.usesElectron ? (
          <View style={styles.chipRow}>
            <LabChip label="PHYSICAL VIEW" selected={!electron} onPress={() => setElectron(false)} onLongPress={() => help('electron_view')} />
            <LabChip label="⚡ ELECTRON VIEW" selected={electron} onPress={() => setElectron(true)} onLongPress={() => help('electron_view')} />
          </View>
        ) : null}
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <s.Comp viz={viz} width={width} focused={focused} electron={electron} help={help} /> : null}
        </View>
        {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29, LabShell v2). */}
        <Pressable
          style={styles.lessonRow}
          onPress={() => help(undefined)}
          accessibilityRole="button"
          accessibilityLabel="Open the guided lesson"
        >
          <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
        </Pressable>
      </ScrollView>
      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('tube')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  readout: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, lineHeight: 18, color: colors.amber },
  readoutBad: { color: '#ff6b5e' },
  futureNote: {
    fontFamily: fonts.barlowMedium,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSub,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    padding: 10,
  },
  meterLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSecondary },
  meterTrack: { height: 9, borderRadius: 5, backgroundColor: '#1c1c22', overflow: 'hidden' },
  meterFill: { height: 9 },
  vsRow: { flexDirection: 'row', gap: 12 },
  vsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  tubeCard: { gap: 4, borderRadius: 9, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#0f0f13', padding: 10 },
  tubeName: { fontFamily: fonts.oswaldMedium, fontSize: 16, letterSpacing: 0.6, color: colors.textPrimary },
  tubeKind: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.amber },
  // Bottom guided-lesson row — mirrors LabShell v2's lessonRow styling.
  lessonRow: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
});
