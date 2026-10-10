/**
 * F14 LOUDSPEAKER AND SOUND SYSTEM MEASUREMENT — the look (charter §2 layer
 * 3): three scenes, one per variant —
 *
 *   bench   the floor, the two-way test loudspeaker on its stand, you
 *           standing back (the measurement family's own drawings)
 *   venue   the shared venue (shared/measure/VenueArt.tsx)
 *   studio  a control room: the front wall, a pair of monitors on stands, the
 *           desk, the chair at the listening position, the triangle between
 *           them drawn faint in plan
 *
 * and the lesson's own pages. FULLY SILENT; nothing moves by itself.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { make, Operator, rectP, TestSpeaker } from '../shared/measure/MeasureArt';
import { VenueArt } from '../shared/measure/VenueArt';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { VENUE } from '../shared/measure/venue.ts';
import { DESK, F14_OP_SIDE, F14_OP_TOP, F14_VIEWS, LISTEN, MAIN_L_GEOM, MON, monGeom, OP14, SPK14, STUDIO_ROOM } from './geometry.ts';
import { F14_PAGES, F14_STEP_COUNTS } from './pages';

const EDGE = '#07080a';

/* ── the bench ── */

function Floor({ view, box }: { view: ViewId; box: { u0: number; u1: number; v0: number; v1: number } }) {
  const p = useMemo(() => {
    const slab = make();
    const seams = make();
    if (view === 'side') rectP(slab, box.u0 - 200, 0, box.u1 + 200, 60);
    else {
      rectP(slab, box.u0 - 200, box.v0 - 200, box.u1 + 200, box.v1 + 200);
      for (let x = Math.ceil((box.u0 - 200) / 600) * 600; x < box.u1 + 200; x += 600) {
        seams.moveTo(x, box.v0 - 200);
        seams.lineTo(x, box.v1 + 200);
      }
      for (let z = Math.ceil((box.v0 - 200) / 600) * 600; z < box.v1 + 200; z += 600) {
        seams.moveTo(box.u0 - 200, z);
        seams.lineTo(box.u1 + 200, z);
      }
    }
    return { slab, seams };
  }, [view, box]);
  return (
    <Group>
      <Path path={p.slab}>
        <LinearGradient start={vec(0, view === 'side' ? 0 : -1000)} end={vec(0, view === 'side' ? 60 : 2000)} colors={view === 'side' ? ['#3a3a3f', '#1f2024'] : ['#1d1e22', '#18191c']} />
      </Path>
      <Path path={p.seams} style="stroke" strokeWidth={3} color="#26272c" />
    </Group>
  );
}

function Bench({ view }: { view: ViewId }) {
  return (
    <Group>
      <Floor view={view} box={F14_VIEWS.bench[view]} />
      <TestSpeaker g={SPK14} view={view} />
      <Operator pose={view === 'side' ? F14_OP_SIDE : F14_OP_TOP} />
    </Group>
  );
}

/* ── the studio ── */

function buildStudio(view: ViewId) {
  const R = STUDIO_ROOM;
  const walls = make();
  const desk = make();
  const legs = make();
  const chair = make();
  const tri = make();
  if (view === 'side') {
    rectP(walls, R.front - 200, -1950, R.front, 60);
    rectP(walls, R.rear, -1950, R.rear + 200, 60);
    rectP(desk, DESK.x0, -DESK.top, DESK.x1, -DESK.top + 40, 8);
    rectP(legs, DESK.x0 + 20, -DESK.top + 40, DESK.x0 + 70, 0, 6);
    rectP(legs, DESK.x1 - 70, -DESK.top + 40, DESK.x1 - 20, 0, 6);
    rectP(legs, DESK.x0 + 70, -DESK.top + 40, DESK.x0 + 90, -260, 4);
    // The chair in profile: a seat pan, a back behind the head position, a column and a five-star base.
    const cx = LISTEN.x + 120;
    rectP(chair, cx - 230, -500, cx + 230, -440, 18);
    rectP(chair, cx + 250, -1080, cx + 300, -520, 18);
    rectP(chair, cx - 20, -440, cx + 20, -90, 6);
    rectP(chair, cx - 300, -90, cx + 300, -60, 10);
  } else {
    rectP(walls, R.front - 200, -R.half - 200, R.rear + 200, -R.half);
    rectP(walls, R.front - 200, R.half, R.rear + 200, R.half + 200);
    rectP(walls, R.front - 200, -R.half, R.front, R.half);
    rectP(walls, R.rear, -R.half, R.rear + 200, R.half);
    rectP(desk, DESK.x0, -DESK.half, DESK.x1, DESK.half, 20);
    const cx = LISTEN.x + 120;
    chair.addCircle(cx, 0, 260);
    rectP(chair, cx + 230, -230, cx + 300, 230, 30);
    tri.moveTo(MON.x, -MON.z);
    tri.lineTo(LISTEN.x, 0);
    tri.lineTo(MON.x, MON.z);
    tri.close();
  }
  return { walls, desk, legs, chair, tri };
}

