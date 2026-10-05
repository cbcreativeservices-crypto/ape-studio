/**
 * THE SITAR (C14) — the look. Drawn in the sitar's own frame (origin at the
 * main bridge, +x up the neck, +y across) and turned into the posture: the
 * front view is the board rotated so the neck rises about 45° to the
 * player's left; the view from above projects each point.
 *
 *   SitarFront  the main gourd with its inlaid border, the tabli (soundboard)
 *               running up into the neck's face, the broad bone main bridge
 *               (jawari) and the small sympathetic-string bridge below it,
 *               nineteen arched frets tied to the neck, seven main strings
 *               (four to the nut, three drones to side pegs), thirteen
 *               sympathetic strings fanning UNDER the frets to their pegs
 *               along the neck's edge, the main pegs, the upper gourd behind
 *               the neck.
 *   SitarAbove  the same from above: the gourd's depth, the frets as arches
 *               standing over the neck with the melody strings across their
 *               tops and the sympathetic strings running beneath them.
 * Sizes: the overall length and the gourd's width and depth are the Met
 * sitar's (sourced); the rest are drawing defaults (luteSpec.ts).
 */
import { BlurMask, Circle, Group, Line, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { SITAR } from './luteSpec.ts';
import type { LuteScene } from './luteModel.ts';
import { bodySilhouette, curve, make, oval, PAL, poly, rr, smooth, vp, type HitArea, type Pt, type SkPath } from './luteDraw';

const A = (c: readonly string[]) => c as unknown as string[];
const cache = new Map<string, ReturnType<typeof build>>();

function build(sc: LuteScene) {
  const g = sc.sitar!;
  const gc = g.gourd.cx;
  const nh = g.neck.half;
  const tail: Pt = [g.bottom + 6, 0];
  /* ── front, in the sitar's (x, y) ── */
  // The board: the tabli on the gourd and the neck's face, one plate.
  const board = make();
  board.addCircle(gc, 0, g.tabliR);
  const neckFace = make();
  neckFace.addRRect({ rect: { x: gc, y: -nh, width: g.neck.x1 - gc, height: nh * 2 }, rx: nh * 0.6, ry: nh * 0.6 } as never);
  const neckRect = rr(gc + 40, -nh, g.neck.x1, nh, nh * 0.55);
  const grain = make();
  for (let y = -g.tabliR; y <= g.tabliR; y += 9) {
    grain.moveTo(gc - g.tabliR, y);
    grain.lineTo(g.neck.x1, y + Math.sin(y * 0.09) * 2);
  }
  // The gourd's inlaid border: leaves and dots round the tabli.
  const leaves: { x: number; y: number; a: number }[] = [];
  for (let k = 0; k < 30; k++) {
    const a = (k / 30) * Math.PI * 2;
    if (Math.abs(Math.cos(a) - 1) < 0.25) continue; // where the neck meets the gourd
    leaves.push({ x: gc + (g.tabliR + 15) * Math.cos(a), y: (g.tabliR + 15) * Math.sin(a), a });
  }
  // A carved flower on the tabli, below the bridges.
  const flower = make();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    flower.addOval({ x: -150 + 16 * Math.cos(a) - 9, y: 16 * Math.sin(a) - 5, width: 18, height: 10 } as never);
  }
  // Strings. Played: tail → jawari → nut → the pegs at the top.
  const zPeg = [920, 945, 970, 995];
  const played: SkPath[] = g.playedYs(0).map((y0, i) => curve([tail, [-2, y0], [g.nut, g.playedYs(g.nut)[i]], [zPeg[i], i % 2 === 0 ? 0 : -nh + 8]]));
  const drones: SkPath[] = g.drones.map((d) => poly([tail, [-2, d.y0], [d.x, nh - 2], [d.x, nh + 30]], false));
  const taraf: SkPath[] = g.taraf.map((t) => poly([tail, [SITAR.tarafBridgeX.mm, t.y0], [t.pegX, -nh + 3], [t.pegX, -nh - 6]], false));
  const fretRods: { x: number }[] = g.frets.map((x) => ({ x }));
  /* ── above, projected ── */
  const P = (x: number, y: number, z: number): Pt => vp(sc, 'top', { x, y, z });
  const gourdAbove = bodySilhouette(sc, 'top', gc, g.gourd.a, g.gourd.c, g.gourd.zc, 0);
  const neckAbove = smooth([P(g.neck.x0 - 30, -nh, -10), P(g.neck.x0, -nh, -g.neck.depth), P(g.neck.x1, -nh, -g.neck.depth + 6), P(g.neck.x1 + 8, nh, -4), P(g.neck.x1, nh, 0), P(g.neck.x0, nh, 0)]);
  const arches: SkPath[] = g.frets.map((f) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const y = -nh + (2 * nh * i) / 12;
      pts.push(P(f, y, 4 + (SITAR.fretArch.mm - 4) * (1 - (y / nh) ** 2)));
    }
    return curve(pts);
  });
  const stringsAbove = poly([P(0, 0, g.stringZ(0)), P(g.nut, 0, g.stringZ(g.nut))], false);
  const tarafAbove: SkPath[] = g.taraf.filter((_, i) => i % 3 === 0).map((t) => poly([P(SITAR.tarafBridgeX.mm, t.y0, 9), P(t.pegX, -nh, 6)], false));
  const upperAbove = vp(sc, 'top', { x: g.upperGourd.x, y: 0, z: g.upperGourd.z });
  /* ── hit areas (view coordinates) ── */
  const F = (x: number, y: number): Pt => vp(sc, 'side', { x, y, z: 0 });
  const circleF = (cx: number, cy: number, r: number) => Array.from({ length: 28 }, (_, i) => F(cx + r * Math.cos((i / 28) * Math.PI * 2), cy + r * Math.sin((i / 28) * Math.PI * 2)));
  const hitsFront: HitArea[] = [
    { id: 'sitar.pegs', pts: [F(900, -nh - 70), F(g.top + 10, -nh - 70), F(g.top + 10, nh + 70), F(900, nh + 70)] },
    { id: 'sitar.jawari', pts: [F(-18, -34), F(18, -34), F(18, 34), F(-18, 34)] },
    { id: 'sitar.tarafBridge', pts: [F(SITAR.tarafBridgeX.mm - 9, -32), F(SITAR.tarafBridgeX.mm + 9, -32), F(SITAR.tarafBridgeX.mm + 9, 32), F(SITAR.tarafBridgeX.mm - 9, 32)] },
    { id: 'sitar.sympathetic', pts: [F(g.taraf[0].pegX - 10, -nh - 50), F(g.taraf[g.taraf.length - 1].pegX + 10, -nh - 50), F(g.taraf[g.taraf.length - 1].pegX + 10, -nh + 6), F(g.taraf[0].pegX - 10, -nh + 6)] },
    { id: 'sitar.frets', pts: [F(g.frets[g.frets.length - 1] - 6, -nh), F(g.frets[0] + 6, -nh), F(g.frets[0] + 6, nh), F(g.frets[g.frets.length - 1] - 6, nh)], tol: -4 },
    { id: 'sitar.neck', pts: [F(g.neck.x0, -nh), F(g.neck.x1, -nh), F(g.neck.x1, nh), F(g.neck.x0, nh)] },
    { id: 'sitar.upperGourd', pts: circleF(g.upperGourd.x, 0, g.upperGourd.r) },
    { id: 'sitar.tabli', pts: circleF(gc, 0, g.tabliR) },
    { id: 'sitar.gourd', pts: circleF(gc, 0, g.gourd.a) },
  ];
  const hitsAbove: HitArea[] = [
    { id: 'sitar.frets', pts: [P(g.frets[g.frets.length - 1], -nh, 0), P(g.frets[0], nh, 0), P(g.frets[0], nh, 30), P(g.frets[g.frets.length - 1], -nh, 30)] },
    { id: 'sitar.neck', pts: [P(g.neck.x0, -nh, -g.neck.depth), P(g.neck.x1, nh, -g.neck.depth), P(g.neck.x1, nh, 0), P(g.neck.x0, -nh, 0)] },
    { id: 'sitar.upperGourd', pts: Array.from({ length: 24 }, (_, i) => [upperAbove[0] + g.upperGourd.r * Math.cos((i / 24) * Math.PI * 2), upperAbove[1] + g.upperGourd.r * Math.sin((i / 24) * Math.PI * 2)] as Pt) },
    { id: 'sitar.jawari', pts: [P(-15, -31, 0), P(15, 31, 0), P(15, 31, 24), P(-15, -31, 24)] },
    { id: 'sitar.tabli', pts: [P(gc - g.tabliR, 0, -4), P(gc + g.tabliR, 0, -4), P(gc + g.tabliR, 0, 4), P(gc - g.tabliR, 0, 4)] },
    { id: 'sitar.gourd', pts: gourdAbove },
  ];
  return { board, neckFace, neckRect, grain, leaves, flower, played, drones, taraf, fretRods, zPeg, gourdAbove, neckAbove, arches, stringsAbove, tarafAbove, upperAbove, hitsFront, hitsAbove, tail };
}

