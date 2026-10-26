# ccode → Comp A: retire the Time Trial on the server, so there's no quiz shortcut (2026-10-24)

**From:** ccode · **For:** Computer A · **Owner:** Cháno
**Owner's words:** "We need to remove the time trial easy bypass for the quiz in flashcards — open pace settings. There should be no way for a person to pass without doing the work. Remove the time trial container in that pop up and remove that logic and function that had been tied to it."

## 1. What changed in the app (done)

- **Where:** branch **`ota-after-approval-39-23`**, the post-approval OTA. It is not in the reviewed builds 39 / 23, and it ships after both stores approve.
- **OPEN PACE SETTINGS:** no TIME TRIAL panel and no start button.
- **Removed:** the trial HUD, the scoring in Flashcards, Fill in the Blank, Matching and Scenarios, and `src/features/study/timeTrial.ts`.
- **The app never calls `credit_time_trial` again.**
- **Dashboard / Enrollments:** the gate formula (`topicPct.ts`) **no longer treats `trial_passed = true` as the method at 100%**.
- **The app no longer reads `trial_passed`:** it is dropped from the `student_method_progress` select in `dashboard/api.ts`, so the column can go.
- **A ratchet test** (`test/noTimeTrialShortcut_20261024.test.ts`) keeps it out.

## 2. What the server must do (your side; owner's go before it runs)

The real gate is yours. Right now, anyone who calls the RPC directly still gets the shortcut, and old passes still count:

| # | Change | Why |
|---|---|---|
| 1 | **`start_quiz_attempt`** and **`build_study_snapshot`**: stop treating `trial_passed` as clearing a method. Today the condition is `gate_pass = COALESCE(trial_passed,false) OR (completion AND time AND accuracy)`; it becomes just `(completion AND time AND accuracy)` | The quiz must open only when the methods are actually done |
| 2 | **Retire `credit_time_trial`**: revoke EXECUTE from `anon` and `authenticated` (or drop it). Builds 38 / 22 and earlier still contain the trial UI, so a revoke also stops old installs from crediting | No client, old or new, can write a trial pass |
| 3 | **Reset existing passes:** `update student_method_progress set trial_passed = false where trial_passed;` (report the count). Pre-launch, these are test accounts | Old passes would otherwise keep unlocking quizzes |
| 4 | *(Optional, later)* drop the `trial_passed` column once 1–3 are live. The new app no longer selects it | Clean-up |

**Ordering (our rule: server first, then client):**
- 1–3 can run **any time**. The current builds 39 / 23 still show the trial, but with (2) in place a pass would only fail to save. The old panel then says the pass "could not be saved", which is acceptable until the OTA removes the panel.
- **Better:** run 1–3 **together with the post-approval OTA**, so no build shows a trial at all.
- Please send guarded paste files (`ape-sql-editor-delivery` format) and **wait for the owner's go**.

## 3. Please ACK

In `docs/CROSS_SESSION_HANDOFF.md`:
- when the SQL is ready;
- the count of `trial_passed = true` rows today.
