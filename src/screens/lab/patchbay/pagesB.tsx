/**
 * Patchbay Signal Flow & Normalling — pages 8–13 (Phase A). Why "half",
 * the tap in practice, the §12 comparison table, predict-before-patching,
 * detective mode, and the Phase A wrap. ALL COPY NEW (ratification pending;
 * sheet: docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Card, Eyebrow, Lead, Prompt, useMarkWhen } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { PatchPairView } from './art/PatchPairView';
import { resolvePair, type PairKind } from './engine/patchbay';
import { DETECTIVE_CASES, PREDICT_SCENARIOS, afterAction } from './engine/scenarios';
import { GoalChips, MantraCard, useStationState, useVisitGoals } from './bits';

/* ── 8 · Why it is called HALF-normal ───────────────────────────────────── */

function PageWhyHalf({ ctx }: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Lead>The name is a scoreboard of breaking behavior. Count the sides that break:</Lead>
      <Card tone="math">
        <Eyebrow>FULL-NORMAL</Eyebrow>
        <Text style={local.rule}>TOP INSERT — BREAKS · BOTTOM INSERT — BREAKS</Text>
        <Eyebrow>HALF-NORMAL (COMMON BAY)</Eyebrow>
        <Text style={local.rule}>TOP INSERT — DOES NOT BREAK · BOTTOM INSERT — BREAKS</Text>
      </Card>
      <Body>
        Only ONE side of the pair carries the breaking behavior — half of it. That is the whole name. The non-breaking top is
        what turns the top jack into a tap; the breaking bottom is what still lets you replace a destination’s source.
      </Body>
      <UnderstandingCheck
        question="On the common half-normal bay, which insertion breaks the normal?"
        options={['The top front jack', 'The bottom front jack', 'Both', 'Neither']}
        correct={1}
        explain="Bottom breaks; top taps. (Half-normal is directional — a later page returns to the rarer top-breaking variant, so always verify a bay rather than assume.)"
        wrong={[
          'Think back to the last page — you patched the TOP mid-flow. Did the destination lose its signal?',
          undefined,
          'Both breaking is full-normal. Half-normal keeps one side gentle.',
          'Neither breaking would leave no way to replace a destination’s source — one side still breaks.',
        ]}
        onCorrect={() => {
          if (!ctx.isDone) ctx.markDone();
        }}
      />
    </View>
  );
}

/* ── 9 · The tap in practice — and the side that still breaks ───────────── */