function paths(sc: LuteScene) {
  let p = cache.get('sitar');
  if (!p) {
    p = build(sc);
    cache.set('sitar', p);
  }
  return p;
}

/** The front: drawn in the sitar's frame and turned up into the posture. */
export function SitarFront({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const g = sc.sitar!;
  const B = paths(sc);
  const gc = g.gourd.cx;
  const a = g.gourd.a;
  const nh = g.neck.half;
  // The scene's own posture turns the board (a level scene — the sound page —
  // draws it level).
  const along = sc.posture.D({ x: 1, y: 0, z: 0 });
  const turn = Math.atan2(along.y, along.x);
  // Light from the upper left of the SCREEN is −y in this frame.
  return (
    <Group opacity={dim} transform={[{ rotate: turn }]}>
      {/* the upper gourd, behind the neck */}
      <Circle cx={g.upperGourd.x} cy={0} r={g.upperGourd.r}>
        <RadialGradient c={vec(g.upperGourd.x - 30, -45)} r={g.upperGourd.r * 1.3} colors={A(PAL.lacquer)} />
      </Circle>
      <Circle cx={g.upperGourd.x} cy={0} r={g.upperGourd.r - 14} style="stroke" strokeWidth={4} color={PAL.inlay} opacity={0.55} />
      {/* the main gourd: lacquered, a contact shadow, an inlaid border */}
      <Circle cx={gc + 14} cy={18} r={a} color="#000" opacity={0.5}>
        <BlurMask blur={18} style="normal" />
      </Circle>
      <Circle cx={gc} cy={0} r={a}>
        <RadialGradient c={vec(gc - a * 0.25, -a * 0.45)} r={a * 1.35} colors={A(PAL.lacquer)} />
      </Circle>
      <Circle cx={gc} cy={0} r={a - 2} style="stroke" strokeWidth={3} color="#a0603a" opacity={0.6} />
      {B.leaves.map((l, i) => (
        <Group key={`lf${i}`} transform={[{ translateX: l.x }, { translateY: l.y }, { rotate: l.a + Math.PI / 2 }]}>
          <Path path={oval(0, 0, 7.5, 3.2)} color={PAL.inlay} opacity={0.92} />
          <Circle cx={10} cy={0} r={1.8} color={PAL.inlay} opacity={0.8} />
        </Group>
      ))}
      {/* the tailpiece at the gourd's foot */}
      <Path path={oval(B.tail[0] - 4, 0, 10, 8)}>
        <LinearGradient start={vec(B.tail[0] - 14, -8)} end={vec(B.tail[0] + 6, 8)} colors={A(PAL.bone)} />
      </Path>
      {/* the board: tabli and the neck's face, one pale plate */}
      <Path path={B.neckRect} color="#000" opacity={0.45} transform={[{ translateX: 6 }, { translateY: 8 }]}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <Group>
        <Path path={B.board}>
          <LinearGradient start={vec(gc, -g.tabliR)} end={vec(gc + 60, g.tabliR)} colors={A(PAL.toon)} />
        </Path>
        <Path path={B.neckRect}>
          <LinearGradient start={vec(0, -nh)} end={vec(0, nh)} colors={A(PAL.toon)} />
        </Path>
      </Group>
      <Group clip={B.board}>
        <Path path={B.grain} style="stroke" strokeWidth={1} color="#7a5228" opacity={0.18} />
      </Group>
      <Circle cx={gc} cy={0} r={g.tabliR - 9} style="stroke" strokeWidth={2} color="#5d3a1c" opacity={0.65} />
      <Circle cx={gc} cy={0} r={g.tabliR - 13} style="stroke" strokeWidth={1.2} color={PAL.inlay} opacity={0.75} />
      <Path path={B.flower} color="#b98348" opacity={0.75} />
      <Circle cx={-150} cy={0} r={5} color="#7a4a24" opacity={0.8} />
      {/* the neck's edge banding */}
      <Line p1={vec(gc + 120, -nh + 3)} p2={vec(g.neck.x1 - 10, -nh + 3)} color="#2a1608" strokeWidth={4} />
      <Line p1={vec(gc + 120, nh - 3)} p2={vec(g.neck.x1 - 10, nh - 3)} color="#2a1608" strokeWidth={4} />
      <Line p1={vec(gc + 120, -nh + 3)} p2={vec(g.neck.x1 - 10, -nh + 3)} color={PAL.inlay} strokeWidth={1.3} />
      <Line p1={vec(gc + 120, nh - 3)} p2={vec(g.neck.x1 - 10, nh - 3)} color={PAL.inlay} strokeWidth={1.3} />
      {/* sympathetic-string pegs along the upper edge; drone pegs below */}
      {g.taraf.map((t, i) => (
        <Group key={`tp${i}`}>
          <Path path={rr(t.pegX - 2.6, -nh - 34, t.pegX + 2.6, -nh + 2, 2)} color={PAL.walnut[1]} />
          <Path path={oval(t.pegX, -nh - 40, 6, 8.5)}>
            <RadialGradient c={vec(t.pegX - 2, -nh - 43)} r={10} colors={['#e8c690', '#9a6634', '#4c2a12']} />
          </Path>
          <Circle cx={t.pegX} cy={-nh - 48} r={2} color={PAL.bone[0]} />
        </Group>
      ))}
      {g.drones.map((d, i) => (
        <Group key={`dp${i}`}>
          <Path path={rr(d.x - 4, nh - 2, d.x + 4, nh + 48, 3)} color={PAL.walnut[1]} />
          <Path path={oval(d.x, nh + 56, 9, 12)}>
            <RadialGradient c={vec(d.x - 3, nh + 52)} r={14} colors={['#e8c690', '#9a6634', '#4c2a12']} />
          </Path>
          <Circle cx={d.x} cy={nh + 67} r={2.6} color={PAL.bone[0]} />
        </Group>
      ))}
      {/* the main pegs at the top: two through the face, two from the side */}
      {B.zPeg.map((x, i) =>
        i % 2 === 0 ? (
          <Group key={`mp${i}`}>
            <Circle cx={x} cy={0} r={17}>
              <RadialGradient c={vec(x - 5, -6)} r={20} colors={['#f0d4a0', '#a86e38', '#4a2810']} />
            </Circle>
            <Circle cx={x} cy={0} r={10} style="stroke" strokeWidth={2} color="#3a2010" opacity={0.7} />
            <Circle cx={x} cy={0} r={3.5} color={PAL.bone[0]} />
          </Group>
        ) : (
          <Group key={`mp${i}`}>
            <Path path={rr(x - 5, -nh - 74, x + 5, -nh + 2, 4)} color={PAL.walnut[1]} />
            <Path path={oval(x, -nh - 84, 13, 17)}>
              <RadialGradient c={vec(x - 4, -nh - 90)} r={20} colors={['#f0d4a0', '#a86e38', '#4a2810']} />
            </Path>
          </Group>
        ),
      )}
      <Path path={oval(g.neck.x1 + 4, 0, 12, nh * 0.7)}>
        <RadialGradient c={vec(g.neck.x1, -8)} r={nh} colors={A(PAL.bone)} />
      </Path>
      {/* the bridges: the broad bone jawari, the small sympathetic bridge */}
      <Path path={rr(SITAR.tarafBridgeX.mm - 5, -32, SITAR.tarafBridgeX.mm + 5, 32, 3)} color="#000" opacity={0.5} transform={[{ translateX: 2 }, { translateY: 3 }]} />
      <Path path={rr(SITAR.tarafBridgeX.mm - 5, -32, SITAR.tarafBridgeX.mm + 5, 32, 3)}>
        <LinearGradient start={vec(0, -32)} end={vec(0, 32)} colors={A(PAL.bone)} />
      </Path>
      <Path path={rr(-17, -33, 17, 33, 5)} color="#000" opacity={0.55} transform={[{ translateX: 3 }, { translateY: 5 }]}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={rr(-17, -33, 17, 33, 5)} color="#3a2010" />
      <Path path={rr(-14, -31, 14, 31, 4)}>
        <LinearGradient start={vec(-14, -31)} end={vec(14, 31)} colors={A(PAL.bone)} />
      </Path>
      {/* sympathetic strings, under the frets */}
      {B.taraf.map((p, i) => (
        <Path key={`ts${i}`} path={p} style="stroke" strokeWidth={0.9} color={PAL.steel} opacity={0.7} />
      ))}
      {/* the arched frets with their ties */}
      {B.fretRods.map((f, i) => (
        <Group key={`fr${i}`}>
          <Path path={rr(f.x - 2.6, -nh + 1, f.x + 2.6, nh - 1, 2.4)} color="#000" opacity={0.45} transform={[{ translateX: 2 }, { translateY: 3 }]} />
          <Path path={rr(f.x - 2.4, -nh + 1, f.x + 2.4, nh - 1, 2.4)}>
            <LinearGradient start={vec(f.x - 2.4, 0)} end={vec(f.x + 2.4, 0)} colors={['#f6f8fb', '#aeb4bf', '#6d727c']} />
          </Path>
          <Path path={oval(f.x, -nh + 4, 5, 3.4)} color={PAL.gut} />
          <Path path={oval(f.x, nh - 4, 5, 3.4)} color={PAL.gut} />
        </Group>
      ))}
      {/* the nut */}
      <Path path={rr(g.nut - 4, -nh + 2, g.nut + 4, nh - 2, 2)}>
        <LinearGradient start={vec(g.nut, -nh)} end={vec(g.nut, nh)} colors={A(PAL.bone)} />
      </Path>
      {/* the main strings over the jawari: four to the nut, three drones to side pegs */}
      {B.drones.map((p, i) => (
        <Path key={`ds${i}`} path={p} style="stroke" strokeWidth={1.1} color={PAL.steel} />
      ))}
      {B.played.map((p, i) => (
        <Path key={`ps${i}`} path={p} style="stroke" strokeWidth={i < 2 ? 1.5 : 1.2} color={i < 2 ? PAL.bronze : PAL.steel} />
      ))}
    </Group>
  );
}

export function SitarAbove({ sc, dim = 1 }: { sc: LuteScene; dim?: number }) {
  const g = sc.sitar!;
  const B = paths(sc);
  const P = (x: number, y: number, z: number): Pt => vp(sc, 'top', { x, y, z });
  const gs = poly(B.gourdAbove);
  const [ux, uz] = B.upperAbove;
  const nh = g.neck.half;
  const tabli0 = P(g.gourd.cx - g.tabliR, 0, 0);
  const tabli1 = P(g.gourd.cx + g.tabliR, 0, 0);
  return (
    <Group opacity={dim}>
      <Circle cx={ux} cy={uz} r={g.upperGourd.r}>
        <RadialGradient c={vec(ux - 30, uz - 35)} r={g.upperGourd.r * 1.3} colors={A(PAL.lacquer)} />
      </Circle>
      <Path path={gs} color="#000" opacity={0.5} transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <BlurMask blur={16} style="normal" />
      </Path>
      <Path path={gs}>
        <LinearGradient start={vec(tabli0[0], -300)} end={vec(tabli1[0], 0)} colors={A(PAL.lacquer)} />
      </Path>
      <Path path={gs} style="stroke" strokeWidth={3} color="#7a4524" opacity={0.6} />
      {/* the neck, its back rounded */}
      <Path path={B.neckAbove}>
        <LinearGradient start={vec(0, -g.neck.depth)} end={vec(0, 0)} colors={A(PAL.walnut)} />
      </Path>
      {/* the tabli, edge-on */}
      <Path path={rr(tabli0[0], -2, tabli1[0], 4, 2)}>
        <LinearGradient start={vec(tabli0[0], 0)} end={vec(tabli1[0], 0)} colors={A(PAL.toon)} />
      </Path>
      <Path path={poly([P(g.neck.x0, -nh, 0), P(g.neck.x1, -nh, 0), P(g.neck.x1, nh, 4), P(g.neck.x0, nh, 4)])} color={PAL.toon[1]} />
      {/* sympathetic strings low, under the arches */}
      {B.tarafAbove.map((p, i) => (
        <Path key={`ta${i}`} path={p} style="stroke" strokeWidth={1} color={PAL.steel} opacity={0.75} />
      ))}
      {/* the frets: arches standing over the neck */}
      {B.arches.map((p, i) => (
        <Path key={`ar${i}`} path={p} style="stroke" strokeWidth={2.4} strokeCap="round" color="#c9ced6" />
      ))}
      {/* the bridges */}
      <Path path={poly([P(-15, -31, 0), P(15, 31, 0), P(15, 31, SITAR.jawariH.mm), P(-15, -31, SITAR.jawariH.mm)])}>
        <LinearGradient start={vec(-20, 0)} end={vec(20, SITAR.jawariH.mm)} colors={A(PAL.bone)} />
      </Path>
      <Path path={poly([P(SITAR.tarafBridgeX.mm - 4, -30, 0), P(SITAR.tarafBridgeX.mm + 4, 30, 0), P(SITAR.tarafBridgeX.mm + 4, 30, 10), P(SITAR.tarafBridgeX.mm - 4, -30, 10)])} color={PAL.bone[1]} />
      {/* the melody strings over the arch tops */}
      <Path path={B.stringsAbove} style="stroke" strokeWidth={1.6} color={PAL.bronze} />
      {/* main pegs: two standing out of the face (toward the audience) */}
      {B.zPeg.filter((_, i) => i % 2 === 0).map((x) => {
        const [u, z] = P(x, 0, 0);
        return (
          <Group key={`zp${x}`}>
            <Path path={rr(u - 5, z, u + 5, z + 70, 4)} color={PAL.walnut[1]} />
            <Path path={oval(u, z + 80, 13, 15)}>
              <RadialGradient c={vec(u - 4, z + 74)} r={18} colors={['#f0d4a0', '#a86e38', '#4a2810']} />
            </Path>
          </Group>
        );
      })}
    </Group>
  );
}

export function sitarHits(sc: LuteScene, view: 'side' | 'top'): HitArea[] {
  const p = paths(sc);
  return view === 'side' ? p.hitsFront : p.hitsAbove;
}

export const _unused = make;
