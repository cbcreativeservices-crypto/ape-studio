/**
 * Patchbay Signal Flow & Normalling — pages 14–18 (Phase B, owner go
 * 2026-09-10): the 8-pair studio bay, the zero-cables studio + the invisible
 * normals, overpatching, the processor insert chain with bypass, and
 * what's-wrong-with-this-patch. ALL COPY RATIFIED by the owner 2026-09-10 (sheet:
 * docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Card, Eyebrow, Lead, Prompt, useMarkWhen } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { DockParam } from '../rack/rackTypes';
import { PATCH_PAIR_GLASS_ASPECT, PATCH_PAIR_GLASS_ASPECT_BARE, PB, PairStatus, PatchPairDrawing, PatchPairView } from './art/PatchPairView';
import { BAY_ASPECT, BayLegend, StudioBayDrawing } from './art/StudioBayView';
import { resolvePair } from './engine/patchbay';
import { STUDIO_PAIRS, WRONG_PATCH_CASES } from './engine/scenariosB';
import { GoalChips, MantraCard, useStationState, useVisitGoals } from './bits';
import { DRAWING_W, PatchbayRack, jackKeys, pairBezel } from './rackLayout';

/* ── 14 · From one pair to a whole bay (§16) ────────────────────────────── */

/** The bay over the selected pair's schematic: one drawing on the glass. */
const BAY_GAP = 8; // viewBox units between the two
const BAY_PAIR_ASPECT = DRAWING_W / (DRAWING_W / BAY_ASPECT + BAY_GAP + DRAWING_W / PATCH_PAIR_GLASS_ASPECT_BARE);
const nn = (n: number) => String(n).padStart(2, '0');

