/**
 * PlanView — THE ROOM from above (screens 19, 20, 23, 24), authored in
 * CENTIMETRES from model/djRoom (1 unit = 1 cm; the back wall at the top of
 * the glass, the dance floor below; +x — the DJ's left as they face the
 * crowd — is drawn to the right, so PA L, at HOUSE LEFT (the audience's
 * left), is on the viewer's left).
 *
 * Second visual review 2026-10-18 (#16): each top's -6 dB edges stop where
 * they meet the centre line, so two edges never lie on one another; the
 * speakers are held at least 18 pt across with their horn drawn (a symbol
 * size); the BASS map is the subs' COHERENT sum at 60 Hz
 * (djRoom.subsCoherentAt), so spaced subs show their loud and quiet
 * stripes; the legend sits in its own strip under the field, never on it.
 *
 * What it draws is the model, not a picture of one:
 *   - the COVERAGE FIELD: each cell's level from djRoom (the tops' mid-band
 *     coverage at the feed the render measured, or the subs' bass field),
 *     coloured on the house heat ramp, baked once per setting into one Skia
 *     picture;
 *   - each top's NOMINAL coverage edges (its −6 dB lines, dashed);
 *   - the speakers as top views at their true footprints (a 12-inch top
 *     36.5 × 40 cm on its tripod, an 18-inch sub 55 × 70 cm, an 8-inch booth
 *     monitor 27 × 30 cm), aimed as placed;
 *   - the booth table (220 × 70 cm) with the decks and the mixer at their
 *     true footprints, a turntable when the lesson has one;
 *   - the DJ's listening point, and the microphone with its CARDIOID pickup
 *     drawn as a polar outline round it, pointing where it points, and the
 *     feedback paths (speaker → mic) drawn by their loop gain.
 * The field is the mid band (1–4 kHz) of the stated model; the room's
 * reflections are not modelled (said once on the screen).
 */
