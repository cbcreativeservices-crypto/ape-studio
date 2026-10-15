/**
 * Speech & Voice Lab — page 4 drawings (redraw 2026-10-14).
 *
 *  • VowelChart — the vowel quadrilateral (IPA layout: front-high top-left,
 *    back-high top-right, the front-low corner pulled in) beside a SIDE view
 *    of the mouth (palate, teeth, lips, the jaw on its hinge, the tongue) and
 *    a FRONT view of the lips. Picking a vowel glides the tongue, jaw and lips
 *    to its posture on the UI thread (the old drawing was two grey bars for a
 *    "jaw" and an ellipse for "lips").
 *  • FormantChart — the vowel's harmonics in dB after the mouth has shaped
 *    them (speechSignals.vowelHarmonicsDb: the same source–filter model as the
 *    lab's waveforms), with the mouth's resonance curve. Linear 0–4 kHz. The
 *    stems glide between vowels; each is painted by the level ramp pinned to
 *    the dB axis.
 */
import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { LOUDNESS_STOPS, levelColor } from '../../../features/tools/levelColor';
import { useAnimationsAllowed } from '../../../features/settings/a11y';
import { VOWELS, type Vowel } from '../../../features/speech/speechModel';
import { VOWEL_FORMANTS, vowelHarmonicsDb } from '../../../features/speech/speechSignals';
import { ExpandableFigure } from '../kit/ExpandableFigure';

const F = fonts.barlowMedium;
const APath = Animated.createAnimatedComponent(Path);
const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

const LIP = '#b3706b';
const LIP_EDGE = '#8f5853';
const ENAMEL = '#efe9dc';
const BONE = '#c9c0ae';
const MUSCLE = '#a1524f';
const MUSCLE_EDGE = '#c46a66';
const SKIN = '#17181d';
const SKIN_EDGE = '#3d3f48';
const AIR = '#1b2430';

/* ── vowel posture → mouth geometry (worklets) ─────────────────────────── */

const HX = 314, HY = 30; // jaw hinge (the condyle, in front of the ear)

function rot(x: number, y: number, a: number): [number, number] {
  'worklet';
  const c = Math.cos(a), s = Math.sin(a);
  return [HX + (x - HX) * c - (y - HY) * s, HY + (x - HX) * s + (y - HY) * c];
}
const r1 = (n: number) => {
  'worklet';
  return n.toFixed(1);
};
const pt = (p: [number, number]) => {
  'worklet';
  return r1(p[0]) + ' ' + r1(p[1]);
};

/** Jaw opening angle (rad, opening = negative screen rotation). */
function jawAngle(jaw: number): number {
  'worklet';
  return -jaw * 0.3;
}

