# Lab fix round 1 (2026-11-14): bugs, quick wins and the shared frame

**What the owner approved, 2026-11-14 (two messages):**
> "Begin fixing all bugs found and do obvious (my decision is not required) fixes as you suggestted in the report."

Then the owner approved the report's "suggested order", items 1-9:
1. Shared frame first.
2. Arrival order and tap-swallowing (section 3, row 1).
3. Sound Safety behaviour (row 2).
4. The silent-learner line and "needs sound" tags (row 3).
5. The check card: per-option reasons and FINISH after a pass (row 4).
6. The end screen recap (row 5).
7. Header icons (row 6).
8. Then trays, bezel captions and the reading well (rows 7, 8, 9).
9. Then the quick wins in section 4, starting with the ones that look like bugs to a learner: the Miking contents → Module 1 jump, the developer lines, the FAULT tray, "dBFS dBFS", the typos, and the glossary cards that contradict their labs.

**Read first:**
- the report, `docs/labs/novice_audit_2026_11_14/LAB_BEGINNER_AUDIT_REPORT.md`: sections 2, 3, 4, 7, and section 6 for your labs;
- the auditors' files for your labs, in the same folder (G*_<Route>.md);
- `AGENTS.md`;
- `C:\Users\profe\dev\ape-studio\.claude\PROTOCOL_CHECK.md`.

**Repo:** `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`.

**Web preview:** http://localhost:8142, links of the form `#labpreview/<Route>` (routes are in `src/dev/webPreviews.tsx`).

## How the work is split

- **Shared-frame agents (S1, S2, S3)** build the shared mechanisms.
  - Each writes its API to `docs/labs/novice_audit_2026_11_14/fixes/SHARED_API.md` (its own section) AS SOON AS the API is settled, before polishing. The lab agents fill these in for their labs in phase 2.
  - Each fills the new mechanism in for 2 example labs, to prove it works.
- **Lab agents (F2-F9)** work in two phases.
  - **Phase 1, now:** every bug (report section 7) and every quick win (section 4) for your labs, plus the plain bugs in your labs' section 6 entries and G* files.
  - **Phase 2, when the coordinator messages you:** fill in the new shared mechanisms for every lab you own: per-option wrong reasons, recap lines, needs-sound tags, bezel captions, and whatever SHARED_API.md lists. Until then, do not touch the shared mechanisms.

## Hard rules

1. **Never ask the user anything.** You have all the time you need, so never cut depth for time. A HELD item needs a real reason (see rule 9), never scope.
2. **No commits, no pushes, no `eas` of any kind, no publishing.** The coordinator commits after the full test gate.
3. **Only edit the files your group owns** (listed in your prompt). If a fix needs a file you do not own, do not edit it. Write it in your report as **SHARED NEED**, with the file, the line and the exact change you propose; the coordinator forwards it.
4. **Never touch:**
   - `modules/`, `package.json`, `package-lock.json`, `app.json`, `eas.json`
   - `useLabNav.ts`, `index.ts`, `metro.config.js`, `.gitignore`, `dist_ota/`
   - any image file
   - the 36 files that were already modified before you started (all under `modules/`, plus `.gitignore`, `index.ts` and `metro.config.js`).
5. **Verify before fixing.** Read the code that decides the behaviour and cite file:line. If it is not a bug (by design, or a preview-only effect), mark it **NOT A BUG** with the reason and change nothing.
6. **Fix it the smallest correct way**, with the house helpers (AGENTS.md): `createLocalStore`, `startFenced`, `safeGoBack`, `useLatchedPress`, `useTier`/`useMemberGate`, `fitValue`, `runSoon`, `useDecorativeMotion`, confirmDialog/notify (never a raw Alert).
7. **Standing rules a fix must keep:**
   - Labs never block navigation.
   - Credit already earned is never removed, so stored credit stays as it is. You may stop NEW credit being given wrongly.
   - Popups, never pulldowns.
   - Lab display text ≥ 9 pt on a 390-wide phone.
   - A cropped readout drops its label, never its number (D36).
   - Do not ADD any new "N of total" progress counter.
   - US spelling.
   - Intros claim knowledge, not skills.
   - Lab help speaks to the student, custom to each screen.
   - iOS and Android identical.
   - The accuracy chip only in live tools and measuring labs (D37).
   - Never accept the Sound Safety sheet in the browser (always KEEP SOUND OFF).
   - Never press PRINT, SHARE or DOWNLOAD.
