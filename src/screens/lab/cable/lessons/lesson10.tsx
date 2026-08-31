/**
 * Lesson 10 — Virtual Cable Tester (owner spec §5.10; unit TESTER_UNIT).
 * Data-driven from data/testerCables.ts: eight leads, each derived from the
 * VERIFIED connector records (source record cited per cable in the data file).
 *
 * SIMULATION HONESTY: this is a continuity-only training model — the
 * SIMULATION_BADGE line renders verbatim, every test is framed de-energized
 * with the cable disconnected at both ends (the records' basicTest
 * discipline), and no live-voltage measurement is ever simulated.
 *
 * Flow per cable (tap-only, retry-until-correct): pick cable → CONNECT BOTH
 * ENDS → RUN TEST → read the monospace expected-vs-measured map (✓/✕ glyphs +
 * words, never color alone) → name the fault → decide the disposition.
 * markLabUnit('af_cables', TESTER_UNIT) fires exactly once, when the eighth
 * cable's disposition is genuinely solved (§1.7 honesty).
 */
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import { TESTER_UNIT } from '../cableTypes';
import {
  DE_ENERGIZED_RULE,
  FAULT_RETRY_HINT,
  L10_LESSON,
  SIMULATION_BADGE,
  TESTER_CABLES,
  TESTER_DISPOSITIONS,
  dispositionLabel,
  type TesterCable,
  type TesterDisposition,
} from '../data/testerCables';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  useReduceMotion,
  type Verdict,
} from './bits';

function faultLabel(cable: TesterCable): string {
  return cable.faultOptions.find((o) => o.id === cable.faultId)?.label ?? cable.faultId;
}

/** Per-row scan cadence for the animated test run (ms). */
const SCAN_STEP_MS = 150;

/** Expected-vs-measured continuity map: monospace labeled rows, mismatches
 *  marked ✕ + the word FAULT, matches ✓ — glyphs and words, never color alone.
 *  With `animate`, rows reveal sequentially like a tester stepping through
 *  conductors (owner direction 2026-08-15: strategic animation); static under
 *  reduced motion, and the finished map is announced either way. */
function ContinuityMap({ cable, animate }: { cable: TesterCable; animate?: boolean }) {
  const reduceMotion = useReduceMotion();
  const total = cable.expectedMap.length;
  const [shown, setShown] = useState(animate ? 0 : total);

  useEffect(() => {
    if (!animate || reduceMotion) {
      setShown(total);
      return;
    }
    setShown(0);
    const timer = setInterval(() => {
      setShown((n) => (n + 1 >= total ? total : n + 1));
    }, SCAN_STEP_MS);
    return () => clearInterval(timer);
  }, [animate, reduceMotion, total, cable.id]);

  const done = shown >= total;
  useEffect(() => {
    if (animate && done) {
      // Announce, never move focus (house §23 rule) — the scan's end state
      // must not be silent to screen readers.
      AccessibilityInfo.announceForAccessibility(`Test complete. ${total} paths measured.`);
    }
  }, [animate, done, total]);
  useEffect(() => {
    if (animate && !done) {
      const t = setTimeout(() => setShown(total), SCAN_STEP_MS * (total + 2));
      return () => clearTimeout(t); // backstop: the scan can never stall short
    }
  }, [animate, done, total]);

  return (
    <View style={st.map}>
      {/* ART SLOT: owner-supplied animated internal-wiring trace lands here —
          the cable's actual internal paths lighting up between the two
          connector ends after the test runs (ruling 2026-08-15: connector
          artwork is owner-supplied; no drawn stand-ins). Until it arrives,
          the labeled rows below are the complete, honest reading. */}
      <View style={st.mapRow}>
        <Text style={[st.mapCell, st.mapHead, st.cellPath]}>PATH</Text>
        <Text style={[st.mapCell, st.mapHead, st.cellVal]}>EXPECTED</Text>
        <Text style={[st.mapCell, st.mapHead, st.cellMeas]}>MEASURED</Text>
      </View>
      {cable.expectedMap.slice(0, shown).map((exp, i) => {
        const meas = cable.actualMap[i] ?? exp;
        const ok = meas.value === exp.value;
        return (
          <View key={exp.path} style={st.mapRow}>
            <Text style={[st.mapCell, st.cellPath]}>{exp.path}</Text>
            <Text style={[st.mapCell, st.cellVal]}>{exp.value}</Text>
            <Text style={[st.mapCell, st.cellMeas, ok ? st.cellOk : st.cellBad]}>
              {ok ? `✓ ${meas.value}` : `✕ ${meas.value} — FAULT`}
            </Text>
          </View>
        );
      })}
      {!done ? (
        <View style={st.mapRow}>
          <Text style={[st.mapCell, st.cellPath, st.scanText]}>TESTING…</Text>
        </View>
      ) : null}
    </View>
  );
}

