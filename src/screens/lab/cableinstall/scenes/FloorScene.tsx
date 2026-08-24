/**
 * STAGE 9 — Floor & Temporary Event Runs (spec §32).
 *
 * The live-sound stage: (A) STAGE CRAFT — a stage plan that starts as found
 * (webs across the performer lane, loose loops) and redraws itself the
 * professional way as three routing calls are made; (B)+(C) the two
 * CI_FLOOR_SCENARIOS route decisions (FOH run, backstage load-in) revealed
 * through the shared route evaluator — "a cable ramp does not automatically
 * make a crossing acceptable" must land; (D) OVER-UNDER coiling practice:
 * alternate OVER/UNDER loops, watch the coil draw and the twist meter react.
 *
 * Completion: A's three calls + B + C answered + D coiled correctly →
 * onComplete({ safety, protection, workmanship }) scored from the chosen
 * routes' evaluated dimensions plus stage-craft calls and coil quality.
 *
 * Accessibility: every interaction is a labeled button ≥44dp (no drag);
 * verdicts render as glyph + words + color and are announced; the coil is
 * driven by two large buttons by design. Route/plan art is a qualitative
 * training visualization (stated in-scene); training tints only.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { CI_FLOOR_SCENARIOS, CI_OVERUNDER_STEPS, type CiRouteScenario } from '../data/scenarios';
import { evaluateRoute, rankRoutes, type CiRouteFlag } from '../engine/routeEval';
import { CI_DIMS, CI_DIM_META } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── (A) stage-craft decisions ──────────────────────────────────────────── */
type CraftOption = { id: string; label: string; ok: boolean; short: string };
type CraftDecision = { id: 'route' | 'slack' | 'mon'; prompt: string; options: CraftOption[] };

const CRAFT_DECISIONS: CraftDecision[] = [
  {
    id: 'route',
    prompt: 'Mic lines from the stage box to the three stands:',
    options: [
      { id: 'lane', label: 'STRAIGHT RUNS ACROSS THE LANE', ok: false, short: 'That web sits exactly where performers move — feet find cable every time.' },
      { id: 'edge', label: 'UPSTAGE, THEN ALONG THE EDGES', ok: true, short: 'Edge-routed and out of every lane — the runs disappear from the show.' },
    ],
  },
  {
    id: 'slack',
    prompt: 'The spare cable at the stage box:',
    options: [
      { id: 'loops', label: 'LEAVE LOOSE LOOPS ON DECK', ok: false, short: 'Loose loops migrate into lanes and snag feet, stands and wheels.' },
      { id: 'dressed', label: 'DRESS THE SLACK AT THE BOX', ok: true, short: 'Working slack lives coiled at the box — reachable, never underfoot.' },
    ],
  },
  {
    id: 'mon',
    prompt: 'Monitor feeds along the downstage edge, where performers cross:',
    options: [
      { id: 'bare', label: 'RUN THEM BARE ACROSS THE DECK', ok: false, short: 'Bare lines in the crossing get stepped on all show — and fail at the downbeat.' },
      { id: 'dressed', label: 'DRESS THE EDGE + PROTECT THE CROSSING', ok: true, short: 'Tight to the monitor line, protected where feet actually cross.' },
    ],
  },
];

const ROUTE_TINTS = ['#ffd35e', '#4fd0e0', '#c77dff'] as const;
const LETTERS = ['A', 'B', 'C'] as const;

