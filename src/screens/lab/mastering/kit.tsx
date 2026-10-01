/**
 * Mastering Lab kit — the reading and decision pieces every module uses:
 * prose, cards, the two-column role table, the scenario card (one decision,
 * explained either way), the multi-select checklist, key terms, and the
 * bezel helpers that tint a level readout on the app-wide amplitude ramp.
 *
 * COLOURS: every LEVEL number (peak, true peak, loudness) is tinted with
 * levelColorForDb — the MIDI-velocity ramp the whole app uses; a peak /
 * true-peak readout that is OVER its ceiling reads PEAK_RED. Nothing here
 * invents a second level language.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { levelColorForDb } from '../../../features/tools/levelColor';
import type { BezelItem } from '../rack/rackTypes';
import type { Scenario } from './masteringContent';

/** The app-wide peak-readout red (owner standard). */
export const PEAK_RED = '#ff5a48';

/** Level readout tint: the ramp over the meters' −60…0 dBFS window; over
 *  the ceiling (or over 0) it is the peak red. */
export function levelTint(db: number | null | undefined, ceilingDb = 0): string {
  if (db == null || !Number.isFinite(db)) return colors.textMuted;
  if (db > ceilingDb) return PEAK_RED;
  return levelColorForDb(db);
}

/** A LUFS readout tinted on the same ramp, mapped −36…0 LUFS (the Visual
 *  Audio Analysis loudness scale). */
export function lufsTint(lufs: number | null | undefined): string {
  if (lufs == null || !Number.isFinite(lufs)) return colors.textMuted;
  return levelColorForDb(lufs, -36, 0);
}

