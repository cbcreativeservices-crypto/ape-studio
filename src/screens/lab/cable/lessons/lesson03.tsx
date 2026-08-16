/**
 * Lesson 3 — Analog Audio Connectors (owner spec §5.3; unit 'l03_analog').
 * Chip-selected browser over the seven VERIFIED analog connector records,
 * rendered exclusively through the shared ConnectorCard (one renderer for
 * every card lesson, so all families read identically). Per-connector
 * lead-ins surface the owner-spec emphases and are derived from the records'
 * own fields (data/lesson03.ts) — no facts are authored in this layer.
 *
 * Completion honesty (§1.7): markLabUnit('af_cables','l03_analog') fires
 * EXACTLY ONCE, when all four knowledge-check questions are genuinely
 * solved — never on view, never on mount.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { CheckQuestion } from '../../foundations/bits';
import type { ConnectorId, ConnectorRecord } from '../cableTypes';
import { CONNECTOR_INKS, type ConnectorInk } from '../connectorInks';
import { L03_CHECKS, L03_ENTRIES, L03_LESSON } from '../data/lesson03';
import { getConnector } from '../data/registry';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  lessonStyles as s,
} from './bits';
import { ConnectorCard, InkLegend, RecognitionStrip } from './connectorCard';

/** Recognition-tier records surfaced view-only alongside the analog family
 *  (sweep 2026-08-15): identify + purpose only — never assessed. */
const RECOGNITION_IDS: ConnectorId[] = [
  'mini_xlr',
  'xlr4',
  'xlr5',
  'tt_bantam',
  'quarter_patch',
  'db25',
  'edac',
  'euroblock',
  'lk_veam',
];

export function Lesson03Body() {
  // ── connector browser ──────────────────────────────────────────────────
  const [sel, setSel] = useState<ConnectorId>('xlr3');
  const entry = L03_ENTRIES.find((e) => e.id === sel);
  const rec = getConnector(sel);

  /** Inks actually used across the seven records' pinouts — derived from the
   *  verified data itself (one source of truth), shown once above the cards
   *  in registry declaration order. */
  const legendInks = useMemo(() => {
    const used = new Set<string>();
    for (const e of L03_ENTRIES) {
      getConnector(e.id)?.pinouts.forEach((p) => p.contacts.forEach((c) => used.add(c.ink)));
    }
    return (Object.keys(CONNECTOR_INKS) as ConnectorInk[]).filter((k) => used.has(k));
  }, []);

  /** Verified recognition-tier records for the view-only strip below. */
  const recognitionRecs = useMemo(
    () => RECOGNITION_IDS.map((id) => getConnector(id)).filter((r): r is ConnectorRecord => r != null),
    [],
  );

  // ── knowledge check (unit gate) ────────────────────────────────────────
  const solvedRef = useRef<Set<number>>(new Set());
  const markedRef = useRef(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const onSolved = useCallback((i: number) => {
    if (solvedRef.current.has(i)) return; // CheckQuestion fires once, but stay defensive
    solvedRef.current.add(i);
    setSolvedCount(solvedRef.current.size);
    // Screen-reader feedback: CheckQuestion's reveal renders silently, so the
    // outcome + progress are announced here (sweep 2026-08-15).
    AccessibilityInfo.announceForAccessibility(
      `Correct. ${solvedRef.current.size} of ${L03_CHECKS.length} solved.`,
    );
    if (solvedRef.current.size === L03_CHECKS.length && !markedRef.current) {
      markedRef.current = true;
      // Genuine solve of ALL four questions → lesson unit credit (§1.7
      // honesty: marked here and nowhere else).
      markLabUnit('af_cables', 'l03_analog');
    }
  }, []);
  const allSolved = solvedCount === L03_CHECKS.length;

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text="THE ANALOG FAMILY — SEVEN CONNECTORS" />
      <Text style={s.body}>
        These seven carry analog audio between the equipment you will patch most often — and two of them also serve
        digital applications on the very same shell. Tap each name and read its record: the contacts, the cable behind
        it, and the mistakes that come from trusting the fit.
      </Text>
      {/* ART SLOT: owner-supplied analog-family lineup illustration (all seven
          connectors, front views) mounts here once delivered — nothing renders
          until then. Per-connector artwork mounts inside ConnectorCard. */}
      <View style={s.chipWrap}>
        {L03_ENTRIES.map((e) => (
          <OptionChip key={e.id} label={e.chip} active={e.id === sel} onPress={() => setSel(e.id)} />
        ))}
      </View>

      <Eyebrow text="PINOUT INK KEY" />
      <Text style={s.hint}>
        Diagram inks used in the pinouts below — always read them together with the printed contact label, never by
        color alone.
      </Text>
      <InkLegend inks={legendInks} />

      {entry && rec ? (
        <>
          <DetailCard>
            <Text style={s.cardHead}>WHY THIS ONE MATTERS</Text>
            <Text style={s.body}>{entry.leadIn}</Text>
          </DetailCard>
          <ConnectorCard rec={rec} />
        </>
      ) : null}

      <Eyebrow text={`KNOWLEDGE CHECK · ${solvedCount} OF ${L03_CHECKS.length} SOLVED`} />
      {!allSolved ? (
        <Text style={s.hint}>Solve all four to complete this lesson. Wrong picks stay open — keep trying.</Text>
      ) : null}
      {L03_CHECKS.map((spec, i) => (
        <CheckQuestion key={spec.question} spec={spec} onSolved={() => onSolved(i)} />
      ))}
      {allSolved ? (
        <CheckDoneBanner text="Lesson check complete — XLR is not automatically a mic, TRS is not automatically stereo or balanced, instrument cable is not speaker cable, and an RCA shell does not certify the cable behind it." />
      ) : null}

      <RecognitionStrip rec={recognitionRecs} title="ALSO RECOGNIZE — PATCH, MULTIPIN & COMPACT" />

      <LessonBanner text={L03_LESSON} />
    </>
  );
}
