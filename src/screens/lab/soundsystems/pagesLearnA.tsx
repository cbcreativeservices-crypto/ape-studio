/**
 * Sound Systems Lab — LEARN pages 1–7 (chapters 1–4).
 *
 * Chapter 1 · the complete system (tap any component; trace the signal)
 * Chapter 2 · PA system types (ten kinds; match the venue)
 * Chapter 3 · output configurations (thirteen, visual only; choose one)
 * Chapter 4 · the routing map (six tools, and the ROUTE mode to drill them)
 *
 * Copy is the register a working engineer uses with a client: plain,
 * technical, no promises. "Live sound reinforcement" throughout.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { gearSpec, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { OUTPUT_CONFIGS, SYSTEM_TYPES, VENUE_CASES, FEEDS, type FeedId, type OutputConfig } from '../../../features/soundsystems/configs';
import { ROUTING_TOOLS } from '../../../features/soundsystems/console';
import { slotDef } from '../../../features/soundsystems/system';
import type { GearKind } from '../../../features/soundsystems/types';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, PickTile, Readout, ReadoutRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph } from './art/gearArt';
import { SystemDiagram, type DiagramStation } from './art/SystemDiagram';
import { VenueView } from './art/VenueView';
import { PLOT_BADGE, layoutToBeams, layoutToPlaced } from './plot';

/* ── 1 · The complete system ────────────────────────────────────────────── */

const CHAIN: readonly { id: string; kind: GearKind; label: string }[] = [
  { id: 'mic', kind: 'vocalMic', label: 'Source' },
  { id: 'di', kind: 'di', label: 'DI' },
  { id: 'box', kind: 'stagebox', label: 'Stagebox' },
  { id: 'con', kind: 'console', label: 'Console' },
  { id: 'proc', kind: 'processor', label: 'Processor' },
  { id: 'amp', kind: 'amp', label: 'Amplifier' },
  { id: 'top', kind: 'passiveSpeaker', label: 'Loudspeaker' },
  { id: 'sub', kind: 'passiveSub', label: 'Subwoofer' },
  { id: 'wedge', kind: 'wedge', label: 'Monitor' },
];

