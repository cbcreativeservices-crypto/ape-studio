# Final adversarial pass — night of 2026-09-13

Independent re-attack of the night's own commits (275c5a31, cd7f7273, 3b043e9f,
8f7f34a2, 77ef22ce, fa34f749). Nothing in the sibling reports was trusted;
every claim below was re-verified in code. Gates at the end of this pass:
`npx tsc --noEmit` clean, `npm test` 1165/1165.

**Verdict: no confirmed regressions. Zero fixes required. All seven surfaces
attacked and clean, with report-only notes below (none introduced tonight).**

---

## 1. EntitlementProvider.refreshEntitlement rewrite (77ef22ce) — ATTACKED AND CLEAN

What was checked:
- **Never-reject masking a needed error:** the whole body is try/caught; a
  getSession throw or read error returns `false` with the tier KEPT (never a
  downgrade). No caller depended on the old rejection: greps found exactly 3
  call sites (PaywallScreen ×2, SettingsScreen redeem, AuthScreen signup).
  AuthScreen's `await refreshEntitlement()` sat inside a catch that showed
  "Couldn't reach the Academy" after a SUCCESSFUL redeem — the new no-reject is
  strictly better there.
- **Boolean return changing caller logic:** only PaywallScreen branches on it
  (reflectPurchase, onRestore) — both new tonight and correct. AuthScreen and
  SettingsScreen ignore the return value; their control flow is unchanged.
- **Boot retry mechanism:** `deriveWithRetry` / generation counter / `tierKnown`
  raise-only mechanism is byte-untouched by this commit (diff only rewrote the
  separate `refreshEntitlement` callback + docs).
- **Member shown guest state:** the `!isRealAccount → 'anonymous'` branch is
  pre-existing, mirrored from the boot effect; the rewrite did not widen it.

