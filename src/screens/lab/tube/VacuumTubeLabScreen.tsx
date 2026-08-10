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
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { requireTubeViz, skiaAvailable, type TubeVizModule } from './skiaGate';
import { TUBE_FAMILY_META, TUBE_REFS } from './tubeRefs';
import { TUBE_INK } from './tubeInks';

// ── Screen-owned data (no Skia dependency) ──────────────────────────────────

type TubePart = 'envelope' | 'heater' | 'cathode' | 'grid' | 'screen' | 'suppressor' | 'plate' | 'vacuum';

// BUILD ORDER (owner 2026-08-10): the chips march in the order a tube is
// conceptually assembled — container → heat → emitter → collector (a working
// DIODE), then each grid in the order history added them (triode → tetrode →
// pentode). The live physics readout follows the SAME order, so "what's needed
// next" is always the leftmost missing chip.
const PARTS: { key: TubePart; label: string; note: string; pentodeOnly?: boolean }[] = [
  { key: 'envelope', label: 'GLASS', note: 'Step 1 — the container. The glass envelope seals the vacuum in and the air out. Break the seal and the tube dies — oxygen would burn the hot cathode instantly.' },
  { key: 'vacuum', label: 'VACUUM', note: 'The nothing that makes it work: with no air molecules in the way, electrons fly freely from cathode to plate. No vacuum, no tube.' },
  { key: 'heater', label: 'HEATER', note: 'Step 2 — the heat. A resistance wire that glows to warm the cathode. It is the reason tubes need warm-up time (and why they glow).' },
  { key: 'cathode', label: 'CATHODE', note: 'Step 3 — the electron source: a coated sleeve around the heater that BOILS OFF electrons when hot (thermionic emission).' },
  { key: 'plate', label: 'PLATE', note: 'Step 4 — the collector. The anode box, held at high positive voltage, attracts the electron stream — with just these parts you have a working DIODE.' },
  { key: 'grid', label: 'CONTROL GRID', note: 'Step 5 — the valve (TRIODE). A sparse spiral of wire whose small negative voltage gates the whole electron stream — the heart of amplification.' },
  { key: 'screen', label: 'SCREEN GRID', note: 'Step 6 — the accelerator (TETRODE). A second, positive grid that pulls electrons along and shields the control grid from the plate — faster, more stable gain.', pentodeOnly: true },
  { key: 'suppressor', label: 'SUPPRESSOR', note: 'Step 7 — the cleanup (PENTODE). A third grid near the plate that pushes secondary electrons (knocked off the plate) back where they belong.', pentodeOnly: true },
];

const FLOW_STAGES: { until: number; text: string }[] = [
  { until: 0.15, text: '1 · Cold: nothing moves. A tube does nothing until the heater warms up.' },
  { until: 0.35, text: '2 · The heater glows, warming the cathode sleeve around it.' },
  { until: 0.6, text: '3 · The hot cathode boils off electrons — an invisible cloud (space charge) forms around it.' },
  { until: 0.85, text: '4 · The positive plate attracts the cloud — electrons begin streaming across the vacuum.' },
  { until: 1.01, text: '5 · Steady current flows, cathode → plate. The tube is alive and ready to amplify.' },
];

// The old 8-tube "Classics" teaser was RETIRED 2026-08-09 — replaced by the
// full 30-card Tube Reference library (see ReferenceSection + tubeRefs.ts).

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

const ALL_PART_KEYS: TubePart[] = PARTS.map((p) => p.key);