import { memo, useContext, useMemo } from 'react';
import { AlphaType, BlurMask, Circle, ColorType, DashPathEffect, FilterMode, Group, Image as SkImage, Line, LinearGradient, MipmapMode, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { heatColor, heatRgbW } from '../../../../features/tools/levelColor';
import { INK } from './ink';
import { SceneFontsContext, SceneText, useLabelMm } from './sceneText';
import { BASS_MAP_HZ, MONITORS, PLACEMENTS, ROOM, SUB_PLACES, cardioidDb, coverageGrid, subsCoherentAt, topsDbaAt, type Placement, type Speaker, type SubPlace, type V2 } from '../model/djRoom';
import { MIC_POS, type Feedback, type MicPos } from '../model/djEvent';
import type { Box } from '../geometry/boothGeometry';

/** Plan units (cm) of a room point (m). */
export const P = (v: V2): { x: number; y: number } => ({ x: v.x * 100, y: v.y * 100 });

/** The whole room, framed. */
export const PLAN_FRAME: Box = { x: -720, y: -40, w: 1440, h: ROOM.d * 100 + 60 };
/** The stage end and the front of the floor, closer (the field runs on
 *  past the frame, so the glass is filled). */
export const PLAN_STAGE: Box = { x: -600, y: -40, w: 1200, h: 860 };

export type MapMode = 'TOPS' | 'BASS' | 'NONE';

/** The heat ramp's window for the tops' field (dBA): it follows the level
 *  at the floor centre, so the SHAPE of the coverage reads at any volume
 *  (the legend prints the real numbers). */
export function mapWindow(place: Placement, feedDbfs: number): { lo: number; hi: number } {
  const c = topsDbaAt(ROOM.floorCentre, place, feedDbfs);
  return { lo: c - 18, hi: c + 8 };
}

/* ── the field (one picture per setting) ──────────────────────────────── */

const COLS = 84;
const ROWS = 70;

/** The field as a small image, one pixel per cell, drawn stretched over the
 *  room with LINEAR sampling — a smooth field at every zoom, never blocks. */
function useField(mode: MapMode, place: Placement, subPos: SubPlace, feedDbfs: number) {
  return useMemo(() => {
    if (mode === 'NONE') return null;
    const g = mode === 'TOPS' ? coverageGrid(COLS, ROWS, (p) => topsDbaAt(p, place, feedDbfs)) : coverageGrid(COLS, ROWS, (p) => subsCoherentAt(p, subPos, BASS_MAP_HZ));
    const win = mapWindow(place, feedDbfs);
    let ref = -Infinity;
    if (mode === 'BASS') for (let i = 0; i < g.db.length; i++) ref = Math.max(ref, g.db[i]);
    const px = new Uint8Array(COLS * ROWS * 4);
    for (let i = 0; i < g.db.length; i++) {
      const v = g.db[i];
      const t = mode === 'TOPS' ? (v - win.lo) / (win.hi - win.lo) : (v - ref + 24) / 24;
      const [r, gg, b] = heatRgbW(Math.max(0.02, Math.min(1, t)));
      px[i * 4] = Math.round(r);
      px[i * 4 + 1] = Math.round(gg);
      px[i * 4 + 2] = Math.round(b);
      px[i * 4 + 3] = 255;
    }
    return Skia.Image.MakeImage({ width: COLS, height: ROWS, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul }, Skia.Data.fromBytes(px), COLS * 4);
  }, [mode, place, subPos, mode === 'TOPS' ? Math.round(feedDbfs) : 0]);
}

/* ── the speakers, from above ─────────────────────────────────────────── */

const aimAngle = (s: Speaker): number => Math.atan2(s.aim.y - s.at.y, s.aim.x - s.at.x);

/** The least size (pt) a speaker is drawn at, whatever the plan's scale. */
export const SPEAKER_MIN_PT = 18;
/** How much larger than true a speaker is drawn at this scale (>= 1). */
export function useGlyphScale(trueCm: number): number {
  const { s } = useContext(SceneFontsContext);
  return Math.max(1, SPEAKER_MIN_PT / Math.max(1e-6, trueCm * s));
}

/** A 12-inch top on its tripod (top view): the cabinet's trapezoid (wide
 *  front), the horn's mouth on the front edge, the top handle, the legs. */
function TopPlan({ s, lit, tone = 'amber' }: { s: Speaker; lit?: boolean; tone?: 'amber' | 'red' }) {
  const c = P(s.at);
  const a = aimAngle(s) - Math.PI / 2; // local +y = the way it points
  const g = useGlyphScale(40);
  const cab = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(-18.25, 20);
    p.lineTo(18.25, 20);
    p.lineTo(15, -20);
    p.lineTo(-15, -20);
    p.close();
    return p.detach();
  }, []);
  return (
    <Group transform={[{ translateX: c.x }, { translateY: c.y }, { rotate: a }, { scale: g }]}>
      {/* tripod legs (spread 110 cm), under the box */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((t) => (
        <Line key={t} p1={vec(0, 0)} p2={vec(Math.sin(t + 0.5) * 55, -Math.cos(t + 0.5) * 55)} color="#3a3d43" strokeWidth={3.2} strokeCap="round" />
      ))}
      <Path path={cab} color="rgba(0,0,0,0.6)" transform={[{ translateX: 3 }, { translateY: 4 }]}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={cab}>
        <LinearGradient start={vec(-18, -20)} end={vec(18, 20)} colors={['#3a3d43', '#1c1d21', '#0e0f11']} />
      </Path>
      <Path path={cab} style="stroke" strokeWidth={1.2} color={lit ? (tone === 'red' ? INK.peak : INK.amber) : 'rgba(255,255,255,0.18)'} />
      {/* the horn's mouth flaring to the grille on the front edge */}
      <Path path={HORN} color="#050506" />
      <Path path={HORN} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.22)" />
      <Line p1={vec(-17, 19)} p2={vec(17, 19)} color="#6a6e76" strokeWidth={2.4} />
      {/* the handle cut-out on top */}
      <RoundedRect x={-6.5} y={-6} width={13} height={4} r={2} color="#060607" />
    </Group>
  );
}

