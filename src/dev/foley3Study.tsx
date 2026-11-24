/**
 * DEV STUDY — "FOLEY3" (figure V2, 2026-11-24): F02 Clothing, F08 Pass-bys and
 * F10 Spatial Field converted whole, the current look beside the new, at about
 * the lesson's phone size and enlarged about 3×, each hand close. The pictures
 * are the lessons' own scenes (the `v2` switch only); the boom operator is the
 * engine's pole drawn here as the Placement scene draws it (from the mic's tail
 * to the hands), with the operator over it.
 * Dev pages: `#labpreview/FigureStudy/foley3-f02`, `-boom`, `-f08`, `-f10`, `-heads`.
 */
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { FigureScale } from '../screens/lab/miking/lessons/shared/figureV2/detail';
import { ClothingArt } from '../screens/lab/miking/lessons/f02Clothing/art';
import { FLOOR as F02_FLOOR, HOLDER } from '../screens/lab/miking/lessons/f02Clothing/geometry';
import { Site as F08Site } from '../screens/lab/miking/lessons/f08Passby/art';
import { SiteArt as F10Site } from '../screens/lab/miking/lessons/f10SpatialField/scene';
import { SitePerson, sitePersonWho } from '../screens/lab/miking/lessons/shared/field/SiteArt';
import { PoleOperatorArt } from '../screens/lab/miking/lessons/shared/fieldmics/FieldMicArt';
import { PoleOperatorV2, poleRigFor } from '../screens/lab/miking/lessons/shared/fieldmics/PoleOperatorV2';
import { ListenerHeadV2 } from '../screens/lab/miking/lessons/f10SpatialField/peopleV2';
import { headAbove, FigureHead } from '../screens/lab/miking/lessons/shared/players/PlayerFigure';
import { pt } from '../screens/lab/miking/lessons/shared/players/playerPose';
import { EVENT, PLAZA, WALKER_AT } from '../screens/lab/miking/lessons/f10SpatialField/geometry';
import { along } from '../screens/lab/miking/lessons/shared/field/spatial';
import { POLE_LEN, POLE_RADIUS } from '../screens/lab/miking/engine/geometry/collision';
import { ROUTE_X } from '../screens/lab/miking/lessons/shared/field/sites';

