/**
 * ExamBriefing — what a learner is told before the Final Exam begins.
 *
 * ── WHY THIS EXISTS (owner ruling 2026-09-18) ────────────────────────────────
 *
 * The exam rules are strict: a hard clock, and two app switches void the attempt
 * and lock it for fifteen minutes. A bug-hunt pass recommended softening them.
 * The owner declined, and the reasoning is the design of this screen:
 *
 *   "Employers must trust our grads that they earned it and did not use a
 *    computer to do the work for them (what everyone does now). To hold that
 *    trust the bar must be high. The app is training professionals, so we
 *    already have pro expectations; pro assessment should go hand in hand."
 *
 *   "If we are clear up front, every time, then the user already knows what
 *    happened. And why."
 *
 * So the rules are not relaxed — they are STATED, in full, before the clock
 * starts, every single time. A learner whose attempt is voided should recognise
 * the rule that voided it, not discover it.
 *
 * ── WHY IT IS BEFORE `startFinalExam`, NOT AFTER ─────────────────────────────
 *
 * The deadline runs from the server's `started_at`, which is set by
 * `start_final_exam`. Showing this after the payload arrived would spend the
 * learner's exam time on reading it. The screen therefore gates the RPC: no
 * attempt exists until BEGIN is pressed, and BACK costs nothing at all.
 *
 * ── THE COPY ─────────────────────────────────────────────────────────────────
 *
 * Every rule below is stated from the code that enforces it, not from memory:
 * the 602-second limit and the `focus_loss_count >= 2` void with a 15-minute
 * lockout are in `features/finalExam/api.ts`; the two-second grace and the
 * first-switch warning are in `FinalExamScreen`; the wipe-on-leave is
 * `confirmExit`. If one of those changes, this text is wrong and must change
 * with it.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { CERTIFICATE_REQUIRES_EXAM, readTenureState, type TenureState } from '../../features/finalExam/tenure';

export function ExamBriefing({
  awardName,
  onBegin,
  onBack,
}: {
  awardName: string;
  onBegin: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Starts 'unknown', which renders the policy and nothing about this person —
  // so the screen is correct from its first frame and only ever gets MORE
  // specific. It never has to take a claim back.
  const [tenure, setTenure] = useState<TenureState>('unknown');

  useEffect(() => {
    /**
     * ⛔ ONLY ASK WHEN THE RULE IS ACTUALLY IN FORCE.
     *
     * `certificate_requires_exam` is FALSE on production, and while it is the
     * server awards the credential the moment the exam is passed — it never
     * holds a paper and never discards one. This screen was not flag-aware, so
     * a genuine day-one paying member was shown a red card immediately before
     * the one-sitting capstone saying their paper would be "held, unopened"
     * and "discarded" if they left. Three sentences, all false, at the worst
     * moment in the product.
     *
     * 'complete' is the state that shows no reminder. The whole tenure
     * briefing below is the owner's 2026-09-18 ruling and is correct for the
     * day the flag flips — flip CERTIFICATE_REQUIRES_EXAM with it and it all
     * comes back, unchanged.
     */
    if (!CERTIFICATE_REQUIRES_EXAM) {
      setTenure('complete');
      return;
    }
    let alive = true;
    void readTenureState().then((t) => {
      if (alive) setTenure(t);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.kicker}>FINAL EXAM</Text>
        <Text style={styles.title}>{awardName}</Text>

        {/* ── Why it is like this ─────────────────────────────────────────── */}
        <Text style={styles.lead}>
          This is a proctored-standard assessment. Please read this before you begin — it is the same
          every time, so nothing here can take you by surprise later.
        </Text>

        <Text style={styles.h}>WHY THIS EXAM IS STRICT</Text>
        <Text style={styles.body}>
          A credential is only worth what an employer believes about it. When someone hires a
          graduate of this Academy, they are trusting that the person in front of them did the work
          themselves — and that trust is easy to lose and almost impossible to rebuild.
        </Text>
        <Text style={styles.body}>
          This app trains professionals to a professional standard, so it assesses to one. The rules
          below exist to protect the value of the credential you are about to earn, for you and for
          everyone who has already earned it.
        </Text>

        {/* ── The rules, exactly as enforced ──────────────────────────────── */}
        <Text style={styles.h}>THE RULES</Text>

        <Rule
          n="1"
          title="There is a time limit, and it does not pause."
          body="The clock starts when you press BEGIN and runs from the server, not from this phone. Closing the app, locking the screen or losing signal does not stop it. When it reaches zero the exam submits whatever you have answered."
        />
        <Rule
          n="2"
          title="Leaving the app voids the attempt."
          body="The first time you switch away you will get one warning. The second time, the attempt is VOIDED — not graded, not scored — and the exam is locked for fifteen minutes before you may try again. Very brief switches are ignored, but do not rely on that."
        />
        <Rule
          n="3"
          title="Going back wipes your answers."
          body="If you leave this exam deliberately, you will be asked to confirm, and then everything you have entered is erased. There is no pause and no save."
        />
        <Rule
          n="4"
          title="You need a connection to start."
          body="The exam cannot begin offline. If you lose your connection mid-exam your answers are kept and submitted when you reconnect, with your real finish time."
        />

        {/* ── The membership rule ─────────────────────────────────────────── */}
        <Text style={styles.h}>BEFORE YOUR CERTIFICATE IS ISSUED</Text>

        {tenure === 'incomplete' ? (
          <View style={styles.tenureCard}>
            <Text style={styles.tenureHead}>YOUR FIRST MONTH IS NOT COMPLETE YET</Text>
            <Text style={styles.tenureBody}>
              A certificate requires one complete paid month of membership. You have not reached that
              yet — and you are welcome to sit the exam now.
            </Text>
            <Text style={styles.tenureBody}>
              Your paper will be held, unopened, until your first month completes. It is graded then,
              and your certificate is issued then.
            </Text>
            <Text style={styles.tenureWarn}>
              If you end your membership before that month completes, this exam is discarded. It is
              not graded, it is not applied, and it does not count as an attempt you have used.
            </Text>
          </View>
        ) : tenure === 'complete' ? null : (
          // 'unknown' — state the policy, claim nothing about this person.
          <Text style={styles.body}>
            A certificate requires one complete paid month of membership. If your first month is not
            yet complete, your paper is held until it is, then graded and issued. Ending your
            membership before that month completes discards the exam ungraded.
          </Text>
        )}

        <Text style={styles.close}>
          If you are ready, press BEGIN. The clock starts immediately.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          onPress={onBack}
          style={[styles.btn, styles.btnSecondary]}
          accessibilityRole="button"
          accessibilityLabel="Go back without starting the exam"
        >
          <Text style={styles.btnTextSecondary}>NOT YET</Text>
        </Pressable>
        <Pressable
          onPress={onBegin}
          style={[styles.btn, styles.btnPrimary]}
          accessibilityRole="button"
          accessibilityLabel="Begin the Final Exam. The clock starts now."
        >
          <Text style={styles.btnTextPrimary}>BEGIN</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Rule({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    // One accessibility node per rule: a screen reader should hear "Rule 2,
    // leaving the app voids the attempt, …" as one statement rather than
    // three fragments.
    <View style={styles.rule} accessible accessibilityLabel={`Rule ${n}. ${title} ${body}`}>
      <Text style={styles.ruleNum}>{n}</Text>
      <View style={styles.ruleBody}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleText}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingHorizontal: 18, gap: 10 },

  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.8, color: colors.amberLabel },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 21, lineHeight: 27, color: colors.textPrimary },
  lead: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: 4,
  },

  h: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.3,
    color: colors.textMuted,
    marginTop: 18,
  },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },

  rule: { flexDirection: 'row', gap: 11, marginTop: 10 },
  ruleNum: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    color: colors.amberLabel,
    width: 16,
    textAlign: 'center',
    marginTop: 1,
  },
  ruleBody: { flex: 1, gap: 3 },
  ruleTitle: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textPrimary },
  ruleText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },

  /** The tenure card is bordered because it is the one section that is about
   *  THIS learner rather than about the exam, and it carries a consequence. */
  tenureCard: {
    marginTop: 8,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,192,74,0.55)',
    backgroundColor: 'rgba(255,192,74,0.07)',
    gap: 8,
  },
  tenureHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: '#ffc04a' },
  tenureBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  tenureWarn: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 20, color: '#ffc04a' },

  close: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 20,
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#232326',
    backgroundColor: colors.screenBg,
  },
  btn: { flex: 1, borderRadius: 9, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5 },
  btnSecondary: { borderColor: '#3a3a3a', backgroundColor: '#141414' },
  btnPrimary: { borderColor: colors.green, backgroundColor: `${colors.green}1f` },
  btnTextSecondary: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.9, color: colors.textSecondary },
  btnTextPrimary: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.9, color: colors.green },
});
