/**
 * SMALL-PERCUSSION FAMILY — the INSTRUMENTS, drawn (charter §3: real objects,
 * gradients lit from the upper left, rim highlights, the palette tokens). Each
 * is a 2-D drawing in the view's millimetres, placed by its centre and the
 * angle of its long axis in that view; an instrument whose axis points along
 * the view's depth is drawn END-ON. Sizes come from the lessons' models (most
 * are drawing defaults — no maker prints them). Paths are cached per size;
 * nothing moves (D8).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { INK, make, oval, rrect, seg } from '../concert/paths.ts';
import { smoothPathD, type Pt } from './hands.ts';

const fromD = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
const D = Math.PI / 180;

/** Clear acrylic, lit from the upper left (a faint cool tint). */
export const ACRYLIC = ['rgba(236,246,255,0.62)', 'rgba(170,198,226,0.30)', 'rgba(120,150,184,0.40)', 'rgba(220,236,252,0.55)'];
export const CAP = ['#f4f6f9', '#c9ced8', '#8b919d', '#4e535d'];
export const BEAD = ['#fff7e6', '#e8c98f', '#a77b3e'];

/** A seeded scatter of beads (the fill), as one path, in a unit box. */
function beadPath(n: number, w: number, h: number, r: number, seed: number): ReturnType<typeof make> {
  const p = make();
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < n; i++) oval(p, (rnd() - 0.5) * w, (rnd() - 0.5) * h, r * (0.8 + rnd() * 0.4), r * (0.8 + rnd() * 0.4));
  return p;
}

/**
 * A clear SHAKER tube, along its axis at `angle` (deg) through `c`; `fill`
 * (−1 … 1) is where the fill sits along the tube (−1 at one cap, 0 spread, 1
 * at the other) — HOW IT SOUNDS moves it; the scenes leave it settled.
 */
export function ShakerTube({ c, angle, len, d, fill = 0, endOn = false }: { c: Pt; angle: number; len: number; d: number; fill?: number; endOn?: boolean }) {
  const g = useMemo(() => {
    const r = d / 2;
    const cap = 11;
    if (endOn) {
      return { endOn: true as const, r, rim: oval(make(), 0, 0, r, r), inner: oval(make(), 0, 0, r - 4, r - 4), beads: beadPath(16, r * 1.1, r * 0.8, 3.2, 7) };
    }
    const body = rrect(make(), -len / 2 + cap - 2, -r, len / 2 - cap + 2, r, 6);
    const capL = rrect(make(), -len / 2, -r - 1.5, -len / 2 + cap, r + 1.5, 5);
    const capR = rrect(make(), len / 2 - cap, -r - 1.5, len / 2, r + 1.5, 5);
    const span = len - 2 * cap - 14;
    const beads = beadPath(34, span * (fill === 0 ? 1 : 0.32), r * 0.9, 3.4, 3);
    const shine = seg(make(), -len / 2 + cap + 6, -r * 0.55, len / 2 - cap - 10, -r * 0.55);
    return { endOn: false as const, r, cap, body, capL, capR, beads, shine, span };
  }, [len, d, endOn, fill]);
  if (g.endOn) {
    return (
      <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
        <Path path={g.rim}>
          <RadialGradient c={vec(-g.r * 0.4, -g.r * 0.4)} r={g.r * 1.7} colors={CAP} />
        </Path>
        <Path path={g.inner} color="rgba(220,232,246,0.55)" />
        <Path path={g.beads} color="#d9b877" opacity={0.75} />
        <Path path={g.rim} style="stroke" strokeWidth={1.4} color={INK} />
        <Path path={oval(make(), -g.r * 0.35, -g.r * 0.4, g.r * 0.25, g.r * 0.14)} color="#ffffff" opacity={0.7} />
      </Group>
    );
  }
  const fx = fill * (g.span / 2) * 0.68;
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, { rotate: angle * D }]}>
      <Path path={g.body} color="#000" opacity={0.35} transform={[{ translateX: 5 }, { translateY: 7 }]}>
        <BlurMask blur={6} style="normal" />
      </Path>
      <Group transform={[{ translateX: fx }]}>
        <Path path={g.beads}>
          <RadialGradient c={vec(-6, -6)} r={30} colors={BEAD} />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -g.r)} end={vec(0, g.r)} colors={ACRYLIC} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={1.2} color="#b9cde3" opacity={0.9} />
      <Path path={g.shine} style="stroke" strokeWidth={3} strokeCap="round" color="#ffffff" opacity={0.55} />
      {[g.capL, g.capR].map((p, i) => (
        <Group key={i}>
          <Path path={p}>
            <LinearGradient start={vec(0, -g.r)} end={vec(0, g.r)} colors={CAP} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={1.2} color={INK} />
        </Group>
      ))}
    </Group>
  );
}

