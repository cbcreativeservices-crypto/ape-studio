/**
 * The JOURNEY's pieces on screen (docs/labs/miking/LESSON_JOURNEY.md):
 *
 *   JourneyMap        the eight stages, one line each, with ✓ per stage —
 *                     the advance organiser on page 1 (signalling).
 *   PathChooser       NEW or EXPERIENCED, worded by what each choice costs,
 *                     never by what it forbids (the never-block rule).
 *   QuickCheckCard    the experienced path's honest check: one pick per item,
 *                     the explanation shown at once, graded on the FIRST
 *                     picks; one attempt per practice run. It opens the
 *                     activities; it credits nothing.
 *   FoundationsCard   shown in place of a later page's ACTIVITY while the
 *                     foundations are not met — what the page builds on, a
 *                     one-tap OPEN for each foundation, and the quick check.
 *                     NEXT / CONTENTS keep working (navigation is never gated).
 */
import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DiagnosticItem, PageId } from './model/types.ts';
import { FOUNDATION_PAGES, gradeQuickCheck, QUICK_CHECK_PASS, STAGES, type LearnerPath, type QuickCheckResult } from './journey.ts';
import { Card, shuffled } from './kit';

export type JourneyProps = {
  path: LearnerPath | null;
  choosePath: (p: LearnerPath) => void;
  /** This run's quick check (null = not taken this run). */
  quick: QuickCheckResult | null;
  recordQuick: (r: QuickCheckResult) => void;
  /** Pages whose requirement is met (stored credit or on screen this session). */
  met: ReadonlySet<PageId>;
  quickPassed: boolean;
  goPage: (id: PageId, step?: number) => void;
  titleOf: (id: PageId) => string;
  /** "kick" / "kicks" — the lesson's own noun for the path wording. */
  noun: { one: string; many: string };
  /** The page on screen. */
  here: PageId;
};

