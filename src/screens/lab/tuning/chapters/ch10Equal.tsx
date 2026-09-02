/**
 * Chapter 10 — Divide the Octave Equally (spec Stage 4): derive r = 2^(1/12)
 * on a LOGARITHMIC cents rail, build the twelve markers one at a time, show
 * the hertz steps growing while the ratio stays constant, and compare the
 * tempered fifth and third with their pure counterparts.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildEqualChromatic, ET_SEMITONE, ET_SEMITONE_RATIO, ET_FIFTH, ET_MAJOR_THIRD, PURE_FIFTH, JUST_MAJOR_THIRD, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { AudioComparisonControls, Body, Btn, Card, CentsRail, EquationStage, Eyebrow, Lead, MathLine, Prompt, Row, useMarkWhen, type RailMarker } from '../components/primitives';
import { UnderstandingCheck } from '../components/check';

const CHROMA = buildEqualChromatic();

export function Ch10Equal({ ctx }: ChapterProps) {
  const [built, setBuilt] = useState(0); // markers revealed beyond the root
  const root = ctx.rootHz;
  const hz = (k: number) => frequencyFromRatio(root, CHROMA[k].value.numericRatio);
  useMarkWhen(built >= 12, ctx.markDone);
  // Hertz added by one equal semitone from a given start — for the check.
  const semiStep = (f: number) => f * (ET_SEMITONE_RATIO - 1);
  const stepC4 = semiStep(root), stepC5 = semiStep(root * 2);
  const markers: RailMarker[] = CHROMA.map((n, k) => ({
    id: `e${k}`, cents: n.value.cents, label: k <= built || k === 12 ? n.spelling.split('/')[0] : '', role: k === built && built > 0 ? 'operation' : k <= built ? 'neutral' : 'muted', emphasis: k === built, row: k % 2,
  }));
  const pattern = [0, 2, 4, 7, 4, 2, 0]; // a short neutral major pattern in semitones
  const seq = (start: number) => renderSequence(pattern.map((s) => frequencyFromRatio(root, Math.pow(2, (start + s) / 12))), 0.28, 'rich');

  return (
    <View style={{ gap: 12 }}>
      <Lead>What if every semitone used exactly the same frequency ratio?</Lead>
      <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={110} />
      <Body>Twelve positions on a logarithmic cents rail — equal spacing here means equal ratios, not equal hertz.</Body>
      <EquationStage
        title="TWELVE IDENTICAL STEPS"
        reduceMotion={ctx.reduceMotion}
        steps={[
          { text: 'r × r × r × … × r  (twelve times) = 2', note: 'twelve equal steps must land exactly on the octave' },
          { text: 'r¹² = 2', emphasis: true },
          { text: 'r = 2^(1/12)' },
          { text: `r ≈ ${ET_SEMITONE.decimalLabel}` },
          { text: 'each step = 1200 ÷ 12 = 100 cents', note: 'exactly, by construction' },
        ]}
      />
      <Prompt>Build the scale one step at a time and watch the hertz increase grow.</Prompt>
      <Row>
        <Btn label={built < 12 ? `ADD STEP ${built + 1} · ×r` : 'OCTAVE REACHED'} tone="primary" onPress={() => setBuilt((b) => Math.min(12, b + 1))} disabled={built >= 12} a11y={built < 12 ? `Add step ${built + 1}, multiply by r` : 'Octave reached'} />
        <Btn label="RESET" onPress={() => setBuilt(0)} a11y="Reset the build" />
        <Btn label="AUTO" onPress={() => setBuilt(12)} a11y="Auto-complete all twelve steps" />
      </Row>
      <Card tone="math">
        {built === 0 ? (
          <MathLine>start = 1 · {root.toFixed(2)} Hz</MathLine>
        ) : (
          <>
            <MathLine>{CHROMA[built].value.exactLabel} = {CHROMA[built].value.decimalLabel} · {CHROMA[built].value.cents.toFixed(0)} ¢ · {hz(built).toFixed(2)} Hz</MathLine>
            <MathLine emphasis>this step: {hz(built - 1).toFixed(2)} → {hz(built).toFixed(2)} Hz = +{(hz(built) - hz(built - 1)).toFixed(2)} Hz, ratio {ET_SEMITONE.decimalLabel}, 100 ¢</MathLine>
            {built >= 2 ? <MathLine>previous step: +{(hz(built - 1) - hz(built - 2)).toFixed(2)} Hz — same ratio, more hertz</MathLine> : null}
          </>
        )}
      </Card>
      <Body>Equal semitones mean equal frequency ratios — not equal differences in hertz.</Body>
      {/* NEW COPY — targets "equal semitones = equal hertz"; numbers derive from the live root. */}
      <UnderstandingCheck
        question={`From C4 (${root.toFixed(2)} Hz) one equal semitone adds ${stepC4.toFixed(2)} Hz. From C5 (${(root * 2).toFixed(2)} Hz) one semitone adds…`}
        options={[`${stepC4.toFixed(2)} Hz — a semitone is a fixed step`, `${stepC5.toFixed(2)} Hz — the same ratio, twice the hertz`, '100 Hz — a semitone is 100 cents', `${(stepC4 / 2).toFixed(2)} Hz — steps shrink as pitch rises`]}
        correct={1}
        explain={`${stepC5.toFixed(2)} Hz. Every semitone is ×2^(1/12) ≈ ${ET_SEMITONE.decimalLabel}; the hertz added is ${((ET_SEMITONE_RATIO - 1) * 100).toFixed(3)} % of the starting frequency, so it doubles when the frequency doubles.`}
        wrong={[
          `The step is a RATIO (2^(1/12)), not a fixed amount. Doubling the start doubles the hertz added: ${(root * 2).toFixed(2)} × ${(ET_SEMITONE_RATIO - 1).toFixed(5)} = ${stepC5.toFixed(2)}.`,
          undefined,
          `Cents are not hertz. 100 ¢ is the ratio 2^(1/12) ≈ ${ET_SEMITONE.decimalLabel} — about 6 % of whatever you start from.`,
          'Steps GROW with pitch, they never shrink — the same ratio applied to a bigger number adds more hertz.',
        ]}
      />

      <Eyebrow>INTERVAL COMPARISONS</Eyebrow>
      <Card>
        <MathLine>equal-tempered fifth 2^(7/12) = {ET_FIFTH.cents.toFixed(0)} ¢ · pure fifth 3/2 ≈ {PURE_FIFTH.cents.toFixed(2)} ¢</MathLine>
        <Text style={styles.note}>The equal-tempered fifth is approximately {(PURE_FIFTH.cents - ET_FIFTH.cents).toFixed(2)} cents narrower.</Text>
        <MathLine>equal-tempered major third 2^(4/12) = 2^(1/3) = {ET_MAJOR_THIRD.cents.toFixed(0)} ¢ · pure major third 5/4 ≈ {JUST_MAJOR_THIRD.cents.toFixed(2)} ¢</MathLine>
        <Text style={styles.note}>The equal-tempered major third is approximately {(ET_MAJOR_THIRD.cents - JUST_MAJOR_THIRD.cents).toFixed(2)} cents wider.</Text>
      </Card>

      <Eyebrow>TRANSPOSITION</Eyebrow>
      <Body>The same short major pattern in C and starting on F. Every interval containing the same number of semitones has the same ratio in every key — timbre and register still affect how it sounds.</Body>
      <AudioComparisonControls player={ctx.player} a={() => seq(0)} b={() => seq(5)} labelA="pattern in C" labelB="pattern starting on F" />

      <Body>Equal temperament keeps the octave exact and distributes smaller discrepancies consistently across the twelve notes.</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
