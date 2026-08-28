/**
 * cableArt — recognizable Skia illustrations of installation hardware for the
 * Cable Dressing & Installation Lab.
 *
 * WHY THIS EXISTS (owner 2026-08-25): the lab shipped its cables, ties, trays
 * and conduit as flat 1–3px outline strokes. A student who has never handled
 * this gear cannot learn an object from a covered line — "a plain green line"
 * does not teach what a cable IS, and an ellipse does not teach what a zip tie
 * IS. That also violates the STANDING lab visual standard (owner 2026-07-29):
 * real objects get real drawings — layered shapes, gradients for form, light
 * from upper-left, rim highlights; never a bare rect/circle/line stand-in.
 * Abstract data (graphs, meters, score bars) may stay clean-geometric.
 *
 * This module is the `micArt.tsx` precedent extended to install hardware.
 *
 * ── HOW A CABLE IS DRAWN (the thing that makes it read as a cable) ──────────
 * A cable is NOT a stroke. It is a RIBBON: the centreline is sampled into a
 * dense polyline, offset along its own normals, and filled as a closed shape.
 * That buys three things a stroke cannot give you:
 *   1. TONE ACROSS THE DIAMETER — a dark jacket edge (core shadow), a midtone
 *      body, and a narrow specular stripe on the lit side. Three tonal steps
 *      across the width is what the eye reads as "round".
 *   2. A CONTACT SHADOW offset onto whatever it rests on, so it sits in the
 *      scene instead of floating on it.
 *   3. HONEST DIAMETER — a 12-pair snake is visibly fatter than a mic line,
 *      because diameter is geometry here, not a strokeWidth guess.
 * Waypoints are splined (Catmull-Rom), so runs drape and turn with real bend
 * radii — never a perfect vertical stroke. `sag` adds a catenary; every free
 * run should have one.
 *
 * ── LIGHT ──────────────────────────────────────────────────────────────────
 * Upper-left, always, matching micArt. `side` flips which edge of a run takes
 * the specular when a cable travels right-to-left or bottom-to-top.
 *
 * ── SCOPE ──────────────────────────────────────────────────────────────────
 * Static geometry only — no animation in here (same contract as micArt). Scene
 * motion stays in `motion.tsx`; this module supplies the objects it moves.
 * All designs are GENERIC hardware — no brand likenesses, no trade dress.
 */
import { useEffect, useMemo } from 'react';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec,
  BlurMask,
  type SkPath,
} from '@shopify/react-native-skia';

/* ══ palette ═══════════════════════════════════════════════════════════════ */

/** Jacket colours by cable class — the tints the lab already teaches with. */
export const CI_JACKET = {
  mic: '#2b7d5e',
  line: '#2f7f9f',
  network: '#6f9a3c',
  power: '#a63a31',
  speaker: '#7d818a',
  video: '#6b52a0',
  fiber: '#c9973a',
  control: '#9c5f2b',
  neutral: '#3d4048',
} as const;
export type CiJacket = keyof typeof CI_JACKET;

const METAL_HI = '#9aa0ac';
const METAL_MID = '#5a6069';
const METAL_LO = '#22252b';
const NYLON_HI = '#e9e9ee';
const NYLON_MID = '#b9bac2';
const NYLON_LO = '#6f7078';
const RIM = 'rgba(255,255,255,0.34)';
const SHADOW = 'rgba(0,0,0,0.45)';

/* ══ colour maths ══════════════════════════════════════════════════════════ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
/** Mix toward black. amt 0..1 */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}
/** Mix toward white. amt 0..1 */
export function tint(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

/* ══ geometry ══════════════════════════════════════════════════════════════ */

export type Pt = { x: number; y: number };

/**
 * Catmull-Rom spline through the waypoints → a dense polyline. This is what
 * gives a run a real bend radius instead of a mitred corner: you place four or
 * five waypoints and the cable finds a natural path between them.
 */
export function spline(pts: Pt[], perSeg = 16): Pt[] {
  if (pts.length < 3) {
    // Two points: still sample, so downstream code has one uniform shape.
    if (pts.length < 2) return pts.slice();
    const out: Pt[] = [];
    for (let i = 0; i <= perSeg; i++) {
      const t = i / perSeg;
      out.push({ x: pts[0].x + (pts[1].x - pts[0].x) * t, y: pts[0].y + (pts[1].y - pts[0].y) * t });
    }
    return out;
  }
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Per-point unit normals from the local tangent (central difference). */
function normals(poly: Pt[]): Pt[] {
  const n: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[Math.max(0, i - 1)];
    const b = poly[Math.min(poly.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    n.push({ x: -dy / len, y: dx / len });
  }
  return n;
}

/**
 * A closed ribbon around a polyline: `halfW` to each side of a centre that is
 * itself pushed `shift` along the normal. `shift` is how the specular stripe
 * and the bounce rim are placed off-centre without recomputing the spline.
 */
export function ribbon(poly: Pt[], halfW: number, shift = 0, dx = 0, dy = 0): string {
  if (poly.length < 2) return '';
  const nrm = normals(poly);
  let left = '';
  let right = '';
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const n = nrm[i];
    const lx = p.x + n.x * (shift + halfW) + dx;
    const ly = p.y + n.y * (shift + halfW) + dy;
    const rx = p.x + n.x * (shift - halfW) + dx;
    const ry = p.y + n.y * (shift - halfW) + dy;
    left += `${i === 0 ? 'M' : 'L'}${lx.toFixed(2)} ${ly.toFixed(2)}`;
    right = `L${rx.toFixed(2)} ${ry.toFixed(2)}` + right;
  }
  return `${left}${right}Z`;
}

/** Centreline as a plain polyline path — what the tonal strokes ride on. */
export function polyPath(poly: Pt[]): string {
  if (poly.length < 2) return '';
  let d = `M${poly[0].x.toFixed(2)} ${poly[0].y.toFixed(2)}`;
  for (let i = 1; i < poly.length; i++) d += `L${poly[i].x.toFixed(2)} ${poly[i].y.toFixed(2)}`;
  return d;
}

/** Unit vector pointing from the surface TOWARD the light (upper-left). */
const LIGHT: Pt = { x: -0.55, y: -0.835 };

/**
 * The specular stripe, placed by the LIGHT rather than by a fixed side.
 *
 * A single fixed-side highlight is what makes a bent cable look seamed: coming
 * back round a U-turn the lit edge is physically the OTHER edge, so a constant
 * offset snaps across the cable. Here each sample is offset along ±normal
 * according to `normal · light`, the width tapers to nothing as that dot
 * approaches zero, and each contiguous lit run becomes its own subpath. The
 * highlight therefore travels around a bend and fades out at the tangent point
 * instead of jumping.
 */
export function lightRibbon(poly: Pt[], halfW: number, offset: number): string {
  if (poly.length < 4) return '';
  const nrm = normals(poly);
  const dots = poly.map((_, i) => nrm[i].x * LIGHT.x + nrm[i].y * LIGHT.y);
  const EPS = 0.12;
  let d = '';
  let i = 0;
  while (i < poly.length) {
    if (Math.abs(dots[i]) <= EPS) {
      i++;
      continue;
    }
    const sgn = Math.sign(dots[i]);
    let j = i;
    while (j + 1 < poly.length && Math.abs(dots[j + 1]) > EPS && Math.sign(dots[j + 1]) === sgn) j++;
    const n = j - i + 1;
    if (n >= 4) {
      let left = '';
      let right = '';
      for (let k = 0; k < n; k++) {
        const idx = i + k;
        const p = poly[idx];
        const nv = nrm[idx];
        const s = Math.abs(dots[idx]);
        // strength: 0 at the tangent point, full when the face aims at the light
        const strength = Math.min(1, (s - EPS) / 0.4);
        // fade the first/last few samples so a run has no hard butt end
        const endFade = Math.min(1, Math.min(k, n - 1 - k) / 3);
        const w = halfW * strength * endFade;
        const off = offset * sgn * s;
        const lx = p.x + nv.x * (off + w);
        const ly = p.y + nv.y * (off + w);
        const rx = p.x + nv.x * (off - w);
        const ry = p.y + nv.y * (off - w);
        left += `${k === 0 ? 'M' : 'L'}${lx.toFixed(2)} ${ly.toFixed(2)}`;
        right = `L${rx.toFixed(2)} ${ry.toFixed(2)}` + right;
      }
      d += `${left}${right}Z`;
    }
    i = j + 1;
  }
  return d;
}

/** A drooping run between two points — every unsupported cable needs one. */
export function catenary(a: Pt, b: Pt, sag: number, n = 5): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // sin() is a close-enough, well-behaved stand-in for cosh over one span.
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + Math.sin(Math.PI * t) * sag });
  }
  return out;
}

