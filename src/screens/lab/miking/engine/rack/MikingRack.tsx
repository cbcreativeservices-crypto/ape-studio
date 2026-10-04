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
import { StyleSheet, View } from 'react-native';
import { RackUnit } from '../../../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../../../rack/rackTypes';

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

export function MikingRack({ spec, children }: { spec: MikingRackSpec; children: ReactNode }) {
  return (
    <RackUnit
      params={spec.params}
      initialParam={spec.initialParam}
      stage={{ size: spec.size ?? 'L', fullScreen: true, badge: spec.badge, bezel: spec.bezel, hideDragTag: true, render: spec.render }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
