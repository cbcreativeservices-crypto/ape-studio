/**
 * Chapter 13 — Apply What You Learned (spec Stage 4): six short
 * manipulation-based challenges, the retained ideas, review and retry.
 * Completion follows the app's policy: finishing the challenges completes
 * the chapter; perfect performance is not required.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { frac, fracLabel, fracValue, centsToRatio, JUST_MAJOR_THIRD, PYTHAGOREAN_COMMA, frequencyFromRatio, TUNING_SYSTEMS } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, DeviationMeter, Eyebrow, Lead, MathLine, Prompt, Row, useMarkWhen, useStableShuffle } from '../components/primitives';
import { UnderstandingCheck } from '../components/check';

const RULES: { rule: string; answer: string }[] = [
  { rule: 'Repeated 3/2 fifths', answer: 'Pythagorean' },
  { rule: 'Selected small whole-number ratios', answer: 'Just' },
  { rule: 'Quarter-comma-narrowed fifths', answer: 'Quarter-comma meantone' },
  { rule: 'Twelve identical steps', answer: 'Equal temperament' },
];
const SYSTEMS = ['Pythagorean', 'Just', 'Quarter-comma meantone', 'Equal temperament'];

export function Ch13Apply({ ctx }: ChapterProps) {
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false, false]);
  const mark = (i: number) => setDone((d) => (d[i] ? d : d.map((v, k) => (k === i ? true : v))));
  const all = done.every(Boolean);

  // 1 — normalize 9/4
  const [c1, setC1] = useState(frac(9, 4));
  const [c1Hist, setC1Hist] = useState<string[]>([]);
  const c1Apply = (op: '×2' | '÷2') => {
    const after = op === '÷2' ? frac(c1.n, c1.d * 2) : frac(c1.n * 2, c1.d);
    setC1Hist([...c1Hist, `${fracLabel(c1)} ${op} = ${fracLabel(after)}`]);
    setC1(after);
    if (fracValue(after) >= 1 && fracValue(after) < 2) mark(0);
  };

  // 2 — match the rule. The rules used to appear in the SAME order as the
  // system buttons, so the answers ran down the diagonal (rule 1 → button 1…).
  // Rules and buttons are each shuffled once per mount; judging is by name.
  const { shuffled: rules } = useStableShuffle(RULES, 'rules');
  const { shuffled: systems } = useStableShuffle(SYSTEMS, 'systems');
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const c2Correct = RULES.every((r) => picks[r.rule] === r.answer);

  // 4 — align the third
  const [thirdCents, setThirdCents] = useState(400);
  const thirdErr = thirdCents - JUST_MAJOR_THIRD.cents;

  // 6 — hear E move
  const root = ctx.rootHz;

  // Completion flags are set from effects, never during render (a parent
  // update from a child's render is a React warning).
  useMarkWhen(c2Correct, () => mark(1));
  useMarkWhen(Math.abs(thirdErr) < 0.05, () => mark(3));
  useMarkWhen(all, ctx.markDone);

  return (
    <View style={{ gap: 12 }}>
      <Lead>Six short challenges. Each one is something you did earlier — now do it on purpose.</Lead>
      <Text style={styles.progress}>{done.filter(Boolean).length} of 6 complete</Text>

      <Eyebrow>1 · NORMALIZE</Eyebrow>
      <Prompt>Fold 9/4 into one octave.</Prompt>
      <Card tone={done[0] ? 'ok' : 'plain'}>
        <MathLine>current: {fracLabel(c1)}{done[0] ? ' ✓ inside 1 ≤ r < 2' : ''}</MathLine>
        {c1Hist.map((h) => <Text key={h} style={styles.hist}>{h}</Text>)}
        <Row>
          <Btn label="×2" onPress={() => c1Apply('×2')} disabled={done[0]} />
          <Btn label="÷2" onPress={() => c1Apply('÷2')} disabled={done[0]} />
          <Btn label="RESET" onPress={() => { setC1(frac(9, 4)); setC1Hist([]); }} />
        </Row>
      </Card>

      <Eyebrow>2 · MATCH THE RULE</Eyebrow>
      <Prompt>Which system does each generating rule describe?</Prompt>
      {rules.map((r) => {
        const pick = picks[r.rule] ?? null;
        return (
          <Card key={r.rule} tone={pick === r.answer ? 'ok' : pick ? 'warn' : 'plain'}>
            <Text style={styles.rule}>{r.rule} →</Text>
            <Row>
              {systems.map((s) => <Btn key={s} label={s} tone={pick === s ? (s === r.answer ? 'primary' : 'danger') : 'plain'} selected={pick === s} onPress={() => setPicks((p) => ({ ...p, [r.rule]: s }))} a11y={`${r.rule}: ${s}`} />)}
            </Row>
            {pick && pick !== r.answer ? <Text style={styles.hint}>Not that one — think about what the rule generates.</Text> : null}
          </Card>
        );
      })}

      <Eyebrow>3 · IDENTIFY NON-CLOSURE</Eyebrow>
      <UnderstandingCheck
        question="Twelve pure fifths and seven octaves do not meet. What is the gap called, and how big is it?"
        options={['The syntonic comma, about 21.51 cents', 'The Pythagorean comma, about 23.46 cents', 'The wolf fifth, about 41 cents', 'Rounding error, about 1 cent']}
        correct={1}
        explain={`The Pythagorean comma: (3/2)¹² ÷ 2⁷ = ${PYTHAGOREAN_COMMA.exactLabel} ≈ ${PYTHAGOREAN_COMMA.cents.toFixed(2)} cents.`}
        wrong={[
          'The syntonic comma (81/80) is the gap between a Pythagorean third and a Just third — a different mismatch, from Chapter 8.',
          undefined,
          'The wolf is where MEANTONE parks its leftover. Twelve PURE fifths miss by a comma, not by 41 ¢.',
          'Chapter 6: 3¹² and 2¹⁹ are different whole numbers. Nothing was rounded, and the gap is far more than a cent.',
        ]}
        onCorrect={() => mark(2)}
      />

      <Eyebrow>4 · ALIGN THE THIRD</Eyebrow>
      <Prompt>Adjust the major third until 4 × third ratio = 5.</Prompt>
      <Card tone={done[3] ? 'ok' : 'plain'}>
        <MathLine>third = {thirdCents.toFixed(2)} ¢ → ratio {centsToRatio(thirdCents).toFixed(6)} → 4 × ratio = {(4 * centsToRatio(thirdCents)).toFixed(4)}</MathLine>
        <DeviationMeter cents={thirdErr} rangeCents={25} label="cents from 5/4" />
        <Row>
          <Btn label="−1 ¢" onPress={() => setThirdCents(+(thirdCents - 1).toFixed(2))} a11y="Narrow by one cent" />
          <Btn label="−0.1 ¢" onPress={() => setThirdCents(+(thirdCents - 0.1).toFixed(2))} a11y="Narrow by a tenth of a cent" />
          <Btn label="+0.1 ¢" onPress={() => setThirdCents(+(thirdCents + 0.1).toFixed(2))} a11y="Widen by a tenth of a cent" />
          <Btn label="+1 ¢" onPress={() => setThirdCents(+(thirdCents + 1).toFixed(2))} a11y="Widen by one cent" />
          <Btn label="SHOW ME" onPress={() => setThirdCents(+JUST_MAJOR_THIRD.cents.toFixed(2))} a11y="Show me: set the third to 5/4" />
        </Row>
        {done[3] ? <Text style={styles.ok}>✓ 5/4 — the fourth harmonic of the third meets the fifth harmonic of the root.</Text> : null}
      </Card>

      <Eyebrow>5 · COMPLETE EQUAL TEMPERAMENT</Eyebrow>
      <UnderstandingCheck
        question="Twelve identical semitone ratios must fill one octave. Complete: r¹² = ___ and r = ___"
        options={['r¹² = 12, r = 12/2', 'r¹² = 2, r = 2^(1/12)', 'r¹² = 1200, r = 100', 'r¹² = 2, r = √2']}
        correct={1}
        explain="r¹² = 2 because twelve steps make one octave (ratio 2); so r = 2^(1/12) ≈ 1.059463, exactly 100 cents."
        wrong={[
          'Twelve steps must reach the OCTAVE, and the octave is the ratio 2 — not 12. Start from r¹² = 2.',
          undefined,
          'Those are cents, not ratios. An octave is 1200 ¢ but the RATIO is 2; a semitone is 100 ¢ but the ratio is 2^(1/12).',
          'r¹² = 2 is right — but √2 = 2^(1/2) is SIX semitones (the tritone). Twelve steps need the twelfth root.',
        ]}
        onCorrect={() => mark(4)}
      />

      <Eyebrow>6 · INTERPRET NOTE MOVEMENT</Eyebrow>
      <Prompt>Keep C fixed and hear E at three sizes, then explain what moved.</Prompt>
      <Row>
        {[['Just', TUNING_SYSTEMS.just], ['Equal', TUNING_SYSTEMS.equal], ['Pythagorean', TUNING_SYSTEMS.pythagorean]].map(([l, s]) => {
          const e = (s as typeof TUNING_SYSTEMS.just).notes[2];
          return <Btn key={l as string} label={`▶ E ${e.value.cents.toFixed(2)} ¢`} onPress={() => void ctx.player.play(renderNotes([root, frequencyFromRatio(root, e.value.numericRatio)], 1.4, 'rich'), `${l} E`)} a11y={`Play C with ${l} E`} />;
        })}
        <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
      </Row>
      {/* NEW COPY — options rebalanced (the correct one was ~4× the length of
          the others) + per-distractor feedback. */}
      <UnderstandingCheck
        question="C stayed at the same frequency. What changed between the three E’s?"
        options={['The note’s name changed with each system', 'The same degree got a different ratio in each system', 'The octave the E was played in changed', 'The loudness of the E changed each time']}
        correct={1}
        explain="The same written scale degree receives different frequency ratios in different tuning systems — 5/4, 2^(1/3) and 81/64 — so the same E lands at 386.31, 400 and 407.82 cents."
        wrong={[
          'All three were called E. A name is a label; the systems disagree about the FREQUENCY the label gets.',
          undefined,
          'All three E’s sat in the same octave — 386, 400 and 408 ¢ above the same C. The differences are a few cents, not 1200.',
          'Every clip is rendered to the same loudness rule. What differs is pitch, by ratio — not level.',
        ]}
        onCorrect={() => mark(5)}
      />

      {all ? (
        <Card tone="ok">
          <Eyebrow>WHAT YOU KEEP</Eyebrow>
          {[
            'Intervals are frequency ratios.',
            'Octaves multiply frequency by 2.',
            'Twelve pure fifths do not equal seven exact octaves.',
            'Simple harmonic ratios can create exact alignment for selected intervals.',
            'Temperaments redistribute tuning discrepancies according to musical goals.',
            'Twelve-tone equal temperament uses twelve equal multiplicative steps.',
          ].map((t, i) => <Text key={i} style={styles.keep}>{i + 1}. {t}</Text>)}
          <Body>Lab complete. Use the chapter list at the top to review any chapter, or RETRY to run the challenges again.</Body>
          <Btn label="RETRY THE CHALLENGES" onPress={() => { setDone([false, false, false, false, false, false]); setC1(frac(9, 4)); setC1Hist([]); setPicks({}); setThirdCents(400); }} />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  hist: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 13 },
  rule: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14 },
  hint: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12 },
  ok: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 13 },
  keep: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
