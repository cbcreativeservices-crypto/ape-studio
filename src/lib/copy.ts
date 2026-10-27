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
  lockCommonMistakes: 'Common Mistakes are included with Academy membership.',
  upgradePhrase: 'Upgrade to Academy membership.',
  marketingLine:
    'Use the free glossary as a reference tool. Academy membership unlocks common mistakes, guided practice, audio tool tutorials, quizzes, topic trophies, progress tracking, and completion records.',
  // Body for the member-only UpgradeSheet popup (owner 2026-08-01). Kept separate
  // from marketingLine so the landing screen's copy is untouched.
  upgradeSheetBody:
    'Continue using the glossary for free, or unlock the complete Academy experience.\n\n' +
    'Gain access to guided learning, common mistakes, pro audio advanced learning labs, progress tracking, achievements, certificates, and verified completion records.',
  /*
   * ── LANDING + PAYWALL REDESIGN (owner decisions 2026-10-22, H1–H11 + H-A/H-E;
   *    docs: Downloads/2026-10-22_LANDING_PAYWALL_DESIGN_REVIEW.md §7 and
   *    2026-10-22_PAYWALL_COMPLIANCE_REVIEW.md "Owner decisions"). ──────────────
   *
   * ONE NAME EVERYWHERE: "Academy membership". The old paywall header
   * ("Upgrade from Reference Mode to Full Academy Mode") and its "Upgrade to
   * Academy Mode" paragraph are RETIRED from the purchase surfaces (H5): the
   * buyer never met "Reference Mode" anywhere else. Pinned by
   * test/landingPaywallRedesign_20261022.test.ts.
   *
   * ⛔ NO PRICE IN THIS FILE. Prices come from the store (storePrices.ts) and
   * rise on CURRENT_PRICING_ENDS — a figure typed here would go false that day.
   */
  membershipEyebrow: 'ACADEMY MEMBERSHIP',
  /** Landing CTA (H5) — honest about the next screen: plans, not a charge. */
  seeMembershipPlans: 'SEE MEMBERSHIP PLANS',
  /** Paywall title (H5). */
  membershipTitle: 'Unlock the whole Academy',
  /**
   * The three ✓ lines on the landing card AND the paywall (continuity). Lines
   * 1 and 3 are ratified strings reused verbatim. Line 2 is H-A (2026-10-22):
   * the unconditional "employers can check online" was not true for everyone —
   * verification answers only for members who list in the Pro Registry (18+).
   * R1 (2026-10-27): "employers AND INSTRUCTORS" — verified instructors and
   * schools verify exactly as employers do (server live 2026-10-04), and the
   * verify functions (public_verify_*) are open to anyone, never employers
   * only.
   */
  membershipPoints: [
    'Every topic, certificate and lab is included.',
    'Earn certificates — list them in the Pro Registry and employers and instructors can verify them online.',
    'No add-ons. No extra fees.',
  ] as readonly string[],
  /** H3: the SHAPE of the pricing on the landing — never a price. */
  membershipShape: 'Monthly, yearly, or pay once for lifetime.',
  /** H5 / R8: the free path's caption. True: Start Here is free for everyone, guests included. */
  startHereCaption: 'A short beginner lab. No account needed.',
  /** H1: HOME demoted to a footer link. */
  skipToHome: 'Skip to Home',
  /** H2: Explore Topics + Enroll merged into one button. */
  topicsAndCertificates: 'TOPICS & CERTIFICATES',
  /** Compliance (Apple 5.1.1(v)): the account step is stated BEFORE the plans, guests only. */
  guestAccountStep: 'You’ll create a free account to finish — your plan stays selected.',
  /** The guest's buy button (R3 / review notes §2a). */
  createAccountToContinue: 'CREATE ACCOUNT TO CONTINUE',
  /** H10: the "Free vs. membership" block below the buy button. */
  freeVsMembership: 'FREE VS. MEMBERSHIP',
  /** The ratified free-glossary claim (was paywallBody ¶1, sentence 1), VERBATIM.
   *  ⛔ R7: it never renders without glossaryFreeAllowance + calcFreeAllowance
   *  right after it. */
  freeGlossaryClaim: 'The free glossary is your professional audio reference.',
  /** paywallBody ¶1 sentence 2 with the one product name in place of
   *  "Upgrade to Academy Mode" (H5). */
  membershipUnlocks:
    'Academy membership unlocks guided learning, study tools, quizzes, progress tracking, and the ability to earn Academy certificates. Enroll in as many as you like — choosing more never costs more.',
  /** Was paywallBody ¶2 — ratified, VERBATIM. It is the CONDITIONAL form of the
   *  verification claim ("Create an optional profile…"). Last sentence ADDED by
   *  the owner 2026-10-22: the listing never depends on membership (true in the
   *  DB — the registry/verify functions check age 18+, never membership). */
  registryProfile:
    'Create an optional profile in the Pro Audio Training Academy Professional Registry. As you earn certificates, your profile becomes a verified graduate record that employers and instructors can validate online and you can share on résumés, job applications, portfolios, and professional networking profiles. Your listing and certificates stay in the registry whether or not you keep your membership.',
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
   *  server's `calc_consume()`. If that constant moves, this moves with it.
   *  "A free ACCOUNT" (toddler hunt #27, owner 2026-10-14): calculators ask a
   *  guest to create an account first, so "Free use also includes…" was false
   *  to a guest. True for a signed-in free account too, so one string serves
   *  both; it follows `glossaryFreeAllowance` on the Upgrade sheet + Paywall. */
  calcFreeAllowance: 'A free account also includes 5 calculations a week.',
  /** The lab-preview sheet once the person BECOMES a member while it is open
   *  (toddler hunt #32, owner 2026-10-14): no more selling — one button that
   *  closes the sheet and leaves the (now unlocked) lab open. */
  labPreviewMemberTitle: 'You’re a member — open the lab',
  labPreviewMemberButton: 'OPEN THE LAB',
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
   * Split: the first line is about the ACT of choosing (part of the membership
   * — see the ⛔ note below; it once said "costs nothing"), the
   * second is about what the MEMBERSHIP covers (everything, with no per-item
   * charge). Neither one claims the membership itself is free.
   *
   * It was copy-pasted into five call sites across two screens before this, so
   * it lives here now — the same sentence in five places is five chances to
   * drift.
   */
  /*
   * ⛔ ENROLLMENT IS NOT FREE (owner, TestFlight build 32, 2026-09-30:
   * "Enrollment is not free. That statement is confusing."). This line used to
   * read "Enrolling costs nothing — …". Studying certificates (and every topic
   * except the two free ones, Pro Audio Safety and DAW Fundamentals) needs a
   * membership, so the line now says enrolling is part of the membership. The
   * key keeps its old name only so the five call sites need no edit; never put
   * "free" / "costs nothing" back in it. Guarded by
   * test/testflight32CredentialScenarioCopy.test.ts.
   */
  /*
   * …AND IT MUST BE TRUE FOR EVERY TOPIC (TestFlight triage 2026-10-08). "Enrolling
   * is part of the membership" said it of ALL topics, but Pro Audio Safety and
   * DAW Fundamentals (FREE_ENROLL_GS) open for everyone, guests included. The
   * line now names the exception instead of hiding it — still without the word
   * "free", which the owner found confusing here.
   */
  enrollFreeLine: 'Certificates, programs and topics are part of the membership — only Pro Audio Safety and DAW Fundamentals open without one.',
  membershipCoversLine: 'One membership covers them all. Choosing more never costs more.',
  // Introductory lifetime offer (Booth 2026-07-15). (`lifetimePrice: '$99.99'`
  // was deleted 2026-10-22 — no consumer, and a hard-coded USD figure must not
  // be wired back onto the landing: H3, prices come from the store.)
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
  //  5. (2026-10-22, H11) ONE line under the plans. Its second sentence ("The
  //     lifetime membership is a one-time payment.") moved to where it is
  //     needed: the Lifetime card's "One-time payment" and the plan-specific
  //     disclosure above the buy button. The date only stays honest if the
  //     prices really rise that day (owner H-B: they do — set in the stores).
  pricingNote: `These prices are available until ${CURRENT_PRICING_ENDS_LABEL}.`,
  /** Short deadline line for an individual plan tier. */
  introDeadline: `Current price — until ${CURRENT_PRICING_ENDS_LABEL}`,
} as const;
