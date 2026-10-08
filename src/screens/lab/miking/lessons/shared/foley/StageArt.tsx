/**
 * THE FOLEY STAGE — the look (charter §2 layer 3), shared by every Foley
 * lesson (frame F; stage.ts holds the numbers). Real materials, lit from the
 * upper left, never hatching or primitive stand-ins:
 *
 *   PitSection   the side view's CUT through the walker's front line: the
 *                stage floor (boards on the slab), the 35 cm base slab, the
 *                pit's concrete rim and the surface's layers in section —
 *                tiles on a mortar bed, boards over an air void on sleepers,
 *                gravel on sand, dry leaves on soil, carpet and underlay over
 *                boards — each drawn as the material.
 *   PitPlan      the pit from above: the concrete frame and the surface's
 *                face — a tile grid, boards and their grain, stones, leaves,
 *                a carpet's weave — and spike-tape marks round the
 *                movement ("mark it on the floor before any stand goes up").
 *   BoothArt     the live theatre booth: its low front rail, the PA on its
 *                pole stand beside the stage.
 *   Table        a sturdy prop table (F03, F04), side and plan.
 *
 * Textures are a few combined Paths (no per-dot elements). Static (D8).
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { make, rect, rrect } from '../concert/paths.ts';
import { PIT, SURFACES, type Layer, type SurfaceId } from './stage.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/** A small deterministic random sequence (textures look the same every time). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── palette (muted; the action and the mics stay brightest) ── */
export const CONCRETE = ['#7d7f84', '#5c5e63', '#3d3f44', '#2a2b2f'];
const CONCRETE_EDGE = '#1b1c1f';
const BOARD = ['#b88a57', '#8f6337', '#6a4524', '#4a2e16'];
const BOARD_LINE = '#2b1a0c';
const TILE = ['#c9d0d6', '#a6afb7', '#818a93'];
const MORTAR = ['#8e8a82', '#6c6861'];
const GRAVEL = ['#a39a8c', '#7d7468', '#5a5249'];
const SAND = ['#b9a27c', '#97805c'];
const SOIL = ['#5a4330', '#3d2c1f'];
const GROUND = ['#2b2621', '#1b1815'];
const LEAF = ['#b8742c', '#8e5320', '#c99a3e', '#6f3f18'];
const CARPET = ['#7a3a3a', '#5e2a2c', '#43191c'];
const UNDERLAY = ['#6b6b5e', '#4d4d43'];
const VOID = '#07080a';
const STAGE_BOARD = ['#4a3b2c', '#33281e', '#221a13'];

function layerColors(k: Layer['kind']): string[] {
  switch (k) {
    case 'tile':
      return TILE;
    case 'mortar':
      return MORTAR;
    case 'concrete':
      return CONCRETE;
    case 'board':
    case 'joist':
      return BOARD;
    case 'gravel':
      return GRAVEL;
    case 'sand':
      return SAND;
    case 'leaves':
      return LEAF;
    case 'soil':
      return SOIL;
    case 'carpet':
      return CARPET;
    case 'underlay':
      return UNDERLAY;
    default:
      return [VOID, VOID];
  }
}

/** Stones (or leaves) as one path of irregular blobs inside a box. */
export function pebbles(x0: number, x1: number, y0: number, y1: number, r: number, seed: number, leafy = false, density = 1): SkPath {
  const rnd = seeded(seed);
  const p = make();
  const n = Math.min(900, Math.round((((x1 - x0) * (y1 - y0)) / (r * r * 2.2)) * density));
  for (let i = 0; i < n; i++) {
    const cx = x0 + rnd() * (x1 - x0);
    const cy = y0 + rnd() * (y1 - y0);
    const rr = r * (0.55 + rnd() * 0.7);
    if (leafy) {
      const a = rnd() * Math.PI;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const L = rr * 1.9;
      const W = rr * 0.7;
      p.moveTo(cx - ca * L, cy - sa * L);
      p.quadTo(cx - sa * W, cy + ca * W, cx + ca * L, cy + sa * L);
      p.quadTo(cx + sa * W, cy - ca * W, cx - ca * L, cy - sa * L);
      p.close();
    } else {
      const k = 6;
      for (let j = 0; j <= k; j++) {
        const a = (j / k) * 2 * Math.PI;
        const q = rr * (0.78 + 0.32 * Math.sin(a * 2 + cx));
        const xx = cx + Math.cos(a) * q;
        const yy = cy + Math.sin(a) * q * 0.82;
        if (j === 0) p.moveTo(xx, yy);
        else p.lineTo(xx, yy);
      }
      p.close();
    }
  }
  return p;
}

