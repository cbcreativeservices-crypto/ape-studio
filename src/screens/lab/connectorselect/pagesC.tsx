/**
 * Audio Connectors & Cable Selection Lab — pages 9–12.
 * P9–P11 Station 5: build the system (12 scenarios, 4 per page). Cable
 *   choices are tap-to-patch (house rule: no drag gestures fighting the
 *   scroll view); every wrong choice explains its ACTUAL problem through
 *   the four-question verdict.
 * P12 Station 6: the cable tester — how continuity reads (+ first faults).
 */
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, useStableShuffle } from '../tuning/components/primitives';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { ConnectorPhoto, GoalChips, StationTag, useVisitGoals, VerdictRows } from './bits';
import { Lamp } from './art';
import { SCENARIOS, type Scenario } from './data/scenarios';
import { getConnector } from '../cable/data/registry';
import { evaluateChoice, type Verdict } from './engine/evaluate';
import { CABLE_CONTACTS, CABLE_CONTACTS_SHORT, FAULTS, lampFor, type FaultCase } from './engine/tester';

/* ── scenario card ───────────────────────────────────────────────────────── */

function ScenarioCard({ s, onSolved }: { s: Scenario; onSolved: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const { shuffled } = useStableShuffle(s.choices, s.id);
  const verdict: Verdict | null = useMemo(() => {
    const c = s.choices.find((x) => x.id === picked);
    return c ? evaluateChoice(c) : null;
  }, [picked, s.choices]);
  const pick = (id: string) => {
    setPicked(id);
    const c = s.choices.find((x) => x.id === id)!;
    const v = evaluateChoice(c);
    if (v.overall && !solved) {
      setSolved(true);
      onSolved();
    }
    AccessibilityInfo.announceForAccessibility?.(`${v.overall ? 'Correct cable.' : v.label}. ${v.explain}`);
  };
  return (
    <Card>
      <Eyebrow>{solved ? `✓ ${s.title.toUpperCase()}` : s.title.toUpperCase()}</Eyebrow>
      <Body>{s.brief}</Body>
      <View style={styles.portRow} accessible accessibilityLabel={`From ${s.from.device}, ${s.from.port}, to ${s.to.device}, ${s.to.port}.`}>
        <View style={styles.port}>
          <Text style={styles.portDevice}>{s.from.device}</Text>
          <Text style={styles.portName}>{s.from.port}</Text>
        </View>
        <Text style={styles.portArrow}>→</Text>
        <View style={styles.port}>
          <Text style={styles.portDevice}>{s.to.device}</Text>
          <Text style={styles.portName}>{s.to.port}</Text>
        </View>
      </View>
      <Prompt>Pick the cable from the tray:</Prompt>
      {shuffled.map((c) => (
        <View key={c.id} style={{ gap: 4 }}>
          <Btn
            label={c.name}
            tone={picked === c.id ? (c.verdict === 'correct' ? 'primary' : 'danger') : 'plain'}
            selected={picked === c.id}
            onPress={() => pick(c.id)}
            a11y={`Cable: ${c.name}`}
          />
          {picked === c.id ? (
            <View style={styles.trayEnds}>
              <ConnectorPhoto id={c.a} size={44} single name={getConnector(c.a)?.displayName} />
              <Text style={styles.trayLine} accessibilityElementsHidden importantForAccessibility="no">———</Text>
              <ConnectorPhoto id={c.b} size={44} single name={getConnector(c.b)?.displayName} />
            </View>
          ) : null}
        </View>
      ))}
      {verdict ? <VerdictRows verdict={verdict} /> : null}
      {solved && s.note ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{s.note}</Text>
        </View>
      ) : null}
    </Card>
  );
}

function makeScenarioPage(title: string, slice: readonly Scenario[], lead: string) {
  return function ScenarioPage({ ctx }: { ctx: PageCtx }) {
    const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
    const goals = [{ label: `Connect all ${slice.length} systems correctly`, hit: slice.every((s) => solved.has(s.id)) }];
    const latched = useVisitGoals(ctx, goals);
    return (
      <View style={{ gap: 10 }}>
        <StationTag>{title}</StationTag>
        <Lead>{lead}</Lead>
        {slice.map((s) => (
          <ScenarioCard key={s.id} s={s} onSolved={() => setSolved((prev) => new Set(prev).add(s.id))} />
        ))}
        <GoalChips goals={goals} latched={latched} />
      </View>
    );
  };
}

