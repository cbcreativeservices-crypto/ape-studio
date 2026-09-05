/**
 * TileChassis — the machined GRAPHITE instrument chassis behind every tool
 * tile in the Measurement & Analysis hub (owner-approved 2026-08-23, "Tile
 * Forge" proposal; mock: docs/art/mic-cutaway/tile_forge.html, pitched against
 * the owner's bronze control-panel reference; coat ruling: graphite).
 *
 * One static SVG per tile, painted once. Zones, outside → in:
 *   1 SEAM — 1px black part-line against the gray rack panel
 *   2 OUTER CHAMFER — bright machined facet, top-lit, wrapping dark on the
 *     bottom + side edges (horizontal vignette)
 *   3 FRAME FACE — brushed graphite: fine horizontal grain, bead-blast grit,
 *     one faint scratch per tile (deterministic per-tile seed — never random
 *     between launches, never identical between tiles)
 *   4 ENGRAVED NAMEPLATE — a recessed plate; the title itself is an RN Text
 *     the host lays over it (paint-filled engraving: light matte fill, dark
 *     top shadow), so adjustsFontSizeToFit keeps working
 *   5 INNER CHAMFER (inverted: dark top / lit bottom) + 6 AO CREVICE around
 *     the display opening — the recess the display cap sinks into on press
 *   7 the DISPLAY GLASS itself is the host's RN view (live minis unchanged);
 *     the chassis draws everything around that exact rect
 *   8 SCREWS — two phillips heads, slots a hair off-true (dashboard vocabulary)
 *
 * (An earlier revision carried a per-tool "hardware rail" of knobs/lamps below
 * the display; the owner cut it 2026-08-23 — decorative controls that did
 * nothing read as noise. The chassis is now display + engraved plate only.)
 *
 * GRADIENT IDS ARE UNIQUE PER TILE (uid = tool key): react-native-svg shares
 * ids across roots — duplicate ids break fills (the documented ToolsHub
 * tile-06 strip failure).
 */
import { memo } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { ToolKey } from './toolsData';

/* ── coat: GRAPHITE (owner ruling 2026-08-23) ─────────────────────────────── */
const C = {
  c0: '#d3d6dc', // chamfer catch-light (device-scale fix 2026-09-01)
  c1: '#71747a',
  face0: '#4a4c52',
  face1: '#323438',
  dark: '#1d1e22',
  crev: '#050506',
  edgeDark: '#141518',
  plate0: '#3f4147',
  plate1: '#2b2d31',
  grainL: 'rgba(255,255,255,0.05)',
  grainD: 'rgba(0,0,0,0.12)',
};

/* ── geometry (parametric in tile width) ──────────────────────────────────── */
export const PLATE_Y = 6.5;
export const PLATE_H = 18;
export const DISP_TOP = 28;
const BOTTOM = 6.5;

export function chassisLayout(w: number) {
  const dispX = 10.5;
  const dispW = w - 21;
  // The cap pads the strip by 4; strips render 2.5:1 inside.
  const dispH = Math.round(((dispW - 8) / 2.5 + 8) * 10) / 10;
  const totalH = Math.round((DISP_TOP + dispH + BOTTOM) * 10) / 10;
  return { dispX, dispY: DISP_TOP, dispW, dispH, totalH };
}

/* deterministic per-tile rng (the GRIT_SPECKS xorshift idiom) */
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

