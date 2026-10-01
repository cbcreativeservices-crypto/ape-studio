/**
 * EqModuleScreen — routes one EQ Lab module id to its component (Digital Lab
 * host idiom). ScrollLockProvider wraps the ScrollView so DragSliders inside
 * modules win their horizontal drags over the vertical scroll (owner
 * 2026-07-30 drag-vs-scroll rule — the sliders grab the lock via context).
 * No GuidedLessonSheet yet — the 'eq' lesson belongs to the audible Equalizer
 * effect lab; this lab gets its own entry when the content registry grows one.
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { ScrollLockProvider } from '../LabShell';
import { markLabVisit, useLabVisits } from '../../../features/lab/labVisits';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import { EQ_MODULES, type EqModuleComponentProps, type EqModuleId } from './modules/registry';
import { SeeingFrequencyModule } from './modules/SeeingFrequency';
import { WhyEqModule } from './modules/WhyEq';
import { CameraAnalogyModule } from './modules/CameraAnalogy';
import { ParametricControlsModule } from './modules/ParametricControls';
import { QBandwidthModule } from './modules/QBandwidth';
import { FilterShapesModule } from './modules/FilterShapes';
import { FilterSlopesModule } from './modules/FilterSlopes';
import { GraphicVsParametricModule } from './modules/GraphicVsParametric';
import { GraphicTruthModule } from './modules/GraphicTruth';
import { MultiBandModule } from './modules/MultiBand';
import { LiveSpectrumEqModule } from './modules/LiveSpectrumEq';
import { FindFrequencyModule } from './modules/FindFrequency';
import { MatchCurveModule } from './modules/MatchCurve';
import { FixSignalModule } from './modules/FixSignal';
import { EqChallengesModule } from './modules/EqChallenges';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';

/** Rack-mode modules (APE_LAB_UX_PROPOSAL 2026-08-23) render the RackUnit
 *  frame THEMSELVES — pinned stage + dock with their own scroll well — so the
 *  host must give them the full height and NOT wrap them in a ScrollView. */
const RACK_MODULES = new Set<EqModuleId>([
  'liveEq',
  'spectrum',
  'parametric',
  'qband',
  'shapes',
  'slopes',
  'gvp',
  'graphic',
  'multiband',
  'findFreq',
  'matchCurve',
  'fixSignal',
  // Kept classic (each carries a dated in-file note): whyEq (beginner chip
  // co-visibility), camera (two pixel-aligned panels outgrow the glass),
  // challenges (no continuous teaching parameter).
]);

const COMPONENTS: Record<EqModuleId, (p: EqModuleComponentProps) => React.JSX.Element> = {
  spectrum: SeeingFrequencyModule,
  whyEq: WhyEqModule,
  camera: CameraAnalogyModule,
  parametric: ParametricControlsModule,
  qband: QBandwidthModule,
  shapes: FilterShapesModule,
  slopes: FilterSlopesModule,
  gvp: GraphicVsParametricModule,
  graphic: GraphicTruthModule,
  multiband: MultiBandModule,
  liveEq: LiveSpectrumEqModule,
  findFreq: FindFrequencyModule,
  matchCurve: MatchCurveModule,
  fixSignal: FixSignalModule,
  challenges: EqChallengesModule,
};

export function EqModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EqModule'>>();
  const focused = useIsFocused();
  const meta = EQ_MODULES.find((m) => m.id === route.params.id) ?? EQ_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  const [width, setWidth] = useState(0);
  // Modules lock the ScrollView during horizontal drags (DragSlider grabs the
  // lock from context — owner 2026-07-30 drag-vs-scroll rule).
  const [scrollLocked, setScrollLocked] = useState(false);
  // Module navigation is the SHARED strip (kit/LabNavBar, owner 2026-09-30).
  // The hook owns the 400 ms double-tap lock (bug hunt 2026-09-30: a double-tap
  // on NEXT at the second-last module used to skip the last one) and calls the
  // host's go / finish / unEnd; the host keeps the in-place param swap.
  const idx = EQ_MODULES.findIndex((m) => m.id === meta.id);
  const last = EQ_MODULES.length - 1;
  // THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
  // lab ends with a 'what's left' screen"). FINISH swaps LabEndScreen in for
  // the module: what is still to do (jump links), PRACTISE AGAIN from module 1
  // (clears nothing), DONE back to the lab home.
  const [ending, setEnding] = useState(false);
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: EqModuleId }) => void }).setParams({ id: EQ_MODULES[i].id });
  };
  // This lab banks no credit and kept no record, so it remembers which
  // modules were OPENED (labVisits — progress, never credit). Guests: this
  // session only (house guest rule, owner 2026-08-12).
  const guest = useLabEndGuest();
  const visited = useLabVisits('eq');
  useEffect(() => {
    if (focused) markLabVisit('eq', meta.id, { persist: !guest });
  }, [focused, meta.id, guest]);
  const nav = useLabNav({
    units: EQ_MODULES.map((m) => ({ id: m.id, title: m.title, done: visited.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="EQ Lab"
      units={EQ_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={visited}
      mode="progress"
      onJump={(id) => goToModule(EQ_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => navigation.goBack()}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader
        title={meta.title.toUpperCase()}
        subtitle="EQ Lab"
        right={<AccuracyNote compact detail="This lab can use your phone’s UNCALIBRATED microphone — read the analysis as relative, for learning. For accurate levels use a calibrated SPL meter or measurement mic." />}
      />
      {/* Module nav appears once there's more than one live module. */}
      {EQ_MODULES.length > 1 && <LabNavBar nav={nav} />}
      <GlossaryLinkProvider>
        {endScreen ?? (
          <ScrollLockProvider value={setScrollLocked}>
            {RACK_MODULES.has(meta.id) ? (
              // Rack module: full height, no host ScrollView — the module's own
              // RackUnit pins stage + dock and owns the scroll well.
              <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
                {width > 0 ? <Comp width={width} focused={focused} /> : null}
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={[styles.scroll, readingColumn]}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!scrollLocked}
              >
                <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
                  {width > 0 ? <Comp width={width} focused={focused} /> : null}
                </View>
                {/* The in-flow NEXT at the end of the reading (a rack well gets it from RackUnit). */}
                <LabNextButton />
              </ScrollView>
            )}
          </ScrollLockProvider>
        )}
      </GlossaryLinkProvider>
    </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  rackFill: { flex: 1 },
});
