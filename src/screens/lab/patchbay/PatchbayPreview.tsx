/**
 * DEV + WEB ONLY — `localhost:8090/#patchbaypreview` renders the Patchbay
 * lab's core visuals as a state gallery for design iteration in the browser
 * (SVG + RN Animated only — no Skia, so the web preview is faithful).
 * Interactive: tap the jacks. Never shipped into any navigator.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import { PatchPairView } from './art/PatchPairView';
import { JackCutaway } from './art/JackCutaway';
import { ControlSlider } from '../amp/kit';
import type { NormalConfig, PairState } from './engine/patchbay';
import { PatchbayLabScreen } from './PatchbayLabScreen';

function Station({ title, config, breakSide, start }: { title: string; config: NormalConfig; breakSide?: 'top' | 'bottom'; start?: Partial<PairState> }) {
  const [state, setState] = useState<PairState>({
    config,
    breakSide,
    topPlugged: start?.topPlugged ?? false,
    bottomPlugged: start?.bottomPlugged ?? false,
  });
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.h}>{title}</Text>
      <PatchPairView
        state={state}
        sourceLabel="CONSOLE OUT 1"
        destLabel="INTERFACE IN 1"
        topPatchLabel="ANALYZER"
        bottomPatchLabel="DRUM MACHINE"
        reduceMotion={false}
        onToggleJack={(jack) =>
          setState((prev) => (jack === 'top' ? { ...prev, topPlugged: !prev.topPlugged } : { ...prev, bottomPlugged: !prev.bottomPlugged }))
        }
        caption="Tap a jack to insert / remove a cord."
      />
    </View>
  );
}

function CutawayStation() {
  const [insertion, setInsertion] = useState(0);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.h}>JACK CUTAWAY (drive the plug)</Text>
      <JackCutaway insertion={insertion} reduceMotion={false} />
      <ControlSlider label="PLUG INSERTION" value={insertion} min={0} max={1} step={0.01} onChange={setInsertion} format={(v) => `${Math.round(v * 100)}%`} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export function PatchbayPreview() {
  // `#patchbaypreview/lab` — the full paged lab inside a minimal nav container
  // (PagedLab calls navigation.goBack on Finish).
  const wantLab = typeof window !== 'undefined' && window.location.hash.startsWith('#patchbaypreview/lab');
  if (wantLab) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PatchbayLab" component={PatchbayLabScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.screenBg }} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>PATCHBAY — CORE VISUAL GALLERY</Text>
      <CutawayStation />
      <Station title="THRU (start empty — dead-end, then patch both)" config="thru" />
      <Station title="FULL-NORMAL (start intact — try each jack)" config="full" />
      <Station title="HALF-NORMAL · BOTTOM BREAK (top = tap)" config="half" breakSide="bottom" />
      <Station title="HALF-NORMAL · TOP BREAK (§22 variant — bottom merges)" config="half" breakSide="top" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 22, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { color: colors.amberLabel, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2 },
  h: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
});
