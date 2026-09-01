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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../features/keyboard/keyboardControllerSafe';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AlbumDisc } from '../../components/AlbumDisc';
import { CredentialQr } from '../../components/CredentialQr';
import { fetchMyCredentials, type EarnedCredentialRow } from '../../features/credentials/api';
import {
  exportCertificate,
  isAvailable as certificateExportAvailable,
} from '../../features/credentials/certificatePdf';
import { GlassButton } from '../../components/GlassButton';
import { Toggle } from '../../components/Toggle';
import { Section } from '../../components/Section';
import { albumTitleFor, colors, fonts } from '../../theme/tokens';
import { fetchProfile, type ProfileData } from '../../features/profile/api';
import {
  EMPTY_PUBLIC_PROFILE,
  INTEREST_TOPICS,
  loadPublicProfile,
  savePublicProfile,
  isAdultConfirmed,
  setRegistryVisible,
  type PublicProfile,
} from '../../features/profile/publicProfile';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { LowLightDim, LowLightRow } from '../../features/settings/LowLightLayer';
import { useLowLight } from '../../features/settings/lowLight';
import { AudioOutputRow } from '../../features/audio/AudioOutputRow';
import { DevVisualIndex } from '../../features/dev/DevVisualIndex';
import { useTermList } from '../../features/flags/flaggedStore';
import { useBundles } from '../../features/enrollment/enrolledBundlesStore';
import { useEnrollmentProgress } from '../../features/enrollment/enrollmentProgress';


/**
 * react-native-web ships Alert as a literal no-op (`static alert() {}`), so a
 * native-only Alert makes the publish confirm — and the save-failed warning —
 * silently vanish in the browser: the privacy switch just refuses to move with
 * no explanation. Route both through the DOM dialogs on web.
 */
function askPublish(title: string, body: string, onYes: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}

