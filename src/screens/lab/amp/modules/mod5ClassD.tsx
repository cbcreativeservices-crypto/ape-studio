/**
 * Module 5 — Inside Class D (spec Part 2 §6): modulation → switching stage →
 * output filter → loudspeaker. Visual only — no switching waveform is ever
 * sent to the device speaker.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { simulateClassD } from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS } from '../../../../features/amp/ampContent';
import { AmpRig } from '../AmpRig';
import { AMP_COLORS, Body, Card, ControlSlider, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow } from '../kit';

type ViewMode = 'raw' | 'filter' | 'recovered';

function SignalPath() {
  const boxes = ['AUDIO IN', 'MODULATION', 'SWITCHING', 'OUTPUT FILTER', 'SPEAKER'];
  const bw = 62, gap = 9, x0 = 3, y = 12, bh = 30;
  return (
    <Svg width="100%" height={56} viewBox="0 0 360 56">
      {boxes.map((b, i) => {
        const x = x0 + i * (bw + gap);
        const last = i === 4;
        return (
          <G key={b}>
            <Rect x={x} y={y} width={bw} height={bh} rx={5} fill={last ? '#1a2a1e' : i === 2 ? '#1f1a0e' : '#151518'} stroke={last ? AMP_COLORS.output : i === 2 ? AMP_COLORS.supply : colors.steelBorder} />
            <SvgText x={x + bw / 2} y={y + 19} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b}</SvgText>
            {i < 4 ? <Line x1={x + bw + 1} y1={y + bh / 2} x2={x + bw + gap - 1} y2={y + bh / 2} stroke={i === 0 ? AMP_COLORS.input : i >= 3 ? AMP_COLORS.output : AMP_COLORS.supply} strokeWidth={1.5} /> : null}
          </G>
        );
      })}
    </Svg>
  );
}

/** Representative half-bridge switching stage: high side, low side, node, filter, load. */
function SwitchingStage({ dutyAtPeak }: { dutyAtPeak: number }) {
  return (
    <Svg width="100%" height={150} viewBox="0 0 360 150">
      <SvgText x={20} y={16} fontSize={9} fill={AMP_COLORS.supply} fontFamily={fonts.oswaldMedium}>+RAIL</SvgText>
      <SvgText x={20} y={142} fontSize={9} fill={AMP_COLORS.supply} fontFamily={fonts.oswaldMedium}>−RAIL</SvgText>
      <Line x1={60} y1={12} x2={60} y2={138} stroke={AMP_COLORS.supply} strokeWidth={1.2} strokeDasharray="3,2" />
      {/* high-side device */}
      <Rect x={40} y={28} width={40} height={30} rx={5} fill="#151518" stroke={AMP_COLORS.pos} />
      <SvgText x={60} y={41} fontSize={9} fill={AMP_COLORS.pos} textAnchor="middle" fontFamily={fonts.oswaldMedium}>HIGH</SvgText>
      <SvgText x={60} y={53} fontSize={9} fill={AMP_COLORS.pos} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SIDE</SvgText>
      {/* low-side device */}
      <Rect x={40} y={92} width={40} height={30} rx={5} fill="#151518" stroke={AMP_COLORS.neg} strokeDasharray="4,2" />
      <SvgText x={60} y={105} fontSize={9} fill={AMP_COLORS.neg} textAnchor="middle" fontFamily={fonts.oswaldMedium}>LOW</SvgText>
      <SvgText x={60} y={117} fontSize={9} fill={AMP_COLORS.neg} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SIDE</SvgText>
      {/* switching node */}
      <Line x1={80} y1={75} x2={150} y2={75} stroke={colors.textSecondary} strokeWidth={1.5} />
      <SvgText x={115} y={68} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>switching node</SvgText>
      {/* filter: inductor + capacitor */}
      <Path d="M150 75 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0" fill="none" stroke={colors.textSecondary} strokeWidth={1.6} />
      <Line x1={198} y1={75} x2={240} y2={75} stroke={colors.textSecondary} strokeWidth={1.5} />
      <Line x1={220} y1={75} x2={220} y2={100} stroke={colors.textSecondary} strokeWidth={1.5} />
      <Line x1={210} y1={100} x2={230} y2={100} stroke={colors.textSecondary} strokeWidth={2} />
      <Line x1={210} y1={106} x2={230} y2={106} stroke={colors.textSecondary} strokeWidth={2} />
      <SvgText x={174} y={98} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>L  C  low-pass filter</SvgText>
      {/* load */}
      <Rect x={240} y={60} width={70} height={30} rx={5} fill="#1a2a1e" stroke={AMP_COLORS.output} />
      <SvgText x={275} y={79} fontSize={9.5} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>LOAD</SvgText>
      <SvgText x={275} y={108} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>high side on ≈{Math.round(dutyAtPeak * 100)}%</SvgText>
      <SvgText x={275} y={121} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>of each period at the peak</SvgText>
    </Svg>
  );
}

const LOSSES: { label: string; share: number }[] = [
  { label: 'Power supply conversion', share: 0.3 },
  { label: 'Device conduction (Rds-on)', share: 0.25 },
  { label: 'Switching transitions', share: 0.2 },
  { label: 'Control + gate drive', share: 0.1 },
  { label: 'Output filter', share: 0.15 },
];

