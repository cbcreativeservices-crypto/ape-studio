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

export type WaveModuleProps = { width: number; focused: boolean; help: (key?: string) => void };

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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <Comp width={width} focused={focused} help={help} /> : null}
        </View>
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
});
