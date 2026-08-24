/**
 * FINAL STAGE — Professional Installation Inspection (spec §21) + the
 * randomized knowledge check (§41) and mastery hand-off.
 *
 * One combined facility (stage · floor · wall/door · rack · ceiling/tray ·
 * equipment room) seeded with a RANDOM DRAW of 15–18 defects from the 25-item
 * pool, so repeat attempts differ. The inspector's flow per defect:
 *   FIND (tap the marker, or use the accessible SUSPECT LIST)
 *   → CLASSIFY (the 8-category inspector toolbar)
 *   → CORRECT (choose the right correction among plausible decoys)
 * Scoring runs through engine/score.inspectionDimScores — critical safety and
 * fire findings carry the heaviest weight (spec §22).
 *
 * Pass: find + process ≥80% of the drawn defects → 'inspect_pass' unit; the
 * knowledge check (10 scenario-judgment questions drawn from the 15-item
 * bank) → 'final_check' unit; both + this stage's unit = lab complete.
 */
import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CheckQuestion } from '../../foundations/bits';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, FindProgress, RuleFeedback, announceComplete } from '../bits';
import { CI_CATEGORY_META, mistakeById, type CiMistakeCategory } from '../data/mistakes';
import { CI_INSPECTION_DRAW, CI_INSPECTION_POOL, CI_QUIZ_BANK, CI_QUIZ_DRAW, type CiInspectionDefect } from '../data/scenarios';
import { inspectionDimScores, type CiDimScores } from '../engine/score';
import { CI_FINAL_CHECK_UNIT, CI_INSPECT_PASS_UNIT, type CiModuleProps } from '../registry';

const LAB_KEY = 'af_cable_install' as const;

/** Mistake category → score dimension. */
const CAT_DIM = {
  safety: 'safety',
  support: 'routing',
  routing: 'routing',
  mechanical: 'protection',
  signal: 'signal',
  fire: 'safety',
  labeling: 'documentation',
  serviceability: 'serviceability',
} as const;