/** An 18-inch sub (top view): 55 × 70 cm, its front edge grille. */
function SubPlan({ s }: { s: Speaker }) {
  const c = P(s.at);
  const a = aimAngle(s) - Math.PI / 2;
  const g = useGlyphScale(55);
  return (
    <Group transform={[{ translateX: c.x }, { translateY: c.y }, { rotate: a }, { scale: g }]}>
      <RoundedRect x={-27.5 + 3} y={-35 + 4} width={55} height={70} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={4} style="normal" />
      </RoundedRect>
      <RoundedRect x={-27.5} y={-35} width={55} height={70} r={3}>
        <LinearGradient start={vec(-27, -35)} end={vec(27, 35)} colors={['#2e3136', '#17181b', '#0b0c0e']} />
      </RoundedRect>
      <RoundedRect x={-27.5} y={-35} width={55} height={70} r={3} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.15)" />
      <Line p1={vec(-26, 33.5)} p2={vec(26, 33.5)} color="#5a5e66" strokeWidth={2.4} />
      {[-12, 0, 12].map((xx) => (
        <RoundedRect key={xx} x={xx - 4} y={-29} width={8} height={3} r={1.5} color="#060607" />
      ))}
    </Group>
  );
}

/** An 8-inch booth monitor (top view): 27 × 30 cm. */
function MonitorPlan({ s, lit }: { s: Speaker; lit?: boolean }) {
  const c = P(s.at);
  const a = aimAngle(s) - Math.PI / 2;
  const g = Math.min(useGlyphScale(30), 1.6);
  return (
    <Group transform={[{ translateX: c.x }, { translateY: c.y }, { rotate: a }, { scale: g }]}>
      <RoundedRect x={-13.5 + 2} y={-15 + 3} width={27} height={30} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </RoundedRect>
      <RoundedRect x={-13.5} y={-15} width={27} height={30} r={3}>
        <LinearGradient start={vec(-13, -15)} end={vec(13, 15)} colors={['#34373d', '#1a1b1f']} />
      </RoundedRect>
      <RoundedRect x={-13.5} y={-15} width={27} height={30} r={3} style="stroke" strokeWidth={1} color={lit ? INK.amber : 'rgba(255,255,255,0.18)'} />
      <Line p1={vec(-12.5, 14)} p2={vec(12.5, 14)} color="#5a5e66" strokeWidth={1.8} />
    </Group>
  );
}

/** The booth table with the decks and the mixer at their true footprints
 *  (players 32 × 41, mixer 27 × 39 cm; a turntable 45 × 35 when shown). */
function BoothTable({ turntable }: { turntable: boolean }) {
  const t = ROOM.table;
  const x0 = t.x * 100;
  const y0 = t.y * 100;
  const w = t.w * 100;
  const d = t.d * 100;
  const dev = (cx: number, ww: number, dd: number, kind: 'player' | 'mixer' | 'tt') => (
    <Group key={`${kind}${cx}`}>
      <RoundedRect x={cx - ww / 2} y={y0 + 12} width={ww} height={dd} r={2}>
        <LinearGradient start={vec(cx - ww / 2, y0)} end={vec(cx + ww / 2, y0 + dd)} colors={['#33363d', '#1b1c20']} />
      </RoundedRect>
      <RoundedRect x={cx - ww / 2} y={y0 + 12} width={ww} height={dd} r={2} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.15)" />
      {kind === 'player' ? (
        <Group>
          <Circle cx={cx} cy={y0 + 12 + dd * 0.62} r={10.3} color="#0b0c0e" />
          <Circle cx={cx} cy={y0 + 12 + dd * 0.62} r={10.3} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.2)" />
          <Rect x={cx - 7.7} y={y0 + 12 + 3} width={15.5} height={8.7} color="#0b1a28" />
        </Group>
      ) : kind === 'tt' ? (
        <Group>
          <Circle cx={cx - 4} cy={y0 + 12 + dd / 2} r={16.6} color="#0a0a0c" />
          <Circle cx={cx - 4} cy={y0 + 12 + dd / 2} r={15.1} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.12)" />
          <Line p1={vec(cx + 16, y0 + 12 + 6)} p2={vec(cx + 4, y0 + 12 + dd * 0.68)} color="#c9ccd2" strokeWidth={1} />
        </Group>
      ) : (
        <Group>
          {[-8, 8].map((o) => (
            <Line key={o} p1={vec(cx + o, y0 + 12 + 24)} p2={vec(cx + o, y0 + 12 + 30)} color="#050506" strokeWidth={1.4} />
          ))}
          <Line p1={vec(cx - 4, y0 + 12 + 36)} p2={vec(cx + 4, y0 + 12 + 36)} color="#050506" strokeWidth={1.4} />
        </Group>
      )}
    </Group>
  );
  return (
    <Group>
      <RoundedRect x={x0 + 4} y={y0 + 6} width={w} height={d} r={3} color="rgba(0,0,0,0.6)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={x0} y={y0} width={w} height={d} r={3}>
        <LinearGradient start={vec(x0, y0)} end={vec(x0 + w, y0 + d)} colors={['#1d1e22', '#111214']} />
      </RoundedRect>
      <RoundedRect x={x0} y={y0} width={w} height={d} r={3} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
      {/* the deck B · mixer · deck A row (seen from above, DJ's left on the right) */}
      {dev(-30.5 - 18 - 13.5, 32, 41, 'player')}
      {dev(0, 27, 39, 'mixer')}
      {dev(30.5 + 18 + 13.5, 32, 41, 'player')}
      {turntable ? dev(-92, 45, 35, 'tt') : null}
    </Group>
  );
}

