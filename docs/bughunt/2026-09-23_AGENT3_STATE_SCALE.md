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

---

# VERIFICATION (by me, after the agent returned)

**7 raised · 7 confirmed in source · 0 false positives · 6 fixed · 1 sidelined
as a decision.** Two of the agent's "INFERRED" labels were resolved against the
live database, and both came back WORSE than it had guessed.

## A3-1 — CONFIRMED, FIXED
Grepped repo-wide: `searchDirectory` has exactly one caller and it never passes
a page. No `onEndReached`, no page state. `visibleTotal` is the server's
`total_count` minus locally-blocked rows, so the header is the true total over a
list of thirty.

Now pages on a "Show more members" button, de-dupes by token across requests (a
member publishing between two requests shifts the window and React would throw on
the duplicate key), and reads "Showing 30 of 212" while truncated. A failed next
page keeps what is already listed — losing thirty results the reader is looking
at, to report that a thirty-first could not be fetched, is the wrong trade.

## A3-2 — CONFIRMED, FIXED
Exactly as described, and the detail that makes it bad is that BOTH consumers had
already built the error state this one line made unreachable, and the sibling
twelve lines below (`fetchGalleryV3`) already throws with a comment explaining
why. The function's own doc comment promises a locked grid for a guest — honest,
because that is the `userId == null` branch. The same grid for a signed-in member
whose read failed is not.

## A3-3 — CONFIRMED, AND IT IS LIVE, NOT LATENT · measured
The agent labelled "does production cross 1000 rows?" as INFERRED. Queried:

```
glossary_topics rows over 166 live topics : 32,420
average mapping rows per topic            : 195
largest single sibling-name union         : 560   (two such topics cross the cap)
```

At 195 rows per topic the unpaged read truncates at roughly the **sixth enrolled
topic** — an ordinary member, not an edge case. Both reads now page and both now
order. `curriculumStats` already paged but ranged with no `ORDER BY`, which is not
stable pagination; ordered.

What made this expensive to see is the CLAMP. `studyDisplayPct` does
`Math.min(100, …)`, so a truncated denominator does not surface as an absurd
340% — it surfaces as a confident, tidy **100% complete** on a topic the learner
has not finished. A clamp around a number that could be wrong does not make it
right; it makes it unfalsifiable.

## A3-4 — CONFIRMED, AND WORSE THAN REPORTED. **NOT FIXED — owner decision.**
The agent could not tell whether the v1 tables still exist. They do — and that is
not the point. Queried:

```
live v3 topics with a course_id : 0      ← the join key the web page uses
v1 enrollment rows / users      : 20 / 3
v3 enrolment rows / users       : 91 / 6
```

`achievements.course_id` is NULL for **every** live v3 topic, so the per-course
topic query returns nothing for everybody. This is not "wrong for some users on
some data" — the website's progress panel is wrong for **100% of users today**,
and it fails silently into copy that reads like a fact:

> "You're not enrolled in any topics yet. Open the app to get started."
> **0/0 topics**, 0%

The credentials block on the same page still works, which is what makes the empty
progress read as truth rather than as breakage.

**Why I did not fix it:** the correct fix is to rebuild the panel on
`user_topic_enrollments` keyed on `global_sequence` — that is a rebuild of a
website surface and a decision about what the web dashboard should show, not a
bug fix I can make on the owner's behalf at 4am. Mitigating: the site is behind
the pre-launch gate, so no tester reaches it today. **This is the single biggest
item on the morning list.**

## A3-5 — CONFIRMED, FIXED (deployed)
Both defects present verbatim, in a file whose header calls itself a mirror of the
provider. The `[0]` half is currently latent — queried, no user holds more than
one academy row today — but the NaN half needs only one unparseable timestamp,
and the swallowed read error needs only a blip. Fixed all three, and pinned the
rulings on BOTH sides with a guard, since drift is the actual disease here.

## A3-6 — CONFIRMED, FIXED (deployed)
`p.error` checked, `c.error` dropped. The app's own fix comment from 2026-09-18
already spelled out that the likely trigger is not a blip but the
RLS-policy-without-a-GRANT failure this project has shipped once before, which
returns zero rows rather than an error — so every profile would show zero
credentials, permanently, with nothing looking broken. The page now says the
credentials could not be loaded instead of silently hiding the section.

## A3-7 — CONFIRMED, FIXED
The agent's claim that this is the only one of the `useEntitlement()` consumers
deciding without `resolved` held up. Text only, no access withheld — but telling
a paying member their topic "needs Academy membership" is not a small thing, and
for a member whose boot read failed with no `lastTier` cache it is not transient.

## Agent accuracy this run
7 findings, 7 verified, 0 false positives, and its two hedges were the two places
it was right to hedge. Its negative results were spot-checked in three places
(the corpus paging, the `'local'` sentinel guard, the 27 divisions by `.length`)
and were correct each time.
