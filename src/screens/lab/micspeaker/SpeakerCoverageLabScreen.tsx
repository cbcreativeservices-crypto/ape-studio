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
import { LabChip } from '../LabShell';
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

type SectionProps = { viz: MsVizModule | null; width: number; help: (k: string) => void };

// ── 1 · TOP VIEW — position, aim, dispersion, overlap, front fills ──────────

function TopSection({ viz, width, help }: SectionProps) {
  const [dispIdx, setDispIdx] = useState(1);
  const [twoOn, setTwoOn] = useState(false);
  const [fills, setFills] = useState(false);
  const [active, setActive] = useState<0 | 1>(0);
  const [s1, setS1] = useState({ x: 0.3, aim: 0 });
  const [s2, setS2] = useState({ x: 0.7, aim: 0 });
  const disp = DISPERSIONS[dispIdx];
  const cur = active === 0 ? s1 : s2;
  const setCur = (p: { x: number; aim: number }) => (active === 0 ? setS1(p) : setS2(p));

  return (
    <View style={styles.panelCard}>
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
      <IllustrationBadge />
      <DisplayGuideButton onPress={() => help('top_view')} />
      <Legend />
      <View style={styles.chipRow}>
        {DISPERSIONS.map((d, i) => (
          <LabChip key={d.key} label={d.label} selected={dispIdx === i} onPress={() => setDispIdx(i)} onLongPress={() => help('dispersion')} />
        ))}
      </View>
      <View style={styles.chipRow}>
        <LabChip label="SPEAKER 1" selected={active === 0} onPress={() => setActive(0)} onLongPress={() => help('position')} />
        <LabChip
          label={twoOn ? 'SPEAKER 2 ●' : 'ADD SPEAKER 2'}
          selected={active === 1 && twoOn}
          onPress={() => {
            if (!twoOn) {
              setTwoOn(true);
              setActive(1);
            } else if (active === 1) {
              setTwoOn(false);
              setActive(0);
            } else {
              setActive(1);
            }
          }}
          onLongPress={() => help('second_speaker')}
        />
        <LabChip label={fills ? 'FRONT FILLS ●' : 'FRONT FILLS'} selected={fills} onPress={() => setFills((v) => !v)} onLongPress={() => help('front_fills')} />
      </View>
      <DragSlider
        value={cur.x}
        onChange={(v) => setCur({ ...cur, x: v })}
        label={`SPEAKER ${active + 1} POSITION`}
        readout={cur.x < 0.35 ? 'stage left' : cur.x > 0.65 ? 'stage right' : 'center'}
        onHelp={() => help('position')}
      />
      <DragSlider
        value={(cur.aim + 60) / 120}
        onChange={(v) => setCur({ ...cur, aim: Math.round(v * 120 - 60) })}
        label={`SPEAKER ${active + 1} AIM`}
        readout={`${cur.aim}°`}
        onHelp={() => help('aim')}
      />
      <Text style={styles.caption}>
        Narrow boxes (60°) throw far but need careful aim; wide boxes (120°) cover close and wide
        but fall off fast. Two overlapping speakers turn the shared zone RED — energy piles up
        (and, in the real world, combs). Front fills rescue the first rows the mains fly over.
      </Text>
    </View>
  );
}

// ── 2 · SIDE VIEW — height, tilt, vertical pattern, the room ────────────────

const SIDE_CHECK: CheckSpec = {
  question: 'The rear seats are GRAY (no coverage) and the front row is RED (blasted). The classic fix is…',
  options: [
    'Turn the whole system up',
    'Raise the speaker and tilt it down toward the back rows',
    'Move the speaker closer to the front row',
  ],
  correctIdx: 1,
  reveal:
    'Height + down-tilt aims the LOUD center of the vertical pattern at the DISTANT seats while the nearby front rows sit at the quieter pattern edge — distance and pattern cancel out, so front and back hear similar levels. Turning it up makes the front row louder too; that is why speakers fly above the audience.',
  wrongHint: 'Raise the HEIGHT slider and add TILT — watch which seats turn green.',
};

