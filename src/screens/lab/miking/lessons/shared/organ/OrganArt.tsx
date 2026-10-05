/**
 * THE PIPE ORGAN, drawn (Lab 3's A12) — a STYLISED instrument in its room,
 * never a particular organ, from the lesson's model (a12Organ/model.ts):
 *
 *   OrganFacade   from the nave (u = z, v = y): the oak case, the Pedal
 *                 towers, the Great's flat of pipes in the middle, the
 *                 Swell's shutters above, the Positive low in front — every
 *                 pipe a burnished tin body with its mouth and its conical
 *                 foot, lit from the upper left
 *   OrganSide     the nave cut along its length (u = x, v = y): the case in
 *                 profile, the console, the pews, the PA on the arch and the
 *                 congregation in a SERVICE
 *   OrganTop      the nave from above (u = x, v = z): the case and its tower
 *                 tops, the console, the pews in rows, the aisles kept clear
 *   NavePlan      the whole room (the setting page): the rear gallery and
 *                 its antiphonal division, the exits and the wheelchair route
 * Static (D8): it changes only on a tap or a switch.
 */
import type { ReactElement } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { CASE, CONSOLE, DIVISIONS, GALLERY, NAVE, ORGAN, PA, pewXs, type DivisionId } from '../../a12Organ/model.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
export const HIGHLIGHT = '#ffc64d';
const OAK = ['#8a5a32', '#6a4223', '#4a2c16', '#2c190b'];
const TIN = ['#f4f6f9', '#cfd5de', '#9aa3b1', '#6b7380', '#c3cad4'];
const GOLD = ['#fff0c2', '#e7c26a', '#b48a32', '#6e5218'];
const PEW = ['#7a4e2c', '#5a361c', '#3a210f'];

function rr(u0: number, v0: number, u1: number, v1: number, r: number): SkPath {
  const p = make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(u0, u1), Math.min(v0, v1), Math.abs(u1 - u0), Math.abs(v1 - v0)), r, r));
  return p;
}

/** One flue pipe from the front: body from its top down to the mouth, the
 *  mouth (a dark slit under a lip), the conical foot to the toe. */
function PipeFront({ u, w, top, mouth, toe }: { u: number; w: number; top: number; mouth: number; toe: number }): ReactElement {
  const body = rr(u - w / 2, top, u + w / 2, mouth, w * 0.08);
  const foot = make();
  foot.moveTo(u - w / 2, mouth);
  foot.lineTo(u + w / 2, mouth);
  foot.lineTo(u + w * 0.12, toe);
  foot.lineTo(u - w * 0.12, toe);
  foot.close();
  const lip = make();
  lip.moveTo(u - w * 0.36, mouth - w * 0.05);
  lip.quadTo(u, mouth - w * 0.5, u + w * 0.36, mouth - w * 0.05);
  lip.close();
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={TIN} />
      </Path>
      <Path path={foot}>
        <LinearGradient start={vec(u - w / 2, 0)} end={vec(u + w / 2, 0)} colors={[TIN[1], TIN[2], TIN[3]]} />
      </Path>
      <Path path={lip} color="#14161a" />
      <Path path={body} style="stroke" strokeWidth={w * 0.03} color="#4a515c" opacity={0.6} />
    </Group>
  );
}

/** A flat of pipes: tops on a curve (arched or V), mouths on a line. */
function Flat({ z0, z1, n, mouth, toe, topMid, topEdge, w }: { z0: number; z1: number; n: number; mouth: number; toe: number; topMid: number; topEdge: number; w: number }): ReactElement {
  const pipes = Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const u = z0 + (z1 - z0) * t;
    const k = 1 - Math.abs(2 * t - 1);
    return { u, top: topEdge + (topMid - topEdge) * Math.sin((k * Math.PI) / 2) };
  });
  return (
    <Group>
      {pipes.map((q, i) => (
        <PipeFront key={i} u={q.u} w={w} top={q.top} mouth={mouth} toe={toe} />
      ))}
    </Group>
  );
}

