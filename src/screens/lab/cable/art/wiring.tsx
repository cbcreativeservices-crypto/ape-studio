/**
 * Wiring drawings for Cable & Connector Fundamentals (fix pass 2026-10-16).
 *
 * BalancedFigure — why a balanced line rejects interference: the same
 *   interference lands on both legs of a twisted pair; pin 2 carries
 *   signal + noise, pin 3 carries −signal + noise, and the input takes
 *   (+) − (−) = 2 × signal while the noise cancels. The unbalanced line has
 *   one signal conductor, so the noise that reaches it stays in it. The scope
 *   windows draw a few TRUE cycles of a tone with a faster interference
 *   component added — the arithmetic is exact, the signals illustrative.
 *   (Drawn: the symmetric-drive case. lesson03 notes under the figure that
 *   some outputs drive only pin 2 — equal impedance is what balances a line.)
 *
 * WiringTrace — the virtual tester's "inside the cable": every conductor from
 *   END A to END B, DERIVED from the bench data's measured map (never a
 *   re-keyed copy): CLOSED rows become wires, an OPEN straight-through row
 *   with no other path becomes a broken wire, a crossed CLOSED row a crossed
 *   wire, DROPS ON FLEX a cracked joint, and on a network lead the PAIRED /
 *   SPLIT rows decide which wires actually twist together.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import { CONNECTOR_INKS } from '../connectorInks';
import type { TesterCable } from '../data/testerCables';
import { ART, Label } from './kit';

const W = 340;

/* ── balanced vs unbalanced ───────────────────────────────────────────────── */

const sig = (t: number) => Math.sin(2 * Math.PI * 2 * t);
const noise = (t: number) => 0.5 * Math.sin(2 * Math.PI * 17 * t + 0.7);

function Trace({ x, y, w, h, f, max, color }: { x: number; y: number; w: number; h: number; f: (t: number) => number; max: number; color: string }) {
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(`${i ? 'L' : 'M'}${(x + 3 + t * (w - 6)).toFixed(2)} ${(y + h / 2 - (f(t) / max) * (h / 2 - 3)).toFixed(2)}`);
  }
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill="#07120c" stroke="#24412f" strokeWidth={0.8} />
      <Line x1={x + 2} y1={y + h / 2} x2={x + w - 2} y2={y + h / 2} stroke="#1e3a28" strokeWidth={0.6} />
      <Path d={pts.join(' ')} stroke={color} strokeWidth={1.3} fill="none" />
    </G>
  );
}

function Interference({ x, y }: { x: number; y: number }) {
  // a short wavy arrow pointing down at the cable
  const d = `M${x} ${y} q3 3 0 6 q-3 3 0 6 q3 3 0 6`;
  return (
    <G>
      <Path d={d} stroke="#ff7a68" strokeWidth={1.4} fill="none" />
      <Path d={`M${x - 3.2} ${y + 15.5} L${x} ${y + 20} L${x + 3.2} ${y + 15.5}`} stroke="#ff7a68" strokeWidth={1.4} fill="none" />
    </G>
  );
}

function Amp({ x, y, diff }: { x: number; y: number; diff: boolean }) {
  return (
    <G>
      <Path d={`M${x} ${y - 16} L${x + 26} ${y} L${x} ${y + 16} Z`} fill="#16171b" stroke={ART.label} strokeWidth={1} />
      {diff ? (
        <G>
          <Label x={x + 5} y={y - 4} text="+" size={10} />
          <Label x={x + 5} y={y + 11} text="−" size={10} />
        </G>
      ) : null}
    </G>
  );
}

