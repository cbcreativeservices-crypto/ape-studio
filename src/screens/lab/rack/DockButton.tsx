/**
 * DockButton — one channel-strip key in the Rack Unit dock. SplMeter's
 * ctrlBarBtn anatomy (flex:1, r10, #26262c border, #131316 face, label over
 * mono amber value — SplMeterScreen ctrlBar, owner standard 2026-08-18) with
 * fonts raised to the app floor: Oswald 12 label / mono 14 value (the tools'
 * 9.5 is legacy, not precedent — judge-panel ruling).
 *
 * Two verbs, visually distinct (judge-panel coherence rule):
 *   ▪  fader param — tap BINDS the shared lane
 *   ▸  options/group param — tap OPENS a tray
 * Toggles render as ON/OFF keys; actions as plain keys. Long-press = the
 * param's guided lesson (v4 §5), wired via RackUnit.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type TextStyle } from 'react-native';
import { fitValue } from '../../../theme/legibility';
import { dockFitSize, dockLabelFit } from './dockFit';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from '../../../theme/tokens';
import { hapticsEnabled } from '../../../features/settings/store';

export function DockButton({
  label,
  value,
  glyph,
  selected,
  variant = 'value',
  led,
  labelLines = 1,
  frameTint,
  onPress,
  onLongPress,
  a11y,
  dim,
}: {
  label: string;
  /** Current value (mono amber). Key-variant buttons pass ''. */
  value: string;
  /** '▪' bind-lane · '▸' open-tray · undefined for key-variant buttons. */
  glyph?: '▪' | '▸';
  selected?: boolean;
  /** 'value' = the value-button (fader/tray keys). 'key' = the DISTINCT flat
   *  skin for toggles/actions — amber-selected stays reserved for bound/open
   *  (the two-verb rule; judge-panel coherence ruling). */
  variant?: 'value' | 'key';
  /** Key-variant toggles: LED dot state (green = on). */
  led?: boolean;
  /** Key-variant label line budget. 1 (default) ellipsizes; 2 lets a longer
   *  name wrap. Two 12 px lines plus the 8 px padding come to ~45 px, which
   *  still clears the 48 px minHeight, so a wrapped key does NOT make the dock
   *  taller or fall out of step with the keys beside it. */
  labelLines?: 1 | 2;
  /** Identity-colour frame (owner 2026-08-23): a fader key whose param has an
   *  identity tint (e.g. the Harmonograph's per-arm colours) wears it on the
   *  border. Bound/open stays amber — the two-verb rule outranks identity. */
  frameTint?: string;
  onPress: () => void;
  onLongPress?: () => void;
  /** Full accessibility sentence, e.g. "ROOM WIDTH: 8.4 m. Tap to adjust." */
  a11y: string;
  /** A LOCKED control (rackTypes fader `locked`): drawn dimmed. */
  dim?: boolean;
}) {
  const isKey = variant === 'key';
  // Toggles and actions share the flat KEY skin; only a toggle carries an LED.
  // A toggle already acknowledges itself by flipping that LED, so the flash is
  // reserved for actions, whose only effect happens elsewhere on screen.
  const isAction = isKey && led == null;

  /**
   * ACTION CONFIRMATION (owner 2026-08-30: "replay button stays gray — no
   * action / animation / haptic or anything - thats bad design").
   *
   * Dock buttons had NO pressed state and NO haptic, so every key in every lab
   * looked identical before, during and after a tap. That is worst for an
   * ACTION: a toggle at least flips its LED, but REPLAY's only effect is
   * out on the glass, so the key itself has to acknowledge the press. It
   * flashes amber for a moment — long enough to see, short enough not to be
   * mistaken for a selected state.
   */
  const [fired, setFired] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePress = useCallback(() => {
    if (hapticsEnabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isAction) {
      setFired(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFired(false), 220);
    }
    onPress();
  }, [isAction, onPress]);

  /**
   * SHRINK TO FIT, NEVER "…" (owner 2026-10-19: "shrink cut-off dock words
   * at 320 px to fit (9 pt minimum) in the shared dock"). At 320 wide a key's
   * label or value ended in "…" ("STOPP…", "PLATTE…"). Each line's natural
   * width is measured off screen at its authored size, against the key's
   * inner width; a line that fits today is drawn exactly as before (no change
   * at 390), one that does not is drawn at the largest size that fits, never
   * under 9 pt (dockFit). Only a line that cannot fit even at 9 pt keeps the
   * old behaviour. The verb glyph stays at 12 (it is load-bearing).
   * Measured, not guessed: the user's system font size is in the measure.
   */
  const [btnW, setBtnW] = useState(0);
  const [labelW, setLabelW] = useState(0);
  const [spacedW, setSpacedW] = useState(0);
  const [spacedGlyphW, setSpacedGlyphW] = useState(0);
  const [valueW, setValueW] = useState(0);
  const [valueH, setValueH] = useState(0);
  // Inner width: the 1 px border and 4 px padding each side; a key's LED dot
  // (8) and its gap (6) sit beside its label.
  const inner = btnW > 0 ? btnW - 2 - 2 * 4 - (isKey && led != null ? 14 : 0) : 0;
  const fitsLabel = !isKey || labelLines === 1;
  const hasGlyph = !isKey && !!glyph;
  const { fs: labelFs, tight, tracked } = fitsLabel
    ? dockLabelFit(LABEL_FS, labelW, inner, hasGlyph ? spacedW : 0, hasGlyph ? spacedGlyphW : 0, (label.length + 1) * LABEL_SPACING)
    : { fs: LABEL_FS, tight: false, tracked: true };
  const valueFs = (value ? dockFitSize(VALUE_FS, valueW, inner) : VALUE_FS) ?? VALUE_FS;
  // A shrunk label keeps its tracking in proportion; a shrunk value keeps its
  // line height, so the key (and the dock) never changes height.
  const labelSize = labelFs !== LABEL_FS ? { fontSize: labelFs, letterSpacing: tracked ? (LABEL_SPACING * labelFs) / LABEL_FS : 0 } : null;
  const valueSize = valueFs !== VALUE_FS ? { fontSize: valueFs, ...(valueH > 0 ? { lineHeight: valueH } : null) } : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        isKey && styles.key,
        // frameTint applies to KEY buttons as well (a green REPLAY border) —
        // it used to be value-buttons only.
        !selected && frameTint ? { borderColor: frameTint + (isKey ? 'aa' : '88') } : null,
        !isKey && selected && styles.btnSel,
        // A param with an IDENTITY colour (OSC 1 cyan, OSC 2 purple, an EQ
        // band…) shows its bound/open state in THAT colour, not amber — the
        // key must match the lane and the readout it drives (owner 2026-09-05:
        // "the OSC 1 button container should match the blue"). Untinted params
        // keep the amber selected skin.
        !isKey && selected && frameTint ? { borderColor: frameTint + 'b3', backgroundColor: frameTint + '1f' } : null,
        // Every key now answers the finger.
        pressed && styles.btnPressed,
        fired && styles.btnFired,
        dim && { opacity: 0.45 },
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected || !!led }}
      aria-pressed={!!selected || !!led}
      accessibilityLabel={a11y}
      onLayout={(e: LayoutChangeEvent) => setBtnW(e.nativeEvent.layout.width)}
    >
      {/* The off-screen measures (invisible, never read aloud). */}
      <Measure>
        {/* the line as drawn today */}
        <MeasureLine style={styles.label} onWidth={setLabelW}>
          {label}
          {hasGlyph ? <Text style={styles.glyph}> {glyph}</Text> : null}
        </MeasureLine>
        {hasGlyph ? (
          <>
            <MeasureLine style={styles.label} onWidth={setSpacedW}>
              {`${label} `}
            </MeasureLine>
            <MeasureLine style={styles.label} onWidth={setSpacedGlyphW}>
              {`${label} `}
              <Text style={styles.glyph}>{glyph}</Text>
            </MeasureLine>
          </>
        ) : null}
        {!isKey && value ? (
          <MeasureLine style={styles.value} onWidth={setValueW} onHeight={setValueH}>
            {value}
          </MeasureLine>
        ) : null}
      </Measure>
      {isKey ? (
        <View style={styles.keyRow}>
          {led != null ? <View style={[styles.ledDot, led && styles.ledDotOn]} /> : null}
          <Text
            style={[styles.label, labelSize, styles.keyLabel, fired && styles.labelSel]}
            numberOfLines={labelLines}
          >
            {label}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.label, labelSize, selected && styles.labelSel, selected && frameTint ? { color: frameTint } : null]} numberOfLines={1}>
            {tight ? `${label} ` : label}
            {glyph ? (
              <Text style={[styles.glyph, selected && styles.labelSel, selected && frameTint ? { color: frameTint } : null]}>
                {tight ? glyph : ` ${glyph}`}
              </Text>
            ) : null}
          </Text>
          {value ? (
            <Text style={[styles.value, valueSize, selected && frameTint ? { color: frameTint } : null]} {...fitValue(valueFs)}>
              {value}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

/** The authored sizes (styles.label / styles.value) and the label's spacing. */
const LABEL_FS = 12;
const LABEL_SPACING = 0.5;
const VALUE_FS = 14;

/** A zero-size, clipped, invisible box: what is inside is laid out but never
 *  seen, touched or read aloud. */
function Measure({ children }: { children: ReactNode }) {
  return (
    <View style={styles.measureBox} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {children}
    </View>
  );
}

/** One line at its authored size and natural (unwrapped) width. */
function MeasureLine({ style, onWidth, onHeight, children }: { style: StyleProp<TextStyle>; onWidth: (w: number) => void; onHeight?: (h: number) => void; children: ReactNode }) {
  return (
    <View style={styles.measureRow}>
      <Text
        style={style}
        onLayout={(e: LayoutChangeEvent) => {
          onWidth(e.nativeEvent.layout.width);
          onHeight?.(e.nativeEvent.layout.height);
        }}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  measureBox: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0 },
  measureRow: { position: 'absolute', left: 0, top: 0, width: 1000, flexDirection: 'row', alignItems: 'flex-start' },
  btn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    justifyContent: 'center',
  },
  // Selected = bound/open — the PopupOpt selected treatment, so labs and tools
  // light up identically.
  btnSel: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#1c1608' },
  /** Held down — a small, immediate lift so the key never feels dead. */
  btnPressed: { backgroundColor: '#23232a', borderColor: '#3a3a44' },
  /** An action just ran — a brief amber acknowledgement. */
  btnFired: { borderColor: 'rgba(255,198,77,.85)', backgroundColor: '#241a06' },
  // Toggles/actions: the flat KEY skin — no value slot, no amber-selected.
  key: { backgroundColor: '#17171c', borderColor: '#2c2c33' },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  /** In the key ROW the label must be allowed to shrink before it can wrap —
   *  without flexShrink a row child measures at its full single-line width and
   *  numberOfLines={2} never gets the chance to break it. */
  keyLabel: { flexShrink: 1, textAlign: 'center' },
  ledDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#33333c' },
  ledDotOn: { backgroundColor: colors.green },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.textSub },
  labelSel: { color: colors.amber },
  // The verb glyph is load-bearing (▪ binds, ▸ opens) — MIN_FONT 12, never 9.
  glyph: { fontSize: 12, color: colors.textSub },
  value: { fontFamily: fonts.mono, fontSize: 14, color: colors.amber },
});
