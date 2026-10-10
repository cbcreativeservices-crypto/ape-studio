/**
 * THE VENUE PLAN, drawn (frame P → the engine's top view in mm: planUV).
 * Built once by group 2 (lab7-g5); every Lab 7 sports lesson draws its plans
 * with it. Static Skia elements, lit from the upper left; one meaning per
 * style (field_diamond/GEOMETRY_PROPOSAL.md §1):
 *
 *   playing area   the surface itself — mown grass, a diamond's infield, a
 *                  hardwood court, ice, a mock floor — with its white lines
 *   keep clear     red diagonal hatching (run-off, free zone, perimeter, the
 *                  practice offset, foul territory)
 *   routes         dashed lines (medical red, the rest pale), never stood in
 *   approved       a green solid outline box: where a mic or operator may be
 *   barriers       a solid wall line (a backstop screen, boards and glass)
 *   cameras        the camera body and its frame cone
 *   crowd / PA     stands as stepped rows; a PA loudspeaker from above
 *   targets        an amber ring; marks a white cross in a ring
 *   badges         a small diamond on the fixture (no attaching / approval
 *                  only / no hardware / live ball)
 *
 * Marks keep their on-screen weight at any zoom (`px` = mm per screen pixel).
 * The mic glyphs (PlanMic) are the real drawings (the short shotgun in its
 * shock mount, a small condenser, a boundary plate, the dish) drawn at a
 * fixed screen size on the plan — a mark, not to scale; the close-up insets
 * draw them to scale.
 */