function Oak({ path, u0, v0, u1, v1 }: { path: SkPath; u0: number; v0: number; u1: number; v1: number }): ReactElement {
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={OAK} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={22} color="#1e1108" opacity={0.85} />
    </Group>
  );
}

/** The case from the nave (u = z, v = y). */
export function OrganFacade({ hi = null }: { hi?: string | null }): ReactElement {
  const H = CASE.zHalf;
  const P = DIVISIONS.pedal;
  const G = DIVISIONS.great;
  const S = DIVISIONS.swell;
  const Q = DIVISIONS.positive;
  // The casework: the base, the two towers, the central bay, the cornices.
  const base = rr(-H, -900, H, 0, 20);
  const towers = [-1, 1].map((s) => rr(s * P.z0, -10000, s * P.z1, -900, 40));
  const bay = rr(-P.z0 + 40, -6900, P.z0 - 40, -900, 30);
  const cornice = (z0: number, z1: number, v: number) => rr(z0 - 120, v - 260, z1 + 120, v, 40);
  const slats = make();
  for (let y = S.y0 + 260; y < S.y1 - 120; y += 230) slats.addRRect(Skia.RRectXY(Skia.XYWHRect(S.z0 + 160, y, S.z1 - S.z0 - 320, 140), 30, 30));
  const glow = (id: string, p: SkPath) => (hi === id ? <Path path={p} style="stroke" strokeWidth={90} color={HIGHLIGHT} opacity={0.85} /> : null);
  return (
    <Group>
      <Path path={rr(-H - 200, -10300, H + 200, 60, 60)} color="#000" opacity={0.45}>
        <BlurMask blur={160} style="normal" />
      </Path>
      {/* the Swell's box above, its shutters */}
      <Oak path={rr(S.z0, S.y0, S.z1, S.y1, 30)} u0={S.z0} v0={S.y0} u1={S.z1} v1={S.y1} />
      <Path path={slats}>
        <LinearGradient start={vec(0, S.y0)} end={vec(0, S.y1)} colors={['#5a3a1e', '#3a2410', '#24160a']} />
      </Path>
      <Path path={slats} style="stroke" strokeWidth={12} color="#b48a32" opacity={0.45} />
      {glow('org.swell', rr(S.z0, S.y0, S.z1, S.y1, 30))}
      {/* the case */}
      <Oak path={base} u0={-H} v0={-900} u1={H} v1={0} />
      {towers.map((t, i) => (
        <Oak key={`t${i}`} path={t} u0={P.z0} v0={-10000} u1={P.z1} v1={-900} />
      ))}
      <Oak path={bay} u0={-P.z0} v0={-6900} u1={P.z0} v1={-900} />
      {/* the Pedal towers' pipes */}
      {[-1, 1].map((s) => (
        <Flat key={`p${s}`} z0={s * (P.z0 + 220)} z1={s * (P.z1 - 220)} n={5} mouth={-1700} toe={-1000} topMid={-9700} topEdge={-8600} w={230} />
      ))}
      {/* the Great's flat */}
      <Flat z0={G.z0 + 120} z1={G.z1 - 120} n={13} mouth={-3500} toe={-3050} topMid={-6600} topEdge={-5300} w={190} />
      {/* the Positive low in front */}
      <Oak path={rr(Q.z0, Q.y0, Q.z1, Q.y1 + 60, 30)} u0={Q.z0} v0={Q.y0} u1={Q.z1} v1={Q.y1} />
      <Flat z0={Q.z0 + 160} z1={Q.z1 - 160} n={11} mouth={-1350} toe={-1050} topMid={-2750} topEdge={-2350} w={130} />
      {/* gilded cornices and tower crowns */}
      {[-1, 1].map((s) => (
        <Path key={`c${s}`} path={cornice(Math.min(s * P.z0, s * P.z1), Math.max(s * P.z0, s * P.z1), -10000)}>
          <LinearGradient start={vec(0, -10260)} end={vec(0, -10000)} colors={GOLD} />
        </Path>
      ))}
      <Path path={cornice(-P.z0 + 40, P.z0 - 40, -6900)}>
        <LinearGradient start={vec(0, -7160)} end={vec(0, -6900)} colors={GOLD} />
      </Path>
      {glow('org.pedal', rr(P.z0, -10000, P.z1, -900, 40))}
      {glow('org.pedal', rr(-P.z1, -10000, -P.z0, -900, 40))}
      {glow('org.great', rr(G.z0, G.y0, G.z1, G.y1, 40))}
      {glow('org.positive', rr(Q.z0, Q.y0, Q.z1, Q.y1, 30))}
      {hi === 'org.case' ? <Path path={rr(-H - 60, -10350, H + 60, 40, 80)} style="stroke" strokeWidth={90} color={HIGHLIGHT} opacity={0.85} /> : null}
    </Group>
  );
}