/* ── the chassis ──────────────────────────────────────────────────────────── */
export const TileChassis = memo(function TileChassis({
  tool,
  w,
  seed,
}: {
  tool: ToolKey;
  w: number;
  /** Per-tile wear seed (stable per tool position). */
  seed: number;
}) {
  const u = `tc${tool}`;
  const L = chassisLayout(w);
  const H = L.totalH;
  const r = rng(seed + 7);

  // brushed grain (frame face only, clipped by drawing inside the face inset)
  const grain = [];
  for (let y = 4.5; y < H - 4; y += 3) {
    grain.push(
      <Line key={`g${y}`} x1={4} y1={y} x2={w - 4} y2={y} stroke={y % 6 < 3 ? C.grainL : C.grainD} strokeWidth={0.55} />,
    );
  }
  // bead-blast grit
  const grit = [];
  for (let i = 0; i < 30; i++) {
    grit.push(
      <Circle
        key={`s${i}`}
        cx={4 + r() * (w - 8)}
        cy={4 + r() * (H - 8)}
        r={0.3 + r() * 0.5}
        fill={r() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.16)'}
      />,
    );
  }
  // one faint scratch, per-tile
  const sx = 14 + r() * (w - 70);
  const sy = H - 8 - r() * 3;

  return (
    <Svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} pointerEvents="none">
      <Defs>
        <LinearGradient id={`${u}outer`} x1="0" y1="0" x2="0" y2="1">
          {/* Catch-light confined to the ring's TOP hairline (device-scale fix
              2026-09-01): a full-height bright zone read as a plastic band. */}
          <Stop offset="0" stopColor={C.c0} />
          <Stop offset="0.035" stopColor="#7c7f85" />
          <Stop offset="0.45" stopColor="#3b3d42" />
          <Stop offset="1" stopColor="#101114" />
        </LinearGradient>
        <LinearGradient id={`${u}glint`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(255,255,255,0)" />
          <Stop offset="0.5" stopColor="rgba(255,255,255,0.55)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0)" />
        </LinearGradient>
        <LinearGradient id={`${u}face`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.face0} />
          <Stop offset="1" stopColor={C.face1} />
        </LinearGradient>
        <LinearGradient id={`${u}wrap`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(0,0,0,0.28)" />
          <Stop offset="0.07" stopColor="rgba(0,0,0,0)" />
          <Stop offset="0.93" stopColor="rgba(0,0,0,0)" />
          <Stop offset="1" stopColor="rgba(0,0,0,0.34)" />
        </LinearGradient>
        <LinearGradient id={`${u}inner`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.edgeDark} />
          <Stop offset="1" stopColor={C.c1} />
        </LinearGradient>
      </Defs>

      {/* 1 seam · 2 outer chamfer · 3 frame face (+wrap, grain, grit, scratch) */}
      <Rect x={0} y={0} width={w} height={H} rx={13} fill="#000" />
      <Rect x={1} y={1} width={w - 2} height={H - 2} rx={12} fill={`url(#${u}outer)`} />
      <Rect x={2.2} y={2.2} width={w - 4.4} height={H - 4.4} rx={10.8} fill={`url(#${u}face)`} />
      {grain}
      {grit}
      <Line x1={sx} y1={sy} x2={sx + 26 + r() * 18} y2={sy - 1 - r() * 1.6} stroke="rgba(255,255,255,0.09)" strokeWidth={0.5} />
      <Rect x={1} y={1} width={w - 2} height={H - 2} rx={12} fill={`url(#${u}wrap)`} />
      <Line x1={14} y1={1.7} x2={w - 14} y2={1.7} stroke={`url(#${u}glint)`} strokeWidth={0.6} />
      <Line x1={10} y1={H - 1.8} x2={w - 10} y2={H - 1.8} stroke="rgba(0,0,0,0.45)" strokeWidth={0.8} />

      {/* 4 title zone — the owner removed the recessed nameplate behind the
          title (2026-09-05): the engraved title Text now sits directly on the
          brushed face. PLATE_Y / PLATE_H still position that Text. */}

      {/* 5 inner chamfer (inverted) · 6 AO crevice around the display rect */}
      <Rect x={L.dispX - 2.6} y={L.dispY - 2.6} width={L.dispW + 5.2} height={L.dispH + 5.2} rx={7.6} fill={`url(#${u}inner)`} />
      <Rect x={L.dispX - 1.2} y={L.dispY - 1.2} width={L.dispW + 2.4} height={L.dispH + 2.4} rx={6.2} fill={C.crev} />
      <Rect x={L.dispX - 1.2} y={L.dispY - 1.2} width={L.dispW + 2.4} height={5} rx={6.2} fill="rgba(0,0,0,0.55)" />

      {/* (corner screws removed — owner 2026-09-05: "screws on the panels that
          should not be there") */}
    </Svg>
  );
});
