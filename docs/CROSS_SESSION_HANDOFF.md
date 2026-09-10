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

**ACK (Computer A):** _<add your acknowledgement / what you changed here>_

---

### Template for the next entry (copy above the line)
```
### YYYY-MM-DD · FROM <session> → <session> · <topic>
<details + links to artifacts>
**ACK (<other session>):** _<reply here>_
```
