/**
 * C12 CLAVINET — the look (charter §2 layer 3), in millimetres of frame C:
 * side u = x, v = y (the amplifier cut open through its speaker, the grille
 * at the right, facing the mic); top u = x, v = z (from above).
 *
 *   SIDE  the cabinet's walls in section, the grille cloth over the baffle,
 *         the 12-inch speaker in section (frame, cone, dust cap, magnet); the
 *         combo's chassis along the top with its tubes hanging at the back
 *         and its partly open back; the closed cabinet's back panel.
 *   TOP   the cabinet from above, the speaker's section, the handle.
 * Plus, for the stage plan: the clavinet, the keyboardist and the pedals
 * from above. Light from the upper left; nothing moves (D8); paths built once.
 */
import { Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampBox, GRILLE_X, LAYOUT, SPEAKER, type AmpBox } from './ampSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const TOLEX = ['#3a3b42', '#24252b', '#141519'];
const CLOTH = ['#b8a27a', '#9a865f', '#6e5f43'];
const PAPER = ['#5d554c', '#443d36', '#2c2723'];
const STEEL = ['#c9ced6', '#8d939d', '#565b63'];
const WOOD = ['#c79a5e', '#9a6c35', '#6a4620'];
const WALL = 18;

const kindOf = (v: VariantId) => (v === 'cab' ? 'cab' : 'combo');

/** The speaker in section (local: x = 0 at the baffle front, r across). */
function speakerSection(p: SkPath, cone: SkPath, dust: SkPath, magnet: SkPath) {
  const R = SPEAKER.rCone.mm;
  const rD = SPEAKER.rDust.mm;
  const rCoil = 22;
  const xApex = -97;
  const xEdge = -WALL - 4;
  // The frame (basket): two flanges behind the baffle and the struts.
  for (const s of [-1, 1]) {
    p.addRect(Skia.XYWHRect(-WALL - 6, s > 0 ? R : -R - 13, 6, 13));
    p.moveTo(-WALL - 6, s * (R + 6));
    p.lineTo(xApex - 2, s * 70);
    p.lineTo(xApex - 2, s * 30);
  }
  // The cone: from the surround to the coil, slightly curved.
  for (const s of [-1, 1]) {
    cone.moveTo(xEdge, s * R);
    cone.quadTo(xEdge - 30, s * (R * 0.55), xApex + 6, s * rCoil);
    cone.lineTo(xApex + 14, s * rCoil);
    cone.quadTo(xEdge - 18, s * (R * 0.55), xEdge + 8, s * (R - 4));
    cone.close();
  }
  dust.addArc(Skia.XYWHRect(xEdge - 62 - rD * 0.45, -rD, rD * 0.9, rD * 2), -90, 180);
  dust.close();
  magnet.addRRect(Skia.RRectXY(Skia.XYWHRect(xApex - 38, -78, 38, 156), 6, 6));
}

