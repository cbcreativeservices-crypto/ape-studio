/**
 * GainLabHomeScreen — the Gain Staging Lab's OWN home (owner spec 2026-08-07):
 * a hands-on signal-flow lab, not meter theory. The core skill: set each stage
 * so the signal stays healthy as it moves through the chain — without
 * overloading one stage or starving the next. Mirrors the EQ Lab home.
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
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { GAIN_MODULES, GAIN_SECTION_META, type GainModuleId } from './modules/registry';

const PATH = ['SOURCE', 'PREAMP', 'PROCESSING', 'FADER', 'OUTPUT'];

export function GainLabHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const open = (id: GainModuleId) => navigation.navigate('GainModule', { id });
  // Accordion: every module collapsed by default, only one open at a time.
  const [openId, setOpenId] = useState<GainModuleId | null>(null);
  const clearedUnits = useLabClearedUnits('af_gain_staging');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>GAIN STAGING LAB</Text>
          <Text style={styles.subtitle}>Keep the signal healthy at every stage of the chain.</Text>
        </View>
        <AccuracyNote compact />
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
          Gain staging is not about making everything as loud as possible — it’s about maintaining
          an appropriate operating level from one stage to the next: enough signal to stay above
          the noise, enough headroom to avoid overload. Adjust each stage and watch the signal
          propagate through the system.
        </Text>

        {GAIN_SECTION_META.map((sec) => {
          const mods = GAIN_MODULES.filter((m) => m.section === sec.id);
          if (!mods.length) return null;
          return (
            <View key={sec.id} style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.caption}>{sec.note}</Text>
              {mods.map((m) => (
                <ModuleAccordionRow
                  key={m.id}
                  name={m.title}
                  blurb={m.blurb}
                  expanded={openId === m.id}
                  done={clearedUnits.has(m.id)}
                  onToggle={() => setOpenId((cur) => (cur === m.id ? null : m.id))}
                  onOpen={() => open(m.id)}
                />
              ))}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>RELATED</Text>
        <View style={styles.toolWrap}>
          <ToolChip label="LEVELS & DECIBELS CALC" onPress={() => navigation.navigate('CalcWorkspace', { id: 'level' })} />
          <ToolChip label="SIGNAL CHAIN BUILDER" onPress={() => navigation.navigate('SignalChainLab')} />
          <ToolChip label="SPL METER" onPress={() => navigation.navigate('SplMeter')} />
        </View>
        <Text style={styles.caption}>
          The exact numbers — dBu, dBV, dBFS, nominal levels and calibration — get their own
          lessons later. This lab teaches the principle first: healthy level, adequate headroom, at
          every stage.
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
  toolWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolChip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#17171c' },
  toolText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary },
  pathRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  pathStep: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pathText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1, color: colors.textSecondary },
  pathArrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
});
