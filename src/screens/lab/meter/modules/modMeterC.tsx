/**
 * meter/modMeterC — Modules 8–11 of the Visual Audio Analysis Lab
 * (owner spec 2026-07-29): Phase Meter · Stereo Image · Oscilloscope ·
 * Signal Detective (the graduation exercise).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): each module renders the RackUnit
 * frame ITSELF (MeterModuleScreen gives rack modules the full height, no host
 * ScrollView). The display PINS on the stage with the standing honesty line as
 * its badge; the live numbers (correlation, mono fold, M/S split, case/score)
 * read on the bezel; continuous params ride the dock lane; settings live in
 * sticky trays. Only prose, mistakes and CheckQuestions scroll — each well
 * carries its own guided-lesson entry row at the bottom.
 *
 * NO Skia in this file: renderers load solely through skiaGate
 * (requireVizMeters / requireVizSpectral); pre-Skia clients render
 * VizUnavailableCard (§1.7) while every number that pure math can supply
 * (correlation, mono-fold) keeps working — meterEngine is JS-only.
 *
 * HONESTY: every display is driven by deterministic SYNTHESIZED TEACHING
 * SIGNALS from meterEngine (badged). Nothing here measures real audio.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markLabUnit, PASS_UNIT } from '../../../../features/lab/labCompletion';
import { LabChip, CollapsibleSection } from '../../LabShell';
import { CheckQuestion, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { MythReality, dstyles } from '../../digital/bits';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import {
  requireVizMeters,
  requireVizSpectral,
  type VizMetersModule,
  type VizSpectralModule,
} from '../skiaGate';
import {
  correlationOf,
  db,
  rmsOf,
  stereoPair,
  type SignalKey,
  type WaterfallOpts,
} from '../meterEngine';
import type { MeterModuleProps } from '../MeterModuleScreen';

/** The standing honesty badge (§1.7), silk-screened under every stage. */
const HONESTY = 'SYNTHESIZED TEACHING SIGNAL — NOTHING HERE MEASURES REAL AUDIO';

/** The well's guided-lesson entry row (rack modules own it — the host's bottom
 *  row only exists on non-rack modules; styling mirrors MeterModuleScreen). */
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

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 8 — PHASE METER (correlation + goniometer)

const PHASE_ZONES = [
  { mark: '+1', text: 'MONO-SAFE — channels agree; the sum keeps its level', color: '#5bff85' },
  { mark: '~0', text: 'WIDE / UNRELATED — big image, softer center focus', color: colors.amber },
  { mark: '−1', text: 'MONO-DEATH — opposite polarity; the sum cancels', color: '#ff6b5e' },
] as const;

const phaseZoneIdx = (corr: number) => (corr > 0.35 ? 0 : corr > -0.35 ? 1 : 2);

