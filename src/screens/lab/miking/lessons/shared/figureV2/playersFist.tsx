/**
 * FIGURE V2 — A PLAYER'S FIST ROUND A ROD, READABLE AT LESSON SIZE (builder "PercFoley3", second review
 * 2026-11-24, tier A root cause: "at about 0.3 to 0.5 pt/mm the gripping hand is drawn by a low-detail path that
 * is a featureless wedge / mitten / paddle. A gripping hand at these sizes must still read as a hand: the fist's
 * silhouette with the thumb's bump on its side of the object, the knuckle line, two or three finger creases, the
 * object entering and leaving the fist").
 *
 * The hand is the APPROVED 3-D grip (heldHands placeGrip, unchanged: the rod in the palm, the four fingers round
 * one edge, the thumb round the OTHER). The mic hand's painter (heldHandV2) unites each layer into one silhouette:
 * right for a mic handle seen across its length at close-up sizes, the views it was approved in; seen along the rod,
 * or at a third of a point per mm, the united layers read as one block. Here, as the boom builder's fist
 * (boomFist.fistForms, read only), each digit is its own SOLID form painted in true depth order, so the curl of the
 * nearest finger, the thumb on its own side and the knuckle end read as a fist:
 *   1. what lies behind the rod, farthest first; 2. the rod (whole: a mallet's head and shaft stay drawn);
 *   3. what lies in front of it, farthest first; 4. one outline round each layer.
 * A digit's own line is drawn only where it leaves the palm (never round a finger where it meets the hand), and
 * every line is held to about half a point wide on the page whatever the scale, so the fingers stay told apart at
 * lesson size. Where the back of the hand faces the viewer: low broad swells of light over the knuckles inside the
 * one edge (the mic hand's approved back view), never a row of round bumps on the outline.
 */
import { Fragment, type ReactNode } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { Blur, useFigureScale } from './detail';
import { LIGHT, type Pt } from './geom.ts';
import { Form } from './paint';
import { smoothClosed, smoothOpen, unionOf, type SkPath } from './paths.ts';
import { fistForms } from './boomFist';
import type { GripPart, L3, PlacedGrip } from './heldHands.ts';
import { useLook } from './look';
import { gripSilhouette } from './heldHandV2';
import { gripToPage } from './playersGrip.ts';

/** A line at least about this many points wide on the page (mm at the drawn scale otherwise). */
const MIN_LINE_PT = 0.5;
/** Swells of light over the knuckles: off (seen from above they sat at the fist's front edge as a row of pale
 *  dots; the fingers' own forms already make the knuckle end read). */
const KNUCKLE_LIGHTS = false;