function mk(d: string): SkPath | null {
  return d ? Skia.Path.MakeFromSVGString(d) : null;
}

/* ══ CABLE ═════════════════════════════════════════════════════════════════ */

export type CableProps = {
  /** Waypoints in canvas units. Splined, so 3–5 points is usually plenty. */
  points: Pt[];
  /** Outside diameter in canvas units. Keep ≥6 or it stops reading as a cable. */
  d?: number;
  /** Jacket colour — a CI_JACKET key or any hex. */
  jacket?: CiJacket | string;
  /** Drop a contact shadow (turn off for cables in free air). */
  shadow?: boolean;
  /** Matte jackets (rubber mains, gaffer'd runs) get a duller highlight. */
  matte?: boolean;
  opacity?: number;
  /**
   * 0..1 — how much of the run is installed. Drives the lab's DRAW language
   * (motion.tsx) in Skia: the body strokes are trimmed with Skia's `end`, and
   * the sheen fades up behind the leading edge. Pass a Reanimated shared value
   * to animate it; omit for a fully-installed cable.
   */
  reveal?: SharedValue<number> | number;
};

/**
 * One jacketed cable. Five stacked fills: contact shadow, jacket edge (core
 * shadow), body, specular stripe, bounce rim. That stack is the whole trick —
 * remove the specular and it collapses back into a flat noodle.
 */
