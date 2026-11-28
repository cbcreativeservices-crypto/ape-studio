/**
 * HAND-DRUM HAND STUDY — DEV + WEB ONLY (figure realism pass, second wave:
 * the hand-drum hands, 2026-11-23). `#labpreview/HandDrumHands` draws the
 * "How it sounds" hands of the hand-drum lessons LARGE: the side strike (the
 * open tone, on each drum), and every stroke's hand from above exactly as the
 * lesson's own StrokeMap draws it (compare with the owner's approved drummer
 * hand at `#labpreview/FigureStudy/close`). `#labpreview/HandDrumHands/<part>`
 * shows one part alone (side, close, top, topclose, M04a, M04b, M05,
 * M04aclose, M04bclose, M05close). Nothing here ships to a phone: the harness module
 * is required only in the web dev branch of App.tsx.
 */
import type { ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Canvas, Circle, Group, Rect } from '@shopify/react-native-skia';
import { SideStrikeHand, StrokeMap, TopStrokeHand, topHandFor, topPoseOf } from '../screens/lab/miking/lessons/shared/handdrums/handSoundArt';
import { handOf } from '../screens/lab/miking/lessons/shared/handdrums/family';
import type { HandDrum } from '../screens/lab/miking/lessons/shared/handdrums/handDrumModel';
import { lessonById } from '../screens/lab/miking/data/lessonLoader';
import { FC_FRONT } from '../screens/lab/miking/lessons/i06bFingerCymbals/art';
import { BC_FRONT } from '../screens/lab/miking/lessons/i06cBarChimes/art';
import type { FrontArt } from '../screens/lab/miking/lessons/shared/metal/metalPages';

const BG = '#0d0f13';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

/** A window `mmW` × `mmH` mm centered on (cu, cv), `w` pt wide. */
function Win({ cu, cv, mmW, mmH, w, children }: { cu: number; cv: number; mmW: number; mmH: number; w: number; children: ReactNode }) {
  const s = w / mmW;
  const h = mmH * s;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Rect x={0} y={0} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: w / 2 - cu * s }, { translateY: h / 2 - cv * s }, { scale: s }]}>{children}</Group>
    </Canvas>
  );
}

/** A drum's head in section (a plain band), its near rim, and the open-tone hand on it. */
function SideScene({ d, frac }: { d: HandDrum; frac: number }) {
  const sx = d.c.x - frac * d.R;
  return (
    <Group>
      <Rect x={d.c.x - d.R} y={d.headY - 3} width={d.R * 2} height={6} color="#d9c49a" />
      <Rect x={d.c.x - d.R - d.rim.t} y={d.headY - d.rim.rise} width={d.rim.t + 14} height={d.rim.rise + 40} color="#6b6e76" />
      <SideStrikeHand edgeX={d.c.x - d.R} headY={d.headY} rise={d.rim.rise} />
      <Circle cx={sx} cy={d.headY} r={16} style="stroke" strokeWidth={3} color="#ffc64d" opacity={0.7} />
    </Group>
  );
}

