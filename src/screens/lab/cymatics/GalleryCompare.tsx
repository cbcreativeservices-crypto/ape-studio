/**
 * GalleryCompare — 2 or 4 saved patterns SIDE BY SIDE ON ONE CANVAS (owner
 * decision 3, 2026-09-17; Change One Thing's idiom): one card, each figure on
 * its own object face with its caption, and the comparison read as data under
 * it. Compare 4 is the same canvas in a 2×2 grid. No pager.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { formatHz } from '../../../features/cymatics/music';
import { patternReadout, type PatternGeometry } from '../../../features/cymatics/patternField';
import type { Artwork, SavedPattern } from '../../../features/cymatics/patternStore';
import { PatternFigure } from './PatternFigure';

export type CompareItem = { pattern: SavedPattern; geometry: PatternGeometry; artwork: Artwork | null };

/** The canvas: figures in a row (2) or a 2×2 grid (3–4), captions under each. */
export function CompareCanvas({ items, width }: { items: CompareItem[]; width: number }) {
  const cols = items.length <= 2 ? Math.max(1, items.length) : 2;
  const gap = 8;
  const cell = Math.floor((width - gap * (cols - 1)) / cols);
  const rows: CompareItem[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={{ width, gap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {row.map((it) => {
            const ro = patternReadout(it.pattern.state);
            return (
              <View key={it.pattern.id} style={{ width: cell }}>
                <View style={styles.cell}>
                  <PatternFigure geometry={it.geometry} artwork={it.artwork} width={cell} height={Math.round(cell * Math.max(1, it.geometry.aspect))} />
                </View>
                <Text style={styles.capName} numberOfLines={1}>
                  {it.pattern.name}
                </Text>
                <Text style={styles.capSub} numberOfLines={1}>
                  {ro.studioLabel} · {formatHz(it.pattern.state.hz)} · {ro.note.label}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** The data under the canvas: what is the same, what differs. */
export function CompareTable({ items }: { items: CompareItem[] }) {
  const rows = useMemo(() => items.map((it) => ({ name: it.pattern.name, ro: patternReadout(it.pattern.state) })), [items]);
  const sameHz = new Set(items.map((it) => Math.round(it.pattern.state.hz))).size === 1;
  const sameStudio = new Set(items.map((it) => it.pattern.state.studio)).size === 1;
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={i} style={styles.tr}>
          <Text style={styles.th} numberOfLines={1}>
            {String.fromCharCode(65 + i)} · {r.name}
          </Text>
          <Text style={styles.td} numberOfLines={2}>
            {r.ro.title}
          </Text>
        </View>
      ))}
      <Text style={styles.verdict}>
        {sameHz && !sameStudio
          ? 'Same frequency, different objects — whatever differs in the figures, the tone did not do it.'
          : sameHz
            ? 'Same frequency. If the figures differ, something about the object differs: read the rows above for which setting.'
            : sameStudio
              ? 'Different frequencies on the same kind of object — each figure is one of the object’s own modes.'
              : 'Different objects at different frequencies — compare the modes, not the notes.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#0b0b10' },
  capName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary, marginTop: 4 },
  capSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  table: { gap: 6 },
  tr: { gap: 1 },
  th: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  td: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  verdict: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textPrimary, marginTop: 4 },
});
