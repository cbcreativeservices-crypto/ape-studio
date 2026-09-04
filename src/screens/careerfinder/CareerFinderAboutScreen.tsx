/**
 * Audio Career Finder — methodology (design chat 2026-09-03: "visible
 * intellectual honesty"). What an audio career is, what the questionnaire
 * measures and does not, how careers are grouped and matched, that the
 * weights are provisional, the taxonomy's version and date, and how to
 * report an error. NEW COPY 2026-09-04 — ratification sheet in
 * docs/APE_CAREER_FINDER_COPY_2026_09_04.md.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { sendFeedback } from '../../lib/feedback';
import { DIMENSION_CODES, DIMENSIONS } from '../../features/careerfinder/dimensions';
import { FAMILY_COUNT } from '../../features/careerfinder/families';
import { QUESTION_COUNT } from '../../features/careerfinder/questions';
import { CLARITY_RULES, FAMILY_WEIGHTS } from '../../features/careerfinder/scoring';
import { CAREER_COUNT, CAREER_INDEX_VERSION, CENTRALITY } from '../../features/careerfinder/careerIndex';
import { ASSESSMENT_VERSION } from '../../features/careerfinder/store';
import { BetaPill, Body, Card, CtaButton, FinderShell, Lead, SectionLabel } from './kit';

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function CareerFinderAboutScreen() {
  const navigation = useNavigation();
  const report = () => sendFeedback('correction', 'Audio Career Finder', { Screen: 'How this works', 'Assessment version': ASSESSMENT_VERSION, 'Index version': CAREER_INDEX_VERSION });
  return (
    <FinderShell kicker="AUDIO CAREER FINDER · HOW THIS WORKS" title="What it measures, and what it doesn’t" onBack={() => navigation.goBack()} headerRight={<BetaPill />}>
      <Lead>The Career Finder is a career-exploration tool. It helps you discover paid work involving audio and identify promising directions to investigate. It does not tell you what you should become.</Lead>

      <Card>
        <SectionLabel>WHAT COUNTS AS AN AUDIO CAREER</SectionLabel>
        <Body>Any paid work that requires audio knowledge, audio-related skill or audio ability — employees, freelancers, contractors, consultants, business owners, performers, researchers, educators, clinicians, craftspeople and paid gig workers. A title does not need the word “audio” in it if sound-related knowledge is necessary to do the job. Unpaid hobby or volunteer activity is not included.</Body>
        <Body>Because that definition is broad, every title also says how central audio is to it: <Text style={styles.em}>{CENTRALITY.core.label}</Text> ({CENTRALITY.core.explain.toLowerCase().replace(/\.$/, '')}), <Text style={styles.em}>{CENTRALITY.specialized.label}</Text> ({CENTRALITY.specialized.explain.toLowerCase().replace(/\.$/, '')}) or <Text style={styles.em}>{CENTRALITY.enabled.label}</Text> ({CENTRALITY.enabled.explain.toLowerCase().replace(/\.$/, '')}).</Body>
      </Card>

      <Card>
        <SectionLabel>WHAT THE QUESTIONS MEASURE</SectionLabel>
        <Body>{QUESTION_COUNT} questions ask how you would feel about doing specific activities. They measure <Text style={styles.em}>interest</Text> — what you think you would enjoy — across fourteen kinds of audio work:</Body>
        <View style={{ gap: 3 }}>
          {DIMENSION_CODES.map((c) => (
            <Text key={c} style={styles.dimLine}><Text style={styles.dimCode}>{c}</Text>  <Text style={styles.dimLabel}>{DIMENSIONS[c].label}</Text> — {DIMENSIONS[c].measures}</Text>
          ))}
        </View>
      </Card>

      <Card tone="amber">
        <SectionLabel>WHAT IT DOES NOT MEASURE</SectionLabel>
        <Body>It does not measure ability, aptitude, knowledge, readiness, personality or fit with a workplace. It cannot tell whether you can hear distortion, troubleshoot signal flow, write code or run a session today. Interest is one useful piece of a career decision — research finds it relates to satisfaction, but modestly. Pay, colleagues, values, preparation and opportunity matter too.</Body>
        <Body>“I don’t know enough about this” is treated as missing evidence, never as dislike. Not having tried something is not the same as being unsuited to it.</Body>
        <Body>Each activity is measured by only two questions, so one answer can move its bar a lot. Treat the profile as a sketch, not a measurement.</Body>
        <Body>Your answers are stored only on this device and are never sent anywhere unless you choose to email feedback.</Body>
      </Card>

      <Card>
        <SectionLabel>HOW CAREERS ARE GROUPED AND MATCHED</SectionLabel>
        <Body>{fmt(CAREER_COUNT)} job titles were cross-checked against publicly available occupational listings and role descriptions — including those published by the U.S. Bureau of Labor Statistics and O*NET, the Audio Engineering Society, the Acoustical Society of America, AVIXA, SMPTE, ASHA, IATSE and the Piano Technicians Guild — and grouped by the Academy into {FAMILY_COUNT} career families. None of those organizations participated in, reviewed or endorsed this index, and no title here implies membership in or certification by any of them. Titles and licensing rules are described mainly as used in the United States; names and requirements differ elsewhere.</Body>
        <Body>Many titles are the same occupation under different names, seniority levels or employers; the index keeps them because that is how the industry actually talks.</Body>
        <Body>Each family names its three dominant activities. Your score on the main activity carries {Math.round(FAMILY_WEIGHTS[0] * 100)}% of the family’s score, the second {Math.round(FAMILY_WEIGHTS[1] * 100)}% and the third {Math.round(FAMILY_WEIGHTS[2] * 100)}%. Families are ranked from highest to lowest, and the reason each one appeared is generated from your actual answers by a fixed template — never by an AI.</Body>
        <Body>Profile clarity is a plain description of your answers: <Text style={styles.em}>Clear</Text> when at least one activity scored high and others sat clearly lower; <Text style={styles.em}>Broad</Text> when most were rated alike; <Text style={styles.em}>Early</Text> when more than {Math.round(CLARITY_RULES.unknownShare * 100)}% of answers were “I don’t know”.</Body>
      </Card>

      <Card>
        <SectionLabel>PROVISIONAL, AND LABELLED SO</SectionLabel>
        <Body>The family-to-activity mappings and the weights above are an expert starting hypothesis, not a validated instrument. They have not been calibrated against real response data and will change as people use the Finder and professionals correct it. Nothing here should be used to screen anyone for a job.</Body>
        <Text style={styles.version}>Questionnaire {ASSESSMENT_VERSION} · Index {CAREER_INDEX_VERSION}</Text>
      </Card>

      <Card tone="ok">
        <SectionLabel tone="green">SEE SOMETHING WRONG?</SectionLabel>
        <Body>If a title is misnamed, a family is missing a career you know, or a requirement is stated badly, tell us. Corrections from people who do the work are how this index improves.</Body>
        <CtaButton label="SUGGEST A CORRECTION" tone="green" onPress={report} hint="Opens your mail app. You decide whether to send." />
      </Card>
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  em: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold },
  dimLine: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  dimCode: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  dimLabel: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold },
  version: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 12, marginTop: 2 },
});
