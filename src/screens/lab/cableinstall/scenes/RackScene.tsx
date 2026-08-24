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
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { AuthorityBadge, CiSection, FindProgress, RuleFeedback, SpecCard, announceComplete, ruleFor } from '../bits';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { mistakeById } from '../data/mistakes';
import { CI_RACK_GROUPS, CI_RACK_ISSUES, CI_RACK_PLAN_NOTE, CI_RACK_ZONES } from '../data/scenarios';
import type { CiDimScores } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ═══════════════════════ geometry (viewBox 340×420) ═══════════════════════ */

const VB_W = 340;
const VB_H = 420;
const REQUIRED_FINDS = 10;

/** Phase-A tap regions (disjoint; ≥46 viewBox units each way, and the render
 *  layer additionally expands every overlay to ≥44dp). `where` is the
 *  NEUTRAL location name used by overlays + the suspect list (no spoilers). */
const HIT: Record<string, { x: number; y: number; w: number; h: number; where: string }> = {
  'ri-9': { x: 118, y: 2, w: 120, h: 50, where: 'Top cable entry' },
  'ri-4': { x: 40, y: 54, w: 140, h: 46, where: 'Patch field — jack rows' },
  'ri-13': { x: 184, y: 54, w: 116, h: 46, where: 'Patch field — label strip' },
  'ri-8': { x: 0, y: 102, w: 52, h: 46, where: 'Left rail at the switch' },
  'ri-1': { x: 56, y: 102, w: 136, h: 46, where: 'Between patch field and switch' },
  'ri-12': { x: 0, y: 150, w: 100, h: 46, where: 'Left manager — interface lines' },
  'ri-2': { x: 196, y: 150, w: 118, h: 46, where: 'DSP rear — input jacks' },
  'ri-3': { x: 104, y: 158, w: 86, h: 48, where: 'Open bay — center of the rack' },
  'ri-11': { x: 0, y: 198, w: 100, h: 46, where: 'Left rail at the blank panel' },
  'ri-7': { x: 196, y: 198, w: 118, h: 46, where: 'Mid-rack bundle' },
  'ri-5': { x: 40, y: 250, w: 128, h: 64, where: 'Amplifier rear — connector field' },
  'ri-6': { x: 172, y: 250, w: 142, h: 64, where: 'Amplifier rear — vent grille' },
  'ri-10': { x: 40, y: 320, w: 128, h: 48, where: 'Power distro — inlet side' },
  'ri-14': { x: 172, y: 320, w: 142, h: 48, where: 'Below the power distro' },
};

const RAIL_HOLE_YS = [30, 52, 74, 96, 118, 140, 162, 184, 206, 228, 250, 272, 294, 316, 338, 360, 382];
const MANAGER_SLOT_YS = [50, 90, 130, 170, 210, 250, 290, 330, 370];
const PATCH_XS = [66, 84, 102, 120, 138, 156, 174, 192, 210, 228, 246, 264];
const HMGR_XS = [66, 82, 98, 114, 130, 146, 162, 178, 194, 210, 226, 242, 258, 274];
const SWITCH_XS = [62, 86, 110, 134, 158, 182, 206, 230];
const DSP_JACK_XS = [74, 102, 130, 158, 186, 214, 242, 270];
const IFACE_XS = [70, 92, 114, 136, 158, 180];
const AMP_VENT_XS = [180, 188, 196, 204, 212, 220, 228, 236, 244, 252, 260, 268];
const DISTRO_XS = [176, 195, 214, 233, 252];
const TIE_YS = [70, 128, 186, 244, 302, 348];

/** Where each group's loom enters at the top slot (per group index). */
const ENTRY_XS = [156, 169, 182, 195, 208, 221];
/** Plausible terminating gear height per group. */
const DEST_Y: Record<string, number> = {
  'g-ac': 336,
  'g-analog': 164,
  'g-net': 120,
  'g-spk': 276,
  'g-ctl': 204,
  'g-fib': 131,
};

/** Honest loom paths — gentle bends, per-loom wobble, terminating at gear. */
function dLeft(ex: number, lane: number, ty: number, wob: number): string {
  return (
    `M${ex} 4 C${ex} 16 ${lane + 12} 16 ${lane + 4} 30 ` +
    `C${lane + (wob > 0 ? 1 : -1)} 38 ${lane} 48 ${lane} 60 ` +
    `L${lane} ${ty - 24} C${lane} ${ty - 10 + wob} ${lane + 6} ${ty} ${lane + 20} ${ty} L58 ${ty}`
  );
}
function dRight(ex: number, lane: number, ty: number, wob: number): string {
  return (
    `M${ex} 4 C${ex} 16 ${lane - 12} 16 ${lane - 4} 30 ` +
    `C${lane - (wob > 0 ? 1 : -1)} 38 ${lane} 48 ${lane} 60 ` +
    `L${lane} ${ty - 24} C${lane} ${ty - 10 + wob} ${lane - 6} ${ty} ${lane - 20} ${ty} L282 ${ty}`
  );
}

/** Phase-C trace: patch port A-07 → left manager → DSP INPUT 7. */
const TRACE_D =
  'M175 74 C158 84 30 78 22 96 C20 100 20 104 20 112 L20 138 ' +
  'C20 148 28 148 40 148 L226 148 C236 148 242 151 242 156';

