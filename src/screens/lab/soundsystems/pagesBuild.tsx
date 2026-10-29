/**
 * Sound Systems Lab — BUILD mode: the venue builder and ten capstones, on the
 * Rack Unit (owner 2026-09-25).
 *
 *   STAGE  the venue plot, pinned and live: tap a highlighted position to
 *          place the part in hand, tap a device then another to connect
 *          them, tap a cable to remove it. Tap the same two again for a
 *          SECOND cable where the far device has a free input and each cable
 *          carries its own output (stagebox → in-ear transmitter, Aux 9 and
 *          Aux 10 — owner 2026-10-21): two lanes, each with its tag plate.
 *   DOCK   PART — one key that is both the parts list and a lane: tap it to
 *          read the bin, ride it to flip through the parts while the plot
 *          shows where each may stand · OUTPUT (when the selected device's
 *          cable comes from the console side) — which console output that
 *          cable carries: a lane for the console's seventeen, a tap key for
 *          two to four, LOCKED when only one reaches it (WF-SS-02,
 *          2026-10-20); OUTPUT 1 and OUTPUT 2 when two cables come in · CONSOLE (routing capstones) opens
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
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Prompt, Row } from '../tuning/components/primitives';
import { GEAR, gearSpec, isSource, LEVEL_LABEL } from '../../../features/soundsystems/gear';
import { carriesOutputs, connect, consoleWalk, disconnect, EMPTY_SYSTEM, feedLinks, linkCarries, outChoices, pairIndex, place, removePlaced, setLinkOut, SLOTS, slotAccepts, slotDef, trace, upstream, downstream, type ConsoleWalk } from '../../../features/soundsystems/system';
import { isIemPair, OUT_UNSET, outLabel, outName, outTag, outUse } from '../../../features/soundsystems/outputs';
import { CAPSTONES_IN_ORDER, capstoneConsole, CONSOLE_PRESET_NOTE, gradeCapstone, type Capstone } from '../../../features/soundsystems/capstones';
import type { ConsoleState } from '../../../features/soundsystems/console';
import { markCapstonePassed } from '../../../features/soundsystems/progress';
import type { ConsoleOut, GearKind, Link, SlotId, SoundSystem } from '../../../features/soundsystems/types';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { ChapterTag, GoalChips, KeyFact, ReqRow, useVisitGoals, VerdictLine } from './bits';
import { GearGlyph } from './art/gearArt';
import { CableLegend, PLOT_H, PLOT_W, VenueView } from './art/VenueView';
import { placedToBeams, PLOT_BADGE, twinCableTag } from './plot';
import { BusHears, ConsolePanel, DcaStrip, MatrixStrip, matrixHears, auxHears, mainHears, subgroupHears, SubgroupStrip, type ConsoleColumn } from './art/ConsolePanel';
import { flipFader, SoundSystemsRackLayout, type SsPageDef, type SsRack } from './rackLayout';
import { StageFit } from '../rack/StageFit';
import { TitledStage } from '../rack/TitledStage';
import { usePageMemory } from './pageMemory';

/* ── the builder ─────────────────────────────────────────────────────────── */

type Msg = { text: string; unsafe?: boolean; ok?: boolean };

export function useBuilder(initial: SoundSystem = EMPTY_SYSTEM) {
  // The plot survives BACK / CONTINUE for the session (bug hunt 2026-09-29).
  const [system, setSystem] = usePageMemory<SoundSystem>('system', initial);
  const [part, setPart] = useState<GearKind | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [refusals, setRefusals] = useState(0);
  const [sawUnsafe, setSawUnsafe] = useState(false);
  const t = useMemo(() => trace(system), [system]);
  const live = useMemo(() => new Set(t.live), [t]);
  const walk = useMemo(() => consoleWalk(system), [system]);

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
          const nth = pairIndex(v.system, v.link);
          const pick = nth > 0 ? ` A second cable — tap OUTPUT ${nth + 1} to choose the console output it carries.` : gearSpec(b.kind).radiates && carriesOutputs(v.system, v.link) ? ' Tap OUTPUT to choose the console output it carries.' : '';
          setMsg({ text: `${gearSpec(a.kind).name} → ${gearSpec(b.kind).name}, at ${LEVEL_LABEL[v.link.level]}.${pick}`, ok: true });
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

  // Only the tapped cable goes — its twin between the same pair stays.
  const tapLink = useCallback(
    (l: Link) => {
      setSystem((s) => disconnect(s, l.from, l.to, Math.max(0, pairIndex(s, l))));
      setMsg({ text: 'Cable removed.' });
    },
    [],
  );

  const setOut = useCallback((l: Link, out: ConsoleOut) => {
    setSystem((s) => setLinkOut(s, l.from, l.to, out, Math.max(0, pairIndex(s, l))));
    setMsg({ text: `This cable now carries ${outName(out)}.`, ok: true });
  }, []);

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

  return { system, part, setPart, selected, setSelected, msg, targets, live, trace: t, walk, tapSlot, tapPlaced, tapLink, setOut, remove, reset, refusals, sawUnsafe };
}

