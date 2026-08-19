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
import { useToolUsage } from '../../features/tools/telemetry';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { colors, fonts } from '../../theme/tokens';
import { MIC_LIMITS, toolByKey } from './toolsData';
import { LockedButton, MembershipRequiredNote } from './ToolLockUi';
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
  // T-1 telemetry: this screen owns the tool session (stays mounted while the
  // live screen is pushed on top), so its lifetime ≈ time spent in the tool.
  useToolUsage(tool.key);
  // OPEN TOOL is free for everyone; the LEARN/DEMO training layer is Academy-
  // only (owner 2026-08-05). Gate on entitlement, not caps.
  const { entitlement } = useEntitlement();
  const isMember = entitlement === 'academy';

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
        {/* (Owner 2026-08-19) The "MEASUREMENT ENGINE — NOT IN THIS BUILD" intro
            banner was removed: the engine ships in the real builds, and the live
            meter screen still gates honestly via EngineGate if it can't start. */}

        {/* Engine build (2026-07-23): OPEN TOOL for tools with a live screen.
            The live screen gates itself honestly (EngineGate) when the native
            engine isn't in this build — never a fake meter. */}
        {tool.key !== 'hzcounter' && (
          <GlassButton
            label="OPEN TOOL"
            tint="green"
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
                        : tool.key === 'rt60'
                          ? 'Rt60Live'
                          : 'SignalGen',
              )
            }
          />
        )}

        {/* Phase-1 training layer: guided LEARN + visual DEMO. Academy-only
            (owner 2026-08-05) — free accounts see them grayed + locked. */}
        <View style={styles.trainRow}>
          {isMember ? (
            <>
              <View style={{ flex: 1 }}>
                <GlassButton
                  label="LEARN"
                  tint="blue"
                  height={46}
                  fontSize={14}
                  onPress={() => navigation.navigate('ToolLearn', { toolKey: tool.key })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton
                  label="DEMO"
                  tint="purple"
                  height={46}
                  fontSize={14}
                  onPress={() => navigation.navigate('ToolDemo', { toolKey: tool.key })}
                />
              </View>
            </>
          ) : (
            <>
              <LockedButton label="LEARN" height={46} onPress={() => navigation.navigate('Paywall')} />
              <LockedButton label="DEMO" height={46} onPress={() => navigation.navigate('Paywall')} />
            </>
          )}
        </View>
        {!isMember && <MembershipRequiredNote what="open guided training" />}

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
