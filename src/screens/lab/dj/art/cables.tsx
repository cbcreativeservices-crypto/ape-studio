/**
 * cables — how a cable is drawn between two sockets: its plug over each
 * socket, its own lane between (house rule D69: every cable traceable, in
 * parallel lanes, never merged), a PATTERN and a LABEL FLAG as well as a
 * colour (accessibility: XLR dark grey with a fine stripe, TRS black with
 * dots, mains thicker with a ribbed jacket, RCA white / red), and a glow
 * only while the renderer says audio is flowing along that exact route
 * (with a slow travelling pulse when decorative motion is allowed).
 *
 * A LOOSE end sags under its own weight and ends in its plug lying free,
 * drawn from the side (parts.LoosePlug); a plugged end is the plug's back in
 * slight perspective with its cast shadow (parts.PlugFace).
 */
import { useContext, useMemo } from 'react';
import { Group, Line, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { CableKind } from '../model/djModel';
import { INK } from './ink';
import { Cable, LoosePlug, PlugFace, PLUG_R, sagPath, smoothPath, type CablePattern, type CableStyle, type PlugKind } from './parts';
import { SceneFontsContext, SceneText } from './sceneText';
import { textWidthPt } from './Scene';

export type Run = {
  id: string;
  kind: CableKind;
  /** Plug colour (RCA white/red) or jacket. */
  colour: string;
  /** Path through the lane (mm), first point = the fixed end. */
  pts: [number, number][];
  /** The far end is plugged in. */
  plugged: boolean;
  /** Audio flows along it now. */
  live: boolean;
  label: string;
  /** The right-hand conductor of a pair (its pattern is broken). */
  dashed?: boolean;
  /** The far end's plug, when it differs from the fixed end's (a power cord:
   *  IEC C13 at the device, the moulded mains plug at the strip). */
  farKind?: PlugKind;
  /** No plug at the fixed end (a headphone cable is moulded into the cups). */
  noFixedPlug?: boolean;
};

const WIDTH: Record<CableKind, number> = { rca: 3.2, xlr: 4.6, trs: 4.2, phones: 3, iec: 6.2 };

export function styleOf(r: Run): CableStyle {
  const k = r.kind;
  const pattern: CablePattern = k === 'xlr' ? (r.dashed ? 'dash' : 'stripe') : k === 'trs' ? 'dots' : k === 'iec' ? 'ribs' : r.dashed ? 'dash' : 'plain';
  const colour = k === 'rca' ? (r.colour === INK.rcaRed ? '#7a2018' : '#8d9097') : k === 'xlr' ? '#3d4046' : k === 'iec' ? '#16171a' : '#101113';
  return { colour, width: WIDTH[k], pattern };
}

const plugOf = (k: CableKind): PlugKind => (k === 'phones' ? 'trs' : k);

/** One cable run with its plugs and its label flag. */
export function CableRun({ r, flow = false, labelAt }: { r: Run; flow?: boolean; labelAt?: [number, number] }) {
  const st = styleOf(r);
  const a = r.pts[0];
  const b = r.pts[r.pts.length - 1];
  const fixedKind = plugOf(r.kind);
  const farKind = r.farKind ?? fixedKind;
  // a loose end hangs: sag from the last bend to where the plug lies
  const path = useMemo(() => {
    if (r.plugged || r.pts.length < 2) return smoothPath(r.pts);
    const pre = r.pts.slice(0, -1);
    const lastBend = pre[pre.length - 1];
    const pb = Skia.PathBuilder.Make();
    if (pre.length >= 2) pb.addPath(smoothPath(pre));
    else pb.moveTo(lastBend[0], lastBend[1]);
    pb.addPath(sagPath(lastBend, b, 16), undefined, true);
    return pb.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.pts, r.plugged]);
  // the direction the far plug faces (along the last segment)
  const pen = r.pts[r.pts.length - 2] ?? a;
  const angOut = Math.atan2(b[1] - pen[1], b[0] - pen[0]);
  const glow = r.live ? (r.kind === 'iec' ? INK.amber : INK.blue) : null;
  return (
    <Group>
      <Cable pts={r.pts} path={path} style={st} glow={glow} flow={flow && r.live} />
      {r.noFixedPlug ? null : <PlugFace cx={a[0]} cy={a[1]} kind={fixedKind} colour={r.colour} />}
      {r.plugged ? (
        <PlugFace cx={b[0]} cy={b[1]} kind={farKind} colour={r.colour} dir={Math.atan2(pen[1] - b[1], pen[0] - b[0])} />
      ) : (
        <LoosePlug x={b[0]} y={b[1]} ang={angOut} kind={r.kind === 'phones' ? 'phones' : farKind} colour={r.colour} />
      )}
      {labelAt ? <CableFlag x={labelAt[0]} y={labelAt[1]} text={r.label} live={r.live} edge={st.colour === '#101113' || st.colour === '#16171a' ? '#5c626b' : st.colour} /> : null}
    </Group>
  );
}

/** A label flag tied onto a cable: always 9 pt or more on the glass, and
 *  growing with the full-screen zoom. */
export function CableFlag({ x, y, text, live, edge }: { x: number; y: number; text: string; live: boolean; edge: string }) {
  const { s, textScale } = useContext(SceneFontsContext);
  const pt = 9.5 * textScale;
  const mm = pt / Math.max(1e-6, s);
  const w = (textWidthPt(text, textScale) * 0.92 + 8 * textScale) / s;
  const h = mm * 1.32;
  return (
    <Group>
      <RoundedRect x={x - w / 2} y={y - h / 2} width={w} height={h} r={h * 0.3} color="rgba(10,11,13,0.92)" />
      <RoundedRect x={x - w / 2} y={y - h / 2} width={w} height={h} r={h * 0.3} style="stroke" strokeWidth={mm * 0.12} color={edge} />
      <SceneText x={x} y={y + mm * 0.36} size={mm} text={text} color={live ? '#8fbcff' : INK.print} face="label" align="center" minPt={8.9} />
    </Group>
  );
}

/** Hook-and-loop ties binding two parallel lanes every 60 mm along their
 *  shared run (x from x0 to x1 at lanes y0 / y1). */
export function LaneTies({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  const ties: number[] = [];
  const lo = Math.min(x0, x1) + 30;
  const hi = Math.max(x0, x1) - 30;
  for (let x = lo; x <= hi; x += 60) ties.push(x);
  const top = Math.min(y0, y1) - 3.2;
  const hgt = Math.abs(y1 - y0) + 6.4;
  return (
    <Group>
      {ties.map((x) => (
        <Group key={x}>
          <RoundedRect x={x - 2.4} y={top} width={4.8} height={hgt} r={1.6} color="#0a0a0c" />
          <RoundedRect x={x - 1.9} y={top + 0.4} width={3.8} height={hgt - 0.8} r={1.3} color="#24262b" />
          <Line p1={vec(x - 1.4, top + 1)} p2={vec(x - 1.4, top + hgt - 1)} color="rgba(255,255,255,0.12)" strokeWidth={0.5} />
        </Group>
      ))}
    </Group>
  );
}

/** Minimum distance (mm) from point (px, py) to a polyline — the cable
 *  clearance invariant (test/djCables.test.ts). Pure. */
export function distToPolyline(pts: readonly [number, number][], px: number, py: number): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const L2 = dx * dx + dy * dy;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / L2)) : 0;
    const d = Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
    if (d < best) best = d;
  }
  return best;
}
export { PLUG_R };
