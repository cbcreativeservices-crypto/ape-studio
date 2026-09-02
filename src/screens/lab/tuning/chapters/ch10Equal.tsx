/**
 * Chapter 10 — Divide the Octave Equally (spec Stage 4): derive r = 2^(1/12)
 * on a LOGARITHMIC cents rail, build the twelve markers one at a time, show
 * the hertz steps growing while the ratio stays constant, and compare the
 * tempered fifth and third with their pure counterparts.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildEqualChromatic, ET_SEMITONE, ET_FIFTH, ET_MAJOR_THIRD, PURE_FIFTH, JUST_MAJOR_THIRD, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { AudioComparisonControls, Body, Btn, Card, CentsRail, EquationStage, Eyebrow, Lead, MathLine, Prompt, Row, type RailMarker } from '../components/primitives';

const CHROMA = buildEqualChromatic();

export function Ch10Equal({ ctx }: ChapterProps) {
  const [built, setBuilt] = useState(0); // markers revealed beyond the root
  const root = ctx.rootHz;
  const hz = (k: number) => frequencyFromRatio(root, CHROMA[k].value.numericRatio);
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
        <Btn label={built < 12 ? `ADD STEP ${built + 1} · ×r` : 'OCTAVE REACHED'} tone="primary" onPress={() => setBuilt((b) => Math.min(12, b + 1))} disabled={built >= 12} />
        <Btn label="RESET" onPress={() => setBuilt(0)} />
        <Btn label="AUTO" onPress={() => { setBuilt(12); ctx.markDone(); }} />
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
      {built >= 12 ? <MarkOnce onMark={ctx.markDone} /> : null}
      <Body>Equal semitones mean equal frequency ratios — not equal differences in hertz.</Body>

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

function MarkOnce({ onMark }: { onMark: () => void }) {
  const [done, setDone] = useState(false);
  if (!done) { setDone(true); onMark(); }
  return null;
}

const styles = StyleSheet.create({
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
