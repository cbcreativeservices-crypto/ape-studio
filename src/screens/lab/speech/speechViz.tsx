/**
 * Shared drawings for the Speech & Voice Lab: the head cross-section, the
 * vocal folds, a log-frequency spectrum bar display and a time trace. All
 * data comes from speechModel; nothing is a live meter.
 */
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { ANATOMY, formantEnvelope, harmonicAmplitudes, type Vowel } from '../../../features/speech/speechModel';

const F = fonts.barlowMedium;

/* ── head cross-section ─────────────────────────────────────────────────── */

export function HeadCrossSection({ selected, onSelect, highlight }: { selected: string | null; onSelect: (id: string) => void; highlight?: string[] }) {
  const hi = (id: string) => selected === id || (highlight?.includes(id) ?? false);
  const fillFor = (id: string, base: string) => (hi(id) ? colors.cyanBright : base);
  return (
    <View accessible accessibilityLabel={`Cross-section of the head and neck with ${ANATOMY.length} tappable structures: ${ANATOMY.map((a) => a.name).join(', ')}.`}>
      <Svg width="100%" height={300} viewBox="0 0 300 320">
        <Rect x={0} y={0} width={300} height={320} rx={10} fill="#0a0a0c" stroke={colors.hairline} />
        {/* skull + face outline (facing left) */}
        <Path d="M 250 40 C 200 5 120 5 80 30 C 45 55 40 90 38 108 L 28 118 L 40 126 L 36 146 L 46 158 L 40 176 L 60 192 C 70 200 84 205 92 218 L 96 320 L 210 320 L 212 240 C 240 210 262 150 250 40 Z" fill="#141418" stroke="#2a2a30" strokeWidth={1.5} />
        {/* nasal cavity */}
        <Path d="M 52 100 C 70 60 130 48 168 62 C 165 82 150 96 130 100 Z" fill={fillFor('nasal', '#1b2430')} opacity={hi('nasal') ? 0.55 : 1} />
        {/* hard palate */}
        <Path d="M 56 104 C 90 96 130 96 150 104" stroke={fillFor('palate', '#b9b0a0')} strokeWidth={4} fill="none" strokeLinecap="round" />
        {/* soft palate (velum) */}
        <Path d="M 150 104 C 162 108 170 118 166 130" stroke={fillFor('velum', '#c97b7b')} strokeWidth={4} fill="none" strokeLinecap="round" />
        {/* oral cavity floor + tongue */}
        <Path d="M 60 158 C 70 128 110 116 140 128 C 155 136 160 152 152 170 C 130 176 90 176 62 168 Z" fill={fillFor('tongue', '#a1524f')} opacity={hi('tongue') ? 0.7 : 1} />
        {/* teeth */}
        <Rect x={50} y={108} width={8} height={12} rx={2} fill={fillFor('teeth', '#e9e4d8')} />
        <Rect x={50} y={150} width={8} height={12} rx={2} fill={fillFor('teeth', '#e9e4d8')} />
        {/* lips */}
        <Path d="M 36 118 C 44 124 46 130 40 136 C 46 142 44 150 36 156" stroke={fillFor('lips', '#d78a80')} strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* jaw */}
        <Path d="M 46 176 C 62 196 84 202 100 200" stroke={fillFor('jaw', '#8b8b96')} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* pharynx channel */}
        <Path d="M 166 132 C 176 150 178 176 174 200 L 160 208 L 156 132 Z" fill={fillFor('pharynx', '#1f2a2f')} opacity={hi('pharynx') ? 0.55 : 1} />
        {/* larynx box + folds */}
        <Rect x={138} y={208} width={34} height={30} rx={6} fill={fillFor('larynx', '#20242b')} opacity={hi('larynx') ? 0.55 : 1} stroke="#3a3f48" />
        <Line x1={146} y1={214} x2={155} y2={232} stroke="#e0b090" strokeWidth={2.5} />
        <Line x1={164} y1={214} x2={155} y2={232} stroke="#e0b090" strokeWidth={2.5} />
        {/* trachea */}
        <Rect x={143} y={240} width={24} height={44} rx={5} fill={fillFor('trachea', '#1c2026')} opacity={hi('trachea') ? 0.55 : 1} stroke="#33383f" />
        {[248, 258, 268, 278].map((y) => <Line key={y} x1={146} y1={y} x2={164} y2={y} stroke="#33383f" />)}
        {/* lungs */}
        <Ellipse cx={128} cy={302} rx={22} ry={16} fill={fillFor('lungs', '#26313a')} opacity={hi('lungs') ? 0.55 : 1} />
        <Ellipse cx={182} cy={302} rx={22} ry={16} fill={fillFor('lungs', '#26313a')} opacity={hi('lungs') ? 0.55 : 1} />
        {/* tap targets */}
        {ANATOMY.map((a, i) => (
          <G key={a.id} onPress={() => onSelect(a.id)}>
            <Circle cx={a.x} cy={a.y} r={11} fill={selected === a.id ? colors.cyanBright : 'rgba(10,10,12,0.75)'} stroke={selected === a.id ? colors.cyanBright : colors.textMuted} strokeWidth={1} />
            <SvgText x={a.x} y={a.y + 3.5} fontSize={9.5} fill={selected === a.id ? '#000' : colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}

/* ── vocal folds ───────────────────────────────────────────────────────── */

export function VocalFolds({ voiced, reduceMotion }: { voiced: boolean; reduceMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const animate = voiced && !reduceMotion;
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setPhase((p) => (p + 0.35) % (Math.PI * 2)), 50);
    return () => clearInterval(id);
  }, [animate]);
  // gap: voiced → oscillates 0..1; unvoiced → wide open, steady
  const gap = voiced ? (animate ? Math.abs(Math.sin(phase)) : 0.5) : 1;
  const g = 6 + gap * 26;
  const W = 340, H = 130, cx = 120;
  const airY = voiced ? [] : [30, 55, 80];
  return (
    <View accessible accessibilityLabel={voiced ? 'Vocal folds vibrating: opening and closing rapidly, producing a buzz.' : 'Vocal folds held apart: air passes freely, producing only breath noise.'}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <SvgText x={cx} y={16} fontSize={9} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>LOOKING DOWN THE LARYNX</SvgText>
        <Ellipse cx={cx} cy={70} rx={62} ry={46} fill="#1a1416" stroke="#3a2c30" />
        <Path d={`M ${cx} 26 C ${cx - 14} 45 ${cx - g / 2} 60 ${cx - g / 2} 70 C ${cx - g / 2} 80 ${cx - 14} 96 ${cx} 114 C ${cx - 40} 100 ${cx - 46} 40 ${cx} 26 Z`} fill="#d9a48a" stroke="#f0c4ad" strokeWidth={1} />
        <Path d={`M ${cx} 26 C ${cx + 14} 45 ${cx + g / 2} 60 ${cx + g / 2} 70 C ${cx + g / 2} 80 ${cx + 14} 96 ${cx} 114 C ${cx + 40} 100 ${cx + 46} 40 ${cx} 26 Z`} fill="#d9a48a" stroke="#f0c4ad" strokeWidth={1} />
        {airY.map((y) => <Polyline key={y} points={`${cx - 4},${y + 10} ${cx},${y} ${cx + 4},${y + 10}`} fill="none" stroke={colors.cyanBright} strokeWidth={1.5} />)}
        {/* the resulting signal */}
        <SvgText x={210} y={16} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium}>WHAT COMES OUT</SvgText>
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
  hz, mag, ghost, band, height = 130, title, a11y,
}: {
  hz: Float64Array;
  mag: Float64Array;
  /** A second, faint spectrum drawn behind (the "clean" reference). */
  ghost?: Float64Array;
  /** Highlighted region [lo, hi] Hz. */
  band?: [number, number];
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
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{title}</Text> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {band ? <Rect x={x(band[0])} y={top - 4} width={Math.max(1, x(band[1]) - x(band[0]))} height={bottom - top + 8} fill={colors.orange} opacity={0.12} /> : null}
        {ghost
          ? Array.from(ghost, (m, i) => <Rect key={`g${i}`} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={m * (bottom - top)} fill={colors.textMuted} opacity={0.35} />)
          : null}
        {Array.from(mag, (m, i) => (
          <Rect key={i} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={Math.max(0.5, m * (bottom - top))} fill={band && hz[i] >= band[0] && hz[i] <= band[1] ? colors.orange : colors.cyanBright} opacity={0.9} />
        ))}
        {ticks.map((t) => (
          <SvgText key={t} x={x(t)} y={H - 6} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>
        ))}
        <SvgText x={W - 8} y={12} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>relative level · illustrative</SvgText>
      </Svg>
    </View>
  );
}

