/**
 * WaveLabHomeScreen — Wave Physics Laboratory landing (v4 §9): the 15 modules
 * (each a preset of the engine), then the Room Builder LAST — it combines every
 * concept the other modules isolate (owner 2026-08-01).
 */
import { useState } from 'react';
import { useLabClearedUnits } from '../../../features/lab/labCompletion';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { GuidedLessonSheet, getLabLesson } from '../../../features/lab/guidedLessons';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { WAVE_MODULES } from './modules/registry';

export function WaveLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lessonOpen, setLessonOpen] = useState(false);
  const builder = WAVE_MODULES.find((m) => m.id === 'builder');
  const modules = WAVE_MODULES.filter((m) => m.id !== 'builder');
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<string | null>(null);
  const clearedUnits = useLabClearedUnits('af_wave_physics');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>WAVE PHYSICS LABORATORY</Text>
          <Text style={styles.subtitle}>One room engine · fifteen experiments</Text>
        </View>
        <AccuracyNote compact />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Guided Lessons at the very top, before the module list (owner 2026-08-05). */}
        <Pressable
          style={styles.lessonBtnTop}
          onPress={() => setLessonOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open the guided lesson"
        >
          <Text style={styles.lessonText}>ⓘ GUIDED LESSON</Text>
        </Pressable>
        <Text style={styles.body}>
          Place sound sources in a room, move the walls, change the materials — and watch
          wavefronts, interference, reflections and coverage evolve live. Every module below is a
          preset of the same Room Builder engine.
        </Text>
        <Text style={styles.sectionTitle}>THE 15 MODULES</Text>
        {modules.map((m) => (
          <ModuleAccordionRow
            key={m.id}
            num={m.num}
            name={m.title}
            blurb={m.blurb}
            expanded={openId === m.id}
            done={clearedUnits.has(m.id)}
            onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
            onOpen={() => navigation.navigate('WaveModule', { id: m.id })}
          />
        ))}
        {builder && (
          <>
            <Text style={styles.sectionTitle}>PUT IT ALL TOGETHER</Text>
            <ModuleAccordionRow
              num={builder.num}
              name={builder.title}
              blurb={builder.blurb}
              expanded={openId === builder.id}
              done={clearedUnits.has(builder.id)}
              onToggle={() => setOpenId((cur) => (cur === builder.id ? null : builder.id))}
              onOpen={() => navigation.navigate('WaveModule', { id: builder.id })}
            />
          </>
        )}
      </ScrollView>
      <GuidedLessonSheet visible={lessonOpen} lesson={getLabLesson('wave')} onClose={() => setLessonOpen(false)} />
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
  builderCard: { borderColor: '#3a3320', backgroundColor: '#17150f' },
  cardTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber, width: 26, textAlign: 'center' },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  futureNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.textSub, borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014', padding: 10 },
  lessonBtnTop: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.5)', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#17150f' },
  lessonText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.9, color: colors.amber },
});
