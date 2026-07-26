/**
 * EarLabScreen — "Ear Training & Critical Listening Lab" SHELL (Phase 1).
 *
 * SHELL: header + intro + four mode tabs (Learn / Explore / Practice / Test)
 * + an audio-output prompt on entry. Explore mounts HarmonicsView — the
 * hear-see-control harmonics centerpiece (search for HARMONICS below).
 *
 * Honesty (measurement-tools §1.7): no fake meters, no simulated output. The
 * shell itself produces no sound — HarmonicsView owns every sound path (all
 * behind the audio-output gate, with its own noteAudioActivity keepalive);
 * the on-entry gate merely lets the user enable output up front. Engine
 * awareness is a SUBTLE note in Explore (live mode needs the DSP engine);
 * the shell never hard-blocks — Learn/Practice/Test render without the engine.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { EngineGate } from '../tools/EngineGate';
import { HarmonicsView } from './HarmonicsView';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EarLab'>;

type LabMode = 'learn' | 'explore' | 'practice' | 'test';

const MODES: { key: LabMode; label: string }[] = [
  { key: 'learn', label: 'LEARN' },
  { key: 'explore', label: 'EXPLORE' },
  { key: 'practice', label: 'PRACTICE' },
  { key: 'test', label: 'TEST' },
];

const INTRO =
  'Develop technical listening skills by hearing, identifying, measuring, and ' +
  'manipulating frequencies, noise, distortion, dynamics, spatial effects, and ' +
  'real-world audio-system conditions.';

/** Small labeled "in development" card — the honest placeholder for the panels
 *  whose content lands in later steps (no simulated interactivity). */
function DevPlaceholder({ text }: { text: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

export function EarLabScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { requestAudioOutput } = useAudioOutputGate();

  // Default to EXPLORE (spec) — the mode that will host the harmonics view.
  const [mode, setMode] = useState<LabMode>('explore');

  // Vertical stem drags in HarmonicsView's editor must WIN over the panel's
  // ScrollView: while a drag is active the scroll is disabled (the editor's
  // responder also refuses termination, but Android ScrollView can still
  // steal — this is the reliable half of the belt-and-braces pair).
  const [scrollLocked, setScrollLocked] = useState(false);

  // Engine gate — computed ONCE (native availability cannot change mid-session);
  // mirrors the tool screens. 'idle' = engine usable; 'absent'/'spike' render the
  // shared honest EngineGate card as a SUBTLE note in Explore only.
  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';

  // AUDIO-OUTPUT PROMPT ON ENTRY (owner-confirmed 2026-07-25): entering the Lab
  // prompts the user to enable sound up front. Rendering does NOT block on the
  // result — the shell renders regardless; the shell emits no sound yet.
  useEffect(() => {
    void requestAudioOutput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>EAR TRAINING & CRITICAL LISTENING LAB</Text>
          <Text style={styles.subtitle}>Technical Listening</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
        {/* INSTRUCTION — what this lab is for. */}
        <Text style={styles.intro}>{INTRO}</Text>

        {/* MODE TABS — Learn / Explore / Practice / Test (default Explore). */}
        <View style={styles.tabRow}>
          {MODES.map((m) => {
            const selected = mode === m.key;
            return (
              <Pressable
                key={m.key}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => {
                  // A tab press can land MID-STEM-DRAG (tabs stay pressable
                  // during a PanResponder drag); switching away unmounts the
                  // editor before its release fires, so free the scroll lock
                  // here too (the editor also releases it on unmount).
                  setScrollLocked(false);
                  setMode(m.key);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${m.label} mode`}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* PANELS — one per mode. */}
        {mode === 'learn' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>
              The app identifies the sound and explains what to hear and observe.
            </Text>
            <DevPlaceholder text="Lessons in development" />
          </View>
        ) : null}

        {mode === 'explore' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>
              Freely change the generator, analyzer, level, and other controls.
            </Text>

            {/* Subtle, HONEST engine note — the interactive view needs the DSP
                engine. Renders nothing when the engine is ready; the shell never
                hard-blocks on it. */}
            {!engineReady ? <EngineGate state={gate} /> : null}

            {/* HARMONICS / HEAR-SEE-CONTROL VIEW — the interactive centerpiece.
                HarmonicsView owns its state, sound, cleanup, and card chrome
                entirely — mounted directly in the panel (which has gap: 12).
                onDragActive locks this screen's scroll during stem drags. */}
            <HarmonicsView onDragActive={setScrollLocked} />
          </View>
        ) : null}

        {mode === 'practice' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>Exercises with optional hints and immediate feedback.</Text>
            <DevPlaceholder text="Exercises in development" />
          </View>
        ) : null}

        {mode === 'test' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>Randomized scored exercises without instructional overlays.</Text>
            <DevPlaceholder text="Scored tests in development" />
          </View>
        ) : null}
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
  scroll: { padding: 16, paddingBottom: 28, gap: 14 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  // Segmented mode tabs (inline pill row — no shared component exists; matches
  // the SignalGen chip idiom).
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabSelected: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  tabText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  tabTextSelected: { color: colors.amber },

  panel: { gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },

  // "In development" placeholder (Learn / Practice / Test).
  placeholder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSub },
});
