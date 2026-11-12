/**
 * chdKit — small view pieces shared by chapter 5's pages (16 The game mix,
 * 17 Budgets, 18 Multiplayer, 19 Testing): the furniture of a dock TRAY, a
 * read-only card for the well, and a hook that follows the scene from one
 * state to the next.
 *
 * TRAYS FIT THE PHONE. A tray covers the well and has about 300 points of
 * height on a phone, so every tray here is a few rows of equal-width chips
 * (`TrayGrid`), each chip a full 44 points high, and it ends with the
 * scene's answer in three short lines (`TrayLast`: the caption while a line
 * speaks, then the newest log lines) so a press and its result are read in
 * the same place without scrolling.
 *
 * A chip never shows its state by highlight alone: the page puts a word or a
 * mark in the label (`onOff`, and `marked` from bits).
 *
 * WHY TWO STATES. Most goals are "a fact went up since the page opened"
 * (pages/shared `useSince`). Page 19's bench needs more: a symptom only
 * counts if it happened WHILE its wrong setting was in. `useWatch` hands a
 * pure function the state before and after each change of the scene, in
 * order. Nothing is judged from a button press.
 */
import { Children, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { GaLogKind, GaState } from '../model/gaModel';
import { useGa } from '../model/gaStore';

/* ── tray furniture ─────────────────────────────────────────────────────── */

export function Tray({ children }: { children: ReactNode }) {
  return <View style={styles.tray}>{children}</View>;
}

/** A chip in a tray: 44 points high, its label on one or two lines. In a
 *  `TrayGrid` it takes its cell's whole width. `selected` is told to a
 *  screen reader; the label carries the word or mark a sighted reader needs. */
export function TrayChip({ label, selected = false, onPress, a11y }: { label: string; selected?: boolean; onPress: () => void; a11y?: string }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipOn]} onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y ?? label} accessibilityState={{ selected }} aria-pressed={selected}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A heading and its chips in rows of `cols` equal cells. A short last row
 *  keeps the same cell width (empty cells fill it). */
export function TrayGrid({ head, cols, children }: { head?: string; cols: number; children: ReactNode }) {
  const cells = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols));
  return (
    <View style={styles.group}>
      {head ? <Text style={styles.head}>{head}</Text> : null}
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((cell, i) => (
            <View key={i} style={styles.cell}>
              {cell}
            </View>
          ))}
          {Array.from({ length: cols - row.length }, (_, i) => (
            <View key={`empty-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

export function TrayNote({ children }: { children: ReactNode }) {
  return <Text style={styles.note}>{children}</Text>;
}

/** The log's first-column word for each kind of line (the same words the
 *  page's activity log prints). */
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

/** The scene's answer, inside the tray, newest first: the caption while a
 *  line speaks, then the newest log lines. Each is shown whole (a log line
 *  or a caption cut to "…" can lose the one word that matters). Read-only. */
export function TrayLast({ lines = 3, caption = false }: { lines?: number; caption?: boolean }) {
  const s = useGa();
  const rows = s.log.slice(-lines).reverse();
  const said = caption && s.caption ? `GUIDE says: ${s.caption.text}` : null;
  const spoken = [said, ...rows.map((r) => `${KIND_WORD[r.kind]}: ${r.text}`)].filter(Boolean).join('. ');
  return (
    <View style={styles.last} accessible accessibilityRole="summary" accessibilityLabel={`Newest log lines. ${spoken || 'Nothing has happened yet.'}`}>
      {said ? (
        <Text style={styles.lastSaid}>
          {said}
        </Text>
      ) : null}
      {rows.length === 0 ? <Text style={styles.lastText}>LOG · nothing has happened yet</Text> : null}
      {rows.map((r) => (
        <Text key={r.n} style={styles.lastText}>
          <Text style={styles.lastKind}>{KIND_WORD[r.kind]} </Text>
          {r.text}
        </Text>
      ))}
    </View>
  );
}

/** `LABEL · ON` / `LABEL · OFF`: a switch chip says its state as a word. */
export const onOff = (label: string, on: boolean): string => `${label} · ${on ? 'ON' : 'OFF'}`;

/* ── a read-only card for the well ──────────────────────────────────────── */

export function InfoCard({ head, a11y, children }: { head: string; a11y: string; children: ReactNode }) {
  return (
    <View style={styles.card} accessible accessibilityRole="summary" accessibilityLabel={a11y}>
      <Text style={styles.cardHead}>{head}</Text>
      {children}
    </View>
  );
}

/* ── two consecutive states ─────────────────────────────────────────────── */

/** Fold every change of the scene into a value: `step(acc, prev, next)` runs
 *  once per new state, in order. Pure `init` and `step` only. */
export function useWatch<T>(s: GaState, init: (s: GaState) => T, step: (acc: T, prev: GaState, next: GaState) => T): T {
  const ref = useRef<{ prev: GaState; acc: T } | null>(null);
  if (ref.current === null) ref.current = { prev: s, acc: init(s) };
  else if (ref.current.prev !== s) ref.current = { prev: s, acc: step(ref.current.acc, ref.current.prev, s) };
  return ref.current.acc;
}

const styles = StyleSheet.create({
  tray: { gap: 9 },
  group: { gap: 5 },
  gridRow: { flexDirection: 'row', gap: 6 },
  cell: { flex: 1 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  note: { flexShrink: 1, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  chip: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 5, paddingHorizontal: 6 },
  chipOn: { borderColor: 'rgba(255,198,77,0.65)', backgroundColor: '#1a1409' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 12, lineHeight: 15, letterSpacing: 0.6, textAlign: 'center' },
  chipTextOn: { color: colors.amber },
  last: { borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', paddingVertical: 6, paddingHorizontal: 8, gap: 2 },
  lastSaid: { color: '#9fd0ff', fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16 },
  lastKind: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
  lastText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 10, gap: 7 },
  cardHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
});
