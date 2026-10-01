/**
 * Chapter 10 — Divide the Octave Equally (spec Stage 4): derive r = 2^(1/12)
 * on a LOGARITHMIC cents rail, build the twelve markers one at a time, show
 * the hertz steps growing while the ratio stays constant, and compare the
 * tempered fifth and third with their pure counterparts.
 *
 * ON THE RACK (2026-09-30): the chromatic rail is the stage; STEPS on the
 * lane is how many ×r steps are built (ride back to RESET, forward to AUTO);
 * ADD STEP builds the next; A / B plays the transposition pair; the step's
 * ratio, cents and hertz print on the bezel.
 */
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildEqualChromatic, ET_SEMITONE, ET_SEMITONE_RATIO, ET_FIFTH, ET_MAJOR_THIRD, PURE_FIFTH, JUST_MAJOR_THIRD, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { concatWithGap, renderSequence } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, CentsRail, CENTS_RAIL_W, EquationStage, Eyebrow, Lead, MathLine, Prompt, useMarkWhen, usePreloadClips, type RailMarker } from '../components/primitives';
import { UnderstandingCheck } from '../components/check';
import { StageFit } from '../../rack/StageFit';
import type { DockParam } from '../../rack/rackTypes';
import { TuningRackLayout, playTray, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const CHROMA = buildEqualChromatic();
const RAIL_H = 110;

export function Ch10Equal({ ctx }: ChapterProps) {
  const [built, setBuilt] = useState(0); // markers revealed beyond the root
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);
  const root = ctx.rootHz;
  const hz = (k: number) => frequencyFromRatio(root, CHROMA[k].value.numericRatio);
  useMarkWhen(built >= 12, ctx.markDone);
  // Hertz added by one equal semitone from a given start — for the check.
  const semiStep = (f: number) => f * (ET_SEMITONE_RATIO - 1);
  const stepC4 = semiStep(root), stepC5 = semiStep(root * 2);
  const pattern = [0, 2, 4, 7, 4, 2, 0]; // a short neutral major pattern in semitones
  // The A / B pick lights the pattern's notes on the rail while it sounds
  // (review 2026-09-30): in C the steps 0·2·4·7, on F the same shape five
  // steps up (5·7·9·12) — the transposition is SEEN as the same spacing, not
  // only heard. Before, the key changed nothing on the glass.
  const lit = new Set<number>(!status.playing ? [] : last === 'a' ? pattern : last === 'b' ? pattern.map((s) => s + 5) : last === 'ab' ? [...pattern, ...pattern.map((s) => s + 5)] : []);
  const markers: RailMarker[] = CHROMA.map((n, k) => ({
    id: `e${k}`, cents: n.value.cents, label: k <= built || k === 12 || lit.has(k) ? n.spelling.split('/')[0] : '', role: lit.has(k) ? 'active' : k === built && built > 0 ? 'operation' : k <= built ? 'neutral' : 'muted', emphasis: k === built || lit.has(k), row: k % 2,
  }));
  const seq = (start: number) => renderSequence(pattern.map((s) => frequencyFromRatio(root, Math.pow(2, (start + s) / 12))), 0.28, 'rich');
  usePreloadClips(ctx.player, () => [() => seq(0), () => seq(5), () => concatWithGap(seq(0), seq(5))], String(root));

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'steps',
      label: 'STEPS',
      value: built / 12,
      onChange: (p) => setBuilt(Math.round(p * 12)),
      format: (p) => {
        const k = Math.round(p * 12);
        return `${k} of 12 · ${CHROMA[k].spelling}`;
      },
      formatShort: (p) => `${Math.round(p * 12)}/12`,
      home: 0,
    },
    { kind: 'action', id: 'add', label: built < 12 ? 'ADD ×r' : 'OCTAVE ✓', onPress: () => setBuilt((b) => Math.min(12, b + 1)), tint: built < 12 ? colors.green : undefined },
    playTray({
      player: ctx.player,
      id: 'ab',
      label: 'A / B',
      last,
      setLast,
      clips: [
        { id: 'a', label: 'A · PATTERN IN C', make: () => seq(0), name: 'pattern in C' },
        { id: 'b', label: 'B · STARTING ON F', make: () => seq(5), name: 'pattern starting on F', blurb: 'Five semitones up: every interval keeps the same ratio, so the pattern is the same shape.' },
        { id: 'ab', label: 'A → B', make: () => concatWithGap(seq(0), seq(5)), name: 'pattern in C, then on F' },
      ],
      short: (c) => c.label.split(' ')[0],
    }),
    stopKey(ctx.player),
  ];

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'S',
        initialParam: 'steps',
        hideDragTag: true,
        bezel: [
          { k: 'STEP', v: `${built}/12`, flex: 0.8 },
          { k: 'RATIO', v: built === 0 ? '1' : CHROMA[built].value.decimalLabel, tint: colors.gold, flex: 1.2 },
          { k: 'Hz', v: `${hz(built).toFixed(2)} Hz`, flex: 1.1 },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={CENTS_RAIL_W / RAIL_H}>
            <CentsRail markers={markers} reduceMotion={ctx.reduceMotion} height={RAIL_H} fit />
          </StageFit>
        ),
        params,
      }}
      caption="Press ADD ×r twelve times, or ride STEPS, and watch the hertz increase grow while the ratio stays the same. A / B plays one short pattern in C and starting on F — its notes light on the rail as it sounds."
    >
      <Lead>What if every semitone used exactly the same frequency ratio?</Lead>
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
      <Body>The same short major pattern in C and starting on F — the A / B key. Every interval containing the same number of semitones has the same ratio in every key — timbre and register still affect how it sounds.</Body>

      <Body>Equal temperament keeps the octave exact and distributes smaller discrepancies consistently across the twelve notes.</Body>
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
