/**
 * LANDING + PAYWALL REDESIGN (owner decisions 2026-10-22).
 *
 * Sources: Downloads/2026-10-22_LANDING_PAYWALL_DESIGN_REVIEW.md §7 (H1–H11)
 * and Downloads/2026-10-22_PAYWALL_COMPLIANCE_REVIEW.md "Owner decisions"
 * (H-A certificate wording, H-E every paywall entry) + its must-dos.
 *
 * Pinned here:
 *   A. the approved wording, verbatim (H5, H-A, H11)
 *   B. the landing: one offer, the free path kept prominent, HOME demoted to a
 *      link (H1), Explore + Enroll merged (H2), no price — only its shape (H3)
 *   C. the paywall order: Annual first + pre-selected, Lifetime "PAY ONCE"
 *      (H4); dated note under the plans (H11); the plan-specific disclosure,
 *      Terms + Privacy ABOVE the gold (H6) plan-named buy button; Restore kept;
 *      the guest account step BEFORE the plans; "Free vs. membership" below the
 *      buy button with the free claim AND its weekly limits together (H10/R7)
 *   D. no hard-coded price anywhere on the purchase path — the store only
 *   E. the guest return: from ANY paywall entry, sign-up/sign-in comes back to
 *      the Paywall with the chosen plan kept, never auto-buys, and the landing
 *      return rides along to after the purchase (H9 + H-E)
 *   F. Help answers "How do I cancel?"
 *   G. no "Reference Mode / Full Academy Mode" on purchase surfaces; one name
 *      ("Academy membership")
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COPY, CURRENT_PRICING_ENDS_LABEL } from '../src/lib/copy.ts';
import { buyLabel, planIdOf, purchaseDisclosure, storeNameFor } from '../src/features/commercial/paywallCopy.ts';
import { localizePlans, type PlanCopy } from '../src/features/commercial/storePrices.ts';
import { PLANS as IAP_PLANS } from '../src/features/commercial/iapProducts.ts';
import {
  armLandingReturn,
  dropPaywallReturn,
  holdPaywallReturn,
  takeLandingReturn,
  takePaywallReturn,
} from '../src/features/onboarding/landingReturn.ts';
import { HELP_CATEGORIES, filterHelp } from '../src/features/help/helpContent.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Source without comments, so a guard reads code and strings, not notes. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/gm, '$1');

const LANDING = 'src/screens/onboarding/OnboardingLandingScreen.tsx';
const PAYWALL = 'src/screens/commercial/PaywallScreen.tsx';
const SHEET = 'src/features/commercial/UpgradeSheet.tsx';
const AUTH = 'src/screens/auth/AuthScreen.tsx';
const landing = code(LANDING);
const paywall = code(PAYWALL);
const sheet = code(SHEET);
const auth = code(AUTH);

/** The offer face: from the last top-level `return (` of PaywallScreen to PlanCard. */
const offer = paywall.slice(paywall.lastIndexOf('\n  return (', paywall.indexOf('function PlanCard')), paywall.indexOf('function PlanCard'));