function ZoneCaptions({ corr }: { corr: number }) {
  const active = phaseZoneIdx(corr);
  return (
    <View style={{ gap: 5 }}>
      {PHASE_ZONES.map((z, i) => (
        <View key={z.mark} style={[styles.zoneRow, i === active && { borderColor: z.color }]}>
          <Text style={[styles.zoneMark, i === active && { color: z.color }]}>{z.mark}</Text>
          <Text style={[styles.zoneText, i === active && { color: colors.textPrimary }]}>{z.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** What a mono sum does to the current pair — the verdict line. */
function monoVerdict(corr: number, foldDb: number): string {
  const d = `${foldDb >= 0 ? '+' : ''}${foldDb.toFixed(1)} dB`;
  if (corr >= 0.5)
    return `MONO-FOLD VERDICT: SAFE — summed to one speaker this signal keeps its body (${d} vs the stereo channels).`;
  if (corr >= 0.1)
    return `MONO-FOLD VERDICT: SURVIVES — the wide content thins when summed (${d}); centered elements hold their level.`;
  if (corr >= -0.35)
    return `MONO-FOLD VERDICT: RISKY — near zero correlation the sides partially cancel (${d}); check this mix on a single speaker.`;
  return `MONO-FOLD VERDICT: CANCELLATION — near −1 the channels are polarity-opposite; the mono sum collapses toward silence (${d}).`;
}

const CHECK_PHASE_PA: CheckSpec = {
  question:
    'Your mix reads −1 on the correlation meter, and the venue PA sums everything to mono. What does the audience hear?',
  options: [
    'The same mix, just from one speaker stack',
    'Mostly silence — the two channels cancel each other out',
    'Only the reverb disappears; the dry mix survives',
    'The mix, about 3 dB louder',
  ],
  correctIdx: 1,
  reveal:
    '−1 means the right channel is the polarity-opposite of the left: every push in L is a pull in R. ' +
    'Sum them and they subtract — the mix collapses toward silence. That is why you read this meter ' +
    'BEFORE the mono bus (or a phone speaker) bites.',
  wrongHint: 'At −1, what is R doing at the exact instant L pushes forward?',
};

const CHECK_PHASE_HEALTHY: CheckSpec = {
  question: 'Where does a healthy stereo mix normally sit on a correlation meter?',
  options: [
    'Pinned at exactly +1 the whole time',
    'Hovering between about +0.3 and +1',
    'Sitting at exactly 0',
    'Dipping to −1 on the loud parts',
  ],
  correctIdx: 1,
  reveal:
    'Healthy stereo lives in the positive zone: mostly shared content, some width. Pinned at +1 means ' +
    'pure mono (no width at all); long visits below 0 mean cancellation is waiting on any mono sum.',
  wrongHint: 'Stereo needs SOME difference between the channels — but not opposition.',
};

function PhaseHero({
  vm,
  width,
  height,
  focused,
  width01,
  phaseDeg,
}: {
  vm: VizMetersModule;
  width: number;
  height?: number;
  focused: boolean;
  width01: number;
  phaseDeg: number;
}) {
  const phase = vm.usePhaseClock(focused, 0.8);
  return <vm.PhaseMeterView width={width} height={height} width01={width01} phaseDeg={phaseDeg} phase={phase} />;
}

export function PhaseModule(p: MeterModuleProps) {
  const vm = useState(() => requireVizMeters())[0];
  const [widthV, setWidthV] = useState(0.35);
  const [phaseV, setPhaseV] = useState(0);
  const phaseDeg = Math.round(phaseV * 180);

  // Correlation + mono fold computed HERE (pure meterEngine math) so the
  // numbers stay live even on pre-Skia clients.
  const { corr, foldDb } = useMemo(() => {
    const { l, r } = stereoPair(widthV, phaseDeg);
    const mono = l.map((v, i) => (v + r[i]) * 0.5);
    return {
      corr: correlationOf(l, r),
      foldDb: db(rmsOf(mono)) - db((rmsOf(l) + rmsOf(r)) / 2),
    };
  }, [widthV, phaseDeg]);

  const zoneColor = PHASE_ZONES[phaseZoneIdx(corr)].color;

  // PHASE is the teaching parameter (the MythReality drag): riding it toward
  // 180° is the cause; the correlation dive + mono-fold debt is the effect.
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'phase',
      label: 'PHASE',
      value: phaseV,
      onChange: setPhaseV,
      format: () => `${phaseDeg}° (R vs L)`,
      formatShort: () => `${phaseDeg}°`,
      helpKey: 'phase_meter',
    },
    {
      kind: 'fader',
      id: 'width',
      label: 'WIDTH',
      value: widthV,
      onChange: setWidthV,
      format: () => `${Math.round(widthV * 100)} %`,
      formatShort: () => `${Math.round(widthV * 100)}%`,
      helpKey: 'stereo_width',
    },
  ];

  const bezel: BezelItem[] = [
    { k: 'CORR', v: `${corr >= 0 ? '+' : ''}${corr.toFixed(2)}`, tint: zoneColor, helpKey: 'phase_meter' },
    { k: 'WIDTH', v: `${Math.round(widthV * 100)} %`, helpKey: 'stereo_width' },
    { k: 'PHASE', v: `${phaseDeg}°`, helpKey: 'phase_meter' },
    { k: 'MONO FOLD', v: `${foldDb >= 0 ? '+' : ''}${foldDb.toFixed(1)} dB`, tint: zoneColor, helpKey: 'phase_meter', flex: 1.15 },
  ];

  return (
    <RackUnit
      initialParam="phase"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: HONESTY,
        onGuide: () => p.help('phase_meter'),
        bezel,
        render: (w, h) =>
          vm ? (
            <PhaseHero vm={vm} width={w} height={h} focused={p.focused} width01={widthV} phaseDeg={phaseDeg} />
          ) : (
            <VizUnavailableCard />
          ),
      }}
    >
      <View style={styles.well}>
        <ZoneCaptions corr={corr} />
        <Text style={[styles.verdict, { color: zoneColor }]}>{monoVerdict(corr, foldDb)}</Text>

        <CollapsibleSection title="THE DOT CLOUD (GONIOMETER)">
          <Text style={dstyles.body}>
            The picture attached to the number: every instant of the stereo signal lands as one dot. A
            vertical line is mono, a fat ball is wide, and a HORIZONTAL line is pure anti-phase — the
            shape the correlation meter summarizes as −1. A lean to one side means channel imbalance.
          </Text>
          <DisplayGuideButton onPress={() => p.help('goniometer')} />
        </CollapsibleSection>

        <MythReality
          myth="Out-of-phase tricks just make a mix sound wider — the width is free."
          reality="The width is borrowed against mono compatibility. Drag PHASE toward 180° and watch: the image gets huge while the correlation dives to −1 — then read the MONO FOLD number. Any mono playback (club PA, phone, smart speaker) collects that debt."
        />
        <CheckQuestion spec={CHECK_PHASE_PA} />
        <CheckQuestion spec={CHECK_PHASE_HEALTHY} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 9 — STEREO IMAGE (presets + mid/side literacy)

type StereoPreset = 'mono' | 'narrow' | 'wide' | 'hardlr' | 'midside';

const STEREO_PRESETS: { key: StereoPreset; label: string; mid: string; side: string; caption: string }[] = [
  {
    key: 'mono',
    label: 'MONO',
    mid: '100 %',
    side: '0 %',
    caption:
      'One signal in both speakers: all Mid, zero Side. The image is a single point at center — total focus, no space.',
  },
  {
    key: 'narrow',
    label: 'NARROW',
    mid: '≈85 %',
    side: '≈15 %',
    caption:
      'Mostly shared content with a little difference: a focused center with a hint of air around it — typical of lead vocals and dialog beds.',
  },
  {
    key: 'wide',
    label: 'WIDE',
    mid: '≈55 %',
    side: '≈45 %',
    caption:
      'Side energy rivals Mid: the image spreads toward the speakers. Impressive on headphones — and the first thing to shrink when a mono sum arrives.',
  },
  {
    key: 'hardlr',
    label: 'HARD L-R',
    mid: '≈50 %',
    side: '≈50 %',
    caption:
      'Two different signals, one per speaker, nothing shared: maximum separation with a hole in the middle — the classic 1960s mix layout.',
  },
  {
    key: 'midside',
    label: 'MID-SIDE',
    mid: 'shared',
    side: 'difference',
    caption:
      'The same stereo signal DESCRIBED differently: Mid = what both speakers share, Side = what they disagree about. Every width move you will ever make is a change to this ratio.',
  },
];

const CHECK_MS: CheckSpec = {
  question: 'On a mid-side display, what exactly is the SIDE signal?',
  options: [
    'The right channel on its own',
    'Whatever both speakers are playing in common',
    'The DIFFERENCE between left and right',
    'The frequencies above 8 kHz',
  ],
  correctIdx: 2,
  reveal:
    'Side = L − R: only what the channels disagree about. Mid = what they share. Width is not a ' +
    'separate ingredient you sprinkle on — it IS the ratio of Side to Mid, and this display makes ' +
    'that ratio visible.',
  wrongHint: 'Mid is the shared part. Side is what remains when you subtract one channel from the other.',
};

function StereoHero({
  vm,
  width,
  height,
  focused,
  preset,
}: {
  vm: VizMetersModule;
  width: number;
  height?: number;
  focused: boolean;
  preset: StereoPreset;
}) {
  const phase = vm.usePhaseClock(focused, 0.7);
  return <vm.StereoImageView width={width} height={height} preset={preset} phase={phase} />;
}

export function StereoModule(p: MeterModuleProps) {
  const vm = useState(() => requireVizMeters())[0];
  const [preset, setPreset] = useState<StereoPreset>('mono');
  const cur = STEREO_PRESETS.find((s) => s.key === preset) ?? STEREO_PRESETS[0];

  // No continuous parameter in this module — the teaching collection is the
  // PRESET tray (sticky: A/B presets while the image reacts on the glass).
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'preset',
      label: 'PRESET',
      valueLabel: cur.label,
      selectedId: preset,
      onSelect: (id) => setPreset(id as StereoPreset),
      sticky: true,
      helpKey: 'stereo_width',
      // The preset captions already say exactly what each image means — the tray
      // shows them so the learner reads while A/B-ing (owner 2026-08-28).
      options: STEREO_PRESETS.map((s) => ({ id: s.key, label: s.label, blurb: s.caption })),
    },
  ];

  const bezel: BezelItem[] = [
    { k: 'PRESET', v: cur.label, helpKey: 'stereo_width' },
    { k: 'MID (SHARED)', v: cur.mid, helpKey: 'stereo_width', flex: 1.15 },
    { k: 'SIDE (DIFF)', v: cur.side, helpKey: 'stereo_width', flex: 1.15 },
  ];

  return (
    <RackUnit
      initialParam="preset"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: HONESTY,
        onGuide: () => p.help('stereo_width'),
        bezel,
        render: (w, h) =>
          vm ? (
            <StereoHero vm={vm} width={w} height={h} focused={p.focused} preset={preset} />
          ) : (
            <VizUnavailableCard />
          ),
      }}
    >
      <View style={styles.well}>
        <Text style={dstyles.caption}>{cur.caption}</Text>

        <CollapsibleSection title="MID = SHARED · SIDE = DIFFERENCE">
          <Text style={dstyles.body}>
            A stereo signal is two channels: LEFT and RIGHT. MID and SIDE are just a different way to
            look at those same two channels:
          </Text>
          <Text style={dstyles.body}>
            • MID = L + R — everything the two channels have IN COMMON. Anything panned dead center —
            lead vocal, bass, kick, snare — is fully in the Mid. If you collapse to mono, the Mid is
            all that is left.
          </Text>
          <Text style={dstyles.body}>
            • SIDE = L − R — everything the two channels DISAGREE about. A sound only appears in the
            Side to the extent it differs between left and right: hard-panned guitars, stereo room
            and reverb, widening effects, doubled parts. A perfectly centered sound has ZERO Side; a
            sound only in one speaker is half Mid, half Side.
          </Text>
          <Text style={dstyles.body}>
            WIDTH is not a separate effect — it is simply how loud Side is compared to Mid. Turn Side
            UP and the image spreads (more size, less focus); turn it DOWN toward zero and everything
            pulls back to the center (mono). That is why a mono fold-down — which throws the Side away
            and keeps only the Mid — reveals exactly what was hiding in the difference signal.
          </Text>
        </CollapsibleSection>

        <MythReality
          myth="Wider is always better — push every element to the sides."
          reality="Width is a position, not a quality. Compare WIDE and HARD L-R with MONO: what the sides gain in size, the center loses in focus — and everything in Side vanishes from a mono sum. Great mixes SPEND width on a few elements and keep the anchors in the Mid."
        />
        <CheckQuestion spec={CHECK_MS} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 10 — OSCILLOSCOPE (+ X-Y / Lissajous mode)

// Blurbs are TRACE-focused (what the scope draws), not meter-focused — this is
// the raw-voltage view, so describe the shape the learner is about to see.
const SCOPE_SIGNALS: { key: SignalKey; label: string; blurb: string }[] = [
  { key: 'sine', label: 'SINE', blurb: 'One frequency, no harmonics: a single smooth curve — the purest trace a scope can draw.' },
  { key: 'square', label: 'SQUARE', blurb: 'Flat shelves with near-vertical edges. Those fast edges ARE the high harmonics — the scope shows you why a square sounds bright.' },
  { key: 'triangle', label: 'TRIANGLE', blurb: 'Straight ramps meeting at points. Same odd harmonics as a square but fading fast — gentler corners, gentler sound.' },
  { key: 'saw', label: 'SAW', blurb: 'A steady ramp up and an instant drop. Every harmonic present — the buzzy synth staple.' },
  { key: 'speech', label: 'SPEECH', blurb: 'Irregular bursts with true silence between them. No repeating shape to lock onto — this is what real signals look like raw.' },
  { key: 'music', label: 'MUSIC', blurb: 'A dense, ever-changing pile of everything at once. The scope shows activity, not notes — which is why other meters exist.' },
];

const CHECK_SCOPE_SQUARE: CheckSpec = {
  question: 'Same pitch, same level — how do you tell a square wave from a sine on the oscilloscope?',
  options: [
    'You cannot — at the same level they trace the same shape',
    'The square is twice as tall as the sine',
    'The square sits on flat shelves with fast vertical edges; the sine is one smooth curve',
    'The square moves across the screen faster',
  ],
  correctIdx: 2,
  reveal:
    'The scope is the raw voltage picture. A sine bends smoothly through every level; a square SITS ' +
    'at two levels and jumps between them. That same eye is your clipping detector: when a wave ' +
    'grows flat tops it was not born with, it is slamming into a ceiling right there.',
  wrongHint: 'Think about the SHAPE the voltage traces over time, not its size or speed.',
};

const CHECK_LISSAJOUS_LINE: CheckSpec = {
  question: 'In X-Y mode the trace collapses to a thin diagonal line at 45°. What is the signal doing?',
  options: [
    'The channels are identical — the signal is mono',
    'The channels are in opposite polarity',
    'The left channel has dropped out',
    'The signal is maximally wide',
  ],
  correctIdx: 0,
  reveal:
    'Left drives X, right drives Y. Identical channels mean X always equals Y, so every dot lands on ' +
    'the 45° diagonal — mono. The OPPOSITE diagonal is the danger picture (R always the negative of ' +
    'L: anti-phase), and a cloud between them is real stereo.',
  wrongHint: 'X = left, Y = right. If the dot never leaves x = y, what is R doing relative to L?',
};

function ScopeHero({
  vm,
  width,
  height,
  focused,
  signal,
  xy,
  width01,
  phaseDeg,
}: {
  vm: VizMetersModule;
  width: number;
  height?: number;
  focused: boolean;
  signal: SignalKey;
  xy: boolean;
  width01: number;
  phaseDeg: number;
}) {
  const phase = vm.usePhaseClock(focused, xy ? 0.8 : 0.6);
  return (
    <vm.ScopeView
      width={width}
      height={height}
      signal={signal}
      xy={xy}
      width01={width01}
      phaseDeg={phaseDeg}
      phase={phase}
    />
  );
}

export function ScopeModule(p: MeterModuleProps) {
  const vm = useState(() => requireVizMeters())[0];
  const [signal, setSignal] = useState<SignalKey>('sine');
  const [xy, setXy] = useState(false);
  const [widthV, setWidthV] = useState(0);
  const [phaseV, setPhaseV] = useState(0);
  const phaseDeg = Math.round(phaseV * 180);
  const sigLabel = SCOPE_SIGNALS.find((s) => s.key === signal)?.label ?? 'SINE';

  // Correlation of the X-Y pair — same math the phase module teaches.
  const corr = useMemo(() => {
    const { l, r } = stereoPair(widthV, phaseDeg);
    return correlationOf(l, r);
  }, [widthV, phaseDeg]);

  // Riding a Lissajous lane IS entering X-Y mode (cause→effect, zero taps —
  // the LiveSpectrumEq bellFader idiom).
  const xyFader = (set: (v: number) => void) => (v: number) => {
    if (!xy) setXy(true);
    set(v);
  };

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'signal',
      label: 'SIGNAL',
      valueLabel: sigLabel,
      selectedId: signal,
      onSelect: (id) => setSignal(id as SignalKey),
      sticky: true,
      helpKey: 'oscilloscope',
      options: SCOPE_SIGNALS.map((s) => ({ id: s.key, label: s.label, blurb: s.blurb })),
    },
    {
      kind: 'toggle',
      id: 'xy',
      label: 'X-Y',
      value: xy,
      onToggle: () => setXy((v) => !v),
      helpKey: 'lissajous',
    },
    {
      kind: 'fader',
      id: 'width',
      label: 'WIDTH',
      value: widthV,
      onChange: xyFader(setWidthV),
      format: () => `${Math.round(widthV * 100)} %`,
      formatShort: () => `${Math.round(widthV * 100)}%`,
      helpKey: 'lissajous',
    },
    {
      kind: 'fader',
      id: 'phase',
      label: 'PHASE',
      value: phaseV,
      onChange: xyFader(setPhaseV),
      format: () => `${phaseDeg}° (R vs L)`,
      formatShort: () => `${phaseDeg}°`,
      helpKey: 'lissajous',
    },
  ];

  const bezel: BezelItem[] = [
    // MODE cell taps to flip TIME ↔ X-Y (PK-HOLD-style tap cell).
    { k: 'MODE', v: xy ? 'X-Y' : 'TIME', onPress: () => setXy((v) => !v), helpKey: 'lissajous' },
    { k: 'SIGNAL', v: xy ? '—' : sigLabel, helpKey: 'oscilloscope' },
    { k: 'CORR', v: xy ? `${corr >= 0 ? '+' : ''}${corr.toFixed(2)}` : '—', helpKey: 'lissajous' },
    { k: 'WIDTH', v: xy ? `${Math.round(widthV * 100)} %` : '—', helpKey: 'lissajous' },
  ];

  return (
    <RackUnit
      initialParam="phase"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: HONESTY,
        onGuide: () => p.help(xy ? 'lissajous' : 'oscilloscope'),
        bezel,
        render: (w, h) =>
          vm ? (
            <ScopeHero
              vm={vm}
              width={w}
              height={h}
              focused={p.focused}
              signal={signal}
              xy={xy}
              width01={widthV}
              phaseDeg={phaseDeg}
            />
          ) : (
            <VizUnavailableCard />
          ),
      }}
    >
      <View style={styles.well}>
        <Text style={dstyles.caption}>
          {xy
            ? 'Left drives X, right drives Y: a thin 45° line = MONO (L and R identical). The OPPOSITE diagonal = anti-phase — the mono-death picture. A cloud between them is real stereo. Riding WIDTH or PHASE switches X-Y mode on.'
            : 'Reading flat-tops: when the trace slams into a ceiling and flattens, clipping is happening RIGHT THERE — whatever the meters further down the chain claim.'}
        </Text>

        <CollapsibleSection title="THE RAWEST VIEW">
          <Text style={dstyles.body}>
            The oscilloscope draws the voltage itself against time — no averaging, no ballistics, no
            weighting. Sine = one smooth curve, square = shelves with fast edges, saw = ramps, speech =
            bursts with gaps. It answers one question no other meter answers as directly: what is the
            signal actually DOING right now?
          </Text>
        </CollapsibleSection>

        <MythReality
          myth="If no meter shows red, nothing is clipping anywhere in the chain."
          reality="Meters read the point where they are inserted. The scope shows the waveform itself — flat-tops mean clipping is happening at THIS point in the chain, even when a meter later in the path (after a pad or trim) reads a polite level."
        />
        <CheckQuestion spec={CHECK_SCOPE_SQUARE} />
        <CheckQuestion spec={CHECK_LISSAJOUS_LINE} />
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 11 — SIGNAL DETECTIVE (the graduation exercise)

