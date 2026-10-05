/**
 * KeysExplorer — an electric piano as an ORIENT display (no mic): the tine
 * piano from the front or from above; the reed piano from the seated player,
 * cut from the side (its speaker on the lid, or on the amp rail behind it),
 * or one of its oval speakers face-on. Tap a part to name it; the page names
 * it in the well. Static: it changes only when the learner taps or switches.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { SPEAKER_OVAL_4x8 as OV } from './keysSpec.ts';
import { RHODES_FRONT, RHODES_TOP, WURLI_FRONT, rhodesHit, wurliFrontHit } from './keysGeometry.ts';
import { OvalFace, RhodesFrontArt, RhodesTopArt, WurliFrontArt, WurliSection, ovalHit, ovalLabels, rhodesLabels, wurliFrontLabels, wurliHitTest, type OvalSpot, type WurliMount } from './KeysArt';
import { FACE_TOP, W } from './wurliModel.ts';

export type KeysShow = 'rhodesFront' | 'rhodesTop' | 'wurliFront' | 'wurliLid' | 'wurliSide' | 'oval';

export function keysBox(show: KeysShow) {
  switch (show) {
    case 'rhodesFront':
      return { u0: -RHODES_FRONT.half - 70, u1: RHODES_FRONT.half + 70, v0: RHODES_FRONT.top - 70, v1: 30 };
    case 'rhodesTop':
      return { u0: -RHODES_TOP.half - 40, u1: RHODES_TOP.half + 40, v0: RHODES_TOP.back - 40, v1: RHODES_TOP.front + 70 };
    case 'wurliFront':
      return { u0: -WURLI_FRONT.half - 70, u1: WURLI_FRONT.half + 70, v0: W.caseTopY - 70, v1: 30 };
    case 'wurliLid':
      return { u0: -WURLI_FRONT.half - 40, u1: WURLI_FRONT.half + 40, v0: W.caseTopY - 70, v1: W.caseBottomY + 70 };
    case 'wurliSide':
      return { u0: W.caseBackX - 40, u1: 120, v0: FACE_TOP.y - 110, v1: W.caseBottomY + 70 };
    case 'oval':
      return { u0: -OV.aFrame - 40, u1: OV.aFrame + 40, v0: -OV.bFrame - 44, v1: OV.bFrame + 44 };
  }
}

function labelsFor(show: KeysShow, mount: WurliMount): StaticLabel[] {
  switch (show) {
    case 'rhodesFront':
      return rhodesLabels('front');
    case 'rhodesTop':
      return rhodesLabels('top');
    case 'wurliFront':
    case 'wurliLid':
      return wurliFrontLabels().filter((l) => show === 'wurliFront' || l.id !== 'pedal');
    case 'wurliSide':
      return [
        { id: 'lid', text: 'LID', u: (W.caseBackX + FACE_TOP.x) / 2, v: W.caseTopY - 30, align: 'center', tone: 'muted' },
        { id: 'spk', text: mount === 'lid' ? 'SPEAKER SCREWED TO THE LID' : 'SPEAKER ON THE AMP RAIL', short: 'SPEAKER', u: FACE_TOP.x + 10, v: FACE_TOP.y - 64, align: 'center', tone: 'amber' },
        { id: 'act', text: 'ACTION · REEDS · PICKUP', short: 'ACTION', u: -380, v: W.caseBottomY + 34, align: 'center', tone: 'muted' },
        { id: 'keys', text: 'KEYS · PLAYER →', short: 'KEYS →', u: 60, v: W.keyBottomY + 34, align: 'right', tone: 'muted' },
      ];
    case 'oval':
      return ovalLabels();
  }
}

function hitFor(show: KeysShow, u: number, v: number, tol: number): string | null {
  switch (show) {
    case 'rhodesFront':
      return rhodesHit('front', u, v, tol);
    case 'rhodesTop':
      return rhodesHit('top', u, v, tol);
    case 'wurliFront':
    case 'wurliLid':
      return wurliFrontHit(u, v, tol);
    case 'wurliSide':
      return wurliHitTest('side', u, v, tol);
    case 'oval':
      return ovalHit(u, v, tol);
  }
}

export function KeysExplorer({ w, h, show, mount = 'lid', spot = null, highlight, onTapPart, accessibilityLabel }: { w: number; h: number; show: KeysShow; mount?: WurliMount; spot?: OvalSpot | null; highlight?: string | null; onTapPart?: (id: string) => void; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const box = keysBox(show);
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = useMemo(() => labelsFor(show, mount), [show, mount]);
  const tap = (x: number, y: number) => {
    if (!onTapPart) return;
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const id = hitFor(show, u, v, 22 / xf.s);
    if (id) onTapPart(id);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {show === 'rhodesFront' ? <RhodesFrontArt hi={highlight} /> : null}
            {show === 'rhodesTop' ? <RhodesTopArt hi={highlight} /> : null}
            {show === 'wurliFront' || show === 'wurliLid' ? <WurliFrontArt hi={highlight} mount={mount} /> : null}
            {show === 'wurliSide' ? <WurliSection view="side" mount={mount} showPlayer={false} hi={highlight} /> : null}
            {show === 'oval' ? <OvalFace spot={spot} hi={highlight} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}

/** The drawing's aspect (w ÷ h) for a figure. */
export function keysAspect(show: KeysShow): number {
  const b = keysBox(show);
  return (b.u1 - b.u0) / (b.v1 - b.v0);
}
