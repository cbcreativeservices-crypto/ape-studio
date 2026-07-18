/**
 * S10 — Profile / Digital ID (LOCKED June 7; fullscreen, zero scroll; visuals
 * from 17-s10-profile.dc.html): MIRAMAR COLLEGE header + gear → Settings ·
 * ID card (initials avatar 110 on amber gradient / photo when set, nickname —
 * PUBLIC nickname only, never first/last name (FERPA), AP&E ID mono, QR) ·
 * CERTIFICATIONS 4-grid (lit = earned badge) · Album Level card (tier + % +
 * MVP cap note + vinyl 60). Bottom nav visible.
 *
 * 🔒 QR — BLOCKED on Booth's C-3 ruling (qr_token vs APE:${id} vs raw id;
 * 120 vs 160px). Layout ships at 120×120 with a stub pattern; encoding wires
 * after the ruling (react-native-qrcode-svg already installed).
 */
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AlbumDisc } from '../../components/AlbumDisc';
import { CertIcon, type CertKey } from '../../components/CertIcon';
import { GlassButton } from '../../components/GlassButton';
import { Toggle } from '../../components/Toggle';
import { albumTitleFor, colors, fonts } from '../../theme/tokens';
import { fetchProfile, type ProfileData } from '../../features/profile/api';
import {
  EMPTY_PUBLIC_PROFILE,
  INTEREST_TOPICS,
  loadPublicProfile,
  savePublicProfile,
  type PublicProfile,
} from '../../features/profile/publicProfile';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { COPY } from '../../lib/copy';

const CERTS: CertKey[] = ['mic', 'rec', 'mix', 'pa'];