/* ═══════════════════════════ SVG sub-layers ═══════════════════════════════ */

function Chassis({ dress }: { dress: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0d0d11" />
      {/* vertical cable managers, both sides */}
      <Rect x={6} y={20} width={34} height={386} rx={5} fill="#141419" stroke="#26262c" strokeWidth={1} />
      <Rect x={300} y={20} width={34} height={386} rx={5} fill="#141419" stroke="#26262c" strokeWidth={1} />
      {MANAGER_SLOT_YS.map((y) => (
        <G key={y}>
          <Line x1={6} y1={y} x2={14} y2={y} stroke="#26262c" strokeWidth={2} />
          <Line x1={32} y1={y} x2={40} y2={y} stroke="#26262c" strokeWidth={2} />
          <Line x1={300} y1={y} x2={308} y2={y} stroke="#26262c" strokeWidth={2} />
          <Line x1={326} y1={y} x2={334} y2={y} stroke="#26262c" strokeWidth={2} />
        </G>
      ))}
      {/* top panel + cable entry slot (dressed = finished grommet edge) */}
      <Rect x={44} y={6} width={252} height={14} rx={3} fill="#1a1a20" stroke="#2c2c33" strokeWidth={1} />
      <Rect x={150} y={9} width={80} height={8} rx={2.5} fill="#0a0a0e" />
      {dress ? <Rect x={149} y={8} width={82} height={10} rx={3.5} fill="none" stroke="#4a4a52" strokeWidth={1.4} /> : null}
      {/* rails + mounting holes */}
      <Rect x={44} y={20} width={10} height={382} fill="#20202a" />
      <Rect x={286} y={20} width={10} height={382} fill="#20202a" />
      {RAIL_HOLE_YS.map((y) => (
        <G key={y}>
          <Circle cx={49} cy={y} r={1.7} fill="#0d0d11" />
          <Circle cx={291} cy={y} r={1.7} fill="#0d0d11" />
        </G>
      ))}
      <Rect x={44} y={402} width={252} height={9} rx={3} fill="#1a1a20" stroke="#2c2c33" strokeWidth={1} />

      {/* ── patch panel (2U) ── */}
      <Rect x={54} y={46} width={232} height={40} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {PATCH_XS.map((cx) => (
        <G key={cx}>
          <Rect x={cx - 3.5} y={54} width={7} height={7} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
          <Rect x={cx - 3.5} y={66} width={7} height={7} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
        </G>
      ))}
      {dress
        ? PATCH_XS.map((cx) => (
            <Rect key={`lb${cx}`} x={cx - 5} y={78} width={10} height={5} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
          ))
        : null}

      {/* ── horizontal manager ── */}
      <Rect x={54} y={92} width={232} height={12} rx={2.5} fill="#1c1c22" stroke="#2c2c33" strokeWidth={1} />
      {HMGR_XS.map((x) => (
        <Line key={x} x1={x} y1={93} x2={x} y2={103} stroke="#101014" strokeWidth={3} />
      ))}

      {/* ── network switch ── */}
      <Rect x={54} y={110} width={232} height={28} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {SWITCH_XS.map((x, i) => (
        <G key={x}>
          <Rect x={x} y={119} width={11} height={9} rx={1} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />
          <Circle cx={x + 5.5} cy={115} r={1.4} fill={i % 3 === 0 ? '#37d97b' : '#26332a'} />
        </G>
      ))}
      <Rect x={262} y={117} width={16} height={12} rx={1.5} fill="#101014" stroke="#3a3c42" strokeWidth={0.8} />

      {/* ── DSP (numbered inputs only once the rack is dressed/labeled) ── */}
      <Rect x={54} y={144} width={232} height={40} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {DSP_JACK_XS.map((cx, i) => (
        <G key={cx}>
          <Circle cx={cx} cy={162} r={6} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
          <Circle cx={cx} cy={162} r={1.6} fill="#26262c" />
          {dress ? (
            <SvgText x={cx} y={180} fontSize={7} fill="#8a8a92" fontFamily={fonts.mono} textAnchor="middle">
              {String(i + 1)}
            </SvgText>
          ) : null}
        </G>
      ))}

      {/* ── audio interface ── */}
      <Rect x={54} y={190} width={232} height={28} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {IFACE_XS.map((cx) => (
        <Circle key={cx} cx={cx} cy={204} r={5} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
      ))}
      <Circle cx={244} cy={204} r={7} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
      <Circle cx={268} cy={204} r={7} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />

      {/* ── blank 1U ── */}
      <Rect x={54} y={224} width={232} height={16} rx={2.5} fill="#15151a" stroke="#26262c" strokeWidth={1} />
      <Circle cx={62} cy={232} r={2} fill="#26262c" />
      <Circle cx={278} cy={232} r={2} fill="#26262c" />

      {/* ── amplifier (connector field left · vent grille right) ── */}
      <Rect x={54} y={248} width={232} height={68} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      <Circle cx={78} cy={272} r={8.5} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
      <Line x1={78} y1={266} x2={78} y2={272} stroke="#3a3c42" strokeWidth={1.6} />
      <Circle cx={106} cy={272} r={8.5} fill="#101014" stroke="#3a3c42" strokeWidth={1.2} />
      <Line x1={106} y1={266} x2={106} y2={272} stroke="#3a3c42" strokeWidth={1.6} />
      <Rect x={130} y={264} width={20} height={15} rx={2} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
      {AMP_VENT_XS.map((x) => (
        <Line key={x} x1={x} y1={258} x2={x} y2={306} stroke="#101014" strokeWidth={3.5} />
      ))}
      {dress ? (
        <>
          <Rect x={70} y={288} width={16} height={6} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
          <Rect x={98} y={288} width={16} height={6} rx={1} fill="#2a2416" stroke="#6b5a24" strokeWidth={0.7} />
        </>
      ) : null}

      {/* ── power distro (inlets straight only when dressed) ── */}
      <Rect x={54} y={326} width={232} height={30} rx={3} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {DISTRO_XS.map((x) => (
        <Rect key={x} x={x} y={334} width={15} height={11} rx={1.5} fill="#101014" stroke="#3a3c42" strokeWidth={0.9} />
      ))}
      <Circle cx={273} cy={340} r={4} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
      {dress ? (
        <>
          <Rect x={64} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
          <Rect x={90} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
          <Rect x={116} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.1} />
        </>
      ) : null}

      {/* ── blank 2U ── */}
      <Rect x={54} y={362} width={232} height={24} rx={2.5} fill="#15151a" stroke="#26262c" strokeWidth={1} />
      <Circle cx={62} cy={374} r={2} fill="#26262c" />
      <Circle cx={278} cy={374} r={2} fill="#26262c" />
    </>
  );
}

