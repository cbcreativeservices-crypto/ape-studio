/**
 * Module 2 — Transistors, Tubes, and Transformers (spec Part 2 §3).
 * The active device CONTROLS supply power; the transformer TRANSFORMS it.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { transformer, transformerIdealPowerOk } from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS } from '../../../../features/amp/ampContent';
import {
  AMP_COLORS, Body, Card, ControlSlider, FormulaCard, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow,
} from '../kit';

type Device = 'generic' | 'bjt' | 'mosfet' | 'tube';

const DEVICE_TERMS: Record<Device, { control: string; in: string; out: string; note: string }> = {
  generic: { control: 'CONTROL INPUT', in: 'POWER IN (supply)', out: 'CONTROLLED CURRENT (to load)', note: 'A small control signal regulates a much larger flow of supply current. The device spends the supply’s energy — it does not create it.' },
  bjt: { control: 'BASE', in: 'COLLECTOR', out: 'EMITTER', note: 'Bipolar junction transistor: the base-emitter condition controls collector current. A little base current steers a lot of collector current.' },
  mosfet: { control: 'GATE', in: 'DRAIN', out: 'SOURCE', note: 'MOSFET: gate VOLTAGE controls drain current. Steady-state gate current is tiny — but the gate is a capacitor, so gate charge must be moved every time it switches.' },
  tube: { control: 'CONTROL GRID', in: 'PLATE (high-voltage supply)', out: 'CATHODE', note: 'Vacuum tube: control-grid voltage governs plate current from a high-voltage supply. Same control idea as a transistor, very different circuit requirements.' },
};

function regionFor(control: number): { label: string; sub: string } {
  if (control < 0.15) return { label: 'OFF', sub: 'No conduction — control signal below the point where current starts.' };
  if (control > 0.85) return { label: 'FULLY DRIVEN', sub: 'The device cannot pass more current — more control signal changes nothing.' };
  return { label: 'CONTROLLED CONDUCTION', sub: 'The useful region: output current follows the control signal.' };
}

function DeviceDiagram({ device, control }: { device: Device; control: number }) {
  const t = DEVICE_TERMS[device];
  const i = control < 0.15 ? 0 : Math.min(1, (control - 0.15) / 0.7);
  return (
    <Svg width="100%" height={150} viewBox="0 0 360 150">
      {/* supply → device → load power path */}
      <Rect x={14} y={54} width={70} height={30} rx={5} fill="#1f1a0e" stroke={AMP_COLORS.supply} />
      <SvgText x={49} y={73} fontSize={9.5} fill={AMP_COLORS.supply} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SUPPLY</SvgText>
      <Line x1={84} y1={69} x2={140} y2={69} stroke={AMP_COLORS.supply} strokeWidth={2 + i * 4} strokeOpacity={0.35 + i * 0.65} />
      {/* the device */}
      <Rect x={140} y={34} width={80} height={70} rx={8} fill="#151518" stroke={colors.steelBorder} />
      <SvgText x={180} y={56} fontSize={9.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{device === 'generic' ? 'ACTIVE DEVICE' : device.toUpperCase()}</SvgText>
      <SvgText x={180} y={72} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>{t.in}</SvgText>
      <SvgText x={180} y={88} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>→ {t.out}</SvgText>
      {/* control input */}
      <Line x1={180} y1={10} x2={180} y2={34} stroke={AMP_COLORS.input} strokeWidth={1.6} />
      <Circle cx={180} cy={10} r={4} fill={AMP_COLORS.input} />
      <SvgText x={190} y={14} fontSize={9} fill={AMP_COLORS.input} fontFamily={fonts.oswaldMedium}>{t.control} · {Math.round(control * 100)}%</SvgText>
      {/* controlled current to load */}
      <Line x1={220} y1={69} x2={276} y2={69} stroke={AMP_COLORS.output} strokeWidth={2 + i * 4} strokeOpacity={0.35 + i * 0.65} />
      <Rect x={276} y={54} width={70} height={30} rx={5} fill="#1a2a1e" stroke={AMP_COLORS.output} />
      <SvgText x={311} y={73} fontSize={9.5} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>LOAD</SvgText>
      {/* current meter (relative) */}
      <Rect x={140} y={120} width={206} height={10} rx={5} fill="#0a0a0c" stroke={colors.hairline} />
      <Rect x={141} y={121} width={204 * i} height={8} rx={4} fill={AMP_COLORS.output} />
      <SvgText x={14} y={129} fontSize={8.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>CONTROLLED CURRENT · relative</SvgText>
    </Svg>
  );
}

