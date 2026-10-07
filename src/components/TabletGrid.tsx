/**
 * TabletGrid — lays a MENU's cards out in columns on a tablet, and does
 * NOTHING on a phone (owner iPad report 2026-10-06: "blank space on both
 * sides of the narrowed phone-width display … looks not designed for iPad").
 *
 * Wrap the sibling cards of a menu in it. On a tablet they flow into as many
 * columns as fit at `minTile` wide (at most `maxCols`), each card exactly one
 * column wide; a short last row keeps its column width instead of stretching.
 *
 * ✅ NO PIXEL MOVES ON ANY PHONE: below the 600 pt short edge it renders its
 * children through a Fragment — no wrapper View, no style, the parent's own
 * `gap` still spaces them — so the phone tree is the tree it always was.
 *
 * The width it divides is MEASURED (onLayout) — the column it sits in may be
 * padded, capped or inside a card — and is estimated from the window until the
 * first layout lands, so the first frame is already in columns.
 */
import { Children, isValidElement, useState, type ReactNode } from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { gridColumns, isTabletWindow, tileSpan } from '../theme/tablet';
import { WIDE_MAX_W } from '../theme/readingColumn';

export function TabletGrid({
  children,
  minTile = 320,
  maxCols = 3,
  gap = 14,
  inset = 32,
  style,
}: {
  children: ReactNode;
  /** The narrowest a card may get before the grid drops a column. */
  minTile?: number;
  maxCols?: number;
  gap?: number;
  /** Horizontal space the grid does NOT get (padding around it) — only for
   *  the first-frame estimate; the measured width wins once it lands. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  if (!isTabletWindow(winW, winH)) return <>{children}</>;

  const avail = measured > 0 ? measured : Math.min(winW, WIDE_MAX_W) - inset;
  const cols = gridColumns(avail, minTile, gap, 1, maxCols);
  const span = tileSpan(avail, cols, gap);
  const items = Children.toArray(children); // toArray already drops null / undefined / booleans

  return (
    <View
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap, width: '100%' }, style]}
      onLayout={(e) => {
        const w = Math.floor(e.nativeEvent.layout.width);
        if (w > 0 && Math.abs(w - measured) >= 1) setMeasured(w);
      }}
    >
      {items.map((child, i) => (
        <View key={isValidElement(child) && child.key != null ? String(child.key) : `tg-${i}`} style={{ width: span }}>
          {child}
        </View>
      ))}
    </View>
  );
}