type CaseKind = 'dc' | 'over' | 'hum' | 'feedback' | 'ring' | 'antiphase' | 'vu';

type DetectiveCase = {
  kind: CaseKind;
  visHz: number;
  what: CheckSpec;
  shows: CheckSpec;
  problem: CheckSpec;
  fix: CheckSpec;
};

const RING_OPTS: WaterfallOpts = { room: 'classroom', damping01: 0.15, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb: 'none' };

// -- Solved-question store (learning pass 2026-08-31) -----------------------
// ape:* prefix means it is wiped on account switch with every other local
// mirror (clearLocalAccountData).
const SOLVED_KEY = 'ape:detectiveSolved';
let solvedCache: Set<string> | null = null;
async function hydrateSolved(): Promise<Set<string>> {
  if (solvedCache) return solvedCache;
  try {
    const raw = await AsyncStorage.getItem(SOLVED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : null;
    solvedCache = new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    solvedCache = new Set();
  }
  return solvedCache;
}
function persistSolved(s: Set<string>): void {
  solvedCache = new Set(s);
  void AsyncStorage.setItem(SOLVED_KEY, JSON.stringify([...s])).catch(() => {});
}
/** Reset the in-memory solved set on account switch / guest entry (called by
 *  resetAllLocalStores — B-154). Without this the next person's SOLVED count
 *  started from the departing user's set until a relaunch; the store re-hydrates
 *  from the (now-cleared) key on the next mount. */
export function resetLocal(): void {
  solvedCache = null;
}

// Options de-cued (learning pass 2026-08-31): the correct answer was
// systematically the LONGEST and carried its own definition -- a length cue
// the shuffle cannot fix. Correct options now match distractor register; the
// reveals carry the teaching. NEW COPY -- owner review.
const CASES: DetectiveCase[] = [
  {
    kind: 'dc',
    visHz: 0.7,
    what: {
      question: 'WHAT METER IS THIS?',
      options: ['A goniometer', 'A waveform display', 'A spectrum analyzer', 'A loudness history'],
      correctIdx: 1,
      reveal:
        'The DAW picture: amplitude on the vertical axis, time running left to right, with the zero line through the middle and the 0 dBFS rails at the edges.',
      wrongHint: 'The horizontal axis here is TIME, and there is a center zero line.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'A wave clipping both rails',
        'Random broadband noise',
        'A wave riding above the zero line',
        'Two channels out of phase',
      ],
      correctIdx: 2,
      reveal:
        'The shape itself is healthy — but the whole trace is shifted upward. Its average is not zero: it spends more of its life above the line than below it.',
      wrongHint: 'Compare where the wave is centered against where the zero line is.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: ['Aliasing', 'Mains hum', 'Phase cancellation', 'DC offset'],
      correctIdx: 3,
      reveal:
        'A constant (0 Hz) component rides under the audio. It eats headroom asymmetrically — the top clips early while the bottom has room to spare — parks speaker cones off-center, and makes edits click.',
      wrongHint: 'What frequency is a constant shift upward? (Hint: it never oscillates.)',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'A compressor',
        'A gentle high-pass / DC filter',
        'A stereo widener',
        'A de-esser',
      ],
      correctIdx: 1,
      reveal:
        'A DC-removal filter (a high-pass at a few Hz) passes all the audio and blocks the constant — the wave recenters on zero and the symmetric headroom comes back. Compression would just squash the already-shifted signal.',
      wrongHint: 'The fault lives BELOW the audio band. Which processor removes only that?',
    },
  },
  {
    kind: 'over',
    visHz: 0.9,
    what: {
      question: 'WHAT METER IS THIS?',
      options: ['A VU meter', 'A spectrogram', 'A digital peak meter', 'A correlation meter'],
      correctIdx: 2,
      reveal:
        'A segment ladder in dBFS with a hold bar parked at the recent maximum and an OVER lamp that latches when full scale is hit — the digital recording safety meter.',
      wrongHint: 'Segments, a hold bar, and a latched warning lamp at the very top.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'Average loudness in LUFS',
        'Peaks pinned at the top, OVER latched',
        'Frequency balance',
        'Stereo width',
      ],
      correctIdx: 1,
      reveal:
        'The bar keeps slamming the top of the scale and the latched OVER says full scale has already been hit at least once. Peak meters answer exactly one question: how close are the biggest instants to 0 dBFS?',
      wrongHint: 'This ladder reads instants, not averages — and its warning lamp has tripped.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'The channel is clipping',
        'Too much bass',
        'Nothing — meters should look like this',
        'Feedback',
      ],
      correctIdx: 0,
      reveal:
        'Hitting full scale means the converter has run out of numbers: the waveform is flat-topped and the distortion is already recorded. The latched OVER exists so you catch it even if you looked away.',
      wrongHint: 'What happens to a digital signal at the moment it reaches full scale?',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'EQ out the high frequencies',
        'Turn the monitor volume down',
        'Add reverb to soften it',
        'Trim the gain upstream',
      ],
      correctIdx: 3,
      reveal:
        'Turn the SIGNAL down at its source (input gain / trim), not your speakers — monitor volume changes what you hear, never what gets recorded. Leave honest headroom and the OVER lamp stays dark.',
      wrongHint: 'The problem is the recorded level itself. Which knob changes THAT?',
    },
  },
  {
    kind: 'hum',
    visHz: 0.6,
    what: {
      question: 'WHAT METER IS THIS?',
      options: ['A spectrum analyzer', 'A waveform display', 'A waterfall (CSD)', 'A phase meter'],
      correctIdx: 0,
      reveal:
        'Level on the vertical axis, frequency on a log horizontal axis, one snapshot in time — the display that answers WHAT frequencies the signal is made of.',
      wrongHint: 'The horizontal axis here is FREQUENCY, not time.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'Broadband pink noise',
        'One tall spike at 1.75 kHz',
        'Spikes at 60 Hz and its exact multiples',
        'A speech formant pattern',
      ],
      correctIdx: 2,
      reveal:
        'Narrow, evenly spaced spikes marching up from 60 Hz in exact multiples — a harmonic series of the power-line frequency, sitting there whether or not anything is playing.',
      wrongHint: 'Look at the SPACING of the spikes — they are exact multiples of one low frequency.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'Feedback building up',
        'Mains hum',
        'DC offset',
        'Aliasing',
      ],
      correctIdx: 1,
      reveal:
        'The 60 Hz comb is the electrical fingerprint of the power line riding on your audio — classically a ground loop between two powered devices, or an unbalanced cable running beside power.',
      wrongHint: 'What in every studio oscillates at exactly 60 Hz, forever?',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'A limiter',
        'Boost the low end to mask it',
        'A stereo widener',
        'Fix the grounding, then notch the residue',
      ],
      correctIdx: 3,
      reveal:
        'Cure the electrical cause first: break the ground loop (one ground path, proper balanced connections, reroute cables away from power). Notch filters at 60/120/180 Hz are the mop-up for whatever tiny residue remains — not the primary fix.',
      wrongHint: 'The hum enters through the WIRING. Where does the real fix live?',
    },
  },
  {
    kind: 'feedback',
    visHz: 0.5,
    what: {
      question: 'WHAT METER IS THIS?',
      options: ['An oscilloscope', 'A peak meter', 'A spectrogram', 'A stereo image display'],
      correctIdx: 2,
      reveal:
        'Time runs left to right, frequency climbs the vertical axis, and color carries level — the display that shows how the spectrum CHANGES over time.',
      wrongHint: 'Two axes plus COLOR as the third dimension.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'One horizontal line, growing hotter',
        'Vertical stripes on every beat',
        'A broadband noise wash',
        'A falling whistle',
      ],
      correctIdx: 0,
      reveal:
        'A single frequency, sustained and BRIGHTENING with time: energy at one spot on the frequency axis that grows instead of decaying. Nothing musical holds one pitch and gets louder by itself.',
      wrongHint: 'Horizontal = one frequency held over time. And it is growing.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'Tape hiss',
        'Feedback between a mic and a speaker',
        'A synthesizer pad',
        'A dropped channel',
      ],
      correctIdx: 1,
      reveal:
        'The mic hears the speaker, the speaker replays the mic, and at one frequency the loop gain has passed 1 — so that frequency circles and GROWS. Seconds later it is the scream everyone knows.',
      wrongHint: 'What loop makes one frequency feed itself louder and louder?',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'Compress the mix bus',
        'Notch the ringing frequency, fix the geometry',
        'A subharmonic synthesizer',
        'More reverb',
      ],
      correctIdx: 1,
      reveal:
        'Two-part fix: a narrow notch drops the loop gain below 1 at the ringing frequency (ringing out), and the GEOMETRY — mic behind the speakers, tighter pickup pattern, less distance gain — stops the loop from finding the next frequency.',
      wrongHint: 'You must break the LOOP: attack the frequency, then the acoustics feeding it.',
    },
  },
  {
    kind: 'ring',
    // Waterfall case — REAL-TIME clock so the decay crosses each 1-second floor
    // marker at one real second (owner 2026-08-05; = WF_GROW_END / WF_T_MAX).
    visHz: 0.1333,
    what: {
      question: 'WHAT METER IS THIS?',
      options: [
        'A spectrogram',
        'A loudness meter',
        'A goniometer',
        'A waterfall (CSD)',
      ],
      correctIdx: 3,
      reveal:
        'The pseudo-3D mountain range: frequency across, amplitude up, and TIME receding into the picture — each slice is the spectrum a moment later. Built to show how each frequency DECAYS.',
      wrongHint: 'Three axes, drawn as a mountain range collapsing toward the back.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'All frequencies decaying at the same speed',
        'A ridge near 250 Hz that will not decay',
        'A peak-hold bar',
        'Two channels cancelling',
      ],
      correctIdx: 1,
      reveal:
        'Most of the range collapses quickly toward the back of the picture — but one narrow ridge around 250 Hz keeps standing, slicing deep into the time axis. One frequency refuses to die.',
      wrongHint: 'Compare how far back into TIME each part of the mountain survives.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'A room mode ringing at ~250 Hz',
        'Clipping',
        'Mains hum',
        'DC offset',
      ],
      correctIdx: 0,
      reveal:
        'A room mode: at ~250 Hz the room stores energy and releases it slowly, so that frequency booms and smears long after the source stops. Level meters barely notice — this is a TIME problem, which is exactly what the waterfall exists to expose.',
      wrongHint: 'The fault is not how LOUD 250 Hz is — it is how LONG it lasts.',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'Cut 250 Hz on an EQ — problem solved',
        'A noise gate',
        'Acoustic treatment tuned to that frequency',
        'A brighter loudspeaker',
      ],
      correctIdx: 2,
      reveal:
        'The classic trap: EQ shapes LEVEL, but the ridge is a TIME problem — cut 250 Hz and the ring is quieter yet rings exactly as long. Only absorbing the stored energy (tuned traps, thick porous absorption) shortens the decay. Watch the ridge on this display shrink as treatment goes in.',
      wrongHint: 'Can an equalizer change how LONG a room stores energy?',
    },
  },
  {
    kind: 'antiphase',
    visHz: 0.8,
    what: {
      question: 'WHAT METER IS THIS?',
      options: [
        'A VU meter',
        'A correlation meter + goniometer',
        'A spectrum analyzer',
        'A waveform display',
      ],
      correctIdx: 1,
      reveal:
        'The −1…+1 correlation scale plus the dot cloud (goniometer): the pair of displays that read the RELATIONSHIP between left and right rather than either channel alone.',
      wrongHint: 'The scale runs from −1 to +1 — what quantity lives on that scale?',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'Correlation parked near −1',
        'Correlation at +1 — pure mono',
        'A healthy wide mix around +0.5',
        'A level imbalance toward the left channel',
      ],
      correctIdx: 0,
      reveal:
        'The needle lives at the far left of the scale and the cloud has collapsed toward the anti-phase diagonal: whatever left does, right does the OPPOSITE, nearly all the time.',
      wrongHint: 'Which END of the −1…+1 scale is the reading pinned against?',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'Too much stereo width',
        'The right channel is muted',
        'Hum',
        'The channels are nearly opposite polarity',
      ],
      correctIdx: 3,
      reveal:
        'Near −1 the two channels fight: summed to mono (club PA, phone speaker, broadcast fold-down) they subtract and the mix collapses. On speakers it may even sound impressively huge — the meter is the early warning.',
      wrongHint: 'Think about what L + R equals when R ≈ −L.',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'Acoustic treatment',
        'Flip Ø on the inverted channel',
        'A limiter',
        'Turn the monitors up',
      ],
      correctIdx: 1,
      reveal:
        'Find the cause and undo it: a polarity flip (Ø) on the inverted side, a cable with hot and cold swapped, a plugin inverting one channel, or misaligned mics that need time alignment. Watch this meter swing from −1 toward +1 as the fix lands.',
      wrongHint: 'One channel is upside-down. Which one-button fix turns it right-side up?',
    },
  },
  {
    kind: 'vu',
    visHz: 0.9,
    what: {
      question: 'WHAT METER IS THIS?',
      options: [
        'A digital peak meter',
        'A loudness (LUFS) meter',
        'A VU meter with a peak LED',
        'A Lissajous display',
      ],
      correctIdx: 2,
      reveal:
        'The cream face, the −20…+3 arc, the red zone, the swinging needle — the classic VU, here paired with the fast peak LED that traditionally guards it.',
      wrongHint: 'A needle on an arc scale, plus one small fast lamp beside it.',
    },
    shows: {
      question: 'WHAT DOES IT SHOW?',
      options: [
        'The needle pinned in the red',
        'Needle low, peak LED firing on every hit',
        'A steady tone parked at 0 VU',
        'DC offset',
      ],
      correctIdx: 1,
      reveal:
        'Two readings that disagree on purpose: the slow needle barely stirs while the LED fires on every snare hit. Needle = average level; LED = the instantaneous peaks the needle physically cannot reach.',
      wrongHint: 'Watch BOTH indicators — one is slow, one is instant.',
    },
    problem: {
      question: 'WHAT PROBLEM DO YOU SEE?',
      options: [
        'The meter is broken — the needle and the LED disagree',
        'The channel is clipping',
        'Phase cancellation',
        'Nothing — high crest factor, both meters honest',
      ],
      correctIdx: 3,
      reveal:
        'This is normal transient material. The VU integrates ~300 ms BY DESIGN — it reads average, like your ears read loudness — so a short snare crack barely moves it while the peak LED catches every spike. The disagreement IS the information: it is the crest factor made visible.',
      wrongHint: 'Is either indicator actually lying? What does each one measure?',
    },
    fix: {
      question: 'WHAT PROCESSOR/ACTION FIXES IT?',
      options: [
        'Compress until the needle and LED finally agree',
        'None — read both; they answer different questions',
        'Replace the VU with a faster needle',
        'A high-pass filter',
      ],
      correctIdx: 1,
      reveal:
        'Not every reading is a problem. The pair is telling you the signal is peaky — useful truth, no fault. Compressing merely to make two meters agree would trade the snare’s crack for a meter aesthetic. Know your meter, trust your ears.',
      wrongHint: 'First decide: is anything actually WRONG with the audio here?',
    },
  },
];

