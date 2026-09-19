/**
 * CentredRequirements — the HEADER above a selected credential's requirement
 * list: how far through it the member is, and the two actions that belong to
 * the credential itself.
 *
 * ⛔ IT DOES NOT RENDER THE REQUIREMENTS. It used to own a private list behind
 * a "SHOW n REQUIREMENTS" disclosure; the owner removed both (2026-09-19):
 * *"do not add 'show 30 requirements' — they should already show."* The rows
 * are now the screen's own topic rows, rendered by EnrollmentScreen's
 * `renderTopicRow` directly beneath this header, so a requirement looks and
 * behaves exactly like the same topic under ALL TOPICS — one row component,
 * one collapse key per topic, one progress value everywhere it appears.
 *
 * What stays here is the part that is about the CREDENTIAL and not about any
 * one topic: the "n of m complete" summary, the meter across the whole
 * requirement set, the Final Exam link, and REMOVE.
 *
 * Presentation only — removal, navigation and progress are the screen's.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';
import type { EnrolledBundle } from '../../features/enrollment/enrolledBundlesStore';

const CERT_BLUE = '#2f9bff';
const PROGRAM_PURPLE = '#b06cff';

export function CentredRequirements({
  bundle,
  derived = false,
  coreGs = [],
  pctFor,
  onRemove,
  onOpenAward,
}: {
  bundle: EnrolledBundle;
  /** True when this credential is one the member QUALIFIES for rather than
   *  one they enrolled in. It has no enrollment to remove. */
  derived?: boolean;
  /** The core topics every credential shares, counted into the totals here
   *  and listed first by the caller. */
  coreGs?: number[];
  pctFor: (gs: number) => number;
  onRemove: () => void;
  onOpenAward: () => void;
}) {
  const accent = bundle.kind === 'program' ? PROGRAM_PURPLE : bundle.kind === 'cert' ? CERT_BLUE : colors.amber;
  // Everything the credential actually requires — core plus its own topics —
  // because a member reading "3 of 3 complete" while four pre-requisites are
  // outstanding has been told something false.
  const allGs = [...coreGs, ...bundle.topics];
  const done = allGs.filter((gs) => pctFor(gs) >= 100).length;
  const pct = allGs.length ? Math.round(allGs.reduce((sum, gs) => sum + pctFor(gs), 0) / allGs.length) : 0;

  return (
    <View style={[s.wrap, { borderColor: `${accent}55` }]}>
      <View style={s.headRow}>
        <Text style={[s.head, { color: accent }]}>REQUIREMENTS</Text>
        <View style={{ flex: 1 }} />
        <Text style={s.summary}>
          {done} of {allGs.length} complete
        </Text>
      </View>

      {/* Full width like the selection head above and the rows below — a
          stub meter between two full ones reads as unfinished. */}
      <View style={s.meterRow}>
        <View style={{ flex: 1 }}>
          <LedMeter filled={segmentsForPct(pct)} fullWidth />
        </View>
        <Text style={s.pct}>{pct}%</Text>
      </View>

      <View style={s.footRow}>
        {bundle.kind !== 'subject' ? (
          <Pressable
            style={s.awardBtn}
            onPress={onOpenAward}
            accessibilityRole="button"
            accessibilityLabel={`Open the ${bundle.name} award page to see its Final Exam`}
          >
            <Text style={s.awardText}>FINAL EXAM · ON THE AWARD PAGE →</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {/* Nothing to remove when the member never enrolled — they simply
            happen to hold every topic. A REMOVE here would do nothing. */}
        {derived ? null : (
          <Pressable
            style={s.removeBtn}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${bundle.name} and its topics from the list`}
          >
            <Text style={s.removeText}>REMOVE</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 4, borderWidth: 1, borderRadius: 12, backgroundColor: '#101013', padding: 12, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6 },
  summary: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSecondary },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  awardBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  awardText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.amber },
  removeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  removeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
});
