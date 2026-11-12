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
 *
 * A tray chip is at least 44 pt high (the option trays' size). A chosen chip
 * shows a ✓ before its name (`mark`), or carries its state as a word
 * ("SCENE · ON"): never the highlight alone.
 *
 * Text sizes follow the lab's well furniture (bits.tsx): nothing under
 * 10.5 pt.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { marked } from '../bits';

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
  pick: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 4, minHeight: 58 },
  pickName: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.1 },
  pickText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
