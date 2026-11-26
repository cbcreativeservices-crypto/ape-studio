/**
 * THE BOWED FAMILY'S HAND REVIEW SHEET (2026-11-25, "batches by family"). DEV + WEB ONLY:
 * `#labpreview/FigureStudy/sheet-bowed` (every drawing), `sheet-bowed-<n>` (one), `-dbg` after either (the lesson's
 * posed skeleton laid over each drawing, for the builder). Each hand numbered, ALONE and large (3 pt per mm) with a
 * one-line caption and NEW or KEPT, and beside it the same hand at lesson size inside its figure, then a close look
 * at it in the lesson's own picture.
 */
import { useMemo, type ReactNode } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Group, LinearGradient, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { FigureLook } from '../screens/lab/miking/lessons/shared/figureV2/look';
import { BowedHandAlone, localLight, type BowedHandArt } from '../screens/lab/miking/lessons/shared/figureV2/bowedHandPaint';
import { P, type Pt } from '../screens/lab/miking/lessons/shared/figureV2/geom';
import { PaintItem, sceneGroups, cutFor, type Group3 } from '../screens/lab/miking/lessons/shared/bowed/BowedArt';
import { underChin, seated, standing, type Posture } from '../screens/lab/miking/lessons/shared/bowed/posture';
import { VIOLIN, CELLO, BASS } from '../screens/lab/miking/lessons/shared/bowed/bowedSpec';
import { drawnHands } from '../screens/lab/miking/lessons/shared/bowed/bowedHands';
import { bowedFamIn, bowedPlayer } from '../screens/lab/miking/lessons/shared/bowed/bowedFigureV2';
import { BOWED_HANDS, bowedHandPlacements, type BowedHandEntry, type BowedHandPlaced } from '../screens/lab/miking/lessons/shared/bowed/bowedHandsV2';
import { famPlan } from '../screens/lab/miking/lessons/shared/figureV2/familyV2';

const BG = '#0b0d12';
const STAGE = '#14171d';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';

type Box = { u0: number; v0: number; u1: number; v1: number };

const POSE = {
  violin: underChin(VIOLIN, 0, false),
  cello: seated(CELLO),
  bassBow: standing(BASS, 'bow'),
  bassPluck: standing(BASS, 'pluck'),
};
/** The lesson picture a drawing is shown in (its own posture). */
function poseOf(e: BowedHandEntry): { P: Posture; bow: boolean } {
  if (e.fam === 'violin') return { P: POSE.violin, bow: true };
  if (e.fam === 'cello') return { P: POSE.cello, bow: true };
  return e.mode === 'pizz' ? { P: POSE.bassPluck, bow: false } : { P: POSE.bassBow, bow: true };
}

function placedOf(e: BowedHandEntry): { pl: BowedHandPlaced | null; P: Posture; bow: boolean } {
  const { P: P0, bow } = poseOf(e);
  const D = drawnHands(P0, bow && P0.strokes.length > 0);
  const fi = bowedFamIn(D.P, D, e.view, bow, (a) => cutFor(e.view, a));
  if (!fi) return { pl: null, P: P0, bow };
  const fp = famPlan(fi);
  const all = bowedHandPlacements(D.P, D, e.view, bow, fp);
  return { pl: all.find((p) => p.e === e) ?? null, P: P0, bow };
}

function artBox(art: BowedHandArt): Box {
  let u0 = -45;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const p of [...art.behind, ...art.front])
    for (const q of p.outline) {
      u0 = Math.min(u0, q.u);
      v0 = Math.min(v0, q.v);
      u1 = Math.max(u1, q.u);
      v1 = Math.max(v1, q.v);
    }
  v0 = Math.min(v0, -36);
  v1 = Math.max(v1, 36);
  return { u0: u0 - 18, v0: v0 - 18, u1: u1 + 18, v1: v1 + 18 };
}

/** A short sleeve stub out of the drawing's cuff (the sheet only). */
function Sleeve({ who }: { who: ReturnType<typeof bowedPlayer> }) {
  const sh = who.look.MAT.shirt;
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(-70, -32.5, 72, 65), 4, 4));
  return (
    <Group>
      <Path path={p}>
        <LinearGradient start={vec(0, -32.5)} end={vec(0, 32.5)} colors={sh.form} positions={sh.pos} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={0.9} color={sh.edge} opacity={0.5} />
    </Group>
  );
}

