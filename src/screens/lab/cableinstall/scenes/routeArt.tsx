/**
 * STAGE 3 — the two BUILDING SECTIONS (owner 2026-09-26 art pass: the old
 * sections were outline boxes with default-serif room names, a 3.8 m rack and
 * no sense of scale).
 *
 * Both are drawn as real architectural sections at ONE scale, 20 units = 1 m
 * (D39), with a 2 m scale bar and a 1.75 m person for reference:
 *   · concrete cut with hatch, earth under the ground slab;
 *   · stud partitions cut through (gypsum faces + insulated cavity) with the
 *     door openings at 2.1 m;
 *   · suspended ceilings on a 0.6 m T-bar grid, hung on wires;
 *   · X-RAY reveals what the finished surfaces hide, in the order a building
 *     opens: the concealed spaces, then the pathway (ladder tray on trapeze
 *     rods / catwalk J-hooks), then other trades' systems (air handler +
 *     motor, supply duct), then names.
 * Scene 1 — stage input box → control-room rack. Scene 2 — amp room → flown
 * line-array cluster under a roof with a catwalk.
 */
import { useEffect, type ReactNode } from 'react';
import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AG, CI_EASE, CI_MOTION, cancelAnimation, useAnimatedProps, useCiMotion, useSharedValue, withDelay, withTiming } from '../motion';
import {
  Callout,
  CeilingCut,
  ConcreteCut,
  DuctSide,
  EarthBand,
  INK,
  LadderTraySide,
  METAL,
  PersonScale,
  RackSide,
  ScaleBar,
  StudWallCut,
  WallBoxSide,
  useUid,
} from '../svgArt';

/** drawing units per metre */
export const ROUTE_M = 20;
const M = ROUTE_M;
const FLOOR = 196;

/* ── the X-RAY reveal layer (opacity only — motion.tsx rule) ─────────────── */
function useFade(on: boolean, delay: number) {
  const m = useCiMotion();
  const t = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = on ? 1 : 0;
      return;
    }
    t.value = on
      ? withDelay(delay, withTiming(1, { duration: CI_MOTION.base, easing: CI_EASE.out }))
      : withTiming(0, { duration: CI_MOTION.quick, easing: CI_EASE.inOut });
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, delay, m.reduce]);
  return useAnimatedProps(() => ({ opacity: t.value }));
}

function X({ on, delay, children }: { on: boolean; delay: number; children: ReactNode }) {
  const p = useFade(on, delay);
  return (
    <AG opacity={0} animatedProps={p}>
      {children}
    </AG>
  );
}

/** Label with no pill (room names). */
function Room({ x, y, text, size = 10.5, color = '#9ea3ad' }: { x: number; y: number; text: string; size?: number; color?: string }) {
  return <Callout x={x} y={y} text={text} size={size} color={color} bg={null} />;
}

/** Circular route badge sitting ON its route line. */
export function RouteBadge({ x, y, letter, color }: { x: number; y: number; letter: string; color: string }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={6.6} fill="#0c0d10" stroke={color} strokeWidth={1.2} />
      <Callout x={x} y={y + 3.4} text={letter} size={10} color={color} bg={null} />
    </G>
  );
}

/** The frame both sections sit in. */
function Frame({ children }: { children: ReactNode }) {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#101116" />
          <Stop offset="1" stopColor="#0c0c10" />
        </LinearGradient>
      </Defs>
      <Rect x={2} y={2} width={356} height={216} rx={6} fill={`url(#${id}a)`} />
      {children}
    </G>
  );
}

/* ── mechanical-bay air handler: casing, fan scroll, belt-driven motor ──── */
function AirHandler({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8e949c" />
          <Stop offset="1" stopColor="#4d5158" />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={0.8} fill={`url(#${id}c)`} stroke="#23262b" strokeWidth={0.6} />
      {[0.25, 0.5, 0.75].map((f) => (
        <Line key={f} x1={x + w * f} y1={y + 1} x2={x + w * f} y2={y + h - 1} stroke="#3c4046" strokeWidth={0.6} />
      ))}
      {/* fan scroll */}
      <Circle cx={x + w * 0.62} cy={y + h * 0.55} r={h * 0.32} fill="#3a3e45" stroke="#23262b" strokeWidth={0.6} />
      <Circle cx={x + w * 0.62} cy={y + h * 0.55} r={h * 0.12} fill="#23262b" />
      {/* motor on its base, belt to the fan */}
      <Rect x={x + w - 7} y={y - 8} width={11} height={7} rx={2.4} fill="#4d6b8a" stroke="#1d2a38" strokeWidth={0.6} />
      <Line x1={x + w - 2} y1={y - 4.5} x2={x + w * 0.62} y2={y + h * 0.55 - h * 0.3} stroke="#1a1b1f" strokeWidth={0.8} />
      <Rect x={x + w - 8} y={y - 1.4} width={13} height={1.4} fill="#2c2f34" />
    </G>
  );
}

