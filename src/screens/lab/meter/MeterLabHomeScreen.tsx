/**
 * MeterLabHomeScreen — Visual Audio Analysis Lab landing (owner spec
 * 2026-07-29): teaches how to READ the displays; the measurement tools
 * measure — this lab interprets. 11 module cards + a pointer to the tools.
 */
import { useState } from 'react';
import { useLabClearedUnits } from '../../../features/lab/labCompletion';
import { LabHeader } from '../kit/LabNavBar';
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
import { LabEndLink, LabEndScreen } from '../kit/LabEndScreen';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';

export function MeterLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lessonOpen, setLessonOpen] = useState(false);
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<string | null>(null);
  const clearedUnits = useLabClearedUnits('af_visual_analysis');
  /**
   * WHAT'S LEFT (owner 2026-09-29: "every lab ends with a 'what's left'
   * screen"). The module host now has PREV / NEXT and a FINISH on Module 11
   * that opens the same end screen (owner, build 32); this home keeps its own
   * SEE WHAT'S LEFT link too, which swaps LabEndScreen in for the list: modules
   * not yet credited, a jump to each, PRACTISE AGAIN from Module 1 (clears
   * nothing) and DONE.
   */
  const [ending, setEnding] = useState(false);
  const open = (id: (typeof METER_MODULES)[number]['id']) => {
    setEnding(false);
    navigation.navigate('MeterModule', { id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared lab header (kit/LabNavBar): ‹ LEAVES THE LAB, the same in every lab. */}
      <LabHeader
        title="VISUAL AUDIO ANALYSIS LAB"
        subtitle="Learn to READ the meters — not just open them"
        right={<AccuracyNote compact detail="These displays are driven by built-in teaching signals, not your microphone — read them to learn what each meter shows. For accurate levels use a calibrated SPL meter or measurement mic." />}
      />
      {ending ? (
        <LabEndScreen
          labTitle="Visual Audio Analysis Lab"
          units={METER_MODULES.map((m) => ({ id: m.id, label: m.title }))}
          cleared={clearedUnits}
          mode="credit"
          onJump={(id) => open(METER_MODULES.find((m) => m.id === id)?.id ?? METER_MODULES[0].id)}
          onPracticeAgain={() => open(METER_MODULES[0].id)}
          onDone={() => navigation.goBack()}
          bottomInset
        />
      ) : (
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn]}>
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
            done={clearedUnits.has(m.id)}
            onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
            onOpen={() => navigation.navigate('MeterModule', { id: m.id })}
          />
        ))}
        <LabEndLink label="SEE WHAT’S LEFT ›" onPress={() => setEnding(true)} />
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
      )}
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('meter')} onClose={() => setLessonOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
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
