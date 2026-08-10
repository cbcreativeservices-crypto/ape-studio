/**
 * TubeReferenceScreen — the Tube Reference library browse screen
 * (spec: docs/APE_TUBE_REFERENCE_SPEC_2026_08_09.md, owner decisions 2026-08-09).
 *
 * 30 owner-produced full-screen tube spec cards, grouped by family with a
 * search box (matches short name, alternates incl. CV numbers, base, role).
 * ALL MEMBER-GATED (owner): Academy entitlement unlocks the cards; everyone
 * else sees the list (so the value is visible) but rows prompt the paywall —
 * the same gate pattern as CalcLab's custom workflows.
 */
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { GlassButton } from '../../../components/GlassButton';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { TUBE_FAMILY_META, searchTubes, type TubeRef } from './tubeRefs';

export function TubeReferenceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { entitlement } = useEntitlement();
  const unlocked = entitlement === 'academy';
  const [query, setQuery] = useState('');

  const hits = useMemo(() => searchTubes(query), [query]);

  const openTube = (r: TubeRef) => {
    if (!unlocked) {
      Alert.alert(
        'Tube Reference — Academy',
        'The full-screen tube reference cards are a feature of Academy membership.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'See membership', onPress: () => navigation.navigate('Paywall') },
        ],
      );
      return;
    }
    navigation.navigate('TubeCard', { id: r.id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>TUBE REFERENCE</Text>
          <Text style={styles.subtitle}>30 tubes · structure, pins, ratings, substitutions</Text>
        </View>
      </View>

      {/* Search — matches short name, alternates (ECC83, GZ34, CV5220…), base, role. */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search — 12AX7, ECC83, GZ34, octal…"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search tubes"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!unlocked ? (
          <View style={styles.lockCard}>
            <Text style={styles.lockEyebrow}>ACADEMY MEMBERS</Text>
            <Text style={styles.lockTitle}>The Tube Reference Library</Text>
            <Text style={styles.lockBody}>
              Thirty full-screen reference cards — internal structure, pin layout and functions, key
              ratings, safe substitutions, and what to watch for — for the tubes behind most of
              recorded music. An Academy membership unlocks every card.
            </Text>
            <View style={{ marginTop: 6 }}>
              <GlassButton label="UPGRADE TO ACADEMY" tint="gold" height={48} fontSize={14} onPress={() => navigation.navigate('Paywall')} />
            </View>
          </View>
        ) : null}

        {TUBE_FAMILY_META.map((fam) => {
          const items = hits.filter((r) => r.family === fam.key);
          if (items.length === 0) return null;
          return (
            <View key={fam.key} style={{ gap: 8 }}>
              <Text style={styles.famTitle}>{fam.title}</Text>
              <Text style={styles.caption}>{fam.note}</Text>
              {items.map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.row, !unlocked && styles.rowLocked]}
                  onPress={() => openTube(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.short} — ${r.role}${unlocked ? '' : ' (Academy membership required)'}`}
                >
                  <Text style={styles.rowNum}>{String(r.num).padStart(2, '0')}</Text>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.rowName}>
                      {r.short}
                      {r.alt.length ? <Text style={styles.rowAlt}>   {r.alt.join(' · ')}</Text> : null}
                    </Text>
                    <Text style={styles.rowMeta}>{r.role}</Text>
                    <Text style={styles.rowBase}>{r.base}</Text>
                  </View>
                  <Text style={styles.rowChevron}>{unlocked ? '›' : 'ACADEMY'}</Text>
                </Pressable>
              ))}
            </View>
          );
        })}

        {hits.length === 0 ? (
          <Text style={styles.caption}>No tube matches “{query.trim()}” — try the short name (12AX7), an equivalent (ECC83), or a family (rectifier).</Text>
        ) : null}

        <Text style={styles.footNote}>
          Ratings and pinouts are transcribed onto each card from published data sheets — always
          confirm against your amplifier’s documentation before working on live equipment.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#3a3d4a',
    backgroundColor: '#17181d',
    paddingHorizontal: 12,
  },
  search: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, color: colors.textPrimary, paddingVertical: 9 },
  clear: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub },

  scroll: { padding: 16, paddingTop: 10, paddingBottom: 34, gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  famTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowLocked: { opacity: 0.62 },
  rowNum: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, width: 24, textAlign: 'center' },
  rowName: { fontFamily: fonts.oswaldMedium, fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary },
  rowAlt: { fontFamily: fonts.barlowMedium, fontSize: 12, letterSpacing: 0, color: colors.cyanBright },
  rowMeta: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  rowBase: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
  rowChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },

  lockCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.45)',
    backgroundColor: '#0b1420',
    padding: 16,
    gap: 8,
  },
  lockEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: '#7fd4ff' },
  lockTitle: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textPrimary },
  lockBody: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20.5, color: colors.textSecondary },

  footNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textMuted, marginTop: 6 },
});