const STAGE = '#0b0c10';
const INK = '#e8e6e1';
const DIM = '#9a978f';
type B = [number, number, number, number];

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ marginTop: 10, marginBottom: 6 }}>
      <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      {note ? <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

/** Cells in ONE canvas (the browser allows only so many): each a picture cropped to its box (centre u, v,
 *  width, height in mm) at a width in points; `k` the scale (pt/mm) printed under it. */
type Cell = { title: string; draw: ReactNode; b: B; w: number };
function Board({ width, title, note, rows }: { width: number; title: string; note?: string; rows: Cell[][] }) {
  const gap = 8;
  const lab = 16;
  type Item = Cell & { x: number; y: number; h: number };
  const items: Item[] = [];
  let y = 0;
  let W = 0;
  for (const r of rows) {
    const h = Math.max(...r.map((c) => (c.b[3] * c.w) / c.b[2]));
    let x = 0;
    for (const c of r) {
      items.push({ ...c, x, y, h });
      x += c.w + gap;
    }
    W = Math.max(W, x - gap);
    y += h + lab + gap;
  }
  W = Math.min(W, width - 24);
  return (
    <View style={{ marginBottom: 24 }}>
      <Head title={title} note={note} />
      <View>
        <Canvas style={{ width: W, height: y }}>
          {items.map((q, i) => {
            const k = q.w / q.b[2];
            return (
              <Group key={i} clip={Skia.XYWHRect(q.x, q.y, q.w, q.h)}>
                <Rect x={q.x} y={q.y} width={q.w} height={q.h} color={STAGE} />
                <Group transform={[{ translateX: q.x + q.w / 2 - q.b[0] * k }, { translateY: q.y + q.h / 2 - q.b[1] * k }, { scale: k }]}>
                  <FigureScale ptPerMm={k}>{q.draw}</FigureScale>
                </Group>
              </Group>
            );
          })}
        </Canvas>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: y }} pointerEvents="none">
          {items.map((q, i) => (
            <Text key={i} style={{ position: 'absolute', left: q.x, top: q.y + q.h + 1, color: DIM, fontSize: 11, width: q.w }}>
              {q.title} · {(q.w / q.b[2]).toFixed(2)} pt/mm
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ── F02 ── */

function F02({ width }: { width: number }) {
  const half = Math.floor(Math.min(300, (width - 32) / 2));
  const full = Math.min(2 * half + 8, width - 24);
  const sideScene: B = [-250, 300, 2400, 2000];
  const topScene: B = [-250, 0, 2400, 1700];
  const sideZoom: B = [-220, 150, 900, 1000];
  const topZoom: B = [-200, 0, 900, 800];
  const near: B = [-30, 0, 240, 240];
  const far: B = [-30, 0, 240, 240];
  const one = (variant: string, view: 'side' | 'top', v2: boolean) => <ClothingArt view={view} variant={variant} v2={v2} />;
  return (
    <View>
      <Board
        width={width}
        title="F02 Clothing — HELD (and LIVE): Mei holds the leather jacket by its gathered shoulders"
        note="Lesson size about 0.09 pt/mm (the glass), enlarged about 3× below. The jacket, the fold, every label and the gesture envelope are where they were; the jacket hangs between the far arm and the near arm."
        rows={[
          [
            { title: 'SIDE · CURRENT', draw: one('held', 'side', false), b: sideScene, w: half },
            { title: 'SIDE · NEW', draw: one('held', 'side', true), b: sideScene, w: half },
          ],
          [
            { title: 'ABOVE · CURRENT', draw: one('held', 'top', false), b: topScene, w: half },
            { title: 'ABOVE · NEW', draw: one('held', 'top', true), b: topScene, w: half },
          ],
          [{ title: 'SIDE · NEW, ENLARGED', draw: one('held', 'side', true), b: sideZoom, w: full }],
          [{ title: 'ABOVE · NEW, ENLARGED', draw: one('held', 'top', true), b: topZoom, w: full }],
          [{ title: 'SIDE · THE NEAR HAND ON THE JACKET', draw: one('held', 'side', true), b: near, w: full }],
          [{ title: 'ABOVE · THE HANDS ON THE JACKET', draw: one('held', 'top', true), b: [-60, 0, 520, 520], w: half }],
          [{ title: 'ABOVE · NEAR HAND CLOSE', draw: one('held', 'top', true), b: [-20, 170, 220, 220], w: full }],
          [{ title: 'ABOVE · FAR HAND CLOSE', draw: one('held', 'top', true), b: [-20, -170, 220, 220], w: full }],
        ]}
      />
      <Board
        width={width}
        title="F02 Clothing — WORN: Mei walking in place in the leather jacket"
        note="The approved cast jacket in the lesson's leather brown over her shirt, the arms swinging past its front."
        rows={[
          [
            { title: 'SIDE · CURRENT', draw: one('worn', 'side', false), b: [-150, 300, 2400, 2000], w: half },
            { title: 'SIDE · NEW', draw: one('worn', 'side', true), b: [-150, 300, 2400, 2000], w: half },
          ],
          [
            { title: 'ABOVE · CURRENT', draw: one('worn', 'top', false), b: [-150, 0, 2000, 1500], w: half },
            { title: 'ABOVE · NEW', draw: one('worn', 'top', true), b: [-150, 0, 2000, 1500], w: half },
          ],
          [{ title: 'SIDE · NEW, ENLARGED', draw: one('worn', 'side', true), b: [-150, 250, 900, 1000], w: full }],
          [
            { title: 'SIDE · THE SWINGING NEAR HAND', draw: one('worn', 'side', true), b: [-290, 360, 300, 300], w: half },
            { title: 'ABOVE · NEW, ENLARGED', draw: one('worn', 'top', true), b: [-150, 0, 700, 700], w: half },
          ],
        ]}
      />
      <Board
        width={width}
        title="F02 Clothing — LIVE STAGE"
        rows={[
          [
            { title: 'SIDE · CURRENT', draw: one('live', 'side', false), b: [600, 0, 4200, 3000], w: half },
            { title: 'SIDE · NEW', draw: one('live', 'side', true), b: [600, 0, 4200, 3000], w: half },
          ],
        ]}
      />
      <Text style={{ color: DIM, fontSize: 11 }}>{`(floor ${F02_FLOOR} mm under the fabric; the holder's neck at x ${HOLDER.neck.x})`}</Text>
    </View>
  );
}

/* ── the boom pole operator (F02, F08) ── */

/** The engine's pole (PlacementScene PoleMount: from the mic's tail to the hands, the slope at the hands) and
 *  the operator, in a world frame: the hands at x = 0, the floor at y = 0; `flip` the mic toward +x. */
function PoleCase({ slope, H, v2, flip = false, view = 'side' }: { slope: number; H: number; v2: boolean; flip?: boolean; view?: 'side' | 'top' }) {
  const t = (slope * Math.PI) / 180;
  const s = flip ? -1 : 1;
  const hands = { u: 0, v: view === 'side' ? -H : 0 };
  const run = Math.cos(t) * POLE_LEN;
  const tail = { u: -s * run, v: view === 'side' ? -H - Math.sin(t) * POLE_LEN : 0 };
  const p = Skia.Path.Make();
  p.moveTo(tail.u, tail.v);
  p.lineTo(hands.u, hands.v);
  const pole = (
    <Group>
      <Path path={p} style="stroke" strokeWidth={POLE_RADIUS * 2 + 4} strokeCap="round" color="#060608" />
      <Path path={p} style="stroke" strokeWidth={POLE_RADIUS * 2} strokeCap="round" color="#2b2e35" />
      <Group transform={[{ translateX: -1.2 }, { translateY: -1.8 }]}>
        <Path path={p} style="stroke" strokeWidth={3} strokeCap="round" color="#c9ced8" opacity={0.45} />
      </Group>
    </Group>
  );
  // (as PoleMount: side — mirrored to face the mic; from above — turned along the pole)
  const xf = view === 'side' ? [{ scaleX: s }] : [{ rotate: flip ? Math.PI : 0 }];
  const op = v2 ? <PoleOperatorV2 view={view} pole={{ slopeDeg: slope, handsH: H, flip }} /> : <PoleOperatorArt view={view} />;
  return v2 ? (
    <Group>
      {pole}
      <Group transform={xf}>{op}</Group>
    </Group>
  ) : (
    <Group>
      <Group transform={xf}>{op}</Group>
      {pole}
    </Group>
  );
}

function Boom({ width }: { width: number }) {
  const half = Math.floor(Math.min(300, (width - 32) / 2));
  const full = Math.min(2 * half + 8, width - 24);
  const box: B = [-300, -1100, 2600, 2400];
  const zoom: B = [80, -1500, 900, 900];
  const cases: { slope: number; H: number; flip?: boolean; note: string }[] = [
    { slope: 33, H: 1400, note: 'F02 boom start (33° up to the mic)' },
    { slope: 3, H: 1400, flip: true, note: 'F08 tracked start (nearly level), mic toward +x' },
    { slope: 0, H: 1400, note: 'level' },
    { slope: -25, H: 1400, note: 'the mic below the hands' },
    { slope: 60, H: 1400, note: 'steep (the engine limit)' },
    { slope: 60, H: 1760, note: 'a very high mic: the hands lifted' },
  ];
  return (
    <View>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 8 }}>
        THE GEOMETRY, CHECKED FIRST: the engine's pole ends at the operator's hands, in front of the body, and runs away from the body toward the mic — it never crosses the head or the face (test sweeps every slope). So its drawn direction is NOT changed; the old drawing's hold had one hand off the pole at most slopes. New: the operator (Ruth) is re-solved for the pole's slope, both fists closed round its thick rear section, a twist-lock collar where the engine's thinner pole carries on.
      </Text>
      {cases.map((c, i) => {
        const r = poleRigFor({ slopeDeg: c.slope, handsH: c.H, flip: !!c.flip });
        const fx = c.flip ? -1 : 1;
        const front = { u: fx * r.front.x * (r.flip ? -1 : 1), v: r.front.y };
        return (
          <Board
            key={i}
            width={width}
            title={`Boom operator — ${c.note}`}
            note={`slope ${c.slope}°, hands ${c.H} mm up; the hands ${r.gap} mm apart on the pole; the body ${r.back} mm behind the rear fist`}
            rows={[
              [
                { title: 'SIDE · CURRENT', draw: <PoleCase slope={c.slope} H={c.H} v2={false} flip={c.flip} />, b: [fx * 300, -1000, 2800, 2400], w: half },
                { title: 'SIDE · NEW', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} />, b: [fx * 300, -1000, 2800, 2400], w: half },
              ],
              ...(i < 2
                ? [
                    [{ title: 'SIDE · NEW, ENLARGED', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} />, b: [fx * 180, -c.H - 50, 900, 900] as B, w: full }],
                    [
                      { title: 'REAR (NEAR) HAND', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} />, b: [0, -c.H, 220, 220] as B, w: half },
                      { title: 'FRONT (FAR) HAND', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} />, b: [front.u, front.v, 220, 220] as B, w: half },
                    ],
                    [
                      { title: 'ABOVE · CURRENT', draw: <PoleCase slope={c.slope} H={c.H} v2={false} flip={c.flip} view="top" />, b: [fx * 200, 0, 1600, 1200] as B, w: half },
                      { title: 'ABOVE · NEW', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} view="top" />, b: [fx * 200, 0, 1600, 1200] as B, w: half },
                    ],
                    [{ title: 'ABOVE · NEW, ENLARGED', draw: <PoleCase slope={c.slope} H={c.H} v2 flip={c.flip} view="top" />, b: [fx * 180, 0, 800, 600] as B, w: full }],
                  ]
                : []),
            ]}
          />
        );
      })}
      <Text style={{ color: DIM, fontSize: 11 }}>{`(box ${box.join(',')}, zoom ${zoom.join(',')})`}</Text>
    </View>
  );
}

