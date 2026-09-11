/**
 * Patchbay Signal Flow & Normalling — pages 1–7 (Phase A, owner brief
 * 2026-09-10). Teaching order per the brief: direction → thru → what
 * "normal" means → the physical contact → full-normal's four states →
 * the half-normal surprise. ALL COPY NEW (ratification pending; sheet:
 * docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 *
 * Sources behind the teaching claims (cited in-app on the wrap page):
 * Neutrik patch-panel documentation (normalling definitions, half-normalled
 * top/bottom variants), Bittree (half-normal tap behavior), ART / Behringer
 * patchbay manuals (source-over-destination layout), Samson (Normal /
 * Half-Normal / Thru labeling).
 */
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Card, Eyebrow, Lead, Prompt } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { useRef, useState } from 'react';
import { PatchPairView } from './art/PatchPairView';
import { JackCutaway } from './art/JackCutaway';
import { contactsOpen, resolvePair } from './engine/patchbay';
import { GoalChips, MantraCard, useStationState, useVisitGoals } from './bits';

/* ── 1 · Signal falls downhill ──────────────────────────────────────────── */

function PageDirection(_: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        A patchbay puts every important input and output of the studio on one panel. Before any routing tricks, learn the one
        convention everything else stands on.
      </Lead>
      <Card>
        <Eyebrow>TOP ROW = SOURCES · OUTPUTS</Eyebrow>
        <Body>Console direct outs · mic preamp outs · interface outs · playback outs · processor outs. Signal LEAVES equipment here.</Body>
      </Card>
      <Card>
        <Eyebrow>BOTTOM ROW = DESTINATIONS · INPUTS</Eyebrow>
        <Body>Console inputs · interface inputs · recorder inputs · processor inputs · amplifier inputs. Signal ENTERS equipment here.</Body>
      </Card>
      <Card tone="math">
        <Text style={local.hill}>Signal falls downhill. Top → Bottom.</Text>
        <Body>
          Hold that picture for the whole lab. Every vertical pair of patch points asks the same four questions: What is the
          source? What is the destination? Where does the signal travel with no patch cord inserted? And exactly what changes
          when I plug into the top or bottom jack?
        </Body>
      </Card>
      <MantraCard />
    </View>
  );
}

/* ── 2 · One pair, two pictures ─────────────────────────────────────────── */

function PagePair({ ctx }: { ctx: PageCtx }) {
  // Deliberately a THRU pair (cognition pass 2026-09-10): the learner's first
  // touch must NOT show a normal — that reveal belongs to page 4, after thru
  // has established the problem normalling solves.
  const { state, toggle } = useStationState('thru');
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        This is ONE vertical pair — the smallest unit of any patchbay. You will always see it two ways at once: the physical
        front panel on top (your pair is the outlined column), and the signal path underneath. Learning to translate between
        them is the whole game.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="YOUR CABLE"
        bottomPatchLabel="YOUR CABLE"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
        caption="Marching dashes = signal flowing now. Dim dots = a possible path that is inactive. Gold = a patch cord."
      />
      <Prompt>Tap the TOP and BOTTOM jacks and just watch what changes — panel above, path below. No wrong moves here.</Prompt>
      <Body>
        The visual language you just read stays identical through the whole lab: it never changes meaning between pages.
      </Body>
    </View>
  );
}

/* ── 3 · Thru first: nothing is connected yet ───────────────────────────── */

