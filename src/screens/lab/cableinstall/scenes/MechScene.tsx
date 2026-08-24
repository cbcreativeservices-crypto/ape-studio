/**
 * STAGE 4 — Mechanical Cable Protection (spec §"mech" · registry m_mech).
 *
 * Three interactions, all against SCENARIO-SUPPLIED specifications (§29 —
 * "check the documentation" IS the skill; no universal numbers):
 *   A · BEND RADIUS — four cables (CI_BEND_EXERCISES), each with its own
 *       simulated spec card shown FIRST. A BEND TIGHTNESS DragSlider reshapes
 *       the drawn bend from generous arc to hard fold; tighter than THAT
 *       cable's minimum radius → the bend segment highlights + a strain glyph
 *       (qualitative failure visualization). CHECK BEND → RuleFeedback
 *       ('mech-bend-radius'). The four cables pass at different slider zones
 *       because their specs differ — that contrast is the lesson.
 *   B · PULLING — CI_PULL_SPEC spec card + a simplified tension meter
 *       (0..150, spec limit marked at 100). Four pull events as OptionChips;
 *       each sets the meter and yields RuleFeedback (ok → 'mech-pull-tension'
 *       good; bad → the event's own rule). Stated plainly as conceptual —
 *       NOT an engineering pull calculation.
 *   C · RESTRAINT — STRAP TENSION DragSlider over a bundle cross-section:
 *       loose = circles drift apart; secure = held round; excessive (past
 *       CI_RESTRAINT_ZONES.secureMax) = cables ovalize and the strap bites.
 *       Zone named in text at all times. Ties-aren't-banned taught via
 *       RuleFeedback info ('mech-ties-not-banned').
 *
 * Completion (once): all 4 bends checked good + all 4 pull events explored +
 * restraint landed in SECURE → onComplete({ protection, workmanship }).
 *
 * Accessibility: sliders have labeled EASE/TIGHTEN nudge buttons and zone
 * set-buttons as non-drag alternatives; every verdict is announced; state is
 * never color-only (words + glyphs everywhere); targets ≥44dp.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, SpecCard, announceComplete } from '../bits';
import { DragSlider } from '../../foundations/bits';
import { OptionChip, useReduceMotion } from '../../cable/lessons/bits';
import { CI_BEND_EXERCISES, CI_PULL_SPEC, CI_RESTRAINT_ZONES } from '../data/scenarios';
import { cableTypeById } from '../data/cableTypes';
import { clamp01, clamp100 } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── bend geometry (sim units: 1 cable diameter = DIA_PX drawing px) ────── */
const R_MAX_DIA = 20; // slider fully eased → generous 20× arc
const R_MIN_DIA = 1; // slider fully tight → hard fold
const DIA_PX = 4;
const START_T = 0.95; // every cable starts over-bent — see the failure, then fix it

const radiusDia = (t: number) => R_MAX_DIA - t * (R_MAX_DIA - R_MIN_DIA);
const tForDia = (d: number) => clamp01((R_MAX_DIA - d) / (R_MAX_DIA - R_MIN_DIA));
const fmtDia = (d: number) => (d >= 10 ? String(Math.round(d)) : d.toFixed(1));

type PullEvent = (typeof CI_PULL_SPEC.events)[number];

const say = (s: string) => AccessibilityInfo.announceForAccessibility(s);

