/**
 * Audio Career Finder — introduction (owner brief 2026-09-03; design and
 * learning reviews 2026-09-04).
 *
 * An invitation, not a definition: the question the Finder answers, what the
 * five minutes buy, one green action, and the three trust signals a first-
 * time visitor needs (free, no account, stays on the phone). The instruction
 * that makes the answers honest — rate for ENJOYMENT, and "I don't know" is a
 * good answer — sits where it will be read, under the button, not under a
 * fold. Free for everyone, no account (owner ruling 2026-09-03).
 */
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { QUESTION_COUNT } from '../../features/careerfinder/questions';
import { FAMILY_COUNT, familyById } from '../../features/careerfinder/families';
import { CAREER_COUNT } from '../../features/careerfinder/careerIndex';
import { allAnswered, answeredCount, resetCareerFinder, setQuestionIndex, useCareerFinder, useCareerFinderHydrated } from '../../features/careerfinder/store';
import { BetaPill, Body, Card, CtaButton, FinderShell, Lead, SectionLabel, TextLink } from './kit';

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** NEW COPY 2026-09-04 (ratification sheet: docs/APE_CAREER_FINDER_COPY_2026_09_04.md). */
export const FINDER_INTRO = {
  lead: 'Which kinds of audio work would you enjoy doing?',
  body: `Rate ${QUESTION_COUNT} activities. In about five minutes you’ll have five career families worth exploring, and a place in the Academy to start on each.`,
  trust: 'Free. No account. Your answers stay on this phone.',
  howTo: 'You’ll answer for activities, not job titles. Answer for enjoyment only — whether you would be good at it, or could do it today, does not matter here. If you don’t know what an activity is like, say so: that is a useful answer, never a low score.',
  scope: 'This is a career-exploration tool. It does not measure your worth, guarantee success or determine what you are capable of learning. No percentages, no verdicts, no talent scores — possibilities to explore, with a place to start learning for each.',
};

/** Confirm-then-run, web-safe (react-native-web's Alert is a no-op). */
export function confirmReset(onConfirm: () => void, message = 'Clears your answers and results on this device. Saved families are kept.') {
  if (Platform.OS === 'web') {
    const confirm = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
    if (typeof confirm !== 'function' || confirm(`Reset the Career Finder? ${message}`)) onConfirm();
    return;
  }
  Alert.alert('Reset the Career Finder?', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: onConfirm },
  ]);
}

export function CareerFinderScreen() {
  const navigation = useNavigation();
  const rec = useCareerFinder();
  const hydrated = useCareerFinderHydrated();
  const answered = answeredCount(rec);
  const inProgress = answered > 0 && !rec.completed;
  const savedFamilies = rec.saved.map(familyById).filter((f): f is NonNullable<typeof f> => !!f);

  const start = () => navigation.navigate('CareerFinderQuiz');
  const results = () => navigation.navigate('CareerFinderResults');
  // Change answers from the hub: rewind to Q1 for the review (answers save as
  // they change; the finished state is kept until Finish re-freezes it).
  const changeAnswers = () => { setQuestionIndex(0); navigation.navigate('CareerFinderQuiz'); };

  return (
    <FinderShell kicker="CAREER DISCOVERY LAB · FREE · NO ACCOUNT" title="Audio Career Finder" onBack={() => navigation.goBack()} backLabel="Leave the Career Finder" headerRight={<BetaPill />}>
      <View style={styles.hero} accessible accessibilityRole="text" accessibilityLabel={`${fmt(CAREER_COUNT)} job titles, ${FAMILY_COUNT} career families, ${QUESTION_COUNT} questions, about five minutes`}>
        {[
          { v: fmt(CAREER_COUNT), l: 'TITLES', c: colors.amber },
          { v: String(FAMILY_COUNT), l: 'FAMILIES', c: colors.amber },
          { v: String(QUESTION_COUNT), l: 'QUESTIONS', c: colors.textPrimary },
          { v: '~5', l: 'MINUTES', c: colors.textPrimary },
        ].map((s) => (
          <View key={s.l} style={styles.stat}>
            <Text style={[styles.statValue, { color: s.c }]}>{s.v}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <Lead>{FINDER_INTRO.lead}</Lead>
      <Body>{FINDER_INTRO.body}</Body>

      {!hydrated ? null : rec.completed ? (
        <View style={styles.actions}>
          <CtaButton label="VIEW MY RESULTS" tone="green" onPress={results} hint="Opens your five career families" />
          <CtaButton label="CHANGE MY ANSWERS" onPress={changeAnswers} hint="Reopens the questions from the top with your answers kept" />
        </View>
      ) : inProgress ? (
        <View style={styles.actions}>
          <CtaButton label={`CONTINUE · QUESTION ${Math.min(QUESTION_COUNT, rec.index + 1)} OF ${QUESTION_COUNT}`} tone="green" onPress={start} a11y={`Continue at question ${rec.index + 1} of ${QUESTION_COUNT}`} />
          <Text style={styles.note}>{answered} of {QUESTION_COUNT} answered · saved on this phone{allAnswered(rec) ? ' · all answered' : ''}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <CtaButton label="START CAREER FINDER" tone="green" onPress={start} hint={`Begins the ${QUESTION_COUNT} questions. Progress is saved as you go.`} />
          <Text style={styles.note}>{FINDER_INTRO.trust}</Text>
        </View>
      )}

      <Card>
        <SectionLabel>HOW TO ANSWER</SectionLabel>
        <Body>{FINDER_INTRO.howTo}</Body>
        <SectionLabel>WHAT YOU GET</SectionLabel>
        <Body>Your answers become a profile across fourteen kinds of audio work. That profile is compared with {FAMILY_COUNT} career families, and the families that lean on what you enjoy come to the top — with the reason each one appeared, and the Academy topics that lead into it.</Body>
        <Body>{FINDER_INTRO.scope}</Body>
      </Card>

      {savedFamilies.length ? (
        <View style={{ gap: 8 }}>
          <SectionLabel tone="green">SAVED FAMILIES</SectionLabel>
          {savedFamilies.map((f) => (
            <Pressable key={f.id} style={styles.savedRow} onPress={() => navigation.navigate('CareerFamily', { id: f.id })} accessibilityRole="button" accessibilityLabel={`Open ${f.name}`}>
              <Text style={styles.savedName} numberOfLines={2}>{f.name}</Text>
              <Text style={styles.savedChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {answered > 0 || rec.completed ? (
        <CtaButton label="RESET & START OVER" tone="danger" onPress={() => confirmReset(() => resetCareerFinder())} a11y="Reset and start over" hint="Clears your answers and results on this device. Asks first." />
      ) : null}

      <View style={styles.links}>
        <TextLink label={`Browse all ${FAMILY_COUNT} career families`} onPress={() => navigation.navigate('CareerFamilyList')} />
        <TextLink label="How this works, and what it does not measure" onPress={() => navigation.navigate('CareerFinderAbout')} />
      </View>
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 6 },
  stat: { flex: 1, backgroundColor: '#141414', borderWidth: 1, borderColor: '#262626', borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 1 },
  statValue: { fontFamily: fonts.oswaldBold, fontSize: 20, letterSpacing: 0.2 },
  statLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.6, color: colors.textSub },
  actions: { gap: 8, marginTop: 4 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, textAlign: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: '#232323', backgroundColor: '#161616' },
  savedName: { flex: 1, color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  savedChevron: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  links: { gap: 2, marginTop: 4 },
});
