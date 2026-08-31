/**
 * Cable Dressing & Installation Lab — shared UI bits.
 *
 * The lab's standard teaching rhythm (spec §23/§38) lives here so every scene
 * speaks it identically:
 *   ACTION (the learner interacts, in the scene)
 *   RESULT (RuleFeedback: one-breath verdict)
 *   WHY?   (expandable mechanism)
 *   SOURCE (expandable authority badge + reference names)
 * Plus the authority badge system (spec §3), the sources sheet (§5), the
 * Rule-or-Myth interstitial (§25), the scenario-spec ritual card (§29), and
 * the dimension score bars (§22/§43).
 *
 * Reuses the app's existing kit (digital/bits, foundations/bits, cable
 * lessons/bits) — no parallel design system.
 */
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../../features/settings/store';
import { colors, fonts } from '../../../theme/tokens';
import { AUTHORITY_META, ruleById, type AuthorityClass, type CiRule } from './data/rules';
import { sourceById } from './data/sources';
import type { CiMyth } from './data/scenarios';
import { CI_DIM_META, CI_DIMS, masteryBlocks, type CiDimScores } from './engine/score';

/* ── authority badge (spec §3/§50 — visually secondary, tappable) ───────── */
export function AuthorityBadge({ authority, jurisdiction, onPress }: { authority: AuthorityClass; jurisdiction?: string; onPress?: () => void }) {
  const meta = AUTHORITY_META[authority];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${meta.label}${jurisdiction ? `, ${jurisdiction}` : ''}. ${meta.blurb}`}
      style={[styles.authBadge, { borderColor: meta.tint + '77' }]}
    >
      <View style={[styles.authDot, { backgroundColor: meta.tint }]} />
      <Text style={[styles.authText, { color: meta.tint }]} numberOfLines={1}>
        {jurisdiction ? `${jurisdiction} ` : ''}
        {meta.label}
      </Text>
    </Pressable>
  );
}

/* ── the three-level feedback block (spec §23) ──────────────────────────── */
export function RuleFeedback({
  ruleId,
  verdict,
  short,
  openSources,
}: {
  ruleId: string;
  /** 'good' praises; 'bad' flags; 'info' teaches neutrally. */
  verdict: 'good' | 'bad' | 'info';
  /** Immediate feedback override (defaults to the rule's studentText). */
  short?: string;
  openSources: (ids: string[]) => void;
}) {
  const rule = ruleById(ruleId);
  const [whyOpen, setWhyOpen] = useState(false);
  if (!rule) return null;
  const tint = verdict === 'good' ? colors.green : verdict === 'bad' ? '#ff9b8f' : colors.textSecondary;
  const glyph = verdict === 'good' ? '✓' : verdict === 'bad' ? '✕' : 'ⓘ';
  return (
    <View style={[styles.feedback, { borderLeftColor: tint }]}>
      <Text style={[styles.feedbackShort, { color: tint }]}>
        {glyph}  {short ?? rule.studentText}
      </Text>
      <View style={styles.feedbackMetaRow}>
        <AuthorityBadge authority={rule.authorityClass} jurisdiction={rule.jurisdiction} onPress={() => openSources(rule.sourceRefs)} />
        <Pressable
          onPress={() => setWhyOpen((o) => !o)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ expanded: whyOpen }}
          accessibilityLabel={`Why? ${rule.title}`}
        >
          <Text style={styles.whyBtn}>{whyOpen ? '▾ WHY' : '▸ WHY?'}</Text>
        </Pressable>
      </View>
      {whyOpen ? (
        <View style={styles.whyBody}>
          <Text style={styles.whyText}>{rule.whyText}</Text>
          {rule.correctionText ? <Text style={styles.correctionText}>FIX  {rule.correctionText}</Text> : null}
          {rule.numericValueIsScenarioSpecific ? (
            <Text style={styles.scenarioNote}>Any number in this exercise is a scenario-supplied specification — real values come from the governing documents.</Text>
          ) : null}
          <Pressable onPress={() => openSources(rule.sourceRefs)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Show sources">
            <Text style={styles.srcBtn}>SOURCES ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ── scenario-spec ritual card (spec §29 — "check the documentation") ───── */
export function SpecCard({ text }: { text: string }) {
  return (
    <View style={styles.specCard}>
      <Text style={styles.specEyebrow}>📄 THE DOCUMENTATION FOR THIS EXERCISE</Text>
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

/* ── sources sheet (host-level in-tree overlay; spec §5) ────────────────── */
export function SourceSheet({ sourceIds, onClose }: { sourceIds: string[] | null; onClose: () => void }) {
  if (!sourceIds) return null;
  const list = sourceIds.map(sourceById).filter((s): s is NonNullable<typeof s> => !!s);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sources" />
      <View style={styles.sheetCard}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>SOURCES / STANDARDS</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.sheetClose}>✕</Text>
          </Pressable>
        </View>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10 }}>
          {list.map((s) => (
            <View key={s.id} style={styles.srcRow}>
              <Text style={styles.srcOrg}>{s.organization}</Text>
              <Text style={styles.srcDoc}>{s.document}</Text>
              {s.jurisdiction ? <Text style={styles.srcJur}>Jurisdiction: {s.jurisdiction}</Text> : null}
              {s.notes ? <Text style={styles.srcNote}>{s.notes}</Text> : null}
            </View>
          ))}
          <Text style={styles.srcFoot}>
            References only — this lab summarizes principles in its own words and never reproduces standards text. Local
            electrical, fire, building and workplace regulations always govern.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

/* ── Rule or Myth interstitial (spec §25) ───────────────────────────────── */
export function RuleOrMythCard({ myth, onDone, openSources }: { myth: CiMyth; onDone: () => void; openSources: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const rule = myth.ruleId ? ruleById(myth.ruleId) : undefined;
  const pick = (v: boolean) => {
    if (picked != null) return;
    setPicked(v);
    const right = v === myth.answer;
    if (hapticsEnabled()) {
      (right ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => {});
    }
    AccessibilityInfo.announceForAccessibility(right ? 'Correct.' : `Not quite. The statement is ${myth.answer ? 'true' : 'false'}.`);
  };
  return (
    <View style={styles.mythCard}>
      <Text style={styles.mythEyebrow}>RULE OR MYTH?</Text>
      <Text style={styles.mythStatement}>“{myth.statement}”</Text>
      <View style={styles.mythRow}>
        {([true, false] as const).map((v) => {
          const sel = picked === v;
          const isAnswer = picked != null && v === myth.answer;
          return (
            <Pressable
              key={String(v)}
              style={[styles.mythBtn, sel && styles.mythBtnSel, isAnswer && styles.mythBtnRight]}
              onPress={() => pick(v)}
              disabled={picked != null}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={v ? 'True' : 'False'}
            >
              <Text style={[styles.mythBtnText, (sel || isAnswer) && { color: colors.textPrimary }]}>{v ? 'TRUE' : 'FALSE'}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.mythVerdict, { color: picked === myth.answer ? colors.green : '#ff9b8f' }]}>
            {picked === myth.answer ? '✓ Right' : `✕ It’s ${myth.answer ? 'TRUE' : 'FALSE'}`} — {myth.reveal}
          </Text>
          {rule ? (
            <View style={styles.feedbackMetaRow}>
              <AuthorityBadge authority={rule.authorityClass} jurisdiction={rule.jurisdiction} onPress={() => openSources(rule.sourceRefs)} />
            </View>
          ) : null}
          <Pressable style={styles.mythNext} onPress={onDone} accessibilityRole="button" accessibilityLabel="Continue">
            <Text style={styles.mythNextText}>CONTINUE ›</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ── dimension score bars (spec §43 mastery profile) ────────────────────── */
export function ScoreBars({ dims }: { dims: CiDimScores }) {
  return (
    <View style={{ gap: 7 }}>
      {CI_DIMS.map((d) => {
        const v = dims[d];
        if (v == null) return null;
        const blocks = masteryBlocks(v);
        return (
          <View key={d} style={styles.dimRow} accessibilityLabel={`${CI_DIM_META[d].label}: ${v} out of 100`}>
            <Text style={styles.dimLabel}>{CI_DIM_META[d].label}</Text>
            <View style={styles.dimBlocks}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.dimBlock, i < blocks && styles.dimBlockOn]} />
              ))}
            </View>
            <Text style={styles.dimVal}>{v}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── find-the-problems progress line ────────────────────────────────────── */
export function FindProgress({ found, required, total }: { found: number; required: number; total: number }) {
  const done = found >= required;
  return (
    <Text style={[styles.findLine, done && { color: colors.green }]} accessibilityLiveRegion="polite">
      {done ? '✓ ' : ''}
      {found} found · {required} needed to continue · {total} to process in total
    </Text>
  );
}

/* ── section scaffolding ────────────────────────────────────────────────── */
export function CiSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={styles.sectionEyebrow}>{title}</Text>
      {children}
    </View>
  );
}

/** Success haptic + announcement used by every module on completion. */
export function announceComplete(text: string) {
  if (hapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  AccessibilityInfo.announceForAccessibility(text);
}

export function ruleFor(id: string): CiRule {
  const r = ruleById(id);
  if (!r) throw new Error(`cableinstall: unknown rule ${id}`);
  return r;
}

const styles = StyleSheet.create({
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#101014',
  },
  authDot: { width: 6, height: 6, borderRadius: 3 },
  authText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1 },
  feedback: { borderLeftWidth: 3, borderRadius: 8, backgroundColor: '#131316', padding: 10, gap: 8 },
  feedbackShort: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  feedbackMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  whyBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber },
  whyBody: { gap: 6, borderTopWidth: 1, borderTopColor: '#26262c', paddingTop: 8 },
  whyText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  correctionText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.green },
  scenarioNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  srcBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSub },
  specCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: '#171307',
    padding: 10,
    gap: 5,
  },
  specEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },
  specText: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textPrimary },
  sheetBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetCard: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 14,
    maxHeight: '78%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 14,
    gap: 10,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  sheetClose: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.textSub, paddingHorizontal: 4 },
  srcRow: { gap: 2, borderLeftWidth: 2, borderLeftColor: '#2c2c33', paddingLeft: 10 },
  srcOrg: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSecondary },
  srcDoc: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  srcJur: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.amberLabel },
  srcNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  srcFoot: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, marginTop: 4 },
  mythCard: { borderRadius: 12, borderWidth: 1, borderColor: '#3a2f55', backgroundColor: '#14101d', padding: 14, gap: 10 },
  mythEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.purple },
  mythStatement: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  mythRow: { flexDirection: 'row', gap: 10 },
  mythBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#33333c',
    backgroundColor: '#1a1a1f',
    paddingVertical: 11,
  },
  mythBtnSel: { borderColor: '#6a5a92' },
  mythBtnRight: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0d1a11' },
  mythBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.5, color: colors.textSecondary },
  mythVerdict: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19 },
  mythNext: { alignSelf: 'flex-end', borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#17171c', paddingHorizontal: 14, paddingVertical: 8 },
  mythNextText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  dimRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dimLabel: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.4, color: colors.textSecondary },
  dimBlocks: { flexDirection: 'row', gap: 3 },
  dimBlock: { width: 16, height: 10, borderRadius: 2, backgroundColor: '#26262c' },
  dimBlockOn: { backgroundColor: colors.amber },
  dimVal: { width: 30, textAlign: 'right', fontFamily: fonts.mono, fontSize: 12, color: colors.amberLabel },
  findLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  sectionEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.amber },
});


/** Presentation shuffle for authored option arrays (learning pass 2026-08-31):
 *  every authored MCQ in this lab put the correct answer FIRST and rendered in
 *  authored order — the top chip was always right. Returns {item, idx} pairs
 *  (idx = ORIGINAL index) in a permutation that is stable per array reference
 *  for the app session, so re-renders never re-deal mid-question. Authored
 *  data untouched; correctness stays judged by original index/id. */
const SHUFFLE_CACHE = new WeakMap<readonly unknown[], number[]>();
export function stableShuffle<T>(arr: readonly T[]): { item: T; idx: number }[] {
  let perm = SHUFFLE_CACHE.get(arr);
  if (!perm) {
    perm = arr.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    SHUFFLE_CACHE.set(arr, perm);
  }
  return perm.map((i) => ({ item: arr[i], idx: i }));
}
