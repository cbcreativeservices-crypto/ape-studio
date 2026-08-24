/**
 * STAGE 8 — Ceiling & Overhead Installations (spec §32).
 *
 * One suspended-ceiling CUTAWAY (structural deck + joists, hanger wires, grid
 * + tiles, ductwork, sprinkler main with heads, conduit, a light fixture, a
 * cable tray section, J-hooks) with the owner-spec visibility toggle:
 * FINISHED VIEW (the room from below — clean ceiling, nothing visible) vs
 * ABOVE CEILING (the cutaway with everything). Default ABOVE for the
 * exercises; flipping shows exactly why X-ray understanding matters.
 *
 * EXERCISE 1 — FIND THE PROBLEMS: the 8 CI_CEILING_DEFECTS drawn at their
 * data positions as visibly-wrong details; tappable ≥44dp markers plus the
 * accessible SUSPECT LIST alternative. 6 of 8 required to continue.
 * EXERCISE 2 — INSTALL THE ROUTE: the SpecCard ritual (the SYSTEM's criteria
 * are supplied — never folklore), then pathway choice → J-hook placement on a
 * 12-unit span to the supplied spec → confirm. The bundle draws through
 * tray + hooks with honest sag between supports, gentle bends, clear of the
 * utilities, entering the far wall through a bushed sleeve.
 *
 * Completion: both exercises → onComplete({ safety, routing, protection,
 * serviceability }), fired once. A11y: labeled buttons, announced verdicts,
 * replay via `completed`. Training visualization — honest geometry only.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, lessonStyles } from '../../cable/lessons/bits';
import { CiSection, FindProgress, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { mistakeById } from '../data/mistakes';
import { CI_CEILING_DEFECTS, CI_CEILING_INSTALL_STEPS, CI_SUPPORT_SPACING_SPEC } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

const VB_W = 360;
const VB_H = 220;
const FIND_REQUIRED = 6;

/* Exercise 2 span: tray end → far-wall sleeve = 12 grid units. */
const SPAN_X0 = 178;
const SPAN_UNITS = 12;
const UNIT_PX = 13;
const SPEC_MAX_GAP = 4; // from CI_SUPPORT_SPACING_SPEC — "supports every 4 units"
const HOOK_SLOTS = Array.from({ length: SPAN_UNITS - 1 }, (_, i) => i + 1); // U1..U11

const PATH_OPTS: { id: string; label: string; good: boolean; short: string }[] = [
  {
    id: 'tray',
    label: 'Tray across its span, then J-hooks on to the wall sleeve',
    good: true,
    short: 'Tray where it exists, purpose-built hooks beyond — every foot supported from structure.',
  },
  {
    id: 'tiles',
    label: 'Lay the bundle across the ceiling tiles',
    good: false,
    short: 'Tiles are a finish system, not a support — where the electrical code is adopted this is a violation, and defect #1 out there shows how it ends.',
  },
  {
    id: 'duct',
    label: 'Tie it along the supply duct — it heads the right way',
    good: false,
    short: 'The duct is another trade\'s system, never a cable support — and every duct service call now starts by cutting your bundle free.',
  },
];

/** Honest catenary-ish polyline through support points: each span dips in
 *  proportion to its length (drawn sag — never a magic straight line). */
function sagPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dip = Math.min(12, (b.x - a.x) * 0.09);
    d += ` Q${(a.x + b.x) / 2} ${Math.max(a.y, b.y) + dip * 2} ${b.x} ${b.y}`;
  }
  return d;
}

