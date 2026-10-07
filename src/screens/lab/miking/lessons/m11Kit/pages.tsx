/**
 * M11 COMPLETE DRUM-KIT SETUPS — the lesson's own pages:
 *   ORIENT          the kit as a set of sources (shared PKitOrient).
 *   HOW IT SOUNDS   a cymbal's stroke and shapes (the cymbal family), and
 *                   EVERY MIC HEARS EVERYTHING — when each source reaches each
 *                   close mic (bleed, from straight paths).
 *   PLACEMENT       the CHANNEL PLAN: a worked plan built in stages (WATCH),
 *                   then the learner's own small and large plans (BUILD),
 *                   with the counters — channels, stands, phantom, open mics.
 *   STUDIO OR LIVE  the ROUTING MATRIX: each channel to the PA, the monitors,
 *                   the recording and the broadcast.
 * The setting, microphones, two-mic, troubleshoot and practice pages are the
 * shared ones.
 */
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { ViewId } from '../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { micType } from '../../data/micTypes';
import { PKitOrient } from '../shared/kitPages/PKitOrient';
import { useArrivalsStep, useCymbalShapesStep, useCymbalStrikeStep } from '../shared/kitPages/kitSoundSteps';
import type { ArrivalPoint, ArrivalSource } from '../shared/kitPages/ArrivalsScene';
import { KitSide, KitTop } from '../shared/kitScene/KitSceneArt';
import { O, S0 } from '../shared/kitScene/kitSceneModel.ts';
import { KIT_PLACED_CYMBALS } from '../shared/cymbals/cymbalSpec.ts';
import { M09_SHAPES, M09_STRIKE } from '../m09Overheads/copy.ts';
import { M11_ARRIVALS, M11_ORIENT, PLAN_WORDS, ROUTE_WORDS } from './copy.ts';
import { M11_VIEWS } from './geometry.ts';
import { PlanScene } from './PlanScene';
import { CHANNELS, CHANNEL_IDS, FEEDS, FEED_LABEL, PLANS, counts, openIn, routingDone, ROUTE_IDS, type ChannelId, type Feed, type PlanId, type Routing } from './plan.ts';
import { viewToggle } from '../../engine/scene/viewToggle.ts';

export function M11Orient(p: PageProps) {
  return <PKitOrient {...p} words={M11_ORIENT} />;
}

const SOURCES: ArrivalSource[] = [
  { id: 'snare', label: 'snare', p: S0, color: '#6fa8ff' },
  { id: 'kick', label: 'kick', p: O, color: '#ff8c3c' },
  { id: 'hihat', label: 'hi-hats', p: KIT_PLACED_CYMBALS.hihat.c, color: '#5bff85' },
  { id: 'crash2', label: '18 in crash', p: KIT_PLACED_CYMBALS.crash2.c, color: '#e7a6ff' },
];
const POINTS: ArrivalPoint[] = [
  { id: 'snare', label: 'THE SNARE MIC', short: 'SNARE', p: CHANNELS.snare.pose.p },
  { id: 'hihat', label: 'THE HI-HAT MIC', short: 'HI-HAT', p: CHANNELS.hihat.pose.p },
  { id: 'tom2', label: 'THE 12 IN TOM MIC', short: 'TOM 2', p: CHANNELS.tom2.pose.p },
  { id: 'oh', label: 'THE OVERHEAD', short: 'OVERHEAD', p: CHANNELS.oh.pose.p },
];
const KIT_BOX = { side: { u0: -1150, u1: 850, v0: -1750, v1: M11_VIEWS.side.v1 }, top: { u0: -1150, u1: 850, v0: -1000, v1: 1100 } };

function KitBackground({ view }: { view: ViewId }): ReactElement {
  return view === 'side' ? <KitSide reach={false} /> : <KitTop reach={false} />;
}

