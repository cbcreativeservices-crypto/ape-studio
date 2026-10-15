/**
 * Shared drawings for the Speech & Voice Lab. This file holds the vocal folds
 * (page 3) and the voices chart (page 9), and re-exports the rest from their
 * own files (2026-10-14 redraw): the head-and-neck section (headSection),
 * the vowel pictures (vowelViz), waveforms and spectra (speechCharts).
 *
 * Colour language: every drawn LEVEL rides the app-wide amplitude ramp
 * (levelColor.ts); reference / zero lines are faint guides BEHIND a signal,
 * never over it; selection is cyan.
 *
 * Legibility (owner 2026-09-25, "9 pt minimum" + "full screen should still be
 * interactive"): every drawing renders through ExpandableFigure at (w, h = w ÷
 * aspect), so the SVG box keeps its viewBox ratio; every label is authored at
 * ≥ 9 and never renders below 1 : 1 on a 375-wide phone.
 */
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useDerivedValue, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';
import { VF_AX, VF_H, VF_PALETTE, VF_SHOWN_HZ, VF_SLOWDOWN, VF_STILL_PHASE, VF_TRACE, VF_W, foldsFrame, type FoldsFrame } from './vocalFoldsGeometry';
import { colors, fonts } from '../../../theme/tokens';
import { LOUDNESS_STOPS } from '../../../features/tools/levelColor';
import { VOICE_CHART, voiceChartLayout, voiceChartX, type VoiceChartLabel, type VoiceRange } from '../../../features/speech/speechModel';
import { ExpandableFigure } from '../kit/ExpandableFigure';

export { SpectrumBars, SpectrumSvg, TraceChart, TraceSvg } from './speechCharts';
export { HeadCrossSection } from './headSection';
export { FormantChart, VowelChart } from './vowelViz';

const F = fonts.barlowMedium;

