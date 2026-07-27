/**
 * LabShell — the shared Audio-Learning-Lab screen shell (v4 MASTER §4, first
 * real cut of the Unified Lab Shell). Header + back, intro, and the four mode
 * tabs (Learn / Explore / Practice / Test):
 *   • LEARN    — the lab's Guided Lesson from the typed registry (content.ts):
 *                what-it-is · controls · Common Mistakes · Pro Tips · Formula.
 *   • EXPLORE  — the lab's interactive panel (children).
 *   • PRACTICE / TEST — honest "in development" placeholders until the graded
 *                challenge layer ships (§1.7: no simulated interactivity).
 *
 * The shell itself produces no sound; each lab's Explore panel owns its audio
 * lifecycle. On entry the shell offers the audio-output prompt up front
 * (owner-confirmed 2026-07-25) without blocking render.
 *
 * HarmonicLabScreen predates this shell (same layout, hand-rolled) — migrating
 * it here is a later cleanup; new labs start on the shell.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { GuidedLessonBody, getLabLesson, type LabId } from '../../features/lab/guidedLessons';
import { colors, fonts } from '../../theme/tokens';

type LabMode = 'learn' | 'explore' | 'practice' | 'test';

const MODES: { key: LabMode; label: string }[] = [
  { key: 'learn', label: 'LEARN' },
  { key: 'explore', label: 'EXPLORE' },
  { key: 'practice', label: 'PRACTICE' },
  { key: 'test', label: 'TEST' },
];

/** Shared chip control (SignalGen/HarmonicsView idiom). Long-press opens the
 *  control's Guided Lesson where wired (v4 §5). */
export function LabChip({
  label,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={onLongPress ? `${label} — long-press for its guided lesson` : label}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** PHONE SPEAKER OUTPUT tickbox — flips a readout between the reference (ideal)
 *  view and the speaker-output view (the signal after the low-frequency
 *  protective high-pass). The honesty control (§1.7): the filter is shown, never
 *  hidden. `sub` is an optional one-liner shown under the label. */
export function SpeakerOutputToggle({
  value,
  onChange,
  sub,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  sub?: string;
}) {
  return (
    <Pressable
      style={styles.spkToggle}
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Show phone speaker output"
    >
      <View style={[styles.spkBox, value && styles.spkBoxOn]}>
        {value ? <Text style={styles.spkCheck}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.spkLabel, value && styles.spkLabelOn]}>PHONE SPEAKER OUTPUT</Text>
        {sub ? <Text style={styles.spkSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

/** API handed to a render-prop Explore child. `setScrollLocked` lets an
 *  interactive panel (e.g. a drag editor) disable the shell's ScrollView while a
 *  gesture is in flight, so the drag wins over scroll. */
export type LabShellExploreApi = { setScrollLocked: (locked: boolean) => void };

export function LabShell({
  labId,
  title,
  subtitle,
  intro,
  exploreCaption,
  children,
}: {
  labId: LabId;
  title: string;
  subtitle: string;
  intro: string;
  /** One-liner above the Explore panel. */
  exploreCaption: string;
  /** The lab's interactive Explore content. A function child receives the
   *  shell API (scroll-lock control for drag editors); a plain node renders
   *  as-is. */
  children: ReactNode | ((api: LabShellExploreApi) => ReactNode);
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { requestAudioOutput } = useAudioOutputGate();
  const [mode, setMode] = useState<LabMode>('explore');
  // Drag editors (HarmonicsView stems) lock the ScrollView while dragging so the
  // gesture wins over scroll. Owned here so a tab switch always frees it — a tab
  // press can land mid-drag and unmount the editor before its release fires.
  const [scrollLocked, setScrollLocked] = useState(false);
  const lesson = getLabLesson(labId);

  // Audio-output prompt on entry (owner-confirmed 2026-07-25): non-blocking.
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!scrollLocked}>
        <Text style={styles.intro}>{intro}</Text>

        <View style={styles.tabRow}>
          {MODES.map((m) => {
            const selected = mode === m.key;
            return (
              <Pressable
                key={m.key}
                style={[styles.tab, selected && styles.tabSelected]}
                onPress={() => {
                  // A tab press can land mid-drag (tabs stay pressable during a
                  // PanResponder drag); switching away unmounts the editor before
                  // its release fires, so free the scroll lock here too.
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

        {mode === 'learn' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>
              What this lab teaches — definitions, common mistakes, pro tips, and the formula.
            </Text>
            <GuidedLessonBody lesson={lesson} />
          </View>
        ) : null}

        {mode === 'explore' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>{exploreCaption}</Text>
            {typeof children === 'function' ? children({ setScrollLocked }) : children}
          </View>
        ) : null}

        {mode === 'practice' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>Exercises with optional hints and immediate feedback.</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Exercises in development</Text>
            </View>
          </View>
        ) : null}

        {mode === 'test' ? (
          <View style={styles.panel}>
            <Text style={styles.caption}>Randomized scored exercises without instructional overlays.</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Scored tests in development</Text>
            </View>
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

  placeholder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSub },

  // LabChip
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSecondary },
  chipTextSelected: { color: colors.amber },

  // PHONE SPEAKER OUTPUT tickbox
  spkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  spkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#3a3a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spkBoxOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.15)' },
  spkCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, marginTop: -1 },
  spkLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  spkLabelOn: { color: colors.amber },
  spkSub: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15, color: colors.textSub, marginTop: 1 },
});
