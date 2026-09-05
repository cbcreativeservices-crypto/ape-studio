# ccode → Computer A: the flashcards MISTAKES side and `common_mistakes` (2026-09-05)

Paste-ready for Computer A's chat. Read-only findings; ccode ran no SQL and changed nothing in the database.

## What the app does with `common_mistakes`

- The Flashcards screen has a MISTAKES side that renders `GlossaryItem.common_mistakes: string[] | null` as bullet lines (`src/screens/study/FlashcardsScreen.tsx`, `levelText` case 5).
- Study items come from `glossary_study_v` (one query per topic, `select … common_mistakes`, backend handoff 2026-07-16 v2.13). The legacy path reads base `glossary` without that column and then patches `common_mistakes` from `glossary_full_v` non-fatally (`src/features/study/api.ts` lines ~50-190).
- Per the handoff, both views **mask `common_mistakes` per entitlement server-side** through `has_academy_access()`; anon / free are meant to get NULL.

## What ccode observed (anon publishable key, PostgREST, 2026-09-05)

| Probe | Result |
|---|---|
| `glossary_study_v?select=glossary_id,term,…,common_mistakes` for every active v3 topic (166 topics, 27,201 rows) | `common_mistakes` is `null` on **all 27,201 rows** |
| `glossary_full_v?select=id,common_mistakes&limit=2` | 200, `common_mistakes: null` |
| `glossary?select=id&common_mistakes=not.is.null` | **401 `42501`** — "Grant the required privileges … GRANT SELECT ON public.glossary" (anon has no SELECT on that column; expected under the column-level grants) |
| `glossary_study_v?select=glossary_id&common_mistakes=not.is.null` | **500 `57014`** statement timeout (the mask expression is evaluated per row for the filter) |
| `plain_english`, `scenario_contexts` on the same 27,201 rows | present on every row |

So from the anon vantage the mask is working. **ccode cannot see the member side**: the audit harness and the web preview have no Supabase session, so nothing here says whether the column is populated or whether an academy session actually receives it. Until this note, the card silently showed the *definition* under the MISTAKES label whenever the value was null (an eyes-on reader caught it on "ADR Taker", topic 4130); that is now an honest line (below).

## What ccode needs from Computer A (three questions, no action implied)

1. **Is the base column populated?** e.g. `select count(*) filter (where common_mistakes is not null and cardinality(common_mistakes) > 0), count(*) from public.glossary;` — the recent term-buckets export (26,847 rows) was described as carrying `common_mistakes`; if the column is empty, the MISTAKES side has never had content and that is a content task, not an app bug.
2. **Does an academy session receive it?** With a real academy user's JWT: `glossary_study_v?select=glossary_id,common_mistakes&achievement_id=eq.<any v3 topic>&limit=5` should return arrays, not NULL. The api.ts comment from 2026-07-11 says anon/free "cannot EXECUTE `has_academy_access()` yet (backend grant pending)" — please confirm the current grant state for **authenticated** too, since a missing EXECUTE would make the mask NULL for members as well.
3. **Is the 500 on a `not.is.null` filter expected?** Not something the app does (it never filters on that column), noted only so nobody chases it later.

Nothing else is requested. The DB stays frozen; ccode will not touch the views, the function, grants, or RLS. If the answer to (2) is "members do get it", the app needs no change. If the answer to (1) is "empty", the honest line already covers it until the content lands.

## What the app shows now (client only, non-ratified copy — flagged for the owner)

MISTAKES side when `common_mistakes` is null:
- non-member tiers: `(Common-mistakes notes are an Academy member feature — here is the definition.)` + definition
- academy tier: `(No common-mistakes note written for this term yet — here is its definition.)` + definition

Same shape for the other optional sides (plain-English, purpose & application, scenarios, related terms) — those are populated on every row today, so the line should never appear there.

## How to re-check from ccode's side after any change

`node scripts/study-text-audit.mjs after` prints `fc_noMistakes` (rows whose `common_mistakes` is empty as seen by anon). It will stay 100% by design as long as anon is masked; a member-side check is Computer A's.

Context: the full study-text audit (why every question now has a blank and never contains its own answer) is in `docs/APE_STUDY_TEXT_AUDIT_2026_09_05.md`.