export function Title({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{children}</Text>;
}

/* ── vocal folds ───────────────────────────────────────────────────────── */

/**
 * Laryngoscopic view of the larynx (looking DOWN it, the front of the neck at
 * the top) — redrawn 2026-10-14 at the current standard; geometry and the
 * motion model live in vocalFoldsGeometry.ts (read its header).
 * Voiced: the folds are together and the membranous front two-thirds vibrate
 * (Rosenberg glottal pulse, mucosal wave rippling outward), shown ~100×
 * slower; unvoiced: the arytenoids swing the folds apart into the breathing
 * "V" and air rises out of the open glottis. ONE clock drives the folds and
 * the WHAT COMES OUT trace, so a puff on the trace is the glottis opening.
 * Reduced motion: a still frame per state (voiced = part-way open).
 */
export function VocalFolds({ voiced, reduceMotion, controls }: { voiced: boolean; reduceMotion: boolean; controls?: ReactNode }) {
  return (
    <ExpandableFigure aspect={VF_W / VF_H} title="FOLDS" controls={controls} render={(w, h) => (
    <View accessible accessibilityLabel={voiced
      ? `Looking down the larynx, front at the top: the two white vocal folds are together and vibrating, opening and closing the gap between them, shown about ${VF_SLOWDOWN} times slower than a typical voice. Each opening lets a puff of air through, producing a buzz with a pitch.`
      : 'Looking down the larynx, front at the top: the two white vocal folds are held apart in a V by the arytenoid cartilages at the back. Air rises freely through the open gap, producing only breath noise, no pitch.'} style={{ width: w, height: h }}>
      <VocalFoldsSvg voiced={voiced} reduceMotion={reduceMotion} w={w} h={h} />
    </View>
    )} />
  );
}

const APath = Animated.createAnimatedComponent(Path);
const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const P = VF_PALETTE;

function VocalFoldsSvg({ voiced, reduceMotion, w, h }: { voiced: boolean; reduceMotion: boolean; w: number; h: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (k: string) => `vf${k}${uid}`;
  const cyc = useSharedValue(reduceMotion ? VF_STILL_PHASE : 0);
  const ab = useSharedValue(voiced ? 0 : 1);
  // Rest pose for the static props — captured ONCE so a re-render never
  // snaps an animated element back (the animated props own every later frame).
  const rest = useRef<FoldsFrame | null>(null);
  if (!rest.current) rest.current = foldsFrame(reduceMotion ? VF_STILL_PHASE : 0, voiced ? 0 : 1);
  const r0 = rest.current;

  const clock = useFrameCallback((info) => {
    const dt = info.timeSincePreviousFrame;
    if (dt == null) return;
    let c = cyc.value + (VF_SHOWN_HZ * Math.min(dt, 64)) / 1000;
    if (c > 6000) c -= 6000; // whole cycles: the phase is unchanged
    cyc.value = c;
  }, false);
  // Paused while the screen is not showing (owner 2026-10-14).
  const focused = useIsFocused();
  useEffect(() => {
    clock.setActive(!reduceMotion && focused);
    if (reduceMotion) cyc.value = VF_STILL_PHASE;
  }, [reduceMotion, focused, clock, cyc]);
  useEffect(() => {
    const target = voiced ? 0 : 1;
    ab.value = reduceMotion ? target : withTiming(target, { duration: 700, easing: Easing.inOut(Easing.cubic) });
  }, [voiced, reduceMotion, ab]);

  const frame = useDerivedValue(() => foldsFrame(cyc.value, ab.value));
  const inlet = useAnimatedProps(() => ({ d: frame.value.inlet }));
  const aeL = useAnimatedProps(() => ({ d: frame.value.aeL }));
  const aeR = useAnimatedProps(() => ({ d: frame.value.aeR }));
  const aeHiL = useAnimatedProps(() => ({ d: frame.value.aeHiL }));
  const aeHiR = useAnimatedProps(() => ({ d: frame.value.aeHiR }));
  const gap = useAnimatedProps(() => ({ d: frame.value.gap }));
  const rings = useAnimatedProps(() => ({ d: frame.value.rings, opacity: frame.value.ringsOpacity }));
  const inter = useAnimatedProps(() => ({ d: frame.value.inter }));
  const foldL = useAnimatedProps(() => ({ d: frame.value.foldL }));
  const foldR = useAnimatedProps(() => ({ d: frame.value.foldR }));
  const crestL = useAnimatedProps(() => ({ d: frame.value.crestL, opacity: 0.85 * frame.value.waveOpacity }));
  const crestR = useAnimatedProps(() => ({ d: frame.value.crestR, opacity: 0.85 * frame.value.waveOpacity }));
  const troughL = useAnimatedProps(() => ({ d: frame.value.troughL, opacity: 0.6 * frame.value.waveOpacity }));
  const troughR = useAnimatedProps(() => ({ d: frame.value.troughR, opacity: 0.6 * frame.value.waveOpacity }));
  const ventL = useAnimatedProps(() => ({ d: frame.value.ventL }));
  const ventR = useAnimatedProps(() => ({ d: frame.value.ventR }));
  const ffL = useAnimatedProps(() => ({ d: frame.value.ffL }));
  const ffR = useAnimatedProps(() => ({ d: frame.value.ffR }));
  const aryL = useAnimatedProps(() => ({ d: frame.value.aryL }));
  const aryR = useAnimatedProps(() => ({ d: frame.value.aryR }));
  const cornL = useAnimatedProps(() => ({ cx: frame.value.cornLx, cy: frame.value.cornY }));
  const cornR = useAnimatedProps(() => ({ cx: frame.value.cornRx, cy: frame.value.cornY }));
  const air0 = useAnimatedProps(() => ({ d: frame.value.air0, opacity: frame.value.airO0 }));
  const air1 = useAnimatedProps(() => ({ d: frame.value.air1, opacity: frame.value.airO1 }));
  const air2 = useAnimatedProps(() => ({ d: frame.value.air2, opacity: frame.value.airO2 }));
  const trace = useAnimatedProps(() => ({ d: frame.value.trace }));
  const ldFF = useAnimatedProps(() => ({ x2: frame.value.lead.falseFold[0], y2: frame.value.lead.falseFold[1] }));
  const ldFold = useAnimatedProps(() => ({ x2: frame.value.lead.fold[0], y2: frame.value.lead.fold[1] }));
  const ldGlot = useAnimatedProps(() => ({ x2: frame.value.lead.glottis[0], y2: frame.value.lead.glottis[1] }));
  const ldAry = useAnimatedProps(() => ({ x2: frame.value.lead.arytenoid[0], y2: frame.value.lead.arytenoid[1] }));
  const dotFF = useAnimatedProps(() => ({ cx: frame.value.lead.falseFold[0], cy: frame.value.lead.falseFold[1] }));
  const dotFold = useAnimatedProps(() => ({ cx: frame.value.lead.fold[0], cy: frame.value.lead.fold[1] }));
  const dotGlot = useAnimatedProps(() => ({ cx: frame.value.lead.glottis[0], cy: frame.value.lead.glottis[1] }));
  const dotAry = useAnimatedProps(() => ({ cx: frame.value.lead.arytenoid[0], cy: frame.value.lead.arytenoid[1] }));

  const T = VF_TRACE;
  const note = voiced
    ? (reduceMotion ? 'STILL FRAME · ONE MOMENT OF THE CYCLE' : `SLOW MOTION · ABOUT ${VF_SLOWDOWN}× SLOWER`)
    : '← CYAN: AIR RISING TOWARD YOU';
  const leaderX = 59;
  const lab = (y: number, text: string) => (
    <SvgText x={leaderX - 2} y={y + 3} fontSize={9} fill={colors.textSecondary} textAnchor="end" fontFamily={F}>{text}</SvgText>
  );
  const leaderLine = { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.8 } as const;
  const leaderDot = { r: 1.4, fill: '#ffffff', stroke: '#000000', strokeWidth: 0.5 } as const;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${VF_W} ${VF_H}`}>
      <Defs>
        <RadialGradient id={id('field')} cx={VF_AX} cy={66} rx={70} ry={56} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor={P.fieldCentre} />
          <Stop offset={0.62} stopColor={P.fieldMid} />
          <Stop offset={1} stopColor="#0a0a0c" />
        </RadialGradient>
        <RadialGradient id={id('vest')} cx={VF_AX - 6} cy={60} rx={46} ry={48} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor={P.vestibuleCentre} />
          <Stop offset={1} stopColor={P.vestibuleEdge} />
        </RadialGradient>
        <RadialGradient id={id('gap')} cx={VF_AX} cy={80} rx={22} ry={40} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor={P.gapCentre} />
          <Stop offset={1} stopColor={P.gapEdge} />
        </RadialGradient>
        <LinearGradient id={id('foldL')} x1={0} y1={0} x2={1} y2={0}>
          <Stop offset={0} stopColor={P.foldLateral} />
          <Stop offset={1} stopColor={P.foldMedial} />
        </LinearGradient>
        <LinearGradient id={id('foldR')} x1={0} y1={0} x2={1} y2={0}>
          <Stop offset={0} stopColor={P.foldMedial} />
          <Stop offset={1} stopColor={P.foldLateral} />
        </LinearGradient>
        <LinearGradient id={id('ff')} x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0} stopColor={P.falseFoldHi} />
          <Stop offset={1} stopColor={P.falseFold} />
        </LinearGradient>
        <RadialGradient id={id('ary')} cx={0.35} cy={0.3} r={0.75}>
          <Stop offset={0} stopColor={P.arytenoidHi} />
          <Stop offset={1} stopColor={P.arytenoid} />
        </RadialGradient>
        <LinearGradient id={id('epi')} x1={0} y1={0} x2={0} y2={1}>
          <Stop offset={0} stopColor={P.epiglottisRim} />
          <Stop offset={1} stopColor={P.epiglottis} />
        </LinearGradient>
        {/* unipolar pulse train on the amplitude ramp: baseline MIDI-0 blue, the
            full pulse in the orange band (never red — a sketch does not clip) */}
        <LinearGradient id={id('ramp')} gradientUnits="userSpaceOnUse" x1={0} y1={T.base - T.amp / 0.82} x2={0} y2={T.base}>
          {LOUDNESS_STOPS.map((s) => <Stop key={s.pos} offset={s.pos} stopColor={s.color} />)}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={VF_W} height={VF_H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />

      {/* ── the endoscope's lit field: hypopharynx, pyriform sinuses ── */}
      <Ellipse cx={VF_AX} cy={66} rx={66} ry={52} fill={`url(#${id('field')})`} />
      <Path d={`M ${VF_AX - 50} 52 C ${VF_AX - 60} 62 ${VF_AX - 60} 84 ${VF_AX - 46} 96 C ${VF_AX - 50} 82 ${VF_AX - 52} 66 ${VF_AX - 50} 52 Z`} fill={P.pyriform} opacity={0.85} />
      <Path d={`M ${VF_AX + 50} 52 C ${VF_AX + 60} 62 ${VF_AX + 60} 84 ${VF_AX + 46} 96 C ${VF_AX + 50} 82 ${VF_AX + 52} 66 ${VF_AX + 50} 52 Z`} fill={P.pyriform} opacity={0.85} />

      {/* ── inside the inlet: vestibule, glottis, folds ── */}
      <APath animatedProps={inlet} d={r0.inlet} fill={`url(#${id('vest')})`} />
      <APath animatedProps={gap} d={r0.gap} fill={`url(#${id('gap')})`} />
      <APath animatedProps={rings} d={r0.rings} opacity={r0.ringsOpacity} fill="none" stroke={P.ring} strokeWidth={1.4} strokeLinecap="round" />
      <APath animatedProps={inter} d={r0.inter} fill={P.interarytenoid} />
      {/* the back: arytenoids — drawn under the folds so each fold's back end
          (the vocal process) runs straight into its arytenoid */}
      <APath animatedProps={aryL} d={r0.aryL} fill={`url(#${id('ary')})`} />
      <APath animatedProps={aryR} d={r0.aryR} fill={`url(#${id('ary')})`} />
      <APath animatedProps={foldL} d={r0.foldL} fill={`url(#${id('foldL')})`} />
      <APath animatedProps={foldR} d={r0.foldR} fill={`url(#${id('foldR')})`} />
      <APath animatedProps={troughL} d={r0.troughL} opacity={0} fill="none" stroke={P.waveShadow} strokeWidth={0.9} strokeLinecap="round" />
      <APath animatedProps={troughR} d={r0.troughR} opacity={0} fill="none" stroke={P.waveShadow} strokeWidth={0.9} strokeLinecap="round" />
      <APath animatedProps={crestL} d={r0.crestL} opacity={0} fill="none" stroke={P.waveCrest} strokeWidth={1.1} strokeLinecap="round" />
      <APath animatedProps={crestR} d={r0.crestR} opacity={0} fill="none" stroke={P.waveCrest} strokeWidth={1.1} strokeLinecap="round" />
      <APath animatedProps={ventL} d={r0.ventL} fill="none" stroke={P.ventricle} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
      <APath animatedProps={ventR} d={r0.ventR} fill="none" stroke={P.ventricle} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
      <APath animatedProps={ffL} d={r0.ffL} fill={`url(#${id('ff')})`} />
      <APath animatedProps={ffR} d={r0.ffR} fill={`url(#${id('ff')})`} />

      {/* corniculate tubercles on the arytenoids' tops */}
      <AEllipse animatedProps={cornL} cx={r0.cornLx} cy={r0.cornY} rx={1.8} ry={1.5} fill={P.corniculate} opacity={0.8} />
      <AEllipse animatedProps={cornR} cx={r0.cornRx} cy={r0.cornY} rx={1.8} ry={1.5} fill={P.corniculate} opacity={0.8} />

      {/* ── the rim: aryepiglottic folds, then the epiglottis over the front ── */}
      <APath animatedProps={aeL} d={r0.aeL} fill="none" stroke={P.aeRim} strokeWidth={3.6} strokeLinecap="round" />
      <APath animatedProps={aeR} d={r0.aeR} fill="none" stroke={P.aeRim} strokeWidth={3.6} strokeLinecap="round" />
      <APath animatedProps={aeHiL} d={r0.aeHiL} fill="none" stroke={P.aeRimHi} strokeWidth={1} strokeLinecap="round" opacity={0.55} />
      <APath animatedProps={aeHiR} d={r0.aeHiR} fill="none" stroke={P.aeRimHi} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      {/* epiglottic tubercle (just above the front of the folds) */}
      <Ellipse cx={VF_AX} cy={35} rx={10} ry={3.6} fill={P.vestibuleCentre} />
      <Ellipse cx={VF_AX - 1} cy={34.2} rx={6} ry={1.4} fill={P.falseFoldHi} opacity={0.45} />
      {/* epiglottis: a curled leaf, broad in the middle, its free margin highest */}
      <Path d={`M ${VF_AX - 38} 40 C ${VF_AX - 36} 14 ${VF_AX + 36} 14 ${VF_AX + 38} 40 L ${VF_AX + 31} 39 C ${VF_AX + 26} 27 ${VF_AX - 26} 27 ${VF_AX - 31} 39 Z`} fill={`url(#${id('epi')})`} />
      <Path d={`M ${VF_AX - 37.4} 37 C ${VF_AX - 34} 15.4 ${VF_AX + 34} 15.4 ${VF_AX + 37.4} 37`} fill="none" stroke={P.epiglottisRim} strokeWidth={1.1} opacity={0.8} />
      <Path d={`M ${VF_AX - 22} 26 Q ${VF_AX - 13} 23.6 ${VF_AX - 5} 24.6 M ${VF_AX - 13} 24 Q ${VF_AX - 9} 26 ${VF_AX - 8} 28`} fill="none" stroke={P.vessel} strokeWidth={0.6} opacity={0.45} />
      <Path d={`M ${VF_AX + 8} 24.4 Q ${VF_AX + 16} 23.8 ${VF_AX + 24} 26.6`} fill="none" stroke={P.vessel} strokeWidth={0.6} opacity={0.4} />
      {/* wet-mucosa glints, lit from the upper left */}
      <Ellipse cx={VF_AX - 14} cy={23.2} rx={7} ry={0.9} fill="#ffffff" opacity={0.4} />
      <Ellipse cx={VF_AX - 44} cy={58} rx={0.9} ry={4} fill="#ffffff" opacity={0.3} />

      {/* ── unvoiced: air rising out of the open glottis toward the viewer ── */}
      <APath animatedProps={air0} d={r0.air0} opacity={r0.airO0} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <APath animatedProps={air1} d={r0.air1} opacity={r0.airO1} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <APath animatedProps={air2} d={r0.air2} opacity={r0.airO2} fill="none" stroke={colors.cyanBright} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />

      {/* ── leader labels (each line follows its structure as it moves) ── */}
      {lab(30, 'epiglottis')}
      <Line x1={leaderX} y1={30} x2={VF_AX - 32} y2={30} {...leaderLine} />
      <Circle cx={VF_AX - 32} cy={30} {...leaderDot} />
      {lab(48, 'false fold')}
      <ALine animatedProps={ldFF} x1={leaderX} y1={48} x2={r0.lead.falseFold[0]} y2={r0.lead.falseFold[1]} {...leaderLine} />
      <ACircle animatedProps={dotFF} cx={r0.lead.falseFold[0]} cy={r0.lead.falseFold[1]} {...leaderDot} />
      {lab(66, 'vocal fold')}
      <ALine animatedProps={ldFold} x1={leaderX} y1={66} x2={r0.lead.fold[0]} y2={r0.lead.fold[1]} {...leaderLine} />
      <ACircle animatedProps={dotFold} cx={r0.lead.fold[0]} cy={r0.lead.fold[1]} {...leaderDot} />
      {lab(86, 'glottis')}
      <ALine animatedProps={ldGlot} x1={leaderX} y1={86} x2={r0.lead.glottis[0]} y2={r0.lead.glottis[1]} {...leaderLine} />
      <ACircle animatedProps={dotGlot} cx={r0.lead.glottis[0]} cy={r0.lead.glottis[1]} {...leaderDot} />
      {lab(104, 'arytenoid')}
      <ALine animatedProps={ldAry} x1={leaderX} y1={104} x2={r0.lead.arytenoid[0]} y2={r0.lead.arytenoid[1]} {...leaderLine} />
      <ACircle animatedProps={dotAry} cx={r0.lead.arytenoid[0]} cy={r0.lead.arytenoid[1]} {...leaderDot} />

      <SvgText x={12} y={13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>LOOKING DOWN THE LARYNX · FRONT AT TOP</SvgText>
      <SvgText x={VF_AX} y={124} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{voiced ? 'folds meet · gap opens and closes' : 'folds apart · the breathing "V"'}</SvgText>

      {/* ── the resulting signal: the airflow puffs through the glottis ── */}
      <SvgText x={206} y={13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>{voiced ? 'WHAT COMES OUT' : 'WHAT THE MIC HEARS'}</SvgText>
      {/* zero-flow guide: faint, BEHIND the trace (one signal reads as one signal) */}
      <Line x1={T.x0} y1={T.base} x2={T.x0 + T.w} y2={T.base} stroke="rgba(255,255,255,0.14)" strokeWidth={0.6} />
      <APath animatedProps={trace} d={r0.trace} fill="none" stroke={`url(#${id('ramp')})`} strokeWidth={1.6} strokeLinejoin="round" />
      <SvgText x={T.x0 + T.w / 2} y={96} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{note}</SvgText>
      <SvgText x={267} y={118} fontSize={9} fill={voiced ? colors.gold : colors.textSecondary} textAnchor="middle" fontFamily={F}>{voiced ? 'pulses → pitch + harmonics' : 'mouth hiss → noise, no pitch'}</SvgText>
    </Svg>
  );
}

/* ── log-frequency range bars (voices) ─────────────────────────────────── */

/** Speaking pitch (thick bar + typical tick) and the F1–F3 formant region
 *  (thin bar) per voice on one 60 Hz – 4 kHz log axis. Every label sits on
 *  its own line or in its own column — positions come from voiceChartLayout,
 *  which test/speechModel.test.ts checks for collisions. */
export function RangeBars({ ranges, colors: cols, a11y }: { ranges: VoiceRange[]; colors: string[]; a11y: string }) {
  const L = voiceChartLayout(ranges);
  const { W, H } = L;
  const x = voiceChartX;
  const fs = VOICE_CHART.fontSize;
  const label = (l: VoiceChartLabel, fill: string, key?: string) => (
    <SvgText key={key} x={l.x} y={l.y} fontSize={fs} fill={fill} textAnchor={l.anchor} fontFamily={F}>{l.text}</SvgText>
  );
  return (
    <ExpandableFigure aspect={W / H} title="VOICES" render={(w, h) => (
    <View accessible accessibilityLabel={a11y} style={{ width: w, height: h }}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {L.ticks.map((t) => (
          <G key={t.hz}>
            <Line x1={t.gx} y1={L.gridTop} x2={t.gx} y2={L.gridBottom} stroke="rgba(255,255,255,0.07)" />
            {label(t.label, colors.textMuted)}
          </G>
        ))}
        {/* legend: the two bar shapes, then the caveat */}
        <Rect x={10} y={7} width={12} height={8} rx={4} fill={colors.textMuted} opacity={0.5} />
        {label(L.header[0], colors.textMuted)}
        <Rect x={114} y={9} width={12} height={4} rx={2} fill={colors.textMuted} opacity={0.35} />
        {label(L.header[1], colors.textMuted)}
        {label(L.header[2], colors.textMuted)}
        {ranges.map((r, i) => {
          const row = L.rows[i];
          const c = cols[i % cols.length];
          return (
            <G key={r.id}>
              {label(row.name, c)}
              {label(row.nums, c)}
              <Rect x={x(r.f0LoHz)} y={row.pitchY} width={x(r.f0HiHz) - x(r.f0LoHz)} height={row.pitchH} rx={6} fill={c} opacity={0.4} />
              <Line x1={x(r.f0TypicalHz)} y1={row.pitchY - 2} x2={x(r.f0TypicalHz)} y2={row.pitchY + row.pitchH + 2} stroke={c} strokeWidth={2} />
              <Rect x={x(r.fmLoHz)} y={row.formantY} width={x(r.fmHiHz) - x(r.fmLoHz)} height={row.formantH} rx={2.5} fill={c} opacity={0.3} />
              {/* that voice's harmonics at its typical pitch (every f0 Hz): packed
                  close for a low voice, far apart for a child — the formants
                  can only lift the harmonics that are there */}
              {Array.from({ length: Math.floor(VOICE_CHART.hiHz / r.f0TypicalHz) }, (_, k) => (k + 1) * r.f0TypicalHz).map((f) => (
                <Line key={`h${f}`} x1={x(f)} y1={row.formantY - 2} x2={x(f)} y2={row.formantY + row.formantH + 2} stroke={c} strokeWidth={0.8} opacity={f >= r.fmLoHz && f <= r.fmHiHz ? 0.95 : 0.4} />
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
    )} />
  );
}