/** The DJ's listening point: an ear-height marker (not a figure). */
function EarMark({ at, tone }: { at: V2; tone: string }) {
  const c = P(at);
  return (
    <Group>
      <Circle cx={c.x} cy={c.y} r={16} color={tone} opacity={0.25}>
        <BlurMask blur={6} style="normal" />
      </Circle>
      <Circle cx={c.x} cy={c.y} r={11} style="stroke" strokeWidth={2} color={tone} />
      <Circle cx={c.x} cy={c.y} r={4} color={tone} />
    </Group>
  );
}

/** The mic: its body (top view) and its cardioid pickup as a polar outline. */
function MicPlan({ pos, state }: { pos: MicPos; state: Feedback['state'] }) {
  const m = MIC_POS[pos];
  const c = P(m.at);
  const axisA = Math.atan2(m.axis.y, m.axis.x);
  const tone = state === 'RINGING' ? INK.peak : state === 'EDGE' ? INK.amber : INK.green;
  const polar = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const R = 85;
    for (let i = 0; i <= 72; i++) {
      const phi = (i / 72) * 2 * Math.PI;
      const g = Math.pow(10, cardioidDb((phi * 180) / Math.PI) / 20);
      const rr = R * g;
      const x = Math.cos(axisA + phi) * rr;
      const y = Math.sin(axisA + phi) * rr;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p.detach();
  }, [axisA]);
  return (
    <Group transform={[{ translateX: c.x }, { translateY: c.y }]}>
      <Path path={polar} color={tone} opacity={0.16} />
      <Path path={polar} style="stroke" strokeWidth={1.6} color={tone} opacity={0.9} />
      {/* the handheld from above: grille ball forward, body back along −axis */}
      <Group transform={[{ rotate: axisA }]}>
        <RoundedRect x={-20} y={-3} width={18} height={6} r={3} color="#2a2c31" />
        <Circle cx={2} cy={0} r={5}>
          <RadialGradient c={vec(0.5, -1.5)} r={6} colors={['#c9ced5', '#3a3d43']} />
        </Circle>
      </Group>
    </Group>
  );
}

/* ── the plan ─────────────────────────────────────────────────────────── */

export type PlanSpec = {
  map: MapMode;
  place: Placement;
  subPos: SubPlace;
  subs: boolean;
  /** The tops' feed (dBFS average) the field is drawn at. */
  feedDbfs: number;
  monitors: boolean;
  turntable?: boolean;
  mic?: { pos: MicPos; fb: Feedback } | null;
  /** Show each top's −6 dB coverage edges. */
  edges?: boolean;
  /** Tint the DJ's point (e.g. red when the decks are too loud). */
  djTone?: string;
  /** Mark a top (the one feeding back). */
  hotTop?: 'topL' | 'topR' | null;
  /** Draw the floor-centre and front-centre measuring points. */
  points?: boolean;
};

