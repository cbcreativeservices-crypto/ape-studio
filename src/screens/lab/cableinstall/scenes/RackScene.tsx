/**
 * STAGE 6 — Rack Cable Dressing (spec §14) — THE FLAGSHIP SCENE.
 *
 * The professional-audio heart of the lab: four phases on one rear-view rack
 * visualization (SVG only; honest illustration — cables terminate, and the
 * good dressing keeps natural bends and per-loom offsets, spec §52):
 *   A · INSPECT  — condemn the bad rack: the 14 CI_RACK_ISSUES drawn as
 *                  visibly-wrong details at their zone heights; ≥10 finds to
 *                  pass (never all 14 required). Tap regions on the rack or
 *                  use the SUSPECT LIST — no precision tapping ever required.
 *   B · DRESS    — CI_RACK_PLAN_NOTE first (the PLAN is the point), then
 *                  route the 6 CI_RACK_GROUPS via select-cable → select-zone
 *                  (no drag); looms draw live down the chosen manager to
 *                  plausible gear; per-group ✓/✕ vs the plan reveals once all
 *                  six are placed, reassignable until satisfied.
 *   C · SERVICE  — “DSP INPUT 7 has failed”: on the dressed rack the one
 *                  cable traces source→path→destination (everything else
 *                  dims), confirm REPLACE; a BEFORE strip contrasts the same
 *                  job on the Phase-A rack. Dressing IS the 30 seconds.
 *   D · MAINTAIN — replace the network switch without disconnecting
 *                  unrelated equipment: one of four approaches respects the
 *                  dressing (slack + managers), the rest destroy it.
 * Close: the rack-principles card with AuthorityBadges. Completion: all four
 * phases → onComplete({serviceability, signal, protection, workmanship})
 * scored honestly from finds, miss-taps, assignment attempts and service
 * picks. `completed` prop = everything unlocked for replay (fires once only).
 *
 * Accessibility: every SVG target has a labeled-button alternative; hit
 * overlays expand to ≥44dp; verdicts are glyph+words+color; phase
 * completions use announceComplete (success haptic + announcement).
 *
 * ── MOTION (owner 2026-08-24: this is the most-watched stage in the lab) ────
 * Each phase carries its own motion thesis, all through the lab MOTION KIT
 * (../motion) and all on PRIMITIVE SVG PROPS ONLY — cx/cy, r, rx/ry, width,
 * height, opacity, strokeWidth, strokeDashoffset, d. Group movement, where it
 * happens, rides a plain RN Animated.View. NEVER an animated <G transform>:
 * react-native-svg extracts transforms at JS render time and the node silently
 * stays put (the documented Harmonograph failure, motion.tsx).
 *   A · INSPECT  the rack ASSEMBLES top-to-bottom (skeleton → gear, ~460ms),
 *                then the mess DRAWS ITSELF IN, chaotic and out of order.
 *                Undocumented defects breathe (PulseRing, staggered phase so
 *                they never pulse in unison); documenting one stops its loop,
 *                springs the marker in and draws a ✓ tick.
 *   B · DRESS    SIGNATURE MOVE — an assigned loom INSTALLS ITSELF down the
 *                chosen manager (dash reveal, source→gear). Reassigning
 *                RETRACTS the old loom back out of the manager first, then
 *                installs the new one. On reveal, correct looms take a brief
 *                FLOW pulse (signal just came alive); wrong ones breathe a
 *                dashed-red flag.
 *   C · SERVICE  SIGNATURE MOVE — the TRACE SWEEP: the veil dims the rack,
 *                then a beam runs the length of the one cable, source →
 *                destination, and the A-007 tags land at both ends.
 *   D · MAINTAIN cards stagger; the approved approach settles on a spring.
 * Ambient loops exist ONLY for undocumented defects and live state, and stop
 * the moment they are resolved. Everything honors useCiMotion() — under
 * reduced motion durations collapse to 0, loops never start, and every end
 * state is identical, so nothing is ever hidden behind an animation.
 */
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { AuthorityBadge, CiSection, FindProgress, RuleFeedback, SpecCard, announceComplete, ruleFor } from '../bits';
import { CI_CLASS_KEY, CI_CLASS_TINTS } from '../data/cableTypes';
import { mistakeById } from '../data/mistakes';
import { CI_RACK_GROUPS, CI_RACK_ISSUES, CI_RACK_PLAN_NOTE, CI_RACK_ZONES } from '../data/scenarios';
import type { CiDimScores } from '../engine/score';
import {
  ACircle,
  AEllipse,
  AG,
  APath,
  ARect,
  Animated,
  Appear,
  CI_EASE,
  CI_MOTION,
  CI_SPRING_UI,
  PulseRing,
  Stagger,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useCiMotion,
  useCountUp,
  useDrawIn,
  useFlow,
  usePulse,
  useSharedValue,
  useTween,
  useVeil,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from '../motion';
import type { SharedValue } from 'react-native-reanimated';
import { CableTie, HookLoopWrap, JacketPath, LacingBar, PlugRearView, RackRail, shade, tint as lighten, useUid } from '../svgArt';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import {
  AMP,
  AudioInterface,
  Amplifier,
  BlankPanel,
  C13Plug,
  DSP,
  DspRear,
  Hank,
  HMGR2,
  HorizontalManager,
  IFACE,
  Kink,
  MGR_L,
  MGR_R,
  NetworkSwitch,
  Nl4PlugRear,
  OpenBay,
  PATCH,
  PATCH_XS,
  PDU,
  RAIL_FLANGE_MM,
  RAIL_L_X,
  SFP_CX,
  SW_CX,
  PatchPanelRear,
  Plait,
  PowerDistro,
  RACK_TEXT,
  RK,
  RackFrame,
  RackPaints,
  Rj45PlugRear,
  StrainFlag,
  SWITCH,
  TrsPlugRear,
  U_TOP,
} from './rackArt';
import type { CiModuleProps } from '../registry';

/* ═══════════════════════ geometry (viewBox 340×366) ═══════════════════════ */

const VB_W = 340;
/** 15U of rail on the U grid (rackArt.uY) + the top and bottom panels. */
const VB_H = 366;
const REQUIRED_FINDS = 10;

/** Phase-A tap regions (disjoint; the render layer expands every overlay to
 *  ≥44dp). `where` is the NEUTRAL location name used by overlays + the
 *  suspect list (no spoilers); (mx, my) is where the marker sits — ON the
 *  defect, never floating beside it. */
const HIT: Record<string, { x: number; y: number; w: number; h: number; mx: number; my: number; where: string }> = {
  'ri-9': { x: 118, y: -4, w: 112, h: 28, mx: 192, my: 13, where: 'Top cable entry' },
  'ri-4': { x: 40, y: 44, w: 190, h: 40, mx: 110, my: 57, where: 'Patch panel — designation strip' },
  'ri-13': { x: 230, y: 24, w: 70, h: 38, mx: 253, my: 44, where: 'Patch panel — port 22 and its cable' },
  'ri-1': { x: 56, y: 18, w: 134, h: 26, mx: 124, my: 29, where: 'Horizontal duct at the top' },
  'ri-8': { x: 0, y: 84, w: 58, h: 48, mx: 50, my: 100, where: 'Left rail at the switch' },
  'ri-2': { x: 180, y: 106, w: 120, h: 46, mx: 214, my: 133, where: 'DSP inputs 6–8' },
  'ri-12': { x: 0, y: 150, w: 100, h: 68, mx: 52, my: 188, where: 'Interface inputs → left manager' },
  'ri-3': { x: 104, y: 172, w: 100, h: 44, mx: 172, my: 194, where: 'Open bay' },
  'ri-7': { x: 200, y: 186, w: 100, h: 30, mx: 247, my: 200, where: 'Bundle right of the open bay' },
  'ri-11': { x: 0, y: 248, w: 58, h: 34, mx: 53, my: 263, where: 'Left rail beside the amp' },
  'ri-5': { x: 60, y: 268, w: 112, h: 30, mx: 112, my: 289, where: 'Amp — connector field' },
  'ri-6': { x: 176, y: 294, w: 124, h: 30, mx: 232, my: 306, where: 'Amp — rear fan exhaust' },
  'ri-10': { x: 60, y: 326, w: 112, h: 30, mx: 92, my: 342, where: 'PDU — outlets 1–3' },
  'ri-14': { x: 176, y: 346, w: 124, h: 20, mx: 238, my: 352.5, where: 'Below the PDU' },
};

const HMGR_XS = Array.from({ length: 14 }, (_, i) => 66 + i * 16);
const DSP_JACK_XS = [70, 94, 118, 142, 166, 190, 214, 238];
const IFACE_XS = [70, 92, 114, 136, 158, 180];
const DISTRO_XS = Array.from({ length: 8 }, (_, i) => 64 + i * 19);
/** Hook-and-loop wraps down the vertical managers, at even ~1.3U intervals. */
const TIE_YS = Array.from({ length: 10 }, (_, i) => 60 + i * 29);

/* ── motion timing for this scene (see the header note) ──────────────────── */
/** Stagger between rack bands as the chassis assembles, top-to-bottom. */
const ASSEMBLE_STEP = 26;
const ASSEMBLE_DUR = 200;
/** The mess arrives after the rack has finished building itself. */
const CHAOS_AT = 420;
/** Undocumented defects start breathing only once the mess has landed — the
 *  learner's first read of this rack is the rack, not the markers. */
const HOTSPOT_AT = 1500;
/** After this the intro has fully landed; later mounts render at rest. */
const INTRO_END = 2200;
/** A loom pulls back out of its manager before it re-installs elsewhere. */
const RETRACT_MS = 260;
/** The trace beam waits for the veil, then runs the cable end to end. */
const TRACE_DELAY = 260;
const TRACE_DUR = 780;
/** "Signal just came alive" — a few marching cycles, then rest. */
const FLOW_MS = 2600;

/* ── LINE-DIAGRAM LANES (owner 2026-10-10: "cables need to stay shown
   independently like in a line diagram drawing" + "we are teaching
   professional cabling"). A loom is never one fat stroke: every cable in it
   is its own lane, from the top entry, along the top duct, down its vertical
   manager and onto its own connector. Lanes sit ≈1.5× the stroke apart,
   keep their order the whole way, and every corner is CONCENTRIC (one centre
   per bend, the radius growing lane by lane), so no two lanes ever cross or
   lie on top of one another inside a loom. Each side's lanes are allocated
   by GROUP, never by assignment order, so reassigning one group never
   shuffles another group's route. ──────────────────────────────────────── */
type LaneCable = { gid: string; key: string; w: number };
/** Signal cables (analog, control, network, fiber) are drawn thin so a whole
 *  side fits the 1U top duct as separate lanes; power and speaker cable are
 *  heavier, as they are in the rack. */
const W_SIG = 1;
const W_BY_GROUP: Record<string, number> = { 'g-ac': 2, 'g-spk': 2.4 };
const laneW = (gid: string) => W_BY_GROUP[gid] ?? W_SIG;
/** Centre-to-centre spacing between two neighbouring lanes. */
const lanePitch = (a: number, b: number) => 0.75 * (a + b);
/** Every cable each group brings to its manager, in the order its lanes
 *  stack (INNER → OUTER, i.e. nearest the rail first). Inner lanes turn in
 *  highest, so the cable that leaves the loom first is always on its edge. */
function groupCables(gid: string, isL: boolean): string[] {
  if (gid === 'g-analog') {
    // the harness peels its bottom lane off first: on the left that is DSP
    // input 1 (nearest the rail), on the right DSP input 8
    const k = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `in${n}`);
    return isL ? k.reverse() : k;
  }
  if (gid === 'g-net') return ['h1', 'h2', 'h3', 'h4'];
  if (gid === 'g-spk') return isL ? ['o2', 'o1'] : ['o1', 'o2'];
  return ['c'];
}
/** Inner → outer group order per side. The plan's own groups sit inside, in
 *  the order they turn in (top to bottom); a group dressed to the wrong side
 *  rides outside them. */