export function Cable({ points, d = 9, jacket = 'neutral', shadow = true, matte = false, opacity = 1, reveal }: CableProps) {
  const base = (CI_JACKET as Record<string, string>)[jacket as string] ?? (jacket as string);
  const poly = useMemo(() => spline(points, 18), [points]);

  // One stable shared value backs the static/number cases, so the hook order
  // never depends on whether the caller animates this cable.
  const ownReveal = useSharedValue(typeof reveal === 'number' ? reveal : 1);
  useEffect(() => {
    if (typeof reveal === 'number') ownReveal.value = reveal;
    else if (reveal == null) ownReveal.value = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);
  const rv = typeof reveal === 'object' && reveal != null ? reveal : ownReveal;
  const specBase = matte ? 0.34 : 0.62;
  // The sheen lags the leading edge: a highlight on cable that is not installed
  // yet is the giveaway that the reveal is a trick rather than an install.
  const specOpacity = useDerivedValue(() => specBase * Math.max(0, Math.min(1, (rv.value - 0.18) / 0.82)));
  const bounceOpacity = useDerivedValue(() => 0.55 * Math.max(0, Math.min(1, (rv.value - 0.18) / 0.82)));

  const geo = useMemo(() => {
    const line = polyPath(poly);
    return {
      line: mk(line),
      // Offset copy for the contact shadow — a translate would move the blur too.
      shadowLine: mk(polyPath(poly.map((p) => ({ x: p.x + d * 0.18, y: p.y + d * 0.34 })))),
      spec: mk(lightRibbon(poly, d * 0.17, d * 0.26)),
      bounce: mk(lightRibbon(poly, d * 0.07, -d * 0.4)),
    };
  }, [poly, d]);
  if (!geo.line) return null;
  return (
    <Group opacity={opacity}>
      {shadow && geo.shadowLine ? (
        <Path path={geo.shadowLine} style="stroke" strokeWidth={d} strokeCap="round" strokeJoin="round" color={SHADOW} end={rv}>
          <BlurMask blur={d * 0.38} style="normal" />
        </Path>
      ) : null}
      {/* Strokes, not ribbons, for the body: round caps end a cut run like a
          tube instead of a slab, a stroke cannot fold in on itself where the
          bend radius approaches the cable radius, and `end` trims it for the
          install-itself reveal. */}
      <Path path={geo.line} style="stroke" strokeWidth={d} strokeCap="round" strokeJoin="round" color={shade(base, 0.66)} end={rv} />
      <Path path={geo.line} style="stroke" strokeWidth={d * 0.82} strokeCap="round" strokeJoin="round" color={base} end={rv} />
      {/* underside, away from the light — deepens the round */}
      {geo.bounce ? <Path path={geo.bounce} color={shade(base, 0.45)} opacity={bounceOpacity} /> : null}
      {geo.spec ? (
        <Path path={geo.spec} color={tint(base, matte ? 0.34 : 0.66)} opacity={specOpacity}>
          <BlurMask blur={d * 0.16} style="normal" />
        </Path>
      ) : null}
    </Group>
  );
}

/* ══ CONNECTOR ENDS ════════════════════════════════════════════════════════ */

export type ConnectorKind = 'xlr' | 'trs' | 'speakon' | 'powercon' | 'rj45' | 'iec' | 'bare';

/**
 * A termination: a moulded STRAIN-RELIEF BOOT where the jacket enters, then the
 * connector body. A cable that just stops in mid-air is the single loudest tell
 * that a drawing was made by someone who has not held one, so nothing in this
 * lab should end without this.
 *
 * `angle` is degrees; 0 points the connector to the right.
 */
export function ConnectorEnd({
  kind = 'xlr',
  x,
  y,
  angle = 0,
  scale = 1,
  jacket = 'neutral',
}: {
  kind?: ConnectorKind;
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  jacket?: CiJacket | string;
}) {
  const base = (CI_JACKET as Record<string, string>)[jacket as string] ?? (jacket as string);
  const transform = [{ translateX: x }, { translateY: y }, { rotate: (angle * Math.PI) / 180 }, { scale }];
  // Design space: the cable arrives from the LEFT at 0,0; the connector runs right.
  return (
    <Group transform={transform}>
      {/* strain-relief boot — tapered, ribbed, in the jacket's own colour family */}
      <Path path={mk('M0 -5.4 L7 -6.4 L7 6.4 L0 5.4 Z')!} color={shade(base, 0.5)} />
      <Path path={mk('M0 -5.4 L7 -6.4 L7 -2 L0 -1.6 Z')!} color={tint(base, 0.18)} opacity={0.55} />
      {[2, 4].map((bx) => (
        <Path key={bx} path={mk(`M${bx} -6 L${bx + 0.9} -6 L${bx + 0.9} 6 L${bx} 6 Z`)!} color={shade(base, 0.75)} opacity={0.6} />
      ))}
      {kind === 'xlr' ? <XlrBody /> : null}
      {kind === 'trs' ? <TrsBody /> : null}
      {kind === 'speakon' ? <SpeakonBody /> : null}
      {kind === 'powercon' ? <PowerconBody /> : null}
      {kind === 'rj45' ? <Rj45Body /> : null}
      {kind === 'iec' ? <IecBody /> : null}
    </Group>
  );
}

/** Barrel + latch + pin cup — the XLR silhouette everyone recognises. */
function XlrBody() {
  return (
    <>
      <RoundedRect x={7} y={-7.5} width={19} height={15} r={3}>
        <LinearGradient start={vec(7, -7.5)} end={vec(7, 7.5)} colors={[METAL_HI, METAL_MID, METAL_LO]} positions={[0, 0.45, 1]} />
      </RoundedRect>
      {/* latch button on the shell */}
      <RoundedRect x={11} y={-10} width={6} height={3.4} r={1.4} color={METAL_MID} />
      {/* pin cup */}
      <RoundedRect x={25} y={-6.2} width={7} height={12.4} r={2.4}>
        <LinearGradient start={vec(25, -6.2)} end={vec(25, 6.2)} colors={[METAL_MID, METAL_LO]} />
      </RoundedRect>
      <Circle cx={28.5} cy={-2.4} r={1.15} color="#101216" />
      <Circle cx={28.5} cy={2.4} r={1.15} color="#101216" />
      <Circle cx={31} cy={0} r={1.15} color="#101216" />
      <Path path={mk('M8 -6.6 L25 -6.6')!} style="stroke" strokeWidth={1.1} color={RIM} />
    </>
  );
}

function TrsBody() {
  return (
    <>
      <RoundedRect x={7} y={-5.6} width={11} height={11.2} r={2.4}>
        <LinearGradient start={vec(7, -5.6)} end={vec(7, 5.6)} colors={[METAL_HI, METAL_LO]} />
      </RoundedRect>
      {/* the shaft, with the two insulator rings that make it a TRS */}
      <RoundedRect x={18} y={-2.5} width={15} height={5} r={2.4}>
        <LinearGradient start={vec(18, -2.5)} end={vec(18, 2.5)} colors={[METAL_HI, METAL_MID, METAL_LO]} positions={[0, 0.4, 1]} />
      </RoundedRect>
      <Path path={mk('M24 -2.5 L25 -2.5 L25 2.5 L24 2.5 Z')!} color="#15171b" />
      <Path path={mk('M27.5 -2.5 L28.5 -2.5 L28.5 2.5 L27.5 2.5 Z')!} color="#15171b" />
      <Circle cx={32.6} cy={0} r={2.5} color={METAL_HI} opacity={0.9} />
      <Path path={mk('M8 -4.6 L17 -4.6')!} style="stroke" strokeWidth={1} color={RIM} />
    </>
  );
}

function SpeakonBody() {
  return (
    <>
      <RoundedRect x={7} y={-8} width={20} height={16} r={4} color="#1b1d22" />
      <RoundedRect x={8.5} y={-6.6} width={17} height={13.2} r={3}>
        <LinearGradient start={vec(8.5, -6.6)} end={vec(8.5, 6.6)} colors={['#4a4d55', '#23262c']} />
      </RoundedRect>
      {/* the twist-lock collar keyway */}
      <Circle cx={22} cy={0} r={5.6} color="#12141a" />
      <Circle cx={22} cy={0} r={5.6} color={METAL_MID} style="stroke" strokeWidth={1.4} />
      <Path path={mk('M22 -5.6 L24 -3 L20 -3 Z')!} color={METAL_HI} opacity={0.8} />
      <Path path={mk('M9.5 -5.6 L24 -5.6')!} style="stroke" strokeWidth={1.1} color={RIM} />
    </>
  );
}

function PowerconBody() {
  return (
    <>
      <RoundedRect x={7} y={-8} width={21} height={16} r={4} color="#141b24" />
      <RoundedRect x={8.5} y={-6.6} width={18} height={13.2} r={3}>
        <LinearGradient start={vec(8.5, -6.6)} end={vec(8.5, 6.6)} colors={['#2f5f8a', '#16283a']} />
      </RoundedRect>
      <Circle cx={22} cy={0} r={5.4} color="#0e1620" />
      <Circle cx={22} cy={0} r={5.4} color="#5d87ad" style="stroke" strokeWidth={1.3} />
      <Path path={mk('M9.5 -5.6 L25 -5.6')!} style="stroke" strokeWidth={1.1} color={RIM} />
    </>
  );
}

function Rj45Body() {
  return (
    <>
      <RoundedRect x={7} y={-6} width={17} height={12} r={1.8}>
        <LinearGradient start={vec(7, -6)} end={vec(7, 6)} colors={['#c9ccd2', '#7c8088', '#40444b']} positions={[0, 0.45, 1]} />
      </RoundedRect>
      {/* the latch tab — the RJ45 tell */}
      <Path path={mk('M11 -6 L18 -6 L19.5 -10.5 L12.5 -10.5 Z')!} color="#9aa0a8" />
      <Path path={mk('M11 -6 L18 -6 L19.5 -10.5 L12.5 -10.5 Z')!} style="stroke" strokeWidth={0.9} color="#5c6068" />
      {/* gold contacts */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Path key={i} path={mk(`M${19 + i * 0.0} 0 Z`)!} color="transparent" />
      ))}
      {[13, 14.6, 16.2, 17.8, 19.4, 21, 22.6].map((cx, i) => (
        <RoundedRect key={i} x={cx} y={-3.4} width={1} height={6.8} r={0.4} color="#c9a13c" opacity={0.85} />
      ))}
      <Path path={mk('M8 -4.8 L23 -4.8')!} style="stroke" strokeWidth={1} color={RIM} />
    </>
  );
}