function Studio({ view }: { view: ViewId }) {
  const p = useMemo(() => buildStudio(view), [view]);
  return (
    <Group>
      <Floor view={view} box={F14_VIEWS.studio[view]} />
      <Path path={p.walls}>
        <LinearGradient start={vec(STUDIO_ROOM.front, -2000)} end={vec(STUDIO_ROOM.rear, 2000)} colors={['#45464c', '#2b2c30']} />
      </Path>
      {view === 'top' ? (
        <Path path={p.tri} style="stroke" strokeWidth={8} color="#6fa8ff" opacity={0.35}>
          <DashPathEffect intervals={[40, 30]} />
        </Path>
      ) : null}
      <Path path={p.legs} color="#2a2c31" />
      <Path path={p.desk}>
        <LinearGradient start={vec(DESK.x0, -DESK.half)} end={vec(DESK.x1, DESK.half)} colors={['#6b5440', '#3f3226']} />
      </Path>
      <Path path={p.desk} style="stroke" strokeWidth={6} color={EDGE} />
      <Path path={p.chair}>
        <LinearGradient start={vec(LISTEN.x - 300, -1100)} end={vec(LISTEN.x + 400, 0)} colors={['#3a3d44', '#1d1f23']} />
      </Path>
      <Path path={p.chair} style="stroke" strokeWidth={6} color={EDGE} />
      <TestSpeaker g={monGeom(-MON.z)} view={view} />
      {view === 'top' ? <TestSpeaker g={monGeom(MON.z)} view="top" /> : null}
    </Group>
  );
}

function Scene({ view, variant }: { view: ViewId; variant: VariantId }) {
  if (variant === 'venue') return <VenueArt view={view} />;
  if (variant === 'studio') return <Studio view={view} />;
  return <Bench view={view} />;
}

/* ── hit areas and labels ── */

const V = VENUE;
const M = MAIN_L_GEOM;
const mg = monGeom(-MON.z);
const B = ['bench'] as const;
const VN = ['venue'] as const;
const ST = ['studio'] as const;

