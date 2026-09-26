/**
 * Sound Systems Lab — LEARN pages 8–15 (chapters 5–9).
 *
 * Chapter 5 · subwoofers (feed methods; placement and arrays)
 * Chapter 6 · stage monitors (wedges, fills, in-ears; the monitor world)
 * Chapter 7 · wiring and connections (levels; may these connect?)
 * Chapter 8 · amplifiers and loudspeakers (loads; power and headroom)
 * Chapter 9 · system setup and deployment (the sixteen steps)
 *
 * Every number on these pages comes from the Audio Calculator Laboratory
 * through features/soundsystems/loads.ts — never a second derivation.
 * Every page with a live display is a RACK page: instrument on the glass,
 * readouts on the bezel, controls in the dock (owner 2026-09-25).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { gearSpec, GEAR, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { canConnect, EMPTY_SYSTEM, place, slotDef } from '../../../features/soundsystems/system';
import { ampMatch, ampMatchCopy, CALC_LINKS, fmtOhms, loadVerdict, loadVerdictCopy, parallelLoad, predictedSpl, wattsIntoLoad, type AmpRating } from '../../../features/soundsystems/loads';
import { SETUP_SEQUENCE } from '../../../features/soundsystems/operate';
import type { GearKind, Placed, SignalLevel, SlotId } from '../../../features/soundsystems/types';
import type { DockParam } from '../rack/rackTypes';
import { CalcLink, ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, Readout, ReadoutRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph, GearInSvg, INK } from './art/gearArt';
import { CableLegend, FieldKey, PLOT_H, PLOT_W, VenueView, type PlotBeam } from './art/VenueView';
import { SplitDiagram, SubFeedRouter, type SubFeedMode } from './art/diagrams';
import { BEAM_COLOR, placedToBeams, PLOT_BADGE, THROW } from './plot';
import { flipFader, lanePos, laneVal, SoundSystemsRackLayout, StageFit, type SsPageDef } from './rackLayout';

/* ── 8 · Subwoofer feeds ────────────────────────────────────────────────── */

const SUB_FEEDS: Record<SubFeedMode, { name: string; path: string; reaches: string; control: string; when: string; reachesShort: string; controlShort: string }> = {
  crossover: {
    name: 'Crossover-fed',
    path: 'Main mix → processor crossover → LOW output → subwoofer (HIGH output → tops)',
    reaches: 'Everything below the crossover frequency, from every channel — vocals, guitars, plosives included.',
    control: 'None at the console. The crossover decides; the sub level is a processor output trim.',
    when: 'Simple systems, DJ and playback, anywhere the operator should not need to think about the subs. Also what a powered sub with a built-in crossover does on its own.',
    reachesShort: 'ALL · LOWS',
    controlShort: 'PROC TRIM',
  },
  aux: {
    name: 'Aux-fed',
    path: 'Selected channels → post-fader aux send → aux output → processor LOW input → subwoofer',
    reaches: 'Only the channels you send: kick, bass, floor tom, keys. Nothing else — however low it goes.',
    control: 'Per channel AND overall: each send level, and the aux master as a sub fader.',
    when: 'Band mixing where a clean, controlled low end matters and the operator is at the console all night.',
    reachesShort: 'SENT ONLY',
    controlShort: 'PER SEND',
  },
  matrix: {
    name: 'Matrix-fed',
    path: 'Main mix (and/or an aux) → matrix with its own level, EQ and delay → processor LOW input → subwoofer',
    reaches: 'Whatever buses the matrix takes: the whole mix, or an aux carrying just the low-frequency sources.',
    control: 'A matrix fader and processing, independent of the mains — and the choice of source bus.',
    when: 'Larger consoles and multi-zone systems, where the subs are one output among many that all derive from the finished mix.',
    reachesShort: 'ITS BUSES',
    controlShort: 'MATRIX',
  },
};

function PageSubFeeds({ ctx }: { ctx: PageCtx }) {
  const [feed, setFeed] = useState<SubFeedMode>('crossover');
  const [seen, setSeen] = useState<Set<SubFeedMode>>(new Set(['crossover']));
  const [vocalSend, setVocalSend] = useState(false);
  const goals = [{ label: 'Compare all three feed methods', hit: seen.size >= 3 }, { label: 'Send the vocal to an aux-fed sub and see why not', hit: vocalSend }];
  const latched = useVisitGoals(ctx, goals);
  const f = SUB_FEEDS[feed];
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'feed',
      label: 'FEED',
      valueLabel: f.name.split('-')[0],
      options: (Object.keys(SUB_FEEDS) as SubFeedMode[]).map((k) => ({ id: k, label: SUB_FEEDS[k].name, blurb: `WHEN · ${SUB_FEEDS[k].when}` })),
      selectedId: feed,
      onSelect: (id) => {
        setFeed(id as SubFeedMode);
        setSeen((s) => new Set(s).add(id as SubFeedMode));
      },
      sticky: true,
    },
    ...(feed === 'aux' ? [{ kind: 'toggle', id: 'vox', label: 'VOCAL → SUB', value: vocalSend, onToggle: () => setVocalSend((v) => !v), labelLines: 2 } as DockParam] : []),
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'SUB FEED ROUTER — ILLUSTRATIVE · blue = what reaches the subwoofer',
        initialParam: 'feed',
        bezel: [
          { k: 'FEED', v: f.name.toUpperCase(), tint: colors.cyanBright, flex: 1.3 },
          { k: 'REACHES', v: f.reachesShort, flex: 1.4 },
          { k: 'CONTROL', v: f.controlShort, flex: 1.4 },
          { k: 'VOCAL', v: feed === 'aux' && vocalSend ? 'IN SUBS' : 'CLEAR', tint: feed === 'aux' && vocalSend ? colors.orange : colors.green },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={354 / 176}>
            <SubFeedRouter mode={feed} vocalSend={vocalSend && feed === 'aux'} />
          </StageFit>
        ),
        params,
      }}
      caption="Switch FEED and watch which channels reach the sub. On the aux feed, send the vocal by mistake."
      wellTop={
        feed === 'aux' && vocalSend ? <VerdictLine ok={false} warn>The vocal is in the subwoofers — the fault on the bench. The crossover is blameless; the send is the fault.</VerdictLine> : null
      }
    >
      <ChapterTag n={5}>SUBWOOFER DEPLOYMENT AND ROUTING</ChapterTag>
      <Body>Six channels on the left, the console buses in the middle, the processor and the two cabinets on the right. The blue lines are what reaches the subwoofer.</Body>
      <Prompt>Switch the feed and watch which channels reach the sub. On the aux feed, send the vocal by mistake.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>{f.name.toUpperCase()} · THE PATH</Eyebrow>
        <Text style={styles.path}>{f.path}</Text>
        <Body>REACHES THE SUBS · {f.reaches}</Body>
        <Body>CONTROL · {f.control}</Body>
        <Body>WHEN · {f.when}</Body>
      </Card>
      <KeyFact>A subwoofer reproduces from about 30–40 Hz up to the crossover at 80–120 Hz and nothing else. Crossover-fed subs get everything below that from every channel. Aux-fed and matrix-fed subs get what you choose — which is why an accidental vocal send puts a singer’s chest in the subwoofers with the crossover blameless.</KeyFact>
      <Card>
        <Eyebrow>ALSO IN THE CHAIN</Eyebrow>
        <Body>High-pass and low-pass filters make the crossover; a powered subwoofer’s internal crossover does the same job without a processor, and hands the tops a high-passed feed from its own output. Polarity and delay between the subs and the tops are set at the crossover point — the alignment page covers that.</Body>
      </Card>
    </SoundSystemsRackLayout>
  );
}

