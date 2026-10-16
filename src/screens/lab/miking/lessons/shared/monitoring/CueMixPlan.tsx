/**
 * THE STUDIO HEADPHONE MIX from above (owner 2026-10-15), drawn from the pure
 * geometry in cueMix.ts at true size in the caller's plan (mm):
 *
 *   • a personal headphone mixer at each performer's station — its sloped
 *     panel with the channel knobs, the master knob and the small display,
 *     clamped on a round-base stand — its front (the phones jack) toward the
 *     performer;
 *   • the performer's closed-back headphones on the head (or resting on the
 *     seat when the plan draws no figure), plugged into that mixer by its own
 *     coiled cord;
 *   • each mixer's own feed back to the distribution point at the room edge
 *     (CONTROL ROOM), every feed its own traceable lane (D69).
 *
 * The caller adds the words (HEADPHONE MIX, CONTROL ROOM) through its own
 * label layout: `cueLabels` gives them.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { CUE_MIXER, cueCups, cueFeeds, cueHub, cuePhones, type CueRig, type CueStation, type PlanPt } from './cueMix.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const INK = '#08080a';
/** The feed cables: one colour, so a learner follows each one by its lane. */
export const CUE_FEED_COLOR = '#5fb3d9';
const PHONES_COLOR = '#c3c7cf';

function rr(x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  const p = Skia.Path.Make();
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function polyline(pts: readonly PlanPt[]): SkPath {
  const p = Skia.Path.Make();
  pts.forEach((q, i) => (i === 0 ? p.moveTo(q.u, q.v) : p.lineTo(q.u, q.v)));
  return p;
}

/** One personal mixer in its local frame (front = +x, toward the performer). */
function MixerTop() {
  const g = useMemo(() => {
    const W = CUE_MIXER.d; // along x (depth)
    const H = CUE_MIXER.w; // along y (width)
    const body = rr(-W / 2, -H / 2, W / 2, H / 2, 16);
    const panel = rr(-W / 2 + 14, -H / 2 + 12, W / 2 - 22, H / 2 - 12, 10);
    const lip = rr(W / 2 - 22, -H / 2 + 8, W / 2, H / 2 - 8, 8);
    const knobs: { x: number; y: number }[] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) knobs.push({ x: -W / 2 + 34 + i * 30, y: -H / 2 + 34 + j * 30 });
    const screen = rr(-W / 2 + 26, H / 2 - 92, -W / 2 + 70, H / 2 - 30, 4);
    return { body, panel, lip, knobs, screen, W, H };
  }, []);
  return (
    <Group>
      <Group transform={[{ translateX: 10 }, { translateY: 12 }]}>
        <Path path={g.body} color="#000" opacity={0.5}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(-g.W / 2, -g.H / 2)} end={vec(g.W / 2, g.H / 2)} colors={['#4b4f59', '#2a2c33', '#15161a']} />
      </Path>
      <Path path={g.panel} color="#1c1d22" />
      <Path path={g.lip} color="#3a3d45" />
      {g.knobs.map((k, i) => (
        <Circle key={i} cx={k.x} cy={k.y} r={9}>
          <RadialGradient c={vec(k.x - 3, k.y - 3)} r={12} colors={['#e9ecf2', '#8a8f99', '#30333a']} />
        </Circle>
      ))}
      <Circle cx={g.W / 2 - 52} cy={g.H / 2 - 52} r={22}>
        <RadialGradient c={vec(g.W / 2 - 58, g.H / 2 - 58)} r={28} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
      </Circle>
      <Path path={g.screen} color="#2f6f8f" opacity={0.9} />
      <Path path={g.body} style="stroke" strokeWidth={3} color="#6a6f7a" />
      {/* the phones jack on the front edge */}
      <Circle cx={g.W / 2 - 6} cy={0} r={8} color={INK} />
    </Group>
  );
}

/** The stand's round cast base under the mixer (plan, true size). */
function StandBase({ at }: { at: PlanPt }) {
  return (
    <Group>
      <Circle cx={at.u + 8} cy={at.v + 10} r={CUE_MIXER.baseR} color="#000" opacity={0.45}>
        <BlurMask blur={12} style="normal" />
      </Circle>
      <Circle cx={at.u} cy={at.v} r={CUE_MIXER.baseR}>
        <RadialGradient c={vec(at.u - 50, at.v - 50)} r={CUE_MIXER.baseR * 1.6} colors={['#5a5e68', '#2a2c32', '#121316']} />
      </Circle>
      <Circle cx={at.u} cy={at.v} r={CUE_MIXER.baseR} style="stroke" strokeWidth={4} color="#7a7f8a" />
    </Group>
  );
}