/* ══ SCENE 1 — stage input box → control-room rack ═════════════════════════ */

export function StageRackSection({ xray, tint }: { xray: boolean; tint: string }) {
  return (
    <Frame>
      {/* concealed spaces tint up first in X-RAY */}
      <X on={xray} delay={0}>
        <Rect x={115} y={56} width={235} height={68} fill="rgba(91,176,255,0.06)" />
        <Rect x={115} y={130} width={235} height={15} fill="rgba(91,176,255,0.06)" />
      </X>

      {/* structure: stage-house roof, block roof, mech-bay floor, ground */}
      <ConcreteCut x={6} y={14} w={109} h={6} />
      <ConcreteCut x={115} y={50} w={239} h={6} />
      <ConcreteCut x={115} y={124} w={235} h={6} />
      <ConcreteCut x={6} y={20} w={4} h={176} />
      <ConcreteCut x={350} y={56} w={4} h={140} />
      <ConcreteCut x={6} y={FLOOR} w={348} h={6} />
      <EarthBand x={6} y={202} w={348} h={12} />

      {/* partitions with their 2.1 m door openings */}
      <StudWallCut x={112} y0={20} y1={FLOOR} t={3} gaps={[[154, FLOOR]]} />
      <StudWallCut x={258} y0={130} y1={FLOOR} t={3} gaps={[[154, FLOOR]]} />
      {/* door leaves standing open */}
      <Line x1={115} y1={154} x2={127} y2={176} stroke="#8c8f96" strokeWidth={1.2} />
      <Line x1={258} y1={154} x2={246} y2={176} stroke="#8c8f96" strokeWidth={1.2} />

      {/* suspended ceilings (corridor + control room) */}
      <CeilingCut x0={115} x1={258} y={146} m={M} hangTo={130} />
      <CeilingCut x0={261} x1={350} y={146} m={M} hangTo={130} opening={[318, 326]} />

      {/* stage riser 0.6 m with its skirt */}
      <Rect x={10} y={184} width={80} height={12} fill="#2b241c" stroke="#15110c" strokeWidth={0.6} />
      <Rect x={10} y={184} width={80} height={1.4} fill="#6b5a44" />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `M${14 + i * 10} 186 v9`).join('')} stroke="#1c1712" strokeWidth={0.5} />

      {/* the stage input box on the stage face of the wall */}
      <WallBoxSide x={112} y={166} m={M} tone={tint} dir={-1} depth={2.4} />

      {/* the rack, standing in the control room */}
      <RackSide x={312} floorY={FLOOR} m={M} tint={tint} />

      {/* people for scale */}
      <PersonScale x={228} floorY={FLOOR} m={M} facing={-1} />
      <PersonScale x={48} floorY={184} m={M} facing={1} color="#454a53" />

      {/* X-RAY: pathway → what holds it up → the wall sleeve → foreign systems */}
      <X on={xray} delay={80}>
        <LadderTraySide x0={118} x1={256} y={142} m={M} rodTo={130} />
        <LadderTraySide x0={263} x1={346} y={142} m={M} rodTo={130} />
        <Rect x={257} y={134} width={5} height={9} fill="#6d7179" stroke="#2a2d32" strokeWidth={0.4} />
      </X>
      <X on={xray} delay={200}>
        <AirHandler x={146} y={100} w={72} h={24} />
        {/* supply duct: up from the unit, then off toward the stage house */}
        <Rect x={152} y={66} width={14} height={34} fill="#7d828a" stroke="#2c2f34" strokeWidth={0.5} />
        <DuctSide x0={115} x1={166} y={60} h={12} m={M} hangTo={56} />
      </X>
      <X on={xray} delay={320}>
        <Callout x={176} y={115} text="AIR HANDLER" size={9.5} color="#101114" bg={null} />
        <Callout x={228} y={140.5} text="TRAY" size={9.5} color={INK.info} bg={null} />
      </X>

      {/* room names */}
      <Room x={56} y={36} text="STAGE" />
      <Room x={300} y={72} text="MECH BAY" />
      <Room x={176} y={162} text="CORRIDOR" />
      <Room x={287} y={164} text="CONTROL" />
      <ScaleBar x={14} y={209} m={M} metres={2} color="#8d9199" />
    </Frame>
  );
}

