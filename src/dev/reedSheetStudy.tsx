/**
 * SAXOPHONES AND WOODWINDS — THE HAND REVIEW SHEET (DEV + WEB ONLY; owner 2026-11-25, "batches by family").
 * `#labpreview/FigureStudy/sheet-reed`: every hand drawing of A05a–d (saxophones) and A06–A09b (woodwinds), numbered,
 * each ALONE and large (about 3 pt/mm) with its caption, NEW or KEPT, the lessons it serves (read from the lessons at
 * their default view), then the same hand at the lesson's size inside its figure, and close; the owner marks each number
 * pass or fail. Working pages: `sheet-reed-a-<back|palm>` one drawing alone in five skin tones;
 * `sheet-reed-j-<case>-<side|top>` one lesson's two hands close; `sheet-reed-jg-<side|top>-<sax|winds>` every lesson's
 * hands small.
 */
import { useMemo, type ReactNode } from 'react';
import { CAST, type CastMember } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { ReedHand, alonePlace, reedHandsForPlan, reedPadMiss, type ReedHandArt } from '../screens/lab/miking/lessons/shared/figureV2/reedHandKit';
import { REED_HAND_BACK } from '../screens/lab/miking/lessons/shared/figureV2/reedHandBack';
import { REED_HAND_PALM } from '../screens/lab/miking/lessons/shared/figureV2/reedHandPalm';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { famPlan, famProj, type FamIn } from '../screens/lab/miking/lessons/shared/figureV2/familyV2';
import { WindScene } from '../screens/lab/miking/lessons/shared/woodwinds/WindArt';
import { windFamIn } from '../screens/lab/miking/lessons/shared/woodwinds/windFigureV2';
import type { Layout as WindLayout } from '../screens/lab/miking/lessons/shared/woodwinds/windPosture';
import { layoutOf as fluteLayout } from '../screens/lab/miking/lessons/a06Flute/geometry';
import { layoutOf as piccLayout } from '../screens/lab/miking/lessons/a07Piccolo/geometry';
import { layoutOf as clLayout } from '../screens/lab/miking/lessons/a08aClarinet/geometry';
import { layoutOf as bclLayout } from '../screens/lab/miking/lessons/a08bBassClarinet/geometry';
import { layoutOf as obLayout } from '../screens/lab/miking/lessons/a09aOboe/geometry';
import { layoutOf as bsnLayout } from '../screens/lab/miking/lessons/a09bBassoon/geometry';
import { SaxScene } from '../screens/lab/miking/lessons/shared/sax/SaxArt';
import { saxPosture, type SaxPosture } from '../screens/lab/miking/lessons/shared/sax/saxPosture';
import { SOPRANO, ALTO, TENOR, BARITONE } from '../screens/lab/miking/lessons/shared/sax/saxSpec';
import { saxFamIn } from '../screens/lab/miking/lessons/shared/sax/saxFigureV2';

const BG = '#0d0f13';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

type View2 = 'side' | 'top';
type Box = { u0: number; v0: number; u1: number; v1: number };
type LessonCase = { id: string; lesson: string; scene: (view: View2) => ReactNode; famIn: (view: View2) => FamIn };

const sax = (id: string, lesson: string, P: SaxPosture): LessonCase => ({ id, lesson, scene: (view) => <SaxScene P={P} view={view} />, famIn: (view) => saxFamIn(P, view) });
const wind = (id: string, lesson: string, L: WindLayout): LessonCase => ({ id, lesson, scene: (view) => <WindScene L={L} view={view} />, famIn: (view) => windFamIn(L, view) });