function PageSystem({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const stations: DiagramStation[] = [...CHAIN.map((c) => ({ id: c.id, kind: c.kind, label: c.label })), { id: 'ear', kind: 'listener', label: 'Listener' }];
  const tap = (id: string) => {
    setSel(id);
    setSeen((s) => new Set(s).add(id));
  };
  const goals = [
    { label: 'Inspect four components', hit: seen.size >= 4 },
    { label: 'Inspect the console', hit: seen.has('con') },
    { label: 'Inspect a loudspeaker', hit: seen.has('top') || seen.has('sub') || seen.has('wedge') },
  ];
  const latched = useVisitGoals(ctx, goals);
  const spec = sel && sel !== 'ear' ? gearSpec(CHAIN.find((c) => c.id === sel)!.kind) : null;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={1}>UNDERSTANDING THE COMPLETE PA SYSTEM</ChapterTag>
      <Lead>
        A live sound reinforcement system has one job: carry a performer’s sound to every listener, louder than the room would on its own, and still sounding like the performer. Everything on this diagram exists to do one part of that.
      </Lead>
      <SystemDiagram stations={stations} selectedId={sel} onTap={tap} a11y="The signal thread from a vocal microphone through a DI, stagebox, console, processor, amplifier, loudspeaker, subwoofer and monitor to the listener. Tap any station to read where its signal comes from and where it goes." />
      <Prompt>Tap any component. Where does its signal come from — and where does it go next?</Prompt>
      {spec ? (
        <Card tone="math">
          <View style={styles.inspectHead}>
            <GearGlyph kind={spec.kind} size={52} label={spec.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow>{spec.name.toUpperCase()}</Eyebrow>
              <Text style={styles.levels}>
                {spec.accepts.length ? `IN: ${spec.accepts.map((l) => LEVEL_LABEL[l]).join(' / ')}` : 'IN: nothing — a source'}
                {'   '}
                {spec.emits.length ? `OUT: ${spec.emits.map((l) => LEVEL_LABEL[l]).join(' / ')}` : 'OUT: sound'}
              </Text>
            </View>
          </View>
          <Body>{spec.blurb}</Body>
          <Text style={styles.fromTo}>◂ FROM · {spec.from}</Text>
          <Text style={styles.fromTo}>▸ TO · {spec.to}</Text>
        </Card>
      ) : sel === 'ear' ? (
        <Card tone="math">
          <Eyebrow>THE LISTENER</Eyebrow>
          <Body>The only component that cannot be replaced, moved or re-patched — and the one every other decision is measured against. Coverage, level, timing and intelligibility are all judged at the ear, not at the console.</Body>
        </Card>
      ) : null}
      <Card>
        <Eyebrow>THE SECTIONS OF EVERY SYSTEM</Eyebrow>
        <Body>Sound source → microphones, DIs, playback and wireless → stage inputs → analog snake or digital stagebox → mixing console → signal processing → loudspeaker management processor → power amplifiers → passive and powered loudspeakers, subwoofers, stage monitors and in-ears → main, auxiliary, group, matrix and zone outputs — all of it standing on electrical power and grounding that were designed for it.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 2 · Trace the signal ───────────────────────────────────────────────── */

const TRACE_ORDER = ['mic', 'box', 'con', 'proc', 'amp', 'top', 'ear'] as const;
const TRACE_LABEL: Record<(typeof TRACE_ORDER)[number], string> = {
  mic: 'Microphone',
  box: 'Stagebox',
  con: 'Console',
  proc: 'Processor',
  amp: 'Amplifier',
  top: 'Loudspeaker',
  ear: 'Listener',
};
const TRACE_KIND: Record<(typeof TRACE_ORDER)[number], DiagramStation['kind']> = {
  mic: 'vocalMic',
  box: 'stagebox',
  con: 'console',
  proc: 'processor',
  amp: 'amp',
  top: 'passiveSpeaker',
  ear: 'listener',
};

function PageTrace({ ctx }: { ctx: PageCtx }) {
  const [picked, setPicked] = useState<string[]>([]);
  // Shuffle the bin once per mount so the order is not given away by layout.
  const bin = useMemo(() => [...TRACE_ORDER].sort(() => Math.random() - 0.5), []);
  const wrongAt = picked.findIndex((id, i) => id !== TRACE_ORDER[i]);
  const complete = picked.length === TRACE_ORDER.length && wrongAt < 0;
  const goals = [{ label: 'Trace source → listener in order', hit: complete }];
  const latched = useVisitGoals(ctx, goals);
  const stations: DiagramStation[] = picked.map((id) => ({ id, kind: TRACE_KIND[id as never], label: TRACE_LABEL[id as never], state: 'ok' }));
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={1}>BASIC SIGNAL-FLOW TRACING</ChapterTag>
      <Lead>
        Tracing is the habit every other skill rests on: from the source, forward, one station at a time. Build the thread in the order the signal travels.
      </Lead>
      {stations.length ? (
        <SystemDiagram stations={stations} flowing={complete} breakAfter={wrongAt >= 0 ? wrongAt - 1 : null} a11y={`Your thread so far: ${picked.map((p) => TRACE_LABEL[p as never]).join(', ')}`} />
      ) : (
        <Card>
          <Body>The thread is empty. Start where the signal begins.</Body>
        </Card>
      )}
      {wrongAt >= 0 ? (
        <VerdictLine ok={false}>
          {TRACE_LABEL[picked[wrongAt] as never]} cannot come after {wrongAt === 0 ? 'the start' : TRACE_LABEL[picked[wrongAt - 1] as never]} — the signal has not reached it yet. Reset and try again.
        </VerdictLine>
      ) : complete ? (
        <VerdictLine ok>Source to listener, in order. That is the walk you will make on every fault.</VerdictLine>
      ) : null}
      <Prompt>Tap the next station the signal reaches.</Prompt>
      <Row>
        {bin.map((id) => (
          <Btn key={id} label={TRACE_LABEL[id]} disabled={picked.includes(id) || wrongAt >= 0} onPress={() => setPicked((p) => [...p, id])} a11y={`${TRACE_LABEL[id]}${picked.includes(id) ? ', placed' : ''}`} />
        ))}
        {picked.length ? <Btn label="RESET" tone="danger" onPress={() => setPicked([])} a11y="Reset the thread" /> : null}
      </Row>
      <KeyFact>Signal falls forward: source, stage input, console, processing, amplification, loudspeaker, listener. A fault is found by walking that order — never by guessing at the far end.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 3 · Ten kinds of system ────────────────────────────────────────────── */

function PageSystemTypes({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState(SYSTEM_TYPES[0].id);
  const [seen, setSeen] = useState<Set<string>>(new Set([SYSTEM_TYPES[0].id]));
  const t = SYSTEM_TYPES.find((x) => x.id === id)!;
  const goals = [{ label: 'View five system types', hit: seen.size >= 5 }, { label: 'View the line array and the distributed system', hit: seen.has('line-array') && seen.has('distributed') }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={2}>PA SYSTEM TYPES</ChapterTag>
      <Lead>
        Systems differ by WHEN they are the right answer, not just by what is in the case. The same band in a café, a club and a field needs three different systems.
      </Lead>
      <View style={styles.tiles}>
        {SYSTEM_TYPES.map((s) => (
          <PickTile key={s.id} label={s.name} selected={s.id === id} done={seen.has(s.id)} onPress={() => { setId(s.id); setSeen((v) => new Set(v).add(s.id)); }} />
        ))}
      </View>
      <VenueView placed={layoutToPlaced(t.layout)} beams={layoutToBeams(t.layout)} field badge={PLOT_BADGE} a11y={`Plot of a ${t.name}: ${t.layout.map((p) => `${p.kind} at ${slotDef(p.slot).label}`).join(', ')}`} />
      <Card tone="math">
        <Eyebrow>{t.name.toUpperCase()} · {t.scale.toUpperCase()}</Eyebrow>
        <Text style={styles.chain}>{t.chain.join('  →  ')}</Text>
        <Body>WHEN · {t.when}</Body>
        <Body>NOT WHEN · {t.notWhen}</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 4 · Match the venue ────────────────────────────────────────────────── */

function PageVenueMatch({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const count = VENUE_CASES.filter((v) => solved[v.id]).length;
  const goals = [{ label: `Match all ${VENUE_CASES.length} venues`, hit: count >= VENUE_CASES.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={2}>WHEN EACH DESIGN IS APPROPRIATE</ChapterTag>
      <Lead>Eight venues. Choose the system each one calls for — and read why the runner-up would have been carried in for nothing.</Lead>
      {VENUE_CASES.map((v, i) => {
        const names = SYSTEM_TYPES.map((t) => t.name);
        const correctIdx = SYSTEM_TYPES.findIndex((t) => t.id === v.correct);
        // Four options: the right one plus three neighbours, so the list stays readable.
        const pool = [correctIdx, (correctIdx + 3) % 10, (correctIdx + 5) % 10, (correctIdx + 7) % 10];
        const options = pool.map((k) => names[k]);
        return (
          <UnderstandingCheck
            key={v.id}
            eyebrow={`VENUE ${i + 1} OF ${VENUE_CASES.length}`}
            question={v.venue}
            options={options}
            correct={0}
            explain={v.why}
            onCorrect={() => setSolved((s) => ({ ...s, [v.id]: true }))}
          />
        );
      })}
      <Body>{count} of {VENUE_CASES.length} matched.</Body>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 5 · Output configurations ──────────────────────────────────────────── */

function feedBars(c: OutputConfig): [FeedId, number][] {
  const feeds = new Map<FeedId, number>();
  for (const p of c.layout) feeds.set(p.feed, (feeds.get(p.feed) ?? 0) + 1);
  for (const f of c.extraFeeds ?? []) feeds.set(f, 0);
  return [...feeds.entries()];
}

function PageConfigs({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState(OUTPUT_CONFIGS[0].id);
  const [seen, setSeen] = useState<Set<string>>(new Set([OUTPUT_CONFIGS[0].id]));
  const c = OUTPUT_CONFIGS.find((x) => x.id === id)!;
  const goals = [
    { label: 'View six configurations', hit: seen.size >= 6 },
    { label: 'Compare stereo and LCR', hit: seen.has('stereo') && seen.has('lcr') },
    { label: 'Compare mono subs and stereo subs', hit: seen.has('stereo-mono-subs') && seen.has('stereo-subs') },
  ];
  const latched = useVisitGoals(ctx, goals);
  const bars = feedBars(c);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={3}>OUTPUT CONFIGURATIONS</ChapterTag>
      <Lead>
        The output configuration is the decision that shapes everything downstream: how many loudspeaker positions, what each one carries, and which console buses feed them. Pick one and watch the plot, the feeds and the coverage change.
      </Lead>
      <View style={styles.tiles}>
        {OUTPUT_CONFIGS.map((o) => (
          <PickTile key={o.id} label={o.name} selected={o.id === id} done={seen.has(o.id)} onPress={() => { setId(o.id); setSeen((v) => new Set(v).add(o.id)); }} />
        ))}
      </View>
      <VenueView placed={layoutToPlaced(c.layout)} beams={layoutToBeams(c.layout)} field badge={PLOT_BADGE} a11y={`Plot of ${c.name}: ${c.layout.map((p) => `${FEEDS[p.feed].name} feed at ${slotDef(p.slot).label}`).join(', ')}`} caption="Coverage beams and the floor tint are a conceptual model of where each feed lands — not a measurement." />
      <ReadoutRow>
        {bars.map(([feed, n]) => (
          <Readout key={feed} k={FEEDS[feed].name.toUpperCase()} v={n ? `${n} box${n > 1 ? 'es' : ''}` : 'output'} tint={FEEDS[feed].band === 'low' ? '#2f74ff' : colors.amber} />
        ))}
      </ReadoutRow>
      <Card tone="math">
        <Eyebrow>{c.name.toUpperCase()}</Eyebrow>
        <Body>{c.what}</Body>
        <Body>WHEN · {c.when}</Body>
        <Body>WHAT CHANGES · {c.changes}</Body>
        <Text style={styles.busLine}>BUSES · {bars.map(([f]) => `${FEEDS[f].name}: ${FEEDS[f].bus}`).join(' · ')}</Text>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 6 · Choose the configuration ───────────────────────────────────────── */

const CONFIG_CASES: readonly { id: string; situation: string; correct: string; distractors: string[]; why: string }[] = [
  { id: 'c-speech', situation: 'A lecture in a long, narrow hall. One presenter, no music.', correct: 'mono', distractors: ['stereo', 'stereo-subs', 'lcr'], why: 'One position, one signal: every seat hears the same thing, and there is no pair to comb-filter down the middle of a narrow room.' },
  { id: 'c-musical', situation: 'A musical in a wide theatre — the voice must seem to come from the actor for the seats at the far sides.', correct: 'lcr', distractors: ['stereo', 'dual-mono', 'zones'], why: 'A centre cluster carries the voice for every seat; left and right carry the width. Stereo alone gives the side seats a one-sided vocal.' },
  { id: 'c-dj', situation: 'A DJ in a bar. The owner wants to turn the bass down at 11 pm without touching the tops.', correct: 'mono-sub-out', distractors: ['no-subs', 'stereo-subs', 'dual-mono'], why: 'A separate subwoofer output makes the sub level a console decision — a fader move at 11 pm, not a trip to the cabinet.' },
  { id: 'c-field', situation: 'An outdoor stage. The back rows are 80 m away and hear a quiet, muddy mush.', correct: 'delays', distractors: ['front-fills', 'stereo', 'mono'], why: 'Delay loudspeakers restore level at the back without raising the front, and arrive with the mains when set to the distance.' },
  { id: 'c-flown', situation: 'Flown mains fire over the heads of the first five rows.', correct: 'front-fills', distractors: ['delays', 'zones', 'lcr'], why: 'Front fills on the stage lip cover what the flown mains cannot reach, at a modest level, matrix-fed so they can be delayed and equalised.' },
  { id: 'c-stream', situation: 'A conference needs the mix in the lobby, on the recorder and on the stream — each balanced a little differently.', correct: 'feeds', distractors: ['zones', 'stereo', 'dual-mono'], why: 'Matrix feeds start from the finished mix and re-balance for each destination; nothing changes in the room.' },
];

function PageChooseConfig({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const count = CONFIG_CASES.filter((c) => solved[c.id]).length;
  const goals = [{ label: `Choose the configuration in all ${CONFIG_CASES.length} cases`, hit: count >= CONFIG_CASES.length }];
  const latched = useVisitGoals(ctx, goals);
  const name = (id: string) => OUTPUT_CONFIGS.find((o) => o.id === id)!.name;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={3}>CHOOSING THE CONFIGURATION</ChapterTag>
      <Lead>Six rooms, six briefs. Choose the output configuration and read why.</Lead>
      {CONFIG_CASES.map((c, i) => (
        <UnderstandingCheck
          key={c.id}
          eyebrow={`CASE ${i + 1} OF ${CONFIG_CASES.length}`}
          question={c.situation}
          options={[name(c.correct), ...c.distractors.map(name)]}
          correct={0}
          explain={c.why}
          onCorrect={() => setSolved((s) => ({ ...s, [c.id]: true }))}
        />
      ))}
      <Body>{count} of {CONFIG_CASES.length} chosen.</Body>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 7 · The routing map ────────────────────────────────────────────────── */

function PageRoutingMap({ ctx }: { ctx: PageCtx }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const goals = [{ label: 'Open all six routing tools', hit: open.size >= ROUTING_TOOLS.length }];
  const latched = useVisitGoals(ctx, goals);
  const chip = (on: boolean, yes: string, no: string) => (on ? `● ${yes}` : `○ ${no}`);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>MIXER ROUTING AND BUSSING</ChapterTag>
      <Lead>
        Six tools on every professional console, and four of them are confused with each other daily. The confusion ends when you ask two questions of each: does audio pass THROUGH it, and does it SUM channels or COPY them?
      </Lead>
      {ROUTING_TOOLS.map((t) => {
        const o = open.has(t.id);
        return (
          <View key={t.id} style={{ gap: 4 }}>
            <Btn label={o ? `✓ ${t.name}` : t.name} tone={o ? 'primary' : 'plain'} selected={o} onPress={() => setOpen((s) => new Set(s).add(t.id))} a11y={o ? `${t.name}, open` : `Open ${t.name}`} />
            {o ? (
              <Card tone="math">
                <Row>
                  <Text style={styles.truth}>{chip(t.carriesAudio, 'carries audio', 'no audio through it')}</Text>
                  <Text style={styles.truth}>{chip(t.sumsChannels, 'sums channels', 'does not sum')}</Text>
                  <Text style={styles.truth}>{chip(t.isCopy, 'a copy', 'not a copy')}</Text>
                  <Text style={styles.truth}>{chip(t.remoteControl, 'remote control', 'no remote control')}</Text>
                  {t.mixesBuses ? <Text style={styles.truth}>● mixes whole buses</Text> : null}
                </Row>
                <Body>USE IT FOR · {t.use}</Body>
                <Body>NOT FOR · {t.notFor}</Body>
              </Card>
            ) : null}
          </View>
        );
      })}
      <Card>
        <Eyebrow>ALSO ON THE CONSOLE</Eyebrow>
        <Body>Input channels · pre-fader and post-fader sends · direct outputs · control-room and monitor outputs · solo, PFL and AFL · inserts · digital patching and output patching. ROUTE mode puts every one of them under your fingers on a live console model.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="SoundSystemsRoute" label="ROUTE mode — drill the console" />
        <LabLink route="BeginningMixingLab" label="Beginning Mixing" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const SS_LEARN_PAGES_A: PageDef[] = [
  { title: 'The complete system', short: 'SYSTEM', Component: PageSystem, manualDone: true },
  { title: 'Trace the signal', short: 'TRACE', Component: PageTrace, manualDone: true },
  { title: 'Ten kinds of system', short: 'TYPES', Component: PageSystemTypes, manualDone: true },
  { title: 'Match the venue', short: 'MATCH', Component: PageVenueMatch, manualDone: true },
  { title: 'Output configurations', short: 'OUTPUTS', Component: PageConfigs, manualDone: true },
  { title: 'Choose the configuration', short: 'CHOOSE', Component: PageChooseConfig, manualDone: true },
  { title: 'The routing map', short: 'ROUTING', Component: PageRoutingMap, manualDone: true },
];

const styles = StyleSheet.create({
  inspectHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  levels: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 14 },
  fromTo: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chain: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6, lineHeight: 17 },
  busLine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  truth: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.6, borderRadius: 6, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 7, paddingVertical: 4 },
});