/** Balanced vs unbalanced, side by side as two rows. */
export function BalancedFigure({ width }: { width: number }) {
  const H = 262;
  const amber = CONNECTOR_INKS.signalPos;
  const blue = CONNECTOR_INKS.signalNeg;
  const grey = CONNECTOR_INKS.shield;
  // Row geometry
  const cab0 = 10;
  const cab1 = 118;
  const win0 = 128;
  const winW = 72;
  const ampX = 210;
  const out0 = 246;
  const outW = 86;
  const uy = 64; // unbalanced conductor line
  const by = 190; // balanced pair centre
  // the twisted pair: two legs on a helix, crossing every half twist
  const leg = (s: 1 | -1) => {
    const pts: string[] = [];
    for (let x = cab0; x <= cab1; x += 2) pts.push(`${x === cab0 ? 'M' : 'L'}${x} ${(by - s * 5 * Math.cos(((x - cab0) / 36) * Math.PI * 2)).toFixed(2)}`);
    return pts.join(' ');
  };
  return (
    <View style={{ width, height: (H * width) / W }} accessible accessibilityRole="image" accessibilityLabel="Unbalanced versus balanced: on the unbalanced line the interference stays in the signal; on the balanced line it lands equally on pins 2 and 3, and the input's subtraction cancels it while doubling the signal.">
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={(H * width) / W} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
        {/* ── UNBALANCED ── */}
        <Label x={10} y={18} text="UNBALANCED · TS" size={10.5} weight="semibold" />
        <Label x={cab0} y={34} text="interference" size={9.5} color="#ff9a8a" weight="regular" />
        {[40, 70, 100].map((x) => (
          <Interference key={x} x={x} y={38} />
        ))}
        <Rect x={cab0} y={uy - 11} width={cab1 - cab0} height={22} rx={10} fill="#141518" stroke={grey} strokeWidth={1.6} strokeDasharray="3 2" />
        <Line x1={cab0} y1={uy} x2={cab1} y2={uy} stroke={amber} strokeWidth={2.4} />
        <Label x={cab0} y={uy + 26} text="tip = signal · sleeve = shield AND return" size={9.5} color={ART.sub} weight="regular" />
        <Label x={win0} y={uy - 22} text="ON THE TIP WIRE" size={9.5} color={ART.sub} />
        <Trace x={win0} y={uy - 16} w={winW} h={32} f={(t) => sig(t) + noise(t)} max={1.6} color={amber} />
        <Line x1={win0 + winW} y1={uy} x2={ampX} y2={uy} stroke={amber} strokeWidth={1.4} />
        <Amp x={ampX} y={uy} diff={false} />
        <Label x={ampX + 8} y={uy + 30} text="input" anchor="middle" size={9.5} color={ART.sub} weight="regular" />
        <Line x1={ampX + 26} y1={uy} x2={out0} y2={uy} stroke={ART.label} strokeWidth={1.2} />
        <Label x={out0} y={uy - 22} text="INPUT HEARS" size={9.5} color={ART.sub} />
        <Trace x={out0} y={uy - 16} w={outW} h={32} f={(t) => sig(t) + noise(t)} max={1.6} color="#ff9a8a" />
        <Label x={out0 + outW} y={uy + 30} text="signal + noise" anchor="end" size={9.5} color="#ff9a8a" />
        {/* ── BALANCED ── */}
        <Line x1={8} y1={112} x2={W - 8} y2={112} stroke="#202127" strokeWidth={1} />
        <Label x={10} y={132} text="BALANCED · XLR" size={10.5} weight="semibold" />
        <Label x={cab0} y={150} text="interference" size={9.5} color="#ff9a8a" weight="regular" />
        {[40, 70, 100].map((x) => (
          <Interference key={x} x={x} y={154} />
        ))}
        <Rect x={cab0} y={by - 15} width={cab1 - cab0} height={30} rx={13} fill="#141518" stroke={grey} strokeWidth={1.6} strokeDasharray="3 2" />
        <Path d={leg(-1)} stroke={blue} strokeWidth={2.4} fill="none" />
        <Path d={leg(1)} stroke={amber} strokeWidth={2.4} fill="none" />
        <Label x={cab0} y={by + 32} text="pins 2 and 3 twisted" size={9.5} color={ART.sub} weight="regular" />
        <Label x={cab0} y={by + 44} text="pin 1 = shield" size={9.5} color={ART.sub} weight="regular" />
        <Label x={win0} y={by - 33} text="PIN 2 (+)" size={9.5} color={ART.sub} />
        <Trace x={win0} y={by - 30} w={winW} h={26} f={(t) => sig(t) + noise(t)} max={1.6} color={amber} />
        <Label x={win0} y={by + 15} text="PIN 3 (−)" size={9.5} color={ART.sub} />
        <Trace x={win0} y={by + 18} w={winW} h={26} f={(t) => -sig(t) + noise(t)} max={1.6} color={blue} />
        <Path d={`M${cab1} ${by - 5} L${win0} ${by - 17}`} stroke={amber} strokeWidth={1.2} />
        <Path d={`M${cab1} ${by + 5} L${win0} ${by + 31}`} stroke={blue} strokeWidth={1.2} />
        <Path d={`M${win0 + winW} ${by - 17} L${ampX - 6} ${by - 17} L${ampX} ${by - 8}`} stroke={amber} strokeWidth={1.2} fill="none" />
        <Path d={`M${win0 + winW} ${by + 31} L${ampX - 6} ${by + 31} L${ampX} ${by + 8}`} stroke={blue} strokeWidth={1.2} fill="none" />
        <Amp x={ampX} y={by} diff />
        <Label x={ampX + 10} y={by + 46} text="input" anchor="middle" size={9.5} color={ART.sub} weight="regular" />
        <Line x1={ampX + 26} y1={by} x2={out0} y2={by} stroke={ART.label} strokeWidth={1.2} />
        <Label x={out0} y={by - 22} text="INPUT HEARS" size={9.5} color={ART.sub} />
        <Trace x={out0} y={by - 16} w={outW} h={32} f={(t) => 2 * sig(t)} max={2.2} color={ART.good} />
        <Label x={out0 + outW} y={by + 30} text="(+) − (−): noise cancels" anchor="end" size={9.5} color={ART.good} />
        <Label x={W - 8} y={H - 8} text="scope views · illustrative signals" anchor="end" size={9.5} color={ART.muted} weight="regular" />
      </Svg>
    </View>
  );
}

