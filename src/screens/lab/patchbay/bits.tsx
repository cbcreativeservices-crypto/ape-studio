/**
 * Patchbay lab — small shared page bits. ALL COPY IN THIS LAB IS NEW
 * (RATIFIED by the owner 2026-09-10; copy sheet: docs/APE_PATCHBAY_LAB_COPY_2026_09_10.md).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useMarkWhen } from '../tuning/components/primitives';
import type { PageCtx } from '../kit/PagedLab';
import type { BreakSide, NormalConfig, PairState } from './engine/patchbay';

/** The lab's central mantra (spec, final section) — repeated on purpose. */
export const MANTRA =
  'Top is the source. Bottom is the destination. A normal is the path that exists when you do nothing. Patching changes that path.';

export function MantraCard() {
  return (
    <View style={styles.mantra}>
      <Text style={styles.mantraEyebrow}>THE PATCHBAY MANTRA</Text>
      <Text style={styles.mantraText}>{MANTRA}</Text>
    </View>
  );
}

/** Local plug state for one interactive pair. */
export function useStationState(config: NormalConfig, breakSide?: BreakSide, initial?: { top?: boolean; bottom?: boolean }) {
  const [topPlugged, setTop] = useState(!!initial?.top);
  const [bottomPlugged, setBottom] = useState(!!initial?.bottom);
  const state: PairState = { config, breakSide, topPlugged, bottomPlugged };
  const toggle = (jack: 'top' | 'bottom') => (jack === 'top' ? setTop((v) => !v) : setBottom((v) => !v));
  return { state, toggle };
}

/** Sticky exploration goals: each goal latches once its predicate has been
 *  true; when ALL have latched, the page marks itself done. Returns the
 *  latched flags for the checklist chips. */
export function useVisitGoals(ctx: PageCtx, goals: { label: string; hit: boolean }[]): boolean[] {
  const seen = useRef<boolean[]>(goals.map(() => false));
  goals.forEach((g, i) => {
    if (g.hit) seen.current[i] = true;
  });
  const all = seen.current.every(Boolean);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return [...seen.current];
}

/** The latched-goal checklist chips under an interactive station. */
export function GoalChips({ goals, latched }: { goals: { label: string }[]; latched: boolean[] }) {
  return (
    <View style={styles.chips} accessibilityRole="list">
      {goals.map((g, i) => (
        <View key={g.label} style={[styles.chip, latched[i] && styles.chipDone]} accessible accessibilityLabel={`${g.label}: ${latched[i] ? 'done' : 'not yet'}`}>
          <Text style={[styles.chipText, latched[i] && { color: colors.green }]}>
            {latched[i] ? '✓ ' : '○ '}
            {g.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mantra: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.06)', padding: 12, gap: 5 },
  mantraEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  mantraText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 9, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  chipDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
});
