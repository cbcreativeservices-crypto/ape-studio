/**
 * PlotView — the stage plot of the packet, on screen, in the print look:
 * black lines on white paper, exactly as the PDF draws it.
 *
 * It draws `spPlotScene` (features/stageplot/spPacketHtml), the same short
 * list of lines, boxes and words the HTML sheet's SVG is made of, so the plot
 * in the preview and the plot on paper cannot differ.
 *
 * ON A PHONE IT FITS THE WIDTH (owner 2026-11-13: build the remaining held
 * items). The scene is laid out in points at the printed size (its words 9 pt
 * or more), and the names are placed for that size. On a screen narrower
 * than that, the whole plot is first shown made smaller to fit the width, so
 * nothing on the page scrolls sideways; ZOOM IN shows it at its printed size,
 * where every name is readable, inside its own frame that slides sideways
 * (the page itself never does). A line under it says which it is.
 *
 * THE KEY IS ALWAYS THERE (owner 2026-11-12; review 2, visuals C). On a
 * narrow screen the key is not part of the drawing: it is laid out under it
 * at the window's own width (`spPlotPreview`: the same cells in fewer
 * columns), at its readable size, so every entry is in view without
 * scrolling and without zooming.
 *
 * The drawing is one labeled image for a screen reader, and the key is a
 * second one that names every entry; the same information is in the packet's
 * text view.
 */
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { SpDocPlot } from '../../../../features/stageplot/spDocTypes';
import { SP_DASH, SP_INK, spPlotPreview, type SpPlotScene, type SpSceneOp } from '../../../../features/stageplot/spPacketHtml';
import { fonts } from '../../../../theme/tokens';
import { Button } from '../spForm';

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

/** One scene as one image: its words are in `label`, the SVG itself is hidden
 *  from a screen reader. `drawW`: drawn this wide (the whole scene made
 *  smaller to fit), instead of at its own size. */
function Scene({ scene, label, drawW }: { scene: SpPlotScene; label: string; drawW?: number }) {
  const w = drawW ?? scene.w;
  const h = drawW ? (scene.h * drawW) / scene.w : scene.h;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label}>
      {Platform.OS === 'web' ? (
        // a browser's <svg> does not know the two native props: it is hidden with aria-hidden
        <Svg aria-hidden width={w} height={h} viewBox={`0 0 ${scene.w} ${scene.h}`}>
          {scene.ops.map(op)}
        </Svg>
      ) : (
        <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${scene.w} ${scene.h}`}>
          {scene.ops.map(op)}
        </Svg>
      )}
    </View>
  );
}

export function PlotView({ plot, width }: { plot: SpDocPlot; width: number }) {
  const [zoomed, setZoomed] = useState(false);
  const parts = spPlotPreview(plot, width, SP_PLOT_MIN_W);
  const count = plot.items.length;
  const about = `Stage plot drawing, seen from above, with the audience at the bottom: ${count} ${count === 1 ? 'object' : 'objects'}. ${plot.sizeNote}.`;
  const also = 'Every object is also listed in the text view of the packet.';
  if (!parts.scrolls) return <Scene scene={parts.stage} label={`${about} ${plot.key.length ? 'A key under the stage names each kind of symbol. ' : ''}${also}`} />;
  // the frame is the window's width: the page never scrolls sideways
  const fitW = Math.max(120, Math.floor(width));
  return (
    <View style={[styles.wrap, { width: fitW }]}>
      {zoomed ? (
        <ScrollView horizontal showsHorizontalScrollIndicator style={{ width: fitW }} contentContainerStyle={styles.scrollBody}>
          <Scene scene={parts.stage} label={`${about} ${also}`} />
        </ScrollView>
      ) : (
        <Scene scene={parts.stage} drawW={fitW} label={`${about} ${also}`} />
      )}
      <Text style={styles.hint}>
        {zoomed
          ? 'The plot at full size, so every name is readable. Slide it sideways inside this frame to see all of it.'
          : 'The whole plot, made smaller to fit your screen. ZOOM IN shows it full size, where every name is readable.'}
        {parts.key ? ' The key under it stays in view.' : ''}
      </Text>
      <Button label={zoomed ? 'ZOOM OUT: FIT THE SCREEN' : 'ZOOM IN: FULL SIZE'} a11yLabel={zoomed ? 'Show the whole plot made smaller to fit the screen' : 'Show the plot at full size, sliding sideways inside its frame'} onPress={() => setZoomed((z) => !z)} />
      {parts.key ? <Scene scene={parts.key} label={`Key: ${plot.key.map((k) => k.name).join('; ')}.`} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  scrollBody: { paddingBottom: 4 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#444444' },
});
