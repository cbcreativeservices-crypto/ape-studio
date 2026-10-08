/**
 * STAGE 1 close-ups — "Which installation would you approve?" (owner
 * 2026-09-26 art pass: the four thumbnails were flat coloured lines on a
 * 160-unit strip drawn at half the card's width).
 *
 * Four views of the same job, drawn at TRUE SCALE (D39): 320 units = 500 mm,
 * so a 6.5 mm mic line is 4.2 units, a 4.8 mm tie 3.1, a 19 mm hook-and-loop
 * wrap 12, an XLR barrel 12, the rack rails 15.9 mm with EIA square holes.
 *   A  THE SHOWPIECE — a dead-straight loom on the rear rails; the ties bite
 *      AFTER it lands, the bundle necks at every tie and the section inset
 *      shows the jackets crushed oval.
 *   B  THE PROFESSIONAL — rear of a 2U device: supports go in first (lacing
 *      bar), the run is retained with hook-and-loop, each line peels off the
 *      bottom of the bundle on a generous radius to its jack, labels land last.
 *      Mains arrives from the opposite side.
 *   C  THE PILE — lines dropped off the rack straight onto the floor.
 *   D  THE BLOCKADE — a neat loom tied across the vent field and the service
 *      panel; the vent behind it keeps flushing hot.
 * After the pick, each view names what it shows (green / red callouts, 10
 * units ≈ 10 pt on a 390 phone — the 9 pt floor holds at 375).
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  AG,
  CI_EASE,
  CI_MOTION,
  cancelAnimation,
  useAnimatedProps,
  useCiMotion,
  useDrawIn,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from '../motion';
import {
  Callout,
  CableTie,
  DeviceRear,
  FloorBand,
  HookLoopWrap,
  INK,
  JACKET,
  Leader,
  LacingBar,
  PanelJack,
  PanelSurface,
  PlugRearView,
  RackRail,
  Screw,
  SvgCable,
  VentField,
  WrapLabel,
  cableGeo,
  Connector,
  DropShadow,
  useUid,
  type Pt,
} from '../svgArt';

export type ExampleId = 'a' | 'b' | 'c' | 'd';

export const WHY_VB_W = 320;
export const WHY_VB_H = 150;
export const WHY_ASPECT = WHY_VB_W / WHY_VB_H;
/** drawing units per millimetre (320 u = 500 mm). */
const K = 0.64;
/** 6.5 mm mic/line cable. */
const OD = 6.5 * K;

/* ── motion helpers (primitive props only — motion.tsx rule) ─────────────── */

/** 0→1 progress after `delay`, over `dur`. */
function useProgress(run: boolean, delay: number, dur: number) {
  return useDrawIn(1, { run, delay, duration: dur }).progress;
}

function Fade({ run, delay = 0, dur = CI_MOTION.base, out = false, children }: { run: boolean; delay?: number; dur?: number; out?: boolean; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(m.reduce ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (!run) {
      t.value = 0;
      return;
    }
    if (m.reduce) {
      t.value = 1;
      return;
    }
    t.value = withDelay(delay, withTiming(1, { duration: dur, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, dur, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: out ? 1 - t.value : t.value }));
  const rest = m.reduce ? (out ? 0 : 1) : out ? 1 : 0;
  return (
    <AG opacity={rest} animatedProps={p}>
      {children}
    </AG>
  );
}

/** Breathes 0.35↔1 after `delay` (ambient loop; still under reduced motion). */
function Breathe({ run, delay = 0, period = 1600, children }: { run: boolean; delay?: number; period?: number; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(m.loops ? 0 : 1);
  useEffect(() => {
    cancelAnimation(t);
    if (!run) {
      t.value = 0;
      return;
    }
    if (!m.loops) {
      t.value = 1;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: period, easing: CI_EASE.inOut }), -1, true));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, delay, period, m.loops]);
  const p = useAnimatedProps(() => ({ opacity: 0.35 + 0.65 * t.value }));
  return (
    <AG opacity={m.loops ? 0 : 1} animatedProps={p}>
      {children}
    </AG>
  );
}