/** The lower face that swings with the jaw: lower lip, chin, the mandible's lower border. */
function lowerFaceD(jaw: number, round: number): string {
  'worklet';
  const a = jawAngle(jaw);
  const pr = round * 4;
  return 'M ' + pt(rot(238, 49, a)) + ' L ' + pt(rot(229 - pr, 49, a)) + ' C ' + pt(rot(225 - pr, 51, a)) + ' ' + pt(rot(225 - pr, 56, a)) + ' ' + pt(rot(228, 60, a))
    + ' C ' + pt(rot(231, 64, a)) + ' ' + pt(rot(229, 72, a)) + ' ' + pt(rot(233, 80, a)) + ' C ' + pt(rot(238, 86, a)) + ' ' + pt(rot(262, 87, a)) + ' ' + pt(rot(290, 84, a))
    + ' C ' + pt(rot(300, 82, a)) + ' ' + pt(rot(308, 76, a)) + ' ' + pt(rot(310, 62, a)) + ' L 316 34 L 300 40 L ' + pt(rot(262, 48, a)) + ' Z';
}
function lowerLipD(jaw: number, round: number): string {
  'worklet';
  const a = jawAngle(jaw);
  const pr = round * 4;
  return 'M ' + pt(rot(237, 49, a)) + ' L ' + pt(rot(229 - pr, 49, a)) + ' C ' + pt(rot(225 - pr, 51, a)) + ' ' + pt(rot(225 - pr, 56, a)) + ' ' + pt(rot(228, 60, a))
    + ' C ' + pt(rot(231, 63, a)) + ' ' + pt(rot(234, 64, a)) + ' ' + pt(rot(237, 64, a)) + ' Z';
}
function lowerIncisorD(jaw: number): string {
  'worklet';
  const a = jawAngle(jaw);
  return 'M ' + pt(rot(236, 48, a)) + ' L ' + pt(rot(238, 48, a)) + ' C ' + pt(rot(241, 52, a)) + ' ' + pt(rot(241, 57, a)) + ' ' + pt(rot(240, 62, a)) + ' L ' + pt(rot(237, 62, a)) + ' C ' + pt(rot(236, 57, a)) + ' ' + pt(rot(235, 52, a)) + ' ' + pt(rot(236, 48, a)) + ' Z';
}
function upperLipD(round: number): string {
  'worklet';
  const pr = round * 4;
  return 'M 233 28 C ' + r1(229 - pr * 0.5) + ' 30 ' + r1(226 - pr) + ' 35 ' + r1(226 - pr) + ' 40 C ' + r1(226 - pr) + ' 44 ' + r1(227 - pr) + ' 47 ' + r1(229 - pr) + ' 48 L 235 48 C 235 42 236 35 236 30 Z';
}
/** Tongue for a posture: dorsum peak follows (back, height); tip and floor ride the jaw. */
function tongueD(back: number, height: number, jaw: number): string {
  'worklet';
  const a = jawAngle(jaw);
  const tip = rot(241, 52, a);
  const px = 250 + back * 44;
  const py = 33 + (1 - height) * 22;
  const rx = 304 + back * 7, ry = 62 + (1 - height) * 4;
  const rootX = 302 + back * 10;
  const f1 = rot(286, 82, a), f2 = rot(262, 76, a), f3 = rot(247, 64, a), f4 = rot(243, 60, a), f5 = rot(241, 56, a);
  return 'M ' + pt(tip) + ' C ' + r1(tip[0] + 3) + ' ' + r1(tip[1] - 6) + ' ' + r1(px - 22) + ' ' + r1(py + 3) + ' ' + r1(px) + ' ' + r1(py)
    + ' C ' + r1(px + 16) + ' ' + r1(py - 1) + ' ' + r1(rx - 4) + ' ' + r1((py + ry) / 2 - 5) + ' ' + r1(rx) + ' ' + r1(ry)
    + ' C ' + r1(rx + 2) + ' ' + r1(ry + 10) + ' ' + r1(rootX) + ' 86 ' + r1(rootX - 2) + ' 94'
    + ' L ' + pt(f1) + ' C ' + pt(f2) + ' ' + pt(f3) + ' ' + pt(f4) + ' C ' + pt(f5) + ' ' + pt(f5) + ' ' + pt(tip) + ' Z';
}
/** Front view of the lips: outer contour (with the cupid's bow) + the opening, one even-odd path. */
function lipsFrontD(back: number, round: number, jaw: number, cx: number, cy: number): string {
  'worklet';
  const ow = round > 0.5 ? 6 + jaw * 8 : 16 + (1 - back) * 12;
  const ohRaw = 3.5 + jaw * 12;
  const oh = round > 0.5 ? Math.max(ohRaw, ow * 0.85) : ohRaw;
  const L = cx - ow / 2 - 5, R = cx + ow / 2 + 5, T = cy - oh / 2 - 4.5, B = cy + oh / 2 + 5;
  const outer = 'M ' + r1(L) + ' ' + r1(cy) + ' C ' + r1(L + 2) + ' ' + r1(T + 2) + ' ' + r1(cx - 7) + ' ' + r1(T - 1.5) + ' ' + r1(cx - 2.6) + ' ' + r1(T)
    + ' Q ' + r1(cx) + ' ' + r1(T + 1.6) + ' ' + r1(cx + 2.6) + ' ' + r1(T) + ' C ' + r1(cx + 7) + ' ' + r1(T - 1.5) + ' ' + r1(R - 2) + ' ' + r1(T + 2) + ' ' + r1(R) + ' ' + r1(cy)
    + ' C ' + r1(R - 3) + ' ' + r1(B + 1) + ' ' + r1(L + 3) + ' ' + r1(B + 1) + ' ' + r1(L) + ' ' + r1(cy) + ' Z';
  const ol = cx - ow / 2, orr = cx + ow / 2;
  const inner = ' M ' + r1(ol) + ' ' + r1(cy) + ' C ' + r1(ol + 1.5) + ' ' + r1(cy - oh / 2) + ' ' + r1(orr - 1.5) + ' ' + r1(cy - oh / 2) + ' ' + r1(orr) + ' ' + r1(cy)
    + ' C ' + r1(orr - 1.5) + ' ' + r1(cy + oh / 2) + ' ' + r1(ol + 1.5) + ' ' + r1(cy + oh / 2) + ' ' + r1(ol) + ' ' + r1(cy) + ' Z';
  return outer + inner;
}
function lipsOpeningD(back: number, round: number, jaw: number, cx: number, cy: number): string {
  'worklet';
  const ow = round > 0.5 ? 6 + jaw * 8 : 16 + (1 - back) * 12;
  const ohRaw = 3.5 + jaw * 12;
  const oh = round > 0.5 ? Math.max(ohRaw, ow * 0.85) : ohRaw;
  const ol = cx - ow / 2, orr = cx + ow / 2;
  return 'M ' + r1(ol) + ' ' + r1(cy) + ' C ' + r1(ol + 1.5) + ' ' + r1(cy - oh / 2) + ' ' + r1(orr - 1.5) + ' ' + r1(cy - oh / 2) + ' ' + r1(orr) + ' ' + r1(cy)
    + ' C ' + r1(orr - 1.5) + ' ' + r1(cy + oh / 2) + ' ' + r1(ol + 1.5) + ' ' + r1(cy + oh / 2) + ' ' + r1(ol) + ' ' + r1(cy) + ' Z';
}
function upperTeethFrontD(back: number, round: number, jaw: number, cx: number, cy: number): string {
  'worklet';
  const ow = round > 0.5 ? 6 + jaw * 8 : 16 + (1 - back) * 12;
  const ohRaw = 3.5 + jaw * 12;
  const oh = round > 0.5 ? Math.max(ohRaw, ow * 0.85) : ohRaw;
  const t = cy - oh / 2 + 0.6, b = t + Math.min(2.8, oh * 0.3);
  return 'M ' + r1(cx - ow * 0.36) + ' ' + r1(t + 0.6) + ' L ' + r1(cx + ow * 0.36) + ' ' + r1(t + 0.6) + ' L ' + r1(cx + ow * 0.32) + ' ' + r1(b) + ' L ' + r1(cx - ow * 0.32) + ' ' + r1(b) + ' Z';
}