/** Every visibly-wrong detail of the Phase-A rack (one vignette per issue,
 *  localized to its HIT region so the drawing stays readable, not spaghetti). */
function BadCables() {
  const P = CI_CLASS_TINTS.power;
  const A = CI_CLASS_TINTS.analog;
  const N = CI_CLASS_TINTS.network;
  const S = CI_CLASS_TINTS.speaker;
  const C = CI_CLASS_TINTS.control;
  const flag = '#ff9b8f';
  return (
    <>
      {/* faint background disorder (kept low so each defect stays readable) */}
      <Path d="M40 60 C120 140 60 240 150 330" stroke="#6f7378" strokeWidth={2} opacity={0.2} fill="none" />
      <Path d="M300 80 C230 180 300 260 210 366" stroke="#6f7378" strokeWidth={2} opacity={0.16} fill="none" />

      {/* ri-9 — trunk dives over the raw top edge (hard corners, no grommet) */}
      <Line x1={152} y1={17} x2={228} y2={17} stroke={flag} strokeWidth={1} opacity={0.7} />
      <Path d="M168 0 L168 16 L176 24 L176 46" stroke={A} strokeWidth={4} fill="none" />
      <Path d="M188 0 L188 15 L195 24 L195 50" stroke={N} strokeWidth={3.5} fill="none" />
      <Path d="M207 0 L207 17 L201 25 L201 44" stroke={P} strokeWidth={4} fill="none" />

      {/* ri-4 — the label strip is empty (dashed = where labels should be) */}
      <Rect x={60} y={78} width={112} height={9} rx={1.5} fill="none" stroke="#4a4a52" strokeWidth={1} strokeDasharray="4 3" />

      {/* ri-13 — the only two labels disagree (different marks, one crooked) */}
      <Rect x={206} y={77} width={17} height={10} rx={1.5} fill="#26262c" stroke="#8a8a92" strokeWidth={0.9} />
      <Line x1={209} y1={82} x2={220} y2={82} stroke={colors.amberLabel} strokeWidth={1.2} />
      <G transform="rotate(9 244 82)">
        <Rect x={236} y={77} width={17} height={10} rx={1.5} fill="#26262c" stroke="#8a8a92" strokeWidth={0.9} />
        <Line x1={239} y1={82} x2={246} y2={82} stroke={colors.amberLabel} strokeWidth={1.2} />
      </G>

      {/* ri-1 — power + mic looms twisted through each other */}
      <Path d="M56 96 C86 114 118 92 148 110 C166 120 178 100 190 106" stroke={P} strokeWidth={4} fill="none" />
      <Path d="M56 108 C86 92 118 114 148 94 C166 86 178 108 190 100" stroke={A} strokeWidth={3.5} fill="none" />
      <Path d="M56 102 C90 108 120 98 152 112" stroke={A} strokeWidth={2.5} opacity={0.8} fill="none" />

      {/* ri-8 — Cat6 folded 180° over the left rail edge */}
      <Path d="M74 116 L54 116 Q46 116 46 123 Q46 130 54 130 L74 130" stroke={N} strokeWidth={4} fill="none" />
      <Path d="M43 119 l-4 -3 M43 127 l-4 3" stroke={flag} strokeWidth={1.4} fill="none" />

      {/* ri-2 — XLR loom hanging its full weight on the DSP jacks */}
      <Path d="M214 166 C214 184 226 190 238 188" stroke={A} strokeWidth={3.5} fill="none" />
      <Path d="M242 166 C242 182 248 187 254 186" stroke={A} strokeWidth={3.5} fill="none" />
      <Path d="M270 166 C270 180 268 186 262 186" stroke={A} strokeWidth={3.5} fill="none" />
      <Path d="M238 188 C252 192 268 190 282 178 L296 172" stroke={A} strokeWidth={5} fill="none" />
      <Path d="M210 170 q4 4 8 0 M238 170 q4 4 8 0 M266 170 q4 4 8 0" stroke={flag} strokeWidth={1.2} fill="none" />

      {/* ri-12 — interface lines bowstring-tight (dead straight, twang marks) */}
      <Line x1={24} y1={130} x2={60} y2={196} stroke={C} strokeWidth={2.5} />
      <Line x1={30} y1={132} x2={66} y2={198} stroke={A} strokeWidth={2.5} />
      <Line x1={40} y1={161} x2={47} y2={157} stroke={flag} strokeWidth={1.3} />
      <Line x1={46} y1={166} x2={53} y2={162} stroke={flag} strokeWidth={1.3} />

      {/* ri-3 — a drum of excess Cat6 stuffed into the bay */}
      <Ellipse cx={146} cy={178} rx={25} ry={15} stroke={N} strokeWidth={3} fill="none" />
      <Ellipse cx={146} cy={178} rx={18} ry={10} stroke={N} strokeWidth={3} fill="none" opacity={0.85} />
      <Ellipse cx={146} cy={178} rx={10} ry={5.5} stroke={N} strokeWidth={3} fill="none" opacity={0.7} />
      <Path d="M121 174 C110 168 104 158 100 148" stroke={N} strokeWidth={3} fill="none" />
      <Path d="M170 182 C180 187 187 190 192 192" stroke={N} strokeWidth={3} fill="none" />

      {/* ri-11 — service loops zip-tied hard against the rail, unreachable */}
      <Ellipse cx={40} cy={226} rx={13} ry={11} stroke={A} strokeWidth={2.5} fill="none" />
      <Ellipse cx={42} cy={227} rx={8} ry={7} stroke={N} strokeWidth={2.5} fill="none" />
      <Line x1={32} y1={214} x2={50} y2={238} stroke="#e8e8ea" strokeWidth={2} />
      <Line x1={50} y1={214} x2={32} y2={238} stroke="#e8e8ea" strokeWidth={2} />

      {/* ri-7 — ties cinched until the snake is oval (hourglass pinches) */}
      <Path d="M202 210 Q230 217 256 210 Q272 218 298 211" stroke={A} strokeWidth={3} fill="none" />
      <Line x1={202} y1={216} x2={298} y2={216} stroke={A} strokeWidth={3} />
      <Path d="M202 222 Q230 215 256 222 Q272 214 298 221" stroke={A} strokeWidth={3} fill="none" />
      <Rect x={228} y={207} width={3} height={17} fill="#e8e8ea" />
      <Rect x={270} y={207} width={3} height={17} fill="#e8e8ea" />
      <Ellipse cx={229.5} cy={216} rx={4.5} ry={8} stroke={flag} strokeWidth={1.3} fill="none" />
      <Ellipse cx={271.5} cy={216} rx={4.5} ry={8} stroke={flag} strokeWidth={1.3} fill="none" />

      {/* ri-5 — amp rear blocked by a taut strapped bundle (dead straight) */}
      <Line x1={48} y1={262} x2={170} y2={264} stroke={S} strokeWidth={4.5} />
      <Line x1={48} y1={270} x2={170} y2={271} stroke={A} strokeWidth={3.5} />
      <Line x1={48} y1={277} x2={170} y2={277} stroke={P} strokeWidth={4} />
      <Rect x={56} y={258} width={2.5} height={23} fill="#e8e8ea" />
      <Rect x={158} y={258} width={2.5} height={23} fill="#e8e8ea" />

      {/* ri-6 — loom dressed straight across the amp's intake grille */}
      <Path d="M172 288 C200 283 236 293 270 287 L296 285" stroke={S} strokeWidth={6} fill="none" />
      <Path d="M172 296 C204 292 240 299 296 293" stroke={S} strokeWidth={4} fill="none" opacity={0.9} />

      {/* ri-10 — power connectors levered sideways by the bundle */}
      <G transform="rotate(10 71 338)">
        <Rect x={64} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
      </G>
      <G transform="rotate(14 97 338)">
        <Rect x={90} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
      </G>
      <G transform="rotate(8 123 338)">
        <Rect x={116} y={333} width={14} height={11} rx={1.5} fill="#101014" stroke="#5a5a64" strokeWidth={1.2} />
      </G>
      <Path d="M78 341 C96 350 118 352 138 351" stroke={P} strokeWidth={3.5} fill="none" />
      <Path d="M104 342 C120 351 138 353 152 352" stroke={P} strokeWidth={3.5} fill="none" />
      <Path d="M130 341 C146 349 158 352 168 352" stroke={P} strokeWidth={3.5} fill="none" />
      <Path d="M78 332 l4 -4 M104 331 l4 -4" stroke={flag} strokeWidth={1.2} fill="none" />

      {/* ri-14 — AC distro feeds woven through the analog loom */}
      <Path d="M176 350 C200 342 220 360 244 350 C260 343 276 357 298 349" stroke={P} strokeWidth={4} fill="none" />
      <Path d="M176 358 C200 364 222 346 246 357 C262 363 278 348 298 356" stroke={A} strokeWidth={3} fill="none" />
      <Path d="M180 344 C206 352 228 340 252 351" stroke={A} strokeWidth={2.5} opacity={0.8} fill="none" />
    </>
  );
}