function PageTap({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('half', 'bottom');
  const flow = resolvePair(state);
  const goals = [
    { label: 'TAP THE MIX (top only — nothing interrupted)', hit: flow.isSplit },
    { label: 'REPLACE THE SOURCE (bottom — normal breaks)', hit: flow.destinationHears === 'patch' },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        The working scenario: Console Out 1 is recording into Interface In 1. Mid-take, you want to feed an analyzer WITHOUT
        touching the recording. On a half-normal bay, you just patch the top.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="ANALYZER"
        bottomPatchLabel="DRUM MACHINE"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
      />
      <GoalChips goals={goals} latched={latched} />
      <Card>
        <Eyebrow>WORDS YOU WILL HEAR FOR THE TOP-JACK TRICK</Eyebrow>
        <Body>tap · mult · split · monitor · parallel feed — all describing the same move: a copy of the source taken without interrupting its normal destination.</Body>
      </Card>
      <Prompt>
        Now pull the top cord and instead patch the DRUM MACHINE into the BOTTOM. Before you look at the readout, answer for
        yourself: what just happened to the console’s signal? Then check the status line under the diagram against your answer.
      </Prompt>
    </View>
  );
}

/* ── 10 · The comparison table (§12 — reachable any time) ───────────────── */

const TABLE_ROWS: { action: string; full: string; half: string; thru: string }[] = [
  { action: 'No front cables', full: 'Top → Bottom', half: 'Top → Bottom', thru: 'No vertical connection' },
  { action: 'Plug into TOP', full: 'Breaks normal', half: 'Normal remains (tap)', thru: 'Source out to your cable only' },
  { action: 'Plug into BOTTOM', full: 'Breaks normal', half: 'Breaks normal', thru: 'Bottom receives patch' },
  { action: 'Tap source without interrupting?', full: 'No', half: 'Yes', thru: 'No automatic path' },
  { action: 'Default connection exists?', full: 'Yes', half: 'Yes', thru: 'No' },
];

function PageCompare({ ctx }: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Lead>Everything so far, on one card. This page stays in the page list — jump back to it from anywhere in the lab.</Lead>
      <View style={local.table} accessibilityRole="summary">
        <View style={[local.tr, local.trHead]}>
          <Text style={[local.td, local.tdAction, local.th]}>ACTION</Text>
          <Text style={[local.td, local.th]}>FULL</Text>
          <Text style={[local.td, local.th]}>HALF (COMMON)</Text>
          <Text style={[local.td, local.th]}>THRU</Text>
        </View>
        {TABLE_ROWS.map((r) => (
          <View key={r.action} style={local.tr}>
            <Text style={[local.td, local.tdAction]}>{r.action}</Text>
            <Text style={local.td}>{r.full}</Text>
            <Text style={local.td}>{r.half}</Text>
            <Text style={local.td}>{r.thru}</Text>
          </View>
        ))}
      </View>
      <Body>
        “Half” here is the COMMON arrangement — top taps, bottom breaks. Rarer bays break on the TOP instead, so on an
        unfamiliar bay, verify before you trust the rule. (Also heard for thru: “through”, “non-normalled”.)
      </Body>
      <UnderstandingCheck
        question="You need to feed a tuner a copy of a source WITHOUT interrupting where that source already goes. Which configuration does this without rewiring anything else?"
        options={['Full-normal', 'Half-normal', 'Thru']}
        correct={1}
        explain="Half-normal’s non-breaking top is the tap. Full-normal would cut the destination; thru had no default route to preserve in the first place."
        wrong={[
          'Patch a full-normal top and the destination goes silent — the opposite of “without interrupting”.',
          undefined,
          'On thru there is no existing route to tap — you would be building both paths by hand.',
        ]}
        onCorrect={() => {
          if (!ctx.isDone) ctx.markDone();
        }}
      />
      <MantraCard />
    </View>
  );
}

/* ── 11 · Predict before patching (§14) ─────────────────────────────────── */

