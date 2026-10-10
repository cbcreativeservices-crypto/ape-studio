/**
 * ElectricExplorer — an electric string instrument as an ORIENT display (no
 * mic): the guitar or bass face-on, or the pedal steel from the player's
 * seat / from above, or a lap steel across the knees. Tap a part to name it;
 * the page names it in the well. Static: it changes only when the learner
 * taps or switches (D8).
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { BASS, GUITAR, LAP_STEEL, type ElectricSpec } from './electricSpec.ts';
import { ElectricFront, electricBox, electricHit } from './ElectricArt';
import { STEEL, SteelDrawing, steelBox, steelHit } from './SteelArt';

export type ElectricShow = 'guitar' | 'bass' | 'bassFretless' | 'steelSide' | 'steelTop' | 'lap';

function specOf(show: ElectricShow): ElectricSpec | null {
  return show === 'guitar' ? GUITAR : show === 'bass' || show === 'bassFretless' ? BASS : null;
}

function labelsFor(show: ElectricShow): StaticLabel[] {
  const s = specOf(show);
  if (s) {
    const L = s.scale.mm;
    const W = s.bodyHalfW;
    return [
      { id: 'head', text: 'HEADSTOCK', u: -s.headLen * 0.5, v: -s.neckHalfW[0] - 52, align: 'center', tone: 'muted' },
      { id: 'neck', text: show === 'bassFretless' ? 'FRETLESS NECK' : 'NECK · FRETS', short: 'NECK', u: L * 0.32, v: -s.neckHalfW[1] - 22, align: 'center' },
      // Right-handed, player's view: the controls on the treble (upper) side, behind the bridge.
      { id: 'pu', text: s.pickups.length > 1 ? 'PICKUPS' : 'PICKUP', u: L - s.pickups[Math.floor(s.pickups.length / 2)].fromBridge - 10, v: W + 30, align: 'center', tone: 'amber' },
      { id: 'br', text: 'BRIDGE', u: L + 4, v: W + 30, align: 'left', tone: 'muted' },
      { id: 'ctl', text: 'CONTROLS', u: L + 80, v: -W - 24, align: 'center', tone: 'muted' },
    ];
  }
  if (show === 'steelSide')
    return [
      { id: 'ch', text: 'CHANGER', u: STEEL.changerU, v: -790, align: 'center' },
      { id: 'kh', text: 'KEYHEAD', u: 0, v: -790, align: 'center', tone: 'muted' },
      { id: 'kn', text: 'KNEE LEVERS', short: 'KNEES', u: STEEL.kneeU[3] + 40, v: -480, align: 'left', tone: 'amber' },
      { id: 'pd', text: 'PEDALS', u: 450, v: 30, align: 'center', tone: 'amber' },
      { id: 'vp', text: 'VOLUME PEDAL', short: 'VOLUME', u: STEEL.volumeU[0] + 50, v: -120, align: 'center', tone: 'muted' },
    ];
  if (show === 'steelTop')
    return [
      { id: 'ch', text: 'CHANGER', u: STEEL.changerU, v: -190, align: 'center' },
      { id: 'pu', text: 'PICKUP', u: STEEL.pickupU - 40, v: 120, align: 'right', tone: 'amber' },
      { id: 'nk', text: 'STRINGS · FRET MARKERS', short: 'STRINGS', u: (STEEL.nutU + STEEL.changerU) / 2, v: -190, align: 'center' },
      { id: 'bar', text: 'BAR', u: STEEL.nutU + 260, v: 120, align: 'center', tone: 'amber' },
      { id: 'seat', text: 'PLAYER’S SEAT', short: 'SEAT', u: 490, v: 600, align: 'center', tone: 'muted' },
      { id: 'zone', text: 'FEET · KNEES', short: 'KEEP CLEAR', u: 900, v: 400, align: 'left', tone: 'muted' },
    ];
  return [
    { id: 'lap', text: 'LAP STEEL', u: LAP_STEEL.bodyLen * 0.45, v: -170, align: 'center' },
    { id: 'kn', text: 'ACROSS THE KNEES', short: 'KNEES', u: 360, v: 315, align: 'center', tone: 'muted' },
  ];
}

export function ElectricExplorer({ w, h, show, highlight, pickupLit, barAt, onTapPart, accessibilityLabel }: { w: number; h: number; show: ElectricShow; highlight?: string | null; pickupLit?: string | null; barAt?: number | null; onTapPart?: (id: string) => void; accessibilityLabel: string }) {
  const ts = useStageTextScale();
  const s = specOf(show);
  const box = s ? electricBox(s) : steelBox(show === 'steelSide' ? 'side' : show === 'steelTop' ? 'top' : 'lap');
  const xf = useMemo(() => fitXform('side', box, w, h, 6), [w, h, box.u0, box.u1, box.v0, box.v1]); // eslint-disable-line react-hooks/exhaustive-deps
  const labels = useMemo(() => labelsFor(show), [show]);
  const tap = (x: number, y: number) => {
    if (!onTapPart) return;
    const u = (x - xf.ox) / xf.s;
    const v = (y - xf.oy) / xf.s;
    const tol = 22 / xf.s;
    const id = s ? electricHit(s, u, v, tol) : steelHit(show === 'steelSide' ? 'side' : show === 'steelTop' ? 'top' : 'lap', u, v, tol);
    if (id) onTapPart(id);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {s ? <ElectricFront s={s} fretless={show === 'bassFretless'} highlight={highlight} pickupLit={pickupLit} /> : <SteelDrawing view={show === 'steelSide' ? 'side' : show === 'steelTop' ? 'top' : 'lap'} highlight={highlight} barAt={barAt ?? (show === 'steelTop' ? STEEL.nutU + 260 : null)} />}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}

/** The drawing's aspect (w ÷ h) for a figure. */
export function electricAspect(show: ElectricShow): number {
  const s = specOf(show);
  const b = s ? electricBox(s) : steelBox(show === 'steelSide' ? 'side' : show === 'steelTop' ? 'top' : 'lap');
  return (b.u1 - b.u0) / (b.v1 - b.v0);
}
