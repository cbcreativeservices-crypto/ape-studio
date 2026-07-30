/**
 * digital/modules/modChain — Module 5 (Analog→Digital Conversion) and
 * Module 6 (Digital Processing & Formats) of the Digital Audio Sampling &
 * Conversion Lab. NO Skia here: every animated view is reached ONLY through
 * skiaGate.requireVizChain(); pre-Skia clients get the honest
 * VizUnavailableCard (§1.7) while all text, exercises and checks still work.
 *
 * CHARTER (owner, anti-misconception): analog clipping and digital full-scale
 * clipping are SEPARATE events at separate points in the chain; sample-and-
 * hold is a CONVERTER operation, not the DAC's output; floating point cannot
 * restore information clipped before or during conversion.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DigitalModuleProps } from '../DigitalModuleScreen';
import { Badge, ModeChips, MythReality, PanelCard, ReadoutGrid, dstyles, type ViewMode } from '../bits';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { requireVizChain, type VizChainModule } from '../skiaGate';
import type { AdcBlockKey } from '../vizChain';

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 — ANALOG-TO-DIGITAL CONVERSION
// ═════════════════════════════════════════════════════════════════════════════

type BlockInfo = { title: string; purpose: string; io: string; failure: string };

const BLOCK_INFO: Record<AdcBlockKey, BlockInfo> = {
  mic: {
    title: 'MICROPHONE',
    purpose: 'Turns air-pressure changes into a tiny analog voltage — the last acoustic step.',
    io: 'IN acoustic wave → OUT mic-level voltage (millivolts)',
    failure: 'A damaged capsule sounds dull, thin or crunchy — distortion born entirely in the analog world, before any converter.',
  },
  preamp: {
    title: 'PREAMP (analog gain)',
    purpose: 'Raises mic level to line level. THE gain decision of the whole chain happens here.',
    io: 'IN mic-level → OUT line-level voltage',
    failure: 'Pushed too hard it saturates: rounded, thickening distortion. That is an ANALOG clip — a separate event from digital full scale, and it happens first in the chain.',
  },
  filter: {
    title: 'ANTI-ALIASING FILTER',
    purpose: 'Removes content above half the sample rate so it cannot fold back as aliases.',
    io: 'IN line signal → OUT band-limited signal',
    failure: 'Without it, ultrasonic content folds into the audio band as inharmonic alias tones that no later stage can remove.',
  },
  sh: {
    title: 'SAMPLE & HOLD',
    purpose: 'Freezes the instantaneous voltage at each clock tick long enough for the quantizer to measure it. A CONVERTER operation — not what the DAC outputs.',
    io: 'IN band-limited voltage → OUT one held voltage per sample period',
    failure: 'Droop or clock jitter in the hold smears the measurement — heard as added noise and distortion.',
  },
  quant: {
    title: 'QUANTIZER',
    purpose: 'Snaps each held voltage to the nearest of 2ᴺ discrete levels (N = bit depth).',
    io: 'IN held voltage → OUT level number',
    failure: 'Too few bits and the rounding error becomes audible — noise, or grit riding quiet fades.',
  },
  encoder: {
    title: 'ENCODER',
    purpose: 'Packs the level numbers into fixed-format binary words (the PCM framing).',
    io: 'IN level numbers → OUT PCM words',
    failure: 'Framing or clock errors here sound like clicks, dropouts or bursts of garbage — data faults, not tone faults.',
  },
  pcm: {
    title: 'PCM STREAM',
    purpose: 'The finished product: a stream of numbers ready for storage, transmission or DSP.',
    io: 'IN PCM words → OUT file / stream',
    failure: 'Bit errors corrupt individual samples — isolated ticks and glitches rather than smooth distortion.',
  },
  conv: {
    title: 'CONVERTER',
    purpose: 'Measures the analog voltage at each clock tick and turns it into numbers (inside: sample-and-hold, quantizer and encoder — switch to STANDARD to open it up).',
    io: 'IN band-limited voltage → OUT PCM numbers',
    failure: 'Overload before or inside it flattens peaks; clock faults add noise, clicks or dropouts.',
  },
  data: {
    title: 'DATA',
    purpose: 'The digital audio itself: numbers, ready for storage or processing.',
    io: 'IN PCM words → OUT file / stream',
    failure: 'Bit errors corrupt samples — ticks and glitches.',
  },
};

// ── Gain staging model (MUST mirror vizChain.GAIN_MODEL) ─────────────────────
const DRIVE_MIN = -54;
const DRIVE_MAX = 12;
const RAIL_DB = 3;
const NOISE_DB = -60;
const ANALOG_CLIP_DB = 0.5;

function gainReadouts(driveDb: number) {
  const rail = Math.pow(10, RAIL_DB / 20);
  const g = Math.pow(10, driveDb / 20);
  const analogOut = rail * Math.tanh(g / rail);
  const digitalOver = analogOut >= 0.999;
  const analogClip = driveDb > ANALOG_CLIP_DB;
  const recPeakDb = 20 * Math.log10(Math.max(1e-4, Math.min(1, analogOut)));
  const zone = driveDb < -18 ? 'TOO LOW' : driveDb <= -10 ? 'RIGHT' : 'TOO HIGH';
  return { analogClip, digitalOver, recPeakDb, snrDb: recPeakDb - NOISE_DB, headroomDb: -recPeakDb, zone };
}

const ADC_CHECK: CheckSpec = {
  question:
    'A take comes back with gently ROUNDED peaks, and the DAW meter never touched 0 dBFS. Which clip happened?',
  options: [
    'Digital full-scale clipping — the converter ran out of numbers',
    'Analog clipping at the preamp — before the converter ever saw the signal',
    'No clipping — rounded peaks are normal',
  ],
  correctIdx: 1,
  reveal:
    'Rounded (not flat-topped) peaks with the digital meter never reaching 0 dBFS is the analog stage saturating — a separate event, earlier in the chain, at the preamp. Digital full-scale clipping cuts hard, flat tops exactly at 0 dBFS. Either way, the flattened information is gone before it is ever stored.',
  wrongHint: 'Look at the SHAPE of the peaks and where the digital meter topped out.',
};

export function AdcModule({ width, focused, help }: DigitalModuleProps) {
  const viz = useState(() => requireVizChain())[0];
  const [mode, setModeRaw] = useState<ViewMode>('standard');
  const [selected, setSelected] = useState<AdcBlockKey | null>(null);
  const [drive01, setDrive01] = useState(0.6);

  const setMode = (m: ViewMode) => {
    setModeRaw(m);
    setSelected(null); // block sets differ between SIMPLIFIED and STANDARD/X-RAY
  };
  const driveDb = DRIVE_MIN + drive01 * (DRIVE_MAX - DRIVE_MIN);
  const r = gainReadouts(driveDb);
  const info = selected ? BLOCK_INFO[selected] : null;

  return (
    <View style={{ gap: 12 }}>
      {/* ── The conversion chain (hero) ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>THE CONVERSION CHAIN</Text>
        <Text style={dstyles.body}>
          Every digital recording rides this train once, left to right. Tap any block to open it up
          — X-RAY adds what is happening along the path itself.
        </Text>
        <ModeChips mode={mode} onMode={setMode} />
        {viz ? (
          <ChainViz viz={viz} width={width} mode={mode} focused={focused} selected={selected} onSelect={(k) => setSelected(selected === k ? null : k)} onHelp={() => help('adc_chain')} />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text="ILLUSTRATIVE MODEL — block diagram, not a schematic; the waveform glyph shows the SIGNAL'S FORM at each point" />
        {info ? (
          <View style={styles.infoCard}>
            <View style={styles.infoHead}>
              <Text style={styles.infoTitle}>{info.title}</Text>
              <Pressable onPress={() => help('adc_chain')} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${info.title} — chain guide`}>
                <Text style={styles.infoGuide}>ⓘ GUIDE</Text>
              </Pressable>
            </View>
            <Text style={dstyles.body}>{info.purpose}</Text>
            <Text style={styles.infoIo}>{info.io}</Text>
            <Text style={styles.infoFail}>IF IT FAILS: {info.failure}</Text>
          </View>
        ) : (
          <Text style={dstyles.caption}>Tap a block for its purpose, its input/output, and what its failure sounds like. Long-press any block for the full chain guide.</Text>
        )}
      </PanelCard>

      {/* ── Sample-and-hold ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>SAMPLE & HOLD — WATCH ONE CELL WORK</Text>
        {viz ? <ShViz viz={viz} width={width} focused={focused} /> : <VizUnavailableCard />}
        <Badge text="CONCEPTUAL MODEL — SLOWED ~1000×; a real converter does this tens of thousands of times per second" />
        <Pressable onPress={() => help('sample_hold')} hitSlop={6} accessibilityRole="button" accessibilityLabel="Sample and hold — guide">
          <Text style={styles.infoGuide}>ⓘ WHAT AM I LOOKING AT?</Text>
        </Pressable>
        <Text style={dstyles.body}>
          The switch closes for an instant at each clock tick, the capacitor freezes that voltage
          (the flat amber steps) while the quantizer decides, and the finished code is released
          (green). This staircase is a CONVERTER operation — it is NOT what a DAC&apos;s analog
          output looks like. Module 7 shows why the reconstructed output is smooth.
        </Text>
      </PanelCard>

      {/* ── Gain staging (the star) ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>GAIN STAGING INTO THE CONVERTER</Text>
        <Text style={dstyles.body}>
          One knob, two separate limits. The ANALOG stage clips at the preamp (rounded
          saturation); DIGITAL full scale cuts a hard flat top at exactly 0 dBFS. They are
          different events at different points in the chain.
        </Text>
        {viz ? <GainViz viz={viz} width={width} focused={focused} driveDb={driveDb} /> : <VizUnavailableCard />}
        <Badge text="ILLUSTRATIVE MODEL — level axis compressed so the noise floor stays visible; noise drawn exaggerated" />
        <DragSlider
          value={drive01}
          onChange={setDrive01}
          label="INPUT LEVEL"
          readout={`${driveDb >= 0 ? '+' : ''}${driveDb.toFixed(1)} dB drive`}
          onHelp={() => help('gain_staging')}
        />
        <ReadoutGrid
          help={help}
          helpKey="gain_staging"
          items={[
            { k: 'PEAK', v: r.digitalOver ? '0.0 dBFS OVER' : `${r.recPeakDb.toFixed(1)} dBFS` },
            { k: 'SNR (vs drawn floor)', v: `${r.snrDb.toFixed(0)} dB` },
            { k: 'HEADROOM', v: r.digitalOver ? 'none' : `${r.headroomDb.toFixed(1)} dB` },
            { k: 'ZONE', v: r.analogClip && r.digitalOver ? 'ANALOG + DIGITAL CLIP' : r.analogClip ? 'ANALOG CLIP' : r.zone },
          ]}
        />
        <Text style={dstyles.caption}>
          {r.zone === 'TOO LOW'
            ? 'TOO LOW: the signal lives just above the noise floor. Every dB of makeup gain later lifts that noise with it — poor SNR is baked in at capture.'
            : r.zone === 'RIGHT'
              ? 'RIGHT: peaks around −18…−10 dBFS. Healthy SNR, real headroom for surprises — the modern converter sweet spot.'
              : r.analogClip || r.digitalOver
                ? 'TOO HIGH: the peaks are flattened — analog saturation rounds them, digital full scale shears them. Either way, that information is gone forever. No plugin, no float format, nothing downstream can rebuild it.'
                : 'TOO HIGH: peaks are hot. A transient louder than expected will clip — analog first (rounded), then digital full scale (flat-topped).'}
        </Text>
        <CheckQuestion spec={ADC_CHECK} />
      </PanelCard>
    </View>
  );
}

function ChainViz({
  viz,
  width,
  mode,
  focused,
  selected,
  onSelect,
  onHelp,
}: {
  viz: VizChainModule;
  width: number;
  mode: ViewMode;
  focused: boolean;
  selected: AdcBlockKey | null;
  onSelect: (k: AdcBlockKey) => void;
  onHelp: () => void;
}) {
  const phase = viz.usePhaseClock(focused, 0.3);
  return <viz.AdcChainView phase={phase} width={width} mode={mode === 'simple' ? 'simple' : mode === 'xray' ? 'xray' : 'standard'} selected={selected} onSelect={onSelect} onHelp={onHelp} />;
}

function ShViz({ viz, width, focused }: { viz: VizChainModule; width: number; focused: boolean }) {
  const phase = viz.usePhaseClock(focused, 0.16);
  return <viz.SampleHoldView phase={phase} width={width} />;
}

function GainViz({ viz, width, focused, driveDb }: { viz: VizChainModule; width: number; focused: boolean; driveDb: number }) {
  const phase = viz.usePhaseClock(focused, 0.22);
  return <viz.GainStagingView phase={phase} width={width} driveDb={driveDb} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — DIGITAL PROCESSING & FORMATS
// ═════════════════════════════════════════════════════════════════════════════

const FLOAT_CHECK: CheckSpec = {
  question:
    'Your float master bus peaks at +4 dBFS. You render straight to a 24-bit fixed file WITHOUT trimming. What is in the file?',
  options: [
    'The intact mix — the file remembers it was float',
    'A mix clipped flat at 0 dBFS — everything above full scale is sheared off',
    'The mix, automatically turned down to fit',
  ],
  correctIdx: 1,
  reveal:
    'Fixed point has no numbers above full scale, so everything over 0 dBFS is sheared flat at the render. The float headroom was real INSIDE the mix path — but it has to be trimmed below 0 dBFS BEFORE meeting any fixed-point stage (renders, converters, most outputs), or it clips there.',
  wrongHint: 'Fixed point simply has no way to write a number bigger than full scale.',
};

export function ProcessingModule({ width, focused, help }: DigitalModuleProps) {
  const viz = useState(() => requireVizChain())[0];
  const [value01, setValue01] = useState(0.78);
  const [gain01, setGain01] = useState(1);
  const [trim, setTrim] = useState(false);

  const gainDb = 12 * gain01;
  const busDb = -6 + gainDb;
  const fixedDb = Math.min(0, busDb);

  return (
    <View style={{ gap: 12 }}>
      {/* ── INT vs FLOAT ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>INTEGER vs FLOATING POINT</Text>
        <Text style={dstyles.body}>
          Fixed-point formats (16/24/32-bit int) end HARD at full scale — there is simply no
          number above 0 dBFS. Floating point trades some fine precision for an enormous range;
          the whole strip below barely dents it.
        </Text>
        {viz ? <viz.IntFloatRangeView width={width} /> : <VizUnavailableCard />}
        <Badge text="CONCEPTUAL SCALE — ranges shown in dB; the float bar continues far beyond both edges (~±770 dB for 32-bit float)" />
        <Pressable onPress={() => help('float_vs_int')} hitSlop={6} accessibilityRole="button" accessibilityLabel="Integer versus float — guide">
          <Text style={styles.infoGuide}>ⓘ WHY TWO NUMBER SYSTEMS?</Text>
        </Pressable>
      </PanelCard>

      {/* ── Float visualizer ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>HOW A FLOAT NUMBER WORKS</Text>
        {viz ? <viz.FloatView width={width} value01={value01} /> : <VizUnavailableCard />}
        <Badge text="SIMPLIFIED — decimal decades for teaching, NOT the real IEEE-754 binary fields (1 sign · 8 exponent · 23 mantissa bits)" />
        <DragSlider value={value01} onChange={setValue01} label="VALUE" readout={formatFloatReadout(value01)} onHelp={() => help('float_vs_int')} />
        <Text style={dstyles.caption}>
          Drag through zero and watch the SIGN flip; sweep the magnitude and the EXPONENT steps
          decade to decade while the MANTISSA slides smoothly between steps. The exponent is why
          float can represent both whispers and explosions: the ruler itself rescales.
        </Text>
      </PanelCard>

      {/* ── Gain above zero (the star) ── */}
      <PanelCard>
        <Text style={dstyles.eyebrow}>PUSH A MIX OVER 0 dBFS</Text>
        <Text style={dstyles.body}>
          The same bus, two fates. Push the gain, then trim it back and watch what each path
          gives back.
        </Text>
        {viz ? <HeadroomViz viz={viz} width={width} focused={focused} gainDb={gainDb} trim={trim} /> : <VizUnavailableCard />}
        <Badge text="ILLUSTRATIVE MODEL — one drawn bus; the fixed path clamps at full scale exactly as a 24-bit render does" />
        <DragSlider
          value={gain01}
          onChange={(v) => {
            setGain01(v);
            setTrim(false); // a new gain move re-poses the question
          }}
          label="GAIN"
          readout={`${busDb >= 0 ? '+' : ''}${busDb.toFixed(1)} dBFS bus peak`}
          onHelp={() => help('gain_above_zero')}
        />
        <Pressable
          style={[styles.trimBtn, trim && styles.trimBtnOn]}
          onPress={() => setTrim(!trim)}
          accessibilityRole="button"
          accessibilityState={{ selected: trim }}
          accessibilityLabel={trim ? 'Undo trim' : `Trim minus ${gainDb.toFixed(1)} decibels`}
        >
          <Text style={[styles.trimBtnText, trim && styles.trimBtnTextOn]}>{trim ? `UNDO TRIM (+${gainDb.toFixed(1)} dB)` : `TRIM −${gainDb.toFixed(1)} dB`}</Text>
        </Pressable>
        <ReadoutGrid
          help={help}
          helpKey="gain_above_zero"
          items={[
            { k: 'FLOAT BUS', v: `${busDb >= 0 ? '+' : ''}${busDb.toFixed(1)} dBFS` },
            { k: 'FIXED RENDER', v: busDb > 0 ? '0.0 dBFS (clipped)' : `${fixedDb.toFixed(1)} dBFS` },
            { k: 'FLOAT AFTER TRIM', v: `${(busDb - gainDb).toFixed(1)} dBFS — intact` },
            { k: 'FIXED AFTER TRIM', v: busDb > 0 ? `${(fixedDb - gainDb).toFixed(1)} dBFS — still clipped` : `${(fixedDb - gainDb).toFixed(1)} dBFS` },
          ]}
        />
        <Text style={dstyles.caption}>
          Float headroom is real INSIDE the processing path: over-zero peaks are just bigger
          numbers, and TRIM −{gainDb.toFixed(1)} brings the wave back untouched. The output
          stage and any fixed-point render still clip at 0 dBFS — trimming AFTER a fixed-point
          clip only makes a quieter clipped wave. And none of this restores what the ADC clipped:
          float preserves headroom, it never resurrects information.
        </Text>
        <CheckQuestion spec={FLOAT_CHECK} />
      </PanelCard>

      {/* ── Charter reminders ── */}
      <MythReality
        myth="Recording in 32-bit float means nothing can ever clip."
        reality="Float gives enormous headroom INSIDE the digital path — after conversion. The mic, the preamp and the ADC's analog input still clip exactly as they always did; a 32-bit float file will faithfully store the already-clipped waveform they hand it. (Dual-converter '32-bit float' recorders reduce input clipping with two ADCs, not with the file format.)"
      />
      <MythReality
        myth="A clipped recording can be fixed by converting the file to floating point."
        reality="Conversion changes the container, not the contents. The flattened peaks carry no information about what the waveform used to be — no format, and no gain move, can restore what was destroyed before or during conversion."
      />
    </View>
  );
}

function HeadroomViz({ viz, width, focused, gainDb, trim }: { viz: VizChainModule; width: number; focused: boolean; gainDb: number; trim: boolean }) {
  const phase = viz.usePhaseClock(focused, 0.2);
  return <viz.FloatHeadroomView phase={phase} width={width} gainDb={gainDb} trim={trim} />;
}

/** Mirrors vizChain.floatFields() for the slider readout (module stays Skia-free). */
function formatFloatReadout(value01: number): string {
  const signed = (value01 - 0.5) * 2;
  const mag = Math.pow(10, -3 + Math.min(1, Math.abs(signed)) * 3.6);
  const v = (signed < 0 ? -1 : 1) * mag;
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(4)}`;
}

const styles = StyleSheet.create({
  infoCard: {
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.35)',
    backgroundColor: '#15130d',
    padding: 10,
  },
  infoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  infoTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber },
  infoGuide: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.amber },
  infoIo: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  infoFail: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff8d7a' },
  trimBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#17140c',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  trimBtnOn: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0e130f' },
  trimBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  trimBtnTextOn: { color: '#5bff85' },
});
