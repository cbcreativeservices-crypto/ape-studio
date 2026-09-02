/**
 * Module 1 — What an Amplifier Actually Does (spec Part 2 §2).
 * Predict → adjust → observe → explain: the input steers, the supply pays.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  sineCycle, amplify, isClipping, cycleRms, simulateLinearClass, sineVrms, resistivePower,
} from '../../../../features/amp/ampModel';
import { AmpRig } from '../AmpRig';
import {
  AMP_COLORS, Body, Card, ControlSlider, FaultBanner, FormulaCard, HonestyBadge, LearnMore, SectionTitle, SegRow,
} from '../kit';

const GAIN = 1.5;
const RAIL = 1.0;

/** Input → Input Stage → Voltage Gain → Driver/Output → Load, supply below. */
function SignalPathDiagram({ level, clipping }: { level: number; clipping: boolean }) {
  const boxes = ['INPUT', 'INPUT STAGE', 'VOLT. GAIN', 'DRIVER/OUTPUT', 'LOAD'];
  const bw = 60, gap = 10, x0 = 4, y = 10, bh = 28;
  return (
    <Svg width="100%" height={92} viewBox="0 0 360 92">
      {boxes.map((b, i) => {
        const x = x0 + i * (bw + gap);
        const isLoad = i === 4;
        return (
          <G key={b}>
            <Rect x={x} y={y} width={bw} height={bh} rx={5} fill={isLoad ? '#1a2a1e' : '#151518'} stroke={isLoad ? AMP_COLORS.output : colors.steelBorder} strokeWidth={1} />
            <SvgText x={x + bw / 2} y={y + 18} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b}</SvgText>
            {i < 4 ? <Path d={`M${x + bw + 1} ${y + bh / 2} l${gap - 2} 0`} stroke={i === 0 ? AMP_COLORS.input : AMP_COLORS.output} strokeWidth={1.5} /> : null}
          </G>
        );
      })}
      {/* power supply feeding the gain and output stages */}
      <Rect x={130} y={58} width={150} height={26} rx={5} fill="#1f1a0e" stroke={AMP_COLORS.supply} strokeWidth={1} />
      <SvgText x={205} y={75} fontSize={9} fill={AMP_COLORS.supply} textAnchor="middle" fontFamily={fonts.oswaldMedium}>POWER SUPPLY  (+rail / −rail)</SvgText>
      <Line x1={174} y1={58} x2={174} y2={y + bh + 1} stroke={AMP_COLORS.supply} strokeWidth={1.5} strokeDasharray="3,2" />
      <Line x1={244} y1={58} x2={244} y2={y + bh + 1} stroke={AMP_COLORS.supply} strokeWidth={1.5} strokeDasharray="3,2" />
      <SvgText x={296} y={76} fontSize={8.5} fill={clipping ? colors.red : colors.textMuted} fontFamily={fonts.barlowMedium}>
        {clipping ? 'LIMIT REACHED' : `${Math.round(level * 100)}% drive`}
      </SvgText>
    </Svg>
  );
}

