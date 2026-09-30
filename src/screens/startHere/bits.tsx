/**
 * Start Here — the small reading and practice pieces the pages share.
 *
 *   TermChips / TermSheet — a word's plain meaning in place (a centred popup,
 *     never a navigation), with the FULL glossary entry one tap further in the
 *     same popup (GlossaryTermPopup, `embedded` — ⛔ a second Modal raised from
 *     inside a Modal draws BEHIND it on Android). The learner never loses the
 *     page they were on.
 *   SortExercise — the two-bin sorter (Sound or audio? / Measured or heard?).
 *   OrderExercise — put the signal path in order.
 *   RevealList — tap a question to reveal the answer (the lab's reflection).
 *   Para / Lead — reading text.
 *
 * Everything here is USER-INITIATED: nothing auto-appears (Low-Light
 * Production Mode), no timers, no entrance animation. Smallest text 11 pt.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { starterGlossaryEntry } from '../../features/startHere/startHereGlossary';
import { GlossaryTermPopup } from '../../features/glossary/GlossaryTermPopup';
import { colors, fonts } from '../../theme/tokens';
import { popupCard } from '../../theme/readingColumn';
import {
  TERM_GROUPS,
  termById,
  type SortExercise,
  type StarterTerm,
} from '../../features/startHere/startHereContent';

// ─────────────────────────────────────────────────────────────────────────────
// Words

/** Opens the term popup from anywhere inside the Start Here screen. */
export const TermOpenCtx = createContext<((id: string) => void) | null>(null);

export function useOpenTerm(): (id: string) => void {
  return useContext(TermOpenCtx) ?? (() => {});
}

/** The screen-level holder: one popup for the whole screen. */
export function TermSheetHost({ children }: { children: ReactNode }) {
  const [termId, setTermId] = useState<string | null>(null);
  return (
    <TermOpenCtx.Provider value={setTermId}>
      {children}
      <TermSheet termId={termId} onClose={() => setTermId(null)} />
    </TermOpenCtx.Provider>
  );
}

export function TermSheet({ termId, onClose }: { termId: string | null; onClose: () => void }) {
  const t = termId ? termById(termId) : undefined;
  // The full glossary entry opens INSIDE this popup (embedded), so closing it
  // lands back on the short meaning, and closing that lands back on the page.
  const [full, setFull] = useState<string | null>(null);
  const close = () => {
    setFull(null);
    onClose();
  };
  return (
    <Modal visible={!!t} transparent animationType="fade" onRequestClose={() => (full ? setFull(null) : close())} accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={close} accessible={false}>
        <Pressable style={styles.sheet} onPress={() => {}} accessible={false}>
          {t ? <TermBody t={t} onFull={() => t.glossary && setFull(t.glossary)} /> : null}
          <Pressable onPress={close} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="Done — back to the lesson">
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </Pressable>
        {full ? <GlossaryTermPopup embedded termName={full} preloaded={starterGlossaryEntry(full)} onClose={() => setFull(null)} /> : null}
      </Pressable>
    </Modal>
  );
}

function TermBody({ t, onFull }: { t: StarterTerm; onFull: () => void }) {
  const group = TERM_GROUPS.find((g) => g.id === t.group);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sheetEyebrow}>STARTER WORD · {group?.title.toUpperCase()}</Text>
      <Text style={styles.sheetTerm} accessibilityRole="header">
        {t.term}
      </Text>
      <Text style={styles.sheetDef}>{t.def}</Text>
      {t.note ? <Text style={styles.sheetNote}>{t.note}</Text> : null}
      {t.glossary ? (
        <Pressable onPress={onFull} style={styles.fullBtn} accessibilityRole="button" accessibilityLabel={`Open the full glossary entry: ${t.glossary}`}>
          <Text style={styles.fullBtnText} numberOfLines={2}>
            FULL GLOSSARY ENTRY · {t.glossary} ›
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.sheetGap}>{t.glossaryGap}</Text>
      )}
    </View>
  );
}