/** The console from the front-left (a small illustrated desk with its music rack). */
function ConsoleSide({ x0, x1, h }: { x0: number; x1: number; h: number }): ReactElement {
  const body = make();
  body.moveTo(x0, 0);
  body.lineTo(x0, -h);
  body.lineTo(x0 + 220, -h - 260);
  body.lineTo(x1 - 80, -h - 260);
  body.lineTo(x1, -h + 80);
  body.lineTo(x1, 0);
  body.close();
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(x0, -h - 260)} end={vec(x1, 0)} colors={OAK} />
      </Path>
      <Path path={rr(x0 + 160, -h - 40, x1 - 140, -h + 40, 10)} color="#f1ede2" />
      <Path path={body} style="stroke" strokeWidth={18} color="#1e1108" />
    </Group>
  );
}

/** A pew in profile (a bench with its back), at x (its front edge). */
function pewProfile(x: number): SkPath {
  const p = make();
  p.moveTo(x, 0);
  p.lineTo(x, -450);
  p.lineTo(x + 420, -450);
  p.lineTo(x + 470, -950);
  p.lineTo(x + 540, -950);
  p.lineTo(x + 480, -420);
  p.lineTo(x + 480, 0);
  p.close();
  return p;
}

/** A seated person in profile (line art), facing the organ (−x). */
function seated(x: number): SkPath {
  const p = make();
  p.addCircle(x + 260, -1180, 110);
  p.moveTo(x + 300, -1070);
  p.lineTo(x + 330, -500);
  p.lineTo(x + 40, -480);
  p.lineTo(x + 40, -40);
  return p;
}

export function OrganSide({ variant, hi = null }: { variant: string; hi?: string | null }): ReactElement {
  const service = variant === 'service';
  const pews = make();
  for (const x of pewXs()) pews.addPath(pewProfile(x));
  const people = make();
  if (service) for (const x of pewXs().slice(0, 12)) people.addPath(seated(x));
  const caseProfile = make();
  caseProfile.moveTo(CASE.x0, 0);
  caseProfile.lineTo(CASE.x0, CASE.top);
  caseProfile.lineTo(CASE.x1 + 150, CASE.top);
  caseProfile.lineTo(CASE.x1 + 150, CASE.top + 300);
  caseProfile.lineTo(CASE.x1, CASE.top + 300);
  caseProfile.lineTo(CASE.x1, 0);
  caseProfile.close();
  const pipes = make();
  // The façade pipes seen edge-on along the case front: their mouths and feet.
  for (const [mouth, top] of [[-1700, -9600], [-3500, -6500], [-1350, -2600]] as const) pipes.addRRect(Skia.RRectXY(Skia.XYWHRect(-220, top, 180, mouth - top), 40, 40));
  const floor = rr(-3000, 0, NAVE.x1, 300, 0);
  return (
    <Group>
      <Path path={floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 300)} colors={['#3a3530', '#1c1a17']} />
      </Path>
      <Path path={caseProfile}>
        <LinearGradient start={vec(CASE.x0, CASE.top)} end={vec(0, 0)} colors={OAK} />
      </Path>
      <Path path={pipes}>
        <LinearGradient start={vec(-220, 0)} end={vec(-40, 0)} colors={TIN} />
      </Path>
      <Path path={caseProfile} style="stroke" strokeWidth={30} color="#1e1108" />
      {hi === 'org.case' ? <Path path={caseProfile} style="stroke" strokeWidth={110} color={HIGHLIGHT} opacity={0.8} /> : null}
      <ConsoleSide x0={CONSOLE.x0} x1={CONSOLE.x1} h={CONSOLE.h} />
      <Path path={pews}>
        <LinearGradient start={vec(0, -950)} end={vec(0, 0)} colors={PEW} />
      </Path>
      <Path path={pews} style="stroke" strokeWidth={14} color="#1e1108" opacity={0.8} />
      {service ? <Path path={people} style="stroke" strokeWidth={34} strokeCap="round" strokeJoin="round" color="#9aa3b1" opacity={0.45} /> : null}
      {service ? (
        <Group>
          <Path path={rr(PA.x - 150, -PA.h1, PA.x + 150, -PA.h0, 40)}>
            <LinearGradient start={vec(PA.x - 150, 0)} end={vec(PA.x + 150, 0)} colors={['#3a3b41', '#1d1e22', '#0f1012']} />
          </Path>
          <Path path={rr(PA.x - 150, -PA.h1, PA.x + 150, -PA.h0, 40)} style="stroke" strokeWidth={20} color="#8a8f9c" />
        </Group>
      ) : null}
    </Group>
  );
}