export function Mod1What() {
  const [level, setLevel] = useState(0.4);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [compare, setCompare] = useState<'line' | 'amp'>('amp');

  const sim = useMemo(() => {
    const input = sineCycle(level);
    const output = amplify(input, GAIN, RAIL);
    const clipping = isClipping(input, GAIN, RAIL);
    const outRms = cycleRms(output);
    const cls = simulateLinearClass('AB', Math.min(1, level * GAIN), 0.5);
    return {
      input, output, clipping, outRms,
      supplyFlow: Math.min(1, 0.06 + outRms * 1.2),
      heat: Math.min(1, 0.12 + outRms * 0.7 + (clipping ? 0.15 : 0)),
      eff: cls.efficiencyPct,
    };
  }, [level]);

  const limitLevel = RAIL / GAIN; // 0.667
  const crossed = level > limitLevel;

  // Applied comparison: line out vs power amp into an 8 Ω resistive teaching load.
  const lineVrms = sineVrms(1.0)!; // ~0.7 V line level peak 1 V
  const linePower = resistivePower(lineVrms, 8)!; // ≈ 0.06 W
  const ampVrms = sineVrms(20)!; // 20 V peak from the amplifier
  const ampPower = resistivePower(ampVrms, 8)!; // 25 W

  return (
    <View style={{ gap: 12 }}>
      <Body>
        An amplifier does not enlarge the input signal, and it does not create energy. The input
        signal <Text style={{ color: AMP_COLORS.input }}>steers</Text>; the power supply{' '}
        <Text style={{ color: AMP_COLORS.supply }}>pays</Text>; the output stage hands that energy
        to the load in the shape the input asked for.
      </Body>

      <Card>
        <HonestyBadge label="Functional path — conceptual" />
        <SignalPathDiagram level={level} clipping={sim.clipping} />
      </Card>

      <SectionTitle>PREDICT, THEN TRY</SectionTitle>
      <Body>The output can only swing as far as the supply rails allow. What happens when you push the input past that point?</Body>
      <SegRow<string>
        options={[
          { key: 'grow', label: 'Output keeps growing' },
          { key: 'flat', label: 'Peaks flatten at the rails' },
          { key: 'quiet', label: 'Input gets quieter' },
        ]}
        value={prediction ?? ''}
        onChange={setPrediction}
      />

      <ControlSlider label="Input level" value={level} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setLevel} />

      <AmpRig
        input={sim.input}
        output={sim.output}
        clipAt={RAIL}
        supplyFlow={sim.supplyFlow}
        heat={sim.heat}
        efficiencyPct={sim.eff}
        speaker
        faulted={sim.clipping}
        a11ySummary={
          sim.clipping
            ? `Input ${Math.round(level * 100)} percent. Output is clipping at the supply rails. Supply draw and heat are high.`
            : `Input ${Math.round(level * 100)} percent. Output is clean and follows the input at ${GAIN} times. Supply draw rises with output.`
        }
      />
      <FaultBanner primary={sim.clipping ? 'output-clipping' : null} />

      {crossed ? (
        <Card tone="accent">
          <Text style={styles.explainTitle}>WHAT HAPPENED</Text>
          <Body>
            {/* NEW COPY: the card now appears whether or not a prediction was
                made (it used to stay hidden if the learner skipped the
                prediction — the explanation is the lesson, the prediction is
                the hook) and the heat sentence no longer asserts a mechanism
                the model does not carry. */}
            {prediction === 'flat'
              ? 'You called it. '
              : prediction === 'grow'
                ? 'Not this time — nothing lets the output exceed its rails. '
                : prediction === 'quiet'
                  ? 'The input is unaffected — the limit lives at the OUTPUT. '
                  : 'You skipped the prediction — commit to one next time; a guess you had to defend is what makes the answer stick. '}
            Past about {Math.round(limitLevel * 100)}% input, the requested output ({GAIN}× the input) exceeds the
            ±{RAIL} rail limit, so the peaks flatten. The output stopped following the input the moment the supply
            could not deliver more voltage. Supply draw is now at its ceiling, and the flattened peaks carry
            harmonic energy the original signal never had.
          </Body>
        </Card>
      ) : null}

      <FormulaCard
        title="Three kinds of gain"
        lines={['Voltage gain   Av = Vout / Vin', 'Current gain   Ai = Iout / Iin', 'Power gain     Ap = Pout / Pin']}
        note="In decibels: voltage/current gain use 20·log10(ratio); power gain uses 10·log10(ratio). A power amplifier delivers current gain and power gain, not just bigger volts."
      />

      <SectionTitle>APPLIED COMPARISON</SectionTitle>
      <SegRow<'line' | 'amp'>
        options={[
          { key: 'line', label: 'Line out → speaker' },
          { key: 'amp', label: 'Line out → power amp → speaker' },
        ]}
        value={compare}
        onChange={setCompare}
      />
      <Card>
        <HonestyBadge label="8 Ω resistive teaching example — real speakers are reactive" />
        {compare === 'line' ? (
          <>
            <Text style={styles.compareBig}>≈ {linePower.toFixed(2)} W</Text>
            <Body>
              A line output swings about 1 V peak and is built to feed high-impedance inputs with almost no current.
              Into an 8 Ω speaker, P = Vrms²/R = {lineVrms.toFixed(2)}² ÷ 8 ≈ {linePower.toFixed(3)} W — and in practice the
              output stage cannot even source that current cleanly. The cone barely moves.
            </Body>
          </>
        ) : (
          <>
            <Text style={styles.compareBig}>≈ {ampPower.toFixed(0)} W</Text>
            <Body>
              The power amplifier takes the same line signal and, using its supply, swings 20 V peak with amps of
              current behind it: P = {ampVrms.toFixed(1)}² ÷ 8 = {ampPower.toFixed(0)} W. Same shape as the input; the energy came
              from the rails.
            </Body>
          </>
        )}
      </Card>

      <LearnMore>
        <Body>
          Voltage gain alone is not amplification in the power sense: a step-up transformer gives voltage gain
          while its available current drops. Real amplification means the output can deliver MORE power than the
          input carried — and that extra power has exactly one source, the supply.
        </Body>
        <Body>
          Gain in decibels: Av = 100 is 40 dB (20·log10 100). Ap = 100 is 20 dB (10·log10 100). The two dB
          formulas agree only when input and output impedances match.
        </Body>
      </LearnMore>
    </View>
  );
}

const styles = StyleSheet.create({
  explainTitle: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2 },
  compareBig: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 24 },
});
