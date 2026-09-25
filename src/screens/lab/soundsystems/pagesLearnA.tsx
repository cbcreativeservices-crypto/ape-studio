/**
 * Sound Systems Lab — LEARN pages 1–7 (chapters 1–4).
 *
 * Chapter 1 · the complete system (one map, many systems; trace the signal)
 * Chapter 2 · PA system types (ten kinds; match the venue)
 * Chapter 3 · output configurations (thirteen, visual only; choose one)
 * Chapter 4 · the routing map (six tools, and the ROUTE mode to drill them)
 *
 * Every page opens with the instrument, not the prose (owner standard
 * 2026-09-26): an orientation line, the picture, the prompt, the goals —
 * then the words. Copy is the register a working engineer uses with a
 * client: plain, technical, no promises. "Live sound reinforcement" throughout.
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
import { STATION_LABEL, STATION_ORDER, type Station } from '../../../features/soundsystems/types';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, PickTile, Readout, ReadoutRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph } from './art/gearArt';
import { benchMap, chapterOneMap, SystemMap, type MapEdge, type MapNode, type MapVariant } from './art/SystemMap';
import { FieldKey, VenueView } from './art/VenueView';
import { Orient } from './art/diagrams';
import { PLOT_BADGE, layoutToBeams, layoutToPlaced } from './plot';

/* ── 1 · The complete system ────────────────────────────────────────────── */

function PageSystem({ ctx }: { ctx: PageCtx }) {
  const [v, setV] = useState<MapVariant>({ input: 'stagebox', house: 'passive' });
  const [sel, setSel] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [builds, setBuilds] = useState<Set<string>>(new Set(['stagebox-passive']));
  const map = useMemo(() => chapterOneMap(v), [v]);
  const set = (next: MapVariant) => {
    setV(next);
    setBuilds((b) => new Set(b).add(`${next.input}-${next.house}`));
  };
  const tap = (id: string) => {
    setSel(id);
    setSeen((s) => new Set(s).add(id));
  };
  const goals = [
    { label: 'Inspect four stations', hit: seen.size >= 4 },
    { label: 'Inspect the console', hit: seen.has('con') },
    { label: 'Inspect a loudspeaker', hit: seen.has('top') || seen.has('sub') || seen.has('wedge') },
    { label: 'See both stage inputs and both house builds', hit: builds.size >= 3 },
  ];
  const latched = useVisitGoals(ctx, goals);
  const node = sel ? map.nodes.find((n) => n.id === sel) : undefined;
  const spec = node && node.kind !== 'listener' ? gearSpec(node.kind) : null;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={1}>UNDERSTANDING THE COMPLETE PA SYSTEM</ChapterTag>
      <Orient>A live sound reinforcement system as a system technician draws it: sources on the stage lane, the stage input carrying them to the console at front of house, the house path and the monitor path leaving the console separately.</Orient>
      <Row>
        <Text style={styles.ctlLabel}>STAGE INPUT</Text>
        <Btn label="ANALOG SNAKE" selected={v.input === 'snake'} tone={v.input === 'snake' ? 'primary' : 'plain'} onPress={() => set({ ...v, input: 'snake' })} a11y="Stage input: an analog multicore snake" />
        <Btn label="DIGITAL STAGEBOX" selected={v.input === 'stagebox'} tone={v.input === 'stagebox' ? 'primary' : 'plain'} onPress={() => set({ ...v, input: 'stagebox' })} a11y="Stage input: a digital stagebox on a network" />
      </Row>
      <Row>
        <Text style={styles.ctlLabel}>HOUSE</Text>
        <Btn label="PASSIVE + AMPS" selected={v.house === 'passive'} tone={v.house === 'passive' ? 'primary' : 'plain'} onPress={() => set({ ...v, house: 'passive' })} a11y="House loudspeakers: passive cabinets with a processor and amplifiers" />
        <Btn label="POWERED BOXES" selected={v.house === 'powered'} tone={v.house === 'powered' ? 'primary' : 'plain'} onPress={() => set({ ...v, house: 'powered' })} a11y="House loudspeakers: powered boxes with the amplifier inside" />
      </Row>
      <SystemMap
        nodes={map.nodes}
        edges={map.edges}
        selectedId={sel}
        onTap={tap}
        a11y={`The system map: a vocal microphone, a bass through a DI and playback into the ${v.input === 'snake' ? 'analog snake' : 'digital stagebox'}, then the console. ${v.house === 'passive' ? 'The main mix goes to the processor, the amplifiers, then passive tops and subs.' : 'The main mix goes straight to powered tops, and the sub takes its own console output.'} A pre-fader aux feeds the monitor amplifier and a wedge; a stereo aux feeds the in-ear transmitter. The tops reach the listener through the air. Tap any station.`}
      />
      <Prompt>Tap any station. Where does its signal come from — and where does it go next?</Prompt>
      <GoalChips goals={goals} latched={latched} />
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
      ) : node?.kind === 'listener' ? (
        <Card tone="math">
          <Eyebrow>THE LISTENER</Eyebrow>
          <Body>The only station that cannot be replaced, moved or re-patched — and the one every other decision is measured against. Coverage, level, timing and intelligibility are all judged at the ear, not at the console.</Body>
        </Card>
      ) : null}
      <Card>
        <Eyebrow>ONE MAP, MANY SYSTEMS</Eyebrow>
        <Body>Switch the stage input and the house build and the map redraws — but the ORDER never changes: source → stage input → console → processing → amplification → loudspeaker → listener. A powered loudspeaker is the amplifier and the cabinet in one box. A digital stagebox turns the snake into a network cable, carries the returns to the stage on the same link, and moves the preamps to the stage. The fault bench walks every case against this order.</Body>
      </Card>
      <Card>
        <Eyebrow>THE SECTIONS OF EVERY SYSTEM</Eyebrow>
        <Body>Sound sources — microphones, DIs, playback and wireless → stage inputs — analog snake or digital stagebox → mixing console → signal processing → loudspeaker management processor → power amplifiers → passive and powered loudspeakers, subwoofers, stage monitors and in-ears → main, auxiliary, group, matrix and zone outputs — all of it standing on electrical power and grounding that were designed for it.</Body>
      </Card>
    </View>
  );
}

