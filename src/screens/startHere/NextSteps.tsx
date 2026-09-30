/**
 * NextSteps — Start Here's hand-off (owner plan: "You've got the starting
 * points. Choose what you're curious about next.").
 *
 * Grouped by "I want to understand…", each destination a real route. Access
 * is SAID, never discovered: FREE opens for everyone; a members-only lab says
 * "MEMBERS · FREE LOOK INSIDE" and lands in that lab's own free preview (the
 * grayed lab + upgrade sheet, withMembershipPreview) — context, never a dead
 * end; the SPL tutorial says MEMBERS and opens its page, which explains what
 * it covers and how to unlock it.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { NEXT_HANDOFF, NEXT_STEPS, accessTag, type NextStep } from '../../features/startHere/startHereContent';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';

export function NextSteps({
  onRoute,
  onGlossary,
}: {
  onRoute: (route: string, params?: Record<string, unknown>) => void;
  onGlossary: () => void;
}) {
  const open = (s: NextStep) => (s.to.kind === 'glossary' ? onGlossary() : onRoute(s.to.route, s.to.params));
  const best = NEXT_STEPS.flatMap((g) => g.steps).find((s) => s.best);
  // Members see no FREE / MEMBERS access tags (owner 2026-09-29: no
  // membership marketing to people who already pay) — everything opens.
  const { isMember } = useEntitlement();
  const tag = (s: NextStep) => {
    const a = isMember ? '' : accessTag(s.access);
    return s.mic ? (a ? `${a} · USES YOUR MIC` : 'USES YOUR MIC') : a;
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.handoff}>{NEXT_HANDOFF}</Text>
      {best ? (
        // ONE clear first move before the menu (cognitive review 2026-09-29):
        // eight cards at once is the overwhelm this path exists to avoid.
        <Pressable
          onPress={() => open(best)}
          style={[styles.row, styles.bestRow]}
          accessibilityRole="button"
          accessibilityLabel={`Best next step: ${best.title}. ${best.blurb}${tag(best) ? ` ${tag(best)}.` : ''} Opens it.`}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.bestEyebrow}>BEST NEXT STEP</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{best.title}</Text>
              {tag(best) ? <Text style={[styles.tag, styles.tagFree]}>{tag(best)}</Text> : null}
            </View>
            <Text style={styles.blurb}>{best.blurb}</Text>
          </View>
          <Text style={styles.go}>›</Text>
        </Pressable>
      ) : null}
      <Text style={styles.or}>Or follow your curiosity:</Text>
      {NEXT_STEPS.map((g) => (
        <View key={g.want} style={styles.group}>
          <Text style={styles.want}>I WANT TO UNDERSTAND… {g.want.toUpperCase()}</Text>
          {g.steps.filter((s) => !s.best).map((s) => (
            <Pressable
              key={s.id}
              onPress={() => open(s)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${s.title}. ${s.blurb} ${tag(s)}. Opens it.`}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{s.title}</Text>
                  {tag(s) ? <Text style={[styles.tag, s.access === 'free' ? styles.tagFree : styles.tagMember]}>{tag(s)}</Text> : null}
                </View>
                <Text style={styles.blurb}>{s.blurb}</Text>
              </View>
              <Text style={styles.go}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 4, marginBottom: 6 },
  handoff: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 16.5, lineHeight: 23 },
  group: { gap: 6 },
  want: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    backgroundColor: '#141416',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bestRow: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#112016', minHeight: 72 },
  bestEyebrow: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3 },
  or: { color: colors.textSub, fontFamily: fonts.barlowMedium, fontSize: 14, marginTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15.5 },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' },
  tagFree: { color: colors.green, borderColor: 'rgba(55,224,95,.5)' },
  tagMember: { color: colors.programPurple, borderColor: 'rgba(196,162,255,.5)' },
  blurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  go: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 20 },
});