8. **Tests:**
   - For every fix, add or extend a test that would have failed before the fix, in `test/labFixes_20261114_<GROUP>.test.ts`.
   - Run only your own tests and the existing tests for the files you touch: `node --test --test-timeout=120000 test/<file>`. Never run the whole suite; the coordinator runs it.
   - When a fix changes a pinned expectation on purpose, update that test and add a comment quoting the owner's approval above.
   - Run `npx tsc --noEmit` once at the end of each phase and report your files' errors (0 expected).
9. **HELD only for a real reason, and the report says which:**
   - the owner's decision (the OUT list below);
   - a phone-only check;
   - a server change (write the proposed SQL in the report; never run it);
   - a standing rule.
10. **Look at it on screen.** After fixing, open the page and check what the control now DOES, not only that something moved.
    - Use the built-in browser pane only (`mcp__Claude_Browser__*`), never the owner's Chrome (`claude-in-chrome`).
    - Use ONE tab of your own, made with tabs_create. Set 390x844 on your tab only, and close your tab when done. The pane holds at most 9 tabs: if it is full, wait and retry, and never use another agent's tab.
    - Never stop or restart the 8142 server. Never change `ape:dev:entitlement` (the coordinator has set it to academy for everyone).
    - Other agents edit files at the same time, so the preview may reload. Retry, and if the pane can't show something, write "not seen on screen" instead of guessing.
11. **Save as you go:** `docs/labs/novice_audit_2026_11_14/fixes/<GROUP>_REPORT.md`. Update it after every item, so a crash loses nothing.

## Report format

1. A summary line: fixed / not a bug / held / shared needs.
2. The item table:

| # | Item (lab, what) | Verified in code (file:line) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|

3. SHARED NEEDS, each with the file, line and exact proposed change.
4. What you did not check, and why.

## In scope

- Every row of report **section 7** and every **section 4 quick win** for your labs.
- Plain bugs in your labs' **section 6** entries or G* files: typos, doubled words, wrong numbers, text that contradicts the picture, a dead end, a control that does nothing, a label cut at 390.
- **Developer lines shown to learners** ("install the newest dev build", "update the app to see it", "install the v7 build", "OK · WRONGCONTENT"):
  - If a line is behind `__DEV__`, it is NOT A BUG.
  - Otherwise, remove it from learner builds, or replace it with a plain sentence for the student.
- **Silent first step:** where WHERE TO START (or the first instruction) needs sound, add a first step a sound-off learner can do and see. Keep it one sentence, in the lab's own voice.
- **Credit given wrongly:** where the lab's own words promise a rule and the code does something else. Examples: "LAB COMPLETE" after one of several modes, "✓ 50 DONE" after one read, a fault counted as fixed before the fix is proven, a requirement met before anything is placed. Fix the NEW credit path only; never take back stored credit.
- **Credit withheld wrongly:** "13 pages still to finish" after every page was done. Find why and fix it.
- **Wrong-answer feedback that is plainly wrong** (it names another control or states a false number) is a bug in phase 1. Per-option reasons for every question are phase 2.

## OUT: the owner decides, so do not build

- A single meaning of "done" across labs, where a lab credits by design for opening a page (for example Digital and Gain, where the home guide says so).
- The "N of total" sweep of existing counters (MODULE n / N strips and the like).
- **WHEN the Sound Safety sheet appears** (on arrival vs first ▶, how often after KEEP SOUND OFF) and its words about safety. The coordinator has asked the owner. Everything else in row 2 is IN: pinned buttons, no vanishing, no see-through, no double open, no opening mid-tap.
- Report section 3 rows 11-17, beyond what a section 4 quick win already covers:
  - rack labs opening on LEARN;
  - the disclaimer badge;
  - the "drawing…" placeholder;
  - visible help instead of long-press;
  - intro popups on the first step only;
  - Labs menu changes beyond quick win 12;
  - one name per unit of progress.
- Ear Training requiring a play before an answer.
- Rewriting a whole lesson, or splitting or folding a page (pattern 7).
