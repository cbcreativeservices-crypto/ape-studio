/**
 * SeeItView — the Ear Training Lab's "hear it, then SEE it" panel (spec §2).
 *
 * Every curve is computed from the SAME buffers the learner just heard
 * (earDsp.powerSpectrumDb / raw samples) — nothing is illustrative art.
 *
 * Colour rules (amplitude standard, src/features/tools/levelColor.ts):
 *   • anything that draws AMPLITUDE wears the ramp — the waveform lanes are
 *     filled base(blue) → tip(colour of that level), pinned to full scale in
 *     userSpaceOnUse, and the level bars climb the ramp base → tip (owner
 *     ruling 2026-08-16: the peak colour belongs at the tip, never filling
 *     the whole bar);
 *   • the spectrum and goniometer are COMPARISON overlays of 1–3 clips in
 *     relative dB — traces are identity-coded (cyan / green / gold, never
 *     red) so A and B can be told apart; no level meaning is implied.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient as RnLinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, LinearGradient, Polygon, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { powerSpectrumDb, sumToMono, isStereo, rmsDb, SR, type Buf, type Mono } from '../../../features/ear/earDsp';
import type { EarTrial, SeeIt } from '../../../features/ear/earTypes';
import { levelColor, rampColors } from '../../../features/tools/levelColor';

const W = 320;
const H = 150;
const PLOT_L = 30; // left gutter — dB ticks / lane labels
const PLOT_R = W - 6;
const PLOT_T = 6;
const PLOT_B = H - 20; // above the Hz label row
const F_LO = 40;
const F_HI = 20000;
const DB_TOP = 0;
const DB_BOT = -80;
const COLS = 200; // log-spaced columns per trace
const FFT = 4096;

// Every SvgText names a face — the platform fallback is a serif.
const AXIS_FONT = fonts.barlowCondensedMedium;
const READOUT_FONT = fonts.mono;
const LABEL_FONT = fonts.oswaldMedium;
const AXIS_PX = 8.5; // ≈ the 8.5-in-340 floor scaled to this 320 viewBox

const clampHz = (hz: number) => Math.max(F_LO, Math.min(F_HI, hz));
const xOf = (hz: number) =>
  PLOT_L + (Math.log(clampHz(hz) / F_LO) / Math.log(F_HI / F_LO)) * (PLOT_R - PLOT_L);
const yOf = (db: number) =>
  PLOT_T + ((DB_TOP - Math.max(DB_BOT, Math.min(DB_TOP, db))) / (DB_TOP - DB_BOT)) * (PLOT_B - PLOT_T);

const TRACE_COLORS = [colors.cyan, colors.green, colors.gold];

/** Ramp stops for a lane whose TOP is full scale (0 dBFS) and BOTTOM is the
 *  silence baseline — red at the top, MIDI-0 blue at the bottom. Keyed by
 *  index (duplicate-key freeze). */
const ENV_STOPS = Array.from({ length: 7 }, (_, k) => ({ offset: k / 6, color: levelColor(1 - k / 6) }));

/** Short in-plot names for the eight bands (full name drawn for the answer). */
const BAND_ABBR: Record<string, string> = {
  'Sub Bass': 'SUB', Bass: 'BASS', 'Low Mid': 'LO MID', Mid: 'MID',
  'Upper Mid': 'HI MID', Presence: 'PRES', Brilliance: 'BRILL', Air: 'AIR',
};

function mono(buf: Buf): Mono {
  return isStereo(buf) ? sumToMono(buf) : buf;
}

const clipName = (label: string) => (label === '▶' ? 'the clip' : `clip ${label}`);

/**
 * Welch-averaged, log-binned spectrum of one buffer, loudest column at −6 dB.
 * A single 4096-point periodogram of noise scatters ±5 dB per bin and reads as
 * grass — averaging up to 8 Hann frames spread across the clip (skipping the
 * edge fades) and then taking mean POWER per log column gives a trace whose
 * slope is honestly the PSD-per-Hz slope the "flat / −3 / −6 dB per octave"
 * labels refer to. Still the same samples the ear heard.
 */
