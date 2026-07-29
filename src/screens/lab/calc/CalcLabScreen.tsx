/**
 * CalcLabScreen — the Audio Calculator Laboratory landing (owner spec
 * 2026-07-29). ONE unified lab: 25 launch workspaces grouped by section, the
 * Calculation Chain banner, and the post-launch tiers listed honestly as
 * IN DEVELOPMENT ("coming soon") — never presented as available.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { COMING_SOON, SECTION_META, WORKSPACES } from './registry';
import { useChainValue } from './chainStore';

export function CalcLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const chain = useChainValue();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>AUDIO CALCULATOR LABORATORY</Text>
          <Text style={styles.subtitle}>Calculate · understand · chain results between tools</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.body}>
          Every calculator here shows the result AND the reasoning: the formula, the worked
          steps, why it matters on the job, and the classic mistakes. Results can be SENT into
          another calculator — sensitivity → voltage → gain → headroom — like a real design chain.
        </Text>
        {chain ? (
          <Text style={styles.chainBanner}>
            ⛓ CHAIN ACTIVE: {chain.label} from {chain.fromWorkspace} — open any calculator with a
            matching input and tap USE.
          </Text>
        ) : null}
        {SECTION_META.map((sec) => {
          const items = WORKSPACES.filter((w) => w.section === sec.id);
          if (items.length === 0) return null;
          return (
            <View key={sec.id} style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.caption}>{sec.note}</Text>
              {items.map((w) => (
                <Pressable key={w.id} style={styles.card} onPress={() => navigation.navigate('CalcWorkspace', { id: w.id })}>
                  <Text style={styles.cardName}>{w.name}</Text>
                  <Text style={styles.caption}>{w.tagline}</Text>
                </Pressable>
              ))}
            </View>
          );
        })}
        {COMING_SOON.map((group) => (
          <View key={group.title} style={{ gap: 6 }}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <Text style={styles.caption}>
              On the roadmap — listed so you can see where the laboratory is headed. Not yet
              functional.
            </Text>
            <View style={styles.soonWrap}>
              {group.items.map((it) => (
                <View key={it} style={styles.soonChip}>
                  <Text style={styles.soonText}>{it}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
  scroll: { padding: 16, paddingBottom: 34, gap: 14 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 3 },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  chainBanner: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },
  soonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  soonChip: { borderRadius: 7, borderWidth: 1, borderColor: '#232329', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#101014' },
  soonText: { fontFamily: fonts.barlowMedium, fontSize: 11.5, color: '#5c5d66' },
});