/* ── 9 · Subwoofer placement ────────────────────────────────────────────── */

type SubLayout = 'lr' | 'center' | 'cardioid' | 'endfire' | 'flown';

const subBeam = (slot: SlotId, extra: Partial<PlotBeam> = {}): PlotBeam => ({ x: slotDef(slot).x, y: slotDef(slot).y, aimDeg: 0, coverDeg: 360, pattern: 'omni', gain: 0.5, throw: THROW.sub, color: BEAM_COLOR.sub, live: true, ...extra });

const SUB_LAYOUTS: Record<SubLayout, { name: string; beams: PlotBeam[]; placed: { slot: SlotId; kind: GearKind }[]; what: string; cost: string; orient: string; pattern: string; rig: string }> = {
  lr: {
    name: 'Left / right',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [subBeam('subL', { gain: 0.6 }), subBeam('subR', { gain: 0.6 })],
    orient: 'One sub under each main. Two sources of the same low-frequency signal, a room-width apart.',
    what: 'Subs under each main. The most common layout because it is the easiest to rig.',
    cost: 'Down the centre line the two arrive together and add — the power alley; off to the sides they arrive at different times and cancel at some frequencies. Real rooms add their boundaries and modes to this.',
    pattern: 'OMNI ×2',
    rig: 'GROUND',
  },
  center: {
    name: 'Centre cluster',
    placed: [{ slot: 'subC', kind: 'passiveSub' }],
    beams: [subBeam('subC', { gain: 0.9 })],
    orient: 'All the subs together in one place, in front of the stage on the centre line.',
    what: 'All the subs together in one place, in front of the stage.',
    cost: 'One source, so no cancellation between subs: the low end is even across the width of the room. The trade is stage rumble and a cluster in the sightline.',
    pattern: 'OMNI',
    rig: 'GROUND',
  },
  cardioid: {
    name: 'Cardioid stacks',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [subBeam('subL', { pattern: 'cardioid', gain: 0.55 }), subBeam('subR', { pattern: 'cardioid', gain: 0.55 })],
    orient: 'Left and right stacks with one box in each turned to face the stage: the glow now stops behind the stack.',
    what: 'One box in each stack turned to face the stage, delayed and polarity-flipped so its output cancels behind the stack and adds in front.',
    cost: 'A quieter stage — 15–20 dB less low-frequency spill into the microphones — for one cabinet’s worth of output in front. Needs a processor with per-output delay and polarity.',
    pattern: 'CARDIOID',
    rig: 'GROUND',
  },
  endfire: {
    name: 'End-fire array',
    placed: [{ slot: 'subC', kind: 'passiveSub' }, { slot: 'subC2', kind: 'passiveSub' }],
    beams: [subBeam('subC', { pattern: 'endfire', gain: 0.9, y: (slotDef('subC').y + slotDef('subC2').y) / 2 })],
    orient: 'Two subs in a line front-to-back on the centre line, the rear box delayed by the time sound takes to reach the front one.',
    what: 'Subs in a line front-to-back, each delayed by the time sound takes to reach the next, so the outputs add forward and cancel backward.',
    cost: 'The most directional low end a ground stack can make; it needs depth in front of the stage and exact delays — the spacing sets the frequency where the rejection is deepest.',
    pattern: 'END-FIRE',
    rig: 'GROUND',
  },
  flown: {
    name: 'Flown subs',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [subBeam('subL', { gain: 0.45, rig: 'flown' }), subBeam('subR', { gain: 0.45, rig: 'flown' })],
    orient: 'Subs hung beside the main arrays: quieter at the barrier, more even front-to-back.',
    what: 'Subs hung beside or behind the main arrays.',
    cost: 'More even front-to-back — the front rows are no longer standing on the cabinets — at the price of the floor’s boundary gain. Ground-stacked subs are louder for the same box; flown subs are more even.',
    pattern: 'OMNI ×2',
    rig: 'FLOWN',
  },
};

const SUB_LAYOUT_IDS = Object.keys(SUB_LAYOUTS) as SubLayout[];

