/**
 * Module 2 — Transistors, Tubes, and Transformers (spec Part 2 §3).
 * The active device CONTROLS supply power; the transformer TRANSFORMS it.
 *
 * RACK (2026-09-30): TWO rack steps, one per live diagram. THE DEVICE pins
 * the control model on the glass (CONTROL on the lane, DEVICE as a tray);
 * THE TRANSFORMER pins the windings (Np / Ns on the lane). Each step's
 * numbers print on the bezel; the formulas, applications and the
 * misconception are the reading in the well.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { transformer, transformerIdealPowerOk } from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS } from '../../../../features/amp/ampContent';
import { levelColor } from '../../../../features/tools/levelColor';
import { faderParam, optionsParam } from '../AmpRack';
import { AmpModuleSteps } from '../steps';
import { BjtSymbol, DcSupplySymbol, MosfetSymbol, SpeakerSymbol, TriodeSymbol } from '../ampSymbols';
import {
  AMP_COLORS, Body, Card, DIAGRAM_FONT, FormulaCard, LearnMore, MisconceptionCard, SectionTitle,
} from '../kit';

/** Drawing units (legibility pass 2026-09-25: labels ≥ DIAGRAM_FONT, the SVG
 *  drawn at the width the glass hands it, height = w / aspect). */
const DEV_W = 360;
/** The device diagram's return wire runs here: under the device box (to
 *  106) and the SUPPLY / LOAD names (to 110), above the current meter. */
const RETURN_Y = 116;
const DEV_H = 150;
const XF_W = 360;
const XF_H = 136;

type Device = 'generic' | 'bjt' | 'mosfet' | 'tube';

const DEVICE_TERMS: Record<Device, { control: string; in: string; out: string; note: string }> = {
  generic: { control: 'CONTROL INPUT', in: 'POWER IN (supply)', out: 'CONTROLLED CURRENT', note: 'A small control signal regulates a much larger flow of supply current to the load. The device spends the supply’s energy — it does not create it.' },
  bjt: { control: 'BASE', in: 'COLLECTOR', out: 'EMITTER', note: 'Bipolar junction transistor: the base-emitter condition controls collector current. A little base current steers a lot of collector current.' },
  mosfet: { control: 'GATE', in: 'DRAIN', out: 'SOURCE', note: 'MOSFET: gate VOLTAGE controls drain current. Steady-state gate current is tiny — but the gate is a capacitor, so gate charge must be moved every time it switches.' },
  tube: { control: 'CONTROL GRID', in: 'PLATE (high-voltage supply)', out: 'CATHODE', note: 'Vacuum tube: control-grid voltage governs plate current from a high-voltage supply. Same control idea as a transistor, very different circuit requirements.' },
};

const DEVICE_LABEL: Record<Device, string> = { generic: 'Generic', bjt: 'BJT', mosfet: 'MOSFET', tube: 'Tube' };

function regionFor(control: number): { label: string; short: string; sub: string } {
  if (control < 0.15) return { label: 'OFF', short: 'OFF', sub: 'No conduction — control signal below the point where current starts.' };
  if (control > 0.85) return { label: 'FULLY DRIVEN', short: 'FULL', sub: 'The device cannot pass more current — more control signal changes nothing.' };
  return { label: 'CONTROLLED CONDUCTION', short: 'CONTROL', sub: 'The useful region: output current follows the control signal.' };
}

/** Controlled current, 0..1 of full, for the control signal. */
const currentFor = (control: number) => (control < 0.15 ? 0 : Math.min(1, (control - 0.15) / 0.7));

