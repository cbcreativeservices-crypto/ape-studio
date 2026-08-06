<!--
CANONICAL FILE: CLIENT_HANDOFF_glossary_full_v_swap_2026_07_11.md
FROM: backend/governance session · TO: Claude Code session (repo C:\Users\profe\dev\ape-studio)
PURPOSE: client-only change — swap common_mistakes reads to the academy-gated view.
BACKEND STATE: view is LIVE on prod. The leak-closing REVOKE is HELD until this ships.
-->

# ===== PASTE EVERYTHING BELOW THIS LINE INTO CLAUDE CODE =====

## TASK — point all `common_mistakes` reads at `public.glossary_full_v`

**Context (backend, already deployed to prod `yjgolswjggmlpeowvtxr`):** a new academy-gated view
`public.glossary_full_v` is live. It returns the same glossary display columns you already read, plus
a server-masked `common_mistakes`:
- academy or institutional users (`has_academy_access` = true) → `common_mistakes` is populated;
- anonymous / free (non-academy) users → `common_mistakes` is **NULL**.
The masking is enforced in Postgres — the real text never leaves the server for non-entitled users.

**HARD BOUNDARY (unchanged):** NO backend changes from this session. This is a client read-source
swap only. Do not change any RPC contract.

### Do
1. **Find every query that selects `common_mistakes`** (start: `src/screens/glossary/GlossaryScreen.tsx`;
   grep the repo for `common_mistakes` to catch any others).
2. **Change the source table** on those queries from `glossary` → `glossary_full_v`. Column names are
   identical, so it's a table-name swap (e.g. `.from('glossary')` → `.from('glossary_full_v')`), not a
   shape change. Queries that do **not** select `common_mistakes` may stay on `glossary`.
3. **Stop fetching-then-enciphering the real Common Mistakes text.** Because non-academy users now
   receive `common_mistakes = NULL`, render the veil / upgrade CTA from the NULL state — do **not**
   pull the real string and garble it client-side anymore. Locked copy stays exactly:
   **"Common Mistakes are available in academy mode."** Academy/institutional users render the real
   `common_mistakes` as today.

### Do NOT
- Read `common_mistakes` from the base `glossary` table anywhere after this change — the backend will
  **REVOKE** that column grant from `authenticated` once this ships, which would 403 any lingering
  base-table read (institutional users included).
- Change grading/gating/entitlement logic — server decides, you render.

### Verify
- `npx tsc --noEmit` clean + Metro bundle HTTP 200.
- Manual: an **academy/institutional** account shows the Common Mistakes body populated; a
  **signed-out/free** user shows the veil placeholder, and the network response for that query carries
  `common_mistakes: null` (no real text on the wire).

### Report back
List the files changed and confirm **no base-table `common_mistakes` reads remain**. On that
confirmation, the backend session deploys the held REVOKE
(`SCHEMA_v213_ITEMD_close_common_mistakes_CANDIDATE.sql`) to close the leak server-side.

# ===== END OF PASTE =====