/* ── shared backdrop: the rear of a rack ─────────────────────────────────── */

function RackRearBackdrop() {
  const id = useUid();
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#15161a" />
          <Stop offset="1" stopColor="#0c0d10" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={WHY_VB_W} height={WHY_VB_H} rx={6} fill={`url(#${id}bg)`} />
      <RackRail x={4} y0={0} y1={WHY_VB_H} k={K} uTop={4} />
      <RackRail x={WHY_VB_W - 4 - 15.9 * K} y0={0} y1={WHY_VB_H} k={K} uTop={4} />
    </G>
  );
}

/* ══ A — THE SHOWPIECE ═════════════════════════════════════════════════════ */

const A_TIES = [74, 136, 198, 260];
const A_YC = 96;
const A_ROWS: { r: number; j: string }[] = [
  { r: -2, j: JACKET.line },
  { r: 2, j: JACKET.line },
  { r: -1, j: JACKET.mic },
  { r: 1, j: JACKET.mic },
  { r: 0, j: JACKET.black },
];
const A_PITCH = 3.3;

function loomRow(r: number, bite: number): Pt[] {
  const pts: Pt[] = [];
  for (let x = 14; x <= WHY_VB_W - 14; x += 3) {
    let pinch = 0;
    for (const tx of A_TIES) pinch += Math.exp(-(((x - tx) / 11) ** 2));
    pinch = Math.min(1, pinch);
    pts.push({ x, y: A_YC + r * A_PITCH * (1 - 0.5 * bite * pinch) });
  }
  return pts;
}

function Loom({ bite, progress }: { bite: number; progress?: ReturnType<typeof useProgress> }) {
  const geos = useMemo(() => A_ROWS.map((row) => cableGeo(loomRow(row.r, bite), OD, 14, false)), [bite]);
  return (
    <G>
      {A_ROWS.map((row, i) => (
        <SvgCable key={row.r} geo={geos[i]} d={OD} jacket={row.j} shadow={i < 2} progress={progress} />
      ))}
    </G>
  );
}

function CrushInset({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const id = useUid();
  const dd = 11.5;
  const ring = dd * 1.52;
  const cables = useMemo(() => {
    const out: { x: number; y: number; rot: number; j: string }[] = [{ x: 0, y: 0, rot: 0, j: JACKET.black }];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      out.push({ x: Math.cos(a) * dd * 0.9, y: Math.sin(a) * dd * 0.9, rot: (a * 180) / Math.PI + 90, j: i % 2 ? JACKET.mic : JACKET.line });
    }
    return out;
  }, []);
  return (
    <G>
      <Defs>
        <ClipPath id={`${id}c`}>
          <Circle cx={cx} cy={cy} r={r} />
        </ClipPath>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1d1f24" />
          <Stop offset="1" stopColor="#0d0e11" />
        </LinearGradient>
      </Defs>
      <Circle cx={cx + 1} cy={cy + 2} r={r + 1.5} fill="rgba(0,0,0,0.55)" />
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${id}g)`} />
      <G clipPath={`url(#${id}c)`}>
        {cables.map((c, i) => (
          <G key={i} transform={`translate(${cx + c.x} ${cy + c.y}) rotate(${c.rot})`}>
            {/* crushed: long axis along the strap, short axis into the bundle */}
            <Ellipse cx={0} cy={0} rx={(dd / 2) * (i ? 1.2 : 1.08)} ry={(dd / 2) * (i ? 0.74 : 0.9)} fill="#0a0a0c" />
            <Ellipse cx={0} cy={0} rx={(dd / 2) * (i ? 1.12 : 1.0)} ry={(dd / 2) * (i ? 0.66 : 0.82)} fill={c.j} />
            <Ellipse cx={-0.8} cy={-0.9} rx={(dd / 2) * 0.7} ry={(dd / 2) * 0.32} fill="rgba(255,255,255,0.14)" />
            {/* the pair inside, squeezed flat against each other */}
            <Ellipse cx={-1.7} cy={0} rx={1.5} ry={1.05} fill="#d8d8d8" stroke="#111" strokeWidth={0.3} />
            <Ellipse cx={1.7} cy={0} rx={1.5} ry={1.05} fill="#c83b32" stroke="#111" strokeWidth={0.3} />
          </G>
        ))}
        {/* the tie strap around the section, and its head */}
        <Circle cx={cx} cy={cy} r={ring} fill="none" stroke="#9d998b" strokeWidth={3.2} />
        <Circle cx={cx} cy={cy} r={ring} fill="none" stroke="#e9e5d8" strokeWidth={1.6} />
        <Rect x={cx - 4} y={cy - ring - 5.5} width={8} height={7} rx={1.2} fill="#d4d0c2" stroke="#5f5c52" strokeWidth={0.4} />
      </G>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#8a8d95" strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={r - 1.4} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </G>
  );
}

