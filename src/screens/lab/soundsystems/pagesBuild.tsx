/**
 * Sound Systems Lab — BUILD mode: the venue builder and ten capstones, on the
 * Rack Unit (owner 2026-09-25).
 *
 *   STAGE  the venue plot, pinned and live: tap a highlighted position to
 *          place the part in hand, tap a device then another to connect
 *          them, tap a cable to remove it.
 *   DOCK   PART — one key that is both the parts list and a lane: tap it to
 *          read the bin, ride it to flip through the parts while the plot
 *          shows where each may stand · CONSOLE (routing capstones) opens
 *          the desk in a tray over the well while the plot stays live ·
 *          REMOVE and CLEAR appear only when they can do something.
 *   WELL   what is in hand, the last verdict, the selected device's card,
 *          the capstone's live requirements — then the reading.
 *
 * Page 1 is the empty venue with the whole parts bin. Pages 2–11 are the
 * capstone briefs, each with its own bin and a requirements checklist that
 * fills itself in as the build satisfies it — graded live by
 * features/soundsystems/capstones.ts, never by the page. Every refusal is
 * the engine's own sentence, and the one hazardous refusal (speaker level
 * into a line input) renders as a warning, not a shrug.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Prompt, Row } from '../tuning/components/primitives';
import { GEAR, gearSpec, isSource, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { connect, disconnect, EMPTY_SYSTEM, place, removePlaced, SLOTS, slotAccepts, slotDef, trace, upstream, downstream } from '../../../features/soundsystems/system';
import { CAPSTONES_IN_ORDER, gradeCapstone, type Capstone } from '../../../features/soundsystems/capstones';
import { bandConsole, type ConsoleState } from '../../../features/soundsystems/console';
import { markCapstonePassed } from '../../../features/soundsystems/progress';
import type { GearKind, Link, SlotId, SoundSystem } from '../../../features/soundsystems/types';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { ChapterTag, GoalChips, KeyFact, ReqRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph } from './art/gearArt';
import { CableLegend, PLOT_H, PLOT_W, VenueView } from './art/VenueView';
import { placedToBeams, PLOT_BADGE } from './plot';
import { BusHears, ConsolePanel, DcaStrip, MatrixStrip, matrixHears, auxHears, mainHears, subgroupHears, SubgroupStrip, type ConsoleColumn } from './art/ConsolePanel';
import { flipFader, SoundSystemsRackLayout, StageFit, type SsPageDef, type SsRack } from './rackLayout';

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

/** The illustrated parts bin — kept for the document form and the tray. */
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

type BuilderRack = { rack: SsRack; wellTop: ReactNode; prompt: string; status: string };

/**
 * The builder's rack declaration: the plot on the glass, PART / CONSOLE /
 * REMOVE / CLEAR in the dock, counts on the bezel, the live cards in the
 * well-top slot.
 */