export function OrganTop({ variant, hi = null, whole = false }: { variant: string; hi?: string | null; whole?: boolean }): ReactElement {
  const service = variant === 'service';
  const H = CASE.zHalf;
  const caseTop = rr(CASE.x0, -H, CASE.x1, H, 60);
  const towerTops = make();
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) towerTops.addCircle(-300 - (i % 2) * 260, s * (2800 + i * 260), 115);
  const greatTops = make();
  for (let i = 0; i < 13; i++) greatTops.addCircle(-160, -1480 + i * 247, 95);
  const swellBox = rr(-2300, DIVISIONS.swell.z0, -500, DIVISIONS.swell.z1, 40);
  const pews = make();
  const zs: [number, number][] = [
    [-ORGAN.sideZ.mm, -ORGAN.aisleZ1.mm],
    [-ORGAN.aisleZ0.mm, ORGAN.aisleZ0.mm],
    [ORGAN.aisleZ1.mm, ORGAN.sideZ.mm],
  ];
  for (const x of pewXs()) for (const [a, b] of zs) pews.addRRect(Skia.RRectXY(Skia.XYWHRect(x, a + 60, 480, b - a - 120), 40, 40));
  const aisles = make();
  for (const s of [-1, 1]) aisles.addRect(Skia.XYWHRect(6000, Math.min(s * ORGAN.aisleZ0.mm, s * ORGAN.aisleZ1.mm), NAVE.x1 - 6000, ORGAN.aisleZ1.mm - ORGAN.aisleZ0.mm));
  const passages = make();
  for (const s of [-1, 1]) passages.addRect(Skia.XYWHRect(0, Math.min(s * ORGAN.sideZ.mm, s * NAVE.zHalf), NAVE.x1, NAVE.zHalf - ORGAN.sideZ.mm));
  const walls = make();
  walls.addRect(Skia.XYWHRect(-3000, -NAVE.zHalf - 300, NAVE.x1 + 3000, 300));
  walls.addRect(Skia.XYWHRect(-3000, NAVE.zHalf, NAVE.x1 + 3000, 300));
  if (whole) walls.addRect(Skia.XYWHRect(NAVE.x1, -NAVE.zHalf - 300, 300, NAVE.zHalf * 2 + 600));
  const people = make();
  if (service) for (const x of pewXs().slice(0, 12)) for (const [a, b] of zs) for (let z = a + 350; z < b - 200; z += 650) people.addCircle(x + 260, z, 120);
  return (
    <Group>
      <Path path={rr(-3000, -NAVE.zHalf, whole ? NAVE.x1 : NAVE.x1, NAVE.zHalf, 0)} color="#16171b" />
      <Path path={aisles} color="#24262c" />
      <Path path={aisles} style="stroke" strokeWidth={40} color="#6fa8ff" opacity={0.35}>
        <DashPathEffect intervals={[300, 200]} />
      </Path>
      <Path path={passages} color="#24262c" />
      <Path path={walls} color="#4a4d56" />
      <Path path={pews}>
        <LinearGradient start={vec(0, -NAVE.zHalf)} end={vec(0, NAVE.zHalf)} colors={PEW} />
      </Path>
      {service ? <Path path={people} color="#9aa3b1" opacity={0.4} /> : null}
      <Path path={caseTop} color="#000" opacity={0.5} transform={[{ translateX: 120 }, { translateY: 160 }]}>
        <BlurMask blur={120} style="normal" />
      </Path>
      <Path path={caseTop}>
        <LinearGradient start={vec(CASE.x0, -H)} end={vec(0, H)} colors={OAK} />
      </Path>
      <Path path={swellBox} color="#3a2410" />
      <Path path={towerTops}>
        <LinearGradient start={vec(-700, -4000)} end={vec(0, 4000)} colors={TIN} />
      </Path>
      <Path path={greatTops}>
        <LinearGradient start={vec(-260, -1500)} end={vec(-60, 1500)} colors={TIN} />
      </Path>
      <Path path={caseTop} style="stroke" strokeWidth={30} color="#1e1108" />
      {hi === 'org.case' ? <Path path={caseTop} style="stroke" strokeWidth={120} color={HIGHLIGHT} opacity={0.8} /> : null}
      <Path path={rr(CONSOLE.x0, CONSOLE.z0, CONSOLE.x1, CONSOLE.z1, 60)}>
        <LinearGradient start={vec(CONSOLE.x0, CONSOLE.z0)} end={vec(CONSOLE.x1, CONSOLE.z1)} colors={OAK} />
      </Path>
      <Path path={rr(CONSOLE.x0 + 100, CONSOLE.z0 + 120, CONSOLE.x0 + 400, CONSOLE.z1 - 120, 30)} color="#f1ede2" />
      {hi === 'org.console' ? <Path path={rr(CONSOLE.x0 - 150, CONSOLE.z0 - 150, CONSOLE.x1 + 150, CONSOLE.z1 + 150, 80)} style="stroke" strokeWidth={100} color={HIGHLIGHT} /> : null}
      {service
        ? [-1, 1].map((s) => (
            <Group key={s}>
              <Path path={rr(PA.x - 150, s * PA.z - 150, PA.x + 150, s * PA.z + 150, 40)} color="#1d1e22" />
              <Path path={rr(PA.x - 150, s * PA.z - 150, PA.x + 150, s * PA.z + 150, 40)} style="stroke" strokeWidth={30} color="#c8ccd4" />
            </Group>
          ))
        : null}
      {whole ? (
        <Group>
          <Path path={rr(GALLERY.x0, -NAVE.zHalf, GALLERY.x1, NAVE.zHalf, 0)} color="#2a2118" opacity={0.75} />
          <Path path={rr(GALLERY.x0 + 600, -1500, GALLERY.x0 + 1500, 1500, 60)}>
            <LinearGradient start={vec(GALLERY.x0, -1500)} end={vec(GALLERY.x1, 1500)} colors={OAK} />
          </Path>
          {Array.from({ length: 7 }, (_, i) => <Circle key={i} cx={GALLERY.x0 + 900} cy={-1200 + i * 400} r={110} color={TIN[1]} />)}
          {hi === 'antiphonal' ? <Path path={rr(GALLERY.x0 + 450, -1700, GALLERY.x0 + 1650, 1700, 80)} style="stroke" strokeWidth={110} color={HIGHLIGHT} /> : null}
        </Group>
      ) : null}
    </Group>
  );
}

/** Divisions' anchors for the arrivals picture (front view u = z, v = y). */
export const DIVISION_IDS: readonly DivisionId[] = ['great', 'swell', 'pedal', 'positive'];