function ShowpieceArt({ run, revealed }: { run: boolean; revealed: boolean }) {
  const draw = useProgress(run, 0, 760);
  return (
    <>
      <RackRearBackdrop />
      {/* a 1U blank behind the loom so it reads against a surface */}
      <PanelSurface x={4 + 15.9 * K} y={A_YC - 14} w={WHY_VB_W - 8 - 31.8 * K} h={28.45} color="#2a2c31" />
      <Fade run={run} delay={1350} dur={420} out>
        <Loom bite={0} progress={draw} />
      </Fade>
      <Fade run={run} delay={1350} dur={420}>
        <Loom bite={1} />
      </Fade>
      {A_TIES.map((x, i) => (
        <Fade key={x} run={run} delay={900 + i * 110}>
          <G>
            <Fade run={run} delay={1350} dur={420} out>
              <CableTie x={x} y={A_YC} k={K} halfH={(2 * A_PITCH + OD / 2) / K} />
            </Fade>
            <Fade run={run} delay={1350} dur={420}>
              <CableTie x={x} y={A_YC} k={K} halfH={(2 * A_PITCH * 0.5 + OD / 2) / K} bite={1} />
            </Fade>
          </G>
        </Fade>
      ))}
      <Fade run={run} delay={1650}>
        <Line x1={198} y1={A_YC - 8} x2={246} y2={62} stroke="#8a8d95" strokeWidth={0.8} strokeDasharray="2 1.6" />
        <CrushInset cx={262} cy={40} r={30} />
        <Callout x={224} y={18} text="SECTION AT A TIE" size={9.5} anchor="end" color={INK.sub} />
      </Fade>
      {revealed ? (
        <G>
          {A_TIES.map((x) => (
            <Breathe key={x} run={run}>
              <Ellipse cx={x} cy={A_YC} rx={9} ry={14} fill="none" stroke={INK.bad} strokeWidth={1.2} />
            </Breathe>
          ))}
          <Callout x={160} y={136} text="TIES CUT IN — JACKETS CRUSHED OVAL" color={INK.bad} size={10} border={INK.bad} />
        </G>
      ) : null}
    </>
  );
}

/* ══ B — THE PROFESSIONAL ══════════════════════════════════════════════════ */

const B_BAR_Y = 39;
const B_ROW_Y = [44, 40, 36, 32]; // bottom row peels off first → no crossings
const B_JACK_X = [118, 146, 174, 202];
const B_JACK_Y = 116;
const B_DEV_Y = 88;

function proRun(i: number): Pt[] {
  const y = B_ROW_Y[i];
  const jx = B_JACK_X[i];
  // arrives down the left-hand manager, turns onto the bar on a wide radius,
  // then peels off DOWN to its jack on a radius well over 4× OD
  return [
    { x: 16 + i * 4.6, y: -6 },
    { x: 17 + i * 4.6, y: y - 22 },
    { x: 30 + i * 4.6, y: y - 1.5 },
    { x: 46, y },
    { x: jx - 34, y },
    { x: jx - 12, y: y + 5 },
    { x: jx - 1.5, y: y + 24 },
    { x: jx, y: B_JACK_Y - 16 },
    { x: jx, y: B_JACK_Y },
  ];
}

