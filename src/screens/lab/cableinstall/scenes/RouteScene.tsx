/**
 * STAGE 3 — Plan the Route (spec §10 + route evaluator §48) — flagship scene.
 *
 * Each CI_ROUTE_SCENARIOS installation is drawn as an honest building-section
 * SVG (stage / corridor / mechanical bay / ceiling tray / doors / rack — or
 * amp room / catwalk / duct / flown cluster) with the three candidate routes
 * as distinct colored paths labeled A/B/C. A FINISHED ⇄ X-RAY toggle reveals
 * the in-wall and above-ceiling portions (dashed while hidden, solid in
 * x-ray; the finished view shows the space without its concealed
 * infrastructure). Cables terminate for real: panel → rack, rack → cluster.
 *
 * The learner SELECTS a route from labeled cards below the drawing (the SVG
 * is never required for input). evaluateRoute/rankRoutes then reveal EVERY
 * option's verdict: six labeled dimension bars with visible numbers, each
 * flag's note, and RuleFeedback for the chosen route's governing rules — the
 * module lesson made structural: the shortest route is not always the best.
 *
 * Completion (honesty rule, §38): both scenarios decided → onComplete with
 * the average dims of the routes the learner actually CHOSE.
 */
import { useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, ScoreBars, announceComplete } from '../bits';
import { OptionChip } from '../../cable/lessons/bits';
import { cableTypeById } from '../data/cableTypes';
import { CI_ROUTE_SCENARIOS, type CiRouteScenario } from '../data/scenarios';
import { evaluateRoute, rankRoutes } from '../engine/routeEval';
import { mergeDims, type CiDim, type CiDimScores } from '../engine/score';
import type { CiModuleProps } from '../registry';

const ROUTE_COLORS = ['#ff8a1e', '#5bb0ff', '#c77dff'] as const;
const LETTERS = ['A', 'B', 'C'] as const;
const ROUTE_DIMS: CiDim[] = ['safety', 'protection', 'routing', 'signal', 'serviceability', 'workmanship'];
const DIM_LABELS: Record<CiDim, string> = {
  safety: 'Safety',
  protection: 'Protection',
  routing: 'Routing',
  signal: 'Signal',
  serviceability: 'Serviceability',
  documentation: 'Documentation',
  workmanship: 'Workmanship',
};

/* ── route geometry (drawing only — verdicts come from the data flags) ────
 * Segments marked `hidden` run in walls / above ceilings / inside the
 * mechanical space: dashed in FINISHED view, solid in X-RAY. */
type CiArtSeg = { d: string; hidden?: boolean };

const ROUTE_SEGS: Record<string, Record<string, CiArtSeg[]>> = {
  'stage-to-rack': {
    'mech-shortcut': [
      { d: 'M104 150 H112' },
      { d: 'M112 150 V70 H262 V150 H296', hidden: true },
      { d: 'M296 150 H302' },
    ],
    'tray-route': [
      { d: 'M104 142 H112' },
      { d: 'M112 142 V42 H318 V112', hidden: true },
      { d: 'M318 112 V124' },
    ],
    'floor-shortcut': [{ d: 'M104 158 V190 H300 h4' }],
  },
  'amp-to-cluster': {
    catwalk: [
      { d: 'M44 128 V116 H88' },
      { d: 'M88 116 H92 V32 H250 V84', hidden: true },
      { d: 'M250 84 V96' },
    ],
    'over-grid': [
      { d: 'M52 128 V122 H70' },
      { d: 'M70 122 V80 Q94 88 118 80 Q142 88 166 80 Q190 88 214 80 Q232 87 246 82 L246 84', hidden: true },
      { d: 'M246 84 V96' },
    ],
    'duct-ride': [
      { d: 'M36 128 V112 H84' },
      { d: 'M84 112 V54 H242 V84', hidden: true },
      { d: 'M242 84 V96' },
    ],
  },
};

