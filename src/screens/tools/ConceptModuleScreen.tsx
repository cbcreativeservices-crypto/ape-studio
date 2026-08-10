/**
 * ConceptModuleScreen — one professional-measurement concept module (Phase 1,
 * spec of record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §15: the Smaart-style
 * concepts taught as tutorials, NOT as live tools — §3/§14 keep magnitude
 * response, delay finding, and coherence out of live scope).
 *
 * Academy-gated like Learn mode. Missing module (no content for this item)
 * renders an honest state.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { conceptByKey } from '../../features/tools/learn';
import { colors, fonts } from '../../theme/tokens';
import { ToolAcademyLock } from './ToolAcademyLock';
import { toolByKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ConceptModule'>;

export function ConceptModuleScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { commercialMode, caps } = useEntitlement();
  const locked = commercialMode && !caps.audioTools;
  const mod = conceptByKey(route.params.conceptKey);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.eyebrow}>PROFESSIONAL MEASUREMENT CONCEPT</Text>
          <Text style={styles.title}>{mod ? mod.title : 'Concept Module'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {locked ? (
          <ToolAcademyLock what="This concept module" onUpgrade={() => navigation.navigate('Paywall')} />
        ) : !mod ? (
          <View style={styles.authoringCard}>
            <Text style={styles.authoringTitle}>MODULE NOT AVAILABLE</Text>
            <Text style={styles.authoringBody}>There is no concept module for this item.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.intro}>{mod.intro}</Text>

            {mod.sections.map((s) => (
              <View key={s.head} style={styles.section}>
                <Text style={styles.sectionHead}>{s.head}</Text>
                <Text style={styles.sectionBody}>{s.body}</Text>
              </View>
            ))}

            {mod.keyPoints.length > 0 && (
              <View style={styles.keyCard}>
                <Text style={styles.keyHead}>KEY POINTS</Text>
                {mod.keyPoints.map((p) => (
                  <Text key={p} style={styles.keyPoint}>
                    {'▸  '}
                    {p}
                  </Text>
                ))}
              </View>
            )}

            {mod.relatedTools.length > 0 && (
              <>
                <Text style={styles.groupHead}>SEE IT IN THE TOOLS</Text>
                {mod.relatedTools.map((k) => {
                  const t = toolByKey(k);
                  return (
                    <Pressable
                      key={k}
                      style={styles.toolRow}
                      onPress={() =>
                        // The Frequency Counter has its own modes+results screen;
                        // the rest open their info screen (mirrors ToolsHub —
                        // review 2026-07-23: ToolInfo('hzcounter') was a dead end).
                        k === 'hzcounter'
                          ? navigation.navigate('FrequencyCounter')
                          : navigation.navigate('ToolInfo', { toolKey: k })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={t.name}
                    >
                      <Text style={styles.toolRowText}>{t.name}</Text>
                      <Text style={styles.toolRowChevron}>›</Text>
                    </Pressable>
                  );
                })}
              </>
            )}
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
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 2, color: '#7a7a7a' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.8, color: colors.textPrimary, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },

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

  intro: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  section: { gap: 5 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel },
  sectionBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21.5, color: colors.textSecondary },

  keyCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(91,255,133,.35)',
    backgroundColor: '#0d1710',
    padding: 14,
    gap: 7,
    marginTop: 4,
  },
  keyHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: '#5bff85' },
  keyPoint: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },

  groupHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 6,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  toolRowText: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 14.5, color: colors.textPrimary },
  toolRowChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
});
