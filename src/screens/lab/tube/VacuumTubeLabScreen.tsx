/**
 * VacuumTubeLabScreen — "Vacuum Tube Fundamentals" (owner 2026-07-29).
 * Single mission: HOW A TUBE AMPLIFIES BY CONTROLLING ELECTRON FLOW.
 *
 * RACK UNIT CONVERSION (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved):
 * each concept section is one RackUnit — the animated drawing PINS on the
 * stage glass (reading may scroll; operating may not), the old MeterBars
 * become live bezel cells, and the DragSliders ride the dock lane. The
 * section chips stay PINNED under the header as a horizontal course-nav row
 * (they are navigation, not a parameter); the ELECTRON VIEW toggle is a dock
 * key on the sections that use it; the Tube Reference library is a dock
 * ACTION key (it navigates — it never pretended to be a stage section again).
 * Per-section RackUnits are key-remounted so each section owns its state.
 *
 * VISUAL-FIRST LAUNCH: an interactive-animation lab — no audio playback;
 * stated on-screen. Every drawing is an ILLUSTRATIVE MODEL (schematic
 * cross-sections, a normalized tanh transfer curve) — never measured tube
 * data (§1.7), and each stage badges that on its faceplate strip.
 *
 * THE STAR (owner spec): the global ELECTRON VIEW toggle — Physical view
 * (glass, electrodes, filament glow) vs Electron view (blue cloud, flow
 * lines, the grid's field) — one switch connecting the outside of the tube
 * to what happens inside it.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { CheckQuestion, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { RackUnit } from '../rack/RackUnit';
import type { DockParam } from '../rack/rackTypes';
import { requireTubeViz, type TubeVizModule } from './skiaGate';
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

const FLOW_STAGES: { until: number; text: string }[] = [
  { until: 0.15, text: '1 · Cold: nothing moves. A tube does nothing until the heater warms up.' },
  { until: 0.35, text: '2 · The heater glows, warming the cathode sleeve around it.' },
  // Stage 4 fires at the SAME heat the meter/viz start conducting (fix
  // 2026-08-31: the caption said "electrons begin streaming" while PLATE I
  // read 0% and the drawn cloud stood still).
  { until: 0.7, text: '3 · The hot cathode boils off electrons — an invisible cloud (space charge) forms around it.' },
  { until: 0.85, text: '4 · The positive plate attracts the cloud — electrons begin streaming across the vacuum.' },
  { until: 1.01, text: '5 · Steady current flows, cathode → plate. The tube is alive and ready to amplify.' },
];

// The old 8-tube "Classics" teaser was RETIRED 2026-08-09 — replaced by the
// full 40-card Tube Reference library, now the dock's green-key ACTION
// (rack conversion 2026-08-23: it navigates; it is not a stage section).

// ── Shared bits ─────────────────────────────────────────────────────────────

const DIM = '#7a7f8a';

type SectionProps = {
  viz: TubeVizModule | null;
  focused: boolean;
  electron: boolean;
  onToggleElectron: () => void;
  help: (k?: string) => void;
  openReference: () => void;
  title: string;
  blurb: string;
};

/** The shared dock tail: ⚡ ELECTRON VIEW toggle (sections that use it) + the
 *  Tube Reference ACTION key (navigation — never a stage section). */
function tailParams(p: SectionProps, usesElectron: boolean): DockParam[] {
  const out: DockParam[] = [];
  if (usesElectron) {
    out.push({
      kind: 'toggle',
      id: 'eview',
      label: '⚡ E-VIEW',
      value: p.electron,
      onToggle: p.onToggleElectron,
      helpKey: 'electron_view',
    });
  }
  out.push({ kind: 'action', id: 'tuberef', label: 'TUBE REF ›', onPress: p.openReference });
  return out;
}

/** Stage renderer with the honest no-Skia fallback centered in the glass. */
function stageGlass(
  viz: TubeVizModule | null,
  draw: (viz: TubeVizModule, w: number, h: number) => ReactNode,
): (w: number, h: number) => ReactNode {
  return (w, h) =>
    viz ? (
      draw(viz, w, h)
    ) : (
      <View style={{ width: w, height: h, justifyContent: 'center', padding: 14 }}>
        <VizUnavailableCard />
      </View>
    );
}

