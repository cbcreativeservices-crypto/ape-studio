/**
 * FIGURE V2 — THE BROADCAST PEOPLE WHO HOLD A MIC (wave 3, step B round 2:
 * B03 field reporters, B09 commentators, B10 sideline interviews). The
 * standing talker (shared/broadcast/standing.ts) and the seated talker
 * (talkerPose.ts) as their cast members (cast.ts ROLES), each a possible
 * holder of a hand-held mic: while they hold one, the arm that holds it is the
 * held arm (figureV2/heldLive) at its depth and the person is drawn without
 * it; while they hold nothing, their own arms at rest. The open mouth and the
 * headphones as the old figures had them.
 */
import { Group, LinearGradient, Paint, Path, Skia, vec } from '@shopify/react-native-skia';
import { sidePaths } from '../figureV2/paths';
import { FigureLook, useLook } from '../figureV2/look';
import type { PlayerPose } from '../players/playerPose.ts';
import type { Vec3, ViewId } from '../../../engine/model/types.ts';
import { castFor, type CastMember, type RoleKey } from '../figureV2/cast';
import { PersonSideV2, PersonTopV2, personCovers, personPlan, personTopCovers, type PersonOpts } from '../figureV2/personV2';
import type { PersonTopOpts } from '../figureV2/topPerson.ts';
import { HeldBy, heldGripR, type HeldConfig, type HeldHolder } from '../figureV2/heldLive';
import type { HeldArmOpts } from '../figureV2/heldHands.ts';
import { figureCovers } from '../players/PlayerFigure';
import { Headphones, OnTalker, talkerPose } from './BroadcastArt';
import { standPoses, type Stander } from './standing.ts';
import { SEAT_Y, type Talker } from './talkerPose.ts';

function mouthPath() {
  const p = Skia.Path.Make();
  p.moveTo(1.5, -2.5);
  p.cubicTo(-4, -4.5, -11, -3.5, -14, 0);
  p.cubicTo(-11, 3.5, -4, 4.5, 1.5, 2.5);
  p.close();
  return p;
}
const MOUTH = mouthPath();

/* ── the holders ── */

const standCache = new Map<string, { side: ReturnType<typeof standPoses>['side']; top: ReturnType<typeof standPoses>['top'] }>();
const standOf = (t: Stander) => {
  const k = `${t.lip.x}:${t.lip.y}:${t.lip.z}:${t.facing}`;
  let p = standCache.get(k);
  if (!p) standCache.set(k, (p = standPoses(t)));
  return p;
};
const standSide = (t: Stander): PersonOpts => ({ lip: { u: t.lip.x, v: t.lip.y }, rest: 'restSide' });
const seatSide = (t: Talker, jacket = false): PersonOpts => ({ lip: { u: t.lip.x, v: t.lip.y }, rest: 'restFlat', seatV: SEAT_Y + t.lip.y, ...(jacket ? { jacket: true } : {}) });

/** A standing talker who may hold a mic from `shoulder` (the lesson's rim). */
export function standingHolder(id: string, t: Stander, shoulder: Vec3, role: RoleKey, o: { drop?: HeldArmOpts['drop']; behindSide?: boolean; straightBend?: number } = {}): HeldHolder {
  const p = standOf(t);
  return { id, shoulder, lip: t.lip, who: castFor(role), pose: p, side: standSide(t), top: {}, seated: false, ...o };
}

/** A seated talker (at a desk) who may hold a mic from `shoulder`. */
export function seatedHolder(id: string, t: Talker, shoulder: Vec3, role: RoleKey, o: { drop?: HeldArmOpts['drop']; jacket?: boolean } = {}): HeldHolder {
  return { id, shoulder, lip: t.lip, who: castFor(role), pose: { side: talkerPose('side', t), top: talkerPose('top', t) }, side: seatSide(t, o.jacket), top: { desk: true, ...(o.jacket ? { jacket: true } : {}) }, seated: true, ...(o.drop ? { drop: o.drop } : {}) };
}