/** Wood grain: long gentle lines along a board strip. */
function grain(x0: number, x1: number, y0: number, y1: number, seed: number, along: 'u' | 'v' = 'u'): SkPath {
  const rnd = seeded(seed);
  const p = make();
  const n = 3;
  for (let i = 0; i < n; i++) {
    if (along === 'u') {
      const y = y0 + ((i + 0.5 + (rnd() - 0.5) * 0.4) / n) * (y1 - y0);
      p.moveTo(x0 + 6, y);
      p.cubicTo(x0 + (x1 - x0) * 0.3, y - 3 + rnd() * 6, x0 + (x1 - x0) * 0.7, y - 3 + rnd() * 6, x1 - 6, y + (rnd() - 0.5) * 4);
    } else {
      const x = x0 + ((i + 0.5 + (rnd() - 0.5) * 0.4) / n) * (x1 - x0);
      p.moveTo(x, y0 + 6);
      p.cubicTo(x - 3 + rnd() * 6, y0 + (y1 - y0) * 0.3, x - 3 + rnd() * 6, y0 + (y1 - y0) * 0.7, x + (rnd() - 0.5) * 4, y1 - 6);
    }
  }
  return p;
}

/** One layer of the section, drawn as its material. */
function LayerCut({ l, x0, x1, y0, y1, seed }: { l: Layer; x0: number; x1: number; y0: number; y1: number; seed: number }) {
  const body = useMemo(() => rect(make(), x0, y0, x1, y1), [x0, x1, y0, y1]);
  const tex = useMemo(() => {
    const p = make();
    if (l.kind === 'tile') {
      for (let x = x0 + 300; x < x1; x += 300) {
        p.moveTo(x, y0);
        p.lineTo(x, y1);
      }
    } else if (l.kind === 'board') {
      for (let x = x0 + 140; x < x1; x += 140) {
        p.moveTo(x, y0);
        p.lineTo(x, y1);
      }
    } else if (l.kind === 'concrete' || l.kind === 'mortar' || l.kind === 'sand' || l.kind === 'soil') {
      p.addPath(pebbles(x0, x1, y0 + 2, y1 - 2, l.kind === 'concrete' ? 7 : 5, seed, false, 0.18));
    } else if (l.kind === 'carpet') {
      for (let x = x0 + 8; x < x1; x += 9) {
        p.moveTo(x, y0);
        p.lineTo(x + 2, y0 + (y1 - y0) * 0.7);
      }
    }
    return p;
  }, [l.kind, x0, x1, y0, y1, seed]);
  const lumps = useMemo(() => (l.kind === 'gravel' ? pebbles(x0, x1, y0 - 6, y1, 13, seed) : l.kind === 'leaves' ? pebbles(x0, x1, y0 - 8, y1, 12, seed, true) : null), [l.kind, x0, x1, y0, y1, seed]);
  const c = layerColors(l.kind);
  if (l.kind === 'void') {
    // The air gap: dark, with the sleepers drawn by the layer below.
    return (
      <Group>
        <Path path={body} color={VOID} />
        <Path path={body} style="stroke" strokeWidth={1.5} color="#24262b" />
      </Group>
    );
  }
  if (l.kind === 'joist') {
    // Sleepers under the boards: short blocks, the void between them.
    const blocks = make();
    for (let x = x0 + 60; x < x1 - 60; x += 300) rect(blocks, x, y0, x + 60, y1);
    return (
      <Group>
        <Path path={body} color={VOID} />
        <Path path={blocks}>
          <LinearGradient start={vec(0, y0)} end={vec(0, y1)} colors={BOARD} />
        </Path>
        <Path path={blocks} style="stroke" strokeWidth={1.5} color={BOARD_LINE} />
      </Group>
    );
  }
  return (
    <Group>
      <Path path={body}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + 40, y1)} colors={c} />
      </Path>
      {lumps ? (
        <>
          <Path path={lumps} color={c[c.length - 1]} opacity={0.9} />
          <Group transform={[{ translateX: -2 }, { translateY: -2.5 }]}>
            <Path path={lumps}>
              <LinearGradient start={vec(x0, y0 - 10)} end={vec(x0, y1)} colors={[c[0], c[1]]} />
            </Path>
          </Group>
          <Path path={lumps} style="stroke" strokeWidth={1.2} color="#1c1a17" opacity={0.6} />
        </>
      ) : null}
      <Path path={tex} style="stroke" strokeWidth={l.kind === 'carpet' ? 1.6 : 1.8} color={l.kind === 'tile' ? '#3d434a' : '#141416'} opacity={l.kind === 'carpet' ? 0.5 : 0.65} />
      {l.kind === 'board' ? <Path path={grain(x0, x1, y0, y1, seed)} style="stroke" strokeWidth={1.2} color={BOARD_LINE} opacity={0.5} /> : null}
      {l.kind === 'tile' ? (
        // The glaze's highlight along the top.
        <Path path={rect(make(), x0, y0, x1, y0 + 2.5)} color="#eef2f6" opacity={0.6} />
      ) : null}
      <Path path={body} style="stroke" strokeWidth={1.4} color="#121214" opacity={0.75} />
    </Group>
  );
}

