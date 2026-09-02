/**
 * Drawings for the De-Esser lab: the phrase as a strip of frames (body vs
 * hiss), a per-frame hiss-band level strip in dB, the detector trace with
 * threshold + gain reduction, a spectrum with the detector's band-pass
 * curve, and the detection-path block diagram.
 * Everything is computed from deEsserModel — conceptual, labelled as such.
 *
 * Colour roles, held constant across every drawing so the colour itself
 * teaches (review 2026-09-02):
 *   cyan   = the voice body and the main signal path
 *   orange = hiss-band energy, the excess above threshold, and the gain
 *            reduction that removes it — always labelled as REDUCTION, never
 *            as a level (red is reserved for clipping app-wide)
 *   gold   = the control domain: threshold, detector band-pass, side chain
 * Every SvgText carries a fontFamily; nothing below 8.5 in the 340 viewBox.
 */
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { PATH_MAIN, PATH_SIDECHAIN, toDb, type Frame, type Processed } from '../../../features/deesser/deEsserModel';

const F = fonts.barlowMedium;
const W = 340;
const PANEL = '#0a0a0c';
const GRID = 'rgba(255,255,255,0.06)';
/** Invisible but hit-testable fill for enlarged SVG tap zones (fill="none"
 *  receives no touches on native or web). */
const HIT = { fill: '#000', opacity: 0.01 } as const;

function Title({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 }}>{children}</Text>;
}
function Caption({ children }: { children: string }) {
  return <Text style={{ color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 15 }}>{children}</Text>;
}

/* ── frame strip ───────────────────────────────────────────────────────── */