function ProfessionalArt({ run, revealed }: { run: boolean; revealed: boolean }) {
  const runs = useMemo(() => [0, 1, 2, 3].map((i) => cableGeo(proRun(i), OD, 12)), []);
  const mains = useMemo(
    () =>
      cableGeo(
        [
          { x: 296, y: -6 },
          { x: 295, y: 40 },
          { x: 294, y: 66 },
          { x: 288, y: 86 },
          { x: 286, y: B_JACK_Y - 6 },
        ],
        8 * K,
        12,
      ),
    [],
  );
  const p0 = useProgress(run, 320, 700);
  const p1 = useProgress(run, 410, 700);
  const p2 = useProgress(run, 500, 700);
  const p3 = useProgress(run, 590, 700);
  const pm = useProgress(run, 700, 600);
  const ps = [p0, p1, p2, p3];
  return (
    <>
      <RackRearBackdrop />
      {/* the device: 2U = 88.9 mm */}
      <DeviceRear x={4 + 15.9 * K} y={B_DEV_Y} w={WHY_VB_W - 8 - 31.8 * K} h={88.9 * K} k={K} />
      {B_JACK_X.map((x) => (
        <PanelJack key={x} x={x} y={B_JACK_Y} k={K} kind="xlrF" occupied />
      ))}
      <VentField x={222} y={B_DEV_Y + 9} w={42} h={40} k={K} />
      {/* IEC inlet */}
      <Rect x={276} y={B_JACK_Y - 13} width={20} height={17} rx={2} fill="#0b0b0d" stroke="#6e727a" strokeWidth={0.6} />
      {/* supports FIRST — the professional order */}
      <Fade run={run} delay={0}>
        <LacingBar x0={22} x1={WHY_VB_W - 22} y={B_BAR_Y} k={K} />
      </Fade>
      {ps.map((p, i) => (
        <SvgCable key={i} geo={runs[i]} d={OD} jacket={i % 2 ? JACKET.line : JACKET.mic} progress={p} shadow={i === 0} />
      ))}
      <SvgCable geo={mains} d={8 * K} jacket={JACKET.black} progress={pm} matte />
      <Fade run={run} delay={980}>
        {B_JACK_X.map((x) => (
          <PlugRearView key={x} x={x} y={B_JACK_Y} k={K} />
        ))}
        <PlugRearView x={286} y={B_JACK_Y - 5} k={K} dia={17} kind="iec" />
      </Fade>
      <Fade run={run} delay={1100}>
        <HookLoopWrap x={60} y={(B_ROW_Y[0] + B_ROW_Y[3]) / 2} k={K} halfH={(B_ROW_Y[0] - B_ROW_Y[3] + OD) / 2 / K + 1.5} />
        <HookLoopWrap x={104} y={(B_ROW_Y[1] + B_ROW_Y[3]) / 2} k={K} halfH={(B_ROW_Y[1] - B_ROW_Y[3] + OD) / 2 / K + 1.5} />
      </Fade>
      {/* labels land last, once the run is dressed */}
      {B_JACK_X.map((x, i) => (
        <Fade key={x} run={run} delay={1300 + i * 90}>
          <WrapLabel x={x} y={B_JACK_Y - 26} k={K} d={6.5} angle={90} text={`CH${i + 1}`} />
        </Fade>
      ))}
      {revealed ? (
        <G>
          <Callout x={112} y={14} text="SUPPORTED + RETAINED" color={INK.good} size={10} border={INK.good} />
          <Leader x1={206} y1={B_JACK_Y - 26} x2={240} y2={B_JACK_Y - 44} color={INK.good} />
          <Callout x={258} y={B_JACK_Y - 46} text="LABELED" color={INK.good} size={10} border={INK.good} />
          <Callout x={68} y={76} text="WIDE BENDS" color={INK.good} size={10} border={INK.good} />
          <Callout x={160} y={144} text="REACHABLE · STRAIN-FREE" color={INK.good} size={10} border={INK.good} />
        </G>
      ) : null}
    </>
  );
}

