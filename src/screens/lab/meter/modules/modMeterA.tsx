/**
 * meter/modMeterA — Visual Audio Analysis Lab MODULES 1–4 (owner spec
 * 2026-07-29): Waveform · Peak Meter · VU/RMS (the flagship) · Loudness.
 *
 * Each module: signal chips → the hero meter view → a ReadoutGrid of REAL
 * engine numbers (meterEngine only — peakOf/rmsOf/dcOf/db/crestDb/vuStep/
 * simulateLoudness) → teaching captions → Common Mistakes → CheckQuestions →
 * the standing "SYNTHESIZED TEACHING SIGNAL" honesty badge (§1.7).
 *
 * NO Skia in this file: the meter views load solely through
 * skiaGate.requireVizMeters(); pre-Skia clients render VizUnavailableCard and
 * every readout (pure meterEngine math) keeps working. viz.usePhaseClock is
 * called only inside the always-rendered host components below — the
 * established pattern (hooks never conditional).
 *
 * The numbers ALWAYS match the picture: readouts are computed from exactly
 * the processed signal the view draws (raw engine signal × gain, + DC,
 * ± polarity) — no hidden normalization.
 */
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import { LabChip } from '../../LabShell';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { Badge, ListeningSoonCard, MythReality, PanelCard, ReadoutGrid, dstyles } from '../../digital/bits';
import {
  SIGNAL_LABELS,
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

const HONESTY = 'SYNTHESIZED TEACHING SIGNAL — deterministic, for pattern study';

const gainLin = (gDb: number) => Math.pow(10, gDb / 20);
/** 0.5 dB snap keeps the processed-buffer memo key stable while dragging. */
const snapHalfDb = (v: number) => Math.round(v * 2) / 2;

const fmtDb = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`;
const fmtDbfs = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)} dBFS`;

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

function SignalChips({
  options,
  selected,
  onSelect,
  help,
  helpKeys,
  fallbackKey,
}: {
  options: SignalKey[];
  selected: SignalKey;
  onSelect: (s: SignalKey) => void;
  help: (k?: string) => void;
  /** Long-press per signal opens the most relevant lesson key. */
  helpKeys?: Partial<Record<SignalKey, string>>;
  fallbackKey: string;
}) {
  return (
    <View style={dstyles.chipRow}>
      {options.map((s) => (
        <LabChip
          key={s}
          label={SIGNAL_LABELS[s].toUpperCase()}
          selected={selected === s}
          onPress={() => onSelect(s)}
          onLongPress={() => help(helpKeys?.[s] ?? fallbackKey)}
        />
      ))}
    </View>
  );
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

// ── Inner viz hosts — rendered only when the viz module loaded, so the
//    phase-clock hook is called unconditionally within them (the pattern). ───

function WaveformHost({
  viz,
  width,
  focused,
  signal,
  gainDb,
  dcOffset,
  invert,
}: {
  viz: VizMetersModule;
  width: number;
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
  focused,
  signal,
  gainDb,
}: {
  viz: VizMetersModule;
  width: number;
  focused: boolean;
  signal: SignalKey;
  gainDb: number;
}) {
  const phase = viz.usePhaseClock(focused, 0.9);
  return <viz.PeakMeterView width={width} signal={signal} gain={gainLin(gainDb)} phase={phase} />;
}

function VuHost({
  viz,
  width,
  focused,
  signal,
  gainDb,
}: {
  viz: VizMetersModule;
  width: number;
  focused: boolean;
  signal: SignalKey;
  gainDb: number;
}) {
  const phase = viz.usePhaseClock(focused, 0.7);
  return (
    <viz.VuMeterView
      width={width}
      height={270}
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
  focused,
  signal,
}: {
  viz: VizMetersModule;
  width: number;
  focused: boolean;
  signal: SignalKey;
}) {
  const phase = viz.usePhaseClock(focused, 0.25);
  return <viz.LoudnessView width={width} signal={signal} phase={phase} />;
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
      'True digital silence is zeros, drawn AT the center line. A flat line OFF center means a constant (DC) voltage was added to every sample: it steals headroom from one side and clicks or thumps at every edit point. Slide DC OFFSET above and watch the whole picture ride up without getting any "louder".',
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
  const readouts = [
    { k: 'PEAK', v: fmtDbfs(db(peakOf(clipped))) },
    { k: 'RMS', v: fmtDbfs(db(rmsOf(clipped))) },
    { k: 'CREST FACTOR', v: `${crestDb(clipped).toFixed(1)} dB` },
    { k: 'DC OFFSET', v: `${dcPct >= 0 ? '+' : ''}${dcPct.toFixed(1)} %` },
    {
      k: 'CLIP VERDICT',
      v: overSamples > 0 ? `CLIPPED — ${overSamples} SAMPLES FLAT · +${overDriveDb.toFixed(1)} dB OVER` : 'CLEAN',
    },
  ];

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        <SignalChips
          options={WAVEFORM_SIGNALS}
          selected={signal}
          onSelect={setSignal}
          help={p.help}
          helpKeys={WAVEFORM_HELP}
          fallbackKey="waveform_read"
        />
        {viz ? (
          <WaveformHost
            viz={viz}
            width={p.width}
            focused={p.focused}
            signal={signal}
            gainDb={gainDb}
            dcOffset={dcOff}
            invert={invert}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={HONESTY} />
        <DisplayGuideButton onPress={() => p.help('waveform_read')} />
        <View style={dstyles.chipRow}>
          <LabChip
            label="INVERT POLARITY Ø"
            selected={invert}
            onPress={() => setInvert(!invert)}
            onLongPress={() => p.help('waveform_read')}
          />
        </View>
        <DragSlider
          value={(gainDb + 12) / 30}
          onChange={(v) => setGainDb(snapHalfDb(-12 + v * 30))}
          label="GAIN"
          readout={fmtDb(gainDb)}
          onHelp={() => p.help('clipping_view')}
        />
        <DragSlider
          value={(dcOff + 0.3) / 0.6}
          onChange={(v) => setDcOff(Math.round((v * 0.6 - 0.3) * 100) / 100)}
          label="DC OFFSET"
          readout={`${dcOff >= 0 ? '+' : ''}${(dcOff * 100).toFixed(0)} %`}
          onHelp={() => p.help('dc_offset')}
        />
        <ReadoutGrid items={readouts} />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>READING THE PICTURE — CUE BY CUE</Text>
        <Text style={dstyles.body}>
          HEIGHT is amplitude — the peak readout, nothing more. SYMMETRY around the center is
          polarity balance: tap INVERT POLARITY Ø and the picture flips upside-down while every
          number but the DC sign stays put — polarity changes nothing about level. FLAT TOPS at the
          rails are clipping — push GAIN up and watch red shear appear the instant the CLIP VERDICT
          trips. A FLAT LINE at center is silence; a flat line OFF center is DC offset — the ride
          line the DC slider moves. THIN SPIKES (pick KICK) are transients: huge peak, almost no
          ink, which is why PEAK and RMS disagree by the CREST FACTOR.
        </Text>
        <Text style={dstyles.eyebrow}>DYNAMIC RANGE IS THE SPACE BETWEEN</Text>
        <Text style={dstyles.body}>
          Compare SPEECH — bursts with real gaps, a picture that breathes — against WHITE NOISE, a
          solid unchanging band. The distance between the loudest peaks and the quiet detail is the
          take's dynamic range: an over-compressed master looks like the noise, a brick of ink. One
          glance at any waveform now tells you level, polarity, damage, and dynamics before you
          ever press play.
        </Text>
      </PanelCard>

      <MistakesCard items={WAVEFORM_MISTAKES} />
      <CheckQuestion spec={WAVEFORM_CHECKS[0]} />
      <CheckQuestion spec={WAVEFORM_CHECKS[1]} />
    </View>
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
    'A peak meter answers exactly one question: "will it clip?" Loudness lives in the AVERAGE energy. Flip between KICK/SNARE and SUSTAINED ORGAN at the same peak and compare the RMS and CREST FACTOR readouts — around 20 dB apart. Module 3’s VU needle turns that difference into something you can watch move.',
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
  const peakLabel = rawPeakDb >= 0 ? `OVER · +${rawPeakDb.toFixed(1)} dB` : fmtDbfs(rawPeakDb);
  const readouts = [
    { k: 'PEAK', v: peakLabel },
    { k: 'PEAK HOLD', v: `${peakLabel} (HELD)` },
    { k: 'OVER COUNT', v: `${overs}${overs > 0 ? ' — LAMP LATCHED' : ''}` },
    { k: 'RMS', v: fmtDbfs(db(rmsOf(proc))) },
    { k: 'CREST FACTOR', v: `${crestDb(proc).toFixed(1)} dB` },
  ];

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        <SignalChips
          options={PEAK_SIGNALS}
          selected={signal}
          onSelect={setSignal}
          help={p.help}
          helpKeys={PEAK_HELP}
          fallbackKey="peak_meter"
        />
        {viz ? (
          <PeakHost viz={viz} width={p.width} focused={p.focused} signal={signal} gainDb={gainDb} />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={HONESTY} />
        <DisplayGuideButton onPress={() => p.help('peak_meter')} />
        <DragSlider
          value={(gainDb + 12) / 30}
          onChange={(v) => setGainDb(snapHalfDb(-12 + v * 30))}
          label="GAIN — DRIVE IT INTO THE OVER LAMP"
          readout={fmtDb(gainDb)}
          onHelp={() => p.help('peak_hold')}
        />
        <ReadoutGrid items={readouts} />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>SAMPLE-BY-SAMPLE, THEN A MEMORY</Text>
        <Text style={dstyles.body}>
          The live bar tracks the instantaneous maximum — up in microseconds, falling slowly only
          so your eye can follow. The floating segment above it is PEAK HOLD, the highest recent
          peak kept on screen so you can mix without staring. Push GAIN until the top segment
          lights: that is the OVER lamp, and it LATCHES — one trip means full scale was already
          hit, however briefly. The OVER COUNT readout tallies each separate excursion.
        </Text>
        <Text style={dstyles.eyebrow}>WHAT PEAK CANNOT TELL YOU — PREVIEW OF MODULE 3</Text>
        <Text style={dstyles.body}>
          Set KICK and SUSTAINED ORGAN to the same peak and look at RMS: the meter face is
          identical while the average energy differs by the CREST FACTOR — around 20 dB. Peak is
          the converter's bodyguard, not a loudness meter. The next module puts a 300 ms needle on
          the same signals and makes that difference physical.
        </Text>
      </PanelCard>

      <MistakesCard items={PEAK_MISTAKES} />
      <CheckQuestion spec={PEAK_CHECK} />
    </View>
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

  const readouts = [
    { k: 'PEAK', v: fmtDbfs(db(peakOf(proc))) },
    { k: 'RMS', v: fmtDbfs(db(rmsOf(proc))) },
    { k: 'CREST FACTOR', v: `${crestDb(proc).toFixed(1)} dB` },
    { k: 'NEEDLE MAX (300 ms)', v: fmtDbfs(needleDb) },
    { k: 'NEEDLE LAG', v: '~300 ms — BY DESIGN' },
  ];

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        <SignalChips
          options={VU_SIGNALS}
          selected={signal}
          onSelect={setSignal}
          help={p.help}
          helpKeys={VU_HELP}
          fallbackKey="vu_meter"
        />
        {viz ? (
          <VuHost viz={viz} width={p.width} focused={p.focused} signal={signal} gainDb={gainDb} />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={HONESTY} />
        <DisplayGuideButton onPress={() => p.help('vu_meter')} />
        <DragSlider
          value={(gainDb + 12) / 24}
          onChange={(v) => setGainDb(snapHalfDb(-12 + v * 24))}
          label="GAIN"
          readout={fmtDb(gainDb)}
          onHelp={() => p.help('ballistics')}
        />
        <ReadoutGrid items={readouts} />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>THE LESSON — WATCH THE NEEDLE LOSE TO THE LED</Text>
        <Text style={dstyles.body}>
          Select SNARE: the peak LED flashes hard on every hit while the needle barely stirs — by
          the time 300 ms of ballistics get it moving, the hit is long over. The NEEDLE MAX readout
          shows how little of the peak it ever reaches. Now select SUSTAINED ORGAN: similar LED,
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
      </PanelCard>

      <MythReality
        myth="The VU meter is slow because it's old tech."
        reality="The 300 ms ballistic is a DESIGNED average — it reads like ears, not like converters."
      />

      <MistakesCard items={VU_MISTAKES} />
      <CheckQuestion spec={VU_CHECKS[0]} />
      <CheckQuestion spec={VU_CHECKS[1]} />
    </View>
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

  const readouts = [
    { k: 'INTEGRATED', v: `${sim.integratedLufs.toFixed(1)} LUFS` },
    { k: 'LOUDNESS RANGE', v: `${sim.lraLu.toFixed(1)} LU` },
    { k: 'MOMENTARY RANGE', v: `${momMin.toFixed(1)} … ${momMax.toFixed(1)} LUFS` },
    { k: 'SAMPLE PEAK', v: `${sim.samplePeakDbfs.toFixed(1)} dBFS` },
    { k: 'TRUE PEAK', v: `${sim.truePeakDbtp >= 0 ? '+' : ''}${sim.truePeakDbtp.toFixed(1)} dBTP` },
    { k: 'TP − SAMPLE GAP', v: `+${(sim.truePeakDbtp - sim.samplePeakDbfs).toFixed(1)} dB` },
  ];

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        <SignalChips
          options={LOUDNESS_SIGNALS}
          selected={signal}
          onSelect={setSignal}
          help={p.help}
          helpKeys={LOUDNESS_HELP}
          fallbackKey="lufs"
        />
        {viz ? (
          <LoudnessHost viz={viz} width={p.width} focused={p.focused} signal={signal} />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={HONESTY} />
        <Badge text={LOUDNESS_MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('lufs')} />
        <View style={dstyles.chipRow}>
          <LabChip label="ⓘ INTEGRATED" selected={false} onPress={() => p.help('integrated')} />
          <LabChip label="ⓘ M / S WINDOWS" selected={false} onPress={() => p.help('short_momentary')} />
          <LabChip label="ⓘ LRA" selected={false} onPress={() => p.help('lra')} />
          <LabChip label="ⓘ TRUE PEAK" selected={false} onPress={() => p.help('true_peak_meter')} />
        </View>
        <ReadoutGrid items={readouts} />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>WHY EVERYONE NORMALIZES BY INTEGRATED LUFS</Text>
        <Text style={dstyles.body}>
          Momentary (400 ms) answers "what is loud RIGHT NOW"; short-term (3 s) answers "how loud
          is this section"; integrated gates out the silence and averages the WHOLE program into
          one perception-weighted number. Streaming services (≈ −14 LUFS) and broadcast
          (−23/−24 LUFS) match programs by that one number, so listeners never ride the volume
          knob between tracks. Flip between SPEECH and MUSIC MIX: momentary dances, integrated
          barely breathes — different windows answering different questions.
        </Text>
        <Text style={dstyles.eyebrow}>THE −1 dBTP CEILING — MIND THE GAP</Text>
        <Text style={dstyles.body}>
          Compare SAMPLE PEAK with TRUE PEAK: the TP − SAMPLE GAP readout is the overshoot the
          reconstructed waveform makes BETWEEN samples. A file whose samples never touch full scale
          can still clip a DAC or a lossy encoder. Delivery specs park the true peak at −1 dBTP so
          the reconstruction — and the codec after it — always has room.
        </Text>
      </PanelCard>

      <ListeningSoonCard what="Level-matched loudness A/B comparison (same integrated LUFS, different crest and dynamics)" />

      <MistakesCard items={LOUDNESS_MISTAKES} />
      <CheckQuestion spec={LOUDNESS_CHECKS[0]} />
      <CheckQuestion spec={LOUDNESS_CHECKS[1]} />
    </View>
  );
}