/** A lesson's held mics: its holders; the fist where the engine puts it unless `fistFromFront` says; the handle's
 *  radius where the hand closes by the mic's art. */
export function heldConfig(holders: readonly HeldHolder[], o: { fistFromFront?: (typeId: string) => number | undefined; artOf: (typeId: string) => string } ): HeldConfig {
  return { holders, fistFromFront: o.fistFromFront, gripR: (typeId, r) => heldGripR(o.artOf(typeId), r) };
}

/* ── the flag handheld's drawn handle ── */

/**
 * OWNER DECISION (b), still open (2026-11-24): the flag handheld's handle drawn about 5 cm longer at the tail, so
 * the hand closes on the free handle below the flag ('longer', the lead's default) — or as today ('today': the hand
 * where the engine puts it reaches into the flag). ONE line flips it, in every lesson that draws a flag handheld
 * held in a hand the new way (B10, and B03's cardioid flag: the same mic). Drawing only: the capsule, the flag, the
 * front and every measured point are the same either way.
 */
export const FLAG_HANDLE_TAIL = 'longer' as 'longer' | 'today';
const FLAG_TYPES: readonly string[] = ['bcFlagOmni', 'bcFlagCard', 'bcFlagSuper'];
/** The flag handheld's radius (sportMics HANDHELD) and its flag's lower edge from the front (the drawing's: 4.75 r). */
const FLAG_BOTTOM = 4.75 * 25;
export const isFlagHandheld = (typeId: string) => FLAG_TYPES.includes(typeId);
/** Drawn longer: the free handle below the flag, about 95 mm. */
export const flagDrawLen = (typeId: string): number | undefined => (FLAG_HANDLE_TAIL === 'longer' && isFlagHandheld(typeId) ? FLAG_BOTTOM + 95 : undefined);
/** The fist's middle on that free handle, low enough that the tail's end stays inside the fist's heel (never a
 *  block of handle between the fist and the wrist): 38 mm from the drawn tail (mm back from the front). */
export const flagFistFromFront = (typeId: string): number | undefined => (FLAG_HANDLE_TAIL === 'longer' && isFlagHandheld(typeId) ? FLAG_BOTTOM + 95 - 38 : undefined);
/** The same for any long-handled held mic: the fist 38 mm from its tail (B03's reporter omni). */
export const fistAtTail = (len: number) => len - 38;

/* ── drawn ── */

/** A head in profile with no face drawn: the skull, the hair, the ear — for a person drawn faint behind another
 *  person's face (B10's reporter, L7C), so only ONE face reads. */