/** Every lesson of the family at its DEFAULT view (the sax standing; each woodwind at its first variant). */
export const REED_LESSONS: LessonCase[] = [
  sax('soprano', 'A05a', saxPosture(SOPRANO, 'standing')),
  sax('alto', 'A05b', saxPosture(ALTO, 'standing')),
  sax('tenor', 'A05c', saxPosture(TENOR, 'standing')),
  sax('baritone', 'A05d', saxPosture(BARITONE, 'standing')),
  wind('flute', 'A06', fluteLayout('')),
  wind('piccolo', 'A07', piccLayout('standing')),
  wind('clarinet', 'A08a', clLayout('seated')),
  wind('bassClarinet', 'A08b', bclLayout('')),
  wind('oboe', 'A09a', obLayout('seated')),
  wind('bassoon', 'A09b', bsnLayout('seated')),
];

function Pic({ box, w, children, title }: { box: Box; w: number; children: ReactNode; title?: string }) {
  const s = w / (box.u1 - box.u0);
  const h = (box.v1 - box.v0) * s;
  return (
    <View style={{ marginRight: 8, marginBottom: 8 }}>
      {title ? <Text style={{ color: DIM, fontSize: 11, marginBottom: 2 }}>{title}</Text> : null}
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <Group transform={[{ translateX: -box.u0 * s }, { translateY: -box.v0 * s }, { scale: s }]}>
          <FigureScale ptPerMm={s}>{children}</FigureScale>
        </Group>
      </Canvas>
    </View>
  );
}

export const REED_ARTS: ReedHandArt[] = [REED_HAND_BACK, REED_HAND_PALM];
/** The window round a drawing alone (mm, its own frame). */
const ALONE = { u0: -50, v0: -70, u1: 175, v1: 80 };

/** One drawing alone, `s` pt per mm, its own cuff stub, mirrored or not. */
function Alone({ art, s, who, mirror = false }: { art: ReedHandArt; s: number; who: CastMember; mirror?: boolean }) {
  const w = (ALONE.u1 - ALONE.u0) * s;
  const h = (ALONE.v1 - ALONE.v0) * s;
  const pl = useMemo(() => alonePlace(0, 0, 1, mirror), [mirror]);
  return (
    <View style={{ marginRight: 8, marginBottom: 8 }}>
      <Canvas style={{ width: w, height: h }}>
        <Rect x={0} y={0} width={w} height={h} color={STAGE} />
        <Group transform={[{ translateX: (mirror ? ALONE.u1 : -ALONE.u0) * s }, { translateY: -ALONE.v0 * s }, { scale: s }]}>
          <FigureScale ptPerMm={s}>
            <Group>
              <Rect x={-60} y={-30} width={20} height={60} color={who.look.MAT.shirt.form[1]} />
              <ReedHand art={art} pl={pl} layer="back" who={who} />
              {art.tube ? <Rect x={art.tube.x - art.tube.r} y={-75} width={art.tube.r * 2} height={155} color="#5b6270" opacity={0.55} /> : null}
              <ReedHand art={art} pl={pl} layer="front" who={who} />
            </Group>
          </FigureScale>
        </Group>
      </Canvas>
    </View>
  );
}

function handBox(c: LessonCase, view: View2, side: 'L' | 'R', r = 90): Box {
  const fp = famPlan(c.famIn(view));
  const a = fp.arms.find((x) => x.side === side)!;
  const b = a.hand.box;
  const cu = (b.u0 + b.u1) / 2;
  const cv = (b.v0 + b.v1) / 2;
  return { u0: cu - r, v0: cv - r, u1: cu + r, v1: cv + r };
}

function Judge({ c, view, width }: { c: LessonCase; view: View2; width: number }) {
  const w = Math.min((width - 40) / 2, 400);
  return (
    <View>
      <Text style={{ color: INK, fontSize: 13, fontWeight: '700' }}>{`${c.lesson} ${c.id} · ${view}`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(['L', 'R'] as const).map((side) => (
          <Pic key={side} box={handBox(c, view, side)} w={w} title={side === 'L' ? 'LEFT HAND' : 'RIGHT HAND'}>
            {c.scene(view)}
          </Pic>
        ))}
      </View>
    </View>
  );
}

