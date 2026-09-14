# Paywall store-readiness pass — night 2026-09-13

Store-review checklist paywall items (Apple 3.1.1 / 3.1.2, Play Subscriptions) plus the
error-triad audit's confirmed stranding bug (`error_triad.md`, stranding #1). Files touched:

- `C:\Users\profe\dev\ape-studio\src\screens\commercial\PaywallScreen.tsx`
- `C:\Users\profe\dev\ape-studio\src\features\commercial\purchase.ts`
- `C:\Users\profe\dev\ape-studio\src\features\commercial\EntitlementProvider.tsx`

Verification: `npm test` green (1147 pass / 0 fail). `npx tsc --noEmit` — my three files are
clean; the only remaining errors at time of writing are in `src/screens/enrollment/EnrollmentScreen.tsx`
(a sibling agent's in-flight edit of the audit's stranding #2; `src/data/v3Curriculum.ts` was
also mid-edit and resolved during this session). Nothing in this pass imports those files.

---

## 1. FIXED — post-purchase spinner stranding (error_triad stranding #1)

**Was:** `PaywallScreen.tsx:51` — `void refreshEntitlement().then(...)` with no `.catch`; a
`getSession()` rejection right after a CHARGED purchase left `busy` spinning forever.

**Now:**
- `EntitlementProvider.refreshEntitlement` (was :360) is fully guarded — the whole body is in
  try/catch, so it **never rejects**. Its contract widened from `Promise<void>` to
  `Promise<boolean>`: `true` = a definitive tier was applied (or refresh was moot — dev
  override, guest), `false` = the read failed and the current tier was kept. Existing
  callers that `await` it and ignore the result (SettingsScreen:107 redeem, AuthScreen:239)
  are automatically de-stranded without edits — a rejection there no longer exists.
  A failed read still never downgrades the tier.
- `PaywallScreen` purchase-success path: `reflectPurchase()` refreshes (with a
  belt-and-braces `.catch`), clears `busy` on **every** path, and on `false` shows an
  honest recovery alert that never implies the purchase failed, with Retry (re-runs the
  refresh) and Later (safe to leave — the entitlement is already on the server; boot
  read / auth events pick it up).

## 2. Restore Purchases — control existed; made honestly three-state

The visible "Restore purchases" control was already on the paywall (Apple's requirement was
already met in form). What was wrong (error_triad :120-123 dishonest-state and :126 hygiene):
`restorePurchases()` returned `false` for both "no prior purchase" and "store/network threw",
so the screen asserted "No previous Academy purchase was found" to an offline member, and the
`.catch` silently stopped the spinner.

**Now:** `purchase.ts` exports `RestoreResult = 'restored' | 'none' | 'error' | 'unavailable'`.
`'none'` is returned **only** when the store answered and holds no academy purchase; a held
academy purchase whose server validation failed maps to `'error'` (retryable), as does any
store exception; missing native module maps to `'unavailable'`. The restore still re-validates
through the existing `validate-purchase` edge-function path and finishes transactions.
The paywall renders four distinct outcomes (restoring spinner / restored + entitlement
refresh / nothing-to-restore / store-unreachable error), plus a sub-case when restore
succeeded but the local entitlement refresh didn't. Nothing fails silently anymore.

## 3. BUILT — Manage/Cancel subscription link

Quiet "Manage subscription" link under Restore, shown only when `resolved &&
(entitlement === 'academy' || 'lapsed')`. Opens via `Linking.openURL(...).catch(...)`:

- iOS: `itms-apps://apps.apple.com/account/subscriptions`
- Android: `https://play.google.com/store/account/subscriptions?package=com.cbcreativeservices.apestudio`

**Deviation from the briefed `?sku=<sku>&package=` pattern, deliberate:** the client cannot
know WHICH sub the user holds — the entitlement read (`product='academy'`) doesn't carry the
store SKU, and a lifetime holder has no sub at all. `package=` alone deep-links the Play
Subscription Center filtered to this app, which is Google's documented fallback. If the owner
wants SKU-precise links, the entitlements row would need to expose the store product id
(backend change — frozen, so REPORT only). Lapsed members see the link too (resubscribe path);
lifetime members see it harmlessly (Play shows no subs).

## 4. Disclosure block — verified + gaps filled

Checklist item vs state:

| Requirement | Status |
| --- | --- |
| Price | Already compliant — per-plan cards ($99.99 / $59.99 yr / $9.99 mo) |
| Billing period | Already compliant — on the cards ("/ yr", "/ mo", "One-time payment") |
| Auto-renewal statement | Existed but sat BELOW the buy button — **moved above CONTINUE**, string byte-identical (position change only, no copy change) |
| What's included | Already compliant — `COPY.paywallBody` enumerates guided learning, study tools, quizzes, progress tracking, certificates; plus the glossary-allowance line |
| Terms / Privacy links | **Missing — added**: "Terms of Use · Privacy Policy" row above the buy button, opening `https://www.proaudiotrainingacademy.com/terms` and `/privacy` (both pages exist: `web/app/terms/page.tsx`, `web/app/privacy/page.tsx`), each with a `.catch` fallback alert |

Visual idiom: links/manage use the paywall's existing quiet-text treatment (`legal`/`restore`
styles as reference — barlow, textSub/textMuted, centered); no new button chrome. (The brief
said "StudioButton variants" — the paywall actually uses `GlassButton` + text Pressables;
followed the real idiom.)

---

## DRAFT strings — owner ratification list (all marked `// DRAFT COPY — owner ratifies` in source)

All in `src/screens/commercial/PaywallScreen.tsx`:

1. Alert title: `Purchase complete`
2. Alert body: `Your payment went through and your membership is recorded. We couldn’t refresh your access on this device yet — check your connection and retry.`
3. Button: `Retry`
4. Button: `Later`
5. Restore-succeeded-but-refresh-failed body: `Your previous purchase was verified and your membership is recorded. We couldn’t refresh your access on this device yet — it will unlock shortly, or restart the app.`
6. Restore-unavailable body: `In-app purchases aren’t available in this build yet. Please update the app and try Restore again.`
7. Alert title: `Restore didn’t finish`
8. Alert body: `We couldn’t reach the store to check your purchases — check your connection and try again. If you were charged, your purchase is safe.`
9. Link + alert title: `Manage subscription`
10. Alert body: `We couldn’t open your app-store subscription settings. Open the App Store or Play Store app and look under Subscriptions.`
11. Alert title: `Page unavailable`
12. Alert body: `We couldn’t open the page — visit proaudiotrainingacademy.com/terms in your browser.` (same template for `/privacy`; rendered from one template string)
13. Link: `Terms of Use`
14. Link: `Privacy Policy`

Strings NOT changed (already-shipped/ratified, reused verbatim): the Welcome-to-Academy alert,
`Purchases restored`, `Your Academy access has been restored.`, `Nothing to restore`,
`No previous Academy purchase was found for this store account.`, the consolidated
renewal/legal line (moved, not reworded), `Restore purchases`.

---

## Needs the next build / a device (cannot be verified here)

- Every IAP flow end-to-end: purchase, restore (all four outcomes), the purchase-success
  refresh-retry alert. expo-iap's native half only exists in a post-expo-iap build
  (`optionalModule('expo-iap')` returns null on current dev clients → everything reports
  "unavailable" by design). **Device/build-only.**
- The two store deep links (`itms-apps://…subscriptions`, Play Subscription Center URL)
  need a device with the store apps installed.
- No web harness renders the paywall at :8090 (no `#paywallpreview` hook exists), and the
  flows are Alert- and store-driven anyway — logic verified by reading + type-check + suite,
  per the mission's stated limits.
- expo-iap API surface note (checked in `node_modules/expo-iap/build/*.d.ts`): the library
  DOES export a `restorePurchases(): Promise<void>` — but it returns void (a store-sync
  trigger), which cannot drive an honest three-state UI. The app's own
  `restorePurchases()` wrapper therefore keeps using `getAvailablePurchases()` + the
  `validate-purchase` edge function, which yields real per-purchase outcomes. Approach
  unchanged; only the result type was made honest.

## Already compliant (no change needed)

- Visible Restore control on the paywall (pre-existing).
- Duplicate-purchase guard for existing members (`onContinue` member check, fail-safe on unresolved).
- Price / billing period / inclusions disclosure (see table above).
- Server-side receipt validation; no client-side grants.

## Report items for the owner (outside my edit scope)

- SKU-precise Play manage links would need the store product id exposed on the entitlement
  row (frozen backend).
- `error_triad.md` Settings:107 / Auth:239 stranding causes are closed by the provider fix,
  but their local UX (e.g. redeem-dialog feedback on failure) was not touched — Settings is
  outside this task's edit scope.
