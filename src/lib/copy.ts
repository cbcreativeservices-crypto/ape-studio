/**
 * Commercial-mode copy (CM1, Booth 2026-07-11). VERBATIM — do not reword.
 * These strings are ratified marketing/lock copy; changes route to governance.
 */
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
  /** The same fact WITHOUT the membership clause, for the Auth screen (owner
   *  2026-09-13). Two reasons it is short there: the full sentence pushed the
   *  guest note to three lines and its tail below the fold on a Pixel, and a
   *  sign-in screen is not where an upsell belongs - the person has not chosen
   *  anything yet. Same 14, same single source. */
  glossaryFreeAllowanceShort: 'Free use includes 14 definitions a week.',
  // Introductory lifetime offer (Booth 2026-07-15).
  lifetimePrice: '$99.99',
  lifetimeOffer:
    'Introductory lifetime price — one payment for lifetime academy access. Available through the end of the year.',
  // Beta pricing note (Booth 2026-07-18) — shown wherever plans/prices appear
  // and on signup.
  betaPricingNote:
    'Introductory pricing for our early beta (new-adopter) users — all prices are valid through the end of the year. ' +
    'Lock in now early low priced subscriptions or the lifetime academy membership fee.',
  // Short introductory deadline shown on EVERY plan tier (user request
  // 2026-07-17) — the end-of-year deadline applies to all sub levels.
  introDeadline: 'Introductory price — through the end of the year',
} as const;
