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
import { viewsOf } from '../model/types.ts';
import { fitPair, fitXform } from '../geometry/frame.ts';
import { sceneFrame } from '../geometry/contentFrame.ts';
import { PlacementScene, liveReserve, type PlacementSceneProps } from './PlacementScene';
import { chooseInsetCorner } from './labelLayout.ts';

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
  // The same frames the scenes fit (the instrument's content frame when no
  // mic is on the drawing — geometry/contentFrame.ts), so both views and the
  // inset line up with what each scene draws.
  const withMics = (props.slots ?? ['A']).length > 0 || !!props.wedge || !!props.pathsFrom;
  const box = useMemo(() => {
    const authored = viewsOf(rig.lesson.model, rig.variant);
    return {
      side: authored.side ? sceneFrame(rig.lesson.model, rig.variant, 'side', withMics) : undefined,
      top: authored.top ? sceneFrame(rig.lesson.model, rig.variant, 'top', withMics) : undefined,
    };
  }, [rig.lesson, rig.variant, withMics]);
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
  // (A model may ask for the bottom-right instead: the guitar family, whose
  // headstock fills the top-right of its frame. The view tag sits bottom-left.)
  const at = rig.lesson.model.insetAt;
  const prefer = (typeof at === 'string' ? at : at?.[rig.variant]) ?? 'top';
  // A model's keep-clear rectangle (the guitars' headstock) decides between
  // the two corners at this glass's own fit — the live strip's band moves
  // the drawing down on some pages.
  const keep = rig.lesson.model.insetKeepClear?.[rig.variant]?.[view];
  const rects = {
    top: { x0: w - 4 - iw, y0: band + 2, x1: w - 4, y1: band + 2 + ih + 14 },
    bottom: { x0: w - 4 - iw, y0: Math.max(band + 2, h - ih - 14 - 4), x1: w - 4, y1: Math.max(band + 2, h - ih - 14 - 4) + ih + 14 },
  };
  const corner = keep && vb ? chooseInsetCorner(keep, (() => {
    const f = fitXform(view, props.boxOverride ?? vb, w, h - band, 8);
    return { ...f, oy: f.oy + band };
  })(), rects, prefer) : prefer;
  const top = rects[corner].y0;
  const avoid = showInset ? { x0: w - 4 - iw, y0: top, x1: w - 4, y1: top + ih + 14 } : undefined;
  return (
    <View style={{ width: w, height: h }}>
      <PlacementScene {...props} view={view} w={w} h={h} avoid={avoid} accessibilityLabel={labelFor(view)} />
      {showInset ? (
        <Pressable
          onPress={() => setView(other)}
          style={[styles.inset, { width: iw, height: ih + 14, top }]}
          accessibilityRole="button"
          accessibilityLabel={`Show the ${other} view`}
          hitSlop={6}
        >
          <PlacementScene {...props} view={other} w={iw} h={ih} mini interactive={false} accessibilityLabel={labelFor(other)} />
          <Text style={styles.insetTag}>{rig.lesson.model.viewTags?.[other] ? `${rig.lesson.model.viewTags[other]!.split(' · ')[0]} ⇄` : other === 'top' ? 'TOP ⇄' : 'SIDE ⇄'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inset: { position: 'absolute', right: 4, borderWidth: 1, borderColor: '#3a3a44', borderRadius: 6, backgroundColor: 'rgba(8,8,10,0.86)', overflow: 'hidden' },
  insetTag: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1, textAlign: 'center' },
});
