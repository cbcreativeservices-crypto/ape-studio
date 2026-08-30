/**
 * MeterLabHomeScreen — Visual Audio Analysis Lab landing (owner spec
 * 2026-07-29): teaches how to READ the displays; the measurement tools
 * measure — this lab interprets. 11 module cards + a pointer to the tools.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { METER_MODULES } from './modules/registry';

export function MeterLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lessonOpen, setLessonOpen] = useState(false);
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>VISUAL AUDIO ANALYSIS LAB</Text>
          <Text style={styles.subtitle}>Learn to READ the meters — not just open them</Text>
        </View>
        <AccuracyNote compact detail="These meters run on your phone’s UNCALIBRATED microphone — read them as relative, for learning. For accurate levels use a calibrated SPL meter or measurement mic." />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.body}>
          Every professional display — waveform, peak, VU, LUFS, spectrum, spectrogram, waterfall,
          phase, scope — tells a story to the engineer who can read it. The Academy’s measurement
          tools MEASURE; this lab teaches you to INTERPRET what they show.
        </Text>
        {METER_MODULES.map((m) => (
          <ModuleAccordionRow
            key={m.id}
            num={m.num}
            name={m.title}
            blurb={m.blurb}
            expanded={openId === m.id}
            onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
            onOpen={() => navigation.navigate('MeterModule', { id: m.id })}
          />
        ))}
        <Text style={styles.sectionTitle}>USE WHAT YOU LEARNED</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pressable accessibilityRole="button" style={styles.toolChip} onPress={() => navigation.navigate('ToolsHub' as never)}>
            <Text style={styles.toolText}>OPEN THE MEASUREMENT TOOLS ›</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.toolChip} onPress={() => setLessonOpen(true)}>
            <Text style={styles.toolText}>ⓘ GUIDED LESSON</Text>
          </Pressable>
        </View>
        <Text style={styles.caption}>
          The Spectrum, Spectrogram, Waveform, RT60 and SPL tools show your real signals — come
          back here whenever a display doesn’t make sense yet.
        </Text>
      </ScrollView>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('meter')} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 10 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber, width: 26, textAlign: 'center' },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  futureNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSub, borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014', padding: 10 },
  toolChip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  toolText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
});
