/**
 * ToolInfoScreen — educational placeholder for a measurement tool (Booth
 * 2026-07-09v). Shows purpose, "what it measures", "what it does NOT measure"
 * and the shared phone-mic limitations, straight from the functional spec —
 * plus an honest engine-status note. NO simulated meters (spec §1.7: nothing
 * decorative may resemble a live meter). The real UI lands with the native
 * DSP module (Spike 0).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { ApeDsp } from '../../../modules/ape-dsp';
import { colors, fonts } from '../../theme/tokens';
import { ENGINE_NOTE, MIC_LIMITS, toolByKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ToolInfo'>;

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((s) => (
        <Text key={s} style={styles.bullet}>
          {'•  '}
          {s}
        </Text>
      ))}
    </View>
  );
}

export function ToolInfoScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const tool = toolByKey(route.params.toolKey);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
          {tool.subtitle ? <Text style={styles.subtitle}>{tool.subtitle}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Honest status — shown only while THIS BUILD lacks the engine
            (engine build 2026-07-23: version 2 carries it). */}
        {ApeDsp.engineVersion() < 2 && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>MEASUREMENT ENGINE — IN DEVELOPMENT</Text>
            <Text style={styles.statusBody}>{ENGINE_NOTE}</Text>
          </View>
        )}

        {/* Engine build (2026-07-23): OPEN TOOL for tools with a live screen.
            The live screen gates itself honestly (EngineGate) when the native
            engine isn't in this build — never a fake meter. */}
        {(tool.key === 'spl' ||
          tool.key === 'rta' ||
          tool.key === 'waveform' ||
          tool.key === 'spectrogram' ||
          tool.key === 'signalgen') && (
          <GlassButton
            label="OPEN TOOL"
            tint={tool.tint}
            height={52}
            fontSize={15}
            onPress={() =>
              navigation.navigate(
                tool.key === 'spl'
                  ? 'SplMeter'
                  : tool.key === 'rta'
                    ? 'Rta'
                    : tool.key === 'waveform'
                      ? 'WaveformLive'
                      : tool.key === 'spectrogram'
                        ? 'SpectrogramLive'
                        : 'SignalGen',
              )
            }
          />
        )}

        {/* Phase-1 training layer (spec 2026-07-23): guided LEARN + visual DEMO.
            Buttons always open; the destination screens gate the content. */}
        <View style={styles.trainRow}>
          <View style={{ flex: 1 }}>
            <GlassButton
              label="LEARN"
              tint={tool.tint}
              height={46}
              fontSize={14}
              onPress={() => navigation.navigate('ToolLearn', { toolKey: tool.key })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              label="DEMO"
              tint={tool.tint}
              height={46}
              fontSize={14}
              onPress={() => navigation.navigate('ToolDemo', { toolKey: tool.key })}
            />
          </View>
        </View>

        <Text style={styles.purpose}>{tool.purpose}</Text>

        <Text style={styles.sectionHead}>WHAT IT MEASURES</Text>
        <Bullets items={tool.measures} />

        <Text style={styles.sectionHead}>WHAT IT DOES NOT MEASURE</Text>
        <Bullets items={tool.notMeasures} />

        <Text style={styles.sectionHead}>PHONE-MICROPHONE LIMITS</Text>
        <Bullets items={MIC_LIMITS} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },

  trainRow: { flexDirection: 'row', gap: 12 },

  statusCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 14,
    gap: 6,
  },
  statusTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  statusBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  purpose: { fontFamily: fonts.barlowRegular, fontSize: 15.5, lineHeight: 23, color: colors.textSecondary },
  sectionHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 1.8,
    color: colors.amberLabel,
    marginTop: 6,
  },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
});
