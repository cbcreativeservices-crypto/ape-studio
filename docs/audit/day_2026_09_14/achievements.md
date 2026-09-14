# Achievements / Trophy Case + credential machinery — bug hunt (2026-09-14)

Scope hunted: `src/screens/achievements/**`, `src/features/achievements/api.ts`,
`src/components/CredentialBadge.tsx`, `src/components/TrophyImage.tsx`,
`src/features/credentials/*` (certificatePdf / certificateHtml / api / credentialArt),
`src/features/awards/api.ts` (read), navigation param contracts (read).
Verification: `npx tsc --noEmit` clean; `npm test` = 1165 pass / 0 fail (was 1165 before edits).

---

## FIXED

### 1. GalleryScreen conflated load-failure with an empty gallery (error-vs-empty)
- **Files:** `src/features/achievements/api.ts` (`fetchGalleryV3`, ~line 157),
  `src/screens/achievements/GalleryScreen.tsx`.
- **Bug:** `fetchGalleryV3()` swallowed a Supabase query error with `if (error) return [];`,
  and `GalleryScreen`'s `.catch(() => setEntries([]))` also produced `[]`. A transient
  read failure was therefore rendered as the empty state
  *"Earn your first trophy to see it here."* — telling a member who HAS earned
  trophies that they've earned nothing. This is the exact error-vs-empty class the
  launch audit (2026-09-09) explicitly fixed on the three sibling screens
  (`AchievementsHomeScreen`, `CredentialWall`, `TopicsScreen`) — Gallery, one level
  deeper (reached via Topics → "YOUR GALLERY ›"), was missed.
- **Fix (surgical):**
  - `fetchGalleryV3` now `throw error;` on a query error (a genuine guest/unlinked
    account still returns `[]` via the `!userId` guard, so it stays an honest empty).
    Sole caller is `GalleryScreen`, so no other consumer is affected.
  - `GalleryScreen` gains a `loadError` state + a `load()`/retry callback, and its
    `ListEmptyComponent` now shows an error card with a **Retry** button (same
    StudioButton `secondary`/`small` + `#161616`/`hairlineDim` card grammar as the
    sibling screens) instead of the "earn your first trophy" copy when the fetch
    failed. Retry re-runs the fetch.
- **Verify:** tsc clean, full suite green. Logic-only; render appearance matches the
  three existing error cards (device pass not required beyond visual parity).

---

## ATTACKED AND CLEAN

### A. COUNT MATH — hub cards vs drill-ins (attack surface 1)
- Hub (`fetchAchievementsHub`) and every drill-in read the SAME source functions:
  - Topics: both hub card (`t.earned / t.total`) and `TopicsScreen` header use
    `fetchTopicAchievements()` → `earnedTotal` / `totalCount`. Per-subject
    `earnedCount` sums up exactly to `earnedTotal` (both count `status==='complete'`),
    so subject rows can't disagree with the header.
  - Certificates / Programs: hub `certs.length` / `progs.length` and
    `CredentialWall` `rows.length` both come from `fetchMyCredentials()` filtered by
    `type`. Identical set → counts cannot diverge. No Career-Finder-style
    "screen count vs serialized count" split exists here.
- Recent strip: `RecentStrip loading={!t}` / `empty={!!t && recent.length===0}` is
  correct for the null-hub, empty, and populated cases; the loading placeholder is
  the same MINI height as a real tile, so cards don't jump (the A1-04 fix holds).

### B. PROGRESS → CREDENTIAL, QR path, entry/export invariant (attack surfaces 2 & 4)
- The store-readiness fix (`qrcode` promoted to a DIRECT dep with a literal
  `require('qrcode')` LOADERS row) is intact and guarded by `test/certificateQr.test.ts`
  (8 tests, incl. the source-text test that is the ONLY one that can see the Metro-side
  bug — mutation-checked). `verifiedUrl()` fails closed unless the QR URL matches the
  token AND registry host.
