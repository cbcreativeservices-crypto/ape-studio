/**
 * bits — the Game Audio lab's well furniture. Every page keeps the house's
 * five steps together under the pinned scene (the DJ Systems Lab's order):
 *
 *   1 UNDERSTAND       a short explanation, and the words on this screen
 *   2 EXPLORE          operate the controls
 *   3 LISTEN & OBSERVE hear the result and read the activity log
 *   4 PRACTICE         a guided task (goal chips that latch)
 *   5 CHECK YOURSELF   a short reasoning check
 *
 * WORDS ON THIS SCREEN are the glossary's own Game Audio terms, spelled as
 * the flashcards spell them (owner 2026-11-12: "matching glossary learning
 * terms"). A tapped term unfolds its meaning in place, in this lab's words,
 * and OPEN IN GLOSSARY shows the full entry.
 *
 * THE ACTIVITY LOG is the lab's instrument: what the game asked for, what
 * the audio side did, and why. It is read-only, so it lives in the well.
 *
 * Goals LATCH for the visit and are judged from the scene's real state,
 * never from a button press; a page marks itself done when all are met.
 * NEXT is never locked.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useGlossaryOpener } from '../../../features/glossary/glossaryLink';
import type { PageCtx } from '../kit/PagedLab';
import { useMarkWhen } from '../tuning/components/primitives';
import type { GaLogEntry, GaLogKind, GaState } from './model/gaModel';

export const STEP_TITLES = ['UNDERSTAND', 'EXPLORE', 'LISTEN & OBSERVE', 'PRACTICE', 'CHECK YOURSELF'] as const;

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
/** The first line of step 1: what the picture above shows, in plain words. */
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
/** A plain note; `mistake` is the page's common mistake; `said-once` is an
 *  honesty note about the model. */
