/**
 * Module 7 — Real-World Amplifier Operation (spec Part 2 §8 + Part 3 §5):
 * safety notice, gain structure, speaker-load builder, power and current,
 * bridged operation, watts vs loudness, clipping risk, the rack inspection,
 * and the specification decoder.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import {
  evaluateGainStructure, seriesImpedance, parallelImpedance, sineVrms, ohmsCurrent, resistivePower,
  bridge, powerDeltaDb, type GainStage,
} from '../../../../features/amp/ampModel';
import {
  MISCONCEPTIONS, SAFETY_POINTS, RACK_SCENARIOS, RACK_FINDINGS, SPEC_SHEETS, SPEC_CONDITIONS,
  type RackFinding, type SpecCondition,
} from '../../../../features/amp/ampContent';
import { AMP_COLORS, Body, Card, ControlSlider, FormulaCard, HonestyBadge, LearnMore, MisconceptionCard, SectionTitle, SegRow } from '../kit';

const MIN_STEREO_Z = 4;
const MIN_BRIDGED_Z = 8;
const V_RMS_EXAMPLE = 28.3; // 40 V peak

const misc = (id: string) => MISCONCEPTIONS.find((m) => m.id === id)!;

/* ── gain structure chain ───────────────────────────────────────────────── */

function GainChain({ levels, firstClip, starved }: { levels: Record<GainStage, number>; firstClip: GainStage | null; starved: GainStage | null }) {
  const stages: { key: GainStage | 'out' | 'spk'; label: string }[] = [
    { key: 'source', label: 'SOURCE' }, { key: 'mixer', label: 'MIXER / DSP' }, { key: 'amp', label: 'AMP INPUT' }, { key: 'out', label: 'OUTPUT STAGE' }, { key: 'spk', label: 'SPEAKER' },
  ];
  const bw = 64, gap = 8, x0 = 2;
  return (
    <Svg width="100%" height={84} viewBox="0 0 360 84">
      {stages.map((s, i) => {
        const x = x0 + i * (bw + gap);
        const lvl = s.key === 'source' || s.key === 'mixer' || s.key === 'amp' ? levels[s.key] : null;
        const clip = s.key === firstClip || (s.key === 'out' && firstClip === 'amp');
        const starve = s.key === starved;
        const stroke = clip ? AMP_COLORS.fault : starve ? colors.gold : s.key === 'spk' ? AMP_COLORS.output : colors.steelBorder;
        return (
          <G key={s.key}>
            <Rect x={x} y={8} width={bw} height={30} rx={5} fill={clip ? '#241012' : '#151518'} stroke={stroke} strokeWidth={clip ? 1.6 : 1} />
            <SvgText x={x + bw / 2} y={27} fontSize={8.5} fill={clip ? colors.red : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{s.label}</SvgText>
            {i < 4 ? <Line x1={x + bw + 1} y1={23} x2={x + bw + gap - 1} y2={23} stroke={clip ? AMP_COLORS.fault : AMP_COLORS.input} strokeWidth={1.5} /> : null}
            {lvl != null ? (
              <>
                <Rect x={x} y={50} width={bw} height={8} rx={4} fill="#0a0a0c" stroke={colors.hairline} />
                {/* red ONLY at/over the clip point (amplitude colour standard); gold = starved */}
                <Rect x={x + 1} y={51} width={Math.max(0, Math.min(bw - 2, (bw - 2) * Math.min(lvl, 1)))} height={6} rx={3} fill={lvl > 1 ? colors.red : lvl < 0.15 ? colors.gold : colors.green} />
                <SvgText x={x + bw / 2} y={72} fontSize={8.5} fill={lvl > 1 ? colors.red : colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>{lvl > 1 ? 'CLIPPING' : `${Math.round(lvl * 100)}% of clip`}</SvgText>
              </>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}

/* ── module ─────────────────────────────────────────────────────────────── */

export function Mod7RealWorld() {
  // gain structure
  const [src, setSrc] = useState(0.5);
  const [mix, setMix] = useState(0.5);
  const [ampIn, setAmpIn] = useState(0.5);
  const gs = useMemo(() => evaluateGainStructure(src, mix, ampIn), [src, mix, ampIn]);

  // load builder
  const [topology, setTopology] = useState<'parallel' | 'series'>('parallel');
  const [speakers, setSpeakers] = useState<number[]>([8, 8]);
  const zTotal = useMemo(
    () => (speakers.length ? (topology === 'parallel' ? parallelImpedance(speakers) : seriesImpedance(speakers)) : null),
    [speakers, topology],
  );

  // power & current
  const [loadZ, setLoadZ] = useState<8 | 4 | 2>(8);
  const iEx = ohmsCurrent(V_RMS_EXAMPLE, loadZ)!;
  const pEx = resistivePower(V_RMS_EXAMPLE, loadZ)!;

  // bridge
  const [bridged, setBridged] = useState(false);
  const [bridgeZ, setBridgeZ] = useState<8 | 4>(8);
  const br = bridge(20, -20, bridgeZ)!;

  // watts vs loudness
  const [ratio, setRatio] = useState(2);
  const deltaDb = powerDeltaDb(1, ratio)!;

  // rack inspection
  const [rackIdx, setRackIdx] = useState(0);
  const [rackPick, setRackPick] = useState<RackFinding | null>(null);
  const scenario = RACK_SCENARIOS[rackIdx];

  // spec decoder
  const [sheetIdx, setSheetIdx] = useState(0);
  const [picked, setPicked] = useState<SpecCondition[]>([]);
  const [checked, setChecked] = useState(false);
  const sheet = SPEC_SHEETS[sheetIdx];
  const specCorrect = checked && picked.length === sheet.missing.length && sheet.missing.every((m) => picked.includes(m));

  const effectiveZ = zTotal;
  const belowMin = effectiveZ != null && effectiveZ < MIN_STEREO_Z;
  const MAX_SPEAKERS = 4;
  const atCap = speakers.length >= MAX_SPEAKERS;
  // The complete sheet (nothing missing) is correct ONLY with nothing ticked;
  // it used to read "YOU FOUND EVERY GAP" for a sheet that had none.
  const specVerdict = !checked
    ? null
    : sheet.missing.length === 0
      ? picked.length === 0 ? 'complete-right' : 'complete-wrong'
      : specCorrect ? 'right' : 'wrong';

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Text style={styles.safetyTitle}>⚠ SAFETY — READ BEFORE OPERATING REAL EQUIPMENT</Text>
        {SAFETY_POINTS.map((s) => (
          <Text key={s} style={styles.safetyLine}>• {s}</Text>
        ))}
      </Card>

      {/* ── gain structure ── */}
      <SectionTitle>1 · GAIN STRUCTURE — WHO CLIPS FIRST?</SectionTitle>
      <Body>
        Every stage has its own ceiling. Distortion happens at the FIRST stage that hits it, and nothing downstream can
        undo it. The amplifier’s front-panel control sets input sensitivity (attenuation) — it does not change how many
        watts the amplifier has.
      </Body>
      <Card>
        <HonestyBadge label="Relative levels — 100% = that stage’s clip point" />
        <GainChain levels={gs.levels} firstClip={gs.firstClip} starved={gs.starved} />
        <Text style={[styles.verdict, { color: gs.firstClip ? colors.red : gs.starved ? colors.gold : colors.green }]}>
          {gs.firstClip
            ? `FIRST STAGE CLIPPING: ${gs.firstClip.toUpperCase()}`
            : gs.starved
              ? `${gs.starved.toUpperCase()} RUNNING STARVED — NOISE FLOOR RISES`
              : 'HEALTHY GAIN STRUCTURE'}
        </Text>
        <Body>
          {gs.firstClip === 'source'
            ? 'The source is already flat-topped. Turning the mixer or amplifier down makes it quieter distortion — fix it at the source.'
            : gs.firstClip === 'mixer'
              ? 'The mixer clips before the amplifier sees anything. The amplifier’s CLIP light stays dark while the sound is harsh — the classic upstream-clipping trap.'
              : gs.firstClip === 'amp'
                ? 'Upstream is clean; the amplifier is being asked to swing past its rails. Reduce the amplifier input setting or the level feeding it.'
                : gs.starved
                  ? 'A stage is sending almost nothing, so the next stage must add gain — and adds noise with it. Bring every stage to a healthy nominal level.'
                  : 'Each stage sits comfortably below its ceiling with headroom for peaks.'}
        </Body>
      </Card>
      <ControlSlider label="Source output" value={src} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setSrc} />
      <ControlSlider label="Mixer / processor output" value={mix} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setMix} />
      <ControlSlider label="Amplifier input control" value={ampIn} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={setAmpIn} />
      <MisconceptionCard m={misc('gain-sets-watts')} />

      {/* ── load builder ── */}
      <SectionTitle>2 · SPEAKER-LOAD BUILDER</SectionTitle>
      <SegRow<'parallel' | 'series'>
        options={[
          { key: 'parallel', label: 'Parallel' },
          { key: 'series', label: 'Series' },
        ]}
        value={topology}
        onChange={setTopology}
      />
      <Body>Add cabinets and watch the total. The amplifier here is rated {MIN_STEREO_Z} Ω per channel — find the point where one more cabinet takes you below it.</Body>
      <View style={styles.chipRow}>
        {[16, 8, 4].map((z) => (
          <Pressable
            key={z}
            style={[styles.addChip, atCap && styles.addChipOff]}
            disabled={atCap}
            onPress={() => setSpeakers([...speakers, z])}
            accessibilityRole="button"
            accessibilityState={{ disabled: atCap }}
            accessibilityLabel={atCap ? `Add a ${z} ohm speaker — rack full at ${MAX_SPEAKERS}, clear first` : `Add a ${z} ohm speaker`}
          >
            <Text style={[styles.addChipText, atCap && { color: colors.textMuted }]}>+ {z} Ω</Text>
          </Pressable>
        ))}
        <Pressable style={styles.addChip} onPress={() => setSpeakers([])} accessibilityRole="button" accessibilityLabel="Clear all speakers">
          <Text style={styles.addChipText}>CLEAR</Text>
        </Pressable>
      </View>
      {atCap ? <Text style={styles.note}>{MAX_SPEAKERS} cabinets per channel is the limit of this builder — CLEAR to start again.</Text> : null}
      <Card tone="accent">
        <Text style={styles.loadList}>
          {speakers.length ? speakers.map((z) => `${z} Ω`).join(topology === 'parallel' ? '  ∥  ' : '  +  ') : 'No speakers connected'}
        </Text>
        <Text style={[styles.loadTotal, belowMin && { color: colors.red }]}>
          {zTotal != null ? `Ztotal ≈ ${zTotal.toFixed(2)} Ω (nominal)` : '—'}
        </Text>
        <Text style={styles.note}>
          {topology === 'parallel' ? '1/Ztotal = 1/Z1 + 1/Z2 + …' : 'Ztotal = Z1 + Z2 + …'} · Nominal calculation: real loudspeaker impedance varies with frequency.
        </Text>
        {belowMin ? (
          <Text style={styles.warn}>⚠ Below the amplifier’s {MIN_STEREO_Z} Ω per-channel minimum. Expect protection, limiting, or heat at level.</Text>
        ) : zTotal != null ? (
          <Text style={styles.ok}>✓ Within the {MIN_STEREO_Z} Ω per-channel minimum.</Text>
        ) : null}
      </Card>
      <MisconceptionCard m={misc('always-8-ohms')} />
      <MisconceptionCard m={misc('lower-z-better')} />

      {/* ── power & current ── */}
      <SectionTitle>3 · POWER AND CURRENT</SectionTitle>
      <SegRow<8 | 4 | 2>
        label={`Load at ${V_RMS_EXAMPLE} Vrms output (resistive teaching example)`}
        options={[
          { key: 8, label: '8 Ω' },
          { key: 4, label: '4 Ω' },
          { key: 2, label: '2 Ω' },
        ]}
        value={loadZ}
        onChange={setLoadZ}
      />
      <FormulaCard
        title={`${V_RMS_EXAMPLE} Vrms into ${loadZ} Ω`}
        lines={[
          `I = V / R = ${V_RMS_EXAMPLE} / ${loadZ} = ${iEx.toFixed(2)} A`,
          `P = V² / R = ${V_RMS_EXAMPLE}² / ${loadZ} = ${pEx.toFixed(0)} W`,
          `P = I² R = ${iEx.toFixed(2)}² × ${loadZ} = ${(iEx * iEx * loadZ).toFixed(0)} W`,
        ]}
        note="Halve the impedance and the current doubles for the same voltage — which is why lower loads run amplifiers hotter and why minimum-load ratings exist. A real loudspeaker is reactive and frequency-dependent; treat these as the resistive teaching case."
      />

      {/* ── bridged ── */}
      <SectionTitle>4 · BRIDGED OPERATION</SectionTitle>
      <SegRow<'stereo' | 'bridge'>
        options={[
          { key: 'stereo', label: 'Stereo' },
          { key: 'bridge', label: 'Bridge mode' },
        ]}
        value={bridged ? 'bridge' : 'stereo'}
        onChange={(v) => setBridged(v === 'bridge')}
      />
      {bridged ? (
        <SegRow<8 | 4>
          label="Bridged load"
          options={[
            { key: 8, label: '8 Ω' },
            { key: 4, label: '4 Ω' },
          ]}
          value={bridgeZ}
          onChange={setBridgeZ}
        />
      ) : null}
      <Card tone="accent">
        {bridged ? (
          <>
            <Text style={styles.loadTotal}>Vload = VchA − VchB = 20 − (−20) = {br.vLoad} V peak</Text>
            <Text style={[styles.loadTotal, br.effectivePerChannelZ < MIN_STEREO_Z && { color: colors.red }]}>
              Each channel sees ≈ {bridgeZ} Ω ÷ 2 = {br.effectivePerChannelZ} Ω
            </Text>
            {bridgeZ < MIN_BRIDGED_Z ? (
              <Text style={styles.warn}>⚠ {bridgeZ} Ω bridged is below the {MIN_BRIDGED_Z} Ω bridged minimum — each channel is effectively driving {br.effectivePerChannelZ} Ω.</Text>
            ) : (
              <Text style={styles.ok}>✓ {bridgeZ} Ω meets the {MIN_BRIDGED_Z} Ω bridged minimum.</Text>
            )}
            <Body>
              The two channels drive opposite ends of the load with opposite-polarity signals, so the load sees the
              DIFFERENCE — up to twice one channel’s voltage. The price: each channel works into what looks like half the
              load. Bridging must be explicitly supported, wired exactly as documented, and output negatives must never be
              assumed common.
            </Body>
          </>
        ) : (
          <Body>Two independent channels, each driving its own load against its own negative terminal. Switch to bridge mode to see what changes — and what it costs.</Body>
        )}
      </Card>
      <MisconceptionCard m={misc('common-ground')} />
      <MisconceptionCard m={misc('bridge-4x')} />

      {/* ── watts vs loudness ── */}
      <SectionTitle>5 · WATTS AND LOUDNESS</SectionTitle>
      <ControlSlider label="Power ratio P2 ÷ P1" value={ratio} min={0.25} max={10} step={0.25} format={(v) => `${v.toFixed(2)}×`} onChange={setRatio} />
      <FormulaCard
        title="Level change = 10 · log10(P2 / P1)"
        lines={[`${ratio.toFixed(2)}× the power = ${deltaDb >= 0 ? '+' : ''}${deltaDb.toFixed(2)} dB`, '2× power ≈ +3.01 dB · 10× power = +10 dB · 0.5× power ≈ −3.01 dB']}
        note="+3 dB is clearly audible — it is not “twice as loud.” Acoustic output also depends on loudspeaker sensitivity, distance, frequency content, directivity, the room, limiting, and power compression."
      />
      <MisconceptionCard m={misc('watts-loudness')} />

      {/* ── clipping risk ── */}
      <SectionTitle>6 · CLIPPING AND LOUDSPEAKER RISK</SectionTitle>
      <Body>
        A clipped waveform spends more time near maximum level, so its average power rises, and the flattened peaks add
        harmonic energy up the band. That is the mechanism — not “clipping turns audio into DC.” An underpowered
        amplifier does not damage a loudspeaker merely because its rating is lower; risk depends on the actual signal,
        how hard and how long it clips, its frequency content, the driver’s limits, and any limiting or protection.
      </Body>
      <MisconceptionCard m={misc('small-amp-safe')} />
      <MisconceptionCard m={misc('watt-match')} />

      {/* ── rack inspection ── */}
      <SectionTitle>7 · OPERATING-PRACTICE INSPECTION</SectionTitle>
      <Body>Inspect each virtual rack. Some have a fault; some are simply fine.</Body>
      <SegRow<number>
        options={RACK_SCENARIOS.map((s, i) => ({ key: i, label: s.title }))}
        value={rackIdx}
        onChange={(i) => {
          setRackIdx(i);
          setRackPick(null);
        }}
      />
      <Card>
        {scenario.readout.map((r) => (
          <View key={r.label} style={styles.readRow}>
            <Text style={styles.readLabel}>{r.label}</Text>
            <Text style={styles.readValue}>{r.value}</Text>
          </View>
        ))}
      </Card>
      <View style={{ gap: 6 }}>
        {RACK_FINDINGS.map((f) => {
          const isAnswer = rackPick != null && f.key === scenario.answer;
          const isWrongPick = rackPick === f.key && f.key !== scenario.answer;
          return (
            <Pressable
              key={f.key}
              onPress={() => setRackPick(f.key)}
              style={[styles.findingBtn, isAnswer && styles.findingRight, isWrongPick && styles.findingWrong]}
              accessibilityRole="button"
              accessibilityLabel={f.label}
            >
              <Text style={[styles.findingText, isAnswer && { color: colors.green }, isWrongPick && { color: colors.red }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {rackPick ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: rackPick === scenario.answer ? colors.green : colors.gold }]}>
            {rackPick === scenario.answer ? '✓ CORRECT' : 'NOT THIS ONE — HERE IS THE EVIDENCE'}
          </Text>
          <Body>{scenario.explain}</Body>
        </Card>
      ) : null}
      <MisconceptionCard m={misc('reset-protect')} />

      {/* ── spec decoder ── */}
      <SectionTitle>8 · SPECIFICATION DECODER</SectionTitle>
      <Body>A power rating is only as good as its test conditions. Which conditions is each sheet missing?</Body>
      <SegRow<number>
        options={SPEC_SHEETS.map((_, i) => ({ key: i, label: `Sheet ${i + 1}` }))}
        value={sheetIdx}
        onChange={(i) => {
          setSheetIdx(i);
          setPicked([]);
          setChecked(false);
        }}
      />
      <Card>
        {sheet.lines.map((l) => (
          <Text key={l} style={styles.specLine}>{l}</Text>
        ))}
      </Card>
      <View style={{ gap: 6 }}>
        {SPEC_CONDITIONS.map((c) => {
          const on = picked.includes(c.key);
          const shouldBe = checked && sheet.missing.includes(c.key);
          return (
            <Pressable
              key={c.key}
              onPress={() => {
                setChecked(false);
                setPicked(on ? picked.filter((k) => k !== c.key) : [...picked, c.key]);
              }}
              style={[styles.findingBtn, on && styles.findingOn, checked && shouldBe && styles.findingRight, checked && on && !shouldBe && styles.findingWrong]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Missing: ${c.label}`}
            >
              <Text style={styles.findingText}>{on ? '☑' : '☐'}  {c.label}</Text>
              {checked ? <Text style={styles.why}>{c.why}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.checkBtn} onPress={() => setChecked(true)} accessibilityRole="button" accessibilityLabel="Check my answer">
        <Text style={styles.checkBtnText}>CHECK</Text>
      </Pressable>
      {specVerdict ? (
        <Card tone="accent">
          <Text style={[styles.verdict, { color: specVerdict === 'right' || specVerdict === 'complete-right' ? colors.green : colors.gold }]}>
            {specVerdict === 'right'
              ? '✓ YOU FOUND EVERY GAP'
              : specVerdict === 'complete-right'
                ? '✓ CORRECT — NOTHING IS MISSING'
                : specVerdict === 'complete-wrong'
                  ? 'NOTHING IS MISSING HERE — EVERY CONDITION IS STATED'
                  : 'NOT QUITE — COMPARE THE MARKED CONDITIONS'}
          </Text>
          <Body>{sheet.verdict}</Body>
        </Card>
      ) : null}
      <LearnMore title="READING THE REST OF THE SHEET">
        <Body>
          THD+N compares unwanted harmonic and noise energy with the wanted signal under stated conditions — one number
          does not predict perceived quality, and this lab does not compute a fake one.
        </Body>
        <Body>
          Signal-to-noise ratio means something only with its reference level, bandwidth, weighting, and conditions
          attached.
        </Body>
        <FormulaCard
          title="Damping factor (simplified)"
          lines={['DF = Zload / Zout(amp)']}
          note="Varies with frequency; speaker-cable resistance sits in series with the amplifier’s output impedance, so the practical figure is a system property. Not a universal sound-quality score."
        />
        <Body>
          Gain is the ratio between output and input. Input sensitivity is the input level required to reach a specified
          output. Related, not interchangeable.
        </Body>
      </LearnMore>
      <MisconceptionCard m={misc('peak-continuous')} />
    </View>
  );
}

const styles = StyleSheet.create({
  safetyTitle: { color: colors.gold, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5 },
  safetyLine: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  verdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  addChip: {
    minHeight: 44, minWidth: 64, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315',
  },
  addChipOff: { opacity: 0.45 },
  addChipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  loadList: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14 },
  loadTotal: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 16 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  warn: { color: colors.red, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  ok: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 12.5 },
  readRow: { flexDirection: 'row', gap: 8 },
  readLabel: { width: 110, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.5, paddingTop: 2 },
  readValue: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17 },
  findingBtn: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101013', gap: 3,
  },
  findingOn: { borderColor: colors.cyan },
  findingRight: { borderColor: colors.green, backgroundColor: '#0f2416' },
  findingWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  findingText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  why: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  checkBtn: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.green, backgroundColor: '#173021',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5 },
  specLine: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
