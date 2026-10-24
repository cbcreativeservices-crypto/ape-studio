/**
 * PaywallScreen — Academy membership paywall (CM7). LIVE (owner 2026-08-21): wired
 * to expo-iap via features/commercial/purchase.ts — the gold buy button starts
 * the store purchase, the server verifies the receipt (validate-purchase edge function)
 * and writes the entitlement, then refreshEntitlement reflects it. Restore
 * Purchases re-grants a prior buy. FAILS SAFE: no native module / un-deployed
 * edge function → nothing is granted and the UI explains; never a fake unlock.
 * Prices come ONLY from the store (no hard-coded fallback figure since
 * 2026-10-22). Store product IDs: features/commercial/iapProducts.ts. Owner
 * setup: docs/APE_IAP_PLAN_2026_08_21.md.
 *
 * REDESIGN (owner decisions 2026-10-22, H1–H11 + compliance H-A/H-E): one
 * name, "Academy membership"; the offer, the plans and the gold buy button sit
 * above the fold at 375 × 812 — eyebrow → title → three ✓ lines → (guest: the
 * account step, BEFORE the plans) → plans (Annual first and pre-selected,
 * Lifetime "PAY ONCE", Monthly) → the dated note → the plan-specific
 * disclosure → Terms · Privacy → BUY → Restore. The "Free vs. membership"
 * block (the free-glossary claim WITH its weekly limits, R7) and the Registry
 * paragraph sit below the buy button. Pinned by
 * test/landingPaywallRedesign_20261022.test.ts.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { COPY, pricingDeadlineActive } from '../../lib/copy';
import { confirmDialog, notify } from '../../lib/confirm';
import { colors, fonts } from '../../theme/tokens';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { useMemberGate } from '../../features/commercial/useTier';
import { useGuestWording } from '../../features/commercial/useTier';
import { MEMBERSHIP_NOT_CONFIRMED } from '../../features/commercial/tier';
import { consumePendingLink } from '../../navigation/pendingLink';
import { navigateToPath } from '../../navigation/linking';
import {
  buyPlan,
  detachPaywallHandlers,
  initPurchases,
  LINKED_MESSAGE,
  loadStoreProducts,
  retryStoreConnection,
  PENDING_MESSAGE,
  restorePurchases,
  storeErrorMessage,
} from '../../features/commercial/purchase';
import { PLANS as IAP_PLANS, type PlanId } from '../../features/commercial/iapProducts';
import { localizePlans, type PlanCopy } from '../../features/commercial/storePrices';
import { buyLabel, planIdOf, purchaseDisclosure, storeNameFor } from '../../features/commercial/paywallCopy';
import { fitValue } from '../../theme/legibility';
import { useLatchedPress } from '../../lib/latch';
import type { RootStackParamList } from '../../navigation/types';
import { readingColumn } from '../../theme/readingColumn';
import { safeGoBack } from '../../lib/safeGoBack';
import { dropPaywallReturn, holdPaywallReturn, takeLandingReturn } from '../../features/onboarding/landingReturn';
import { LEGAL_ASSENT_SUBSCRIBE, LEGAL_LIFETIME, LEGAL_NOT_ACCREDITED } from '../../features/commercial/legalCopy';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type Plan = PlanCopy;

// The plans BEFORE the store answers (Apple 3.1.2, 2026-10-15; no fallback
// price since 2026-10-22). localizePlans() in features/commercial/storePrices.ts
// fills in the store's localized price — and derives "SAVE n%" from the
// store's own numbers, or shows no saving at all. Until then a card says its
// price is loading / shown at checkout; it never guesses a figure (prices rise
// on 1 January 2027, and a typed USD figure would then be false).
//
// ORDER (owner H4, 2026-10-22): Annual first AND pre-selected; Lifetime second,
// "PAY ONCE" (a fact, where "BEST VALUE" was a judgement); Monthly last.
const PLANS: Plan[] = [
  { id: 'annual', name: 'Annual', price: '', sub: 'Billed yearly' },
  // Matches `public.products.name` exactly — the store listing and this card
  // must not name the same product two different things.
  { id: 'lifetime', name: 'Lifetime Access', price: '', sub: 'One-time payment', badge: 'PAY ONCE' },
  { id: 'monthly', name: 'Monthly', price: '', sub: 'Cancel anytime' },
];

export function PaywallScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshEntitlement, isMember, resolved, tierKnown, tierReadFailed, entitlement } = useEntitlement();
  const gate = useMemberGate();
  // A KNOWN guest (useGuestWording — never decided from `resolved` alone): the
  // account step is stated before the plans and the buy button says so.
  const guestBuyer = useGuestWording().guest;
  // Annual, unless a guest's sign-up return brought back the plan they chose
  // (owner H9/H-E). The user's own choice is never re-defaulted afterwards.
  const [selected, setSelected] = useState<Plan['id']>(() => planIdOf(route.params?.plan) ?? 'annual');
  const [busy, setBusy] = useState(false);
  // Whether in-app purchasing is usable in THIS build (native module present +
  // store connection). Assume true until init says otherwise.
  const [available, setAvailable] = useState(true);
  // Plan cards: no price until the store's localized prices arrive.
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  // Has the store answered? 'none' = it cannot (no store in this build) or
  // returned nothing — the cards then say the price is shown at checkout.
  const [priceState, setPriceState] = useState<'loading' | 'ready' | 'none'>('loading');
  // TRY AGAIN when prices did not load: reconnect if the first connection
  // failed, then fetch the products again (pre-resubmission audit 2026-10-24).
  const [priceRetrying, setPriceRetrying] = useState(false);
  const retryPrices = async () => {
    setPriceRetrying(true);
    try {
      const ok = available || (await retryStoreConnection());
      if (ok) setAvailable(true);
      const products = ok ? await loadStoreProducts() : [];
      setPlans(localizePlans(PLANS, products, IAP_PLANS));
      setPriceState(products.length ? 'ready' : 'none');
    } finally {
      setPriceRetrying(false);
    }
  };
  const onRetryPrices = useLatchedPress(retryPrices);
  // Left for sign-up / sign-in with the plan held (H9). Coming BACK here without
  // signing in drops that hold, so a later sign-in elsewhere does not reopen it.
  const leftForAccount = useRef(false);
  /**
   * A purchase or restore is IN FLIGHT (2026-09-30 bug pass). `busy` swaps
   * CONTINUE for a spinner, but only after a re-render — two taps in the same
   * frame both reached `buyPlan`, opening a second store request on top of the
   * first. The store refuses the second, its rejection cleared `busy` and put
   * up an error while the first sheet was still open, and CONTINUE came back
   * under it. A ref is synchronous, so the second tap is dropped.
   */
  const inFlight = useRef(false);
  /**
   * Still on screen? (night bug pass 1, 2026-10-01.) A restore can take a
   * while, and ✕ / swipe-down stays live under its spinner. Its "Purchases
   * restored" notice then came up AFTER the paywall had gone, and dismissing it
   * ran `navigation.goBack()` for a screen no longer in the stack — popping
   * whatever the person had returned to (Settings, a lab) instead.
   */
  // Opened from the onboarding landing page? Then a completed purchase goes
  // back there (owner 2026-10-09). Taken once, at mount.
  const toLanding = useRef<boolean | null>(null);
  if (toLanding.current === null) toLanding.current = takeLandingReturn();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const welcome = () => {
      // DESTINATION THROUGH PURCHASE (2026-09-06): a deep link the user
      // followed into locked content is resumed once they have paid, instead
      // of dropping them back wherever the paywall opened. `notify` runs its
      // callback on EVERY dismissal — button, scrim, BACK — so the destination
      // is honoured however the notice is closed.
      // One name everywhere (owner H5 / R5, 2026-10-22): was "Welcome to Academy".
      notify('Welcome, member', 'Your Academy membership is active. Enjoy!', () => {
        const pending = consumePendingLink();
        if (pending && navigateToPath(pending)) return;
        if (toLanding.current) {
          // Back to the landing page so they can make their choice.
          const st = navigation.getState();
          if (st.routes[st.index - 1]?.name === 'OnboardingLanding') safeGoBack(navigation);
          else (navigation as any).replace('OnboardingLanding');
          return;
        }
        safeGoBack(navigation);
      });
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
          inFlight.current = false;
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
          confirmDialog(
            // Ratified by the owner 2026-09-14
            'Purchase complete',
            // Ratified by the owner 2026-09-14
            'Your payment went through and your membership is recorded. We couldn’t refresh your access on this device yet — check your connection and retry.',
            'Retry', // Ratified by the owner 2026-09-14
            () => {
              inFlight.current = true;
              setBusy(true);
              reflectPurchase();
            },
            // Leaving is safe: the entitlement is on the server and the next
            // boot read / auth event picks it up.
            { cancelText: 'Later', onCancel: () => safeGoBack(navigation) }, // Ratified by the owner 2026-09-14
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
        inFlight.current = false;
        setBusy(false);
        if (message) notify('Purchase', message);
      },
    }).then((ok) => {
      if (!alive) return;
      setAvailable(ok);
      if (!ok) {
        // DEV + WEB PREVIEW ONLY: `#labpreview/Paywall/sample` feeds store-shaped
        // sample answers through the same localizePlans, so the owner can review
        // priced cards in the browser. Never on a phone or in a release build.
        if (__DEV__ && Platform.OS === 'web') {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const sample = (require('../../dev/paywallSample') as typeof import('../../dev/paywallSample')).devSampleStoreProducts();
          if (sample) {
            setPlans(localizePlans(PLANS, sample, IAP_PLANS));
            setPriceState('ready');
            return;
          }
        }
        setPriceState('none');
        return;
      }
      // The buyer's own currency and locale, straight from the store. Empty on
      // failure → the cards say the price is shown at checkout.
      void loadStoreProducts().then((products) => {
        if (!alive) return;
        setPlans(localizePlans(PLANS, products, IAP_PLANS));
        setPriceState(products.length ? 'ready' : 'none');
      });
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
      notify('One moment', 'Still checking your membership — try again in a second.');
      return;
    }
    if (isMember) {
      notify(
        'You’re a member',
        // The client cannot tell which plan is held, and a Lifetime buyer has
        // no subscription to manage — so this must be conditional, not flat.
        'Your Academy access is already active. If you bought a monthly or annual plan, manage it in your app-store subscription settings.',
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
    // 'anonymous' is the tier for a guest or a device-key session.
    //
    // ⛔ `tierKnown`, NOT `resolved`. The comment here used to claim `resolved`
    //    "already guarantees this is a real read and not a not-known-yet". The
    //    provider says the opposite in its own docblock: `resolved` flips in a
    //    .finally() EVEN WHEN THE READ FAILED. So a signed-in paying member
    //    whose first entitlement read fails reads as 'anonymous' with
    //    resolved === true, and this branch told them to "create an account"
    //    — sending them to a login screen they are already past, with no way
    //    to buy and no way to Restore. SettingsScreen was converted to
    //    `tierKnown` for this exact bug; this screen was missed.
    if (!tierKnown) {
      // The check gave up (owner ruling 2026-10-03): "give it a few seconds"
      // would be untrue — nothing is checking any more.
      if (tierReadFailed) {
        notify(
          'Membership not confirmed',
          'Couldn’t confirm your membership on this phone. Check your connection and reopen the app.',
        );
        return;
      }
      notify(
        'One moment',
        'We’re still checking your membership on this device. Give it a few seconds and try again — if it keeps failing, your connection is the likeliest cause.',
      );
      return;
    }
    if (entitlement === 'anonymous') {
      confirmDialog(
        'Create an account first',
        // ⚠️ "your progress comes with you" was false — see the note on the
        // Dashboard guest notice; signing in resets the local stores.
        // Corrected 2026-10-01 (owner ruling): lab work from THIS session is
        // written to the account signed into in the same session
        // (features/lab/sessionCarry); study progress still is not.
        'Membership is attached to your account, so you need one before you can buy. Creating it takes a moment; lab work from this session comes with you, but study progress done without an account does not transfer. You’ll come back here with your plan still selected.',
        'Create account',
        () => {
          // Back HERE after sign-up, plan kept (owner H9/H-E, from every paywall
          // entry) — and on to the landing page after the purchase, when that
          // is where this Paywall was opened from. Nothing is bought until
          // they tap the buy button again.
          holdPaywallReturn(selected as PlanId, !!toLanding.current);
          leftForAccount.current = true;
          (navigation as any).navigate('Auth');
        },
        { cancelText: 'Not now' },
      );
      return;
    }
    if (!available) {
      notify(
        'Purchasing unavailable',
        'The App Store isn’t responding right now. Please try again in a moment.',
      );
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    buyPlan(selected as PlanId).catch((e: unknown) => {
      // The purchase error LISTENER reports store failures too, so a rejection
      // here can be the second report of one failure. If the listener already
      // cleared the flight, it has spoken — stay quiet. A CANCEL is never an
      // error (the listener treats it as silent; this path showed the raw
      // "user cancelled" string as a dialog).
      const wasInFlight = inFlight.current;
      inFlight.current = false;
      setBusy(false);
      const err = e as { code?: unknown; message?: string } | null;
      if (!wasInFlight) return;
      // Same words as the listener (toddler pass 2026-10-13): Ask to Buy and
      // "already owned" are not raw store errors to the person.
      const message = storeErrorMessage(err);
      if (message) notify('Purchase', message);
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
    // Same correction as onContinue: only assert "you are not signed in" when a
    // read actually produced a tier. Restore is an Apple 3.1.1 requirement, so
    // wrongly refusing it is worse here than anywhere else in the app.
    if (tierKnown && entitlement === 'anonymous') {
      confirmDialog(
        'Sign in to restore',
        'A previous purchase is restored to the account it was bought with, so sign in or create your account first — then try Restore again.',
        'Sign in',
        () => {
          // Back here after signing in, to try Restore again (same hold as buy).
          holdPaywallReturn(selected as PlanId, !!toLanding.current);
          leftForAccount.current = true;
          (navigation as any).navigate('Auth');
        },
        { cancelText: 'Not now' },
      );
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    restorePurchases()
      .finally(() => {
        // Released before any dialog below goes up, whatever the outcome.
        inFlight.current = false;
      })
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
            notify(
              'Purchases restored',
              refreshed
                ? 'Your Academy access has been restored.'
                : // Ratified by the owner 2026-09-14
                  'Your previous purchase was verified and your membership is recorded. We couldn’t refresh your access on this device yet — it will unlock shortly, or restart the app.',
              () => {
                if (mounted.current) safeGoBack(navigation);
              },
            );
            return;
          case 'none':
            // The store ANSWERED and holds nothing — the only case this copy is true.
            notify('Nothing to restore', 'No previous Academy purchase was found for this store account.');
            return;
          case 'linked':
            // Verified, but on another account — not a connection problem.
            notify('Restore didn’t finish', LINKED_MESSAGE);
            return;
          case 'pending':
            // The store holds it but the payment has not completed — not a
            // connection problem either (toddler pass 2026-10-13).
            notify('Purchase', PENDING_MESSAGE);
            return;
          case 'expired':
            // The store answered: the subscription ended (server #6, 2026-10-23).
            notify('Your membership has ended', 'The store says your last Academy subscription has expired, so there is nothing to restore. Choose a plan above to join again.');
            return;
          case 'refunded':
            // The store answered: the purchase was refunded (server #6, 2026-10-23).
            notify('Purchase was refunded', 'The store says this Academy purchase was refunded, so it can’t restore access. Choose a plan above to join again.');
            return;
          case 'unavailable':
            notify(
              'Purchasing unavailable',
              // Ratified by the owner 2026-09-14
              'The App Store isn’t responding right now. Please try again in a moment.',
            );
            return;
          default:
            notify(
              // Ratified by the owner 2026-09-14
              'Restore didn’t finish',
              // Ratified by the owner 2026-09-14
              'We couldn’t reach the store to check your purchases — check your connection and try again. If you were charged, your purchase is safe.',
            );
        }
      })
      .catch(() => {
        setBusy(false);
        notify(
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
      notify(
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
      notify(
        // Ratified by the owner 2026-09-14
        'Page unavailable',
        // Ratified by the owner 2026-09-14
        `We couldn’t open the page — visit proaudiotrainingacademy.com/${path} in your browser.`,
      );
    });
  };

  const showManage = resolved && (entitlement === 'academy' || entitlement === 'lapsed');

  // Came back from sign-in WITHOUT signing in (RETURN / BACK on Auth): drop the
  // held plan, so a later sign-in from elsewhere does not reopen the Paywall.
  // A successful sign-in resets the stack instead, so this never runs for it.
  useEffect(
    () =>
      navigation.addListener('focus', () => {
        if (!leftForAccount.current) return;
        leftForAccount.current = false;
        dropPaywallReturn();
      }),
    [navigation],
  );

  // House latch (src/lib/latch.ts) on both money buttons: a same-frame double
  // tap runs once. The `inFlight` ref inside each handler still spans the whole
  // store round-trip, which a latch released in `finally` cannot.
  const onBuyPress = useLatchedPress(onContinue);
  const onRestorePress = useLatchedPress(onRestore);

  // The selected plan drives the buy button and the disclosure above it.
  const current = plans.find((p) => p.id === selected) ?? plans[0];
  const store = storeNameFor(Platform.OS);

  // MEMBERS GET THEIR OWN PAGE (owner 2026-09-30: "for members they should
  // get their own page - not the free user upsale"). Settings › Manage
  // membership lands here; no plan cards, prices or CONTINUE — just their
  // status and the ways to manage it. `tierKnown`, never a guess.
  if (tierKnown && isMember) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => safeGoBack(navigation)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.close}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.eyebrow}>ACADEMY MEMBERSHIP</Text>
          <Text style={styles.title}>Your membership is active</Text>
          {/* Ratified by the owner 2026-09-14 (the member notice on CONTINUE). */}
          <Text style={styles.body}>
            Your Academy access is already active. If you bought a monthly or annual plan, manage it in your app-store
            subscription settings.
          </Text>
          <View style={styles.promiseRow}>
            <Text style={styles.promiseCheck}>✓</Text>
            <Text style={styles.valueLine}>
              Every topic, certificate and lab is included. Enroll in as many as you like — choosing more never costs more.
            </Text>
          </View>
          <GlassButton label="MANAGE SUBSCRIPTION" tint="blue" height={54} fontSize={15} onPress={onManage} />
          <Pressable onPress={busy ? undefined : onRestorePress} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.restore}>Restore purchases</Text>
          </Pressable>
          <View style={styles.policyRow}>
            <Pressable onPress={() => openPolicy('terms')} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.policyLink}>Terms of Use</Text>
            </Pressable>
            <Text style={styles.policyDot}>·</Text>
            <Pressable onPress={() => openPolicy('privacy')} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.policyLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // NO OFFER TO A MAYBE-MEMBER (wrap-up 2026-10-04, D52). Plans and prices are
  // an offer, and an offer goes only to a KNOWN non-member ('locked') or a
  // known guest (`tierKnown`). A member whose tier is only REMEMBERED (the
  // provider's first paint, before the network read) or whose read failed was
  // shown the plan cards and CONTINUE. Until the tier settles this is the
  // house 'checking' / MEMBERSHIP_NOT_CONFIRMED face — never a sell, and no
  // purchase control at all. Restore stays (Apple 3.1.1; it buys nothing).
  if (!(tierKnown || gate === 'locked')) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => safeGoBack(navigation)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.close}
        >
          <Text style={styles.closeGlyph}>✕</Text>
        </Pressable>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.eyebrow}>ACADEMY MEMBERSHIP</Text>
          <Text style={styles.body}>
            {gate === 'unconfirmed' || tierReadFailed ? MEMBERSHIP_NOT_CONFIRMED : 'Checking your account…'}
          </Text>
          <Pressable onPress={busy ? undefined : onRestorePress} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.restore}>Restore purchases</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => safeGoBack(navigation)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
      >
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>

      {/* Root-stack screen, no tab bar beneath. Everything that qualifies the
          PURCHASE sits above the buy button; only the free-vs-membership
          explainer and the Registry paragraph sit below it. */}
      <ScrollView contentContainerStyle={[styles.scroll, styles.offer, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.eyebrow}>{COPY.membershipEyebrow}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {COPY.membershipTitle}
        </Text>
        {/* The same three ✓ lines as the landing card (continuity). */}
        <View style={styles.points}>
          {COPY.membershipPoints.map((line) => (
            <View key={line} style={styles.pointRow}>
              <Text style={styles.pointCheck}>✓</Text>
              <Text style={styles.pointText}>{line}</Text>
            </View>
          ))}
        </View>

        {/* The account step, BEFORE the plans (Apple 5.1.1(v)) — a known guest
            only. After sign-up they come straight back here, plan kept. */}
        {guestBuyer ? (
          <View style={styles.guestNote}>
            <Text style={styles.guestNoteText}>{COPY.guestAccountStep}</Text>
          </View>
        ) : null}

        {/* Prices did not arrive (StoreKit slow, offline, or timed out): never
            leave the plans without prices and no way forward — App Review
            judges this screen under 3.1.2 (pre-resubmission audit 2026-10-24). */}
        {priceState === 'none' ? (
          <Pressable
            onPress={onRetryPrices}
            disabled={priceRetrying}
            accessibilityRole="button"
            accessibilityLabel="Prices didn’t load. Try again."
            hitSlop={8}
            style={styles.priceRetry}
          >
            <Text style={styles.priceRetryText}>{priceRetrying ? 'Loading prices…' : 'Prices didn’t load · TRY AGAIN'}</Text>
          </Pressable>
        ) : null}

        <View style={styles.plans} accessibilityRole="radiogroup">
          {plans.map((p) => (
            <View key={p.id}>
              <PlanCard plan={p} active={selected === p.id} priceState={priceState} onPress={() => setSelected(p.id)} />
              {/* Owner legal ruling L15 (2026-10-23), word for word, under the Lifetime button. */}
              {p.id === 'lifetime' ? <Text style={styles.lifetimeNote}>{LEGAL_LIFETIME}</Text> : null}
            </View>
          ))}
        </View>

        {/* The ONE place the pricing deadline appears (Booth 2026-07-18; owner
            2026-08-21; H11 2026-10-22: one line under the plans). It HIDES
            ITSELF once the date passes — see CURRENT_PRICING_ENDS. */}
        {pricingDeadlineActive() ? <Text style={styles.deadline}>{COPY.pricingNote}</Text> : null}

        {/* POINT-OF-PURCHASE DISCLOSURE — directly above the buy button, for the
            plan that button buys (compliance row 6, 2026-10-22): title, length,
            the store's price per period, renews until cancelled, how to cancel
            in the store's settings; Lifetime = one payment, never renews.
            13 pt in textSub — never fainter than the deadline note. */}
        <Text style={styles.disclosure} accessibilityLiveRegion="polite">
          {purchaseDisclosure(selected, current?.storePrice, store)}
        </Text>
        {/* Terms (EULA) / Privacy beside the purchase decision (store checklist). */}
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
        {/* Owner legal ruling L4 (2026-10-23): the assent sentence beside the buy button, word for word. */}
        <Text style={styles.disclosure}>{LEGAL_ASSENT_SUBSCRIBE}</Text>
        {busy ? (
          <View style={styles.busyWrap}>
            <ActivityIndicator color={colors.amber} accessibilityLabel="Working, please wait" />
          </View>
        ) : (
          <GlassButton
            // Names the plan, and the amount once the STORE has answered (H5/R6).
            label={buyLabel(selected, current?.storePrice, guestBuyer)}
            // GOLD (owner H6, 2026-10-22): the gold landing button → the amber
            // selected plan → the gold buy button. One colour to the purchase.
            tint="gold"
            height={56}
            fontSize={16}
            onPress={onBuyPress}
          />
        )}
        <Pressable onPress={busy ? undefined : onRestorePress} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>
        {showManage && (
          <Pressable onPress={onManage} accessibilityRole="link" hitSlop={8}>
            {/* Ratified by the owner 2026-09-14 */}
            <Text style={styles.manage}>Manage or cancel a subscription</Text>
          </Pressable>
        )}

        {/* FREE VS. MEMBERSHIP (owner H10, 2026-10-22) — below the buy button.
            ⛔ Governance R7: the free-glossary claim and BOTH weekly limits move
            TOGETHER — the allowance runs inline, muted, in the claim's own
            paragraph, so no free claim is ever shown without its limit. */}
        <View style={styles.compare}>
          <Text style={styles.compareEyebrow}>{COPY.freeVsMembership}</Text>
          <View style={styles.compareRow}>
            <View style={[styles.compareRail, styles.compareRailFree]} />
            <View style={styles.compareCol}>
              <Text style={[styles.compareHead, styles.compareHeadFree]}>FREE</Text>
              <Text style={styles.compareBody}>
                {COPY.freeGlossaryClaim}
                <Text style={styles.allowance}>{' ' + COPY.glossaryFreeAllowance + ' ' + COPY.calcFreeAllowance}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.compareRow}>
            <View style={styles.compareRail} />
            <View style={styles.compareCol}>
              <Text style={styles.compareHead}>{COPY.membershipEyebrow}</Text>
              <Text style={styles.compareBody}>{COPY.membershipUnlocks}</Text>
              <Text style={[styles.compareBody, styles.registry]}>{COPY.registryProfile}</Text>
            </View>
          </View>
        </View>
        {/* Owner legal ruling L12 (2026-10-23): the paywall footer, small text, word for word. */}
        <Text style={styles.accreditNote}>{LEGAL_NOT_ACCREDITED}</Text>
      </ScrollView>
    </View>
  );
}