/* ── 2 · Trace the signal ───────────────────────────────────────────────── */

function PageTrace({ ctx }: { ctx: PageCtx }) {
  const [picked, setPicked] = useState<Station[]>([]);
  // Shuffle the bin once per mount so the order is not given away by layout.
  const bin = useMemo(() => [...STATION_ORDER].sort(() => Math.random() - 0.5), []);
  const wrongAt = picked.findIndex((id, i) => id !== STATION_ORDER[i]);
  const complete = picked.length === STATION_ORDER.length && wrongAt < 0;
  const goals = [{ label: 'Trace source → listener in order', hit: complete }];
  const latched = useVisitGoals(ctx, goals);
  const base = useMemo(() => benchMap({}, {}), []);
  const nodes: MapNode[] = base.nodes.map((n) => {
    const i = picked.indexOf(n.id as Station);
    const state = i < 0 ? 'unknown' : wrongAt >= 0 && i >= wrongAt ? 'flag' : 'ok';
    return { ...n, state, dark: i < 0 };
  });
  const reachedOk = wrongAt >= 0 ? wrongAt : picked.length;
  const edges: MapEdge[] = base.edges.map((e) => ({ ...e, dead: STATION_ORDER.indexOf(e.to as Station) >= reachedOk }));
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={1}>BASIC SIGNAL-FLOW TRACING</ChapterTag>
      <Orient>The nine stations of the house path, drawn as the bench draws them. Light them in the order the signal travels.</Orient>
      <SystemMap nodes={nodes} edges={edges} running={complete} a11y={`Your thread so far: ${picked.length ? picked.map((p) => STATION_LABEL[p]).join(', ') : 'nothing yet'}.`} />
      <Prompt>Tap the next station the signal reaches.</Prompt>
      <Row>
        {bin.map((id) => (
          <Btn key={id} label={STATION_LABEL[id]} disabled={picked.includes(id) || wrongAt >= 0} onPress={() => setPicked((p) => [...p, id])} a11y={`${STATION_LABEL[id]}${picked.includes(id) ? ', placed' : ''}`} />
        ))}
        {picked.length ? <Btn label="RESET" tone="danger" onPress={() => setPicked([])} a11y="Reset the thread" /> : null}
      </Row>
      {wrongAt >= 0 ? (
        <VerdictLine ok={false}>
          {STATION_LABEL[picked[wrongAt]]} cannot come after {wrongAt === 0 ? 'the start' : STATION_LABEL[picked[wrongAt - 1]]} — the signal has not reached it yet. Reset and try again.
        </VerdictLine>
      ) : complete ? (
        <VerdictLine ok>Source to listener, in order — and the LEDs chase with programme. That is the walk you will make on every fault.</VerdictLine>
      ) : null}
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>Signal falls forward: source, cable, stage input, console in, console out, processor, amplifier, loudspeaker, listener. A fault is found by walking that order from wherever the symptom leaves doubt — never by guessing at the far end.</KeyFact>
    </View>
  );
}

/* ── 3 · Ten kinds of system ────────────────────────────────────────────── */

const FLOWN_TYPES = new Set(['line-array']);