/** Deterministic per-attempt rng (xorshift over a mount-time seed). */
function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function drawAttempt(seed: number): CiInspectionDefect[] {
  const r = makeRng(seed);
  const count = CI_INSPECTION_DRAW.min + Math.floor(r() * (CI_INSPECTION_DRAW.max - CI_INSPECTION_DRAW.min + 1));
  const pool = [...CI_INSPECTION_POOL];
  // Fisher–Yates with the seeded rng.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const ZONE_NAMES = ['STAGE', 'FLOOR', 'WALL / DOOR', 'RACK', 'CEILING / TRAY', 'EQUIP ROOM'] as const;

type DefectState = {
  found: boolean;
  category?: CiMistakeCategory;
  categorizedRight?: boolean;
  corrected?: boolean;
};

/** The combined facility — every environment of the lab in one honest
 *  section view (training visualization; defect markers number the finds). */
function FacilityScene({
  w,
  defects,
  states,
  onTap,
}: {
  w: number;
  defects: CiInspectionDefect[];
  states: Record<string, DefectState>;
  onTap: (id: string) => void;
}) {
  const h = Math.round(w * 0.66);
  return (
    <View>
      <Svg width={w} height={h} viewBox="0 0 360 240" accessibilityLabel="Facility inspection scene — use the suspect list below for accessible selection">
        <Rect x={0} y={0} width={360} height={240} rx={10} fill="#101014" />
        {/* deck + ceiling structure */}
        <Line x1={0} y1={8} x2={360} y2={8} stroke="#2c2c33" strokeWidth={3} />
        {/* tray across ceiling */}
        <Rect x={24} y={16} width={220} height={9} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.5} />
        {[44, 84, 124, 164, 204].map((x) => (
          <Line key={x} x1={x} y1={16} x2={x} y2={25} stroke="#6f7378" strokeWidth={1} />
        ))}
        {/* sprinkler pipe */}
        <Line x1={20} y1={34} x2={250} y2={34} stroke="#8a4a44" strokeWidth={2.4} />
        {[70, 150, 230].map((x) => (
          <Path key={x} d={`M${x} 34 v5 l-3 4 h6 l-3 -4`} stroke="#8a4a44" strokeWidth={1.2} fill="none" />
        ))}
        {/* duct */}
        <Rect x={120} y={40} width={130} height={14} rx={3} fill="none" stroke="#4a4c52" strokeWidth={1.5} />
        {/* ceiling grid */}
        <Line x1={0} y1={62} x2={252} y2={62} stroke="#2c2c33" strokeWidth={2} />
        {[36, 76, 116, 156, 196, 236].map((x) => (
          <Line key={x} x1={x} y1={60} x2={x} y2={64} stroke="#3a3c42" strokeWidth={1} />
        ))}
        {/* equipment room + rack (right, full height) */}
        <Line x1={256} y1={8} x2={256} y2={228} stroke="#3a3c42" strokeWidth={2.5} />
        <SvgText x={300} y={78} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={8} letterSpacing={1} fill="#54565c">
          EQUIP ROOM
        </SvgText>
        <Rect x={276} y={84} width={62} height={128} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.5} />
        {[94, 112, 130, 148, 166, 184].map((y) => (
          <Rect key={y} x={281} y={y} width={52} height={13} rx={2} fill="#101014" stroke="#2c2c33" strokeWidth={1} />
        ))}
        {/* rated wall marking */}
        <Path d="M256 100 l-6 8 M256 130 l-6 8 M256 160 l-6 8" stroke="#8a4a44" strokeWidth={1.6} />
        {/* door in wall */}
        <Rect x={250} y={196} width={6} height={32} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
        {/* stage (left) */}
        <Rect x={8} y={186} width={104} height={42} rx={3} fill="#141418" stroke="#3a3c42" strokeWidth={1.4} />
        <Rect x={16} y={196} width={20} height={14} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
        <SvgText x={60} y={182} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={8} letterSpacing={1} fill="#54565c">
          STAGE
        </SvgText>
        {/* audience floor + aisle */}
        <Line x1={0} y1={228} x2={360} y2={228} stroke="#2c2c33" strokeWidth={3} />
        <Path d="M128 228 h44" stroke="#54565c" strokeWidth={2} strokeDasharray="5 4" />
        {/* representative runs (honest, terminating) */}
        <Path d="M36 196 C60 196 70 210 96 210 H140" stroke="#4fd0e0" strokeWidth={2} fill="none" />
        <Path d="M140 210 H196 C220 210 224 200 224 190" stroke="#4fd0e0" strokeWidth={2} fill="none" />
        <Path d="M32 25 H236 C250 25 252 40 252 60" stroke="#37d97b" strokeWidth={2} fill="none" />
        <Path d="M252 60 v40 l24 4" stroke="#37d97b" strokeWidth={2} fill="none" />
        <Path d="M352 228 v-140 l-14 -4" stroke="#ff5a48" strokeWidth={2} fill="none" />
        {/* defect markers */}
        {defects.map((d, i) => {
          const st = states[d.id];
          const cx = (d.x / 100) * 360;
          const cy = (d.y / 100) * 240;
          const done = st?.corrected;
          return (
            <Circle
              key={d.id}
              cx={cx}
              cy={cy}
              r={9}
              fill={done ? 'rgba(55,224,95,0.25)' : st?.found ? 'rgba(255,198,77,0.3)' : 'rgba(255,90,72,0.16)'}
              stroke={done ? colors.green : st?.found ? colors.amber : '#8a4a44'}
              strokeWidth={1.6}
            />
          );
        })}
        {defects.map((d, i) => {
          const cx = (d.x / 100) * 360;
          const cy = (d.y / 100) * 240;
          return (
            <SvgText key={`t${d.id}`} x={cx} y={cy + 3} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={8.5} fill="#e8e8ea">
              {i + 1}
            </SvgText>
          );
        })}
      </Svg>
      {/* tap overlays (≥44dp) */}
      {defects.map((d, i) => {
        const left = (d.x / 100) * w - 22;
        const top = (d.y / 100) * h - 22;
        return (
          <Pressable
            key={d.id}
            onPress={() => onTap(d.id)}
            style={{ position: 'absolute', left, top, width: 44, height: 44 }}
            accessibilityRole="button"
            accessibilityLabel={`Finding ${i + 1}${states[d.id]?.found ? ', opened' : ''}`}
          />
        );
      })}
    </View>
  );
}

