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
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { devBypass } from '../../config/devMode';
import { KeyboardAwareScrollView } from '../../features/keyboard/keyboardControllerSafe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { StudioButton } from '../../components/StudioButton';
import { TextField } from '../../components/TextField';
import { colors, fonts, spacing } from '../../theme/tokens';
import { clearLocalAccountData, resetAllLocalStores } from '../../features/account/clearLocalAccountData';
import { EMAIL_RE, passwordIssue, resetPassword, signIn } from '../../features/auth/api';
import { supabase } from '../../lib/supabase';
import { COPY } from '../../lib/copy';
import { registerCommercialUser } from '../../features/commercial/commercialAuth';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { AppWelcomeOverlay } from '../../features/intro/AppWelcomeOverlay';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const STAY_KEY = 'ape:stayLoggedIn';

export function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { setEntitlement } = useEntitlement();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Optional organization invitation / promo / access code (user request
  // 2026-07-22).
  const [accessCode, setAccessCode] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const persistStay = () => AsyncStorage.setItem(STAY_KEY, stayLoggedIn ? '1' : '0');

  const toHome = () => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });

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
      void enterGuest();
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
      // NOTE: the access/org/promo code is captured here and will be applied to
      // the new account once the server accepts it (backend frozen). The open
      // commercial signup handles the email + password today.
      const result = await registerCommercialUser(email.trim(), password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      await persistStay();
      // Mock entitlement → 'free' post-signup (server truth once wired).
      setEntitlement('free');
      toHome();
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
      await persistStay();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); // Study tab = Dashboard
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async () => {
    setError(null);
    setInfo(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter your email above first, then tap Reset via email.');
      return;
    }
    setBusy(true);
    try {
      const err = await resetPassword(email.trim());
      if (err) setError(err);
      else setInfo(`Password reset email sent to ${email.trim()}.`);
    } finally {
      setBusy(false);
    }
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

        {/* Stay logged in (login convenience). */}
        <Pressable
          style={styles.stayRow}
          onPress={() => setStayLoggedIn((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: stayLoggedIn }}
          accessibilityLabel="Stay logged in"
        >
          <View style={[styles.stayBox, stayLoggedIn && styles.stayBoxOn]}>
            {stayLoggedIn ? <Text style={styles.stayCheck}>✓</Text> : null}
          </View>
          <Text style={styles.stayLabel}>Stay logged in on this device</Text>
        </Pressable>

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
  // Stay-logged-in checkbox row.
  stayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stayBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayBoxOn: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: 'rgba(55,224,95,.12)' },
  stayCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#37e05f' },
  stayLabel: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSecondary },
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
