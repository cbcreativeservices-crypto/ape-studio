/**
 * Chapter 3 — Folding Notes Into One Octave (spec Stage 2): two guided
 * demonstrations on the Octave Elevator, then the learner folds 9/4, 27/8
 * and 3/4 one operation at a time, every intermediate result visible.
 *
 * ON THE RACK (2026-09-30): ONE elevator is the stage, and the VIEW key
 * switches what rides it — Demo A, Demo B or the learner's own ratio. The
 * demo's SHOW OPERATION / MOVE / REPLAY and the learner's ×2 / ÷2 / SHOW ME /
 * RESET are dock keys that change with the view; the ratio, its value and
 * its region print on the bezel; the operation history reads in the well.
 */
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { type Frac, frac, fracLabel, fracValue, normalizeFracToOctave } from '../../../../features/tuning/tuningMath';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, Eyebrow, Lead, MathLine, Prompt } from '../components/primitives';
import { ElevatorHistory, OctaveElevator } from '../components/octaveElevator';
import { UnderstandingCheck } from '../components/check';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout } from '../rackLayout';

type Hist = { op: '×2' | '÷2'; before: Frac; after: Frac }[];
type ViewId = 'A' | 'B' | 'turn';

const CHALLENGES: Frac[] = [frac(9, 4), frac(27, 8), frac(3, 4)];

export function Ch3Octave({ ctx }: ChapterProps) {
  const [view, setView] = useState<ViewId>('A');
  // demonstrations
  const demo = view === 'B' ? 'B' : 'A';
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
    if (inRange) return; // folded already — the well card says so and offers NEXT
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

  const turn = view === 'turn';
  const shown = turn ? value : demoValue;
  const shownHist = turn ? hist : demoHist;
  const sv = fracValue(shown);
  const region = sv < 1 ? 'BELOW' : sv < 2 ? 'INSIDE' : 'ABOVE';

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: view === 'A' ? 'Demo A' : view === 'B' ? 'Demo B' : 'Yours',
      options: [
        { id: 'A', label: 'Demo A · reduce 9/4', blurb: '3/2 × 3/2 = 9/4 is above the comparison octave. Watch it come down by ÷2.' },
        { id: 'B', label: 'Demo B · raise 3/4', blurb: '3/4 is below the comparison octave. Watch it go up by ×2.' },
        { id: 'turn', label: `Your turn · fold ${fracLabel(CHALLENGES[ci])}`, blurb: 'Apply ×2 or ÷2 yourself, one operation at a time, until the ratio sits between 1 and 2.' },
      ],
      selectedId: view,
      onSelect: (id) => {
        setView(id as ViewId);
        if (id !== 'turn') setDemoStep(0);
      },
    },
    ...(turn
      ? ([
          { kind: 'action', id: 'x2', label: '×2', onPress: () => apply('×2') },
          { kind: 'action', id: 'd2', label: '÷2', onPress: () => apply('÷2') },
          { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: showMe },
          { kind: 'action', id: 'reset', label: 'RESET', onPress: () => { setValue(CHALLENGES[ci]); setHist([]); } },
        ] as DockParam[])
      : ([
          {
            kind: 'action',
            id: 'step',
            label: demoStep === 0 ? 'SHOW OP' : demoStep === 1 ? (demo === 'A' ? 'MOVE ÷2' : 'MOVE ×2') : 'REPLAY',
            tint: demoStep < 2 ? colors.green : undefined,
            onPress: () => setDemoStep(demoStep < 2 ? demoStep + 1 : 0),
          },
        ] as DockParam[])),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'M',
        initialParam: 'view',
        bezel: [
          { k: 'RATIO', v: fracLabel(shown), tint: sv >= 1 && sv < 2 ? colors.green : colors.gold },
          { k: 'VALUE', v: sv.toFixed(4) },
          { k: 'REGION', v: region, tint: region === 'INSIDE' ? colors.green : undefined },
          { k: 'NEXT OP', v: !turn && demoStep === 1 ? (demo === 'A' ? '÷2' : '×2') : turn && !inRange ? (sv >= 2 ? '÷2' : '×2') : '—', tint: colors.blue },
        ],
        // SHOW OP prints the pending operation beside the tile on the glass
        // (review 2026-09-30) — the key used to change only a well line.
        stage: (w, h) => <OctaveElevator value={shown} history={shownHist} reduceMotion={ctx.reduceMotion} box={{ w, h }} op={!turn && demoStep === 1 ? (demo === 'A' ? '÷2' : '×2') : null} />,
        params,
      }}
      caption={turn
        ? `Your turn: press ×2 or ÷2 until ${fracLabel(CHALLENGES[ci])} sits in the comparison octave. SHOW ME does one step for you.`
        : `Demo ${demo}: press SHOW OP to see the operation, then MOVE to watch the tile change floor. VIEW switches to Demo B and to your turn.`}
      wellTop={<ElevatorHistory history={shownHist} />}
    >
      <Lead>Before building a scale from fifths, learn to fold any ratio into one comparison octave — from 1 up to, but not including, 2.</Lead>

      {!turn ? (
        <>
          <Eyebrow>DEMONSTRATION {demo}</Eyebrow>
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
          </Card>
          <Body>
            {demo === 'A'
              ? 'Dividing by 2 moves the pitch down one octave while preserving its pitch-class relationship.'
              : 'Multiplying by 2 moves the pitch up one octave — the same pitch class, one octave higher.'}
          </Body>
        </>
      ) : (
        <>
          <Prompt>Your turn: fold {fracLabel(CHALLENGES[ci])} into the comparison octave, one operation at a time.</Prompt>
          {inRange ? (
            <Card tone="ok">
              <Text style={styles.ok}>✓ {fracLabel(value)} lies between 1 and 2 — normalization complete{hist.length ? ` in ${hist.length} step${hist.length > 1 ? 's' : ''}` : ''}.</Text>
              {!solvedAll ? <Btn label={ci + 1 < CHALLENGES.length ? `NEXT: ${fracLabel(CHALLENGES[ci + 1])} ›` : 'FINISH ›'} tone="primary" onPress={next} /> : <Body>All three folded. Octave normalization does not make two ratios mathematically identical — it places octave-equivalent pitches inside the same comparison range.</Body>}
            </Card>
          ) : (
            <Body>{fracValue(value) >= 2 ? `${fracLabel(value)} is 2 or greater — it needs ÷2.` : `${fracLabel(value)} is less than 1 — it needs ×2.`}</Body>
          )}
        </>
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
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  ok: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
});
