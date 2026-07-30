/**
 * MeterModuleScreen — hosts one Visual Audio Analysis module. Shared header,
 * scroll, and the 'meter' guided lesson wired into every ⓘ/long-press help.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { METER_MODULES, type MeterModuleId } from './modules/registry';
import { WaveformModule, PeakModule, VuModule, LoudnessModule } from './modules/modMeterA';
import { SpectrumModule, SpectrogramModule, WaterfallModule } from './modules/modMeterB';
import { PhaseModule, StereoModule, ScopeModule, DetectiveModule } from './modules/modMeterC';

export type MeterModuleProps = { width: number; focused: boolean; help: (key?: string) => void };

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
          <Text style={styles.subtitle}>Visual Audio Analysis Lab</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
          {width > 0 ? <Comp width={width} focused={focused} help={help} /> : null}
        </View>
      </ScrollView>
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
});
