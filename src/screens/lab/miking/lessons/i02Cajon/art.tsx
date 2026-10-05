/**
 * I02 CAJÓN — the look (charter §2 layer 3), drawn ONLY from the states and
 * the SEAT in model.ts, in millimetres of the view's (u, v): side u = x,
 * v = y; top u = x, v = z.
 *
 *   SIDE  camera on the player's right: the box (front plate to the right),
 *         its port edge-on on the back (or on the front ledge, facing up),
 *         the snare wires dashed inside the plate's top; the SEATED player —
 *         astride the top, leaning over, knees either side of the plate,
 *         feet on the floor; the right hand at a top corner (the slap), the
 *         left at the middle (the bass).
 *   TOP   the box from above, the thighs over its top, the hands on the
 *         plate between the knees; the rear port edge-on on the back, or the
 *         upward front port as a round hole.
 * Proportions ILLUSTRATIVE (proposal Frame J). Nothing moves.
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { INK, make, oval, rrect } from '../shared/concert/paths.ts';
import { Hand, SKIN, SKIN_RIM, SLEEVE, SLEEVE_RIM } from '../shared/smallperc/Hand';
import { openHand, placeBetween, smoothPathD, tubeOutline, type Pt } from '../shared/smallperc/hands.ts';
import { Arm2D } from '../shared/smallperc/Player';
import { BH, CAJ_DIMS, HX, HZ, PORT_R, SEAT, stateOf, type CajState } from './model.ts';

const OPEN = openHand(14);
const fromD = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
const tube = (pts: Pt[], w0: number, w1: number) => fromD(smoothPathD(tubeOutline(pts, w0, w1)));
const side = (p: { x: number; y: number }): Pt => [p.x, p.y];
const top = (p: { x: number; z: number }): Pt => [p.x, p.z];
const BIRCH = ['#ecd2a2', '#d5b07a', '#b48a54', '#86622f'];
const PLATE = ['#5b3a22', '#7a5030', '#4a2e1a'];
const TROUSER = ['#4a5060', '#2e333e', '#1a1d24'];
const SHOE = ['#3a3a3e', '#1c1c1f', '#0b0b0c'];
const HAIR = ['#4a3426', '#2b1d14', '#140d09'];
const DARK = '#120b06';

/* ── The box ── */

function BoxSide({ s }: { s: CajState }) {
  const front = s.id === 'frontport';
  const lo = CAJ_DIMS.ledgeH.mm;
  const g = useMemo(() => {
    const body = make();
    body.moveTo(-HX, -BH);
    body.lineTo(s.plateX, -BH);
    body.lineTo(s.plateX, front ? -lo : 0);
    if (front) {
      body.lineTo(HX, -lo);
      body.lineTo(HX, 0);
    }
    body.lineTo(-HX, 0);
    body.close();
    const plate = rrect(make(), s.plateX - CAJ_DIMS.plateT.mm - 3, -BH + 2, s.plateX + 1, front ? -lo : -2, 2);
    const feet = make();
    for (const x of [-HX + 18, HX - 42]) rrect(feet, x, -CAJ_DIMS.feet.mm, x + 24, 0, 3);
    const snares = make();
    for (let i = 0; i < 2; i++) {
      snares.moveTo(s.plateX - 14 - i * 9, -BH + 20);
      snares.lineTo(s.plateX - 14 - i * 9, -BH + 165);
    }
    const port = front ? oval(make(), (s.plateX + HX) / 2, -lo, CAJ_DIMS.portF.mm / 2, 6) : oval(make(), -HX - 3, s.port.y, 9, PORT_R);
    const grain = make();
    for (let k = 1; k < 6; k++) {
      const y = -BH + (k * BH) / 6;
      grain.moveTo(-HX + 12, y);
      grain.cubicTo(-HX * 0.4, y - 6, 0, y + 7, s.plateX - 20, y - 2);
    }
    const seat = rrect(make(), -HX + 6, -BH - 7, s.plateX - 6, -BH + 1, 4);
    return { body, plate, feet, snares, port, grain, seat };
  }, [s, front, lo]);
  return (
    <Group>
      <Path path={g.body}>
        <LinearGradient start={vec(-HX, -BH)} end={vec(s.plateX, 0)} colors={BIRCH} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={1.2} color="#9a7442" opacity={0.35} />
      <Path path={g.seat} color="#c19a64" />
      <Path path={g.body} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.plate}>
        <LinearGradient start={vec(s.plateX - 8, -BH)} end={vec(s.plateX, 0)} colors={PLATE} />
      </Path>
      <Path path={g.snares} style="stroke" strokeWidth={2} color="#c8ccd4" opacity={0.75}>
        <DashPathEffect intervals={[5, 4]} />
      </Path>
      <Path path={g.port} color={DARK} />
      <Path path={g.feet} color="#1b1c20" />
    </Group>
  );
}