export const PlanView = memo(function PlanView({ spec }: { spec: PlanSpec }) {
  const field = useField(spec.map, spec.place, spec.subPos, spec.feedDbfs);
  const tops = PLACEMENTS[spec.place].tops;
  const subs = SUB_PLACES[spec.subPos].subs;
  const W = ROOM.w * 100;
  const D = ROOM.d * 100;
  const labelMm = useLabelMm(9.5);
  const edgePath = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (const [x0, y0, x1, y1] of edgeSegments(spec.place)) {
      p.moveTo(x0, y0);
      p.lineTo(x1, y1);
    }
    return p.detach();
  }, [spec.place]);
  return (
    <Group>
      {/* the room: walls, the stage, the floor */}
      <Group clip={Skia.XYWHRect(-W / 2, 0, W, D)}>
        <Rect x={-W / 2} y={0} width={W} height={D}>
          <LinearGradient start={vec(0, 0)} end={vec(0, D)} colors={['#141519', '#0c0d10']} />
        </Rect>
        {field ? <SkImage image={field} x={-W / 2} y={0} width={W} height={D} fit="fill" sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.None }} /> : null}
        {/* the stage riser (back 3 m) */}
        <Rect x={-W / 2} y={0} width={W} height={300} color="rgba(255,255,255,0.035)" />
        <Line p1={vec(-W / 2, 300)} p2={vec(W / 2, 300)} color="rgba(255,255,255,0.18)" strokeWidth={2}>
          <DashPathEffect intervals={[14, 10]} />
        </Line>
        {spec.edges ? (
          <Path path={edgePath} style="stroke" strokeWidth={2.4} color="rgba(255,255,255,0.65)">
            <DashPathEffect intervals={[16, 12]} />
          </Path>
        ) : null}
      </Group>
      <Rect x={-W / 2 - 14} y={-14} width={W + 28} height={14} color="#2a2c31" />
      <Rect x={-W / 2 - 14} y={0} width={14} height={D} color="#2a2c31" />
      <Rect x={W / 2} y={0} width={14} height={D} color="#2a2c31" />
      <SceneText x={0} y={300 + labelMm * 1.5} size={labelMm} text="DANCE FLOOR" color="rgba(255,255,255,0.45)" face="label" align="center" />
      <BoothTable turntable={!!spec.turntable} />
      {spec.subs ? subs.map((s) => <SubPlan key={s.id} s={s} />) : null}
      <TopPlan s={tops.L} lit={spec.hotTop === 'topL'} tone="red" />
      <TopPlan s={tops.R} lit={spec.hotTop === 'topR'} tone="red" />
      {spec.monitors ? (
        <>
          <MonitorPlan s={MONITORS.L} />
          <MonitorPlan s={MONITORS.R} />
        </>
      ) : null}
      {spec.mic ? <FeedbackPaths mic={spec.mic.pos} fb={spec.mic.fb} place={spec.place} /> : null}
      <EarMark at={ROOM.dj} tone={spec.djTone ?? INK.white} />
      {spec.mic ? <MicPlan pos={spec.mic.pos} state={spec.mic.fb.state} /> : null}
      {spec.points ? (
        <>
          <Point at={ROOM.floorCentre} />
          <Point at={{ x: 0, y: 4.2 }} />
        </>
      ) : null}
    </Group>
  );
});

function Point({ at }: { at: V2 }) {
  const c = P(at);
  return (
    <Group>
      <Circle cx={c.x} cy={c.y} r={9} color="rgba(0,0,0,0.6)" />
      <Line p1={vec(c.x - 14, c.y)} p2={vec(c.x + 14, c.y)} color={INK.white} strokeWidth={2} />
      <Line p1={vec(c.x, c.y - 14)} p2={vec(c.x, c.y + 14)} color={INK.white} strokeWidth={2} />
    </Group>
  );
}

/** Each feedback path: a line from the speaker to the mic, heavier and
 *  redder the closer its loop gain is to 0 dB. */
