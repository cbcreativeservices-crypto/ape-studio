/**
 * GainModuleScreen — routes one Gain Staging Lab module id to its component
 * (EQ Lab host idiom): GlossaryLinkProvider (in-place term popups) +
 * ScrollLockProvider (DragSliders win their horizontal drags) + the shared
 * lab header and navigation strip (kit/LabNavBar).
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { ScrollLockProvider } from '../LabShell';
import { markLabUnit, useLabClearedUnits } from '../../../features/lab/labCompletion';
import { LabEndScreen } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import { GAIN_MODULES, type GainModuleComponentProps, type GainModuleId } from './modules/registry';
import { FaderVsGainModule, FollowModule, InputGainModule, IntroModule, LowHighModule } from './modules/modLearn';
import { FreePlayModule, MultiStageModule, TroubleshootModule } from './modules/modExplore';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

/** Rack-mode modules (APE_LAB_UX_PROPOSAL 2026-08-23) render the RackUnit
 *  frame THEMSELVES — pinned stage + dock with their own scroll well — so the
 *  host gives them the full height and no ScrollView. */
const RACK_MODULES = new Set<GainModuleId>([
  'intro',
  'input',
  'follow',
  'lowhigh',
  'fadervsgain',
  'multistage',
  'freeplay',
  'troubleshoot',
]);

const COMPONENTS: Record<GainModuleId, (p: GainModuleComponentProps) => React.JSX.Element> = {
  intro: IntroModule,
  input: InputGainModule,
  follow: FollowModule,
  lowhigh: LowHighModule,
  fadervsgain: FaderVsGainModule,
  multistage: MultiStageModule,
  freeplay: FreePlayModule,
  troubleshoot: TroubleshootModule,
};

export function GainModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'GainModule'>>();
  const focused = useIsFocused();
  const meta = GAIN_MODULES.find((m) => m.id === route.params.id) ?? GAIN_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  // R6c: mark each Gain module viewed. The Troubleshoot CHALLENGE is the
  // exception — it completes on an actual PASS, from inside TroubleshootModule.
  useEffect(() => {
    if (focused && meta.id !== 'troubleshoot') markLabUnit('af_gain_staging', meta.id);
  }, [focused, meta.id]);
  const [width, setWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  // Only let the page scroll when its content actually overflows the viewport.
  // On the compacted slider modules everything fits, so we kill the vertical
  // swipe gesture entirely — it was stealing the DragSliders' horizontal drags
  // (owner 2026-08-10). PREV/NEXT remain the only way between modules.
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const overflows = contentH > viewportH + 2;
  // Module navigation is the SHARED strip (kit/LabNavBar, owner 2026-09-30).
  // The hook owns the 400 ms double-tap lock (bug hunt 2026-09-30: a double-tap
  // on NEXT at the second-last module used to skip the last one) and calls the
  // host's go / finish / unEnd; the host keeps the in-place param swap.
  const idx = GAIN_MODULES.findIndex((m) => m.id === meta.id);
  const last = GAIN_MODULES.length - 1;
  // THE LAST MODULE ENDS ON THE WHAT'S-LEFT SCREEN (owner 2026-09-29: "every
  // lab ends with a 'what's left' screen"). FINISH swaps LabEndScreen in for
  // the module: what is still to do (jump links), PRACTISE AGAIN from module 1
  // (clears nothing — banked credit stays), DONE back to the lab home.
  const [ending, setEnding] = useState(false);
  // A drag's scroll lock is released by its own release/terminate — which
  // never arrives when the module unmounts mid-drag (a second finger on
  // NEXT / FINISH). Free it on every module or end-screen change, or the
  // next reading page cannot scroll (bug pass 2026-10-01).
  useEffect(() => setScrollLocked(false), [meta.id, ending]);
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: GainModuleId }) => void }).setParams({ id: GAIN_MODULES[i].id });
  };
  const banked = useLabClearedUnits('af_gain_staging');
  const nav = useLabNav({
    units: GAIN_MODULES.map((m) => ({ id: m.id, title: m.title, done: banked.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="Gain Staging Lab"
      units={GAIN_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={banked}
      mode="credit"
      onJump={(id) => goToModule(GAIN_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => safeGoBack(navigation)}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader title={meta.title.toUpperCase()} subtitle="Gain Staging Lab" right={<AccuracyNote compact />} />
      <LabNavBar nav={nav} />
      <GlossaryLinkProvider>
        {endScreen ?? (
          <ScrollLockProvider value={setScrollLocked}>
            {RACK_MODULES.has(meta.id) ? (
              // Rack module: full height — the module's RackUnit pins stage +
              // dock and owns the scroll well.
              <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
                {width > 0 ? <Comp width={width} focused={focused} /> : null}
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={[styles.scroll, readingColumn]}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={overflows && !scrollLocked}
                onLayout={(e) => setViewportH(Math.round(e.nativeEvent.layout.height))}
                onContentSizeChange={(_w, h) => setContentH(Math.round(h))}
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
