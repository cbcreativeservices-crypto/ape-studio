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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../features/keyboard/keyboardControllerSafe';
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
  LEARNING_GOALS,
  loadPublicProfile,
  savePublicProfile,
  type PublicProfile,
} from '../../features/profile/publicProfile';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { LowLightRow } from '../../features/settings/LowLightLayer';
import { AudioOutputRow } from '../../features/audio/AudioOutputRow';
import { DevVisualIndex } from '../../features/dev/DevVisualIndex';
import { useTermList } from '../../features/flags/flaggedStore';
import { useBundles } from '../../features/enrollment/enrolledBundlesStore';
import { useEnrollmentProgress } from '../../features/enrollment/enrollmentProgress';
import { COPY } from '../../lib/copy';

const CERTS: CertKey[] = ['mic', 'rec', 'mix', 'pa'];

/** One compact statistic row with a subtle separator. */
function StatRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowRule]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/** Single/multi-select chip group in the app's existing chip style. */
function ChoiceChips({
  options,
  isOn,
  onPick,
  onLongPick,
}: {
  options: readonly string[];
  isOn: (o: string) => boolean;
  onPick: (o: string) => void;
  onLongPick?: (o: string) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const on = isOn(o);
        return (
          <Pressable
            key={o}
            onPress={() => onPick(o)}
            onLongPress={onLongPick ? () => onLongPick(o) : undefined}
            delayLongPress={350}
            style={[styles.interestChip, on && styles.interestChipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.interestChipText, on && styles.interestChipTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  // "Terms learned" — the self-assessed KNOWN list (client-side; no server metric
  // exists while the backend is frozen).
  const known = useTermList('known');

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

  // Certificate + Program goals AUTO-populate from My Enrollments (owner
  // 2026-08-07): every cert/program bundle the user enrolled, with live topic
  // progress. Replaces the separately-picked Awards goal (ape:specCert/…).
  const bundles = useBundles();
  const certBundles = useMemo(() => bundles.filter((b) => b.kind === 'cert'), [bundles]);
  const programBundles = useMemo(() => bundles.filter((b) => b.kind === 'program'), [bundles]);
  const bundleGs = useMemo(
    () => Array.from(new Set([...certBundles, ...programBundles].flatMap((b) => b.topics))),
    [certBundles, programBundles],
  );
  const bundleProg = useEnrollmentProgress(bundleGs);
  const bundleDone = useCallback(
    (topics: number[]) => topics.filter((gs) => bundleProg.get(gs)?.status === 'complete').length,
    [bundleProg],
  );

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
        // Dropping the primary interest clears the primary flag too.
        const primaryInterest = has && prev.primaryInterest === topic ? '' : prev.primaryInterest;
        const next = { ...prev, interests, primaryInterest };
        void savePublicProfile(next);
        return next;
      });
    },
    [],
  );

  // Hold an interest to promote it to PRIMARY (adds it if not already selected).
  const promotePrimary = useCallback((topic: string) => {
    setPub((prev) => {
      const interests = prev.interests.includes(topic) ? prev.interests : [...prev.interests, topic];
      const next = { ...prev, interests, primaryInterest: topic };
      void savePublicProfile(next);
      return next;
    });
  }, []);

  const cell = 96 / 7; // stub grid geometry inside the 112px QR box (8px padding)

  // Institutional Mode is no longer a user-facing switch (user request
  // 2026-07-23) — it will be triggered automatically when a user signs in with an
  // institution access code, customised per client. The panel was removed.

  // Registry participation gate (user request 2026-07-23): the "show in registry"
  // toggle can only be turned on once the required identity fields are filled.
  const emailValid = /\S+@\S+\.\S+/.test(pub.email.trim());
  const profileComplete = pub.name.trim().length > 0 && pub.registryName.trim().length > 0 && emailValid;
  const registryActive = pub.showInRegistry && profileComplete;

  // This product ships COMMERCIAL-only: the institutional / "MIRAMAR COLLEGE" Profile
  // variant (further below) is retired — EVERY user, including guests, gets this
  // commercial profile (identical to a regular account; a guest just can't persist).
  // Zero academic/institutional references (user request 2026-07-26). Typed `boolean`
  // so the retained institutional variant stays reachable code (no unused-symbol churn);
  // flip false only for an actual institutional deployment.
  const commercialProfileOnly: boolean = true;
  if (commercialProfileOnly || commercialMode) {
    // REAL paid-member status — NOT the __DEV__-bypassed `caps` (which forces
    // academy on in dev). Drives the membership tag + upgrade CTA (fix 2026-07-26).
    const academy = entitlement === 'academy';
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <KeyboardAwareScrollView contentContainerStyle={styles.bodyScroll} keyboardShouldPersistTaps="handled" bottomOffset={24}>
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

          {/* Low-light mode toggle at the top (user request 2026-07-18). */}
          <LowLightRow />

          {/* Global audio-output mute + 5s hold-to-enable (owner request
              2026-07-25). Muted by default; auto-re-mutes on idle/reopen/login. */}
          <AudioOutputRow />

          {/* TEMPORARY dev tool (user request 2026-07-18) — visual index of every
              screen + popup. Remove before release. */}
          <DevVisualIndex />

          {/* 1 — STUDENT IDENTITY CARD (user request 2026-07-18): avatar (photo
              or initials), name, membership, understated Student ID. */}
          <View style={styles.identityCard}>
            {/* Avatar circle REMOVED for commercial (owner 2026-08-07) — the
                initials circle was a student-badge holdover; the name is now the
                top of the identity card. (Academic branch keeps its avatar.) */}
            <Text style={styles.identityName}>{pub.name || profile?.nickname || 'Add your name'}</Text>
            <Text style={styles.planTag}>
              {academy ? 'ACADEMY MEMBER' : entitlement === 'lapsed' ? 'MEMBERSHIP LAPSED' : 'REFERENCE MODE'}
            </Text>
            {profile?.apeStudentId ? <Text style={styles.identityMeta}>ID · {profile.apeStudentId}</Text> : null}
          </View>

          {/* ALBUM LEVEL card REMOVED for commercial (owner 2026-08-07) — the
              album→tier progression is retired; may return for the academic
              variant (still rendered in the institutional branch below). */}

          {/* 3 — CURRENT LEARNING FOCUS. */}
          <Pressable
            style={styles.panel}
            onPress={() => (navigation as any).navigate((profile?.completeCount ?? 0) > 0 ? 'Study' : 'Home')}
            accessibilityRole="button"
          >
            <Text style={styles.panelEyebrow}>CURRENT FOCUS</Text>
            {(profile?.overallPct ?? 0) > 0 ? (
              <>
                <Text style={styles.focusTitle}>Full Course Certification</Text>
                <Text style={styles.focusPct}>{profile?.overallPct ?? 0}% complete</Text>
                <Text style={styles.linkCta}>Continue →</Text>
              </>
            ) : (
              <Text style={styles.emptyLine}>Choose your first topic →</Text>
            )}
          </Pressable>

          {/* 4a — CERTIFICATE GOALS — auto-populated from My Enrollments (owner
              2026-08-07): every enrolled certificate, with live topic progress.
              Tap → My Enrollments to add/remove. */}
          <Pressable
            style={styles.panel}
            onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
            accessibilityRole="button"
          >
            <Text style={styles.panelEyebrow}>CERTIFICATE GOALS</Text>
            {certBundles.length ? (
              <>
                {certBundles.map((b) => (
                  <View key={b.key} style={styles.goalBundle}>
                    <Text style={styles.goalTitle}>{b.name}</Text>
                    <Text style={styles.goalSub}>
                      {bundleDone(b.topics)} of {b.topics.length} topics complete
                    </Text>
                  </View>
                ))}
                <Text style={styles.linkCta}>Manage in My Enrollments ›</Text>
              </>
            ) : (
              <Text style={styles.emptyLine}>Enroll in a certificate ›</Text>
            )}
          </Pressable>

          {/* 4b — PROGRAM GOALS — auto-populated from My Enrollments. */}
          <Pressable
            style={styles.panel}
            onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
            accessibilityRole="button"
          >
            <Text style={styles.panelEyebrow}>PROGRAM GOALS</Text>
            {programBundles.length ? (
              <>
                {programBundles.map((b) => (
                  <View key={b.key} style={styles.goalBundle}>
                    <Text style={styles.goalTitle}>{b.name}</Text>
                    <Text style={styles.goalSub}>
                      {bundleDone(b.topics)} of {b.topics.length} topics complete
                    </Text>
                  </View>
                ))}
                <Text style={styles.linkCta}>Manage in My Enrollments ›</Text>
              </>
            ) : (
              <Text style={styles.emptyLine}>Enroll in a program ›</Text>
            )}
          </Pressable>

          {/* 5 — STUDENT STATISTICS. */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>STATISTICS</Text>
            <StatRow label="Terms Learned" value={String(known.size)} />
            <StatRow label="Topics Completed" value={String(profile?.completeCount ?? 0)} />
            <StatRow label="Quizzes Passed" value="—" />
            <StatRow label="Study Streak" value="—" last />
            {caps.completionRecords ? (
              <Pressable
                onPress={() =>
                  // Flag the origin so the grid shows a back button to Profile
                  // (owner 2026-08-07 — there was no way back before).
                  (navigation as any).navigate('Achievements', {
                    screen: 'AchievementsGrid',
                    params: { from: 'profile' },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="View trophies and records"
              >
                <Text style={[styles.linkCta, { marginTop: 10 }]}>View trophies & records ›</Text>
              </Pressable>
            ) : null}
          </View>

          {/* 6 — AUDIO INTERESTS (with a promoted PRIMARY interest). */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>AUDIO INTERESTS</Text>
            {pub.primaryInterest ? (
              <>
                <Text style={styles.fieldLabel}>Primary interest</Text>
                <View style={styles.primaryChip}>
                  <Text style={styles.primaryChipText}>★ {pub.primaryInterest}</Text>
                </View>
              </>
            ) : null}
            <Text style={[styles.fieldLabel, { marginTop: pub.primaryInterest ? 12 : 0 }]}>
              Interests · hold one to make it primary
            </Text>
            <ChoiceChips
              options={INTEREST_TOPICS}
              isOn={(o) => pub.interests.includes(o)}
              onPick={toggleInterest}
              onLongPick={promotePrimary}
            />
          </View>

          {/* 7 — LEARNING PREFERENCES (optional). */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>LEARNING PREFERENCES</Text>
            <Text style={styles.fieldLabel}>Learning goal</Text>
            <ChoiceChips
              options={LEARNING_GOALS}
              isOn={(o) => pub.learningGoal === o}
              onPick={(o) => setPubKey('learningGoal', pub.learningGoal === o ? '' : o)}
            />
            {/* "Preferred difficulty" REMOVED (owner 2026-08-07) — it changed
                nothing, so it falsely implied an effect. */}
          </View>

          {/* 8 — ABOUT ME (optional, understated). */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>ABOUT ME</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={pub.bio}
              onChangeText={(t) => setPubKey('bio', t)}
              placeholder="A short line about you (optional) — e.g. Live sound engineer"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={160}
              returnKeyType="done"
            />
          </View>

          {/* 9 — RECENT ACTIVITY (empty state until the study-log backend lands). */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>RECENT ACTIVITY</Text>
            <Text style={styles.emptyLine}>No recent study activity yet — your sessions will show here.</Text>
          </View>

          {/* Account & networking — email lives here (out of the identity focus),
              read-only display + the employer-contact consent. */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>ACCOUNT &amp; NETWORKING</Text>
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
            {/* Name shown on the public Pro Registry profile (user request
                2026-07-22). */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Name used in registry</Text>
            <TextInput
              style={styles.input}
              value={pub.registryName}
              onChangeText={(t) => setPubKey('registryName', t)}
              placeholder="How your name appears in the Registry"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
            />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Email</Text>
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

          {/* PRO REGISTRY participation (user request 2026-07-23) — opt-in, only
              enable-able once name + registry name + email are filled; must be ON
              to be listed. */}
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>PRO REGISTRY</Text>
            <View style={styles.consentRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.fieldLabel}>Show me in the Pro Registry</Text>
                <Text style={styles.fieldHint}>
                  {profileComplete
                    ? 'This must be ON for you to appear in the public directory.'
                    : 'Complete your name, registry name, and email to enable this.'}
                </Text>
              </View>
              <Toggle
                on={pub.showInRegistry}
                onChange={(v) => setPubKey('showInRegistry', v)}
                disabled={!profileComplete}
              />
            </View>
            {/* Active readout — grayed until ON, green when participating. */}
            <View style={[styles.registryReadout, registryActive ? styles.registryReadoutOn : styles.registryReadoutOff]}>
              <Text style={[styles.registryReadoutText, { color: registryActive ? '#37e05f' : colors.textMuted }]}>
                {registryActive
                  ? '● REGISTRY ACTIVE — you are shown in the directory'
                  : '○ REGISTRY INACTIVE — not shown in the directory'}
              </Text>
            </View>
          </View>

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
        </KeyboardAwareScrollView>
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

        {/* CERTIFICATIONS grid (MIC/REC/MIX/PA) PARKED — a future academic-version
            feature, not part of the current commercial product (user request
            2026-07-26). Kept out of the render on purpose. */}

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
  // Registry participation readout — gray when off, green when active (user
  // request 2026-07-23).
  registryReadout: { marginTop: 12, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  registryReadoutOff: { borderColor: '#2f2f2f', backgroundColor: '#141414' },
  registryReadoutOn: { borderColor: 'rgba(55,224,95,.55)', backgroundColor: 'rgba(55,224,95,.1)' },
  registryReadoutText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8 },

  // --- Redesigned commercial Profile (user request 2026-07-18) ---
  identityCard: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  identityName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 22,
    letterSpacing: 0.6,
    color: colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  identityMeta: { fontFamily: fonts.mono, fontSize: 11.5, letterSpacing: 0.4, color: colors.textSub, marginTop: 4 },

  focusTitle: { fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.textPrimary, paddingLeft: 4 },
  focusPct: { fontFamily: fonts.barlowSemiBold, fontSize: 13.5, color: colors.amber, paddingLeft: 4, marginTop: 2 },
  linkCta: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12.5,
    letterSpacing: 1,
    color: colors.amber,
    paddingLeft: 4,
    marginTop: 8,
  },
  emptyLine: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSub,
    paddingLeft: 4,
  },

  // Each enrolled cert/program row inside its goals panel (owner 2026-08-07).
  goalBundle: { marginTop: 8 },
  goalTitle: { fontFamily: fonts.oswaldMedium, fontSize: 17.5, color: colors.textPrimary, paddingLeft: 4 },
  goalSub: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub, paddingLeft: 4, marginTop: 2 },
  goalMapHead: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: colors.amberLabel,
    paddingLeft: 4,
    marginTop: 12,
    marginBottom: 3,
  },
  goalMapItem: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    paddingLeft: 8,
  },
  goalCoreItem: {
    fontFamily: fonts.barlowMedium,
    fontSize: 14,
    lineHeight: 21,
    color: '#5bb0ff',
    paddingLeft: 8,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  statRowRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2a2a' },
  statLabel: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textSecondary },
  statValue: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textPrimary },

  primaryChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: '#241d08',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.7)',
  },
  primaryChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.5, color: colors.amber },

  bioInput: { minHeight: 60, textAlignVertical: 'top', paddingTop: 10 },
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