const HITS: SceneHits = {
  side: [
    { id: 'spk.tweeter', u0: -30, u1: 25, v0: -1370, v1: -1310, variants: B },
    { id: 'spk.woofer', u0: -30, u1: 30, v0: -1230, v1: -1060, variants: B },
    { id: 'spk.port', u0: -10, u1: 10, v0: -1076, v1: -1050, variants: B },
    { id: 'spk.box', u0: -250, u1: 0, v0: -1430, v1: -1030, variants: B },
    { id: 'spk.stand', u0: -315, u1: 65, v0: -1030, v1: 0, variants: B },
    { id: 'op', u0: OP14.x - 260, u1: OP14.x + 260, v0: -1800, v1: 0, variants: B },
    { id: 'mainL', u0: M.front - M.depth, u1: M.front + 30, v0: M.top, v1: M.bottom, variants: VN },
    { id: 'mainL.stand', u0: M.front - M.depth / 2 - 190, u1: M.front - M.depth / 2 + 190, v0: M.bottom, v1: -V.stage.deck, variants: VN },
    { id: 'fill', u0: V.fill.x - V.fill.depth, u1: V.fill.x + 30, v0: -V.stage.deck - V.fill.h, v1: -V.stage.deck, variants: VN },
    { id: 'sub', u0: V.sub.x0, u1: V.sub.x1 + 40, v0: -V.sub.h, v1: 0, variants: VN },
    { id: 'stage', u0: V.stage.x0, u1: V.stage.x1, v0: -V.stage.deck, v1: 0, variants: VN },
    { id: 'seats', u0: V.rows[0] - 250, u1: V.rows[V.rows.length - 1] + 320, v0: -900, v1: 0, variants: VN },
    { id: 'standing', u0: V.standing.x0 - 350, u1: V.standing.x0 - 210, v0: -1090, v1: 0, variants: VN },
    { id: 'monL', u0: mg.front - mg.depth, u1: mg.front + 20, v0: mg.top, v1: mg.bottom, variants: ST },
    { id: 'monL.stand', u0: mg.front - mg.depth / 2 - 190, u1: mg.front - mg.depth / 2 + 190, v0: mg.bottom, v1: 0, variants: ST },
    { id: 'desk', u0: DESK.x0, u1: DESK.x1, v0: -DESK.top, v1: 0, variants: ST },
    { id: 'chair', u0: LISTEN.x - 120, u1: LISTEN.x + 430, v0: -1090, v1: 0, variants: ST },
  ],
  top: [
    { id: 'spk.box', u0: -250, u1: 20, v0: -125, v1: 125, variants: B },
    { id: 'spk.stand', u0: -315, u1: 65, v0: -170, v1: 170, variants: B },
    { id: 'op', u0: OP14.x - 280, u1: OP14.x + 280, v0: OP14.z - 280, v1: OP14.z + 280, variants: B },
    { id: 'mainL', u0: M.front - M.depth - 200, u1: M.front + 30, v0: -V.main.z - 280, v1: -V.main.z + 280, variants: VN },
    { id: 'mainR', u0: M.front - M.depth - 200, u1: M.front + 30, v0: V.main.z - 280, v1: V.main.z + 280, variants: VN },
    { id: 'fill', u0: V.fill.x - V.fill.depth, u1: V.fill.x + 30, v0: -V.fill.half, v1: V.fill.half, variants: VN },
    { id: 'sub', u0: V.sub.x0, u1: V.sub.x1 + 40, v0: -V.sub.half, v1: V.sub.half, variants: VN },
    { id: 'seats', u0: V.rows[0] - 250, u1: V.rows[V.rows.length - 1] + 270, v0: -4750, v1: -650, variants: VN },
    { id: 'seats', u0: V.rows[0] - 250, u1: V.rows[V.rows.length - 1] + 270, v0: 650, v1: 4750, variants: VN },
    { id: 'standing', u0: V.standing.x0 - 320, u1: V.standing.x1, v0: -V.room.half + 200, v1: V.room.half - 200, variants: VN },
    { id: 'monL', u0: mg.front - mg.depth, u1: mg.front + 20, v0: -MON.z - MON.half, v1: -MON.z + MON.half, variants: ST },
    { id: 'monR', u0: mg.front - mg.depth, u1: mg.front + 20, v0: MON.z - MON.half, v1: MON.z + MON.half, variants: ST },
    { id: 'desk', u0: DESK.x0, u1: DESK.x1, v0: -DESK.half, v1: DESK.half, variants: ST },
    { id: 'chair', u0: LISTEN.x - 140, u1: LISTEN.x + 420, v0: -260, v1: 260, variants: ST },
  ],
};