/** Common well tail: title + blurb up top, guided-lesson entry + the no-audio
 *  notice at the bottom (owner 2026-08-19: notices at the bottom). */
function SectionWell({ title, blurb, help, children }: { title: string; blurb: string; help: (k?: string) => void; children?: ReactNode }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{blurb}</Text>
      {children}
      {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29, LabShell v2). */}
      <Pressable
        style={styles.lessonRow}
        onPress={() => help(undefined)}
        accessibilityRole="button"
        accessibilityLabel="Open the guided lesson"
      >
        <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
      </Pressable>
      <Text style={styles.futureNote}>🔈 This lab teaches visually — no audio playback.</Text>
    </>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

// ── 1 · What's inside ───────────────────────────────────────────────────────

const ALL_PART_KEYS: TubePart[] = PARTS.map((p) => p.key);

function InsideSection(p: SectionProps) {
  // Show/hide toggles (owner 2026-08-10): every chip switches its part's view
  // in the drawing; HIDE ALL leaves only the glass. The last-tapped part still
  // glows (when visible) and drives the explainer note.
  const [visible, setVisible] = useState<TubePart[]>(ALL_PART_KEYS);
  const [lastTouched, setLastTouched] = useState<TubePart | null>(null);
  const allOn = visible.length === ALL_PART_KEYS.length;
  const sel = PARTS.find((part) => part.key === lastTouched) ?? null;
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
  const firstMissing = PARTS.find((part) => !visible.includes(part.key) && PHYSICS[part.key]);
  const physics = firstMissing
    ? `${PHYSICS[firstMissing.key]}  ▸ Tap ${firstMissing.label} to add it back.`
    : null;

  // Bezel physics state — mirrors the drawing's own rules (viz.tsx): emission
  // needs heater+cathode; air kills transit; no plate = no pull; G1 meters it.
  const emitting = visible.includes('heater') && visible.includes('cathode');
  const airInside = !visible.includes('envelope') || !visible.includes('vacuum');
  const flowing = emitting && !airInside && visible.includes('plate');
  const current = !flowing ? 'NONE' : visible.includes('grid') ? 'METERED' : 'WIDE OPEN';

  const params: DockParam[] = [
    {
      kind: 'group',
      id: 'parts',
      label: 'PARTS',
      valueLabel: `${visible.length}/${ALL_PART_KEYS.length}`,
      helpKey: 'cutaway',
      // Part chips carry the reference-card INK CODE (owner 2026-08-10): each
      // chip is the same color as its element in the drawing AND on the Tube
      // Reference cards — the chip row doubles as the color key. Lit chip =
      // part shown; dim chip = part hidden. Group tray = always sticky: toggle
      // parts while the glass reacts (the lesson).
      render: () => (
        <View style={{ gap: 10 }}>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.partChip, styles.allChip]}
              onPress={toggleAll}
              accessibilityRole="button"
              accessibilityLabel={allOn ? 'Hide all parts — show only the glass' : 'Show all parts'}
            >
              <Text style={[styles.partChipText, styles.allChipText]}>{allOn ? 'HIDE ALL' : 'SHOW ALL'}</Text>
            </Pressable>
            {PARTS.map((part) => {
              const ink = TUBE_INK[part.key];
              const on = visible.includes(part.key);
              return (
                <Pressable
                  key={part.key}
                  style={[styles.partChip, { borderColor: on ? ink : `${ink}40` }, on && { backgroundColor: `${ink}1f` }]}
                  onPress={() => togglePart(part.key)}
                  onLongPress={() => p.help('cutaway')}
                  delayLongPress={350}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${part.label} — ${on ? 'shown, tap to hide' : 'hidden, tap to show'}`}
                >
                  <Text style={[styles.partChipText, { color: ink }, !on && { opacity: 0.38 }]}>{part.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {physics ? <Text style={styles.readout}>{physics}</Text> : null}
        </View>
      ),
    },
    ...tailParams(p, true),
  ];

  return (
    <RackUnit
      initialParam="parts"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'ILLUSTRATIVE MODEL — SCHEMATIC CROSS-SECTION, NOT MEASURED TUBE DATA',
        onGuide: () => p.help('cutaway'),
        bezel: [
          { k: 'PARTS', v: `${visible.length}/${ALL_PART_KEYS.length}`, helpKey: 'cutaway' },
          { k: 'EMISSION', v: emitting ? 'ON' : 'OFF', tint: emitting ? undefined : DIM, helpKey: 'cutaway' },
          { k: 'CURRENT', v: current, tint: flowing ? '#5bff85' : DIM, flex: 1.3, helpKey: 'cutaway' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => (
          <CutawayViz viz={viz} width={w} height={h} kind="pentode" highlight={highlight} electron={p.electron} running={p.focused} visible={visible} />
        )),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        {physics ? <Text style={styles.readout}>{physics}</Text> : null}
        <Text style={styles.caption}>
          {sel
            ? `${sel.note}${visible.includes(sel.key) ? '' : '  (Hidden — tap its chip again to bring it back.)'}`
            : 'Open PARTS and tap a part to REMOVE it — then watch what the electrons do without it: every piece is there for a reason, and the drawing shows you why. Each part wears the SAME color it has on the Tube Reference cards. (Drawn as a pentode — the fullest version.)'}
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function CutawayViz({ viz, width, height, kind, highlight, electron, running, secondary, visible }: { viz: TubeVizModule; width: number; height: number; kind: 'triode' | 'tetrode' | 'pentode'; highlight: TubePart | null; electron: boolean; running: boolean; secondary?: boolean; visible?: TubePart[] }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.TubeCutawayView phase={phase} width={width} height={height} kind={kind} highlight={highlight} electronView={electron} showSecondary={secondary} visible={visible} />;
}

// ── 2 · Electron flow (warm-up) ─────────────────────────────────────────────

function FlowSection(p: SectionProps) {
  const [heat, setHeat] = useState(0);
  const stage = FLOW_STAGES.find((s) => heat < s.until) ?? FLOW_STAGES[4];
  const stageNum = FLOW_STAGES.indexOf(stage) + 1;
  const current = heat > 0.7 ? (heat - 0.7) / 0.3 : 0;
  const heatWord = (v: number) => (v < 0.15 ? 'cold' : v < 0.7 ? 'warming…' : 'conducting');

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'warmup',
      label: 'WARM-UP',
      value: heat,
      onChange: setHeat,
      format: (v) => `${pct(v)} · ${heatWord(v)}`,
      formatShort: (v) => pct(v),
      helpKey: 'warm_up',
    },
    ...tailParams(p, false),
  ];

  return (
    <RackUnit
      initialParam="warmup"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'CONCEPTUAL — the warm-up sequence, slowed and drawn; real electrons are invisible and countless',
        onGuide: () => p.help('warm_up'),
        bezel: [
          { k: 'HEAT', v: pct(heat), helpKey: 'warm_up' },
          { k: 'STAGE', v: `${stageNum}/5`, helpKey: 'warm_up' },
          { k: 'PLATE I', v: pct(current), tint: current > 0 ? '#5bff85' : DIM, helpKey: 'warm_up' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <FlowViz viz={viz} width={w} height={h} heat={heat} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={styles.readout}>{stage.text}</Text>
        <Text style={styles.caption}>
          This is why the vacuum matters: electrons can only fly freely because there is NOTHING in
          the way. And it is why tube gear needs warm-up — no heat, no electrons, no sound.
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function FlowViz({ viz, width, height, heat, running }: { viz: TubeVizModule; width: number; height: number; heat: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.ElectronFlowView phase={phase} width={width} height={height} heat01={heat} />;
}

// ── 3 · The control grid ────────────────────────────────────────────────────

const GRID_CHECK: CheckSpec = {
  question: 'The control grid sits between cathode and plate. How does it control the LARGE plate current?',
  options: [
    'It physically blocks electrons like a shutter',
    'Its small negative voltage repels the stream back',
    'It heats up and emits extra electrons',
  ],
  correctIdx: 1,
  reveal:
    'The grid is a sparse spiral — most electrons could fly right through the gaps. What stops them is its FIELD: a small negative voltage repels the (negative) electrons back toward the cathode. Nudge that voltage slightly and the entire stream swells or starves — a tiny voltage controlling a large current IS amplification.',
  wrongHint: 'Ride the GRID V lane and watch — do the grid wires move, or does something invisible change?',
};

function GridSection(p: SectionProps) {
  const [v, setV] = useState(0.5);
  const word = (x: number) => (x < 0.15 ? 'very negative — cutoff' : x > 0.85 ? 'barely negative — full flow' : 'partly negative');

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'gridv',
      label: 'GRID V',
      value: v,
      onChange: setV,
      format: (x) => word(x),
      formatShort: (x) => pct(x),
      helpKey: 'grid_voltage',
    },
    ...tailParams(p, true),
  ];

  return (
    <RackUnit
      initialParam="gridv"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: "CONCEPTUAL — electron view adds the grid's repelling field lines; conduction is illustrative",
        onGuide: () => p.help('grid_voltage'),
        bezel: [
          { k: 'GRID', v: v < 0.15 ? 'CUTOFF' : v > 0.85 ? 'FULL FLOW' : 'PARTIAL', flex: 1.2, helpKey: 'grid_voltage' },
          { k: 'PLATE I', v: pct(v), tint: v > 0.9 ? '#ffd76b' : '#5bff85', helpKey: 'grid_voltage' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => (
          <GridViz viz={viz} width={w} height={h} cond={v} electron={p.electron} running={p.focused} />
        )),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={styles.caption}>
          A very small voltage change at the grid controls a much larger current through the tube.
          That sentence is the entire reason vacuum tubes changed the world — read it again while
          riding the lane.
        </Text>
        <CheckQuestion spec={GRID_CHECK} />
      </SectionWell>
    </RackUnit>
  );
}
function GridViz({ viz, width, height, cond, electron, running }: { viz: TubeVizModule; width: number; height: number; cond: number; electron: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.GridControlView phase={phase} width={width} height={height} cond={cond} electronView={electron} />;
}

// ── 4 · Amplification ───────────────────────────────────────────────────────

function AmplifySection(p: SectionProps) {
  return (
    <RackUnit
      initialParam="none"
      params={tailParams(p, false)}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'ILLUSTRATIVE — gain drawn ~×7; the output is INVERTED (that sign-flip is real tube behavior)',
        onGuide: () => p.help('amplification'),
        bezel: [
          { k: 'GAIN', v: '~×7', helpKey: 'amplification' },
          { k: 'IN', v: 'GRID', tint: TUBE_INK.grid, helpKey: 'amplification' },
          { k: 'OUT', v: 'PLATE', tint: TUBE_INK.plate, helpKey: 'amplification' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <AmplifyViz viz={viz} width={w} height={h} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={styles.caption}>
          Follow the color code: the small BLUE wave rides the blue wire INTO THE GRID — watch the
          grid dots swell in time with it. Inside the glass, the much larger electron stream
          (cathode → plate) breathes with that same rhythm: grid swings up, the stream floods; grid
          swings down, it chokes. The AMBER wire carries the result out of the PLATE.
        </Text>
        <Text style={styles.caption}>
          That plate current, pulled through a resistor, becomes a LARGE copy of the input — flipped
          upside-down, because MORE grid signal means MORE current means the plate voltage DROPS.
          Every tube mic preamp, guitar amp, compressor and broadcast console ever made is this one
          picture, repeated.
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function AmplifyViz({ viz, width, height, running }: { viz: TubeVizModule; width: number; height: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.AmplifyView phase={phase} width={width} height={height} />;
}

// ── 5 · Why high voltage ────────────────────────────────────────────────────

function HighVoltSection(p: SectionProps) {
  const [highB, setHighB] = useState(false);

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'supply',
      label: 'SUPPLY',
      valueLabel: highB ? 'B+' : 'SMALL',
      options: [
        { id: 'small', label: 'SMALL SUPPLY', blurb: 'A modest plate voltage: the field is weak, few electrons make the crossing — a starved, dim tube.' },
        { id: 'high', label: 'HIGH-VOLTAGE SUPPLY (B+)', blurb: 'The real thing — hundreds of volts on the plate. A strong field sweeps the electron cloud across: full current, full gain.' },
      ],
      selectedId: highB ? 'high' : 'small',
      onSelect: (id) => setHighB(id === 'high'),
      sticky: true, // A/B the attraction while the glass reacts — the lesson
      helpKey: 'high_voltage',
    },
    ...tailParams(p, false),
  ];

  return (
    <RackUnit
      initialParam="supply"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'CONCEPTUAL — attraction strength drawn as arrow length and electron count',
        onGuide: () => p.help('high_voltage'),
        bezel: [
          { k: 'SUPPLY', v: highB ? 'B+ HIGH' : 'SMALL', helpKey: 'high_voltage' },
          { k: 'PULL', v: highB ? 'STRONG' : 'WEAK', tint: highB ? '#5bff85' : DIM, helpKey: 'high_voltage' },
          { k: 'STREAM', v: highB ? 'DENSE' : 'SPARSE', tint: highB ? '#5bff85' : DIM, helpKey: 'high_voltage' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <HvViz viz={viz} width={w} height={h} highB={highB} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={styles.caption}>
          {highB
            ? 'A high-voltage plate pulls HARD: a dense, fast electron stream with room to swing. This is why tube circuits run at hundreds of volts — the “B+” supply.'
            : 'A small supply barely attracts the cloud: few electrons cross, weakly. Not enough current — and no headroom to swing a big signal.'}
        </Text>
        <Text style={styles.caption}>
          (It is also why tube gear deserves respect when the cover comes off — those voltages
          remain stored in capacitors after power-down.)
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function HvViz({ viz, width, height, highB, running }: { viz: TubeVizModule; width: number; height: number; highB: boolean; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.HighVoltageView phase={phase} width={width} height={height} highB={highB} />;
}

// ── 6 · Tube types ──────────────────────────────────────────────────────────

// Each type's NEWEST element GLOWS in its card ink in the drawing (owner
// 2026-08-10: visual differentiation) and the text is structured so the three
// stack as a story: grids · what the new grid adds · the cost · the fix.
const TYPES: {
  kind: 'triode' | 'tetrode' | 'pentode';
  label: string;
  grids: string;
  newPart: TubePart;
  newShort: string;
  adds: string;
  strength: string;
  weakness: string;
}[] = [
  {
    kind: 'triode',
    label: 'TRIODE',
    grids: '1 GRID',
    newPart: 'grid',
    newShort: 'G1 CONTROL',
    adds: 'THE CONTROL GRID (blue, glowing) — the valve itself. Three elements total: cathode, grid, plate.',
    strength: 'Simple, warm, linear — the classic preamp element (both halves of a 12AX7 are triodes).',
    weakness: 'The plate’s field reaches back through that single grid, limiting gain and speed.',
  },
  {
    kind: 'tetrode',
    label: 'TETRODE',
    grids: '2 GRIDS',
    newPart: 'screen',
    newShort: 'G2 SCREEN',
    adds: 'THE SCREEN GRID (purple, glowing) — a second, POSITIVE grid between control grid and plate.',
    strength: 'It shields the control grid from the plate and accelerates the stream — much higher gain and speed.',
    weakness: 'New problem, drawn in red: electrons hit the plate hard enough to knock SECONDARY electrons loose, and the positive screen steals them — current lost.',
  },
  {
    kind: 'pentode',
    label: 'PENTODE',
    grids: '3 GRIDS',
    newPart: 'suppressor',
    newShort: 'G3 SUPPR',
    adds: 'THE SUPPRESSOR GRID (gold, glowing) — a third grid right beside the plate.',
    strength: 'It turns the secondary electrons around (watch the red dots die at it now). High gain, high power, well-behaved — the classic output tube (EL34, EL84).',
    weakness: 'Cost and complexity — five elements in the bottle. For clean low-level warmth, the simple triode still rules the preamp.',
  },
];

function TypesSection(p: SectionProps) {
  const [idx, setIdx] = useState(0);
  const t = TYPES[idx];
  const ink = TUBE_INK[t.newPart];

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'type',
      label: 'TYPE',
      valueLabel: t.label,
      // Each type's `strength` line doubles as the tray blurb — what this many
      // grids buys you, readable while the cutaway rebuilds.
      options: TYPES.map((ty) => ({ id: ty.kind, label: `${ty.label} · ${ty.grids}`, blurb: ty.strength })),
      selectedId: t.kind,
      onSelect: (id) => {
        const i = TYPES.findIndex((ty) => ty.kind === id);
        if (i >= 0) setIdx(i);
      },
      sticky: true, // step triode → tetrode → pentode while the glass reacts
      helpKey: 'tube_types',
    },
    ...tailParams(p, true),
  ];

  return (
    <RackUnit
      initialParam="type"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: "ILLUSTRATIVE — the newest grid GLOWS in its ink · red dots = secondary emission (the tetrode's problem, the pentode's fix)",
        onGuide: () => p.help('tube_types'),
        bezel: [
          { k: 'TYPE', v: t.label, helpKey: 'tube_types' },
          { k: 'GRIDS', v: t.grids, helpKey: 'tube_types' },
          { k: 'NEW', v: t.newShort, tint: ink, flex: 1.3, helpKey: 'tube_types' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => (
          <CutawayViz viz={viz} width={w} height={h} kind={t.kind} highlight={t.newPart} electron={p.electron} running={p.focused} secondary={idx > 0} />
        )),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={[styles.readout, { color: ink }]}>ADDS: {t.adds}</Text>
        <Text style={styles.caption}>{t.strength}</Text>
        <Text style={styles.caption}>{t.weakness}</Text>
      </SectionWell>
    </RackUnit>
  );
}

// ── 7 · Bias ────────────────────────────────────────────────────────────────

const BIAS_CHECK: CheckSpec = {
  question: 'A tube biased FAR too negative sits in cutoff. What does the output do?',
  options: [
    'It distorts with a bright, fizzy edge',
    'Little or nothing — the stream is already shut off',
    'It gets louder, because the tube works harder',
  ],
  correctIdx: 1,
  reveal:
    'Bias sets WHERE on the transfer curve the tube idles. Too negative and the stream is already cut off — the input wiggles a closed valve (the output flatlines, or only half the wave sneaks through). Correct bias parks the idle point mid-curve so the whole swing stays on the straight part. Too positive and it slams into saturation instead.',
  wrongHint: 'Ride the BIAS lane to the far left and watch the output wave on the right of the display.',
};

function BiasSection(p: SectionProps) {
  const [b, setB] = useState(0.5);
  const bad = b < 0.22 || b > 0.8;
  const zone = b < 0.22 ? 'TOO NEGATIVE — CUTOFF: the bottom of the swing flatlines' : b > 0.8 ? 'TOO POSITIVE — SATURATION: the top of the swing flattens' : 'CORRECT BIAS — the swing rides the straight part of the curve';

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'bias',
      label: 'BIAS',
      value: b,
      onChange: setB,
      format: (x) => (x < 0.22 ? 'too negative' : x > 0.8 ? 'too positive' : 'correct'),
      formatShort: (x) => pct(x),
      tint: bad ? '#ff6b5e' : undefined,
      helpKey: 'bias',
    },
    ...tailParams(p, false),
  ];

  return (
    <RackUnit
      initialParam="bias"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'ILLUSTRATIVE TRANSFER CURVE (normalized) — left: the operating point riding the curve · right: the resulting output',
        onGuide: () => p.help('bias'),
        bezel: [
          { k: 'BIAS', v: pct(b), helpKey: 'bias' },
          { k: 'ZONE', v: b < 0.22 ? 'CUTOFF' : b > 0.8 ? 'SATURATION' : 'LINEAR', tint: bad ? '#ff6b5e' : '#5bff85', flex: 1.3, helpKey: 'bias' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <BiasViz viz={viz} width={w} height={h} bias={b} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={[styles.readout, bad ? styles.readoutBad : null]}>{zone}</Text>
        <Text style={styles.caption}>
          Bias is the idle point — where the tube rests with no signal. Set it mid-curve and the
          whole wave amplifies cleanly; mis-set it and one side of the wave dies first. (This is
          what “biasing your amp” after a tube change is about.)
        </Text>
        <CheckQuestion spec={BIAS_CHECK} />
      </SectionWell>
    </RackUnit>
  );
}
function BiasViz({ viz, width, height, bias, running }: { viz: TubeVizModule; width: number; height: number; bias: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.5);
  return <viz.BiasView phase={phase} width={width} height={height} bias01={bias} />;
}

// ── 8 · Saturation ──────────────────────────────────────────────────────────

function SaturationSection(p: SectionProps) {
  const [drive, setDrive] = useState(0.2);
  const state = drive < 0.3 ? 'CLEAN' : drive < 0.7 ? 'WARMING' : 'SATURATED';

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'drive',
      label: 'DRIVE',
      value: drive,
      onChange: setDrive,
      format: (x) => (x < 0.3 ? 'clean — straight-line region' : x < 0.7 ? 'warming — peaks rounding' : 'saturated — soft clipping'),
      formatShort: (x) => pct(x),
      helpKey: 'saturation',
    },
    ...tailParams(p, false),
  ];

  return (
    <RackUnit
      initialParam="drive"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'ILLUSTRATIVE — normalized tanh curve (left, vs the straight dashed ideal) · input & output waves (right)',
        onGuide: () => p.help('saturation'),
        bezel: [
          { k: 'DRIVE', v: pct(drive), helpKey: 'saturation' },
          { k: 'STATE', v: state, tint: drive < 0.3 ? '#5bff85' : drive < 0.7 ? undefined : '#ffd76b', flex: 1.2, helpKey: 'saturation' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <SatViz viz={viz} width={w} height={h} drive={drive} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <Text style={styles.caption}>
          WHY it rounds: the valve can only open so far. Near full swing there are no more electrons
          to give (and at the other extreme the stream pinches off), so each extra dB of input buys
          less and less output — the straight line bends over. Watch the left plot: at low DRIVE the
          wave rides the straight middle of the curve; push harder and the peaks reach into the bend.
        </Text>
        <Text style={styles.caption}>
          WHY it sounds good: rounding COMPRESSES the loudest moments (the “give” engineers love)
          and adds harmonics related to the note — the ear reads warmth and grit. A circuit that
          hits a hard wall instead shears the peaks off flat, adding harsh, fizzy harmonics. Same
          overload, opposite character — that difference is the sound of tube gear.
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function SatViz({ viz, width, height, drive, running }: { viz: TubeVizModule; width: number; height: number; drive: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.55);
  return <viz.SaturationView phase={phase} width={width} height={height} drive01={drive} />;
}

// ── 9 · Tube vs transistor ──────────────────────────────────────────────────

function VersusSection(p: SectionProps) {
  return (
    <RackUnit
      initialParam="none"
      params={tailParams(p, false)}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'ILLUSTRATIVE — left: electrons crossing a vacuum · right: carriers crossing semiconductor junctions',
        onGuide: () => p.help('tube_vs_transistor'),
        bezel: [
          { k: 'TUBE', v: 'VACUUM', tint: TUBE_INK.plate, helpKey: 'tube_vs_transistor' },
          { k: 'TRANSISTOR', v: 'JUNCTION', tint: TUBE_INK.grid, flex: 1.2, helpKey: 'tube_vs_transistor' },
        ],
        render: stageGlass(p.viz, (viz, w, h) => <VersusViz viz={viz} width={w} height={h} running={p.focused} />),
      }}
    >
      <SectionWell title={p.title} blurb={p.blurb} help={p.help}>
        <View style={styles.vsRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.vsHead}>TUBE</Text>
            <Text style={styles.caption}>Electron cloud · vacuum flight · a GRID’s field gates the stream · hundreds of volts · glows, warms up, wears out</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.vsHead}>TRANSISTOR</Text>
            <Text style={styles.caption}>Charge carriers · semiconductor junctions · a tiny BASE current (the blue pulses climbing the middle leg) gates the flow at the thin blue base layer · a few volts · instant-on, tiny, lasts</Text>
          </View>
        </View>
        <Text style={styles.caption}>
          Both are amplifiers — a small signal controlling a large one — built on completely
          different physics. Neither is “better”: the transistor won on size, cost and reliability;
          the tube survives wherever its soft overload behavior IS the sound.
        </Text>
      </SectionWell>
    </RackUnit>
  );
}
function VersusViz({ viz, width, height, running }: { viz: TubeVizModule; width: number; height: number; running: boolean }) {
  const phase = viz.usePhaseClock(running, 0.6);
  return <viz.TubeVsTransistorView phase={phase} width={width} height={height} />;
}

// ── The sectioned shell ─────────────────────────────────────────────────────
// The Tube Reference library left this list (rack conversion 2026-08-23): it
// navigates from the dock's TUBE REF action key — it is not a stage section.

const SECTIONS: { key: string; label: string; title: string; blurb: string; Comp: (p: SectionProps) => React.JSX.Element }[] = [
  { key: 'inside', label: 'INSIDE', title: 'WHAT’S INSIDE A VACUUM TUBE?', blurb: 'Glass, metal, wire, and nothing at all — open PARTS and tap each piece to learn its job.', Comp: InsideSection },
  { key: 'flow', label: 'FLOW', title: 'ELECTRON FLOW', blurb: 'Ride the warm-up lane and watch heat become a cloud, and the cloud become current.', Comp: FlowSection },
  { key: 'grid', label: 'GRID', title: 'THE CONTROL GRID', blurb: 'The heart of amplification: a whisper of voltage gating a river of current.', Comp: GridSection },
  { key: 'amplify', label: 'AMPLIFY', title: 'SIGNAL AMPLIFICATION', blurb: 'Your signal never touches the big current — it drives the GRID (blue). The grid is a valve: its tiny wiggle opens and chokes the tube’s much larger cathode→plate stream, and that gated stream leaves the PLATE (amber) as a big, flipped copy of the input.', Comp: AmplifySection },
  { key: 'highv', label: 'HIGH V', title: 'WHY TUBES NEED HIGH VOLTAGE', blurb: 'Weak attraction, weak current — why tube circuits live at hundreds of volts.', Comp: HighVoltSection },
  { key: 'types', label: 'TYPES', title: 'TRIODE · TETRODE · PENTODE', blurb: 'Three tubes, one story: each type adds ONE more grid to fix the previous type’s weakness. Switch between them — the newest grid glows in its own color, and the drawing shows what it fixes (and what it costs).', Comp: TypesSection },
  { key: 'bias', label: 'BIAS', title: 'TUBE BIAS', blurb: 'Cutoff · linear · saturation — one lane on the transfer curve.', Comp: BiasSection },
  { key: 'sat', label: 'SATURATE', title: 'TUBE SATURATION', blurb: 'Every amplifier has a limit. Drive a tube toward its limit and it doesn’t slam into a wall — its transfer curve bends, ROUNDING the loudest peaks instead of chopping them off. That gentle bend is soft clipping, and it is most of what “tube sound” means.', Comp: SaturationSection },
  { key: 'versus', label: 'VS', title: 'TUBE vs TRANSISTOR', blurb: 'Two completely different physics doing the same job.', Comp: VersusSection },
];

export function VacuumTubeLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const focused = useIsFocused();
  const [sectionIdx, setSectionIdx] = useState(0);
  const [electron, setElectron] = useState(false);
  const viz = useState(() => requireTubeViz())[0];

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  const s = SECTIONS[sectionIdx];
  const sectionProps: SectionProps = {
    viz,
    focused,
    electron,
    onToggleElectron: () => setElectron((v) => !v),
    help,
    openReference: () => navigation.navigate('TubeReference'),
    title: s.title,
    blurb: s.blurb,
  };

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
      {/* Course-nav chip row — PINNED under the header (my call in the rack
          conversion: the 10-topic march is navigation, not a parameter, so it
          reads as the shell's mode tabs, one horizontal row). */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll} contentContainerStyle={styles.navRow}>
        {SECTIONS.map((sec, i) => (
          <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
        ))}
      </ScrollView>
      {/* One RackUnit per section, key-remounted so each section owns its
          state; the frame needs the full remaining height (flex:1). */}
      <View style={styles.rackArea}>
        <s.Comp key={s.key} {...sectionProps} />
      </View>
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
  navScroll: { flexGrow: 0 },
  navRow: { paddingHorizontal: 14, paddingBottom: 4, gap: 8, flexDirection: 'row' },
  rackArea: { flex: 1 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
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
  vsRow: { flexDirection: 'row', gap: 12 },
  vsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  // Ink-coded part chips (owner 2026-08-10) — reference-card color language;
  // they now live in the PARTS group tray (rack conversion 2026-08-23).
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
