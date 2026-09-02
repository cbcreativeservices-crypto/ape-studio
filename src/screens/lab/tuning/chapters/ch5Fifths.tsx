/**
 * Chapter 5 — Build With Pure Fifths (spec Stage 3): one rule, ×3/2, applied
 * twelve times; every unreduced product and every ÷2 shown before the
 * normalized note lands on the rail. Fifth order vs pitch order toggle.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildPythagoreanFifthChain, frac, fracLabel, frequencyFromRatio, fracValue } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, CentsRail, Eyebrow, Lead, MathLine, Prompt, Row, type RailMarker } from '../components/primitives';
import { FifthPath } from '../components/fifthPath';

const CHAIN = buildPythagoreanFifthChain(frac(1, 1), 12);

export function Ch5Fifths({ ctx }: ChapterProps) {
  const [revealed, setRevealed] = useState(0); // steps fully placed (0 = only C)
  const [phase, setPhase] = useState(0); // within the step being built: 0 idle, 1 product shown, 2.. reductions shown, final placed
  const [manual, setManual] = useState(0);
  const [order, setOrder] = useState<'fifth' | 'pitch'>('fifth');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const building = phase > 0;
  const next = CHAIN[revealed + 1];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /** Animate one fifth: product → each ÷2 → placed. Reduced motion: instant. */
  const addFifth = (countManual = true) => {
    if (!next || building) return;
    if (countManual) setManual((m) => m + 1);
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

  const undo = () => {
    clearTimers();
    setPhase(0);
    setRevealed(Math.max(0, revealed - 1));
  };
  const replay = () => {
    clearTimers();
    setPhase(0);
    setRevealed(0);
  };
  const autoComplete = () => {
    clearTimers();
    setPhase(0);
    setRevealed(12);
    ctx.markDone();
  };

  const markers: RailMarker[] = useMemo(
    () =>
      CHAIN.slice(0, revealed + 1).map((s) => ({
        id: `s${s.index}`,
        cents: s.cents,
        label: s.spelling,
        role: s.index === 12 ? ('error' as const) : s.index === revealed && revealed > 0 ? ('operation' as const) : ('neutral' as const),
        emphasis: s.index === revealed,
        row: s.index === 12 ? 1 : s.index % 2,
      })),
    [revealed],
  );

  const playNewest = () => {
    const s = CHAIN[revealed];
    void ctx.player.play(renderNotes([ctx.rootHz, frequencyFromRatio(ctx.rootHz, fracValue(s.normalized))], 1.4, 'rich'), `C and ${s.spelling}`);
  };

  return (
    <View style={{ gap: 12 }}>
      <Lead>Build using one rule.</Lead>
      <Card>
        <Eyebrow>ACTIVE RULE</Eyebrow>
        <Text style={styles.rule}>× 3/2 — then fold into the octave</Text>
      </Card>
      <Row>
        <Btn label="ADD PURE FIFTH" tone="primary" onPress={() => addFifth(true)} disabled={!next || building} a11y="Add another pure fifth" />
        <Btn label="UNDO" onPress={undo} disabled={revealed === 0 || building} />
        <Btn label="REPLAY BUILD" onPress={replay} disabled={revealed === 0} />
        {manual >= 3 && next ? <Btn label="AUTO-COMPLETE" onPress={autoComplete} disabled={building} /> : null}
      </Row>

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
            <Body>Press ADD PURE FIFTH. You will see the product, every ÷2 it needs, and where the result lands.</Body>
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

      <Row>
        <Btn label="FIFTH ORDER" tone={order === 'fifth' ? 'primary' : 'plain'} onPress={() => setOrder('fifth')} />
        <Btn label="PITCH ORDER" tone={order === 'pitch' ? 'primary' : 'plain'} onPress={() => setOrder('pitch')} />
      </Row>
      <FifthPath steps={CHAIN} revealed={revealed} order={order} />
      <Body>{order === 'fifth' ? 'Generation order: each note is the previous note × 3/2, folded.' : 'We generated the notes in fifths. The pitch rail rearranges them from low to high within one octave.'}</Body>
      <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={110} />
      {revealed > 0 ? (
        <Row>
          <Btn label={`▶ C + ${CHAIN[revealed].spelling}`} onPress={playNewest} a11y={`Play C with ${CHAIN[revealed].spelling}`} />
          <Btn label="■" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
        </Row>
      ) : null}

      {revealed >= 12 ? (
        <Card tone="warn">
          <Text style={styles.warn}>B♯ — expected to meet C</Text>
          <Body>Twelve pure fifths generate all twelve pitch classes — but the final pitch does not land exactly on the starting pitch class. B♯ sits at {CHAIN[12].cents.toFixed(2)} ¢, just above C at 0 ¢. Continue to see exactly why.</Body>
        </Card>
      ) : (
        <Prompt>{revealed === 0 ? 'Add the first fifth: C × 3/2 = G.' : revealed === 1 ? 'Add another. Watch 3/2 × 3/2 = 9/4 need a ÷2 before it can be D.' : `Keep going — ${12 - revealed} fifth${12 - revealed > 1 ? 's' : ''} to go.`}</Prompt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  warn: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 1 },
});