/* ── stage plan (A) — redraws each aspect as its call is made ───────────── */
function StagePlan({ w, routeFixed, slackFixed, monFixed }: { w: number; routeFixed: boolean; slackFixed: boolean; monFixed: boolean }) {
  const h = Math.round(w * (205 / 360));
  const mic = CI_CLASS_TINTS.analog;
  const spk = CI_CLASS_TINTS.speaker;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 205"
      accessibilityLabel={`Stage plan, training visualization. Mic lines ${routeFixed ? 'edge-routed clear of the performer lane' : 'webbed across the performer lane'}; slack ${slackFixed ? 'dressed at the box' : 'in loose loops on deck'}; monitor feeds ${monFixed ? 'dressed at the edge with a protected crossing' : 'bare across the deck'}.`}
    >
      <Rect x={0} y={0} width={360} height={205} rx={10} fill="#0c0c10" />
      {/* deck */}
      <Rect x={6} y={14} width={348} height={158} rx={8} fill="#101014" stroke="#2c2c33" strokeWidth={1.5} />
      <SvgText x={14} y={28} fill="#6f7378" fontSize={8}>STAGE</SvgText>
      {/* audience edge */}
      <Line x1={6} y1={180} x2={354} y2={180} stroke="#2c2c33" strokeWidth={1.5} />
      <SvgText x={180} y={196} fill="#6f7378" fontSize={8} textAnchor="middle">AUDIENCE</SvgText>
      {/* performer lane */}
      <Rect x={96} y={98} width={210} height={52} fill="none" stroke="#6f7378" strokeWidth={1} strokeDasharray="5,4" />
      <SvgText x={201} y={128} fill="#6f7378" fontSize={8} textAnchor="middle">PERFORMER LANE</SvgText>
      {/* stage box, downstage-left */}
      <Rect x={16} y={138} width={36} height={24} rx={3} fill="#17171c" stroke="#6f7378" strokeWidth={1.3} />
      <SvgText x={34} y={153} fill="#a6a6ad" fontSize={8} textAnchor="middle">BOX</SvgText>
      {/* mic stands (upstage of the lane) */}
      {[
        [120, 84],
        [200, 76],
        [282, 84],
      ].map(([x, y]) => (
        <G key={`st${x}`}>
          <Circle cx={x} cy={y} r={4.5} fill="none" stroke="#e8e8ea" strokeWidth={1.5} />
          <Line x1={x} y1={y + 5} x2={x} y2={y + 11} stroke="#e8e8ea" strokeWidth={1.2} />
        </G>
      ))}
      <SvgText x={200} y={62} fill="#6f7378" fontSize={7.5} textAnchor="middle">MIC STANDS</SvgText>
      {/* monitor wedges at the downstage edge */}
      {[118, 196, 274].map((x) => (
        <Path key={`wg${x}`} d={`M${x} 168 h26 l-6 -13 h-14 z`} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      ))}
      {/* monitor world, downstage-right */}
      <Rect x={318} y={146} width={30} height={20} rx={3} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <SvgText x={333} y={159} fill="#a6a6ad" fontSize={7} textAnchor="middle">MON</SvgText>

      {/* MIC ROUTING — bad web vs edge-routed */}
      {routeFixed ? (
        <G>
          <Path d="M30 138 V36 H118 V79" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M34 138 V40 H198 V71" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M38 138 V44 H280 V79" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Path d="M40 140 C90 150 110 120 120 90" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M44 146 C130 150 170 120 200 82" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M48 150 C170 156 240 130 282 90" stroke={mic} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      )}

      {/* SLACK — loose loops vs coil dressed at the box */}
      {slackFixed ? (
        <G>
          <Circle cx={64} cy={150} r={7} fill="none" stroke={mic} strokeWidth={2} />
          <Circle cx={64} cy={150} r={10.5} fill="none" stroke={mic} strokeWidth={2} />
        </G>
      ) : (
        <G>
          <Circle cx={150} cy={140} r={8} fill="none" stroke={mic} strokeWidth={2} />
          <Circle cx={166} cy={132} r={6} fill="none" stroke={mic} strokeWidth={2} />
          <Circle cx={140} cy={126} r={5} fill="none" stroke={mic} strokeWidth={2} />
        </G>
      )}

      {/* MONITOR FEEDS — bare across the deck vs dressed edge + protector */}
      {monFixed ? (
        <G>
          <Path d="M322 166 H131" stroke={spk} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          {[131, 209, 287].map((x) => (
            <Line key={`mu${x}`} x1={x} y1={166} x2={x} y2={161} stroke={spk} strokeWidth={2.2} />
          ))}
          <Path d="M230 170 l6 -7 h20 l6 7 z" fill="#26262c" stroke="#6f7378" strokeWidth={1.2} />
        </G>
      ) : (
        <G>
          <Path d="M322 158 C250 128 215 150 209 155" stroke={spk} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M322 162 C240 136 180 150 131 157" stroke={spk} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Circle cx={252} cy={140} r={7} fill="none" stroke={spk} strokeWidth={2} />
        </G>
      )}
    </Svg>
  );
}

