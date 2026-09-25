/**
 * Sound Systems Lab — BUILD mode: the venue builder and ten capstones.
 *
 * Page 1 is the empty venue with the whole parts bin. Pages 2–11 are the
 * capstone briefs, each with its own bin and a requirements checklist that
 * fills itself in as the build satisfies it — graded live by
 * features/soundsystems/capstones.ts, never by the page.
 *
 * The builder is TAP-ONLY: tap a part, tap a slot; tap a device, tap another
 * to connect; tap a cable to remove it. Every refusal is the engine's own
 * sentence, and the one hazardous refusal (speaker level into a line input)
 * renders as a warning, not a shrug.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { GEAR, gearSpec, isSource, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { connect, disconnect, EMPTY_SYSTEM, place, removePlaced, SLOTS, slotAccepts, slotDef, trace, upstream, downstream } from '../../../features/soundsystems/system';
import { CAPSTONES_IN_ORDER, gradeCapstone, type Capstone } from '../../../features/soundsystems/capstones';
import { bandConsole, type ConsoleState } from '../../../features/soundsystems/console';
import { markCapstonePassed } from '../../../features/soundsystems/progress';
import type { GearKind, Link, SlotId, SoundSystem } from '../../../features/soundsystems/types';
import { ChapterTag, GoalChips, KeyFact, ReqRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph } from './art/gearArt';
import { CableLegend, VenueView } from './art/VenueView';
import { Orient } from './art/diagrams';
import { placedToBeams, PLOT_BADGE } from './plot';
import { BusHears, ConsolePanel, DcaStrip, MatrixStrip, matrixHears, auxHears, mainHears, subgroupHears, SubgroupStrip, type ConsoleColumn } from './art/ConsolePanel';

/* ── the builder ─────────────────────────────────────────────────────────── */

type Msg = { text: string; unsafe?: boolean; ok?: boolean };

export function useBuilder(initial: SoundSystem = EMPTY_SYSTEM) {
  const [system, setSystem] = useState<SoundSystem>(initial);
  const [part, setPart] = useState<GearKind | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [refusals, setRefusals] = useState(0);
  const [sawUnsafe, setSawUnsafe] = useState(false);
  const t = useMemo(() => trace(system), [system]);
  const live = useMemo(() => new Set(t.live), [t]);

  const targets = useMemo<SlotId[]>(() => (part ? SLOTS.filter((s) => slotAccepts(s.id, part)).map((s) => s.id) : []), [part]);

  const tapSlot = useCallback(
    (slot: SlotId) => {
      if (!part) return;
      const v = place(system, part, slot);
      if (!v.ok) {
        setMsg({ text: v.reason });
        return;
      }
      setSystem(v.system);
      setSelected(v.id);
      setMsg({ text: `${gearSpec(part).name} placed. Tap another device to connect them — or tap a part to place more.`, ok: true });
      if (!gearSpec(part).many) setPart(null);
    },
    [part, system],
  );

  const tapPlaced = useCallback(
    (id: string) => {
      if (selected && selected !== id) {
        const v = connect(system, selected, id);
        if (v.ok) {
          setSystem(v.system);
          const a = system.placed.find((p) => p.id === selected)!;
          const b = system.placed.find((p) => p.id === id)!;
          setMsg({ text: `${gearSpec(a.kind).name} → ${gearSpec(b.kind).name}, at ${LEVEL_LABEL[v.link.level]}.`, ok: true });
          setSelected(id);
        } else {
          setMsg({ text: v.reason, unsafe: v.unsafe });
          setRefusals((n) => n + 1);
          if (v.unsafe) setSawUnsafe(true);
          setSelected(id);
        }
        return;
      }
      setSelected(id);
      setPart(null);
      const p = system.placed.find((x) => x.id === id);
      if (p) setMsg({ text: `${gearSpec(p.kind).name} selected. Tap another device to connect from it; tap REMOVE to take it off the plot.` });
    },
    [selected, system],
  );

  const tapLink = useCallback(
    (l: Link) => {
      setSystem((s) => disconnect(s, l.from, l.to));
      setMsg({ text: 'Cable removed.' });
    },
    [],
  );

  const remove = useCallback(() => {
    if (!selected) return;
    setSystem((s) => removePlaced(s, selected));
    setSelected(null);
    setMsg({ text: 'Device removed, with its cables.' });
  }, [selected]);

  const reset = useCallback(() => {
    setSystem(EMPTY_SYSTEM);
    setSelected(null);
    setPart(null);
    setMsg(null);
  }, []);

  return { system, part, setPart, selected, setSelected, msg, targets, live, trace: t, tapSlot, tapPlaced, tapLink, remove, reset, refusals, sawUnsafe };
}

