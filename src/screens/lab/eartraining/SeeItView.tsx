/**
 * SeeItView — the Ear Training Lab's "hear it, then SEE it" panel (spec §2).
 *
 * Every curve is computed from the SAME buffers the learner just heard
 * (earDsp.powerSpectrumDb / raw samples) — nothing is illustrative art.
 * Level bars are the one visual that wears the app amplitude ramp.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { powerSpectrumDb, sumToMono, isStereo, type Buf } from '../../../features/ear/earDsp';
import type { EarTrial, SeeIt } from '../../../features/ear/earTypes';
import { levelColorForDb } from '../../../features/tools/levelColor';

const W = 320;
const H = 150;
const F_LO = 40;
const F_HI = 20000;
const DB_TOP = 0;
const DB_BOT = -80;

const xOf = (hz: number) =>
  ((Math.log(Math.max(F_LO, Math.min(F_HI, hz)) / F_LO) / Math.log(F_HI / F_LO)) * (W - 34)) + 30;
const yOf = (db: number) =>
  ((DB_TOP - Math.max(DB_BOT, Math.min(DB_TOP, db))) / (DB_TOP - DB_BOT)) * (H - 26) + 6;

const TRACE_COLORS = [colors.cyan, colors.green, colors.gold];

function mono(buf: Buf) {
  return isStereo(buf) ? sumToMono(buf) : buf;
}

function SpectrumSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'spectrum' }>; trial: EarTrial }) {
  const traces = useMemo(
    () =>
      spec.clips.map((ci) => {
        const { freqs, db } = powerSpectrumDb(mono(trial.clips[ci].buf), 4096);
        // Normalize the loudest bin to −6 so traces share the window.
        let max = -200;
        for (let i = 1; i < db.length; i++) if (db[i] > max) max = db[i];
        const pts: string[] = [];
        for (let i = 1; i < freqs.length; i++) {
          if (freqs[i] < F_LO || freqs[i] > F_HI) continue;
          pts.push(`${xOf(freqs[i]).toFixed(1)},${yOf(db[i] - max - 6).toFixed(1)}`);
        }
        return pts.join(' ');
      }),
    [spec, trial],
  );
  const gridHz = [63, 250, 1000, 4000, 16000];
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      {spec.bands?.map((b) => (
        <Rect
          key={b.label}
          x={xOf(b.lo)}
          y={6}
          width={Math.max(1, xOf(Math.min(b.hi, F_HI)) - xOf(b.lo))}
          height={H - 26}
          fill={spec.highlightHz != null && spec.highlightHz >= b.lo && spec.highlightHz < b.hi ? 'rgba(55,224,95,0.14)' : 'rgba(255,255,255,0.025)'}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}
      {spec.highlightHz != null && !spec.bands ? (
        <Rect
          x={xOf(spec.highlightHz / 1.12)}
          y={6}
          width={Math.max(6, xOf(spec.highlightHz * 1.12) - xOf(spec.highlightHz / 1.12))}
          height={H - 26}
          fill="rgba(55,224,95,0.14)"
        />
      ) : null}
      {gridHz.map((f) => (
        <Line key={f} x1={xOf(f)} y1={6} x2={xOf(f)} y2={H - 20} stroke="rgba(255,255,255,0.07)" />
      ))}
      {traces.map((pts, i) => (
        <Polyline key={i} points={pts} fill="none" stroke={TRACE_COLORS[i % TRACE_COLORS.length]} strokeWidth={1.4} />
      ))}
      {gridHz.map((f) => (
        <SvgText key={`t${f}`} x={xOf(f)} y={H - 8} fontSize={8} fill={colors.textMuted} textAnchor="middle">
          {f >= 1000 ? `${f / 1000}k` : `${f}`}
        </SvgText>
      ))}
    </Svg>
  );
}

function WaveSeeIt({ spec, trial }: { spec: Extract<SeeIt, { kind: 'wave' }>; trial: EarTrial }) {
  const traces = useMemo(
    () =>
      spec.clips.map((ci) => {
        const x = mono(trial.clips[ci].buf);
        const cols = 240;
        const per = Math.max(1, Math.floor(x.length / cols));
        const pts: string[] = [];
        for (let c = 0; c < cols; c++) {
          let peak = 0;
          for (let i = c * per; i < (c + 1) * per && i < x.length; i++) {
            const a = Math.abs(x[i]);
            if (a > peak) peak = a;
          }
          pts.push(`${(30 + (c / cols) * (W - 36)).toFixed(1)},${(H / 2 - 8 - peak * (H / 2 - 16)).toFixed(1)}`);
        }
        return { pts: pts.join(' '), seconds: x.length / 48000 };
      }),
    [spec, trial],
  );
  const seconds = traces[0]?.seconds ?? 1;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      <Line x1={30} y1={H / 2 - 8} x2={W - 6} y2={H / 2 - 8} stroke="rgba(255,255,255,0.12)" />
      {traces.map((t, i) => (
        <Polyline key={i} points={t.pts} fill="none" stroke={TRACE_COLORS[i % TRACE_COLORS.length]} strokeWidth={1.3} />
      ))}
      {spec.markersSec?.map((s) => (
        <Line
          key={s}
          x1={30 + (s / seconds) * (W - 36)}
          y1={10}
          x2={30 + (s / seconds) * (W - 36)}
          y2={H - 18}
          stroke={colors.gold}
          strokeDasharray="3,3"
        />
      ))}
      <SvgText x={W - 8} y={H - 6} fontSize={8} fill={colors.textMuted} textAnchor="end">
        {seconds.toFixed(1)} s
      </SvgText>
    </Svg>
  );
}

function LevelsSeeIt({ spec }: { spec: Extract<SeeIt, { kind: 'levels' }> }) {
  const min = Math.min(...spec.bars.map((b) => b.db), -12);
  return (
    <View style={styles.levelsRow}>
      {spec.bars.map((b) => {
        const frac = Math.max(0.08, 1 - b.db / (min - 4));
        return (
          <View key={b.label} style={styles.levelCol}>
            <View style={styles.levelTrack}>
              <View
                style={[
                  styles.levelFill,
                  // Bars sit in the ramp's healthy band (loudest ≈ −10 dBFS):
                  // these are moderate playback levels, not clipping — red
                  // would lie on the amplitude standard.
                  { height: `${Math.round(frac * 100)}%`, backgroundColor: levelColorForDb(b.db - 10, -24, 0) },
                ]}
              />
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
      ) : (
        <LevelsSeeIt spec={spec} />
      )}
      <View style={styles.legendRow}>
        {spec.kind !== 'levels'
          ? spec.clips.map((ci, i) => (
              <Text key={ci} style={[styles.legend, { color: TRACE_COLORS[i % TRACE_COLORS.length] }]}>
                ▬ {trial.clips[ci].label === '▶' ? 'Clip' : trial.clips[ci].label}
              </Text>
            ))
          : null}
      </View>
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
  levelFill: { width: '100%' },
  levelDb: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 12 },
  levelLabel: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11 },
});
