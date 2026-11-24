/**
 * FIGURE STUDY — DEV + WEB ONLY (the owner's figure realism pass, must-do
 * D78, 2026-11-22). `#labpreview/FigureStudy` shows the ONE example figure the
 * owner judges before any other figure changes: the seated kit drummer of
 * Drum Overheads (M09), side view, from the player's right.
 *   (a) CURRENT and NEW side by side, the whole drummer at the kit;
 *   (b) NEW at the lesson's own phone size (the M09 side view's frame);
 *   (c) NEW large: the head and neck, the two hands on the sticks, the foot
 *       on the pedal.
 * `#labpreview/FigureStudy/<part>` shows one part alone (compare, lesson,
 * head, hands, alone, foot, top, topclose, topsizes).
 * The CURRENT column forces the old look (`figureV2={false}`); since wave 1
 * (2026-11-23) the app draws the kit drummer in the new look (figureV2Config)
 * [MD:D78]. Nothing here ships to a phone: the
 * harness module is required only in the web dev branch of App.tsx.
 */
import type { ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BlurMask, Canvas, Group, LinearGradient, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { sidePaths } from '../screens/lab/miking/lessons/shared/figureV2/paths';
import { FigureScale, type FigureLevel } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { KitSide, KitTop, Sticks, kitSceneSticks } from '../screens/lab/miking/lessons/shared/kitScene/KitSceneArt';
import { FigureV2HandAlone } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Side';
import { kitDrummerPlan } from '../screens/lab/miking/lessons/shared/figureV2/kitDrummerV2';
import { M09_MODEL } from '../screens/lab/miking/lessons/m09Overheads/geometry';
import { sceneFrame } from '../screens/lab/miking/engine/geometry/contentFrame';
import { fitXform } from '../screens/lab/miking/engine/geometry/frame';
import { CAST, ROLES, type CastId } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { PersonSideV2, personPlan } from '../screens/lab/miking/lessons/shared/figureV2/personV2';
import { SINGER_SIDE, SINGER_TOP } from '../screens/lab/miking/lessons/shared/voice/voicePose';
import { PersonTopV2 } from '../screens/lab/miking/lessons/shared/figureV2/personV2';
import { PlayerBehind, PlayerInFront } from '../screens/lab/miking/lessons/shared/players/PlayerFigure';
import { poseOnTalker } from '../screens/lab/miking/lessons/shared/broadcast/talkerPose';
import { castFor } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { B01Scene } from '../screens/lab/miking/lessons/b01RadioHost/scene';
import { B06Scene } from '../screens/lab/miking/lessons/b06Panels/scene';
import { B07Scene } from '../screens/lab/miking/lessons/b07Voiceover/scene';
import { talkerPose, TurnedHeadSide, TurnedHeadTop } from '../screens/lab/miking/lessons/shared/broadcast/BroadcastArt';
import { DESK_TOP_Y, HOST } from '../screens/lab/miking/lessons/shared/broadcast/talkerPose';
import { personTopPlan } from '../screens/lab/miking/lessons/shared/figureV2/topPerson';
import { B02Scene } from '../screens/lab/miking/lessons/b02NewsAnchor/scene';
import { ANCHOR, DESK as B02_DESK } from '../screens/lab/miking/lessons/b02NewsAnchor/geometry';
import { Desk, DeskNearLegs, StudioChair } from '../screens/lab/miking/lessons/shared/broadcast/BroadcastArt';
import { LavClip } from '../screens/lab/miking/lessons/shared/broadcast/BodyWornArt';
import { BODY_MOUNTS } from '../screens/lab/miking/lessons/shared/broadcast/bodyWorn';
import { SEATED_FLOOR, SEAT_Y } from '../screens/lab/miking/lessons/shared/broadcast/talkerPose';
import { clipOnCloth, jacketSidePlan } from '../screens/lab/miking/lessons/shared/figureV2/jacketPlan';
import { FigureLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import { ARM_CASES, ArmScene, armCaseTitle, armCentre, armFrame, STEP_IN_MM, type ArmCaseId, type ArmFrame, type ArmOpt } from './heldArmStudy';
import { HELD_CASES, HeldStudy, STEP_IN, heldArmNumbers, heldGeo, heldViewOf, steppedIn, type HeldCaseId } from './heldStudy';
import { ElsewhereStudy } from './elsewhereStudy';
import { FamiliesStudy } from './familyStudy';
import { PlayersStudy } from './playersStudy';
import { Players3dStudy } from './players3dStudy';
import { PlayersGuitarStudy } from './playersGuitarStudy';
import { PlayersMalletStudy } from './playersMalletStudy';
import { OperatorsStudy } from './operatorsStudy';
import { FrontStudy } from './frontBoomStudy';
import { HeldLessonsStudy } from './heldLessonsStudy';
import { Foley3Study } from './foley3Study';
import { Ensembles2Study } from './ensembles2Study';
import { MetalStudy } from './metalStudy';
import { PoleHandStudy } from './poleHandStudy';
import { PoleHandBackStudy } from './poleHandBackStudy';
import { PoleHandTopStudy } from './poleHandTopStudy';
import { PoleHandEndStudy } from './poleHandEndStudy';
import { MalletHandStudy } from './malletHandStudy';

const BG = '#0d0f13';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

/** A window of the kit's side view (u, v mm: centre and width), `w` pt wide. */
function Crop({ cu, cv, mmW, mmH, w, v2, isolate = false }: { cu: number; cv: number; mmW: number; mmH: number; w: number; v2: boolean; isolate?: boolean }) {
  const s = w / mmW;
  const h = mmH * s;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Rect x={0} y={0} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: h / 2 - cv * s }, { scale: s }]}>
        <FigureScale ptPerMm={s}>
          <KitSide reach={false} keepOuts={false} figureV2={v2} isolate={isolate} />
        </FigureScale>
      </Group>
    </Canvas>
  );
}

/** A window of the kit's view FROM ABOVE (wave 1 of D78): u = x, v = z, as the lesson's top view. */
function TopCrop({ cu, cv, mmW, mmH, w, v2 }: { cu: number; cv: number; mmW: number; mmH: number; w: number; v2: boolean }) {
  const s = w / mmW;
  const h = mmH * s;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Rect x={0} y={0} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: h / 2 - cv * s }, { scale: s }]}>
        <FigureScale ptPerMm={s}>
          <KitTop reach={false} keepOuts={false} figureV2={v2} />
        </FigureScale>
      </Group>
    </Canvas>
  );
}

/** The lesson's own top view at a given glass (pt): the inset (≈ 97 × 85) or the main picture. */
function TopLessonSize({ W, H, v2, level }: { W: number; H: number; v2: boolean; level?: FigureLevel }) {
  const box = sceneFrame(M09_MODEL, 'studio', 'top', false) ?? M09_MODEL.views.top!;
  const f = fitXform('top', box, W, H, 4);
  return (
    <Canvas style={{ width: W, height: H }}>
      <Rect x={0} y={0} width={W} height={H} color={STAGE} />
      <Group transform={[{ translateX: f.ox }, { translateY: f.oy }, { scale: f.s }]}>
        <FigureScale ptPerMm={f.s} level={level}>
          <KitTop reach={false} keepOuts={false} figureV2={v2} />
        </FigureScale>
      </Group>
    </Canvas>
  );
}

/** (dev bisect) The side head's hair path alone at a given scale (pt per mm): A gradient + 1.1 mm mask blur (as painted), B gradient only, C solid + blur. */
function HairBisect({ s }: { s: number }) {
  const plan = kitDrummerPlan();
  const P = sidePaths(plan);
  const b = P.hair.getBounds();
  const W = Math.max(30, b.width * s + 8);
  const H = Math.max(30, b.height * s + 8);
  const cell = (k: number, child: ReactNode) => (
    <Group transform={[{ translateX: k * W + 4 - b.x * s }, { translateY: 4 - b.y * s }, { scale: s }]}>{child}</Group>
  );
  return (
    <Canvas style={{ width: W * 3, height: H }}>
      <Rect x={0} y={0} width={W * 3} height={H} color="#c9a58c" />
      {cell(
        0,
        <Path path={P.hair}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#463830', '#2e241f', '#1a1411']} />
          <BlurMask blur={1.1} style="normal" />
        </Path>,
      )}
      {cell(
        1,
        <Path path={P.hair}>
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={['#463830', '#2e241f', '#1a1411']} />
        </Path>,
      )}
      {cell(
        2,
        <Path path={P.hair} color="#2e241f">
          <BlurMask blur={1.1} style="normal" />
        </Path>,
      )}
    </Canvas>
  );
}

