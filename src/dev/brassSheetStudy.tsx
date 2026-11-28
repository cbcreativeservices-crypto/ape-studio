/**
 * THE BRASS AND LOW BRASS HANDS — ONE REVIEW SHEET (DEV + WEB ONLY; owner 2026-11-25, "batches by family").
 * `#labpreview/FigureStudy/sheet-brass`: every hand the student sees in the family's lessons at their default view
 * (A01 trumpet, A02 trombone, A03 horn, A04a tuba, A04b euphonium — side view from the player's right and the view
 * from above), numbered 1..N. Each: the drawing ALONE and large (about 3 pt per mm), marked NEW (an authored drawing,
 * figureV2/brassHand*.tsx) or KEPT (left as the figure draws it), a one-line caption, and beside it the same hand at
 * the lesson's size inside its figure, then closer.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import type { Vec3, ViewId } from '../screens/lab/miking/engine/model/types';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { PaintItem } from '../screens/lab/miking/lessons/shared/bowed/BowedArt';
import { sceneGroups as brassGroups } from '../screens/lab/miking/lessons/shared/brass/BrassArt';
import { slidePose, valvedPose, type HornPose } from '../screens/lab/miking/lessons/shared/brass/brassPosture';
import { TENOR, TRUMPET } from '../screens/lab/miking/lessons/shared/brass/brassSpec';
import { brassFamIn, brassHandArt } from '../screens/lab/miking/lessons/shared/brass/brassFigureV2';
import { famPlan, type FamPlan } from '../screens/lab/miking/lessons/shared/figureV2/familyV2';
import type { CastMember } from '../screens/lab/miking/lessons/shared/figureV2/cast';
import { BrassHand, type BrassHandArt } from '../screens/lab/miking/lessons/shared/figureV2/brassHandPaint';
import { sceneItems as lowItems } from '../screens/lab/miking/lessons/shared/lowbrass/LowBrassArt';
import { brassScene as lowScene, type BrassScene as LowScene } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassScene';
import { HORN, TUBA, EUPH } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassSpec';
import { lowBrassFamIn, lowBrassHandArt } from '../screens/lab/miking/lessons/shared/lowbrass/lowBrassFigureV2';

const BG = '#0d0f13';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';
const NEW_C = '#7bd88f';
const KEPT_C = '#f0c674';

type Box = { u0: number; v0: number; u1: number; v1: number };

/** One scene of the family at a lesson's default view. `ghost`: the instrument alone (no player), drawn faint behind a
 *  drawing shown alone, so the eye can read what the hand holds. */
type Scene = { lesson: string; view: ViewId; plan: () => FamPlan; paint: () => ReactNode; ghost: () => ReactNode; figBox: Box; art: (side: 'L' | 'R') => BrassHandArt | null };

const HORN_KEYS = /^(t\.|bell|valve|rotors|mouthpiece)/;
function BrassGhost({ P, view }: { P: HornPose; view: ViewId }) {
  const groups = useMemo(() => brassGroups(P, view, { v2: true }).filter((g) => HORN_KEYS.test(g.key)), [P, view]);
  return (
    <Group opacity={0.32}>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
    </Group>
  );
}
function LowGhost({ s, view }: { s: LowScene; view: ViewId }) {
  const items = useMemo(() => lowItems(s, view, { player: false }), [s, view]);
  return (
    <Group opacity={0.32}>
      {items.map((it) => (
        <Group key={it.key}>{it.node}</Group>
      ))}
    </Group>
  );
}

const ptsBox = (view: ViewId, pts: Vec3[], pad: number): Box => {
  const q = pts.map((p) => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z }));
  return { u0: Math.min(...q.map((p) => p.u)) - pad, v0: Math.min(...q.map((p) => p.v)) - pad, u1: Math.max(...q.map((p) => p.u)) + pad, v1: Math.max(...q.map((p) => p.v)) + pad };
};