/** Closed-back headphones from above: two cups either side of the head and
 *  the band over the crown. */
function PhonesTop({ s }: { s: CueStation }) {
  const g = useMemo(() => {
    const [a, b] = cueCups(s);
    const band = Skia.Path.Make();
    const bu = -Math.cos(s.facing) * 30;
    const bv = -Math.sin(s.facing) * 30;
    band.moveTo(a.u, a.v);
    band.quadTo(s.head.u + bu, s.head.v + bv, b.u, b.v);
    return { a, b, band };
  }, [s]);
  const deg = s.facing;
  const cup = (c: PlanPt, k: number) => (
    <Group key={k} transform={[{ translateX: c.u }, { translateY: c.v }, { rotate: deg }]}>
      <Path path={rr(-48, -30, 48, 30, 26)}>
        <LinearGradient start={vec(-48, -30)} end={vec(48, 30)} colors={['#3a3d45', '#1b1c20', '#0b0b0d']} />
      </Path>
      <Path path={rr(-48, -30, 48, 30, 26)} style="stroke" strokeWidth={3} color="#7a7f8a" />
    </Group>
  );
  return (
    <Group>
      <Path path={g.band} style="stroke" strokeWidth={22} strokeCap="round" color="#141518" />
      <Path path={g.band} style="stroke" strokeWidth={12} strokeCap="round" color="#6a6f7a" />
      {cup(g.a, 0)}
      {cup(g.b, 1)}
    </Group>
  );
}

/** The distribution point at the room edge: a wall box with a jack per feed. */
function HubTop({ rig }: { rig: CueRig }) {
  const r = cueHub(rig).rect;
  return (
    <Group>
      <Path path={rr(r.u0, r.v0, r.u1, r.v1, 10)}>
        <LinearGradient start={vec(r.u0, r.v0)} end={vec(r.u1, r.v1)} colors={['#8f949f', '#4a4e57', '#24262c']} />
      </Path>
      <Path path={rr(r.u0, r.v0, r.u1, r.v1, 10)} style="stroke" strokeWidth={4} color={INK} />
    </Group>
  );
}

/**
 * The whole headphone mix for one studio plan. Draw it AFTER the figures so
 * the headphones sit on the heads; feeds and stands go under the mixers.
 * `phonesOnSeat`: the plan draws no figure — the headphones rest where the
 * player sits.
 */
export function CueMixPlan({ rig }: { rig: CueRig }) {
  const feeds = useMemo(() => cueFeeds(rig).map((c) => polyline(c.pts)), [rig]);
  const cords = useMemo(
    () =>
      rig.stations.map((s) => {
        const c = cuePhones(s);
        const p = Skia.Path.Make();
        p.moveTo(c.pts[0].u, c.pts[0].v);
        p.quadTo(c.pts[1].u, c.pts[1].v, c.pts[2].u, c.pts[2].v);
        return p;
      }),
    [rig],
  );
  return (
    <Group>
      {feeds.map((p, i) => (
        <Group key={`f${i}`}>
          <Path path={p} style="stroke" strokeWidth={26} strokeJoin="round" strokeCap="round" color={INK} opacity={0.85} />
          <Path path={p} style="stroke" strokeWidth={16} strokeJoin="round" strokeCap="round" color={CUE_FEED_COLOR} />
        </Group>
      ))}
      <HubTop rig={rig} />
      {rig.stations.map((s) => (
        <StandBase key={`b${s.id}`} at={s.at} />
      ))}
      {rig.stations.map((s) => {
        const ang = Math.atan2(s.head.v - s.at.v, s.head.u - s.at.u);
        return (
          <Group key={`m${s.id}`} transform={[{ translateX: s.at.u }, { translateY: s.at.v }, { rotate: ang }]}>
            <MixerTop />
          </Group>
        );
      })}
      {cords.map((p, i) => (
        <Group key={`c${i}`}>
          <Path path={p} style="stroke" strokeWidth={16} strokeCap="round" color={INK} opacity={0.85} />
          <Path path={p} style="stroke" strokeWidth={9} strokeCap="round" color={PHONES_COLOR} />
        </Group>
      ))}
      {rig.stations.map((s) => (
        <PhonesTop key={`p${s.id}`} s={s} />
      ))}
    </Group>
  );
}

export { cueLabels } from './cueMix.ts';