/** The M09 side view fitted to a glass, at a forced level of detail (the LOD comparison). */
function SideLessonSize({ W, H, level }: { W: number; H: number; level?: FigureLevel }) {
  const box = sceneFrame(M09_MODEL, 'studio', 'side', false) ?? M09_MODEL.views.side!;
  const f = fitXform('side', box, W, H, 4);
  return (
    <Canvas style={{ width: W, height: H }}>
      <Rect x={0} y={0} width={W} height={H} color={STAGE} />
      <Group transform={[{ translateX: f.ox }, { translateY: f.oy }, { scale: f.s }]}>
        <FigureScale ptPerMm={f.s} level={level}>
          <KitSide reach={false} keepOuts={false} figureV2 />
        </FigureScale>
      </Group>
    </Canvas>
  );
}

/** One hand alone with its stick and cuff, large, on the plain dark ground (no drums). */
function HandAlone({ which, w, mm = 230, on }: { which: 'near' | 'far'; w: number; mm?: number; on?: 'cuff' | 'hand' }) {
  const plan = kitDrummerPlan();
  const a = plan.arms[which];
  const h = a.hold!;
  const [near, far] = kitSceneSticks('side');
  const st = which === 'near' ? near : far;
  const line = Skia.Path.Make();
  line.moveTo(st.butt.x, st.butt.y);
  line.lineTo(st.to.x, st.to.y);
  // (close-ups: centred on the cuff's opening, or on the drawn hand)
  const c = on === 'cuff' ? a.opening.e.c : on === 'hand' && a.placed ? a.placed.at({ u: 70, v: 0 }) : { u: (h.fulcrum.x + a.wrist.u) / 2, v: (h.fulcrum.y + a.wrist.v) / 2 };
  const cu = c.u;
  const cv = c.v;
  const s = w / mm;
  return (
    <Canvas style={{ width: w, height: w }}>
      <Rect x={0} y={0} width={w} height={w} color={STAGE} />
      <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: w / 2 - cv * s }, { scale: s }]}>
        <FigureScale ptPerMm={s}>
          <FigureV2HandAlone plan={plan} which={which} stick={<Sticks path={line} />} />
        </FigureScale>
      </Group>
    </Canvas>
  );
}