/** Letter positions chosen to sit in empty drawing space beside each route. */
const ROUTE_LETTER_POS: Record<string, [number, number][]> = {
  'stage-to-rack': [
    [121, 85],
    [200, 33],
    [216, 184],
  ],
  'amp-to-cluster': [
    [102, 24],
    [60, 76],
    [76, 46],
  ],
};

const MAP_A11Y: Record<string, string> = {
  'stage-to-rack':
    'Building section: stage at left with the input panel, a mechanical bay above the corridor in the middle, and the control room with the rack at right. A cable tray runs above the corridor ceiling. Route A cuts through the mechanical bay, route B rides the ceiling tray, route C crosses the corridor floor through both doorways. Selection happens on the route cards below, not on this drawing.',
  'amp-to-cluster':
    'Building section: amp room at lower left with the rack, the hall at right with a flown loudspeaker cluster, and an attic above the tile ceiling holding a catwalk and an HVAC duct. Route A rides the catwalk on hooks, route B lies across the ceiling tiles, route C is tied along the duct. Selection happens on the route cards below, not on this drawing.',
};

const WALL = '#3a3c42';
const LINE = '#33353b';
const FLOOR = '#4a4d54';
const LABEL = '#7c828c';
const XMETA = '#6f7378';

/* ── building drawings (honest sections; xray strips the surfaces) ──────── */
function StageRackBuilding({ xray, tint }: { xray: boolean; tint: string }) {
  return (
    <>
      <Rect x={6} y={10} width={348} height={192} rx={6} fill="#0e0e12" stroke={WALL} strokeWidth={1.6} />
      {xray ? <Rect x={8} y={12} width={344} height={43} fill="rgba(91,176,255,0.05)" /> : null}
      {/* finished ceiling + tile ticks */}
      <Line x1={6} y1={56} x2={354} y2={56} stroke={LINE} strokeWidth={1.6} />
      {[30, 54, 78, 102, 126, 150, 174, 198, 222, 246, 270, 294, 318, 342].map((x) => (
        <Line key={x} x1={x} y1={56} x2={x} y2={60} stroke={LINE} strokeWidth={1} />
      ))}
      {/* floor + stage platform */}
      <Line x1={6} y1={196} x2={354} y2={196} stroke={FLOOR} strokeWidth={3} />
      <Path d="M10 176 H108 V196 H10 Z" fill="#15151a" stroke={LINE} strokeWidth={1.2} />
      {/* walls, bay slab, door leaves */}
      <Line x1={112} y1={56} x2={112} y2={152} stroke={WALL} strokeWidth={2} />
      <Line x1={258} y1={56} x2={258} y2={152} stroke={WALL} strokeWidth={2} />
      <Line x1={112} y1={128} x2={258} y2={128} stroke={LINE} strokeWidth={1.6} />
      <Line x1={112} y1={196} x2={126} y2={162} stroke={WALL} strokeWidth={1.2} />
      <Line x1={258} y1={196} x2={244} y2={162} stroke={WALL} strokeWidth={1.2} />
      {/* stage input panel (cable class tint) */}
      <Rect x={96} y={136} width={14} height={30} rx={2} fill="#17171c" stroke={tint} strokeWidth={1.4} />
      {/* rack */}
      <Rect x={300} y={120} width={40} height={76} rx={3} fill="#141419" stroke={WALL} strokeWidth={1.4} />
      <Rect x={304} y={126} width={32} height={5} rx={1} fill={tint} opacity={0.85} />
      {[140, 156, 172, 186].map((y) => (
        <Line key={y} x1={304} y1={y} x2={336} y2={y} stroke={LINE} strokeWidth={1.2} />
      ))}
      {/* x-ray: cable tray + hangers, riser sleeve, HVAC internals */}
      {xray ? (
        <>
          <Line x1={90} y1={38} x2={300} y2={38} stroke="#5a5f68" strokeWidth={1.6} />
          <Line x1={90} y1={46} x2={300} y2={46} stroke="#5a5f68" strokeWidth={1.6} />
          {[100, 160, 220, 280].map((x) => (
            <Line key={x} x1={x} y1={12} x2={x} y2={38} stroke={FLOOR} strokeWidth={1.2} />
          ))}
          <Line x1={314} y1={52} x2={314} y2={60} stroke="#5a5f68" strokeWidth={1.4} />
          <Line x1={322} y1={52} x2={322} y2={60} stroke="#5a5f68" strokeWidth={1.4} />
          <Rect x={150} y={80} width={52} height={40} rx={3} fill="#141419" stroke={FLOOR} strokeWidth={1.2} />
          <Rect x={202} y={88} width={48} height={16} rx={2} fill="#111116" stroke={FLOOR} strokeWidth={1} />
          <SvgText x={130} y={32} fill={XMETA} fontSize={12} textAnchor="middle">TRAY</SvgText>
          <SvgText x={176} y={104} fill={XMETA} fontSize={12} textAnchor="middle">HVAC</SvgText>
        </>
      ) : null}
      {/* room labels */}
      <SvgText x={56} y={80} fill={LABEL} fontSize={12} textAnchor="middle">STAGE</SvgText>
      <SvgText x={228} y={122} fill={LABEL} fontSize={12} textAnchor="middle">MECH BAY</SvgText>
      <SvgText x={185} y={148} fill={LABEL} fontSize={12} textAnchor="middle">CORRIDOR</SvgText>
      <SvgText x={306} y={74} fill={LABEL} fontSize={12} textAnchor="middle">CONTROL RM</SvgText>
    </>
  );
}