/* ── formant chart (linear 0–4 kHz: harmonic comb under the mouth's curve) ── */

export function FormantChart({ v, f0 = 120, height = 140 }: { v: Vowel; f0?: number; height?: number }) {
  const W = 340, H = height, top = 20, bottom = H - 20, maxHz = 4000;
  const x = (f: number) => 10 + (f / maxHz) * (W - 20);
  const env = formantEnvelope(v, 120, maxHz);
  const harm = harmonicAmplitudes(v, f0, maxHz);
  const envPts = Array.from(env.hz, (f, i) => `${x(f).toFixed(1)},${(bottom - env.mag[i] * (bottom - top)).toFixed(1)}`).join(' ');
  return (
    <View accessible accessibilityLabel={`Harmonics of a ${f0} hertz voice shaped by the mouth for ${v.sound}: peaks near ${v.f1}, ${v.f2} and ${v.f3} hertz.`}>
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
          <SvgText key={t} x={t === 0 ? 12 : t === 4000 ? W - 12 : x(t)} y={H - 6} fontSize={8} fill={colors.textMuted} textAnchor={t === 0 ? 'start' : t === 4000 ? 'end' : 'middle'} fontFamily={F}>{t === 0 ? '0 Hz' : `${t / 1000} kHz`}</SvgText>
        ))}
      </Svg>
      <Text style={{ color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11, marginTop: 4 }}>Cyan: the voice's harmonics at {f0} Hz after the mouth has shaped them. Gold: the mouth's resonance curve. Illustrative, not a measurement.</Text>
    </View>
  );
}

