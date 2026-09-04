/**
 * Module 4 — Amplifier Class Explorer (spec Part 2 §5): A, B, AB and C on the
 * same input, load and layout. No "best" — trade-offs, labeled honestly.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import {
  simulateLinearClass, simulateClassC, sineCycle, type AmpClass,
} from '../../../../features/amp/ampModel';
import { MISCONCEPTIONS } from '../../../../features/amp/ampContent';
import { AmpRig } from '../AmpRig';
import { AMP_COLORS, Body, Card, ControlSlider, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow } from '../kit';
import { CrossoverZoom } from './mod3Bias';

type Explorable = 'A' | 'B' | 'AB' | 'C';

type ClassFacts = {
  principle: string;
  conduction: string;
  idle: string;
  efficiency: string; // labeled theoretical where numeric
  heat: string;
  limitation: string;
  use: string;
  audio: string;
};

export const CLASS_FACTS: Record<AmpClass, ClassFacts> = {
  A: {
    principle: 'One device (or a pair) conducts the whole waveform from a fixed operating point.',
    conduction: '360°',
    idle: 'High — substantial current flows with no signal',
    efficiency: 'Theoretical max 25% (series-fed) / 50% (transformer-coupled); far lower in practice',
    heat: 'High, and present at idle',
    limitation: 'Efficiency and heat',
    use: 'Small-signal stages, some studio and hi-fi power stages, educational circuits',
    audio: 'Yes',
  },
  B: {
    principle: 'Two devices in push-pull, each handling one half of the waveform.',
    conduction: '≈180° per device',
    idle: 'Very low',
    efficiency: 'Theoretical max ≈78.5% at full output',
    heat: 'Low at idle, rises with output',
    limitation: 'Crossover distortion at the handoff',
    use: 'Where efficiency matters more than low-level linearity; the starting point for AB',
    audio: 'Marginal without bias',
  },
  AB: {
    principle: 'Push-pull with just enough bias that both devices conduct around zero crossing.',
    conduction: '>180° but <360° per device',
    idle: 'Low to moderate — set by the bias',
    efficiency: 'Approaches Class B’s ~78.5% at full output; markedly lower in practice and far less at low levels',
    heat: 'Moderate; rises with output and bias',
    limitation: 'Bias must be set and kept stable over temperature',
    use: 'The workhorse of analog audio power amplification',
    audio: 'Yes — the most common linear choice',
  },
  C: {
    principle: 'Device conducts in short pulses; a tuned resonant circuit rings between them.',
    conduction: '<180°',
    idle: 'Zero',
    efficiency: 'High in tuned service (often quoted above 80%) — not applicable to broadband audio',
    heat: 'Low',
    limitation: 'Recovers ONE tuned frequency only',
    use: 'RF transmitters and tuned amplifiers',
    audio: 'No',
  },
  D: {
    principle: 'Audio encoded into a high-frequency switching pattern, then filtered back out at the load.',
    conduction: 'Switching — not described by conduction angle',
    idle: 'Low (switching losses continue at idle)',
    efficiency: 'Ideal switch theoretically lossless; practical designs roughly 85–95% at high output, lower at low output',
    heat: 'Low to moderate — never zero',
    limitation: 'Output filter, switching artifacts, EMI, implementation quality',
    use: 'Portable, touring subwoofers, installation, most modern power amplifiers',
    audio: 'Yes',
  },
};

const FACT_ROWS: { key: keyof ClassFacts; label: string }[] = [
  { key: 'principle', label: 'Operating principle' },
  { key: 'conduction', label: 'Conduction' },
  { key: 'idle', label: 'Idle power' },
  { key: 'efficiency', label: 'Efficiency tendency' },
  { key: 'heat', label: 'Heat tendency' },
  { key: 'limitation', label: 'Main limitation' },
  { key: 'use', label: 'Typical use' },
  { key: 'audio', label: 'Ordinary-audio suitability' },
];

/** The three rows that carry the comparison; the other five open on tap. */
const HEADLINE_ROWS = new Set<keyof ClassFacts>(['conduction', 'idle', 'efficiency']);

/**
 * Progressive disclosure: five classes × eight rows was a 40-row wall. With
 * `onToggle` the card shows its three headline rows and opens on tap; without
 * it (no toggle handler) it is always fully expanded.
 */
