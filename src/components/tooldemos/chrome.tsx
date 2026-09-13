/**
 * tooldemos/chrome — the ONE shared visual contract for the seven tool demos
 * (design pass 2026-09-13, spec of record in commit 0a56fec4; extraction
 * 2026-09-13 after every authoring agent asked for it).
 *
 * Everything here is verbatim from the seven demo files it replaced — the
 * extraction is ZERO visual change. The pieces:
 *
 *  - Callout palette: amber = the thing being taught, salmon = the mistake /
 *    limit / warning, steel = neutral reference; LEADER = thin white leader
 *    lines. PINK_NOISE is the one source hue shared across demos (pink noise
 *    is drawn pink in RtaDemo and SignalGenDemo — no theme token exists).
 *  - `demoStyles`: the outer demo card, the rack-key scene-tab chips, the
 *    recessed glass viz panel, and the structured caption text styles.
 *  - `SceneTabs`: the rack-key tablist row. Per-demo a11y labels / hitSlop /
 *    row tweaks (wrap, gap) ride in via props so each file keeps its exact
 *    pre-extraction behavior.
 *  - `DemoPanel`: a plain View carrying the recessed glass frame (#0b0c0e,
 *    hairline rgba(255,255,255,.07) border, radius 10); local extras (height,
 *    overflow, padding) compose via `style`.
 *  - `DemoCaption`: WATCH FOR — … / body / FIELD NOTE stack. Prefix and text
 *    overrides exist because two demos deviate by design (Spectrogram's
 *    "FIELD NOTE — " separator; SplDemo's watch line-height).
 *
 * The two in-SVG Callout helpers stay in their own files on purpose: Waveform's
 * is a pixel-space chip-backed label, Spectrogram's a percentage-space leader +
 * text — different coordinate systems, not one component.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

/* ----------------------------- callout palette ---------------------------- */

/** The thing being taught / correct (== colors.amberDeep). */
export const CALLOUT_AMBER = colors.amberDeep;
/** The mistake / limit / warning. */
export const CALLOUT_SALMON = '#ff8d7a';
/** Neutral reference. */
export const CALLOUT_STEEL = '#9aa3ad';
/** Thin white callout leader lines. */
export const LEADER = 'rgba(255,255,255,.35)';
/** Pink-noise source hue (pink noise is drawn pink — owner 2026-08-05). */
export const PINK_NOISE = '#ff8fae';

/* ------------------------------ shared styles ----------------------------- */

export const demoStyles = StyleSheet.create({
  /** Outer demo card — each demo adds its own padding/gap locally. */
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
  },

  /** Rack-key scene tabs. */
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextOn: { color: colors.amber },

  /** Recessed glass instrumentation panel. */
  glass: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.07)',
    backgroundColor: '#0b0c0e',
  },

  /** Structured caption — WATCH FOR / body / FIELD NOTE. */
  captionBlock: { gap: 5 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  captionBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  // True italic face: Android does not synthesize italics for custom fonts,
  // so barlowRegular + fontStyle:'italic' rendered UPRIGHT on device (flagged
  // by the SignalGen authoring agent). No fontStyle here — the face is italic.
  fieldNote: {
    fontFamily: fonts.barlowItalic,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
});

/* -------------------------------- SceneTabs ------------------------------- */

export interface SceneTab {
  key: string;
  label: string;
  /** Screen-reader label — each demo keeps its exact pre-extraction phrasing. */
  a11yLabel?: string;
}

export function SceneTabs({
  tabs,
  active,
  onSelect,
  hitSlop,
  rowStyle,
}: {
  tabs: readonly SceneTab[];
  active: number;
  onSelect: (index: number) => void;
  hitSlop?: number;
  /** Row tweaks (wrap, gap, margins) so each demo keeps its exact layout. */
  rowStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[demoStyles.chipRow, rowStyle]} accessibilityRole='tablist'>
      {tabs.map((t, i) => {
        const on = i === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onSelect(i)}
            accessibilityRole='tab'
            accessibilityLabel={t.a11yLabel ?? t.label}
            accessibilityState={{ selected: on }}
            aria-selected={on}
            hitSlop={hitSlop}
            style={[demoStyles.chip, on && demoStyles.chipOn]}
          >
            <Text style={[demoStyles.chipText, on && demoStyles.chipTextOn]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------- DemoPanel ------------------------------- */

/** Recessed glass frame; pass height/overflow/padding extras via `style`. */
export function DemoPanel({ style, children, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[demoStyles.glass, style]}>
      {children}
    </View>
  );
}

/* ------------------------------- DemoCaption ------------------------------ */

export function DemoCaption({
  watch,
  body,
  note,
  notePrefix = 'FIELD NOTE: ',
  style,
  watchStyle,
  noteStyle,
}: {
  /** Rendered after "WATCH FOR — " (string, or nested Text for a styled body). */
  watch: ReactNode;
  body: ReactNode;
  /** Rendered after `notePrefix`; pass notePrefix='' if the copy carries it. */
  note?: ReactNode;
  notePrefix?: string;
  style?: StyleProp<ViewStyle>;
  watchStyle?: StyleProp<TextStyle>;
  noteStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[demoStyles.captionBlock, style]}>
      <Text style={[demoStyles.watchFor, watchStyle]}>WATCH FOR — {watch}</Text>
      <Text style={demoStyles.captionBody}>{body}</Text>
      {note != null ? (
        <Text style={[demoStyles.fieldNote, noteStyle]}>
          {notePrefix}
          {note}
        </Text>
      ) : null}
    </View>
  );
}