/** "Words on this page" — tappable chips. */
export function TermChips({ ids, title = 'WORDS ON THIS PAGE' }: { ids: readonly string[]; title?: string }) {
  const open = useOpenTerm();
  const terms = useMemo(() => ids.map((id) => termById(id)).filter((t): t is StarterTerm => !!t), [ids]);
  if (terms.length === 0) return null;
  return (
    <View style={styles.chipsWrap}>
      <Text style={styles.chipsTitle}>{title}</Text>
      <View style={styles.chips}>
        {terms.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => open(t.id)}
            style={styles.chip}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${t.term}. Show what it means`}
          >
            <Text style={styles.chipText}>{t.term}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading

export function Lead({ children }: { children: string }) {
  return <Text style={styles.lead}>{children}</Text>;
}

export function Para({ children }: { children: string }) {
  // An ALL-CAPS opening word ("SOURCE — …") reads as a term heading.
  const m = /^([A-Z][A-Z ]{2,})( — )(.*)$/s.exec(children);
  if (m) {
    return (
      <Text style={styles.para}>
        <Text style={styles.paraKey}>{m[1]}</Text>
        {m[2]}
        {m[3]}
      </Text>
    );
  }
  return <Text style={styles.para}>{children}</Text>;
}

export function Card({ children, tint }: { children: ReactNode; tint?: string }) {
  return <View style={[styles.card, tint ? { borderColor: tint } : null]}>{children}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice

/** Two bins. Every item can be answered in any order; a wrong pick says why
 *  and lets you try again. Nothing is held: the page's NEXT never waits. */
export function SortExerciseView({ ex, onAllDone }: { ex: SortExercise; onAllDone?: () => void }) {
  const [answers, setAnswers] = useState<Record<number, 0 | 1 | undefined>>({});
  /** The bin last picked WRONGLY per item — marked amber until fixed. */
  const [wrong, setWrong] = useState<Record<number, 0 | 1 | undefined>>({});
  // Shuffled once per mount so the answers never fall into a pattern.
  const [order] = useState(() => {
    const idx = ex.items.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const doneCount = ex.items.filter((it, i) => answers[i] === it.bin).length;
  // All sorted → tell the page, from an effect (bug pass 2026-09-30). It used
  // to be called INSIDE the setAnswers updater: a side effect in an updater
  // runs whenever React replays it (twice under StrictMode) and sets the
  // SCREEN's state while this component renders.
  const allDone = doneCount === ex.items.length;
  const onAllDoneRef = useRef(onAllDone);
  onAllDoneRef.current = onAllDone;
  useEffect(() => {
    if (allDone) onAllDoneRef.current?.();
  }, [allDone]);
  const pick = (i: number, bin: 0 | 1) => {
    if (answers[i] === ex.items[i].bin) return;
    if (bin === ex.items[i].bin) {
      setAnswers((a) => ({ ...a, [i]: bin }));
      setWrong((w) => ({ ...w, [i]: undefined }));
    } else {
      setWrong((w) => ({ ...w, [i]: bin }));
    }
  };
  return (
    <Card tint="rgba(127,212,255,.45)">
      <Text style={styles.exEyebrow}>PRACTICE · {doneCount} OF {ex.items.length}</Text>
      <Text style={styles.exPrompt}>{ex.prompt}</Text>
      {order.map((i) => {
        const it = ex.items[i];
        const ok = answers[i] === it.bin;
        return (
          <View key={i} style={[styles.sortRow, ok && styles.sortRowOk]}>
            <Text style={styles.sortText}>{it.text}</Text>
            <View style={styles.sortBtns}>
              {ex.bins.map((b, bi) => {
                const chosen = ok && it.bin === bi;
                const missed = !ok && wrong[i] === bi;
                return (
                  <Pressable
                    key={b}
                    onPress={() => pick(i, bi as 0 | 1)}
                    style={[styles.binBtn, chosen && styles.binBtnOk, missed && styles.binBtnMiss]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: chosen }}
                    accessibilityLabel={`${it.text}: ${b}`}
                  >
                    <Text style={[styles.binText, chosen && styles.binTextOk]}>{b}</Text>
                  </Pressable>
                );
              })}
            </View>
            {ok ? <Text style={styles.sortWhy}>✓ {it.why}</Text> : wrong[i] != null ? <Text style={styles.sortHint}>{ex.hint}</Text> : null}
          </View>
        );
      })}
    </Card>
  );
}

/** Put a list in order: tap the items in sequence. A wrong tap shakes
 *  nothing and blocks nothing — it just says which one comes next. */
export function OrderExerciseView({ prompt, steps, onDone }: { prompt: string; steps: readonly string[]; onDone?: () => void }) {
  // Shuffled once per mount; duplicates ("Cable" twice) are interchangeable.
  const [pool] = useState(() => {
    const idx = steps.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const [placed, setPlaced] = useState<number[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const next = placed.length;
  const tap = (i: number) => {
    if (placed.includes(i) || next >= steps.length) return;
    if (steps[i] === steps[next]) {
      const p = [...placed, i];
      setPlaced(p);
      setMiss(null);
      if (p.length === steps.length) onDone?.();
    } else {
      setMiss(`Not yet — “${steps[i]}” comes later. What does the signal reach next?`);
    }
  };
  const done = next >= steps.length;
  return (
    <Card tint="rgba(127,212,255,.45)">
      <Text style={styles.exEyebrow}>PRACTICE · {Math.min(next, steps.length)} OF {steps.length}</Text>
      <Text style={styles.exPrompt}>{prompt}</Text>
      <View style={styles.orderPath}>
        {placed.map((i, k) => (
          <Text key={k} style={styles.orderPlaced}>
            {k > 0 ? '→ ' : ''}
            {steps[i]}
          </Text>
        ))}
        {!done ? <Text style={styles.orderNext}>{placed.length > 0 ? '→ ' : ''}?</Text> : null}
      </View>
      <View style={styles.orderPool}>
        {pool.map((i) => {
          const used = placed.includes(i);
          return (
            <Pressable
              key={i}
              onPress={() => tap(i)}
              disabled={used}
              style={[styles.poolBtn, used && styles.poolBtnUsed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: used }}
              accessibilityLabel={used ? `${steps[i]}, placed` : steps[i]}
            >
              <Text style={[styles.poolText, used && { color: colors.textMuted }]}>{steps[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      {done ? (
        <Text style={styles.sortWhy}>✓ That’s the whole path: sound in at the microphone, signal through the cables and mixer, sound out at the speaker.</Text>
      ) : miss ? (
        <Text style={styles.sortHint}>{miss}</Text>
      ) : null}
      {placed.length > 0 ? (
        <Pressable onPress={() => { setPlaced([]); setMiss(null); }} style={styles.resetLink} accessibilityRole="button" accessibilityLabel="Start the order again">
          <Text style={styles.resetText}>START AGAIN</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

/** Tap a question to see the answer — for reflection, not a test. */
export function RevealList({ items }: { items: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  return (
    <Card tint="rgba(180,91,255,.45)">
      <Text style={[styles.exEyebrow, { color: '#c98bff' }]}>THINK IT THROUGH · TAP TO CHECK</Text>
      {items.map((it, i) => (
        <Pressable
          key={i}
          onPress={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
          style={styles.revealRow}
          accessibilityRole="button"
          accessibilityState={{ expanded: !!open[i] }}
          aria-expanded={!!open[i]}
          accessibilityLabel={`${it.q} ${open[i] ? it.a : 'Tap to show the answer'}`}
        >
          <Text style={styles.revealQ}>
            {open[i] ? '▾' : '▸'} {it.q}
          </Text>
          {open[i] ? <Text style={styles.revealA}>{it.a}</Text> : null}
        </Pressable>
      ))}
    </Card>
  );
}

export const bitStyles = StyleSheet.create({
  body: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21 },
});

const styles = StyleSheet.create({
  // Term popup
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', paddingHorizontal: 20 },
  sheet: {
    ...popupCard,
    backgroundColor: '#101015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(127,212,255,.35)',
    padding: 18,
    gap: 14,
  },
  sheetEyebrow: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4 },
  sheetTerm: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 24 },
  sheetDef: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 16.5, lineHeight: 24 },
  sheetNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  sheetGap: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  fullBtn: {
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(159,190,222,.45)',
    backgroundColor: '#0f1620',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fullBtnText: { color: '#9fbede', fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8 },
  doneBtn: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: '#17140c',
    paddingHorizontal: 20,
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },

  // Chips
  chipsWrap: { gap: 7 },
  chipsTitle: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(127,212,255,.45)',
    backgroundColor: '#0e1822',
    paddingHorizontal: 14,
  },
  chipText: { color: '#cfe9ff', fontFamily: fonts.barlowSemiBold, fontSize: 14 },

  // Reading
  lead: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15.5, lineHeight: 22 },
  para: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21 },
  paraKey: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, letterSpacing: 0.8 },
  card: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#111114', padding: 14 },

  // Exercises
  exEyebrow: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4 },
  exPrompt: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 21 },
  sortRow: { gap: 8, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 10 },
  sortRowOk: {},
  sortText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20 },
  sortBtns: { flexDirection: 'row', gap: 8 },
  binBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#151518',
  },
  binBtnOk: { borderColor: colors.green, backgroundColor: '#173021' },
  binBtnMiss: { borderColor: colors.amber, backgroundColor: '#1d170b' },
  binText: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2 },
  binTextOk: { color: colors.green },
  sortWhy: { color: '#9ef0b4', fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  sortHint: { color: colors.amber, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  orderPath: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, minHeight: 24, alignItems: 'center' },
  orderPlaced: { color: colors.green, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  orderNext: { color: colors.textMuted, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  orderPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poolBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#17140c',
    paddingHorizontal: 12,
  },
  poolBtnUsed: { borderColor: colors.hairlineDim, backgroundColor: '#0f0f11' },
  poolText: { color: colors.amber, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  resetLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  resetText: { color: colors.textMuted, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
  revealRow: { gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 10, minHeight: 44 },
  revealQ: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 20 },
  revealA: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, paddingLeft: 14 },
});