import { useMemo, type ReactNode } from 'react';
import { Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { MikingMicArt } from '../../../../../../features/lab/micDrawings';
import { ShotgunArt } from '../fieldmics/FieldMicArt';
import { shotgunLobe } from '../../../engine/physics/shotgun.ts';
import { gain } from '../../../engine/physics/polar.ts';
import type { StaticLabel } from '../../../engine/scene/StaticLabels';
import { COVERAGE_WORDS, DEG, degOf, dirFromDeg, planUV, type CoverageZone, type P2, type TurnArc, type VenueScene } from './venuePlan.ts';
// Lab 7b group 3 (lab7-g6): the new surfaces, the plan silhouettes, the stereo pairs and the hydrophone.
import { G3MicGlyph, SURFACE_G3, TokensArt, isG3Kind, type G3MicKind } from './ArenaArt';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = (): SkPath => Skia.Path.Make();
export const AMBER = '#ffc64d';
export const BLUE = '#8fbcff';
export const GREEN = '#5bff85';
export const RED = '#ff6b5e';
const WHITE = '#eef1f5';

const uv = planUV;
function polyPath(pts: readonly P2[], close = true): SkPath {
  const p = make();
  pts.forEach((q, i) => {
    const o = uv(q);
    if (i === 0) p.moveTo(o.u, o.v);
    else p.lineTo(o.u, o.v);
  });
  if (close && pts.length > 2) p.close();
  return p;
}
function bounds(pts: readonly P2[]): { u0: number; u1: number; v0: number; v1: number } {
  let u0 = Infinity;
  let u1 = -Infinity;
  let v0 = Infinity;
  let v1 = -Infinity;
  for (const q of pts) {
    const o = uv(q);
    u0 = Math.min(u0, o.u);
    u1 = Math.max(u1, o.u);
    v0 = Math.min(v0, o.v);
    v1 = Math.max(v1, o.v);
  }
  return { u0, u1, v0, v1 };
}
/** Diagonal hatching over a box, `gap` mm apart. */
function hatch(b: { u0: number; u1: number; v0: number; v1: number }, gap: number): SkPath {
  const p = make();
  const h = b.v1 - b.v0;
  for (let u = b.u0 - h; u < b.u1; u += gap) {
    p.moveTo(u, b.v1);
    p.lineTo(u + h, b.v0);
  }
  return p;
}

/* ── the ground and the surface ── */

const SURFACE: Record<VenueScene['surface'], { around: [string, string]; play: [string, string]; stripe?: string }> = {
  grass: { around: ['#2a3524', '#1d2619'], play: ['#3f6b35', '#2f5527'], stripe: '#4a7a3f' },
  diamond: { around: ['#2a3524', '#1d2619'], play: ['#3f6b35', '#2f5527'], stripe: '#4a7a3f' },
  court: { around: ['#3a3b40', '#2a2b30'], play: ['#b07a45', '#8c5a2e'] },
  ice: { around: ['#2b2e36', '#1f2228'], play: ['#e9f1f7', '#c9d8e4'] },
  mock: { around: ['#3b3a37', '#2c2b29'], play: ['#55524c', '#47443f'] },
  ...SURFACE_G3,
};

function Surface({ scene, px }: { scene: VenueScene; px: number }) {
  const s = SURFACE[scene.surface];
  const g = useMemo(() => {
    const fr = scene.frame;
    const around = make();
    around.addRect(Skia.XYWHRect(fr.x0 * 1000 - 50000, -fr.y1 * 1000 - 50000, (fr.x1 - fr.x0) * 1000 + 100000, (fr.y1 - fr.y0) * 1000 + 100000));
    const play = polyPath(scene.play);
    const b = bounds(scene.play);
    // Mowing stripes (grass) or boards (a court): bands across x.
    const stripes = make();
    if (scene.surface === 'grass' || scene.surface === 'diamond') {
      for (let u = b.u0, k = 0; u < b.u1; u += 5000, k++) if (k % 2 === 0) stripes.addRect(Skia.XYWHRect(u, b.v0, 5000, b.v1 - b.v0));
    } else if (scene.surface === 'court') {
      for (let v = b.v0; v < b.v1; v += 600) {
        stripes.moveTo(b.u0, v);
        stripes.lineTo(b.u1, v);
      }
    }
    // A diamond's infield dirt round the bases.
    const dirt = make();
    if (scene.surface === 'diamond') {
      // The base square (markings[0]): the dirt round it, the infield grass inside it.
      // The infield dirt: an arc about the pitcher's plate (baseball: 95 ft
      // from a plate 60 ft 6 in out; softball: 60 ft from a plate 43 ft out),
      // the infield grass inside the base paths, the mound (Ø 18 ft) and the
      // circle round home plate (Ø 26 ft) — baseball; softball's circle is a
      // marking, its infield all dirt.
      const sq = scene.markings[0]?.pts ?? [];
      const grass = make();
      const mound = make();
      if (sq.length === 4) {
        const path = Math.hypot(sq[1].x - sq[0].x, sq[1].y - sq[0].y);
        const ball = scene.id === 'baseball';
        const plate = { x: sq[0].x, y: sq[0].y + path * (ball ? 60.5 / 90 : 43 / 60) };
        const o = uv(plate);
        dirt.addCircle(o.u, o.v, path * (ball ? 95 / 90 : 1) * 1000);
        const c = { x: (sq[0].x + sq[2].x) / 2, y: (sq[0].y + sq[2].y) / 2 };
        // A softball infield is usually all dirt; a baseball infield keeps its grass.
        if (ball) {
          grass.addPath(polyPath(sq.map((q) => ({ x: c.x + (q.x - c.x) * 0.84, y: c.y + (q.y - c.y) * 0.84 }))));
          const h = uv(sq[0]);
          mound.addCircle(h.u, h.v, 13 * 0.3048 * 1000);
          mound.addCircle(o.u, o.v, 9 * 0.3048 * 1000);
        }
      }
      return { around, play, stripes, dirt, grass, mound, b };
    }
    return { around, play, stripes, dirt, grass: make(), mound: make(), b };
  }, [scene]);
  return (
    <Group>
      <Path path={g.around}>
        <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={s.around} />
      </Path>
      <Path path={g.play}>
        <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={s.play} />
      </Path>
      <Group clip={g.play}>
        {s.stripe ? <Path path={g.stripes} color={s.stripe} opacity={0.35} /> : <Path path={g.stripes} style="stroke" strokeWidth={Math.max(20, 0.6 * px)} color="#5a3a1c" opacity={0.35} />}
      </Group>
      {scene.surface === 'diamond' ? (
        <Group clip={g.play}>
          <Path path={g.dirt}>
            <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={['#a77c52', '#7d5734']} />
          </Path>
          <Path path={g.grass}>
            <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={s.play} />
          </Path>
          <Path path={g.mound}>
            <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={['#a77c52', '#7d5734']} />
          </Path>
        </Group>
      ) : null}
      <Path path={g.play} style="stroke" strokeWidth={1.4 * px} color="#000" opacity={0.45} />
    </Group>
  );
}

const INK = { white: WHITE, red: '#c43b3b', blue: '#2f5fb3', yellow: '#f2c230', orange: '#e8742c' } as const;
function Markings({ scene, px }: { scene: VenueScene; px: number }) {
  const groups = useMemo(() => {
    // One path per ink and dash: an ice rink's lines default to red, every other surface's to white.
    const fallback: keyof typeof INK = scene.surface === 'ice' ? 'red' : 'white';
    const out = new Map<string, { ink: keyof typeof INK; dashed: boolean; path: SkPath }>();
    for (const m of scene.markings) {
      const ink = m.ink ?? fallback;
      const key = `${ink}:${m.dashed ? 1 : 0}`;
      let g = out.get(key);
      if (!g) {
        g = { ink, dashed: !!m.dashed, path: make() };
        out.set(key, g);
      }
      if (m.circle) {
        const o = uv(m.circle.c);
        g.path.addCircle(o.u, o.v, m.circle.r * 1000);
      } else if (m.pts.length) g.path.addPath(polyPath(m.pts, !!m.closed));
    }
    return [...out.values()];
  }, [scene]);
  const w = Math.max(90, 1.3 * px);
  return (
    <Group>
      {groups.map((g) => (
        <Path key={`${g.ink}${g.dashed}`} path={g.path} style="stroke" strokeWidth={g.ink === 'yellow' ? w * 1.6 : w} color={INK[g.ink]} opacity={0.88}>
          {g.dashed ? <DashPathEffect intervals={[Math.max(900, 6 * px), Math.max(600, 4 * px)]} /> : null}
        </Path>
      ))}
    </Group>
  );
}

/* ── the layers ── */

function KeepClearArt({ scene, px }: { scene: VenueScene; px: number }) {
  const g = useMemo(
    () =>
      scene.keepClear.map((k) => {
        const area = polyPath(k.poly);
        return { id: k.id, area, lines: hatch(bounds(k.poly), Math.max(1, 10 * px)) };
      }),
    [scene, px],
  );
  return (
    <Group>
      {g.map((k) => (
        <Group key={k.id}>
          <Path path={k.area} color={RED} opacity={0.08} />
          <Group clip={k.area}>
            <Path path={k.lines} style="stroke" strokeWidth={1.3 * px} color={RED} opacity={0.5} />
          </Group>
          <Path path={k.area} style="stroke" strokeWidth={1.2 * px} color={RED} opacity={0.55} />
        </Group>
      ))}
    </Group>
  );
}

const ROUTE_TINT: Record<string, string> = { medical: RED, officials: '#d9dde4', bench: '#d9dde4', crew: '#b9c0cc', exit: GREEN, players: BLUE };
function RoutesArt({ scene, px }: { scene: VenueScene; px: number }) {
  return (
    <Group>
      {scene.routes.map((r) => {
        const p = polyPath(r.pts, false);
        return (
          <Group key={r.id}>
            <Path path={p} style="stroke" strokeWidth={4.5 * px} color="#000" opacity={0.5} strokeCap="round" />
            <Path path={p} style="stroke" strokeWidth={2.4 * px} color={ROUTE_TINT[r.kind] ?? WHITE} strokeCap="round">
              <DashPathEffect intervals={[8 * px, 6 * px]} />
            </Path>
          </Group>
        );
      })}
    </Group>
  );
}

function FootprintsArt({ scene, px, active }: { scene: VenueScene; px: number; active?: string | null }) {
  return (
    <Group>
      {scene.footprints.map((f) => {
        const o = uv({ x: f.rect.x0, y: f.rect.y1 });
        const w = (f.rect.x1 - f.rect.x0) * 1000;
        const h = (f.rect.y1 - f.rect.y0) * 1000;
        const p = make();
        p.addRRect(Skia.RRectXY(Skia.XYWHRect(o.u, o.v, w, h), 2 * px, 2 * px));
        return (
          <Group key={f.id}>
            <Path path={p} color={GREEN} opacity={active === f.id ? 0.18 : 0.08} />
            <Path path={p} style="stroke" strokeWidth={(active === f.id ? 2.4 : 1.6) * px} color={GREEN} opacity={0.85} />
          </Group>
        );
      })}
    </Group>
  );
}

function BarriersArt({ scene, px }: { scene: VenueScene; px: number }) {
  return (
    <Group>
      {scene.barriers.map((b) => {
        const p = polyPath(b.pts, false);
        return (
          <Group key={b.id}>
            <Path path={p} style="stroke" strokeWidth={Math.max(250, 5 * px)} color="#0b0c0f" strokeJoin="round" />
            <Path path={p} style="stroke" strokeWidth={Math.max(140, 2.6 * px)} color="#a9c4d6" opacity={0.9} strokeJoin="round" />
          </Group>
        );
      })}
    </Group>
  );
}

/** A broadcast camera from above at a plan point, facing `dirDeg`, with its frame cone. */
export function CameraArt({ p, dirDeg, halfDeg, reach, px }: { p: P2; dirDeg: number; halfDeg: number; reach: number; px: number }) {
  const o = uv(p);
  const g = useMemo(() => {
    const cone = make();
    const a = dirFromDeg(dirDeg - halfDeg);
    const b = dirFromDeg(dirDeg + halfDeg);
    const A = uv({ x: p.x + a.x * reach, y: p.y + a.y * reach });
    const B = uv({ x: p.x + b.x * reach, y: p.y + b.y * reach });
    cone.moveTo(o.u, o.v);
    cone.lineTo(A.u, A.v);
    cone.lineTo(B.u, B.v);
    cone.close();
    return { cone };
  }, [p.x, p.y, dirDeg, halfDeg, reach]); // eslint-disable-line react-hooks/exhaustive-deps
  // The body: drawn at a fixed screen size, turned to its direction (screen angle).
  const d = dirFromDeg(dirDeg);
  const ang = Math.atan2(-d.y, d.x);
  const s = 9 * px;
  const cam = camGlyph(s);
  return (
    <Group>
      <Path path={g.cone} color={BLUE} opacity={0.07} />
      <Path path={g.cone} style="stroke" strokeWidth={1.2 * px} color={BLUE} opacity={0.5}>
        <DashPathEffect intervals={[5 * px, 5 * px]} />
      </Path>
      <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: ang }]}>
        <Path path={cam.body}>
          <LinearGradient start={vec(-s, -s)} end={vec(s, s)} colors={['#6b707b', '#30333a', '#15161a']} />
        </Path>
        <Path path={cam.lens}>
          <LinearGradient start={vec(0, -s * 0.4)} end={vec(0, s * 0.4)} colors={['#3a3d45', '#0b0c0f']} />
        </Path>
        <Path path={cam.hood} color="#0b0c0f" />
        <Path path={cam.vf} color="#202227" />
        <Path path={cam.handle} style="stroke" strokeWidth={s * 0.14} strokeCap="round" color="#8a8f99" />
        <Path path={cam.front} color="#3d5a80" />
        <Path path={cam.body} style="stroke" strokeWidth={s * 0.08} color="#060607" />
      </Group>
    </Group>
  );
}
/*
 * A broadcast camera from above, at a fixed screen size `s` (a mark, not to
 * scale) but in true proportion (mm, a drawing default for an ENG/EFP camera
 * with a box-style zoom): body 350 × 130, lens barrel 230 long × Ø 95 with
 * its hood flaring to 140 wide, viewfinder on the body's left front, carry
 * handle along the top. The lens points along +x; the origin is the lens's
 * rear (the body's front face). 1 s ≈ 200 mm.
 */
