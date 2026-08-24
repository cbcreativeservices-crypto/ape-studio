/**
 * STAGE 7 — Wall & Surface Installations (spec §31).
 *
 * Four short scenarios on ONE room elevation (rack, wall device, baseboard
 * raceway, doorway, an unfinished opening):
 *   S1 pick the raceway route to the wall device,
 *   S2 three wall penetrations in sequence — the UNKNOWN wall is the critical
 *      one: VERIFY BEFORE PENETRATING, never drill-first,
 *   S3 the active doorway in both time-frames (temporary event vs permanent),
 *   S4 the raw-edge fix at the unfinished opening.
 * An X-RAY toggle reveals the in-wall portions of routes (dashed→solid) — and
 * demonstrates that geometry alone can never reveal a fire rating.
 *
 * Completion: all four scenarios answered correctly (wrong picks can be
 * corrected; they cost score) → onComplete({ safety, protection, routing }),
 * fired once. Accessibility: labeled ≥44dp buttons only (no drag, no
 * color-only state), verdicts announced, replay via `completed`. The SVG is a
 * training visualization: honest geometry, terminated runs, gentle bends on
 * everything correct.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip, lessonStyles } from '../../cable/lessons/bits';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { CI_WALL_TYPES } from '../data/scenarios';
import { clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── scenario option data (rules referenced by id; specs stay in data) ──── */
type RouteId = 'a' | 'b' | 'c';

const S1_ROUTES: { id: RouteId; label: string; good: boolean; ruleId: string; short: string }[] = [
  {
    id: 'a',
    label: 'A — Baseboard raceway with fittings to the device',
    good: true,
    ruleId: 'wall-raceway-fill-transitions',
    short: 'Raceway with capacity, a fitting at every transition, and a clean riser to the plate — protected and serviceable.',
  },
  {
    id: 'b',
    label: 'B — Diagonal straight across the open wall',
    good: false,
    ruleId: 'wall-raceway-fill-transitions',
    short: 'An exposed diagonal across a finished wall: no pathway, no protection, and workmanship that invites damage.',
  },
  {
    id: 'c',
    label: 'C — Along the floor and through the doorway',
    good: false,
    ruleId: 'wall-doorway',
    short: 'Through the door gap — that door will pinch this cable on every one of its thousands of cycles.',
  },
];

/** Correct-pick one-liners for the three wall types (wrong picks fall back to
 *  the rule's studentText). */
const WALL_GOOD_SHORT: Record<string, string> = {
  'w-ordinary': 'Verified non-rated from the drawings — sleeve and bushing the opening, then route through.',
  'w-rated': 'The listed penetration/firestop system matched to THIS assembly — never generic caulk, never "later."',
  'w-unknown': 'Stop and VERIFY. Drilling is the one step you can never take back — unknown assembly means no drill.',
};

const S3_TEMP: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'protect', label: 'Protect the crossing with a proper threshold solution', good: true, short: 'Temporary changes the solutions, not the standard of care — a suitable threshold protector keeps the door and the cable working.' },
  { id: 'wedge', label: 'Wedge the door open for the event', good: false, short: 'Now the DOOR is defeated — possibly a fire door. The cable problem became a life-safety problem.' },
  { id: 'ride', label: 'Let the door close on it — it is only two days', good: false, short: 'A door cycles thousands of times. Two days of pinching is real damage, and workplace rules apply to temporary work too.' },
];

const S3_PERM: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'reroute', label: 'Reroute through a building pathway', good: true, short: 'Permanent runs live in pathways. The doorway stops being part of the route at all.' },
  { id: 'keep', label: 'Keep it through the doorway — it has been fine', good: false, short: '"Fine so far" is how intermittent faults are born. Permanent runs never fight doors.' },
  { id: 'cord', label: 'Staple flexible cord around the frame as the permanent feed', good: false, short: 'Flexible cord is not permanent building wiring — permanent runs use approved wiring in a pathway.' },
];

