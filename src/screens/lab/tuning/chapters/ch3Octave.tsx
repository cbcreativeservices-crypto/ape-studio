/**
 * Chapter 3 — Folding Notes Into One Octave (spec Stage 2): two guided
 * demonstrations on the Octave Elevator, then the learner folds 9/4, 27/8
 * and 3/4 one operation at a time, every intermediate result visible.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type Frac, frac, fracLabel, fracValue, normalizeFracToOctave } from '../../../../features/tuning/tuningMath';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, Eyebrow, Lead, MathLine, Prompt, Row } from '../components/primitives';
import { OctaveElevator } from '../components/octaveElevator';
import { UnderstandingCheck } from '../components/check';

type Hist = { op: '×2' | '÷2'; before: Frac; after: Frac }[];

const CHALLENGES: Frac[] = [frac(9, 4), frac(27, 8), frac(3, 4)];

export function Ch3Octave({ ctx }: ChapterProps) {
  // demonstrations
  const [demo, setDemo] = useState<'A' | 'B'>('A');
  const [demoStep, setDemoStep] = useState(0); // 0 = start, 1 = operation shown, 2 = moved
  const demoStart = demo === 'A' ? frac(9, 4) : frac(3, 4);
  const demoTrace = normalizeFracToOctave(demoStart);
  const demoValue = demoStep >= 2 ? demoTrace.ratio : demoStart;
  const demoHist: Hist = demoStep >= 2 ? demoTrace.steps : [];

  // learner challenge
  const [ci, setCi] = useState(0);
  const [value, setValue] = useState<Frac>(CHALLENGES[0]);
  const [hist, setHist] = useState<Hist>([]);
  const [solvedAll, setSolvedAll] = useState(false);
  const inRange = fracValue(value) >= 1 && fracValue(value) < 2;

  const apply = (op: '×2' | '÷2') => {
    const after = op === '÷2' ? frac(value.n, value.d * 2) : frac(value.n * 2, value.d);
    setHist([...hist, { op, before: value, after }]);
    setValue(after);
  };
  const next = () => {
    if (ci + 1 >= CHALLENGES.length) {
      setSolvedAll(true);
      ctx.markDone();
      return;
    }
    setCi(ci + 1);
    setValue(CHALLENGES[ci + 1]);
    setHist([]);
  };
  const showMe = () => {
    const v = fracValue(value);
    if (v >= 2) apply('÷2');
    else if (v < 1) apply('×2');
  };

  return (
    <View style={{ gap: 12 }}>
      <Lead>Before building a scale from fifths, learn to fold any ratio into one comparison octave — from 1 up to, but not including, 2.</Lead>

      <Eyebrow>DEMONSTRATION</Eyebrow>
      <Row>
        <Btn label="A · REDUCE 9/4" onPress={() => { setDemo('A'); setDemoStep(0); }} tone={demo === 'A' ? 'primary' : 'plain'} />
        <Btn label="B · RAISE 3/4" onPress={() => { setDemo('B'); setDemoStep(0); }} tone={demo === 'B' ? 'primary' : 'plain'} />
      </Row>
      <OctaveElevator value={demoValue} history={demoHist} reduceMotion={ctx.reduceMotion} />
      <Card tone="math">
        {demo === 'A' ? (
          <>
            <MathLine>3/2 × 3/2 = 9/4</MathLine>
            {demoStep >= 1 ? <MathLine emphasis>9/4 is greater than 2, so: ÷2</MathLine> : null}
            {demoStep >= 2 ? <MathLine>9/4 ÷ 2 = 9/8 — inside the comparison octave</MathLine> : null}
          </>
        ) : (
          <>
            <MathLine>3/4 is less than 1 — below the comparison octave</MathLine>
            {demoStep >= 1 ? <MathLine emphasis>so: ×2</MathLine> : null}
            {demoStep >= 2 ? <MathLine>3/4 × 2 = 3/2 — inside the comparison octave</MathLine> : null}
          </>
        )}
        <Row>
          {demoStep < 2 ? <Btn label={demoStep === 0 ? 'SHOW THE OPERATION' : demo === 'A' ? 'MOVE DOWN ONE OCTAVE' : 'MOVE UP ONE OCTAVE'} tone="primary" onPress={() => setDemoStep(demoStep + 1)} /> : null}
          {demoStep > 0 ? <Btn label="REPLAY" onPress={() => setDemoStep(0)} /> : null}
        </Row>
      </Card>
      <Body>
        {demo === 'A'
          ? 'Dividing by 2 moves the pitch down one octave while preserving its pitch-class relationship.'
          : 'Multiplying by 2 moves the pitch up one octave — the same pitch class, one octave higher.'}
      </Body>

      <Prompt>Your turn: fold {fracLabel(CHALLENGES[ci])} into the comparison octave, one operation at a time.</Prompt>
      <OctaveElevator value={value} history={hist} reduceMotion={ctx.reduceMotion} />
      <Row>
        <Btn label="×2" onPress={() => apply('×2')} disabled={inRange} a11y="Multiply by two" />
        <Btn label="÷2" onPress={() => apply('÷2')} disabled={inRange} a11y="Divide by two" />
        <Btn label="SHOW ME" onPress={showMe} disabled={inRange} a11y="Show me the next operation" />
        <Btn label="RESET" onPress={() => { setValue(CHALLENGES[ci]); setHist([]); }} a11y="Reset this ratio" />
      </Row>
      {inRange ? (
        <Card tone="ok">
          <Text style={styles.ok}>✓ {fracLabel(value)} lies between 1 and 2 — normalization complete{hist.length ? ` in ${hist.length} step${hist.length > 1 ? 's' : ''}` : ''}.</Text>
          {!solvedAll ? <Btn label={ci + 1 < CHALLENGES.length ? `NEXT: ${fracLabel(CHALLENGES[ci + 1])} ›` : 'FINISH ›'} tone="primary" onPress={next} /> : <Body>All three folded. Octave normalization does not make two ratios mathematically identical — it places octave-equivalent pitches inside the same comparison range.</Body>}
        </Card>
      ) : (
        <Body>{fracValue(value) >= 2 ? `${fracLabel(value)} is 2 or greater — it needs ÷2.` : `${fracLabel(value)} is less than 1 — it needs ×2.`}</Body>
      )}

      {ctx.mathView ? (
        <Card tone="math">
          <Eyebrow>SEE THE MATH · THE RULE</Eyebrow>
          <MathLine>If ratio ≥ 2 → divide by 2</MathLine>
          <MathLine>If ratio &lt; 1 → multiply by 2</MathLine>
          <MathLine>Repeat until 1 ≤ ratio &lt; 2</MathLine>
          <Body>Each step changes the ratio by exactly one octave, so the result is octave-equivalent to where you started — never “the same number,” just the same pitch class in one agreed range.</Body>
        </Card>
      ) : null}

      {/* NEW COPY — targets the misconception that folding changes the note. */}
      <UnderstandingCheck
        question="You folded 9/4 down to 9/8. What actually changed?"
        options={['The pitch class — it is now a different note', 'Only the octave — same pitch class, one octave lower', 'The ratio to the root became exact', 'The note moved down by a fifth']}
        correct={1}
        explain="Only the octave. 9/4 ÷ 2 = 9/8 is the same pitch class placed inside the 1 ≤ r < 2 range."
        wrong={[
          '÷2 is exactly one octave. The pitch class is unchanged — the note keeps its name.',
          undefined,
          'Folding does not make a ratio “exact” — 9/8 is as exact as 9/4. It only moves it into the comparison range.',
          'A fifth is ×3/2. Folding only ever applies ×2 or ÷2 — octaves, never fifths.',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ok: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
});