function IecBody() {
  return (
    <>
      <RoundedRect x={7} y={-8} width={20} height={16} r={2.6}>
        <LinearGradient start={vec(7, -8)} end={vec(7, 8)} colors={['#3a3d44', '#191b20']} />
      </RoundedRect>
      {/* the chamfered corners that make an IEC an IEC */}
      <Path path={mk('M27 -8 L27 8 L23 5.5 L23 -5.5 Z')!} color="#101217" />
      {[-3.6, 0, 3.6].map((cy) => (
        <RoundedRect key={cy} x={23.5} y={cy - 1.1} width={3} height={2.2} r={0.8} color="#0b0c0f" />
      ))}
      <Path path={mk('M8 -6.6 L24 -6.6')!} style="stroke" strokeWidth={1.1} color={RIM} />
    </>
  );
}

/* ══ ZIP TIE ═══════════════════════════════════════════════════════════════ */

/**
 * A cable tie, drawn as the object it is: a nylon strap wrapped round a bundle,
 * a RATCHET HEAD block where the tail feeds through, and a trimmed tail. The
 * head is the whole point — a plain ring reads as a rubber band. The strap also
 * carries its ladder teeth, and the bundle it cinches should be drawn deformed
 * (see `BundleCrossSection` `squeeze`).
 *
 * Cross-section view: you are looking down the length of the bundle. Use this
 * ONLY for end-on views (the tension mechanic). In a side-on scene — a run
 * along a tray, a drop down a wall — reach for `ZipTieSide` instead: a ring
 * drawn over a side-on run reads as an eyelet, not a tie.
 */
export function ZipTie({
  cx,
  cy,
  rx,
  ry,
  strap = 3.4,
  angle = 0,
  tail = 'trimmed',
  overTightened = false,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Strap width. Real ties are 2.5–4.8mm — keep this visibly flat, not a wire. */
  strap?: number;
  /** Degrees; where the head sits on the bundle. 0 = top. */
  angle?: number;
  /** 'trimmed' = cut flush at the head (the professional finish). */
  tail?: 'trimmed' | 'long' | 'none';
  /** Bites into the jacket — used when the lesson is teaching over-tightening. */
  overTightened?: boolean;
}) {
  const loop = useMemo(() => {
    // Ellipse as a polyline so the strap is a ribbon like everything else.
    const pts: Pt[] = [];
    const n = 72;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return pts;
  }, [cx, cy, rx, ry]);

  const band = useMemo(() => mk(ribbon(loop, strap / 2)), [loop, strap]);
  const bandLit = useMemo(() => mk(lightRibbon(loop, strap * 0.2, strap * 0.22)), [loop, strap]);
  const teeth = useMemo(() => {
    // Ladder teeth on the strap — short ticks across its width.
    const p = Skia.Path.Make();
    const n = 46;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2 - Math.PI / 2;
      const c = Math.cos(t);
      const s = Math.sin(t);
      const px = cx + c * rx;
      const py = cy + s * ry;
      // normal of an ellipse point, roughly
      const nx = c / rx;
      const ny = s / ry;
      const l = Math.hypot(nx, ny) || 1;
      p.moveTo(px - (nx / l) * (strap * 0.38), py - (ny / l) * (strap * 0.38));
      p.lineTo(px + (nx / l) * (strap * 0.38), py + (ny / l) * (strap * 0.38));
    }
    return p;
  }, [cx, cy, rx, ry, strap]);

  // A real tie head is a chunky block — clearly wider and deeper than the strap
  // it locks. Undersize it and the tie collapses back into a ring.
  const headW = strap * 3.1;
  const headH = strap * 2.6;
  const hx = cx + Math.sin((angle * Math.PI) / 180) * rx;
  const hy = cy - Math.cos((angle * Math.PI) / 180) * ry;

  return (
    <Group>
      {/* the strap, wrapping behind/around the bundle */}
      {band ? <Path path={band} color={shade(NYLON_LO, 0.5)} /> : null}
      {band ? <Path path={band} color={NYLON_LO} opacity={0.96} /> : null}
      <Path path={teeth} style="stroke" strokeWidth={0.55} color={shade(NYLON_LO, 0.5)} opacity={0.75} />
      {bandLit ? <Path path={bandLit} color={NYLON_MID} opacity={0.75} /> : null}

      {/* ── the ratchet head ── */}
      <Group transform={[{ translateX: hx }, { translateY: hy }, { rotate: (angle * Math.PI) / 180 }]}>
        <RoundedRect x={-headW / 2 + 0.6} y={-headH / 2 + 0.8} width={headW} height={headH} r={strap * 0.34} color="rgba(0,0,0,0.42)">
          <BlurMask blur={1.2} style="normal" />
        </RoundedRect>
        <RoundedRect x={-headW / 2} y={-headH / 2} width={headW} height={headH} r={strap * 0.34}>
          <LinearGradient
            start={vec(-headW / 2, -headH / 2)}
            end={vec(headW / 2, headH / 2)}
            colors={[NYLON_HI, NYLON_MID, NYLON_LO]}
            positions={[0, 0.45, 1]}
          />
        </RoundedRect>
        {/* the slot the tail feeds through — recessed, the head's signature */}
        <RoundedRect x={-strap * 0.62} y={-headH / 2 + strap * 0.28} width={strap * 1.24} height={headH - strap * 0.56} r={strap * 0.2} color="#4c4d55" />
        <RoundedRect x={-strap * 0.44} y={-headH / 2 + strap * 0.42} width={strap * 0.88} height={headH - strap * 0.84} r={strap * 0.14} color="#2e2f36" />
        {/* chamfer highlight, upper-left */}
        <Path path={mk(`M${-headW / 2 + 0.5} ${-headH / 2 + 0.5} L${headW / 2 - 0.5} ${-headH / 2 + 0.5}`)!} style="stroke" strokeWidth={0.8} color={RIM} />
        {/* the trimmed tail stub poking out of the slot */}
        {tail !== 'none' ? (
          <>
            <Path
              path={mk(
                tail === 'trimmed'
                  ? `M${-strap * 0.5} ${headH / 2} L${strap * 0.5} ${headH / 2} L${strap * 0.5} ${headH / 2 + strap * 0.5} L${-strap * 0.5} ${headH / 2 + strap * 0.5} Z`
                  : `M${-strap * 0.5} ${headH / 2} L${strap * 0.5} ${headH / 2} L${strap * 0.62} ${headH / 2 + strap * 3.4} L${-strap * 0.38} ${headH / 2 + strap * 3.4} Z`,
              )!}
              color={NYLON_MID}
            />
            {tail === 'long'
              ? [1, 1.7, 2.4, 3.1].map((k) => (
                  <Path
                    key={k}
                    path={mk(`M${-strap * 0.45} ${headH / 2 + strap * k} L${strap * 0.55} ${headH / 2 + strap * k}`)!}
                    style="stroke"
                    strokeWidth={0.5}
                    color={NYLON_LO}
                  />
                ))
              : null}
          </>
        ) : null}
      </Group>

      {overTightened ? (
        <Group>
          {[0, 90, 180, 270].map((a) => {
            const r = (a * Math.PI) / 180;
            return <Circle key={a} cx={cx + Math.cos(r) * rx} cy={cy + Math.sin(r) * ry} r={strap * 0.5} color="#ff9b8f" opacity={0.55} />;
          })}
        </Group>
      ) : null}
    </Group>
  );
}