/** A plain circle helper for end-on round things (a stick end, a handle). */
export function RoundEnd({ c, r, colors, rim = INK }: { c: Pt; r: number; colors: string[]; rim?: string }) {
  return (
    <Group>
      <Circle cx={c[0]} cy={c[1]} r={r}>
        <RadialGradient c={vec(c[0] - r * 0.4, c[1] - r * 0.4)} r={r * 1.7} colors={colors} />
      </Circle>
      <Circle cx={c[0]} cy={c[1]} r={r} style="stroke" strokeWidth={1.2} color={rim} />
    </Group>
  );
}

/** A mic stand's footprint on the floor (a soft shadow) — not used for the
 *  stands the scene draws itself; kept for plans. */
export function FloorShadow({ c, rx, ry }: { c: Pt; rx: number; ry: number }) {
  const p = useMemo(() => oval(make(), c[0], c[1], rx, ry), [c, rx, ry]);
  return (
    <Path path={p} color="#000" opacity={0.4}>
      <BlurMask blur={12} style="normal" />
    </Path>
  );
}

/** A smooth closed shape from points (exported for the lessons' own art). */
export function smoothShape(pts: readonly Pt[]) {
  return fromD(smoothPathD(pts));
}

/* ── more of the family: egg, maraca, cowbell, clave, stick, woodblock, güiro ── */

const rot = (a: number) => [{ rotate: a * D }];
export const EGG_SHELL = ['#fff6c4', '#f6cf54', '#d39a1e', '#82560a'];
export const RAWHIDE = ['#f7e7c4', '#e0bf86', '#b88a4c', '#77542a'];
export const WOOD_HANDLE = ['#e2b27a', '#b9783f', '#7d4a1f', '#4a2a10'];
export const ROSEWOOD = ['#d48a58', '#9a4a22', '#642a10', '#331206'];
export const BELL_BLACK = ['#5b5f68', '#2b2e34', '#16171b', '#0b0b0d'];
export const BELL_CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
export const BLOCK_WOOD = ['#e7b67a', '#c48a4c', '#946030', '#5e3a18'];
export const GOURD = ['#f3dfa5', '#d8b468', '#a87a34', '#6a4a18'];
export const FIBERGLASS = ['#7a3a3a', '#4e2020', '#2c1010', '#140707'];
export const FOAM = ['#4a5568', '#323a48', '#1e2430'];
const RUBBER = ['#5a5f6a', '#2c2f36', '#121317'];
export { RUBBER };

/** An egg shaker: an ellipse, glossy plastic, a seam round its middle. */
export function EggShell({ c, angle, len, d, colors = EGG_SHELL }: { c: Pt; angle: number; len: number; d: number; colors?: string[] }) {
  const g = useMemo(() => {
    const seam = make();
    seam.moveTo(0, -d / 2 + 2);
    seam.cubicTo(5, -d / 4, 5, d / 4, 0, d / 2 - 2);
    return { body: oval(make(), 0, 0, len / 2, d / 2), seam, shine: oval(make(), -len * 0.16, -d * 0.2, len * 0.14, d * 0.09) };
  }, [len, d]);
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, ...rot(angle)]}>
      <Path path={g.body}>
        <RadialGradient c={vec(-len * 0.2, -d * 0.25)} r={len * 0.75} colors={colors} />
      </Path>
      <Path path={g.seam} style="stroke" strokeWidth={1.4} color="#8a5a10" opacity={0.7} />
      <Path path={g.body} style="stroke" strokeWidth={1.3} color={INK} />
      <Path path={g.shine} color="#ffffff" opacity={0.75} />
    </Group>
  );
}

/**
 * A MARACA: the head (rawhide), the handle below it. `c` is the head's centre;
 * `angle` the direction from the head to the handle's end (deg, view). End-on
 * (the handle pointing at the viewer) only the head's round face shows.
 */
