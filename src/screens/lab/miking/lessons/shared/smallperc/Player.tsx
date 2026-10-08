/**
 * SMALL-PERCUSSION FAMILY — the PLAYER, drawn: the standing body from the
 * side (camera on the player's right) and from above, and an ARM (shoulder →
 * elbow → wrist: a T-shirt sleeve over the upper arm, then skin), drawn from
 * the 3-D arm points in geom.ts so the picture and the keep-outs agree. The
 * hand itself is Hand.tsx. Proportions are ILLUSTRATIVE (proposal §A), lit
 * from the upper left. Paths are built once (useMemo); nothing moves (D8).
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { smoothPathD, tubeOutline, type Pt } from './hands.ts';
import { SKIN, SKIN_RIM, SLEEVE, SLEEVE_RIM } from './Hand';
import { PLAYER } from './geom.ts';
import { FigureHead, headAbove, headProfile } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

const fromD = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
const TROUSER = ['#3a3f4a', '#23272f', '#14161b'];
const tube = (a: Pt, b: Pt, w0: number, w1: number) => fromD(smoothPathD(tubeOutline([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], w0, w1)));

/** The standing player seen from the right: legs, torso, neck, head. The
 *  near (right) arm is drawn separately (Arm2D), over the torso. */
export function PlayerSide({ opacity = 1 }: { opacity?: number }) {
  const g = useMemo(() => {
    const H = (h: number) => -h;
    const torso: Pt[] = [
      [-300, H(1455)],
      [-262, H(1385)],
      [-246, H(1290)],
      [-252, H(1170)],
      [-266, H(1040)],
      [-272, H(940)],
      [-468, H(930)],
      [-452, H(1080)],
      [-462, H(1250)],
      [-470, H(1360)],
      [-420, H(1455)],
    ];
    const legs: Pt[] = [
      [-282, H(960)],
      [-290, H(520)],
      [-300, H(70)],
      [-226, H(28)],
      [-222, H(4)],
      [-420, H(4)],
      [-424, H(70)],
      [-440, H(520)],
      [-462, H(960)],
    ];
    return {
      torso: fromD(smoothPathD(torso)),
      legs: fromD(smoothPathD(legs)),
      // The head and neck: the figure's own skin silhouette in profile,
      // facing +x, the neck down into the collar (head fix 2026-10-08 — a head
      // ON A BODY is PlayerFigure's FigureHead, never an oval with hair).
      // Head centre at 1606 (figure review 2026-10-08: at 1632 the neck showed
      // ~120 mm between jaw and collar, a stretched neck).
      head: headProfile(pt(-346, H(1606)), 108, H(1440), 1).fill,
      belt: fromD(smoothPathD([[-272, H(952)], [-468, H(944)]], false)),
    };
  }, []);
  return (
    <Group opacity={opacity}>
      <Path path={g.legs}>
        <LinearGradient start={vec(PLAYER.backX, -900)} end={vec(PLAYER.chestX, 0)} colors={TROUSER} />
      </Path>
      <Path path={g.legs} style="stroke" strokeWidth={2.2} color="#0b0c0f" />
      <FigureHead fill={g.head} />
      <Path path={g.torso}>
        <LinearGradient start={vec(PLAYER.backX, -1460)} end={vec(PLAYER.chestX, -940)} colors={SLEEVE} />
      </Path>
      <Path path={g.torso} style="stroke" strokeWidth={2.4} color={SLEEVE_RIM} />
      <Path path={g.belt} style="stroke" strokeWidth={14} strokeCap="round" color="#17181c" />
    </Group>
  );
}

/** The standing player from above: shoulders and the head — the figure's own
 *  skin silhouette from above (head fix 2026-10-08), facing +x. */
export function PlayerTop({ opacity = 1 }: { opacity?: number }) {
  const g = useMemo(() => {
    const x = PLAYER.shoulderX;
    const sh: Pt[] = [
      [x - 100, -235],
      [x + 30, -255],
      [x + 105, -160],
      [x + 118, 0],
      [x + 105, 160],
      [x + 30, 255],
      [x - 100, 235],
      [x - 128, 0],
    ];
    return {
      sh: fromD(smoothPathD(sh)),
      shadow: fromD(smoothPathD(sh.map((p) => [p[0] + 18, p[1] + 26] as Pt))),
      head: headAbove(pt(0, 0), 100).fill,
    };
  }, []);
  const x = PLAYER.shoulderX;
  return (
    <Group opacity={opacity}>
      <Path path={g.shadow} color="#000" opacity={0.45}>
        <BlurMask blur={16} style="normal" />
      </Path>
      <Path path={g.sh}>
        <LinearGradient start={vec(x - 130, -250)} end={vec(x + 120, 250)} colors={SLEEVE} />
      </Path>
      <Path path={g.sh} style="stroke" strokeWidth={2.4} color={SLEEVE_RIM} />
      <Group transform={[{ translateX: x + 4 }, { rotate: -Math.PI / 2 }]}>
        <FigureHead fill={g.head} />
      </Group>
    </Group>
  );
}

/**
 * An arm in a view: the upper arm in a T-shirt sleeve (shoulder → most of the
 * way to the elbow), then skin to the wrist, tapering. Points in view mm.
 */
export function Arm2D({ s, e, w, opacity = 1 }: { s: Pt; e: Pt; w: Pt; opacity?: number }) {
  const g = useMemo(() => {
    const k = 0.72;
    const sl: Pt = [s[0] + (e[0] - s[0]) * k, s[1] + (e[1] - s[1]) * k];
    return { upper: tube(s, e, 88, 74), fore: tube(e, w, 74, 56), sleeve: tube(s, sl, 108, 98) };
  }, [s, e, w]);
  return (
    <Group opacity={opacity}>
      <Path path={g.upper}>
        <LinearGradient start={vec(s[0] - 60, s[1] - 60)} end={vec(e[0] + 60, e[1] + 60)} colors={SKIN} />
      </Path>
      <Path path={g.upper} style="stroke" strokeWidth={2} color={SKIN_RIM} />
      <Path path={g.fore}>
        <LinearGradient start={vec(e[0] - 40, e[1] - 50)} end={vec(w[0] + 40, w[1] + 50)} colors={SKIN} />
      </Path>
      <Path path={g.fore} style="stroke" strokeWidth={2} color={SKIN_RIM} />
      <Path path={g.sleeve}>
        <LinearGradient start={vec(s[0] - 60, s[1] - 60)} end={vec(e[0] + 60, e[1] + 60)} colors={SLEEVE} />
      </Path>
      <Path path={g.sleeve} style="stroke" strokeWidth={2.2} color={SLEEVE_RIM} />
    </Group>
  );
}
