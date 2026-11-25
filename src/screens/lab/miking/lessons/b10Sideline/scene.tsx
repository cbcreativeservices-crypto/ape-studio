/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the scene (charter §2 layer 3):
 * the guest and the reporter standing (shared/broadcast/SportSpeechArt), the
 * camera on its tripod (shared/field/LocationArt), the touchline and the
 * hatched play area behind them, the clear exit route, the PA beyond the
 * camera; at the post-event mark, the backdrop and the boom operator. An arm
 * that holds a mic is folded away: the engine draws it from the shoulder.
 * From the side the reporter stands right behind the guest: drawn FAINT
 * (owner 2026-10-08, L7C), their holding hand named.
 * Static (D8). Labels name what a mic decision needs.
 */
import type { ReactElement } from 'react';
import { ColorMatrix, Group, Morphology, Paint } from '@shopify/react-native-skia';
import type { VariantId, Vec3, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { BoomOperator, CameraRig, operatorPoses, type CameraSpec } from '../shared/field/LocationArt';
import { figureCovers } from '../shared/players/PlayerFigure';
import { PaSpeaker } from '../shared/broadcast/BroadcastArt';
import { Backdrop, DirArrow, PlayAreaHatch, StandingTalker, standingCovers } from '../shared/broadcast/SportSpeechArt';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { SPORT_SPEECH_MIC_TYPES } from '../shared/broadcast/sportMics.ts';
import { heldFist } from '../../engine/geometry/arm.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { B10_ZONES } from './model.ts';
import { castFor } from '../shared/figureV2/cast';
import { SoftFolds } from '../shared/figureV2/paint';
import { StandingV2, standingCoversV2 } from '../shared/broadcast/heldPeopleV2';
import { B10_FAINT_PLAIN, B10_HELD, GUEST_HOLDER, REP_HOLDER, V2 } from './held';
import { BoomOperatorV2, boomPlans, sideDrawings, type BoomRig, type SideDrawing } from '../shared/figureV2/BoomV2';
import { useHeldMicsNow, type HeldConfig, type HeldMicNow } from '../shared/figureV2/heldLive';
import { alongPole } from '../shared/figureV2/boomGrip.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { BACKDROP_X, CAMERA_BOX, EXIT_Z, FLOOR, B10_BOOM_HOLD, BOOM_FRONT_HAND, BOOM_TAIL, BOOM_POLE_END, BOOM_REAR_HAND, GRIP, GUEST, LENS, OPERATOR, PA_C, REPORTER, TOUCHLINE_X, TRIPOD } from './geometry.ts';

export const CAMERA: CameraSpec = { box: CAMERA_BOX, lens: LENS, floor: FLOOR, spread: TRIPOD.spread };
export const OPERATOR_POSES = B10_BOOM_HOLD === 'overhead' ? operatorPoses(OPERATOR.feet, BOOM_FRONT_HAND, { rear: BOOM_REAR_HAND }) : operatorPoses(OPERATOR.feet, GRIP);
/** The pole's rear end behind the operator's front hand (a drawing default). */
const POLE_STUB = B10_BOOM_HOLD === 'overhead' ? { a: GRIP, b: BOOM_POLE_END } : { a: GRIP, b: { x: GRIP.x + 380, y: GRIP.y + 420, z: GRIP.z + 300 } };
/** (figure V2) the boom operator's rear hand: the right (the pole runs back to their right, B11's mirrored). */
const B10_REAR_ARM: 'L' | 'R' = 'R';
/** (figure V2) the boom operator's rig (figureV2/BoomV2, as B04 and B11 draw theirs): the front hand at the grip,
 *  the rear hand 42 cm down the pole. */
/** (the study page: both holds side by side, whichever the constant picks) */
const OLD_FEET = { x: 1150, y: FLOOR, z: 1150 };
const OLD_POSES = operatorPoses(OLD_FEET, GRIP);
const OLD_STUB = { a: GRIP, b: { x: GRIP.x + 380, y: GRIP.y + 420, z: GRIP.z + 300 } };
const OVER_POSES = operatorPoses({ x: (BOOM_FRONT_HAND.x + BOOM_REAR_HAND.x) / 2 - 10, y: FLOOR, z: (BOOM_FRONT_HAND.z + BOOM_REAR_HAND.z) / 2 }, BOOM_FRONT_HAND, { rear: BOOM_REAR_HAND });
export const B10_BOOM_RIGS: Record<'old' | 'overhead', BoomRig> = {
  old: { side: OLD_POSES.side, top: OLD_POSES.top, front: GRIP, rear: alongPole(GRIP, OLD_STUB.b, 420), pole: OLD_STUB, rearArm: 'R' },
  overhead: { side: OVER_POSES.side, top: OVER_POSES.top, front: BOOM_FRONT_HAND, rear: BOOM_REAR_HAND, pole: { a: BOOM_TAIL, b: BOOM_POLE_END }, rearArm: 'R', elbows: 'beside' },
};
export const B10_OPERATOR_WHO = castFor('operator.boomB10');
const RIG: BoomRig =
  B10_BOOM_HOLD === 'overhead'
    ? { side: OPERATOR_POSES.side, top: OPERATOR_POSES.top, front: BOOM_FRONT_HAND, rear: BOOM_REAR_HAND, pole: { a: BOOM_TAIL, b: BOOM_POLE_END }, rearArm: B10_REAR_ARM, elbows: 'beside' }
    : { side: OPERATOR_POSES.side, top: OPERATOR_POSES.top, front: GRIP, rear: alongPole(GRIP, POLE_STUB.b, 420), pole: POLE_STUB, rearArm: B10_REAR_ARM };

/**
 * (figure V2, 2026-11-24, FrontAndBoom) THE POLE IS ONE STRAIGHT LINE wherever the learner drags the boom mic:
 * the engine draws the pole from the mic's tail to the grip; the operator's rear hand stays at the grip and the
 * front hand goes on that line 42 cm nearer the mic, the pole's end 11 cm past the grip, read each frame from the
 * engine's store (heldLive's bridge, B10_HELD.carry). Her stance follows (posture only: the operator's box, the
 * grip and every measured point stay): her head under the pole between the hands, at the middle or toward the
 * front hand where the line there runs too low over her head; where no such stance is within reach, the last
 * one that was. With no mic in the store (a tool step, the study page) the starting setup's line (RIG).
 */
const HEAD_TOP_ABOVE_FLOOR = 1750;
const NECK_ABOVE_FLOOR = 1750 - 114 - 172;
let lastLive: BoomRig | null = null;
const liveCache = new Map<string, BoomRig | null>();
function liveRig(m: HeldMicNow): BoomRig | null {
  const len = m.len ?? 0;
  const tail = { x: m.front.x - m.aim.x * len, y: m.front.y - m.aim.y * len, z: m.front.z - m.aim.z * len };
  const key = `${Math.round(tail.x)},${Math.round(tail.y)},${Math.round(tail.z)}`;
  if (liveCache.has(key)) return liveCache.get(key)!;
  const dx = GRIP.x - tail.x;
  const dy = GRIP.y - tail.y;
  const dz = GRIP.z - tail.z;
  const l = Math.hypot(dx, dy, dz) || 1;
  const d = { x: dx / l, y: dy / l, z: dz / l };
  const at = (k: number) => ({ x: GRIP.x + d.x * k, y: GRIP.y + d.y * k, z: GRIP.z + d.z * k });
  const front = at(-420);
  let out: BoomRig | null = null;
  // (her head under the middle of the hands where the pole runs high enough there; else nearer whichever hand
  // the line rises toward — a step under the pole, never through it)
  // (FrontBoom3, review 2026-11-24: "with the mic dragged below the guest's mouth the pole runs over her whole face")
  // as the side view SEES it: wherever the drawn pole (the mic's tail to its end) passes over her head's span — the
  // face's front to the back of the head — it must run above the top of her hair. Under the pole first; where the
  // line falls too steeply toward the mic for that, she steps BACK behind the pole's end (the pole held out in front
  // of her, angled down to the mic, both hands on it) — never a pole across her face.
  const headTop = FLOOR - HEAD_TOP_ABOVE_FLOOR;
  const poleEnd = at(110);
  const clearOfHead = (headX: number) => {
    const x0 = headX - 135; // (the face's front, she faces −x)
    const x1 = headX + 110; // (the back of her head and hair)
    for (let x = x0; x <= x1; x += 15) {
      const den = poleEnd.x - tail.x;
      if (Math.abs(den) < 1) return false;
      const t = (x - tail.x) / den;
      if (t < 0 || t > 1) continue;
      const y = tail.y + (poleEnd.y - tail.y) * t;
      if (y > headTop - 45) return false;
    }
    return true;
  };
  for (const k of [-210, -240, -180, -270, -150, -300, -120, -90, -60, -30, 0, 40, 200, 240, 280, 320, 360]) {
    const mid = at(k);
    // (k past the pole's end: she stands behind it on the line's ground track, the pole ending in front of her)
    const feet = { x: mid.x - 10, y: FLOOR, z: mid.z };
    if (k <= 110) {
      // (the pole clear above her head: 6 cm over the head's top where she stands)
      if (mid.y > headTop - 60) continue;
      // (…and over the front of her head and her hairline, where the line runs lower toward the mic)
      if (at(k - 100).y > headTop - 30 + 40) continue;
    }
    if (!clearOfHead(feet.x + 10)) continue;
    const neck = { x: feet.x + 28, y: FLOOR - NECK_ABOVE_FLOOR, z: feet.z };
    // (within reach: each hand no farther from the neck's base than a raised arm and a lifted shoulder)
    const far = (p: { x: number; y: number; z: number }) => Math.hypot(p.x - neck.x, p.y - neck.y, p.z - neck.z) > 760;
    if (far(front) || far(GRIP)) continue;
    const poses = operatorPoses(feet, front, { rear: GRIP });
    // (FrontBoom3: ONE straight pole from the mic's tail through both fists to its end — the engine's own pole lies
    // on the same line from the tail to the grip)
    out = { side: poses.side, top: poses.top, front, rear: GRIP, pole: { a: tail, b: at(110) }, rearArm: B10_REAR_ARM, elbows: 'beside', ...(k > 110 ? { sideRearFar: true } : {}) };
    break;
  }
  if (liveCache.size > 400) liveCache.clear();
  liveCache.set(key, out);
  return out;
}
/**
 * (2026-11-24, "the hands flip between old and new while dragging") THE HANDS' DRAWINGS HELD THROUGH A DRAG: the side
 * view's choice of drawing per hand (BoomV2: end-on, flat, or the old hand) is made for each new rig with the drawing
 * each hand carried on the last one passed in (`hold`): a drawing is kept while it still fits with a little room, and
 * another takes over only where it fits with a little to spare — one change where the view really changes, never a
 * flicker at the edge. Decided ONCE per rig (every layer that draws that rig — the operator, her fists over the
 * engine's pole — gets the same hold, so they draw the same hands).
 */
let lastHold: SideDrawing[] | undefined;
const holdCache = new WeakMap<BoomRig, { h: { side: SideDrawing[] } | undefined }>();
function holdFor(rig: BoomRig): { side: SideDrawing[] } | undefined {
  let e = holdCache.get(rig);
  if (!e) {
    const h = lastHold ? { side: lastHold } : undefined;
    lastHold = sideDrawings(boomPlans(rig, WHO.operator, 'side', false, h));
    e = { h };
    holdCache.set(rig, e);
  }
  return e.h;
}
/** The operator's rig now: the dragged boom's line (the engine's store), else the starting setup's; `live` when
 *  the engine draws the pole too; `hold` the side hands' drawings kept through the drag. */
function useB10Rig(): { rig: BoomRig; live: boolean; hold?: { side: SideDrawing[] } } {
  const mics = useHeldMicsNow();
  const boom = mics?.find((m) => Math.hypot(m.grip.x - GRIP.x, m.grip.y - GRIP.y, m.grip.z - GRIP.z) < 2 && (m.len ?? 0) > 0);
  if (!boom || B10_BOOM_HOLD !== 'overhead') return { rig: RIG, live: !!boom };
  const r = liveRig(boom);
  if (r) lastLive = r;
  const rig = r ?? lastLive ?? RIG;
  return { rig, live: true, hold: holdFor(rig) };
}
/** (FrontBoom3) the operator drawn whole at full strength: her fists are painted again over the engine's pole. */
const B10_OPERATOR_DIM = 1;
function BoomLiveV2({ view }: { view: 'side' | 'top' }) {
  const { rig, hold } = useB10Rig();
  return <BoomOperatorV2 view={view} rig={rig} who={WHO.operator} dim={B10_OPERATOR_DIM} hold={hold} />;
}
/** (dev, the study page) the operator now with her rig's points and solved joints as dots. */
export function B10BoomDebugV2({ view, part = 'all' }: { view: 'side' | 'top'; part?: 'all' | 'hands' }) {
  const { rig, hold } = useB10Rig();
  return <BoomOperatorV2 view={view} rig={rig} who={WHO.operator} dim={B10_OPERATOR_DIM} part={part} debug hold={hold} />;
}
/** (FrontBoom3) After the engine's pole (heldLive HeldFront, `HeldConfig.front`): the operator's two fists again,
 *  each with the pole's piece inside it, so the pole passes THROUGH the closed hands (never laid over them).
 *  (2026-11-24) From above too: the engine's pole is drawn after the scene, so without this it lay over her fingers
 *  there — the approved hand from above closes its fingers OVER the pole. The same rig and hold as the operator drawn
 *  in the scene (useB10Rig: one store read the same way by both — heldLive.useHeldNow), so the fists land on her hands. */
export function B10BoomHandsOver({ view }: { view: ViewId }) {
  const { rig, live, hold } = useB10Rig();
  if (!live) return null;
  return <BoomOperatorV2 view={view === 'side' ? 'side' : 'top'} rig={rig} who={WHO.operator} dim={B10_OPERATOR_DIM} part="hands" hold={hold} />;
}

// (FrontBoom3) after the engine's pole (heldLive HeldFront): the operator's fists again, the pole through them
(B10_HELD as HeldConfig).front = (view: ViewId) => <B10BoomHandsOver view={view} />;

const holds = (v: VariantId) => ({ reporter: v === 'sideline' || v === 'twoMics', guest: v === 'twoMics' });

/** The reporter from the SIDE (owner 2026-10-08, L7C): they stand 0.65 m
 *  farther from the viewer, right behind the guest — hidden, their arm read
 *  as the guest holding their own mic. So the reporter is drawn FAINT (the
 *  shared standing figure at this opacity) over the guest: farther, fainter. */
export const REPORTER_FAINT = 0.34;

/**
 * THE FAINT REPORTER AS A GHOST (FrontBoom3, coordinator 2026-11-24): drawn whole at one opacity she read as a
 * double exposure over the guest (two see-through heads, the guest's ear through hers). Now one flat soft tone with a
 * slightly darker edge (`edgePx` of it round the outline), no inner detail — the layout (L7C: she stands behind the
 * guest, drawn faint so the guest stays visible) and every point unchanged. null: the old faint drawing.
 */
const REPORTER_GHOST: { fill: [number, number, number]; edge: [number, number, number]; alpha: number; edgePx: number } | null = { fill: [0.62, 0.66, 0.74], edge: [0.36, 0.4, 0.48], alpha: 0.3, edgePx: 1.6 };
/** A layer that paints whatever is drawn in it as ONE colour (its own alpha kept); `erode` px in from its outline. */
function ghostPaint(c: [number, number, number], erode = 0) {
  return (
    <Paint>
      <ColorMatrix matrix={[0, 0, 0, 0, c[0], 0, 0, 0, 0, c[1], 0, 0, 0, 0, c[2], 0, 0, 0, 1, 0]} />
      {erode > 0 ? <Morphology operator="erode" radius={erode} /> : null}
    </Paint>
  );
}

/** The handhelds the reporter holds at the sideline (the flag handhelds). */
const FLAG_IDS = ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper'] as const;

/** The reporter's fist on the sideline handheld at its START (the setup's
 *  pose, frame V): where the "REPORTER’S HAND" label points — the engine's
 *  own held-arm geometry (geometry/arm.ts heldFist; the handheld's length
 *  from sportMics). */
export function reporterFist(): Vec3 {
  const s = B10_ZONES.find((z) => z.id === 'b10.hand')!.start;
  const aim = aimVec(s.az, s.el);
  const len = SPORT_SPEECH_MIC_TYPES.bcFlagOmni.body.length.mm;
  // (figure V2) where the drawn hand closes: on the free handle of a flag drawn longer
  const k = V2 ? B10_HELD.fistFromFront?.('bcFlagOmni') : undefined;
  if (k != null) return { x: s.p.x - aim.x * k, y: s.p.y - aim.y * k, z: s.p.z - aim.z * k };
  return heldFist({ x: s.p.x - aim.x * len, y: s.p.y - aim.y * len, z: s.p.z - aim.z * len }, aim);
}

/** (figure V2) The guest and the reporter as their cast members, each holding a mic when the engine hangs one from their shoulder. */
const WHO = { guest: castFor('talker.guest'), reporter: castFor('talker.reporter'), operator: castFor('operator.boomB10') };
function PeopleV2({ view, variant, reporter, plainFaint, ghost = true }: { view: ViewId; variant: VariantId; reporter: boolean; plainFaint: boolean; ghost?: boolean }) {
  const h = holds(variant);
  const side = view === 'side';
  const sideline = variant === 'sideline';
  const guest = <StandingV2 view={view} t={GUEST} who={WHO.guest} holder={GUEST_HOLDER} />;
  const showRep = reporter && (!side || h.reporter);
  if (side)
    // From the side the reporter stands right behind the guest (0.65 m farther): their held arm comes out from
    // behind the guest (drawn first, a value step down, opaque); the reporter drawn FAINT over the guest while they
    // hold a mic (owner 2026-10-08, L7C), so the arm is seen to be theirs.
    return (
      <Group>
        {showRep ? <StandingV2 view={view} t={REPORTER} who={WHO.reporter} holder={REP_HOLDER} only="arm" /> : null}
        {guest}
        {/* (FrontBoom3, review 2026-11-24: "two overlapping see-through heads read as a double exposure") the faint
            reporter as a GHOST: one soft even tone (no face, no hair texture, no inner detail), a slightly darker edge,
            at a low opacity — so ONE clear guest reads through it; her held arm and hand stay solid where they carry
            the mic (drawn first, above). */}
        {showRep ? (
          REPORTER_GHOST && ghost ? (
            <Group layer={<Paint opacity={REPORTER_GHOST.alpha} />}>
              <Group layer={ghostPaint(REPORTER_GHOST.edge)}>
                <StandingV2 view={view} t={REPORTER} who={WHO.reporter} phones={sideline} holder={REP_HOLDER} plainFace />
              </Group>
              <Group layer={ghostPaint(REPORTER_GHOST.fill, REPORTER_GHOST.edgePx)}>
                <StandingV2 view={view} t={REPORTER} who={WHO.reporter} phones={sideline} holder={REP_HOLDER} plainFace />
              </Group>
            </Group>
          ) : (
            <Group layer={<Paint opacity={REPORTER_FAINT} />}>
              <StandingV2 view={view} t={REPORTER} who={WHO.reporter} phones={sideline} holder={REP_HOLDER} plainFace={plainFaint} />
            </Group>
          )
        ) : null}
      </Group>
    );
  // From above the guest first: the reporter's arm reaches over the guest's shoulder line to the mouth.
  return (
    <Group>
      {guest}
      {showRep ? <StandingV2 view={view} t={REPORTER} who={WHO.reporter} phones={sideline} holder={REP_HOLDER} /> : null}
    </Group>
  );
}

/** (figure V2) the scene with the cloth’s folds soft (paint.SoftFolds) in the new look. */
export function B10Scene(props: { view: ViewId; variant: VariantId; reporter?: boolean; /** (the study page compares the old look) */ v2?: boolean; /** (the study page) the faint reporter's face drawn or not */ plainFaint?: boolean; /** (the study page) false: the faint reporter drawn whole as before, not as the ghost */ ghost?: boolean }): ReactElement {
  return (
    <SoftFolds.Provider value={props.v2 ?? V2}>
      <B10SceneIn {...props} />
    </SoftFolds.Provider>
  );
}

function B10SceneIn({ view, variant, reporter = true, v2 = V2, plainFaint = B10_FAINT_PLAIN, ghost = true }: { view: ViewId; variant: VariantId; reporter?: boolean; /** (the study page compares the old look) */ v2?: boolean; /** (the study page) the faint reporter's face drawn or not */ plainFaint?: boolean; ghost?: boolean }): ReactElement {
  const h = holds(variant);
  const side = view === 'side';
  const sideline = variant === 'sideline';
  const post = variant === 'postEvent';
  return (
    <Group>
      {sideline ? <PlayAreaHatch view={view} x={TOUCHLINE_X} depth={-420} z0={-1500} z1={1900} floor={FLOOR} /> : null}
      {sideline && !side ? <PaSpeaker view={view} c={PA_C} faces={-1} floor={FLOOR} /> : null}
      {post ? <Backdrop view={view} x={BACKDROP_X} z0={-1050} z1={1050} h={2300} floor={FLOOR} /> : null}
      {!side && variant !== 'postEvent' ? <DirArrow a={{ u: -200, v: EXIT_Z }} b={{ u: 1700, v: EXIT_Z }} color="#5bff85" w={12} /> : null}
      {!side && sideline ? <DirArrow a={{ u: -1500, v: -1350 }} b={{ u: -900, v: -1000 }} color="#8fbcff" w={10} /> : null}
      {v2 ? <PeopleV2 view={view} variant={variant} reporter={reporter} plainFaint={plainFaint} ghost={ghost} /> : null}
      {!v2 && reporter && !side ? <StandingTalker view={view} t={REPORTER} arm={h.reporter ? 'R' : undefined} phones={sideline} /> : null}
      {!v2 ? <StandingTalker view={view} t={GUEST} arm={h.guest ? 'R' : undefined} /> : null}
      {/* From the side the reporter stands right behind the guest (0.65 m
          farther from the viewer). Owner 2026-10-08 (L7C): drawn FAINT over
          the guest whenever they hold a mic, so the arm the engine draws from
          their shoulder is seen to be theirs, not the guest's. */}
      {!v2 && reporter && side && h.reporter ? <StandingTalker view={view} t={REPORTER} arm="R" phones={sideline} dim={REPORTER_FAINT} /> : null}
      {post ? v2 ? <BoomLiveV2 view={side ? 'side' : 'top'} /> : <BoomOperator view={view} poses={OPERATOR_POSES} stub={POLE_STUB} /> : null}
      <CameraRig view={view} spec={CAMERA} />
      {/* From the side the PA (1.5 m nearer the viewer than the camera) and
          its pole stand in front of the camera (clash sweep 2026-10-10). */}
      {sideline && side ? <PaSpeaker view={view} c={PA_C} faces={-1} floor={FLOOR} /> : null}
    </Group>
  );
}

export function B10Instrument({ view, variant }: { view: ViewId; variant: VariantId }): ReactElement {
  return <B10Scene view={view} variant={variant} />;
}

export function b10Labels(view: ViewId, variant: VariantId): ArtLabel[] {
  const sideline = variant === 'sideline';
  const post = variant === 'postEvent';
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 140, v: -210, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 180, v: 140, align: 'left' }] },
      { id: 'b10.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 120, v: CAMERA_BOX.min.y - 160, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.min.y + 40 } },
    ];
    if (sideline) {
      // L7C: the holding hand named — only while a handheld is on the
      // drawing (the headset setup has no hand there).
      const f = reporterFist();
      out.push({ id: 'b10R.hand', text: 'REPORTER’S HAND', short: 'REPORTER', u: f.x + 150, v: f.y + 330, align: 'left', at: { u: f.x, v: f.y }, withMics: FLAG_IDS, alts: [{ u: f.x + 220, v: f.y - 330, align: 'left' }, { u: f.x - 150, v: f.y + 400, align: 'right' }] });
      out.push({ id: 'b10.play', text: 'PLAY AREA', u: TOUCHLINE_X - 120, v: FLOOR - 320, align: 'center', tone: 'muted', at: { u: TOUCHLINE_X - 200, v: FLOOR - 20 } });
      out.push({ id: 'b10.pa', text: 'PA', u: PA_C.x - 420, v: PA_C.y + 60, align: 'right', at: { u: PA_C.x - 170, v: PA_C.y } });
    }
    if (post) {
      out.push({ id: 'b10.backdrop', text: 'BACKDROP', u: BACKDROP_X - 60, v: -900, align: 'right', tone: 'muted', at: { u: BACKDROP_X, v: -700 } });
      out.push({ id: 'b10.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 200, v: 700, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 60, v: 650 } });
    }
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 160, v: 230, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 160, v: -230, align: 'left' }] },
    { id: 'b10R.head', text: 'REPORTER', u: REPORTER.lip.x - 120, v: REPORTER.lip.z - 330, align: 'center', at: { u: REPORTER.lip.x + HEAD_C.x, v: REPORTER.lip.z } },
    { id: 'b10.camera', text: 'CAMERA', u: CAMERA_BOX.max.x - 100, v: CAMERA_BOX.max.z + 280, align: 'center', at: { u: CAMERA_BOX.max.x - 150, v: CAMERA_BOX.max.z } },
  ];
  if (variant !== 'postEvent') out.push({ id: 'b10.exit', text: 'CLEAR EXIT · KEEP OPEN', short: 'EXIT', u: 900, v: EXIT_Z + 180, align: 'center', tone: 'muted' });
  if (sideline) {
    out.push({ id: 'b10.play', text: 'PLAY AREA', u: TOUCHLINE_X - 210, v: 600, align: 'center', tone: 'muted' });
    out.push({ id: 'b10.pa', text: 'PA', u: PA_C.x, v: PA_C.z - 360, align: 'center', at: { u: PA_C.x, v: PA_C.z - 150 } });
    out.push({ id: 'b10.wind', text: 'WIND', u: -1150, v: -1380, align: 'center', tone: 'muted' });
  }
  if (post) {
    out.push({ id: 'b10.operator', text: 'BOOM OPERATOR', short: 'OPERATOR', u: OPERATOR.feet.x + 260, v: OPERATOR.feet.z + 260, align: 'left', tone: 'muted', at: { u: OPERATOR.feet.x + 80, v: OPERATOR.feet.z } });
    out.push({ id: 'b10.backdrop', text: 'BACKDROP', u: BACKDROP_X - 60, v: -900, align: 'right', tone: 'muted', at: { u: BACKDROP_X, v: -700 } });
  }
  return out;
}

