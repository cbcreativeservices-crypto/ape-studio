/**
 * STAGE 5 — Cable Supports & Pathways (spec §"supports" · registry m_supports).
 *
 * Three parts:
 *   A · ROLES — SUPPORT / PATHWAY / PROTECTION / MANAGEMENT as four cards
 *       (rule 'sup-roles'): one component can do several jobs, but hardware is
 *       chosen by the job it must do.
 *   B · THE SORT — CI_SUPPORT_ITEMS one at a time (shuffled once per mount by
 *       a deterministic index-scramble — no Math.random), each drawn as an
 *       honest SVG pictogram with APPROVE / REJECT ("Would you hang cable on
 *       this?"). Immediate RuleFeedback from the item's rule; role chips shown
 *       for approved hardware; running score line. Pass at ≥ 80% correct.
 *   C · SPACING RITUAL — CI_SUPPORT_SPACING_SPEC SpecCard first (check the
 *       documentation), then a 12-unit span with 5 candidate positions (tap to
 *       place/remove; each position is an accessible toggle button). The given
 *       spec = supports every 4 grid units → correct = positions at 4 and 8.
 *       Sag draws live between anchors; spans past the limit draw strained.
 *       CHECK → RuleFeedback('sup-spacing-mfr').
 *
 * Completion (once): sort ≥ 80% + spacing exercise passed →
 * onComplete({ routing, protection }).
 *
 * Accessibility: every interaction is a labeled button (no drag anywhere);
 * verdicts announced; state never color-only; targets ≥44dp.
 */
import { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { CI_SUPPORT_ITEMS, CI_SUPPORT_SPACING_SPEC } from '../data/scenarios';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

const say = (s: string) => AccessibilityInfo.announceForAccessibility(s);

/* ── deterministic shuffle (stable per mount; no Math.random anywhere) ──── */
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function scrambleOrder(n: number, salt: number): number[] {
  const step = [7, 11, 13, 5, 3, 2, 1].find((s) => gcd(s, n) === 1) ?? 1;
  const offset = (((salt * 5 + 3) % n) + n) % n;
  return Array.from({ length: n }, (_, i) => (offset + i * step) % n);
}

/* ── honest pictograms for the sort (neutral grays — never verdict-tinted) ─ */
const IC = '#a7adb5'; // hardware stroke
const IC_DIM = '#6f7378'; // cable circles / secondary
const SW = 3;

function SupportIcon({ id, w }: { id: string; w: number }) {
  const h = Math.round((w * 72) / 96);
  const common = { width: w, height: h, viewBox: '0 0 96 72' } as const;
  const frame = <Rect x={0} y={0} width={96} height={72} rx={8} fill="#0e0e12" stroke="#232329" strokeWidth={1} />;
  const cable = (cx: number, cy: number, r = 4) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={IC_DIM} />;
  switch (id) {
    case 'jhook':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={30} y={4} width={12} height={6} rx={1.5} fill="none" stroke={IC} strokeWidth={2} />
          <Path d="M36 10 V38 a15 15 0 0 0 30 0 v-8" stroke={IC} strokeWidth={SW} fill="none" strokeLinecap="round" />
          {cable(45, 45)}
          {cable(53, 46)}
          {cable(49, 39)}
        </Svg>
      );
    case 'tray':
      return (
        <Svg {...common}>
          {frame}
          <Path d="M10 24 v26 h76 v-26" stroke={IC} strokeWidth={SW} fill="none" strokeLinecap="round" />
          {cable(26, 44, 5)}
          {cable(40, 44, 5)}
          {cable(54, 44, 5)}
          {cable(68, 44, 5)}
        </Svg>
      );
    case 'ladder':
      return (
        <Svg {...common}>
          {frame}
          <Line x1={30} y1={8} x2={30} y2={64} stroke={IC} strokeWidth={SW} strokeLinecap="round" />
          <Line x1={66} y1={8} x2={66} y2={64} stroke={IC} strokeWidth={SW} strokeLinecap="round" />
          {[16, 28, 40, 52].map((y) => (
            <Line key={y} x1={30} y1={y} x2={66} y2={y} stroke={IC} strokeWidth={2.4} />
          ))}
        </Svg>
      );
    case 'basket':
      return (
        <Svg {...common}>
          {frame}
          <Path d="M14 24 v22 a8 8 0 0 0 8 8 h52 a8 8 0 0 0 8 -8 v-22" stroke={IC} strokeWidth={2.2} fill="none" />
          {[26, 38, 50, 62, 74].map((x) => (
            <Line key={x} x1={x} y1={24} x2={x} y2={52} stroke={IC} strokeWidth={1.5} />
          ))}
          <Line x1={14} y1={40} x2={82} y2={40} stroke={IC} strokeWidth={1.5} />
        </Svg>
      );
    case 'conduit':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={8} y={30} width={80} height={14} rx={7} fill="none" stroke={IC} strokeWidth={SW} />
          <Rect x={42} y={26} width={12} height={22} rx={3} fill="none" stroke={IC} strokeWidth={2.2} />
        </Svg>
      );
    case 'raceway':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={12} y={26} width={72} height={18} rx={3} fill="none" stroke={IC} strokeWidth={SW} />
          <Line x1={12} y1={35} x2={84} y2={35} stroke={IC} strokeWidth={1.6} />
          <Rect x={74} y={22} width={12} height={26} rx={2} fill="none" stroke={IC} strokeWidth={2} />
        </Svg>
      );
    case 'underfloor':
      return (
        <Svg {...common}>
          {frame}
          <Line x1={8} y1={24} x2={88} y2={24} stroke={IC} strokeWidth={2.4} />
          <Line x1={8} y1={30} x2={88} y2={30} stroke={IC} strokeWidth={1.4} />
          <Rect x={40} y={21} width={16} height={4} rx={1} fill={IC} />
          <Rect x={30} y={38} width={36} height={18} rx={2} fill="none" stroke={IC} strokeWidth={2.4} />
          {cable(42, 47)}
          {cable(54, 47)}
        </Svg>
      );
    case 'vmgr':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={44} y={8} width={8} height={56} rx={2} fill="none" stroke={IC} strokeWidth={2.4} />
          {[14, 26, 38, 50, 62].map((y) => (
            <Line key={y} x1={26} y1={y} x2={44} y2={y} stroke={IC} strokeWidth={SW} strokeLinecap="round" />
          ))}
          {[14, 26, 38, 50, 62].map((y) => (
            <Line key={`r${y}`} x1={52} y1={y} x2={70} y2={y} stroke={IC} strokeWidth={SW} strokeLinecap="round" />
          ))}
        </Svg>
      );
    case 'hmgr':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={10} y={30} width={76} height={16} rx={3} fill="none" stroke={IC} strokeWidth={SW} />
          {[22, 34, 46, 58, 70].map((x) => (
            <Line key={x} x1={x} y1={30} x2={x} y2={20} stroke={IC} strokeWidth={2.4} strokeLinecap="round" />
          ))}
        </Svg>
      );
    case 'strap':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={40} y={6} width={16} height={6} rx={1.5} fill="none" stroke={IC} strokeWidth={2} />
          <Line x1={48} y1={12} x2={48} y2={20} stroke={IC} strokeWidth={2.4} />
          <Path d="M30 26 v6 a18 18 0 0 0 36 0 v-6" stroke={IC} strokeWidth={SW} fill="none" strokeLinecap="round" />
          {cable(42, 38, 5)}
          {cable(54, 38, 5)}
          {cable(48, 30, 5)}
        </Svg>
      );
    case 'protector':
      return (
        <Svg {...common}>
          {frame}
          <Line x1={4} y1={58} x2={92} y2={58} stroke={IC_DIM} strokeWidth={1.6} />
          <Path d="M8 58 L30 36 h36 L88 58 Z" stroke={IC} strokeWidth={2.6} fill="none" strokeLinejoin="round" />
          {cable(41, 50)}
          {cable(57, 50)}
          <Line x1={20} y1={52} x2={26} y2={46} stroke={IC} strokeWidth={1.4} />
          <Line x1={70} y1={46} x2={76} y2={52} stroke={IC} strokeWidth={1.4} />
        </Svg>
      );
    case 'plumbing':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={10} y={26} width={76} height={12} rx={6} fill="none" stroke={IC} strokeWidth={SW} />
          <Rect x={24} y={23} width={6} height={18} rx={1.5} fill="none" stroke={IC} strokeWidth={2} />
          <Rect x={66} y={23} width={6} height={18} rx={1.5} fill="none" stroke={IC} strokeWidth={2} />
          <Path d="M48 44 c-4 7 -4 11 0 13 c4 -2 4 -6 0 -13" stroke="#5bb0ff" strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'foreign-conduit':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={8} y={24} width={80} height={14} rx={7} fill="none" stroke={IC} strokeWidth={SW} />
          <Line x1={58} y1={38} x2={64} y2={48} stroke={IC} strokeWidth={1.6} />
          <Rect x={58} y={48} width={22} height={14} rx={2} fill="none" stroke={IC} strokeWidth={2} />
          <Line x1={62} y1={58} x2={68} y2={51} stroke={IC} strokeWidth={1.4} />
          <Line x1={68} y1={60} x2={74} y2={53} stroke={IC} strokeWidth={1.4} />
        </Svg>
      );
    case 'tile':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={20} y={16} width={56} height={36} rx={2} fill="none" stroke={IC} strokeWidth={2.4} />
          {[
            [32, 26],
            [46, 36],
            [60, 24],
            [38, 44],
            [58, 42],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill={IC_DIM} />
          ))}
          <Path d="M12 58 h16 M20 50 v8" stroke={IC} strokeWidth={2.2} fill="none" />
          <Path d="M68 58 h16 M76 50 v8" stroke={IC} strokeWidth={2.2} fill="none" />
        </Svg>
      );
    case 'grid':
      return (
        <Svg {...common}>
          {frame}
          <Path d="M48 6 l3 5 l-6 5 l3 5" stroke={IC} strokeWidth={1.8} fill="none" />
          <Line x1={48} y1={21} x2={48} y2={44} stroke={IC} strokeWidth={SW} />
          <Line x1={32} y1={44} x2={64} y2={44} stroke={IC} strokeWidth={4} strokeLinecap="round" />
          <Line x1={32} y1={44} x2={32} y2={39} stroke={IC} strokeWidth={2} />
          <Line x1={64} y1={44} x2={64} y2={39} stroke={IC} strokeWidth={2} />
        </Svg>
      );
    case 'sprinkler':
      return (
        <Svg {...common}>
          {frame}
          <Rect x={8} y={18} width={80} height={10} rx={5} fill="none" stroke={IC} strokeWidth={SW} />
          <Rect x={45} y={28} width={6} height={12} fill="none" stroke={IC} strokeWidth={2} />
          <Path d="M44 45 l-4 5 M52 45 l4 5 M48 40 v10" stroke={IC} strokeWidth={1.8} fill="none" />
          <Line x1={38} y1={50} x2={58} y2={50} stroke={IC} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'hanger':
      return (
        <Svg {...common}>
          {frame}
          <Path d="M52 6 a6 6 0 1 0 -8 6 v4" stroke={IC} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M44 16 L26 46 H70 Z" stroke={IC} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg {...common}>
          {frame}
          <Rect x={24} y={20} width={48} height={32} rx={4} fill="none" stroke={IC} strokeWidth={SW} />
        </Svg>
      );
  }
}