/* ── FOH venue plan (B) ─────────────────────────────────────────────────── */
function FohPlan({ w }: { w: number }) {
  const h = Math.round(w * (210 / 360));
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 210"
      accessibilityLabel="Venue plan, training visualization: stage at top, seated audience with a center aisle, perimeter walls with a service door, FOH riser at the bottom. Route A runs down the center aisle; route B follows the perimeter with one protected door crossing; route C hops overhead on rated rigging points."
    >
      <Rect x={0} y={0} width={360} height={210} rx={10} fill="#0c0c10" />
      <Rect x={6} y={6} width={348} height={198} rx={8} fill="#101014" stroke="#2c2c33" strokeWidth={1.5} />
      {/* stage + FOH */}
      <Rect x={60} y={12} width={240} height={36} rx={4} fill="#141418" stroke="#3a3c42" strokeWidth={1.3} />
      <SvgText x={180} y={34} fill="#a6a6ad" fontSize={10} textAnchor="middle">STAGE</SvgText>
      <Rect x={150} y={170} width={60} height={26} rx={4} fill="#141418" stroke="#3a3c42" strokeWidth={1.3} />
      <SvgText x={180} y={187} fill="#a6a6ad" fontSize={9} textAnchor="middle">FOH</SvgText>
      {/* seating rows, center aisle between */}
      {[66, 78, 90, 102, 114, 126, 138, 150].map((y) => (
        <G key={`row${y}`}>
          <Line x1={62} y1={y} x2={160} y2={y} stroke="#1b1b20" strokeWidth={6} />
          <Line x1={200} y1={y} x2={298} y2={y} stroke="#1b1b20" strokeWidth={6} />
        </G>
      ))}
      <SvgText x={180} y={60} fill="#6f7378" fontSize={7.5} textAnchor="middle">AISLE (EGRESS)</SvgText>
      {/* service door on the left wall */}
      <Rect x={3} y={108} width={7} height={22} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      <SvgText x={34} y={104} fill="#6f7378" fontSize={7}>SVC DOOR</SvgText>
      {/* main doors on the bottom wall */}
      <Rect x={58} y={200} width={26} height={6} fill="#26262c" />
      <Rect x={276} y={200} width={26} height={6} fill="#26262c" />
      {/* ROUTE A — center aisle under ramp (amber) */}
      <Path d="M180 48 V170" stroke={ROUTE_TINTS[0]} strokeWidth={2.8} fill="none" />
      {[64, 80, 96, 112, 128, 144, 160].map((y) => (
        <Line key={`ramp${y}`} x1={173} y1={y} x2={187} y2={y} stroke="#6f7378" strokeWidth={1.2} />
      ))}
      {/* ROUTE B — perimeter with one protected door crossing (teal) */}
      <Path d="M66 48 H26 V178 H150" stroke={ROUTE_TINTS[1]} strokeWidth={2.8} fill="none" />
      <Path d="M18 112 l8 -5 v22 l-8 -5 z" fill="#26262c" stroke="#6f7378" strokeWidth={1.1} />
      {/* ROUTE C — overhead hop on rated points (purple, dashed = above the floor) */}
      <Path d="M294 48 C334 72 338 132 214 174" stroke={ROUTE_TINTS[2]} strokeWidth={2.6} fill="none" strokeDasharray="7,5" />
      <Circle cx={322} cy={78} r={3.2} fill="none" stroke={ROUTE_TINTS[2]} strokeWidth={1.6} />
      <Circle cx={314} cy={140} r={3.2} fill="none" stroke={ROUTE_TINTS[2]} strokeWidth={1.6} />
      <SvgText x={252} y={70} fill="#6f7378" fontSize={7}>OVERHEAD · RATED PTS</SvgText>
      {/* letters */}
      <RouteLetter x={168} y={64} i={0} />
      <RouteLetter x={40} y={64} i={1} />
      <RouteLetter x={300} y={64} i={2} />
    </Svg>
  );
}

