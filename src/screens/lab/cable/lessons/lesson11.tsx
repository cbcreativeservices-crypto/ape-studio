/**
 * Lesson 11 — Final System Challenge (owner spec §5.11).
 * Two complete routing challenges, tab-switchable [SHOW A / STUDIO B], each
 * with independent progress that persists in state across tab switches:
 *   A: SIGNAL PATH picks → POWER-UP SEQUENCE (tap-to-order) → FAULT HUNT (1)
 *   B: SIGNAL PATH picks → DATA & CONTROL direction picks → FAULT HUNT (2)
 *
 * All content is data-driven from data/lesson11.ts (record-derived only).
 * Tap-only, retry-until-correct, tri-state verdicts; wrong picks always
 * explain what/why/mismatch/correct-choice plus the honest consequence class.
 * Completion honesty (§1.7): markLabUnit fires EXACTLY once per challenge —
 * on the FINISH tap after that challenge's final stage is genuinely solved
 * (challenge_a / challenge_b units; lesson01 FINISH-tap precedent).
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import {
  CHALLENGE_A,
  CHALLENGE_B,
  CONSEQUENCE_LABEL,
  L11_LESSON,
  type ChallengeDef,
  type ChallengeOption,
  type ConnectionPick,
  type FaultStage,
  type OrderStage,
  type PatchRow,
} from '../data/lesson11';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  useReduceMotion,
} from './bits';

/** Per-item cadence of the power-up cascade after a correct order (ms). */
const CASCADE_STEP_MS = 220;

/** Persisted-across-tab-switch progress for one challenge. Transient pick /
 *  order / verdict state deliberately lives in the (remounting) stage blocks. */
type ChProgress = {
  /** 0..2 = active stage index; 3 = challenge complete. */
  stage: number;
  /** Index of the active connection within a picks stage. */
  pickIdx: number;
  /** Fault-row ids already found (fault stages). */
  found: string[];
};
const FRESH: ChProgress = { stage: 0, pickIdx: 0, found: [] };

function verdictText(opt: ChallengeOption): string {
  return opt.consequence
    ? `${opt.explain}\nConsequence class: ${CONSEQUENCE_LABEL[opt.consequence]}.`
    : opt.explain;
}

// ─────────────────────────────────────────────────────────────────────────────
// One from→to connection: two sequential chip questions (remounts per pick id).

