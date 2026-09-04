# Directive to Computer A — remove the v1 `public_courses` catalog (app + DB)

**From:** desk, 2026-09-03. **Owner Booth's instruction, firm:** the v1
"9 courses / 54 topics" commercial catalog (`public_courses` /
`public_course_topics`) **has to leave — app and database — for good.** It is
deprecated, it is not the model, and it is the source of weeks of recurring
confusion. **Report/propose only; nothing here is applied.** Backend rule stands:
Computer A authors guarded, reversible SQL; Booth applies in Supabase.

## The model (what replaces it)

Terms → topics → **certificates** (topics sum into certificate awards) →
certificates carry required **co-requisites**. The v3 structure IS the app:
`certificates` / `certificate_topics`, `programs` / `program_topics`, and the
`achievements` field→subject→topic hierarchy. The data-access layer already
exists — `src/data/v3Curriculum.ts`: `fetchV3Certs()`, `fetchV3Programs()`,
`fetchV3Curriculum()` / `flattenV3()` (V3_CURRICULUM_VERSION_ID
`a7c1f2e0-…`). **Do not** treat any v1 artifact as correct or as a gap.

## Why this is one real change, not a delete

The **Home tab is `CourseSelectionScreen`** (`MainTabs.tsx` → "Home"), and its
whole carousel is **built from `getPublicCatalog()`** (public_courses +
`public_courses_seed.json` fallback). In `buildPublicCatalog()`:
- program cards = the multi-topic public courses relabeled (`PROGRAM_LINEUP`
  orders 3,4,5,6,2,9);
- topic cards = single-topic public courses + `FIELD_TOPICS`;
- the two free-topic cards = `freeTopicsFrom(catalog)` (`FREE_TOPIC_GS = [0,36]`).

So the courses can't just vanish — Home has to be **repointed onto the v3
certificate/topic model first**, then the v1 code and tables removed.

## Track 1 — app code

- **Rebuild** `src/screens/courses/CourseSelectionScreen.tsx` `buildPublicCatalog()`
  to assemble the deck from `fetchV3Certs()` / `fetchV3Programs()` /
  `fetchV3Curriculum()` instead of `getPublicCatalog()`. (`fetchV3Certs`/`Programs`
  are already imported for the tally count — extend, don't re-invent.) Booth will
  give the Home layout intent (how certificates/topics present now that the
  course scaffolding is gone) — get it before building this screen.
- **Repoint** `src/features/commercial/commercialDashboard.ts` (uses
  `getPublicCatalog` + `isFreeTopicGs`) onto the v3 source, or retire it if the
  commercial dashboard is folded into the v3 flow.
- **Free-topic model:** replace the hardcoded `FREE_TOPIC_GS = [0,36]` with the
  real v3 signal — `achievements.always_free` — so the free cards are DAW
  Fundamentals (gs3970, the free gift) and the free safety taster, not the v1 gs0.
- **Delete** `src/data/publicCourses.ts` and `src/data/public_courses_seed.json`
  once no import remains. Confirm with a repo grep for `publicCourses`,
  `getPublicCatalog`, `public_courses_seed`, `freeTopicsFrom`, `FREE_TOPIC`,
  `PUBLIC_COURSES`, `courseHasFreeTopic`, `isFreeTopicGs` → zero hits.
- Verify: `node_modules/.bin/tsc --noEmit` = 0; Home renders from v3 with no
  network dependency on public_courses.

## Track 2 — database (do NOT bare-DROP)

`public_courses` / `public_course_topics` are referenced by **five functions**
(plpgsql bodies aren't dependency-checked, so a DROP breaks them silently — the
project's own landmine):

- `commercial_topic_unlocked`, `recompute_reachability_commercial`,
  `start_quiz_attempt`, `submit_quiz`, `validate_single_primary_home`.

These are all the **commercial-audience** path. Decide with Booth whether the
commercial path is retired under v3 (remove the references) or repointed
(rewrite them off public_course_topics). **Then**, in one guarded package:
1. Precheck + complete the reference grep — extend past functions/views to RLS
   **policies**, **triggers**, and **foreign keys** on both tables (I checked
   functions + views only; those five are the function hits, 0 view hits).
2. Update/remove the five functions (and anything the fuller grep adds).
3. Back up both tables, then drop them; VERIFY gone + the updated functions
   compile and run; keep a rollback.

## Constraints / landmines (from project memory — do not trip)

- **gs3081 Audio Fundamentals lab** stays `is_active=false`,
  `applicable_methods=[]` — activating it makes every certificate unearnable.
- Codified topic names are official (`officialTopicNames.ts`); never show "Topic"
  or a gs number.
- **Pre-launch: every account is Booth.** All enrollment / progress / attempt
  data is his own testing and is disposable — no user-data migration is needed;
  the old `enrollment` rows on v1 can be reset or ignored.
- Guarded/idempotent SQL, dry-run on throwaway Postgres, Booth applies.

## Verification (done = all true)

- Repo grep for the v1 catalog symbols → 0 hits; `tsc` = 0; Home builds from v3.
- `public_courses` / `public_course_topics` dropped, backups retained; the five
  functions updated and exercised (start a quiz, submit it) with no error.
- No screen or RPC path references the v1 catalog. The 9 courses / 54 topics are
  gone from app and DB.