/**
 * THE SIDE VIEW'S SECTION through the stage floor (u = x, v = y; the floor at
 * `floorY`): stage boards on the slab, the slab, and the pit (x within
 * ±PIT.hx) with its concrete rim and the surface's layers.
 */
export function PitSection({ surface, floorY = 0, u0, u1, pit = true }: { surface: SurfaceId; floorY?: number; u0: number; u1: number; pit?: boolean }) {
  const s = SURFACES[surface];
  const f = floorY;
  const hx = PIT.hx;
  const rim = PIT.rim;
  const depth = PIT.depth;
  const slab = PIT.slab;
  const g = useMemo(() => {
    // The stage floor's boards (25 mm) on the slab, left and right of the pit.
    const deck = make();
    const left = pit ? -hx - rim : u1;
    rect(deck, u0, f, left, f + 25);
    if (pit) rect(deck, hx + rim, f, u1, f + 25);
    const deckSeams = make();
    for (let x = Math.ceil(u0 / 180) * 180; x < u1; x += 180) {
      if (pit && x > -hx - rim && x < hx + rim) continue;
      deckSeams.moveTo(x, f);
      deckSeams.lineTo(x, f + 25);
    }
    // The slab (under the deck and under the pit), and the rim (the pit's frame).
    const slabP = make();
    rect(slabP, u0, f + 25, u1, f + depth + slab);
    if (pit) rect(slabP, -hx - rim, f, -hx, f + 25);
    if (pit) rect(slabP, hx, f, hx + rim, f + 25);
    const slabTex = pebbles(u0, u1, f + 30, f + depth + slab - 6, 10, 11, false, 0.12);
    const sand = rect(make(), u0, f + depth + slab, u1, f + depth + slab + 60);
    return { deck, deckSeams, slabP, slabTex, sand };
  }, [u0, u1, f, hx, rim, depth, slab, pit]);
  let y = f;
  const layers = s.layers.map((l, i) => {
    const y0 = y;
    y += l.mm;
    return <LayerCut key={l.id} l={l} x0={-hx} x1={hx} y0={y0} y1={y} seed={31 + i * 7} />;
  });
  return (
    <Group>
      <Path path={g.sand}>
        {/* The ground under the slab, kept dark so the view tag reads over it. */}
        <LinearGradient start={vec(0, f + depth + slab)} end={vec(0, f + depth + slab + 60)} colors={GROUND} />
      </Path>
      <Path path={g.slabP}>
        <LinearGradient start={vec(u0, f)} end={vec(u0 + 200, f + depth + slab)} colors={CONCRETE} />
      </Path>
      <Path path={g.slabTex} color="#2c2d31" opacity={0.55} />
      <Path path={g.slabP} style="stroke" strokeWidth={2} color={CONCRETE_EDGE} />
      <Path path={g.deck}>
        <LinearGradient start={vec(0, f)} end={vec(0, f + 25)} colors={STAGE_BOARD} />
      </Path>
      <Path path={g.deckSeams} style="stroke" strokeWidth={1.4} color="#0f0b08" opacity={0.8} />
      {pit ? <Group>{layers}</Group> : null}
      {/* The floor line itself, lit from above. */}
      <Path path={rect(make(), u0, f - 1.5, u1, f + 1.5)} color="#9aa0ab" opacity={0.35} />
    </Group>
  );
}

