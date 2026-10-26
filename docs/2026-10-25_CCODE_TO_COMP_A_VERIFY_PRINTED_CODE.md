# ccode → Comp A: make "Verify by code" accept the code printed on certificates (2026-10-25)

**From:** ccode · **For:** Computer A · **Owner:** Cháno
**Owner's GO, in their words:** "Fix it on the server: public_verify_credentials also accepts the printed 8-character code. Write it up for Comp A with guarded SQL; I approve running it."
**Status:** ready to run. The owner has approved it. It was dry-run against the live database inside a block that always rolls back, and it returned PASS. Nothing is applied yet.

## 1. The bug (found today, testing Pro1's certificates)

| What | Code | `public_verify_credentials` result |
|---|---|---|
| Printed on every certificate as "CREDENTIAL" (the app's `certificateHtml.ts:250`: first 8 characters of `users.qr_token`, upper case) | e.g. `F8461FBF` | **0 rows: "No match found"**, for all 37 users |
| `users.verify_code`, which the app **never shows** anyone | e.g. `7RZTX4GT` | finds the credentials |

So an employer typing the code from a certificate into the website's **Verify by code** form (`/verify`) was always told "No match", and a genuine certificate looked fake. The QR scan and the in-app link use the full token through `public_verify_by_token` and were never affected.

## 2. Website (done today, owner GO)

`/verify` and `/verify/<code>` are now public on the gated site: exact match plus one path segment, no cookie, the same pattern as `/registry/<token>`. Pushed to audio-tools-engine at 9ce8282d and checked live: both return 200, while `/about` and `/verify/a/b` still return 401.

## 3. The fix: paste files

Folder: `C:\Users\profe\Downloads\2026-10-25_VERIFY_PRINTED_CODE_SQL\`

| Order | File | Does | Expected |
|---|---|---|---|
| 1 | `00_PRECHECK.sql` | Read-only. Stops if the function changed since today (md5 `a00f08e4…`) | "Success" + NOTICE "OK" (or "ALREADY APPLIED") |
| 2 | `05_BACKUP.sql` | Saves the exact current function to `public._ape_function_backup` (RLS on, no API grants) | "Success" |
| 3 | `10_APPLY.sql` | `CREATE OR REPLACE` the function, plus an expression index | "Success" |
| 4 | `90_VERIFY.sql` | **CHECK** | one row: `PASS · 5 · 5 · 5 · 0 · 0 · true` |
| — | `99_ROLLBACK.sql` | Only on FAIL: restores the exact backup and drops the index | NOTICE "Restored…" |

**What the new function does:**
- **A code matches** in either of two ways:
  - a member's `verify_code`, as before;
  - the 8-hex code printed on their certificates, but only when that code belongs to exactly one member and is nobody's `verify_code`. Today there are 0 shared printed codes and 0 overlaps.
- **Typed codes:** spaces and dashes are ignored, as the website already does.
- **Deleted accounts:** certificates in `retained_credentials` still match by `verify_code` only. That table has no token, so certificates printed before an account deletion stay unmatched by their printed code. That's a known limit; tell ccode if the owner wants it covered.
- **Unchanged:** the columns, `SECURITY DEFINER`, `search_path`, and the grants (`CREATE OR REPLACE` keeps them). Like before, `show_in_registry` is not checked: someone who hands out their certificate code is sharing it on purpose.

**Dry-run result** (apply + verify, then a forced rollback, on the live DB 2026-10-25):
`{"result":"PASS","printed":5,"printed_lower":5,"real_code":5,"wrong":0,"short":0,"all_members_ok":true}`. After the rollback, the live function md5 was unchanged and the index was absent.

## 4. From your 2026-10-25 work list

**Task A item 5, "Save time-trial passes so a killed app doesn't lose them", is VOID.** The owner removed the time trial completely on 2026-10-24 (OTA branch `ota-after-approval-39-23`, commit 99ab8484). The server half of that removal is still yours: the 2026-10-24 handoff `CCODE_TO_COMP_A_REMOVE_TIME_TRIAL_SERVER`. My replies to Tasks A, B and C come next, in `docs/CROSS_SESSION_HANDOFF.md`.

## 5. Please ACK

In `docs/CROSS_SESSION_HANDOFF.md`: when it ran, plus the `90_VERIFY` row.
