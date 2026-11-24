/**
 * THE HARMONICA PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): A10 — the placement scene from the player's right and from
 * above, the close-ups round the harmonica (MEET, the hands' chamber, the
 * sound pages' player).
 *
 * Nothing of the scene moves (a10Harmonica/model.ts, freeReedHands.ts): the
 * standing player's joints (the same drawing defaults the solids follow, in
 * frame H round the harmonica's hole face), the lips on the hole face, and the
 * classic cupped hold — the left hand with the harp's end in the web, the
 * index's pad on the top cover, the thumb's pad under it, the other fingers
 * round the back; the right hand in front, heels together under the harp,
 * its fingers closing over the left's (more or less, by the chamber state).
 * Only the drawing is new (figureV2/familyV2): the cast member, the head with
 * its mouth on the harmonica, the approved sleeves, the posed hands in the
 * approved look.
 *
 * Who plays (cast.ts ROLES 'freereed.harmonica'): Kofi.
 */
import { Group } from '@shopify/react-native-skia';
import { castFor } from '../figureV2/cast';
import { famFrontRegion, famPlan, FamilyFigureFrontV2, FamilyFigureV2, type FamIn } from '../figureV2/familyV2';
import { hmHands, type HmState } from './freeReedHands.ts';

const MID_CUT = { p: { x: 0, y: 0, z: 0 }, n: { x: 0, y: 0, z: 1 } };

/** The figure in frame H (the harmonica's hole face at the origin): `view` side (u = x, v = y) or top (u = x,
 *  v = z). `floorV`: the floor's y in frame H. `head`: the head's centre in frame H (x, y). */
export function hmFamIn(state: HmState, view: 'side' | 'top', floorV: number, head: { u: number; v: number }): FamIn {
  const H = hmHands(state);
  const z = (side: 1 | -1, k: number) => side * k;
  return {
    key: `harmonica|${state}`,
    s: {
      head: { x: head.u, y: head.v, z: 0 },
      headR: 110,
      face: { x: 1, y: 0, z: 0 },
      neck: { x: -140, y: 132, z: 0 },
      chest: { x: -150, y: 300, z: 0 },
      pelvis: { x: -160, y: 600, z: 0 },
      shoulderL: H.L.S,
      shoulderR: H.R.S,
      hipL: { x: -160, y: 600, z: z(-1, 100) },
      hipR: { x: -160, y: 600, z: z(1, 100) },
      kneeL: { x: -176, y: 1036, z: z(-1, 95) },
      kneeR: { x: -128, y: 1040, z: z(1, 95) },
      ankleL: { x: -196, y: floorV - 82, z: z(-1, 95) },
      ankleR: { x: -142, y: floorV - 82, z: z(1, 95) },
      toeL: { x: -76, y: floorV - 20, z: z(-1, 95) },
      toeR: { x: -22, y: floorV - 20, z: z(1, 95) },
    },
    view,
    who: castFor('freereed.harmonica'),
    seated: false,
    floorY: floorV,
    lip: { x: -2, y: 0, z: 0 },
    arms: {
      L: { sk: H.L.sk, elbow: H.L.E, shoulder: H.L.S, cut: MID_CUT },
      R: { sk: H.R.sk, elbow: H.R.E, shoulder: H.R.S },
    },
  };
}

/** The player behind (`back`) or over (`front`) the harmonica, placed with the hole face at `at` (side: (u, v);
 *  top: (u = x, v = z)). */
export function HarmonicaPlayerV2({ at, state, view, part, floorV, head }: { at: { u: number; v: number }; state: HmState; view: 'side' | 'top'; part: 'back' | 'front'; floorV: number; head: { u: number; v: number } }) {
  const fp = famPlan(hmFamIn(state, view, floorV, head));
  return (
    <Group transform={[{ translateX: at.u }, { translateY: at.v }]}>
      {part === 'back' ? <FamilyFigureV2 fp={fp} /> : <FamilyFigureFrontV2 fp={fp} region={famFrontRegion(fp, 0)} />}
    </Group>
  );
}