/** The pit from above (u = x, v = z): its concrete frame and its surface. */
export function PitPlan({ surface, cx = 0, cz = 0, tape = true, tapeBox }: { surface: SurfaceId; cx?: number; cz?: number; tape?: boolean; tapeBox?: { u0: number; u1: number; v0: number; v1: number } }) {
  const hx = PIT.hx;
  const hz = PIT.hz;
  const rim = PIT.rim;
  const g = useMemo(() => {
    const frame = make();
    rrect(frame, cx - hx - rim, cz - hz - rim, cx + hx + rim, cz + hz + rim, 10);
    const face = rect(make(), cx - hx, cz - hz, cx + hx, cz + hz);
    const tex = make();
    let lumps: SkPath | null = null;
    if (surface === 'tile') {
      for (let x = cx - hx + 200; x < cx + hx; x += 200) {
        tex.moveTo(x, cz - hz);
        tex.lineTo(x, cz + hz);
      }
      for (let z = cz - hz + 200; z < cz + hz; z += 200) {
        tex.moveTo(cx - hx, z);
        tex.lineTo(cx + hx, z);
      }
    } else if (surface === 'woodPanel') {
      for (let z = cz - hz + 120; z < cz + hz; z += 120) {
        tex.moveTo(cx - hx, z);
        tex.lineTo(cx + hx, z);
      }
      for (let z = cz - hz; z < cz + hz; z += 120) tex.addPath(grain(cx - hx, cx + hx, z, z + 120, Math.round(z) + 5));
    } else if (surface === 'gravel') {
      lumps = pebbles(cx - hx, cx + hx, cz - hz, cz + hz, 18, 7);
    } else if (surface === 'leaves') {
      lumps = pebbles(cx - hx, cx + hx, cz - hz, cz + hz, 20, 9, true);
    } else if (surface === 'carpetOver') {
      for (let x = cx - hx + 10; x < cx + hx; x += 14) {
        tex.moveTo(x, cz - hz);
        tex.lineTo(x, cz + hz);
      }
    } else {
      tex.addPath(pebbles(cx - hx, cx + hx, cz - hz, cz + hz, 8, 13, false, 0.15));
    }
    // Spike tape round the movement: the corners of the area to keep clear.
    const tp = make();
    if (tape && tapeBox) {
      const L = 140;
      const { u0, u1, v0, v1 } = tapeBox;
      for (const [x, z, sx, sz] of [
        [u0, v0, 1, 1],
        [u1, v0, -1, 1],
        [u0, v1, 1, -1],
        [u1, v1, -1, -1],
      ] as const) {
        tp.moveTo(x + sx * L, z);
        tp.lineTo(x, z);
        tp.lineTo(x, z + sz * L);
      }
    }
    return { frame, face, tex, lumps, tp };
  }, [surface, cx, cz, hx, hz, rim, tape, tapeBox]);
  const top = SURFACES[surface].layers[0];
  const c = layerColors(top.kind);
  return (
    <Group>
      <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
        <Path path={g.frame} color="#000" opacity={0.4}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={g.frame}>
        <LinearGradient start={vec(cx - hx, cz - hz)} end={vec(cx + hx, cz + hz)} colors={CONCRETE} />
      </Path>
      <Path path={g.frame} style="stroke" strokeWidth={2.2} color={CONCRETE_EDGE} />
      <Path path={g.face}>
        <LinearGradient start={vec(cx - hx, cz - hz)} end={vec(cx + hx, cz + hz)} colors={c} />
      </Path>
      {g.lumps ? (
        <>
          <Path path={g.lumps} color={c[c.length - 1]} />
          <Group transform={[{ translateX: -2.5 }, { translateY: -3 }]}>
            <Path path={g.lumps}>
              <LinearGradient start={vec(cx - hx, cz - hz)} end={vec(cx + hx, cz + hz)} colors={[c[0], c[1]]} />
            </Path>
          </Group>
          <Path path={g.lumps} style="stroke" strokeWidth={1.4} color="#141210" opacity={0.6} />
        </>
      ) : null}
      <Path path={g.tex} style="stroke" strokeWidth={surface === 'carpetOver' ? 2.2 : 2} color={surface === 'tile' ? '#59616a' : '#1a1410'} opacity={surface === 'carpetOver' ? 0.35 : 0.6} />
      <Path path={g.face} style="stroke" strokeWidth={2} color="#101012" opacity={0.85} />
      {tape ? (
        <>
          <Path path={g.tp} style="stroke" strokeWidth={18} strokeCap="butt" strokeJoin="miter" color="#d9b13a" opacity={0.85} />
          <Path path={g.tp} style="stroke" strokeWidth={18} strokeCap="butt" color="#161616" opacity={0.85}>
            <DashPathEffect intervals={[22, 22]} />
          </Path>
        </>
      ) : null}
    </Group>
  );
}

