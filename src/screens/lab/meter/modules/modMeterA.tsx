/**
 * meter/modMeterA — Visual Audio Analysis Lab MODULES 1–4 (owner spec
 * 2026-07-29): Waveform · Peak Meter · VU/RMS (the flagship) · Loudness.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): each module renders the RackUnit
 * frame ITSELF (MeterModuleScreen gives rack modules the full height, no host
 * ScrollView). The meter IS the module, so the viz PINS on the stage glass
 * (size L, height-parametric); the REAL engine numbers (meterEngine only —
 * peakOf/rmsOf/dcOf/db/crestDb/vuStep/simulateLoudness) read on the BEZEL
 * (PK HOLD taps to reset — the tools' tap-to-reset idiom); GAIN/DC ride the
 * dock LANE; the SIGNAL collection opens a STICKY tray (A/B while the meter
 * reacts). Only teaching prose, mistakes and CheckQuestions scroll — each
 * well ends in its own guided-lesson entry row (the host row does not render
 * for rack modules).
 *
 * HONESTY: every stage badge carries the standing "SYNTHESIZED TEACHING
 * SIGNAL" disclosure (§1.7) — these are deterministic teaching buffers, not
 * live audio — and states the dBFS scale; the Loudness badge is the verbatim
 * simplified-BS.1770 model disclosure (kept full-width in the well too).
 *
 * NO Skia in this file: the meter views load solely through
 * skiaGate.requireVizMeters(); pre-Skia clients render VizUnavailableCard on
 * the glass and every bezel readout (pure meterEngine math) keeps working.
 * viz.usePhaseClock is called only inside the always-rendered host components
 * below — the established pattern (hooks never conditional).
 *
 * The numbers ALWAYS match the picture: readouts are computed from exactly
 * the processed signal the view draws (raw engine signal × gain, + DC,
 * ± polarity) — no hidden normalization.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CollapsibleSection } from '../../LabShell';
import { CheckQuestion, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { Badge, ListeningSoonCard, MythReality, PanelCard, ReadoutGrid, dstyles } from '../../digital/bits';
import { levelColor } from '../../../../features/tools/levelColor';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import {
  SIGNAL_LABELS,
  SIGNAL_BLURBS,
  crestDb,
  db,
  dcOf,
  peakOf,
  renderSignal,
  rmsOf,
  simulateLoudness,
  vuStep,
  type SignalKey,
} from '../meterEngine';
import { requireVizMeters, type VizMetersModule } from '../skiaGate';
import type { MeterModuleProps } from '../MeterModuleScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers — formatting + trivial staging only; every meter number
// comes from meterEngine.

const RED = '#ff6b5e';

const gainLin = (gDb: number) => Math.pow(10, gDb / 20);
/** 0.5 dB snap keeps the processed-buffer memo key stable while dragging. */
const snapHalfDb = (v: number) => Math.round(v * 2) / 2;