/* ── the cutaway (ABOVE CEILING view) ───────────────────────────────────── */
function AboveSvg({
  w,
  found,
  hooks,
  showTicks,
  confirmed,
}: {
  w: number;
  found: Set<string>;
  hooks: Set<number>;
  showTicks: boolean;
  confirmed: boolean;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const hookXs = [...hooks].sort((a, b) => a - b).map((u) => SPAN_X0 + u * UNIT_PX);
  const bundlePts = [{ x: SPAN_X0, y: 125 }, ...hookXs.map((x) => ({ x, y: 123 })), { x: 326, y: 100 }];
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel="Above-ceiling cutaway: structural deck and joists on top, hanger wires, duct, sprinkler main with heads, conduit, cable tray, J-hooks, light fixture, and the grid with tiles at the bottom. Eight suspect details are marked."
    >
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={10} fill="#131318" />

      {/* structural deck + joists */}
      <Rect x={0} y={4} width={VB_W} height={10} fill="#1d1d24" />
      {[16, 44, 72, 100, 128, 156, 184, 212, 240, 268, 296, 324, 352].map((x) => (
        <Line key={x} x1={x} y1={13} x2={x + 7} y2={5} stroke="#2c2c33" strokeWidth={1} />
      ))}
      {[20, 80, 140, 200, 260, 320].map((x) => (
        <Rect key={x} x={x - 3} y={14} width={6} height={14} fill="#22222a" />
      ))}

      {/* far wall (the destination) */}
      <Rect x={336} y={14} width={18} height={150} fill="#1b1b22" stroke="#2c2c33" strokeWidth={1} />

      {/* hanger wires */}
      {[50, 110, 170, 230, 290].map((x) => (
        <Line key={x} x1={x} y1={28} x2={x} y2={162} stroke="#34343c" strokeWidth={0.8} />
      ))}

      {/* ductwork (hung from structure) */}
      <Line x1={30} y1={28} x2={30} y2={78} stroke="#3a3c42" strokeWidth={1.4} />
      <Line x1={100} y1={28} x2={100} y2={78} stroke="#3a3c42" strokeWidth={1.4} />
      <Rect x={12} y={78} width={108} height={26} fill="#1a1a21" stroke="#3a3c42" strokeWidth={1.4} />
      <Line x1={12} y1={91} x2={120} y2={91} stroke="#26262c" strokeWidth={1} />

      {/* sprinkler main + heads (life-safety — red) */}
      <Line x1={200} y1={28} x2={200} y2={84} stroke="#3a3c42" strokeWidth={1.2} />
      <Line x1={310} y1={28} x2={310} y2={84} stroke="#3a3c42" strokeWidth={1.2} />
      <Line x1={126} y1={84} x2={336} y2={84} stroke="#ff5a48" strokeWidth={3.5} />
      {[204, 258, 316].map((x) => (
        <Path key={x} d={`M${x} 84 L${x} 164`} stroke="#ff5a48" strokeWidth={1.6} />
      ))}
      {[204, 258, 316].map((x) => (
        <Circle key={x} cx={x} cy={168.5} r={2.6} fill="#ff5a48" />
      ))}

      {/* conduit (someone else's system) */}
      {[180, 260, 330].map((x) => (
        <Line key={x} x1={x} y1={28} x2={x} y2={44} stroke="#3a3c42" strokeWidth={1.2} />
      ))}
      <Line x1={150} y1={44} x2={336} y2={44} stroke="#6f7378" strokeWidth={3.5} />
      <Line x1={150} y1={44} x2={336} y2={44} stroke="#101014" strokeWidth={1} />

      {/* cable tray section (trapeze-hung), legitimately carrying runs */}
      <Line x1={70} y1={28} x2={70} y2={116} stroke="#3a3c42" strokeWidth={1.4} />
      <Line x1={170} y1={28} x2={170} y2={116} stroke="#3a3c42" strokeWidth={1.4} />
      <Rect x={60} y={116} width={120} height={3} fill="#3a3c42" />
      <Rect x={60} y={130} width={120} height={3} fill="#3a3c42" />
      {[66, 78, 90, 102, 114, 126, 138, 150, 162, 174].map((x) => (
        <Line key={x} x1={x} y1={119} x2={x} y2={130} stroke="#2c2c33" strokeWidth={1} />
      ))}
      <Line x1={64} y1={124} x2={177} y2={124} stroke="#4fd0e0" strokeWidth={1.6} opacity={0.7} />
      <Line x1={64} y1={127} x2={177} y2={127} stroke="#37d97b" strokeWidth={1.6} opacity={0.7} />

      {/* light fixture recessed in the grid */}
      <Rect x={88} y={146} width={44} height={18} fill="#1c1c23" stroke="#3a3c42" strokeWidth={1.2} />
      <Rect x={90} y={164} width={40} height={4} fill="#fff3c2" opacity={0.75} />

      {/* grid + tiles + a sliver of the room */}
      <Line x1={0} y1={164} x2={336} y2={164} stroke="#4a4a52" strokeWidth={2} />
      {[2, 60, 118, 176, 234, 292].map((x) => (
        <Rect key={x} x={x} y={166} width={x === 292 ? 42 : 54} height={8} fill="#1f1f26" stroke="#15151a" strokeWidth={1} />
      ))}
      <Rect x={0} y={176} width={VB_W} height={44} fill="#0d0d10" />

      {/* ── the previous contractor's wrongs (Exercise 1 defects) ─────────── */}
      {/* cd-6 overstuffed J-hook (high trapeze hook) */}
      <Line x1={194} y1={28} x2={194} y2={58} stroke="#3a3c42" strokeWidth={1.2} />
      <Path d="M189 58 V68 Q189 74 196 74 H200" stroke="#b9bcc2" strokeWidth={2} fill="none" />
      <Path d="M186 64 Q194 54 202 64 Q194 72 186 64" stroke="#4fd0e0" strokeWidth={2.2} fill="none" />
      <Path d="M187 68 Q194 58 201 68 Q194 76 187 68" stroke="#37d97b" strokeWidth={2.2} fill="none" />
      <Path d="M188 60 Q194 68 200 60" stroke="#c77dff" strokeWidth={2} fill="none" />

      {/* run leaving the crammed hook LEFT: drapes the sprinkler main (cd-2),
          lands on the light housing (cd-4), ends lying on the tiles (cd-1) */}
      <Path
        d="M190 70 Q172 72 162 80 Q158 82 154 88 Q146 100 138 112 Q122 134 112 146 Q98 148 84 152 Q70 156 62 161 Q48 168 36 163 Q30 160 28 161"
        stroke="#4fd0e0"
        strokeWidth={2.6}
        fill="none"
      />
      <Rect x={22} y={158} width={7} height={6} rx={1} fill="#26262c" stroke="#6f7378" strokeWidth={0.8} />

      {/* run leaving the hook RIGHT: hard 90° fold (cd-5) into an unmarked
          wall penetration (cd-7) */}
      <Path d="M198 72 Q224 84 248 94 Q264 98 274 97 L274 106 L334 106" stroke="#4fd0e0" strokeWidth={2.6} fill="none" />
      <Path d="M330 99 L344 97 L346 112 L332 114 Z" fill="#0b0b0e" stroke="#55555e" strokeWidth={1.2} />

      {/* cd-3: lone cable sagging deep between tray end and a far J-hook */}
      <Line x1={300} y1={28} x2={300} y2={110} stroke="#3a3c42" strokeWidth={1.2} />
      <Path d="M295 110 V118 Q295 124 302 124 H306" stroke="#b9bcc2" strokeWidth={2} fill="none" />
      <Path d="M180 120 Q240 148 297 120" stroke="#37d97b" strokeWidth={2.6} fill="none" />
      <Path d="M297 120 L300 116 L300 40" stroke="#37d97b" strokeWidth={2} fill="none" />
      <Rect x={294} y={32} width={12} height={8} rx={1.5} fill="#1c1c23" stroke="#3a3c42" strokeWidth={1} />

      {/* cd-8: service loop tied high above the rigid duct — unreachable */}
      <Path d="M2 42 Q20 48 34 58" stroke="#37d97b" strokeWidth={2.4} fill="none" />
      <Circle cx={43} cy={66} r={10} fill="none" stroke="#37d97b" strokeWidth={2.4} />
      <Circle cx={43} cy={66} r={6.5} fill="none" stroke="#37d97b" strokeWidth={2} />
      <Line x1={43} y1={54} x2={43} y2={58} stroke="#e8e8ea" strokeWidth={1.6} />
      <Path d="M52 72 Q60 92 60 116" stroke="#37d97b" strokeWidth={2.4} fill="none" />

      {/* ── Exercise 2: the learner's install ─────────────────────────────── */}
      {/* far-wall sleeve (the intended, bushed entry) */}
      <Rect x={330} y={92} width={14} height={8} rx={2} fill="#101014" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={331} cy={96} r={5} fill="none" stroke={confirmed ? colors.green : '#6f7378'} strokeWidth={1.8} />

      {/* unit tick marks while placing supports */}
      {showTicks
        ? HOOK_SLOTS.map((u) => {
            const x = SPAN_X0 + u * UNIT_PX;
            return <Line key={u} x1={x} y1={132} x2={x} y2={138} stroke={hooks.has(u) ? colors.amber : '#34343c'} strokeWidth={hooks.has(u) ? 2 : 1.2} />;
          })
        : null}

      {/* placed J-hooks (rod from structure + hook) */}
      {hookXs.map((x) => (
        <Path key={x} d={`M${x} 28 V110 M${x - 5} 110 V119 Q${x - 5} 126 ${x + 2} 126 H${x + 6}`} stroke="#b9bcc2" strokeWidth={1.8} fill="none" />
      ))}

      {/* the confirmed bundle: tray → hooks with honest sag → bushed sleeve */}
      {confirmed ? (
        <>
          <Path d="M4 146 Q36 142 60 127 L178 125" stroke="#c77dff" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d={`${sagPath(bundlePts)} Q330 98 332 96 L342 96`} stroke="#c77dff" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      ) : null}

      {/* Exercise 1 markers at the data positions */}
      {CI_CEILING_DEFECTS.map((d) => {
        const px = (d.x / 100) * VB_W;
        const py = (d.y / 100) * VB_H;
        const isFound = found.has(d.id);
        return isFound ? (
          <Circle key={d.id} cx={px} cy={py} r={11} fill="rgba(55,224,95,.12)" stroke={colors.green} strokeWidth={2} />
        ) : (
          <Circle key={d.id} cx={px} cy={py} r={11} fill="rgba(255,255,255,.02)" stroke="#6f7378" strokeWidth={1.3} strokeDasharray="3 4" />
        );
      })}
      {CI_CEILING_DEFECTS.filter((d) => found.has(d.id)).map((d) => (
        <SvgText key={d.id} x={(d.x / 100) * VB_W} y={(d.y / 100) * VB_H + 3.5} fill={colors.green} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          ✓
        </SvgText>
      ))}
    </Svg>
  );
}