function PageStudioBay({ ctx }: { ctx: PageCtx }) {
  const [selected, setSelected] = useState<number>(1);
  const [visited, setVisited] = useState<Set<number>>(new Set([1]));
  const [thruSeen, setThruSeen] = useState(false);
  // Plug state lives HERE and RESETS on selection (cognition + design pass
  // 2026-09-10: each physical column has its own cords — carrying plugs across
  // pairs rendered cables the learner never patched).
  const [plugState, setPlugState] = useState({ top: false, bottom: false });
  const touchedRef = useRef(false);
  const pair = STUDIO_PAIRS.find((p) => p.n === selected) ?? STUDIO_PAIRS[0];
  const state = { config: pair.config, breakSide: pair.breakSide, topPlugged: plugState.top, bottomPlugged: plugState.bottom };
  const goals = [
    { label: 'VISIT 4 PAIRS', hit: visited.size >= 4 },
    { label: 'FIND THE 2 THRU PAIRS', hit: thruSeen },
    { label: 'PATCH SOMETHING', hit: touchedRef.current },
  ];
  const latched = useVisitGoals(ctx, goals);
  const select = (n: number) => {
    setSelected(n);
    setPlugState({ top: false, bottom: false }); // fresh column, fresh (empty) jacks
    setVisited((prev) => new Set(prev).add(n));
    const p = STUDIO_PAIRS.find((x) => x.n === n);
    if (p?.config === 'thru') setThruSeen(true);
  };
  const toggle = (jack: 'top' | 'bottom') => {
    touchedRef.current = true;
    setPlugState((prev) => (jack === 'top' ? { ...prev, top: !prev.top } : { ...prev, bottom: !prev.bottom }));
  };
  const chips = <GoalChips goals={goals} latched={latched} />;
  // Rack page (owner 2026-10-10): the bay over the selected pair, pinned on
  // the glass (the column and jack taps still work there). The dock walks the
  // columns — PAIR is a chooser-fader: ride it through 01–08 or tap it for the
  // list (it was a row of pair keys docked in full screen) — and patches the
  // selected pair's jacks.
  const idx = Math.max(0, STUDIO_PAIRS.findIndex((p) => p.n === selected));
  const last = STUDIO_PAIRS.length - 1;
  const pairParam: DockParam = {
    kind: 'fader',
    id: 'pair',
    label: 'PAIR',
    value: idx / last,
    onChange: (v) => {
      const p = STUDIO_PAIRS[Math.round(Math.max(0, Math.min(1, v)) * last)];
      if (p && p.n !== selected) select(p.n);
    },
    // The pair number only: a longer readout ran under the lane's thumb at
    // the right-hand pairs. The bezel and the well name the devices.
    format: (v) => nn((STUDIO_PAIRS[Math.round(Math.max(0, Math.min(1, v)) * last)] ?? pair).n),
    chooser: {
      title: 'PAIR',
      options: STUDIO_PAIRS.map((p) => ({ id: String(p.n), label: `${nn(p.n)} · ${p.sourceLabel} → ${p.destLabel}` })),
      selectedId: String(selected),
      onSelect: (id) => select(Number(id)),
    },
  };
  const pb = pairBezel(state, pair.sourceLabel, pair.destLabel);
  return (
    <PatchbayRack
      rack={{
        aspect: BAY_PAIR_ASPECT,
        draw: (w) => (
          <View style={{ width: w, gap: (w * BAY_GAP) / DRAWING_W }}>
            <StudioBayDrawing
              w={w}
              h={w / BAY_ASPECT}
              pairs={STUDIO_PAIRS}
              selected={selected}
              onSelect={select}
              reduceMotion={ctx.reduceMotion}
              // cords patched below mirror as stubs up here — the zoom loop closes
              plugs={{ [selected]: { top: plugState.top, bottom: plugState.bottom } }}
            />
            <PatchPairDrawing
              glass
              hideFaceplate
              w={w}
              state={state}
              sourceLabel={pair.sourceLabel}
              destLabel={pair.destLabel}
              topPatchLabel="YOUR CABLE"
              bottomPatchLabel="YOUR CABLE"
              onToggleJack={toggle}
              reduceMotion={ctx.reduceMotion}
            />
          </View>
        ),
        bezel: [{ k: 'PAIR', v: `${nn(pair.n)} ${pair.config === 'thru' ? 'THRU' : 'HALF'}`, tint: colors.cyanBright }, ...pb.slice(2)],
        params: [pairParam, ...jackKeys(state, toggle)],
        initialParam: 'pair',
      }}
    >
      <Lead>
        Part two. You mastered one vertical pair — now here are EIGHT of them side by side: a real (small) studio bay. Every
        column is exactly the pair you already know. Tap columns to inspect them; two of these pairs pass NOTHING with an
        empty bay — find them.
      </Lead>
      <BayLegend />
      <PairStatus
        state={state}
        sourceLabel={pair.sourceLabel}
        destLabel={pair.destLabel}
        caption={`PAIR ${String(pair.n).padStart(2, '0')} · ${pair.config === 'thru' ? 'THRU' : 'HALF-NORMAL (COMMON)'} — same rules as always.`}
      />
      {chips}
      <Body>
        Notice the layout logic: recording paths, mic pres, and monitoring live on half-normal pairs. The two processor pairs
        are wired THRU — a later page shows exactly why that choice is a safety rule, not a style.
      </Body>
    </PatchbayRack>
  );
}

/* ── 15 · The studio works with no cables (§17) ─────────────────────────── */