/**
 * A cable tie seen from the SIDE, cinched across a bundle that runs left-right.
 *
 * This is the view that actually teaches the object. A cross-section is an
 * engineering diagram — looking straight down the cable axis a flat strap is
 * barely a line, so the thing that makes a tie a tie (the head, the tail, the
 * band hugging round a bundle) has nowhere to show. Side-on, all three read.
 *
 * Draw this AFTER the bundle's cables: the band is in front of them.
 */
export function ZipTieSide({
  cx,
  cy,
  halfH,
  strap = 4,
  tail = 'trimmed',
  headAt = 'top',
  overTightened = false,
}: {
  cx: number;
  /** Centre of the bundle. */
  cy: number;
  /** Half the bundle's height where the tie sits. */
  halfH: number;
  strap?: number;
  tail?: 'trimmed' | 'long' | 'none';
  headAt?: 'top' | 'bottom';
  overTightened?: boolean;
}) {
  const dir = headAt === 'top' ? -1 : 1;
  // The band bows across the bundle's round front face — that bow is the whole
  // reason it reads as wrapped rather than painted on.
  const bow = strap * 0.5;
  const arc = useMemo(() => {
    const pts: Pt[] = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: cx + Math.sin(t * Math.PI) * bow, y: cy - halfH * 1.04 + t * halfH * 2.08 });
    }
    return pts;
  }, [cx, cy, halfH, bow]);
  const band = useMemo(() => mk(ribbon(arc, strap / 2)), [arc, strap]);
  const bandLit = useMemo(() => mk(lightRibbon(arc, strap * 0.19, strap * 0.2)), [arc, strap]);
  const teeth = useMemo(() => {
    const p = Skia.Path.Make();
    const n = Math.max(4, Math.round((halfH * 2) / (strap * 0.62)));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const y = cy - halfH * 1.04 + t * halfH * 2.08;
      const x = cx + Math.sin(t * Math.PI) * bow;
      p.moveTo(x - strap * 0.42, y);
      p.lineTo(x + strap * 0.42, y);
    }
    return p;
  }, [cx, cy, halfH, strap, bow]);

  // HEAD PROPORTIONS (from reference photography, 2026-08-25): the head is a
  // compact block only a little wider than the strap and about twice as long —
  // NOT a lozenge standing off the bundle. The band runs THROUGH it, so its long
  // axis continues the band's direction and the tail leaves the far face.
  const headW = strap * 1.72;
  const headH = strap * 2.05;
  const hy = cy + dir * (halfH * 1.04 + headH * 0.4);

  // A hanging tail: a real off-cut curls away under its own weight and carries
  // the ratchet ladder on its face. Local space, origin at the head's far face.
  const tailPoly = useMemo(
    () =>
      spline(
        [
          { x: 0, y: 0 },
          { x: strap * 0.25, y: dir * strap * 1.5 },
          { x: strap * 1.15, y: dir * strap * 2.7 },
          { x: strap * 2.5, y: dir * strap * 3.3 },
        ],
        14,
      ),
    [strap, dir],
  );
  const tailBand = useMemo(() => mk(ribbon(tailPoly, strap * 0.4)), [tailPoly, strap]);
  const tailTeeth = useMemo(() => {
    const p = Skia.Path.Make();
    const nn = normals(tailPoly);
    for (let i = 3; i < tailPoly.length - 2; i += 3) {
      const q = tailPoly[i];
      const n = nn[i];
      p.moveTo(q.x - n.x * strap * 0.3, q.y - n.y * strap * 0.3);
      p.lineTo(q.x + n.x * strap * 0.3, q.y + n.y * strap * 0.3);
    }
    return p;
  }, [tailPoly, strap]);

  return (
    <Group>
      {/* the band, with its own shadow onto the bundle it is squeezing */}
      {band ? (
        <Path path={band} color="rgba(0,0,0,0.5)">
          <BlurMask blur={strap * 0.5} style="normal" />
        </Path>
      ) : null}
      {band ? <Path path={band} color={shade(NYLON_LO, 0.45)} /> : null}
      {band ? <Path path={band} color={NYLON_MID} opacity={0.95} /> : null}
      {/* the ratchet ladder — clearly visible on the reference photography, and
          the texture that separates a tie from a plain band of tape */}
      <Path path={teeth} style="stroke" strokeWidth={0.6} color={shade(NYLON_LO, 0.5)} opacity={0.85} />
      {bandLit ? <Path path={bandLit} color={NYLON_HI} opacity={0.75} /> : null}

      {/* ── the ratchet head, proud of the bundle ──
          x is `cx`, NOT cx+bow: the bow is a sin() that returns to zero at both
          ends of the arc, so the strap leaves the bundle on the centreline and
          the head has to meet it there or it floats off the strap. */}
      <Group transform={[{ translateX: cx }, { translateY: hy }]}>
        <RoundedRect x={-headW / 2 + 0.7} y={-headH / 2 + 0.9} width={headW} height={headH} r={strap * 0.3} color="rgba(0,0,0,0.5)">
          <BlurMask blur={1.4} style="normal" />
        </RoundedRect>
        <RoundedRect x={-headW / 2} y={-headH / 2} width={headW} height={headH} r={strap * 0.3}>
          <LinearGradient
            start={vec(-headW / 2, -headH / 2)}
            end={vec(headW / 2, headH / 2)}
            colors={[NYLON_HI, NYLON_MID, shade(NYLON_LO, 0.25)]}
            positions={[0, 0.4, 1]}
          />
        </RoundedRect>
        {/* the slot the strap feeds through, running the head's long axis */}
        <RoundedRect x={-strap * 0.5} y={-headH / 2 + strap * 0.34} width={strap} height={headH - strap * 0.68} r={strap * 0.18} color="#3f4048" />
        <RoundedRect x={-strap * 0.34} y={-headH / 2 + strap * 0.5} width={strap * 0.68} height={headH - strap} r={strap * 0.12} color="#232429" />
        {/* the pawl bar across the slot — the detail that says "ratchet" */}
        <RoundedRect x={-strap * 0.5} y={dir < 0 ? headH / 2 - strap * 1.1 : -headH / 2 + strap * 0.5} width={strap} height={strap * 0.4} r={0.4} color={NYLON_MID} opacity={0.75} />
        <RoundedRect x={-headW / 2 + 0.4} y={-headH / 2 + 0.4} width={headW - 0.8} height={0.9} r={0.45} color={RIM} />
      </Group>

      {/* THE TAIL. 'trimmed' is the professional finish and means CUT FLUSH at
          the head — nothing protrudes, so nothing is drawn. A protruding stub
          would quietly teach the sloppy version as correct. 'long' is the
          hazard: an off-cut left on to snag hands and gear. */}
      {tail === 'long' ? (
        <Group transform={[{ translateX: cx }, { translateY: hy + dir * headH * 0.5 }]}>
          {tailBand ? <Path path={tailBand} color={shade(NYLON_LO, 0.35)} /> : null}
          {tailBand ? <Path path={tailBand} color={NYLON_MID} opacity={0.95} /> : null}
          <Path path={tailTeeth} style="stroke" strokeWidth={0.55} color={shade(NYLON_LO, 0.45)} opacity={0.8} />
        </Group>
      ) : null}

      {overTightened ? (
        <>
          <Circle cx={cx + bow * 1.4} cy={cy - halfH * 0.6} r={strap * 0.46} color="#ff9b8f" opacity={0.55}>
            <BlurMask blur={strap * 0.3} style="normal" />
          </Circle>
          <Circle cx={cx + bow * 1.4} cy={cy + halfH * 0.6} r={strap * 0.46} color="#ff9b8f" opacity={0.55}>
            <BlurMask blur={strap * 0.3} style="normal" />
          </Circle>
        </>
      ) : null}
    </Group>
  );
}