function Caption({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text
        style={{
          color: INK,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      {note ? <Text style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <View style={{ marginBottom: 28 }}>{children}</View>;
}

/** The lesson's own side view at a 390 pt phone (the scene's glass ≈ 349 × 290 pt). */
function LessonSize() {
  const W = 349;
  const H = 290;
  const box = sceneFrame(M09_MODEL, 'studio', 'side', false) ?? M09_MODEL.views.side!;
  const f = fitXform('side', box, W, H, 8);
  return (
    <Canvas style={{ width: W, height: H }}>
      <Rect x={0} y={0} width={W} height={H} color={STAGE} />
      <Group transform={[{ translateX: f.ox }, { translateY: f.oy }, { scale: f.s }]}>
        <FigureScale ptPerMm={f.s}>
          <KitSide swing reach={false} keepOuts={false} figureV2 />
        </FigureScale>
      </Group>
    </Canvas>
  );
}


/* ── THE CAST (wave 3 of D78) ── */

const CAST_IDS: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
const REST = { lip: { u: 0, v: 0 }, rest: 'restSide' as const };

/** Cast members side by side in ONE canvas (a browser allows only so many
 *  canvases at once), each standing in profile (the singer's pose, hands at
 *  rest), cropped round (cu, cv) — or each crop's own centre from `at`. */
function CastRow({ ids, cu, cv, mmW, mmH, w, gap = 8, at }: { ids: CastId[]; cu: number; cv: number; mmW: number; mmH: number; w: number; gap?: number; at?: (id: CastId) => { u: number; v: number } }) {
  const s = w / mmW;
  const h = mmH * s;
  const W = ids.length * w + (ids.length - 1) * gap;
  return (
    <Canvas style={{ width: W, height: h }}>
      {ids.map((id, i) => {
        const c = at ? at(id) : { u: cu, v: cv };
        const x0 = i * (w + gap);
        const clip = Skia.XYWHRect(x0, 0, w, h);
        return (
          <Group key={id} clip={clip}>
            <Rect x={x0} y={0} width={w} height={h} color={STAGE} />
            <Group transform={[{ translateX: x0 + w / 2 - c.u * s }, { translateY: h / 2 - c.v * s }, { scale: s }]}>
              <FigureScale ptPerMm={s}>
                <PersonSideV2 pose={SINGER_SIDE} who={CAST[id]} opts={REST} />
              </FigureScale>
            </Group>
          </Group>
        );
      })}
    </Canvas>
  );
}

function CastNames({ w, gap = 8 }: { w: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap, marginBottom: 18 }}>
      {CAST_IDS.map((id) => {
        const roles = Object.entries(ROLES)
          .filter(([, v]) => v === id)
          .map(([k]) => k);
        return <Text key={id} style={{ color: DIM, fontSize: 10, width: w }}>{`${CAST[id].name}: ${roles.join(', ')}`}</Text>;
      })}
    </View>
  );
}

function CastLineup({ width, only }: { width: number; only: string }) {
  const big = Math.min(170, (width - 24 - 4 * 8) / 5);
  const hand = (id: CastId) => personPlan(SINGER_SIDE, CAST[id], REST).arms.near.placed!.at({ u: 85, v: 5 });
  const close = Math.min(width - 24, 600);
  return (
    <View>
      <Caption title="THE CAST — ENLARGED (FULL DETAIL)" note="Each person standing in profile from the right, hands at rest, about 0.24 pt/mm. Cast member one is the kit drummer (his approved look). Under each: the roles the table gives that person." />
      <CastRow ids={CAST_IDS} cu={-90} cv={650} mmW={700} mmH={1950} w={big} />
      <CastNames w={big} />
      <Caption title="THE CAST — AT A LESSON'S SIZE (LITE)" note="About 0.13 pt/mm: the singer as the voice lessons' side view shows a standing person on a 390 pt phone." />
      <View style={{ marginBottom: 18 }}>
        <CastRow ids={CAST_IDS} cu={-90} cv={650} mmW={700} mmH={1950} w={92} />
      </View>
      <Caption title="HEADS AT THE LESSON'S SIZE, THEN 3× IT" note="Each head as the lesson draws it (top row), then three times larger (hair, face, ear)." />
      <View style={{ marginBottom: 8 }}>
        <CastRow ids={CAST_IDS} cu={-110} cv={-60} mmW={360} mmH={420} w={47} />
      </View>
      <View style={{ marginBottom: 18 }}>
        <CastRow ids={CAST_IDS} cu={-110} cv={-60} mmW={360} mmH={420} w={Math.min(141, big)} />
      </View>
      {only === 'casthand' ? (
        <View style={{ marginBottom: 18 }}>
          <Caption title="HAND AT REST (dev): ABOUT 3 PT/MM" />
          <CastRow ids={['ana', 'ruth', 'kofi', 'mei', 'drummer']} cu={0} cv={0} at={(id) => personPlan(SINGER_SIDE, CAST[id], REST).arms.near.placed!.at({ u: 80, v: 0 })} mmW={130} mmH={210} w={Math.min(150, (width - 56) / 5)} />
          <View style={{ height: 8 }} />
          <CastRow ids={['kofi', 'ruth']} cu={0} cv={0} at={(id) => personPlan(SINGER_SIDE, CAST[id], REST).arms.near.placed!.at({ u: 80, v: 0 })} mmW={130} mmH={210} w={Math.min(380, (width - 32) / 2)} />
        </View>
      ) : null}
      {only === 'castzoom' ? (
        <View style={{ marginBottom: 18 }}>
          <Caption title="ZOOM (dev): TORSO AND ARM; HIPS AND LEGS; FEET" />
          <CastRow ids={['ana', 'kofi']} cu={-60} cv={420} mmW={520} mmH={620} w={Math.min(380, (width - 32) / 2)} />
          <View style={{ height: 8 }} />
          <CastRow ids={['ruth', 'mei']} cu={-60} cv={420} mmW={520} mmH={620} w={Math.min(380, (width - 32) / 2)} />
          <View style={{ height: 8 }} />
          <CastRow ids={['ana', 'kofi']} cu={-40} cv={1250} mmW={520} mmH={620} w={Math.min(380, (width - 32) / 2)} />
        </View>
      ) : null}
      {only === 'castbody' ? (
        <View style={{ marginBottom: 18 }}>
          <Caption title="BODIES (dev): LARGE" />
          <CastRow ids={['ana', 'kofi']} cu={-90} cv={650} mmW={700} mmH={1950} w={Math.min(380, (width - 32) / 2)} />
          <View style={{ height: 8 }} />
          <CastRow ids={['ruth', 'mei']} cu={-90} cv={650} mmW={700} mmH={1950} w={Math.min(380, (width - 32) / 2)} />
        </View>
      ) : null}
      {only === 'castclose' ? (
        <View>
          <Caption title="CLOSE (dev): EACH HEAD, THEN EACH NEAR HAND AT REST, LARGE" />
          <View style={{ marginBottom: 8 }}>
            <CastRow ids={CAST_IDS.slice(0, 3)} cu={-110} cv={-60} mmW={360} mmH={360} w={close / 3 - 6} />
          </View>
          <View style={{ marginBottom: 8 }}>
            <CastRow ids={CAST_IDS.slice(3)} cu={-110} cv={-60} mmW={360} mmH={360} w={close / 3 - 6} />
          </View>
          <View style={{ marginBottom: 8 }}>
            <CastRow ids={CAST_IDS.slice(0, 3)} cu={0} cv={0} at={hand} mmW={200} mmH={260} w={close / 3 - 6} />
          </View>
          <CastRow ids={CAST_IDS.slice(3)} cu={0} cv={0} at={hand} mmW={200} mmH={260} w={close / 3 - 6} />
        </View>
      ) : null}
    </View>
  );
}


/* ── WAVE 3a: the standing figures, old beside new (dev page `wave3`) ── */

type Pic = { key: string; title: string; draw: ReactNode; cu: number; cv: number; mmW: number; mmH: number };

/** Several pictures side by side in ONE canvas (a browser allows only so many canvases), each cropped. */
/** Pictures in a grid of `cols`, ONE canvas (the page keeps under the browser's canvas limit). */
function PicGrid({ pics, w, cols, gap = 8 }: { pics: Pic[]; w: number; cols: number; gap?: number }) {
  const h = Math.max(...pics.map((q) => (q.mmH * w) / q.mmW));
  const rows = Math.ceil(pics.length / cols);
  const lab = 14;
  const W = cols * w + (cols - 1) * gap;
  const H = rows * (h + lab) + (rows - 1) * gap;
  return (
    <View>
      <Canvas style={{ width: W, height: H }}>
        {pics.map((q, i) => {
          const s = w / q.mmW;
          const x0 = (i % cols) * (w + gap);
          const y0 = Math.floor(i / cols) * (h + lab + gap);
          return (
            <Group key={q.key} clip={Skia.XYWHRect(x0, y0, w, h)}>
              <Rect x={x0} y={y0} width={w} height={h} color={STAGE} />
              <Group transform={[{ translateX: x0 + w / 2 - q.cu * s }, { translateY: y0 + h / 2 - q.cv * s }, { scale: s }]}>
                <FigureScale ptPerMm={s}>{q.draw}</FigureScale>
              </Group>
            </Group>
          );
        })}
      </Canvas>
      <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} pointerEvents="none">
        {pics.map((q, i) => (
          <Text key={q.key} style={{ position: 'absolute', left: (i % cols) * (w + gap), top: Math.floor(i / cols) * (h + lab + gap) + h + 1, color: DIM, fontSize: 10, width: w }}>
            {q.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PicRow({ pics, w, gap = 8 }: { pics: Pic[]; w: number; gap?: number }) {
  const h = Math.max(...pics.map((q) => (q.mmH * w) / q.mmW));
  const W = pics.length * w + (pics.length - 1) * gap;
  return (
    <View>
      <Canvas style={{ width: W, height: h }}>
        {pics.map((q, i) => {
          const s = w / q.mmW;
          const x0 = i * (w + gap);
          return (
            <Group key={q.key} clip={Skia.XYWHRect(x0, 0, w, h)}>
              <Rect x={x0} y={0} width={w} height={h} color={STAGE} />
              <Group transform={[{ translateX: x0 + w / 2 - q.cu * s }, { translateY: h / 2 - q.cv * s }, { scale: s }]}>
                <FigureScale ptPerMm={s}>{q.draw}</FigureScale>
              </Group>
            </Group>
          );
        })}
      </Canvas>
      <View style={{ flexDirection: 'row', gap }}>
        {pics.map((q) => (
          <Text key={q.key} style={{ color: DIM, fontSize: 10, width: w }}>
            {q.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

const SINGER = castFor('voice.singer');
const SING_OPTS = { lip: { u: 0, v: 0 }, rest: 'restSide' as const };
/** The singer facing the other way (−x): the same pose mirrored about the lips. */
const SINGER_LEFT = poseOnTalker(SINGER_SIDE, { id: 'left', lip: { x: 0, y: 0, z: 0 }, facing: -1 });

function Wave3({ width }: { width: number }) {
  const w = Math.min(170, (width - 24 - 3 * 8) / 4);
  const old = (pose: typeof SINGER_SIDE, hands: boolean) => (
    <Group>
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={hands} />
    </Group>
  );
  const sideNew = <PersonSideV2 pose={SINGER_SIDE} who={SINGER} opts={SING_OPTS} />;
  const topNew = <PersonTopV2 pose={SINGER_TOP} who={SINGER} />;
  const plan = personPlan(SINGER_SIDE, SINGER, SING_OPTS);
  const handAt = plan.arms.near.placed!.at({ u: 80, v: 0 });
  const left = personPlan(SINGER_LEFT, SINGER, SING_OPTS);
  const deskPlan = personPlan(talkerPose('side', HOST), castFor('talker.host'), { lip: { u: 0, v: 0 }, rest: 'restFlat', seatV: 0 });
  const deskHand = deskPlan.arms.near.placed!.at({ u: 80, v: 0 });
  const leftHand = left.arms.near.placed!.at({ u: 80, v: 0 });
  return (
    <View>
      <Caption title="KIND A — THE SINGER (E01, E03): OLD BESIDE NEW" note="Side view: at the lesson's size (lite, about 0.13 pt/mm) and enlarged (full). The new figure is the cast member the role table gives the singer: Ana." />
      <PicRow
        w={w}
        pics={[
          { key: 'os', title: 'OLD · lesson size', draw: old(SINGER_SIDE, true), cu: -90, cv: 650, mmW: 700, mmH: 1950 },
          { key: 'ns', title: 'NEW · lesson size', draw: sideNew, cu: -90, cv: 650, mmW: 700, mmH: 1950 },
        ]}
      />
      <View style={{ height: 10 }} />
      <PicRow
        w={Math.min(330, (width - 32) / 2)}
        pics={[
          { key: 'ob', title: 'OLD · enlarged', draw: old(SINGER_SIDE, true), cu: -80, cv: 120, mmW: 560, mmH: 800 },
          { key: 'nb', title: 'NEW · enlarged', draw: sideNew, cu: -80, cv: 120, mmW: 560, mmH: 800 },
        ]}
      />
      <View style={{ height: 14 }} />
      <Caption title="FROM ABOVE: OLD BESIDE NEW" note="The top view of the same singer (the lessons' TOP VIEW), at a lesson's size and enlarged." />
      <PicRow
        w={w}
        pics={[
          { key: 'ot', title: 'OLD · lesson size', draw: old(SINGER_TOP, false), cu: -110, cv: 0, mmW: 700, mmH: 700 },
          { key: 'nt', title: 'NEW · lesson size', draw: topNew, cu: -110, cv: 0, mmW: 700, mmH: 700 },
          { key: 'otb', title: 'OLD · enlarged', draw: old(SINGER_TOP, false), cu: -110, cv: 0, mmW: 560, mmH: 560 },
          { key: 'ntb', title: 'NEW · enlarged', draw: topNew, cu: -110, cv: 0, mmW: 560, mmH: 560 },
        ]}
      />
      <View style={{ height: 14 }} />
      <Caption title="FACING LEFT, AND THE HANDS ALONE" note="The singer facing the other way (her thumb on the side she faces) and her resting hand, beside the same hand facing right. (The desk hand and the mic hand come with the seated talkers and the held-arm lessons.)" />
      <View style={{ height: 14 }} />
      <Caption title="KIND C — THE DESK-SEATED TALKERS (B01): OLD BESIDE NEW" note="Two hosts at the radio desk (host Kofi; co-host Ruth facing him), side and top, at the lesson's size and enlarged; the desk hand alone; the turned heads (side pitched down to read, top turned 40°)." />
      <PicRow
        w={Math.min(330, (width - 32) / 2)}
        pics={[
          { key: 'c1o', title: 'OLD · side · lesson size', draw: <B01Scene view="side" variant="twoHosts" v2={false} />, cu: 700, cv: 400, mmW: 2400, mmH: 1700 },
          { key: 'c1n', title: 'NEW · side · lesson size', draw: <B01Scene view="side" variant="twoHosts" v2 />, cu: 700, cv: 400, mmW: 2400, mmH: 1700 },
        ]}
      />
      <View style={{ height: 10 }} />
      <PicRow
        w={Math.min(330, (width - 32) / 2)}
        pics={[
          { key: 'c2o', title: 'OLD · side · enlarged', draw: <B01Scene view="side" variant="studio" v2={false} />, cu: 0, cv: 330, mmW: 900, mmH: 1100 },
          { key: 'c2n', title: 'NEW · side · enlarged', draw: <B01Scene view="side" variant="studio" v2 />, cu: 0, cv: 330, mmW: 900, mmH: 1100 },
        ]}
      />
      <View style={{ height: 10 }} />
      <PicRow
        w={Math.min(330, (width - 32) / 2)}
        pics={[
          { key: 'c3o', title: 'OLD · top', draw: <B01Scene view="top" variant="twoHosts" v2={false} />, cu: 700, cv: 0, mmW: 2200, mmH: 1500 },
          { key: 'c3n', title: 'NEW · top', draw: <B01Scene view="top" variant="twoHosts" v2 />, cu: 700, cv: 0, mmW: 2200, mmH: 1500 },
        ]}
      />
      <View style={{ height: 10 }} />
      <PicRow
        w={w}
        pics={[
          { key: 'c4', title: 'NEW · top · enlarged', draw: <B01Scene view="top" variant="studio" v2 />, cu: 60, cv: 0, mmW: 900, mmH: 900 },
          { key: 'c5', title: 'Desk hand (side)', draw: <B01Scene view="side" variant="studio" v2 />, cu: deskHand.u, cv: deskHand.v, mmW: 260, mmH: 260 },
          { key: 'c6', title: 'Turned head · side, 20° down', draw: <Group><B01Scene view="side" variant="studio" headless v2 /><TurnedHeadSide pitchDeg={-20} phones v2 /></Group>, cu: -60, cv: 0, mmW: 520, mmH: 520 },
          { key: 'c7', title: 'Turned head · top, 40°', draw: <Group><B01Scene view="top" variant="studio" headless v2 /><TurnedHeadTop yawDeg={40} v2 /></Group>, cu: -60, cv: 0, mmW: 620, mmH: 620 },
        ]}
      />
      <View style={{ height: 14 }} />
      <Caption title="B06 PANELS AND B07 VOICEOVER: OLD BESIDE NEW" note="B06: the panel (side: the focus panelist Kofi; from above: Mei · Kofi · the drummer · Ruth), the lectern (presenter Ana, the press member Ruth at the aisle mic). B07: the booth reader and the desk (reader Kofi, guest Mei)." />
      {([
        ['b6ps', 'B06 panel · side', <B06Scene view="side" variant="panel" v2={false} />, <B06Scene view="side" variant="panel" v2 />, 0, 330, 1000, 1000],
        ['b6pt', 'B06 panel · top', <B06Scene view="top" variant="panel" v2={false} />, <B06Scene view="top" variant="panel" v2 />, 200, 500, 1600, 2000],
        ['b6ls', 'B06 lectern · side', <B06Scene view="side" variant="lectern" v2={false} />, <B06Scene view="side" variant="lectern" v2 />, 700, 650, 2600, 2000],
        ['b6lt', 'B06 lectern · top', <B06Scene view="top" variant="lectern" v2={false} />, <B06Scene view="top" variant="lectern" v2 />, 700, 400, 2600, 2000],
        ['b7bs', 'B07 booth · side', <B07Scene view="side" variant="booth" v2={false} />, <B07Scene view="side" variant="booth" v2 />, 0, 650, 1400, 2000],
        ['b7gs', 'B07 desk with guest · side', <B07Scene view="side" variant="guest" v2={false} />, <B07Scene view="side" variant="guest" v2 />, 750, 400, 2400, 1700],
      ] as const).map(([k, t, o, n, cu, cv, mmW, mmH]) => (
        <View key={k} style={{ marginBottom: 8 }}>
          <PicRow w={Math.min(330, (width - 32) / 2)} pics={[{ key: `${k}o`, title: `OLD · ${t}`, draw: o, cu, cv, mmW, mmH }, { key: `${k}n`, title: `NEW · ${t}`, draw: n, cu, cv, mmW, mmH }]} />
        </View>
      ))}
      <View style={{ height: 14 }} />
      <Caption title="B02 NEWS DESK: OLD BESIDE NEW" note="The anchor Kofi in his jacket (the dress variant), the guest Mei; the side close-up, from above (two-shot) and the side at the lesson's size. The lav's clip is drawn on the shirt in the V; the capsule, where every distance is read, has not moved." />
      <PicRow
        w={Math.min(330, (width - 32) / 2)}
        pics={[
          { key: 'b2so', title: 'OLD · B02 · side', draw: <B02Scene view="side" variant="close" camera={false} v2={false} />, cu: 60, cv: 330, mmW: 900, mmH: 1100 },
          { key: 'b2sn', title: 'NEW · B02 · side', draw: <B02Scene view="side" variant="close" camera={false} v2 />, cu: 60, cv: 330, mmW: 900, mmH: 1100 },
        ]}
      />
      <View style={{ height: 8 }} />
      <PicRow
        w={w}
        pics={[
          { key: 'b2to', title: 'OLD · top · two-shot', draw: <B02Scene view="top" variant="twoShot" camera={false} v2={false} />, cu: 150, cv: 350, mmW: 1500, mmH: 1700 },
          { key: 'b2tn', title: 'NEW · top · two-shot', draw: <B02Scene view="top" variant="twoShot" camera={false} v2 />, cu: 150, cv: 350, mmW: 1500, mmH: 1700 },
          { key: 'b2lo', title: 'OLD · side · lesson size', draw: <B02Scene view="side" variant="close" v2={false} />, cu: 1150, cv: 130, mmW: 3700, mmH: 2300 },
          { key: 'b2ln', title: 'NEW · side · lesson size', draw: <B02Scene view="side" variant="close" v2 />, cu: 1150, cv: 130, mmW: 3700, mmH: 2300 },
        ]}
      />
      <View style={{ height: 14 }} />
      <PicRow
        w={w}
        pics={[
          { key: 'lf', title: 'Facing left', draw: <PersonSideV2 pose={SINGER_LEFT} who={SINGER} opts={SING_OPTS} />, cu: 90, cv: 650, mmW: 700, mmH: 1950 },
          { key: 'lh', title: 'Facing left · her hand', draw: <PersonSideV2 pose={SINGER_LEFT} who={SINGER} opts={SING_OPTS} />, cu: leftHand.u, cv: leftHand.v, mmW: 200, mmH: 560 },
          { key: 'rh', title: 'Facing right · her hand', draw: sideNew, cu: handAt.u, cv: handAt.v, mmW: 200, mmH: 560 },
        ]}
      />
    </View>
  );
}


/* ── THE DESK HAND (dev page `deskhand`): side and from above, five skin tones ── */

const DESK_SIDE = { lip: { u: 0, v: 0 }, rest: 'restFlat' as const, seatV: 0 };
function DeskHands({ width }: { width: number }) {
  const ids: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
  const side = talkerPose('side', HOST);
  const top = talkerPose('top', HOST);
  const sideAt = (id: CastId) => personPlan(side, CAST[id], DESK_SIDE).arms.near.placed!.at({ u: 80, v: 0 });
  const topAt = (id: CastId) => personTopPlan(top, CAST[id], { desk: true }).arms.near.placed!.at({ u: 95, v: 12 });
  const desk = (
    <Group>
      <Rect x={-2000} y={DESK_TOP_Y} width={4000} height={30} color="#6b4f3a" />
      <Rect x={-2000} y={DESK_TOP_Y} width={4000} height={3} color="#8f6e55" />
    </Group>
  );
  const deskTop = <Rect x={-2000} y={-2000} width={4000} height={4000} color="#5a4231" />;
  const small = Math.min(150, (width - 56) / 5);
  const big = Math.min(380, (width - 32) / 2);
  // (≈ 3 pt/mm in the large row: a crop 120 mm wide)
  return (
    <View>
      <Caption title="THE DESK HAND — SIDE (dev)" note="Each cast member's near hand resting palm-down on the desk, seen from the side, about 3 pt/mm; then two of them larger." />
      <PicRow w={small} pics={ids.map((id) => ({ key: `s${id}`, title: CAST[id].name, draw: <Group>{desk}<PersonSideV2 pose={side} who={CAST[id]} opts={DESK_SIDE} /></Group>, cu: sideAt(id).u, cv: sideAt(id).v, mmW: 230, mmH: 160 }))} />
      <View style={{ height: 8 }} />
      <PicRow w={big} pics={(['kofi', 'ruth'] as CastId[]).map((id) => ({ key: `S${id}`, title: CAST[id].name, draw: <Group>{desk}<PersonSideV2 pose={side} who={CAST[id]} opts={DESK_SIDE} /></Group>, cu: sideAt(id).u - 30, cv: sideAt(id).v - 10, mmW: 300, mmH: 150 }))} />
      <View style={{ height: 14 }} />
      <Caption title="THE DESK HAND — FROM ABOVE (dev)" note="The same hands from above (the back of the hand, the thumb toward the body's midline), about 3 pt/mm." />
      <PicRow w={small} pics={ids.map((id) => ({ key: `t${id}`, title: CAST[id].name, draw: <Group>{deskTop}<PersonTopV2 pose={top} who={CAST[id]} opts={{ desk: true }} /></Group>, cu: topAt(id).u, cv: topAt(id).v, mmW: 230, mmH: 230 }))} />
      <View style={{ height: 8 }} />
      <PicRow w={big} pics={(['kofi', 'ruth'] as CastId[]).map((id) => ({ key: `T${id}`, title: CAST[id].name, draw: <Group>{deskTop}<PersonTopV2 pose={top} who={CAST[id]} opts={{ desk: true }} /></Group>, cu: topAt(id).u - 40, cv: topAt(id).v, mmW: 300, mmH: 220 }))} />
    </View>
  );
}

/* ── THE JACKET (dev page `jacket`): the dress variant, alone — Kofi as the news anchor, Ruth standing ── */

const KOFI = CAST.kofi;
const RUTH = CAST.ruth;
const ANCHOR_OPTS = { lip: { u: 0, v: 0 }, rest: 'restFlat' as const, seatV: SEAT_Y, jacket: true };
const STAND_OPTS = { lip: { u: 0, v: 0 }, rest: 'restSide' as const, jacket: true };
const STAND_LEFT = poseOnTalker(SINGER_SIDE, { id: 'left', lip: { x: 0, y: 0, z: 0 }, facing: -1 });

/** The lesson's clip point drawn ON the cloth (its height kept; the drawing only). */
function onCloth(pose: typeof SINGER_SIDE, who: typeof KOFI, opts: typeof ANCHOR_OPTS | typeof STAND_OPTS, mount: 'sternum' | 'lapel', standing: boolean) {
  const g = BODY_MOUNTS[mount].grip;
  const plan = personPlan(pose, who, opts);
  const J = opts.jacket ? jacketSidePlan(plan, who.body, standing) : null;
  const p = clipOnCloth(plan, J, g, mount === 'lapel' ? 'lapel' : 'shirt');
  return { x: p.u, y: p.v, z: g.z };
}

function AnchorSide({ who = KOFI, jacket = true, clip = true }: { who?: typeof KOFI; jacket?: boolean; clip?: boolean }) {
  return (
    <Group>
      <StudioChair view="side" t={ANCHOR} />
      <Desk view="side" box={B02_DESK} floor={SEATED_FLOOR} skirt />
      <PersonSideV2 pose={talkerPose('side', ANCHOR)} who={who} opts={{ ...ANCHOR_OPTS, jacket }} />
      <DeskNearLegs box={B02_DESK} floor={SEATED_FLOOR} skirt />
      {clip ? <LavClip view="side" grip={onCloth(talkerPose('side', ANCHOR), who, { ...ANCHOR_OPTS, jacket }, 'sternum', false)} /> : null}
    </Group>
  );
}
function AnchorTop() {
  const pose = talkerPose('top', ANCHOR);
  return (
    <Group>
      <StudioChair view="top" t={ANCHOR} />
      <PersonTopV2 pose={pose} who={KOFI} opts={{ desk: true, jacket: true }} part="lower" />
      <Desk view="top" box={B02_DESK} floor={SEATED_FLOOR} skirt />
      <PersonTopV2 pose={pose} who={KOFI} opts={{ desk: true, jacket: true }} part="upper" />
      <LavClip view="top" grip={BODY_MOUNTS.sternum.grip} />
    </Group>
  );
}
const StandSide = ({ who, clip }: { who: typeof KOFI; clip?: 'sternum' | 'lapel' }) => (
  <Group>
    <PersonSideV2 pose={SINGER_SIDE} who={who} opts={STAND_OPTS} />
    {clip ? <LavClip view="side" grip={onCloth(SINGER_SIDE, who, STAND_OPTS, clip, true)} /> : null}
  </Group>
);
const StandTop = ({ who }: { who: typeof KOFI }) => <PersonTopV2 pose={SINGER_TOP} who={who} opts={{ jacket: true }} />;

type CloseItem = readonly [string, string, ReactNode, number, number, number, number];
const CLOSE_ROW: CloseItem[] = [];

function Jacket({ width }: { width: number }) {
  const two = Math.min(330, (width - 32) / 2);
  const three = Math.min(220, (width - 40) / 3);
  const four = Math.min(170, (width - 24 - 3 * 8) / 4);
  const plan = personPlan(talkerPose('side', ANCHOR), KOFI, ANCHOR_OPTS);
  const cuffAt = plan.arms.near.placed!.at({ u: -30, v: 0 });
  const sp = personPlan(SINGER_SIDE, KOFI, STAND_OPTS);
  const sCuff = sp.arms.near.placed!.at({ u: -30, v: 0 });
  return (
    <View>
      <Caption title="THE JACKET (dev): KOFI AS THE NEWS ANCHOR" note="The old B02 anchor beside the new: Kofi seated at the anchor desk in his jacket (navy), the lav clip on B02's own point over the breastbone (on the shirt, in the jacket's V)." />
      <PicRow
        w={two}
        pics={[
          { key: 'old', title: 'OLD · B02 anchor · side', draw: <B02Scene view="side" variant="close" camera={false} v2={false} />, cu: 60, cv: 330, mmW: 900, mmH: 1100 },
          { key: 'new', title: 'NEW · seated at the desk · side', draw: <AnchorSide />, cu: 60, cv: 330, mmW: 900, mmH: 1100 },
        ]}
      />
      <View style={{ height: 10 }} />
      <Caption title="FULL DETAIL" note="Standing from the side (the hands at rest), seated from above (the forearms on the desk), standing from above." />
      <PicRow
        w={three}
        pics={[
          { key: 'fs', title: 'Standing · side', draw: <StandSide who={KOFI} />, cu: -90, cv: 420, mmW: 640, mmH: 1300 },
          { key: 'ft', title: 'Seated · from above', draw: <AnchorTop />, cu: 20, cv: 0, mmW: 760, mmH: 760 },
          { key: 'fst', title: 'Standing · from above', draw: <StandTop who={KOFI} />, cu: -110, cv: 0, mmW: 620, mmH: 620 },
        ]}
      />
      <View style={{ height: 10 }} />
      <Caption title="AT LESSON SIZE (lite, about 0.1 pt/mm)" note="The same four pictures as a 390 pt phone draws them." />
      <PicRow
        w={four}
        pics={[
          { key: 'ls', title: 'Seated · side', draw: <AnchorSide />, cu: 200, cv: 300, mmW: 1700, mmH: 1700 },
          { key: 'lst', title: 'Standing · side', draw: <StandSide who={KOFI} />, cu: -90, cv: 650, mmW: 1700, mmH: 2000 },
          { key: 'lt', title: 'Seated · above', draw: <AnchorTop />, cu: 200, cv: 0, mmW: 1700, mmH: 1700 },
          { key: 'ltt', title: 'Standing · above', draw: <StandTop who={KOFI} />, cu: -110, cv: 0, mmW: 1700, mmH: 1700 },
        ]}
      />
      <View style={{ height: 14 }} />
      <Caption title="THE SAME JACKET ON RUTH (the presenter of B04 / B05)" note="The same cut, no shaping, in her own tone (mocha); the lav clip on the lapel point B05 uses. Beside her, Kofi standing with the same clip; then both at lesson size, and Kofi facing left (his left side: the breast pocket)." />
      <PicRow
        w={three}
        pics={[
          { key: 'rs', title: 'Ruth · standing · side', draw: <StandSide who={RUTH} clip="lapel" />, cu: -90, cv: 420, mmW: 640, mmH: 1300 },
          { key: 'ks', title: 'Kofi · standing · side', draw: <StandSide who={KOFI} clip="lapel" />, cu: -90, cv: 420, mmW: 640, mmH: 1300 },
          { key: 'rt', title: 'Ruth · from above', draw: <StandTop who={RUTH} />, cu: -110, cv: 0, mmW: 620, mmH: 620 },
        ]}
      />
      <View style={{ height: 6 }} />
      <PicRow
        w={four}
        pics={[
          { key: 'rl', title: 'Ruth · lesson size', draw: <StandSide who={RUTH} />, cu: -90, cv: 650, mmW: 1700, mmH: 2000 },
          { key: 'kl', title: 'Kofi · lesson size', draw: <StandSide who={KOFI} />, cu: -90, cv: 650, mmW: 1700, mmH: 2000 },
          { key: 'kfl', title: 'Facing left (breast pocket)', draw: <PersonSideV2 pose={STAND_LEFT} who={KOFI} opts={STAND_OPTS} />, cu: 110, cv: 380, mmW: 640, mmH: 900 },
        ]}
      />
      <View style={{ height: 14 }} />
      <Caption title="CLOSE (about 3 times the enlarged size)" note="The collar, the lapel and the shirt in the V with the clip; the sleeve's end and the shirt's cuff; the seated waist and the skirt over the chair; the standing sleeve's end." />
      {(
        [
          ['c0', 'Seated · the upper back and the collar (Kofi)', <AnchorSide />, -190, 200, 420, 420],
          ['c0p', 'Seated · the same body without the jacket (B01, approved)', <AnchorSide jacket={false} clip={false} />, -190, 200, 420, 420],
          ['c0r', 'Seated · the upper back (Ruth)', <AnchorSide who={RUTH} />, -190, 200, 420, 420],
          ['c0m', 'Seated · the upper back (Mei)', <AnchorSide who={CAST.mei} />, -190, 200, 420, 420],
          ['c0s', 'Seated · the back skirt on the chair', <AnchorSide />, -230, 640, 260, 260],
          ['c1', 'Seated · collar and lapel, the clip on the shirt in the V', <AnchorSide />, -60, 200, 300, 300],
          ['c2', 'Seated · the sleeve end and the shirt cuff', <AnchorSide />, cuffAt.u, cuffAt.v, 200, 160],
          ['c3', 'Seated · waist, lap and chair', <AnchorSide clip={false} />, -60, 620, 520, 420],
          ['c4', 'Standing · the sleeve end and the shirt cuff', <StandSide who={KOFI} />, sCuff.u, sCuff.v, 200, 200],
          ['c5', 'Standing · back and hem', <StandSide who={KOFI} />, -150, 620, 420, 420],
          ['c6', 'Ruth · collar and lapel, the lapel clip', <StandSide who={RUTH} clip="lapel" />, -60, 200, 300, 300],
          ['c7', 'Seated · from above: the shoulders, the lapels and the V', <AnchorTop />, -60, 0, 460, 460],
          ['c8', 'Standing · from above, close', <StandTop who={KOFI} />, -100, 0, 460, 460],
        ] as const
      )
        // (two to a canvas: a browser allows only so many canvases on one page)
        .reduce<(typeof CLOSE_ROW)[]>((rows, x, i) => (i % 2 ? rows[rows.length - 1].push(x) : rows.push([x]), rows), [])
        .map((row) => (
          <View key={row[0][0]} style={{ marginBottom: 6 }}>
            <PicRow w={Math.min((width - 32) / 2, 380)} pics={row.map(([k, t, d, cu, cv, mmW, mmH]) => ({ key: k, title: t, draw: d, cu, cv, mmW, mmH }))} />
          </View>
        ))}
    </View>
  );
}

/* ── THE HAND ROUND A HAND-HELD MIC (dev pages `michand` side, `michandtop` from above) ── */

const TONES: CastId[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];

function MicHands({ width, view }: { width: number; view: 'side' | 'top' }) {
  const small = Math.min(150, (width - 56) / 5);
  const big = Math.min(380, (width - 32) / 2);
  const lesson = Math.min(120, (width - 24 - 5 * 8) / 6);
  const fistAt = (id: HeldCaseId) => {
    const g = heldGeo(id);
    return view === 'side' ? { u: g.fist.x, v: g.fist.y } : { u: g.fist.x, v: g.fist.z };
  };
  const tone = (who: CastId, id: HeldCaseId) => (
    <FigureLook look={CAST[who].look}>
      <HeldStudy id={id} view={view} />
    </FigureLook>
  );
  return (
    <View>
      <Caption
        title={view === 'side' ? 'THE HELD MIC — SIDE VIEW (dev)' : 'THE HELD MIC — FROM ABOVE (dev)'}
        note="Each lesson's held mic at its starting place, the arm as the engine solves it, the side of the hand read from the arm's real rotation. Five skin tones at about 1 pt/mm, then each drawing at about 3 pt/mm, then the lesson size."
      />
      {HELD_CASES.map((id) => {
        const s = heldViewOf(id, view);
        const d = heldViewOf(id, view, true);
        const n = heldArmNumbers(id);
        const c = fistAt(id);
        return (
          <View key={id} style={{ marginBottom: 8 }}>
            <Text style={{ color: INK, fontSize: 11, marginBottom: 2 }}>
              {heldGeo(id).title} — {s.words} (back {s.sides.back.toFixed(2)} · forearm {s.sides.forearm.toFixed(2)} · thumb {s.sides.thumb.toFixed(2)})
            </Text>
            {n.corrected ? (
              <Text style={{ color: DIM, fontSize: 10, marginBottom: 2 }}>
                Drawn: {d.words} (back {d.sides.back.toFixed(2)} · forearm {d.sides.forearm.toFixed(2)} · thumb {d.sides.thumb.toFixed(2)}) · forearm to handle {n.engine.angle.toFixed(0)}° → {n.drawn.angle.toFixed(0)}° · fist moved {n.fistMoved.toFixed(0)} mm along the handle
              </Text>
            ) : null}
            <PicRow w={small} pics={TONES.map((t) => ({ key: `${id}${t}`, title: CAST[t].name, draw: tone(t, id), cu: c.u, cv: c.v, mmW: 170, mmH: 210 }))} />
          </View>
        );
      })}
      <View style={{ height: 10 }} />
      <Caption title="B03 OMNI AT THE GUEST'S MOUTH — THE ARM, OLD AND NEW" note="Gray: the engine's arm (the forearm runs along the handle). Gold: the best elbow from where the reporter stands (same shoulder, same fist, upper arm 300 mm, forearm 290 mm, the elbow no higher than the shoulder); the arm is near full reach, so the forearm cannot meet the handle at 60–90° from here. Teal: the same arm with the reporter a short step nearer the guest (needs the owner's word: it moves the reporter). The mic and every measured point unchanged." />
      {(() => {
        const n = heldArmNumbers('b3.handoffOmni');
        const g = heldGeo('b3.handoffOmni');
        const a = view === 'side' ? { u: (g.shoulder.x + g.front.x) / 2, v: (g.shoulder.y + g.front.y) / 2 } : { u: (g.shoulder.x + g.front.x) / 2, v: (g.shoulder.z + g.front.z) / 2 };
        const f3 = (q: { x: number; y: number; z: number }) => `(${q.x.toFixed(0)}, ${q.y.toFixed(0)}, ${q.z.toFixed(0)})`;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: INK, fontSize: 11, marginBottom: 2 }}>
              Old elbow {f3(n.engine.elbow)}, forearm to handle {n.engine.angle.toFixed(0)}° · new elbow {f3(n.drawn.elbow)}, forearm to handle {n.drawn.angle.toFixed(0)}° · upper arm {n.drawn.upper.toFixed(0)} mm, forearm {n.drawn.fore.toFixed(0)} mm
            </Text>
            <Text style={{ color: DIM, fontSize: 10, marginBottom: 2 }}>
              Stepped in {STEP_IN} mm: elbow {f3(steppedIn('b3.handoffOmni').elbow)}, forearm to handle {steppedIn('b3.handoffOmni').angle.toFixed(0)}°
            </Text>
            <PicRow
              w={big}
              pics={(['ana', 'kofi'] as CastId[]).map((t) => ({
                key: `arm${t}`,
                title: CAST[t].name,
                draw: (
                  <FigureLook look={CAST[t].look}>
                    <HeldStudy id="b3.handoffOmni" view={view} arms />
                  </FigureLook>
                ),
                cu: a.u,
                cv: a.v,
                mmW: 700,
                mmH: 700,
              }))}
            />
          </View>
        );
      })()}
      <View style={{ height: 10 }} />
      <Caption title="EACH CASE AT ABOUT 3 PT/MM, ALL FIVE TONES" note="The one 3-D grip, projected: the handle in the palm, the fingers round its far edge, the thumb round its near edge the other way." />
      {HELD_CASES.map((id) => {
        const c = fistAt(id);
        return (
          <View key={`3x${id}`} style={{ marginBottom: 10 }}>
            <Text style={{ color: INK, fontSize: 11, marginBottom: 2 }}>
              {heldGeo(id).title} — {heldViewOf(id, view, true).words}
            </Text>
            <PicGrid w={big} cols={2} pics={TONES.map((t) => ({ key: `3${id}${t}`, title: CAST[t].name, draw: tone(t, id), cu: c.u, cv: c.v, mmW: 125, mmH: 125 }))} />
          </View>
        );
      })}
      <View style={{ height: 10 }} />
      <Caption title="AT LESSON SIZE (about 0.1 pt/mm)" />
      <PicRow
        w={lesson}
        pics={HELD_CASES.map((id) => {
          const g = heldGeo(id);
          const a = view === 'side' ? { u: (g.shoulder.x + g.front.x) / 2, v: (g.shoulder.y + g.front.y) / 2 } : { u: (g.shoulder.x + g.front.x) / 2, v: (g.shoulder.z + g.front.z) / 2 };
          return { key: `L${id}`, title: id, draw: tone('ana', id), cu: a.u, cv: a.v, mmW: 1200, mmH: 1200 };
        })}
      />
    </View>
  );
}

/* ── THE ARM THAT CARRIES THE MIC HAND (dev page `heldarm`, step B) ── */

const KS = [0, 0.5, 1] as const;
const KW = ['start', 'middle', 'end'] as const;

function armWords(f: ArmFrame) {
  const s = f.sol;
  return `forearm to handle ${s.angle.toFixed(0)}° · wrist ${s.wristTurn < 0.5 ? 'straight' : `turned ${s.wristTurn.toFixed(0)}°`} · elbow ${s.elbowRise > 0 ? `${s.elbowRise.toFixed(0)} mm above` : `${(-s.elbowRise).toFixed(0)} mm below`} the shoulder${s.far ? ' · OUT OF REACH' : ''}`;
}

function ArmRows({ id, width, o = {}, ks = KS, only = false }: { id: ArmCaseId; width: number; o?: ArmOpt; ks?: readonly number[]; /** the whole pictures only (the page keeps under the canvas limit) */ only?: boolean }) {
  const big = Math.min(380, (width - 32) / 2);
  const lesson = Math.min(120, (width - 24 - 5 * 8) / 6);
  const frames = ks.map((k) => armFrame(id, k, o));
  const word = (k: number) => KW[KS.indexOf(k as never)] ?? `${k}`;
  return (
    <View style={{ marginBottom: 12 }}>
      {frames.map((f) => (
        <Text key={`w${f.k}`} style={{ color: DIM, fontSize: 10 }}>
          {word(f.k)}: {armWords(f)}
        </Text>
      ))}
      <PicGrid
        w={big}
        cols={2}
        pics={frames.flatMap((f) =>
          (['side', 'top'] as const).map((view) => {
            const c = armCentre(f, view, 'whole');
            return { key: `${id}${f.k}${view}`, title: `${word(f.k)} · ${view === 'side' ? 'side' : 'from above'}`, draw: <ArmScene f={f} view={view} />, cu: c.u, cv: c.v, mmW: 1100, mmH: 1100 };
          }),
        )}
      />
      {only ? null : <Text style={{ color: DIM, fontSize: 10, marginTop: 6 }}>The joins, closer (hand to wrist, wrist to cuff, cuff to sleeve):</Text>}
      {only ? null : (
      <PicGrid
        w={big}
        cols={2}
        pics={frames.flatMap((f) =>
          (['side', 'top'] as const).map((view) => {
            const c = armCentre(f, view, 'wrist');
            return { key: `j${id}${f.k}${view}`, title: `${word(f.k)} · ${view === 'side' ? 'side' : 'from above'}`, draw: <ArmScene f={f} view={view} />, cu: c.u, cv: c.v, mmW: 320, mmH: 320 };
          }),
        )}
      />
      )}
      {only ? null : <Text style={{ color: DIM, fontSize: 10, marginTop: 6 }}>At lesson size (about 0.1 pt/mm):</Text>}
      {only ? null : (
      <PicGrid
        w={lesson}
        cols={6}
        pics={frames.flatMap((f) =>
          (['side', 'top'] as const).map((view) => {
            const c = armCentre(f, view, 'whole');
            return { key: `l${id}${f.k}${view}`, title: `${word(f.k)} ${view === 'side' ? 'side' : 'above'}`, draw: <ArmScene f={f} view={view} />, cu: c.u, cv: c.v, mmW: 1400, mmH: 1400 };
          }),
        )}
      />
      )}
    </View>
  );
}

function HeldArms({ width }: { width: number }) {
  return (
    <View>
      <Caption title="THE ARM THAT CARRIES THE MIC HAND (dev, step B)" note="The whole person with the held arm at the start, the middle and the end of each move, side and from above; then the joins closer; then lesson size. The mic, its capsule and every measured point are the lesson's own. No lesson draws this yet." />
      {ARM_CASES.map((id) => (
        <View key={id}>
          <Text style={{ color: INK, fontSize: 12, fontWeight: '700', marginTop: 8 }}>{armCaseTitle(id)}</Text>
          <ArmRows id={id} width={width} />
        </View>
      ))}
      <Caption title="OPEN DECISION (a): B03, THE OMNI AT THE GUEST'S MOUTH" note={`Left: the reporter where they stand (the arm level at shoulder height). Right: the reporter about ${STEP_IN_MM / 10} cm nearer the guest (moves the reporter). The mic and every measured point unchanged.`} />
      <Text style={{ color: INK, fontSize: 11 }}>As they stand:</Text>
      <ArmRows only id="b3" width={width} ks={[1]} />
      <Text style={{ color: INK, fontSize: 11 }}>{`${STEP_IN_MM / 10} cm nearer the guest:`}</Text>
      <ArmRows only id="b3" width={width} ks={[1]} o={{ stepIn: true }} />
      <Caption title="OPEN DECISION (b): B10, THE FLAG MIC'S HANDLE" note="Top: drawn about 5 cm longer at the tail, the hand on the free handle below the flag. Below: as it is today, the hand where the engine puts it (it reaches into the flag). The capsule, the flag and every printed number are the same." />
      <Text style={{ color: INK, fontSize: 11 }}>Longer at the tail:</Text>
      <ArmRows only id="b10" width={width} ks={[0, 1]} />
      <Text style={{ color: INK, fontSize: 11 }}>As today:</Text>
      <ArmRows only id="b10" width={width} ks={[0, 1]} o={{ flagToday: true }} />
    </View>
  );
}

export function FigureStudy() {
  const route = useRoute();
  const only = String((route.params as { id?: string } | undefined)?.id ?? '');
  const show = (k: string) => !only || only === k;
  const { width } = useWindowDimensions();
  const pane = Math.min(330, width - 24);
  const big = Math.min(width - 24, 640);
  // (the pole hand, 2026-11-24: its own page, nothing else on it)
  if (only === 'polehand') return <PoleHandStudy />;
  if (only === 'polehandback') return <PoleHandBackStudy />;
  if (only === 'polehandtop') return <PoleHandTopStudy />;
  if (only === 'polehandend') return <PoleHandEndStudy />;
  if (only === 'mallethand') return <MalletHandStudy />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Figure study — the kit drummer</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 18 }}>Drum Overheads · Meet it · side view, from the player’s right. The new look is shown here only; the app still draws the current figure.</Text>
      {show('compare') ? (
        <Section>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <View>
              <Caption title="CURRENT" />
              <Crop cu={-560} cv={-430} mmW={1080} mmH={1500} w={pane} v2={false} />
            </View>
            <View>
              <Caption title="NEW" />
              <Crop cu={-560} cv={-430} mmW={1080} mmH={1500} w={pane} v2 />
            </View>
          </View>
        </Section>
      ) : null}
      {show('lesson') ? (
        <Section>
          <Caption title="NEW — AT THE LESSON’S PHONE SIZE" note="The whole M09 side view as a 390 pt phone shows it (no labels or mics)." />
          <LessonSize />
        </Section>
      ) : null}
      {show('head') ? (
        <Section>
          <Caption title="NEW — HEAD AND NECK" note="Enlarged about 4× the phone size." />
          <Crop cu={-770} cv={-955} mmW={360} mmH={380} w={big} v2 />
        </Section>
      ) : null}
      {show('hands') ? (
        <Section>
          <Caption
            title="NEW — THE HANDS ON THE STICKS"
            note="The right hand (near) on the hi-hat stick, the left (far) on the snare stick. The floor tom, rack tom, near crash and ride are left out here so the hands show."
          />
          <Crop cu={-560} cv={-560} mmW={420} mmH={330} w={big} v2 isolate />
        </Section>
      ) : null}
      {show('alone') ? (
        <Section>
          <Caption title="NEW — EACH HAND ALONE" note="Each arm with its hand and stick exactly as in the lesson, seen from the player’s right, on a plain ground. The right forearm runs almost directly away from the viewer, so its fist is drawn near true size (larger than strict perspective, for reading) coming out of the sleeve’s mouth; the left hand is seen from the palm side, thumb on top." />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <View>
              <Caption title="RIGHT HAND (NEAR)" />
              <HandAlone which="near" w={only === 'alone' ? Math.min(width - 24, 600) : Math.min(330, width - 24)} />
            </View>
            <View>
              <Caption title="LEFT HAND (FAR)" />
              <HandAlone which="far" w={only === 'alone' ? Math.min(width - 24, 600) : Math.min(330, width - 24)} />
            </View>
          </View>
        </Section>
      ) : null}
      {only === 'lod' ? (
        <Section>
          <Caption title="LEVEL OF DETAIL (dev)" note="Each row: FULL (left) and LITE (right) at the same size — the inset 97 × 85, the phone picture 349 × 290, and a full-screen glass 780 × 360. Side view, then from above." />
          {[
            [97, 85],
            [349, 290],
            [780, 360],
          ].map(([W, H]) => (
            <View key={`s${W}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <SideLessonSize W={W} H={H} level="full" />
              <SideLessonSize W={W} H={H} level="lite" />
            </View>
          ))}
          {[
            [97, 85],
            [349, 290],
            [780, 360],
          ].map(([W, H]) => (
            <View key={`t${W}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <TopLessonSize W={W} H={H} v2 level="full" />
              <TopLessonSize W={W} H={H} v2 level="lite" />
            </View>
          ))}
        </Section>
      ) : null}
      {only === 'hairbug' ? (
        <Section>
          <Caption title="HAIR BISECT (dev)" note="The side head's hair path alone at 0.05, 0.1, 0.2, 0.4, 1 pt/mm: A gradient + 1.1 mm blur, B gradient only, C solid + blur, on skin." />
          {[0.05, 0.1, 0.2, 0.4, 1].map((k) => (
            <View key={k} style={{ marginBottom: 8 }}>
              <Text style={{ color: DIM, fontSize: 11 }}>{k} pt/mm</Text>
              <HairBisect s={k} />
            </View>
          ))}
        </Section>
      ) : null}
      {only === 'close' ? (
        <Section>
          <Caption title="CLOSE-UPS (dev)" note="Each hand and each cuff about 2× and 3× the hand-alone size, for checking forms one by one." />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <HandAlone which="near" w={Math.min(width - 24, 600)} mm={120} on="hand" />
            <HandAlone which="far" w={Math.min(width - 24, 600)} mm={130} on="hand" />
            <HandAlone which="near" w={Math.min(width - 24, 600)} mm={80} on="cuff" />
            <HandAlone which="far" w={Math.min(width - 24, 600)} mm={80} on="cuff" />
            <Crop cu={-880} cv={-690} mmW={300} mmH={300} w={Math.min(width - 24, 600)} v2 />
          </View>
        </Section>
      ) : null}
      {show('top') ? (
        <Section>
          <Caption title="FROM ABOVE — CURRENT AND NEW" note="The same drummer seen from above (the lessons' TOP VIEW): the new look is a new drawing of the approved figure." />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <View>
              <Caption title="CURRENT" />
              <TopCrop cu={-640} cv={-150} mmW={1100} mmH={1100} w={pane} v2={false} />
            </View>
            <View>
              <Caption title="NEW" />
              <TopCrop cu={-640} cv={-150} mmW={1100} mmH={1100} w={pane} v2 />
            </View>
          </View>
        </Section>
      ) : null}
      {show('topclose') ? (
        <Section>
          <Caption title="NEW FROM ABOVE — CLOSE" note="The head, shoulders, arms and hands from above, enlarged." />
          <TopCrop cu={-650} cv={-180} mmW={1000} mmH={1000} w={big} v2 />
          <TopCrop cu={-640} cv={-480} mmW={240} mmH={240} w={big} v2 />
          <TopCrop cu={-480} cv={-190} mmW={240} mmH={240} w={big} v2 />
        </Section>
      ) : null}
      {show('topsizes') ? (
        <Section>
          <Caption title="FROM ABOVE AT THE LESSON'S SIZES" note="The inset (about 97 × 85 pt) and the top view as the main picture on a 390 pt phone; CURRENT above, NEW below." />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
            <TopLessonSize W={97} H={85} v2={false} />
            <TopLessonSize W={349} H={290} v2={false} />
          </View>
          <View style={{ height: 10 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
            <TopLessonSize W={97} H={85} v2 />
            <TopLessonSize W={349} H={290} v2 />
          </View>
        </Section>
      ) : null}
      {only === 'cast' || only === 'castclose' || only === 'castbody' || only === 'castzoom' || only === 'casthand' ? (
        <Section>
          <CastLineup width={width} only={only} />
        </Section>
      ) : null}
      {only === 'wave3' ? (
        <Section>
          <Wave3 width={width} />
        </Section>
      ) : null}
      {only === 'heldarm' ? (
        <Section>
          <HeldArms width={width} />
        </Section>
      ) : null}
      {only === 'michand' || only === 'michandtop' ? (
        <Section>
          <MicHands width={width} view={only === 'michand' ? 'side' : 'top'} />
        </Section>
      ) : null}
      {only === 'jacket' ? (
        <Section>
          <Jacket width={width} />
        </Section>
      ) : null}
      {only.startsWith('elsewhere') ? (
        <Section>
          <ElsewhereStudy width={width} part={only.slice(10)} />
        </Section>
      ) : null}
      {only === 'deskhand' ? (
        <Section>
          <DeskHands width={width} />
        </Section>
      ) : null}
      {only.startsWith('families') ? (
        <Section>
          <FamiliesStudy width={width} only={only.split('-')[1]} dbg={only.split('-')[2] === 'dbg'} />
        </Section>
      ) : null}
      {only.startsWith('players3d') ? (
        <Section>
          <Players3dStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('players') && !only.startsWith('playersGuitar') && !only.startsWith('players3d') && !only.startsWith('playersMallet') ? (
        <Section>
          <PlayersStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('playersMallet') ? (
        <Section>
          <PlayersMalletStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('playersGuitar') ? (
        <Section>
          <PlayersGuitarStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('operators') ? (
        <Section>
          <OperatorsStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('heldlessons') ? (
        <Section>
          <HeldLessonsStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('foley3') ? (
        <Section>
          <Foley3Study width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('front') || only.startsWith('boom') ? (
        <Section>
          <FrontStudy width={width} only={only} />
        </Section>
      ) : null}
      {only.startsWith('ensembles2') ? (
        <Section>
          <Ensembles2Study width={width} part={only.slice(11)} />
        </Section>
      ) : null}
      {only.startsWith('metal') ? (
        <Section>
          <MetalStudy width={width} only={only} />
        </Section>
      ) : null}
      {show('foot') ? (
        <Section>
          <Caption title="NEW — THE FOOT ON THE KICK PEDAL" note="The near drums are left out here so the leg and foot show." />
          <Crop cu={-290} cv={150} mmW={560} mmH={420} w={big} v2 isolate />
        </Section>
      ) : null}
    </ScrollView>
  );
}
