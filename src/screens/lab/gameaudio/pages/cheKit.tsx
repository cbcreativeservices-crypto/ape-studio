/**
 * cheKit — small view pieces shared by chapter 6's pages (20 Finding your
 * way in the tools, 21 Game audio today, 22 Capstone and free play).
 *
 *   DocSection        a headed block of a DOCUMENT page. Pages 20 and 21 are
 *                     reading pages with no scene, so they have no five
 *                     steps: a plain heading, short paragraphs, then its
 *                     checks.
 *   useDocDone        a document page counts once ALL its checks are
 *                     passed (page 20 has four, page 21 has two).
 *   Tray / TrayRow /  the furniture of a dock tray on the capstone: a heading
 *   TrayNote          and a row of chips, a line of plain text.
 *   useCapstoneVisit  the capstone's facts-since-visit (data/gaCapstone): it
 *                     shows the pure visit every new state of the scene, so a
 *                     requirement is judged from what the scene did.
 */
import { useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx } from '../../kit/PagedLab';
import { useMarkWhen } from '../../tuning/components/primitives';
import type { GaState } from '../model/gaModel';
import { gaVisitOpen, gaVisitSince, gaVisitStep, type GaFacts, type GaVisit } from './data/gaCapstone';

/* ── document pages ─────────────────────────────────────────────────────── */

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Mark a document page done the first time `passed` is true. Credit already
 *  earned is never removed: a later visit only ever marks. */
export function useDocDone(ctx: PageCtx, passed: boolean): void {
  useMarkWhen(passed, () => {
    if (!ctx.isDone) ctx.markDone();
  });
}

/* ── tray furniture ─────────────────────────────────────────────────────── */

export function Tray({ children }: { children: ReactNode }) {
  return <View style={styles.tray}>{children}</View>;
}

/** A heading and a row of chips (the page renders its own chips). */
export function TrayRow({ head, children }: { head: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.head}>{head}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export function TrayNote({ children }: { children: ReactNode }) {
  return <Text style={styles.note}>{children}</Text>;
}

/* ── the capstone's visit ───────────────────────────────────────────────── */

/** Facts since this page opened (or since CLEAN SCENE), with the witness
 *  facts of data/gaCapstone. The visit sees each new state once, in order. */
export function useCapstoneVisit(s: GaState): GaFacts {
  const ref = useRef<GaVisit | null>(null);
  if (ref.current === null) ref.current = gaVisitOpen(s);
  else if (ref.current.last !== s) ref.current = gaVisitStep(ref.current, s);
  return gaVisitSince(ref.current, s);
}

const styles = StyleSheet.create({
  section: { borderRadius: 12, borderWidth: 1, borderColor: '#24242a', backgroundColor: '#101013', padding: 12, gap: 8 },
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 1.4 },
  sectionBody: { gap: 8 },
  tray: { gap: 10 },
  group: { gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
