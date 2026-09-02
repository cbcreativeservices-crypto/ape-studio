/**
 * Drawings for the De-Esser lab: the phrase as a strip of frames (body vs
 * hiss), the detector trace with threshold + gain reduction, a spectrum with
 * the detector's band-pass curve, and the detection-path block diagram.
 * Everything is computed from deEsserModel — conceptual, labelled as such.
 */
import { Text, View } from 'react-native';
import Svg, { G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { PATH_MAIN, PATH_SIDECHAIN, type Frame, type Processed } from '../../../features/deesser/deEsserModel';

const F = fonts.barlowMedium;
const W = 340;

function Title({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{children}</Text>;
}

/* ── frame strip ───────────────────────────────────────────────────────── */

export function FrameStrip({
  frames, output, height = 130, title, a11y, highlightSibilants = true,
}: {
  frames: Frame[];
  /** Processed output; when given, the input is drawn as a ghost behind it. */
  output?: { outBody: number; outHiss: number }[];
  height?: number;
  title?: string;
  a11y: string;
  highlightSibilants?: boolean;
}) {
  const H = height, top = 16, bottom = H - 20;
  const n = frames.length, slot = (W - 20) / n, bw = slot * 0.34;
  const y = (v: number) => bottom - v * (bottom - top);
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {frames.map((f, i) => {
          const x0 = 10 + i * slot;
          const out = output?.[i];
          return (
            <G key={i}>
              {highlightSibilants && f.sibilant ? <Rect x={x0} y={top - 4} width={slot} height={bottom - top + 8} fill={colors.orange} opacity={0.08} /> : null}
              {/* body (cyan) then hiss (orange); ghosts when output is given */}
              <Rect x={x0 + slot * 0.12} y={y(f.body)} width={bw} height={Math.max(0.5, bottom - y(f.body))} fill={colors.cyanBright} opacity={out ? 0.22 : 0.9} />
              <Rect x={x0 + slot * 0.52} y={y(f.hiss)} width={bw} height={Math.max(0.5, bottom - y(f.hiss))} fill={colors.orange} opacity={out ? 0.22 : 0.9} />
              {out ? (
                <>
                  <Rect x={x0 + slot * 0.12} y={y(out.outBody)} width={bw} height={Math.max(0.5, bottom - y(out.outBody))} fill={colors.cyanBright} opacity={0.95} />
                  <Rect x={x0 + slot * 0.52} y={y(out.outHiss)} width={bw} height={Math.max(0.5, bottom - y(out.outHiss))} fill={colors.orange} opacity={0.95} />
                </>
              ) : null}
              <SvgText x={x0 + slot / 2} y={H - 7} fontSize={8.5} fill={f.sibilant ? colors.orange : colors.textSecondary} textAnchor="middle" fontFamily={f.sibilant ? fonts.oswaldMedium : F}>{f.label}</SvgText>
            </G>
          );
        })}
        <SvgText x={12} y={11} fontSize={8} fill={colors.cyanBright} fontFamily={F}>■ voice body</SvgText>
        <SvgText x={70} y={11} fontSize={8} fill={colors.orange} fontFamily={F}>■ hiss (2–10 kHz)</SvgText>
        <SvgText x={W - 8} y={11} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>relative · conceptual</SvgText>
      </Svg>
    </View>
  );
}

/* ── detector trace + gain reduction ───────────────────────────────────── */

export function DetectorTrace({ processed, thresholdDb, rangeDb, title, a11y }: { processed: Processed[]; thresholdDb: number; rangeDb: number; title?: string; a11y: string }) {
  const H = 170, topA = 16, botA = 92, topB = 104, botB = H - 18;
  const n = processed.length, plotW = W - 46, slot = plotW / n;
  const lo = -40, hi = 0;
  const yA = (db: number) => botA - ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (botA - topA);
  const yB = (gr: number) => topB + (Math.min(rangeDb, gr) / Math.max(1, rangeDb)) * (botB - topB);
  const pts = processed.map((p, i) => `${(10 + i * slot + slot / 2).toFixed(1)},${yA(p.detectorDb).toFixed(1)}`).join(' ');
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <SvgText x={12} y={11} fontSize={8} fill={colors.textMuted} fontFamily={F}>DETECTOR (hiss band level, dB)</SvgText>
        <SvgText x={10 + plotW} y={11} fontSize={8} fill={colors.gold} textAnchor="end" fontFamily={fonts.oswaldMedium}>THRESHOLD {thresholdDb.toFixed(0)} dB</SvgText>
        {[0, -10, -20, -30, -40].map((d) => (
          <G key={d}>
            <Line x1={10} y1={yA(d)} x2={10 + plotW} y2={yA(d)} stroke="rgba(255,255,255,0.06)" />
            <SvgText x={W - 10} y={yA(d) + 3} fontSize={7.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>{d}</SvgText>
          </G>
        ))}
        {processed.map((p, i) => p.detectorDb > thresholdDb ? (
          <Rect key={`o${i}`} x={10 + i * slot + 2} y={yA(p.detectorDb)} width={slot - 4} height={yA(thresholdDb) - yA(p.detectorDb)} fill={colors.orange} opacity={0.35} />
        ) : null)}
        <Polyline points={pts} fill="none" stroke={colors.cyanBright} strokeWidth={1.8} />
        <Line x1={10} y1={yA(thresholdDb)} x2={10 + plotW} y2={yA(thresholdDb)} stroke={colors.gold} strokeWidth={1.5} strokeDasharray="5,3" />
        <SvgText x={12} y={topB - 4} fontSize={8} fill={colors.textMuted} fontFamily={F}>GAIN REDUCTION (dB, downward · range {rangeDb}) · conceptual</SvgText>
        <Line x1={10} y1={topB} x2={10 + plotW} y2={topB} stroke="rgba(255,255,255,0.18)" />
        <SvgText x={W - 10} y={topB + 4} fontSize={7.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>0</SvgText>
        <SvgText x={W - 10} y={botB + 2} fontSize={7.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>-{rangeDb}</SvgText>
        {processed.map((p, i) => p.grDb > 0 ? (
          <G key={`g${i}`}>
            <Rect x={10 + i * slot + slot * 0.2} y={topB} width={slot * 0.6} height={yB(p.grDb) - topB} fill={colors.red} opacity={0.85} />
            <SvgText x={10 + i * slot + slot / 2} y={Math.min(botB - 1, yB(p.grDb) + 9)} fontSize={7.5} fill={colors.red} textAnchor="middle" fontFamily={F}>-{p.grDb.toFixed(0)}</SvgText>
          </G>
        ) : null)}
        {processed.map((p, i) => <SvgText key={`l${i}`} x={10 + i * slot + slot / 2} y={H - 6} fontSize={8} fill={p.frame.sibilant ? colors.orange : colors.textSecondary} textAnchor="middle" fontFamily={F}>{p.frame.label}</SvgText>)}
      </Svg>
    </View>
  );
}

/* ── spectrum with the detector band ───────────────────────────────────── */

export function BandSpectrum({
  hz, mag, ghost, curve, band, title, a11y, height = 140,
}: {
  hz: Float64Array;
  mag: Float64Array;
  ghost?: Float64Array;
  /** Detector band-pass response 0..1 on the same hz grid. */
  curve?: Float64Array;
  band?: [number, number];
  title?: string;
  a11y: string;
  height?: number;
}) {
  const H = height, top = 18, bottom = H - 20;
  const n = hz.length;
  const lo = hz[0] * 0.9, hi = hz[n - 1] * 1.1;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 20);
  const bw = (W - 20) / n;
  const ticks = [200, 500, 1000, 2000, 5000, 10000].filter((t) => t > lo && t < hi);
  const curvePts = curve ? Array.from(curve, (m, i) => `${(10 + i * bw + bw / 2).toFixed(1)},${(bottom - m * (bottom - top)).toFixed(1)}`).join(' ') : '';
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {band ? <Rect x={x(band[0])} y={top - 4} width={Math.max(1, x(band[1]) - x(band[0]))} height={bottom - top + 8} fill={colors.orange} opacity={0.1} /> : null}
        {ghost ? Array.from(ghost, (m, i) => <Rect key={`g${i}`} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={m * (bottom - top)} fill={colors.textMuted} opacity={0.35} />) : null}
        {Array.from(mag, (m, i) => <Rect key={i} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={Math.max(0.5, m * (bottom - top))} fill={hz[i] >= 2000 && hz[i] <= 10000 ? colors.orange : colors.cyanBright} opacity={0.9} />)}
        {curve ? <Polyline points={curvePts} fill="none" stroke={colors.gold} strokeWidth={1.8} strokeDasharray="4,3" /> : null}
        {ticks.map((t) => <SvgText key={t} x={x(t)} y={H - 6} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>)}
        <SvgText x={W - 8} y={12} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>{curve ? 'gold dashed: what the detector hears · ' : ''}relative · conceptual</SvgText>
      </Svg>
    </View>
  );
}

/* ── detection-path block diagram ──────────────────────────────────────── */

export function PathDiagram({ active, onSelect, mode }: { active: string | null; onSelect: (id: string) => void; mode: 'broadband' | 'split' }) {
  const H = 150;
  const box = (id: string, x: number, y: number, w: number, label: string, tone: string) => {
    const on = active === id;
    return (
      <G key={id} onPress={() => onSelect(id)}>
        <Rect x={x} y={y} width={w} height={30} rx={7} fill={on ? tone : '#141418'} stroke={tone} strokeWidth={on ? 2 : 1} />
        <SvgText x={x + w / 2} y={y + 19} fontSize={8.5} fill={on ? '#000' : colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>
      </G>
    );
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number, c: string, dashed = false) => (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1.5} strokeDasharray={dashed ? '3,3' : undefined} />
      <Path d={`M ${x2} ${y2} l -6 -3.5 l 0 7 z`} fill={c} transform={y1 === y2 ? undefined : `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI} ${x2} ${y2})`} />
    </G>
  );
  const main = PATH_MAIN, sc = PATH_SIDECHAIN;
  return (
    <View accessible accessibilityLabel={`Block diagram. Main path: ${main.map((b) => b.name).join(', ')}. Side chain from the input: ${sc.map((b) => b.name).join(', ')}, controlling the gain element. Tap a block to read what it does.`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <SvgText x={12} y={14} fontSize={8} fill={colors.textMuted} fontFamily={F}>MAIN PATH (the voice)</SvgText>
        {box('in', 14, 24, 60, main[0].name, colors.cyanBright)}
        {arrow(74, 39, 128, 39, colors.cyanBright)}
        {box('gain', 130, 24, 96, mode === 'split' ? 'gain · hiss band' : 'gain · whole', colors.cyanBright)}
        {arrow(226, 39, 266, 39, colors.cyanBright)}
        {box('out', 268, 24, 58, main[2].name, colors.cyanBright)}
        <SvgText x={58} y={86} fontSize={8} fill={colors.textMuted} fontFamily={F}>SIDE CHAIN (what it listens to)</SvgText>
        {arrow(44, 54, 44, 92, colors.gold, true)}
        {box('bpf', 14, 94, 72, 'band-pass', colors.gold)}
        {arrow(86, 109, 96, 109, colors.gold)}
        {box('det', 98, 94, 64, 'detector', colors.gold)}
        {arrow(162, 109, 172, 109, colors.gold)}
        {box('thr', 174, 94, 68, 'threshold', colors.gold)}
        {arrow(242, 109, 252, 109, colors.gold)}
        {box('gc', 254, 94, 72, 'gain comp.', colors.gold)}
        {/* control line back up into the gain element */}
        <Polyline points="290,94 290,72 178,72 178,56" fill="none" stroke={colors.gold} strokeWidth={1.5} strokeDasharray="3,3" />
        <Path d="M 178 54 l -3.5 6 l 7 0 z" fill={colors.gold} />
        <SvgText x={234} y={68} fontSize={7.5} fill={colors.gold} textAnchor="middle" fontFamily={F}>control: “turn down by N dB”</SvgText>
      </Svg>
    </View>
  );
}