function OnePick({ pick, last, onNext }: { pick: ConnectionPick; last: boolean; onNext: () => void }) {
  const [q1, setQ1] = useState<ChallengeOption | null>(null);
  const [q2, setQ2] = useState<ChallengeOption | null>(null);
  const q1Solved = q1 != null && q1.verdict !== 'wrong';
  const q2Solved = q2 != null && q2.verdict !== 'wrong';
  const shown = q2 ?? q1;

  const pickQ1 = useCallback(
    (o: ChallengeOption) => {
      if (q1Solved) return;
      setQ1(o);
    },
    [q1Solved],
  );
  const pickQ2 = useCallback(
    (o: ChallengeOption) => {
      if (!q1Solved || q2Solved) return;
      setQ2(o);
    },
    [q1Solved, q2Solved],
  );

  return (
    <>
      <DetailCard>
        <Text style={s.cardTitle}>{`${pick.from}  →  ${pick.to}`}</Text>
        <Text style={s.cardHead}>{pick.q1Label}</Text>
        <View style={s.chipWrap}>
          {pick.q1.map((o) => (
            <OptionChip
              key={o.id}
              label={o.label}
              active={q1?.id === o.id}
              onPress={() => pickQ1(o)}
              disabled={q1Solved && q1?.id !== o.id}
            />
          ))}
        </View>
        {q1Solved ? (
          <>
            <Text style={s.cardHead}>{pick.q2Label}</Text>
            <View style={s.chipWrap}>
              {pick.q2.map((o) => (
                <OptionChip
                  key={o.id}
                  label={o.label}
                  active={q2?.id === o.id}
                  onPress={() => pickQ2(o)}
                  disabled={q2Solved && q2?.id !== o.id}
                />
              ))}
            </View>
          </>
        ) : null}
      </DetailCard>
      {shown ? <VerdictBanner verdict={shown.verdict} text={verdictText(shown)} /> : null}
      {q1Solved && q2Solved ? (
        <OptionChip label={last ? 'FINISH STAGE ✓' : 'NEXT CONNECTION ›'} active action onPress={onNext} />
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tap-to-order sequencing (ScenariosScreen pattern: numbered badges, CONFIRM
// ORDER when all ordered, retry on wrong).

function OrderBlock({ stage, onDone }: { stage: OrderStage; onDone: () => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const [result, setResult] = useState<'ok' | 'wrong' | null>(null);

  // Power-up cascade (owner direction 2026-08-15: strategic animation): on a
  // correct order the items "come alive" one by one IN THE LEARNER'S SEQUENCE
  // — sources first, amplification last. Instant under reduced motion; purely
  // reinforcing (the verdict banner + badge numbers carry the state).
  const reduceMotion = useReduceMotion();
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (result !== 'ok') {
      setLit(0);
      return;
    }
    if (reduceMotion) {
      setLit(order.length);
      return;
    }
    setLit(0);
    const timer = setInterval(() => {
      setLit((n) => (n + 1 >= order.length ? order.length : n + 1));
    }, CASCADE_STEP_MS);
    return () => clearInterval(timer);
  }, [result, reduceMotion, order.length]);

  const toggle = useCallback(
    (id: string) => {
      if (result === 'ok') return;
      setResult(null);
      setOrder((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    },
    [result],
  );

  const confirm = useCallback(() => {
    if (order.length !== stage.items.length || result === 'ok') return;
    // Judged by the safety rule the stage teaches: every phase-1 item before
    // any phase-2 item (order inside a group is genuinely flexible).
    let seenAmp = false;
    let ok = true;
    for (const id of order) {
      const item = stage.items.find((i) => i.id === id);
      if (item?.phase === 2) seenAmp = true;
      else if (seenAmp) {
        ok = false;
        break;
      }
    }
    if (ok) {
      setResult('ok');
    } else {
      setResult('wrong');
      setOrder([]);
    }
  }, [order, result, stage.items]);

  return (
    <>
      <Text style={s.body}>{stage.intro}</Text>
      <View style={{ gap: 7 }}>
        {stage.items.map((item) => {
          const pos = order.indexOf(item.id);
          const inOrder = pos >= 0;
          const powered = result === 'ok' && pos >= 0 && pos < lit;
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              disabled={result === 'ok'}
              accessibilityRole="button"
              accessibilityState={{ selected: inOrder, disabled: result === 'ok' }}
              accessibilityLabel={`${item.label}${inOrder ? `, position ${pos + 1}` : ', not yet ordered'}`}
              style={[
                styles.row,
                inOrder && styles.rowActive,
                result === 'ok' && !powered && { opacity: 0.75 },
                powered && styles.rowPowered,
              ]}
            >
              <View style={[styles.badge, inOrder && styles.badgeActive, powered && styles.badgePowered]}>
                <Text
                  style={[styles.badgeText, inOrder && styles.badgeTextActive, powered && styles.badgeTextPowered]}
                  maxFontSizeMultiplier={1.5}
                >
                  {inOrder ? pos + 1 : '·'}
                </Text>
              </View>
              <Text style={styles.rowText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {result === 'ok' ? (
        <VerdictBanner verdict="correct" text={stage.solveExplain} />
      ) : result === 'wrong' ? (
        <VerdictBanner verdict="wrong" text={stage.wrongExplain} />
      ) : null}
      {result === 'ok' ? (
        <OptionChip label="NEXT STAGE ›" active action onPress={onDone} />
      ) : (
        <OptionChip
          label="CONFIRM ORDER"
          active={order.length === stage.items.length}
          action
          disabled={order.length !== stage.items.length}
          onPress={confirm}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fault hunt: tap the wrong connection(s) in the patch list, then name why.

function FaultBlock({
  stage,
  found,
  onFound,
  onFinish,
}: {
  stage: FaultStage;
  found: string[];
  onFound: (rowId: string) => void;
  onFinish: () => void;
}) {
  const [row, setRow] = useState<PatchRow | null>(null);
  const [why, setWhy] = useState<ChallengeOption | null>(null);
  const faultIds = stage.rows.filter((r) => r.fault).map((r) => r.id);
  const foundCount = faultIds.filter((id) => found.includes(id)).length;
  const allFound = foundCount === faultIds.length;
  const whySolved = why != null && why.verdict !== 'wrong';

  const tapRow = useCallback(
    (r: PatchRow) => {
      if (found.includes(r.id)) return;
      setRow(r);
      setWhy(null);
    },
    [found],
  );

  const pickWhy = useCallback(
    (o: ChallengeOption) => {
      if (row == null || !row.fault || whySolved) return;
      setWhy(o);
      if (o.verdict !== 'wrong' && !found.includes(row.id)) onFound(row.id);
    },
    [row, whySolved, found, onFound],
  );

  const activeFault = row != null && row.fault ? row : null;

  return (
    <>
      <Text style={s.body}>{stage.intro}</Text>
      <View style={{ gap: 7 }}>
        {stage.rows.map((r) => {
          const isFound = found.includes(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => tapRow(r)}
              disabled={isFound}
              accessibilityRole="button"
              accessibilityState={{ selected: row?.id === r.id, disabled: isFound }}
              accessibilityLabel={isFound && r.fault ? `${r.label}. Fault found: ${r.faultName}` : r.label}
              style={[styles.row, row?.id === r.id && !isFound && styles.rowActive, isFound && styles.rowFound]}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.rowText}>{r.label}</Text>
                {isFound && r.fault ? <Text style={styles.foundTag}>{`✓ FAULT FOUND — ${r.faultName}`}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {row != null && !row.fault ? <VerdictBanner verdict="wrong" text={row.okExplain} /> : null}

      {activeFault ? (
        <>
          <DetailCard>
            <Text style={s.cardHead}>NAME WHY IT FAILS</Text>
            <Text style={s.hint}>{activeFault.label}</Text>
            <View style={s.chipWrap}>
              {activeFault.why.map((o) => (
                <OptionChip
                  key={o.id}
                  label={o.label}
                  active={why?.id === o.id}
                  onPress={() => pickWhy(o)}
                  disabled={whySolved && why?.id !== o.id}
                />
              ))}
            </View>
          </DetailCard>
          {why ? <VerdictBanner verdict={why.verdict} text={verdictText(why)} /> : null}
        </>
      ) : null}

      {whySolved && !allFound ? (
        <Text style={s.hint}>{`${foundCount} of ${faultIds.length} faults found — keep hunting in the patch list.`}</Text>
      ) : null}
      {allFound ? <OptionChip label="FINISH CHALLENGE ✓" active action onPress={onFinish} /> : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// One challenge: scene, stage strip, active stage body.

function ChallengeBlock({
  def,
  prog,
  setProg,
}: {
  def: ChallengeDef;
  prog: ChProgress;
  setProg: (p: ChProgress) => void;
}) {
  const total = def.stages.length;
  const stage = prog.stage < total ? def.stages[prog.stage] : null;

  const advanceStage = useCallback(() => {
    const next = prog.stage + 1;
    if (next >= total) {
      // Genuine full solve of every stage of this challenge → its unit credit
      // (R6c honesty: marked here and nowhere else; idempotent by store).
      markLabUnit('af_cables', def.unit);
    }
    setProg({ stage: next, pickIdx: 0, found: [] });
  }, [prog.stage, total, def.unit, setProg]);

  const pickStage = stage != null && stage.kind === 'picks' ? stage : null;
  const pick = pickStage ? pickStage.picks[Math.min(prog.pickIdx, pickStage.picks.length - 1)] : null;

  return (
    <>
      {/* ART SLOT: owner-supplied stage-plot / studio-layout illustration for
          this challenge mounts here once delivered — nothing renders until then. */}
      <DetailCard>
        <Text style={s.cardHead}>{def.title}</Text>
        <Text style={s.body}>{def.scene}</Text>
      </DetailCard>

      <View style={{ gap: 2 }}>
        {def.stages.map((st, i) => (
          <Text
            key={st.title}
            style={[
              styles.stageLine,
              i < prog.stage && styles.stageLineDone,
              i === prog.stage && styles.stageLineActive,
            ]}
          >
            {i < prog.stage
              ? `✓ Stage ${i + 1} · ${st.title} — solved`
              : i === prog.stage
                ? `▸ Stage ${i + 1} · ${st.title}`
                : `· Stage ${i + 1} · ${st.title}`}
          </Text>
        ))}
      </View>

      {pickStage && pick ? (
        <>
          <Eyebrow
            text={`${pickStage.title} · ${Math.min(prog.pickIdx + 1, pickStage.picks.length)} OF ${pickStage.picks.length}`}
          />
          <Text style={s.body}>{pickStage.intro}</Text>
          <OnePick
            key={pick.id}
            pick={pick}
            last={prog.pickIdx >= pickStage.picks.length - 1}
            onNext={() => {
              if (prog.pickIdx >= pickStage.picks.length - 1) advanceStage();
              else setProg({ ...prog, pickIdx: prog.pickIdx + 1 });
            }}
          />
        </>
      ) : null}

      {stage != null && stage.kind === 'order' ? (
        <>
          <Eyebrow text={stage.title} />
          <OrderBlock stage={stage} onDone={advanceStage} />
        </>
      ) : null}

      {stage != null && stage.kind === 'faults' ? (
        <>
          <Eyebrow
            text={`${stage.title} · ${stage.rows.filter((r) => r.fault && prog.found.includes(r.id)).length} OF ${stage.rows.filter((r) => r.fault).length} FOUND`}
          />
          <FaultBlock
            stage={stage}
            found={prog.found}
            onFound={(id) => setProg({ ...prog, found: [...prog.found, id] })}
            onFinish={advanceStage}
          />
        </>
      ) : null}

      {prog.stage >= total ? <CheckDoneBanner text={def.doneText} /> : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Lesson11Body() {
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const [progA, setProgA] = useState<ChProgress>(FRESH);
  const [progB, setProgB] = useState<ChProgress>(FRESH);

  const def = tab === 'A' ? CHALLENGE_A : CHALLENGE_B;
  const prog = tab === 'A' ? progA : progB;
  const setProg = tab === 'A' ? setProgA : setProgB;
  const doneA = progA.stage >= CHALLENGE_A.stages.length;
  const doneB = progB.stage >= CHALLENGE_B.stages.length;

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text="TWO SYSTEMS TO CABLE, END TO END" />
      <Text style={s.body}>
        A small live show and a small recording studio. Solve every stage of both — each challenge credits
        separately, and your progress in one is kept while you work in the other.
      </Text>

      <View style={s.chipWrap}>
        <OptionChip label={doneA ? `${CHALLENGE_A.tabLabel} ✓` : CHALLENGE_A.tabLabel} active={tab === 'A'} onPress={() => setTab('A')} />
        <OptionChip label={doneB ? `${CHALLENGE_B.tabLabel} ✓` : CHALLENGE_B.tabLabel} active={tab === 'B'} onPress={() => setTab('B')} />
      </View>

      {/* key remounts the block per tab: solved progress persists in progA/
          progB above; in-question transient state intentionally resets. */}
      <ChallengeBlock key={tab} def={def} prog={prog} setProg={setProg} />

      <LessonBanner text={L11_LESSON} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  rowActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  rowFound: { borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10' },
  rowText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary, flexShrink: 1 },
  foundTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.green },
  badge: {
    minWidth: 24,
    minHeight: 24,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: { borderColor: 'rgba(255,198,77,.8)', backgroundColor: '#1a1409' },
  badgeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  badgeTextActive: { color: colors.amber },
  // Power-up cascade (done-green panel family; state also carried by badge
  // numbers + the verdict banner — never color alone).
  rowPowered: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: '#0c1a10' },
  badgePowered: { borderColor: 'rgba(55,224,95,.8)' },
  badgeTextPowered: { color: colors.green },
  stageLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  stageLineDone: { color: colors.green },
  stageLineActive: { color: colors.amber },
});
