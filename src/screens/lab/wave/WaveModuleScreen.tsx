/**
 * WaveModuleScreen — hosts one Wave Physics module (all 15 + Room Builder are
 * presets of the one engine). The shared lab header + navigation strip
 * (kit/LabNavBar), scroll, and the 'wave' guided lesson wired into every
 * module's ⓘ/long-press help.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { markLabUnit, useLabClearedUnits, useLabCompletionUnreadable } from '../../../features/lab/labCompletion';
import { LabEndScreen } from '../kit/LabEndScreen';
import { GuestStartReminder } from '../../../features/lab/GuestStartReminder';
import { LabHeader, LabNavBar, LabNavProvider, LabNextButton, useLabNav } from '../kit/LabNavBar';
import { ScrollLockProvider } from '../LabShell';
import { LabPhotoLightbox } from '../labPhoto';
import { WAVE_MODULES, type WaveModuleId } from './modules/registry';
import {
  ReflectionModule, AbsorptionModule, DiffusionModule, RefractionModule,
  DiffractionModule, InterferenceModule, CombModule, StandingWaveModule,
} from './modules/modWaveA';
import {
  CoverageModule, LineArrayModule, DelayAlignModule, CardioidSubModule,
  BeamSteerModule, EchoModule, ReverbModule, RoomBuilderModule,
} from './modules/modWaveB';
// Tablet (owner 2026-09-29): a reading surface - capped at the reading column
// and centred instead of running 990 pt wide. No-op on a phone.
import { readingColumn } from '../../../theme/readingColumn';
import { safeGoBack } from '../../../lib/safeGoBack';

export type WaveModuleProps = {
  width: number;
  focused: boolean;
  help: (key?: string) => void;
  /** Optional scroll-lock (owner 2026-07-29 drag-vs-scroll fix): a module may
   *  call lockScroll(true) at drag start / (false) on release so its gesture
   *  (e.g. RoomSceneView object drags) wins over the host ScrollView.
   *  Plumbed now; modules adopt as needed. */
  lockScroll?: (v: boolean) => void;
};

/** Rack-mode modules (APE_LAB_UX_PROPOSAL 2026-08-23): these pass `rack` to
 *  WaveLayout, which renders the RackUnit frame (pinned stage + dock, its own
 *  scroll well) — the host gives them the full height, no ScrollView, and no
 *  bottom lesson row (the rack well carries its own). */
const RACK_MODULES = new Set<WaveModuleId>([
  'builder',
  'reflection',
  'absorption',
  'diffusion',
  'refraction',
  'diffraction',
  'interference',
  'comb',
  'standing',
  'coverage',
  'linearray',
  'delayalign',
  'cardioidsub',
  'beamsteer',
  'echo',
  'reverb',
]);

const COMPONENTS: Record<WaveModuleId, (p: WaveModuleProps) => React.JSX.Element> = {
  builder: RoomBuilderModule,
  reflection: ReflectionModule,
  absorption: AbsorptionModule,
  diffusion: DiffusionModule,
  refraction: RefractionModule,
  diffraction: DiffractionModule,
  interference: InterferenceModule,
  comb: CombModule,
  standing: StandingWaveModule,
  coverage: CoverageModule,
  linearray: LineArrayModule,
  delayalign: DelayAlignModule,
  cardioidsub: CardioidSubModule,
  beamsteer: BeamSteerModule,
  echo: EchoModule,
  reverb: ReverbModule,
};

export function WaveModuleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'WaveModule'>>();
  const focused = useIsFocused();
  const meta = WAVE_MODULES.find((m) => m.id === route.params.id) ?? WAVE_MODULES[0];
  const Comp = COMPONENTS[meta.id];
  // R6c: mark this module viewed → the Wave Physics lab completes once every
  // module has been seen (fires mark_lab_complete server-side).
  useEffect(() => {
    if (focused) markLabUnit('af_wave_physics', meta.id);
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
  // Module navigation is the SHARED strip (kit/LabNavBar, owner 2026-09-30).
  // The hook owns the 400 ms double-tap lock (bug hunt 2026-09-30: a double-tap
  // on NEXT at the second-last module used to skip the last one) and calls the
  // host's go / finish / unEnd; the host keeps the in-place param swap (no
  // stacked screens).
  const idx = WAVE_MODULES.findIndex((m) => m.id === meta.id);
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
    if (i < 0 || i >= WAVE_MODULES.length) return;
    setEnding(false);
    (navigation as { setParams: (p: { id: WaveModuleId }) => void }).setParams({ id: WAVE_MODULES[i].id });
  };
  const banked = useLabClearedUnits('af_wave_physics');
  // A failed read of the banked units is said, never shown as all left (owner 2026-10-03, "do 2").
  const progressUnreadable = useLabCompletionUnreadable();
  const nav = useLabNav({
    units: WAVE_MODULES.map((m) => ({ id: m.id, title: m.title, done: banked.has(m.id) })),
    index: idx,
    ending,
    go: goToModule,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => goToModule(0) },
  });
  const endScreen = ending ? (
    <LabEndScreen
      labTitle="Wave Physics Laboratory"
      units={WAVE_MODULES.map((m) => ({ id: m.id, label: m.title }))}
      cleared={banked}
      unreadable={progressUnreadable}
      mode="credit"
      onJump={(id) => goToModule(WAVE_MODULES.findIndex((m) => m.id === id))}
      onPracticeAgain={() => goToModule(0)}
      onDone={() => safeGoBack(navigation)}
      bottomInset
    />
  ) : null;

  return (
    <LabNavProvider value={nav}>
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared header: ‹ LEAVES THE LAB (kit/LabNavBar). */}
      <LabHeader title={meta.title.toUpperCase()} subtitle="Wave Physics Laboratory" right={<AccuracyNote compact />} />
      <LabNavBar nav={nav} />
      {/* A module opened straight (a deep link) still reminds a guest first;
          from the hub it was already shown — one id for the whole lab. */}
      {endScreen ? null : <GuestStartReminder activity="lab:af_wave_physics" style={styles.guestNote} />}
      {endScreen ?? (
        <ScrollLockProvider value={setScrollLocked}>
        {RACK_MODULES.has(meta.id) ? (
          // Rack module: full height — WaveLayout's RackUnit pins stage + dock
          // and owns the scroll well (incl. its own guided-lesson entry row).
          <View style={styles.rackFill} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
            {width > 0 ? (
              <LabPhotoLightbox>
                <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} />
              </LabPhotoLightbox>
            ) : null}
          </View>
        ) : (
        <ScrollView contentContainerStyle={[styles.scroll, readingColumn]} keyboardShouldPersistTaps="handled" scrollEnabled={!scrollLocked}>
          <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
            {width > 0 ? (
              <LabPhotoLightbox>
                <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} />
              </LabPhotoLightbox>
            ) : null}
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
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('wave')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  rackFill: { flex: 1 },
  guestNote: { marginHorizontal: 16 },
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
