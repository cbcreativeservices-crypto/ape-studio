/**
 * meter/modMeterB — Modules 5–7 of the Visual Audio Analysis Lab (owner spec
 * 2026-07-29): Spectrum Analyzer, Spectrogram, and the ⭐ Waterfall (CSD).
 * NO Skia here — the spectral renderers load only via skiaGate.
 * requireVizSpectral(); pre-Skia clients get the honest VizUnavailableCard
 * while every chip, slider, readout and check question still works.
 *
 * CHARTER (anti-misconception):
 *  • M5 — a spectrum is read as a SHAPE (where is the energy, smooth or
 *    spiky, what sticks up) — never bin-by-bin.
 *  • M6 — AXES FIRST: time →, frequency ↑, color = level. The #1 error is
 *    reading a spectrogram like a waveform (up ≠ loud).
 *  • M7 — level and decay are DIFFERENT AXES: EQ changes level (Y); only
 *    damping/treatment shortens ring time (Z). Taller ≠ longer.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { MeterModuleProps } from '../MeterModuleScreen';
import { Badge, MythReality, PanelCard, ReadoutGrid, dstyles } from '../../digital/bits';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { LabChip, CollapsibleSection } from '../../LabShell';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import { requireVizSpectral, type VizSpectralModule } from '../skiaGate';
import {
  SPECTRUM_LABELS,
  type SpectrumKey,
  spectrumDb,
  SPECTROGRAM_LABELS,
  type SpectrogramKey,
  type WaterfallOpts,
  ROOM_LABELS,
  type RoomKey,
  type ReverbKey,
  waterfallRt,
} from '../meterEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Shared pure helpers (no Skia — safe on every client)


function fmtHz(f: number): string {
  return f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1)} kHz` : `${Math.round(f)} Hz`;
}

/** Scan the teaching spectrum over log-spaced points: peak + fitted tilt. */
function scanSpectrum(key: SpectrumKey): { peakF: number; peakDb: number; tiltDbOct: number } {
  const N = 480;
  const lgLo = Math.log10(20);
  const lgHi = Math.log10(20000);
  let peakF = 20;
  let peakDb = Number.NEGATIVE_INFINITY;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < N; i++) {
    const f = Math.pow(10, lgLo + ((lgHi - lgLo) * i) / (N - 1));
    const v = spectrumDb(key, f);
    if (v > peakDb) {
      peakDb = v;
      peakF = f;
    }
    const oct = Math.log2(f); // regression vs octaves → slope is dB/oct
    sx += oct;
    sy += v;
    sxx += oct * oct;
    sxy += oct * v;
  }
  const tilt = (N * sxy - sx * sy) / (N * sxx - sx * sx);
  return { peakF, peakDb, tiltDbOct: tilt };
}

/** Slowest-decaying frequency vs the median of the range — the ridge verdict. */
function ridgeVerdict(opts: WaterfallOpts): { f: number; ratio: number } {
  const N = 240;
  const lgLo = Math.log10(40);
  const lgHi = Math.log10(12000);
  const rts: number[] = [];
  let fMax = 40;
  let rtMax = 0;
  for (let i = 0; i < N; i++) {
    const f = Math.pow(10, lgLo + ((lgHi - lgLo) * i) / (N - 1));
    const rt = waterfallRt(opts, f);
    rts.push(rt);
    if (rt > rtMax) {
      rtMax = rt;
      fMax = f;
    }
  }
  const sorted = [...rts].sort((a, b) => a - b);
  const median = sorted[Math.floor(N / 2)];
  return { f: fMax, ratio: rtMax / Math.max(0.01, median) };
}

