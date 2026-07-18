/**
 * Landing — PRE-AUTH entry (CM2, Booth 2026-07-11 ruling). Replaces the
 * login-first flow for signed-out/anonymous users when commercialMode is ON.
 * NOT the bottom-nav Home destination (Home stays Course Select).
 *
 * Anatomy: glossary search hero (one tap → the public glossary) · 9 public
 * course cards (locked-aware browse — never a wall) · Audio Tools teaser
 * (locked) · sign-in / create-account affordances + class-code path.
 * Locked treatments + exact-copy pass complete in CM3; anonymous glossary
 * rendering completes in CM4.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { GlassButton } from '../../components/GlassButton';
import { UpgradeSheet } from '../../features/commercial/UpgradeSheet';
import {
  PUBLIC_COURSES,
  getPublicCatalog,
  courseHasFreeTopic,
  type PublicCourse,
} from '../../data/publicCourses';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // v2.13: live catalog (seed renders instantly; server rows replace it).
  const [catalog, setCatalog] = useState<PublicCourse[]>(PUBLIC_COURSES);

  useEffect(() => {
    let alive = true;
    getPublicCatalog().then((c) => {
      if (alive) setCatalog(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  const toAuth = () => navigation.navigate('Auth');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 14 }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ---- hero: brand + glossary search (one tap to a term) ---- */}
        <View style={styles.hero}>
          <BrandLogo size={72} />
          <Text style={styles.wordmark}>
            Pro Audio <Text style={styles.wordmarkAccent}>Training Academy</Text>
          </Text>
          <Text style={styles.heroEyebrow}>PROFESSIONAL AUDIO GLOSSARY</Text>
        </View>

        <Pressable
          style={styles.searchBox}
          onPress={() => navigation.navigate('PublicGlossary')}
          accessibilityRole="button"
          accessibilityLabel="Search the glossary"
        >
          <Text style={styles.searchGlyph}>⌕</Text>
          <Text style={styles.searchHint}>Search 3,300+ audio terms — free</Text>
        </Pressable>

        {/* ---- 9 public courses (browse is free; content locks apply) ---- */}
        <Text style={styles.sectionHead}>COURSES</Text>
        <View style={styles.courseGrid}>
          {catalog.map((c) => (
            <Pressable
              key={c.order}
              style={styles.courseCard}
              onPress={() => setUpgradeOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`${c.name} — locked`}
            >
              <Text style={styles.courseLock}>🔒</Text>
              <Text style={styles.courseName} numberOfLines={2}>
                {c.name}
              </Text>
              {/* CM3: honest free-tier affordance — free WITH an account
                  (anonymous browse ≠ free tier). */}
              {courseHasFreeTopic(c) && (
                <Text style={styles.freeChip}>
                  {c.topics.length === 1 ? 'FREE WITH ACCOUNT' : 'FREE TOPIC INCLUDED'}
                </Text>
              )}
              <Text style={styles.courseMeta}>{`${c.topics.length} TOPIC${c.topics.length === 1 ? '' : 'S'}`}</Text>
            </Pressable>
          ))}
        </View>

        {/* ---- tools teaser (academy-locked) ---- */}
        <Pressable
          style={styles.toolsCard}
          onPress={() => setUpgradeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Audio measurement tools — locked"
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.toolsEyebrow}>AUDIO MEASUREMENT TOOLS</Text>
            <Text style={styles.toolsTitle}>Measurement & Analysis</Text>
          </View>
          <Text style={styles.courseLock}>🔒</Text>
        </Pressable>

        {/* ---- auth affordances — an invitation, never a wall ---- */}
        <View style={styles.authRow}>
          <View style={{ flex: 1 }}>
            <GlassButton label="CREATE ACCOUNT" tint="gold" height={52} fontSize={14} onPress={toAuth} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton label="SIGN IN" tint="steel" height={52} fontSize={14} onPress={toAuth} />
          </View>
        </View>
        <Pressable onPress={toAuth} hitSlop={8} accessibilityRole="button" accessibilityLabel="I have a class code">
          <Text style={styles.classCode}>I have a class code</Text>
        </Pressable>

        {/* Verbatim §2 marketing line (CM3 — exact copy everywhere). */}
        <Text style={styles.marketing}>{COPY.marketingLine}</Text>
      </ScrollView>

      <UpgradeSheet
        visible={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSignIn={toAuth}
        onCreateAccount={toAuth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },

  hero: { alignItems: 'center', gap: 10, marginTop: 6, paddingHorizontal: 24 },
  wordmark: { fontFamily: fonts.oswaldBold, fontSize: 24, letterSpacing: 0.5, color: colors.textPrimary, textAlign: 'center' },
  wordmarkAccent: {
    fontFamily: fonts.oswaldMedium,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  heroEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.6, color: '#5bb0ff', marginTop: -4 },

  searchBox: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#101010',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  searchHint: { fontFamily: fonts.barlowRegular, fontSize: 15, color: colors.textSub },

  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2, color: colors.amberLabel, marginTop: 4 },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  courseCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#141416',
    padding: 12,
    gap: 4,
  },
  courseLock: { position: 'absolute', top: 8, right: 10, fontSize: 12, color: colors.textMuted },
  courseName: { fontFamily: fonts.oswaldMedium, fontSize: 15, lineHeight: 19, color: colors.textPrimary, paddingRight: 18 },
  courseMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSubAlt, marginTop: 'auto' },
  freeChip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    letterSpacing: 1.3,
    color: '#5bff85',
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  marketing: {
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSub,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  toolsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.4)',
    backgroundColor: '#10151b',
    padding: 14,
  },
  toolsEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: '#5bb0ff' },
  toolsTitle: { fontFamily: fonts.oswaldMedium, fontSize: 18, color: colors.textPrimary, marginTop: 2 },

  authRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  classCode: {
    alignSelf: 'center',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#5bb0ff',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
});