function PlainHeadIn({ pose, who, opts }: { pose: PlayerPose; who: CastMember; opts: PersonOpts }) {
  const { MAT, HEAD_SKIN } = useLook();
  const plan = personPlan(pose, who, opts);
  const P = sidePaths(plan);
  const b = plan.head.box;
  const c = { u: (b.u0 + b.u1) / 2, v: (b.v0 + b.v1) / 2 };
  const R = 110;
  return (
    <Group>
      <Path path={P.skull}>
        <LinearGradient start={vec(c.u - 0.32 * R, c.v - 0.95 * R)} end={vec(c.u + 0.32 * R, c.v + 0.95 * R)} colors={[HEAD_SKIN.form[1], HEAD_SKIN.form[2], HEAD_SKIN.form[3]]} />
      </Path>
      <Path path={P.hair}>
        <LinearGradient start={vec(c.u - 0.32 * R, c.v - 0.95 * R)} end={vec(c.u + 0.32 * R, c.v + 0.95 * R)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
      </Path>
      {plan.head.earShows ? <Path path={P.ear} color={HEAD_SKIN.form[2]} /> : null}
    </Group>
  );
}
function PlainHead({ pose, who, opts }: { pose: PlayerPose; who: CastMember; opts: PersonOpts }) {
  return (
    <FigureLook look={who.look}>
      <PlainHeadIn pose={pose} who={who} opts={opts} />
    </FigureLook>
  );
}

/** A standing talker in the new look. `holder`: they may hold a mic (the held arm, the person without it). */
export function StandingV2({ view, t, who, phones = false, headless = false, dim = 1, holder, only, plainFace = false }: { view: ViewId; t: Stander; who: CastMember; phones?: boolean; headless?: boolean; dim?: number; holder?: HeldHolder; /** the held arm alone, or the body alone (HeldBy) */ only?: 'arm' | 'body'; /** (from the side) the head with no face: a person drawn faint behind another's face */ plainFace?: boolean }) {
  const p = standOf(t);
  const plain = plainFace && view === 'side' && !headless;
  const person = (noArm: 'near' | 'far' | undefined) => (
    <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>
      {plain ? <PlainHead pose={p.side} who={who} opts={standSide(t)} /> : null}
      {view === 'side' ? (
        <PersonSideV2 pose={p.side} who={who} opts={{ ...standSide(t), ...(noArm ? { noArm } : {}) }} part={headless || plain ? 'headless' : 'all'} />
      ) : (
        <PersonTopV2 pose={p.top} who={who} opts={noArm ? { noArm } : {}} head={headless ? 'none' : 'show'} />
      )}
      {!headless ? (
        <OnTalker view={view} t={t}>
          {view === 'side' && !plain ? <Path path={MOUTH} color="#24170f" opacity={0.92} /> : null}
          {phones ? <Headphones view={view} /> : null}
        </OnTalker>
      ) : null}
    </Group>
  );
  if (!holder) return only === 'arm' ? null : person(undefined);
  return <HeldBy holder={holder} view={view} person={person} only={only} />;
}

/** A seated talker in the new look (at a desk); `part` from above as SeatedTalker's. `holder`: they may hold a mic. */
export function SeatedV2({ view, t, who, phones = false, headless = false, part = 'all', jacket = false, holder }: { view: ViewId; t: Talker; who: CastMember; phones?: boolean; headless?: boolean; part?: 'all' | 'lower' | 'upper'; jacket?: boolean; holder?: HeldHolder }) {
  const pose = talkerPose(view, t);
  const person = (noArm: 'near' | 'far' | undefined) =>
    view === 'top' ? (
      <Group>
        <PersonTopV2 pose={pose} who={who} opts={{ desk: true, ...(jacket ? { jacket: true } : {}), ...(noArm ? { noArm } : {}) } as PersonTopOpts} part={part} head={headless ? 'none' : 'show'} />
        {phones && !headless && part !== 'lower' ? (
          <OnTalker view={view} t={t}>
            <Headphones view={view} />
          </OnTalker>
        ) : null}
      </Group>
    ) : (
      <Group>
        <PersonSideV2 pose={pose} who={who} opts={{ ...seatSide(t, jacket), ...(noArm ? { noArm } : {}) }} part={headless ? 'headless' : 'all'} />
        {!headless ? (
          <OnTalker view={view} t={t}>
            <Path path={MOUTH} color="#24170f" opacity={0.92} />
            {phones ? <Headphones view={view} /> : null}
          </OnTalker>
        ) : null}
      </Group>
    );
  if (!holder) return person(undefined);
  return <HeldBy holder={holder} view={view} part={part} person={person} />;
}

/** Whether a standing talker drawn new covers (u, v): the new outline and the old envelope (labels keep off both). */
export function standingCoversV2(view: ViewId, t: Stander, who: CastMember, u: number, v: number, tol: number): boolean {
  const p = standOf(t);
  if (view === 'side') return personCovers(p.side, who, standSide(t), u, v, tol) || figureCovers(p.side, u, v, tol);
  if (personTopCovers(p.top, who, {}, u, v, tol)) return true;
  const pose = p.top;
  const a = -((pose.facing ?? 0) - Math.PI / 2);
  const du = u - pose.neck.u;
  const dv = v - pose.neck.v;
  return figureCovers(pose, pose.neck.u + du * Math.cos(a) - dv * Math.sin(a), pose.neck.v + du * Math.sin(a) + dv * Math.cos(a), tol);
}