/* ── tester wiring trace ──────────────────────────────────────────────────── */

const T568B: Record<string, { color: string; stripe?: string }> = {
  '1': { color: '#eeeeea', stripe: '#e07b2a' },
  '2': { color: '#e07b2a' },
  '3': { color: '#eeeeea', stripe: '#3a9a4a' },
  '4': { color: '#2f6fc0' },
  '5': { color: '#eeeeea', stripe: '#2f6fc0' },
  '6': { color: '#3a9a4a' },
  '7': { color: '#eeeeea', stripe: '#7a4a2a' },
  '8': { color: '#7a4a2a' },
};

function inkFor(name: string, network: boolean): { color: string; stripe?: string } {
  const n = name.replace(/^Pin\s+/i, '').trim();
  if (network && T568B[n]) return T568B[n];
  if (/^1$/.test(n) || /sleeve/i.test(n)) return { color: CONNECTOR_INKS.shield };
  if (/^2$/.test(n) || /^tip/i.test(n)) return { color: CONNECTOR_INKS.signalPos };
  if (/^3$/.test(n) || /^ring/i.test(n)) return { color: CONNECTOR_INKS.signalNeg };
  if (/\+/.test(n)) return { color: CONNECTOR_INKS.speakerPos };
  if (/−|-/.test(n)) return { color: CONNECTOR_INKS.speakerNeg };
  // mains cord: the REAL North American insulation colours (the cord on the
  // bench is NEMA 5-15) — the same as Lesson 2's AC cross-section
  if (/narrow|line/i.test(n)) return { color: '#1f2024' };
  if (/wide|neutral/i.test(n)) return { color: '#e9e9e4' };
  if (/round|earth/i.test(n)) return { color: '#2f8f3f' };
  return { color: ART.label };
}

const short = (s: string) => s.replace(/^Pin\s+/i, '').trim();

export type TraceModel = {
  a: string[];
  b: string[];
  wires: { ai: number; bi: number; crossed: boolean; flaky: boolean }[];
  broken: number[]; // A indices with no path at all
  pairs: [number, number][]; // A indices twisted together (network leads)
  badPairs: number[]; // indices into `pairs` that are not a pair the standard calls for
};

