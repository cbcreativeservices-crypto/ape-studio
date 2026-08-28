/**
 * ToolLearnScreen — per-tool guided LEARN mode (Phase 1, spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §4). Renders the tool's authored
 * ToolLearnContent: teaching sections, common misconceptions (claim → truth),
 * the tool's warnings explained, glossary terms it demonstrates (tool-depth
 * rule, Booth 2026-07-18), and links to related concept modules.
 *
 * Academy-gated (ruling 2026-07-23): the tools stay free to open; tutorials
 * are the Academy unlock (matches the ratified marketing copy). Missing content
 * renders an honest "in authoring" card — never filler pretending to teach.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToolsLocked } from './ToolLockUi';
import { CONCEPT_MODULES, TOOL_LEARN } from '../../features/tools/learn';
import { colors, fonts } from '../../theme/tokens';
import { ToolAcademyLock } from './ToolAcademyLock';
import { toolByKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ToolLearn'>;

export function ToolLearnScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const tool = toolByKey(route.params.toolKey);
  // Gate on REAL standing, not caps (house rule, ToolLockUi header) — caps are
  // forced to academy by the dev bypass, so this destination used to unlock
  // while its entry points stayed locked. Aligned 2026-08-28.
  const locked = useToolsLocked();
  const content = TOOL_LEARN[tool.key];
  const related = content
    ? CONCEPT_MODULES.filter((m) => content.relatedConcepts.includes(m.key))
    : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Learn — guided measurement training</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {locked ? (
          <ToolAcademyLock
            what={`The ${tool.name} tutorial`}
            onUpgrade={() => navigation.navigate('Paywall')}
          />
        ) : !content ? (
          // Honest authoring state — no placeholder teaching text.
          <View style={styles.authoringCard}>
            <Text style={styles.authoringTitle}>TUTORIAL IN AUTHORING</Text>
            <Text style={styles.authoringBody}>
              The guided tutorial for this tool is being written. The tool's reference page (purpose,
              what it measures, what it does not) is available now from its info screen.
            </Text>
          </View>
        ) : (
          <>
            {content.sections.map((s) => (
              <View key={s.head} style={styles.section}>
                <Text style={styles.sectionHead}>{s.head}</Text>
                <Text style={styles.sectionBody}>{s.body}</Text>
              </View>
            ))}

            {content.misconceptions.length > 0 && (
              <>
                <Text style={styles.groupHead}>COMMON MISUNDERSTANDINGS</Text>
                {content.misconceptions.map((m) => (
                  <View key={m.claim} style={styles.misCard}>
                    <Text style={styles.misClaim}>“{m.claim}”</Text>
                    <Text style={styles.misTruth}>{m.truth}</Text>
                  </View>
                ))}
              </>
            )}

            {content.warnings.length > 0 && (
              <>
                <Text style={styles.groupHead}>WARNINGS YOU WILL SEE — AND WHY</Text>
                {content.warnings.map((w) => (
                  <View key={w.text} style={styles.warnCard}>
                    <Text style={styles.warnText}>{w.text}</Text>
                    <Text style={styles.warnWhy}>{w.why}</Text>
                  </View>
                ))}
              </>
            )}

            {content.glossaryTerms.length > 0 && (
              <>
                <Text style={styles.groupHead}>GLOSSARY TERMS THIS TOOL DEMONSTRATES</Text>
                <View style={styles.termWrap}>
                  {content.glossaryTerms.map((t) => (
                    <View key={t} style={styles.termChip}>
                      <Text style={styles.termChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {related.length > 0 && (
              <>
                <Text style={styles.groupHead}>PROFESSIONAL MEASUREMENT CONCEPTS</Text>
                {related.map((m) => (
                  <Pressable
                    key={m.key}
                    style={styles.conceptRow}
                    onPress={() => navigation.navigate('ConceptModule', { conceptKey: m.key })}
                    accessibilityRole="button"
                    accessibilityLabel={m.title}
                  >
                    <Text style={styles.conceptNum}>{String(m.num).padStart(2, '0')}</Text>
                    <Text style={styles.conceptTitle}>{m.title}</Text>
                    <Text style={styles.conceptChevron}>›</Text>
                  </Pressable>
                ))}
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
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
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

  section: { gap: 5 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.8, color: colors.amberLabel },
  sectionBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21.5, color: colors.textSecondary },

  groupHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 8,
  },
  misCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 5,
  },
  misClaim: { fontFamily: fonts.barlowSemiBold, fontStyle: 'italic', fontSize: 14, color: '#ff8d7a' },
  misTruth: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },

  warnCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.35)',
    backgroundColor: '#161206',
    padding: 12,
    gap: 4,
  },
  warnText: { fontFamily: fonts.barlowSemiBold, fontSize: 13.5, color: colors.amber },
  warnWhy: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },

  termWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  termChip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.45)',
    backgroundColor: '#0e1420',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  termChipText: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#7fbfff' },

  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  conceptNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  conceptTitle: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 14.5, color: colors.textPrimary },
  conceptChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
});
