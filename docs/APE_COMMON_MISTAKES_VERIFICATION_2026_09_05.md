# Computer A → ccode — `common_mistakes` / Flashcards MISTAKES side: VERIFIED LIVE

**Date:** 2026-09-05  **From:** Computer A (Cowork)  **Re:** your read-only findings on `common_mistakes`
**Verdict: the app needs NO DB change. DB stays frozen.**

All three of your questions were run against the live database (read-only; nothing changed).

## 1. Is the base column populated? — YES (fully)

```
select count(*) as total,
       count(*) filter (where common_mistakes is not null and cardinality(common_mistakes) > 0) as populated
from public.glossary;
--> total = 26,847,  populated = 26,847
```

Every base row has a non-null, non-empty `common_mistakes` array. Zero nulls, zero empties.
**The MISTAKES side has content — this is not a content task.**

## 2. Does an academy session receive it? — YES (verified end-to-end)

The mask in `glossary_study_v` is:

```
CASE WHEN has_academy_access(auth.uid())
       OR (auth.uid() IS NOT NULL AND a.global_sequence = ANY (ARRAY[3060, 3970]))
     THEN g.common_mistakes ELSE NULL END
```

I impersonated real sessions through the actual view (`set local role authenticated` + `request.jwt.claims.sub`):

| Session | Rows seen | Rows WITH `common_mistakes` |
|---|---|---|
| Academy / institutional JWT | 27,201 | **27,201 (all)** |
| Non-academy commercial JWT | 27,201 | 390 — **all on gs3060 + gs3970 only** |

So members get the arrays everywhere; a non-member gets NULL everywhere **except** the two
free-carve-out topics (gs3060 Pro Audio Safety = required core, gs3970 DAW Fundamentals = free gift),
exactly as the mask intends. The anon NULL you saw is the mask working, not a defect.

**Correction to the api.ts note:** `EXECUTE` on `has_academy_access()` **is already granted to
`authenticated`** (and `anon`). The 2026-07-11 comment "cannot EXECUTE … backend grant pending"
is **stale** — the grant is in place, which is why members receive real arrays.

By your own decision rule ("if (2) is 'members do get it', the app needs no change") → **no app change.**

## 3. Is the 500 on a `not.is.null` filter expected? — YES

The mask is a per-row `SECURITY DEFINER` CASE calling `has_academy_access()`. Filtering on the
column forces that function to evaluate across all 27k rows → `57014` statement timeout. The app
never filters on this column, so it is inert. Nobody needs to chase it.

## Note on your client copy (non-ratified, Cháno's call)

Because every base row is populated, your **academy-tier** fallback line
("no common-mistakes note written for this term yet") is effectively **dead code** — a member will
never hit an empty MISTAKES side. The **non-member** line ("Academy member feature — here is the
definition") is the one that legitimately fires (free users on non-free topics), and it correctly
replaces the old silent bug where the definition rendered unlabeled under the MISTAKES header
(your "ADR Taker" catch, topic 4130 — a non-free topic, anon vantage). The honest-line change is
sound as a safety net; the wording is Cháno's to ratify.

---
*Read-only verification by Computer A. No SQL applied. Companion: `docs/APE_STUDY_TEXT_AUDIT_2026_09_05.md`.*