/** Derive the drawn wiring from the bench data's MEASURED map. */
export function traceModel(cable: TesterCable): TraceModel {
  const a: string[] = [];
  const b: string[] = [];
  const rows = cable.actualMap;
  const arrow = rows.filter((r) => r.path.includes('→'));
  for (const r of arrow) {
    const [x, y] = r.path.split('→').map((t) => t.trim());
    if (x === y || cable.expectedMap.some((e) => e.path === r.path && e.value === 'CLOSED')) {
      if (!a.includes(x)) a.push(x);
      if (!b.includes(y)) b.push(y);
    }
  }
  // ends with the same contact names line up row for row
  const wires: TraceModel['wires'] = [];
  const flex = rows.find((r) => /flex/i.test(r.path));
  const flexName = flex ? flex.path.replace(/\(.*\)/, '').trim() : '';
  for (const r of arrow) {
    if (r.value !== 'CLOSED') continue;
    const [x, y] = r.path.split('→').map((t) => t.trim());
    const ai = a.indexOf(x);
    const bi = b.indexOf(y);
    if (ai < 0 || bi < 0) continue;
    const exp = cable.expectedMap.find((e) => e.path === r.path);
    wires.push({ ai, bi, crossed: !exp || exp.value !== 'CLOSED', flaky: !!flex && flex.value !== 'STEADY' && x === flexName });
  }
  const broken = a.map((_, i) => i).filter((i) => !wires.some((w) => w.ai === i));
  // network pairs: PAIRED rows twist as named; SPLIT rows' pins pair in
  // sequence instead (the classic split-pair build: 3+4, 5+6)
  const pairs: [number, number][] = [];
  const split: number[] = [];
  for (const r of rows) {
    const m = /^Pair\s+(\d)\+(\d)/.exec(r.path);
    if (!m) continue;
    const i1 = a.findIndex((n) => short(n) === m[1]);
    const i2 = a.findIndex((n) => short(n) === m[2]);
    if (i1 < 0 || i2 < 0) continue;
    if (r.value === 'PAIRED') pairs.push([i1, i2]);
    else split.push(i1, i2);
  }
  split.sort((p, q) => p - q);
  for (let i = 0; i + 1 < split.length; i += 2) pairs.push([split[i], split[i + 1]]);
  const want = cable.expectedMap.map((r) => /^Pair\s+(\d)\+(\d)/.exec(r.path)).filter((x): x is RegExpExecArray => !!x).map((x) => `${x[1]}+${x[2]}`);
  const badPairs = pairs.map((pq, i) => ({ i, key: `${short(a[pq[0]])}+${short(a[pq[1]])}` })).filter((x) => !want.includes(x.key)).map((x) => x.i);
  return { a, b, wires, broken, pairs, badPairs };
}

/**
 * The cable's inside, END A to END B, as the tester found it. `progress`
 * (0..1) lights the conductors in step with the tester's row scan.
 */