type Built = Record<string, SkPath>;
const cache = new Map<string, Built>();
function sidePaths(b: AmpBox): Built {
  const key = `s${b.kind}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const o: Built = {};
  o.walls = make();
  o.walls.addRect(Skia.XYWHRect(b.x0, b.y0, b.x1 - b.x0, WALL)); // top
  o.walls.addRect(Skia.XYWHRect(b.x0, b.y1 - WALL, b.x1 - b.x0, WALL)); // bottom
  // The baffle (behind the grille), with its cut-out.
  const R = SPEAKER.rCone.mm;
  o.walls.addRect(Skia.XYWHRect(-WALL, b.y0 + WALL, WALL, -R - (b.y0 + WALL)));
  o.walls.addRect(Skia.XYWHRect(-WALL, R, WALL, b.y1 - WALL - R));
  // The back: closed, or panels above and below the opening.
  o.back = make();
  if (b.open) {
    o.back.addRect(Skia.XYWHRect(b.x0, b.y0 + WALL, WALL, b.openY0 - b.y0 - WALL));
    o.back.addRect(Skia.XYWHRect(b.x0, b.openY1, WALL, b.y1 - WALL - b.openY1));
  } else {
    o.back.addRect(Skia.XYWHRect(b.x0, b.y0 + WALL, WALL, b.y1 - b.y0 - 2 * WALL));
  }
  o.inside = make();
  o.inside.addRect(Skia.XYWHRect(b.x0 + WALL, b.y0 + WALL, -WALL - b.x0 - WALL, b.y1 - b.y0 - 2 * WALL));
  o.cloth = make();
  o.cloth.addRect(Skia.XYWHRect(0, b.y0 + 6, GRILLE_X, b.y1 - b.y0 - 12));
  o.frame = make();
  o.cone = make();
  o.dust = make();
  o.magnet = make();
  speakerSection(o.frame, o.cone, o.dust, o.magnet);
  o.chassis = make();
  o.tubes = make();
  o.panel = make();
  if (b.chassis) {
    o.chassis.addRect(Skia.XYWHRect(b.x0 + WALL + 4, b.chassis.y0 + WALL, -WALL - 8 - (b.x0 + WALL + 4), 26));
    for (const [x, l] of [
      [-200, 70],
      [-165, 70],
      [-128, 58],
    ] as const)
      o.tubes.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 13, b.chassis.y0 + WALL + 26, 26, l), 12, 12));
    o.panel.addRect(Skia.XYWHRect(-WALL - 8, b.chassis.y0 + WALL, 10, b.chassis.y1 - b.chassis.y0 - WALL));
  }
  o.handle = make();
  const hx = (b.x0 + b.x1) / 2;
  o.handle.addRRect(Skia.RRectXY(Skia.XYWHRect(hx - 90, b.y0 - 22, 180, 22), 10, 10));
  o.floor = make();
  o.floor.moveTo(-2000, b.y1);
  o.floor.lineTo(3000, b.y1);
  cache.set(key, o);
  return o;
}

function topPaths(b: AmpBox): Built {
  const key = `t${b.kind}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const o: Built = {};
  o.cab = make();
  o.cab.addRRect(Skia.RRectXY(Skia.XYWHRect(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0), 14, 14));
  o.cloth = make();
  o.cloth.addRect(Skia.XYWHRect(0, b.z0 + 10, GRILLE_X, b.z1 - b.z0 - 20));
  o.handle = make();
  const hx = (b.x0 + b.x1) / 2;
  o.handle.addRRect(Skia.RRectXY(Skia.XYWHRect(hx - 20, -90 + (b.z0 + b.z1) / 2, 40, 180), 12, 12));
  o.frame = make();
  o.cone = make();
  o.dust = make();
  o.magnet = make();
  speakerSection(o.frame, o.cone, o.dust, o.magnet);
  cache.set(key, o);
  return o;
}

function Speaker({ o }: { o: Built }) {
  const R = SPEAKER.rCone.mm;
  return (
    <Group>
      <Path path={o.frame} style="stroke" strokeWidth={5} color="#7d838c" />
      <Path path={o.cone}>
        <LinearGradient start={vec(-20, -R)} end={vec(-100, R)} colors={PAPER} />
      </Path>
      <Path path={o.cone} style="stroke" strokeWidth={4} color="#8a7f72" />
      <Path path={o.dust} color="#26221f" />
      <Path path={o.magnet}>
        <LinearGradient start={vec(-135, -78)} end={vec(-97, 78)} colors={STEEL} />
      </Path>
    </Group>
  );
}

