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
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassButton } from '../../../../components/GlassButton';
import { markLabUnit, useLabClearedUnits, useLabCompletion } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import { CheckQuestion } from '../../foundations/bits';
import { useCableStepNav } from './bits';
import { CHALLENGE_A_UNIT, CHALLENGE_B_UNIT, FINAL_UNIT, SAFETY_UNITS, type CableLessonId } from '../cableTypes';
import { CABLE_LESSONS, LESSON_UNITS } from '../data/lessons';
import { FINAL_QUESTIONS, L12_LESSON, SAFETY_QUESTIONS, type SafetyCheckItem } from '../data/lesson12';
import { CheckDoneBanner, Eyebrow, LessonBanner, PrincipleBanner, lessonStyles as s } from './bits';

/** One row of the what's-left list: a step with uncleared units. */
type LeftRow = { id: CableLessonId; step: number; title: string; detail: string };

/**
 * WHAT'S LEFT (bug hunt 2026-09-29 — owner hard rule: every lab ends with a
 * "what's left" screen). The final step used to show only "X OF Y UNITS
 * CLEARED" and DONE ✓ just went back, so a learner could not tell WHICH
 * units were missing. Every step with an uncleared unit is listed by name;
 * earlier steps jump there, this step's own banks point down the page.
 */
export function outstandingRows(cleared: ReadonlySet<string>): LeftRow[] {
  const rows: LeftRow[] = [];
  CABLE_LESSONS.forEach((l, i) => {
    const missing = LESSON_UNITS[l.id].filter((u) => !cleared.has(u));
    if (missing.length === 0) return;
    let detail = 'Knowledge check not yet solved';
    if (l.id === 'l10_tester') detail = 'Bench not yet cleared — every cable named and dispatched';
    else if (l.id === 'l11_challenge') {
      const left = [
        missing.includes(CHALLENGE_A_UNIT) ? 'Show A (live show)' : null,
        missing.includes(CHALLENGE_B_UNIT) ? 'Studio B (recording studio)' : null,
      ].filter(Boolean);
      detail = `${left.join(' and ')} not yet solved`;
    } else if (l.id === 'l12_final') {
      const safetyLeft = missing.filter((u) => SAFETY_UNITS.includes(u)).length;
      const parts = [
        missing.includes(FINAL_UNIT) ? 'the general bank' : null,
        safetyLeft > 0 ? `${safetyLeft} critical safety question${safetyLeft === 1 ? '' : 's'}` : null,
      ].filter(Boolean);
      detail = `On this page, below: ${parts.join(' and ')}`;
    }
    rows.push({ id: l.id, step: i + 1, title: l.title, detail });
  });
  return rows;
}

function WhatsLeft({ nav }: { nav: ((id: CableLessonId) => void) | null }) {
  const cleared = useLabClearedUnits('af_cables');
  const rows = outstandingRows(cleared);
  if (rows.length === 0) return null;
  return (
    <View style={ws.list}>
      <Text style={ws.head}>WHAT’S LEFT</Text>
      {rows.map((r) => {
        const here = r.id === 'l12_final';
        const inner = (
          <>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={ws.step}>{`STEP ${r.step} · ${r.title}`}</Text>
              <Text style={ws.detail}>{r.detail}</Text>
            </View>
            {!here && nav ? <Text style={ws.go}>›</Text> : null}
          </>
        );
        return !here && nav ? (
          <Pressable
            key={r.id}
            style={ws.row}
            onPress={() => nav(r.id)}
            accessibilityRole="button"
            accessibilityLabel={`Go to step ${r.step}, ${r.title}. ${r.detail}`}
          >
            {inner}
          </Pressable>
        ) : (
          <View key={r.id} style={ws.row} accessibilityLabel={`Step ${r.step}, ${r.title}. ${r.detail}`}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

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
        <>
          <Eyebrow text={`LAB PROGRESS · ${completion.cleared} OF ${completion.total} UNITS CLEARED`} />
          <WhatsLeft nav={nav} />
        </>
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

const ws = StyleSheet.create({
  list: { gap: 1, borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, overflow: 'hidden' },
  head: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.amber,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#141416',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#141416' },
  step: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textPrimary },
  detail: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  go: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber },
});
