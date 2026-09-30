/**
 * StartHereTermsScreen — the 24 starter words (owner plan: "Start with a
 * manageable set of core words, rather than presenting a large glossary list
 * all at once … Each term can link to its full glossary entry, so beginners
 * can explore without losing their place.").
 *
 * Three ways in, all session-only (nothing stored, nothing graded):
 *   WORDS  — the three groups, each word tappable for its meaning and, one tap
 *            further, its FULL glossary entry — in place, in a popup.
 *   FLIP   — flip cards (the study app's Flashcards idea, not wired into the
 *            certificate study spine): word → meaning, GOT IT / AGAIN.
 *   QUIZ   — "which word matches this meaning?", four choices.
 *
 * Pushed over Start Here, so BACK returns to the exact page the learner left.
 */
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { colors, fonts } from '../../theme/tokens';
import { readingColumn } from '../../theme/readingColumn';
import {
  STARTER_TERMS,
  TERM_GROUPS,
  buildQuiz,
  termById,
  type StarterTerm,
  type TermGroupId,
} from '../../features/startHere/startHereContent';
import { TermSheetHost, useOpenTerm } from './bits';

type Mode = 'words' | 'flip' | 'quiz';

const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);

export function StartHereTermsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [mode, setMode] = useState<Mode>('words');
  const [group, setGroup] = useState<TermGroupId | 'all'>('all');

  return (
    <TermSheetHost>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back to Start Here">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>START HERE · 24 STARTER WORDS</Text>
            <Text style={styles.title}>Learn the words</Text>
          </View>
        </View>

        <View style={[styles.tabs, readingColumn]} accessibilityRole="tablist">
          {(
            [
              ['words', 'WORDS'],
              ['flip', 'FLIP CARDS'],
              ['quiz', 'QUIZ'],
            ] as const
          ).map(([m, label]) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.tab, mode === m && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              accessibilityLabel={label}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.groups, readingColumn]}>
          {([['all', 'ALL 24'], ...TERM_GROUPS.map((g) => [g.id, g.title.toUpperCase()] as const)] as const).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setGroup(id as TermGroupId | 'all')}
              hitSlop={{ top: 4, bottom: 4 }}
              style={[styles.groupChip, group === id && styles.groupChipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: group === id }}
              accessibilityLabel={`Show ${label.toLowerCase()}`}
            >
              <Text style={[styles.groupText, group === id && styles.groupTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, readingColumn, { paddingBottom: insets.bottom + 28 }]}>
          {mode === 'words' ? <WordList group={group} /> : null}
          {mode === 'flip' ? <FlipCards key={`flip-${group}`} group={group} /> : null}
          {mode === 'quiz' ? <Quiz key={`quiz-${group}`} group={group} /> : null}
        </ScrollView>
      </View>
    </TermSheetHost>
  );
}

function termsIn(group: TermGroupId | 'all'): StarterTerm[] {
  return STARTER_TERMS.filter((t) => group === 'all' || t.group === group);
}