/**
 * Hook-and-loop wrap — the reusable alternative the lab teaches alongside ties.
 * Reads as fabric: matte, wider than a tie, with a nap texture and no head.
 */
export function VelcroWrap({ cx, cy, rx, ry, band = 6, color = '#39566e' }: { cx: number; cy: number; rx: number; ry: number; band?: number; color?: string }) {
  const loop = useMemo(() => {
    const pts: Pt[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return pts;
  }, [cx, cy, rx, ry]);
  const outer = useMemo(() => mk(ribbon(loop, band / 2)), [loop, band]);
  const nap = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      const px = cx + Math.cos(t) * rx;
      const py = cy + Math.sin(t) * ry;
      p.moveTo(px - 0.6, py - 0.6);
      p.lineTo(px + 0.6, py + 0.6);
    }
    return p;
  }, [cx, cy, rx, ry]);
  return (
    <Group>
      {outer ? <Path path={outer} color={shade(color, 0.45)} /> : null}
      {outer ? <Path path={outer} color={color} opacity={0.9} /> : null}
      <Path path={nap} style="stroke" strokeWidth={0.7} color={tint(color, 0.3)} opacity={0.35} />
      {/* the folded-over tab end */}
      <RoundedRect x={cx - band * 0.8} y={cy - ry - band * 0.75} width={band * 1.6} height={band * 0.9} r={1.4} color={tint(color, 0.12)} />
    </Group>
  );
}

/* ══ BUNDLE ════════════════════════════════════════════════════════════════ */

/**
 * A loom seen end-on. `squeeze` 0..1 ovalises the cables and closes the gaps —
 * this is what a tie actually does to a bundle, and drawing it is how the
 * over-tightening lesson stops being an abstraction.
 */
export function BundleCrossSection({
  cx,
  cy,
  r = 7,
  jackets = ['mic', 'line', 'network', 'power'],
  spread = 0,
  squeeze = 0,
}: {
  cx: number;
  cy: number;
  r?: number;
  jackets?: (CiJacket | string)[];
  /** Gap between cables when nothing is holding them. */
  spread?: number;
  /** 0 = round, 1 = hard pinch. */
  squeeze?: number;
}) {
  const offs: Pt[] = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];
  const gap = r * (0.94 + spread * 0.8);
  return (
    <Group>
      {jackets.slice(0, 4).map((j, i) => {
        const base = (CI_JACKET as Record<string, string>)[j as string] ?? (j as string);
        const wide = i === 0 || i === 3;
        const rx = r * (1 + (wide ? 0.34 : -0.26) * squeeze);
        const ry = r * (1 + (wide ? -0.26 : 0.34) * squeeze);
        const px = cx + offs[i].x * gap;
        const py = cy + offs[i].y * gap;
        const oval = (kx: number, ky: number) =>
          `M${px - rx * kx} ${py} a${rx * kx} ${ry * ky} 0 1 0 ${rx * kx * 2} 0 a${rx * kx} ${ry * ky} 0 1 0 ${-rx * kx * 2} 0 Z`;
        return (
          <Group key={i}>
            {/* A CUT CABLE, not a ball: dark jacket edge, jacket wall, then a
                dark core where the conductors are. The visible wall thickness is
                what stops a cross-section reading as a gumball. */}
            <Path path={mk(oval(1, 1))!} color={shade(base, 0.72)} />
            <Path path={mk(oval(0.9, 0.9))!}>
              <LinearGradient
                start={vec(px - rx, py - ry)}
                end={vec(px + rx * 0.6, py + ry)}
                colors={[tint(base, 0.2), base, shade(base, 0.5)]}
                positions={[0, 0.42, 1]}
              />
            </Path>
            <Path path={mk(oval(0.52, 0.52))!} color={shade(base, 0.8)} opacity={0.9} />
            <Path path={mk(oval(0.52, 0.52))!} style="stroke" strokeWidth={0.5} color={shade(base, 0.3)} opacity={0.7} />
            {/* broad, soft sheen across the upper-left of the jacket wall */}
            <Path path={mk(oval(0.9, 0.9))!} color={tint(base, 0.55)} opacity={0.16}>
              <BlurMask blur={r * 0.3} style="normal" />
            </Path>
          </Group>
        );
      })}
    </Group>
  );
}

