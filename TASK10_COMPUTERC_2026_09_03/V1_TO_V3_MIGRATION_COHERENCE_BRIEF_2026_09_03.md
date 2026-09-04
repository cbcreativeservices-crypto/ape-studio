# v1→v3 — corrected read (supersedes the first version of this file)

**2026-09-03.** My first version of this brief over-flagged. After reading the
full project context I'm correcting it: most of what I called "defects" is the
**stale v1 residue that was set aside by design** — not live breakage. Nothing
was changed in the app or DB. Here is the accurate picture.

## What I got wrong in the first draft

- **"v3 has no structure / 0 courses" — false.** v3 (`v3-locked-172`, the
  **active** version) deliberately doesn't use the old `course_id` model. Its
  structure is fields → subjects → **certificates / programs**, and those link
  tables are **fully populated**: `certificate_topics` = 384 rows,
  `program_topics` = 983 rows. 0 courses is expected, not a gap.
- **"The safety gate is unpassable / blocks everything" — moot.** gs0 is
  **archived v1**; its retired quiz is expected. The live core is the v3 topics.
  And v3 **does not lock topic access** at all — prereqs gate the *certificate*,
  not access (your call). So there is no access gate to be broken.
- **"Activate the gs3081 lab" — this was wrong and I'm glad I caught it.**
  gs3081 is `is_active=false` with `applicable_methods=[]` **by design**;
  activating it (or populating its methods) would make **every certificate and
  program unearnable** (`award_content_incomplete`). Do not touch it.
- **Enrollments "on the dead curriculum" — not an issue.** All of them are your
  own pilot accounts; there's no real-user data to migrate.
- **`commercial_topic_unlocked` 24-vs-28 / `archived_quiz_retired` error copy —
  dead paths for v3.** v3's quiz-start branch short-circuits before either, so
  neither affects the live flow. Not launch items.

Net: **v1 residue is expected and inert. There is no live defect in that list.**

## The one thing genuinely worth your call

The app has **two** catalog paths in the code:

- **Credentials** read the v3 `certificate_topics` / `program_topics` — populated
  and correct.
- **The commercial course-selection UI** (`CourseSelectionScreen.tsx`,
  `features/commercial/commercialDashboard.ts`) still reads the **old
  `public_courses` / `public_course_topics`** via `getPublicCatalog()` — and
  those tables are **100% v1**: 9 active courses, 54 placements, safety = gs0,
  **zero v3**. (It falls back to a bundled seed — `public_courses_seed.json` —
  when the server rows are empty, so it may be showing seed data, not these rows.)

**Question:** is that commercial course-selection flow still a launch surface? If
yes, its catalog needs to move to v3 (or be repointed at the cert/program
structure); if it's been superseded by the credentials UI, the `public_courses`
tables are just more v1 residue and nothing needs doing. I can't tell which from
the code alone — both paths are still wired.

## Recommendation

- **Don't** run any structural migration SQL off my first draft — it was built on
  a false premise.
- **Do** tell me whether the commercial `public_courses` course-selection flow is
  a launch surface. If it is, I'll scope a real, guarded fix for that one thing
  (with Computer A, since it's catalog structure). If not, we close this out.
- Task-10 **Decision 2 stays closed**: the 50 gs0 rows are dead v1, don't author
  them.