${body}`)) onYes();
    return;
  }
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Publish', onPress: onYes },
  ]);
}

/** A plain yes/no question. Same web caveat as askPublish. */
function askYesNo(title: string, body: string, yes: string, onYes: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || window.confirm(`${title}\n\n${body}`)) onYes();
    return;
  }
  Alert.alert(title, body, [
    { text: 'Not yet', style: 'cancel' },
    { text: yes, onPress: onYes },
  ]);
}

function warn(title: string, body: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}

${body}`);
    return;
  }
  Alert.alert(title, body);
}

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
  starred,
}: {
  options: readonly string[];
  isOn: (o: string) => boolean;
  onPick: (o: string) => void;
  onLongPick?: (o: string) => void;
  /** The one option promoted as primary — marked in place with a star rather
   *  than duplicated into a second "primary interest" card above the group. */
  starred?: string;
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
            aria-selected={on}
          >
            <Text style={[styles.interestChipText, on && styles.interestChipTextOn]}>
              {starred === o ? '\u2605 ' : ''}
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function fmtCredDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

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
  // Earned credentials (runbook item 3, 2026-08-29). Read-only, RLS-scoped.
  const [credentials, setCredentials] = useState<EarnedCredentialRow[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [credMessage, setCredMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
        .then(setProfile)
        .catch(() => {});
      // Refetched on focus so a credential earned during this session appears
      // when the user comes back to Profile, without a manual reload.
      fetchMyCredentials().then(setCredentials);
    }, []),
  );

  const onExportCredential = useCallback(async (row: EarnedCredentialRow) => {
    setCredMessage(null);
    setExportingId(row.id);
    const res = await exportCertificate({
      credentialName: row.name,
      awardType: row.type,
      earnedAt: row.awardedAt,
    });
    setExportingId(null);
    if (res.ok) return;
    setCredMessage(
      res.reason === 'needs_build'
        ? 'Certificate download needs the next app build.'
        : res.reason === 'no_share_target'
          ? 'No app on this device can open a PDF.'
          : 'Could not prepare the certificate. Try again.',
    );
  }, []);

  useEffect(() => {
    // The load awaits a network round-trip for the server-backed fields. If the
    // user starts typing before it resolves, applying it would overwrite their
    // keystrokes — so a profile the user has already touched keeps what they
    // typed (design review 2026-08-30).
    void loadPublicProfile().then((loaded) => {
      if (!dirtyRef.current) setPub(loaded);
      setHydrated(true);
    });
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

  /**
   * PERSIST OUTSIDE THE UPDATER (design review 2026-08-30). These used to call
   * savePublicProfile INSIDE setPub's updater. An updater must be pure — under
   * StrictMode/concurrent rendering React may run it twice, which meant two
   * AsyncStorage writes and two debounced server pushes per keystroke. The
   * updater now only computes; a single effect persists whatever it settles on.
   */
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!dirtyRef.current) return; // never write back the value we just loaded
    void savePublicProfile(pub);
  }, [pub]);

  const setPubKey = useCallback(<K extends keyof PublicProfile>(key: K, value: PublicProfile[K]) => {
    dirtyRef.current = true;
    setPub((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleInterest = useCallback((topic: string) => {
    dirtyRef.current = true;
    setPub((prev) => {
      const has = prev.interests.includes(topic);
      const interests = has ? prev.interests.filter((t) => t !== topic) : [...prev.interests, topic];
      // Dropping the primary interest clears the primary flag too.
      const primaryInterest = has && prev.primaryInterest === topic ? '' : prev.primaryInterest;
      return { ...prev, interests, primaryInterest };
    });
  }, []);

  /** Star an interest to make it PRIMARY (adds it if not already selected);
   *  starring the current primary clears it. */
  const promotePrimary = useCallback((topic: string) => {
    dirtyRef.current = true;
    setPub((prev) => {
      if (prev.primaryInterest === topic) return { ...prev, primaryInterest: '' };
      const interests = prev.interests.includes(topic) ? prev.interests : [...prev.interests, topic];
      return { ...prev, interests, primaryInterest: topic };
    });
  }, []);

  // Institutional Mode is no longer a user-facing switch (user request
  // 2026-07-23) — it will be triggered automatically when a user signs in with an
  // institution access code, customised per client. The panel was removed.

  // Registry participation gate (user request 2026-07-23): the "show in registry"
  // toggle can only be turned on once the required identity fields are filled.
  const emailValid = /\S+@\S+\.\S+/.test(pub.email.trim());
  /** Per-field gaps, not one boolean: a dimmed switch is not a message, so the
   *  UI has to be able to say WHICH detail is missing and jump to it. */
  const gaps = useMemo(() => {
    const g: { key: 'name' | 'registryName' | 'email'; label: string; done: boolean }[] = [
      { key: 'name', label: 'Your name', done: pub.name.trim().length > 0 },
      { key: 'registryName', label: 'Name on your certificates', done: pub.registryName.trim().length > 0 },
      { key: 'email', label: 'Contact email', done: emailValid },
    ];
    return g;
  }, [pub.name, pub.registryName, emailValid]);
  const missing = gaps.filter((g) => !g.done);
  const profileComplete = missing.length === 0;
  const registryActive = pub.showInRegistry && profileComplete;

  // Field refs + a remount key: the gap checklist's "ADD >" has to OPEN the
  // section holding the field and put the cursor in it. Section owns its own
  // open state, so bumping the key remounts it with defaultOpen — the inputs
  // are re-created but their values live in `pub`, so nothing is lost. The
  // KeyboardAwareScrollView scrolls the focused input into view for us.
  const nameRef = useRef<TextInput | null>(null);
  const registryNameRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const [ppSeq, setPpSeq] = useState(0);
  /** PUBLIC PROFILE opens itself only when something is actually missing — and
   *  `pub` is EMPTY for the first frame, so deciding that before the load
   *  resolves flings the form open on every complete profile. The section keys
   *  on `hydrated` so it remounts exactly once, when the real values land, and
   *  never again while the user is typing in it. */
  const [hydrated, setHydrated] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [fullIdOpen, setFullIdOpen] = useState(false);
  /**
   * Low-light dims the ID along with everything else — correct, since the mode
   * exists so nothing flashes in a dark room. But the user opened this screen
   * precisely to have it SCANNED, and a camera reading a 50%-dimmed code in a
   * dark venue is a coin toss. Rather than pick one, let them lift the dim for
   * as long as the ID is open: a deliberate act instead of a surprise flash,
   * and it puts itself back the moment the card closes.
   */
  const lowLight = useLowLight();
  const [brightId, setBrightId] = useState(false);
  const closeFullId = useCallback(() => {
    setFullIdOpen(false);
    setBrightId(false);
  }, []);
  const focusField = useCallback((key: 'name' | 'registryName' | 'email') => {
    setPpSeq((n) => n + 1);
    setTimeout(() => {
      const r = key === 'name' ? nameRef : key === 'registryName' ? registryNameRef : emailRef;
      r.current?.focus();
    }, 240);
  }, []);

  /**
   * Publishing is the one switch on this screen with a consequence outside the
   * phone, so it does not behave like the others: it CONFIRMS on the way on,
   * writes to the server, and REVERTS itself if that write fails. A privacy
   * switch that shows "on" while the server disagrees is worse than one that
   * refuses to move.
   */
  const onRegistryToggle = useCallback(
    (v: boolean) => {
      const apply = (adult?: boolean) => {
        setPubKey('showInRegistry', v);
        void setRegistryVisible(v, { ...pub, showInRegistry: v }, { adult }).then((ok) => {
          if (ok) return;
          setPubKey('showInRegistry', !v);
          warn(
            'Not saved',
            'Your listing setting could not be saved. Check your connection and try again.',
          );
        });
      };
      if (!v) {
        apply();
        return;
      }
      const consent = (adult?: boolean) =>
        askPublish(
          'Publish your profile?',
          'Your name, your certificates, your work areas and your About you line become visible to anyone with your link or QR code. Your email, your progress and your notes stay private. Switching this off later removes the page and deletes what was published.',
          () => apply(adult),
        );
      // AGE GATE. A public page carrying a real name and work history is a
      // different product for a minor, so listing is 18+ (owner ruling
      // 2026-08-30). Asked ONCE per account — the server records the
      // attestation and refuses to create a listing without it, so a client
      // that skips this prompt still cannot publish.
      if (isAdultConfirmed()) {
        consent();
        return;
      }
      askYesNo(
        'Are you 18 or older?',
        'The public Registry listing is for adults only. Everything else in the app — your studies, your certificates and QR verification — works at any age.',
        'Yes, I am 18+',
        () => consent(true),
      );
    },
    [setPubKey, pub],
  );

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
    const statusLabel = academy
      ? 'ACADEMY MEMBER'
      : entitlement === 'lapsed'
        ? 'MEMBERSHIP LAPSED'
        : 'REFERENCE MODE';
    const statusColor = academy
      ? colors.green
      : entitlement === 'lapsed'
        ? colors.amber
        : colors.textSubAlt;
    const goalCount = certBundles.length + programBundles.length;
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <KeyboardAwareScrollView contentContainerStyle={styles.bodyScroll} keyboardShouldPersistTaps="handled" bottomOffset={24}>
          <View style={styles.headerRow}>
            <Text accessibilityRole="header" style={styles.college}>MY PROFILE</Text>
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

          {/* DIGITAL ID — pinned, never collapsible. Someone shows this at a
              load-in, so it answers three questions in order: who is this, what
              do they hold, how do I check. The QR was previously UNREACHABLE on
              this screen (it existed only in the retired institutional branch
              below), so the card that exists to be shown was the one thing you
              could not show. */}
          <Pressable
            style={({ pressed }) => [styles.idCard, pressed && styles.idCardPressed]}
            onPress={() => setFullIdOpen(true)}
            accessibilityRole="button"
            // An accessibilityLabel REPLACES the children for a screen reader,
            // so a label naming only the action silently deletes the name,
            // status, credential count and ID number from this card. Compose
            // the content INTO the label, then say what tapping does.
            accessibilityLabel={[
              pub.registryName || pub.name || profile?.nickname || 'No name added yet',
              statusLabel,
              credentials.length > 0
                ? `${credentials.length} verified credential${credentials.length === 1 ? '' : 's'}`
                : null,
              profile?.apeStudentId ? `ID ${profile.apeStudentId}` : null,
            ]
              .filter(Boolean)
              .join('. ')}
            accessibilityHint="Opens your ID full screen for scanning"
          >
            <View style={styles.idLeft}>
              <Text style={styles.idName} numberOfLines={2}>
                {pub.registryName || pub.name || profile?.nickname || 'Add your name'}
              </Text>
              <Text style={[styles.idStatus, { color: statusColor }]}>{statusLabel}</Text>
              {credentials.length > 0 ? (
                <Text style={styles.idHolds}>
                  {credentials.length} verified credential{credentials.length === 1 ? '' : 's'}
                </Text>
              ) : null}
              <View style={{ flex: 1 }} />
              {profile?.apeStudentId ? (
                <Text style={styles.idNumber}>ID {profile.apeStudentId}</Text>
              ) : null}
              <Text style={styles.idExpand}>SHOW FULL ID ›</Text>
            </View>
            <View style={styles.idRight}>
              <CredentialQr token={profile?.qrToken} size={104} />
              <Text style={styles.idScan}>SCAN TO VERIFY</Text>
            </View>
          </Pressable>

          {/* AM I PUBLIC RIGHT NOW? — the answer, readable without opening
              anything. Amber only in the one state the user can act on, where
              the strip is itself the button that fixes it. */}
          <Pressable
            style={[
              styles.strip,
              registryActive ? styles.stripOn : !profileComplete ? styles.stripTodo : styles.stripOff,
            ]}
            disabled={profileComplete}
            // `accessible` false + role text would still announce the Pressable's
            // auto-merged disabled state. When there is nothing to fix this is a
            // READOUT, so it carries no role and no hint — just its own words.
            accessibilityRole={profileComplete ? undefined : 'button'}
            accessibilityHint={profileComplete ? undefined : 'Opens the details you still need'}
            accessibilityLabel={
              registryActive
                ? 'Listed. Your public page is live.'
                : !profileComplete
                  ? `${missing.length} detail${missing.length === 1 ? '' : 's'} needed before you can be listed. Opens the form.`
                  : 'Private. You have no public page.'
            }
          >
            <View
              style={[
                styles.stripDot,
                {
                  backgroundColor: registryActive
                    ? colors.green
                    : !profileComplete
                      ? colors.amber
                      : '#3a3a3a',
                },
              ]}
            />
            <Text
              style={[
                styles.stripText,
                {
                  color: registryActive
                    ? colors.green
                    : !profileComplete
                      ? colors.amber
                      : colors.textSubAlt,
                },
              ]}
            >
              {registryActive
                ? 'LISTED — your public page is live'
                : !profileComplete
                  ? `${missing.length} detail${missing.length === 1 ? '' : 's'} needed to get listed ›`
                  : 'PRIVATE — no public page'}
            </Text>
          </Pressable>

          {/* Device controls stay on Profile (both were explicit owner requests)
              but now sit BELOW the identity rather than above the user's own
              name. Not collapsed: muting is a safety control. */}
          <LowLightRow />
          <AudioOutputRow />

          {/* TEMPORARY dev tool (user request 2026-07-18) — visual index of every
              screen + popup. Its own header says "REMOVE before release", but it
              carried NO __DEV__ guard, so a paying student could open a master
              index of every screen in the app from their own Profile (design
              review 2026-08-30). Guarded now; delete the file and this block
              when the tool is no longer wanted. */}
          {__DEV__ ? <DevVisualIndex /> : null}

          {/* —— MY PROGRESS —— */}
          <Section
            title="MY PROGRESS"
            summary={`${profile?.overallPct ?? 0}%${goalCount ? ` · ${goalCount} goals` : ''}`}
          >
            <Pressable
              style={({ pressed }) => [styles.navRow, pressed && styles.rowPressed]}
              onPress={() =>
                (navigation as any).navigate((profile?.completeCount ?? 0) > 0 ? 'Study' : 'Home')
              }
              accessibilityRole="button"
              accessibilityLabel={
                (profile?.overallPct ?? 0) > 0
                  ? `Full Course Certification, ${profile?.overallPct ?? 0}% done`
                  : 'Start your first topic'
              }
              accessibilityHint="Opens your studies"
            >
              <View style={styles.rowMain}>
                {(profile?.overallPct ?? 0) > 0 ? (
                  <>
                    <Text style={styles.rowLabel}>Full Course Certification</Text>
                    <Text style={styles.rowHint}>{profile?.overallPct ?? 0}% done</Text>
                  </>
                ) : (
                  <Text style={styles.rowLabel}>Start your first topic</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Text style={styles.groupLabel}>GOALS</Text>
            <Pressable
              style={({ pressed }) => [styles.navRow, pressed && styles.rowPressed]}
              onPress={() => (navigation as any).navigate('Awards', { category: 'enrollment' })}
              accessibilityRole="button"
              accessibilityLabel={
                goalCount
                  ? [...certBundles, ...programBundles]
                      .map((b) => `${b.name}, ${bundleDone(b.topics)} of ${b.topics.length} topics complete`)
                      .join('. ')
                  : 'Browse certificates and programs'
              }
              accessibilityHint={goalCount ? 'Opens My Enrollments' : undefined}
            >
              <View style={styles.rowMain}>
                {goalCount ? (
                  [...certBundles, ...programBundles].map((b) => (
                    <View key={b.key} style={styles.goalBundle}>
                      <Text style={styles.rowLabel}>{b.name}</Text>
                      <Text style={styles.rowHint}>
                        {bundleDone(b.topics)} of {b.topics.length} topics complete
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.rowLabel}>Browse certificates and programs</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Text style={styles.groupLabel}>YOUR NUMBERS</Text>
            {/* "Quizzes passed" and "Study streak" REMOVED (design review
                2026-08-30): both were literal em-dashes with no backend, which
                made the two real numbers beside them look broken too. */}
            <StatRow label="Terms learned" value={String(known.size)} />
            <StatRow label="Topics completed" value={String(profile?.completeCount ?? 0)} last />
            {caps.completionRecords ? (
              <Pressable
                style={({ pressed }) => [styles.navRow, pressed && styles.rowPressed]}
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
                <View style={styles.rowMain}>
                  <Text style={styles.rowLabel}>Trophies &amp; records</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ) : null}
          </Section>

          {/* —— PUBLIC PROFILE — the fields. Opens itself while something is
              missing, so the fix is already in front of you. —— */}
          <Section
            key={`public-profile-${ppSeq}-${hydrated}`}
            title="PUBLIC PROFILE"
            summary={profileComplete ? 'complete' : `${missing.length} to finish`}
            defaultOpen={ppSeq > 0 || (hydrated && !profileComplete)}
          >
            <Text style={styles.sectionIntro}>Changes save as you type.</Text>

            <Text style={styles.fieldLabel}>Your name</Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              value={pub.name}
              onChangeText={(t) => setPubKey('name', t)}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Your name"
            />
            <Text style={styles.rowHint}>Private. Used to greet you in the app.</Text>

            <Text style={styles.fieldLabel}>Name on your certificates</Text>
            <TextInput
              ref={registryNameRef}
              style={styles.input}
              value={pub.registryName}
              onChangeText={(t) => setPubKey('registryName', t)}
              placeholder="e.g. Rachel A. Booth"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Name on your certificates"
            />
            <Text style={styles.rowHint}>
              Printed on every certificate you earn, and shown when someone scans your code.
              Spell it the way you want it on paper.
            </Text>

            <Text style={styles.fieldLabel}>Contact email</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={pub.email}
              onChangeText={(t) => setPubKey('email', t)}
              onBlur={() => setEmailTouched(true)}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
              accessibilityLabel="Contact email"
            />
            {emailTouched && pub.email.trim().length > 0 && !emailValid ? (
              <Text style={styles.fieldError}>Add a full address, like you@studio.com</Text>
            ) : (
              <Text style={styles.rowHint}>
                How employers reach you if you switch on contact below. Never shown on your
                public page.
              </Text>
            )}

            <Text style={styles.fieldLabel}>About you</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={pub.bio}
              onChangeText={(t) => setPubKey('bio', t)}
              placeholder="e.g. FOH engineer, 6 years, clubs and worship"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={160}
              returnKeyType="done"
              accessibilityLabel="About you"
            />
            <Text style={styles.rowHint}>
              {registryActive
                ? 'Shown on your public page.'
                : 'Private until you get listed, then shown on your public page.'}
              {pub.bio.length > 120 ? `  ${pub.bio.length}/160` : ''}
            </Text>
          </Section>

          {/* —— AUDIO COMMUNITY DIRECTORY — a separate concept from credential
              verification (spec 2026-08-31 §4.4). Credentials are verified by
              their own permanent link; the community profile is an opt-in
              professional listing that can be published, hidden or deleted
              without touching them. —— */}
          <Section title="AUDIO COMMUNITY DIRECTORY" summary="opt-in">
            <Text style={styles.sectionIntro}>
              An optional professional listing: what you work in, what you specialise in, how
              you&apos;re involved, and what members may contact you about.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.navRow, pressed && styles.rowPressed]}
              onPress={() => (navigation as any).navigate('AudioCommunityDirectory')}
              accessibilityRole="button"
              accessibilityLabel="Open the Audio Community Directory"
              accessibilityHint="Explore members, edit your community profile, and see contact requests"
            >
              <View style={styles.rowMain}>
                <Text style={styles.rowLabel}>Open the Directory</Text>
                <Text style={styles.rowHint}>Explore · My Profile · Requests</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Section>

          {/* —— WHO CAN SEE ME — both publishing switches in ONE place, with a
              literal manifest between them. People refuse these toggles because
              they cannot tell what "listed" includes, not because they mind
              being listed. —— */}
          <Section
            title="WHO CAN SEE ME"
            summary={!profileComplete ? 'needs info' : registryActive ? 'LISTED' : 'private'}
          >
            <Text style={styles.sectionIntro}>
              Everything here is private unless you switch it on.
            </Text>

            {!profileComplete ? (
              <View style={styles.gapBox}>
                <Text style={styles.groupLabel}>BEFORE YOU CAN BE LISTED</Text>
                {gaps.map((g) => (
                  <Pressable
                    key={g.key}
                    style={styles.gapRow}
                    onPress={() => focusField(g.key)}
                    disabled={g.done}
                    accessibilityRole="button"
                    accessibilityLabel={
                      g.done ? `${g.label}, done` : `${g.label}, missing. Opens the field.`
                    }
                  >
                    <Text style={[styles.gapMark, g.done && styles.gapMarkDone]}>
                      {g.done ? '✓' : '○'}
                    </Text>
                    <Text style={[styles.gapLabel, g.done && styles.gapLabelDone]}>{g.label}</Text>
                    <View style={{ flex: 1 }} />
                    {g.done ? null : <Text style={styles.gapAction}>ADD ›</Text>}
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>List me in the Professional Registry</Text>
              <Toggle
                on={pub.showInRegistry}
                label="List me in the Professional Registry"
                disabled={!profileComplete}
                onChange={onRegistryToggle}
              />
            </View>
            <Text style={styles.rowHint}>
              Publishes a page anyone with the link — or who scans your code — can open.
            </Text>

            <View style={styles.manifest}>
              <Text style={styles.groupLabel}>ON YOUR PUBLIC PAGE</Text>
              <Text style={styles.manifestOn}>
                · {pub.registryName || pub.name || 'Your name'}
              </Text>
              <Text style={styles.manifestOn}>
                · {credentials.length} certificate{credentials.length === 1 ? '' : 's'} you have
                earned
              </Text>
              <Text style={styles.manifestOn}>
                ·{' '}
                {pub.interests.length
                  ? `What you work in (${pub.interests.length})`
                  : 'What you work in — none selected yet'}
              </Text>
              <Text style={styles.manifestOn}>
                · {pub.bio.trim() ? 'Your About you line' : 'Your About you line — empty'}
              </Text>
              <Text style={[styles.groupLabel, { marginTop: 12 }]}>NEVER PUBLISHED</Text>
              <Text style={styles.manifestOff}>· Your email address</Text>
              <Text style={styles.manifestOff}>· Your progress, quiz scores and notes</Text>
              <Text style={styles.manifestOff}>· The private name you are greeted by</Text>
            </View>

            {/* HONEST PRESENT TENSE: there is no Contact button and no message
                relay yet, so this records a preference and says exactly that.
                The old copy described a feature that did not exist. */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Open to being contacted about work</Text>
              <Toggle
                on={pub.contactConsent}
                label="Open to being contacted about work"
                onChange={(v) => setPubKey('contactConsent', v)}
              />
            </View>
            <Text style={styles.rowHint}>
              Saved as a preference for now. There is no message button yet — nobody can contact
              you through the Academy, and your email address is never published either way.
            </Text>

            <Text style={[styles.rowHint, { marginTop: 12 }]}>
              Turn listing off and your page goes offline and what was published is deleted.
              Certificates you have already earned stay verifiable by QR.
            </Text>
          </Section>

          {/* —— WHAT YOU WORK IN — published when listed, so the section says
              so rather than leaving the user to guess. "Why you're studying"
              was REMOVED entirely (owner 2026-08-30): one of its options was
              Church, and a study goal attached to a published name is religious
              affiliation — special-category data under GDPR Art. 9. It earned
              nothing that justified carrying that. —— */}
          <Section
            title="WHAT YOU WORK IN"
            summary={pub.interests.length ? `${pub.interests.length} selected` : 'none yet'}
          >
            <Text style={styles.sectionIntro}>
              {registryActive
                ? 'These appear on your public page.'
                : 'These appear on your public page if you get listed. Private until then.'}
            </Text>
            <Text style={styles.rowHint}>
              Tap to select. Press and hold one to make it your main field.
            </Text>
            <View style={{ height: 8 }} />
            <ChoiceChips
              options={INTEREST_TOPICS}
              isOn={(o) => pub.interests.includes(o)}
              onPick={toggleInterest}
              onLongPick={promotePrimary}
              starred={pub.primaryInterest}
            />
          </Section>

          {/* —— CREDENTIALS — every non-revoked certificate/program the user
              holds. Hidden entirely when none are earned: an empty trophy case
              on a new account reads as a failure rather than a not-yet. —— */}
          {credentials.length > 0 ? (
            <Section title="CREDENTIALS" summary={String(credentials.length)}>
              {credentials.map((c) => (
                <View key={`${c.type}:${c.id}`} style={styles.credRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.credName}>{c.name}</Text>
                    <Text style={styles.credMeta}>
                      {c.type === 'program' ? 'PROGRAM' : 'CERTIFICATE'}
                      {c.levelOrTier ? ` · ${c.levelOrTier}` : ''}
                      {c.awardedAt ? ` · ${fmtCredDate(c.awardedAt)}` : ''}
                    </Text>
                  </View>
                  {certificateExportAvailable() && (
                    <Pressable
                      onPress={() => onExportCredential(c)}
                      disabled={exportingId === c.id}
                      style={styles.credButton}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Download the ${c.name} certificate`}
                    >
                      <Text style={styles.credAction}>
                        {exportingId === c.id ? 'PREPARING…' : 'PDF'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
              {!certificateExportAvailable() && (
                <Text style={styles.rowHint}>Certificate download needs the next app build.</Text>
              )}
              {credMessage != null && <Text style={styles.rowHint}>{credMessage}</Text>}
            </Section>
          ) : null}

          {/* FULL-SCREEN ID — the point of a digital credential is that someone
              else scans it, across a table, in a dark venue. The inline QR is a
              preview; this is the one you hold up. */}
          <Modal
            visible={fullIdOpen}
            transparent={false}
            animationType="fade"
            onRequestClose={closeFullId}
            supportedOrientations={['portrait', 'landscape']}
          >
            <Pressable
              style={styles.fullId}
              onPress={closeFullId}
              accessibilityRole="button"
              accessibilityLabel="Close your ID"
            >
              <Text style={styles.fullIdName}>
                {pub.registryName || pub.name || 'Add your name'}
              </Text>
              <Text style={[styles.idStatus, { color: statusColor, marginBottom: 22 }]}>
                {statusLabel}
              </Text>
              <CredentialQr token={profile?.qrToken} size={248} />
              {profile?.apeStudentId ? (
                <Text style={styles.fullIdNumber}>ID {profile.apeStudentId}</Text>
              ) : null}
              {lowLight ? (
                <Pressable
                  style={styles.brighten}
                  onPress={() => setBrightId((b) => !b)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    brightId
                      ? 'Dim the ID again. Low-light is paused while this card is open.'
                      : 'Brighten to scan. Lifts low-light until you close this card.'
                  }
                >
                  <Text style={styles.brightenText}>
                    {brightId ? 'DIM AGAIN' : 'BRIGHTEN TO SCAN'}
                  </Text>
                </Pressable>
              ) : null}
              <Text style={styles.fullIdHint}>
                {brightId ? 'Low-light resumes when you close this' : 'Tap anywhere to close'}
              </Text>
              {/* A Modal renders in its OWN native view hierarchy, so the root
                  LowLightDim does not reach it — which is why ShareTermSheet,
                  StudyFsOverlay and TrophyModal each re-mount it. Without this
                  the ID is the one surface that ignores Low-Light Production
                  Mode, and it opens full-bright white in a dark venue: exactly
                  the flash the mode promises will not happen. */}
              {brightId ? null : <LowLightDim />}
            </Pressable>
          </Modal>

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
        <View style={styles.idCardLegacy}>
          <View style={[styles.pilotDot, { left: 7 }]} />
          <View style={[styles.pilotDot, { right: 7 }]} />
          {profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={styles.avatarImg}
              accessibilityRole="image"
              accessibilityLabel="Your profile photo"
            />
          ) : (
            <LinearGradient colors={['#ffd35e', '#f09e1a']} style={styles.avatar}>
              <Text style={styles.avatarInitials}>{profile?.initials ?? '–'}</Text>
            </LinearGradient>
          )}
          <Text style={styles.nickname}>{(profile?.nickname ?? '—').toUpperCase()}</Text>
          <Text style={styles.apeId}>{profile?.apeStudentId ?? ''}</Text>

          {/* Real credential QR (owner 2026-08-21): encodes the Academy Registry
              lookup URL for this user's permanent qr_token. Falls back to an
              honest pending tile when the token isn't loaded yet. */}
          <CredentialQr token={profile?.qrToken} size={120} />
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

  // --- Restructured commercial Profile (design review 2026-08-30) ---
  // Pinned digital ID: identity left, the scannable code right, at the size a
  // phone camera actually resolves across a table.
  idCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.deepBorder,
    borderRadius: 12,
    padding: 14,
  },
  idCardPressed: { backgroundColor: '#1f1f1f' },
  idLeft: { flex: 1, minHeight: 118 },
  idName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: 0.4,
    color: colors.textPrimary,
  },
  idStatus: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    marginTop: 5,
  },
  idHolds: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    color: colors.textSub,
    marginTop: 4,
  },
  idNumber: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: colors.textMutedDeep,
  },
  idExpand: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.amber,
    marginTop: 6,
  },
  idRight: { alignItems: 'center', gap: 6 },
  idScan: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.textMutedDeep,
  },

  // Persistent "am I public right now" strip.
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  stripOn: { backgroundColor: '#0d1f14', borderColor: 'rgba(55,224,95,.45)' },
  stripTodo: { backgroundColor: '#1e1a10', borderColor: 'rgba(255,198,77,.45)' },
  stripOff: { backgroundColor: '#151515', borderColor: colors.hairlineAlt },
  stripDot: { width: 8, height: 8, borderRadius: 4 },
  stripText: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1 },

  // Rows inside a Section.
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  rowPressed: { backgroundColor: '#1f1f1f', borderRadius: 8 },
  rowMain: { flex: 1, paddingRight: 10 },
  rowLabel: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textPrimary },
  rowHint: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  chevron: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: colors.textMutedDeep },
  groupLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.textMutedDeep,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionIntro: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSub,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  fieldError: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.amber,
    paddingHorizontal: 4,
    marginTop: 4,
  },

  // Gap checklist — each unmet line is its own button into the field.
  gapBox: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.32)',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 10,
  },
  gapRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, paddingHorizontal: 4 },
  gapMark: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.amber, width: 14 },
  gapMarkDone: { color: colors.green },
  gapLabel: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textPrimary },
  gapLabelDone: { color: colors.textMuted },
  gapAction: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.amber },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 4,
    marginTop: 14,
  },
  switchLabel: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textPrimary },

  // The manifest: what publishing actually publishes, in two literal lists.
  manifest: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 9,
    padding: 10,
    marginTop: 12,
  },
  manifestOn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  manifestOff: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textMuted },

  fullId: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullIdName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 26,
    letterSpacing: 0.6,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fullIdNumber: {
    fontFamily: fonts.oswaldMedium,
    fontSize: 13,
    letterSpacing: 1.6,
    color: colors.textSub,
    marginTop: 20,
  },
  brighten: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    borderRadius: 8,
  },
  brightenText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.amber,
  },
  fullIdHint: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    color: colors.textMutedDeep,
    marginTop: 28,
  },

  // Networking profile form.
  fieldLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 5,
  },
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
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  credButton: { minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  credName: { fontFamily: fonts.barlowSemiBold, fontSize: 14.5, color: colors.textPrimary },
  credMeta: {
    fontFamily: fonts.barlowCondensedRegular,
    fontSize: 11.5,
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginTop: 2,
  },
  credAction: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.amber,
  },
  // Registry participation readout — gray when off, green when active (user
  // request 2026-07-23).

  // --- Redesigned commercial Profile (user request 2026-07-18) ---


  // Each enrolled cert/program row inside its goals panel (owner 2026-08-07).
  goalBundle: { marginTop: 8 },

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

  idCardLegacy: {
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

  panel: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: colors.hairlineAlt,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  // Institutional Mode row (user request 2026-07-17) — disabled switch +
  // tappable label opening the parked-modules container.

  // CM7 commercial variant.

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