function PagePredict({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const all = PREDICT_SCENARIOS.every((s) => solved[s.id]);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return (
    <View style={{ gap: 14 }}>
      <Lead>
        Working engineers predict, then patch. Four situations — commit to an answer first; the pair animates the truth after
        you get it right.
      </Lead>
      {PREDICT_SCENARIOS.map((s, i) => (
        <View key={s.id} style={{ gap: 8 }}>
          <UnderstandingCheck
            eyebrow={`PREDICT ${i + 1} OF ${PREDICT_SCENARIOS.length}`}
            question={s.question}
            options={s.options}
            correct={s.correct}
            explain={s.explain}
            wrong={s.wrong}
            onCorrect={() => setSolved((prev) => ({ ...prev, [s.id]: true }))}
          />
          {solved[s.id] ? (
            <PatchPairView
              state={afterAction(s)}
              sourceLabel={s.sourceLabel}
              destLabel={s.destLabel}
              topPatchLabel="YOUR CABLE"
              bottomPatchLabel="YOUR CABLE"
              reduceMotion={ctx.reduceMotion}
              hideFaceplate
              caption="Here is why — read the path."
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/* ── 12 · Patchbay detective (§15) ──────────────────────────────────────── */

const KIND_OPTIONS: { label: string; kind: PairKind }[] = [
  { label: 'Full-normal', kind: 'full' },
  { label: 'Half-normal', kind: 'half' },
  { label: 'Thru', kind: 'thru' },
];

function PageDetective({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const all = DETECTIVE_CASES.every((c) => solved[c.id]);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return (
    <View style={{ gap: 14 }}>
      <Lead>
        Now diagnose bays nobody labeled for you — this is real studio detective work. Read each test result, then accuse a
        configuration.
      </Lead>
      {DETECTIVE_CASES.map((c, i) => (
        <View key={c.id} style={{ gap: 8 }}>
          <Card>
            <Eyebrow>{`CASE ${i + 1} OF ${DETECTIVE_CASES.length}`}</Eyebrow>
            <Body>{c.intro}</Body>
            {c.probes.map((p) => (
              <Text key={p.prose} style={local.probe}>
                ▸ {p.prose}
              </Text>
            ))}
          </Card>
          <UnderstandingCheck
            eyebrow="YOUR VERDICT"
            question={c.question}
            options={KIND_OPTIONS.map((o) => o.label)}
            correct={KIND_OPTIONS.findIndex((o) => o.kind === c.answer)}
            explain={c.explain}
            // Probe-citing feedback keeps a wrong accusation as DEDUCTION, not
            // dictation — the full explanation appears only on the right verdict.
            wrong={c.wrong}
            onCorrect={() => setSolved((prev) => ({ ...prev, [c.id]: true }))}
          />
        </View>
      ))}
    </View>
  );
}

/* ── 13 · The four questions, answered — and what Phase B adds ──────────── */

function PageWrap(_: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Lead>You can now stand in front of any vertical pair and answer the four questions this lab opened with:</Lead>
      <Card tone="ok">
        <Body>
          1 · What is the source? The device on the TOP jack’s rear.{'\n'}
          2 · What is the destination? The device on the BOTTOM jack’s rear.{'\n'}
          3 · Where does the signal travel with no cord? Down the normal — if this bay has one.{'\n'}
          4 · What changes when I plug in? Full: either jack breaks it. Half: the top taps, the bottom breaks — on the common
          bay; rarer bays break on top, so verify. Thru: cords are the only connections there are.
        </Body>
      </Card>
      <MantraCard />
      <Card>
        <Eyebrow>SOURCES BEHIND THIS LAB</Eyebrow>
        <Body>
          Normalling definitions and the half-normalled top/bottom variants: Neutrik patch-panel documentation. Tap/mult
          behavior: Bittree. Source-above / destination-below layout: ART and Behringer patchbay manuals. Normal / Half-Normal
          / Thru labeling: Samson.
        </Body>
      </Card>
      <Card>
        <Eyebrow>COMING IN PART TWO</Eyebrow>
        <Body>
          A full 8-pair studio bay to route · why a well-normalled studio runs with ZERO front cables · overpatching · the
          processor insert-and-bypass chain · broken-patch troubleshooting · the X-ray jack at every insertion depth · the
          top-breaking half-normal variant · phantom-power safety · and designing your own bay.
        </Body>
      </Card>
    </View>
  );
}

export const PATCHBAY_PAGES_B: PageDef[] = [
  { title: 'Why it is called HALF-normal', short: 'WHY½', Component: PageWhyHalf, manualDone: true },
  { title: 'The tap — and the side that breaks', short: 'TAP', Component: PageTap, manualDone: true },
  { title: 'Full vs Half vs Thru — the table', short: 'TABLE', Component: PageCompare, manualDone: true },
  { title: 'Predict before patching', short: 'PREDICT', Component: PagePredict, manualDone: true },
  { title: 'Patchbay detective', short: 'DETECT', Component: PageDetective, manualDone: true },
  { title: 'The four questions, answered', short: 'WRAP', Component: PageWrap },
];

const local = StyleSheet.create({
  rule: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 19 },
  table: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', overflow: 'hidden' },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.hairlineDim },
  trHead: { borderTopWidth: 0, backgroundColor: '#15161a' },
  th: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1 },
  td: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 15, paddingVertical: 8, paddingHorizontal: 6 },
  tdAction: { flex: 1.35, color: colors.textPrimary, fontFamily: fonts.barlowMedium },
  probe: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});