/** (dev) the lesson's posed skeleton in the drawing's frame. */
function Skeleton({ e, pl }: { e: BowedHandEntry; pl: BowedHandPlaced }) {
  const { P: P0, bow } = poseOf(e);
  const D = drawnHands(P0, bow && P0.strokes.length > 0);
  const ph = pl.side === 'L' ? D.L : D.R;
  if (!ph) return null;
  const pr = (p: { x: number; y: number; z: number }): Pt => (e.view === 'side' ? P(p.x, p.y) : P(p.x, p.z));
  const loc = (q: Pt): Pt => {
    const du = (q.u - pl.x) / pl.s;
    const dv = (q.v - pl.y) / pl.s;
    const c = Math.cos(-pl.rot);
    const s = Math.sin(-pl.rot);
    return P(du * c - dv * s, du * s + dv * c);
  };
  const cols = ['#ffd166', '#ff6b6b', '#06d6a0', '#4cc9f0', '#b388ff'];
  return (
    <Group>
      {[ph.sk.thumb, ...ph.sk.fingers].map((d, i) => {
        const path = Skia.Path.Make();
        d.joints.forEach((j, k) => {
          const q = loc(pr(j));
          if (k) path.lineTo(q.u, q.v);
          else path.moveTo(q.u, q.v);
        });
        return (
          <Group key={i}>
            <Path path={path} style="stroke" strokeWidth={0.8} color={cols[i]} opacity={0.9} />
            {d.joints.map((j, k) => {
              const q = loc(pr(j));
              return <Circle key={k} cx={q.u} cy={q.v} r={1.2} color={cols[i]} />;
            })}
          </Group>
        );
      })}
    </Group>
  );
}

function sceneBox(gs: Group3[], P0: Posture, view: 'side' | 'top'): Box {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  const pl = P0.player;
  for (const j of [pl.head, pl.toeL, pl.toeR, pl.shoulderL, pl.shoulderR, { ...pl.hipL, y: P0.floorY }]) {
    const q = view === 'side' ? P(j.x, j.y) : P(j.x, j.z);
    u0 = Math.min(u0, q.u - 120);
    v0 = Math.min(v0, q.v - 140);
    u1 = Math.max(u1, q.u + 120);
    v1 = Math.max(v1, q.v + 60);
  }
  for (const g of gs)
    for (const it of g.items) {
      if (it.box.u1 <= it.box.u0) continue;
      u0 = Math.min(u0, it.box.u0);
      v0 = Math.min(v0, it.box.v0);
      u1 = Math.max(u1, it.box.u1);
      v1 = Math.max(v1, it.box.v1);
    }
  return { u0: u0 - 60, v0: v0 - 60, u1: u1 + 60, v1: v1 + 60 };
}

function Scene({ gs }: { gs: Group3[] }) {
  return (
    <Group>
      {gs.map((g) => (
        <Group key={g.key}>
          {g.items.map((it, i) => (
            <PaintItem key={i} it={it} />
          ))}
        </Group>
      ))}
    </Group>
  );
}

