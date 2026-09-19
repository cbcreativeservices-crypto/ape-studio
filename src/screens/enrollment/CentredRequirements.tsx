/**
 * CentredRequirements — what sits under the Enrollments deck when a credential
 * card is the one centred (owner 2026-09-19).
 *
 * ⛔ IT OPENS COLLAPSED, EVERY TIME. Owner: *"always default to showing topics
 * below collapsed instead of default expanded."* The screen this replaced
 * opened as a wall of expanded containers, which is the reason the deck exists
 * at all — so re-expanding by default here would hand the problem straight
 * back. The summary line above the disclosure carries the numbers, so a member
 * who never opens it still knows where they stand.
 *
 * State is deliberately LOCAL and keyed to the bundle: swiping to another card
 * and back re-collapses, because "open" was a decision about THAT credential,
 * not a preference about the screen.
 *
 * Presentation only — removal, navigation and progress are the screen's.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { colors, fonts } from '../../theme/tokens';
import type { EnrolledBundle } from '../../features/enrollment/enrolledBundlesStore';

const CERT_BLUE = '#2f9bff';
const PROGRAM_PURPLE = '#b06cff';

export function CentredRequirements({
  bundle,
  nameFor,
  pctFor,
  onRemove,
  onOpenAward,
}: {
  bundle: EnrolledBundle;
  nameFor: (gs: number) => string;
  pctFor: (gs: number) => number;
  onRemove: () => void;
  onOpenAward: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Re-collapse when the deck moves to a different credential.
  useEffect(() => {
    setOpen(false);
  }, [bundle.key]);

  const accent = bundle.kind === 'program' ? PROGRAM_PURPLE : bundle.kind === 'cert' ? CERT_BLUE : colors.amber;
  const done = bundle.topics.filter((gs) => pctFor(gs) >= 100).length;
  const pct = bundle.topics.length
    ? Math.round(bundle.topics.reduce((sum, gs) => sum + pctFor(gs), 0) / bundle.topics.length)
    : 0;

  return (
    <View style={[s.wrap, { borderColor: `${accent}55` }]}>
      <View style={s.headRow}>
        <Text style={[s.head, { color: accent }]}>REQUIREMENTS</Text>
        <View style={{ flex: 1 }} />
        <Text style={s.summary}>
          {done} of {bundle.topics.length} complete
        </Text>
      </View>

      <View style={s.meterRow}>
        <LedMeter filled={segmentsForPct(pct)} segWidth={5} />
        <Text style={s.pct}>{pct}%</Text>
      </View>

      {/* The disclosure. Closed on arrival, always. */}
      <Pressable
        style={s.toggle}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={
          open
            ? `Hide the ${bundle.topics.length} topics of ${bundle.name}`
            : `Show the ${bundle.topics.length} topics of ${bundle.name}`
        }
      >
        <Text style={[s.toggleTri, { color: accent }]}>{open ? '▾' : '▸'}</Text>
        <Text style={s.toggleText}>
          {open ? 'HIDE TOPICS' : `SHOW ${bundle.topics.length} TOPIC${bundle.topics.length === 1 ? '' : 'S'}`}
        </Text>
      </Pressable>

      {open ? (
        <View style={s.list}>
          {bundle.topics.map((gs) => {
            const p = pctFor(gs);
            return (
              <View key={gs} style={s.row}>
                <Text style={[s.rowDot, p >= 100 && { color: colors.green }]}>{p >= 100 ? '✓' : '•'}</Text>
                <Text style={s.rowName} numberOfLines={1}>
                  {nameFor(gs)}
                </Text>
                <Text style={[s.rowPct, p >= 100 && { color: colors.green }]}>{p}%</Text>
              </View>
            );
          })}
        </View>
      ) : null}

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
        <Pressable
          style={s.removeBtn}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${bundle.name} and its topics from the list`}
        >
          <Text style={s.removeText}>REMOVE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 14, borderWidth: 1, borderRadius: 12, backgroundColor: '#101013', padding: 12, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6 },
  summary: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSecondary },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pct: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  toggleTri: { fontFamily: fonts.oswaldMedium, fontSize: 14 },
  toggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.3, color: colors.textSecondary },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7, borderTopWidth: 1, borderTopColor: colors.hairline },
  rowDot: { fontFamily: fonts.oswaldMedium, fontSize: 13, color: colors.textSub, width: 14, textAlign: 'center' },
  rowName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13.5, color: colors.textPrimary },
  rowPct: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSub },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  awardBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  awardText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.amber },
  removeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  removeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
});
