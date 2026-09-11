/**
 * Patchbay Signal Flow & Normalling — pages 19–23 (Phase B): the directional
 * half-normal variant, the T/R/S conductor reveal, phantom-power safety,
 * design-your-own-bay, and the final proficiency assessment. ALL COPY NEW
 * (ratification pending; sheet: docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 *
 * Safety framing (§24, per Neutrik guidance): the phantom page teaches
 * "requires proper system design", never a blanket "never patch microphones" —
 * professional installations designed for mic patching exist.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row, useMarkWhen } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { PatchPairView } from './art/PatchPairView';
import { JackCutaway } from './art/JackCutaway';
import { resolvePair, type PairKind } from './engine/patchbay';
import { ASSESSMENT_ITEMS, DESIGN_ROWS } from './engine/scenariosB';
import { GoalChips, MantraCard, useStationState, useVisitGoals } from './bits';

/* ── 19 · Half-normal is directional (§22) ──────────────────────────────── */

function PageDirectional({ ctx }: { ctx: PageCtx }) {
  const { state, toggle } = useStationState('half', 'top');
  const flow = resolvePair(state);
  const goals = [
    { label: 'BREAK IT FROM THE TOP', hit: state.topPlugged && flow.normalBroken },
    { label: 'SEE THE PARALLEL (bottom on this bay)', hit: flow.isMerge },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        A professional caution: “half-normal” does not by itself say WHICH side breaks. The bay below is a genuine
        half-normalled-TOP design — everything you learned, mirrored.
      </Lead>
      <PatchPairView
        state={state}
        sourceLabel="TAPE OUT 1"
        destLabel="CONSOLE TAPE RTN 1"
        topPatchLabel="YOUR CABLE"
        bottomPatchLabel="ALT SOURCE"
        onToggleJack={toggle}
        reduceMotion={ctx.reduceMotion}
        caption={
          flow.isMerge
            ? 'PARALLEL — on a top-breaking bay the bottom does NOT break: two feeds arrive at once. One reason the common bay breaks on the bottom instead.'
            : 'This bay breaks on the TOP. Try both jacks and compare against the common bay you know.'
        }
      />
      <GoalChips goals={goals} latched={latched} />
      <Card tone="warn">
        <Eyebrow>THE RULE THAT TRAVELS</Eyebrow>
        <Body>
          The common arrangement is top = tap, bottom = break — but manufacturers document both. Never treat the simplified
          rule as electrical law: on an unfamiliar bay, VERIFY the configuration (label, manual, or a quick detective test
          like page twelve) before a session depends on it.
        </Body>
      </Card>
    </View>
  );
}

/* ── 20 · Inside the cord: T/R/S (§23) ──────────────────────────────────── */

function PageConductors({ ctx }: { ctx: PageCtx }) {
  const [insertion, setInsertion] = useState(0.9);
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        One more layer of honesty. Every “one line” in this lab has really been THREE conductors — a balanced audio circuit.
        The plug you have been driving carries them as its metal bands.
      </Lead>
      <JackCutaway insertion={insertion} reduceMotion={ctx.reduceMotion} showConductors />
      <ControlSlider label="PLUG INSERTION" value={insertion} min={0} max={1} step={0.01} onChange={setInsertion} format={(v) => `${Math.round(v * 100)}%`} />
      <Card>
        <Eyebrow>T · R · S</Eyebrow>
        <Body>
          TIP and RING carry the balanced signal pair; SLEEVE is the shield/ground. A TT (bantam) plug packs the same three
          into a smaller frame. The switching contacts you watched exist for the SIGNAL conductors — tip and ring — inside
          real bays; the sleeve is typically bussed straight through, not switched.
        </Body>
      </Card>
      <UnderstandingCheck
        question="When this lab drew “one line” for a signal, what was that line really representing?"
        options={[
          'One complete balanced circuit — tip, ring and sleeve together',
          'Just the tip conductor',
          'The mains power feed for the device',
        ]}
        correct={0}
        explain="One line = one balanced audio circuit. The simplification kept the routing readable; the metal underneath was always T/R/S."
        wrong={[
          undefined,
          'The tip alone is half of the balanced pair — the drawn line stood for the whole circuit.',
          'Mains never runs through an audio patchbay. The line was the audio circuit.',
        ]}
        onCorrect={() => {
          if (!ctx.isDone) ctx.markDone();
        }}
      />
    </View>
  );
}