- Entry validation and export share ONE measurement path: `certificateNameFits()`
  and `buildCertificateHtml()` both call `fitText(normalizeText(x), HOLDER_SLOT)` with
  the identical `HOLDER_SLOT`. `ProfileScreen` gates the registry-name field on
  `certificateNameFits`. `test/hostileInput.test.ts` asserts entry-check ≡ export for
  17 cases (empty, RTL, emoji, decomposed accents, the 26/27 single-word boundary,
  doubled spaces) — the invariant is real and enforced, so an earned credential can
  never be permanently un-downloadable via a long/edge name.
- `fitText` refuses to truncate (throws `RangeError` with an explicit "nothing
  clipped" message) and `exportCertificate` never throws (typed reason → honest
  "needs the next app build" / "no PDF app" / "try again" copy). `isAvailable()`
  gates the download button + shows the honest note when the native print/share
  module isn't in the build.

### C. ERROR / EMPTY / LOADING TRIAD (attack surface 3)
- `AchievementsHomeScreen`: error card + Retry on `error && !hub`, keeps a stale hub
  on a failed refetch, loading placeholders don't jump. Holds.
- `CredentialWall` (Certificates + Programs): error card + Retry on
  `failed && (!rows || rows.length===0)`; waiting-slot loading placeholder; guest line
  held until entitlement `resolved`. Holds.
- `TopicsScreen`: `loadError` distinguished from loaded-empty. Holds.
- `GalleryScreen`: was the gap — now fixed (see FIXED #1).

### D. STATE — focus refetch, nav params (attack surface 5)
- The 2026-09-09 "permanent skeleton on failed hub fetch" bug is fixed and stays
  fixed (error state + Retry). Category navigation params verified end-to-end:
  - Home → `Topics` / `Certificates` / `Programs` (all `undefined` params).
  - `WaitingSlot` → `AwardProgress` with `{ awardType, awardId, awardName }` — matches
    `AwardProgressScreen`'s `route.params` destructure exactly; `awardType: kind`
    (`'certificate'|'program'`) matches `AwardType`.
  - `GalleryScreen` → `Trophy` with `{ topicName, achievementId, badgeEarned,
    entrySource }` — matches `AchievementsStackParamList`/root `Trophy` param shape.
- `fmtEarned` / `fmtDate` guard `NaN` dates (no "EARNED INVALID DATE" / literal
  "INVALID DATE"); `fetchMyCredentials` sorts undated rows last, not to the top.
- Focus-refetch has no in-flight cancellation (a fast focus/blur can set state after
  a newer load), but this is benign (idempotent data, last-write wins) and matches
  the rest of the codebase — not a correctness defect.

---

## OBSERVED — not a bug, no change (documented for the record)

- **Topics header count vs Gallery item count may differ by design.**
  `fetchTopicAchievements` counts every v3 topic with `status==='complete'`
  (regardless of `date_earned`), while `fetchGalleryV3` additionally requires
  `date_earned IS NOT NULL`. A `complete` topic with a null `date_earned` would count
  toward the Topics "N / total" header but not appear in the Gallery list. Gallery
  shows no competing count, and a chronological wall legitimately needs a date, so
  this is defensible; flagged only because it's the kind of asymmetry that could later
  read as a discrepancy. Confirming whether such rows exist needs DB access (out of
  scope — no DB reads performed).
- **`fetchNearestCredential` fallback numbers.** When `fetchAwardProgress` returns
  null (unlinked account / read fail), the WaitingSlot shows the credential's OWN
  topic totals (co-reqs excluded) rather than the server's unioned count. It's a
  graceful degradation, documented in the source, and the guest line replaces the
  meta text for anonymous users. No change.

## DEVICE-ONLY (not verifiable here)
- Visual parity of the new Gallery error card with the three existing error cards
  (colors/spacing are copied verbatim, so this is low-risk).
- `TrophyImage` expo-image vs RN-Image runtime paths and the grayscale `filter`
  (New Arch) render — logic unchanged by this audit.
