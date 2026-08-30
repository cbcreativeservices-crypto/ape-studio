/**
 * meter/modMeterB — Modules 5–7 of the Visual Audio Analysis Lab (owner spec
 * 2026-07-29): Spectrum Analyzer, Spectrogram, and the Waterfall (CSD).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): each module renders the RackUnit
 * frame ITSELF (MeterModuleScreen gives rack modules the full height, no host
 * ScrollView). The analyzer glass PINS on the stage with the honesty line as
 * its badge (these draw meterEngine's deterministic SYNTHETIC teaching
 * patterns — never measurements); live numbers read on the bezel; every
 * setting rides the dock (faders bind the shared lane, pattern/room/reverb
 * collections open STICKY trays so you A/B while the glass reacts). Only the
 * teaching prose, mistakes and check questions scroll — the well carries its
 * own guided-lesson entry row. Law: reading may scroll; operating may not.
 *
 * NO Skia here — the spectral renderers load only via skiaGate.
 * requireVizSpectral(); pre-Skia clients get the honest VizUnavailableCard in
 * the glass while every dock control, bezel readout and check question still
 * works.
 *
 * CHARTER (anti-misconception):
 *  • M5 — a spectrum is read as a SHAPE (where is the energy, smooth or
 *    spiky, what sticks up) — never bin-by-bin.
 *  • M6 — AXES FIRST: time →, frequency ↑, color = level. The #1 error is
 *    reading a spectrogram like a waveform (up ≠ loud). The axes are printed
 *    permanently on the bezel.
 *  • M7 — level and decay are DIFFERENT AXES: EQ changes level (Y); only
 *    damping/treatment shortens ring time (Z). Taller ≠ longer. DAMPING is
 *    the pre-bound lane; RT·125 vs RT·4k on the bezel shows highs die first.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { MeterModuleProps } from '../MeterModuleScreen';
import { MythReality, ReadoutGrid, dstyles } from '../../digital/bits';
import { CheckQuestion, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { CollapsibleSection } from '../../LabShell';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
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
  waterfallRidge,
  RIDGE_CALLOUT_RATIO,
  EQ_FILTERS,
  EQ_FILTER_BY_KEY,
  type EqFilterKey,
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

/** How close the EQ's centre must sit to the ringing ridge before the lane is
 *  tinted — about a sixth of an octave either side. The frequency itself now
 *  comes from the CHOSEN filter, not a constant. */
const EQ_ON_RIDGE_OCT = 0.17;

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

/** The well's guided-lesson entry row — rack modules own their well, so each
 *  carries the row the host ScrollView used to append (MeterModuleScreen
 *  lessonRow styling copied locally; owner 2026-07-29, LabShell v2). */
function LessonRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.lessonRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open the guided lesson"
    >
      <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
    </Pressable>
  );
}

