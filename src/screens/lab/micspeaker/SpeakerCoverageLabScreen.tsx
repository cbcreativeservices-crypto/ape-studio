/**
 * SpeakerCoverageLabScreen — "Speaker Placement & Coverage" (owner 2026-07-29).
 * Single mission: HOW LOUDSPEAKERS DISTRIBUTE SOUND.
 *
 * VISUAL-FIRST LAUNCH: conceptual coverage only — the map is a TEACHING
 * MODEL (within-dispersion × distance falloff drawn as a continuous jet
 * heat map), NEVER an SPL prediction, and every panel says so (§1.7). Audio
 * demonstrations are marked as coming in a future release.
 *
 * SHAPE: sectioned lab — TOP VIEW (position · aim · dispersion · overlap ·
 * front fills), SIDE VIEW (height · tilt · vertical dispersion · room shape ·
 * delay concept), and the coverage-reading legend/check. Full help wiring
 * into the 'speaker' guided lesson.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { InteractionZone, LabChip, CollapsibleSection } from '../LabShell';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../../features/lab/guidedLessons';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../foundations/bits';
import { requireMsViz, skiaAvailable, type MsVizModule } from './skiaGate';

// Dispersion presets the screen owns (no Skia dependency for the labels).
const DISPERSIONS: { key: string; label: string; hDeg: number; vDeg: number }[] = [
  { key: '60x40', label: '60°×40°', hDeg: 60, vDeg: 40 },
  { key: '90x60', label: '90°×60°', hDeg: 90, vDeg: 60 },
  { key: '100x100', label: '100°×100°', hDeg: 100, vDeg: 100 },
  { key: '120x60', label: '120°×60°', hDeg: 120, vDeg: 60 },
];

function IllustrationBadge({ text }: { text?: string }) {
  return (
    <Text style={styles.badge}>
      {text ??
        'CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION (REAL ROOMS, REFLECTIONS & ARRAY BEHAVIOR DIFFER)'}
    </Text>
  );
}

// Heat-map legend: the continuous jet colormap, hottest → none.
function Legend() {
  const rows: { c: string; t: string }[] = [
    { c: '#d81f1f', t: 'RED / ORANGE — hottest: too loud, or heavy overlap' },
    { c: '#e8e13a', t: 'YELLOW — strong, upper end of the listening range' },
    { c: '#3fd06c', t: 'GREEN — the target listening range' },
    { c: '#19c7c2', t: 'CYAN / BLUE — quiet: pattern edge, or far away' },
    { c: '#0b1c4a', t: 'DEEP BLUE — little to no coverage (dead zone)' },
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

type SectionProps = {
  viz: MsVizModule | null;
  width: number;
  help: (k: string) => void;
  /** Scroll-lock for the coverage canvases (owner 2026-07-29 drag-vs-scroll
   *  fix): a touch inside an <InteractionZone onLock={onLock}> silences the
   *  host ScrollView so the interaction wins over the page. */
  onLock?: (v: boolean) => void;
};

// ── 1 · TOP VIEW — position, aim, dispersion, overlap, front fills ──────────

