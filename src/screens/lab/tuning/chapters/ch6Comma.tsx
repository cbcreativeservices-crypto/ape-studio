/**
 * Chapter 6 — The Circle Does Not Close (spec Stage 3): twelve fifths vs
 * seven octaves, the derivation one line at a time, a spiral that visibly
 * misses, and an A/B between expected C and actual B♯ in one register.
 *
 * ON THE RACK (2026-09-30): the fifth spiral is the stage (components/
 * stageFigures); the expected and actual frequencies and the gap print on
 * the bezel; HEAR is a tray of the A / B / A→B / together clips; the fifth
 * path, the two-paths card and the derivation read in the well.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { buildPythagoreanFifthChain, frac, fracLabel, fracValue, PYTHAGOREAN_COMMA, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { concatWithGap, renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { Body, Card, EquationStage, Eyebrow, Lead, MathLine, usePreloadClips } from '../components/primitives';
import { FifthPath } from '../components/fifthPath';
import { UnderstandingCheck } from '../components/check';
import { SPIRAL_H, SPIRAL_W, Spiral } from '../components/stageFigures';
import { StageFit } from '../../rack/StageFit';
import { BADGE_MODEL, TuningRackLayout, playTray, soundCell, stopKey, usePlayerStatus } from '../rackLayout';

const CHAIN = buildPythagoreanFifthChain(frac(1, 1), 12);

export function Ch6Comma({ ctx }: ChapterProps) {
  const bSharp = fracValue(CHAIN[12].normalized); // 531441/524288 — already folded into C's octave
  const expectedHz = ctx.rootHz;
  const actualHz = frequencyFromRatio(ctx.rootHz, bSharp);
  const [last, setLast] = useState<string | null>(null);
  const status = usePlayerStatus(ctx.player);
  const a = () => renderNotes([expectedHz], 1.4, 'rich');
  const b = () => renderNotes([actualHz], 1.4, 'rich');
  const together = () => renderNotes([expectedHz, actualHz], 2.2, 'rich');
  const ab = () => concatWithGap(a(), b());
  usePreloadClips(ctx.player, () => [a, b, together, ab], String(ctx.rootHz));

  return (
    <TuningRackLayout
      ctx={ctx}
      rack={{
        size: 'L',
        initialParam: 'play',
        // The spiral's GEOMETRY is schematic — equal angles per fifth, a
        // radius that grows so the path never overlays itself; only the gap
        // it labels is the exact 531441/524288 (review 2026-09-30). The
        // "exact ratios" badge belongs to the rails, not to this drawing.
        badge: BADGE_MODEL,
        bezel: [
          { k: 'EXPECTED C', v: `${expectedHz.toFixed(2)} Hz`, tint: colors.green, flex: 1.2 },
          { k: 'ACTUAL B♯', v: `${actualHz.toFixed(2)} Hz`, tint: colors.red, flex: 1.2 },
          { k: 'GAP', v: `${PYTHAGOREAN_COMMA.cents.toFixed(2)} ¢`, tint: colors.red },
          soundCell(status),
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={SPIRAL_W / SPIRAL_H}>
            {/* The pick on HEAR rings the note(s) sounding — the key changes the picture. */}
            <Spiral highlight={!status.playing && !status.rendering ? null : last === 'a' ? 'C' : last === 'b' ? 'B♯' : last ? 'both' : null} />
          </StageFit>
        ),
        params: [
          playTray({
            player: ctx.player,
            id: 'play',
            label: 'HEAR',
            last,
            setLast,
            clips: [
              { id: 'a', label: 'A · EXPECTED C', make: a, name: 'expected C', blurb: `C at 0 ¢ — ${expectedHz.toFixed(2)} Hz, where twelve fifths were expected to return.` },
              { id: 'b', label: 'B · ACTUAL B♯', make: b, name: 'actual B♯', blurb: `B♯ at +${PYTHAGOREAN_COMMA.cents.toFixed(2)} ¢ — ${actualHz.toFixed(2)} Hz, where they actually land.` },
              { id: 'ab', label: 'A → B', make: ab, name: 'expected C then actual B♯', blurb: 'The two in turn, same register.' },
              { id: 'tog', label: 'TOGETHER', make: together, name: 'expected C + actual B♯', blurb: `Both at once — ${(actualHz - expectedHz).toFixed(2)} Hz apart, so they beat.` },
            ],
            short: (c) => c.label.split(' ')[0],
          }),
          stopKey(ctx.player),
        ],
      }}
      caption={`Twelve fifths on the spiral return to C's direction but land outside it. HEAR the expected C against the actual B♯ — both in C4's register, ${expectedHz.toFixed(2)} vs ${actualHz.toFixed(2)} Hz.`}
    >
      <Lead>Twelve pure fifths almost return to the starting pitch class after seven octaves — but they miss by about {PYTHAGOREAN_COMMA.cents.toFixed(2)} cents.</Lead>
      <FifthPath steps={CHAIN} revealed={12} dimNotes />
      <Card>
        <Eyebrow>TWO PATHS TO THE SAME PLACE — ALMOST</Eyebrow>
        <View style={styles.paths}>
          <View style={styles.path} accessible accessibilityLabel={`Path A, twelve fifths: three halves to the twelfth power, equals ${fracLabel(frac(Math.pow(3, 12), Math.pow(2, 12)))}`}>
            <Text style={styles.pathTitle}>PATH A · TWELVE FIFTHS</Text>
            <MathLine>(3/2)¹²</MathLine>
            <Text style={styles.pathSub}>= {fracLabel(frac(Math.pow(3, 12), Math.pow(2, 12)))}</Text>
          </View>
          <View style={styles.path} accessible accessibilityLabel="Path B, seven octaves: two to the seventh power, equals 128">
            <Text style={styles.pathTitle}>PATH B · SEVEN OCTAVES</Text>
            <MathLine>2⁷</MathLine>
            <Text style={styles.pathSub}>= 128</Text>
          </View>
        </View>
        <Body>After twelve fifths, B♯ should represent the same pitch class as C seven octaves higher. The seven ÷2 reductions you made in Chapter 5 are those seven octaves.</Body>
      </Card>

      <EquationStage
        title="THE DERIVATION"
        reduceMotion={ctx.reduceMotion}
        steps={[
          { text: '((3/2)¹²) ÷ (2⁷)', note: 'twelve pure fifths, brought back down seven octaves' },
          { text: '= 531441 ÷ 524288', note: '3¹² = 531441 · 2¹⁹ = 524288' },
          { text: `= ${fracLabel(CHAIN[12].normalized)}`, note: 'the exact ratio — no rounding anywhere' },
          { text: `≈ ${PYTHAGOREAN_COMMA.decimalLabel}`, note: 'decimal, for reading only' },
          { text: `≈ ${PYTHAGOREAN_COMMA.cents.toFixed(2)} cents`, note: '1200 · log₂(531441/524288)', emphasis: true },
        ]}
      />

      <Body>Expected return: C at 0 ¢. Actual return: B♯ at +{PYTHAGOREAN_COMMA.cents.toFixed(2)} ¢. After seven octave reductions the expected normalized result is 1/1; the actual result is {fracLabel(CHAIN[12].normalized)}.</Body>

      {ctx.mathView ? (
        <Card tone="math">
          <Eyebrow>SEE THE MATH · INSPECT</Eyebrow>
          <MathLine>fifths: 12 · octave reductions: 7</MathLine>
          <MathLine>exact: {fracLabel(CHAIN[12].normalized)} · decimal: {PYTHAGOREAN_COMMA.decimalLabel}</MathLine>
          <MathLine>cents: 1200 · log₂({PYTHAGOREAN_COMMA.decimalLabel}) = {PYTHAGOREAN_COMMA.cents.toFixed(5)}</MathLine>
          <Body>A different display stops after SIX reductions and compares 2.000000 with ≈2.027286 — the same gap, one octave higher. This lab keeps the two stages separate and uses the seven-octave, 1/1 comparison.</Body>
        </Card>
      ) : null}

      <Eyebrow>HEAR THE GAP</Eyebrow>
      <Body>The HEAR key plays the expected C and the actual B♯ — both in C4's register, so octave equivalence is being used · {expectedHz.toFixed(2)} vs {actualHz.toFixed(2)} Hz.</Body>

      {/* NEW COPY — per-distractor feedback; options trimmed to similar length. */}
      <UnderstandingCheck
        question="Is the Pythagorean comma caused by rounding?"
        options={['Yes — decimals accumulate error over twelve steps', 'No — powers of 3/2 and powers of 2 can never be equal', 'Only when the starting note is not C', 'Yes — cents are rounded to two decimal places']}
        correct={1}
        explain="No. 3¹² = 531441 and 2¹⁹ = 524288 are different whole numbers; no power of 3/2 can ever equal a power of 2. The mismatch is exact."
        wrong={[
          'The derivation above used whole numbers only — 531441 and 524288 — and never rounded. Where would the error come from?',
          undefined,
          'The chain is the same ratios from any start: 3¹² ÷ 2¹⁹ does not depend on which note you call C.',
          'Cents are only a way of READING the gap. The ratio 531441/524288 is exact before any cents are computed.',
        ]}
        onCorrect={ctx.markDone}
      />
      <Body>The discrepancy cannot be removed while every fifth remains exactly 3:2. A tuning system must decide what to preserve and where to place the mismatch.</Body>
    </TuningRackLayout>
  );
}

const styles = StyleSheet.create({
  paths: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  path: { flex: 1, minWidth: 130, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 10, backgroundColor: '#101013' },
  pathTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2 },
  pathSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
