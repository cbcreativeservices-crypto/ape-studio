/**
 * Drum Tuning Lab kit — the reading and decision pieces every chapter
 * uses. The prose, card, point, takeaway, key-term, key-button and
 * checklist pieces are the Mastering Lab's own (re-exported, not copied);
 * the scenario card and deck are local because this lab's scenarios are
 * keyed by CHAPTER, not by mastering module.
 *
 * COLOURS: every LEVEL readout is tinted with levelColorForDb — the
 * MIDI-velocity ramp the whole app uses. A peak readout is PEAK_RED.
 */
import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Card, KeyButton } from '../mastering/kit';
import type { DrumScenario } from './drumContent';

export { Body, Card, Checklist, CompareTable, KeyButton, KeyTerms, Kicker, PEAK_RED, Point, SectionTitle, TakeawayCard, levelTint } from '../mastering/kit';

/** Deterministic shuffle of option indices per scenario + mount. */
function shuffled(n: number, seed: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One scenario, one pick. Correct BY VALUE. The first pick is what the
 * chapter records (a retry is encouraged and explained, never penalised).
 * A wrong pick names THAT option as the one that does not fit and keeps the
 * card open; the full explanation is revealed by the correct pick.
 */
export function DrumScenarioCard({ s, onAnswered, keepOrder }: { s: DrumScenario; onAnswered?: (correct: boolean) => void; keepOrder?: boolean }) {
  const seed = useRef(Math.floor(Math.random() * 0x7fffffff)).current;
  const order = useMemo(() => (keepOrder ? s.options.map((_, i) => i) : shuffled(s.options.length, seed ^ s.id.length)), [s, seed, keepOrder]);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const reported = useRef(false);
  const correct = picked === s.correct;
  return (
    <Card tone="accent">
      <Text style={styles.q}>{s.prompt}</Text>
      <View style={{ gap: 6 }}>
        {order.map((i) => {
          const o = s.options[i];
          const isRight = picked != null && correct && o === s.correct;
          const isWrongPick = picked === o && !correct;
          const wasWrong = wrongPicks.includes(o);
          return (
            <Pressable
              key={o}
              disabled={picked != null && correct}
              onPress={() => {
                const ok = o === s.correct;
                setPicked(o);
                if (!ok) setWrongPicks((w) => (w.includes(o) ? w : [...w, o]));
                if (!reported.current) {
                  reported.current = true;
                  onAnswered?.(ok);
                }
                AccessibilityInfo.announceForAccessibility?.(ok ? 'Correct.' : `${o}: not the best fit. Choose again.`);
              }}
              style={[styles.opt, isRight && styles.optRight, isWrongPick && styles.optWrong, wasWrong && !isWrongPick && styles.optDim]}
              accessibilityRole="button"
              accessibilityState={{ disabled: picked != null && correct, selected: picked === o }}
              aria-pressed={picked === o}
              accessibilityLabel={o}
            >
              <Text style={[styles.optText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }, wasWrong && !isWrongPick && { color: colors.textMuted }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <Text style={[styles.explain, { color: correct ? colors.green : colors.gold }]}>
          {correct ? `✓ ${s.explain}` : `✗ "${picked}" is not the best fit here. Choose again; the full explanation appears with the option that fits.`}
        </Text>
      ) : null}
    </Card>
  );
}

/** A PRACTICE deck: one scenario at a time, every card kept mounted. */
export function DrumScenarioDeck({ scenarios, onAnswered, keepOrder, intro }: {
  scenarios: readonly DrumScenario[];
  onAnswered: (scenarioId: string, correct: boolean) => void;
  keepOrder?: boolean;
  intro?: string;
}) {
  const [cur, setCur] = useState(0);
  const n = scenarios.length;
  const i = Math.min(cur, Math.max(0, n - 1));
  return (
    <View style={{ gap: 10 }}>
      {intro ? <Body>{intro}</Body> : null}
      <View style={styles.deckBar}>
        <Text style={styles.deckCount}>{`CARD ${i + 1} OF ${n}`}</Text>
        <Text style={styles.deckRule}>Your FIRST answer on each card is the one recorded. A retry is explained, never penalised.</Text>
      </View>
      {scenarios.map((s, k) => (
        <View key={s.id} style={k === i ? null : styles.hidden} accessibilityElementsHidden={k !== i} importantForAccessibility={k === i ? 'auto' : 'no-hide-descendants'}>
          <DrumScenarioCard s={s} keepOrder={keepOrder} onAnswered={(ok) => onAnswered(s.id, ok)} />
        </View>
      ))}
      <View style={styles.deckKeys}>
        <KeyButton label="‹ PREV CARD" onPress={() => setCur((c) => Math.max(0, c - 1))} disabled={i === 0} />
        <KeyButton label="NEXT CARD ›" onPress={() => setCur((c) => Math.min(n - 1, c + 1))} disabled={i >= n - 1} tint={colors.green} />
      </View>
    </View>
  );
}

/** The HEAR page's STATUS LINE: the dock keys are the only transport; the
 *  well reports what is happening. One sentence, live. */
export function DrumStatus({ playing, pending, rendering, idle, label }: { playing: boolean; pending: boolean; rendering: boolean; idle: string; label: string }) {
  const text = rendering || pending ? `rendering ${label} — real offline synthesis, one moment…` : playing ? `sounding ${label}` : idle;
  return (
    <Text style={styles.status} accessibilityLiveRegion="polite">
      {text.toUpperCase()}
    </Text>
  );
}

/** A live feedback line (the "one area is noticeably higher" sentence). */
export function Feedback({ tone, children }: { tone: 'ok' | 'warn' | 'info'; children: string }) {
  return (
    <View style={[styles.feedback, tone === 'ok' && styles.feedbackOk, tone === 'warn' && styles.feedbackWarn]}>
      <Text style={[styles.feedbackText, tone === 'ok' && { color: colors.green }, tone === 'warn' && { color: colors.gold }]}>{children}</Text>
    </View>
  );
}

export const fmtHz = (hz: number | null | undefined): string => (hz == null || !Number.isFinite(hz) ? '—' : hz >= 1000 ? `${(hz / 1000).toFixed(2)} k` : hz.toFixed(hz < 100 ? 1 : 0));

/** The nearest note name — OPTIONAL in this lab, offered as a reference. */
export function noteName(hz: number): string {
  if (!Number.isFinite(hz) || hz <= 0) return '—';
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const n = Math.round(12 * Math.log2(hz / 440) + 69);
  const cents = Math.round(1200 * Math.log2(hz / (440 * Math.pow(2, (n - 69) / 12))));
  return `${names[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}${cents ? ` ${cents > 0 ? '+' : ''}${cents}¢` : ''}`;
}

const styles = StyleSheet.create({
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  opt: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f1d14' },
  optWrong: { borderColor: colors.red },
  optDim: { borderColor: colors.hairline, opacity: 0.55 },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  hidden: { display: 'none' },
  deckBar: { gap: 2 },
  deckCount: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2 },
  deckRule: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  deckKeys: { flexDirection: 'row', gap: 8 },
  status: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, lineHeight: 15 },
  feedback: { borderLeftWidth: 2, borderLeftColor: colors.cyan, paddingLeft: 10, paddingVertical: 2 },
  feedbackOk: { borderLeftColor: colors.green },
  feedbackWarn: { borderLeftColor: colors.gold },
  feedbackText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
});
