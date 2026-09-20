/**
 * LabChecklist — "here is what is left, and here is how to get there."
 *
 * One component, two homes (owner 2026-09-20):
 *   · the end-of-lab completion screen
 *   · the LAB REQUIREMENTS sheet on Enrollments
 *
 * ── THE RULE IT SERVES ──────────────────────────────────────────────────────
 * Navigation through a lab is never blocked, so a learner can arrive anywhere
 * having skipped work. That freedom only stays honest if something, somewhere,
 * states plainly what is still outstanding — otherwise "you can move on"
 * quietly becomes "you are finished". This is that something.
 *
 * So the tone is a checklist, not a scold: every row is an OPEN DOOR with a
 * tap target, never a lock. A learner reading this should feel oriented, not
 * told off.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LedMeter, segmentsForPct } from './LedMeter';
import type { LabRequirementRow } from '../features/lab/labRequirementList';
import { requirementTally } from '../features/lab/labRequirementList';
import { colors, fonts } from '../theme/tokens';

export function LabChecklistSummary({ rows, label }: { rows: readonly LabRequirementRow[]; label?: string }) {
  const { done, total, pct } = requirementTally(rows);
  const left = total - done;
  return (
    <View style={s.summary}>
      <View style={s.summaryTop}>
        <Text style={s.summaryCount}>
          {done} of {total} {label ?? 'labs'} complete
        </Text>
        <Text style={[s.summaryPct, left === 0 && s.summaryPctDone]}>{pct}%</Text>
      </View>
      <LedMeter filled={segmentsForPct(pct)} fullWidth midi />
      {/* Say what remains in plain words. "3 left" beats a bare percentage,
          which a learner has to do arithmetic on to act. */}
      <Text style={s.summaryNote}>
        {left === 0
          ? 'Every required lab is complete.'
          : `${left} still to finish${label ? '' : ' before this counts toward your credit'}.`}
      </Text>
    </View>
  );
}

export function LabChecklist({
  rows,
  onOpen,
}: {
  rows: readonly LabRequirementRow[];
  /** Tapping a row opens that lab. Omit to render the list read-only. */
  onOpen?: (row: LabRequirementRow) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <View style={s.list}>
      {rows.map((r) => {
        const openable = !!onOpen && !!r.route;
        // Units cleared, but only where the lab actually tracks them and is
        // part-way through. "0 of 12" on an untouched lab is noise; the empty
        // checkbox already says it.
        const partial = !r.done && r.total > 0 && r.cleared > 0 ? `${r.cleared} of ${r.total}` : null;
        const Row = openable ? Pressable : View;
        return (
          <Row
            key={r.key}
            {...(openable
              ? {
                  onPress: () => onOpen(r),
                  accessibilityRole: 'button' as const,
                  accessibilityLabel: `${r.name}. ${
                    !r.tracked
                      ? 'Required. Progress is not recorded for this lab yet.'
                      : r.done
                        ? 'Complete.'
                        : partial
                          ? `${partial} sections done.`
                          : 'Not started.'
                  } Opens the lab.`,
                }
              : {
                  accessible: true,
                  accessibilityLabel: `${r.name}. ${r.tracked ? (r.done ? 'Complete.' : 'Not started.') : 'Required.'}`,
                })}
            style={s.row}
          >
            {/* ⛔ NOT COLOUR ALONE. Tick, empty box and dash differ in SHAPE,
                so state survives colour blindness and a dimmed screen.
                ⛔ AND NO EMPTY BOX ON AN UNTRACKED LAB: member labs record no
                progress, so a checkbox there would promise a tick the app can
                never give. A dash says "required, not a task I can score". */}
            <Text style={[s.box, r.done && s.boxDone, !r.tracked && s.boxUntracked]}>
              {!r.tracked ? '–' : r.done ? '✓' : '○'}
            </Text>
            <View style={s.rowBody}>
              <Text style={[s.rowName, r.done && s.rowNameDone]} numberOfLines={2}>
                {r.name}
              </Text>
              {r.why ? <Text style={s.rowWhy}>{r.why}</Text> : null}
            </View>
            {partial ? <Text style={s.rowPartial}>{partial}</Text> : null}
            {openable ? <Text style={s.rowGo}>›</Text> : null}
          </Row>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  summary: { gap: 7 },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  summaryCount: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.4, color: colors.textPrimary },
  summaryPct: { fontFamily: fonts.oswaldBold, fontSize: 18, color: colors.amber },
  summaryPctDone: { color: '#37e05f' },
  summaryNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSubAlt },

  list: { borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#141416',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#232327',
  },
  box: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, width: 18, textAlign: 'center', color: '#55565e' },
  boxDone: { color: '#37e05f' },
  boxUntracked: { color: '#3a3b42' },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSecondary },
  rowNameDone: { color: colors.textSubAlt },
  rowWhy: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSubAlt },
  rowPartial: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.4, color: colors.amber },
  rowGo: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber },
});
