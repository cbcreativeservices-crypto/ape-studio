/**
 * Audio Career Finder — introduction (owner brief 2026-09-03).
 *
 * The front door: what the Finder is, what it is not, and one green action.
 * With saved progress it offers CONTINUE; with a completed run it offers the
 * results. Reset always confirms. Free for everyone, no account (owner ruling
 * 2026-09-03): the record lives on the device.
 */
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { QUESTION_COUNT } from '../../features/careerfinder/questions';
import { FAMILY_COUNT, familyById } from '../../features/careerfinder/families';
import { CAREER_COUNT } from '../../features/careerfinder/careerIndex';
import { allAnswered, answeredCount, resetCareerFinder, useCareerFinder, useCareerFinderHydrated } from '../../features/careerfinder/store';
import { BetaPill, Body, Card, CtaButton, FinderShell, Lead, SectionLabel, TextLink } from './kit';

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const FINDER_INTRO = [
  'Discover forms of paid work that use audio knowledge, audio-related skills or audio ability.',
  `You’ll answer ${QUESTION_COUNT} questions about activities you might enjoy. Your results will identify several audio career families worth exploring.`,
  'This is a career-exploration tool. It does not measure your worth, guarantee success or determine what you are capable of learning.',
];

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

  return (
    <FinderShell kicker="AUDIO CAREER FINDER · CAREER DISCOVERY LAB" title="Audio Career Finder" onBack={() => navigation.goBack()} backLabel="Leave the Career Finder" headerRight={<BetaPill />}>
      <View style={styles.hero} accessible accessibilityRole="text" accessibilityLabel={`${fmt(CAREER_COUNT)} careers, ${FAMILY_COUNT} families, ${QUESTION_COUNT} questions, about five minutes`}>
        {[
          { v: fmt(CAREER_COUNT), l: 'CAREERS', c: colors.amber },
          { v: String(FAMILY_COUNT), l: 'FAMILIES', c: colors.cyanBright },
          { v: String(QUESTION_COUNT), l: 'QUESTIONS', c: colors.textPrimary },
          { v: '~5', l: 'MINUTES', c: colors.green },
        ].map((s) => (
          <View key={s.l} style={styles.stat}>
            <Text style={[styles.statValue, { color: s.c }]}>{s.v}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>

      <Lead>{FINDER_INTRO[0]}</Lead>
      <Body>{FINDER_INTRO[1]}</Body>
      <Body>{FINDER_INTRO[2]}</Body>

      {!hydrated ? null : rec.completed ? (
        <View style={styles.actions}>
          <CtaButton label="VIEW MY RESULTS" tone="green" onPress={results} hint="Opens your five career families" />
          <CtaButton label="CHANGE MY ANSWERS" onPress={start} hint="Reopens the questions with your answers kept" />
        </View>
      ) : inProgress ? (
        <View style={styles.actions}>
          <CtaButton label={`CONTINUE · QUESTION ${Math.min(QUESTION_COUNT, rec.index + 1)} OF ${QUESTION_COUNT}`} tone="green" onPress={start} a11y={`Continue at question ${rec.index + 1} of ${QUESTION_COUNT}`} />
          <Text style={styles.progressNote}>{answered} of {QUESTION_COUNT} answered · saved on this device{allAnswered(rec) ? ' · all answered' : ''}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <CtaButton label="START CAREER FINDER" tone="green" onPress={start} hint="Begins the 28 questions. Progress is saved as you go." />
        </View>
      )}

      <Card>
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <Body>Each question describes an activity, not a job title. You say how you would feel about doing it — or that you don’t know enough yet, which is a perfectly good answer.</Body>
        <Body>Your answers become a profile across fourteen kinds of audio work. That profile is compared with {FAMILY_COUNT} career families, and the families that lean on what you enjoy come to the top — with the reason each one appeared.</Body>
        <Body>No percentages, no verdicts, no talent scores. Possibilities to explore, with a place to start learning for each.</Body>
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

      <View style={styles.links}>
        <TextLink label={`Browse all ${FAMILY_COUNT} career families`} onPress={() => navigation.navigate('CareerFamilyList')} />
        <TextLink label="How this works, and what it does not measure" onPress={() => navigation.navigate('CareerFinderAbout')} />
        {answered > 0 || rec.completed ? (
          <CtaButton label="RESET PREVIOUS ANSWERS" tone="quiet" onPress={() => confirmReset(() => resetCareerFinder())} hint="Asks before clearing" />
        ) : null}
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
  progressNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, textAlign: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: '#232323', backgroundColor: '#161616' },
  savedName: { flex: 1, color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  savedChevron: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  links: { gap: 2, marginTop: 4 },
});
