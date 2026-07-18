/**
 * S1 — Login / Registration (AUTH_FLOW v1.1 wireframes authoritative; visuals
 * from design-reference 10-s1-register / 11-s1-sign-in).
 *
 * States: Sign-In · Register "Step 1 of 2 — Verify" (AP&E ID + code) ·
 * Register "Step 2 of 2 — Create Account" (email + password + confirm).
 *
 * ⚠️ Flow note (flagged D-2, needs Booth ruling): the deployed backend has NO
 * pre-session verify RPC and anon cannot read `users`, so Step-1 [VERIFY] is
 * LOCAL validation only; the real ID/code check happens inside CREATE ACCOUNT
 * (signUp → register_student). RPC failures route back to Step 1 with the
 * locked error copy. Consequence: the wireframe's "Welcome, [Nickname]!"
 * cannot show a real nickname pre-registration — we render "Welcome!".
 *
 * Routing (seed brief §2): register success → Course Selection (Home tab) ·
 * sign-in success → Dashboard (Study tab).
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../../components/BrandLogo';
import { StudioButton } from '../../components/StudioButton';
import { TextField } from '../../components/TextField';
import { colors, fonts, spacing } from '../../theme/tokens';
import {
  EMAIL_RE,
  REGISTER_ERROR_COPY,
  ensureSession,
  passwordIssue,
  registerStudent,
  resetPassword,
  signIn,
} from '../../features/auth/api';
import { COPY } from '../../lib/copy';
import { registerCommercialUser } from '../../features/commercial/commercialAuth';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
// CM5: 'commercial' = open email+password signup (no class code required).
type Mode = 'signIn' | 'register1' | 'register2' | 'commercial';

export function AuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // CM5: in commercialMode the default register path is the open (email+
  // password) signup; the class-code path stays reachable via a link.
  const { commercialMode, setEntitlement } = useEntitlement();
  const [mode, setMode] = useState<Mode>(commercialMode ? 'commercial' : 'register1');

  // Register fields
  const [apeId, setApeId] = useState('');
  const [regCode, setRegCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => {
    setError(null);
    setInfo(null);
    setMode(m);
  };

  /* Step 1 [VERIFY] — local validation only (see header note). */
  const onVerify = () => {
    const id = apeId.trim().toUpperCase();
    if (!id || !regCode.trim()) {
      setError('Enter your AP&E Student ID and registration code.');
      return;
    }
    setApeId(id);
    switchMode('register2');
  };

  /* Step 2 [CREATE ACCOUNT] — signUp → register_student. */
  const onCreateAccount = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    const pwIssue = passwordIssue(password);
    if (pwIssue) {
      setError(pwIssue);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const sessionErr = await ensureSession(email.trim(), password);
      if (sessionErr) {
        setError(sessionErr);
        return;
      }
      const result = await registerStudent(apeId.trim(), regCode.trim());
      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Home' } }],
        });
        return;
      }
      // ID/code rejected → back to Step 1 with the locked copy. The auth
      // session is kept so a corrected retry skips signUp (resumable flow).
      setMode(result.error_code === 'internal_error' ? 'register2' : 'register1');
      setError(REGISTER_ERROR_COPY[result.error_code] ?? REGISTER_ERROR_COPY.internal_error);
    } finally {
      setBusy(false);
    }
  };

  /* CM5 [CREATE ACCOUNT] commercial — open email+password (RPC stubbed). */
  const onCreateCommercial = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    const pwIssue = passwordIssue(password);
    if (pwIssue) {
      setError(pwIssue);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await registerCommercialUser(email.trim(), password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Mock entitlement → 'free' post-signup (server truth once wired; setter
      // is __DEV__-guarded so release builds no-op and defer to the server).
      setEntitlement('free');
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = async () => {
    setError(null);
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

  const isRegister = mode !== 'signIn';
  const isTwoStep = mode === 'register1' || mode === 'register2'; // class-code flow
  const step = mode === 'register1' ? 1 : 2;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header — logo 104 + wordmark (design-reference) */}
        <View style={styles.header}>
          <BrandLogo size={104} />
          <Text style={styles.wordmark}>
            Pro Audio <Text style={styles.wordmarkAccent}>Training Academy</Text>
          </Text>
          {mode === 'signIn' && <Text style={styles.glossaryEyebrow}>PROFESSIONAL AUDIO GLOSSARY</Text>}
        </View>

        {/* Step indicator — class-code (two-step) flow only. */}
        {isTwoStep && (
          <View>
            <Text style={styles.stepLabel}>
              {step === 1 ? 'STEP 1 OF 2 — VERIFY' : 'STEP 2 OF 2 — CREATE ACCOUNT'}
            </Text>
            <View style={styles.stepBars}>
              <View style={[styles.stepBar, styles.stepBarLit]} />
              <View style={[styles.stepBar, step === 2 && styles.stepBarLit]} />
            </View>
          </View>
        )}

        {mode === 'commercial' && <Text style={styles.welcome}>Create your account</Text>}
        {/* Beta pricing note on signup (Booth 2026-07-18). */}
        {mode === 'commercial' && <Text style={styles.betaNote}>{COPY.betaPricingNote}</Text>}
        {mode === 'register2' && <Text style={styles.welcome}>Welcome!</Text>}

        {/* Fields */}
        {mode === 'register1' && (
          <>
            <TextField
              label="AP&E Student ID"
              value={apeId}
              onChangeText={setApeId}
              placeholder="APE-2026-0148"
              mono
              autoCapitalize="characters"
            />
            <TextField
              label="Registration Code"
              value={regCode}
              onChangeText={setRegCode}
              placeholder="Enter the code from your professor"
              autoCapitalize="characters"
            />
          </>
        )}

        {(mode === 'register2' || mode === 'commercial') && (
          <>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder={mode === 'commercial' ? 'you@email.com' : 'you@student.miramar.edu'}
              keyboardType="email-address"
            />
            <TextField label="Password" value={password} onChangeText={setPassword} password />
            <TextField label="Confirm Password" value={confirm} onChangeText={setConfirm} password />
          </>
        )}

        {mode === 'signIn' && (
          <>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@student.miramar.edu"
              keyboardType="email-address"
            />
            <TextField label="Password" value={password} onChangeText={setPassword} password />
          </>
        )}

        {/* Error / info */}
        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        {/* Primary action */}
        {busy ? (
          <View style={styles.busyWrap}>
            <ActivityIndicator color={colors.amber} />
          </View>
        ) : (
          <StudioButton
            label={
              mode === 'register1'
                ? 'Verify'
                : mode === 'register2' || mode === 'commercial'
                  ? 'Create Account'
                  : 'Sign In'
            }
            variant="primary"
            onPress={
              mode === 'register1'
                ? onVerify
                : mode === 'commercial'
                  ? onCreateCommercial
                  : mode === 'register2'
                    ? onCreateAccount
                    : onSignIn
            }
          />
        )}

        {/* Footer links (locked copy) */}
        {mode === 'signIn' ? (
          <>
            <Text style={styles.footerText}>
              Forgot password?{' '}
              <Text style={styles.footerLink} onPress={busy ? undefined : onResetPassword}>
                Reset via email
              </Text>
            </Text>
            <Text style={styles.footerText}>
              New user?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => switchMode(commercialMode ? 'commercial' : 'register1')}
              >
                Register
              </Text>
            </Text>
          </>
        ) : (
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => switchMode('signIn')}>
              Sign In
            </Text>
          </Text>
        )}

        {/* CM5: commercial signup keeps the class-code path one tap away. */}
        {mode === 'commercial' && (
          <Pressable onPress={() => switchMode('register1')} hitSlop={8}>
            <Text style={styles.classCodeLink}>I have a class code</Text>
          </Pressable>
        )}

        {mode === 'register2' && (
          <Pressable onPress={() => switchMode('register1')} hitSlop={8}>
            <Text style={styles.backLink}>‹ Back to Step 1</Text>
          </Pressable>
        )}

        {/* CM5: from the class-code flow, offer the open path back. */}
        {mode === 'register1' && commercialMode && (
          <Pressable onPress={() => switchMode('commercial')} hitSlop={8}>
            <Text style={styles.classCodeLink}>No class code? Create a personal account</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  wordmark: { fontFamily: fonts.oswaldBold, fontSize: 21, color: colors.textPrimary, paddingVertical: 5 },
  wordmarkAccent: { fontFamily: fonts.oswaldMedium, color: colors.amber },
  glossaryEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    letterSpacing: 2.1,
    color: '#7a7a7a',
  },
  stepLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.7, color: '#cccccc' },
  stepBars: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#2a2a2a' },
  stepBarLit: {
    backgroundColor: colors.amberDeep,
    shadowColor: 'rgba(255,180,0,.5)',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  welcome: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textPrimary },
  // Beta pricing note (Booth 2026-07-18).
  betaNote: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.amberLabel },
  error: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.red },
  info: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 19, color: colors.green },
  busyWrap: { height: 48, alignItems: 'center', justifyContent: 'center' },
  footerText: {
    textAlign: 'center',
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: '#888888',
  },
  footerLink: {
    fontFamily: fonts.barlowSemiBold,
    color: colors.amber,
    textShadowColor: 'rgba(255,180,0,.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  backLink: {
    textAlign: 'center',
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    color: colors.textMuted,
  },
  classCodeLink: {
    textAlign: 'center',
    fontFamily: fonts.barlowSemiBold,
    fontSize: 13,
    color: '#5bb0ff',
    textDecorationLine: 'underline',
  },
});