export function Mod5ClassD() {
  const [drive, setDrive] = useState(0.7);
  const [view, setView] = useState<ViewMode>('raw');
  const sim = useMemo(() => simulateClassD(drive), [drive]);
  const dutyAtPeak = (1 + Math.min(0.95, drive)) / 2;
  const lossW = 100 - sim.efficiencyPct; // per 100 W in, illustrative

  const outputForView = view === 'raw' ? sim.pwm : view === 'filter' ? sim.pwm : sim.recovered;
  const extra =
    view === 'filter'
      ? [{ data: sim.recovered, color: AMP_COLORS.recovered, width: 2.2, label: 'filter output (recovered audio)' }]
      : undefined;

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Class D is not a bigger Class C, and it is not digital. The audio is turned into a fast on/off pattern whose{' '}
        <Text style={{ color: colors.gold }}>average</Text> follows the waveform; a filter keeps the average and
        throws the switching away.
      </Body>
      <Card>
        <HonestyBadge label="Signal path — conceptual" />
        <SignalPath />
      </Card>

      <SectionTitle>1 · MODULATION (PWM)</SectionTitle>
      <Body>
        The comparator holds the audio against a much faster triangle carrier: audio above carrier → switch high;
        below → switch low. Louder audio makes wider pulses. Pulse-width modulation is the classic example, not the
        only Class D method.
      </Body>
      <ControlSlider label="Audio input level" value={drive} min={0} max={0.95} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setDrive} />
      <SegRow<ViewMode>
        label="Output panel shows"
        options={[
          { key: 'raw', label: 'Raw switching' },
          { key: 'filter', label: 'Filter action' },
          { key: 'recovered', label: 'Recovered audio' },
        ]}
        value={view}
        onChange={setView}
      />
      <AmpRig
        input={sim.audio}
        extraIn={[{ data: sim.carrier, color: AMP_COLORS.supply, dash: '3,2', width: 1, label: 'triangle carrier' }]}
        output={outputForView}
        extraOut={extra}
        outputTitle={
          view === 'raw'
            ? 'SWITCHING WAVEFORM (comparator result) — two states only'
            : view === 'filter'
              ? 'SWITCHING WAVEFORM + FILTER OUTPUT'
              : 'RECOVERED AUDIO (after the output filter)'
        }
        supplyFlow={0.15 + drive * 0.7}
        heat={sim.heat}
        efficiencyPct={sim.efficiencyPct}
        speaker={view === 'recovered'}
        a11ySummary={`Class D at ${Math.round(drive * 100)} percent input. Cycle-average duty ${Math.round(sim.meanDuty * 100)} percent; at the positive peak the high-side device is on about ${Math.round(dutyAtPeak * 100)} percent of each switching period. View: ${view}. Illustrative efficiency ${Math.round(sim.efficiencyPct)} percent.`}
      />
      <Text style={styles.note}>Switching rate reduced for visual demonstration — real carriers run at hundreds of kilohertz. Input panel: audio (cyan) against the carrier (amber dashed).</Text>
      <Card tone="accent">
        <Body>
          {view === 'raw'
            ? `Only two levels exist here: +rail and −rail. The audio is hidden in the WIDTHS. Cycle-average duty is ${Math.round(sim.meanDuty * 100)}% (silence would be exactly 50%); at the positive peak the high side is on ≈${Math.round(dutyAtPeak * 100)}% of each period.`
            : view === 'filter'
              ? 'The low-pass filter averages the pulses. Where pulses are wide the average is high; where narrow, low. The bright trace is what the loudspeaker gets.'
              : 'What remains after the filter: the audio waveform, following the input. This — never the raw switching — is what reaches the loudspeaker.'}
        </Body>
      </Card>

      <SectionTitle>2 · THE SWITCHING STAGE</SectionTitle>
      <Card>
        <HonestyBadge label="Representative half-bridge — conceptual" />
        <SwitchingStage dutyAtPeak={dutyAtPeak} />
        <Body>
          The high-side device connects the node to +rail, the low-side to −rail. They must never conduct at the same
          time — that would short the rails through both devices.
        </Body>
      </Card>
      <LearnMore title="DEAD TIME">
        <Body>
          A tiny gap is inserted between one device turning off and the other turning on. Too little dead time risks
          both conducting at once (shoot-through); too much distorts the average the filter is trying to recover.
          Getting it right is a design matter — this lab does not teach construction.
        </Body>
      </LearnMore>

      <SectionTitle>3 · WHERE THE ENERGY GOES</SectionTitle>
      <Card>
        <HonestyBadge label="Illustrative loss breakdown at this level — not measured" />
        <Text style={styles.effBig}>{Math.round(sim.efficiencyPct)}% to the load · {Math.round(lossW)}% lost as heat</Text>
        <Text style={styles.note}>Drag the input level down and watch the split move: at low output the fixed losses are most of what the supply pays for.</Text>
        {LOSSES.map((l) => (
          <View key={l.label} style={styles.lossRow}>
            <Text style={styles.lossLabel}>{l.label}</Text>
            <View style={styles.lossTrack}>
              <View style={[styles.lossFill, { width: `${Math.min(100, Math.round(l.share * lossW * 2.5))}%` }]} />
            </View>
            <Text style={styles.lossPct}>{(l.share * lossW).toFixed(1)}%</Text>
          </View>
        ))}
        <Body>
          An ideal switch is either fully on (no voltage across it) or fully off (no current through it) — so in theory
          it dissipates nothing. Real devices have on-resistance, take time to switch, need gate charge, and the filter
          has losses of its own. Efficiency also drops at low output, where the fixed losses dominate.
        </Body>
      </Card>

      <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'd-is-digital')!} />
      <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'd-no-heat')!} />
      <Text style={styles.note}>
        Class D is not inherently better or worse than a linear amplifier — the complete implementation (modulator,
        switching stage, filter, feedback, supply) determines real performance.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  effBig: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  lossRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lossLabel: { width: 150, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12 },
  lossTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  lossFill: { height: '100%', backgroundColor: '#e6902f' },
  lossPct: { width: 40, textAlign: 'right', color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11 },
});
