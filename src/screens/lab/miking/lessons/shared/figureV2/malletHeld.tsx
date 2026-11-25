/**
 * FIGURE V2 — THE APPROVED MALLET HAND ON A LESSON'S MALLET (owner 2026-11-24, "Raise the hands"; M06, M07a).
 * Drawn in a player's near-stick place (PlayerSideV2 `nearStick`: between the cuff's far and near rims, inside the
 * player's look and recede): the lesson's own mallet first, then the approved hand (malletHandBack.tsx, frozen) with
 * its fulcrum on the lesson's grip point and its shaft on the lesson's shaft — no sleeve of its own (the figure's
 * sleeve takes the wrist at the drawing's cuff rim, malletPlaced.malletSidePlan), the scene's own scale, the shaft
 * not repainted (the lesson's mallet shows; only the hand's soft shadows land on it).
 *
 * (owner 2026-11-24, "Palm mallet passes") MalletInPalmHand: the same for a hand that shows its PALM to the camera
 * (M06's far left hand): the approved palm-side drawing (malletHandPalm.tsx, frozen; mirrored it lands exactly where
 * malletHandBack would), its short piece of shaft inside the palm in the lesson's own wood.
 */
import type { ReactNode } from 'react';
import { ColorMatrix, Group, Paint } from '@shopify/react-native-skia';
import { MalletHandBack } from './malletHandBack';
import { MalletHandPalm, malletHandPalmRotFor, type ShaftWood } from './malletHandPalm';
import { malletHandAt } from './malletPlaced.ts';
import { useFigureScale } from './detail';
import { FAR_SKIN_DIM } from './FigureV2Side';
import { MALLET_WOOD } from '../concert/Mallets';

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

/** The lessons' concert mallet wood (Mallets.tsx), for the shaft seen inside the palm. */
const LESSON_WOOD: ShaftWood = { colors: MALLET_WOOD };

/** The far side's skin step (FigureV2Side FAR_SKIN_DIM), as the far authored fist had it. */
const FAR_SKIN = (
  <Paint>
    <ColorMatrix matrix={[FAR_SKIN_DIM, 0, 0, 0, 0, 0, FAR_SKIN_DIM, 0, 0, 0, 0, 0, FAR_SKIN_DIM, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

/**
 * The approved palm-side mallet hand on a lesson's mallet. `left`: the LEFT hand (the drawing mirrored, re-lit: the
 * forearm from the left, the shaft on to the right). `far`: drawn in a far-stick place — the hand and its mallet the
 * far side's small skin step down, as the far authored fist was (the lite figure already dims the whole far arm).
 */
export function MalletInPalmHand({ grip, head, left = true, shaftR, far = false, children }: { grip: XY; head: XY; left?: boolean; shaftR: number; far?: boolean; children: ReactNode }) {
  const lite = useFigureScale().level === 'lite';
  const ang = Math.atan2(head.y - grip.y, head.x - grip.x);
  const len = Math.hypot(head.x - grip.x, head.y - grip.y);
  const art = (
    <Group>
      {children}
      <MalletHandPalm x={grip.x} y={grip.y} s={1} rot={malletHandPalmRotFor(ang, left)} mirror={left} sleeve={false} ownScale={false} head="none" shaft={len} shaftR={shaftR} paintShaft={false} wood={LESSON_WOOD} />
    </Group>
  );
  return far && !lite ? <Group layer={FAR_SKIN}>{art}</Group> : art;
}
