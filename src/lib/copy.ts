/**
 * Commercial-mode copy (CM1, Booth 2026-07-11). VERBATIM — do not reword.
 * These strings are ratified marketing/lock copy; changes route to governance.
 */
/**
 * When the current prices stop being the current prices (owner 2026-09-22:
 * "pricing changes Jan 1").
 *
 * ⛔ CHANGE THIS, NEVER THE PROSE. Every sentence that mentions the deadline is
 * built from it, and the paywall note hides itself once the date has passed —
 * so a forgotten copy edit cannot leave the app making a pricing claim that is
 * no longer true. That is exactly what the previous wording did: "valid through
 * the end of the year" was hardcoded prose that would have gone false at
 * midnight with nobody touching the app.
 */
export const CURRENT_PRICING_ENDS = new Date('2027-01-01T00:00:00');
/** Rendered form of the date above — one place, so the two never disagree. */
export const CURRENT_PRICING_ENDS_LABEL = '1 January 2027';
/** False once the deadline has passed, so time-limited copy stops claiming it. */
export const pricingDeadlineActive = (now: Date = new Date()): boolean =>
  now.getTime() < CURRENT_PRICING_ENDS.getTime();

export const COPY = {
  lockCommonMistakes: 'Common Mistakes are available in academy mode.',
  upgradePhrase: 'Upgrade from reference mode to full academy mode.',
  marketingLine:
    'Use the free glossary as a reference tool. Upgrade from reference mode to full academy mode to unlock common mistakes, guided practice, audio tool tutorials, quizzes, topic trophies, progress tracking, and completion records.',
  // Body for the member-only UpgradeSheet popup (owner 2026-08-01). Kept separate
  // from marketingLine so the landing screen's copy is untouched.
  upgradeSheetBody:
    'Continue using the glossary for free, or unlock the complete Academy experience.\n\n' +
    'Gain access to guided learning, common mistakes, pro audio advanced learning labs, progress tracking, achievements, certificates, and verified completion records.',
  // Paywall-screen header copy (user request 2026-07-23) — added, not reworded,
  // so the shared upgradePhrase/marketingLine used elsewhere stay untouched.
  paywallTitle: 'Upgrade from Reference Mode to Full Academy Mode',
  paywallBody:
    'The free glossary is your professional audio reference. Upgrade to Academy Mode to unlock guided learning, study tools, quizzes, progress tracking, and the ability to earn verified Academy certificates.\n\n' +
    'Create an optional profile in the Pro Audio Training Academy Professional Registry. As you earn certificates, your profile becomes a verified graduate record that employers can validate online and you can share on résumés, job applications, portfolios, and professional networking profiles.',
  // The free tier's glossary allowance (owner 2026-09-13, governance R7).
  // ADDED, not reworded — marketingLine, upgradeSheetBody and paywallBody each
  // call the glossary "free" and predate the weekly cap (2026-09-10); all three
  // stay byte-identical and this renders BESIDE them, so the ratified sentences
  // are untouched and one string serves every surface that makes the claim.
  // ⚠️ 14 mirrors GLOSSARY_WEEKLY_LIMIT in features/glossary/glossaryCap.ts and
  // the server RPC behind it. If that constant moves, this is a false claim
  // about what free includes and must move with it.
  glossaryFreeAllowance:
    'Free use includes 14 definitions a week; Academy membership removes the limit.',
  /** The OTHER free-tier cap, which no upgrade surface used to admit to.
   *  ⚠️ 5 mirrors CALC_WEEKLY_LIMIT in features/lab/calcUsage.ts and the
   *  server's `calc_consume()`. If that constant moves, this moves with it. */
  calcFreeAllowance: 'Free use also includes 5 calculations a week; membership removes both limits.',
  /** The same fact WITHOUT the membership clause, for the Auth screen (owner
   *  2026-09-13). Two reasons it is short there: the full sentence pushed the
   *  guest note to three lines and its tail below the fold on a Pixel, and a
   *  sign-in screen is not where an upsell belongs - the person has not chosen
   *  anything yet. Same 14, same single source. */
  glossaryFreeAllowanceShort: 'Free use includes 14 definitions a week.',
  /**
   * Glossary temporary device key — the consent dialog (owner 2026-09-13,
   * finalized live with the owner over four passes).
   *
   * ⚠️ THIS IS A PRIVACY PROMISE, not marketing, which makes it a HEAVIER
   * commitment than the rest of this file: every clause has to be true in code
   * before it ships, and it stays true afterwards. Specifically —
   *   "deleted automatically after 7 days"  → the nightly pg_cron purge of
   *      anonymous auth users (build plan §3);
   *   "along with your definition count"    → glossary_usage.user_id cascades
   *      on that delete — verified on the live schema, not assumed;
   *   "no name, no email, no password"      → signInAnonymously() sends none;
   *   "none of your progress is stored"     → an anonymous user gets no
   *      public.users row, and nothing writes progress for one.
   * If any of those stops being true, this string is a false statement about
   * what the app does with a stranger's device. Route a change to governance.
   *
   * The closing line is `glossaryFreeAllowance` VERBATIM — the same ratified
   * sentence used everywhere else — so the positive note makes no new claim.
   */
  glossaryDeviceKeyTitle: 'Opening the glossary',
  glossaryDeviceKeyBody:
    'To access the glossary we need to give this device a temporary ID — deleted ' +
    'automatically after 7 days, along with your definition count. No name, no email, ' +
    'no password, and none of your progress is stored with it.',
  glossaryDeviceKeyAgree: 'AGREE',
  glossaryDeviceKeyNotNow: 'NOT NOW',
  /** The NOT NOW state. It must never be a dead end: the button under it asks
   *  again, and signing in is offered as the other way through. */
  glossaryDeviceKeyDeclinedTitle: 'Glossary closed for now',
  glossaryDeviceKeyDeclinedBody:
    'No problem — nothing was stored. The glossary needs a temporary device ID so ' +
    'your free definitions can be counted. You can allow it any time, or sign in to ' +
    'your account instead.',
  /**
   * The pre-paywall "Heads up" prompt (owner 2026-09-22: "we need to separate
   * the everything is free with the membership covers").
   *
   * ⛔ THESE ARE TWO CLAIMS AND MUST STAY TWO LINES. It used to be one
   * sentence — "Enrolling is free to do and always included — one membership
   * covers every topic and certificate, however many you pick." Fusing them
   * made the whole thing read as "it is all free", which is not what the app
   * sells, and "free to do AND always included" said the same thing twice
   * about the same act.
   *
   * Split: the first line is about the ACT of choosing (it costs nothing), the
   * second is about what the MEMBERSHIP covers (everything, with no per-item
   * charge). Neither one claims the membership itself is free.
   *
   * It was copy-pasted into five call sites across two screens before this, so
   * it lives here now — the same sentence in five places is five chances to
   * drift.
   */
  enrollFreeLine: 'Enrolling costs nothing — pick as many topics and certificates as you like.',
  membershipCoversLine: 'One membership covers them all. Choosing more never costs more.',
  // Introductory lifetime offer (Booth 2026-07-15).
  lifetimePrice: '$99.99',
  lifetimeOffer: `One payment for lifetime academy access. Current pricing runs to ${CURRENT_PRICING_ENDS_LABEL}.`,
  /**
   * The ONE pricing note on the purchase screen (owner ruling 2026-09-22:
   * "pricing changes Jan 1 … it is early-bird pricing but i do not want to
   * call it that").
   *
   * ⛔ WHAT THE OLD WORDING DID WRONG, so it does not creep back:
   *
   *  1. "early beta (new-adopter) users" — it told someone deciding whether to
   *     PAY that the product is unfinished, on the screen where they decide.
   *  2. "valid through the end of the year" — prose, with no date behind it, in
   *     a sentence that becomes FALSE at midnight on 31 December with nobody
   *     touching anything. That is now derived from CURRENT_PRICING_ENDS, and
   *     the note hides itself once the date passes, so it cannot go stale.
   *  3. "Lock in now" — a promise that today's price FOLLOWS the subscriber.
   *     Nothing implements grandfathering, and neither store does it
   *     automatically: a price rise on an existing subscription is a deliberate
   *     act with its own consent flow on both Apple and Google. It is dropped
   *     rather than quietly honoured by hand, because it appeared on the one
   *     screen customers screenshot. If grandfathering is ever promised, say so
   *     here AND build it.
   *  4. The last sentence did not parse: "Lock in now early low priced
   *     subscriptions or the lifetime academy membership fee."
   */
  pricingNote: `These prices are available until ${CURRENT_PRICING_ENDS_LABEL}. The lifetime membership is a one-time payment.`,
  /** Short deadline line for an individual plan tier. */
  introDeadline: `Current price — until ${CURRENT_PRICING_ENDS_LABEL}`,
} as const;
