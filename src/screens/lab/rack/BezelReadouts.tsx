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
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { fitValue } from '../../../theme/legibility';
import type { BezelItem } from './rackTypes';
import { bezelKeyFit, dockValueFitSize } from './dockFit';

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
/** The tap caret after a tappable cell's key: the key line's measures carry it
 *  too (the line drawn below writes it out). */
const TAP_CARET = ' ›';
/** The smallest a value may be drawn (owner: lab display text ≥ 9 pt). */
const V_MIN_FS = 9;
/** The sub line's authored size (styles.unit). */
const SUB_FS = 11;
/** The web reports whole-pixel widths, so its key and sub fits keep a margin
 *  (dockFit, frame round 2); a phone's widths are fractional, and there the
 *  bezel fits exactly as before (checker follow-up, 2026-11-13). */
const WEB = Platform.OS === 'web';

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
  //
  // ⛔ AT THE USER'S FONT SIZE, NOT OURS (owner 2026-09-29, Android
  // large-screen pass). The width estimate assumed font scale 1. Android users
  // very often raise the system font size (1.3 is common; Android 14 goes to
  // 2.0), and every glyph grows with it — so a value measured as fitting was
  // really ~30 % wider and the NUMBER itself was cut to an ellipsis, the one
  // thing this cell promises never happens. `fontScale` is live from the
  // window; at the default 1 nothing changes.
  const { fontScale } = useWindowDimensions();
  const [cellW, setCellW] = useState(0);
  const avail = cellW > 0 ? cellW - CELL_PAD : Infinity;
  const fits = (s: string) => s.length * V_CH * (fontScale || 1) <= avail;
  const cropped = !fits(it.v);
  const parts = cropped ? splitUnit(it.v) : null;
  const stacked = cropped && parts != null && !fits(it.v) ;
  // A NUMBER STILL TOO WIDE (full run 2, 2026-10-01): a bare number with no
  // unit to stack (or the number line of a stack) that is wider than the
  // cell was cut to an ellipsis by numberOfLines — and the cropped path even
  // appended " ›" to it. It is drawn smaller instead, never under 9 pt; the
  // tap caret is dropped with the key line (the lifted cell still reads as
  // tappable).
  const numFs = (s: string): { fontSize: number } | null =>
    fits(s) ? null : { fontSize: Math.max(V_MIN_FS, Math.floor((V_FS * avail * 10) / (s.length * V_CH * (fontScale || 1))) / 10) };
  // ⛔ A KEY IS WHOLE, SHORT OR GONE — NEVER "…" (held frame item 4,
  // 2026-11-13: "SURFA…", "PLAYI…" at 320). The value fits but the key does
  // not: the key line is measured off screen at its natural width (the tap
  // caret included) against the cell's inner width; it shortens to `kNarrow`
  // when the readout has one that fits, else it goes and the value keeps the
  // cell. A key that fits is drawn exactly as before. It must fit with
  // BEZEL_KEY_MARGIN_PX to spare (frame round 2): both widths are whole-pixel
  // measures on the web, and a key "fitting" within half a pixel was cut.
  const [keyW, setKeyW] = useState(0);
  const [narrowW, setNarrowW] = useState(0);
  const keyAvail = cellW > 0 ? cellW - CELL_PAD - (it.frame ? 2 : first ? 0 : 1) : 0;
  const keyFit = bezelKeyFit(keyAvail, keyW, it.kNarrow ? narrowW : undefined, WEB);
  const keyText = keyFit === 'narrow' && it.kNarrow ? it.kNarrow : it.k;
  // ⛔ THE SUB LINE SHRINKS, NEVER "…" (frame round 2, 2026-11-13: DJ Systems
  // at 320 drew "USE A SCAL…", "dBA (MOD…", "SETTING U…"). fitValue's
  // shrink-to-fit is native only; on the web the line was simply cut. It is
  // measured like the dock's values and drawn at the largest size that fits
  // with VALUE_FIT_MARGIN_PX to spare, never under 9 pt; a sub that fits is
  // drawn exactly as before, and one that cannot fit even at 9 pt as before.
  // Web only: on a phone fitValue's own shrink-to-fit already does this.
  const [subW, setSubW] = useState(0);
  const subFs = WEB && it.sub ? (dockValueFitSize(SUB_FS, subW, keyAvail) ?? SUB_FS) : SUB_FS;
  return (
    <Pressable
      style={[styles.cell, { flex: it.flex ?? 1 }, first && styles.cellFirst, it.onPress && styles.cellTappable, it.frame ? [styles.cellFramed, { borderColor: it.frame, borderLeftColor: it.frame }] : null]}
      onPress={it.onPress}
      onLongPress={it.helpKey ? () => onHelp?.(it.helpKey) : undefined}
      delayLongPress={350}
      disabled={!it.onPress && !it.helpKey}
      accessibilityRole={it.onPress ? 'button' : 'text'}
      accessibilityLabel={`${it.k}: ${it.vA11y ?? it.v}${it.sub ? ` ${it.sub}` : ''}${it.helpKey ? ' — long-press for its lesson' : ''}`}
      // On the web floored, never rounded up (frame round 2): the width arrives
      // as a whole pixel already (63.58 as 64), and BEZEL_KEY_MARGIN_PX covers
      // that. On a phone rounded, as before (checker follow-up).
      onLayout={(e) => setCellW(WEB ? Math.floor(e.nativeEvent.layout.width) : Math.round(e.nativeEvent.layout.width))}
    >
      {/* The key line's natural widths (invisible, never read aloud). */}
      <View style={styles.measureBox} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <View style={styles.measureRow}>
          <Text style={styles.k} onLayout={(e) => setKeyW(e.nativeEvent.layout.width)}>
            {it.k}
            {it.onPress ? <Text style={styles.tapMark}>{TAP_CARET}</Text> : null}
          </Text>
        </View>
        {it.kNarrow ? (
          <View style={styles.measureRow}>
            <Text style={styles.k} onLayout={(e) => setNarrowW(e.nativeEvent.layout.width)}>
              {it.kNarrow}
              {it.onPress ? <Text style={styles.tapMark}>{TAP_CARET}</Text> : null}
            </Text>
          </View>
        ) : null}
        {it.sub ? (
          <View style={styles.measureRow}>
            <Text style={[styles.v, styles.unit]} onLayout={(e) => setSubW(e.nativeEvent.layout.width)}>
              {it.sub}
            </Text>
          </View>
        ) : null}
      </View>
      {cropped || keyFit === 'none' ? null : (
          <Text style={styles.k} numberOfLines={1}>
            {keyText}
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
          <Text style={[styles.v, it.tint ? { color: it.tint } : null, numFs(parts[0])]} numberOfLines={1}>
            {parts[0]}
          </Text>
          <Text style={[styles.v, styles.unit, it.tint ? { color: it.tint } : null]} numberOfLines={1}>
            {parts[1]}
          </Text>
        </>
      ) : (
        <Text style={[styles.v, it.tint ? { color: it.tint } : null, numFs(it.v)]} numberOfLines={1}>
          {it.v}
        </Text>
      )}
      {it.sub ? (
        <Text style={[styles.v, styles.unit, it.tint ? { color: it.tint } : null, subFs !== SUB_FS ? { fontSize: subFs } : null]} {...fitValue(subFs)}>
          {it.sub}
        </Text>
      ) : null}
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
  /** A cell with its own coloured frame (BezelItem.frame). */
  cellFramed: { borderWidth: 1, borderLeftWidth: 1, borderRadius: 7, margin: 3 },
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
  /** A zero-size, clipped, invisible box for the key measures (DockButton's). */
  measureBox: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0 },
  measureRow: { position: 'absolute', left: 0, top: 0, width: 1000, flexDirection: 'row', alignItems: 'flex-start' },
});
