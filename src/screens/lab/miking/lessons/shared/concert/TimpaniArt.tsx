/**
 * A TIMPANO (one kettledrum), drawn at the house standard for Lab 1's
 * concert lessons: the copper bowl (the kettle), the coated head, the chrome
 * counterhoop with its T-handled tension rods, the suspension ring the bowl
 * hangs in, the legs with their casters, and the pedal on the player's side.
 *
 *   TimpanoSide     side view, uncut (the placement scenes)
 *   TimpanoSection  side view, CUT OPEN through the head's centre (HOW IT
 *                   SOUNDS: the air in the bowl under the head)
 *   TimpanoTop      from above (the lesson's top view, the orchestra plan)
 *
 * SIZES: the head diameter is sourced (timpani/SOURCES.md, the lesson
 * passes it in). The bowl's shape and depth, the rod count, the ring, the
 * legs and the pedal are DRAWING DEFAULTS (timpani/GEOMETRY_PROPOSAL.md:
 * kettle height UNKNOWN); the lesson lists them in its unknowns. Static
 * (D8); paths built once per size and cached.
 */
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { bowlDepth, bowlRadiusAt, TIMPANO_DRAW } from './timpanoSpec.ts';
import { CHROME, CHROME_V, COPPER, COPPER_POS, HEAD_COATED, INK, make, oval, rect, rrect, seg, type SkPath } from './paths.ts';

/** The bowl outline in a side view: a rounded bowl hanging from y0 (the
 *  lip), radius Rb, depth Db; x across about 0. */
function bowlPath(Rb: number, y0: number, Db: number): SkPath {
  const p = make();
  const N = 28;
  p.moveTo(-Rb, y0);
  for (let i = 1; i <= N; i++) {
    const s = (i / N) * Db;
    const r = Rb * Math.pow(Math.max(0, 1 - Math.pow(s / Db, 2.4)), 1 / 2.4);
    p.lineTo(-r, y0 + s);
  }
  for (let i = N; i >= 0; i--) {
    const s = (i / N) * Db;
    const r = Rb * Math.pow(Math.max(0, 1 - Math.pow(s / Db, 2.4)), 1 / 2.4);
    p.lineTo(r, y0 + s);
  }
  p.close();
  return p;
}

type SideParts = ReturnType<typeof buildSide>;
const sideCache = new Map<string, SideParts>();

function buildSide(R: number, headY: number, floorY: number, cut: boolean) {
  const D = TIMPANO_DRAW;
  const Rb = R + D.lip;
  const Db = bowlDepth(R);
  const lipY = headY + 6;
  const bowl = bowlPath(Rb, lipY, Db);
  // The inner surface of the bowl, seen through the cut (a little smaller).
  const inner = bowlPath(Rb - 5, lipY + 2, Db - 6);
  const ringY = lipY + Db * D.ringK;
  const ringR = bowlRadiusAt(Rb, Db, Db * D.ringK) + 14;
  const ring = rrect(make(), -ringR, ringY - 9, ringR, ringY + 9, 4);
  const hoop = cut
    ? rrect(rrect(make(), -R - 2 - D.hoopT, headY - D.hoopUp, -R - 2, headY + D.hoopDown, 2), R + 2, headY - D.hoopUp, R + 2 + D.hoopT, headY + D.hoopDown, 2)
    : rrect(make(), -R - 2 - D.hoopT, headY - D.hoopUp, R + 2 + D.hoopT, headY + D.hoopDown, 3);
  const head = rect(make(), -R - 1, headY - 2.5, R + 1, headY + 2.5);
  // Tension rods: the near half's rods (uncut: every rod with a visible
  // front; cut: the two at the silhouette), from the T-handle down to the ring.
  const rods = make();
  const tees = make();
  for (let k = 0; k < D.rods; k++) {
    const a = (k / D.rods) * 2 * Math.PI + Math.PI / D.rods;
    const c = Math.cos(a);
    const s = Math.sin(a);
    if (cut ? Math.abs(c) < 0.9 || s > 0.05 : s < 0.05) continue;
    const x = c * (R + 2 + D.hoopT + 10);
    seg(rods, x, headY - D.hoopUp - 6, x, ringY);
    rrect(tees, x - 15, headY - D.hoopUp - 16, x + 15, headY - D.hoopUp - 6, 3);
  }
  // Legs (side projection of the three legs) with casters at the floor.
  const legsP = make();
  const casters = make();
  for (const deg of D.legsDeg) {
    const a = (deg * Math.PI) / 180;
    const x0 = Math.cos(a) * ringR * 0.9;
    const x1 = Math.cos(a) * (R + D.footOut);
    seg(legsP, x0, ringY + 6, x1, floorY - 34);
    oval(casters, x1, floorY - 17, 17, 17);
  }
  // The pedal on the player's side (−x): a sloped footboard and its rod up
  // to the bowl's base mechanism.
  const P = D.pedal;
  const board = make();
  board.moveTo(-R - P.gap - P.len, floorY - 10);
  board.lineTo(-R - P.gap, floorY - 62);
  board.lineTo(-R - P.gap + 18, floorY - 48);
  board.lineTo(-R - P.gap - P.len + 14, floorY - 2);
  board.close();
  const pedalRod = seg(make(), -R - P.gap + 4, floorY - 58, -R * 0.35, lipY + Db * 0.92);
  const shadow = oval(make(), 0, floorY + 2, R + D.footOut + 40, 12);
  return { R, Rb, Db, lipY, ringY, ringR, bowl, inner, ring, hoop, head, rods, tees, legsP, casters, board, pedalRod, shadow };
}

