/**
 * DigitalLabHomeScreen — the Digital Audio Sampling & Conversion Lab's OWN
 * home (owner spec 2026-07-29: a standalone laboratory, not an Ear-Lab
 * lesson). Layout per spec: animated signal path → eight module cards →
 * secondary tools → learning section.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { useState } from 'react';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { DIGITAL_MODULES, type DigitalModuleId } from './modules/registry';

const PATH = ['SOUND', 'ANALOG', 'SAMPLES', 'NUMBERS', 'PROCESSING', 'RECONSTRUCTION', 'SOUND'];

/** The static signal-path labels — the lab's chain in one row. */
function SignalPathBanner() {
  return (
    <View style={styles.pathRow}>
      {PATH.map((p, i) => (
        <View key={`${p}${i}`} style={styles.pathStep}>
          <Text style={styles.pathText}>{p}</Text>
          {i < PATH.length - 1 ? <Text style={styles.pathArrow}>›</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function DigitalLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const open = (id: DigitalModuleId) => navigation.navigate('DigitalModule', { id });
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<DigitalModuleId | null>(null);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>DIGITAL AUDIO SAMPLING & CONVERSION LAB</Text>
          <Text style={styles.subtitle}>Explore how analog sound becomes digital data — and how digital data becomes sound again.</Text>
        </View>
        <AccuracyNote compact />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SignalPathBanner />
        <Text style={styles.body}>
          Follow the complete chain — acoustic sound → microphone → analog voltage → anti-aliasing
          filter → sampling → quantization → binary data → processing → reconstruction → sound —
          in eight connected modules. Take them in order, or jump straight to what you need.
        </Text>
        <Text style={styles.sectionTitle}>THE EIGHT MODULES</Text>
        {DIGITAL_MODULES.map((m, i) => (
          <ModuleAccordionRow
            key={m.id}
            num={i + 1}
            name={m.title}
            blurb={m.blurb}
            expanded={openId === m.id}
            onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
            onOpen={() => open(m.id)}
          />
        ))}
        <Text style={styles.sectionTitle}>SECONDARY TOOLS</Text>
        <View style={styles.toolWrap}>
          <ToolChip label="DATA-RATE CALCULATOR" onPress={() => navigation.navigate('CalcWorkspace', { id: 'filesize' })} />
          <ToolChip label="BUFFER LATENCY CALC" onPress={() => navigation.navigate('CalcWorkspace', { id: 'latency' })} />
          <ToolChip label="FFT RESOLUTION CALC" onPress={() => navigation.navigate('CalcWorkspace', { id: 'fft' })} />
          <ToolChip label="SAMPLE INSPECTOR" onPress={() => open('binary')} />
          <ToolChip label="ALIASING EXPLORER" onPress={() => open('sampling')} />
          <ToolChip label="DITHER COMPARATOR" onPress={() => open('quant')} />
          <ToolChip label="TRUE-PEAK EXPLORER" onPress={() => open('dac')} />
          <ToolChip label="CLOCK & JITTER" onPress={() => open('errors')} />
        </View>
        <Text style={styles.sectionTitle}>LEARNING</Text>
        <View style={styles.toolWrap}>
          <ToolChip label="ⓘ GUIDED LESSON" onPress={() => setLessonOpen(true)} />
          <ToolChip label="MYTH vs REALITY" onPress={() => open('errors')} />
          <ToolChip label="KNOWLEDGE CHECKS" onPress={() => open('errors')} />
        </View>
        <Text style={styles.caption}>
          Every module carries its own checks; the misconceptions panel lives in Module 8 and is
          the heart of this lab — digital audio is NOT made of stair steps.
        </Text>
      </ScrollView>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('digital')} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

function ToolChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.toolChip} onPress={onPress}>
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  cardTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber, width: 24, textAlign: 'center' },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  toolWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolChip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  toolText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  pathRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  pathStep: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pathText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSecondary },
  pathArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
});
