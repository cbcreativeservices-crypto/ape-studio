/**
 * AboutHomeSheet — the "About" popup opened from the top-left text button on the
 * Home screen (owner-provided copy 2026-08-12). A scrollable modal card, ✕ to
 * close; distinct from the Dashboard-logo AboutScreen (that one is ABOUT · OUR
 * PROMISE · CREDITS · CONTACT). Copy is rendered verbatim — changes route to the
 * owner.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/BrandLogo';
import { colors, fonts } from '../../theme/tokens';

/** One eyebrow-headed section. */
const SECTIONS: { head: string; paras: string[] }[] = [
  {
    head: 'Start with the Glossary',
    paras: [
      'The Pro Audio Glossary is the foundation of the app and is available free.',
      'Use it whenever you encounter an unfamiliar term, connector, specification, technique, piece of equipment, or audio concept. Search for what you need, learn what it means, and explore related terminology.',
      'You do not have to enroll in the Academy to use the app as a reference.',
    ],
  },
  {
    head: 'Learn by Topic',
    paras: [
      'When you want to go beyond looking something up, the Academy organizes professional audio into subjects and focused topics.',
      'Topics bring together the terminology, concepts, explanations, exercises, and assessments needed to develop a practical understanding of an area of audio.',
      'You can study at your own pace and focus on the areas that matter to you.',
    ],
  },
  {
    head: 'Learn by Doing',
    paras: [
      'Audio is not something you should learn only by reading.',
      'Interactive labs, demonstrations, calculators, and audio tools help you explore concepts and see how they behave in practice.',
      'The goal is to connect terminology and theory with the equipment, measurements, signals, and situations you encounter in the real world.',
    ],
  },
  {
    head: 'Check Your Understanding',
    paras: [
      'Learning activities throughout the Academy help you practice and reinforce what you have studied.',
      'When you are ready, complete the assessment for a topic to demonstrate your understanding and complete that topic.',
      'Your progress is saved so you can continue building your knowledge over time.',
    ],
  },
  {
    head: 'Build Credentials',
    paras: [
      'Completing required groups of topics can earn Pro Audio Training Academy credentials in specific areas of professional audio.',
      'These credentials document the training you have completed and the knowledge you have demonstrated within the Academy.',
      'Your credentials are lifelong verifiable by employers using our online Pro Audio Training Academy database, and current membership is not required to maintain your transcript in our searchable registry.',
    ],
  },
];

/** The "Use The App Your Way" question → answer lines. */
const PATHWAYS: string[] = [
  'Need an answer? Search the Glossary.',
  'Want to understand something better? Explore a topic.',
  'Want hands-on experience? Open a lab or tool.',
  'Want structured training? Follow the Academy curriculum.',
  'Want to demonstrate what you’ve learned? Complete topics and work toward credentials.',
];

export function AboutHomeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal accessibilityViewIsModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginTop: insets.top + 24, marginBottom: insets.bottom + 24 }]}>
          <View style={styles.headerBar}>
            <Text accessibilityRole="header" style={styles.headerTitle}>ABOUT</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
            <View style={styles.brandBlock}>
              <BrandLogo size={92} />
              <Text style={styles.title}>
                About Pro Audio <Text style={styles.titleAccent}>Training Academy</Text>
              </Text>
              <Text style={styles.tagline}>Learn it. Look it up. Practice it. Prove what you know.</Text>
            </View>

            <Text style={styles.body}>
              Pro Audio Training Academy is a professional audio reference, learning, and
              skills-development app designed for students, working professionals, musicians,
              technicians, and anyone who wants to better understand audio and sound.
            </Text>
            <Text style={styles.body}>
              You can use it simply as a quick reference when you need an answer, or go further and use
              the Academy as a structured training program.
            </Text>

            {SECTIONS.map((s) => (
              <View key={s.head} style={styles.section}>
                <Text style={styles.eyebrow}>{s.head}</Text>
                {s.paras.map((p, i) => (
                  <Text key={i} style={styles.body}>
                    {p}
                  </Text>
                ))}
              </View>
            ))}

            <View style={styles.section}>
              <Text style={styles.eyebrow}>Use The App Your Way</Text>
              <Text style={styles.body}>You don’t have to follow one path.</Text>
              {PATHWAYS.map((p) => (
                <Text key={p} style={styles.pathway}>
                  {p}
                </Text>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.finaleHead}>One App. Several Ways to Use It.</Text>
            <Text style={styles.finaleFlow}>Reference → Learn → Practice → Assess → Earn Credentials</Text>
            <Text style={styles.body}>
              Whether you open Pro Audio Training Academy for a 30-second answer or use it to complete an
              entire course of study, everything is designed around the same purpose:
            </Text>
            <Text style={styles.finaleClose}>
              Helping you understand professional audio and become more capable using it.
            </Text>

            <Pressable
              style={styles.doneBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close About"
            >
              <Text style={styles.doneBtnText}>CLOSE</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: colors.screenBg,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },

  scroll: { padding: 20, gap: 14, paddingBottom: 28 },
  brandBlock: { alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontFamily: fonts.oswaldBold, fontSize: 21, color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
  titleAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.amberLabel,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  section: { gap: 8, marginTop: 6 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amberLabel },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 22, color: colors.textSecondary },
  pathway: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textPrimary },

  divider: { height: 1, backgroundColor: colors.hairlineDim, marginVertical: 10, alignSelf: 'center', width: '55%' },

  finaleHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 16,
    letterSpacing: 0.6,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  finaleFlow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12.5,
    letterSpacing: 0.8,
    color: colors.amber,
    textAlign: 'center',
  },
  finaleClose: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textPrimary },

  doneBtn: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#131316',
    paddingVertical: 13,
    alignItems: 'center',
  },
  doneBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4, color: colors.textSecondary },
});