export function FrameStrip({
  frames, output, height = 130, title, a11y, selected, onSelect,
}: {
  frames: Frame[];
  /** Processed output; when given, the input is drawn as a ghost behind it. */
  output?: { outBody: number; outHiss: number }[];
  height?: number;
  title?: string;
  a11y: string;
  /** Outlines one frame — the one whose spectrum is shown below. */
  selected?: number;
  /** Makes each frame column tappable. */
  onSelect?: (i: number) => void;
}) {
  const H = height, top = 20, bottom = H - 20;
  const n = frames.length, slot = (W - 20) / n, bw = slot * 0.34;
  const y = (v: number) => bottom - v * (bottom - top);
  const bar = (x: number, v: number, fill: string, opacity: number) => (
    <Rect x={x} y={y(v)} width={bw} height={Math.max(0.5, bottom - y(v))} fill={fill} opacity={opacity} />
  );
  return (
    <View style={{ gap: 4 }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={PANEL} stroke={colors.hairline} />
        {frames.map((f, i) => {
          const x0 = 10 + i * slot;
          const out = output?.[i];
          const isSel = selected === i;
          const xBody = x0 + slot * 0.12, xHiss = x0 + slot * 0.52;
          const inner = (
            <>
              {f.sibilant ? <Rect x={x0} y={top - 5} width={slot} height={bottom - top + 9} fill={colors.orange} opacity={0.08} /> : null}
              {isSel ? <Rect x={x0 + 0.75} y={top - 6} width={slot - 1.5} height={bottom - top + 11} rx={3} fill="none" stroke={colors.cyanBright} strokeWidth={1.2} /> : null}
              {/* body (cyan) then hiss (orange); ghosts when output is given */}
              {bar(xBody, f.body, colors.cyanBright, out ? 0.22 : 0.9)}
              {bar(xHiss, f.hiss, colors.orange, out ? 0.22 : 0.9)}
              {out ? bar(xBody, out.outBody, colors.cyanBright, 0.95) : null}
              {out ? bar(xHiss, out.outHiss, colors.orange, 0.95) : null}
              <SvgText x={x0 + slot / 2} y={H - 7} fontSize={isSel ? 9.5 : 8.5} fill={isSel ? colors.textPrimary : f.sibilant ? colors.orange : colors.textSecondary} textAnchor="middle" fontFamily={f.sibilant ? fonts.oswaldMedium : F}>{f.label}</SvgText>
              {onSelect ? <Rect x={x0} y={0} width={slot} height={H} {...HIT} /> : null}
            </>
          );
          return onSelect ? <G key={i} onPress={() => onSelect(i)}>{inner}</G> : <G key={i}>{inner}</G>;
        })}
        <SvgText x={12} y={12} fontSize={8.5} fill={colors.cyanBright} fontFamily={F}>■ voice body</SvgText>
        <SvgText x={76} y={12} fontSize={8.5} fill={colors.orange} fontFamily={F}>■ hiss band (2–10 kHz)</SvgText>
        <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>relative · conceptual</SvgText>
      </Svg>
    </View>
  );
}

/* ── hiss-band level per frame, in dB ──────────────────────────────────── */

/** The same frames on a dB scale: an 8 dB loss is the same height on a
 *  vowel as on an S, which is what makes "the EQ dulls the vowels too"
 *  visible (on the linear strip a vowel's hiss is a few pixels tall). */
export function HissDbStrip({
  frames, output, title, a11y, height = 124,
}: {
  frames: Frame[];
  output: { outHiss: number }[];
  title?: string;
  a11y: string;
  height?: number;
}) {
  const H = height, top = 26, bottom = H - 20;
  const n = frames.length, plotW = W - 46, slot = plotW / n;
  const lo = -40, hi = 0;
  const y = (db: number) => bottom - ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (bottom - top);
  return (
    <View style={{ gap: 4 }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={PANEL} stroke={colors.hairline} />
        <SvgText x={12} y={12} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>HISS-BAND LEVEL · dB (0 = loudest S) · input as ghost · conceptual</SvgText>
        {[0, -10, -20, -30, -40].map((d) => (
          <G key={d}>
            <Line x1={10} y1={y(d)} x2={10 + plotW} y2={y(d)} stroke={GRID} />
            <SvgText x={W - 10} y={y(d) + 3} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>{d}</SvgText>
          </G>
        ))}
        {frames.map((f, i) => {
          const x0 = 10 + i * slot, bw = slot * 0.56, xb = x0 + (slot - bw) / 2;
          const inDb = toDb(f.hiss), outDb = toDb(output[i].outHiss);
          const loss = inDb - outDb;
          return (
            <G key={i}>
              <Rect x={xb} y={y(inDb)} width={bw} height={Math.max(0.5, bottom - y(inDb))} fill={colors.orange} opacity={0.22} />
              <Rect x={xb} y={y(outDb)} width={bw} height={Math.max(0.5, bottom - y(outDb))} fill={colors.orange} opacity={0.95} />
              {loss > 0.5 ? <SvgText x={x0 + slot / 2} y={y(inDb) - 3} fontSize={8.5} fill={colors.orange} textAnchor="middle" fontFamily={F}>−{loss.toFixed(0)}</SvgText> : null}
              <SvgText x={x0 + slot / 2} y={H - 7} fontSize={8.5} fill={f.sibilant ? colors.orange : colors.textSecondary} textAnchor="middle" fontFamily={f.sibilant ? fonts.oswaldMedium : F}>{f.label}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ── detector trace + gain reduction ───────────────────────────────────── */

export function DetectorTrace({ processed, thresholdDb, rangeDb, title, a11y }: { processed: Processed[]; thresholdDb: number; rangeDb: number; title?: string; a11y: string }) {
  const H = 178, topA = 20, botA = 94, topB = 110, botB = H - 20;
  const n = processed.length, plotW = W - 46, slot = plotW / n;
  const lo = -40, hi = 0;
  const yA = (db: number) => botA - ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (botA - topA);
  const yB = (gr: number) => topB + (Math.min(rangeDb, gr) / Math.max(1, rangeDb)) * (botB - topB);
  const cx = (i: number) => 10 + i * slot + slot / 2;
  const pts = processed.map((p, i) => `${cx(i).toFixed(1)},${yA(p.detectorDb).toFixed(1)}`).join(' ');
  const thrY = yA(thresholdDb);
  // The threshold label rides its own line; flips below it near the top edge.
  const thrLabelY = thrY - 4 < topA + 4 ? thrY + 10 : thrY - 4;
  return (
    <View style={{ gap: 4 }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={PANEL} stroke={colors.hairline} />
        <SvgText x={12} y={12} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>DETECTOR · hiss-band level, dB (0 = loudest S)</SvgText>
        {[0, -10, -20, -30, -40].map((d) => (
          <G key={d}>
            <Line x1={10} y1={yA(d)} x2={10 + plotW} y2={yA(d)} stroke={GRID} />
            <SvgText x={W - 10} y={yA(d) + 3} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>{d}</SvgText>
          </G>
        ))}
        {/* the excess above threshold — the part the gain computer acts on */}
        {processed.map((p, i) => p.detectorDb > thresholdDb ? (
          <Rect key={`o${i}`} x={10 + i * slot + 2} y={yA(p.detectorDb)} width={slot - 4} height={thrY - yA(p.detectorDb)} fill={colors.orange} opacity={0.35} />
        ) : null)}
        <Polyline points={pts} fill="none" stroke={colors.cyanBright} strokeWidth={1.8} />
        <Line x1={10} y1={thrY} x2={10 + plotW} y2={thrY} stroke={colors.gold} strokeWidth={1.5} strokeDasharray="5,3" />
        <SvgText x={10 + plotW - 2} y={thrLabelY} fontSize={8.5} fill={colors.gold} textAnchor="end" fontFamily={fonts.oswaldMedium}>THRESHOLD {thresholdDb.toFixed(0)} dB</SvgText>
        <SvgText x={12} y={topB - 6} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>GAIN REDUCTION · dB, drawn downward · range {rangeDb} · conceptual</SvgText>
        <Line x1={10} y1={topB} x2={10 + plotW} y2={topB} stroke="rgba(255,255,255,0.18)" />
        <SvgText x={W - 10} y={topB + 4} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>0</SvgText>
        <SvgText x={W - 10} y={botB + 3} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>−{rangeDb}</SvgText>
        {processed.map((p, i) => {
          if (p.grDb <= 0) return null;
          const tip = yB(p.grDb);
          const below = tip + 10 <= botB; // label under the bar tip, else inside the bar
          return (
            <G key={`g${i}`}>
              <Rect x={10 + i * slot + slot * 0.2} y={topB} width={slot * 0.6} height={tip - topB} fill={colors.orange} opacity={0.85} />
              <SvgText x={cx(i)} y={below ? tip + 9 : tip - 3} fontSize={8.5} fill={below ? colors.orange : '#000'} textAnchor="middle" fontFamily={F}>−{p.grDb.toFixed(0)}</SvgText>
            </G>
          );
        })}
        {processed.map((p, i) => <SvgText key={`l${i}`} x={cx(i)} y={H - 7} fontSize={8.5} fill={p.frame.sibilant ? colors.orange : colors.textSecondary} textAnchor="middle" fontFamily={p.frame.sibilant ? fonts.oswaldMedium : F}>{p.frame.label}</SvgText>)}
      </Svg>
    </View>
  );
}

/* ── spectrum with the detector band ───────────────────────────────────── */

export function BandSpectrum({
  hz, mag, ghost, curve, band, title, caption, a11y, height = 140,
}: {
  hz: Float64Array;
  mag: Float64Array;
  ghost?: Float64Array;
  /** Detector band-pass response 0..1 on the same hz grid. */
  curve?: Float64Array;
  band?: [number, number];
  title?: string;
  /** Plain-text legend under the chart (kept out of the SVG so it cannot collide). */
  caption?: string;
  a11y: string;
  height?: number;
}) {
  const H = height, top = 20, bottom = H - 20;
  const n = hz.length;
  // Axis derived from the model's own log grid, so ticks and the band land
  // exactly on the bar centres rather than on a slightly different scale.
  const logStep = (Math.log(hz[n - 1]) - Math.log(hz[0])) / Math.max(1, n - 1);
  const lo = Math.exp(Math.log(hz[0]) - logStep / 2), hi = Math.exp(Math.log(hz[n - 1]) + logStep / 2);
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 20);
  const bw = (W - 20) / n;
  const ticks = [200, 500, 1000, 2000, 5000, 10000].filter((t) => t > lo && t < hi);
  const curvePts = curve ? Array.from(curve, (m, i) => `${(10 + i * bw + bw / 2).toFixed(1)},${(bottom - m * (bottom - top)).toFixed(1)}`).join(' ') : '';
  return (
    <View style={{ gap: 4 }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      {title ? <Title>{title}</Title> : null}
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={PANEL} stroke={colors.hairline} />
        {band ? <Rect x={x(band[0])} y={top - 4} width={Math.max(1, x(band[1]) - x(band[0]))} height={bottom - top + 8} fill={colors.orange} opacity={0.1} /> : null}
        {ghost ? Array.from(ghost, (m, i) => <Rect key={`g${i}`} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={m * (bottom - top)} fill={colors.textMuted} opacity={0.35} />) : null}
        {Array.from(mag, (m, i) => <Rect key={i} x={10 + i * bw + 0.5} y={bottom - m * (bottom - top)} width={Math.max(1, bw - 1)} height={Math.max(0.5, m * (bottom - top))} fill={hz[i] >= 2000 && hz[i] <= 10000 ? colors.orange : colors.cyanBright} opacity={0.9} />)}
        {curve ? <Polyline points={curvePts} fill="none" stroke={colors.gold} strokeWidth={1.8} strokeDasharray="4,3" /> : null}
        {ticks.map((t) => <SvgText key={t} x={x(t)} y={H - 6} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>)}
        <SvgText x={12} y={12} fontSize={8.5} fill={colors.cyanBright} fontFamily={F}>■ voice body</SvgText>
        <SvgText x={76} y={12} fontSize={8.5} fill={colors.orange} fontFamily={F}>■ hiss region 2–10 kHz</SvgText>
        <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>relative · conceptual</SvgText>
      </Svg>
      {caption ? <Caption>{caption}</Caption> : null}
    </View>
  );
}

/* ── detection-path block diagram ──────────────────────────────────────── */

/** Signal-flow drawing: solid = audio (cyan main path, gold side-chain
 *  copy), dashed = control. One arrowhead shape, always rotated to the line.
 *  Boxes are 30 px tall; an invisible zone extends every box to ~46 px so
 *  the tap target meets 44 pt at phone width. */
export function PathDiagram({ active, onSelect, mode }: { active: string | null; onSelect: (id: string) => void; mode: 'broadband' | 'split' }) {
  const H = 160, BH = 30;
  const cyan = colors.cyanBright, gold = colors.gold;
  const box = (id: string, x: number, y: number, w: number, label: string, tone: string) => {
    const on = active === id;
    return (
      <G key={id} onPress={() => onSelect(id)}>
        <Rect x={x - 4} y={y - 8} width={w + 8} height={BH + 16} {...HIT} />
        <Rect x={x} y={y} width={w} height={BH} rx={7} fill={on ? tone : '#141418'} stroke={tone} strokeWidth={on ? 2 : 1} />
        <SvgText x={x + w / 2} y={y + 19} fontSize={8.5} fill={on ? '#000' : colors.textPrimary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{label.toUpperCase()}</SvgText>
      </G>
    );
  };
  const head = (x: number, y: number, deg: number, c: string) => <Path d={`M ${x} ${y} l -7 -3.5 l 0 7 z`} fill={c} transform={`rotate(${deg} ${x} ${y})`} />;
  const arrow = (x1: number, y1: number, x2: number, y2: number, c: string) => (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1.5} />
      {head(x2, y2, (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI, c)}
    </G>
  );
  const main = PATH_MAIN, sc = PATH_SIDECHAIN;
  const name = (id: string) => [...main, ...sc].find((b) => b.id === id)?.name ?? id;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Signal-flow diagram. Main path: ${main.map((b) => b.name).join(', then ')}. A copy of the input feeds the side chain: ${sc.map((b) => b.name).join(', then ')}; the gain computer's control line sets the gain element. Use the Next Block button to read each block.`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={PANEL} stroke={colors.hairline} />
        <SvgText x={12} y={15} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>MAIN PATH · the voice</SvgText>
        {/* main path — solid cyan */}
        {box('in', 12, 24, 48, name('in'), cyan)}
        {arrow(60, 39, 100, 39, cyan)}
        <Circle cx={76} cy={39} r={2.6} fill={cyan} />
        {box('gain', 100, 24, 110, mode === 'split' ? 'gain · hiss band' : 'gain · whole voice', cyan)}
        {arrow(210, 39, 266, 39, cyan)}
        {box('out', 266, 24, 60, name('out'), cyan)}
        {/* side-chain tap from the junction: a COPY of the voice, so solid (audio) */}
        {arrow(76, 42, 76, 104, gold)}
        <SvgText x={82} y={68} fontSize={8.5} fill={gold} fontFamily={F}>copy of the voice</SvgText>
        {/* control line back into the gain element: dashed (control, not audio) */}
        <Polyline points="296,104 296,80 155,80 155,58" fill="none" stroke={gold} strokeWidth={1.5} strokeDasharray="3,3" />
        {head(155, 54, -90, gold)}
        <SvgText x={225} y={76} fontSize={8.5} fill={gold} textAnchor="middle" fontFamily={F}>control · turn down N dB</SvgText>
        {/* side chain — solid gold */}
        {box('bpf', 44, 104, 64, 'band-pass', gold)}
        {arrow(108, 119, 122, 119, gold)}
        {box('det', 122, 104, 56, 'detector', gold)}
        {arrow(178, 119, 192, 119, gold)}
        {box('thr', 192, 104, 60, 'threshold', gold)}
        {arrow(252, 119, 266, 119, gold)}
        {box('gc', 266, 104, 60, 'gain comp.', gold)}
        <SvgText x={12} y={151} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>SIDE CHAIN · what it listens to</SvgText>
      </Svg>
    </View>
  );
}
