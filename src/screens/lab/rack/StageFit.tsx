/**
 * StageFit / StageBox — the two ways a drawing sits on the glass, shared by
 * every rack lab that opts into FULL SCREEN (moved out of Sound Systems
 * 2026-09-25).
 */
import { useContext, useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { StageAspectReport } from './stageAspect';

/**
 * StageFit — fits a width-driven drawing (the lab's SVG instruments render
 * `width="100%"` with an `aspectRatio` style) inside the glass: the widest
 * box of the drawing's aspect that fits (w, h), centred. The size comes from
 * the glass, so nothing is ever resized mid-interaction. Reports its aspect so
 * the FULL SCREEN canvas is exactly the drawing's shape at every zoom.
 */
export function StageFit({ w, h, aspect, pad = 6, children }: { w: number; h: number; aspect: number; pad?: number; children: ReactNode }) {
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.aspect(aspect, pad);
  }, [report, aspect, pad]);
  const innerW = Math.max(40, w - pad * 2);
  const innerH = Math.max(40, h - pad * 2);
  const fitW = Math.max(40, Math.min(innerW, innerH * aspect));
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: fitW }}>{children}</View>
    </View>
  );
}

/** A full-width, vertically centred stage for view-built instruments (the
 *  console's bus bank, the rack of glyphs) that size to their content. Its
 *  text keeps its size at any box size, so it reports `fixed()` and the rack
 *  shows no FULL SCREEN button for it. */
export function StageBox({ w, h, pad = 8, children }: { w: number; h: number; pad?: number; children: ReactNode }) {
  const report = useContext(StageAspectReport);
  useEffect(() => {
    report?.fixed();
  }, [report]);
  return (
    <View style={{ width: w, height: h, paddingHorizontal: pad, alignItems: 'stretch', justifyContent: 'center' }}>{children}</View>
  );
}