function camGlyph(s: number) {
  const k = s / 200;
  const body = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-350 * k, -65 * k, 350 * k, 130 * k), 18 * k, 18 * k));
  const lens = make();
  lens.addRRect(Skia.RRectXY(Skia.XYWHRect(0, -47 * k, 230 * k, 94 * k), 8 * k, 8 * k));
  const hood = make();
  hood.moveTo(225 * k, -47 * k);
  hood.lineTo(300 * k, -70 * k);
  hood.lineTo(300 * k, 70 * k);
  hood.lineTo(225 * k, 47 * k);
  hood.close();
  const front = make();
  front.addRect(Skia.XYWHRect(292 * k, -64 * k, 8 * k, 128 * k));
  const vf = make();
  vf.addRRect(Skia.RRectXY(Skia.XYWHRect(-150 * k, -118 * k, 150 * k, 60 * k), 10 * k, 10 * k));
  const handle = make();
  handle.moveTo(-300 * k, 0);
  handle.lineTo(-40 * k, 0);
  return { body, lens, hood, front, vf, handle };
}

function SectorsArt({ scene, px }: { scene: VenueScene; px: number }) {
  return (
    <Group>
      {scene.sectors.map((sec) => (sec.kind === 'crowd' ? <Stand key={sec.id} poly={sec.poly} px={px} empty={sec.empty} /> : <PaBox key={sec.id} c={sec.c} px={px} />))}
    </Group>
  );
}
/** Spectator stands from above: stepped rows of seats in a frame. */
function Stand({ poly, px, empty = false }: { poly: readonly P2[]; px: number; empty?: boolean }) {
  const g = useMemo(() => {
    const area = polyPath(poly);
    const b = bounds(poly);
    const rows = make();
    const across = b.u1 - b.u0 >= b.v1 - b.v0;
    const step = 800;
    if (across) for (let v = b.v0 + step / 2; v < b.v1; v += step) { rows.moveTo(b.u0, v); rows.lineTo(b.u1, v); }
    else for (let u = b.u0 + step / 2; u < b.u1; u += step) { rows.moveTo(u, b.v0); rows.lineTo(u, b.v1); }
    // A stand is SEATING without people (head fix 2026-10-08, owner decision
    // 3: a crowd is never a scatter of circle "heads"). An occupied section:
    // a seat pan every 500 mm just in front of its row line, in a warm tone
    // (taken seats). An empty section (Lab 7 group 3): a seat back on every
    // place, a short dash every 550 mm along each row.
    const pans = make();
    const pan = (u: number, v: number, du: number, dv: number) => pans.addRRect(Skia.RRectXY(Skia.XYWHRect(u - du / 2, v - dv / 2, du, dv), 60, 60));
    if (across) for (let v = b.v0 + step / 2; v < b.v1; v += step) for (let u = b.u0 + 250; u < b.u1 - 150; u += 500) pan(u, v - 200, 380, 260);
    else for (let u = b.u0 + step / 2; u < b.u1; u += step) for (let v = b.v0 + 250; v < b.v1 - 150; v += 500) pan(u - 200, v, 260, 380);
    const seats = make();
    if (across) for (let v = b.v0 + step / 2; v < b.v1; v += step) for (let u = b.u0 + 300; u < b.u1 - 150; u += 550) { seats.moveTo(u, v - 150); seats.lineTo(u + 300, v - 150); }
    else for (let u = b.u0 + step / 2; u < b.u1; u += step) for (let v = b.v0 + 300; v < b.v1 - 150; v += 550) { seats.moveTo(u - 150, v); seats.lineTo(u - 150, v + 300); }
    return { area, rows, pans, seats, b };
  }, [poly]);
  return (
    <Group>
      <Path path={g.area}>
        <LinearGradient start={vec(g.b.u0, g.b.v0)} end={vec(g.b.u1, g.b.v1)} colors={['#4a4e57', '#2c2f35']} />
      </Path>
      <Path path={g.rows} style="stroke" strokeWidth={Math.max(60, 0.8 * px)} color="#15161a" opacity={0.8} />
      {/* Lab 7 group 3: an empty section's seat backs; an occupied one's taken seats (no people drawn). */}
      {empty ? <Path path={g.seats} style="stroke" strokeWidth={Math.max(90, 1.4 * px)} strokeCap="round" color="#7b8494" opacity={0.75} /> : <Path path={g.pans} color="#9a8a78" opacity={0.6} />}
      <Path path={g.area} style="stroke" strokeWidth={1.2 * px} color="#0b0c0f" />
    </Group>
  );
}
/*
 * A flown PA hang from above (mm, a drawing default for a mid-size line-array
 * element): the cabinet 1100 wide × 500 deep, its grille along the front
 * (toward +v, the audience or field), the rigging frame (bumper) on top a
 * little wider with its two pick-up points. Never smaller than a mark.
 */
