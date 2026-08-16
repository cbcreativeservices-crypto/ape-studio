/**
 * Lesson 2 — Cable & Connector Anatomy (owner spec §5.2).
 * Data-driven from data/lesson02.ts (exemplar discipline: lesson01): two
 * tap-through term explorers (connector parts, cable layers), the seven
 * cable cross-sections as outside→inside layer-peel reveals, and a
 * three-question knowledge check. Tap-only; retry-until-correct; completion
 * credit marked ONLY when all three checks are genuinely solved
 * (markLabUnit → af_cables/l02_anatomy — §1.7 honesty).
 *
 * NO ART is drawn here (ruling 2026-08-15): cross-section artwork is
 * owner-supplied later; the peel interaction runs on labeled text rows with
 * an ART SLOT comment at the mount point.
 */
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import type { CableSectionId } from '../cableTypes';
import { CheckQuestion } from '../../foundations/bits';
import {
  CABLE_TERMS,
  CONNECTOR_TERMS,
  CROSS_SECTIONS,
  L02_CHECKS,
  L02_RULE,
} from '../data/lesson02';
import { CheckDoneBanner, DetailCard, Eyebrow, LessonBanner, OptionChip, lessonStyles as s } from './bits';

export function Lesson02Body() {
  // ── term explorers (§5.2a) — one selection per group ───────────────────
  const [connId, setConnId] = useState(CONNECTOR_TERMS[0].id);
  const [cabId, setCabId] = useState(CABLE_TERMS[0].id);
  const connTerm = CONNECTOR_TERMS.find((t) => t.id === connId);
  const cabTerm = CABLE_TERMS.find((t) => t.id === cabId);

  // ── cross-section peels (§5.2b) — per-section reveal depth persists when
  //    switching constructions, so learners can compare builds mid-peel ────
  const [secId, setSecId] = useState<CableSectionId>(CROSS_SECTIONS[0].id);
  const [peeled, setPeeled] = useState<Partial<Record<CableSectionId, number>>>({});
  const sec = CROSS_SECTIONS.find((c) => c.id === secId) ?? CROSS_SECTIONS[0];
  const revealed = Math.min(peeled[sec.id] ?? 0, sec.layers.length);
  const fullyPeeled = CROSS_SECTIONS.filter((c) => (peeled[c.id] ?? 0) >= c.layers.length).length;

  const peelNext = useCallback(() => {
    setPeeled((p) => {
      const cur = p[sec.id] ?? 0;
      if (cur >= sec.layers.length) return p;
      return { ...p, [sec.id]: cur + 1 };
    });
  }, [sec]);

  // ── knowledge check (§5.2c) — three CheckQuestions mount together, so the
  //    aggregate lives here (DetectiveModule idiom, local solved set) ──────
  const solvedRef = useRef<Set<number>>(new Set());
  const [solvedCount, setSolvedCount] = useState(0);
  const onCheckSolved = useCallback((i: number) => {
    solvedRef.current.add(i);
    setSolvedCount(solvedRef.current.size);
    // Screen-reader feedback: CheckQuestion's reveal renders silently, so the
    // outcome + progress are announced here (sweep 2026-08-15).
    AccessibilityInfo.announceForAccessibility(
      `Correct. ${solvedRef.current.size} of ${L02_CHECKS.length} solved.`,
    );
    if (solvedRef.current.size >= L02_CHECKS.length) {
      // Genuine solve of all three checks → lesson unit credit (§1.7 honesty:
      // marked here and nowhere else; markLabUnit itself no-ops on repeats).
      markLabUnit('af_cables', 'l02_anatomy');
    }
  }, []);
  const checksDone = solvedCount >= L02_CHECKS.length;

  return (
    <>
      <Eyebrow text="THE CONNECTOR, PART BY PART" />
      <Text style={s.body}>
        Every connector, whatever its shape, is built from the same short vocabulary. Tap each term — these are the
        words the rest of this lab (and every spec sheet) will use.
      </Text>
      <View style={s.chipWrap}>
        {CONNECTOR_TERMS.map((t) => (
          <OptionChip key={t.id} label={t.label} active={t.id === connId} onPress={() => setConnId(t.id)} />
        ))}
      </View>
      {connTerm ? (
        <DetailCard>
          <Text style={s.cardTitle}>{connTerm.label}</Text>
          <Text style={s.body}>{connTerm.def}</Text>
        </DetailCard>
      ) : null}

      <Eyebrow text="INSIDE THE CABLE" />
      <Text style={s.body}>
        Under every jacket is a layered build, and each layer has a job. Learn the layer names first — the seven
        constructions below are made of nothing else.
      </Text>
      <View style={s.chipWrap}>
        {CABLE_TERMS.map((t) => (
          <OptionChip key={t.id} label={t.label} active={t.id === cabId} onPress={() => setCabId(t.id)} />
        ))}
      </View>
      {cabTerm ? (
        <DetailCard>
          <Text style={s.cardTitle}>{cabTerm.label}</Text>
          <Text style={s.body}>{cabTerm.def}</Text>
        </DetailCard>
      ) : null}

      <LessonBanner text={L02_RULE} />

      <Eyebrow text={`SEVEN CONSTRUCTIONS · ${fullyPeeled} OF ${CROSS_SECTIONS.length} PEELED`} />
      <Text style={s.body}>
        Seven builds cover nearly every cable this lab handles. Pick one and peel it open, layer by layer, from the
        outside in.
      </Text>
      <View style={s.chipWrap}>
        {CROSS_SECTIONS.map((c) => (
          <OptionChip
            key={c.id}
            label={(peeled[c.id] ?? 0) >= c.layers.length ? `${c.chip} ✓` : c.chip}
            active={c.id === secId}
            onPress={() => setSecId(c.id)}
          />
        ))}
      </View>
      <DetailCard>
        {/* ART SLOT: owner-supplied cross-section illustration for this
            construction mounts here (peel art keyed to `revealed`, outside→
            inside) — the labeled text rows below carry the teaching until the
            artwork lands. */}
        <Text style={s.cardTitle}>{sec.label}</Text>
        <Text style={s.hint}>{sec.tagline}</Text>
        <Text style={s.cardHead}>
          {revealed === 0
            ? 'UNOPENED — PEEL FROM THE OUTSIDE IN'
            : `OUTSIDE → INSIDE · LAYER ${revealed} OF ${sec.layers.length}`}
        </Text>
        {sec.layers.slice(0, revealed).map((ly, i) => (
          <View key={ly.name} style={local.layerRow}>
            <Text style={local.layerNum}>{String(i + 1)}</Text>
            <View style={local.layerBody}>
              <Text style={local.layerName}>{ly.name}</Text>
              <Text style={s.body}>{ly.role}</Text>
            </View>
          </View>
        ))}
        {revealed >= sec.layers.length ? (
          <>
            <Text style={s.cardHead}>FULLY PEELED — WHAT YOU CANNOT SEE FROM OUTSIDE</Text>
            <Text style={s.body}>{sec.note}</Text>
          </>
        ) : null}
      </DetailCard>
      {revealed < sec.layers.length ? (
        <OptionChip label={revealed === 0 ? 'PEEL THE FIRST LAYER ›' : 'PEEL DEEPER ›'} active action onPress={peelNext} />
      ) : null}

      <Eyebrow text={`KNOWLEDGE CHECK · ${Math.min(solvedCount, L02_CHECKS.length)} OF ${L02_CHECKS.length} SOLVED`} />
      {L02_CHECKS.map((spec, i) => (
        <CheckQuestion key={spec.question} spec={spec} onSolved={() => onCheckSolved(i)} />
      ))}
      {checksDone ? (
        <CheckDoneBanner text="Lesson check complete — connector parts and cable layers named, and seven constructions peeled from the jacket to the core." />
      ) : null}
    </>
  );
}

const local = StyleSheet.create({
  layerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1d1d22',
    paddingTop: 7,
  },
  layerNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.amberLabel, minWidth: 16, marginTop: 1 },
  layerBody: { flex: 1, gap: 2 },
  layerName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.textPrimary },
});
