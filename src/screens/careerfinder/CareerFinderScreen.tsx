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
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { QUESTIONS, QUESTION_COUNT } from '../../features/careerfinder/questions';
import { FAMILY_COUNT, familyById } from '../../features/careerfinder/families';
import { CAREER_COUNT } from '../../features/careerfinder/careerIndex';
import { allAnswered, answeredCount, firstUnansweredIndex, resetCareerFinder, setQuestionIndex, useCareerFinder, useCareerFinderHydrated, useCareerFinderSaving } from '../../features/careerfinder/store';
import { BetaPill, Body, Card, CtaButton, FinderShell, Lead, SectionLabel, TextLink } from './kit';
import { confirmDialog } from '../../lib/confirm';
import { useUpsellAllowed } from '../../features/commercial/useTier';
import { safeGoBack } from '../../lib/safeGoBack';

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
  confirmDialog('Reset the Career Finder?', message, 'Reset', onConfirm, { destructive: true });
}

export function CareerFinderScreen() {
  const navigation = useNavigation();
  // Members never see "free" marketing (owner 2026-09-29).
  // On the shared tier (final round A, 2026-10-02): the plain copy until a
  // read has actually produced the tier, so a member whose read failed is
  // never marketed to.
  const upsell = useUpsellAllowed();
  const rec = useCareerFinder();
  const hydrated = useCareerFinderHydrated();
  // "saved on this phone" only when it is (final round A, 2026-10-02).
  const saving = useCareerFinderSaving();
  const answered = answeredCount(rec);
  const inProgress = answered > 0 && !rec.completed;
  // The question CONTINUE actually opens — the quiz's own resume rule. The
  // stored index still points at a question already answered when someone
  // answers and leaves inside the auto-advance beat, and the button then
  // promised "question 5" and opened question 6 (bug hunt 2026-09-30).
  const stored = QUESTIONS[rec.index];
  const resumeAt = allAnswered(rec) || (stored && !(stored.id in rec.responses)) ? rec.index : firstUnansweredIndex(rec);
  const savedFamilies = rec.saved.map(familyById).filter((f): f is NonNullable<typeof f> => !!f);

  const start = () => navigation.navigate('CareerFinderQuiz');
  const results = () => navigation.navigate('CareerFinderResults');
  // Change answers from the hub: rewind to Q1 for the review (answers save as
  // they change; the finished state is kept until Finish re-freezes it).
  const changeAnswers = () => { setQuestionIndex(0); navigation.navigate('CareerFinderQuiz'); };

  return (
    <FinderShell kicker={upsell ? 'AUDIO CAREER FINDER · FREE · NO ACCOUNT' : 'AUDIO CAREER FINDER'} title="Audio Career Finder" onBack={() => safeGoBack(navigation)} backLabel="Leave the Career Finder" headerRight={<BetaPill />}>
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
          <CtaButton label={`CONTINUE · QUESTION ${Math.min(QUESTION_COUNT, resumeAt + 1)} OF ${QUESTION_COUNT}`} tone="green" onPress={start} a11y={`Continue at question ${resumeAt + 1} of ${QUESTION_COUNT}`} />
          <Text style={styles.note}>{answered} of {QUESTION_COUNT} answered · {saving ? 'saved on this phone' : 'not saved on this phone'}{allAnswered(rec) ? ' · all answered' : ''}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {/* An UNREADABLE record is not a fresh start (hunt 12, 2026-10-04;
              K2): the store reads nothing it could not read and writes
              nothing over it (`saving` false), so "Progress is saved as you
              go" was untrue — and answers given before may still be on the
              phone. Same wording rule as the in-progress note above. */}
          <CtaButton label="START CAREER FINDER" tone="green" onPress={start} hint={saving ? `Begins the ${QUESTION_COUNT} questions. Progress is saved as you go.` : `Begins the ${QUESTION_COUNT} questions. Your answers could not be saved on this phone.`} />
          <Text style={styles.note}>{saving ? (upsell ? FINDER_INTRO.trust : 'Your answers stay on this phone.') : 'Your saved answers could not be read on this phone, so answers you give now will not be saved.'}</Text>
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
