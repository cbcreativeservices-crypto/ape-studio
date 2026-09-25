/**
 * Sound Systems Lab — TROUBLESHOOT mode: the bench.
 *
 * Page 1 explains the bench. Pages 2–6 each hold one fault group. Inside a
 * case the learner PROBES stations on the system map (each probe reveals
 * that station's reading from the fault library, as a short readout under
 * the station and a card beside it), then names the fault. The grade records
 * whether the diagnosis was right AND whether the walk was source-forward —
 * both come from features/soundsystems/faults.ts, which also says where the
 * symptom leaves doubt (`startAt`): the walk starts THERE, not always at the
 * microphone.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { FAULT_GROUPS, faultsInGroup, gradeAttempt, stationLabelFor, type FaultCase, type FaultGroup, type Reading } from '../../../features/soundsystems/faults';
import { markFaultSolved, useSoundSystemsProgress } from '../../../features/soundsystems/progress';
import { STATION_LABEL, STATION_ORDER, type Station } from '../../../features/soundsystems/types';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, useVisitGoals, VerdictLine } from './bits';
import { benchMap, ReadingKey, SystemMap, type MapNode, type MapState } from './art/SystemMap';
import { Orient } from './art/diagrams';

export function stateOf(r: Reading): MapState {
  if (r.flags && r.flags.length) return r.signal === 'clip' ? 'clip' : r.signal === 'hot' ? 'hot' : 'flag';
  return r.signal === 'ok' ? 'ok' : r.signal === 'none' ? 'none' : r.signal === 'low' ? 'flag' : r.signal === 'hot' ? 'hot' : 'clip';
}

/** The short readout printed under a probed station. */
export function readoutOf(r: Reading): string {
  const flag = r.flags?.[0];
  const sig = r.signal === 'ok' ? 'OK' : r.signal === 'none' ? 'NO SIGNAL' : r.signal === 'low' ? 'LOW' : r.signal === 'hot' ? 'HOT' : 'CLIP';
  return flag ? `${sig} · ${flag.toUpperCase()}` : sig;
}

/* ── one case on the bench ──────────────────────────────────────────────── */