export function M11Sound({ lesson, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const reached = useCallback(() => {
    if (!interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [interactiveDone, onInteractive]);
  const strike = useCymbalStrikeStep({ words: M09_STRIKE, hidden, prediction: lesson.predictions.sound, onReached: reached });
  const shapes = useCymbalShapesStep({ words: M09_SHAPES });
  const arrivals = useArrivalsStep({ words: M11_ARRIVALS, box: KIT_BOX, Background: KitBackground, sources: SOURCES, points: POINTS, maxMs: 5 });
  const steps: MikingStep[] = [
    strike.step,
    shapes,
    arrivals,
    {
      key: 'body',
      title: 'Attack, body and bleed',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{lesson.sound.attack}</Point>
            <Point title="BODY">{lesson.sound.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the kit: how a real kit sounds depends on the drums, the cymbals, the tuning, the room and the player. The pictures show where the sound comes from and when it arrives.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const phantom = (typeId: string) => micType(typeId).transducer === 'condenser';
const countBezel = (ids: readonly ChannelId[]): BezelItem[] => {
  const c = counts(ids, phantom);
  return [
    { k: 'CHANNELS', v: `${c.channels}`, flex: 1 },
    { k: 'STANDS', v: `${c.stands}`, flex: 0.9 },
    { k: 'PHANTOM', v: `${c.phantom}`, sub: 'condensers', flex: 1 },
    { k: 'OPEN MICS', v: `${c.open}`, flex: 1 },
  ];
};
const describePlan = (ids: readonly ChannelId[]) => `${ids.length} channel${ids.length === 1 ? '' : 's'}: ${ids.map((id) => CHANNELS[id].label.toLowerCase()).join(', ')}.`;

export function PChannelPlan({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  /* WATCH: the stages one to four */
  const WATCH = PLANS.slice(0, 4);
  const [stage, setStage] = useState(0);
  const [wview, setWview] = useState<ViewId>('side');
  const ws = WATCH[stage];
  /* BUILD */
  const [planId, setPlanId] = useState<PlanId>('four');
  const [ids, setIds] = useState<readonly ChannelId[]>(() => PLANS.find((p) => p.id === 'four')!.channels);
  const [view, setView] = useState<ViewId>('top');
  const [small, setSmall] = useState(false);
  const [large, setLarge] = useState(false);
  useEffect(() => {
    if (ids.length >= 1 && ids.length <= 4) setSmall(true);
    if (ids.length >= 8) setLarge(true);
  }, [ids]);
  useEffect(() => {
    if (small && large && !interactiveDone.has('twoPlans')) onInteractive('twoPlans');
  }, [small, large, interactiveDone, onInteractive]);
  const toggle = (id: ChannelId) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : CHANNEL_IDS.filter((x) => x === id || cur.includes(x))));
  const plan = PLANS.find((p) => p.id === planId)!;
  const watchParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'stage',
      label: 'STAGE',
      value: stage / (WATCH.length - 1),
      onChange: (v) => setStage(Math.round(v * (WATCH.length - 1))),
      format: () => `${stage + 1} of ${WATCH.length} · ${ws.label.toLowerCase()}`,
      formatShort: () => `${stage + 1} / ${WATCH.length}`,
    },
    ...viewToggle({ view: wview, setView: setWview, stage: 'single' }),
  ];
  const buildParams: DockParam[] = [
    {
      kind: 'options',
      id: 'plan',
      label: 'PLAN',
      valueLabel: plan.short,
      selectedId: planId,
      onSelect: (id) => {
        const p = PLANS.find((x) => x.id === id)!;
        setPlanId(p.id);
        setIds(p.channels);
      },
      sticky: true,
      options: PLANS.map((p) => ({ id: p.id, label: `${p.label} · ${p.channels.length}`, blurb: p.why })),
    },
    {
      kind: 'group',
      id: 'channels',
      label: 'CHANNELS',
      valueLabel: `${ids.length}`,
      render: () => (
        <View style={styles.chips}>
          {CHANNEL_IDS.map((id) => {
            const on = ids.includes(id);
            return (
              <Pressable key={id} onPress={() => toggle(id)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={CHANNELS[id].label}>
                <Text style={[styles.chipText, on && { color: colors.amber }]}>{`${on ? '● ' : '○ '}${CHANNELS[id].short}`}</Text>
              </Pressable>
            );
          })}
        </View>
      ),
    },
    ...viewToggle({ view: view, setView: setView, stage: 'single' }),
  ];
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: PLAN_WORDS.watchTitle,
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <PlanScene w={w} h={h} view={wview} box={M11_VIEWS[wview]} ids={ws.channels} highlight={ws.channels[ws.channels.length - 1]} accessibilityLabel={`A worked plan, stage ${stage + 1} of ${WATCH.length}: ${describePlan(ws.channels)}`} />,
        badge: 'WORKED PLAN · mics at illustrative starting places · each drum’s own lesson has its numbers',
        bezel: countBezel(ws.channels),
        params: watchParams,
        initialParam: 'stage',
      },
      well: (
        <>
          <Landing looking={PLAN_WORDS.watchLooking} prompt={PLAN_WORDS.watchPrompt} />
          <Card>
            <Point title={`${stage + 1} · ${ws.label.toUpperCase()}`}>{ws.why}</Point>
            <Body>{describePlan(ws.channels)}</Body>
          </Card>
        </>
      ),
    },
    {
      key: 'build',
      title: PLAN_WORDS.buildTitle,
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PlanScene w={w} h={h} view={view} box={M11_VIEWS[view]} ids={ids} accessibilityLabel={`Your plan: ${describePlan(ids)}`} />,
        badge: 'Your plan · mics at illustrative starting places · the counts describe a plan, they never grade it',
        bezel: countBezel(ids),
        params: buildParams,
        initialParam: 'plan',
      },
      well: (
        <>
          <Landing looking={PLAN_WORDS.buildLooking} prompt={PLAN_WORDS.buildPrompt} />
          <Body>{`Activity: a plan of four or fewer ${small ? '✓' : '○'} · a plan of eight or more ${large ? '✓' : '○'}${interactiveDone.has('twoPlans') ? ` — ${PLAN_WORDS.done}` : ''}.`}</Body>
          <Card>
            <Point title={plan.label.toUpperCase()}>{plan.why}</Point>
            <Body>{describePlan(ids)}</Body>
          </Card>
          <Note>{PLAN_WORDS.note}</Note>
        </>
      ),
    },
    {
      key: 'learn',
      title: 'Build in stages',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>{PLAN_WORDS.learnStages}</Body>
          <Body>{PLAN_WORDS.learnImage}</Body>
          <Body>{PLAN_WORDS.learnClose}</Body>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'placement')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

const ALL_FEEDS = (): Routing => Object.fromEntries(ROUTE_IDS.map((id) => [id, [...FEEDS]]));

function RouteMatrix({ w, h, r, onToggle, live }: { w: number; h: number; r: Routing; onToggle: (id: ChannelId, f: Feed) => void; live: boolean }) {
  const rowH = Math.max(18, Math.min(30, (h - 30) / (ROUTE_IDS.length + 1)));
  const nameW = Math.min(118, w * 0.32);
  const cellW = (w - nameW - 12) / FEEDS.length;
  return (
    <View style={{ width: w, height: h, padding: 6 }} accessibilityLabel={`Routing: ${ROUTE_IDS.map((id) => `${CHANNELS[id].short} to ${(r[id] ?? []).map((f) => FEED_LABEL[f]).join(', ') || 'nothing'}`).join('; ')}.`}>
      <View style={[styles.row, { height: rowH }]}>
        <Text style={[styles.head, { width: nameW }]} {...fitValue(10)}>
          CHANNEL
        </Text>
        {FEEDS.map((f) => (
          <Text key={f} style={[styles.head, { width: cellW, textAlign: 'center' }]} {...fitValue(10)}>
            {FEED_LABEL[f]}
          </Text>
        ))}
      </View>
      {ROUTE_IDS.map((id) => (
        <View key={id} style={[styles.row, { height: rowH }]}>
          <Text style={[styles.name, { width: nameW }, (id === 'roomL' || id === 'roomR') && { color: '#8fbcff' }]} {...fitValue(10.5)}>
            {CHANNELS[id].short}
          </Text>
          {FEEDS.map((f) => {
            const on = !!r[id]?.includes(f);
            const dim = !live && (f === 'pa' || f === 'mon');
            return (
              <Pressable key={f} onPress={() => onToggle(id, f)} disabled={dim} style={[styles.cell, { width: cellW, height: rowH - 4 }, on && styles.cellOn, dim && { opacity: 0.3 }]} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: dim }} accessibilityLabel={`${CHANNELS[id].label} to ${FEED_LABEL[f]}`}>
                <Text style={[styles.cellText, on && { color: '#0c0c0f' }]}>{on ? '●' : '○'}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PRouting({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const [live, setLive] = useState(true);
  const [r, setR] = useState<Routing>(ALL_FEEDS);
  const done = live && routingDone(r);
  useEffect(() => {
    if (done && !interactiveDone.has('routing')) onInteractive('routing');
  }, [done, interactiveDone, onInteractive]);
  const onToggle = (id: ChannelId, f: Feed) => setR((cur) => ({ ...cur, [id]: cur[id]?.includes(f) ? cur[id].filter((x) => x !== f) : FEEDS.filter((x) => x === f || cur[id]?.includes(x)) }));
  const studioCard = lesson.scenarios.filter((s) => s.id === 'kt.ctx.studio');
  const params: DockParam[] = [
    { kind: 'toggle', id: 'where', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
    { kind: 'action', id: 'reset', label: 'EVERYTHING EVERYWHERE', onPress: () => setR(ALL_FEEDS()), tint: colors.amber },
  ];
  const roomInPa = (['roomL', 'roomR'] as const).some((id) => r[id]?.includes('pa') || r[id]?.includes('mon'));
  const bezel: BezelItem[] = [
    { k: 'IN THE PA', v: live ? `${openIn(r, 'pa')}` : '—', sub: 'open mics', flex: 1 },
    { k: 'IN MONITORS', v: live ? `${openIn(r, 'mon')}` : '—', flex: 1.1 },
    { k: 'RECORDED', v: `${openIn(r, 'rec')}`, flex: 1 },
    { k: 'ROOM IN PA', v: !live ? '—' : roomInPa ? 'YES' : 'NO', tint: live && !roomInPa ? '#5bff85' : live ? '#ff6b5e' : undefined, flex: 1.1 },
  ];
  const steps: MikingStep[] = [
    {
      key: 'route',
      title: ROUTE_WORDS.title,
      kind: 'LIVE',
      layout: 'rack',
      rack: {
        render: (w, h) => <RouteMatrix w={w} h={h} r={r} onToggle={onToggle} live={live} />,
        badge: 'The expanded plan plus a room pair · tap a cell to route or unroute it · nothing here is played',
        bezel,
        params,
        initialParam: 'where',
      },
      well: live ? (
        <>
          <Landing looking={ROUTE_WORDS.looking} prompt={ROUTE_WORDS.livePrompt} />
          <Body>{`Activity: ${interactiveDone.has('routing') ? ROUTE_WORDS.done : 'not yet'}.`}</Body>
          <Note>Every channel in the PA is another open mic hearing the monitors and the PA itself. Fewer open mics in the PA leave more gain before feedback; the operator checks the real routing and margin at show level.</Note>
        </>
      ) : (
        <>
          <Landing looking="Studio" prompt={ROUTE_WORDS.studioPrompt} />
          <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
    {
      key: 'learn',
      title: 'Studio and live',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <Card>
          {ROUTE_WORDS.learn.map((p) => (
            <Point key={p.title} title={p.title}>
              {p.text}
            </Point>
          ))}
        </Card>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && s.id !== 'kt.ctx.studio')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

export const M11_PAGES = { instrument: M11Orient, sound: M11Sound, placement: PChannelPlan, context: PRouting };

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  head: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
  name: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.6 },
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: '#3a3a44', backgroundColor: '#14151a' },
  cellOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  cellText: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.oswaldMedium },
});