/* ── F08 ── */

function F08({ width }: { width: number }) {
  const half = Math.floor(Math.min(300, (width - 32) / 2));
  const full = Math.min(2 * half + 8, width - 24);
  const walker = sitePersonWho(0);
  return (
    <View>
      <Board
        width={width}
        title="F08 Pass-bys — the walking route: the walker is Kofi (the site's one person)"
        note="The site plan's people are the cast's (SiteArt `v2`, the F06 builder's). The tracked shotgun's operator is on the /foley3-boom page."
        rows={[
          [
            { title: 'SECTION · CURRENT', draw: <F08Site view="side" variant="walk" v2={false} />, b: [2150, -3500, 9700, 8400], w: half },
            { title: 'SECTION · NEW', draw: <F08Site view="side" variant="walk" v2 />, b: [2150, -3500, 9700, 8400], w: half },
          ],
          [{ title: 'SECTION · NEW, THE WALKER ENLARGED', draw: <F08Site view="side" variant="walk" v2 />, b: [ROUTE_X, -900, 900, 1900], w: full }],
          [
            { title: 'PLAN · CURRENT', draw: <F08Site view="top" variant="walk" v2={false} />, b: [ROUTE_X, -9000, 1400, 1400], w: half },
            { title: 'PLAN · NEW', draw: <F08Site view="top" variant="walk" v2 />, b: [ROUTE_X, -9000, 1400, 1400], w: half },
          ],
          [
            { title: 'PAGE TOKEN (2.5×) · CURRENT', draw: <Group transform={[{ scale: 2.5 }]}><SitePerson f={{ kind: 'person', c: [0, 0], heading: 90, role: 'walker' }} view="top" /></Group>, b: [0, 0, 2400, 2400], w: half },
            { title: 'PAGE TOKEN (2.5×) · NEW', draw: <Group transform={[{ scale: 2.5 }]}><SitePerson f={{ kind: 'person', c: [0, 0], heading: 90, role: 'walker' }} view="top" v2 who={walker} /></Group>, b: [0, 0, 2400, 2400], w: half },
          ],
        ]}
      />
      <Board
        width={width}
        title="F08 Pass-bys — the vehicle paper plan: the crew Kofi and Mei"
        rows={[
          [
            { title: 'PLAN · CURRENT', draw: <F08Site view="top" variant="vehicle" v2={false} />, b: [-2200, 1000, 3000, 8000], w: half },
            { title: 'PLAN · NEW', draw: <F08Site view="top" variant="vehicle" v2 />, b: [-2200, 1000, 3000, 8000], w: half },
          ],
          [
            { title: 'SECTION · CURRENT', draw: <F08Site view="side" variant="vehicle" v2={false} />, b: [-2200, -900, 2400, 2200], w: half },
            { title: 'SECTION · NEW', draw: <F08Site view="side" variant="vehicle" v2 />, b: [-2200, -900, 2400, 2200], w: half },
          ],
        ]}
      />
    </View>
  );
}