const PageBuildA = makeScenarioPage(
  'STATION 5 · BUILD THE SYSTEM — STAGE BASICS',
  SCENARIOS.slice(0, 4),
  'Real connections now. Every choice is judged by the four questions — and every wrong cable tells you exactly which question it failed.',
);
const PageBuildB = makeScenarioPage(
  'STATION 5 · BUILD THE SYSTEM — MONITORS & POWER',
  SCENARIOS.slice(4, 8),
  'Line level, speaker level, and the one connection in this lab that can destroy equipment. Choose like it is your rig.',
);
const PageBuildC = makeScenarioPage(
  'STATION 5 · BUILD THE SYSTEM — SOURCES & DATA',
  SCENARIOS.slice(8, 12),
  'Turntables, televisions, computers and a digital stagebox — the modern ends of the connector world.',
);

/* ── the tester rig (shared with page 13) ────────────────────────────────── */

export function TesterRig({ fault, onSolved, reduceMotion }: { fault: FaultCase; onSolved: () => void; reduceMotion?: boolean }) {
  const contacts = CABLE_CONTACTS[fault.kind];
  const shorts = CABLE_CONTACTS_SHORT[fault.kind];
  const [aSel, setASel] = useState<number | null>(null);
  const [bSel, setBSel] = useState<number | null>(null);
  const [wiggling, setWiggling] = useState(false);
  const [reseated, setReseated] = useState(false);
  const [inspected, setInspected] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [blink, setBlink] = useState(false);
  const [reads, setReads] = useState<ReadonlySet<string>>(new Set());
  const { shuffled, order } = useStableShuffle(fault.options, fault.id);
  const lamp = aSel != null && bSel != null ? lampFor(fault, aSel, bSel, wiggling, reseated) : null;
  const lampWord = lamp === 'lit' ? 'LIT' : lamp === 'flicker' ? 'FLICKERING' : lamp === 'dark' ? 'DARK' : '—';
  // Diagnosis unlocks only after real bench work — two pair readings plus a
  // visual inspection (cognition pass: with free guessing, tap-until-green
  // solved every fault without a single lamp reading).
  const canDiagnose = reads.size >= 2 && inspected;
  // The tester's entire feedback loop must reach VoiceOver too (design pass:
  // accessibilityLiveRegion is Android-only) — announce every lamp change.
  useEffect(() => {
    if (lamp != null && aSel != null && bSel != null) {
      setReads((prev) => new Set(prev).add(`${aSel}-${bSel}`));
      AccessibilityInfo.announceForAccessibility?.(`Lamp ${lampWord}: end A ${contacts[aSel]} to end B ${contacts[bSel]}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lamp, aSel, bSel]);
  // A flickering lamp genuinely flickers when motion is allowed; under
  // reduced motion it holds the dim state and the FLICKERING word carries it.
  useEffect(() => {
    if (lamp !== 'flicker' || reduceMotion) {
      setBlink(false);
      return;
    }
    const t = setInterval(() => setBlink((b) => !b), 320);
    return () => clearInterval(t);
  }, [lamp, reduceMotion]);
  const diagnose = (displayIdx: number) => {
    const original = order[displayIdx];
    setPicked(original);
    if (original === fault.correct && !solved) {
      setSolved(true);
      onSolved();
      AccessibilityInfo.announceForAccessibility?.(`Correct. ${fault.explain}`);
    } else if (original !== fault.correct) {
      AccessibilityInfo.announceForAccessibility?.('Not this fault — test more point pairs, flex the cable, or inspect the connector.');
    }
  };
  return (
    <Card>
      <Eyebrow>{solved ? '✓ DIAGNOSED' : 'ON THE BENCH'}</Eyebrow>
      <Body>{fault.handed}</Body>
      <Text style={styles.contactKey}>{contacts.map((c, i) => `${shorts[i]} = ${c}`).join('   ·   ')}</Text>
      <View style={styles.testerPanel}>
        <View style={styles.testerCol}>
          <Text style={styles.testerColLabel}>END A</Text>
          {contacts.map((c, i) => (
            <Btn key={c} label={shorts[i]} tone={aSel === i ? 'primary' : 'plain'} selected={aSel === i} onPress={() => setASel(i)} a11y={`End A test point ${c}`} />
          ))}
        </View>
        <View style={styles.testerMid}>
          <Lamp state={lamp ?? 'dark'} pulse={blink} />
          <Text style={[styles.lampWord, { color: lamp === 'lit' ? colors.green : lamp === 'flicker' ? colors.gold : colors.textMuted }]}>
            {aSel != null && bSel != null ? lampWord : 'PICK A + B'}
          </Text>
        </View>
        <View style={styles.testerCol}>
          <Text style={styles.testerColLabel}>END B</Text>
          {contacts.map((c, i) => (
            <Btn key={c} label={shorts[i]} tone={bSel === i ? 'primary' : 'plain'} selected={bSel === i} onPress={() => setBSel(i)} a11y={`End B test point ${c}`} />
          ))}
        </View>
      </View>
      <View style={styles.testerActions}>
        <Btn label={wiggling ? 'FLEXING…' : 'FLEX THE CABLE'} tone={wiggling ? 'primary' : 'plain'} selected={wiggling} onPress={() => setWiggling((w) => !w)} a11y={wiggling ? 'Stop flexing the cable' : 'Flex the cable while testing'} />
        <Btn label={inspected ? '✓ INSPECTED' : 'INSPECT'} tone={inspected ? 'primary' : 'plain'} selected={inspected} onPress={() => setInspected(true)} a11y="Inspect the connectors visually" />
        {/* RESEAT renders on EVERY rig (design pass: only showing it on the
            half-seated cable answered that fault by its mere presence). On a
            properly seated cable it is a harmless, truthful no-op. */}
        <Btn label={reseated ? '✓ RESEATED' : 'RESEAT PLUG'} tone={reseated ? 'primary' : 'plain'} selected={reseated} onPress={() => setReseated(true)} a11y="Push the connector fully home" />
      </View>
      {inspected ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{fault.inspect}</Text>
        </View>
      ) : null}
      <Prompt>Diagnosis:</Prompt>
      {!canDiagnose ? (
        <Text style={styles.gateText}>LOCKED — read at least two point pairs and INSPECT before diagnosing. A tech tests before deciding.</Text>
      ) : null}
      {shuffled.map((opt, i) => {
        const original = order[i];
        const isPicked = picked === original;
        const right = isPicked && original === fault.correct;
        return (
          <Btn key={opt} label={opt} tone={isPicked ? (right ? 'primary' : 'danger') : 'plain'} selected={isPicked} disabled={!canDiagnose} onPress={() => diagnose(i)} a11y={canDiagnose ? opt : `${opt} — locked until you test two pairs and inspect`} />
        );
      })}
      {solved ? <Text style={styles.solvedText}>✓ {fault.explain}</Text> : picked != null ? <Text style={styles.wrongText}>Not this fault. Test more pairs — and remember FLEX and INSPECT.</Text> : null}
    </Card>
  );
}

function PageTester({ ctx }: { ctx: PageCtx }) {
  const queue = FAULTS.slice(0, 4);
  const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
  const goals = [{ label: 'Diagnose all 4 cables', hit: queue.every((f) => solved.has(f.id)) }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 6 · THE CABLE TESTER</StationTag>
      <Lead>A continuity tester answers one question: does a path exist between THIS point and THAT point? Pick a contact on each end; the lamp answers. A healthy cable lights every straight-through pair — 1→1, 2→2, 3→3 — and nothing else.</Lead>
      <Card tone="note">
        <Body>Three habits separate a tech from a guesser: test EVERY pair (not just the straight ones), FLEX the cable at the strain reliefs while watching, and INSPECT before you cut anything open.</Body>
      </Card>
      {queue.map((f) => (
        <TesterRig key={f.id} fault={f} onSolved={() => setSolved((prev) => new Set(prev).add(f.id))} reduceMotion={ctx.reduceMotion} />
      ))}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const CONNECTOR_PAGES_C: PageDef[] = [
  { title: 'Build the system: stage basics', short: 'Build 1', Component: PageBuildA, manualDone: true },
  { title: 'Build the system: monitors & power', short: 'Build 2', Component: PageBuildB, manualDone: true },
  { title: 'Build the system: sources & data', short: 'Build 3', Component: PageBuildC, manualDone: true },
  { title: 'The cable tester', short: 'Tester', Component: PageTester, manualDone: true },
];

const styles = StyleSheet.create({
  portRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  port: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#141416', padding: 8, gap: 2 },
  portDevice: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6 },
  portName: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  portArrow: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 16 },
  trayEnds: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  trayLine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  noteBox: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.06)', padding: 9 },
  noteText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  contactKey: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5 },
  testerPanel: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  testerCol: { flex: 1, gap: 6 },
  testerColLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5, textAlign: 'center' },
  testerMid: { width: 76, alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 22 },
  lampWord: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1, textAlign: 'center' },
  testerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gateText: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
  solvedText: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18 },
  wrongText: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
});