function FeedbackPaths({ mic, fb, place }: { mic: MicPos; fb: Feedback; place: Placement }) {
  const m = P(MIC_POS[mic].at);
  const at: Record<string, V2> = { topL: P(PLACEMENTS[place].tops.L.at), topR: P(PLACEMENTS[place].tops.R.at), monL: P(MONITORS.L.at), monR: P(MONITORS.R.at) };
  return (
    <Group>
      {fb.paths.map((p) => {
        const s = at[p.id];
        const k = Math.max(0, Math.min(1, (p.loopDb + 18) / 18));
        if (k <= 0.02) return null;
        const col = p.loopDb >= 0 ? INK.peak : p.loopDb > -3 ? INK.amber : INK.blue;
        return (
          <Group key={p.id}>
            <Line p1={vec(s.x, s.y)} p2={vec(m.x, m.y)} color={col} strokeWidth={2 + 8 * k} opacity={0.18 + 0.4 * k} strokeCap="round">
              <BlurMask blur={4} style="normal" />
            </Line>
            <Line p1={vec(s.x, s.y)} p2={vec(m.x, m.y)} color={col} strokeWidth={1.5 + 2 * k} opacity={0.9}>
              <DashPathEffect intervals={[10, 8]} />
            </Line>
          </Group>
        );
      })}
    </Group>
  );
}

/** The legend strip's height (pt, x k) under the field (`strip`). */
export const LEGEND_H = 30;

/** Each top's -6 dB edges as segments (cm): an edge that heads toward the
 *  room's centre line stops there, so the two tops' inner edges meet and
 *  are drawn ONCE, never one over the other; the outer edges run to the
 *  walls or the end of the plan. Pure (pinned by test). */
export function edgeSegments(place: Placement): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const t = PLACEMENTS[place].tops;
  const W = (ROOM.w * 100) / 2;
  const D = ROOM.d * 100;
  for (const top of [t.L, t.R]) {
    const c = P(top.at);
    const a = aimAngle(top);
    const half = ((top.coverageDeg / 2) * Math.PI) / 180;
    for (const sg of [-1, 1]) {
      const dx = Math.cos(a + sg * half);
      const dy = Math.sin(a + sg * half);
      let len = 4000;
      if (dx > 1e-6) len = Math.min(len, (W - c.x) / dx);
      if (dx < -1e-6) len = Math.min(len, (-W - c.x) / dx);
      if (dy > 1e-6) len = Math.min(len, (D - c.y) / dy);
      if (dy < -1e-6) len = Math.min(len, (0 - c.y) / dy);
      // toward the centre line: stop at it
      if (Math.abs(c.x) > 1 && Math.abs(dx) > 1e-6 && Math.sign(dx) === -Math.sign(c.x)) len = Math.min(len, -c.x / dx);
      out.push([c.x, c.y, c.x + dx * len, c.y + dy * len]);
    }
  }
  return out;
}

/** The heat ramp's legend, in screen points: the colours from quiet to loud
 *  with their dBA (or relative dB) marks. `strip`: a full-width strip in its
 *  own band under the field (the page fits the field above it, so the
 *  legend never covers it); else a small panel at the bottom right. */
export function HeatLegend({ w, h, k = 1, mode, place = 'CORNERS', feedDbfs = -20, strip = false }: { w: number; h: number; k?: number; mode: MapMode; place?: Placement; feedDbfs?: number; strip?: boolean }) {
  if (mode === 'NONE') return null;
  if (strip) return <HeatStrip w={w} h={h} k={k} mode={mode} place={place} feedDbfs={feedDbfs} />;
  const bw = 96 * k;
  const bh = 7 * k;
  const fs = 9 * k;
  const x = w - bw - 10 * k;
  const y = h - bh - fs * 2 - 14 * k;
  const stops = Array.from({ length: 11 }, (_, i) => heatColor(0.02 + (0.98 * i) / 10));
  const win = mapWindow(place, feedDbfs);
  const m0 = Math.ceil(win.lo / 5) * 5;
  const marks = mode === 'TOPS' ? [m0, m0 + 10, m0 + 20].filter((m) => m <= win.hi) : [-18, -12, -6, 0];
  const pos = (v: number) => (mode === 'TOPS' ? (v - win.lo) / (win.hi - win.lo) : (v + 24) / 24);
  return (
    <Group>
      <RoundedRect x={x - 6 * k} y={y - 4 * k} width={bw + 12 * k} height={bh + fs * 2 + 10 * k} r={5 * k} color="rgba(8,8,10,0.78)" />
      <RoundedRect x={x} y={y + fs + 2 * k} width={bw} height={bh} r={2 * k}>
        <LinearGradient start={vec(x, 0)} end={vec(x + bw, 0)} colors={stops} />
      </RoundedRect>
      <SceneText x={x} y={y + fs - 1 * k} size={fs} text={mode === 'TOPS' ? 'TOPS · dBA (MODEL)' : 'BASS · dB'} color={INK.print} face="label" />
      {marks.map((m) => (
        <SceneText key={m} x={x + pos(m) * bw} y={y + fs * 2 + bh + 4 * k} size={fs} text={String(m)} color={INK.printDim} face="label" align="center" />
      ))}
    </Group>
  );
}

