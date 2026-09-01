/**
 * Lesson 12 — Final Knowledge Check (owner spec §5.12).
 * Two CheckQuestion banks, data-driven from data/lesson12.ts:
 *   • GENERAL (10): FINAL_UNIT marked EXACTLY ONCE, when the tenth question is
 *     genuinely solved (§1.7 honesty — never on view, never on mount).
 *   • CRITICAL SAFETY (7): each question marks ITS OWN unit from SAFETY_UNITS
 *     the moment it is solved, so af_cables is structurally incapable of
 *     completing until every safety question has been answered correctly
 *     (owner required-correct mandate — CheckQuestion is retry-until-correct
 *     by design, so a solve IS a correct answer).
 *
 * Completion treatment: live cleared/total lab progress while the check is
 * open; once useLabCompletion reports every af_cables unit cleared, the green
 * LAB COMPLETE banner renders with the Academy credit line.
 *
 * §5.12 actions: REVIEW CONNECTORS / RETRY FINAL CHALLENGE jump the shell via
 * useCableStepNav (rendered only when the shell provides the context).
 */
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { GlassButton } from '../../../../components/GlassButton';
import { markLabUnit, useLabCompletion } from '../../../../features/lab/labCompletion';
import { CheckQuestion } from '../../foundations/bits';
import { useCableStepNav } from './bits';
import { FINAL_UNIT } from '../cableTypes';
import { FINAL_QUESTIONS, L12_LESSON, SAFETY_QUESTIONS, type SafetyCheckItem } from '../data/lesson12';
import { CheckDoneBanner, Eyebrow, LessonBanner, PrincipleBanner, lessonStyles as s } from './bits';

export function Lesson12Body() {
  const completion = useLabCompletion('af_cables');
  const nav = useCableStepNav();

  // ── general bank: FINAL_UNIT only when ALL ten are solved (§1.7) ─────────
  // CheckQuestion fires onSolved once per question, so a plain counter is
  // exact; the ref keeps the count out of the state updater (no side effects
  // inside setState). markLabUnit is idempotent, so a re-solve after a
  // revisit is a harmless no-op.
  const generalRef = useRef(0);
  const [generalSolved, setGeneralSolved] = useState(0);
  const onGeneralSolved = useCallback(() => {
    generalRef.current += 1;
    setGeneralSolved(generalRef.current);
    // Screen-reader feedback: CheckQuestion's reveal renders silently, so the
    // outcome + progress are announced here (sweep 2026-08-15).
    AccessibilityInfo.announceForAccessibility(
      `Correct. ${Math.min(generalRef.current, FINAL_QUESTIONS.length)} of ${FINAL_QUESTIONS.length} solved.`,
    );
    if (generalRef.current >= FINAL_QUESTIONS.length) {
      // Genuine full solve of the general bank → the final-check unit
      // (marked here and nowhere else).
      markLabUnit('af_cables', FINAL_UNIT);
    }
  }, []);

  // ── safety bank: each question marks ITS OWN persisted unit on solve ─────
  const safetyRef = useRef(0);
  const [safetySolved, setSafetySolved] = useState(0);
  const onSafetySolved = useCallback((q: SafetyCheckItem) => {
    markLabUnit('af_cables', q.unit);
    safetyRef.current += 1;
    setSafetySolved(safetyRef.current);
    // Screen-reader feedback: the safety reveal is the teaching moment, so it
    // is announced along with progress (sweep 2026-08-15).
    AccessibilityInfo.announceForAccessibility(
      `Correct. ${q.reveal} ${Math.min(safetyRef.current, SAFETY_QUESTIONS.length)} of ${SAFETY_QUESTIONS.length} safety questions solved.`,
    );
  }, []);

  return (
    <>
      <PrincipleBanner />

      {completion.complete ? (
        <>
          <CheckDoneBanner text="LAB COMPLETE — Cable & Connector Fundamentals" />
          <Text style={s.body}>Credit for this lab is recorded through the Academy’s lab system.</Text>
        </>
      ) : (
        <Eyebrow text={`LAB PROGRESS · ${completion.cleared} OF ${completion.total} UNITS CLEARED`} />
      )}

      {/* ── BANK 1 — GENERAL ─────────────────────────────────────────────── */}
      <Eyebrow text={`GENERAL · ${generalSolved} OF ${FINAL_QUESTIONS.length} SOLVED`} />
      <Text style={s.body}>
        Identification, routing, construction, balanced vs unbalanced, levels, protocols, inspection, troubleshooting,
        contact roles and look-alikes — everything the lab taught. Wrong picks stay open; keep trying until each one is
        solved.
      </Text>
      {FINAL_QUESTIONS.map((q) => (
        <CheckQuestion key={q.id} spec={q} onSolved={onGeneralSolved} />
      ))}
      {generalSolved >= FINAL_QUESTIONS.length ? (
        <CheckDoneBanner text="General check complete — all ten solved." />
      ) : null}

      {/* ── BANK 2 — CRITICAL SAFETY (each question = its own unit) ─────── */}
      <Eyebrow text="CRITICAL SAFETY — EVERY ONE OF THESE MUST BE ANSWERED CORRECTLY" />
      <Text style={s.body}>
        Each question below records its own completion unit, and the lab cannot complete until every one has been
        answered correctly. These are rules, not judgment calls.
      </Text>
      {SAFETY_QUESTIONS.map((q) => (
        <CheckQuestion key={q.unit} spec={q} onSolved={() => onSafetySolved(q)} />
      ))}
      {safetySolved >= SAFETY_QUESTIONS.length ? (
        <CheckDoneBanner text="Critical safety check complete — every rule answered correctly." />
      ) : null}

      {/* §5.12 actions — moved BELOW both banks (design pass 2026-08-31):
          on a first visit they rendered above everything and read as the
          step's primary actions before a single question was attempted. */}
      {nav ? (
        <View style={{ gap: 8 }}>
          <GlassButton label="REVIEW CONNECTORS ›" tint="gold" onPress={() => nav('l03_analog')} />
          <GlassButton label="RETRY FINAL CHALLENGE ›" tint="green" onPress={() => nav('l11_challenge')} />
        </View>
      ) : null}

      <LessonBanner text={L12_LESSON} />
    </>
  );
}