function BrassPaint({ P, view }: { P: HornPose; view: ViewId }) {
  const groups = useMemo(() => brassGroups(P, view, { v2: true }), [P, view]);
  return (
    <Group>
      {groups.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
    </Group>
  );
}
function LowPaint({ s, view }: { s: LowScene; view: ViewId }) {
  const items = useMemo(() => lowItems(s, view, { v2: true }), [s, view]);
  return (
    <Group>
      {items.map((it) => (
        <Group key={it.key}>{it.node}</Group>
      ))}
    </Group>
  );
}

const brassScene = (lesson: string, P: HornPose, view: ViewId): Scene => ({
  lesson,
  view,
  plan: () => famPlan(brassFamIn(P, view)),
  paint: () => <BrassPaint P={P} view={view} />,
  ghost: () => <BrassGhost P={P} view={view} />,
  figBox: ptsBox(view, [...P.tubes.flatMap((t) => t.pts), P.player.head, P.player.toeL, P.player.toeR, P.player.shoulderL, P.player.shoulderR, { x: P.player.hipL.x, y: P.floorY, z: P.player.hipL.z }], 140),
  art: (side) => brassHandArt(P, view, side)?.art ?? null,
});
const low = (lesson: string, s: LowScene, view: ViewId): Scene => ({
  lesson,
  view,
  plan: () => famPlan(lowBrassFamIn(s, view)),
  paint: () => <LowPaint s={s} view={view} />,
  ghost: () => <LowGhost s={s} view={view} />,
  figBox: ptsBox(view, [...s.tubes.flatMap((t) => t.pts), s.J.head, s.J.toeR, s.J.toeL, s.J.shoulderL, s.J.shoulderR, s.J.hipL, { x: s.J.hipL.x, y: 0, z: s.J.hipL.z }], 160),
  art: (side) => lowBrassHandArt(s, view, side)?.art ?? null,
});

const TP = valvedPose(TRUMPET);
const TB = slidePose(TENOR);
const HN = lowScene(HORN, 'back');
const TU = lowScene(TUBA, 'up');
const EU = lowScene(EUPH, 'up');

/** One numbered drawing on the sheet. */
type Entry = { title: string; uses: string; status: 'NEW' | 'KEPT'; scene: Scene; side: 'L' | 'R'; doubt?: string };

export const SHEET: Entry[] = [
  { title: 'trumpet valve hand (right), seen from the player’s right', uses: 'A01 trumpet and flugelhorn, side view', status: 'NEW', scene: brassScene('A01', TP, 'side'), side: 'R', doubt: 'from this side the fingers’ ends go down behind the hand onto the buttons, so only the index’s end shows; the hand may still read as a closed fist' },
  { title: 'trumpet valve hand (right), seen from above', uses: 'A01 trumpet and flugelhorn, from above', status: 'NEW', scene: brassScene('A01', TP, 'top'), side: 'R', doubt: 'the little finger reaches the hook a few millimeters from its posed place; the thumb shows only as the hand’s thick left edge' },
  { title: 'trumpet holding hand (left), round the valves, seen from the player’s right (palm toward us, far side)', uses: 'A01 trumpet and flugelhorn, side view', status: 'NEW', scene: brassScene('A01', TP, 'side'), side: 'L', doubt: 'the thumb’s end hooks over to the slide saddle and can read as a curl; in the lesson only the fingertips and the heel of the hand show' },
  { title: 'trumpet holding hand (left), round the valves, seen from above', uses: 'A01 trumpet and flugelhorn, from above', status: 'NEW', scene: brassScene('A01', TP, 'top'), side: 'L', doubt: 'the middle, ring and little fingers show only as bends beyond the index' },
  { title: 'trombone slide hand (right), on the slide brace, seen from the player’s right', uses: 'A02 tenor and bass trombone, side view', status: 'NEW', scene: brassScene('A02', TB, 'side'), side: 'R', doubt: 'the fingers’ ends are hidden behind the brace, so only the thumb’s nail shows' },
  { title: 'trombone holding hand (left), pistol grip on the braces, seen from the player’s right (palm toward us, far side)', uses: 'A02 tenor and bass trombone, side view', status: 'NEW', scene: brassScene('A02', TB, 'side'), side: 'L', doubt: 'in the lesson the right hand covers most of its fingers; the thumb and the palm’s heel show' },
  { title: 'trombone slide hand (right), seen from above', uses: 'A02 tenor and bass trombone, from above', status: 'NEW', scene: brassScene('A02', TB, 'top'), side: 'R', doubt: 'the thumb bends sharply at its base joint, as the pose has it; the slide covers the fingers’ ends in the lesson' },
  { title: 'trombone holding hand (left), seen from above', uses: 'A02 tenor and bass trombone, from above', status: 'NEW', scene: brassScene('A02', TB, 'top'), side: 'L', doubt: 'seen from above this fist is mostly its thumb side and can read as one rounded mass; in the lesson the sleeve and the bell brace cover most of it' },
  { title: 'tuba valve hand (right), on the four pistons, seen from the player’s right', uses: 'A04a tuba (bell up), side view', status: 'NEW', scene: low('A04a', TU, 'side'), side: 'R', doubt: 'the fingers spread apart to reach the widely spaced buttons; in the lesson the sleeve hides the index and the thumb' },
  { title: 'tuba valve hand (right), seen from above', uses: 'A04a tuba (bell up), from above', status: 'NEW', scene: low('A04a', TU, 'top'), side: 'R', doubt: 'from above the fingers are short arches; their nails show only as slivers' },
  { title: 'euphonium valve hand (right), on the three pistons, seen from the player’s right', uses: 'A04b euphonium (bell up), side view', status: 'NEW', scene: low('A04b', EU, 'side'), side: 'R', doubt: 'the three fingers still hang apart onto the buttons a little like pegs; their nails face away and show only as slivers' },
  { title: 'euphonium valve hand (right), seen from above', uses: 'A04b euphonium (bell up), from above', status: 'NEW', scene: low('A04b', EU, 'top'), side: 'R' },
  { title: 'euphonium left hand, index on the side (4th) valve, seen from above', uses: 'A04b euphonium (bell up), from above', status: 'NEW', scene: low('A04b', EU, 'top'), side: 'L', doubt: 'drawn alone the back of the hand looks long and flat; the thumb is under the hand and not drawn' },
  { title: 'horn left hand on the rotary-valve levers, seen from the player’s right (palm toward us, behind the coils)', uses: 'A03 horn, side view', status: 'NEW', scene: low('A03', HN, 'side'), side: 'L', doubt: 'in the lesson almost all of it is behind the coils and rotors' },
  { title: 'horn left hand on the rotary-valve levers, seen from above', uses: 'A03 horn, from above', status: 'NEW', scene: low('A03', HN, 'top'), side: 'L' },
  { title: 'horn right hand inside the bell, seen from the player’s right (only the back of the hand shows, through the bell’s opening)', uses: 'A03 horn, side view', status: 'KEPT', scene: low('A03', HN, 'side'), side: 'R', doubt: 'kept as the figure draws it: no finger shows past the bell’s rim, only the wrist and the back of the hand; it has no authored drawing' },
  { title: 'tuba left hand on the bell branch, seen from above (only the wrist and the hand’s edge show beside the bell)', uses: 'A04a tuba (bell up), from above', status: 'KEPT', scene: low('A04a', TU, 'top'), side: 'L', doubt: 'kept as the figure draws it: the bell covers the fingers and the thumb; only a sliver of the hand shows' },
];

function Pic({ box, w, children }: { box: Box; w: number; children: ReactNode }) {
  const s = w / (box.u1 - box.u0);
  const h = (box.v1 - box.v0) * s;
  return (
    <Canvas style={{ width: w, height: h }}>
      <Rect x={0} y={0} width={w} height={h} color={STAGE} />
      <Group transform={[{ translateX: -box.u0 * s }, { translateY: -box.v0 * s }, { scale: s }]}>
        <FigureScale ptPerMm={s}>{children}</FigureScale>
      </Group>
    </Canvas>
  );
}

/** The hand's box in its picture (mm): the drawing's own bounds on its cuff, or the figure's hand. */
function handBox(e: Entry): { box: Box; at: { u: number; v: number }; who: CastMember } {
  const fp = e.scene.plan();
  const a = fp.arms.find((x) => x.side === e.side)!;
  const at = a.arm.opening.e.c;
  const art = e.scene.art(e.side);
  if (art) {
    let u0 = Infinity;
    let v0 = Infinity;
    let u1 = -Infinity;
    let v1 = -Infinity;
    for (const q of [...art.body, ...(art.union ?? []).flat(), ...(art.pieces ?? []).flat()]) {
      u0 = Math.min(u0, q.u);
      v0 = Math.min(v0, q.v);
      u1 = Math.max(u1, q.u);
      v1 = Math.max(v1, q.v);
    }
    return { box: { u0: at.u + u0 - 14, v0: at.v + v0 - 14, u1: at.u + u1 + 14, v1: at.v + v1 + 14 }, at, who: fp.in.who };
  }
  const b = a.hand.box;
  return { box: { u0: b.u0 - 14, v0: b.v0 - 14, u1: b.u1 + 14, v1: b.v1 + 14 }, at, who: fp.in.who };
}

function EntryView({ n, e, width }: { n: number; e: Entry; width: number }) {
  const art = e.scene.art(e.side);
  const { box, at, who } = useMemo(() => handBox(e), [e]);
  const bw = box.u1 - box.u0;
  const alone = Math.min(width - 24, bw * 3);
  const near: Box = { u0: (box.u0 + box.u1) / 2 - 110, v0: (box.v0 + box.v1) / 2 - 110, u1: (box.u0 + box.u1) / 2 + 110, v1: (box.v0 + box.v1) / 2 + 110 };
  return (
    <View style={{ marginBottom: 26 }}>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '700' }}>
        {n} — {e.title}; used in {e.uses} <Text style={{ color: e.status === 'NEW' ? NEW_C : KEPT_C }}>{e.status}</Text>
      </Text>
      {e.doubt ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>My doubt: {e.doubt}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 6 }}>
        <View style={{ marginRight: 10, marginBottom: 8 }}>
          <Text style={{ color: DIM, fontSize: 11, marginBottom: 3 }}>{art ? 'the drawing alone, about 3 pt per mm (what it holds drawn faint behind)' : 'the hand as the figure draws it, about 3 pt per mm'}</Text>
          <Pic box={box} w={alone}>
            {art ? (
              <Group>
                {e.scene.ghost()}
                <BrassHand art={art} at={at} who={who} uncut />
              </Group>
            ) : (
              e.scene.paint()
            )}
          </Pic>
        </View>
        <View style={{ marginRight: 10, marginBottom: 8 }}>
          <Text style={{ color: DIM, fontSize: 11, marginBottom: 3 }}>in the lesson, at about the lesson’s size</Text>
          <Pic box={e.scene.figBox} w={Math.min(300, width - 24)}>
            {e.scene.paint()}
          </Pic>
        </View>
        <View style={{ marginRight: 10, marginBottom: 8 }}>
          <Text style={{ color: DIM, fontSize: 11, marginBottom: 3 }}>in the lesson, closer (2 pt per mm)</Text>
          <Pic box={near} w={Math.min(440, width - 24)}>
            {e.scene.paint()}
          </Pic>
        </View>
      </View>
    </View>
  );
}

