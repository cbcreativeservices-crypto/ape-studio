/**
 * Lesson 6 — Digital, Networking & Control (owner spec §5.6).
 * Data-driven from data/lesson06.ts; connector cards render ONLY through the
 * shared ConnectorCard (verified records via registry — no facts authored
 * here). Tap-only, retry-until-correct; completion credit marked ONCE when
 * all four knowledge-check questions are genuinely solved
 * (markLabUnit → af_cables/l06_digital, §1.7 honesty).
 */
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { CheckQuestion } from '../../foundations/bits';
import type { ConnectorId } from '../cableTypes';
import { getConnector } from '../data/registry';
import { L06_CHECKS, L06_GROUPS, L06_INKS, L06_LEAD, L06_LESSON, L06_STRIPS } from '../data/lesson06';
import { ConnectorCard, InkLegend } from './connectorCard';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  lessonStyles as s,
} from './bits';

export function Lesson06Body() {
  // ── card browser (grouped chips → shared ConnectorCard) ────────────────
  const [groupIdx, setGroupIdx] = useState(0);
  const group = L06_GROUPS[Math.min(groupIdx, L06_GROUPS.length - 1)];
  const [connId, setConnId] = useState<ConnectorId>(L06_GROUPS[0].connectors[0].id);

  const pickGroup = useCallback((idx: number) => {
    setGroupIdx(idx);
    setConnId(L06_GROUPS[Math.min(idx, L06_GROUPS.length - 1)].connectors[0].id);
  }, []);

  const rec = getConnector(connId);

  // ── knowledge check (unit gate) ────────────────────────────────────────
  const solvedRef = useRef(0);
  const [allDone, setAllDone] = useState(false);
  const onSolved = useCallback(() => {
    // CheckQuestion fires onSolved exactly once per question, so the count
    // reaches the full set exactly once — genuine full solve → unit credit
    // (R6c honesty: marked here and nowhere else).
    solvedRef.current += 1;
    if (solvedRef.current >= L06_CHECKS.length) {
      setAllDone(true);
      markLabUnit('af_cables', 'l06_digital');
    }
  }, []);

  return (
    <>
      <LessonBanner text={L06_LEAD} />

      <Eyebrow text="THE CONNECTORS — BROWSE ALL TEN" />
      <Text style={s.body}>
        Pick a family, then a connector. Every card is the verified record: contacts, the cable behind it, direction
        rules, look-alikes and how to test it.
      </Text>
      <View style={s.chipWrap}>
        {L06_GROUPS.map((g, i) => (
          <OptionChip key={g.id} label={g.label} active={i === groupIdx} onPress={() => pickGroup(i)} />
        ))}
      </View>
      <View style={s.chipWrap}>
        {group.connectors.map((c) => (
          <OptionChip key={c.id} label={c.chip} active={c.id === connId} onPress={() => setConnId(c.id)} />
        ))}
      </View>
      <InkLegend inks={L06_INKS} />
      {/* ART SLOT: owner-supplied connector artwork mounts inside ConnectorCard
          (its own ART SLOT) once delivered — nothing is drawn here (R3). */}
      {rec ? <ConnectorCard rec={rec} /> : null}

      <Eyebrow text="WHAT THE RECORDS TEACH" />
      {L06_STRIPS.map((strip) => (
        <DetailCard key={strip.id}>
          <Text style={s.cardTitle}>{strip.title}</Text>
          {strip.paras.map((p) => (
            <Text key={p} style={s.body}>
              {p}
            </Text>
          ))}
        </DetailCard>
      ))}

      <PrincipleBanner />

      <Eyebrow text={`KNOWLEDGE CHECK · SOLVE ALL ${L06_CHECKS.length}`} />
      <Text style={s.hint}>Wrong picks stay open — keep trying until every question is solved.</Text>
      {L06_CHECKS.map((spec) => (
        <CheckQuestion key={spec.question} spec={spec} onSolved={onSolved} />
      ))}
      {allDone ? (
        <CheckDoneBanner text="Lesson check complete — compatibility proven by protocol, cable class and direction, never by the plug fitting." />
      ) : null}

      <LessonBanner text={L06_LESSON} />
    </>
  );
}
