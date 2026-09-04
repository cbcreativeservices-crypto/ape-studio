# Topic-name codify — guarded SQL package (2026-09-03)

**Status: PENDING YOUR APPROVAL.** Nothing here has been run against production.
The app already *displays* the codified names (code override in
`officialTopicNames.ts` + the public-catalog seed), so this package is the
belt-and-suspenders step that fixes the **source rows** in `achievements.name`.

## What it changes

Three `achievements` rows whose stored `name` still deviates from the codified
names. Renames are **display-name only** — no id, `global_sequence`, or
relationship changes.

| global_sequence | Old stored name          | Codified name          |
|-----------------|--------------------------|------------------------|
| gs3060          | Professional Audio Safety | **Pro Audio Safety**   |
| gs3070          | Grounding & Shielding     | **Grounding & Electrical** |
| gs3081 (lab)    | Audio Fundamentals Lab    | **Audio Fundamentals** |

Not touched (already correct in the DB): gs4370 **Workplace Skills**,
gs3970 **DAW Fundamentals & Session Management**.

## Safety design

- **Idempotent** — `10_APPLY` keys each update on `md5(current name)`, so a
  second run is a no-op and it can never rename the wrong row.
- **Backup-guarded** — `10_APPLY` refuses to run unless `05_BACKUP` created the
  backup table (`achievements_name_codify_backup_20260903`); the guard
  subquery errors out if the backup is absent.
- **Reversible** — `99_ROLLBACK` restores the exact prior names from the backup.
- **Dry-run verified** on a throwaway PostgreSQL 16 instance: precheck 3/3/0 →
  backup 3 → apply UPDATE 3 → verify 3/0 → re-apply 0 (idempotent) →
  gs3970/gs4370 untouched → rollback restored 3.

## Run order (Supabase SQL editor, one file at a time)

1. `00_PRECHECK.sql` — read-only. Expect `target_rows=3`,
   `matching_current=3`, `backup_exists=0`. **If `matching_current` ≠ 3, STOP**
   (a name already changed — re-confirm before proceeding).
2. `05_BACKUP.sql` — creates the backup table. Expect `backed_up_expect_3 = 3`.
3. `10_APPLY.sql` — the rename. Expect `UPDATE 3`.
4. `90_VERIFY.sql` — expect `applied=3`, `not_applied=0`.
5. If anything looks wrong: `99_ROLLBACK.sql` — expect `restored_expect_3 = 3`.

After a successful apply the backup table can be dropped at your leisure:
`drop table public.achievements_name_codify_backup_20260903;`