/** Learner-assigned looms of the dressed rack (Phase B/C). Lanes are
 *  allocated per side in group order; wrong assignments render honestly
 *  (entry coil / hmgr dangle) and get a dashed flag once revealed. */
function Looms({ assigns, wrongIds, dim }: { assigns: Record<string, string>; wrongIds?: readonly string[] | null; dim?: boolean }) {
  let leftN = 0;
  let rightN = 0;
  let hmgrN = 0;
  const parts: ReactNode[] = [];
  CI_RACK_GROUPS.forEach((g, gi) => {
    const zone = assigns[g.id];
    if (!zone) return;
    const tint = CI_CLASS_TINTS[g.tintKey];
    const ex = ENTRY_XS[gi];
    const wrong = !!wrongIds && wrongIds.includes(g.id);
    if (zone === 'z-left' || zone === 'z-right') {
      const isL = zone === 'z-left';
      const lane = isL ? 12 + leftN++ * 4 : 328 - rightN++ * 4;
      const ty = DEST_Y[g.id];
      const wob = ((gi % 3) - 1) * 3;
      const d = isL ? dLeft(ex, lane, ty, wob) : dRight(ex, lane, ty, wob);
      parts.push(
        <G key={g.id}>
          <Path d={d} stroke={tint} strokeWidth={4.2} fill="none" strokeLinecap="round" opacity={0.92} />
          <Circle cx={isL ? 58 : 282} cy={ty} r={3.4} fill={tint} />
          {wrong ? <Path d={d} stroke="#ff5a48" strokeWidth={1.6} fill="none" strokeDasharray="5 4" /> : null}
        </G>,
      );
    } else if (zone === 'z-entry') {
      const cx = 188 + gi * 3;
      parts.push(
        <G key={g.id}>
          <Path d={`M${ex} 4 C${ex} 10 ${ex - 4} 16 ${cx} 22`} stroke={tint} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Ellipse cx={cx} cy={28} rx={17} ry={7} stroke={tint} strokeWidth={3.5} fill="none" />
          <Ellipse cx={cx} cy={28} rx={11} ry={4.5} stroke={tint} strokeWidth={3} fill="none" opacity={0.85} />
          {wrong ? <Ellipse cx={cx} cy={28} rx={21} ry={10} stroke="#ff5a48" strokeWidth={1.5} strokeDasharray="5 4" fill="none" /> : null}
        </G>,
      );
    } else {
      const yRun = 97 + hmgrN++ * 2;
      const d =
        `M${ex} 4 C${ex} 34 ${Math.min(262, ex + 44)} 62 252 ${yRun - 7} ` +
        `C246 ${yRun} 236 ${yRun} 224 ${yRun} L86 ${yRun} Q76 ${yRun} 76 ${yRun + 9}`;
      parts.push(
        <G key={g.id}>
          <Path d={d} stroke={tint} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.92} />
          {wrong ? <Path d={d} stroke="#ff5a48" strokeWidth={1.6} strokeDasharray="5 4" fill="none" /> : null}
        </G>,
      );
    }
  });
  return (
    <G opacity={dim ? 0.15 : 1}>
      {/* patch-field leads organized through the horizontal manager */}
      {[102, 138, 174, 210].map((cx) => (
        <Path key={cx} d={`M${cx} 74 C${cx} 82 ${cx + 5} 87 ${cx + 7} 92`} stroke={CI_CLASS_TINTS.analog} strokeWidth={2} fill="none" opacity={0.8} />
      ))}
      {parts}
      {/* manager straps riding over the dressed looms */}
      {TIE_YS.map((y) => (
        <G key={y} opacity={0.8}>
          <Line x1={10} y1={y} x2={36} y2={y} stroke="#5a5a64" strokeWidth={2.4} strokeLinecap="round" />
          <Line x1={304} y1={y} x2={330} y2={y} stroke="#5a5a64" strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ))}
    </G>
  );
}

