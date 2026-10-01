/**
 * Chapter 13 — Apply What You Learned (spec Stage 4): six short
 * manipulation-based challenges, the retained ideas, review and retry.
 * Completion follows the app's policy: finishing the challenges completes
 * the chapter; perfect performance is not required.
 *
 * ON THE RACK (2026-09-30): FIGURE flips the glass between the three
 * challenges that have a display — the octave elevator (1 · fold 9/4), the
 * harmonic ladders (4 · align the third) and the rail of three E's (6 · hear
 * E move) — and the dock keys change with it: ×2 / ÷2 / RESET, the THIRD
 * fader + SHOW ME, the PLAY tray. Challenges 2, 3 and 5 are questions and
 * read in the well with everything else.
 */
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { frac, fracLabel, fracValue, centsToRatio, JUST_MAJOR_THIRD, PYTHAGOREAN_COMMA, frequencyFromRatio, TUNING_SYSTEMS, type Frac } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, CENTS_RAIL_W, DeviationMeter, Eyebrow, Lead, MathLine, Prompt, Row, useMarkWhen, useStableShuffle, type RailMarker } from '../components/primitives';
import { OctaveElevator } from '../components/octaveElevator';
import { HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, flipFader, lanePos, laneVal, playTray, snapNear, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const RULES: { rule: string; answer: string }[] = [
  { rule: 'Repeated 3/2 fifths', answer: 'Pythagorean' },
  { rule: 'Selected small whole-number ratios', answer: 'Just' },
  { rule: 'Quarter-comma-narrowed fifths', answer: 'Quarter-comma meantone' },
  { rule: 'Twelve identical steps', answer: 'Equal temperament' },
];
const SYSTEMS = ['Pythagorean', 'Just', 'Quarter-comma meantone', 'Equal temperament'];
type Figure = 'fold' | 'third' | 'emoves';
const FIGURES: { id: Figure; name: string; short: string; blurb: string }[] = [
  // Key-width shorts (review 2026-09-30): "1 · FOLD" cropped to "1 · FO…" in a
  // five-key dock; the number reads on the lane and in the tray.
  { id: 'fold', name: '1 · Normalize 9/4', short: 'FOLD', blurb: 'The octave elevator. Fold 9/4 into one octave with ×2 / ÷2.' },
  { id: 'third', name: '4 · Align the third', short: 'THIRD', blurb: 'The harmonic ladders. Ride THIRD until 4 × ratio = 5.' },
  { id: 'emoves', name: '6 · Hear E move', short: 'E MOVES', blurb: 'Three E’s over a fixed C on the rail. PLAY each one.' },
];
const E_SYSTEMS = [['Just', TUNING_SYSTEMS.just], ['Equal', TUNING_SYSTEMS.equal], ['Pythagorean', TUNING_SYSTEMS.pythagorean]] as const;
const MIN = 370, MAX = 430;
const RAIL_H = 110;

export function Ch13Apply({ ctx }: ChapterProps) {
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false, false]);
  const mark = (i: number) => setDone((d) => (d[i] ? d : d.map((v, k) => (k === i ? true : v))));
  const all = done.every(Boolean);
  const [figure, setFigure] = useState<Figure>('fold');
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);

  // 1 — normalize 9/4
  const [c1, setC1] = useState<Frac>(frac(9, 4));
  const [c1Hist, setC1Hist] = useState<{ op: '×2' | '÷2'; before: Frac; after: Frac }[]>([]);
  const c1In = fracValue(c1) >= 1 && fracValue(c1) < 2;
  const c1Apply = (op: '×2' | '÷2') => {
    if (done[0]) return;
    const after = op === '÷2' ? frac(c1.n, c1.d * 2) : frac(c1.n * 2, c1.d);
    setC1Hist([...c1Hist, { op, before: c1, after }]);
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
  const thirdRatio = centsToRatio(thirdCents);

  // 6 — hear E move
  const root = ctx.rootHz;
  const eOf = (s: typeof TUNING_SYSTEMS.just) => s.notes[2];
  const eMarkers: RailMarker[] = [
    { id: 'root', cents: 0, label: 'C · fixed', role: 'neutral' },
    ...E_SYSTEMS.map(([l, s], i) => ({ id: `e${l}`, cents: eOf(s).value.cents, label: `${l} E`, role: last === `e${l}` ? ('active' as const) : ('neutral' as const), emphasis: last === `e${l}`, row: i % 2 })),
  ];

  // Completion flags are set from effects, never during render (a parent
  // update from a child's render is a React warning).
  useMarkWhen(c2Correct, () => mark(1));
  useMarkWhen(Math.abs(thirdErr) < 0.05, () => mark(3));
  useMarkWhen(all, ctx.markDone);

  const doneCell: BezelItem = { k: 'DONE', v: `${done.filter(Boolean).length}/6`, tint: all ? colors.green : colors.cyanBright, flex: 0.8 };
  const bezel: BezelItem[] =
    figure === 'fold' ? [
      { k: 'RATIO', v: fracLabel(c1), tint: c1In ? colors.green : colors.gold },
      { k: 'VALUE', v: fracValue(c1).toFixed(4) },
      { k: 'REGION', v: fracValue(c1) < 1 ? 'BELOW' : c1In ? 'INSIDE' : 'ABOVE', tint: c1In ? colors.green : undefined },
      doneCell,
    ]
    : figure === 'third' ? [
      { k: 'THIRD', v: `${thirdCents.toFixed(2)} ¢`, tint: done[3] ? colors.green : colors.cyanBright },
      { k: '4 × RATIO', v: (4 * thirdRatio).toFixed(4), tint: Math.abs(thirdErr) < 0.05 ? colors.green : undefined },
      { k: 'FROM 5/4', v: Math.abs(thirdErr) < 0.05 ? '0 ¢' : `${thirdErr > 0 ? '+' : ''}${thirdErr.toFixed(2)} ¢`, tint: Math.abs(thirdErr) < 0.05 ? colors.green : Math.abs(thirdErr) < 8 ? colors.gold : colors.orange },
      doneCell,
    ]
    : [
      ...E_SYSTEMS.map(([l, s]) => ({ k: `${l.toUpperCase()} E`, v: `${eOf(s).value.cents.toFixed(2)} ¢`, tint: last === `e${l}` ? colors.cyanBright : undefined })),
      soundCell(status, 0.9),
    ];

  const stage =
    figure === 'fold' ? (w: number, h: number) => <OctaveElevator value={c1} history={c1Hist} reduceMotion={ctx.reduceMotion} box={{ w, h }} />
    : figure === 'third' ? (w: number, h: number) => (
        <StageFit w={w} h={h} aspect={LADDER_W / LADDER_H}>
          <HarmonicComparison fit readout={false} rootHz={root} upperHz={frequencyFromRatio(root, thirdRatio)} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="your third" />
        </StageFit>
      )
    : (w: number, h: number) => (
        <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
          <CentsRail markers={eMarkers} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
        </StageFit>
      );

  const params: DockParam[] = [
    flipFader({ id: 'figure', label: 'FIGURE', title: 'THE CHALLENGES WITH A DISPLAY', items: FIGURES, selectedId: figure, onSelect: (id) => setFigure(id as Figure), name: (f) => f.name, short: (f) => f.short, blurb: (f) => f.blurb }),
    ...(figure === 'fold'
      ? ([
          { kind: 'action', id: 'x2', label: '×2', onPress: () => c1Apply('×2') },
          { kind: 'action', id: 'd2', label: '÷2', onPress: () => c1Apply('÷2') },
          { kind: 'action', id: 'reset', label: 'RESET', onPress: () => { setC1(frac(9, 4)); setC1Hist([]); } },
        ] as DockParam[])
      : []),
    ...(figure === 'third'
      ? ([
          {
            kind: 'fader',
            id: 'third',
            label: 'THIRD',
            value: lanePos(thirdCents, MIN, MAX),
            // 0.1 ¢ steps + a quarter-cent snap onto 5/4 (review 2026-09-30;
            // chapter 4's rule) — 600 steps on a ~320 px lane left the 0.05 ¢
            // window narrower than one pixel.
            onChange: (p) => setThirdCents(snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents)),
            format: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents).toFixed(2)} ¢`,
            formatShort: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents).toFixed(1)}¢`,
            home: lanePos(400, MIN, MAX),
          },
          { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: () => setThirdCents(JUST_MAJOR_THIRD.cents) },
        ] as DockParam[])
      : []),
    ...(figure === 'emoves'
      ? [
          playTray({
            player: ctx.player,
            last,
            setLast,
            clips: E_SYSTEMS.map(([l, s]) => ({ id: `e${l}`, label: `${l} E · ${eOf(s).value.cents.toFixed(2)} ¢`, make: () => renderNotes([root, frequencyFromRatio(root, eOf(s).value.numericRatio)], 1.4, 'rich'), name: `${l} E`, blurb: `C stays at ${root.toFixed(2)} Hz; this E is ${frequencyFromRatio(root, eOf(s).value.numericRatio).toFixed(2)} Hz — ratio ${eOf(s).value.exactLabel}.` })),
            short: (c) => c.label.split(' ')[0],
          }),
        ]
      : []),
    // ■ STOP on every figure (review 2026-09-30): an E clip kept sounding
    // after a ride to FOLD or THIRD, whose docks had no stop — and in full
    // screen the footer's ■ STOP is off screen.
    stopKey(ctx.player),
  ];

  const caption: Record<Figure, string> = {
    fold: 'Challenge 1 on the glass: press ×2 or ÷2 until 9/4 sits in the comparison octave. Ride FIGURE for challenges 4 and 6; the rest read below.',
    third: 'Challenge 4 on the glass: ride THIRD until the third’s 4th harmonic meets the root’s 5th — 4 × ratio = 5. Double-tap the lane for 400 ¢.',
    emoves: 'Challenge 6 on the glass: PLAY each E over the same fixed C, then answer what moved.',
  };

  return (
    <TuningRackLayout ctx={ctx} rack={{ size: 'M', initialParam: 'figure', hideDragTag: true, bezel, stage, params }} caption={caption[figure]}>
      <Lead>Six short challenges. Each one is something you did earlier — now do it on purpose.</Lead>
      <Text style={styles.progress}>{done.filter(Boolean).length} of 6 complete</Text>

      <Eyebrow>1 · NORMALIZE</Eyebrow>
      <Prompt>Fold 9/4 into one octave — FIGURE 1 · FOLD, then ×2 / ÷2.</Prompt>
      <Card tone={done[0] ? 'ok' : 'plain'}>
        <MathLine>current: {fracLabel(c1)}{done[0] ? ' ✓ inside 1 ≤ r < 2' : ''}</MathLine>
        {c1Hist.map((h, i) => <Text key={i} style={styles.hist}>{fracLabel(h.before)} {h.op} = {fracLabel(h.after)}</Text>)}
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
      <Prompt>Adjust the major third until 4 × third ratio = 5 — FIGURE 4 · THIRD, then ride THIRD.</Prompt>
      <Card tone={done[3] ? 'ok' : 'plain'}>
        <MathLine>third = {thirdCents.toFixed(2)} ¢ → ratio {thirdRatio.toFixed(6)} → 4 × ratio = {(4 * thirdRatio).toFixed(4)}</MathLine>
        <DeviationMeter cents={thirdErr} rangeCents={25} label="cents from 5/4" />
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
      <Prompt>Keep C fixed and hear E at three sizes — FIGURE 6 · E MOVES, then PLAY — then explain what moved.</Prompt>
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
          <Btn label="RETRY THE CHALLENGES" onPress={() => { setDone([false, false, false, false, false, false]); setC1(frac(9, 4)); setC1Hist([]); setPicks({}); setThirdCents(400); setFigure('fold'); }} />
        </Card>
      ) : null}
    </TuningRackLayout>
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