/** The stage floor from above: dark boards over the whole view. */
export function StageFloorPlan({ u0, u1, v0, v1 }: { u0: number; u1: number; v0: number; v1: number }) {
  const g = useMemo(() => {
    const f = rect(make(), u0, v0, u1, v1);
    const seams = make();
    for (let z = Math.ceil(v0 / 180) * 180; z < v1; z += 180) {
      seams.moveTo(u0, z);
      seams.lineTo(u1, z);
    }
    return { f, seams };
  }, [u0, u1, v0, v1]);
  return (
    <Group>
      <Path path={g.f}>
        <LinearGradient start={vec(u0, v0)} end={vec(u1, v1)} colors={STAGE_BOARD} />
      </Path>
      <Path path={g.seams} style="stroke" strokeWidth={1.6} color="#0d0a07" opacity={0.7} />
    </Group>
  );
}

/**
 * THE LIVE BOOTH (ENO-FOLEY; drawing defaults): the booth's low front rail
 * between the artist and the audience, and the PA on a pole stand beside
 * the stage, facing the audience.
 */
export function BoothArt({ view, floorY = 0, rail, pa }: { view: ViewId; floorY?: number; rail: { x: number; h: number }; pa: { x: number; y: number; z: number } }) {
  const g = useMemo(() => {
    const railP = make();
    const cab = make();
    const pole = make();
    const grille = make();
    if (view === 'side') {
      rrect(railP, rail.x, floorY - rail.h, rail.x + 60, floorY, 8);
      rrect(cab, pa.x - 200, pa.y - 330, pa.x + 160, pa.y + 330, 18);
      rrect(grille, pa.x + 110, pa.y - 300, pa.x + 160, pa.y + 300, 10);
      rect(pole, pa.x - 18, pa.y + 330, pa.x + 18, floorY);
    } else {
      rrect(railP, rail.x, -1400, rail.x + 60, 1400, 8);
      rrect(cab, pa.x - 200, pa.z - 280, pa.x + 160, pa.z + 280, 18);
      rrect(grille, pa.x + 110, pa.z - 250, pa.x + 160, pa.z + 250, 10);
    }
    return { railP, cab, pole, grille };
  }, [view, floorY, rail.x, rail.h, pa.x, pa.y, pa.z]);
  return (
    <Group>
      <Path path={g.railP}>
        <LinearGradient start={vec(rail.x, 0)} end={vec(rail.x + 60, 0)} colors={['#5a4a3a', '#2e241b']} />
      </Path>
      <Path path={g.railP} style="stroke" strokeWidth={2} color="#120d09" />
      {view === 'side' ? (
        <Path path={g.pole}>
          <LinearGradient start={vec(pa.x - 18, 0)} end={vec(pa.x + 18, 0)} colors={['#9aa0ab', '#3a3d45']} />
        </Path>
      ) : null}
      <Path path={g.cab}>
        <LinearGradient start={vec(pa.x - 200, pa.y - 330)} end={vec(pa.x + 160, pa.y + 330)} colors={['#3a3d45', '#1d1f24', '#0e0f12']} />
      </Path>
      <Path path={g.grille} color="#0a0a0c" />
      <Path path={g.cab} style="stroke" strokeWidth={2.4} color="#050506" />
    </Group>
  );
}