/** Floor protector drawn OVER route C so the crossing reads as protected. */
function StageRackOverlay() {
  return <Path d="M174 192 h24 l-4 -6 h-16 Z" fill="#26262c" stroke={WALL} strokeWidth={0.9} />;
}

function ClusterBuilding({ xray, tint }: { xray: boolean; tint: string }) {
  return (
    <>
      <Rect x={6} y={10} width={348} height={192} rx={6} fill="#0e0e12" stroke={WALL} strokeWidth={1.6} />
      {xray ? <Rect x={8} y={12} width={344} height={71} fill="rgba(91,176,255,0.05)" /> : null}
      {/* tile ceiling with the cluster opening */}
      <Line x1={6} y1={84} x2={238} y2={84} stroke={LINE} strokeWidth={1.6} />
      <Line x1={270} y1={84} x2={354} y2={84} stroke={LINE} strokeWidth={1.6} />
      {[30, 54, 78, 102, 126, 150, 174, 198, 222, 294, 318, 342].map((x) => (
        <Line key={x} x1={x} y1={84} x2={x} y2={88} stroke={LINE} strokeWidth={1} />
      ))}
      {/* floor */}
      <Line x1={6} y1={196} x2={354} y2={196} stroke={FLOOR} strokeWidth={3} />
      {/* amp room wall + door leaf */}
      <Line x1={96} y1={84} x2={96} y2={156} stroke={WALL} strokeWidth={2} />
      <Line x1={96} y1={196} x2={110} y2={162} stroke={WALL} strokeWidth={1.2} />
      {/* amp rack */}
      <Rect x={22} y={128} width={44} height={68} rx={3} fill="#141419" stroke={WALL} strokeWidth={1.4} />
      <Rect x={26} y={134} width={36} height={5} rx={1} fill={tint} opacity={0.85} />
      {[150, 164, 178].map((y) => (
        <Line key={y} x1={26} y1={y} x2={62} y2={y} stroke={LINE} strokeWidth={1.2} />
      ))}
      {/* cluster rigging (in-hall part always; attic part x-ray) */}
      {xray ? (
        <>
          <Line x1={258} y1={10} x2={258} y2={84} stroke={FLOOR} strokeWidth={1.2} />
          <Line x1={266} y1={10} x2={266} y2={84} stroke={FLOOR} strokeWidth={1.2} />
        </>
      ) : null}
      <Line x1={258} y1={84} x2={258} y2={96} stroke={FLOOR} strokeWidth={1.2} />
      <Line x1={266} y1={84} x2={266} y2={96} stroke={FLOOR} strokeWidth={1.2} />
      {/* flown cluster (cable class tint on the input plate) */}
      <Path d="M236 96 H276 L268 128 H244 Z" fill="#141419" stroke={WALL} strokeWidth={1.4} />
      <Rect x={244} y={99} width={24} height={4} rx={1} fill={tint} opacity={0.85} />
      <Line x1={242} y1={112} x2={270} y2={112} stroke={LINE} strokeWidth={1.2} />
      <Line x1={240} y1={120} x2={272} y2={120} stroke={LINE} strokeWidth={1.2} />
      {/* x-ray: catwalk deck + posts + J-hook ticks + duct */}
      {xray ? (
        <>
          <Line x1={116} y1={36} x2={344} y2={36} stroke="#5a5f68" strokeWidth={1.6} />
          <Line x1={116} y1={40} x2={344} y2={40} stroke="#5a5f68" strokeWidth={1.6} />
          {[130, 190, 310].map((x) => (
            <Line key={x} x1={x} y1={12} x2={x} y2={36} stroke={FLOOR} strokeWidth={1.2} />
          ))}
          {[120, 150, 180, 210, 240].map((x) => (
            <Line key={x} x1={x} y1={32} x2={x} y2={36} stroke={XMETA} strokeWidth={1} />
          ))}
          <Rect x={100} y={56} width={140} height={16} rx={3} fill="#111116" stroke={FLOOR} strokeWidth={1.2} />
          <SvgText x={170} y={68} fill={XMETA} fontSize={12} textAnchor="middle">DUCT</SvgText>
          <SvgText x={300} y={52} fill={XMETA} fontSize={12} textAnchor="middle">CATWALK</SvgText>
        </>
      ) : null}
      {/* room labels */}
      <SvgText x={50} y={100} fill={LABEL} fontSize={12} textAnchor="middle">AMP ROOM</SvgText>
      <SvgText x={160} y={150} fill={LABEL} fontSize={12} textAnchor="middle">HALL</SvgText>
      <SvgText x={256} y={142} fill={LABEL} fontSize={12} textAnchor="middle">CLUSTER</SvgText>
    </>
  );
}

