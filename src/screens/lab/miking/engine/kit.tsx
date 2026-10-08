/**
 * Miking Labs kit — the reading and decision pieces every page uses. Prose,
 * card, point and takeaway are the Mastering Lab's own (re-exported, not
 * copied — the drumtuning/kit.tsx precedent).
 *
 *   ZoneCard        a SUGGESTED STARTING POINT in plain words: what it is,
 *                   the suggested range, what to listen for, what to check.
 *                   One consistent style (owner ruling 2026-10-04: no source
 *                   names, no SOURCED / TRIAL badges on screen).
 *   MikingScenarioCard  one scenario, judged BY VALUE; reports once, when the
 *                   right option is reached, with whether the FIRST pick was
 *                   right (a retry is explained, never penalised). A wrong
 *                   pick is answered with ITS OWN explanation (review M2).
 *   PredictCard     an ungraded prediction asked BEFORE an activity (try
 *                   before tell, review M1).
 *   OrderTaskCard   put a procedure's steps in order (the one-mic setup).
 *   SetupTaskCard   the final task: choose a setup (several pass) and the
 *                   reasons for it; feedback checks the reasoning.
 *   SymptomCard     a troubleshooting row: observation → first checks.
 *   NowLine         the scene's live summary in words — a screen-reader live
 *                   region only (the canvas strip shows the same facts to the
 *                   eye; review M5 cut the sighted duplicate).
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Card } from '../../mastering/kit';
import type { DocumentedZone, OrderTask, Prediction, SetupTask, Symptom, WhyWrong } from './model/types.ts';
import { gradeSetup, type SetupGrade } from './progress/setupGrade.ts';
import { hashText, optionOrder, shuffled } from './model/itemOrder.ts';

export { Body, Card, Point, SectionTitle, TakeawayCard, KeyButton } from '../../mastering/kit';

const BLUE = '#6fa8ff';

/** A suggested starting point, in plain words (owner ruling 2026-10-04). */
export function ZoneCard({ z }: { z: DocumentedZone }) {
  return (
    <View style={[styles.zone, { borderLeftColor: BLUE }]}>
      <Text style={styles.zoneKey}>SUGGESTED STARTING POINT</Text>
      <Text style={styles.zoneLabel}>{z.label}</Text>
      <Text style={styles.band}>{z.band}</Text>
      <Text style={styles.tendency}>{`LISTEN FOR · ${z.tendency}`}</Text>
      <Text style={styles.small}>{`CHECK · ${z.checks.join(' · ')}`}</Text>
    </View>
  );
}

export { shuffled } from './model/itemOrder.ts';

type Pickable = { id: string; prompt: string; options: readonly string[]; correct: string; explain: string; why?: WhyWrong };

