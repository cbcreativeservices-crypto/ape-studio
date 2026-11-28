# Beginner waves 1-3 (2026-11-15): build brief for every builder

## What the owner asked for (2026-11-15)
> "build waves 1 thru 3. after we will discuss wave 4 at what goes and doesnt for that wave"

This is the owner's go to WRITE THE CODE for waves 1-3 of the D62 adoption plan (must-do D62). It is NOT a go for any `eas build`, `eas update`, `eas submit` or publish.

The plan is in Downloads, `2026-11-15_D62_ADOPTION_PLAN.md`; read its "short answer" and "Rules every builder follows". In short: a beginner audit on 2026-11-14 suggested changes to every lab. Two fix rounds built many of them that day. The rest were sorted by what they do to the screen. **Waves 1-3 take things away, fix wrong turns, and add at most one short line where a beginner gets stuck.** Wave 4 (new features) is NOT in this round.

## The one goal
**Every lab ends this round CALMER, not bigger.** A beginner should see less, or the same amount with fewer wrong turns. If a change you are making adds clutter, you have built it wrong: find the version that takes something away.

## Read first
1. Your item list: `docs/labs/beginner_waves_2026_11_15/<GROUP>_ITEMS.md`. Build wave 1 first, then 2, then 3. The "Where the checker found it" line is a lead from a code-reading pass this morning: verify it before changing anything.
2. The rules: `AGENTS.md` (house helpers), and `C:\Users\profe\dev\ape-studio\.claude\PROTOCOL_CHECK.md`.
3. How the 11-14 rounds did it, and the shared mechanisms you will reuse: `docs/labs/novice_audit_2026_11_14/fixes/SHARED_API.md` (sound-off line, needs-sound tags, "can't listen now" path, stored values, bezel captions, plain model note, "drawing…", GO DEEPER fold, one unit noun, done = work done, step intros). Use these; do not build a second version of any of them.
4. The 11-14 hard rules, which ALL apply to you: `docs/labs/novice_audit_2026_11_14/fixes/00_FIX_BRIEF.md`, section "Hard rules" (rules 1-11), with the changes below.
5. The audit report and the auditors' files for your labs, if an item is unclear: `docs/labs/novice_audit_2026_11_14/LAB_BEGINNER_AUDIT_REPORT.md` and `G*_<Lab>.md` in the same folder.

## Changes to the 11-14 hard rules for this round
- **Reports:** save as you go to `docs/labs/beginner_waves_2026_11_15/<GROUP>_REPORT.md`, after EVERY item, so a crash loses nothing.
- **Tests:** `test/labWaves_20261115_<GROUP>.test.ts`. For every change, a test that would have failed before it. Run only your own tests and the existing tests of the files you touch (`node --test --test-timeout=120000 test/<file>`). Never run the whole suite; the coordinator does. When a change breaks a pinned test ON PURPOSE, update that test and add a comment quoting the owner: `owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item <ID>)`.
- **Test imports:** a source file a test loads must import its own local files with the `.ts` extension (see `src/screens/lab/rack/bezelRules.ts`); tests import `../src/....ts`.
- **Model + effort:** you are on Opus 5.5 at high effort (house rule D56). Take the time you need. Never cut depth for time.

## Guardrails (from the adoption plan; every change must pass all four)
1. **A line in, a line out.** At most ONE new element per screen in this round, and it must replace or fold something of about the same size. A "wave 3" item adds ONE short line; if the screen has no room, shorten or fold something else in the same step.
2. **Phone width.** Look at every changed screen at 390 x 844 in the browser preview. The picture and the first control must still show without scrolling. Text on a lab display stays at least 9 pt.
3. **One word, one definition.** Hz, dB, RT60, ms and cents are explained ONLY with the shared text in `src/features/lab/plainTerms.ts` (`PLAIN_TERMS[key].short` for captions, `.sentence` for lesson text, `termWithShort(key)` for "RT60 (decay time)"). Do not write your own definition of these five. If you need another shared word, write it as a SHARED NEED.
4. **Built once.** Two items that fix the same screen are one change. The plan lists overlaps; if two of your items touch the same spot, make one change that satisfies both and say so.