/**
 * One plan as a recessed glass display (R11 — the house rack idiom): an
 * illuminated radio lamp, the plan's name and its billing line, and the
 * billed amount as the most prominent figure (Apple 3.1.2). The badge sits on
 * the card's top edge like a panel tab. No price until the store answers.
 */
function PlanCard({
  plan,
  active,
  priceState,
  onPress,
}: {
  plan: Plan;
  active: boolean;
  priceState: 'loading' | 'ready' | 'none';
  onPress: () => void;
}) {
  const waiting = !plan.price;
  const priceText = waiting ? (priceState === 'loading' ? 'Loading price…' : 'Price shown at checkout') : plan.price;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      aria-checked={active}
      // Screen readers heard "radio button" ×3 with no plan/price (E2-04).
      accessibilityLabel={`${plan.name}${plan.badge ? `, ${plan.badge}` : ''}, ${priceText}, ${plan.sub}`}
      style={styles.planOuter}
    >
      <LinearGradient
        colors={active ? ['#241a09', '#140e05'] : ['#0d0e10', '#17181c']}
        style={[styles.plan, active && styles.planActive]}
      >
        <View style={[styles.lamp, active && styles.lampOn]}>{active ? <View style={styles.lampDot} /> : null}</View>
        <View style={styles.planText}>
          <Text style={[styles.planName, active && styles.planNameOn]}>{plan.name}</Text>
          {/* Annual's derived saving → its billing line reads green. */}
          <Text style={[styles.planSub, plan.id === 'annual' && !!plan.badge && styles.planSubSave]}>{plan.sub}</Text>
        </View>
        {/* The amount is a VALUE: one line, shrinks to fit, never "…" (fitValue).
            The waiting words are not a value — they may wrap to two lines. */}
        {waiting ? (
          <Text style={styles.planPriceWaiting} numberOfLines={2}>
            {priceText}
          </Text>
        ) : (
          <Text style={styles.planPrice} {...fitValue(21)}>
            {priceText}
          </Text>
        )}
      </LinearGradient>
      {plan.badge ? (
        <View style={[styles.badgeTab, active && styles.badgeTabOn]} pointerEvents="none">
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  close: { position: 'absolute', top: 0, right: 0, zIndex: 2, padding: 16, marginTop: 8 },
  closeGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  scroll: { padding: 20, paddingTop: 8, gap: 14, ...readingColumn },
  // The offer face packs tighter so the plans and the buy button sit above the
  // fold at 375 × 812 (design review R2: buy button bottom ≤ 700 pt).
  offer: { gap: 10 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, lineHeight: 29, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  allowance: { color: colors.textMuted },

  // The three ✓ lines.
  points: { gap: 4, marginTop: -2 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pointCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, lineHeight: 19, color: colors.greenBright, width: 12 },
  pointText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19, color: colors.textSecondary },

  // The guest's account step — an inset note, not an alarm.
  guestNote: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33363e',
    backgroundColor: '#14161b',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  guestNoteText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },

  // Member-face promise line (owner 2026-08-21): a check + hairline divider.
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
  promiseCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.greenBright },
  valueLine: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // ── plan displays ──
  plans: { gap: 12, marginTop: 6 },
  planOuter: { borderRadius: 11 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 62,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#2a2b30',
    paddingVertical: 10,
    paddingHorizontal: 14,
    // a recessed bezel: the dark top edge of a display set into the panel
    borderTopColor: '#060607',
  },
  planActive: { borderColor: colors.amber, borderTopColor: colors.amber },
  lamp: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4a4b52',
    backgroundColor: '#0a0a0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The lit lamp: an amber LED with its own glow.
  lampOn: {
    borderColor: colors.amber,
    shadowColor: colors.amberDeep,
    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  lampDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd35e' },
  planText: { flex: 1, minWidth: 0 },
  planName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.5, color: colors.textSecondary },
  planNameOn: { color: colors.textPrimary },
  planSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 1 },
  planSubSave: { color: colors.greenBright },
  // The billed amount — the most prominent price element (Apple 3.1.2).
  planPrice: { fontFamily: fonts.oswaldBold, fontSize: 21, color: colors.amber, maxWidth: '52%', textAlign: 'right' },
  planPriceWaiting: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 16, color: colors.textSub, maxWidth: '36%', textAlign: 'right' },
  // The badge as a tab set into the card's top edge.
  badgeTab: {
    position: 'absolute',
    top: -9,
    right: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.55)',
    backgroundColor: colors.screenBg,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
  },
  badgeTabOn: { borderColor: colors.greenBright },
  badgeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.greenBright },

  // Single consolidated pricing/deadline note (Booth 2026-07-18).
  deadline: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.amberLabel, textAlign: 'center' },
  // The renewal disclosure: ≥ 13 pt in textSub (compliance row 6).
  disclosure: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub, textAlign: 'center' },
  priceRetry: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.amber },
  priceRetryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.6, color: colors.amber },
  lifetimeNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub, textAlign: 'center', marginTop: 6 },
  accreditNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textMuted, textAlign: 'center', marginTop: 18 },

  busyWrap: { height: 56, alignItems: 'center', justifyContent: 'center' },
  // Terms/Privacy pair above the buy button — quiet, so it reads as disclosure,
  // not as a competing action.
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -4,
  },
  policyLink: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 12.5,
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

  // ── free vs. membership (below the buy button) ──
  compare: {
    marginTop: 14,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineDim,
    gap: 14,
  },
  compareEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amberLabel },
  compareRow: { flexDirection: 'row', gap: 12 },
  // A thin lit rail beside each column: green for free, amber for membership.
  compareRail: { width: 2, borderRadius: 1, backgroundColor: colors.amberLabel },
  compareRailFree: { backgroundColor: colors.green },
  compareCol: { flex: 1, gap: 4 },
  compareHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.6, color: colors.amber },
  compareHeadFree: { color: colors.greenBright },
  compareBody: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  registry: { marginTop: 6, color: colors.textSub },
});
