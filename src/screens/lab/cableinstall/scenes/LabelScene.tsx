/**
 * STAGE 12 — Labeling, Serviceability & Documentation + service loops
 * (spec §19).
 *
 * The frustration→identity arc, in four phases:
 *  A  THE FRUSTRATION — an installed Rack → Patch panel → Wall plate → Stage
 *     box system with 4 identical unlabeled cables. "No signal from Stage
 *     Input 12 — find its cable." Every tap reveals only "unlabeled cable"
 *     (frustrating BY DESIGN, kept short): after 3 taps the lesson lands —
 *     without identity, every fault is archaeology.
 *  B  ASSIGN IDENTITY — label the run to the TRAINING EXAMPLE scheme
 *     (CI_LABEL_SCHEME_NOTE): origin / destination / cable id from option
 *     sets with plausible distractors.
 *  C  TRACE TEST — same four cables, now flagged: find A-012 in seconds,
 *     then the DOCUMENTATION reveal — the cable schedule with A-012's row
 *     highlighted (records must match reality).
 *  D  SERVICE LOOPS — CI_SLACK_SCENARIO: DragSlider "STORED SLACK" over an
 *     honest rack-end loop (taut stub / dressed loop / pathway-blocking
 *     pile); land the good zone and confirm. Slack is intentional — never
 *     one universal length.
 *
 * Completion: A experienced + B labeled + C traced + D landed →
 * onComplete({ documentation, serviceability }) ONCE. Replay via `completed`
 * (pre-revealed). Accessibility: cables are labeled ≥44dp buttons (the SVG is
 * a described visualization), all verdicts announce.
 */
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { DragSlider } from '../../foundations/bits';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { CI_CABLE_SCHEDULE, CI_LABEL_SCHEME_NOTE, CI_SLACK_SCENARIO, CI_TRACE_TARGET, type CiScheduleRow } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── fixed system facts ─────────────────────────────────────────────────── */
/** Physical cable order 1..4 → the flag each carries once labeled. */
const CABLE_FLAGS = ['A-010', 'A-011', 'A-012', 'N-004'] as const;
const TARGET_CABLE = CABLE_FLAGS.indexOf(CI_TRACE_TARGET as (typeof CABLE_FLAGS)[number]); // cable 3

/** Phase-B option sets (plausible distractors; correct never first). */
const B_FIELDS = [
  { key: 'origin', label: 'ORIGIN — STAGE END', options: ['R1-PP2-12', 'STG-A-IN12', 'STG-A-IN21'], correctIdx: 1 },
  { key: 'dest', label: 'DESTINATION — RACK END', options: ['R1-PP2-21', 'STG-A-IN12', 'R1-PP2-12'], correctIdx: 2 },
  { key: 'id', label: 'CABLE ID', options: ['A-021', 'A-012', 'N-012'], correctIdx: 1 },
] as const;

/* ── the installed system (training visualization; one SVG, two states) ── */
const RACK_Y = [44, 72, 96, 120]; // rack-exit y per cable
const P_Y = [58, 68, 78, 88]; // patch-panel lane y
const W_Y = [62, 70, 78, 86]; // wall-plate lane y
const S_Y = [54, 70, 86, 102]; // stage-box jack y
const PERM_A = [2, 0, 3, 1]; // cable i → patch lane (crossings by design)
const PERM_B = [1, 3, 0, 2]; // cable i → wall-plate lane
const PERM_C = [2, 0, 3, 1]; // cable i → stage jack

function cablePath(i: number): string {
  const r = RACK_Y[i];
  const p = P_Y[PERM_A[i]];
  const wy = W_Y[PERM_B[i]];
  const s = S_Y[PERM_C[i]];
  return `M66 ${r} H76 C86 ${r} 82 ${p} 92 ${p} H156 C176 ${p} 176 ${wy} 196 ${wy} H224 C240 ${wy} 240 ${s} 256 ${s} h8`;
}