const LABELS = {
  side: [
    { id: 'spk.box', text: 'TEST LOUDSPEAKER', short: 'SPEAKER', u: -125, v: -1560, align: 'center' as const, at: { u: -125, v: -1430 }, variants: B },
    { id: 'spk.tweeter', text: 'TWEETER', u: 90, v: -1420, align: 'left' as const, at: { u: 12, v: -1340 }, variants: B },
    { id: 'spk.woofer', text: 'WOOFER', u: 110, v: -1030, align: 'left' as const, at: { u: 18, v: -1145 }, variants: B },
    { id: 'spk.stand', text: 'STAND', u: -125, v: -380, align: 'center' as const, variants: B },
    { id: 'op', text: 'YOU, STANDING BACK', short: 'YOU', u: OP14.x, v: -1900, align: 'center' as const, variants: B, at: { u: OP14.x, v: -1640 }, alts: [{ u: OP14.x - 420, v: -1300, align: 'right' as const }] },
    { id: 'mainL', text: 'LEFT MAIN', short: 'MAIN', u: M.front - M.depth / 2, v: M.top - 260, align: 'center' as const, at: { u: M.front - M.depth / 2, v: M.top }, variants: VN },
    { id: 'fill', text: 'FRONT FILL', short: 'FILL', u: 300, v: -1500, align: 'left' as const, at: { u: V.fill.x - 100, v: -V.stage.deck - V.fill.h }, variants: VN },
    { id: 'sub', text: 'SUB', u: (V.sub.x0 + V.sub.x1) / 2 + 900, v: -900, align: 'left' as const, at: { u: V.sub.x1, v: -V.sub.h }, variants: VN },
    { id: 'stage', text: 'STAGE', u: -1800, v: -1150, align: 'center' as const, variants: VN },
    { id: 'seats', text: 'SEATS', u: 7000, v: -1500, align: 'center' as const, at: { u: 7000, v: -900 }, variants: VN },
    { id: 'standing', text: 'STANDING', u: 13000, v: -2300, align: 'center' as const, variants: VN },
    { id: 'monL', text: 'MONITOR', u: -120, v: -1600, align: 'center' as const, at: { u: -120, v: mg.top }, variants: ST },
    { id: 'desk', text: 'DESK', u: (DESK.x0 + DESK.x1) / 2, v: -1100, align: 'center' as const, at: { u: (DESK.x0 + DESK.x1) / 2, v: -DESK.top }, variants: ST },
    { id: 'chair', text: 'LISTENING POSITION', short: 'LISTENING', u: LISTEN.x + 1000, v: -1500, align: 'left' as const, at: { u: LISTEN.x + 120, v: -1080 }, variants: ST },
  ],
  top: [
    { id: 'spk.box', text: 'TEST LOUDSPEAKER', short: 'SPEAKER', u: -125, v: -330, align: 'center' as const, variants: B },
    { id: 'op', text: 'YOU, STANDING BACK', short: 'YOU', u: OP14.x, v: OP14.z - 420, align: 'center' as const, variants: B, at: { u: OP14.x, v: OP14.z }, alts: [{ u: OP14.x - 380, v: OP14.z, align: 'right' as const }, { u: OP14.x, v: OP14.z + 420, align: 'center' as const }] },
    { id: 'mainL', text: 'LEFT MAIN', short: 'MAIN', u: -1700, v: -3700, align: 'center' as const, at: { u: M.front - M.depth / 2, v: -V.main.z }, variants: VN },
    { id: 'fill', text: 'FRONT FILL', short: 'FILL', u: -1700, v: -700, align: 'center' as const, at: { u: V.fill.x - 100, v: 0 }, variants: VN },
    { id: 'sub', text: 'SUB', u: 1650, v: 0, align: 'center' as const, at: { u: V.sub.x1, v: 0 }, variants: VN },
    { id: 'standing', text: 'STANDING', u: 13000, v: 0, align: 'center' as const, variants: VN },
    { id: 'monL', text: 'LEFT MONITOR', short: 'LEFT', u: -120, v: -1450, align: 'center' as const, at: { u: -120, v: -MON.z - MON.half }, variants: ST },
    { id: 'desk', text: 'DESK', u: (DESK.x0 + DESK.x1) / 2, v: 0, align: 'center' as const, variants: ST },
    { id: 'chair', text: 'LISTENING POSITION', short: 'LISTENING', u: LISTEN.x + 150, v: -900, align: 'center' as const, at: { u: LISTEN.x + 150, v: -260 }, variants: ST },
  ],
};

export const F14_ART: LessonArt = {
  Instrument: Scene,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  pages: F14_PAGES,
  stepCounts: F14_STEP_COUNTS,
};