function BoxTop({ s }: { s: CajState }) {
  const front = s.id === 'frontport';
  const g = useMemo(() => {
    const body = rrect(make(), -HX, -HZ, HX, HZ, 6);
    const topFace = rrect(make(), -HX + 10, -HZ + 10, s.plateX - 10, HZ - 10, 4);
    const ledge = front ? rrect(make(), s.plateX, -HZ, HX, HZ, 3) : null;
    const plateEdge = rrect(make(), s.plateX - 5, -HZ + 2, s.plateX + 1, HZ - 2, 2);
    const port = front ? oval(make(), s.port.x, 0, CAJ_DIMS.portF.mm / 2 - 10, CAJ_DIMS.portF.mm / 2) : rrect(make(), -HX - 4, -PORT_R, -HX + 3, PORT_R, 2);
    return { body, topFace, ledge, plateEdge, port };
  }, [s, front]);
  return (
    <Group>
      <Path path={g.body} color="#000" opacity={0.4} transform={[{ translateX: 18 }, { translateY: 24 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={g.body}>
        <LinearGradient start={vec(-HX, -HZ)} end={vec(HX, HZ)} colors={BIRCH} />
      </Path>
      <Path path={g.topFace} color="#c9a46c" opacity={0.6} />
      {g.ledge ? <Path path={g.ledge} color="#b48a54" /> : null}
      <Path path={g.body} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.plateEdge} color={PLATE[1]} />
      <Path path={g.port} color={DARK} />
    </Group>
  );
}

/* ── The seated player ── */

function Head({ c, scale = 1 }: { c: Pt; scale?: number }) {
  const g = useMemo(() => {
    const [x, y] = c;
    const hair: Pt[] = [
      [x - 92, y + 24],
      [x - 86, y - 70],
      [x - 10, y - 112],
      [x + 70, y - 78],
      [x + 48, y - 52],
      [x - 20, y - 46],
      [x - 52, y + 20],
    ];
    const nose: Pt[] = [
      [x + 92, y - 10],
      [x + 108, y + 22],
      [x + 92, y + 30],
    ];
    return {
      head: oval(make(), x, y, 96 * scale, 108 * scale),
      hair: fromD(smoothPathD(hair)),
      ear: oval(make(), x - 30, y + 8, 14, 22),
      nose: fromD(smoothPathD(nose, false)),
    };
  }, [c, scale]);
  return (
    <Group>
      <Path path={g.head}>
        <RadialGradient c={vec(c[0] + 26, c[1] - 40)} r={180} colors={SKIN} />
      </Path>
      <Path path={g.head} style="stroke" strokeWidth={2.2} color={SKIN_RIM} />
      <Path path={g.hair}>
        <LinearGradient start={vec(c[0] - 90, c[1] - 110)} end={vec(c[0] + 70, c[1] + 20)} colors={HAIR} />
      </Path>
      <Path path={g.ear} color={SKIN[2]} />
      <Path path={g.ear} style="stroke" strokeWidth={1.6} color={SKIN_RIM} />
      <Path path={g.nose} style="stroke" strokeWidth={2.2} strokeCap="round" strokeJoin="round" color={SKIN_RIM} />
    </Group>
  );
}

/** One leg seen from the side: thigh over the top, knee, shin, shoe. */
function LegSide({ far = false }: { far?: boolean }) {
  const g = useMemo(() => {
    const hip = side(SEAT.hip);
    const knee = side(SEAT.knee);
    const ankle = side(SEAT.ankle);
    const thigh = tube([[hip[0] - 10, hip[1] - 20], [(hip[0] + knee[0]) / 2, hip[1] - 4], knee], 150, 118);
    const shin = tube([knee, [knee[0] + 18, (knee[1] + ankle[1]) / 2], ankle], 112, 82);
    const shoe: Pt[] = [
      [ankle[0] - 52, ankle[1] - 18],
      [ankle[0] + 24, ankle[1] - 30],
      [SEAT.toe.x + 22, -40],
      [SEAT.toe.x + 30, -6],
      [ankle[0] - 58, -4],
    ];
    return { thigh, shin, shoe: fromD(smoothPathD(shoe)) };
  }, []);
  return (
    <Group opacity={far ? 0.78 : 1}>
      <Path path={g.shin}>
        <LinearGradient start={vec(SEAT.knee.x - 60, SEAT.knee.y)} end={vec(SEAT.ankle.x + 60, SEAT.ankle.y)} colors={TROUSER} />
      </Path>
      <Path path={g.shin} style="stroke" strokeWidth={2.2} color="#0b0c0f" />
      <Path path={g.thigh}>
        <LinearGradient start={vec(SEAT.hip.x, SEAT.hip.y - 80)} end={vec(SEAT.knee.x, SEAT.knee.y + 60)} colors={TROUSER} />
      </Path>
      <Path path={g.thigh} style="stroke" strokeWidth={2.2} color="#0b0c0f" />
      <Path path={g.shoe}>
        <LinearGradient start={vec(SEAT.ankle.x, -110)} end={vec(SEAT.toe.x, 0)} colors={SHOE} />
      </Path>
      <Path path={g.shoe} style="stroke" strokeWidth={2} color="#000" />
    </Group>
  );
}

function TorsoSide() {
  const g = useMemo(() => {
    const h = SEAT.hip;
    const sh = SEAT.shoulder;
    // Leaning over the box: the back curves from the seat to the nape, the
    // chest and belly fold toward the lap.
    const pts: Pt[] = [
      [h.x - 105, h.y + 20],
      [h.x - 100, h.y - 115],
      [h.x - 50, h.y - 275],
      [sh.x - 120, sh.y],
      [sh.x - 40, sh.y - 70],
      [sh.x + 40, sh.y - 45],
      [sh.x + 70, sh.y + 30],
      [sh.x + 40, sh.y + 140],
      [h.x + 150, h.y - 155],
      [h.x + 110, h.y - 50],
      [h.x + 50, h.y + 5],
    ];
    const neck: Pt[] = [
      [sh.x - 30, sh.y - 55],
      [sh.x + 45, sh.y - 40],
      [SEAT.head.x + 10, SEAT.head.y + 90],
      [SEAT.head.x - 50, SEAT.head.y + 70],
    ];
    return { torso: fromD(smoothPathD(pts)), neck: fromD(smoothPathD(neck)) };
  }, []);
  return (
    <Group>
      <Path path={g.neck}>
        <LinearGradient start={vec(SEAT.shoulder.x - 40, SEAT.shoulder.y)} end={vec(SEAT.head.x, SEAT.head.y + 80)} colors={SKIN} />
      </Path>
      <Path path={g.torso}>
        <LinearGradient start={vec(SEAT.hip.x - 140, SEAT.shoulder.y)} end={vec(SEAT.shoulder.x + 90, SEAT.hip.y)} colors={SLEEVE} />
      </Path>
      <Path path={g.torso} style="stroke" strokeWidth={2.4} color={SLEEVE_RIM} />
    </Group>
  );
}

function SeatedTop() {
  const g = useMemo(() => {
    const legs = [1, -1].map((k) => {
      const hip: Pt = [SEAT.hip.x, k * SEAT.hipZ];
      const knee: Pt = [SEAT.knee.x, k * SEAT.kneeZ];
      return { thigh: tube([hip, [(hip[0] + knee[0]) / 2, k * (SEAT.hipZ + 30)], knee], 150, 120), shoe: rrect(make(), SEAT.ankle.x - 40, k * (SEAT.ankleZ + 8) - 46, SEAT.toe.x + 28, k * (SEAT.ankleZ + 8) + 46, 40) };
    });
    const sh: Pt[] = [
      [SEAT.shoulder.x - 120, -210],
      [SEAT.shoulder.x + 20, -232],
      [SEAT.shoulder.x + 92, -150],
      [SEAT.shoulder.x + 104, 0],
      [SEAT.shoulder.x + 92, 150],
      [SEAT.shoulder.x + 20, 232],
      [SEAT.shoulder.x - 120, 210],
      [SEAT.shoulder.x - 160, 0],
    ];
    return { legs, sh: fromD(smoothPathD(sh)), head: oval(make(), SEAT.head.x + 10, 0, 100, 88), nose: oval(make(), SEAT.head.x + 112, 0, 13, 11) };
  }, []);
  return (
    <Group>
      {g.legs.map((l, i) => (
        <Group key={i}>
          <Path path={l.shoe}>
            <LinearGradient start={vec(SEAT.ankle.x, -260)} end={vec(SEAT.toe.x, 260)} colors={SHOE} />
          </Path>
          <Path path={l.thigh}>
            <LinearGradient start={vec(SEAT.hip.x, -200)} end={vec(SEAT.knee.x, 200)} colors={TROUSER} />
          </Path>
          <Path path={l.thigh} style="stroke" strokeWidth={2.2} color="#0b0c0f" />
        </Group>
      ))}
      <Path path={g.sh}>
        <LinearGradient start={vec(SEAT.shoulder.x - 150, -230)} end={vec(SEAT.shoulder.x + 100, 230)} colors={SLEEVE} />
      </Path>
      <Path path={g.sh} style="stroke" strokeWidth={2.4} color={SLEEVE_RIM} />
      <Path path={g.nose} color={SKIN[1]} />
      <Path path={g.head}>
        <RadialGradient c={vec(SEAT.head.x - 30, -40)} r={150} colors={HAIR} />
      </Path>
      <Path path={g.head} style="stroke" strokeWidth={2} color="#0c0806" />
    </Group>
  );
}

export function CajonArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const P = view === 'side' ? side : top;
  const plR = useMemo(() => placeBetween(OPEN, P(s.R.W), P(s.R.G)), [s, view]); // eslint-disable-line react-hooks/exhaustive-deps
  const plL = useMemo(() => placeBetween(OPEN, P(s.L.W), P(s.L.G), view === 'top'), [s, view]); // eslint-disable-line react-hooks/exhaustive-deps
  if (view === 'top') {
    return (
      <Group>
        <BoxTop s={s} />
        <SeatedTop />
        <Arm2D s={top(s.L.S)} e={top(s.L.E)} w={top(s.L.W)} />
        <Hand geo={OPEN} pl={plL} />
        <Arm2D s={top(s.R.S)} e={top(s.R.E)} w={top(s.R.W)} />
        <Hand geo={OPEN} pl={plR} />
      </Group>
    );
  }
  return (
    <Group>
      <LegSide far />
      <Arm2D s={side(s.L.S)} e={side(s.L.E)} w={side(s.L.W)} opacity={0.8} />
      <Hand geo={OPEN} pl={plL} opacity={0.8} />
      <BoxSide s={s} />
      <TorsoSide />
      <Head c={side(SEAT.head)} />
      <LegSide />
      <Arm2D s={side(s.R.S)} e={side(s.R.E)} w={side(s.R.W)} />
      <Hand geo={OPEN} pl={plR} />
    </Group>
  );
}

export function cajonLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const front = s.id === 'frontport';
  if (view === 'top') {
    return [
      { id: 'plate', text: 'FRONT PLATE', short: 'PLATE', u: s.plateX + 20, v: -HZ - 40, align: 'left' },
      front ? { id: 'port', text: 'PORT (FACING UP)', short: 'PORT ↑', u: s.port.x + 60, v: HZ + 50, align: 'left', tone: 'muted' } : { id: 'port', text: 'PORT (ON THE BACK)', short: 'PORT', u: -HX - 20, v: HZ + 50, align: 'right', tone: 'muted' },
      { id: 'player', text: 'PLAYER (SEATED)', short: 'PLAYER', u: -200, v: -300, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'plate', text: 'FRONT PLATE', short: 'PLATE', u: s.plateX + 30, v: -BH + 40, align: 'left' },
    { id: 'snares', text: 'SNARE WIRES (INSIDE)', short: 'SNARES', u: s.plateX + 30, v: -BH + 100, align: 'left', tone: 'muted' },
    front ? { id: 'port', text: 'PORT ↑ (ON THE LEDGE)', short: 'PORT ↑', u: HX + 30, v: -CAJ_DIMS.ledgeH.mm + 10, align: 'left', tone: 'muted' } : { id: 'port', text: 'PORT (ON THE BACK) →', short: 'PORT →', u: -HX - 20, v: s.port.y, align: 'right', tone: 'muted' },
    { id: 'player', text: 'PLAYER, SEATED ON THE BOX', short: 'PLAYER', u: -260, v: -1250, align: 'center', tone: 'muted' },
  ];
}

export function cajonHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const front = s.id === 'frontport';
  const lo = CAJ_DIMS.ledgeH.mm;
  if (view === 'side') {
    if (front ? Math.abs(u - s.port.x) <= CAJ_DIMS.portF.mm / 2 + tol && Math.abs(v + lo) <= 14 + tol : Math.abs(u + HX) <= 14 + tol && Math.abs(v - s.port.y) <= PORT_R + tol) return `caj.port.${s.id}`;
    if (u >= s.plateX - 20 && u <= s.plateX + tol && v >= -BH && v <= (front ? -lo : 0)) return v < -BH + 170 ? `caj.snares.${s.id}` : `caj.plate.${s.id}`;
    if (front && u >= s.plateX && u <= HX + tol && v >= -lo && v <= 0) return 'caj.ledge.frontport';
    if (u >= -HX - tol && u <= s.plateX && v >= -BH - tol && v <= 0) return `caj.box.${s.id}`;
    return null;
  }
  if (front && Math.hypot(u - s.port.x, v) <= CAJ_DIMS.portF.mm / 2 + tol) return `caj.port.${s.id}`;
  if (!front && Math.abs(u + HX) <= 14 + tol && Math.abs(v) <= PORT_R + tol) return `caj.port.${s.id}`;
  if (Math.abs(u - s.plateX) <= 12 + tol && Math.abs(v) <= HZ) return `caj.plate.${s.id}`;
  if (u >= -HX - tol && u <= HX + tol && Math.abs(v) <= HZ + tol) return u > s.plateX ? 'caj.ledge.frontport' : `caj.box.${s.id}`;
  return null;
}

export const CAJ_ART: LessonArt = { Instrument: CajonArt, labels: cajonLabels, hitTest: cajonHitTest };
