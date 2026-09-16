/**
 * InsideStats — the "Academy at a Glance" hero on Explore (owner-approved design
 * 2026-09-15, refined live). The GLOSSARY is the centre of the academy; eight
 * metrics ring it at even clock positions.
 *
 * CENTRE (no container — amber glow only, breathing to 63%): four stacked lines —
 *   26,855                 (green)
 *   Fully · link · Linked  (light; the link icon is light-blue)
 *   Glossary Terms         (green)
 *   Definitions and Flashcards (muted)
 *
 * CONNECTIONS: no persistent lines. Every so often a short AUDIO-WAVEFORM TRACE
 * glides along one spoke — to or from the glossary core — one node at a time,
 * fading in and out. Subtle and modern, never dominating (owner 2026-09-15:
 * replaced the lightning bolts, which read amateur).
 *
 * RING (8 nodes at 45°, owner's clock map): 12 study topics (white) · 1:30
 * specialist certificates (full-app blue, tappable) · 3 full programs (purple,
 * tappable) · 4:30 practice labs · 6 practice questions · 7:30 measurement tools
 * · 9 pro audio calculators · 10:30 subject categories (amber). The un-accented
 * figures are silver. No node containers, no icons.
 *
 * Every figure comes from a real source in CurriculumScreen; value === null
 * renders a dimmed dash, never an invented number. Motion honours reduce-motion:
 * the glow breathes and the traces cycle continuously but sparsely; the figures
 * count up once per app session (owner 2026-08-10). Colours are theme tokens
 * except the requested silver (no palette token; defined + commented below).
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, Line, Polyline, RadialGradient, Defs, Stop, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../theme/tokens';
import { animationsAllowed } from '../../features/settings/a11y';

export type InsideStat = {
  id: string;
  value: number | null;
  label: string;
  tone: string;
  labelTone?: string;
  onPress?: () => void;
  a11yLabel?: string;
  /** Clock position (hours, e.g. 12, 1.5, 3, 10). When set, the node is placed
   *  there instead of the even-45° default for its index (owner 2026-09-15). */
  clock?: number;
  /** Rich label: per-segment colouring (e.g. one word tinted). When set, it is
   *  rendered instead of `label`; segments without a colour inherit the label
   *  tone. Include any '\n' line breaks in the segment text (owner 2026-09-15). */
  labelParts?: { text: string; color?: string }[];
};

