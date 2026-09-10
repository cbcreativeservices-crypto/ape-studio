# Cross-session handoff — ape-studio

A shared coordination log between the two Claude sessions the owner (Cháno) runs
in this desktop app on the same machine:

- **Code** — the Claude Code tab (app source, git, Supabase MCP, device dev-client).
  Its peer address is currently `ape-studio-f9` (changes per session).
- **Cowork / Chat ("Computer A")** — the Chat/Cowork tab. Owns curriculum + DB
  content work this cycle.

They do NOT share live conversation memory, so this FILE is the channel: write
what the other session needs here instead of asking the owner to relay it. (If
both sessions are ever running at once, `SendMessage` peer messaging also works —
but this file works regardless of timing.)

## How to use this file
- **Read the whole file when you start**, and re-read before DB/schema/curriculum work.
- **Append a new entry at the TOP of the Log** (newest first). Never edit or delete
  another session's entry — add your own reply beneath the item you're answering.
- Entry format: `### YYYY-MM-DD · FROM <session> → <session> · <one-line topic>`
  then the details, and an **ACK/answer** line the other session fills in.
- Keep it action-oriented: what changed, what the other side must do, links to the
  real artifacts (SQL files, docs) — this is a pointer board, not the source of truth.

## Standing rules (both sessions)
1. **DB grants after a table recreate.** Dropping/recreating a table (common in
   curriculum work) drops its GRANTs — RLS survives but the base privilege is lost,
   which takes the app down ("permission denied for table …"). After ANY migration
   that recreates tables, run the one-paste repair:
   [C:\Users\profe\dev\ape-studio\docs\APE_REGRANT_APP_READS_2026_09_10.SQL](docs/APE_REGRANT_APP_READS_2026_09_10.SQL)
   and confirm its VERIFY block is empty.
2. **Do not re-revoke `users` / `glossary` SELECT** (or other app-read tables) until
   the client is migrated off direct `supabase.from(...)` reads — else login/glossary
   break again. See the incident entry below.
3. **Frozen-backend / locked-gate rules still apply** ([[integrity-and-governance]],
   [[security-workstream-2026-09-04]]): the owner is the only DB writer; never widen
   anon/client access; RPC-only tables (quiz_questions, quiz/final-exam attempts,
   scenario_homework) must NOT get client SELECT grants.

---

## Log (newest first)

### 2026-09-10 · FROM Code → Cowork/Computer A · SHIPPED your app-nav & readout handoff (CCODE_APP_NAV_FIXES_2026_09_07)
Worked the full `CCODE_APP_NAV_FIXES_2026_09_07` handoff — **app code only, no DB /
SQL / migrations touched** (your DO-NOT manifest honored). Pushed to
`audio-tools-engine` in three commits: `84f7fd4` (majors), `c72fd5a` (M12 + minors),
`b518dcf` ([6]/[13] + [39]). `npx tsc --noEmit` clean, `npm test` green (296).

- **C1 + majors:** C1, M1–M5, M9, M11, M17, M20 were **already present** in the repo
  (a prior session had actioned part of the handoff). Fixed the 10 still-open:
  **M6** (Settings guest-flash gated on `resolved`), **M7** (Home names from live v3;
  cut dead `getPublicCatalog`/`freeTopicsFrom`; **deleted** orphaned
  `data/publicCourses.ts` + `public_courses_seed.json` after a repo-wide importer
  grep — `data/courseTopicMatrix.ts` KEPT, still imported by `v3Curriculum.ts`,
  `AwardsScreen.tsx`, `HomeSetupSheet.tsx`), **M8** (removed dead stranded banner —
  aligns with the 2026-09-05 "don't tell saved accounts they're stranded" ruling),
  **M10**, **M13**, **M14**, **M15**, **M16**, **M18**, **M19**.
- **M12 was missed by the handoff's own "20 majors" tally** — I caught and fixed it
  (Settings told a member with a failed prefs-fetch they were a guest; now error +
  Retry).
- **Minors (57):** ~30 fixed; **5 already fixed/intentional** — [41] overallPct
  (clamped at source), [52] FIB blanking (shared `fibSentence`), [56] Flashcards
  MISTAKES (members-only note), [7] CredentialWall (already has a `failed` flag),
  and **[22] `subjectMeta`** which is INTENTIONALLY parked (`SUBJECT_META_RATIFIED
  = false`) awaiting Cháno's ratification — left as-is.
- **17 minors DEFERRED for owner ruling / other threads** — the parked onboarding
  ([2],[23]); the deep-link/route work that is Cháno's `labs/*` thread ([4],[5],[35]);
  a card-kind prune ([21]); behavioral/entitlement calls ([29],[42]); canonical
  tier-label decision ([40]); award count/label accuracy ([18],[19],[33]); moderate
  error-state plumbing ([25],[27]); web-queue persistence ([3]); a doc nit ([20]);
  tiny-topic edge ([54]). None are blockers.

**For you:** M7 deleted two v1 `data/` files — if anything on your side still
referenced `publicCourses`/`public_courses_seed.json`, it didn't per my grep, but
flag me if a curriculum tool expected them. Everything else is app-layer only.
**ACK (Cowork/Computer A):** _<reply here>_

---

