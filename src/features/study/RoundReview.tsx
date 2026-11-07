/**
 * The end-of-round review panel shared by Fill-in-the-Blank and Matching
 * (studyRounds.ts says why). Same look as the review surfaces already in the
 * app: the Scenarios round report's header and cards, the Results screen's
 * red "Your answer" line, and the flashcard's quiet "Research and learn more ·
 * View images" line under each term.
 *
 * NEW COPY (2026-11-07), for the owner's review: "ROUND REVIEW", the lede,
 * "MISSED", "Your answer:" (as on the Results screen) and "Next round".
 */
import { useEffect } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import { readingColumn } from '../../theme/readingColumn';
import { ResearchMoreLink } from '../research/ResearchMoreLink';
import { StudyHeader } from '../../screens/study/StudyHeader';
import type { MethodKey } from '../../components/MethodIcon';
import type { RoundEntry } from './studyRounds';

export function RoundReview({
  method,
  title,
  subtitle,
  entries,
  showYourAnswer,
  onContinue,
  topInset,
}: {
  method: MethodKey;
  title: string;
  subtitle?: string;
  entries: readonly RoundEntry[];
  /** Fill-in: name the wrong pick, as the Results screen does. */
  showYourAnswer: boolean;
  onContinue: () => void;
  topInset: number;
}) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Round review.');
  }, []);
  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StudyHeader method={method} title={title} subtitle={subtitle} hideTimerButton />
        <Text style={styles.kicker}>ROUND REVIEW</Text>
        <Text style={styles.lede}>The terms from this round. Any of them can be explored further on the web.</Text>
        {entries.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.termRow}>
              <Text style={styles.term}>{e.term}</Text>
              {e.missed ? <Text style={styles.missed}>MISSED</Text> : null}
            </View>
            <Text style={styles.definition} numberOfLines={3}>
              {e.definition}
            </Text>
            {showYourAnswer && e.missed && e.lastWrong ? (
              <Text style={styles.yours}>Your answer: {e.lastWrong}</Text>
            ) : null}
            <ResearchMoreLink term={e.term} wikipediaUrl={e.wikipediaUrl} searchQuery={e.searchQuery} textStyle={styles.link} />
          </View>
        ))}
        <View style={styles.actions}>
          <StudioButton label="Next round" variant="success" onPress={onContinue} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, gap: 12, ...readingColumn },
  // Scenarios' round report: mono kicker, then the cards.
  kicker: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.textSubAlt, marginTop: 4 },
  lede: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSub },
  card: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairlineAlt, backgroundColor: '#161616', padding: 14, gap: 6 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  term: { flexShrink: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.4, color: colors.textPrimary },
  missed: { marginLeft: 'auto', fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: '#ff6b5b' },
  definition: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  // The Results screen's "Your answer" red.
  yours: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: '#ff6b5b' },
  link: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },
  actions: { marginTop: 6 },
});