/* ══ RACK DRESSING ═════════════════════════════════════════════════════════ */

/**
 * The patch-panel WATERFALL — the signature of a well-dressed rack.
 *
 * Every port's cable leaves on the same generous radius, turns once, and joins
 * a common loom that runs off to a vertical manager. The tell of a good install
 * is that the curves NEST: no cable crosses another, none is strained at the
 * boot, and the loom grows evenly as ports join it. This is the single most
 * recognisable "done properly" image in the reference photography, and it is
 * impossible to draw with straight strokes.
 *
 * `dir` is which way the loom leaves: -1 to the left, +1 to the right.
 */
export function PatchFan({
  x0,
  panelY,
  ports = 12,
  pitch = 9,
  loomY,
  exitX,
  dir = 1,
  d = 4.2,
  jacket = 'network',
  stack = 3,
}: {
  /** x of the first port. */
  x0: number;
  /** y of the panel face the cables leave from. */
  panelY: number;
  ports?: number;
  pitch?: number;
  /** y of the loom the cables gather into. */
  loomY: number;
  /** where the loom leaves the frame. */
  exitX: number;
  dir?: 1 | -1;
  d?: number;
  jacket?: CiJacket | string;
  /** how many cables deep the loom stacks before starting a new layer. */
  stack?: number;
}) {
  const BOOT = 3.4;
  const runs = useMemo(() => {
    const out: Pt[][] = [];
    for (let i = 0; i < ports; i++) {
      const px = x0 + i * pitch;
      const rank = dir > 0 ? ports - 1 - i : i;
      const lane = loomY + (rank % stack) * d * 0.9;
      // Every cable leaves its boot straight, then turns on ONE generous
      // quarter-arc that lands tangent to its lane. Because the radius is set
      // by the panel-to-lane distance, every arc is the same shape simply
      // shifted along the panel — which is what makes the reference photo read
      // as a waterfall instead of a comb. A short radius here is the classic
      // strained-boot install the lab teaches against.
      const R = Math.max(6, Math.abs(lane - panelY) - BOOT);
      const down = lane > panelY ? 1 : -1;
      const pts: Pt[] = [{ x: px, y: panelY }, { x: px, y: panelY + down * BOOT }];
      const STEPS = 7;
      for (let s = 1; s <= STEPS; s++) {
        const t = (s / STEPS) * (Math.PI / 2);
        pts.push({
          x: px + dir * R * (1 - Math.cos(t)),
          y: panelY + down * (BOOT + R * Math.sin(t)),
        });
      }
      pts.push({ x: exitX, y: lane });
      out.push(pts);
    }
    return out;
  }, [x0, panelY, ports, pitch, loomY, exitX, dir, d, stack]);
  const base = (CI_JACKET as Record<string, string>)[jacket as string] ?? (jacket as string);
  return (
    <Group>
      {runs.map((pts, i) => (
        <Cable key={i} points={pts} d={d} jacket={jacket} shadow={false} />
      ))}
      {/* strain-relief boots at the panel — no run starts in mid-air either */}
      {Array.from({ length: ports }, (_, i) => {
        const px = x0 + i * pitch;
        const down = loomY > panelY ? 1 : -1;
        return (
          <RoundedRect
            key={i}
            x={px - d * 0.62}
            y={down > 0 ? panelY - d * 0.4 : panelY - d * 1.2}
            width={d * 1.24}
            height={d * 1.6}
            r={d * 0.32}
            color={shade(base, 0.55)}
          />
        );
      })}
    </Group>
  );
}

/**
 * A horizontal cable manager: the moulded D-ring fingers a loom is threaded
 * through so it can be re-dressed without cutting anything. Drawn open (no
 * cover) because the fingers are the teaching content.
 */
export function HorizontalManager({
  x,
  y,
  w,
  h = 16,
  fingers = 5,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  fingers?: number;
}) {
  return (
    <Group>
      {/* the 1U body behind the fingers */}
      <RoundedRect x={x} y={y} width={w} height={h} r={2}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={['#2a2d33', '#15171b']} />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={1} r={0.5} color="rgba(255,255,255,0.16)" />
      {Array.from({ length: fingers }, (_, i) => {
        const fx = x + (w / (fingers + 1)) * (i + 1);
        const fw = h * 0.42;
        return (
          <Group key={i}>
            {/* the D — an open loop, mouth facing the rack front */}
            <Path
              path={
                mk(
                  `M${fx - fw / 2} ${y + 1.5} L${fx - fw / 2} ${y + h - 4} a${fw / 2} ${fw / 2} 0 0 0 ${fw} 0 L${fx + fw / 2} ${y + 1.5}`,
                )!
              }
              style="stroke"
              strokeWidth={2.4}
              color="#0f1013"
            />
            <Path
              path={
                mk(
                  `M${fx - fw / 2} ${y + 1.5} L${fx - fw / 2} ${y + h - 4} a${fw / 2} ${fw / 2} 0 0 0 ${fw} 0 L${fx + fw / 2} ${y + 1.5}`,
                )!
              }
              style="stroke"
              strokeWidth={1.3}
              color="#43474e"
            />
          </Group>
        );
      })}
    </Group>
  );
}

/**
 * A vertical cable manager down the side of a rack — where the references send
 * every loom so nothing crosses the equipment face or blocks front-to-back air.
 */
export function VerticalManager({ x, y, w = 16, h, fingers = 6 }: { x: number; y: number; w?: number; h: number; fingers?: number }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={3}>
        <LinearGradient start={vec(x, y)} end={vec(x + w, y)} colors={['#2e3138', '#17191d']} />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={1} height={h} r={0.5} color="rgba(255,255,255,0.14)" />
      {Array.from({ length: fingers }, (_, i) => {
        const fy = y + (h / (fingers + 1)) * (i + 1);
        const fh = w * 0.44;
        return (
          <Path
            key={i}
            path={mk(`M${x + 1.5} ${fy - fh / 2} L${x + w - 4} ${fy - fh / 2} a${fh / 2} ${fh / 2} 0 0 1 0 ${fh} L${x + 1.5} ${fy + fh / 2}`)!}
            style="stroke"
            strokeWidth={1.4}
            color="#454951"
          />
        );
      })}
    </Group>
  );
}