function PageSystemTypes({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState(SYSTEM_TYPES[0].id);
  const [seen, setSeen] = useState<Set<string>>(new Set([SYSTEM_TYPES[0].id]));
  const t = SYSTEM_TYPES.find((x) => x.id === id)!;
  const goals = [{ label: 'View five system types', hit: seen.size >= 5 }, { label: 'View the line array and the distributed system', hit: seen.has('line-array') && seen.has('distributed') }];
  const latched = useVisitGoals(ctx, goals);
  const pick = (s: string) => {
    setId(s);
    setSeen((v) => new Set(v).add(s));
  };
  const venue = SYSTEM_TYPES.filter((s) => s.group === 'venue');
  const build = SYSTEM_TYPES.filter((s) => s.group === 'build');
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={2}>PA SYSTEM TYPES</ChapterTag>
      <Orient>Ten kinds of system. Six are chosen by the venue; four are ways any of them can be built out. Pick one and read its plan.</Orient>
      <Eyebrow>CHOSEN BY THE VENUE</Eyebrow>
      <View style={styles.tiles}>
        {venue.map((s) => (
          <PickTile key={s.id} label={s.name} selected={s.id === id} done={seen.has(s.id)} onPress={() => pick(s.id)} />
        ))}
      </View>
      <Eyebrow>WAYS TO BUILD ANY OF THEM</Eyebrow>
      <View style={styles.tiles}>
        {build.map((s) => (
          <PickTile key={s.id} label={s.name} selected={s.id === id} done={seen.has(s.id)} onPress={() => pick(s.id)} />
        ))}
      </View>
      <VenueView
        placed={layoutToPlaced(t.layout, t.powered !== false)}
        beams={layoutToBeams(t.layout, { flown: FLOWN_TYPES.has(t.id) })}
        field
        badge={PLOT_BADGE}
        orientation={`${t.name} — plan view, stage at the top`}
        a11y={`Plan of a ${t.name}: ${t.layout.map((p) => `${p.kind} at ${slotDef(p.slot).label}`).join(', ')}`}
      />
      <FieldKey />
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>{t.name.toUpperCase()} · {t.scale.toUpperCase()}</Eyebrow>
        <Text style={styles.chain}>{t.chain.join('  →  ')}</Text>
        <Body>WHEN · {t.when}</Body>
        <Body>NOT WHEN · {t.notWhen}</Body>
      </Card>
      <KeyFact>Systems differ by WHEN they are the right answer, not just by what is in the case. The same band in a café, a club and a field needs three different systems — and the chain above is the common shape, not the only wiring: a powered box folds the amplifier in, a processor can live inside the amplifier, and a small show mixes monitors from the house console.</KeyFact>
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
      <GoalChips goals={goals} latched={latched} />
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
      <Orient>Thirteen ways the console’s outputs can reach a room. Pick one: the plan shows where each loudspeaker stands, the tag beside it says what it carries, and the floor shows where that lands.</Orient>
      <View style={styles.tiles}>
        {OUTPUT_CONFIGS.map((o) => (
          <PickTile key={o.id} label={o.name} selected={o.id === id} done={seen.has(o.id)} onPress={() => { setId(o.id); setSeen((v) => new Set(v).add(o.id)); }} />
        ))}
      </View>
      <VenueView
        placed={layoutToPlaced(c.layout, c.powered !== false)}
        beams={layoutToBeams(c.layout, { flown: c.id === 'front-fills' })}
        field
        seam={c.id === 'stereo' || c.id === 'dual-mono' || c.id === 'lcr'}
        badge={PLOT_BADGE}
        orientation={`${c.name} — plan view`}
        a11y={`Plan of ${c.name}: ${c.layout.map((p) => `${FEEDS[p.feed].name} feed at ${slotDef(p.slot).label}`).join(', ')}`}
        caption="The sectors are each loudspeaker’s nominal (−6 dB) coverage; the floor sums them in the conceptual model. Hatched floor is where two arrivals overlap and comb-filter."
      />
      <FieldKey />
      <ReadoutRow>
        {bars.map(([feed, n]) => (
          <Readout key={feed} k={FEEDS[feed].name.toUpperCase()} v={n ? `${n} box${n > 1 ? 'es' : ''}` : 'output'} tint={FEEDS[feed].band === 'low' ? '#2f74ff' : colors.amber} />
        ))}
      </ReadoutRow>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>{c.name.toUpperCase()}</Eyebrow>
        <Body>{c.what}</Body>
        <Body>WHEN · {c.when}</Body>
        <Body>WHAT CHANGES · {c.changes}</Body>
        <Text style={styles.busLine}>BUSES · {bars.map(([f]) => `${FEEDS[f].name}: ${FEEDS[f].bus}`).join(' · ')}</Text>
      </Card>
      <KeyFact>The output configuration is the decision that shapes everything downstream: how many loudspeaker positions, what each one carries, and which console buses feed them. The bus list is the common practice, not the only one — a sub can be fed from a crossover, an aux or a matrix, and the next chapter shows all three.</KeyFact>
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
      <GoalChips goals={goals} latched={latched} />
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
        Six tools on every full-size console, and four of them are confused with each other daily. The confusion ends when you ask two questions of each: does audio pass THROUGH it, and does it SUM channels or COPY them?
      </Lead>
      <GoalChips goals={goals} latched={latched} />
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
        <Body>Input channels · pre-fader and post-fader sends · direct outputs · control-room and monitor outputs · solo, PFL and AFL · inserts · digital patching and output patching. ROUTE mode puts every one of them under your fingers on a live console model. A compact analog mixer may have only two auxes and no matrix; the ideas are the same, there are just fewer of them.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="SoundSystemsRoute" label="ROUTE mode — drill the console" />
        <LabLink route="BeginningMixingLab" label="Beginning Mixing" />
      </DeeperRow>
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
  ctlLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6, marginRight: 2 },
});
