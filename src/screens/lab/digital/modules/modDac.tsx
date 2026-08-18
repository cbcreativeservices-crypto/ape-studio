/**
 * Digital Lab — Module 7 (D-to-A Reconstruction) & Module 8 (Errors & Limits).
 * THE LAB'S HEART: Module 7 kills the staircase myth with the four-layer
 * reconstruction hero; Module 8 is the permanent MYTH vs REALITY charter panel
 * plus the honest jitter model.
 *
 * CHARTER (owner): sample values describe a band-limited signal; the DAC +
 * reconstruction filter produce a CONTINUOUS analog waveform via band-limited
 * interpolation — never connect-the-dots, never stair steps as the final
 * output. The ZOH steps are an INTERMEDIATE model. Oversampling relaxes the
 * analog filter and adds NO new information. Jitter is timing variation, not
 * rounding — and cable/clock audiophile overclaims stay out.
 *
 * NO Skia here — the visuals load solely through skiaGate.requireVizDac();
 * pre-Skia clients get the honest VizUnavailableCard (§1.7).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DigitalModuleProps } from '../DigitalModuleScreen';
import {
  Badge,
  ModeChips,
  MythReality,
  PanelCard,
  ReadoutGrid,
  dstyles,
  type ViewMode,
} from '../bits';
import { CheckQuestion, DragSlider, VizUnavailableCard } from '../../foundations/bits';
import { LabChip } from '../../LabShell';
import { LabPhoto } from '../../labPhoto';
import { requireVizDac } from '../skiaGate';
import { colors, fonts } from '../../../../theme/tokens';

/** ⓘ help affordance for panels without a slider (sliders carry their own). */
function HelpLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${label} — guided lesson`}>
      <Text style={local.helpLink}>ⓘ {label}</Text>
    </Pressable>
  );
}

function PanelHead({ title, helpLabel, onHelp }: { title: string; helpLabel?: string; onHelp?: () => void }) {
  return (
    <View style={local.headRow}>
      <Text style={dstyles.eyebrow}>{title}</Text>
      {onHelp && helpLabel ? <HelpLink label={helpLabel} onPress={onHelp} /> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ISP math — EXACT for a pure sine (mirrors IspView's drawing: 16 sample
// instants, samples normalized to a −0.1 dBFS sample peak). Where the samples
// land in phase sets the SAMPLE peak; the sine's amplitude IS the true peak.

const ISP_SAMPLES = 16; // must match IspView's drawn sample count
const ISP_SAMPLE_PEAK_DB = -0.1; // sample-peak normalization target

function ispStats(ratio: number, phaseDeg: number) {
  const phi = (phaseDeg * Math.PI) / 180;
  let maxSin = 0;
  for (let n = 0; n < ISP_SAMPLES; n++) {
    maxSin = Math.max(maxSin, Math.abs(Math.sin(2 * Math.PI * ratio * n + phi)));
  }
  // Samples scaled so the biggest one reads ISP_SAMPLE_PEAK_DB; the sine's
  // amplitude (the true peak) is then target/maxSin of full scale.
  const truePeakDb = ISP_SAMPLE_PEAK_DB - 20 * Math.log10(Math.max(1e-6, maxSin));
  return {
    samplePeakDb: ISP_SAMPLE_PEAK_DB,
    truePeakDb,
    missDb: truePeakDb - ISP_SAMPLE_PEAK_DB,
    clipRisk: truePeakDb > 0,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 7 — D-TO-A RECONSTRUCTION

type LayerKey = 'samples' | 'zoh' | 'recon' | 'original';
const LAYER_CHIPS: { key: LayerKey; label: string }[] = [
  { key: 'samples', label: 'SAMPLES' },
  { key: 'zoh', label: 'ZOH' },
  { key: 'recon', label: 'RECONSTRUCTED' },
  { key: 'original', label: 'ORIGINAL' },
];

const OS_CHOICES: (1 | 2 | 4 | 8)[] = [1, 2, 4, 8];

export function DacModule({ width, focused, help }: DigitalModuleProps) {
  const viz = useState(() => requireVizDac())[0];
  const [mode, setMode] = useState<ViewMode>('standard');
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    samples: true,
    zoh: true,
    recon: true,
    original: true,
  });
  const [os, setOs] = useState<1 | 2 | 4 | 8>(1);
  const [ratio01, setRatio01] = useState(0.55);
  const [phase01, setPhase01] = useState(0.35);

  const ratio = 0.4 + ratio01 * 0.09; // 0.40..0.49 · fs
  const phaseDeg = phase01 * 180;
  const isp = useMemo(() => ispStats(ratio, phaseDeg), [ratio, phaseDeg]);
  const vw = width - 26; // PanelCard padding + border

  const toggleLayer = (k: LayerKey) => setLayers((s) => ({ ...s, [k]: !s[k] }));
  const showZoh = layers.zoh && mode !== 'simple'; // SIMPLIFIED hides the intermediate

  return (
    <View style={{ gap: 12 }}>
      {/* ── Hero: the four-layer reconstruction ─────────────────────────── */}
      <PanelCard>
        <PanelHead title="MODULE 7 · NUMBERS BACK INTO SOUND" helpLabel="reconstruction" onHelp={() => help('reconstruction')} />
        <Text style={dstyles.body}>
          The stored sample values describe exactly one band-limited signal. The DAC plus its
          reconstruction filter OUTPUT that signal — a continuous analog waveform, made by
          band-limited interpolation. Not straight lines between dots. Not stair steps. Toggle the
          layers and watch the reconstructed curve pass through every sample while clearing every
          step corner — and lie exactly on the original.
        </Text>
        <ModeChips mode={mode} onMode={setMode} />
        <View style={dstyles.chipRow}>
          {LAYER_CHIPS.map((c) =>
            c.key === 'zoh' && mode === 'simple' ? null : (
              <LabChip
                key={c.key}
                label={c.label}
                selected={c.key === 'zoh' ? showZoh : layers[c.key]}
                onPress={() => toggleLayer(c.key)}
                onLongPress={c.key === 'zoh' ? () => help('zoh') : () => help('reconstruction')}
              />
            ),
          )}
        </View>
        {viz ? (
          <viz.ReconstructionView
            width={vw}
            running={focused}
            showSamples={layers.samples}
            showZoh={showZoh}
            showRecon={layers.recon}
            showOriginal={layers.original}
            xray={mode === 'xray'}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text="CONCEPTUAL MODEL — SLOWED FOR VISIBILITY · ZOH DRAWN AS THE INTERMEDIATE STAGE IT IS" />
        <Text style={dstyles.caption}>
          The dim steps are the zero-order hold — a real intermediate voltage inside the converter,
          and a useful model. The final analog output is the bright continuous curve: below Nyquist
          it overlays the original signal exactly. That identity is the whole point of the module.
        </Text>
      </PanelCard>

      {/* ── The DAC chain ────────────────────────────────────────────────── */}
      <PanelCard>
        <PanelHead title="THE D-TO-A CHAIN" helpLabel="zoh" onHelp={() => help('zoh')} />
        {/* Reference photo (owner 2026-08-18) — the physical converter the
            schematic strip below models. Supplementary, tap to enlarge. */}
        <LabPhoto
          file="dac.webp"
          h={140}
          accessibilityLabel="digital-to-analog converter"
          caption="A digital-to-analog converter (DAC) — the box that turns PCM numbers back into a continuous analog voltage. The schematic strip below traces what happens inside: data → held steps → reconstruction filter → smooth analog."
        />
        {viz ? <viz.DacChainStrip width={vw} running={focused} /> : <VizUnavailableCard />}
        <Text style={dstyles.caption}>
          PCM data is clocked into the DAC element, whose held output is the stepped intermediate —
          then the reconstruction filter turns steps into the smooth analog waveform. The
          step→smooth handoff happens at the filter block, nowhere else.
        </Text>
      </PanelCard>

      {/* ── Frequency domain: images + oversampling ──────────────────────── */}
      <PanelCard>
        <PanelHead title="SPECTRAL IMAGES & OVERSAMPLING" helpLabel="spectral images" onHelp={() => help('spectral_images')} />
        <Text style={dstyles.body}>
          In the frequency domain, sampling mirrored the audio spectrum around every multiple of the
          sample rate. The reconstruction filter's job is to remove those images. Oversample and the
          images slide far away — so the analog filter can relax from a cliff into a gentle slope.
        </Text>
        <View style={dstyles.chipRow}>
          {OS_CHOICES.map((c) => (
            <LabChip
              key={c}
              label={`${c}×`}
              selected={os === c}
              onPress={() => setOs(c)}
              onLongPress={() => help('oversampling')}
            />
          ))}
        </View>
        {viz ? <viz.ImagesView width={vw} os={os} /> : <VizUnavailableCard />}
        <ReadoutGrid
          help={help}
          helpKey="oversampling"
          items={[
            { k: 'OUTPUT RATE', v: `${os} × 48 kHz` },
            { k: 'FIRST IMAGE AT', v: `${os * 48} kHz` },
            { k: 'FILTER TRANSITION', v: `20 → ${os * 48 - 20} kHz` },
          ]}
        />
        <Badge text="DRAWN SPECTRA — ILLUSTRATIVE MIRROR MATH, √f AXIS COMPRESSION · NOT A MEASUREMENT" />
        <Text style={dstyles.caption}>
          Oversampling relaxes the analog filter — it adds no new information. The audio band was
          fully described by the original samples; the extra rate only buys engineering room.
        </Text>
      </PanelCard>

      {/* ── Inter-sample peaks — the advanced star ───────────────────────── */}
      <PanelCard>
        <PanelHead title="INTER-SAMPLE PEAK EXPLORER" helpLabel="inter-sample peaks" onHelp={() => help('isp')} />
        <Text style={dstyles.body}>
          A near-Nyquist sine, its samples normalized to −0.1 dBFS — every stored value is legal, and
          a sample-peak meter approves. But the continuous waveform the DAC must reconstruct arcs
          ABOVE 0 dBFS between the samples. Drag the phase and watch the true peak swing while the
          samples never move past the line.
        </Text>
        <DragSlider
          label="FREQUENCY"
          value={ratio01}
          onChange={setRatio01}
          readout={`${(ratio * 48).toFixed(1)} kHz (${ratio.toFixed(3)} · fs)`}
          onHelp={() => help('isp')}
        />
        <DragSlider
          label="SAMPLE PHASE"
          value={phase01}
          onChange={setPhase01}
          readout={`${phaseDeg.toFixed(0)}°`}
          onHelp={() => help('isp')}
        />
        {viz ? <viz.IspView width={vw} running={focused} ratio={ratio} phaseDeg={phaseDeg} /> : <VizUnavailableCard />}
        <ReadoutGrid
          help={help}
          helpKey="isp"
          items={[
            { k: 'SAMPLE PEAK', v: `${isp.samplePeakDb.toFixed(2)} dBFS` },
            { k: 'TRUE PEAK', v: `${isp.truePeakDb >= 0 ? '+' : ''}${isp.truePeakDb.toFixed(2)} dBTP` },
            { k: 'METER MISSES', v: `${isp.missDb.toFixed(2)} dB` },
          ]}
        />
        <View style={[local.riskRow, isp.clipRisk ? local.riskOn : local.riskOff]}>
          <Text style={[local.riskText, { color: isp.clipRisk ? colors.red : colors.greenBright }]}>
            {isp.clipRisk
              ? '⚠ CLIP RISK — reconstruction exceeds 0 dBFS: the DAC or a downstream encoder can overload'
              : '✓ NO OVERSHOOT — at this phase a sample lands close enough to the crest'}
          </Text>
        </View>
        <Text style={dstyles.caption}>
          Exact math for a pure sine: where the samples land in phase sets the SAMPLE peak; the
          sine's amplitude is the TRUE peak. This gap is why sample-peak meters miss what true-peak
          meters catch — true-peak metering oversamples to estimate the reconstructed waveform.
        </Text>
      </PanelCard>

      <CheckQuestion
        spec={{
          question: 'The reconstruction filter’s output — the waveform on the DAC’s analog connector — looks like:',
          options: [
            'Stair steps matching the held sample values',
            'Straight lines connecting the sample dots',
            'A continuous band-limited waveform passing through the sample values',
          ],
          correctIdx: 2,
          reveal:
            'The samples describe exactly one band-limited signal, and the DAC + reconstruction filter produce it — a continuous analog waveform via band-limited interpolation. The steps are an intermediate stage; connect-the-dots never happens at all.',
          wrongHint: 'Look at the hero view: the bright output curve never touches a step corner and is never a straight segment.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'Every sample in a file sits below 0 dBFS. Can the DAC’s analog output still overload?',
          options: [
            'No — the samples are the signal, so below 0 dBFS is always safe',
            'Yes — the reconstructed waveform between samples can rise above 0 dBFS',
            'Only if the file is floating point',
          ],
          correctIdx: 1,
          reveal:
            'True. Near-Nyquist content can put every sample below full scale while the continuous reconstruction arcs above it between them — inter-sample peaks. That is why true-peak (oversampled) meters exist.',
          wrongHint: 'The explorer above shows legal samples with the reconstruction glowing red above the 0 dBFS line.',
        }}
      />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 8 — ERRORS & LIMITS

/** The owner's charter panel — all eight, permanent. */
const MYTHS: { myth: string; reality: string }[] = [
  {
    myth: 'Digital audio is stair steps — the output is a jagged staircase.',
    reality:
      'Sample values describe a band-limited signal; the DAC + reconstruction filter output a CONTINUOUS analog waveform via band-limited interpolation. The stepped voltage is an intermediate stage inside the converter — never the final output.',
  },
  {
    myth: 'The DAC connects the dots with straight lines, so more samples = smoother curves.',
    reality:
      'Reconstruction is not connect-the-dots. Below Nyquist the samples already describe the waveform exactly — one band-limited curve passes through them, and the filter produces that curve. Higher sample rates buy BANDWIDTH, not smoothness.',
  },
  {
    myth: 'Higher bit depth improves high-frequency response.',
    reality:
      'Bit depth sets amplitude resolution — noise floor and dynamic range (≈ 6.02·N + 1.76 dB). Frequency response is set by sample rate. Time and amplitude are separate axes with separate settings.',
  },
  {
    myth: 'Higher sample rate gives more volume levels.',
    reality:
      'Sample rate sets the audio bandwidth available (up to Nyquist) — it adds nothing to amplitude resolution. Loudness steps are bit depth’s job: N bits = 2ᴺ levels.',
  },
  {
    myth: 'A 24-bit recording always has 144 dB of dynamic range.',
    reality:
      '144 dB is the theoretical ceiling. Analog noise, converter linearity and clocking set the real usable range (ENOB) well below theory — excellent converters manage roughly 115–120 dB.',
  },
  {
    myth: 'Record as hot as possible, right up to 0 dBFS, for maximum resolution.',
    reality:
      'Modern converters’ noise floors sit far below the mic and room. Peaks around −18 to −10 dBFS keep full quality with safe headroom — while a clipped peak is destroyed forever.',
  },
  {
    myth: 'Convert a clipped recording to 32-bit float and the clipping can be restored.',
    reality:
      'Float cannot restore information destroyed before or during conversion. Its huge range protects processing AFTER the ADC — the flattened peaks stay flattened.',
  },
  {
    myth: 'Higher sample rates always sound audibly better.',
    reality:
      'Once the rate covers hearing plus filter margin, extra rate adds bandwidth you cannot hear. Careful level-matched comparisons routinely fail to distinguish it. Higher rates have real engineering uses — automatic audible improvement is not one of them.',
  },
];

export function ErrorsModule({ width, focused, help }: DigitalModuleProps) {
  const viz = useState(() => requireVizDac())[0];
  const [jitAmt, setJitAmt] = useState(0.6);
  const [jitMode, setJitMode] = useState<'random' | 'periodic'>('random');
  const vw = width - 26;
  const peakDevNs = jitAmt * 8; // the honest number behind the ×1000 drawing

  return (
    <View style={{ gap: 12 }}>
      {/* ── The charter panel ────────────────────────────────────────────── */}
      <PanelCard>
        <PanelHead title="MODULE 8 · MYTH vs REALITY" helpLabel="myths" onHelp={() => help('myths')} />
        <Text style={dstyles.body}>
          The permanent misconception panel — every classic digital-audio myth, next to what is
          actually true. If one line of this lab survives in your memory, make it one of these.
        </Text>
        {MYTHS.map((m) => (
          <MythReality key={m.myth} myth={m.myth} reality={m.reality} />
        ))}
      </PanelCard>

      {/* ── Clock & jitter ───────────────────────────────────────────────── */}
      <PanelCard>
        <PanelHead title="CLOCK & JITTER" helpLabel="jitter" onHelp={() => help('jitter')} />
        <Text style={dstyles.body}>
          Jitter is timing variation of the sampling instants — not value rounding. Measure the
          right voltage at the wrong moment and you store a wrong value; the error grows with how
          fast the signal is changing at that instant.
        </Text>
        <View style={dstyles.chipRow}>
          <LabChip label="RANDOM" selected={jitMode === 'random'} onPress={() => setJitMode('random')} onLongPress={() => help('jitter')} />
          <LabChip label="PERIODIC" selected={jitMode === 'periodic'} onPress={() => setJitMode('periodic')} onLongPress={() => help('jitter')} />
        </View>
        <DragSlider
          label="JITTER AMOUNT"
          value={jitAmt}
          onChange={setJitAmt}
          readout={`±${peakDevNs.toFixed(1)} ns`}
          onHelp={() => help('jitter')}
        />
        {viz ? <viz.JitterView width={vw} running={focused} amount={jitAmt} mode={jitMode} /> : <VizUnavailableCard />}
        <ReadoutGrid
          help={help}
          helpKey="jitter"
          items={[
            { k: 'NOMINAL INTERVAL', v: '20.83 µs @48k' },
            { k: 'PEAK DEVIATION', v: `±${peakDevNs.toFixed(1)} ns` },
            { k: 'MATTERS AT', v: 'ADC / DAC conversion' },
            { k: 'HARMLESS AT', v: 'buffered · reclocked playback' },
          ]}
        />
        <Badge text="TIMING DEVIATION EXAGGERATED ×1000 FOR VISIBILITY — ILLUSTRATIVE MODEL" />
        <Text style={dstyles.caption}>
          The whiskers show the value error: error ≈ slope × timing error — biggest where the
          waveform is steepest, zero where it is flat. Jitter matters where a clock times an actual
          conversion; file transfers and buffered, reclocked playback carry the same numbers
          regardless of the cable. Claims that clocks and cables transform playback sound should be
          weighed against that.
        </Text>
      </PanelCard>

      {/* ── Data rate — the mental math ──────────────────────────────────── */}
      <PanelCard>
        <PanelHead title="DATA RATE — THE MENTAL MATH" helpLabel="data rate" onHelp={() => help('data_rate')} />
        <ReadoutGrid
          help={help}
          helpKey="data_rate"
          items={[
            { k: 'FORMAT', v: '48k × 24-bit × 2ch' },
            { k: 'BIT RATE', v: '2.304 Mbit/s' },
            { k: 'STORAGE', v: '≈ 17.3 MB/min' },
          ]}
        />
        <Text style={dstyles.caption}>
          Rate = sample rate × bit depth × channels. Do it once in your head and you can sanity-check
          any session. The full calculator (with storage planning) lives in the Calculator
          Laboratory.
        </Text>
      </PanelCard>

      {/* ── Knowledge checks ─────────────────────────────────────────────── */}
      <CheckQuestion
        spec={{
          question: 'Which signal chain is in the correct order?',
          options: [
            'mic → ADC → preamp → anti-aliasing → DSP → reconstruction → DAC → amp → speaker',
            'mic → preamp → anti-aliasing → ADC → DSP → DAC → reconstruction → amp → speaker',
            'mic → preamp → ADC → anti-aliasing → DSP → DAC → amp → reconstruction → speaker',
          ],
          correctIdx: 1,
          reveal:
            'Analog gain and the anti-aliasing filter must come BEFORE the ADC (nothing above Nyquist may reach the sampler), and the reconstruction filter comes right AFTER the DAC — before amplification.',
          wrongHint: 'Two anchors: anti-aliasing is always immediately before the ADC; reconstruction is always immediately after the DAC.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'A recorded waveform shows peaks sliced flat at a constant ceiling. Which stage did the damage?',
          options: [
            'The reconstruction filter smoothing too hard',
            'Jitter on the DAC clock',
            'The analog input or converter driven past full scale — clipping at/before the ADC',
          ],
          correctIdx: 2,
          reveal:
            'Flat-topped peaks are clipping: the signal hit the ceiling of the analog stage or the converter’s full scale. The information above the ceiling was never stored — no later stage can bring it back.',
          wrongHint: 'The reconstruction filter and clock change timing/smoothness — neither slices amplitude flat.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'fs = 48 kHz, no anti-aliasing filter, and a 30 kHz tone reaches the sampler. What frequency lands in the file?',
          options: ['30 kHz', '24 kHz', '18 kHz', 'Nothing — it disappears'],
          correctIdx: 2,
          reveal:
            'Above Nyquist (24 kHz) the tone folds: alias = |30 − 48| = 18 kHz. The samples fit an 18 kHz sine exactly, and it lands in-band — permanently. That is why the anti-aliasing filter sits BEFORE the sampler.',
          wrongHint: 'Fold it around Nyquist: alias = |f − nearest multiple of fs|.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'You archive long spoken-word interviews and, separately, multitrack music masters. A sensible format pairing?',
          options: [
            'Everything at 192 kHz / 32-bit float — higher is always better',
            'Spoken word 48 kHz / 24-bit mono; music masters 96 kHz / 24-bit — spend bandwidth where it pays',
            'Spoken word 192 kHz for sibilance; music 44.1 kHz / 16-bit to save space',
          ],
          correctIdx: 1,
          reveal:
            'Match the format to the content: speech needs clean 20 kHz bandwidth and headroom (48k/24 mono is generous, and the data rate stays sane for hours of tape); music masters may justify 96k for processing margin. Blanket maximums just multiply storage without audible return.',
          wrongHint: 'Recall the data-rate math above — every doubling of fs doubles the storage for the same minutes.',
        }}
      />
    </View>
  );
}

const local = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  helpLink: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.amber },
  riskRow: { borderRadius: 8, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10 },
  riskOn: { borderColor: 'rgba(255,75,58,.55)', backgroundColor: '#170f0e' },
  riskOff: { borderColor: 'rgba(55,224,95,.45)', backgroundColor: '#0e130f' },
  riskText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});