export function MikingScenarioCard({ s, onAnswered, answered }: { s: Pickable; onAnswered: (firstRight: boolean) => void; answered?: boolean }) {
  const order = useMemo(() => optionOrder(s), [s]);
  const [picked, setPicked] = useState<string | null>(answered ? s.correct : null);
  const [wrong, setWrong] = useState<string[]>([]);
  const reported = useRef(!!answered);
  const firstWrong = useRef(false);
  const correct = picked === s.correct;
  const whyOf = (o: string) => s.why?.[o] ?? 'Not the best fit here. Choose again.';
  return (
    <Card tone="accent">
      <Text style={styles.q}>{s.prompt}</Text>
      <View style={{ gap: 6 }}>
        {order.map((i) => {
          const o = s.options[i];
          const isRight = correct && o === s.correct;
          const isWrongPick = picked === o && !correct;
          const wasWrong = wrong.includes(o);
          return (
            <Pressable
              key={o}
              disabled={correct}
              onPress={() => {
                const ok = o === s.correct;
                setPicked(o);
                if (!ok) {
                  setWrong((w) => (w.includes(o) ? w : [...w, o]));
                  firstWrong.current = true;
                }
                if (ok && !reported.current) {
                  reported.current = true;
                  onAnswered(!firstWrong.current);
                }
                AccessibilityInfo.announceForAccessibility?.(ok ? `Correct. ${s.explain}` : `Not this one. ${whyOf(o)} Choose again.`);
              }}
              style={[styles.opt, isRight && styles.optRight, isWrongPick && styles.optWrong, wasWrong && !isWrongPick && styles.optDim]}
              accessibilityRole="button"
              accessibilityState={{ disabled: correct, selected: picked === o }}
              accessibilityLabel={o}
            >
              <Text style={[styles.optText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <Text style={[styles.explain, { color: correct ? colors.green : colors.gold }]}>{correct ? `✓ ${s.explain}` : `✗ ${whyOf(picked)} Choose again.`}</Text>
      ) : null}
    </Card>
  );
}

export function ScenarioList({ items, answers, onAnswered }: { items: readonly Pickable[]; answers: Readonly<Record<string, boolean>>; onAnswered: (id: string, firstRight: boolean) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((s) => (
        <MikingScenarioCard key={s.id} s={s} answered={s.id in answers} onAnswered={(ok) => onAnswered(s.id, ok)} />
      ))}
    </View>
  );
}

export function SymptomCard({ s, answered, onAnswered }: { s: Symptom; answered: boolean; onAnswered: (firstRight: boolean) => void }) {
  return <MikingScenarioCard s={{ id: s.id, prompt: `OBSERVATION · ${s.observation}. What do you check first?`, options: s.options, correct: s.correct, explain: s.explain, why: s.why }} answered={answered} onAnswered={onAnswered} />;
}

/**
 * PREDICT FIRST (ungraded). Before the activity the learner commits to a
 * guess; afterwards the card collapses to one line and the page's own
 * explanation appears once the learner has TRIED it (the page gates that).
 */
export function PredictCard({ p, value, onPick }: { p: Prediction; value: string | null; onPick: (o: string) => void }) {
  if (value != null) {
    return (
      <Text style={styles.predicted} accessibilityRole="text">
        {`YOUR PREDICTION · ${value}. ${p.after}`}
      </Text>
    );
  }
  return (
    <View style={styles.predict}>
      <Text style={styles.predictHead}>PREDICT FIRST · not graded</Text>
      <Text style={styles.q}>{p.prompt}</Text>
      <View style={styles.predictRow}>
        {p.options.map((o) => (
          <Pressable key={o} onPress={() => onPick(o)} style={styles.predictOpt} accessibilityRole="button" accessibilityLabel={`Predict: ${o}`}>
            <Text style={styles.optText}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * PUT THE STEPS IN ORDER. The steps are shown shuffled; a tap on the step
 * that comes next places it; a tap on any other step is answered with why it
 * cannot come yet. Reports once, when every step is placed — first try right
 * when no step was tapped early. A retry is never penalised.
 */
export function OrderTaskCard({ t, answered, onAnswered }: { t: OrderTask; answered: boolean; onAnswered: (firstRight: boolean) => void }) {
  const order = useMemo(() => shuffled(t.steps.length, hashText(t.id)), [t]);
  const [placed, setPlaced] = useState(answered ? t.steps.length : 0);
  const [note, setNote] = useState<string | null>(null);
  const early = useRef(false);
  const reported = useRef(answered);
  const done = placed >= t.steps.length;
  return (
    <Card tone="accent">
      <Text style={styles.q}>{t.prompt}</Text>
      {placed > 0 ? (
        <View style={{ gap: 4 }}>
          {t.steps.slice(0, placed).map((st, i) => (
            <Text key={st.text} style={styles.placed}>{`${i + 1}. ${st.text}`}</Text>
          ))}
        </View>
      ) : null}
      {!done ? (
        <View style={{ gap: 6 }}>
          {order
            .filter((i) => i >= placed)
            .map((i) => {
              const st = t.steps[i];
              return (
                <Pressable
                  key={st.text}
                  onPress={() => {
                    if (i === placed) {
                      const next = placed + 1;
                      setPlaced(next);
                      setNote(null);
                      AccessibilityInfo.announceForAccessibility?.(`Step ${next} placed.`);
                      if (next >= t.steps.length && !reported.current) {
                        reported.current = true;
                        onAnswered(!early.current);
                      }
                    } else {
                      early.current = true;
                      setNote(`Not yet: ${st.early}`);
                      AccessibilityInfo.announceForAccessibility?.(`Not yet. ${st.early}`);
                    }
                  }}
                  style={styles.opt}
                  accessibilityRole="button"
                  accessibilityLabel={`Place next: ${st.text}`}
                >
                  <Text style={styles.optText}>{st.text}</Text>
                </Pressable>
              );
            })}
        </View>
      ) : null}
      {note ? <Text style={[styles.explain, { color: colors.gold }]}>{`✗ ${note}`}</Text> : null}
      {done ? <Text style={[styles.explain, { color: colors.green }]}>{`✓ ${t.explain}`}</Text> : null}
    </Card>
  );
}

/**
 * THE FINAL TASK (lesson L89): a brief; choose ONE setup (several pass), then
 * tick the reasons that justify it. CHECK grades the reasoning, never a
 * single fixed answer. Reports once, on the first passing check.
 */
export function SetupTaskCard({ t, answered, onAnswered }: { t: SetupTask; answered: boolean; onAnswered: (firstRight: boolean) => void }) {
  const [setupId, setSetupId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<ReadonlySet<string>>(() => new Set());
  const [result, setResult] = useState<SetupGrade | null>(null);
  const tries = useRef(0);
  const reported = useRef(answered);
  const toggle = (id: string) => {
    setResult(null);
    setReasons((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  return (
    <Card tone="accent">
      <Text style={styles.brief}>{t.brief}</Text>
      {answered && !result ? <Text style={[styles.explain, { color: colors.green }]}>✓ Done before — try another setup for practice if you like.</Text> : null}
      <Text style={styles.stepHead}>1 · CHOOSE A SETUP</Text>
      <View style={{ gap: 6 }}>
        {t.setups.map((s) => {
          const on = setupId === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                setSetupId(s.id);
                setResult(null);
              }}
              style={[styles.opt, on && styles.optOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={s.label}
            >
              <Text style={[styles.optText, on && { color: colors.amber }]}>{`${on ? '● ' : '○ '}${s.label}`}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.stepHead}>2 · TICK EVERY REASON THAT JUSTIFIES IT</Text>
      <View style={{ gap: 6 }}>
        {t.reasons.map((r) => {
          const on = reasons.has(r.id);
          return (
            <Pressable key={r.id} onPress={() => toggle(r.id)} style={[styles.opt, on && styles.optOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={r.label}>
              <Text style={[styles.optText, on && { color: colors.amber }]}>{`${on ? '☑ ' : '☐ '}${r.label}`}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => {
          const g = gradeSetup(t, setupId, reasons);
          setResult(g);
          if (setupId) tries.current += 1;
          if (g.pass && !reported.current) {
            reported.current = true;
            onAnswered(tries.current === 1);
          }
          AccessibilityInfo.announceForAccessibility?.(g.pass ? `Passes. ${t.explain}` : g.lines.filter((l) => !l.ok).map((l) => l.text).join(' '));
        }}
        style={styles.check}
        accessibilityRole="button"
        accessibilityLabel="Check my setup and reasons"
      >
        <Text style={styles.checkText}>CHECK MY REASONING</Text>
      </Pressable>
      {result ? (
        <View style={{ gap: 4 }}>
          {result.lines.map((l) => (
            <Text key={l.text} style={[styles.explain, { color: l.ok ? colors.green : colors.gold }]}>{`${l.ok ? '✓' : '✗'} ${l.text}`}</Text>
          ))}
          {result.pass ? <Text style={[styles.explain, { color: colors.green }]}>{`✓ ${t.explain}`}</Text> : null}
        </View>
      ) : null}
    </Card>
  );
}

/**
 * The scene's live summary in words (blueprint §9) — for a screen reader
 * only. The canvas strip and the bezel already show these facts to the eye;
 * printing them a third time in the well was the duplication review M5 cut.
 */
export function NowLine({ text }: { text: string }) {
  return (
    <Text style={styles.srOnly} accessibilityLiveRegion="polite" accessibilityLabel={`Now: ${text}`}>
      {`NOW · ${text}`}
    </Text>
  );
}

/** THE STANDARD LINE (owner 2026-10-06), word for word in every lesson: on
 *  MEET IT, STARTING SETUPS and the Placement Studio (journey.STANDARD_LINE). */
export function StandardLine({ text }: { text: string }) {
  return (
    <View style={styles.standard} accessibilityRole="text">
      <Text style={styles.standardKey}>STARTING POINTS</Text>
      <Text style={styles.standardText}>{text}</Text>
    </View>
  );
}

export function Landing({ looking, prompt }: { looking: string; prompt: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.landing}>{looking}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  return (
    <View style={[styles.note, tone === 'warn' && { borderLeftColor: colors.gold }, tone === 'ok' && { borderLeftColor: colors.green }]}>
      <Text style={[styles.noteText, tone === 'warn' && { color: colors.gold }, tone === 'ok' && { color: colors.green }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  standard: { gap: 3, borderWidth: 1, borderColor: 'rgba(255,198,77,0.45)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(255,198,77,0.07)' },
  standardKey: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  standardText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  zone: { borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  zoneKey: { color: '#8fbcff', fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  zoneLabel: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 18, flexShrink: 1 },
  band: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  tendency: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  opt: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f1d14' },
  optWrong: { borderColor: colors.red },
  optDim: { opacity: 0.55 },
  optOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  placed: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  brief: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19 },
  stepHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, marginTop: 4 },
  check: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.amber, marginTop: 4 },
  checkText: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1.2 },
  predict: { gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyan, borderRadius: 8, padding: 10 },
  predictHead: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  predictRow: { gap: 6 },
  predictOpt: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  predicted: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  srOnly: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
  landing: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, lineHeight: 15 },
  prompt: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19 },
  note: { borderLeftWidth: 2, borderLeftColor: colors.cyan, paddingLeft: 10, paddingVertical: 2 },
  noteText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
