/**
 * CymaticsModuleScreen — routes one Cymatics Lab module id to its component
 * (Digital Lab host idiom): the shared lab header + navigation strip
 * (kit/LabNavBar), scroll well, and the shared GuidedLessonSheet on the
 * 'cymatics' lesson.
 *
 * RACK MODULES (APE_LAB_UX_PROPOSAL 2026-08-23; the Wave host precedent): an
 * interactive module in RACK_MODULES renders the Rack Unit itself
 * (CymaticsRackLayout — pinned stage + dock, its own scroll well with the
 * LAB NOTES disclosure and the lesson row), so the host gives it the full
 * height, no ScrollView, and no bottom lesson row. Prose-only modules keep
 * the document layout — the spec never converts them.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { ScrollLockProvider } from '../LabShell';
import { markLabVisit, useLabVisits } from '../../../features/lab/labVisits';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { CYMATICS_MODULES, type CymaticsModuleId } from './modules/registry';
import { IntroModule } from './modules/modIntro';
import { NodesModule } from './modules/modNodes';
import { HarmonicsModule } from './modules/modHarmonics';
import { MythModule } from './modules/modMyth';
import { HarmonyModule } from './modules/modHarmony';
import { SystemsModule } from './modules/modSystems';
import { ChangeModule } from './modules/modChange';
import { ExperimentsModule } from './modules/modExperiments';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';

export type CymaticsModuleProps = {
  width: number;
  focused: boolean;
  help: (key?: string) => void;
  lockScroll?: (v: boolean) => void;
};

/** Modules that declare a Rack Unit (see rackLayout.tsx). */
const RACK_MODULES = new Set<CymaticsModuleId>(['nodes', 'harmony', 'systems', 'change']);

const COMPONENTS: Record<CymaticsModuleId, (p: CymaticsModuleProps) => React.JSX.Element> = {
  intro: IntroModule,
  nodes: NodesModule,
  harmonics: HarmonicsModule,
  harmony: HarmonyModule,
  systems: SystemsModule,
  change: ChangeModule,
  myth: MythModule,
  experiments: ExperimentsModule,
};

export function CymaticsModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CymaticsModule'>>();
  const focused = useIsFocused();
  const meta = CYMATICS_MODULES.find((m) => m.id === route.params.id) ?? CYMATICS_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  const [width, setWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const help = (k?: string) => {
    setLessonKey(k);
    setLessonOpen(true);
  };
  // Module navigation is the SHARED strip (kit/LabNavBar, owner 2026-09-30).
  // The hook owns the 400 ms double-tap lock (bug hunt 2026-09-30: a double-tap
  // on NEXT at the second-last module used to skip the last one) and calls the
  // host's go / finish / unEnd; the host keeps the in-place param swap.
  const idx = CYMATICS_MODULES.findIndex((m) => m.id === meta.id);
  const last = CYMATICS_MODULES.length - 1;
  // THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
  // lab ends with a 'what's left' screen"). FINISH swaps LabEndScreen in for
  // the module: what is still to do (jump links), PRACTISE AGAIN from module 1
  // (clears nothing), DONE back to the lab home.
  const [ending, setEnding] = useState(false);
  // A drag's scroll lock is released by its own release/terminate — which
  // never arrives when the module unmounts mid-drag (a second finger on
  // NEXT / FINISH). Free it on every module or end-screen change, or the
  // next reading page cannot scroll (bug pass 2026-10-01).
  useEffect(() => setScrollLocked(false), [meta.id, ending]);
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: CymaticsModuleId }) => void }).setParams({ id: CYMATICS_MODULES[i].id });
  };
  // This lab banks no credit and kept no record, so it remembers which
  // modules were OPENED (labVisits — progress, never credit). Guests: this
  // session only (house guest rule, owner 2026-08-12).
  const guest = useLabEndGuest();
  const visited = useLabVisits('cymatics');
  useEffect(() => {
    if (focused) markLabVisit('cymatics', meta.id, { persist: !guest });
  }, [focused, meta.id, guest]);
  const nav = useLabNav({
    units: CYMATICS_MODULES.map((m) => ({ id: m.id, title: m.title, done: visited.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="Cymatics Lab: Sound Made Visible"
      units={CYMATICS_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={visited}
      mode="progress"
      onJump={(id) => goToModule(CYMATICS_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => navigation.goBack()}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader title={meta.title.toUpperCase()} subtitle="Cymatics Lab: Sound Made Visible" right={<AccuracyNote compact />} />
      <LabNavBar nav={nav} />
      {endScreen ?? (
        <ScrollLockProvider value={setScrollLocked}>
          {RACK_MODULES.has(meta.id) ? (
            // Rack module: full height — its RackUnit pins stage + dock and owns
            // the scroll well (incl. the LAB NOTES disclosure and the lesson row).
            <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 24)}>
              {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
            </View>
          ) : (
            <ScrollView contentContainerStyle={[styles.scroll, readingColumn]} keyboardShouldPersistTaps="handled" scrollEnabled={!scrollLocked}>
              <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
                {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
              </View>
              <Pressable style={styles.lessonRow} onPress={() => help()} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
                <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
              </Pressable>
              {/* The in-flow NEXT at the end of the reading (a rack well gets it from RackUnit). */}
              <LabNextButton />
            </ScrollView>
          )}
        </ScrollLockProvider>
      )}
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, paddingTop: 6, paddingBottom: 32, gap: 12 },
  rackFill: { flex: 1 },
  lessonRow: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#232329', paddingVertical: 12, paddingHorizontal: 14 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
});
