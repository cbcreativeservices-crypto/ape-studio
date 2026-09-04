/**
 * Audio Career Finder — results (owner brief 2026-09-03).
 *
 * Possibilities, not a verdict: the user's activity profile, the top five
 * families (1–2 STRONGEST MATCHES, 3–5 OTHER PROMISING DIRECTIONS; the first
 * three on larger cards), one family they may not have considered, then the
 * Beta feedback. No percentages anywhere. Every explanation is generated from
 * the family's dimensions and the user's actual scores (scoring.explainFamily).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { sendFeedback } from '../../lib/feedback';
import { DIMENSIONS } from '../../features/careerfinder/dimensions';
import { CLARITY_LABEL, clarityCopy, computeResult, explainFamily, type FamilyScore } from '../../features/careerfinder/scoring';
import { familyFieldOf, familyMetaOf } from '../../features/careerfinder/careerIndex';
import { FAMILY_COUNT } from '../../features/careerfinder/families';
import { QUESTION_COUNT } from '../../features/careerfinder/questions';
import { reopenCareerFinder, resetCareerFinder, setCareerFinderFeedback, toggleSavedFamily, useCareerFinder, type FeedbackAnswer } from '../../features/careerfinder/store';
import { confirmReset } from './CareerFinderScreen';
import { BetaPill, Body, Card, CtaButton, DimChip, DimensionSpectrum, FinderShell, Lead, SectionLabel, TextLink } from './kit';

export const RESULTS_INTRO = 'These results identify audio career families that align with activities you said you might enjoy. They are possibilities to explore — not limits on what you can pursue.';

export function CareerFinderResultsScreen() {
  const navigation = useNavigation();
  const rec = useCareerFinder();
  const result = useMemo(() => computeResult(rec.responses, familyFieldOf), [rec.responses]);
  const strongestCodes = result.strongest.map((d) => d.code);
  const [note, setNote] = useState(rec.feedback?.note ?? '');

  const openFamily = (id: string) => navigation.navigate('CareerFamily', { id, from: 'results' });
  const changeAnswers = () => { reopenCareerFinder(); navigation.navigate('CareerFinderQuiz'); };
  const retake = () => confirmReset(() => { resetCareerFinder(); navigation.navigate('CareerFinderQuiz'); });

  const feedback = (answer: FeedbackAnswer) => setCareerFinderFeedback(answer, note);
  const mailFeedback = () => {
    const fb = rec.feedback;
    sendFeedback('suggestion', 'Audio Career Finder (Beta)', {
      Screen: 'Career Finder results',
      'Gave a direction to explore': fb?.answer ?? '(not answered)',
      'What it misunderstood': note.trim() || '(blank)',
      'Top families': result.top.map((t) => t.family.name).join(' | '),
      'Profile clarity': CLARITY_LABEL[result.clarity],
      'Assessment version': rec.version,
    });
  };

  const FamilyCard = ({ item, size }: { item: FamilyScore; size: 'large' | 'compact' }) => {
    const f = item.family;
    const meta = familyMetaOf(f.id);
    const saved = rec.saved.includes(f.id);
    const explanation = explainFamily(f, result.dims);
    return (
      <Card tone={size === 'large' ? 'raised' : 'plain'} style={{ gap: 8 }}>
        <View style={styles.cardTop}>
          <Text style={styles.rank} accessibilityLabel={`Rank ${item.rank}`}>{item.rank}</Text>
          <Text style={[styles.famName, size === 'compact' && { fontSize: 16 }]} accessibilityRole="header">{f.name}</Text>
        </View>
        {size === 'large' ? <Body>{f.description}</Body> : null}
        <View style={styles.chips}>{f.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}</View>
        <Text style={styles.why}>{explanation}</Text>
        <Text style={styles.examples} accessibilityLabel={`For example: ${f.examples.join(', ')}`}>
          <Text style={styles.examplesLabel}>FOR EXAMPLE  </Text>{f.examples.join(' · ')}{meta ? `  ·  ${meta.count} titles` : ''}
        </Text>
        <View style={styles.cardActions}>
          <Pressable onPress={() => openFamily(f.id)} style={[styles.actBtn, styles.actExplore]} accessibilityRole="button" accessibilityLabel={`Explore ${f.name}`}>
            <Text style={[styles.actText, { color: colors.green }]}>EXPLORE FAMILY ›</Text>
          </Pressable>
          <Pressable onPress={() => toggleSavedFamily(f.id)} style={[styles.actBtn, saved && styles.actSaved]} accessibilityRole="button" accessibilityState={{ selected: saved }} accessibilityLabel={saved ? `Remove ${f.name} from saved` : `Save ${f.name}`}>
            <Text style={[styles.actText, saved && { color: colors.amber }]}>{saved ? '★ SAVED' : '☆ SAVE'}</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  const sectionOf = (rank: number) => (rank <= 2 ? 'strongest' : 'other');
  const groups = { strongest: result.top.filter((t) => sectionOf(t.rank) === 'strongest'), other: result.top.filter((t) => sectionOf(t.rank) === 'other') };

  return (
    <FinderShell kicker="AUDIO CAREER FINDER · RESULTS" title="Your Audio Career Results" onBack={() => navigation.navigate('CareerFinder')} backLabel="Back to the Career Finder" headerRight={<BetaPill />}>
      <Lead>{RESULTS_INTRO}</Lead>

      <Card>
        <View style={styles.profileHead}>
          <SectionLabel tone="cyan">YOUR PROFILE</SectionLabel>
          <Text style={styles.clarity} accessibilityLabel={`Profile clarity: ${CLARITY_LABEL[result.clarity]}`}>{CLARITY_LABEL[result.clarity].toUpperCase()}</Text>
        </View>
        <DimensionSpectrum dims={result.dims} highlight={strongestCodes} />
        <Body>{clarityCopy(result.clarity, result.dims)}</Body>
        {result.strongest.length ? (
          <>
            <Text style={styles.drawn}>Activities you said you would enjoy most</Text>
            <View style={styles.chips}>{result.strongest.map((d) => <DimChip key={d.code} code={d.code} dims={result.dims} />)}</View>
            <Body muted>{result.strongest.map((d) => DIMENSIONS[d.code].measures).join(' ')}</Body>
          </>
        ) : null}
        {result.unknown > 0 ? (
          <Body muted>
            {result.unknown} of {QUESTION_COUNT} answers were “I don’t know enough about this”. Those activities are unexplored, not disliked
            {Object.values(result.dims).some((d) => d.insufficient) ? ' — the dashed bars above had no rating at all.' : '.'}
          </Body>
        ) : null}
      </Card>

      <SectionLabel tone="green">STRONGEST MATCHES</SectionLabel>
      {groups.strongest.map((t) => <FamilyCard key={t.family.id} item={t} size="large" />)}

      <SectionLabel>OTHER PROMISING DIRECTIONS</SectionLabel>
      {groups.other.map((t) => <FamilyCard key={t.family.id} item={t} size={t.rank === 3 ? 'large' : 'compact'} />)}

      {result.surprise ? (
        <>
          <SectionLabel tone="cyan">ONE YOU MAY NOT HAVE CONSIDERED</SectionLabel>
          <Body>Same strongest interest, a different corner of the audio world. Most people have never heard of half the families in this index — that is part of why it exists.</Body>
          <FamilyCard item={result.surprise} size="compact" />
        </>
      ) : null}

      <View style={styles.after}>
        <CtaButton label={`BROWSE ALL ${FAMILY_COUNT} FAMILIES`} onPress={() => navigation.navigate('CareerFamilyList')} />
        <CtaButton label="CHANGE MY ANSWERS" onPress={changeAnswers} hint="Reopens the questions with your answers kept" />
        <CtaButton label="RETAKE FROM SCRATCH" tone="quiet" onPress={retake} hint="Asks before clearing your answers" />
      </View>

      <Card tone="amber">
        <View style={styles.profileHead}>
          <SectionLabel>BETA FEEDBACK</SectionLabel>
          <BetaPill compact />
        </View>
        <Lead>Did these results give you at least one career direction you would explore?</Lead>
        <View style={styles.fbRow} accessibilityRole="radiogroup" accessibilityLabel="Did these results give you a direction to explore">
          {([['yes', 'YES'], ['somewhat', 'SOMEWHAT'], ['no', 'NO']] as const).map(([v, l]) => {
            const on = rec.feedback?.answer === v;
            return (
              <Pressable key={v} onPress={() => feedback(v)} style={[styles.fbBtn, on && styles.fbOn]} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={l}>
                <Text style={[styles.fbText, on && { color: colors.amber }]}>{on ? '✓ ' : ''}{l}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.fbLabel}>What did the Career Finder misunderstand? (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          onBlur={() => { if (rec.feedback) setCareerFinderFeedback(rec.feedback.answer, note); }}
          placeholder="Anything it got wrong, missed, or named badly."
          placeholderTextColor="#5f6068"
          multiline
          style={styles.fbInput}
          accessibilityLabel="What did the Career Finder misunderstand"
        />
        {rec.feedback ? (
          <>
            <Body muted>Saved on this device. To send it to the Academy, use the button below — it opens your mail app with the answer filled in, and you decide whether to send.</Body>
            <CtaButton label="SEND TO THE ACADEMY" onPress={mailFeedback} hint="Opens your mail app. Nothing is sent until you send it." />
          </>
        ) : null}
      </Card>

      <View style={styles.foot}>
        <TextLink label="How this works, and what it does not measure" onPress={() => navigation.navigate('CareerFinderAbout')} />
      </View>
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  profileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clarity: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6 },
  drawn: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rank: { color: colors.amber, fontFamily: fonts.oswaldBold, fontSize: 22, lineHeight: 24, minWidth: 18, textAlign: 'center' },
  famName: { flex: 1, color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 24 },
  why: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  examples: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  examplesLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  actExplore: { flex: 1, borderColor: colors.green, backgroundColor: '#173021', alignItems: 'center' },
  actSaved: { borderColor: 'rgba(255,198,77,0.5)', backgroundColor: '#1a150b' },
  actText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  after: { gap: 8, marginTop: 4 },
  fbRow: { flexDirection: 'row', gap: 8 },
  fbBtn: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315' },
  fbOn: { borderColor: colors.amber, backgroundColor: '#241c0c' },
  fbText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  fbLabel: { color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 13.5, marginTop: 2 },
  fbInput: { minHeight: 72, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0f0f12', color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14.5, padding: 10, textAlignVertical: 'top' },
  foot: { marginTop: 4 },
});
