/**
 * Module 6 — Power Supplies, Limits, and Clipping (spec Part 2 §7): linear
 * vs switch-mode supply views, then the rail-limit rig where voltage
 * clipping, current limiting and supply sag are computed separately and
 * drawn distinctly.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  sineCycle, amplify, isClipping, sineVrms, ohmsCurrent, resistivePower, cycleRms, type FaultId,
} from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS, SAFETY_POINTS } from '../../../../features/amp/ampContent';
import { AmpRig } from '../AmpRig';
import { AMP_COLORS, Body, Card, ControlSlider, FaultBanner, FormulaCard, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow } from '../kit';

const V_FULL = 40; // V peak at 100% rail — a teaching example
const I_LIMIT = 9; // A rms — output-stage current limit (example)
const I_PROTECT = 13; // A rms — overcurrent protection (example)

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
          <Svg key={b}>
            <Rect x={x} y={10} width={bw} height={30} rx={5} fill={last ? '#1f1a0e' : '#151518'} stroke={last ? AMP_COLORS.supply : colors.steelBorder} />
            <SvgText x={x + bw / 2} y={29} fontSize={n > 5 ? 7.5 : 8.5} fill={last ? AMP_COLORS.supply : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b}</SvgText>
            {!last ? <Line x1={x + bw + 1} y1={25} x2={x + bw + gap - 1} y2={25} stroke={AMP_COLORS.supply} strokeWidth={1.5} /> : null}
          </Svg>
        );
      })}
    </Svg>
  );
}

export function Mod6Supply() {
  const [supply, setSupply] = useState<'linear' | 'smps'>('linear');
  const [drive, setDrive] = useState(0.5);
  const [rail, setRail] = useState(1);
  const [loadZ, setLoadZ] = useState<8 | 4 | 2>(8);

  const sim = useMemo(() => {
    const requestedPeak = drive * V_FULL * 1.25; // the amplifier would like to swing this
    // Supply sag: an unregulated linear supply droops with sustained current;
    // a regulated switch-mode supply holds up better. Sag is computed
    // separately from clipping (spec Part 3 §2).
    const railNominal = rail * V_FULL;
    const irmsIfUnclipped = ohmsCurrent(sineVrms(Math.min(requestedPeak, railNominal))!, loadZ)!;
    const sagPerAmp = supply === 'linear' ? 0.9 : 0.25;
    const sagV = Math.min(railNominal * 0.35, sagPerAmp * irmsIfUnclipped);
    const railEff = railNominal - sagV;
    // Current limit: the output stage caps rms current, which caps the peak
    // voltage it can put across THIS load — a ceiling that sits BELOW the rail.
    const iLimitPeakV = I_LIMIT * Math.SQRT2 * loadZ;
    const vLimit = Math.min(railEff, iLimitPeakV);
    const currentLimited = iLimitPeakV < railEff && requestedPeak > iLimitPeakV;
    const voltageClipped = !currentLimited && requestedPeak > railEff;
    const x = sineCycle(requestedPeak / V_FULL);
    const out = amplify(x, 1, vLimit / V_FULL);
    const vPeakOut = Math.min(requestedPeak, vLimit);
    const vrms = sineVrms(vPeakOut)!;
    const irms = ohmsCurrent(vrms, loadZ)!;
    const p = resistivePower(vrms, loadZ)!;
    const faults: FaultId[] = [];
    if (irms >= I_PROTECT) faults.push('overcurrent');
    if (voltageClipped) faults.push('output-clipping');
    return {
      input: sineCycle(drive),
      out, railEff, railNominal, sagV, vLimit, currentLimited, voltageClipped, vrms, irms, p,
      clipAtNorm: railEff / V_FULL,
      iLimitNorm: iLimitPeakV / V_FULL,
      primary: faults[0] ?? null,
      heat: Math.min(1, 0.1 + (irms / I_PROTECT) * 0.7 + (voltageClipped ? 0.1 : 0)),
      supplyFlow: Math.min(1, irms / I_PROTECT),
    };
  }, [drive, rail, loadZ, supply]);

  const state = sim.irms >= I_PROTECT ? 'PROTECT — OVERCURRENT' : sim.currentLimited ? 'CURRENT LIMITING' : sim.voltageClipped ? 'VOLTAGE CLIPPING (rails)' : 'CLEAN';
  const stateColor = state === 'CLEAN' ? colors.green : state === 'CURRENT LIMITING' ? colors.gold : colors.red;

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
      <ControlSlider label="Input level" value={drive} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setDrive} />
      <ControlSlider label="Available rail voltage" value={rail} min={0.3} max={1} step={0.01} format={(v) => `±${Math.round(v * V_FULL)} V`} onChange={setRail} />
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
        extraOut={
          sim.currentLimited
            ? [{ data: new Float32Array(sim.out.length).fill(sim.iLimitNorm), color: colors.gold, dash: '2,3', width: 1, label: 'current-limit ceiling (below the rails)' }]
            : undefined
        }
        supplyFlow={sim.supplyFlow}
        heat={sim.heat}
        speaker
        faulted={sim.primary != null}
        a11ySummary={`Rails ±${Math.round(sim.railNominal)} volts nominal, sagging to ±${Math.round(sim.railEff)} under load. State: ${state}. Output ${sim.vrms.toFixed(1)} volts rms, ${sim.irms.toFixed(1)} amps rms into ${loadZ} ohms, ${sim.p.toFixed(0)} watts.`}
      />
      <Card tone="accent">
        <Text style={[styles.state, { color: stateColor }]}>{state}</Text>
        <View style={styles.readoutRow}>
          <Readout label="RAILS" value={`±${sim.railNominal.toFixed(0)} V`} sub={sim.sagV > 0.5 ? `sag −${sim.sagV.toFixed(1)} V` : 'no sag'} />
          <Readout label="OUTPUT" value={`${sim.vrms.toFixed(1)} Vrms`} />
          <Readout label="CURRENT" value={`${sim.irms.toFixed(1)} A`} warn={sim.irms >= I_LIMIT} />
          <Readout label="POWER" value={`${sim.p.toFixed(0)} W`} sub="resistive example" />
        </View>
        <Body>
          {state === 'CLEAN'
            ? 'The requested swing fits inside the rails and the current stays within the output stage’s comfort. Lower the load or raise the drive and watch which limit arrives first.'
            : state.startsWith('VOLTAGE')
              ? `The output wants to swing further than ±${sim.railEff.toFixed(0)} V. The peaks flatten exactly at the rail — that flat top IS the supply.${sim.sagV > 1 ? ' Notice the rails sagged under load, so clipping began earlier than the nominal rail suggests.' : ''}`
              : state === 'CURRENT LIMITING'
                ? `Into ${loadZ} Ω the output stage hits its ${I_LIMIT} A current limit BEFORE the voltage reaches the rails. The peaks flatten below the rail line — a different limit with a different cause. Voltage was available; current was not.`
                : `Current demand reached ${sim.irms.toFixed(1)} A — past the ${I_PROTECT} A protection threshold. A real amplifier mutes or shuts down here. This is what a too-low load does at high level.`}
        </Body>
      </Card>
      <FaultBanner primary={sim.primary} />

      <FormulaCard
        title="What the rails and load decide"
        lines={['Vrms = Vpeak / √2', 'I = V / R', 'P = Vrms² / R']}
        note={`Labeled resistive example. Lower impedance → more current for the same voltage: ${loadZ} Ω at ${sim.vrms.toFixed(1)} Vrms draws ${sim.irms.toFixed(1)} A. A real loudspeaker’s impedance varies with frequency, so its current demand does too.`}
      />

      <LearnMore title="WHY THREE DIFFERENT LIMITS LOOK DIFFERENT">
        <Body>
          Voltage clipping flattens peaks at the rail line and gets worse as the rails sag. Current limiting flattens
          peaks BELOW the rails — the supply had voltage to give, the output stage would not pass the current. Thermal
          limiting (Module 7) reduces level over time rather than reshaping the wave. Reading which one you are seeing
          tells you what to fix.
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

function Readout({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <View style={{ minWidth: 70, flex: 1 }}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text style={[styles.rValue, warn && { color: colors.red }]}>{value}</Text>
      {sub ? <Text style={styles.rSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5 },
  readoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2 },
  rValue: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17 },
  rSub: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 10 },
  safetyTitle: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5 },
  safetyLine: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  safetyNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5 },
});
