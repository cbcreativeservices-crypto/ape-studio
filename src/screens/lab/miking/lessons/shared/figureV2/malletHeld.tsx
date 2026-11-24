/**
 * FIGURE V2 — THE APPROVED MALLET HAND ON A LESSON'S MALLET (owner 2026-11-24, "Raise the hands"; M06, M07a).
 * Drawn in a player's near-stick place (PlayerSideV2 `nearStick`: between the cuff's far and near rims, inside the
 * player's look and recede): the lesson's own mallet first, then the approved hand (malletHandBack.tsx, frozen) with
 * its fulcrum on the lesson's grip point and its shaft on the lesson's shaft — no sleeve of its own (the figure's
 * sleeve takes the wrist at the drawing's cuff rim, malletPlaced.malletSidePlan), the scene's own scale, the shaft
 * not repainted (the lesson's mallet shows; only the hand's soft shadows land on it).
 */
import type { ReactNode } from 'react';
import { Group } from '@shopify/react-native-skia';
import { MalletHandBack } from './malletHandBack';
import { malletHandAt } from './malletPlaced.ts';

type XY = { x: number; y: number };

export function MalletInBackHand({ grip, head, mirror = false, shaftR, children }: { /** the grip point (the hand's fulcrum) and the head's centre, on the page (mm) */ grip: XY; head: XY; mirror?: boolean; /** the lesson's shaft radius (mm) */ shaftR: number; /** the lesson's mallet */ children: ReactNode }) {
  const at = malletHandAt(grip, head, mirror);
  const len = Math.hypot(head.x - grip.x, head.y - grip.y);
  return (
    <Group>
      {children}
      <MalletHandBack x={at.x} y={at.y} s={1} rot={at.rot} mirror={mirror} sleeve={false} ownScale={false} head="none" shaft={len} shaftR={shaftR} paintShaft={false} />
    </Group>
  );
}
