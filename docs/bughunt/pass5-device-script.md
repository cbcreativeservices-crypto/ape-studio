# Device test script — the morning after 19 commits

Written 2026-09-18 for the owner. Everything below was changed in the last day
and **verified only by `tsc` and node tests**, which cannot see a phone.

Read top to bottom. Sessions are ~10 minutes each. The scariest things are
first — if you only get through Sessions 0–3 you will have covered every
BLOCKER-class change.

Mark each step ✅ / ❌ / skipped. A ❌ is a finding — note the step number.

---

## Session 0 — five minutes at the computer, BEFORE you pick up a phone

**Nothing below is on your phones yet.** The phones run standalone builds that
never talk to Metro. All 19 commits are local and unpushed, and none of them has
been published as an OTA update.

1. Confirm no native config was touched — this is the thing that silently kills
   OTA:

   `cd C:\Users\profe\dev\ape-studio; git diff --name-only fb6b3101~1..HEAD | Select-String -Pattern 'app.json|app.config|eas.json|package.json|easignore|^ios/|^android/'`

   **You should see:** nothing at all.
   **If you see anything:** stop. A change to any of those files moves the
   runtime fingerprint, the phones stop asking for this runtime, and the OTA
   publish succeeds while the phones see nothing. (I ran this — it came back
   clean. Re-run it after any further edits.)

2. Confirm the fingerprint still matches the installed builds before you
   publish: compare the local fingerprint against the `runtimeVersion` that
   `eas build:list` shows for the builds actually on your phones. This is the
   `.easignore` CRLF trap and it fails silently in both directions.

3. Publish the OTA yourself — no agent has run or will run this:

   `cd C:\Users\profe\dev\ape-studio; eas update --branch preview --environment preview`

4. On each phone: force-quit, reopen, wait, force-quit, reopen again.

5. **Prove the update actually landed** before you test anything else. Open the
   **Smart Processors** lab (Training Lab → Dynamics). It should now list
   **exactly one row — "De-Esser & Sibilance Control"**. If six "Coming Soon"
   rows are still under it, the update did not land and every result below is
   meaningless. Stop and fix the update.

Note: 19 commits are unpushed — origin is still at `a12e7395`. Fine for testing,
but do not lose the machine.

---

## Session 1 — the emergency mute (10 min) — DO THIS FIRST

The sound safety gate promises, in red capitals, that shaking the phone mutes
everything instantly. Four commits in one day touched this path, two of them
fixes to fixes. Highest risk and highest reachability in the app.

Headphones off, volume low. Needs a real phone — the accelerometer does not
exist on a simulator.

1. Fresh launch → accept the sound safety warning → open **Ear Training Lab**
   and start a clip (anything with a real audio file).
   **Should see:** sound.
   **If nothing plays at all:** the file-player registry is broken. BLOCKER.

2. While the clip is playing, **shake the phone hard**.
   **Should see:** sound stops instantly, audio row flips to off.
   **If the clip plays on to its end:** the pass-1 fix regressed. BLOCKER.

3. Turn audio output back **on** and play the same clip again.
   **Should see:** normal level.
   **If it is silent or very quiet:** this is the pass-2 regression — the mute
   used to zero the volume and never restore it. BLOCKER: it would mean every
   emergency mute permanently silences the app until you leave the screen.

4. Start a tone in a lab that generates sound (**Cymatics Lab → Plate Studio**,
   or **Gain Staging Lab**). While it is sounding, **press Home**.
   **Should see:** silence, immediately.
   **If the tone keeps playing from the home screen:** BLOCKER. On Android there
   is no notification and no way to stop it short of force-quitting.

5. Reopen from the app switcher.
   **Should see:** audio off (deliberate), lab where you left it.

6. **Negative test.** Start a tone again, then swipe down **Control Centre**
   (iOS) or the notification shade (Android) and dismiss it. Do not leave the app.
   **Should see:** the tone KEEPS PLAYING. Control Centre is not leaving.
   **If it mutes and re-locks the safety gate:** the `inactive`-vs-`background`
   fix regressed. MAJOR — it means the mic permission prompt kills the lab that
   raised it.

7. **Negative test, the one that matters most.** Study → **Flashcards** → go
   **full screen** → make sure **audio output is ON** → shake.
   **Should see:** the phone mutes, and the card is **NOT** marked known. Same
   card, known count unchanged.
   **If the card gets marked known:** BLOCKER. The emergency gesture is writing
   study progress, including the server credit that feeds the flashcards-100%
   gate.

8. Same screen with **audio output OFF**. Shake.
   **Should see:** the card IS marked known — the shortcut still works when
   there is nothing to mute.
   **If nothing happens:** MINOR, over-blocked.