function CaseHero({
  vm,
  vs,
  width,
  height,
  focused,
  kase,
}: {
  vm: VizMetersModule;
  vs: VizSpectralModule;
  width: number;
  height?: number;
  focused: boolean;
  kase: DetectiveCase;
}) {
  const phase = vm.usePhaseClock(focused, kase.visHz);
  if (kase.kind === 'dc')
    return <vm.WaveformView width={width} height={height} signal="sine" gain={0.55} dcOffset={0.35} showClip phase={phase} />;
  if (kase.kind === 'over') return <vm.PeakMeterView width={width} height={height} signal="music" gain={2.2} phase={phase} />;
  if (kase.kind === 'hum') return <vs.SpectrumPatternView width={width} height={height} pattern="hum" phase={phase} />;
  if (kase.kind === 'feedback')
    return <vs.SpectrogramPatternView width={width} height={height} pattern="feedback" phase={phase} />;
  if (kase.kind === 'ring') return <vs.WaterfallView width={width} height={height} opts={RING_OPTS} animate phase={phase} />;
  if (kase.kind === 'antiphase')
    return <vm.PhaseMeterView width={width} height={height} width01={0.15} phaseDeg={175} phase={phase} />;
  return <vm.VuMeterView width={width} height={height} signal="snare" showPeakLed phase={phase} />;
}

