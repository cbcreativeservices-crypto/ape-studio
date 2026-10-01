/**
 * DigitalModuleScreen — routes one Digital Lab module id to its component.
 * All eight modules share this host: the shared lab header + navigation strip
 * (kit/LabNavBar), scroll, and the shared GuidedLessonSheet wired to the
 * 'digital' lesson so every module's ⓘ/long-press help opens the two-tier popup.
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
import { DIGITAL_MODULES, type DigitalModuleId } from './modules/registry';
import { AnalogModule, SamplingModule } from './modules/modAnalog';
import { QuantModule, BinaryModule } from './modules/modQuant';
import { AdcModule, ProcessingModule } from './modules/modChain';
import { DacModule, ErrorsModule } from './modules/modDac';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';

export type DigitalModuleProps = {
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
const RACK_MODULES = new Set<DigitalModuleId>([
  'analog',
  'sampling',
  'quant',
  'binary',
  'adc',
  'processing',
  'dac',
  'errors',
]);

const COMPONENTS: Record<DigitalModuleId, (p: DigitalModuleProps) => React.JSX.Element> = {
  analog: AnalogModule,
  sampling: SamplingModule,
  quant: QuantModule,
  binary: BinaryModule,
  adc: AdcModule,
  processing: ProcessingModule,
  dac: DacModule,
  errors: ErrorsModule,
};

export function DigitalModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DigitalModule'>>();
  const focused = useIsFocused();
  const meta = DIGITAL_MODULES.find((m) => m.id === route.params.id) ?? DIGITAL_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  // R6c: mark this module viewed → the Digital Audio Systems lab completes once
  // every module has been seen (fires mark_lab_complete server-side).
  useEffect(() => {
    if (focused) markLabUnit('af_digital_audio', meta.id);
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
  // Module navigation is the SHARED strip (kit/LabNavBar, owner 2026-09-30):
  // ⏮ / ‹ PREV / MODULE n / N ▾ (CONTENTS) / NEXT › — FINISH › on the last
  // module. The hook owns the 400 ms double-tap lock (bug hunt 2026-09-30: a
  // double-tap on NEXT at the second-last module used to skip the last one)
  // and decides which of the host's go / finish / unEnd to call; the host
  // keeps persistence and the in-place param swap (no stacked screens).
  const idx = DIGITAL_MODULES.findIndex((m) => m.id === meta.id);
  const last = DIGITAL_MODULES.length - 1;
  // THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
  // lab ends with a 'what's left' screen"). FINISH swaps LabEndScreen in for
  // the module: what is still to do (jump links), PRACTISE AGAIN from module 1
  // (clears nothing — banked credit stays), DONE back to the lab home.
  const [ending, setEnding] = useState(false);
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: DigitalModuleId }) => void }).setParams({ id: DIGITAL_MODULES[i].id });
  };
  const banked = useLabClearedUnits('af_digital_audio');
  const nav = useLabNav({
    units: DIGITAL_MODULES.map((m) => ({ id: m.id, title: m.title, done: banked.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="Digital Audio Sampling & Conversion Lab"
      units={DIGITAL_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={banked}
      mode="credit"
      onJump={(id) => goToModule(DIGITAL_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => navigation.goBack()}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader title={meta.title.toUpperCase()} subtitle="Digital Audio Sampling & Conversion Lab" right={<AccuracyNote compact />} />
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
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('digital')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
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