const SIDE_ORDER = {
  L: ['g-net', 'g-fib', 'g-ctl', 'g-analog', 'g-spk', 'g-ac'],
  R: ['g-spk', 'g-ac', 'g-net', 'g-fib', 'g-ctl', 'g-analog'],
} as const;
/** The rail height where each group's INNER lane turns in. */
const TURN_Y: Record<string, number> = {
  'g-net': PATCH.y + 9.5, // behind the jacks-to-rear patch panel
  'g-fib': 84.8, // over the switch's top lip, to the SFP cage
  'g-ctl': 101.2, // the top lane of the DSP harness
  'g-analog': 102.7, // the DSP harness proper, under the switch ports
  'g-spk': AMP.y - 13, // straddling the rear lacing bar over the amp
  'g-ac': PDU.y + 19.5, // into the PDU's own inlet
};
type Lane = LaneCable & { off: number; off0: number };
function sideLanes(isL: boolean): Lane[] {
  const out: Lane[] = [];
  let d = 0;
  let prevW = 0;
  for (const gid of SIDE_ORDER[isL ? 'L' : 'R']) {
    const w = laneW(gid);
    let d0 = -1;
    for (const key of groupCables(gid, isL)) {
      if (out.length) d += lanePitch(prevW, w);
      if (d0 < 0) d0 = d;
      out.push({ gid, key, w, off: d, off0: d0 });
      prevW = w;
    }
  }
  return out;
}
const LANES = { L: sideLanes(true), R: sideLanes(false) } as const;
/** The bend geometry (see the header): entry drops, duct row, manager lane. */
const DUCT_IN_Y = 38.5; // the innermost lane's row in the top duct
const C1_Y = 7.5; // centre height of the entry bends
const C2_Y = DUCT_IN_Y + 3; // centre height of the duct → manager bends
const L_GEO = { ex: 179.5, lane: 44.5 } as const; // inner lane, left side
const R_GEO = { ex: 201, lane: 295.5 } as const; // inner lane, right side
const RAIL_XL = 58;
const RAIL_XR = 282;
/** One lane's run, entry → duct → manager → rail, ending at the rail. */
function laneRun(l: Lane, isL: boolean): { d: string; railY: number } {
  const yd = DUCT_IN_Y - l.off;
  const r1 = yd - C1_Y;
  const r2 = 3 + l.off;
  const r3 = 3 + (l.off - l.off0);
  const ty = TURN_Y[l.gid] + (l.off - l.off0);
  if (isL) {
    const ex = L_GEO.ex - l.off;
    const lane = L_GEO.lane - l.off;
    return {
      railY: ty,
      d:
        `M${ex} 4 V${C1_Y} A${r1} ${r1} 0 0 1 ${ex - r1} ${yd} ` +
        `H${lane + r2} A${r2} ${r2} 0 0 0 ${lane} ${yd + r2} ` +
        `V${ty - r3} A${r3} ${r3} 0 0 0 ${lane + r3} ${ty} H${RAIL_XL}`,
    };
  }
  const ex = R_GEO.ex + l.off;
  const lane = R_GEO.lane + l.off;
  return {
    railY: ty,
    d:
      `M${ex} 4 V${C1_Y} A${r1} ${r1} 0 0 0 ${ex + r1} ${yd} ` +
      `H${lane - r2} A${r2} ${r2} 0 0 1 ${lane} ${yd + r2} ` +
      `V${ty - r3} A${r3} ${r3} 0 0 1 ${lane - r3} ${ty} H${RAIL_XR}`,
  };
}
/** Over-estimated run length (the dash-reveal budget). */
const runLen = (ty: number) => Math.round((ty + 300) * 1.1);
/** A group's lanes on one side: key → its run and rail height. */
function groupRuns(gid: string, isL: boolean) {
  return LANES[isL ? 'L' : 'R']
    .filter((l) => l.gid === gid)
    .map((l) => ({ ...l, ...laneRun(l, isL) }));
}
const railYOf = (gid: string, isL: boolean, key: string) => groupRuns(gid, isL).find((r) => r.key === key)?.railY ?? TURN_Y[gid];
/** Wrong-zone placements (the entry coil, the horizontal-manager dangle) keep
 *  their cables as separate lanes too: a fixed row per group. */
const hmgrY = (gi: number) => 21 + gi * 3.2;
const entryCx = (gi: number) => 172 + gi * 7;
const groupSize = (gid: string) => groupCables(gid, true).length;

/* ── the dressed rack's TERMINATIONS (owner 2026-09-28: the dressed rack must
   read as a finished professional rack — every device cabled, not six looms
   that stop at the rail). Each group's loom lands at the rail at its own
   height; its tail fans out to every connector it serves, cables stacked as a
   flat harness that peels off one cable per connector, each seated in its
   plug. ───────────────────────────────────────────────────────────────── */
/** The rear lacing bar just above the amp (on the rear rails, over the
 *  blank): the speaker loom is retained on it and drops onto the NL4s. */
const LACE_Y = AMP.y - 10;
/** A second lacing bar higher in the bay carries the line-level runs, so
 *  they never share a support with the speaker loom. */
const SIG_LACE_Y = 184;

/** One harness cable: from the rail along its stacking height, peeling off
 *  with a gentle bend down (dir 1) or up (dir -1) into its connector. */
function harnessD(x0: number, yb: number, jx: number, jy: number): string {
  const s = jx > x0 ? 1 : -1;
  const turn = 5;
  const dir = jy > yb ? 1 : -1;
  return `M${x0} ${yb} H${jx - s * turn} Q${jx} ${yb} ${jx} ${yb + dir * turn} V${jy}`;
}

/** The analog harness: eight lines peel off to DSP inputs 1–8, the control
 *  line runs on to the DSP's NET port, and the interface outputs feed the
 *  amp inputs down across the lacing bar. */
function AnalogTail({ isL }: { isL: boolean }) {
  const A = CI_CLASS_TINTS.analog;
  const x0 = isL ? RAIL_XL : RAIL_XR;
  // each input's own lane, at the height its loom lane reached the rail —
  // the lowest lane is the one that peels off first (closest to the rail)
  return (
    <G>
      {DSP_JACK_XS.map((jx, i) => (
        <JacketPath key={jx} d={harnessD(x0, railYOf('g-analog', isL, `in${i + 1}`), jx, DSP.jackY)} color={A} width={W_SIG} shadow={false} />
      ))}
      {DSP_JACK_XS.map((jx) => (
        <PlugRearView key={`p${jx}`} x={jx} y={DSP.jackY} k={RK} />
      ))}
      {/* interface outputs → amp inputs, down through the open bay */}
      <JacketPath d={`M254 ${IFACE.jackY} V${SIG_LACE_Y - 6} Q254 ${SIG_LACE_Y - 2} 250 ${SIG_LACE_Y - 2} H146 Q140 ${SIG_LACE_Y - 2} 140 ${SIG_LACE_Y + 4} V${AMP.nl4Y}`} color={A} width={2.2} />
      <JacketPath d={`M274 ${IFACE.jackY} V${SIG_LACE_Y - 2.6} Q274 ${SIG_LACE_Y + 1.4} 270 ${SIG_LACE_Y + 1.4} H168 Q162 ${SIG_LACE_Y + 1.4} 162 ${SIG_LACE_Y + 7.4} V${AMP.nl4Y}`} color={A} width={2.2} />
      {[254, 274].map((x) => (
        <PlugRearView key={`o${x}`} x={x} y={IFACE.jackY} k={RK} />
      ))}
      {AMP.inXs.map((x) => (
        <PlugRearView key={`i${x}`} x={x} y={AMP.nl4Y} k={RK} />
      ))}
      {[200, 230].map((x) => (
        <HookLoopWrap key={`w${x}`} x={x} y={SIG_LACE_Y} k={RK} halfH={3.6} width={6} />
      ))}
      {/* a hook-and-loop wrap retains the harness just past the rail */}
      <HookLoopWrap x={isL ? 64 : 276} y={(TURN_Y['g-ctl'] + TURN_Y['g-analog'] + 10.5) / 2} k={RK} halfH={6.6 / RK} width={4} />
    </G>
  );
}

/** The control line: one Cat cable along the top of the analog harness to
 *  the DSP's NET (control) port. */
function ControlTail({ isL }: { isL: boolean }) {
  const C = CI_CLASS_TINTS.control;
  const x0 = isL ? RAIL_XL : RAIL_XR;
  return (
    <G>
      <JacketPath d={harnessD(x0, railYOf('g-ctl', isL, 'c'), DSP.netX, DSP.jackY)} color={C} width={W_SIG} shadow={false} />
      <Rj45PlugRear cx={DSP.netX} cy={DSP.jackY} color={C} />
    </G>
  );
}

/** Network (expert review 2026-09-28: horizontal cable never lands in
 *  active gear): the horizontals come down the manager and turn in behind
 *  the jacks-to-rear patch panel to its punch-downs on the inside face (the
 *  loom itself); short patch cords then join panel ports 1–4 to switch
 *  ports 1–4 straight down through the manager under the panel. */
function NetTail() {
  const N = CI_CLASS_TINTS.network;
  const mTop = HMGR2.y + 4;
  const mBot = HMGR2.y + HMGR2.h - 4;
  const mid = (mTop + mBot) / 2;
  const ports = [0, 1, 2, 3];
  return (
    <G>
      {ports.map((i) => {
        const px = PATCH_XS[i];
        const sx = SW_CX[i];
        return (
          <JacketPath
            key={`c${i}`}
            d={`M${px} ${PATCH.jackCy} V${mTop} C${px} ${mid} ${sx} ${mid} ${sx} ${mBot} V${SWITCH.portCy}`}
            color={N}
            width={2}
            shadow={i === 0}
          />
        );
      })}
      {ports.map((i) => (
        <Rj45PlugRear key={`p${i}`} cx={PATCH_XS[i]} cy={PATCH.jackCy} color={N} />
      ))}
      {ports.map((i) => (
        <Rj45PlugRear key={`s${i}`} cx={SW_CX[i]} cy={SWITCH.portCy} color={N} />
      ))}
    </G>
  );
}

/** Fiber: one duplex LC patch into the switch's first SFP cage — the duplex
 *  LC clip seen end-on at its real size (~12.5 × 9 mm). */
function FiberTail({ isL }: { isL: boolean }) {
  const F = CI_CLASS_TINTS.fiber;
  const x0 = isL ? RAIL_XL : RAIL_XR;
  const cx = SFP_CX[0];
  const cy = SWITCH.portCy;
  const w = 12.5 * RK;
  const h = 9 * RK;
  return (
    <G>
      <JacketPath d={harnessD(x0, railYOf('g-fib', isL, 'c'), cx, cy)} color={F} width={W_SIG} shadow={false} />
      {/* duplex LC plug end-on: two latched ferrule bodies in their clip */}
      <Rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={0.6} fill="#d9d6ca" stroke="#6b6a63" strokeWidth={0.35} />
      <Rect x={cx - w / 2 + 0.7} y={cy - h / 2 + 0.7} width={w / 2 - 1.1} height={h - 1.4} rx={0.4} fill={shade(F, 0.2)} />
      <Rect x={cx + 0.4} y={cy - h / 2 + 0.7} width={w / 2 - 1.1} height={h - 1.4} rx={0.4} fill={shade(F, 0.2)} />
    </G>
  );
}

/** Loudspeaker: both NL4 outputs, dressed along the lacing bar across the
 *  open bay (never over the intake), each seated plug locked. */
function SpeakerTail({ isL }: { isL: boolean }) {
  const S = CI_CLASS_TINTS.speaker;
  const [o1, o2] = AMP.nl4Xs;
  const x0 = isL ? RAIL_XL : RAIL_XR;
  return (
    <G>
      {/* each NL4 output its own cable, from the rail along the lacing bar —
          the lower lane peels down first, onto the jack nearer the rail */}
      <JacketPath d={harnessD(x0, railYOf('g-spk', isL, 'o1'), o1, AMP.nl4Y)} color={S} width={laneW('g-spk')} shadow={false} />
      <JacketPath d={harnessD(x0, railYOf('g-spk', isL, 'o2'), o2, AMP.nl4Y)} color={S} width={laneW('g-spk')} shadow={false} />
      <Nl4PlugRear x={o1} y={AMP.nl4Y} />
      <Nl4PlugRear x={o2} y={AMP.nl4Y} />
      {[200, 250].map((x) => (
        <HookLoopWrap key={x} x={x} y={LACE_Y} k={RK} halfH={4.6} width={6} />
      ))}
    </G>
  );
}

/** AC: the PDU's own feed seated in its inlet, and two IEC cords from its
 *  outlets — one up the right manager to the DSP, one short to the amp
 *  directly above the PDU. */
function AcTail() {
  const P = CI_CLASS_TINTS.power;
  const o1 = DISTRO_XS[0] + 7.6;
  const o2 = DISTRO_XS[1] + 7.6;
  const boot = PDU.outY + 15.2;
  const dspBoot = { x: 243.5, y: DSP.y + 32 + 15.2 };
  const ampBoot = { x: 135.5, y: AMP.y + 50 + 15.2 };
  return (
    <G>
      <JacketPath d={`M${o1} ${boot} V${boot + 4} Q${o1} ${boot + 8} ${o1 + 4} ${boot + 8} H318 Q322 ${boot + 8} 322 ${boot + 4} V${dspBoot.y + 4.3} Q322 ${dspBoot.y + 0.3} 318 ${dspBoot.y + 0.3} H${dspBoot.x}`} color={P} width={3} />
      {/* the PDU's own feed, up from the right manager into its inlet */}
      <JacketPath d={`M${RAIL_XR} ${TURN_Y['g-ac']} H273.6`} color={P} width={laneW('g-ac')} />
      <JacketPath d={`M${o2} ${boot} C${o2} ${boot + 12} ${ampBoot.x} ${boot + 12} ${ampBoot.x} ${boot - 6} V${ampBoot.y}`} color={P} width={3} />
      <C13Plug x={DISTRO_XS[0]} y={PDU.outY} />
      <C13Plug x={DISTRO_XS[1]} y={PDU.outY} />
      <C13Plug x={236} y={DSP.y + 32} />
      <C13Plug x={128} y={AMP.y + 50} />
      <C13Plug x={264} y={PDU.y + 5.5} />
    </G>
  );
}

function GroupTail({ id, isL }: { id: string; isL: boolean }) {
  if (id === 'g-analog') return <AnalogTail isL={isL} />;
  if (id === 'g-ctl') return <ControlTail isL={isL} />;
  if (id === 'g-net') return <NetTail />;
  if (id === 'g-fib') return <FiberTail isL={isL} />;
  if (id === 'g-spk') return <SpeakerTail isL={isL} />;
  return <AcTail />;
}

/** Phase-C trace: line A-07 from the rack entry, along the top duct, down
 *  the left manager, into the analog harness and off it at DSP INPUT 7 —
 *  exactly the path the dressed analog loom takes. */
const TRACE_RUN = groupRuns('g-analog', true).find((r) => r.key === 'in7')!;
const TRACE_D = `${TRACE_RUN.d} ${harnessD(RAIL_XL, TRACE_RUN.railY, DSP_JACK_XS[6], DSP.jackY).replace(/^M[^H]*/, '')}`;
/** Where line A-07 drops through the top entry (its A-007 tag). */
const TRACE_EX = L_GEO.ex - TRACE_RUN.off;
/** Over-estimated length of TRACE_D (see loomLen). */
const TRACE_LEN = 640;
/** Length of the travelling head that leads the beam down the cable. */
const BEAM_HEAD = 26;

