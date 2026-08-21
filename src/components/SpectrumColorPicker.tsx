/**
 * SpectrumColorPicker — a full-spectrum hue WHEEL + lightness slider for members
 * to pick ANY colour, not just the preset swatches (owner 2026-08-21). Used
 * inside the tools' colour selectors (ColorWheelButton picker, LED picker,
 * waveform popup). Pure react-native-svg + PanResponder — no extra deps, no
 * browser needed. Saturation is held at 100% (vivid), lightness on the slider —
 * plenty of range for a meter colour without a third control.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Path, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** HSL → #rrggbb. h 0..360, s/l 0..1. */
export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** #rrggbb → { h, l } at s=1 (best-effort; used to seed the wheel from a colour). */
function hexToHl(hex?: string | null): { h: number; l: number } {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return { h: 200, l: 0.5 };
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  const d = max - min;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, l: clamp(l, L_MIN, L_MAX) };
}

const SIZE = 200;
const CX = SIZE / 2;
const OUTER = SIZE / 2 - 3;
const INNER = OUTER - 30;
const MIDR = (OUTER + INNER) / 2;
const SEGMENTS = 60;
const L_MIN = 0.16;
const L_MAX = 0.86;

const rad = (deg: number) => (deg * Math.PI) / 180;
const ring = (() => {
  const paths: { d: string; fill: string }[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a0 = (i / SEGMENTS) * 360;
    const a1 = ((i + 1) / SEGMENTS) * 360;
    const x0o = CX + OUTER * Math.cos(rad(a0));
    const y0o = CX + OUTER * Math.sin(rad(a0));
    const x1o = CX + OUTER * Math.cos(rad(a1));
    const y1o = CX + OUTER * Math.sin(rad(a1));
    const x1i = CX + INNER * Math.cos(rad(a1));
    const y1i = CX + INNER * Math.sin(rad(a1));
    const x0i = CX + INNER * Math.cos(rad(a0));
    const y0i = CX + INNER * Math.sin(rad(a0));
    paths.push({
      d: `M${x0o.toFixed(2)} ${y0o.toFixed(2)}A${OUTER} ${OUTER} 0 0 1 ${x1o.toFixed(2)} ${y1o.toFixed(2)}L${x1i.toFixed(2)} ${y1i.toFixed(2)}A${INNER} ${INNER} 0 0 0 ${x0i.toFixed(2)} ${y0i.toFixed(2)}Z`,
      fill: hslToHex((a0 + a1) / 2, 1, 0.5),
    });
  }
  return paths;
})();

export function SpectrumColorPicker({
  value,
  onPick,
}: {
  value?: string | null;
  onPick: (hex: string) => void;
}): ReactNode {
  const seed = useMemo(() => hexToHl(value), [value]);
  const [hue, setHue] = useState(seed.h);
  const [light, setLight] = useState(seed.l);
  const barW = SIZE;

  const color = hslToHex(hue, 1, light);
  const thumbX = CX + MIDR * Math.cos(rad(hue));
  const thumbY = CX + MIDR * Math.sin(rad(hue));

  const wheelPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateHue(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => updateHue(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;
  const barPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateLight(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateLight(e.nativeEvent.locationX),
    }),
  ).current;

  function updateHue(x: number, y: number) {
    let a = (Math.atan2(y - CX, x - CX) * 180) / Math.PI;
    if (a < 0) a += 360;
    setHue(a);
  }
  function updateLight(x: number) {
    setLight(L_MIN + clamp(x / barW, 0, 1) * (L_MAX - L_MIN));
  }

  const lThumb = ((light - L_MIN) / (L_MAX - L_MIN)) * barW;

  return (
    <View style={styles.wrap}>
      <View style={{ width: SIZE, height: SIZE }} {...wheelPan.panHandlers}>
        <Svg width={SIZE} height={SIZE}>
          {ring.map((p, i) => (
            <Path key={i} d={p.d} fill={p.fill} />
          ))}
          {/* centre preview */}
          <Circle cx={CX} cy={CX} r={INNER - 6} fill={color} stroke="#0c0c0f" strokeWidth={2} />
          {/* hue thumb */}
          <Circle cx={thumbX} cy={thumbY} r={9} fill={hslToHex(hue, 1, 0.5)} stroke="#ffffff" strokeWidth={3} />
        </Svg>
      </View>

      {/* Lightness slider: dark → pure hue → light. */}
      <View style={{ width: barW, height: 26, marginTop: 12 }} {...barPan.panHandlers}>
        <Svg width={barW} height={26}>
          <Defs>
            <SvgGrad id="lgrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={hslToHex(hue, 1, L_MIN)} />
              <Stop offset="50%" stopColor={hslToHex(hue, 1, 0.5)} />
              <Stop offset="100%" stopColor={hslToHex(hue, 1, L_MAX)} />
            </SvgGrad>
          </Defs>
          <Rect x={0} y={5} width={barW} height={16} rx={8} fill="url(#lgrad)" />
          <Circle cx={clamp(lThumb, 8, barW - 8)} cy={13} r={11} fill={color} stroke="#ffffff" strokeWidth={3} />
        </Svg>
      </View>

      <View style={styles.footer}>
        <View style={[styles.chip, { backgroundColor: color }]} />
        <Text style={styles.hex}>{color.toUpperCase()}</Text>
        <Text style={styles.use} onPress={() => onPick(color)} accessibilityRole="button" accessibilityLabel={`Use ${color}`}>
          USE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  chip: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#33333c' },
  hex: { fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary, minWidth: 78 },
  use: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 1.4,
    color: colors.amber,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
});