function PageSubPlacement({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<SubLayout>('lr');
  const [seen, setSeen] = useState<Set<SubLayout>>(new Set(['lr']));
  const goals = [{ label: 'View four sub arrangements', hit: seen.size >= 4 }, { label: 'Compare the cardioid and end-fire arrays', hit: seen.has('cardioid') && seen.has('endfire') }];
  const latched = useVisitGoals(ctx, goals);
  const l = SUB_LAYOUTS[id];
  const placed: Placed[] = [
    { id: 'l', kind: 'passiveSpeaker', slot: 'mainL' },
    { id: 'r', kind: 'passiveSpeaker', slot: 'mainR' },
    ...l.placed.map((p, i) => ({ id: `s${i}`, kind: p.kind, slot: p.slot })),
  ];
  const items = SUB_LAYOUT_IDS.map((k) => ({ id: k, ...SUB_LAYOUTS[k] }));
  const params: DockParam[] = [
    flipFader({
      id: 'layout',
      label: 'LAYOUT',
      title: 'SUBWOOFER ARRANGEMENTS',
      items,
      selectedId: id,
      onSelect: (k) => {
        setId(k as SubLayout);
        setSeen((s) => new Set(s).add(k as SubLayout));
      },
      name: (x) => x.name,
      short: (x) => x.name.split(' ')[0],
      blurb: (x) => x.orient,
      sticky: true,
    }),
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: PLOT_BADGE,
        initialParam: 'layout',
        hideDragTag: true,
        bezel: [
          { k: 'LAYOUT', v: l.name.toUpperCase(), tint: colors.cyanBright, flex: 1.6 },
          { k: 'SUBS', v: `${l.placed.length}`, flex: 0.6 },
          { k: 'PATTERN', v: l.pattern, tint: '#6fa8ff', flex: 1.2 },
          { k: 'RIG', v: l.rig, flex: 0.9 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
            <VenueView placed={placed} beams={l.beams} field a11y={`Plan of the ${l.name} subwoofer arrangement. ${l.orient}`} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride LAYOUT through the five arrangements and watch where the low end lands — and, for the two arrays, where it stops."
    >
      <ChapterTag n={5}>SUBWOOFER PLACEMENT AND ARRAYS</ChapterTag>
      <Body>{l.orient}</Body>
      <Body>The blue glow is the low-frequency field in this conceptual model — only the mains’ subs are playing here. Real rooms add their boundaries and their modes: measure before you trust a layout.</Body>
      <FieldKey />
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>{l.name.toUpperCase()}</Eyebrow>
        <Body>{l.what}</Body>
        <Body>THE TRADE · {l.cost}</Body>
      </Card>
      <KeyFact>Low frequencies are long: a 60 Hz wave is nearly six metres. Two subwoofers a room-width apart are, to that wave, two sources that cannot help interfering. Preventing low-frequency build-up is mostly geometry: fewer separated sources, boundaries used deliberately, and a high-pass filter on every channel that has no business below 100 Hz.</KeyFact>
      <DeeperRow>
        <LabLink route="WaveLab" label="Wave Physics — interference and standing waves" />
        <CalcLink id={CALC_LINKS.comb.workspace} label="Comb filter from a path difference" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 10 · Stage monitors ────────────────────────────────────────────────── */

const MONITOR_KINDS: readonly { id: string; kind: GearKind; slot: SlotId; name: string; blurb: string; feed: string }[] = [
  { id: 'wedge', kind: 'wedge', slot: 'mon2', name: 'Floor wedge', feed: 'ONE AUX · PRE', blurb: 'On the floor at the lip, angled up at one performer, fed from one aux send. Its whole design is to be heard by the person in front of it and rejected by the microphone above it — which is why it sits in the microphone’s null, directly behind it.' },
  { id: 'side', kind: 'wedge', slot: 'sideFillL', name: 'Side fill', feed: 'STEREO AUX', blurb: 'A larger cabinet at the wing, firing across the stage with a general mix so performers who move still hear the band. Left and right side fills are usually a pair on one stereo mix.' },
  { id: 'drum', kind: 'poweredSub', slot: 'drumFill', name: 'Drum fill', feed: 'ONE AUX · PRE', blurb: 'A sub-and-top stack beside the drummer, aimed at the throne: the one performer who needs to feel the kick and bass as well as hear them.' },
  { id: 'iem', kind: 'iemPack', slot: 'stageC', name: 'In-ear monitors', feed: 'STEREO AUX · TX', blurb: 'Sealed earphones from a bodypack — wired or wireless. No wedge on the floor, no spill into the microphones, a stereo mix if the transmitter is stereo. Isolation is the point, and also the hazard.' },
];

function PageMonitors({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string>('wedge');
  const [seen, setSeen] = useState<Set<string>>(new Set(['wedge']));
  const goals = [{ label: 'Inspect all four monitor types', hit: seen.size >= 4 }];
  const latched = useVisitGoals(ctx, goals);
  const m = MONITOR_KINDS.find((x) => x.id === sel)!;
  const placed: Placed[] = MONITOR_KINDS.map((k) => ({ id: k.id, kind: k.kind, slot: k.slot }));
  const beams = useMemo(() => placedToBeams(placed, new Set(placed.map((p) => p.id))), [placed]);
  const pick = (id: string) => {
    setSel(id);
    setSeen((s) => new Set(s).add(id));
  };
  const params: DockParam[] = [
    flipFader({
      id: 'monitor',
      label: 'MONITOR',
      title: 'THE MONITOR WORLD',
      items: MONITOR_KINDS,
      selectedId: sel,
      onSelect: pick,
      name: (k) => k.name,
      short: (k) => k.name.split(' ')[0],
      blurb: (k) => k.blurb,
      sticky: true,
    }),
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: PLOT_BADGE,
        initialParam: 'monitor',
        hideDragTag: true,
        bezel: [
          { k: 'MONITOR', v: m.name.toUpperCase(), tint: colors.cyanBright, flex: 1.5 },
          { k: 'STANDS AT', v: slotDef(m.slot).label.toUpperCase(), flex: 1.3 },
          { k: 'FED BY', v: m.feed, flex: 1.4 },
          { k: 'SEEN', v: `${seen.size}/4`, flex: 0.7 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
            <VenueView placed={placed} beams={beams} performers selectedId={sel} onTapPlaced={pick} a11y="Monitor positions on the stage: a wedge, a side fill, a drum fill and an in-ear pack. Tap one to read about it." />
          </StageFit>
        ),
        params,
      }}
      caption="Tap a monitor on the stage, or ride MONITOR through the four of them."
      wellTop={
        <Card tone="math">
          <View style={styles.inspectHead}>
            <GearGlyph kind={m.kind} size={52} label={m.name} />
            <Eyebrow>{m.name.toUpperCase()}</Eyebrow>
          </View>
          <Body>{m.blurb}</Body>
        </Card>
      }
    >
      <ChapterTag n={6}>STAGE MONITORS AND PERFORMER MIXES</ChapterTag>
      <Body>The stage from above: a wedge at the lip aimed back at its performer, a side fill at the stage-left wing firing across, a drum fill beside the riser, and a performer at centre wearing in-ears.</Body>
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>The audience hears one mix. Each performer needs a different one — more of themselves, less of the drummer, a click nobody else may hear. Monitoring is a second sound system pointed the other way, and its sends are PRE-FADER: the house fader must never move a wedge. Each aux output feeds one wedge amplifier channel, one powered wedge or one in-ear transmitter; a stereo in-ear mix needs a stereo aux and a stereo transmitter.</KeyFact>
      <Card tone="warn">
        <Eyebrow>HEARING SAFETY — IN-EAR LEVELS</Eyebrow>
        <Body>Sealed in-ears remove the room, so a performer reaches for level to feel the band. The limiter on the bodypack is not optional, and the mix should be built so the performer is comfortable at a moderate setting. A wedge is loud in a room; an in-ear is loud in an ear canal.</Body>
      </Card>
    </SoundSystemsRackLayout>
  );
}

/* ── 11 · The monitor world ─────────────────────────────────────────────── */

function PageMonitorWorld({ ctx }: { ctx: PageCtx }) {
  const [mode, setMode] = useState<'analog' | 'digital'>('analog');
  const [seen, setSeen] = useState<Set<string>>(new Set(['analog']));
  const [gainDb, setGainDb] = useState(0);
  const [gainMoved, setGainMoved] = useState(false);
  const [solved, setSolved] = useState(0);
  const gainMove = gainDb > 0;
  if (gainMove && !gainMoved) setGainMoved(true);
  const goals = [{ label: 'See both splits with a gain move', hit: seen.size >= 2 && gainMoved }, { label: 'Answer both checks', hit: solved >= 2 }];
  const latched = useVisitGoals(ctx, goals);
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'gain',
      label: 'MON GAIN',
      value: lanePos(gainDb, 0, 12),
      onChange: (p) => setGainDb(laneVal(p, 0, 12, 1)),
      format: (p) => `+${laneVal(p, 0, 12, 1)} dB at the monitor console`,
      formatShort: (p) => `+${laneVal(p, 0, 12, 1)} dB`,
      home: 0,
    },
    {
      kind: 'options',
      id: 'split',
      label: 'SPLIT',
      valueLabel: mode === 'analog' ? 'Analog' : 'Digital',
      options: [
        { id: 'analog', label: 'Analog split', blurb: 'A transformer-isolated splitter sends each microphone to both consoles; each has its own preamp and its own gain.' },
        { id: 'digital', label: 'Digital gain sharing', blurb: 'One stagebox, one preamp per microphone, two consoles on the network — whoever owns the gain changes it for both, and gain compensation trims the other.' },
      ],
      selectedId: mode,
      onSelect: (id) => {
        setMode(id as 'analog' | 'digital');
        setSeen((s) => new Set(s).add(id));
      },
      sticky: true,
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'FOH / MONITOR SPLIT — ILLUSTRATIVE',
        initialParam: 'gain',
        bezel: [
          { k: 'SPLIT', v: mode === 'analog' ? 'ANALOG' : 'GAIN SHARE', tint: colors.cyanBright, flex: 1.3 },
          { k: 'MON PREAMP', v: gainMove ? `+${gainDb} dB` : 'AS SET', flex: 1.1 },
          { k: 'FOH HEARS', v: !gainMove ? 'AS SET' : mode === 'analog' ? 'UNCHANGED' : `TRIM −${gainDb}`, tint: colors.green, flex: 1.2 },
          { k: 'CHECKS', v: `${solved}/2`, flex: 0.8 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={354 / 160}>
            <SplitDiagram mode={mode} gainMove={gainMove} gainDb={gainDb} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride MON GAIN to have the monitor engineer raise a preamp, then switch the SPLIT. Read what happens at front of house."
    >
      <ChapterTag n={6}>MONITOR CONSOLE, SPLITS AND TALKBACK</ChapterTag>
      <Body>Three sources feeding TWO consoles — the house console at front of house and the monitor console at side stage — by one of the two ways the split is made.</Body>
      <Prompt>Switch the split, then have the monitor engineer raise a gain. Read what happens at front of house.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card>
        <Eyebrow>ANALOG SPLIT</Eyebrow>
        <Body>A transformer-isolated splitter sends each microphone to both consoles. Each console has its own preamp and its own gain — independent, but two preamps loading one microphone, and twice the cabling. A gain move at monitors is invisible at front of house.</Body>
      </Card>
      <Card>
        <Eyebrow>DIGITAL GAIN SHARING</Eyebrow>
        <Body>One stagebox, one preamp per microphone, two consoles on the network. Whoever owns the preamp gain changes it for both; the other console applies a digital trim so a gain move at monitors does not move the house. Gain compensation is the setting that makes this workable — and forgetting it is a classic fault.</Body>
      </Card>
      <Card>
        <Eyebrow>TALKBACK</Eyebrow>
        <Body>A microphone at each console routed to the monitor mixes (and to each other) so the engineers can speak to the stage without going through the house. Its routing is checked like any other: which wedges hear it, and never the main mix. On a small show, one console does both jobs and all of this collapses into one operator’s aux sends.</Body>
      </Card>
      <UnderstandingCheck
        question="With digital gain sharing, the monitor engineer raises a preamp gain by 6 dB. What keeps the house mix from jumping 6 dB?"
        options={['Gain compensation: the house console applies a −6 dB digital trim automatically', 'Nothing — the house engineer must chase every gain move', 'The analog split absorbs it', 'The main limiter']}
        correct={0}
        explain="One preamp feeds both consoles; gain compensation on the non-owning console cancels the owner’s moves so each engineer keeps an independent mix."
        onCorrect={() => setSolved((n) => n + 1)}
      />
      <UnderstandingCheck
        question="A singer’s wedge should NOT change when the house engineer moves the vocal fader. How is the send tapped?"
        options={['Pre-fader', 'Post-fader', 'Through the subgroup', 'From the main matrix']}
        correct={0}
        explain="Pre-fader: the send takes its copy before the fader, so the fader cannot touch it. Post-fader is for effects, where following the fader is the point."
        onCorrect={() => setSolved((n) => n + 1)}
      />
    </SoundSystemsRackLayout>
  );
}

/* ── 12 · Wiring and connections ────────────────────────────────────────── */

const LEVELS: readonly { level: SignalLevel; volts: string; carried: string; cable: string }[] = [
  { level: 'mic', volts: 'a few millivolts (−60 to −40 dBu)', carried: 'Microphones, DI outputs', cable: 'Balanced XLR' },
  { level: 'instrument', volts: 'tenths of a volt, high impedance, unbalanced', carried: 'Guitars, basses, keyboards', cable: 'Unbalanced ¼-inch TS — short runs only, then a DI' },
  { level: 'line', volts: 'about a volt (+4 dBu nominal)', carried: 'Console outputs, processors, playback', cable: 'Balanced XLR or TRS' },
  { level: 'speaker', volts: 'tens of volts, amps of current', carried: 'Amplifier outputs only', cable: 'Speaker cable with speakON — never a signal cable' },
  { level: 'digital', volts: 'data, not audio', carried: 'Stagebox ↔ console, AES3, Dante, AVB, MADI', cable: 'Category cable, coaxial or fibre — clocked from one master' },
];

const PAIRS: readonly { from: GearKind; to: GearKind }[] = [
  { from: 'vocalMic', to: 'console' },
  { from: 'amp', to: 'poweredSpeaker' },
  { from: 'console', to: 'passiveSpeaker' },
  { from: 'processor', to: 'amp' },
  { from: 'vocalMic', to: 'amp' },
  { from: 'stagebox', to: 'console' },
];

function PageWiring({ ctx }: { ctx: PageCtx }) {
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no'>>({});
  const answered = Object.keys(answers).length;
  const goals = [{ label: 'Judge all six connections', hit: answered >= PAIRS.length }];
  const latched = useVisitGoals(ctx, goals);
  // A scratch system with one of each device, so canConnect can judge the pair.
  const verdicts = useMemo(
    () =>
      PAIRS.map((p) => {
        let s = EMPTY_SYSTEM;
        const a = place(s, p.from, gearSpec(p.from).roles.includes('stageSource') ? 'stageC' : gearSpec(p.from).roles.includes('foh') ? 'foh' : gearSpec(p.from).roles.includes('stageInfra') ? 'stageBox' : 'rack1');
        if (!a.ok) throw new Error(a.reason);
        s = a.system;
        const roles = gearSpec(p.to).roles;
        const b = place(s, p.to, roles.includes('main') ? 'mainL' : roles.includes('foh') ? 'foh' : roles.includes('ampRack') ? 'rack2' : 'stageBox');
        if (!b.ok) throw new Error(b.reason);
        return canConnect(b.system, a.id, b.id);
      }),
    [],
  );
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={7}>WIRING AND SYSTEM CONNECTIONS</ChapterTag>
      <Body>Six proposed connections. Decide whether each one carries signal, then read the engine’s verdict — the same engine that judges every cable in BUILD mode.</Body>
      <Prompt>May these connect?</Prompt>
      <GoalChips goals={goals} latched={latched} />
      {PAIRS.map((p, i) => {
        const v = verdicts[i];
        const ans = answers[i];
        const truth = v.ok ? 'yes' : 'no';
        return (
          <Card key={i} tone={ans ? (ans === truth ? 'ok' : 'warn') : 'plain'}>
            <View style={styles.pairRow}>
              <GearGlyph kind={p.from} size={40} label={gearSpec(p.from).name} />
              <Text style={styles.arrow}>→</Text>
              <GearGlyph kind={p.to} size={40} label={gearSpec(p.to).name} />
              <Text style={styles.pairText}>{gearSpec(p.from).name} → {gearSpec(p.to).name}</Text>
            </View>
            {!ans ? (
              <Row>
                <Btn label="CONNECT" onPress={() => setAnswers((a) => ({ ...a, [i]: 'yes' }))} a11y={`Connect ${gearSpec(p.from).name} to ${gearSpec(p.to).name}`} />
                <Btn label="REFUSE" tone="danger" onPress={() => setAnswers((a) => ({ ...a, [i]: 'no' }))} a11y={`Refuse ${gearSpec(p.from).name} to ${gearSpec(p.to).name}`} />
              </Row>
            ) : (
              <VerdictLine ok={ans === truth} warn={ans !== truth && !v.ok && !('unsafe' in v && v.unsafe)}>
                {v.ok ? `Connects at ${LEVEL_LABEL[v.level]}.` : v.reason}
              </VerdictLine>
            )}
          </Card>
        );
      })}
      <Card>
        <Eyebrow>THE LEVELS</Eyebrow>
        {LEVELS.map((l) => (
          <View key={l.level} style={styles.levelRow}>
            <View style={styles.levelHead}>
              <Text style={styles.levelName}>{LEVEL_LABEL[l.level].toUpperCase()}</Text>
              <Text style={styles.levelVolts}>{l.volts}</Text>
            </View>
            <Text style={styles.levelLine}>{l.carried} · {l.cable}</Text>
          </View>
        ))}
        <CableLegend levels={['mic', 'line', 'speaker', 'digital', 'wireless']} />
      </Card>
      <KeyFact>Five signal levels, and a connector’s shape never tells you which one it carries. Speaker level into a line or mic input damages the input. Mic level into a line input is 40–50 dB too quiet — a whisper you will chase with gain and noise. Line level into a passive loudspeaker moves no cone you can hear. Every refusal in BUILD mode is one of these three sentences.</KeyFact>
      <Card>
        <Eyebrow>THE REST OF THE CHAPTER LIVES IN THE CABLE LABS</Eyebrow>
        <Body>Balanced and unbalanced signals, XLR/TRS/TS/speakON/Ethernet, correct amplifier-to-loudspeaker wiring, clocking and sample rate, cable routing and strain relief, signal cables kept apart from power, ground loops and isolation, redundancy, labelling and documentation.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="CableLab" label="Cable & Connector Fundamentals" />
        <LabLink route="ConnectorSelectLab" label="Connectors & Cable Selection" />
        <LabLink route="CableInstallLab" label="Cable Dressing & Installation" />
        <LabLink route="PatchbayLab" label="Patchbay Signal Flow" />
        <LabLink route="DigitalLab" label="Digital Audio Systems" />
      </DeeperRow>
    </View>
  );
}

/* ── 13 · Loads ─────────────────────────────────────────────────────────── */

const AMP: AmpRating = { at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 };

const RIG_W = 300;
const RIG_H = 120;

function LoadRig({ ohms, count, bridged, verdict }: { ohms: number; count: number; bridged: boolean; verdict: 'safe' | 'marginal' | 'unsafe' | 'open' }) {
  const W = RIG_W;
  const H = RIG_H;
  const cabs = Array.from({ length: count }, (_, i) => i);
  const wire = verdict === 'unsafe' ? colors.red : verdict === 'marginal' ? colors.gold : '#ff7a5c';
  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }} accessibilityLabel={`${count} cabinet${count === 1 ? '' : 's'} of ${ohms} ohms in parallel on one amplifier channel${bridged ? ', bridged' : ''}; the load is ${verdict}`}>
      <GearInSvg kind="amp" id="lr-amp" x={44} y={58} size={70} power={verdict === 'unsafe' ? 'off' : 'on'} />
      <SvgText x={44} y={104} fontSize={8.5} fill={verdict === 'unsafe' ? colors.red : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{verdict === 'unsafe' ? 'AMP · PROTECT' : bridged ? 'AMP · BRIDGED' : 'AMP · CH A'}</SvgText>
      {cabs.map((i) => {
        const x = 120 + i * 46;
        const y = 56;
        return (
          <G key={i}>
            <Path d={`M 78 58 C 96 58 ${x - 26} ${y + 4} ${x - 14} ${y + 6}`} stroke={wire} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Path d={`M 78 58 C 96 58 ${x - 26} ${y + 4} ${x - 14} ${y + 6}`} stroke="#fff" strokeWidth={0.6} fill="none" opacity={0.3} />
            <GearInSvg kind="passiveSpeaker" id={`lr-cab-${i}`} x={x} y={y} size={46} />
            <SvgText x={x} y={y + 34} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.mono}>{ohms} Ω</SvgText>
          </G>
        );
      })}
      {count > 1 ? <SvgText x={120 + (count - 1) * 23} y={16} fontSize={8.5} fill={INK.metalHi} textAnchor="middle" fontFamily={fonts.oswaldMedium}>IN PARALLEL</SvgText> : null}
      <Circle cx={78} cy={58} r={2.5} fill={wire} />
    </Svg>
  );
}

function PageLoads({ ctx }: { ctx: PageCtx }) {
  const [ohms, setOhms] = useState(8);
  const [count, setCount] = useState(1);
  const [bridged, setBridged] = useState(false);
  const [sawUnsafe, setSawUnsafe] = useState(false);
  const [sawSafe, setSawSafe] = useState(false);
  const load = parallelLoad(Array.from({ length: count }, () => ohms));
  const min = bridged ? AMP.minOhmsBridged ?? 8 : AMP.minOhms;
  const verdict = loadVerdict(load.ohms, min);
  if (verdict === 'unsafe' && !sawUnsafe) setSawUnsafe(true);
  if (verdict === 'safe' && count >= 2 && !sawSafe) setSawSafe(true);
  const goals = [{ label: 'Wire a load the amplifier cannot drive', hit: sawUnsafe }, { label: 'Wire two or more cabinets safely', hit: sawSafe }];
  const latched = useVisitGoals(ctx, goals);
  const watts = wattsIntoLoad(AMP, load.ohms, bridged);
  const loadTint = verdict === 'unsafe' ? colors.red : verdict === 'marginal' ? colors.gold : colors.green;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'count',
      label: 'CABINETS',
      value: lanePos(count, 1, 4),
      onChange: (p) => setCount(laneVal(p, 1, 4, 1)),
      format: (p) => `${laneVal(p, 1, 4, 1)} in parallel`,
      formatShort: (p) => `${laneVal(p, 1, 4, 1)}`,
      tint: loadTint,
    },
    {
      kind: 'options',
      id: 'ohms',
      label: 'CABINET',
      valueLabel: `${ohms} Ω`,
      options: [16, 8, 4].map((z) => ({ id: `${z}`, label: `${z} Ω cabinets` })),
      selectedId: `${ohms}`,
      onSelect: (id) => setOhms(Number(id)),
      sticky: true,
    },
    { kind: 'toggle', id: 'bridged', label: 'BRIDGED', value: bridged, onToggle: () => setBridged((b) => !b) },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'PARALLEL LOAD — CALCULATED · from the Audio Calculator Laboratory',
        initialParam: 'count',
        hideDragTag: true,
        bezel: [
          { k: 'TOTAL LOAD', v: fmtOhms(load.ohms), tint: loadTint, flex: 1.2 },
          { k: 'AMP MIN', v: `${min} Ω` },
          { k: 'INTO LOAD', v: watts == null ? '—' : `${watts} W` },
          { k: 'VERDICT', v: verdict.toUpperCase(), tint: loadTint, flex: 1.2 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={RIG_W / RIG_H}>
            <LoadRig ohms={ohms} count={count} bridged={bridged} verdict={verdict} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride CABINETS to add boxes across the channel and watch the load fall. Find the point where the amplifier can no longer drive it."
      wellTop={
        <>
          <VerdictLine ok={verdict === 'safe'} warn={verdict === 'marginal' || verdict === 'open'}>
            {loadVerdictCopy(verdict, load.ohms, min)}
          </VerdictLine>
          {load.warning ? <VerdictLine ok={false}>{load.warning}</VerdictLine> : null}
        </>
      }
    >
      <ChapterTag n={8}>AMPLIFIERS AND LOUDSPEAKER COMPATIBILITY · LOADS</ChapterTag>
      <Body>One amplifier channel and the passive cabinets wired across it in parallel. The wire turns gold at the amplifier’s minimum and red below it.</Body>
      <Prompt>Add cabinets and watch the load fall. Find the point where the amplifier can no longer drive it.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE ARITHMETIC · FROM THE CALCULATOR</Eyebrow>
        <Text style={styles.path}>Ztot = 1 ÷ Σ(1/Zi)</Text>
        <Body>A passive loudspeaker is a load. Parallel cabinets share the amplifier’s voltage and each draws its own current; the total impedance is always below the lowest cabinet, and the amplifier must deliver the sum of the currents. Bridging joins two channels into one with twice the voltage swing — and DOUBLES the minimum impedance (typically 8 Ω), so a bridged 4 Ω load is the classic mistake.</Body>
        <Body>This amplifier’s ratings — {AMP.at8} W at 8 Ω, {AMP.at4} W at 4 Ω, {AMP.bridged8} W bridged at 8 Ω, {AMP.minOhms} Ω minimum — are an example. Read YOUR amplifier’s table; never assume the ratio.</Body>
      </Card>
      <DeeperRow>
        <CalcLink id={CALC_LINKS.parallel.workspace} label="Parallel loads" />
        <CalcLink id="cable" label="Speaker cable loss and gauge" />
        <LabLink route="AmpLab" label="Amplifier Principles Lab" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 14 · Power and headroom ────────────────────────────────────────────── */

const CABINET = { continuous: 400, program: 800, sensitivity: 97 };
const AMP_MIN_W = 100;
const AMP_MAX_W = 1600;

/** The cabinet's power band — continuous to program — with the chosen
 *  amplifier's mark on it, between the amplifier and the cabinet it drives. */
function PowerBand({ amp, match, w, h }: { amp: number; match: 'under' | 'ok' | 'over'; w: number; h: number }) {
  const band = (x: number) => Math.min(100, Math.max(1, (x / AMP_MAX_W) * 100));
  const tint = match === 'ok' ? colors.green : match === 'under' ? colors.red : colors.gold;
  const glyph = Math.round(Math.min(64, Math.max(36, h * 0.32)));
  return (
    <View style={[styles.bandStage, { width: w, height: h }]} accessible accessibilityLabel={`Amplifier ${amp} watts against a cabinet rated ${CABINET.continuous} watts continuous and ${CABINET.program} watts program: ${match === 'ok' ? 'in the band' : match === 'under' ? 'under' : 'over'}`}>
      <View style={styles.bandRow}>
        <View style={styles.bandEnd}>
          <GearGlyph kind="amp" size={glyph} label="Amplifier" legends={false} />
          <Text style={[styles.bandEndText, { color: tint }]}>{amp} W</Text>
        </View>
        <View style={styles.bandWrap}>
          <View style={styles.band}>
            <View style={[styles.bandOk, { left: `${band(CABINET.continuous)}%`, width: `${band(CABINET.program) - band(CABINET.continuous)}%` }]} />
            <View style={[styles.bandMark, { left: `${band(amp)}%`, backgroundColor: tint }]} />
          </View>
          <View style={styles.bandLabels}>
            <Text style={styles.bandText}>0 W</Text>
            <Text style={[styles.bandText, { color: colors.green }]}>{CABINET.continuous}–{CABINET.program} W · THE BAND</Text>
            <Text style={styles.bandText}>{AMP_MAX_W} W</Text>
          </View>
          <Text style={[styles.bandVerdict, { color: tint }]}>{match === 'ok' ? '● IN THE BAND' : match === 'under' ? '△ UNDERPOWERED — CLIPS FIRST' : '△ OVERSIZED — HEADROOM IS YOURS TO KEEP'}</Text>
        </View>
        <View style={styles.bandEnd}>
          <GearGlyph kind="passiveSpeaker" size={glyph} label="Cabinet" legends={false} />
          <Text style={styles.bandEndText}>{CABINET.continuous} W cont.</Text>
        </View>
      </View>
    </View>
  );
}

function PagePower({ ctx }: { ctx: PageCtx }) {
  const [amp, setAmp] = useState(500);
  const [dist, setDist] = useState(10);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const match = ampMatch(amp, CABINET.continuous, CABINET.program);
  if (!tried.has(match)) setTried((t) => new Set(t).add(match));
  const goals = [{ label: 'Try an underpowered, a matched and an oversized amplifier', hit: tried.size >= 3 }];
  const latched = useVisitGoals(ctx, goals);
  const spl = predictedSpl(CABINET.sensitivity, amp, dist, 6);
  const tint = match === 'ok' ? colors.green : match === 'under' ? colors.red : colors.gold;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'amp',
      label: 'AMP',
      value: lanePos(amp, AMP_MIN_W, AMP_MAX_W),
      onChange: (p) => setAmp(laneVal(p, AMP_MIN_W, AMP_MAX_W, 50)),
      format: (p) => `${laneVal(p, AMP_MIN_W, AMP_MAX_W, 50)} W into 8 Ω`,
      formatShort: (p) => `${laneVal(p, AMP_MIN_W, AMP_MAX_W, 50)} W`,
      tint,
    },
    {
      kind: 'options',
      id: 'dist',
      label: 'LISTENER',
      valueLabel: `${dist} m`,
      options: [2, 10, 30].map((d) => ({ id: `${d}`, label: `${d} m from the cabinet` })),
      selectedId: `${dist}`,
      onSelect: (id) => setDist(Number(id)),
      sticky: true,
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'S',
        // View-built band and readouts: nothing in it grows with the box, so no full-screen zoom.
        fullScreen: false,
        badge: 'POWER BAND — CALCULATED · SPL from the Audio Calculator Laboratory · free field, one cabinet',
        initialParam: 'amp',
        hideDragTag: true,
        bezel: [
          { k: 'MATCH', v: match === 'ok' ? 'IN BAND' : match === 'under' ? 'UNDER' : 'OVER', tint },
          { k: 'CONTINUOUS', v: `${CABINET.continuous} W`, flex: 1.1 },
          { k: 'PROGRAM', v: `${CABINET.program} W` },
          { k: `SPL @ ${dist} m`, v: `${spl.toFixed(1)} dB`, tint: colors.amber, flex: 1.2 },
        ],
        stage: (w, h) => <PowerBand amp={amp} match={match} w={w} h={h} />,
        params,
      }}
      caption="Ride AMP across the cabinet’s power band and read which side of it the amplifier lands on. Move the LISTENER and watch the SPL fall with distance."
      wellTop={<VerdictLine ok={match === 'ok'} warn={match === 'over'}>{ampMatchCopy(match, amp, CABINET.continuous, CABINET.program)}</VerdictLine>}
    >
      <ChapterTag n={8}>POWER RATINGS, HEADROOM AND PROTECTION</ChapterTag>
      <Body>The cabinet’s power band — continuous to program — and where the chosen amplifier lands on it.</Body>
      <Prompt>Try each side of the band and read what it costs.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>HOW LOUD, WHERE · FROM THE CALCULATOR</Eyebrow>
        <Text style={styles.path}>SPL = sensitivity + 10·log10(P) − 20·log10(d) − headroom</Text>
        <ReadoutRow>
          <Readout k="SENSITIVITY" v={`${CABINET.sensitivity} dB · 1 W / 1 m`} />
          <Readout k="LISTENER AT" v={`${dist} m`} />
          <Readout k="WITH 6 dB HEADROOM" v={`${spl.toFixed(1)} dB SPL`} tint={colors.amber} />
        </ReadoutRow>
        <Body>Free-field, one cabinet, 6 dB kept in reserve for peaks — the MINIMUM; music with real dynamics wants 10–12. Every doubling of power buys 3 dB; every doubling of distance costs 6. That asymmetry is why coverage is solved with placement and count before it is solved with watts.</Body>
      </Card>
      <KeyFact>A loudspeaker carries three power numbers — continuous, program and peak — and an amplifier carries one per load. Matching them is a band, not a bullseye: an amplifier between the continuous and program ratings, run clean. The wrong side of the band is not the side most people expect — an underpowered amplifier driven into clipping kills more high-frequency drivers than a big one run with headroom.</KeyFact>
      <Card>
        <Eyebrow>PROTECTING HIGH-FREQUENCY DRIVERS</Eyebrow>
        <Body>Tweeters die from clipped amplifiers and from sustained feedback far more often than from clean power. The processor’s limiter, set for the cabinet; a powered loudspeaker’s input gain left at its nominal mark; and an operator who reduces gain before the clip light stays on — these are the protections. Sensitivity and maximum SPL on the data sheet tell you how loud a cabinet CAN go; headroom tells you how loud you should ASK it to go.</Body>
      </Card>
      <DeeperRow>
        <CalcLink id={CALC_LINKS.spl.workspace} label="Loudspeaker power and SPL" />
        <CalcLink id={CALC_LINKS.splDistance.workspace} label="SPL at a distance" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 15 · Deployment sequence ───────────────────────────────────────────── */

function PageDeployment({ ctx }: { ctx: PageCtx }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const goals = [{ label: 'Open eight of the sixteen steps', hit: open.size >= 8 }, { label: 'Open step 9 — verify before power', hit: open.has(9) }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>SYSTEM SETUP AND DEPLOYMENT</ChapterTag>
      <Lead>
        A professional setup is a sequence, and the order is not a preference. Each step exists because the one after it would be unsafe, or wasted, without it. Open the steps to read why.
      </Lead>
      <GoalChips goals={goals} latched={latched} />
      {SETUP_SEQUENCE.map((s) => {
        const o = open.has(s.n);
        return (
          <Pressable key={s.n} onPress={() => setOpen((v) => new Set(v).add(s.n))} style={[styles.step, o && styles.stepOpen, s.n === 9 && styles.stepKey]} accessibilityRole="button" accessibilityState={{ expanded: o }} aria-expanded={o} accessibilityLabel={`Step ${s.n}: ${s.title}${o ? `. ${s.why}` : ''}`}>
            <View style={styles.stepHead}>
              <Text style={[styles.stepN, o && { color: colors.cyanBright }]}>{String(s.n).padStart(2, '0')}</Text>
              <Text style={[styles.stepTitle, o && { color: colors.textPrimary }]}>{s.title}</Text>
            </View>
            {o ? <Text style={styles.stepWhy}>{s.why}</Text> : null}
          </Pressable>
        );
      })}
      <KeyFact>Step 9 is the one that saves loudspeakers: routing is verified on meters and headphones with the amplifiers OFF. A wrong output at full level is a destroyed driver in under a second. Steps 11–13 are one common show-day order — outputs first, then inputs, then gain — and small gigs fold them into a single pass.</KeyFact>
      <DeeperRow>
        <LabLink route="SoundSystemsOperate" label="OPERATE mode — power up, line check, gain" />
        <LabLink route="PreProdLab" label="Audio Pre-Production" />
      </DeeperRow>
    </View>
  );
}

export const SS_LEARN_PAGES_B: SsPageDef[] = [
  { title: 'Subwoofer feeds', short: 'SUB FEED', Component: PageSubFeeds, manualDone: true, rack: true },
  { title: 'Subwoofer placement and arrays', short: 'SUB PLACE', Component: PageSubPlacement, manualDone: true, rack: true },
  { title: 'Stage monitors', short: 'MONITORS', Component: PageMonitors, manualDone: true, rack: true },
  { title: 'Monitor console, splits and talkback', short: 'SPLITS', Component: PageMonitorWorld, manualDone: true, rack: true },
  { title: 'Wiring and connections', short: 'WIRING', Component: PageWiring, manualDone: true },
  { title: 'Amplifier loads', short: 'LOADS', Component: PageLoads, manualDone: true, rack: true },
  { title: 'Power and headroom', short: 'POWER', Component: PagePower, manualDone: true, rack: true },
  { title: 'The deployment sequence', short: 'DEPLOY', Component: PageDeployment, manualDone: true },
];

// GEAR is referenced so the catalogue is bundled with these pages for the bin previews.
void GEAR;

const styles = StyleSheet.create({
  path: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.5, lineHeight: 17 },
  inspectHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  levelRow: { gap: 1, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelName: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  levelVolts: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 10.5 },
  levelLine: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 16 },
  pairText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  bandStage: { justifyContent: 'center', paddingHorizontal: 10 },
  bandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bandEnd: { alignItems: 'center', gap: 2, width: 72 },
  bandEndText: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 10.5 },
  bandWrap: { flex: 1, gap: 5 },
  band: { height: 22, borderRadius: 11, backgroundColor: '#050609', borderWidth: 1, borderColor: '#1f2229', overflow: 'hidden' },
  bandOk: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(55,224,95,.22)', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.green },
  bandMark: { position: 'absolute', top: -1, width: 5, height: 24, borderRadius: 2 },
  bandLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  bandText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1 },
  bandVerdict: { fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8, textAlign: 'center' },
  step: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 6, minHeight: 44 },
  stepOpen: { borderColor: '#2f4a5a', backgroundColor: '#0f1a22' },
  stepKey: { borderColor: 'rgba(255,198,77,.5)' },
  stepHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stepN: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 13 },
  stepTitle: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  stepWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