function TopSection({ viz, width, help, onLock }: SectionProps) {
  const [dispIdx, setDispIdx] = useState(1);
  const [twoOn, setTwoOn] = useState(false);
  const [fills, setFills] = useState(false);
  const [s1, setS1] = useState({ x: 0.3, aim: 0 });
  const [s2, setS2] = useState({ x: 0.7, aim: 0 });
  const disp = DISPERSIONS[dispIdx];

  // Speaker 1's position + aim sliders — a column so it can sit beside
  // speaker 2's column when the second speaker is added (owner 2026-08-05).
  const spk1Controls = (
    <View style={styles.col}>
      <Text style={styles.colHead}>SPEAKER 1</Text>
      <DragSlider
        value={s1.x}
        onChange={(v) => setS1({ ...s1, x: v })}
        label="POSITION"
        readout={s1.x < 0.35 ? 'stage left' : s1.x > 0.65 ? 'stage right' : 'center'}
        onHelp={() => help('position')}
      />
      <DragSlider
        value={(s1.aim + 60) / 120}
        onChange={(v) => setS1({ ...s1, aim: Math.round(v * 120 - 60) })}
        label="AIM"
        readout={`${s1.aim}°`}
        onHelp={() => help('aim')}
      />
    </View>
  );
  const spk2Controls = (
    <View style={styles.col}>
      <Text style={styles.colHead}>SPEAKER 2</Text>
      <DragSlider
        value={s2.x}
        onChange={(v) => setS2({ ...s2, x: v })}
        label="POSITION"
        readout={s2.x < 0.35 ? 'stage left' : s2.x > 0.65 ? 'stage right' : 'center'}
        onHelp={() => help('position')}
      />
      <DragSlider
        value={(s2.aim + 60) / 120}
        onChange={(v) => setS2({ ...s2, aim: Math.round(v * 120 - 60) })}
        label="AIM"
        readout={`${s2.aim}°`}
        onHelp={() => help('aim')}
      />
    </View>
  );

  return (
    <View style={styles.panelCard}>
      {/* Color key ABOVE the display, below the title/explanation (owner 2026-08-05). */}
      <Legend />
      {/* InteractionZone: touches on the canvas win over the page scroll (owner 2026-07-29). */}
      <InteractionZone onLock={onLock}>
        {viz ? (
          <viz.TopCoverageView
            width={width}
            spk1x01={s1.x}
            spk1AimDeg={s1.aim}
            spk2On={twoOn}
            spk2x01={s2.x}
            spk2AimDeg={s2.aim}
            hDeg={disp.hDeg}
            frontFills={fills}
          />
        ) : (
          <VizUnavailableCard />
        )}
      </InteractionZone>
      <IllustrationBadge />
      <DisplayGuideButton onPress={() => help('top_view')} />
      {/* Feature toggles. */}
      <View style={styles.chipRow}>
        <LabChip
          label={twoOn ? 'SPEAKER 2 ●' : 'ADD SPEAKER 2'}
          selected={twoOn}
          onPress={() => setTwoOn((v) => !v)}
          onLongPress={() => help('second_speaker')}
        />
        <LabChip label={fills ? 'FRONT FILLS ●' : 'FRONT FILLS'} selected={fills} onPress={() => setFills((v) => !v)} onLongPress={() => help('front_fills')} />
      </View>
      {/* Speaker sliders: one full-width column until a second speaker is added,
          then two columns side by side (owner 2026-08-05). */}
      {twoOn ? (
        <View style={styles.twoCol}>
          {spk1Controls}
          {spk2Controls}
        </View>
      ) : (
        spk1Controls
      )}
      {/* Coverage-angle buttons BELOW all sliders (owner 2026-08-05). */}
      <View style={styles.chipRow}>
        {DISPERSIONS.map((d, i) => (
          <LabChip key={d.key} label={d.label} selected={dispIdx === i} onPress={() => setDispIdx(i)} onLongPress={() => help('dispersion')} />
        ))}
      </View>
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('top_view')}>
        <Text style={styles.caption}>
          Narrow boxes (60°) throw far but need careful aim; wide boxes (120°) cover close and wide
          but fall off fast. Two overlapping speakers turn the shared zone RED — energy piles up
          (and, in the real world, combs). Front fills rescue the first rows the mains fly over.
        </Text>
      </CollapsibleSection>
    </View>
  );
}

// ── 2 · SIDE VIEW — height, tilt, vertical pattern, the room ────────────────

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
  wrongHint: 'Raise the HEIGHT slider and add DOWN-TILT so the pattern’s center reaches the back rows, not just the front.',
};