export function Note({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'mistake' | 'try' }) {
  return (
    <View style={[styles.note, tone === 'mistake' && styles.noteMistake, tone === 'try' && styles.noteTry]}>
      {tone === 'mistake' ? <Text style={styles.noteHead}>A COMMON MISTAKE</Text> : null}
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

/* ── goals ──────────────────────────────────────────────────────────────── */

export type Goal = { label: string; hit: boolean };

/** Latch each goal the first time it is met during this visit; when all are
 *  met the page marks itself done (earned credit is never removed: a later
 *  visit starts with empty chips and only ever marks). */
export function useVisitGoals(ctx: PageCtx, goals: Goal[]): boolean[] {
  const seen = useRef<boolean[]>(goals.map(() => false));
  if (seen.current.length !== goals.length) seen.current = goals.map(() => false);
  seen.current = seen.current.map((was, i) => was || goals[i].hit);
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

/* ── the glossary's words ───────────────────────────────────────────────── */

/** `term` is the glossary entry's exact name; `def` is its meaning on THIS
 *  screen, in agreement with the glossary's plain English. */
export type Term = { term: string; def: string };

export function Terms({ items }: { items: readonly Term[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const openGlossary = useGlossaryOpener();
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
          {openGlossary ? (
            <Pressable onPress={() => openGlossary(t.term)} accessibilityRole="button" accessibilityLabel={`Open ${t.term} in the glossary`} style={styles.termLink}>
              <Text style={styles.termLinkText}>OPEN IN GLOSSARY ›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ── the activity log ───────────────────────────────────────────────────── */

const KIND_WORD: Record<GaLogKind, string> = {
  trigger: 'GAME',
  start: 'START',
  stop: 'STOP',
  value: 'VALUE',
  state: 'STATE',
  refused: 'REFUSED',
  failed: 'FAULT',
  mix: 'MIX',
  music: 'MUSIC',
  net: 'NETWORK',
  note: 'NOTE',
};
const KIND_COLOR: Record<GaLogKind, string> = {
  trigger: colors.amber,
  start: colors.greenBright,
  stop: colors.textSub,
  value: colors.cyanBright,
  state: colors.cyanBright,
  refused: colors.orange,
  failed: colors.red,
  mix: colors.purple,
  music: colors.programPurple,
  net: colors.cyan,
  note: colors.textMuted,
};

/** The newest lines of the activity log, newest first. Each line carries its
 *  KIND as a word (never colour alone) and the scene time it happened. */
export function ActivityLog({ state, lines = 6, only }: { state: GaState; lines?: number; only?: readonly GaLogKind[] }) {
  const rows: GaLogEntry[] = (only ? state.log.filter((l) => only.includes(l.kind)) : state.log).slice(-lines).reverse();
  return (
    <View style={styles.log} accessible accessibilityRole="summary" accessibilityLabel={`Activity log, newest first. ${rows.length ? rows.map((r) => `${KIND_WORD[r.kind]}: ${r.text}`).join('. ') : 'Nothing has happened yet.'}`}>
      <Text style={styles.logHead}>ACTIVITY LOG — NEWEST FIRST</Text>
      {rows.length === 0 ? <Text style={styles.logEmpty}>Nothing has happened yet. Use the controls at the bottom.</Text> : null}
      {rows.map((r) => (
        <View key={r.n} style={styles.logRow}>
          <Text style={styles.logTime}>{r.t.toFixed(1)}s</Text>
          <Text style={[styles.logKind, { color: KIND_COLOR[r.kind] }]}>{KIND_WORD[r.kind]}</Text>
          <Text style={styles.logText}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** The line on screen while a character speaks (dialogue always has text). */
export function Caption({ state }: { state: GaState }) {
  if (!state.caption) return null;
  return (
    <View style={styles.caption} accessibilityLiveRegion="polite">
      <Text style={styles.captionWho}>GUIDE</Text>
      <Text style={styles.captionText}>{state.caption.text}</Text>
    </View>
  );
}

/* ── a planted fault ────────────────────────────────────────────────────── */

/** TROUBLESHOOT: plant one wrong setting, let the learner find it with the
 *  log and the scene, and judge the fix from the scene's state. */
export function FaultCard({ title, symptom, armed, fixed, onStart, hints, why }: {
  title: string;
  symptom: string;
  /** The fault is planted right now. */
  armed: boolean;
  /** The learner planted it and has since put it right. */
  fixed: boolean;
  onStart: () => void;
  hints: readonly string[];
  why: string;
}) {
  const [shown, setShown] = useState(0);
  return (
    <View style={styles.fault}>
      <Text style={styles.faultHead}>TROUBLESHOOT · {title}</Text>
      <Text style={styles.p}>{symptom}</Text>
      {!armed && !fixed ? (
        <Pressable style={styles.faultBtn} onPress={onStart} accessibilityRole="button" accessibilityLabel="Start the fault">
          <Text style={styles.faultBtnText}>START THE FAULT</Text>
        </Pressable>
      ) : null}
      {armed ? (
        <>
          <Text style={styles.do}>The fault is in. Find it with the activity log and the controls, then put it right.</Text>
          {hints.slice(0, shown).map((h) => (
            <Text key={h} style={styles.noteText}>
              • {h}
            </Text>
          ))}
          {shown < hints.length ? (
            <Pressable style={styles.faultBtn} onPress={() => setShown((n) => n + 1)} accessibilityRole="button" accessibilityLabel="Show a hint">
              <Text style={styles.faultBtnText}>SHOW A HINT</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {fixed ? (
        <View style={styles.faultWhy} accessibilityLiveRegion="polite">
          <Text style={[styles.faultHead, { color: colors.green }]}>✓ FIXED</Text>
          <Text style={styles.p}>{why}</Text>
        </View>
      ) : null}
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
  note: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 4 },
  noteMistake: { borderColor: 'rgba(255,138,30,0.5)', backgroundColor: 'rgba(255,138,30,0.06)' },
  noteTry: { borderColor: 'rgba(111,168,255,0.45)', backgroundColor: 'rgba(111,168,255,0.06)' },
  noteHead: { color: colors.orange, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
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
  termDef: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 5 },
  termDefHead: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  termLink: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  termLinkText: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  log: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', padding: 10, gap: 6 },
  logHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  logEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13 },
  logRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  logTime: { width: 40, color: colors.textMutedDeep, fontFamily: fonts.mono, fontSize: 11, lineHeight: 17, textAlign: 'right' },
  logKind: { width: 56, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8, lineHeight: 17 },
  logText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  caption: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(111,168,255,0.5)', backgroundColor: 'rgba(111,168,255,0.07)', padding: 10, gap: 3 },
  captionWho: { color: '#9fd0ff', fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  captionText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20 },
  fault: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,94,0.45)', backgroundColor: 'rgba(255,107,94,0.05)', padding: 12, gap: 8 },
  faultHead: { color: '#ff6b5e', fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.4 },
  faultBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: colors.amber, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' },
  faultBtnText: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  faultWhy: { gap: 5 },
});

/** `✓ LABEL` when chosen: a chip says its state with a mark as well as its
 *  color (never color alone). */
export const marked = (label: string, on: boolean): string => (on ? `✓ ${label}` : label);
