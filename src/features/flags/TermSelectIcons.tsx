/**
 * TermSelectIcons — the selectable per-term icon row shown in term list popups
 * (Booth 2026-07-18): every listed term can be tagged into the user's lists.
 *   🔖 bookmark · ♥ heart · ★ the user's CUSTOM LIST (Booth 2026-07-18 naming;
 *   it also feeds their notifications later) · ✓ known / ✗ unknown (one
 *   state — ✓ adds to the known list, ✗ removes; one of the pair is lit).
 * Lists live in flaggedStore (device-persisted, app-wide live updates).
 *
 * HOLD-TO-CONFIRM (user request 2026-07-17): these are selection buttons, not
 * filter toggles (no popup list behind them), so a LONG PRESS is free to show
 * a small bubble confirming what the button does — Flagged / Favorites /
 * Custom / Known. Deliberately NOT on ✗ (remove).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DeckIcon } from '../../components/DeckIcon';
import { fonts } from '../../theme/tokens';
import {
  setInTermList,
  toggleBookmark,
  toggleTermList,
  useBookmarks,
  useTermList,
} from './flaggedStore';

/** Bookmark glyph (user request 2026-07-18 — replaces the ⚑ flag). Filled when
 *  the term is bookmarked, outline otherwise; tints with the toggle colour. */
export function BookmarkIcon({ color, filled, size = 16 }: { color: string; filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Small transient bubble naming the held button's action. */
function HintBubble({ text }: { text: string }) {
  return (
    <View style={styles.hintBubble} pointerEvents="none">
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

/**
 * Hook: transient hold-hint state (auto-hides). Shared by this row and any
 * standalone selection button that wants the same hold-to-confirm bubble.
 */
export function useHoldHint(): { hint: string | null; showHint: (text: string) => void } {
  const [hint, setHint] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const showHint = (text: string) => {
    setHint(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(null), 1600);
  };
  return { hint, showHint };
}

/**
 * Standalone hold-to-confirm wrapper for single selection buttons elsewhere
 * (e.g. the Glossary flag star): tap acts as usual, holding shows the bubble.
 */
export function HoldHintPressable({
  hint,
  onPress,
  accessibilityLabel,
  selected,
  children,
}: {
  hint: string;
  onPress: () => void;
  accessibilityLabel: string;
  selected?: boolean;
  children: ReactNode;
}) {
  const h = useHoldHint();
  return (
    <View>
      {h.hint ? <HintBubble text={h.hint} /> : null}
      <Pressable
        onPress={onPress}
        onLongPress={() => h.showHint(hint)}
        delayLongPress={350}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityState={selected == null ? undefined : { selected }}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </View>
  );
}

function IconToggle({
  glyph,
  renderGlyph,
  on,
  onColor,
  label,
  onPress,
  onLongPress,
}: {
  glyph?: string;
  /** Custom (non-text) glyph, e.g. an SVG — receives the resolved colour. */
  renderGlyph?: (color: string) => ReactNode;
  on: boolean;
  onColor: string;
  label: string;
  onPress: () => void;
  /** Hold-to-confirm (user request 2026-07-17) — shows the row bubble. */
  onLongPress?: () => void;
}) {
  const color = on ? onColor : '#54565c';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
    >
      {renderGlyph ? (
        renderGlyph(color)
      ) : (
        <Text
          style={[
            styles.icon,
            on && {
              color: onColor,
              textShadowColor: `${onColor}80`,
              textShadowRadius: 6,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          {glyph}
        </Text>
      )}
    </Pressable>
  );
}

export function TermSelectIcons({
  id,
  bookmarkCtx,
  hideKnown = false,
  hideBookmark = false,
}: {
  id: string;
  bookmarkCtx: string;
  /** Bookmark/custom lists only need the bookmark + custom toggles — hide the
   *  ✓/✗ known–unknown pair (user request 2026-07-25). */
  hideKnown?: boolean;
  /** Hide the bookmark toggle too — for contexts where bookmarking isn't valid
   *  (e.g. the Enrollments custom-list popup), leaving only the custom-list
   *  icon (user request 2026-07-25). */
  hideBookmark?: boolean;
}) {
  const bookmarked = useBookmarks(bookmarkCtx);
  const starred = useTermList('starred');
  const known = useTermList('known');
  const isKnown = known.has(id);
  const { hint, showHint } = useHoldHint();
  return (
    <View style={styles.row}>
      {hint ? <HintBubble text={hint} /> : null}
      {hideBookmark ? null : (
        <IconToggle
          renderGlyph={(c) => <BookmarkIcon color={c} filled={bookmarked.has(id)} />}
          on={bookmarked.has(id)}
          onColor="#b45bff"
          label={bookmarked.has(id) ? 'Remove bookmark' : 'Bookmark term'}
          onPress={() => toggleBookmark(bookmarkCtx, id)}
          onLongPress={() => showHint(bookmarked.has(id) ? 'Removes from Bookmarks' : 'Adds to Bookmarks')}
        />
      )}
      <IconToggle
        renderGlyph={(c) => (
          <DeckIcon color={c} size={17} fill={starred.has(id) ? `${c}33` : 'none'} />
        )}
        on={starred.has(id)}
        onColor="#2f9bff"
        label={starred.has(id) ? 'Remove from custom list' : 'Add to custom list'}
        onPress={() => toggleTermList('starred', id)}
        onLongPress={() => showHint(starred.has(id) ? 'Removes from Custom list' : 'Adds to Custom list')}
      />
      {hideKnown ? null : (
        <>
          <IconToggle
            glyph="✓"
            on={isKnown}
            onColor="#5bff85"
            label="Mark known"
            onPress={() => setInTermList('known', id, true)}
            onLongPress={() => showHint('✓ Marks as Known')}
          />
          {/* ✗ deliberately has NO hold hint (user request 2026-07-17: "not remove"). */}
          <IconToggle
            glyph="✗"
            on={!isKnown}
            onColor="#ff6a5e"
            label="Mark unknown"
            onPress={() => setInTermList('known', id, false)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { fontSize: 17, color: '#54565c' },
  // Hold-to-confirm bubble — sits just above the held row, right-aligned so it
  // stays inside popup cards. Rows render after (above) the rows before them,
  // so an upward bubble is never covered by a neighbour.
  hintBubble: {
    position: 'absolute',
    bottom: 26,
    right: 0,
    zIndex: 10,
    elevation: 10,
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.55)',
    borderRadius: 7,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  hintText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: '#ffc64d' },
});