/* ── time trace ────────────────────────────────────────────────────────── */

export function TraceChart({ samples, height = 120, title, a11y, color = colors.cyanBright }: { samples: Float64Array; height?: number; title?: string; a11y: string; color?: string }) {
  const W = 340, H = height, mid = H / 2, amp = H / 2 - 12;
  const pts = Array.from(samples, (s, i) => `${(10 + (i / (samples.length - 1)) * (W - 20)).toFixed(1)},${(mid - s * amp).toFixed(1)}`).join(' ');
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{title}</Text> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={10} y1={mid} x2={W - 10} y2={mid} stroke="rgba(120,160,255,0.35)" />
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
        <SvgText x={W - 8} y={12} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>time → · illustrative</SvgText>
      </Svg>
    </View>
  );
}

/* ── log-frequency range bars (voices) ─────────────────────────────────── */

export function RangeBars({ ranges, loHz, hiHz, a11y }: { ranges: { name: string; lo: number; hi: number; typical: number; color: string }[]; loHz: number; hiHz: number; a11y: string }) {
  const W = 340, rowH = 30, H = 30 + ranges.length * rowH;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(loHz)) / (Math.log(hiHz) - Math.log(loHz))) * (W - 20);
  const ticks = [60, 100, 150, 200, 300, 400, 500].filter((t) => t >= loHz && t <= hiHz);
  return (
    <View accessible accessibilityLabel={a11y}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {ticks.map((t) => (
          <G key={t}>
            <Line x1={x(t)} y1={8} x2={x(t)} y2={H - 18} stroke="rgba(255,255,255,0.07)" />
            <SvgText x={x(t)} y={H - 6} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t} Hz</SvgText>
          </G>
        ))}
        {ranges.map((r, i) => {
          const y = 12 + i * rowH;
          return (
            <G key={r.name}>
              <Rect x={x(r.lo)} y={y} width={x(r.hi) - x(r.lo)} height={14} rx={7} fill={r.color} opacity={0.35} />
              <Line x1={x(r.typical)} y1={y - 2} x2={x(r.typical)} y2={y + 16} stroke={r.color} strokeWidth={2} />
              <SvgText x={x(r.lo) + 4} y={y + 24} fontSize={8.5} fill={r.color} fontFamily={F}>{r.name} · {r.lo}–{r.hi} Hz</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
