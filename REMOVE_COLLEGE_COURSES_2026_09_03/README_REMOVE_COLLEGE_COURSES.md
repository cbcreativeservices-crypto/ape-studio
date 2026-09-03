# Remove the eight college courses — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL. Nothing here has been run against production.**

The app side is already done and pushed (`d68d94a`). This package removes the
same eight courses from the database.

## What it changes

Deletes `sort_order` 2 through 9 from `public_courses`, and their rows in
`public_course_topics`. **Order 1, Pro Audio Safety, is kept** — it is the free
taster, not a college course.

| sort_order | display_name | topic rows |
|---|---|---|
| 2 | Intro to Audio | 11 |
| 3 | Sound Reinforcement Systems | 12 |
| 4 | Audio System Design and Maintenance | 11 |
| 5 | Recording Arts | 5 |
| 6 | Music Production | 6 |
| 7 | Podcasting and Broadcast | 1 |
| 8 | Film and Game | 1 |
| 9 | Career and Business | 6 |

53 of the 54 `public_course_topics` rows go. One remains, the gs 0 row under
order 1.

## Why this is a row delete and not a table drop

`public_courses` and `public_course_topics` are referenced by five database
functions and one trigger:

`commercial_topic_unlocked`, `recompute_reachability_commercial`,
`start_quiz_attempt`, `submit_quiz`, `validate_single_primary_home`
(+ trigger `trg_single_primary_home`).

Function bodies are **not** dependency-checked, so a `DROP TABLE` would break
all five silently. Deleting rows cannot: those functions are already unreachable
in production, because every topic row points at a retired v1 achievement and
`start_quiz_attempt` raises `archived_quiz_retired` before the branch that uses
them is ever evaluated. They will simply keep finding nothing.

Dropping the tables outright is a later step and needs the function work first.
It is item D1 on the triage sheet.

## Does the app need this?

No, and that is deliberate. `getPublicCatalog()` no longer queries these tables
at all, so the carousel is already free of the college courses whether you run
this or not. This package exists so the rows do not sit in the database waiting
to confuse the next person who looks.

## Safety design

- **Backup-guarded.** `10_APPLY` refuses to run unless `05_BACKUP` created both
  backup tables and they hold the expected row counts.
- **Idempotent.** A second run deletes nothing and reports zero.
- **Scoped by sort_order, never by name.** Names are display strings and could
  be edited; `sort_order` is the stable key the app used.
- **Order 1 is protected.** `10_APPLY` aborts if the delete would touch it, or
  if it would leave `public_courses` empty.
- **Reversible.** `99_ROLLBACK` restores both tables from the backups.

## Run order

| Step | File | What to look for |
|---|---|---|
| 1 | `00_PRECHECK.sql` | Lists exactly what will go. Confirm the eight names and 53 topic rows. |
| 2 | `05_BACKUP.sql` | Creates `public_courses_backup_20260903` and `public_course_topics_backup_20260903`. |
| 3 | `10_APPLY.sql` | Deletes. Reports rows removed. |
| 4 | `90_VERIFY.sql` | Must show one course left, one topic row, backups intact. |

`99_ROLLBACK.sql` only if step 4 looks wrong. Keep the backup tables until you
are satisfied; they are the only copy.
