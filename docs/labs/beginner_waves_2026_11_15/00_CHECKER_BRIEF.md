# Beginner waves 1-3 (2026-11-15): brief for every independent checker

You did NOT build any of this. Your job is to check, on screen and in the code, that a builder group's changes do what the owner approved, and that each lab ended up CALMER, not bigger.

## Background
- The owner said on 2026-11-15: "build waves 1 thru 3". Twelve builder groups changed the labs that day.
- What each group was asked to build: `docs/labs/beginner_waves_2026_11_15/<GROUP>_ITEMS.md`.
- What each group says it built: `docs/labs/beginner_waves_2026_11_15/<GROUP>_REPORT.md`.
- The rules every builder followed: `docs/labs/beginner_waves_2026_11_15/00_BUILD_BRIEF.md`. Read its "Guardrails" and "Standing rules" sections; you check against them.

## What you check, for every item in your group's REPORT marked built
1. **Function, not movement** (owner rule): open the screen and do what a beginner would do. Does the control, line or fold now do what the item says? Is anything that used to work now broken (a button that does nothing, a step that cannot be finished, text cut off, a tap that lands on the wrong thing)?
2. **Calmer, not bigger:** at 390 x 844, is there less to read or the same amount with fewer wrong turns? If a line was added, was something of the same size removed or folded (guardrail 1)? Do the picture and the first control still show without scrolling?
3. **Words:** plain, true to what the screen and the sound actually do, US spelling, no "N of total" progress counter, intros claim knowledge not skills. Hz, dB, RT60, ms and cents use the shared words in `src/features/lab/plainTerms.ts`.
4. **Standing rules:** nothing locks navigation; no new popup; credit, grading, timing windows, quiz decks and hearing-safety text unchanged; no image or owner art changed; Mixing Guides wording unchanged; calculators' equations and results unchanged.
5. **Items the builder could NOT see on screen** (their report says so): these are your priority. Look at them first.

Give each checked item one result:
- **PASS:** it works and the screen is calmer or clearer.
- **FAIL:** it does not work, it broke something, it made the screen busier, or it breaks a rule. Say exactly what you saw, where (lab, page, control), and what would fix it.
- **NOT SEEABLE:** it truly cannot be shown in the web preview (phone-only: finger drags, real speaker, haptics). Say why. "The preview was slow" is not a reason: reload and wait.

## Hard rules
- **Do not change any file under `src/` or `test/`.** You report; the builder fixes. The only file you write is your report.
- No git commands that change anything. No eas, no publishing, no server. Never ask the user anything. Do not start other agents.
- Built-in browser pane only (`mcp__Claude_Browser__*`), never `claude-in-chrome`.
- The web preview runs at http://localhost:8142 (another chat owns it; never start, stop or restart it; do not call preview_start). Open ONE tab of your own (`tabs_create`, then `navigate` to `http://localhost:8142/#labpreview/<Route>`; routes are in `src/dev/webPreviews.tsx`), set 390 x 844 on your tab only, and close it when done. The pane holds at most 9 tabs: if it is full, wait and retry.
- The first load takes about TWO MINUTES (measured 2026-11-15: the page stays blank, then draws). Wait for it: poll `document.getElementById('root').innerText.length` every 10 s in short javascript calls (each call under 40 s), up to 4 minutes, before you reload. Navigating between `#labpreview/...` routes in the same tab is fast once the first load is done, so keep ONE tab and change its hash instead of opening new tabs. Write NOT SEEABLE only after two full waits failed.
- The Browser pane may be hidden; that is fine, keep going and use read_page / get_page_text / javascript measurements when screenshots come back empty.
- Always close the Sound Safety sheet with KEEP SOUND OFF. Never press PRINT, SHARE, DOWNLOAD, BUY or SIGN IN/OUT. Never change saved data except what a normal tap does.
- A lab with no preview route: check in the code and tests, mark NOT SEEABLE (no route) and name what a phone check must look at.

## Report
Write `docs/labs/beginner_waves_2026_11_15/CHECK_<GROUP>_REPORT.md`, saving after every item:
1. Summary: PASS / FAIL / NOT SEEABLE counts.
2. Table: `| ID | Result | What I did and saw (390 x 844) | If FAIL: what to fix |`
3. Anything else broken that you noticed in passing (with the screen and the steps).

End with a short message: counts, the report path, and every FAIL in one line each.