function Bench({ c, onSolved, onClose, solvedBefore }: { c: FaultCase; onSolved: (forward: boolean) => void; onClose: () => void; solvedBefore: boolean }) {
  const [probes, setProbes] = useState<Station[]>([]);
  const [last, setLast] = useState<Station | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const options = useMemo(() => {
    const idx = c.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, [c.id]);
  const grade = pick == null ? null : gradeAttempt(c, probes, pick);
  const solved = !!grade?.correct;
  useEffect(() => {
    if (solved) onSolved(grade!.forward);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);
  const base = useMemo(() => benchMap(c.labels ?? {}, c.kinds ?? {}), [c]);
  const nodes: MapNode[] = base.nodes.map((n) => {
    const s = n.id as Station;
    const r = c.reads[s];
    const probed = probes.includes(s);
    return { ...n, state: probed ? stateOf(r) : 'unknown', value: probed ? readoutOf(r) : undefined };
  });
  const backwards = probes.length > 1 && STATION_ORDER.indexOf(probes[probes.length - 1]) < STATION_ORDER.indexOf(probes[probes.length - 2]);
  const reading = last ? c.reads[last] : null;
  const label = (s: Station) => stationLabelFor(c, s, STATION_LABEL[s]);
  return (
    <View style={{ gap: 10 }}>
      <Card tone="math">
        <Eyebrow>{c.title.toUpperCase()}{solvedBefore ? ' · SOLVED BEFORE' : ''}</Eyebrow>
        <Text style={styles.symptom}>{c.symptom}</Text>
        <Body>{c.setup}</Body>
      </Card>
      <SystemMap
        nodes={nodes}
        edges={base.edges}
        running={false}
        onTap={(id) => {
          const s = id as Station;
          setProbes((p) => [...p, s]);
          setLast(s);
        }}
        selectedId={last ?? c.startAt}
        a11y={`The nine stations. ${probes.length} probed. The symptom clears everything before ${label(c.startAt)}. Tap a station to read it.`}
      />
      <ReadingKey />
      <Prompt>{probes.length === 0 ? `The symptom clears everything before ${label(c.startAt).toUpperCase()}. Start there and walk forward.` : 'Keep walking forward until the reading changes — then name the fault.'}</Prompt>
      {backwards ? <VerdictLine ok={false} warn>You jumped backward. The bench still records the answer, but not as a forward walk.</VerdictLine> : null}
      {reading && last ? (
        <Card tone={stateOf(reading) === 'ok' ? 'ok' : 'warn'}>
          <Eyebrow>{label(last).toUpperCase()} · {readoutOf(reading)}</Eyebrow>
          <Body>{reading.note}</Body>
        </Card>
      ) : null}
      <Card>
        <Eyebrow>NAME THE FAULT</Eyebrow>
        {options.map((i) => {
          const o = c.options[i];
          const isPick = pick === i;
          const right = isPick && i === c.correct;
          const wrong = isPick && i !== c.correct;
          return (
            <Pressable key={i} disabled={solved} onPress={() => setPick(i)} style={[styles.opt, right && styles.optRight, wrong && styles.optWrong]} accessibilityRole="button" accessibilityState={{ selected: isPick, disabled: solved }} aria-pressed={isPick} aria-disabled={solved} accessibilityLabel={o}>
              <Text style={[styles.optText, right && { color: colors.green }, wrong && { color: colors.red }]}>{o}</Text>
            </Pressable>
          );
        })}
      </Card>
      {grade && !grade.correct ? (
        <VerdictLine ok={false}>Not this one. {grade.sawFault ? 'You have already read the station that changed — look at that reading again.' : 'You have not yet read the station where the reading changes. Keep walking forward.'}</VerdictLine>
      ) : null}
      {grade && grade.correct ? (
        <View style={{ gap: 8 }}>
          <VerdictLine ok>
            Correct{grade.forward ? ' — and a source-forward walk' : ' — but not a forward walk'}. {grade.probes} probe{grade.probes === 1 ? '' : 's'}; a disciplined walk from {label(c.startAt)} needs {grade.minimal}.
          </VerdictLine>
          <Card tone="ok">
            <Eyebrow>WHY</Eyebrow>
            <Body>{c.explain}</Body>
            <Eyebrow>THE FIX</Eyebrow>
            <Body>{c.fix}</Body>
            <Eyebrow>THE WALK</Eyebrow>
            <Body>{c.forward}</Body>
          </Card>
          <Btn label="BACK TO THE BENCH ›" tone="primary" onPress={onClose} a11y="Back to the list of faults" />
        </View>
      ) : (
        <Row>
          <Btn label="‹ BACK TO THE BENCH" onPress={onClose} a11y="Back to the list of faults" />
          {probes.length ? <Btn label="RESET PROBES" tone="danger" onPress={() => { setProbes([]); setLast(null); setPick(null); }} a11y="Reset the probes" /> : null}
        </Row>
      )}
    </View>
  );
}

/* ── a group page ───────────────────────────────────────────────────────── */

function GroupPage({ group, ctx }: { group: FaultGroup; ctx: PageCtx }) {
  const g = FAULT_GROUPS.find((x) => x.id === group)!;
  const cases = faultsInGroup(group);
  const progress = useSoundSystemsProgress();
  const [open, setOpen] = useState<string | null>(null);
  const solvedHere = cases.filter((c) => progress.faults.includes(c.id)).length;
  const forwardHere = cases.filter((c) => progress.forward.includes(c.id)).length;
  const goals = [{ label: `Solve all ${cases.length} faults`, hit: solvedHere >= cases.length }, { label: 'Solve at least one with a source-forward walk', hit: forwardHere >= 1 }];
  const latched = useVisitGoals(ctx, goals);
  const c = open ? cases.find((x) => x.id === open) : undefined;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={14}>{`THE BENCH · ${g.title.toUpperCase()}`}</ChapterTag>
      {c ? (
        <Bench key={c.id} c={c} solvedBefore={progress.faults.includes(c.id)} onSolved={(fwd) => markFaultSolved(c.id, fwd)} onClose={() => setOpen(null)} />
      ) : (
        <>
          <Lead>{g.blurb}</Lead>
          <GoalChips goals={goals} latched={latched} />
          {cases.map((f) => {
            const done = progress.faults.includes(f.id);
            const fwd = progress.forward.includes(f.id);
            return (
              <Pressable key={f.id} onPress={() => setOpen(f.id)} style={[styles.case, done && styles.caseDone]} accessibilityRole="button" accessibilityLabel={`${f.title}${done ? `, solved${fwd ? ' with a forward walk' : ''}` : ''}. ${f.symptom}`}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.caseTitle, done && { color: colors.textPrimary }]}>{done ? (fwd ? '✓✓ ' : '✓ ') : '○ '}{f.title}</Text>
                  <Text style={styles.caseSymptom}>{f.symptom}</Text>
                </View>
                <Text style={styles.caseGo}>›</Text>
              </Pressable>
            );
          })}
          <Body>{solvedHere} of {cases.length} solved · {forwardHere} with a forward walk (✓✓).</Body>
        </>
      )}
    </View>
  );
}