/** Trace overlay: veil everything, light the one cable, tag both ends. */
function TraceArt() {
  const A = CI_CLASS_TINTS.analog;
  return (
    <>
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={12} fill="#0d0d11" opacity={0.55} />
      <Path d={TRACE_D} stroke={A} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.25} />
      <Path d={TRACE_D} stroke={A} strokeWidth={4.2} fill="none" strokeLinecap="round" />
      <Circle cx={175} cy={70} r={7.5} stroke={colors.amber} strokeWidth={2} fill="none" />
      <Circle cx={242} cy={162} r={10} stroke={colors.amber} strokeWidth={2.2} fill="none" />
      <Rect x={142} y={80} width={30} height={11} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
      <SvgText x={157} y={88.5} fontSize={7} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
        A-07
      </SvgText>
      <Rect x={252} y={140} width={30} height={11} rx={2} fill="#26262c" stroke={colors.amber} strokeWidth={0.8} />
      <SvgText x={267} y={148.5} fontSize={7} fill={colors.amber} fontFamily={fonts.mono} textAnchor="middle">
        A-07
      </SvgText>
      <SvgText x={242} y={185} fontSize={6.5} fill="#e6e6e6" fontFamily={fonts.mono} textAnchor="middle">
        IN 7
      </SvgText>
    </>
  );
}