export function InspectScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const seedRef = useRef(Date.now());
  const [attemptSeed, setAttemptSeed] = useState(seedRef.current);
  const defects = useMemo(() => drawAttempt(attemptSeed), [attemptSeed]);
  const [states, setStates] = useState<Record<string, DefectState>>({});
  const [active, setActive] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [phase, setPhase] = useState<'inspect' | 'quiz' | 'done'>(completed ? 'done' : 'inspect');
  const [passDims, setPassDims] = useState<CiDimScores>({});
  const quizSolvedRef = useRef(0);
  const [quizSolved, setQuizSolved] = useState(0);
  const firedRef = useRef(completed);

  const quiz = useMemo(() => {
    const r = makeRng(attemptSeed + 7);
    const bank = [...CI_QUIZ_BANK];
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }
    return bank.slice(0, CI_QUIZ_DRAW);
  }, [attemptSeed]);

  const processedCount = defects.filter((d) => states[d.id]?.corrected).length;
  const required = Math.ceil(defects.length * 0.8);
  const activeDefect = active ? defects.find((d) => d.id === active) : null;
  const activeMistake = activeDefect ? mistakeById(activeDefect.mistakeId)! : null;
  const activeState = active ? states[active] : undefined;

  const openDefect = (id: string) => {
    setActive(id);
    setStates((s) => ({ ...s, [id]: { ...(s[id] ?? { found: false }), found: true } }));
  };

  const classify = (cat: CiMistakeCategory) => {
    if (!active || !activeMistake) return;
    const right = cat === activeMistake.category;
    setStates((s) => ({ ...s, [active]: { ...(s[active] ?? { found: true }), found: true, category: cat, categorizedRight: right } }));
    AccessibilityInfo.announceForAccessibility(right ? `Classified: ${CI_CATEGORY_META[cat].label}. Correct.` : `Recorded as ${CI_CATEGORY_META[cat].label} — the inspector's log says ${CI_CATEGORY_META[activeMistake.category].label}.`);
  };

  const corrections = useMemo(() => {
    if (!activeDefect || !activeMistake) return [];
    const r = makeRng(attemptSeed + activeDefect.x * 31 + activeDefect.y * 7);
    const others = CI_INSPECTION_POOL.filter((p) => p.mistakeId !== activeDefect.mistakeId);
    const decoys: string[] = [];
    while (decoys.length < 2 && others.length) {
      const pick = mistakeById(others[Math.floor(r() * others.length)].mistakeId)!.correction;
      if (pick !== activeMistake.correction && !decoys.includes(pick)) decoys.push(pick);
    }
    const opts = [activeMistake.correction, ...decoys];
    // seeded scramble
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [activeDefect, activeMistake, attemptSeed]);

  const correct = (text: string) => {
    if (!active || !activeMistake) return;
    const right = text === activeMistake.correction;
    if (!right) {
      AccessibilityInfo.announceForAccessibility('That correction doesn\'t address this finding — check the WHY.');
      return;
    }
    setStates((s) => ({ ...s, [active]: { ...(s[active] ?? { found: true }), found: true, corrected: true } }));
    AccessibilityInfo.announceForAccessibility('Correction recorded.');
  };

  const finishInspection = () => {
    const results = defects.map((d) => {
      const st = states[d.id];
      const m = mistakeById(d.mistakeId)!;
      return {
        dim: CAT_DIM[m.category],
        severity: m.severity,
        found: !!st?.corrected,
        categorizedRight: !!st?.categorizedRight,
      };
    });
    const dims = inspectionDimScores(results);
    setPassDims(dims);
    markLabUnit(LAB_KEY, CI_INSPECT_PASS_UNIT);
    announceComplete('Inspection passed. Knowledge check unlocked.');
    setPhase('quiz');
  };

  const onQuizSolved = () => {
    quizSolvedRef.current += 1;
    setQuizSolved(quizSolvedRef.current);
    if (quizSolvedRef.current >= quiz.length && !firedRef.current) {
      firedRef.current = true;
      markLabUnit(LAB_KEY, CI_FINAL_CHECK_UNIT);
      announceComplete('Knowledge check complete. Lab complete.');
      onComplete(passDims);
      setPhase('done');
    }
  };

  return (
    <View style={{ gap: 14 }}>
      {phase === 'inspect' ? (
        <>
          <CiSection title={`WALK THE FACILITY — ${defects.length} FINDINGS HIDDEN THIS ATTEMPT`}>
            <Text style={styles.lead}>
              Tap a numbered marker (or open the FINDINGS LIST), classify what kind of problem it is, then choose the
              correction. Pass at {required} of {defects.length} processed. Each attempt draws a different set.
            </Text>
            {width > 40 ? <FacilityScene w={width} defects={defects} states={states} onTap={openDefect} /> : null}
            <FindProgress found={processedCount} required={required} total={defects.length} />
            <Pressable onPress={() => setListOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: listOpen }} accessibilityLabel="Findings list — accessible alternative to tapping the drawing">
              <Text style={styles.listToggle}>{listOpen ? '▾ FINDINGS LIST' : '▸ FINDINGS LIST (accessible alternative)'}</Text>
            </Pressable>
            {listOpen
              ? defects.map((d, i) => {
                  const st = states[d.id];
                  return (
                    <Pressable
                      key={d.id}
                      style={[styles.listRow, st?.corrected && styles.listRowDone]}
                      onPress={() => openDefect(d.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Finding ${i + 1}, ${ZONE_NAMES[d.zone]}: ${d.label}${st?.corrected ? '. Corrected.' : ''}`}
                    >
                      <Text style={[styles.listText, st?.corrected && { color: colors.green }]}>
                        {st?.corrected ? '✓' : `${i + 1}.`} [{ZONE_NAMES[d.zone]}] {d.label}
                      </Text>
                    </Pressable>
                  );
                })
              : null}
          </CiSection>

          {activeDefect && activeMistake ? (
            <View style={styles.workCard}>
              <Text style={styles.workHead}>
                FINDING {defects.indexOf(activeDefect) + 1} · {ZONE_NAMES[activeDefect.zone]}
              </Text>
              <Text style={styles.workLabel}>{activeDefect.label}</Text>
              {!activeState?.category ? (
                <>
                  <Text style={styles.workStep}>1 · CLASSIFY — what kind of problem is this?</Text>
                  <View style={styles.catGrid}>
                    {(Object.keys(CI_CATEGORY_META) as CiMistakeCategory[]).map((c) => (
                      <Pressable
                        key={c}
                        style={styles.catBtn}
                        onPress={() => classify(c)}
                        accessibilityRole="button"
                        accessibilityLabel={CI_CATEGORY_META[c].label}
                      >
                        <Text style={styles.catText}>
                          {CI_CATEGORY_META[c].icon} {CI_CATEGORY_META[c].label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : !activeState.corrected ? (
                <>
                  <Text style={[styles.workVerdict, { color: activeState.categorizedRight ? colors.green : colors.amberLabel }]}>
                    {activeState.categorizedRight
                      ? `✓ ${CI_CATEGORY_META[activeMistake.category].label}`
                      : `Logged under ${CI_CATEGORY_META[activeMistake.category].label} (you said ${activeState.category ? CI_CATEGORY_META[activeState.category].label : ''})`}
                    {'  ·  '}
                    {activeMistake.shortFeedback}
                  </Text>
                  <Text style={styles.workStep}>2 · CORRECT — what fixes it?</Text>
                  <View style={{ gap: 8 }}>
                    {corrections.map((c) => (
                      <Pressable key={c} style={styles.corrBtn} onPress={() => correct(c)} accessibilityRole="button" accessibilityLabel={c}>
                        <Text style={styles.corrText}>{c}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <RuleFeedback ruleId={activeMistake.ruleId} verdict="good" short={`Corrected — ${activeMistake.correction}`} openSources={openSources} />
              )}
            </View>
          ) : null}

          {processedCount >= required ? (
            <Pressable style={styles.passBtn} onPress={finishInspection} accessibilityRole="button" accessibilityLabel="Sign off the inspection">
              <Text style={styles.passText}>SIGN OFF THE INSPECTION ✓</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {phase === 'quiz' ? (
        <CiSection title={`KNOWLEDGE CHECK — ${quizSolved} / ${quiz.length}`}>
          <Text style={styles.lead}>
            Scenario judgment, not trivia. Wrong options are real technician mistakes — solve all {quiz.length} to
            complete the lab.
          </Text>
          {quiz.map((q) => (
            <CheckQuestion key={q.id} spec={q} onSolved={onQuizSolved} />
          ))}
        </CiSection>
      ) : null}

      {phase === 'done' ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneHead}>FINAL INSPECTION COMPLETE</Text>
          <Text style={styles.lead}>
            Inspection signed off and knowledge check passed. Press NEXT for your mastery profile and the field-check
            reward — or run another inspection attempt (a different defect draw) below.
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              seedRef.current = Date.now();
              setAttemptSeed(seedRef.current);
              setStates({});
              setActive(null);
              setPhase('inspect');
              quizSolvedRef.current = 0;
              setQuizSolved(0);
            }}
            accessibilityRole="button"
            accessibilityLabel="New inspection attempt with a different defect draw"
          >
            <Text style={styles.retryText}>NEW INSPECTION ATTEMPT ↻</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  listToggle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  listRow: { borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 10, paddingHorizontal: 11 },
  listRowDone: { borderColor: 'rgba(55,224,95,.35)' },
  listText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  workCard: { gap: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.5)', backgroundColor: '#151310', padding: 13 },
  workHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.5, color: colors.amberLabel },
  workLabel: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  workStep: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber },
  workVerdict: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#33333c', backgroundColor: '#1a1a1f', paddingVertical: 10, paddingHorizontal: 11, minHeight: 44, justifyContent: 'center' },
  catText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary },
  corrBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#131316', paddingVertical: 11, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  corrText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  passBtn: { alignItems: 'center', borderRadius: 10, backgroundColor: colors.green, paddingVertical: 13 },
  passText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.2, color: '#0a1a0f' },
  doneCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(55,224,95,.4)', backgroundColor: '#0d1a11', padding: 14 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.green },
  retryBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#17171c', paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
});
