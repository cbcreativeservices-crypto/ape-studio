/**
 * GainModuleScreen — routes one Gain Staging Lab module id to its component
 * (EQ Lab host idiom): GlossaryLinkProvider (in-place term popups) +
 * ScrollLockProvider (DragSliders win their horizontal drags) + prev/next
 * module nav.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { ScrollLockProvider } from '../LabShell';
import { GlossaryLinkProvider } from '../../../features/glossary/glossaryLink';
import { GAIN_MODULES, type GainModuleComponentProps, type GainModuleId } from './modules/registry';
import { FaderVsGainModule, FollowModule, InputGainModule, IntroModule, LowHighModule } from './modules/modLearn';
import { FreePlayModule, MultiStageModule, TroubleshootModule } from './modules/modExplore';

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
  const [width, setWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const idx = GAIN_MODULES.findIndex((m) => m.id === meta.id);
  const last = GAIN_MODULES.length - 1;
  const goToModule = (i: number) => {
    if (i < 0 || i > last) return;
    (navigation as { setParams: (p: { id: GainModuleId }) => void }).setParams({ id: GAIN_MODULES[i].id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{meta.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Gain Staging Lab</Text>
        </View>
      </View>
      <View style={styles.topNav}>
        <Pressable onPress={() => goToModule(idx - 1)} disabled={idx <= 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous module">
          <Text style={[styles.navBtn, idx <= 0 && styles.navBtnDisabled]}>‹ PREV</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.navPos}>MODULE {idx + 1} / {GAIN_MODULES.length}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => goToModule(idx + 1)} disabled={idx >= last} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next module">
          <Text style={[styles.navBtn, idx >= last && styles.navBtnDisabled]}>NEXT ›</Text>
        </Pressable>
      </View>
      <GlossaryLinkProvider>
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
      </GlossaryLinkProvider>
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