const PALATE = 'M 238 36 C 246 31 262 29 284 29 L 292 31 L 292 34 L 284 33 C 262 33 248 35 240 39 Z';
const VELUM = 'M 292 31 C 300 34 305 40 308 48 C 309 52 307 54 305 53 C 302 46 298 40 292 35 Z';
const UPPER_INCISOR = 'M 236 32 C 238 37 238 43 236 49 L 234 49 C 233 43 233 37 234 32 Z';
const UPPER_FACE = 'M 228 4 L 330 4 L 330 30 L 320 26 L 300 30 L 292 31 L 284 29 L 262 29 L 246 31 L 238 35 L 236 30 L 233 28 C 229 27 223 25 221 21 C 219 17 221 12 226 8 Z';
/** The face's outline (nose, upper lip) — drawn as a lit edge so the profile reads. */
const FACE_EDGE = 'M 226 8 C 221 12 219 17 221 21 C 223 25 229 27 233 28';
const PHARYNX_WALL = 'M 320 26 C 322 50 322 80 321 110';
const MOUTH_AIR = 'M 236 49 L 300 40 L 320 30 L 321 110 L 300 100 L 240 66 Z';

/* ── the chart ─────────────────────────────────────────────────────────── */

export function VowelChart({ v, controls }: { v: Vowel; controls?: ReactNode }) {
  const W = 340, H = 160;
  const x0 = 40, wq = 150, shift = 50;
  const px = (back: number, height: number) => x0 + back * wq + (1 - height) * (1 - back) * shift;
  const py = (height: number) => 26 + (1 - height) * 92;
  const jawOpen = 1 - v.height;
  const motionOk = useAnimationsAllowed();
  const b = useSharedValue(v.back), hgt = useSharedValue(v.height), rd = useSharedValue(v.rounded ? 1 : 0), jw = useSharedValue(jawOpen);
  const rest = useRef({ back: v.back, height: v.height, round: v.rounded ? 1 : 0, jaw: jawOpen }).current;
  useEffect(() => {
    const go = (sv: { value: number }, to: number) => { sv.value = motionOk ? withTiming(to, { duration: 480, easing: Easing.inOut(Easing.cubic) }) : to; };
    go(b, v.back); go(hgt, v.height); go(rd, v.rounded ? 1 : 0); go(jw, 1 - v.height);
  }, [v, motionOk, b, hgt, rd, jw]);
  const LCX = 280, LCY = 124;
  const fid = `vface${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const tongue = useAnimatedProps(() => ({ d: tongueD(b.value, hgt.value, jw.value) }));
  const face = useAnimatedProps(() => ({ d: lowerFaceD(jw.value, rd.value) }));
  const lipL = useAnimatedProps(() => ({ d: lowerLipD(jw.value, rd.value) }));
  const chin = useAnimatedProps(() => ({ d: chinEdgeD(jw.value) }));
  const lipU = useAnimatedProps(() => ({ d: upperLipD(rd.value) }));
  const incL = useAnimatedProps(() => ({ d: lowerIncisorD(jw.value) }));
  const front = useAnimatedProps(() => ({ d: lipsFrontD(b.value, rd.value, jw.value, LCX, LCY) }));
  const opening = useAnimatedProps(() => ({ d: lipsOpeningD(b.value, rd.value, jw.value, LCX, LCY) }));
  const teeth = useAnimatedProps(() => ({ d: upperTeethFrontD(b.value, rd.value, jw.value, LCX, LCY), opacity: Math.min(1, jw.value * 2) * (1 - rd.value * 0.7) }));
  const ring = useAnimatedProps(() => ({ cx: x0 + b.value * wq + (1 - hgt.value) * (1 - b.value) * shift, cy: 26 + (1 - hgt.value) * 92 }));
  return (
    <ExpandableFigure aspect={W / H} title="VOWEL" controls={controls} render={(w, h) => (
    <View accessible accessibilityLabel={`${v.letter}: tongue ${v.height > 0.6 ? 'high' : v.height > 0.3 ? 'mid' : 'low'} and ${v.back > 0.6 ? 'back' : v.back > 0.3 ? 'central' : 'front'}, jaw ${jawOpen > 0.6 ? 'open' : jawOpen > 0.4 ? 'half open' : 'nearly closed'}, lips ${v.rounded ? 'rounded' : v.id === 'i' ? 'spread' : 'unrounded'}. Side view of the mouth and front view of the lips.`} style={{ width: w, height: h }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* the face fades out above the nose — a crop, not a box */}
          <LinearGradient id={fid} gradientUnits="userSpaceOnUse" x1={0} y1={4} x2={0} y2={22}>
            <Stop offset={0} stopColor={SKIN} stopOpacity={0} />
            <Stop offset={1} stopColor={SKIN} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {/* the tongue space (vowel quadrilateral) */}
        <Polygon points={`${px(0, 1)},${py(1)} ${px(1, 1)},${py(1)} ${px(1, 0)},${py(0)} ${px(0, 0)},${py(0)}`} fill="rgba(127,212,255,0.04)" stroke={colors.hairline} />
        <Line x1={px(0, 0.5)} y1={py(0.5)} x2={px(1, 0.5)} y2={py(0.5)} stroke={colors.hairline} strokeDasharray="3,3" />
        <SvgText x={px(0, 1)} y={py(1) - 14} fontSize={9} fill={colors.textMuted} fontFamily={F}>FRONT</SvgText>
        <SvgText x={px(1, 1)} y={py(1) - 14} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>BACK</SvgText>
        <SvgText x={px(0, 1) - 6} y={py(1) + 4} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>HIGH</SvgText>
        <SvgText x={px(0, 0) - 6} y={py(0) + 3} fontSize={9} fill={colors.textMuted} textAnchor="end" fontFamily={F}>LOW</SvgText>
        <SvgText x={x0} y={py(0) + 22} fontSize={9} fill={colors.textMuted} fontFamily={F}>tongue position · jaw opens as it drops</SvgText>
        <ACircle animatedProps={ring} cx={px(rest.back, rest.height)} cy={py(rest.height)} r={14} fill="none" stroke={colors.cyanBright} strokeWidth={1.2} opacity={0.6} />
        {VOWELS.map((o) => {
          const on = o.id === v.id;
          return (
            <G key={o.id}>
              <Circle cx={px(o.back, o.height)} cy={py(o.height)} r={on ? 10 : 7} fill={on ? colors.cyanBright : '#1c1c22'} stroke={on ? colors.cyanBright : colors.textMuted} />
              <SvgText x={px(o.back, o.height)} y={py(o.height) + 3.5} fontSize={on ? 10 : 9} fill={on ? '#000' : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{o.letter}</SvgText>
            </G>
          );
        })}

        {/* side view of the mouth (facing left, like the head on page 1) */}
        <Path d={MOUTH_AIR} fill={AIR} />
        <APath animatedProps={face} d={lowerFaceD(rest.jaw, rest.round)} fill={SKIN} />
        <APath animatedProps={chin} d={chinEdgeD(rest.jaw)} fill="none" stroke="#5a5c66" strokeWidth={1} />
        <Path d={UPPER_FACE} fill={`url(#${fid})`} />
        <Path d={FACE_EDGE} fill="none" stroke="#5a5c66" strokeWidth={1} />
        <Path d={PHARYNX_WALL} fill="none" stroke="#c97b7b" strokeWidth={1.6} />
        <APath animatedProps={tongue} d={tongueD(rest.back, rest.height, rest.jaw)} fill={MUSCLE} stroke={MUSCLE_EDGE} strokeWidth={0.8} />
        <Path d={PALATE} fill={BONE} />
        <Path d={VELUM} fill="#c97b7b" />
        <Path d={UPPER_INCISOR} fill={ENAMEL} />
        <APath animatedProps={incL} d={lowerIncisorD(rest.jaw)} fill={ENAMEL} />
        <APath animatedProps={lipU} d={upperLipD(rest.round)} fill={LIP} stroke={LIP_EDGE} strokeWidth={0.6} />
        <APath animatedProps={lipL} d={lowerLipD(rest.jaw, rest.round)} fill={LIP} stroke={LIP_EDGE} strokeWidth={0.6} />
        <Circle cx={HX} cy={HY} r={1.8} fill={colors.textMuted} />
        <SvgText x={274} y={106} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>{`jaw ${jawOpen > 0.6 ? 'open' : jawOpen > 0.4 ? 'half open' : 'nearly closed'}`}</SvgText>

        {/* front view of the lips */}
        {/* a minimal line-art lower face around the lips (nose, philtrum,
            cheeks, chin) so the lips read as part of a face, matte, not a
            free-floating mark */}
        <Path d={`M ${LCX - 9} ${LCY - 15} C ${LCX - 6} ${LCY - 11} ${LCX - 3} ${LCY - 13} ${LCX} ${LCY - 12} C ${LCX + 3} ${LCY - 13} ${LCX + 6} ${LCY - 11} ${LCX + 9} ${LCY - 15} M ${LCX - 2.5} ${LCY - 11.5} L ${LCX - 2} ${LCY - 8} M ${LCX + 2.5} ${LCY - 11.5} L ${LCX + 2} ${LCY - 8} M ${LCX - 27} ${LCY - 16} C ${LCX - 29} ${LCY - 3} ${LCX - 27} ${LCY + 9} ${LCX - 19} ${LCY + 17} M ${LCX + 27} ${LCY - 16} C ${LCX + 29} ${LCY - 3} ${LCX + 27} ${LCY + 9} ${LCX + 19} ${LCY + 17} M ${LCX - 11} ${LCY + 21} Q ${LCX} ${LCY + 26} ${LCX + 11} ${LCY + 21}`} fill="none" stroke="#5a5c66" strokeWidth={1} strokeLinecap="round" />
        <APath animatedProps={opening} d={lipsOpeningD(rest.back, rest.round, rest.jaw, LCX, LCY)} fill="#120a0b" />
        <APath animatedProps={teeth} d={upperTeethFrontD(rest.back, rest.round, rest.jaw, LCX, LCY)} fill={ENAMEL} opacity={0} />
        <APath animatedProps={front} d={lipsFrontD(rest.back, rest.round, rest.jaw, LCX, LCY)} fill={LIP} fillRule="evenodd" stroke={LIP_EDGE} strokeWidth={0.7} />
        <SvgText x={LCX} y={157} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>{`lips ${v.rounded ? 'rounded' : v.id === 'i' ? 'spread' : v.id === 'e' ? 'slightly spread' : 'open, unrounded'}`}</SvgText>
      </Svg>
    </View>
    )} />
  );
}

