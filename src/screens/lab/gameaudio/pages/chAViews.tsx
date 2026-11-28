/**
 * chAViews — small views for the Chapter 1 pages (1, 3, 4, 5):
 *
 *   ChACard / ChARow / ChABullets   a comparison card in the well (a platform,
 *                                   a kind of game). READ-ONLY: a card is
 *                                   chosen with a dock key, never tapped.
 *   ChAEmpty                        the card's place before anything is chosen
 *   ChATray / ChATrayRow /          the body of a `group` dock tray: headed
 *   ChATrayNote / ChATrayPick       rows of chips, a line of plain words, and
 *                                   the description of what is chosen (shown
 *                                   ABOVE the chips, so it is never under the
 *                                   tray's fold)
 *   ChATrayGrid                     many choices in equal columns (twelve
 *                                   kinds of game in three rows, not four)
 *   ChATrayResult                   what the last press did, at the TOP of a
 *                                   tray: the line being spoken and the
 *                                   newest log lines. A tray covers the
 *                                   well, so without this the caption and
 *                                   the log are hidden while the learner
 *                                   presses (walk audit W1 F04)
 *
 * A tray chip is at least 44 pt high (the option trays' size). A chosen chip
 * shows a ✓ before its name (`mark`), or carries its state as a word
 * ("SCENE · ON"): never the highlight alone. In a grid the ✓ sits in the
 * chip's corner, so the name keeps the whole width of its column.
 *
 * Text sizes follow the lab's well furniture (bits.tsx): nothing under
 * 10.5 pt.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fitValue } from '../../../../theme/legibility';
import { colors, fonts } from '../../../../theme/tokens';
import { marked } from '../bits';
import { gaLogRow, gaLogSpoken } from '../bitsLogic';
import { CHA_RESULT_LINES, chaResultRows } from './data/gaFamilies';
import type { GaState } from '../model/gaModel';

export function ChACard({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View accessible accessibilityRole="header" accessibilityLabel={`${eyebrow}: ${title}${sub ? `, ${sub}` : ''}`}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** One labelled line of a card. `tone="test"` marks the card's one test. */
export function ChARow({ label, children, tone = 'plain' }: { label: string; children: ReactNode; tone?: 'plain' | 'test' }) {
  return (
    <View style={[styles.row, tone === 'test' && styles.rowTest]}>
      <Text style={[styles.rowLabel, tone === 'test' && { color: colors.amberLabel }]}>{label}</Text>
      {typeof children === 'string' ? <Text style={styles.rowText}>{children}</Text> : children}
    </View>
  );
}

