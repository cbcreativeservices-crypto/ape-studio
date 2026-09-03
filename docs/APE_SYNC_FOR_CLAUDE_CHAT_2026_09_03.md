# Sync brief for Claude chat — 2026-09-03

**From:** Claude Code (ccode), working in `C:\Users\profe\dev\ape-studio`, branch
`audio-tools-engine`. **To:** the Claude chat instance advising Booth.
**Purpose:** get us back in lock. Read this whole file before advising on the v1
removal, the database, or the Home screen. Several things you and I both believed
this morning turned out to be false, and I list them explicitly.

Everything below was verified against the live code and database today, not
inferred from a handoff.

---

## 1. What was asked, and what turned out to be true

The starting directive was `HANDOFF_A_remove_v1_public_courses_2026_09_03.md`:
remove the v1 `public_courses` / `public_course_topics` catalog from app and DB,
and rebuild Home on the v3 certificate/topic model first.

Its structural claims were accurate. Its model of the problem was about a third
right. Three things it did not know:

**a. There are two nine-row course catalogues, not one.**

| Table | Rows | What it is |
|---|---|---|
| `public_courses` | 9 | the v1 consumer catalog the directive targeted |
| `courses` | 9 | a SEPARATE archived college catalog (SAFE, MUSI190, AUDI201 …) |

Both are views onto the **same fifty-odd dead v1 topics**. Removing only the
first leaves the confusion fully intact.

**b. There are three curricula in `achievements`, not two.**

| curriculum_version_id | Rows | Active | What |
|---|---|---|---|
| `a7c1f2e0-…` | 175 | 166 | **v3, the live curriculum** |
| `51c1d5db-…` | 241 | 0 | `v2-draft`. Nobody has ruled on it. |
| `c689c0c4-…` | 52 | 14 | v1, the legacy set |

If you have been quoting "417 v3 topics" — I was too — that number is
`course_id IS NULL`, which silently sweeps in the 241 draft rows plus one v1 row.

**c. Home could not be rebuilt on v3 without changing what it shows.** v3
references *zero* of the v1 topics, so the six programme cards and their topic
counts have no v3 equivalent. Booth's instruction was that this cleanup must not
change the app visually, so Track 1 of the directive was dropped.

---

## 2. What Booth ruled today

Verbatim, in order:

1. *"This work trying to get rid of V1 remnants should not change anything
   visually in the app. I just want to get it out and move on."*
2. *"2-9 are all courses at my college and no longer have any relation to the
   app. Remove them wherever they are found — including if they are a current
   card in the home menu carousel."*
3. *"The home glossary menu is there for marketing… only topic cards will show
   in the carousel and no certificate, course, or other program cards."*
4. *"I will add more topic cards in the future as I see. It is not a gate."*
5. *"Remove the certificate cards, leave the topic cards."*
6. *"Yes the commercial dashboard should be retired."*
7. On the 51 legacy topics: *"the ones that are being used or share a name
   consider to be converted. all the others should be considered stale and
   retired."*
8. *"These should be removed: Sound & Acoustics, Dynamics Processing, Assisted
   Listening Systems, Corporate AV, Distributed Audio Systems."*
9. *"Terms should fold into other existing."*
10. *"Fix the paywall gate to the v3 free topics."*

**And one standing rule that overrides prior caution:**

> *"There are no users except me. Just me. A few different accounts. Just me. Do
> not concern yourself now or in the future about current user data until I tell
> you directly that new users other than myself are starting to create and use
> accounts."*

Do not hedge, gate, or add "preserve user history" caveats. All accounts and all
rows in `users`, `enrollment`, `student_achievement_progress`,
`student_method_progress` and `quiz_attempts` are his own testing and are
disposable. The trigger to resume caution is an explicit statement from him that
other people are creating accounts — nothing else. **Content** (glossary terms,
quiz questions, curated links, lab copy) is still content and still protected.

---

## 3. State of the app — DONE, shipped, pushed

Fifteen commits today on `audio-tools-engine`. The v1-relevant ones:

| Commit | What |
|---|---|
| `d68d94a` | The eight college courses removed from the seed and the carousel |
| `8fbe91d` | Dashboard commercial branch, two dead entry points, Glossary course lookup |
| `69d4f28` | Commercial dashboard retired; carousel is topic cards only |
| `31afe78` | Free tasters moved to the v3 pair, gs 3060 / 3970 |
| `790ae48` | Removed the throwaway Home layout sketch |