function Caption({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

const LESSONS: [string, string, number][] = [
  ['M04a', 'CONGAS', 0.72],
  ['M04b', 'BONGOS', 0.72],
  ['M05', 'DJEMBE', 0.75],
];

function LessonStrokes({ id, name, w }: { id: string; name: string; w: number }) {
  const lesson = lessonById(id);
  if (!lesson) return <Text style={{ color: DIM }}>{`${id}: not loaded`}</Text>;
  const H = handOf(lesson);
  const scaleR = Math.max(H.drum.R, ...Object.values(H.drums ?? {}).map((x) => x.R));
  return (
    <View style={{ marginBottom: 28 }}>
      <Caption title={`${name} · FROM ABOVE, EVERY STROKE (the lesson's own StrokeMap)`} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {H.strokes.items.map((s) => (
          <View key={s.id}>
            <Caption title={s.label} note={`tool ${s.tool} · frac ${s.frac}`} />
            <StrokeMap w={w} h={w * 0.5} drum={(s.drum && H.drums?.[s.drum]) || H.drum} scaleR={scaleR} head={H.headLook} stroke={s} accessibilityLabel={s.label} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Every stroke's hand from above, close: the head and rim plainly, the hand as the lesson draws it. */
function LessonTopClose({ id, name, w }: { id: string; name: string; w: number }) {
  const lesson = lessonById(id);
  if (!lesson) return null;
  const H = handOf(lesson);
  return (
    <View style={{ marginBottom: 28 }}>
      <Caption title={`${name} · FROM ABOVE, CLOSE`} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {H.strokes.items
          .filter((s) => s.tool !== 'stick')
          .map((s) => {
            const d = (s.drum && H.drums?.[s.drum]) || H.drum;
            const sx = s.frac == null ? -d.R - d.rim.t - 4 : -s.frac * d.R;
            const t = topHandFor(topPoseOf(s as { id: string; tool: 'palm' | 'fingers' | 'tips' }), sx, d.R);
            return (
              <View key={s.id}>
                <Caption title={s.label} note={s.text} />
                <Win cu={t.pl.at[0] + 100} cv={-4} mmW={280} mmH={170} w={w}>
                  <Circle cx={0} cy={0} r={d.R + d.rim.t} color="#8b9099" />
                  <Circle cx={0} cy={0} r={d.R} color="#d9c49a" />
                  <TopStrokeHand pose={topPoseOf(s as { id: string; tool: 'palm' | 'fingers' | 'tips' })} sx={sx} R={d.R} />
                  {topPoseOf(s as { id: string; tool: 'palm' | 'fingers' | 'tips' }) !== 'tips' ? <Circle cx={sx} cy={0} r={18} style="stroke" strokeWidth={4} color="#ffc64d" /> : null}
                </Win>
              </View>
            );
          })}
      </View>
    </View>
  );
}

/** A metal lesson's front drawing (its hand at true size), large, cropped to `box`. */
function Front({ id, variant, front, w, crop }: { id: string; variant: string; front: FrontArt; w: number; crop?: { cu: number; cv: number; mm: number } }) {
  const b = front.box(variant);
  const c = crop ? { cu: (b.u0 + b.u1) / 2 + crop.cu, cv: (b.v0 + b.v1) / 2 + crop.cv, mm: crop.mm } : { cu: (b.u0 + b.u1) / 2, cv: (b.v0 + b.v1) / 2, mm: b.u1 - b.u0 };
  const Art = front.Art;
  return (
    <View style={{ marginBottom: 20 }}>
      <Caption title={`${id} · FRONT (${variant})`} />
      <Win cu={c.cu} cv={c.cv} mmW={c.mm} mmH={c.mm * ((b.v1 - b.v0) / (b.u1 - b.u0))} w={w}>
        <Art variant={variant} highlight={null} />
      </Win>
    </View>
  );
}

function LessonSide({ id, name, frac, w, mm }: { id: string; name: string; frac: number; w: number; mm: number }) {
  const lesson = lessonById(id);
  if (!lesson) return null;
  const d = handOf(lesson).drum;
  return (
    <View style={{ marginBottom: 20 }}>
      <Caption title={`${name} · SIDE · OPEN TONE (the strike, step ①)`} note="The player's left hand from their right (the thumb side, the thumb nearest): the palm's ridge on the rim, the fingers flat on the head." />
      <Win cu={d.c.x - d.R + (mm < 300 ? 0 : -40)} cv={d.headY - (mm < 300 ? 45 : 80)} mmW={mm} mmH={mm * 0.62} w={w}>
        <SideScene d={d} frac={frac} />
      </Win>
    </View>
  );
}

export function HandDrumHandStudy() {
  const route = useRoute();
  const only = String((route.params as { id?: string } | undefined)?.id ?? '');
  const show = (k: string) => !only || only === k;
  const { width } = useWindowDimensions();
  const big = only ? width - 24 : Math.min(width - 24, 600);
  const map = only ? Math.min(width - 24, 1100) : Math.min(width - 24, 520);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Hand study — the hand-drum hands</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 18 }}>The "How it sounds" hands of the congas, bongos and djembe, large (the approved drummer hand: FigureStudy/close).</Text>
      {show('side') ? LESSONS.map(([id, name, frac]) => <LessonSide key={id} id={id} name={name} frac={frac} w={big} mm={440} />) : null}
      {show('close') ? <LessonSide id="M04b" name="BONGOS (CLOSE)" frac={0.72} w={big} mm={220} /> : null}
      {LESSONS.map(([id, name]) => (show('top') || show(id) ? <LessonStrokes key={id} id={id} name={name} w={map} /> : null))}
      {show('metal') ? (
        <>
          <Front id="I06b" variant="orchestral" front={FC_FRONT} w={big} />
          <Front id="I06c" variant="single" front={BC_FRONT} w={big} />
        </>
      ) : null}
      {show('metalclose') ? (
        <>
          <Front id="I06b" variant="orchestral" front={FC_FRONT} w={big} crop={{ cu: -45, cv: 40, mm: 190 }} />
          <Front id="I06b" variant="orchestral" front={FC_FRONT} w={big} crop={{ cu: 60, cv: 70, mm: 190 }} />
        </>
      ) : null}
      {LESSONS.map(([id, name]) => (show('topclose') || show(`${id}close`) ? <LessonTopClose key={id} id={id} name={name} w={only ? Math.min(width - 24, 900) : 400} /> : null))}
    </ScrollView>
  );
}