/* ═════════════════ local motion primitives (kit-based, SVG-safe) ══════════ */

/**
 * ENTRANCE semantics: `enter` true = play the entrance; false = REST, which
 * for these helpers means fully present. That lets the scene drop the intro
 * flag once it has landed without anything popping back out.
 */
function SvgIn({ enter, delay = 0, dur = CI_MOTION.base, children }: { enter: boolean; delay?: number; dur?: number; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(enter && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(t);
    if (!enter || m.reduce) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: dur, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, delay, dur, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={enter && !m.reduce ? 0 : 1} animatedProps={p}>
      {children}
    </AG>
  );
}

/** STATE semantics: `show` false = hidden. For markers, flags and tags. */
function SvgToggle({ show, delay = 0, dur = CI_MOTION.base, children }: { show: boolean; delay?: number; dur?: number; children: ReactNode }) {
  const m = useCiMotion();
  const t = useSharedValue(show ? 1 : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = show ? 1 : 0;
      return;
    }
    t.value = withDelay(show ? delay : 0, withTiming(show ? 1 : 0, { duration: dur, easing: CI_EASE.out }));
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, delay, dur, m.reduce]);
  const p = useAnimatedProps(() => ({ opacity: t.value }));
  return (
    <AG opacity={show ? 1 : 0} animatedProps={p}>
      {children}
    </AG>
  );
}

/** One tonal layer of a jacketed cable riding a shared 0..1 install clock. */
function JacketLayer({
  d,
  len,
  p,
  color,
  width,
  opacity = 1,
  dx = 0,
  dy = 0,
}: {
  d: string;
  len: number;
  p: SharedValue<number> | null;
  color: string;
  width: number;
  opacity?: number;
  dx?: number;
  dy?: number;
}) {
  const own = useSharedValue(1);
  const v = p ?? own;
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - v.value) }));
  const path = (
    <APath
      d={d}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={p ? len : undefined}
      strokeDashoffset={p ? len * (1 - v.value) : undefined}
      animatedProps={p ? ap : undefined}
    />
  );
  // a STATIC translate only (never animated) — the lit/shadow offsets
  return dx || dy ? <G transform={`translate(${dx} ${dy})`}>{path}</G> : path;
}

/**
 * A jacketed cable along `d`: contact shadow, core edge, body in the class
 * tint, a sheen on the lit side (upper-left). `p` = the install clock (null =
 * fully installed). The class tints are the lab's teaching colours; the body
 * is taken a step darker so it reads as a PVC jacket rather than a neon line.
 */
function JacketCable({ d, len, p, color, width, opacity = 1 }: { d: string; len: number; p: SharedValue<number> | null; color: string; width: number; opacity?: number }) {
  const body = shade(color, 0.22);
  return (
    <G opacity={opacity}>
      <JacketLayer d={d} len={len} p={p} color="rgba(0,0,0,0.5)" width={width * 1.05} dx={width * 0.18} dy={width * 0.35} />
      <JacketLayer d={d} len={len} p={p} color={shade(color, 0.66)} width={width} />
      <JacketLayer d={d} len={len} p={p} color={body} width={width * 0.76} />
      <JacketLayer d={d} len={len} p={p} color={lighten(body, 0.5)} width={Math.max(0.5, width * 0.24)} opacity={0.8} dx={-width * 0.17} dy={-width * 0.2} />
    </G>
  );
}

/**
 * A cable that installs itself along its route — useDrawIn's dash-reveal with
 * ENTRANCE rest semantics (not drawing ⇒ fully drawn, so a static rack, e.g.
 * the Phase-C BEFORE strip, renders complete on the first paint). Drawn as a
 * shaded jacket (JacketCable), never a flat stroke.
 */
function DrawPath({
  d,
  len,
  color,
  width,
  opacity = 1,
  enter,
  delay = 0,
  dur,
}: {
  d: string;
  len: number;
  color: string;
  width: number;
  opacity?: number;
  enter: boolean;
  delay?: number;
  dur?: number;
}) {
  const m = useCiMotion();
  const p = useSharedValue(enter && !m.reduce ? 0 : 1);
  useEffect(() => {
    cancelAnimation(p);
    if (!enter || m.reduce) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(delay, withTiming(1, { duration: dur ?? Math.min(CI_MOTION.draw, 240 + len * 1.9), easing: CI_EASE.out }));
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enter, delay, dur, len, m.reduce]);
  return <JacketCable d={d} len={len} p={p} color={color} width={width} opacity={opacity} />;
}

/** Same reveal, for the coils and service loops (an ellipse as a path). */
function DrawEllipse({
  cx,
  cy,
  rx,
  ry,
  len,
  color,
  width,
  opacity = 1,
  enter,
  delay = 0,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  len: number;
  color: string;
  width: number;
  opacity?: number;
  enter: boolean;
  delay?: number;
}) {
  const d = `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  return <DrawPath d={d} len={len} color={color} width={width} opacity={opacity} enter={enter} delay={delay} />;
}

/** Spring a scalar to its target with the kit's UI spring (markers, ticks). */
function useSpringTo(target: number, initial = target) {
  const m = useCiMotion();
  const v = useSharedValue(initial);
  useEffect(() => {
    cancelAnimation(v);
    if (m.reduce) {
      v.value = target;
      return;
    }
    v.value = withSpring(target, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, m.reduce]);
  return v;
}

/** A settle-in pop for RN furniture — fires only on the RISING edge, so a
 *  chip that is already active at mount doesn't jump. */
function usePop(active: boolean, from = 0.94) {
  const m = useCiMotion();
  const s = useSharedValue(1);
  const was = useRef(active);
  useEffect(() => {
    const rising = active && !was.current;
    was.current = active;
    if (!rising || m.reduce) return;
    cancelAnimation(s);
    s.value = from;
    s.value = withSpring(1, CI_SPRING_UI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, from, m.reduce]);
  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

/* ═══════════════════════════ SVG sub-layers ═══════════════════════════════ */

/** One rack band. On entry the rack assembles top-to-bottom: the skeleton
 *  first (index 0), then every piece of gear in the order it is racked. */
function Band({ index, enter, children }: { index: number; enter: boolean; children: ReactNode }) {
  return (
    <SvgIn enter={enter} delay={index * ASSEMBLE_STEP} dur={ASSEMBLE_DUR}>
      {children}
    </SvgIn>
  );
}

const Chassis = memo(function Chassis({ dress, enter }: { dress: boolean; enter: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0b0b0e" />
      <Band index={0} enter={enter}>
        <RackFrame dress={dress} />
      </Band>
      <Band index={2} enter={enter}>
        <HorizontalManager xs={HMGR_XS} />
      </Band>
      <Band index={3} enter={enter}>
        <PatchPanelRear xs={PATCH_XS} dress={dress} />
        <HorizontalManager xs={HMGR_XS} y={HMGR2.y} />
      </Band>
      <Band index={4} enter={enter}>
        <NetworkSwitch lit={dress ? [0, 1, 2, 3] : [0, 4]} />
      </Band>
      <Band index={5} enter={enter}>
        <DspRear xs={DSP_JACK_XS} dress={dress} />
      </Band>
      <Band index={6} enter={enter}>
        <AudioInterface xs={IFACE_XS} />
      </Band>
      <Band index={7} enter={enter}>
        <OpenBay u={7} us={2} />
        {/* dressed: two rear lacing bars — line level across the open bay,
            the speaker loom just above the amp, never sharing a support */}
        {dress ? <LacingBar x0={60} x1={280} y={SIG_LACE_Y} k={RK} /> : null}
      </Band>
      <Band index={8} enter={enter}>
        <BlankPanel u={9} us={2} />
        {dress ? <LacingBar x0={60} x1={280} y={LACE_Y} k={RK} /> : null}
      </Band>
      {/* heaviest lowest (expert review 2026-09-28): the 3U amp sits on the
          PDU at the bottom of the rack, carried on rear supports */}
      <Band index={9} enter={enter}>
        <Amplifier dress={dress} />
      </Band>
      <Band index={10} enter={enter}>
        <PowerDistro xs={DISTRO_XS} dress={dress} />
      </Band>
    </>
  );
});

/**
 * Every visibly-wrong detail of the Phase-A rack — fourteen vignettes, each a
 * REAL cable from a REAL connector, wrong in exactly the way its finding
 * names (owner 2026-09-28: a working installer must look at each one and say
 * "yes, that is what a bad install looks like"). Nothing floats: every run
 * starts at a plug, a module or the top entry and ends at gear, in a manager
 * or behind a chassis. Plugs are drawn end-on, as a rear view sees them.
 *
 * MOTION — once the rack has finished assembling, the mess ARRIVES: each run
 * draws itself in, deliberately out of order, because that is how this
 * cabling was installed. Delays are hand-scattered.
 */
/** ri-10/ri-14: the four AC cords' run under the PDU (each its own line). */
const AC_RUN_Y = [349, 353.2, 357.4, 361.6] as const;
const AC_MID = (AC_RUN_Y[0] + AC_RUN_Y[3]) / 2;
/** The analog line's weave across those cords: half-waves alternately over
 *  and under the run, so it reads as twisted through them. */
const WEAVE: { d: string; over: boolean }[] = (() => {
  const out: { d: string; over: boolean }[] = [];
  const x0 = 176;
  const x1 = 298;
  const half = 24;
  for (let a = x0, i = 0; a < x1; a += half, i++) {
    const b = Math.min(x1, a + half);
    const pts: string[] = [];
    for (let s = 0; s <= 8; s++) {
      const x = a + ((b - a) * s) / 8;
      const y = AC_MID + 8.2 * Math.sin(((x - x0) / (2 * half)) * Math.PI * 2);
      pts.push(`${s ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    out.push({ d: pts.join(' '), over: i % 2 === 0 });
  }
  return out;
})();