const HORN = Skia.Path.MakeFromSVGString('M -4 4 L 4 4 L 14 18 L -14 18 Z')!;

function HeatStrip({ w, h, k, mode, place, feedDbfs }: { w: number; h: number; k: number; mode: MapMode; place: Placement; feedDbfs: number }) {
  const fs = 9 * k;
  const y0 = h - LEGEND_H * k;
  const label = mode === 'TOPS' ? 'TOPS · dBA (MODEL)' : `BASS AT ${BASS_MAP_HZ} Hz · dB`;
  const lw = (mode === 'TOPS' ? 100 : 112) * k;
  const x = 8 * k + lw;
  const bw = Math.max(60, w - x - 14 * k);
  const bh = 6 * k;
  const stops = Array.from({ length: 11 }, (_, i) => heatColor(0.02 + (0.98 * i) / 10));
  const win = mapWindow(place, feedDbfs);
  const m0 = Math.ceil(win.lo / 5) * 5;
  const marks = mode === 'TOPS' ? [m0, m0 + 5, m0 + 10, m0 + 15, m0 + 20].filter((m) => m <= win.hi) : [-24, -18, -12, -6, 0];
  const pos = (v: number) => (mode === 'TOPS' ? (v - win.lo) / (win.hi - win.lo) : (v + 24) / 24);
  return (
    <Group>
      <Rect x={0} y={y0} width={w} height={LEGEND_H * k} color="#0b0b0d" />
      <Line p1={vec(0, y0)} p2={vec(w, y0)} color="rgba(255,255,255,0.12)" strokeWidth={1} />
      <SceneText x={8 * k} y={y0 + 4 * k + fs} size={fs} text={label} color={INK.print} face="label" />
      <RoundedRect x={x} y={y0 + 6 * k} width={bw} height={bh} r={2 * k}>
        <LinearGradient start={vec(x, 0)} end={vec(x + bw, 0)} colors={stops} />
      </RoundedRect>
      {marks.map((m) => (
        <SceneText key={m} x={x + pos(m) * bw} y={y0 + 6 * k + bh + 2 * k + fs} size={fs} text={String(m)} color={INK.printDim} face="label" align="center" />
      ))}
    </Group>
  );
}

/** Plan anchors for labels (cm). */
export const planAt = {
  top: (place: Placement, side: 'L' | 'R') => P(PLACEMENTS[place].tops[side].at),
  sub: (place: SubPlace, i = 0) => P(SUB_PLACES[place].subs[Math.min(i, SUB_PLACES[place].subs.length - 1)].at),
  monitor: (side: 'L' | 'R') => P(MONITORS[side].at),
  dj: () => P(ROOM.dj),
  mic: (pos: MicPos) => P(MIC_POS[pos].at),
  floorCentre: () => P(ROOM.floorCentre),
  frontCentre: () => P({ x: 0, y: 4.2 }),
  table: () => P({ x: 0, y: ROOM.table.y + ROOM.table.d / 2 }),
  decks: () => P(ROOM.decks),
};

/** Bodies (for label placement) on the plan, cm. */
export function planObstacles(place: Placement, subPos: SubPlace, subs: boolean, monitors: boolean): Box[] {
  const box = (v: V2, r: number): Box => ({ x: v.x * 100 - r, y: v.y * 100 - r, w: r * 2, h: r * 2 });
  const t = PLACEMENTS[place].tops;
  const out: Box[] = [box(t.L.at, 30), box(t.R.at, 30), { x: ROOM.table.x * 100, y: ROOM.table.y * 100, w: ROOM.table.w * 100, h: ROOM.table.d * 100 }, box(ROOM.dj, 18)];
  if (subs) for (const s of SUB_PLACES[subPos].subs) out.push(box(s.at, 40));
  if (monitors) out.push(box(MONITORS.L.at, 20), box(MONITORS.R.at, 20));
  return out;
}