/* ── the section map: building + routes + letters ───────────────────────── */
function RouteMap({ scenario, xray, picked, w }: { scenario: CiRouteScenario; xray: boolean; picked: string | null; w: number }) {
  const h = Math.round((w * 220) / 360);
  const tint = cableTypeById(scenario.cable).tint;
  return (
    <View style={styles.mapFrame} accessibilityRole="image" accessibilityLabel={MAP_A11Y[scenario.id]}>
      <Svg width={w} height={h} viewBox="0 0 360 220">
        {scenario.id === 'stage-to-rack' ? <StageRackBuilding xray={xray} tint={tint} /> : <ClusterBuilding xray={xray} tint={tint} />}
        {scenario.options.map((o, i) => {
          const segs = ROUTE_SEGS[scenario.id][o.id] ?? [];
          const color = ROUTE_COLORS[i];
          const isPicked = picked === o.id;
          const dimmed = picked != null && !isPicked;
          return (
            <G key={o.id} opacity={dimmed ? 0.4 : 1}>
              {segs.map((sg, j) => (
                <Path
                  key={j}
                  d={sg.d}
                  stroke={color}
                  strokeWidth={isPicked ? 3.4 : 2.4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={sg.hidden && !xray ? '5 5' : undefined}
                  opacity={sg.hidden && !xray ? 0.55 : 1}
                />
              ))}
            </G>
          );
        })}
        {scenario.id === 'stage-to-rack' ? <StageRackOverlay /> : null}
        {scenario.options.map((o, i) => {
          const pos = ROUTE_LETTER_POS[scenario.id][i];
          return (
            <SvgText key={o.id} x={pos[0]} y={pos[1]} fill={ROUTE_COLORS[i]} fontSize={13} fontWeight="bold" textAnchor="middle">
              {LETTERS[i]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

/* ── six labeled dimension bars, numbers visible (spec §22) ─────────────── */
function DimBars({ dims }: { dims: CiDimScores }) {
  return (
    <View style={{ gap: 4 }}>
      {ROUTE_DIMS.map((d) => {
        const v = dims[d] ?? 0;
        const barTint = v >= 85 ? colors.green : v >= 55 ? colors.amber : '#ff8a6b';
        return (
          <View key={d} style={styles.dimRow} accessibilityLabel={`${DIM_LABELS[d]}: ${v} out of 100`}>
            <Text style={styles.dimLabel} numberOfLines={1}>
              {DIM_LABELS[d]}
            </Text>
            <View style={styles.dimTrack}>
              <View style={[styles.dimFill, { width: `${v}%`, backgroundColor: barTint }]} />
            </View>
            <Text style={styles.dimNum}>{v}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function RouteScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [xrays, setXrays] = useState<Record<string, boolean>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [fired, setFired] = useState(completed);
  const mapW = Math.max(280, width - 22);

  const ranked = useMemo(() => {
    const m: Record<string, ReturnType<typeof rankRoutes>> = {};
    for (const s of CI_ROUTE_SCENARIOS) m[s.id] = rankRoutes(s.options);
    return m;
  }, []);

  const setXray = (sid: string, v: boolean) => {
    setXrays((prev) => ({ ...prev, [sid]: v }));
    AccessibilityInfo.announceForAccessibility(
      v ? 'X-ray view: in-wall and above-ceiling runs shown solid.' : 'Finished view: concealed runs dashed.',
    );
  };

  const select = (sid: string, oid: string) => {
    if (picks[sid]) return;
    const next = { ...picks, [sid]: oid };
    setPicks(next);
    const sc = CI_ROUTE_SCENARIOS.find((x) => x.id === sid);
    const rk = ranked[sid];
    if (sc && rk) {
      const mine = rk.find((r) => r.option.id === oid);
      const oi = sc.options.findIndex((o) => o.id === oid);
      if (mine) {
        AccessibilityInfo.announceForAccessibility(
          `Route ${LETTERS[oi]} selected — it scored ${mine.overall} of 100. Best route: ${rk[0].option.name}, ${rk[0].overall}.`,
        );
      }
    }
    if (!fired && CI_ROUTE_SCENARIOS.every((x) => next[x.id] != null)) {
      setFired(true);
      let dims: CiDimScores = {};
      for (const x of CI_ROUTE_SCENARIOS) {
        const chosen = x.options.find((op) => op.id === next[x.id]);
        if (chosen) dims = mergeDims(dims, evaluateRoute(chosen).dims);
      }
      announceComplete('Stage 3 complete. The shortest route is not always the best route.');
      onComplete(dims);
    }
  };

  /** Average dims of the routes actually chosen (for the completion card). */
  const chosenDims = useMemo(() => {
    if (!CI_ROUTE_SCENARIOS.every((s) => picks[s.id] != null)) return null;
    let dims: CiDimScores = {};
    for (const s of CI_ROUTE_SCENARIOS) {
      const chosen = s.options.find((o) => o.id === picks[s.id]);
      if (chosen) dims = mergeDims(dims, evaluateRoute(chosen).dims);
    }
    return dims;
  }, [picks]);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.lead}>
        {'Judge each candidate on the whole life of the cable, not the pull day. Pick the route you would install — every option is then scored on six dimensions.'}
      </Text>

      {CI_ROUTE_SCENARIOS.map((s, si) => {
        const xray = !!xrays[s.id];
        const picked = picks[s.id] ?? null;
        const rk = ranked[s.id];
        const type = cableTypeById(s.cable);
        const mineOpt = picked ? s.options.find((o) => o.id === picked) : null;
        const seenRules = new Set<string>();
        const fbFlags = mineOpt
          ? mineOpt.flags.filter((f) => (seenRules.has(f.ruleId) ? false : (seenRules.add(f.ruleId), true))).slice(0, 3)
          : [];
        const shortest = s.options.reduce((m, o) => (o.relLength < m.relLength ? o : m), s.options[0]);
        const shortIdx = rk.findIndex((r) => r.option.id === shortest.id);
        const shortRank = shortIdx + 1;
        const shortOverall = shortIdx >= 0 ? rk[shortIdx].overall : 0;

        return (
          <CiSection key={s.id} title={`INSTALLATION ${si + 1} OF ${CI_ROUTE_SCENARIOS.length} — ${s.title.toUpperCase()}`}>
            <Text style={styles.brief}>{s.brief}</Text>
            <View style={styles.cableRow}>
              <View style={[styles.cableSwatch, { backgroundColor: type.tint }]} />
              <Text style={styles.cableName}>CABLE: {type.name}</Text>
            </View>
            {si === 0 ? (
              <Text style={styles.tintNote}>Training visualization colors — actual field cable colors vary.</Text>
            ) : null}

            <View style={styles.chipRow}>
              <OptionChip label="FINISHED" active={!xray} onPress={() => setXray(s.id, false)} />
              <OptionChip label="X-RAY" active={xray} onPress={() => setXray(s.id, true)} />
            </View>
            <RouteMap scenario={s} xray={xray} picked={picked} w={mapW} />
            <Text style={styles.legendLine}>
              {xray
                ? 'X-RAY — surfaces stripped: in-wall and above-ceiling runs solid.'
                : 'FINISHED — the space as occupants see it: concealed runs dashed.'}
            </Text>
            <View style={styles.legendRow}>
              {s.options.map((o, i) => (
                <View key={o.id} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: ROUTE_COLORS[i] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {LETTERS[i]} · {o.name}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.q}>WHICH ROUTE DO YOU PULL?</Text>
            <View style={{ gap: 9 }}>
              {s.options.map((o, i) => {
                const isPicked = picked === o.id;
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.routeCard, isPicked && { borderColor: ROUTE_COLORS[i] + 'AA' }]}
                    disabled={picked != null}
                    onPress={() => select(s.id, o.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isPicked, disabled: picked != null }}
                    accessibilityLabel={`Route ${LETTERS[i]}: ${o.name}. ${o.path} Relative length ${o.relLength.toFixed(1)} times the shortest.`}
                  >
                    <View style={styles.routeHead}>
                      <View style={[styles.letterDot, { borderColor: ROUTE_COLORS[i] }]}>
                        <Text style={[styles.letterText, { color: ROUTE_COLORS[i] }]}>{LETTERS[i]}</Text>
                      </View>
                      <Text style={styles.routeName}>{o.name}</Text>
                    </View>
                    <Text style={styles.routePath}>{o.path}</Text>
                    <Text style={styles.routeLen}>Relative length ×{o.relLength.toFixed(1)} (shortest = ×1.0)</Text>
                  </Pressable>
                );
              })}
            </View>

            {picked && mineOpt ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.revealEyebrow}>THE VERDICT — ALL THREE ROUTES, SCORED</Text>
                {rk.map(({ option, verdict, overall }, ri) => {
                  const oi = s.options.findIndex((o) => o.id === option.id);
                  const mine = option.id === picked;
                  return (
                    <View key={option.id} style={[styles.verdictCard, mine && { borderColor: ROUTE_COLORS[oi] + '99' }]}>
                      <View style={styles.verdictHead}>
                        <Text style={[styles.verdictLetter, { color: ROUTE_COLORS[oi] }]}>{LETTERS[oi]}</Text>
                        <Text style={styles.verdictName} numberOfLines={2}>
                          {option.name}
                        </Text>
                        <Text style={styles.verdictOverall}>
                          {overall}
                          <Text style={styles.verdictOutOf}> /100</Text>
                        </Text>
                      </View>
                      {ri === 0 || mine ? (
                        <View style={styles.tagRow}>
                          {ri === 0 ? <Text style={styles.tagBest}>✓ BEST CALL</Text> : null}
                          {mine ? <Text style={styles.tagMine}>YOUR PICK</Text> : null}
                        </View>
                      ) : null}
                      <DimBars dims={verdict.dims} />
                      <View style={{ gap: 3 }}>
                        {option.flags.map((f, fi) => (
                          <Text key={`${f.ruleId}-${fi}`} style={[styles.flagGlyph, { color: f.positive ? colors.green : '#ff9b8f' }]}>
                            {f.positive ? '+' : '−'}  <Text style={styles.flagNote}>{f.note}</Text>
                          </Text>
                        ))}
                        {verdict.overallNotes.slice(option.flags.length).map((n) => (
                          <Text key={n} style={styles.flagGlyph}>
                            ·  <Text style={styles.flagNote}>{n}</Text>
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}

                <Text style={styles.revealEyebrow}>WHY YOUR ROUTE SCORED THAT WAY</Text>
                {fbFlags.map((f) => (
                  <RuleFeedback key={f.ruleId} ruleId={f.ruleId} verdict={f.positive ? 'good' : 'bad'} short={f.note} openSources={openSources} />
                ))}

                <View style={styles.lessonCard}>
                  <Text style={styles.lessonHead}>THE SHORTEST ROUTE IS NOT ALWAYS THE BEST ROUTE</Text>
                  <Text style={styles.lessonBody}>
                    {shortRank === 1
                      ? `${shortest.name} is the shortest pull here and still held up — that is a coincidence to verify every time, not a rule.`
                      : `${shortest.name} is the shortest pull here — and it finished ${
                          shortRank === rk.length ? `LAST at ${shortOverall}/100` : `#${shortRank} of ${rk.length} at ${shortOverall}/100`
                        }, ${rk[0].overall - shortOverall} points behind ${rk[0].option.name}. Length is one input; safety, protection, pathway quality and the next technician are the rest.`}
                  </Text>
                  <RuleFeedback ruleId="plan-shortest-not-best" verdict="info" openSources={openSources} />
                </View>
              </View>
            ) : null}
          </CiSection>
        );
      })}

      {chosenDims ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneHead}>✓ STAGE 3 COMPLETE — YOUR DECISIONS, SCORED</Text>
          <ScoreBars dims={chosenDims} />
          <Text style={styles.doneSub}>
            {'The average of the two routes you chose. Replay and choose differently — the profile follows your calls.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  brief: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  cableRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cableSwatch: { width: 13, height: 13, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' },
  cableName: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', gap: 7 },
  mapFrame: { borderRadius: 12, borderWidth: 1, borderColor: '#232329', backgroundColor: '#0e0e12', padding: 5, alignSelf: 'flex-start' },
  legendLine: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontFamily: fonts.barlowCondensedMedium, fontSize: 12.5, color: colors.textSecondary },
  q: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary, marginTop: 2 },
  routeCard: { gap: 5, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  routeHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  letterDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101014' },
  letterText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13 },
  routeName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  routePath: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  routeLen: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },
  revealEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel, marginTop: 2 },
  verdictCard: { gap: 8, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#111115', padding: 12 },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  verdictLetter: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, width: 18 },
  verdictName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textPrimary },
  verdictOverall: { fontFamily: fonts.mono, fontSize: 17, color: colors.amberLabel },
  verdictOutOf: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSub },
  tagRow: { flexDirection: 'row', gap: 10 },
  tagBest: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.green },
  tagMine: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimLabel: { width: 92, fontFamily: fonts.barlowCondensedMedium, fontSize: 12, color: colors.textSecondary },
  dimTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#222228', overflow: 'hidden' },
  dimFill: { height: 8, borderRadius: 4 },
  dimNum: { width: 28, textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  flagGlyph: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5 },
  flagNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary },
  lessonCard: { gap: 8, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  doneCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(55,224,95,.45)', backgroundColor: '#0c1a10', padding: 13 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.green },
  doneSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
