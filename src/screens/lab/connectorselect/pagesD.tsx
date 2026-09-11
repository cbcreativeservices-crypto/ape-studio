/**
 * Audio Connectors & Cable Selection Lab — pages 13–16.
 * P13 Station 6: fault finder (the harder five).
 * P14 Station 7: safety & professional practice (acknowledge all nine).
 * P15 Misconceptions challenge (nine rapid true/false cards).
 * P16 Final: "You're on the Job" — randomized 12-question assessment,
 *     80% + every safety-critical answer correct, unlimited retries.
 */
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row, useStableShuffle } from '../tuning/components/primitives';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { ConnectorPhoto, GoalChips, LessonCard, OpenLabLink, StationTag, useVisitGoals } from './bits';
import { TesterRig } from './pagesC';
import { FAULTS } from './engine/tester';
import { MISCONCEPTIONS, SAFETY_RULES, type Misconception } from './data/practice';
import { drawAssessment, scoreAssessment, type AsmtResult } from './engine/evaluate';
import { PASS_PCT, type AsmtQuestion } from './data/assessment';

/* ── page 13: fault finder ───────────────────────────────────────────────── */

function PageFaultFinder({ ctx }: { ctx: PageCtx }) {
  const queue = FAULTS.slice(4);
  const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
  const goals = [{ label: `Diagnose all ${queue.length} cables`, hit: queue.every((f) => solved.has(f.id)) }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 6 · FAULT FINDER</StationTag>
      <Lead>Five more cables from the gig bag — including the two that PASS a resting continuity test and are still wrong. The tester is honest about what it cannot see; you have to be too.</Lead>
      {queue.map((f) => (
        <TesterRig key={f.id} fault={f} onSolved={() => setSolved((prev) => new Set(prev).add(f.id))} reduceMotion={ctx.reduceMotion} />
      ))}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 14: safety & professional practice ─────────────────────────────── */

function PageSafety({ ctx }: { ctx: PageCtx }) {
  const [acked, setAcked] = useState<ReadonlySet<string>>(new Set());
  const goals = [{ label: 'Acknowledge all 9 rules', hit: acked.size >= SAFETY_RULES.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 7 · SAFETY & PROFESSIONAL PRACTICE</StationTag>
      <Lead>Nine rules that professionals keep without thinking — because each one was learned the hard way by somebody else. Read each and acknowledge it.</Lead>
      {SAFETY_RULES.map((r, i) => {
        const on = acked.has(r.id);
        return (
          <Card key={r.id} tone={on ? 'ok' : 'plain'}>
            <Eyebrow>{`RULE ${i + 1} OF ${SAFETY_RULES.length}`}</Eyebrow>
            <Prompt>{r.rule}</Prompt>
            <Body>{r.why}</Body>
            <Btn
              label={on ? '✓ ACKNOWLEDGED' : 'I WILL WORK THIS WAY'}
              tone={on ? 'primary' : 'plain'}
              selected={on}
              onPress={() => setAcked((prev) => new Set(prev).add(r.id))}
              a11y={on ? `Rule ${i + 1} acknowledged` : `Acknowledge rule ${i + 1}`}
            />
          </Card>
        );
      })}
      <Card tone="note">
        <Eyebrow>COILING & ROUTING LIVE NEXT DOOR</Eyebrow>
        <Body>Wrapping, dressing and routing cables professionally is its own discipline — the Cable Dressing & Installation lab covers it end to end.</Body>
        <OpenLabLink route="CableInstallLab" label="OPEN CABLE DRESSING & INSTALLATION" />
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 15: misconceptions ─────────────────────────────────────────────── */

function MythCard({ m, onResolved }: { m: Misconception; onResolved: () => void }) {
  const [picked, setPicked] = useState<'true' | 'false' | null>(null);
  const resolved = picked === 'false';
  const pick = (v: 'true' | 'false') => {
    if (resolved) return;
    setPicked(v);
    if (v === 'false') {
      onResolved();
      AccessibilityInfo.announceForAccessibility?.(`Correct, it is false. ${m.correction}`);
    } else {
      AccessibilityInfo.announceForAccessibility?.(`Not quite — this one is a myth. ${m.correction}`);
    }
  };
  return (
    <Card>
      <Prompt>“{m.claim}”</Prompt>
      <Row>
        <Btn label="TRUE" tone={picked === 'true' ? 'danger' : 'plain'} selected={picked === 'true'} onPress={() => pick('true')} a11y={`True: ${m.claim}`} />
        <Btn label="FALSE" tone={resolved ? 'primary' : 'plain'} selected={resolved} onPress={() => pick('false')} a11y={`False: ${m.claim}`} />
      </Row>
      {picked ? (
        <Text style={[styles.mythNote, { color: resolved ? colors.green : colors.gold }]} accessibilityLiveRegion="polite">
          {resolved ? '✓ FALSE — ' : 'It’s a myth. '}
          {m.correction}
        </Text>
      ) : null}
    </Card>
  );
}

function PageMisconceptions({ ctx }: { ctx: PageCtx }) {
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set());
  const { shuffled } = useStableShuffle(MISCONCEPTIONS, 'myths');
  const goals = [{ label: 'Bust all 9 myths', hit: resolved.size >= MISCONCEPTIONS.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>THE MISCONCEPTIONS CHALLENGE</StationTag>
      <Lead>Nine claims you will hear on real gigs. Every one of them costs somebody a show eventually. True or false?</Lead>
      {shuffled.map((m) => (
        <MythCard key={m.id} m={m} onResolved={() => setResolved((prev) => new Set(prev).add(m.id))} />
      ))}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 16: the final ──────────────────────────────────────────────────── */

function AsmtQuestionCard({ q, num, answer, onAnswer }: { q: AsmtQuestion; num: number; answer: number | undefined; onAnswer: (originalIdx: number) => void }) {
  const { shuffled, order } = useStableShuffle(q.options, q.id);
  const answered = answer !== undefined;
  return (
    <Card>
      <Eyebrow>{`QUESTION ${num} · ${q.kind.toUpperCase()}${q.critical ? ' · SAFETY-CRITICAL' : ''}${answered ? ' · ANSWERED ✓' : ''}`}</Eyebrow>
      {/* No `name` on the photo — the question asks WHAT this connector is,
          so naming it in the accessibility label would leak the answer. */}
      {q.image ? <ConnectorPhoto id={q.image} size={72} /> : null}
      <Prompt>{q.q}</Prompt>
      {shuffled.map((opt, i) => {
        const original = order[i];
        const isPicked = answer === original;
        const showRight = answered && original === q.correct;
        const showWrong = isPicked && original !== q.correct;
        return (
          <Btn
            key={opt}
            label={`${showRight ? '✓ ' : showWrong ? '✕ ' : ''}${opt}`}
            tone={showRight ? 'primary' : showWrong ? 'danger' : 'plain'}
            selected={isPicked}
            // Every option locks once answered — including the picked and
            // correct ones — so assistive tech never lands on dead buttons
            // (design pass). The explain note below carries the teaching.
            disabled={answered}
            onPress={() => {
              if (answered) return;
              onAnswer(original);
              const right = original === q.correct;
              AccessibilityInfo.announceForAccessibility?.(right ? `Correct. ${q.explain}` : `Incorrect. ${q.wrong[original] ?? q.explain}`);
            }}
            a11y={opt}
          />
        );
      })}
      {answered ? (
        <Text style={[styles.asmtNote, { color: answer === q.correct ? colors.green : colors.red }]}>
          {answer === q.correct ? `✓ ${q.explain}` : `✕ ${q.wrong[answer!] ?? ''} ${q.explain}`}
        </Text>
      ) : null}
    </Card>
  );
}

function PageFinal({ ctx }: { ctx: PageCtx }) {
  const [paper, setPaper] = useState<AsmtQuestion[] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answers, setAnswers] = useState<ReadonlyMap<string, number>>(new Map());
  const [result, setResult] = useState<AsmtResult | null>(null);
  const [passedOnce, setPassedOnce] = useState(false);
  const goals = [{ label: `Pass the job: ${PASS_PCT}% + every safety call right`, hit: passedOnce }];
  const latched = useVisitGoals(ctx, goals);
  const start = () => {
    setPaper(drawAssessment(Math.random));
    setAttempt((a) => a + 1);
    setAnswers(new Map());
    setResult(null);
  };
  const allAnswered = paper != null && paper.every((q) => answers.has(q.id));
  const grade = () => {
    if (!paper) return;
    const r = scoreAssessment(paper, answers);
    setResult(r);
    if (r.passed) setPassedOnce(true);
    AccessibilityInfo.announceForAccessibility?.(
      r.passed
        ? `Passed. ${r.right} of ${r.total}, ${r.pct} percent.`
        : r.criticalMisses.length
          ? `Not yet: a safety-critical question was missed. Score ${r.pct} percent.`
          : `Not yet: ${r.pct} percent — the job needs ${PASS_PCT}.`,
    );
  };
  return (
    <View style={{ gap: 10 }}>
      <StationTag>FINAL · YOU’RE ON THE JOB</StationTag>
      <Lead>Twelve calls, drawn fresh every attempt: identification, cable selection, same-connector traps, faults and safety. The pass bar is {PASS_PCT}% — and EVERY safety-critical call must be right, whatever the score.</Lead>
      {!paper ? (
        <Btn label="CLOCK IN — DRAW MY 12" tone="primary" onPress={start} a11y="Start the final assessment" />
      ) : (
        <View style={{ gap: 10 }} key={attempt}>
          {paper.map((q, i) => (
            <AsmtQuestionCard
              key={`${attempt}-${q.id}`}
              q={q}
              num={i + 1}
              answer={answers.get(q.id)}
              onAnswer={(orig) => setAnswers((prev) => new Map(prev).set(q.id, orig))}
            />
          ))}
          {!result ? (
            <Btn label={allAnswered ? 'TURN IN THE JOB SHEET' : `ANSWER ALL 12 (${answers.size}/12)`} tone="primary" disabled={!allAnswered} onPress={grade} a11y={allAnswered ? 'Grade the assessment' : 'Answer every question first'} />
          ) : (
            // warn (red framing) is reserved for the genuine safety case —
            // a plain sub-80% miss is a note, not a hazard (design pass).
            <Card tone={result.passed ? 'ok' : result.criticalMisses.length ? 'warn' : 'note'}>
              <Eyebrow>{result.passed ? 'PASSED — HIRED BACK TOMORROW' : 'NOT YET'}</Eyebrow>
              <Prompt>{`${result.right} of ${result.total} · ${result.pct}%`}</Prompt>
              {result.criticalMisses.length ? (
                <Body>A SAFETY-CRITICAL call was missed — on the job that outweighs any score. The final passes only with every safety call correct.</Body>
              ) : result.passed ? (
                <Body>Identification, selection, the same-connector traps, faults and safety — all held up under a random draw. That is the whole lab, working.</Body>
              ) : (
                <Body>The job needs {PASS_PCT}%. Every retry draws a fresh set — the explanations above are the study sheet.</Body>
              )}
              <Btn label={result.passed ? 'RUN IT AGAIN ANYWAY' : 'NEW ATTEMPT — FRESH DRAW'} tone={result.passed ? 'plain' : 'primary'} onPress={start} a11y="Draw a new assessment" />
            </Card>
          )}
        </View>
      )}
      {passedOnce ? <LessonCard /> : null}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const CONNECTOR_PAGES_D: PageDef[] = [
  { title: 'Fault finder', short: 'Faults', Component: PageFaultFinder, manualDone: true },
  { title: 'Safety & professional practice', short: 'Safety', Component: PageSafety, manualDone: true },
  { title: 'The misconceptions challenge', short: 'Myths', Component: PageMisconceptions, manualDone: true },
  { title: 'Final: you’re on the job', short: 'Final', Component: PageFinal, manualDone: true },
];

const styles = StyleSheet.create({
  mythNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  asmtNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
});