function logSpectrum(x: Mono): { hz: Float32Array; db: Float32Array } {
  const usable = x.length - FFT - 960;
  const nFrames = usable > 0 ? Math.min(8, 1 + Math.floor(usable / (FFT / 2))) : 1;
  const acc = new Float64Array(FFT / 2);
  for (let f = 0; f < nFrames; f++) {
    const offset = usable > 0 ? 480 + Math.floor((f * usable) / Math.max(1, nFrames - 1)) : 0;
    const { db } = powerSpectrumDb(x, FFT, offset);
    for (let i = 0; i < acc.length; i++) acc[i] += Math.pow(10, db[i] / 10);
  }
  const binHz = SR / FFT;
  const hz = new Float32Array(COLS);
  const db = new Float32Array(COLS);
  const ratio = Math.pow(F_HI / F_LO, 1 / COLS);
  let max = -300;
  for (let c = 0; c < COLS; c++) {
    const lo = F_LO * Math.pow(ratio, c);
    const hi = lo * ratio;
    let s = 0;
    let n = 0;
    for (let i = Math.max(1, Math.ceil(lo / binHz)); i * binHz < hi && i < acc.length; i++) {
      s += acc[i];
      n++;
    }
    if (n === 0) {
      // Column narrower than a bin (the bottom octave) — take the nearest bin.
      const i = Math.max(1, Math.min(acc.length - 1, Math.round(Math.sqrt(lo * hi) / binHz)));
      s = acc[i];
      n = 1;
    }
    hz[c] = Math.sqrt(lo * hi);
    db[c] = 10 * Math.log10(s / n / nFrames + 1e-20);
    if (db[c] > max) max = db[c];
  }
  for (let c = 0; c < COLS; c++) db[c] -= max + 6;
  return { hz, db };
}

function SpectrumSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'spectrum' }>; trial: EarTrial }) {
  const traces = useMemo(() => spec.clips.map((ci) => logSpectrum(mono(trial.clips[ci].buf))), [spec, trial]);
  const points = useMemo(
    () =>
      traces.map((t) => {
        const pts: string[] = [];
        for (let c = 0; c < COLS; c++) pts.push(`${xOf(t.hz[c]).toFixed(1)},${yOf(t.db[c]).toFixed(1)}`);
        return pts.join(' ');
      }),
    [traces],
  );
  // Reference slopes anchored to the first trace's own 1 kHz level, clipped
  // analytically to the plot so a steep guide never kinks at the border.
  const guides = useMemo(() => {
    if (!spec.slopeGuides || !traces[0]) return [];
    const t = traces[0];
    let s = 0;
    let n = 0;
    for (let c = 0; c < COLS; c++) if (t.hz[c] >= 700 && t.hz[c] <= 1400) { s += t.db[c]; n++; }
    const anchor = n ? s / n : -20;
    return [0, -3, -6].map((slope) => {
      const dbAt = (f: number) => anchor + slope * Math.log2(f / 1000);
      let f1 = F_LO;
      let f2 = F_HI;
      if (slope < 0) {
        f1 = Math.max(F_LO, 1000 * Math.pow(2, (DB_TOP - anchor) / slope));
        f2 = Math.min(F_HI, 1000 * Math.pow(2, (DB_BOT - anchor) / slope));
      }
      return {
        slope,
        x1: xOf(f1), y1: yOf(dbAt(f1)), x2: xOf(f2), y2: yOf(dbAt(f2)),
        label: slope === 0 ? '0' : slope === -3 ? '−3' : '−6 dB/oct',
      };
    });
  }, [spec.slopeGuides, traces]);

  const gridHz = [63, 250, 1000, 4000, 16000];
  const dbTicks = [-20, -40, -60];
  const hi = spec.highlightHz;
  const hiBand = spec.bands?.find((b) => hi != null && hi >= b.lo && hi < b.hi);
  const a11y =
    `Spectrum of ${spec.clips.map((ci) => clipName(trial.clips[ci].label)).join(' and ')}` +
    (hiBand ? `, ${hiBand.label} band highlighted` : hi != null ? `, ${Math.round(hi)} hertz highlighted` : '') +
    (spec.slopeGuides ? ', with 0, minus 3 and minus 6 dB per octave slope guides' : '');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {spec.bands?.map((b) => {
          const x = xOf(b.lo);
          const w = Math.max(1, xOf(Math.min(b.hi, F_HI)) - x);
          const on = hiBand?.label === b.label;
          return (
            <Rect
              key={b.label}
              x={x}
              y={PLOT_T}
              width={w}
              height={PLOT_B - PLOT_T}
              fill={on ? 'rgba(55,224,95,0.14)' : 'rgba(255,255,255,0.025)'}
              stroke="rgba(255,255,255,0.06)"
            />
          );
        })}
        {hi != null && !spec.bands ? (
          <Rect
            x={xOf(hi / 1.12)}
            y={PLOT_T}
            width={Math.max(6, xOf(hi * 1.12) - xOf(hi / 1.12))}
            height={PLOT_B - PLOT_T}
            fill="rgba(55,224,95,0.14)"
          />
        ) : null}
        {dbTicks.map((d) => (
          <Line key={`d${d}`} x1={PLOT_L} y1={yOf(d)} x2={PLOT_R} y2={yOf(d)} stroke="rgba(255,255,255,0.06)" />
        ))}
        {gridHz.map((f) => (
          <Line key={f} x1={xOf(f)} y1={PLOT_T} x2={xOf(f)} y2={PLOT_B} stroke="rgba(255,255,255,0.07)" />
        ))}
        {guides.map((g) => (
          <Line key={g.slope} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="rgba(255,255,255,0.35)" strokeDasharray="4,3" />
        ))}
        {points.map((pts, i) => (
          <Polyline key={i} points={pts} fill="none" stroke={TRACE_COLORS[i % TRACE_COLORS.length]} strokeWidth={1.4} strokeLinejoin="round" />
        ))}
        {guides.map((g) => (
          <SvgText
            key={`gl${g.slope}`}
            x={g.x2 - 2}
            y={g.y2 - 3}
            fontSize={AXIS_PX}
            fontFamily={AXIS_FONT}
            fill={colors.textSub}
            textAnchor="end"
          >
            {g.label}
          </SvgText>
        ))}
        {/* Band names: abbreviations on row 1 where the region is wide enough;
            the answer band's full name on row 2 so it never collides. Both
            rows are BACKED (fleet pattern) — a pink-noise trace peaks at the
            left edge exactly where SUB / BASS sit. */}
        {spec.bands?.map((b) => {
          const x = xOf(b.lo);
          const w = xOf(Math.min(b.hi, F_HI)) - x;
          if (w < 28) return null;
          const text = BAND_ABBR[b.label] ?? b.label.toUpperCase();
          const tw = text.length * 4.6 + 6;
          return (
            <Rect key={`bb${b.label}`} x={x + w / 2 - tw / 2} y={PLOT_T + 2} width={tw} height={11} rx={2} fill="#0a0a0c" fillOpacity={0.85} />
          );
        })}
        {spec.bands?.map((b) => {
          const x = xOf(b.lo);
          const w = xOf(Math.min(b.hi, F_HI)) - x;
          if (w < 28) return null;
          return (
            <SvgText
              key={`bl${b.label}`}
              x={x + w / 2}
              y={PLOT_T + 10}
              fontSize={AXIS_PX}
              fontFamily={AXIS_FONT}
              fill={hiBand?.label === b.label ? colors.green : colors.textMuted}
              textAnchor="middle"
            >
              {BAND_ABBR[b.label] ?? b.label.toUpperCase()}
            </SvgText>
          );
        })}
        {hiBand
          ? (() => {
              const cx = Math.max(PLOT_L + 30, Math.min(PLOT_R - 30, xOf(Math.sqrt(hiBand.lo * Math.min(hiBand.hi, F_HI)))));
              const text = hiBand.label.toUpperCase();
              const tw = text.length * 6 + 8;
              return (
                <>
                  <Rect x={cx - tw / 2} y={PLOT_T + 13} width={tw} height={13} rx={2} fill="#0a0a0c" fillOpacity={0.85} />
                  <SvgText x={cx} y={PLOT_T + 23} fontSize={9.5} fontFamily={LABEL_FONT} fill={colors.green} textAnchor="middle">
                    {text}
                  </SvgText>
                </>
              );
            })()
          : null}
        {dbTicks.map((d) => (
          <SvgText key={`dt${d}`} x={PLOT_L - 3} y={yOf(d) + 3} fontSize={AXIS_PX} fontFamily={AXIS_FONT} fill={colors.textMuted} textAnchor="end">
            {d}
          </SvgText>
        ))}
        <SvgText x={2} y={H - 7} fontSize={AXIS_PX} fontFamily={AXIS_FONT} fill={colors.textMuted}>
          rel dB
        </SvgText>
        {gridHz.map((f) => (
          <SvgText key={`t${f}`} x={xOf(f)} y={H - 7} fontSize={AXIS_PX} fontFamily={AXIS_FONT} fill={colors.textMuted} textAnchor="middle">
            {f >= 1000 ? `${f / 1000}k` : `${f}`}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function WaveSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'wave' }>; trial: EarTrial }) {
  const lanes = useMemo(
    () =>
      spec.clips.map((ci) => {
        const x = mono(trial.clips[ci].buf);
        const per = Math.max(1, Math.floor(x.length / COLS));
        const peaks = new Float32Array(COLS);
        for (let c = 0; c < COLS; c++) {
          let p = 0;
          for (let i = c * per; i < (c + 1) * per && i < x.length; i++) {
            const a = Math.abs(x[i]);
            if (a > p) p = a;
          }
          peaks[c] = p;
        }
        return { label: trial.clips[ci].label, peaks, seconds: x.length / SR };
      }),
    [spec, trial],
  );
  const n = lanes.length;
  const markers = spec.markersSec ?? [];
  const top = markers.length > 1 ? 22 : 8;
  const laneH = n > 1 ? 54 : 96;
  const gap = 8;
  const lanesBottom = top + n * laneH + (n - 1) * gap;
  const Hw = lanesBottom + 24;
  const seconds = Math.max(0.1, ...lanes.map((l) => l.seconds));
  const xT = (s: number) => PLOT_L + (s / seconds) * (PLOT_R - PLOT_L);
  const step = [0.1, 0.2, 0.25, 0.5, 1, 2].find((st) => seconds / st <= 7) ?? 2;
  const ticks: number[] = [];
  for (let s = 0; s <= seconds + 1e-6; s += step) ticks.push(+s.toFixed(3));
  const deltaMs = markers.length > 1 ? Math.round((markers[1] - markers[0]) * 1000) : null;
  const a11y =
    `Peak envelope of ${lanes.map((l) => clipName(l.label)).join(' and ')}, ${seconds.toFixed(1)} seconds` +
    (deltaMs != null ? `, markers ${deltaMs} milliseconds apart` : '');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <Svg width="100%" height={Hw} viewBox={`0 0 ${W} ${Hw}`}>
        <Defs>
          {lanes.map((_, i) => {
            const laneTop = top + i * (laneH + gap);
            return (
              <LinearGradient key={i} id={`env${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={laneTop} x2="0" y2={laneTop + laneH}>
                {ENV_STOPS.map((s, k) => (
                  <Stop key={k} offset={s.offset} stopColor={s.color} />
                ))}
              </LinearGradient>
            );
          })}
        </Defs>
        <Rect x={0} y={0} width={W} height={Hw} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {lanes.map((l, i) => {
          const laneTop = top + i * (laneH + gap);
          const base = laneTop + laneH;
          const span = (PLOT_R - PLOT_L) * (l.seconds / seconds);
          const pts = [`${PLOT_L},${base}`];
          for (let c = 0; c < COLS; c++) {
            pts.push(`${(PLOT_L + ((c + 0.5) / COLS) * span).toFixed(1)},${(base - l.peaks[c] * laneH).toFixed(1)}`);
          }
          pts.push(`${(PLOT_L + span).toFixed(1)},${base}`);
          return (
            <Polygon
              key={i}
              points={pts.join(' ')}
              fill={`url(#env${i})`}
              fillOpacity={0.85}
              stroke={`url(#env${i})`}
              strokeWidth={1}
            />
          );
        })}
        {lanes.map((l, i) =>
          l.label !== '▶' ? (
            <SvgText key={`ll${i}`} x={6} y={top + i * (laneH + gap) + 12} fontSize={10} fontFamily={LABEL_FONT} fill={colors.textSub}>
              {l.label}
            </SvgText>
          ) : null,
        )}
        {markers.map((s) => (
          <Line key={s} x1={xT(s)} y1={top - 2} x2={xT(s)} y2={lanesBottom} stroke={colors.gold} strokeDasharray="3,3" />
        ))}
        {deltaMs != null ? (
          <>
            <Line x1={xT(markers[0])} y1={top - 6} x2={xT(markers[1])} y2={top - 6} stroke={colors.gold} />
            <SvgText
              x={Math.max(PLOT_L + 16, (xT(markers[0]) + xT(markers[1])) / 2)}
              y={top - 9}
              fontSize={9}
              fontFamily={READOUT_FONT}
              fill={colors.gold}
              textAnchor="middle"
            >
              {deltaMs} ms
            </SvgText>
          </>
        ) : null}
        {/* Time ruler */}
        <Line x1={PLOT_L} y1={lanesBottom + 4} x2={PLOT_R} y2={lanesBottom + 4} stroke="rgba(255,255,255,0.18)" />
        {ticks.map((t, i) => (
          <Line key={`tk${t}`} x1={xT(t)} y1={lanesBottom + 4} x2={xT(t)} y2={lanesBottom + (i % 2 === 0 ? 9 : 7)} stroke="rgba(255,255,255,0.3)" />
        ))}
        {ticks.map((t, i) => (
          <SvgText
            key={`tl${t}`}
            x={i === ticks.length - 1 ? Math.min(xT(t), PLOT_R) : xT(t)}
            y={Hw - 5}
            fontSize={AXIS_PX}
            fontFamily={READOUT_FONT}
            fill={colors.textMuted}
            textAnchor={i === ticks.length - 1 ? 'end' : 'middle'}
          >
            {i === ticks.length - 1 ? `${t} s` : `${t}`}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function GonioSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'gonio' }>; trial: EarTrial }) {
  const panes = useMemo(
    () =>
      spec.clips.slice(0, 2).map((ci) => {
        const buf = trial.clips[ci].buf;
        const l = isStereo(buf) ? buf.l : buf;
        const r = isStereo(buf) ? buf.r : buf;
        // Correlation from the same samples the ear heard.
        let lr = 0, ll = 0, rr = 0;
        for (let i = 0; i < l.length; i += 4) {
          lr += l[i] * r[i];
          ll += l[i] * l[i];
          rr += r[i] * r[i];
        }
        const corr = ll > 1e-12 && rr > 1e-12 ? lr / Math.sqrt(ll * rr) : 0;
        // Lissajous in M/S orientation: mono = vertical line, wide = cloud,
        // out-of-phase = horizontal line. Left-only content tilts to the
        // UPPER-LEFT diagonal (x = S = (R − L)/2), matching every hardware
        // goniometer's L/R corner labels.
        const pts: string[] = [];
        const step = Math.max(1, Math.floor(l.length / 1400));
        for (let i = 0; i < l.length; i += step) {
          const gx = ((r[i] - l[i]) / 2) * 3.2;
          const gy = ((l[i] + r[i]) / 2) * 3.2;
          pts.push(`${(70 + gx * 62).toFixed(1)},${(70 - gy * 62).toFixed(1)}`);
        }
        return { label: trial.clips[ci].label, corr, pts: pts.join(' ') };
      }),
    [spec, trial],
  );
  return (
    <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }}>
      {panes.map((p, i) => (
        <View
          key={i}
          style={{ alignItems: 'center', gap: 3 }}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Goniometer for ${clipName(p.label)}, correlation ${p.corr.toFixed(2)}`}
        >
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <Rect x={0} y={0} width={140} height={140} rx={10} fill="#0a0a0c" stroke={colors.hairline} />
            <Line x1={70} y1={8} x2={70} y2={132} stroke="rgba(255,255,255,0.10)" />
            <Line x1={8} y1={70} x2={132} y2={70} stroke="rgba(255,255,255,0.10)" />
            <Line x1={22} y1={22} x2={118} y2={118} stroke="rgba(255,255,255,0.06)" />
            <Line x1={118} y1={22} x2={22} y2={118} stroke="rgba(255,255,255,0.06)" />
            <Polyline points={p.pts} fill="none" stroke={TRACE_COLORS[i]} strokeWidth={0.7} opacity={0.85} />
            <SvgText x={14} y={18} fontSize={9.5} fontFamily={LABEL_FONT} fill={colors.textMuted}>L</SvgText>
            <SvgText x={126} y={18} fontSize={9.5} fontFamily={LABEL_FONT} fill={colors.textMuted} textAnchor="end">R</SvgText>
            <SvgText x={70} y={131} fontSize={AXIS_PX} fontFamily={AXIS_FONT} fill={colors.textMuted} textAnchor="middle">
              M up · S across
            </SvgText>
          </Svg>
          <Text style={styles.levelDb}>
            {p.label !== '▶' ? `${p.label} · ` : ''}corr {p.corr.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function LevelsSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'levels' }>; trial: EarTrial }) {
  const min = Math.min(...spec.bars.map((b) => b.db), -12);
  return (
    <View style={styles.levelsRow}>
      {spec.bars.map((b, i) => {
        // Bar HEIGHT charts the relative dB the learner judged. Bar COLOUR is
        // honest to the clip's REAL RMS on the meters' −60…0 dBFS window, so
        // the tip reads exactly as the app's level meters would show this
        // file — a comparison chart that never invents a level.
        const frac = Math.max(0.08, 1 - b.db / (min - 4));
        const clip = trial.clips[i];
        const real = clip ? rmsDb(mono(clip.buf)) : -20;
        const level = Math.max(0, Math.min(1, (real + 60) / 60));
        return (
          <View
            key={b.label}
            style={styles.levelCol}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${clipName(b.label)}: ${b.db.toFixed(1)} dB relative`}
          >
            <View style={styles.levelTrack}>
              <View style={[styles.levelFill, { height: `${Math.round(frac * 100)}%` }]}>
                <RnLinearGradient colors={rampColors(level)} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
              </View>
            </View>
            <Text style={styles.levelDb}>{b.db > 0 ? `+${b.db.toFixed(1)}` : b.db.toFixed(1)} dB</Text>
            <Text style={styles.levelLabel}>{b.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SeeItView({ trial }: { trial: EarTrial }) {
  const spec = trial.seeIt;
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>SEE IT</Text>
      {spec.kind === 'spectrum' ? (
        <SpectrumSeeIt spec={spec} trial={trial} />
      ) : spec.kind === 'wave' ? (
        <WaveSeeIt spec={spec} trial={trial} />
      ) : spec.kind === 'gonio' ? (
        <GonioSeeIt spec={spec} trial={trial} />
      ) : (
        <LevelsSeeIt spec={spec} trial={trial} />
      )}
      {spec.kind === 'spectrum' && spec.clips.length > 1 ? (
        <View style={styles.legendRow}>
          {spec.clips.map((ci, i) => (
            <Text key={ci} style={[styles.legend, { color: TRACE_COLORS[i % TRACE_COLORS.length] }]}>
              ▬ {trial.clips[ci].label === '▶' ? 'Clip' : trial.clips[ci].label}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.caption}>{spec.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 10 },
  eyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.5 },
  caption: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  legendRow: { flexDirection: 'row', gap: 14 },
  legend: { fontFamily: fonts.barlowMedium, fontSize: 11 },
  levelsRow: { flexDirection: 'row', gap: 22, justifyContent: 'center', paddingVertical: 6 },
  levelCol: { alignItems: 'center', gap: 3 },
  levelTrack: {
    width: 34, height: 110, borderRadius: 5, backgroundColor: '#0a0a0c',
    borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden', justifyContent: 'flex-end',
  },
  levelFill: { width: '100%', overflow: 'hidden' },
  levelDb: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12 },
  levelLabel: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11 },
});