/** Floor protector drawn OVER route C so the crossing reads as protected. */
export function StageRackOverlay() {
  return (
    <G>
      <Path d="M176 196 L180 190.5 H196 L200 196 Z" fill="#c9a52c" stroke="#3b3212" strokeWidth={0.6} />
      <Path d="M181 191.4 H195" stroke="#1b1c20" strokeWidth={1.4} />
    </G>
  );
}

/* ══ SCENE 2 — amp room → flown cluster ════════════════════════════════════ */

function SteelBeamSide({ x0, x1, y, h }: { x0: number; x1: number; y: number; h: number }) {
  return (
    <G>
      <Rect x={x0} y={y} width={x1 - x0} height={h} fill="#51555c" />
      <Rect x={x0} y={y} width={x1 - x0} height={1.2} fill="#8d9199" />
      <Rect x={x0} y={y + h - 1.2} width={x1 - x0} height={1.2} fill="#3a3d43" />
    </G>
  );
}

function Catwalk({ x0, x1, deck, m }: { x0: number; x1: number; deck: number; m: number }) {
  const rail = deck - 1.07 * m;
  const posts: number[] = [];
  for (let xx = x0 + 2; xx <= x1; xx += 1.5 * m) posts.push(xx);
  const grate: string[] = [];
  for (let xx = x0; xx < x1; xx += 1.6) grate.push(`M${xx} ${deck} v1.4`);
  return (
    <G>
      {/* hangers to the roof steel */}
      {posts.filter((_, i) => i % 2 === 0).map((xx) => (
        <Line key={`h${xx}`} x1={xx} y1={14} x2={xx} y2={rail} stroke="#8f949b" strokeWidth={0.5} />
      ))}
      <Line x1={x0} y1={rail} x2={x1} y2={rail} stroke="#b7bcc3" strokeWidth={0.9} />
      <Line x1={x0} y1={(rail + deck) / 2} x2={x1} y2={(rail + deck) / 2} stroke="#8f949b" strokeWidth={0.6} />
      {posts.map((xx) => (
        <Line key={xx} x1={xx} y1={rail} x2={xx} y2={deck} stroke="#a3a8af" strokeWidth={0.8} />
      ))}
      <Rect x={x0} y={deck - 2} width={x1 - x0} height={2} fill="#6d7179" />
      <Rect x={x0} y={deck} width={x1 - x0} height={1.4} fill="#3a3d43" />
      <Path d={grate.join('')} stroke="#1c1d21" strokeWidth={0.5} />
    </G>
  );
}