## Standing rules a change must keep (in addition to rule 7 of the 11-14 brief)
- Labs never lock navigation; hints never become locks.
- Popups, never pull-downs. No new popup in this round.
- Progress never shows "N of total". Value readouts (VOICES 0/16) are fine.
- Intros claim knowledge, not skills ("you will learn what X is", never "you will master / build / mix").
- Credit already earned is never removed. Do not change what earns credit, how anything is graded, any timing window, any quiz deck, or any hearing-safety text: those items were left out of this round on purpose.
- Never touch an image file, and never redraw the owner's art (the floating EAR, the molecule tracer, the world map, owner icons, reviewed cutaway artwork).
- Mixing Guides text is hand-edited and owner-approved: do not reword guide content. Miking content says "suggest", not "recommend", and shows no citations.
- Calculators are 100% accurate: never change an equation, a unit or a result. The app says "166 calculators" everywhere. An impossible result is refused in words.
- Cables follow the approved wiring rulebook; never redraw a cable.
- US spelling. iOS and Android identical.
- The Sound Safety sheet: you never change when or how it appears (owner decided 2026-11-14), and in the browser you always press KEEP SOUND OFF.

## Files: who owns what
- **Your labs' own folders and files** are yours (find them with Glob; your item list names the labs).
- **The shared frame belongs to group S:** `src/screens/lab/rack/`, `src/screens/lab/kit/`, `src/screens/lab/LabShell.tsx`, `src/components/LabUnderstandingCheck.tsx`, and the shared logic in `src/features/lab/` and `src/features/intro/`. If you need a change there, do not make it: write a **SHARED NEED** in your report (file, line, exact proposed change). The coordinator forwards it.
- **Shared DATA files that hold one entry per lab** (for example `src/features/lab/guidedLessons/content.ts`, `src/features/intro/labTermIntroData.ts`, `src/features/lab/understandingChecks.ts`, `src/features/lab/labEndContent.ts`, `src/screens/lab/labCatalog.ts`, `src/dev/webPreviews.tsx`): you MAY change your own labs' entries, ONLY with the Edit tool on that entry's exact text. Never Write the whole file, never reformat it, never touch another lab's entry. Other builders edit the same files at the same time.
- **Never touch:** `modules/`, `package.json`, `package-lock.json`, `app.json`, `eas.json`, `index.ts`, `metro.config.js`, `.gitignore`, `dist_ota/`, `useLabNav.ts`, any image, and the files already modified before you started (the `modules/` line-ending copies, `.gitignore`, `index.ts`, `metro.config.js`, `package.json`, `package-lock.json`).
- **No git commands that change anything** (no add, commit, stash, checkout, restore, reset). The coordinator commits after the full gate.

## HELD needs a real reason (PROTOCOL rule 32)
An item is HELD only for: an owner decision, a phone-only check, a server change (write the proposed SQL; never run it), or a standing rule above. Scope, size, "if simple" or "risky" are never reasons. A HELD line says which reason.

## The browser
- Built-in browser pane only (`mcp__Claude_Browser__*`), never `claude-in-chrome`.
- The web preview is already running at http://localhost:8142 (another chat owns it; it serves THIS branch and reloads on save). Never start, stop or restart it. Do not call preview_start.
- Open ONE tab of your own (`tabs_create`, then `navigate` to `http://localhost:8142/#labpreview/<Route>`; routes are in `src/dev/webPreviews.tsx`), set 390 x 844 on your tab only, and close it when done. The pane holds at most 9 tabs: if it is full, wait and retry. Never use another builder's tab.
- The preview reloads when other builders save. Retry; if you cannot see something, write "not seen on screen" instead of guessing.
- Never change `ape:dev:entitlement` or other saved data except what a normal tap does. Never press PRINT, SHARE, DOWNLOAD, BUY or SIGN IN/OUT.
- Look at what each changed control now DOES, not only that something moved.

## Report format
1. Summary line: built / not a bug / held (with reasons) / shared needs.
2. Item table: `| ID | Wave | What changed on screen (plain words) | Files | Test | Seen on screen at 390 | Status |`
3. **SHARED NEEDS**: file, line and the exact proposed change.
4. **Guardrail check**: for each screen you added a line to, what you removed or folded.
5. What you could not check, and why.

## When you finish
Run `npx tsc --noEmit` once and report your files' errors (0 expected). Then end with a short message: counts, the report path, and anything the coordinator must forward. Do not start other agents. Never ask the user anything.