/* ══ C — THE PILE ══════════════════════════════════════════════════════════ */

const C_FLOOR = 96;

function PileArt({ run, revealed }: { run: boolean; revealed: boolean }) {
  const geos = useMemo(() => {
    const a: Pt[] = [
      { x: 70, y: -6 },
      { x: 72, y: 60 },
      { x: 76, y: 104 },
      { x: 112, y: 128 },
      { x: 160, y: 110 },
      { x: 120, y: 100 },
      { x: 92, y: 122 },
      { x: 150, y: 138 },
      { x: 214, y: 124 },
      { x: 188, y: 108 },
      { x: 164, y: 124 },
      { x: 232, y: 142 },
      { x: 300, y: 138 },
    ];
    const b: Pt[] = [
      { x: 118, y: -6 },
      { x: 121, y: 70 },
      { x: 128, y: 106 },
      { x: 176, y: 118 },
      { x: 230, y: 104 },
      { x: 250, y: 118 },
      { x: 206, y: 132 },
      { x: 140, y: 118 },
      { x: 104, y: 110 },
      { x: 84, y: 126 },
      { x: 62, y: 138 },
    ];
    const c: Pt[] = [
      { x: 162, y: -6 },
      { x: 166, y: 76 },
      { x: 184, y: 112 },
      { x: 150, y: 126 },
      { x: 126, y: 114 },
      { x: 170, y: 102 },
      { x: 222, y: 114 },
      { x: 258, y: 130 },
      { x: 244, y: 142 },
    ];
    return [cableGeo(a, OD, 10), cableGeo(b, OD, 10), cableGeo(c, 8 * K, 10)];
  }, []);
  const pa = useProgress(run, 40, 420);
  const pb = useProgress(run, 0, 380);
  const pc = useProgress(run, 110, 440);
  const id = useUid();
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#15161a" />
          <Stop offset="1" stopColor="#0f1013" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={WHY_VB_W} height={WHY_VB_H} rx={6} fill={`url(#${id}w)`} />
      {/* the bottom of the rack the lines fell from */}
      <RackRail x={40} y0={0} y1={C_FLOOR} k={K} uTop={4} />
      <RackRail x={200} y0={0} y1={C_FLOOR} k={K} uTop={4} />
      <DeviceRear x={40 + 15.9 * K} y={6} w={200 - 40 - 15.9 * K} h={44.45 * K} k={K} />
      <Rect x={36} y={C_FLOOR - 8} width={180} height={8} fill="#1d1f24" stroke="#0a0a0c" strokeWidth={0.6} />
      <FloorBand x={0} y={C_FLOOR} w={WHY_VB_W} h={WHY_VB_H - C_FLOOR} />
      <DropShadow cx={160} cy={126} rx={130} ry={18} opacity={0.45} />
      {/* dumped, not routed: out of order, fast */}
      <SvgCable geo={geos[1]} d={OD} jacket={JACKET.line} progress={pb} />
      <SvgCable geo={geos[0]} d={OD} jacket={JACKET.mic} progress={pa} />
      <SvgCable geo={geos[2]} d={8 * K} jacket={JACKET.black} progress={pc} matte />
      <Fade run={run} delay={520}>
        <Connector kind="xlrM" x={62} y={138} k={K} angle={152} />
        <Connector kind="iec" x={244} y={142} k={K} angle={-10} />
      </Fade>
      {revealed ? (
        <G>
          <Callout x={250} y={30} text="NOTHING SUPPORTED" color={INK.bad} size={10} border={INK.bad} />
          <Callout x={250} y={52} text="TRIP + CRUSH HAZARD" color={INK.bad} size={10} border={INK.bad} />
        </G>
      ) : null}
    </>
  );
}