function Entry({ e, width, dbg }: { e: BowedHandEntry; width: number; dbg: boolean }) {
  const { pl, P: P0, bow } = useMemo(() => placedOf(e), [e]);
  const gs = useMemo(() => sceneGroups(P0, e.view, { bow }), [P0, e.view, bow]);
  const who = bowedPlayer(P0);
  const box = artBox(e.art);
  const bigW = Math.min(width - 24, (box.u1 - box.u0) * 3);
  const L = pl ? pl.L : localLight(0);
  const sb = sceneBox(gs, P0, e.view);
  const lessonW = Math.min(330, Math.floor((width - 34) / 2));
  // (the close look: round the middle of the cuff and the grip)
  const close: Box | null = pl
    ? (() => {
        const g = e.art.grip;
        const c = Math.cos(pl.rot);
        const s = Math.sin(pl.rot);
        const mu = pl.x + (pl.s * (g.u * c - g.v * s)) / 2;
        const mv = pl.y + (pl.s * (g.u * s + g.v * c)) / 2;
        return { u0: mu - 150, v0: mv - 150, u1: mu + 150, v1: mv + 150 };
      })()
    : null;
  return (
    <View style={{ marginBottom: 26 }}>
      <Text style={{ color: INK, fontSize: 15, fontWeight: '700' }}>
        {e.n} — {e.art.title}; used in {e.serves}
        <Text style={{ color: e.status === 'NEW' ? '#7fd3a0' : '#e8c26a' }}> · {e.status}</Text>
      </Text>
      <Text style={{ color: DIM, fontSize: 11, marginTop: 4 }}>
        Top: {e.n} alone, 3 pt per mm. Below, left: at lesson size, in its figure ({e.view === 'side' ? 'side view, from the player’s right' : 'from above'}); right: the same in the lesson’s picture, 1 pt per mm.
      </Text>
      {/* (one canvas per drawing: a page of forty canvases runs the browser out of drawing surfaces) */}
      <OneCanvas
        width={bigW}
        top={{ box, w: bigW }}
        left={{ box: sb, w: lessonW }}
        right={close ? { box: close, w: lessonW } : null}
        topNode={
          <FigureLook look={who.look}>
            <Sleeve who={who} />
            <BowedHandAlone art={e.art} L={L} />
            {dbg && pl ? <Skeleton e={e} pl={pl} /> : null}
          </FigureLook>
        }
        sceneNode={<Scene gs={gs} />}
      />
    </View>
  );
}

type Slot = { box: Box; w: number };
/** The three pictures of one drawing in ONE canvas: the drawing alone on top, the lesson picture and its close look below. */
function OneCanvas({ width, top, left, right, topNode, sceneNode }: { width: number; top: Slot; left: Slot; right: Slot | null; topNode: ReactNode; sceneNode: ReactNode }) {
  const hOf = (s: Slot) => ((s.box.v1 - s.box.v0) * s.w) / (s.box.u1 - s.box.u0);
  const gap = 10;
  const th = hOf(top);
  const bh = Math.max(hOf(left), right ? hOf(right) : 0);
  const W = Math.max(width, left.w + (right ? gap + right.w : 0));
  const H = th + gap + bh;
  const pic = (s: Slot, x: number, y: number, node: ReactNode, key: string) => {
    const k = s.w / (s.box.u1 - s.box.u0);
    const h = hOf(s);
    const clip = Skia.Path.Make();
    clip.addRect(Skia.XYWHRect(x, y, s.w, h));
    return (
      <Group key={key} clip={clip}>
        <Rect x={x} y={y} width={s.w} height={h} color={STAGE} />
        <Group transform={[{ translateX: x - s.box.u0 * k }, { translateY: y - s.box.v0 * k }, { scale: k }]}>
          <FigureScale ptPerMm={k}>{node}</FigureScale>
        </Group>
      </Group>
    );
  };
  return (
    <Canvas style={{ width: W, height: H, marginTop: 6 }}>
      {pic(top, 0, 0, topNode, 'top')}
      {pic(left, 0, th + gap, sceneNode, 'left')}
      {right ? pic(right, left.w + gap, th + gap, sceneNode, 'right') : null}
    </Canvas>
  );
}

export function BowedSheetStudy({ only }: { only: string }) {
  const { width } = useWindowDimensions();
  const dbg = only.endsWith('-dbg');
  const n = Number(only.replace(/-dbg$/, '').replace(/^sheet-bowed-?/, '')) || 0;
  const list = n ? BOWED_HANDS.filter((e) => e.n === n) : BOWED_HANDS;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700' }}>Bowed strings — every hand, one sheet</Text>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 4, marginBottom: 14 }}>
        Violin, viola, cello and double bass (C09a, C09b, C09c, C06a, C06b). Each hand drawn alone and large, then at the lesson’s size in its figure. Please mark each number pass or fail.
      </Text>
      {list.map((e) => (
        <Entry key={e.n} e={e} width={width} dbg={dbg} />
      ))}
    </ScrollView>
  );
}