// ─────────────────────────────────────────────────────────────────────────────
describe('A · approved wording, verbatim', () => {
  it('H5: the new strings as written', () => {
    assert.equal(COPY.seeMembershipPlans, 'SEE MEMBERSHIP PLANS');
    assert.equal(COPY.membershipTitle, 'Unlock the whole Academy');
    assert.equal(COPY.startHereCaption, 'A short beginner lab. No account needed.');
    assert.equal(COPY.skipToHome, 'Skip to Home');
    assert.equal(COPY.topicsAndCertificates, 'TOPICS & CERTIFICATES');
    assert.equal(COPY.membershipEyebrow, 'ACADEMY MEMBERSHIP');
  });

  it('H-A: the certificate line is the conditional, Registry wording (the unconditional one is gone)', () => {
    assert.deepEqual(COPY.membershipPoints, [
      'Every topic, certificate and lab is included.',
      'Earn certificates — anyone can verify them online with the code printed on them, and listing them in the Pro Registry lets employers and instructors find you.',
      'No add-ons. No extra fees.',
    ]);
    const all = Object.values(COPY).flat().join('\n');
    assert.doesNotMatch(all, /Earn verified certificates employers can check online/);
  });

  it('H3: the landing states the shape of the pricing', () => {
    assert.equal(COPY.membershipShape, 'Monthly, yearly, or pay once for lifetime.');
  });

  it('H11: the dated note is one line, built from the date constant', () => {
    assert.equal(COPY.pricingNote, `These prices are available until ${CURRENT_PRICING_ENDS_LABEL}.`);
    assert.equal(COPY.pricingNote, 'These prices are available until 1 January 2027.');
  });

  it('the guest account step is plain and short (stated before the plans)', () => {
    assert.equal(COPY.guestAccountStep, 'You’ll create a free account to finish — your plan stays selected.');
    assert.ok(COPY.guestAccountStep.split(/\s+/).length <= 14);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('B · the landing', () => {
  it('the offer: SEE MEMBERSHIP PLANS in gold with the breathing ring, the three ✓ lines and the price shape', () => {
    assert.match(landing, /label=\{COPY\.seeMembershipPlans\}\s*tint="gold"/);
    assert.match(landing, /<AttractRing active=\{!memberTapped\}/);
    assert.match(landing, /COPY\.membershipPoints\.map/);
    assert.match(landing, /\{COPY\.membershipShape\}/);
    assert.doesNotMatch(landing, /label="MEMBERSHIP"/);
  });

  it('members never see the offer (upsell rule)', () => {
    const at = landing.indexOf('{upsell ? (');
    assert.ok(at > 0 && at < landing.indexOf('COPY.seeMembershipPlans'));
  });

  it('the free path stays prominent: full width, FREE, the approved caption', () => {
    assert.match(landing, /NEW TO AUDIO\? START HERE/);
    assert.match(landing, />FREE</);
    assert.match(landing, /\{COPY\.startHereCaption\}/);
    assert.match(landing, /onPress=\{\(\) => choose\('startHere'\)\}/);
    assert.doesNotMatch(landing, /The free beginner lab is the place to start/);
  });

  it('order: offer → free path → browse grid → footer links', () => {
    const offerAt = landing.indexOf('COPY.seeMembershipPlans');
    const free = landing.indexOf("choose('startHere')");
    const grid = landing.indexOf("choose('glossary')");
    const skip = landing.indexOf('{COPY.skipToHome}');
    assert.ok(offerAt > 0 && offerAt < free && free < grid && grid < skip);
  });

  it('H1: HOME is a footer link, not a big button', () => {
    assert.doesNotMatch(landing, /TAKE ME TO THE HOME SCREEN/);
    const link = landing.slice(landing.lastIndexOf('<Pressable', landing.indexOf('{COPY.skipToHome}')), landing.indexOf('{COPY.skipToHome}'));
    assert.match(link, /onPress=\{\(\) => choose\('home'\)\}/);
    assert.doesNotMatch(link, /GlassButton/);
  });

  it('H2: Explore Topics + Enroll are ONE "TOPICS & CERTIFICATES" button on the Awards curriculum', () => {
    assert.doesNotMatch(landing, /ENROLL IN TOPICS|EXPLORE TOPICS|'explore'|'enroll'/);
    assert.match(landing, /label=\{COPY\.topicsAndCertificates\}/);
    assert.match(landing, /case 'topics':[\s\S]*?nav\.navigate\('Awards', \{ category: 'curriculum', focus: 'topics' \}\)/);
    assert.equal((landing.match(/nav\.navigate\('Awards'/g) ?? []).length, 1);
  });

  it('H3: no price on the landing — and nothing that could fetch one', () => {
    assert.doesNotMatch(landing, /[$€£]\s?\d|\/ ?(yr|mo)\b|displayPrice|localizePlans|loadStoreProducts|lifetimePrice/);
  });

  it('the Paywall still opens OVER the landing and comes back to it', () => {
    assert.match(landing, /armLandingReturn\(\);\s*navigation\.navigate\('Paywall'\);/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('C · the paywall offer face', () => {
  it('H4: Annual first and pre-selected; Lifetime second, "PAY ONCE"; Monthly last; no "BEST VALUE"', () => {
    const plans = paywall.slice(paywall.indexOf('const PLANS: Plan[] = ['), paywall.indexOf('];', paywall.indexOf('const PLANS: Plan[] = [')));
    const ids = [...plans.matchAll(/id: '(\w+)'/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['annual', 'lifetime', 'monthly']);
    assert.match(plans, /id: 'lifetime'[^}]*badge: 'PAY ONCE'/);
    assert.match(plans, /id: 'lifetime'[^}]*sub: 'One-time payment'/);
    assert.doesNotMatch(paywall, /BEST VALUE/);
    assert.match(paywall, /useState<Plan\['id'\]>\(\(\) => planIdOf\(route\.params\?\.plan\) \?\? 'annual'\)/);
  });

  it('eyebrow, title and the same three ✓ lines as the landing', () => {
    assert.match(offer, /\{COPY\.membershipEyebrow\}/);
    assert.match(offer, /\{COPY\.membershipTitle\}/);
    assert.match(offer, /COPY\.membershipPoints\.map/);
  });

  it('the purchase order: guest step → plans → dated note → disclosure → Terms · Privacy → BUY → Restore', () => {
    const at = (needle: string) => {
      const i = offer.indexOf(needle);
      assert.ok(i > 0, `missing: ${needle}`);
      return i;
    };
    const seq = [
      at('{COPY.guestAccountStep}'),
      at('{plans.map((p) =>'),
      at('{COPY.pricingNote}'),
      at('{purchaseDisclosure(selected'),
      at("openPolicy('terms')"),
      at("openPolicy('privacy')"),
      at('label={buyLabel(selected'),
      at('onPress={busy ? undefined : onRestorePress}'),
    ];
    for (let k = 1; k < seq.length; k++) assert.ok(seq[k - 1] < seq[k], `out of order at step ${k}`);
  });

  it('the dated note hides itself after the date (never a stale deadline)', () => {
    assert.match(offer, /pricingDeadlineActive\(\) \? <Text style=\{styles\.deadline\}>\{COPY\.pricingNote\}<\/Text> : null/);
  });

  it('the guest step shows to a KNOWN guest only (useGuestWording), before the plans', () => {
    assert.match(paywall, /const guestBuyer = useGuestWording\(\)\.guest;/);
    assert.match(offer, /\{guestBuyer \? \(\s*<View style=\{styles\.guestNote\}>/);
  });

  it('H6: the buy button is GOLD, named by buyLabel from the selected plan, and latched', () => {
    const btn = offer.slice(offer.lastIndexOf('<GlassButton', offer.indexOf('label={buyLabel(selected')), offer.indexOf('/>', offer.indexOf('label={buyLabel(selected')));
    assert.match(btn, /tint="gold"/);
    assert.match(btn, /onPress=\{onBuyPress\}/);
    assert.match(paywall, /const onBuyPress = useLatchedPress\(onContinue\);/);
    assert.match(paywall, /const onRestorePress = useLatchedPress\(onRestore\);/);
    assert.doesNotMatch(offer, /label="CONTINUE"|tint="blue"/);
  });

  it('the disclosure is readable: ≥ 13 pt and not the muted grey', () => {
    const style = paywall.slice(paywall.indexOf('  disclosure: {'), paywall.indexOf('}', paywall.indexOf('  disclosure: {')));
    const size = Number(/fontSize: ([\d.]+)/.exec(style)?.[1]);
    assert.ok(size >= 13, `disclosure is ${size} pt`);
    assert.match(style, /color: colors\.textSub/);
  });

  it('Restore is on every face (Apple 3.1.1)', () => {
    assert.equal((paywall.match(/onPress=\{busy \? undefined : onRestorePress\}/g) ?? []).length, 3);
  });

  it('H10 / R7: "Free vs. membership" sits BELOW the buy button, the free claim WITH both weekly limits', () => {
    const buy = offer.indexOf('label={buyLabel(selected');
    const block = offer.indexOf('{COPY.freeVsMembership}');
    assert.ok(block > buy, 'the block must sit below the buy button');
    const tail = offer.slice(block);
    // The claim and its limits in ONE paragraph, the limits inline right after it.
    assert.match(tail, /\{COPY\.freeGlossaryClaim\}\s*<Text style=\{styles\.allowance\}>\{' ' \+ COPY\.glossaryFreeAllowance \+ ' ' \+ COPY\.calcFreeAllowance\}<\/Text>/);
    assert.match(tail, /\{COPY\.registryProfile\}/);
    // …and the free claim appears nowhere ABOVE the buy button.
    assert.ok(offer.indexOf('freeGlossaryClaim') > buy);
    assert.ok(offer.indexOf('glossaryFreeAllowance') > buy);
  });

  it('the R7 allowances still match the caps they describe', () => {
    assert.match(COPY.glossaryFreeAllowance, /14 definitions a week/);
    assert.match(COPY.calcFreeAllowance, /5 calculations a week/);
  });

  it('one name: the success notice says membership, not "Welcome to Academy"', () => {
    assert.doesNotMatch(paywall, /Welcome to Academy/);
    assert.match(paywall, /notify\('Welcome, member', 'Your Academy membership is active\. Enjoy!'/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('C2 · the words at the point of purchase (paywallCopy)', () => {
  it('the buy button names the plan, and the amount only from the store', () => {
    assert.equal(buyLabel('annual', '$59.99', false), 'SUBSCRIBE · $59.99 / YEAR');
    assert.equal(buyLabel('monthly', '10,99 €', false), 'SUBSCRIBE · 10,99 € / MONTH');
    assert.equal(buyLabel('lifetime', '£89.99', false), 'BUY LIFETIME · £89.99');
    // No store answer → plan-named, with no figure at all.
    for (const id of ['annual', 'monthly', 'lifetime'] as const) {
      const l = buyLabel(id, undefined, false);
      assert.doesNotMatch(l, /\d/, l);
      assert.match(l, /ANNUAL|MONTHLY|LIFETIME/);
    }
  });

  it('a guest’s button says what happens next', () => {
    for (const id of ['annual', 'monthly', 'lifetime'] as const) {
      assert.equal(buyLabel(id, '$1.00', true), 'CREATE ACCOUNT TO CONTINUE');
    }
  });

  it('subscriptions: title, length, store price per period, auto-renew until cancelled, how to cancel', () => {
    const a = purchaseDisclosure('annual', '$59.99', 'App Store');
    assert.match(a, /^Annual Academy membership: \$59\.99 per year\./);
    assert.match(a, /renews automatically each year until you cancel/);
    assert.match(a, /Cancel any time in your App Store subscription settings, at least 24 hours before it renews\./);
    const m = purchaseDisclosure('monthly', '10,99 €', 'Google Play');
    assert.match(m, /^Monthly Academy membership: 10,99 € per month\./);
    assert.match(m, /renews automatically each month until you cancel/);
    assert.match(m, /Google Play subscription settings/);
    // No store price: never a guessed figure.
    assert.doesNotMatch(purchaseDisclosure('annual', undefined, 'App Store'), /\d+[.,]\d/);
  });

  it('lifetime: a one-time purchase that never renews — the renewal words never apply to it', () => {
    const l = purchaseDisclosure('lifetime', '$99.99', 'App Store');
    assert.match(l, /one-time purchase/);
    assert.match(l, /never renews/);
    assert.doesNotMatch(l, /renews automatically/);
  });

  it('the store is named for the platform', () => {
    assert.equal(storeNameFor('ios'), 'App Store');
    assert.equal(storeNameFor('android'), 'Google Play');
  });

  it('the disclosure stays plain (short sentences, reading grade ≤ ~9)', () => {
    for (const id of ['annual', 'monthly', 'lifetime'] as const) {
      const text = purchaseDisclosure(id, '$9.99', 'App Store');
      for (const sentence of text.split(/(?<=\.)\s+/)) {
        assert.ok(sentence.split(/\s+/).length <= 20, `long sentence: ${sentence}`);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('D · prices come from the store only', () => {
  const FALLBACK: PlanCopy[] = [
    { id: 'annual', name: 'Annual', price: '', sub: 'Billed yearly' },
    { id: 'lifetime', name: 'Lifetime Access', price: '', sub: 'One-time payment', badge: 'PAY ONCE' },
    { id: 'monthly', name: 'Monthly', price: '', sub: 'Cancel anytime' },
  ];

  it('no price literal in the paywall, its copy module, the landing, the upgrade sheet or the governed copy', () => {
    for (const f of [PAYWALL, LANDING, SHEET, 'src/features/commercial/paywallCopy.ts', 'src/features/commercial/storePrices.ts']) {
      assert.doesNotMatch(code(f), /[$€£]\s?\d/, f);
    }
    const strings = Object.values(COPY).flat().join('\n');
    assert.doesNotMatch(strings, /[$€£]\s?\d/);
    assert.ok(!('lifetimePrice' in COPY), 'the dead hard-coded lifetime price is gone');
  });

  it('a store answer fills price AND storePrice; nothing else ever sets storePrice', () => {
    const out = localizePlans(
      FALLBACK,
      [
        { id: 'academy_monthly', displayPrice: '$9.99', price: 9.99, currency: 'USD' },
        { id: 'academy_annual', displayPrice: '$59.99', price: 59.99, currency: 'USD' },
        { id: 'academy_lifetime', displayPrice: '$99.99', price: 99.99, currency: 'USD' },
      ],
      IAP_PLANS,
    );
    const by = Object.fromEntries(out.map((p) => [p.id, p]));
    assert.equal(by.annual.storePrice, '$59.99');
    assert.equal(by.annual.price, '$59.99 / yr');
    assert.equal(by.annual.badge, 'SAVE 50%');
    assert.equal(by.lifetime.badge, 'PAY ONCE');
    assert.deepEqual(out.map((p) => p.id), ['annual', 'lifetime', 'monthly'], 'the order survives localisation');
    const none = localizePlans(FALLBACK, [], IAP_PLANS);
    assert.ok(none.every((p) => p.storePrice === undefined && p.price === ''));
  });

  it('the buy button and the disclosure are built from storePrice, never from the card text', () => {
    assert.match(offer, /buyLabel\(selected, current\?\.storePrice, guestBuyer\)/);
    assert.match(offer, /purchaseDisclosure\(selected, current\?\.storePrice, store\)/);
  });

  it('a card with no store price says so instead of guessing', () => {
    assert.match(paywall, /'Loading price…' : 'Price shown at checkout'/);
  });

  it('the dev sample prices are reachable only from a __DEV__ web preview', () => {
    const at = paywall.indexOf("require('../../dev/paywallSample')");
    assert.ok(at > 0);
    assert.match(paywall.slice(paywall.lastIndexOf('if (', at), at), /__DEV__ && Platform\.OS === 'web'/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('E · the guest returns to the paywall with the plan kept (H9 + H-E)', () => {
  it('the hold: plan kept, landing return rides along, read once, dropped on demand', () => {
    dropPaywallReturn();
    holdPaywallReturn('lifetime', true);
    assert.equal(takeLandingReturn(), true, 'the landing return rides along');
    holdPaywallReturn('monthly', false);
    assert.equal(takePaywallReturn(), 'monthly');
    assert.equal(takePaywallReturn(), null, 'single use');
    armLandingReturn();
    holdPaywallReturn('annual', false);
    dropPaywallReturn();
    assert.equal(takePaywallReturn(), null);
    assert.equal(takeLandingReturn(), false, 'drop clears the landing return too');
  });

  it('memory only — no storage (the D57 guest wipe would lose or be broken by it)', () => {
    assert.doesNotMatch(code('src/features/onboarding/landingReturn.ts'), /AsyncStorage|createLocalStore|import \{/);
  });

  it('FROM EVERY ENTRY: the Paywall itself holds the plan when a guest leaves for an account — not the landing', () => {
    const guest = paywall.slice(paywall.indexOf("if (entitlement === 'anonymous') {"), paywall.indexOf('if (!available) {'));
    assert.match(guest, /holdPaywallReturn\(selected as PlanId, !!toLanding\.current\);\s*leftForAccount\.current = true;\s*\(navigation as any\)\.navigate\('Auth'\);/);
    assert.doesNotMatch(landing, /holdPaywallReturn/);
    // Restore's "Sign in" comes back the same way.
    const restore = paywall.slice(paywall.indexOf('const onRestore'), paywall.indexOf('restorePurchases()'));
    assert.match(restore, /holdPaywallReturn\(selected as PlanId, !!toLanding\.current\);/);
  });

  it('coming back WITHOUT signing in drops the hold', () => {
    assert.match(paywall, /navigation\.addListener\('focus', \(\) => \{\s*if \(!leftForAccount\.current\) return;\s*leftForAccount\.current = false;\s*dropPaywallReturn\(\);/);
  });

  it('after sign-up / sign-in, Auth reopens the Paywall with the plan — after any dialog has faded', () => {
    const resume = auth.slice(auth.indexOf('const resume = () => {'), auth.indexOf('const toHome'));
    assert.match(resume, /const plan = paywallReturn\(\)\.takePaywallReturn\(\);\s*if \(plan\) \{\s*afterDialogCloses\(\(\) => navigationRef\.navigate\('Paywall', \{ plan \}\)\)\(\);\s*return;\s*\}/);
    // Every successful sign-in path goes through resume (toHome / toMain).
    const toHome = auth.slice(auth.indexOf('const toHome = () => {'), auth.indexOf('const toMain'));
    const toMain = auth.slice(auth.indexOf('const toMain = () => {'), auth.indexOf('const claimAndProceed'));
    assert.match(toHome, /navigation\.reset\([\s\S]*\);\s*resume\(\);/);
    assert.match(toMain, /navigation\.reset\([\s\S]*\);\s*resume\(\);/);
  });

  it('Guest Mode is not an account: it drops the hold', () => {
    const guest = auth.slice(auth.indexOf('const enterGuest = async'), auth.indexOf('const onCreateAccount'));
    assert.match(guest, /paywallReturn\(\)\.dropPaywallReturn\(\);\s*toHome\(\);/);
  });

  it('it never buys: the plan only pre-selects; buyPlan runs only from the buy button handler', () => {
    assert.equal((paywall.match(/buyPlan\(/g) ?? []).length, 1);
    const cont = paywall.slice(paywall.indexOf('const onContinue'), paywall.indexOf('const onRestore'));
    assert.ok(cont.includes('buyPlan(selected as PlanId)'));
    assert.equal(planIdOf('lifetime'), 'lifetime');
    assert.equal(planIdOf('platinum'), null);
    assert.equal(planIdOf(undefined), null);
  });

  it('after the purchase, a landing-started buyer goes back to the landing', () => {
    const welcome = paywall.slice(paywall.indexOf('const welcome = () => {'), paywall.indexOf('const reflectPurchase'));
    assert.match(welcome, /if \(toLanding\.current\) \{[\s\S]*replace\('OnboardingLanding'\)/);
    assert.match(paywall, /toLanding\.current = takeLandingReturn\(\)/);
  });

  it('the route carries the plan', () => {
    assert.match(read('src/navigation/types.ts'), /Paywall: \{ plan\?: import\('\.\.\/features\/commercial\/iapProducts'\)\.PlanId \} \| undefined;/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('F · Help answers "How do I cancel?"', () => {
  const account = HELP_CATEGORIES.find((c) => c.key === 'account')!;
  const entry = account.entries.find((e) => e.id === 'acct-cancel');

  it('the entry exists, in ACCOUNTS & MEMBERSHIP, with a jump to the membership page', () => {
    assert.ok(entry);
    assert.equal(entry!.q, 'How do I cancel?');
    assert.equal(entry!.jump?.route, 'Paywall');
  });

  it('it says where, when, what happens, and that Lifetime never renews', () => {
    assert.match(entry!.a, /App Store or Google Play subscription settings/);
    assert.match(entry!.a, /24 hours before it renews/);
    assert.match(entry!.a, /Lifetime is a one-time payment and never renews/);
    assert.match(entry!.a, /Deleting your Academy account does not cancel a store subscription/);
  });

  it('a person typing the question finds it', () => {
    const ids = filterHelp('how do I cancel').flatMap((c) => c.entries.map((e) => e.id));
    assert.ok(ids.includes('acct-cancel'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('G · one name on the purchase surfaces', () => {
  it('no "Reference Mode" / "Academy Mode" on the landing, the paywall or the upgrade sheet', () => {
    for (const [f, src] of [
      [LANDING, landing],
      [PAYWALL, paywall],
      [SHEET, sheet],
    ] as const) {
      assert.doesNotMatch(src, /reference mode|academy mode|paywallTitle|paywallBody|upgradePhrase/i, f);
    }
    assert.ok(!('paywallTitle' in COPY) && !('paywallBody' in COPY), 'the retired header copy is gone');
  });

  it('the upgrade sheet points to the same plans with the same words', () => {
    assert.match(sheet, /\{COPY\.membershipEyebrow\}/);
    assert.match(sheet, /\{COPY\.membershipTitle\}/);
    assert.match(sheet, /label=\{COPY\.seeMembershipPlans\}/);
  });

  it('the new governed strings never use the old mode names', () => {
    for (const k of [
      'membershipTitle',
      'membershipShape',
      'guestAccountStep',
      'freeGlossaryClaim',
      'membershipUnlocks',
      'registryProfile',
    ] as const) {
      assert.doesNotMatch(COPY[k], /reference mode|academy mode/i, k);
    }
  });
});