/** J-hooks hung under the catwalk every 1.2 m (side view: rod + J). */
function JHookRow({ x0, x1, deck, y }: { x0: number; x1: number; deck: number; y: number }) {
  const hooks: number[] = [];
  for (let xx = x0; xx <= x1; xx += 1.2 * M) hooks.push(xx);
  return (
    <G>
      {hooks.map((xx) => (
        <G key={xx}>
          <Line x1={xx} y1={deck + 1.4} x2={xx} y2={y - 2.2} stroke={METAL.hi} strokeWidth={0.6} />
          <Path d={`M${xx} ${y - 2.4} v2 a2.1 2.1 0 0 0 4.2 0 v-1.2`} stroke={METAL.hi} strokeWidth={0.8} fill="none" strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

/** A flown line array seen side-on: fly frame + four splayed boxes. */
function LineArraySide({ x, y, m }: { x: number; y: number; m: number }) {
  const boxH = 0.35 * m;
  const boxD = 0.6 * m;
  const splays = [0, 2, 5, 9];
  let cy = y + 2.4;
  let ang = 0;
  const boxes: { t: string }[] = [];
  for (let i = 0; i < 4; i++) {
    ang += splays[i];
    boxes.push({ t: `translate(${x} ${cy}) rotate(${ang})` });
    cy += boxH * 0.98;
  }
  return (
    <G>
      <Rect x={x - boxD / 2 - 1} y={y} width={boxD + 2} height={2.4} fill="#6d7179" stroke="#2a2d32" strokeWidth={0.4} />
      {boxes.map((b, i) => (
        <G key={i} transform={b.t}>
          <Path d={`M${-boxD / 2} 0 H${boxD / 2} L${boxD / 2 - 1.2} ${boxH} H${-boxD / 2 + 0.6} Z`} fill="#1d1f24" stroke="#07080a" strokeWidth={0.5} />
          <Rect x={-boxD / 2 - 0.9} y={0.4} width={1.2} height={boxH - 0.8} fill="#3c4047" />
          <Line x1={-boxD / 2 + 1} y1={0.8} x2={boxD / 2 - 1.5} y2={0.8} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
        </G>
      ))}
    </G>
  );
}

export function ClusterSection({ xray, tint }: { xray: boolean; tint: string }) {
  return (
    <Frame>
      <X on={xray} delay={0}>
        <Rect x={10} y={14} width={340} height={69} fill="rgba(91,176,255,0.06)" />
      </X>
      {/* structure */}
      <SteelBeamSide x0={6} x1={354} y={8} h={6} />
      <ConcreteCut x={6} y={14} w={4} h={182} />
      <ConcreteCut x={350} y={14} w={4} h={182} />
      <ConcreteCut x={6} y={FLOOR} w={348} h={6} />
      <EarthBand x={6} y={202} w={348} h={12} />

      {/* the amp-room partition (to the ceiling line) and its door */}
      <StudWallCut x={96} y0={84} y1={FLOOR} t={3} gaps={[[154, FLOOR]]} />
      <Line x1={99} y1={154} x2={111} y2={176} stroke="#8c8f96" strokeWidth={1.2} />

      {/* tile ceilings; the hall's has the cluster opening */}
      <CeilingCut x0={10} x1={96} y={84} m={M} hangTo={14} />
      <CeilingCut x0={99} x1={350} y={84} m={M} hangTo={14} opening={[236, 272]} />

      {/* amp rack + a riser sleeve on the amp-room wall */}
      <RackSide x={28} floorY={FLOOR} m={M} tint={tint} />
      <Rect x={84} y={84} width={4} height={62} fill="#6d7179" stroke="#2a2d32" strokeWidth={0.4} />

      {/* rigging: hoist on the roof steel, chain down through the opening */}
      <Rect x={250} y={17} width={8} height={10} rx={1.6} fill="#3c4047" stroke="#1b1c20" strokeWidth={0.5} />
      <Line x1={254} y1={14} x2={254} y2={17} stroke={METAL.hi} strokeWidth={0.8} />
      <Line x1={254} y1={27} x2={254} y2={92} stroke={METAL.hi} strokeWidth={0.7} strokeDasharray="1.4 0.8" />
      <LineArraySide x={254} y={92} m={M} />

      <PersonScale x={170} floorY={FLOOR} m={M} facing={1} />

      {/* X-RAY: catwalk + its J-hooks → the duct → names */}
      <X on={xray} delay={80}>
        <Catwalk x0={108} x1={346} deck={40} m={M} />
        <JHookRow x0={118} x1={240} deck={40} y={46} />
      </X>
      <X on={xray} delay={200}>
        <DuctSide x0={100} x1={236} y={56} h={12} m={M} hangTo={14} />
      </X>
      <X on={xray} delay={320}>
        <Callout x={300} y={34} text="CATWALK" size={9.5} color={INK.info} bg={null} />
        <Callout x={140} y={65.5} text="SUPPLY DUCT" size={9.5} color="#101114" bg={null} />
      </X>

      <Room x={52} y={100} text="AMP ROOM" />
      <Room x={130} y={112} text="HALL" />
      <Room x={300} y={112} text="CLUSTER" />
      <ScaleBar x={14} y={209} m={M} metres={2} color="#8d9199" />
    </Frame>
  );
}