export function ReedSheetStudy({ only }: { only: string }) {
  const { width } = useWindowDimensions();
  const parts = only.split('-');
  if (parts[2] === 'jg') {
    // (working page: every lesson of one group, both hands, small: sheet-reed-jg-<side|top>-<sax|winds>)
    const view = (parts[3] === 'top' ? 'top' : 'side') as View2;
    const cs = REED_LESSONS.filter((c) => (parts[4] === 'sax' ? c.lesson.startsWith('A05') : !c.lesson.startsWith('A05')));
    const w = Math.floor((width - 60) / 4);
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cs.flatMap((c) =>
            (['L', 'R'] as const).map((side) => (
              <Pic key={c.id + side} box={handBox(c, view, side)} w={w} title={`${c.lesson} ${side}`}>
                {c.scene(view)}
              </Pic>
            )),
          )}
        </View>
      </ScrollView>
    );
  }
  if (parts[2] === 'a') {
    // (working page: one drawing alone, sheet-reed-a-<name>)
    const art = REED_ARTS.find((a) => a.name === parts[3]) ?? REED_ARTS[0];
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 8 }}>
        <Alone art={art} s={3} who={CAST.ruth} />
        <View style={{ flexDirection: 'row' }}>
          {(['drummer', 'ana', 'kofi', 'mei'] as const).map((id) => (
            <Alone key={id} art={art} s={1} who={CAST[id]} />
          ))}
        </View>
      </ScrollView>
    );
  }
  if (parts[2] === 'j') {
    const c = REED_LESSONS.find((x) => x.id === parts[3]) ?? REED_LESSONS[0];
    const view = (parts[4] === 'top' ? 'top' : 'side') as View2;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
        <Judge c={c} view={view} width={width} />
      </ScrollView>
    );
  }
  const bigS = Math.min(2.6, (width - 24) / (ALONE.u1 - ALONE.u0));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700' }}>Saxophones and woodwinds — every hand, one sheet</Text>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 4, marginBottom: 10 }}>
        Each drawing alone and large (a plain gray bar shows where the instrument's tube goes), then the same hand at the lesson's size inside its figure, then close. Mark each number pass or fail. A left hand is the right hand's mirror image, re-lit from the upper left.
      </Text>
      {REED_SHEET.map((e) => (
        <SheetEntry key={e.n} e={e} s={bigS} width={width} />
      ))}
    </ScrollView>
  );
}

/* ── the review sheet ── */

type Use = { c: LessonCase; view: View2; side: 'L' | 'R'; miss: number };
/** Where each drawing is used: every lesson at its default view, each hand. */
function usesOf(art: ReedHandArt): Use[] {
  const out: Use[] = [];
  for (const c of REED_LESSONS)
    for (const view of ['side', 'top'] as const) {
      const fi = c.famIn(view);
      const fp = famPlan(fi);
      const placed = reedHandsForPlan(fp, { back: REED_HAND_BACK, palm: REED_HAND_PALM }, { L: fi.arms.L.sk, R: fi.arms.R.sk });
      const pr = famProj(fi.view);
      for (const h of placed)
        if (h.art === art) {
          const sk = fi.arms[h.side].sk;
          out.push({ c, view, side: h.side, miss: reedPadMiss(art, h.pl, sk.fingers.map((f) => pr(f.joints[f.joints.length - 1]))) });
        }
    }
  return out;
}
const viewWord = (c: LessonCase, v: View2) => (v === 'top' ? 'from above' : c.lesson.startsWith('A05') ? 'side' : 'face-on');
const useWord = (u: Use) => `${u.c.lesson} ${viewWord(u.c, u.view)} ${u.side === 'L' ? 'left' : 'right'}`;

