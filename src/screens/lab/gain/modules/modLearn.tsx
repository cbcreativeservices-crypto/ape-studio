/**
 * Gain Staging Lab — the five LEARN modules, RACK UNIT layout (owner spec +
 * edit pass 2026-08-07; rack conversion APE_LAB_UX_PROPOSAL 2026-08-23). Each
 * module renders the RackUnit frame itself: the whole signal chain PINS on the
 * stage glass as columns (MIDI-coloured 3-zone meters, FIXED tags on every
 * stage the user cannot touch), the live numbers read on the bezel, the gain
 * faders ride the dock lane, and only the prose / legend / feedback /
 * check-questions scroll in the well. Principle-first — no "hit −18" targets.
 * Law: reading may scroll; operating may not.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { ChainStage, sourceDesc, stageStatus, stageTint, type StageColSpec } from '../gainViz';
import { computeChain, type Stage } from '../gainEngine';
import type { GainModuleComponentProps } from './registry';

const mk = (key: string, name: string, kind: Stage['kind'], gain: number, min: number, max: number, adjustable: boolean): Stage => ({
  key, name, kind, gain, min, max, adjustable,
});

/** Honesty badge on every gain-chain glass: the meters are a simulation on a
 *  relative scale (0 = the overload ceiling) — never a measurement. */
const BADGE = 'SIMULATED SIGNAL CHAIN · RELATIVE dB';

const fmtDb = (v: number) => `${v >= 0 ? '+' : ''}${v} dB`;
const fmtG = (v: number) => `${v >= 0 ? '+' : ''}${v}`;
const fmtLv = (lv: number) => `${Math.round(lv)} dB`;

/** The too-low / healthy / overload legend, shown once up top. */
function ZoneLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}><View style={[styles.sw, { backgroundColor: '#2f74ff' }]} /><Text style={styles.legendText}>TOO LOW</Text></View>
      <View style={styles.legendItem}><View style={[styles.sw, { backgroundColor: '#3fae52' }]} /><Text style={styles.legendText}>HEALTHY</Text></View>
      <View style={[styles.legendItem]}><View style={[styles.sw, { backgroundColor: '#ff5f4e' }]} /><Text style={styles.legendText}>OVERLOAD</Text></View>
    </View>
  );
}

// ───────────────────────────────────────── 1 · What Gain Staging Is ─────────
const INTRO_CHECK: CheckSpec = {
  question: 'Gain staging is mostly about…',
  options: [
    'Making every stage as loud as possible',
    'Keeping the signal in each stage’s healthy operating range',
    'Turning the final output all the way up',
  ],
  correctIdx: 1,
  reveal:
    'Gain staging keeps the signal comfortably within the usable range of EACH stage — enough level to stay above the noise, enough headroom to avoid overload. It is not a race to be loud.',
  wrongHint: 'Louder isn’t the goal — a healthy, consistent level from stage to stage is.',
};

