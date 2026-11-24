/**
 * M06 TIMPANI — the look (charter §2 layer 3), drawn ONLY from model.ts and
 * the timpano drawing defaults, in millimetres of the view's (u, v): side
 * u = x, v = y (the floor at 0, the heads at −h); top u = x, v = z.
 *
 * SIDE: the camera stands on the player's right (+z) looking across the set,
 * so the drums overlap; the farther ones are drawn first and dimmed. TOP:
 * every drum from above, the pedals toward the player (left). The mallets
 * are drawn in the player's hands (illustrative positions). Nothing moves
 * (D8); the drums' paths are built once (TimpaniArt caches them).
 */
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { TimpanoSide, TimpanoTop } from '../shared/concert/TimpaniArt';
import { TIMPANO_DRAW } from '../shared/concert/timpanoSpec.ts';
import { Mallet, MALLET_SIZES } from '../shared/concert/Mallets';
import { FLOOR, make, rect, seg } from '../shared/concert/paths.ts';
import { drumOf, HEAD_Y, R26, R29, TIMPANI, type Timpano } from './model.ts';
import { PLAYER_SHIFT, PLAYER_Z, TIMP_MALLETS, type MalletPose3 } from './malletPose.ts';
import { metalSidePose, metalTopPose } from '../shared/metal/metalFigure.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { PlayerSideV2, PlayerTopV2 } from '../shared/figureV2/playersV2';
import { TIMP_NEAR_POSE, TIMPANIST, timpanistSidePlan, timpanistTopPlan } from './timpanistV2.ts';
import { MalletInBackHand } from '../shared/figureV2/malletHeld';

/** The new look (figure V2, wave 3 set 3b): the timpanist is Kofi of the cast, each hand closed on its mallet. */
export const V2 = figureV2On('sidePlayers');

/** The mallets as drawn, butt (`grip`) to ball (`head`): [0] at the stroke,
 *  [1] raised. */
export const MALLETS = {
  side: TIMP_MALLETS.map((m) => ({ grip: { x: m.butt.x, y: m.butt.y }, head: { x: m.ball.x, y: m.ball.y } })),
  top: TIMP_MALLETS.map((m) => ({ grip: { x: m.butt.x, y: m.butt.z }, head: { x: m.ball.x, y: m.ball.z } })),
};

/** THE TIMPANIST (art grading fix 2026-10-16: the mallets hung in mid-air
 *  with only a "← PLAYER" arrow): the house figure standing behind the 29 in
 *  drum, inside the model's player keep-out (env.player), a fist closed on
 *  each mallet's grip — the left (far) hand on the one at the stroke, the
 *  right (near) on the raised one. The metal family's standing poses stand
 *  at u ≈ −362, z = 0; they are moved by PLAYER_SHIFT (and PLAYER_Z from
 *  above). Drawn receded. */
const mvS = (p: MalletPose3['hand']) => [p.x - PLAYER_SHIFT, p.y] as const;
const mvT = (p: MalletPose3['hand']) => [p.x - PLAYER_SHIFT, p.z - PLAYER_Z] as const;
export const SIDE_POSE = metalSidePose([mvS(TIMP_MALLETS[0].hand), mvS(TIMP_MALLETS[1].hand)]);
export const TOP_POSE = metalTopPose([mvT(TIMP_MALLETS[0].hand), mvT(TIMP_MALLETS[1].hand)]).pose;
const SHIFT = [{ translateX: PLAYER_SHIFT }];
const SHIFT_TOP = [{ translateX: PLAYER_SHIFT }, { translateY: PLAYER_Z }];

const shown = (variant: VariantId): Timpano[] => TIMPANI.filter((t) => variant === 'four' || !t.four);

let fl: { floor: ReturnType<typeof make>; edge: ReturnType<typeof make> } | null = null;
const floorPaths = () => (fl ??= { floor: rect(make(), -4000, 0, 4000, 600), edge: seg(make(), -4000, 0, 4000, 0) });