/**
 * A STURDY PROP TABLE (F03, F04; drawing defaults): a solid wooden top on
 * four legs, its top surface at `topY`; side (u = x, v = y) or plan.
 */
export function TableArt({ view, x0, x1, z0, z1, topY, floorY, thick = 40 }: { view: ViewId; x0: number; x1: number; z0: number; z1: number; topY: number; floorY: number; thick?: number }) {
  const g = useMemo(() => {
    const top = make();
    const legs = make();
    if (view === 'side') {
      rrect(top, x0, topY, x1, topY + thick, 6);
      rect(legs, x0 + 30, topY + thick, x0 + 80, floorY);
      rect(legs, x1 - 80, topY + thick, x1 - 30, floorY);
    } else {
      rrect(top, x0, z0, x1, z1, 10);
    }
    return { top, legs, grainP: view === 'top' ? grain(x0, x1, z0, z1, 3) : grain(x0, x1, topY, topY + thick, 3) };
  }, [view, x0, x1, z0, z1, topY, floorY, thick]);
  return (
    <Group>
      {view === 'side' ? (
        <Path path={g.legs}>
          <LinearGradient start={vec(x0, 0)} end={vec(x0 + 80, 0)} colors={BOARD} />
        </Path>
      ) : (
        <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
          <Path path={g.top} color="#000" opacity={0.4}>
            <BlurMask blur={14} style="normal" />
          </Path>
        </Group>
      )}
      <Path path={g.top}>
        <LinearGradient start={vec(x0, view === 'top' ? z0 : topY)} end={vec(x1, view === 'top' ? z1 : topY + thick)} colors={BOARD} />
      </Path>
      <Path path={g.grainP} style="stroke" strokeWidth={1.4} color={BOARD_LINE} opacity={0.5} />
      <Path path={g.top} style="stroke" strokeWidth={2} color={BOARD_LINE} />
      {view === 'side' ? <Path path={g.legs} style="stroke" strokeWidth={1.6} color={BOARD_LINE} /> : null}
    </Group>
  );
}
