/**
 * MasteringRack — a Mastering Lab page on the Rack Unit (owner hard rule:
 * every page with a live display + controls is a Rack Unit page — display
 * above, well between, controls docked below, FULL SCREEN on). Modelled on
 * amp/AmpRack.tsx, which it reuses for its dock helpers (faderParam /
 * optionsParam); the drawing itself is handed in by the page.
 *
 *   STAGE  the page's drawing in its own shape (StageFit → the full-screen
 *          canvas zooms the picture, not a stretched box); the honesty badge
 *          silk-screened under it (MODEL vs MEASURED, per display).
 *   BEZEL  the page's readouts — level values tinted on the amplitude ramp.
 *   WELL   the only scroller: the teaching prose, cards, checks. RackUnit
 *          appends the shared NEXT / FINISH under the host's LabNavProvider.
 *   DOCK   the ParamLane bound to the page's teaching parameter + keys/trays.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { RackUnit } from '../rack/RackUnit';
import { StageFit } from '../rack/StageFit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';

export { faderParam, optionsParam } from '../amp/AmpRack';
export { flipFader } from '../soundsystems/rackLayout';

export type MasteringRackSpec = {
  /** The drawing at (w, h) — width-driven, of `aspect` (w ÷ h). */
  render: (w: number, h: number) => ReactNode;
  aspect: number;
  size?: StageSize;
  /** Honesty badge under the glass. */
  badge: string;
  bezel: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. */
  initialParam: string;
  hideDragTag?: boolean;
};

const FIT_PAD = 6;

export function MasteringRack({ spec, children }: { spec: MasteringRackSpec; children: ReactNode }) {
  const size: StageSize = spec.size ?? 'M';
  return (
    <RackUnit
      params={spec.params}
      initialParam={spec.initialParam}
      stage={{
        size,
        fullScreen: true,
        badge: spec.badge,
        bezel: spec.bezel,
        hideDragTag: spec.hideDragTag,
        render: (w, h) => {
          const fitW = Math.max(40, Math.min(Math.max(40, w - FIT_PAD * 2), Math.max(40, h - FIT_PAD * 2) * spec.aspect));
          const fitH = fitW / spec.aspect;
          return (
            <StageFit w={w} h={h} aspect={spec.aspect} pad={FIT_PAD}>
              {spec.render(fitW, fitH)}
            </StageFit>
          );
        },
      }}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
