/**
 * EqModuleScreen — routes one EQ Lab module id to its component (Digital Lab
 * host idiom). ScrollLockProvider wraps the ScrollView so DragSliders inside
 * modules win their horizontal drags over the vertical scroll (owner
 * 2026-07-30 drag-vs-scroll rule — the sliders grab the lock via context).
 * No GuidedLessonSheet yet — the 'eq' lesson belongs to the audible Equalizer
 * effect lab; this lab gets its own entry when the content registry grows one.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { ScrollLockProvider } from '../LabShell';
import { EQ_MODULES, type EqModuleComponentProps, type EqModuleId } from './modules/registry';
import { SeeingFrequencyModule } from './modules/SeeingFrequency';
import { WhyEqModule } from './modules/WhyEq';
import { CameraAnalogyModule } from './modules/CameraAnalogy';
import { ParametricControlsModule } from './modules/ParametricControls';
import { QBandwidthModule } from './modules/QBandwidth';

const COMPONENTS: Record<EqModuleId, (p: EqModuleComponentProps) => React.JSX.Element> = {
  spectrum: SeeingFrequencyModule,
  whyEq: WhyEqModule,
  camera: CameraAnalogyModule,
  parametric: ParametricControlsModule,
  qband: QBandwidthModule,
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
  const idx = EQ_MODULES.findIndex((m) => m.id === meta.id);
  const last = EQ_MODULES.length - 1;
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    (navigation as { setParams: (p: { id: EqModuleId }) => void }).setParams({ id: EQ_MODULES[i].id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{meta.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>EQ Lab</Text>
        </View>
      </View>
      {/* Module nav appears once there's more than one live module. */}
      {EQ_MODULES.length > 1 && (
        <View style={styles.topNav}>
          <Pressable onPress={() => goToModule(idx - 1)} disabled={idx <= 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous module">
            <Text style={[styles.navBtn, idx <= 0 && styles.navBtnDisabled]}>‹ PREV</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Text style={styles.navPos}>MODULE {idx + 1} / {EQ_MODULES.length}</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => goToModule(idx + 1)} disabled={idx >= last} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next module">
            <Text style={[styles.navBtn, idx >= last && styles.navBtnDisabled]}>NEXT ›</Text>
          </Pressable>
        </View>
      )}
      <ScrollLockProvider value={setScrollLocked}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!scrollLocked}
        >
          <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width) - 26)}>
            {width > 0 ? <Comp width={width} focused={focused} /> : null}
          </View>
        </ScrollView>
      </ScrollLockProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  topNav: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 6 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  navBtnDisabled: { color: '#45454d' },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
});