function SystemArt({ w, labeled, found }: { w: number; labeled: boolean; found: boolean }) {
  const h = Math.round(w * 0.42);
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 150"
      accessibilityLabel={
        labeled
          ? `Installed system, training visualization: rack R1, patch panel PP2, wall plate and stage box, with four cables now carrying label flags at both ends: ${CABLE_FLAGS.join(', ')}.${found ? ' Cable A-012 is highlighted.' : ''} Interaction happens in the buttons below.`
          : 'Installed system, training visualization: rack R1, patch panel PP2, wall plate and stage box, connected by four identical unlabeled cables that cross each other. Interaction happens in the buttons below.'
      }
    >
      <Rect x={2} y={4} width={356} height={144} rx={10} fill="#101014" />
      {/* rack */}
      <Rect x={10} y={16} width={56} height={118} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {[24, 44, 64, 84, 104].map((y) => (
        <Rect key={y} x={16} y={y} width={44} height={16} rx={2} fill="#101014" stroke="#2c2c33" strokeWidth={1} />
      ))}
      {/* patch panel */}
      <Rect x={92} y={48} width={64} height={44} rx={3} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {[62, 78].map((y) => (
        <G key={y}>
          {[100, 108, 116, 124, 132, 140, 148].map((x) => (
            <Circle key={x} cx={x} cy={y} r={1.8} fill="#2c2c33" />
          ))}
        </G>
      ))}
      {/* wall plate */}
      <Rect x={196} y={54} width={28} height={36} rx={3} fill="#101014" stroke="#6f7378" strokeWidth={1.4} />
      <Circle cx={210} cy={64} r={3} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={210} cy={80} r={3} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      {/* stage box */}
      <Rect x={256} y={40} width={88} height={68} rx={5} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {S_Y.map((y) => (
        <G key={y}>
          <Circle cx={268} cy={y} r={4} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
          <Circle cx={310} cy={y} r={4} fill="#101014" stroke="#2c2c33" strokeWidth={1.2} />
        </G>
      ))}
      {/* the four identical cables (crossing on purpose) */}
      {[0, 1, 2, 3].map((i) => (
        <Path key={i} d={cablePath(i)} stroke="#4fd0e0" strokeWidth={2.2} fill="none" />
      ))}
      {found ? <Path d={cablePath(TARGET_CABLE)} stroke={colors.green} strokeWidth={3} fill="none" /> : null}
      {/* physical cable numbers at the rack exits */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Circle cx={71} cy={RACK_Y[i]} r={6.5} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
          <SvgText x={71} y={RACK_Y[i] + 2.5} fontSize={7.5} fill={colors.textSecondary} textAnchor="middle">
            {String(i + 1)}
          </SvgText>
        </G>
      ))}
      {/* label flags at both ends once identity is assigned */}
      {labeled
        ? [0, 1, 2, 3].map((i) => {
            const p = P_Y[PERM_A[i]];
            const s = S_Y[PERM_C[i]];
            const isTarget = found && i === TARGET_CABLE;
            return (
              <G key={i}>
                <Rect x={158} y={p - 12} width={32} height={9} rx={1.5} fill="#26262c" stroke={isTarget ? colors.green : '#6f7378'} strokeWidth={1} />
                <SvgText x={174} y={p - 5} fontSize={6} fill={isTarget ? colors.green : colors.textSecondary} textAnchor="middle">
                  {CABLE_FLAGS[i]}
                </SvgText>
                <Rect x={246} y={s - 9} width={9} height={6} rx={1} fill="#26262c" stroke={isTarget ? colors.green : '#6f7378'} strokeWidth={0.9} />
              </G>
            );
          })
        : null}
      {/* node names */}
      <SvgText x={38} y={146} fontSize={6.5} fill="#6f7378" textAnchor="middle">
        RACK R1
      </SvgText>
      <SvgText x={124} y={146} fontSize={6.5} fill="#6f7378" textAnchor="middle">
        PATCH PP2
      </SvgText>
      <SvgText x={210} y={146} fontSize={6.5} fill="#6f7378" textAnchor="middle">
        WALL PLATE
      </SvgText>
      <SvgText x={300} y={146} fontSize={6.5} fill="#6f7378" textAnchor="middle">
        STAGE BOX
      </SvgText>
    </Svg>
  );
}

/* ── the documentation reveal: simplified professional cable schedule ───── */
const DOC_COLS: { key: keyof CiScheduleRow; label: string; w: number }[] = [
  { key: 'cableId', label: 'ID', w: 56 },
  { key: 'source', label: 'SOURCE', w: 96 },
  { key: 'destination', label: 'DESTINATION', w: 96 },
  { key: 'type', label: 'TYPE', w: 128 },
  { key: 'pathway', label: 'PATHWAY', w: 108 },
  { key: 'note', label: 'NOTE', w: 168 },
];