/* ── backstage plan (C) ─────────────────────────────────────────────────── */
function BackstagePlan({ w }: { w: number }) {
  const h = Math.round(w * (210 / 360));
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 210"
      accessibilityLabel="Backstage plan, training visualization: dock door at top, the load-in and forklift path running down to the stage, road cases along the right wall, a swinging door on the left wall, distro at left, monitor world at bottom right. Route A crosses the roll path under a mat; route B crosses once at a marked, vehicle-rated protector; route C takes the long perimeter behind the cases."
    >
      <Rect x={0} y={0} width={360} height={210} rx={10} fill="#0c0c10" />
      <Rect x={6} y={6} width={348} height={198} rx={8} fill="#101014" stroke="#2c2c33" strokeWidth={1.5} />
      {/* dock + load-in band */}
      <Rect x={46} y={3} width={50} height={7} fill="#26262c" />
      <SvgText x={71} y={22} fill="#6f7378" fontSize={7.5} textAnchor="middle">DOCK</SvgText>
      <Path d="M52 10 L100 10 L268 204 L200 204 z" fill="#16161b" stroke="#26262c" strokeWidth={1} />
      <SvgText x={172} y={104} fill="#6f7378" fontSize={7.5} textAnchor="middle">LOAD-IN / FORKLIFT</SvgText>
      {/* forklift glyph */}
      <Rect x={140} y={52} width={20} height={10} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={145} cy={65} r={3} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={156} cy={65} r={3} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      <Line x1={160} y1={54} x2={168} y2={54} stroke="#6f7378" strokeWidth={1.2} />
      {/* road cases, right wall */}
      {[36, 66, 96].map((y) => (
        <Rect key={`case${y}`} x={304} y={y} width={42} height={26} rx={2} fill="#17171c" stroke="#3a3c42" strokeWidth={1.2} />
      ))}
      <SvgText x={325} y={132} fill="#6f7378" fontSize={7} textAnchor="middle">CASES</SvgText>
      {/* door swing on the left wall */}
      <Line x1={8} y1={150} x2={38} y2={174} stroke="#6f7378" strokeWidth={1.4} />
      <Path d="M8 188 A38 38 0 0 0 38 174" fill="none" stroke="#6f7378" strokeWidth={1} strokeDasharray="4,4" />
      <SvgText x={16} y={144} fill="#6f7378" fontSize={7}>DOOR SWING</SvgText>
      {/* distro + monitor world */}
      <Rect x={14} y={84} width={34} height={26} rx={3} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <SvgText x={31} y={100} fill="#a6a6ad" fontSize={7} textAnchor="middle">DISTRO</SvgText>
      <Rect x={296} y={168} width={52} height={30} rx={3} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <SvgText x={322} y={186} fill="#a6a6ad" fontSize={7} textAnchor="middle">MON WORLD</SvgText>
      {/* ROUTE A — straight across under a mat (amber) */}
      <Path d="M48 100 L296 178" stroke={ROUTE_TINTS[0]} strokeWidth={2.8} fill="none" />
      <Rect x={172} y={134} width={30} height={12} rx={2} fill="#1f1f24" stroke="#6f7378" strokeWidth={1.1} />
      <SvgText x={187} y={130} fill="#6f7378" fontSize={7} textAnchor="middle">MAT</SvgText>
      {/* ROUTE B — one marked, vehicle-rated crossing (teal) */}
      <Path d="M48 106 V178 H296" stroke={ROUTE_TINTS[1]} strokeWidth={2.8} fill="none" />
      <Path d="M206 184 l8 -9 h22 l8 9 z" fill="#26262c" stroke="#6f7378" strokeWidth={1.2} />
      <Line x1={200} y1={168} x2={200} y2={190} stroke={CI_CLASS_TINTS.speaker} strokeWidth={1.4} strokeDasharray="3,3" />
      <Line x1={248} y1={168} x2={248} y2={190} stroke={CI_CLASS_TINTS.speaker} strokeWidth={1.4} strokeDasharray="3,3" />
      <SvgText x={224} y={164} fill="#6f7378" fontSize={7} textAnchor="middle">RATED + MARKED</SvgText>
      {/* ROUTE C — long perimeter behind the cases (purple) */}
      <Path d="M48 94 V30 H292 V172 H296" stroke={ROUTE_TINTS[2]} strokeWidth={2.6} fill="none" />
      {/* letters */}
      <RouteLetter x={120} y={126} i={0} />
      <RouteLetter x={62} y={150} i={1} />
      <RouteLetter x={170} y={42} i={2} />
    </Svg>
  );
}

function RouteLetter({ x, y, i }: { x: number; y: number; i: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={7.5} fill="#17171c" stroke={ROUTE_TINTS[i]} strokeWidth={1.6} />
      <SvgText x={x} y={y + 3.4} fill={ROUTE_TINTS[i]} fontSize={9} textAnchor="middle">{LETTERS[i]}</SvgText>
    </G>
  );
}

