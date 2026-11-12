/**
 * chbBits — view helpers shared by chapter 2's pages (6–10) only.
 *
 *   tray furniture   a heading and a row of chips, for a `group` dock key;
 *                    `TrayChip` is 44 points high. A tray COVERS the well
 *                    while it is open, so a tray whose presses need reading
 *                    shows the newest log lines (`TrayLog`).
 *   read-only        the door's chain (page 6), the game-information table
 *   figures          (page 8) and the strip of takes (page 9). None of them
 *                    is a control. Each carries its state in words for a
 *                    screen reader, and no state is shown by color alone.
 *   one hook         `useCountWhen` judges "this fact happened WHILE that
 *                    was true" from the model's own counts.
 *
 * A page never tidies the scene when it is left. GaRack's page-open reset
 * (the model's `enterPage`) takes every planted fault out and puts every
 * setting back before the next page teaches anything.
 */
import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { ActivityLog } from '../bits';
import type { GaState } from '../model/gaModel';
import { doorChainSummary, type ChbChain } from './data/chbPipeline';
import type { ChbTake } from './data/chbScene';

/* ── hooks ──────────────────────────────────────────────────────────────── */

/** How many times `count` went up, during this visit, at a moment when `ok`
 *  was true. `count` is one of the model's own fact counts, so a press that
 *  the model did not record never counts. */
export function useCountWhen(count: number, ok: boolean): number {
  const last = useRef(count);
  const n = useRef(0);
  if (count > last.current && ok) n.current += 1;
  last.current = count;
  return n.current;
}

/* ── tray furniture ─────────────────────────────────────────────────────── */

export function TrayBox({ children }: { children: ReactNode }) {
  return <View style={styles.tray}>{children}</View>;
}
export function TrayRow({ head, children }: { head: string; children: ReactNode }) {
  return (
    <View style={styles.trayGroup}>
      <Text style={styles.trayHead}>{head}</Text>
      <View style={styles.trayChips}>{children}</View>
    </View>
  );
}
export function TrayNote({ children }: { children: ReactNode }) {
  return <Text style={styles.trayNote}>{children}</Text>;
}

/** `LABEL · ON` / `LABEL · OFF`: a switch chip says its state as a word. */
export const onOff = (label: string, on: boolean): string => `${label} · ${on ? 'ON' : 'OFF'}`;

/** A chip in a tray: the house chip's look at a full 44-point touch height
 *  (the option trays' own height). `selected` is told to a screen reader;
 *  for a sighted reader the page puts a mark or a word in the label
 *  (`marked`, `onOff`), never the highlight alone. */
export function TrayChip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}
/** The newest log lines, inside a tray. */
export function TrayLog({ state, lines = 2 }: { state: GaState; lines?: number }) {
  return <ActivityLog state={state} lines={lines} />;
}

/* ── page 6: the chain ──────────────────────────────────────────────────── */

/** The door's chain as three numbered cards with a named link under each.
 *  The fourth card, RESULT, is the activity log the page puts below it. */
