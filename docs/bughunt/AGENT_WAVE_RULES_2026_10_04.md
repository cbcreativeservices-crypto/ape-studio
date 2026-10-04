# Afternoon wave, 2026-10-04: rules for every agent

Repo C:\Users\profe\dev\ape-studio, branch audio-tools-engine, HEAD = whatever `git log -1` shows (it was published as d0449070). Expo SDK 57 RN + Supabase.

Read first: AGENTS.md (HOUSE HELPERS), and the catalog C:\Users\profe\AppData\Local\Temp\claude\C--Users-profe\404f795e-0247-4a3c-9b18-9ebc8937db5d\scratchpad\known_issue_catalog_2026_10_04.md (K1–K12). Every change must respect those classes:
- unknown session ≠ signed out;
- a failed read ≠ empty;
- four-state membership (useMemberGate);
- newest wins;
- wipe resets for every cache;
- honest wording;
- D50 charging;
- audio startFenced;
- no Modal over Modal;
- latched presses;
- calculators 100% accurate (D53).

Governance: docs/APE_GOVERNANCE_DECISIONS_2026_10_03.md, D50–D55. Owner rule: "favor consistency and learning outcomes".

HARD RULES
- No sub-agents.
- No commit, push, git stash or checkout. No eas, no publish, no build.
- Never touch packages, package.json, app.json, eas.json, native folders (fingerprint), assets or images, web/, or .claude/launch.json.
- Live Supabase is READ-ONLY for you. Any server change (SQL, RLS, RPC, trigger, edge function, cron, new table or glossary rows) is DRAFTED as a migration file under supabase/migrations/ named 20261004NN_<what>.sql, NOT applied, plus a plain-English section in your report. Comp A applies server changes after owner approval.
- House helpers only. Ratchet allowlists only shrink.
- Use the Edit tool. Keep UTF-8 and the existing line endings. Python here defaults to cp1252, so never write files with it.
- Several agents work in parallel. Edit only the files your task needs. Re-read a file right before you edit it. If you need a file that is clearly another agent's area (named in your prompt), make the smallest edit and say so in your report.
- Every behaviour change gets a receipt in test/<yourKey>_20261004.test.ts that FAILS on HEAD.
  - R2 proof: copy the changed files aside, write back `git show HEAD:<path>`, run the receipt and see it fail, restore, then `cmp`.
  - Older tests that pin deliberately changed code: update them without loosening, and list them.
- Finish with `npx tsc --noEmit` and `node --test --test-timeout=120000 "test/**/*.test.ts"` (5108 at start). Failures that come only from another agent's in-flight files: name them, don't fix them.
- User-facing words: plain, honest, no jargon. No "free" or upsell copy to members. No promises of future features. Popups, not pulldowns. Nothing auto-appears in Low-Light.

REPORT
- what changed (file:line);
- exact user-visible wording;
- receipts and R2 proof;
- any drafted migration, with what Comp A must do;
- tsc and suite results;
- files touched;
- judgement calls;
- anything not done, and why.