const BadCables = memo(function BadCables({ enter, found }: { enter: boolean; found?: ReadonlySet<string> }) {
  /** Inspector's red strain marks are ANNOTATIONS: they appear only once the
   *  learner has documented that defect — the cable geometry carries it first. */
  const flag = (id: string) => !!found && found.has(id);
  const P = CI_CLASS_TINTS.power;
  const A = CI_CLASS_TINTS.analog;
  const N = CI_CLASS_TINTS.network;
  const S = CI_CLASS_TINTS.speaker;
  const at = (rel: number) => CHAOS_AT + rel;
  /** Patch port 22 (index 21). */
  const P22 = PATCH_XS[21];

  /* ri-9 — the horizontals: entry x → over the raw lip → down behind the
     jacks-to-rear patch panel to their punch-downs on its inside face */
  const drops: [number, number][] = [[160, 1], [169, 4], [178, 2], [187, 7], [196, 5], [205, 10], [214, 8]];
  const dropD = (ex: number, cx: number) =>
    `M${ex} 0 V13.6 L${(ex + (cx - ex) * 0.08).toFixed(1)} 17.4 C${(ex + (cx - ex) * 0.5).toFixed(1)} 30 ${cx} 30 ${cx} ${PATCH.y - 0.5}`;

  /* ri-7 — six-pair loom, crushed to an hourglass at two over-tight ties */
  // squeezed to just over one OD at each tie — touching, never drawn on top of each other
  const crush = (x: number) => 1 - 0.4 * Math.exp(-((x - 226) * (x - 226)) / 48) - 0.4 * Math.exp(-((x - 268) * (x - 268)) / 48);
  /** each pair of the loom lands in its own interface input (3–6) */
  const loomD = (off: number, jx: number) => {
    let d = '';
    for (let x = 298; x >= 204; x -= 4) d += `${x === 298 ? 'M' : 'L'}${x} ${(200 + off * crush(x)).toFixed(1)} `;
    return `${d}C194 ${200 + off} ${jx} ${186 + off * 0.4} ${jx} ${IFACE.jackY}`;
  };

  return (
    <>
      {/* ── ri-9 · the trunk dives over the raw cut-out lip — hard corners at
          the sheet edge, the runs fanning across the panel to their modules */}
      {drops.map(([ex, mi], i) => (
        <DrawPath key={ex} d={dropD(ex, PATCH_XS[mi])} len={80} color={N} width={3} enter={enter} delay={at(40 + i * 45)} />
      ))}
      <SvgIn enter={enter} delay={at(420)}>
        <Kink x={169} y={14.8} />
        <Kink x={196} y={14.8} />
        <Kink x={214} y={14.8} />
      </SvgIn>

      {/* ── ri-13 · the one labelled cable — a patch cord in port 22, up into
          the top duct: its flag says N-012, the strip under its port says
          N-007 — the two ends disagree */}
      <DrawPath d={`M${P22} ${PATCH.jackCy} V30 C${P22} 25 ${P22 + 4} 23 ${P22 + 12} 23 H288`} len={90} color={N} width={2.4} enter={enter} delay={at(230)} />
      {/* ── ri-4 · the designation strip is blank (drawn blank by the panel
          itself — the absence IS the defect) */}

      {/* ── ri-1 · an IEC cord and a mic line plaited through each other along
          the manager row (power in with signal, no plan) */}
      <DrawPath d="M152 0 V13.6 C152 24 76 22 58 29" len={110} color={P} width={4} enter={enter} delay={at(60)} />
      <DrawPath d="M226 0 V13.6 C226 24 200 26 190 29" len={60} color={A} width={3.2} enter={enter} delay={at(120)} />
      <SvgIn enter={enter} delay={at(300)}>
        <Plait x0={58} x1={190} y={29} amp={4.2} period={44} colors={[P, A]} widths={[4, 3.2]} />
      </SvgIn>
      {/* the cord goes on over the patch panel and down the right edge of the
          switch face to the DSP inlet; the mic line to DSP input 2 */}
      <DrawPath d="M190 29 C214 23 262 21 272 25 C278 28 279 36 279 48 V96 C279 142 250 162 243.5 153.2" len={200} color={P} width={4} enter={enter} delay={at(360)} />
      <SvgIn enter={enter} delay={at(520)}>
        {/* ri-13: the wrap-label flag, folded round the cable just above its
            port — and the strip under that port, which disagrees */}
        <Rj45PlugRear cx={P22} cy={PATCH.jackCy} color={N} />
        <Line x1={P22 - 3.2} y1={33.5} x2={P22 - 1.2} y2={33.5} stroke="#eceae3" strokeWidth={1.4} />
        <Rect x={P22 - 30.1} y={30} width={28} height={9} rx={0.8} fill="rgba(0,0,0,0.45)" />
        <Rect x={P22 - 31} y={29} width={28} height={9} rx={0.8} fill="#eceae3" stroke="#8d8a80" strokeWidth={0.35} />
        <SvgText x={P22 - 17} y={36.2} fontFamily={fonts.mono} fontSize={RACK_TEXT} fill="#17181b" textAnchor="middle">
          N-012
        </SvgText>
        <SvgText x={P22} y={PATCH.stripY + 6.7} fontFamily={fonts.mono} fontSize={RACK_TEXT} fill="#17181b" textAnchor="middle">
          N-007
        </SvgText>
      </SvgIn>
      <DrawPath d={`M58 29 C44 60 70 110 ${DSP_JACK_XS[1]} ${DSP.jackY}`} len={100} color={A} width={3.2} enter={enter} delay={at(380)} />
      <SvgIn enter={enter} delay={at(520)}>
        <C13Plug x={236} y={DSP.y + 32} />
        <PlugRearView x={DSP_JACK_XS[1]} y={DSP.jackY} k={RK} />
      </SvgIn>

      {/* ── ri-8 · Cat6 out of switch port 1, folded 180° round the rail edge
          into the manager — a crease where the jacket gave */}
      <DrawPath d={`M${SW_CX[0]} 97.3 H${RAIL_L_X + 3} C${RAIL_L_X - 2} 97.3 ${RAIL_L_X - 2} 104 ${RAIL_L_X + 3} 104 L${RAIL_L_X + 11} 104 C${RAIL_L_X + 15} 104 ${RAIL_L_X + 15} 110 ${RAIL_L_X + 12} 116 C${RAIL_L_X + 7} 128 ${RAIL_L_X - 1} 134 ${RAIL_L_X - 13} 140 C${RAIL_L_X - 14} 142 ${RAIL_L_X - 14.7} 146 ${RAIL_L_X - 14.7} 152 V346`} len={320} color={N} width={3} enter={enter} delay={at(250)} />
      <SvgIn enter={enter} delay={at(420)}>
        <Rj45PlugRear cx={SW_CX[0]} cy={SWITCH.portCy} color={N} />
        <Kink x={RAIL_L_X - 0.8} y={100.6} angle={-90} />
      </SvgIn>

      {/* ── ri-2 · three XLRs in DSP inputs 6–8, the cables pulled away at an
          angle straight from the boot and bundled into a loom that hangs its
          whole weight on the three connectors */}
      {/* one line per input, all the way: pulled off at an angle, then bunched
          tight (touching, never drawn as one) down into the right manager */}
      {[
        `M${DSP_JACK_XS[5]} ${DSP.jackY} C192 134 214 144 246 150`,
        `M${DSP_JACK_XS[6]} ${DSP.jackY} C216 132 232 146 250 150`,
        `M${DSP_JACK_XS[7]} ${DSP.jackY} C240 134 246 144 254 150`,
      ].map((pull, k) => (
        <DrawPath
          key={k}
          d={`${pull} V172 A${14 - 4 * k} ${14 - 4 * k} 0 0 0 260 ${186 - 4 * k} H302 A${4 + 4 * k} ${4 + 4 * k} 0 0 1 ${306 + 4 * k} 190 V214`}
          len={190}
          color={A}
          width={3.2}
          enter={enter}
          delay={at(160 + k * 40)}
        />
      ))}
      <SvgIn enter={enter} delay={at(460)}>
        {DSP_JACK_XS.slice(5).map((cx) => (
          <PlugRearView key={cx} x={cx} y={DSP.jackY} k={RK} />
        ))}
        <G transform="rotate(90 250 160)">
          <CableTie x={250} y={160} k={RK} halfH={7.6 / RK} black />
        </G>
        {flag('ri-2')
          ? DSP_JACK_XS.slice(5).map((cx) => <StrainFlag key={`f${cx}`} x={cx + 1} y={DSP.jackY + 9} angle={180} />)
          : null}
      </SvgIn>

      {/* ── ri-12 · two interface lines pulled bowstring-tight to the manager:
          dead straight, no slack, the plugs carrying the load */}
      <DrawPath d={`M${IFACE_XS[0]} ${IFACE.jackY} L26 212 V346`} len={210} color={A} width={3.2} enter={enter} delay={at(70)} />
      <DrawPath d={`M${IFACE_XS[1]} ${IFACE.jackY} L31 216 V346`} len={220} color={A} width={3.2} enter={enter} delay={at(130)} />
      <SvgIn enter={enter} delay={at(340)}>
        <TrsPlugRear x={IFACE_XS[0]} y={IFACE.jackY} />
        <TrsPlugRear x={IFACE_XS[1]} y={IFACE.jackY} />
        {flag('ri-12') ? (
          <>
            <StrainFlag x={IFACE_XS[0] - 4} y={IFACE.jackY + 8} angle={140} />
            <StrainFlag x={IFACE_XS[1] - 4} y={IFACE.jackY + 8} angle={140} />
            <Path d="M42 190 q3 -2.4 6 0 M40 194 q3 -2.4 6 0 M60 194 q3 -2.4 6 0 M58 198 q3 -2.4 6 0" stroke="#ff7a68" strokeWidth={1.4} fill="none" strokeLinecap="round" />
          </>
        ) : null}
      </SvgIn>

      {/* ── ri-3 · a hank of excess Cat6 wound tight and stuffed into the open
          bay — turns side by side at the cable's own diameter, tied */}
      <SvgIn enter={enter} delay={at(210)}>
        <Hank cx={172} cy={194} rx={36} ry={20} turns={8} color={N} width={3} jam />
        <G transform="rotate(90 149 194)">
          <CableTie x={149} y={194} k={RK} halfH={22} black />
        </G>
      </SvgIn>
      <DrawPath d={`M174 176 C168 150 ${SW_CX[4] + 30} 124 ${SW_CX[4]} ${SWITCH.portCy + 2}`} len={100} color={N} width={3} enter={enter} delay={at(330)} />
      <DrawPath d="M176 212 L177 216" len={6} color={N} width={3} enter={enter} delay={at(330)} />
      <SvgIn enter={enter} delay={at(430)}>
        <Rj45PlugRear cx={SW_CX[4]} cy={SWITCH.portCy} color={N} />
      </SvgIn>

      {/* ── ri-11 · service loops cinched hard against the rail with two ties,
          in the corner beside the amp — slack no hand can reach */}
      {/* each its own lane up the manager (x 12 / 17), clear of the bowstring
          interface lines (26 / 31) and the hairpinned Cat6 (36.5) */}
      <DrawPath d="M46 254 C42 246 26 240 12 228 V120" len={170} color={A} width={3.2} enter={enter} delay={at(380)} />
      <DrawPath d="M48 257 C42 250 28 246 17 236 V130" len={160} color={N} width={3} enter={enter} delay={at(400)} />
      <SvgIn enter={enter} delay={at(440)}>
        <JacketPath d="M41 262 a12 9.5 0 1 0 24 0 a12 9.5 0 1 0 -24 0" color={A} width={3.2} />
        <JacketPath d="M45 263 a8 6.5 0 1 0 16 0 a8 6.5 0 1 0 -16 0" color={N} width={3} />
        <G transform="rotate(90 55 257)">
          <CableTie x={55} y={257} k={RK} halfH={18} black />
        </G>
        <G transform="rotate(90 55 268)">
          <CableTie x={55} y={268} k={RK} halfH={18} black />
        </G>
        {/* the loops are cinched THROUGH the rail: the rail comes back over
            them, so the slack sits in the corner no hand reaches */}
        <RackRail x={RAIL_L_X} y0={250} y1={276} k={RK} uTop={U_TOP} flange={RAIL_FLANGE_MM} />
      </SvgIn>
      <DrawPath d="M46 270 C44 280 41.5 292 41.5 310 V346" len={90} color={A} width={3.2} enter={enter} delay={at(470)} />

      {/* ── ri-7 · the loom out of the right manager, cinched to an hourglass
          at two over-tightened ties, then down into the bay behind the amp */}
      {[-7.5, -2.5, 2.5, 7.5].map((off, i) => (
        <DrawPath key={off} d={loomD(off, IFACE_XS[2 + i])} len={190} color={A} width={2.8} enter={enter} delay={at(130 + i * 18)} />
      ))}
      <SvgIn enter={enter} delay={at(320)}>
        {IFACE_XS.slice(2).map((cx) => (
          <TrsPlugRear key={cx} x={cx} y={IFACE.jackY} />
        ))}
        <CableTie x={226} y={200} k={RK} halfH={6} bite={1} black tail="long" />
        <CableTie x={268} y={200} k={RK} halfH={6} bite={1} black tail="long" />
      </SvgIn>

      {/* ── ri-5 · a strapped, taut bundle run dead straight across the amp's
          connector field — nothing behind it can be reached */}
      <DrawPath d="M42 283 H166 Q170 283 170 279 V240 Q170 236 174 236 H298" len={330} color={S} width={5} enter={enter} delay={at(350)} />
      <DrawPath d="M42 287.4 H169.4 Q173.4 287.4 173.4 283.4 V244.4 Q173.4 240.4 177.4 240.4 H298" len={330} color={A} width={3.2} enter={enter} delay={at(380)} />
      <DrawPath d="M42 291.6 H172.8 Q176.8 291.6 176.8 287.6 V248.6 Q176.8 244.6 180.8 244.6 H298" len={330} color={P} width={4} enter={enter} delay={at(410)} />
      <DrawPath d="M42 295.6 H176.2 Q180.2 295.6 180.2 291.6 V252.6 Q180.2 248.6 184.2 248.6 H298" len={330} color={A} width={3.2} enter={enter} delay={at(430)} />
      <SvgIn enter={enter} delay={at(480)}>
        <CableTie x={60} y={289.4} k={RK} halfH={17} />
        <CableTie x={158} y={289.4} k={RK} halfH={17} />
      </SvgIn>

      {/* ── ri-6 · the two NL4 speaker lines out of the amp, dressed straight
          across the rear fan exhaust and wrapped there */}
      <DrawPath d={`M${AMP.nl4Xs[0]} ${AMP.nl4Y} C76 302 80 308 94 308 H176 C190 310 210 306 230 306 H298`} len={250} color={S} width={5} enter={enter} delay={at(200)} />
      <DrawPath d={`M${AMP.nl4Xs[1]} ${AMP.nl4Y} C104 300 110 302 122 302 H176 C192 301 214 300 236 300 H298`} len={220} color={S} width={5} enter={enter} delay={at(260)} />
      <SvgIn enter={enter} delay={at(440)}>
        <Nl4PlugRear x={AMP.nl4Xs[0]} y={AMP.nl4Y} />
        <Nl4PlugRear x={AMP.nl4Xs[1]} y={AMP.nl4Y} />
        <HookLoopWrap x={202} y={304} k={RK} halfH={12} width={16} />
        <HookLoopWrap x={262} y={303} k={RK} halfH={12} width={16} />
      </SvgIn>

      <SvgIn enter={enter} delay={at(540)}>
        {WEAVE.map((seg, i) => (seg.over ? null : <JacketPath key={i} d={seg.d} color={A} width={3.2} shadow={false} />))}
      </SvgIn>
      {/* ── ri-10 · three C13 plugs levered sideways because their cords are
          hauled to the right into one tight tie */}
      {/* four cords hauled into one tie and on to the right as a tight run —
          tight, but each cord still its own line (AC_RUN_Y, top to bottom:
          the amp's cord, then outlets 3, 2, 1) */}
      <DrawPath d={`M${DISTRO_XS[0] + 7.5} 347 C76 360 110 362 150 ${AC_RUN_Y[3]} H298`} len={260} color={P} width={4} enter={enter} delay={at(440)} />
      <DrawPath d={`M${DISTRO_XS[1] + 7.5} 347 C95 357 120 357.6 150 ${AC_RUN_Y[2]} H298`} len={240} color={P} width={4} enter={enter} delay={at(460)} />
      <DrawPath d={`M${DISTRO_XS[2] + 7.5} 347 C113 353 132 353.4 150 ${AC_RUN_Y[1]} H298`} len={220} color={P} width={4} enter={enter} delay={at(480)} />
      <DrawPath d={`M135.5 ${AMP.y + 65.2} C135.5 336 142 ${AC_RUN_Y[0]} 150 ${AC_RUN_Y[0]} H298`} len={200} color={P} width={4} enter={enter} delay={at(470)} />
      <SvgIn enter={enter} delay={at(520)}>
        {/* static transforms — evaluated at render time, never animated */}
        <C13Plug x={128} y={AMP.y + 50} />
        {[12, 14, 10].map((deg, i) => (
          <G key={deg} transform={`rotate(${deg} ${DISTRO_XS[i] + 7.5} ${PDU.outY + 6})`}>
            <C13Plug x={DISTRO_XS[i]} y={PDU.outY} />
          </G>
        ))}
        {flag('ri-10') ? [0, 1, 2].map((i) => <StrainFlag key={i} x={DISTRO_XS[i] + 12} y={PDU.outY - 1} angle={30} />) : null}
        <CableTie x={152} y={(AC_RUN_Y[0] + AC_RUN_Y[3]) / 2} k={RK} halfH={(AC_RUN_Y[3] - AC_RUN_Y[0] + 4.4) / 2 / RK} black />
      </SvgIn>

      {/* ── ri-14 · the amp's analog input line woven over and under the AC
          cords under the PDU (power in with signal, no plan) — the cords stay
          separate lines, the analog line crosses them */}
      <DrawPath d={`M${AMP.inXs[0]} ${AMP.nl4Y} C140 306 148 320 156 326 L166 344 C170 350 172 ${AC_MID} 176 ${AC_MID}`} len={110} color={A} width={3.2} enter={enter} delay={at(170)} />
      <SvgIn enter={enter} delay={at(540)}>
        <PlugRearView x={AMP.inXs[0]} y={AMP.nl4Y} k={RK} />
        {WEAVE.map((seg, i) => (seg.over ? <JacketPath key={i} d={seg.d} color={A} width={3.2} /> : null))}
      </SvgIn>
    </>
  );
});