function dampingLabel(d: number): string {
  return d < 0.25 ? 'CONCRETE' : d < 0.5 ? 'CURTAINS' : d < 0.75 ? 'CARPET' : 'PANELS';
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI bits

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

function CommonMistakes({ items }: { items: string[] }) {
  return (
    <View style={styles.mistakesCard}>
      <Text style={styles.mistakesTitle}>COMMON MISTAKES</Text>
      {items.map((m, i) => (
        <View key={i} style={styles.mistakeRow}>
          <Text style={styles.mistakeX}>✗</Text>
          <Text style={styles.mistakeText}>{m}</Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skia-gated viz children. Each is rendered ONLY when viz ≠ null and stays
// mounted from then on, so the viz.usePhaseClock hook order is stable.

function SpectrumViz({ viz, width, pattern, running }: { viz: VizSpectralModule; width: number; pattern: SpectrumKey; running: boolean }) {
  // Gentle bar shimmer — the live-analyzer feel without pretending to measure.
  const phase = viz.usePhaseClock(running, 1.1);
  return <viz.SpectrumPatternView width={width} pattern={pattern} phase={phase} />;
}

function SpectrogramViz({ viz, width, pattern, running, mode }: { viz: VizSpectralModule; width: number; pattern: SpectrogramKey; running: boolean; mode: 'scroll' | 'snapshot' }) {
  // 0.2 Hz → an exactly 5-second loop (owner 2026-08-05): scroll mode rolls
  // the last 5 s off to the left; snapshot shows the full 5 s at once.
  const phase = viz.usePhaseClock(running, 0.2);
  return <viz.SpectrogramPatternView width={width} pattern={pattern} phase={phase} mode={mode} />;
}

function WaterfallViz({ viz, width, opts, running }: { viz: VizSpectralModule; width: number; opts: WaterfallOpts; running: boolean }) {
  // Build-then-collapse loop clock — REAL-TIME (owner 2026-08-05): the ridge
  // crosses each 1-second floor marker at one real second.
  const phase = viz.usePhaseClock(running, viz.WATERFALL_REALTIME_HZ);
  return <viz.WaterfallView width={width} height={330} opts={opts} phase={phase} animate />;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 — SPECTRUM ANALYZER: what does this shape tell me?

const SPECTRUM_KEYS = Object.keys(SPECTRUM_LABELS) as SpectrumKey[];

const SPECTRUM_CAPTIONS: Record<SpectrumKey, string> = {
  speech:
    'Speech: two-three FORMANT HUMPS between ~200 Hz and 3 kHz — the vowel resonances of the vocal tract — with a fast rolloff above. Energy centered low-mid; almost nothing up top.',
  cymbal:
    'Cymbal: a dense HIGH-FREQUENCY WASH — energy piled from ~3 kHz upward, ragged on top, very little below 800 Hz. When the right side of the display lights up, think metal.',
  kick:
    'Kick drum: an LF MOUND around 50–80 Hz plus a small CLICK bump near 3 kHz (the beater). Two energy centers with a valley between — thump and attack are different frequencies.',
  guitar:
    'Guitar: a HARMONIC COMB — evenly spaced spikes at multiples of the ~196 Hz fundamental, each lower than the last. Spiky but ORDERLY = a pitched instrument.',
  hum: 'Mains hum: NEEDLE spikes at exact multiples of the mains frequency (60, 120, 180, 240 Hz…). A steady FAMILY of thin spikes locked to the power grid — never just one.',
  feedback:
    'Feedback: ONE towering narrow spike (here near 1.7–1.8 kHz) and nothing else notable. A single spike that GROWS over time is the PA about to scream — act before it does.',
  pinknoise:
    'Pink noise: a smooth −3 dB/octave RAMP, falling evenly left to right on a log display. The reference tilt — finished mixes usually sit near it, not flat.',
};

const LOOK_FOR = [
  'WHERE is the energy centered? Left = lows (kick, rumble, hum), middle = voices and instruments, right = air and metal.',
  'Is the shape SMOOTH or SPIKY? Smooth = noise-like (pink noise, cymbal wash); orderly spikes = pitched harmonics; lone needles = tones.',
  'What STICKS UP that shouldn’t? A spike family at mains multiples = hum. ONE towering spike — especially one that grows — = feedback.',
];

const CHECK_SPECTRUM_ID: CheckSpec = {
  question:
    'Soundcheck. The analyzer shows a single NARROW spike at 1.7 kHz — and it is slowly GROWING while the rest of the curve holds still. What are you looking at?',
  options: [
    'Feedback building at 1.7 kHz — ring it out or move the mic before it screams',
    'Mains hum leaking in from the power grid',
    'The kick drum’s click bump',
    'Pink noise from the PA',
  ],
  correctIdx: 0,
  reveal:
    'ONE towering narrow spike that grows over time is the feedback signature. Hum would be a FAMILY of spikes locked to 60/120/180 Hz; a kick click is broad and rhythm-locked; pink noise is a smooth ramp. Notch 1.7 kHz or change the mic/speaker geometry NOW.',
  wrongHint: 'Count the spikes and watch the clock: how many are there, and is it growing?',
};

const CHECK_HUM_VS_FEEDBACK: CheckSpec = {
  question: 'Mains hum and feedback both draw thin spikes. Which pair of tells separates them?',
  options: [
    'Hum = SEVERAL spikes at exact mains multiples (60, 120, 180 Hz…), steady; feedback = ONE spike anywhere in the band, growing',
    'Hum = one spike high in the band; feedback = many spikes down low',
    'Hum grows over time; feedback holds perfectly steady',
    'They look identical — only listening can separate them',
  ],
  correctIdx: 0,
  reveal:
    'Hum is locked to the power grid: a steady family at exact multiples of the mains frequency, always in the same place. Feedback is a single spike that can appear ANYWHERE the loop gain passes unity — and it grows. Count the spikes, check the frequencies, watch the trend.',
  wrongHint: 'One of them is locked to the power grid; the other appears anywhere — and grows.',
};

const SPECTRUM_MISTAKES = [
  'Calling a single towering spike "hum" — hum is a FAMILY of spikes at exact mains multiples; feedback is ONE spike, usually growing.',
  'Expecting a good mix to read FLAT — program material naturally tilts down toward pink (≈ −3 dB/oct); flat-to-the-right energy sounds harsh.',
  'Chasing every wiggle — an analyzer dances constantly; read the SHAPE (where the energy centers, smooth vs spiky), not individual bins.',
  'Forgetting the frequency axis is LOGARITHMIC — each equal step is an octave, not a fixed number of Hz.',
];

export function SpectrumModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizSpectral())[0];
  const [pattern, setPattern] = useState<SpectrumKey>('speech');
  const scan = useMemo(() => scanSpectrum(pattern), [pattern]);

  return (
    <View style={styles.stack}>
      <PanelCard>
        <SectionHead title="SPECTRUM — WHAT DOES THIS SHAPE TELL ME?" onHelp={() => p.help('spectrum_read')} />
        <Text style={dstyles.body}>
          A spectrum analyzer answers one question: what does this SHAPE mean? Left = lows, right = highs, height = energy.
          Seven shapes cover most of what you will ever see on a stage or in a mix — tap through them until each tell is
          instant.
        </Text>
        {viz ? <SpectrumViz viz={viz} width={p.width} pattern={pattern} running={p.focused} /> : <VizUnavailableCard />}
        <DisplayGuideButton onPress={() => p.help('spectrum_read')} />
        <View style={dstyles.chipRow}>
          {SPECTRUM_KEYS.map((k) => (
            <LabChip
              key={k}
              label={SPECTRUM_LABELS[k].toUpperCase()}
              selected={pattern === k}
              onPress={() => setPattern(k)}
              onLongPress={() => p.help('spectral_patterns')}
            />
          ))}
        </View>
        <Text style={dstyles.caption}>{SPECTRUM_CAPTIONS[pattern]}</Text>
        <ReadoutGrid
          help={p.help}
          helpKey="spectrum_read"
          items={[
            { k: 'PEAK FREQ', v: fmtHz(scan.peakF) },
            { k: 'PEAK LEVEL', v: `${scan.peakDb.toFixed(1)} dB (rel)` },
            { k: 'SPECTRAL TILT', v: `${scan.tiltDbOct >= 0 ? '+' : ''}${scan.tiltDbOct.toFixed(1)} dB/oct` },
          ]}
        />
      </PanelCard>

      <CollapsibleSection title="WHAT TO LOOK FOR" onHelp={() => p.help('spectrum_read')}>
        <Text style={dstyles.body}>Three questions decode any spectrum:</Text>
        {LOOK_FOR.map((q, i) => (
          <View key={i} style={styles.lookRow}>
            <Text style={styles.lookNum}>{i + 1}</Text>
            <Text style={[dstyles.body, { flex: 1 }]}>{q}</Text>
          </View>
        ))}
      </CollapsibleSection>

      <CommonMistakes items={SPECTRUM_MISTAKES} />
      <CheckQuestion spec={CHECK_SPECTRUM_ID} />
      <CheckQuestion spec={CHECK_HUM_VS_FEEDBACK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — SPECTROGRAM: the most misunderstood display, decoded

const SPECTROGRAM_KEYS = Object.keys(SPECTROGRAM_LABELS) as SpectrogramKey[];

const SPECTROGRAM_CAPTIONS: Record<SpectrogramKey, string> = {
  speech:
    'Speech: stacked horizontal FORMANT BANDS that jump with each syllable, with fine PITCH STRIATIONS underneath. Syllables read as bursts marching left → right.',
  birdsong:
    'Birdsong: thin CHIRP SWEEPS — lines that rise and fall quickly. A line with SLOPE means the pitch itself is moving.',
  cymbal:
    'Cymbal decay: a bright high-frequency WASH at the hit that FADES toward the right — decay reads as brightness dying along the time axis.',
  feedback:
    'Feedback: ONE horizontal line getting BRIGHTER as it runs right — same pitch, growing level. The growth is the danger sign.',
  whistle: 'Whistle: one THIN, STEADY horizontal line at constant brightness. Pure tone, stable level — nothing to fix.',
  whitenoise: 'White noise: uniform CONFETTI — every time and every frequency lit about the same. No structure = noise.',
};

const CHECK_SGRAM_AXES: CheckSpec = {
  question: 'On a spectrogram, where is FREQUENCY?',
  options: [
    'The VERTICAL axis — low pitches at the bottom, high at the top',
    'The horizontal axis — it sweeps left to right',
    'The color — brighter means higher-pitched',
    'Spectrograms don’t show frequency',
  ],
  correctIdx: 0,
  reveal:
    'Time →, frequency ↑, level = color. A spectrogram is a spectrum FILMED over time — not a waveform, so height means PITCH, never loudness. Loudness is the brightness.',
  wrongHint: 'It is a spectrum filmed over time — which way does the film run?',
};

const CHECK_WHISTLE_VS_FEEDBACK: CheckSpec = {
  question:
    'Two thin horizontal lines on the spectrogram: one holds steady brightness, the other keeps getting brighter. Which is which — and what do you DO?',
  options: [
    'Steady = whistle (it’s the performance — leave it); growing = feedback (pull the gain or notch that frequency NOW)',
    'Steady = feedback (notch it); growing = whistle (leave it)',
    'Both are feedback — mute the monitors',
    'Both are whistles — nothing to do',
  ],
  correctIdx: 0,
  reveal:
    'A steady thin line is a stable tone — a whistle, a synth, a flute: part of the sound. A line that GROWS is a loop feeding itself: feedback. The display tells you the frequency to notch and the trend tells you how long you have.',
  wrongHint: 'Stable level = source. Growing level = a loop feeding itself.',
};

const SPECTROGRAM_MISTAKES = [
  'Reading it like a waveform — on a spectrogram UP means HIGH-PITCHED, not loud; loudness is the COLOR. This is the #1 error.',
  'Calling every bright thin line "feedback" — check whether it GROWS. A steady line is just a tone (whistle, synth, mains whine).',
  'Expecting a drum hit to be tall — a transient is a thin VERTICAL stripe (all frequencies at one instant), not a peak.',
  'Comparing colors across different apps — the level→color mapping is relative to each display’s own scale.',
];

export function SpectrogramModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizSpectral())[0];
  const [pattern, setPattern] = useState<SpectrogramKey>('speech');
  // ELAPSED TIME (scrolling — the real-world behavior) vs SNAPSHOT (the full
  // 5 s picture at once, for comparing the complete pattern). Owner 2026-08-05.
  const [snapshot, setSnapshot] = useState(false);

  return (
    <View style={styles.stack}>
      {/* AXES FIRST — before any pattern. The whole module hinges on this. */}
      <CollapsibleSection title="READ THE AXES FIRST" onHelp={() => p.help('spectrogram_axes')}>
        <Text style={dstyles.body}>
          Time runs HORIZONTAL — the newest moment is at the RIGHT edge and older sound scrolls off to
          the LEFT. Frequency runs VERTICAL (low at the bottom, high at the top). Loudness is the
          COLOR — brighter = louder. The #1 error in all of metering is reading a spectrogram like a
          waveform, where up means loud. Here, up means HIGH-PITCHED.
        </Text>
        <ReadoutGrid
          help={p.help}
          helpKey="spectrogram_axes"
          items={[
            { k: 'TIME', v: 'new → right' },
            { k: 'FREQUENCY', v: '↑ up' },
            { k: 'LEVEL', v: '= color' },
          ]}
        />
      </CollapsibleSection>

      <PanelCard>
        <SectionHead title="PATTERN LIBRARY" onHelp={() => p.help('spectrogram_patterns')} />
        <Text style={dstyles.body}>
          Six sounds, filmed over time. Learn how each one PAINTS and you can identify a sound from the picture alone.
        </Text>
        {viz ? (
          <SpectrogramViz viz={viz} width={p.width} pattern={pattern} running={p.focused} mode={snapshot ? 'snapshot' : 'scroll'} />
        ) : (
          <VizUnavailableCard />
        )}
        <DisplayGuideButton onPress={() => p.help('spectrogram_axes')} />
        {/* ELAPSED TIME = real-world scrolling (new at the right, rolls left);
            SNAPSHOT = the full 5 s picture at once for comparison. */}
        <View style={dstyles.chipRow}>
          <LabChip
            label="ELAPSED TIME"
            selected={!snapshot}
            onPress={() => setSnapshot(false)}
            onLongPress={() => p.help('spectrogram_axes')}
          />
          <LabChip
            label="SNAPSHOT — FULL 5 s"
            selected={snapshot}
            onPress={() => setSnapshot(true)}
            onLongPress={() => p.help('spectrogram_axes')}
          />
        </View>
        <View style={dstyles.chipRow}>
          {SPECTROGRAM_KEYS.map((k) => (
            <LabChip
              key={k}
              label={SPECTROGRAM_LABELS[k].toUpperCase()}
              selected={pattern === k}
              onPress={() => setPattern(k)}
              onLongPress={() => p.help('spectrogram_patterns')}
            />
          ))}
        </View>
        <Text style={dstyles.caption}>{SPECTROGRAM_CAPTIONS[pattern]}</Text>
      </PanelCard>

      <CommonMistakes items={SPECTROGRAM_MISTAKES} />
      <CheckQuestion spec={CHECK_SGRAM_AXES} />
      <CheckQuestion spec={CHECK_WHISTLE_VS_FEEDBACK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 7 ⭐ — WATERFALL (CSD): the mountain range that collapses

const ROOM_KEYS = Object.keys(ROOM_LABELS) as RoomKey[];
const REVERB_KEYS: ReverbKey[] = ['none', 'room', 'plate', 'hall', 'spring'];
const REVERB_LABELS: Record<ReverbKey, string> = {
  none: 'None',
  room: 'Room',
  plate: 'Plate',
  hall: 'Hall',
  spring: 'Spring',
};

/** The field guide — each sub-section names a real-world read of the display. */
const FIELD_GUIDE: { title: string; helpKey: string; caption: string }[] = [
  {
    title: 'ROOM RESONANCES',
    helpKey: 'room_ring',
    caption:
      'Pick CLASSROOM. Every ridge collapses quickly — except 250 Hz, still standing far behind the front. That frequency is RINGING: the room stores and releases energy there long after everything else has died.',
  },
  {
    title: 'SPEAKER PROBLEMS',
    helpKey: 'waterfall_decay',
    caption:
      'A resonant driver or cabinet draws the same signature: ONE slow-decay ridge among fast neighbors. Healthy gear collapses evenly; anything still standing while its neighbors are gone is ringing.',
  },
  {
    title: 'DAMPING',
    helpKey: 'damping',
    caption:
      'Drag the slider from CONCRETE toward PANELS and watch the mountain’s tail shorten — HIGHS first (porous absorbers eat them easily), LOWS last (they need thickness). This is why bass traps are thick.',
  },
  {
    title: 'COMPARE ROOMS',
    helpKey: 'room_ring',
    caption:
      'CATHEDRAL: the whole range rings for seconds, lows longest. STUDIO: everything collapses almost immediately. THEATER sits between; LIVING ROOM adds a low ring near 110 Hz. Same axes, wildly different mountains.',
  },
  {
    title: 'EQ EFFECTS',
    helpKey: 'eq_ridge',
    caption:
      'Boost 250 Hz +12 dB: the mountain grows TALLER there — but not LONGER. Taller ≠ longer: level (Y) and decay (Z) are different axes. Now cut −12 and watch the ridge sink while keeping its length.',
  },
  {
    title: 'RINGING FILTERS',
    helpKey: 'eq_ridge',
    caption:
      'Switch HIGH-Q RING on: a needle-thin ridge appears at 1.2 kHz and LINGERS far behind its neighbors. High-Q filters store energy — the filter itself rings, which is why surgical boosts can sound "resonant".',
  },
  {
    title: 'REVERB TAILS',
    helpKey: 'reverb_tails',
    caption:
      'Flip through the reverbs and read the tails: ROOM = short warm slope · PLATE = long bright even sheet · HALL = long with lows outlasting highs · SPRING = narrow bouncy ridges. You can name the reverb from the mountain alone.',
  },
];

const CHECK_Z_AXIS: CheckSpec = {
  question: 'In the waterfall (CSD), what is the Z axis — the direction the ridges recede into the picture?',
  options: [
    'TIME — each ridge behind the front is the spectrum a moment later',
    'Phase',
    'A second frequency axis for harmonics',
    'Stereo width',
  ],
  correctIdx: 0,
  reveal:
    'X = frequency across, Y = amplitude up, Z = time receding. The front edge is "now"; the range behind it is history decaying. The mountain range collapsing IS decay.',
  wrongHint: 'The front edge is "now" — what is everything behind it?',
};

const CHECK_RIDGE_FIX: CheckSpec = {
  question:
    'The classroom’s 250 Hz ridge stretches far behind while its neighbors die fast. What actually SHORTENS that ring?',
  options: [
    'Acoustic treatment/damping — absorb the stored energy (EQ only changes the ridge’s LEVEL)',
    'An EQ cut at 250 Hz — less level means less ring time',
    'Boosting the rest of the range so the ridge stands out less',
    'A shorter reverb preset on the vocal',
  ],
  correctIdx: 0,
  reveal:
    'EQ moves the ridge up and down (level); the room keeps storing and releasing energy at 250 Hz for just as long. Only absorption — damping, treatment, bass trapping — shortens the DECAY. The waterfall shows both axes separately, which is exactly why it exists.',
  wrongHint: 'Try the EQ slider in this module: the mountain gets taller or shorter — does it get LONGER or SHORTER into the picture?',
};

const WATERFALL_MISTAKES = [
  'EQ-cutting a ringing frequency and calling it fixed — the mountain gets SHORTER (level), not SHORTER-LIVED (decay).',
  'Reading a TALLER ridge as a LONGER ring — height is level at time zero; length into the picture is decay time. Different axes.',
  'Quoting one RT60 number for a room — decay is frequency-dependent: the classroom is fine at 1 kHz and ringing at 250 Hz.',
  'Blaming the room for a ridge that follows the SPEAKER around — a resonant driver or cabinet rings the same way: one slow ridge among fast neighbors.',
];

export function WaterfallModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizSpectral())[0];
  const [room, setRoom] = useState<RoomKey>('classroom');
  const [damping01, setDamping01] = useState(0.15);
  const [eqBoostDb, setEqBoostDb] = useState(0);
  const [qRing, setQRing] = useState(false);
  const [reverb, setReverb] = useState<ReverbKey>('none');

  const opts = useMemo<WaterfallOpts>(
    () => ({ room, damping01, eqBoostDb, qRing, reverb }),
    [room, damping01, eqBoostDb, qRing, reverb],
  );
  const rt = useMemo(
    () => ({
      r125: waterfallRt(opts, 125),
      r250: waterfallRt(opts, 250),
      r1k: waterfallRt(opts, 1000),
      r4k: waterfallRt(opts, 4000),
      ...ridgeVerdict(opts),
    }),
    [opts],
  );
  const ringing = rt.ratio >= 1.6;

  return (
    <View style={styles.stack}>
      {/* AXES FIRST — three axes, and Z is the one nobody expects. */}
      <CollapsibleSection title="THE WATERFALL — READ THE AXES FIRST" onHelp={() => p.help('waterfall_axes')}>
        <Text style={dstyles.body}>
          X = frequency across. Y = amplitude up. Z = TIME stepping TOWARD you: the loud start
          (t = 0) stands tall at the BACK, and each later instant steps down toward the front —
          the decay cascades toward the viewer, and the white floor bands mark each second going
          by. The mountain range collapsing toward you IS decay — watch it once and RT60 stops
          being an abstract number.
        </Text>
        <ReadoutGrid
          help={p.help}
          helpKey="waterfall_axes"
          items={[
            { k: 'X — ACROSS', v: 'frequency' },
            { k: 'Y — UP', v: 'amplitude' },
            { k: 'Z — TOWARD YOU', v: 'time (t=0 at back)' },
          ]}
        />
      </CollapsibleSection>

      <PanelCard>
        <SectionHead title="BUILD A SCENE — THEN WATCH IT COLLAPSE" onHelp={() => p.help('waterfall_decay')} />
        {viz ? <WaterfallViz viz={viz} width={p.width} opts={opts} running={p.focused} /> : <VizUnavailableCard />}
        <DisplayGuideButton onPress={() => p.help('waterfall_axes')} />

        <Text style={styles.groupLabel}>ROOM</Text>
        <View style={dstyles.chipRow}>
          {ROOM_KEYS.map((k) => (
            <LabChip
              key={k}
              label={ROOM_LABELS[k].toUpperCase()}
              selected={room === k}
              onPress={() => setRoom(k)}
              onLongPress={() => p.help('room_ring')}
            />
          ))}
        </View>

        <DragSlider
          value={damping01}
          onChange={setDamping01}
          label="DAMPING · CONCRETE → CURTAINS → CARPET → PANELS"
          readout={`${dampingLabel(damping01)} · ${Math.round(damping01 * 100)}%`}
          onHelp={() => p.help('damping')}
        />
        <DragSlider
          value={(eqBoostDb + 12) / 24}
          onChange={(v) => setEqBoostDb(Math.round(-12 + v * 24))}
          label="EQ · 250 Hz BOOST"
          readout={`${eqBoostDb >= 0 ? '+' : '−'}${Math.abs(eqBoostDb)} dB @ 250 Hz`}
          onHelp={() => p.help('eq_ridge')}
        />

        <Text style={styles.groupLabel}>FILTER · REVERB</Text>
        <View style={dstyles.chipRow}>
          <LabChip
            label="HIGH-Q RING"
            selected={qRing}
            onPress={() => setQRing(!qRing)}
            onLongPress={() => p.help('eq_ridge')}
          />
          {REVERB_KEYS.map((k) => (
            <LabChip
              key={k}
              label={REVERB_LABELS[k].toUpperCase()}
              selected={reverb === k}
              onPress={() => setReverb(k)}
              onLongPress={() => p.help('reverb_tails')}
            />
          ))}
        </View>

        <ReadoutGrid
          help={p.help}
          helpKey="waterfall_decay"
          items={[
            { k: 'RT60 · 125 Hz', v: `${rt.r125.toFixed(2)} s` },
            { k: 'RT60 · 250 Hz', v: `${rt.r250.toFixed(2)} s` },
            { k: 'RT60 · 1 kHz', v: `${rt.r1k.toFixed(2)} s` },
            { k: 'RT60 · 4 kHz', v: `${rt.r4k.toFixed(2)} s` },
            { k: 'RIDGE', v: ringing ? fmtHz(rt.f) : 'none' },
            { k: 'VS MEDIAN', v: ringing ? `${rt.ratio.toFixed(1)}× longer` : 'even decay' },
          ]}
        />
        <Text style={dstyles.caption}>
          {ringing
            ? `${fmtHz(rt.f)} decays ${rt.ratio.toFixed(1)}× slower than the median of the range — that ridge is RINGING.`
            : 'Even decay across the range — nothing rings. Pick CLASSROOM or flip HIGH-Q RING to plant a ridge.'}
        </Text>
      </PanelCard>

      <CollapsibleSection title="FIELD GUIDE — WHAT TO TRY">
        {FIELD_GUIDE.map((s) => (
          <View key={s.title} style={styles.fieldSection}>
            <SectionHead title={s.title} onHelp={() => p.help(s.helpKey)} />
            <Text style={dstyles.caption}>{s.caption}</Text>
          </View>
        ))}
      </CollapsibleSection>

      <MythReality
        myth="EQ-cutting a ringing frequency shortens its decay."
        reality="EQ changes LEVEL; only damping/treatment shortens RING TIME — the waterfall shows both axes separately."
      />

      <CommonMistakes items={WATERFALL_MISTAKES} />
      <CheckQuestion spec={CHECK_Z_AXIS} />
      <CheckQuestion spec={CHECK_RIDGE_FIX} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stack: { gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  info: { color: colors.amber, fontSize: 13, marginTop: 5 },
  groupLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary, marginTop: 2 },

  lookRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  lookNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, width: 14, textAlign: 'center', marginTop: 2 },

  fieldSection: { gap: 4 },

  mistakesCard: {
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a2626',
    backgroundColor: '#151011',
    padding: 12,
  },
  mistakesTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#ff6b5e' },
  mistakeRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  mistakeX: { fontFamily: fonts.barlowMedium, fontSize: 13, color: '#ff6b5e', marginTop: 1 },
  mistakeText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
