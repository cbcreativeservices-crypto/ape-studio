/**
 * PlotView — the stage plot of the packet, on screen, in the print look:
 * black lines on white paper, exactly as the PDF draws it.
 *
 * It draws `spPlotScene` (features/stageplot/spPacketHtml), the same short
 * list of lines, boxes and words the HTML sheet's SVG is made of, so the plot
 * in the preview and the plot on paper cannot differ.
 *
 * READABLE ON A PHONE. The scene is laid out in points and its words are 9 pt
 * or more. It is drawn at its own size, never scaled down: on a screen
 * narrower than the drawing the plot scrolls sideways, and a line under it
 * says so. Shrinking it to fit would make the names too small to read.
 *
 * The drawing is one labeled image for a screen reader; the same information
 * is in the packet's text view.
 */
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { SpDocPlot } from '../../../../features/stageplot/spDocTypes';
import { SP_DASH, SP_INK, spPlotScene, type SpSceneOp } from '../../../../features/stageplot/spPacketHtml';
import { fonts } from '../../../../theme/tokens';

/** The narrowest the plot is drawn (points): close to its width on paper. */
export const SP_PLOT_MIN_W = 520;

const dash = (on: boolean): string | undefined => (on ? SP_DASH.replace(' ', ',') : undefined);

function op(o: SpSceneOp, key: number) {
  if (o.t === 'rect') return <Rect key={key} x={o.x} y={o.y} width={o.w} height={o.h} rx={o.r || undefined} fill={o.fill} stroke={o.stroke} strokeWidth={o.sw} />;
  if (o.t === 'circle') return <Circle key={key} cx={o.cx} cy={o.cy} r={o.r} fill={o.fill} stroke={o.stroke} strokeWidth={o.sw} strokeDasharray={dash(o.dash)} />;
  if (o.t === 'line') return <Line key={key} x1={o.x1} y1={o.y1} x2={o.x2} y2={o.y2} stroke={o.stroke} strokeWidth={o.sw} strokeDasharray={dash(o.dash)} />;
  if (o.t === 'poly') {
    const points = o.pts.join(' ');
    return o.closed ? (
      <Polygon key={key} points={points} fill={o.fill} stroke={o.stroke} strokeWidth={o.sw} strokeLinejoin="round" strokeDasharray={dash(o.dash)} />
    ) : (
      <Polyline key={key} points={points} fill="none" stroke={o.stroke} strokeWidth={o.sw} strokeLinejoin="round" strokeDasharray={dash(o.dash)} />
    );
  }
  return (
    <SvgText
      key={key}
      x={o.x}
      y={o.y}
      fill={SP_INK}
      fontSize={o.size}
      fontFamily={o.bold ? fonts.barlowSemiBold : fonts.barlowRegular}
      textAnchor={o.anchor}
      transform={o.rotate ? `rotate(${o.rotate} ${o.x} ${o.y})` : undefined}
    >
      {o.text}
    </SvgText>
  );
}

export function PlotView({ plot, width }: { plot: SpDocPlot; width: number }) {
  const sceneW = Math.max(SP_PLOT_MIN_W, Math.floor(width));
  const scene = spPlotScene(plot, sceneW);
  const scrolls = sceneW > width + 0.5;
  const count = plot.items.length;
  const drawing = (
    <View accessible accessibilityRole="image" accessibilityLabel={`Stage plot drawing, seen from the audience: ${count} ${count === 1 ? 'object' : 'objects'}. ${plot.sizeNote}. Every object is also listed in the text view of the packet.`}>
      {Platform.OS === 'web' ? (
        // a browser's <svg> does not know the two native props: it is hidden with aria-hidden
        <Svg aria-hidden width={scene.w} height={scene.h} viewBox={`0 0 ${scene.w} ${scene.h}`}>
          {scene.ops.map(op)}
        </Svg>
      ) : (
        <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={scene.w} height={scene.h} viewBox={`0 0 ${scene.w} ${scene.h}`}>
          {scene.ops.map(op)}
        </Svg>
      )}
    </View>
  );
  if (!scrolls) return drawing;
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.scrollBody}>
        {drawing}
      </ScrollView>
      <Text style={styles.hint}>The plot is shown at its printed size so the names stay readable. Scroll sideways to see all of it.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  scrollBody: { paddingBottom: 4 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#444444' },
});
