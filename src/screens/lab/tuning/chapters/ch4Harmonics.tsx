/**
 * Chapter 4 — Harmonic Alignment and Beating (spec Stage 2): the root's 5th
 * harmonic against the third's 4th harmonic for Just, equal-tempered and
 * Pythagorean thirds; full tones vs isolated partials (labeled); a beating
 * model; a 380–410 ¢ alignment slider with fine steps and Show Me.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { PulseThumb } from '../../../../features/lab/attentionPulse';
import {
  JUST_MAJOR_THIRD, ET_MAJOR_THIRD, PYTHAGOREAN_MAJOR_THIRD, centsToRatio, harmonicFrequency, partialDifferenceHz, frequencyFromRatio,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderPartials } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Btn, Card, DeviationMeter, Eyebrow, Lead, MathLine, Prompt, Row, useMarkWhen } from '../components/primitives';
import { HarmonicComparison, BeatingModel } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';

type Third = 'just' | 'equal' | 'pyth';
const THIRDS: Record<Third, { label: string; value: typeof JUST_MAJOR_THIRD }> = {
  just: { label: 'Just 5/4', value: JUST_MAJOR_THIRD },
  equal: { label: 'Equal-tempered 2^(1/3)', value: ET_MAJOR_THIRD },
  pyth: { label: 'Pythagorean 81/64', value: PYTHAGOREAN_MAJOR_THIRD },
};

export function Ch4Harmonics({ ctx }: ChapterProps) {
  const [third, setThird] = useState<Third>('just');
  const [mode, setMode] = useState<'full' | 'partials'>('full');
  const [sliderCents, setSliderCents] = useState(400);
  const [useSlider, setUseSlider] = useState(false);

  const cents = useSlider ? sliderCents : THIRDS[third].value.cents;
  const ratio = useSlider ? centsToRatio(sliderCents) : THIRDS[third].value.numericRatio;
  const f = ctx.rootHz;
  const thirdHz = frequencyFromRatio(f, ratio);
  const p5 = harmonicFrequency(f, 5);
  const p4 = harmonicFrequency(thirdHz, 4);
  const diff = partialDifferenceHz(p4, p5);
  const fromJust = cents - JUST_MAJOR_THIRD.cents;
  const aligned = Math.abs(fromJust) < 0.05;
  // Completion: the learner aligned the slider (not just pressed a preset).
  useMarkWhen(aligned && useSlider, ctx.markDone);

  const playFull = () => void ctx.player.play(renderNotes([f, thirdHz], 2.2, 'rich'), `full tones · ${useSlider ? `${cents.toFixed(1)} ¢` : THIRDS[third].label}`);
  const playPartials = () => void ctx.player.play(renderPartials([p5, p4], 2.2), `isolated partials · ${p5.toFixed(1)} + ${p4.toFixed(1)} Hz`);

  const step = (d: number) => {
    setUseSlider(true);
    setSliderCents(Math.max(380, Math.min(410, +(sliderCents + d).toFixed(2))));
  };

  return (
    <View style={{ gap: 12 }}>
      <Lead>A tuning ratio decides whether the upper harmonics of two notes coincide or collide. Compare three major thirds against the same root.</Lead>
      <Row>
        {(Object.keys(THIRDS) as Third[]).map((k) => (
          <Btn key={k} label={THIRDS[k].label} tone={!useSlider && third === k ? 'primary' : 'plain'} selected={!useSlider && third === k} onPress={() => { setThird(k); setUseSlider(false); setSliderCents(THIRDS[k].value.cents); }} a11y={`Compare the ${THIRDS[k].label} major third`} />
        ))}
      </Row>

      <HarmonicComparison rootHz={f} upperHz={thirdHz} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="major third E" />

      {/* Basic View keeps the one line that IS the lesson (which harmonics
          meet) plus the plain-language readout; See the Math adds the
          derivation lines — the same split the other chapters use. */}
      <Card tone="math">
        <Eyebrow>{useSlider ? `MAJOR THIRD AT ${cents.toFixed(2)} ¢` : THIRDS[third].label.toUpperCase()}</Eyebrow>
        {!useSlider && third === 'just' ? (
          <>
            {ctx.mathView ? <MathLine>root ladder: f, 2f, 3f, 4f, 5f</MathLine> : null}
            {ctx.mathView ? <MathLine>major third: (5/4)·f</MathLine> : null}
            <MathLine emphasis>4 × (5/4)·f = 5f — the third’s 4th harmonic lands exactly on the root’s 5th</MathLine>
            <Body>Two ways to say the same thing: higher ÷ lower = 5/4, or lower : higher = 4 : 5.</Body>
          </>
        ) : !useSlider && third === 'equal' ? (
          <>
            {ctx.mathView ? <MathLine>major third: 2^(1/3)·f = {ET_MAJOR_THIRD.decimalLabel}·f</MathLine> : null}
            <MathLine emphasis>4 × 2^(1/3)·f = {(4 * ET_MAJOR_THIRD.numericRatio).toFixed(6)}·f, against 5f</MathLine>
            <Body>Equal-tempered major third: 400 ¢ · just major third: {JUST_MAJOR_THIRD.cents.toFixed(2)} ¢ · difference: +{(400 - JUST_MAJOR_THIRD.cents).toFixed(2)} ¢. At this root the compared partials differ by {diff.toFixed(2)} Hz.</Body>
          </>
        ) : !useSlider ? (
          <>
            {ctx.mathView ? <MathLine>major third: (81/64)·f</MathLine> : null}
            <MathLine emphasis>4 × (81/64)·f = (81/16)·f = 5.0625·f, against 5f</MathLine>
            <Body>Root 5th harmonic ≈ {p5.toFixed(2)} Hz · Pythagorean-third 4th harmonic ≈ {p4.toFixed(2)} Hz · difference ≈ {diff.toFixed(2)} Hz ({PYTHAGOREAN_MAJOR_THIRD.cents.toFixed(2)} ¢ vs {JUST_MAJOR_THIRD.cents.toFixed(2)} ¢).</Body>
          </>
        ) : (
          <>
            {ctx.mathView ? <MathLine>third ratio = 2^({cents.toFixed(2)}/1200) = {ratio.toFixed(6)}</MathLine> : null}
            <MathLine emphasis>4 × {ratio.toFixed(6)}·f = {(4 * ratio).toFixed(4)}·f, against 5f</MathLine>
          </>
        )}
      </Card>

      <Eyebrow>LISTEN</Eyebrow>
      <Row>
        <Btn label="FULL TONES" tone={mode === 'full' ? 'primary' : 'plain'} selected={mode === 'full'} onPress={() => setMode('full')} />
        <Btn label="ISOLATED PARTIALS" tone={mode === 'partials' ? 'primary' : 'plain'} selected={mode === 'partials'} onPress={() => setMode('partials')} />
        <Btn label="▶ PLAY" onPress={mode === 'full' ? playFull : playPartials} a11y={mode === 'full' ? 'Play both full tones' : 'Play the two isolated partials'} />
        <Btn label="■ STOP" tone="danger" onPress={() => ctx.player.stop()} a11y="Stop audio" />
      </Row>
      <Body>
        {mode === 'full'
          ? 'Full tones: harmonic-rich notes, so the compared upper partials are actually present in what you hear.'
          : 'You are hearing the two compared partials by themselves — not complete notes.'}
      </Body>

      <BeatingModel diffHz={diff} />
      <Body>This frequency difference can produce audible beating when both partials are present and sufficiently strong. Real instruments differ in harmonic content, and audibility also depends on register, duration, phase, the room, playback and hearing.</Body>

      <Prompt>Move the major-third slider until the two compared harmonics align.</Prompt>
      <DeviationMeter cents={fromJust} rangeCents={25} label="Alignment meter · cents from 5/4" />
      <Row>
        <Btn label="−1 ¢" onPress={() => step(-1)} a11y="Narrow the third by one cent" />
        <Btn label="−0.1 ¢" onPress={() => step(-0.1)} a11y="Narrow by a tenth of a cent" />
        <Btn label="+0.1 ¢" onPress={() => step(0.1)} a11y="Widen by a tenth of a cent" />
        <Btn label="+1 ¢" onPress={() => step(1)} a11y="Widen the third by one cent" />
        <Btn label="SHOW ME" onPress={() => { setUseSlider(true); setSliderCents(+JUST_MAJOR_THIRD.cents.toFixed(2)); }} a11y="Show me: set the third to 5/4" />
      </Row>
      <SliderTrack value={sliderCents} onChange={(v) => { setUseSlider(true); setSliderCents(v); }} />
      <Text style={[styles.readout, { color: aligned ? colors.green : colors.textSecondary }]} accessibilityLiveRegion="polite">
        {aligned ? '● 5/4 — JUST MAJOR THIRD · 0 Hz · 0 ¢' : `third ${cents.toFixed(2)} ¢ · ratio ${ratio.toFixed(6)} · partial difference ${diff > 0 ? '+' : ''}${diff.toFixed(2)} Hz`}
      </Text>

      {/* NEW COPY — options rebalanced (the correct one was twice the length
          of the others) + per-distractor feedback. */}
      <UnderstandingCheck
        question="Why do the compared harmonics align for a 5/4 major third?"
        options={['Because 5/4 is a small, simple number', 'The third’s 4th harmonic equals the root’s 5th harmonic', 'Because both notes share one fundamental', 'Because 400 cents is a round, even number']}
        correct={1}
        explain="4 × (5/4)·f = 5·f: the third’s fourth harmonic is the root’s fifth harmonic — the same frequency, so no beating between them."
        wrong={[
          'Small numbers help, but the alignment is specific: 4 × 5/4 = 5. Say WHICH harmonics meet.',
          undefined,
          'Their fundamentals differ (f and 5/4·f). It is an UPPER harmonic of each that coincides.',
          '400 ¢ is the equal-tempered third — and it does NOT align: 4 × 2^(1/3) ≈ 5.04, not 5.',
        ]}
        onCorrect={ctx.markDone}
      />
      <Body>A small change in the fundamental interval can create a larger frequency difference among its upper harmonics. Tuning affects both pitch relationships and harmonic interaction.</Body>
    </View>
  );
}