/** The outgoing route, pulled back out of the manager. Dash offset GROWS, so
 *  the loom withdraws destination-first, back toward the entry. */
function Retract({ lanes, len, tint }: { lanes: readonly LoomLane[]; len: number; tint: string }) {
  const p = useSharedValue(1);
  useEffect(() => {
    p.value = withTiming(0, { duration: RETRACT_MS, easing: CI_EASE.inOut });
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value), opacity: 0.2 + 0.65 * p.value }));
  return (
    <AG>
      {lanes.map((l, i) => (
        <APath
          key={i}
          d={l.d}
          stroke={tint}
          strokeWidth={l.w}
          fill="none"
          strokeLinecap="round"
          opacity={0.85}
          strokeDasharray={len}
          strokeDashoffset={0}
          animatedProps={ap}
        />
      ))}
    </AG>
  );
}

/** One cable of a loom: its own path and jacket width. */
type LoomLane = { d: string; w: number };

/**
 * ONE learner-assigned loom — THE PHASE-B SIGNATURE MOVE.
 *   assign     → the loom INSTALLS ITSELF down the chosen manager (useDrawIn),
 *                source → gear, and its termination lands when the draw lands.
 *   reassign   → the old route RETRACTS back out of the manager first, THEN
 *                the new one installs. A cable gets pulled and re-dressed; it
 *                never teleports.
 *   revealed   → correct looms take a brief FLOW pulse (signal just came
 *                alive); wrong ones breathe a dashed-red flag until fixed.
 * `install` false renders the finished route statically — Phase C is about the
 * trace, and the BEFORE strip must be complete on its first paint.
 */
function Loom({
  lanes,
  len,
  tint,
  install,
  wrong,
  wrongShape,
  flowRun,
  tail,
}: {
  /** Every cable of the loom, each its own lane (never one fat stroke). */
  lanes: readonly LoomLane[];
  len: number;
  tint: string;
  install: boolean;
  wrong: boolean;
  wrongShape: ReactNode;
  flowRun: boolean;
  tail?: ReactNode;
}) {
  const m = useCiMotion();
  const d = lanes.map((l) => l.d).join('|');
  const prev = useRef<{ d: string; len: number; lanes: readonly LoomLane[] } | null>(null);
  const [leaving, setLeaving] = useState<{ d: string; len: number; lanes: readonly LoomLane[] } | null>(null);
  const [landed, setLanded] = useState(!install);

  useEffect(() => {
    const was = prev.current;
    prev.current = { d, len, lanes };
    if (!was || was.d === d || !install || m.reduce) return;
    setLanded(false);
    setLeaving(was);
    const id = setTimeout(() => setLeaving(null), RETRACT_MS + 40);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, len, install, m.reduce]);

  const draw = useDrawIn(len, { run: install && !leaving, onDone: () => setLanded(true) });
  const { t: wrongT } = usePulse({ run: wrong, period: 1100 });
  const wrongProps = useAnimatedProps(() => ({ opacity: 0.4 + 0.6 * wrongT.value }));
  const flow = useFlow({ run: flowRun, speed: 900, dash: 7, gap: 13 });

  return (
    <G>
      {lanes.map((l, i) => (
        <JacketCable key={i} d={l.d} len={len} p={install ? draw.progress : null} color={tint} width={l.w} opacity={0.96} />
      ))}
      {leaving ? <Retract lanes={leaving.lanes} len={leaving.len} tint={tint} /> : null}
      {flowRun
        ? lanes.map((l, i) => (
            <APath
              key={`f${i}`}
              d={l.d}
              stroke="#f4fbff"
              strokeWidth={Math.max(0.5, l.w * 0.45)}
              fill="none"
              strokeLinecap="round"
              opacity={0.72}
              strokeDasharray={flow.dashArray}
              animatedProps={flow.animatedProps}
            />
          ))
        : null}
      {tail ? (
        <SvgToggle show={landed} dur={CI_MOTION.quick}>
          {tail}
        </SvgToggle>
      ) : null}
      {wrong ? (
        <AG opacity={0.9} animatedProps={wrongProps}>
          {wrongShape}
        </AG>
      ) : null}
    </G>
  );
}

/** Learner-assigned looms of the dressed rack (Phase B/C). Lanes are allocated
 *  by GROUP INDEX, never by assignment order, so reassigning one group can
 *  never shuffle another group's route. Wrong assignments render honestly
 *  (entry coil / hmgr dangle) and get a breathing dashed flag once revealed. */
function Looms({
  assigns,
  wrongIds,
  dim,
  install,
  flowOn,
}: {
  assigns: Record<string, string>;
  wrongIds?: readonly string[] | null;
  dim?: boolean;
  install: boolean;
  flowOn: boolean;
}) {
  const dimT = useTween(dim ? 0.16 : 1, CI_MOTION.base);
  const dimProps = useAnimatedProps(() => ({ opacity: dimT.value }));
  return (
    <AG opacity={dim ? 0.16 : 1} animatedProps={dimProps}>
      {CI_RACK_GROUPS.map((g, gi) => {
        const zone = assigns[g.id];
        if (!zone) return null;
        const tint = CI_CLASS_TINTS[g.tintKey];
        const wrong = !!wrongIds && wrongIds.includes(g.id);
        const flowRun = flowOn && !!wrongIds && !wrongIds.includes(g.id);
        const w = laneW(g.id);
        const n = groupSize(g.id);
        const flag = (lanes: readonly LoomLane[]) => (
          <G>
            {lanes.map((l, i) => (
              <Path key={i} d={l.d} stroke="#ff5a48" strokeWidth={Math.min(1.6, l.w)} fill="none" strokeDasharray="5 4" />
            ))}
          </G>
        );

        if (zone === 'z-left' || zone === 'z-right') {
          const isL = zone === 'z-left';
          // The speaker lanes land ON the amp's NL4 outputs along the lacing
          // bar just above the amp — never on the fan grille, the very defect
          // Phase A teaches (QA 2026-09-26); see SpeakerTail.
          const runs = groupRuns(g.id, isL);
          const lanes = runs.map((r) => ({ d: r.d, w: r.w }));
          return (
            <Loom
              key={g.id}
              lanes={lanes}
              len={runLen(Math.max(...runs.map((r) => r.railY)))}
              tint={tint}
              install={install}
              wrong={wrong}
              flowRun={flowRun}
              tail={<GroupTail id={g.id} isL={isL} />}
              wrongShape={flag(lanes)}
            />
          );
        }

        // the entry stub: each cable drops through the entry and coils on
        // itself above the duct — every coil its own cable's coil
        const ex0 = 160 + gi * 10;
        if (zone === 'z-entry') {
          const cx = entryCx(gi);
          const lanes = Array.from({ length: n }, (_, k) => {
            const ex = ex0 + k * lanePitch(w, w);
            const rx = 9 + k * lanePitch(w, w);
            const ry = 3.5 + k * lanePitch(w, w) * 0.5;
            return { d: `M${ex} 4 C${ex} 10 ${cx + rx} 22 ${cx + rx} 28 A${rx} ${ry} 0 1 1 ${cx + rx - 0.01} 28.4`, w };
          });
          return (
            <Loom
              key={g.id}
              lanes={lanes}
              len={140}
              tint={tint}
              install={install}
              wrong={wrong}
              flowRun={flowRun}
              wrongShape={<Ellipse cx={cx} cy={28} rx={21} ry={10} stroke="#ff5a48" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />}
            />
          );
        }

        const lanes = Array.from({ length: n }, (_, k) => {
          const p = k * lanePitch(w, w);
          const ex = ex0 + p;
          const yRun = hmgrY(gi) + p * 0.6;
          return {
            d:
              `M${ex} 4 C${ex} 12 ${ex + 30} ${yRun - 4} 252 ${yRun - 2} ` +
              `C246 ${yRun} 236 ${yRun} 224 ${yRun} L${86 + p} ${yRun} Q${76 + p} ${yRun} ${76 + p} ${yRun + 9}`,
            w,
          };
        });
        return (
          <Loom
            key={g.id}
            lanes={lanes}
            len={360}
            tint={tint}
            install={install}
            wrong={wrong}
            flowRun={flowRun}
            wrongShape={flag(lanes)}
          />
        );
      })}
      {/* hook-and-loop wraps at even intervals, around each manager's lanes
          and only where that manager actually carries cable */}
      {([true, false] as const).map((isL) => {
        const here = CI_RACK_GROUPS.filter((g) => assigns[g.id] === (isL ? 'z-left' : 'z-right'));
        if (!here.length) return null;
        const runs = here.flatMap((g) => groupRuns(g.id, isL));
        const yMax = Math.max(...runs.map((r) => r.railY - 3 - (r.off - r.off0)));
        const offMax = Math.max(...runs.map((r) => r.off + r.w / 2));
        const inner = isL ? L_GEO.lane + 0.5 : R_GEO.lane - 0.5;
        const cx = isL ? inner - offMax / 2 : inner + offMax / 2;
        return TIE_YS.filter((y) => y > C2_Y + 4 && y < yMax).map((y) => (
          <G key={`${isL ? 'l' : 'r'}${y}`} transform={`rotate(90 ${cx} ${y})`}>
            <HookLoopWrap x={cx} y={y} k={RK} halfH={(offMax / 2 + 1.6) / RK} width={5} />
          </G>
        ));
      })}
    </AG>
  );
}

/**
 * THE PHASE-C SIGNATURE MOVE — the TRACE SWEEP.
 *   1. the veil drops over the rack (~280ms) and the looms dim underneath
 *   2. a BEAM runs the length of the one cable, patch field → DSP input: the
 *      core lights along the route behind a travelling head, so it reads as
 *      something moving down the cable, not a highlight switching on
 *   3. the A-007 tags land at both ends once the beam has arrived
 * One clock (useDrawIn's progress) drives the halo, the core and the head —
 * three mappers, one animation.
 */
function TraceBeam({ run }: { run: boolean }) {
  const A = CI_CLASS_TINTS.analog;
  const veil = useVeil(run, 0.62);
  const draw = useDrawIn(TRACE_LEN, { run, delay: TRACE_DELAY, duration: TRACE_DUR });
  const { progress } = draw;

  /** The cable brightens on the same clock the rack dims on. */
  const coreProps = useAnimatedProps(() => ({
    strokeDashoffset: TRACE_LEN * (1 - progress.value),
    opacity: veil.t.value,
  }));
  const haloProps = useAnimatedProps(() => ({
    strokeDashoffset: TRACE_LEN * (1 - progress.value),
    opacity: 0.3 * Math.min(1, progress.value * 4) * veil.t.value,
  }));
  /** The head sits just ahead of the lit section and fades out as it arrives. */
  const headProps = useAnimatedProps(() => ({
    strokeDashoffset: BEAM_HEAD - TRACE_LEN * progress.value,
    opacity: progress.value <= 0 ? 0 : (1 - Math.max(0, (progress.value - 0.82) / 0.18)) * veil.t.value,
  }));

  return (
    <>
      <ARect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0d0d11" opacity={0} animatedProps={veil.animatedProps} />
      <APath
        d={TRACE_D}
        stroke={A}
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
        opacity={0}
        strokeDasharray={TRACE_LEN}
        strokeDashoffset={TRACE_LEN}
        animatedProps={haloProps}
      />
      <APath
        d={TRACE_D}
        stroke={A}
        strokeWidth={4.2}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={TRACE_LEN}
        strokeDashoffset={TRACE_LEN}
        animatedProps={coreProps}
      />
      <APath
        d={TRACE_D}
        stroke="#f2fbff"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        opacity={0}
        strokeDasharray={`${BEAM_HEAD} ${TRACE_LEN}`}
        strokeDashoffset={BEAM_HEAD}
        animatedProps={headProps}
      />
      <SvgToggle show={run} delay={TRACE_DELAY + 120}>
        <Circle cx={TRACE_EX} cy={11} r={6.5} stroke={colors.amber} strokeWidth={2} fill="none" />
        <Rect x={112} y={4} width={40} height={14} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
        <SvgText x={132} y={14.6} fontSize={9.5} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
          A-007
        </SvgText>
      </SvgToggle>
      <SvgToggle show={run} delay={TRACE_DELAY + TRACE_DUR * 0.85}>
        <PlugRearView x={DSP_JACK_XS[6]} y={DSP.jackY} k={RK} />
        <Circle cx={DSP_JACK_XS[6]} cy={DSP.jackY} r={10} stroke={colors.amber} strokeWidth={2.2} fill="none" />
        {/* the wrap label on the cable, just above the plug — the tag sits
            over the (dimmed) switch so it never reads as labelling jack 8 */}
        <Line x1={214} y1={103} x2={214} y2={108.5} stroke={colors.amber} strokeWidth={0.8} />
        <Rect x={194} y={89} width={40} height={14} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
        <SvgText x={214} y={99.6} fontSize={9.5} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
          A-007
        </SvgText>
      </SvgToggle>
    </>
  );
}

