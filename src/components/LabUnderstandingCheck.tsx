/**
 * The end-of-lab understanding check.
 *
 * ── THE PASS RULE (owner 2026-09-20) ────────────────────────────────────────
 * Every question correct, retry until you are. There is no score, no
 * percentage and no partial credit — the same shape as the Academy's study
 * gates, and the learner leaves having got everything right rather than having
 * scraped past.
 *
 * ⛔ SO A WRONG ANSWER IS NOT A FAILURE STATE. It is a question you have not
 * finished yet, and the copy says exactly that. Nothing here scolds, nothing
 * shows a red score, and the only summary is how many are still open. A test
 * that grants credit and also makes people feel stupid gets abandoned, and an
 * abandoned test blocks a credential.
 *
 * The explanation shows on EVERY answer, right or wrong — it is the teaching
 * moment, and hiding it on a correct answer would punish knowing the answer.
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StudioButton } from './StudioButton';
import type { UnderstandingQuestion } from '../features/lab/understanding';
import { colors, fonts } from '../theme/tokens';

/** Deterministic per question id: the options hold still across a re-render and
 *  a resume, but the authored order (which tends to put the answer first) is
 *  not what the learner sees. Same reasoning as the scenario option shuffle. */
function seededOrder(items: readonly string[], seed: string): string[] {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function LabUnderstandingCheck({
  labTitle,
  questions,
  onPassed,
  passed,
}: {
  labTitle: string;
  questions: readonly UnderstandingQuestion[];
  /** Fires ONCE, when the last question is answered correctly. */
  onPassed: () => void;
  /** Already passed on a previous visit — show the cleared state. */
  passed?: boolean;
}) {
  /** Question ids answered correctly. Correct-once: a right answer stays right
   *  even if the learner reopens the question to re-read the explanation. */
  const [correct, setCorrect] = useState<Set<string>>(() => new Set(passed ? questions.map((q) => q.id) : []));
  /** The option currently picked per question, for showing feedback. */
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [fired, setFired] = useState(!!passed);

  const remaining = questions.length - correct.size;
  const done = remaining === 0;

  const choose = useCallback(
    (q: UnderstandingQuestion, option: string) => {
      if (correct.has(q.id)) return; // already earned; re-reading is free
      setPicked((p) => ({ ...p, [q.id]: option }));
      if (option !== q.correct) return;
      setCorrect((prev) => {
        const next = new Set(prev);
        next.add(q.id);
        if (next.size === questions.length && !fired) {
          setFired(true);
          onPassed();
        }
        return next;
      });
    },
    [correct, questions.length, fired, onPassed],
  );

  return (
    <View style={s.wrap}>
      <Text style={s.eyebrow}>CHECK YOUR UNDERSTANDING</Text>
      <Text style={s.title}>{labTitle}</Text>
      <Text style={s.lead}>
        {done
          ? 'Every question answered correctly — this lab is complete.'
          : `Answer all ${questions.length} correctly to complete this lab. Get one wrong and you can try it again straight away; nothing is lost and there is no score.`}
      </Text>

      {!done ? (
        <Text style={s.remaining}>
          {remaining} of {questions.length} still to get right
        </Text>
      ) : null}

      {questions.map((q, i) => {
        const got = correct.has(q.id);
        const chose = picked[q.id];
        const wrong = !!chose && !got;
        const options = seededOrder(q.options, q.id);
        return (
          <View key={q.id} style={[s.card, got && s.cardDone]}>
            <View style={s.qHead}>
              <Text style={[s.qNum, got && s.qNumDone]}>{got ? '✓' : i + 1}</Text>
              <Text style={s.prompt}>{q.prompt}</Text>
            </View>
            <View style={s.options}>
              {options.map((opt) => {
                const isChosen = chose === opt;
                const isRight = got && opt === q.correct;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => choose(q, opt)}
                    disabled={got}
                    style={[s.opt, isRight && s.optRight, isChosen && !got && s.optWrong]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: got, selected: isChosen }}
                    accessibilityLabel={`${opt}${isRight ? '. Correct.' : isChosen ? '. Not right — try another.' : ''}`}
                  >
                    <Text style={[s.optText, isRight && s.optTextRight]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
            {/* Shown on EVERY answer. On a wrong one it is the nudge; on a
                right one it is the confirmation — hiding it would punish
                knowing the answer. */}
            {got || wrong ? (
              <View style={[s.explain, got ? s.explainOk : s.explainTry]}>
                <Text style={s.explainHead}>{got ? 'CORRECT' : 'NOT QUITE — TRY ANOTHER'}</Text>
                <Text style={s.explainBody}>{q.explanation}</Text>
              </View>
            ) : null}
          </View>
        );
      })}

      {done ? (
        <View style={s.doneCard}>
          <Text style={s.doneText}>
            Lab complete. It counts toward every certificate and program that requires it — you never need
            to take it twice.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Small read-only banner for a lab that has no authored check yet. Says so
 *  plainly rather than leaving the learner to wonder where the test is. */
export function UnderstandingPending() {
  return (
    <View style={s.pending}>
      <Text style={s.pendingHead}>NO CHECK YET</Text>
      <Text style={s.pendingBody}>
        This lab does not have its understanding check yet, so it cannot be marked complete. Everything in it is
        still yours to work through.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 12 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: colors.amber },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, color: colors.textPrimary },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  remaining: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.6, color: colors.amber },

  card: { borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, backgroundColor: '#141416', padding: 12, gap: 10 },
  cardDone: { borderColor: 'rgba(55,224,95,.35)', backgroundColor: '#0e1a12' },
  qHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  qNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, width: 18, textAlign: 'center', color: colors.textSubAlt },
  qNumDone: { color: '#37e05f' },
  prompt: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textPrimary },

  options: { gap: 6 },
  opt: { borderWidth: 1, borderColor: '#33343a', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#17171b' },
  optRight: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#11241a' },
  /* Amber, not red. A wrong answer is an unfinished question, not an error. */
  optWrong: { borderColor: 'rgba(255,180,0,.55)', backgroundColor: '#1d1708' },
  optText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  optTextRight: { color: '#9fe8b5' },

  explain: { borderRadius: 8, padding: 10, gap: 3 },
  explainOk: { backgroundColor: '#0d1f12', borderWidth: 1, borderColor: 'rgba(55,224,95,.3)' },
  explainTry: { backgroundColor: '#1d1708', borderWidth: 1, borderColor: 'rgba(255,180,0,.3)' },
  explainHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: colors.textSubAlt },
  explainBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },

  doneCard: { borderWidth: 1, borderColor: 'rgba(55,224,95,.4)', backgroundColor: '#0e1a12', borderRadius: 10, padding: 12 },
  doneText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: '#9fe8b5' },

  pending: { borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, backgroundColor: '#141416', padding: 12, gap: 4 },
  pendingHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.6, color: colors.textSubAlt },
  pendingBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
});
