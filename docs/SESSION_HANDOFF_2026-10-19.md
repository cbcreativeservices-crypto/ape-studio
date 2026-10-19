# Session handoff — 2026-10-19

**Read this first in any new session (local or cloud).**

## Store state (unchanged)
- iOS 1.0 build 36 and Android 20 are **in review**. Release is manual in App Store Connect.
- **D74:** no production OTA and no bucket upload until both stores approve.
- **Android fingerprint b975a5d1 ✅:** rechecked after every commit today. Recheck both platforms before any OTA.
- Still open from 10-18:
  - 62 images still needed (`Downloads\2026-10-16_IMAGES_STILL_NEEDED.md`).
  - The owner's NEW intro video for the OTA.

## Branches and where the work is
| Branch | Folder | What's on it | Pushed? |
|---|---|---|---|
| `next-store-build` | `C:\Users\profe\dev\ape-build-snap` | The after-approval OTA: everything from 10-18, plus today's three changes below | See "Cloud session" |
| `dj-lab` | `C:\Users\profe\dev\ape-dj-lab` | The DJ Systems Lab, all 24 screens | See "Cloud session" |

⛔ Never switch branches in ape-build-snap; it breaks the OTA fingerprint. Use a separate worktree.
The worktrees `ape-dj-lab-b`, `-c` and `-d` are merged and can be removed **only on the owner's yes**.

## Done today (2026-10-19)
### On next-store-build (ships with the after-approval OTA)
1. **Onboarding "Where would you like to begin?"** MEMBERSHIP has the Home Explore button's breathing gold ring until it is tapped (`e2f33c62`).
2. **MY CUSTOM LIST** (`53ff4e2f`, `5ab12363`):
   - It is always on the Study dashboard and can never be removed.
   - Flashcards, Fill in the Blank and Matching are open from the start, using the list's current terms.
   - An empty list shows a centred "No terms in your list yet" popup.
   - All its meters show 100% (display only; nothing is recorded).
   - **HOLD:** its quiz and Scenarios stay off (`CUSTOM_LIST_SERVER_READY=false` in `studyGate.ts`) until Comp A ships the RPCs. Brief: `Downloads\2026-10-19_COMP_A_CUSTOM_LIST_QUIZ.html`.
   - The quiz is 30 up to the full list, drawn at random, picked as 30·50·100·ALL. It is practice only, and terms with no question are substituted.
3. **Lab first-open glossary popup** (`75fa2d6d`, `e8930c4f`, `60570463`):
   - It shows the term plus the exact plain-English glossary text, then CONTINUE. It appears once per TERM.
   - 62 labs are wired. The Calculator lab and Start Here have none.
   - Members-only labs show it to members only; free labs show it to everyone.
   - Decisions: `Downloads\2026-10-19_LAB_INTRO_TERMS_TO_CHOOSE.html` (all decided).

### On dj-lab
- **DJ Systems Lab, 24 screens:** built, then 2 rounds of 3 expert reviews and fixes.
- **Graded on the house art scale:** every screen is B or better (average 7.10 → 7.38). See `Downloads\2026-10-19_DJ_LAB_GRADES.html` and `Downloads\2026-10-19_DJ_LAB_MORNING_REPORT.html`.
- **Toddler bug test:** 32 bugs fixed, 0 crashes (`Downloads\2026-10-19_DJ_LAB_TODDLER_BUG_TEST.html`).
- **Redo:** a redo is a fresh practice run, and earned credit is kept.
- **Shared rack dock:** words shrink to fit at 320 px, 9 pt minimum. This is on dj-lab only; it reaches other labs when dj-lab merges.
- **Certificate requirement (both DJ credentials):** ⏸ HOLD until the lab is on phones.
- **Lab intro term:** "DJ Mixer" (proposed), to wire in when dj-lab merges.
- **Not tested on a phone:** sound, speed and audio chunk joins.

## Waiting on others
- **Comp A:**
  - Custom-list quiz RPCs (`Downloads\2026-10-19_COMP_A_CUSTOM_LIST_QUIZ.html`).
  - Glossary meaning fixes plus a glossary-wide search (`Downloads\2026-10-19_COMP_A_GLOSSARY_MEANING_FIXES.html`). Brand names ARE allowed in the glossary.

## Owner rules learned today
- When the owner skips a scope question, say plainly which default you took.
- The owner expects the WHOLE job, not a stage.
- Lab intro text explains the ACTION or the DEVICE as it applies to audio.
- Free users never see member popups before the members-only denial.
- Seen is tracked per term, not per lab.

## Next, in order
1. Approval day → OTA (recheck fingerprints) → tiles and certificate upload → exam lab gate → Comp A server work.
2. Decide when the DJ lab merges into the store branch. It needs a device build or an OTA, plus a phone sound check.
3. After the DJ lab is on phones: the certificate requirement brief for Comp A, and wire the "DJ Mixer" popup.
4. Optional DJ polish (in the morning report): the screen 6 printed-legend hookup, the screen 17 full-screen labels, and shared-rack legends on wide views (needs the owner's OK).

## Cloud session (owner wanted to try it, 2026-10-19)
- A cloud session runs on Anthropic's computers, not this PC. It starts from **GitHub**, so it only sees what has been **pushed**. It cannot see Downloads, local worktrees or unpushed commits, and it has none of the local tools (the Pixel/adb, the browser preview pane, local Supabase/MCP connections may be missing).
- ⛔ **Pushing `audio-tools-engine` publishes the live website.** Pushing `next-store-build` or `dj-lab` only makes Vercel *preview* builds and publishes nothing.
- **Good cloud tasks:** code work on a pushed branch (e.g. DJ lab polish on `dj-lab`), tests, reviews. **Not for cloud:** anything that needs the phone, eas, the store consoles, or local files.
