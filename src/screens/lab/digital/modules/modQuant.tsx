/**
 * digital/modQuant — Module 3 (Quantization & Bit Depth + Dither) and
 * Module 4 (Binary Sample Values) of the Digital Audio Sampling & Conversion
 * Lab. NO Skia here — the visuals load only via skiaGate.requireVizQuant();
 * pre-Skia clients get the honest VizUnavailableCard while every readout,
 * table, bit switch and check question still works.
 *
 * CHARTER (anti-misconception, owner spec):
 *  • Bit depth = AMPLITUDE resolution and dynamic range — never frequency
 *    response.
 *  • Dither "linearizes quantization and preserves low-level behavior at the
 *    cost of a controlled noise increase" — never "adds resolution"
 *    unqualified.
 *  • A nominal 24-bit converter does NOT deliver 144 dB usable (ENOB block).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DigitalModuleProps } from '../DigitalModuleScreen';
import { Badge, MythReality, PanelCard, ReadoutGrid, dstyles } from '../bits';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { LabChip, CollapsibleSection } from '../../LabShell';
import { requireVizQuant } from '../skiaGate';
import type { DitherMode } from '../vizQuant';

// ─────────────────────────────────────────────────────────────────────────────
// Shared pure math/format helpers (no Skia — safe on every client)

/** Group digits with thousands separators (no Intl dependency on Hermes). */
function fmtGroup(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Mid-tread two's-complement quantizer on the −1..+1 axis (same math the
 *  viz draws — kept in both files so readouts work without Skia). */
function quantizeNorm(x: number, bits: number): number {
  const half = Math.pow(2, bits - 1);
  const code = Math.max(-half, Math.min(half - 1, Math.round(x * half)));
  return code / half;
}

/** RMS of the quantization error of a sine at `amp` peak through N bits. */
function quantErrorRmsDb(bits: number, amp: number): number {
  let acc = 0;
  const M = 512;
  for (let i = 0; i < M; i++) {
    const x = amp * Math.sin((2 * Math.PI * i) / M);
    const e = x - quantizeNorm(x, bits);
    acc += e * e;
  }
  const rms = Math.sqrt(acc / M);
  return rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY;
}

function fmtDb(db: number, digits = 1): string {
  return Number.isFinite(db) ? `${db.toFixed(digits)} dBFS` : '−∞ dBFS';
}

/** 16-digit binary of a signed 16-bit value, grouped in fours. */
function fmtBin16(v: number): string {
  const u = v & 0xffff;
  const b = u.toString(2).padStart(16, '0');
  return `${b.slice(0, 4)} ${b.slice(4, 8)} ${b.slice(8, 12)} ${b.slice(12, 16)}`;
}

function fmtHex16(v: number): string {
  return `0x${(v & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

/** dBFS of a signed 16-bit sample (0 → −∞). */
function sampleDb(v: number): number {
  return v === 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(Math.abs(v) / 32768);
}

/** Section eyebrow with an ⓘ that opens the guided-lesson popup. */
function SectionHead({ title, onHelp }: { title: string; onHelp: () => void }) {
  return (
    <View style={styles.headRow}>
      <Text style={dstyles.eyebrow}>{title}</Text>
      <Pressable onPress={onHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} — guided lesson`}>
        <Text style={styles.info}>ⓘ</Text>
      </Pressable>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3 — QUANTIZATION & BIT DEPTH

const BIT_CHOICES = [1, 2, 3, 4, 6, 8, 12, 16, 24];

const CHECK_BITDEPTH: CheckSpec = {
  question: 'A converter stores 8 bits per sample. How many amplitude levels does it have, and what is its THEORETICAL dynamic range (6.02·N + 1.76 dB)?',
  options: ['256 levels · ≈ 49.9 dB', '65,536 levels · ≈ 96 dB', '8 levels · ≈ 8 dB', '256 levels · ≈ 96 dB'],
  correctIdx: 0,
  reveal: 'Levels = 2⁸ = 256, and 6.02×8 + 1.76 ≈ 49.9 dB — theoretical. Real converters land below their formula number (analog noise, linearity), and remember: bits set AMPLITUDE resolution, never frequency response.',
  wrongHint: 'Levels = 2ᴺ, and each bit is worth ≈ 6 dB of dynamic range.',
};