/* ── 21 · ⚠ Phantom power + patchbays (§24) ─────────────────────────────── */

function PagePhantom({ ctx }: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Card tone="warn">
        <Text style={local.warnTitle}>⚠ PHANTOM POWER + PATCHBAYS</Text>
        <Body>
          Microphone-level circuits carrying +48 V phantom are NOT ordinary line-level patching. Treat them with system-design
          respect:
        </Body>
        <Body>
          • Patching a LIVE phantom-powered circuit can create damaging transient connections as the plug slides across the
          contacts.{'\n'}
          • Different patchbay designs handle grounding differently — do not assume every TRS/TT bay is suitable.{'\n'}
          • Follow the patchbay manufacturer’s wiring instructions for microphone circuits.{'\n'}
          • Where a design requires it, turn phantom power OFF before patching or unpatching.{'\n'}
          • Dedicated microphone patching systems exist and follow their own practices.
        </Body>
      </Card>
      <Body>
        Note what this warning does NOT say: it does not say “never put microphones on a patchbay.” Professional installations
        are built to do exactly that — correctly. The lesson is that mic-level + phantom requires PROPER SYSTEM DESIGN, not
        improvisation. (Guidance per Neutrik’s patch-panel documentation.)
      </Body>
      <UnderstandingCheck
        question="Your bay’s manual says its design requires it: you need to re-patch a mic line that has phantom power on. The professional move?"
        options={[
          'Turn phantom off first, then re-patch',
          'Patch quickly so the transient is short',
          'It never matters — TRS bays are all phantom-safe',
        ]}
        correct={0}
        explain="Where the design calls for it, kill the phantom before the plug moves. A fast hand does not outrun a contact scraping 48 volts."
        wrong={[
          undefined,
          'Speed doesn’t remove the transient — the plug still drags across live contacts.',
          'Designs differ; that assumption is exactly what the manufacturer guidance warns against.',
        ]}
        onCorrect={() => {
          if (!ctx.isDone) ctx.markDone();
        }}
      />
    </View>
  );
}

/* ── 22 · Design your own bay (§25) ─────────────────────────────────────── */

const KIND_LABELS: { kind: PairKind; label: string }[] = [
  { kind: 'full', label: 'FULL-NORMAL' },
  { kind: 'half', label: 'HALF-NORMAL' },
  { kind: 'thru', label: 'THRU' },
];

function DesignRowCard({ row, onSettled }: { row: (typeof DESIGN_ROWS)[number]; onSettled: () => void }) {
  const [picked, setPicked] = useState<PairKind | null>(null);
  const [settled, setSettled] = useState(false);
  const verdict = picked ? row.verdicts[picked] : null;
  // Rows stay EXPLORABLE after settling (cognition pass 2026-09-10): the
  // multi-acceptable tradeoff notes are the content, so a learner who settled
  // on FULL must still be able to read what HALF would have bought them. The
  // completion latch fires once, on the first acceptable pick.
  const pick = (kind: PairKind) => {
    setPicked(kind);
    if (row.verdicts[kind].ok && !settled) {
      setSettled(true);
      onSettled();
    }
  };
  return (
    <Card tone={settled ? 'ok' : 'plain'}>
      <Eyebrow>{row.pair}</Eyebrow>
      <Body>{row.context}</Body>
      <Row>
        {KIND_LABELS.map(({ kind, label }) => (
          <Btn
            key={kind}
            label={picked === kind ? `▸ ${label}` : label}
            selected={picked === kind}
            tone={picked === kind && row.verdicts[kind].ok ? 'primary' : 'plain'}
            onPress={() => pick(kind)}
            a11y={`${label} for ${row.pair}`}
          />
        ))}
      </Row>
      {verdict ? (
        <Text style={[local.verdict, { color: verdict.ok ? colors.green : colors.orange }]} accessibilityLiveRegion="polite">
          {verdict.ok ? '✓ ' : '△ '}
          {verdict.note}
        </Text>
      ) : null}
    </Card>
  );
}