export function WiringTrace({ cable, width, progress, named = true }: { cable: TesterCable; width: number; progress: number; named?: boolean }) {
  const m = traceModel(cable);
  const network = m.a.length >= 8;
  // A split-pair lead was terminated in colour order, so its wires carry the
  // colours of the pairs they really belong to: in the drawn pair (3,4) both
  // wires are the green pair, in (5,6) both the blue pair.
  const PAIR_INK = ['#e07b2a', '#3a9a4a', '#2f6fc0', '#7a4a2a'];
  const wireInk = (i: number): { color: string; stripe?: string } => {
    if (network && m.badPairs.length) {
      const sorted = [...m.pairs].sort((x, y) => Math.min(...x) - Math.min(...y));
      const k = sorted.findIndex(([p, q]) => p === i || q === i);
      if (k >= 0) {
        const lo = Math.min(...sorted[k]);
        return i === lo ? { color: '#eeeeea', stripe: PAIR_INK[k] } : { color: PAIR_INK[k] };
      }
    }
    return inkFor(m.a[i], network);
  };
  const dark = (c: string) => c === '#1f2024';
  const n = m.a.length;
  const rowH = network ? 13 : 24;
  const top = 34;
  const H = top + n * rowH + (network ? 44 : 30);
  const xa = 66; // END A contact
  const xb = W - 66; // END B contact
  const c0 = 92;
  const c1 = W - 92;
  const yOf = (i: number) => top + rowH / 2 + i * rowH;
  const [endA, endB] = cable.connectorEnds
    .replace(/\s*\(.*\)\s*/, '')
    .split('→')
    .map((t) => (network ? `${t.replace(/\s*modular/i, '').trim()} (Ethernet)` : t.trim()));
  // network: in the middle of the cable the wires run in their TWISTED
  // pairs, so pair-mates sit side by side there
  const lane = new Map<number, number>();
  if (network && m.pairs.length) {
    let k = 0;
    const byLow = [...m.pairs].sort((x, y) => Math.min(...x) - Math.min(...y));
    for (const [p, q] of byLow) {
      lane.set(p, k++);
      lane.set(q, k++);
    }
  }
  const midY = (i: number) => yOf(lane.has(i) ? (lane.get(i) as number) : i);
  const lit = (i: number) => Math.max(0, Math.min(1, progress * n - i + 0.6));
  const parts: ReactNode[] = [];
  m.wires.forEach((w, idx) => {
    const ink = wireInk(w.ai);
    const y0 = yOf(w.ai);
    const y1 = yOf(w.bi);
    const ym = midY(w.ai);
    const d = network
      ? `M${xa} ${y0} C${c0 + 10} ${y0}, ${c0 + 4} ${ym}, ${c0 + 30} ${ym} L${c1 - 30} ${ym} C${c1 - 4} ${ym}, ${c1 - 10} ${y1}, ${xb} ${y1}`
      : `M${xa} ${y0} C${(xa + xb) / 2} ${y0}, ${(xa + xb) / 2} ${y1}, ${xb} ${y1}`;
    const op = 0.25 + 0.75 * lit(w.ai);
    parts.push(
      <G key={`w${idx}`} opacity={op}>
        {w.crossed && named ? <Path d={d} stroke="#ff7a68" strokeWidth={6} fill="none" opacity={0.35} /> : null}
        <Path d={d} stroke={dark(ink.color) ? '#8a8d94' : '#050506'} strokeWidth={4.2} fill="none" />
        <Path d={d} stroke={ink.color} strokeWidth={2.8} fill="none" strokeDasharray={w.flaky ? '0' : undefined} />
        {ink.stripe ? <Path d={d} stroke={ink.stripe} strokeWidth={1.4} fill="none" strokeDasharray="5 5" /> : null}
        {w.flaky ? (
          <G>
            {/* cracked joint at the END B connector: strands nearly through */}
            {/* the joint has cracked: the insulation and most strands are
                gone, two thin strands still touch — so it reads CLOSED
                at rest and drops out when the cable flexes */}
            <Rect x={xb - 24} y={y1 - 4} width={9} height={8} fill={ART.bg} />
            <Path d={`M${xb - 24} ${y1 - 0.8} C${xb - 21} ${y1 - 2}, ${xb - 18} ${y1 + 0.4}, ${xb - 15} ${y1 - 0.6}`} stroke={ART.copper} strokeWidth={0.7} fill="none" />
            <Path d={`M${xb - 24} ${y1 + 1} C${xb - 21} ${y1 + 2.4}, ${xb - 18} ${y1 - 0.2}, ${xb - 15} ${y1 + 1.2}`} stroke={ART.copper} strokeWidth={0.6} fill="none" />
            {named ? <Label x={xb - 20} y={y1 + 16} text="CRACKED JOINT — breaks when flexed" anchor="end" size={10} color={ART.hi} weight="semibold" /> : null}
          </G>
        ) : null}
      </G>,
    );
  });
  // a crossed pair of wires: name it where they cross
  const crossed = m.wires.filter((w) => w.crossed);
  if (crossed.length >= 2 && !network && named) {
    parts.push(<Label key="xl" x={(xa + xb) / 2} y={Math.min(...crossed.map((w) => Math.min(yOf(w.ai), yOf(w.bi)))) - 8} text="CROSSED" anchor="middle" size={10} color="#ff7a68" weight="semibold" />);
  }
  m.broken.forEach((i) => {
    const ink = wireInk(i);
    const y = yOf(i);
    const gap0 = (xa + xb) / 2 - 12;
    const gap1 = (xa + xb) / 2 + 12;
    parts.push(
      <G key={`b${i}`} opacity={0.25 + 0.75 * lit(i)}>
        <Path d={`M${xa} ${y} L${gap0} ${y}`} stroke={dark(ink.color) ? '#8a8d94' : '#050506'} strokeWidth={4.2} />
        <Path d={`M${xa} ${y} L${gap0} ${y}`} stroke={ink.color} strokeWidth={2.8} />
        <Path d={`M${gap1} ${y} L${xb} ${y}`} stroke={dark(ink.color) ? '#8a8d94' : '#050506'} strokeWidth={4.2} />
        <Path d={`M${gap1} ${y} L${xb} ${y}`} stroke={ink.color} strokeWidth={2.8} />
        <Path d={`M${gap0} ${y} l3 -3 M${gap0} ${y} l3 3 M${gap1} ${y} l-3 -3 M${gap1} ${y} l-3 3`} stroke={ART.copper} strokeWidth={1} />
        {named ? <Label x={(gap0 + gap1) / 2} y={y - 6} text="OPEN" anchor="middle" size={10} color="#ff7a68" weight="semibold" /> : null}
      </G>,
    );
  });
  // twist ticks over each network pair in the middle stretch
  if (network) {
    m.pairs.forEach(([p, q], k) => {
      const ya = midY(p);
      const yb = midY(q);
      const ticks: string[] = [];
      for (let x = c0 + 36; x < c1 - 36; x += 14) ticks.push(`M${x} ${ya} L${x + 7} ${yb} M${x} ${yb} L${x + 7} ${ya}`);
      const bad = named && m.badPairs.includes(k);
      parts.push(<Path key={`t${k}`} d={ticks.join(' ')} stroke={bad ? '#ff7a68' : '#d9dbe0'} strokeWidth={bad ? 1 : 0.7} opacity={0.35 + 0.55 * progress} />);
    });
  }
  const pairBad = (i: number) => named && network && m.badPairs.some((k) => m.pairs[k][0] === i || m.pairs[k][1] === i);
  return (
    <View style={{ width, height: (H * width) / W }} accessible accessibilityRole="image" accessibilityLabel={`Wiring inside ${cable.label}, as measured.`}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={width} height={(H * width) / W} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill={ART.bg} />
        <Label x={10} y={16} text={`END A · ${endA ?? ''}`} size={10} color={ART.sub} />
        <Label x={W - 10} y={16} text={`END B · ${endB ?? ''}`} anchor="end" size={10} color={ART.sub} />
        {/* the jacket, opened along its length */}
        <Rect x={c0} y={top - 4} width={c1 - c0} height={n * rowH + 8} rx={10} fill="#111215" stroke="#3a3c42" strokeWidth={1} strokeDasharray="5 3" />
        {/* contact blocks at each end */}
        <Rect x={xa - 6} y={top - 2} width={12} height={n * rowH + 4} rx={3} fill="#1f2125" stroke="#3a3c42" />
        <Rect x={xb - 6} y={top - 2} width={12} height={n * rowH + 4} rx={3} fill="#1f2125" stroke="#3a3c42" />
        {parts}
        {m.a.map((name, i) => (
          <G key={`la${i}`}>
            <Rect x={xa - 3} y={yOf(i) - 3} width={6} height={6} rx={1} fill={ART.gold} />
            <Label x={xa - 10} y={yOf(i) + 3.5} text={short(name)} anchor="end" size={10} color={pairBad(i) ? '#ff9a8a' : ART.label} />
          </G>
        ))}
        {m.b.map((name, i) => (
          <G key={`lb${i}`}>
            <Rect x={xb - 3} y={yOf(i) - 3} width={6} height={6} rx={1} fill={ART.gold} />
            <Label x={xb + 10} y={yOf(i) + 3.5} text={short(name)} size={10} color={ART.label} />
          </G>
        ))}
        {network ? <Label x={W / 2} y={H - 23} text={named && m.badPairs.length ? 'X marks = wires twisted together · red = the wrong pair' : 'X marks = the two wires twisted together as a pair'} anchor="middle" size={10} color={ART.sub} weight="regular" /> : null}
        <Label x={W / 2} y={H - 9} text="inside the cable — conductors spread apart to trace each one" anchor="middle" size={10} color={ART.muted} weight="regular" />
      </Svg>
    </View>
  );
}

/** Height of a trace for a given cable at `width` (for host layout). */
export function traceAspect(cable: TesterCable): number {
  const m = traceModel(cable);
  const rowH = m.a.length >= 8 ? 13 : 24;
  return W / (34 + m.a.length * rowH + (m.a.length >= 8 ? 44 : 30));
}
