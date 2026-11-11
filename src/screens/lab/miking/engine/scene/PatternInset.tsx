/**
 * PatternInset — a small read-only picture in the stage corner of a STUDIO OR
 * LIVE page: the ideal pattern and where the monitor arrives on it.
 *
 * Why it exists: the dashed lobe drawn at the mic in PlacementScene is a fixed
 * 170 mm, so on a wide context frame it is 15–25 px on top of the instrument,
 * and a plan view of a mic aimed down cuts every pattern at about 90° all
 * round, so cardioid, super and hyper draw nearly the same circle. This inset
 * always shows the true shape and the true arrival angle (arrivalAngle), in
 * any view, at any zoom.
 *
 * Built on the Microphone page's own PolarCompare, unchanged: it is mounted
 * taller than the window here and clipped, so only the rings, the lobe, the
 * nulls, the mic, the amber source and FRONT → show. PolarCompare's two long
 * tags fall outside the window (they would not fit a corner), and the one
 * caption row below replaces them.
 *
 * It takes the corner of the stage that leaves the mic and the monitor in
 * sight, so it never hides what the page is about. When no corner is clear
 * (the mic, the instrument and the monitor spread across the frame), the scene
 * narrows to the left and the inset has the right-hand column to itself.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform, project } from '../geometry/frame.ts';
import type { MicPattern, Vec3, ViewBox, ViewId } from '../model/types.ts';
import { PolarCompare } from './PolarCompare';

const AMBER = '#ffc64d';
/** Room above and below the window, hiding PolarCompare's wrapped tags. */
const TAG_ROOM = 64;
/** The caption row's height at 9 pt, and the clear margin round a marked point. */
const ROW_H = 16;
const CLEAR = 16;
type Corner = { left: boolean; top: boolean };
/** Most frames leave the bottom of the stage empty, and the view tag sits bottom left. */
const CORNERS: readonly Corner[] = [
  { left: false, top: false },
  { left: false, top: true },
  { left: true, top: true },
  { left: true, top: false },
];

/** The first corner that covers none of the points, or null when each covers one. */
function clearCorner(w: number, h: number, wide: number, tall: number, view: ViewId, box: ViewBox, avoid: readonly Vec3[]): Corner | null {
  const xf = fitXform(view, box, w, h, 8);
  const pts = avoid.map((p) => project(xf, p));
  const covers = (c: Corner) => pts.some(({ sx, sy }) => (c.left ? sx < wide + CLEAR : sx > w - wide - CLEAR) && (c.top ? sy < tall + CLEAR : sy > h - tall - CLEAR));
  return CORNERS.find((c) => !covers(c)) ?? null;
}

/** The caption's opening words: names the inset, and what amber stands for. */
export function patternInsetBadge(live: boolean, source = 'monitor'): string {
  return `Corner inset: pattern shape, amber = ${live ? source : 'test source'} · white dashed = shape only, not range`;
}

export function PatternInset({ w, h, view, box, avoid, typeId, pattern, angle, source, children }: {
  w: number;
  h: number;
  /** The scene's view and frame, to find what the inset must not cover. */
  view: ViewId;
  box: ViewBox;
  avoid: readonly Vec3[];
  typeId: string;
  pattern: MicPattern;
  /** Degrees off the mic's front axis (arrivalAngle). */
  angle: number;
  /** The amber dot's name; null in STUDIO, where no monitor is on the page. */
  source: string | null;
  /** The scene the inset sits on, at the width it is given. */
  children: (sceneW: number) => ReactNode;
}) {
  const scale = useStageTextScale();
  const fs = Math.max(9, 9.5 * scale);
  const room = TAG_ROOM * scale;
  const side = Math.round(Math.max(92, Math.min(170 * scale, Math.min(w, h) * 0.42)));
  const inner = side - 8;
  const tall = side + 2 * room;
  const name = source ?? 'TEST SOURCE';
  // PolarCompare centres its lobe at 52% of its height: line that up with the window.
  const top = side / 2 - tall * 0.52;
  const corner = clearCorner(w, h, side + 6, side + ROW_H * scale + 6, view, box, avoid);
  const label = `Inset: the ${pattern} pattern's shape, with ${name.toLowerCase()} ${Math.round(angle)} degrees off the front axis.`;
  return (
    <View style={{ width: w, height: h }}>
      {children(corner ? w : w - side - 8)}
      <View pointerEvents="none" accessible accessibilityRole="image" accessibilityLabel={label} style={[styles.inset, corner?.left ? { left: 4 } : { right: 4 }, !corner || corner.top ? { top: 4 } : { bottom: 4 }]}>
        <View style={{ width: side, height: side, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 4, top }}>
            <PolarCompare w={inner} h={tall} typeId={typeId} pattern={pattern} angle={angle} label={label} />
          </View>
        </View>
        <View style={[styles.row, { width: side }]}>
          <Text style={[styles.tag, { fontSize: fs, color: colors.textSubAlt }]}>PATTERN</Text>
          <Text {...fitValue(fs)} style={[styles.tag, styles.source, { fontSize: fs, color: AMBER }]}>{name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inset: { position: 'absolute', backgroundColor: 'rgba(12,13,17,0.94)', borderWidth: 1, borderColor: '#3a3b46', borderRadius: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, paddingBottom: 2 },
  tag: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  source: { flexShrink: 1, textAlign: 'right' },
});