export function Maraca({ c, angle, headW, headH, handle, handleD, endOn = false }: { c: Pt; angle: number; headW: number; headH: number; handle: number; handleD: number; endOn?: boolean }) {
  const g = useMemo(() => {
    const head = oval(make(), 0, 0, headH / 2, headW / 2);
    const hx0 = headH / 2 - 8;
    const shaft = make();
    shaft.moveTo(hx0, -handleD * 0.55);
    shaft.lineTo(hx0 + handle - 14, -handleD * 0.42);
    shaft.lineTo(hx0 + handle - 14, handleD * 0.42);
    shaft.lineTo(hx0, handleD * 0.55);
    shaft.close();
    const knob = oval(make(), hx0 + handle - 10, 0, 12, handleD * 0.6);
    const collar = rrect(make(), hx0 - 4, -handleD * 0.62, hx0 + 10, handleD * 0.62, 4);
    const bands = make();
    for (const k of [-0.18, 0.12]) {
      const x = headH * k;
      const ry = (headW / 2) * Math.sqrt(Math.max(0, 1 - (x / (headH / 2)) ** 2));
      bands.moveTo(x, -ry + 2);
      bands.cubicTo(x + 6, -ry * 0.4, x + 6, ry * 0.4, x, ry - 2);
    }
    const shine = oval(make(), -headH * 0.18, -headW * 0.22, headH * 0.16, headW * 0.1);
    const face = oval(make(), 0, 0, headW / 2, headW / 2);
    const faceShine = oval(make(), -headW * 0.16, -headW * 0.16, headW * 0.12, headW * 0.08);
    return { head, shaft, knob, collar, bands, shine, face, faceShine };
  }, [headW, headH, handle, handleD]);
  if (endOn) {
    return (
      <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
        <Path path={g.face}>
          <RadialGradient c={vec(-headW * 0.2, -headW * 0.2)} r={headW * 0.8} colors={RAWHIDE} />
        </Path>
        <Path path={g.face} style="stroke" strokeWidth={1.4} color={INK} />
        <Path path={g.faceShine} color="#fff" opacity={0.55} />
      </Group>
    );
  }
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, ...rot(angle)]}>
      <Path path={g.shaft}>
        <LinearGradient start={vec(0, -handleD / 2)} end={vec(0, handleD / 2)} colors={WOOD_HANDLE} />
      </Path>
      <Path path={g.shaft} style="stroke" strokeWidth={1.1} color={INK} />
      <Path path={g.knob}>
        <RadialGradient c={vec(0, -4)} r={handleD} colors={WOOD_HANDLE} />
      </Path>
      <Path path={g.head}>
        <RadialGradient c={vec(-headH * 0.2, -headW * 0.22)} r={headH * 0.75} colors={RAWHIDE} />
      </Path>
      <Path path={g.bands} style="stroke" strokeWidth={4} color="#9a3a20" opacity={0.75} />
      <Path path={g.head} style="stroke" strokeWidth={1.4} color={INK} />
      <Path path={g.collar}>
        <LinearGradient start={vec(0, -handleD / 2)} end={vec(0, handleD / 2)} colors={WOOD_HANDLE} />
      </Path>
      <Path path={g.shine} color="#ffffff" opacity={0.5} />
    </Group>
  );
}

/** A stick or mallet shaft from `a` to `b`, with an optional ball head at b. */
export function Stick({ a, b, w = 14, head, colors = WOOD_HANDLE }: { a: Pt; b: Pt; w?: number; head?: { r: number; colors: string[] }; colors?: string[] }) {
  const p = useMemo(() => seg(make(), a[0], a[1], b[0], b[1]), [a, b]);
  return (
    <Group>
      <Path path={p} style="stroke" strokeWidth={w + 2.5} strokeCap="round" color={INK} />
      <Path path={p} style="stroke" strokeWidth={w} strokeCap="round">
        <LinearGradient start={vec(a[0], a[1] - w)} end={vec(b[0], b[1] + w)} colors={colors} />
      </Path>
      {head ? (
        <Group>
          <Circle cx={b[0]} cy={b[1]} r={head.r}>
            <RadialGradient c={vec(b[0] - head.r * 0.4, b[1] - head.r * 0.4)} r={head.r * 1.7} colors={head.colors} />
          </Circle>
          <Circle cx={b[0]} cy={b[1]} r={head.r} style="stroke" strokeWidth={1.2} color={INK} />
        </Group>
      ) : null}
    </Group>
  );
}

