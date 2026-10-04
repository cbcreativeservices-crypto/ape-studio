/**
 * DualView — the two views of ONE model (blueprint §5.5).
 *
 *   On the glass (≤ 250 pt tall): ONE interactive view, plus a MINI inset of
 *   the other view drawn from the same shared values; tapping the inset swaps
 *   them. (Two stacked views at 390 wide would each be ~120 pt tall, and the
 *   labels would fall under 9 pt.)
 *   In FULL SCREEN: side over top, aligned on x (one scale, one x origin —
 *   `fitPair`), both interactive. Sideways: side by side.
 */
import { useContext, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import { StageInFullScreen, useStageTextScale } from '../../../rack/stageAspect';
import type { ViewId } from '../model/types.ts';
import { fitPair } from '../geometry/frame.ts';
import { PlacementScene, liveReserve, type PlacementSceneProps } from './PlacementScene';

export type DualViewProps = Omit<PlacementSceneProps, 'view' | 'baseXf' | 'mini' | 'accessibilityLabel'> & {
  view: ViewId;
  setView: (v: ViewId) => void;
  /** A label per view (describeScene) for the canvases. */
  labelFor: (v: ViewId) => string;
};

const INSET = 0.27;

export function DualView(props: DualViewProps) {
  const { rig, w, h, view, setView, labelFor } = props;
  const inFull = useContext(StageInFullScreen);
  const textScale = useStageTextScale();
  const box = rig.lesson.model.views;
  const other: ViewId = view === 'side' ? 'top' : 'side';
  const stacked = inFull && box.side && box.top;
  const portrait = h >= w * 0.75;
  // The live strip's band over the side view (the same band PlacementScene
  // reserves on the glass): the pair is fitted below it.
  const liveCount = props.interactive !== false && props.showLive !== false ? rig.mics.filter((m) => (props.slots ?? ['A']).includes(m.slot) && m.on).length : 0;
  const band = liveReserve(liveCount, w, textScale);
  const pair = useMemo(() => {
    if (!stacked || !portrait) return null;
    const sh = box.side!.v1 - box.side!.v0;
    const th = box.top!.v1 - box.top!.v0;
    const hSide = Math.round(band + ((h - band) * sh) / (sh + th));
    const xf = fitPair(box.side!, box.top!, w, hSide - band, h - hSide, 8);
    return { hSide, hTop: h - hSide, xf: { side: { ...xf.side, oy: xf.side.oy + band }, top: xf.top } };
  }, [stacked, portrait, box, w, h, band]);

  if (stacked) {
    if (pair) {
      return (
        <View style={{ width: w, height: h }}>
          <PlacementScene {...props} view="side" w={w} h={pair.hSide} baseXf={pair.xf.side} accessibilityLabel={labelFor('side')} />
          <PlacementScene {...props} view="top" w={w} h={pair.hTop} baseXf={pair.xf.top} showLive={false} accessibilityLabel={labelFor('top')} />
        </View>
      );
    }
    const half = Math.floor(w / 2);
    return (
      <View style={{ width: w, height: h, flexDirection: 'row' }}>
        <PlacementScene {...props} view="side" w={half} h={h} accessibilityLabel={labelFor('side')} />
        <PlacementScene {...props} view="top" w={w - half} h={h} showLive={false} accessibilityLabel={labelFor('top')} />
      </View>
    );
  }

  const ob = box[other];
  const vb = box[view];
  const showInset = !!ob && !!vb;
  const iw = Math.round(Math.min(w * INSET, 150));
  const ih = ob ? Math.round(Math.min(h * 0.34, iw / ((ob.u1 - ob.u0) / (ob.v1 - ob.v0)))) : 0;
  // The inset sits TOP-RIGHT, under the live strip's band: both kick views
  // are empty there (right of the front hoop, above the port), while the
  // bottom-left — where it used to sit — holds the pedal, the beater and the
  // player's keep-out (layout pass 2026-10-04).
  const top = band + 2;
  return (
    <View style={{ width: w, height: h }}>
      <PlacementScene {...props} view={view} w={w} h={h} accessibilityLabel={labelFor(view)} />
      {showInset ? (
        <Pressable
          onPress={() => setView(other)}
          style={[styles.inset, { width: iw, height: ih + 14, top }]}
          accessibilityRole="button"
          accessibilityLabel={`Show the ${other} view`}
          hitSlop={6}
        >
          <PlacementScene {...props} view={other} w={iw} h={ih} mini interactive={false} accessibilityLabel={labelFor(other)} />
          <Text style={styles.insetTag}>{other === 'top' ? 'TOP ⇄' : 'SIDE ⇄'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inset: { position: 'absolute', right: 4, borderWidth: 1, borderColor: '#3a3a44', borderRadius: 6, backgroundColor: 'rgba(8,8,10,0.86)', overflow: 'hidden' },
  insetTag: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1, textAlign: 'center' },
});