function side(R: number, headY: number, floorY: number, cut: boolean): SideParts {
  const k = `${R}:${headY}:${floorY}:${cut ? 1 : 0}`;
  let g = sideCache.get(k);
  if (!g) {
    g = buildSide(R, headY, floorY, cut);
    sideCache.set(k, g);
  }
  return g;
}

/** One timpano from the side (uncut), centred at u = 0 (place it with a
 *  translate). `dim` < 1 recedes a drum behind another. */
export function TimpanoSide({ R, headY, floorY, dim = 1 }: { R: number; headY: number; floorY: number; dim?: number }) {
  const g = side(R, headY, floorY, false);
  return (
    <Group opacity={dim}>
      <Path path={g.shadow} color="#000" opacity={0.55}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <Path path={g.legsP} style="stroke" strokeWidth={14} strokeCap="round" color="#1b1c21" />
      <Path path={g.legsP} style="stroke" strokeWidth={9} strokeCap="round" color="#8a8f99" />
      <Path path={g.casters} color="#16171b" />
      <Path path={g.casters} style="stroke" strokeWidth={2.5} color="#6c717c" />
      <Path path={g.pedalRod} style="stroke" strokeWidth={6} strokeCap="round" color="#3a3d45" />
      <Path path={g.board}>
        <LinearGradient start={vec(-R - 260, floorY)} end={vec(-R, floorY - 60)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      <Path path={g.board} style="stroke" strokeWidth={1.2} color={INK} />
      {/* the copper bowl, lit from the upper left, a hammered sheen */}
      <Path path={g.bowl}>
        <LinearGradient start={vec(-g.Rb, 0)} end={vec(g.Rb, 0)} colors={COPPER} positions={COPPER_POS} />
      </Path>
      <Path path={g.bowl}>
        <RadialGradient c={vec(-g.Rb * 0.45, g.lipY + g.Db * 0.2)} r={g.Rb * 1.1} colors={['rgba(255,220,180,0.22)', 'rgba(255,220,180,0)']} />
      </Path>
      <Path path={g.bowl} style="stroke" strokeWidth={1.4} color="#2a0e05" />
      <Path path={g.ring}>
        <LinearGradient start={vec(0, g.ringY - 9)} end={vec(0, g.ringY + 9)} colors={CHROME_V} />
      </Path>
      <Path path={g.ring} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={g.rods} style="stroke" strokeWidth={4.5} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.6} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.tees} color="#c6cad4" />
      <Path path={g.hoop}>
        <LinearGradient start={vec(-R, headY - 22)} end={vec(R, headY + 14)} colors={CHROME} />
      </Path>
      <Path path={g.hoop} style="stroke" strokeWidth={0.8} color={INK} />
    </Group>
  );
}

/** One timpano CUT OPEN through the head's centre (the air in the bowl). */
export function TimpanoSection({ R, headY, floorY }: { R: number; headY: number; floorY: number }) {
  const g = side(R, headY, floorY, true);
  return (
    <Group>
      <Path path={g.shadow} color="#000" opacity={0.55}>
        <BlurMask blur={10} style="normal" />
      </Path>
      <Path path={g.legsP} style="stroke" strokeWidth={14} strokeCap="round" color="#1b1c21" />
      <Path path={g.legsP} style="stroke" strokeWidth={9} strokeCap="round" color="#8a8f99" />
      <Path path={g.casters} color="#16171b" />
      <Path path={g.pedalRod} style="stroke" strokeWidth={6} strokeCap="round" color="#3a3d45" />
      <Path path={g.board}>
        <LinearGradient start={vec(-R - 260, floorY)} end={vec(-R, floorY - 60)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      {/* the bowl's wall cut open: copper outside, the dark inner surface, the air */}
      <Path path={g.bowl}>
        <LinearGradient start={vec(-g.Rb, 0)} end={vec(g.Rb, 0)} colors={COPPER} positions={COPPER_POS} />
      </Path>
      <Path path={g.inner}>
        <LinearGradient start={vec(0, g.lipY)} end={vec(0, g.lipY + g.Db)} colors={['#140a06', '#24120a', '#0a0503']} />
      </Path>
      <Path path={g.inner}>
        <RadialGradient c={vec(-g.Rb * 0.3, g.lipY + g.Db * 0.25)} r={g.Rb} colors={['rgba(255,180,120,0.10)', 'rgba(255,180,120,0)']} />
      </Path>
      <Path path={g.bowl} style="stroke" strokeWidth={1.4} color="#2a0e05" />
      <Path path={g.ring}>
        <LinearGradient start={vec(0, g.ringY - 9)} end={vec(0, g.ringY + 9)} colors={CHROME_V} />
      </Path>
      <Path path={g.rods} style="stroke" strokeWidth={4.5} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.6} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.tees} color="#c6cad4" />
      <Path path={g.head}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={HEAD_COATED} />
      </Path>
      <Path path={g.head} style="stroke" strokeWidth={0.7} color="#8a7f6c" opacity={0.7} />
      <Path path={g.hoop}>
        <LinearGradient start={vec(0, headY - 22)} end={vec(0, headY + 14)} colors={CHROME_V} />
      </Path>
      <Path path={g.hoop} style="stroke" strokeWidth={0.8} color={INK} />
    </Group>
  );
}

