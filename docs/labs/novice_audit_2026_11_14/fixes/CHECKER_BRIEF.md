# Lab fix round 1: independent checker brief (2026-11-14)

You are an independent checker. The fixers built and tested their changes, but most were **never seen on screen**, because the shared preview was overloaded. Your job is to prove that each fix WORKS: what the control now DOES, not only that something moved (owner rule: "Bug tests prove FUNCTION, not movement"). You find problems; you do not fix them.

**Read first:**
- `docs/labs/novice_audit_2026_11_14/fixes/00_FIX_BRIEF.md` and `PHASE2_BRIEF.md`: what was asked.
- `SHARED_API.md`.
- The `<GROUP>_REPORT.md` of every group you check, especially the "Not seen on screen" sections.
- The original findings in `LAB_BEGINNER_AUDIT_REPORT.md` and the `G*_` files for those labs.

## Rules

1. **Never ask the user.** Never cut depth for time. Never edit any source or test file. The only file you write is your own report, `docs/labs/novice_audit_2026_11_14/fixes/CHECK_<ID>_REPORT.md`, saved as you go.
2. **Browser:**
   - Use the built-in pane only (`mcp__Claude_Browser__*`), never `claude-in-chrome`.
   - Use ONE tab of your own, made with tabs_create, and close it when you finish each lab.
   - Set 390x844 on your tab. Where a fix is about width, check 320 as well.
   - Preview: http://localhost:8142, links of the form `#labpreview/<Route>` (see `src/dev/webPreviews.tsx`).
   - Never stop the server. Never change `ape:dev:entitlement` (it is academy).
   - Saved data is shared by every tab. A first-visit caption or card may already be marked seen. You may remove a specific `ape:intro:*` or caption-seen key on your own tab to see a first visit; write down exactly what you removed.
3. **Sound:**
   - Never press I UNDERSTAND / ENABLE on the Sound Safety sheet. Always use KEEP SOUND OFF.
   - Never press PRINT, SHARE or DOWNLOAD.
4. **For each fix you check**, record:
   - what you did (taps, drags, typing);
   - what the screen showed (quote the text);
   - **PASS**, **FAIL** (with exact steps to reproduce, and the file:line you suspect), or **NOT SEEABLE** (why: phone only, sound only, no preview route).
5. **Also look for regressions** next to each fix:
   - text cut at 390;
   - a tap that now does nothing;
   - a popup that swallows a tap or opens over a tray;
   - two things saying different numbers;
   - "free" or upsell wording shown to a member;
   - an "N of total" progress counter that was ADDED;
   - display text under 9 pt;
   - English that reads oddly.
6. **Code reading is allowed** to understand a failure. Cite file:line. Do not run the full test suite. You may run single test files.
7. **Report format:**
   1. A summary line: checked / PASS / FAIL / NOT SEEABLE.
   2. A table: Lab | Fix (group + item #) | Steps | Seen | Result.
   3. A FAIL list, each with repro steps and the suspected file:line.