/** Static stand-in blocks approximating the design's QR mock (C-3 pending). */
const STUB_BLOCKS = [
  { c: 0, r: 0, w: 2, h: 2 },
  { c: 5, r: 0, w: 2, h: 2 },
  { c: 3, r: 1, w: 1, h: 1 },
  { c: 2, r: 3, w: 1, h: 1 },
  { c: 4, r: 3, w: 2, h: 2 },
  { c: 0, r: 5, w: 2, h: 2 },
  { c: 3, r: 5, w: 1, h: 1 },
  { c: 6, r: 6, w: 1, h: 1 },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  // CM7 (Booth 2026-07-11): commercial variant — nickname · Album · trophies ·
  // completion records; HIDE the student-ID card (QR, AP&E ID) + MIC/PA/REC/MIX
  // certs. Institutional users keep Screen 10 exactly.
  const { commercialMode, caps, entitlement } = useEntitlement();
  // Public / networking profile (device-local for now — backend frozen).
  const [pub, setPub] = useState<PublicProfile>(EMPTY_PUBLIC_PROFILE);

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
        .then(setProfile)
        .catch(() => {});
    }, []),
  );

  useEffect(() => {
    loadPublicProfile().then(setPub);
  }, []);

  const setPubKey = useCallback(<K extends keyof PublicProfile>(key: K, value: PublicProfile[K]) => {
    setPub((prev) => {
      const next = { ...prev, [key]: value };
      void savePublicProfile(next); // immediate device-local write
      return next;
    });
  }, []);

  const toggleInterest = useCallback(
    (topic: string) => {
      setPub((prev) => {
        const has = prev.interests.includes(topic);
        const interests = has ? prev.interests.filter((t) => t !== topic) : [...prev.interests, topic];
        const next = { ...prev, interests };
        void savePublicProfile(next);
        return next;
      });
    },
    [],
  );

  const cell = 96 / 7; // stub grid geometry inside the 112px QR box (8px padding)

  // Institutional Mode (user request 2026-07-17): future academic /
  // institutional / site-license unlock — PARKED until after the commercial
  // launch. The switch stays DISABLED for now; tapping the row opens the
  // parked-modules container screen. Shown on both Profile variants.
  const institutionalPanel = (
    <View style={styles.panel}>
      <View style={styles.instRow}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => (navigation as any).navigate('Institutional')}
          accessibilityRole="button"
          accessibilityLabel="Institutional Mode — parked features"
        >
          <Text style={styles.instTitle}>INSTITUTIONAL MODE</Text>
          <Text style={styles.instHint}>Academic / site-license version · parked until after launch ›</Text>
        </Pressable>
        <Toggle on={false} onChange={() => {}} disabled />
      </View>
    </View>
  );

  if (commercialMode) {
    const academy = caps.allTopics; // academy = full access
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.bodyScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.college}>PRO AUDIO TRAINING ACADEMY</Text>
            <Pressable
              onPress={() => (navigation as any).navigate('Settings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.gear}
            >
              <Text style={styles.gearGlyph}>⚙</Text>
            </Pressable>
          </View>

          {/* ID card — avatar + nickname ONLY (no QR / no AP&E ID). */}
          <View style={styles.idCard}>
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={['#ffd35e', '#f09e1a']} style={styles.avatar}>
                <Text style={styles.avatarInitials}>{profile?.initials ?? '–'}</Text>
              </LinearGradient>
            )}
            <Text style={styles.nickname}>{(profile?.nickname ?? '—').toUpperCase()}</Text>
            <Text style={styles.planTag}>
              {academy ? 'ACADEMY MEMBER' : entitlement === 'lapsed' ? 'MEMBERSHIP LAPSED' : 'REFERENCE MODE'}
            </Text>
          </View>

          {/* Album Level (live for all users now). */}
          <View style={[styles.panel, styles.albumRow]}>
            <View style={{ flexShrink: 1 }}>
              {/* Subtitle sits ABOVE the album-level title (Booth 2026-07-11). */}
              <Text style={styles.tierMeta}>{profile?.overallPct ?? 0}% - Full Course Certification</Text>
              <Text style={styles.tierName}>
                ALBUM LEVEL: {albumTitleFor(profile?.tierName ?? 'Black').toUpperCase()}
              </Text>
              <Text style={styles.tierNote}>Higher tiers unlock as more courses launch</Text>
            </View>
            <View style={styles.albumBacking}>
              <AlbumDisc level={profile?.tierName ?? 'Black'} size={60} />
            </View>
          </View>

          {/* Completion records — records stay visible for academy + lapsed. */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>COMPLETION RECORDS</Text>
            {caps.completionRecords ? (
              <Pressable
                onPress={() => (navigation as any).navigate('Achievements')}
                accessibilityRole="button"
                accessibilityLabel="View trophies and records"
                style={styles.recordRow}
              >
                <Text style={styles.recordCount}>{profile?.completeCount ?? 0}</Text>
                <Text style={styles.recordLabel}>TOPICS COMPLETED · VIEW TROPHIES ›</Text>
              </Pressable>
            ) : (
              <Text style={styles.recordLocked}>{COPY.upgradePhrase}</Text>
            )}
          </View>

          {/* Your networking profile — name / email / interests / consent.
              Device-local for now (backend + employer directory pending); no
              sensitive data beyond email is collected (Booth 2026-07-11). */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>YOUR PROFILE</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={pub.name}
              onChangeText={(t) => setPubKey('name', t)}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={pub.email}
              onChangeText={(t) => setPubKey('email', t)}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Audio interests</Text>
            <View style={styles.chipWrap}>
              {INTEREST_TOPICS.map((topic) => {
                const on = pub.interests.includes(topic);
                return (
                  <Pressable
                    key={topic}
                    onPress={() => toggleInterest(topic)}
                    style={[styles.interestChip, on && styles.interestChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.interestChipText, on && styles.interestChipTextOn]}>{topic}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.consentRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.fieldLabel}>Contactable by employers</Text>
                <Text style={styles.fieldHint}>
                  Let vetted employers and networking partners contact you. You can turn this off anytime.
                </Text>
              </View>
              <Toggle on={pub.contactConsent} onChange={(v) => setPubKey('contactConsent', v)} />
            </View>
          </View>

          {institutionalPanel}

          {/* Upgrade CTA for non-academy (free / lapsed) → Paywall. */}
          {!academy && (
            <View style={{ marginTop: 4 }}>
              <GlassButton
                label={entitlement === 'lapsed' ? 'RENEW ACADEMY' : 'UPGRADE TO ACADEMY'}
                // Glossary blue (Booth 2026-07-11 #2).
                tint="blue"
                height={52}
                fontSize={14}
                onPress={() => (navigation as any).navigate('Paywall')}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.college}>MIRAMAR COLLEGE</Text>
          <Pressable
            onPress={() => (navigation as any).navigate('Settings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={styles.gear}
          >
            <Text style={styles.gearGlyph}>⚙</Text>
          </Pressable>
        </View>

        {/* Digital ID card */}
        <View style={styles.idCard}>
          <View style={[styles.pilotDot, { left: 7 }]} />
          <View style={[styles.pilotDot, { right: 7 }]} />
          {profile?.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={['#ffd35e', '#f09e1a']} style={styles.avatar}>
              <Text style={styles.avatarInitials}>{profile?.initials ?? '–'}</Text>
            </LinearGradient>
          )}
          <Text style={styles.nickname}>{(profile?.nickname ?? '—').toUpperCase()}</Text>
          <Text style={styles.apeId}>{profile?.apeStudentId ?? ''}</Text>

          {/* QR stub — 120×120 white tile, pattern only (C-3) */}
          <View style={styles.qrBox}>
            {STUB_BLOCKS.map((b, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: 8 + b.c * cell,
                  top: 8 + b.r * cell,
                  width: b.w * cell - 2,
                  height: b.h * cell - 2,
                  backgroundColor: '#000000',
                }}
              />
            ))}
            <Text style={styles.qrStubLabel}>C-3</Text>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>CERTIFICATIONS</Text>
          <View style={styles.certRow}>
            {CERTS.map((c) => (
              <CertIcon key={c} cert={c} active={profile?.earnedCerts.has(c) ?? false} />
            ))}
          </View>
        </View>

        {/* Album Level */}
        <View style={[styles.panel, styles.albumRow]}>
          <View style={{ flexShrink: 1 }}>
            {/* Subtitle sits ABOVE the album-level title (Booth 2026-07-11). */}
            <Text style={styles.tierMeta}>
              {profile?.overallPct ?? 0}% - Full Course Certification
            </Text>
            <Text style={styles.tierName}>
              ALBUM LEVEL: {albumTitleFor(profile?.tierName ?? 'Black').toUpperCase()}
            </Text>
            <Text style={styles.tierNote}>Higher tiers unlock as more courses launch</Text>
          </View>
          <View style={styles.albumBacking}>
            <AlbumDisc level={profile?.tierName ?? 'Black'} size={60} />
          </View>
        </View>

        {institutionalPanel}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { flex: 1, padding: 14, gap: 12 }, // zero scroll (locked)
  // Commercial variant scrolls (adds the networking profile form).
  bodyScroll: { padding: 14, paddingBottom: 32, gap: 12 },

  // Networking profile form.
  fieldLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 5,
  },
  fieldHint: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  input: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  interestChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  interestChipOn: { backgroundColor: '#0d1f14', borderColor: 'rgba(55,224,95,.65)' },
  interestChipText: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#9a9a9a' },
  interestChipTextOn: { color: '#5bff85' },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  college: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 2.3, color: '#cfcfcf' },
  gear: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearGlyph: { fontSize: 15, color: colors.textSubAlt },

  idCard: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 5,
  },
  pilotDot: {
    position: 'absolute',
    top: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    borderWidth: 1,
    borderColor: '#222222',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 110, height: 110, borderRadius: 55 },
  avatarInitials: { fontFamily: fonts.oswaldBold, fontSize: 38, color: '#221500' },
  nickname: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, letterSpacing: 1, color: colors.textPrimary, marginTop: 6 },
  apeId: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  qrBox: {
    width: 120,
    height: 120,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  qrStubLabel: {
    position: 'absolute',
    bottom: 3,
    right: 5,
    fontFamily: fonts.mono,
    fontSize: 9,
    color: '#999999',
  },

  panel: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  panelEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.amberLabel,
    marginBottom: 10,
    paddingLeft: 4,
  },
  certRow: { flexDirection: 'row', gap: 3 },

  // Institutional Mode row (user request 2026-07-17) — disabled switch +
  // tappable label opening the parked-modules container.
  instRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  instTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.amberLabel },
  instHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted, marginTop: 3 },

  // CM7 commercial variant.
  planTag: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.amber,
    marginTop: 4,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  recordRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingLeft: 4 },
  recordCount: { fontFamily: fonts.oswaldBold, fontSize: 30, color: colors.textPrimary },
  recordLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amberLabel },
  recordLocked: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSub,
    paddingLeft: 4,
  },

  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  // Coordinated lighter-gray SQUARE backing (Booth 2026-07-11): rounded square,
  // lifted another 39% toward white (#55565a → #97989a) for stronger contrast.
  albumBacking: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#97989a',
    borderWidth: 1,
    borderColor: '#a4a5a7',
  },
  tierName: {
    fontFamily: fonts.oswaldBold,
    fontSize: 18,
    letterSpacing: 1.8,
    color: '#c8c8c8',
    textShadowColor: 'rgba(200,200,200,.3)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  tierMeta: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSubAlt, marginTop: 2 },
  tierNote: {
    fontFamily: fonts.barlowCondensedRegular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textMuted,
    marginTop: 6,
    maxWidth: 170,
  },
});