/* ── page 1 · how the bench works ───────────────────────────────────────── */

function PageBenchIntro({ ctx }: { ctx: PageCtx }) {
  useEffect(() => {
    if (!ctx.isDone) ctx.markDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const progress = useSoundSystemsProgress();
  const demo = useMemo(() => benchMap({}, {}), []);
  const nodes: MapNode[] = demo.nodes.map((n) => {
    const i = STATION_ORDER.indexOf(n.id as Station);
    return { ...n, state: i < 3 ? 'unknown' : i < 5 ? 'ok' : i === 5 ? 'none' : 'unknown', value: i === 3 ? 'OK' : i === 4 ? 'OK' : i === 5 ? 'NO SIGNAL' : undefined };
  });
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={14}>TESTING AND TROUBLESHOOTING · THE BENCH</ChapterTag>
      <Orient>How a case reads: the symptom cleared the first three stations, so the walk started at the console input — healthy, healthy — and stopped at the processor, which reads NO SIGNAL. That station is the answer.</Orient>
      <SystemMap nodes={nodes} edges={demo.edges.map((e) => ({ ...e, dead: STATION_ORDER.indexOf(e.to as Station) > 5 }))} running={false} a11y="An example walk: console in and console out read healthy, the processor reads no signal, everything after it is unlit." />
      <ReadingKey />
      <Lead>
        Twenty-two faults from real shows, in five groups. Each one hands you a symptom and a system. You probe the stations on the map — each probe reveals what a technician would read there — and then you name the fault.
      </Lead>
      <Card tone="math">
        <Eyebrow>WHERE THE WALK STARTS</Eyebrow>
        <Body>Not always at the microphone. The symptom tells you which stations are already cleared: “one vocal is dead, the band is fine” starts at that source; “nothing anywhere, but every channel meter is dancing” starts at the console output, because the meters have already vouched for everything before it. Every case prints its start. Probes before it are not wrong, only wasted.</Body>
      </Card>
      <Card tone="math">
        <Eyebrow>HOW A CASE IS GRADED</Eyebrow>
        <Body>✓ — the right diagnosis. ✓✓ — the right diagnosis AND a source-forward walk: every probe at or after the one before it, never a jump back toward the source, never a guess at the loudspeaker first. The bench counts your probes against the minimum a disciplined walk from the start needs.</Body>
      </Card>
      <KeyFact>Start where the symptom leaves doubt. Read each station. Stop at the first reading that is not healthy. That station is the fault, or where the fault became visible — and the reading tells you which.</KeyFact>
      <Card>
        <Eyebrow>YOUR BENCH SO FAR</Eyebrow>
        <Body>{progress.faults.length} of 22 solved · {progress.forward.length} with a forward walk.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="MeterModule" label="Signal Detective — read the meters" params={{ id: 'detective' }} />
        <LabLink route="ConnectorSelectLab" label="Connectors & Cable Selection — the cable tester" />
      </DeeperRow>
    </View>
  );
}

export const SS_TROUBLESHOOT_PAGES: PageDef[] = [
  { title: 'How the bench works', short: 'BENCH', Component: PageBenchIntro, manualDone: true },
  ...FAULT_GROUPS.map((g) => ({
    title: g.title,
    short: g.title.split(' ')[0].toUpperCase(),
    manualDone: true,
    Component: ({ ctx }: { ctx: PageCtx }) => <GroupPage group={g.id} ctx={ctx} />,
  })),
];

const styles = StyleSheet.create({
  symptom: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 21 },
  opt: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f2416' },
  optWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  case: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, minHeight: 56 },
  caseDone: { borderColor: '#2f4a3a' },
  caseTitle: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.6 },
  caseSymptom: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  caseGo: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
});
