/**
 * PaywallScreen — academy upgrade paywall (CM7). LIVE (owner 2026-08-21): wired
 * to expo-iap via features/commercial/purchase.ts — CONTINUE starts the store
 * purchase, the server verifies the receipt (validate-purchase edge function)
 * and writes the entitlement, then refreshEntitlement reflects it. Restore
 * Purchases re-grants a prior buy. FAILS SAFE: no native module / un-deployed
 * edge function → nothing is granted and the UI explains; never a fake unlock.
 * The plan prices below are display copy mirroring public.products; the store is
 * the source of truth at purchase. Store product IDs: features/commercial/
 * iapProducts.ts. Owner setup: docs/APE_IAP_PLAN_2026_08_21.md.
 */
import { Fragment, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { consumePendingLink } from '../../navigation/pendingLink';
import { navigateToPath } from '../../navigation/linking';
import { buyPlan, detachPaywallHandlers, initPurchases, restorePurchases } from '../../features/commercial/purchase';
import type { PlanId } from '../../features/commercial/iapProducts';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type Plan = { id: 'lifetime' | 'annual' | 'monthly'; name: string; price: string; sub: string; badge?: string };
// Illustrative — real products come from the store config (governance).
const PLANS: Plan[] = [
  { id: 'lifetime', name: 'Lifetime Academy', price: '$99.99', sub: 'One-time payment', badge: 'BEST VALUE' },
  // $59.99/yr vs $9.99×12 = $119.88 → 50.0% saved (Booth 2026-07-11 #6).
  { id: 'annual', name: 'Annual', price: '$59.99 / yr', sub: 'About $5/mo', badge: 'SAVE 50%' },
  { id: 'monthly', name: 'Monthly', price: '$9.99 / mo', sub: 'Cancel anytime' },
];

export function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshEntitlement, isMember, resolved, entitlement } = useEntitlement();
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [busy, setBusy] = useState(false);
  // Whether in-app purchasing is usable in THIS build (native module present +
  // store connection). Assume true until init says otherwise.
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let alive = true;
    const welcome = () => {
      Alert.alert('Welcome to Academy', 'Your Academy access is active. Enjoy!', [
        {
          text: 'Great',
          // DESTINATION THROUGH PURCHASE (2026-09-06): a deep link the user
          // followed into locked content is resumed once they have paid,
          // instead of dropping them back wherever the paywall opened.
          onPress: () => {
            const pending = consumePendingLink();
            if (!(pending && navigateToPath(pending))) navigation.goBack();
          },
        },
      ]);
    };
    // Reflect a server-verified purchase in the local entitlement. The MONEY
    // has already moved and the server has already written the row — so a
    // failed refresh here must never read as a failed purchase, and must never
    // strand the buyer on the spinner (error-triad audit 2026-09-13, stranding
    // #1: the old bare `.then` left `busy` spinning forever when getSession
    // rejected right after a charged purchase). refreshEntitlement no longer
    // rejects; FALSE means "read failed, tier kept" → offer an honest retry.
    const reflectPurchase = () => {
      refreshEntitlement()
        .catch(() => false) // belt-and-braces; the provider guards internally
        .then((tier) => {
          if (!alive) return;
          setBusy(false);
          // THE READ COMPLETING IS NOT THE SAME AS BEING A MEMBER (2026-09-17).
          // The old boolean resolved true for 'anonymous', 'free' and 'lapsed'
          // too, so this congratulated people whose membership had not landed —
          // including a guest who had just been charged and had no entitlement
          // at all. It now asks for the tier itself.
          //
          // The first attempt at this fix read a ref updated during render,
          // which a verification pass caught: the caller's `.then` is a
          // microtask and React schedules the state update on a later task, so
          // the ref still held the PRE-purchase tier and every successful
          // purchase reported as a failure. The value has to come back from the
          // call, which is what it now does.
          if (tier === 'academy') {
            welcome();
            return;
          }
          Alert.alert(
            // Ratified by the owner 2026-09-14
            'Purchase complete',
            // Ratified by the owner 2026-09-14
            'Your payment went through and your membership is recorded. We couldn’t refresh your access on this device yet — check your connection and retry.',
            [
              {
                text: 'Retry', // Ratified by the owner 2026-09-14
                onPress: () => {
                  setBusy(true);
                  reflectPurchase();
                },
              },
              // Leaving is safe: the entitlement is on the server and the next
              // boot read / auth event picks it up.
              { text: 'Later', style: 'cancel', onPress: () => navigation.goBack() }, // Ratified by the owner 2026-09-14
            ],
          );
        });
    };
    void initPurchases({
      onSuccess: () => {
        // Server verified the receipt + wrote the entitlement — reflect it now.
        reflectPurchase();
      },
      onError: (message) => {
        if (!alive) return;
        setBusy(false);
        if (message) Alert.alert('Purchase', message);
      },
    }).then((ok) => {
      if (alive) setAvailable(ok);
    });
    return () => {
      alive = false;
      // Detach only THIS SCREEN'S callbacks. The listeners themselves belong to
      // PurchaseListenerRoot and must outlive the paywall — tearing them down
      // here is what left Ask-to-Buy and SCA purchases with nowhere to land.
      detachPaywallHandlers();
    };
  }, [refreshEntitlement, navigation]);

  const onContinue = () => {
    // A paying member must never be walked into a duplicate store purchase
    // (QA night 2026-08-31). This guard has to FAIL SAFE: `isMember` is false
    // until the entitlement read resolves, so reading it alone would let a
    // member who arrives before that (a deep link, a cold launch on a slow
    // connection) fall straight through to buyPlan. Money is the one place
    // where "we don't know yet" must not mean "go ahead".
    if (!resolved) {
      Alert.alert('One moment', 'Still checking your membership — try again in a second.');
      return;
    }
    if (isMember) {
      Alert.alert(
        'You’re a member',
        'Your Academy access is already active. Manage or cancel in your app-store subscription settings.',
      );
      return;
    }
    // NO ACCOUNT, NO PURCHASE (2026-09-17, bug-hunt pass 2).
    //
    // This checked `resolved`, `isMember` and `available` and never whether
    // there was an account to attach the purchase to. A guest could therefore be
    // CHARGED: the store takes the money, `validate-purchase` answers
    // `not_authenticated`, and the buyer is shown "check your connection and
    // retry" — which will never work, because the problem is not the
    // connection. Restore fails identically, and nothing anywhere suggests
    // making an account. `finishTransaction` only runs on success, so on Play
    // the charge sits unacknowledged and auto-refunds after 72 hours; on the
    // App Store it does not.
    //
    // 'anonymous' is the tier for a guest or a device-key session, and `resolved`
    // above already guarantees this is a real read and not a not-known-yet.
    if (entitlement === 'anonymous') {
      Alert.alert(
        'Create an account first',
        'Membership is attached to your account, so you need one before you can buy. Creating it takes a moment, and your progress on this device comes with you.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Create account', onPress: () => (navigation as any).navigate('Auth') },
        ],
      );
      return;
    }
    if (!available) {
      Alert.alert(
        'Purchasing unavailable',
        'In-app purchases aren’t available in this build yet. Please update the app, or restore a previous purchase.',
      );
      return;
    }
    setBusy(true);
    buyPlan(selected as PlanId).catch((e: unknown) => {
      setBusy(false);
      Alert.alert('Purchase', (e as Error)?.message ?? 'The purchase could not be started.');
    });
  };

  // Restore is THREE honest states, never silent (Apple 3.1.1 restore control;
  // error-triad audit 2026-09-13 — the old boolean asserted "no previous
  // purchase was found" on a network failure, and the old catch just stopped
  // the spinner with no message).
  const onRestore = () => {
    // Restoring re-grants a purchase to an ACCOUNT, so a guest has nowhere to
    // put it: the receipt verifies, `validate-purchase` answers
    // `not_authenticated`, and the person is told to check their connection for
    // a problem that is not their connection (2026-09-17). Say the true thing.
    if (resolved && entitlement === 'anonymous') {
      Alert.alert(
        'Sign in to restore',
        'A previous purchase is restored to the account it was bought with, so sign in or create your account first — then try Restore again.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => (navigation as any).navigate('Auth') },
        ],
      );
      return;
    }
    setBusy(true);
    restorePurchases()
      .then(async (result) => {
        // `refreshed` means "their access is live on this device", so it asks
        // for the tier rather than for a completed read (2026-09-17) — telling
        // someone their access is restored when the tier still says free is the
        // same mistake the purchase path made.
        let refreshed = true;
        if (result === 'restored') {
          refreshed = (await refreshEntitlement().catch(() => false)) === 'academy';
        }
        setBusy(false);
        switch (result) {
          case 'restored':
            Alert.alert(
              'Purchases restored',
              refreshed
                ? 'Your Academy access has been restored.'
                : // Ratified by the owner 2026-09-14
                  'Your previous purchase was verified and your membership is recorded. We couldn’t refresh your access on this device yet — it will unlock shortly, or restart the app.',
              [{ text: 'Great', onPress: () => navigation.goBack() }],
            );
            return;
          case 'none':
            // The store ANSWERED and holds nothing — the only case this copy is true.
            Alert.alert('Nothing to restore', 'No previous Academy purchase was found for this store account.');
            return;
          case 'unavailable':
            Alert.alert(
              'Purchasing unavailable',
              // Ratified by the owner 2026-09-14
              'In-app purchases aren’t available in this build yet. Please update the app and try Restore again.',
            );
            return;
          default:
            Alert.alert(
              // Ratified by the owner 2026-09-14
              'Restore didn’t finish',
              // Ratified by the owner 2026-09-14
              'We couldn’t reach the store to check your purchases — check your connection and try again. If you were charged, your purchase is safe.',
            );
        }
      })
      .catch(() => {
        setBusy(false);
        Alert.alert(
          // Ratified by the owner 2026-09-14 (same strings as the store-unreachable case)
          'Restore didn’t finish',
          'We couldn’t reach the store to check your purchases — check your connection and try again. If you were charged, your purchase is safe.',
        );
      });
  };

  // Manage/Cancel route (Play "Subscriptions" checklist item; Apple parity).
  // Shown only to users with an active or lapsed sub-capable entitlement — a
  // quiet link, not a sales control. The Play deep link takes an optional
  // `sku`; the client cannot know WHICH sub the user holds (monthly/annual —
  // the entitlement row doesn't say), so we link the app's subscription list
  // via `package` and Play shows this app's subs. Package mirrors app.json
  // android.package.
  const onManage = () => {
    const url =
      Platform.OS === 'ios'
        ? 'itms-apps://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions?package=com.cbcreativeservices.apestudio';
    Linking.openURL(url).catch(() => {
      Alert.alert(
        // Ratified by the owner 2026-09-14
        'Manage subscription',
        // Ratified by the owner 2026-09-14
        'We couldn’t open your app-store subscription settings. Open the App Store or Play Store app and look under Subscriptions.',
      );
    });
  };

  // Terms/Privacy live on the academy site (web/app/terms, web/app/privacy) —
  // required beside the purchase controls (Apple 3.1.2 / Play Subscriptions).
  const openPolicy = (path: 'terms' | 'privacy') => {
    Linking.openURL(`https://www.proaudiotrainingacademy.com/${path}`).catch(() => {
      Alert.alert(
        // Ratified by the owner 2026-09-14
        'Page unavailable',
        // Ratified by the owner 2026-09-14
        `We couldn’t open the page — visit proaudiotrainingacademy.com/${path} in your browser.`,
      );
    });
  };

  const showManage = resolved && (entitlement === 'academy' || entitlement === 'lapsed');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
      >
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>ACADEMY MODE</Text>
        <Text style={styles.title}>{COPY.paywallTitle}</Text>
        {/* The allowance runs INLINE at the end of the first paragraph — the
            one that calls the glossary free (owner, governance R7).

            It was a separate muted BLOCK first. That read correctly but cost a
            margin above, a margin below and its own two lines, pushing the plan
            cards further below the fold — on a PURCHASE screen, where the owner
            called it out: "too much vertical spacing … requiring more
            scrolling". Tuning the ratio between those margins was optimising a
            local detail while making the screen worse globally.

            Nested inside the paragraph it keeps the muted colour that marks it
            as a qualifier rather than a sales line, is as tight to the claim as
            text can be, and costs only the line it wraps onto. The ratified
            string is still split at its own '\n\n' and `bodyNext` is back to
            exactly the blank line that break used to draw. */}
        {COPY.paywallBody.split('\n\n').map((para, i) => (
          <Text key={i} style={[styles.body, i > 0 && styles.bodyNext]}>
            {para}
            {i === 0 ? <Text style={styles.allowance}>{' ' + COPY.glossaryFreeAllowance}</Text> : null}
          </Text>
        ))}

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                aria-checked={active}
                // Screen readers heard "radio button" ×3 with no plan/price (E2-04).
                accessibilityLabel={`${p.name}${p.badge ? `, ${p.badge}` : ''}, ${p.price}, ${p.sub}`}
                style={[styles.plan, active && styles.planActive]}
              >
                <View style={styles.planHead}>
                  <Text style={styles.planName}>{p.name}</Text>
                  {p.badge && <Text style={styles.planBadge}>{p.badge}</Text>}
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
                {/* Annual's sub is the savings cue → green; others muted. */}
                <Text style={[styles.planSub, p.id === 'annual' && styles.planSubSave]}>{p.sub}</Text>
                {/* Per-card end-of-year deadline consolidated to ONE note under
                    the plans (owner 2026-08-21) — was repeated on all 3 tiers. */}
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Pricing-honesty promise at the decision point (owner 2026-08-21),
            echoing the onboarding "Commitment". The check + hairline divider make
            it read as a commitment, not a stray line. */}
        <View style={styles.promiseRow}>
          <Text style={styles.promiseCheck}>✓</Text>
          <Text style={styles.valueLine}>One membership. Not a series of extra charges.</Text>
        </View>

        {/* Single consolidated pricing/deadline note (Booth 2026-07-18; owner
            2026-08-21 made it the ONE place the end-of-year deadline appears). */}
        <Text style={styles.betaNote}>{COPY.betaPricingNote}</Text>

        {/* One consolidated renewal/legal line (owner 2026-08-21 — merged the
            two near-duplicate app-store notes). MOVED ABOVE the buy button
            2026-09-13 (string unchanged): the auto-renewal disclosure must be
            visible BEFORE the purchase control (Apple 3.1.2 / Play subs). */}
        <Text style={styles.legal}>
          Secure in-app purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the
          period ends — manage or cancel anytime in your app-store settings.
        </Text>
        {/* Terms/Privacy beside the purchase decision (store checklist). */}
        <View style={styles.policyRow}>
          <Pressable onPress={() => openPolicy('terms')} accessibilityRole="link" hitSlop={8}>
            {/* Ratified by the owner 2026-09-14 */}
            <Text style={styles.policyLink}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.policyDot}>·</Text>
          <Pressable onPress={() => openPolicy('privacy')} accessibilityRole="link" hitSlop={8}>
            {/* Ratified by the owner 2026-09-14 */}
            <Text style={styles.policyLink}>Privacy Policy</Text>
          </Pressable>
        </View>
        {busy ? (
          <View style={styles.busyWrap}>
            <ActivityIndicator color={colors.amber} accessibilityLabel="Working, please wait" />
          </View>
        ) : (
          <GlassButton
            label="CONTINUE"
            // Glossary blue (Booth 2026-07-11 #2) — matches UPGRADE TO ACADEMY.
            tint="blue"
            height={54}
            fontSize={15}
            onPress={onContinue}
          />
        )}
        <Pressable onPress={busy ? undefined : onRestore} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>
        {showManage && (
          <Pressable onPress={onManage} accessibilityRole="link" hitSlop={8}>
            {/* Ratified by the owner 2026-09-14 */}
            <Text style={styles.manage}>Manage subscription</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  close: { position: 'absolute', top: 0, right: 0, zIndex: 2, padding: 16, marginTop: 8 },
  closeGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, lineHeight: 29, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  allowance: { color: colors.textMuted },
  // 6 above against the paragraph break's 2x below: proximity is what says
  // this line belongs to the CLAIM, not to the paragraph after it (owner, seen
  // on the Pixel — at 10 it read as floating between the two). The break below
  // stays exactly one lineHeight, so the ratified paragraph rhythm is untouched.
  // Reinstates the blank line the single <Text> drew for '\n\n' (= one lineHeight).
  bodyNext: { marginTop: 22 },

  plans: { gap: 12, marginTop: 6 },
  // Pricing-honesty promise (owner 2026-08-21): a check + hairline divider so it
  // reads as a commitment at the decision point.
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  promiseCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: '#5bff85' },
  valueLine: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Single consolidated pricing/deadline note (Booth 2026-07-18).
  betaNote: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.amberLabel },
  plan: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2c2c2c',
    backgroundColor: '#151515',
    padding: 16,
    paddingRight: 44,
  },
  planActive: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary },
  planBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#5bff85',
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  planPrice: { fontFamily: fonts.oswaldBold, fontSize: 20, color: colors.amber, marginTop: 4 },
  planSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 2 },
  // Annual savings cue — green (value signal at a glance).
  planSubSave: { color: '#5bff85' },
  radio: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.amber },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.amber },

  busyWrap: { height: 54, alignItems: 'center', justifyContent: 'center' },
  // Terms/Privacy pair above the buy button — same quiet weight as `legal` so
  // it reads as disclosure, not as a competing action.
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -6,
  },
  policyLink: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 12,
    color: colors.textSub,
    textDecorationLine: 'underline',
    paddingVertical: 4,
  },
  policyDot: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
  // Quiet manage/cancel route for existing (active or lapsed) members.
  manage: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 13,
    color: colors.textSub,
    textAlign: 'center',
    paddingVertical: 6,
  },
  restore: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 13,
    color: colors.amber,
    textAlign: 'center',
    paddingVertical: 6,
  },
  legal: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