export function ClassFactsCard({ cls, expanded = true, onToggle }: { cls: AmpClass; expanded?: boolean; onToggle?: () => void }) {
  const f = CLASS_FACTS[cls];
  const rows = onToggle && !expanded ? FACT_ROWS.filter((r) => HEADLINE_ROWS.has(r.key)) : FACT_ROWS;
  const body = (
    <>
      <View style={styles.classHead}>
        <Text style={styles.classTitle}>CLASS {cls}</Text>
        {onToggle ? <Text style={styles.classMore}>{expanded ? '▾ all eight' : '▸ all eight'}</Text> : null}
      </View>
      {rows.map((r) => (
        <View key={r.key} style={styles.factRow}>
          <Text style={styles.factLabel}>{r.label}</Text>
          <Text style={styles.factValue}>{f[r.key]}</Text>
        </View>
      ))}
    </>
  );
  if (!onToggle) return <Card>{body}</Card>;
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Class ${cls} facts, ${expanded ? 'expanded' : 'collapsed'}`}
      style={styles.factsPressable}
    >
      {body}
    </Pressable>
  );
}

export function Mod4Classes() {
  const [cls, setCls] = useState<Explorable>('A');
  const [drive, setDrive] = useState(0.8);
  const [signalOn, setSignalOn] = useState(true);
  const [abBias, setAbBias] = useState(0);
  const [detune, setDetune] = useState(1);
  // null = follow the explored class; 'none' = learner collapsed it.
  const [openFacts, setOpenFacts] = useState<AmpClass | 'none' | null>(null);
  useEffect(() => setOpenFacts(null), [cls]);
  const openCard: AmpClass | 'none' = openFacts ?? cls;

  // The signal-off demonstration belongs to Class A only — it must not leak
  // into the other classes when the learner switches (caught in visual QA).
  const effDrive = cls === 'A' && !signalOn ? 0 : drive;
  const lin = useMemo(
    () => (cls === 'C' ? null : simulateLinearClass(cls, effDrive, cls === 'AB' ? abBias : 0)),
    [cls, effDrive, abBias],
  );
  const c = useMemo(() => (cls === 'C' ? simulateClassC(effDrive, detune) : null), [cls, effDrive, detune]);
  const input = useMemo(() => sineCycle(effDrive), [effDrive]);

  const sim = lin ?? c!;
  const facts = CLASS_FACTS[cls];

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Same input, same load, same layout. Switch classes and watch only the things that actually change:
        which device conducts when, what happens at zero crossing, what it costs at idle, and where the heat goes.
      </Body>

      <SegRow<Explorable>
        options={[
          { key: 'A', label: 'Class A' },
          { key: 'B', label: 'Class B' },
          { key: 'AB', label: 'Class AB' },
          { key: 'C', label: 'Class C' },
        ]}
        value={cls}
        onChange={setCls}
      />
      <ControlSlider label="Input level" value={drive} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setDrive} />

      {cls === 'A' ? (
        <SegRow<'on' | 'off'>
          label="Audio signal (amplifier stays powered)"
          options={[
            { key: 'on', label: 'Signal on' },
            { key: 'off', label: 'Signal off' },
          ]}
          value={signalOn ? 'on' : 'off'}
          onChange={(v) => setSignalOn(v === 'on')}
        />
      ) : null}
      {cls === 'AB' ? (
        <ControlSlider label="Output-stage bias — 0% is the Class B condition" value={abBias} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setAbBias} />
      ) : null}
      {cls === 'C' ? (
        <ControlSlider
          label="Tuned circuit frequency ÷ signal frequency"
          value={detune}
          min={0.5}
          max={2}
          step={0.01}
          format={(v) => `${v.toFixed(2)}× ${Math.abs(v - 1) < 0.03 ? '· TUNED' : '· mistuned'}`}
          onChange={setDetune}
        />
      ) : null}

      <AmpRig
        input={input}
        devices={{ iPos: sim.iPos, iNeg: sim.iNeg }}
        output={sim.out}
        extraOut={c ? [{ data: c.recovered, color: AMP_COLORS.recovered, dash: '4,3', width: 1.8, label: 'after the tuned circuit (recovered)' }] : undefined}
        outputTitle={c ? 'RAW DEVICE OUTPUT (pulses) · dashed = after the tuned circuit' : undefined}
        supplyFlow={Math.min(1, (sim.idleCurrent + (lin ? effDrive : effDrive * (c?.resonanceGain ?? 1))) * 0.8)}
        heat={sim.heat}
        efficiencyPct={sim.efficiencyPct}
        speaker={cls !== 'C'}
        a11ySummary={
          cls === 'C'
            ? c!.conductionDeg === 0
              ? 'Class C: input is below the conduction threshold — the device never turns on, there are no pulses, and the tuned circuit produces nothing.'
              : `Class C: device conducts ${Math.round(c!.conductionDeg)} degrees in pulses. Tuned circuit ${Math.abs(detune - 1) < 0.03 ? 'is tuned — a sine is recovered' : `is mistuned to ${detune.toFixed(2)} times the signal — recovered output falls to ${Math.round((c!.resonanceGain) * 100)} percent`}.`
            : `Class ${cls}: each conducting device passes current for about ${Math.round(sim.conductionDeg)} degrees. ${lin!.crossoverNotch ? 'A crossover notch is present at zero crossing.' : 'Output is clean.'} Relative idle current ${Math.round(sim.idleCurrent * 100)} percent, relative heat ${Math.round(sim.heat * 100)} percent, illustrative efficiency ${Math.round(sim.efficiencyPct)} percent.`
        }
      />

      {/* per-class live readout */}
      <Card tone="accent">
        <View style={styles.statRow}>
          <Stat label="CONDUCTION" value={`${Math.round(sim.conductionDeg)}°`} />
          <Stat label="IDLE CURRENT" value={`${Math.round(sim.idleCurrent * 100)}%`} sub="relative" />
          <Stat label="EFFICIENCY" value={`${Math.round(sim.efficiencyPct)}%`} sub="illustrative, at this level" />
          <Stat label="DISTORTION" value={lin?.crossoverNotch ? 'NOTCH' : cls === 'C' && c?.conductionDeg === 0 ? 'NO OUTPUT' : cls === 'C' && (c?.resonanceGain ?? 1) < 0.9 ? 'MISTUNED' : 'CLEAN'} warn={!!lin?.crossoverNotch || (cls === 'C' && ((c?.resonanceGain ?? 1) < 0.9 || c?.conductionDeg === 0))} />
        </View>
        <Body>
          {cls === 'A' && !signalOn
            ? 'Signal off, amplifier on: the device still sits at its operating point, so idle current — and heat — carry on exactly as before. That standing dissipation is the price of full-cycle conduction.'
            : cls === 'A'
              ? 'Full-cycle conduction: no handoff, so no crossover notch is inherent to the concept. The device is always partly on, which is why efficiency stays low and heat stays high.'
              : cls === 'B'
                ? 'Each device conducts about half the cycle and hands off at zero. Idle current is near zero and efficiency is much better — but look at the handoff below.'
                : cls === 'AB'
                  ? abBias < 0.05
                    ? 'At 0% bias this IS Class B: the notch is there. Raise the bias and watch both devices start conducting past zero.'
                    : lin?.crossoverNotch
                      ? 'The overlap is growing but has not yet closed the gap — keep going.'
                      : 'Both devices now conduct around zero crossing (more than 180° each). The notch is gone; idle current and heat rose to pay for it.'
                  : c?.conductionDeg === 0
                    ? // NEW COPY — the model no longer conjures a recovered sine from a device that never conducted.
                      'Below the conduction threshold: the device never turns on, so there are no current pulses and the tuned circuit has nothing to ring from. Raise the input — Class C only wakes up for a signal big enough to push it past its bias.'
                    : (c?.resonanceGain ?? 1) > 0.9
                      ? 'Tuned: the short current pulses kick a resonant circuit that rings a clean sine at the tuned frequency. The device itself never produces that sine — the tank does. Notice the recovered level does not track the input level: Class C is built for a constant carrier, not for music that rises and falls.'
                      : 'Mistuned: the tank no longer rings with the pulses and the recovered output collapses. There is no broadband version of this trick, which is why Class C is an RF amplifier, not an audio one.'}
        </Body>
      </Card>

      {cls === 'B' || cls === 'AB' ? (
        <Card>
          <HonestyBadge label="Zero-crossing zoom · ×3.2 vertical magnification" />
          <CrossoverZoom out={sim.out} />
          <Text style={styles.zoomNote}>
            {lin?.crossoverNotch ? 'The flat step at the crossing is the region where neither device conducts.' : 'Smooth through zero — the devices overlap.'}
          </Text>
        </Card>
      ) : null}

      {cls === 'A' ? <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'a-sounds-best')!} /> : null}
      {cls === 'AB' ? <MisconceptionCard m={MISCONCEPTIONS.find((m) => m.id === 'ab-is-half')!} /> : null}
      {cls === 'C' ? (
        <Card>
          <Text style={styles.zoomNote}>
            Never shown driving a loudspeaker with music on purpose: Class C output only exists at the tuned frequency. Its
            home is a transmitter feeding an antenna through a resonant network.
          </Text>
        </Card>
      ) : null}

      <SectionTitle>SIDE BY SIDE</SectionTitle>
      <HonestyBadge label="Efficiency figures are theoretical maxima or typical ranges — never guaranteed operating values" />
      <Text style={styles.zoomNote}>Three headline rows per class; tap a card for all eight. The class you are exploring opens first.</Text>
      {(['A', 'B', 'AB', 'C', 'D'] as AmpClass[]).map((k) => (
        <ClassFactsCard key={k} cls={k} expanded={openCard === k} onToggle={() => setOpenFacts(openCard === k ? 'none' : k)} />
      ))}
      <Text style={styles.zoomNote}>
        Class D gets Module 5 to itself — it is a switching arrangement and does not fit the conduction-angle story.
      </Text>

      <LearnMore title="CLASS G AND CLASS H — THE ADVANCED EXTENSION">
        <Body>
          Both are Class AB output stages with smarter power supplies. Class G switches between two or more rail
          voltages so quiet passages run from low rails (less dissipation) and peaks from high rails. Class H
          modulates the rail voltage continuously to track the signal. Neither changes the output stage’s conduction —
          they attack the wasted voltage across the devices.
        </Body>
      </LearnMore>
    </View>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && { color: colors.red }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  classHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  classTitle: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 2 },
  classMore: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1 },
  factsPressable: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', padding: 12, gap: 6, minHeight: 44 },
  factRow: { gap: 1 },
  factLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  factValue: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { minWidth: 70, flex: 1 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  statValue: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  statSub: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 10.5 },
  zoomNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
