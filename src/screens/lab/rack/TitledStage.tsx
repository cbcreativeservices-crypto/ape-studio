/**
 * TitledStage — the current item's NAME (and an optional SUBTITLE line)
 * printed in full, centred, at the top of the display itself, above the
 * drawing (owner 2026-09-29: "the adding of title and subtitle text over the
 * full screen display works so apply it elsewhere as it would improve full
 * screen labs that could use that info more clearly in front and readable
 * for the user"). First built on Sound Systems Learn 3 (f3075049).
 *
 * Why inside the stage and not on the bezel: a bezel cell crops a long name
 * ("SMALL POWERED-LOU…"), and FULL SCREEN draws the same `stage(w, h)` — with
 * only DISPLAY in its bar and the page's reading left behind — so a header
 * drawn here tells the learner what they are looking at, in full, where they
 * are looking. The bezel keeps the short readouts.
 *
 * It wraps the page's StageFit:
 *
 *   stage: (w, h) => (
 *     <TitledStage w={w} h={h} aspect={PLOT_W / PLOT_H} title={t.name} subtitle={t.scale}>
 *       <VenueView … />
 *     </TitledStage>
 *   )
 *
 * WHERE IT SHOWS
 *  - FULL SCREEN: always. The text grows with StageTextScale, so it zooms
 *    with the drawing.
 *  - On the GLASS: only when the drawing has spare height to give (a wide
 *    drawing letterboxed in the glass). A height-limited plan would shrink to
 *    make room and push its labels under the 9 pt floor (measured on Learn 3
 *    at 390 wide: 13 pt plot labels drawn at 7.7 pt), so there the glass shows
 *    the drawing at full size and the page's reading below names the item.
 *    `glass="always"` overrides this for a drawing whose text has margin.
 *
 * The header is MEASURED, not guessed: each mount (glass, full screen) keeps
 * its own height, so a long line wraps — never crops — and the drawing gets
 * exactly the height that is left. 13 / 11 pt, never under 9 pt.
 */
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { StageFit } from './StageFit';
import { StageAspectReport, StageInFullScreen, useStageTextScale } from './stageAspect';

/** First-frame height guess before the header is measured (one / two lines). */
export const STAGE_TITLE_H = 36;
export const STAGE_TITLE_SUB_H = 50;

export function TitledStage({
  w,
  h,
  aspect,
  pad = 6,
  title,
  subtitle,
  titleTint = colors.cyanBright,
  subtitleTint = colors.amber,
  glass = 'if-room',
  children,
}: {
  w: number;
  h: number;
  /** The drawing's aspect, exactly as its StageFit had it. */
  aspect: number;
  pad?: number;
  /** The current item's name — printed upper-case. */
  title: string;
  /** One context line under it (scale, group, where it stands…). */
  subtitle?: string;
  titleTint?: string;
  subtitleTint?: string;
  /** On the glass: 'if-room' (default) shows the header only when the
   *  drawing keeps its full size; 'always' shows it regardless. */
  glass?: 'if-room' | 'always';
  children: ReactNode;
}) {
  const full = useContext(StageInFullScreen);
  const scale = useStageTextScale();
  const ts = full ? Math.max(1, scale) : 1;
  const [headH, setHeadH] = useState(0);
  const guess = (subtitle ? STAGE_TITLE_SUB_H : STAGE_TITLE_H) * ts;
  const need = headH || guess;
  // Width-limited drawing = the header sits in its letterbox for free.
  const drawW = w - pad * 2;
  const roomy = (h - need - pad * 2) * aspect >= drawW;
  const show = full || glass === 'always' || roomy;
  const bodyH = show ? Math.max(40, h - need) : h;
  // FULL SCREEN sizes its canvas to the drawing's shape. Report the shape
  // WITH the header on top, so the header gets its own rows and the drawing
  // keeps the whole width (reported by the StageFit alone, the header ate
  // into the drawing and left the screen's spare height empty).
  const report = useContext(StageAspectReport);
  const shape = Math.round((1 / (1 / aspect + need / Math.max(40, drawW))) * 1000) / 1000;
  useEffect(() => {
    if (full) report?.aspect(shape, pad);
  }, [full, report, shape, pad]);
  const fit = (
    <StageFit w={w} h={bodyH} aspect={aspect} pad={pad}>
      {children}
    </StageFit>
  );
  return (
    <View style={{ width: w, height: h }}>
      {show ? (
        <View
          style={[styles.head, { minHeight: 36 * ts, paddingVertical: 5 * ts }]}
          accessible
          accessibilityRole="header"
          accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
          onLayout={(e) => {
            const hh = Math.ceil(e.nativeEvent.layout.height);
            if (hh !== headH) setHeadH(hh);
          }}
        >
          <Text style={[styles.title, { color: titleTint, fontSize: 13 * ts, lineHeight: 16 * ts }]}>{title.toUpperCase()}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleTint, fontSize: 11 * ts, lineHeight: 14 * ts }]}>{subtitle.toUpperCase()}</Text>
          ) : null}
        </View>
      ) : null}
      {full ? <StageAspectReport.Provider value={null}>{fit}</StageAspectReport.Provider> : fit}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { justifyContent: 'center', paddingHorizontal: 10, gap: 1 },
  title: { fontFamily: fonts.oswaldSemiBold, letterSpacing: 0.8, textAlign: 'center' },
  subtitle: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.6, textAlign: 'center' },
});