function WordList({ group }: { group: TermGroupId | 'all' }) {
  const open = useOpenTerm();
  const groups = TERM_GROUPS.filter((g) => group === 'all' || g.id === group);
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.intro}>Tap a word for its meaning. From there, one more tap opens its full glossary entry — and closing it brings you straight back.</Text>
      {groups.map((g) => (
        <View key={g.id} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{g.title.toUpperCase()}</Text>
          <Text style={styles.groupBlurb}>{g.blurb}</Text>
          {termsIn(g.id).map((t) => (
            <Pressable key={t.id} onPress={() => open(t.id)} style={styles.wordRow} accessibilityRole="button" accessibilityLabel={`${t.term}: ${t.def} Open for more`}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.word}>{t.term}</Text>
                <Text style={styles.wordDef}>{t.def}</Text>
              </View>
              <Text style={styles.go}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function FlipCards({ group }: { group: TermGroupId | 'all' }) {
  const all = useMemo(() => termsIn(group), [group]);
  const [deck, setDeck] = useState<string[]>(() => all.map((t) => t.id));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(() => new Set());
  const open = useOpenTerm();
  const finished = idx >= deck.length;
  const t = !finished ? termById(deck[idx]) : undefined;

  const next = (gotIt: boolean) => {
    if (!t) return;
    if (gotIt) setKnown((k) => new Set(k).add(t.id));
    setFlipped(false);
    setIdx(idx + 1);
  };
  if (finished) {
    const again = deck.filter((id) => !known.has(id));
    return (
      <View style={styles.flipCard}>
        <Text style={styles.flipEyebrow}>ROUND DONE</Text>
        <Text style={styles.flipBig}>
          {known.size} of {all.length} known
        </Text>
        <Text style={styles.intro}>{again.length > 0 ? `${again.length} still to learn. Go again with just those — they will stick faster.` : 'Every word known. Try the QUIZ to test yourself the other way round.'}</Text>
        {again.length > 0 ? (
          <Pressable onPress={() => { setDeck(again); setIdx(0); setFlipped(false); }} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Practise the words still to learn">
            <Text style={styles.primaryText}>PRACTISE THE {again.length} STILL TO LEARN</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => { setDeck(all.map((x) => x.id)); setIdx(0); setFlipped(false); setKnown(new Set()); }} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Start all the cards again">
          <Text style={styles.secondaryText}>START ALL AGAIN</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.counter}>
        CARD {idx + 1} OF {deck.length} · {known.size} KNOWN
      </Text>
      <Pressable
        onPress={() => setFlipped(!flipped)}
        style={[styles.flipCard, flipped && styles.flipCardBack]}
        accessibilityRole="button"
        accessibilityLabel={flipped ? `${t?.term}: ${t?.def}. Tap to see the word again` : `${t?.term}. Tap to flip and see the meaning`}
      >
        <Text style={styles.flipEyebrow}>{flipped ? 'MEANING' : 'WORD · TAP TO FLIP'}</Text>
        {flipped ? (
          <>
            <Text style={styles.flipDef}>{t?.def}</Text>
            {t?.note ? <Text style={styles.flipNote}>{t.note}</Text> : null}
          </>
        ) : (
          <Text style={styles.flipBig}>{t?.term}</Text>
        )}
      </Pressable>
      {flipped ? (
        <View style={styles.flipBtns}>
          <Pressable onPress={() => next(false)} style={[styles.secondaryBtn, { flex: 1 }]} accessibilityRole="button" accessibilityLabel="Still learning this one">
            <Text style={styles.secondaryText}>STILL LEARNING</Text>
          </Pressable>
          <Pressable onPress={() => next(true)} style={[styles.primaryBtn, { flex: 1 }]} accessibilityRole="button" accessibilityLabel="Got it">
            <Text style={styles.primaryText}>GOT IT ✓</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.intro}>Say the meaning to yourself, then flip to check.</Text>
      )}
      {t?.glossary ? (
        <Pressable onPress={() => open(t.id)} style={styles.linkRow} accessibilityRole="button" accessibilityLabel={`More about ${t.term}`}>
          <Text style={styles.linkText}>MORE ABOUT “{t.term.toUpperCase()}” ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Quiz({ group }: { group: TermGroupId | 'all' }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9) + 1);
  const items = useMemo(() => buildQuiz(seed, 8, group === 'all' ? undefined : group), [seed, group]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  // One answer per question (bug pass 2 2026-09-30): `picked` is state, so a
  // wrong option and the right one mashed in the same frame both passed the
  // `picked != null` check — the second overwrote the first and scored.
  const answeredRef = useRef(-1);
  const finished = i >= items.length;
  if (finished) {
    return (
      <View style={styles.flipCard}>
        <Text style={styles.flipEyebrow}>QUIZ DONE</Text>
        <Text style={styles.flipBig}>
          {score} of {items.length}
        </Text>
        <Text style={styles.intro}>{score === items.length ? 'Every one right. You know your starter words.' : 'Words you missed are worth a look in WORDS or FLIP CARDS — then try a fresh quiz.'}</Text>
        <Pressable onPress={() => { answeredRef.current = -1; setSeed(seed + 7919); setI(0); setPicked(null); setScore(0); }} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="New quiz">
          <Text style={styles.primaryText}>NEW QUIZ</Text>
        </Pressable>
      </View>
    );
  }
  const q = items[i];
  const right = picked === q.correctIdx;
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.counter}>
        QUESTION {i + 1} OF {items.length} · {score} RIGHT
      </Text>
      <View style={styles.quizCard}>
        <Text style={styles.flipEyebrow}>WHICH WORD MEANS…</Text>
        <Text style={styles.flipDef}>{q.def}</Text>
      </View>
      {q.options.map((o, k) => {
        const isPicked = picked === k;
        const showRight = picked != null && k === q.correctIdx;
        return (
          <Pressable
            key={o}
            onPress={() => {
              if (picked != null || answeredRef.current === i) return;
              answeredRef.current = i;
              setPicked(k);
              if (k === q.correctIdx) setScore(score + 1);
            }}
            style={[styles.opt, showRight && styles.optRight, isPicked && !right && styles.optWrong]}
            accessibilityRole="button"
            accessibilityState={{ selected: isPicked }}
            accessibilityLabel={o}
          >
            <Text style={[styles.optText, showRight && { color: colors.green }, isPicked && !right && { color: '#ff8a7a' }]}>{o}</Text>
          </Pressable>
        );
      })}
      {picked != null ? (
        <>
          <Text style={[styles.intro, { color: right ? '#9ef0b4' : colors.amber }]}>
            {right
              ? '✓ Right.'
              : `The answer is “${q.options[q.correctIdx]}”. (“${q.options[picked]}” means: ${lowerFirst((STARTER_TERMS.find((t) => t.term === q.options[picked])?.def ?? '').replace(/\.$/, ''))}.)`}
          </Text>
          <Pressable onPress={() => { setI(i + 1); setPicked(null); }} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={i + 1 < items.length ? 'Next question' : 'See your score'}>
            <Text style={styles.primaryText}>{i + 1 < items.length ? 'NEXT ›' : 'SEE YOUR SCORE ›'}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32 },
  kicker: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.3 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 4 },
  tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315' },
  tabOn: { borderColor: colors.cyanBright, backgroundColor: '#0e1822' },
  tabText: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1 },
  tabTextOn: { color: colors.cyanBright },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  groupChip: { minHeight: 36, justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 11 },
  groupChipOn: { borderColor: colors.amber, backgroundColor: '#17140c' },
  groupText: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.9 },
  groupTextOn: { color: colors.amber },
  scroll: { paddingHorizontal: 16, paddingTop: 10, gap: 14 },
  intro: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  groupCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#111114', padding: 12, gap: 4 },
  groupTitle: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4 },
  groupBlurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingVertical: 8 },
  word: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15.5 },
  wordDef: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  go: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
  counter: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  flipCard: {
    minHeight: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(127,212,255,.45)',
    backgroundColor: '#0e1822',
    padding: 20,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCardBack: { borderColor: 'rgba(255,198,77,.5)', backgroundColor: '#17140c' },
  flipEyebrow: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4 },
  flipBig: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 30, textAlign: 'center' },
  flipDef: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  flipNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  flipBtns: { flexDirection: 'row', gap: 10 },
  primaryBtn: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.green, backgroundColor: '#173021', paddingHorizontal: 14 },
  primaryText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1 },
  secondaryBtn: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', paddingHorizontal: 14 },
  secondaryText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1 },
  linkRow: { minHeight: 44, justifyContent: 'center', alignSelf: 'center' },
  linkText: { color: '#9fbede', fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  quizCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(127,212,255,.45)', backgroundColor: '#0e1822', padding: 16, gap: 8, alignItems: 'center' },
  opt: { minHeight: 48, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#141416', paddingHorizontal: 14 },
  optRight: { borderColor: colors.green, backgroundColor: '#132418' },
  optWrong: { borderColor: '#ff5a48', backgroundColor: '#241312' },
  optText: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15.5 },
});
