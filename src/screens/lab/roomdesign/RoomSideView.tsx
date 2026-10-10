/**
 * RoomSideView — the SIDE elevation of the room (owner spec: "a side view for
 * ceiling height, slopes and speaker height"). The room's LENGTH runs left →
 * right (front wall at the left), height runs up. Same glass-unit rule and
 * touch mapping as the plan (planGeom.ts); SVG for every platform.
 *
 * Draggable: the speakers' height, the listener's ear height, and their
 * positions along the room (same handles as the plan, seen from the side).
 */
import { useContext, useEffect, useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { FigureSeatedSideSvg } from '../../../features/lab/figureBodySvg';
import { colors, fonts } from '../../../theme/tokens';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { StageAspectReport, useStageTextScale } from '../rack/stageAspect';
import { GestureExclusionZone, STAGE_BAND_DP } from '../../../../modules/ape-gesture-exclusion';
import { fingerAt, fingerOffset, pickHandle, sideLabelRows, sideTransform, touchToGlass, type Finger, type PlanTransform } from './planGeom';
import { bounds, ceilingHeightAt, cloudHangZ, fmtLen, type Analysis, type Pt, type RoomDesign } from './roomModel';
import { SURFACE_TINT, type PlanHandle } from './RoomPlanView';
import { MonitorSide, StandSide, SubSide } from './studioPlanArt';

const WALL = '#8d919c';
const SPK_HI = '#5b5f6a';
const TREAT = '#c9a24a';
const TREAT_OFF = '#4a4336';

export function RoomSideView({
  w,
  h,
  design,
  analysis,
  edit = false,
  selected,
  onSelect,
  onDrag,
  showReflections = true,
}: {
  w: number;
  h: number;
  design: RoomDesign;
  analysis: Analysis;
  edit?: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** A handle moved: `y` along the room and `z` height, metres. */
  onDrag?: (id: string, p: { y: number; z: number }) => void;
  showReflections?: boolean;
}) {
  const s = useStageTextScale();
  const gw = w / s;
  const gh = h / s;
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const b = useMemo(() => bounds(room), [room]);
  const T = useMemo(() => sideTransform(b.length, Math.max(room.height, room.heightLow), gw, gh), [b.length, room.height, room.heightLow, gw, gh]);
  const units = room.units;
  const fs = 9.5;
  // The section's own shape for FULL SCREEN (the StageFit rule); the room's
  // dimensions do not change in this view, so no drag can resize the box.
  const report = useContext(StageAspectReport);
  const aspect = Math.round(((b.length + 0.6) / (Math.max(room.height, room.heightLow) + 0.6)) * 100) / 100;
  useEffect(() => {
    report?.aspect(aspect, 0);
  }, [report, aspect]);
  // Side coordinates: x = distance along the room from the front wall, y = height.
  const toSide = (p: { y: number; z: number }) => T.toPx({ x: p.y - b.minY, y: p.z });

  const handles: PlanHandle[] = useMemo(() => {
    if (!edit) return [];
    const out: PlanHandle[] = [];
    for (const sp of lay.speakers) {
      const q = toSide(sp);
      out.push({ id: sp.role, px: q.x, py: q.y, r: 20 });
    }
    const q = toSide({ y: lay.listener.y, z: lay.listener.earZ });
    out.push({ id: 'listener', px: q.x, py: q.y, r: 22 });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, lay, T, b.minY]);

  const ref = useRef({ handles, T, s, gw, gh, b, onSelect, onDrag });
  ref.current = { handles, T, s, gw, gh, b, onSelect, onDrag };
  // Remembers the glass it began on — a rotation or re-fit mid-drag ends the
  // drag rather than mapping the old finger through the new box (toddler
  // pass 2026-10-01, the plan's rule).
  const drag = useRef<{ id: string; gx: number; gy: number; s: number; gw: number; gh: number; finger: Finger } | null>(null);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const st = ref.current;
        const g = touchToGlass(e.nativeEvent.locationX, e.nativeEvent.locationY, st.s);
        const hit = pickHandle(st.handles, g.x, g.y);
        if (!hit) return false;
        drag.current = { id: hit.id, gx: g.x, gy: g.y, s: st.s, gw: st.gw, gh: st.gh, finger: fingerAt(e.nativeEvent) };
        st.onSelect?.(hit.id);
        return true;
      },
      onPanResponderMove: (e, gs) => {
        const st = ref.current;
        const d = drag.current;
        if (!d) return;
        // Its own finger only (toddler pass 2 — the plan's rule).
        const off = fingerOffset(e.nativeEvent, d.finger, { dx: gs.dx, dy: gs.dy });
        if (d.s !== st.s || d.gw !== st.gw || d.gh !== st.gh || off === 'lifted') {
          drag.current = null;
          return;
        }
        const m = st.T.toM({ x: d.gx + off.dx / st.s, y: d.gy + off.dy / st.s });
        st.onDrag?.(d.id, { y: m.x + st.b.minY, z: m.y });
      },
      onPanResponderRelease: () => {
        drag.current = null;
      },
      onPanResponderTerminate: () => {
        drag.current = null;
      },
      onPanResponderReject: () => {
        drag.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  // Ceiling profile.
  const ceilingPts = useMemo(() => {
    const pts: string[] = [];
    const N = room.ceiling === 'flat' ? 1 : 24;
    for (let i = 0; i <= N; i++) {
      const y = b.minY + (b.length * i) / N;
      const q = toSide({ y, z: ceilingHeightAt(room, y) });
      pts.push(`${q.x.toFixed(2)},${q.y.toFixed(2)}`);
    }
    return pts.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, b, T]);

  const floorL = toSide({ y: b.minY, z: 0 });
  const floorR = toSide({ y: b.maxY, z: 0 });
  const frontTop = toSide({ y: b.minY, z: ceilingHeightAt(room, b.minY) });
  const rearTop = toSide({ y: b.maxY, z: ceilingHeightAt(room, b.maxY) });
  const spkSize = Math.max(14, 0.22 * T.k);
  const lis = lay.listener;
  const lisPx = toSide({ y: lis.y, z: lis.earZ });
  const Lsp = lay.speakers.find((x) => x.role === 'L');
  // The FINISH tray's materials change the section too: walls and ceiling
  // in their material's tint, the floor in the plan's floor tint.
  const wallTint = SURFACE_TINT[room.walls] ?? WALL;
  const ceilTint = SURFACE_TINT[room.ceilingMat] ?? WALL;
  const rows = sideLabelRows(floorL.y, gh, fs);
  const floorTint = room.floor === 'carpet' ? '#7a6a58' : room.floor === 'hardwood' ? '#a8835a' : room.floor === 'tile' ? '#8e9a9c' : WALL;

  return (
    <View style={{ width: w, height: h }} {...(edit ? pan.panHandlers : {})} accessible accessibilityLabel={`Side view, ceiling ${fmtLen(room.height, units)}`}>
      {/* Android gesture nav: a handle dragged at the screen edge must not start
          the system back gesture (modules/ape-gesture-exclusion). The plan and
          the plan view are never on screen together (the VIEW readout swaps one
          for the other; full screen is its own window), so each takes the whole
          stage band: lane 48 + 140 = 188 of the 200 dp per-edge cap. Mounted only
          while the view is editable (the read-only Review plan takes none).
          Renders nothing on iOS, web and builds without the module. */}
      {edit ? <GestureExclusionZone maxHeightDp={STAGE_BAND_DP} /> : null}
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${gw} ${gh}`}>
        {/* Room section */}
        <Path d={`M${floorL.x},${floorL.y} L${floorR.x},${floorR.y} L${rearTop.x},${rearTop.y} ${ceilingPts.split(' ').reverse().map((p) => `L${p}`).join(' ')} Z`} fill="#131417" stroke="none" />
        <Line x1={floorL.x} y1={floorL.y} x2={floorR.x} y2={floorR.y} stroke={floorTint} strokeWidth={3} />
        <Line x1={floorL.x} y1={floorL.y} x2={frontTop.x} y2={frontTop.y} stroke={wallTint} strokeWidth={3} />
        <Line x1={floorR.x} y1={floorR.y} x2={rearTop.x} y2={rearTop.y} stroke={wallTint} strokeWidth={3} />
        <Polyline points={ceilingPts} fill="none" stroke={ceilTint} strokeWidth={3} strokeLinejoin="round" />

        {/* Furniture: the desk (modelled) solid, the rest dotted */}
        {room.features.map((f) => {
          const q = toSide({ y: f.y - f.d / 2, z: f.h });
          if (f.kind === 'desk') {
            // In section a desk is its top (≈ 30 mm) on two end frames, not a
            // solid block — the bounce the model traces is off that top.
            const top = Math.max(2, 0.03 * T.k);
            const leg = Math.max(2, 0.05 * T.k);
            const legH = f.h * T.k - top;
            return (
              <G key={f.id}>
                <Rect x={q.x} y={q.y} width={f.d * T.k} height={top} fill="#2a2c33" stroke="#4a4c55" strokeWidth={1} />
                <Rect x={q.x + leg * 0.4} y={q.y + top} width={leg} height={legH} fill="#1d1e24" stroke="#4a4c55" strokeWidth={0.8} />
                <Rect x={q.x + f.d * T.k - leg * 1.4} y={q.y + top} width={leg} height={legH} fill="#1d1e24" stroke="#4a4c55" strokeWidth={0.8} />
                <Line x1={q.x + leg * 1.4} y1={q.y + top + legH * 0.82} x2={q.x + f.d * T.k - leg * 1.4} y2={q.y + top + legH * 0.82} stroke="#4a4c55" strokeWidth={1} />
              </G>
            );
          }
          return <Rect key={f.id} x={q.x} y={q.y} width={f.d * T.k} height={f.h * T.k} fill="#1d1e24" stroke="#4a4c55" strokeWidth={1} strokeDasharray="3 3" />;
        })}

        {/* Treatment seen from the side: cloud under the ceiling, rug on the floor, front-wall panels */}
        {design.treatment.map((t) => {
          const col = t.enabled ? TREAT : TREAT_OFF;
          if (t.kind === 'cloud' && t.y != null) {
            // Hung under the ceiling that is there (cloudHangZ).
            const q = toSide({ y: t.y - t.height / 2, z: cloudHangZ(room, t) + t.thickness / 2 });
            return (
              <G key={t.id}>
                <Rect x={q.x} y={q.y} width={t.height * T.k} height={Math.max(3, t.thickness * T.k)} fill="rgba(201,162,74,0.35)" stroke={col} strokeWidth={1} />
                <Line x1={q.x + 4} y1={q.y} x2={q.x + 4} y2={toSide({ y: 0, z: ceilingHeightAt(room, t.y) }).y} stroke={col} strokeWidth={0.8} />
                <Line x1={q.x + t.height * T.k - 4} y1={q.y} x2={q.x + t.height * T.k - 4} y2={toSide({ y: 0, z: ceilingHeightAt(room, t.y) }).y} stroke={col} strokeWidth={0.8} />
              </G>
            );
          }
          if (t.kind === 'rug' && t.y != null) {
            const q = toSide({ y: t.y - t.height / 2, z: 0.02 });
            return <Rect key={t.id} x={q.x} y={q.y} width={t.height * T.k} height={3} fill={col} opacity={0.8} />;
          }
          if ((t.kind === 'absorber' || t.kind === 'diffuser') && t.wall === 0) {
            const q = toSide({ y: b.minY, z: t.z + t.height / 2 });
            return <Rect key={t.id} x={q.x} y={q.y} width={Math.max(3, t.thickness * T.k)} height={t.height * T.k} fill="rgba(201,162,74,0.35)" stroke={col} strokeWidth={1} />;
          }
          if (t.kind === 'basstrap' && t.wall != null && (t.wall === 0 || t.wall === 1)) {
            const q = toSide({ y: b.minY, z: t.z + t.height / 2 });
            return <Path key={t.id} d={`M${q.x},${q.y} l${t.thickness * 1.6 * T.k},0 l${-t.thickness * 1.6 * T.k},${t.height * T.k * 0.08} Z M${q.x},${q.y} l0,${t.height * T.k} l${t.thickness * 1.6 * T.k},0 Z`} fill="rgba(201,162,74,0.4)" stroke={col} strokeWidth={1} />;
          }
          return null;
        })}

        {/* Floor and ceiling reflection paths of the L speaker */}
        {showReflections && Lsp
          ? analysis.reflections
              .filter((r) => r.speaker === 'L' && r.surface.kind !== 'wall')
              .map((r, i) => {
                const a = toSide(Lsp);
                const p = toSide({ y: r.point.y, z: r.point.z });
                const col = levelColorForDb(r.levelDb, -24, 0);
                return (
                  <G key={i} opacity={r.treatedBy ? 0.45 : 0.9}>
                    <Polyline points={`${a.x},${a.y} ${p.x},${p.y} ${lisPx.x},${lisPx.y}`} fill="none" stroke={col} strokeWidth={1.3} strokeDasharray={r.treatedBy ? '1 2' : undefined} />
                    <Circle cx={p.x} cy={p.y} r={3} fill={r.treatedBy ? '#2a2a30' : col} stroke={col} strokeWidth={1} />
                    <SvgText x={p.x + 5} y={p.y + (r.surface.kind === 'ceiling' ? fs + 2 : -4)} fill={col} fontSize={fs} fontFamily={fonts.mono}>
                      {`${r.surface.kind === 'desk' ? 'desk ' : ''}+${r.delayMs.toFixed(1)} ms`}
                    </SvgText>
                  </G>
                );
              })
          : null}
        {/* Direct path */}
        {Lsp ? <Line x1={toSide(Lsp).x} y1={toSide(Lsp).y} x2={lisPx.x} y2={lisPx.y} stroke={colors.cyanBright} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} /> : null}

        {/* Speakers (L and R overlap in this view; the sub sits on the floor) */}
        {lay.speakers.map((sp) => {
          const q = toSide(sp);
          const on = selected === sp.role;
          if (sp.role === 'SUB') {
            // Drawn with its driver at the driver height (toddler pass
            // 2026-10-01): pinned to the floor, HEIGHT → SUB and a drag
            // moved the number and nothing on the picture. Lifted off the
            // floor it stands on a riser.
            const sz = Math.max(16, 0.4 * T.k);
            const floorY = toSide({ y: sp.y, z: 0 }).y;
            const cy = Math.min(q.y, floorY - sz / 2); // never sunk into the floor
            const bottom = cy + sz / 2;
            return (
              <G key={sp.role}>
                {bottom < floorY - 1 ? <Rect x={q.x - sz * 0.3} y={bottom} width={sz * 0.6} height={floorY - bottom} fill="none" stroke={SPK_HI} strokeWidth={1} strokeDasharray="2 2" /> : null}
                {/* the sub's side panel, baffle toward the listener (+x), woofer hidden (studioPlanArt) */}
                <G transform={`translate(${q.x},${cy})`}>
                  <SubSide s={sz} stroke={on ? colors.amber : SPK_HI} />
                </G>
              </G>
            );
          }
          // Side panel of a 210 × 330 × 280 mm nearfield: depth across, height up.
          const ww = spkSize * 1.2;
          const hh = spkSize * 1.6;
          return (
            <G key={sp.role} transform={`translate(${q.x},${q.y})`}>
              {on ? <Circle cx={0} cy={hh * 0.23} r={hh / 2 + 6} fill="none" stroke={colors.amber} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
              {/* a real stand under the cabinet: top plate, column, base plate */}
              <G transform={`translate(0,${hh * 0.73})`}>
                <StandSide wpx={ww} floor={toSide({ y: sp.y, z: 0 }).y - q.y - hh * 0.73} />
              </G>
              {/* the cabinet's side: baffle toward the listener, drivers as
                  hidden lines, the tweeter axis (acoustic centre) at 0 */}
              <MonitorSide dpx={ww} hpx={hh} stroke={on ? colors.amber : SPK_HI} />
              <SvgText x={0} y={-hh * 0.27 - 4} fill={on ? colors.amber : colors.textSecondary} fontSize={fs + 1} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
                {sp.role === 'L' || sp.role === 'R' ? 'L/R' : sp.role}
              </SvgText>
            </G>
          );
        })}

        {/* The listener, in profile: bald head, ear at ear height, seated */}
        <ListenerSide p={lisPx} size={Math.max(16, 0.24 * T.k)} pxPerMm={T.k / 1000} selected={selected === 'listener'} floorY={toSide({ y: 0, z: 0 }).y} />

        {/* Heights — the ceiling label at the REAR corner (clear of "L/R" at
            the front), the two height labels on separate baselines (cognitive
            review 11) */}
        <SvgText x={rearTop.x - 4} y={Math.min(frontTop.y, rearTop.y) + fs + 2} fill={colors.textSub} fontSize={fs} fontFamily={fonts.mono} textAnchor="end">
          {`ceiling ${fmtLen(ceilingHeightAt(room, b.minY), units)}${room.ceiling !== 'flat' ? ` → ${fmtLen(ceilingHeightAt(room, b.maxY), units)}` : ''}`}
        </SvgText>
        <SvgText x={frontTop.x + 4} y={floorL.y - 4} fill="#6d6f78" fontSize={fs} fontFamily={fonts.oswaldSemiBold}>
          FRONT
        </SvgText>
        <SvgText x={lisPx.x} y={rows.ears} fill={colors.green} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle">
          {`ears ${fmtLen(lis.earZ, units)}`}
        </SvgText>
        {Lsp ? (
          <SvgText x={toSide(Lsp).x} y={rows.tweeter} fill={colors.amber} fontSize={fs} fontFamily={fonts.mono} textAnchor="middle">
            {`tweeter ${fmtLen(Lsp.z, units)}`}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

/** The seated listener in section (figure polish 2026-10-10 — it was a
 *  stick torso on a stick chair): the shared seated FIGURE at true size
 *  (figureBodySvg — shirt, trousers, shoes, a hand on the knee, a chair),
 *  facing the speakers (left), its EAR on the ear-height point; the chair's
 *  seat height follows from the ear height. The head is the figure's own
 *  skin silhouette (never the line-art icon, never a circle). `size` sizes
 *  the selection ring (≈ 0.24 m at the room's scale). */
function ListenerSide({ p, size, pxPerMm, selected, floorY }: { p: Pt; size: number; pxPerMm: number; selected: boolean; floorY: number }) {
  const r = size / 2;
  return (
    <G>
      {selected ? <Circle cx={p.x} cy={p.y} r={r + 8} fill="none" stroke={colors.green} strokeWidth={1.2} strokeDasharray="3 3" /> : null}
      {/* at the ROOM's scale (px per mm), so the seated height, the chair and the ear agree with the walls */}
      <FigureSeatedSideSvg earX={p.x} earY={p.y} floorY={floorY} px={pxPerMm} facing={-1} />
    </G>
  );
}