function PaBox({ c, px }: { c: P2; px: number }) {
  const o = uv(c);
  const k = Math.max(1, (14 * px) / 1100);
  const W = 1100 * k;
  const D = 500 * k;
  const g = useMemo(() => {
    const cab = make();
    cab.addRRect(Skia.RRectXY(Skia.XYWHRect(o.u - W / 2, o.v - D / 2, W, D), 40 * k, 40 * k));
    const grille = make();
    grille.addRRect(Skia.RRectXY(Skia.XYWHRect(o.u - W / 2 + 30 * k, o.v + D / 2 - 90 * k, W - 60 * k, 70 * k), 16 * k, 16 * k));
    const frame = make();
    frame.moveTo(o.u - W / 2 - 60 * k, o.v - 60 * k);
    frame.lineTo(o.u + W / 2 + 60 * k, o.v - 60 * k);
    frame.moveTo(o.u - W / 2 - 60 * k, o.v + 60 * k);
    frame.lineTo(o.u + W / 2 + 60 * k, o.v + 60 * k);
    const picks = make();
    for (const x of [-W * 0.3, W * 0.3]) picks.addCircle(o.u + x, o.v, 45 * k);
    return { cab, grille, frame, picks };
  }, [o.u, o.v, W, D, k]);
  return (
    <Group>
      <Path path={g.cab}>
        <LinearGradient start={vec(o.u - W / 2, o.v - D / 2)} end={vec(o.u + W / 2, o.v + D / 2)} colors={['#4a4e57', '#1d1e23', '#0b0c0e']} />
      </Path>
      <Path path={g.grille} color="#2a2d33" />
      <Path path={g.grille} style="stroke" strokeWidth={Math.max(12 * k, 0.8 * px)} color="#6c717b" />
      <Path path={g.frame} style="stroke" strokeWidth={Math.max(30 * k, 1.2 * px)} strokeCap="round" color="#8a8f99" />
      <Path path={g.picks} color="#c9a24a" />
      <Path path={g.cab} style="stroke" strokeWidth={Math.max(10 * k, 0.8 * px)} color="#060607" />
    </Group>
  );
}

