/**
 * Weekly concept card — opened from a push tap (or by concept_id).
 * Shows the misconception first, then the correction. Matches Settings modal chrome.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import {
  fetchConceptById,
  type WeeklyConceptPayload,
} from '../../features/notifications/weeklyConcept';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyConcept'>;

export function WeeklyConceptScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [card, setCard] = useState<WeeklyConceptPayload | null>(fromRoute(route.params));
  const [loading, setLoading] = useState(!hasBody(fromRoute(route.params)) && !!route.params.concept_id);

  useEffect(() => {
    const initial = fromRoute(route.params);
    if (hasBody(initial) || !route.params.concept_id) return;
    let cancelled = false;
    void fetchConceptById(route.params.concept_id).then((row) => {
      if (cancelled) return;
      setCard(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [route.params]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>WEEKLY CONCEPT</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.amber} />
        </View>
      ) : !card ? (
        <View style={styles.center}>
          <Text style={styles.empty}>This concept is not available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.eyebrow}>
            {card.category}
            {card.subdomain ? `  ·  ${card.subdomain}` : ''}
          </Text>
          <Text style={styles.title}>{card.concept}</Text>

          {card.what_it_is ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>WHAT IT IS</Text>
              <Text style={styles.body}>{card.what_it_is}</Text>
            </View>
          ) : null}

          {card.misconception ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>THE MISCONCEPTION</Text>
              <Text style={styles.body}>{card.misconception}</Text>
            </View>
          ) : null}

          {card.correction ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>THE CORRECTION</Text>
              <Text style={styles.body}>{card.correction}</Text>
            </View>
          ) : null}

          {card.why_it_matters ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>WHY IT MATTERS</Text>
              <Text style={styles.body}>{card.why_it_matters}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function fromRoute(params: RootStackParamList['WeeklyConcept']): WeeklyConceptPayload | null {
  if (!params?.concept_id) return null;
  return {
    concept_id: params.concept_id,
    category: params.category ?? '',
    subdomain: params.subdomain ?? '',
    concept: params.concept ?? '',
    what_it_is: params.what_it_is ?? '',
    misconception: params.misconception ?? '',
    correction: params.correction ?? '',
    why_it_matters: params.why_it_matters ?? '',
    confidence: params.confidence ?? '',
  };
}

function hasBody(card: WeeklyConceptPayload | null): boolean {
  if (!card) return false;
  return !!(card.concept && (card.misconception || card.correction || card.what_it_is));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amberLabel },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textPrimary, lineHeight: 28 },
  block: { gap: 6 },
  blockLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amberLabel },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