/** The family's drawings, numbered (the test reads this list). */
export const REED_SHEET: { n: number; art: ReedHandArt; status: 'NEW' | 'KEPT'; caption: string; examples: { id: string; view: View2; side: 'L' | 'R' }[]; doubt: string }[] = [
  {
    n: 1,
    art: REED_HAND_BACK,
    status: 'NEW',
    caption: 'a right hand on the keys seen from the BACK of the hand: the palm against the side of the tube, the fingers curling round it onto the keys, the thumb hidden under the hand',
    examples: [
      { id: 'alto', view: 'side', side: 'R' },
      { id: 'flute', view: 'side', side: 'L' },
      { id: 'clarinet', view: 'side', side: 'R' },
    ],
    doubt: 'Two rounds. The thumb never shows from this side. The nails are seen end-on as short pale shapes across each fingertip. On the bassoon the fingers spread wide to reach holes far apart. From above, where a hand is seen from its index edge, there is no edge-on drawing yet: this one stands in.',
  },
  {
    n: 2,
    art: REED_HAND_PALM,
    status: 'NEW',
    caption: 'a right hand on the keys seen from the PALM side, the tube between us and the palm: the palm and thumb behind the tube, each finger curling round it and lying back over it toward us, its nail showing',
    examples: [
      { id: 'flute', view: 'side', side: 'R' },
      { id: 'alto', view: 'side', side: 'L' },
      { id: 'piccolo', view: 'side', side: 'R' },
    ],
    doubt: 'Three rounds used. The finger ends lying over the tube can still read as four separate rounded pieces; the thumb lies rather flat along the palm’s lower edge. On the saxophone seen from the player’s right the left hand points almost straight at us, so the drawing is shortened along its length.',
  },
];

function SheetEntry({ e, s, width }: { e: (typeof REED_SHEET)[number]; s: number; width: number }) {
  const uses = useMemo(() => usesOf(e.art), [e.art]);
  const off = uses.filter((u) => u.miss > 6);
  const smallW = Math.min(230, (width - 40) / 3);
  return (
    <View style={{ marginBottom: 26 }}>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '700' }}>{`${e.n} — ${e.status}`}</Text>
      <Text style={{ color: INK, fontSize: 13, marginBottom: 2 }}>{`${e.n} — ${e.caption}.`}</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 6 }}>{`Used in: ${uses.map(useWord).join(', ')}.`}</Text>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>{`Alone, ${s.toFixed(1)} points per mm (about 3), as Ruth's hand:`}</Text>
      <Alone art={e.art} s={s} who={CAST.ruth} />
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>The same hand at the lesson's size inside its figure (top row), and close (bottom row):</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {e.examples.map((x) => {
          const c = REED_LESSONS.find((q) => q.id === x.id)!;
          return (
            <Pic key={`${x.id}${x.view}${x.side}`} box={figureBox(c, x.view)} w={smallW} title={`${c.lesson} ${viewWord(c, x.view)}, ${x.side === 'L' ? 'left' : 'right'} hand`}>
              {c.scene(x.view)}
            </Pic>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {e.examples.map((x) => {
          const c = REED_LESSONS.find((q) => q.id === x.id)!;
          return (
            <Pic key={`${x.id}${x.view}${x.side}c`} box={handBox(c, x.view, x.side, 80)} w={smallW}>
              {c.scene(x.view)}
            </Pic>
          );
        })}
      </View>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{`Doubt: ${e.doubt}${off.length ? ` Not yet right (a fingertip more than 6 mm off its key): ${off.map((u) => `${useWord(u)} (${u.miss.toFixed(0)} mm)`).join(', ')}.` : ''}`}</Text>
    </View>
  );
}

/** The window round a lesson's whole figure (its own joints), mm. */
function figureBox(c: LessonCase, view: View2): Box {
  const fi = c.famIn(view);
  const pr = famProj(fi.view);
  const s = fi.s;
  const q = [s.head, s.toeL, s.toeR, s.shoulderL, s.shoulderR, fi.arms.L.sk.frame.o, fi.arms.R.sk.frame.o].map(pr);
  const u0 = Math.min(...q.map((p) => p.u)) - 260;
  const u1 = Math.max(...q.map((p) => p.u)) + 260;
  const v0 = Math.min(...q.map((p) => p.v)) - 180;
  const v1 = view === 'top' ? Math.max(...q.map((p) => p.v)) + 260 : fi.floorY + 40;
  return { u0, v0, u1, v1 };
}
