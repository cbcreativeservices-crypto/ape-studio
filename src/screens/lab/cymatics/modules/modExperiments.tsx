/**
 * Module 5 — Guided Experiments (spec §5, Phase 1 set). Each card lists the
 * goal + steps and opens the studio in exactly that situation.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../../theme/tokens';
import { EXPERIMENTS } from '../../../../features/cymatics/presets';
import type { RootStackParamList } from '../../../../navigation/types';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { P } from './shared';

export function ExperimentsModule(_p: CymaticsModuleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Cards are a MENU (learning pass 2026-09-17): the steps live in the studio's
  // well once you set up, and LOOK FOR is revealed there after the steps — so
  // the card shows the goal + the prediction, and unfolds its steps on a tap.
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Seventeen structured activities — ten on the Chladni plate, four in the liquid dish, three on the drumhead and loudspeaker. Each one asks for a prediction first, then
        opens the studio already set up for that step, with the steps kept in the studio’s notes so you can tick them off as you go.
      </Text>
      {EXPERIMENTS.map((e) => (
        <View key={e.id} style={P.card}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Text style={P.numTag}>{e.num}</Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={P.strong}>{e.title}</Text>
              <Text style={P.caption}>{e.goal}</Text>
            </View>
          </View>
          {e.predict ? (
            <Text style={[P.caption, { color: '#7fd4ff' }]}>
              <Text style={{ fontFamily: fonts.oswaldSemiBold }}>PREDICT FIRST · </Text>
              {e.predict}
            </Text>
          ) : null}
          <Pressable onPress={() => setOpenId(openId === e.id ? null : e.id)} accessibilityRole="button" accessibilityState={{ expanded: openId === e.id }} accessibilityLabel={`${openId === e.id ? 'Hide' : 'Show'} the ${e.steps.length} steps`}>
            <Text style={styles.stepsToggle}>{openId === e.id ? '▾' : '▸'} {e.steps.length} STEPS{openId === e.id ? '' : ' — tap to preview; they travel into the studio with you'}</Text>
          </Pressable>
          {openId === e.id
            ? e.steps.map((s, i) => (
                <View key={i} style={P.bullet}>
                  <Text style={P.dot}>{i + 1}.</Text>
                  <Text style={[P.body, { flex: 1 }]}>{s}</Text>
                </View>
              ))
            : null}
          <Pressable
            style={styles.btn}
            onPress={() =>
              e.studio === 'liquid'
                ? navigation.navigate('CymaticsLiquidStudio', { preset: e.liquid!.id })
                : e.studio === 'membrane'
                  ? navigation.navigate('CymaticsMembraneStudio', { preset: e.membrane!.id })
                  : navigation.navigate('CymaticsPlateStudio', { preset: e.preset!.id })
            }
            accessibilityRole="button"
            accessibilityLabel={`Set up the ${e.studio === 'liquid' ? 'dish' : e.studio === 'membrane' ? 'drum' : 'plate'} for experiment ${e.num}`}
          >
            <Text style={styles.btnText}>{e.studio === 'liquid' ? 'SET UP THE DISH ›' : e.studio === 'membrane' ? 'SET UP THE DRUM ›' : 'SET UP THE PLATE ›'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignSelf: 'flex-start', borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)', paddingHorizontal: 14, paddingVertical: 9, marginTop: 2 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.amber },
  stepsToggle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
});