export const fmtDb = (v: number | null | undefined, unit = 'dB', digits = 1): string =>
  v == null || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(digits)} ${unit}`;

/** Bezel cells for a measured version: PEAK · TRUE PK · LUFS · PLR. */
export function measureBezel(m: { peakDb: number; truePeakDb: number; lufs: number; plr: number } | undefined, ceilingDb = 0): BezelItem[] {
  return [
    { k: 'PEAK', v: m ? `${m.peakDb.toFixed(1)}` : '—', tint: m ? levelTint(m.peakDb, ceilingDb) : colors.textMuted },
    { k: 'TRUE PK', v: m ? `${m.truePeakDb.toFixed(1)}` : '—', tint: m ? levelTint(m.truePeakDb, ceilingDb) : colors.textMuted },
    { k: 'LUFS', v: m ? `${m.lufs.toFixed(1)}` : '—', tint: m ? lufsTint(m.lufs) : colors.textMuted },
    { k: 'PLR', v: m ? `${m.plr.toFixed(1)}` : '—' },
  ];
}

/** The steady MATCH cell (cognitive review 2026-10-01, finding 10): the
 *  key carries the unit, the value says what the louder version plays at
 *  — independent of which version is on the glass. */
export function matchBezel(matched: boolean, loudGainDb: number | undefined, loudLabel: string): BezelItem {
  const v = !matched ? 'OFF' : loudGainDb != null && loudGainDb !== 0 ? `${loudGainDb.toFixed(1)} on ${loudLabel}` : 'ON ▶';
  return { k: 'MATCH dB', v, tint: matched ? colors.cyan : colors.gold, flex: 1.7 };
}

/* ── text ────────────────────────────────────────────────────────────────── */

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function Card({ children, tone }: { children: ReactNode; tone?: 'plain' | 'accent' | 'warn' }) {
  return <View style={[styles.card, tone === 'accent' && styles.cardAccent, tone === 'warn' && styles.cardWarn]}>{children}</View>;
}

/** A numbered or titled point inside a card. */
export function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.point}>
      <Text style={styles.pointTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

export function TakeawayCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.takeaway}>
      <Text style={styles.takeawayLabel}>TAKEAWAY</Text>
      <Text style={styles.takeawayText}>{children}</Text>
    </View>
  );
}

/** The two-column comparison (Module 2). */
export function CompareTable({ left, right, rows }: { left: string; right: string; rows: readonly [string, string][] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tr, styles.th]}>
        <Text style={[styles.td, styles.thText]}>{left}</Text>
        <Text style={[styles.td, styles.thText]}>{right}</Text>
      </View>
      {rows.map(([a, b], i) => (
        <View key={i} style={[styles.tr, i % 2 ? styles.trAlt : null]}>
          <Text style={styles.td}>{a}</Text>
          <Text style={styles.td}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

/** Field / value rows (the inspection sheet, the brief). */
export function FieldRows({ rows }: { rows: readonly { field: string; value: string; flag?: string }[] }) {
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={r.field} style={[styles.fieldRow, i % 2 ? styles.trAlt : null]}>
          <Text style={styles.fieldK}>{r.field}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.fieldV}>{r.value}</Text>
            {r.flag ? <Text style={styles.fieldFlag}>⚑ {r.flag}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function KeyTerms({ terms }: { terms: readonly { term: string; def: string }[] }) {
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>KEY TERMS</SectionTitle>
      {terms.map((t) => (
        <View key={t.term} style={styles.term}>
          <Text style={styles.termName}>{t.term}</Text>
          <Text style={styles.termDef}>{t.def}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── decisions ───────────────────────────────────────────────────────────── */

/** Deterministic shuffle of option indices per scenario + mount. */
function shuffled(n: number, seed: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * One scenario, one pick. Correct BY VALUE. The first pick is what the
 * module records (a retry is encouraged and explained, never penalised).
 *
 * FEEDBACK ORDER (cognitive review 2026-10-01): a wrong pick names THAT
 * option as the one that does not fit and keeps the card open; the full
 * explanation is revealed by the correct pick, so the learner reasons
 * before reading the answer. `compact` lays the options out as two-column
 * chips (the eight-option tool bank).
 */
export function ScenarioCard({ s, onAnswered, keepOrder, compact }: { s: Scenario; onAnswered?: (correct: boolean) => void; keepOrder?: boolean; compact?: boolean }) {
  const seed = useRef(Math.floor(Math.random() * 0x7fffffff)).current;
  const order = useMemo(() => (keepOrder ? s.options.map((_, i) => i) : shuffled(s.options.length, seed ^ s.id.length)), [s, seed, keepOrder]);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const reported = useRef(false);
  const correct = picked === s.correct;
  return (
    <Card tone="accent">
      <Text style={styles.q}>{s.prompt}</Text>
      <View style={compact ? styles.optGrid : { gap: 6 }}>
        {order.map((i) => {
          const o = s.options[i];
          const isRight = picked != null && correct && o === s.correct;
          const isWrongPick = picked === o && !correct;
          const wasWrong = wrongPicks.includes(o);
          return (
            <Pressable
              key={o}
              disabled={picked != null && correct}
              onPress={() => {
                const ok = o === s.correct;
                setPicked(o);
                if (!ok) setWrongPicks((w) => (w.includes(o) ? w : [...w, o]));
                if (!reported.current) {
                  reported.current = true;
                  onAnswered?.(ok);
                }
                AccessibilityInfo.announceForAccessibility?.(ok ? 'Correct.' : `${o}: not the best fit. Choose again.`);
              }}
              style={[styles.opt, compact && styles.optChip, isRight && styles.optRight, isWrongPick && styles.optWrong, wasWrong && !isWrongPick && styles.optDim]}
              accessibilityRole="button"
              accessibilityState={{ disabled: picked != null && correct, selected: picked === o }}
              aria-pressed={picked === o}
              accessibilityLabel={o}
            >
              <Text style={[styles.optText, compact && styles.optChipText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }, wasWrong && !isWrongPick && { color: colors.textMuted }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <Text style={[styles.explain, { color: correct ? colors.green : colors.gold }]}>
          {correct
            ? `✓ ${s.explain}`
            : `✗ "${picked}" is not the best fit here — it does not address what the situation actually asks for. Choose again; the full explanation appears with the option that does.`}
        </Text>
      ) : null}
    </Card>
  );
}

/**
 * A PRACTICE deck: one scenario at a time with "3 of 8", PREV / NEXT CARD
 * keys and the first-answer rule stated on the page. Every card stays
 * mounted (hidden, not unmounted) so a pick survives paging back.
 */
export function ScenarioDeck({ scenarios, onAnswered, keepOrder, compact, intro }: {
  scenarios: readonly Scenario[];
  onAnswered: (scenarioId: string, correct: boolean) => void;
  keepOrder?: boolean;
  compact?: boolean;
  intro?: string;
}) {
  const [cur, setCur] = useState(0);
  const n = scenarios.length;
  const i = Math.min(cur, Math.max(0, n - 1));
  return (
    <View style={{ gap: 10 }}>
      {intro ? <Body>{intro}</Body> : null}
      <View style={styles.deckBar}>
        <Text style={styles.deckCount}>{`CARD ${i + 1} OF ${n}`}</Text>
        <Text style={styles.deckRule}>Your FIRST answer on each card is the one recorded. A retry is explained, never penalised.</Text>
      </View>
      {scenarios.map((s, k) => (
        <View key={s.id} style={k === i ? null : styles.hidden} accessibilityElementsHidden={k !== i} importantForAccessibility={k === i ? 'auto' : 'no-hide-descendants'}>
          <ScenarioCard s={s} keepOrder={keepOrder} compact={compact} onAnswered={(ok) => onAnswered(s.id, ok)} />
        </View>
      ))}
      <View style={styles.deckKeys}>
        <KeyButton label="‹ PREV CARD" onPress={() => setCur((c) => Math.max(0, c - 1))} disabled={i === 0} />
        <KeyButton label="NEXT CARD ›" onPress={() => setCur((c) => Math.min(n - 1, c + 1))} disabled={i >= n - 1} tint={colors.green} />
      </View>
    </View>
  );
}

/** A proper 44-pt key for an in-well action (REVEAL THE KEY, DRAW THE MIX). */
export function KeyButton({ label, onPress, disabled, tint }: { label: string; onPress: () => void; disabled?: boolean; tint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.key, tint && !disabled ? { borderColor: tint } : null, disabled && styles.keyOff]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
    >
      <Text style={[styles.keyText, tint && !disabled ? { color: tint } : null, disabled && { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

/** A multi-select list: tap to include. `onChange` gets the chosen ids. */
export function Checklist({ items, chosen, onToggle, reveal }: { items: readonly { id: string; label: string; why?: string; needed?: boolean }[]; chosen: ReadonlySet<string>; onToggle: (id: string) => void; reveal?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => {
        const on = chosen.has(it.id);
        const verdict = reveal && it.needed != null ? (on === it.needed ? 'ok' : 'miss') : null;
        return (
          <Pressable
            key={it.id}
            onPress={() => onToggle(it.id)}
            style={[styles.check, on && styles.checkOn, verdict === 'ok' && styles.checkOk, verdict === 'miss' && styles.checkMiss]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={it.label}
          >
            <Text style={[styles.checkBox, on && { color: colors.green }]}>{on ? '☑' : '☐'}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.checkText}>{it.label}</Text>
              {reveal && it.why ? <Text style={[styles.checkWhy, verdict === 'miss' && { color: colors.gold }]}>{verdict === 'miss' ? (it.needed ? 'Needed: ' : 'Not this: ') : ''}{it.why}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The LISTEN page's STATUS LINE (cognitive review 2026-10-01, finding 11):
 *  the dock keys are the only transport; the well reports what is sounding,
 *  at what gain, and whether it is matched. One sentence, live. */
export function PlaybackStatus({ versions, active, pending, rendering, matched, matchDb, labels }: {
  versions: readonly { id: string; label: string }[];
  active: string | null;
  pending: string | null;
  rendering: boolean;
  matched: boolean;
  /** The matched-level gain of the sounding version (dB, ≤ 0). */
  matchDb?: number;
  /** The dock's play keys, for the idle hint ("▶ MIX or ▶ LOUDER"). */
  labels?: string;
}) {
  const name = (id: string | null) => versions.find((v) => v.id === id)?.label ?? '';
  let text: string;
  if (rendering) text = `rendering ${name(pending)} — real DSP on the whole programme, one moment…`;
  else if (active) text = `sounding ${name(active)} · ${matchDb ? `played at ${matchDb.toFixed(1)} dB · matched` : matched ? 'played as rendered · matched' : 'UNMATCHED — as rendered'}`;
  else text = `stopped · press ${labels ?? 'a ▶ key'} in the dock${matched ? '' : ' — MATCH is OFF: unmatched, LOUDER plays at its full level'}`;
  return (
    <Text style={[styles.status, !matched && !rendering ? { color: colors.gold } : null]} accessibilityLiveRegion="polite">
      {text.toUpperCase()}
    </Text>
  );
}

/** The volume warning (safety review 2026-10-01, finding 1a), printed live
 *  from the two measured loudness estimates. */
export function unmatchedWarning(mixLufs: number | undefined, loudLufs: number | undefined, loudName = 'LOUDER', fallback = '8–11'): string {
  const step = mixLufs != null && loudLufs != null && Number.isFinite(mixLufs) && Number.isFinite(loudLufs) ? Math.max(0, loudLufs - mixLufs) : null;
  return `Turn your volume down first — unmatched, ${loudName} steps up by about ${step != null ? step.toFixed(0) : fallback} dB.`;
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2, marginTop: 4 },
  kicker: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.8 },
  body: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#121215', padding: 12, gap: 8 },
  cardAccent: { borderColor: 'rgba(255,198,77,.35)', backgroundColor: '#15130d' },
  cardWarn: { borderColor: 'rgba(255,138,30,.45)', backgroundColor: '#17110b' },
  point: { gap: 2 },
  pointTitle: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  takeaway: { borderLeftWidth: 2, borderLeftColor: colors.green, paddingLeft: 10, gap: 2, marginTop: 4 },
  takeawayLabel: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  takeawayText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  table: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  trAlt: { backgroundColor: '#121215' },
  th: { backgroundColor: '#1a1812' },
  td: { flex: 1, padding: 8, color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  thText: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
  fieldRow: { flexDirection: 'row', gap: 8, padding: 8 },
  fieldK: { width: 108, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1, paddingTop: 2 },
  fieldV: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 17 },
  fieldFlag: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  term: { gap: 1 },
  termName: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 13.5 },
  termDef: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  opt: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f1d14' },
  optWrong: { borderColor: colors.red },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 44, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  checkOn: { borderColor: 'rgba(55,224,95,.5)' },
  checkOk: { backgroundColor: '#0f1d14' },
  checkMiss: { borderColor: colors.gold },
  checkBox: { color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 17, lineHeight: 20 },
  checkText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  checkWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16 },
  status: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, lineHeight: 15 },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optChip: { flexBasis: '48%', flexGrow: 1, paddingHorizontal: 8 },
  optChipText: { fontSize: 12.5, lineHeight: 16 },
  optDim: { borderColor: colors.hairline, opacity: 0.55 },
  hidden: { display: 'none' },
  deckBar: { gap: 2 },
  deckCount: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2 },
  deckRule: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  deckKeys: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.amber, backgroundColor: '#101013' },
  keyOff: { borderColor: colors.hairline },
  keyText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2 },
});