export function ChainCards({ chain, posted, doorWord }: { chain: ChbChain; posted: number; doorWord: string }) {
  return (
    <View style={styles.chain} accessible accessibilityRole="summary" accessibilityLabel={`${doorChainSummary(chain)} The door is ${doorWord.toLowerCase()}; it posted its event ${posted} ${posted === 1 ? 'time' : 'times'} on this visit.`}>
      {chain.cards.map((card, i) => {
        const brokenLink = chain.broken && i === 0;
        return (
          <View key={card.id} style={styles.chainItem}>
            <View style={[styles.card, chain.broken && card.id === 'event' && styles.cardBad]}>
              <View style={styles.cardHead}>
                <View style={styles.num}>
                  <Text style={styles.numText}>{i + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{card.head}</Text>
                <Text style={styles.cardStage}>{card.stage}</Text>
              </View>
              {card.rows.map((r, k) => (
                <View key={`${r.k}${k}`} style={styles.row}>
                  <Text style={styles.rowKey}>{r.k}</Text>
                  <Text style={[styles.rowVal, r.bad && styles.rowBad]}>
                    {r.bad ? '✕ ' : ''}
                    {r.v}
                  </Text>
                </View>
              ))}
              {card.id === 'scene' ? (
                <View style={styles.row}>
                  <Text style={styles.rowKey}>NOW</Text>
                  <Text style={styles.rowVal}>{`door ${doorWord.toLowerCase()} · posted ${posted} ${posted === 1 ? 'time' : 'times'} on this visit`}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.link}>
              <Text style={[styles.linkMark, brokenLink && styles.linkBad]}>{brokenLink ? '✕' : '▼'}</Text>
              <Text style={[styles.linkText, brokenLink && styles.linkBad]}>{chain.links[i]}</Text>
            </View>
          </View>
        );
      })}
      <View style={styles.cardHead}>
        <View style={styles.num}>
          <Text style={styles.numText}>4</Text>
        </View>
        <Text style={styles.cardTitle}>RESULT</Text>
        <Text style={styles.cardStage}>TEST</Text>
      </View>
    </View>
  );
}

/* ── page 8: local and global ───────────────────────────────────────────── */

export type SyncRow = {
  object: string;
  /** The kind of local information: SWITCH or PARAMETER. */
  kind: string;
  value: string;
  /** The value is wrong for this object (the planted fault), with the reason. */
  wrong?: string;
};

/** What the game is telling the audio side about each object: one LOCAL
 *  value per row, and the one GLOBAL state repeated on every row. */
export function SyncTable({ rows, state }: { rows: SyncRow[]; state: string }) {
  const label =
    `Game information, one row for each object. ` +
    rows.map((r) => `${r.object}: local ${r.kind.toLowerCase()}, ${r.value}${r.wrong ? `, wrong: ${r.wrong}` : ''}`).join('. ') +
    `. Global state for every object: mood ${state.toLowerCase()}. A trigger has no row: it happens once and is gone, and the log records it.`;
  return (
    <View style={styles.table} accessible accessibilityRole="summary" accessibilityLabel={label}>
      <View style={styles.tRow}>
        <Text style={[styles.tHead, styles.tObj]}>OBJECT</Text>
        <Text style={[styles.tHead, styles.tLocal]}>LOCAL · ITS OWN</Text>
        <Text style={[styles.tHead, styles.tGlobal]}>GLOBAL · SHARED</Text>
      </View>
      {rows.map((r) => (
        <View key={r.object} style={[styles.tRow, styles.tLine]}>
          <Text style={[styles.tCell, styles.tObj, styles.tObjText]}>{r.object}</Text>
          <View style={styles.tLocal}>
            <Text style={styles.tKind}>{r.kind}</Text>
            <Text style={[styles.tCell, r.wrong ? styles.rowBad : null]}>
              {r.wrong ? '✕ ' : ''}
              {r.value}
            </Text>
            {r.wrong ? <Text style={[styles.tKind, styles.rowBad]}>{r.wrong}</Text> : null}
          </View>
          <View style={styles.tGlobal}>
            <Text style={styles.tKind}>STATE</Text>
            <Text style={styles.tCell}>{`mood: ${state}`}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.tFoot}>A trigger has no row. It happens once and is gone; the log records it.</Text>
    </View>
  );
}

/* ── page 9: the takes that played ──────────────────────────────────────── */

/** The footstep takes played on this visit, oldest on the left. A take that
 *  is the same as the one before it is marked with a double frame and the
 *  word SAME. */
export function TakeStrip({ takes, surfaceName }: { takes: readonly ChbTake[]; surfaceName: (s: ChbTake['surface']) => string }) {
  const repeats = takes.filter((t) => t.repeat).length;
  const label = takes.length
    ? `Footstep takes played, oldest first: ${takes.map((t) => `take ${t.take} on ${surfaceName(t.surface).toLowerCase()}${t.repeat ? ', the same as the one before' : ''}`).join('; ')}. Takes that repeat the one before: ${repeats}.`
    : 'Footstep takes played: none yet.';
  return (
    <View style={styles.strip} accessible accessibilityRole="summary" accessibilityLabel={label}>
      <Text style={styles.stripHead}>TAKES PLAYED — OLDEST ON THE LEFT</Text>
      {takes.length === 0 ? <Text style={styles.stripEmpty}>No steps yet. Press STEP in the dock.</Text> : null}
      <View style={styles.stripRow}>
        {takes.map((t) => (
          <View key={t.key} style={styles.tileWrap}>
            <View style={[styles.tile, t.repeat && styles.tileRepeat]}>
              <Text style={[styles.tileNum, t.repeat && styles.rowBad]}>{t.take}</Text>
            </View>
            <Text style={[styles.tileWord, t.repeat && styles.rowBad]}>{t.repeat ? 'SAME' : ' '}</Text>
          </View>
        ))}
      </View>
      {takes.length ? (
        <Text style={styles.stripFoot}>{`${surfaceName(takes[takes.length - 1].surface)} · ${repeats === 0 ? 'no take repeats the one before it' : `${repeats} ${repeats === 1 ? 'take repeats' : 'takes repeat'} the one before`}`}</Text>
      ) : null}
    </View>
  );
}

const BAD = '#ff6b5e';

const styles = StyleSheet.create({
  tray: { gap: 10 },
  trayGroup: { gap: 5 },
  trayHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  trayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  trayNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  chip: { minHeight: 44, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextOn: { color: colors.amber },

  chain: { gap: 2 },
  chainItem: { gap: 2 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', borderTopColor: '#3a3a44', borderLeftColor: '#3a3a44', backgroundColor: '#0d0d10', padding: 10, gap: 4 },
  cardBad: { borderColor: 'rgba(255,107,94,0.6)', borderTopColor: 'rgba(255,107,94,0.6)', borderLeftColor: 'rgba(255,107,94,0.6)' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  num: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.cyanBright, alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.cyanBright, fontFamily: fonts.oswaldSemiBold, fontSize: 11 },
  cardTitle: { flex: 1, color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.3 },
  cardStage: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowKey: { width: 76, color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1, lineHeight: 18 },
  rowVal: { flex: 1, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  rowBad: { color: BAD },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingVertical: 3 },
  linkMark: { width: 14, textAlign: 'center', color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12 },
  linkText: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  linkBad: { color: BAD },

  table: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', borderTopColor: '#3a3a44', borderLeftColor: '#3a3a44', backgroundColor: '#0d0d10', paddingHorizontal: 10, paddingVertical: 8 },
  tRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 5 },
  tLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#34343c' },
  tHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1 },
  tObj: { width: 82 },
  tObjText: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  tLocal: { flex: 1.25 },
  tGlobal: { flex: 1 },
  tKind: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1 },
  tCell: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  tFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#34343c' },

  strip: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', borderTopColor: '#3a3a44', borderLeftColor: '#3a3a44', backgroundColor: '#0d0d10', padding: 10, gap: 6 },
  stripHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  stripEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13 },
  stripRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tileWrap: { alignItems: 'center', gap: 1 },
  tile: { width: 27, height: 27, borderRadius: 6, borderWidth: 1, borderColor: '#4a4a55', backgroundColor: '#16161b', alignItems: 'center', justifyContent: 'center' },
  tileRepeat: { borderWidth: 3, borderColor: BAD },
  tileNum: { color: colors.amber, fontFamily: fonts.mono, fontSize: 14 },
  tileWord: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 0.6 },
  stripFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
