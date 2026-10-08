/**
 * MikingRack — a Miking lesson page on the Rack Unit (owner hard rule: every
 * page with a live display + controls is a Rack Unit page — display above,
 * well between, controls docked below, FULL SCREEN on). The drumtuning/
 * DrumRack shape.
 *
 * No StageFit: the scene fits its own model box to whatever (w, h) it is
 * given (fitXform), and in full screen the dual view needs the whole body
 * (side over top, aligned on x), so the stage reports no fixed aspect and
 * zooms as a plain box.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { RackUnit } from '../../../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../../../rack/rackTypes';
import { mikingGlassHeight } from './glassHeight.ts';
import { dockShort } from './dockWords.ts';

export type MikingRackSpec = {
  render: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Honesty badge under the glass. */
  badge: string;
  bezel: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. */
  initialParam: string;
};

/** Owner decision X3 (2026-10-08): word values on the dock and the bezel take
 *  their short form (engine/rack/dockWords.ts) — one rule for every lesson;
 *  the full word stays in the accessibility label. */
export function shortDockParams(params: DockParam[]): DockParam[] {
  return params.map((p) => {
    if (p.kind === 'options' || p.kind === 'group') {
      const v = dockShort(p.valueLabel);
      return v === p.valueLabel ? p : { ...p, valueLabel: v, valueA11y: p.valueA11y ?? p.valueLabel };
    }
    if (p.kind === 'fader') {
      const short = p.formatShort ?? p.format;
      return { ...p, formatShort: (x: number) => dockShort(short(x)) };
    }
    return p;
  });
}
export function shortBezel(bezel: BezelItem[]): BezelItem[] {
  return bezel.map((b) => {
    const v = dockShort(b.v);
    return v === b.v ? b : { ...b, v, vA11y: b.vA11y ?? b.v };
  });
}

export function MikingRack({ spec, children }: { spec: MikingRackSpec; children: ReactNode }) {
  // Taller where the screen allows (owner 2026-10-06): engine/rack/glassHeight.ts.
  const { height: winH } = useWindowDimensions();
  const phoneHeight = mikingGlassHeight(winH);
  return (
    <RackUnit
      params={shortDockParams(spec.params)}
      initialParam={spec.initialParam}
      stage={{ size: spec.size ?? 'L', phoneHeight, fullScreen: true, badge: spec.badge, bezel: shortBezel(spec.bezel), hideDragTag: true, render: spec.render }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
