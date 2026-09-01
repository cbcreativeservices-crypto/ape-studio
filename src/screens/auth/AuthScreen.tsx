/**
 * S1 — single entry screen (user request 2026-07-22). One screen, three actions:
 *   • GUEST MODE (Free) — enter the app with no account (device-local, nothing
 *     saved).
 *   • CREATE ACCOUNT — email + password (+ optional organization/promo access
 *     code) → an individual account.
 *   • LOGIN — email + password for a returning user, with "Stay logged in" so
 *     the session is remembered and this screen is bypassed next time.
 *
 * The organization access code is optional and, alongside a promo code, is added
 * to the credentials above at CREATE ACCOUNT time. Backend is frozen, so the
 * server wiring for the code + real session persistence lands later; the mock
 * entitlement setter is __DEV__-guarded (release builds defer to the server).
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devBypass } from '../../config/devMode';
import { DEV_ENTITLEMENT_KEY } from '../../config/flags';
import { KeyboardAwareScrollView } from '../../features/keyboard/keyboardControllerSafe';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { StudioButton } from '../../components/StudioButton';
import { TextField } from '../../components/TextField';
import { colors, fonts, spacing } from '../../theme/tokens';
import { clearLocalAccountData, resetAllLocalStores } from '../../features/account/clearLocalAccountData';
import { getDeviceId } from '../../features/account/deviceIdentity';
import { claimThisDevice, getActiveDeviceId } from '../../features/account/singleDevice';
import {
  EMAIL_RE,
  passwordIssue,
  requestPasswordReset,
  signIn,
  updatePassword,
  verifyRecoveryOtp,
} from '../../features/auth/api';
import { supabase } from '../../lib/supabase';
import { COPY } from '../../lib/copy';
import { registerCommercialUser } from '../../features/commercial/commercialAuth';
import { redeemAccessCode } from '../../features/commercial/accessCode';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { AppWelcomeOverlay } from '../../features/intro/AppWelcomeOverlay';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { setEntitlement, refreshEntitlement } = useEntitlement();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Optional organization invitation / promo / access code (user request
  // 2026-07-22).
  const [accessCode, setAccessCode] = useState('');

  // Password recovery (in-app OTP, no deep link) — see features/auth/api.ts.
  const [mode, setMode] = useState<'main' | 'recovery'>('main');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toHome = () => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });
  const toMain = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  /* SINGLE-DEVICE LOGIN (owner 2026-08-21): claim this device as the account's
   * active one, prompting first if another device already holds it. On confirm
   * we take over (the other device signs out on its next foreground); on cancel
   * we sign back out and stay. Fails open (un-migrated backend → just proceed). */
  const claimAndProceed = async (proceed: () => void) => {
    const [active, mine] = await Promise.all([getActiveDeviceId(), getDeviceId()]);
    if (active && active !== mine) {
      setBusy(false);
      Alert.alert(
        'Already signed in elsewhere',
        'This account is signed in on another device. Continue here and sign that device out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              void supabase.auth.signOut().catch(() => {});
            },
          },
          {
            text: 'Continue',
            onPress: () => {
              void claimThisDevice().then(proceed);
            },
          },
        ],
      );
      return;
    }
    await claimThisDevice();
    proceed();
  };

  /* GUEST MODE — free, no account, nothing saved. Signs out any lingering
   * session FIRST (owner bug 2026-08-06): the Dashboard keys its guest-safe
   * load path on the REAL session, so a stale broken session (e.g. an account
   * with no student record) following the guest into Main recreated the
   * load-error retry loop forever. */
  const enterGuest = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // Offline sign-out failure is fine — local session is still cleared.
    }
    // Guest Mode is a deliberate "fresh, no account" start (user bug 2026-08-12):
    // wipe the previous account's device-local data — the enrollment list, Home
    // cards, lab/tool state — so a no-account guest never INHERITS it (and so it
    // can't open a locked topic a prior account had enrolled). Unlike a plain
    // sign-out, entering Guest Mode is never a temporary detour back to the same
    // account, so clearing here can't lose a returning user's data.
    await clearLocalAccountData();
    resetAllLocalStores();
    // Write the no-account marker so the next boot's sync sees the SAME
    // identity instead of null→'' and wiping again (QA night 2026-09-01).
    await AsyncStorage.setItem('ape:localUserId', '');
    setBusy(false);
    setEntitlement('anonymous');
    toHome();
  };

  // WEB PREVIEW ONLY (dev): auto-enter Guest Mode once so the browser preview
  // boots straight into the app. __DEV__-guarded via devBypass + Platform gate,
  // so the phone dev client and release builds are untouched. See devMode.ts.
  const autoGuestFired = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' && devBypass('webPreviewAutoGuest') && !autoGuestFired.current) {
      autoGuestFired.current = true;
      void (async () => {
        // Preserve the dev wordmark tier across the auto-guest wipe
        // (2026-08-31): guest entry clears every ape:* key and persists
        // 'anonymous', which stomped the stored tier on every web reload —
        // the browser-iterate workflow re-paywalled itself each boot. Same
        // web + devBypass gate as the auto-guest itself.
        const kept = await AsyncStorage.getItem(DEV_ENTITLEMENT_KEY);
        await enterGuest();
        if (kept === 'free' || kept === 'academy' || kept === 'lapsed') setEntitlement(kept);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* CREATE ACCOUNT — email + password (+ optional access/promo code). */
  const onCreateAccount = async () => {
    setError(null);
    setInfo(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    const pwIssue = passwordIssue(password);
    if (pwIssue) {
      setError(pwIssue);
      return;
    }
    setBusy(true);
    try {
      const result = await registerCommercialUser(email.trim(), password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Optional access/promo code (owner 2026-08-21: comp accounts / event
      // offers). Best-effort AFTER the account exists — a bad or not-yet-live
      // code never blocks the finished signup; the user just lands as free.
      const code = accessCode.trim();
      let granted = false;
      if (code) {
        const redeem = await redeemAccessCode(code);
        if (redeem.ok) {
          granted = true;
          await refreshEntitlement(); // pick up the granted academy entitlement
        } else {
          // Account is created + signed in; surface why the code didn't apply so
          // an influencer/event user knows to retry it (Settings → Redeem code).
          setBusy(false);
          Alert.alert('Account created', `${redeem.message}\n\nYou can add a code later in Settings.`, [
            { text: 'Continue', onPress: () => void claimAndProceed(toHome) },
          ]);
          return;
        }
      }
      // Mock entitlement → 'free' post-signup (server truth once wired). In
      // production setEntitlement no-ops; a granted code was already applied via
      // refreshEntitlement above, so only default to 'free' when nothing granted.
      if (!granted) setEntitlement('free');
      await claimAndProceed(toHome); // brand-new account → claims silently
    } finally {
      setBusy(false);
    }
  };

  /* LOGIN — returning user; "Stay logged in" remembers the session. */
  const onLogin = async () => {
    setError(null);
    setInfo(null);
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const err = await signIn(email.trim(), password);
      if (err) {
        setError(err);
        return;
      }
      await claimAndProceed(toMain); // Study tab = Dashboard (single-device claim)
    } finally {
      setBusy(false);
    }
  };

  /* FORGOT PASSWORD — send the 6-digit recovery code, then switch to the in-app
   * recovery panel (no deep link needed; see features/auth/api.ts). */
  const onResetPassword = async () => {
    setError(null);
    setInfo(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter your email above first, then tap Reset via email.');
      return;
    }
    setBusy(true);
    try {
      const err = await requestPasswordReset(email.trim());
      if (err) {
        setError(err);
        return;
      }
      setResetCode('');
      setNewPassword('');
      setMode('recovery');
      setInfo(`We emailed a 6-digit code to ${email.trim()}. Enter it below with your new password.`);
    } finally {
      setBusy(false);
    }
  };

  /* SET NEW PASSWORD — verify the emailed code (establishes a recovery session),
   * then update the password and drop straight into the app. */
  const onSubmitNewPassword = async () => {
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    const pwIssue = passwordIssue(newPassword);
    if (pwIssue) {
      setError(pwIssue);
      return;
    }
    setBusy(true);
    try {
      const verifyErr = await verifyRecoveryOtp(email.trim(), resetCode);
      if (verifyErr) {
        setError('That code is incorrect or expired. Request a new one and try again.');
        return;
      }
      const updateErr = await updatePassword(newPassword);
      if (updateErr) {
        setError(updateErr);
        return;
      }
      // verifyOtp left an active session; the password is now updated → go in.
      setMode('main');
      await claimAndProceed(toMain); // single-device claim on recovery sign-in
    } finally {
      setBusy(false);
    }
  };

  const cancelRecovery = () => {
    setMode('main');
    setError(null);
    setInfo(null);
    setResetCode('');
    setNewPassword('');
  };

  return (
    <View style={styles.root}>
      {/* Top-right RETURN — for someone who arrived here on purpose (e.g. a guest
          who tapped "Sign in" from a calculator) and changed their mind: go back
          and continue, rather than declining and having to reinitiate the login
          (owner 2026-08-13). Only shown when there's a screen to return to, so it
          never appears on the app's own sign-in entry point. */}
      {navigation.canGoBack() ? (
        <Pressable
          style={[styles.returnBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Return without signing in"
        >
          <Text style={styles.returnText}>RETURN ›</Text>
        </Pressable>
      ) : null}
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* Header — logo + wordmark */}
        <View style={styles.header}>
          <BrandLogo size={104} />
          <Text style={styles.wordmark}>
            Pro Audio <Text style={styles.wordmarkAccent}>Training Academy</Text>
          </Text>
        </View>

        {/* Beta pricing note on signup (Booth 2026-07-18). */}
        {/* Beta-pricing note removed from the login screen (user request 2026-07-26);
            still shown on the plan/paywall screens via COPY.betaPricingNote. */}

        {/* Credentials */}
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
        />
        {mode === 'recovery' ? (
          /* ---- In-app password recovery (OTP; no deep link) ---- */
          <>
            <Text style={styles.codeHint}>
              Enter the 6-digit code we emailed you, then choose a new password. The code expires shortly — tap
              Resend if it doesn’t arrive.
            </Text>
            <TextField
              label="6-digit code"
              value={resetCode}
              onChangeText={setResetCode}
              placeholder="123456"
              keyboardType="number-pad"
            />
            <TextField label="New password" value={newPassword} onChangeText={setNewPassword} password />

            {error && <Text style={styles.error}>{error}</Text>}
            {info && <Text style={styles.info}>{info}</Text>}

            {busy ? (
              <View style={styles.busyWrap}>
                <ActivityIndicator color={colors.amber} />
              </View>
            ) : (
              <View style={styles.btnStack}>
                <StudioButton label="Set New Password" variant="primary" onPress={onSubmitNewPassword} />
                <StudioButton label="Resend Code" variant="secondary" onPress={onResetPassword} />
                <StudioButton label="Cancel" variant="secondary" onPress={cancelRecovery} />
              </View>
            )}
          </>
        ) : (
          <>
            <TextField label="Password" value={password} onChangeText={setPassword} password />

            {/* Optional organization / promo access code + its explanation. */}
            <TextField
              label="Access or promo code (optional)"
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Enter a code, if you have one"
              autoCapitalize="characters"
            />
            <Text style={styles.codeHint}>
              Join with an access code — enter the invitation or access code provided by your employer, school, church,
              training organization, or other sponsoring institution.
            </Text>

            {/* Error / info */}
            {error && <Text style={styles.error}>{error}</Text>}
            {info && <Text style={styles.info}>{info}</Text>}

            {/* Actions */}
            {busy ? (
              <View style={styles.busyWrap}>
                <ActivityIndicator color={colors.amber} />
              </View>
            ) : (
              <View style={styles.btnStack}>
                <StudioButton label="Create Account" variant="primary" onPress={onCreateAccount} />
                <StudioButton label="Login" variant="secondary" onPress={onLogin} />
                <StudioButton label="Guest Mode (Free)" variant="secondary" onPress={enterGuest} />
              </View>
            )}

            {/* Footer — password reset */}
            <Text style={styles.footerText}>
              Forgot password?{' '}
              <Text style={styles.footerLink} onPress={busy ? undefined : onResetPassword}>
                Reset via email
              </Text>
            </Text>
            <Text style={styles.guestNote}>Guest Mode is free — but your progress isn’t saved without an account.</Text>
          </>
        )}
      </KeyboardAwareScrollView>

      {/* First-run greeting, shown OVER the login screen (user request 2026-07-23). */}
      <AppWelcomeOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  returnBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: 'rgba(20,20,20,0.72)',
  },
  returnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.textSecondary },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  wordmark: { fontFamily: fonts.oswaldBold, fontSize: 21, color: colors.textPrimary, paddingVertical: 5 },
  wordmarkAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  // Beta pricing note (Booth 2026-07-18).
  betaNote: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.amberLabel },
  // Access-code explanation (user request 2026-07-22).
  codeHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub, marginTop: -8 },
  error: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.red },
  info: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.green },
  busyWrap: { height: 48, alignItems: 'center', justifyContent: 'center' },
  btnStack: { gap: 12 },
  footerText: { textAlign: 'center', fontFamily: fonts.barlowRegular, fontSize: 13, color: '#888888' },
  footerLink: {
    fontFamily: fonts.barlowSemiBold,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  guestNote: { textAlign: 'center', fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
});