/** Honest fallback INSIDE the glass for pre-Skia clients (skiaGate rule). */
function GlassFallback({ w, h }: { w: number; h: number }) {
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', padding: 10 }}>
      <VizUnavailableCard />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skia-gated viz children. Each is rendered ONLY when viz ≠ null and stays
// mounted from then on, so the viz.usePhaseClock hook order is stable. All are
// height-parametric — they consume whatever glass the rack grants at mount
// (RackUnit guarantees the height never changes mid-interaction).

function SpectrumViz({ viz, width, height, pattern, running }: { viz: VizSpectralModule; width: number; height: number; pattern: SpectrumKey; running: boolean }) {
  // Gentle bar shimmer — the live-analyzer feel without pretending to measure.
  const phase = viz.usePhaseClock(running, 1.1);
  return <viz.SpectrumPatternView width={width} height={height} pattern={pattern} phase={phase} />;
}

function SpectrogramViz({ viz, width, height, pattern, running, mode }: { viz: VizSpectralModule; width: number; height: number; pattern: SpectrogramKey; running: boolean; mode: 'scroll' | 'snapshot' }) {
  // 0.2 Hz → an exactly 5-second loop (owner 2026-08-05): scroll mode rolls
  // the last 5 s off to the left; snapshot shows the full 5 s at once.
  const phase = viz.usePhaseClock(running, 0.2);
  return <viz.SpectrogramPatternView width={width} height={height} pattern={pattern} phase={phase} mode={mode} />;
}

function WaterfallViz({ viz, width, height, opts, running, replay }: { viz: VizSpectralModule; width: number; height: number; opts: WaterfallOpts; running: boolean; replay: number }) {
  // Build clock — REAL-TIME (owner 2026-08-05): the ridge crosses each floor
  // marker at that many real seconds. The rate depends on the SCENE, because
  // the plot's time window is fitted to the room's own decay.
  //
  // It builds ONCE and holds (owner 2026-08-30) — `replay` restarts it, and
  // changing the scene restarts it too, so a new room always plays from the
  // impulse rather than appearing mid-decay.
  const phase = viz.usePhaseClock(running, viz.waterfallRealtimeHz(opts), replay);
  return <viz.WaterfallView width={width} height={height} opts={opts} phase={phase} animate />;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 — SPECTRUM ANALYZER: what does this shape tell me?

const SPECTRUM_KEYS = Object.keys(SPECTRUM_LABELS) as SpectrumKey[];
/** Tray blurbs (owner 2026-08-28): what each pattern looks like on the analyzer
 *  and why you would recognise it — readable inside the open tray. */
const SPECTRUM_BLURBS: Record<SpectrumKey, string> = {
  speech: 'Energy bunched between roughly 200 Hz and 3 kHz — the vocal formants — with almost nothing above 4 kHz.',
  cymbal: 'Nearly all the energy ABOVE 2 kHz: a jagged wash of high partials with an empty low end.',
  kick: 'A tall low bump near 60 Hz plus a small beater click around 3 kHz — weight below, definition above.',
  guitar: 'A comb of evenly spaced spikes: the harmonics of one played note, each a multiple of the fundamental.',
  hum: 'Thin spikes at 60 Hz and its multiples — the electrical signature. If you see this, chase grounding and cables, not EQ.',
  feedback: 'One violently tall, narrow spike: a single frequency running away. Find it here, then pull that frequency down.',
  pinknoise: 'Equal energy per octave — a straight downward slope on this log display. The calibration reference.',
};

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

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: SPECTRUM_LABELS[pattern].toUpperCase(),
      options: SPECTRUM_KEYS.map((k) => ({ id: k, label: SPECTRUM_LABELS[k].toUpperCase(), blurb: SPECTRUM_BLURBS[k] })),
      selectedId: pattern,
      onSelect: (id) => setPattern(id as SpectrumKey),
      // Teaching collection: the tray STAYS OPEN so you A/B shapes while the
      // analyzer redraws — learning the tells IS the lesson.
      sticky: true,
      helpKey: 'spectral_patterns',
    },
  ];

  return (
    <RackUnit
      initialParam="pattern"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the shape IS the lesson
        badge: 'SYNTHETIC TEACHING PATTERNS — ANALYTIC, NOT A MEASUREMENT',
        onGuide: () => p.help('spectrum_read'),
        bezel: [
          { k: 'PATTERN', v: SPECTRUM_LABELS[pattern].toUpperCase(), helpKey: 'spectral_patterns', flex: 1.4 },
          { k: 'PEAK', v: fmtHz(scan.peakF), helpKey: 'spectrum_read' },
          { k: 'LEVEL', v: `${scan.peakDb.toFixed(1)} dB rel`, helpKey: 'spectrum_read' },
          { k: 'TILT', v: `${scan.tiltDbOct >= 0 ? '+' : ''}${scan.tiltDbOct.toFixed(1)}/oct`, helpKey: 'spectrum_read' },
        ],
        render: (w, h) =>
          viz ? (
            <SpectrumViz viz={viz} width={w} height={h} pattern={pattern} running={p.focused} />
          ) : (
            <GlassFallback w={w} h={h} />
          ),
      }}
    >
      <View style={styles.stack}>
        <Text style={dstyles.body}>
          A spectrum analyzer answers one question: what does this SHAPE mean? Left = lows, right = highs, height = energy.
          Seven shapes cover most of what you will ever see on a stage or in a mix — open PATTERN and tap through them
          until each tell is instant.
        </Text>
        <Text style={dstyles.caption}>{SPECTRUM_CAPTIONS[pattern]}</Text>

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
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — SPECTROGRAM: the most misunderstood display, decoded

