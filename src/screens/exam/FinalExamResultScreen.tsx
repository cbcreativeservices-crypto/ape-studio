/**
 * Final Exam result — the terminal screen of the R6b capstone flow.
 *
 * Renders the server's result_payload verbatim; it computes nothing itself.
 * The outcomes come straight from submit_final_exam:
 *   pass      → credential issued (credential_awarded true on the first pass)
 *   no_pass   → retake allowed immediately, no cooldown (owner ruling D3)
 *   timed_out → past the 602-second grace
 *   voided    → 2+ app switches; lockout_until carries the 15-minute release
 *   held      → graded and WITHHELD pending the one-month membership rule
 *   discarded → the membership ended before that month completed
 *
 * ── THE TWO NEW ONES CARRY NO SCORE, AND MUST NOT INVENT ONE ────────────
 *
 * `held` and `discarded` arrive with a deliberately redacted payload — no score,
 * no pass mark, no wrong answers. Everything below that reads those fields is
 * gated on `released`, because the alternative is telling a learner they scored
 * `undefined`, or coercing it to a zero they did not earn, on the last screen of
 * the hardest thing in the product.
 */
import { useEffect, useMemo } from 'react';
import { noteHighValueEvent } from '../../features/review/reviewPrompt';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import { isReleased } from '../../features/finalExam/api';
import { readingColumn } from '../../theme/readingColumn';

type Props = NativeStackScreenProps<RootStackParamList, 'FinalExamResult'>;

const COPY: Record<string, { title: string; body: string; tone: 'good' | 'bad' | 'warn' }> = {
  pass: {
    title: 'PASSED',
    body: 'You have met the standard for this credential. It has been added to your record.',
    tone: 'good',
  },
  no_pass: {
    title: 'NOT PASSED',
    body: 'You did not reach the pass mark this time. You may retake the Final Exam whenever you are ready — there is no waiting period.',
    tone: 'bad',
  },
  timed_out: {
    title: 'TIME EXPIRED',
    // The limit is server-owned; hardcoding "ten-minute" here was the one
    // place in the flow that stated a number the other screens deliberately
    // leave to the payload.
    body: 'The exam was submitted after the time limit, so it could not be graded. You may retake it whenever you are ready.',
    tone: 'warn',
  },
  voided: {
    title: 'ATTEMPT VOIDED',
    // The briefing promises fifteen minutes; "briefly" was vaguer than the
    // promise the learner was given before they started.
    body: 'This attempt was voided because the app was switched away from during the exam. The Final Exam is locked for fifteen minutes before you can try again.',
    tone: 'warn',
  },
  held: {
    title: 'PAPER RECEIVED',
    body: 'Your exam has been marked and sealed. A certificate requires one complete month of membership, so your result is held until your first month completes — then it is released and, if you have passed, your certificate is issued. You do not need to do anything, and you do not need to sit it again.',
    tone: 'warn',
  },
  discarded: {
    title: 'NOT APPLIED',
    body: 'Your membership ended before your first month completed, so this exam was not graded and has not been applied to your record. Rejoin and you may sit it again.',
    tone: 'warn',
  },
};

function fmtLockout(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function FinalExamResultScreen({ navigation, route }: Props) {
  const { result, awardName, awardType, awardId } = route.params;
  const insets = useSafeAreaInsets();

  const copy = COPY[result.outcome] ?? COPY.no_pass;
  const lockout = useMemo(() => fmtLockout(result.lockout_until), [result.lockout_until]);
  // Has the learner been TOLD their result? A held paper is graded; they simply
  // have not been shown it. Everything score-shaped hangs off this.
  const released = isReleased(result);
  const graded = released && (result.outcome === 'pass' || result.outcome === 'no_pass');
  // M13 (2026-09-07): no_pass / timed_out invite a retake in the copy, but the
  // only control was Done. Offer an explicit Retake that relaunches the exam
  // (voided stays lockout-gated; pass has nothing to retake). Replaces the
  // result so the finished attempt doesn't linger beneath the fresh one.
  //
  // NOT on `held`: the paper is sitting there marked, and sitting it again would
  // burn an attempt to replace a result they cannot see. `discarded` is not
  // offered either — there is no membership to sit it under.
  const canRetake = result.outcome === 'no_pass' || result.outcome === 'timed_out';

  // A newly issued credential is the strongest success moment in the app —
  // store-review eligibility counter (launch readiness, 2026-09-06). It only
  // ever asks once the thresholds in reviewEligibility.ts are met.
  useEffect(() => {
    if (result.credential_awarded) void noteHighValueEvent('certificate_earned');
  }, [result.credential_awarded]);

  const toneColor =
    copy.tone === 'good' ? colors.green : copy.tone === 'bad' ? colors.red : colors.amber;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Root-stack screen — no tab bar beneath it — and the control that
          falls under the home indicator here is Done, the only
          button-shaped way off the graded capstone's result screen. */}
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.awardName} numberOfLines={2}>
          {awardName}
        </Text>
        <Text style={styles.kicker}>FINAL EXAM</Text>

        <Text style={[styles.outcome, { color: toneColor }]}>{copy.title}</Text>

        {graded && (
          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: toneColor }]}>
              {result.score}
              <Text style={styles.scoreOf}> / {result.size}</Text>
            </Text>
            <Text style={styles.passMark}>PASS MARK {result.pass_mark}</Text>
          </View>
        )}

        <Text style={styles.body}>{copy.body}</Text>

        {result.credential_awarded && (
          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>CREDENTIAL ISSUED</Text>
            <Text style={styles.credentialBody}>
              This credential is now part of your permanent record and can be viewed from your profile.
            </Text>
          </View>
        )}

        {lockout && (
          <Text style={styles.lockout}>Locked until approximately {lockout}.</Text>
        )}

        <View style={styles.actions}>
          {canRetake && (
            <StudioButton
              label="Retake Final Exam"
              variant="success"
              onPress={() => (navigation as any).replace('FinalExam', { awardType, awardId, awardName })}
            />
          )}
          {result.outcome === 'pass' && (
            // [30] (2026-09-07): the pass copy says the credential is viewable on
            // the profile — give a direct path there (Profile is a Main tab).
            <StudioButton
              label="View on Profile"
              variant="success"
              /* popTo, not navigate: under React Navigation 7 a NAVIGATE to a
                 non-focused route with no `pop` APPENDS a second tab shell on
                 top of this screen, so Back lands the learner in a duplicate
                 app rather than where they came from. */
              onPress={() => (navigation as any).popTo('Main', { screen: 'Profile' })}
            />
          )}
          <StudioButton label="Done" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 24, gap: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1, ...readingColumn },
  awardName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 20,
    lineHeight: 27,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  kicker: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSubAlt,
  },
  outcome: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 28,
    letterSpacing: 2,
    marginTop: 10,
    textAlign: 'center',
  },
  scoreBlock: { alignItems: 'center', gap: 4, marginTop: 4 },
  score: { fontFamily: fonts.mono, fontSize: 44, letterSpacing: 1 },
  scoreOf: { fontSize: 24, color: colors.textSubAlt },
  passMark: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.5, color: colors.textSubAlt },
  body: {
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  credentialBox: {
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 8,
    padding: 16,
    gap: 6,
    marginTop: 10,
  },
  credentialLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: '#37e05f',
    textAlign: 'center',
  },
  credentialBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lockout: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, marginTop: 4 },
  actions: { width: 220, marginTop: 18, gap: 12 },
});