export function PartsBin({ kinds, part, onPick, system }: { kinds: readonly GearKind[]; part: GearKind | null; onPick: (k: GearKind | null) => void; system: SoundSystem }) {
  return (
    <View style={styles.bin} accessibilityRole="list">
      {kinds.map((k) => {
        const spec = gearSpec(k);
        const placedN = system.placed.filter((p) => p.kind === k).length;
        const exhausted = !spec.many && placedN >= 1;
        const sel = part === k;
        return (
          <Pressable
            key={k}
            style={[styles.binTile, sel && styles.binTileOn, exhausted && { opacity: 0.4 }]}
            onPress={() => onPick(sel ? null : k)}
            disabled={exhausted}
            accessibilityRole="button"
            accessibilityState={{ selected: sel, disabled: exhausted }}
            aria-pressed={sel}
            accessibilityLabel={`${spec.name}${placedN ? `, ${placedN} placed` : ''}${exhausted ? ', already in the build' : ''}`}
          >
            <GearGlyph kind={k} size={40} />
            <Text style={[styles.binLabel, sel && { color: colors.amber }]} numberOfLines={2}>{spec.short}</Text>
            {placedN ? <Text style={styles.binCount}>×{placedN}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function Builder({ b, kinds, badgeless }: { b: ReturnType<typeof useBuilder>; kinds: readonly GearKind[]; badgeless?: boolean }) {
  const sel = b.selected ? b.system.placed.find((p) => p.id === b.selected) : undefined;
  const beams = useMemo(() => placedToBeams(b.system.placed, b.live), [b.system.placed, b.live]);
  return (
    <View style={{ gap: 10 }}>
      <PartsBin kinds={kinds} part={b.part} onPick={b.setPart} system={b.system} />
      <Prompt>{b.part ? `Tap a highlighted position to place the ${gearSpec(b.part).name.toLowerCase()}.` : sel ? 'Tap another device to connect from the selected one.' : 'Tap a part in the bin, then a position on the plot.'}</Prompt>
      <VenueView
        placed={b.system.placed}
        links={b.system.links}
        beams={beams}
        field={b.live.size > 0}
        targets={b.targets}
        selectedId={b.selected}
        liveIds={b.live}
        onTapSlot={b.tapSlot}
        onTapPlaced={b.tapPlaced}
        onTapLink={b.tapLink}
        badge={badgeless ? undefined : PLOT_BADGE}
        orientation="Plan view — stage at the top, audience below, front of house two-thirds back"
        a11y={`The venue plot. ${b.system.placed.length} device${b.system.placed.length === 1 ? '' : 's'} placed, ${b.system.links.length} cable${b.system.links.length === 1 ? '' : 's'}, ${b.live.size} loudspeaker${b.live.size === 1 ? '' : 's'} live.${b.part ? ` ${b.targets.length} positions accept the ${gearSpec(b.part).name.toLowerCase()}.` : ''}`}
      />
      <CableLegend levels={['mic', 'line', 'speaker', 'digital', 'wireless']} />
      {b.msg ? (
        <VerdictLine ok={!!b.msg.ok} warn={!b.msg.ok && !b.msg.unsafe}>{b.msg.unsafe ? '⚠ ' : ''}{b.msg.text}</VerdictLine>
      ) : null}
      {sel ? (
        <Card tone="math">
          <View style={styles.inspect}>
            <GearGlyph kind={sel.kind} size={44} label={gearSpec(sel.kind).name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow>{`${gearSpec(sel.kind).name.toUpperCase()} · ${slotDef(sel.slot).label.toUpperCase()}`}</Eyebrow>
              <Text style={styles.small}>FED BY · {upstream(b.system, sel.id).map((p) => gearSpec(p.kind).name).join(', ') || 'nothing'}</Text>
              <Text style={styles.small}>FEEDS · {downstream(b.system, sel.id).map((p) => gearSpec(p.kind).name).join(', ') || 'nothing'}</Text>
              <Text style={[styles.small, { color: b.live.has(sel.id) ? colors.green : gearSpec(sel.kind).radiates ? colors.orange : colors.textMuted }]}>
                {gearSpec(sel.kind).radiates ? (b.live.has(sel.id) ? '● LIVE — a source reaches it' : '○ SILENT — no complete path from a source') : b.trace.reached.has(sel.id) ? '● signal reaches it' : '○ no signal yet'}
              </Text>
            </View>
          </View>
          <Row>
            <Btn label="REMOVE" tone="danger" onPress={b.remove} a11y={`Remove the ${gearSpec(sel.kind).name}`} />
            <Btn label="DESELECT" onPress={() => b.setSelected(null)} a11y="Deselect" />
          </Row>
        </Card>
      ) : null}
      <Row>
        <Text style={styles.status}>
          {b.trace.live.length} live · {b.trace.silent.length} silent · {b.trace.strandedSources.length} source{b.trace.strandedSources.length === 1 ? '' : 's'} unconnected
        </Text>
        {b.system.placed.length ? <Btn label="CLEAR VENUE" tone="danger" onPress={b.reset} a11y="Clear the venue" /> : null}
      </Row>
    </View>
  );
}

/* ── page 1 · free build ────────────────────────────────────────────────── */

const ALL_KINDS = GEAR.map((g) => g.kind);

function PageFreeBuild({ ctx }: { ctx: PageCtx }) {
  const b = useBuilder();
  const goals = [
    { label: 'Place a source, a console and a loudspeaker', hit: b.system.placed.some((p) => p.kind === 'console') && b.system.placed.some((p) => gearSpec(p.kind).radiates) && b.system.placed.some((p) => isSource(p.kind) && p.kind !== 'powerDistro') },
    { label: 'Make a loudspeaker live', hit: b.live.size > 0 },
    { label: 'Read one refusal', hit: b.refusals > 0 },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={0}>BUILD · THE EMPTY VENUE</ChapterTag>
      <Orient>An empty venue in plan — the deck and its riser at the top, wings either side, the audience below — and every part in the catalogue. Build anything; the loudspeakers light when a source reaches them.</Orient>
      <Builder b={b} kinds={ALL_KINDS} />
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>A loudspeaker is LIVE only when an unbroken path of valid links runs from a source to it. A dim loudspeaker is a placed loudspeaker with no such path — the most common state of a real system at four in the afternoon. The engine refuses a link for one of three reasons — wrong level, a full input, or a loop — and the one hazardous refusal (speaker level into a line input) is drawn as a warning.</KeyFact>
    </View>
  );
}

/* ── capstone pages ─────────────────────────────────────────────────────── */

type RouteUi = {
  channels?: readonly string[];
  columns: readonly ConsoleColumn[];
  subgroups?: boolean;
  dcas?: boolean;
  matrices?: readonly { id: string; sources: readonly { id: string; label: string }[] }[];
  hears: readonly { title: string; kind: 'aux' | 'main' | 'sub' | 'matrix'; id?: string }[];
};

const ROUTE_UI: Partial<Record<string, RouteUi>> = {
  monitors: {
    columns: ['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4'],
    hears: [
      { title: 'AUX 1 · WEDGE 1 HEARS', kind: 'aux', id: 'aux1' },
      { title: 'AUX 2 · WEDGE 2 HEARS', kind: 'aux', id: 'aux2' },
      { title: 'AUX 3 · WEDGE 3 HEARS', kind: 'aux', id: 'aux3' },
      { title: 'AUX 4 · WEDGE 4 HEARS', kind: 'aux', id: 'aux4' },
    ],
  },
  'groups-fx': {
    columns: ['main', 'sub', 'dca', 'send:aux5'],
    subgroups: true,
    dcas: true,
    hears: [
      { title: 'MAIN MIX HEARS', kind: 'main' },
      { title: 'DRUMS SUBGROUP HEARS', kind: 'sub', id: 'sub-drums' },
      { title: 'AUX 5 · REVERB HEARS', kind: 'aux', id: 'aux5' },
    ],
  },
  matrices: {
    columns: ['main', 'send:aux7', 'send:aux6'],
    matrices: [
      { id: 'mx-fills', sources: [{ id: 'main', label: 'MAIN' }, { id: 'aux7', label: 'AUX 7' }] },
      { id: 'mx-lobby', sources: [{ id: 'main', label: 'MAIN' }, { id: 'aux7', label: 'AUX 7' }] },
      { id: 'mx-subs', sources: [{ id: 'main', label: 'MAIN' }, { id: 'aux6', label: 'AUX 6' }] },
    ],
    hears: [
      { title: 'MATRIX 2 · FRONT FILLS HEAR', kind: 'matrix', id: 'mx-fills' },
      { title: 'MATRIX 3 · LOBBY HEARS', kind: 'matrix', id: 'mx-lobby' },
      { title: 'MATRIX 1 · SUBS HEAR', kind: 'matrix', id: 'mx-subs' },
    ],
  },
  festival: {
    columns: ['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4', 'send:aux6'],
    matrices: [{ id: 'mx-rec', sources: [{ id: 'main', label: 'MAIN' }, { id: 'aux1', label: 'AUX 1' }] }],
    hears: [
      { title: 'AUX 1 · WEDGE 1 HEARS', kind: 'aux', id: 'aux1' },
      { title: 'AUX 6 · THE SUBS HEAR', kind: 'aux', id: 'aux6' },
      { title: 'MATRIX 4 · RECORDING HEARS', kind: 'matrix', id: 'mx-rec' },
    ],
  },
};

function hearsList(cs: ConsoleState, h: RouteUi['hears'][number]) {
  switch (h.kind) {
    case 'main':
      return mainHears(cs);
    case 'aux':
      return auxHears(cs, h.id!);
    case 'sub':
      return subgroupHears(cs, h.id!);
    default:
      return matrixHears(cs, h.id!);
  }
}

function CapstonePage({ capstone, ctx }: { capstone: Capstone; ctx: PageCtx }) {
  const b = useBuilder();
  const [cs, setCs] = useState<ConsoleState>(bandConsole);
  const grade = useMemo(() => gradeCapstone(capstone, b.system, cs), [capstone, b.system, cs]);
  useEffect(() => {
    if (grade.pass) {
      markCapstonePassed(capstone.id);
      if (!ctx.isDone) ctx.markDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade.pass]);
  const ui = ROUTE_UI[capstone.id];
  const buildReqs = capstone.requirements.filter((r) => r.kind === 'build');
  const routeReqs = capstone.requirements.filter((r) => r.kind === 'route');
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={capstone.n}>{`CAPSTONE ${capstone.n} OF 10 · ${capstone.venue.toUpperCase()}`}</ChapterTag>
      <Lead>{capstone.brief}</Lead>
      <Card tone={grade.pass ? 'ok' : 'plain'}>
        <Eyebrow>{grade.pass ? 'REQUIREMENTS MET — CAPSTONE PASSED' : `REQUIREMENTS · ${grade.met.length} OF ${capstone.requirements.length}`}</Eyebrow>
        {buildReqs.map((r) => (
          <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
        ))}
        {routeReqs.length ? <Eyebrow>ON THE CONSOLE</Eyebrow> : null}
        {routeReqs.map((r) => (
          <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
        ))}
      </Card>
      <Builder b={b} kinds={capstone.bin} />
      {ui ? (
        <View style={{ gap: 10 }}>
          <Eyebrow>THE CONSOLE</Eyebrow>
          <Body>▲/▼ step a level; PRE lights the pre-fader tap. The buses below show who hears what — computed, not promised.</Body>
          <ConsolePanel cs={cs} onChange={setCs} channels={ui.channels} columns={ui.columns} sendNames={{ aux1: 'SINGER', aux2: 'GUITAR', aux3: 'BASS', aux4: 'DRUMS', aux5: 'REVERB', aux6: 'SUBS', aux7: 'LOBBY' }} />
          {ui.subgroups ? <SubgroupStrip cs={cs} onChange={setCs} /> : null}
          {ui.dcas ? <DcaStrip cs={cs} onChange={setCs} /> : null}
          {ui.matrices?.map((m) => (
            <MatrixStrip key={m.id} cs={cs} onChange={setCs} matrixId={m.id} sources={m.sources} />
          ))}
          {ui.hears.map((h) => (
            <BusHears key={h.title} title={h.title} list={hearsList(cs, h)} />
          ))}
        </View>
      ) : null}
      {grade.pass ? <VerdictLine ok>Capstone {capstone.n} passed — recorded on the lab’s home page. The build stays here to explore; CONTINUE when ready.</VerdictLine> : null}
    </View>
  );
}

export const SS_BUILD_PAGES: PageDef[] = [
  { title: 'The empty venue', short: 'VENUE', Component: PageFreeBuild, manualDone: true },
  ...CAPSTONES_IN_ORDER.map((c) => ({
    title: `Capstone ${c.n} · ${c.title}`,
    short: `C${c.n}`,
    manualDone: true,
    Component: ({ ctx }: { ctx: PageCtx }) => <CapstonePage capstone={c} ctx={ctx} />,
  })),
];

const styles = StyleSheet.create({
  bin: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  binTile: { width: 72, minHeight: 74, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 2, gap: 1 },
  binTileOn: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  binLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 8.5, letterSpacing: 0.6, textAlign: 'center' },
  binCount: { position: 'absolute', top: 3, right: 5, color: colors.amber, fontFamily: fonts.mono, fontSize: 9 },
  inspect: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  small: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  status: { flex: 1, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
});
