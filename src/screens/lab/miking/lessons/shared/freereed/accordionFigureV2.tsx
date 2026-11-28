/**
 * THE ACCORDION PLAYER IN THE APPROVED LOOK (figure roll-out wave 5, D78,
 * 2026-11-24): A11 — the standing player face-on round the accordion (MEET,
 * the bellows sound page), from the player's right (the placement scene) and
 * from above.
 *
 * Nothing of the scene moves (a11Accordion/model.ts, freeReedHands.ts): the
 * player's shoulders, the posed arms — the right hand's fingers curved onto a
 * chord on the keyboard, the left hand flat on the bass end under the bass
 * strap — and the two shoulder straps (the old pose's points, the marks the
 * page reads). Only the drawing is new (figureV2/familyV2): the cast member,
 * the approved sleeves, the posed hands in the approved look.
 *
 * Frame A (the lesson's): x toward the front (the audience), y down, z toward
 * the keyboard (the player's right). Face-on the family's front view looks
 * from +z, so the skeleton is turned there: (x, y, z) → (−z, y, x) (a proper
 * turn, nothing mirrored) — on the page u = −z, v = y, as the lesson's front.
 * Face-on the left hand lies on the bass END face, which the lesson draws a
 * little turned toward the audience (its strip view): the hand is drawn in that
 * strip view, in the approved look, by the page (`AccLeftHandFrontV2`).
 *
 * Who plays (cast.ts ROLES 'freereed.accordion'): Ruth.
 */
import { Group } from '@shopify/react-native-skia';
import { castFor } from '../figureV2/cast';
import { familyHand } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { famFrontRegion, famPlan, FamilyFigureFrontV2, FamilyFigureV2, type FamIn, type FamPlan } from '../figureV2/familyV2';
import type { HandSkeleton, HandView, V3 } from '../players/handModel.ts';
import { BODY, FLOOR_Y, TREBLE } from '../../a11Accordion/model.ts';
import { accLeftHand, accRightHand } from './freeReedHands.ts';

export type AccView = 'side' | 'top' | 'front';

/** Frame A turned for the family's front view (looking from +z). */
const toFront = (p: V3): V3 => ({ x: -p.z, y: p.y, z: p.x });
const same = (p: V3): V3 => p;

/** A posed hand in a turned frame (the turn is linear: points and directions alike). */
function turnSk(sk: HandSkeleton, f: (p: V3) => V3): HandSkeleton {
  const dg = (d: HandSkeleton['thumb']) => ({ ...d, joints: d.joints.map(f), dorsal: d.dorsal.map(f) });
  return { ...sk, frame: { o: f(sk.frame.o), x: f(sk.frame.x), y: f(sk.frame.y), z: f(sk.frame.z) }, fingers: sk.fingers.map(dg), thumb: dg(sk.thumb), palm: sk.palm.map(f) };
}

export function accFamIn(top: number, bottom: number, view: AccView): FamIn {
  const R = accRightHand();
  const L = accLeftHand(top, bottom);
  const f = view === 'front' ? toFront : same;
  const x0 = TREBLE.x0;
  const hx = BODY.headC.x;
  const p = (x: number, y: number, z: number) => f({ x, y, z });
  return {
    key: `accordion|${view}|${Math.round(top)}:${Math.round(bottom)}`,
    s: {
      head: f(BODY.headC),
      headR: 108,
      face: f({ x: 1, y: 0, z: 0 }),
      neck: p(hx - 40, -340, 0),
      chest: p(x0 - 115, -150, 0),
      pelvis: p(x0 - 120, 160, 0),
      shoulderL: f(L.S),
      shoulderR: f(R.S),
      hipL: p(x0 - 120, 160, -110),
      hipR: p(x0 - 120, 160, 110),
      kneeL: p(x0 - 110, 640, -110),
      kneeR: p(x0 - 110, 640, 110),
      ankleL: p(x0 - 130, FLOOR_Y - 80, -120),
      ankleR: p(x0 - 130, FLOOR_Y - 80, 120),
      toeL: p(x0 - 10, FLOOR_Y - 20, -125),
      toeR: p(x0 - 10, FLOOR_Y - 20, 125),
    },
    view,
    who: castFor('freereed.accordion'),
    seated: false,
    floorY: FLOOR_Y,
    arms: {
      // (from the player's right the left hand, on the bass end, lies wholly behind the instrument)
      L: { sk: turnSk(L.sk, f), elbow: f(L.E), shoulder: f(L.S), handElsewhere: view === 'front', front: view !== 'side' },
      R: { sk: turnSk(R.sk, f), elbow: f(R.E), shoulder: f(R.S) },
    },
  };
}

/** The instrument's depth in each view (what is nearer goes over it): beside the treble box's keyboard face
 *  from the player's right, its top from above, the player's chest face-on. */
const INST_DEPTH: Record<AccView, number> = { side: TREBLE.z1, top: -TREBLE.y0, front: TREBLE.x0 + 10 };

export function accFigure(top: number, bottom: number, view: AccView): { fp: FamPlan; region: ReturnType<typeof famFrontRegion> } {
  const fp = famPlan(accFamIn(top, bottom, view));
  return { fp, region: famFrontRegion(fp, INST_DEPTH[view]) };
}

/** The player behind (`back`) or over (`front`) the accordion, in frame A on the page. */
export function AccordionPlayerV2({ top, bottom, view, part }: { top: number; bottom: number; view: AccView; part: 'back' | 'front' }) {
  const { fp, region } = accFigure(top, bottom, view);
  return part === 'back' ? <FamilyFigureV2 fp={fp} /> : <FamilyFigureFrontV2 fp={fp} region={region} />;
}

/** Face-on, the left hand on the bass end (the lesson's strip view of the end face), in the approved look. */
export function AccLeftHandFrontV2({ top, bottom, view }: { top: number; bottom: number; view: HandView }) {
  const L = accLeftHand(top, bottom);
  const h = familyHand(L.sk, view, `accordion|L|${Math.round(top)}:${Math.round(bottom)}`);
  return (
    <Group>
      <FamilyHandV2 h={h} />
    </Group>
  );
}