const topCache = new Map<string, ReturnType<typeof buildTop>>();
function buildTop(R: number, pedalA: number) {
  const D = TIMPANO_DRAW;
  const legsP = make();
  const feet = make();
  for (const deg of D.legsDeg) {
    const a = (deg * Math.PI) / 180 + pedalA + Math.PI;
    legsP.moveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3);
    legsP.lineTo(Math.cos(a) * (R + D.footOut), Math.sin(a) * (R + D.footOut));
    oval(feet, Math.cos(a) * (R + D.footOut), Math.sin(a) * (R + D.footOut), 18, 18);
  }
  const rods = make();
  for (let k = 0; k < D.rods; k++) {
    const a = (k / D.rods) * 2 * Math.PI + Math.PI / D.rods;
    const r0 = R + 2 + D.hoopT;
    const r1 = R + D.handle;
    seg(rods, Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1);
    seg(rods, Math.cos(a) * r1 - Math.sin(a) * 14, Math.sin(a) * r1 + Math.cos(a) * 14, Math.cos(a) * r1 + Math.sin(a) * 14, Math.sin(a) * r1 - Math.cos(a) * 14);
  }
  const P = D.pedal;
  const pedal = make();
  const ca = Math.cos(pedalA);
  const sa = Math.sin(pedalA);
  // A footboard from R + gap outward along pedalA, P.w wide.
  const q = (along: number, across: number) => ({ x: ca * along - sa * across, y: sa * along + ca * across });
  const pts = [q(R + P.gap, -P.w / 2), q(R + P.gap + P.len, -P.w / 2), q(R + P.gap + P.len, P.w / 2), q(R + P.gap, P.w / 2)];
  pedal.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) pedal.lineTo(p.x, p.y);
  pedal.close();
  return { legsP, feet, rods, pedal };
}

/** One timpano from above, centred at the origin; `pedalA` is the plan
 *  angle (radians, screen axes) toward the player, where the pedal sits. */
export function TimpanoTop({ R, pedalA, highlight = false }: { R: number; pedalA: number; highlight?: boolean }) {
  const k = `${R}:${pedalA.toFixed(3)}`;
  let g = topCache.get(k);
  if (!g) {
    g = buildTop(R, pedalA);
    topCache.set(k, g);
  }
  const D = TIMPANO_DRAW;
  return (
    <Group>
      <Circle cx={18} cy={24} r={R + D.lip + 10} color="#000" opacity={0.55}>
        <BlurMask blur={24} style="normal" />
      </Circle>
      <Path path={g.legsP} style="stroke" strokeWidth={22} strokeCap="round" color="#1b1c21" />
      <Path path={g.legsP} style="stroke" strokeWidth={14} strokeCap="round" color="#8a8f99" />
      <Path path={g.feet} color="#16171b" />
      <Path path={g.pedal}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={['#c8ccd4', '#6c717c', '#2a2c32']} />
      </Path>
      <Path path={g.pedal} style="stroke" strokeWidth={2} color={INK} />
      <Circle cx={0} cy={0} r={R + D.lip + 8}>
        <RadialGradient c={vec(-R * 0.45, -R * 0.5)} r={R * 1.9} colors={COPPER} positions={COPPER_POS} />
      </Circle>
      <Path path={g.rods} style="stroke" strokeWidth={9} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={4} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Circle cx={0} cy={0} r={R + 2 + D.hoopT}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={['#eef1f6', '#9aa0ab', '#3a3d45', '#c8ccd4']} />
      </Circle>
      <Circle cx={0} cy={0} r={R}>
        <RadialGradient c={vec(-R * 0.35, -R * 0.4)} r={R * 1.7} colors={HEAD_COATED} />
      </Circle>
      <Circle cx={0} cy={0} r={R - 18} style="stroke" strokeWidth={3} color="#a99f88" opacity={0.5} />
      {highlight ? <Circle cx={0} cy={0} r={R + 80} style="stroke" strokeWidth={14} color="#ffc64d" /> : null}
    </Group>
  );
}