/** The wrong jack: a short red pulse on that jack — three beats, then rest.
 *  The veil never drops, because nothing was traced. */
function WrongJack({ jack, gen }: { jack: number; gen: number }) {
  const m = useCiMotion();
  const cx = DSP_JACK_XS[jack - 1];
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (m.reduce) {
      t.value = 0;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 260, easing: CI_EASE.inOut }), 5, true);
    return () => cancelAnimation(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jack, gen, m.reduce]);
  const p = useAnimatedProps(() => ({ r: 10 + 3.5 * t.value, opacity: 1 - 0.45 * t.value }));
  return <ACircle cx={cx} cy={DSP.jackY} r={10} stroke="#ff5a48" strokeWidth={2.2} fill="none" animatedProps={p} />;
}

/**
 * ONE defect marker.
 *   undocumented → a subtle breathing hotspot (PulseRing). Every marker's loop
 *     is STARTED on its own delay, so the phases are permanently offset and
 *     the field never pulses in unison — pulsing in unison is the 1994 tell.
 *     These say "inspect here"; what is wrong is still the learner's call, and
 *     the SUSPECT LIST already names all fourteen locations.
 *   documented → the loop STOPS, the amber marker springs in on the kit's UI
 *     spring, and a ✓ tick draws itself alongside.
 */
function DefectMarker({ id, found, hot, pulse, index }: { id: string; found: boolean; hot: boolean; pulse: boolean; index: number }) {
  const m = useCiMotion();
  const hit = HIT[id];
  const cx = hit.mx;
  const cy = hit.my;
  const R = hot ? 13 : 11;

  // Each hotspot's loop STARTS on its own delay ⇒ permanently offset phases.
  const [breathing, setBreathing] = useState(false);
  useEffect(() => {
    if (!pulse || found) {
      setBreathing(false);
      return;
    }
    const wait = setTimeout(() => setBreathing(true), m.reduce ? 0 : index * 130);
    return () => clearTimeout(wait);
  }, [pulse, found, index, m.reduce]);

  const r = useSpringTo(found ? R : 0, 0);
  const t = useTween(found ? 1 : 0, CI_MOTION.base);
  const ringProps = useAnimatedProps(() => ({ r: Math.max(0.01, r.value), opacity: Math.min(1, r.value / R) }));
  const glyphProps = useAnimatedProps(() => ({ opacity: t.value }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 13 * (1 - t.value), opacity: t.value }));

  return (
    <G>
      {!found && breathing ? (
        <>
          {/* a dark outline under the dashes, so the ring still reads where it
              sits on yellow (loudspeaker) cable */}
          <Circle cx={cx} cy={cy} r={9} fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth={3.2} />
          <Circle cx={cx} cy={cy} r={9} fill="rgba(255,198,77,0.06)" stroke={colors.amberLabel} strokeWidth={1.3} strokeDasharray="3 3" opacity={0.95} />
          <PulseRing cx={cx} cy={cy} r={9} color={colors.amberLabel} run strokeWidth={1.2} />
        </>
      ) : null}
      {/* The documented state only MOUNTS once found — the hooks above always
          run, so the spring and the tween are already at their start values and
          the first committed frame is the hidden one. Fourteen markers × three
          idle animated nodes is not a bill this rack needs to pay. */}
      {found ? (
        <>
          <ACircle
            cx={cx}
            cy={cy}
            r={0.01}
            fill="none"
            stroke={colors.amber}
            strokeWidth={hot ? 2.4 : 1.8}
            animatedProps={ringProps}
          />
          {/* documented: an outline only — the evidence inside stays in plain
              view (a filled disc with a glyph hid exactly what was found) */}
          <AG opacity={0} animatedProps={glyphProps}>
            <Circle cx={cx} cy={cy} r={R + 2.2} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={1} />
          </AG>
          <APath
            d={`M${cx + 8} ${cy - 9} l3 3.4 l5.5 -7`}
            stroke={colors.green}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0}
            strokeDasharray={13}
            strokeDashoffset={13}
            animatedProps={tickProps}
          />
        </>
      ) : null}
    </G>
  );
}

function DefectMarkers({ found, lastFound, pulse }: { found: ReadonlySet<string>; lastFound: string | null; pulse: boolean }) {
  return (
    <>
      {CI_RACK_ISSUES.map((i, idx) => (
        <DefectMarker key={i.id} id={i.id} index={idx} found={found.has(i.id)} hot={lastFound === i.id} pulse={pulse} />
      ))}
    </>
  );
}

type CSel = { jack: number; ok: boolean } | null;

/**
 * `enter` plays the Phase-A intro (assemble → the mess draws in); `install`
 * plays the Phase-B loom install. Both default OFF for secondary racks (the
 * Phase-C BEFORE strip), which must be complete on their first paint and must
 * never add animating nodes to a screen that already has a beam running.
 * Gradient ids are per root (useUid → RackPaints), so the two <Svg> roots on
 * screen at once cannot collide.
 */
function RackSvg({
  w,
  mode,
  enter = false,
  install = false,
  found,
  lastFound,
  pulse = false,
  assigns,
  wrongIds,
  flowOn = false,
  cSel,
  wrongGen = 0,
}: {
  w: number;
  mode: 'bad' | 'dress';
  enter?: boolean;
  install?: boolean;
  found?: ReadonlySet<string>;
  lastFound?: string | null;
  pulse?: boolean;
  assigns?: Record<string, string>;
  wrongIds?: readonly string[] | null;
  flowOn?: boolean;
  cSel?: CSel;
  wrongGen?: number;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const dress = mode === 'dress';
  const uid = useUid();
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <RackPaints uid={uid}>
      <Chassis dress={dress} enter={enter} />
      {dress ? (
        <Looms assigns={assigns ?? {}} wrongIds={wrongIds} dim={!!cSel?.ok} install={install} flowOn={flowOn} />
      ) : (
        <BadCables enter={enter} found={found} />
      )}
      {!dress && found ? <DefectMarkers found={found} lastFound={lastFound ?? null} pulse={pulse} /> : null}
      {/* mounted for the whole of Phase C (cSel is passed, possibly null) so the
          veil and the beam have somewhere to animate FROM on the first trace */}
      {cSel !== undefined ? <TraceBeam run={!!cSel?.ok} /> : null}
      {cSel && !cSel.ok ? <WrongJack jack={cSel.jack} gen={wrongGen} /> : null}
      </RackPaints>
    </Svg>
  );
}

/* ═══════════════════════════ phase D + close data ═════════════════════════ */

const D_OPTIONS: { title: string; body: string; verdict: string; ok: boolean }[] = [
  {
    title: 'STRIP THE RACK',
    body: 'Unplug every cable in the rack so nothing is in the way, swap the switch, reconnect everything from memory.',
    verdict: 'Every system in the rack just went down for one device — and reconnecting from memory is where mystery faults are born. The dressing made this unnecessary.',
    ok: false,
  },
  {
    title: 'CUT THE DRESSING',
    body: 'Cut every tie and strap so the looms fall free, dig the switch out, tidy it all up later.',
    verdict: 'One swap just destroyed the whole rack’s dressing — hours of rework, and every disturbed connection becomes a new suspect. Restraints come off selectively, never wholesale.',
    ok: false,
  },
  {
    title: 'USE THE DRESSING',
    body: 'Identify the switch’s own cables by their labels, unplug only those, take up their service slack from the managers, slide the switch out.',
    verdict: 'Labels identify its cables, the managers keep every other loom in place, and the intentional slack lets this one unit move. Unrelated equipment never notices.',
    ok: true,
  },
  {
    title: 'FORCE IT',
    body: 'Leave everything connected and muscle the switch out past the dressed looms — cable flexes, it will be fine.',
    verdict: 'Cable does not stretch — terminations and connectors tear, invisibly. Forcing gear past the dressing damages the exact cables that still work.',
    ok: false,
  },
];
const D_CORRECT = 2;

const PRINCIPLES: { text: string; ruleId?: string }[] = [
  { text: 'Strain is relieved before it reaches any termination', ruleId: 'mech-strain-relief' },
  { text: 'Connectors carry signal — never cable weight' },
  { text: 'Any one cable or device comes out without disturbing its neighbors' },
  { text: 'Power and signal routes follow the project’s plan' },
  { text: 'Airflow beats aesthetics — intakes and exhausts stay clear', ruleId: 'rack-airflow' },
  { text: 'Labels are readable where the technician actually stands' },
  { text: 'Excess is intentional slack in managers — never a stuffed drum', ruleId: 'rack-excess' },
  { text: 'Dressing is not maximum tightness — real cable needs natural bends', ruleId: 'rack-not-max-tight' },
];

type Phase = 'a' | 'b' | 'c' | 'd';

const PHASES: { id: Phase; tag: string; name: string }[] = [
  { id: 'a', tag: 'A', name: 'INSPECT' },
  { id: 'b', tag: 'B', name: 'DRESS' },
  { id: 'c', tag: 'C', name: 'SERVICE' },
  { id: 'd', tag: 'D', name: 'MAINTAIN' },
];

const zoneById = (id: string) => CI_RACK_ZONES.find((z) => z.id === id);
const ZONE_SHORT: Record<string, string> = { 'z-left': 'LEFT MGR', 'z-right': 'RIGHT MGR', 'z-entry': 'ENTRY', 'z-hmgr': 'HORIZ MGR' };

/** The counter ticks to its value. Isolated in its own leaf so the count-up's
 *  per-frame re-render can never reach the (large) rack SVG. Because useCountUp
 *  animates FROM the last shown value, a +1 find passes through at most two
 *  integers — the polite live region gets a tick, not a flood. */
function FoundCounter({ found, required, total }: { found: number; required: number; total: number }) {
  const shown = useCountUp(found, CI_MOTION.reveal);
  return <FindProgress found={shown} required={required} total={total} />;
}

/** A phase chip that animates its own state change: the active wash fades in,
 *  and a newly completed phase ticks in on a spring. */
function PhaseChip({
  tag,
  name,
  active,
  done,
  open,
  onPress,
}: {
  tag: string;
  name: string;
  active: boolean;
  done: boolean;
  open: boolean;
  onPress: () => void;
}) {
  const glow = useTween(active ? 1 : 0, CI_MOTION.quick);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const pop = usePop(done || active, 0.9);
  return (
    <Pressable
      style={[styles.phaseChip, done && styles.phaseChipDone, active && styles.phaseChipActive, !open && styles.phaseChipLocked]}
      disabled={!open}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !open }}
      aria-pressed={active}
      aria-disabled={!open}
      accessibilityLabel={`Phase ${tag}: ${name}${done ? ', complete' : open ? '' : ', locked'}`}
    >
      <Animated.View pointerEvents="none" style={[styles.phaseChipWash, glowStyle]} />
      <Animated.View style={[styles.phaseChipInner, pop]}>
        <Text style={[styles.phaseChipTag, done && { color: colors.green }, active && !done && { color: colors.amber }]}>
          {done ? '✓' : tag}
        </Text>
        <Text style={[styles.phaseChipName, active && { color: colors.textPrimary }]}>{name}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** A Phase-D approach. The approved one SETTLES on the kit's UI spring — the
 *  only card in the set that is given any mass. */
