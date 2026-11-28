# S1 report (lab fix round, 2026-11-14): arrival order, Sound Safety, screen guide, term cards

**Summary: 17 fixed (SN2 and SN3 applied by S1 at the coordinator's request) · 1 not a bug (frame) · 0 held · 4 shared needs left (SN1 → S3, must land with S1; SN4 → lab agents; SN5 → F6; SN6 SQL → the coordinator for Comp A).**

The API is in SHARED_API.md, section S1.

**Owner decision** (relayed by the coordinator on 2026-11-14): Sound Safety = "Once per session (Recommended)".
- It is asked on the first sound lab of a session.
- KEEP SOUND OFF is honoured until the app is closed; a new launch asks again.
- The footnote now reads: "This warning appears once each time you open the app, until you enable sound." The tests quote the owner's choice.

**Tests:** `test/labFixes_20261114_S1.test.ts` has 32 tests, all passing.
- Before any change, the 41 existing test files that touch my files gave 769 pass, 0 fail.
- After the change, those 41 files plus mine plus perfStartTrim give **814 pass, 0 fail**. That includes accountWipeRegistry, which went red mid-way and is fixed: no `let` at module scope in screenIntros.ts, and no `reset*` name for the session decline.

**Start graph:** still 260 modules. No new module is in it; the new state lives in the existing screenIntros.ts and soundSafetyAck.ts.

**`npx tsc --noEmit`:** 0 errors in the whole project, run at the end.

## Item table

| # | Item (lab, what) | Verified in code (file:line, before the fix) | Fix (files changed) | Test | Seen on screen | Status |
|---|---|---|---|---|---|---|
| 1 | Row 1: two separate cards on arrival, the term card and then the intro card (G3 Cable, Connector, Dressing; G6; G7 "term card → Sound Safety → intro card") | LabTermIntro.tsx showed its own Modal; ScreenGuide.tsx IntroCardController waited for `!labTermFirst` and then presented a second card | **One card:** the term now sits inside the intro card. CARRY signal in `screenIntros.ts` (`offerLabTermToCard`, `setLabTermCarrier`, `finishCarriedLabTerm`). LabTermIntro draws nothing while a carrier is ready or pending, and stays "owed". The card shows the term on top and marks it read on close, EXPLAIN or BACK. Files: `labTermIntros.ts`, `LabTermIntro.tsx`, `ScreenGuide.tsx` | CARRY tests; "the term popup draws nothing of its own…"; "the host stays the carrier…" | YES, Noise Lab at 390 wide. ONE card: "NOISE LAB ✕ / Noise / definition / WHAT YOU'RE LEARNING / WHERE TO START / EXPLAIN · GOT IT", and no CONTINUE sheet. GOT IT wrote both seen flags (checked in localStorage). | FIXED |
| 2 | Row 1: the intro card arrived about 1–1.5 s late and took the first tap (G6b "~1 s after the page in every LEARN/CHECK"; Sound Systems LEARN NEXT; Connector Selection first tap) | ScreenGuide.tsx `SCREEN_INTRO_SETTLE_MS = 1500`, plus `rootModalHoldMs()` before presenting | The card is drawn WITH the page: `SCREEN_INTRO_SETTLE_MS = 0` and no closing-fade wait (it is drawn inside the screen, not as a Modal). The other first-open popups now wait for the card, not the other way round. LabTermIntro's web push wait is 150 ms (native keeps 900). | "no 1.5 s quiet wait…"; "the term popup: … a web push wait of a beat" | YES: the card was up on the first look after load | FIXED |
| 3 | Row 1: popups came on top of each other or back to back (ProNote, guest reminder, LabShell arrival audio ask, hint) | screenIntros.ts `isLabTermIntroOwed()` covered only the term popup | "Owed" now also covers an intro card that is owed or on screen (`setIntroCardOwed`, published in a layout effect, not in Low-Light). Everything that already waited for the term now waits for the card. | "owed covers the intro card too…"; "every first-open popup waits for it" | YES, Noise Lab: card, then GOT IT, then Sound Safety, one at a time. No hint on that visit. | FIXED |
| 4 | Quick win 1: a popup took a tap in its first moment | no arm window anywhere | `POPUP_ARM_MS = 350` with `popupArming()` (screenIntros.ts). Used by the intro card (dim, ✕, GOT IT, EXPLAIN; BACK is not blocked), the fallback guide popup's dim, the term popup's CONTINUE, and the Sound Safety buttons. | "a popup ignores taps…"; "taps in its first moment…"; the sheet test | not seen on screen (the pane cannot drive taps under 0.4 s reliably) | FIXED |
| 5 | Row 1: a popup opened over an open tray or a card | introHold.ts held only the host's own card; LabTermIntro and the Sound Safety arrival ask could not see a tray | The host publishes "work under way" app-wide (`setScreenWork`), and an intro card on screen counts as busy (`useCoversScreen`). An owed term popup is then DROPPED for this visit, not marked seen. An `auto` Sound Safety ask is dropped too, and not counted as a decline. | "never over an open tray…"; the Sound Safety decision test | not seen on screen (no tray was open before a popup came) | FIXED |
| 6 | Row 1: on a members-only lab, the card could go first and then the term land on top of it, while membership was still being checked | labTermIntros.ts `labTermIntroState`: `checking` gave owed = false | `checking` is now "owed", with nothing shown, so the card waits for it | labTermIntro_20261019 (pinned case updated, owner's words quoted) and mine | YES. The preview showed this race before the fix (card AND CONTINUE sheet on screen together); after the fix it was gone. | FIXED |
| 7 | Row 2: the sheet came back on every lab and screen while saying "This warning appears once." | AudioOutputGate.tsx:216 `setPhase(isAcknowledged() ? 'explain' : 'safety')`: every request asked again after a decline | Built the owner's choice as a switch in soundSafetyAck.ts: `SOUND_SAFETY_ASK_AFTER_DECLINE = ['deliberate']`, `markSoundAsk`, `decideSoundSafetyOpen`, `noteSoundSafetyDeclined`. After KEEP SOUND OFF, every request answers "sound off" at once with no sheet. The account wipe forgets the choice (the safe side). New footnote text. | "a session: asked once…"; "the switch holds the owner's choice…"; footnote test | YES: KEEP SOUND OFF, then ▶ gave no sheet; `isSoundSafetyDeclinedThisSession()` read true in the page | FIXED (needs SN1 and SN2) |
| 8 | Quick win 2: KEEP SOUND OFF was below the fold (Compression, Signal Chain) | SoundSafetyWarning.tsx: both buttons sat inside the ScrollView, by design | Both buttons are pinned in a footer below the scroll. ENABLE stays disabled until the box at the END of the text is ticked, so the learner still has to pass the text. | "KEEP SOUND OFF and ENABLE SOUND sit BELOW the scroll…" | YES: both buttons visible without scrolling at 390x844 | FIXED |
| 9 | Row 2: the sheet vanished on its own (Equalizer; DJ 17 "vanished before I could press KEEP SOUND OFF") | SoundSafetyWarning.tsx: the dim's `onPress={close}` declined on any stray tap | A tap on the dim now does nothing. Only KEEP SOUND OFF or BACK declines. | soundSafety.test (pinned case updated, owner's words quoted) and mine | YES: a real tap on the dim left the sheet up. A synthetic one did not; see "What I did not check". | FIXED |
| 10 | Row 2: the sheet was semi-transparent over the lab for about 2 s (Limiter) | `animationType="fade"`, dim at 0.86 | `animationType="none"`, dim at 0.94 | "opaque from the first frame" | YES: opaque on the first look | FIXED |
| 11 | Row 2: the sheet opened twice in a row (DJ 11–14, 20) | every request asked again (item 7); the checkbox reset when the gate closed and reopened the same sheet | Items 7 and 9 stop the repeat asks. The decision for an open request now holds across the gate's re-present and a hosting switch, and the tick resets only on a NEW request (`soundAskOpenId`). | "the checkbox resets on a NEW request…" | not seen on screen (DJ not driven) | FIXED |
| 12 | Row 2: the sheet opened mid-tap and took taps meant for the lesson (DJ 17, 18, 20: fault playback) | fault playback calls requestAudioOutput about 1 s after the tap | After the first KEEP SOUND OFF it never opens again in the session (item 7). Before that: the arm window ignores the tap that lands on its buttons, the dim does nothing, and an `auto` arrival ask over work is dropped. | decision and sheet tests | not seen on screen (DJ not driven) | FIXED |
| 13 | Quick win 5 and row 10: the "New: tap ⓘ" hint covered NEXT and took the tap (Cable), and arrived as the 3rd or 4th popup | ScreenGuide.tsx: the whole bubble was a Pressable, retired only by its own tap or the ⓘ key | The bubble lets taps through (`box-none`); only its ✕ takes a tap. It never shows on a visit where another popup came (`crowded`). It retires on ANY use of the guide (the ⓘ key, EXPLAIN THIS SCREEN in the card and in the fallback popup) and after 8 s on screen. | hint tests; screenGuide_20261031 (updated) | not seen on screen: the shared preview profile already has the hint marked seen | FIXED |
| 14 | The screen-guide kit said "Previous experiment / Next experiment" on screens that are not experiments | ScreenGuide.tsx GuideCard, the TRY THIS arrows | Now "Previous thing to try" / "Next thing to try" | neutral-words test; screenGuide_20261031 (updated) | n/a (screen-reader labels) | FIXED |
| 15 | Quick win 9: three term cards contradicted their labs | labTermIntroData.ts ConnectorSelectLab ("Each family fits its own jack and carries its own kind of signal"), CableInstallLab ("neat and tidy"), NoiseLab; startHereGlossary.ts `noise` ("everything you didn't want…") | Connector and Cable dressing: rewritten in plain words that agree with the lab. Noise: RE-WIRED to the live glossary row "noise color" (c4bfb4c2-1bd8-45fc-aebd-33b35b3890de), copied verbatim from the coordinator's read-only query: "Noise color tells you how a noise spreads its energy across pitches. White noise sounds hissy, while pink noise sounds fuller and more balanced." That is what the lab teaches first, so no server change is needed. Start Here's general "Noise" entry stays verbatim. | term-card tests; labTermIntro_20261019 (pinned "Noise" → "noise color", owner's words quoted) | Rewritten words: seen on screen before the re-wire. The "noise color" card was not re-checked on screen after the re-wire (it is data only). | FIXED (Connector and Cable dressing glossary rows: SN6, a server change) |
| 16 | Row 10 part: "never opens over an error" (Tube sign-in error) and "hold until an intro animation ends" (Cable Dressing) | the frame already has the mechanism: `ScreenGuideHost hold` (nobody passes it today) | Documented in SHARED_API S1 §3. The lab passes `hold={error \|\| animating}`; the frame needs no change. | – | – | NOT A BUG in the frame (lab wiring: SN5) |

## SHARED NEEDS

### SN1 (MUST land with S1): `src/screens/lab/LabShell.tsx`, the arrival audio ask, about lines 568–594

Without this, the arrival ask still comes 1.2 s after the card closes, so it can land on the learner's next tap. It is also counted as a ▶ rather than an `auto` ask.

Import `markSoundAsk` from `'../../features/audio/soundSafetyAck'` and `rootModalHoldMs` from `'../../components/DimModal'`. Then replace the effect with:

```ts
const labTermFirst = useLabTermIntroOwed();
const entryAskedRef = useRef(false);
const waitedRef = useRef(false);
useEffect(() => {
  if (labTermFirst) { waitedRef.current = true; return undefined; }
  if (entryAskedRef.current) return undefined;
  let done = false;
  const ask = () => {
    if (done) return;
    done = true;
    if (areOverlaysSuppressed()) return;
    if (isLabTermIntroOwed()) return;
    entryAskedRef.current = true;
    markSoundAsk('auto'); // an ask nobody tapped for (owner 2026-11-14: once per session)
    void requestAudioOutput();
  };
  // A first-open card just closed: ask NOW (after any closing Modal's fade),
  // so the sheet is up before the page takes a tap — never 1.2 s later on it.
  if (waitedRef.current) {
    const t = setTimeout(ask, rootModalHoldMs());
    return () => { done = true; clearTimeout(t); };
  }
  const unsub = (navigation as any).addListener('transitionEnd', (e: { data?: { closing?: boolean } }) => {
    if (!e?.data?.closing) setTimeout(ask, 120);
  });
  const fallback = setTimeout(ask, 1200);
  return () => { done = true; clearTimeout(fallback); unsub?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [labTermFirst]);
```

SN1 now goes to S3 (coordinator's routing).

### SN2: APPLIED by S1 (the coordinator assigned me this file): `src/features/audio/AudioOutputRow.tsx`

`markSoundAsk('deliberate');` is called just before `void requestAudioOutput().then(...)`, and imported from `'./soundSafetyAck'`.

Why: the Profile › AUDIO OUTPUT 5-second hold is the deliberate "turn sound on" act. Without this line, after a KEEP SOUND OFF that hold would be refused like any other request, and sound could not be turned on until the app was relaunched.

Test: "SN2: Profile › AUDIO OUTPUT hold is the deliberate act…" checks the source line, and checks that after a decline a `'deliberate'` mark really reopens the sheet.

### SN3: APPLIED by S1 (the coordinator assigned me this file): `src/features/audio/AudioOutputGate.tsx`, BACK on the hosted sheet

```ts
const onHostedBack = () => {
  if (phaseRef.current === 'safety') noteSoundSafetyDeclined();
  settle(false);
};
useEffect(() => {
  setHostedOverlay(hostedBody ? { node: hostedBody, onBack: onHostedBack } : null);
});
```

Why: when the sheet is drawn inside another Modal, Android BACK reaches the gate, not the sheet. That BACK is KEEP SOUND OFF all the same, and it is now remembered for the session.

Test: "SN3: Android BACK on the HOSTED sheet is KEEP SOUND OFF too…".

Re-run after SN2 and SN3: 57 test files (the 41-file set, plus every test that reads AudioOutputGate or AudioOutputRow, plus mine), plus accountWipeRegistry and perfStartTrim: **979 pass, 0 fail**. The start graph is still 260. No tsc this round, as the coordinator asked.

### SN4: every lab with a ▶ (S3's `soundOffLine`, phase 2)

After KEEP SOUND OFF, the owner's choice means ▶ is answered "sound off" with no sheet. On Noise Lab, the header ▶ after KEEP SOUND OFF showed nothing at all.
- What tells the learner is the lab's silent line and stored values (SHARED_API S3 §1–3).
- If the owner later wants ▶ to ask again, it is one word: `SOUND_SAFETY_ASK_AFTER_DECLINE = ['deliberate', 'play']`.

### SN5: lab wiring for row 10

- **Vacuum Tube** (the screen that shows "The 12AX7 card needs an active Academy sign-in", under `src/screens/lab/tube/`): pass `hold={!!signInError}` to its `ScreenGuideHost`.
- **Cable Dressing** (`src/screens/lab/cableinstall/CableInstallLabScreen.tsx:481`): pass `hold={introAnimating}` while its intro animation runs.

### SN6 (a server change, NOT run): the glossary rows

These make the Glossary agree with the cards; until they land, the app text is ahead of the Glossary.

```sql
update glossary set plain_english = 'A connector is the plug-and-socket hardware on the end of a cable. It makes a firm electrical contact you can also undo. Its shape tells you what it fits, not what it carries: the same plug can carry a mic, line, speaker or digital signal. The right connector and cable match the signal and the job.'
where id = '8538ff6d-d841-50b7-a36b-25ba4d86a137';
update glossary set plain_english = 'Cable dressing means routing, supporting and protecting cables, not just making them look neat. You run them along clear paths, tie them gently in place and label them. This protects the plugs, keeps walkways safe and makes every cable easy to trace and service. It also keeps power and audio lines apart to avoid noise.'
where id = '2cd72ce8-81c7-472d-8e37-33468dcf4a74';
```

Read-only check first: `select id, term, plain_english from glossary where id in ('8538ff6d-d841-50b7-a36b-25ba4d86a137','2cd72ce8-81c7-472d-8e37-33468dcf4a74');`. Confirm the rows still hold the old text, and that no other copy (flashcards, quizzes) quotes them word for word. Noise needs no SQL: it now uses the existing "noise color" row, verbatim.

## Coordinator check: does once-per-session cover DJ's START THE FAULT and PLAY?

Yes, in code. The only place the sheet is drawn is `AudioOutputGate.tsx` (lines 524 and 557). DJ's PLAY and START THE FAULT both go through the gate: `useBoothAudio.ts:312` and `useTakePlayer.ts:71` call `requestAudioOutput()`. Nothing opens the sheet directly. So after one KEEP SOUND OFF in a session, every later DJ request is answered "sound off" with no sheet.

Two cases where F2 would still see the sheet:
- **A preview reload.** Each reload is a new app launch, so the sheet asks once again (the owner's rule).
- **A stale bundle.** A run on a bundle from before this change.

## Pinned tests I changed on purpose (each quotes the owner's words)

- `test/soundSafety.test.ts`, "dismissing is not accepting": the dim no longer declines; BACK and KEEP SOUND OFF do.
- `test/appShellBugHunt20260929.test.ts`: `return shown ? body : null`.
- `test/labEndKit_d41k_20261101.test.ts`: BACK in the end layer also marks the carried term as read.
- `test/screenGuideOn_20261108.test.ts`: the controller waits on `useLabTermOnlyOwed`, presents after `SCREEN_INTRO_SETTLE_MS` (now 0), and records `term` in setShown and in close.
- `test/screenGuide_20261031.test.ts`: the hint's `clear` gains `&& !crowded`, it returns `visible`, and the arrows say "thing to try".
- `test/labTermIntro_20261019.test.ts`: `checking` is owed, with nothing shown.

## What I did not check, and why

- **Tap timing under 0.4 s (the arm window), and real taps on the DJ, Sound Systems and Cable screens.** The pane cannot time taps that precisely, and those flows are long. The tests cover them; the checker round should look.
- **The ⓘ hint on screen.** The shared preview profile already has `ape:intro:screenGuideHint = true`. I did not clear shared intro flags, because other agents use the same origin.
- **A synthetic-pointer oddity (preview only, cause not found).** On Noise Lab, before any choice was made:
  - A scripted `pointerdown` + `pointerup` dispatched on the sheet's dim closed the sheet WITHOUT a decline: `isSoundSafetyDeclinedThisSession()` read false afterwards. After that, the header ▶ brought no sheet.
  - A REAL tap on the dim, done twice, left the sheet up, as designed.
  - My guess is that the scripted events left a responder in an inconsistent state. That is not proven. The checker round should run the real-finger test below.

### Real-finger test for the checker (the dim of the Sound Safety sheet)

Do this on a phone (Pixel and iPhone) with a real finger, or in the pane with real clicks only, never scripted events. Never accept the sheet.

1. Force-close the app and reopen it, so it is a new session and the sheet will ask.
2. Open **Noise Lab**. If the one intro card (term + WHAT YOU'RE LEARNING) appears, tap **GOT IT**. The SOUND SAFETY WARNING should follow.
3. Wait 1 s. Then tap the DARK AREA ABOVE the red-edged card three times, slowly (about 1 s apart).
   - **Expect:** the sheet stays fully on screen after every tap.
4. Now tap the dark area BELOW the card, three times.
   - **Expect:** the same.
5. Press and HOLD on the dark area for about 2 s, then lift.
   - **Expect:** the sheet stays.
6. Without closing the sheet, check that **KEEP SOUND OFF** and **I UNDERSTAND — ENABLE SOUND** are both visible without scrolling, and that ENABLE is greyed out.
7. Tap **KEEP SOUND OFF**. The sheet closes. Tap the header **▶**.
   - **Expect:** no sheet (the owner's once-per-session rule).
8. **Fail signs:**
   - the sheet disappears at step 3, 4 or 5;
   - after such a disappearance, ▶ brings neither a sheet nor sound.

   Note which step failed, and whether it was on Android or iOS.
9. Android only:
   - Open a lab's **FULL SCREEN** view.
   - Tap ▶ in a NEW session, so the sheet is drawn inside that full-screen Modal.
   - Press the hardware **BACK** button.
   - **Expect:** the sheet closes, the full-screen view stays, and the next ▶ brings no sheet (SN3).
- **Seen flags lost once.** On my first look, GOT IT did not leave the seen flags in storage; on the second try both were written. This fits G4's note that saved data vanished in the shared browser (another tab rewriting the same `ape:intro:*` list). Not proven.
- **Native timing (iOS and Android).** Needs a phone. The card is drawn inside the screen, so no Modal timing applies to it. The sheet's `animationType="none"` behaves the same on both phones.
- **127.0.0.1 (a clean storage origin).** The pane refused that address, so I used localhost and labs whose term was not yet seen.

## Follow-up: the G6 ratchet (test/patternP12_20261002.test.ts)

- **What the full suite flagged.** `ScreenGuide.tsx` had a cleanup-only effect with deps: `useLayoutEffect(() => () => setLabTermCarrier(carrierId, 'none'), [carrierId])`.
- **The rule.** A cleanup-only effect must not re-run its cleanup when a dep changes (the Bass ▶ shape), so it takes `[]` deps.
- **The fix.** The deps are now `[]`. `carrierId` comes from `useState`, so it never changes. No allowlist entry was added.
- **Re-run.** patternP12 + labFixes_20261114_S1 + screenGuideOn_20261108 + screenGuide_20261031: **124 pass, 0 fail**.

## Phase 3 (owner decision 3): step intro popups on the first step only, then the same text inline

**Summary: 1 fixed · 0 not a bug · 0 held · 0 shared needs.** No lab edit is needed.

### Verified in code first
Each of the four known labs swaps its steps inside ONE `ScreenGuideHost`, whose `resetKey` changes per step. Each step's own guide carries its own `intro`, so every step offered a new intro card, and each card popped with its own GOT IT.
- Drum Tuning: `DrumTuningLabScreen.tsx:502`, `resetKey={`${mod.id}:${stepIdx}`}`, guide `drumScreenGuide(mod.id, stepIdx)`.
- Tuning: `TuningLabScreen.tsx:323`, `resetKey={String(chapter)}`.
- Envelope and Speech: both run on PagedLab (`kit/PagedLab.tsx:596`, `resetKey={String(page)}`).

So the fix belongs in the host.

### The fix
- `src/features/lab/screenGuide/introHold.ts` gets a pure rule, `introPresentMode(poppedThisVisit, carriesTerm)`:
  - the first card of a visit is the popup;
  - every later step's card is shown inline;
  - a card that carries the lab's glossary term is always a popup.
- `src/features/lab/screenGuide/ScreenGuide.tsx`, ScreenGuideHost:
  - `poppedRef` remembers that this visit already had its popup.
  - A later step's card is claimed (seen) and shown as `ScreenIntroInline`: the SAME two lines (WHAT YOU'RE LEARNING and WHERE TO START) in a compact note just above the dock, in the TRY THIS strip's place. Nothing is dimmed and no tap is held.
  - The note has ✕ to hide it, and "ⓘ EXPLAIN THIS SCREEN" to open the full card, so the words are never lost.
  - It goes on the next step, when a tray opens, or while the host's `hold` is on.
  - A new visit gets one popup again, for the first unseen step.
- The API is in SHARED_API.md, "Phase 3 · S1".

### Tests
- `test/labFixes_20261114_S1.test.ts` has a new "Phase 3" block (4 tests): the rule, the host wiring, a non-blocking note, and that the four labs need no edit.
- One pinned test was updated, with the owner's words: `test/labShellCheckEndGuideReset_d41_20261101.test.ts`. A step change now also clears the inline note.
- Re-run: the related set plus accountWipeRegistry, perfStartTrim and patternP12 gives **1044 pass, 0 fail**. Start graph: 260.
- File checks: both files parse clean. curl of the 8142 bundle returned 200. No tsc, per the brief.

### Seen on screen (Drum Tuning, 390 x 844, own tab, closed after)
- **Step 1:** the intro card is a POPUP (GOT IT).
- **GOT IT, then NEXT, then step 2:** no popup. The page text shows the inline note: "WHERE TO START ✕ / Why more tension raises a drum's pitch… / Tap ▶ STRIKE and read PITCH 233 Hz… / ⓘ EXPLAIN THIS SCREEN".
- **After a reload (a new visit):**
  - step 2 shows nothing, because it was already seen;
  - step 3, the first unseen step of this visit, is a POPUP;
  - after GOT IT and NEXT, step 4 is INLINE with no GOT IT.
- **Not seen as a picture:** the preview reloaded several times (other agents' edits), and the screenshot tool kept returning a stale frame. The inline note's position and look are confirmed from page text only. The checker should look at a later Drum Tuning step and confirm the note sits above the dock and leaves the fader live.

### Pre-existing failures I saw mid-run (not mine)
Two tests failed once and then passed on re-run with no change from me, while other agents were editing PagedLab and LabNavBar:
- "K3 PagedLab START OVER confirm…"
- "K5 rolled back: the nav's spoken names…"

Both are in `test/labEndKit_d41k_20261101.test.ts`.

## Checker fixes (K2 FAIL 1, K4 regression notes), 2026-11-14

| # | Item | Fix | Test | Seen on screen | Status |
|---|---|---|---|---|---|
| K2-1 / K4-2 | The inline intro note (ScreenGuide.tsx) was an absolute overlay of about 217 px. It covered the well's foot: Envelope m6 "NEXT: CHECK YOURSELF", Mastering steps 2–3, Game Audio page 3. | `ScreenIntroInline` is now IN THE FLOW. The host renders it after its children, so it takes its own room at the foot of the screen and the page above shrinks; it is never positioned and never covers anything. It is capped at 30% of the window (`INLINE_MAX_SHARE`), and its text scrolls inside it. It reads "WHERE TO START · ⓘ MORE · ✕". | "the inline note never covers anything…" | YES, Envelope module 6 at 390x844: the note sits under the well. With the well scrolled, NEXT: CHECK YOURSELF spans 597–645 px and the note starts at 691 px; elementFromPoint at the button's centre hits the button. | FIXED |
| K4-1 | The Speech lab opened on a "Miking" term card. | Speech now uses the live row "Source-filter model" (`1ae9fda0-87df-4e8a-9bf3-78a71ebd39cf`), copied verbatim from the coordinator's read-only lookup. Pins in labTermIntro_20261019 were updated, with the owner's words. **Owner note:** the old pin said "the Speech & Voice lab … define 'miking'" (wired 2026-10-19). If that was the owner's own choice, revert this one entry. | "Speech opens on its own term…"; labTermIntro_20261019 | not re-seen (data only) | FIXED |
| K4-3 | On Envelope WHAT'S LEFT, the end-guide card arrived after paint and took the first tap. | For its first 350 ms (`POPUP_ARM_MS`), an in-screen intro card takes NO touches (`pointerEvents="none"`): a tap aimed at the page, or one already under way, reaches the page. The 350 ms guard on its buttons stays. | "a card that arrives late lets taps through…" | not seen on screen (timing) | FIXED |
| K4-4 | Oscillators: the first EXPLORE tap opened Sound Safety, and the tab stayed on LEARN. | The cause is in LabShell.tsx, now S3's file. The arrival ask comes from the 1200 ms fallback timer (no transitionEnd on web or on a restored screen), and when it fires during the tab press the Modal takes the release. | – | – | SHARED NEED SN7 |

**SN7 (to S3), `src/screens/lab/LabShell.tsx`:**
1. On the screen root `<View>`: `onTouchStart={() => { touchAtRef.current = Date.now(); touchingRef.current = true; }}` and `onTouchEnd={() => { touchingRef.current = false; touchAtRef.current = Date.now(); }}`.
2. In the arrival ask's `ask()`, right after `if (done) return;` (before `done = true;`): `if (touchingRef.current || Date.now() - touchAtRef.current < 400) { later = setTimeout(ask, 450); return; }`. Clear `later` in both cleanups.
3. Change the fallback to `Platform.OS === 'web' ? 150 : 1200`.

The result is that the tap finishes and the tab switches first, and only then does the sheet ask.

**Re-run:** the 57-file related set plus accountWipeRegistry, perfStartTrim and patternP12 gives **1069 pass, 0 fail**. Parse-checked the changed files; bundle curl 200. No tsc, no commits.
