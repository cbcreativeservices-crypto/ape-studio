/**
 * Chapter 4 — Harmonic Alignment and Beating (spec Stage 2): the root's 5th
 * harmonic against the third's 4th harmonic for Just, equal-tempered and
 * Pythagorean thirds; full tones vs isolated partials (labeled); a beating
 * model; a 380–410 ¢ alignment slider with fine steps and Show Me.
 *
 * ON THE RACK (2026-09-30): the harmonic ladders are the stage. THIRD is
 * one key that is both the preset chooser (Just / Equal / Pythagorean) and
 * the 380–410 ¢ slider on the lane (0.1 ¢ steps — the old ±¢ keys); LISTEN
 * picks full tones or isolated partials, ▶ PLAY sounds the pick, SHOW ME
 * lands on 5/4. The cents from 5/4 and the partial difference print on the
 * bezel. The beating model, a live secondary figure, sits in the well with
 * its own FULL SCREEN.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  JUST_MAJOR_THIRD, ET_MAJOR_THIRD, PYTHAGOREAN_MAJOR_THIRD, centsToRatio, harmonicFrequency, partialDifferenceHz, frequencyFromRatio,
} from '../../../../features/tuning/tuningMath';
import { renderNotes, renderPartials } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, DeviationMeter, Eyebrow, Lead, MathLine, Prompt, useMarkWhen, usePreloadClips } from '../components/primitives';
import { BEATS_H, BEATS_W, BeatingModel, HarmonicComparison, LADDER_H, LADDER_W } from '../components/harmonicLadder';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import type { DockParam } from '../../rack/rackTypes';
import { BADGE_MODEL, TuningRackLayout, lanePos, laneVal, snapNear, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

type Third = 'just' | 'equal' | 'pyth';
const THIRDS: Record<Third, { label: string; value: typeof JUST_MAJOR_THIRD }> = {
  just: { label: 'Just 5/4', value: JUST_MAJOR_THIRD },
  equal: { label: 'Equal-tempered 2^(1/3)', value: ET_MAJOR_THIRD },
  pyth: { label: 'Pythagorean 81/64', value: PYTHAGOREAN_MAJOR_THIRD },
};
const MIN = 380, MAX = 410;

export function Ch4Harmonics({ ctx }: ChapterProps) {
  const [third, setThird] = useState<Third>('just');
  const [mode, setMode] = useState<'full' | 'partials'>('full');
  const [sliderCents, setSliderCents] = useState(400);
  const [useSlider, setUseSlider] = useState(false);
  const status = usePlayerStatus(ctx.player);

  const cents = useSlider ? sliderCents : THIRDS[third].value.cents;
  const ratio = useSlider ? centsToRatio(sliderCents) : THIRDS[third].value.numericRatio;
  const f = ctx.rootHz;
  const thirdHz = frequencyFromRatio(f, ratio);
  const p5 = harmonicFrequency(f, 5);
  const p4 = harmonicFrequency(thirdHz, 4);
  const diff = partialDifferenceHz(p4, p5);
  const fromJust = cents - JUST_MAJOR_THIRD.cents;
  const aligned = Math.abs(fromJust) < 0.05;

  /**
   * W16 (2026-09-18) — and NOT a verbatim announce.
   *
   * The readout below is `accessibilityLiveRegion` (Android-only, no-op on
   * iOS) and it recomputes on every frame of a slider drag. Android's live
   * region is system-throttled; `announceForAccessibility` is NOT, so saying
   * this string whenever it changes would talk over itself continuously and
   * make the chapter worse, not better.
   *
   * What a learner actually needs to hear is the ARRIVAL — the moment the
   * third lands on 5/4 — which is the whole point of the exercise and is the
   * one thing colour alone was carrying. So this latches on the transition,
   * and says nothing while dragging.
   */
  useEffect(() => {
    if (Platform.OS !== 'ios' || !aligned) return;
    AccessibilityInfo.announceForAccessibility('Just major third, 5 to 4. Zero beats.');
  }, [aligned]);
  // Completion: the learner aligned the slider (not just pressed a preset).
  useMarkWhen(aligned && useSlider, ctx.markDone);

  const playFull = () => void ctx.player.renderAndPlay(() => renderNotes([f, thirdHz], 2.2, 'rich'), `full tones · ${useSlider ? `${cents.toFixed(1)} ¢` : THIRDS[third].label}`);
  const playPartials = () => void ctx.player.renderAndPlay(() => renderPartials([p5, p4], 2.2), `isolated partials · ${p5.toFixed(1)} + ${p4.toFixed(1)} Hz`);
  // Saved + pre-rendered clips (owner 2026-09-29): the fixed buttons' clips render in the background.
  // Every preset third, both views (the slider's value changes every frame and is not pre-rendered).
  usePreloadClips(
    ctx.player,
    () =>
      (Object.keys(THIRDS) as Third[]).flatMap((t) => {
        const th = frequencyFromRatio(f, THIRDS[t].value.numericRatio);
        return [() => renderNotes([f, th], 2.2, 'rich'), () => renderPartials([p5, harmonicFrequency(th, 4)], 2.2)];
      }),
    String(f),
  );

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'third',
      label: 'THIRD',
      value: lanePos(cents, MIN, MAX),
      // 0.1 ¢ steps on the lane — the resolution the old ±0.1 ¢ keys gave —
      // and a gentle snap onto 5/4 within a quarter cent (review 2026-09-30):
      // 300 steps ride a ~320 px lane, so the one step inside the 0.05 ¢
      // window was a single pixel wide. Snapped, the third IS 386.314 ¢.
      onChange: (p) => {
        setUseSlider(true);
        setSliderCents(snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents));
      },
      format: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents).toFixed(2)} ¢`,
      // Five keys on a 375 phone leave ~7 mono characters: "386.31 ¢" cropped.
      formatShort: (p) => `${snapNear(laneVal(p, MIN, MAX, 0.1), JUST_MAJOR_THIRD.cents).toFixed(1)}¢`,
      chooser: {
        title: 'MAJOR THIRD',
        options: (Object.keys(THIRDS) as Third[]).map((k) => ({ id: k, label: THIRDS[k].label, blurb: `${THIRDS[k].value.cents.toFixed(2)} ¢ · ratio ${THIRDS[k].value.exactLabel} ≈ ${THIRDS[k].value.decimalLabel}` })),
        selectedId: useSlider ? null : third,
        onSelect: (k) => {
          setThird(k as Third);
          setUseSlider(false);
          setSliderCents(THIRDS[k as Third].value.cents);
        },
      },
    },
    {
      kind: 'options',
      id: 'listen',
      label: 'LISTEN',
      valueLabel: mode === 'full' ? 'Tones' : 'Partials',
      options: [
        { id: 'full', label: 'Full tones', blurb: 'Harmonic-rich notes, so the compared upper partials are actually present in what you hear.' },
        { id: 'partials', label: 'Isolated partials', blurb: 'The two compared partials by themselves — not complete notes.' },
      ],
      selectedId: mode,
      onSelect: (id) => setMode(id as 'full' | 'partials'),
    },
    { kind: 'action', id: 'play', label: '▶ PLAY', onPress: mode === 'full' ? playFull : playPartials, tint: colors.green },
    { kind: 'action', id: 'showme', label: 'SHOW ME', onPress: () => { setUseSlider(true); setSliderCents(JUST_MAJOR_THIRD.cents); } },
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'M',
        initialParam: 'third',
        hideDragTag: true,
        bezel: [
          { k: 'THIRD', v: `${cents.toFixed(2)} ¢`, tint: aligned ? colors.green : colors.cyanBright },
          { k: 'FROM 5/4', v: aligned ? '0 ¢' : `${fromJust > 0 ? '+' : ''}${fromJust.toFixed(2)} ¢`, tint: aligned ? colors.green : Math.abs(fromJust) < 8 ? colors.gold : colors.orange },
          { k: 'PARTIALS Δ', v: aligned ? '0 Hz' : `${diff > 0 ? '+' : ''}${diff.toFixed(2)} Hz`, tint: aligned ? colors.green : undefined, flex: 1.15 },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={LADDER_W / LADDER_H}>
            <HarmonicComparison fit readout={false} isolate={mode === 'partials'} rootHz={f} upperHz={thirdHz} rootHarmonic={5} upperHarmonic={4} rootLabel="root C" upperLabel="major third E" />
          </StageFit>
        ),
        params,
      }}
      caption="Tap THIRD to pick Just, Equal or Pythagorean, then ride the lane to move the major third yourself. Watch the third's 4th harmonic against the root's 5th. LISTEN picks full tones or the two partials alone (the other rungs fade); ▶ PLAY sounds it."
    >
      <Lead>A tuning ratio decides whether the upper harmonics of two notes coincide or collide. Compare three major thirds against the same root.</Lead>

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
      <Text style={[styles.readout, { color: aligned ? colors.green : colors.textSecondary }]} accessibilityLiveRegion="polite">
        {aligned ? '● 5/4 — JUST MAJOR THIRD · 0 Hz · 0 ¢' : `third ${cents.toFixed(2)} ¢ · ratio ${ratio.toFixed(6)} · partial difference ${diff > 0 ? '+' : ''}${diff.toFixed(2)} Hz`}
      </Text>

      <Eyebrow>LISTEN</Eyebrow>
      <Body>
        {mode === 'full'
          ? 'Full tones: harmonic-rich notes, so the compared upper partials are actually present in what you hear.'
          : 'You are hearing the two compared partials by themselves — not complete notes.'}
      </Body>

      <Eyebrow>BEATING MODEL</Eyebrow>
      <ExpandableFigure
        title="BEATING MODEL"
        badge={BADGE_MODEL}
        aspect={BEATS_W / BEATS_H}
        render={() => <BeatingModel diffHz={diff} fit note={false} />}
      />
      <Body>
        Explanatory model, not a measurement: two partials {Math.abs(diff) < 0.01 ? 'at the same frequency stay in step — a steady envelope.' : `${Math.abs(diff).toFixed(2)} Hz apart drift in and out of step, so their sum swells and fades about ${Math.abs(diff).toFixed(2)} times per second.`}
      </Body>
      <Body>This frequency difference can produce audible beating when both partials are present and sufficiently strong. Real instruments differ in harmonic content, and audibility also depends on register, duration, phase, the room, playback and hearing.</Body>

      <Prompt>Ride THIRD until the two compared harmonics align.</Prompt>
      <DeviationMeter cents={fromJust} rangeCents={25} label="Alignment meter · cents from 5/4" />

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
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  readout: { fontFamily: fonts.barlowMedium, fontSize: 13 },
});