export function TimpaniArt({ view, variant, v2 = V2 }: { view: ViewId; variant: VariantId; /** (the study page compares the old look) */ v2?: boolean }) {
  const drums = shown(variant);
  if (v2) return <TimpaniArtV2 view={view} drums={drums} />;
  if (view === 'top') {
    return (
      <Group>
        <Group transform={SHIFT_TOP}>
          <PlayerBehind pose={TOP_POSE} dim={0.6} />
        </Group>
        {drums.map((t) => (
          <Group key={t.id} transform={[{ translateX: t.c.x }, { translateY: t.c.z }]}>
            <TimpanoTop R={t.d.mm / 2} pedalA={Math.PI} />
          </Group>
        ))}
        {MALLETS.top.map((m, i) => (
          <Mallet key={i} kind="timpani" grip={m.grip} head={m.head} />
        ))}
        <Group transform={SHIFT_TOP}>
          <PlayerInFront pose={TOP_POSE} dim={0.6} />
        </Group>
      </Group>
    );
  }
  // Farthest from the camera (smallest z) first; the nearest drawn last, brightest.
  const order = [...drums].sort((a, b) => a.c.z - b.c.z);
  const FL = floorPaths();
  return (
    <Group>
      <Path path={FL.floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={FLOOR} />
      </Path>
      <Path path={FL.edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
      <Group transform={SHIFT}>
        <PlayerBehind pose={SIDE_POSE} dim={0.6} />
      </Group>
      {order.map((t, i) => (
        <Group key={t.id} transform={[{ translateX: t.c.x }]}>
          <TimpanoSide R={t.d.mm / 2} headY={HEAD_Y} floorY={0} dim={i === order.length - 1 ? 1 : 0.62 + 0.12 * i} />
        </Group>
      ))}
      {MALLETS.side.map((m, i) => (
        <Mallet key={i} kind="timpani" grip={m.grip} head={m.head} opacity={i === 1 ? 0.55 : 1} />
      ))}
      <Group transform={SHIFT}>
        <PlayerInFront pose={SIDE_POSE} dim={0.6} />
      </Group>
    </Group>
  );
}

/** The side view's half-plane past the far (left) hand's grip point toward its mallet's head: where its shaft shows. */
let farFromGrip: ReturnType<typeof Skia.Path.Make> | null = null;
const FAR_FROM_GRIP_OF = () => (farFromGrip ??= makeFarFromGrip());
function makeFarFromGrip() {
  const m = TIMP_MALLETS[0];
  const L = Math.hypot(m.ball.x - m.hand.x, m.ball.y - m.hand.y) || 1;
  const d = { u: (m.ball.x - m.hand.x) / L, v: (m.ball.y - m.hand.y) / L };
  const n = { u: -d.v, v: d.u };
  const p = Skia.Path.Make();
  const o = { u: m.hand.x, v: m.hand.y };
  p.moveTo(o.u + n.u * 2000, o.v + n.v * 2000);
  p.lineTo(o.u - n.u * 2000, o.v - n.v * 2000);
  p.lineTo(o.u - n.u * 2000 + d.u * 3000, o.v - n.v * 2000 + d.v * 3000);
  p.lineTo(o.u + n.u * 2000 + d.u * 3000, o.v + n.v * 2000 + d.v * 3000);
  p.close();
  return p;
}

/** The mallet as the hand holds it (its shaft passes through the fist). */
const malletNode = (m: (typeof MALLETS)['side'][number], opacity = 1) => <Mallet kind="timpani" grip={m.grip} head={m.head} opacity={opacity} />;

/**
 * THE NEW LOOK: from the side the timpanist stands behind the drums (the drums
 * cover the legs), each mallet through its fist; the mallets' lower ends are
 * drawn again over the drums (where they reach the heads), clipped below the
 * hands so a hand is never covered. From above the whole player is drawn over
 * the drums (the legs lie under the shoulders).
 */
function TimpaniArtV2({ view, drums }: { view: ViewId; drums: Timpano[] }) {
  if (view === 'top') {
    return (
      <Group>
        {drums.map((t) => (
          <Group key={t.id} transform={[{ translateX: t.c.x }, { translateY: t.c.z }]}>
            <TimpanoTop R={t.d.mm / 2} pedalA={Math.PI} />
          </Group>
        ))}
        <PlayerTopV2 plan={timpanistTopPlan()} hollow who={TIMPANIST} dim={0.6} farStick={malletNode(MALLETS.top[0])} nearStick={malletNode(MALLETS.top[1])} />
      </Group>
    );
  }
  const order = [...drums].sort((a, b) => a.c.z - b.c.z);
  const FL = floorPaths();
  return (
    <Group>
      <Path path={FL.floor}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 60)} colors={FLOOR} />
      </Path>
      <Path path={FL.edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
      {/* (2026-11-24, the two fists: the near hand's raised mallet is drawn SOLID — ghosted, as the current look draws
          it, it read as passing behind the far fist, held by it; solid, with its soft shadow on the far fist, it reads in
          front, in its own hand) */}
      {/* (coordinator 2026-11-24: "always make sure the stick is within the hand") the far hand lies behind the near
          one, its fingers hidden: its mallet is drawn only from its grip point toward the head (the butt end is inside
          the far fist, behind the near fist), so no shaft ever lies across the outside of a hand */}
      {/* (owner 2026-11-24, "Raise the hands") the near (right) hand is the approved mallet hand, its arm re-posed
          (timpanistV2 TIMP_NEAR_POSE); the far (left) keeps the drummer's palm-side fist */}
      <PlayerSideV2
        plan={timpanistSidePlan()}
        who={TIMPANIST}
        dim={0.6}
        farStick={<Group clip={FAR_FROM_GRIP_OF()}>{malletNode(MALLETS.side[0])}</Group>}
        nearStick={
          TIMP_NEAR_POSE ? (
            <MalletInBackHand grip={TIMP_MALLETS[1].hand} head={TIMP_MALLETS[1].ball} shaftR={MALLET_SIZES.timpani.shaftR}>
              {malletNode(MALLETS.side[1])}
            </MalletInBackHand>
          ) : (
            malletNode(MALLETS.side[1])
          )
        }
        separate
      />
      {order.map((t, i) => (
        <Group key={t.id} transform={[{ translateX: t.c.x }]}>
          <TimpanoSide R={t.d.mm / 2} headY={HEAD_Y} floorY={0} dim={i === order.length - 1 ? 1 : 0.62 + 0.12 * i} />
        </Group>
      ))}
      {/* the mallets where they reach over the drums (below the hands) */}
      <Group clip={OVER_DRUMS}>
        {MALLETS.side.map((m, i) => (
          <Mallet key={i} kind="timpani" grip={m.grip} head={m.head} />
        ))}
      </Group>
    </Group>
  );
}
/** The region over the drums, under the hands: the mallets are drawn again only here. */
const OVER_DRUMS = { x: -4000, y: HEAD_Y - TIMPANO_DRAW.hoopUp - 60, width: 8000, height: 4000 };

export function timpaniLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const four = variant === 'four';
  if (view === 'top') {
    const out: ArtLabel[] = shown(variant).map((t) => ({ id: `d${t.inch}`, text: `${t.inch} IN`, u: t.c.x + t.d.mm / 2 + 70, v: t.c.z, align: 'left' as const, at: { u: t.c.x + t.d.mm * 0.3, v: t.c.z } }));
    out.push({ id: 'player', text: 'TIMPANIST', u: -900, v: four ? -560 : -480, align: 'center', tone: 'muted', at: { u: -362 + PLAYER_SHIFT, v: PLAYER_Z - 14 } });
    out.push({ id: 'cond', text: 'CONDUCTOR →', short: 'CONDUCTOR', u: 930, v: four ? 1420 : 820, align: 'right', tone: 'muted' });
    // its leader to the 29 in drum's pedal (it ended in empty glass: clash sweep 2026-10-10)
    out.push({ id: 'pedals', text: 'PEDALS', u: -R29 - 140, v: four ? -760 : -650, align: 'center', tone: 'illustrative', at: { u: -R29 - 140, v: drumOf('t29').c.z } });
    return out;
  }
  return [
    // (review 2026-11-24: the HEADS and BOWLS leaders ran across the timpanist's legs and hips — the labels
    // are set on the drums' open side, away from the player, their leaders landing on the same parts)
    { id: 'heads', text: four ? 'HEADS (FOUR DRUMS)' : 'HEADS (29 AND 26 IN)', short: 'HEADS', u: R29 + 200, v: HEAD_Y - TIMPANO_DRAW.hoopUp - 170, align: 'left', at: { u: R29 * 0.8, v: HEAD_Y - 8 } },
    // Each leader lands ON its part; the player cue is an arrow only (clash
    // sweep 2026-10-10: the PLAYER, MALLETS, BOWLS and PEDAL leaders ended
    // in empty glass).
    { id: 'bowl', text: 'BOWLS (KETTLES)', short: 'BOWLS', u: R29 + 200, v: HEAD_Y + 330, align: 'left', at: { u: R29 * 0.72, v: HEAD_Y + 170 } },
    { id: 'pedal', text: 'PEDAL', u: -R29 - 160, v: -120, align: 'center', tone: 'illustrative', at: { u: -R29 - 140, v: -30 } },
    { id: 'mallets', text: 'MALLETS', u: -560, v: -1250, align: 'center', tone: 'illustrative', at: { u: (MALLETS.side[1].grip.x + MALLETS.side[1].head.x) / 2, v: (MALLETS.side[1].grip.y + MALLETS.side[1].head.y) / 2 } },
    // (review 2026-11-24: its dot sat on his temple — it lands on his back below the shoulder, the label behind
    // him, so the leader never crosses his face)
    { id: 'player', text: 'TIMPANIST', u: -362 + PLAYER_SHIFT - 330, v: -1640, align: 'right', tone: 'muted', at: { u: -362 + PLAYER_SHIFT - 95, v: -1330 } },
    { id: 'cond', text: 'CONDUCTOR →', short: 'COND. →', u: 930, v: -560, align: 'right', tone: 'muted' },
    { id: 'floor', text: 'FLOOR', u: 930, v: -24, align: 'right', tone: 'illustrative' },
  ];
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function timpaniHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const drums = shown(variant);
  if (view === 'top') {
    for (const t of drums) {
      const R = t.d.mm / 2;
      const r = Math.hypot(u - t.c.x, v - t.c.z);
      if (u < t.c.x - R - TIMPANO_DRAW.pedal.gap + tol && u > t.c.x - R - TIMPANO_DRAW.pedal.gap - TIMPANO_DRAW.pedal.len - tol && Math.abs(v - t.c.z) <= TIMPANO_DRAW.pedal.w / 2 + tol) return `tp.pedal${t.inch}`;
      if (r <= R) return `tp.head${t.inch}`;
      if (r <= R + TIMPANO_DRAW.handle + tol) return `tp.hoop${t.inch}`;
    }
    return null;
  }
  // Side: the nearest drum (largest z) whose outline holds the point.
  const near = [...drums].sort((a, b) => b.c.z - a.c.z);
  for (const t of near) {
    const R = t.d.mm / 2;
    const dx = u - t.c.x;
    if (Math.abs(dx) <= R + tol && Math.abs(v - HEAD_Y) <= 16 + tol) return `tp.head${t.inch}`;
    if (dx < -R - TIMPANO_DRAW.pedal.gap + tol && dx > -R - TIMPANO_DRAW.pedal.gap - TIMPANO_DRAW.pedal.len - tol && v >= -80 - tol) return `tp.pedal${t.inch}`;
    if (Math.abs(dx) <= R + TIMPANO_DRAW.handle + tol && v >= HEAD_Y - 50 && v < HEAD_Y - 16) return `tp.hoop${t.inch}`;
    if (Math.abs(dx) <= R + TIMPANO_DRAW.lip + tol && v > HEAD_Y && v <= HEAD_Y + 2 * R * TIMPANO_DRAW.depthK) return `tp.bowl${t.inch}`;
  }
  return null;
}