/* ── F10 ── */

function F10({ width }: { width: number }) {
  const half = Math.floor(Math.min(300, (width - 32) / 2));
  const full = Math.min(2 * half + 8, width - 24);
  const w = along(PLAZA.walk.a, PLAZA.walk.b, WALKER_AT);
  const s = PLAZA.singerMouth;
  const e = EVENT.perfMouth;
  return (
    <View>
      <Board
        width={width}
        title="F10 Spatial Field — the plaza: the street singer Ana, the walker Kofi, the listener Mei"
        rows={[
          [
            { title: 'SIDE · CURRENT', draw: <F10Site view="side" variant="plaza" v2={false} />, b: [1500, -1500, 7000, 4200], w: half },
            { title: 'SIDE · NEW', draw: <F10Site view="side" variant="plaza" v2 />, b: [1500, -1500, 7000, 4200], w: half },
          ],
          [
            { title: 'SIDE · THE SINGER, ENLARGED', draw: <F10Site view="side" variant="plaza" v2 />, b: [s.x + 100, -850, 900, 1900], w: half },
            { title: 'SIDE · THE WALKER (FACE-ON), ENLARGED', draw: <F10Site view="side" variant="plaza" v2 />, b: [w.x, -850, 900, 1900], w: half },
          ],
          [
            { title: 'SIDE · SINGER HAND', draw: <F10Site view="side" variant="plaza" v2 />, b: [s.x + 60, -700, 300, 300], w: half },
            { title: 'SIDE · WALKER HANDS', draw: <F10Site view="side" variant="plaza" v2 />, b: [w.x, -800, 600, 400], w: half },
          ],
          [
            { title: 'ABOVE · CURRENT', draw: <F10Site view="top" variant="plaza" v2={false} />, b: [1500, 0, 7000, 6000], w: half },
            { title: 'ABOVE · NEW', draw: <F10Site view="top" variant="plaza" v2 />, b: [1500, 0, 7000, 6000], w: half },
          ],
          [
            { title: 'ABOVE · SINGER', draw: <F10Site view="top" variant="plaza" v2 />, b: [s.x + 100, s.z, 900, 900], w: half },
            { title: 'ABOVE · LISTENER', draw: <F10Site view="top" variant="plaza" v2 />, b: [0, 0, 900, 900], w: half },
          ],
          [{ title: 'ABOVE · WALKER', draw: <F10Site view="top" variant="plaza" v2 />, b: [w.x, w.z, 900, 900], w: half }],
        ]}
      />
      <Board
        width={width}
        title="F10 Spatial Field — the event: the performer (Ana) on the stage"
        rows={[
          [
            { title: 'SIDE · CURRENT', draw: <F10Site view="side" variant="event" v2={false} />, b: [e.x - 500, -1800, 5000, 4200], w: half },
            { title: 'SIDE · NEW', draw: <F10Site view="side" variant="event" v2 />, b: [e.x - 500, -1800, 5000, 4200], w: half },
          ],
          [{ title: 'SIDE · NEW, ENLARGED', draw: <F10Site view="side" variant="event" v2 />, b: [e.x + 100, e.y + 700, 900, 1900], w: full }],
          [
            { title: 'ABOVE · CURRENT', draw: <F10Site view="top" variant="event" v2={false} />, b: [e.x - 500, 0, 5000, 4000], w: half },
            { title: 'ABOVE · NEW', draw: <F10Site view="top" variant="event" v2 />, b: [e.x - 500, 0, 5000, 4000], w: half },
          ],
        ]}
      />
    </View>
  );
}