export function ChABullets({ items }: { items: readonly string[] }) {
  return (
    <View style={styles.bullets} accessibilityRole="list">
      {items.map((it) => (
        <View key={it} style={styles.bullet}>
          <Text style={styles.dot}>•</Text>
          <Text style={[styles.rowText, styles.bulletText]}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

/** Where the card will appear, before a dock key has chosen one. */
export function ChAEmpty({ children }: { children: ReactNode }) {
  return (
    <View style={[styles.card, styles.empty]}>
      <Text style={styles.emptyText}>{children}</Text>
    </View>
  );
}

/* ── inside a dock tray ─────────────────────────────────────────────────── */

export type ChAChip = {
  /** The chip's name. A chip whose state is a word carries it here
   *  ("SCENE · ON"). */
  label: string;
  /** Chosen, or on. */
  on: boolean;
  onPress: () => void;
  /** One of several choices: the chosen one is drawn "✓ NAME". */
  mark?: boolean;
};

/** The body of a `group` tray: its rows, spaced. */
export function ChATray({ children }: { children: ReactNode }) {
  return <View style={styles.trayBox}>{children}</View>;
}

export function ChATrayRow({ head, chips }: { head: string; chips: readonly ChAChip[] }) {
  return (
    <View style={styles.tray}>
      <Text style={styles.trayHead}>{head}</Text>
      <View style={styles.trayChips}>
        {chips.map((c) => {
          const text = c.mark ? marked(c.label, c.on) : c.label;
          return (
            <Pressable
              key={c.label}
              style={[styles.chip, c.on && styles.chipOn]}
              onPress={c.onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: c.on }}
              aria-pressed={c.on}
              accessibilityLabel={c.mark ? `${c.label}${c.on ? ', chosen' : ''}` : c.label}
            >
              <Text style={[styles.chipText, c.on && styles.chipTextOn]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Many chips in `cols` equal columns: one line each, shrunk to fit and
 *  never under 9 pt (house `fitValue`). A chosen chip of a set of choices
 *  (`mark`) carries a ✓ in its corner; a switch carries its state in its
 *  name ("SCENE · ON"). `label` names the group for a screen reader. */
export function ChATrayGrid({ label, chips, cols = 4 }: { label: string; chips: readonly ChAChip[]; cols?: number }) {
  // each column's share of the row, less its part of the gaps between them
  const basis = `${Math.floor((100 / cols) * 100) / 100 - 1.4}%` as const;
  return (
    <View style={styles.grid} accessibilityLabel={label}>
      {chips.map((c) => (
        <Pressable
          key={c.label}
          style={[styles.chip, styles.gridChip, { flexBasis: basis }, c.on && styles.chipOn]}
          onPress={c.onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: c.on }}
          aria-pressed={c.on}
          accessibilityLabel={c.mark ? `${c.label}${c.on ? ', chosen' : ''}` : c.label}
        >
          {c.on && c.mark ? <Text style={styles.gridMark}>✓</Text> : null}
          <Text style={[styles.chipText, styles.gridText, c.on && styles.chipTextOn]} {...fitValue(11.5)}>
            {c.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}


/** A sentence for a screen reader: one full stop, never two. */
const sentence = (t: string): string => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

/** What the last press did, at the top of a tray that covers the well: the
 *  words of the line being spoken (dialogue always has text), then the
 *  newest lines of the activity log, newest first. The panel keeps one
 *  height whatever it holds, so the chips under it do not move. */
export function ChATrayResult({ state, lines = CHA_RESULT_LINES }: { state: GaState; lines?: number }) {
  const cap = state.caption;
  const rows = chaResultRows(state.log, cap ? Math.max(1, lines - 1) : lines);
  const spoken = `${cap ? `The guide says: ${sentence(cap.text)} ` : ''}${rows.length ? `Newest in the log: ${rows.map((r) => sentence(gaLogSpoken(r.kind, r.text))).join(' ')}` : 'Nothing has played yet.'}`;
  return (
    <View style={styles.result} accessible accessibilityRole="summary" accessibilityLiveRegion="polite" accessibilityLabel={spoken}>
      {cap ? (
        <Text style={styles.resultCap} numberOfLines={2}>
          <Text style={styles.resultWho}>GUIDE </Text>
          {cap.text}
        </Text>
      ) : null}
      {rows.length === 0 && !cap ? <Text style={styles.resultEmpty}>Nothing has played yet. The newest log lines appear here.</Text> : null}
      {rows.map((r) => {
        const row = gaLogRow(r.kind, r.text);
        return (
          <View key={r.n} style={styles.resultRow}>
            <Text style={styles.resultKind}>{row.word}</Text>
            <Text style={styles.resultText} numberOfLines={2}>
              {row.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ChATrayNote({ children }: { children: ReactNode }) {
  return <Text style={styles.trayNote}>{children}</Text>;
}

/** What is chosen now, in words: its name and its description. It sits at
 *  the top of a tray, above the chips that choose it. */
export function ChATrayPick({ name, children }: { name: string; children: ReactNode }) {
  return (
    <View style={styles.pick} accessibilityLiveRegion="polite">
      <Text style={styles.pickName}>{name}</Text>
      <Text style={styles.pickText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 12, gap: 10 },
  eyebrow: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  title: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1, marginTop: 2 },
  sub: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  row: { gap: 3 },
  rowTest: { borderLeftWidth: 2, borderLeftColor: colors.amber, paddingLeft: 9 },
  rowLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  rowText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  bullets: { gap: 2 },
  bullet: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  dot: { color: colors.amber, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 20 },
  bulletText: { flex: 1 },
  empty: { borderStyle: 'dashed', alignItems: 'flex-start' },
  emptyText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  trayBox: { gap: 12 },
  tray: { gap: 8 },
  trayHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  trayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  trayNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  // the option trays' chip size: a full 44 pt target
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextOn: { color: colors.amber },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridChip: { flexGrow: 1, flexShrink: 1, alignItems: 'center', paddingHorizontal: 4 },
  gridText: { fontSize: 11.5, letterSpacing: 0.4, textAlign: 'center' },
  gridMark: { position: 'absolute', top: 2, right: 5, color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5 },
  // two log lines of two text lines each: 2 × 32 + the gap + the padding
  result: { borderRadius: 9, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', paddingVertical: 8, paddingHorizontal: 10, gap: 4, minHeight: 86, justifyContent: 'flex-start' },
  resultRow: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  resultKind: { width: 50, color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8, lineHeight: 16 },
  resultText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  resultWho: { color: '#9fd0ff', fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  resultCap: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 16 },
  resultEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  pick: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 4, minHeight: 58 },
  pickName: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1 },
  pickText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