function PageZeroCables({ ctx }: { ctx: PageCtx }) {
  const [reveal, setReveal] = useState(false);
  const [solved, setSolved] = useState(false);
  // Render-time ref latch (house pattern) — has the reveal EVER been seen?
  const revealedRef = useRef(false);
  if (reveal) revealedRef.current = true;
  const revealed = revealedRef.current;
  // BOTH latches, any order (design+cognition pass 2026-09-10: onCorrect fires
  // exactly once — gating markDone inside it deadlocked the answer-first path).
  useMarkWhen(revealed && solved, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  // Rack page (owner 2026-10-10): the bay on the glass; the reveal is the
  // dock's switch (it was a button under the bay).
  return (
    <PatchbayRack
      rack={{
        size: 'S',
        aspect: BAY_ASPECT,
        draw: (w) => <StudioBayDrawing w={w} h={w / BAY_ASPECT} pairs={STUDIO_PAIRS} showNormals={reveal} reduceMotion={ctx.reduceMotion} />,
        bezel: [
          { k: 'PAIRS', v: String(STUDIO_PAIRS.length) },
          { k: 'FRONT CORDS', v: '0', flex: 1.3 },
          { k: 'NORMALS', v: reveal ? 'SHOWN' : 'HIDDEN', tint: reveal ? PB.flow : colors.textSub },
        ],
        params: [{ kind: 'toggle', id: 'reveal', label: 'SHOW THE INVISIBLE NORMALS', value: reveal, onToggle: () => setReveal((v) => !v) }],
        initialParam: 'reveal',
      }}
    >
      <Lead>
        Look at this bay: not one patch cord anywhere. And yet — recording runs, the pres feed the console, the monitors play.
        Where are the connections?
      </Lead>
      <BayLegend />
      <Card tone="math">
        <Text style={local.big}>A properly designed normalled patchbay runs its standard signal path with ZERO front-panel cables.</Text>
        <Body>
          Patch cords are not there to make every routine connection — they exist to CHANGE the default routing when a session
          needs something unusual. The normals do the everyday work silently.
        </Body>
      </Card>
      <UnderstandingCheck
        question="With the bay completely empty, why does the studio still pass audio?"
        options={[
          'The internal normals connect each source to its destination by default',
          'The rear cables carry signal directly between devices, skipping the bay',
          'It shouldn’t — an empty bay is silent',
          'The console routes around the patchbay automatically',
        ]}
        correct={0}
        explain="Six of the eight pairs carry their route on internal normal contacts — the connections you just revealed. The bay IS the wiring."
        wrong={[
          undefined,
          'Every one of those device connections runs THROUGH the bay’s rear — that is the whole point. What connects top rear to bottom rear inside?',
          'That was the THRU pair’s truth, not the normalled studio’s. Press the reveal button and look again.',
          'Nothing routes around it — the default routes live INSIDE it. Reveal them.',
        ]}
        onCorrect={() => setSolved(true)}
      />
      {!revealed ? <Prompt>The page completes once you have also pressed SHOW THE INVISIBLE NORMALS — see them for yourself.</Prompt> : null}
    </PatchbayRack>
  );
}

/* ── 16 · Overpatching (§18) ────────────────────────────────────────────── */

function PageOverpatch({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('half', 'bottom');
  const flow = resolvePair(state);
  const goals = [{ label: 'OVERPATCH IT (patch the bottom)', hit: flow.destinationHears === 'patch' }];
  const latched = useVisitGoals(ctx, goals);
  const chips = <GoalChips goals={goals} latched={latched} />;
  return (
    <PatchbayRack
      rack={{
        aspect: PATCH_PAIR_GLASS_ASPECT,
        draw: (w) => (
          <PatchPairDrawing glass w={w} state={state} sourceLabel="CONSOLE OUT 1" destLabel="INTERFACE IN 1" topPatchLabel="YOUR CABLE" bottomPatchLabel="SYNTH (SOURCE C)" onToggleJack={toggle} reduceMotion={ctx.reduceMotion} />
        ),
        bezel: pairBezel(state, 'CONSOLE OUT 1', 'INTERFACE IN 1'),
        params: jackKeys(state, toggle),
        initialParam: 'top',
      }}
    >
      <Lead>Two professional words for what you have been doing all along:</Lead>
      <Card tone="math">
        <Eyebrow>NORMAL PATH</Eyebrow>
        <Body>The connection the studio makes automatically — A → B with an empty bay.</Body>
        <Eyebrow>OVERPATCH</Eyebrow>
        <Body>A patch cord that CHANGES that normal path — C now feeds B instead of A.</Body>
      </Card>
      <PairStatus
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        caption={
          flow.destinationHears === 'patch'
            ? 'OVERPATCHED — C feeds B; the normal path is on hold until the cord comes out.'
            : 'The NORMAL PATH — A feeds B automatically. Now overpatch: put source C into the BOTTOM jack.'
        }
      />
      {chips}
      <Body>
        In a larger studio you will hear it exactly like this: “the tape returns are NORMALLED to the monitor path — OVERPATCH
        line 3 if you need the drum machine.” You now speak the language.
      </Body>
    </PatchbayRack>
  );
}

/* ── 17 · The processor chain + bypass (§19) ────────────────────────────── */

function PageProcessorChain({ ctx }: { ctx: PageCtx }) {
  const [inserted, setInserted] = useState(false);
  const [serviceSolved, setServiceSolved] = useState(false);
  // Which of the two pairs the glass shows (rack conversion 2026-10-10: the
  // two schematics cannot share one glass at a legible size — see below).
  const [view, setView] = useState<'vocal' | 'proc'>('vocal');
  // Render-time ref latches (house pattern): inserted once; bypassed AFTER.
  const sawIn = useRef(false);
  const sawOut = useRef(false);
  if (inserted) sawIn.current = true;
  if (!inserted && sawIn.current) sawOut.current = true;
  const goals = [
    { label: 'INSERT THE COMPRESSOR', hit: sawIn.current },
    { label: 'BYPASS IT AGAIN', hit: sawOut.current },
    { label: 'SERVICE CALL (answer below)', hit: serviceSolved },
  ];
  const latched = useVisitGoals(ctx, goals);
  // Vocal pair: half-normal — the ② RETURN overpatch (bottom) breaks it.
  const vocalState = { config: 'half' as const, breakSide: 'bottom' as const, topPlugged: inserted, bottomPlugged: inserted };
  // Compressor pair: THRU — it only joins the chain by cable. Its OUT is only
  // alive while the chain feeds its IN (sourceLive keeps the diagram honest).
  const compState = { config: 'thru' as const, topPlugged: inserted, bottomPlugged: inserted };
  const chips = <GoalChips goals={goals} latched={latched} />;
  // Rack page (owner 2026-10-10). The two pair drawings used to stack on the
  // page; two schematics on one glass would draw their labels near 5 pt, so
  // the glass shows ONE — the dock's VIEW key flips between the vocal pair and
  // the processor pair — and the well keeps both pairs' readouts. INSERT is
  // the dock's switch (it was a button between the drawings).
  const vocal = view === 'vocal';
  const viewed = vocal
    ? { state: vocalState, sourceLabel: 'VOCAL OUT', destLabel: 'CONSOLE IN 2', topPatchLabel: '① SEND ▸ COMP IN', bottomPatchLabel: '② RETURN ◂ COMP OUT', sourceLive: true }
    : { state: compState, sourceLabel: 'COMPRESSOR OUT', destLabel: 'COMPRESSOR IN', topPatchLabel: '② RETURN ▸ CONSOLE IN 2', bottomPatchLabel: '① SEND ◂ VOCAL OUT', sourceLive: inserted };
  return (
    <PatchbayRack
      rack={{
        aspect: PATCH_PAIR_GLASS_ASPECT_BARE,
        draw: (w) => <PatchPairDrawing glass hideFaceplate w={w} {...viewed} reduceMotion={ctx.reduceMotion} />,
        bezel: [
          { k: 'COMPRESSOR', v: inserted ? 'IN' : 'BYPASSED', tint: inserted ? PB.cord : colors.textSub, flex: 1.3 },
          ...pairBezel(viewed.state, viewed.sourceLabel, viewed.destLabel, viewed.sourceLive).slice(2),
        ],
        params: [
          { kind: 'toggle', id: 'insert', label: 'INSERT COMPRESSOR', value: inserted, onToggle: () => setInserted((v) => !v) },
          {
            kind: 'options',
            id: 'view',
            label: 'VIEW',
            valueLabel: vocal ? 'VOCAL' : 'PROCESSOR',
            valueA11y: vocal ? 'the vocal pair' : 'the processor pair',
            options: [
              { id: 'vocal', label: 'VOCAL PAIR' },
              { id: 'proc', label: 'PROCESSOR PAIR' },
            ],
            selectedId: view,
            onSelect: (id) => setView(id === 'proc' ? 'proc' : 'vocal'),
          },
        ],
        initialParam: 'insert',
      }}
    >
      <Lead>
        The classic patch every engineer learns first: put an outboard compressor INTO an existing path — then take it out
        again without re-wiring anything. TWO cables make the chain: ① SEND and ② RETURN — follow their numbers through both
        diagrams.
      </Lead>
      <PairStatus
        title="VOCAL PAIR"
        state={vocalState}
        sourceLabel="VOCAL OUT"
        destLabel="CONSOLE IN 2"
        caption={
          inserted
            ? 'The vocal leaves on ① SEND (top tap), and the processed signal returns on ② RETURN (bottom — breaking the normal).'
            : 'BYPASSED — no cords: the vocal rides its normal straight to the console.'
        }
      />
      <PairStatus
        title="PROCESSOR PAIR"
        state={compState}
        sourceLabel="COMPRESSOR OUT"
        destLabel="COMPRESSOR IN"
        sourceLive={inserted}
        caption={
          inserted
            ? 'The THRU processor pair, cabled in: ① feeds COMP IN below; COMP OUT rides ② back to the console.'
            : 'The processor pair at rest: THRU, nothing connected, its output idle — the compressor waits until it is invited.'
        }
      />
      {chips}
      <Body>
        Read the chain when inserted: Vocal Out → ① → Compressor In → PROCESSING → Compressor Out → ② → Console In (normal
        broken by ②). Bypass = pull both cords: the vocal’s own normal instantly restores the direct path. You are now
        thinking in signal chains, not holes in a panel.
      </Body>
      <UnderstandingCheck
        eyebrow="SERVICE CALL"
        question="The comp is inserted and a session is running. Someone trips and pulls ONLY the ② RETURN cord out of the bottom jack. What does the console hear now?"
        options={[
          'The DRY vocal — the normal closed again the moment ② came out',
          'Silence — the chain is broken',
          'The compressed vocal, quieter',
        ]}
        correct={0}
        explain="With the bottom jack empty the half-normal contact closes again: the console silently falls back to the DRY vocal. Sessions have shipped un-compressed takes exactly this way — listen when a cord moves."
        wrong={[
          undefined,
          'Trace the vocal pair: with the bottom empty, what does its own normal do? The ① SEND tap never broke it.',
          'The compressor’s return path is gone — nothing processed can reach the console. But something else can…',
        ]}
        onCorrect={() => setServiceSolved(true)}
      />
    </PatchbayRack>
  );
}

/* ── 18 · What's wrong with this patch? (§20) ───────────────────────────── */

function PageWrongPatch({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const all = WRONG_PATCH_CASES.every((c) => solved[c.id]);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return (
    <View style={{ gap: 14 }}>
      <Lead>
        Four real service calls. Each one is a configuration misunderstanding — diagnose them like the engineer on shift.
      </Lead>
      {WRONG_PATCH_CASES.map((c, i) => (
        <View key={c.id} style={{ gap: 8 }}>
          <Card>
            <Eyebrow>{`CALL ${i + 1} OF ${WRONG_PATCH_CASES.length} · ${c.title.toUpperCase()}`}</Eyebrow>
            <Body>{c.situation}</Body>
          </Card>
          {c.render ? (
            <PatchPairView
              state={c.render.state}
              sourceLabel={c.render.sourceLabel}
              destLabel={c.render.destLabel}
              topPatchLabel="LEFT BY SOMEONE"
              bottomPatchLabel="LEFT BY SOMEONE"
              reduceMotion={ctx.reduceMotion}
              hideFaceplate
            />
          ) : null}
          <UnderstandingCheck
            eyebrow="YOUR DIAGNOSIS"
            question={c.question}
            options={c.options}
            correct={c.correct}
            explain={c.explain}
            wrong={c.wrong}
            onCorrect={() => setSolved((prev) => ({ ...prev, [c.id]: true }))}
          />
        </View>
      ))}
    </View>
  );
}

export const PATCHBAY_PAGES_C: PageDef[] = [
  { title: 'From one pair to a whole bay', short: 'BAY', Component: PageStudioBay, manualDone: true, rack: true },
  { title: 'The studio works with no cables', short: 'ZERO', Component: PageZeroCables, manualDone: true, rack: true },
  { title: 'Overpatching', short: 'OVER', Component: PageOverpatch, manualDone: true, rack: true },
  { title: 'The processor chain', short: 'CHAIN', Component: PageProcessorChain, manualDone: true, rack: true },
  { title: 'What’s wrong with this patch?', short: 'FIX-IT', Component: PageWrongPatch, manualDone: true },
];

const local = StyleSheet.create({
  big: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, lineHeight: 22, letterSpacing: 0.4 },
});
