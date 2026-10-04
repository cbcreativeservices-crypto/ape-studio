/**
 * RoomPlanView — the TOP-DOWN plan of the room: the main editing view of the
 * Room Design & Monitoring Lab (owner spec 2026-10-01). SVG, so it draws on
 * every platform (Skia is blank on the web preview) and its text scales with
 * the viewBox in FULL SCREEN.
 *
 * Everything is laid out in GLASS UNITS (box ÷ StageTextScale) and painted
 * through one viewBox, so at every zoom step the plan is the glass plan,
 * larger — walls, speakers, the listener's head, panels, paths, labels. A
 * touch is divided by the same scale before it is mapped to metres
 * (planGeom.ts), so a drag lands under the finger at 1× and 2× alike.
 *
 * Real objects, never stand-ins (house visual standard): a monitor seen from
 * above is a cabinet with a woofer; the listener is the line-art bald head
 * (head-icon spec) seen from above with its ears; doors swing, windows glaze,
 * panels have thickness. Level and pressure are coloured on the amplitude
 * standard (features/tools/levelColor.ts): quiet blue → loud red.
 */
import { memo, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { fieldLevelColor, levelColorForDb } from '../../../features/tools/levelColor';
import { StageAspectReport, useStageTextScale } from '../rack/stageAspect';
import { fingerAt, fingerOffset, pickHandle, planTransform, touchToGlass, type Finger, type PlanTransform } from './planGeom';
import {
  bounds,
  distToEdge,
  edgePoint,
  fmtLen,
  modePressure,
  planReflections,
  pointInPolygon,
  type Analysis,
  type Pt,
  type Reflection,
  type RoomDesign,
  type Speaker,
  type Treatment,
} from './roomModel';

export type PlanLayers = {
  triangle?: boolean;
  boundaries?: boolean;
  reflections?: boolean;
  modes?: boolean;
  treatment?: boolean;
  dims?: boolean;
};

export type PlanEditMode = 'room' | 'monitoring' | 'treatment' | 'none';

export type PlanHandle = { id: string; px: number; py: number; r?: number };

/** A reflection path being traced: the index into analysis.reflections and
 *  the fraction of the path the pulse has travelled — a SharedValue, so the
 *  pulse moves on the UI thread and the plan is not re-rendered per frame
 *  (perf hunt 2026-10-03). */
export type Trace = { index: number; progress: SharedValue<number> } | null;

const WALL = '#8d919c';
const WALL_SOFT = '#3b3e47';
/** Wall and ceiling strokes by material, so the FINISH tray's WALLS and
 *  CEILING picks change the picture, not only the α figures (every control
 *  makes a visible change). Plasterboard grey is the plan's default wall. */
export const SURFACE_TINT: Record<string, string> = {
  drywall: WALL,
  concrete: '#6b6f78',
  glass: '#7fc4e8',
  wood: '#a8835a',
  curtain: '#9a6f8f',
  acoustictile: '#8e9a90',
};
/** Where the lab says each listening-distance class is heard from (metres):
 *  nearfield about 1–1.5 m, midfield about 2–4 m (modMonitoring's prose). */
export const FIELD_RANGE_M: Record<string, [number, number] | null> = {
  nearfield: [0.8, 1.8],
  midfield: [1.8, 4.2],
  other: null,
};
/** The floor fill by material. Still dark (the heat map and the paths read
 *  over it) but each a distinct hue: the old four near-blacks differed by 2–4
 *  levels a channel, so a FLOOR pick changed nothing a learner could see
 *  (toddler pass 2026-10-01). */
export const FLOOR_TINT: Record<string, string> = {
  carpet: '#2b2018',
  hardwood: '#3b2913',
  concrete: '#25272b',
  tile: '#16303a',
};
const HEAD_LINE = '#d9dbe0';
const HEAD_PLATE = '#15161a';
const SPK_HI = '#5b5f6a';
const SPK_LO = '#26282e';
const AMBER = colors.amber;
const CYAN = colors.cyanBright;
const GREEN = colors.green;
const TREAT = '#c9a24a';
const TREAT_OFF = '#4a4336';

/** Minimum glyph size in glass units — a 20 cm monitor on a 30-pt/m plan
 *  would be 6 pt; a glyph must stay readable on the glass. */
const MIN_GLYPH = 15;

export function RoomPlanView({
  w,
  h,
  design,
  analysis,
  layers,
  modeIndex = 0,
  edit = 'none',
  selected,
  onSelect,
  onDrag,
  onDragEnd,
  trace = null,
  highlight = null,
}: {
  w: number;
  h: number;
  design: RoomDesign;
  analysis: Analysis;
  layers: PlanLayers;
  modeIndex?: number;
  edit?: PlanEditMode;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** A handle moved to a point in METRES. */
  onDrag?: (id: string, p: Pt) => void;
  onDragEnd?: (id: string) => void;
  trace?: Trace;
  /** A just-added item (`tr_<id>` / `op_<id>`) wears a ring for a moment. */
  highlight?: string | null;
}) {
  const s = useStageTextScale();
  const gw = w / s;
  const gh = h / s;
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const b = useMemo(() => bounds(room), [room]);
  const liveT = useMemo(() => planTransform(b, gw, gh), [b, gw, gh]);
  // The transform is HELD while a handle is dragged (bug pass 2026-10-01):
  // dragging a corner outward grows the bounding box, which re-fit the plan
  // (smaller k, shifted origin) on every move — the same finger point then
  // mapped further out, the room grew again, and the corner ran away to the
  // ROOM_MAX_M clamp. Held, the finger and the corner stay together; the plan
  // settles once on release (the aspect rule below). A box-size change
  // (rotation / full screen) drops the hold.
  const frozenT = useRef<PlanTransform | null>(null);
  const T = frozenT.current && frozenT.current.gw === gw && frozenT.current.gh === gh ? frozenT.current : liveT;
  const [, settle] = useState(0);
  const units = room.units;
  const v = room.vertices;
  const fs = 9.5; // glass points — the floor; grows with the zoom

  // FULL SCREEN draws the plan in its OWN shape (the StageFit rule): 1× is
  // the whole plan uncropped and FIT fills the body's other side. The shape
  // is held while a corner is being dragged so the box never resizes under
  // the finger; it settles once on release.
  const report = useContext(StageAspectReport);
  const dragging = useRef(false);
  const aspectRef = useRef((b.width + 0.7) / (b.length + 0.7));
  if (!dragging.current) aspectRef.current = (b.width + 0.7) / (b.length + 0.7);
  const aspect = Math.round(aspectRef.current * 100) / 100;
  useEffect(() => {
    report?.aspect(aspect, 0);
  }, [report, aspect]);

  // ── drag handles ──────────────────────────────────────────────────────────
  const handles: PlanHandle[] = useMemo(() => {
    const out: PlanHandle[] = [];
    if (edit === 'room') {
      v.forEach((p, i) => {
        const q = T.toPx(p);
        out.push({ id: `v${i}`, px: q.x, py: q.y, r: 20 });
      });
      for (const f of room.features) {
        const q = T.toPx(f);
        out.push({ id: `f_${f.id}`, px: q.x, py: q.y, r: Math.max(16, (Math.min(f.w, f.d) * T.k) / 2) });
      }
    } else if (edit === 'monitoring') {
      for (const sp of lay.speakers) {
        const q = T.toPx(sp);
        out.push({ id: sp.role, px: q.x, py: q.y, r: 22 });
      }
      const q = T.toPx(lay.listener);
      out.push({ id: 'listener', px: q.x, py: q.y, r: 22 });
    } else if (edit === 'treatment') {
      for (const t of design.treatment) {
        const c = treatmentCentre(t, room);
        if (!c) continue;
        const q = T.toPx(c);
        out.push({ id: `tr_${t.id}`, px: q.x, py: q.y, r: 22 });
      }
    }
    return out;
  }, [edit, v, room, lay, design.treatment, T]);

  const ref = useRef({ handles, T, s, gw, gh, onSelect, onDrag, onDragEnd });
  ref.current = { handles, T, s, gw, gh, onSelect, onDrag, onDragEnd };
  // The drag remembers the glass it began on: a rotation or a full-screen
  // re-fit mid-drag changes the box, the hold drops, and the anchored finger
  // (glass units of the OLD box) then mapped through the NEW transform —
  // the corner or speaker leapt across the room (toddler pass 2026-10-01).
  const drag = useRef<{ id: string; gx: number; gy: number; s: number; gw: number; gh: number; finger: Finger } | null>(null);
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    dragging.current = false;
    frozenT.current = null;
    settle((n) => n + 1); // re-fit the plan (and the aspect) once, now
    return d;
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const st = ref.current;
        const g = touchToGlass(e.nativeEvent.locationX, e.nativeEvent.locationY, st.s);
        const hit = pickHandle(st.handles, g.x, g.y);
        if (!hit) return false;
        drag.current = { id: hit.id, gx: g.x, gy: g.y, s: st.s, gw: st.gw, gh: st.gh, finger: fingerAt(e.nativeEvent) };
        dragging.current = true;
        frozenT.current = st.T;
        st.onSelect?.(hit.id);
        return true;
      },
      onPanResponderMove: (e, gs) => {
        const st = ref.current;
        const d = drag.current;
        if (!d) return;
        // Only the finger that grabbed the item moves it (a second finger on
        // the lane or the glass used to drag it too); once that finger lifts,
        // the drag ends where the item is.
        const off = fingerOffset(e.nativeEvent, d.finger, { dx: gs.dx, dy: gs.dy });
        if (d.s !== st.s || d.gw !== st.gw || d.gh !== st.gh || off === 'lifted') {
          // The glass changed under the finger: let go where the item is.
          endDrag();
          st.onDragEnd?.(d.id);
          return;
        }
        // Anchored delta: base + finger offset ÷ scale reproduces the finger
        // in glass units without re-basing (the Binaural stage's rule).
        const gx = d.gx + off.dx / st.s;
        const gy = d.gy + off.dy / st.s;
        st.onDrag?.(d.id, st.T.toM({ x: gx, y: gy }));
      },
      onPanResponderRelease: () => {
        const d = endDrag();
        if (d) ref.current.onDragEnd?.(d.id);
      },
      onPanResponderTerminate: () => {
        const d = endDrag();
        if (d) ref.current.onDragEnd?.(d.id);
      },
      // Asked but refused (another view held the responder and kept it):
      // start had already held the transform and the aspect, and nothing
      // else would ever let go of them (night pass 2, 2026-10-01).
      onPanResponderReject: () => {
        endDrag();
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // ── the plan outline ──────────────────────────────────────────────────────
  const outlinePath = useMemo(() => roomOutlinePath(v, room.curvedWall, T), [v, room.curvedWall, T]);
  const centroid = useMemo(() => polyCentroid(v), [v]);

  // ── modal heat map at ear height (one mode) ───────────────────────────────
  // Keyed on VALUES (toddler pass 2, 2026-10-01): every drag frame hands in a
  // fresh analysis, so the old identity deps rebuilt up to ~1,850 cells (a
  // 15 m room) per frame although a speaker or listener drag changes none of
  // them; the cells are painted by a memoised layer below.
  const mode = layers.modes ? analysis.modes[Math.max(0, Math.min(analysis.modes.length - 1, modeIndex))] : undefined;
  const { L: mL, W: mW, H: mH } = analysis.modalDims;
  const earZ = lay.listener.earZ;
  const heat = useMemo(() => {
    if (!mode) return null;
    const cell = Math.max(0.12, Math.min(0.35, Math.max(b.width, b.length) / 22));
    const cells: { x: number; y: number; c: string }[] = [];
    for (let y = b.minY + cell / 2; y < b.maxY; y += cell) {
      for (let x = b.minX + cell / 2; x < b.maxX; x += cell) {
        if (!pointInPolygon({ x, y }, v)) continue;
        const p = modePressure(mL, mW, mH, mode, y - b.minY, x - b.minX, earZ);
        cells.push({ x, y, c: fieldLevelColor(p) });
      }
    }
    return { mode, cell, cells };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode?.nx, mode?.ny, mode?.nz, mode?.f, mL, mW, mH, b, v, earZ]);

  const floorTint = FLOOR_TINT[room.floor] ?? '#17181a';
  const spk = (role: string) => lay.speakers.find((x) => x.role === role);
  const Lsp = spk('L');
  const Rsp = spk('R');
  const lisPx = T.toPx(lay.listener);
  // Multichannel: 26 paths over a heat map is a wall of lines. Draw the L
  // and R paths, plus the selected speaker's own (cognitive review 19).
  const multi = lay.speakers.filter((s) => s.role !== 'SUB').length > 2;
  const shownReflections = planReflections(analysis.reflections, lay.speakers, selected);
  // Role letters go INSIDE the cabinet in multichannel, and are hidden when
  // the cabinet is almost touching the front wall (cognitive review 10).
  const frontEdgeDist = (p: Pt) => distToEdge(p, v, 0).dist;
  // The angle and the NEARFIELD / MIDFIELD line sit under the head; with the
  // listener near the rear wall on a short glass they ran off the bottom and
  // the number was cropped (toddler pass 2026-10-01) — then both go above.
  const below = lisPx.y + 24 + fs + 3 + 4 <= gh;
  const angleY = below ? lisPx.y + 24 : lisPx.y - 22 - (fs + 3);
  const fieldY = below ? lisPx.y + 24 + fs + 3 : lisPx.y - 22;
  const labelMode = (sp: Speaker): 'inside' | 'above' | 'none' => (multi ? 'inside' : frontEdgeDist(sp) * T.k < 22 ? 'none' : 'above');

  return (
    <View style={{ width: w, height: h }} {...(edit === 'none' ? {} : pan.panHandlers)} accessible accessibilityLabel={`Room plan, ${fmtLen(b.width, units)} by ${fmtLen(b.length, units)}`}>
      <Svg width={w} height={h} viewBox={`0 0 ${gw} ${gh}`}>
        {/* Floor */}
        <Path d={outlinePath} fill={floorTint} stroke="none" />

        {/* Modal pressure field — the amplitude colour standard: blue quiet → red loud */}
        {heat ? <HeatLayer heat={heat} T={T} /> : null}

        {/* Rug (under everything else that stands in the room) */}
        {layers.treatment !== false
          ? design.treatment.filter((t) => t.kind === 'rug').map((t) => <RugGlyph key={t.id} t={t} T={T} selected={selected === `tr_${t.id}`} />)
          : null}

        {/* Furniture */}
        {room.features.map((f) => (
          <FeatureGlyph key={f.id} f={f} T={T} fs={fs} selected={selected === `f_${f.id}`} draggable={edit === 'room'} />
        ))}

        {/* Walls — stroked in the wall material's tint */}
        <Path d={outlinePath} fill="none" stroke={SURFACE_TINT[room.walls] ?? WALL} strokeWidth={3} strokeLinejoin="round" />
        {/* Openings: doors swing into the room, windows glaze the wall */}
        {room.openings.map((o) => (
          <OpeningGlyph key={o.id} o={o} v={v} T={T} centroid={centroid} fs={fs} flash={highlight === `op_${o.id}`} />
        ))}

        {/* Wall treatment */}
        {layers.treatment !== false
          ? design.treatment.filter((t) => t.kind !== 'rug').map((t) => <TreatmentGlyph key={t.id} t={t} T={T} room={room} centroid={centroid} fs={fs} selected={selected === `tr_${t.id}`} />)
          : null}
        {/* The ring on a just-added treatment item */}
        {highlight && highlight.startsWith('tr_')
          ? (() => {
              const t = design.treatment.find((x) => `tr_${x.id}` === highlight);
              const c = t ? treatmentCentre(t, room) : null;
              if (!c) return null;
              const q = T.toPx(c);
              return <Circle cx={q.x} cy={q.y} r={Math.max(14, ((t?.width ?? 0.6) * T.k) / 2 + 8)} fill="none" stroke={GREEN} strokeWidth={2} opacity={0.9} />;
            })()
          : null}

        {/* Reflection paths */}
        {layers.reflections
          ? shownReflections.map((r, i) => <ReflectionPath key={i} r={r} T={T} lay={lay} fs={fs} />)
          : null}

        {/* Boundary distance lines */}
        {layers.boundaries && analysis.stereo ? <BoundaryLines design={design} analysis={analysis} T={T} fs={fs} /> : null}

        {/* Stereo triangle */}
        {layers.triangle && Lsp && Rsp ? (
          <G>
            <Polyline
              points={`${T.toPx(Lsp).x},${T.toPx(Lsp).y} ${lisPx.x},${lisPx.y} ${T.toPx(Rsp).x},${T.toPx(Rsp).y} ${T.toPx(Lsp).x},${T.toPx(Lsp).y}`}
              fill="rgba(127,212,255,0.05)"
              stroke={CYAN}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.8}
            />
            {analysis.stereo ? (
              <SvgText x={lisPx.x} y={angleY} fill={CYAN} fontSize={fs + 1} fontFamily={fonts.mono} textAnchor="middle">
                {`${analysis.stereo.angleDeg.toFixed(0)}°`}
              </SvgText>
            ) : null}
            {/* The listening-distance class under the angle: the SETUP tray's
                NEARFIELD / MIDFIELD pick is drawn, amber when the speakers sit
                outside the distance that class is heard from. */}
            {analysis.stereo && design.monitoring.field !== 'other'
              ? (() => {
                  const d = (analysis.stereo.distL + analysis.stereo.distR) / 2;
                  const range = FIELD_RANGE_M[design.monitoring.field];
                  const fits = !range || (d >= range[0] && d <= range[1]);
                  return (
                    <SvgText x={lisPx.x} y={fieldY} fill={fits ? CYAN : AMBER} fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
                      {`${design.monitoring.field.toUpperCase()} · ${fmtLen(d, units)}${fits ? '' : ' ?'}`}
                    </SvgText>
                  );
                })()
              : null}
          </G>
        ) : null}

        {/* Centre line of the plan */}
        {layers.triangle ? (
          <Line x1={T.toPx({ x: (b.minX + b.maxX) / 2, y: b.minY }).x} y1={T.toPx({ x: 0, y: b.minY }).y} x2={T.toPx({ x: (b.minX + b.maxX) / 2, y: b.maxY }).x} y2={T.toPx({ x: 0, y: b.maxY }).y} stroke={WALL_SOFT} strokeWidth={1} strokeDasharray="2 4" />
        ) : null}

        {/* Vertex handles (room editing) */}
        {edit === 'room'
          ? v.map((p, i) => {
              const q = T.toPx(p);
              const on = selected === `v${i}`;
              return (
                <G key={i}>
                  <Circle cx={q.x} cy={q.y} r={on ? 7 : 5.5} fill={on ? AMBER : '#1a1b20'} stroke={AMBER} strokeWidth={1.4} />
                </G>
              );
            })
          : null}

        {/* Speakers */}
        {lay.speakers.map((sp) =>
          sp.role === 'SUB' ? (
            <SubTop key={sp.role} sp={sp} T={T} fs={fs} selected={selected === sp.role} />
          ) : (
            <SpeakerTop key={sp.role} sp={sp} T={T} fs={fs} selected={selected === sp.role} label={labelMode(sp)} />
          ),
        )}

        {/* The listener */}
        <ListenerTop p={lisPx} size={Math.max(MIN_GLYPH, 0.22 * T.k)} selected={selected === 'listener'} />

        {/* Trace pulse */}
        {trace && layers.reflections ? <TracePulse r={analysis.reflections[trace.index]} progress={trace.progress} T={T} lay={lay} /> : null}

        {/* Dimensions */}
        {layers.dims !== false ? <DimensionLabels b={b} T={T} units={units} fs={fs} rectangular={analysis.rectangular} /> : null}

        {/* Mode caption — two lines on a narrow glass so nothing is cropped */}
        {heat && gw < 300 ? (
          <G>
            <SvgText x={6} y={gh - fs - 8} fill={colors.textSub} fontSize={fs} fontFamily={fonts.oswaldSemiBold}>
              {`MODE (${heat.mode.nx},${heat.mode.ny},${heat.mode.nz}) ${heat.mode.f.toFixed(1)} Hz · ${heat.mode.kind.toUpperCase()}`}
            </SvgText>
            <SvgText x={6} y={gh - 6} fill={colors.textSub} fontSize={fs} fontFamily={fonts.oswaldSemiBold}>
              PRESSURE AT EAR HEIGHT · SHAPE, NOT EXCITATION
            </SvgText>
          </G>
        ) : heat ? (
          <SvgText x={6} y={gh - 6} fill={colors.textSub} fontSize={fs} fontFamily={fonts.oswaldSemiBold}>
            {`MODE (${heat.mode.nx},${heat.mode.ny},${heat.mode.nz}) ${heat.mode.f.toFixed(1)} Hz · ${heat.mode.kind.toUpperCase()} · PRESSURE AT EAR HEIGHT · SHAPE, NOT EXCITATION`}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

/** The modal pressure field's cells. Memoised: during a speaker or listener
 *  drag the cells and the held transform are the same objects, so React
 *  skips the whole layer instead of re-diffing every rectangle each frame. */
const HeatLayer = memo(function HeatLayer({ heat, T }: { heat: { cell: number; cells: { x: number; y: number; c: string }[] }; T: PlanTransform }) {
  return (
    <G>
      {heat.cells.map((c, i) => {
        const q = T.toPx({ x: c.x - heat.cell / 2, y: c.y - heat.cell / 2 });
        return <Rect key={i} x={q.x} y={q.y} width={heat.cell * T.k + 0.3} height={heat.cell * T.k + 0.3} fill={c.c} opacity={0.55} />;
      })}
    </G>
  );
});

/* ───────────────────────────────── helpers ──────────────────────────────── */

function polyCentroid(v: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of v) {
    x += p.x;
    y += p.y;
  }
  return { x: x / Math.max(1, v.length), y: y / Math.max(1, v.length) };
}

/** Inward unit normal of edge i (toward the centroid). */
export function inwardNormal(v: Pt[], i: number, centroid: Pt): Pt {
  const a = v[i];
  const b = v[(i + 1) % v.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if (nx * (centroid.x - mid.x) + ny * (centroid.y - mid.y) < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
}

/** The outline path in glass units; a curved wall is drawn as a quadratic
 *  bulge outward (the model treats it as its chord — disclosed). */
function roomOutlinePath(v: Pt[], curved: number | undefined, T: PlanTransform): string {
  if (v.length === 0) return '';
  const c = polyCentroid(v);
  let d = '';
  for (let i = 0; i < v.length; i++) {
    const a = T.toPx(v[i]);
    const next = v[(i + 1) % v.length];
    const bq = T.toPx(next);
    if (i === 0) d += `M${a.x.toFixed(2)},${a.y.toFixed(2)} `;
    if (curved === i) {
      const n = inwardNormal(v, i, c);
      const len = Math.hypot(next.x - v[i].x, next.y - v[i].y);
      const bulge = Math.min(1.2, len * 0.22);
      const mid = { x: (v[i].x + next.x) / 2 - n.x * bulge * 2, y: (v[i].y + next.y) / 2 - n.y * bulge * 2 };
      const m = T.toPx(mid);
      d += `Q${m.x.toFixed(2)},${m.y.toFixed(2)} ${bq.x.toFixed(2)},${bq.y.toFixed(2)} `;
    } else {
      d += `L${bq.x.toFixed(2)},${bq.y.toFixed(2)} `;
    }
  }
  return d + 'Z';
}

/** The plan position of a treatment item (wall items from their edge). */
export function treatmentCentre(t: Treatment, room: RoomDesign['room']): Pt | null {
  const v = room.vertices;
  if (t.kind === 'absorber' || t.kind === 'diffuser') {
    if (t.wall == null || t.pos == null) return null;
    return edgePoint(v, t.wall, t.pos);
  }
  if (t.kind === 'basstrap') {
    if (t.wall == null) return null;
    return v[t.wall % v.length];
  }
  if (t.x == null || t.y == null) return null;
  return { x: t.x, y: t.y };
}

/* ───────────────────────────────── glyphs ───────────────────────────────── */

function SpeakerTop({ sp, T, fs, selected, label = 'above' }: { sp: Speaker; T: PlanTransform; fs: number; selected: boolean; label?: 'inside' | 'above' | 'none' }) {
  const q = T.toPx(sp);
  // A nearfield monitor is ~20 cm wide and ~25 cm deep; never under MIN_GLYPH.
  const wdt = Math.max(MIN_GLYPH, 0.2 * T.k);
  const dep = wdt * 1.25;
  const toe = sp.toeDeg;
  const rot = sp.role === 'L' ? -toe : sp.role === 'R' ? toe : sp.role === 'LS' ? 180 + toe : sp.role === 'RS' ? 180 - toe : 0;
  const bw = wdt / 2;
  const fw = wdt * 0.58;
  return (
    <G transform={`translate(${q.x},${q.y}) rotate(${rot})`}>
      {selected ? <Circle cx={0} cy={0} r={Math.max(bw, 11) + 6} fill="none" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      {/* Cabinet seen from above: the baffle (wide, toward +y) and the rear */}
      <Polygon points={`${-bw},${-dep * 0.55} ${bw},${-dep * 0.55} ${fw},${dep * 0.45} ${-fw},${dep * 0.45}`} fill={SPK_LO} stroke={selected ? AMBER : SPK_HI} strokeWidth={1.2} strokeLinejoin="round" />
      {/* The woofer and tweeter, seen edge-on as the baffle line */}
      <Line x1={-fw * 0.8} y1={dep * 0.45} x2={fw * 0.8} y2={dep * 0.45} stroke="#0e0f12" strokeWidth={2.2} />
      <Circle cx={0} cy={dep * 0.3} r={Math.max(2, wdt * 0.16)} fill="#101116" stroke={SPK_HI} strokeWidth={0.8} />
      {/* The coverage hint: a pale wedge out of the baffle */}
      <Path d={`M0,${dep * 0.45} L${-wdt * 0.9},${dep * 0.45 + wdt * 1.1} A${wdt * 1.45},${wdt * 1.45} 0 0 0 ${wdt * 0.9},${dep * 0.45 + wdt * 1.1} Z`} fill="rgba(127,212,255,0.06)" stroke="rgba(127,212,255,0.25)" strokeWidth={0.8} />
      {label === 'above' ? (
        <SvgText x={0} y={-dep * 0.55 - 4} fill={selected ? AMBER : colors.textSecondary} fontSize={fs + 1} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" transform={`rotate(${-rot})`}>
          {sp.role}
        </SvgText>
      ) : label === 'inside' ? (
        <SvgText x={0} y={-dep * 0.1} fill={selected ? AMBER : '#c9ccd4'} fontSize={Math.max(9, Math.min(fs + 1, wdt * 0.5))} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" transform={`rotate(${-rot})`}>
          {sp.role}
        </SvgText>
      ) : null}
    </G>
  );
}

function SubTop({ sp, T, fs, selected }: { sp: Speaker; T: PlanTransform; fs: number; selected: boolean }) {
  const q = T.toPx(sp);
  const sz = Math.max(MIN_GLYPH + 3, 0.4 * T.k);
  return (
    <G transform={`translate(${q.x},${q.y})`}>
      {[1.5, 2.1].map((m) => (
        <Circle key={m} cx={0} cy={0} r={(sz / 2) * m} fill="none" stroke={CYAN} strokeWidth={0.8} opacity={0.18} />
      ))}
      {selected ? <Circle cx={0} cy={0} r={sz / 2 + 6} fill="none" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      <Rect x={-sz / 2} y={-sz / 2} width={sz} height={sz} rx={2} fill={SPK_LO} stroke={selected ? AMBER : SPK_HI} strokeWidth={1.2} />
      <Circle cx={-sz * 0.22} cy={sz * 0.38} r={sz * 0.09} fill="#0e0f12" />
      <Circle cx={sz * 0.22} cy={sz * 0.38} r={sz * 0.09} fill="#0e0f12" />
      <Circle cx={0} cy={-sz * 0.05} r={sz * 0.26} fill="#101116" stroke={SPK_HI} strokeWidth={0.8} />
      <SvgText x={0} y={-sz / 2 - 4} fill={selected ? AMBER : colors.textSecondary} fontSize={fs + 1} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
        SUB
      </SvgText>
    </G>
  );
}

/** The listener from above — head-icon spec: a light uniform stroke, no
 *  fill but the readability plate. Nose toward the speakers (−y). */
function ListenerTop({ p, size, selected }: { p: Pt; size: number; selected: boolean }) {
  const r = size / 2;
  return (
    <G transform={`translate(${p.x},${p.y})`}>
      {selected ? <Circle cx={0} cy={0} r={r + 8} fill="none" stroke={GREEN} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      {/* shoulders */}
      <Path d={`M${-r * 1.7},${r * 1.1} Q${-r * 1.6},${r * 0.1} ${-r * 0.7},${r * 0.35} M${r * 1.7},${r * 1.1} Q${r * 1.6},${r * 0.1} ${r * 0.7},${r * 0.35}`} fill="none" stroke={HEAD_LINE} strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
      {/* head */}
      <Circle cx={0} cy={0} r={r} fill={HEAD_PLATE} stroke={HEAD_LINE} strokeWidth={1.4} />
      {/* ears */}
      <Path d={`M${-r},${-r * 0.2} q${-r * 0.35},${r * 0.2} 0,${r * 0.5} M${r},${-r * 0.2} q${r * 0.35},${r * 0.2} 0,${r * 0.5}`} fill="none" stroke={HEAD_LINE} strokeWidth={1.3} strokeLinecap="round" />
      {/* nose: the way they face */}
      <Path d={`M${-r * 0.18},${-r} l${r * 0.18},${-r * 0.3} l${r * 0.18},${r * 0.3}`} fill="none" stroke={HEAD_LINE} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={0} cy={0} r={r} fill="none" stroke={GREEN} strokeWidth={1.2} opacity={0.35} />
    </G>
  );
}

function OpeningGlyph({ o, v, T, centroid, fs, flash }: { o: RoomDesign['room']['openings'][number]; v: Pt[]; T: PlanTransform; centroid: Pt; fs: number; flash?: boolean }) {
  const a = v[o.wall % v.length];
  const bq = v[(o.wall + 1) % v.length];
  const len = Math.hypot(bq.x - a.x, bq.y - a.y) || 1;
  const ux = (bq.x - a.x) / len;
  const uy = (bq.y - a.y) / len;
  const n = inwardNormal(v, o.wall % v.length, centroid);
  const c = edgePoint(v, o.wall % v.length, o.pos);
  const half = o.width / 2;
  const p1 = T.toPx({ x: c.x - ux * half, y: c.y - uy * half });
  const p2 = T.toPx({ x: c.x + ux * half, y: c.y + uy * half });
  const cPx = T.toPx(c);
  // The wall number, just inside the wall at the opening's centre, so the
  // tray's "W2" and the plan agree (cognitive review 9).
  const tagPos = T.toPx({ x: c.x + n.x * 0.22, y: c.y + n.y * 0.22 });
  const tag = (
    <SvgText x={tagPos.x} y={tagPos.y + fs * 0.35} fill={flash ? AMBER : '#8d919c'} fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
      {`W${(o.wall % v.length) + 1}`}
    </SvgText>
  );
  const ring = flash ? <Circle cx={cPx.x} cy={cPx.y} r={Math.max(14, (o.width * T.k) / 2 + 6)} fill="none" stroke={AMBER} strokeWidth={2} /> : null;
  if (o.kind === 'window') {
    const off = { x: n.x * 0.06, y: n.y * 0.06 };
    const q1 = T.toPx({ x: c.x - ux * half + off.x, y: c.y - uy * half + off.y });
    const q2 = T.toPx({ x: c.x + ux * half + off.x, y: c.y + uy * half + off.y });
    return (
      <G>
        <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#9fd8ff" strokeWidth={3} opacity={0.85} />
        <Line x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y} stroke="#9fd8ff" strokeWidth={1} opacity={0.6} />
        {tag}
        {ring}
      </G>
    );
  }
  if (o.kind === 'opening') {
    return (
      <G>
        <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#0c0c0f" strokeWidth={4} />
        {tag}
        {ring}
      </G>
    );
  }
  // A door: the wall opens, the leaf stands into the room, the swing arcs.
  const leafEnd = T.toPx({ x: c.x - ux * half + n.x * o.width, y: c.y - uy * half + n.y * o.width });
  const rPx = o.width * T.k;
  return (
    <G>
      <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#0c0c0f" strokeWidth={4} />
      <Line x1={p1.x} y1={p1.y} x2={leafEnd.x} y2={leafEnd.y} stroke="#b08a56" strokeWidth={2.2} strokeLinecap="round" />
      <Path d={`M${leafEnd.x},${leafEnd.y} A${rPx},${rPx} 0 0 ${arcSweep(ux, uy, n)} ${p2.x},${p2.y}`} fill="none" stroke="#b08a56" strokeWidth={0.9} strokeDasharray="2 2" />
      {tag}
      {ring}
    </G>
  );
}

function arcSweep(ux: number, uy: number, n: Pt): 0 | 1 {
  // The cross product's sign decides which way the quarter-circle turns.
  return ux * n.y - uy * n.x > 0 ? 1 : 0;
}

function FeatureGlyph({ f, T, fs, selected, draggable }: { f: RoomDesign['room']['features'][number]; T: PlanTransform; fs: number; selected: boolean; draggable: boolean }) {
  const q = T.toPx({ x: f.x - f.w / 2, y: f.y - f.d / 2 });
  const W = f.w * T.k;
  const D = f.d * T.k;
  const stroke = selected ? AMBER : draggable ? '#6b6d76' : '#4a4c55';
  const label = f.kind.toUpperCase();
  // The desk is modelled (its top bounces); everything else is drawn dotted
  // — "not modelled" — so the picture matches the words (cognitive review 24).
  const modelled = f.kind === 'desk';
  return (
    <G>
      <Rect x={q.x} y={q.y} width={W} height={D} rx={f.kind === 'sofa' ? 4 : 2} fill="#1d1e24" stroke={stroke} strokeWidth={1.1} strokeDasharray={modelled ? undefined : '3 3'} />
      {f.kind === 'desk' ? (
        <G>
          {/* two displays on the desk */}
          <Rect x={q.x + W * 0.28} y={q.y + D * 0.12} width={W * 0.18} height={D * 0.14} fill="#2b2d35" stroke={stroke} strokeWidth={0.7} />
          <Rect x={q.x + W * 0.54} y={q.y + D * 0.12} width={W * 0.18} height={D * 0.14} fill="#2b2d35" stroke={stroke} strokeWidth={0.7} />
        </G>
      ) : f.kind === 'bookshelf' ? (
        [0.33, 0.66].map((t) => <Line key={t} x1={q.x + W * t} y1={q.y} x2={q.x + W * t} y2={q.y + D} stroke={stroke} strokeWidth={0.7} />)
      ) : f.kind === 'sofa' ? (
        <Line x1={q.x} y1={q.y + D * 0.3} x2={q.x + W} y2={q.y + D * 0.3} stroke={stroke} strokeWidth={0.8} />
      ) : (
        [0.25, 0.5, 0.75].map((t) => <Line key={t} x1={q.x} y1={q.y + D * t} x2={q.x + W} y2={q.y + D * t} stroke={stroke} strokeWidth={0.7} />)
      )}
      {W > 30 ? (
        <SvgText x={q.x + W / 2} y={q.y + D / 2 + fs * 0.35} fill="#7d8089" fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          {label}
        </SvgText>
      ) : null}
    </G>
  );
}

function RugGlyph({ t, T, selected }: { t: Treatment; T: PlanTransform; selected: boolean }) {
  if (t.x == null || t.y == null) return null;
  const q = T.toPx({ x: t.x - t.width / 2, y: t.y - t.height / 2 });
  const W = t.width * T.k;
  const H = t.height * T.k;
  const col = t.enabled ? TREAT : TREAT_OFF;
  const lines: ReactNode[] = [];
  for (let d = 6; d < W + H; d += 7) {
    const x1 = q.x + Math.min(d, W);
    const y1 = q.y + Math.max(0, d - W);
    const x2 = q.x + Math.max(0, d - H);
    const y2 = q.y + Math.min(d, H);
    lines.push(<Line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={0.6} opacity={0.5} />);
  }
  return (
    <G>
      <Rect x={q.x} y={q.y} width={W} height={H} rx={1.5} fill="rgba(201,162,74,0.08)" stroke={selected ? AMBER : col} strokeWidth={selected ? 1.6 : 1} />
      {lines}
    </G>
  );
}

function TreatmentGlyph({ t, T, room, centroid, fs, selected }: { t: Treatment; T: PlanTransform; room: RoomDesign['room']; centroid: Pt; fs: number; selected: boolean }) {
  const v = room.vertices;
  const col = t.enabled ? TREAT : TREAT_OFF;
  const stroke = selected ? AMBER : col;
  if (t.kind === 'absorber' || t.kind === 'diffuser') {
    if (t.wall == null || t.pos == null) return null;
    const c = edgePoint(v, t.wall, t.pos);
    const a = v[t.wall];
    const bq = v[(t.wall + 1) % v.length];
    const len = Math.hypot(bq.x - a.x, bq.y - a.y) || 1;
    const ux = (bq.x - a.x) / len;
    const uy = (bq.y - a.y) / len;
    const n = inwardNormal(v, t.wall, centroid);
    const half = t.width / 2;
    const th = Math.max(0.04, t.thickness);
    const p = [
      { x: c.x - ux * half, y: c.y - uy * half },
      { x: c.x + ux * half, y: c.y + uy * half },
      { x: c.x + ux * half + n.x * th, y: c.y + uy * half + n.y * th },
      { x: c.x - ux * half + n.x * th, y: c.y - uy * half + n.y * th },
    ].map((q) => T.toPx(q));
    const pts = p.map((q) => `${q.x},${q.y}`).join(' ');
    const teeth: ReactNode[] = [];
    if (t.kind === 'diffuser') {
      const nTeeth = Math.max(3, Math.round(t.width / 0.1));
      for (let i = 1; i < nTeeth; i++) {
        const f = -half + (t.width * i) / nTeeth;
        const depth = th * ((i * i) % 5) / 4;
        const q1 = T.toPx({ x: c.x + ux * f, y: c.y + uy * f });
        const q2 = T.toPx({ x: c.x + ux * f + n.x * depth, y: c.y + uy * f + n.y * depth });
        teeth.push(<Line key={i} x1={q1.x} y1={q1.y} x2={q2.x} y2={q2.y} stroke={stroke} strokeWidth={0.8} />);
      }
    }
    return (
      <G>
        <Polygon points={pts} fill={t.kind === 'absorber' ? 'rgba(201,162,74,0.35)' : 'rgba(201,162,74,0.12)'} stroke={stroke} strokeWidth={selected ? 1.6 : 1} strokeLinejoin="round" />
        {teeth}
        {!t.enabled ? <Line x1={p[0].x} y1={p[0].y} x2={p[2].x} y2={p[2].y} stroke="#6a6a72" strokeWidth={1} /> : null}
      </G>
    );
  }
  if (t.kind === 'basstrap') {
    if (t.wall == null) return null;
    const i = t.wall % v.length;
    const corner = v[i];
    const prev = v[(i - 1 + v.length) % v.length];
    const next = v[(i + 1) % v.length];
    const along = (from: Pt, to: Pt, d: number) => {
      const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      return { x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d };
    };
    const w = Math.max(0.3, t.thickness * 1.6);
    const p1 = T.toPx(along(corner, prev, w));
    const p2 = T.toPx(along(corner, next, w));
    const cq = T.toPx(corner);
    return (
      <G>
        <Polygon points={`${cq.x},${cq.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill="rgba(201,162,74,0.4)" stroke={stroke} strokeWidth={selected ? 1.6 : 1} strokeLinejoin="round" />
        {!t.enabled ? <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6a6a72" strokeWidth={1} /> : null}
      </G>
    );
  }
  if (t.x == null || t.y == null) return null;
  const q = T.toPx({ x: t.x - t.width / 2, y: t.y - t.height / 2 });
  const W = t.width * T.k;
  const H = t.height * T.k;
  if (t.kind === 'cloud') {
    return (
      <G>
        <Rect x={q.x} y={q.y} width={W} height={H} rx={2} fill="rgba(201,162,74,0.12)" stroke={stroke} strokeWidth={selected ? 1.6 : 1} strokeDasharray="5 3" />
        <SvgText x={q.x + W / 2} y={q.y + H / 2 + fs * 0.35} fill={col} fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          CLOUD
        </SvgText>
      </G>
    );
  }
  // gobo — a panel on a stand: the panel plus its feet
  return (
    <G>
      <Rect x={q.x} y={q.y + H * 0.35} width={W} height={Math.max(3, H * 0.3)} fill="rgba(201,162,74,0.35)" stroke={stroke} strokeWidth={selected ? 1.6 : 1} />
      <Line x1={q.x + W * 0.15} y1={q.y} x2={q.x + W * 0.15} y2={q.y + H} stroke={stroke} strokeWidth={1} />
      <Line x1={q.x + W * 0.85} y1={q.y} x2={q.x + W * 0.85} y2={q.y + H} stroke={stroke} strokeWidth={1} />
    </G>
  );
}

function ReflectionPath({ r, T, lay, fs }: { r: Reflection; T: PlanTransform; lay: RoomDesign['layouts'][number]; fs: number }) {
  const sp = lay.speakers.find((s) => s.role === r.speaker);
  if (!sp) return null;
  const a = T.toPx(sp);
  const p = T.toPx(r.point);
  const l = T.toPx(lay.listener);
  const col = levelColorForDb(r.levelDb, -24, 0);
  const treated = !!r.treatedBy;
  const vertical = r.surface.kind !== 'wall';
  return (
    <G opacity={treated ? 0.45 : 0.9}>
      <Polyline points={`${a.x},${a.y} ${p.x},${p.y} ${l.x},${l.y}`} fill="none" stroke={col} strokeWidth={vertical ? 1 : 1.4} strokeDasharray={vertical ? '2 3' : treated ? '1 2' : undefined} />
      {vertical ? (
        <SvgText x={p.x} y={p.y - 4} fill={col} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle">
          {r.surface.kind === 'ceiling' ? '▲' : r.surface.kind === 'desk' ? '◆' : '▼'}
        </SvgText>
      ) : (
        <Circle cx={p.x} cy={p.y} r={3.2} fill={treated ? '#2a2a30' : col} stroke={col} strokeWidth={1} />
      )}
      {treated ? (
        <SvgText x={p.x + 5} y={p.y + fs * 0.4} fill={GREEN} fontSize={fs} fontFamily={fonts.mono}>
          ✓
        </SvgText>
      ) : null}
    </G>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

function TracePulse({ r, progress, T, lay }: { r: Reflection | undefined; progress: SharedValue<number>; T: PlanTransform; lay: RoomDesign['layouts'][number] }) {
  if (!r) return null;
  const sp = lay.speakers.find((s) => s.role === r.speaker);
  if (!sp) return null;
  const a = T.toPx(sp);
  const p = T.toPx(r.point);
  const l = T.toPx(lay.listener);
  return <TracePulseDot ax={a.x} ay={a.y} px={p.x} py={p.y} lx={l.x} ly={l.y} col={levelColorForDb(r.levelDb, -24, 0)} progress={progress} />;
}

/** The pulse itself: speaker → reflection point → ears, the same path maths
 *  as before, evaluated per frame on the UI thread from `progress`. */
function TracePulseDot({ ax, ay, px, py, lx, ly, col, progress }: { ax: number; ay: number; px: number; py: number; lx: number; ly: number; col: string; progress: SharedValue<number> }) {
  const at = () => {
    'worklet';
    const d1 = Math.hypot(px - ax, py - ay);
    const d2 = Math.hypot(lx - px, ly - py);
    const total = d1 + d2 || 1;
    const t = Math.max(0, Math.min(1, progress.value)) * total;
    return t <= d1 ? { cx: ax + ((px - ax) * t) / (d1 || 1), cy: ay + ((py - ay) * t) / (d1 || 1) } : { cx: px + ((lx - px) * (t - d1)) / (d2 || 1), cy: py + ((ly - py) * (t - d1)) / (d2 || 1) };
  };
  const halo = useAnimatedProps(at);
  const dot = useAnimatedProps(at);
  return (
    <G>
      <ACircle animatedProps={halo} r={7} fill={col} opacity={0.25} />
      <ACircle animatedProps={dot} r={3.5} fill={col} />
    </G>
  );
}

function BoundaryLines({ design, analysis, T, fs }: { design: RoomDesign; analysis: Analysis; T: PlanTransform; fs: number }) {
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const v = room.vertices;
  const units = room.units;
  const lines: ReactNode[] = [];
  // The label sits at the WALL end of the leader, just outside the outline,
  // so it never lands on the speaker's letter or cabinet (cognitive review 10).
  const dim = (from: Pt, to: Pt, text: string, key: string, col = '#9aa0ad') => {
    const a = T.toPx(from);
    const bq = T.toPx(to);
    const dx = bq.x - a.x;
    const dy = bq.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Past the wall by ~1.2 line heights along the leader's direction.
    const tx = bq.x + ux * (fs * 1.2);
    const ty = bq.y + uy * (fs * 1.2) + fs * 0.35;
    const anchor = Math.abs(ux) > 0.5 ? (ux > 0 ? 'start' : 'end') : 'middle';
    lines.push(
      <G key={key}>
        <Line x1={a.x} y1={a.y} x2={bq.x} y2={bq.y} stroke={col} strokeWidth={0.9} strokeDasharray="3 2" />
        <SvgText x={tx} y={ty} fill={col} fontSize={fs} fontFamily={fonts.mono} textAnchor={anchor}>
          {text}
        </SvgText>
      </G>,
    );
  };
  for (const sp of lay.speakers) {
    if (sp.role === 'SUB') continue;
    // front wall (edge 0) and the nearest side wall
    const f = distToEdge(sp, v, 0);
    if (f.t >= 0 && f.t <= 1) dim(sp, f.foot, fmtLen(f.dist, units, { small: true }), `${sp.role}-front`);
    let best: { dist: number; foot: Pt } | null = null;
    for (let i = 1; i < v.length; i++) {
      const a = v[i];
      const q = v[(i + 1) % v.length];
      if (Math.abs(q.y - a.y) < Math.abs(q.x - a.x)) continue;
      const e = distToEdge(sp, v, i);
      if (e.t >= 0 && e.t <= 1 && (!best || e.dist < best.dist)) best = e;
    }
    if (best) dim(sp, best.foot, fmtLen(best.dist, units, { small: true }), `${sp.role}-side`);
  }
  // listener to the rear wall
  const s = analysis.stereo;
  if (s) {
    const rear = { x: lay.listener.x, y: lay.listener.y + s.listenerRear };
    dim(lay.listener, rear, fmtLen(s.listenerRear, units, { small: true }), 'lis-rear', GREEN);
  }
  return <G>{lines}</G>;
}

function DimensionLabels({ b, T, units, fs, rectangular }: { b: ReturnType<typeof bounds>; T: PlanTransform; units: RoomDesign['room']['units']; fs: number; rectangular: boolean }) {
  const tl = T.toPx({ x: b.minX, y: b.minY });
  const tr = T.toPx({ x: b.maxX, y: b.minY });
  const bl = T.toPx({ x: b.minX, y: b.maxY });
  const yTop = tl.y - 9;
  const xLeft = tl.x - 9;
  const tag = rectangular ? '' : ' (bounding box)';
  return (
    <G>
      <Line x1={tl.x} y1={yTop} x2={tr.x} y2={yTop} stroke={WALL_SOFT} strokeWidth={0.8} />
      <SvgText x={(tl.x + tr.x) / 2} y={yTop - 2} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle">
        {`${fmtLen(b.width, units)}${tag}`}
      </SvgText>
      <Line x1={xLeft} y1={tl.y} x2={xLeft} y2={bl.y} stroke={WALL_SOFT} strokeWidth={0.8} />
      <SvgText x={xLeft - 2} y={(tl.y + bl.y) / 2} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle" transform={`rotate(-90 ${xLeft - 2} ${(tl.y + bl.y) / 2})`}>
        {fmtLen(b.length, units)}
      </SvgText>
      <SvgText x={tl.x + 3} y={tl.y + fs + 2} fill="#6d6f78" fontSize={fs} fontFamily={fonts.oswaldSemiBold}>
        FRONT
      </SvgText>
    </G>
  );
}

/** Legend rows for the well — sampled from the same colour functions the
 *  plan paints with, so they can never drift. */
export const PLAN_LEGEND = [
  { c: fieldLevelColor(1), t: 'RED — modal pressure maximum (bass piles up here)' },
  { c: fieldLevelColor(0.5), t: 'YELLOW / GREEN — between peak and null' },
  { c: fieldLevelColor(0), t: 'BLUE — a null: that frequency nearly vanishes' },
  { c: levelColorForDb(-3, -24, 0), t: 'Reflection path, strong (close to the direct sound)' },
  { c: levelColorForDb(-18, -24, 0), t: 'Reflection path, weak (far, or absorbed)' },
  { c: TREAT, t: 'Treatment · ✓ = a modelled path meets it' },
  { c: '#9fd8ff', t: 'Window' },
] as const;
