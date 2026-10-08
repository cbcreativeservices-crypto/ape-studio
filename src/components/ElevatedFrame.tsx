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
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { A11Y_HIDDEN } from '../features/settings/a11y';

// <specks> — pure; unit-tested by test/a11yTreeDepth_20261008.test.ts, which
// transpiles exactly this block. Kept in this module (not its own) because the
// app-start module budget is a ratchet (test/perfStartTrim_20261004.test.ts).
/**
 * Draw a cloud of tiny round specks as a FEW <Path>s instead of one <Circle>
 * per speck.
 *
 * ⛔ WHY (Sentry APE-STUDIO-W / R / S, 2026-10-07): every react-native-svg
 * element is a real native view. This face drew 240 <Circle>s per panel and
 * the Dashboard's gray rack face 130 more, so one Dashboard carried thousands
 * of texture views — and an accessibility client walking that tree (App
 * Review's tooling) hung the main thread for 2 s+.
 *
 * Specks that share a fill and (quantised) opacity are merged into ONE path of
 * circle sub-paths: the same specks at the same places and radii; only the
 * opacity is rounded to `opacityStep` (0.05 by default — below what a ≤ 2 px
 * speck can show).
 */
export type Speck = { cx: number; cy: number; r: number; fill: string; opacity: number };
export type SpeckPath = { d: string; fill: string; opacity: number };

const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