/**
 * A COWBELL seen from the side or from above: a tapered box from the closed
 * end (local x = 0) to the mouth (x = len), heights h0 → h1 in this view; the
 * mouth rimmed in bright steel; `mouthOpen` shows its dark opening.
 */
export function Cowbell({ c, angle, len, h0, h1, mouthOpen = false }: { c: Pt; angle: number; len: number; h0: number; h1: number; mouthOpen?: boolean }) {
  const g = useMemo(() => {
    const body = make();
    body.moveTo(0, -h0 / 2);
    body.lineTo(len, -h1 / 2);
    body.lineTo(len, h1 / 2);
    body.lineTo(0, h0 / 2);
    body.close();
    const lip = rrect(make(), len - 7, -h1 / 2 - 2, len + 2, h1 / 2 + 2, 2);
    const ridge = seg(make(), 4, -h0 * 0.18, len - 10, -h1 * 0.18);
    const opening = oval(make(), len, 0, 6, h1 / 2 - 4);
    return { body, lip, ridge, opening };
  }, [len, h0, h1]);
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, ...rot(angle)]}>
      <Group transform={[{ translateX: 6 }, { translateY: 9 }]}>
        <Path path={g.body} color="#000" opacity={0.4}>
          <BlurMask blur={7} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -h1 / 2)} end={vec(0, h1 / 2)} colors={BELL_BLACK} />
      </Path>
      <Path path={g.ridge} style="stroke" strokeWidth={2.4} color="#8a8f9c" opacity={0.55} />
      <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
      <Path path={g.lip}>
        <LinearGradient start={vec(0, -h1 / 2)} end={vec(0, h1 / 2)} colors={BELL_CHROME} />
      </Path>
      {mouthOpen ? <Path path={g.opening} color="#050506" /> : null}
    </Group>
  );
}

/** A CLAVE: a hardwood rod (rosewood tones, grain lines); `hollow` carves a
 *  long slot in its upper face. End-on: the round end grain. */
export function Clave({ c, angle, len, d, hollow = false, endOn = false }: { c: Pt; angle: number; len: number; d: number; hollow?: boolean; endOn?: boolean }) {
  const g = useMemo(() => {
    const body = rrect(make(), -len / 2, -d / 2, len / 2, d / 2, d / 2);
    const grain = make();
    for (const k of [-0.25, 0.05, 0.3]) {
      grain.moveTo(-len / 2 + d * 0.6, d * k);
      grain.cubicTo(-len / 6, d * (k + 0.06), len / 6, d * (k - 0.06), len / 2 - d * 0.6, d * k);
    }
    const slot = rrect(make(), -len * 0.36, -d * 0.12, len * 0.36, d * 0.12, d * 0.12);
    const end = oval(make(), 0, 0, d / 2, d / 2);
    const rings = make();
    for (const r of [d * 0.18, d * 0.32]) rings.addCircle(0, 0, r);
    const hole = oval(make(), 0, -d * 0.18, d * 0.16, d * 0.1);
    const shine = seg(make(), -len / 2 + d * 0.5, -d * 0.3, len / 2 - d * 0.5, -d * 0.3);
    return { body, grain, slot, end, rings, hole, shine };
  }, [len, d]);
  if (endOn) {
    return (
      <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
        <Path path={g.end}>
          <RadialGradient c={vec(-d * 0.2, -d * 0.2)} r={d} colors={ROSEWOOD} />
        </Path>
        <Path path={g.rings} style="stroke" strokeWidth={0.9} color="#2a0d04" opacity={0.6} />
        {hollow ? <Path path={g.hole} color="#120603" /> : null}
        <Path path={g.end} style="stroke" strokeWidth={1.2} color={INK} />
      </Group>
    );
  }
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, ...rot(angle)]}>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -d / 2)} end={vec(0, d / 2)} colors={ROSEWOOD} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={0.9} color="#2a0d04" opacity={0.55} />
      {hollow ? <Path path={g.slot} color="#160704" /> : null}
      <Path path={g.body} style="stroke" strokeWidth={1.2} color={INK} />
      <Path path={g.shine} style="stroke" strokeWidth={2} strokeCap="round" color="#ffd9b8" opacity={0.45} />
    </Group>
  );
}