function TransformerDiagram({ np, ns }: { np: number; ns: number }) {
  const turnsP = Math.max(2, Math.round(np / 100));
  const turnsS = Math.max(2, Math.round(ns / 100));
  // sweep 0 bulges the primary OUT to the left of the core, sweep 1 the
  // secondary out to the right — both windings sit on the core's faces
  // (the primary used to bulge inward and overlap the core block).
  const coil = (x: number, turns: number, color: string, sweep: 0 | 1) =>
    Array.from({ length: turns }, (_, k) => (
      <Path key={`${x}-${k}`} d={`M${x} ${30 + k * (80 / turns)} a10 ${40 / turns} 0 0 ${sweep} 0 ${80 / turns}`} fill="none" stroke={color} strokeWidth={2} />
    ));
  return (
    <Svg width="100%" height={130} viewBox="0 0 360 130">
      <Rect x={150} y={18} width={60} height={104} rx={4} fill="#26262b" stroke={colors.steelBorder} />
      <SvgText x={180} y={72} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>CORE</SvgText>
      {coil(150, turnsP, AMP_COLORS.input, 0)}
      {coil(210, turnsS, AMP_COLORS.output, 1)}
      <SvgText x={110} y={14} fontSize={9.5} fill={AMP_COLORS.input} textAnchor="middle" fontFamily={fonts.oswaldMedium}>PRIMARY · Np {np}</SvgText>
      <SvgText x={250} y={14} fontSize={9.5} fill={AMP_COLORS.output} textAnchor="middle" fontFamily={fonts.oswaldMedium}>SECONDARY · Ns {ns}</SvgText>
      <Path d="M30 70 q10 -20 20 0 t20 0 t20 0 t20 0" fill="none" stroke={AMP_COLORS.input} strokeWidth={1.5} />
      <Path d="M250 70 q10 -20 20 0 t20 0 t20 0 t20 0" fill="none" stroke={AMP_COLORS.output} strokeWidth={1.5} />
      <Path d="M165 60 q15 -30 30 0" fill="none" stroke={AMP_COLORS.supply} strokeDasharray="3,2" />
      <Path d="M165 90 q15 30 30 0" fill="none" stroke={AMP_COLORS.supply} strokeDasharray="3,2" />
      <SvgText x={180} y={127} fontSize={8.5} fill={AMP_COLORS.supply} textAnchor="middle" fontFamily={fonts.barlowMedium}>changing magnetic field</SvgText>
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

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Two very different parts get confused constantly. One <Text style={{ color: AMP_COLORS.output }}>controls</Text> a
        flow of supply energy; the other <Text style={{ color: AMP_COLORS.supply }}>transforms</Text> voltage and current
        relationships without adding a single watt.
      </Body>

      <SectionTitle>THE ACTIVE DEVICE</SectionTitle>
      <SegRow<Device>
        options={[
          { key: 'generic', label: 'Generic' },
          { key: 'bjt', label: 'BJT' },
          { key: 'mosfet', label: 'MOSFET' },
          { key: 'tube', label: 'Tube' },
        ]}
        value={device}
        onChange={setDevice}
      />
      <Card>
        <HonestyBadge label="Conceptual — three-part control model" />
        <DeviceDiagram device={device} control={control} />
        <Text style={styles.region}>{region.label}</Text>
        <Body>{region.sub}</Body>
      </Card>
      <ControlSlider level label="Control signal" value={control} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setControl} />
      <Body>{terms.note}</Body>
      <LearnMore title="BJT VS MOSFET VS TUBE — THE FINE PRINT">
        <Body>
          The beginner regions above — Off, Controlled conduction, Fully driven — are deliberately generic. BJT
          texts say cutoff / active / saturation; MOSFET texts say cutoff / saturation (meaning the CONTROLLED
          region!) / triode. The words collide, so this lab keeps to behavior. Tubes add a high-voltage supply and a
          heated cathode, and usually an output transformer to match the loudspeaker.
        </Body>
      </LearnMore>

      <SectionTitle>THE TRANSFORMER</SectionTitle>
      <Card>
        <HonestyBadge label="Ideal relationships — real transformers have losses" />
        <TransformerDiagram np={np} ns={ns} />
        {xf ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.badge}>
              {xf.kind === 'step-up' ? 'STEP-UP' : xf.kind === 'step-down' ? 'STEP-DOWN' : '1:1 ISOLATION'} · ratio {xf.voltageRatio.toFixed(2)}:1
            </Text>
            <Text style={styles.readout}>Vp {VP} V  →  Vs {xf.vs.toFixed(1)} V</Text>
            <Text style={styles.readout}>Ip {IP.toFixed(2)} A  →  Is {xf.isFromIp(IP).toFixed(2)} A (ideal)</Text>
            <Text style={styles.readout}>
              Pin {(VP * IP).toFixed(0)} W  ·  Pout {(xf.vs * xf.isFromIp(IP)).toFixed(0)} W  {powerOk ? '✓ never exceeds input' : ''}
            </Text>
          </View>
        ) : null}
      </Card>
      <ControlSlider label="Primary turns Np" value={np} min={100} max={1000} step={50} format={(v) => `${v}`} onChange={setNp} />
      <ControlSlider label="Secondary turns Ns" value={ns} min={100} max={1000} step={50} format={(v) => `${v}`} onChange={setNs} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  region: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.5 },
  badge: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
  readout: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  appLine: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