function InsideSection({ viz, width, focused, electron, help }: SectionProps) {
  // Show/hide toggles (owner 2026-08-10): every chip switches its part's view
  // in the drawing; HIDE ALL leaves only the glass. The last-tapped part still
  // glows (when visible) and drives the explainer note.
  const [visible, setVisible] = useState<TubePart[]>(ALL_PART_KEYS);
  const [lastTouched, setLastTouched] = useState<TubePart | null>(null);
  const allOn = visible.length === ALL_PART_KEYS.length;
  const sel = PARTS.find((p) => p.key === lastTouched) ?? null;
  const togglePart = (key: TubePart) => {
    setVisible((v) => {
      const has = v.includes(key);
      let next = has ? v.filter((x) => x !== key) : [...v, key];
      // PHYSICAL COUPLING (owner 2026-08-10): states must stay possible.
      //  · Remove the GLASS → the seal is broken, so the VACUUM goes with it.
      //  · Re-adding the GLASS alone does NOT restore the vacuum — the bottle
      //    is back but still full of air until you pump it down (tap VACUUM).
      //  · Adding the VACUUM needs a bottle to hold it → brings GLASS along.
      if (key === 'envelope' && has) next = next.filter((x) => x !== 'vacuum');
      if (key === 'vacuum' && !has && !next.includes('envelope')) next = [...next, 'envelope'];
      return next;
    });
    setLastTouched(key);
  };
  const toggleAll = () => {
    // HIDE ALL = glass only (owner 2026-08-10); SHOW ALL restores everything.
    setVisible(allOn ? ['envelope'] : ALL_PART_KEYS);
    setLastTouched(null);
  };
  const highlight = lastTouched && visible.includes(lastTouched) ? lastTouched : null;
  // LIVE PHYSICS READOUT (owner 2026-08-10): hiding a part changes what the
  // electrons DO in the drawing — this line names the consequence of the FIRST
  // missing part in BUILD ORDER (= the leftmost dim chip), so the suggested
  // next step always matches the button row, left to right.
  const PHYSICS: Partial<Record<TubePart, string>> = {
    envelope: 'NO GLASS — the seal is broken and air floods in (gray dots), taking the VACUUM with it. Nothing can cross air: any emitted electron scatters on contact.',
    vacuum: 'NO VACUUM — the bottle is sealed but still full of air (gray dots). Air blocks the path: any emitted electron scatters on contact. Pump the air out.',
    heater: 'NO HEATER — no heat, and nothing can boil electrons out of the cathode. No emission, no current.',
    cathode: 'NO CATHODE — the heater glows, but there is no coated emitter surface to boil electrons from. No emission.',
    plate: 'NO PLATE — nothing pulls the electrons across. They drift out, stall, and fall back into a space-charge cloud.',
    grid: 'NO CONTROL GRID — the flow runs WIDE OPEN. Full current, but nothing can meter it into a signal.',
    screen: 'NO SCREEN GRID — the electrons crawl the whole way across. The screen grid’s + charge is the accelerator.',
    suppressor: 'NO SUPPRESSOR — electrons strike the plate hard enough to knock SECONDARY ELECTRONS loose (shown in red). They escape backward toward the screen grid, robbing plate current.',
  };
  const firstMissing = PARTS.find((p) => !visible.includes(p.key) && PHYSICS[p.key]);
  const physics = firstMissing
    ? `${PHYSICS[firstMissing.key]}  ▸ Tap ${firstMissing.label} to add it back.`
    : null;
  return (
    <View style={styles.panelCard}>
      {viz ? <CutawayViz viz={viz} width={width} kind="pentode" highlight={highlight} electron={electron} running={focused} visible={visible} /> : <VizUnavailableCard />}
      <IllustrationBadge />
      <DisplayGuideButton onPress={() => help('cutaway')} />
      {/* Part chips carry the reference-card INK CODE (owner 2026-08-10): each
          chip is the same color as its element in the drawing AND on the Tube
          Reference cards — the chip row doubles as the color key. Lit chip =
          part shown; dim chip = part hidden. */}
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.partChip, styles.allChip]}
          onPress={toggleAll}
          accessibilityRole="button"
          accessibilityLabel={allOn ? 'Hide all parts — show only the glass' : 'Show all parts'}
        >
          <Text style={[styles.partChipText, styles.allChipText]}>{allOn ? 'HIDE ALL' : 'SHOW ALL'}</Text>
        </Pressable>
        {PARTS.map((p) => {
          const ink = TUBE_INK[p.key];
          const on = visible.includes(p.key);
          return (
            <Pressable
              key={p.key}
              style={[styles.partChip, { borderColor: on ? ink : `${ink}40` }, on && { backgroundColor: `${ink}1f` }]}
              onPress={() => togglePart(p.key)}
              onLongPress={() => help('cutaway')}
              delayLongPress={350}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${p.label} — ${on ? 'shown, tap to hide' : 'hidden, tap to show'}`}
            >
              <Text style={[styles.partChipText, { color: ink }, !on && { opacity: 0.38 }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {physics ? <Text style={styles.readout}>{physics}</Text> : null}
      <Text style={styles.caption}>
        {sel
          ? `${sel.note}${visible.includes(sel.key) ? '' : '  (Hidden — tap its chip again to bring it back.)'}`
          : 'Tap a part to REMOVE it and watch what the electrons do without it — every piece is there for a reason, and the drawing shows you why. Each part wears the SAME color it has on the Tube Reference cards. (Drawn as a pentode — the fullest version.)'}
      </Text>
    </View>
  );
}
function CutawayViz({ viz, width, kind, highlight, electron, running, secondary, visible }: { viz: TubeVizModule; width: number; kind: 'triode' | 'tetrode' | 'pentode'; highlight: TubePart | null; electron: boolean; running: boolean; secondary?: boolean; visible?: TubePart[] }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.TubeCutawayView phase={phase} width={width} kind={kind} highlight={highlight} electronView={electron} showSecondary={secondary} visible={visible} />;
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

// ── 10 · The Tube Reference library ─────────────────────────────────────────
// Replaces the retired 8-tube Classics teaser (owner 2026-08-09): 30 owner-
// produced full-screen spec cards, browsable + searchable, Academy-gated.

function ReferenceSection(_p: SectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.panelCard}>
      {TUBE_FAMILY_META.map((fam) => {
        const items = TUBE_REFS.filter((r) => r.family === fam.key);
        return (
          <View key={fam.key} style={{ gap: 2 }}>
            <Text style={styles.refFam}>
              {fam.title} <Text style={styles.refCount}>· {items.length}</Text>
            </Text>
            <Text style={styles.caption}>{items.map((r) => r.short).join(' · ')}</Text>
          </View>
        );
      })}
      <Pressable
        style={styles.refBtn}
        onPress={() => navigation.navigate('TubeReference')}
        accessibilityRole="button"
        accessibilityLabel="Open the tube reference library"
      >
        <Text style={styles.refBtnText}>OPEN THE TUBE REFERENCE ›</Text>
      </Pressable>
      <Text style={styles.caption}>
        Every card is a full-screen reference: internal structure, pin layout and functions, key
        ratings, safe substitutions, and what to watch for. Academy membership unlocks all thirty.
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
  { key: 'classics', label: 'REFERENCE', title: 'THE TUBE REFERENCE LIBRARY', blurb: 'Thirty full-screen spec cards — structure, pins, ratings, substitutions.', usesElectron: false, Comp: ReferenceSection },
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
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>VACUUM TUBE FUNDAMENTALS</Text>
          <Text style={styles.subtitle}>Amplification by controlling electron flow</Text>
        </View>
        <AccuracyNote compact />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.futureNote}>
          🔈 This lab teaches visually — no audio playback.
        </Text>
        {!skiaAvailable ? <VizUnavailableCard /> : null}
        <View style={styles.chipRow}>
          {SECTIONS.map((sec, i) => {
            const on = sectionIdx === i;
            // REFERENCE tab is GREEN (owner 2026-08-10) to flag the tube library
            // apart from the amber concept sections; the rest stay LabChip amber.
            if (sec.key === 'classics') {
              return (
                <Pressable
                  key={sec.key}
                  style={[styles.refChip, on && styles.refChipOn]}
                  onPress={() => setSectionIdx(i)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${sec.label} — tube reference library`}
                >
                  <Text style={[styles.refChipText, on && styles.refChipTextOn]}>{sec.label}</Text>
                </Pressable>
              );
            }
            return <LabChip key={sec.key} label={sec.label} selected={on} onPress={() => setSectionIdx(i)} />;
          })}
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
  // Tube Reference entry (replaces the retired Classics tube-card styles).
  refFam: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber },
  refCount: { color: colors.textSub, letterSpacing: 0.4 },
  refBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c2012',
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  refBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: '#ffffff' },
  // Ink-coded part chips (owner 2026-08-10) — reference-card color language.
  partChip: {
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  partChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8 },
  allChip: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0c2012' },
  allChipText: { color: colors.green },
  // Green REFERENCE section tab (owner 2026-08-10).
  refChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.55)',
    backgroundColor: '#0c1a10',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refChipOn: { borderColor: colors.green, backgroundColor: '#0e2414' },
  // Owner 2026-08-10: REFERENCE chip has WHITE text, only the FRAME green.
  refChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: '#ffffff' },
  refChipTextOn: { color: '#ffffff' },
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
