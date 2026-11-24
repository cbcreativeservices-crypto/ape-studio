/**
 * THE PLUNGER HELD BY THE LEFT HAND, IN THE APPROVED LOOK (figure roll-out
 * wave 5, D78, 2026-11-24): the HOW IT SOUNDS mute page of A01 and A02 (the
 * bell close up, from the player's right). Before: two rounded bars beside
 * the cup.
 *
 * How a plunger is held (jazz brass technique): the rubber cup in the LEFT
 * hand in front of the bell, the palm on the back of the dome, the fingers
 * spread a little round it and curling over its top edge, the thumb on its
 * far side; the wrist turns to open and close it (the "wah"). Drawn here at
 * the closed setting the page shows: the shared adult hand (handModel)
 * posed bone by bone round the cup's back, painted by the family hand
 * (familyHand), its forearm in the player's sleeve coming in from below and
 * behind (toward the player). The cup, the bell and every caption are as
 * before.
 */
import { useMemo } from 'react';
import { Group } from '@shopify/react-native-skia';
import { handFrame, handOn, type V3 } from '../players/handModel.ts';
import { armPlan } from '../figureV2/sidePlan.ts';
import { armPaths } from '../figureV2/paths.ts';
import { ArmLite } from '../figureV2/lite';
import { familyHand } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { FigureLook } from '../figureV2/look';
import { FigureScale } from '../figureV2/detail';
import { P } from '../figureV2/geom.ts';
import type { CastMember } from '../figureV2/cast';

const VIEW = (p: V3) => ({ u: p.x, v: p.y, d: p.z });

/** `k`: the bell's scale (a trumpet's 1); the cup's back at x ≈ 84 k, its radius 70 k (MuteView's plunger). */
export function PlungerHandV2({ k, who }: { k: number; who: CastMember }) {
  const g = useMemo(() => {
    const rc = 70 * k;
    // the palm on the back of the dome: the back of the hand away from the bell (+x), the fingers up, the thumb
    // on the far side of the cup (the left hand seen from the player's right: its thumb away from the viewer)
    const palmX = 84 * k + 15;
    // (low enough on the dome, and the fingers curled far enough over its rim, that the whole hand stays inside
    // the picture: the fingertips just over the cup's top edge, never cut by the frame)
    const wrist: V3 = { x: palmX + 6, y: rc * 0.55 + 30, z: 0 };
    const f = handFrame(wrist, { x: -0.12, y: -1, z: 0 }, { x: 1, y: 0, z: 0.1 }, { x: 0, y: 0, z: -1 });
    // the fingers curl over the cup's top edge toward the bell; the thumb opposes them round its far side
    const sk = handOn(f, [{ curl: 0.72, abd: 0.08 }, { curl: 0.75 }, { curl: 0.78, abd: -0.05 }, { curl: 0.8, abd: -0.12 }], { yaw: 0.5, pitch: 0.75, mcp: 0.3, ip: 0.25 });
    // the forearm in its sleeve, from below and back toward the player
    const elbow: V3 = { x: wrist.x - 70, y: wrist.y + 250, z: 0 };
    const shoulder: V3 = { x: elbow.x - 230, y: elbow.y + 120, z: 0 };
    const fore = { x: wrist.x - elbow.x, y: wrist.y - elbow.y };
    const fl = Math.hypot(fore.x, fore.y) || 1;
    const W = P(wrist.x + (fore.x / fl) * 16, wrist.y + (fore.y / fl) * 16);
    const arm = armPlan(P(shoulder.x, shoulder.y), P(elbow.x, elbow.y), W, null, false, null, 0, null, false, { one: true, k: who.body?.shoulder ?? 1, fore: who.body?.limb ?? 1 });
    const { e, out } = arm.opening;
    const hand = familyHand(sk, VIEW, `plunger|${k.toFixed(3)}`, { from: P(e.c.u + out.u * 2, e.c.v + out.v * 2) });
    return { arm, hand, P2: armPaths(arm, VIEW) };
  }, [k, who]);
  return (
    <FigureScale ptPerMm={1} level="full">
      <FigureLook look={who.look}>
        <Group>
          <ArmLite a={g.arm} P={g.P2} stick={<FamilyHandV2 h={g.hand} />} />
        </Group>
      </FigureLook>
    </FigureScale>
  );
}