function PageThru({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('thru');
  const flow = resolvePair(state);
  const routed = flow.destinationHears === 'patch' && state.topPlugged;
  const goals = [
    { label: 'SEE THE DEAD END (top only)', hit: state.topPlugged && !state.bottomPlugged },
    { label: 'COMPLETE THE ROUTE (both jacks)', hit: routed },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        We start with the simplest wiring: THRU. Top rear connects only to the top front. Bottom rear connects only to the
        bottom front. There is NO internal path between them.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        // The top cord's far-end label is honest about the dead end until the
        // route is actually completed (cognition pass 2026-09-10 — the picture
        // must never claim a connection the status denies).
        topPatchLabel={routed ? 'TO BOTTOM JACK' : 'FAR END NOT CONNECTED'}
        bottomPatchLabel={routed ? 'FROM TOP JACK' : 'YOUR CABLE'}
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
      />
      <GoalChips goals={goals} latched={latched} />
      <Prompt>
        First patch ONLY the top jack, and before reading the status line, answer for yourself: where does the console’s
        signal go now? Then patch the bottom too and connect the two by cable.
      </Prompt>
      <Body>
        A thru pair is honest and dumb: if the engineer does nothing, nothing is connected — a patch cord is the ONLY way from
        top to bottom. Remember that feeling; the next page changes it.
      </Body>
    </View>
  );
}

/* ── 4 · What “normal” means ────────────────────────────────────────────── */

function PageNormal({ ctx }: { ctx: PageCtx }) {
  const state = { config: 'full' as const, topPlugged: false, bottomPlugged: false };
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Same pair, one change inside: this bay is NORMALLED. Look — the signal is already flowing, and there is no patch cord
        anywhere.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        reduceMotion={ctx.reduceMotion}
        caption="NO PATCH CORD REQUIRED — the connection above is happening inside the bay."
      />
      <Card tone="math">
        <Text style={local.hill}>Normal means there is already a connection before you plug in a patch cable.</Text>
        <Body>
          A normal is the patchbay saying: “If the engineer does nothing, I will connect this source to this destination.” That
          idea matters more than any of the terminology.
        </Body>
      </Card>
      <UnderstandingCheck
        question="With NO patch cord inserted anywhere, where does this console output travel?"
        options={[
          'Nowhere — patch cords make every connection',
          'Down the internal normal, top to bottom, into Interface In 1',
          'To every destination on the patchbay at once',
          'Back into the console',
        ]}
        correct={1}
        explain="The internal normal contacts carry it top → bottom. The default route exists before any cord does."
        wrong={[
          'That was the THRU pair on the last page. A normalled pair ships with its default route already connected.',
          undefined,
          'A normal joins ONE vertical pair — this source to this destination, not the whole wall.',
          'Nothing reflects it backward — the normal carries it downhill to the destination below.',
        ]}
        onCorrect={() => {
          if (!ctx.isDone) ctx.markDone();
        }}
      />
    </View>
  );
}

/* ── 5 · The switching contact ──────────────────────────────────────────── */

function PageContact({ ctx }: { ctx: PageCtx }) {
  const [insertion, setInsertion] = useState(0);
  const open = contactsOpen(insertion);
  // "Restore" latches only after the learner has SEEN the break: a render-time
  // ref latch, same pattern as useVisitGoals (no setState during render).
  const wasOpenRef = useRef(false);
  if (open) wasOpenRef.current = true;
  const goals = [
    { label: 'BREAK THE NORMAL (insert fully)', hit: open },
    { label: 'RESTORE IT (pull the plug back out)', hit: wasOpenRef.current && !open },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Why does plugging in change the routing? Because a normal is not software. It is a spring contact — and the plug
        physically moves it. Drive the plug in slowly and watch the metal.
      </Lead>
      <JackCutaway insertion={insertion} reduceMotion={ctx.reduceMotion} />
      <ControlSlider label="PLUG INSERTION" value={insertion} min={0} max={1} step={0.01} onChange={setInsertion} format={(v) => `${Math.round(v * 100)}%`} />
      <GoalChips goals={goals} latched={latched} />
      <Body>
        At rest, the tip spring presses on the normal contact and the source flows to the destination. As the plug seats, its
        tip wedges under the spring and lifts it off — the normal is BROKEN, and the spring now touches the plug instead: the
        source rides your patch cord. It isn’t magic and it isn’t a menu setting. A switch opened.
      </Body>
    </View>
  );
}

/* ── 6 · Full-normal: the four states ───────────────────────────────────── */

