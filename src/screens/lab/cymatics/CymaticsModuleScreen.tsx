/**
 * CymaticsModuleScreen — routes one Cymatics Lab module id to its component
 * (Digital Lab host idiom): header (back + title), prev/next module nav,
 * scroll well, and the shared GuidedLessonSheet on the 'cymatics' lesson.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { ScrollLockProvider } from '../LabShell';
import { CYMATICS_MODULES, type CymaticsModuleId } from './modules/registry';
import { IntroModule } from './modules/modIntro';
import { NodesModule } from './modules/modNodes';
import { HarmonicsModule } from './modules/modHarmonics';
import { MythModule } from './modules/modMyth';
import { HarmonyModule } from './modules/modHarmony';
import { SystemsModule } from './modules/modSystems';
import { ChangeModule } from './modules/modChange';
import { ExperimentsModule } from './modules/modExperiments';

export type CymaticsModuleProps = {
  width: number;
  focused: boolean;
  help: (key?: string) => void;
  lockScroll?: (v: boolean) => void;
};

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
  const idx = CYMATICS_MODULES.findIndex((m) => m.id === meta.id);
  const last = CYMATICS_MODULES.length - 1;
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    (navigation as { setParams: (p: { id: CymaticsModuleId }) => void }).setParams({ id: CYMATICS_MODULES[i].id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>{meta.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Cymatics Lab: Sound Made Visible</Text>
        </View>
        <AccuracyNote compact />
      </View>
      <View style={styles.topNav}>
        <Pressable onPress={() => goToModule(idx - 1)} disabled={idx <= 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous module">
          <Text style={[styles.navBtn, idx <= 0 && styles.navBtnDisabled]}>‹ PREV</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.navPos}>MODULE {idx + 1} / {CYMATICS_MODULES.length}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => goToModule(idx + 1)} disabled={idx >= last} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next module">
          <Text style={[styles.navBtn, idx >= last && styles.navBtnDisabled]}>NEXT ›</Text>
        </Pressable>
      </View>
      <ScrollLockProvider value={setScrollLocked}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" scrollEnabled={!scrollLocked}>
          <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
            {width > 0 ? <Comp width={width} focused={focused} help={help} lockScroll={setScrollLocked} /> : null}
          </View>
          <Pressable style={styles.lessonRow} onPress={() => help()} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
            <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
          </Pressable>
        </ScrollView>
      </ScrollLockProvider>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('cymatics')} controlKey={lessonKey} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amber },
  navBtnDisabled: { opacity: 0.3 },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSub },
  scroll: { padding: 16, paddingTop: 6, paddingBottom: 32, gap: 12 },
  lessonRow: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#232329', paddingVertical: 12, paddingHorizontal: 14 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
});