Report-only notes (pre-existing, NOT tonight's regressions):
- `refreshEntitlement` still never sets `tierKnown`, so a purchase completed
  after a failed boot read leaves memberStanding 'unknown' until the next auth
  event/boot — notifications arm late, never wrongly cancel. Same before/after.
- A stale boot RETRY (10 s ladder) is not superseded by a `refreshEntitlement`
  success; in the worst race it re-reads the server and lands the same tier.
- SettingsScreen redeem: `res.ok && !refreshed` still notifies "Code applied"
  while the tier hasn't visibly changed (boot retry / restart heals it). Same
  honesty class the paywall got fixed for; a one-line follow-up if wanted.
- A GUEST (anonymous session) can reach the Paywall from ~15 entry points and
  `onContinue` only blocks `isMember` — an anonymous buyer whose receipt
  validated server-side would refresh to 'anonymous' and stay locked. Product-
  level gap that predates tonight; flagging for the owner's launch list.

## 2. v3Curriculum Strict/lenient split (fa34f749) — ATTACKED AND CLEAN

- All 9 lenient-caller files re-checked (CurriculumScreen, AwardsScreen,
  awardsData, achievements/api, topicTrophies, CareerFamilyScreen,
  CourseSelectionScreen, HomeSetupSheet, ProfileScreen): every one gets exactly
  the old contract (`[]` on failure, no rejection). CurriculumScreen's M15
  machine still treats empty-as-error itself, so it needs no migration.
- Memo thrash: rejection evicts the memo, but a refetch only happens when a
  caller calls again (screen focus / RETRY) — concurrent callers share the one
  in-flight promise; no storm, no loop.
- Strict callers: only EnrollmentScreen's `loadBrowse`, whose Promise.all sits
  inside try/catch with the `browseAlive` ref guarding late setState. No
  unhandled-rejection path exists (the lenient wrappers attach their own catch).

## 3. Enrollment reorder stack (3b043e9f) — ATTACKED AND CLEAN

- `moveTopicVisible`/`moveBundleVisible` read module-level synchronous stores
  (getEnrollment/getBundles — plain arrays, commit() is sync), so compounding
  multiple store swaps inside one drag event has no React-state race; `prog`
  is per-render but progress can't change mid-gesture. The hidden-row predicate
  (pct ≥ 100 / isBundleDone) exactly matches how `displayed` and the rendered
  bundle list filter — and reorder is only live with zero filter chips
  (`customOrder`), so no filtered view can desync the skip logic.
- Lift-drop safety effect: it only fires `endLift()` when the lifted id has
  actually LEFT `rowOrder.current` — a normal drag re-render keeps the id
  present, so it cannot fire mid-drag; a filter/completion that removes the row
  is precisely the stranding case it exists for. Deps (`displayed`,
  `displayedBundles`) are the arrays `rowOrder.current` is rebuilt from.
- `rowOrder.current.bundles` done-filter now matches the render-site filter
  (`!isBundleDone`) — the phantom-neighbor fix is internally consistent.
- HoldToRemove `onTouchStart` stopPropagation: blocks only the bubbled touch
  event that arms the parent's 500 ms lift timer. The remove hold itself uses
  the Pressable's own responder (onPressIn/Out — unaffected), and the row's
  swipe-collapse lives in PanResponder NEGOTIATION (should-set callbacks),
  which stopPropagation does not participate in. Device pass should still
  confirm a swipe that begins on the Remove button collapses the row.
- HomeSetupSheet clamp + sheet-reopen lift reset: clamp computes `applied`
  against the pre-event `order` and only banks committed swaps — handlers are
  recreated per render so `order` is never stale across events; the reopen
  reset clears timer/refs/anims before rebuilding the draft. Clean.

## 4. EngineGate + mic permission (8f7f34a2) — ATTACKED AND CLEAN

- **No host passes `onRetry` yet** (all ~30 call sites checked) — TRY AGAIN and
  ALLOW MICROPHONE are dormant; the only live change is OPEN SETTINGS on the
  'denied' card, whose `Linking.openSettings()` is valid iOS + Android and
  catch-guarded (web preview: rejects silently, copy still names the manual
  path).
- Android "don't ask again": useDspEngine's start() → `PermissionsAndroid
  .request` resolves DENIED instantly → `setState('denied')` — the card
  honestly stays on 'denied'; no spinner, no lie. The card copy already says
  "if Android no longer shows the request, enable it in Settings instead".
- 'mic' CapabilityKey added to the store union + resetAskModes — additive,
  unwired (per the report), breaks nothing.

## 5. PaywallScreen restore/manage/disclosure (77ef22ce) — ATTACKED AND CLEAN

- **Busy is cleared on every path:** purchase-success (reflectPurchase's .then
  sets busy false before both the welcome and the Retry/Later alert), purchase
  onError, buyPlan throw, restore's .then switch AND its belt-and-braces catch.
  Retry re-sets busy and recurses through the same guarded chain.
- **Double-tap restore / restore-while-purchasing:** the Restore pressable's
  onPress is `undefined` while busy, and CONTINUE is replaced by the spinner
  while busy — neither flow can start while the other runs.
- Restore result mapping re-verified against purchase.ts: 'none' only when the
  store answered with no matching SKU; found-but-validation-failed → 'error';
  module missing → 'unavailable'; each renders distinct copy. `restored` with
  a failed refresh shows the honest "recorded, unlock shortly" copy.
- Manage link: correct iOS itms-apps URL + Play subscriptions URL with the
  app's package id; gated to `resolved && (academy || lapsed)`.

## 6. HelpScreen search param + filterHelp (275c5a31) — ATTACKED AND CLEAN

- **No re-apply loop:** the effect depends on the `routeSearch` string value;
  setQuery doesn't change params, so it fires only when a "?" key actually
  navigates with a different string. Verified no other writer of that param.
- filterHelp title match: category titles are 6 short headers; "tool" keeping
  TOOLS & LABS whole is the intended fix. A query like "data" or "account"
  returns that whole category — coherent, not surprising. Transient breadth
  while typing through short substrings ("in" hits GETTING STARTED) narrows as
  the query grows — acceptable search behavior, and governed copy is untouched.
- Report-only: pressing the SAME screen's "?" a second time after the user
  edited the query does not re-apply the pre-fill (same param value → effect
  won't refire). Cosmetic; would need a nonce param if the owner ever wants it.

## 7. The night's tests (cd7f7273 + fa34f749) — ATTACKED AND CLEAN

- calcUsage.test.ts: every assertion re-checked against calcUsage.ts — the
  happy-path block-at-5 tests would fail if fail-open swallowed a real refusal
  (the exact dead-glossary-cap class). Not vacuous; `unavailable` asserted on
  both sides.
- v3CurriculumErrors.test.ts: matches the shipped Strict/lenient contract,
  including the link-table error case and memo retention after success /
  eviction after failure. The deliberate test ORDER (failures before the
  success memo) is documented in-file and correct.
- coachMark.test.ts: micro hook runtime has real re-render-on-setState
  semantics and effect dep-diffing; assertions line-checked against
  coachMark.ts (retire at 5, once-per-session count, corrupt→0, unreadable
  storage→retired, dev bypass never writes, suppression wins). Breaking any of
  those in the hook fails a test.
- enrollReorderStep.test.ts: the replica is line-equivalent to the CURRENT
  inline loop (guard 24, `|| DRAG_ROW_H`, strict `<`, local mirror swap,
  accum bookkeeping) — 3b043e9f changed the move CALLBACK and rowOrder
  contents, not the stepping math, so the spec still pins shipping behavior.
  The extraction report item stands.
- helpContent.test.ts / screenIntros.test.ts: structural pins (unique ids,
  real routes parsed from navigation/types.ts, every HelpKey pre-fill matches
  ≥1 entry — "tool" passes via the title-match fix). Green against the
  post-fix filterHelp.

## Device-only items (cannot be exercised here)

1. Swipe-collapse beginning ON the HoldToRemove button still collapses the row
   (responder negotiation vs stopPropagation — reasoned safe, worth one swipe).
2. Hold Remove for the full 1100 ms: card must NOT lift, row removes, scroll
   stays live afterwards (the #3 stranding fix, end to end on glass).
3. Android "don't ask again" → EngineGate denied card → OPEN SETTINGS lands on
   the app's settings page (both platforms).
4. IAP flows (purchase, restore, failed-refresh Retry/Later) — build-only.
5. BROWSE & ADD triad offline: spinner → error card → RETRY refetches (memo
   eviction on device network).
