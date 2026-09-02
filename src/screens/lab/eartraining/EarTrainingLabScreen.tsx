/**
 * EarTrainingLabScreen — the Ear Training Lab landing (spec §3): the module
 * list in the lab hub-home accordion style, with level/accuracy chips read
 * from ape:ear:v1. Modules land in waves; only what is built is listed.
 * All strings NEW COPY — owner review.
 */
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { EAR_MODULES } from '../../../features/ear/modules/registry';
import {
  loadEarProgress, recentAccuracy, type EarProgressState,
} from '../../../features/ear/earProgress';

export function EarTrainingLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [progress, setProgress] = useState<EarProgressState | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadEarProgress().then((s) => {
        if (alive) setProgress(s);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>EAR TRAINING LAB</Text>
          <Text style={styles.subtitle}>Hear a change · then see it measured</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.body}>
          Every drill here renders real signals, plays them, and then shows you the same buffers
          on the analyzers — the habit this lab builds is hearing something and knowing what the
          measurement will say before you look. Ten focused trials beat an hour of grinding:
          levels adjust to your last twenty answers.
        </Text>
        <Text style={styles.noteLine}>
          🎧 Headphones recommended throughout — modules note when they truly matter.
        </Text>
        <Text style={styles.sectionTitle}>MODULES</Text>
        {EAR_MODULES.map((m) => {
          const p = progress?.modules[m.id];
          const acc = p ? recentAccuracy(p) : null;
          const stat = p
            ? `L${Math.min(p.level, m.levels)}${acc != null ? ` · ${Math.round(acc * 100)}%` : ''}`
            : null;
          return (
            <ModuleAccordionRow
              key={m.id}
              num={m.num}
              name={stat ? `${m.title}   ·  ${stat}` : m.title}
              blurb={`${m.blurb}\n${m.phones === 'required' ? '🎧 Headphones REQUIRED. ' : m.phones === 'recommended' ? '🎧 Headphones recommended. ' : ''}${m.playbackNote}`}
              expanded={openId === m.id}
              done={(p?.mastered ?? 0) >= m.levels}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
              onOpen={() => navigation.navigate('EarModule', { id: m.id })}
            />
          );
        })}
        <Text style={styles.coming}>
          More modules are on the bench — defects, stereo image, delay, reverb, pitch,
          polarity, comb filtering.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: colors.textPrimary, fontSize: 30, lineHeight: 32, paddingHorizontal: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1.2 },
  subtitle: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  scroll: { paddingHorizontal: 16, gap: 10 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  noteLine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 2, marginTop: 8 },
  coming: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