export function IntroModule(_p: GainModuleComponentProps) {
  const [source, setSource] = useState(-30);
  const stages = useMemo(
    () => [mk('pre', 'Preamp', 'preamp', 18, 0, 40, false), mk('out', 'Output', 'output', 0, -30, 6, false)],
    [],
  );
  const nodes = computeChain(source, stages);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'src',
      label: 'SOURCE',
      value: (source + 40) / 34,
      onChange: (t) => setSource(Math.round(-40 + t * 34)),
      format: () => `${source} dB`,
      tint: stageTint(nodes[0]),
    },
  ];
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], readout: `${source} dB` },
    { key: 'pre', name: 'PREAMP', kind: 'preamp', node: nodes[1], fixed: true },
    { key: 'out', name: 'OUTPUT', kind: 'output', node: nodes[2], fixed: true },
  ];
  return (
    <RackUnit
      initialParam="src"
      params={params}
      stage={{
        size: 'M',
        badge: BADGE,
        bezel: [
          { k: 'SOURCE', v: fmtLv(nodes[0].level), tint: stageTint(nodes[0]) },
          { k: 'PREAMP', v: fmtLv(nodes[1].level), tint: stageTint(nodes[1]) },
          { k: 'OUTPUT', v: fmtLv(nodes[2].level), tint: stageTint(nodes[2]) },
          { k: 'STATUS', ...stageStatus(nodes[2]) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          A signal travels left to right through a chain of stages — source, preamp, output. Each
          stage has a healthy operating range: enough level to sit above the noise, enough headroom
          to avoid overload. Move the SOURCE fader and watch the level ripple through the chain.
        </GlossaryText>
        <ZoneLegend />
        <Text style={styles.srcLine}>SOURCE: {sourceDesc(nodes[0])}</Text>
        <Text style={styles.caption}>
          The preamp and output are FIXED here — only the source moves. Push it loud and the fixed
          preamp is forced into overload; pull it down and everything sinks toward TOO LOW. The whole
          job: a healthy level at every stage.
        </Text>
        <CheckQuestion spec={INTRO_CHECK} />
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 2 · Input Gain First ─────────────
export function InputGainModule(_p: GainModuleComponentProps) {
  const [pre, setPre] = useState(0);
  const stages = useMemo(
    () => [mk('pre', 'Preamp', 'preamp', pre, 0, 40, true), mk('out', 'Output', 'output', 0, -30, 6, false)],
    [pre],
  );
  const nodes = computeChain(-30, stages);
  const preNode = nodes[1];
  const done = preNode.region === 'healthy' && !preNode.distorted;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pre',
      label: 'INPUT GAIN',
      value: pre / 40,
      onChange: (t) => setPre(Math.round(t * 40)),
      format: () => fmtDb(pre),
      formatShort: () => fmtG(pre),
      tint: stageTint(preNode),
    },
  ];
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], fixed: true },
    { key: 'pre', name: 'PREAMP', kind: 'preamp', node: preNode, readout: fmtDb(pre) },
    { key: 'out', name: 'OUTPUT', kind: 'output', node: nodes[2], fixed: true },
  ];
  return (
    <RackUnit
      initialParam="pre"
      params={params}
      stage={{
        size: 'M',
        badge: BADGE,
        bezel: [
          { k: 'PREAMP', v: fmtLv(preNode.level), tint: stageTint(preNode) },
          { k: 'HEADROOM', v: `${Math.max(0, -Math.round(preNode.level))} dB` },
          { k: 'OUTPUT', v: fmtLv(nodes[2].level), tint: stageTint(nodes[2]) },
          { k: 'STATUS', ...stageStatus(preNode) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Everything starts with input gain. The preamp brings a quiet source up to a usable level —
          strong enough to work with, but not so hot that it clips.
        </GlossaryText>
        <Text style={styles.instruction}>
          ONLY the PREAMP fader is yours on this screen — the source and output are FIXED. Raise the
          input gain until the preamp meter sits in the healthy green without touching overload.
        </Text>
        <View style={[styles.goal, done && styles.goalDone]}>
          <Text style={[styles.goalText, done && styles.goalTextDone]}>
            {preNode.stageClipped
              ? '✗ Too hot — the preamp is clipping. Back it off.'
              : preNode.region === 'low'
                ? '• Too low — the signal is buried near the noise. Bring it up.'
                : preNode.region === 'hot'
                  ? '• Hot — usable, but little headroom. Ease it down a touch.'
                  : '✓ Healthy input gain — strong and clean.'}
          </Text>
        </View>
        <Text style={styles.caption}>
          There’s no magic number to hit — a comfortable level with headroom to spare is the target,
          and that depends on the source and the gear.
        </Text>
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 3 · Follow the Signal ────────────
const FOLLOW_CHECK: CheckSpec = {
  question: 'You set the preamp too hot and it clipped. Turning the processor after it DOWN will…',
  options: ['Fix the distortion', 'Lower the level but leave the distortion', 'Do nothing at all'],
  correctIdx: 1,
  reveal:
    'A later stage can only change LEVEL. Once a stage clips, the distortion is part of the signal and travels downstream — you have to fix it at the stage where it happened.',
  wrongHint: 'Downstream controls move level up and down — they can’t un-clip a signal.',
};

export function FollowModule(_p: GainModuleComponentProps) {
  const [pre, setPre] = useState(6);
  const stages = useMemo(
    () => [
      mk('pre', 'Preamp', 'preamp', pre, 0, 40, true),
      mk('proc', 'Processor', 'processor', 6, -20, 12, false),
      mk('out', 'Output', 'output', 0, -30, 6, false),
    ],
    [pre],
  );
  const nodes = computeChain(-30, stages);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pre',
      label: 'PREAMP',
      value: pre / 40,
      onChange: (t) => setPre(Math.round(t * 40)),
      format: () => fmtDb(pre),
      formatShort: () => fmtG(pre),
      tint: stageTint(nodes[1]),
    },
  ];
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], fixed: true },
    { key: 'pre', name: 'PREAMP', kind: 'preamp', node: nodes[1], readout: fmtDb(pre) },
    { key: 'proc', name: 'PROC', kind: 'processor', node: nodes[2], fixed: true },
    { key: 'out', name: 'OUTPUT', kind: 'output', node: nodes[3], fixed: true },
  ];
  return (
    <RackUnit
      initialParam="pre"
      params={params}
      stage={{
        size: 'M',
        badge: BADGE,
        bezel: [
          { k: 'PREAMP', v: fmtLv(nodes[1].level), tint: stageTint(nodes[1]) },
          { k: 'PROC', v: fmtLv(nodes[2].level), tint: stageTint(nodes[2]) },
          { k: 'OUTPUT', v: fmtLv(nodes[3].level), tint: stageTint(nodes[3]) },
          { k: 'STATUS', ...stageStatus(nodes[3]) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          A chain is a sequence — each stage feeds the next. Only the PREAMP moves here; the
          processor and output are FIXED. Sweep the preamp and follow the signal across: a weak
          setting starves everything after it; a hot setting clips, and the distortion rides all the
          way to the output.
        </GlossaryText>
        <Text style={styles.caption}>
          Notice you can’t rescue a bad preamp setting with anything that comes after it — a decision
          early in the chain has already shaped everything downstream.
        </Text>
        <CheckQuestion spec={FOLLOW_CHECK} />
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 4 · Too Low vs. Too High ─────────
const SCENARIOS: Record<string, { pre: number; out: number }> = {
  low: { pre: 2, out: 24 },
  high: { pre: 36, out: -16 },
  bal: { pre: 18, out: 0 },
};

export function LowHighModule(_p: GainModuleComponentProps) {
  const [pre, setPre] = useState(18);
  const [out, setOut] = useState(0);
  const stages = useMemo(
    () => [mk('pre', 'Preamp', 'preamp', pre, 0, 40, true), mk('out', 'Output', 'output', out, -20, 26, true)],
    [pre, out],
  );
  const nodes = computeChain(-30, stages);
  const anyLow = nodes.slice(1).some((n) => n.region === 'low');
  const anyClip = nodes.some((n) => n.stageClipped);
  const finalHealthyFromLow = anyLow && nodes[nodes.length - 1].region === 'healthy';
  const scenarioId =
    Object.entries(SCENARIOS).find(([, s]) => s.pre === pre && s.out === out)?.[0] ?? null;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pre',
      label: 'PREAMP',
      value: pre / 40,
      onChange: (t) => setPre(Math.round(t * 40)),
      format: () => fmtDb(pre),
      formatShort: () => fmtG(pre),
      tint: stageTint(nodes[1]),
    },
    {
      kind: 'fader',
      id: 'out',
      label: 'OUTPUT',
      value: (out + 20) / 46,
      onChange: (t) => setOut(Math.round(-20 + t * 46)),
      format: () => fmtDb(out),
      formatShort: () => fmtG(out),
      tint: stageTint(nodes[2]),
    },
    {
      // Sticky teaching tray: pick a scenario and A/B while the chain reacts
      // on the glass. Moving either fader afterwards makes it CUSTOM again.
      kind: 'options',
      id: 'scenario',
      label: 'SCENARIO',
      valueLabel: scenarioId === 'low' ? 'LOW' : scenarioId === 'high' ? 'HIGH' : scenarioId === 'bal' ? 'BAL' : '—',
      options: [
        { id: 'low', label: 'TOO LOW EARLY', blurb: 'A starved first stage: every later stage must boost, and each boost lifts the noise floor with it — hiss you can never remove.' },
        { id: 'high', label: 'TOO HIGH EARLY', blurb: 'A slammed first stage clips immediately — and no later stage can un-clip it. Distortion is forever.' },
        { id: 'bal', label: 'BALANCED', blurb: 'Healthy level at EVERY stage: headroom above, noise floor far below, all the way down the chain. This is the goal.' },
      ],
      selectedId: scenarioId,
      onSelect: (id) => {
        const s = SCENARIOS[id];
        if (s) {
          setPre(s.pre);
          setOut(s.out);
        }
      },
      sticky: true,
    },
  ];
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], fixed: true },
    { key: 'pre', name: 'PREAMP', kind: 'preamp', node: nodes[1], readout: fmtDb(pre) },
    { key: 'out', name: 'OUTPUT', kind: 'output', node: nodes[2], readout: fmtDb(out) },
  ];
  return (
    <RackUnit
      initialParam="pre"
      params={params}
      stage={{
        size: 'M',
        badge: BADGE,
        bezel: [
          { k: 'PREAMP', v: fmtLv(nodes[1].level), tint: stageTint(nodes[1]) },
          { k: 'OUTPUT', v: fmtLv(nodes[2].level), tint: stageTint(nodes[2]) },
          { k: 'STATUS', ...stageStatus(nodes[2]) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          There are two ways to get it wrong. Set the preamp TOO LOW and you must add big gain later
          just to be heard — which also lifts the noise. Set it TOO HIGH and it clips, and no amount
          of turning the output down afterward will clean it up. Try each SCENARIO, then ride the
          faders yourself.
        </GlossaryText>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            {anyClip
              ? 'TOO HIGH: the preamp is clipping — the output is quieter now, but the distortion is baked in.'
              : finalHealthyFromLow
                ? 'TOO LOW: to make the weak signal usable you piled on gain later — which also amplifies the noise floor.'
                : 'BALANCED: healthy level at every stage, with headroom to spare.'}
          </Text>
        </View>
      </View>
    </RackUnit>
  );
}

// ───────────────────────────────────────── 5 · Gain vs. Fader ───────────────
const FADER_CHECK: CheckSpec = {
  question: 'The preamp clipped, then you pulled the fader down. The output is quiet but still distorted because…',
  options: [
    'The fader is broken',
    'The clipping already happened upstream — the fader only changes level, not the damage',
    'You didn’t pull it down far enough',
  ],
  correctIdx: 1,
  reveal:
    'A fader sets LEVEL, not quality. The clip happened at the preamp; the fader after it makes the distorted signal quieter, but the distortion is already part of the waveform. Fix clipping where it occurs — at the input gain.',
  wrongHint: 'The order matters: the damage is upstream of the fader.',
};

export function FaderVsGainModule(_p: GainModuleComponentProps) {
  const [pre, setPre] = useState(18);
  const [fader, setFader] = useState(0);
  const stages = useMemo(
    () => [
      mk('pre', 'Preamp', 'preamp', pre, 0, 40, true),
      mk('fad', 'Fader', 'fader', fader, -30, 10, true),
      mk('out', 'Output', 'output', 0, -30, 6, false),
    ],
    [pre, fader],
  );
  const nodes = computeChain(-30, stages);
  const outDistorted = nodes[nodes.length - 1].distorted;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'pre',
      label: 'PREAMP',
      value: pre / 40,
      onChange: (t) => setPre(Math.round(t * 40)),
      format: () => fmtDb(pre),
      formatShort: () => fmtG(pre),
      tint: stageTint(nodes[1]),
    },
    {
      kind: 'fader',
      id: 'fad',
      label: 'FADER',
      value: (fader + 30) / 40,
      onChange: (t) => setFader(Math.round(-30 + t * 40)),
      format: () => fmtDb(fader),
      formatShort: () => fmtG(fader),
      tint: stageTint(nodes[2]),
    },
    { kind: 'action', id: 'ovr', label: 'OVERDRIVE', onPress: () => { setPre(36); setFader(0); } },
    { kind: 'action', id: 'reset', label: 'RESET', onPress: () => { setPre(18); setFader(0); } },
  ];
  const cols: StageColSpec[] = [
    { key: 'source', name: 'SOURCE', kind: 'source', node: nodes[0], fixed: true },
    { key: 'pre', name: 'PREAMP', kind: 'preamp', node: nodes[1], readout: fmtDb(pre) },
    { key: 'fad', name: 'FADER', kind: 'fader', node: nodes[2], readout: fmtDb(fader) },
    { key: 'out', name: 'OUTPUT', kind: 'output', node: nodes[3], fixed: true },
  ];
  return (
    <RackUnit
      initialParam="pre"
      params={params}
      stage={{
        size: 'M',
        badge: BADGE,
        bezel: [
          { k: 'PREAMP', v: fmtLv(nodes[1].level), tint: stageTint(nodes[1]) },
          { k: 'OUTPUT', v: fmtLv(nodes[3].level), tint: stageTint(nodes[3]) },
          { k: 'DIST', v: outDistorted ? 'YES' : '—', tint: outDistorted ? '#ff7a1e' : '#7a7f8a' },
          { k: 'STATUS', ...stageStatus(nodes[3]) },
        ],
        render: (w, h) => <ChainStage w={w} h={h} cols={cols} />,
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          This is the one that catches everyone. Overdrive the preamp so it clips (the OVERDRIVE
          key does it in one press), then pull the fader down. The output gets quieter — but watch
          the DIST tag: the fader lowered the level, and did nothing to the distortion.
        </GlossaryText>
        <View style={[styles.note, outDistorted && styles.noteBad]}>
          <Text style={styles.noteText}>
            {outDistorted
              ? 'The fader is down and the output is quiet — but it is STILL distorted. The fix is upstream: lower the preamp so it never clips.'
              : 'Clean chain. Clipping has to be prevented at the input gain, not patched at the fader.'}
          </Text>
        </View>
        <CheckQuestion spec={FADER_CHECK} />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  srcLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  instruction: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.amber },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingVertical: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sw: { width: 14, height: 10, borderRadius: 2 },
  legendText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSub },
  goal: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  goalDone: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  goalText: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSecondary },
  goalTextDone: { color: colors.green },
  note: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  noteBad: { borderColor: 'rgba(198,47,34,.45)', backgroundColor: '#1c0f0d' },
  noteText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
