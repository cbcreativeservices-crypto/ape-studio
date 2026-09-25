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
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { gearSpec, GEAR, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { canConnect, EMPTY_SYSTEM, place, slotDef } from '../../../features/soundsystems/system';
import { ampMatch, ampMatchCopy, CALC_LINKS, fmtOhms, loadVerdict, loadVerdictCopy, parallelLoad, predictedSpl, wattsIntoLoad, type AmpRating } from '../../../features/soundsystems/loads';
import { SETUP_SEQUENCE } from '../../../features/soundsystems/operate';
import type { GearKind, SignalLevel, SlotId } from '../../../features/soundsystems/types';
import { CalcLink, ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, PickTile, Readout, ReadoutRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph, GearInSvg, INK } from './art/gearArt';
import { CableLegend, VenueView, type PlotBeam } from './art/VenueView';
import { PLOT_BADGE } from './plot';

/* ── 8 · Subwoofer feeds ────────────────────────────────────────────────── */

type SubFeed = 'crossover' | 'aux' | 'matrix';

const SUB_FEEDS: Record<SubFeed, { name: string; path: string; reaches: string; control: string; when: string }> = {
  crossover: {
    name: 'Crossover-fed',
    path: 'Main mix → processor crossover → LOW output → subwoofer',
    reaches: 'Everything below the crossover frequency, from every channel — vocals, guitars, plosives included.',
    control: 'None at the console. The crossover decides; the sub level is a processor output trim.',
    when: 'Simple systems, DJ and playback, anywhere the operator should not need to think about the subs.',
  },
  aux: {
    name: 'Aux-fed',
    path: 'Selected channels → post-fader aux send → aux output → processor LOW → subwoofer',
    reaches: 'Only the channels you send: kick, bass, floor tom, keys. Nothing else — however low it goes.',
    control: 'Per channel AND overall: each send level, and the aux master as a sub fader.',
    when: 'Band mixing where a clean, controlled low end matters and the operator is at the console all night.',
  },
  matrix: {
    name: 'Matrix-fed',
    path: 'Main mix (and/or an aux) → matrix with its own level and EQ → subwoofer',
    reaches: 'Whatever buses the matrix takes: the whole mix, or an aux carrying just the low-frequency sources.',
    control: 'A matrix fader and processing, independent of the mains — and the choice of source bus.',
    when: 'Larger consoles and multi-zone systems, where the subs are one output among many that all derive from the finished mix.',
  },
};

function PageSubFeeds({ ctx }: { ctx: PageCtx }) {
  const [feed, setFeed] = useState<SubFeed>('crossover');
  const [seen, setSeen] = useState<Set<SubFeed>>(new Set(['crossover']));
  const [vocalSend, setVocalSend] = useState(false);
  const goals = [{ label: 'Compare all three feed methods', hit: seen.size >= 3 }, { label: 'Send the vocal to an aux-fed sub and hear why not', hit: vocalSend }];
  const latched = useVisitGoals(ctx, goals);
  const f = SUB_FEEDS[feed];
  const subsHear = feed === 'crossover' ? ['Kick', 'Bass', 'Keys', 'Guitar (low end)', 'Vocal (chest and plosives)', 'Playback'] : feed === 'aux' ? ['Kick', 'Bass', 'Keys', ...(vocalSend ? ['Vocal — by mistake'] : [])] : ['The main mix below the crossover', 'or an aux of chosen channels'];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={5}>SUBWOOFER DEPLOYMENT AND ROUTING</ChapterTag>
      <Lead>
        A subwoofer reproduces roughly 30–100 Hz and nothing else. The interesting decision is not the cabinet — it is WHAT reaches it, and that is a routing choice with three answers.
      </Lead>
      <Row>
        {(Object.keys(SUB_FEEDS) as SubFeed[]).map((k) => (
          <Btn key={k} label={SUB_FEEDS[k].name} selected={feed === k} tone={feed === k ? 'primary' : 'plain'} onPress={() => { setFeed(k); setSeen((s) => new Set(s).add(k)); }} a11y={`${SUB_FEEDS[k].name} subwoofers`} />
        ))}
      </Row>
      <Card tone="math">
        <Eyebrow>{f.name.toUpperCase()} · THE PATH</Eyebrow>
        <Text style={styles.path}>{f.path}</Text>
        <Body>REACHES THE SUBS · {f.reaches}</Body>
        <Body>CONTROL · {f.control}</Body>
        <Body>WHEN · {f.when}</Body>
      </Card>
      <Card>
        <Eyebrow>WHAT THE SUBWOOFERS HEAR RIGHT NOW</Eyebrow>
        {subsHear.map((s) => (
          <Text key={s} style={[styles.hearRow, s.includes('mistake') || s.includes('Vocal') ? { color: colors.orange } : null]}>
            {s.includes('mistake') || s.includes('Vocal') ? '△ ' : '● '}
            {s}
          </Text>
        ))}
        {feed === 'aux' ? (
          <Pressable onPress={() => setVocalSend((v) => !v)} style={[styles.toggle, vocalSend && styles.toggleOn]} accessibilityRole="switch" accessibilityState={{ checked: vocalSend }} aria-checked={vocalSend} accessibilityLabel="Vocal channel send to the sub aux">
            <Text style={[styles.toggleText, vocalSend && { color: colors.orange }]}>{vocalSend ? '△ VOCAL → SUB AUX: ON (the fault on the bench)' : '○ VOCAL → SUB AUX: OFF'}</Text>
          </Pressable>
        ) : null}
      </Card>
      <KeyFact>Crossover-fed subs get everything below the crossover. Aux-fed and matrix-fed subs get what you choose — which is why an accidental vocal send puts a singer’s chest in the subwoofers with the crossover blameless.</KeyFact>
      <Card>
        <Eyebrow>ALSO IN THE CHAIN</Eyebrow>
        <Body>High-pass and low-pass filters make the crossover; a powered subwoofer’s internal crossover does the same job without a processor, and hands the tops a high-passed feed from its own output. Polarity and delay between the subs and the tops are set at the crossover point — the alignment page covers that.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 9 · Subwoofer placement ────────────────────────────────────────────── */

type SubLayout = 'lr' | 'center' | 'cardioid' | 'endfire' | 'flown';

const SUB_LAYOUTS: Record<SubLayout, { name: string; beams: PlotBeam[]; placed: { slot: SlotId; kind: GearKind }[]; what: string; cost: string }> = {
  lr: {
    name: 'Left / right',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [
      { x: slotDef('subL').x, y: slotDef('subL').y, aimDeg: 0, coverDeg: 360, gain: 0.7, color: '#2f74ff' },
      { x: slotDef('subR').x, y: slotDef('subR').y, aimDeg: 0, coverDeg: 360, gain: 0.7, color: '#2f74ff' },
    ],
    what: 'Subs under each main. The most common layout because it is the easiest to rig.',
    cost: 'Two sources of the same low-frequency signal, spaced apart: down the centre line they add; off to the sides they arrive at different times and cancel at some frequencies — the power alley and the valleys beside it.',
  },
  center: {
    name: 'Centre cluster',
    placed: [{ slot: 'subC', kind: 'passiveSub' }],
    beams: [{ x: slotDef('subC').x, y: slotDef('subC').y, aimDeg: 0, coverDeg: 360, gain: 0.9, color: '#2f74ff' }],
    what: 'All the subs together in one place, in front of the stage.',
    cost: 'One source, so no cancellation between subs: the low end is even across the width of the room. The trade is stage rumble and a cluster in the sightline.',
  },
  cardioid: {
    name: 'Cardioid (rear-facing box)',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [
      { x: slotDef('subL').x, y: slotDef('subL').y, aimDeg: 0, coverDeg: 200, gain: 0.7, color: '#2f74ff' },
      { x: slotDef('subR').x, y: slotDef('subR').y, aimDeg: 0, coverDeg: 200, gain: 0.7, color: '#2f74ff' },
    ],
    what: 'One box in each stack turned to face the stage, delayed and polarity-flipped so its output cancels behind the stack and adds in front.',
    cost: 'A quieter stage — less low-frequency spill into the microphones — for one cabinet’s worth of output in front. Needs a processor with per-output delay and polarity.',
  },
  endfire: {
    name: 'End-fire array',
    placed: [{ slot: 'subC', kind: 'passiveSub' }, { slot: 'frontFillL', kind: 'passiveSub' }],
    beams: [{ x: slotDef('subC').x, y: slotDef('subC').y + 6, aimDeg: 0, coverDeg: 160, gain: 0.9, color: '#2f74ff' }],
    what: 'Subs in a line front-to-back, each delayed by the time sound takes to reach the next, so the outputs add forward and cancel backward.',
    cost: 'The most directional low end a ground stack can make; it needs depth in front of the stage and exact delays.',
  },
  flown: {
    name: 'Flown subs',
    placed: [{ slot: 'subL', kind: 'passiveSub' }, { slot: 'subR', kind: 'passiveSub' }],
    beams: [
      { x: slotDef('subL').x, y: slotDef('subL').y, aimDeg: 0, coverDeg: 360, gain: 0.55, color: '#2f74ff' },
      { x: slotDef('subR').x, y: slotDef('subR').y, aimDeg: 0, coverDeg: 360, gain: 0.55, color: '#2f74ff' },
    ],
    what: 'Subs hung beside or behind the main arrays.',
    cost: 'More even front-to-back — the front rows are no longer standing on the cabinets — at the price of the floor’s boundary gain. Ground-stacked subs are louder for the same box; flown subs are more even.',
  },
};

function PageSubPlacement({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<SubLayout>('lr');
  const [seen, setSeen] = useState<Set<SubLayout>>(new Set(['lr']));
  const goals = [{ label: 'View four sub arrangements', hit: seen.size >= 4 }];
  const latched = useVisitGoals(ctx, goals);
  const l = SUB_LAYOUTS[id];
  const placed = [
    { id: 'l', kind: 'passiveSpeaker' as GearKind, slot: 'mainL' as SlotId },
    { id: 'r', kind: 'passiveSpeaker' as GearKind, slot: 'mainR' as SlotId },
    ...l.placed.map((p, i) => ({ id: `s${i}`, kind: p.kind, slot: p.slot })),
  ];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={5}>SUBWOOFER PLACEMENT AND ARRAYS</ChapterTag>
      <Lead>
        Low frequencies are long: a 60 Hz wave is nearly six metres. Two subwoofers a room-width apart are, to that wave, two sources that cannot help interfering. Where you put them decides where the low end adds and where it vanishes.
      </Lead>
      <View style={styles.tiles}>
        {(Object.keys(SUB_LAYOUTS) as SubLayout[]).map((k) => (
          <PickTile key={k} label={SUB_LAYOUTS[k].name} selected={id === k} done={seen.has(k)} onPress={() => { setId(k); setSeen((s) => new Set(s).add(k)); }} />
        ))}
      </View>
      <VenueView placed={placed} beams={l.beams} field badge={PLOT_BADGE} a11y={`Plot of the ${l.name} subwoofer arrangement`} caption="The floor tint shows where the low end lands in this conceptual model. Real rooms add their boundaries and their modes — measure before you trust a layout." />
      <Card tone="math">
        <Eyebrow>{l.name.toUpperCase()}</Eyebrow>
        <Body>{l.what}</Body>
        <Body>THE TRADE · {l.cost}</Body>
      </Card>
      <KeyFact>Preventing excessive low-frequency build-up is mostly geometry: fewer separated sources, boundaries used deliberately, and a high-pass filter on every channel that has no business below 100 Hz.</KeyFact>
      <DeeperRow>
        <LabLink route="WaveLab" label="Wave Physics — interference and standing waves" />
        <CalcLink id={CALC_LINKS.comb.workspace} label="Comb filter from a path difference" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 10 · Stage monitors ────────────────────────────────────────────────── */

const MONITOR_KINDS: readonly { id: string; kind: GearKind; slot: SlotId; name: string; blurb: string }[] = [
  { id: 'wedge', kind: 'wedge', slot: 'mon2', name: 'Floor wedge', blurb: 'Angled at one performer, fed from one aux send. Its whole design is to be heard by the person in front of it and rejected by the microphone above it.' },
  { id: 'side', kind: 'wedge', slot: 'sideFillL', name: 'Side fill', blurb: 'A larger cabinet at the wing, covering the whole stage with a general mix so performers who move still hear the band.' },
  { id: 'drum', kind: 'poweredSub', slot: 'drumFill', name: 'Drum fill', blurb: 'A sub-and-top stack beside the drummer: the one performer who needs to feel the kick and bass as well as hear them.' },
  { id: 'iem', kind: 'iemPack', slot: 'stageC', name: 'In-ear monitors', blurb: 'Sealed earphones from a bodypack — wired or wireless. No wedge on the floor, no spill into the microphones, a stereo mix if the transmitter is stereo. Isolation is the point, and also the hazard.' },
];

function PageMonitors({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string>('wedge');
  const [seen, setSeen] = useState<Set<string>>(new Set(['wedge']));
  const goals = [{ label: 'Inspect all four monitor types', hit: seen.size >= 4 }];
  const latched = useVisitGoals(ctx, goals);
  const m = MONITOR_KINDS.find((x) => x.id === sel)!;
  const placed = MONITOR_KINDS.map((k) => ({ id: k.id, kind: k.kind, slot: k.slot }));
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={6}>STAGE MONITORS AND PERFORMER MIXES</ChapterTag>
      <Lead>
        The audience hears one mix. Each performer needs a different one — more of themselves, less of the drummer, a click nobody else may hear. Monitoring is a second sound system pointed the other way.
      </Lead>
      <VenueView placed={placed} selectedId={sel} onTapPlaced={(id) => { setSel(id); setSeen((s) => new Set(s).add(id)); }} beams={MONITOR_KINDS.filter((k) => k.kind === 'wedge').map((k) => ({ x: slotDef(k.slot).x, y: slotDef(k.slot).y, aimDeg: k.slot === 'sideFillL' ? 90 : 180, coverDeg: 70, gain: 0.4, color: '#c9a6ff' }))} a11y="Monitor positions on the stage: a wedge, a side fill, a drum fill and an in-ear pack. Tap one to read about it." />
      <Prompt>Tap a monitor on the stage.</Prompt>
      <Card tone="math">
        <View style={styles.inspectHead}>
          <GearGlyph kind={m.kind} size={52} label={m.name} />
          <Eyebrow>{m.name.toUpperCase()}</Eyebrow>
        </View>
        <Body>{m.blurb}</Body>
      </Card>
      <Card>
        <Eyebrow>THE RULES THAT DO NOT CHANGE</Eyebrow>
        <Body>Monitor mixes are PRE-FADER aux sends — the house fader must never move a wedge. Effects sends are post-fader. Each aux output feeds one wedge amplifier channel or one in-ear transmitter; a stereo in-ear mix needs a stereo aux and a stereo transmitter.</Body>
      </Card>
      <Card tone="warn">
        <Eyebrow>HEARING SAFETY — IN-EAR LEVELS</Eyebrow>
        <Body>Sealed in-ears remove the room, so a performer reaches for level to feel the band. The limiter on the bodypack is not optional, and the mix should be built so the performer is comfortable at a moderate setting. A wedge is loud in a room; an in-ear is loud in an ear canal.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 11 · The monitor world ─────────────────────────────────────────────── */

function PageMonitorWorld({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState(0);
  const goals = [{ label: 'Answer both checks', hit: solved >= 2 }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={6}>MONITOR CONSOLE, SPLITS AND TALKBACK</ChapterTag>
      <Lead>
        On a small show one console does both jobs. On a large one, a monitor engineer at the side of the stage mixes every performer’s feed on a second console — and both consoles need every microphone.
      </Lead>
      <Card>
        <Eyebrow>ANALOG SPLIT</Eyebrow>
        <Body>A transformer-isolated splitter sends each microphone to both consoles. Each console has its own preamp and its own gain — independent, but two preamps loading one microphone, and twice the cabling.</Body>
      </Card>
      <Card>
        <Eyebrow>DIGITAL GAIN SHARING</Eyebrow>
        <Body>One stagebox, one preamp per microphone, two consoles on the network. Whoever owns the preamp gain changes it for both; the other console applies a digital trim so a gain move at monitors does not move the house. Gain compensation is the setting that makes this workable — and forgetting it is a classic fault.</Body>
      </Card>
      <Card>
        <Eyebrow>TALKBACK</Eyebrow>
        <Body>A microphone at each console routed to the monitor mixes (and to each other) so the engineers can speak to the stage without going through the house. Its routing is checked like any other: which wedges hear it, and never the main mix.</Body>
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
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 12 · Wiring and connections ────────────────────────────────────────── */

const LEVELS: readonly { level: SignalLevel; volts: string; carried: string; cable: string }[] = [
  { level: 'mic', volts: 'millivolts', carried: 'Microphones, DI outputs', cable: 'Balanced XLR' },
  { level: 'instrument', volts: 'tens of millivolts, high impedance', carried: 'Guitars, basses, keyboards', cable: 'Unbalanced ¼-inch TS — short runs only, then a DI' },
  { level: 'line', volts: 'about a volt (+4 dBu)', carried: 'Console outputs, processors, playback', cable: 'Balanced XLR or TRS' },
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
      <Lead>
        Five signal levels, and a connector’s shape never tells you which one it carries. The wiring chapters of the cable labs go deep; here is the system-level rule and the one connection that damages equipment.
      </Lead>
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
      <KeyFact>Speaker level into a line or mic input damages the input. Mic level into a line input is silence. Line level into a passive loudspeaker moves no cone. Every refusal in BUILD mode is one of these three sentences.</KeyFact>
      <Prompt>May these connect? Decide, then read the system’s verdict.</Prompt>
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
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 13 · Loads ─────────────────────────────────────────────────────────── */

const AMP: AmpRating = { at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 };

function LoadRig({ ohms, count, bridged }: { ohms: number; count: number; bridged: boolean }) {
  const W = 300;
  const H = 120;
  const cabs = Array.from({ length: count }, (_, i) => i);
  return (
    <Svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ aspectRatio: W / H }} accessibilityLabel={`${count} cabinet${count === 1 ? '' : 's'} of ${ohms} ohms in parallel on one amplifier channel${bridged ? ', bridged' : ''}`}>
      <GearInSvg kind="amp" id="lr-amp" x={44} y={58} size={70} />
      <SvgText x={44} y={104} fontSize={8} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{bridged ? 'AMP · BRIDGED' : 'AMP · CH A'}</SvgText>
      {cabs.map((i) => {
        const x = 120 + i * 46;
        const y = 56;
        return (
          <Svg key={i}>
            <Path d={`M 78 58 C 96 58 ${x - 26} ${y + 4} ${x - 14} ${y + 6}`} stroke="#ff7a5c" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Path d={`M 78 58 C 96 58 ${x - 26} ${y + 4} ${x - 14} ${y + 6}`} stroke="#fff" strokeWidth={0.6} fill="none" opacity={0.3} />
            <GearInSvg kind="passiveSpeaker" id={`lr-cab-${i}`} x={x} y={y} size={46} />
            <SvgText x={x} y={y + 34} fontSize={8} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.mono}>{ohms} Ω</SvgText>
          </Svg>
        );
      })}
      {count > 1 ? <SvgText x={120 + (count - 1) * 23} y={16} fontSize={8} fill={INK.metalHi} textAnchor="middle" fontFamily={fonts.oswaldMedium}>IN PARALLEL</SvgText> : null}
      <Circle cx={78} cy={58} r={2.5} fill="#ff7a5c" />
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
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={8}>AMPLIFIERS AND LOUDSPEAKER COMPATIBILITY · LOADS</ChapterTag>
      <Lead>
        A passive loudspeaker is a load. Put two on one amplifier channel in parallel and the load halves; the amplifier must deliver twice the current. Every amplifier has a minimum impedance, and below it the story ends in protection or smoke.
      </Lead>
      <LoadRig ohms={ohms} count={count} bridged={bridged} />
      <Row>
        <Text style={styles.ctlLabel}>CABINET</Text>
        {[16, 8, 4].map((z) => (
          <Btn key={z} label={`${z} Ω`} selected={ohms === z} tone={ohms === z ? 'primary' : 'plain'} onPress={() => setOhms(z)} a11y={`${z} ohm cabinets`} />
        ))}
      </Row>
      <Row>
        <Text style={styles.ctlLabel}>HOW MANY</Text>
        {[1, 2, 3, 4].map((n) => (
          <Btn key={n} label={`${n}`} selected={count === n} tone={count === n ? 'primary' : 'plain'} onPress={() => setCount(n)} a11y={`${n} cabinet${n === 1 ? '' : 's'} in parallel`} />
        ))}
        <Btn label={bridged ? '● BRIDGED' : '○ BRIDGED'} selected={bridged} onPress={() => setBridged((b) => !b)} a11y={`Bridged mode ${bridged ? 'on' : 'off'}`} />
      </Row>
      <ReadoutRow>
        <Readout k="TOTAL LOAD" v={fmtOhms(load.ohms)} tint={verdict === 'unsafe' ? colors.red : verdict === 'marginal' ? colors.gold : colors.green} />
        <Readout k="AMP MINIMUM" v={`${min} Ω`} />
        <Readout k="POWER INTO LOAD" v={watts == null ? '—' : `${watts} W`} />
      </ReadoutRow>
      <VerdictLine ok={verdict === 'safe'} warn={verdict === 'marginal' || verdict === 'open'}>
        {loadVerdictCopy(verdict, load.ohms, min)}
      </VerdictLine>
      {load.warning ? <VerdictLine ok={false}>{load.warning}</VerdictLine> : null}
      <Card tone="math">
        <Eyebrow>THE ARITHMETIC · FROM THE CALCULATOR</Eyebrow>
        <Text style={styles.path}>Ztot = 1 ÷ Σ(1/Zi)</Text>
        <Body>Parallel cabinets share the amplifier’s voltage and each draws its own current; the total impedance is always below the lowest cabinet. Bridging joins two channels into one with twice the voltage swing — and DOUBLES the minimum impedance (typically 8 Ω), so a bridged 4 Ω load is the classic mistake.</Body>
        <Body>This amplifier’s ratings — {AMP.at8} W at 8 Ω, {AMP.at4} W at 4 Ω, {AMP.bridged8} W bridged at 8 Ω, {AMP.minOhms} Ω minimum — are an example. Read YOUR amplifier’s table; never assume the ratio.</Body>
      </Card>
      <DeeperRow>
        <CalcLink id={CALC_LINKS.parallel.workspace} label="Parallel loads" />
        <CalcLink id="cable" label="Speaker cable loss and gauge" />
        <LabLink route="AmpLab" label="Amplifier Principles Lab" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 14 · Power and headroom ────────────────────────────────────────────── */

const CABINET = { continuous: 400, program: 800, sensitivity: 97 };

function PagePower({ ctx }: { ctx: PageCtx }) {
  const [amp, setAmp] = useState(500);
  const [dist, setDist] = useState(10);
  const [tried, setTried] = useState<Set<number>>(new Set([500]));
  const goals = [{ label: 'Try an underpowered, a matched and an oversized amplifier', hit: tried.size >= 3 }];
  const latched = useVisitGoals(ctx, goals);
  const match = ampMatch(amp, CABINET.continuous, CABINET.program);
  const spl = predictedSpl(CABINET.sensitivity, amp, dist, 6);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={8}>POWER RATINGS, HEADROOM AND PROTECTION</ChapterTag>
      <Lead>
        A loudspeaker carries three power numbers — continuous, program and peak — and an amplifier carries one per load. Matching them is a band, not a bullseye, and the wrong side of the band is not the side most people expect.
      </Lead>
      <Row>
        <Text style={styles.ctlLabel}>AMPLIFIER INTO 8 Ω</Text>
        {[200, 500, 800, 1500].map((w) => (
          <Btn key={w} label={`${w} W`} selected={amp === w} tone={amp === w ? 'primary' : 'plain'} onPress={() => { setAmp(w); setTried((t) => new Set(t).add(w)); }} a11y={`${w} watt amplifier`} />
        ))}
      </Row>
      <ReadoutRow>
        <Readout k="CABINET CONTINUOUS" v={`${CABINET.continuous} W`} />
        <Readout k="CABINET PROGRAM" v={`${CABINET.program} W`} />
        <Readout k="MATCH" v={match === 'ok' ? 'IN BAND' : match === 'under' ? 'UNDER' : 'OVER'} tint={match === 'ok' ? colors.green : match === 'under' ? colors.red : colors.gold} />
      </ReadoutRow>
      <VerdictLine ok={match === 'ok'} warn={match === 'over'}>{ampMatchCopy(match, amp, CABINET.continuous, CABINET.program)}</VerdictLine>
      <Card tone="math">
        <Eyebrow>HOW LOUD, WHERE · FROM THE CALCULATOR</Eyebrow>
        <Row>
          <Text style={styles.ctlLabel}>LISTENER AT</Text>
          {[2, 10, 30].map((d) => (
            <Btn key={d} label={`${d} m`} selected={dist === d} tone={dist === d ? 'primary' : 'plain'} onPress={() => setDist(d)} a11y={`Listener at ${d} metres`} />
          ))}
        </Row>
        <Text style={styles.path}>SPL = sensitivity + 10·log10(P) − 20·log10(d) − headroom</Text>
        <ReadoutRow>
          <Readout k="SENSITIVITY" v={`${CABINET.sensitivity} dB · 1 W / 1 m`} />
          <Readout k="WITH 6 dB HEADROOM" v={`${spl.toFixed(1)} dB SPL`} tint={colors.amber} />
        </ReadoutRow>
        <Body>Free-field, one cabinet, 6 dB kept in reserve for peaks. Every doubling of power buys 3 dB; every doubling of distance costs 6. That asymmetry is why coverage is solved with placement and count before it is solved with watts.</Body>
      </Card>
      <Card>
        <Eyebrow>PROTECTING HIGH-FREQUENCY DRIVERS</Eyebrow>
        <Body>Tweeters die from clipped amplifiers and from sustained feedback far more often than from clean power. The processor’s limiter, set for the cabinet; a powered loudspeaker’s input gain left at its nominal mark; and an operator who reduces gain before the clip light stays on — these are the protections. Sensitivity and maximum SPL on the data sheet tell you how loud a cabinet CAN go; headroom tells you how loud you should ASK it to go.</Body>
      </Card>
      <DeeperRow>
        <CalcLink id={CALC_LINKS.spl.workspace} label="Loudspeaker power and SPL" />
        <CalcLink id={CALC_LINKS.splDistance.workspace} label="SPL at a distance" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
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
      <KeyFact>Step 9 is the one that saves loudspeakers: routing is verified on meters and headphones with the amplifiers OFF. A wrong output at full level is a destroyed driver in under a second.</KeyFact>
      <DeeperRow>
        <LabLink route="SoundSystemsOperate" label="OPERATE mode — power up, line check, gain" />
        <LabLink route="PreProdLab" label="Audio Pre-Production" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const SS_LEARN_PAGES_B: PageDef[] = [
  { title: 'Subwoofer feeds', short: 'SUB FEED', Component: PageSubFeeds, manualDone: true },
  { title: 'Subwoofer placement and arrays', short: 'SUB PLACE', Component: PageSubPlacement, manualDone: true },
  { title: 'Stage monitors', short: 'MONITORS', Component: PageMonitors, manualDone: true },
  { title: 'Monitor console, splits and talkback', short: 'SPLITS', Component: PageMonitorWorld, manualDone: true },
  { title: 'Wiring and connections', short: 'WIRING', Component: PageWiring, manualDone: true },
  { title: 'Amplifier loads', short: 'LOADS', Component: PageLoads, manualDone: true },
  { title: 'Power and headroom', short: 'POWER', Component: PagePower, manualDone: true },
  { title: 'The deployment sequence', short: 'DEPLOY', Component: PageDeployment, manualDone: true },
];

// GEAR is referenced so the catalogue is bundled with these pages for the bin previews.
void GEAR;

const styles = StyleSheet.create({
  path: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.5, lineHeight: 17 },
  hearRow: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19 },
  toggle: { marginTop: 6, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 10, justifyContent: 'center' },
  toggleOn: { borderColor: colors.orange, backgroundColor: '#241a10' },
  toggleText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.8 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  inspectHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  levelRow: { gap: 1, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  levelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelName: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  levelVolts: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 10.5 },
  levelLine: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrow: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 16 },
  pairText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  ctlLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6, marginRight: 2 },
  step: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 6, minHeight: 44 },
  stepOpen: { borderColor: '#2f4a5a', backgroundColor: '#0f1a22' },
  stepKey: { borderColor: 'rgba(255,198,77,.5)' },
  stepHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stepN: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 13 },
  stepTitle: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  stepWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
