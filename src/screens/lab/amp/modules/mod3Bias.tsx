/**
 * Module 3 — Bias, Conduction, and Push-Pull (spec Part 2 §4): operating
 * point, conduction angle, device handoff, and the crossover-notch task.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  simulateSingleDeviceBias, conductionCurrent, simulateLinearClass, sineCycle, WAVE_N,
} from '../../../../features/amp/ampModel';
import { AmpRig } from '../AmpRig';
import { AMP_COLORS, Body, Card, ControlSlider, HonestyBadge, LearnMore, SectionTitle, SegRow } from '../kit';

const ANGLES = [360, 270, 180, 90] as const;

/** Magnified view around the zero crossing of one output cycle (shared with Module 4). */
export function CrossoverZoom({ out }: { out: Float32Array }) {
  const W = 340, H = 110;
  const span = 22; // samples each side of the crossing at n/2
  const c = WAVE_N / 2;
  const pts: string[] = [];
  for (let i = c - span; i <= c + span; i++) {
    const x = ((i - (c - span)) / (2 * span)) * W;
    const y = H / 2 - out[i] * (H / 2 - 6) * 3.2; // ×3.2 magnification
    pts.push(`${x.toFixed(1)},${Math.max(4, Math.min(H - 4, y)).toFixed(1)}`);
  }
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Rect x={0} y={0} width={W} height={H} fill="#0a0a0c" />
      <Line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.12)" />
      <Line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
      <Polyline points={pts.join(' ')} fill="none" stroke={AMP_COLORS.output} strokeWidth={2.2} />
    </Svg>
  );
}