/* ── A — the corner: cable of `tint` bending around a structure edge ────── */
function BendArt({ w, tint, dia, specDia, name }: { w: number; tint: string; dia: number; specDia: number; name: string }) {
  const h = Math.round((w * 132) / 200);
  const CX = 150; // the elbow: horizontal run under the ceiling → drop down the wall face
  const CY = 26;
  const r = Math.max(R_MIN_DIA * DIA_PX, dia * DIA_PX);
  const rs = specDia * DIA_PX;
  const over = dia + 1e-6 < specDia; // tighter than THIS cable's spec
  // 45° apex of the quarter arc (for the strain glyph placement)
  const ax = CX - 0.293 * r;
  const ay = CY + 0.293 * r;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 200 132"
      accessibilityLabel={`${name}: bend about ${fmtDia(dia)} times cable diameter; specification minimum ${specDia} times. ${over ? 'Tighter than the specification — strained.' : 'Within the specification.'}`}
    >
      <Rect x={0} y={0} width={200} height={132} rx={8} fill="#101014" />
      {/* the corner being turned: ceiling above, wall at right. A tight bend
          hugs the junction; a generous bend stands off into the free space —
          which is why the arc sweeps down-left as the slider eases. */}
      <Rect x={0} y={0} width={200} height={20} fill="#17171c" />
      <Rect x={154} y={0} width={46} height={132} fill="#17171c" />
      <Path d="M0 20 H154 V132" stroke="#3a3c42" strokeWidth={1.6} fill="none" />
      {/* terminations — cable ends honestly at plates */}
      <Rect x={2} y={21} width={7} height={10} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      <Rect x={142} y={123} width={10} height={7} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      {/* the spec minimum, drawn as a dashed ghost arc — the documentation, visible */}
      <Path
        d={`M ${CX - rs} ${CY} A ${rs} ${rs} 0 0 1 ${CX} ${CY + rs}`}
        stroke="#37d97b"
        strokeWidth={1.6}
        strokeDasharray="5 4"
        opacity={0.5}
        fill="none"
      />
      {/* the cable */}
      <Path
        d={`M 9 ${CY} H ${CX - r} A ${r} ${r} 0 0 1 ${CX} ${CY + r} V 124`}
        stroke={tint}
        strokeWidth={DIA_PX}
        strokeLinecap="round"
        fill="none"
      />
      {/* failure visualization: the bend segment highlights + strain glyph */}
      {over ? (
        <>
          <Path
            d={`M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX} ${CY + r}`}
            stroke="#ff9b8f"
            strokeWidth={DIA_PX}
            strokeLinecap="round"
            fill="none"
          />
          <Path d={`M${ax - 10} ${ay + 10} l4 -7 h-3 l5 -8`} stroke="#ff9b8f" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Line x1={ax - 4} y1={ay + 4} x2={ax - 1} y2={ay + 1} stroke="#ff9b8f" strokeWidth={1.4} />
          <Line x1={ax - 14} y1={ay + 4} x2={ax - 11} y2={ay + 7} stroke="#ff9b8f" strokeWidth={1.4} />
        </>
      ) : null}
    </Svg>
  );
}

/* ── B — the simplified tension meter (conceptual, 0..150) ──────────────── */
function TensionMeter({ w, value }: { w: number; value: number }) {
  const h = Math.round((w * 74) / 320);
  const X0 = 12;
  const X1 = 308;
  const xOf = (v: number) => X0 + ((X1 - X0) * v) / 150;
  const filled = Math.max(0, Math.min(150, value));
  const overLimit = value > CI_PULL_SPEC.maxTension;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 320 74"
      accessibilityLabel={`Tension meter: ${Math.round(value)} of 150 units. Specification limit ${CI_PULL_SPEC.maxTension}. ${overLimit ? 'Over the limit.' : 'Within the limit.'}`}
    >
      <Rect x={0} y={0} width={320} height={74} rx={8} fill="#101014" />
      <Rect x={X0} y={30} width={X1 - X0} height={14} rx={7} fill="#17171c" stroke="#2c2c33" strokeWidth={1} />
      {filled > 0 ? (
        <Rect x={X0} y={30} width={Math.max(4, ((X1 - X0) * filled) / 150)} height={14} rx={7} fill={overLimit ? '#ff5a48' : '#37d97b'} opacity={0.9} />
      ) : null}
      {[0, 50, 100, 150].map((v) => (
        <Line key={v} x1={xOf(v)} y1={26} x2={xOf(v)} y2={48} stroke={v === 100 ? '#ff9b8f' : '#3a3c42'} strokeWidth={v === 100 ? 2 : 1} />
      ))}
      {[0, 50, 100, 150].map((v) => (
        <SvgText key={`t${v}`} x={xOf(v)} y={62} textAnchor="middle" fontFamily={fonts.mono} fontSize={10.5} fill="#8a8b93">
          {String(v)}
        </SvgText>
      ))}
      <SvgText x={xOf(100)} y={18} textAnchor="middle" fontFamily={fonts.oswaldSemiBold} fontSize={9} letterSpacing={0.8} fill="#ff9b8f">
        SPEC LIMIT
      </SvgText>
      <SvgText x={X1} y={18} textAnchor="end" fontFamily={fonts.mono} fontSize={12} fill={colors.amber}>
        {`${Math.round(value)} u`}
      </SvgText>
    </Svg>
  );
}

