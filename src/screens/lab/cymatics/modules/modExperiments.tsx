/**
 * Module 5 — Guided Experiments (spec §5, Phase 1 set). Each card lists the
 * goal + steps and opens the studio in exactly that situation.
 */
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
  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Eight structured activities. Each one opens the Plate Studio already set up for that step, so you can go straight to the
        observation.
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
          {e.steps.map((s, i) => (
            <View key={i} style={P.bullet}>
              <Text style={P.dot}>{i + 1}.</Text>
              <Text style={[P.body, { flex: 1 }]}>{s}</Text>
            </View>
          ))}
          <Text style={[P.caption, { color: colors.textSecondary }]}>
            <Text style={{ fontFamily: fonts.oswaldSemiBold, color: colors.amber }}>LOOK FOR · </Text>
            {e.lookFor}
          </Text>
          <Pressable style={styles.btn} onPress={() => navigation.navigate('CymaticsPlateStudio', { preset: e.preset.id })} accessibilityRole="button" accessibilityLabel={`Set up the plate for experiment ${e.num}`}>
            <Text style={styles.btnText}>SET UP THE PLATE ›</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignSelf: 'flex-start', borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)', paddingHorizontal: 14, paddingVertical: 9, marginTop: 2 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.1, color: colors.amber },
});