/** The fist round its rod: the forms behind it, the rod, the forms in front. */
export function PlayerFist({ g, toPage, rod, plate }: { g: PlacedGrip; toPage: (l: L3) => Pt; rod?: ReactNode; /** the rod is the edge of a PLATE (a clipboard) seen from its near face (this outline on the page): the four
   *  fingers lie on its far face, hidden where the plate covers them (the thumb on the near face stays in view) */ plate?: SkPath }) {
  const { MAT, HAND } = useLook();
  const sc = useFigureScale();
  const lite = sc.level === 'lite';
  const pt = sc.ptPerMm ?? 0.25;
  const lw = Math.max(1.1, MIN_LINE_PT / pt);
  const F = fistForms(g, toPage);
  const by = (k: 'behind' | 'front') => F.items.filter((i) => i.layer === k).sort((a, b) => a.depth - b.depth);
  type Item = (typeof F.items)[number];
  const draw = (i: Item) => {
    if (i.kind === 'bed')
      return (
        <Group>
          <Path path={i.path}>
            <LinearGradient start={vec(i.axis[0].u, i.axis[0].v)} end={vec(i.axis[1].u, i.axis[1].v)} colors={[HAND[1], HAND[2]]} />
          </Path>
          <Path path={i.path} color={MAT.skin.deep} opacity={0.28} />
        </Group>
      );
    const b = i.path.getBounds();
    const c = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
    return (
      <Group>
        {lite ? (
          <Path path={i.path}>
            <LinearGradient start={vec(c.u + LIGHT.u * 40, c.v + LIGHT.v * 40)} end={vec(c.u - LIGHT.u * 40, c.v - LIGHT.v * 40)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
          </Path>
        ) : (
          <Group>
            {i.kind === 'digit' ? (
              // (a finger's soft shadow on what lies under it)
              <Group clip={F.all}>
                <Group transform={[{ translateX: -LIGHT.u * 2.2 }, { translateY: -LIGHT.v * 2.2 }]}>
                  <Path path={i.path} color="#2a160e" opacity={0.32}>
                    <Blur mm={2.2} />
                  </Path>
                </Group>
              </Group>
            ) : null}
            <Form path={i.path} mat={MAT.skin} axis={i.axis} w={i.w} rim={i.kind === 'palm' ? 5 : 2} edge={0} />
          </Group>
        )}
        {i.kind === 'digit' ? (
          // (its own line only where it leaves the palm: the fingers told apart, never a closed pill on the hand)
          <Group clip={F.palm} invertClip>
            <Group clip={F.all}>
              <Path path={i.path} style="stroke" strokeWidth={lw * 1.2} strokeJoin="round" color={MAT.skin.edge} opacity={0.34} />
            </Group>
          </Group>
        ) : null}
      </Group>
    );
  };
  // (a plate's far face: the four fingers and the skin between them)
  const isFinger = (i: Item) => (i.kind === 'digit' && !i.key.startsWith('thumb')) || i.kind === 'bed';
  const outline = (k: 'behind' | 'front', keep: (i: Item) => boolean) => {
    const ps = F.items.filter((i) => i.layer === k && i.kind !== 'bed' && keep(i)).map((i) => i.path);
    return ps.length ? <Path path={unionOf(...ps)} style="stroke" strokeWidth={lw} strokeJoin="round" color={MAT.skin.edge} opacity={0.6} /> : null;
  };
  const body = (keep: (i: Item) => boolean) => (
    <Group>
      {by('behind')
        .filter(keep)
        .map((i) => (
          <Fragment key={i.key}>{draw(i)}</Fragment>
        ))}
      {outline('behind', keep)}
      {rod ?? null}
      {by('front')
        .filter(keep)
        .map((i) => (
          <Fragment key={i.key}>{draw(i)}</Fragment>
        ))}
      {outline('front', keep)}
      {KNUCKLE_LIGHTS ? <Knuckles g={g} toPage={toPage} /> : null}
    </Group>
  );
  if (!plate) return body(() => true);
  // (outside the plate the whole fist; over it, only what lies on its near face — the palm's heel and the thumb)
  return (
    <Group>
      <Group clip={plate} invertClip>
        {body(() => true)}
      </Group>
      <Group clip={plate}>{body((i) => !isFinger(i))}</Group>
    </Group>
  );
}

/** Below this scale (pt/mm) the cues are added; at and above it the approved painter is left exactly as it is. */
const CUES_UNTIL = 0.9;
const cuePaths = new WeakMap<PlacedGrip, Map<GripPart, { path: SkPath; gapsTip: SkPath; gapsRun: SkPath; edge: SkPath | null }>>();
function cuesOf(h: PlacedGrip) {
  let m = cuePaths.get(h);
  if (m) return m;
  m = new Map();
  for (const q of h.parts) {
    const gapsTip = Skia.Path.Make();
    const gapsRun = Skia.Path.Make();
    // (a gap wedge: [inner end, …, the tip's two corners and its end, …]: its centre line from the inner end to the
    // tip; the half toward the tip again, darker — the crease opens at the tip and runs out toward the knuckles)
    for (const g of q.gaps) {
      if (g.length < 4) continue;
      const a = g[0];
      const t = g[3];
      const mid = { u: a.u + (t.u - a.u) * 0.5, v: a.v + (t.v - a.v) * 0.5 };
      gapsRun.moveTo(a.u, a.v);
      gapsRun.lineTo(t.u, t.v);
      gapsTip.moveTo(mid.u, mid.v);
      gapsTip.lineTo(t.u, t.v);
    }
    m.set(q, {
      path: unionOf(...q.pieces.map((p) => smoothClosed(p, q.kind === 'digit' ? 0.5 : 0.45))),
      gapsTip,
      gapsRun,
      edge: q.edge ? smoothOpen(q.edge) : null,
    });
  }
  cuePaths.set(h, m);
  return m;
}

/**
 * (round 3) The approved mic hand's painter (heldHandV2, unchanged) seen ACROSS its rod at lesson sizes: its finger
 * gaps (≈ 2 mm wedges), the thumb's own line and each layer's outline (0.9 mm) are under half a point there, so the
 * fist read as a wedge or a mitten. Over it, below `CUES_UNTIL`, the same lines held to about half a point: the
 * creases between the fingers from their tips (darker at the tip, running out toward the knuckles), the thumb's line
 * where it leaves the palm, the layer's one outline. `layer`: only that layer's parts (the rod lies between).
 */
export function GripCues({ h, layer }: { h: PlacedGrip; layer?: 'behind' | 'front' }) {
  const { MAT } = useLook();
  const sc = useFigureScale();
  const pt = sc.ptPerMm ?? 0.25;
  if (pt >= CUES_UNTIL) return null;
  const lw = MIN_LINE_PT / pt;
  const C = cuesOf(h);
  const parts = h.parts.filter((p) => !layer || p.layer === layer);
  if (!parts.length) return null;
  const sil = unionOf(...parts.map((p) => C.get(p)!.path));
  return (
    <Group>
      {parts.map((p, i) => {
        const c = C.get(p)!;
        return (
          <Group key={i}>
            <Group clip={c.path}>
              <Path path={c.gapsRun} style="stroke" strokeWidth={lw * 0.7} strokeCap="round" color={MAT.skin.deep} opacity={0.4} />
              <Path path={c.gapsTip} style="stroke" strokeWidth={lw * 1.1} strokeCap="round" color={MAT.skin.deep} opacity={0.55} />
            </Group>
            {c.edge ? <Path path={c.edge} style="stroke" strokeWidth={lw * 0.9} strokeCap="round" color={MAT.skin.edge} opacity={0.5} /> : null}
          </Group>
        );
      })}
      <Path path={sil} style="stroke" strokeWidth={lw} strokeJoin="round" color={MAT.skin.edge} opacity={0.45} />
    </Group>
  );
}

/**
 * (round 3, "a square patch over the wrist and a black notch between cuff and hand") Under the hand: the arm's own
 * wrist stub and the cuff's opening filled with the hand's own skin, in the very light the hand's palm is painted
 * with (heldHandV2's gradient over the grip's box; the fist painter's palm form), so the wrist comes out of the cuff
 * as one skin — no darker stub with its own edge beside the hand's wrist, no dark sleeve inside showing past it.
 */
export function GripPlug({ h, path, fist }: { h: PlacedGrip; path: SkPath; fist: boolean }) {
  const { MAT, HAND } = useLook();
  const tp = fist ? gripToPage(h) : null;
  if (tp) {
    const palm = h.parts.find((p) => p.name === 'palm');
    return <Form path={path} mat={MAT.skin} axis={palm ? palm.axis : undefined} w={40} rim={0} edge={0} />;
  }
  const b = gripSilhouette(h).getBounds();
  const m = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
  return (
    <Path path={path}>
      <LinearGradient start={vec(m.u - 0.32 * 56, m.v - 0.95 * 56)} end={vec(m.u + 0.32 * 56, m.v + 0.95 * 56)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
}

/** The plug's region for an arm: its wrist stub and its cuff's opening drawn in to `k` about the opening's centre
 *  (the far rim's cloth edge still shows round the wrist). */
export function plugOf(wristSkin: SkPath, opening: SkPath, c: Pt, k = 0.86): SkPath {
  const o = opening.copy();
  o.transform(Skia.Matrix().translate(c.u, c.v).scale(k, k).translate(-c.u, -c.v));
  return unionOf(wristSkin, o);
}

/** The fist's whole outline. */
export const playerFistSilhouette = (g: PlacedGrip, toPage: (l: L3) => Pt) => fistForms(g, toPage).all;

/**
 * Where the back of the hand faces the viewer: four low broad swells of light over the knuckles and the soft
 * valley line just past them where the fingers fold down — inside the hand's own outline, nothing past it.
 */
function Knuckles({ g, toPage }: { g: PlacedGrip; toPage: (l: L3) => Pt }) {
  const { MAT } = useLook();
  const v = g.view.toward;
  if (v.n < 0.15 || Math.abs(v.w) > 0.55) return null;
  const ks = g.model.knuckles;
  const sil = fistForms(g, toPage).all;
  const swell = Skia.Path.Make();
  ks.forEach((k) => {
    const c = toPage({ u: k.c.u - 4, w: k.c.w, n: k.c.n + 6 });
    swell.addOval(Skia.XYWHRect(c.u - 8, c.v - 7, 16, 14));
  });
  return (
    <Group clip={sil}>
      <Path path={swell} color={MAT.skin.rim} opacity={0.3}>
        <Blur mm={2.6} />
      </Path>
    </Group>
  );
}
