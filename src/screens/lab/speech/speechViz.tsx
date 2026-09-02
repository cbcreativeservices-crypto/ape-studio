/**
 * Shared drawings for the Speech & Voice Lab: the head cross-section, the
 * vocal folds, a log-frequency spectrum bar display and a time trace. All
 * data comes from speechModel; nothing is a live meter.
 *
 * Colour language (design pass 2026-09-02): the head uses ONE palette —
 * skin / air / bone / muscle / mucosa — so a learner can read "air space"
 * versus "tissue" at a glance; selection is always cyan. Time traces (the
 * one place a level axis is drawn) use the app-wide amplitude ramp so a
 * near-full-scale plosive reads hot and the mid line is MIDI-0 blue.
 * Spectra and the folds' pulse sketch stay categorical (they are conceptual
 * shapes with no full-scale meaning).
 */
import { useEffect, useId, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { MIDLINE_BLUE, WAVE_LEVEL_STOPS } from '../../../features/tools/levelColor';
import { ANATOMY, formantEnvelope, harmonicAmplitudes, type Vowel } from '../../../features/speech/speechModel';

const F = fonts.barlowMedium;

function Title({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{children}</Text>;
}

/* ── head cross-section ─────────────────────────────────────────────────── */

const SKIN = '#17181d';
const SKIN_EDGE = '#3d3f48';
const AIR = '#1b2430';
const AIR_EDGE = '#2c3644';
const BONE = '#c9c0ae';
const CARTILAGE = '#8b8b96';
const MUSCLE = '#a1524f';
const MUSCLE_EDGE = '#c46a66';
const MUCOSA = '#d78a80';
const MUCOSA_DEEP = '#c97b7b';
const FOLD = '#e8c9b8';
const LUNG = '#2b3d4a';
const LUNG_EDGE = '#4a6274';
const HI = colors.cyanBright;

/** Radius of the invisible hit circle around each numbered disc (viewBox
 *  units; the drawing renders at ≥ 1 pt per unit on a phone, so ≥ 44 pt). */
const HIT_R = 22;
const DISC_R = 10;

/**
 * Mid-sagittal head and neck, facing LEFT, with a schematic chest below
 * (the two lungs are drawn face-on because a true sagittal cut would show
 * only one — the drawing says "not to scale" for that reason). Numbered tap
 * discs sit off the structures on leader lines, textbook style; the tongue
 * is the one structure large enough to be labelled in place.
 */
export function HeadCrossSection({ selected, onSelect, highlight }: { selected: string | null; onSelect: (id: string) => void; highlight?: string[] }) {
  const hi = (id: string) => selected === id || (highlight?.includes(id) ?? false);
  const fillFor = (id: string, base: string) => (hi(id) ? HI : base);
  const airOpacity = (id: string) => (hi(id) ? 0.6 : 1);
  return (
    <View accessible accessibilityLabel={`Side-view cross-section of the head, neck and chest with ${ANATOMY.length} numbered structures: ${ANATOMY.map((a, i) => `${i + 1} ${a.name}`).join(', ')}. Use the buttons below the drawing to select one.`}>
      <Svg width="100%" height={340} viewBox="0 0 300 320">
        <Rect x={0} y={0} width={300} height={320} rx={10} fill="#0a0a0c" stroke={colors.hairline} />

        {/* ── silhouette: face (left) → crown → nape → shoulders ── */}
        <Path
          d="M 66 318 L 66 262 C 66 250 94 246 130 242 C 128 236 124 230 118 222 C 115 217 118 212 112 210 C 96 206 76 204 62 196 C 54 190 54 180 58 174 C 50 168 50 160 58 156 C 50 152 50 144 57 140 C 60 136 58 132 52 130 C 42 128 40 122 46 118 C 52 110 58 100 64 92 C 68 84 74 62 86 32 C 122 2 200 0 238 26 C 262 42 268 90 256 136 C 248 168 238 192 234 212 L 232 242 C 252 248 288 254 290 270 L 290 318 Z"
          fill={SKIN}
          stroke={SKIN_EDGE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* skull vault (bone thickness hint) */}
        <Path d="M 68 90 C 88 56 134 32 184 34 C 230 38 254 74 252 116" fill="none" stroke={BONE} strokeWidth={3} opacity={0.16} />

        {/* ── airway spaces (drawn first so tissue sits on top) ── */}
        {/* nasal cavity */}
        <Path d="M 64 94 C 82 80 118 74 152 82 C 166 88 172 110 170 136 L 62 138 L 52 130 C 50 120 56 106 64 94 Z" fill={fillFor('nasal', AIR)} opacity={airOpacity('nasal')} stroke={AIR_EDGE} strokeWidth={1} />
        {/* conchae (turbinates) */}
        {[[110, 124, 24, 5], [120, 110, 20, 5], [130, 98, 13, 4]].map(([cx, cy, rx, ry]) => (
          <Ellipse key={cy} cx={cx} cy={cy} rx={rx} ry={ry} fill={hi('nasal') ? 'rgba(0,0,0,0.25)' : '#2f3d4d'} transform={`rotate(-8 ${cx} ${cy})`} />
        ))}
        {/* oral cavity (mouth space; the tongue covers most of it) */}
        <Path d="M 63 143 L 146 143 C 156 146 164 152 167 164 L 160 196 L 74 196 Z" fill={AIR} />
        {/* pharynx */}
        <Path d="M 170 134 L 188 134 C 192 164 194 200 190 236 L 168 238 C 166 210 166 180 168 162 C 168 150 169 142 170 134 Z" fill={fillFor('pharynx', AIR)} opacity={airOpacity('pharynx')} stroke={AIR_EDGE} strokeWidth={1} />
        {/* oesophagus (behind the airway — secondary, kept faint) */}
        <Rect x={170} y={240} width={12} height={78} rx={5} fill="#1a1b20" stroke="#2c2d33" strokeWidth={1} />

        {/* ── mouth ── */}
        {/* hard palate */}
        <Path d="M 64 140 C 88 135 118 135 146 140" fill="none" stroke={fillFor('palate', BONE)} strokeWidth={5} strokeLinecap="round" />
        {/* soft palate + uvula */}
        <Path d="M 146 140 C 158 142 166 148 168 160" fill="none" stroke={fillFor('velum', MUCOSA_DEEP)} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={168} cy={162} r={3.5} fill={fillFor('velum', MUCOSA_DEEP)} />
        {/* tongue */}
        <Path d="M 70 162 C 78 148 108 140 138 150 C 156 156 160 170 156 184 C 152 198 142 208 130 212 L 96 208 C 78 202 70 182 70 162 Z" fill={fillFor('tongue', MUSCLE)} opacity={hi('tongue') ? 0.8 : 1} stroke={hi('tongue') ? HI : MUSCLE_EDGE} strokeWidth={1} />
        {/* teeth (upper and lower incisors) */}
        <Path d="M 61 141 L 70 141 L 68 158 L 63 158 Z" fill={fillFor('teeth', '#efe9dc')} />
        <Path d="M 62 160 L 69 160 L 69 176 L 63 176 Z" fill={fillFor('teeth', '#efe9dc')} />
        {/* lips */}
        <Path d="M 60 140 C 52 141 48 149 58 156 L 61 156 L 61 141 Z" fill={fillFor('lips', MUCOSA)} />
        <Path d="M 61 157 C 50 158 49 170 60 175 L 63 175 L 62 157 Z" fill={fillFor('lips', MUCOSA)} />
        {/* jaw (mandible) */}
        <Path d="M 64 178 C 56 188 58 198 70 204 C 88 210 106 212 122 214" fill="none" stroke={fillFor('jaw', BONE)} strokeWidth={5} strokeLinecap="round" />

        {/* ── larynx ── */}
        {/* epiglottis */}
        <Path d="M 134 218 C 140 206 150 196 162 190 C 160 200 150 214 138 222 Z" fill={hi('larynx') ? HI : '#d9a48a'} opacity={hi('larynx') ? 0.7 : 1} />
        {/* laryngeal cavity */}
        <Rect x={132} y={214} width={36} height={38} rx={6} fill={fillFor('larynx', AIR)} opacity={airOpacity('larynx')} stroke="#3a3f48" strokeWidth={1} />
        {/* false fold, true fold, arytenoid */}
        <Line x1={134} y1={228} x2={152} y2={228} stroke={MUCOSA_DEEP} strokeWidth={3} strokeLinecap="round" />
        <Line x1={134} y1={236} x2={158} y2={236} stroke={FOLD} strokeWidth={4} strokeLinecap="round" />
        <Path d="M 158 230 L 166 226 L 166 242 L 158 240 Z" fill={CARTILAGE} />
        {/* thyroid cartilage (the Adam's apple) and cricoid ring */}
        <Path d="M 128 212 L 133 214 L 129 248 L 124 246 Z" fill={CARTILAGE} />
        <Rect x={126} y={249} width={44} height={5} rx={2} fill={CARTILAGE} opacity={0.8} />

        {/* ── trachea → bronchi → lungs → diaphragm ── */}
        <Line x1={152} y1={284} x2={118} y2={294} stroke="#3d434c" strokeWidth={4} strokeLinecap="round" />
        <Line x1={152} y1={284} x2={196} y2={294} stroke="#3d434c" strokeWidth={4} strokeLinecap="round" />
        <Rect x={136} y={255} width={32} height={30} rx={4} fill={fillFor('trachea', AIR)} opacity={airOpacity('trachea')} stroke="#33383f" strokeWidth={1} />
        {[261, 267, 273, 279].map((y) => <Line key={y} x1={139} y1={y} x2={165} y2={y} stroke="#3d434c" strokeWidth={1.5} />)}
        <Path d="M 84 296 C 84 282 104 274 120 280 C 132 286 134 298 130 309 L 88 309 C 82 305 82 302 84 296 Z" fill={fillFor('lungs', LUNG)} opacity={airOpacity('lungs')} stroke={LUNG_EDGE} strokeWidth={1} />
        <Path d="M 230 296 C 230 282 210 274 194 280 C 182 286 180 298 184 309 L 226 309 C 232 305 232 302 230 296 Z" fill={fillFor('lungs', LUNG)} opacity={airOpacity('lungs')} stroke={LUNG_EDGE} strokeWidth={1} />
        {/* diaphragm dome */}
        <Path d="M 74 318 C 106 309 208 309 240 318" fill="none" stroke={hi('lungs') ? HI : '#9a8a74'} strokeWidth={2.5} strokeLinecap="round" />

        {/* ── caption ── */}
        <SvgText x={12} y={14} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>SIDE VIEW</SvgText>
        <SvgText x={12} y={25} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>NOT TO SCALE</SvgText>

        {/* ── numbered tap discs on leader lines ── */}
        {ANATOMY.map((a, i) => {
          const on = selected === a.id;
          const lit = hi(a.id);
          const inPlace = a.ax === a.x && a.ay === a.y;
          // leader starts at the disc edge, on the line toward the anchor
          const dx = a.ax - a.x, dy = a.ay - a.y, len = Math.hypot(dx, dy) || 1;
          const sx = a.x + (dx / len) * (DISC_R + 1), sy = a.y + (dy / len) * (DISC_R + 1);
          return (
            <G key={a.id} onPress={() => onSelect(a.id)}>
              <Circle cx={a.x} cy={a.y} r={HIT_R} fill="#000" fillOpacity={0.001} />
              {!inPlace ? (
                <>
                  <Line x1={sx} y1={sy} x2={a.ax} y2={a.ay} stroke={lit ? HI : colors.textMuted} strokeWidth={lit ? 1.5 : 1} opacity={lit ? 1 : 0.85} />
                  <Circle cx={a.ax} cy={a.ay} r={1.8} fill={lit ? HI : colors.textMuted} />
                </>
              ) : null}
              <Circle cx={a.x} cy={a.y} r={DISC_R} fill={on ? HI : 'rgba(12,12,14,0.92)'} stroke={lit ? HI : colors.textSub} strokeWidth={lit ? 1.5 : 1} />
              <SvgText x={a.x} y={a.y + 3.5} fontSize={9.5} fill={on ? '#000' : colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ── vocal folds ───────────────────────────────────────────────────────── */

/**
 * Laryngoscope view (looking down the throat, front of the neck at the top).
 * Voiced: the folds meet at both ends and open as a lens in the middle,
 * cycling; unvoiced: they rest apart in the breathing "V", wide at the back.
 */
export function VocalFolds({ voiced, reduceMotion }: { voiced: boolean; reduceMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const animate = voiced && !reduceMotion;
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setPhase((p) => (p + 0.35) % (Math.PI * 2)), 50);
    return () => clearInterval(id);
  }, [animate]);
  const open = voiced ? (animate ? Math.abs(Math.sin(phase)) : 0.5) : 1;
  // g: mid-glottis opening; b: opening at the back (arytenoids)
  const g = voiced ? 3 + open * 18 : 16;
  const b = voiced ? 3 : 34;
  const W = 340, H = 130, cx = 120, cy = 68;
  const fold = (s: 1 | -1) =>
    `M ${cx} 32 C ${cx - s * g * 0.55} 44 ${cx - s * g / 2} 58 ${cx - s * g / 2} ${cy} C ${cx - s * g / 2} 78 ${cx - s * g * 0.55} 92 ${cx - s * b / 2} 104 L ${cx - s * 44} 104 C ${cx - s * 52} 88 ${cx - s * 52} 48 ${cx - s * 40} 32 Z`;
  const airY = voiced ? [] : [40, 62, 84];
  return (
    <View accessible accessibilityLabel={voiced ? 'Vocal folds seen from above, vibrating: they meet along their length and open and close in the middle, producing a buzz.' : 'Vocal folds seen from above, held apart in a V: air passes freely, producing only breath noise.'}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <SvgText x={12} y={13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>LOOKING DOWN THE LARYNX · FRONT AT TOP</SvgText>
        {/* laryngeal inlet, vestibule, epiglottis rim */}
        <Ellipse cx={cx} cy={cy} rx={58} ry={46} fill="#1a1416" stroke="#3a2c30" strokeWidth={1} />
        <Ellipse cx={cx} cy={cy} rx={46} ry={38} fill="#8e5450" />
        <Path d="M 66 44 C 82 18 158 18 174 44 C 158 30 82 30 66 44 Z" fill="#d9a48a" />
        {/* the airway below the folds shows through the gap */}
        <Circle cx={cx} cy={cy} r={22} fill="#08080a" />
        <Circle cx={cx} cy={cy} r={14} fill="none" stroke="#22262c" strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={7} fill="none" stroke="#22262c" strokeWidth={1} />
        {/* true folds */}
        <Path d={fold(1)} fill={FOLD} stroke="#f4dccd" strokeWidth={1} />
        <Path d={fold(-1)} fill={FOLD} stroke="#f4dccd" strokeWidth={1} />
        {/* arytenoids (the back) */}
        <Ellipse cx={cx - 12} cy={107} rx={9} ry={5} fill={MUCOSA_DEEP} />
        <Ellipse cx={cx + 12} cy={107} rx={9} ry={5} fill={MUCOSA_DEEP} />
        {airY.map((y) => <Polyline key={y} points={`${cx - 4},${y + 8} ${cx},${y} ${cx + 4},${y + 8}`} fill="none" stroke={colors.cyanBright} strokeWidth={1.5} />)}
        <SvgText x={cx} y={124} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{voiced ? 'folds meet · gap opens and closes' : 'folds apart · open "V" for breathing'}</SvgText>
        {/* the resulting signal */}
        <SvgText x={206} y={13} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>WHAT COMES OUT</SvgText>
        <Line x1={205} y1={70} x2={330} y2={70} stroke="rgba(255,255,255,0.15)" />
        <Polyline
          points={Array.from({ length: 80 }, (_, i) => {
            const t = i / 79;
            const y = voiced
              ? 70 - 28 * Math.max(0, Math.sin(2 * Math.PI * 6 * t + phase)) ** 2 * (i % 2 ? 1 : 0.85)
              : 70 - 12 * (Math.sin(i * 7.3) * 0.6 + Math.sin(i * 2.1) * 0.4);
            return `${(205 + t * 125).toFixed(1)},${y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={voiced ? colors.gold : colors.textSecondary}
          strokeWidth={1.5}
        />
        <SvgText x={267} y={118} fontSize={9} fill={voiced ? colors.gold : colors.textSecondary} textAnchor="middle" fontFamily={F}>{voiced ? 'pulses → pitch + harmonics' : 'turbulence → noise, no pitch'}</SvgText>
      </Svg>
    </View>
  );
}

/* ── spectrum bars ─────────────────────────────────────────────────────── */

export function SpectrumBars({
  hz, mag, ghost, band, bandKind = 'excess', bandLabel, height = 130, title, a11y,
}: {
  hz: Float64Array;
  mag: Float64Array;
  /** A second, faint spectrum drawn behind (the "clean" reference). */
  ghost?: Float64Array;
  /** Highlighted region [lo, hi] Hz. */
  band?: [number, number];
  /** `excess`: energy that is there and should not be (hot tint, orange
   *  bars). `loss`: energy that is missing (cool tint, bars unchanged). */
  bandKind?: 'excess' | 'loss';
  bandLabel?: string;
  height?: number;
  title?: string;
  a11y: string;
}) {
  const W = 340, H = height, top = 18, bottom = H - 20;
  const n = hz.length;
  const lo = hz[0] * 0.9, hi = hz[n - 1] * 1.1;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 20);
  const bw = (W - 20) / n;
  const ticks = [50, 100, 200, 500, 1000, 2000, 5000, 10000].filter((t) => t > lo && t < hi);
  const bandColor = bandKind === 'loss' ? colors.blue : colors.orange;
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {band ? <Rect x={x(band[0])} y={top - 4} width={Math.max(1, x(band[1]) - x(band[0]))} height={bottom - top + 8} fill={bandColor} opacity={bandKind === 'loss' ? 0.1 : 0.12} /> : null}
        {band && bandLabel ? <SvgText x={x(band[0]) + 4} y={top + 6} fontSize={8.5} fill={bandColor} fontFamily={fonts.oswaldMedium}>{bandLabel}</SvgText> : null}
        {ghost
          ? Array.from(ghost, (m, i) => <Rect key={`g${i}`} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={m * (bottom - top)} fill={colors.textMuted} opacity={0.35} />)
          : null}
        {Array.from(mag, (m, i) => (
          <Rect key={i} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={Math.max(0.5, m * (bottom - top))} fill={band && bandKind === 'excess' && hz[i] >= band[0] && hz[i] <= band[1] ? colors.orange : colors.cyanBright} opacity={0.9} />
        ))}
        {ticks.map((t) => (
          <SvgText key={t} x={x(t)} y={H - 6} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>
        ))}
        <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>relative level · illustrative</SvgText>
      </Svg>
    </View>
  );
}

/* ── formant chart (linear 0–4 kHz: harmonic comb under the mouth's curve) ── */

export function FormantChart({ v, f0 = 120, height = 140, title }: { v: Vowel; f0?: number; height?: number; title?: string }) {
  const W = 340, H = height, top = 20, bottom = H - 20, maxHz = 4000;
  const x = (f: number) => 10 + (f / maxHz) * (W - 20);
  const env = formantEnvelope(v, 120, maxHz);
  const harm = harmonicAmplitudes(v, f0, maxHz);
  const envPts = Array.from(env.hz, (f, i) => `${x(f).toFixed(1)},${(bottom - env.mag[i] * (bottom - top)).toFixed(1)}`).join(' ');
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={`Harmonics of a ${f0} hertz voice shaped by the mouth for ${v.sound}: peaks near ${v.f1}, ${v.f2} and ${v.f3} hertz. Typical adult-male values, illustrative.`}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Polyline points={envPts} fill="none" stroke={colors.gold} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.9} />
        {Array.from(harm.hz, (f, i) => (
          <Line key={i} x1={x(f)} y1={bottom} x2={x(f)} y2={bottom - harm.mag[i] * (bottom - top)} stroke={colors.cyanBright} strokeWidth={2} />
        ))}
        {[['F1', v.f1], ['F2', v.f2], ['F3', v.f3]].map(([l, f]) => (
          <G key={l as string}>
            <Line x1={x(f as number)} y1={top - 6} x2={x(f as number)} y2={top + 2} stroke={colors.gold} strokeWidth={1.5} />
            <SvgText x={x(f as number)} y={top - 9} fontSize={8.5} fill={colors.gold} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{l}</SvgText>
          </G>
        ))}
        {[0, 1000, 2000, 3000, 4000].map((t) => (
          <SvgText key={t} x={t === 0 ? 12 : t === 4000 ? W - 12 : x(t)} y={H - 6} fontSize={8.5} fill={colors.textMuted} textAnchor={t === 0 ? 'start' : t === 4000 ? 'end' : 'middle'} fontFamily={F}>{t === 0 ? '0 Hz' : `${t / 1000} kHz`}</SvgText>
        ))}
      </Svg>
      <Text style={{ color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 15 }}>Cyan: the voice's harmonics at {f0} Hz after the mouth has shaped them. Gold: the mouth's resonance curve. Typical adult-male values — illustrative, not a measurement.</Text>
    </View>
  );
}

/* ── time trace ────────────────────────────────────────────────────────── */

/** A waveform "at the capsule": the vertical axis is level, so the line is
 *  painted with the app-wide amplitude ramp (blue at the mid line → red at
 *  ±full scale) and the mid line is MIDI-0 blue. */
export function TraceChart({ samples, height = 120, title, a11y }: { samples: Float64Array; height?: number; title?: string; a11y: string }) {
  const W = 340, H = height, mid = H / 2, amp = H / 2 - 12;
  const gid = `trace${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const pts = Array.from(samples, (s, i) => `${(10 + (i / (samples.length - 1)) * (W - 20)).toFixed(1)},${(mid - s * amp).toFixed(1)}`).join(' ');
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gid} x1={0} y1={mid - amp} x2={0} y2={mid + amp} gradientUnits="userSpaceOnUse">
            {WAVE_LEVEL_STOPS.map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={10} y1={mid - amp} x2={W - 10} y2={mid - amp} stroke="rgba(255,255,255,0.06)" />
        <Line x1={10} y1={mid + amp} x2={W - 10} y2={mid + amp} stroke="rgba(255,255,255,0.06)" />
        <Line x1={10} y1={mid} x2={W - 10} y2={mid} stroke={MIDLINE_BLUE} strokeWidth={1} />
        <Polyline points={pts} fill="none" stroke={`url(#${gid})`} strokeWidth={1.6} strokeLinejoin="round" />
        <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>time → · full scale at the edges · illustrative</SvgText>
      </Svg>
    </View>
  );
}

/* ── log-frequency range bars (voices) ─────────────────────────────────── */

export function RangeBars({ ranges, loHz, hiHz, a11y }: { ranges: { name: string; lo: number; hi: number; typical: number; color: string }[]; loHz: number; hiHz: number; a11y: string }) {
  const W = 340, rowH = 34, H = 32 + ranges.length * rowH;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(loHz)) / (Math.log(hiHz) - Math.log(loHz))) * (W - 20);
  const ticks = [60, 100, 150, 200, 300, 400, 500].filter((t) => t >= loHz && t <= hiHz);
  return (
    <View accessible accessibilityLabel={a11y}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {ticks.map((t) => (
          <G key={t}>
            <Line x1={x(t)} y1={8} x2={x(t)} y2={H - 18} stroke="rgba(255,255,255,0.07)" />
            <SvgText x={x(t)} y={H - 6} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t} Hz</SvgText>
          </G>
        ))}
        {ranges.map((r, i) => {
          const y = 12 + i * rowH;
          // labels for bars in the right half hang leftward from the bar's end so they never run off the panel
          const right = x(r.lo) > W * 0.4;
          return (
            <G key={r.name}>
              <Rect x={x(r.lo)} y={y} width={x(r.hi) - x(r.lo)} height={14} rx={7} fill={r.color} opacity={0.35} />
              <Line x1={x(r.typical)} y1={y - 2} x2={x(r.typical)} y2={y + 16} stroke={r.color} strokeWidth={2} />
              <SvgText x={right ? x(r.hi) : x(r.lo) + 4} y={y + 26} fontSize={9} fill={r.color} textAnchor={right ? 'end' : 'start'} fontFamily={F}>{r.name} · {r.lo}–{r.hi} Hz · typical ~{r.typical}</SvgText>
            </G>
          );
        })}
        <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>speaking pitch · typical, not fixed</SvgText>
      </Svg>
    </View>
  );
}