function PageFullStates({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('full');
  const goals = [
    { label: 'A · NOTHING PATCHED', hit: !state.topPlugged && !state.bottomPlugged },
    { label: 'B · TOP ONLY', hit: state.topPlugged && !state.bottomPlugged },
    { label: 'C · BOTTOM ONLY', hit: !state.topPlugged && state.bottomPlugged },
    { label: 'D · BOTH', hit: state.topPlugged && state.bottomPlugged },
  ];
  const latched = useVisitGoals(ctx, goals);
  // The description of the CURRENT state rides the diagram itself, so each
  // visit reads its own card at the moment of the state (cognition pass
  // 2026-09-10 — the meaning must bind to the state, not sit in a skippable
  // paragraph below).
  const stateCaption =
    !state.topPlugged && !state.bottomPlugged
      ? 'A — the normal carries source → destination. No cords required.'
      : state.topPlugged && !state.bottomPlugged
        ? 'B — the top insertion broke the normal: the destination went silent, and the source rides your cord.'
        : !state.topPlugged && state.bottomPlugged
          ? 'C — the bottom insertion broke it the other way: your patch replaced the source, which now dead-ends at its jack.'
          : 'D — both patched: the pair no longer behaves as a pair. Two independent reroutes.';
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        FULL-NORMAL: inserting into EITHER front jack breaks the normal. From here on, the ✕ in the diagram marks exactly that
        — a normal that exists but is being held open by a plug. A full-normal pair has exactly four states — visit all four
        and read each one as you make it.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="ANALYZER"
        bottomPatchLabel="DRUM MACHINE"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
        caption={stateCaption}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 7 · Half-normal: the surprise ──────────────────────────────────────── */

function PageHalfSurprise({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('half', 'bottom');
  const flow = resolvePair(state);
  const [predicted, setPredicted] = useState(false);
  const goals = [
    { label: 'PREDICT IT (answer below)', hit: predicted },
    { label: 'THEN DO IT (patch the top)', hit: flow.isSplit },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Same untouched starting picture as full-normal: source flowing to destination through the normal. But this bay is
        HALF-NORMALLED. So — what’s different? Commit to a prediction before you touch anything.
      </Lead>
      <UnderstandingCheck
        eyebrow="PREDICT BEFORE PATCHING"
        question="You plug a cable into the TOP front jack of this half-normal pair. What happens to the destination?"
        options={[
          'It goes silent, exactly like full-normal',
          'It keeps receiving the source — and the cable gets a copy too',
          'It starts receiving the cable’s far end instead',
        ]}
        correct={1}
        explain="That is the half-normal difference: the TOP insertion does NOT break the normal. The top jack becomes a tap of the source."
        wrong={[
          'Reasonable guess — that is exactly what full-normal would do. Try the top jack below and watch the normal.',
          undefined,
          'Cables patched into the TOP carry signal OUT. It is the BOTTOM jack that feeds this destination from a cable.',
        ]}
        onCorrect={() => setPredicted(true)}
      />
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="ANALYZER"
        bottomPatchLabel="DRUM MACHINE"
        // The jacks stay INERT until the prediction is committed — the whole
        // point of predict-first is that the commitment precedes the evidence
        // (cognition pass 2026-09-10).
        onToggleJack={predicted ? toggle : undefined}
        reduceMotion={ctx.reduceMotion}
        caption={
          !predicted
            ? 'Commit to your prediction above first — then the jacks unlock.'
            : flow.isSplit
              ? 'The normal DID NOT break. One source, two destinations — this is the split.'
              : 'Jacks unlocked — now patch the TOP and watch the normal.'
        }
      />
      <GoalChips goals={goals} latched={latched} />
      {flow.isSplit ? (
        <>
          <Card tone="ok">
            <Body>
              There it is. The source still feeds its destination AND your cable. Where full-normal breaks, half-normal
              shares. The next pages show why that is so useful — and where half-normal still breaks.
            </Body>
          </Card>
          <MantraCard />
        </>
      ) : null}
    </View>
  );
}

export const PATCHBAY_PAGES_A: PageDef[] = [
  { title: 'Signal falls downhill', short: 'TOP↓BTM', Component: PageDirection },
  { title: 'One pair, two pictures', short: 'PAIR', Component: PagePair },
  { title: 'Thru: nothing is connected yet', short: 'THRU', Component: PageThru, manualDone: true },
  { title: 'What “normal” means', short: 'NORMAL', Component: PageNormal, manualDone: true },
  { title: 'The switching contact', short: 'CONTACT', Component: PageContact, manualDone: true },
  { title: 'Full-normal: the four states', short: 'FULL', Component: PageFullStates, manualDone: true },
  { title: 'Half-normal: the surprise', short: 'HALF', Component: PageHalfSurprise, manualDone: true },
];

const local = StyleSheet.create({
  // Amber, not gold: within this lab gold means exactly one thing — a patch
  // cord (design pass 2026-09-10).
  hill: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6, lineHeight: 22 },
});