function FoundMarkers({ found, lastFound }: { found: ReadonlySet<string>; lastFound: string | null }) {
  return (
    <>
      {CI_RACK_ISSUES.filter((i) => found.has(i.id)).map((i) => {
        const hit = HIT[i.id];
        const cx = hit.x + hit.w / 2;
        const cy = hit.y + hit.h / 2;
        const hot = lastFound === i.id;
        return (
          <G key={i.id}>
            <Circle cx={cx} cy={cy} r={hot ? 13 : 11} fill="rgba(255,198,77,0.12)" stroke={colors.amber} strokeWidth={hot ? 2.4 : 1.8} />
            <SvgText x={cx} y={cy + 4} fontSize={11} fill={colors.amber} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
              !
            </SvgText>
          </G>
        );
      })}
    </>
  );
}

type CSel = { jack: number; ok: boolean } | null;

function RackSvg({
  w,
  mode,
  found,
  lastFound,
  assigns,
  wrongIds,
  cSel,
}: {
  w: number;
  mode: 'bad' | 'dress';
  found?: ReadonlySet<string>;
  lastFound?: string | null;
  assigns?: Record<string, string>;
  wrongIds?: readonly string[] | null;
  cSel?: CSel;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const dress = mode === 'dress';
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Chassis dress={dress} />
      {dress ? <Looms assigns={assigns ?? {}} wrongIds={wrongIds} dim={!!cSel?.ok} /> : <BadCables />}
      {!dress && found ? <FoundMarkers found={found} lastFound={lastFound ?? null} /> : null}
      {cSel?.ok ? <TraceArt /> : null}
      {cSel && !cSel.ok ? <Circle cx={DSP_JACK_XS[cSel.jack - 1]} cy={162} r={10} stroke="#ff5a48" strokeWidth={2.2} fill="none" /> : null}
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

  /* Phase D */
  const [dPick, setDPick] = useState<number | null>(null);
  const wrongPicks = useRef(0);

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
    if (replaced) return;
    if (n === 7) {
      setCSel({ jack: 7, ok: true });
      AccessibilityInfo.announceForAccessibility('Input 7 selected. One cable highlights end to end: label A-07 at the patch field, down the left manager, to label A-07 at DSP input 7. Everything else dims.');
    } else {
      wrongJacks.current += 1;
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
  const phaseOpen: Record<Phase, boolean> = { a: true, b: aDone, c: bDone, d: cDone };

  const lastIssue = lastFound ? (CI_RACK_ISSUES.find((i) => i.id === lastFound) ?? null) : null;
  const lastMistake = lastIssue ? (mistakeById(lastIssue.mistakeId) ?? null) : null;
  const activeGroupDef = activeGroup ? (CI_RACK_GROUPS.find((g) => g.id === activeGroup) ?? null) : null;
  const beforeW = Math.max(96, Math.min(130, Math.round(width * 0.34)));

  return (
    <View style={{ gap: 14 }}>
      {/* ── phase chips ── */}
      <View style={styles.phaseRow}>
        {PHASES.map((p) => {
          const active = phase === p.id;
          const done = phaseDone[p.id];
          const open = phaseOpen[p.id];
          return (
            <Pressable
              key={p.id}
              style={[styles.phaseChip, done && styles.phaseChipDone, active && styles.phaseChipActive, !open && styles.phaseChipLocked]}
              disabled={!open}
              onPress={() => setPhase(p.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !open }}
              accessibilityLabel={`Phase ${p.tag}: ${p.name}${done ? ', complete' : open ? '' : ', locked'}`}
            >
              <Text style={[styles.phaseChipTag, done && { color: colors.green }, active && !done && { color: colors.amber }]}>
                {done ? '✓' : p.tag}
              </Text>
              <Text style={[styles.phaseChipName, active && { color: colors.textPrimary }]}>{p.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.tintNote}>
        {'Training visualization — the cable-class colors are a teaching language only; field cable colors vary.'}
      </Text>

      {/* ═══════════ PHASE A — inspect the bad rack ═══════════ */}
      {phase === 'a' ? (
        <CiSection title="PHASE A — INSPECT: CONDEMN THIS RACK">
          <Text style={styles.lead}>
            {'A contractor calls this rack "finished." Rear view. Document at least '}
            {REQUIRED_FINDS}
            {' problems before you sign anything — tap what’s wrong, or open the suspect list and inspect location by location.'}
          </Text>
          <View style={{ width, height: svgH }}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel="Rear view of a badly dressed equipment rack: patch field, horizontal manager, network switch, DSP, audio interface, amplifier, power distribution, and vertical cable managers on both sides. Cabling is tangled, taut, unlabeled and blocking vents."
            >
              <RackSvg w={width} mode="bad" found={found} lastFound={lastFound} />
            </View>
            <Pressable
              accessible={false}
              importantForAccessibility="no"
              onPress={onMissTap}
              style={{ position: 'absolute', left: 0, top: 0, width, height: svgH }}
            />
            {CI_RACK_ISSUES.map((iss) => {
              const hit = HIT[iss.id];
              const rw = Math.max(44, hit.w * scale);
              const rh = Math.max(44, hit.h * scale);
              const left = (hit.x + hit.w / 2) * scale - rw / 2;
              const top = (hit.y + hit.h / 2) * scale - rh / 2;
              const isFound = found.has(iss.id);
              return (
                <Pressable
                  key={iss.id}
                  onPress={() => findIssue(iss.id)}
                  style={{ position: 'absolute', left, top, width: rw, height: rh }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: lastFound === iss.id }}
                  accessibilityLabel={`${hit.where}${isFound ? `. Flagged: ${iss.label}` : ''}`}
                />
              );
            })}
          </View>
          <FindProgress found={found.size} required={REQUIRED_FINDS} total={CI_RACK_ISSUES.length} />
          <OptionChip
            label={listOpen ? '▾ SUSPECT LIST' : '▸ SUSPECT LIST'}
            active={listOpen}
            onPress={() => setListOpen((o) => !o)}
            action
          />
          {listOpen ? (
            <View style={{ gap: 6 }}>
              {CI_RACK_ISSUES.map((iss) => {
                const isFound = found.has(iss.id);
                return (
                  <Pressable
                    key={iss.id}
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
                );
              })}
            </View>
          ) : null}
          {missNote ? (
            <Text style={styles.missNote}>
              {'Nothing documented right there — inspect where cable meets gear: jacks, rails, vents, entries and label points.'}
            </Text>
          ) : null}
          {lastIssue && lastMistake ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.foundLabel}>⚑ {lastIssue.label}</Text>
              <RuleFeedback ruleId={lastMistake.ruleId} verdict="bad" short={lastMistake.shortFeedback} openSources={openSources} />
              <Text style={styles.fixLine}>FIX  {lastMistake.correction}</Text>
            </View>
          ) : null}
          {aDone ? (
            <Pressable
              style={styles.phaseNextBtn}
              onPress={() => setPhase('b')}
              accessibilityRole="button"
              accessibilityLabel="Continue to phase B, dress the rack"
            >
              <Text style={styles.phaseNextText}>RACK CONDEMNED — NOW DRESS IT RIGHT ›</Text>
            </Pressable>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE B — dress the rack ═══════════ */}
      {phase === 'b' ? (
        <CiSection title="PHASE B — DRESS: ROUTE EVERY GROUP TO THE PLAN">
          <SpecCard text={CI_RACK_PLAN_NOTE} />
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
            <RackSvg w={width} mode="dress" assigns={assigns} wrongIds={wrongB} />
          </View>
          <Text style={styles.lead}>
            {'Six cable groups arrive at the top entry. Pick a group, then pick where it dresses. Looms draw as you assign — reassign freely until the plan is satisfied.'}
          </Text>
          <View style={styles.chipWrap}>
            {CI_RACK_GROUPS.map((g) => {
              const tint = CI_CLASS_TINTS[g.tintKey];
              const zone = assigns[g.id];
              const active = activeGroup === g.id;
              const verdict = wrongB == null ? null : wrongB.includes(g.id) ? 'bad' : 'good';
              return (
                <Pressable
                  key={g.id}
                  style={[styles.groupChip, active && styles.groupChipActive]}
                  onPress={() => setActiveGroup(active ? null : g.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
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
              );
            })}
          </View>
          {activeGroupDef ? (
            <View style={styles.zoneCard}>
              <Text style={styles.zoneHead}>DRESS {activeGroupDef.name.toUpperCase()} INTO…</Text>
              {CI_RACK_ZONES.map((z) => (
                <Pressable
                  key={z.id}
                  style={styles.zoneBtn}
                  onPress={() => assignZone(z.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${z.name}. ${z.note}`}
                >
                  <Text style={styles.zoneBtnName}>{z.name.toUpperCase()}</Text>
                  <Text style={styles.zoneBtnNote}>{z.note}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {wrongB != null ? (
            wrongB.length === 0 ? (
              <RuleFeedback
                ruleId="rack-power-signal-plan"
                verdict="good"
                short="Plan satisfied — every class has a deliberate, separated route down a manager. This rack can be serviced."
                openSources={openSources}
              />
            ) : (
              <View style={{ gap: 8 }}>
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
              </View>
            )
          ) : null}
          {bDone ? (
            <Pressable
              style={styles.phaseNextBtn}
              onPress={() => setPhase('c')}
              accessibilityRole="button"
              accessibilityLabel="Continue to phase C, the serviceability test"
            >
              <Text style={styles.phaseNextText}>DRESSED TO PLAN — RUN THE SERVICE CALL ›</Text>
            </Pressable>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ PHASE C — serviceability test ═══════════ */}
      {phase === 'c' ? (
        <CiSection title="PHASE C — SERVICE: THE 30-SECOND SWAP">
          <SpecCard text="WORK ORDER — DSP INPUT 7 reads dead at the console. Identify that one cable end-to-end and replace it. Nothing else may be disturbed: the system is live." />
          <View style={{ width, height: svgH }}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={
                cSel?.ok
                  ? 'Dressed rack in trace mode: one cable highlighted from patch label A-07 down the left manager to DSP input 7; every other loom dimmed.'
                  : 'Rear view of the dressed rack. The DSP row has eight numbered inputs.'
              }
            >
              <RackSvg w={width} mode="dress" assigns={planAssigns} cSel={cSel} />
            </View>
            {DSP_JACK_XS.map((cx, i) => (
              <Pressable
                key={cx}
                accessible={false}
                importantForAccessibility="no"
                onPress={() => pickJack(i + 1)}
                hitSlop={3}
                style={{ position: 'absolute', left: (cx - 14) * scale, top: 146 * scale, width: 28 * scale, height: 34 * scale }}
              />
            ))}
          </View>
          <Text style={styles.lead}>{'Tap DSP INPUT 7 on the rack — or use the input list.'}</Text>
          <View style={styles.jackRow}>
            {DSP_JACK_XS.map((_, i) => {
              const n = i + 1;
              const sel = cSel?.jack === n;
              return (
                <Pressable
                  key={n}
                  style={[styles.jackBtn, sel && (cSel?.ok ? styles.jackBtnRight : styles.jackBtnWrong)]}
                  onPress={() => pickJack(n)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={`DSP input ${n}`}
                >
                  <Text style={[styles.jackBtnText, sel && { color: colors.textPrimary }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          {cSel && !cSel.ok ? (
            <VerdictBanner
              verdict="wrong"
              text={`That’s INPUT ${cSel.jack} — it works. The work order says INPUT 7; the numbering just stopped you from pulling a live line.`}
            />
          ) : null}
          {cSel?.ok ? (
            <View style={{ gap: 8 }}>
              <View style={styles.traceCard}>
                <Text style={styles.traceHead}>TRACED — ONE CABLE, END TO END</Text>
                <Text style={styles.traceBody}>
                  {'Label A-07 at the patch field → left manager lane → label A-07 at DSP INPUT 7. Everything else stays exactly where the plan put it.'}
                </Text>
              </View>
              {!replaced ? (
                <Pressable
                  style={styles.phaseNextBtn}
                  onPress={confirmReplace}
                  accessibilityRole="button"
                  accessibilityLabel="Replace this cable"
                >
                  <Text style={styles.phaseNextText}>REPLACE THIS CABLE ✓</Text>
                </Pressable>
              ) : (
                <View style={{ gap: 10 }}>
                  <VerdictBanner
                    verdict="correct"
                    text="Cable identified, slack taken from the manager, replaced, records updated. Elapsed: about thirty seconds — with the rest of the system live."
                  />
                  <RuleFeedback
                    ruleId="label-both-ends"
                    verdict="good"
                    short="Labels at both ends plus a planned path made the trace instant — identification is what the dressing bought you."
                    openSources={openSources}
                  />
                  <View style={styles.beforeRow}>
                    <RackSvg w={beforeW} mode="bad" />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.beforeHead}>THE SAME JOB, BEFORE</Text>
                      <Text style={styles.beforeBody}>
                        {'Unlabeled identical cables, classes interleaved, zero slack: you’d be tugging lines and guessing — on a live system. The dressing IS what made this thirty seconds.'}
                      </Text>
                    </View>
                  </View>
                  {cDone ? (
                    <Pressable
                      style={styles.phaseNextBtn}
                      onPress={() => setPhase('d')}
                      accessibilityRole="button"
                      accessibilityLabel="Continue to phase D, the maintenance test"
                    >
                      <Text style={styles.phaseNextText}>ONE MORE TEST — SWAP THE SWITCH ›</Text>
                    </Pressable>
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
            {D_OPTIONS.map((o, i) => {
              const picked = dPick === i;
              return (
                <Pressable
                  key={o.title}
                  style={[styles.optCard, picked && (o.ok ? styles.optCardRight : styles.optCardWrong)]}
                  onPress={() => pickApproach(i)}
                  disabled={dSolved}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked, disabled: dSolved }}
                  accessibilityLabel={`${o.title}. ${o.body}`}
                >
                  <Text style={[styles.optTitle, picked && { color: o.ok ? colors.green : '#ff9b8f' }]}>
                    {picked ? (o.ok ? '✓ ' : '✕ ') : ''}
                    {o.title}
                  </Text>
                  <Text style={styles.optBody}>{o.body}</Text>
                </Pressable>
              );
            })}
          </View>
          {dPick != null ? (
            <View style={{ gap: 8 }}>
              <VerdictBanner verdict={D_OPTIONS[dPick].ok ? 'correct' : 'wrong'} text={D_OPTIONS[dPick].verdict} />
              {D_OPTIONS[dPick].ok ? (
                <RuleFeedback
                  ruleId="rack-service-access"
                  verdict="good"
                  short="Dress for the service call: labels identify, managers hold, intentional slack moves — one device out, nothing else touched."
                  openSources={openSources}
                />
              ) : null}
            </View>
          ) : null}
        </CiSection>
      ) : null}

      {/* ═══════════ close: principles + completion ═══════════ */}
      {dDone ? (
        <View style={{ gap: 10 }}>
          <View style={styles.doneBanner}>
            <Text style={styles.doneText}>✓ STAGE COMPLETE — CONDEMNED IT, DRESSED IT, PROVED IT.</Text>
          </View>
          <View style={styles.prinCard}>
            <Text style={styles.prinHead}>WHAT A DRESSED RACK HOLDS TRUE</Text>
            {PRINCIPLES.map((p) => {
              const rule = p.ruleId ? ruleFor(p.ruleId) : null;
              return (
                <View key={p.text} style={styles.prinRow}>
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
              );
            })}
          </View>
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