9. Same pair on the other full-screen study method (the one whose footer says
   "Shake to go back a question"): sound ON must mute and must not step back;
   sound OFF must step back.

*Park for later (needs 20 idle minutes): leave the app open and untouched for
20+ minutes with audio on, come back, confirm it auto-muted AND that turning it
back on gives audible playback again.*

---

## Session 2 — money, membership and the gates (10 min)

1. **Signed out.** Go to the paywall (Home → the Academy upsell, or any locked
   lab row → SEE PLANS) and tap the buy button.
   **Should see:** a dialog **"Create an account first"** with a *Create
   account* button.
   **If the store sheet opens and takes your money:** BLOCKER, stop everything.

2. Still signed out, tap **Restore purchases**.
   **Should see:** **"Sign in to restore"** with a *Sign in* button.
   **If it says "check your connection":** the old lie is back. MAJOR.

3. **Deep link, signed in as FREE (`gratis@`).** Open from Notes or a browser:
   `proaudio://labs/cymatics/plate`
   **Should see:** the Plate Studio behind a greyed **upgrade scrim**, audio
   muted, no completion credit.
   **If you get the live lab with working audio:** BLOCKER — this was open
   yesterday and is the worst regression available here.

4. Repeat with `proaudio://labs/cymatics/gallery` and
   `proaudio://labs/cymatics/liquid`.

5. **Deep link while signed OUT.** Force-quit, then open
   `proaudio://labs/cymatics/plate`.
   **Should see:** the sign-in screen — not the lab, and not the lab sitting on
   top of the sign-in screen. After signing in, the lab should then open (the
   link is held and resumed).

6. **The trap screen.** Airplane mode ON, then open any Training Lab lab (e.g.
   **Compression**).
   **Should see:** "Checking your membership…" with a spinner, then after about
   four seconds "Still checking your membership…" and a **GO BACK** button that
   works.
   **If you get a blank black screen with no way out:** BLOCKER — ~40 routes,
   and it hits paying members too.

7. Still in **airplane mode**, signed in as a **paying** account (`pro1@`), open
   **Settings**.
   **Should see:** membership row reading `ACADEMY` or `…` — never "GUEST — NO
   ACCOUNT" — plus a **Log out** row and the **DELETE ACCOUNT** section at the
   bottom.
   **If DELETE ACCOUNT is missing:** BLOCKER for App Review 5.1.1(v).

8. Airplane mode off. **Final Exam as a free account** (Study → topic → TAKE
   FINAL EXAM, or Manage My Learning).
   **Should see:** the membership wall offering **"See membership plans"** as
   well as Back.
   **If Back is the only option:** MAJOR — a wall with no door.

---

## Session 3 — the second account (10 min) — ALL NEGATIVE TESTS

Needs **two accounts**: `pro1@` and `gratis@`. This is the account wipe.
Fourteen modules have been added to the wipe registry across four passes; three
landed yesterday and none has ever been checked on a phone.

Sign in as **account A** (`pro1@`) and do these quickly:

1. Accept the **sound safety** warning.
2. **SPL Meter** → take a reading → **SAVE LOG** → confirm **SAVED ✓**.
3. Open a **Mixing** lab and answer its focal-point / mix-priorities questions.
4. Turn **Low-Light Production Mode** ON in Settings.
5. Start a **time trial** on any study method and leave it running.
6. On the next permission prompt, choose the "don't ask me again" option.

Now **log out**.

7. **Should see:** a confirm dialog that names what is destroyed — measurements,
   term lists, settings, your microphone calibration.
   **If it only says "you can sign in as a different user afterward":** MAJOR.
   People lose up to 200 measurements without being told.

Sign in as **account B** (`gratis@`) and check every one of these:

8. **The sound safety warning MUST appear again.** If B gets audio with no
   hearing-damage warning: BLOCKER — it is the one safety gate in the app.
9. **Low-Light must be OFF.** If B's app is dimmed and silencing overlays they
   never switched on: MAJOR.
10. **The Mixing lab must not echo A's answers back at B.** A stranger's focal
    point shown as your own: MAJOR.
11. **No time trial is running**, and no study credit lands on B from A's trial.
    If B gets credit: BLOCKER — writes to the wrong account.
12. **Permission prompts ask again.** B has consented to nothing.
13. **A's saved measurements are gone** from the Saved Measurement Library.
14. If a first credential is awarded to B, the **celebration shows**. Silently
    inheriting "already celebrated": MINOR.

15. **The stale entitlement read.** Log out of B and immediately sign into A on
    a slow connection (or toggle airplane mode during sign-in).
    **Should see:** the tier settles on the correct account and stays there.
    **If a signed-out device shows Academy caps, or a paying account drops to
    free and stays:** BLOCKER.

