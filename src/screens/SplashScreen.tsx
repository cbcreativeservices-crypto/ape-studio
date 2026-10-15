/**
 * S0 — Splash (design-reference 09-s0-splash.dc.html + seed brief §3 S0).
 * BrandLogo 225px + wordmark, amber fade-in, auto-advance 2–3s on a session
 * check: session → Main (Dashboard), else → Auth. Uses navigation.reset so the
 * splash can't be returned to via back.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { PartialRoute, Route } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../components/BrandLogo';
import { BRAND_MAX_FONT_SCALE, colors, fonts } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import { clearPendingLink } from '../navigation/pendingLink';
import { splashBase } from '../navigation/splashRoute';
import { safeSessionResult } from '../lib/getSessionSafe';
import { warmCardArt } from './courses/CourseSelectionScreen';
import { softDeadline } from '../lib/boundedCall';
import { notify } from '../lib/confirm';
import { checkMyAccountRecord, signOutHalfCreatedAccount } from '../features/auth/api';
import { ACCOUNT_SETUP_UNFINISHED_SIGN_IN } from '../features/auth/authErrorCopy';
// The reset-in-progress flag, loaded on first use (during the hold, after
// the first frame): the app-start module graph is capped (test/perfStartTrim).
type ResetFlag = typeof import('../features/auth/passwordResetPending');
const resetFlag = (): ResetFlag => require('../features/auth/passwordResetPending') as ResetFlag;
const isPasswordResetPending = () => resetFlag().isPasswordResetPending();
const clearPasswordResetPending = () => resetFlag().clearPasswordResetPending();

/** What the launch does with a signed-in session (see launchVerdict below). */
type LaunchVerdict = 'proceed' | 'resetUnfinished' | 'setupUnfinished';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    Animated.timing(textOpacity, { toValue: 1, duration: 1600, useNativeDriver: true }).start();

    let cancelled = false;
    // Kick the session read off IMMEDIATELY so it resolves DURING the 2.5 s intro
    // hold instead of adding its latency AFTER it (load-audit 2026-09-09). Routing
    // at the timer is then instant on a warm session; the intentional hold is kept.
    // `.catch` at creation: getSession() can REJECT (the native secure-store
    // adapter can fail on device), which would throw in the timer and leave the
    // app stuck on Splash forever. Default to the signed-out route instead
    // (bug audit 2026-09-09).
    // …and not it HANGING (never settling) either — a stalled native
    // secure-store read would leave the await pending forever and freeze the
    // app on Splash (QA Wave D, D-2 2026-09-10). The shared bound covers both
    // (a rejection or a stall → the signed-out route, as before) and also says
    // when a STORED session's refresh could not reach the server (hunt 8,
    // 2026-10-03) — see splashRoute.ts.
    const sessionSafe = safeSessionResult(supabase.auth.getSession(), 'Splash');
    // ⚡ WARM HOME DURING THE HOLD (perf hunt 2026-10-03). A signed-in launch
    // lands on Home, whose carousel art used to start loading only once Home
    // had mounted — after the 2.5 s hold — so the first cards sat on their
    // dark fallback. Started once the session read answers (so it never
    // competes with a token refresh) and only for the Main route; a guest's
    // next screen is the login, not Home. Idempotent, best-effort.
    void sessionSafe
      .then((read) => {
        if (!cancelled && splashBase(read) === 'Main') warmCardArt();
      })
      .catch(() => {});
    // ⛔ TWO SIGNED-IN LAUNCHES THAT MUST NOT GO IN (toddler hunt 2026-10-14,
    // items 7 + 8, owner-approved) — decided DURING the hold, from the same
    // session read:
    //   • a password reset left unfinished (a valid code, app closed before
    //     the new password was set — features/auth/passwordResetPending);
    //   • a half-created account: signed in, but the app record was never
    //     made. Only a DEFINITIVE "no record" counts (checkAccountRecord reads
    //     twice around getSession() — the cold-start race); an offline or slow
    //     read goes in as before, so a member is never signed out by a blip.
    const launchVerdict: Promise<LaunchVerdict> = sessionSafe
      .then(async (read): Promise<LaunchVerdict> => {
        const pending = await softDeadline(() => isPasswordResetPending(), false, 'Splash/resetPending', 3000);
        if (splashBase(read) !== 'Main') {
          // Nothing signed in to undo; a stale flag is just dropped.
          if (pending) void clearPasswordResetPending();
          return 'proceed';
        }
        if (pending) return 'resetUnfinished';
        return (await checkMyAccountRecord()) === 'missing' ? 'setupUnfinished' : 'proceed';
      })
      .catch((): LaunchVerdict => 'proceed');
    const timer = setTimeout(async () => {
      let read = await sessionSafe;
      if (cancelled) return;
      // The record check is given a short extra wait past the hold, then the
      // launch goes in (an unanswered check is "unknown", never "missing").
      const verdict = await softDeadline(() => launchVerdict, 'proceed' as LaunchVerdict, 'Splash/launchCheck', 4000);
      if (cancelled) return;
      let notice: string | null = null;
      if (verdict !== 'proceed') {
        // Bounded, local, never rejects; marked intentional (no expiry bounce).
        await signOutHalfCreatedAccount();
        if (verdict === 'resetUnfinished') await clearPasswordResetPending();
        if (cancelled) return;
        read = { result: { data: { session: null } }, timedOut: false } as typeof read;
        notice =
          verdict === 'resetUnfinished'
            ? 'Your password reset didn’t finish, so you’ve been signed out. Sign in, or tap “Reset via email” to start again.'
            : ACCOUNT_SETUP_UNFINISHED_SIGN_IN;
      }
      // Boot: session → Main (Dashboard), else → the finished login screen.
      // The pre-auth commercial Landing is still WIP, so startup does NOT route
      // to it (owner 2026-08-06) — reinstate that branch when Landing is done.
      //
      // KEEP WHAT WAS PUSHED OVER THE SPLASH (B-047): a cold start from a
      // push/local-notification tap navigates (WeeklyConcept / Awards / Main)
      // within milliseconds of the container being ready — i.e. on top of this
      // screen, before the timer fires. A bare reset threw that away, so the
      // tapped card showed for ~2.5 s and vanished. Carry those routes over the
      // new base instead (same keys → the mounted screens survive). Without a
      // session, the Main shell must not be kept; anything else still closes
      // back onto Auth.
      // A signed-in user needs no resume: React Navigation's linking already
      // pushed the deep-linked screen over this one, and the carry-over below
      // keeps it. Drop the remembered destination so a later sign-out →
      // sign-in in the same launch cannot replay a stale link (2026-09-05).
      // ⚠️ An ANONYMOUS session is not an account. The glossary's temporary
      // device key is a real Supabase session, so `data.session` alone would
      // route every guest who accepted it straight past the login screen for
      // good — and Settings' "Sign in / create account" (which resets to
      // Splash) would bounce them right back into the app. Ask for an ACCOUNT.
      // …and a member whose stored session could not be REFRESHED offline is
      // still signed in (hunt 8): splashBase says Main for exactly that.
      const base = splashBase(read);
      const signedIn = base === 'Main';
      if (signedIn) clearPendingLink();
      const pushed: PartialRoute<Route<keyof RootStackParamList>>[] = navigation
        .getState()
        .routes.filter((r) => r.name !== 'Splash')
        .map((r) => ({ key: r.key, name: r.name, params: r.params }));
      const baseRoute = pushed.find((r) => r.name === base) ?? { name: base };
      // NOTHING SITS ABOVE `Auth` (2026-09-17, bug-hunt pass 2).
      //
      // This filtered out only `Main`, so a deep link that had already pushed
      // its destination — say a members-only lab — stayed on the stack ABOVE the
      // login screen, and a signed-out person landed on the destination instead
      // of being asked to sign in. That was also the shortest real route into
      // the guest-purchase bug: link → members-only lab → SEE PLANS → charged
      // with no account to attach the purchase to.
      //
      // Dropping them loses nothing: the URL is still held in `pendingLink`
      // (which is deliberately NOT cleared on this branch) and is resumed after
      // sign-in, which is the behaviour the paywall's welcome already assumes.
      const above = signedIn ? pushed.filter((r) => r !== baseRoute) : [];
      navigation.reset({
        index: above.length,
        routes: [baseRoute, ...above],
      });
      if (notice) notify('Signed out', notice);
      // Hold the intro ~2.5s before advancing (Booth 2026-07-11).
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation, logoOpacity, textOpacity]);

  return (
    <View style={styles.root}>
      {/* Amber radial glow centered at 50%/42% (approximates the CSS radial-gradient). */}
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="42%" r="55%">
            <Stop offset="0%" stopColor="#ffb400" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#ffb400" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <Animated.View style={{ opacity: logoOpacity }}>
        <BrandLogo size={225} />
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        {/* Larger Text (build 32 tester): capped at the largest standard size
            and kept to one line, so the wordmark never breaks mid-word. */}
        <Text style={styles.proAudio} maxFontSizeMultiplier={BRAND_MAX_FONT_SCALE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          PRO AUDIO
        </Text>
        <Text style={styles.trainingAcademy} maxFontSizeMultiplier={BRAND_MAX_FONT_SCALE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          TRAINING ACADEMY
        </Text>
        <Text style={styles.glossary} maxFontSizeMultiplier={BRAND_MAX_FONT_SCALE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          The whole craft of audio in your pocket
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  textBlock: { alignItems: 'center', maxWidth: '100%', paddingHorizontal: 16 },
  // Silver gradient wordmark approximated with a light silver (RN text has no
  // background-clip gradient without MaskedView; revisit if pixel-matched needed).
  proAudio: {
    fontFamily: fonts.oswaldBold,
    fontSize: 34,
    letterSpacing: 1.36,
    color: '#e8e8e8',
  },
  trainingAcademy: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 5.2,
    color: colors.amber,
    marginTop: 2,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  // The official tagline (owner 2026-10-11). Mixed case, so a tighter
  // tracking than the all-caps wordmark lines above.
  glossary: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#777',
    marginTop: 12,
  },
});
