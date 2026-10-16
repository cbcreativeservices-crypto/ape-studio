/**
 * ModularSpectrum — "what the filter leaves" for the Modular Synth Lab
 * (lab-art fix 2026-10-16: the graded lab had only the patch diagram — no
 * picture of the RESULT).
 *
 * A line spectrum of the steady voice, COMPUTED from the patch (never a
 * stylized drawing): the VCO's harmonics at n × f₀ with the textbook series
 * of its waveform (saw 1/n · square odd 1/n · triangle odd 1/n² · sine the
 * fundamental only), then the same harmonics after the engine's own filter —
 * the 2-pole state-variable low-pass of Modular.hpp, damping k = 2 − 1.6·res,
 * |H(f)| = 1 / √((1 − x²)² + (k·x)²), x = f / cutoff. Levels are dB relative
 * to the unfiltered fundamental. It is the steady tone at the CUTOFF knob,
 * before the envelope or LFO move anything and before the soft output stage
 * — the caption says so. Text ≥ 9 pt.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { harmonicAmp, svfLowpassMag } from './spectrumMath';

const F_LO = 50;
const F_HI = 12000;
const DB_FLOOR = -48; // the scale runs +12 (a resonant peak) … −48 dB

const toDb = (a: number) => (a > 0 ? 20 * Math.log10(a) : -Infinity);

export function ModularSpectrum({
  shape,
  f0,
  cutoff,
  res,
  cutLabel,
}: {
  shape: number;
  f0: number;
  cutoff: number;
  res: number;
  /** The cutoff as the lab prints it ("2.0 kHz"). */
  cutLabel: string;
}) {
  const [w, setW] = useState(0);
  const H = 138;
  const padL = 30;
  const padR = 8;
  const padT = 14;
  const padB = 18;
  const gw = Math.max(10, w - padL - padR);
  const gh = H - padT - padB;
  const xOf = (f: number) => padL + (gw * Math.log(f / F_LO)) / Math.log(F_HI / F_LO);
  const yOf = (db: number) => padT + (gh * (12 - Math.max(DB_FLOOR, Math.min(12, db)))) / (12 - DB_FLOOR);
  const y0 = yOf(0);

  const lines: { x: number; raw: number; out: number }[] = [];
  for (let n = 1; n * f0 <= F_HI; n++) {
    const a = harmonicAmp(shape, n);
    if (a <= 0) continue;
    const f = n * f0;
    const raw = toDb(a);
    lines.push({ x: xOf(f), raw, out: raw + toDb(svfLowpassMag(f, cutoff, res)) });
  }
  let curve = '';
  for (let i = 0; i <= 90; i++) {
    const f = F_LO * Math.pow(F_HI / F_LO, i / 90);
    curve += `${i ? 'L' : 'M'}${xOf(f).toFixed(1)} ${yOf(toDb(svfLowpassMag(f, cutoff, res))).toFixed(1)} `;
  }
  const xc = xOf(Math.max(F_LO, Math.min(F_HI, cutoff)));

  return (
    <View style={{ gap: 4 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
        {w > 0 ? (
          <Svg width={w} height={H} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Rect x={0} y={0} width={w} height={H} rx={8} fill="#0d0d11" stroke="#26262e" strokeWidth={1} />
            {/* dB grid */}
            {[0, -24, -48].map((db) => (
              <Line key={db} x1={padL} y1={yOf(db)} x2={w - padR} y2={yOf(db)} stroke="#2c2c35" strokeWidth={0.8} />
            ))}
            {[0, -24, -48].map((db) => (
              <SvgText key={`t${db}`} x={padL - 4} y={yOf(db) + 3} fill={colors.textMuted} fontSize={9} fontFamily={fonts.barlowCondensedMedium} textAnchor="end">
                {db === 0 ? '0 dB' : `${db}`}
              </SvgText>
            ))}
            {/* frequency axis */}
            {[100, 1000, 10000].map((f) => (
              <SvgText key={f} x={xOf(f)} y={H - 5} fill={colors.textMuted} fontSize={9} fontFamily={fonts.barlowCondensedMedium} textAnchor="middle">
                {f >= 1000 ? `${f / 1000}k` : `${f}`} Hz
              </SvgText>
            ))}
            {/* The VCO's harmonics (grey) and what survives the VCF (amber). */}
            {lines.map((l, i) => (
              <Line key={`r${i}`} x1={l.x} y1={yOf(DB_FLOOR)} x2={l.x} y2={yOf(l.raw)} stroke="#5b5d68" strokeWidth={1.6} />
            ))}
            {lines.map((l, i) =>
              l.out > DB_FLOOR ? (
                <Line key={`o${i}`} x1={l.x} y1={yOf(DB_FLOOR)} x2={l.x} y2={yOf(l.out)} stroke={colors.amber} strokeWidth={1.6} />
              ) : null,
            )}
            {/* The filter's own response + its cutoff. */}
            <Path d={curve} stroke="#e8eaf0" strokeOpacity={0.75} strokeWidth={1.2} fill="none" strokeDasharray="4 3" />
            <Line x1={xc} y1={padT - 4} x2={xc} y2={yOf(DB_FLOOR)} stroke="#e8eaf0" strokeOpacity={0.35} strokeWidth={1} />
            <SvgText x={Math.min(w - padR - 2, xc + 4)} y={padT - 3} fill="#e8eaf0" fontSize={9.5} fontFamily={fonts.barlowCondensedSemiBold} textAnchor={xc > w - 90 ? 'end' : 'start'}>
              CUTOFF {cutLabel}
            </SvgText>
            <Line x1={padL} y1={y0} x2={padL} y2={yOf(DB_FLOOR)} stroke="#3a3a44" strokeWidth={0.8} />
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 2 }}>
        <Text style={{ fontFamily: fonts.barlowMedium, fontSize: 12, color: '#9a9ca8' }}>▮ grey = removed by the filter</Text>
        <Text style={{ fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.amber }}>▮ amber = what passes the filter</Text>
        <Text style={{ fontFamily: fonts.barlowMedium, fontSize: 12, color: '#d8dae2' }}>- - - the filter’s curve</Text>
      </View>
    </View>
  );
}
