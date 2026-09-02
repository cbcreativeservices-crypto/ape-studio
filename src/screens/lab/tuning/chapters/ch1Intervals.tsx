/**
 * Chapter 1 — Intervals Are Frequency Relationships (spec Stage 2).
 * Drag the upper note from unison to the octave; ratio, cents and interval
 * name update from the same value; the octave demonstration compares two
 * registers to show the hertz difference changes while the ratio does not.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { centsToRatio, frequencyFromRatio, nearestLandmark, ratioToCents } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, Eyebrow, Lead, MathLine, Prompt, Row, dec } from '../components/primitives';
import { DragRail } from '../components/dragRail';
import { UnderstandingCheck } from '../components/check';

export function Ch1Intervals({ ctx }: ChapterProps) {
  const [cents, setCents] = useState(0);
  const [reachedOctave, setReachedOctave] = useState(false);
  const ratio = centsToRatio(cents);
  const upperHz = frequencyFromRatio(ctx.rootHz, ratio);
  const landmark = nearestLandmark(cents, 6);
  const shownRatio = landmark ? landmark.value.exactLabel : dec(ratio, 4);
  const name = landmark?.name ?? (cents < 1 ? 'Unison' : 'between landmarks');
  const rootLow = ctx.rootHz / 2;

  const onSettle = (c: number) => {
    if (c >= 1199.5) setReachedOctave(true);
  };

  const timbre = 'rich' as const;
  const playRoot = () => void ctx.player.play(renderNotes([ctx.rootHz], 1.2, timbre), 'root');
  const playUpper = () => void ctx.player.play(renderNotes([upperHz], 1.2, timbre), 'upper note');
  const playBoth = () => void ctx.player.play(renderNotes([ctx.rootHz, upperHz], 1.6, timbre), 'both notes');

  const octaveInfo = useMemo(
    () => ({
      lowDiff: ctx.rootHz - rootLow, // C3→C4
      highDiff: ctx.rootHz * 2 - ctx.rootHz, // C4→C5
    }),
    [ctx.rootHz, rootLow],
  );

  return (
    <View style={{ gap: 12 }}>
      <Lead>An interval is a relationship between two frequencies — not a fixed difference in hertz.</Lead>
      <Row>
        <Card><Eyebrow>ROOT</Eyebrow><Text style={styles.big}>C4</Text><Text style={styles.sub}>{ctx.rootHz.toFixed(2)} Hz</Text></Card>
        <Card><Eyebrow>UPPER NOTE</Eyebrow><Text style={[styles.big, { color: colors.cyanBright }]}>{name}</Text><Text style={styles.sub}>{upperHz.toFixed(2)} Hz</Text></Card>
      </Row>
      <Row>
        <Btn label="▶ ROOT" onPress={playRoot} a11y="Play root" />
        <Btn label="▶ UPPER" onPress={playUpper} a11y="Play upper note" />
        <Btn label="▶ TOGETHER" onPress={playBoth} a11y="Play both notes together" />
        <Btn label="■ STOP" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
      </Row>

      <Prompt>Drag the upper note from unison (1:1) all the way to the octave (2:1).</Prompt>
      <DragRail cents={cents} onChange={setCents} label="Upper note" reduceMotion={ctx.reduceMotion} onSettle={onSettle} showMeTarget={1200} fixedMarkers={[{ id: 'root', cents: 0, label: 'root', role: 'neutral' }]} />

      <Card>
        <View style={styles.readRow}>
          <Read label="RATIO" value={shownRatio} />
          <Read label="CENTS" value={cents.toFixed(2)} />
          <Read label="INTERVAL" value={name} />
        </View>
        <Body>
          {cents >= 1199.5
            ? `Upper frequency = 2 × root frequency: ${upperHz.toFixed(2)} = 2 × ${ctx.rootHz.toFixed(2)}. Ratio 2:1, 1200 cents — an octave.`
            : landmark
              ? `${landmark.name}: ratio ${landmark.value.exactLabel}, ${landmark.value.cents.toFixed(2)} cents above the root.`
              : 'Between landmarks — every position is a valid interval; the named ones are just the simplest ratios.'}
        </Body>
      </Card>

      {reachedOctave ? (
        <Card tone="ok">
          <Eyebrow>TWO OCTAVES, TWO REGISTERS</Eyebrow>
          <Text style={styles.line}>C3 → C4: {rootLow.toFixed(2)} → {ctx.rootHz.toFixed(2)} Hz · ratio 2:1 · 1200 ¢ · difference {octaveInfo.lowDiff.toFixed(2)} Hz</Text>
          <Text style={styles.line}>C4 → C5: {ctx.rootHz.toFixed(2)} → {(ctx.rootHz * 2).toFixed(2)} Hz · ratio 2:1 · 1200 ¢ · difference {octaveInfo.highDiff.toFixed(2)} Hz</Text>
          <Body>The hertz difference changes with register, but the interval ratio remains 2:1.</Body>
          <Row>
            <Btn label="▶ C3–C4" onPress={() => void ctx.player.play(renderNotes([rootLow, ctx.rootHz], 1.4, timbre), 'C3 and C4')} />
            <Btn label="▶ C4–C5" onPress={() => void ctx.player.play(renderNotes([ctx.rootHz, ctx.rootHz * 2], 1.4, timbre), 'C4 and C5')} />
          </Row>
        </Card>
      ) : null}

      {ctx.mathView ? (
        <Card tone="math">
          <Eyebrow>SEE THE MATH</Eyebrow>
          <MathLine>r = f₂ ÷ f₁ = {upperHz.toFixed(2)} ÷ {ctx.rootHz.toFixed(2)} = {dec(ratio, 6)}</MathLine>
          <MathLine>c = 1200 · log₂(r) = 1200 · log₂({dec(ratio, 6)}) = {ratioToCents(ratio).toFixed(2)} ¢</MathLine>
          <Body>You do not need to compute logarithms to use this lab — cents are just a way to make equal ratios look like equal distances.</Body>
        </Card>
      ) : (
        <Body>Intervals compare frequencies. The same interval can begin on any pitch.</Body>
      )}

      {/* NEW COPY — options rebalanced to similar length (the correct one was
          the longest by far) + per-distractor misconception feedback. */}
      <UnderstandingCheck
        question="If the lower note changes but the ratio remains 3:2, what stays the same?"
        options={['The difference in hertz between the two notes', 'The interval — still a pure perfect fifth', 'The frequency of the upper note', 'Nothing — a new root makes a new interval']}
        correct={1}
        explain="The interval remains a pure perfect fifth, although both frequencies change. A ratio is preserved; hertz differences are not."
        wrong={[
          'A hertz difference scales with the root: 200 → 300 Hz are 100 Hz apart, 400 → 600 Hz are 200 Hz apart — and both are 3:2.',
          undefined,
          'The upper note moves with the root — it is always 1.5 × the lower note, so it cannot stay put.',
          'The interval IS the ratio, not the notes. Any two frequencies in a 3:2 relationship make the same interval.',
        ]}
        onCorrect={ctx.markDone}
      />
    </View>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 80 }}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={styles.readValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  sub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  readRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  readValue: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 17 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
});