/* ── A · role cards ─────────────────────────────────────────────────────── */
const ROLE_CARDS: { key: string; title: string; body: string; icon: string; tint: string }[] = [
  { key: 'support', title: 'SUPPORT', body: 'Carries the cable’s weight — anchored to structure, rated for the load.', icon: 'jhook', tint: colors.amber },
  { key: 'pathway', title: 'PATHWAY', body: 'Defines the route the cable follows through the building.', icon: 'tray', tint: '#4fd0e0' },
  { key: 'protection', title: 'PROTECTION', body: 'Blocks physical damage — edges, crush, traffic.', icon: 'conduit', tint: colors.green },
  { key: 'management', title: 'MANAGEMENT', body: 'Organizes for service — trace it, swap it, no surgery.', icon: 'vmgr', tint: colors.purple },
];

const ROLE_TINTS: Record<string, string> = {
  support: colors.amber,
  pathway: '#4fd0e0',
  protection: colors.green,
  management: colors.purple,
};

/* ── C · the spacing exercise geometry ──────────────────────────────────── */
const POS_UNITS = [2, 4, 6, 8, 10] as const;
const CORRECT_POS = [1, 3] as const; // indices into POS_UNITS → units 4 and 8
const SPAN_UNITS = 12;
const SPEC_EVERY = 4; // grid units, from CI_SUPPORT_SPACING_SPEC
const SAG_LIMIT_UNITS = 0.5;

