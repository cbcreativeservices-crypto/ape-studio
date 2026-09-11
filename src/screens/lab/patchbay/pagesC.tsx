/**
 * Patchbay Signal Flow & Normalling — pages 14–18 (Phase B, owner go
 * 2026-09-10): the 8-pair studio bay, the zero-cables studio + the invisible
 * normals, overpatching, the processor insert chain with bypass, and
 * what's-wrong-with-this-patch. ALL COPY NEW (ratification pending; sheet:
 * docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row, useMarkWhen } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { PatchPairView } from './art/PatchPairView';
import { StudioBayView } from './art/StudioBayView';
import { resolvePair } from './engine/patchbay';
import { STUDIO_PAIRS, WRONG_PATCH_CASES } from './engine/scenariosB';
import { GoalChips, MantraCard, useStationState, useVisitGoals } from './bits';

/* ── 14 · From one pair to a whole bay (§16) ────────────────────────────── */

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
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Part two. You mastered one vertical pair — now here are EIGHT of them side by side: a real (small) studio bay. Every
        column is exactly the pair you already know. Tap columns to inspect them; two of these pairs pass NOTHING with an
        empty bay — find them.
      </Lead>
      <StudioBayView
        pairs={STUDIO_PAIRS}
        selected={selected}
        onSelect={select}
        reduceMotion={ctx.reduceMotion}
        // cords patched below mirror as stubs up here — the zoom loop closes
        plugs={{ [selected]: { top: plugState.top, bottom: plugState.bottom } }}
      />
      <PatchPairView
        key={selected}
        state={state}
        sourceLabel={pair.sourceLabel}
        destLabel={pair.destLabel}
        topPatchLabel="YOUR CABLE"
        bottomPatchLabel="YOUR CABLE"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
        hideFaceplate
        caption={`PAIR ${String(pair.n).padStart(2, '0')} · ${pair.config === 'thru' ? 'THRU' : 'HALF-NORMAL (COMMON)'} — same rules as always.`}
      />
      <GoalChips goals={goals} latched={latched} />
      <Body>
        Notice the layout logic: recording paths, mic pres, and monitoring live on half-normal pairs. The two processor pairs
        are wired THRU — a later page shows exactly why that choice is a safety rule, not a style.
      </Body>
    </View>
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
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Look at this bay: not one patch cord anywhere. And yet — recording runs, the pres feed the console, the monitors play.
        Where are the connections?
      </Lead>
      <StudioBayView pairs={STUDIO_PAIRS} showNormals={reveal} reduceMotion={ctx.reduceMotion} />
      <Row>
        <Btn label={reveal ? 'HIDE THE NORMALS' : 'SHOW THE INVISIBLE NORMALS'} tone="primary" onPress={() => setReveal((v) => !v)} />
      </Row>
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
    </View>
  );
}

/* ── 16 · Overpatching (§18) ────────────────────────────────────────────── */

function PageOverpatch({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('half', 'bottom');
  const flow = resolvePair(state);
  const goals = [{ label: 'OVERPATCH IT (patch the bottom)', hit: flow.destinationHears === 'patch' }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Two professional words for what you have been doing all along:</Lead>
      <Card tone="math">
        <Eyebrow>NORMAL PATH</Eyebrow>
        <Body>The connection the studio makes automatically — A → B with an empty bay.</Body>
        <Eyebrow>OVERPATCH</Eyebrow>
        <Body>A patch cord that CHANGES that normal path — C now feeds B instead of A.</Body>
      </Card>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="YOUR CABLE"
        bottomPatchLabel="SYNTH (SOURCE C)"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
        caption={
          flow.destinationHears === 'patch'
            ? 'OVERPATCHED — C feeds B; the normal path is on hold until the cord comes out.'
            : 'The NORMAL PATH — A feeds B automatically. Now overpatch: put source C into the BOTTOM jack.'
        }
      />
      <GoalChips goals={goals} latched={latched} />
      <Body>
        In a larger studio you will hear it exactly like this: “the tape returns are NORMALLED to the monitor path — OVERPATCH
        line 3 if you need the drum machine.” You now speak the language.
      </Body>
    </View>
  );
}

/* ── 17 · The processor chain + bypass (§19) ────────────────────────────── */

function PageProcessorChain({ ctx }: { ctx: PageCtx }) {
  const [inserted, setInserted] = useState(false);
  const [serviceSolved, setServiceSolved] = useState(false);
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
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        The classic patch every engineer learns first: put an outboard compressor INTO an existing path — then take it out
        again without re-wiring anything. TWO cables make the chain: ① SEND and ② RETURN — follow their numbers through both
        diagrams.
      </Lead>
      <PatchPairView
        state={vocalState}
        sourceLabel="VOCAL OUT"
        destLabel="CONSOLE IN 2"
        topPatchLabel="① SEND ▸ COMP IN"
        bottomPatchLabel="② RETURN ◂ COMP OUT"
        reduceMotion={ctx.reduceMotion}
        hideFaceplate
        caption={
          inserted
            ? 'The vocal leaves on ① SEND (top tap), and the processed signal returns on ② RETURN (bottom — breaking the normal).'
            : 'BYPASSED — no cords: the vocal rides its normal straight to the console.'
        }
      />
      <Row>
        <Btn label={inserted ? '⏏ BYPASS PROCESSOR' : '● INSERT COMPRESSOR'} tone="primary" onPress={() => setInserted((v) => !v)} />
      </Row>
      <PatchPairView
        state={compState}
        sourceLabel="COMPRESSOR OUT"
        destLabel="COMPRESSOR IN"
        topPatchLabel="② RETURN ▸ CONSOLE IN 2"
        bottomPatchLabel="① SEND ◂ VOCAL OUT"
        reduceMotion={ctx.reduceMotion}
        hideFaceplate
        sourceLive={inserted}
        caption={
          inserted
            ? 'The THRU processor pair, cabled in: ① feeds COMP IN below; COMP OUT rides ② back to the console.'
            : 'The processor pair at rest: THRU, nothing connected, its output idle — the compressor waits until it is invited.'
        }
      />
      <GoalChips goals={goals} latched={latched} />
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
    </View>
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
  { title: 'From one pair to a whole bay', short: 'BAY', Component: PageStudioBay, manualDone: true },
  { title: 'The studio works with no cables', short: 'ZERO', Component: PageZeroCables, manualDone: true },
  { title: 'Overpatching', short: 'OVER', Component: PageOverpatch, manualDone: true },
  { title: 'The processor chain', short: 'CHAIN', Component: PageProcessorChain, manualDone: true },
  { title: 'What’s wrong with this patch?', short: 'FIX-IT', Component: PageWrongPatch, manualDone: true },
];

const local = StyleSheet.create({
  big: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, lineHeight: 22, letterSpacing: 0.4 },
});