const SPECTROGRAM_KEYS = Object.keys(SPECTROGRAM_LABELS) as SpectrogramKey[];
const SPECTROGRAM_BLURBS: Record<SpectrogramKey, string> = {
  speech: 'Syllable bursts painted as striped bands — the formants — with pitch striations underneath. The fingerprint reading of talking.',
  birdsong: 'Short rising chirps: thin lines that sweep upward, high in the band, with silence between them.',
  cymbal: 'A bright splash lighting the whole top of the band, then fading — decay drawn over time.',
  feedback: 'A single horizontal line that grows hotter and hotter: one frequency building second by second. Kill it before it howls.',
  whistle: 'One thin wavering line — a pure tone with a little vibrato. The simplest picture a spectrogram can draw.',
  whitenoise: 'The entire band lit at once, flat and constant — energy everywhere, structure nowhere.',
};

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

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: SPECTROGRAM_LABELS[pattern].toUpperCase(),
      options: SPECTROGRAM_KEYS.map((k) => ({ id: k, label: SPECTROGRAM_LABELS[k].toUpperCase(), blurb: SPECTROGRAM_BLURBS[k] })),
      selectedId: pattern,
      onSelect: (id) => setPattern(id as SpectrogramKey),
      sticky: true, // A/B how each sound PAINTS while the film keeps rolling
      helpKey: 'spectrogram_patterns',
    },
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: snapshot ? 'SNAP 5s' : 'ELAPSED',
      options: [
        { id: 'scroll', label: 'ELAPSED TIME', blurb: 'The picture slides left as new sound arrives at the right edge — a chart recorder. NOW is always the right edge.' },
        { id: 'snapshot', label: 'SNAPSHOT — FULL 5 s', blurb: 'The whole 5 seconds laid out at once, frozen — read it left to right like a page.' },
      ],
      selectedId: snapshot ? 'snapshot' : 'scroll',
      onSelect: (id) => setSnapshot(id === 'snapshot'),
      sticky: true,
      helpKey: 'spectrogram_axes',
    },
  ];

  return (
    <RackUnit
      initialParam="pattern"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'SYNTHETIC TEACHING PATTERNS — ANALYTIC, NOT A MEASUREMENT',
        onGuide: () => p.help('spectrogram_axes'),
        // AXES FIRST (the module's charter) — printed permanently on the bezel.
        bezel: [
          { k: 'TIME', v: 'new → right', helpKey: 'spectrogram_axes' },
          { k: 'FREQ', v: '↑ up', helpKey: 'spectrogram_axes' },
          { k: 'LEVEL', v: '= color', helpKey: 'spectrogram_axes' },
          { k: 'MODE', v: snapshot ? 'SNAP' : 'SCROLL', helpKey: 'spectrogram_axes' },
        ],
        render: (w, h) =>
          viz ? (
            <SpectrogramViz
              viz={viz}
              width={w}
              height={h}
              pattern={pattern}
              running={p.focused}
              mode={snapshot ? 'snapshot' : 'scroll'}
            />
          ) : (
            <GlassFallback w={w} h={h} />
          ),
      }}
    >
      <View style={styles.stack}>
        {/* AXES FIRST — before any pattern. The whole module hinges on this. */}
        <CollapsibleSection title="READ THE AXES FIRST" onHelp={() => p.help('spectrogram_axes')}>
          <Text style={dstyles.body}>
            Time runs HORIZONTAL — the newest moment is at the RIGHT edge and older sound scrolls off to
            the LEFT. Frequency runs VERTICAL (low at the bottom, high at the top). Loudness is the
            COLOR — brighter = louder. The #1 error in all of metering is reading a spectrogram like a
            waveform, where up means loud. Here, up means HIGH-PITCHED.
          </Text>
        </CollapsibleSection>

        <Text style={dstyles.body}>
          Six sounds, filmed over time. Open PATTERN and learn how each one PAINTS — then you can identify a sound from
          the picture alone. VIEW switches between the rolling real-time film and the full 5-second snapshot.
        </Text>
        <Text style={dstyles.caption}>{SPECTROGRAM_CAPTIONS[pattern]}</Text>

        <CommonMistakes items={SPECTROGRAM_MISTAKES} />
        <CheckQuestion spec={CHECK_SGRAM_AXES} />
        <CheckQuestion spec={CHECK_WHISTLE_VS_FEEDBACK} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 7 — WATERFALL (CSD): the mountain range that collapses

