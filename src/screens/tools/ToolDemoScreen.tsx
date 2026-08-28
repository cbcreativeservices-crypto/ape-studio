/**
 * ToolDemoScreen — per-tool DEMO mode host (Phase 1, spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §4 Demo; ruling 2026-07-23: demos are
 * VISUAL/ANIMATED ONLY until an audio output path exists in the app).
 *
 * INTEGRITY (spec §5): the permanent "TRAINING DEMO — NOT A LIVE MEASUREMENT"
 * badge is rendered HERE, above whatever the demo component shows — simulated
 * values may only ever appear under this label. Academy-gated like Learn mode.
 * A missing demo renders an honest "no visual demo for this tool" card.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TOOL_DEMOS } from '../../components/tooldemos';
import { useToolsLocked } from './ToolLockUi';
import { colors, fonts } from '../../theme/tokens';
import { ToolAcademyLock } from './ToolAcademyLock';
import { toolByKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ToolDemo'>;

export function ToolDemoScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const tool = toolByKey(route.params.toolKey);
  // Gate on REAL standing, not caps (house rule, ToolLockUi header). Aligned 2026-08-28.
  const locked = useToolsLocked();
  const Demo = TOOL_DEMOS[tool.key];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Demo — see correct and incorrect use</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {locked ? (
          <ToolAcademyLock
            what={`The ${tool.name} demo`}
            onUpgrade={() => navigation.navigate('Paywall')}
          />
        ) : (
          <>
            {/* Required integrity label (spec §5) — permanent, above any demo. */}
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>TRAINING DEMO — NOT A LIVE MEASUREMENT</Text>
            </View>

            {Demo ? (
              <Demo />
            ) : (
              <View style={styles.authoringCard}>
                <Text style={styles.authoringTitle}>NO VISUAL DEMO FOR THIS TOOL</Text>
                <Text style={styles.authoringBody}>
                  Demos use labeled sample data and animations only — never simulated readings
                  presented as live.
                </Text>
              </View>
            )}

            <Text style={styles.footNote}>
              Demos are visual and silent. Values shown are training examples, not measurements.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },

  demoBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,141,122,.55)',
    backgroundColor: '#1c0f0b',
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoBadgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6, color: '#ff8d7a' },

  authoringCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 14,
    gap: 6,
  },
  authoringTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  authoringBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  footNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