type BuilderRack = { rack: SsRack; wellTop: ReactNode; prompt: string; status: string };

/**
 * The builder's rack declaration: the plot on the glass, PART / CONSOLE /
 * REMOVE / CLEAR in the dock, counts on the bezel, the live cards in the
 * well-top slot.
 */
function useBuilderRack(b: ReturnType<typeof useBuilder>, kinds: readonly GearKind[], extras: { bezel?: BezelItem; console?: DockParam; wellTop?: ReactNode; title?: { title: string; subtitle?: string } } = {}): BuilderRack {
  const sel = b.selected ? b.system.placed.find((p) => p.id === b.selected) : undefined;
  const tags = useMemo(() => feedTags(b.walk), [b.walk]);
  const beams = useMemo(() => placedToBeams(b.system.placed, b.live, tags), [b.system.placed, b.live, tags]);
  // Every cable into the selected device that carries a console output gets
  // its own OUTPUT key — two for a stereo pair on two cables (OUTPUT 1, 2).
  const selLinks = sel ? feedLinks(b.system, sel.id, b.walk) : [];
  const selLink = selLinks[0];
  const outputs = sel ? selLinks.map((l, i) => outputParam(b, l, sel.kind, selLinks.length > 1 ? i + 1 : 0)).filter((x): x is DockParam => !!x) : [];
  const carried = selLink ? carriedWord(linkCarries(b.system, selLink, b.walk)) : '';
  const fedByEach = selLinks.length > 1 ? selLinks.map((l) => `${gearSpec(b.system.placed.find((p) => p.id === l.from)!.kind).name} · ${carriedWord(linkCarries(b.system, l, b.walk)) || OUT_UNSET}`).join(', ') : '';
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
    ...outputs,
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
  const unset = !!sel && ((gearSpec(sel.kind).radiates && !!selLink && b.walk.feeds.get(sel.id) === '*') || (selLinks.length > 1 && selLinks.some((l) => !l.out)));
  const prompt = b.part
    ? `Tap a highlighted position to place the ${gearSpec(b.part).name.toLowerCase()}.`
    : unset
      ? 'Tap OUTPUT to choose which console output feeds it — or tap another device to connect from it.'
      : sel
        ? 'Tap another device to connect from the selected one.'
        : 'Tap PART to pick a part, then a position on the plot.';
  const status = `${b.trace.live.length} live · ${b.trace.silent.length} silent · ${b.trace.strandedSources.length} source${b.trace.strandedSources.length === 1 ? '' : 's'} unconnected`;
  const wellTop = (
    <>
      {inHand ? (
        <View style={styles.hand} accessible accessibilityLabel={`In hand: ${inHand.name}. ${prompt}`}>
          <GearGlyph kind={inHand.kind} size={40} label={inHand.name} />
          <View style={{ flex: 1, gap: 1 }}>
            <Eyebrow>IN HAND · {inHand.name.toUpperCase()}</Eyebrow>
            <Text style={styles.small}>{prompt}</Text>
            {/* The plot marks these positions with rings; their names live here,
                because at a readable size neighbouring names overlap on the plot. */}
            {b.targets.length ? <Text style={styles.small}>STANDS AT · {b.targets.map((t) => slotDef(t).label).join(', ')}</Text> : null}
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
              {fedByEach ? (
                <Text style={styles.small}>FED BY · {fedByEach} — two cables, one output each</Text>
              ) : (
                <Text style={styles.small}>FED BY · {upstream(b.system, sel.id).map((p) => gearSpec(p.kind).name).join(', ') || 'nothing'}{carried ? ` · ${carried}` : ''}</Text>
              )}
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
    // A capstone's name and venue print above the plot in FULL SCREEN, where
    // the page's brief is left behind (owner 2026-09-29) — on the glass the
    // chapter tag right below says it and the plot keeps its full size.
    stage: (w, h) => {
      const plot = (
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
          linkA11y={(l) => cableWords(linkCarries(b.system, l, b.walk))}
          cableTag={(l) => twinCableTag(b.system, l, b.walk)}
          a11y={`The venue plot. ${b.system.placed.length} device${b.system.placed.length === 1 ? '' : 's'} placed, ${b.system.links.length} cable${b.system.links.length === 1 ? '' : 's'}, ${b.live.size} loudspeaker${b.live.size === 1 ? '' : 's'} live.${b.part ? ` ${b.targets.length} positions accept the ${gearSpec(b.part).name.toLowerCase()}.` : ''}`}
        />
      );
      return extras.title ? (
        <TitledStage w={w} h={h} aspect={PLOT_W / PLOT_H} title={extras.title.title} subtitle={extras.title.subtitle}>
          {plot}
        </TitledStage>
      ) : (
        <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
          {plot}
        </StageFit>
      );
    },
    params,
  };
  return { rack, wellTop, prompt, status };
}

/* ── the console output each cable carries (WF-SS-02) ────────────────────── */

/** Each loudspeaker's plot tag: the output it is fed from, or OUT ?; an
 *  in-ear pack on the stereo In-ears L/R pair reads both ("AUX 9+10"). */
function feedTags(walk: ConsoleWalk): ReadonlyMap<string, string> {
  const m = new Map<string, string>();
  for (const [id, f] of walk.feeds) {
    const pair = walk.pairs.get(id);
    m.set(id, pair ? `AUX ${pair[0].slice(3)}+${pair[1].slice(3)}` : f === '*' ? OUT_UNSET : outTag(f));
  }
  return m;
}

/** The inspect card's word for what the selected device's cable carries. */
function carriedWord(c: ConsoleOut | 'all' | '*' | null): string {
  if (!c) return '';
  if (c === 'all') return 'ALL OUTPUTS';
  return c === '*' ? OUT_UNSET : outLabel(c);
}

/** The cable's tap target reads what it carries. */
function cableWords(c: ConsoleOut | 'all' | '*' | null): string | undefined {
  if (!c) return undefined;
  if (c === 'all') return 'carries every console output';
  return c === '*' ? 'no console output chosen' : `carries ${outName(c)}`;
}

/** OUTPUT — which console output the cable INTO the selected device carries.
 *  Seventeen (straight from the console or a stagebox return) ride a lane; two
 *  to four are a tap key; one is LOCKED, with the reason (D75). With two
 *  cables in (`n` = 1, 2) each gets its own key, OUTPUT 1 and OUTPUT 2, and
 *  neither offers the output the other carries. */
function outputParam(b: ReturnType<typeof useBuilder>, l: Link, kind: GearKind, n = 0): DockParam | undefined {
  const choices = outChoices(b.system, l, b.walk);
  if (choices.length === 0) return undefined;
  const from = b.system.placed.find((p) => p.id === l.from);
  const fromName = from ? gearSpec(from.kind).name.toLowerCase() : 'device';
  const chosen = l.out && choices.includes(l.out) ? l.out : null;
  const sink = !!gearSpec(kind).radiates;
  const id = n > 1 ? `output${n}` : 'output';
  const label = n ? `OUTPUT ${n}` : 'OUTPUT';
  if (choices.length === 1 && (!l.out || chosen)) {
    const only = choices[0];
    return {
      kind: 'options',
      id,
      label,
      valueLabel: outTag(only),
      valueA11y: outName(only),
      options: [{ id: only, label: outLabel(only), blurb: outUse(only) }],
      selectedId: only,
      onSelect: () => {},
      locked: `Only ${outName(only)} reaches the ${fromName}, so this cable carries it. Choose a different output on the cable before it.`,
    };
  }
  const options = choices.map((o) => ({ id: o, label: outLabel(o), blurb: outUse(o) }));
  if (choices.length <= 4) {
    return {
      kind: 'options',
      id,
      label,
      valueLabel: chosen ? outTag(chosen) : OUT_UNSET,
      valueA11y: chosen ? outName(chosen) : 'no output chosen',
      options,
      selectedId: chosen,
      onSelect: (id) => b.setOut(l, id as ConsoleOut),
    };
  }
  const lane = flipFader({
    id,
    label,
    title: n ? `CONSOLE OUTPUT — what cable ${n} from the ${fromName} carries` : `CONSOLE OUTPUT — what the cable from the ${fromName} carries`,
    items: choices.map((id) => ({ id })),
    selectedId: chosen ?? '',
    onSelect: (id) => b.setOut(l, id as ConsoleOut),
    name: (x) => outName(x.id as ConsoleOut),
    short: (x) => outTag(x.id as ConsoleOut),
    empty: sink || n ? 'OUT ? — tap to choose the output' : 'all outputs pass — choose at each loudspeaker',
    blurb: (x) => outUse(x.id as ConsoleOut),
  });
  // The lane binds to OUTPUT when it appears (the Tuning precedent,
  // 2026-10-14): the next drag picks the output, not another part.
  return lane.kind === 'fader' ? { ...lane, autoBind: true } : lane;
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
      <Body>An empty venue in plan — the deck and its riser at the top, wings either side, the audience below — and every part in the catalog. Build anything; the loudspeakers light when a source reaches them.</Body>
      <Prompt>{r.prompt}</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <CableLegend levels={['mic', 'line', 'speaker', 'digital', 'wireless']} />
      <Text style={styles.status}>{r.status}</Text>
      <KeyFact>A loudspeaker is LIVE only when an unbroken path of valid links runs from a source to it. A dim loudspeaker is a placed loudspeaker with no such path — the most common state of a real system at four in the afternoon. The engine refuses a link with its reason — most often the wrong level, a full input, or a loop — and the one hazardous refusal (speaker level into a line input) is drawn as a warning. An analog cable carries one console output; a multicore or a network link carries them all. Tap the same two devices again for a second cable where the far one has a free input — a stereo in-ear feed is two cables from the stagebox to the transmitter, Aux 9 and Aux 10, each with its own OUTPUT key — never the same output twice.</KeyFact>
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
  /** `iem`: a readout shown only for one in-ear feed — 'mono' while the
   *  pack is on a single output (Aux 8), 'stereo' once it is on the In-ears
   *  L/R pair, Aux 9 + 10 (R4-SS-01). */
  hears: readonly { title: string; kind: 'aux' | 'main' | 'sub' | 'matrix'; id?: string; iem?: 'mono' | 'stereo' }[];
};

export const ROUTE_UI: Partial<Record<string, RouteUi>> = {
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
    // Aux 8 (mono in-ears) and the stereo In-ears L/R pair, Aux 9 + 10
    // (R3-SS-01): the desk scrolls sideways past five columns.
    columns: ['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4', 'send:aux6', 'send:aux8', 'send:aux9', 'send:aux10'],
    matrices: [{ id: 'mx-rec', sources: [{ id: 'main', label: 'MAIN' }, { id: 'aux1', label: 'AUX 1' }] }],
    hears: [
      { title: 'AUX 1 · WEDGE 1 HEARS', kind: 'aux', id: 'aux1' },
      { title: 'AUX 6 · THE SUBS HEAR', kind: 'aux', id: 'aux6' },
      { title: 'AUX 8 · THE IN-EARS HEAR', kind: 'aux', id: 'aux8', iem: 'mono' },
      { title: 'AUX 9 · IN-EARS L HEARS', kind: 'aux', id: 'aux9', iem: 'stereo' },
      { title: 'AUX 10 · IN-EARS R HEARS', kind: 'aux', id: 'aux10', iem: 'stereo' },
      { title: 'MATRIX 4 · RECORDING HEARS', kind: 'matrix', id: 'mx-rec' },
    ],
  },
};

/** The "who hears" readouts a build shows: an in-ear pack on the stereo
 *  In-ears L/R pair (Aux 9 + 10) gets one readout per side, so both sides of
 *  the mix can be checked; any other pack (one output, or none yet) keeps the
 *  Aux 8 readout (R4-SS-01). */
export function hearsShown(hears: RouteUi['hears'], system: SoundSystem, walk: ConsoleWalk): RouteUi['hears'] {
  const stereo = system.placed.some((p) => p.kind === 'iemPack' && isIemPair(walk.pairs.get(p.id)));
  return hears.filter((h) => !h.iem || h.iem === (stereo ? 'stereo' : 'mono'));
}

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
  const built = useBuilder();
  // A capstone that never opens the console starts it with its sub buses
  // preset (SS-R2-04, capstoneConsole) — the page says so below the brief.
  const [cs, setCs] = usePageMemory<ConsoleState>('console', () => capstoneConsole(capstone));
  // CLEAR starts the capstone over — the plot AND the console routing
  // (bug hunt 2026-09-29: it used to leave the console as routed).
  const b = { ...built, reset: () => { built.reset(); setCs(capstoneConsole(capstone)); } };
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
        hideLane: true,
        label: 'CONSOLE',
        valueLabel: routeReqs.length ? `${routeMet}/${routeReqs.length}` : 'Open',
        render: () => (
          <View style={{ gap: 10 }}>
            <Body>▲/▼ step a level; PRE lights the pre-fader tap. The buses below show who hears what — computed, not promised. The plot stays live above.</Body>
            <ConsolePanel cs={cs} onChange={setCs} channels={ui.channels} columns={ui.columns} sendNames={{ aux1: 'SINGER', aux2: 'GUITAR', aux3: 'BASS', aux4: 'DRUMS', aux5: 'REVERB', aux6: 'SUBS', aux7: 'LOBBY', aux8: 'MONO', aux9: 'STEREO L', aux10: 'STEREO R' }} />
            {ui.subgroups ? <SubgroupStrip cs={cs} onChange={setCs} /> : null}
            {ui.dcas ? <DcaStrip cs={cs} onChange={setCs} /> : null}
            {ui.matrices?.map((m) => (
              <MatrixStrip key={m.id} cs={cs} onChange={setCs} matrixId={m.id} sources={m.sources} />
            ))}
            {hearsShown(ui.hears, b.system, b.walk).map((h) => (
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
      {buildReqs.map((r) => {
        const met = grade.met.includes(r.id);
        const why = met ? null : r.why?.(b.system, cs);
        return (
          <View key={r.id}>
            <ReqRow met={met} text={r.text} />
            {why ? <Text style={styles.why}>{why}</Text> : null}
          </View>
        );
      })}
      {routeReqs.length ? <Eyebrow>ON THE CONSOLE</Eyebrow> : null}
      {routeReqs.map((r) => (
        <ReqRow key={r.id} met={grade.met.includes(r.id)} text={r.text} />
      ))}
      {grade.pass ? <VerdictLine ok>Capstone {capstone.n} passed — recorded on the lab’s home page. The build stays here to explore; CONTINUE when ready.</VerdictLine> : null}
      {/* Owner decision 8 (2026-10-20): a capstone passed before the OUTPUTS
          row existed stays passed — the record is never taken back. */}
      {!grade.pass && ctx.isDone ? <Text style={styles.small}>Passed earlier — still credited. This checklist is the build on the plot now.</Text> : null}
    </Card>
  );
  const r = useBuilderRack(b, capstone.bin, {
    console: consoleParam,
    bezel: { k: 'REQS', v: grade.pass ? 'PASS' : `${grade.met.length}/${capstone.requirements.length}`, tint: grade.pass ? colors.green : colors.amber, flex: 1 },
    wellTop: requirements,
    title: { title: capstone.title, subtitle: `Capstone ${capstone.n} of 10 · ${capstone.venue}` },
  });
  return (
    <SoundSystemsRackLayout rack={r.rack} caption={`Capstone ${capstone.n} of 10 · ${capstone.venue}. Build it on the plot from the bin in PART${ui ? ', then open CONSOLE to route it' : ''} — the checklist below fills itself in as you go.`} wellTop={r.wellTop}>
      <ChapterTag n={capstone.n}>{`CAPSTONE ${capstone.n} OF 10 · ${capstone.venue.toUpperCase()}`}</ChapterTag>
      <Body>{capstone.brief}</Body>
      {!capstone.routing && capstone.bin.some((k) => k === 'poweredSub' || k === 'passiveSub') ? <Text style={styles.small}>{CONSOLE_PRESET_NOTE}</Text> : null}
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
  hand: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#1a1409', padding: 8 },
  inspect: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  small: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  why: { color: colors.orange, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, marginLeft: 30 },
  status: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
});