function DocTable({ highlight }: { highlight: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.docScroll}>
      <View>
        <View style={styles.docHeadRow}>
          {DOC_COLS.map((c) => (
            <Text key={c.key} style={[styles.docHead, { width: c.w }]}>
              {c.label}
            </Text>
          ))}
        </View>
        {CI_CABLE_SCHEDULE.map((r) => {
          const hot = r.cableId === highlight;
          return (
            <View
              key={r.cableId}
              style={[styles.docRow, hot && styles.docRowHot]}
              accessibilityLabel={`${r.cableId}: ${r.source} to ${r.destination}, ${r.type}, pathway ${r.pathway}${r.note ? `, note: ${r.note}` : ''}${hot ? '. The traced cable.' : ''}`}
            >
              {DOC_COLS.map((c) => (
                <Text key={c.key} style={[styles.docCell, { width: c.w }, hot && c.key === 'cableId' && { color: colors.amber }]}>
                  {r[c.key] ?? '—'}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ── service-loop visualization (honest zones) ──────────────────────────── */
function SlackArt({ w, v }: { w: number; v: number }) {
  const h = Math.round(w * 0.5);
  const zone = v <= CI_SLACK_SCENARIO.tooLittleMax ? 'little' : v <= CI_SLACK_SCENARIO.goodMax ? 'good' : 'much';
  const er = 3 + v * 26; // loop radius grows with stored slack
  const spill = 46 + 2 * er > 88; // pile reaching the pathway strip
  return (
    <Svg width={w} height={h} viewBox="0 0 220 110" accessibilityLabel={`Rack-end service loop visualization. ${CI_SLACK_SCENARIO.notes[zone]}`}>
      <Rect x={2} y={2} width={216} height={106} rx={8} fill="#101014" />
      {/* rack + termination */}
      <Rect x={8} y={10} width={56} height={92} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {[18, 40, 62, 84].map((y) => (
        <Rect key={y} x={13} y={y} width={42} height={14} rx={2} fill="#101014" stroke="#2c2c33" strokeWidth={1} />
      ))}
      <Rect x={62} y={40} width={10} height={8} rx={1.5} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
      {/* conduit stub feeding the run */}
      <Rect x={204} y={36} width={12} height={16} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.4} />
      {/* service pathway that excess slack blocks */}
      <Rect x={76} y={88} width={140} height={16} rx={2} fill="#141418" stroke="#2c2c33" strokeWidth={1} />
      {[86, 106, 126, 146, 166, 186].map((x) => (
        <Path key={x} d={`M${x} 102 l8 -12`} stroke="#26262c" strokeWidth={1} />
      ))}
      <SvgText x={146} y={98} fontSize={5.5} fill="#6f7378" textAnchor="middle">
        SERVICE PATHWAY — KEEP CLEAR
      </SvgText>
      {zone === 'little' ? (
        <>
          {/* taut run, no loop — strain at the termination */}
          <Path d={`M204 44 C160 ${44 + 4 + v * 20} 116 ${44 + 4 + v * 20} 72 44`} stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
          <Path d="M70 36 l-4 -6 M76 34 v-7 M82 36 l4 -6" stroke="#ff5a48" strokeWidth={1.4} />
        </>
      ) : (
        <>
          {/* dressed loop (strapped at the neck), growing with the slider */}
          <Path d="M204 44 C186 44 172 45 158 46" stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
          <Path d="M114 46 C100 45 86 44 72 44" stroke="#4fd0e0" strokeWidth={2.4} fill="none" />
          <Ellipse cx={136} cy={46 + er} rx={er * 0.72} ry={er} fill="none" stroke="#4fd0e0" strokeWidth={2.4} />
          {zone === 'much' ? (
            <>
              <Ellipse cx={122} cy={44 + er * 0.9} rx={er * 0.6} ry={er * 0.85} fill="none" stroke="#4fd0e0" strokeWidth={2.2} />
              <Ellipse cx={152} cy={48 + er} rx={er * 0.66} ry={er * 1.05} fill="none" stroke="#4fd0e0" strokeWidth={2.2} />
            </>
          ) : (
            <Rect x={131} y={41} width={10} height={11} rx={2} fill="none" stroke="#e8e8ea" strokeWidth={1.2} />
          )}
          {spill ? (
            <Rect x={96} y={88} width={110} height={16} rx={2} fill="#ff5a48" fillOpacity={0.12} stroke="#ff5a48" strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray="4 3" />
          ) : null}
        </>
      )}
    </Svg>
  );
}

const ZONE_TINT = { little: '#ff8a6b', good: colors.green, much: '#ffb45e' } as const;
const ZONE_NAME = { little: 'TOO LITTLE', good: 'INTENTIONAL', much: 'EXCESSIVE' } as const;

/* ── lesson card (WhyScene idiom) ───────────────────────────────────────── */
function LessonCard({ head, body }: { head: string; body: string }) {
  return (
    <View style={styles.lessonCard}>
      <Text style={styles.lessonHead}>{head}</Text>
      <Text style={styles.lessonBody}>{body}</Text>
    </View>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function LabelScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  // A — the frustration
  const [aTapped, setATapped] = useState<Set<number>>(() => new Set(completed ? [0, 1, 2] : []));
  const aDone = aTapped.size >= 3;
  // B — assign identity
  const [bPicks, setBPicks] = useState<(number | null)[]>(() => (completed ? B_FIELDS.map((f) => f.correctIdx) : B_FIELDS.map(() => null)));
  const [bDone, setBDone] = useState(completed);
  const [bWrong, setBWrong] = useState(0);
  const [bShowMiss, setBShowMiss] = useState(false);
  // C — trace test
  const [cFound, setCFound] = useState(completed);
  const [cWrong, setCWrong] = useState(0);
  const [cLastWrong, setCLastWrong] = useState<number | null>(null);
  // D — service loops
  const [slack, setSlack] = useState(completed ? 0.45 : 0.06);
  const [dDone, setDDone] = useState(completed);
  const [dWrong, setDWrong] = useState(0);
  const [dMiss, setDMiss] = useState<'little' | 'much' | null>(null);
  const [fired, setFired] = useState(completed);

  const zone: 'little' | 'good' | 'much' =
    slack <= CI_SLACK_SCENARIO.tooLittleMax ? 'little' : slack <= CI_SLACK_SCENARIO.goodMax ? 'good' : 'much';

  const tapCableA = (i: number) => {
    if (aDone || aTapped.has(i)) return;
    const next = new Set(aTapped);
    next.add(i);
    setATapped(next);
    AccessibilityInfo.announceForAccessibility(
      next.size >= 3
        ? 'Unlabeled cable — identical to the others. Three inspected, nothing learned. Without identity, every fault is archaeology.'
        : 'Unlabeled cable — identical to the others.',
    );
  };

  const applyLabels = () => {
    if (bDone || bPicks.some((p) => p == null)) return;
    const right = B_FIELDS.every((f, i) => bPicks[i] === f.correctIdx);
    if (right) {
      setBDone(true);
      setBShowMiss(false);
    } else {
      setBWrong((n) => n + 1);
      setBShowMiss(true);
    }
  };

  const tapCableC = (i: number) => {
    if (cFound) return;
    if (i === TARGET_CABLE) {
      setCFound(true);
      setCLastWrong(null);
    } else {
      setCWrong((n) => n + 1);
      setCLastWrong(i);
      AccessibilityInfo.announceForAccessibility(`That flag reads ${CABLE_FLAGS[i]} — you're looking for ${CI_TRACE_TARGET}.`);
    }
  };

  const confirmSlack = () => {
    if (dDone) return;
    if (zone === 'good') {
      setDDone(true);
      setDMiss(null);
      if (!fired) {
        setFired(true);
        announceComplete('Stage 12 complete.');
        onComplete({
          documentation: clamp100(100 - bWrong * 12 - cWrong * 10),
          serviceability: clamp100(100 - dWrong * 12),
        });
      }
    } else {
      setDWrong((n) => n + 1);
      setDMiss(zone);
    }
  };

  const bHint =
    bWrong <= 1
      ? 'Not yet — read each field against the note: the origin is where the run starts (Stage Input 12), the destination is where it lands (rack panel port), and the cable ID is the run’s own number.'
      : 'Read closely: Stage Input 12 = STG-A-IN12 · Rack 1, Patch Panel 2, Port 12 = R1-PP2-12 · the cable itself is A-012.';

  return (
    <View style={{ gap: 14 }}>
      <SystemArt w={width} labeled={bDone} found={cFound} />
      <Text style={styles.tintNote}>
        TRAINING VISUALIZATION — simplified system; the identical cable tints ARE the point (teaching colors — field
        colors vary). Numbered markers = the four physical cables below.
      </Text>

      {/* ── A · THE FRUSTRATION ─────────────────────────────────────────── */}
      <CiSection title="A · SERVICE CALL — NO SIGNAL FROM STAGE INPUT 12">
        <Text style={styles.lead}>
          The system above is installed and completely unlabeled. Find Stage Input 12’s cable — tap cables to inspect
          them.
        </Text>
        <View style={styles.cableGrid}>
          {[0, 1, 2, 3].map((i) => {
            const tapped = aTapped.has(i);
            return (
              <Pressable
                key={i}
                style={[styles.cableBtn, styles.cableBtnHalf, tapped && styles.cableBtnTapped]}
                onPress={() => tapCableA(i)}
                disabled={aDone || tapped}
                accessibilityRole="button"
                accessibilityState={{ disabled: aDone || tapped }}
                accessibilityLabel={`Cable ${i + 1}${tapped ? '. Inspected: unlabeled, identical to the others' : aDone ? '. Identical to the rest — no point inspecting further' : '. Tap to inspect'}`}
              >
                <Text style={styles.cableBtnName}>CABLE {i + 1}</Text>
                <Text style={[styles.cableBtnSub, tapped && { color: '#ff9b8f' }]}>
                  {tapped ? '❓ unlabeled — identical to the rest' : aDone ? 'identical — no point continuing' : 'tap to inspect'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {aDone ? (
          <LessonCard
            head="WITHOUT IDENTITY, EVERY FAULT IS ARCHAEOLOGY"
            body="Three cables inspected, nothing learned — the fault is unchanged and the clock is running. Nothing distinguishes one run from another: not for you today, not for the technician in five years. Professionals give every cable identity at both ends — before the system ever needs service."
          />
        ) : null}
      </CiSection>

      {/* ── B · ASSIGN IDENTITY ─────────────────────────────────────────── */}
      {aDone ? (
        <CiSection title="B · ASSIGN IDENTITY — LABEL THE RUN">
          <SpecCard text={CI_LABEL_SCHEME_NOTE} />
          <Text style={styles.lead}>
            Label Input 12’s run to the training scheme — origin, destination, and the cable’s own ID:
          </Text>
          <View style={{ gap: 10 }}>
            {B_FIELDS.map((f, fi) => (
              <View key={f.key} style={{ gap: 6 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.rowWrap}>
                  {f.options.map((opt, oi) => (
                    <OptionChip
                      key={opt}
                      label={opt}
                      active={bPicks[fi] === oi}
                      disabled={bDone}
                      onPress={() =>
                        setBPicks((prev) => {
                          const next = [...prev];
                          next[fi] = oi;
                          return next;
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
          {!bDone ? (
            <Pressable
              style={[styles.applyBtn, bPicks.some((p) => p == null) && { opacity: 0.45 }]}
              onPress={applyLabels}
              disabled={bPicks.some((p) => p == null)}
              accessibilityRole="button"
              accessibilityState={{ disabled: bPicks.some((p) => p == null) }}
              accessibilityLabel="Apply labels to both ends"
            >
              <Text style={styles.applyText}>APPLY LABELS — BOTH ENDS</Text>
            </Pressable>
          ) : null}
          {bDone ? (
            <>
              <VerdictBanner
                verdict="correct"
                text="Both ends of the run now carry unique, readable, durable identity that matches the records: STG-A-IN12 → R1-PP2-12, cable A-012."
              />
              <RuleFeedback ruleId="label-both-ends" verdict="good" openSources={openSources} />
              <RuleFeedback ruleId="label-scheme-consistent" verdict="info" openSources={openSources} />
            </>
          ) : bShowMiss ? (
            <VerdictBanner verdict="wrong" text={bHint} />
          ) : null}
        </CiSection>
      ) : null}

      {/* ── C · TRACE TEST + THE DOCUMENTATION ──────────────────────────── */}
      {bDone ? (
        <CiSection title="C · TRACE TEST — SAME FAULT, LABELED SYSTEM">
          <Text style={styles.lead}>
            The flags are on (see the system above — both ends). Same four cables: which physical cable is{' '}
            {CI_TRACE_TARGET}?
          </Text>
          <View style={{ gap: 8 }}>
            {[0, 1, 2, 3].map((i) => {
              const isTarget = i === TARGET_CABLE;
              const missed = cLastWrong === i;
              return (
                <Pressable
                  key={i}
                  style={[styles.cableBtn, cFound && isTarget && styles.cableBtnFound, missed && !cFound && styles.cableBtnMiss]}
                  onPress={() => tapCableC(i)}
                  disabled={cFound}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: cFound, selected: cFound && isTarget }}
                  accessibilityLabel={`Cable ${i + 1}, flag reads ${CABLE_FLAGS[i]}${cFound && isTarget ? '. Traced — this is the one.' : ''}`}
                >
                  <Text style={styles.cableBtnName}>CABLE {i + 1}</Text>
                  <Text style={[styles.cableBtnSub, cFound && isTarget && { color: colors.green }]}>
                    flag: {CABLE_FLAGS[i]}
                    {cFound && isTarget ? '  ✓ traced' : missed && !cFound ? '  ✕ not it' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {cFound ? (
            <>
              <VerdictBanner
                verdict="correct"
                text="Cable 3, in seconds — the flag says A-012, so it IS A-012. Yesterday this exact fault produced three guesses and nothing."
              />
              <Text style={styles.docEyebrow}>THE OTHER HALF OF IDENTITY — THE RECORDS</Text>
              <Text style={styles.docLead}>
                The label points into the documentation. The cable schedule (slide for all columns), {CI_TRACE_TARGET}{' '}
                highlighted:
              </Text>
              <DocTable highlight={CI_TRACE_TARGET} />
              <RuleFeedback ruleId="label-docs-match" verdict="good" openSources={openSources} />
            </>
          ) : null}
        </CiSection>
      ) : null}

      {/* ── D · SERVICE LOOPS ───────────────────────────────────────────── */}
      {cFound ? (
        <CiSection title="D · SERVICE LOOPS — STORED SLACK">
          <SpecCard text={CI_SLACK_SCENARIO.brief} />
          <Text style={styles.lead}>
            Slack is intentional. How much is right depends on the cable, the location, the service plan, and
            project/manufacturer requirements — there is no universal service-loop length. Set this rack’s loop to the
            project note:
          </Text>
          <SlackArt w={width} v={slack} />
          <DragSlider
            value={slack}
            onChange={(v) => {
              if (!dDone) setSlack(v);
            }}
            label="STORED SLACK"
            readout={ZONE_NAME[zone]}
            tint={ZONE_TINT[zone]}
          />
          <View style={{ gap: 3 }}>
            {(['little', 'good', 'much'] as const).map((z) => (
              <Text key={z} style={[styles.zoneNote, zone === z && { color: ZONE_TINT[z], fontFamily: fonts.barlowMedium }]}>
                {zone === z ? '▶ ' : '·  '}
                {CI_SLACK_SCENARIO.notes[z]}
              </Text>
            ))}
          </View>
          {!dDone ? (
            <Pressable style={styles.applyBtn} onPress={confirmSlack} accessibilityRole="button" accessibilityLabel="Confirm stored slack">
              <Text style={styles.applyText}>CONFIRM STORED SLACK</Text>
            </Pressable>
          ) : null}
          {dDone ? (
            <>
              <VerdictBanner
                verdict="correct"
                text="Dressed, reachable, sized to the service need — one full re-termination stored without blocking the pathway. Slack is a design decision, not leftovers."
              />
              <RuleFeedback ruleId="slack-intentional" verdict="good" openSources={openSources} />
            </>
          ) : dMiss ? (
            <VerdictBanner verdict="wrong" text={CI_SLACK_SCENARIO.notes[dMiss]} />
          ) : null}
        </CiSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tintNote: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, lineHeight: 13, color: colors.textSub },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  cableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cableBtn: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  cableBtnHalf: { flexBasis: '47%', flexGrow: 1 },
  cableBtnTapped: { borderColor: 'rgba(255,155,143,.45)' },
  cableBtnFound: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11' },
  cableBtnMiss: { borderColor: 'rgba(255,155,143,.6)' },
  cableBtnName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  cableBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  fieldLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.amberLabel },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  applyBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 10, backgroundColor: colors.amber },
  applyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#1a1409' },
  docEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.5, color: colors.amber, marginTop: 2 },
  docLead: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  docScroll: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014' },
  docHeadRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#26262c' },
  docHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.amberLabel, paddingRight: 8 },
  docRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  docRowHot: { backgroundColor: 'rgba(255,198,77,.08)' },
  docCell: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 15, color: colors.textSecondary, paddingRight: 8 },
  zoneNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
});
