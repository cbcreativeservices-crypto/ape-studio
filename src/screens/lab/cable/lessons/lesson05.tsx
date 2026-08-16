/**
 * Lesson 5 — Loudspeaker Connections (owner spec §5.5)
 * Data-driven from data/lesson05.ts, exemplar-matched to lesson01: tap-only,
 * tri-state verdicts (glyph + words + color), retry-until-correct, and
 * completion credit marked ONLY when all five routing picks are genuinely
 * solved (markLabUnit → af_cables/l05_loudspeaker).
 *
 * Teaching order per the owner spec: the FOUR different connections around
 * loudspeakers first (what travels + which connector families serve it), the
 * six verified speaker connector cards, the instrument-vs-loudspeaker cable
 * comparison, then the routing-picks knowledge check. speakON safety points
 * (lock-and-confirm de-energized, equipment-dependent assignments beyond
 * 1+/1−, never-mains, never-break-a-driven-load) surface through the always-
 * visible cards and the record-derived verdict explanations the learner must
 * reach to complete the unit.
 */
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import type { ConnectorId } from '../cableTypes';
import {
  CABLE_COMPARE_NOTE,
  CABLE_COMPARE_ROWS,
  FOUR_CONNECTIONS,
  L05_LESSON,
  ROUTING_SCENARIOS,
  SPEAKER_CONNECTORS,
} from '../data/lesson05';
import { getConnector } from '../data/registry';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  type Verdict,
} from './bits';
import { ConnectorCard, InkLegend } from './connectorCard';

export function Lesson05Body() {
  // ── connector-card browser (six verified speaker records) ─────────────────
  const [conn, setConn] = useState<ConnectorId>('speakon_nl2');
  const rec = getConnector(conn);

  // ── routing-picks exercise (the unit gate) ─────────────────────────────────
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [allDone, setAllDone] = useState(false);
  const scen = ROUTING_SCENARIOS[Math.min(idx, ROUTING_SCENARIOS.length - 1)];

  const pick = useCallback(
    (opt: string) => {
      if (allDone || verdict === 'correct' || verdict === 'accepted') return;
      setPicked(opt);
      if (opt === scen.correct) setVerdict('correct');
      else if (scen.accept?.includes(opt)) setVerdict('accepted');
      else setVerdict('wrong');
    },
    [allDone, verdict, scen],
  );

  const next = useCallback(() => {
    if (idx >= ROUTING_SCENARIOS.length - 1) {
      setAllDone(true);
      // Genuine solve of all five routing picks → lesson unit credit (§1.7
      // honesty: marked here and nowhere else — never on view or mount).
      markLabUnit('af_cables', 'l05_loudspeaker');
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setVerdict(null);
  }, [idx]);

  const solvedThis = verdict === 'correct' || verdict === 'accepted';

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text="THE FOUR DIFFERENT CONNECTIONS" />
      <Text style={s.body}>
        “Hooking up a loudspeaker” is not one connection. Around loudspeakers there are four — different things
        traveling, different connectors serving them, and none of them interchangeable.
      </Text>
      {FOUR_CONNECTIONS.map((c) => (
        <DetailCard key={c.id}>
          <Text style={s.cardTitle}>{c.title}</Text>
          <Text style={s.cardHead}>WHAT TRAVELS</Text>
          <Text style={s.body}>{c.travels}</Text>
          <Text style={s.cardHead}>CONNECTORS THAT SERVE IT</Text>
          <Text style={s.body}>{c.servedBy}</Text>
          <Text style={s.body}>{c.detail}</Text>
        </DetailCard>
      ))}

      <Eyebrow text="THE LOUDSPEAKER CONNECTORS" />
      <Text style={s.body}>
        Tap each family that carries amplifier output to a passive loudspeaker — including the legacy plug that looks
        exactly like an instrument plug.
      </Text>
      <View style={s.chipWrap}>
        {SPEAKER_CONNECTORS.map((c) => (
          <OptionChip key={c.id} label={c.chip} active={c.id === conn} onPress={() => setConn(c.id)} />
        ))}
      </View>
      <InkLegend inks={['speakerPos', 'speakerNeg']} />
      {rec ? <ConnectorCard rec={rec} /> : null}

      <Eyebrow text="INSTRUMENT CABLE VS LOUDSPEAKER CABLE" />
      {/* ART SLOT: owner-supplied side-by-side cross-section pair (shielded
          small-conductor instrument cable vs two heavier unshielded
          loudspeaker conductors) mounts here, above the comparison card. */}
      <DetailCard>
        <Text style={s.cardTitle}>SAME PLUG — DIFFERENT CABLE</Text>
        <View style={cmp.row}>
          <Text style={[cmp.col, cmp.colHead]}>INSTRUMENT CABLE</Text>
          <Text style={[cmp.col, cmp.colHead]}>LOUDSPEAKER CABLE</Text>
        </View>
        {CABLE_COMPARE_ROWS.map((r) => (
          <View key={r.label}>
            <Text style={s.cardHead}>{r.label}</Text>
            <View style={cmp.row}>
              <Text style={[s.body, cmp.col]}>{r.instrument}</Text>
              <Text style={[s.body, cmp.col]}>{r.speaker}</Text>
            </View>
          </View>
        ))}
        <Text style={s.hint}>{CABLE_COMPARE_NOTE}</Text>
      </DetailCard>

      <Eyebrow text={`ROUTING PICKS · ${Math.min(idx + 1, ROUTING_SCENARIOS.length)} OF ${ROUTING_SCENARIOS.length}`} />
      {!allDone ? (
        <>
          <DetailCard>
            <Text style={s.cardTitle}>{`${scen.from}  →  ${scen.to}`}</Text>
            <Text style={s.hint}>
              Pick the connection type and cable that make this link. Wrong picks stay open — keep trying.
            </Text>
            <View style={s.chipWrap}>
              {scen.options.map((opt) => (
                <OptionChip
                  key={opt.id}
                  label={opt.label}
                  active={picked === opt.id}
                  onPress={() => pick(opt.id)}
                  disabled={solvedThis && picked !== opt.id}
                />
              ))}
            </View>
          </DetailCard>
          {verdict ? (
            <VerdictBanner
              verdict={verdict}
              text={
                verdict === 'wrong'
                  ? scen.wrongHint
                  : verdict === 'accepted'
                    ? (scen.acceptExplain ?? scen.explain)
                    : scen.explain
              }
            />
          ) : null}
          {solvedThis ? (
            <OptionChip
              label={idx >= ROUTING_SCENARIOS.length - 1 ? 'FINISH CHECK ✓' : 'NEXT SCENARIO ›'}
              active
              onPress={next}
            />
          ) : null}
        </>
      ) : (
        <CheckDoneBanner text="Routing check complete — all five connections identified by what travels, with the right cable for each." />
      )}

      <LessonBanner text={L05_LESSON} />
    </>
  );
}

/** Local layout for the two-column cable comparison (min font 12 respected —
 *  column text uses lessonStyles.body at 14). */
const cmp = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  colHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.textPrimary,
    marginTop: 4,
  },
});
