# Beginner orientation audit of every lab: brief (owner request 2026-11-14, overnight)

## The owner's words (01:20, 2026-11-14)
"go through all of the labs including the new [two] labs. The agent should approach each page of each lab as a novice and beginner who is there to learn. Their task is to make suggestions on each screen as to how to make each lab screen easier to orient the new reader/viewer, and have the user understand what to do and what they are learning. The labs can be intimidating and overwhelming when first encountered and I want to see what a novice would think, feel, understand, recognize, follow, continue. This is all about learning cognition and understanding and ease of the learning process for the user. Do not make fixes. This is pure audit first with suggestions on what could be done for improvements."

Owner choices: every lab and every page (hub lessons included; Calculator Lab = home + every workspace + 1-2 calculators used in each); walk it on screen; two viewpoints.

## AUDIT ONLY: hard rules
- The owner is ASLEEP. NEVER ask the user anything (no AskUserQuestion) and never wait for an approval. When unsure, choose the sensible option, write the choice and why in your file, and carry on. If a tool is refused, note it and move on.
- NEVER edit, create or delete any file under src/, test/, assets/, scripts/, modules/, web/, supabase/ or any config. You write ONLY your own files in this folder (`docs/labs/novice_audit_2026_11_14/`) and screenshots in your scratchpad. No git commands that change anything (no add, commit, stash, checkout, reset).
- NEVER accept the Sound Safety acknowledgment. Close it with its keep-sound-off choice. The whole walk is SOUND OFF. Where a page depends on hearing, judge what a beginner would understand without sound, and say so.
- NEVER press DOWNLOAD PDF, SHARE, PRINT, EMAIL, BUY, SUBSCRIBE, SIGN IN/OUT, DELETE ACCOUNT, or anything that sends, buys or publishes.
- Never touch images. Never run eas, never publish, no server writes.
- Do not stop or restart the dev server on port 8142 (another chat owns it). Do not change the browser's saved data (localStorage) except what a normal tap does. The coordinator restores it in the morning.
- HELD or "not checked" in your report needs a real reason (e.g. "needs sound", "needs a phone", "page would not open"), never scope.

## How to look
- Use ONLY the built-in browser pane (mcp__Claude_Browser__*). NEVER the owner's Chrome (mcp__claude-in-chrome__*): it holds his real sign-ins.
- Web preview: `http://localhost:8142/#labpreview/<Route>` (deep links like `#labpreview/<Screen>/<id>` are explained at the top of `src/dev/webPreviews.tsx`; `#labpreview/EarLab` is the Labs menu). Open YOUR OWN tab (tabs_create, then navigate). Several auditors share this browser pane, so always pass your tabId and never close other tabs.
- Phone size: resize your tab to 390 x 844 (resize_window with your tabId). Note anything that would differ at 320 wide only if you see it.
- The preview is set to a MEMBER with first-visit intro cards UNSEEN, so you meet each page as a newcomer would. If a page shows a lock, say which and move on.
- For each page: (1) clean open; screenshot; write down the FIRST thing the eye lands on, before you read anything; (2) read every word on screen, help popups, screen guide and intro card; (3) try to do what the page asks with no prior knowledge: press the dock keys and the obvious controls; (4) read the page's source (screen file, its data, its screenScreenGuides / copy) only AFTER the walk, to check what the page MEANT to teach against what a beginner actually got.
- Use read_page / get_page_text for words; screenshots for layout. Keep screenshots small (scale 0.5) and save to your scratchpad. You do not need to attach them all; name the file in a finding where it helps.

## Two viewpoints
- **Total beginner, on a phone (main):** an adult with no audio background, first time in this lab, curious but easily overwhelmed. Knows no jargon (not "dB", "Hz", "Q", "bus", "gain stage").
- **Hobbyist (short note per page):** has a small home recording setup and knows the basic words. What still trips them up, or what bores them.

## What to write for EVERY page/screen
| Field | What |
|---|---|
| Page | lab · page number/name · preview link |
| First look | where the eye lands first; what it thinks this page is |
| Overwhelm | 1 (calm) – 5 (wants to leave), with the reason |
| Knows what it is learning? | yes / partly / no, and what they THINK it is |
| Knows what to do first? | yes / partly / no; what they would tap first, and whether that is right |
| Words they would not know | each unexplained term at the moment it appears |
| Follows / continues? | can they finish the page and do they know where to go next; where they would quit |
| What works | keep this (be specific) |
| Suggestions | concrete, numbered, ranked by impact: what to change and where (words, order, layout, a hint, a first step, a picture caption, fewer controls at first, etc.). Mark each with size S/M/L and with SHARED if it belongs to the shared lab frame (rack/, kit/, DockTray, screen guide, intro card) rather than this lab |
| Hobbyist | one or two lines |

Then, per LAB: an overall verdict (the beginner's journey in 3-5 sentences), the 3 biggest orientation problems, the 3 best things, and a "first 30 seconds" rewrite suggestion (what a newcomer should see and be told first).

## Learning-cognition lens (use these, plainly worded)
Cognitive load (too many controls, readouts or words at once) · a clear goal per page · the first step obvious · new words explained at first use · one new idea at a time · picture and words agree and sit together · feedback after an action (did it work? what changed?) · a sense of progress and of where you are · a reason to care (why this matters in real work) · recovery from mistakes · the end of the page says what was learned and what is next.

## Files, saved as you go (a long run can crash)
- One file per lab: `docs/labs/novice_audit_2026_11_14/G<group>_<LabRoute>.md`, written after EACH page is done (append), never only at the end.
- `G<group>_PROGRESS.md`: one line per lab when started and when finished, plus anything not reached and why.
- Your final reply to the coordinator: under 300 words: labs and page counts done, anything not reached (with reason), and the 5 strongest cross-lab patterns you saw. Numbers must come from your files.