---

## Session 4 — the production labs (10 min, paid, flagship)

Sign in as a **member**. **Pre-Production Lab** → any project → a stage with
number and text fields.

1. Type a long sentence into a **text** field as fast as you can.
   **Should see:** every character you typed.
   **If characters vanish:** BLOCKER — the per-keystroke lost-update race is
   back, and the client-facing packet is computed from that file.

2. Fill field 1, then immediately fill field 2 with no pause. Back out to the
   stage list and come back in.
   **Should see:** both answers. **If one is empty:** same bug. BLOCKER.

3. In a **number** field type `7.5`. **Should see:** `7.5`.
   **If you get `75`:** BLOCKER — a tenfold error across 45 fields.

4. Type `1250.50`. **Should see:** `1250.50`, not `125050`.

5. Type `1,5` (comma). **Should see:** `1.5`.

6. Type `12,000`. **Should see:** `12000` — twelve thousand, not twelve.

7. Find a **required table** — the **hazard register** or the **rights
   register** are the ones that matter. Tap **add row** and leave the row blank.
   **Should see:** the field stays **incomplete**; the readiness meter does not
   go green.
   **If one blank row satisfies it:** MAJOR — the register's whole purpose is
   recording that somebody looked.

8. Put a `0` in one cell of that row.
   **Should see:** it now counts as answered. `0` and `false` are real answers.

9. Fill a field, **force-quit**, reopen to the same stage.
   **Should see:** the answer is there.

10. Export the packet and skim the numbers you typed. Nothing should be off by a
    factor of ten.

---

## Session 5 — quiz and final exam (10 min)

1. Take a **v3 topic quiz** on a topic with a short term list (under 30
   quizzable terms). Finish it.
   **Should see:** Results scored out of the number of questions actually served
   — e.g. `13 / 18`. Never `/ 30`, never a raw count presented as a percentage.
   **If it says `/ 30` or tells you to reach "28+":** MAJOR — it names a score
   the quiz cannot produce.

2. **Crash recovery.** Start a quiz, answer three questions, **force-quit**,
   reopen.
   **Should see:** same attempt, question 4, three answers intact.
   **If you are back at question 1 with nothing:** MAJOR.
   **If it instantly force-submits an empty attempt:** BLOCKER.

3. **Final Exam offline.** Start a Final Exam on a member account, answer it,
   airplane mode ON, submit.
   **Should see:** "Your exam is saved and will be submitted automatically when
   you reconnect. Your finish time is preserved."

4. Still offline, **wait on that screen**.
   **Should see:** at most **one** retry notice.
   **If you get a dialog every 15 seconds:** MAJOR — it is unescapable.

5. Airplane mode **off**, stay on the screen.
   **Should see:** the exam submits and you get your result.

6. **Negative test.** Queue an exam offline again, then **log out** without
   reconnecting, sign back into the **same** account, reconnect.
   **Should see:** the exam still submits.
   **If it is gone:** BLOCKER — signing out used to sweep the exam queue, and
   that queue is the last copy of a graded capstone.

7. **Negative test.** Queue an offline exam, log out, sign in as a **different**
   account, reconnect.
   **Should see:** nothing submits under the wrong account.

---

## Session 6 — the microphone tools (10 min)

Every mic tool's recovery path was dead until yesterday. Nine call sites were
wired and none has been touched on a phone.

1. Revoke microphone permission in OS Settings. Open **SPL Meter**.
   **Should see:** the "MICROPHONE ACCESS IS OFF" card with an **OPEN SETTINGS**
   button — and on **Android** also **ALLOW MICROPHONE**.
   **If there are no buttons:** MAJOR — the recovery path is a sentence telling
   you to leave.

2. Tap **OPEN SETTINGS** — it should open the app's settings page.

3. On Android, tap **ALLOW MICROPHONE** — the OS dialog should re-appear.

4. Grant the mic. Now **occupy the microphone with another app** (voice memo
   recording, or a call) and open **RT60**.
   **Should see:** an error card with a working **TRY AGAIN** key. Release the
   mic, tap TRY AGAIN, the tool starts.
   **If the card has no button:** MAJOR. RT60 is the worst case — that card is
   the only thing on the screen.

5. Repeat step 4 quickly on **RTA**, **Waveform**, **Spectrogram**, **Frequency
   Counter**, **MultiMeter**.

6. On each of the 8 saving tools: take a reading, tap **SAVE LOG**.
   **Should see:** `SAVED ✓`, and the reading actually present under **VIEW
   SAVED MEASUREMENTS**.
   **If SAVED ✓ appears but the library is empty:** BLOCKER.

