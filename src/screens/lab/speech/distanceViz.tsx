/**
 * Speech & Voice Lab — page 8: the talker and the microphone at the chosen
 * distance, TO SCALE (redraw 2026-10-14; the page used to be bars only).
 *
 * 18 viewBox units per inch: 1", 6" and 12" sit where they really are relative
 * to the mouth, so "halving the distance" can be seen. Cyan fronts leave the
 * mouth and FADE as they spread (the direct sound falls 6 dB per doubling);
 * the grey dashed paths are the room's reflections, which reach the mic at
 * the same strength wherever it is. The mic glides to a new distance.
 * The fronts loop as decoration (useLoopClock — off under reduced motion /
 * Low-Light; the still frame shows the same scene).
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { HeadIconSvg } from '../../../features/lab/headIconsSvg';
import { useAnimationsAllowed } from '../../../features/settings/a11y';
import { ExpandableFigure } from '../kit/ExpandableFigure';
import { useLoopClock } from './speechMotion';

const F = fonts.barlowMedium;
const AG = Animated.createAnimatedComponent(G);
const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);

const W = 340, H = 104;
const MX = 42, MY = 50; // the mouth
const PER_INCH = 18;
const micX = (inches: number) => MX + inches * PER_INCH;

function front(t: number, k: number): { d: string; o: number } {
  'worklet';
  const p = (t / 1.6 + k / 4) % 1;
  const r = 6 + p * 240;
  const a = (34 * Math.PI) / 180;
  const x1 = MX + r * Math.cos(-a), y1 = MY + r * Math.sin(-a), x2 = MX + r * Math.cos(a), y2 = MY + r * Math.sin(a);
  // brightness ∝ 1/r (pressure, inverse-distance), floored so far fronts stay faint, not gone
  return { d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, o: Math.min(0.95, 14 / r) };
}

export function DistanceScene({ inches, a11y }: { inches: number; a11y: string }) {
  return (
    <ExpandableFigure aspect={W / H} title="DISTANCE" render={(w, h) => (
      <View accessible accessibilityLabel={a11y} style={{ width: w, height: h }}>
        <SceneSvg inches={inches} w={w} h={h} />
      </View>
    )} />
  );
}

function SceneSvg({ inches, w, h }: { inches: number; w: number; h: number }) {
  const { t } = useLoopClock(1.6, 0.55);
  const motionOk = useAnimationsAllowed();
  const mx = useSharedValue(micX(inches));
  useEffect(() => {
    mx.value = motionOk ? withTiming(micX(inches), { duration: 600, easing: Easing.inOut(Easing.cubic) }) : micX(inches);
  }, [inches, motionOk, mx]);
  const mk = (k: number) => () => {
    'worklet';
    const f = front(t.value, k);
    return { d: f.d, opacity: f.o };
  };
  const f0 = useAnimatedProps(mk(0)), f1 = useAnimatedProps(mk(1)), f2 = useAnimatedProps(mk(2)), f3 = useAnimatedProps(mk(3));
  // the mic moves as one group: every part's x rides one shared value
  const grille = useAnimatedProps(() => {
    const x = mx.value;
    return { d: `M ${(x + 1).toFixed(1)} ${MY} C ${(x + 1).toFixed(1)} ${MY - 7} ${(x + 6).toFixed(1)} ${MY - 9} ${(x + 10).toFixed(1)} ${MY - 9} C ${(x + 15).toFixed(1)} ${MY - 9} ${(x + 19).toFixed(1)} ${MY - 7} ${(x + 19).toFixed(1)} ${MY} C ${(x + 19).toFixed(1)} ${MY + 7} ${(x + 15).toFixed(1)} ${MY + 9} ${(x + 10).toFixed(1)} ${MY + 9} C ${(x + 6).toFixed(1)} ${MY + 9} ${(x + 1).toFixed(1)} ${MY + 7} ${(x + 1).toFixed(1)} ${MY} Z` };
  });
  const body = useAnimatedProps(() => {
    const x = mx.value;
    return { d: `M ${(x + 18).toFixed(1)} ${MY - 5.5} L ${(x + 62).toFixed(1)} ${MY - 3.5} Q ${(x + 66).toFixed(1)} ${MY} ${(x + 62).toFixed(1)} ${MY + 3.5} L ${(x + 18).toFixed(1)} ${MY + 5.5} Z` };
  });
  const capsule = useAnimatedProps(() => ({ x1: mx.value + 3, x2: mx.value + 3 }));
  const refl = useAnimatedProps(() => {
    const x = mx.value + 4;
    // reflections off the ceiling, floor and back wall, arriving from all around
    return { d: `M 120 6 L ${x.toFixed(1)} ${MY - 4} M 230 6 L ${x.toFixed(1)} ${MY - 4} M 150 94 L ${x.toFixed(1)} ${MY + 4} M 300 94 L ${(x + 2).toFixed(1)} ${MY + 4} M 334 30 L ${(x + 20).toFixed(1)} ${MY - 2}` };
  });
  const marker = useAnimatedProps(() => ({ x1: mx.value, x2: mx.value }));
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      {/* the room: ceiling and floor edges (reflections come from everywhere) */}
      <Line x1={70} y1={6} x2={334} y2={6} stroke="rgba(255,255,255,0.12)" />
      <Line x1={70} y1={94} x2={334} y2={94} stroke="rgba(255,255,255,0.12)" />
      <APath animatedProps={refl} d="M0 0" fill="none" stroke={colors.textSecondary} strokeWidth={0.9} strokeDasharray="3,3" opacity={0.45} />
      {/* direct sound */}
      <AG>
        {[f0, f1, f2, f3].map((ap, i) => <APath key={i} animatedProps={ap} d="M0 0" fill="none" stroke={colors.cyanBright} strokeWidth={1.2} opacity={0} />)}
      </AG>
      {/* the talker — the owner's SIDE head icon facing the mic */}
      <HeadIconSvg view="side" facing="right" speaking x={MX - 2} y={MY} size={84} plate />
      {/* microphone: a cardioid handheld seen from the side, grille toward the mouth */}
      <APath animatedProps={body} d="M0 0" fill="#1c1c22" stroke={colors.textMuted} strokeWidth={1} />
      <APath animatedProps={grille} d="M0 0" fill="#2a2a32" stroke={colors.textSecondary} strokeWidth={1} />
      <ALine animatedProps={capsule} x1={micX(inches) + 3} y1={MY - 5} x2={micX(inches) + 3} y2={MY + 5} stroke={colors.cyanBright} strokeWidth={1.4} />
      {/* the ruler: inches from the lips, to scale */}
      <Line x1={MX} y1={H - 14} x2={micX(12)} y2={H - 14} stroke={colors.textMuted} strokeWidth={0.8} />
      {Array.from({ length: 13 }, (_, i) => (
        <Line key={i} x1={micX(i)} y1={H - 14} x2={micX(i)} y2={H - (i % 6 === 0 ? 19 : 16.5)} stroke={colors.textMuted} strokeWidth={0.8} />
      ))}
      {[0, 1, 6, 12].map((i) => (
        <SvgText key={i} x={micX(i)} y={H - 4} fontSize={9} fill={i === inches ? colors.cyanBright : colors.textMuted} textAnchor="middle" fontFamily={F}>{i === 0 ? 'lips' : `${i}"`}</SvgText>
      ))}
      <ALine animatedProps={marker} x1={micX(inches)} y1={H - 22} x2={micX(inches)} y2={H - 12} stroke={colors.cyanBright} strokeWidth={1.6} />
      <SvgText x={W - 8} y={18} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>to scale · gray = the room's reflections</SvgText>
    </Svg>
  );
}
