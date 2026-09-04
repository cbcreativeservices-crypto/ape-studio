/**
 * Audio Career Finder — all 42 families, grouped by the Academy field that
 * leads into them, with the user's rank when results exist. For people who
 * would rather browse than answer questions.
 */
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../theme/tokens';
import { FAMILIES } from '../../features/careerfinder/families';
import { CAREER_COUNT, familyFieldOf, familyMetaOf } from '../../features/careerfinder/careerIndex';
import { computeResult } from '../../features/careerfinder/scoring';
import { answeredCount, useCareerFinder } from '../../features/careerfinder/store';
import { Body, FinderShell, SectionLabel } from './kit';

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function CareerFamilyListScreen() {
  const navigation = useNavigation();
  const rec = useCareerFinder();
  const hasResults = rec.completed && answeredCount(rec) > 0;
  const rankOf = useMemo(() => {
    if (!hasResults) return new Map<string, number>();
    return new Map(computeResult(rec.responses, familyFieldOf).ranked.map((r) => [r.family.id, r.rank] as const));
  }, [hasResults, rec.responses]);

  const groups = useMemo(() => {
    const byField = new Map<string, typeof FAMILIES[number][]>();
    for (const f of FAMILIES) {
      const field = familyFieldOf(f.id) ?? 'Other';
      byField.set(field, [...(byField.get(field) ?? []), f]);
    }
    return [...byField.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  return (
    <FinderShell kicker={`AUDIO CAREER FINDER · ${FAMILIES.length} FAMILIES`} title="Every kind of paid audio work" onBack={() => navigation.goBack()}>
      <Body>{fmt(CAREER_COUNT)} titles, grouped into {FAMILIES.length} families, each listed under the Academy field that leads into it.{hasResults ? ' Your rank from the Career Finder is shown beside each one.' : ''}</Body>
      {groups.map(([field, fams]) => (
        <View key={field} style={{ gap: 6 }}>
          <SectionLabel tone="muted">{field.toUpperCase()}</SectionLabel>
          {fams.map((f) => {
            const meta = familyMetaOf(f.id);
            const rank = rankOf.get(f.id);
            return (
              <Pressable key={f.id} style={styles.row} onPress={() => navigation.navigate('CareerFamily', { id: f.id, from: 'browse' })} accessibilityRole="button" accessibilityLabel={`${f.name}, ${meta?.count ?? 0} titles${rank ? `, ranked ${rank} for you` : ''}`}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{f.name}</Text>
                  <Text style={styles.sub} numberOfLines={2}>{f.description}</Text>
                </View>
                <View style={styles.right}>
                  {rank ? <Text style={[styles.rank, rank <= 5 && { color: colors.green }]}>#{rank}</Text> : null}
                  <Text style={styles.count}>{meta?.count ?? 0}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </FinderShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 9, borderWidth: 1, borderColor: '#232323', backgroundColor: '#161616' },
  name: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 15.5, lineHeight: 20 },
  sub: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17 },
  right: { alignItems: 'flex-end', gap: 1, minWidth: 34 },
  rank: { color: colors.textSub, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6 },
  count: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 12 },
});