7. **iOS 27 phone only** — do its own audio/mic pass separately: buffer
   duration, route changes while recording, AirPods, dictation, share/print.
   That phone has never had a pass of its own.

---

## Session 7 — copy, numbers and the smaller things (10 min)

1. **Profile.** The progress readout should read **"Whole-curriculum progress"**
   and the tier line **"N% of the whole curriculum"**.
   **If either says "Full Course Certification":** MINOR, but it promises a
   credential the app never issues.

2. **Calculator Lab.** In any resistance or frequency field, type `10,000`.
   **Should see:** ten thousand used in the answer — not 10.

3. Same field: `12k`, `47uF` where they make sense. Either they parse correctly
   or the calculator says it cannot read them. **Silently computing from a wrong
   number is the BLOCKER here** — these are field-use numbers near high voltage
   and rigging loads.

4. Any calculator showing a sample rate: **48000 must read as `48000`**, not
   `4.800e4`. Check `44100` and `192000` too.

5. Read three or four **formula lines**. A `·` means multiply and only multiply;
   two equations on one line are separated by a **semicolon**.
   **If you see `dBV = dBu − 2.218 · dBu = dBV + 2.218`:** one was missed — note
   the workspace.

6. **Calc Projects.** Save a named record containing `10,000`, load it back into
   a calculator. It must still be 10,000.

7. **Career Finder → results screen.** The example job titles must carry the
   required-education marker and line — check **Audiologist**, **Speech-Language
   Pathologist**, **Diagnostic Medical Sonographer**, **Sonar Technician**,
   **Rigger**, **Production electrician**.
   **Any regulated title listed bare violates a hard rule.**

8. **Career Family screens.** No screen should promise "the first free topics
   are open to everyone" — that was false on 42 of 42 families.

9. **Cymatics Lab → export a sheet.** The export must carry its **SIMULATION**
   label.

10. Glance at the header of every lab you open today for the **AccuracyNote**
    ("learn here, measure with a calibrated instrument"). Spot-check **Ear**,
    **Amp**, **Cable** and **Tuning**.

11. **Help hub.** "How do I delete my account?" must describe the in-app
    control, not "email support". "What does the app send off my phone?" must
    mention crash reporting and usage analytics.

12. No error string anywhere should say "report this to your professor". If you
    hit one, note the screen.

13. **VoiceOver / TalkBack** on any rack lab (Compression, EQ): swipe to the big
    fader.
    **Should hear:** an adjustable control with a value, and swipe up/down
    should change it.
    **If VoiceOver skips it entirely:** MAJOR — it is the one continuous control
    in every rack lab in the app.

---

## Session 8 — what you CANNOT test from a phone

Do not spend time trying.

**Server-side — not in the app bundle, and not deployed:**
- The Google **refund webhook** (`store-notifications`), which used to revoke a
  paying member on the request body alone. Edge function. Cannot be exercised
  from a phone at all.
- The **60-day lapse grace** in `validate-purchase`. Same.
- The **tenure migration** and both edge functions are still undeployed.
- **Certificates appear to be awarded by a DB trigger** on topic completion,
  which would bypass the Final Exam and the paid-month rule. Needs you and a
  live DB check, not a phone.

**Needs a store sandbox account:**
- Any *successful* purchase, and with it the "Your Academy access is active"
  message that every real purchase used to report as a failure. Session 2 steps
  1–2 cover the *refusal* paths, which are the dangerous ones; the success path
  needs an App Store sandbox or Play internal tester.
- The paywall still shows **hardcoded USD prices** and `loadStoreProducts()` has
  no callers — the prices on that screen are not the store's prices. Known and
  still open; do not re-file it.

**Needs airplane mode:** Session 2 steps 6–7, Session 5 steps 3–7.

**Needs two accounts:** all of Session 3, plus Session 5 step 7.

**Practically untestable without filling the disk — I would skip these:**
- The "Measurement not saved" banner.
- The production lab's failed-write banner.
Both appear only on a storage write failure. Covered by node tests; seeing them
on a phone means filling the device.

**Needs a real phone, not a simulator:** all of Session 1. The accelerometer is
absent on simulators and the hook silently no-ops.

**A server-permissions question, not a phone question:** enrollments are pushed
to the server but pulled back only when the read is *confirmed*, because
`user_topic_enrollments` is in the deny-all RLS set and a client read returns
zero rows rather than an error. Expected behaviour now is that the app does
**not** overwrite your enrollments with a default seed. If your enrolled topics
ever reset themselves to a default list, that is a BLOCKER — but settling it
needs the database, not the handset.

---

## If you only have ten minutes

Session 1, steps 1–7. The emergency mute is a written safety promise, it is
reachable in the first two minutes of using the app, four commits in one day
touched it, and two of those were fixes to earlier fixes.