/** One circle as a closed path (two half-arcs) — no extra node. */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${f2(cx - r)} ${f2(cy)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z`;
}

/** Group specks by fill + quantised opacity; one path per group, in first-seen
 *  order so the paint order of the groups is stable between renders. */
export function specksToPaths(specks: readonly Speck[], opacityStep = 0.05): SpeckPath[] {
  const groups = new Map<string, SpeckPath>();
  for (const s of specks) {
    const o = Math.max(0, Math.min(1, Math.round(s.opacity / opacityStep) * opacityStep));
    const key = `${s.fill}|${o.toFixed(3)}`;
    let g = groups.get(key);
    if (!g) {
      g = { d: '', fill: s.fill, opacity: Number(o.toFixed(3)) };
      groups.set(key, g);
    }
    g.d += circlePath(s.cx, s.cy, s.r);
  }
  return [...groups.values()];
}
// </specks>

// --- procedural powder-coat speckle (deterministic LCG — identical every
// render/reload; computed once at module load) ---
// Large tile (the old 26px tile repeated visibly — specks appeared to "line
// up"); xorshift RNG for real spatial randomness (Booth 2026-07-10 #2).
const TILE = 64;

// Powder-coat palettes. DEFAULT = the original panel gray shared by every study
// method (Matching / Fill-in-Blank / …) — never changed. FLASHCARDS-ONLY uses a
// deep charcoal (user request 2026-07-18: only the Flashcards panel darkens; the
// quiz has its own cream face). The speckle grain shifts in step with each base.
type Palette = { base: string; dark: [string, string]; light: [string, string]; shadow: string };
const DEFAULT_PALETTE: Palette = {
  base: '#383a3c',
  dark: ['#2c2d2f', '#303132'],
  light: ['#414245', '#464749'],
  shadow: '#202123',
};
const DARK_PALETTE: Palette = {
  base: '#141618',
  dark: ['#08090b', '#0c0d0e'],
  light: ['#1e2021', '#232526'],
  shadow: '#040507',
};

// Speck GEOMETRY only (colors resolve per palette at render) so both variants
// share the exact same grain layout.
const SPECKS: { x: number; y: number; r: number; o: number; kind: 'shadow' | 'dark' | 'light'; pick: 0 | 1 }[] =
  (() => {
    let s = 0x9e3779b9;
    const rnd = () => {
      // xorshift32 — decorrelated, no visible striping.
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
    const out: { x: number; y: number; r: number; o: number; kind: 'shadow' | 'dark' | 'light'; pick: 0 | 1 }[] = [];
    for (let i = 0; i < 240; i++) {
      // ~1.5% tiny near-black SHADOW specks make the grain pop 3D (#7).
      if (rnd() < 0.015) {
        out.push({ x: rnd() * TILE, y: rnd() * TILE, r: 0.3 + rnd() * 0.4, o: 0.55 + rnd() * 0.35, kind: 'shadow', pick: 0 });
        continue;
      }
      const kind: 'dark' | 'light' = rnd() > 0.5 ? 'light' : 'dark';
      // Blown-on spatter: mostly fine grain, some medium, rare blobs.
      const roll = rnd();
      const r = roll < 0.7 ? 0.25 + rnd() * 0.45 : roll < 0.9 ? 0.7 + rnd() * 0.5 : 1.3 + rnd() * 0.9;
      out.push({ x: rnd() * TILE, y: rnd() * TILE, r, o: 0.7 + rnd() * 0.3, kind, pick: rnd() > 0.5 ? 0 : 1 });
    }
    return out;
  })();

function speckColor(p: Palette, d: (typeof SPECKS)[number]): string {
  return d.kind === 'shadow' ? p.shadow : d.kind === 'light' ? p.light[d.pick] : p.dark[d.pick];
}

/** The 240 specks as a handful of paths per palette, computed once.
 *  ⛔ Sentry APE-STUDIO-W/R/S (2026-10-07): one <Circle> per speck was 240
 *  native views per panel, and an accessibility client walking a Dashboard
 *  full of panels hung the iOS main thread for 2 s+. Same specks, same places. */
const SPECK_PATHS = new Map<Palette, SpeckPath[]>();
function speckPaths(p: Palette): SpeckPath[] {
  let paths = SPECK_PATHS.get(p);
  if (!paths) {
    paths = specksToPaths(SPECKS.map((d) => ({ cx: d.x, cy: d.y, r: d.r, fill: speckColor(p, d), opacity: d.o })));
    SPECK_PATHS.set(p, paths);
  }
  return paths;
}

/** The powder-coat speckle face. `dark` selects the Flashcards-only charcoal
 *  palette; `darken` (0..1) lays an extra black wash over the coat. */
export function PanelFace({ dark = false, darken = 0 }: { dark?: boolean; darken?: number }) {
  const p = dark ? DARK_PALETTE : DEFAULT_PALETTE;
  const patternId = dark ? 'apePanelSpeckleDark' : 'apePanelSpeckleDefault';
  return (
    // Pure texture: the whole subtree is hidden from the accessibility tree.
    <View pointerEvents="none" style={styles.absFill} {...A11Y_HIDDEN}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width="100%" height="100%">
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
            <Rect width={TILE} height={TILE} fill={p.base} />
            {speckPaths(p).map((g, i) => (
              <Path key={i} d={g.d} fill={g.fill} opacity={g.opacity} />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
        {darken > 0 && <Rect x={0} y={0} width="100%" height="100%" fill="#000000" opacity={darken} />}
      </Svg>
    </View>
  );
}

export function ElevatedFrame({
  depressed = false,
  accent,
  chrome = false,
  dark = false,
  borderless = false,
  children,
  contentStyle,
}: {
  depressed?: boolean;
  /** Optional edge accent (e.g. the pulsing amber on a ready quiz). */
  accent?: string;
  /** CREAM face instead of powder coat (user request 2026-07-18 — the
   *  topic-quiz panel): a warm ivory satin. */
  chrome?: boolean;
  /** Deep-charcoal powder-coat variant (user request 2026-07-18 — the
   *  Flashcards panel ONLY; every other method keeps the default gray). */
  dark?: boolean;
  /** Drop the thin edge border (owner 2026-08-11 — the section filler panels
   *  read as bare cut blanks, no framed rim). */
  borderless?: boolean;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.outer,
        depressed ? styles.outerDepressed : styles.outerRaised,
        accent ? { borderColor: accent } : null,
        borderless ? styles.outerBorderless : null,
      ]}
    >
      <View style={[styles.inner, chrome && styles.innerChrome, dark && styles.innerDark, contentStyle]}>
        {chrome ? (
          // Vertical CREAM banding — warm ivory satin (user request 2026-07-18).
          <LinearGradient
            pointerEvents="none"
            colors={['#f3ecd9', '#e2d6b8', '#faf4e6', '#d8cba8', '#ece2c9']}
            locations={[0, 0.32, 0.52, 0.72, 1]}
            style={styles.absFill}
          />
        ) : (
          <PanelFace dark={dark} />
        )}
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
  outerBorderless: { borderWidth: 0 },
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
    backgroundColor: '#383a3c', // pre-SVG paint fallback (matches DEFAULT base)
    overflow: 'hidden',
  },
  innerDark: { backgroundColor: '#141618' }, // Flashcards-only charcoal fallback
  innerChrome: { backgroundColor: '#ece0c4' }, // cream fallback under the gradient
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