/**
 * A WOODBLOCK: a rectangular hardwood block, `w` × `h` in this view: seen
 * from its END the slot (the opening) is a dark notch in the face toward +u;
 * seen from the FRONT it is a long dark slit; from above, a plain top.
 */
export function Woodblock({ c, w, h, slot, mode }: { c: Pt; w: number; h: number; slot: { len: number; t: number; depth: number }; mode: 'end' | 'top' | 'front' }) {
  const g = useMemo(() => {
    const body = rrect(make(), -w / 2, -h / 2, w / 2, h / 2, 6);
    const notch = rrect(make(), w / 2 - slot.depth, -h * 0.18 - slot.t / 2, w / 2 + 1, -h * 0.18 + slot.t / 2, 2);
    const slit = rrect(make(), -slot.len / 2, -h * 0.18 - slot.t / 2, slot.len / 2, -h * 0.18 + slot.t / 2, slot.t / 2);
    const grain = make();
    for (const k of [-0.3, 0, 0.28]) {
      grain.moveTo(-w / 2 + 6, h * k);
      grain.cubicTo(-w / 6, h * (k + 0.05), w / 6, h * (k - 0.05), w / 2 - 6, h * k);
    }
    return { body, notch, slit, grain };
  }, [w, h, slot]);
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
      <Group transform={[{ translateX: 6 }, { translateY: 9 }]}>
        <Path path={g.body} color="#000" opacity={0.4}>
          <BlurMask blur={7} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(-w / 2, -h / 2)} end={vec(w / 2, h / 2)} colors={BLOCK_WOOD} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={1} color="#5e3a18" opacity={0.45} />
      {mode === 'end' ? <Path path={g.notch} color="#1a0f06" /> : null}
      {mode === 'front' ? <Path path={g.slit} color="#1a0f06" /> : null}
      <Path path={g.body} style="stroke" strokeWidth={1.3} color={INK} />
    </Group>
  );
}

/** A foam pad (under a woodblock): a soft dark slab. */
export function FoamPad({ c, w, h }: { c: Pt; w: number; h: number }) {
  const p = useMemo(() => rrect(make(), -w / 2, -h / 2, w / 2, h / 2, Math.min(8, h / 2)), [w, h]);
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
      <Path path={p}>
        <LinearGradient start={vec(0, -h / 2)} end={vec(0, h / 2)} colors={FOAM} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={1.1} color={INK} />
    </Group>
  );
}

/** A trap table: from the side, its top at y = `top` with two legs to the
 *  floor; from above, its covered top (x0…x1 × z0…z1). */
export function TrapTable({ view, x0, x1, z0, z1, top }: { view: 'side' | 'top'; x0: number; x1: number; z0: number; z1: number; top: number }) {
  const g = useMemo(() => {
    if (view === 'top') return { top: rrect(make(), x0, z0, x1, z1, 10), legs: make() };
    const t = rrect(make(), x0, top, x1, top + 24, 4);
    const legs = make();
    for (const x of [x0 + 30, x1 - 30]) {
      legs.moveTo(x, top + 24);
      legs.lineTo(x, 0);
    }
    return { top: t, legs };
  }, [view, x0, x1, z0, z1, top]);
  return (
    <Group>
      <Path path={g.legs} style="stroke" strokeWidth={18} strokeCap="round" color={INK} />
      <Path path={g.legs} style="stroke" strokeWidth={12} strokeCap="round" color="#5b5f69" />
      <Path path={g.top}>
        <LinearGradient start={vec(x0, view === 'top' ? z0 : top)} end={vec(x1, view === 'top' ? z1 : top + 24)} colors={['#4a3d58', '#2a2133', '#18121f']} />
      </Path>
      <Path path={g.top} style="stroke" strokeWidth={1.6} color={INK} />
    </Group>
  );
}

/**
 * A GÜIRO (length along the view at `angle`): a gourd that swells and tapers,
 * ridges cut across the middle of its top. End-on: a round end with the
 * ridged edge serrated. `fiberglass` changes its look.
 */