Current facts about the app:

- **No app code reads `courses`, `public_courses` or `public_course_topics`.**
  `getPublicCatalog()` reads the bundled seed and nothing else. The DB fetch was
  cut deliberately: those tables still hold the college rows, so querying them
  would put the removed cards back into the carousel.
- **The Home carousel is five cards:** Lab, Tools, Glossary, and the two free
  tasters. `FIELD_TOPICS` is an empty array — adding a topic card is one line
  there. Its card label changed from `Specialization Certificate` to `TOPIC`
  (new copy, unratified).
- **Free tasters are gs 3060 and 3970** (`FREE_TOPIC_GS` in
  `src/data/publicCourses.ts`), matching `FREE_ENROLL_GS` in the enrollment
  store. Card art is keyed `free<gs>`, so the image map carries both new and old
  keys.
- `src/features/commercial/commercialDashboard.ts` is **deleted**.
- **Not touched, deliberately:** `register_commercial_user` and the
  `commercialAuth` signup path. That RPC is the only writer of
  `audience='commercial'` and is live in `AuthScreen`. Retiring the commercial
  *dashboard* is safe; removing commercial *registration* breaks signup.

Gate on every commit: `npx tsc --noEmit` clean, `npm test` 179/179, and the
affected screens looked at in the web preview.

---

## 4. State of the database — NOTHING APPLIED

Booth's rule stands: **ccode authors guarded SQL, Booth applies it in Supabase.**
Every database call made while authoring was a `SELECT`. Five packages exist and
none has been run.

| Order | Folder | What it does |
|---|---|---|
| 1 | `REMOVE_COLLEGE_COURSES_2026_09_03` | Deletes `public_courses` rows 2–9 and their 53 topic rows. Keeps order 1. |
| 2 | `REMOVE_V1_REMNANTS_2026_09_03` | Six stages: glossary functions, seeder, quiz functions, dead objects, `glossary.course_id`, then the two `public_course` tables. |
| 3 | `CONVERT_RETIRE_V1_TOPICS_2026_09_03` | 17 topics folded onto v3 twins, 34 retired. Includes the paywall gate at stage 15. |
| 4 | `RETIRE_INSTITUTIONAL_PATH_2026_09_03` | Two institutional views. |

Every package: precheck, backup, guarded idempotent apply, verify, rollback.

**The paywall gate (stage 15) is safe to run first, standalone.** It is
self-contained with its own backup and rollback.

---

## 5. Corrections of record — things we both had wrong

These are the ones most likely to still be live in your context.

**The line-ending problem was 47 files, not repo-wide.** Your `.gitattributes`
proposal was right and is now applied (`0837e7d`, `3184106`, `3a2b28f`). But the
scale was overstated by two orders of magnitude, and that overstatement was the
only reason it got deferred. Of 4,674 tracked text files, 4,337 were already
clean; the 286 that produced the "LF will be replaced by CRLF" warnings were
`core.autocrlf` working correctly, not a defect. Only 47 had CRLF **in the
index**. Policy applied was `* text=auto` (index normalised to LF, Windows
worktree keeps CRLF) — deliberately *not* `eol=lf`, which would have rewritten
286 working files for no gain. The index is now uniformly LF, and there is a
`.git-blame-ignore-revs`.

**`submit_quiz`'s commercial branch is NOT dead — it is the live path.** I said
it was, Booth marked it Delete on my word, and deleting it would have broken
quiz submission for the entire app. That function has **no v3 branch**; the only
thing it switches on is `audience`, and every account registered through the app
is `commercial`. Removing the arm sends every user into an enrollment check they
have no row for. The authored SQL **retargets** it from `v_audience='commercial'`
to `v_ach_cv = c_v3` and strips only the v1 bodies inside.
`start_quiz_attempt`'s arm genuinely is dead and is removed.

**`session_logs` and `course_sections` are not free-standing.** I described them
as "0 rows, no code, no function references — the safest item on the page".
Wrong. `session_logs` is read by `refresh_student_metrics`, which `submit_quiz`
calls on **every submission**, and by `delete_my_account`. `course_sections`
carries FKs from `enrollment` and `instructor_sections`. Both are deferred, not
dropped.

