/**
 * Lesson 8 — Selecting the Correct Cable (owner spec §5.8).
 * Fourteen guided source→destination scenarios from data/lesson08.ts, each
 * stepped through 3–4 selection decisions (what travels → connector →
 * construction/class → special requirement). Tap-only, tri-state verdicts
 * (glyph + words + color), retry-until-correct; valid alternates land as
 * “Also defensible” with the trade-off explained (owner mandate: accept all
 * valid answers).
 *
 * Per-scenario progress is lifted to this body component keyed by scenario
 * id, so switching scenarios never loses progress. Completion credit is
 * marked ONLY at the moment the 14th scenario’s final step is genuinely
 * solved (markLabUnit → af_cables/l08_selection; §1.7 honesty — never on
 * view, never on mount).
 */
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { L08_LESSON, SELECTION_SCENARIOS } from '../data/lesson08';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  type Verdict,
} from './bits';

type ScenarioState = {
  /** Index of the step currently being answered (0-based). */
  step: number;
  picked: string | null;
  verdict: Verdict | null;
  done: boolean;
};

const fresh = (): ScenarioState => ({ step: 0, picked: null, verdict: null, done: false });

export function Lesson08Body() {
  const [activeId, setActiveId] = useState(SELECTION_SCENARIOS[0].id);
  // All scenario progress lives here, keyed by scenario id — switching
  // scenarios never loses a solved step.
  const [states, setStates] = useState<Record<string, ScenarioState>>({});

  const scenario = SELECTION_SCENARIOS.find((sc) => sc.id === activeId) ?? SELECTION_SCENARIOS[0];
  const st = states[scenario.id] ?? fresh();
  const step = scenario.steps[Math.min(st.step, scenario.steps.length - 1)];
  const solvedThis = st.verdict === 'correct' || st.verdict === 'accepted';
  const doneCount = SELECTION_SCENARIOS.reduce((n, sc) => n + (states[sc.id]?.done ? 1 : 0), 0);
  const allDone = doneCount === SELECTION_SCENARIOS.length;

  const pick = useCallback(
    (opt: string) => {
      if (st.done || solvedThis) return;
      const verdict: Verdict = opt === step.correct ? 'correct' : step.accept?.includes(opt) ? 'accepted' : 'wrong';
      setStates((prev) => ({
        ...prev,
        [scenario.id]: { ...(prev[scenario.id] ?? fresh()), picked: opt, verdict },
      }));
    },
    [st.done, solvedThis, step, scenario.id],
  );

  const next = useCallback(() => {
    const cur = states[scenario.id] ?? fresh();
    if (cur.step >= scenario.steps.length - 1) {
      const updated: Record<string, ScenarioState> = {
        ...states,
        [scenario.id]: { ...cur, done: true, picked: null, verdict: null },
      };
      setStates(updated);
      if (SELECTION_SCENARIOS.every((sc) => updated[sc.id]?.done)) {
        // Genuine solve of all 14 scenarios → lesson unit credit (R6c
        // honesty: marked here and nowhere else).
        markLabUnit('af_cables', 'l08_selection');
      }
      return;
    }
    setStates({ ...states, [scenario.id]: { step: cur.step + 1, picked: null, verdict: null, done: false } });
  }, [states, scenario]);

  const goNextUnsolved = useCallback(() => {
    const target = SELECTION_SCENARIOS.find((sc) => !(states[sc.id]?.done ?? false));
    if (target) setActiveId(target.id);
  }, [states]);

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text={`FOURTEEN CONNECTIONS TO CABLE · ${doneCount} OF ${SELECTION_SCENARIOS.length} SOLVED`} />
      <Text style={s.body}>
        Every connection below is cabled the same way: name what travels, choose the connector, choose the construction,
        then meet the requirement that makes it reliable and safe. Tap a connection to work it — ✓ marks solved ones, and
        progress is kept when you switch.
      </Text>
      <View style={s.chipWrap}>
        {SELECTION_SCENARIOS.map((sc) => (
          <OptionChip
            key={sc.id}
            label={states[sc.id]?.done ? `✓ ${sc.chip}` : sc.chip}
            active={sc.id === activeId}
            onPress={() => setActiveId(sc.id)}
          />
        ))}
      </View>

      {!allDone ? (
        <>
          <Eyebrow
            text={
              st.done
                ? 'CONNECTION SOLVED'
                : `DECISION ${Math.min(st.step + 1, scenario.steps.length)} OF ${scenario.steps.length}`
            }
          />
          {/* ART SLOT: owner-supplied scenario illustration (source and
              destination equipment with the chosen connectors) mounts here
              once delivered — nothing renders until then. */}
          <DetailCard>
            <Text style={s.cardTitle}>{`${scenario.from}  →  ${scenario.to}`}</Text>
            {st.done ? (
              <Text style={s.body}>
                Solved — every decision on this connection is one you can defend. Pick the next connection above.
              </Text>
            ) : (
              <>
                <Text style={s.body}>{step.prompt}</Text>
                <Text style={s.hint}>Wrong picks stay open — keep trying until it is defensible.</Text>
                <View style={s.chipWrap}>
                  {step.options.map((opt) => (
                    <OptionChip
                      key={opt}
                      label={opt}
                      active={st.picked === opt}
                      onPress={() => pick(opt)}
                      disabled={solvedThis && st.picked !== opt}
                    />
                  ))}
                </View>
              </>
            )}
          </DetailCard>
          {!st.done && st.verdict ? (
            <VerdictBanner verdict={st.verdict} text={st.verdict === 'wrong' ? step.hint : step.explain} />
          ) : null}
          {!st.done && solvedThis ? (
            <OptionChip
              label={st.step >= scenario.steps.length - 1 ? 'SOLVE CONNECTION ✓' : 'NEXT DECISION ›'}
              active
              onPress={next}
            />
          ) : null}
          {st.done ? <OptionChip label="NEXT CONNECTION ›" active onPress={goNextUnsolved} /> : null}
        </>
      ) : (
        <CheckDoneBanner text="All fourteen connections cabled with defensible choices — what travels, the connector, the construction, and the requirement that keeps each one reliable and safe." />
      )}

      <LessonBanner text={L08_LESSON} />
    </>
  );
}