const ROOM_KEYS = Object.keys(ROOM_LABELS) as RoomKey[];
/** Blurbs match ROOM_PHYS (meterEngine): ROOM is the SHELL — bare geometry —
 *  and the DAMPING fader is everything soft in it (CONCRETE → PANELS). Each
 *  blurb names the bare number AND where full treatment lands. */
const ROOM_BLURBS: Record<RoomKey, string> = {
  cathedral: 'A 12,000 m³ stone shell: RT60 near 7 s bare, lows near 9 s. Even full treatment leaves it over a second — you cannot kill a cathedral with panels.',
  classroom: 'A hard-walled medium room, ~2 s bare — with a 250 Hz mode that rings ~4 s until DAMPING tames it. Watch the marked ridge come and go.',
  studio: 'A small concrete box. BARE it rings ~1.5 s; ride DAMPING to PANELS and it becomes the dead control room (~0.15 s) — with the bass still hanging on. That gap is why bass traps exist.',
  theater: 'A large hall shell: bare concrete it booms 5–6 s like an empty gymnasium. Around 50% DAMPING (seats + curtains) it becomes the ~1 s seated theater; 100% is cinema-dead.',
  living: 'A domestic room, EMPTY (~1 s). DAMPING furnishes it — sofa, rugs, curtains — down to ~0.3 s, but the 110 Hz mode keeps ringing: thin soft goods cannot reach it.',
};
const REVERB_KEYS: ReverbKey[] = ['none', 'room', 'plate', 'hall', 'spring'];
const REVERB_LABELS: Record<ReverbKey, string> = {
  none: 'None',
  room: 'Room',
  plate: 'Plate',
  hall: 'Hall',
  spring: 'Spring',
};
/** Blurbs match REVERB_RT: rtAt1k plus the lf/hf multipliers. */
const REVERB_BLURBS: Record<ReverbKey, string> = {
  none: 'No added reverb — you are looking at the room itself, nothing more.',
  room: 'A short, warm ambience (about half a second): lows linger a touch, highs are damped. Space without an obvious tail.',
  plate: 'A vibrating metal sheet — long (near 2 s), BRIGHT, and even across the band. The classic vocal sheen.',
  hall: 'A long concert-hall tail (over 2.5 s) whose LOWS clearly outlast the highs — big, dark, orchestral.',
  spring: 'The guitar-amp classic: mid-forward and boingy, with both the lows and the highs rolled away.',
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
      'Ride the DAMPING lane from CONCRETE toward PANELS and watch the mountain’s tail shorten — HIGHS first (porous absorbers eat them easily), LOWS last (they need thickness). Watch RT·4k collapse on the bezel long before RT·125 follows. This is why bass traps are thick.',
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
      'Switch Q RING on: a needle-thin ridge appears at 1.2 kHz and LINGERS far behind its neighbors. High-Q filters store energy — the filter itself rings, which is why surgical boosts can sound "resonant". Try it in the CATHEDRAL, too: the ring vanishes into the reverb — a room that decays slower than the filter MASKS it.',
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
  wrongHint: 'Try the EQ lane in this module: the mountain gets taller or shorter — does it get LONGER or SHORTER into the picture?',
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
  // WHICH filter the EQ lane drives (owner 2026-08-30) — the lane used to be
  // hard-wired to a 250 Hz bell, so the lab could only teach one shape.
  const [eqFilter, setEqFilter] = useState<EqFilterKey>('bell220q6');
  const [qRing, setQRing] = useState(false);
  // Bumping this restarts the waterfall build (REPLAY, and any scene change).
  const [replay, setReplay] = useState(0);
  const [reverb, setReverb] = useState<ReverbKey>('none');

  // ROOM and REVERB pick a different scene, so the range must play again from
  // the impulse — otherwise the new room appears already-decayed, frozen at
  // the end of the PREVIOUS one's build. DAMPING / EQ / Q RING deliberately do
  // NOT replay: they are the live controls, and holding the finished range
  // while you move them is exactly what makes an A/B readable.
  useEffect(() => {
    setReplay((n) => n + 1);
  }, [room, reverb]);


  const opts = useMemo<WaterfallOpts>(
    () => ({ room, damping01, eqBoostDb, eqFilter, qRing, reverb }),
    [room, damping01, eqBoostDb, eqFilter, qRing, reverb],
  );
  // Is the EQ lane parked on the frequency the room is ringing at? Same
  // slowest-vs-median rule and the same 1.5x threshold the plot uses to decide
  // whether to draw its "RINGS <f>" label, so the fader and the plot can never
  // disagree about whether there is a ridge to point at.
  const eqOnRinging = useMemo(() => {
    const v = waterfallRidge(opts);
    // A shelf has no centre to line up with a mode, so it never claims to be
    // "on the ring" — only the bells can be aimed at one.
    const spec = EQ_FILTER_BY_KEY[eqFilter];
    if (spec.kind !== 'bell') return false;
    return v.ratio >= RIDGE_CALLOUT_RATIO && Math.abs(Math.log2(v.f / spec.hz)) < EQ_ON_RIDGE_OCT;
  }, [opts]);

  const rt = useMemo(
    () => ({
      r125: waterfallRt(opts, 125),
      r250: waterfallRt(opts, 250),
      r1k: waterfallRt(opts, 1000),
      r4k: waterfallRt(opts, 4000),
      ...waterfallRidge(opts),
    }),
    [opts],
  );
  const ringing = rt.ratio >= 1.6;

  const params: DockParam[] = [
    {
      // The teaching parameter (pre-bound): ride it and watch RT·4k collapse
      // on the bezel while RT·125 holds — highs die first, lows need thickness.
      kind: 'fader',
      id: 'damping',
      label: 'DAMPING',
      value: damping01,
      onChange: setDamping01,
      format: () => `${dampingLabel(damping01)} · ${Math.round(damping01 * 100)}%`,
      formatShort: () => dampingLabel(damping01),
      helpKey: 'damping',
    },
    {
      // ONE key (owner 2026-08-30): tapping EQ opens the filter menu, and
      // picking one hands straight back to the slider for that filter — two
      // keys for a single control was redundant.
      kind: 'fader',
      id: 'eq',
      label: 'EQ',
      value: (eqBoostDb + 12) / 24,
      onChange: (v) => setEqBoostDb(Math.round(-12 + v * 24)),
      format: () =>
        `${eqBoostDb >= 0 ? '+' : '−'}${Math.abs(eqBoostDb)} dB · ${EQ_FILTER_BY_KEY[eqFilter].label}`,
      formatShort: () => `${eqBoostDb >= 0 ? '+' : '−'}${Math.abs(eqBoostDb)} dB`,
      chooser: {
        title: 'EQ FILTER',
        selectedId: eqFilter,
        onSelect: (id) => setEqFilter(id as EqFilterKey),
        options: EQ_FILTERS.map((f) => ({ id: f.key, label: f.label.toUpperCase(), blurb: f.blurb })),
      },
      helpKey: 'eq_ridge',
    },
    {
      kind: 'options',
      id: 'room',
      label: 'ROOM',
      valueLabel: ROOM_LABELS[room].toUpperCase(),
      options: ROOM_KEYS.map((k) => ({ id: k, label: ROOM_LABELS[k].toUpperCase(), blurb: ROOM_BLURBS[k] })),
      selectedId: room,
      onSelect: (id) => setRoom(id as RoomKey),
      sticky: true, // A/B rooms while the mountain rebuilds — the lesson
      helpKey: 'room_ring',
    },
    {
      kind: 'options',
      id: 'reverb',
      label: 'REVERB',
      valueLabel: REVERB_LABELS[reverb].toUpperCase(),
      options: REVERB_KEYS.map((k) => ({ id: k, label: REVERB_LABELS[k].toUpperCase(), blurb: REVERB_BLURBS[k] })),
      selectedId: reverb,
      onSelect: (id) => setReverb(id as ReverbKey),
      sticky: true,
      helpKey: 'reverb_tails',
    },
    {
      kind: 'action',
      id: 'replay',
      label: 'REPLAY',
      onPress: () => setReplay((n) => n + 1),
      tint: colors.green, // green key — it re-runs the build, it changes nothing
    },
    {
      kind: 'toggle',
      id: 'qring',
      label: 'Q RING',
      value: qRing,
      onToggle: () => setQRing((v) => !v),
      helpKey: 'eq_ridge',
    },
  ];

  return (
    <RackUnit
      initialParam="damping"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the flagship — the collapsing range IS the module
        badge: 'SYNTHETIC CSD — DRAWN FROM THE RT60 MODEL, NOT A MEASUREMENT',
        onGuide: () => p.help('waterfall_axes'),
        bezel: [
          { k: 'RT·125', v: `${rt.r125.toFixed(2)} s`, helpKey: 'waterfall_decay' },
          { k: 'RT·4k', v: `${rt.r4k.toFixed(2)} s`, helpKey: 'waterfall_decay' },
          {
            k: 'RIDGE',
            v: ringing ? fmtHz(rt.f) : 'none',
            tint: ringing ? '#ff6b5e' : '#7a7f8a',
            helpKey: 'room_ring',
          },
          {
            // Ratio vs the ±1-octave NEIGHBOURHOOD, not the whole range — a
            // treated room's normal broadband bass rise must not read as
            // "ringing" (detector semantics in meterEngine.waterfallRidge).
            k: 'VS NEARBY',
            v: ringing ? `${rt.ratio.toFixed(1)}×` : 'even',
            tint: ringing ? '#ff6b5e' : '#7a7f8a',
            helpKey: 'waterfall_decay',
          },
        ],
        render: (w, h) =>
          viz ? (
            <WaterfallViz viz={viz} width={w} height={h} opts={opts} running={p.focused} replay={replay} />
          ) : (
            <GlassFallback w={w} h={h} />
          ),
      }}
    >
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

        <Text style={dstyles.body}>
          Build a scene, then watch it collapse: ROOM and REVERB pick the scene, the DAMPING and EQ GAIN
          lanes reshape it live, Q RING plants a ringing filter. The bezel keeps score.
        </Text>
        <ReadoutGrid
          help={p.help}
          helpKey="waterfall_decay"
          items={[
            { k: 'RT60 · 125 Hz', v: `${rt.r125.toFixed(2)} s` },
            { k: 'RT60 · 250 Hz', v: `${rt.r250.toFixed(2)} s` },
            { k: 'RT60 · 1 kHz', v: `${rt.r1k.toFixed(2)} s` },
            { k: 'RT60 · 4 kHz', v: `${rt.r4k.toFixed(2)} s` },
            { k: 'RIDGE', v: ringing ? fmtHz(rt.f) : 'none' },
            { k: 'VS NEIGHBORS', v: ringing ? `${rt.ratio.toFixed(1)}× longer` : 'even decay' },
          ]}
        />
        <Text style={dstyles.caption}>
          {ringing
            ? `${fmtHz(rt.f)} decays ${rt.ratio.toFixed(1)}× slower than its neighbors — that narrow ridge is RINGING. (A broad bass rise is normal room physics; a ridge is a resonance.)`
            : 'No narrow resonance stands out of the decay. Pick CLASSROOM or flip Q RING to plant one — or dry the room out: a live room can MASK a ring that decays faster than the room does.'}
        </Text>

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
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stack: { gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  info: { color: colors.amber, fontSize: 13, marginTop: 5 },

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

  // Guided-lesson entry row — MeterModuleScreen lessonRow styling copied
  // locally (rack modules own their well, incl. this row).
  lessonRow: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
});
