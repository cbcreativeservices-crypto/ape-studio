-- =====================================================================
-- glossary_study_v — mask the content columns (owner go, 2026-09-13)
-- =====================================================================
--
-- WHY. The glossary gateway (docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md)
-- revokes anon/authenticated SELECT on `glossary` so definitions can only be
-- read through a counting RPC. Reading the LIVE GRANTS showed that revoke list
-- does not achieve the brief:
--
--   * glossary_study_v granted SELECT to anon AND authenticated;
--   * it selected g.definition UNMASKED;
--   * its inner join covers 26,855 of 26,855 terms (0 unlinked — measured);
--   * every guest who accepts the glossary's temporary device key becomes
--     `authenticated`.
--
-- So the scraper the gateway exists to stop would sign in anonymously — one
-- tap, no email — and page the whole corpus out of this view in ~27 requests.
-- Owner 2026-09-13: "mask glossary_study_v the same way".
--
-- WHAT "THE SAME WAY" MEANS HERE. The predicate is the one this view already
-- used for common_mistakes — academy member, OR the two free study topics — and
-- what it is applied TO is wider than `definition`. Both points have a note
-- below, because taking either of them literally breaks something.
--
-- ⚠️ THE CONTENT MASK DOES **NOT** REQUIRE A SESSION. common_mistakes has always
-- carried `auth.uid() is not null` in its predicate, and copying that verbatim
-- onto `definition` shipped a live regression for twenty minutes: a GUEST has no
-- session at all, so a guest studying the free topic gs3970 got flashcards that
-- read "...the core audio processing and mixing engine in Pro Tools since
-- versio" — `left(definition, 120)` cutting mid-word. Caught on the Pixel, not
-- in review. Guests DO get study on the two free topics (owner ruling
-- 2026-08-17: guest progress is session-scoped, but the free topics are theirs),
-- so the content mask is keyed to the FREE TIER, which includes them. Only
-- common_mistakes keeps the session requirement, byte-for-byte as it was.
--
-- ⚠️ MASKING `definition` ALONE WOULD HAVE MOVED THE HOLE, NOT CLOSED IT.
-- Measured on the live data: all 26,855 rows carry plain_english,
-- purpose_function, practical_application AND scenario_contexts. plain_english
-- is a complete alternative definition of every term. Leaving it open would
-- have left the corpus fully readable one column to the left.
--
-- ⚠️ WHAT STAYS OPEN, ON PURPOSE: term, category, difficulty, related_terms,
-- and the join columns. Term NAMES are not the asset — the glossary's own
-- browse list shows all 26,855 of them, and the product's promise is that you
-- can browse and search them. related_terms is navigation between those names.
--
-- WHO LOSES NOTHING (verified before applying, not assumed):
--   * Academy members            — has_academy_access() → everything, as now.
--   * Free accounts AND guests   — they may only study the two free topics
--                                  (gs3060 Pro Audio Safety, 162 terms; gs3970
--                                  DAW Fundamentals, 228 terms), which the
--                                  predicate lets through IN FULL, with or
--                                  without a session. Device-verified on the
--                                  Pixel as a signed-out guest.
--   * Notification term batch    — notifications are MEMBERS ONLY
--                                  (owner 2026-09-01, localSchedule.ts), so its
--                                  reads pass has_academy_access().
--   * Nothing else depends on this view — no other view, no function.
--
-- RESIDUAL, STATED PLAINLY: 390 terms (1.5% of the corpus) stay fully readable
-- to any signed-in user, including a guest holding a device key. That is the
-- free study tier, by design, and it is the same content a free account can
-- already study inside the app.
--
-- The view is owned by `postgres` and has no reloptions, so it keeps running
-- with the owner's privileges — which is what lets it survive the revokes on
-- `glossary`. That also means this mask is the ONLY thing protecting the
-- content here. Do not weaken it without replacing it.
--
-- MIRRORED IN THE CLIENT: array[3060, 3970] is `FREE_ENROLL_GS` in
-- src/features/enrollment/enrollmentStore.ts. If one moves and the other does
-- not, a newly-free topic's study cards silently become 120-character teasers,
-- or a paid topic's definitions silently open up.
--
-- Rollback: docs/APE_GLOSSARY_STUDY_V_MASK_2026_09_13_ROLLBACK.SQL
-- =====================================================================

create or replace view public.glossary_study_v as
select
  g.id as glossary_id,
  gt.achievement_id,
  a.global_sequence,
  gt.is_primary,
  gt.difficulty,
  g.term,
  case
    when public.has_academy_access(auth.uid())
      or a.global_sequence = any (array[3060, 3970])
    then g.definition
    -- Teaser, not NULL: a study card with no text reads as broken; a short one
    -- reads as gated. The same 120 the glossary browse view uses.
    else left(g.definition, 120)
  end as definition,
  case
    when public.has_academy_access(auth.uid())
      or a.global_sequence = any (array[3060, 3970])
    then g.plain_english
    else null::text
  end as plain_english,
  g.related_terms,
  g.category,
  case
    when public.has_academy_access(auth.uid())
      or a.global_sequence = any (array[3060, 3970])
    then g.scenario_contexts
    else null::text[]
  end as scenario_contexts,
  case
    when public.has_academy_access(auth.uid())
      or a.global_sequence = any (array[3060, 3970])
    then g.purpose_function
    else null::text
  end as purpose_function,
  case
    when public.has_academy_access(auth.uid())
      or a.global_sequence = any (array[3060, 3970])
    then g.practical_application
    else null::text
  end as practical_application,
  case
    when public.has_academy_access(auth.uid())
      or (auth.uid() is not null and a.global_sequence = any (array[3060, 3970]))
    then g.common_mistakes
    else null::text[]
  end as common_mistakes
from public.glossary g
  join public.glossary_topics gt on gt.glossary_id = g.id
  join public.achievements a on a.id = gt.achievement_id;
