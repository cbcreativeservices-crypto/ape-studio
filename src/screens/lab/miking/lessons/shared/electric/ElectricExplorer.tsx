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
      // Just under the right-hand pair of levers, clear of the pedal pull
      // rods and both legs (clash sweep 2026-10-10: to the right of the last
      // lever the words ran onto the right leg).
      { id: 'kn', text: 'KNEE LEVERS', short: 'KNEES', u: STEEL.kneeU[3], v: -395, align: 'center', tone: 'amber' },
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
  // Guitar and bass face-on are TURNED 180° (owner 2026-10-10): body on the
  // left, headstock to the right — how a right-handed player is seen from the
  // front. A turn (not a mirror) keeps it right-handed. Labels and taps follow.
  // The pedal steel and the lap steel FROM ABOVE turn too (clash sweep
  // 2026-10-10, the owner's rule for every face-on necked instrument): the
  // changer / bridge end on the left, the keyhead / head to the right, the
  // player on the far side (the top of the glass, as in every other view
  // from above). The pedal steel from the seat is an elevation on its legs:
  // a turn would stand it on its head, so it stays as drawn.
  const turned = !!s || show === 'steelTop' || show === 'lap';
  const uc = (box.u0 + box.u1) / 2;
  const vc = (box.v0 + box.v1) / 2;
  const labels = useMemo(() => {
    const L0 = labelsFor(show);
    if (!turned) return L0;
    return L0.map((l) => ({ ...l, u: 2 * uc - l.u, v: 2 * vc - l.v, align: l.align === 'left' ? ('right' as const) : l.align === 'right' ? ('left' as const) : l.align }));
  }, [show, turned, uc, vc]);
  const tap = (x: number, y: number) => {
    if (!onTapPart) return;
    const uv = (x - xf.ox) / xf.s;
    const vv = (y - xf.oy) / xf.s;
    const u = turned ? 2 * uc - uv : uv;
    const v = turned ? 2 * vc - vv : vv;
    const tol = 22 / xf.s;
    const id = s ? electricHit(s, u, v, tol) : steelHit(show === 'steelSide' ? 'side' : show === 'steelTop' ? 'top' : 'lap', u, v, tol);
    if (id) onTapPart(id);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {s ? (
              <Group transform={[{ translateX: uc }, { translateY: vc }, { rotate: Math.PI }, { translateX: -uc }, { translateY: -vc }]}>
                <ElectricFront s={s} fretless={show === 'bassFretless'} highlight={highlight} pickupLit={pickupLit} turned />
              </Group>
            ) : turned ? (
              <Group transform={[{ translateX: uc }, { translateY: vc }, { rotate: Math.PI }, { translateX: -uc }, { translateY: -vc }]}>
                <SteelDrawing view={show === 'steelTop' ? 'top' : 'lap'} highlight={highlight} barAt={barAt ?? (show === 'steelTop' ? STEEL.nutU + 260 : null)} turned />
              </Group>
            ) : (
              <SteelDrawing view="side" highlight={highlight} barAt={barAt ?? null} />
            )}
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