**Glossary links to v1 topics are 1,978, not zero.** The zero was true of
`glossary.achievement_id`; the 1,978 live in `glossary_topics`, behind an **ON
DELETE CASCADE**. A hard delete of the legacy rows would have destroyed that many
curated term-to-topic links silently. This is why "retire" means deactivate plus
a ledger row, not delete.

**The legacy set is 52 rows, not 51.** `gs51 Foundations of Sound` has a null
`course_id`, so the predicate that identifies v1 rows misses it.

---

## 6. The topic split, as ruled

52 legacy rows. `course_id IS NOT NULL` identifies 51 of them.

| Class | Count | Treatment |
|---|---|---|
| CONVERT | 17 | Repoint every reference onto the exact v3 twin, then retire the v1 row |
| RETIRE | 34 | Deactivate + dated ledger row |

The nine active twins: gs0→3060, gs2→3070, gs4→3030, gs8→3340, gs12→3180,
gs14→3560, gs15→3570, gs16→3600, gs22→3770.

**Booth's fold rule is met and enforced, not merely documented.** All 1,978
glossary links sit on 16 of the 17 CONVERT topics, and stage 10 folds every one
onto its twin. The 34 RETIRE topics carry **zero** glossary links and **zero**
quiz questions. The backup stage now *aborts* if any RETIRE topic holds a term or
a question, and stage 30 re-checks at apply time.

Booth's five ruled-removed topics (gs 1, 9, 17, 19, 21) carry zero terms, zero
questions, and one to three of his own progress rows each. They are the only rows
in the package whose deactivation **is** the removal — the other 29 are already
inactive, and the nine active CONVERT topics live on at their twin.

---

## 7. Open decisions — nobody has ruled

1. **The 241 `v2-draft` rows.** A whole third curriculum, all inactive, untouched
   by every package. Surfaced only while counting.
2. **Four v1 badges** point at topics that will be dead, including `PA Certified`
   → gs17, one of the five.
3. **The paywall widening.** Stage 15 moves the Common Mistakes gate from
   `ARRAY[0, 36]` to `ARRAY[3060, 3970]`. That takes a signed-in non-member from
   **119 terms to 390**. It is a real widening, not a repair — the v3 topics
   carry more coverage and gs36 carries none. The array is one line if 390 is too
   generous.
4. **Table drops not authored:** `courses`, `enrollment`, `course_sections`,
   `session_logs`, `achievements.course_id`. Eleven live `SECURITY DEFINER`
   functions read them, including institutional registration, account deletion,
   and the metrics function on the quiz hot path. Blockers listed in
   `RETIRE_INSTITUTIONAL_PATH_2026_09_03/NOTES_BLOCKERS.md`.

---

## 8. Traps — do not trip these

- **Never match v1 and v3 topics by name.** 28 names are shared across the two
  sets. Match on `id` or `global_sequence`.
- **`_` is a single-character wildcard in SQL `LIKE`.** `ILIKE '%public_courses%'`
  also matches `public.courses`. Escape it. This produced two false dependency
  findings before I caught it.
- **plpgsql bodies are not dependency-checked.** Dropping a table breaks the
  functions that read it silently, at call time.
- **`bulk_import_glossary` is the highest-risk object in the repo.** SECURITY
  DEFINER with `ON CONFLICT (term) DO UPDATE` overwriting every column, over
  26,847 curated rows. The rewrite `COALESCE`-guards every field. Test it on a
  branch database, never production first.
- **`gs3081` Audio Fundamentals lab stays `is_active=false`, `applicable_methods=[]`.**
  Activating it makes every certificate unearnable.
- **Codified topic names are official** (`src/data/officialTopicNames.ts`). Never
  render "Topic" or a gs number to a user.

---

## 9. Separate track, not part of this

Six labs were built and design-reviewed overnight 2026-09-02 (Ear Training,
Amplifier Principles, Tuning & Temperament, Sound Envelope, Speech & Voice,
De-Esser). All shipped. Still owed by Booth: **copy ratification** — every line is
new and marked `NEW COPY` — and a **device pass with sound** for the Ear and
Tuning labs, which no one has ever heard, because the web harness never plays
audio. Anchor doc: `docs/APE_LAB_DESIGN_PASS_2026_09_02.md`.

---

## 10. If you want the working record

The live triage sheet, with Booth's own marks and my two corrections shown in
place, is at:

https://claude.ai/code/artifact/085b3103-da2b-4aa8-95ee-edf424e97c4b