export function DeviceDiagram({ device, control, width, height }: { device: Device; control: number; width: number; height: number }) {
  const t = DEVICE_TERMS[device];
  const i = currentFor(control);
  // The device box is wide (160) so its terminal names fit at a legible size.
  const dx = 100, dw = 160, dy = 32, dh = 74;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${DEV_W} ${DEV_H}`}>
      {/* supply → device → load power path (round 3: the real parts, not
          labelled boxes — a DC supply, the device's own symbol, a speaker) */}
      <DcSupplySymbol x={6} cy={69} w={58} color={AMP_COLORS.supply} />
      <SvgText x={35} y={100} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.supply} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SUPPLY</SvgText>
      <Line x1={64} y1={69} x2={dx} y2={69} stroke={AMP_COLORS.supply} strokeWidth={2 + i * 4} strokeOpacity={0.35 + i * 0.65} />
      {/* the device: its schematic symbol (generic = the idea, drawn as a
          control valve on the flow) between its IN and OUT terminals */}
      <Rect x={dx} y={dy} width={dw} height={dh} rx={8} fill="#121216" stroke={colors.steelBorder} strokeOpacity={0.6} />
      <SvgText x={dx + dw / 2} y={dy + 14} fontSize={DIAGRAM_FONT} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{device === 'generic' ? 'ACTIVE DEVICE' : device.toUpperCase()}</SvgText>
      <Line x1={dx} y1={69} x2={dx + dw / 2 - 18} y2={69} stroke={AMP_COLORS.supply} strokeWidth={1.4} strokeOpacity={0.7} />
      <Line x1={dx + dw / 2 + 18} y1={69} x2={dx + dw} y2={69} stroke={AMP_COLORS.output} strokeWidth={1.4} strokeOpacity={0.7} />
      {device === 'bjt' ? (
        <G transform={`rotate(-90 ${dx + dw / 2} 69)`}><BjtSymbol cx={dx + dw / 2} cy={69} r={16} color={colors.textSecondary} /></G>
      ) : device === 'mosfet' ? (
        <G transform={`rotate(-90 ${dx + dw / 2} 69)`}><MosfetSymbol x={dx + dw / 2 + 4} yD={51} yS={87} color={colors.textSecondary} on={0.3 + 0.7 * i} /></G>
      ) : device === 'tube' ? (
        <G transform={`rotate(-90 ${dx + dw / 2} 69)`}><TriodeSymbol cx={dx + dw / 2} cy={69} r={17} color={colors.textSecondary} /></G>
      ) : (
        // generic: a valve on the flow — the control sets how far it opens
        <G>
          <Path d={`M${dx + dw / 2 - 18} 57 L${dx + dw / 2 + 18} 81 V57 L${dx + dw / 2 - 18} 81 Z`} fill="#18181d" stroke={colors.textSecondary} strokeWidth={1.4} strokeLinejoin="round" />
          <Line x1={dx + dw / 2} y1={dy + 20} x2={dx + dw / 2} y2={69} stroke={colors.textSecondary} strokeWidth={1.4} />
        </G>
      )}
      {/* terminal names on two rows (IN left, OUT right) so they never meet */}
      <SvgText x={dx + 6} y={dy + dh - 17} fontSize={DIAGRAM_FONT} fill={colors.textMuted} fontFamily={fonts.barlowMedium}>{`${t.in.split(' (')[0]}`}</SvgText>
      <SvgText x={dx + dw - 6} y={dy + dh - 5} fontSize={DIAGRAM_FONT} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.barlowMedium}>{`→ ${t.out}`}</SvgText>
      {/* control input */}
      <Line x1={180} y1={10} x2={180} y2={dy} stroke={AMP_COLORS.input} strokeWidth={1.6} />
      <Circle cx={180} cy={10} r={4} fill={AMP_COLORS.input} />
      <SvgText x={190} y={14} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.input} fontFamily={fonts.oswaldMedium}>{t.control} · {Math.round(control * 100)}%</SvgText>
      {/* controlled current to the load — a loudspeaker */}
      <Line x1={dx + dw} y1={69} x2={294} y2={69} stroke={AMP_COLORS.output} strokeWidth={2 + i * 4} strokeOpacity={0.35 + i * 0.65} />
      <SpeakerSymbol x={300} y={58} color={AMP_COLORS.output} />
      {/* the load's RETURN to the supply's − terminal (AM-R2-02, wiring round
          2): from the speaker's bottom terminal down under the device and
          back to the supply's left (−) lead, so the current has a closed
          loop — the same current, so the same weight as the forward path */}
      <Path d={`M300 80 V${RETURN_Y} H6 V69`} fill="none" stroke={AMP_COLORS.output} strokeWidth={1.6 + i * 2.4} strokeOpacity={0.3 + i * 0.5} strokeLinejoin="round" />
      <SvgText x={318} y={110} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>LOAD</SvgText>
      {/* current meter (relative) */}
      <SvgText x={4} y={134} fontSize={DIAGRAM_FONT} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>CONTROLLED CURRENT · relative</SvgText>
      <Rect x={156} y={125} width={200} height={12} rx={6} fill="#0a0a0c" stroke={colors.hairline} />
      <Rect x={157} y={126} width={198 * i} height={10} rx={5} fill={AMP_COLORS.output} />
    </Svg>
  );
}

export function TransformerDiagram({ np, ns, width, height }: { np: number; ns: number; width: number; height: number }) {
  const turnsP = Math.max(2, Math.round(np / 100));
  const turnsS = Math.max(2, Math.round(ns / 100));
  const secScale = Math.min(2, Math.max(0.25, ns / Math.max(1, np)));
  // sweep 0 bulges the primary OUT to the left of the core, sweep 1 the
  // secondary out to the right — both windings sit on the core's faces
  // (the primary used to bulge inward and overlap the core block).
  const coil = (x: number, turns: number, color: string, sweep: 0 | 1) =>
    Array.from({ length: turns }, (_, k) => (
      <Path key={`${x}-${k}`} d={`M${x} ${30 + k * (80 / turns)} a10 ${40 / turns} 0 0 ${sweep} 0 ${80 / turns}`} fill="none" stroke={color} strokeWidth={2} />
    ));
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={height} viewBox={`0 0 ${XF_W} ${XF_H}`}>
      {/* The core: a laminated steel FRAME (two limbs joined top and bottom
          round a window) — the windings sit on its limbs, the flux runs
          round the frame (round 3: it was a plain rounded box). */}
      <Path d="M150 18 H210 V122 H150 Z M162 32 V108 H198 V32 Z" fill="#2a2b31" fillRule="evenodd" stroke={colors.steelBorder} strokeWidth={1.2} />
      {Array.from({ length: 25 }, (_, k) => 20 + k * 4.2).map((ly) =>
        ly < 32 || ly > 108 ? (
          <Line key={ly} x1={151} y1={ly} x2={209} y2={ly} stroke="#1a1b20" strokeWidth={0.8} />
        ) : (
          <G key={ly}>
            <Line x1={151} y1={ly} x2={161} y2={ly} stroke="#1a1b20" strokeWidth={0.8} />
            <Line x1={199} y1={ly} x2={209} y2={ly} stroke="#1a1b20" strokeWidth={0.8} />
          </G>
        ),
      )}
      <SvgText x={180} y={74} fontSize={DIAGRAM_FONT} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>CORE</SvgText>
      {coil(150, turnsP, AMP_COLORS.input, 0)}
      {coil(210, turnsS, AMP_COLORS.output, 1)}
      <SvgText x={100} y={14} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.input} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PRIMARY · Np {np}</SvgText>
      <SvgText x={262} y={14} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SECONDARY · Ns {ns}</SvgText>
      <Path d="M30 70 q10 -20 20 0 t20 0 t20 0 t20 0" fill="none" stroke={AMP_COLORS.input} strokeWidth={1.5} />
      {/* Vs = Vp × Ns / Np (AM-R2-03): the secondary wave's height follows
          the turns ratio, clamped to ¼…2× so it stays a wave on the glass */}
      <Path d={`M250 70 q10 ${-20 * secScale} 20 0 t20 0 t20 0 t20 0`} fill="none" stroke={AMP_COLORS.output} strokeWidth={1.5} />
      {/* the flux loop, round the frame through both limbs */}
      <Rect x={156} y={25} width={48} height={90} rx={6} fill="none" stroke={AMP_COLORS.supply} strokeWidth={1.2} strokeDasharray="3,2" />
      <Path d="M180 25 l-5 -3 v6 z" fill={AMP_COLORS.supply} />
      <Path d="M180 115 l5 -3 v6 z" fill={AMP_COLORS.supply} />
      <SvgText x={180} y={133} fontSize={DIAGRAM_FONT} fill={AMP_COLORS.supply} textAnchor="middle" fontFamily={fonts.barlowMedium}>changing magnetic field</SvgText>
    </Svg>
  );
}

export function Mod2Devices() {
  const [device, setDevice] = useState<Device>('generic');
  const [control, setControl] = useState(0.5);
  const [np, setNp] = useState(400);
  const [ns, setNs] = useState(200);
  const VP = 120; // example primary volts
  const IP = 1; // example primary amps

  const xf = useMemo(() => transformer(np, ns, VP, 8), [np, ns]);
  const powerOk = transformerIdealPowerOk(VP, IP, np, ns);
  const region = regionFor(control);
  const terms = DEVICE_TERMS[device];
  const kindWord = xf ? (xf.kind === 'step-up' ? 'STEP-UP' : xf.kind === 'step-down' ? 'STEP-DOWN' : '1:1 ISOLATION') : '—';

  return (
    <AmpModuleSteps
      steps={[
        {
          key: 'device',
          title: 'The device',
          kind: 'rack',
          rack: {
            stage: { aspect: DEV_W / DEV_H, render: (w, h) => <DeviceDiagram width={w} height={h} device={device} control={control} /> },
            badge: 'Conceptual — three-part control model',
            bezel: [
              { k: 'REGION', v: region.short, tint: control < 0.15 ? colors.textSub : control > 0.85 ? colors.gold : colors.green },
              { k: 'CURRENT', v: `${Math.round(currentFor(control) * 100)}%`, tint: levelColor(currentFor(control)) },
              { k: 'DEVICE', v: DEVICE_LABEL[device].toUpperCase(), tint: colors.textSecondary },
            ],
            params: [
              faderParam({ id: 'control', label: 'CONTROL', value: control, min: 0, max: 1, step: 0.01, format: (v) => `${Math.round(v * 100)}%`, onChange: setControl, level: true }),
              optionsParam<Device>({
                id: 'device',
                label: 'DEVICE',
                value: device,
                options: (['generic', 'bjt', 'mosfet', 'tube'] as Device[]).map((d) => ({ key: d, label: DEVICE_LABEL[d], blurb: DEVICE_TERMS[d].note })),
                onChange: setDevice,
              }),
            ],
            initialParam: 'control',
          },
          well: (
            <>
              <Body>
                Two very different parts get confused constantly. One <Text style={{ color: AMP_COLORS.output }}>controls</Text> a
                flow of supply energy; the other <Text style={{ color: AMP_COLORS.supply }}>transforms</Text> voltage and current
                relationships without adding a single watt.
              </Body>

              <SectionTitle>THE ACTIVE DEVICE</SectionTitle>
              <Card>
                <Text style={styles.region}>{region.label}</Text>
                <Body>{region.sub}</Body>
              </Card>
              <Body>{terms.note}</Body>
              <LearnMore title="BJT VS MOSFET VS TUBE — THE FINE PRINT">
                <Body>
                  The beginner regions above — Off, Controlled conduction, Fully driven — are deliberately generic. BJT
                  texts say cutoff / active / saturation; MOSFET texts say cutoff / saturation (meaning the CONTROLLED
                  region!) / triode. The words collide, so this lab keeps to behavior. Tubes add a high-voltage supply and a
                  heated cathode, and usually an output transformer to match the loudspeaker.
                </Body>
              </LearnMore>
            </>
          ),
        },
        {
          key: 'xfmr',
          title: 'The transformer',
          kind: 'rack',
          rack: {
            stage: { aspect: XF_W / XF_H, render: (w, h) => <TransformerDiagram width={w} height={h} np={np} ns={ns} /> },
            badge: 'Ideal relationships — real transformers have losses',
            bezel: xf
              ? [
                  { k: 'KIND', v: kindWord, tint: colors.gold },
                  { k: 'RATIO', v: `${xf.voltageRatio.toFixed(2)}:1` },
                  { k: 'Vs', v: `${xf.vs.toFixed(1)} V`, tint: AMP_COLORS.output },
                  { k: 'Is', v: `${xf.isFromIp(IP).toFixed(2)} A`, tint: AMP_COLORS.output },
                ]
              : [],
            params: [
              faderParam({ id: 'np', label: 'Np', value: np, min: 100, max: 1000, step: 50, format: (v) => `${v} turns`, formatShort: (v) => `${v}`, onChange: setNp, tint: AMP_COLORS.input }),
              faderParam({ id: 'ns', label: 'Ns', value: ns, min: 100, max: 1000, step: 50, format: (v) => `${v} turns`, formatShort: (v) => `${v}`, onChange: setNs, tint: AMP_COLORS.output }),
            ],
            initialParam: 'ns',
          },
          well: (
            <>
              <SectionTitle>THE TRANSFORMER</SectionTitle>
              {xf ? (
                <Card>
                  <View style={{ gap: 4 }}>
                    <Text style={styles.badge}>
                      {kindWord} · ratio {xf.voltageRatio.toFixed(2)}:1
                    </Text>
                    <Text style={styles.readout}>Vp {VP} V  →  Vs {xf.vs.toFixed(1)} V</Text>
                    <Text style={styles.readout}>Ip {IP.toFixed(2)} A  →  Is {xf.isFromIp(IP).toFixed(2)} A (ideal)</Text>
                    <Text style={styles.readout}>
                      Pin {(VP * IP).toFixed(0)} W  ·  Pout {(xf.vs * xf.isFromIp(IP)).toFixed(0)} W  {powerOk ? '✓ never exceeds input' : ''}
                    </Text>
                  </View>
                </Card>
              ) : null}
              <FormulaCard
                title="Ideal transformer"
                lines={['Vp / Vs = Np / Ns', 'Ip × Vp = Is × Vs   (ideal — no net power gain)']}
                note="Step the voltage up and the available current steps down by the same ratio. Losses in real cores and windings only make the output smaller."
              />
              <LearnMore title="IMPEDANCE TRANSFORMATION">
                <FormulaCard
                  title="Reflected impedance"
                  lines={['Zp / Zs = (Np / Ns)²', xf ? `8 Ω on the secondary looks like ${xf.zReflected?.toFixed(0)} Ω to the primary` : '']}
                  note="Because voltage scales by the ratio and current by its inverse, impedance scales by the ratio SQUARED. This is how a tube output transformer lets a high-voltage, low-current stage drive an 8 Ω loudspeaker."
                />
              </LearnMore>

              <SectionTitle>WHERE TRANSFORMERS EARN THEIR KEEP</SectionTitle>
              <Card>
                {[
                  ['Traditional power supply', 'mains down to the rail voltage the amplifier needs, with isolation'],
                  ['Switch-mode supply', 'a small high-frequency transformer — same physics, far less iron'],
                  ['Tube-amplifier output', 'matches the tube stage’s high impedance to the loudspeaker'],
                  ['70 V / 100 V distributed audio', 'high-voltage line for long runs; each speaker taps down its share'],
                  ['Audio isolation', 'breaks ground loops and blocks DC between equipment'],
                ].map(([t, d]) => (
                  <Text key={t} style={styles.appLine}>
                    <Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium }}>{t}</Text> — {d}
                  </Text>
                ))}
              </Card>

              <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'transformer-power')!} />
            </>
          ),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  region: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.5 },
  badge: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
  readout: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  appLine: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
