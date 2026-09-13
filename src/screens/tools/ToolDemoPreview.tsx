/**
 * ToolDemoPreview — DEV+WEB harness for the member-only tool DEMOS
 * (`localhost:8090/#tooldemopreview` or `#tooldemopreview/<toolKey>`).
 *
 * WHY IT EXISTS. The real host (ToolDemoScreen) is Academy-gated by
 * useToolsLocked(), and the web preview runs as a guest — so the one screen the
 * design pass needs to see is exactly the one the harness could not open. The
 * gate lives in the HOST, not in the demo components, so mounting the
 * components directly shows the member experience without touching the gate.
 *
 * Chrome is a faithful copy of ToolDemoScreen's badge + footnote so what the
 * reviewer sees is what a member sees. A top switcher row flips between the
 * seven demos WITHOUT a reload (handy for screenshot sweeps; the hash form
 * still deep-links a specific demo for a fresh mount).
 *
 * Dev-only: imported solely from App.tsx's __DEV__ && web preview branch.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOOL_DEMOS } from '../../components/tooldemos';
import { toolByKey, type ToolKey } from './toolsData';
import { colors, fonts } from '../../theme/tokens';

const DEMO_KEYS = Object.keys(TOOL_DEMOS) as ToolKey[];

function keyFromHash(): ToolKey {
  if (typeof window !== 'undefined') {
    const tail = window.location.hash.split('/')[1] as ToolKey | undefined;
    if (tail && DEMO_KEYS.includes(tail)) return tail;
  }
  return DEMO_KEYS[0];
}

export function ToolDemoPreview() {
  const [key, setKey] = useState<ToolKey>(keyFromHash);
  const tool = toolByKey(key);
  const Demo = TOOL_DEMOS[key];

  return (
    <View style={styles.root}>
      {/* Dev switcher — not part of the member screen. */}
      <View style={styles.switcher}>
        {DEMO_KEYS.map((k) => (
          <Pressable key={k} onPress={() => setKey(k)} style={[styles.chip, k === key && styles.chipOn]}>
            <Text style={[styles.chipText, k === key && styles.chipTextOn]}>{k}</Text>
          </Pressable>
        ))}
      </View>

      {/* From here down: the member's ToolDemoScreen experience, chrome copied
          from ToolDemoScreen.tsx (badge + footnote), gate omitted. */}
      <View style={styles.header}>
        <Text style={styles.title}>{tool.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Demo — see correct and incorrect use</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>TRAINING DEMO — NOT A LIVE MEASUREMENT</Text>
        </View>
        {Demo ? <Demo /> : null}
        <Text style={styles.footNote}>
          Demos are visual and silent. Values shown are training examples, not measurements.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 8 },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,.12)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textMuted },
  chipTextOn: { color: colors.amber },
  header: { paddingHorizontal: 14, paddingBottom: 10 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 12 },
  demoBadge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,141,122,.55)',
    backgroundColor: '#1c0f0b',
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoBadgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6, color: '#ff8d7a' },
  footNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