const CHECK_DITHER: CheckSpec = {
  question: 'What does dither actually do when you reduce bit depth?',
  options: [
    'Linearizes quantization and preserves low-level behavior — at the cost of a controlled noise increase',
    'Adds resolution, recovering detail below the last bit for free',
    'Removes quantization noise entirely',
    'Boosts high frequencies to mask the distortion',
  ],
  correctIdx: 0,
  reveal: 'Dither does not add resolution — it linearizes quantization and preserves low-level behavior at the cost of a controlled noise increase: the correlated distortion becomes benign, steady noise, and fades stay smooth.',
  wrongHint: 'Think trade: what does dither buy, and what does it cost?',
};

export function QuantModule(p: DigitalModuleProps) {
  const viz = useState(() => requireVizQuant())[0];
  const [bits, setBits] = useState(4);
  const [levelDb, setLevelDb] = useState(-12);
  const [errorOnly, setErrorOnly] = useState(false);
  const [dither, setDither] = useState<DitherMode>('none');

  const amp = Math.pow(10, levelDb / 20);
  const half = Math.pow(2, bits - 1);
  const step = 1 / half;
  const levels = Math.pow(2, bits);
  const drTheory = 6.02 * bits + 1.76;
  const errRmsDb = useMemo(() => quantErrorRmsDb(bits, amp), [bits, amp]);
  // Below ~8 steps of peak swing the error locks to the signal (correlated).
  const correlated = amp < 8 * step;

  const readouts = [
    { k: 'BIT DEPTH', v: `${bits}-bit` },
    { k: 'LEVELS = 2ᴺ', v: fmtGroup(levels) },
    { k: 'STEP SIZE', v: `1/${fmtGroup(half)} FS` },
    { k: 'THEOR. DR', v: `≈ ${drTheory.toFixed(1)} dB` },
    { k: 'PEAK', v: fmtDb(levelDb, 0) },
    { k: 'HEADROOM', v: `${(-levelDb).toFixed(0)} dB` },
  ];

  return (
    <View style={styles.stack}>
      <PanelCard>
        <SectionHead title="QUANTIZATION — AMPLITUDE IN STEPS" onHelp={() => p.help('bit_depth')} />
        <Text style={dstyles.body}>
          Sampling measured WHEN; quantization measures HOW LOUD. Each sample is rounded to the nearest of 2ᴺ levels — the red
          whiskers are what rounding throws away. Quantization bites hardest on quiet signals: drag the level down and watch.
        </Text>
        {viz ? (
          <viz.QuantView width={p.width} bits={bits} levelDb={levelDb} errorOnly={errorOnly} />
        ) : (
          <VizUnavailableCard />
        )}
        {errorOnly ? (
          <Badge text={`ERROR VIEW — VERTICAL ZOOM ×${fmtGroup(levels)} (±½ STEP FILLS THE PANEL)`} />
        ) : bits >= 12 ? (
          <Badge text={`AT ${bits}-BIT THE STEPS ARE SUB-PIXEL — DRAWN HONESTLY AS A FINE BAND, NOT EXAGGERATED`} />
        ) : (
          <Badge text="AMBER = ORIGINAL · BLUE = SAMPLED · GREEN = STORED/RESULT · RED = ROUNDING ERROR" />
        )}
        <View style={dstyles.chipRow}>
          {BIT_CHOICES.map((b) => (
            <LabChip
              key={b}
              label={`${b}-BIT`}
              selected={bits === b}
              onPress={() => setBits(b)}
              onLongPress={() => p.help('quant_levels')}
            />
          ))}
        </View>
        <DragSlider
          value={(levelDb + 40) / 40}
          onChange={(v) => setLevelDb(Math.round(-40 + v * 40))}
          label="SIGNAL LEVEL"
          readout={fmtDb(levelDb, 0)}
          onHelp={() => p.help('quant_error')}
        />
        <View style={dstyles.chipRow}>
          <LabChip
            label="ERROR ONLY"
            selected={errorOnly}
            onPress={() => setErrorOnly(!errorOnly)}
            onLongPress={() => p.help('quant_error')}
          />
        </View>
        <ReadoutGrid help={p.help} helpKey="quant_error" items={errorOnly ? [...readouts, { k: 'ERROR RMS', v: fmtDb(errRmsDb) }] : readouts} />
        {errorOnly ? (
          <Text style={dstyles.caption}>
            {correlated
              ? 'This error is NOT noise — at this quiet level it is CORRELATED distortion, locked to the signal: harmonics, buzz, even total gating when the sine falls inside one step.'
              : 'At this healthy level the error is small and noise-like — a benign hiss floor far below the signal.'}
          </Text>
        ) : null}
      </PanelCard>

      <CollapsibleSection title="REAL CONVERTERS — THEORY VS PRACTICE">
        <Text style={dstyles.body}>
          6.02·N + 1.76 dB is the FORMULA, not the product. Analog input noise, clock jitter and converter linearity set the
          real limit: the industry measure is ENOB (effective number of bits), and even excellent 24-bit converters deliver
          roughly 20–21 effective bits (~120–125 dB). A nominal 24-bit converter does NOT deliver 144 dB usable.
        </Text>
        <MythReality
          myth="Higher bit depth means better frequency response — 24-bit sounds brighter and more detailed on top."
          reality="Bit depth sets AMPLITUDE resolution and dynamic range only: more bits = a lower quantization-noise floor. Frequency response is set by sample rate. Nothing about bit depth touches treble."
        />
      </CollapsibleSection>

      <PanelCard>
        <SectionHead title="DITHER — THE FIX FOR CORRELATED ERROR" onHelp={() => p.help('dither')} />
        <Text style={dstyles.body}>
          A tiny sine reduced to 8 bits, zoomed in to the last few steps. Undithered, the rounding error locks to the signal —
          the histogram shows discrete spikes. Adding the right noise BEFORE rounding decorrelates it: dither linearizes
          quantization and preserves low-level behavior at the cost of a controlled noise increase.
        </Text>
        <View style={dstyles.chipRow}>
          <LabChip label="NO DITHER" selected={dither === 'none'} onPress={() => setDither('none')} onLongPress={() => p.help('dither')} />
          <LabChip label="RPDF" selected={dither === 'rpdf'} onPress={() => setDither('rpdf')} onLongPress={() => p.help('dither')} />
          <LabChip label="TPDF" selected={dither === 'tpdf'} onPress={() => setDither('tpdf')} onLongPress={() => p.help('dither')} />
          <LabChip label="NOISE-SHAPED" selected={dither === 'shaped'} onPress={() => setDither('shaped')} onLongPress={() => p.help('noise_shaping')} />
        </View>
        {viz ? <viz.DitherView width={p.width} mode={dither} /> : <VizUnavailableCard />}
        <Badge text="REAL DITHER MATH (RPDF/TPDF/1ST-ORDER SHAPING) · SPECTRUM STRIP IS A SIMPLIFIED SHAPE, NOT AN FFT" />
        <Text style={dstyles.caption}>
          {dither === 'none'
            ? 'NO DITHER: the error repeats with the signal — correlated spikes in the histogram. Audible as gritty distortion and gated fades, not hiss.'
            : dither === 'rpdf'
              ? 'RPDF (flat, ±½ step): decorrelates the error VALUES, but the error POWER still tracks the signal — quiet passages can breathe.'
              : dither === 'tpdf'
                ? 'TPDF (two uniforms summed, ±1 step): the standard. Error value AND power decorrelate — a steady, benign noise floor.'
                : 'NOISE-SHAPED: TPDF plus first-order error feedback pushes the noise toward the top of the band, where hearing is least sensitive. Same honest trade, spent more cleverly.'}
        </Text>
      </PanelCard>

      <CheckQuestion spec={CHECK_BITDEPTH} />
      <CheckQuestion spec={CHECK_DITHER} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 4 — BINARY SAMPLE VALUES

/** Deterministic 28-sample snippet (two summed sines), stored as REAL signed
 *  16-bit ints — every inspector readout derives from this one integer. */
const INSPECT_SAMPLES: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < 28; i++) {
    const t = i / 28;
    const x = 0.68 * Math.sin(2 * Math.PI * 2 * t) + 0.24 * Math.sin(2 * Math.PI * 5 * t + 1.3);
    out.push(Math.max(-32768, Math.min(32767, Math.round(x * 0.92 * 32767))));
  }
  return out;
})();