/* ── the room from below (FINISHED VIEW) — deliberately boring ──────────── */
function FinishedSvg({ w }: { w: number }) {
  const h = Math.round((w * VB_H) / VB_W);
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel="Finished room view: a clean suspended ceiling with tiles, one light fixture and sprinkler heads. Nothing above it is visible."
    >
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={10} fill="#101014" />
      {/* ceiling plane */}
      <Rect x={12} y={36} width={336} height={10} fill="#1c1c22" stroke="#26262c" strokeWidth={1} />
      {[68, 124, 180, 236, 292].map((x) => (
        <Line key={x} x1={x} y1={36} x2={x} y2={46} stroke="#101014" strokeWidth={1.6} />
      ))}
      {/* light lens + sprinkler heads — all the room ever sees */}
      <Rect x={96} y={38} width={44} height={7} fill="#fff3c2" opacity={0.85} />
      {[204, 316].map((x) => (
        <Circle key={x} cx={x} cy={49} r={2.6} fill="#9aa0a6" />
      ))}
      {/* walls + floor */}
      <Line x1={12} y1={46} x2={12} y2={196} stroke="#26262c" strokeWidth={2} />
      <Line x1={348} y1={46} x2={348} y2={196} stroke="#26262c" strokeWidth={2} />
      <Line x1={12} y1={196} x2={348} y2={196} stroke="#2c2c33" strokeWidth={2} />
      <Rect x={300} y={120} width={12} height={18} rx={1.5} fill="#17171c" stroke="#3a3c42" strokeWidth={1} />
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function CeilingScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const allIds = CI_CEILING_DEFECTS.map((d) => d.id);
  const [view, setView] = useState<'above' | 'finished'>('above');
  const [found, setFound] = useState<Set<string>>(() => new Set(completed ? allIds : []));
  const [lastFind, setLastFind] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [ex1Done, setEx1Done] = useState(completed);
  const [pathPick, setPathPick] = useState<string | null>(completed ? 'tray' : null);
  const [hooks, setHooks] = useState<Set<number>>(() => new Set(completed ? [4, 8] : []));
  const [spacing, setSpacing] = useState<{ ok: boolean; maxGap: number; extra: boolean } | null>(
    completed ? { ok: true, maxGap: SPEC_MAX_GAP, extra: false } : null,
  );
  const [confirmed, setConfirmed] = useState(completed);
  const [fired, setFired] = useState(completed);
  const wrongs = useRef({ path: 0, spacing: 0 });

  const say = (t: string) => AccessibilityInfo.announceForAccessibility(t);

  const pathSolved = pathPick === 'tray';
  const pathOpt = PATH_OPTS.find((o) => o.id === pathPick);
  const allDone = ex1Done && pathSolved && spacing?.ok === true && confirmed;

  useEffect(() => {
    if (fired || !allDone) return;
    setFired(true);
    announceComplete('Stage 8 complete.');
    onComplete({
      safety: clamp100(60 + found.size * 5),
      routing: clamp100(100 - 12 * wrongs.current.path - 8 * wrongs.current.spacing),
      protection: clamp100(100 - 6 * wrongs.current.path - 8 * wrongs.current.spacing),
      serviceability: clamp100(70 + (found.has('cd-8') ? 15 : 0) + 15),
    });
  }, [allDone, fired, found, onComplete]);

  /* Exercise 1 */
  const find = (id: string) => {
    if (found.has(id)) return;
    const defect = CI_CEILING_DEFECTS.find((d) => d.id === id);
    const m = defect ? mistakeById(defect.mistakeId) : undefined;
    setFound((s) => new Set(s).add(id));
    setLastFind(id);
    if (m) say(`Found. ${m.shortFeedback}`);
  };
  const lastDefect = lastFind ? CI_CEILING_DEFECTS.find((d) => d.id === lastFind) : undefined;
  const lastMistake = lastDefect ? mistakeById(lastDefect.mistakeId) : undefined;

  /* Exercise 2 */
  const pickPath = (o: (typeof PATH_OPTS)[number]) => {
    if (pathSolved) return;
    setPathPick(o.id);
    if (!o.good) wrongs.current.path += 1;
    say(`${o.good ? 'Correct pathway.' : 'Not a pathway.'} ${o.short}`);
  };
  const toggleHook = (u: number) => {
    if (confirmed) return;
    setSpacing(null);
    setHooks((s) => {
      const n = new Set(s);
      if (n.has(u)) n.delete(u);
      else n.add(u);
      return n;
    });
  };
  const checkSpacing = () => {
    const pts = [0, ...[...hooks].sort((a, b) => a - b), SPAN_UNITS];
    let maxGap = 0;
    for (let i = 1; i < pts.length; i++) maxGap = Math.max(maxGap, pts[i] - pts[i - 1]);
    const ok = maxGap <= SPEC_MAX_GAP;
    const extra = ok && hooks.size > Math.ceil(SPAN_UNITS / SPEC_MAX_GAP) - 1;
    setSpacing({ ok, maxGap, extra });
    if (!ok) wrongs.current.spacing += 1;
    say(ok ? 'Spacing meets the supplied specification.' : `Widest span is ${maxGap} units — the supplied spec says every ${SPEC_MAX_GAP}.`);
  };
  const confirmRoute = () => {
    if (confirmed || spacing?.ok !== true) return;
    setConfirmed(true);
    say('Route confirmed. The bundle runs through tray and hooks with honest sag, clear of the utilities, into the bushed sleeve.');
  };

  const steps = CI_CEILING_INSTALL_STEPS;
  const stepDone = [pathSolved, spacing?.ok === true, confirmed, confirmed, confirmed];
  const currentStep = stepDone.findIndex((d) => !d);

  const artW = Math.max(160, width);
  const artH = Math.round((artW * VB_H) / VB_W);

  return (
    <View style={{ gap: 14 }}>
      {/* view toggle — the owner-spec visibility feature */}
      <View style={lessonStyles.chipWrap}>
        <OptionChip
          label="ABOVE CEILING"
          active={view === 'above'}
          onPress={() => {
            setView('above');
            say('Above ceiling view.');
          }}
        />
        <OptionChip
          label="FINISHED VIEW"
          active={view === 'finished'}
          onPress={() => {
            setView('finished');
            say('Finished view. From the room, none of the overhead work is visible.');
          }}
        />
      </View>

      <View style={{ width: artW, height: artH }}>
        {view === 'above' ? (
          <AboveSvg w={artW} found={found} hooks={hooks} showTicks={pathSolved && !confirmed} confirmed={confirmed} />
        ) : (
          <FinishedSvg w={artW} />
        )}
        {/* ≥44dp tap overlays for the defect markers */}
        {view === 'above'
          ? CI_CEILING_DEFECTS.map((d, i) => {
              const isFound = found.has(d.id);
              return (
                <Pressable
                  key={d.id}
                  onPress={() => find(d.id)}
                  disabled={isFound}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isFound }}
                  accessibilityLabel={isFound ? `Found: ${d.label}` : `Suspect detail ${i + 1} of ${CI_CEILING_DEFECTS.length}`}
                  style={{
                    position: 'absolute',
                    left: (d.x / 100) * artW - 22,
                    top: (d.y / 100) * artH - 22,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                  }}
                />
              );
            })
          : null}
      </View>
      <Text style={styles.legend}>
        {view === 'above'
          ? 'Deck + joists · hanger wires · duct · sprinkler main (with heads) · conduit · tray · J-hooks · light · grid + tiles.'
          : 'Clean. Silent. And carrying every one of those violations — which is exactly why above-ceiling work gets skipped, and why inspectors lift tiles.'}
      </Text>

      {/* EXERCISE 1 — FIND THE PROBLEMS */}
      <CiSection title="EXERCISE 1 · FIND THE PROBLEMS">
        <Text style={styles.lead}>
          A previous contractor was up here. Eight details are wrong — tap the marked areas (or use the suspect list).
        </Text>
        <FindProgress found={found.size} required={FIND_REQUIRED} total={CI_CEILING_DEFECTS.length} />
        {lastDefect && lastMistake ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.foundLine}>FOUND — {lastDefect.label}</Text>
            <RuleFeedback ruleId={lastMistake.ruleId} verdict="bad" short={lastMistake.shortFeedback} openSources={openSources} />
          </View>
        ) : null}
        <OptionChip
          label={listOpen ? '▾ SUSPECT LIST (ACCESSIBLE ALTERNATIVE)' : '▸ SUSPECT LIST (ACCESSIBLE ALTERNATIVE)'}
          active={listOpen}
          onPress={() => setListOpen((o) => !o)}
        />
        {listOpen ? (
          <View style={{ gap: 6 }}>
            {CI_CEILING_DEFECTS.map((d) => {
              const isFound = found.has(d.id);
              return (
                <Pressable
                  key={d.id}
                  onPress={() => find(d.id)}
                  disabled={isFound}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isFound }}
                  accessibilityLabel={`${d.label}${isFound ? ', found' : ''}`}
                  style={[styles.suspectRow, isFound && styles.suspectRowFound]}
                >
                  <Text style={[styles.suspectText, isFound && { color: colors.green }]}>
                    {isFound ? '✓ ' : '□ '}
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {!ex1Done ? (
          <OptionChip
            label={found.size >= FIND_REQUIRED ? 'CONTINUE TO THE INSTALL ›' : `FIND ${FIND_REQUIRED - found.size} MORE TO CONTINUE`}
            action
            disabled={found.size < FIND_REQUIRED}
            onPress={() => {
              setEx1Done(true);
              say('Exercise two: install the route.');
            }}
          />
        ) : null}
      </CiSection>

      {/* EXERCISE 2 — INSTALL THE ROUTE */}
      {ex1Done ? (
        <CiSection title="EXERCISE 2 · INSTALL THE ROUTE">
          <Text style={styles.lead}>
            Now do it right: a new bundle from the equipment room to the far wall. First, the ritual — the SYSTEM’s
            criteria are supplied, never folklore:
          </Text>
          <SpecCard text={CI_SUPPORT_SPACING_SPEC} />
          <View style={{ gap: 4 }}>
            {steps.map((s, i) => (
              <Text key={s} style={[styles.stepLine, stepDone[i] && { color: colors.green }, i === currentStep && { color: colors.amber }]}>
                {stepDone[i] ? '✓' : i === currentStep ? '▸' : '·'} {s}
              </Text>
            ))}
          </View>

          {/* step 1 — pathway */}
          <Text style={styles.qLabel}>1 · PICK THE PATHWAY / SUPPORT:</Text>
          <View style={{ gap: 7 }}>
            {PATH_OPTS.map((o) => (
              <OptionChip key={o.id} label={o.label} active={pathPick === o.id} disabled={pathSolved && pathPick !== o.id} onPress={() => pickPath(o)} />
            ))}
          </View>
          {pathOpt ? <RuleFeedback ruleId="ceil-independent-support" verdict={pathOpt.good ? 'good' : 'bad'} short={pathOpt.short} openSources={openSources} /> : null}

          {/* step 2 — supports to the supplied spec */}
          {pathSolved ? (
            <>
              <Text style={styles.qLabel}>2 · PLACE J-HOOKS ON THE 12-UNIT SPAN:</Text>
              <Text style={styles.hint}>
                Tap unit positions to place hooks. The tray end (U0) and the wall sleeve (U12) already count as supports.
              </Text>
              <View style={lessonStyles.chipWrap}>
                {HOOK_SLOTS.map((u) => (
                  <OptionChip key={u} label={`U${u}`} active={hooks.has(u)} disabled={confirmed} onPress={() => toggleHook(u)} />
                ))}
              </View>
              {!confirmed ? <OptionChip label={`CHECK SPACING (${hooks.size} placed)`} action onPress={checkSpacing} /> : null}
              {spacing ? (
                <RuleFeedback
                  ruleId="ceil-span-sag"
                  verdict={spacing.ok ? 'good' : 'bad'}
                  short={
                    spacing.ok
                      ? `Every span is ${SPEC_MAX_GAP} units or less — the run meets the supplied system spec.`
                      : `Widest span is ${spacing.maxGap} units — the supplied spec says a support every ${SPEC_MAX_GAP}. Real cable would sag past the limit there.`
                  }
                  openSources={openSources}
                />
              ) : null}
              {spacing?.extra ? (
                <Text style={styles.hint}>More hardware than the spec needs — compliant, but every extra hook is cost and congestion.</Text>
              ) : null}
            </>
          ) : null}

          {/* step 3 — confirm: the bundle draws with honest sag */}
          {spacing?.ok && !confirmed ? <OptionChip label="CONFIRM THE ROUTE ✓" action onPress={confirmRoute} /> : null}
          {confirmed ? (
            <RuleFeedback
              ruleId="ceil-maintain-access"
              verdict="good"
              short="Honest sag inside the given spec, gentle bends, clear of the sprinkler, the duct and the light — and it enters the wall through a bushed sleeve. Every tile still lifts; the next technician can reach all of it."
              openSources={openSources}
            />
          ) : null}
        </CiSection>
      ) : null}

      {fired ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneHead}>✓ STAGE 8 COMPLETE</Text>
          <Text style={styles.doneBody}>
            You found {found.size} of {CI_CEILING_DEFECTS.length} violations, then installed the route the professional
            way: independent supports from structure, spaced to the supplied system’s criteria — flip to FINISHED VIEW
            and remember that all of this rides above every clean ceiling.
          </Text>
        </View>
      ) : null}

      <Text style={styles.tintNote}>
        Training visualization — colors identify systems and classes here (sprinkler red, existing runs cyan/green, your
        bundle violet); actual field colors vary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub },
  foundLine: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary },
  suspectRow: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suspectRowFound: { borderColor: 'rgba(55,224,95,.4)' },
  suspectText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  qLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amberLabel, marginTop: 2 },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub, fontStyle: 'italic' },
  stepLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  doneCard: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10', padding: 12 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.green },
  doneBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
});