export function JourneyMap({ met, here }: { met: ReadonlySet<PageId>; here?: PageId }) {
  return (
    <View style={styles.map} accessibilityRole="summary" accessibilityLabel={`The lesson's eight stages: ${STAGES.map((s) => s.title).join(', ')}.`}>
      <Text style={styles.mapHead}>THE JOURNEY · 8 STAGES</Text>
      {STAGES.map((s, i) => {
        const done = s.pages.every((p) => met.has(p));
        const on = here ? s.pages.includes(here) : false;
        const foundation = s.pages.every((p) => FOUNDATION_PAGES.includes(p));
        return (
          <View key={s.id} style={styles.mapRow}>
            <Text style={[styles.mapNum, on && { color: colors.amber }, done && { color: colors.green }]}>{done ? '✓' : `${i + 1}`}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapTitle, on && { color: colors.amber }]}>{`${s.title}${foundation ? ' · FOUNDATION' : ''}`}</Text>
              <Text style={styles.mapLine}>{s.line}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function PathChooser({ journey }: { journey: JourneyProps }) {
  const { path, choosePath, noun } = journey;
  const opt = (p: LearnerPath, title: string, line: string) => {
    const on = path === p;
    return (
      <Pressable onPress={() => choosePath(p)} style={[styles.path, on && styles.pathOn]} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${title}. ${line}`}>
        <Text style={[styles.pathTitle, on && { color: colors.amber }]}>{`${on ? '● ' : '○ '}${title}`}</Text>
        <Text style={styles.pathLine}>{line}</Text>
      </Pressable>
    );
  };
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.q}>How would you like to start?</Text>
      {opt('new', `New to miking a ${noun.one}`, 'Start at the beginning: the instrument, how it makes its sound and where it sits, then the microphones.')}
      {opt('experienced', `I already mic ${noun.many}`, 'Take a six-question quick check. Pass it and every activity opens now; the first three pages stay here to earn their credit whenever you like.')}
    </View>
  );
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function QuickItem({ it, n, pick, onPick }: { it: DiagnosticItem; n: number; pick: string | undefined; onPick: (o: string) => void }) {
  const order = useMemo(() => shuffled(it.options.length, hashId(it.id)), [it]);
  const right = pick === it.correct;
  return (
    <Card tone="accent">
      <Text style={styles.q}>{`${n}. ${it.prompt}`}</Text>
      <View style={{ gap: 6 }}>
        {order.map((i) => {
          const o = it.options[i];
          const isPick = pick === o;
          const isRight = pick != null && o === it.correct;
          return (
            <Pressable
              key={o}
              disabled={pick != null}
              onPress={() => onPick(o)}
              style={[styles.opt, isRight && styles.optRight, isPick && !right && styles.optWrong, pick != null && !isPick && !isRight && styles.optDim]}
              accessibilityRole="button"
              accessibilityState={{ disabled: pick != null, selected: isPick }}
              accessibilityLabel={o}
            >
              <Text style={[styles.optText, isRight && { color: colors.green }, isPick && !right && { color: colors.red }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {pick != null ? <Text style={[styles.explain, { color: right ? colors.green : colors.gold }]}>{right ? `✓ ${it.explain}` : `✗ ${it.why[pick] ?? ''} ${it.explain}`}</Text> : null}
    </Card>
  );
}

export function QuickCheckCard({ items, journey }: { items: readonly DiagnosticItem[]; journey: JourneyProps }) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const reported = useRef(false);
  const res = journey.quick;
  if (res && !Object.keys(picks).length) {
    return <QuickResult res={res} journey={journey} before />;
  }
  const answered = items.filter((it) => it.id in picks).length;
  const graded = answered === items.length ? gradeQuickCheck(items, picks) : null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.note}>{`QUICK CHECK · ${items.length} questions on the first three pages · one try per practice run · pass = ${QUICK_CHECK_PASS} of ${items.length} with the safety question right. It opens the activities; it does not credit any page.`}</Text>
      {items.map((it, i) => (
        <QuickItem
          key={it.id}
          it={it}
          n={i + 1}
          pick={picks[it.id]}
          onPick={(o) => {
            const next = { ...picks, [it.id]: o };
            setPicks(next);
            AccessibilityInfo.announceForAccessibility?.(o === it.correct ? `Right. ${it.explain}` : `Not this one. ${it.why[o] ?? ''}`);
            if (Object.keys(next).length === items.length && !reported.current) {
              reported.current = true;
              journey.recordQuick(gradeQuickCheck(items, next));
            }
          }}
        />
      ))}
      {graded ? <QuickResult res={graded} journey={journey} /> : <Text style={styles.small}>{`${answered} of ${items.length} answered.`}</Text>}
    </View>
  );
}

function QuickResult({ res, journey, before }: { res: QuickCheckResult; journey: JourneyProps; before?: boolean }) {
  return (
    <View style={[styles.result, { borderColor: res.pass ? colors.green : colors.gold }]}>
      <Text style={[styles.resultHead, { color: res.pass ? colors.green : colors.gold }]}>
        {`${before ? 'QUICK CHECK, THIS RUN · ' : ''}${res.right} OF ${res.total} · ${res.pass ? 'PASSED' : 'NOT YET'}`}
      </Text>
      {res.pass ? (
        <>
          <Text style={styles.resultText}>Every activity is open. The first three pages are not credited by the check — open them any time to earn their credit.</Text>
          <View style={styles.row}>
            <Go label={`GO TO ${journey.titleOf('microphone').toUpperCase()}`} onPress={() => journey.goPage('microphone')} />
            <Go label={`GO TO ${journey.titleOf('placement').toUpperCase()}`} onPress={() => journey.goPage('placement')} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.resultText}>{`The activities open once the first three pages are done — they will be quick if you know this. Worth a look first: ${res.misses.map((p) => journey.titleOf(p)).join(', ') || 'the first three pages'}. A fresh practice run (START OVER in CONTENTS) allows another try at the check.`}</Text>
          <View style={styles.row}>
            {(res.misses.length ? res.misses : FOUNDATION_PAGES).map((p) => (
              <Go key={p} label={`OPEN ${journey.titleOf(p).toUpperCase()}`} onPress={() => journey.goPage(p, p === 'instrument' ? 1 : 0)} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function Go({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.go} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.goText}>{label}</Text>
    </Pressable>
  );
}

/** In place of a later page's activity while the foundations are not met. */
export function FoundationsCard({ journey, pageTitle }: { journey: JourneyProps; pageTitle: string }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.bridgeHead}>BUILT ON THE FIRST THREE PAGES</Text>
      <Text style={styles.resultText}>{`“${pageTitle}” puts a microphone to work. It is built on what the first three pages show: the instrument, how it makes its sound, and where it sits. Its activity opens once those are done — or once you pass the quick check. NEXT and CONTENTS still go anywhere.`}</Text>
      {FOUNDATION_PAGES.map((p) => {
        const ok = journey.met.has(p);
        return (
          <View key={p} style={styles.bridgeRow}>
            <Text style={[styles.bridgeMark, { color: ok ? colors.green : colors.textMuted }]}>{ok ? '✓' : '○'}</Text>
            <Text style={styles.bridgeTitle} accessibilityLabel={`${journey.titleOf(p)}: ${ok ? 'done' : 'not yet'}`}>
              {journey.titleOf(p)}
            </Text>
            {ok ? <Text style={styles.small}>done</Text> : <Go label="OPEN" onPress={() => journey.goPage(p, p === 'instrument' ? 1 : 0)} />}
          </View>
        );
      })}
      <View style={styles.row}>
        <Go label={`I ALREADY MIC ${journey.noun.many.toUpperCase()} · QUICK CHECK`} onPress={() => {
          journey.choosePath('experienced');
          journey.goPage('instrument', 0);
        }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { gap: 6, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, padding: 10, backgroundColor: '#0e0e11' },
  mapHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  mapRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  mapNum: { width: 18, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 14, textAlign: 'center' },
  mapTitle: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 13.5, lineHeight: 18 },
  mapLine: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  path: { gap: 3, minHeight: 44, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  pathOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  pathTitle: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19 },
  pathLine: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  opt: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f1d14' },
  optWrong: { borderColor: colors.red },
  optDim: { opacity: 0.55 },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  note: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  result: { gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
  resultHead: { fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1.2 },
  resultText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  go: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.amber },
  goText: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.1 },
  bridgeHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.4 },
  bridgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  bridgeMark: { width: 18, fontFamily: fonts.oswaldMedium, fontSize: 15, textAlign: 'center' },
  bridgeTitle: { flex: 1, color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19 },
});