export function AmpSide({ variant, dim = 1 }: { variant: VariantId; dim?: number }) {
  const b = ampBox(kindOf(variant));
  const o = sidePaths(b);
  return (
    <Group opacity={dim}>
      <Path path={o.floor} style="stroke" strokeWidth={4} color="#3b3d44" />
      <Path path={o.inside} color="#0d0d10" />
      <Path path={o.walls}>
        <LinearGradient start={vec(b.x0, b.y0)} end={vec(b.x1, b.y1)} colors={WOOD} />
      </Path>
      <Path path={o.back}>
        <LinearGradient start={vec(b.x0, b.y0)} end={vec(b.x0 + WALL, b.y1)} colors={WOOD} />
      </Path>
      <Path path={o.handle} color="#2b2c31" />
      <Speaker o={o} />
      {b.chassis ? (
        <Group>
          <Path path={o.chassis}>
            <LinearGradient start={vec(b.x0, b.chassis.y0)} end={vec(0, b.chassis.y0 + 40)} colors={STEEL} />
          </Path>
          <Path path={o.tubes}>
            <RadialGradient c={vec(-170, b.chassis.y0 + 70)} r={90} colors={['#ffd9a0', '#c98d4a', '#5a3a1c']} />
          </Path>
          <Path path={o.panel} color="#d7d9dd" />
        </Group>
      ) : null}
      <Path path={o.cloth}>
        <LinearGradient start={vec(0, b.y0)} end={vec(GRILLE_X, b.y1)} colors={CLOTH} />
      </Path>
    </Group>
  );
}

export function AmpTop({ variant, dim = 1 }: { variant: VariantId; dim?: number }) {
  const b = ampBox(kindOf(variant));
  const o = topPaths(b);
  return (
    <Group opacity={dim}>
      <Path path={o.cab}>
        <LinearGradient start={vec(b.x0, b.z0)} end={vec(b.x1, b.z1)} colors={TOLEX} />
      </Path>
      <Path path={o.cab} style="stroke" strokeWidth={4} color="#55575f" />
      <Group opacity={0.55}>
        <Speaker o={o} />
      </Group>
      <Path path={o.handle} color="#4a4b52" />
      <Path path={o.cloth}>
        <LinearGradient start={vec(0, b.z0)} end={vec(GRILLE_X, b.z1)} colors={CLOTH} />
      </Path>
    </Group>
  );
}

/* ── the clavinet, the keyboardist and the pedals from above (stage plan) ── */
let planCache: Built | null = null;
function planPaths(): Built {
  if (planCache) return planCache;
  const o: Built = {};
  const c = LAYOUT.clav;
  o.case = make();
  o.case.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0), 24, 24));
  o.keys = make();
  o.black = make();
  const n = 35;
  const kw = (c.z1 - c.z0 - 80) / n;
  for (let i = 0; i < n; i++) o.keys.addRect(Skia.XYWHRect(c.x0 + 20, c.z0 + 40 + i * kw + 1, 140, kw - 2));
  for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) o.black.addRect(Skia.XYWHRect(c.x0 + 70, c.z0 + 40 + (i + 0.68) * kw, 90, kw * 0.62));
  o.legs = make();
  for (const [x, z] of [
    [c.x0 + 40, c.z0 + 40],
    [c.x1 - 40, c.z0 + 40],
    [c.x0 + 40, c.z1 - 40],
    [c.x1 - 40, c.z1 - 40],
  ])
    o.legs.addCircle(x, z, 18);
  const p = LAYOUT.player;
  o.body = make();
  o.body.addOval(Skia.XYWHRect(p.x - 140, p.z - 240, 280, 480));
  o.arms = make();
  for (const s of [-1, 1]) o.arms.addRRect(Skia.RRectXY(Skia.XYWHRect(p.x + 40, p.z + s * 200 - 45, 260, 90), 40, 40));
  o.head = make();
  o.head.addCircle(p.x + 10, p.z, 100);
  const q = LAYOUT.pedals;
  o.pedals = make();
  for (let i = 0; i < 3; i++) o.pedals.addRRect(Skia.RRectXY(Skia.XYWHRect(q.x - 60 + i * 0, q.z - 60 + i * 150, 110, 130), 14, 14));
  o.cable = make();
  o.cable.moveTo(c.x0 + 60, c.z1 - 30);
  o.cable.cubicTo(c.x0 - 40, c.z1 + 80, q.x + 60, q.z - 120, q.x + 50, q.z - 30);
  o.cable.moveTo(q.x - 60, q.z + 330);
  o.cable.cubicTo(q.x - 300, q.z + 600, 300, 200, 15, 120);
  planCache = o;
  return o;
}