function PageDesign({ ctx }: { ctx: PageCtx }) {
  const [settledCount, setSettledCount] = useState(0);
  useMarkWhen(settledCount >= DESIGN_ROWS.length, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return (
    <View style={{ gap: 12 }}>
      <Lead>
        Now the chair turns around: YOU are wiring the bay. For each pair, choose a configuration and read the consequence —
        several rows accept more than one answer, with different tradeoffs. This is routing design, not terminology.
      </Lead>
      {DESIGN_ROWS.map((row) => (
        <DesignRowCard key={row.id} row={row} onSettled={() => setSettledCount((c) => c + 1)} />
      ))}
      <Body>
        {settledCount} of {DESIGN_ROWS.length} pairs settled. A △ note means your pick has a real cost for that job — read it,
        then choose again.
      </Body>
    </View>
  );
}

/* ── 23 · Final proficiency assessment (§26) ────────────────────────────── */

function PageAssessment({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const count = ASSESSMENT_ITEMS.filter((a) => solved[a.id]).length;
  const all = count >= ASSESSMENT_ITEMS.length;
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return (
    <View style={{ gap: 14 }}>
      <Lead>
        The proficiency check: ten working-studio scenarios, no definitions asked. Solve them all and the lab is yours.
      </Lead>
      {ASSESSMENT_ITEMS.map((a, i) => (
        <View key={a.id} style={{ gap: 8 }}>
          <UnderstandingCheck
            eyebrow={`${i + 1} OF ${ASSESSMENT_ITEMS.length} · ${a.eyebrow}`}
            question={a.question}
            options={a.options}
            correct={a.correct}
            explain={a.explain}
            wrong={a.wrong}
            onCorrect={() => setSolved((prev) => ({ ...prev, [a.id]: true }))}
          />
          {a.render && solved[a.id] ? (
            <PatchPairView
              state={a.render.state}
              sourceLabel={a.render.sourceLabel}
              destLabel={a.render.destLabel}
              topPatchLabel="YOUR CABLE"
              bottomPatchLabel="YOUR CABLE"
              reduceMotion={ctx.reduceMotion}
              hideFaceplate
              caption="Confirmed — read the path."
            />
          ) : null}
        </View>
      ))}
      {all ? (
        <Card tone="ok">
          <Eyebrow>LAB COMPLETE</Eyebrow>
          <Body>
            You can identify a configuration from behavior, predict both jacks, protect a live path, replace a source, spot a
            feedback trap, and design a bay from a workflow. That is the whole system — not the definitions.
          </Body>
        </Card>
      ) : (
        <Body>{count} of {ASSESSMENT_ITEMS.length} solved.</Body>
      )}
      <MantraCard />
    </View>
  );
}

export const PATCHBAY_PAGES_D: PageDef[] = [
  { title: 'Half-normal is directional', short: 'TOP-BRK', Component: PageDirectional, manualDone: true },
  { title: 'Inside the cord: T · R · S', short: 'TRS', Component: PageConductors, manualDone: true },
  { title: 'Phantom power + patchbays', short: '⚠48V', Component: PagePhantom, manualDone: true },
  { title: 'Design your own bay', short: 'DESIGN', Component: PageDesign, manualDone: true },
  { title: 'Final proficiency assessment', short: 'FINAL', Component: PageAssessment, manualDone: true },
];

const local = StyleSheet.create({
  warnTitle: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1 },
  verdict: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});