function ApproachCard({
  title,
  body,
  picked,
  ok,
  disabled,
  onPress,
}: {
  title: string;
  body: string;
  picked: boolean;
  ok: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const settle = usePop(picked && ok, 0.965);
  return (
    <Animated.View style={settle}>
      <Pressable
        style={[styles.optCard, picked && (ok ? styles.optCardRight : styles.optCardWrong)]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: picked, disabled }}
        aria-pressed={picked}
        aria-disabled={disabled}
        accessibilityLabel={`${title}. ${body}`}
      >
        <Text style={[styles.optTitle, picked && { color: ok ? colors.green : '#ff9b8f' }]}>
          {picked ? (ok ? '✓ ' : '✕ ') : ''}
          {title}
        </Text>
        <Text style={styles.optBody}>{body}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ═══════════════════════════════ the scene ════════════════════════════════ */

export function RackScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [phase, setPhase] = useState<Phase>('a');
  const [aDone, setADone] = useState(completed);
  const [bDone, setBDone] = useState(completed);
  const [cDone, setCDone] = useState(completed);
  const [dDone, setDDone] = useState(completed);
  const [fired, setFired] = useState(completed);

  /* Phase A */
  const [found, setFound] = useState<Set<string>>(new Set());
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [missNote, setMissNote] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const missTaps = useRef(0);

  /* Phase B */
  const [assigns, setAssigns] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const wrongAssignTotal = useRef(0);

  /* Phase C */
  const [cSel, setCSel] = useState<CSel>(null);
  const [replaced, setReplaced] = useState(false);
  const wrongJacks = useRef(0);
  /** Bumped on every wrong jack so tapping the SAME wrong jack twice re-pulses. */
  const [wrongGen, setWrongGen] = useState(0);

  /* Phase D */
  const [dPick, setDPick] = useState<number | null>(null);
  const wrongPicks = useRef(0);

  /* ── motion state ──────────────────────────────────────────────────────
   * `intro` drives the Phase-A entrance (assemble → the mess draws itself in)
   * and is dropped once it has landed, so switching phases later never
   * replays it. `hotspots` holds the undocumented-defect breathing back until
   * the mess has arrived — the learner's first read is the rack, not markers.
   * Nothing here gates interaction: every tap target is live from frame one. */
  const m = useCiMotion();
  const [intro, setIntro] = useState(true);
  const [hotspots, setHotspots] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setHotspots(true), m.d(HOTSPOT_AT));
    const b = setTimeout(() => setIntro(false), m.d(INTRO_END));
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [m]);

  const scale = width / VB_W;
  const svgH = Math.round((width * VB_H) / VB_W);

  const planAssigns = useMemo(() => {
    const m: Record<string, string> = {};
    for (const g of CI_RACK_GROUPS) m[g.id] = g.zoneId;
    return m;
  }, []);

  /* ── honest completion scoring ── */
  const computeDims = (): CiDimScores => {
    const clampTo = (v: number, lo: number) => Math.max(lo, Math.min(100, Math.round(v)));
    return {
      serviceability: clampTo(100 - wrongJacks.current * 8 - wrongPicks.current * 15, 40),
      signal: clampTo(100 - wrongAssignTotal.current * 12, 40),
      protection: clampTo((found.size / CI_RACK_ISSUES.length) * 100 - missTaps.current * 2, 45),
      workmanship: clampTo(100 - missTaps.current * 3 - wrongAssignTotal.current * 5 - wrongPicks.current * 5, 40),
    };
  };

  /* ── Phase A handlers ── */
  const findIssue = (id: string) => {
    setMissNote(false);
    setLastFound(id);
    if (found.has(id)) return;
    const issue = CI_RACK_ISSUES.find((i) => i.id === id);
    if (!issue) return;
    const nx = new Set(found);
    nx.add(id);
    setFound(nx);
    AccessibilityInfo.announceForAccessibility(`Found ${nx.size} of ${CI_RACK_ISSUES.length}: ${issue.label}.`);
    if (nx.size >= REQUIRED_FINDS && !aDone) {
      setADone(true);
      announceComplete('Phase A complete — the rack is condemned. Dressing unlocked.');
    }
  };
  const onMissTap = () => {
    missTaps.current += 1;
    setLastFound(null);
    setMissNote(true);
  };

  /* ── Phase B handlers ── */
  const assignZone = (zoneId: string) => {
    if (!activeGroup) return;
    const gDef = CI_RACK_GROUPS.find((g) => g.id === activeGroup);
    if (!gDef) return;
    if (zoneId !== gDef.zoneId) wrongAssignTotal.current += 1;
    const nx = { ...assigns, [activeGroup]: zoneId };
    setAssigns(nx);
    setActiveGroup(null);
    if (CI_RACK_GROUPS.every((g) => nx[g.id])) {
      const wrong = CI_RACK_GROUPS.filter((g) => nx[g.id] !== g.zoneId);
      if (wrong.length === 0) {
        if (!bDone) {
          setBDone(true);
          announceComplete('Phase B complete — the rack is dressed to the plan.');
        } else {
          AccessibilityInfo.announceForAccessibility('Plan satisfied.');
        }
      } else {
        AccessibilityInfo.announceForAccessibility(
          `${wrong.length} ${wrong.length === 1 ? 'group is' : 'groups are'} off the plan — reassign until it matches.`,
        );
      }
    }
  };
  const allAssigned = CI_RACK_GROUPS.every((g) => assigns[g.id]);
  const wrongB = allAssigned ? CI_RACK_GROUPS.filter((g) => assigns[g.id] !== g.zoneId).map((g) => g.id) : null;

  /** The moment the plan is revealed, the looms that match it run a few
   *  marching cycles — signal just came alive — then go quiet again. Gated on
   *  the reveal so it can never leak which single assignment was correct. */
  const [flowOn, setFlowOn] = useState(false);
  useEffect(() => {
    if (!allAssigned || !m.loops) {
      setFlowOn(false);
      return;
    }
    setFlowOn(true);
    const id = setTimeout(() => setFlowOn(false), FLOW_MS);
    return () => clearTimeout(id);
  }, [allAssigned, assigns, m.loops]);

  const wrongZoneNote = (gId: string): string => {
    const g = CI_RACK_GROUPS.find((x) => x.id === gId);
    if (!g) return '';
    const z = assigns[g.id];
    if (z === 'z-entry') return `${g.name}: every loom passes the entry — its dressing home is a vertical manager.`;
    if (z === 'z-hmgr') return `${g.name}: the horizontal manager organizes the patch-field row, not trunk groups.`;
    return `${g.name}: this project’s plan dresses it down the ${g.zoneId === 'z-left' ? 'LEFT (signal-class)' : 'RIGHT (power / high-current)'} manager.`;
  };

  /* ── Phase C handlers ── */
  const pickJack = (n: number) => {
    // Solved is solved (bug hunt 2026-09-29): once input 7 is traced, a stray
    // tap on another jack used to count a wrong jack and drop the answer.
    if (replaced || cSel?.ok) return;
    if (n === 7) {
      setCSel({ jack: 7, ok: true });
      AccessibilityInfo.announceForAccessibility('Input 7 selected. One cable highlights end to end: labeled A-007 at DSP input 7, along the analog harness, up the left manager, labeled A-007 again where it enters the rack. Everything else dims.');
    } else {
      wrongJacks.current += 1;
      setWrongGen((g) => g + 1);
      setCSel({ jack: n, ok: false });
    }
  };
  const confirmReplace = () => {
    if (replaced) return;
    setReplaced(true);
    if (!cDone) {
      setCDone(true);
      announceComplete('Phase C complete — a thirty-second swap with zero collateral.');
    }
  };

  /* ── Phase D handlers ── */
  const dSolved = dPick != null && D_OPTIONS[dPick].ok;
  const pickApproach = (i: number) => {
    if (dSolved) return;
    setDPick(i);
    if (!D_OPTIONS[i].ok) {
      wrongPicks.current += 1;
      return;
    }
    if (!dDone) {
      setDDone(true);
      announceComplete('Stage 6 complete.');
      if (!fired) {
        setFired(true);
        onComplete(computeDims());
      }
    }
  };

  const phaseDone: Record<Phase, boolean> = { a: aDone, b: bDone, c: cDone, d: dDone };
  /* A completed stage revisited starts with no findings (they are not kept),
     so the counter read 0 / N beside the phase's ✓ chip (bug hunt
     2026-09-29). Say it passed until the learner starts a new walk. */
  const aCounter =
    completed && found.size === 0 ? (
      <Text style={styles.lead}>✓ Phase A passed on an earlier visit — tap the markers to inspect again.</Text>
    ) : (
      <FoundCounter found={found.size} required={REQUIRED_FINDS} total={CI_RACK_ISSUES.length} />
    );
  const phaseOpen: Record<Phase, boolean> = { a: true, b: aDone, c: bDone, d: cDone };

  const lastIssue = lastFound ? (CI_RACK_ISSUES.find((i) => i.id === lastFound) ?? null) : null;
  const lastMistake = lastIssue ? (mistakeById(lastIssue.mistakeId) ?? null) : null;
  const activeGroupDef = activeGroup ? (CI_RACK_GROUPS.find((g) => g.id === activeGroup) ?? null) : null;
  const beforeW = Math.max(96, Math.min(130, Math.round(width * 0.34)));
  const cControls = (
          <View style={styles.jackRow}>
            {DSP_JACK_XS.map((_, i) => {
              const n = i + 1;
              const sel = cSel?.jack === n;
              return (
                <Stagger key={n} index={i} from={6}>
                  <Pressable
                    style={[styles.jackBtn, sel && (cSel?.ok ? styles.jackBtnRight : styles.jackBtnWrong)]}
                    onPress={() => pickJack(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    aria-pressed={sel}
                    accessibilityLabel={`DSP input ${n}`}
                  >
                    <Text style={[styles.jackBtnText, sel && { color: colors.textPrimary }]}>{n}</Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
  );
  const bControls = (
    <>
          <View style={styles.chipWrap}>
            {CI_RACK_GROUPS.map((g, gi) => {
              const tint = CI_CLASS_TINTS[g.tintKey];
              const zone = assigns[g.id];
              const active = activeGroup === g.id;
              const verdict = wrongB == null ? null : wrongB.includes(g.id) ? 'bad' : 'good';
              return (
                <Stagger key={g.id} index={gi} from={6}>
                  <Pressable
                    style={[styles.groupChip, active && styles.groupChipActive]}
                    onPress={() => setActiveGroup(active ? null : g.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    aria-pressed={active}
                    accessibilityLabel={`${g.name}${zone ? `, dressed to ${zoneById(zone)?.name ?? zone}` : ', not yet assigned'}${
                      verdict ? (verdict === 'good' ? ', matches the plan' : ', off the plan') : ''
                    }`}
                  >
                    <View style={[styles.groupDot, { backgroundColor: tint }]} />
                    <Text style={styles.groupName}>{g.name.toUpperCase()}</Text>
                    <Text
                      style={[
                        styles.groupZone,
                        verdict === 'bad' && { color: '#ff9b8f' },
                        verdict === 'good' && { color: colors.green },
                      ]}
                    >
                      {verdict === 'good' ? '✓ ' : verdict === 'bad' ? '✕ ' : ''}
                      {zone ? ZONE_SHORT[zone] : '—'}
                    </Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
          {activeGroupDef ? (
            <Appear key={activeGroupDef.id} style={styles.zoneCard}>
              <Text style={styles.zoneHead}>DRESS {activeGroupDef.name.toUpperCase()} INTO…</Text>
              {CI_RACK_ZONES.map((z, zi) => (
                <Stagger key={z.id} index={zi} from={6}>
                  <Pressable
                    style={styles.zoneBtn}
                    onPress={() => assignZone(z.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${z.name}. ${z.note}`}
                  >
                    <Text style={styles.zoneBtnName}>{z.name.toUpperCase()}</Text>
                    <Text style={styles.zoneBtnNote}>{z.note}</Text>
                  </Pressable>
                </Stagger>
              ))}
            </Appear>
          ) : null}
    </>
  );

  return (
    <View style={{ gap: 14 }}>
      {/* ── phase chips ── */}
      <View style={styles.phaseRow}>
        {PHASES.map((p) => (
          <PhaseChip
            key={p.id}
            tag={p.tag}
            name={p.name}
            active={phase === p.id}
            done={phaseDone[p.id]}
            open={phaseOpen[p.id]}
            onPress={() => setPhase(p.id)}
          />
        ))}
      </View>
      <Text style={styles.tintNote}>
        {`Training visualization — the cable-class colors are a teaching language only; field cable colors vary (${CI_CLASS_KEY}). The switch is reverse-racked and the patch panel is mounted jacks-to-rear, so every port faces the rear with the rest of the cabling: the horizontals land on the panel’s punch-downs, and short patch cords join the panel to the switch. The 3U amp sits lowest, on the PDU, with rear supports.`}
      </Text>

      {/* ═══════════ PHASE A — inspect the bad rack ═══════════ */}
      {phase === 'a' ? (
        <CiSection title="PHASE A — INSPECT: CONDEMN THIS RACK">
          <Text style={styles.lead}>
            {'A contractor calls this rack "finished." Rear view. Document at least '}
            {REQUIRED_FINDS}
            {' problems before you sign anything — amber rings mark places to inspect: tap what’s wrong, or open the suspect list and inspect location by location.'}
          </Text>
          <ExpandableFigure
            width={width}
            aspect={VB_W / VB_H}
            title="RACK"
            badge="Tap what is wrong — every marker works at every zoom."
            render={(fw) => (
              <View style={{ width: fw, height: Math.round((fw * VB_H) / VB_W) }}>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel="Rear view of a badly dressed equipment rack: a 1U patch panel between two horizontal managers, network switch, DSP, audio interface, amplifier, power distribution, and vertical cable managers on both sides. Cabling is tangled, taut, unlabeled and blocking vents."
                >
                  <RackSvg
                    w={fw}
                    mode="bad"
                    enter={intro}
                    found={found}
                    lastFound={lastFound}
                    /* every remaining loop stops the moment the inspection is
                       satisfied — an ambient loop with nothing left to say is
                       exactly the tell we are removing from this scene */
                    pulse={hotspots && found.size < REQUIRED_FINDS}
                  />
                </View>
                <Pressable
                  accessible={false}
                  importantForAccessibility="no"
                  onPress={onMissTap}
                  style={{ position: 'absolute', left: 0, top: 0, width: fw, height: Math.round((fw * VB_H) / VB_W) }}
                />
                {CI_RACK_ISSUES.map((iss) => {
                  const hit = HIT[iss.id];
                  const sc = fw / VB_W;
                  const rw = Math.max(44, hit.w * sc);
                  const rh = Math.max(44, hit.h * sc);
                  const left = (hit.x + hit.w / 2) * sc - rw / 2;
                  const top = (hit.y + hit.h / 2) * sc - rh / 2;
                  const isFound = found.has(iss.id);
                  return (
                    <Pressable
                      key={iss.id}
                      onPress={() => findIssue(iss.id)}
                      style={{ position: 'absolute', left, top, width: rw, height: rh }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: lastFound === iss.id }}
                      aria-pressed={lastFound === iss.id}
                      accessibilityLabel={`${hit.where}${isFound ? `. Flagged: ${iss.label}` : ''}`}
                    />
                  );
                })}
              </View>
            )}
            controls={aCounter}
          />
          {aCounter}
          <OptionChip
            label={listOpen ? '▾ SUSPECT LIST' : '▸ SUSPECT LIST'}
            active={listOpen}
            onPress={() => setListOpen((o) => !o)}
            action
          />
          {listOpen ? (
            <View style={{ gap: 6 }}>
              {CI_RACK_ISSUES.map((iss, si) => {
                const isFound = found.has(iss.id);
                return (
                  <Stagger key={iss.id} index={si}>
                    <Pressable
                      style={[styles.suspectBtn, isFound && styles.suspectBtnFound]}
                      onPress={() => findIssue(iss.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${HIT[iss.id].where}${isFound ? `. Flagged: ${iss.label}` : ', not inspected yet'}`}
                    >
                      <Text style={[styles.suspectWhere, isFound && { color: colors.green }]}>
                        {isFound ? '✓  ' : '·  '}
                        {HIT[iss.id].where}
                      </Text>
                      {isFound ? <Text style={styles.suspectWhat}>{iss.label}</Text> : null}
                    </Pressable>
                  </Stagger>
                );
              })}
            </View>
          ) : null}
          {missNote ? (
            <Appear>
              <Text style={styles.missNote}>
                {'Nothing documented right there — inspect where cable meets gear: jacks, rails, vents, entries and label points.'}
              </Text>
            </Appear>
          ) : null}
          {lastIssue && lastMistake ? (
            <Appear key={lastIssue.id} style={{ gap: 6 }}>
              <Text style={styles.foundLabel}>⚑ {lastIssue.label}</Text>
              <RuleFeedback ruleId={lastMistake.ruleId} verdict="bad" short={lastMistake.shortFeedback} openSources={openSources} />
              <Text style={styles.fixLine}>FIX  {lastMistake.correction}</Text>
            </Appear>
          ) : null}
          {aDone ? (
            <Appear delay={CI_MOTION.quick}>
              <Pressable
                style={styles.phaseNextBtn}
                onPress={() => setPhase('b')}
                accessibilityRole="button"
                accessibilityLabel="Continue to phase B, dress the rack"
              >
                <Text style={styles.phaseNextText}>RACK CONDEMNED — NOW DRESS IT RIGHT ›</Text>
              </Pressable>
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE B — dress the rack ═══════════ */}
      {phase === 'b' ? (
        <CiSection title="PHASE B — DRESS: ROUTE EVERY GROUP TO THE PLAN">
          <SpecCard text={CI_RACK_PLAN_NOTE} />
          <ExpandableFigure
            width={width}
            aspect={VB_W / VB_H}
            title="RACK"
            render={(fw) => (
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Rear view of the emptied rack. ${
                  Object.keys(assigns).length === 0
                    ? 'No cable groups dressed yet.'
                    : CI_RACK_GROUPS.filter((g) => assigns[g.id])
                        .map((g) => `${g.name} dressed to ${zoneById(assigns[g.id])?.name ?? assigns[g.id]}`)
                        .join('; ') + '.'
                }`}
              >
                <RackSvg w={fw} mode="dress" install assigns={assigns} wrongIds={wrongB} flowOn={flowOn} />
              </View>
            )}
            controls={bControls}
          />
          <Text style={styles.lead}>
            {'Six cable groups arrive at the top entry. Pick a group, then pick where it dresses. Looms draw as you assign — reassign freely until the plan is satisfied.'}
          </Text>
          {bControls}
          {wrongB != null ? (
            wrongB.length === 0 ? (
              <Appear delay={CI_MOTION.quick}>
                <RuleFeedback
                  ruleId="rack-power-signal-plan"
                  verdict="good"
                  short="Plan satisfied — every class has a deliberate, separated route down a manager. This rack can be serviced."
                  openSources={openSources}
                />
              </Appear>
            ) : (
              <Appear style={{ gap: 8 }}>
                {wrongB.map((id) => (
                  <Text key={id} style={styles.wrongNote}>
                    ✕ {wrongZoneNote(id)}
                  </Text>
                ))}
                <RuleFeedback
                  ruleId="rack-power-signal-plan"
                  verdict="bad"
                  short={`${wrongB.length} group${wrongB.length === 1 ? '' : 's'} off the plan — tap the flagged group and reassign it.`}
                  openSources={openSources}
                />
              </Appear>
            )
          ) : null}
          {bDone ? (
            <Appear delay={CI_MOTION.base}>
              <Pressable
                style={styles.phaseNextBtn}
                onPress={() => setPhase('c')}
                accessibilityRole="button"
                accessibilityLabel="Continue to phase C, the serviceability test"
              >
                <Text style={styles.phaseNextText}>DRESSED TO PLAN — RUN THE SERVICE CALL ›</Text>
              </Pressable>
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE C — serviceability test ═══════════ */}
      {phase === 'c' ? (
        <CiSection title="PHASE C — SERVICE: THE 30-SECOND SWAP">
          <SpecCard text="WORK ORDER — DSP INPUT 7 reads dead at the console. Identify that one cable end-to-end and replace it. Nothing else may be disturbed: the system is live." />
          <ExpandableFigure
            width={width}
            aspect={VB_W / VB_H}
            title="RACK"
            render={(fw) => (
              <View style={{ width: fw, height: Math.round((fw * VB_H) / VB_W) }}>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={
                    cSel?.ok
                      ? 'Dressed rack in trace mode: one cable highlighted from its A-007 label at the rack entry, down the left manager and along the analog harness, to its A-007 label at DSP input 7; every other loom dimmed.'
                      : 'Rear view of the dressed rack. The DSP row has eight numbered inputs.'
                  }
                >
                  <RackSvg w={fw} mode="dress" assigns={planAssigns} cSel={cSel} wrongGen={wrongGen} />
                </View>
                {DSP_JACK_XS.map((cx, i) => (
                  <Pressable
                    key={cx}
                    accessible={false}
                    importantForAccessibility="no"
                    onPress={() => pickJack(i + 1)}
                    hitSlop={3}
                    style={{ position: 'absolute', left: (cx - 12) * (fw / VB_W), top: (DSP.jackY - 16) * (fw / VB_W), width: 24 * (fw / VB_W), height: 36 * (fw / VB_W) }}
                  />
                ))}
              </View>
            )}
            controls={cControls}
          />
          <Text style={styles.lead}>{'Tap DSP INPUT 7 on the rack — or use the input list.'}</Text>
          {cControls}
          {cSel && !cSel.ok ? (
            <Appear key={`wrong-${wrongGen}`}>
              <VerdictBanner
                verdict="wrong"
                text={`That’s INPUT ${cSel.jack} — it works. The work order says INPUT 7; the numbering just stopped you from pulling a live line.`}
              />
            </Appear>
          ) : null}
          {cSel?.ok ? (
            <View style={{ gap: 8 }}>
              {/* the card lands WITH the beam, not before it — and not so late
                  that the learner is left waiting on an animation to finish */}
              <Appear delay={TRACE_DELAY + TRACE_DUR * 0.45}>
                <View style={styles.traceCard}>
                  <Text style={styles.traceHead}>TRACED — ONE CABLE, END TO END</Text>
                  <Text style={styles.traceBody}>
                    {'A-007 where the line enters the rack → the left manager → the analog harness → A-007 again at DSP INPUT 7 (and at the stage-box end). Everything else stays exactly where the plan put it.'}
                  </Text>
                </View>
              </Appear>
              {!replaced ? (
                <Appear delay={TRACE_DELAY + TRACE_DUR * 0.62}>
                  <Pressable
                    style={styles.phaseNextBtn}
                    onPress={confirmReplace}
                    accessibilityRole="button"
                    accessibilityLabel="Replace this cable"
                  >
                    <Text style={styles.phaseNextText}>REPLACE THIS CABLE ✓</Text>
                  </Pressable>
                </Appear>
              ) : (
                <View style={{ gap: 10 }}>
                  <Appear>
                    <VerdictBanner
                      verdict="correct"
                      text="Cable identified, slack taken from the manager, replaced, records updated. Elapsed: about thirty seconds — with the rest of the system live."
                    />
                  </Appear>
                  <Appear delay={CI_MOTION.quick}>
                    <RuleFeedback
                      ruleId="label-both-ends"
                      verdict="good"
                      short="Labels at both ends plus a planned path made the trace instant — identification is what the dressing bought you."
                      openSources={openSources}
                    />
                  </Appear>
                  {/* the BEFORE rack cross-fades in underneath as the contrast
                      lands; it renders STATIC — no second animating rack */}
                  <Appear delay={CI_MOTION.base} style={styles.beforeRow}>
                    <RackSvg w={beforeW} mode="bad" />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.beforeHead}>THE SAME JOB, BEFORE</Text>
                      <Text style={styles.beforeBody}>
                        {'Unlabeled identical cables, classes interleaved, zero slack: you’d be tugging lines and guessing — on a live system. The dressing IS what made this thirty seconds.'}
                      </Text>
                    </View>
                  </Appear>
                  {cDone ? (
                    <Appear delay={CI_MOTION.reveal}>
                      <Pressable
                        style={styles.phaseNextBtn}
                        onPress={() => setPhase('d')}
                        accessibilityRole="button"
                        accessibilityLabel="Continue to phase D, the maintenance test"
                      >
                        <Text style={styles.phaseNextText}>ONE MORE TEST — SWAP THE SWITCH ›</Text>
                      </Pressable>
                    </Appear>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE D — maintenance test ═══════════ */}
      {phase === 'd' ? (
        <CiSection title="PHASE D — MAINTAIN: SWAP THE SWITCH">
          <SpecCard text="WORK ORDER — the network switch is being replaced with an identical unit tonight. Unrelated equipment must stay connected and running throughout." />
          <Text style={styles.lead}>{'Four crews, four approaches. Approve the one that respects the installation.'}</Text>
          <View style={{ gap: 10 }}>
            {D_OPTIONS.map((o, i) => (
              <Stagger key={o.title} index={i}>
                <ApproachCard
                  title={o.title}
                  body={o.body}
                  picked={dPick === i}
                  ok={o.ok}
                  disabled={dSolved}
                  onPress={() => pickApproach(i)}
                />
              </Stagger>
            ))}
          </View>
          {dPick != null ? (
            <Appear key={`d-${dPick}`} style={{ gap: 8 }}>
              <VerdictBanner verdict={D_OPTIONS[dPick].ok ? 'correct' : 'wrong'} text={D_OPTIONS[dPick].verdict} />
              {D_OPTIONS[dPick].ok ? (
                <RuleFeedback
                  ruleId="rack-service-access"
                  verdict="good"
                  short="Dress for the service call: labels identify, managers hold, intentional slack moves — one device out, nothing else touched."
                  openSources={openSources}
                />
              ) : null}
            </Appear>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ close: principles + completion ═══════════ */}
      {dDone ? (
        <View style={{ gap: 10 }}>
          <Appear>
            <View style={styles.doneBanner}>
              <Text style={styles.doneText}>✓ STAGE COMPLETE — CONDEMNED IT, DRESSED IT, PROVED IT.</Text>
            </View>
          </Appear>
          <Appear delay={CI_MOTION.quick}>
            <View style={styles.prinCard}>
              <Text style={styles.prinHead}>WHAT A DRESSED RACK HOLDS TRUE</Text>
              {PRINCIPLES.map((p, pi) => {
                const rule = p.ruleId ? ruleFor(p.ruleId) : null;
                return (
                  <Stagger key={p.text} index={pi} from={6}>
                    <View style={styles.prinRow}>
                      <Text style={styles.prinBullet}>▪</Text>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.prinText}>{p.text}</Text>
                        {rule ? (
                          <AuthorityBadge
                            authority={rule.authorityClass}
                            jurisdiction={rule.jurisdiction}
                            onPress={() => openSources(rule.sourceRefs)}
                          />
                        ) : null}
                      </View>
                    </View>
                  </Stagger>
                );
              })}
            </View>
          </Appear>
        </View>
      ) : null}
    </View>
  );
}

/* ═══════════════════════════════ styles ═══════════════════════════════════ */

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub, fontStyle: 'italic' },
  phaseRow: { flexDirection: 'row', gap: 6 },
  phaseChip: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  phaseChipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#17140c' },
  phaseChipDone: { borderColor: 'rgba(55,224,95,.4)' },
  phaseChipLocked: { opacity: 0.45 },
  /** the animated half of the active state — fades rather than snapping */
  phaseChipWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 9,
    backgroundColor: 'rgba(255,198,77,.10)',
  },
  phaseChipInner: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  phaseChipTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.5, color: colors.textSecondary },
  phaseChipName: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
  missNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, fontStyle: 'italic' },
  foundLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.6, color: colors.amberLabel },
  fixLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: colors.green },
  suspectBtn: {
    minHeight: 44,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  suspectBtnFound: { borderColor: 'rgba(55,224,95,.35)' },
  suspectWhere: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, color: colors.textSecondary },
  suspectWhat: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  phaseNextBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  phaseNextText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.green },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  groupChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  groupChipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#17140c' },
  groupDot: { width: 9, height: 9, borderRadius: 4.5 },
  groupName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textSecondary },
  groupZone: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub },
  zoneCard: {
    gap: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#131316',
    padding: 11,
  },
  zoneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: colors.amber },
  zoneBtn: {
    minHeight: 48,
    justifyContent: 'center',
    gap: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  zoneBtnName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.9, color: colors.textPrimary },
  zoneBtnNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  wrongNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: '#ff9b8f' },
  jackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  jackBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
  },
  jackBtnRight: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11' },
  jackBtnWrong: { borderColor: 'rgba(255,90,72,.7)', backgroundColor: '#1a0f0d' },
  jackBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSecondary },
  traceCard: {
    gap: 4,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: CI_CLASS_TINTS.analog,
    backgroundColor: '#0f1416',
    padding: 11,
  },
  traceHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: CI_CLASS_TINTS.analog },
  traceBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  beforeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#101014',
    padding: 10,
  },
  beforeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amberLabel },
  beforeBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary },
  optCard: {
    gap: 5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  optCardRight: { borderColor: 'rgba(55,224,95,.55)' },
  optCardWrong: { borderColor: 'rgba(255,90,72,.55)' },
  optTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  optBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  doneBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0c1a10',
    padding: 11,
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.green },
  prinCard: {
    gap: 10,
    borderRadius: 11,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: '#151310',
    padding: 12,
  },
  prinHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5, color: colors.amber },
  prinRow: { flexDirection: 'row', gap: 8 },
  prinBullet: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel, lineHeight: 18 },
  prinText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
});