export function ClavinetPlan({ dim = 1 }: { dim?: number }) {
  const o = planPaths();
  const c = LAYOUT.clav;
  return (
    <Group opacity={dim}>
      <Path path={o.cable} style="stroke" strokeWidth={10} color="#2a2b30" />
      <Path path={o.legs} color="#9aa0ab" />
      <Path path={o.case}>
        <LinearGradient start={vec(c.x0, c.z0)} end={vec(c.x1, c.z1)} colors={['#4a4038', '#2e2722', '#1c1815']} />
      </Path>
      <Path path={o.keys} color="#ece8de" />
      <Path path={o.black} color="#1a1a1c" />
      <Path path={o.pedals}>
        <LinearGradient start={vec(LAYOUT.pedals.x - 60, 0)} end={vec(LAYOUT.pedals.x + 60, 0)} colors={['#d24b3c', '#9c2f25']} />
      </Path>
      <Path path={o.arms} color="#3c4252" />
      <Path path={o.body} color="#2f3542" />
      <Path path={o.head} color="#6e5d4f" />
    </Group>
  );
}

export function AmpArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  return view === 'side' ? <AmpSide variant={variant} /> : <AmpTop variant={variant} />;
}

export function ampLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const b = ampBox(kindOf(variant));
  const R = SPEAKER.rCone.mm;
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'grille', text: 'GRILLE', u: GRILLE_X + 40, v: b.y0 + 40, align: 'left' },
      { id: 'cone', text: 'SPEAKER CONE', short: 'CONE', u: -70, v: R + 40, align: 'center' },
      { id: 'dust', text: 'DUST CAP', u: GRILLE_X + 40, v: 0, align: 'left', tone: 'muted' },
      { id: 'back', text: b.open ? 'OPEN BACK' : 'CLOSED BACK', u: b.x0 - 30, v: b.open ? (b.openY0 + b.openY1) / 2 : 0, align: 'right', tone: 'muted' },
    ];
    if (b.chassis) out.push({ id: 'chassis', text: 'CHASSIS · TUBES', short: 'TUBES', u: (b.x0 + b.x1) / 2, v: b.y0 - 60, align: 'center', tone: 'muted' });
    return out;
  }
  return [
    { id: 'grille', text: 'GRILLE', u: GRILLE_X + 40, v: b.z0 + 40, align: 'left' },
    { id: 'cab', text: 'CABINET', u: (b.x0 + b.x1) / 2, v: b.z1 + 60, align: 'center' },
    { id: 'spk', text: 'SPEAKER', u: -70, v: R + 60, align: 'center', tone: 'muted' },
  ];
}

export function ampHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const b = ampBox(kindOf(variant));
  const pre = b.kind === 'combo' ? 'co' : 'cb';
  const R = SPEAKER.rCone.mm;
  const w = v;
  const lo = view === 'side' ? b.y0 : b.z0;
  const hi = view === 'side' ? b.y1 : b.z1;
  if (u >= -tol && u <= GRILLE_X + tol && w >= lo && w <= hi) return 'grille';
  if (u < 0 && u > -150 && Math.abs(w) <= R + tol) return Math.abs(w) <= SPEAKER.rDust.mm && u > -100 ? 'dust' : 'cone';
  if (view === 'side' && b.chassis && w <= b.chassis.y1 + 70 && w >= b.y0 && u >= b.x0 + WALL && u < -WALL) return 'co.chassis';
  if (view === 'side' && u >= b.x0 - tol && u <= b.x0 + WALL + tol && w >= lo && w <= hi) return `${pre}.back`;
  if (u >= b.x0 && u <= b.x1 && w >= lo - 25 && w <= hi) return `${pre}.cab`;
  return null;
}

export const CLAV_BASE_ART: Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest'> = {
  Instrument: AmpArt,
  labels: ampLabels,
  hitTest: ampHitTest,
};