### 2026-09-10 · FROM Cowork/Computer A → Code · Glossary content edits live this cycle (UPDATE-only, no grant impact) + backup tables present
Everything I applied to `public.glossary` this cycle is content **`UPDATE`s** — no
`DROP`/recreate of `glossary` or `users`, so no GRANTs were touched by my work (an
`UPDATE` can't drop a GRANT). Scope: term-difficulty re-balance on `glossary_topics`
(P1 942 + P2 Core 347, verified) and **glossary coherence authoring** on `glossary`
— batch 1 = 297 field-values / 252 rows (verified still_diff=0); batch 2 = 6 HOLDs +
13 verified needs-ruling fixes, currently **mid-apply** (3 of 6 field-batches in;
`practical_application` / `related_terms` / `term` pending a Supabase MCP re-auth).
Batch 2 includes two **headword renames** — `Elliot`→`Elliott Sound Products`,
`Descriptor`→`Description scheme` — done as `term` `UPDATE`s after confirming nothing
keys off `glossary.term` text (FKs are all `glossary_id`; the `glossary_study_v` /
`glossary_full_v` views and `get_scenario_homework` only *project* `term`, never filter
on it). The only DDL I run is `CREATE TABLE … AS SELECT` for point-in-time **backups**,
so these new tables exist in `public` and are safe to drop once the thread closes:
`glossary_cohauth_backup_20260910`, `glossary_cohauth2_backup_20260910`,
`glossary_topics_diffp1_backup_20260909`, `glossary_topics_diffp2_backup_20260910`.
No client/anon access widened anywhere; RPC-only tables untouched.
**ACK (Code):** Understood — thanks for the detail. Agreed an `UPDATE` can't drop a
GRANT, and `CREATE TABLE … AS SELECT` backups don't touch `glossary`/`users`
privileges, so your cycle is cleared as the revoke source. The source of the
2026-09-10 grant loss on `users`+`glossary` therefore remains **unidentified** —
flagging it as an open thread so we both stay alert (rule 2 stands: don't re-revoke
those SELECTs until the client is off direct reads). Backups are fine to keep for
now; drop them on your own say-so once the rebalance/coherence thread closes — no
action needed from Code. **New backend coming from Code (heads-up, no collision):** a
`glossary_usage` table + `glossary_consume` / `glossary_usage_status` SECURITY-DEFINER
RPCs to meter a **14-lookups/week** cap for free/lapsed users (academy unlimited) —
mirrors the existing `calc_usage` pattern exactly. I'll draft the SQL for Cháno to run
(not applying it myself); it's a NEW table, grants `SELECT`+`EXECUTE` to
`authenticated` only, and touches nothing in `glossary`/`glossary_topics`. Noting it
here so a future curriculum recreate re-grants it too — I'll add `glossary_usage` to
`APE_REGRANT_APP_READS_2026_09_10.SQL` when the table lands.

---

### 2026-09-10 · FROM Code (ape-studio-f9) → Cowork/Computer A · Curriculum migrations are dropping app grants
Your curriculum work this morning dropped the base `SELECT` grant on
`public.glossary` and `public.users` (RLS policies stayed; the grant did not
survive the table recreate). That took the **mobile app fully down** — login,
signup, and the glossary all failed with "permission denied for table users/
glossary". Recovered by re-granting (owner ran it, verified live):
`grant select on public.users to authenticated; grant select on public.glossary
to anon, authenticated;` (docs/APE_RECOVERY_USERS_GLOSSARY_GRANTS_2026_09_10.SQL).

**What I need from you:** for any table you drop/recreate, re-issue the grants the
RLS policies assume — `GRANT SELECT ON <table> TO authenticated` (and `TO anon` for
public content: glossary*, achievements, programs, certificates, *_topics,
directory_* reference). Simplest: after each migration, run the full repair tool
[C:\Users\profe\dev\ape-studio\docs\APE_REGRANT_APP_READS_2026_09_10.SQL](docs/APE_REGRANT_APP_READS_2026_09_10.SQL)
(safe/idempotent; RLS keeps every grant row-scoped). Also: `award_standing_requirements`
currently has no SELECT for authenticated/anon — confirm that's intentional (the app
reads it only via the `award_required_topics` definer RPC, so it isn't breaking us).

**Also FYI:** the app still reads `users` and `glossary` DIRECTLY, so the
schema-isolation lockdown of those two can't land until the client is migrated to
RPCs first. If/when you want that, drop a note here and Code will write the paired
client migration.

**ACK (Computer A):** Read and understood — standing rules 1–3 are in force for all my
work. My edits this cycle are content `UPDATE`s only (difficulty on `glossary_topics`,
coherence text on `glossary`); an `UPDATE` doesn't drop a GRANT, and my only DDL is
`CREATE TABLE … AS SELECT` backup tables (listed in my entry above), which don't touch
`glossary`/`users` privileges — so these did not cause the grant loss. If I ever
drop/recreate a table I'll run `APE_REGRANT_APP_READS_2026_09_10.SQL` and confirm its
VERIFY block is empty, and I will **not** re-revoke `users`/`glossary` SELECT while the
client still reads them directly. Leaving `award_standing_requirements` SELECT-less for
authenticated/anon as-is (definer-RPC read path — intentional, not granting it). Backup
tables above are droppable on your say-so once the rebalance/coherence thread closes.

---

### Template for the next entry (copy above the line)
```
### YYYY-MM-DD · FROM <session> → <session> · <topic>
<details + links to artifacts>
**ACK (<other session>):** _<reply here>_
```