/* ── C — bundle cross-section under a strap, driven by strap tension ────── */
const BUNDLE_TINTS = ['#4fd0e0', '#37d97b', '#ffd35e', '#c77dff'];

function BundleArt({ w, t, zone, note }: { w: number; t: number; zone: string; note: string }) {
  const h = Math.round((w * 132) / 200);
  const spread = t < CI_RESTRAINT_ZONES.looseMax ? (CI_RESTRAINT_ZONES.looseMax - t) / CI_RESTRAINT_ZONES.looseMax : 0;
  const squish = t > CI_RESTRAINT_ZONES.secureMax ? (t - CI_RESTRAINT_ZONES.secureMax) / (1 - CI_RESTRAINT_ZONES.secureMax) : 0;
  const cx = 100;
  const cy = 66;
  const r = 13;
  const d = 15 + spread * 14 - squish * 2;
  const jit: [number, number][] = [
    [-4, -2],
    [3, -4],
    [-3, 3],
    [4, 2],
  ];
  const offs: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const srx = 34 + spread * 18 - squish * 4.5;
  const sry = 34 + spread * 14 - squish * 8;
  return (
    <Svg width={w} height={h} viewBox="0 0 200 132" accessibilityLabel={`Bundle cross-section, strap tension ${zone}. ${note}`}>
      <Rect x={0} y={0} width={200} height={132} rx={8} fill="#101014" />
      {/* strap (slack = dashed and roomy; excessive = shrunken, biting) */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={srx}
        ry={sry}
        fill="none"
        stroke="#d8d8dc"
        strokeWidth={3}
        strokeDasharray={spread > 0.05 ? '7 6' : undefined}
      />
      <Rect x={cx - 7} y={cy - sry - 5} width={14} height={9} rx={2} fill="#26262c" stroke="#6f7378" strokeWidth={1} />
      {/* the four cables */}
      {offs.map(([sx, sy], i) => {
        const px = cx + sx * d + jit[i][0] * spread * 2;
        const py = cy + sy * d + jit[i][1] * spread * 2;
        const wide = i === 0 || i === 3; // alternate squash axes → pinched look
        const rx = r * (1 + (wide ? 0.4 : -0.32) * squish);
        const ry = r * (1 + (wide ? -0.32 : 0.4) * squish);
        return <Ellipse key={i} cx={px} cy={py} rx={rx} ry={ry} fill={BUNDLE_TINTS[i]} opacity={0.85} stroke="#0c0c0c" strokeWidth={1.5} />;
      })}
      {/* strap bite marks appear as deformation begins */}
      {squish > 0.02 ? (
        <>
          <Circle cx={cx - srx} cy={cy} r={3} fill="#ff9b8f" opacity={squish} />
          <Circle cx={cx + srx} cy={cy} r={3} fill="#ff9b8f" opacity={squish} />
          <Circle cx={cx} cy={cy - sry} r={3} fill="#ff9b8f" opacity={squish} />
          <Circle cx={cx} cy={cy + sry} r={3} fill="#ff9b8f" opacity={squish} />
        </>
      ) : null}
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function MechScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const reduceMotion = useReduceMotion();
  const artW = Math.max(160, width - 26);

  // A — bends
  const [bendT, setBendT] = useState<number[]>(() =>
    CI_BEND_EXERCISES.map((ex) => (completed ? tForDia(Math.min(R_MAX_DIA, ex.minRadiusDia + 2)) : START_T)),
  );
  const [bendVerdict, setBendVerdict] = useState<('good' | 'bad' | null)[]>(() => CI_BEND_EXERCISES.map(() => (completed ? 'good' : null)));
  const [bendDone, setBendDone] = useState<boolean[]>(() => CI_BEND_EXERCISES.map(() => completed));
  const badBendRef = useRef(0);

  // B — pulls
  const [pullId, setPullId] = useState<PullEvent['id'] | null>(null);
  const [pullSeen, setPullSeen] = useState<Set<string>>(() => new Set(completed ? CI_PULL_SPEC.events.map((e) => e.id) : []));
  const targetTension = pullId ? CI_PULL_SPEC.events.find((e) => e.id === pullId)!.tension : 0;
  const meterVal = useTween(targetTension, reduceMotion);

  // C — restraint
  const [restT, setRestT] = useState(completed ? 0.5 : 0.12);
  const restRef = useRef(restT);
  restRef.current = restT;
  const [landed, setLanded] = useState(completed);

  const firedRef = useRef(completed);
  const [fired, setFired] = useState(completed);

  const tryFire = (nextBendDone: boolean[], nextSeen: Set<string>, nextLanded: boolean) => {
    if (firedRef.current) return;
    if (nextBendDone.every(Boolean) && nextSeen.size >= CI_PULL_SPEC.events.length && nextLanded) {
      firedRef.current = true;
      setFired(true);
      const bad = badBendRef.current;
      announceComplete('Stage 4 complete.');
      onComplete({
        protection: clamp100(Math.max(60, 100 - 8 * bad)),
        workmanship: clamp100(Math.max(70, 100 - 4 * bad)),
      });
    }
  };

  const setBend = (i: number, v: number) => setBendT((arr) => arr.map((x, j) => (j === i ? clamp01(v) : x)));

  const checkBend = (i: number) => {
    const ex = CI_BEND_EXERCISES[i];
    const dia = radiusDia(bendT[i]);
    const ok = dia + 1e-6 >= ex.minRadiusDia;
    if (!ok) badBendRef.current += 1;
    const nextDone = bendDone.map((v, j) => (j === i ? v || ok : v));
    setBendDone(nextDone);
    setBendVerdict((arr) => arr.map((v, j) => (j === i ? (ok ? 'good' : 'bad') : v)));
    say(
      ok
        ? `Meets the specification: about ${fmtDia(dia)} times diameter against a minimum of ${ex.minRadiusDia}.`
        : `Too tight: about ${fmtDia(dia)} times diameter against a minimum of ${ex.minRadiusDia}. Ease the bend.`,
    );
    tryFire(nextDone, pullSeen, landed);
  };

  const pickPull = (ev: PullEvent) => {
    setPullId(ev.id);
    const nx = new Set(pullSeen).add(ev.id);
    setPullSeen(nx);
    say(`${ev.label}. Tension ${ev.tension} of ${CI_PULL_SPEC.maxTension} allowed. ${ev.note}`);
    tryFire(bendDone, nx, landed);
  };

  const land = () => {
    if (landed) return;
    setLanded(true);
    say('Restraint landed secure — held without deformation.');
    tryFire(bendDone, pullSeen, true);
  };

  const zone = restT <= CI_RESTRAINT_ZONES.looseMax ? 'LOOSE' : restT <= CI_RESTRAINT_ZONES.secureMax ? 'SECURE' : 'EXCESSIVE';
  const zoneNote =
    zone === 'LOOSE' ? CI_RESTRAINT_ZONES.notes.loose : zone === 'SECURE' ? CI_RESTRAINT_ZONES.notes.secure : CI_RESTRAINT_ZONES.notes.excessive;
  const zoneTint = zone === 'SECURE' ? colors.green : zone === 'LOOSE' ? colors.amberLabel : '#ff9b8f';

  const bendsDone = bendDone.filter(Boolean).length;
  const activePull = pullId ? CI_PULL_SPEC.events.find((e) => e.id === pullId)! : null;

  return (
    <View style={{ gap: 16 }}>
      {/* ── A · BEND RADIUS ─────────────────────────────────────────────── */}
      <CiSection title="A · BEND RADIUS — MEET EACH CABLE'S SPEC">
        <Text style={styles.lead}>
          Same corner, four cables. For each one: read its documentation, then set BEND TIGHTNESS until the drawn bend
          meets THAT cable's minimum radius (the dashed arc is the spec minimum). Tighter than spec = the bend strains.
        </Text>
        <Text style={styles.tintNote}>Cable colors here are training tints — field colors vary.</Text>
        {CI_BEND_EXERCISES.map((ex, i) => {
          const dia = radiusDia(bendT[i]);
          const done = bendDone[i];
          const verdict = bendVerdict[i];
          const tint = cableTypeById(ex.cable).tint;
          return (
            <View key={ex.id} style={[styles.card, done && styles.cardDone]}>
              <Text style={styles.cardHead}>
                {done ? '✓ ' : ''}BEND {i + 1} OF {CI_BEND_EXERCISES.length} — {ex.cableName.toUpperCase()}
              </Text>
              <SpecCard text={ex.specText} />
              {ex.note ? <Text style={styles.exNote}>{ex.note}</Text> : null}
              <BendArt w={artW} tint={tint} dia={dia} specDia={ex.minRadiusDia} name={ex.cableName} />
              <DragSlider
                value={bendT[i]}
                onChange={(v) => setBend(i, v)}
                label="BEND TIGHTNESS"
                readout={`≈ ${fmtDia(dia)}× dia · spec ≥ ${ex.minRadiusDia}×`}
                tint={tint}
              />
              <View style={styles.nudgeRow}>
                <Pressable
                  style={styles.nudgeBtn}
                  onPress={() => setBend(i, bendT[i] - 0.08)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.cableName}: ease the bend — larger radius`}
                >
                  <Text style={styles.nudgeText}>− EASE</Text>
                </Pressable>
                <Pressable
                  style={styles.nudgeBtn}
                  onPress={() => setBend(i, bendT[i] + 0.08)}
                  accessibilityRole="button"
                  accessibilityLabel={`${ex.cableName}: tighten the bend — smaller radius`}
                >
                  <Text style={styles.nudgeText}>+ TIGHTEN</Text>
                </Pressable>
                <Pressable
                  style={[styles.checkBtn, done && styles.checkBtnDone]}
                  onPress={() => !done && checkBend(i)}
                  disabled={done}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: done }}
                  accessibilityLabel={done ? `${ex.cableName}: bend meets its specification` : `Check the ${ex.cableName} bend against its specification`}
                >
                  <Text style={[styles.checkText, done && { color: '#0a1a0f' }]}>{done ? 'MEETS SPEC ✓' : 'CHECK BEND'}</Text>
                </Pressable>
              </View>
              {verdict ? (
                <RuleFeedback
                  ruleId="mech-bend-radius"
                  verdict={verdict}
                  short={
                    verdict === 'good'
                      ? `Meets the spec — ≈ ${fmtDia(dia)}× dia against this cable's ≥ ${ex.minRadiusDia}× requirement.`
                      : `Too tight for THIS cable — ≈ ${fmtDia(dia)}× dia against its ≥ ${ex.minRadiusDia}× spec. Ease the bend and check again.`
                  }
                  openSources={openSources}
                />
              ) : null}
            </View>
          );
        })}
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {bendsDone >= CI_BEND_EXERCISES.length ? '✓ ' : ''}
          {bendsDone} of {CI_BEND_EXERCISES.length} bends meet their spec
        </Text>
        {bendsDone >= CI_BEND_EXERCISES.length ? (
          <View style={styles.lessonCard}>
            <Text style={styles.lessonHead}>FOUR CABLES, FOUR ANSWERS</Text>
            <Text style={styles.lessonBody}>
              The corner never changed — the specification did. Bend limits belong to the specific cable, which is why
              checking its documentation is the first move every time.
            </Text>
          </View>
        ) : null}
      </CiSection>

      {/* ── B · PULLING ─────────────────────────────────────────────────── */}
      <CiSection title="B · PULLING — STAY INSIDE RATED TENSION">
        <SpecCard text={CI_PULL_SPEC.specText} />
        <TensionMeter w={artW} value={meterVal} />
        <Text style={styles.conceptNote}>
          Conceptual meter for judgment training — not an engineering pull calculation. Real pulls are planned from the
          cable's documentation.
        </Text>
        <Text style={styles.lead}>Try all four pull events and watch what each does to tension:</Text>
        <View style={styles.chipWrap}>
          {CI_PULL_SPEC.events.map((ev) => (
            <OptionChip
              key={ev.id}
              label={`${pullSeen.has(ev.id) ? '✓ ' : ''}${ev.label}`}
              active={pullId === ev.id}
              onPress={() => pickPull(ev)}
            />
          ))}
        </View>
        <Text style={styles.progressLine} accessibilityLiveRegion="polite">
          {pullSeen.size >= CI_PULL_SPEC.events.length ? '✓ ' : ''}
          {pullSeen.size} of {CI_PULL_SPEC.events.length} pull events explored
        </Text>
        {activePull ? (
          <RuleFeedback
            ruleId={'ruleId' in activePull ? activePull.ruleId : 'mech-pull-tension'}
            verdict={activePull.ok ? 'good' : 'bad'}
            short={activePull.note}
            openSources={openSources}
          />
        ) : null}
      </CiSection>

      {/* ── C · RESTRAINT ───────────────────────────────────────────────── */}
      <CiSection title="C · RESTRAINT — HOLD, NEVER CRUSH">
        <Text style={styles.lead}>
          A restraint supports and organizes the bundle. Find the tension that holds the four cables round — loose does
          nothing, and past secure the strap starts doing damage.
        </Text>
        <BundleArt w={artW} t={restT} zone={zone} note={zoneNote} />
        <Text style={styles.zoneLine} accessibilityLiveRegion="polite">
          <Text style={[styles.zoneWord, { color: zoneTint }]}>{zone}</Text>
          {'  —  '}
          {zoneNote}
        </Text>
        <DragSlider
          value={restT}
          onChange={setRestT}
          label="STRAP TENSION"
          readout={zone}
          tint={zoneTint}
          onDragActive={(active) => {
            if (!active && restRef.current > CI_RESTRAINT_ZONES.looseMax && restRef.current <= CI_RESTRAINT_ZONES.secureMax) land();
          }}
        />
        <View style={styles.chipWrap}>
          <OptionChip label="SET LOOSE" active={zone === 'LOOSE'} onPress={() => setRestT(0.15)} />
          <OptionChip
            label="SET SECURE"
            active={zone === 'SECURE'}
            onPress={() => {
              setRestT(0.5);
              land();
            }}
          />
          <OptionChip label="SET EXCESSIVE" active={zone === 'EXCESSIVE'} onPress={() => setRestT(0.85)} />
        </View>
        {landed ? (
          <Text style={styles.landedLine} accessibilityLiveRegion="polite">
            ✓ LANDED SECURE — held without deformation. That is the whole job of a restraint.
          </Text>
        ) : null}
        <RuleFeedback ruleId="mech-ties-not-banned" verdict="info" openSources={openSources} />
      </CiSection>

      <Text style={[styles.progressLine, fired && { color: colors.green }]} accessibilityLiveRegion="polite">
        {fired
          ? '✓ Stage 4 complete — keep experimenting freely.'
          : 'To complete: meet all 4 bend specs · explore all 4 pull events · land the restraint in SECURE.'}
      </Text>
    </View>
  );
}

/** Small eased number tween for the tension meter (snaps under reduce-motion). */
function useTween(target: number, snap: boolean): number {
  const [v, setV] = useState(target);
  const vRef = useRef(v);
  vRef.current = v;
  useEffect(() => {
    if (snap) {
      setV(target);
      return;
    }
    const from = vRef.current;
    if (from === target) return;
    const start = Date.now();
    const dur = 420;
    let raf = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, snap]);
  return v;
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  card: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardDone: { borderColor: 'rgba(55,224,95,.4)' },
  cardHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amberLabel },
  exNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  nudgeRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  nudgeBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingHorizontal: 12,
  },
  nudgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  checkBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: '#2a2a31',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
  },
  checkBtnDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  progressLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  conceptNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub, fontStyle: 'italic' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  zoneLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  zoneWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2 },
  landedLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.green },
});