export function Mod3Bias() {
  const [bias, setBias] = useState(0.5);
  const [angle, setAngle] = useState<(typeof ANGLES)[number]>(360);
  const [ppBias, setPpBias] = useState(0.1);

  const single = useMemo(() => simulateSingleDeviceBias(1, bias), [bias]);
  const cond = useMemo(() => conductionCurrent(angle), [angle]);
  const audio = useMemo(() => sineCycle(1), []);
  const pp = useMemo(() => simulateLinearClass('AB', 1, ppBias), [ppBias]);

  const taskSolved = !pp.crossoverNotch && pp.idleCurrent <= 0.08;
  const tooHot = pp.idleCurrent > 0.08;

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Before the classes make sense you need three ideas: where a device is <Text style={{ color: colors.gold }}>biased</Text> to
        sit, how much of the cycle it <Text style={{ color: colors.gold }}>conducts</Text>, and what happens when two devices{' '}
        <Text style={{ color: colors.gold }}>hand off</Text> the waveform to each other.
      </Body>

      <SectionTitle>1 · BIAS — THE OPERATING POINT</SectionTitle>
      <ControlSlider label="Bias (quiescent current)" value={bias} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setBias} />
      <AmpRig
        input={sineCycle(0.5)}
        devices={{ iPos: single.iDev, iNeg: new Float32Array(WAVE_N) }}
        output={single.out}
        supplyFlow={Math.min(1, single.idleCurrent * 0.9 + 0.1)}
        heat={single.heat}
        deviceTitle="DEVICE CURRENT (gold) — can only exist between 0 and full conduction"
        a11ySummary={`Bias ${Math.round(bias * 100)} percent: ${single.region} region. Output is ${single.distorted ? 'distorted — part of the swing is lost' : 'clean'}. Relative idle heat ${Math.round(single.heat * 100)} percent.`}
      />
      <Card tone="accent">
        <Text style={[styles.regionTag, { color: single.region === 'linear' ? colors.green : colors.gold }]}>
          {single.region === 'cutoff' ? 'TOO LITTLE BIAS' : single.region === 'saturation' ? 'EXCESSIVE BIAS' : 'APPROPRIATE LINEAR BIAS'}
        </Text>
        <Body>
          {single.region === 'cutoff'
            ? 'The operating point sits near cutoff: the negative half of the swing drives the device below zero current and simply vanishes. Idle current and heat are low — but the waveform is missing a piece.'
            : single.region === 'saturation'
              ? 'The operating point sits near full conduction: the positive half runs out of room and flattens. Idle current and heat are high even before any signal.'
              : 'The device idles in the middle of its range, so the whole swing fits. Idle current and heat are moderate — this is the trade Class A makes on purpose.'}
        </Body>
        <Text style={styles.note}>No single bias value suits every amplifier — the right point depends on the device, the circuit, and the class of operation.</Text>
      </Card>

      <SectionTitle>2 · CONDUCTION ANGLE</SectionTitle>
      <Body>One full sine cycle is 360°. How much of it does the device actually pass current?</Body>
      <SegRow<(typeof ANGLES)[number]>
        options={ANGLES.map((a) => ({ key: a, label: `${a}°` }))}
        value={angle}
        onChange={setAngle}
      />
      <AmpRig
        input={audio}
        devices={{ iPos: cond.iDev, iNeg: new Float32Array(WAVE_N) }}
        supplyFlow={angle / 360}
        heat={0.15 + (angle / 360) * 0.5}
        deviceTitle={`DEVICE CURRENT — conducts for ${angle}° of the cycle`}
        a11ySummary={`Conduction angle ${angle} degrees: the device passes current for ${angle} degrees of each 360 degree cycle.`}
      />
      <Card>
        <Body>
          {angle === 360
            ? '360° — the device never switches off. Full-cycle conduction is the Class A arrangement: simplest handoff (there is none) and the most idle dissipation.'
            : angle === 180
              ? '180° — the device carries only the positive half. On its own that is half a waveform; paired with a second device for the negative half you have Class B push-pull.'
              : angle === 270
                ? 'Between 180° and 360° — the device conducts past the zero crossing into the other half. Two devices like this OVERLAP: the Class AB arrangement.'
                : 'Under 180° — short pulses near the peak only. On its own this cannot reproduce audio; Class C relies on a tuned circuit to ring between pulses.'}
        </Body>
        <Text style={styles.note}>Class D is not described by conduction angle — it switches; Module 5 covers it on its own terms.</Text>
      </Card>

      <SectionTitle>3 · PUSH-PULL AND THE HANDOFF</SectionTitle>
      <Body>
        Two complementary devices share the work: one drives the <Text style={{ color: AMP_COLORS.pos }}>positive</Text> direction,
        the other the <Text style={{ color: AMP_COLORS.neg }}>negative</Text>. Their currents combine across the load. Watch the
        crossing — where one stops and the other starts is where trouble lives.
      </Body>
      <ControlSlider label="Output-stage bias (overlap)" value={ppBias} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setPpBias} />
      <AmpRig
        input={audio}
        devices={{ iPos: pp.iPos, iNeg: pp.iNeg }}
        output={pp.out}
        supplyFlow={0.5 + pp.idleCurrent * 3}
        heat={pp.heat}
        a11ySummary={`Push-pull bias ${Math.round(ppBias * 100)} percent. ${pp.crossoverNotch ? 'A crossover notch is visible at zero crossing.' : 'The handoff is clean.'} Idle current ${Math.round(pp.idleCurrent * 100)} percent relative; heat ${Math.round(pp.heat * 100)} percent relative.`}
      />
      <Card>
        <HonestyBadge label="Zero-crossing zoom · ×3.2 vertical magnification" />
        <CrossoverZoom out={pp.out} />
        <Text style={[styles.regionTag, { color: taskSolved ? colors.green : tooHot ? colors.gold : colors.red }]}>
          {taskSolved
            ? '✓ CLEAN HANDOFF, MODEST IDLE CURRENT'
            : tooHot
              ? 'CLEAN — BUT INTO THE EXCESSIVE-HEAT REGION'
              : 'CROSSOVER NOTCH PRESENT'}
        </Text>
        <Body>
          {taskSolved
            ? `Just enough overlap: both devices conduct around zero, the notch is gone, and idle current stays at ${Math.round(pp.idleCurrent * 100)}% relative. This is the Class AB sweet spot.`
            : tooHot
              ? `The notch is gone, but idle current is ${Math.round(pp.idleCurrent * 100)}% relative — extra overlap now buys nothing except heat. Back the bias down until it just clears.`
              : 'Insufficient bias: each device waits for the signal to climb past its threshold, so the region around zero belongs to nobody. That gap is crossover distortion — audible at LOW levels, where it is a large fraction of the signal.'}
        </Body>
        <Text style={styles.task}>YOUR TASK: remove the notch without entering the excessive-heat region (idle current ≤ 8% relative).</Text>
      </Card>

      <LearnMore>
        <Body>
          Crossover distortion is sneakier than clipping: clipping grows with level, the notch is a fixed-size wound
          that matters most when the music is quiet. Thermal drift moves the bias point, which is why real output
          stages use bias-tracking components mounted on the heatsink.
        </Body>
      </LearnMore>
    </View>
  );
}

const styles = StyleSheet.create({
  regionTag: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.5 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  task: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 12.5, marginTop: 4 },
});
