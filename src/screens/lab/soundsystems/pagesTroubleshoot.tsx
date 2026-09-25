/**
 * Sound Systems Lab — TROUBLESHOOT mode: the bench.
 *
 * Page 1 explains the bench. Pages 2–6 each hold one fault group. Inside a
 * case the learner PROBES stations on the signal diagram (each probe reveals
 * that station's reading from the fault library), then names the fault. The
 * grade records whether the diagnosis was right AND whether the walk was
 * source-forward — both come from features/soundsystems/faults.ts.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { FAULT_GROUPS, faultsInGroup, gradeAttempt, type FaultCase, type FaultGroup, type Reading } from '../../../features/soundsystems/faults';
import { markFaultSolved, useSoundSystemsProgress } from '../../../features/soundsystems/progress';
import { STATION_LABEL, STATION_ORDER, type Station } from '../../../features/soundsystems/types';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, useVisitGoals, VerdictLine } from './bits';
import { ReadingKey, SystemDiagram, type DiagramState, type DiagramStation } from './art/SystemDiagram';

const STATION_KIND: Record<Station, DiagramStation['kind']> = {
  source: 'vocalMic',
  cable: 'snake',
  stagebox: 'stagebox',
  consoleIn: 'console',
  consoleOut: 'console',
  processor: 'processor',
  amp: 'amp',
  speaker: 'passiveSpeaker',
  listener: 'listener',
};

function stateOf(r: Reading): DiagramState {
  if (r.flags && r.flags.length) return r.signal === 'clip' ? 'clip' : r.signal === 'hot' ? 'hot' : 'flag';
  return r.signal === 'ok' ? 'ok' : r.signal === 'none' ? 'none' : r.signal === 'low' ? 'flag' : r.signal === 'hot' ? 'hot' : 'clip';
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
  const stations: DiagramStation[] = STATION_ORDER.map((s) => {
    const r = c.reads[s];
    const probed = probes.includes(s);
    return { id: s, kind: STATION_KIND[s], label: STATION_LABEL[s], state: probed ? stateOf(r) : 'unknown' };
  });
  const backwards = probes.length > 1 && STATION_ORDER.indexOf(probes[probes.length - 1]) < STATION_ORDER.indexOf(probes[probes.length - 2]);
  const reading = last ? c.reads[last] : null;
  return (
    <View style={{ gap: 10 }}>
      <Card tone="math">
        <Eyebrow>{c.title.toUpperCase()}{solvedBefore ? ' · SOLVED BEFORE' : ''}</Eyebrow>
        <Text style={styles.symptom}>{c.symptom}</Text>
        <Body>{c.setup}</Body>
      </Card>
      <SystemDiagram stations={stations} flowing={false} onTap={(id) => { const s = id as Station; setProbes((p) => [...p, s]); setLast(s); }} selectedId={last} a11y={`The nine stations. ${probes.length} probed. Tap a station to read it.`} />
      <ReadingKey />
      <Prompt>{probes.length === 0 ? 'Start at the source. Tap a station to probe it.' : 'Keep walking forward until the reading changes — then name the fault.'}</Prompt>
      {backwards ? <VerdictLine ok={false} warn>You jumped backward. The bench still records the answer, but not as a forward walk.</VerdictLine> : null}
      {reading && last ? (
        <Card tone={stateOf(reading) === 'ok' ? 'ok' : 'warn'}>
          <Eyebrow>{STATION_LABEL[last].toUpperCase()} · {reading.signal.toUpperCase()}{reading.flags?.length ? ` · ${reading.flags.join(', ').toUpperCase()}` : ''}</Eyebrow>
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
            Correct{grade.forward ? ' — and a source-forward walk' : ' — but not a forward walk'}. {grade.probes} probe{grade.probes === 1 ? '' : 's'}; a disciplined walk needs {grade.minimal}.
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
          <GoalChips goals={goals} latched={latched} />
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
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={14}>TESTING AND TROUBLESHOOTING · THE BENCH</ChapterTag>
      <Lead>
        Twenty-two faults from real shows, in five groups. Each one hands you a symptom and a system. You probe the stations on the signal diagram — each probe reveals what a technician would read there — and then you name the fault.
      </Lead>
      <Card tone="math">
        <Eyebrow>HOW A CASE IS GRADED</Eyebrow>
        <Body>✓ — the right diagnosis. ✓✓ — the right diagnosis AND a source-forward walk: every probe at or after the one before it, never a jump back toward the source, never a guess at the loudspeaker first. The bench counts your probes against the minimum a disciplined walk needs.</Body>
      </Card>
      <KeyFact>Start at the source. Read each station. Stop at the first reading that is not healthy. That station is the fault, or where the fault became visible — and the diagram tells you which by what the reading says.</KeyFact>
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