/** A tap-anywhere track 380–410 ¢ with landmark ticks. */
function SliderTrack({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const min = 380, max = 410;
  const frac = (value - min) / (max - min);
  const [w, setW] = useState(300);
  const fromX = (x: number) => +Math.max(min, Math.min(max, min + (x / Math.max(1, w)) * (max - min))).toFixed(2);
  return (
    <View style={styles.track}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible accessibilityRole="adjustable" accessibilityLabel="Major third size" accessibilityValue={{ text: `${value.toFixed(2)} cents` }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => onChange(fromX(e.nativeEvent.locationX))}
      onResponderMove={(e) => onChange(fromX(e.nativeEvent.locationX))}
    >
      {[386.31, 400, 407.82].map((m) => (
        <View key={m} style={[styles.tick, { left: `${((m - min) / (max - min)) * 100}%` }]} />
      ))}
      <PulseThumb style={[styles.thumb, { left: `${frac * 100}%` }]} />
      <Text style={styles.trackLabel}>380 ¢</Text>
      <Text style={[styles.trackLabel, { right: 6, left: undefined }]}>410 ¢</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { fontFamily: fonts.barlowMedium, fontSize: 13 },
  track: { height: 44, borderRadius: 10, backgroundColor: '#101013', borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', overflow: 'hidden' },
  tick: { position: 'absolute', top: 6, bottom: 6, width: 1, backgroundColor: colors.textMuted },
  thumb: { position: 'absolute', top: 4, bottom: 4, width: 4, marginLeft: -2, borderRadius: 2, backgroundColor: colors.cyanBright },
  trackLabel: { position: 'absolute', left: 6, bottom: 2, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.5 },
});
