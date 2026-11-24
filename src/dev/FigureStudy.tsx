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

export function FigureStudy() {
  const route = useRoute();
  const only = String((route.params as { id?: string } | undefined)?.id ?? '');
  const show = (k: string) => !only || only === k;
  const { width } = useWindowDimensions();
  const pane = Math.min(330, width - 24);
  const big = Math.min(width - 24, 640);
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
      {only === 'deskhand' ? (
        <Section>
          <DeskHands width={width} />
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