export const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Mix a hex colour toward white by `amt` (0..1) — for lighter label tints. */
function lighten(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// Requested "light gray / silver" — no palette token exists for it.
const SILVER = '#c7ccd4';
const CORE = colors.amber; // the glossary figure + "Glossary Terms", in amber
const GLOW = colors.amber; // the breathing glow behind the core

// ── Vertical geometry: height derives from the ring radius ────────────────────
const NUM_ABOVE = 17;


const countedOnce = new Set<string>();

function CountUp({ id, target, style, glowAnimatedStyle }: { id: string; target: number | null; style: object; glowAnimatedStyle?: object }) {
  const done = countedOnce.has(id);
  const [n, setN] = useState<number | null>(done ? target : null);
  useEffect(() => {
    if (target == null) return;
    if (done || !animationsAllowed()) {
      countedOnce.add(id);
      setN(target);
      return;
    }
    countedOnce.add(id);
    const DURATION = 2000;
    const start = Date.now();
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
      else setN(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [id, target, done]);
  const display = n == null ? '—' : fmt(n);
  // Crisp text on top; a separate glow layer behind (slightly enlarged) so the
  // number stays sharp while the halo breathes around it with a gap.
  if (glowAnimatedStyle) {
    return (
      <View style={styles.glowWrap}>
        <Animated.Text style={[style, styles.hubGlowLayer, glowAnimatedStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{display}</Animated.Text>
        <Text style={[style, n == null && styles.pending]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{display}</Text>
      </View>
    );
  }
  return (
    <Text style={[style, n == null && styles.pending]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
      {display}
    </Text>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

/** A jagged lightning arc from a node to the glossary core (cx,cy), with fresh
 *  random jitter each call (tapered at the ends). Regenerated on a fast interval
 *  so the arc CRACKLES continuously — a constant live connection, not a strike. */
function boltPath(nx: number, ny: number, cxp: number, cyp: number): string {
  const dx = cxp - nx;
  const dy = cyp - ny;
  const len = Math.hypot(dx, dy) || 1;
  const pux = -dy / len;
  const puy = dx / len;
  const segs = 9;
  const amp = 9; // more jagged crackle (owner 2026-09-15)
  let s = `${nx.toFixed(1)},${ny.toFixed(1)}`;
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const bx = nx + dx * t;
    const by = ny + dy * t;
    const j = (Math.random() * 2 - 1) * amp * Math.sin(t * Math.PI);
    s += ` ${(bx + pux * j).toFixed(1)},${(by + puy * j).toFixed(1)}`;
  }
  return `${s} ${cxp.toFixed(1)},${cyp.toFixed(1)}`;
}

/** A small STATIC VU-meter glyph (arc + needle) — image only, not live. */
function VuGlyph() {
  return (
    <Svg width={17} height={13} viewBox="0 0 34 24">
      <Path d="M4 21 A 13 13 0 0 1 30 21" fill="none" stroke={colors.blue} strokeWidth={1.7} strokeLinecap="round" />
      <Line x1="9" y1="12.5" x2="10" y2="14.5" stroke={colors.blue} strokeWidth={1} strokeLinecap="round" />
      <Line x1="17" y1="9.5" x2="17" y2="11.7" stroke={colors.blue} strokeWidth={1} strokeLinecap="round" />
      <Line x1="25" y1="12.5" x2="24" y2="14.5" stroke={colors.blue} strokeWidth={1} strokeLinecap="round" />
      <Line x1="17" y1="21" x2="23.5" y2="10.5" stroke={colors.blue} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="17" cy="21" r="1.7" fill={colors.blue} />
    </Svg>
  );
}

/** Static icon paired with a few nodes (owner 2026-09-15): study topics → the
 *  blue Study nav glyph; calculators → a purple sigma; measurement tools → a
 *  small VU meter. Image/vector only — none animated. */
function iconFor(id: string) {
  switch (id) {
    case 'topics':
      return <Image source={require('../../../assets/icons/nav/nav-study.png')} style={styles.iconImg} resizeMode="contain" />;
    case 'calcs':
      return <Text style={styles.sigma}>Σ</Text>;
    case 'tools':
      return <VuGlyph />;
    default:
      return null;
  }
}

function Node({ stat, x, y, w }: { stat: InsideStat; x: number; y: number; w: number }) {
  const a11y = stat.a11yLabel ?? `${stat.value == null ? 'Count unavailable' : fmt(stat.value)} ${stat.label}`;
  const icon = iconFor(stat.id);
  const body = (
    <>
      <View style={styles.valueRow}>
        {icon}
        <CountUp id={stat.id} target={stat.value} style={[styles.nodeValue, { color: stat.tone }]} />
      </View>
      <Text style={[styles.nodeLabel, stat.labelTone ? { color: stat.labelTone } : null]} numberOfLines={2}>
        {stat.labelParts
          ? stat.labelParts.map((p, i) => (
              <Text key={i} style={p.color ? { color: p.color } : null}>{p.text}</Text>
            ))
          : stat.label}
        {stat.onPress ? <Text style={styles.nodeArrow}>{' ›'}</Text> : null}
      </Text>
    </>
  );
  const box = { left: x - w / 2, top: y - NUM_ABOVE, width: w } as const;
  return stat.onPress ? (
    <Pressable style={[styles.node, box]} onPress={stat.onPress} hitSlop={4} accessibilityRole="button" accessibilityLabel={a11y}>
      {body}
    </Pressable>
  ) : (
    <View style={[styles.node, box]} accessible accessibilityLabel={a11y}>
      {body}
    </View>
  );
}

export function InsideStats({
  hero,
  satellites,
}: {
  hero: { id: string; value: number | null; a11yLabel?: string };
  /** Eight metrics in clock order: 12, 1:30, 3, 4:30, 6, 7:30, 9, 10:30. */
  satellites: InsideStat[];
}) {
  const { width: winW } = useWindowDimensions();
  // The container is SQUARE (owner 2026-09-15) so the square background image
  // drops in 1:1. We measure the diagram box (width AND height) and centre the
  // ring in it.
  const [box, setBox] = useState({ w: Math.max(260, winW - 94), h: Math.max(260, winW - 94) });
  const w = box.w;
  const h = box.h;
  const anim = animationsAllowed();

  const cx = w / 2;
  const cy = h / 2;
  // Radius fits within the square diagram box, pulled in enough that the side
  // node labels clear the image's neon frame at the edges (owner 2026-09-15).
  const nodeW = Math.min(104, w * 0.31);
  const R = Math.max(88, Math.min(w / 2 - nodeW / 2 - 12, h / 2 - 30));
  const glowR = Math.min(R, 108);

  const sats = satellites.slice(0, 8);
  // A node's own `clock` (hours → degrees, 12 o'clock = top) overrides the even
  // 45° default for its index (owner 2026-09-15).
  const clockKey = sats.map((s) => s.clock ?? '').join(',');
  const ring = useMemo(() => sats.map((s, i) => {
    const deg = s.clock != null ? s.clock * 30 - 90 : -90 + i * 45;
    const a = deg * (Math.PI / 180);
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    return { ux, uy, x: cx + R * ux, y: cy + R * uy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sats.length, clockKey, cx, cy, R]);

  // Precise link-icon centre, measured RELATIVE TO THE DIAGRAM (the Svg's own
  // coordinate space) via measureLayout — the exact point the bolts emanate
  // from. Estimate until measured.
  const diagramRef = useRef<View>(null);
  // The bolts converge on the LINK ICON. cross-view measureLayout was unreliable
  // on Fabric (it returned a point up-and-left of the icon), so instead we read
  // the link ROW's own onLayout (relative to the hub, which is reliable) and add
  // the hub's known top (cy-46). x is the diagram centre — the icon is centred in
  // its row. Estimate cy+22 until the row reports its layout.
  const [linkRow, setLinkRow] = useState<{ y: number; h: number } | null>(null);
  const linkPt = { x: cx, y: linkRow ? cy - 46 + linkRow.y + linkRow.h / 2 : cy + 22 };

  // Glow: a low, IRREGULAR breathe (linear clock, mixed sines below).
  const glow = useSharedValue(0);
  // Gold breathe for the glossary number + "Glossary Terms" — same ~3.2 s calm
  // breathe as the About the Academy cue (owner 2026-09-15).
  const gold = useSharedValue(anim ? 0 : 1);
  useEffect(() => {
    if (!anim) return;
    gold.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(gold);
  }, [anim, gold]);
  // Glow layer opacity lowered 57% (owner 2026-09-15): the breathe range is
  // multiplied by 0.43 so the halo is softer.
  const goldGlow = useAnimatedStyle(() => ({ opacity: (0.74 + gold.value * 0.26) * 0.43 }));
  // Constant lightning connection (owner 2026-09-15): every node stays wired to
  // the glossary through the LINK-ICON centre, and each arc CRACKLES continuously
  // — the jagged path is regenerated on a fast interval so it reads as live,
  // moving lightning (NOT dashes, NOT occasional strikes). Kept dim on purpose.
  const [paths, setPaths] = useState<string[]>(() => ring.map(() => ''));
  useEffect(() => {
    if (!anim) return;
    glow.value = withRepeat(withTiming(1, { duration: 5300, easing: Easing.linear }), -1, false);
    const recrackle = () => setPaths(ring.map((n) => boltPath(n.x, n.y, linkPt.x, linkPt.y)));
    recrackle();
    const id = setInterval(recrackle, 206); // slowed 37% (owner 2026-09-15) → ~5 fps, a calmer crackle
    return () => { cancelAnimation(glow); clearInterval(id); };
  }, [anim, glow, ring, linkPt.x, linkPt.y]);

  // Lower, irregular glow: two mixed sines → opacity ~[0.4, 0.8].
  const glowProps = useAnimatedProps(() => {
    const t = glow.value;
    const s1 = 0.5 + 0.5 * Math.sin(t * 6.2832 * 0.9);
    const s2 = 0.5 + 0.5 * Math.sin(t * 6.2832 * 1.7 + 1.1);
    const m = 0.6 * s1 + 0.4 * s2;
    return { opacity: 0.4 + 0.4 * m };
  });
  const heroA11y = hero.a11yLabel ?? `${hero.value == null ? 'Count unavailable' : fmt(hero.value)} fully linked glossary terms, definitions and flashcards. The glossary is the centre of the academy; every figure shown links to it.`;

  return (
    <View style={styles.panelShadow}>
      <LinearGradient colors={colors.panelGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.panel}>
        {/* Owner-supplied HUD portal background (2026-09-15). expo-image's
            contentFit reliably scales the square source into the square panel —
            plain RN <Image resizeMode> was rendering it near intrinsic size,
            anchored top-left (only the corner showed). */}
        <ExpoImage
          source={require('../../../assets/glance-bg.webp')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Background dimmed 37% (owner 2026-09-15) — behind content; the glow,
            bolt and all text render on top and stay full brightness. */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.darken]} />
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>THE ACADEMY AT A GLANCE</Text>
        </View>

        <View ref={diagramRef} style={styles.diagram} onLayout={(e) => { const l = e.nativeEvent.layout; setBox({ w: Math.round(l.width), h: Math.round(l.height) }); }}>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={GLOW} stopOpacity={0.22} />
                <Stop offset="0.22" stopColor={GLOW} stopOpacity={0.13} />
                <Stop offset="0.5" stopColor={GLOW} stopOpacity={0.05} />
                <Stop offset="0.78" stopColor={GLOW} stopOpacity={0.015} />
                <Stop offset="1" stopColor={GLOW} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="ambient" cx="50%" cy="46%" r="62%">
                <Stop offset="0" stopColor={colors.cyan} stopOpacity={0.07} />
                <Stop offset="0.7" stopColor={colors.cyan} stopOpacity={0.02} />
                <Stop offset="1" stopColor={colors.cyan} stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* Hero lightning — the VERY BACK layer (behind glow + all text): a
                CONSTANT, dim lightning arc from every node to the LINK-ICON centre,
                each arc re-crackling continuously (owner 2026-09-15 — a steady
                moving lightning connection, not dashes and not occasional bolts).
                Wide soft glow + core, all kept faint on purpose. */}
            {anim && paths.map((d, i) => (d ? (
              <Fragment key={i}>
                <Polyline points={d} fill="none" stroke={colors.cyan} strokeWidth={5} strokeOpacity={0.016} strokeLinecap="round" strokeLinejoin="round" />
                <Polyline points={d} fill="none" stroke={colors.cyan} strokeWidth={2} strokeOpacity={0.031} strokeLinecap="round" strokeLinejoin="round" />
                <Polyline points={d} fill="none" stroke="#dff2ff" strokeWidth={1} strokeOpacity={0.052} strokeLinecap="round" strokeLinejoin="round" />
              </Fragment>
            ) : null))}

            {/* Ambient depth: faint blue field + two whisper waveforms. */}
            <Circle cx={cx} cy={cy} r={Math.max(cx, cy)} fill="url(#ambient)" />
            <Path d={`M0 ${cy + 14} Q ${w * 0.16} ${cy - 10} ${w * 0.32} ${cy + 14} T ${w * 0.64} ${cy + 14} T ${w} ${cy + 14}`} fill="none" stroke={colors.cyan} strokeOpacity={0.05} strokeWidth={1} />
            <Path d={`M0 ${cy + 34} Q ${w * 0.16} ${cy + 12} ${w * 0.32} ${cy + 34} T ${w * 0.64} ${cy + 34} T ${w} ${cy + 34}`} fill="none" stroke={colors.cyan} strokeOpacity={0.04} strokeWidth={1} />

            {/* Breathing amber core glow (no ring container). */}
            <ACircle cx={cx} cy={cy} r={glowR} fill="url(#coreGlow)" animatedProps={glowProps} />
          </Svg>

          {/* Centre: four stacked lines, no container. */}
          <View style={[styles.hub, { left: cx - 96, top: cy - 46, width: 192 }]} accessible accessibilityLabel={heroA11y}>
            <CountUp id={hero.id} target={hero.value} style={styles.hubValue} glowAnimatedStyle={goldGlow} />
            <View style={styles.glowWrap}>
              <Animated.Text style={[styles.hubTerms, styles.hubGlowLayer, goldGlow]}>Glossary Terms</Animated.Text>
              <Text style={styles.hubTerms}>Glossary Terms</Text>
            </View>
            <Text style={styles.hubSub}>Definitions and Flashcards</Text>
            <View
              style={styles.hubLinkRow}
              onLayout={(e) => { const l = e.nativeEvent.layout; setLinkRow({ y: l.y, h: l.height }); }}
            >
              <Text style={styles.hubFully}>Fully</Text>
              <View style={styles.linkIcon}>
                <View style={styles.linkRing} />
                <View style={[styles.linkRing, styles.linkRing2]} />
              </View>
              <Text style={styles.hubFully}>Linked</Text>
            </View>
          </View>

          {ring.map((p, i) => (
            <Node key={sats[i].id} stat={sats[i]} x={p.x} y={p.y} w={nodeW} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pull out to the screen edges — the framed image needs no side padding
  // (owner 2026-09-15). -20 cancels the scroll content's 20px side padding.
  panelShadow: { borderRadius: 14, marginHorizontal: -20, boxShadow: `0px 10px 28px 0px ${withAlpha(colors.black, 0.5)}` },
  // No panel border — the image's own neon frame is the edge (owner 2026-09-15).
  panel: { borderRadius: 14, overflow: 'hidden', aspectRatio: 1 },
  darken: { backgroundColor: 'rgba(0,0,0,0.37)' },
  // Centered, and dropped below the image's top frame line (owner 2026-09-15).
  eyebrowRow: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 26, paddingBottom: 6 },
  eyebrow: { fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 2.8, color: colors.textSecondary, textAlign: 'center' },

  diagram: { flex: 1, marginHorizontal: 14, marginBottom: 12 },

  // Centre anchor — four stacked lines.
  hub: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  hubValue: { fontFamily: fonts.oswaldBold, fontSize: 26, lineHeight: 30, includeFontPadding: false, letterSpacing: 0.4, color: CORE },
  // Glow layer: sits BEHIND the crisp text, enlarged a touch so the amber halo
  // breathes around it with a gap, keeping the text itself sharp (owner 2026-09-15).
  glowWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  hubGlowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    // Behind layer aligns exactly under the crisp text; its glyphs are hidden by
    // the sharp text on top, so only the soft amber BLOOM shows → a glow, not a
    // shadow. A wide, zero-offset radius spreads the halo out with a gap.
    textShadowColor: 'rgba(255,198,77,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  hubLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  hubFully: { fontFamily: fonts.barlowCondensedMedium, fontSize: 11.5, letterSpacing: 0.6, color: colors.textSecondary },
  linkIcon: { width: 13, height: 7, justifyContent: 'center' },
  linkRing: { position: 'absolute', width: 8, height: 5.8, borderRadius: 2.9, borderWidth: 1.3, borderColor: colors.cyan },
  linkRing2: { left: 4.5 },
  hubTerms: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, color: CORE, marginTop: 2 },
  // Amber, but STATIC — no breathe/glow (owner 2026-09-15).
  hubSub: { fontFamily: fonts.barlowCondensedMedium, fontSize: 10, letterSpacing: 0.4, color: CORE, marginTop: 1 },

  // Ring nodes (no container).
  node: { position: 'absolute', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconImg: { width: 16, height: 16 },
  sigma: { fontSize: 17, lineHeight: 19, fontWeight: '700', color: colors.purple },
  nodeValue: { fontFamily: fonts.oswaldMedium, fontSize: 18, lineHeight: 21, includeFontPadding: false, letterSpacing: 0.2 },
  nodeLabel: { fontFamily: fonts.barlowCondensedRegular, fontSize: 11.5, lineHeight: 15, letterSpacing: 0.3, color: colors.textSub, textAlign: 'center', marginTop: 1 },
  nodeArrow: { fontFamily: fonts.oswaldMedium, color: colors.textMuted },
  pending: { opacity: 0.4 },
});

export { lighten, SILVER };
