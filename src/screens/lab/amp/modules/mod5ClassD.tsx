/**
 * Module 5 — Inside Class D (spec Part 2 §6): modulation → switching stage →
 * output filter → loudspeaker. Visual only — no switching waveform is ever
 * sent to the device speaker.
 *
 * RACK (2026-09-30): TWO rack steps. MODULATION pins the rig (audio against
 * the carrier, the switching / filtered / recovered output) with LEVEL on
 * the lane and VIEW as a sticky tray; THE SWITCHING STAGE pins the
 * half-bridge drawing, whose duty figure follows the same level. The
 * signal-path diagram, the loss breakdown and the misconceptions are the
 * reading in the well.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { colors, fonts } from '../../../../theme/tokens';
import { simulateClassD } from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS } from '../../../../features/amp/ampContent';
import { rigStatusBezel, type RigPicture } from '../AmpRig';
import { faderParam, optionsParam } from '../AmpRack';
import { AmpModuleSteps } from '../steps';
import { GroundSymbol, MosfetSymbol, SpeakerCabinet, SpeakerSymbol } from '../ampSymbols';
import { AMP_COLORS, Body, BoxLabel, Card, DIAGRAM_FONT, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle } from '../kit';

type ViewMode = 'raw' | 'filter' | 'recovered';

/** Drawing units (legibility pass 2026-09-25: labels ≥ DIAGRAM_FONT, each SVG
 *  drawn at the width it is handed, height = w / aspect). */
const PATH_W = 360;
const PATH_H = 52;
const STAGE_W = 360;
const STAGE_H = 150;

