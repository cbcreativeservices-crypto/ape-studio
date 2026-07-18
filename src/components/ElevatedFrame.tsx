/**
 * ElevatedFrame — a BLANK 500-SERIES RACK PANEL (Booth 2026-07-10; replaces
 * the dark console-key look). The face matches an empty rack slot's blank
 * panel: mid-gray powder coat with a fine dark+light speckle (procedural SVG
 * pattern — one tile, GPU-tiled, resolution independent), near-HARD corners
 * (minimal radius, like real panels), no screws (screen space).
 * Physicality preserved from the previous design:
 *  - raised (incomplete): sits proud — top hairline glint + drop shadow.
 *  - depressed (complete / unavailable): seated lower — darkened face, inner
 *    top shadow, faint bottom lip, no drop shadow.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

// --- procedural powder-coat speckle (deterministic LCG — identical every
// render/reload; computed once at module load) ---
// Large tile (the old 26px tile repeated visibly — specks appeared to "line
// up"); xorshift RNG for real spatial randomness (Booth 2026-07-10 #2).
const TILE = 64;
// ONE gray for every panel; darkened 2 more shades (Booth 2026-07-11).
const BASE = '#383a3c';
const SPECKS: { x: number; y: number; r: number; c: string; o: number }[] = (() => {
  // Powder-coat grain — palette darkened with the base 2 shades (Booth 2026-07-11).
  const dark = ['#2c2d2f', '#303132'];
  const light = ['#414245', '#464749'];
  let s = 0x9e3779b9;
  const rnd = () => {
    // xorshift32 — decorrelated, no visible striping.
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  const out: { x: number; y: number; r: number; c: string; o: number }[] = [];
  for (let i = 0; i < 240; i++) {
    // ~1.5% tiny near-black SHADOW specks make the grain pop 3D (#7).
    if (rnd() < 0.015) {
      out.push({ x: rnd() * TILE, y: rnd() * TILE, r: 0.3 + rnd() * 0.4, c: '#202123', o: 0.55 + rnd() * 0.35 });
      continue;
    }
    const isLight = rnd() > 0.5;
    const palette = isLight ? light : dark;
    // Blown-on spatter: mostly fine grain, some medium, rare blobs.
    const roll = rnd();
    const r = roll < 0.7 ? 0.25 + rnd() * 0.45 : roll < 0.9 ? 0.7 + rnd() * 0.5 : 1.3 + rnd() * 0.9;
    out.push({
      x: rnd() * TILE,
      y: rnd() * TILE,
      r,
      c: palette[rnd() > 0.5 ? 0 : 1],
      o: 0.7 + rnd() * 0.3,
    });
  }
  return out;
})();

/** The powder-coat speckle face. Exported so other surfaces (e.g. the Dashboard
 *  topic-card display) can wear the SAME treatment. `darken` (0..1) lays a black
 *  wash over the coat to shift the whole panel a few shades darker. */
export function PanelFace({ darken = 0 }: { darken?: number }) {
  return (
    <View pointerEvents="none" style={styles.absFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="apePanelSpeckle" patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
            <Rect width={TILE} height={TILE} fill={BASE} />
            {SPECKS.map((d, i) => (
              <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.o} />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#apePanelSpeckle)" />
        {darken > 0 && <Rect x={0} y={0} width="100%" height="100%" fill="#000000" opacity={darken} />}
      </Svg>
    </View>
  );
}

export function ElevatedFrame({
  depressed = false,
  accent,
  children,
  contentStyle,
}: {
  depressed?: boolean;
  /** Optional edge accent (e.g. the pulsing amber on a ready quiz). */
  accent?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.outer,
        depressed ? styles.outerDepressed : styles.outerRaised,
        accent ? { borderColor: accent } : null,
      ]}
    >
      <View style={[styles.inner, contentStyle]}>
        <PanelFace />
        {/* metal lighting: soft sheen at the top, settle at the bottom */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.10)']}
          locations={[0, 0.42, 1]}
          style={styles.absFill}
        />
        {depressed ? (
          <>
            {/* seated lower: SAME panel gray (#7) — only the edges say so */}
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
              style={styles.recessTop}
            />
            <View pointerEvents="none" style={styles.recessBottomLip} />
          </>
        ) : (
          // light glancing off the panel's machined top edge
          <View pointerEvents="none" style={styles.topHighlight} />
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    // near-hard corners, like a real blank panel
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#4f4f54',
    overflow: 'hidden',
  },
  outerRaised: {
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  outerDepressed: {
    // Seated in the rack — conveyed by edges/no-shadow ONLY. No seat margins:
    // rack gaps must be uniform (Booth 2026-07-10 #3).
    borderColor: '#333338',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inner: {
    borderRadius: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: '#383a3c', // pre-SVG paint fallback (matches BASE)
    overflow: 'hidden',
  },
  absFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
  },
  recessTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  recessBottomLip: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 1,
  },
});
