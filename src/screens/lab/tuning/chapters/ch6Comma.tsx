/**
 * Chapter 6 — The Circle Does Not Close (spec Stage 3): twelve fifths vs
 * seven octaves, the derivation one line at a time, a spiral that visibly
 * misses, and an A/B between expected C and actual B♯ in one register.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { buildPythagoreanFifthChain, frac, fracLabel, fracValue, PYTHAGOREAN_COMMA, frequencyFromRatio } from '../../../../features/tuning/tuningMath';
import { renderNotes } from '../../../../features/tuning/tuningAudio';
import type { ChapterProps } from '../labCtx';
import { AudioComparisonControls, Body, Card, EquationStage, Eyebrow, Lead, MathLine, ROLE } from '../components/primitives';
import { FifthPath } from '../components/fifthPath';
import { UnderstandingCheck } from '../components/check';

const CHAIN = buildPythagoreanFifthChain(frac(1, 1), 12);

function Spiral() {
  // Geometry: the outermost point (B♯, index 12) must stay INSIDE the 240-high
  // viewBox — with r0 = 78 and cy = 120 it sat at y ≈ 3.6 and its 6-px dot was
  // clipped at the top edge.
  const cx = 170, cy = 128, r0 = 70;
  const pts = CHAIN.map((s) => {
    const ang = (s.index / 12) * 2 * Math.PI - Math.PI / 2;
    // A spiral: the radius grows a little each fifth so the path never overlays itself;
    // the final point lands at the same angle as C but visibly outside it.
    const r = r0 + s.index * 3.2;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), s };
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const first = pts[0], last = pts[12];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Fifth spiral: twelve fifths return to C's direction but land outside it — B sharp sits ${PYTHAGOREAN_COMMA.cents.toFixed(2)} cents above C.`}>
      <Svg width="100%" height={240} viewBox="0 0 340 240">
        <Path d={d} fill="none" stroke={colors.textSub} strokeWidth={1.4} />
        {pts.map((p) => (
          <Svg key={p.s.index}>
            <Circle cx={p.x} cy={p.y} r={p.s.index === 0 || p.s.index === 12 ? 6 : 3.5} fill={p.s.index === 12 ? ROLE.error : p.s.index === 0 ? ROLE.exact : colors.textSecondary} />
            <SvgText x={p.x + (p.x > cx ? 9 : -9)} y={p.y + 3} fontSize={9} fill={p.s.index === 12 ? ROLE.error : colors.textSecondary} textAnchor={p.x > cx ? 'start' : 'end'} fontFamily={fonts.oswaldMedium}>{p.s.spelling}</SvgText>
          </Svg>
        ))}
        {/* the measurement bracket between expected and actual */}
        <Line x1={first.x} y1={first.y - 8} x2={last.x} y2={last.y + 8} stroke={ROLE.error} strokeWidth={1.5} strokeDasharray="3,2" />
        <SvgText x={cx} y={cy - 4} fontSize={10} fill={ROLE.error} textAnchor="middle" fontFamily={fonts.oswaldMedium}>gap: {PYTHAGOREAN_COMMA.cents.toFixed(2)} ¢</SvgText>
        <SvgText x={cx} y={cy + 10} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>EXPECTED C · ACTUAL B♯</SvgText>
        <SvgText x={cx} y={cy + 24} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PYTHAGOREAN COMMA</SvgText>
      </Svg>
    </View>
  );
}

export function Ch6Comma({ ctx }: ChapterProps) {
  const bSharp = fracValue(CHAIN[12].normalized); // 531441/524288 — already folded into C's octave
  const expectedHz = ctx.rootHz;
  const actualHz = frequencyFromRatio(ctx.rootHz, bSharp);

  return (
    <View style={{ gap: 12 }}>
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

      <Spiral />
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
      <AudioComparisonControls
        player={ctx.player}
        a={() => renderNotes([expectedHz], 1.4, 'rich')}
        b={() => renderNotes([actualHz], 1.4, 'rich')}
        together={() => renderNotes([expectedHz, actualHz], 2.2, 'rich')}
        labelA="expected C"
        labelB="actual B♯"
        note={`both in C4's register — octave equivalence is being used · ${expectedHz.toFixed(2)} vs ${actualHz.toFixed(2)} Hz`}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  paths: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  path: { flex: 1, minWidth: 130, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 10, backgroundColor: '#101013' },
  pathTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2 },
  pathSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