function BadgesArt({ scene, px }: { scene: VenueScene; px: number }) {
  return (
    <Group>
      {scene.badges.map((b) => {
        const o = uv(b.p);
        const s = 6 * px;
        const p = make();
        p.moveTo(o.u, o.v - s);
        p.lineTo(o.u + s, o.v);
        p.lineTo(o.u, o.v + s);
        p.lineTo(o.u - s, o.v);
        p.close();
        const tint = b.kind === 'liveBall' ? AMBER : RED;
        return (
          <Group key={b.id}>
            <Path path={p} color="#0b0c0f" opacity={0.85} />
            <Path path={p} style="stroke" strokeWidth={1.8 * px} color={tint} />
            {b.kind === 'noAttach' || b.kind === 'noHardware' ? (
              <Path
                path={(() => {
                  const x = make();
                  x.moveTo(o.u - s * 0.45, o.v - s * 0.45);
                  x.lineTo(o.u + s * 0.45, o.v + s * 0.45);
                  return x;
                })()}
                style="stroke"
                strokeWidth={1.6 * px}
                color={tint}
              />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}

/** A target point: an amber ring (a sound to pick up). */
export function TargetRing({ p, px, active = false }: { p: P2; px: number; active?: boolean }) {
  const o = uv(p);
  return (
    <Group>
      <Circle cx={o.u} cy={o.v} r={(active ? 11 : 8) * px} color={AMBER} opacity={active ? 0.25 : 0.12} />
      <Circle cx={o.u} cy={o.v} r={(active ? 11 : 8) * px} style="stroke" strokeWidth={(active ? 2.8 : 2) * px} color={AMBER} />
      <Circle cx={o.u} cy={o.v} r={2 * px} color={AMBER} />
    </Group>
  );
}
/** A mark (where a mic or operator starts): a white cross in a ring. */
export function MarkCross({ p, px, tint = WHITE, dashed = false }: { p: P2; px: number; tint?: string; dashed?: boolean }) {
  const o = uv(p);
  const x = make();
  const s = 6 * px;
  x.moveTo(o.u - s, o.v);
  x.lineTo(o.u + s, o.v);
  x.moveTo(o.u, o.v - s);
  x.lineTo(o.u, o.v + s);
  return (
    <Group>
      <Circle cx={o.u} cy={o.v} r={8 * px} style="stroke" strokeWidth={1.6 * px} color={tint} opacity={0.85}>
        {dashed ? <DashPathEffect intervals={[3 * px, 3 * px]} /> : null}
      </Circle>
      <Path path={x} style="stroke" strokeWidth={1.4 * px} color={tint} opacity={0.85} />
    </Group>
  );
}

/** The whole plan (behind the mics). `show` turns layers off (default all on). */
export function VenuePlan({ scene, px, show, activeFootprint, highlight }: { scene: VenueScene; px: number; show?: Partial<Record<'keepClear' | 'routes' | 'footprints' | 'cameras' | 'sectors' | 'targets' | 'marks' | 'badges' | 'barriers', boolean>>; activeFootprint?: string | null; highlight?: string | null }) {
  const on = (k: keyof NonNullable<typeof show>) => show?.[k] !== false;
  return (
    <Group>
      <Surface scene={scene} px={px} />
      <Markings scene={scene} px={px} />
      <TokensArt scene={scene} px={px} />
      {on('keepClear') ? <KeepClearArt scene={scene} px={px} /> : null}
      {on('sectors') ? <SectorsArt scene={scene} px={px} /> : null}
      {on('barriers') ? <BarriersArt scene={scene} px={px} /> : null}
      {on('routes') ? <RoutesArt scene={scene} px={px} /> : null}
      {on('footprints') ? <FootprintsArt scene={scene} px={px} active={activeFootprint} /> : null}
      {on('cameras') ? scene.cameras.map((c) => <CameraArt key={c.id} p={c.p} dirDeg={c.dirDeg} halfDeg={c.halfDeg} reach={c.reach} px={px} />) : null}
      {on('badges') ? <BadgesArt scene={scene} px={px} /> : null}
      {on('marks') ? scene.marks.map((m) => <MarkCross key={m.id} p={m.p} px={px} dashed={!!m.placeholder} />) : null}
      {on('targets') ? scene.targets.map((t) => <TargetRing key={t.id} p={t.p} px={px} active={highlight === t.id} />) : null}
    </Group>
  );
}

/** The labels a plan carries (targets, marks, the approved boxes, keep-clear
 *  areas once, routes once) — StaticLabels fit them or fall back to short. */
export function venueLabels(scene: VenueScene, opts: { targets?: boolean; marks?: boolean; layers?: boolean; px?: number } = {}): StaticLabel[] {
  const out: StaticLabel[] = [];
  const off = 1100;
  // Lab 7b group 3: a room-sized scene (a few metres across) pulls its labels in with it; a field keeps 1.3 m.
  const k = Math.min(1, (scene.frame.x1 - scene.frame.x0) / 38);
  if (opts.targets !== false) for (const t of scene.targets) out.push({ id: `t.${t.id}`, text: t.short, u: uv(t.p).u + 1300 * k, v: uv(t.p).v - 500 * k, align: 'left', tone: 'amber' });
  if (opts.marks !== false) for (const m of scene.marks) out.push({ id: `m.${m.id}`, text: m.short, u: uv(m.p).u + 1300 * k, v: uv(m.p).v + 300 * k, align: 'left' });
  if (opts.layers) {
    const seen = new Set<string>();
    for (const k of scene.keepClear) {
      if (seen.has(k.label)) continue;
      seen.add(k.label);
      const b = bounds(k.poly);
      out.push({ id: `k.${k.id}`, text: k.short, u: (b.u0 + b.u1) / 2, v: (b.v0 + b.v1) / 2, align: 'center', tone: 'muted' });
    }
    for (const f of scene.footprints.slice(0, 2)) out.push({ id: `f.${f.id}`, text: f.short, u: uv({ x: f.rect.x1, y: f.rect.y0 }).u + 400 * k, v: uv({ x: f.rect.x1, y: f.rect.y0 }).v - off * 0.2 * k, align: 'left', tone: 'muted' });
  }
  return out;
}

/* ── mics on the plan ── */

export type PlanMicKind = 'shotgun' | 'compact' | 'dish' | 'boundary' | 'xy' | G3MicKind;
/** A mic glyph at a plan point, aimed at `aimDeg` (as dirFromDeg), drawn at a
 *  fixed screen size (`sizePx` long): a MARK on the plan, not to scale. */
export function PlanMic(props: { at: P2; aimDeg: number; kind: PlanMicKind; px: number; sizePx?: number; tint?: string }) {
  // A pale disc under the glyph: dark equipment stays readable on dark grass or floor.
  const L = (props.sizePx ?? 30) * props.px;
  const d = dirFromDeg(props.aimDeg);
  // The disc sits on the glyph's middle: a shotgun's tube runs ahead of its capsule, a pencil's body behind its front.
  const k = props.kind === 'shotgun' ? 0.3 : props.kind === 'dish' ? 0.15 : -0.4;
  const o = uv({ x: props.at.x + (d.x * k * L) / 1000, y: props.at.y + (d.y * k * L) / 1000 });
  const r = L * 0.62;
  return (
    <Group>
      <Circle cx={o.u} cy={o.v} r={r} color="#e8eef5" opacity={0.36} />
      <Circle cx={o.u} cy={o.v} r={r} style="stroke" strokeWidth={1.2 * props.px} color="#e8eef5" opacity={0.6} />
      <PlanMicGlyph {...props} />
    </Group>
  );
}
function PlanMicGlyph({ at, aimDeg, kind, px, sizePx = 30, tint }: { at: P2; aimDeg: number; kind: PlanMicKind; px: number; sizePx?: number; tint?: string }) {
  const o = uv(at);
  const d = dirFromDeg(aimDeg);
  // Screen angle of the aim (v is −y).
  const screen = Math.atan2(-d.y, d.x);
  if (kind === 'shotgun') return <ShotgunArt x={o.u} y={o.v} angleDeg={screen / DEG} scale={(sizePx * px) / 250} />;
  if (kind === 'dish') return <DishPlanGlyph at={at} aimDeg={aimDeg} px={px} sizePx={sizePx} />;
  if (isG3Kind(kind)) return <G3MicGlyph at={at} aimDeg={aimDeg} kind={kind} px={px} sizePx={sizePx} tint={tint} />;
  const rot = screen - Math.PI / 2 + Math.PI;
  if (kind === 'xy')
    return (
      <Group transform={[{ translateX: o.u }, { translateY: o.v }]}>
        {[-45, 45].map((a) => (
          <Group key={a} transform={[{ rotate: rot + (a * DEG) }, { scale: (sizePx * 0.8 * px) / 104 }]}>
            <MikingMicArt art="sdc" r={10.5} len={104} tint={tint} />
          </Group>
        ))}
      </Group>
    );
  return (
    <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: rot }, { scale: (sizePx * px) / (kind === 'boundary' ? 140 : 104) }]}>
      {kind === 'boundary' ? <MikingMicArt art="boundary" r={10} len={140} cross={95} tint={tint} /> : <MikingMicArt art="sdc" r={10.5} len={104} tint={tint} />}
    </Group>
  );
}

/** A dish seen from above: the bowl's edge as a curve, the element at its
 *  focus, the handle — a fixed screen size. */
export function DishPlanGlyph({ at, aimDeg, px, sizePx = 26 }: { at: P2; aimDeg: number; px: number; sizePx?: number }) {
  const o = uv(at);
  const d = dirFromDeg(aimDeg);
  const screen = Math.atan2(-d.y, d.x);
  const k = (sizePx * px) / 660;
  const g = useMemo(() => {
    // Frame D from above: the bowl's outline x = y²/4f, rim at x = 224 (the large preset).
    const bowl = make();
    for (let i = 0; i <= 24; i++) {
      const y = -330 + (660 * i) / 24;
      const x = (y * y) / (4 * 122);
      if (i === 0) bowl.moveTo(x, y);
      else bowl.lineTo(x, y);
    }
    const handle = make();
    handle.moveTo(-10, 0);
    handle.lineTo(-170, 0);
    const boom = make();
    boom.moveTo(0, 0);
    boom.lineTo(122, 0);
    return { bowl, handle, boom };
  }, []);
  return (
    <Group transform={[{ translateX: o.u }, { translateY: o.v }, { rotate: screen }, { scale: k }]}>
      <Path path={g.bowl} style="stroke" strokeWidth={70} strokeCap="round" color="#0b0c0f" />
      <Path path={g.bowl} style="stroke" strokeWidth={46} strokeCap="round">
        <LinearGradient start={vec(0, -330)} end={vec(0, 330)} colors={['#cfd6df', '#8b95a3', '#56606d']} />
      </Path>
      <Path path={g.boom} style="stroke" strokeWidth={14} color="#2b2e35" />
      <Circle cx={122} cy={0} r={22} color="#1d1f24" />
      <Circle cx={122} cy={0} r={22} style="stroke" strokeWidth={6} color="#c9a24a" />
      <Path path={g.handle} style="stroke" strokeWidth={40} strokeCap="round" color="#18191d" />
    </Group>
  );
}

/** A pattern's SHAPE on the plan (white dashed — a shape, not a range): the
 *  shotgun's low band, a supercardioid, a cardioid. `r` = its size on screen. */
export function PlanLobe({ at, aimDeg, px, rPx = 40, pattern }: { at: P2; aimDeg: number; px: number; rPx?: number; pattern: 'shotgun' | 'supercardioid' | 'cardioid' }) {
  const o = uv(at);
  const p = useMemo(() => {
    const path = make();
    const R = rPx * px;
    const d = dirFromDeg(aimDeg);
    const base = Math.atan2(-d.y, d.x);
    for (let i = 0; i <= 72; i++) {
      const phi = (i / 72) * Math.PI * 2;
      const th = Math.abs(((phi * 180) / Math.PI + 180) % 360 - 180);
      const g = pattern === 'shotgun' ? shotgunLobe(th, 'low') : Math.abs(gain(pattern, th));
      const u = o.u + g * R * Math.cos(base + phi);
      const v = o.v + g * R * Math.sin(base + phi);
      if (i === 0) path.moveTo(u, v);
      else path.lineTo(u, v);
    }
    path.close();
    return path;
  }, [o.u, o.v, aimDeg, px, rPx, pattern]);
  return (
    <Group>
      <Path path={p} color={WHITE} opacity={0.05} />
      <Path path={p} style="stroke" strokeWidth={1.5 * px} color={WHITE} opacity={0.6}>
        <DashPathEffect intervals={[5 * px, 4 * px]} />
      </Path>
    </Group>
  );
}

/** An amber dashed aim line from a plan point toward another (with an arrowhead). */
export function PlanAim({ from, to, px, color = AMBER, head = true }: { from: P2; to: P2; px: number; color?: string; head?: boolean }) {
  const a = uv(from);
  const b = uv(to);
  const g = useMemo(() => {
    const line = make();
    line.moveTo(a.u, a.v);
    line.lineTo(b.u, b.v);
    const h = make();
    const l = Math.hypot(b.u - a.u, b.v - a.v) || 1;
    const ux = (b.u - a.u) / l;
    const uy = (b.v - a.v) / l;
    const s = 9 * px;
    h.moveTo(b.u - ux * s - uy * s * 0.55, b.v - uy * s + ux * s * 0.55);
    h.lineTo(b.u, b.v);
    h.lineTo(b.u - ux * s + uy * s * 0.55, b.v - uy * s - ux * s * 0.55);
    return { line, h };
  }, [a.u, a.v, b.u, b.v, px]);
  return (
    <Group>
      <Path path={g.line} style="stroke" strokeWidth={2.2 * px} color={color} opacity={0.95}>
        <DashPathEffect intervals={[8 * px, 6 * px]} />
      </Path>
      {head ? <Path path={g.h} style="stroke" strokeWidth={2.2 * px} strokeCap="round" strokeJoin="round" color={color} /> : null}
    </Group>
  );
}
/** A solid sound path (blue) between two plan points. */
export function PlanPath({ a, b, px, color = BLUE, width = 2 }: { a: P2; b: P2; px: number; color?: string; width?: number }) {
  const A = uv(a);
  const B = uv(b);
  const p = make();
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  return <Path path={p} style="stroke" strokeWidth={width * px} color={color} opacity={0.85} />;
}

/** An operator's turn arc (amber wedge, dashed edges). */
export function ArcArt({ arc, px, out = false }: { arc: TurnArc; px: number; out?: boolean }) {
  const o = uv(arc.at);
  const p = useMemo(() => {
    const path = make();
    path.moveTo(o.u, o.v);
    for (let i = 0; i <= 24; i++) {
      const d = dirFromDeg(arc.fromDeg + ((arc.toDeg - arc.fromDeg) * i) / 24);
      const q = uv({ x: arc.at.x + d.x * arc.reach, y: arc.at.y + d.y * arc.reach });
      path.lineTo(q.u, q.v);
    }
    path.close();
    return path;
  }, [arc, o.u, o.v]);
  return (
    <Group>
      <Path path={p} color={out ? RED : AMBER} opacity={0.07} />
      <Path path={p} style="stroke" strokeWidth={1.4 * px} color={out ? RED : AMBER} opacity={0.6}>
        <DashPathEffect intervals={[6 * px, 5 * px]} />
      </Path>
    </Group>
  );
}

/** Coverage map zones: detail (solid green), ambience (dashed blue),
 *  unavailable (red, crossed) — shape as well as colour. */
export function CoverageArt({ zones, px, active }: { zones: readonly CoverageZone[]; px: number; active?: string | null }) {
  return (
    <Group>
      {zones.map((z) => {
        const o = uv(z.c);
        const r = z.r * 1000;
        const tint = z.tag === 'detail' ? GREEN : z.tag === 'ambience' ? BLUE : RED;
        const cross = make();
        if (z.tag === 'unavailable') {
          const s = r * 0.62;
          cross.moveTo(o.u - s, o.v - s);
          cross.lineTo(o.u + s, o.v + s);
          cross.moveTo(o.u + s, o.v - s);
          cross.lineTo(o.u - s, o.v + s);
        }
        return (
          <Group key={z.id}>
            <Circle cx={o.u} cy={o.v} r={r} color={tint} opacity={active === z.id ? 0.22 : 0.12} />
            <Circle cx={o.u} cy={o.v} r={r} style="stroke" strokeWidth={(active === z.id ? 3 : 2) * px} color={tint}>
              {z.tag === 'ambience' ? <DashPathEffect intervals={[7 * px, 5 * px]} /> : null}
            </Circle>
            {z.tag === 'unavailable' ? <Path path={cross} style="stroke" strokeWidth={2 * px} color={tint} opacity={0.8} /> : null}
          </Group>
        );
      })}
    </Group>
  );
}
export const coverageTint = (t: CoverageZone['tag']): 'blue' | 'amber' | 'muted' => (t === 'detail' ? 'amber' : t === 'ambience' ? 'blue' : 'muted');
export { COVERAGE_WORDS, degOf };

/** Children drawn above the plan, below the labels (a convenience type). */
export type PlanLayer = (px: number) => ReactNode;
