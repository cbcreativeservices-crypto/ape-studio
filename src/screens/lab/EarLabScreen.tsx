/**
 * EarLabScreen — AUDIO LEARNING LAB landing menu (v4 MASTER §13).
 *
 * Reached from the pinned "Ear Training & Critical Listening Lab" HOME card.
 * This is the landing menu into the whole Learning-Lab ecosystem:
 *   • Pillar B — the 16 Audio Learning Labs
 *   • Pillar B capstone — Signal Chain Builder
 *   • Pillar C — Wave Physics Laboratory (Room Builder + 15 modules)
 *
 * The former single harmonics experience that lived on this route now has its
 * own `HarmonicLab` route (see HarmonicLabScreen) and is the one lab that is
 * live today; every other entry renders an HONEST "In development" state — no
 * fake interactivity, no dead links (measurement-tools §1.7).
 *
 * The `ear_training` STUDY METHOD (old Screen 12) is a separate, retired
 * concept — this landing menu replaces it (Booth 2026-07-26, D-LAB-1).
 */
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EarLab'>;

const INTRO =
  'Develop technical listening by hearing, identifying, measuring, and ' +
  'manipulating frequency, noise, distortion, dynamics, spatial effects, and ' +
  'real-world audio-system conditions — one continuous Learn It · Hear It · See It flow.';

/** A lab entry in the landing menu. `route` present ⇒ live & tappable; absent
 *  ⇒ honest "In development" (per §1.7 — no fake interactivity). */
type LabEntry = {
  /** Display number (spec order); Signal Chain / Wave Physics use a glyph. */
  tag: string;
  name: string;
  blurb: string;
  route?: keyof RootStackParamList;
};

type LabSection = { title: string; note?: string; entries: LabEntry[] };

// Pillar B — the 16 Audio Learning Labs (v4 MASTER §7). Only Harmonic (Lab 13)
// is live today (the additive engine v3 path); the rest are honest placeholders.
const AUDIO_LABS: LabEntry[] = [
  { tag: '1', name: 'Equalizer', blurb: 'Graphic, parametric, shelves, filters, dynamic EQ.' },
  { tag: '2', name: 'Delay', blurb: 'Echoes, slapback, tempo sync, feedback.' },
  { tag: '3', name: 'Reverb', blurb: 'Rooms, pre-delay, decay, RT60, damping.' },
  { tag: '4', name: 'Chorus', blurb: 'Detuned voices, width, modulation.' },
  { tag: '5', name: 'Flanger', blurb: 'Sweeping comb-filter notches.' },
  { tag: '6', name: 'Phaser', blurb: 'All-pass stages, phase cancellation.' },
  { tag: '7', name: 'Compression', blurb: 'Threshold, ratio, attack/release, envelope.' },
  { tag: '8', name: 'Gate', blurb: 'Downward expansion, chatter, sidechain.' },
  { tag: '9', name: 'Limiter', blurb: 'Brickwall ceiling, true-peak, loudness.' },
  { tag: '10', name: 'Distortion', blurb: 'Harmonics, clipping, saturation, aliasing.' },
  { tag: '11', name: 'Noise', blurb: 'White → violet colors, floor, SNR, masking.', route: 'NoiseLab' },
  { tag: '12', name: 'Phase', blurb: 'Polarity vs phase, correlation, mono.' },
  { tag: '13', name: 'Harmonic', blurb: 'Additive synthesis, spectrum, Fourier.', route: 'HarmonicLab' },
  { tag: '14', name: 'Oscillator', blurb: 'Sine/square/saw, FM, AM, band-limiting.', route: 'OscillatorLab' },
  { tag: '15', name: 'Stereo Imaging', blurb: 'Pan, width, Mid/Side, mono-fold.' },
  { tag: '16', name: 'Harmonograph', blurb: 'Frequency ratios ↔ musical intervals.', route: 'HarmonographLab' },
];

const SECTIONS: LabSection[] = [
  { title: 'THE 16 AUDIO LEARNING LABS', entries: AUDIO_LABS },
  {
    title: 'SIGNAL CHAIN BUILDER',
    note: 'The capstone — assemble a full chain and see per-module and cumulative effect.',
    entries: [
      {
        tag: '⛓',
        name: 'Signal Chain Builder',
        blurb: 'Generator → EQ → Comp → Gate → FX → Reverb → Limiter → Output.',
      },
    ],
  },
  {
    title: 'WAVE PHYSICS LABORATORY',
    note: 'Spatial acoustics — one Room Builder engine, 15 modules as presets.',
    entries: [
      {
        tag: '◎',
        name: 'Wave Physics Lab',
        blurb: 'Reflection, absorption, diffusion, interference, coverage, and more.',
      },
    ],
  },
];

export function EarLabScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>AUDIO LEARNING LAB</Text>
          <Text style={styles.subtitle}>Ear Training & Critical Listening</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>{INTRO}</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.note ? <Text style={styles.sectionNote}>{section.note}</Text> : null}
            <View style={styles.list}>
              {section.entries.map((e) => (
                <Fragment key={e.name}>
                  <LabRow entry={e} onOpen={() => e.route && navigation.navigate(e.route as never)} />
                </Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** One lab row. Live entries (have a `route`) are amber-accented and tappable
 *  with a chevron; in-development entries are muted and non-interactive with an
 *  honest "IN DEVELOPMENT" tag (no dead navigation). */
function LabRow({ entry, onOpen }: { entry: LabEntry; onOpen: () => void }) {
  const live = !!entry.route;
  return (
    <Pressable
      onPress={live ? onOpen : undefined}
      disabled={!live}
      accessibilityRole={live ? 'button' : undefined}
      accessibilityState={{ disabled: !live }}
      accessibilityLabel={live ? `Open ${entry.name} lab` : `${entry.name} — in development`}
      style={({ pressed }) => [styles.row, live && styles.rowLive, pressed && live && styles.rowPressed]}
    >
      <View style={[styles.numBadge, live && styles.numBadgeLive]}>
        <Text style={[styles.numText, live && styles.numTextLive]}>{entry.tag}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, live && styles.rowNameLive]}>{entry.name}</Text>
        <Text style={styles.rowBlurb}>{entry.blurb}</Text>
      </View>
      {live ? (
        <Text style={styles.chevron}>›</Text>
      ) : (
        <Text style={styles.devTag}>IN DEVELOPMENT</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 20 },

  intro: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },

  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  sectionNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginBottom: 2 },
  list: { gap: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowLive: { borderColor: 'rgba(255,198,77,.45)', backgroundColor: '#17140c' },
  rowPressed: { backgroundColor: '#1f1a0e' },

  numBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2c2c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeLive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: 'rgba(255,198,77,.10)' },
  numText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub },
  numTextLive: { color: colors.amber },

  rowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.4, color: colors.textSecondary },
  rowNameLive: { color: colors.textPrimary },
  rowBlurb: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginTop: 1 },

  chevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.amber, paddingHorizontal: 4 },
  devTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },
});