function Heads({ width }: { width: number }) {
  const half = Math.floor(Math.min(300, (width - 32) / 2));
  const old = headAbove(pt(0, 0), 114);
  return (
    <Board
      width={width}
      title="F10 — the listener's head from above (the in-ear page, the playback page): Mei"
      note="The in-ear housings and the headphones stay where the page draws them; the head is placed (and sized a few percent) so its ears sit under them."
      rows={[
        [
          { title: 'IN-EAR · CURRENT', draw: <Group transform={[{ rotate: -Math.PI / 2 }]}><FigureHead fill={old.fill} /></Group>, b: [0, 0, 340, 340], w: half },
          { title: 'IN-EAR · NEW (HEAD ONLY)', draw: <ListenerHeadV2 mid={{ u: -4, v: 0 }} half={85} face={0} />, b: [0, 0, 340, 340], w: half },
        ],
        [
          { title: 'PLAYBACK · CURRENT', draw: <Group transform={[{ rotate: Math.PI }]}><FigureHead fill={old.fill} /></Group>, b: [0, 0, 340, 340], w: half },
          { title: 'PLAYBACK · NEW (HEAD ONLY)', draw: <ListenerHeadV2 mid={{ u: 0, v: 10 }} half={90} face={-Math.PI / 2} />, b: [0, 0, 340, 340], w: half },
        ],
      ]}
    />
  );
}

export function Foley3Study({ width, only }: { width: number; only: string }) {
  const pick = only.split('-')[1] ?? 'f02';
  return (
    <View>
      <Text style={{ color: INK, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Foley3 — F02, F08, F10: current beside new</Text>
      <Text style={{ color: DIM, fontSize: 12, marginBottom: 12 }}>One page each: /foley3-f02, /foley3-boom, /foley3-f08, /foley3-f10, /foley3-heads.</Text>
      {pick === 'f02' ? <F02 width={width} /> : null}
      {pick === 'boom' ? <Boom width={width} /> : null}
      {pick === 'f08' ? <F08 width={width} /> : null}
      {pick === 'f10' ? <F10 width={width} /> : null}
      {pick === 'heads' ? <Heads width={width} /> : null}
    </View>
  );
}