/* ══ PATHWAY HARDWARE ══════════════════════════════════════════════════════ */

/** Ladder / basket / solid-bottom tray, drawn side-on with real metal. */
export function CableTray({
  x,
  y,
  w,
  h = 16,
  kind = 'ladder',
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  kind?: 'ladder' | 'basket' | 'solid';
}) {
  return (
    <Group>
      {/* the far side rail, dimmed so the tray has depth */}
      <RoundedRect x={x} y={y - h * 0.28} width={w} height={h * 0.4} r={1.5} color="#2b2e34" />
      {kind === 'solid' ? (
        <RoundedRect x={x} y={y} width={w} height={h} r={2}>
          <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={['#6b707a', '#3c4047', '#23262b']} positions={[0, 0.4, 1]} />
        </RoundedRect>
      ) : null}
      {kind === 'ladder'
        ? Array.from({ length: Math.max(2, Math.floor(w / 18)) }, (_, i) => {
            const rx = x + 6 + i * 18;
            return <RoundedRect key={i} x={rx} y={y} width={4} height={h} r={1.4} color="#4a4e56" />;
          })
        : null}
      {kind === 'basket' ? (
        <>
          {/* Wire mesh: fine verticals on a U-shaped bottom, plus the two
              longitudinal wires. A basket must not read as a ladder — its
              signature is the fine grid and the curved trough. */}
          {Array.from({ length: Math.max(3, Math.floor(w / 7)) }, (_, i) => {
            const bx = x + 3 + i * 7;
            const inset = Math.min(1, Math.min(bx - x, x + w - bx) / (h * 1.6));
            return <RoundedRect key={i} x={bx} y={y + (1 - inset) * h * 0.5} width={1.3} height={h * (0.5 + inset * 0.5)} r={0.65} color="#565b64" />;
          })}
          <RoundedRect x={x + h * 0.3} y={y + h - 2.2} width={w - h * 0.6} height={1.6} r={0.8} color="#767c86" />
          <RoundedRect x={x} y={y + h * 0.45} width={w} height={1.4} r={0.7} color="#6a707a" />
        </>
      ) : null}
      {/* near side rail — lit top edge, dark underside */}
      <RoundedRect x={x} y={y + h - 1} width={w} height={h * 0.42} r={1.8}>
        <LinearGradient start={vec(x, y + h - 1)} end={vec(x, y + h - 1 + h * 0.42)} colors={['#8b9099', '#494d55', '#212429']} positions={[0, 0.35, 1]} />
      </RoundedRect>
      <RoundedRect x={x} y={y - h * 0.28} width={w} height={1.2} r={0.6} color={RIM} opacity={0.5} />
    </Group>
  );
}

/** EMT / rigid conduit run with a coupling — a metal tube, not an outline. */
export function Conduit({ x, y, w, d = 14, coupling = true }: { x: number; y: number; w: number; d?: number; coupling?: boolean }) {
  return (
    <Group>
      <RoundedRect x={x} y={y + d * 0.22} width={w} height={d} r={d / 2} color="rgba(0,0,0,0.4)">
        <BlurMask blur={2.4} style="normal" />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={d} r={d / 2}>
        <LinearGradient
          start={vec(x, y)}
          end={vec(x, y + d)}
          colors={['#464a52', '#9ba1ab', '#5c6169', '#1e2126']}
          positions={[0, 0.22, 0.6, 1]}
        />
      </RoundedRect>
      {coupling ? (
        <>
          <RoundedRect x={x + w * 0.44} y={y - 1.6} width={d * 1.5} height={d + 3.2} r={2.4}>
            <LinearGradient start={vec(0, y - 1.6)} end={vec(0, y + d + 1.6)} colors={['#5a5f68', '#a5abb5', '#3a3e45']} positions={[0, 0.25, 1]} />
          </RoundedRect>
          <RoundedRect x={x + w * 0.44} y={y - 1.6} width={d * 1.5} height={1} r={0.5} color={RIM} opacity={0.6} />
        </>
      ) : null}
    </Group>
  );
}

/** J-hook — the sheet-metal support, with its rolled edge and mounting tab. */
export function JHook({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <Path path={mk('M-3 -22 L5 -22 L5 -14 L-3 -14 Z')!} color="#3f434a" />
      <Path path={mk('M0 -20 L0 2 A14 14 0 0 0 28 2 L28 -6')!} style="stroke" strokeWidth={5.4} color="#31343b" />
      <Path path={mk('M0 -20 L0 2 A14 14 0 0 0 28 2 L28 -6')!} style="stroke" strokeWidth={3} color="#6d727b" />
      <Path path={mk('M0 -20 L0 2 A14 14 0 0 0 28 2 L28 -6')!} style="stroke" strokeWidth={1} color={RIM} />
    </Group>
  );
}

/** Floor cable protector — the yellow-and-black ramp people actually trip over. */
export function FloorProtector({ x, y, w, h = 13 }: { x: number; y: number; w: number; h?: number }) {
  const body = `M${x} ${y + h} L${x + h * 0.9} ${y} L${x + w - h * 0.9} ${y} L${x + w} ${y + h} Z`;
  return (
    <Group>
      <Path path={mk(body)!}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={['#4a4d54', '#26282d']} />
      </Path>
      {/* hazard stripes on the lid */}
      {Array.from({ length: Math.floor(w / 14) }, (_, i) => {
        const sx = x + h * 0.9 + i * 14;
        return <Path key={i} path={mk(`M${sx} ${y + 1.5} L${sx + 5} ${y + 1.5} L${sx + 5 - 3} ${y + h * 0.42} L${sx - 3} ${y + h * 0.42} Z`)!} color="#d9a441" opacity={0.8} />;
      })}
      <Path path={mk(`M${x + h * 0.9} ${y + 1} L${x + w - h * 0.9} ${y + 1}`)!} style="stroke" strokeWidth={1.2} color={RIM} />
    </Group>
  );
}

/* ══ canvas wrapper ════════════════════════════════════════════════════════ */

/**
 * A sized Skia canvas that scales a fixed design space to the requested width —
 * the same contract as `MicArt`, so scenes keep authoring in viewBox units.
 */
export function CiArtCanvas({
  w,
  vw,
  vh,
  children,
  accessibilityLabel,
}: {
  w: number;
  vw: number;
  vh: number;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const h = (w * vh) / vw;
  const k = w / vw;
  return (
    <Canvas style={{ width: w, height: h }} accessibilityLabel={accessibilityLabel}>
      <Group transform={[{ scaleX: k }, { scaleY: k }]}>{children}</Group>
    </Canvas>
  );
}