/** "CABLE A" → "A · XLR" — type hint derived from the verified connectorEnds
 *  record (design pass 2026-08-31); the FAULT stays the puzzle. */
function benchChipLabel(c: { chip: string; connectorEnds: string }): string {
  const e = c.connectorEnds;
  const kind = /XLR/.test(e) ? 'XLR'
    : /TRS/.test(e) ? 'TRS'
    : /\bTS\b/.test(e) ? 'TS'
    : /speakON/i.test(e) ? 'SPEAKON'
    : /8P8C/.test(e) ? 'NETWORK'
    : /NEMA|IEC/.test(e) ? 'POWER'
    : '';
  const letter = c.chip.replace(/^CABLE\s+/, '');
  return kind ? `${letter} · ${kind}` : c.chip;
}

export function Lesson10Body() {
  const [selId, setSelId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tested, setTested] = useState(false);
  const [faultPick, setFaultPick] = useState<string | null>(null);
  const [faultVerdict, setFaultVerdict] = useState<Verdict | null>(null);
  const [dispPick, setDispPick] = useState<TesterDisposition | null>(null);
  const [dispVerdict, setDispVerdict] = useState<Verdict | null>(null);
  const [solved, setSolved] = useState<string[]>([]);

  const cable = TESTER_CABLES.find((c) => c.id === selId) ?? null;
  const cableSolved = cable != null && solved.includes(cable.id);
  const faultSolved = faultVerdict === 'correct';
  const allDone = solved.length === TESTER_CABLES.length;

  const selectCable = useCallback(
    (id: string) => {
      if (id === selId) return;
      setSelId(id);
      setConnected(false);
      setTested(false);
      setFaultPick(null);
      setFaultVerdict(null);
      setDispPick(null);
      setDispVerdict(null);
    },
    [selId],
  );

  const pickFault = useCallback(
    (optId: string) => {
      if (!cable || faultVerdict === 'correct') return;
      setFaultPick(optId);
      setFaultVerdict(optId === cable.faultId ? 'correct' : 'wrong');
    },
    [cable, faultVerdict],
  );

  const pickDisposition = useCallback(
    (d: TesterDisposition) => {
      if (!cable || solved.includes(cable.id)) return;
      setDispPick(d);
      if (d !== cable.disposition) {
        setDispVerdict('wrong');
        return;
      }
      setDispVerdict('correct');
      const next = [...solved, cable.id];
      setSolved(next);
      if (next.length === TESTER_CABLES.length) {
        // Genuine full solve of the bench — all eight faults named AND
        // dispatched → tester unit credit (§1.7 honesty: marked here and
        // nowhere else, never on view or mount).
        markLabUnit('af_cables', TESTER_UNIT);
      }
    },
    [cable, solved],
  );

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text={`VIRTUAL CABLE TESTER · ${solved.length} OF ${TESTER_CABLES.length} CLEARED`} />
      <View style={st.simBadge}>
        <Text style={st.simText}>{SIMULATION_BADGE}</Text>
      </View>
      <Text style={s.body}>
        Eight leads are on the bench. Connect each one to the tester, read the continuity map, name the fault, then
        decide what happens to the cable. Wrong picks stay open — keep trying.
      </Text>

      <View style={s.chipWrap}>
        {TESTER_CABLES.map((c) => (
          <OptionChip
            key={c.id}
            // Chip carries the connector TYPE (derived from the verified
            // connectorEnds — the fault, not the type, is the exercise).
            label={`${benchChipLabel(c)}${solved.includes(c.id) ? ' ✓' : ''}`}
            active={c.id === selId}
            onPress={() => selectCable(c.id)}
          />
        ))}
      </View>

      {cable && cableSolved ? (
        <>
          <DetailCard>
            <Text style={s.cardTitle}>{cable.label}</Text>
            <Text style={s.hint}>{cable.connectorEnds}</Text>
            <ContinuityMap cable={cable} />
            <Text style={st.solvedLine}>{`✓ Fault: ${faultLabel(cable)}`}</Text>
            <Text style={st.solvedLine}>{`✓ Disposition: ${dispositionLabel(cable.disposition)}`}</Text>
          </DetailCard>
          <VerdictBanner verdict="correct" text={cable.explain} />
        </>
      ) : null}

      {cable && !cableSolved ? (
        <>
          <DetailCard>
            <Text style={s.cardTitle}>{cable.label}</Text>
            <Text style={s.hint}>{cable.connectorEnds}</Text>
            {!connected ? (
              <>
                <Text style={s.body}>{DE_ENERGIZED_RULE}</Text>
                <OptionChip label="CONNECT BOTH ENDS ›" active action onPress={() => setConnected(true)} />
              </>
            ) : !tested ? (
              <>
                <Text style={s.body}>
                  Both ends are seated in the tester and the cable touches nothing else — de-energized and isolated.
                </Text>
                <OptionChip label="RUN TEST ›" active action onPress={() => setTested(true)} />
              </>
            ) : (
              <ContinuityMap cable={cable} animate />
            )}
          </DetailCard>

          {tested ? (
            <>
              <Eyebrow text="NAME THE FAULT" />
              <View style={s.chipWrap}>
                {cable.faultOptions.map((o) => (
                  <OptionChip
                    key={o.id}
                    label={o.label}
                    active={faultPick === o.id}
                    onPress={() => pickFault(o.id)}
                    disabled={faultSolved && faultPick !== o.id}
                  />
                ))}
              </View>
              {faultVerdict ? (
                <VerdictBanner
                  verdict={faultVerdict}
                  text={faultVerdict === 'correct' ? cable.faultExplain : FAULT_RETRY_HINT}
                />
              ) : null}
            </>
          ) : null}

          {tested && faultSolved ? (
            <>
              <Eyebrow text="DECIDE THE DISPOSITION" />
              <View style={s.chipWrap}>
                {TESTER_DISPOSITIONS.map((d) => (
                  <OptionChip
                    key={d.id}
                    label={d.label}
                    active={dispPick === d.id}
                    onPress={() => pickDisposition(d.id)}
                  />
                ))}
              </View>
              {dispVerdict === 'wrong' ? <VerdictBanner verdict="wrong" text={cable.dispositionHint} /> : null}
            </>
          ) : null}
        </>
      ) : null}

      {allDone ? (
        <CheckDoneBanner text="Bench cleared — all eight cables tested de-energized, every fault named from its map, every disposition decided." />
      ) : null}

      <LessonBanner text={L10_LESSON} />
    </>
  );
}

const st = StyleSheet.create({
  simBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333b',
    backgroundColor: '#0c0d11',
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  simText: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSub, letterSpacing: 0.3 },
  map: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#0c0d11',
    padding: 9,
    gap: 3,
  },
  mapRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  mapCell: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  mapHead: { color: colors.amberLabel },
  cellPath: { flex: 1.15 },
  scanText: { color: colors.amberLabel },
  cellVal: { flex: 0.75 },
  cellMeas: { flex: 1.3 },
  cellOk: { color: colors.green },
  cellBad: { color: '#ff8a6b' },
  solvedLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.green },
});
