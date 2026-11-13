/**
 * stageplot/inputs/bits — the small pieces the Inputs area's panels and
 * sheets share: a sheet body, a list of plain lines, a word tag, a
 * tick row, and a two-step remove (asked in place, so no popup opens over a
 * sheet). Dark theme, the app's tokens; nothing under 12 pt; every target at
 * least 44 pt; nothing told by color alone.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Button, Note } from '../spForm';

/** The content of a sheet, with the kit's spacing. The kit's Sheet scrolls. */
export function SheetBody({ children }: { children: ReactNode }) {
  return <View style={styles.sheetBody}>{children}</View>;
}

/** Plain lines, one under the other, each with its own mark. */
export function Lines({ lines, mark = '•' }: { lines: readonly string[]; mark?: string }) {
  return (
    <View style={styles.lines}>
      {lines.map((line, k) => (
        <View key={`${k}:${line}`} style={styles.lineRow}>
          <Text style={styles.lineMark}>{mark}</Text>
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

export function Small({ children }: { children: ReactNode }) {
  return <Text style={styles.small}>{children}</Text>;
}

export function SubTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.subTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

export type TagTone = 'plain' | 'pair' | 'warn';
const TAG_COLOR: Record<TagTone, string> = { plain: colors.textSub, pair: colors.cyanBright, warn: colors.orange };

/** A word in a box. The WORD carries the meaning; the color only groups. */
export function Tag({ text, tone = 'plain' }: { text: string; tone?: TagTone }) {
  return (
    <View style={[styles.tag, { borderColor: TAG_COLOR[tone] }]}>
      <Text style={[styles.tagText, { color: TAG_COLOR[tone] }]}>{text}</Text>
    </View>
  );
}

/** A row that is ticked or not. The tick is a mark (✓) in a box. */
export function TickRow({ title, sub, tags, checked, onPress, a11yLabel }: { title: string; sub?: string; tags?: ReactNode; checked: boolean; onPress: () => void; a11yLabel: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.tickRow, checked ? styles.tickRowOn : null]} accessibilityRole="checkbox" accessibilityLabel={a11yLabel} accessibilityState={{ checked }} aria-checked={checked}>
      <View style={[styles.tickBox, checked ? styles.tickBoxOn : null]}>
        <Text style={styles.tickMark}>{checked ? '✓' : ''}</Text>
      </View>
      <View style={styles.tickText}>
        <Text style={[styles.tickTitle, checked ? null : styles.tickTitleOff]}>{title}</Text>
        {sub ? <Text style={styles.small}>{sub}</Text> : null}
        {tags ? <View style={styles.tags}>{tags}</View> : null}
      </View>
    </Pressable>
  );
}

/** Remove, asked in place: the first press asks, the second removes. */
export function RemoveStep({ label, question, yes, onRemove, extra }: { label: string; question: string; yes: string; onRemove: () => void; extra?: { label: string; onPress: () => void } }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button label={label} tone="danger" onPress={() => setAsking(true)} />;
  return (
    <View style={styles.ask}>
      <Note tone="warning">{question} You can undo it afterward.</Note>
      <Button label={yes} tone="danger" onPress={onRemove} />
      {extra ? <Button label={extra.label} tone="danger" onPress={extra.onPress} /> : null}
      <Button label="KEEP IT" tone="plain" onPress={() => setAsking(false)} />
    </View>
  );
}

export const bitStyles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gap: { gap: 10 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

const styles = StyleSheet.create({
  sheetBody: { gap: 16 },
  lines: { gap: 6 },
  lineRow: { flexDirection: 'row', gap: 8 },
  lineMark: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  line: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  small: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  subTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amberLabel, textTransform: 'uppercase' },
  tag: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#121212' },
  tickRowOn: { borderColor: colors.steelBorder, backgroundColor: '#171717' },
  tickBox: { width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  tickBoxOn: { borderColor: colors.amber, backgroundColor: '#2a2210' },
  tickMark: { fontFamily: fonts.barlowSemiBold, fontSize: 18, lineHeight: 22, color: colors.amber },
  tickText: { flex: 1, gap: 2 },
  tickTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  tickTitleOff: { color: colors.textSub, textDecorationLine: 'line-through' },
  ask: { gap: 8 },
});