/** Drawings shown at once (a browser keeps only so many live pictures: the sheet turns its pages instead). */
const PER_PAGE = 4;

export function BrassSheetStudy() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pages = Math.ceil(SHEET.length / PER_PAGE);
  const first = page * PER_PAGE;
  const nav = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
      {Array.from({ length: pages }, (_, p) => (
        <Pressable key={p} onPress={() => setPage(p)} accessibilityRole="button" accessibilityLabel={`Show drawings ${p * PER_PAGE + 1} to ${Math.min(SHEET.length, (p + 1) * PER_PAGE)}`} style={{ paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 6, borderRadius: 6, backgroundColor: p === page ? '#2c3442' : '#1a1f28' }}>
          <Text style={{ color: p === page ? INK : DIM, fontSize: 13 }}>{p * PER_PAGE + 1 === Math.min(SHEET.length, (p + 1) * PER_PAGE) ? `${p * PER_PAGE + 1}` : `${p * PER_PAGE + 1}–${Math.min(SHEET.length, (p + 1) * PER_PAGE)}`}</Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Brass and low brass — every hand, one sheet</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 10 }}>A01 trumpet, A02 trombone, A03 horn, A04a tuba, A04b euphonium, as a student first sees each lesson: from the player’s right and from above. {SHEET.length} drawings, numbered; mark each number pass or fail. The buttons turn the pages.</Text>
      {nav}
      {SHEET.slice(first, first + PER_PAGE).map((e, i) => (
        <EntryView key={first + i} n={first + i + 1} e={e} width={width} />
      ))}
      {nav}
    </ScrollView>
  );
}
