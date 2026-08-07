/**
 * DevVisualIndex — TEMPORARY dev tool (user request 2026-07-18). A master index
 * of every screen + intro popup so they can be viewed at their real size without
 * fighting the app's natural flow (locked routes, once-only popups, etc.).
 *
 * Mounted on the Profile screen (below Low-light mode). REMOVE before release:
 * delete this file + its <DevVisualIndex/> usage.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { IntroSheet } from '../intro/ScreenIntroOverlay';
import { INTRO_STORAGE_PREFIX, SCREEN_INTROS, type IntroKey } from '../intro/screenIntros';
import { FLAGGED_TOPIC_ID } from '../flags/flaggedStore';
import { requestDevPreview } from './devPreview';
import { TrophyModal } from '../../components/TrophyModal';
import { ShareTermSheet, type ShareTermPayload } from '../../components/ShareTermSheet';
import { LearningIntroSheet } from '../intro/LearningIntroSheet';
import type { LearningIntro } from '../intro/learningIntros';
import { setPopupsSuppressed, usePopupsSuppressed } from './popupSuppressStore';

const MOCK_STUDY = { achievementId: FLAGGED_TOPIC_ID, topicName: 'Preview' };
const MOCK_SHARE: ShareTermPayload = {
  terms: [
    {
      term: 'Phantom Power',
      definition: '48 V DC sent down a balanced mic cable to power condenser microphones and active DIs.',
      plainEnglish: 'A safe DC voltage that powers condenser mics through the same XLR cable that carries their signal.',
      purpose: 'Powers condenser capsules and active direct boxes without a separate supply.',
      relatedTerms: ['Condenser microphone', 'Balanced audio', 'XLR', 'Direct box'],
      commonMistakes: [],
    },
  ],
  mistakesAllowed: false,
  resolve: async () => [],
};
const MOCK_INTRO: LearningIntro = {
  what: 'Safe practices for working around professional audio gear, power, and rigging.',
  why: 'Protects you, your crew, and your equipment on every gig.',
  where: 'Live venues, studios, houses of worship, and installs.',
  who: 'Every audio professional — from volunteer to touring engineer.',
  willLearn: ['Electrical & power safety', 'Safe lifting & rigging', 'Hearing protection'],
};

// In-screen popups: queue a preview request, then navigate to the host screen,
// which auto-opens the popup (see devPreview.ts).
const INLINE_POPUPS: ScreenEntry[] = [
  {
    label: 'Awards · Specialized Certificate picker',
    go: (n) => {
      requestDevPreview('awards:specPicker');
      n.navigate('Awards', { category: 'specialization' });
    },
  },
  {
    label: 'Awards · Program Path picker',
    go: (n) => {
      requestDevPreview('awards:programPicker');
      n.navigate('Awards', { category: 'program' });
    },
  },
  {
    label: 'Curriculum · Subject topics popup',
    go: (n) => {
      requestDevPreview('curriculum:zoom');
      n.navigate('Awards', { category: 'curriculum' });
    },
  },
  {
    label: 'Flashcards · Filters popup',
    go: (n) => {
      requestDevPreview('flashcards:filters');
      n.navigate('Study', { screen: 'Flashcards', params: MOCK_STUDY });
    },
  },
  {
    label: 'Flashcards · Term-list popup',
    go: (n) => {
      requestDevPreview('flashcards:termlist');
      n.navigate('Study', { screen: 'Flashcards', params: MOCK_STUDY });
    },
  },
  {
    label: 'Dashboard · Custom List popup',
    go: (n) => {
      requestDevPreview('dashboard:terms');
      n.navigate('Study', { screen: 'Dashboard' });
    },
  },
];

type StandaloneKey = 'trophy' | 'share' | 'learningIntro';
const STANDALONE: { label: string; key: StandaloneKey }[] = [
  { label: 'Trophy popup', key: 'trophy' },
  { label: 'Share term sheet', key: 'share' },
  { label: 'Learning intro sheet', key: 'learningIntro' },
];

type ScreenEntry = { label: string; go: (nav: any) => void };

// Navigable full-screen views. Study-stack + tabs use nested/tab navigation;
// root-stack modals navigate by name. Params are mocked for a visual preview.
const SCREENS: { section: string; items: ScreenEntry[] }[] = [
  {
    section: 'CORE',
    items: [
      { label: 'Course Selection (Home)', go: (n) => n.navigate('Home') },
      { label: 'Dashboard (method cards)', go: (n) => n.navigate('Study', { screen: 'Dashboard' }) },
      { label: 'Achievements grid', go: (n) => n.navigate('Achievements') },
      { label: 'Glossary', go: (n) => n.navigate('Study', { screen: 'Glossary', params: {} }) },
    ],
  },
  {
    section: 'STUDY METHODS',
    items: [
      { label: 'Flashcards', go: (n) => n.navigate('Study', { screen: 'Flashcards', params: MOCK_STUDY }) },
      { label: 'Fill in the Blank', go: (n) => n.navigate('Study', { screen: 'FillInBlank', params: MOCK_STUDY }) },
      { label: 'Matching', go: (n) => n.navigate('Study', { screen: 'Matching', params: MOCK_STUDY }) },
      { label: 'Quiz', go: (n) => n.navigate('Study', { screen: 'Quiz', params: MOCK_STUDY }) },
      { label: 'Scenarios', go: (n) => n.navigate('Study', { screen: 'Scenarios', params: MOCK_STUDY }) },
    ],
  },
  {
    section: 'CURRICULUM & AWARDS',
    items: [
      { label: 'Curriculum (pager · page 1)', go: (n) => n.navigate('Awards', { category: 'curriculum' }) },
      { label: 'Specialization (pager · page 2)', go: (n) => n.navigate('Awards', { category: 'specialization' }) },
      { label: 'Program (pager · page 3)', go: (n) => n.navigate('Awards', { category: 'program' }) },
      { label: 'Directory (pager · page 4)', go: (n) => n.navigate('Awards', { category: 'directory' }) },
      { label: 'Enrollment (pager · page 5)', go: (n) => n.navigate('Awards', { category: 'enrollment' }) },
    ],
  },
  {
    section: 'REWARDS',
    items: [
      {
        label: 'Trophy screen',
        go: (n) =>
          n.navigate('Trophy', {
            topicName: 'Pro Audio Safety',
            achievementId: 'preview',
            badgeEarned: true,
            entrySource: 'gallery',
          }),
      },
    ],
  },
  {
    section: 'ACCOUNT / MODAL',
    items: [
      { label: 'Settings', go: (n) => n.navigate('Settings') },
      { label: 'About / Credits', go: (n) => n.navigate('About') },
      { label: 'Paywall', go: (n) => n.navigate('Paywall') },
      { label: 'Institutional (parked)', go: (n) => n.navigate('Institutional') },
    ],
  },
  {
    section: 'TOOLS',
    items: [
      { label: 'Tools Hub', go: (n) => n.navigate('ToolsHub') },
      { label: 'Frequency Counter & Tuner', go: (n) => n.navigate('FrequencyCounter') },
      { label: 'Tool Learn (SPL)', go: (n) => n.navigate('ToolLearn', { toolKey: 'spl' }) },
      { label: 'Tool Demo (RTA)', go: (n) => n.navigate('ToolDemo', { toolKey: 'rta' }) },
      { label: 'Concept: Measurement Integrity', go: (n) => n.navigate('ConceptModule', { conceptKey: 'measurement-integrity' }) },
      { label: 'Saved Measurements', go: (n) => n.navigate('ToolLibrary', undefined) },
      { label: 'DSP Debug (dev)', go: (n) => n.navigate('DspDebug') },
    ],
  },
  {
    section: 'PRE-AUTH',
    items: [
      { label: 'Public Glossary', go: (n) => n.navigate('PublicGlossary') },
    ],
  },
];

const INTRO_KEYS = Object.keys(SCREEN_INTROS) as IntroKey[];

export function DevVisualIndex() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [previewIntro, setPreviewIntro] = useState<IntroKey | null>(null);
  const [standalone, setStandalone] = useState<StandaloneKey | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const popupsSuppressed = usePopupsSuppressed();

  const goScreen = (entry: ScreenEntry) => {
    setOpen(false);
    // Let the index modal close before navigating.
    setTimeout(() => {
      try {
        entry.go(navigation);
      } catch (e) {
        setNote(`Could not open "${entry.label}" — ${String(e)}`);
        setOpen(true);
      }
    }, 60);
  };

  const resetIntros = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const introKeys = keys.filter((k) => k.startsWith(INTRO_STORAGE_PREFIX));
      if (introKeys.length) await AsyncStorage.multiRemove(introKeys);
      setNote(`Reset ${introKeys.length} intro popup(s) — they will show again naturally.`);
    } catch {
      setNote('Could not reset intros.');
    }
  };

  return (
    <>
      <Pressable
        style={styles.launch}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Developer visual index"
      >
        <Text style={styles.launchText}>🛠  DEV · VISUAL INDEX</Text>
        <Text style={styles.launchSub}>Preview any screen or popup ›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>VISUAL INDEX</Text>
              <Text style={styles.sub}>Temporary dev preview · master list of screens & popups</Text>
            </View>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {note ? (
            <Pressable onPress={() => setNote(null)}>
              <Text style={styles.note}>{note}  (tap to dismiss)</Text>
            </Pressable>
          ) : null}

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <View style={styles.group}>
              <Text style={styles.groupHead}>OPTIONS</Text>
              <View style={[styles.row, styles.toggleRow]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.rowText}>Suppress all popups</Text>
                  <Text style={styles.toggleHint}>
                    Hides every intro, welcome, learning-intro & coach mark (overrides dev “always show”).
                  </Text>
                </View>
                <Switch
                  value={popupsSuppressed}
                  onValueChange={setPopupsSuppressed}
                  accessibilityLabel="Suppress all popups"
                />
              </View>
            </View>

            {SCREENS.map((group) => (
              <View key={group.section} style={styles.group}>
                <Text style={styles.groupHead}>{group.section}</Text>
                {group.items.map((it) => (
                  <Pressable key={it.label} style={styles.row} onPress={() => goScreen(it)}>
                    <Text style={styles.rowText}>{it.label}</Text>
                    <Text style={styles.rowGo}>›</Text>
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={styles.group}>
              <Text style={styles.groupHead}>IN-SCREEN POPUPS</Text>
              {INLINE_POPUPS.map((it) => (
                <Pressable key={it.label} style={styles.row} onPress={() => goScreen(it)}>
                  <Text style={styles.rowText}>{it.label}</Text>
                  <Text style={styles.rowGo}>open ›</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.group}>
              <Text style={styles.groupHead}>STANDALONE POPUPS</Text>
              {STANDALONE.map((it) => (
                <Pressable key={it.key} style={styles.row} onPress={() => setStandalone(it.key)}>
                  <Text style={styles.rowText}>{it.label}</Text>
                  <Text style={styles.rowGo}>show</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.group}>
              <Text style={styles.groupHead}>INTRO / WELCOME POPUPS</Text>
              {INTRO_KEYS.map((k) => (
                <Pressable key={k} style={styles.row} onPress={() => setPreviewIntro(k)}>
                  <Text style={styles.rowText}>{SCREEN_INTROS[k].title}</Text>
                  <Text style={styles.rowGo}>show</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.row, styles.resetRow]} onPress={resetIntros}>
                <Text style={[styles.rowText, { color: '#ffb84d' }]}>Reset all intro popups (replay naturally)</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Intro previews render their own Modal on top of the index. */}
        {previewIntro ? <IntroSheet introKey={previewIntro} onDismiss={() => setPreviewIntro(null)} /> : null}

        {/* Standalone popup components, previewed with mock data. */}
        <TrophyModal
          visible={standalone === 'trophy'}
          iconUrl={null}
          name="Pro Audio Safety"
          onClose={() => setStandalone(null)}
        />
        <ShareTermSheet payload={standalone === 'share' ? MOCK_SHARE : null} onClose={() => setStandalone(null)} />
        <LearningIntroSheet
          visible={standalone === 'learningIntro'}
          kind="topic"
          title="Pro Audio Safety"
          intro={MOCK_INTRO}
          onBegin={() => setStandalone(null)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  launch: {
    borderWidth: 1,
    borderColor: '#3a2f14',
    backgroundColor: '#161206',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 2,
  },
  launchText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: '#ffc64d' },
  launchSub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
  root: { flex: 1, backgroundColor: colors.screenBg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232323',
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.6, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSub },
  note: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    lineHeight: 18,
    color: '#5bff85',
    backgroundColor: '#0d1f14',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  group: { paddingHorizontal: 14, paddingTop: 14 },
  groupHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.amberLabel,
    marginBottom: 6,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 6,
  },
  resetRow: { backgroundColor: '#1c1405', borderColor: '#3a2f14' },
  toggleRow: { paddingVertical: 11 },
  toggleHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, marginTop: 3 },
  rowText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSecondary },
  rowGo: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub, marginLeft: 8 },
});
