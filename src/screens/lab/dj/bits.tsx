/**
 * bits — the DJ Systems Lab's well furniture. Every screen keeps the owner's
 * five steps together under the pinned booth (OWNER_24_SCREEN_OUTLINE):
 *
 *   1 UNDERSTAND      a short explanation
 *   2 EXPLORE         identify the parts and operate the controls
 *   3 LISTEN & OBSERVE hear the result and read the meters
 *   4 PRACTICE        a guided task (goal chips that latch)
 *   5 CHECK YOURSELF  a short independent challenge (+ a small
 *                     troubleshooting exercise where it belongs)
 *
 * Definitions open INLINE (`Terms`): a tapped term unfolds in place, so the
 * booth, its settings and the reading position are never disturbed.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useMarkWhen } from '../tuning/components/primitives';
import type { PageCtx } from '../kit/PagedLab';

export const STEP_TITLES = ['UNDERSTAND', 'EXPLORE', 'LISTEN & OBSERVE', 'PRACTICE', 'CHECK YOURSELF'] as const;

/** One of the five steps, numbered. */
export function Step({ n, children }: { n: 1 | 2 | 3 | 4 | 5; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHead} accessibilityRole="header">
        <View style={styles.stepNum}>
          <Text style={styles.stepNumText}>{n}</Text>
        </View>
        <Text style={styles.stepTitle}>{STEP_TITLES[n - 1]}</Text>
      </View>
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

/** The first line of Step 1: what the picture above shows, in plain words
 *  (the canvas's own accessibility description, for every reader). */
export function Look({ children }: { children: ReactNode }) {
  return (
    <View style={styles.look}>
      <Text style={styles.lookText}>{children}</Text>
    </View>
  );
}

/** A prompt: what to do now. */
export function Do({ children }: { children: ReactNode }) {
  return <Text style={styles.do}>{children}</Text>;
}

/** An honest note about a real-world limit, in plain words. */
export function Note({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'safety' | 'try' }) {
  return (
    <View style={[styles.note, tone === 'safety' && styles.noteSafety, tone === 'try' && styles.noteTry]}>
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

/* ── goals (latch once met; all met → the page marks itself done) ──────── */

export type Goal = { label: string; hit: boolean };

export function useVisitGoals(ctx: PageCtx, goals: Goal[]): boolean[] {
  const seen = useRef<boolean[]>(goals.map(() => ctx.isDone));
  if (ctx.isDone && !seen.current.every(Boolean)) seen.current = goals.map(() => true);
  if (seen.current.length !== goals.length) seen.current = goals.map((_, i) => seen.current[i] ?? false);
  goals.forEach((g, i) => {
    if (g.hit) seen.current[i] = true;
  });
  const all = seen.current.every(Boolean);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return [...seen.current];
}

export function GoalChips({ goals, latched }: { goals: Goal[]; latched: boolean[] }) {
  return (
    <View style={styles.chips} accessibilityRole="list">
      {goals.map((g, i) => (
        <View key={g.label} style={[styles.chip, latched[i] && styles.chipDone]} accessible accessibilityLabel={`${g.label}: ${latched[i] ? 'done' : 'not yet'}`}>
          <Text style={[styles.chipText, latched[i] && { color: colors.green }]}>
            {latched[i] ? '✓ ' : '○ '}
            {g.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── inline definitions ───────────────────────────────────────────────── */

export type Term = { term: string; def: string };

export function Terms({ items }: { items: readonly Term[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const t = items.find((x) => x.term === open);
  return (
    <View style={styles.terms}>
      <Text style={styles.termsHead}>WORDS ON THIS SCREEN — TAP ONE</Text>
      <View style={styles.chips}>
        {items.map((x) => (
          <Pressable
            key={x.term}
            onPress={() => setOpen((o) => (o === x.term ? null : x.term))}
            style={[styles.termChip, open === x.term && styles.termChipOpen]}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === x.term }}
            accessibilityLabel={`${x.term}. ${open === x.term ? 'Hide' : 'Show'} the meaning.`}
          >
            <Text style={[styles.termChipText, open === x.term && { color: colors.amber }]}>{x.term}</Text>
          </Pressable>
        ))}
      </View>
      {t ? (
        <View style={styles.termDef} accessibilityLiveRegion="polite">
          <Text style={styles.termDefHead}>{t.term}</Text>
          <Text style={styles.p}>{t.def}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ── a small troubleshooting exercise ─────────────────────────────────── */

/**
 * A FAULT the booth now has (seeded by `start`), its symptom in words, hints
 * one at a time, and the answer once the booth itself shows it fixed
 * (`fixed` is a predicate over the live booth — the learner repairs it with
 * the same controls, never by ticking a box).
 */
export function FaultCard({ title, symptom, start, fixed, hints, why, onFixed }: {
  title: string;
  symptom: string;
  start: () => void;
  fixed: boolean;
  hints: readonly string[];
  why: string;
  onFixed?: () => void;
}) {
  const [on, setOn] = useState(false);
  const [shown, setShown] = useState(0);
  const solved = on && fixed;
  const fired = useRef(false);
  useMarkWhen(solved, () => {
    if (!fired.current) {
      fired.current = true;
      onFixed?.();
    }
  });
  return (
    <View style={[styles.fault, solved && styles.faultDone]}>
      <Text style={styles.faultHead}>{`TROUBLESHOOT · ${title}`}</Text>
      {!on ? (
        <>
          <Text style={styles.p}>Something will go wrong in the booth. Find it with the meters, the drawing and your ears, then fix it with the controls.</Text>
          <Pressable
            style={styles.faultBtn}
            onPress={() => {
              start();
              setOn(true);
              setShown(0);
              fired.current = false;
            }}
            accessibilityRole="button"
            accessibilityLabel="Start the fault"
          >
            <Text style={styles.faultBtnText}>START THE FAULT</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.symptom}>{`Symptom: ${symptom}`}</Text>
          {hints.slice(0, shown).map((h, i) => (
            <Text key={i} style={styles.hint}>{`Hint ${i + 1}: ${h}`}</Text>
          ))}
          {solved ? (
            <Text style={styles.fixed}>{`Fixed. ${why}`}</Text>
          ) : shown < hints.length ? (
            <Pressable style={styles.faultBtn} onPress={() => setShown((s) => s + 1)} accessibilityRole="button" accessibilityLabel="Show a hint">
              <Text style={styles.faultBtnText}>SHOW A HINT</Text>
            </Pressable>
          ) : null}
          {solved ? (
            <Pressable
              style={styles.faultBtn}
              onPress={() => {
                setOn(false);
                setShown(0);
                fired.current = false;
              }}
              accessibilityRole="button"
              accessibilityLabel="Practise this fault again"
            >
              <Text style={styles.faultBtnText}>PRACTISE AGAIN</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { borderRadius: 12, borderWidth: 1, borderColor: '#24242a', backgroundColor: '#101013', padding: 12, gap: 8 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12 },
  stepTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.6 },
  stepBody: { gap: 8 },
  p: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21 },
  do: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 21 },
  look: { borderLeftWidth: 2, borderLeftColor: colors.amber, paddingLeft: 9 },
  lookText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  note: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10 },
  noteSafety: { borderColor: 'rgba(255,107,94,0.5)', backgroundColor: 'rgba(255,107,94,0.06)' },
  noteTry: { borderColor: 'rgba(111,168,255,0.45)', backgroundColor: 'rgba(111,168,255,0.06)' },
  noteText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 9, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  chipDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.8 },
  terms: { gap: 8 },
  termsHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  termChip: { borderRadius: 14, borderWidth: 1, borderColor: '#34343c', paddingHorizontal: 10, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  termChipOpen: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,0.08)' },
  termChipText: { color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 13 },
  termDef: { borderRadius: 9, borderLeftWidth: 2, borderLeftColor: colors.amber, backgroundColor: '#121215', padding: 10, gap: 4 },
  termDefHead: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8 },
  fault: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,94,0.45)', backgroundColor: 'rgba(255,107,94,0.05)', padding: 12, gap: 8 },
  faultDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  faultHead: { color: '#ff8a7e', fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  symptom: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 21 },
  hint: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  fixed: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  faultBtn: { alignSelf: 'flex-start', borderRadius: 9, borderWidth: 1, borderColor: '#3a3a44', paddingVertical: 9, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
  faultBtnText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.9 },
});
