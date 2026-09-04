/**
 * Audio Career Finder — results (owner brief 2026-09-03; design + learning
 * reviews 2026-09-04).
 *
 * The payoff comes first: the two families that lean most on what the user
 * said they would enjoy, then the profile that explains them, then three more
 * directions, one they may not have considered, and — because a result page
 * that ends in a list is a test while one that ends in three taps is a lesson
 * — WHAT TO DO NEXT. No percentages anywhere. When nothing stood out strongly
 * the headings say "closest to your answers", never "match".
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { sendFeedback } from '../../lib/feedback';
import { DIMENSIONS } from '../../features/careerfinder/dimensions';
import { CLARITY_LABEL, clarityCopy, computeResult, explainFamily, type FamilyScore } from '../../features/careerfinder/scoring';
import { familyFieldOf, familyMetaOf } from '../../features/careerfinder/careerIndex';
import { FAMILY_COUNT } from '../../features/careerfinder/families';
import { QUESTION_COUNT } from '../../features/careerfinder/questions';
import { LAB_FOR_DIMENSION } from '../../features/careerfinder/labsForDimension';
import { resetCareerFinder, setCareerFinderFeedback, setQuestionIndex, toggleSavedFamily, useCareerFinder, type FeedbackAnswer } from '../../features/careerfinder/store';
import { confirmReset } from './CareerFinderScreen';
import { BetaPill, Body, Card, CountTag, CtaButton, DimChip, DimensionSpectrum, FinderShell, Lead, LinkRow, RankBadge, SectionLabel, TextLink } from './kit';

export const RESULTS_LEAD = 'Five audio career families lean on what you said you would enjoy. Start with the top one.';
export const RESULTS_NOTE = 'These are possibilities to explore — not limits on what you can pursue. Interests change with experience, and these will too.';

export function CareerFinderResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const rec = useCareerFinder();
  const result = useMemo(() => computeResult(rec.responses, familyFieldOf), [rec.responses]);
  const strongestCodes = result.strongest.map((d) => d.code);
  const [note, setNote] = useState(rec.feedback?.note ?? '');
  const [meanings, setMeanings] = useState(false);

  // "Match" is a fit claim the answers may not support: when nothing stood
  // out strongly the headings describe proximity instead.
  const weak = !result.strongest.length || result.strongest[0].score < 0.75 || result.top[0].score < 0.5;
  const lead = result.strongest[0];
  const lab = lead ? LAB_FOR_DIMENSION[lead.code] : null;
  const unexplored = result.ranked.find((f) => result.dims[f.family.dimensions[0]].insufficient) ?? null;

  const openFamily = (id: string) => navigation.navigate('CareerFamily', { id, from: 'results' });
  // Change / retake REPLACE results with the quiz (they alternate at one
  // depth, never stacking) and rewind to Q1. Review keeps the completed state
  // — answers save as they change, and results recompute live — so backing
  // out of a review leaves the finished result intact; only Finish re-freezes.
  const changeAnswers = () => { setQuestionIndex(0); navigation.replace('CareerFinderQuiz'); };
  const retake = () => confirmReset(() => { resetCareerFinder(); setQuestionIndex(0); navigation.replace('CareerFinderQuiz'); });

  const feedback = (answer: FeedbackAnswer) => setCareerFinderFeedback(answer, note);
  const mailFeedback = () => {
    sendFeedback('suggestion', 'Audio Career Finder (Beta)', {
      Screen: 'Career Finder results',
      'Gave a direction to explore': rec.feedback?.answer ?? '(not answered)',
      'What it misunderstood': note.trim() || '(blank)',
      'Top families': result.top.map((t) => t.family.name).join(' | '),
      'Profile clarity': CLARITY_LABEL[result.clarity],
      'Assessment version': rec.version,
    });
  };

  const FamilyCard = ({ item, size, why }: { item: FamilyScore; size: 'large' | 'compact'; why?: string }) => {
    const f = item.family;
    const meta = familyMetaOf(f.id);
    const saved = rec.saved.includes(f.id);
    return (
      <Card tone={size === 'large' ? 'raised' : 'plain'} style={{ gap: 8 }}>
        <View style={styles.cardTop}>
          <RankBadge rank={item.rank} />
          <Text style={[styles.famName, size === 'compact' && { fontSize: 16, lineHeight: 21 }]} accessibilityRole="header">{f.name}</Text>
          {meta ? <CountTag n={meta.count} /> : null}
        </View>
        {size === 'large' ? <Body>{f.description}</Body> : null}
        <View style={styles.chips}>{f.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}</View>
        {why ? <Text style={styles.why}>{why}</Text> : null}
        <Text style={styles.examples} accessibilityLabel={`For example: ${f.examples.join(', ')}`}>
          <Text style={styles.examplesLabel}>FOR EXAMPLE  </Text>{f.examples.join(' · ')}
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

  const top2 = result.top.filter((t) => t.rank <= 2);
  const rest = result.top.filter((t) => t.rank > 2);

  return (
    <FinderShell kicker="AUDIO CAREER FINDER · RESULTS" title="Your Audio Career Results" onBack={() => navigation.goBack()} backLabel="Back" headerRight={<BetaPill />}>
      <Lead>{weak ? 'Nothing stood out strongly yet, so these are the families nearest to your answers — not matches. Exploring one will teach you more than the questions did.' : RESULTS_LEAD}</Lead>

      <SectionLabel tone="green">{weak ? 'CLOSEST TO YOUR ANSWERS' : 'STRONGEST MATCHES'}</SectionLabel>
      {top2.map((t) => <FamilyCard key={t.family.id} item={t} size="large" why={explainFamily(t.family, result.dims, { rank: t.rank })} />)}

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
          </>
        ) : null}
        <Pressable onPress={() => setMeanings(!meanings)} hitSlop={6} style={styles.meaningsBtn} accessibilityRole="button" accessibilityState={{ expanded: meanings }} accessibilityLabel="What these activities mean">
          <Text style={styles.meaningsText}>WHAT THESE MEAN {meanings ? '▴' : '▾'}</Text>
        </Pressable>
        {meanings ? (
          <>
            {result.strongest.map((d) => <Body key={d.code} muted><Text style={styles.em}>{DIMENSIONS[d.code].label}</Text> — {DIMENSIONS[d.code].measures}</Body>)}
            <Body muted>Each activity is measured by only two questions, so one answer moves its bar a lot. Treat the bars as a sketch of what you said you would enjoy — not a measurement of ability.</Body>
            {result.unknown > 0 ? (
              <Body muted>
                {result.unknown} of {QUESTION_COUNT} answers were “I don’t know enough about this”. Those activities are unexplored, not disliked
                {Object.values(result.dims).some((d) => d.insufficient) ? ' — the dashed bars had no rating at all.' : '.'}
              </Body>
            ) : null}
          </>
        ) : null}
      </Card>

      <SectionLabel>{weak ? 'NEXT CLOSEST' : 'OTHER PROMISING DIRECTIONS'}</SectionLabel>
      {rest.map((t) => <FamilyCard key={t.family.id} item={t} size="compact" />)}

      {result.surprise ? (
        <>
          <SectionLabel tone="cyan">ONE YOU MAY NOT HAVE CONSIDERED</SectionLabel>
          <Body>Same strongest interest, a different corner of the audio world. Many of these families are unfamiliar even to people who work in audio — that is part of why the index exists.</Body>
          <FamilyCard item={result.surprise} size="compact" why={lead ? `Shares your strongest interest, ${DIMENSIONS[lead.code].label}, in a field none of your top five touch.` : undefined} />
        </>
      ) : null}

      <Card tone="ok">
        <SectionLabel tone="green">WHAT TO DO NEXT</SectionLabel>
        <NextRow n={1} onPress={() => openFamily(result.top[0].family.id)} a11y={`Open ${result.top[0].family.name}`}>
          Open <Text style={styles.em}>{result.top[0].family.name}</Text> and add its first topic to your study list.
        </NextRow>
        {lab && lead ? (
          <NextRow n={2} onPress={() => navigation.navigate(lab.route as never)} a11y={`Try the ${lab.title}`}>
            Try a lab that uses <Text style={styles.em}>{DIMENSIONS[lead.code].label}</Text>: {lab.title} — {lab.why}.
          </NextRow>
        ) : null}
        {result.clarity === 'developing' && unexplored ? (
          <NextRow n={3} onPress={() => openFamily(unexplored.family.id)} a11y={`Open ${unexplored.family.name}`}>
            Open one family you said you didn’t know enough about: <Text style={styles.em}>{unexplored.family.name}</Text>.
          </NextRow>
        ) : result.surprise ? (
          <NextRow n={3} onPress={() => openFamily(result.surprise!.family.id)} a11y={`Read about ${result.surprise.family.name}`}>
            Read <Text style={styles.em}>{result.surprise.family.name}</Text> — same strongest interest, a different corner.
          </NextRow>
        ) : null}
        <Body muted>When you have tried one, come back and change any answer — the results recalculate.</Body>
      </Card>

      <View style={styles.after}>
        <CtaButton label={`BROWSE ALL ${FAMILY_COUNT} FAMILIES`} onPress={() => navigation.navigate('CareerFamilyList')} />
        <LinkRow>
          <TextLink label="Change my answers" onPress={changeAnswers} a11y="Change my answers. Reopens the questions with your answers kept." />
          <TextLink label="Retake from scratch" onPress={retake} muted a11y="Retake from scratch. Asks before clearing your answers." />
        </LinkRow>
        <Body muted>{RESULTS_NOTE}</Body>
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
        {rec.feedback ? (
          <>
            <Text style={styles.fbLabel}>What did the Career Finder misunderstand? (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              onBlur={() => setCareerFinderFeedback(rec.feedback!.answer, note)}
              placeholder="Anything it got wrong, missed, or named badly."
              placeholderTextColor="#5f6068"
              multiline
              style={styles.fbInput}
              accessibilityLabel="What did the Career Finder misunderstand"
            />
            <Body muted>Saved on this device. To send it to the Academy, use the button — it opens your mail app with the answer filled in, and you decide whether to send.</Body>
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

function NextRow({ n, onPress, a11y, children }: { n: number; onPress: () => void; a11y: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={styles.nextRow} accessibilityRole="button" accessibilityLabel={a11y}>
      <Text style={styles.nextN}>{n}</Text>
      <Text style={styles.nextText}>{children}</Text>
      <Text style={styles.nextChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clarity: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6 },
  drawn: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  em: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold },
  meaningsBtn: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  meaningsText: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  famName: { flex: 1, color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 23 },
  why: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  examples: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  examplesLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', backgroundColor: '#131315' },
  actExplore: { flex: 1, borderColor: colors.green, backgroundColor: '#173021', alignItems: 'center' },
  actSaved: { borderColor: 'rgba(255,198,77,0.5)', backgroundColor: '#1a150b' },
  actText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 4 },
  nextN: { width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 21, color: colors.green, borderWidth: 1, borderColor: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12 },
  nextText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20 },
  nextChevron: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  after: { gap: 8, marginTop: 4 },
  fbRow: { flexDirection: 'row', gap: 8 },
  fbBtn: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315' },
  fbOn: { borderColor: colors.amber, backgroundColor: '#241c0c' },
  fbText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  fbLabel: { color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 13.5, marginTop: 2 },
  fbInput: { minHeight: 72, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0f0f12', color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14.5, padding: 10, textAlignVertical: 'top' },
  foot: { marginTop: 4 },
});