export function Guiro({ c, angle, len, dMax, dMin, fiberglass = false, endOn = false }: { c: Pt; angle: number; len: number; dMax: number; dMin: number; fiberglass?: boolean; endOn?: boolean }) {
  const g = useMemo(() => {
    const L = len / 2;
    const rAt = (t: number) => {
      const s = (t + 1) / 2;
      return (dMin / 2 + (dMax / 2 - dMin / 2) * Math.sin(Math.PI * Math.min(1, s * 1.15)) ** 0.8) * (1 - 0.08 * Math.abs(t) ** 6);
    };
    const pts: Pt[] = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const t = -1 + (2 * i) / N;
      pts.push([t * L, -rAt(t)]);
    }
    for (let i = N; i >= 0; i--) {
      const t = -1 + (2 * i) / N;
      pts.push([t * L, rAt(t)]);
    }
    const body = fromD(smoothPathD(pts));
    const ridges = make();
    for (let x = -L * 0.6; x <= L * 0.6; x += 7) {
      const r = rAt(x / L) * 0.82;
      ridges.moveTo(x, -r);
      ridges.lineTo(x, r);
    }
    const end = oval(make(), 0, 0, dMax / 2, dMax / 2);
    const teeth = make();
    for (let a = -160; a <= -20; a += 9) {
      const r0 = dMax / 2;
      teeth.moveTo(Math.cos(a * D) * r0, Math.sin(a * D) * r0);
      teeth.lineTo(Math.cos((a + 4.5) * D) * (r0 + 4), Math.sin((a + 4.5) * D) * (r0 + 4));
    }
    const mouth = oval(make(), L - 4, 0, 5, dMin * 0.28);
    return { body, ridges, end, teeth, mouth };
  }, [len, dMax, dMin]);
  const col = fiberglass ? FIBERGLASS : GOURD;
  if (endOn) {
    return (
      <Group transform={[{ translateX: c[0] }, { translateY: c[1] }]}>
        <Path path={g.end}>
          <RadialGradient c={vec(-dMax * 0.2, -dMax * 0.2)} r={dMax * 0.8} colors={col} />
        </Path>
        <Path path={g.teeth} style="stroke" strokeWidth={1.6} color={fiberglass ? '#0a0404' : '#5e3f15'} />
        <Path path={g.end} style="stroke" strokeWidth={1.4} color={INK} />
      </Group>
    );
  }
  return (
    <Group transform={[{ translateX: c[0] }, { translateY: c[1] }, ...rot(angle)]}>
      <Group transform={[{ translateX: 6 }, { translateY: 9 }]}>
        <Path path={g.body} color="#000" opacity={0.4}>
          <BlurMask blur={8} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(0, -dMax / 2)} end={vec(0, dMax / 2)} colors={col} />
      </Path>
      <Path path={g.ridges} style="stroke" strokeWidth={1.6} color={fiberglass ? '#0d0505' : '#6a4a18'} opacity={0.85} />
      <Path path={g.mouth} color="#120a04" />
      <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
    </Group>
  );
}

/** A percussion stand (side view): a tripod base on the floor, a tube up to a
 *  clamp arm reaching to `to` (a bell's or a ring's mount point). */
export function PercStand({ x, top, to, z = false }: { x: number; top: number; to: Pt; z?: boolean }) {
  const g = useMemo(() => {
    const tube = seg(make(), x, top, x, -30);
    const legs = make();
    if (z) {
      legs.addCircle(x, 0, 30);
    } else {
      legs.moveTo(x - 220, -4);
      legs.lineTo(x, -170);
      legs.lineTo(x + 220, -4);
    }
    const arm = seg(make(), x, top, to[0], to[1]);
    return { tube, legs, arm };
  }, [x, top, to, z]);
  return (
    <Group>
      <Path path={g.legs} style="stroke" strokeWidth={16} strokeCap="round" strokeJoin="round" color={INK} />
      <Path path={g.legs} style="stroke" strokeWidth={10} strokeCap="round" strokeJoin="round" color="#6b707b" />
      <Path path={g.tube} style="stroke" strokeWidth={24} strokeCap="round" color="#2a2c32" />
      <Path path={g.tube} style="stroke" strokeWidth={16} strokeCap="round">
        <LinearGradient start={vec(x - 10, 0)} end={vec(x + 10, 0)} colors={BELL_CHROME} />
      </Path>
      <Path path={g.arm} style="stroke" strokeWidth={14} strokeCap="round" color="#2a2c32" />
      <Path path={g.arm} style="stroke" strokeWidth={8} strokeCap="round" color="#b9bec8" />
    </Group>
  );
}