const fmtDb = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`;
/** Compact signed dB for bezel cells / dock buttons (unit lives on the badge). */
const fmtDbC = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;

/** Gain / polarity / DC staging — exactly what the meter views draw. */
function processed(sig: number[], gDb: number, dcOff = 0, invert = false): number[] {
  const g = gainLin(gDb);
  return sig.map((v) => (invert ? -v : v) * g + dcOff);
}

/** Count of distinct over-full-scale runs (the OVER lamp's trip events). */
function overRuns(x: number[]): number {
  let runs = 0;
  let inOver = false;
  for (const v of x) {
    const over = Math.abs(v) >= 1;
    if (over && !inOver) runs++;
    inOver = over;
  }
  return runs;
}

/** Max VU-needle deflection across the buffer — the engine's vuStep (~300 ms
 *  ballistic) chasing the rectified signal over the ~1.5 s teaching clip. */
function needleMaxOf(x: number[], durSec = 1.5): number {
  const dt = durSec / Math.max(1, x.length);
  let needle = 0;
  let top = 0;
  for (const v of x) {
    needle = vuStep(needle, Math.abs(v), dt);
    top = Math.max(top, needle);
  }
  return top;
}

/** Compact signal name for the dock button (~7 mono chars). */
const SIGNAL_SHORT: Partial<Record<SignalKey, string>> = {
  speech: 'SPEECH',
  kick: 'KICK',
  guitar: 'GUITAR',
  whitenoise: 'WHITE',
  pinknoise: 'PINK',
  snare: 'SNARE',
  organ: 'ORGAN',
  music: 'MUSIC',
};
const shortSignal = (s: SignalKey) => SIGNAL_SHORT[s] ?? SIGNAL_LABELS[s].toUpperCase();

/** The SIGNAL collection as a STICKY dock tray (teaching A/B: pick applies and
 *  the tray stays open while the pinned meter reacts). Per-signal long-press
 *  opens its most relevant lesson — the old SignalChips contract preserved. */
function signalParam(
  selected: SignalKey,
  onSelect: (s: SignalKey) => void,
  options: SignalKey[],
  help: (k?: string) => void,
  helpKeys: Partial<Record<SignalKey, string>>,
  fallbackKey: string,
): DockParam {
  return {
    kind: 'options',
    id: 'signal',
    label: 'SIGNAL',
    valueLabel: shortSignal(selected),
    sticky: true,
    options: options.map((s) => ({
      id: s,
      label: SIGNAL_LABELS[s].toUpperCase(),
      blurb: SIGNAL_BLURBS[s],
      onLongPress: () => help(helpKeys[s] ?? fallbackKey),
    })),
    selectedId: selected,
    onSelect: (id) => onSelect(id as SignalKey),
    helpKey: fallbackKey,
  };
}

function MistakesCard({ items }: { items: string[] }) {
  return (
    <PanelCard>
      <Text style={dstyles.eyebrow}>COMMON MISTAKES</Text>
      {items.map((m) => (
        <Text key={m} style={dstyles.body}>
          {'•'} {m}
        </Text>
      ))}
    </PanelCard>
  );
}

/** Guided-lesson entry at the BOTTOM of each rack well (the host renders this
 *  row only for non-rack modules — MeterModuleScreen lessonRow styling). */
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

/** Pre-Skia fallback centered on the stage glass (readouts keep working). */
function StageUnavailable({ w, h }: { w: number; h: number }) {
  return (
    <View style={{ width: w, height: h, justifyContent: 'center', padding: 12 }}>
      <VizUnavailableCard />
    </View>
  );
}

// ── Inner viz hosts — rendered only when the viz module loaded, so the
//    phase-clock hook is called unconditionally within them (the pattern). ───

function WaveformHost({
  viz,
  width,
  height,
  focused,
  signal,
  gainDb,
  dcOffset,
  invert,
}: {
  viz: VizMetersModule;
  width: number;
  height: number;
  focused: boolean;
  signal: SignalKey;
  gainDb: number;
  dcOffset: number;
  invert: boolean;
}) {
  const phase = viz.usePhaseClock(focused, 0.5);
  return (
    <viz.WaveformView
      width={width}
      height={height}
      signal={signal}
      gain={gainLin(gainDb)}
      dcOffset={dcOffset}
      invertPolarity={invert}
      showClip
      phase={phase}
    />
  );
}

function PeakHost({
  viz,
  width,
  height,
  focused,
  signal,
  gainDb,
}: {
  viz: VizMetersModule;
  width: number;
  height: number;
  focused: boolean;
  signal: SignalKey;
  gainDb: number;
}) {
  const phase = viz.usePhaseClock(focused, 0.9);
  return <viz.PeakMeterView width={width} height={height} signal={signal} gain={gainLin(gainDb)} phase={phase} />;
}

function VuHost({
  viz,
  width,
  height,
  focused,
  signal,
  gainDb,
}: {
  viz: VizMetersModule;
  width: number;
  height: number;
  focused: boolean;
  signal: SignalKey;
  gainDb: number;
}) {
  const phase = viz.usePhaseClock(focused, 0.7);
  return (
    <viz.VuMeterView
      width={width}
      height={height}
      signal={signal}
      gain={gainLin(gainDb)}
      phase={phase}
      showPeakLed
    />
  );
}

function LoudnessHost({
  viz,
  width,
  height,
  focused,
  signal,
}: {
  viz: VizMetersModule;
  width: number;
  height: number;
  focused: boolean;
  signal: SignalKey;
}) {
  const phase = viz.usePhaseClock(focused, 0.25);
  return <viz.LoudnessView width={width} height={height} signal={signal} phase={phase} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 1 — WAVEFORM (amplitude · polarity · clipping · silence · transients ·
// DC offset · dynamic range)

const WAVEFORM_SIGNALS: SignalKey[] = ['speech', 'kick', 'guitar', 'whitenoise'];
const WAVEFORM_HELP: Partial<Record<SignalKey, string>> = {
  speech: 'dynamic_range_view',
  kick: 'transients',
  guitar: 'waveform_read',
  whitenoise: 'dynamic_range_view',
};

const WAVEFORM_MISTAKES = [
  'Reading a tall waveform as a LOUD one — height is peak amplitude; loudness lives in the average (Modules 2–3).',
  'Missing DC offset because "the take plays fine" — the off-center ride line steals headroom and thumps on every edit.',
  'Trying to fix a clipped peak with a fader — the shape above full scale was never stored; gain scales what is left.',
  'Judging dynamic range from one zoom level — zoom out for the loud/quiet architecture, zoom in for transient truth.',
];

const WAVEFORM_CHECKS: CheckSpec[] = [
  {
    question:
      'In a take, the silence between phrases is drawn as a flat line sitting ABOVE the center line. What is on the recording?',
    options: [
      'Clipping — the flat line is a sheared-off peak',
      'DC offset — a constant voltage riding under the whole signal',
      'Room tone — normal background noise',
      'Nothing wrong — silence can sit anywhere on the axis',
    ],
    correctIdx: 1,
    reveal:
      'True digital silence is zeros, drawn AT the center line. A flat line OFF center means a constant (DC) voltage was added to every sample: it steals headroom from one side and clicks or thumps at every edit point. Ride the DC lane above and watch the whole picture ride up without getting any "louder".',
    wrongHint: 'Where must true digital silence sit on the vertical axis?',
  },
  {
    question:
      'You clipped a peak while recording, then pull the file down 6 dB afterwards. The flat-topped peak…',
    options: [
      'Rounds back into shape — gain works both ways',
      'Stays flat — now just a quieter flat top; the shape above full scale was never stored',
      'Repairs itself when you normalize',
      'Comes back if you export at 32-bit float',
    ],
    correctIdx: 1,
    reveal:
      'The converter could only write values up to full scale, so every sample above it was stored as the SAME maximum value. The curve that used to be there was discarded at capture — later gain just scales what survived, flat top included. That is why clip damage is unrecoverable and headroom is cheap insurance.',
    wrongHint: 'What did the converter actually write for the samples above full scale?',
  },
];

export function WaveformModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizMeters())[0];
  const [signal, setSignal] = useState<SignalKey>('speech');
  const [gainDb, setGainDb] = useState(0);
  const [dcOff, setDcOff] = useState(0);
  const [invert, setInvert] = useState(false);

  const sig = useMemo(() => renderSignal(signal), [signal]);
  const { clipped, overSamples, overDriveDb } = useMemo(() => {
    const proc = processed(sig, gainDb, dcOff, invert);
    const rawPeak = peakOf(proc);
    return {
      clipped: proc.map((v) => Math.max(-1, Math.min(1, v))),
      overSamples: proc.filter((v) => Math.abs(v) >= 1).length,
      overDriveDb: rawPeak >= 1 ? db(rawPeak) : 0,
    };
  }, [sig, gainDb, dcOff, invert]);

  const dcPct = dcOf(clipped) * 100;
  const bezel: BezelItem[] = [
    { k: 'PEAK', v: fmtDbC(db(peakOf(clipped))), helpKey: 'waveform_read' },
    { k: 'RMS', v: fmtDbC(db(rmsOf(clipped))), helpKey: 'waveform_read' },
    { k: 'CREST', v: `${crestDb(clipped).toFixed(1)}dB`, helpKey: 'waveform_read' },
    { k: 'DC', v: `${dcPct >= 0 ? '+' : ''}${dcPct.toFixed(1)}%`, helpKey: 'dc_offset' },
    {
      k: 'CLIP',
      v: overSamples > 0 ? `+${overDriveDb.toFixed(1)} OVER` : 'CLEAN',
      tint: overSamples > 0 ? RED : undefined,
      helpKey: 'clipping_view',
      flex: 1.2,
    },
  ];

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      value: (gainDb + 12) / 30,
      onChange: (v) => setGainDb(snapHalfDb(-12 + v * 30)),
      format: () => fmtDb(gainDb),
      formatShort: () => fmtDbC(gainDb),
      tint: levelColor((gainDb + 12) / 30),
      helpKey: 'clipping_view',
    },
    {
      kind: 'fader',
      id: 'dc',
      label: 'DC',
      value: (dcOff + 0.3) / 0.6,
      onChange: (v) => setDcOff(Math.round((v * 0.6 - 0.3) * 100) / 100),
      format: () => `${dcOff >= 0 ? '+' : ''}${(dcOff * 100).toFixed(0)} %`,
      helpKey: 'dc_offset',
    },
    signalParam(signal, setSignal, WAVEFORM_SIGNALS, p.help, WAVEFORM_HELP, 'waveform_read'),
    { kind: 'toggle', id: 'inv', label: 'Ø POL', value: invert, onToggle: () => setInvert(!invert), helpKey: 'waveform_read' },
    { kind: 'action', id: 'dc0', label: 'DC→0', onPress: () => setDcOff(0) },
  ];

  return (
    <RackUnit
      initialParam="gain"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the picture IS the module
        badge: 'SYNTHESIZED TEACHING SIGNAL · LEVELS IN dBFS',
        bezel,
        onGuide: () => p.help('waveform_read'),
        render: (w, h) =>
          viz ? (
            <WaveformHost
              viz={viz}
              width={w}
              height={h}
              focused={p.focused}
              signal={signal}
              gainDb={gainDb}
              dcOffset={dcOff}
              invert={invert}
            />
          ) : (
            <StageUnavailable w={w} h={h} />
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        <Text style={dstyles.body}>
          Ride the GAIN lane into the rails, slide DC off center, flip the Ø POL key — the bezel
          numbers are computed from exactly the signal the picture draws.
        </Text>

        <CollapsibleSection title="READING THE PICTURE — CUE BY CUE">
          <Text style={dstyles.body}>
            HEIGHT is amplitude — the peak readout, nothing more. SYMMETRY around the center is
            polarity balance: tap the Ø POL key and the picture flips upside-down while every
            number but the DC sign stays put — polarity changes nothing about level. FLAT TOPS at
            the rails are clipping — push GAIN up and watch red shear appear the instant the CLIP
            readout trips. A FLAT LINE at center is silence; a flat line OFF center is DC offset —
            the ride line the DC lane moves (DC→0 snaps it back). THIN SPIKES (pick KICK in the
            SIGNAL tray) are transients: huge peak, almost no ink, which is why PEAK and RMS
            disagree by the CREST readout.
          </Text>
          <Text style={dstyles.eyebrow}>DYNAMIC RANGE IS THE SPACE BETWEEN</Text>
          <Text style={dstyles.body}>
            Compare SPEECH — bursts with real gaps, a picture that breathes — against WHITE NOISE, a
            solid unchanging band. The distance between the loudest peaks and the quiet detail is the
            take's dynamic range: an over-compressed master looks like the noise, a brick of ink. One
            glance at any waveform now tells you level, polarity, damage, and dynamics before you
            ever press play.
          </Text>
        </CollapsibleSection>

        <MistakesCard items={WAVEFORM_MISTAKES} />
        <CheckQuestion spec={WAVEFORM_CHECKS[0]} />
        <CheckQuestion spec={WAVEFORM_CHECKS[1]} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2 — PEAK METER (instantaneous peaks · peak hold · OVER lamp)

const PEAK_SIGNALS: SignalKey[] = ['kick', 'snare', 'speech', 'organ'];
const PEAK_HELP: Partial<Record<SignalKey, string>> = {
  kick: 'transients',
  snare: 'transients',
  speech: 'peak_meter',
  organ: 'rms_vs_peak',
};

const PEAK_MISTAKES = [
  'Mixing "to the peak meter" — peak level is clip safety, not loudness.',
  'Assuming two signals at the same peak are equally loud — the crest factor readout says otherwise.',
  'Shrugging off the OVER lamp because "it was only a sample or two" — those samples are already sheared.',
  'Forgetting the hold bar is a recent maximum, not the live level — the live bar is already gone.',
];

const PEAK_CHECK: CheckSpec = {
  question:
    'A snare hit and a sustained organ chord both read exactly the same peak on this meter. Are they equally loud?',
  options: [
    'Yes — same peak, same loudness',
    'No — the snare’s energy is a millisecond spike, the organ’s is continuous: same peak, wildly different average',
    'Yes, but only if both are mono',
    'The meter must be broken',
  ],
  correctIdx: 1,
  reveal:
    'A peak meter answers exactly one question: "will it clip?" Loudness lives in the AVERAGE energy. Flip between KICK/SNARE and ORGAN at the same peak and compare the RMS and CREST readouts — around 20 dB apart. Module 3’s VU needle turns that difference into something you can watch move.',
  wrongHint: 'Peak is one sample’s worth of information. What did the other thousand samples do?',
};

export function PeakModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizMeters())[0];
  const [signal, setSignal] = useState<SignalKey>('kick');
  const [gainDb, setGainDb] = useState(-6);

  const sig = useMemo(() => renderSignal(signal), [signal]);
  const proc = useMemo(() => processed(sig, gainDb), [sig, gainDb]);

  const rawPeakDb = db(peakOf(proc));
  const overs = overRuns(proc);
  // Real peak-HOLD latch (owner 2026-08-05): keeps the highest peak driven so
  // far across signal/gain changes; tapping the bezel cell re-baselines it to
  // the current peak (the tools' tap-to-reset idiom).
  const [peakHold, setPeakHold] = useState(-Infinity);
  useEffect(() => {
    setPeakHold((h) => Math.max(h, rawPeakDb));
  }, [rawPeakDb]);

  const bezel: BezelItem[] = [
    {
      k: 'PEAK',
      v: rawPeakDb >= 0 ? `+${rawPeakDb.toFixed(1)} OVR` : fmtDbC(rawPeakDb),
      tint: rawPeakDb >= 0 ? RED : undefined,
      helpKey: 'peak_meter',
    },
    {
      k: 'PK HOLD',
      v: peakHold === -Infinity ? '—' : peakHold >= 0 ? `+${peakHold.toFixed(1)} OVR` : fmtDbC(peakHold),
      tint: peakHold >= 0 ? RED : undefined,
      helpKey: 'peak_hold',
      onPress: () => setPeakHold(rawPeakDb), // tap = reset the latch
      flex: 1.1,
    },
    { k: 'OVERS', v: `${overs}`, tint: overs > 0 ? RED : undefined, helpKey: 'peak_meter', flex: 0.7 },
    { k: 'RMS', v: fmtDbC(db(rmsOf(proc))), helpKey: 'rms_vs_peak' },
    { k: 'CREST', v: `${crestDb(proc).toFixed(1)}dB`, helpKey: 'rms_vs_peak' },
  ];

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      value: (gainDb + 12) / 30,
      onChange: (v) => setGainDb(snapHalfDb(-12 + v * 30)),
      format: () => fmtDb(gainDb),
      formatShort: () => fmtDbC(gainDb),
      tint: levelColor((gainDb + 12) / 30),
      helpKey: 'peak_hold',
    },
    signalParam(signal, setSignal, PEAK_SIGNALS, p.help, PEAK_HELP, 'peak_meter'),
  ];

  return (
    <RackUnit
      initialParam="gain"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: 'SYNTHESIZED TEACHING SIGNAL · LEVELS IN dBFS',
        bezel,
        onGuide: () => p.help('peak_meter'),
        render: (w, h) =>
          viz ? (
            <PeakHost viz={viz} width={w} height={h} focused={p.focused} signal={signal} gainDb={gainDb} />
          ) : (
            <StageUnavailable w={w} h={h} />
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        <Text style={dstyles.body}>
          Ride the GAIN lane and drive the columns into the OVER lamp; tap the PK HOLD readout to
          reset its latch, and A/B the SIGNAL tray while the meter reacts.
        </Text>

        <CollapsibleSection title="SAMPLE-BY-SAMPLE, THEN A MEMORY">
          <Text style={dstyles.body}>
            The live bar tracks the instantaneous maximum — up in microseconds, falling slowly only
            so your eye can follow. The floating segment above it is PEAK HOLD, the highest recent
            peak kept on screen so you can mix without staring. Push GAIN until the top segment
            lights: that is the OVER lamp, and it LATCHES — one trip means full scale was already
            hit, however briefly. The OVERS readout tallies each separate excursion.
          </Text>
          <Text style={dstyles.eyebrow}>WHAT PEAK CANNOT TELL YOU — PREVIEW OF MODULE 3</Text>
          <Text style={dstyles.body}>
            Set KICK and ORGAN to the same peak and look at RMS: the meter face is
            identical while the average energy differs by the CREST readout — around 20 dB. Peak is
            the converter's bodyguard, not a loudness meter. The next module puts a 300 ms needle on
            the same signals and makes that difference physical.
          </Text>
        </CollapsibleSection>

        <MistakesCard items={PEAK_MISTAKES} />
        <CheckQuestion spec={PEAK_CHECK} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3 — VU / RMS METER (THE flagship: the needle that reads like ears)

const VU_SIGNALS: SignalKey[] = ['snare', 'organ', 'pinknoise', 'speech'];
const VU_HELP: Partial<Record<SignalKey, string>> = {
  snare: 'rms_vs_peak',
  organ: 'rms_vs_peak',
  pinknoise: 'vu_meter',
  speech: 'ballistics',
};

const VU_MISTAKES = [
  'Calling the VU "broken" or "too slow" on drums — the 300 ms average is BY DESIGN; the peak LED exists for the spikes.',
  'Chasing 0 VU with transient sources — the needle never saw the peaks that are clipping your converter upstream.',
  'Reading 0 VU as "about to clip" — it marks NOMINAL operating level, with headroom engineered above it.',
  'Comparing VU readings between different programs without checking crest factor first.',
];

const VU_CHECKS: CheckSpec[] = [
  {
    question:
      'Snare and organ are set to the SAME peak level, yet the needle barely stirs on the snare while it rides high on the organ. Why?',
    options: [
      'The needle mechanism is faulty on percussive material',
      'The needle averages ~300 ms: the snare’s energy is gone before it can move, while the organ feeds it continuously',
      'The organ is simply louder at its peak',
      'The snare is out of phase with the meter',
    ],
    correctIdx: 1,
    reveal:
      'A needle with ~300 ms of ballistic inertia physically cannot reach a millisecond spike — and that is the design. It reads sustained average energy, which is what loudness feels like. Watch the peak LED: it flashes just as hard on both signals. Only the needle knows they are completely different programs.',
    wrongHint: 'How long does each signal keep pushing energy at the needle?',
  },
  {
    question: 'The needle rests right on 0 VU. What is the meter telling you?',
    options: [
      'You are clipping — back off immediately',
      'The program is at NOMINAL operating level — the calibrated reference the system is built around, with headroom above',
      'The program measures exactly −14 LUFS',
      'Nothing — 0 means silence on a VU scale',
    ],
    correctIdx: 1,
    reveal:
      '0 VU is a REFERENCE, not a ceiling: the calibrated sweet spot (classically +4 dBu through analog gear) where headroom sits above you and the noise floor sits well below. Clipping lives many dB higher — and the digital 0 dBFS ceiling is a different scale entirely.',
    wrongHint: 'Is VU zero a ceiling or a calibration mark?',
  },
];

export function VuModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizMeters())[0];
  const [signal, setSignal] = useState<SignalKey>('snare');
  const [gainDb, setGainDb] = useState(0);

  const sig = useMemo(() => renderSignal(signal), [signal]);
  const proc = useMemo(() => processed(sig, gainDb), [sig, gainDb]);
  const needleDb = useMemo(() => db(needleMaxOf(proc)), [proc]);

  const bezel: BezelItem[] = [
    { k: 'PEAK', v: fmtDbC(db(peakOf(proc))), helpKey: 'rms_vs_peak' },
    { k: 'RMS', v: fmtDbC(db(rmsOf(proc))), helpKey: 'rms_vs_peak' },
    { k: 'CREST', v: `${crestDb(proc).toFixed(1)}dB`, helpKey: 'rms_vs_peak' },
    { k: 'NDL MAX', v: fmtDbC(needleDb), helpKey: 'ballistics', flex: 1.1 },
  ];

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'gain',
      label: 'GAIN',
      value: (gainDb + 12) / 24,
      onChange: (v) => setGainDb(snapHalfDb(-12 + v * 24)),
      format: () => fmtDb(gainDb),
      formatShort: () => fmtDbC(gainDb),
      tint: levelColor((gainDb + 12) / 24),
      helpKey: 'ballistics',
    },
    signalParam(signal, setSignal, VU_SIGNALS, p.help, VU_HELP, 'vu_meter'),
  ];

  return (
    <RackUnit
      initialParam="gain"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // the flagship face rendered LARGE
        badge: 'SYNTHESIZED TEACHING SIGNAL · dBFS · NEEDLE ~300 ms — BY DESIGN',
        bezel,
        onGuide: () => p.help('vu_meter'),
        render: (w, h) =>
          viz ? (
            <VuHost viz={viz} width={w} height={h} focused={p.focused} signal={signal} gainDb={gainDb} />
          ) : (
            <StageUnavailable w={w} h={h} />
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        <Text style={dstyles.body}>
          Ride the GAIN lane and A/B the SIGNAL tray while the needle answers — NDL MAX on the
          bezel shows how far the ~300 ms ballistics ever get.
        </Text>

        <CollapsibleSection title="THE LESSON — WATCH THE NEEDLE LOSE TO THE LED">
          <Text style={dstyles.body}>
            Select SNARE: the peak LED flashes hard on every hit while the needle barely stirs — by
            the time 300 ms of ballistics get it moving, the hit is long over. The NDL MAX readout
            shows how little of the peak it ever reaches. Now select ORGAN: similar LED,
            but the needle climbs and SITS there, because the energy never stops arriving. Same peak,
            opposite needles — that is RMS versus peak made physical, and it is the single most
            important metering lesson in this lab.
          </Text>
          <Text style={dstyles.eyebrow}>WHY ENGINEERS STILL TRUST IT</Text>
          <Text style={dstyles.body}>
            The needle's average tracks perceived loudness the way a converter-guarding peak meter
            never can. PINK NOISE holds it almost perfectly still — the calibration workhorse — and
            SPEECH swings it in gentle syllable-sized arcs. Read the needle for how loud it feels,
            the LED for whether it clips: two questions, two instruments on one face.
          </Text>
        </CollapsibleSection>

        <MythReality
          myth="The VU meter is slow because it's old tech."
          reality="The 300 ms ballistic is a DESIGNED average — it reads like ears, not like converters."
        />

        <MistakesCard items={VU_MISTAKES} />
        <CheckQuestion spec={VU_CHECKS[0]} />
        <CheckQuestion spec={VU_CHECKS[1]} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 4 — LOUDNESS METER (LUFS · integrated · LRA · true peak)

const LOUDNESS_SIGNALS: SignalKey[] = ['speech', 'music', 'organ', 'kick'];
const LOUDNESS_HELP: Partial<Record<SignalKey, string>> = {
  speech: 'integrated',
  music: 'lufs',
  organ: 'short_momentary',
  kick: 'lra',
};

const LOUDNESS_MODEL_BADGE =
  'SIMPLIFIED BS.1770-STYLE TEACHING MODEL — not a compliance meter (ITU-R BS.1770-5 measurement needs real DSP)';

const LOUDNESS_MISTAKES = [
  'Mastering "as loud as possible" for streaming — the platform turns it back DOWN to its integrated target; you traded dynamics for nothing.',
  'Reading momentary jumps as "the mix got louder" — integrated barely moves; different window, different question.',
  'Trusting sample peak at −0.1 dBFS — the reconstructed waveform can overshoot between samples, which is why specs demand −1 dBTP.',
  'Confusing LRA (how DYNAMIC the program is) with loudness (how loud it is).',
];

const LOUDNESS_CHECKS: CheckSpec[] = [
  {
    question: 'You upload a track to a streaming platform. Which number does its loudness normalization act on?',
    options: [
      'Sample peak (dBFS)',
      'Integrated loudness (LUFS) over the whole program',
      'The momentary loudness maximum',
      'The loudness range (LRA)',
    ],
    correctIdx: 1,
    reveal:
      'Platforms measure ONE gated, K-weighted average across the entire program — integrated LUFS — and turn the whole track up or down to their target (commonly around −14 LUFS). Peaks only matter as the −1 dBTP safety ceiling. Master louder than the target and the platform simply turns it down — minus the dynamics you crushed.',
    wrongHint: 'Which of these numbers describes the WHOLE program with one value?',
  },
  {
    question:
      'The DAW shows sample peak −0.5 dBFS, but the true-peak meter reads +0.4 dBTP. What happened?',
    options: [
      'One of the two meters is mis-calibrated',
      'The reconstructed analog waveform rises above the samples between them — an intersample peak',
      'The file was quietly normalized during export',
      'dBTP always reads exactly 1 dB above dBFS',
    ],
    correctIdx: 1,
    reveal:
      'Samples are dots; the DAC draws the smooth curve through them — and between two high samples that curve can swing higher than either. True-peak meters oversample to estimate the reconstructed curve. "No clipped samples" is not "no clipping": the overshoot distorts DACs and lossy codecs, which is exactly why delivery specs ask for a −1 dBTP ceiling.',
    wrongHint: 'What does the DAC reconstruct BETWEEN two adjacent samples?',
  },
];

export function LoudnessModule(p: MeterModuleProps) {
  const viz = useState(() => requireVizMeters())[0];
  const [signal, setSignal] = useState<SignalKey>('music');

  const sim = useMemo(() => simulateLoudness(signal), [signal]);
  const momMin = Math.min(...sim.momentary);
  const momMax = Math.max(...sim.momentary);
  const tpOver = sim.truePeakDbtp > -1;

  const bezel: BezelItem[] = [
    { k: 'INTEGRATED', v: `${sim.integratedLufs.toFixed(1)}LUFS`, helpKey: 'integrated', flex: 1.4 },
    { k: 'LRA', v: `${sim.lraLu.toFixed(1)}LU`, helpKey: 'lra', flex: 0.9 },
    { k: 'SAMPLE PK', v: `${sim.samplePeakDbfs.toFixed(1)}dBFS`, helpKey: 'true_peak_meter', flex: 1.2 },
    {
      k: 'TRUE PK',
      v: `${sim.truePeakDbtp >= 0 ? '+' : ''}${sim.truePeakDbtp.toFixed(1)}dBTP`,
      tint: tpOver ? RED : undefined,
      helpKey: 'true_peak_meter',
      flex: 1.2,
    },
    {
      k: 'TP GAP',
      v: `+${(sim.truePeakDbtp - sim.samplePeakDbfs).toFixed(1)}dB`,
      helpKey: 'true_peak_meter',
      flex: 0.9,
    },
  ];

  const params: DockParam[] = [
    signalParam(signal, setSignal, LOUDNESS_SIGNALS, p.help, LOUDNESS_HELP, 'lufs'),
  ];

  return (
    <RackUnit
      initialParam="signal"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L', // taller face + bigger fonts (owner 2026-08-05)
        badge: LOUDNESS_MODEL_BADGE,
        bezel,
        onGuide: () => p.help('lufs'),
        render: (w, h) =>
          viz ? (
            <LoudnessHost viz={viz} width={w} height={h} focused={p.focused} signal={signal} />
          ) : (
            <StageUnavailable w={w} h={h} />
          ),
      }}
    >
      <View style={{ gap: 12 }}>
        {/* Full honesty wording readable in the well (the one-line badge strip
            may ellipsize on narrow phones — the disclosure must not). */}
        <Badge text={LOUDNESS_MODEL_BADGE} />
        <ReadoutGrid
          items={[{ k: 'MOMENTARY RANGE', v: `${momMin.toFixed(1)} … ${momMax.toFixed(1)} LUFS` }]}
          help={p.help}
          helpKey="short_momentary"
        />

        <CollapsibleSection title="WHY EVERYONE NORMALIZES BY INTEGRATED LUFS">
          <Text style={dstyles.body}>
            Momentary (400 ms) answers "what is loud RIGHT NOW"; short-term (3 s) answers "how loud
            is this section"; integrated gates out the silence and averages the WHOLE program into
            one perception-weighted number. Streaming services (≈ −14 LUFS) and broadcast
            (−23/−24 LUFS) match programs by that one number, so listeners never ride the volume
            knob between tracks. Flip between SPEECH and MUSIC MIX in the SIGNAL tray: momentary
            dances, integrated barely breathes — different windows answering different questions.
          </Text>
          <Text style={dstyles.eyebrow}>THE −1 dBTP CEILING — MIND THE GAP</Text>
          <Text style={dstyles.body}>
            Compare SAMPLE PK with TRUE PK on the bezel: the TP GAP readout is the overshoot the
            reconstructed waveform makes BETWEEN samples. A file whose samples never touch full scale
            can still clip a DAC or a lossy encoder. Delivery specs park the true peak at −1 dBTP so
            the reconstruction — and the codec after it — always has room.
          </Text>
        </CollapsibleSection>

        <ListeningSoonCard what="Level-matched loudness A/B comparison (same integrated LUFS, different crest and dynamics)" />

        <MistakesCard items={LOUDNESS_MISTAKES} />
        <CheckQuestion spec={LOUDNESS_CHECKS[0]} />
        <CheckQuestion spec={LOUDNESS_CHECKS[1]} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// Bottom guided-lesson row — mirrors MeterModuleScreen/LabShell v2 lessonRow
// styling (rack modules own their well, so the host row does not render).
const styles = StyleSheet.create({
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