const SIGNED_ROWS: { v: number; note: string }[] = [
  { v: 0, note: '0' },
  { v: 1, note: '+1' },
  { v: -1, note: '−1' },
  { v: 32767, note: 'max +32,767' },
  { v: -32768, note: 'min −32,768' },
];

/** MSB→LSB weights under two's complement: −32768, 16384, …, 1. */
const BIT_WEIGHTS: number[] = (() => {
  const w: number[] = [-32768];
  for (let i = 14; i >= 0; i--) w.push(Math.pow(2, i));
  return w;
})();

const CHECK_MSB: CheckSpec = {
  question: 'The register reads 0000 0000 0000 0001 (+1). Under two’s complement, what happens when you flip the MSB?',
  options: [
    'It becomes −32,767 — the MSB is worth −32,768',
    'It becomes +32,769 — the MSB is worth +32,768',
    'It just flips the sign: −1',
    'Nothing much — the MSB is the least valuable bit',
  ],
  correctIdx: 0,
  reveal: 'The MSB carries the only NEGATIVE weight: −32,768. So +1 becomes −32,768 + 1 = −32,767 — a full-scale jump from one bit. The MSB is the most valuable bit; the LSB (worth 1) is the least.',
  wrongHint: 'The MSB’s weight is negative under two’s complement.',
};