/* ── per-dimension mini bars for a route verdict ────────────────────────── */
function DimMiniBars({ dims }: { dims: Partial<Record<(typeof CI_DIMS)[number], number>> }) {
  return (
    <View style={{ gap: 4 }}>
      {CI_DIMS.map((d) => {
        const v = dims[d];
        if (v == null) return null;
        const tint = v >= 80 ? colors.green : v >= 55 ? colors.amber : '#ff9b8f';
        return (
          <View key={d} style={s.miniRow} accessibilityLabel={`${CI_DIM_META[d].label}: ${v} out of 100`}>
            <Text style={s.miniLabel} numberOfLines={1}>{CI_DIM_META[d].label}</Text>
            <View style={s.miniTrack}>
              <View style={[s.miniFill, { width: `${v}%`, backgroundColor: tint }]} />
            </View>
            <Text style={s.miniVal}>{v}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Dedupe a route's flags to one feedback block per rule. */
function dedupeFlags(flags: CiRouteFlag[]): CiRouteFlag[] {
  const seen = new Set<string>();
  const out: CiRouteFlag[] = [];
  for (const f of flags) {
    if (seen.has(f.ruleId)) continue;
    seen.add(f.ruleId);
    out.push(f);
  }
  return out;
}

/* ── route scenario block (used by B and C) ─────────────────────────────── */
function RouteBlock({
  scenario,
  width,
  plan,
  pick,
  onPick,
  openSources,
  keyPoint,
}: {
  scenario: CiRouteScenario;
  width: number;
  plan: (w: number) => ReactNode;
  pick: string | null;
  onPick: (id: string) => void;
  openSources: (ids: string[]) => void;
  keyPoint?: { head: string; body: string };
}) {
  const ranked = useMemo(() => rankRoutes(scenario.options), [scenario]);
  const chosen = pick ? scenario.options.find((o) => o.id === pick) ?? null : null;
  const revealed = pick != null;
  const letterOf = (id: string) => LETTERS[scenario.options.findIndex((o) => o.id === id)] ?? '?';
  const tintOf = (id: string) => ROUTE_TINTS[scenario.options.findIndex((o) => o.id === id)] ?? '#6f7378';
  return (
    <View style={{ gap: 10 }}>
      <Text style={s.lead}>{scenario.brief}</Text>
      {plan(width)}
      <Text style={s.caption}>Route colors identify the options — not cable classes.</Text>
      {!revealed ? (
        <View style={{ gap: 8 }}>
          {scenario.options.map((o, i) => (
            <Pressable
              key={o.id}
              style={s.routeCard}
              onPress={() => onPick(o.id)}
              accessibilityRole="button"
              accessibilityLabel={`Route ${LETTERS[i]}: ${o.name}. ${o.path}`}
            >
              <View style={[s.swatch, { backgroundColor: ROUTE_TINTS[i] }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.routeName}>{`ROUTE ${LETTERS[i]} — ${o.name.toUpperCase()}`}</Text>
                <Text style={s.routePath}>{o.path}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {ranked.map(({ option, verdict, overall }, i) => {
            const isPick = option.id === pick;
            return (
              <View key={option.id} style={[s.verdictCard, isPick && s.verdictCardPicked]}>
                <View style={s.verdictHead}>
                  <View style={[s.swatch, { backgroundColor: tintOf(option.id) }]} />
                  <Text style={s.routeName} numberOfLines={2}>{`${letterOf(option.id)} — ${option.name.toUpperCase()}`}</Text>
                  <View style={{ flex: 1 }} />
                  {i === 0 ? <Text style={s.badgeBest}>BEST CALL</Text> : null}
                  {isPick ? <Text style={s.badgePick}>YOUR PICK</Text> : null}
                </View>
                <Text style={s.overallLine}>{`OVERALL ${overall}`}</Text>
                <DimMiniBars dims={verdict.dims} />
                <View style={{ gap: 3 }}>
                  {verdict.overallNotes.map((n) => (
                    <Text key={n} style={s.noteLine}>{`• ${n}`}</Text>
                  ))}
                </View>
              </View>
            );
          })}
          {chosen
            ? dedupeFlags(chosen.flags).map((f) => (
                <RuleFeedback key={f.ruleId} ruleId={f.ruleId} verdict={f.positive ? 'good' : 'bad'} short={f.note} openSources={openSources} />
              ))
            : null}
          {keyPoint ? (
            <View style={s.keyCard}>
              <Text style={s.keyHead}>{keyPoint.head}</Text>
              <Text style={s.keyBody}>{keyPoint.body}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

/* ── (D) over-under coil art ────────────────────────────────────────────── */
function CoilArt({ w, signs }: { w: number; signs: number[] }) {
  const h = Math.round(w * (150 / 360));
  const tint = CI_CLASS_TINTS.analog;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 150"
      accessibilityLabel={`Coil, training visualization: ${signs.length} of 6 loops made. Over loops lean one way, under loops mirror.`}
    >
      <Rect x={0} y={0} width={360} height={150} rx={10} fill="#0c0c10" />
      {/* cable lead-in from the connector */}
      <Rect x={4} y={110} width={13} height={13} rx={2} fill="#26262c" stroke="#6f7378" strokeWidth={1.2} />
      <Path d="M17 116 C48 116 66 100 88 92" stroke={tint} strokeWidth={4} fill="none" strokeLinecap="round" />
      {signs.length === 0 ? (
        <Ellipse cx={120} cy={76} rx={30} ry={42} fill="none" stroke="#3a3c42" strokeWidth={1.6} strokeDasharray="6,5" />
      ) : null}
      {signs.map((sign, i) => {
        const cx = 120 + i * 17;
        const cy = 76;
        const over = sign > 0;
        const newest = i === signs.length - 1;
        return (
          <G key={i} rotation={over ? 10 : -10} origin={`${cx}, ${cy}`}>
            <Ellipse cx={cx} cy={cy} rx={30} ry={42} fill="none" stroke={tint} strokeWidth={3.4} opacity={newest ? 1 : 0.78} />
            {over ? (
              <Path d={`M${cx - 8} ${cy - 45} q8 -7 16 0`} stroke="#9be8f2" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            ) : (
              <Path d={`M${cx - 8} ${cy + 45} q8 7 16 0`} stroke="#9be8f2" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            )}
          </G>
        );
      })}
      <SvgText x={180} y={143} fill="#6f7378" fontSize={7.5} textAnchor="middle">
        OVER LOOPS LEAN ONE WAY — UNDER LOOPS MIRROR
      </SvgText>
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function FloorScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const foh = CI_FLOOR_SCENARIOS.find((sc) => sc.id === 'foh-run')!;
  const back = CI_FLOOR_SCENARIOS.find((sc) => sc.id === 'backstage')!;

  const [craft, setCraft] = useState<Record<string, string>>({});
  const [fohPick, setFohPick] = useState<string | null>(null);
  const [backPick, setBackPick] = useState<string | null>(null);
  const [signs, setSigns] = useState<number[]>([]);
  const [coilMistakes, setCoilMistakes] = useState(0);
  const firedRef = useRef(completed);

  const artW = Math.max(160, width);

  /* A state */
  const craftAnswered = (id: string) => craft[id] != null;
  const craftOk = (d: CraftDecision) => d.options.find((o) => o.id === craft[d.id])?.ok === true;
  const craftDone = CRAFT_DECISIONS.every((d) => craftAnswered(d.id));
  const craftCorrect = CRAFT_DECISIONS.filter((d) => craftOk(d)).length;

  /* D state */
  const expectedSign = (i: number) => (i % 2 === 0 ? 1 : -1);
  const coilDone = signs.length === 6 && signs.every((v, i) => v === expectedSign(i));
  const coilFullWrong = signs.length === 6 && !coilDone;
  const twist = Math.abs(signs.reduce((a, b) => a + b, 0));
  const twistInfo =
    twist === 0
      ? { label: 'NONE — loops cancel', tint: colors.green, frac: 0.06 }
      : twist === 1
        ? { label: 'LOW', tint: colors.green, frac: 0.3 }
        : twist === 2
          ? { label: 'BUILDING', tint: colors.amber, frac: 0.6 }
          : { label: 'HIGH — will fight deployment', tint: '#ff9b8f', frac: Math.min(1, 0.55 + twist * 0.14) };
  const lastWrong =
    signs.length > 0 && signs.length < 6 && signs[signs.length - 1] !== expectedSign(signs.length - 1);
  const stepIdx = signs.length === 0 ? 0 : signs.length === 1 ? 1 : signs.length < 6 ? 2 : 3;

  const addLoop = (sign: 1 | -1) => {
    if (coilDone || signs.length >= 6) return;
    const i = signs.length;
    if (sign !== expectedSign(i)) setCoilMistakes((m) => m + 1);
    const nextSigns = [...signs, sign];
    setSigns(nextSigns);
    const t = Math.abs(nextSigns.reduce((a, b) => a + b, 0));
    AccessibilityInfo.announceForAccessibility(
      `Loop ${i + 1} of 6: ${sign > 0 ? 'over' : 'under'}. Twist ${t === 0 ? 'cancelled' : t >= 3 ? 'high' : t === 2 ? 'building' : 'low'}.`,
    );
  };
  const restartCoil = () => {
    if (signs.length === 0) return;
    setSigns([]);
    setCoilMistakes((m) => m + 1);
    AccessibilityInfo.announceForAccessibility('Coil shaken out — start again with a natural over loop.');
  };

  const pickCraft = (d: CraftDecision, o: CraftOption) => {
    if (craftAnswered(d.id)) return;
    setCraft((c) => ({ ...c, [d.id]: o.id }));
    AccessibilityInfo.announceForAccessibility(o.ok ? 'Good call.' : 'Not the professional call.');
  };

  const pickRoute = (which: 'foh' | 'back', id: string) => {
    if (which === 'foh') {
      if (fohPick != null) return;
      setFohPick(id);
    } else {
      if (backPick != null) return;
      setBackPick(id);
    }
    AccessibilityInfo.announceForAccessibility('Route selected — all three verdicts revealed below.');
  };

  /* completion */
  const allDone = craftDone && fohPick != null && backPick != null && coilDone;
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    const fohDims = evaluateRoute(foh.options.find((o) => o.id === fohPick)!).dims;
    const backDims = evaluateRoute(back.options.find((o) => o.id === backPick)!).dims;
    const safety = Math.round(((fohDims.safety ?? 100) + (backDims.safety ?? 100)) / 2);
    const protection = Math.round(((fohDims.protection ?? 100) + (backDims.protection ?? 100)) / 2);
    const coilQuality = Math.max(0.5, 1 - 0.1 * coilMistakes);
    const workmanship = Math.round((craftCorrect / 3) * 50 + coilQuality * 50);
    announceComplete('Stage 9 complete.');
    onComplete({ safety, protection, workmanship });
  }, [allDone, fohPick, backPick, coilMistakes, craftCorrect, foh, back, onComplete]);

  const checkParts = [
    { label: 'STAGE CRAFT', done: craftDone },
    { label: 'FOH RUN', done: fohPick != null },
    { label: 'BACKSTAGE', done: backPick != null },
    { label: 'COIL', done: coilDone },
  ];

  return (
    <View style={{ gap: 16 }}>
      {completed ? <Text style={s.replayNote}>✓ Stage already recorded complete — replay freely.</Text> : null}

      {/* (A) STAGE CRAFT */}
      <CiSection title="STAGE CRAFT — CLEAN UP THE DECK">
        <Text style={s.lead}>
          Soundcheck in an hour. The deck is as found: mic lines webbed across the performer lane, spare cable in loose
          loops, monitor feeds bare where feet cross. Make three calls — the plan redraws each part the professional way
          as you decide it.
        </Text>
        <StagePlan w={artW} routeFixed={craftAnswered('route')} slackFixed={craftAnswered('slack')} monFixed={craftAnswered('mon')} />
        <Text style={s.caption}>Training visualization — qualitative plan, training colors only; field cable colors vary.</Text>
        <View style={{ gap: 12 }}>
          {CRAFT_DECISIONS.map((d) => {
            const answered = craftAnswered(d.id);
            const chosen = d.options.find((o) => o.id === craft[d.id]);
            return (
              <View key={d.id} style={{ gap: 7 }}>
                <Text style={s.prompt}>{d.prompt}</Text>
                <View style={s.chipWrap}>
                  {d.options.map((o) => (
                    <OptionChip
                      key={o.id}
                      label={o.label}
                      active={craft[d.id] === o.id}
                      disabled={answered && craft[d.id] !== o.id}
                      onPress={() => pickCraft(d, o)}
                    />
                  ))}
                </View>
                {chosen ? (
                  <RuleFeedback ruleId="floor-stage-craft" verdict={chosen.ok ? 'good' : 'bad'} short={chosen.short} openSources={openSources} />
                ) : null}
              </View>
            );
          })}
        </View>
      </CiSection>

      {/* (B) FOH RUN */}
      <CiSection title="THE FOH RUN — PICK A ROUTE, THEN SEE ALL THREE JUDGED">
        <RouteBlock
          scenario={foh}
          width={artW}
          plan={(w) => <FohPlan w={w} />}
          pick={fohPick}
          onPick={(id) => pickRoute('foh', id)}
          openSources={openSources}
          keyPoint={{
            head: 'RAMP ≠ PERMISSION',
            body:
              'A cable ramp does not automatically make a crossing acceptable. The protector must suit the actual loads and traffic — and egress and accessibility requirements still apply to the route it sits in.',
          }}
        />
      </CiSection>

      {/* (C) BACKSTAGE */}
      <CiSection title="BACKSTAGE — CROSS THE LOAD-IN PATH">
        <RouteBlock
          scenario={back}
          width={artW}
          plan={(w) => <BackstagePlan w={w} />}
          pick={backPick}
          onPick={(id) => pickRoute('back', id)}
          openSources={openSources}
          keyPoint={{
            head: 'PROTECTION MATCHES THE TRAFFIC',
            body:
              'A mat is not load-rated protection. Where cases and forklifts roll, the crossing needs a vehicle-rated protector — deliberate, marked, and clear of the door swing.',
          }}
        />
      </CiSection>

      {/* (D) OVER-UNDER COILING */}
      <CiSection title="STRIKE — COIL THE SNAKE OVER-UNDER">
        <Text style={s.lead}>
          Coil the snake so it deploys straight tomorrow: alternate a natural OVER loop with a reversed UNDER loop, six
          loops total. Watch the coil — and the twist you are storing in the cable.
        </Text>
        <CoilArt w={artW} signs={signs} />
        {!coilDone && !coilFullWrong ? <Text style={s.coach}>{CI_OVERUNDER_STEPS[stepIdx]}</Text> : null}
        <Text style={s.loopCount} accessibilityLiveRegion="polite">{`LOOP ${signs.length} / 6`}</Text>
        <View
          style={s.twistRow}
          accessibilityLabel={`Twist stored in the cable: ${twistInfo.label}`}
          accessibilityLiveRegion="polite"
        >
          <Text style={s.twistLabel}>TWIST</Text>
          <View style={s.twistTrack}>
            <View style={[s.twistFill, { width: `${Math.round(twistInfo.frac * 100)}%`, backgroundColor: twistInfo.tint }]} />
          </View>
          <Text style={[s.twistReadout, { color: twistInfo.tint }]} numberOfLines={1}>
            {twistInfo.label}
          </Text>
        </View>
        {lastWrong ? <Text style={s.warnLine}>⚠ Twist is building — the next loop should be the reverse lay.</Text> : null}
        <View style={s.loopBtnRow}>
          <Pressable
            style={[s.loopBtn, (coilDone || signs.length >= 6) && s.loopBtnOff]}
            disabled={coilDone || signs.length >= 6}
            onPress={() => addLoop(1)}
            accessibilityRole="button"
            accessibilityLabel="Over loop — natural lay"
          >
            <Text style={s.loopBtnText}>OVER LOOP</Text>
            <Text style={s.loopBtnSub}>natural lay — palm over</Text>
          </Pressable>
          <Pressable
            style={[s.loopBtn, (coilDone || signs.length >= 6) && s.loopBtnOff]}
            disabled={coilDone || signs.length >= 6}
            onPress={() => addLoop(-1)}
            accessibilityRole="button"
            accessibilityLabel="Under loop — reverse, roll the wrist"
          >
            <Text style={s.loopBtnText}>UNDER LOOP</Text>
            <Text style={s.loopBtnSub}>reverse — roll the wrist</Text>
          </Pressable>
        </View>
        {coilFullWrong ? (
          <View style={s.coilFailCard}>
            <Text style={s.coilFailText}>
              ✕ This coil is storing twist — it will deploy in loops and kinks. Shake it out and start again, alternating
              from a natural OVER loop.
            </Text>
            <Pressable style={s.restartBtn} onPress={restartCoil} accessibilityRole="button" accessibilityLabel="Restart the coil">
              <Text style={s.restartText}>RESTART THE COIL</Text>
            </Pressable>
          </View>
        ) : null}
        {!coilDone && !coilFullWrong && signs.length > 0 ? (
          <Pressable onPress={restartCoil} hitSlop={10} accessibilityRole="button" accessibilityLabel="Restart the coil">
            <Text style={s.restartLink}>↺ RESTART THE COIL</Text>
          </Pressable>
        ) : null}
        {coilDone ? (
          <View style={{ gap: 8 }}>
            <Text style={s.doneLine}>✓ Over, under, over, under — this coil pays out straight.</Text>
            <RuleFeedback
              ruleId="floor-overunder"
              verdict="info"
              short="Over-under cancels the twist each loop adds — the coil deploys straight and the cable keeps its behavior. Specialized fiber, hybrid and large feeder cable follow the manufacturer's procedure instead."
              openSources={openSources}
            />
          </View>
        ) : null}
      </CiSection>

      <Text style={[s.checkLine, allDone && { color: colors.green }]} accessibilityLiveRegion="polite">
        {checkParts.map((p) => `${p.done ? '✓' : '○'} ${p.label}`).join('   ')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  replayNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.green },
  prompt: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19, color: colors.textPrimary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    minHeight: 56,
  },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  routeName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary, flexShrink: 1 },
  routePath: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  verdictCard: { gap: 8, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  verdictCardPicked: { borderColor: 'rgba(255,198,77,.6)' },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeBest: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.green },
  badgePick: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.amber },
  overallLine: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.amberLabel },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLabel: { width: 118, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.3, color: colors.textSub },
  miniTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#26262c', overflow: 'hidden' },
  miniFill: { height: 6, borderRadius: 3 },
  miniVal: { width: 26, textAlign: 'right', fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSecondary },
  noteLine: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub },
  keyCard: { gap: 5, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  keyHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  keyBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  coach: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.amberLabel, fontStyle: 'italic' },
  loopCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  twistRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  twistLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSecondary },
  twistTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#26262c', overflow: 'hidden' },
  twistFill: { height: 10, borderRadius: 5 },
  twistReadout: { maxWidth: 150, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.4 },
  warnLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: '#ff9b8f' },
  loopBtnRow: { flexDirection: 'row', gap: 10 },
  loopBtn: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(79,208,224,.5)',
    backgroundColor: '#0f1a1d',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  loopBtnOff: { opacity: 0.45 },
  loopBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: '#9be8f2' },
  loopBtnSub: { fontFamily: fonts.barlowRegular, fontSize: 11, color: colors.textSub },
  coilFailCard: { gap: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#ff9b8f', backgroundColor: '#1a1210', padding: 12 },
  coilFailText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: '#ff9b8f' },
  restartBtn: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingHorizontal: 16,
  },
  restartText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textPrimary },
  restartLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub, paddingVertical: 6 },
  doneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.green },
  checkLine: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6, color: colors.amberLabel },
});
