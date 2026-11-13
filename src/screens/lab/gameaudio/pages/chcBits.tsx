/**
 * chcBits — small view helpers shared by pages 11–15 (Chapter 3, Space, and
 * Chapter 4, Music and voice). Nothing here is a control in the WELL:
 *
 *   ReadCard       a read-only card of name / value rows (the numbers a page
 *                  works out from the scene)
 *   useRoseWhile   "this count went up while that was true": a goal judged
 *                  from what really happened, at the moment it happened
 *   TrayChip       a chip in a dock tray, a full 44 points high; its state
 *                  is in its LABEL (`marked` from ../bits, or `onOff` here),
 *                  not in the highlight alone
 *   useNowWhile    the scene clock now, re-read a few times a second while
 *                  something is waiting, so a "seconds left" readout counts
 *                  down instead of standing still
 *   tray           the styles of this group's dock trays
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { useDecorativeMotion } from '../../../../features/settings/decorativeMotion';
import { gaNow } from '../model/gaStore';

/* ── a read-only card ───────────────────────────────────────────────────── */

export type ReadRow = { k: string; v: string };

export function ReadCard({ title, rows, note }: { title: string; rows: readonly ReadRow[]; note?: string }) {
  return (
    <View style={styles.card} accessible accessibilityRole="summary" accessibilityLabel={`${title}. ${rows.map((r) => `${r.k}: ${r.v}`).join('. ')}.${note ? ` ${note}` : ''}`}>
      <Text style={styles.cardHead}>{title}</Text>
      {rows.map((r) => (
        <View key={r.k} style={styles.cardRow}>
          <Text style={styles.cardKey}>{r.k}</Text>
          <Text style={styles.cardVal}>{r.v}</Text>
        </View>
      ))}
      {note ? <Text style={styles.cardNote}>{note}</Text> : null}
    </View>
  );
}

/* ── a chip in a dock tray ──────────────────────────────────────────────── */

/** `LABEL · ON` / `LABEL · OFF`: a switch chip says its state as a word. */
export const onOff = (label: string, on: boolean): string => `${label} · ${on ? 'ON' : 'OFF'}`;

/** The house chip's look at the option trays' own 44-point height.
 *  `selected` is told to a screen reader; a sighted reader gets a mark or a
 *  word in the label. */
export function TrayChip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipOn]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} aria-pressed={selected}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* ── goals judged at the moment something happened ──────────────────────── */

/** True once `count` has gone up while `cond` held. A fact counter says THAT
 *  something happened; this adds WHEN (for example "you turned while a source
 *  was playing in stereo"). The page re-renders on every scene change, so
 *  each rise is seen with the state it happened in. */
export function useRoseWhile(count: number, cond: boolean): boolean {
  const last = useRef(count);
  const hit = useRef(false);
  if (count > last.current && cond) hit.current = true;
  last.current = count;
  return hit.current;
}

/* ── a readout that counts down ─────────────────────────────────────────── */

/** The scene clock (model/gaStore `gaNow`, the clock `state.t` and every due
 *  time are stamped from). While `active`, the caller is drawn again every
 *  `stepMs` so a number of seconds left counts down. The number is
 *  information, so it is never lost: with reduce-motion on (the shared gate,
 *  `useDecorativeMotion`) it steps once a second instead of five times.
 *  When nothing is waiting it costs nothing. */
export function useNowWhile(active: boolean, stepMs = 200): number {
  const smooth = useDecorativeMotion();
  const every = smooth ? stepMs : Math.max(stepMs, 1000);
  const [, bump] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => bump((n) => (n + 1) % 1000000), every);
    return () => clearInterval(id);
  }, [active, every]);
  return gaNow();
}

/* ── styles ─────────────────────────────────────────────────────────────── */

export const tray = StyleSheet.create({
  tray: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  status: { color: colors.amber, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', padding: 10, gap: 6 },
  cardHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  cardRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  cardKey: { flex: 0.8, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8, lineHeight: 18 },
  cardVal: { flex: 1.2, color: colors.amber, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  cardNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextOn: { color: colors.amber },
});
