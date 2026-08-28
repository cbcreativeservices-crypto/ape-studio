/**
 * SpeakerCoverageLabScreen — "Speaker Placement & Coverage" (owner 2026-07-29).
 * Single mission: HOW LOUDSPEAKERS DISTRIBUTE SOUND.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): the coverage
 * map PINS on the stage — reading may scroll; operating may not. TOP VIEW and
 * SIDE VIEW render the RackUnit frame (canvas on the glass, live readouts on
 * the bezel, sliders on the dock lane, collections in trays); READING IT is
 * pure prose and keeps a plain ScrollView. The old InteractionZone scroll-lock
 * workaround (owner 2026-07-29 drag-vs-scroll fix) is RETIRED here: the staged
 * canvas lives outside any ScrollView, so there is no scroll to fight.
 *
 * VISUAL-FIRST LAUNCH: conceptual coverage only — the map is a TEACHING
 * MODEL (within-dispersion × distance falloff drawn as a continuous jet
 * heat map), NEVER an SPL prediction, and every panel says so (§1.7). Audio
 * demonstrations are marked as coming in a future release.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip, CollapsibleSection } from '../LabShell';
import { markLabUnit, registerLabUnits } from '../../../features/lab/labCompletion';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { jetColor } from './viz';
import { RackUnit } from '../rack/RackUnit';
import type { DockParam, RackStage } from '../rack/rackTypes';
import { requireMsViz } from './skiaGate';

// Dispersion presets the screen owns (no Skia dependency for the labels).
const DISPERSIONS: { key: string; label: string; hDeg: number; vDeg: number }[] = [
  { key: '60x40', label: '60°×40°', hDeg: 60, vDeg: 40 },
  { key: '90x60', label: '90°×60°', hDeg: 90, vDeg: 60 },
  { key: '100x100', label: '100°×100°', hDeg: 100, vDeg: 100 },
  { key: '120x60', label: '120°×60°', hDeg: 120, vDeg: 60 },
];

// Honesty text — silk-screened on the faceplate under each staged display
// (verbatim from the pre-rack IllustrationBadge, §1.7).
const TOP_BADGE =
  'CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION (REAL ROOMS, REFLECTIONS & ARRAY BEHAVIOR DIFFER)';
const SIDE_BADGE =
  'CONCEPTUAL LEVEL MAP — illustrative model, NOT an SPL prediction; heads are tinted by whether the vertical pattern reaches them (real rooms, reflections & arrays differ)';

// Heat-map legend, SAMPLED FROM THE MAP'S OWN COLORMAP.
//
// Every swatch here used to be a hand-typed hex, and not one of the five
// matched what the map actually paints — the "red" was #d81f1f against the
// map's #ff5f4e, and the dead-zone swatch claimed a DEEP BLUE (#0b1c4a) for a
// zone the map renders BLACK. A legend that disagrees with its own map is worse
// than no legend, because the reader trusts it. Sampling jetColor at each
// row's own level means it cannot drift again.
function Legend() {
  const rows: { c: string; t: string }[] = [
    { c: jetColor(1), t: 'RED / ORANGE — hottest: too loud, or heavy overlap' },
    { c: jetColor(0.55), t: 'YELLOW — strong, upper end of the listening range' },
    { c: jetColor(0.32), t: 'GREEN — the target listening range' },
    { c: jetColor(0.14), t: 'CYAN / BLUE — quiet: pattern edge, or far away' },
    // Zero coverage reads BLACK, not blue (owner 2026-08-28: blue fades to
    // black at zero signal, so "nothing there" is honest rather than decorative).
    { c: jetColor(0), t: 'BLACK — no coverage at all (dead zone)' },
  ];
  return (
    <View style={{ gap: 3 }}>
      {rows.map((r) => (
        <View key={r.t} style={styles.legendRow}>
          <View style={[styles.swatch, { backgroundColor: r.c }]} />
          <Text style={styles.caption}>{r.t}</Text>
        </View>
      ))}
      <Text style={styles.caption}>
        Overlapping speakers read as hot ridges where their beams cross. (Side-view audience
        busts keep their own green/yellow/red/gray tint: does the vertical pattern reach that row?)
      </Text>
    </View>
  );
}

const SIDE_CHECK: CheckSpec = {
  question:
    'When the rear seats have low coverage level while the front seats are at their full level, the classic fix is…',
  options: [
    'Turn the whole system up',
    'Raise the speaker and aim the speaker to cover both the front and back more evenly.',
    'Move the speaker closer to the front row',
  ],
  correctIdx: 1,
  reveal:
    'Raising the box and aiming it so the loud CENTER of its vertical pattern reaches the DISTANT rows — while the near rows sit at the quieter EDGE of the pattern — lets extra distance and the pattern’s shape offset each other, so front and back hear similar levels. Turning the whole system up just makes the already-loud front rows louder; moving the box closer to the front makes the front-to-back imbalance worse.',
  wrongHint: 'Raise the HEIGHT fader and add DOWN-TILT so the pattern’s center reaches the back rows, not just the front.',
};

// ── READING IT — the four colors + wrap-up (prose only, plain scroll) ───────

function ConceptsSection({ help }: { help: (k: string) => void }) {
  const rows: { t: string; d: string }[] = [
    { t: 'COVERAGE', d: 'Every listener inside the pattern at a workable level — the entire goal of placement.' },
    { t: 'DISPERSION', d: 'The nominal H° × V° wedge a cabinet actually controls. Outside it, level and tone fall apart.' },
    { t: 'HOT SPOT', d: 'Somewhere too loud — usually too close to a box, or two boxes overlapping.' },
    { t: 'DEAD ZONE', d: 'Somewhere the pattern never reaches — under-balcony rear rows are the classic.' },
    { t: 'OVERLAP', d: 'Two speakers covering the same seats: louder, but rough — real systems minimize or control it.' },
    { t: 'FRONT FILLS', d: 'Small speakers along the stage lip covering the rows the flown mains pass over.' },
    { t: 'DELAY SPEAKERS', d: 'Extra cabinets deeper in the room, time-aligned to the mains, extending coverage rearward.' },
  ];
  return (
    <View style={styles.panelCard}>
      <DisplayGuideButton onPress={() => help('coverage_legend')} />
      <Legend />
      {rows.map((r) => (
        <Pressable key={r.t} onLongPress={() => help('coverage_legend')} delayLongPress={300}>
          <Text style={styles.conceptT}>{r.t}</Text>
          <Text style={styles.caption}>{r.d}</Text>
        </Pressable>
      ))}
      <CollapsibleSection title="THE BIG IDEA" onHelp={() => help('coverage_legend')}>
        <Text style={styles.caption}>
          One idea unifies all of it: a loudspeaker is a flashlight for sound. Placement, aim,
          height, and pattern choice decide who stands in the beam.
        </Text>
      </CollapsibleSection>
    </View>
  );
}

// ── Shell ───────────────────────────────────────────────────────────────────

function FutureAudioNote() {
  return (
    <Text style={styles.futureNote}>
      🔈 This lab teaches visually — no audio playback.
    </Text>
  );
}

function LessonRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.lessonRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open the guided lesson"
    >
      <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
    </Pressable>
  );
}

const SECTIONS: { key: string; label: string; title: string; blurb: string }[] = [
  { key: 'top', label: 'TOP VIEW', title: 'COVERAGE FROM ABOVE', blurb: 'Move the speakers, choose their dispersion, aim them — and watch who they reach.' },
  { key: 'side', label: 'SIDE VIEW', title: 'HEIGHT & TILT', blurb: 'Raise, tilt, and shape the room — make the wedge land on every row.' },
  { key: 'read', label: 'READING IT', title: 'READING A COVERAGE MAP', blurb: 'The heat-map colors, and the vocabulary every system tech uses.' },
];

const posWord = (x: number) => (x < 0.35 ? 'stage left' : x > 0.65 ? 'stage right' : 'center');
const heightWord = (h: number) => (h < 0.3 ? 'low' : h > 0.7 ? 'flown high' : 'mid');
const lowMidHigh = (v: number) => (v < 0.33 ? 'low' : v > 0.66 ? 'high' : 'mid');

export function SpeakerCoverageLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sectionIdx, setSectionIdx] = useState(0);
  const viz = useState(() => requireMsViz())[0];

  // ── TOP VIEW state (hoisted so the dock declaration can bind it) ──────────
  const [topDispIdx, setTopDispIdx] = useState(1);
  const [twoOn, setTwoOn] = useState(false);
  const [fills, setFills] = useState(false);
  const [s1, setS1] = useState({ x: 0.3, aim: 0 });
  const [s2, setS2] = useState({ x: 0.7, aim: 0 });
  /** Which speaker the POS/AIM lane edits (the tools' focus idiom — keeps the
   *  dock at 2 faders whether one or two boxes are up). */
  const [activeSpk, setActiveSpk] = useState<1 | 2>(1);

  // ── SIDE VIEW state ───────────────────────────────────────────────────────
  const [sideDispIdx, setSideDispIdx] = useState(1);
  const [h01, setH01] = useState(0.35);
  const [tilt, setTilt] = useState(12);
  const [stage01, setStage01] = useState(0.4);
  const [ceil01, setCeil01] = useState(0.6);
  const [depth01, setDepth01] = useState(0.85);
  const [sloped, setSloped] = useState(false);
  const [delayOn, setDelayOn] = useState(false);
  const [lineArray, setLineArray] = useState(false);
  const [rearDelay, setRearDelay] = useState(false);
  const [timeAligned, setTimeAligned] = useState(true);

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  // R6c: mark each section viewed → the Speaker Placement & Coverage lab
  // completes once all sections have been seen.
  useEffect(() => {
    registerLabUnits('af_speaker_coverage', SECTIONS.map((x) => x.key));
  }, []);
  useEffect(() => {
    markLabUnit('af_speaker_coverage', SECTIONS[sectionIdx].key);
  }, [sectionIdx]);

  const topDisp = DISPERSIONS[topDispIdx];
  const sideDisp = DISPERSIONS[sideDispIdx];
  const spkEditable2 = twoOn && activeSpk === 2;
  const active = spkEditable2 ? s2 : s1;
  const setActive = spkEditable2 ? setS2 : setS1;

  // ── TOP VIEW rack declaration ─────────────────────────────────────────────
  const topStage: RackStage = {
    size: 'L', // the map IS the lab — earns the tall glass
    badge: TOP_BADGE,
    onGuide: () => help('top_view'),
    bezel: [
      {
        k: 'EDIT',
        v: `SPK ${spkEditable2 ? 2 : 1}`,
        helpKey: 'second_speaker',
        // Tap to swap which speaker the lane edits (only meaningful with 2 up).
        onPress: twoOn ? () => setActiveSpk((a) => (a === 1 ? 2 : 1)) : undefined,
      },
      { k: 'POS', v: posWord(active.x), flex: 1.2, helpKey: 'position' },
      { k: 'AIM', v: `${active.aim}°`, helpKey: 'aim' },
      { k: 'PATTERN', v: topDisp.label, flex: 1.2, helpKey: 'dispersion' },
    ],
    render: (w, h) =>
      viz ? (
        <viz.TopCoverageView
          width={w}
          height={h}
          spk1x01={s1.x}
          spk1AimDeg={s1.aim}
          spk2On={twoOn}
          spk2x01={s2.x}
          spk2AimDeg={s2.aim}
          hDeg={topDisp.hDeg}
          frontFills={fills}
        />
      ) : (
        <VizUnavailableCard />
      ),
  };

  const topParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'pos',
      label: 'POS',
      value: active.x,
      onChange: (v) => setActive({ ...active, x: v }),
      format: () => `spk ${spkEditable2 ? 2 : 1} · ${posWord(active.x)}`,
      formatShort: () => posWord(active.x).replace('stage ', '').toUpperCase(),
      helpKey: 'position',
    },
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (active.aim + 60) / 120,
      onChange: (v) => setActive({ ...active, aim: Math.round(v * 120 - 60) }),
      format: () => `spk ${spkEditable2 ? 2 : 1} · ${active.aim}°`,
      formatShort: () => `${active.aim}°`,
      helpKey: 'aim',
    },
    {
      kind: 'options',
      id: 'disp',
      label: 'PATTERN',
      valueLabel: topDisp.label,
      options: DISPERSIONS.map((d) => ({ id: d.key, label: d.label })),
      selectedId: topDisp.key,
      onSelect: (id) => {
        const i = DISPERSIONS.findIndex((d) => d.key === id);
        if (i >= 0) setTopDispIdx(i);
      },
      sticky: true, // A/B narrow vs wide while the map repaints — the lesson
      helpKey: 'dispersion',
    },
    {
      kind: 'group',
      id: 'spkrs',
      label: 'SPKRS',
      valueLabel: twoOn ? `2 · E${spkEditable2 ? 2 : 1}` : '1',
      helpKey: 'second_speaker',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>SPEAKERS</Text>
          <View style={styles.chipRow}>
            <LabChip
              label={twoOn ? 'SPEAKER 2 ●' : 'ADD SPEAKER 2'}
              selected={twoOn}
              onPress={() => {
                if (twoOn && activeSpk === 2) setActiveSpk(1);
                setTwoOn((v) => !v);
              }}
              onLongPress={() => help('second_speaker')}
            />
          </View>
          <Text style={styles.trayHead}>EDIT WITH THE FADERS</Text>
          <View style={styles.chipRow}>
            <LabChip label="SPEAKER 1" selected={!spkEditable2} onPress={() => setActiveSpk(1)} onLongPress={() => help('position')} />
            <LabChip
              label="SPEAKER 2"
              selected={spkEditable2}
              onPress={() => {
                if (!twoOn) setTwoOn(true);
                setActiveSpk(2);
              }}
              onLongPress={() => help('second_speaker')}
            />
          </View>
        </View>
      ),
    },
    { kind: 'toggle', id: 'fills', label: 'FILLS', value: fills, onToggle: () => setFills((v) => !v), helpKey: 'front_fills' },
  ];

  // ── SIDE VIEW rack declaration ────────────────────────────────────────────
  const sideStage: RackStage = {
    size: 'L',
    badge: SIDE_BADGE,
    onGuide: () => help('side_view'),
    bezel: [
      { k: 'HEIGHT', v: heightWord(h01), flex: 1.2, helpKey: 'height_tilt' },
      { k: 'TILT', v: `${tilt}°`, helpKey: 'height_tilt' },
      { k: 'V PAT', v: `${sideDisp.vDeg}°`, helpKey: 'dispersion' },
      {
        k: 'ROOM',
        v: `${sloped ? 'sloped' : 'flat'}${delayOn || rearDelay ? ' · dly' : ''}`,
        flex: 1.2,
        helpKey: 'room_shape',
      },
    ],
    render: (w, h) =>
      viz ? (
        <viz.SideCoverageView
          width={w}
          height={h}
          h01={h01}
          tiltDeg={tilt}
          vDeg={sideDisp.vDeg}
          stage01={stage01}
          ceil01={ceil01}
          depth01={depth01}
          sloped={sloped}
          delayOn={delayOn}
          lineArray={lineArray}
          rearDelayOn={rearDelay}
          timeAligned={timeAligned}
        />
      ) : (
        <VizUnavailableCard />
      ),
  };

  const sideParams: DockParam[] = [
    {
      // FIRST fader = the section's teaching parameter: `initialParam` ('aim')
      // is a top-view id, so the frame's reconciliation binds this one when
      // the SIDE section mounts its params (RackUnit fallback rule).
      kind: 'fader',
      id: 'height',
      label: 'HEIGHT',
      value: h01,
      onChange: setH01,
      format: () => heightWord(h01),
      formatShort: () => heightWord(h01).replace('flown ', '').toUpperCase(),
      helpKey: 'height_tilt',
    },
    {
      kind: 'fader',
      id: 'tilt',
      label: 'TILT',
      value: (tilt + 5) / 40,
      onChange: (v) => setTilt(Math.round(v * 40 - 5)),
      format: () => `${tilt}° down-tilt`,
      formatShort: () => `${tilt}°`,
      helpKey: 'height_tilt',
    },
    {
      kind: 'options',
      id: 'vdisp',
      label: 'V PAT',
      valueLabel: `${sideDisp.vDeg}°`,
      options: DISPERSIONS.map((d) => ({ id: d.key, label: `V ${d.vDeg}°  (${d.label})` })),
      selectedId: sideDisp.key,
      onSelect: (id) => {
        const i = DISPERSIONS.findIndex((d) => d.key === id);
        if (i >= 0) setSideDispIdx(i);
      },
      sticky: true,
      helpKey: 'dispersion',
    },
    {
      kind: 'group',
      id: 'room',
      label: 'ROOM',
      valueLabel: sloped ? 'SLOPED' : 'FLAT',
      helpKey: 'room_shape',
      // DragSliders are safe in the tray: its content fits without scrolling,
      // so the tray's ScrollView never contests the horizontal drags.
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>ROOM SHAPE</Text>
          <DragSlider value={stage01} onChange={setStage01} label="STAGE HEIGHT" readout={lowMidHigh(stage01)} onHelp={() => help('room_shape')} />
          <DragSlider value={ceil01} onChange={setCeil01} label="CEILING HEIGHT" readout={lowMidHigh(ceil01)} onHelp={() => help('room_shape')} />
          {/* Moves the whole audience block closer to / farther from the stage —
              the audience keeps its size and spacing (owner 2026-08-05). */}
          <DragSlider
            value={depth01}
            onChange={setDepth01}
            label="AUDIENCE DISTANCE"
            readout={depth01 < 0.35 ? 'near the stage' : depth01 > 0.7 ? 'far from stage' : 'mid'}
            onHelp={() => help('room_shape')}
          />
          <View style={styles.chipRow}>
            <LabChip label={sloped ? 'SLOPED SEATING ●' : 'FLAT SEATING'} selected={sloped} onPress={() => setSloped((v) => !v)} onLongPress={() => help('room_shape')} />
          </View>
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'system',
      label: 'SYSTEM',
      valueLabel:
        [delayOn ? 'DLY' : '', lineArray ? 'ARR' : '', rearDelay ? 'REAR' : ''].filter(Boolean).join('·') || 'OFF',
      helpKey: 'delay_speaker',
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>COVERAGE HELPERS</Text>
          <View style={styles.chipRow}>
            <LabChip label={delayOn ? 'DELAY SPEAKER ●' : 'ADD DELAY SPEAKER'} selected={delayOn} onPress={() => setDelayOn((v) => !v)} onLongPress={() => help('delay_speaker')} />
            <LabChip label={lineArray ? 'LINE ARRAY ●' : 'LINE ARRAY'} selected={lineArray} onPress={() => setLineArray((v) => !v)} onLongPress={() => help('line_array')} />
          </View>
          <View style={styles.chipRow}>
            <LabChip label={rearDelay ? 'REAR DELAY ●' : 'REAR DELAY SPKR'} selected={rearDelay} onPress={() => setRearDelay((v) => !v)} onLongPress={() => help('delay_speaker')} />
            {rearDelay ? (
              <LabChip label={timeAligned ? 'TIME-ALIGNED ●' : 'MISALIGNED'} selected={timeAligned} onPress={() => setTimeAligned((v) => !v)} onLongPress={() => help('delay_speaker')} />
            ) : null}
          </View>
        </View>
      ),
    },
  ];

  const s = SECTIONS[sectionIdx];
  const rack = sectionIdx === 0 ? { stage: topStage, params: topParams } : sectionIdx === 1 ? { stage: sideStage, params: sideParams } : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>SPEAKER PLACEMENT & COVERAGE</Text>
          <Text style={styles.subtitle}>How loudspeakers distribute sound</Text>
        </View>
        <AccuracyNote compact />
      </View>
      {/* Section tabs stay PINNED with the header (the rack's mode-tab row). */}
      <View style={styles.tabRow}>
        {SECTIONS.map((sec, i) => (
          <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
        ))}
      </View>
      {rack ? (
        // ── TOP / SIDE — the Rack Unit: pinned canvas + bezel + dock; only
        //    the teaching prose below scrolls in the well. ───────────────────
        <RackUnit initialParam="aim" params={rack.params} stage={rack.stage} onHelp={help}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.body}>{s.blurb}</Text>
          {sectionIdx === 0 ? (
            <CollapsibleSection title="READING THE COLORS" onHelp={() => help('coverage_legend')}>
              <Legend />
            </CollapsibleSection>
          ) : null}
          {sectionIdx === 1 && lineArray ? (
            <Text style={styles.badge}>
              LINE ARRAY — CONCEPTUAL MODEL, NOT AN SPL PREDICTION. The summed field illustrates why a
              splayed hang holds level deeper than one box; real array prediction is far more involved.
            </Text>
          ) : null}
          {sectionIdx === 1 && rearDelay ? (
            <Text style={styles.badge}>
              DELAY ALIGNMENT — CONCEPTUAL MODEL, NOT TRUE TIME-ALIGNMENT MATH. The two travelling
              fronts illustrate firing the rear speaker late so arrivals fuse; timing here is
              illustrative only.
            </Text>
          ) : null}
          <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help(sectionIdx === 0 ? 'top_view' : 'side_view')}>
            {sectionIdx === 0 ? (
              <Text style={styles.caption}>
                Narrow boxes (60°) throw far but need careful aim; wide boxes (120°) cover close and wide
                but fall off fast. Two overlapping speakers turn the shared zone RED — energy piles up
                (and, in the real world, combs). Front fills rescue the first rows the mains fly over.
              </Text>
            ) : (
              <Text style={styles.caption}>
                The vertical pattern is a wedge: aim its CENTER at the far seats and let its EDGE graze the
                near ones. Deep rooms outrun any single box — a LINE ARRAY splays several boxes so the whole
                depth hears an even level, and a REAR DELAY speaker (fired late, so its sound arrives in step
                with the mains) rescues the back rows. Both are conceptual illustrations, not SPL predictions.
              </Text>
            )}
          </CollapsibleSection>
          {sectionIdx === 1 ? <CheckQuestion spec={SIDE_CHECK} /> : null}
          <LessonRow onPress={() => help(undefined)} />
          <FutureAudioNote />
        </RackUnit>
      ) : (
        // ── READING IT — pure prose: the whole page may scroll. ─────────────
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.body}>{s.blurb}</Text>
          <ConceptsSection help={help} />
          <LessonRow onPress={() => help(undefined)} />
          <FutureAudioNote />
        </ScrollView>
      )}
      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('speaker')}
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
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 4 },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
  conceptT: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber, marginTop: 4 },
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
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
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
