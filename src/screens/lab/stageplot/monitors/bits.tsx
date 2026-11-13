/**
 * stageplot/monitors/bits — the few small pieces the Monitors area needs
 * beside the lab's form kit (spForm): a chip that can be one of SEVERAL
 * chosen (who is on a mix, the short instructions, the four words of the
 * needs grid), the prominent MONITOR ONLY label, fact tags, and plain text.
 *
 * Rules kept here: every touch target is at least 44 pt high; a chosen chip
 * shows a ✓ as well as its color and says so to a screen reader on a phone
 * (`accessibilityState`) and in a browser (`aria-selected`); nothing is cut
 * with "…" (text wraps); no text here is under 12 pt.
 *
 * Capitals (the lab's one rule): sub-headings and tags are in CAPITALS;
 * chips and field labels are in sentence case.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';

/** A chip that is on or off by itself (several in a row may be on).
 *  `compact`: a narrower chip in a condensed face, so four fit on one line of
 *  a phone (the four words of the needs grid). */
export function ToggleChip({ label, selected, onPress, a11yLabel, tone = 'amber', compact = false }: { label: string; selected: boolean; onPress: () => void; a11yLabel: string; tone?: 'amber' | 'red'; compact?: boolean }) {
  const on = tone === 'red' ? styles.chipOnRed : styles.chipOn;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11yLabel} accessibilityState={{ selected }} aria-selected={selected} style={[styles.chip, compact ? styles.chipCompact : null, selected ? on : null]}>
      <Text style={[styles.chipText, compact ? styles.chipTextCompact : null, selected ? styles.chipTextOn : null]}>{selected ? `✓ ${label}` : label}</Text>
    </Pressable>
  );
}

/** A row of chips that wraps. `tight`: the four-word row of the needs grid. */
export function ChipRow({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  return <View style={[styles.chipRow, tight ? styles.chipRowTight : null]}>{children}</View>;
}

/** The label of a group of chips: the same look as the form kit's own field
 *  labels, so the group reads as one more field of the popup. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

/** A small heading inside a popup ("DEVICES ON THIS MIX"). */
export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.subHeading} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** The heading of one group inside a section ("REQUESTED FROM THE HOUSE CONSOLE"). */
export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.groupHeading} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Line({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'dim' | 'strong' }) {
  return <Text style={[styles.line, tone === 'dim' ? styles.lineDim : tone === 'strong' ? styles.lineStrong : null]}>{children}</Text>;
}

/** The MONITOR ONLY label: words in a heavy box, never a color alone. A
 *  screen reader hears the words, not the mark in front of them. */
export function AudienceTag({ text }: { text: string }) {
  return (
    <View style={styles.tag} accessible accessibilityLabel={text}>
      <Text style={styles.tagText}>{`◆ ${text}`}</Text>
    </View>
  );
}

/** The facts of a card as tags a person can read (12 pt, in CAPITALS). */
export function FactTags({ items }: { items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.facts}>
      {items.map((text) => (
        <View key={text} style={styles.fact}>
          <Text style={styles.factText}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

/** Buttons side by side that wrap on a narrow phone. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>;
}

/** A plain box that sets one group of things apart from the next. */
export function Box({ children }: { children: ReactNode }) {
  return <View style={styles.box}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipCompact: { flexGrow: 1, paddingHorizontal: 6, paddingVertical: 6 },
  chipOn: { borderColor: colors.amber, backgroundColor: '#2b2208' },
  chipOnRed: { borderColor: colors.red, backgroundColor: '#2e1310' },
  chipText: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  chipTextCompact: { fontFamily: fonts.barlowCondensedSemiBold, fontSize: 14.5 },
  chipTextOn: { color: colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRowTight: { gap: 6 },
  fieldLabel: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  subHeading: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amberLabel, textTransform: 'uppercase' },
  groupHeading: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1, color: colors.amberLabel, textTransform: 'uppercase' },
  line: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  lineDim: { color: colors.textSub, fontSize: 14, lineHeight: 20 },
  lineStrong: { fontFamily: fonts.barlowSemiBold, color: colors.textPrimary },
  tag: { alignSelf: 'flex-start', borderWidth: 2, borderColor: colors.amber, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#241c06' },
  tagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.amber },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { borderWidth: 1, borderColor: '#3a3a42', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  factText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary, textTransform: 'uppercase' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  box: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 12, gap: 8, backgroundColor: '#111111' },
});
