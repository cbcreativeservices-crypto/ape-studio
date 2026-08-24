/**
 * MeterModuleScreen — hosts one Visual Audio Analysis module. Shared header,
 * scroll, and the 'meter' guided lesson wired into every ⓘ/long-press help.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { markLabUnit } from '../../../features/lab/labCompletion';
import { ScrollLockProvider } from '../LabShell';
import { METER_MODULES, type MeterModuleId } from './modules/registry';
import { WaveformModule, PeakModule, VuModule, LoudnessModule } from './modules/modMeterA';
import { SpectrumModule, SpectrogramModule, WaterfallModule } from './modules/modMeterB';
import { PhaseModule, StereoModule, ScopeModule, DetectiveModule } from './modules/modMeterC';

export type MeterModuleProps = {
  width: number;
  focused: boolean;
  help: (key?: string) => void;
  /** Optional scroll-lock (owner 2026-07-29 drag-vs-scroll fix): a module may
   *  call lockScroll(true) at drag start / (false) on release so its gesture
   *  wins over the host ScrollView. Plumbed now; modules adopt as needed. */
  lockScroll?: (v: boolean) => void;
};

/** Rack-mode modules (APE_LAB_UX_PROPOSAL 2026-08-23) render the RackUnit
 *  frame THEMSELVES — pinned stage + dock with their own scroll well (incl.
 *  the guided-lesson entry row) — so the host gives them the full height and
 *  no ScrollView. */
const RACK_MODULES = new Set<MeterModuleId>([
  'waveform',
  'peak',
  'vu',
  'loudness',
  'spectrum',
  'spectrogram',
  'waterfall',
  'phase',
  'stereo',
  'scope',
  'detective',
]);

const COMPONENTS: Record<MeterModuleId, (p: MeterModuleProps) => React.JSX.Element> = {
  waveform: WaveformModule,
  peak: PeakModule,
  vu: VuModule,
  loudness: LoudnessModule,
  spectrum: SpectrumModule,
  spectrogram: SpectrogramModule,
  waterfall: WaterfallModule,
  phase: PhaseModule,
  stereo: StereoModule,
  scope: ScopeModule,
  detective: DetectiveModule,
};

export function MeterModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MeterModule'>>();
  const focused = useIsFocused();
  const meta = METER_MODULES.find((m) => m.id === route.params.id) ?? METER_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  // R6c: mark this module viewed → the Visual Audio Analysis lab completes once
  // every module has been seen (fires mark_lab_complete server-side).
  useEffect(() => {
    if (focused) markLabUnit('af_visual_analysis', meta.id);
  }, [focused, meta.id]);
  const [width, setWidth] = useState(0);
  // Modules lock the ScrollView during their drags via the lockScroll prop
  // (owner 2026-07-29 drag-vs-scroll fix).
  const [scrollLocked, setScrollLocked] = useState(false);
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{meta.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Visual Audio Analysis Lab</Text>
        </View>
        <AccuracyNote compact detail="These meters run on your phone’s UNCALIBRATED microphone — read them as relative, for learning. For accurate levels use a calibrated SPL meter or measurement mic." />
      </View>
      <ScrollLockProvider value={setScrollLocked}>
      {RACK_MODULES.has(meta.id) ? (
        // Rack module: full height — the module's RackUnit pins stage + dock
        // and owns the scroll well (incl. its own guided-lesson entry row).
        <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" scrollEnabled={!scrollLocked}>
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
        </View>
        {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29, LabShell v2). */}
        <Pressable
          style={styles.lessonRow}
          onPress={() => help()}
          accessibilityRole="button"
          accessibilityLabel="Open the guided lesson"
        >
          <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
        </Pressable>
      </ScrollView>
      )}
      </ScrollLockProvider>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('meter')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
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
  rackFill: { flex: 1 },
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