const S4_OPTS: { id: string; label: string; good: boolean; short: string }[] = [
  { id: 'bushing', label: 'Install a bushing / grommet on the opening', good: true, short: 'A finished edge before the cable — pennies now instead of a re-pull later.' },
  { id: 'tape', label: 'Wrap the edge in tape and move on', good: false, short: 'Tape creeps, dries and quits. The raw edge is still there, abrading with every micro-movement.' },
  { id: 'leave', label: 'Leave it — the jacket looks fine today', good: false, short: 'Edge damage is cumulative and invisible until failure. Today\'s "fine" is next year\'s intermittent.' },
];

/* ── the room elevation (training visualization) ────────────────────────── */
const VB_W = 360;
const VB_H = 200;

function RoomSvg({
  w,
  xray,
  routePick,
  wallIdx,
  wallsActive,
  protectorOn,
  bushed,
}: {
  w: number;
  xray: boolean;
  routePick: RouteId | null;
  wallIdx: number;
  wallsActive: boolean;
  protectorOn: boolean;
  bushed: boolean;
}) {
  const h = Math.round((w * VB_H) / VB_W);
  const routeOpacity = (id: RouteId) => (routePick == null ? 0.8 : routePick === id ? 1 : 0.3);
  const routeWidth = (id: RouteId) => (routePick === id ? 4 : 3);
  const markerStroke = (i: number) => (i < wallIdx ? colors.green : wallsActive && i === wallIdx ? colors.amber : '#55555e');
  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      accessibilityLabel={`Room elevation: equipment rack at left, wall device mid-wall, unfinished opening above it, doorway at right. Three candidate routes A, B, C and three numbered wall zones. X-ray ${xray ? 'on' : 'off'}.`}
    >
      <Rect x={2} y={6} width={356} height={186} rx={10} fill="#15151a" stroke="#26262c" strokeWidth={1.5} />

      {/* X-RAY: wall cavity + studs (geometry only — a rating never shows) */}
      {xray ? (
        <>
          <Rect x={4} y={14} width={352} height={150} fill="rgba(79,208,224,.045)" />
          {[84, 104, 128, 152, 176, 200, 232, 256, 340].map((x) => (
            <Line key={x} x1={x} y1={16} x2={x} y2={160} stroke="#2e2e36" strokeWidth={2} strokeDasharray="5 5" />
          ))}
        </>
      ) : null}

      {/* floor + baseboard */}
      <Rect x={2} y={162} width={356} height={8} fill="#1b1b21" />
      <Line x1={2} y1={170} x2={358} y2={170} stroke="#2c2c33" strokeWidth={2} />
      <Rect x={2} y={170} width={356} height={22} fill="#0e0e11" />

      {/* rack (left) */}
      <Rect x={16} y={58} width={54} height={112} fill="#101014" stroke="#3a3c42" strokeWidth={1.4} />
      <Line x1={24} y1={62} x2={24} y2={166} stroke="#26262c" strokeWidth={1.5} />
      <Line x1={62} y1={62} x2={62} y2={166} stroke="#26262c" strokeWidth={1.5} />
      {[74, 90, 106, 122, 138, 154].map((y) => (
        <Line key={y} x1={24} y1={y} x2={62} y2={y} stroke="#26262c" strokeWidth={1} />
      ))}
      <Rect x={26} y={76} width={32} height={10} rx={1.5} fill="#17171c" stroke="#33333c" strokeWidth={0.8} />
      <Rect x={26} y={124} width={32} height={10} rx={1.5} fill="#17171c" stroke="#33333c" strokeWidth={0.8} />
      <Circle cx={55} cy={81} r={1.6} fill={colors.amber} />

      {/* wall device (destination plate) */}
      <Rect x={206} y={108} width={18} height={26} rx={2} fill="#17171c" stroke="#6f7378" strokeWidth={1.2} />
      <Circle cx={215} cy={117} r={3} fill="none" stroke="#4fd0e0" strokeWidth={1.4} />
      <Circle cx={215} cy={128} r={1.2} fill="#55555e" />

      {/* rated-wall zone (scenario 2, wall 2) + unknown zone (wall 3) */}
      <Rect x={232} y={54} width={30} height={104} fill="rgba(255,90,72,.05)" stroke="rgba(255,90,72,.35)" strokeWidth={1} strokeDasharray="4 4" />
      <Rect x={328} y={54} width={26} height={104} fill="rgba(255,255,255,.02)" stroke="#3a3a44" strokeWidth={1} strokeDasharray="4 4" />
      <SvgText x={341} y={120} fill="#6f7378" fontSize={15} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
        ?
      </SvgText>

      {/* doorway (right): jambs, header, ajar slab with a gap beneath */}
      <Rect x={268} y={42} width={56} height={10} fill="#26262c" />
      <Rect x={268} y={50} width={6} height={120} fill="#26262c" />
      <Rect x={318} y={50} width={6} height={120} fill="#26262c" />
      <Path d="M276 50 L312 56 L312 160 L276 166 Z" fill="#191920" stroke="#33333c" strokeWidth={1.2} />
      <Circle cx={306} cy={110} r={2} fill="#6f7378" />

      {/* unfinished opening + its exiting cable (scenario 4) */}
      <Path d="M132 62 L149 58 L156 66 L153 78 L138 82 L130 72 Z" fill="#0b0b0e" stroke="#55555e" strokeWidth={1.3} />
      <Path d="M138 70 L150 76" stroke="#4fd0e0" strokeWidth={2.5} fill="none" strokeDasharray={xray ? undefined : '3 4'} />
      {bushed ? (
        <>
          {/* corrected: bushing ring + gentle radius down into the raceway */}
          <Path d="M150 76 Q154 81 154 94 L154 150" stroke="#4fd0e0" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Circle cx={151} cy={77} r={5.5} fill="none" stroke={colors.green} strokeWidth={2} />
        </>
      ) : (
        <>
          {/* defect: hard fold over the raw edge */}
          <Path d="M150 76 L151 79 L151 150" stroke="#4fd0e0" strokeWidth={3} fill="none" />
          <Path d="M146 71 L151 77 L157 73" stroke="#ff5a48" strokeWidth={1.6} fill="none" />
        </>
      )}

      {/* ROUTE A — baseboard raceway + fittings + in-wall riser to the plate */}
      <Rect x={70} y={152} width={144} height={10} rx={2} fill="#101014" stroke="#4fd0e0" strokeWidth={1.4} opacity={routeOpacity('a')} />
      <Rect x={66} y={150} width={8} height={14} rx={1.5} fill="#17171c" stroke="#4fd0e0" strokeWidth={1.2} opacity={routeOpacity('a')} />
      <Rect x={208} y={148} width={12} height={16} rx={2} fill="#17171c" stroke="#4fd0e0" strokeWidth={1.2} opacity={routeOpacity('a')} />
      <Line x1={76} y1={157} x2={206} y2={157} stroke="#4fd0e0" strokeWidth={2} opacity={routeOpacity('a')} />
      <Line
        x1={215}
        y1={148}
        x2={215}
        y2={134}
        stroke="#4fd0e0"
        strokeWidth={xray ? 3 : 2}
        strokeDasharray={xray ? undefined : '3 4'}
        opacity={routeOpacity('a')}
      />
      <Circle cx={140} cy={157} r={8} fill="#101014" stroke="#4fd0e0" strokeWidth={1.4} opacity={routeOpacity('a')} />
      <SvgText x={140} y={160.5} fill="#4fd0e0" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" opacity={routeOpacity('a')}>
        A
      </SvgText>

      {/* ROUTE B — diagonal surface run across the open wall */}
      <Path d="M70 64 Q140 88 206 112" stroke="#ffd35e" strokeWidth={routeWidth('b')} fill="none" strokeLinecap="round" opacity={routeOpacity('b')} />
      <Circle cx={128} cy={84} r={8} fill="#101014" stroke="#ffd35e" strokeWidth={1.4} opacity={routeOpacity('b')} />
      <SvgText x={128} y={87.5} fill="#ffd35e" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" opacity={routeOpacity('b')}>
        B
      </SvgText>

      {/* ROUTE C — floor run through the doorway gap (continues off-room) */}
      <Path d="M70 167 L314 167" stroke="#37d97b" strokeWidth={routeWidth('c')} fill="none" strokeLinecap="round" opacity={routeOpacity('c')} />
      <Path d="M316 167 L344 167" stroke="#37d97b" strokeWidth={2.5} fill="none" strokeDasharray="4 4" opacity={routeOpacity('c')} />
      <Path d="M344 163 L352 167 L344 171 Z" fill="#37d97b" opacity={routeOpacity('c')} />
      <Circle cx={250} cy={167} r={8} fill="#101014" stroke="#37d97b" strokeWidth={1.4} opacity={routeOpacity('c')} />
      <SvgText x={250} y={170.5} fill="#37d97b" fontSize={9} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" opacity={routeOpacity('c')}>
        C
      </SvgText>

      {/* scenario 3: threshold protector appears once the temporary fix is chosen */}
      {protectorOn ? (
        <Path d="M280 167 L288 160 L304 160 L312 167 Z" fill={colors.amber} opacity={0.9} />
      ) : null}

      {/* scenario 2 wall markers ① ② ③ */}
      {[
        { x: 110, y: 96 },
        { x: 247, y: 96 },
        { x: 341, y: 96 },
      ].map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={9} fill="#101014" stroke={markerStroke(i)} strokeWidth={1.6} />
      ))}
      {[110, 247, 341].map((x, i) => (
        <SvgText key={x} x={x} y={99.5} fill={markerStroke(i)} fontSize={10} fontFamily={fonts.oswaldSemiBold} textAnchor="middle">
          {String(i + 1)}
        </SvgText>
      ))}
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function WallsScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [xray, setXray] = useState(false);
  const [routePick, setRoutePick] = useState<RouteId | null>(completed ? 'a' : null);
  const [s1Solved, setS1Solved] = useState(completed);
  const [wallIdx, setWallIdx] = useState(completed ? CI_WALL_TYPES.length : 0);
  const [wallPick, setWallPick] = useState<string | null>(null);
  const [tempPick, setTempPick] = useState<string | null>(completed ? 'protect' : null);
  const [permPick, setPermPick] = useState<string | null>(completed ? 'reroute' : null);
  const [edgePick, setEdgePick] = useState<string | null>(completed ? 'bushing' : null);
  const [fired, setFired] = useState(completed);
  const wrongs = useRef({ s1: 0, s2: 0, s3: 0, s4: 0 });

  const say = (t: string) => AccessibilityInfo.announceForAccessibility(t);

  const s2Done = wallIdx >= CI_WALL_TYPES.length;
  const tempOk = tempPick === 'protect';
  const permOk = permPick === 'reroute';
  const s3Done = tempOk && permOk;
  const s4Done = edgePick === 'bushing';
  const allDone = s1Solved && s2Done && s3Done && s4Done;

  useEffect(() => {
    if (fired || !allDone) return;
    setFired(true);
    announceComplete('Stage 7 complete.');
    onComplete({
      safety: clamp100(100 - 12 * (wrongs.current.s2 + wrongs.current.s3)),
      protection: clamp100(100 - 12 * (wrongs.current.s1 + wrongs.current.s4)),
      routing: clamp100(100 - 10 * (wrongs.current.s1 + wrongs.current.s2)),
    });
  }, [allDone, fired, onComplete]);

  /* S1 */
  const pickedRoute = routePick ? S1_ROUTES.find((r) => r.id === routePick) : undefined;
  const pickRoute = (r: (typeof S1_ROUTES)[number]) => {
    if (s1Solved) return;
    setRoutePick(r.id);
    if (r.good) setS1Solved(true);
    else wrongs.current.s1 += 1;
    say(`${r.good ? 'Correct.' : 'Not the professional route.'} ${r.short}`);
  };

  /* S2 */
  const wall = CI_WALL_TYPES[wallIdx];
  const wallRight = wall != null && wallPick === wall.correctAction;
  const pickWallAction = (action: string) => {
    if (!wall || wallRight) return;
    setWallPick(action);
    const right = action === wall.correctAction;
    if (!right) wrongs.current.s2 += 1;
    say(right ? `Correct. ${WALL_GOOD_SHORT[wall.id] ?? ''}` : 'Not the professional action for this wall.');
  };
  const nextWall = () => {
    setWallIdx((i) => i + 1);
    setWallPick(null);
  };

  /* S3 / S4 — shared pick handler over an option list */
  const pickFrom = (
    opts: { id: string; label: string; good: boolean; short: string }[],
    current: string | null,
    set: (id: string) => void,
    wrongKey: 's3' | 's4',
  ) => (id: string) => {
    const solved = opts.find((o) => o.id === current)?.good === true;
    if (solved) return;
    const o = opts.find((x) => x.id === id);
    if (!o) return;
    set(id);
    if (!o.good) wrongs.current[wrongKey] += 1;
    say(`${o.good ? 'Correct.' : 'Not quite.'} ${o.short}`);
  };
  const pickTemp = pickFrom(S3_TEMP, tempPick, setTempPick, 's3');
  const pickPerm = pickFrom(S3_PERM, permPick, setPermPick, 's3');
  const pickEdge = pickFrom(S4_OPTS, edgePick, setEdgePick, 's4');

  const tempOpt = S3_TEMP.find((o) => o.id === tempPick);
  const permOpt = S3_PERM.find((o) => o.id === permPick);
  const edgeOpt = S4_OPTS.find((o) => o.id === edgePick);

  const artW = Math.max(160, width);

  return (
    <View style={{ gap: 14 }}>
      {/* the one room, shared by all four scenarios */}
      <View style={{ gap: 8 }}>
        <View style={lessonStyles.chipWrap}>
          <OptionChip
            label={xray ? 'X-RAY WALL VIEW: ON' : 'X-RAY WALL VIEW: OFF'}
            active={xray}
            onPress={() => {
              setXray((v) => {
                say(v ? 'X-ray off.' : 'X-ray on. Studs and in-wall runs are visible — a fire rating still is not.');
                return !v;
              });
            }}
          />
        </View>
        <RoomSvg
          w={artW}
          xray={xray}
          routePick={routePick}
          wallIdx={wallIdx}
          wallsActive={s1Solved && !s2Done}
          protectorOn={tempOk}
          bushed={s4Done}
        />
        <Text style={styles.legend}>
          Rack · route A (raceway) · route B (diagonal) · route C (doorway) · rough opening · wall zones ① ② ③
        </Text>
        {xray ? (
          <Text style={styles.xrayNote}>
            X-ray shows geometry — studs and hidden runs. It cannot show a fire rating; only the drawings can. Remember that
            for scenario 2.
          </Text>
        ) : null}
      </View>

      {/* S1 — SURFACE RACEWAY */}
      <CiSection title="1 · SURFACE RACEWAY — PICK THE ROUTE">
        <Text style={styles.lead}>
          A permanent line must get from the rack to the wall device. Three candidates are drawn — judge the whole life of
          the cable.
        </Text>
        <View style={{ gap: 7 }}>
          {S1_ROUTES.map((r) => (
            <OptionChip
              key={r.id}
              label={r.label}
              active={routePick === r.id}
              disabled={s1Solved && routePick !== r.id}
              onPress={() => pickRoute(r)}
            />
          ))}
        </View>
        {pickedRoute ? (
          <RuleFeedback
            ruleId={pickedRoute.ruleId}
            verdict={pickedRoute.good ? 'good' : 'bad'}
            short={pickedRoute.short}
            openSources={openSources}
          />
        ) : null}
      </CiSection>

      {/* S2 — WALL PENETRATION (sequential wall types) */}
      {s1Solved ? (
        <CiSection title="2 · WALL PENETRATION — WHAT KIND OF WALL IS THIS?">
          <Text style={styles.lead}>
            The route must pass through three walls (markers ① ② ③). The action follows the ASSEMBLY — one wall at a time.
          </Text>
          {CI_WALL_TYPES.slice(0, wallIdx).map((wSolved) => (
            <Text key={wSolved.id} style={styles.solvedLine}>
              ✓ {wSolved.label} — {wSolved.correctAction}
            </Text>
          ))}
          {wall ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.wallLabel}>
                WALL {wallIdx + 1} OF {CI_WALL_TYPES.length}: {wall.label}
              </Text>
              <View style={{ gap: 7 }}>
                {wall.actions.map((a) => (
                  <OptionChip
                    key={a}
                    label={a}
                    active={wallPick === a}
                    disabled={wallRight && wallPick !== a}
                    onPress={() => pickWallAction(a)}
                  />
                ))}
              </View>
              {wallPick != null ? (
                <RuleFeedback
                  ruleId={wall.ruleId}
                  verdict={wallRight ? 'good' : 'bad'}
                  short={wallRight ? WALL_GOOD_SHORT[wall.id] : undefined}
                  openSources={openSources}
                />
              ) : null}
              {wallRight ? (
                <OptionChip
                  label={wallIdx + 1 < CI_WALL_TYPES.length ? 'NEXT WALL ›' : 'ALL WALLS ANSWERED ✓'}
                  action
                  onPress={nextWall}
                />
              ) : null}
            </View>
          ) : (
            <Text style={styles.doneLine}>
              ✓ All three answered. The unknown wall is the one that matters most: verify BEFORE penetrating — never
              drill-first.
            </Text>
          )}
        </CiSection>
      ) : null}

      {/* S3 — DOORWAY, both time-frames */}
      {s2Done ? (
        <CiSection title="3 · THE DOORWAY — TWO TIME-FRAMES">
          <Text style={styles.lead}>
            A cable must get past the active doorway (route C showed the failure). The correct answer depends on how long
            it stays.
          </Text>
          <Text style={styles.qLabel}>TEMPORARY — a two-day event:</Text>
          <View style={{ gap: 7 }}>
            {S3_TEMP.map((o) => (
              <OptionChip key={o.id} label={o.label} active={tempPick === o.id} disabled={tempOk && tempPick !== o.id} onPress={() => pickTemp(o.id)} />
            ))}
          </View>
          {tempOpt ? <RuleFeedback ruleId="wall-doorway" verdict={tempOpt.good ? 'good' : 'bad'} short={tempOpt.short} openSources={openSources} /> : null}
          <Text style={styles.qLabel}>PERMANENT — a system that stays:</Text>
          <View style={{ gap: 7 }}>
            {S3_PERM.map((o) => (
              <OptionChip key={o.id} label={o.label} active={permPick === o.id} disabled={permOk && permPick !== o.id} onPress={() => pickPerm(o.id)} />
            ))}
          </View>
          {permOpt ? <RuleFeedback ruleId="wall-doorway" verdict={permOpt.good ? 'good' : 'bad'} short={permOpt.short} openSources={openSources} /> : null}
        </CiSection>
      ) : null}

      {/* S4 — SHARP EDGE at the unfinished opening */}
      {s3Done ? (
        <CiSection title="4 · SHARP EDGE — THE UNFINISHED OPENING">
          <Text style={styles.lead}>
            A cable exits the rough opening above the device, folded hard over a raw edge. Pick the fix — the drawing
            corrects when you do.
          </Text>
          <View style={{ gap: 7 }}>
            {S4_OPTS.map((o) => (
              <OptionChip key={o.id} label={o.label} active={edgePick === o.id} disabled={s4Done && edgePick !== o.id} onPress={() => pickEdge(o.id)} />
            ))}
          </View>
          {edgeOpt ? <RuleFeedback ruleId="wall-bushings" verdict={edgeOpt.good ? 'good' : 'bad'} short={edgeOpt.short} openSources={openSources} /> : null}
        </CiSection>
      ) : null}

      {fired ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneHead}>✓ STAGE 7 COMPLETE</Text>
          <Text style={styles.doneBody}>
            Route in a pathway, action matched to the assembly, doors never pinch, edges always finished — and the unknown
            wall answered the only professional way: verify before penetrating.
          </Text>
        </View>
      ) : null}

      <Text style={styles.tintNote}>Training visualization — colors identify routes and classes here; actual field cable and hardware colors vary.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15.5, color: colors.textSub },
  xrayNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#7fd4e0' },
  wallLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textPrimary, lineHeight: 18 },
  qLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amberLabel, marginTop: 2 },
  solvedLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.green },
  doneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.green },
  doneCard: { gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(55,224,95,.5)', backgroundColor: '#0c1a10', padding: 12 },
  doneHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.green },
  doneBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
});