/* ══ D — THE BLOCKADE ══════════════════════════════════════════════════════ */

const D_LOOM_Y = [58, 62, 66, 70];

function BlockadeArt({ run, revealed }: { run: boolean; revealed: boolean }) {
  const geos = useMemo(
    () =>
      D_LOOM_Y.map((y, i) =>
        cableGeo(
          [
            { x: 8, y },
            { x: 160, y: y + (i - 1.5) * 0.2 },
            { x: WHY_VB_W - 8, y },
          ],
          OD,
          16,
        ),
      ),
    [],
  );
  const p0 = useProgress(run, 120, 620);
  const p1 = useProgress(run, 180, 620);
  const p2 = useProgress(run, 240, 620);
  const p3 = useProgress(run, 300, 620);
  const ps = [p0, p1, p2, p3];
  const devX = 4 + 15.9 * K;
  const devW = WHY_VB_W - 8 - 31.8 * K;
  return (
    <>
      <RackRearBackdrop />
      {/* 3U device rear: service panel left, vent field right */}
      <DeviceRear x={devX} y={14} w={devW} h={133.35 * K} k={K} />
      {/* the service panel — a screwed cover plate */}
      <PanelSurface x={40} y={30} w={86} h={84} color="#34363d" rx={2} />
      <Screw x={46} y={36} r={1.8} />
      <Screw x={120} y={36} r={1.8} />
      <Screw x={46} y={108} r={1.8} />
      <Screw x={120} y={108} r={1.8} />
      <Callout x={83} y={48} text="SERVICE" size={9.5} color="#8f929a" bg={null} />
      {/* vent field + the heat it should be dumping */}
      <VentField x={146} y={26} w={150} h={96} k={K} />
      <Breathe run={run} delay={950}>
        <VentField x={146} y={26} w={150} h={96} k={K} hot={0.75} />
      </Breathe>
      {ps.map((p, i) => (
        <SvgCable key={i} geo={geos[i]} d={OD} jacket={i % 2 ? JACKET.line : JACKET.mic} progress={p} shadow={i === 0} />
      ))}
      {[66, 150, 236].map((x, i) => (
        <Fade key={x} run={run} delay={820 + i * 90}>
          <CableTie x={x} y={64} k={K} halfH={(12 + OD) / 2 / K} />
        </Fade>
      ))}
      {revealed ? (
        <G>
          {[176, 220, 264].map((x) => (
            <Breathe key={x} run={run} period={1100}>
              <Path d={`M${x} 56 C${x - 6} 44 ${x + 6} 36 ${x} 24`} stroke={INK.bad} strokeWidth={1.4} fill="none" strokeLinecap="round" />
              <Path d={`M${x - 3} 28 L${x} 23 L${x + 3.4} 28`} stroke={INK.bad} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Breathe>
          ))}
          <Callout x={221} y={104} text="VENT BLOCKED" color={INK.bad} size={10} border={INK.bad} />
          <Callout x={83} y={94} text="PANEL BLOCKED" color={INK.bad} size={10} border={INK.bad} />
        </G>
      ) : null}
    </>
  );
}

/* ══ the card art ══════════════════════════════════════════════════════════ */

export function ExampleArt({ id, w, h, run, revealed }: { id: ExampleId; w: number; h: number; run: boolean; revealed: boolean }) {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${WHY_VB_W} ${WHY_VB_H}`}>
      {id === 'a' ? <ShowpieceArt run={run} revealed={revealed} /> : null}
      {id === 'b' ? <ProfessionalArt run={run} revealed={revealed} /> : null}
      {id === 'c' ? <PileArt run={run} revealed={revealed} /> : null}
      {id === 'd' ? <BlockadeArt run={run} revealed={revealed} /> : null}
    </Svg>
  );
}