function useBuilderRack(b: ReturnType<typeof useBuilder>, kinds: readonly GearKind[], extras: { bezel?: BezelItem; console?: DockParam; wellTop?: ReactNode } = {}): BuilderRack {
  const sel = b.selected ? b.system.placed.find((p) => p.id === b.selected) : undefined;
  const beams = useMemo(() => placedToBeams(b.system.placed, b.live), [b.system.placed, b.live]);
  const inHand = b.part ? gearSpec(b.part) : null;
  const items = kinds.map((k) => ({ id: k }));
  const exhausted = (k: GearKind) => !gearSpec(k).many && b.system.placed.some((p) => p.kind === k);
  const params: DockParam[] = [
    flipFader({
      id: 'part',
      label: 'PART',
      title: 'THE PARTS BIN — tap one, then a position on the plot',
      items,
      selectedId: b.part ?? '',
      onSelect: (k) => b.setPart(exhausted(k as GearKind) ? null : (k as GearKind)),
      name: (x) => `${exhausted(x.id as GearKind) ? '✓ ' : ''}${gearSpec(x.id as GearKind).name}`,
      short: (x) => gearSpec(x.id as GearKind).short,
      empty: 'nothing in hand — tap to pick a part',
      blurb: (x) => (exhausted(x.id as GearKind) ? `${gearSpec(x.id as GearKind).name}: already in the build. Tap it on the plot to select it.` : `${gearSpec(x.id as GearKind).blurb} Stands at: ${SLOTS.filter((s) => slotAccepts(s.id, x.id as GearKind)).map((s) => s.label).slice(0, 4).join(', ')}${SLOTS.filter((s) => slotAccepts(s.id, x.id as GearKind)).length > 4 ? '…' : ''}.`),
    }),
    ...(extras.console ? [extras.console] : []),
    ...(sel ? [{ kind: 'action', id: 'remove', label: 'REMOVE', onPress: b.remove, tint: colors.red } as DockParam] : []),
    ...(b.system.placed.length ? [{ kind: 'action', id: 'clear', label: 'CLEAR', onPress: b.reset } as DockParam] : []),
  ];
  const bezel: BezelItem[] = [
    { k: 'PLACED', v: `${b.system.placed.length}`, flex: 0.9 },
    { k: 'CABLES', v: `${b.system.links.length}`, flex: 0.9 },
    { k: 'LIVE', v: `${b.trace.live.length}`, tint: b.trace.live.length ? colors.green : undefined, flex: 0.8 },
    extras.bezel ?? { k: 'SILENT', v: `${b.trace.silent.length}`, tint: b.trace.silent.length ? colors.orange : undefined, flex: 0.9 },
  ];
  const prompt = b.part ? `Tap a highlighted position to place the ${gearSpec(b.part).name.toLowerCase()}.` : sel ? 'Tap another device to connect from the selected one.' : 'Tap PART to pick a part, then a position on the plot.';
  const status = `${b.trace.live.length} live · ${b.trace.silent.length} silent · ${b.trace.strandedSources.length} source${b.trace.strandedSources.length === 1 ? '' : 's'} unconnected`;
  const wellTop = (
    <>
      {inHand ? (
        <View style={styles.hand} accessible accessibilityLabel={`In hand: ${inHand.name}. ${prompt}`}>
          <GearGlyph kind={inHand.kind} size={40} label={inHand.name} />
          <View style={{ flex: 1, gap: 1 }}>
            <Eyebrow>IN HAND · {inHand.name.toUpperCase()}</Eyebrow>
            <Text style={styles.small}>{prompt}</Text>
          </View>
        </View>
      ) : null}
      {b.msg ? <VerdictLine ok={!!b.msg.ok} warn={!b.msg.ok && !b.msg.unsafe}>{b.msg.unsafe ? '⚠ ' : ''}{b.msg.text}</VerdictLine> : null}
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
            <Btn label="DESELECT" onPress={() => b.setSelected(null)} a11y="Deselect" />
          </Row>
        </Card>
      ) : null}
      {extras.wellTop}
    </>
  );
  const rack: SsRack = {
    size: 'L',
    badge: PLOT_BADGE,
    initialParam: 'part',
    hideDragTag: true,
    bezel,
    stage: (w, h) => (
      <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
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
          a11y={`The venue plot. ${b.system.placed.length} device${b.system.placed.length === 1 ? '' : 's'} placed, ${b.system.links.length} cable${b.system.links.length === 1 ? '' : 's'}, ${b.live.size} loudspeaker${b.live.size === 1 ? '' : 's'} live.${b.part ? ` ${b.targets.length} positions accept the ${gearSpec(b.part).name.toLowerCase()}.` : ''}`}
        />
      </StageFit>
    ),
    params,
  };
  return { rack, wellTop, prompt, status };
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
  const r = useBuilderRack(b, ALL_KINDS);
  return (
    <SoundSystemsRackLayout rack={r.rack} caption="Tap PART, pick a part, then tap a highlighted position on the plot. Tap a device, then another, to run a cable; tap a cable to remove it. The loudspeakers light when a source reaches them." wellTop={r.wellTop}>
      <ChapterTag n={0}>BUILD · THE EMPTY VENUE</ChapterTag>
      <Body>An empty venue in plan — the deck and its riser at the top, wings either side, the audience below — and every part in the catalogue. Build anything; the loudspeakers light when a source reaches them.</Body>
      <Prompt>{r.prompt}</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <CableLegend levels={['mic', 'line', 'speaker', 'digital', 'wireless']} />
      <Text style={styles.status}>{r.status}</Text>
      <KeyFact>A loudspeaker is LIVE only when an unbroken path of valid links runs from a source to it. A dim loudspeaker is a placed loudspeaker with no such path — the most common state of a real system at four in the afternoon. The engine refuses a link for one of three reasons — wrong level, a full input, or a loop — and the one hazardous refusal (speaker level into a line input) is drawn as a warning.</KeyFact>
    </SoundSystemsRackLayout>
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
  const routeMet = routeReqs.filter((r) => grade.met.includes(r.id)).length;
  const consoleParam: DockParam | undefined = ui
    ? {
        kind: 'group',
        id: 'console',
        label: 'CONSOLE',
        valueLabel: routeReqs.length ? `${routeMet}/${routeReqs.length}` : 'Open',
        render: () => (
          <View style={{ gap: 10 }}>
            <Body>▲/▼ step a level; PRE lights the pre-fader tap. The buses below show who hears what — computed, not promised. The plot stays live above.</Body>
            <ConsolePanel cs={cs} onChange={setCs} channels={ui.channels} columns={ui.columns} sendNames={{ aux1: 'SINGER', aux2: 'GUITAR', aux3: 'BASS', aux4: 'DRUMS', aux5: 'REVERB', aux6: 'SUBS', aux7: 'LOBBY' }} />
            {ui.subgroups ? <SubgroupStrip cs={cs} onChange={setCs} /> : null}
            {ui.dcas ? <DcaStrip cs={cs} onChange={setCs} /> : null}
            {ui.matrices?.map((m) => (
              <MatrixStrip key={m.id} cs={cs} onChange={setCs} matrixId={m.id} sources={m.sources} />
            ))}
            {ui.hears.map((h) => (
              <BusHears key={h.title} title={h.title} list={hearsList(cs, h)} />
            ))}
            {routeReqs.length ? (
              <Card tone={routeMet >= routeReqs.length ? 'ok' : 'plain'}>
                <Eyebrow>ON THE CONSOLE · {routeMet} OF {routeReqs.length}</Eyebrow>
                {routeReqs.map((r) => (
                  <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
                ))}
              </Card>
            ) : null}
          </View>
        ),
      }
    : undefined;
  const requirements = (
    <Card tone={grade.pass ? 'ok' : 'plain'}>
      <Eyebrow>{grade.pass ? 'REQUIREMENTS MET — CAPSTONE PASSED' : `REQUIREMENTS · ${grade.met.length} OF ${capstone.requirements.length}`}</Eyebrow>
      {buildReqs.map((r) => (
        <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
      ))}
      {routeReqs.length ? <Eyebrow>ON THE CONSOLE</Eyebrow> : null}
      {routeReqs.map((r) => (
        <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
      ))}
      {grade.pass ? <VerdictLine ok>Capstone {capstone.n} passed — recorded on the lab’s home page. The build stays here to explore; CONTINUE when ready.</VerdictLine> : null}
    </Card>
  );
  const r = useBuilderRack(b, capstone.bin, {
    console: consoleParam,
    bezel: { k: 'REQS', v: grade.pass ? 'PASS' : `${grade.met.length}/${capstone.requirements.length}`, tint: grade.pass ? colors.green : colors.amber, flex: 1 },
    wellTop: requirements,
  });
  return (
    <SoundSystemsRackLayout rack={r.rack} caption={`Capstone ${capstone.n} of 10 · ${capstone.venue}. Build it on the plot from the bin in PART${ui ? ', then open CONSOLE to route it' : ''} — the checklist below fills itself in as you go.`} wellTop={r.wellTop}>
      <ChapterTag n={capstone.n}>{`CAPSTONE ${capstone.n} OF 10 · ${capstone.venue.toUpperCase()}`}</ChapterTag>
      <Body>{capstone.brief}</Body>
      <Prompt>{r.prompt}</Prompt>
      <CableLegend levels={['mic', 'line', 'speaker', 'digital', 'wireless']} />
      <Text style={styles.status}>{r.status}</Text>
    </SoundSystemsRackLayout>
  );
}

export const SS_BUILD_PAGES: SsPageDef[] = [
  { title: 'The empty venue', short: 'VENUE', Component: PageFreeBuild, manualDone: true, rack: true },
  ...CAPSTONES_IN_ORDER.map((c) => ({
    title: `Capstone ${c.n} · ${c.title}`,
    short: `C${c.n}`,
    manualDone: true,
    rack: true,
    Component: ({ ctx }: { ctx: PageCtx }) => <CapstonePage capstone={c} ctx={ctx} />,
  })),
];

const styles = StyleSheet.create({
  bin: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  binTile: { width: 72, minHeight: 74, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 2, gap: 1 },
  binTileOn: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  binLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 8.5, letterSpacing: 0.6, textAlign: 'center' },
  binCount: { position: 'absolute', top: 3, right: 5, color: colors.amber, fontFamily: fonts.mono, fontSize: 9 },
  hand: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#1a1409', padding: 8 },
  inspect: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  small: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  status: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
});
