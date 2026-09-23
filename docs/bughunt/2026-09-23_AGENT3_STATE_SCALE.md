# Agent 3 — account state, entitlement, data scale (2026-09-23, overnight)

Raw agent findings. **Unverified at time of writing** — each checked against
source below before any fix.

**Theme the agent reports:** the mobile app is now hard to break, so what
survives is DRIFT AT THE SEAMS — `web/` holds copies of mobile logic that were
correct when written and never updated when the mobile original was fixed, plus
single call sites that missed the idiom their siblings adopted.

---

## A3-1 · The directory lists 30 people and says there are hundreds · TRAPS + FALSE
- `ExploreView.tsx:80`, `:273`; `directory/api.ts:299-302`, `:337`
- `searchDirectory(filters)` — never a `page` argument, and `pageSize = 30`.
- The header count is the SERVER's `total_count`, not the page length.
- No `onEndReached`, no "load more", no page state anywhere in the view.
- Past 30 published members: header says "212 members", list has 30 rows, the
  other 182 are unreachable by any interaction.
- Agent confidence: VERIFIED IN SOURCE.

## A3-2 · Trophy Case says "0 / 166" when the progress read FAILS · FALSE
- `achievements/api.ts:80-83` — `error` not destructured; supabase-js RESOLVES
  `{data: null, error}` on an RLS denial, so `statusById` is empty and every
  topic falls to `'locked'`.
- Its own sibling `fetchGalleryV3` (`:165`) does `if (error) throw error` with a
  comment about not swallowing a read failure as an empty gallery.
- Both consumers' `.catch()` error states are therefore unreachable
  (`TopicsScreen.tsx:56-67`, `AchievementsHomeScreen.tsx:79-81`).
- `fetchNearestCredential` (`:214-246`) then recommends from an all-zero set.
- Agent confidence: VERIFIED IN SOURCE.

## A3-3 · Term-count denominators unpaginated; the clamp hides it · TRAPS + FALSE
- `dashboard/api.ts:179-182` (fallback) and `:204-207` (sibling union, NOT a
  fallback — it runs whenever an enrolled topic has zero direct terms, which is
  the path gs3060 Professional Audio Safety already takes).
- Neither has `.range()`/`.limit()`; this repo establishes the cap is 1000.
- Too-small denominator → `studyDisplayPct`'s `Math.min(100, …)`
  (`study/api.ts:310`) shows a confident 100% on an unfinished topic.
- Zero denominator → `if (totalItems <= 0) return 0` → the method chain and quiz
  are dead switches.
- Also: `curriculumStats.ts:111-124` `.range()`s with NO `.order()`, so pages can
  repeat or skip and the per-subject "N terms" is wrong.
- Agent confidence: missing pagination + clamp VERIFIED; whether production
  crosses 1000 on these `.in()` sets INFERRED. Missing `.order()` verified.

## A3-4 · The WEBSITE dashboard is built on the retired v1 course model · FALSE
- `web/lib/dashboard.ts:145-149`, `:179-184`; `web/app/dashboard/page.tsx:121`
- Reads `enrollment` joined to archived `courses`, keys topics on
  `achievements.course_id` — the exact code the app DELETED on 2026-09-03
  (`dashboard/api.ts:343-349` explains why). Live model is
  `user_topic_enrollments` on `global_sequence`.
- `error` discarded, so a dropped table is indistinguishable from no enrolments.
- A paying v3 member sees "You're not enrolled in any topics yet", "0/0 topics",
  0%. Credentials still render, which makes the empty progress read as truth.
- Agent confidence: model mismatch VERIFIED; whether the tables still exist
  INFERRED (both outcomes produce the identical empty page).

## A3-5 · The WEBSITE re-introduces BOTH entitlement bugs the app was fixed for
- `web/lib/dashboard.ts:50-62`, header calls itself "Mirror of EntitlementProvider"
- `(data ?? [])[0]` with no `.order()` — the app's fix scans for ANY active
  non-expired row because multiple academy rows exist with no guaranteed order.
- `new Date(expires_at).getTime() > Date.now()` — `NaN > now` is FALSE, so an
  unparseable expiry reads as ALREADY EXPIRED. The app's ruling is
  `classifyExpiry` + `Number.isFinite` + fail open.
- No `lastTier` fallback, so a transient failure silently returns `"free"`.
- A paying member sees "Membership lapsed" on the site the app links to.
- Agent confidence: VERIFIED IN SOURCE.

## A3-6 · A member's public profile shows an employer NO CREDENTIALS on error
- `web/lib/community.ts:50-61` — `c.error` never read (`p.error` is).
- The app fixed exactly this on 2026-09-18; `directory/api.ts:378-404` records
  that the likely trigger is not a blip but the RLS-policy-without-a-GRANT
  failure this project has already shipped once, which returns zero rows rather
  than an error — so EVERY profile would show zero credentials, permanently.
- `CommunityProfileView.tsx:118` gates the whole block on `length > 0`, so the
  "Verified credentials" section is simply absent.
- Agent confidence: VERIFIED IN SOURCE.

## A3-7 · MINOR — topic popup tells a member their topic needs membership
- `TopicDetailModal.tsx:105-106`, copy `:231-236`
- The only one of 35 `useEntitlement()` consumers that gates on `entitlement`
  without also reading `resolved`. Provider boots at `'anonymous'`.
- Text only, no access withheld.
- Agent confidence: VERIFIED IN SOURCE.

---

## Reported clean (agent's own negative results)
Two-id-space discipline (no site conflates `auth.uid()` with `public.users.id`;
both `session.user.id` reads feed `.eq('auth_id',…)`); the `'local'` sentinel
guard; `isRealAccount`/`isGuestSession`; `lastTierCache`; `academyTierFromRows`
and `classifyExpiry` in the APP; `withMembershipPreview` + its 4 s GateHold;
`studyGate`'s two non-interchangeable predicates; the cap fallback windows that
close the airplane-mode bypass; the whole glossary corpus path (pages at 1000
WITH `.order('term')`, lazy definitions, batched offline save);
`student_method_progress` bounded at 684 rows; all 27 divisions by `.length`
guarded; `careerfinder/scoring.ts` zero-evidence handling; `fetchAwardProgress`
returning null rather than an authoritative zero.