function SpanArt({ w, placed }: { w: number; placed: Set<number> }) {
  const h = Math.round((w * 132) / 360);
  const X0 = 12;
  const UNIT = 28;
  const X1 = X0 + SPAN_UNITS * UNIT;
  const xOf = (u: number) => X0 + u * UNIT;
  const CABLE_Y = 40;
  const placedUnits = [...placed].sort((a, b) => a - b).map((i) => POS_UNITS[i]);
  const anchors = [0, ...placedUnits, SPAN_UNITS];
  const anyStrained = anchors.some((a, i) => i > 0 && anchors[i] - anchors[i - 1] > SPEC_EVERY + 1e-6);
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 132"
      accessibilityLabel={`Twelve-unit span. Supports placed at ${placedUnits.length ? placedUnits.join(' and ') + ' units' : 'no positions'}. ${anyStrained ? 'At least one span sags past the limit.' : 'All spans are inside the sag limit.'}`}
    >
      <Rect x={0} y={0} width={360} height={132} rx={10} fill="#101014" />
      {/* structure the supports anchor to */}
      <Line x1={6} y1={26} x2={354} y2={26} stroke="#33333a" strokeWidth={4} />
      {/* end terminations — the run ends honestly at both walls */}
      <Rect x={4} y={34} width={8} height={12} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      <Rect x={348} y={34} width={8} height={12} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      {/* max-sag guide from the spec (½ unit below the cable line) */}
      <Line x1={X0} y1={CABLE_Y + SAG_LIMIT_UNITS * UNIT} x2={X1} y2={CABLE_Y + SAG_LIMIT_UNITS * UNIT} stroke="#37d97b" strokeWidth={1.2} strokeDasharray="5 5" opacity={0.35} />
      <SvgText x={X1} y={CABLE_Y + SAG_LIMIT_UNITS * UNIT - 4} textAnchor="end" fontFamily={fonts.oswaldSemiBold} fontSize={8.5} letterSpacing={0.8} fill="#37d97b" opacity={0.8}>
        MAX SAG ½ UNIT
      </SvgText>
      {/* cable segments, sagging by span length; strained spans draw hot */}
      {anchors.slice(1).map((b, i) => {
        const a = anchors[i];
        const span = b - a;
        const depthUnits = SAG_LIMIT_UNITS * Math.pow(span / SPEC_EVERY, 2);
        const depthPx = Math.min(27, depthUnits * UNIT);
        const ok = span <= SPEC_EVERY + 1e-6;
        return (
          <Path
            key={`${a}-${b}`}
            d={`M ${xOf(a)} ${CABLE_Y} Q ${(xOf(a) + xOf(b)) / 2} ${CABLE_Y + 2 * depthPx} ${xOf(b)} ${CABLE_Y}`}
            stroke={ok ? CI_CLASS_TINTS.analog : '#ff9b8f'}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
      {/* candidate positions: placed = J-hook, empty = dashed ghost */}
      {POS_UNITS.map((u, i) => {
        const x = xOf(u);
        return placed.has(i) ? (
          <Path key={u} d={`M${x} 26 V33 M${x - 8} 33 a8 8 0 0 0 16 0`} stroke={IC} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : (
          <Circle key={u} cx={x} cy={38} r={7} fill="none" stroke="#54565c" strokeWidth={1.4} strokeDasharray="3 3" />
        );
      })}
      {/* grid ruler, marked and numbered */}
      <Line x1={X0} y1={100} x2={X1} y2={100} stroke="#2c2c33" strokeWidth={1.5} />
      {Array.from({ length: SPAN_UNITS + 1 }, (_, u) => (
        <Line key={u} x1={xOf(u)} y1={u % 2 === 0 ? 94 : 96} x2={xOf(u)} y2={104} stroke="#3a3c42" strokeWidth={u % 2 === 0 ? 1.6 : 1} />
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((u) => (
        <SvgText key={`n${u}`} x={xOf(u)} y={118} textAnchor="middle" fontFamily={fonts.mono} fontSize={11} fill="#8a8b93">
          {String(u)}
        </SvgText>
      ))}
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function SupportsScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const N = CI_SUPPORT_ITEMS.length;
  const passNeeded = Math.ceil(N * 0.8);
  const artW = Math.max(160, width - 26);

  // B — the sort
  const [attempt, setAttempt] = useState(0);
  const order = useMemo(() => scrambleOrder(N, attempt), [N, attempt]);
  const [idx, setIdx] = useState(completed ? N : 0);
  const [correct, setCorrect] = useState(completed ? N : 0);
  const [pick, setPick] = useState<boolean | null>(null);
  const [finishedLive, setFinishedLive] = useState(false); // banner only after a live run
  const [sortPassed, setSortPassed] = useState(completed);
  const correctAtPassRef = useRef(completed ? N : 0);

  // C — spacing
  const [placed, setPlaced] = useState<Set<number>>(() => new Set(completed ? CORRECT_POS : []));
  const [spacingVerdict, setSpacingVerdict] = useState<'good' | 'bad' | null>(completed ? 'good' : null);
  const [spacingMsg, setSpacingMsg] = useState(
    completed ? 'Supports at 4 and 8 — the documented every-4-unit design, sag inside the limit.' : '',
  );
  const [spacingPassed, setSpacingPassed] = useState(completed);
  const wrongSpacingRef = useRef(0);

  const firedRef = useRef(completed);
  const [fired, setFired] = useState(completed);

  const tryFire = (sortOk: boolean, spacingOk: boolean) => {
    if (firedRef.current) return;
    if (sortOk && spacingOk) {
      firedRef.current = true;
      setFired(true);
      announceComplete('Stage 5 complete.');
      onComplete({
        routing: clamp100(Math.round((correctAtPassRef.current / N) * 100)),
        protection: clamp100(Math.max(70, 100 - 10 * wrongSpacingRef.current)),
      });
    }
  };

  /* — sort handlers — */
  const item = idx < N ? CI_SUPPORT_ITEMS[order[idx]] : null;
  const matched = item && pick != null ? pick === item.ok : null;

  const onPick = (saidOk: boolean) => {
    if (!item || pick != null) return;
    setPick(saidOk);
    const right = saidOk === item.ok;
    if (right) setCorrect((c) => c + 1);
    say(`${right ? 'Correct.' : 'Not quite.'} ${item.ok ? 'Approved hardware.' : 'Never hang cable on this.'} ${item.why}`);
  };

  const onNextItem = () => {
    if (!item || pick == null) return;
    const nIdx = idx + 1;
    setIdx(nIdx);
    setPick(null);
    if (nIdx >= N) {
      setFinishedLive(true);
      const pass = correct >= passNeeded;
      if (pass) {
        correctAtPassRef.current = Math.max(correctAtPassRef.current, correct);
        setSortPassed(true);
        tryFire(true, spacingPassed);
      }
    }
  };

  const onRetrySort = () => {
    setAttempt((a) => a + 1); // new deterministic order per attempt
    setIdx(0);
    setCorrect(0);
    setPick(null);
    setFinishedLive(false);
  };

  /* — spacing handlers — */
  const togglePos = (i: number) => {
    const nx = new Set(placed);
    const on = !nx.has(i);
    if (on) nx.add(i);
    else nx.delete(i);
    setPlaced(nx);
    say(`Support ${on ? 'placed' : 'removed'} at ${POS_UNITS[i]} units.`);
  };

  const checkSpacing = () => {
    const exact = placed.size === CORRECT_POS.length && CORRECT_POS.every((i) => placed.has(i));
    if (exact) {
      setSpacingVerdict('good');
      const msg = 'Supports at 4 and 8 — the documented every-4-unit design, sag inside the limit.';
      setSpacingMsg(msg);
      setSpacingPassed(true);
      say(`Correct. ${msg}`);
      tryFire(sortPassed, true);
      return;
    }
    wrongSpacingRef.current += 1;
    const units = [...placed].sort((a, b) => a - b).map((i) => POS_UNITS[i]);
    const anchors = [0, ...units, SPAN_UNITS];
    const maxGap = Math.max(...anchors.slice(1).map((b, i) => b - anchors[i]));
    const msg =
      maxGap > SPEC_EVERY
        ? `A span of ${maxGap} units exceeds the documented 4-unit maximum — check the spec card again.`
        : 'That is more hardware than the documented design calls for — install to the system’s criteria, not more, not less.';
    setSpacingVerdict('bad');
    setSpacingMsg(msg);
    say(`Not to spec. ${msg}`);
  };

  const answered = idx + (pick != null ? 1 : 0);
  const finishedPass = correct >= passNeeded;

  return (
    <View style={{ gap: 16 }}>
      {/* ── A · ROLES ───────────────────────────────────────────────────── */}
      <CiSection title="A · FOUR JOBS — CHOOSE HARDWARE BY THE JOB">
        <View style={styles.roleGrid}>
          {ROLE_CARDS.map((rc) => (
            <View key={rc.key} style={[styles.roleCard, { width: (width - 8) / 2, borderColor: rc.tint + '55' }]}>
              <SupportIcon id={rc.icon} w={56} />
              <Text style={[styles.roleTitle, { color: rc.tint }]}>{rc.title}</Text>
              <Text style={styles.roleBody}>{rc.body}</Text>
            </View>
          ))}
        </View>
        <RuleFeedback ruleId="sup-roles" verdict="info" openSources={openSources} />
      </CiSection>

      {/* ── B · THE SORT ────────────────────────────────────────────────── */}
      <CiSection title="B · THE SORT — WOULD YOU HANG CABLE ON THIS?">
        <Text style={styles.lead}>
          One piece of hardware at a time. Approve only purpose-built, rated cable hardware — "it happens to be there"
          is not a support. Pass mark: {passNeeded} of {N}.
        </Text>
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {sortPassed ? '✓ ' : ''}
          {correct} correct · {Math.min(answered, N)} of {N} sorted
        </Text>
        {item ? (
          <View style={styles.card}>
            <Text style={styles.cardHead}>
              ITEM {idx + 1} OF {N}
            </Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={{ alignItems: 'center' }}>
              <SupportIcon id={item.id} w={Math.min(170, artW)} />
            </View>
            <Text style={styles.question}>Would you hang cable on this?</Text>
            <View style={styles.pickRow}>
              <Pressable
                style={[styles.pickBtn, styles.pickApprove, pick === true && styles.pickChosen]}
                onPress={() => onPick(true)}
                disabled={pick != null}
                accessibilityRole="button"
                accessibilityState={{ selected: pick === true, disabled: pick != null }}
                accessibilityLabel={`Approve — yes, hang cable on ${item.name}`}
              >
                <Text style={[styles.pickText, { color: colors.green }]}>APPROVE</Text>
              </Pressable>
              <Pressable
                style={[styles.pickBtn, styles.pickReject, pick === false && styles.pickChosen]}
                onPress={() => onPick(false)}
                disabled={pick != null}
                accessibilityRole="button"
                accessibilityState={{ selected: pick === false, disabled: pick != null }}
                accessibilityLabel={`Reject — do not hang cable on ${item.name}`}
              >
                <Text style={[styles.pickText, { color: '#ff9b8f' }]}>REJECT</Text>
              </Pressable>
            </View>
            {pick != null ? (
              <View style={{ gap: 8 }}>
                <RuleFeedback
                  ruleId={item.ruleId}
                  verdict={matched ? 'good' : 'bad'}
                  short={`${matched ? 'Correct — ' : 'Not quite — '}${item.ok ? 'this IS proper cable hardware. ' : 'never hang cable on this. '}${item.why}`}
                  openSources={openSources}
                />
                {item.ok && item.roles ? (
                  <View style={styles.roleChipRow}>
                    <Text style={styles.roleChipLabel}>ROLES:</Text>
                    {item.roles.map((r) => (
                      <View key={r} style={[styles.roleChip, { borderColor: (ROLE_TINTS[r] ?? IC) + '77' }]}>
                        <Text style={[styles.roleChipText, { color: ROLE_TINTS[r] ?? IC }]}>{r.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Pressable
                  style={styles.nextBtn}
                  onPress={onNextItem}
                  accessibilityRole="button"
                  accessibilityLabel={idx + 1 >= N ? 'Finish the sort' : 'Next item'}
                >
                  <Text style={styles.nextText}>{idx + 1 >= N ? 'FINISH SORT ›' : 'NEXT ITEM ›'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {finishedLive ? (
              <VerdictBanner
                verdict={finishedPass ? 'correct' : 'wrong'}
                text={`${correct} of ${N} sorted correctly (${Math.round((correct / N) * 100)}%). ${
                  finishedPass ? 'Sort passed.' : `You need ${passNeeded} of ${N} (80%) — run it again.`
                }`}
              />
            ) : (
              <Text style={styles.passedLine}>✓ Sort passed — {correctAtPassRef.current} of {N} on record.</Text>
            )}
            <OptionChip label={sortPassed ? 'RUN THE SORT AGAIN' : 'RETRY THE SORT'} onPress={onRetrySort} action />
          </View>
        )}
      </CiSection>

      {/* ── C · SPACING RITUAL ──────────────────────────────────────────── */}
      <CiSection title="C · SUPPORT SPACING — INSTALL TO THE GIVEN SPEC">
        <SpecCard text={CI_SUPPORT_SPACING_SPEC} />
        <Text style={styles.lead}>
          A 12-unit span, five candidate positions. Place supports to the system's documented criteria — the cable sags
          live between whatever you give it.
        </Text>
        <SpanArt w={artW} placed={placed} />
        <Text style={styles.tintNote}>Cable drawn in a training tint — field colors vary.</Text>
        <View style={styles.posRow}>
          {POS_UNITS.map((u, i) => {
            const on = placed.has(i);
            return (
              <Pressable
                key={u}
                style={[styles.posBtn, on && styles.posBtnOn]}
                onPress={() => togglePos(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Position ${i + 1}, at ${u} units, ${on ? 'support placed' : 'empty'}`}
              >
                <Text style={[styles.posText, on && { color: colors.amber }]}>P{i + 1}</Text>
                <Text style={[styles.posSub, on && { color: colors.amber }]}>{u}u</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={[styles.checkBtn, spacingPassed && styles.checkBtnDone]}
          onPress={checkSpacing}
          accessibilityRole="button"
          accessibilityLabel={spacingPassed ? 'Spacing meets the specification. Check again' : 'Check the support spacing against the specification'}
        >
          <Text style={[styles.checkText, spacingPassed && { color: '#0a1a0f' }]}>
            {spacingPassed ? 'MEETS SPEC ✓ — CHECK AGAIN' : 'CHECK SPACING'}
          </Text>
        </Pressable>
        {spacingVerdict ? (
          <RuleFeedback ruleId="sup-spacing-mfr" verdict={spacingVerdict} short={spacingMsg} openSources={openSources} />
        ) : null}
      </CiSection>

      <Text style={[styles.progressLine, fired && { color: colors.green }]} accessibilityLiveRegion="polite">
        {fired
          ? '✓ Stage 5 complete — keep experimenting freely.'
          : `To complete: pass the sort at ${passNeeded}/${N} · place the span's supports to its documented spec.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: { gap: 6, borderRadius: 10, borderWidth: 1, backgroundColor: '#131316', padding: 10, alignItems: 'flex-start' },
  roleTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2 },
  roleBody: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  progressLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  passedLine: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.green },
  card: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel },
  itemName: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.textPrimary },
  question: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  pickRow: { flexDirection: 'row', gap: 10 },
  pickBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#17171c',
  },
  pickApprove: { borderColor: 'rgba(55,224,95,.45)' },
  pickReject: { borderColor: 'rgba(255,155,143,.45)' },
  pickChosen: { backgroundColor: '#1f1f26', borderWidth: 2 },
  pickText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.5 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  roleChipLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  roleChip: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#101014' },
  roleChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  nextBtn: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    paddingHorizontal: 16,
  },
  nextText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  posRow: { flexDirection: 'row', gap: 6 },
  posBtn: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
  },
  posBtnOn: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  posText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
  posSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  checkBtn: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#2a2a31',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
  },
  checkBtnDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
});
