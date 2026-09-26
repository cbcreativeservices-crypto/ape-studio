/**
 * BezelReadouts — the readouts printed ON the display: a strip of backlit
 * legend windows under the stage glass (the "readouts inside the display"
 * global default; per-viz IN-CANVAS readouts remain a phase-2 upgrade path).
 * Carries ReadoutGrid's {k, v, helpKey} contract so wave/digital readout
 * items map across 1:1. Long-press a cell = its guided-lesson entry; cells
 * with onPress keep the tools' tap-to-reset behavior. New component → fonts
 * at the MIN_FONT 12 floor.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { BezelItem } from './rackTypes';

export function BezelReadouts({
  items,
  onGuide,
  onHelp,
}: {
  items: BezelItem[];
  /** ⓘ display-guide slot at the strip's end. */
  onGuide?: () => void;
  onHelp?: (helpKey?: string) => void;
}) {
  return (
    <View style={styles.strip}>
      {items.map((it, i) => (
        <Cell key={`${it.k}${i}`} it={it} first={i === 0} onHelp={onHelp} />
      ))}
      {onGuide ? (
        <Pressable
          style={styles.guide}
          onPress={onGuide}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="What the display shows"
        >
          <Text style={styles.guideGlyph}>ⓘ</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Mono value width per character at V_FS (Share Tech Mono ≈ 0.6 em). */
const V_FS = 13.5;
const V_CH = V_FS * 0.6;
const CELL_PAD = 16;

/** Split "−15.9 LUFS" / "-15.9LUFS" / "2.8LU" into its number and its unit,
 *  so a cropped value can stack them instead of losing its tail. */
function splitUnit(v: string): [string, string] | null {
  const m = v.match(/^([^A-Za-z%°]*[0-9.)])\s*([A-Za-z%°][^\s]*(?:\s+[^\s]+)*)$/);
  if (!m || !m[1].trim() || !m[2].trim()) return null;
  return [m[1].trim(), m[2].trim()];
}

function Cell({ it, first, onHelp }: { it: BezelItem; first: boolean; onHelp?: (helpKey?: string) => void }) {
  // ⛔ A CROPPED READOUT IS A WRONG READOUT (owner 2026-09-26: "if they begin
  // to get cropped, then drop the descriptor text and just show the #
  // readout"). Five cells on a 375 phone left "INTEGRAT…" over "-15.9LU…".
  // Once the cell's width is known, a value that would not fit drops its
  // key line and, if the bare number still does not fit, stacks number over
  // unit — the number is never cut and no font ever goes under 9 pt.
  const [cellW, setCellW] = useState(0);
  const avail = cellW > 0 ? cellW - CELL_PAD : Infinity;
  const fits = (s: string) => s.length * V_CH <= avail;
  const cropped = !fits(it.v);
  const parts = cropped ? splitUnit(it.v) : null;
  const stacked = cropped && parts != null && !fits(it.v) ;
  return (
    <Pressable
      style={[styles.cell, { flex: it.flex ?? 1 }, first && styles.cellFirst, it.onPress && styles.cellTappable]}
      onPress={it.onPress}
      onLongPress={it.helpKey ? () => onHelp?.(it.helpKey) : undefined}
      delayLongPress={350}
      disabled={!it.onPress && !it.helpKey}
      accessibilityRole={it.onPress ? 'button' : 'text'}
      accessibilityLabel={`${it.k}: ${it.v}${it.helpKey ? ' — long-press for its lesson' : ''}`}
      onLayout={(e) => setCellW(Math.round(e.nativeEvent.layout.width))}
    >
      {cropped ? null : (
          <Text style={styles.k} numberOfLines={1}>
            {it.k}
            {/* ── A TAPPABLE CELL MUST LOOK TAPPABLE (2026-09-18) ────────────
                Interactive and static cells were pixel-identical: same border,
                same padding, same type, no affordance of any kind. In Cymatics
                the RES cell's tap-to-land is the primary escape from "I turned
                the knob and nothing is happening", and it was invisible — the
                only hint was a sentence in the well, below the experiment card
                and the colour key, a scroll away from the control it described.

                A caret on the KEY line, not the value: the value is a live
                readout and often near its width limit, and this must not push
                it into an ellipsis. */}
            {it.onPress ? <Text style={styles.tapMark}> ›</Text> : null}
          </Text>
      )}
      {stacked && parts ? (
        <>
          <Text style={[styles.v, it.tint ? { color: it.tint } : null]} numberOfLines={1}>
            {parts[0]}
            {it.onPress ? <Text style={styles.tapMark}> ›</Text> : null}
          </Text>
          <Text style={[styles.v, styles.unit, it.tint ? { color: it.tint } : null]} numberOfLines={1}>
            {parts[1]}
          </Text>
        </>
      ) : (
        <Text style={[styles.v, it.tint ? { color: it.tint } : null]} numberOfLines={1}>
          {it.v}
          {cropped && it.onPress ? <Text style={styles.tapMark}> ›</Text> : null}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#3a3a44',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#121316',
    overflow: 'hidden',
    minHeight: 44, // interactive cells (tap-to-reset / long-press lesson)
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#26262c',
    gap: 1,
  },
  cellFirst: { borderLeftWidth: 0 },
  /** Interactive cells read as slightly lifted glass, not as a different control. */
  cellTappable: { backgroundColor: 'rgba(255,198,77,0.05)' },
  tapMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, color: colors.amber },
  k: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  v: { fontFamily: fonts.mono, fontSize: V_FS, color: colors.amber },
  unit: { fontSize: 11, opacity: 0.85 },
  guide: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#26262c',
  },
  guideGlyph: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSub },
});
