/**
 * Module 6 — Power Supplies, Limits, and Clipping (spec Part 2 §7): linear
 * vs switch-mode supply views, then the rail-limit rig where voltage
 * clipping, current limiting, supply sag and overcurrent protection are
 * computed separately (ampModel.simulateRailLimits — unit-tested) and drawn
 * distinctly.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { simulateRailLimits, RAIL_V_FULL, RAIL_I_LIMIT, RAIL_I_PROTECT } from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS, SAFETY_POINTS } from '../../../../features/amp/ampContent';
import { AmpRig } from '../AmpRig';
import { AMP_COLORS, Body, Card, ControlSlider, FaultBanner, FormulaCard, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow } from '../kit';

function ChainDiagram({ kind }: { kind: 'linear' | 'smps' }) {
  const boxes =
    kind === 'linear'
      ? ['AC IN', 'TRANSFORMER', 'RECTIFIER', 'RESERVOIR', 'DC RAILS']
      : ['AC IN', 'INPUT CONV.', 'HF SWITCH', 'HF XFMR', 'RECT./REG.', 'DC RAILS'];
  const n = boxes.length;
  const gap = 6;
  const bw = (360 - 6 - gap * (n - 1)) / n;
  return (
    <Svg width="100%" height={52} viewBox="0 0 360 52">
      {boxes.map((b, i) => {
        const x = 3 + i * (bw + gap);
        const last = i === n - 1;
        return (
          <G key={b}>
            <Rect x={x} y={10} width={bw} height={30} rx={5} fill={last ? '#1f1a0e' : '#151518'} stroke={last ? AMP_COLORS.supply : colors.steelBorder} />
            <SvgText x={x + bw / 2} y={29} fontSize={8.5} fill={last ? AMP_COLORS.supply : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b}</SvgText>
            {!last ? <Line x1={x + bw + 1} y1={25} x2={x + bw + gap - 1} y2={25} stroke={AMP_COLORS.supply} strokeWidth={1.5} /> : null}
          </G>
        );
      })}
    </Svg>
  );
}

const STATE_LABEL = {
  clean: 'CLEAN',
  'current-limit': 'CURRENT LIMITING',
  'voltage-clip': 'VOLTAGE CLIPPING (rails)',
  protect: 'PROTECT — OVERCURRENT (output muted)',
} as const;

export function Mod6Supply() {
  const [supply, setSupply] = useState<'linear' | 'smps'>('linear');
  const [drive, setDrive] = useState(0.5);
  const [rail, setRail] = useState(1);
  const [loadZ, setLoadZ] = useState<8 | 4 | 2>(8);

  const sim = useMemo(() => simulateRailLimits(drive, rail, loadZ, supply), [drive, rail, loadZ, supply]);
  const state = STATE_LABEL[sim.state];
  const stateColor = sim.state === 'clean' ? colors.green : sim.state === 'current-limit' ? colors.gold : colors.red;
  const sagged = sim.sagV > 0.5;
  const ceiling = useMemo(() => new Float32Array(sim.out.length).fill(sim.iLimitNorm), [sim.out.length, sim.iLimitNorm]);

  return (
    <View style={{ gap: 12 }}>
      <Body>
        An amplifier’s output can never exceed what its supply rails hold — and the rails are not a constant. Sustained
        current sags them, the output stage caps current, and protection steps in past that. Each limit looks different.
      </Body>

      <SectionTitle>TWO WAYS TO MAKE RAILS</SectionTitle>
      <SegRow<'linear' | 'smps'>
        options={[
          { key: 'linear', label: 'Linear supply' },
          { key: 'smps', label: 'Switch-mode supply' },
        ]}
        value={supply}
        onChange={setSupply}
      />
      <Card>
        <HonestyBadge label="Conceptual chain" />
        <ChainDiagram kind={supply} />
        <Body>
          {supply === 'linear'
            ? 'Mains → transformer steps it to the rail voltage → rectifier → reservoir capacitors smooth it into DC rails. Heavy, simple, and the reservoir droops under sustained load — the sag you will see below.'
            : 'Mains is rectified first, chopped at high frequency, passed through a small transformer where one is used, then rectified and regulated. Lighter, and regulation holds the rails up better under load. Neither type is automatically superior — each has a place.'}
        </Body>
      </Card>

      <SectionTitle>THE RAILS SET THE LIMIT</SectionTitle>
      <Body>Try it in this order: raise the input at 8 Ω until the peaks flatten; switch to 2 Ω and find the limit that arrives first; then push on until protection mutes the output.</Body>
      <ControlSlider label="Input level" value={drive} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setDrive} />
      <ControlSlider label="Available rail voltage" value={rail} min={0.3} max={1} step={0.01} format={(v) => `±${Math.round(v * RAIL_V_FULL)} V`} onChange={setRail} />
      <SegRow<8 | 4 | 2>
        label="Modeled load (resistive teaching example)"
        options={[
          { key: 8, label: '8 Ω' },
          { key: 4, label: '4 Ω' },
          { key: 2, label: '2 Ω' },
        ]}
        value={loadZ}
        onChange={setLoadZ}
      />
      <AmpRig
        input={sim.input}
        output={sim.out}
        clipAt={sim.clipAtNorm}
        nominalRailAt={sagged ? sim.nominalNorm : undefined}
        extraOut={
          sim.state === 'current-limit'
            ? [{ data: ceiling, color: colors.gold, dash: '2,3', width: 1, label: 'current-limit ceiling (below the rails)' }]
            : undefined
        }
        supplyFlow={sim.supplyFlow}
        heat={sim.heat}
        speaker
        faulted={sim.primary != null}
        a11ySummary={`Rails ±${Math.round(sim.railNominal)} volts nominal${sagged ? `, sagging to ±${Math.round(sim.railEff)} under load` : ''}. State: ${state}. ${sim.state === 'protect' ? `Output muted; the load demanded ${sim.iDemand.toFixed(1)} amps rms into ${loadZ} ohms.` : `Output ${sim.vrms.toFixed(1)} volts rms, ${sim.irms.toFixed(1)} amps rms into ${loadZ} ohms, ${sim.p.toFixed(0)} watts.`}`}
      />
      <Card tone="accent">
        <Text style={[styles.state, { color: stateColor }]}>{state}</Text>
        <View style={styles.readoutRow}>
          <Readout label="RAILS" value={`±${sim.railNominal.toFixed(0)} V`} sub={sagged ? `sag −${sim.sagV.toFixed(1)} V → ±${sim.railEff.toFixed(0)} V` : 'no sag'} />
          <Readout label="OUTPUT" value={`${sim.vrms.toFixed(1)} Vrms`} sub={sim.state === 'protect' ? 'muted' : undefined} />
          <Readout
            label="CURRENT"
            value={`${sim.irms.toFixed(1)} A`}
            sub={sim.state === 'protect' ? `demand ${sim.iDemand.toFixed(1)} A` : sim.state === 'current-limit' ? `limit ${RAIL_I_LIMIT} A` : undefined}
            tone={sim.state === 'protect' ? 'fault' : sim.irms >= RAIL_I_LIMIT - 1e-6 ? 'warn' : undefined}
          />
          <Readout label="POWER" value={`${sim.p.toFixed(0)} W`} sub="resistive example" />
        </View>
        <Body>
          {sim.state === 'clean'
            ? 'The requested swing fits inside the rails and the current stays within the output stage’s comfort. Lower the load or raise the drive and watch which limit arrives first.'
            : sim.state === 'voltage-clip'
              ? `The output wants to swing further than ±${sim.railEff.toFixed(0)} V. The peaks flatten exactly at the rail — that flat top IS the supply.${sagged ? ' The faint outer lines are the idle rails: they sagged under load, so clipping began earlier than the nominal figure suggests.' : ''}`
              : sim.state === 'current-limit'
                ? `Into ${loadZ} Ω the output stage hits its ${RAIL_I_LIMIT} A current limit BEFORE the voltage reaches the rails. The peaks flatten below the rail line — a different limit with a different cause. Voltage was available; current was not.`
                : `The load asked for ${sim.iDemand.toFixed(1)} A — past the ${RAIL_I_PROTECT} A protection threshold — so the amplifier muted its output: a flat line with the input still present. This is what a too-low load does at high level. Reduce the level or raise the load impedance, then let protection reset.`}
        </Body>
      </Card>
      <FaultBanner primary={sim.primary} />

      <FormulaCard
        title="What the rails and load decide"
        lines={['Vrms = Vpeak / √2', 'I = V / R', 'P = Vrms² / R']}
        note={`Labeled resistive example. Lower impedance → more current for the same voltage: ${loadZ} Ω at ${sim.vrms.toFixed(1)} Vrms draws ${sim.irms.toFixed(1)} A. A real loudspeaker’s impedance varies with frequency, so its current demand does too.`}
      />

      <LearnMore title="WHY THE LIMITS LOOK DIFFERENT">
        <Body>
          Voltage clipping flattens peaks at the rail line and gets worse as the rails sag. Current limiting flattens
          peaks BELOW the rails — the supply had voltage to give, the output stage would not pass the current.
          Overcurrent protection does not reshape the wave at all: it opens the output. Thermal limiting (Module 7)
          reduces level over time. Reading which one you are seeing tells you what to fix.
        </Body>
      </LearnMore>

      <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'clip-harmless')!} />

      <Card>
        <Text style={styles.safetyTitle}>⚠ BEFORE THE REAL-WORLD MODULE</Text>
        {SAFETY_POINTS.slice(0, 4).map((s) => (
          <Text key={s} style={styles.safetyLine}>• {s}</Text>
        ))}
        <Text style={styles.safetyNote}>The full safety list opens Module 7.</Text>
      </Card>
    </View>
  );
}

function Readout({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' | 'fault' }) {
  return (
    <View style={{ minWidth: 70, flex: 1 }}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text style={[styles.rValue, tone === 'warn' && { color: colors.gold }, tone === 'fault' && { color: colors.red }]}>{value}</Text>
      {sub ? <Text style={styles.rSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5 },
  readoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  rValue: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17 },
  rSub: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 10.5 },
  safetyTitle: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5 },
  safetyLine: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  safetyNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