function SignalPath({ width, height }: { width: number; height: number }) {
  const boxes: string[][] = [['AUDIO IN'], ['MODULATION'], ['SWITCHING'], ['OUTPUT', 'FILTER'], ['SPEAKER']];
  const bw = 66, gap = 6, x0 = 3, y = 8, bh = 36;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${PATH_W} ${PATH_H}`}>
      {boxes.map((b, i) => {
        const x = x0 + i * (bw + gap);
        const last = i === 4;
        return (
          <G key={b.join(' ')}>
            {last ? (
              // The loudspeaker itself, not a box (round 3).
              <>
                <SpeakerCabinet cx={x + bw / 2} y={2} h={33} color={AMP_COLORS.output} />
                <SvgText x={x + bw / 2} y={48} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SPEAKER</SvgText>
              </>
            ) : (
              <>
                <Rect x={x} y={y} width={bw} height={bh} rx={5} fill={i === 2 ? '#1f1a0e' : '#151518'} stroke={i === 2 ? AMP_COLORS.supply : colors.steelBorder} />
                <BoxLabel x={x + bw / 2} y={y + bh / 2 + 4} lines={b} fill={colors.textSecondary} />
              </>
            )}
            {i < 4 ? <Line x1={x + bw + 1} y1={y + bh / 2} x2={x + bw + gap - 1} y2={y + bh / 2} stroke={i === 0 ? AMP_COLORS.input : i >= 3 ? AMP_COLORS.output : AMP_COLORS.supply} strokeWidth={1.5} /> : null}
          </G>
        );
      })}
    </Svg>
  );
}

/** Representative half-bridge switching stage as a CLOSED circuit (round 3,
 *  lab-art grading 2026-10-16: the old drawing was three labelled boxes, the
 *  node wire started in the gap between them, the filter capacitor had no
 *  ground and the load no return). Now: +RAIL → high-side MOSFET → the
 *  switching NODE (a junction) → low-side MOSFET → −RAIL; NODE → L → output
 *  → C to ground, and the loudspeaker from the output back to ground — the
 *  supply's centre (0 V) between the split rails, where the current returns.
 *  The LEVEL fader still changes the PICTURE (review 2026-09-30): each
 *  device's channel lights with its share of a period at the peak, and one
 *  switching period is drawn over the node wire — its high portion IS the
 *  duty. */
function SwitchingStage({ dutyAtPeak, width, height }: { dutyAtPeak: number; width: number; height: number }) {
  const F = DIAGRAM_FONT;
  const d = Math.max(0, Math.min(1, dutyAtPeak));
  const ink = colors.textSecondary;
  const DX = 74; // the device column (drains/sources)
  const NODE_Y = 75;
  const GND_Y = 128; // the 0 V return
  // One switching period drawn above the node wire: high for d of it.
  const px0 = 92, pw = 52, pyHi = 52, pyLo = 64;
  const pulse = `M${px0} ${pyLo} V${pyHi} H${(px0 + pw * d).toFixed(1)} V${pyLo} H${px0 + pw}`;
  // Output node and the parts hanging from it.
  const OUT_X = 214;
  const SPK_X = 270; // the loudspeaker's terminal column
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
      {/* split supply rails */}
      <SvgText x={8} y={18} fontSize={F} fill={AMP_COLORS.supply} fontFamily={fonts.oswaldMedium}>+RAIL</SvgText>
      <Line x1={44} y1={14} x2={DX + 10} y2={14} stroke={AMP_COLORS.supply} strokeWidth={2} />
      <SvgText x={8} y={144} fontSize={F} fill={AMP_COLORS.supply} fontFamily={fonts.oswaldMedium}>−RAIL</SvgText>
      <Line x1={44} y1={140} x2={DX + 10} y2={140} stroke={AMP_COLORS.supply} strokeWidth={2} />
      {/* the two devices in series between the rails */}
      <MosfetSymbol x={DX} yD={14} yS={NODE_Y} color={AMP_COLORS.pos} on={d} />
      <MosfetSymbol x={DX} yD={NODE_Y} yS={140} color={AMP_COLORS.neg} on={1 - d} dashed />
      <SvgText x={DX + 6} y={34} fontSize={F} fill={AMP_COLORS.pos} fontFamily={fonts.oswaldMedium}>HIGH SIDE</SvgText>
      <SvgText x={DX + 6} y={118} fontSize={F} fill={AMP_COLORS.neg} fontFamily={fonts.oswaldMedium}>LOW SIDE</SvgText>
      {/* the switching node: a real junction, wire out to the filter */}
      <Line x1={DX} y1={NODE_Y} x2={150} y2={NODE_Y} stroke={ink} strokeWidth={1.5} />
      <Circle cx={DX} cy={NODE_Y} r={3} fill={ink} />
      <SvgText x={DX + 6} y={NODE_Y + 13} fontSize={F} fill={colors.textMuted} fontFamily={fonts.barlowMedium}>node</SvgText>
      <Path d={pulse} fill="none" stroke={AMP_COLORS.pos} strokeWidth={1.6} />
      <SvgText x={px0 + pw / 2} y={pyHi - 5} fontSize={F} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>one period</SvgText>
      {/* L: the series inductor */}
      <Path d="M150 75 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0" fill="none" stroke={ink} strokeWidth={1.6} />
      <SvgText x={174} y={62} fontSize={F} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>L</SvgText>
      <Line x1={198} y1={NODE_Y} x2={SPK_X} y2={NODE_Y} stroke={ink} strokeWidth={1.5} />
      <Circle cx={OUT_X} cy={NODE_Y} r={2.6} fill={ink} />
      {/* C: output node → plates → the 0 V return */}
      <Line x1={OUT_X} y1={NODE_Y} x2={OUT_X} y2={98} stroke={ink} strokeWidth={1.5} />
      <Line x1={OUT_X - 10} y1={98} x2={OUT_X + 10} y2={98} stroke={ink} strokeWidth={2} />
      <Line x1={OUT_X - 10} y1={104} x2={OUT_X + 10} y2={104} stroke={ink} strokeWidth={2} />
      <Line x1={OUT_X} y1={104} x2={OUT_X} y2={GND_Y} stroke={ink} strokeWidth={1.5} />
      <SvgText x={OUT_X - 14} y={105} fontSize={F} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.oswaldMedium}>C</SvgText>
      {/* the loudspeaker (the LOAD): output → + terminal; − terminal → 0 V */}
      <Line x1={SPK_X} y1={NODE_Y} x2={SPK_X} y2={88} stroke={ink} strokeWidth={1.5} />
      <SpeakerSymbol x={SPK_X} y={88} color={AMP_COLORS.output} />
      <Line x1={SPK_X} y1={110} x2={SPK_X} y2={GND_Y} stroke={ink} strokeWidth={1.5} />
      <SvgText x={SPK_X + 26} y={96} fontSize={F} fill={AMP_COLORS.output} fontFamily={fonts.oswaldMedium}>LOAD</SvgText>
      <SvgText x={SPK_X + 26} y={109} fontSize={F} fill={colors.textMuted} fontFamily={fonts.barlowMedium}>speaker</SvgText>
      {/* the return: C and the speaker both go back to 0 V, the supply centre */}
      <Line x1={OUT_X} y1={GND_Y} x2={SPK_X} y2={GND_Y} stroke={ink} strokeWidth={1.5} />
      <Circle cx={OUT_X} cy={GND_Y} r={2.2} fill={ink} />
      <GroundSymbol x={(OUT_X + SPK_X) / 2} y={GND_Y} color={ink} />
      <SvgText x={(OUT_X + SPK_X) / 2 + 12} y={GND_Y + 12} fontSize={F} fill={colors.textMuted} fontFamily={fonts.barlowMedium}>0 V</SvgText>
      {/* the duty, in words */}
      <SvgText x={282} y={22} fontSize={F} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>high side on ≈{Math.round(dutyAtPeak * 100)}%</SvgText>
      <SvgText x={282} y={36} fontSize={F} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>of each period at the peak</SvgText>
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

const VIEW_OPTIONS: { key: ViewMode; label: string; short: string; blurb: string }[] = [
  { key: 'raw', label: 'Raw switching', short: 'RAW', blurb: 'The comparator result: two levels only, the audio hidden in the pulse widths.' },
  { key: 'filter', label: 'Filter action', short: 'FILTER', blurb: 'The pulses with the low-pass filter’s output drawn over them — the average the filter keeps.' },
  { key: 'recovered', label: 'Recovered audio', short: 'AUDIO', blurb: 'What is left after the filter: the audio waveform, which is what reaches the loudspeaker.' },
];

export function Mod5ClassD() {
  const [drive, setDrive] = useState(0.7);
  const [view, setView] = useState<ViewMode>('raw');
  const sim = useMemo(() => simulateClassD(drive), [drive]);
  // Natural PWM against a ±1 carrier: the high side is on (1 + audio) / 2 of
  // each period, so the duty swings from (1 − d) / 2 at the trough to
  // (1 + d) / 2 at the peak. Its CYCLE AVERAGE is 50 % at every level (the
  // sine is symmetric — ampModel.test pins it) — so the average is never a
  // readout: it would sit still while LEVEL moved (review 2026-09-30).
  const dutyAtPeak = (1 + Math.min(0.95, drive)) / 2;
  const dutyAtTrough = (1 - Math.min(0.95, drive)) / 2;
  const lossW = 100 - sim.efficiencyPct; // per 100 W in, illustrative

  const outputForView = view === 'raw' ? sim.pwm : view === 'filter' ? sim.pwm : sim.recovered;
  const extra =
    view === 'filter'
      ? [{ data: sim.recovered, color: AMP_COLORS.recovered, width: 2.2, label: 'filter output (recovered audio)' }]
      : undefined;

  const levelParam = faderParam({ id: 'drive', label: 'LEVEL', value: drive, min: 0, max: 0.95, step: 0.01, format: (v) => `${Math.round(v * 100)}%`, onChange: setDrive, level: true });

  const pic: RigPicture = {
    input: sim.audio,
    extraIn: [{ data: sim.carrier, color: AMP_COLORS.supply, dash: '3,2', width: 1, label: 'triangle carrier' }],
    output: outputForView,
    extraOut: extra,
    outputTitle:
      view === 'raw'
        ? 'SWITCHING WAVEFORM (comparator result) — two states only'
        : view === 'filter'
          ? 'SWITCHING WAVEFORM + FILTER OUTPUT'
          : 'RECOVERED AUDIO (after the output filter)',
    supplyFlow: 0.15 + drive * 0.7,
    heat: sim.heat,
    efficiencyPct: sim.efficiencyPct,
    speaker: view === 'recovered',
    a11ySummary: `Class D at ${Math.round(drive * 100)} percent input. The high-side device is on about ${Math.round(dutyAtTrough * 100)} percent of each switching period at the trough and ${Math.round(dutyAtPeak * 100)} percent at the peak; the cycle average stays at ${Math.round(sim.meanDuty * 100)} percent. View: ${view}. Illustrative efficiency ${Math.round(sim.efficiencyPct)} percent.`,
  };

  return (
    <AmpModuleSteps
      steps={[
        {
          key: 'pwm',
          title: 'Modulation',
          kind: 'rack',
          rack: {
            rig: pic,
            bezel: [
              { k: 'AT TROUGH', v: `${Math.round(dutyAtTrough * 100)}%`, tint: AMP_COLORS.neg },
              { k: 'AT PEAK', v: `${Math.round(dutyAtPeak * 100)}%`, tint: AMP_COLORS.pos },
              ...rigStatusBezel(pic, ['eff', 'heat', 'load']),
            ],
            params: [
              levelParam,
              optionsParam<ViewMode>({ id: 'view', label: 'VIEW', value: view, options: VIEW_OPTIONS, onChange: setView }),
            ],
            initialParam: 'drive',
          },
          well: (
            <>
              <Body>
                Class D is not a bigger Class C, and it is not digital. The audio is turned into a fast on/off pattern whose{' '}
                <Text style={{ color: colors.gold }}>average</Text> follows the waveform; a filter keeps the average and
                throws the switching away.
              </Body>

              <SectionTitle>1 · MODULATION (PWM)</SectionTitle>
              <Body>
                The comparator holds the audio against a much faster triangle carrier: audio above carrier → switch high;
                below → switch low. As the audio rises the pulses widen, and as it falls they narrow; louder audio swings the widths further. Pulse-width modulation is the classic example, not the
                only Class D method.
              </Body>
              <Text style={styles.note}>Switching rate reduced for visual demonstration — real carriers run at hundreds of kilohertz. Input panel: audio (cyan) against the carrier (amber dashed).</Text>
              <Card tone="accent">
                <Body>
                  {view === 'raw'
                    ? `Only two levels exist here: +rail and −rail. The audio is hidden in the WIDTHS: the high side is on ≈${Math.round(dutyAtTrough * 100)}% of each period at the trough and ≈${Math.round(dutyAtPeak * 100)}% at the peak. Averaged over a whole audio cycle the duty is ${Math.round(sim.meanDuty * 100)}% at any level — silence is 50% too — so that long average carries no audio; the short-term average, swinging with the widths, is the audio.`
                    : view === 'filter'
                      ? 'The low-pass filter averages the pulses. Where pulses are wide the average is high; where narrow, low. The bright trace is what the loudspeaker gets.'
                      : 'What remains after the filter: the audio waveform, following the input. This — never the raw switching — is what reaches the loudspeaker.'}
                </Body>
              </Card>
              <Card>
                <HonestyBadge label="Signal path — conceptual" />
                <ExpandableFigure aspect={PATH_W / PATH_H} title="CLASS D" badge="Signal path — conceptual" render={(w, h) => <SignalPath width={w} height={h} />} />
              </Card>
            </>
          ),
        },
        {
          key: 'bridge',
          title: 'Switching stage',
          kind: 'rack',
          rack: {
            stage: { aspect: STAGE_W / STAGE_H, render: (w, h) => <SwitchingStage width={w} height={h} dutyAtPeak={dutyAtPeak} /> },
            badge: 'Representative half-bridge — conceptual',
            bezel: [
              { k: 'AT PEAK', v: `${Math.round(dutyAtPeak * 100)}%`, tint: AMP_COLORS.pos },
              { k: 'TO LOAD', v: `${Math.round(sim.efficiencyPct)}%`, tint: colors.green },
              { k: 'AS HEAT', v: `${Math.round(lossW)}%`, tint: '#e6902f' },
            ],
            params: [levelParam],
            initialParam: 'drive',
          },
          well: (
            <>
              <SectionTitle>2 · THE SWITCHING STAGE</SectionTitle>
              <Body>
                The high-side device connects the node to +rail, the low-side to −rail. They must never conduct at the same
                time — that would short the rails through both devices.
              </Body>
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
            </>
          ),
        },
      ]}
    />
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
