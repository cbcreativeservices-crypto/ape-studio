/**
 * WaveModuleScreen — hosts one Wave Physics module (all 15 + Room Builder are
 * presets of the one engine). Shared header, scroll, and the 'wave' guided
 * lesson wired into every module's ⓘ/long-press help.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { WAVE_MODULES, type WaveModuleId } from './modules/registry';
import {
  ReflectionModule, AbsorptionModule, DiffusionModule, RefractionModule,
  DiffractionModule, InterferenceModule, CombModule, StandingWaveModule,
} from './modules/modWaveA';
import {
  CoverageModule, LineArrayModule, DelayAlignModule, CardioidSubModule,
  BeamSteerModule, EchoModule, ReverbModule, RoomBuilderModule,
} from './modules/modWaveB';

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
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{meta.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Wave Physics Laboratory</Text>
        </View>
      </View>
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
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('wave')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
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