function SideSection({ viz, width, help }: SectionProps) {
  const [dispIdx, setDispIdx] = useState(1);
  const [h01, setH01] = useState(0.35);
  const [tilt, setTilt] = useState(12);
  const [stage01, setStage01] = useState(0.4);
  const [ceil01, setCeil01] = useState(0.6);
  const [depth01, setDepth01] = useState(0.85);
  const [sloped, setSloped] = useState(false);
  const [delayOn, setDelayOn] = useState(false);
  const disp = DISPERSIONS[dispIdx];

  return (
    <View style={styles.panelCard}>
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
        />
      ) : (
        <VizUnavailableCard />
      )}
      <IllustrationBadge text="CONCEPTUAL LEVEL MAP — illustrative model, NOT an SPL prediction; heads are tinted by whether the vertical pattern reaches them (real rooms, reflections & arrays differ)" />
      <DisplayGuideButton onPress={() => help('side_view')} />
      <View style={styles.chipRow}>
        {DISPERSIONS.map((d, i) => (
          <LabChip key={d.key} label={`V ${d.vDeg}°`} selected={dispIdx === i} onPress={() => setDispIdx(i)} onLongPress={() => help('dispersion')} />
        ))}
      </View>
      <DragSlider value={h01} onChange={setH01} label="SPEAKER HEIGHT" readout={h01 < 0.3 ? 'low' : h01 > 0.7 ? 'flown high' : 'mid'} onHelp={() => help('height_tilt')} />
      <DragSlider value={(tilt + 5) / 40} onChange={(v) => setTilt(Math.round(v * 40 - 5))} label="DOWN-TILT" readout={`${tilt}°`} onHelp={() => help('height_tilt')} />
      <View style={styles.chipRow}>
        <LabChip label={sloped ? 'SLOPED SEATING ●' : 'FLAT SEATING'} selected={sloped} onPress={() => setSloped((v) => !v)} onLongPress={() => help('room_shape')} />
        <LabChip label={delayOn ? 'DELAY SPEAKER ●' : 'ADD DELAY SPEAKER'} selected={delayOn} onPress={() => setDelayOn((v) => !v)} onLongPress={() => help('delay_speaker')} />
      </View>
      <DragSlider value={stage01} onChange={setStage01} label="STAGE HEIGHT" readout={stage01 < 0.33 ? 'low' : stage01 > 0.66 ? 'high' : 'mid'} onHelp={() => help('room_shape')} />
      <DragSlider value={ceil01} onChange={setCeil01} label="CEILING HEIGHT" readout={ceil01 < 0.33 ? 'low' : ceil01 > 0.66 ? 'high' : 'mid'} onHelp={() => help('room_shape')} />
      <DragSlider value={depth01} onChange={setDepth01} label="AUDIENCE DEPTH" readout={depth01 < 0.4 ? 'shallow' : depth01 > 0.75 ? 'deep' : 'medium'} onHelp={() => help('room_shape')} />
      <Text style={styles.caption}>
        The vertical pattern is a wedge: aim its CENTER at the far seats and let its EDGE graze the
        near ones. Deep rooms eventually outrun any single box — the DELAY SPEAKER picks up the
        rear (concept only here: in practice it is time-aligned so both arrivals fuse into one).
      </Text>
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
      <Text style={styles.caption}>
        One idea unifies all of it: a loudspeaker is a flashlight for sound. Placement, aim,
        height, and pattern choice decide who stands in the beam.
      </Text>
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <FutureAudioNote />
        {!skiaAvailable ? <VizUnavailableCard /> : null}
        <View style={styles.chipRow}>
          <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => help(undefined)} />
          {SECTIONS.map((sec, i) => (
            <LabChip key={sec.key} label={sec.label} selected={sectionIdx === i} onPress={() => setSectionIdx(i)} />
          ))}
        </View>
        <Text style={styles.sectionTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.blurb}</Text>
        {/* panelCard consumes 24 padding + 2 border → content box is −26. */}
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <s.Comp viz={viz} width={width} help={help} /> : null}
        </View>
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
});