/** One hardware-style bit switch. */
function BitCell({
  on,
  weight,
  isSign,
  cellW,
  onFlip,
}: {
  on: boolean;
  weight: number;
  isSign: boolean;
  cellW: number;
  onFlip: () => void;
}) {
  return (
    <Pressable
      onPress={onFlip}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${isSign ? 'Sign bit' : 'Bit'} worth ${fmtGroup(weight)}`}
      style={({ pressed }) => [styles.bitCell, { width: cellW }, on && styles.bitCellOn, pressed && styles.bitCellPressed]}
    >
      <Text style={[styles.bitDigit, on && styles.bitDigitOn]}>{on ? '1' : '0'}</Text>
      <Text style={[styles.bitWeight, isSign && styles.bitWeightSign]} numberOfLines={1}>
        {isSign ? 'SIGN' : fmtGroup(weight)}
      </Text>
    </Pressable>
  );
}

export function BinaryModule(p: DigitalModuleProps) {
  const viz = useState(() => requireVizQuant())[0];
  const [sel, setSel] = useState(7);
  const [reg, setReg] = useState(16384); // 0100 0000 0000 0000 = +0.5 FS = −6 dBFS

  const v = INSPECT_SAMPLES[sel];
  const flipBit = (idx: number) => {
    // idx 0 = MSB … 15 = LSB, on the unsigned pattern; back to signed after.
    const u = (reg & 0xffff) ^ (1 << (15 - idx));
    setReg(u >= 32768 ? u - 65536 : u);
  };
  const regBits = useMemo(() => {
    const u = reg & 0xffff;
    return Array.from({ length: 16 }, (_v, i) => ((u >> (15 - i)) & 1) === 1);
  }, [reg]);
  const cellW = Math.floor((p.width - 4 * 7) / 8);

  return (
    <View style={styles.stack}>
      <PanelCard>
        <SectionHead title="SAMPLE INSPECTOR — WHAT IS ACTUALLY STORED" onHelp={() => p.help('binary_sample')} />
        <Text style={dstyles.body}>
          A digital recording is nothing but a list of integers. Tap or drag across this 28-sample snippet (16-bit · 48 kHz)
          and read the SAME stored number every way at once — every row below derives from one signed 16-bit integer.
        </Text>
        {viz ? (
          <viz.InspectStripView width={p.width} values={INSPECT_SAMPLES} selected={sel} onSelect={setSel} />
        ) : (
          <VizUnavailableCard />
        )}
        <ReadoutGrid
          help={p.help}
          helpKey="binary_sample"
          items={[
            { k: 'SAMPLE #', v: `${sel}` },
            { k: 'TIME', v: `${(sel / 48).toFixed(3)} ms` },
            { k: 'DECIMAL', v: fmtGroup(v) },
            { k: 'BINARY', v: fmtBin16(v) },
            { k: 'HEX', v: fmtHex16(v) },
            { k: 'NORMALIZED', v: (v / 32768).toFixed(5) },
            { k: '% OF FS', v: `${((v / 32768) * 100).toFixed(2)}%` },
            { k: 'LEVEL', v: fmtDb(sampleDb(v)) },
          ]}
        />
      </PanelCard>

      <PanelCard>
        <SectionHead title="SIGNED NUMBERS — TWO'S COMPLEMENT" onHelp={() => p.help('twos_complement')} />
        <Text style={dstyles.body}>
          Audio swings negative, so the 65,536 patterns are split around zero. The SAME 16 bits read differently depending on
          the convention:
        </Text>
        <View style={styles.table}>
          <View style={styles.tRow}>
            <Text style={[styles.tHead, styles.tBinCol]}>BIT PATTERN</Text>
            <Text style={[styles.tHead, styles.tNumCol]}>UNSIGNED</Text>
            <Text style={[styles.tHead, styles.tNumCol]}>TWO'S COMP</Text>
          </View>
          {SIGNED_ROWS.map((r) => (
            <View key={r.note} style={styles.tRow}>
              <Text style={[styles.tMono, styles.tBinCol]}>{fmtBin16(r.v)}</Text>
              <Text style={[styles.tMono, styles.tNumCol]}>{fmtGroup(r.v & 0xffff)}</Text>
              <Text style={[styles.tMono, styles.tNumCol, r.v < 0 && styles.tNeg]}>{r.v > 0 ? `+${fmtGroup(r.v)}` : fmtGroup(r.v)}</Text>
            </View>
          ))}
        </View>
        <Text style={dstyles.caption}>
          Why one more negative code? Zero has exactly one pattern and it lives on the non-negative side — that leaves 32,768
          codes below zero but only 32,767 above it. That is why full scale is −32,768…+32,767, not ±32,768.
        </Text>
      </PanelCard>

      <PanelCard>
        <SectionHead title="BIT TOGGLING — FLIP THE REGISTER YOURSELF" onHelp={() => p.help('bit_toggle')} />
        <Text style={dstyles.body}>
          Sixteen switches, one sample. Each bit's weight is printed under it — the MSB carries the only negative weight
          (−32,768: the sign bit). Flip bits and watch the value, the level and the sample dot move.
        </Text>
        <View style={styles.byteHead}>
          <Text style={styles.byteLabel}>MSB ← HIGH BYTE</Text>
        </View>
        <View style={styles.bitRow}>
          {regBits.slice(0, 8).map((on, i) => (
            <BitCell key={i} on={on} weight={BIT_WEIGHTS[i]} isSign={i === 0} cellW={cellW} onFlip={() => flipBit(i)} />
          ))}
        </View>
        <View style={styles.bitRow}>
          {regBits.slice(8, 16).map((on, i) => (
            <BitCell key={i + 8} on={on} weight={BIT_WEIGHTS[i + 8]} isSign={false} cellW={cellW} onFlip={() => flipBit(i + 8)} />
          ))}
        </View>
        <View style={[styles.byteHead, { alignItems: 'flex-end' }]}>
          <Text style={styles.byteLabel}>LOW BYTE → LSB</Text>
        </View>
        {viz ? <viz.BitDotStrip width={p.width} value={reg} /> : null}
        <ReadoutGrid
          help={p.help}
          helpKey="bit_toggle"
          items={[
            { k: 'DECIMAL', v: fmtGroup(reg) },
            { k: 'HEX', v: fmtHex16(reg) },
            { k: 'NORMALIZED', v: (reg / 32768).toFixed(5) },
            { k: 'LEVEL', v: fmtDb(sampleDb(reg)) },
          ]}
        />
        <View style={dstyles.chipRow}>
          <LabChip label="RESET (+16,384 · −6 dBFS)" selected={false} onPress={() => setReg(16384)} />
        </View>
      </PanelCard>

      <CheckQuestion spec={CHECK_MSB} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.amber, marginTop: 6 },

  // Signed-numbers table
  table: { borderRadius: 8, borderWidth: 1, borderColor: '#232329', backgroundColor: '#0f0f13', padding: 8, gap: 6 },
  tRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  tHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, color: colors.textSub },
  tMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textPrimary },
  tBinCol: { flexGrow: 1, flexBasis: 150 },
  tNumCol: { width: 74, textAlign: 'right' },
  tNeg: { color: '#ff8d7a' },

  // Bit switches (hardware feel: raised when 0, lit + inset when 1)
  byteHead: { marginBottom: -4 },
  byteLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1.2, color: colors.textSub },
  bitRow: { flexDirection: 'row', gap: 4 },
  bitCell: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#33333b',
    backgroundColor: '#1a1a20',
    borderBottomWidth: 3,
    borderBottomColor: '#0a0a0d',
    paddingVertical: 6,
    alignItems: 'center',
    gap: 1,
  },
  bitCellOn: { backgroundColor: '#241c09', borderColor: 'rgba(255,198,77,.65)', borderBottomColor: 'rgba(255,180,0,.5)' },
  bitCellPressed: { borderBottomWidth: 1, transform: [{ translateY: 2 }], backgroundColor: '#101014' },
  bitDigit: { fontFamily: fonts.mono, fontSize: 17, color: colors.textSub },
  bitDigitOn: { color: colors.amber },
  bitWeight: { fontFamily: fonts.barlowCondensedMedium, fontSize: 9, color: colors.textMuted },
  bitWeightSign: { color: '#ff8d7a' },
});
