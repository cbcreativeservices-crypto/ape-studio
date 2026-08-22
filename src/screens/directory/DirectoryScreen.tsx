/**
 * Directory — "Get Discovered" informational page (user request 2026-07-22).
 * Now the 4th page of the Awards swipe pager (Curriculum · Specialization ·
 * Program · Directory) — user request 2026-07-22. Explains the optional profile
 * in the Pro Audio Training Academy PROFESSIONAL REGISTRY: verified certificates,
 * specialization certificates, verification IDs + QR codes, and a permanent,
 * shareable record for employers.
 *
 * DirectoryView is the scrollable body (embedded in the Awards pager with
 * showBrand=false, which already shows the logo up top); DirectoryScreen is the
 * standalone modal wrapper (✕ to close).
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { BrandLogo } from '../../components/BrandLogo';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { loadPublicProfile } from '../../features/profile/publicProfile';
import { fetchMyQrToken } from '../../features/profile/api';
import { REGISTRY_BASE_URL } from '../../features/profile/registry';
import { CredentialQr } from '../../components/CredentialQr';
import { useBundles } from '../../features/enrollment/enrolledBundlesStore';
import { useEnrollmentProgress } from '../../features/enrollment/enrollmentProgress';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Directory'>;

const DIRECTORY_INTRO_TITLE = 'Get Discovered';

// Green-highlighted brand phrase (user request 2026-07-22). OFFICIAL TITLE of
// this feature: "Pro Audio Training Academy Professional Registry". It appears
// in paragraphs 1 and 3 below and renders green in both.
const BRAND_PHRASE = 'Pro Audio Training Academy Professional Registry';

// The Registry ID / verification URL / issue date come from the account's real
// server-issued Registry record once the backend is wired. Until then the UI
// shows an honest "pending issuance" state — no fabricated ID/URL/date is
// presented as a verifiable credential (owner launch-triage 2026-08-21).

/** Faint, semi-transparent gray QR-like pattern painted behind the "QR / CODE"
 *  placeholder text inside the black box (user request 2026-07-22). */
const QR_FINDERS = [
  { top: '9%', left: '9%' },
  { top: '9%', right: '9%' },
  { bottom: '9%', left: '9%' },
] as const;
const QR_MODULES = [
  { x: 44, y: 18 },
  { x: 54, y: 26 },
  { x: 40, y: 40 },
  { x: 60, y: 46 },
  { x: 48, y: 56 },
  { x: 66, y: 60 },
  { x: 42, y: 70 },
  { x: 72, y: 40 },
  { x: 34, y: 58 },
  { x: 74, y: 72 },
] as const;

function QrArt() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {QR_FINDERS.map((pos, i) => (
        <View key={`f${i}`} style={[styles.qrFinder, pos]}>
          <View style={styles.qrFinderDot} />
        </View>
      ))}
      {QR_MODULES.map((m, i) => (
        <View
          key={`m${i}`}
          style={{ position: 'absolute', left: `${m.x}%`, top: `${m.y}%`, width: '7%', height: '7%', backgroundColor: 'rgba(205,205,205,0.16)' }}
        />
      ))}
    </View>
  );
}

/**
 * DirectoryView — the scrollable "Get Discovered" body WITHOUT a screen header.
 * Embedded as the 4th page of the Awards pager (showBrand off — the pager shows
 * the logo up top) and by the standalone DirectoryScreen.
 */