const inBox = (u: number, v: number, x0: number, x1: number, y0: number, y1: number, tol: number) => u >= x0 - tol && u <= x1 + tol && v >= y0 - tol && v <= y1 + tol;

export function b10HitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const vv = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
  if (Math.hypot(u - 2, v - (view === 'side' ? 2 : 0)) <= 16 + tol) return 'v.mouth';
  if (Math.hypot(u - HEAD_C.x, v - (view === 'side' ? HEAD_C.y : 0)) <= HEAD_R + tol) return 'v.head';
  const T = SINGER_SOLIDS.torso;
  if (T.kind === 'box' && inBox(u, v, T.min.x, T.max.x, vv(T.min), vv(T.max), tol)) return 'v.chest';
  if (view === 'top' && Math.hypot(u - (REPORTER.lip.x + HEAD_C.x), v - REPORTER.lip.z) <= HEAD_R + tol) return 'b10R.head';
  if (inBox(u, v, CAMERA_BOX.min.x, CAMERA_BOX.max.x, vv(CAMERA_BOX.min), vv(CAMERA_BOX.max), tol)) return 'b10.camera';
  if (variant === 'sideline' && u < TOUCHLINE_X + tol) return 'b10.play';
  if (variant === 'sideline' && Math.hypot(u - PA_C.x, v - vv(PA_C)) <= 320 + tol) return 'b10.pa';
  if (variant === 'postEvent' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol)) return 'b10.operator';
  if (variant === 'postEvent' && Math.abs(u - BACKDROP_X) <= 60 + tol) return 'b10.backdrop';
  if (view === 'top' && variant !== 'postEvent' && Math.abs(v - EXIT_Z) <= 80 + tol && u > -200) return 'b10.exit';
  return null;
}

export function b10FigureAt(view: ViewId, variant: VariantId, u: number, v: number, tol: number): boolean {
  const h = holds(variant);
  if (V2) {
    if (standingCoversV2(view, GUEST, WHO.guest, u, v, tol)) return true;
    if (view === 'top' && standingCoversV2(view, REPORTER, WHO.reporter, u, v, tol)) return true;
    return variant === 'postEvent' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol);
  }
  if (standingCovers(view, GUEST, u, v, tol, h.guest ? 'R' : undefined)) return true;
  if (view === 'top' && standingCovers(view, REPORTER, u, v, tol, h.reporter ? 'R' : undefined)) return true;
  return variant === 'postEvent' && figureCovers(view === 'side' ? OPERATOR_POSES.side : OPERATOR_POSES.top, u, v, tol);
}
