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
 * above is its cabinet top, baffle forward, drivers as hidden lines; the listener is the line-art bald head
 * (head-icon spec) seen from above with its ears; doors swing, windows glaze,
 * panels have thickness. Level and pressure are coloured on the amplitude
 * standard (features/tools/levelColor.ts): quiet blue → loud red.
 */
import { memo, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { HeadIconSvg } from '../../../features/lab/headIconsSvg';
import { DeskTopItems, MonitorPlan, SubPlan } from './studioPlanArt';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../theme/tokens';
import { fieldLevelColor, levelColorForDb } from '../../../features/tools/levelColor';
import { StageAspectReport, useStageTextScale } from '../rack/stageAspect';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../modules/ape-gesture-exclusion';
import { fingerAt, fingerOffset, pickHandle, planTransform, touchToGlass, type Finger, type PlanTransform } from './planGeom';
import { boxAround, CAPS_W, MONO_W, pickSpot, textBox, type Anchor, type Box } from './planLabels';
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
const SPK_HI = '#5b5f6a';
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
  // Clear of the listener's selection ring (ListenerTop: r = icon/2 + 6) —
  // the angle's digits sat on the ring (clash sweep 2026-10-10).
  const lisRing = (Math.max(MIN_GLYPH, 0.22 * T.k) * 1.35) / 2 + 6;
  const lisOff = Math.max(24, lisRing + 3 + fs * 0.8);
  // Below the head unless (a) the glass ends first, (b) the rear-wall
  // distance label needs that room (it sits just inside the rear wall), or
  // (c) the speakers are BEHIND the seat — then "below" lands on the
  // cabinets (Android pass 2026-10-14: NEARFIELD hidden under the speakers).
  const rearPx = analysis.stereo ? T.toPx({ x: lay.listener.x, y: lay.listener.y + analysis.stereo.listenerRear }).y : gh;
  const roomBelow = Math.min(gh, layers.boundaries ? rearPx - fs - 4 : gh);
  const spkBehind = !!(Lsp && Rsp) && (T.toPx(Lsp).y + T.toPx(Rsp).y) / 2 > lisPx.y;
  const below = !spkBehind && lisPx.y + lisOff + fs + 3 + 4 <= roomBelow;
  // The angle line's baseline; the NEARFIELD line sits one line (fs + 3) under it.
  const angleY = below ? lisPx.y + lisOff : lisPx.y - Math.max(22, lisRing + 3) - (fs + 3);
  const labelMode = (sp: Speaker): 'inside' | 'above' | 'none' => (multi ? 'inside' : frontEdgeDist(sp) * T.k < 22 ? 'none' : 'above');

  // ── LABELS KEEP OUT OF EACH OTHER'S WAY (follow-up 2026-10-15, planLabels) ─
  // Fixed first: the dimension labels, every cabinet (and its letter) and the
  // head. Then, each taking the first spot clear of all of those and of the
  // labels placed before it: the desk's name, the angle / NEARFIELD pair,
  // the boundary distances. A label moves; its number is never dropped.
  const taken: Box[] = [];
  const dimG = layers.dims !== false ? dimensionGeom(b, T, units, fs, analysis.rectangular) : null;
  if (dimG) taken.push(...dimG.boxes);
  for (const sp of lay.speakers) {
    const q = T.toPx(sp);
    if (sp.role === 'SUB') {
      const sz = Math.max(MIN_GLYPH + 3, 0.38 * T.k);
      taken.push(boxAround(q.x, q.y, sz / 2 + 1), textBox(q.x, q.y - sz / 2 - 4, 'SUB', fs + 1, 'middle', CAPS_W));
      continue;
    }
    // The cabinet as SpeakerTop draws it: a square of its depth. (Its full
    // toed-in bounding box is larger only at the corners, where the cabinet
    // is not; using it pushed the front-wall "90 cm" labels back onto the
    // dimension row the 2026-10-14 pass took them off.)
    const wdt = Math.max(MIN_GLYPH, 0.21 * T.k);
    const dep = wdt * (280 / 210);
    taken.push(boxAround(q.x, q.y, dep / 2 + 1));
    if (labelMode(sp) === 'above') taken.push(textBox(q.x, q.y - dep * 0.55 - 4, sp.role, fs + 1, 'middle', CAPS_W));
  }
  const frontSpot = dimG ? pickSpot(dimG.frontSpots, taken, gw, gh) : null;
  if (frontSpot) taken.push(...frontSpot.boxes);
  taken.push(boxAround(lisPx.x, lisPx.y, lisRing - 4));
  // The wall numbers on doors and windows ("W2"), as OpeningGlyph places them.
  for (const o of room.openings) {
    const wi = o.wall % v.length;
    const n = inwardNormal(v, wi, centroid);
    const c = edgePoint(v, wi, o.pos);
    const tp = T.toPx({ x: c.x + n.x * 0.22, y: c.y + n.y * 0.22 });
    taken.push(textBox(tp.x, tp.y + fs * 0.35, `W${wi + 1}`, fs, 'middle', CAPS_W));
  }
  // Other furniture names are centred on their piece and stay put.
  for (const f of room.features) {
    const W = f.w * T.k;
    if (f.kind === 'desk' || W <= 30) continue;
    const c = T.toPx(f);
    taken.push(textBox(c.x, c.y + fs * 0.35, f.kind.toUpperCase(), fs, 'middle', CAPS_W));
  }
  const deskSpot: Record<string, LabelSpot> = {};
  for (const f of room.features) {
    if (f.kind !== 'desk' || f.w * T.k <= 30) continue;
    const sp = pickSpot(deskLabelSpots(f, T, fs), taken, gw, gh);
    deskSpot[f.id] = sp;
    taken.push(...sp.boxes);
  }
  // The angle (or NO TRIANGLE) and the NEARFIELD / MIDFIELD line: two lines,
  // the field line one line under the angle. Preferred where the rules above
  // put them (below the head, or above it), then the other side, then beside
  // the head, then a further line away.
  const st = analysis.stereo;
  const angleText = st ? (st.inFront ? `${st.angleDeg.toFixed(0)}°` : 'NO TRIANGLE') : '';
  const fieldInfo =
    st && design.monitoring.field !== 'other'
      ? (() => {
          const d = (st.distL + st.distR) / 2;
          const range = FIELD_RANGE_M[design.monitoring.field];
          const fits = !range || (d >= range[0] && d <= range[1]);
          return { fits, text: `${design.monitoring.field.toUpperCase()} · ${fmtLen(d, units)}${fits ? '' : ' ?'}` };
        })()
      : null;
  const pairAt = (x: number, y: number, anchor: Anchor): LabelSpot => ({
    tx: x,
    ty: y,
    anchor,
    boxes: [
      textBox(x, y, angleText, fs + 1, anchor, st?.inFront ? MONO_W : CAPS_W),
      ...(fieldInfo ? [textBox(x, y + fs + 3, fieldInfo.text, fs, anchor, CAPS_W)] : []),
    ],
  });
  const belowY = lisPx.y + lisOff;
  const aboveY = lisPx.y - Math.max(22, lisRing + 3) - (fs + 3);
  const line2 = 2 * (fs + 3);
  const pair =
    layers.triangle && Lsp && Rsp && st
      ? pickSpot(
          [
            pairAt(lisPx.x, angleY, 'middle'),
            pairAt(lisPx.x, below ? aboveY : belowY, 'middle'),
            pairAt(lisPx.x + lisRing + 4, lisPx.y - 1, 'start'),
            pairAt(lisPx.x - lisRing - 4, lisPx.y - 1, 'end'),
            pairAt(lisPx.x + lisRing + 4, lisPx.y - 1 - (fs + 3), 'start'),
            pairAt(lisPx.x - lisRing - 4, lisPx.y - 1 - (fs + 3), 'end'),
            pairAt(lisPx.x + lisRing + 4, lisPx.y - 1 + (fs + 3), 'start'),
            pairAt(lisPx.x - lisRing - 4, lisPx.y - 1 + (fs + 3), 'end'),
            pairAt(lisPx.x, belowY + line2, 'middle'),
            pairAt(lisPx.x, aboveY - line2, 'middle'),
          ],
          taken,
          gw,
          gh,
        )
      : null;
  if (pair) taken.push(...pair.boxes);
  const boundary =
    layers.boundaries && st
      ? boundaryItems(design, analysis, T, fs).map((item) => {
          const spot = pickSpot(item.cands, taken, gw, gh);
          taken.push(...spot.boxes);
          return { item, spot };
        })
      : [];

  return (
    <View style={{ width: w, height: h }} {...(edit === 'none' ? {} : pan.panHandlers)} accessible accessibilityLabel={`Room plan, ${fmtLen(b.width, units)} by ${fmtLen(b.length, units)}`}>
      {/* Android gesture nav: a handle dragged at the screen edge must not start
          the system back gesture (modules/ape-gesture-exclusion). The plan and
          the side view are never on screen together (the VIEW readout swaps one
          for the other; full screen is its own window), so each takes the whole
          stage band: lane 48 + 140 = 188 of the 200 dp per-edge cap. Mounted only
          while the view is editable (the read-only Review plan takes none).
          Renders nothing on iOS, web and builds without the module. */}
      {edit === 'none' ? null : <GestureExclusionZone maxHeightDp={STAGE_BAND_DP} />}
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${gw} ${gh}`}>
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
          <FeatureGlyph key={f.id} f={f} T={T} fs={fs} selected={selected === `f_${f.id}`} draggable={edit === 'room'} labelAt={deskSpot[f.id]} />
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
        {boundary.length ? <BoundaryLines items={boundary} fs={fs} /> : null}

        {/* Stereo triangle */}
        {layers.triangle && Lsp && Rsp ? (
          <G>
            <Polyline
              points={`${T.toPx(Lsp).x},${T.toPx(Lsp).y} ${lisPx.x},${lisPx.y} ${T.toPx(Rsp).x},${T.toPx(Rsp).y} ${T.toPx(Lsp).x},${T.toPx(Lsp).y}`}
              fill={analysis.stereo && !analysis.stereo.inFront ? 'none' : 'rgba(127,212,255,0.05)'}
              stroke={analysis.stereo && !analysis.stereo.inFront ? '#ff5a48' : CYAN}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.8}
            />
            {analysis.stereo && pair ? (
              // No angle when the seat is not in front of both speakers: two
              // speakers behind the head make no listening triangle. Drawn at
              // the spot the label placer picked (`pair`, above).
              <SvgText x={pair.tx} y={pair.ty} fill={analysis.stereo.inFront ? CYAN : '#ff5a48'} fontSize={fs + 1} fontFamily={analysis.stereo.inFront ? fonts.mono : fonts.oswaldSemiBold} textAnchor={pair.anchor}>
                {angleText}
              </SvgText>
            ) : null}
            {/* The listening-distance class under the angle: the SETUP tray's
                NEARFIELD / MIDFIELD pick is drawn, amber when the speakers sit
                outside the distance that class is heard from. */}
            {fieldInfo && pair ? (
              <SvgText x={pair.tx} y={pair.ty + fs + 3} fill={fieldInfo.fits ? CYAN : AMBER} fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor={pair.anchor}>
                {fieldInfo.text}
              </SvgText>
            ) : null}
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
        {layers.dims !== false ? <DimensionLabels b={b} T={T} units={units} fs={fs} rectangular={analysis.rectangular} frontAt={frontSpot ?? undefined} /> : null}

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
  // A nearfield 2-way is ≈ 210 mm wide × 280 mm deep (studioPlanArt); never
  // under MIN_GLYPH, so a big room still shows it.
  const wdt = Math.max(MIN_GLYPH, 0.21 * T.k);
  const dep = wdt * (280 / 210);
  const toe = sp.toeDeg;
  const rot = sp.role === 'L' ? -toe : sp.role === 'R' ? toe : sp.role === 'LS' ? 180 + toe : sp.role === 'RS' ? 180 - toe : 0;
  const bw = wdt / 2;
  const front = dep / 2;
  return (
    <G transform={`translate(${q.x},${q.y}) rotate(${rot})`}>
      {selected ? <Circle cx={0} cy={0} r={Math.max(bw, 11) + 6} fill="none" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      {/* The coverage hint: a pale wedge out of the baffle */}
      <Path d={`M0,${front} L${-wdt * 0.9},${front + wdt * 1.1} A${wdt * 1.45},${wdt * 1.45} 0 0 0 ${wdt * 0.9},${front + wdt * 1.1} Z`} fill="rgba(127,212,255,0.06)" stroke="rgba(127,212,255,0.25)" strokeWidth={0.8} />
      {/* The cabinet from above: lid, baffle toward the listener (+y), the
          woofer behind the baffle as dashed hidden lines (studioPlanArt). */}
      <MonitorPlan w={wdt} d={dep} stroke={selected ? AMBER : SPK_HI} />
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
  // A 10" studio sub is ≈ 380 mm square in plan (studioPlanArt).
  const sz = Math.max(MIN_GLYPH + 3, 0.38 * T.k);
  return (
    <G transform={`translate(${q.x},${q.y})`}>
      {[1.5, 2.1].map((m) => (
        <Circle key={m} cx={0} cy={0} r={(sz / 2) * m} fill="none" stroke={CYAN} strokeWidth={0.8} opacity={0.18} />
      ))}
      {selected ? <Circle cx={0} cy={0} r={sz / 2 + 6} fill="none" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      <SubPlan s={sz} stroke={selected ? AMBER : SPK_HI} />
      <SvgText x={0} y={-sz / 2 - 4} fill={selected ? AMBER : colors.textSecondary} fontSize={fs + 1} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
        SUB
      </SvgText>
    </G>
  );
}

/** The listener from above — the owner's ABOVE head icon (head fix
 *  2026-10-08: a lone head in a plan, rotated to the way the person faces):
 *  the nose toward the speakers (−y). A light uniform stroke over the
 *  readability plate, a green accent wash; `size` ≈ the head's width. */
function ListenerTop({ p, size, selected }: { p: Pt; size: number; selected: boolean }) {
  const icon = size * 1.35; // crown→chin, so the ear-to-ear width ≈ size
  return (
    <G>
      {selected ? <Circle cx={p.x} cy={p.y} r={icon / 2 + 6} fill="none" stroke={GREEN} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      <HeadIconSvg view="above" x={p.x} y={p.y} size={icon} rotation={Math.PI} color={HEAD_LINE} tint={GREEN} tintOpacity={0.3} plate minStroke={1.3} />
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

/**
 * The desk's name, spots best first. Clash sweep 2026-10-10: on a narrow desk
 * (or a small glass) the name ran onto the keyboard, so the front-left corner
 * is used only when it clears the keyboard's left end (DeskTopItems: 0.44 m
 * wide, centred 0.04 m left) — then the front-right corner the same way;
 * otherwise just outside the desk's left / right edge, on the floor, then
 * under or over it. Follow-up 2026-10-15: SPREAD stood the L cabinet on the
 * name, so the placer now skips any spot a cabinet or a label already holds.
 */
function deskLabelSpots(f: RoomDesign['room']['features'][number], T: PlanTransform, fs: number): LabelSpot[] {
  const q = T.toPx({ x: f.x - f.w / 2, y: f.y - f.d / 2 });
  const W = f.w * T.k;
  const D = f.d * T.k;
  const k = T.k;
  const label = f.kind.toUpperCase();
  const at = (tx: number, ty: number, anchor: Anchor): LabelSpot => ({ tx, ty, anchor, boxes: [textBox(tx, ty, label, fs, anchor, CAPS_W)] });
  const labelW = label.length * fs * CAPS_W;
  const kbLeft = q.x + W / 2 - 0.22 * k - 0.04 * k;
  const kbRight = q.x + W / 2 + 0.22 * k - 0.04 * k;
  const out: LabelSpot[] = [];
  if (q.x + 4 + labelW + 3 <= kbLeft) out.push(at(q.x + 4, q.y + D - 4, 'start'));
  if (q.x + W - 4 - labelW - 3 >= kbRight) out.push(at(q.x + W - 4, q.y + D - 4, 'end'));
  const midY = q.y + D / 2 + fs * 0.35;
  const left = at(q.x - 4, midY, 'end');
  const right = at(q.x + W + 4, midY, 'start');
  // Against a wall, the side that has room first (the 2026-10-10 rule).
  if (q.x - labelW - 6 > 2) out.push(left, right);
  else out.push(right, left);
  out.push(at(q.x + W / 2, q.y + D + fs + 2, 'middle'), at(q.x + W / 2, q.y - 4, 'middle'));
  return out;
}

function FeatureGlyph({ f, T, fs, selected, draggable, labelAt }: { f: RoomDesign['room']['features'][number]; T: PlanTransform; fs: number; selected: boolean; draggable: boolean; labelAt?: LabelSpot }) {
  const q = T.toPx({ x: f.x - f.w / 2, y: f.y - f.d / 2 });
  const W = f.w * T.k;
  const D = f.d * T.k;
  const stroke = selected ? AMBER : draggable ? '#6b6d76' : '#4a4c55';
  const label = f.kind.toUpperCase();
  // The desk is modelled (its top bounces); everything else is drawn dotted
  // — "not modelled" — so the picture matches the words (cognitive review 24).
  const modelled = f.kind === 'desk';
  // Drawn at their real plan sizes from T.k (px per metre): board 18 mm,
  // sofa arm 0.16 m / back 0.2 m, 19" rack rails 482.6 mm apart (EIA-310).
  const k = T.k;
  const board = Math.max(1, 0.018 * k);
  return (
    <G>
      <Rect x={q.x} y={q.y} width={W} height={D} rx={f.kind === 'sofa' ? Math.min(6, 0.06 * k) : 1.5} fill="#1d1e24" stroke={stroke} strokeWidth={1.1} strokeDasharray={modelled ? undefined : '3 3'} />
      {f.kind === 'desk' ? (
        // displays + stand feet toward the front wall, keyboard and mouse at the listener's edge
        <DeskTopItems x={q.x} y={q.y} w={W} d={D} k={k} stroke={stroke} />
      ) : f.kind === 'bookshelf' ? (
        // the carcass top: side panels and fixed uprights every ≈ 0.8 m
        <G>
          <Rect x={q.x + board} y={q.y + board} width={Math.max(0, W - 2 * board)} height={Math.max(0, D - 2 * board)} fill="#23242b" />
          {Array.from({ length: Math.max(0, Math.round(f.w / 0.8) - 1) }, (_, i) => {
            const x = q.x + (W * (i + 1)) / Math.round(f.w / 0.8);
            return <Rect key={i} x={x - board / 2} y={q.y} width={board} height={D} fill={stroke} opacity={0.7} />;
          })}
        </G>
      ) : f.kind === 'sofa' ? (
        // back rest along the rear (+y) edge, an arm at each end, seat cushions
        (() => {
          const arm = Math.min(W * 0.18, 0.16 * k);
          const back = Math.min(D * 0.3, 0.2 * k);
          const seatW = W - 2 * arm;
          const n = Math.max(1, Math.round(f.w / 0.7) - 0);
          return (
            <G>
              <Rect x={q.x} y={q.y + D - back} width={W} height={back} rx={Math.min(4, back * 0.4)} fill="#2a2b33" stroke={stroke} strokeWidth={0.7} />
              <Rect x={q.x} y={q.y} width={arm} height={D} rx={Math.min(4, arm * 0.4)} fill="#2a2b33" stroke={stroke} strokeWidth={0.7} />
              <Rect x={q.x + W - arm} y={q.y} width={arm} height={D} rx={Math.min(4, arm * 0.4)} fill="#2a2b33" stroke={stroke} strokeWidth={0.7} />
              {Array.from({ length: n }, (_, i) => (
                <Rect key={i} x={q.x + arm + (seatW * i) / n + 0.8} y={q.y + 1} width={seatW / n - 1.6} height={D - back - 1.6} rx={Math.min(3, 0.04 * k)} fill="none" stroke={stroke} strokeWidth={0.6} opacity={0.8} />
              ))}
            </G>
          );
        })()
      ) : (
        // a 19" rack from above: top panel, vent slots, the front rails
        (() => {
          const rail = (0.4826 * k) / 2;
          const cx = q.x + W / 2;
          return (
            <G>
              {[0.3, 0.42, 0.54, 0.66].map((t) => (
                <Line key={t} x1={q.x + W * 0.22} y1={q.y + D * t} x2={q.x + W * 0.78} y2={q.y + D * t} stroke={stroke} strokeWidth={Math.max(0.6, 0.01 * k)} strokeLinecap="round" />
              ))}
              <Rect x={cx - Math.min(rail, W / 2 - board)} y={q.y + D - board * 2.2} width={Math.min(rail * 2, W - 2 * board)} height={board * 1.4} fill="#3a3d45" />
            </G>
          );
        })()
      )}
      {W > 30 ? (
        // The desk's name: the spot planLabels picked (labelAt — clear of the
        // cabinets, the head and the dimension labels), else its first choice.
        f.kind === 'desk' ? (
          (() => {
            const sp = labelAt ?? deskLabelSpots(f, T, fs)[0];
            return (
              <SvgText x={sp.tx} y={sp.ty} fill="#7d8089" fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor={sp.anchor}>
                {label}
              </SvgText>
            );
          })()
        ) : (
          <SvgText x={q.x + W / 2} y={q.y + D / 2 + fs * 0.35} fill="#7d8089" fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
            {label}
          </SvgText>
        )
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

/** One boundary-distance leader and the spots its label may take, best first. */
type LabelSpot = { tx: number; ty: number; anchor: Anchor; boxes: Box[] };
type BoundaryItem = { key: string; a: Pt; bq: Pt; text: string; col: string; cands: LabelSpot[] };

function BoundaryLines({ items, fs }: { items: { item: BoundaryItem; spot: LabelSpot }[]; fs: number }) {
  return (
    <G>
      {items.map(({ item, spot }) => (
        <G key={item.key}>
          <Line x1={item.a.x} y1={item.a.y} x2={item.bq.x} y2={item.bq.y} stroke={item.col} strokeWidth={0.9} strokeDasharray="3 2" />
          <SvgText x={spot.tx} y={spot.ty} fill={item.col} fontSize={fs} fontFamily={fonts.mono} textAnchor={spot.anchor}>
            {item.text}
          </SvgText>
        </G>
      ))}
    </G>
  );
}

function boundaryItems(design: RoomDesign, analysis: Analysis, T: PlanTransform, fs: number): BoundaryItem[] {
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const v = room.vertices;
  const units = room.units;
  const lines: BoundaryItem[] = [];
  // The label sits at the WALL end of the leader, never on the speaker's
  // letter or cabinet (cognitive review 10). INSIDE the room beside the
  // leader whenever the leader has the room for it (Android pass 2026-10-14):
  // outside the outline every front-wall label shared one row with the room
  // WIDTH ("2.84 m 90 cm 4.00 m 90 cm 2.84 m") and a side label sat on the
  // rotated LENGTH ("49 cm" over "5.00 m"). Outside is the fallback for a
  // leader too short to hold its text. `clear` = the object's own half-size.
  const dim = (from: Pt, to: Pt, text: string, key: string, col = '#9aa0ad', clear = Math.max(MIN_GLYPH, 0.28 * T.k) / 2 + 4, atWall = false) => {
    const a = T.toPx(from);
    const bq = T.toPx(to);
    const dx = bq.x - a.x;
    const dy = bq.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const sideways = Math.abs(ux) > 0.5;
    const textW = text.length * fs * MONO_W;
    const free = len - clear;
    const at = (tx: number, ty: number, anchor: Anchor): LabelSpot => ({ tx, ty, anchor, boxes: [textBox(tx, ty, text, fs, anchor)] });
    // The spots, best first; planLabels takes the first one clear of the
    // labels and cabinets already placed (follow-up 2026-10-15: "62 cm" sat
    // on the rotated "5.00 m").
    const inside: LabelSpot[] = [];
    const outside: LabelSpot[] = [];
    if (sideways) {
      // Just inside the side wall, over (then under) the leader, running back
      // toward the object.
      const anchor: Anchor = ux > 0 ? 'end' : 'start';
      inside.push(at(bq.x - ux * 3, bq.y - 3, anchor), at(bq.x - ux * 3, bq.y + fs + 1, anchor));
      // Past the wall by ~1.2 line heights, then nudged up or down the wall.
      const ox = bq.x + ux * (fs * 1.2);
      const oy = bq.y + uy * (fs * 1.2) + fs * 0.35;
      const oa: Anchor = ux > 0 ? 'start' : 'end';
      for (const k of [0, -1.3, 1.3, -2.6, 2.6, -3.9, 3.9]) outside.push(at(ox, oy + k * fs, oa));
    } else {
      // Beside the leader, half way between the wall and the object — or,
      // `atWall`, just inside the wall (the listener's rear label: the angle
      // and NEARFIELD lines own the room under the head) — right, then left.
      // Then further along the same leader (toward the wall, toward the
      // object), so a label crowded at the midpoint (the head, the desk's
      // name, the angle pair) still finds room INSIDE before it is sent out
      // to the dimension row (follow-up 2026-10-15: "4.00 m 4.00 m 4.00 m").
      const mid = atWall ? len - 3 - fs * 0.35 : (len + clear) / 2;
      const nearWall = len - 3 - fs * 0.35;
      const nearObj = Math.min(nearWall, clear + fs + 2);
      for (const m of [mid, nearWall, nearObj, (mid + nearWall) / 2, (mid + nearObj) / 2]) {
        inside.push(at(a.x + ux * m + 5, a.y + uy * m + fs * 0.35, 'start'), at(a.x + ux * m - 5, a.y + uy * m + fs * 0.35, 'end'));
      }
      // Past the wall by ~1.2 line heights along the leader's direction,
      // centred, then to either side of the leader.
      const oy = bq.y + uy * (fs * 1.2) + fs * 0.35;
      const ox = bq.x + ux * (fs * 1.2);
      outside.push(at(ox, oy, 'middle'), at(bq.x + 4, oy, 'start'), at(bq.x - 4, oy, 'end'));
      // …further along the wall, then one line further out (the room's
      // WIDTH shares this row on the front wall).
      outside.push(at(bq.x + 4 + textW / 2, oy, 'start'), at(bq.x - 4 - textW / 2, oy, 'end'));
      const oy2 = oy + uy * (fs + 3);
      outside.push(at(ox, oy2, 'middle'), at(bq.x + 4, oy2, 'start'), at(bq.x - 4, oy2, 'end'));
    }
    const roomy = sideways ? free >= textW + 6 : free >= fs + 4;
    lines.push({ key, a, bq, text, col, cands: roomy ? [...inside, ...outside] : [...outside, ...inside] });
  };
  for (const sp of lay.speakers) {
    if (sp.role === 'SUB') continue;
    // Front wall (edge 0) for the front speakers; the nearest side wall for
    // L, R and the surrounds. The CENTRE has no side-wall label: its leader
    // ran to the same wall as R's and its "2.00 m" covered R's own distance
    // (Android pass 2026-10-14). The surrounds' front-wall leaders crossed
    // the whole room to a label on the top row; their placement is judged by
    // angle (the BS.775 line), not by the front wall.
    const surround = sp.role === 'LS' || sp.role === 'RS';
    const f = distToEdge(sp, v, 0);
    if (!surround && f.t >= 0 && f.t <= 1) dim(sp, f.foot, fmtLen(f.dist, units, { small: true }), `${sp.role}-front`);
    if (sp.role === 'C') continue;
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
    dim(lay.listener, rear, fmtLen(s.listenerRear, units, { small: true }), 'lis-rear', GREEN, (Math.max(MIN_GLYPH, 0.22 * T.k) * 1.35) / 2 + 4, true);
  }
  return lines;
}

/** Where the room's WIDTH / LENGTH / FRONT labels sit — one geometry for the
 *  drawing and for the label placer's obstacle list (planLabels). */
function dimensionGeom(b: ReturnType<typeof bounds>, T: PlanTransform, units: RoomDesign['room']['units'], fs: number, rectangular: boolean) {
  const tl = T.toPx({ x: b.minX, y: b.minY });
  const tr = T.toPx({ x: b.maxX, y: b.minY });
  const bl = T.toPx({ x: b.minX, y: b.maxY });
  const yTop = tl.y - 9;
  const xLeft = tl.x - 9;
  const widthText = `${fmtLen(b.width, units)}${rectangular ? '' : ' (bounding box)'}`;
  const lengthText = fmtLen(b.length, units);
  const midY = (tl.y + bl.y) / 2;
  const lenHalf = (lengthText.length * fs * MONO_W) / 2;
  const boxes: Box[] = [
    textBox((tl.x + tr.x) / 2, yTop - 2, widthText, fs, 'middle'),
    // The length runs up the left margin (rotated −90° about its anchor).
    { x0: xLeft - 2 - fs * 0.8, y0: midY - lenHalf, x1: xLeft - 2 + fs * 0.22, y1: midY + lenHalf },
  ];
  // FRONT names the front wall from just inside it: the left corner first,
  // then the right corner, then the middle — whichever no cabinet stands on.
  const fy = tl.y + fs + 2;
  const front = (x: number, anchor: Anchor): LabelSpot => ({ tx: x, ty: fy, anchor, boxes: [textBox(x, fy, 'FRONT', fs, anchor, CAPS_W)] });
  const frontSpots = [front(tl.x + 3, 'start'), front(tr.x - 3, 'end'), front((tl.x + tr.x) / 2, 'middle')];
  return { tl, tr, bl, yTop, xLeft, widthText, lengthText, midY, boxes, frontSpots };
}

function DimensionLabels({ b, T, units, fs, rectangular, frontAt }: { b: ReturnType<typeof bounds>; T: PlanTransform; units: RoomDesign['room']['units']; fs: number; rectangular: boolean; frontAt?: LabelSpot }) {
  const { tl, tr, bl, yTop, xLeft, widthText, lengthText, midY, frontSpots } = dimensionGeom(b, T, units, fs, rectangular);
  const fr = frontAt ?? frontSpots[0];
  return (
    <G>
      <Line x1={tl.x} y1={yTop} x2={tr.x} y2={yTop} stroke={WALL_SOFT} strokeWidth={0.8} />
      <SvgText x={(tl.x + tr.x) / 2} y={yTop - 2} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle">
        {widthText}
      </SvgText>
      <Line x1={xLeft} y1={tl.y} x2={xLeft} y2={bl.y} stroke={WALL_SOFT} strokeWidth={0.8} />
      <SvgText x={xLeft - 2} y={midY} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle" transform={`rotate(-90 ${xLeft - 2} ${midY})`}>
        {lengthText}
      </SvgText>
      <SvgText x={fr.tx} y={fr.ty} fill="#6d6f78" fontSize={fs} fontFamily={fonts.oswaldSemiBold} textAnchor={fr.anchor}>
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
