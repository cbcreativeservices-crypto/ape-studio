/**
 * MeterModuleScreen — hosts one Visual Audio Analysis module. The shared lab
 * header + navigation strip (kit/LabNavBar), scroll, and the 'meter' guided
 * lesson wired into every ⓘ/long-press help.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { markLabUnit, useLabClearedUnits } from '../../../features/lab/labCompletion';
import { LabEndScreen } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { ScrollLockProvider } from '../LabShell';
import { METER_MODULES, type MeterModuleId } from './modules/registry';
import { WaveformModule, PeakModule, VuModule, LoudnessModule } from './modules/modMeterA';
import { SpectrumModule, SpectrogramModule, WaterfallModule } from './modules/modMeterB';
import { PhaseModule, StereoModule, ScopeModule, DetectiveModule } from './modules/modMeterC';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

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
  // PREV / NEXT between modules (owner, build 32: "you have to come back to
  // this menu every single time") is the SHARED strip (kit/LabNavBar, owner
  // 2026-09-30). The hook owns the 400 ms double-tap lock (a double-tap on
  // NEXT at the second-last module used to land on FINISH) and calls the
  // host's go / finish / unEnd; the host swaps the module in place with
  // setParams (no stacked screens, so ‹ still returns to the lab menu).
  const idx = METER_MODULES.findIndex((m) => m.id === meta.id);
  const last = METER_MODULES.length - 1;
  // THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29). FINISH
  // swaps LabEndScreen in for the module: modules not yet credited (jump
  // links), PRACTISE AGAIN from module 1 (clears nothing), DONE to the menu.
  const [ending, setEnding] = useState(false);
  // A drag's scroll lock is released by its own release/terminate — which
  // never arrives when the module unmounts mid-drag (a second finger on
  // NEXT / FINISH). Free it on every module or end-screen change, or the
  // next reading page cannot scroll (bug pass 2026-10-01).
  useEffect(() => setScrollLocked(false), [meta.id, ending]);
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: MeterModuleId }) => void }).setParams({ id: METER_MODULES[i].id });
  };
  const banked = useLabClearedUnits('af_visual_analysis');
  const nav = useLabNav({
    units: METER_MODULES.map((m) => ({ id: m.id, title: m.title, done: banked.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="Visual Audio Analysis Lab"
      units={METER_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={banked}
      mode="credit"
      onJump={(id) => goToModule(METER_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => safeGoBack(navigation)}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader
        title={meta.title.toUpperCase()}
        subtitle="Visual Audio Analysis Lab"
        right={<AccuracyNote compact detail="These displays are driven by built-in teaching signals, not your microphone — read them to learn what each meter shows. For accurate levels use a calibrated SPL meter or measurement mic." />}
      />
      <LabNavBar nav={nav} />
      {endScreen ?? (
      <ScrollLockProvider value={setScrollLocked}>
      {RACK_MODULES.has(meta.id) ? (
        // Rack module: full height — the module's RackUnit pins stage + dock
        // and owns the scroll well (incl. its own guided-lesson entry row).
        <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
        </View>
      ) : (
      <ScrollView contentContainerStyle={[styles.scroll, readingColumn]} keyboardShouldPersistTaps="handled" scrollEnabled={!scrollLocked}>
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
        {/* The in-flow NEXT at the end of the reading (a rack well gets it from RackUnit). */}
        <LabNextButton />
      </ScrollView>
      )}
      </ScrollLockProvider>
      )}
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('meter')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
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