export function DirectoryView({ showBrand = true }: { showBrand?: boolean }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  // Only registered users (any account, paid or not) can set up a profile
  // (user request 2026-07-22).
  const { entitlement } = useEntitlement();
  const hasAccount = entitlement !== 'anonymous';
  const [acctNote, setAcctNote] = useState(false);
  // The name the user chose for the Registry (set in Profile) — shown on the
  // confirmation once registered (user request 2026-07-22).
  const [registryName, setRegistryName] = useState('');
  // Permanent credential token → the real QR + public verification URL (owner
  // 2026-08-21). null until loaded / for guests → the QR shows its pending state.
  const [qrToken, setQrToken] = useState<string | null>(null);
  useEffect(() => {
    loadPublicProfile().then((p) => setRegistryName(p.registryName || p.name || ''));
    if (hasAccount) void fetchMyQrToken().then(setQrToken);
  }, [hasAccount]);
  // A member is listed as "User" until they earn their first certificate or
  // program, then "Graduate" (user request 2026-07-22). Proxy: any enrolled
  // cert/program bundle with all topics complete.
  const bundles = useBundles();
  const bundleGs = useMemo(() => Array.from(new Set(bundles.flatMap((b) => b.topics))), [bundles]);
  const bundleProg = useEnrollmentProgress(bundleGs);
  const isGraduate = bundles.some(
    (b) => b.kind !== 'subject' && b.topics.length > 0 && b.topics.every((gs) => (bundleProg.get(gs)?.pct ?? 0) >= 100),
  );
  return (
    <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}>
      {showBrand ? (
        <View style={styles.brandRow}>
          <BrandLogo size={34} />
          <Text style={styles.brandWordmark}>
            PRO AUDIO <Text style={styles.brandAccent}>TRAINING ACADEMY</Text>
          </Text>
        </View>
      ) : null}

      {/* The tab already labels this "DIRECTORY" in the pager, so the eyebrow
          shows only on the standalone screen. */}
      {showBrand ? <Text style={styles.eyebrow}>ACADEMY DIRECTORY</Text> : null}
      {/* Once registered, the "Get Discovered" title becomes the green Registry
          name (user request 2026-07-22). */}
      {hasAccount ? (
        <Text style={[styles.introTitle, styles.registryGreenTitle]}>{BRAND_PHRASE}</Text>
      ) : (
        <Text style={[styles.introTitle, { color: '#37e05f' }]}>{DIRECTORY_INTRO_TITLE}</Text>
      )}

      {/* Corrected copy (user-provided 2026-07-22). The Registry name renders
          green in paragraphs 1 and 3. */}
      <Text style={styles.body}>
        Your achievements deserve to be recognized. Create an optional profile in the{' '}
        <Text style={styles.brandGreen}>{BRAND_PHRASE}</Text> to showcase your verified certificates,
        specialization certificates, and professional accomplishments.
      </Text>

      <Text style={styles.body}>
        Share your verified digital certificates on résumés, job applications, portfolios, and professional
        networking profiles. Every certificate includes a unique verification ID and QR code, allowing
        employers to instantly confirm its authenticity online.
      </Text>

      <Text style={styles.body}>
        Your certificates remain permanently verifiable through the {BRAND_PHRASE}—even if you no longer
        maintain an active membership.
      </Text>

      <Text style={styles.body}>
        Participation is completely optional. You control what information is displayed, and your public
        profile can be updated or removed at any time.
      </Text>

      {/* The amber closing call-to-action hides once registered (user request
          2026-07-22). */}
      {!hasAccount ? (
        <>
          <Text style={styles.closing}>Get registered.</Text>
          <Text style={styles.closing}>Build your professional reputation. Verify your expertise.</Text>
        </>
      ) : null}

      {/* Green profile container (user request 2026-07-22). LEFT half = the call-
          to-action + button, or — once the user is REGISTERED (has an account) —
          their Registry confirmation ID + links. RIGHT = a nested green square
          holding a black QR CODE box. */}
      {hasAccount ? (
        // REGISTERED — the real, scannable credential QR (owner 2026-08-21):
        // encodes this user's permanent registry lookup URL (qr_token). Anyone
        // can scan it to verify the holder's credentials on the Academy Registry.
        // Falls back to a pending tile until the token loads.
        <View style={styles.registryBoxCol}>
          <CredentialQr token={qrToken} size={160} />
          <Text style={styles.registryConfirmName}>{registryName || 'Add your Registry name in Profile'}</Text>
          {/* Listed as "User" until the first earned certificate/program, then
              "Graduate" (user request 2026-07-22). */}
          <Text style={styles.registryStatus}>{isGraduate ? 'GRADUATE' : 'USER'}</Text>
          {qrToken ? (
            <Text style={styles.registryLink} numberOfLines={1}>
              Scan to verify · {REGISTRY_BASE_URL.replace(/^https?:\/\//, '')}/registry
            </Text>
          ) : (
            <Text style={styles.registryPending}>
              Your verification QR appears here once your account finishes setting up.
            </Text>
          )}
        </View>
      ) : (
        // NOT REGISTERED — CTA + button on the left, QR square on the right.
        <View style={styles.registryBox}>
          <View style={styles.registryLeft}>
            <Text style={styles.registryText}>
              Ready to be discovered? Set up your public profile and add your information to the Registry so
              employers can find you.
            </Text>
            <Pressable
              style={styles.registryBtn}
              onPress={() => setAcctNote(true)}
              accessibilityRole="button"
              accessibilityLabel="Set up my profile"
            >
              <Text style={styles.registryBtnText}>SET UP MY PROFILE ›</Text>
            </Pressable>
          </View>
          <View style={styles.qrSquare}>
            <View style={styles.qrBlack}>
              <QrArt />
              <Text style={styles.qrText}>QR</Text>
              <Text style={styles.qrText}>CODE</Text>
            </View>
          </View>
        </View>
      )}

      {/* Footer note pinned at the very bottom, WHITE, shown in both states
          (user request 2026-07-22). */}
      <Text style={styles.registrySubtitle}>Ongoing subscription not required to stay active in the registry</Text>
    </ScrollView>

    {/* Account-less users can't set up a profile — but membership isn't required,
        only an account (user request 2026-07-22). */}
    <PrePaywallPrompt
      visible={acctNote}
      onClose={() => setAcctNote(false)}
      title="Account required"
      lines={[
        'Only registered users can set up a Registry profile.',
        'Create a free account to add your information — you don’t need a paid or active membership, just an account. You can then edit your profile anytime from the Profile screen.',
      ]}
    />
    </>
  );
}

/** Standalone modal wrapper (kept for the direct route) — header + body. */
export function DirectoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>DIRECTORY</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
      <DirectoryView showBrand />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
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
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.4, color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSubAlt },
  scroll: { padding: 20, gap: 16 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandWordmark: { fontFamily: fonts.oswaldBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  brandAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },

  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amberLabel },
  introTitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 26,
    letterSpacing: 0.4,
    color: colors.textPrimary,
    marginTop: -4,
    marginBottom: 4,
  },
  body: { fontFamily: fonts.barlowMedium, fontSize: 16.5, lineHeight: 26, color: colors.textSecondary },
  // Green brand phrase (Registry name) inside paragraphs 1 and 3.
  brandGreen: { color: '#37e05f', fontFamily: fonts.barlowSemiBold },
  // Closing call-to-action line — AMBER (user request 2026-07-22).
  closing: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: 0.3,
    color: colors.amber,
    marginTop: 4,
  },
  // Green profile container — row: left CTA/confirmation half + right QR square
  // (user request 2026-07-22).
  registryBox: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.55)',
    backgroundColor: '#101512',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  registryLeft: { flex: 1, gap: 12 },
  // Footer reassurance line at the very bottom — WHITE (user request 2026-07-22).
  registrySubtitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.3, color: colors.textPrimary, textAlign: 'center', marginTop: 8 },
  // Registry designation badge: "USER" until first earned award, then "GRADUATE".
  registryStatus: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2, color: '#37e05f' },
  // Faint gray QR pattern pieces inside the black box.
  qrFinder: { position: 'absolute', width: '26%', height: '26%', borderWidth: 3, borderColor: 'rgba(205,205,205,0.18)' },
  qrFinderDot: { position: 'absolute', top: '30%', left: '30%', right: '30%', bottom: '30%', backgroundColor: 'rgba(205,205,205,0.18)' },
  // Pending note shown until the ≥1-month membership requirement is met.
  registryPending: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.amberLabel, textAlign: 'center', marginTop: 2 },
  // Registered: green Registry title (replaces "Get Discovered").
  registryGreenTitle: { color: '#37e05f', fontSize: 22, lineHeight: 27 },
  // Registered container — centered, column.
  registryBoxCol: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.55)',
    backgroundColor: '#101512',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  // Larger centered QR for easy scanning (user request 2026-07-22).
  qrLarge: {
    width: 190,
    height: 190,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLargeBlack: { flex: 1, alignSelf: 'stretch', backgroundColor: '#000000', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  registryConfirmName: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 0.4, color: colors.textPrimary, textAlign: 'center', marginTop: 4 },
  registryMetaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  registryDate: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  registryText: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 23, color: '#37e05f' },
  registryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.12)',
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  registryBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: '#37e05f' },
  // Registered state — Registry confirmation ID + links.
  registryEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: '#37e05f' },
  registryDataLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.8, color: colors.textSub },
  registryId: { fontFamily: fonts.mono, fontSize: 14, color: '#37e05f', marginTop: 1 },
  registryLink: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: '#7fd4ff', textDecorationLine: 'underline', marginTop: 1 },
  // Nested green square holding the black QR CODE box.
  qrSquare: {
    width: 100,
    height: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(55,224,95,.7)',
    backgroundColor: 'rgba(55,224,95,.08)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBlack: { flex: 1, alignSelf: 'stretch', backgroundColor: '#000000', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  qrText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, lineHeight: 14, letterSpacing: 1.6, color: '#ffffff', textAlign: 'center' },
});
