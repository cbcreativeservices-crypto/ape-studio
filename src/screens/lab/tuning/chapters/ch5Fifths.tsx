/**
 * Chapter 5 — Build With Pure Fifths (spec Stage 3): one rule, ×3/2, applied
 * twelve times; every unreduced product and every ÷2 shown before the
 * normalized note lands on the rail. Fifth order vs pitch order toggle.
 *
 * ON THE RACK (2026-09-30): the cents rail is the stage. FIFTHS on the lane
 * is the number of fifths placed (ride it back for UNDO / REPLAY, forward to
 * AUTO-COMPLETE); ADD FIFTH builds the next one with its product and every
 * ÷2 shown; BY PITCH re-orders the fifth path, which sits at the top of the
 * well right under the glass; ▶ plays C with the newest note.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildPythagoreanFifthChain, frac, fracLabel, frequencyFromRatio, fracValue } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CentsRail, CENTS_RAIL_W, Eyebrow, Lead, MathLine, Prompt, type RailMarker } from '../components/primitives';
import { FifthPath } from '../components/fifthPath';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, playKey, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const CHAIN = buildPythagoreanFifthChain(frac(1, 1), 12);
const RAIL_H = 110;

export function Ch5Fifths({ ctx }: ChapterProps) {
  const [revealed, setRevealed] = useState(0); // steps fully placed (0 = only C)
  const [phase, setPhase] = useState(0); // within the step being built: 0 idle, 1 product shown, 2.. reductions shown, final placed
  const [order, setOrder] = useState<'fifth' | 'pitch'>('fifth');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const status = usePlayerStatus(ctx.player);
  const building = phase > 0;
  const next = CHAIN[revealed + 1];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /** Animate one fifth: product → each ÷2 → placed. Reduced motion: instant. */
  const addFifth = () => {
    if (!next || building) return;
    const finish = () => {
      setRevealed(revealed + 1);
      setPhase(0);
      if (revealed + 1 === 12) ctx.markDone();
    };
    if (ctx.reduceMotion) {
      finish();
      return;
    }
    setPhase(1);
    const stepMs = 520;
    next.reductions.forEach((_, i) => timers.current.push(setTimeout(() => setPhase(2 + i), stepMs * (i + 1))));
    timers.current.push(setTimeout(finish, stepMs * (next.reductions.length + 1)));
  };

  /** The lane: jump straight to n fifths placed (undo, replay, auto-complete). */
  const setCount = (n: number) => {
    if (n === revealed) return;
    clearTimers();
    setPhase(0);
    setRevealed(n);
    if (n === 12) ctx.markDone();
  };

  // BY PITCH changes the GLASS too (review 2026-09-30): in generation order
  // every marker carries its step number ("3·A"), so the rail itself shows
  // that pitch order is not the order the notes were made in; BY PITCH drops
  // the numbers and leaves the names in rail order. Before, the key only
  // re-sorted the path in the well — invisible in full screen.
  const markers: RailMarker[] = useMemo(
    () =>
      CHAIN.slice(0, revealed + 1).map((s) => ({
        id: `s${s.index}`,
        cents: s.cents,
        label: order === 'fifth' && s.index > 0 ? `${s.index}·${s.spelling}` : s.spelling,
        role: s.index === 12 ? ('error' as const) : s.index === revealed && revealed > 0 ? ('operation' as const) : ('neutral' as const),
        emphasis: s.index === revealed,
        // Numbered, "12·B♯" at 23 ¢ ran into "7·C♯" at 114 ¢ on the same row:
        // B♯ takes the row above while the numbers are on.
        row: s.index === 12 ? (order === 'fifth' ? 2 : 1) : s.index % 2,
      })),
    [revealed, order],
  );

  const newest = CHAIN[revealed];
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'fifths',
      label: 'FIFTHS',
      value: revealed / 12,
      onChange: (p) => setCount(Math.round(p * 12)),
      // The exact fraction reads on the LANE (review 2026-09-30): on the
      // bezel "B♯ 531441/524288" was cropped to an ellipsis — a readout may
      // drop its label, never its number. The lane has the width.
      format: (p) => {
        const n = Math.round(p * 12);
        return `${n} of 12 · ${CHAIN[n].spelling} ${fracLabel(CHAIN[n].normalized)}`;
      },
      formatShort: (p) => `${Math.round(p * 12)}/12`,
      home: 0,
    },
    { kind: 'action', id: 'add', label: 'ADD FIFTH', onPress: addFifth, tint: next && !building ? colors.green : undefined },
    { kind: 'toggle', id: 'order', label: 'BY PITCH', value: order === 'pitch', onToggle: () => setOrder((o) => (o === 'fifth' ? 'pitch' : 'fifth')) },
    ...(revealed > 0
      ? [playKey(ctx.player, 'play', `▶ C+${newest.spelling}`, () => renderNotes([ctx.rootHz, frequencyFromRatio(ctx.rootHz, fracValue(newest.normalized))], 1.4, 'rich'), `C and ${newest.spelling}`)]
      : []),
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'fifths',
        hideDragTag: true,
        bezel: [
          { k: 'STEP', v: `${revealed}/12`, tint: revealed >= 12 ? colors.red : undefined, flex: 0.8 },
          // The spelling only: the fraction (up to 13 characters) rides on
          // the lane readout and the step card, where it cannot be cropped.
          { k: 'NEWEST', v: newest.spelling, tint: revealed === 12 ? colors.red : colors.gold, flex: 0.9 },
          { k: 'CENTS', v: `${newest.cents.toFixed(2)} ¢`, flex: 1.2 },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
          </StageFit>
        ),
        params,
      }}
      caption="Press ADD FIFTH twelve times — each product, every ÷2 and the landing spot are shown. Ride FIFTHS back to undo or replay, forward to finish. BY PITCH drops the step numbers from the rail and re-sorts the path below."
      wellTop={
        <>
          <FifthPath steps={CHAIN} revealed={revealed} order={order} />
          <Body>{order === 'fifth' ? 'Generation order: each note is the previous note × 3/2, folded.' : 'We generated the notes in fifths. The pitch rail rearranges them from low to high within one octave.'}</Body>
        </>
      }
    >
      <Lead>Build using one rule.</Lead>
      <Card>
        <Eyebrow>ACTIVE RULE</Eyebrow>
        <Text style={styles.rule}>× 3/2 — then fold into the octave</Text>
      </Card>

      {/* the step being built, one operation at a time — and, once it lands,
          the last completed step stays visible (operation + result). */}
      <Card tone="math">
        {building && next ? (
          <>
            <Eyebrow>STEP {revealed + 1} OF 12 · BUILDING</Eyebrow>
            <MathLine>{fracLabel(CHAIN[revealed].normalized)} × 3/2 = {fracLabel(next.unreduced)}</MathLine>
            {next.reductions.slice(0, Math.max(0, phase - 1)).map((r, i) => (
              <MathLine key={i} emphasis>{fracLabel(r.before)} is 2 or greater → ÷2 = {fracLabel(r.after)}</MathLine>
            ))}
            {phase > next.reductions.length ? <MathLine>{fracLabel(next.normalized)} → {next.spelling}</MathLine> : null}
          </>
        ) : revealed === 0 ? (
          <>
            <Eyebrow>STEP 1 OF 12 · READY</Eyebrow>
            <Body>Press ADD FIFTH. You will see the product, every ÷2 it needs, and where the result lands.</Body>
          </>
        ) : (
          <>
            <Eyebrow>STEP {revealed} OF 12 · DONE{next ? ' · READY FOR THE NEXT' : ''}</Eyebrow>
            <MathLine>{fracLabel(CHAIN[revealed - 1].normalized)} × 3/2 = {fracLabel(CHAIN[revealed].unreduced)}</MathLine>
            {CHAIN[revealed].reductions.map((r, i) => (
              <MathLine key={i}>{fracLabel(r.before)} ÷ 2 = {fracLabel(r.after)}</MathLine>
            ))}
            <MathLine emphasis>{fracLabel(CHAIN[revealed].normalized)} → {CHAIN[revealed].spelling} · {CHAIN[revealed].cents.toFixed(2)} ¢</MathLine>
          </>
        )}
      </Card>

      {revealed >= 12 ? (
        <Card tone="warn">
          <Text style={styles.warn}>B♯ — expected to meet C</Text>
          <Body>Twelve pure fifths generate all twelve pitch classes — but the final pitch does not land exactly on the starting pitch class. B♯ sits at {CHAIN[12].cents.toFixed(2)} ¢, just above C at 0 ¢. Continue to see exactly why.</Body>
        </Card>
      ) : (
        <Prompt>{revealed === 0 ? 'Add the first fifth: C × 3/2 = G.' : revealed === 1 ? 'Add another. Watch 3/2 × 3/2 = 9/4 need a ÷2 before it can be D.' : `Keep going — ${12 - revealed} fifth${12 - revealed > 1 ? 's' : ''} to go.`}</Prompt>
      )}

      {/* NEW COPY — asked once the learner has SEEN a ÷2 happen (step 2). */}
      {revealed >= 2 ? (
        <UnderstandingCheck
          question="After 3/2 × 3/2 = 9/4, why divide by 2 before naming the note D?"
          options={['9/4 is above the octave; ÷2 keeps the pitch class inside it', 'Every fifth must be halved to remain a pure 3:2', '9/4 is not a whole number, so it must be reduced', 'Dividing by 2 turns the fifth into a fourth']}
          correct={0}
          explain="9/4 ≥ 2, so it sits above the comparison octave. ÷2 gives 9/8 — the same pitch class, D, inside 1 ≤ r < 2."
          wrong={[
            undefined,
            'Halving never touches the fifth’s purity — each ×3/2 stays exact. ÷2 only moves octaves.',
            'Whole numbers have nothing to do with it: 9/8 is not whole either. The rule is about the range 1 ≤ r < 2.',
            '÷2 is an octave, not an inversion. 9/4 and 9/8 are the same pitch class, D, one octave apart.',
          ]}
        />
      ) : null}
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  rule: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  warn: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 1 },
});
