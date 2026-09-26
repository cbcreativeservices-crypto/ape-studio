/**
 * ExpandableFigure — FULL SCREEN for a figure that is NOT on a rack glass
 * (owner 2026-09-25 legibility pass). Cable Install, De-Esser, Speech,
 * Envelope, the Amplifier modules and the Mic Principles Capsule tab draw
 * their diagrams inline in a scrolling page; they have no HIDE DISPLAY row
 * to hang a button on. This wrapper draws the figure exactly as before and
 * puts a "⤢ FULL SCREEN" button directly UNDER it — never over it (nothing
 * hovers over a drawing) — opening the same StageFullScreen the racks use:
 * zoom 1/1.5/2/3×, drag to pan, every orientation, the badge riding along.
 *
 * `render(w, h)` is called at the inline width AND at the zoomed size, so the
 * figure keeps its page state and its taps. `aspect` (width ÷ height) is what
 * makes the zoomed canvas the drawing's own shape; a width-driven SVG with a
 * viewBox of W × H has aspect W / H. Give the SVG a height of `w / aspect`
 * (not a fixed pixel height) and `preserveAspectRatio="none"` becomes
 * harmless — the box has the viewBox's ratio at every size, so nothing
 * stretches.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { StageFullScreen } from '../rack/StageFullScreen';

export function ExpandableFigure({
  render,
  aspect,
  badge,
  title,
  label = 'FULL SCREEN',
  width,
  controls,
}: {
  /** The figure at (w, h). h = w / aspect. */
  render: (w: number, h: number) => ReactNode;
  /** width ÷ height of the drawing. */
  aspect: number;
  /** Honesty badge shown under the full-screen view (a disclosure travels). */
  badge?: string;
  /** Title in the full-screen bar (default DISPLAY). */
  title?: string;
  /** Button wording (default FULL SCREEN). */
  label?: string;
  /** The inline width when the host already knows it; otherwise measured. */
  width?: number;
  /** The page's controls for this figure, docked under it in full screen so
   *  the learner can adjust and watch the drawing change (owner 2026-09-25).
   *  Render the SAME control elements the page shows — they share state. */
  controls?: ReactNode;
}) {
  const [measured, setMeasured] = useState(0);
  const [full, setFull] = useState(false);
  const w = width ?? measured;
  const h = w > 0 ? Math.round(w / aspect) : 0;
  return (
    <View style={styles.root} onLayout={width ? undefined : (e) => setMeasured(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? <View style={{ width: w, height: h }}>{render(w, h)}</View> : null}
      <Pressable
        onPress={() => setFull(true)}
        style={styles.btn}
        hitSlop={{ top: 4, bottom: 6, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Open the drawing full screen"
        accessibilityHint="Shows the drawing at full size with zoom"
      >
        <Text style={styles.btnText}>⤢  {label}</Text>
      </Pressable>
      <StageFullScreen
        visible={full}
        onClose={() => setFull(false)}
        render={render}
        badge={badge}
        glassW={w}
        aspect={aspect}
        title={title}
        controls={controls}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: 6 },
  btn: {
    minHeight: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2c2c33',
    borderRadius: 8,
    backgroundColor: '#101114',
  },
  btnText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11.5,
    letterSpacing: 1.6,
    color: colors.textSubAlt,
  },
});
