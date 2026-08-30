/**
 * EqLabHomeScreen — the EQ Lab's OWN home (owner spec 2026-08-07,
 * docs/APE_EQ_LAB_SPEC_2026_08_07.md): much more than an EQ simulator — see,
 * hear, manipulate, and diagnose frequency content. Four visible sections
 * (LEARN / EXPLORE / TRAIN / CHALLENGE); built modules open, planned modules
 * are listed honestly as IN DEVELOPMENT. Mirrors DigitalLabHomeScreen.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { EQ_MODULES, EQ_SECTION_META, type EqModuleId } from './modules/registry';

/** The lab's educational progression, banner-style (Digital Lab idiom). */
const PATH = ['SEE', 'MANIPULATE', 'HEAR', 'IDENTIFY', 'CORRECT'];

export function EqLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const open = (id: EqModuleId) => navigation.navigate('EqModule', { id });
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<EqModuleId | null>(null);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>EQ LAB</Text>
          <Text style={styles.subtitle}>See, hear, manipulate, and diagnose frequency content.</Text>
        </View>
        <AccuracyNote compact detail="This lab can use your phone’s UNCALIBRATED microphone — read the analysis as relative, for learning. For accurate levels use a calibrated SPL meter or measurement mic." />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pathRow}>
          {PATH.map((p, i) => (
            <View key={p} style={styles.pathStep}>
              <Text style={styles.pathText}>{p}</Text>
              {i < PATH.length - 1 ? <Text style={styles.pathArrow}>›</Text> : null}
            </View>
          ))}
        </View>
        <Text style={styles.body}>
          Start by seeing the real frequency content of the room you’re in — then learn to shape
          it. Lessons unlock in a deliberate order: each one introduces only what the next needs.
        </Text>

        {EQ_SECTION_META.map((sec) => {
          const live = EQ_MODULES.filter((m) => m.section === sec.id);
          if (!live.length) return null;
          return (
            <View key={sec.id} style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.caption}>{sec.note}</Text>
              {live.map((m) => (
                <ModuleAccordionRow
                  key={m.id}
                  name={m.title}
                  blurb={m.blurb}
                  expanded={openId === m.id}
                  onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
                  onOpen={() => open(m.id)}
                />
              ))}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>RELATED TOOLS</Text>
        <View style={styles.toolWrap}>
          <ToolChip label="SPECTRUM ANALYZER / RTA" onPress={() => navigation.navigate('Rta')} />
          <ToolChip label="EQUALIZER EFFECT LAB" onPress={() => navigation.navigate('EqLab')} />
          <ToolChip label="Q & BANDWIDTH CALC" onPress={() => navigation.navigate('CalcWorkspace', { id: 'qbw' })} />
        </View>
        <Text style={styles.caption}>
          The full RTA tool, the audible Equalizer effect lab, and the Q ↔︎ bandwidth calculator
          live alongside this lab — everything here links back to the glossary.
        </Text>
      </ScrollView>
    </View>
  );
}

function ToolChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={styles.toolChip} onPress={onPress}>
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
  cardTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, width: 20, textAlign: 'center' },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  cardDev: { opacity: 0.55 },
  devHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devName: { fontSize: 14 },
  devBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.textSub, borderWidth: 1, borderColor: '#3a3a42', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  devCaption: { fontSize: 11.5 },
  toolWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolChip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  toolText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  pathRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  pathStep: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pathText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSecondary },
  pathArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
});