/* ── formant chart (dB, linear 0–4 kHz) ────────────────────────────────── */

const FLOOR = -60;

function stemsD(db: readonly number[], hz: readonly number[], x0: number, x1: number, top: number, bottom: number, maxHz: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < db.length; i++) {
    const lv = Math.max(0, Math.min(1, (db[i] - FLOOR) / -FLOOR));
    if (lv < 0.01) continue;
    const x = x0 + (hz[i] / maxHz) * (x1 - x0);
    d += 'M' + x.toFixed(1) + ' ' + bottom.toFixed(1) + 'V' + (bottom - lv * (bottom - top)).toFixed(1);
  }
  return d === '' ? 'M0 0' : d;
}
function envD(db: readonly number[], hz: readonly number[], x0: number, x1: number, top: number, bottom: number, maxHz: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < db.length; i++) {
    const lv = Math.max(0, Math.min(1, (db[i] - FLOOR) / -FLOOR));
    d += (i === 0 ? 'M' : 'L') + (x0 + (hz[i] / maxHz) * (x1 - x0)).toFixed(1) + ' ' + (bottom - lv * (bottom - top)).toFixed(1);
  }
  return d;
}

export function FormantChart({ v, f0 = 120, height = 150, title, controls }: { v: Vowel; f0?: number; height?: number; title?: string; controls?: ReactNode }) {
  const W = 340, H = height, top = 28, bottom = H - 20, maxHz = 4000, x0 = 36, x1 = W - 8;
  const x = (f: number) => x0 + (f / maxHz) * (x1 - x0);
  const formants = VOWEL_FORMANTS[v.id as keyof typeof VOWEL_FORMANTS] ?? VOWEL_FORMANTS.schwa;
  const sp = useMemo(() => vowelHarmonicsDb(formants, f0, maxHz), [formants, f0]);
  const hz = useMemo(() => Array.from(sp.hz), [sp]);
  const envHz = useMemo(() => Array.from(sp.envHz), [sp]);
  const target = useMemo(() => Array.from(sp.db), [sp]);
  const targetEnv = useMemo(() => Array.from(sp.envDb), [sp]);
  const motionOk = useAnimationsAllowed();
  const gid = `fm${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const shown = useRef({ s: target, e: targetEnv });
  const fromS = useSharedValue(target), toS = useSharedValue(target), fromE = useSharedValue(targetEnv), toE = useSharedValue(targetEnv), t = useSharedValue(1);
  const fx = [v.f1, v.f2, v.f3];
  const fxPrev = useRef(fx);
  const f1 = useSharedValue(v.f1), f2 = useSharedValue(v.f2), f3 = useSharedValue(v.f3);
  useEffect(() => {
    const prev = shown.current;
    shown.current = { s: target, e: targetEnv };
    fromS.value = prev.s; toS.value = target; fromE.value = prev.e; toE.value = targetEnv;
    const anim = (to: number) => (motionOk ? withTiming(to, { duration: 480, easing: Easing.inOut(Easing.cubic) }) : to);
    f1.value = anim(v.f1); f2.value = anim(v.f2); f3.value = anim(v.f3);
    fxPrev.current = [v.f1, v.f2, v.f3];
    if (!motionOk) { t.value = 1; return; }
    t.value = 0;
    t.value = withTiming(1, { duration: 480, easing: Easing.inOut(Easing.cubic) });
  }, [target, targetEnv, motionOk, v, fromS, toS, fromE, toE, t, f1, f2, f3]);
  const stems = useAnimatedProps(() => {
    const a = fromS.value, b = toS.value, k = t.value;
    const lv: number[] = [];
    for (let i = 0; i < b.length; i++) lv.push(a[i] + (b[i] - a[i]) * k);
    return { d: stemsD(lv, hz, x0, x1, top, bottom, maxHz) };
  });
  const env = useAnimatedProps(() => {
    const a = fromE.value, b = toE.value, k = t.value;
    const lv: number[] = [];
    for (let i = 0; i < b.length; i++) lv.push(a[i] + (b[i] - a[i]) * k);
    return { d: envD(lv, envHz, x0, x1, top, bottom, maxHz) };
  });
  const tick = (sv: { value: number }) => () => {
    'worklet';
    const xx = x0 + (sv.value / maxHz) * (x1 - x0);
    return { x1: xx, x2: xx };
  };
  const t1 = useAnimatedProps(tick(f1)), t2 = useAnimatedProps(tick(f2)), t3 = useAnimatedProps(tick(f3));
  const ticksA = [t1, t2, t3];
  const dbTicks = [0, -20, -40, -60];
  const yDb = (d: number) => bottom - ((d - FLOOR) / -FLOOR) * (bottom - top);
  return (
    <View style={{ gap: 4 }}>
      {title ? <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{title}</Text> : null}
      <ExpandableFigure aspect={W / H} title="FORMANTS" badge="Typical adult-male values · a source–filter model, not a measurement" controls={controls} render={(w, h) => (
      <View accessible accessibilityLabel={`Harmonics of a ${f0} hertz voice shaped by the mouth for ${v.sound}: peaks near ${v.f1}, ${v.f2} and ${v.f3} hertz, in decibels relative to the strongest harmonic. Typical adult-male values.`} style={{ width: w, height: h }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={bottom}>
            {LOUDNESS_STOPS.map((s) => <Stop key={s.pos} offset={s.pos} stopColor={s.color} />)}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {dbTicks.map((d) => <Line key={`g${d}`} x1={x0} y1={yDb(d)} x2={x1} y2={yDb(d)} stroke="rgba(255,255,255,0.06)" />)}
        <APath animatedProps={stems} d={stemsD(target, hz, x0, x1, top, bottom, maxHz)} fill="none" stroke={`url(#${gid})`} strokeWidth={2.2} />
        <APath animatedProps={env} d={envD(targetEnv, envHz, x0, x1, top, bottom, maxHz)} fill="none" stroke={colors.gold} strokeWidth={1.4} strokeDasharray="4,3" opacity={0.9} />
        {ticksA.map((ap, i) => <ALine key={`fx${i}`} animatedProps={ap} x1={x(fx[i])} y1={top - 8} x2={x(fx[i])} y2={top} stroke={colors.gold} strokeWidth={1.5} />)}
        {(['F1', 'F2', 'F3'] as const).map((l, i) => (
          <SvgText key={l} x={x(fx[i])} y={top - 11} fontSize={9} fill={colors.gold} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{l}</SvgText>
        ))}
        {dbTicks.map((d) => (
          <SvgText key={`t${d}`} x={x0 - 4} y={yDb(d) + 3} fontSize={9} fill={levelColor((d - FLOOR) / -FLOOR)} textAnchor="end" fontFamily={F}>{d === 0 ? '0 dB' : d === FLOOR ? `${d} dB` : `${d}`}</SvgText>
        ))}
        {[0, 1000, 2000, 3000, 4000].map((tk) => (
          <SvgText key={tk} x={tk === 0 ? x0 : tk === 4000 ? x1 : x(tk)} y={H - 6} fontSize={9} fill={colors.textMuted} textAnchor={tk === 0 ? 'start' : tk === 4000 ? 'end' : 'middle'} fontFamily={F}>{tk === 0 ? '0 Hz' : `${tk / 1000} kHz`}</SvgText>
        ))}
      </Svg>
      </View>
      )} />
      <Text style={{ color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 15 }}>Bars: the voice's harmonics at {f0} Hz after the mouth has shaped them, in dB below the strongest (0 dB). Gold dashes: the mouth's resonance curve. Typical adult-male values from a source–filter model — illustrative, not a measurement.</Text>
    </View>
  );
}

/** The chin's outline only (the lit edge of the lower face), riding the jaw. */
function chinEdgeD(jaw: number): string {
  'worklet';
  const a = jawAngle(jaw);
  return 'M ' + pt(rot(228, 60, a)) + ' C ' + pt(rot(231, 64, a)) + ' ' + pt(rot(229, 72, a)) + ' ' + pt(rot(233, 80, a)) + ' C ' + pt(rot(238, 86, a)) + ' ' + pt(rot(262, 87, a)) + ' ' + pt(rot(290, 84, a));
}