export function DetectiveModule(p: MeterModuleProps) {
  const vm = useState(() => requireVizMeters())[0];
  const vs = useState(() => requireVizSpectral())[0];
  const [idx, setIdx] = useState(0);
  // One question at a time within the current case (owner 2026-08-05).
  const [step, setStep] = useState(0);
  // Hydrate previously-solved questions once (module cache first, then disk).
  useEffect(() => {
    let live = true;
    void hydrateSolved().then((set) => {
      if (!live) return;
      set.forEach((k) => solvedRef.current.add(k));
      setSolvedN(solvedRef.current.size);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const n = CASES.length;
  const kase = CASES[idx];
  const specs = [kase.what, kase.shows, kase.problem, kase.fix];
  const qCount = specs.length;
  // R6c: the Signal Detective standalone lab completes on a genuine PASS — every
  // question of every case answered correctly at least once (the whole
  // graduation deck). CheckQuestion remounts per case+step, so aggregate here.
  // solvedN mirrors the ref as state so the bezel SOLVED cell reads live.
  // Persisted (learning pass 2026-08-31): this used to be a bare useRef, so
  // backing out of the module at 27/28 threw the whole run away.
  const solvedRef = useRef<Set<string>>(new Set(solvedCache ?? []));
  const [solvedN, setSolvedN] = useState(solvedRef.current.size);
  const onSolved = () => {
    solvedRef.current.add(`${idx}-${step}`);
    setSolvedN(solvedRef.current.size);
    persistSolved(solvedRef.current);
    if (solvedRef.current.size >= n * qCount) markLabUnit('af_signal_detective', PASS_UNIT);
  };
  const goCase = (next: number) => {
    setIdx(((next % n) + n) % n);
    setStep(0); // new case → back to its first question
  };

  // The evidence PINS on the stage (rack law): the unlabeled display stays
  // visible while every question below is read and answered. Case nav = dock
  // action keys; round/score live on the bezel.
  const params: DockParam[] = [
    { kind: 'action', id: 'prev', label: '‹ PREV', onPress: () => goCase(idx - 1) },
    { kind: 'action', id: 'next', label: 'NEXT ›', onPress: () => goCase(idx + 1) },
  ];

  const bezel: BezelItem[] = [
    { k: 'CASE', v: `${idx + 1}/${n}`, helpKey: 'detective' },
    { k: 'QUESTION', v: `${step + 1}/${qCount}`, helpKey: 'detective' },
    { k: 'SOLVED', v: `${solvedN}/${n * qCount}`, tint: solvedN >= n * qCount ? '#5bff85' : undefined, helpKey: 'detective' },
  ];

  return (
    <RackUnit
      initialParam="case"
      params={params}
      onHelp={p.help}
      stage={{
        size: 'L',
        badge: HONESTY,
        onGuide: () => p.help('detective'),
        bezel,
        render: (w, h) =>
          vm && vs ? (
            <CaseHero vm={vm} vs={vs} width={w} height={h} focused={p.focused} kase={kase} />
          ) : (
            <VizUnavailableCard />
          ),
      }}
    >
      <View style={styles.well}>
        {/* ONE question at a time (owner 2026-08-05) — keyed per case+step so it
            resets cleanly. Move between the case's four questions below. */}
        <CheckQuestion key={`${idx}-${step}`} spec={specs[step]} onSolved={onSolved} />
        <View style={dstyles.chipRow}>
          <LabChip
            label="‹ PREVIOUS"
            selected={false}
            onPress={() => (step > 0 ? setStep(step - 1) : goCase(idx - 1))}
          />
          {step < qCount - 1 ? (
            <LabChip label="NEXT QUESTION ›" selected={false} onPress={() => setStep(step + 1)} />
          ) : (
            <LabChip label="NEXT CASE ›" selected={false} onPress={() => goCase(idx + 1)} />
          )}
        </View>

        <CollapsibleSection title="THE GRADUATION EXERCISE">
          <Text style={dstyles.body}>
            An unlabeled display, configured with a real-world fault. Work each case in order: name the
            meter, read what it shows, spot the problem, prescribe the fix. Everything you learned in
            modules 1–10 is in this deck.
          </Text>
        </CollapsibleSection>

        <CollapsibleSection title="WHY IT WORKS">
          <Text style={dstyles.caption}>
            Wrong guesses teach as much as right ones — every reveal explains WHY the answer is what it
            is. Cycle the deck until naming the meter, reading the story, spotting the fault and
            prescribing the fix is automatic. That reflex is the whole lab.
          </Text>
        </CollapsibleSection>
        <LessonRow onPress={() => p.help()} />
      </View>
    </RackUnit>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  well: { gap: 12 },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#0f0f13',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  zoneMark: { fontFamily: fonts.mono, fontSize: 13, width: 26, color: colors.textSub },
  zoneText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  verdict: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  // The rack well's guided-lesson entry row — mirrors MeterModuleScreen's
  // lessonRow styling (the host only renders its own row for non-rack modules).
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