function SideSection({ viz, width, help, onLock }: SectionProps) {
  const [dispIdx, setDispIdx] = useState(1);
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
  const disp = DISPERSIONS[dispIdx];

  return (
    <View style={styles.panelCard}>
      {/* InteractionZone: touches on the canvas win over the page scroll (owner 2026-07-29). */}
      <InteractionZone onLock={onLock}>
        {viz ? (
          <viz.SideCoverageView
            width={width}
            h01={h01}
            tiltDeg={tilt}
            vDeg={disp.vDeg}
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
        )}
      </InteractionZone>
      <IllustrationBadge text="CONCEPTUAL LEVEL MAP — illustrative model, NOT an SPL prediction; heads are tinted by whether the vertical pattern reaches them (real rooms, reflections & arrays differ)" />
      {lineArray ? (
        <Text style={styles.badge}>
          LINE ARRAY — CONCEPTUAL MODEL, NOT AN SPL PREDICTION. The summed field illustrates why a
          splayed hang holds level deeper than one box; real array prediction is far more involved.
        </Text>
      ) : null}
      {rearDelay ? (
        <Text style={styles.badge}>
          DELAY ALIGNMENT — CONCEPTUAL MODEL, NOT TRUE TIME-ALIGNMENT MATH. The two travelling
          fronts illustrate firing the rear speaker late so arrivals fuse; timing here is
          illustrative only.
        </Text>
      ) : null}
      <DisplayGuideButton onPress={() => help('side_view')} />
      {/* Sliders first, then the toggle buttons (owner 2026-08-05 wave-style order). */}
      <DragSlider value={h01} onChange={setH01} label="SPEAKER HEIGHT" readout={h01 < 0.3 ? 'low' : h01 > 0.7 ? 'flown high' : 'mid'} onHelp={() => help('height_tilt')} />
      <DragSlider value={(tilt + 5) / 40} onChange={(v) => setTilt(Math.round(v * 40 - 5))} label="DOWN-TILT" readout={`${tilt}°`} onHelp={() => help('height_tilt')} />
      <DragSlider value={stage01} onChange={setStage01} label="STAGE HEIGHT" readout={stage01 < 0.33 ? 'low' : stage01 > 0.66 ? 'high' : 'mid'} onHelp={() => help('room_shape')} />
      <DragSlider value={ceil01} onChange={setCeil01} label="CEILING HEIGHT" readout={ceil01 < 0.33 ? 'low' : ceil01 > 0.66 ? 'high' : 'mid'} onHelp={() => help('room_shape')} />
      {/* Moves the whole audience block closer to / farther from the stage —
          the audience keeps its size and spacing (owner 2026-08-05). */}
      <DragSlider value={depth01} onChange={setDepth01} label="AUDIENCE DISTANCE" readout={depth01 < 0.35 ? 'near the stage' : depth01 > 0.7 ? 'far from stage' : 'mid'} onHelp={() => help('room_shape')} />
      <View style={styles.chipRow}>
        {DISPERSIONS.map((d, i) => (
          <LabChip key={d.key} label={`V ${d.vDeg}°`} selected={dispIdx === i} onPress={() => setDispIdx(i)} onLongPress={() => help('dispersion')} />
        ))}
      </View>
      <View style={styles.chipRow}>
        <LabChip label={sloped ? 'SLOPED SEATING ●' : 'FLAT SEATING'} selected={sloped} onPress={() => setSloped((v) => !v)} onLongPress={() => help('room_shape')} />
        <LabChip label={delayOn ? 'DELAY SPEAKER ●' : 'ADD DELAY SPEAKER'} selected={delayOn} onPress={() => setDelayOn((v) => !v)} onLongPress={() => help('delay_speaker')} />
      </View>
      <View style={styles.chipRow}>
        <LabChip label={lineArray ? 'LINE ARRAY ●' : 'LINE ARRAY'} selected={lineArray} onPress={() => setLineArray((v) => !v)} onLongPress={() => help('line_array')} />
        <LabChip label={rearDelay ? 'REAR DELAY ●' : 'REAR DELAY SPKR'} selected={rearDelay} onPress={() => setRearDelay((v) => !v)} onLongPress={() => help('delay_speaker')} />
        {rearDelay ? (
          <LabChip label={timeAligned ? 'TIME-ALIGNED ●' : 'MISALIGNED'} selected={timeAligned} onPress={() => setTimeAligned((v) => !v)} onLongPress={() => help('delay_speaker')} />
        ) : null}
      </View>
      <CollapsibleSection title="WHAT'S HAPPENING" onHelp={() => help('side_view')}>
        <Text style={styles.caption}>
          The vertical pattern is a wedge: aim its CENTER at the far seats and let its EDGE graze the
          near ones. Deep rooms outrun any single box — a LINE ARRAY splays several boxes so the whole
          depth hears an even level, and a REAR DELAY speaker (fired late, so its sound arrives in step
          with the mains) rescues the back rows. Both are conceptual illustrations, not SPL predictions.
        </Text>
      </CollapsibleSection>
      <CheckQuestion spec={SIDE_CHECK} />
    </View>
  );
}

// ── 3 · READING COVERAGE — the four colors + wrap-up ────────────────────────

function ConceptsSection({ help }: SectionProps) {
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
      🔈 Audio demonstrations — coming in a future release. This lab teaches visually first.
    </Text>
  );
}

const SECTIONS: { key: string; label: string; title: string; blurb: string; Comp: (p: SectionProps) => React.JSX.Element }[] = [
  { key: 'top', label: 'TOP VIEW', title: 'COVERAGE FROM ABOVE', blurb: 'Move the speakers, choose their dispersion, aim them — and watch who they reach.', Comp: TopSection },
  { key: 'side', label: 'SIDE VIEW', title: 'HEIGHT & TILT', blurb: 'Raise, tilt, and shape the room — make the wedge land on every row.', Comp: SideSection },
  { key: 'read', label: 'READING IT', title: 'READING A COVERAGE MAP', blurb: 'The heat-map colors, and the vocabulary every system tech uses.', Comp: ConceptsSection },
];

export function SpeakerCoverageLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sectionIdx, setSectionIdx] = useState(0);
  const [width, setWidth] = useState(0);
  const viz = useState(() => requireMsViz())[0];
  // Canvas touches lock the ScrollView while a finger is down inside an
  // InteractionZone, so the interaction wins over scroll (owner 2026-07-29).
  const [scrollLocked, setScrollLocked] = useState(false);

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
          <Text style={styles.title}>SPEAKER PLACEMENT & COVERAGE</Text>
          <Text style={styles.subtitle}>How loudspeakers distribute sound</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
        <FutureAudioNote />
        {!skiaAvailable ? <VizUnavailableCard /> : null}
        <View style={styles.chipRow}>
          {SECTIONS.map((sec, i) => (
            <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
          ))}
        </View>
        <Text style={styles.sectionTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.blurb}</Text>
        {/* panelCard consumes 24 padding + 2 border → content box is −26. */}
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <s.Comp viz={viz} width={width} help={help} onLock={setScrollLocked} /> : null}
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
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  sectionTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, letterSpacing: 0.6, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  panelCard: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 10 },
  colHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber },
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
