/**
 * DjRack — a DJ Systems Lab screen on the Rack Unit (the CymaticsRackLayout /
 * MikingRack shape; owner rule: every page with a live display uses the rack).
 *
 *   STAGE  the shared booth (or a lesson's own drawing of it), PINNED on the
 *          glass, the read-only readouts on the bezel, FULL SCREEN on (a
 *          working surface: the dock comes along, everything zooms).
 *   WELL   the only scroller: the lesson's five steps — UNDERSTAND,
 *          EXPLORE, LISTEN & OBSERVE, PRACTICE, CHECK YOURSELF — and the
 *          in-flow NEXT / FINISH the rack draws at its end.
 *   DOCK   every real control of the page (the bezel is read-only).
 *
 * The glass is taller where the screen allows (the Miking rule): the booth's
 * knobs and faders are the lesson, and a 250 pt glass made them small.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';

export type DjRackSpec = {
  render: (w: number, h: number) => ReactNode;
  bezel: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. */
  initialParam: string;
  badge?: string;
  size?: StageSize;
};

/** Glass height on a tall phone: clamp(0.38 × window, 250, 350); a phone
 *  under 760 pt keeps the rack's own rule (the rack drops a size below 700). */
export function djGlassHeight(winH: number): number | undefined {
  if (!(winH >= 760)) return undefined;
  return Math.max(250, Math.min(350, Math.round(winH * 0.38)));
}

export function DjRack({ spec, children }: { spec: DjRackSpec; children: ReactNode }) {
  const { height: winH } = useWindowDimensions();
  return (
    <RackUnit
      params={spec.params}
      initialParam={spec.initialParam}
      stage={{
        size: spec.size ?? 'L',
        phoneHeight: djGlassHeight(winH),
        minWell: 120,
        fullScreen: true,
        badge: spec.badge,
        bezel: spec.bezel,
        hideDragTag: false,
        render: spec.render,
      }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
