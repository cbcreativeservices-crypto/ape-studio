/**
 * F09 — the body mic's cable at the scene's scale (art fix 2026-10-16: the
 * lav sat on the chest with no cable to a pack). The run is the broadcast
 * one (lessons/shared/broadcast LavCable, drawn there at close-up size): out
 * of the capsule's tail, a small loop under the clip, in at the shirt and
 * down the chest under it (dashed), along the belt round the waist to the
 * bodypack's input on the back of the belt. On a set drawn 3–4 m wide a
 * 3 mm cable is under a pixel, so it is stroked about 3 × its width — said
 * nowhere as a size; the pack (BodyWornArt.BeltPack) is at true size.
 * Static (D8).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { Vec3, ViewId } from '../../engine/model/types.ts';
import { BODY_DIMS, CHEST_X, NECK_Y } from '../shared/broadcast/bodyWorn.ts';

export function LavRun({ view, from, pack }: { view: ViewId; from: Vec3; pack: Vec3 }) {
  const p = useMemo(() => {
    const out = Skia.Path.Make();
    const under = Skia.Path.Make();
    const X = CHEST_X;
    const belt = NECK_Y + 520;
    const packTop = pack.y - BODY_DIMS.packH.mm / 2 - 7;
    if (view === 'side') {
      const u0 = from.x;
      const v0 = from.y;
      out.moveTo(u0, v0);
      out.lineTo(u0 - 1, v0 + 22);
      // The broadcast loop under the clip, then in at the next button.
      out.cubicTo(u0 + 26, v0 + 46, u0 + 22, v0 + 92, u0 + 2, v0 + 88);
      out.cubicTo(u0 - 12, v0 + 84, u0 - 8, v0 + 60, X - 4, v0 + 66);
      // Under the shirt: down the chest to the belt, along it round the
      // waist (behind the far hip in this view) and up into the pack's input.
      under.moveTo(X - 4, v0 + 66);
      under.lineTo(X - 10, belt - 30);
      under.cubicTo(X - 30, belt - 6, pack.x + 90, belt - 14, pack.x + 8, belt - 30);
      under.cubicTo(pack.x - 6, belt - 40, pack.x + 2, packTop + 14, pack.x + 2, packTop);
    } else {
      out.moveTo(from.x, from.z);
      out.lineTo(from.x - 6, from.z - 10);
      // From above, under the shirt round the left side of the waist to the pack.
      under.moveTo(from.x - 6, from.z - 10);
      under.cubicTo(X - 10, -190, -120, -236, pack.x + 30, pack.z - 30);
      under.lineTo(pack.x + 4, pack.z);
    }
    return { out, under };
  }, [view, from, pack]);
  return (
    <Group>
      <Path path={p.out} style="stroke" strokeWidth={13} strokeCap="round" strokeJoin="round" color="#08090b" />
      <Path path={p.out} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color="#4a4e57" />
      <Path path={p.under} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color="#9aa0aa" opacity={0.8}>
        <DashPathEffect intervals={[26, 18]} />
      </Path>
    </Group>
  );
}
