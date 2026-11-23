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
 * head, hands, alone, foot).
 * The new look is forced on for these pictures only (KitSide `figureV2`);
 * the app keeps FIGURE_V2_READY = false [MD:D78]. Nothing here ships to a phone: the
 * harness module is required only in the web dev branch of App.tsx.
 */
import type { ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Canvas, Group, Rect, Skia } from '@shopify/react-native-skia';
import { KitSide, Sticks, kitSceneSticks } from '../screens/lab/miking/lessons/shared/kitScene/KitSceneArt';
import { FigureV2HandAlone } from '../screens/lab/miking/lessons/shared/figureV2/FigureV2Side';
import { kitDrummerPlan } from '../screens/lab/miking/lessons/shared/figureV2/kitDrummerV2';
import { M09_MODEL } from '../screens/lab/miking/lessons/m09Overheads/geometry';
import { sceneFrame } from '../screens/lab/miking/engine/geometry/contentFrame';
import { fitXform } from '../screens/lab/miking/engine/geometry/frame';

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
        <KitSide reach={false} keepOuts={false} figureV2={v2} isolate={isolate} />
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
        <FigureV2HandAlone plan={plan} which={which} stick={<Sticks path={line} />} />
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
        <KitSide swing reach={false} keepOuts={false} figureV2 />
      </Group>
    </Canvas>
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
      {show('foot') ? (
        <Section>
          <Caption title="NEW — THE FOOT ON THE KICK PEDAL" note="The near drums are left out here so the leg and foot show." />
          <Crop cu={-290} cv={150} mmW={560} mmH={420} w={big} v2 isolate />
        </Section>
      ) : null}
    </ScrollView>
  );
}
