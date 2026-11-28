# Shared API for phase 2 (lab fix round, 2026-11-14)

Each shared-frame group writes its own section. Lab agents fill these in for every lab they own in phase 2.

## S2 · Check card and end screen ("What's left")

Owner approval: "Begin fixing all bugs found and do obvious ... fixes as you suggested in the report", then items 5 and 6 of the suggested order (the check card; the end-screen recap).

### 1. Check card: a wrong reason per option (file: `src/features/lab/understandingChecks.ts`, or wherever the lab's questions live)

`UnderstandingQuestion` (src/features/lab/understanding.ts) has two new OPTIONAL fields:

```ts
{
  id: 'hold',
  prompt: '…',
  options: ['A', 'B', 'C', 'D'],
  correct: 'B',
  explanation: '…',                 // unchanged; now shown on a RIGHT answer, or after a SECOND miss
  why: {                            // NEW: keyed by the option's EXACT text (by value, like `correct`)
    A: 'That is what RANGE sets. Look at how far OUT drops when the gate closes.',
    C: 'Watch GR between two hits: it stays at its lowest after the hit ends.',
  },
  hint: 'Look at the GR meter between two clicks.',   // NEW: the line for any wrong option without its own `why`
}
```

What the learner sees:
- **First miss** on a question: `NOT QUITE — TRY ANOTHER` + that option's `why`, else the question's `hint`, else the shared default line ("Not that one. Look back at what the lab showed you, then try another answer."). The explanation is NOT shown, because it usually names the answer.
- **Second miss** (a second, different wrong option): the same line, plus the full explanation.
- **Right answer**: `CORRECT` + the explanation (unchanged).

Rules for writing `why` / `hint` (test/labFixes_20261114_S2.test.ts checks every set):
- one line, at most 30 words, in the student's voice;
- say why THAT option is not right, or point at the picture ("look at …"); never state the right answer or quote it;
- every key must be an option of that question, and never the `correct` one;
- US spelling; "suggested starting points", never rules.
- Balanced option lengths are your per-lab job too (the right answer is often the longest option).

Examples filled in: Gate (`GATE`) and Envelope (`ENVELOPE`).

### 2. FINISH · SEE WHAT'S LEFT after a pass

**YES: "pass `checkEnd`" IS the FINISH API** (answer to the coordinator, 2026-11-14). For a LabShell lab, FINISH · SEE WHAT'S LEFT after the check is turned on by passing:

```tsx
<LabShell
  labId="gate"
  …
  checkEnd={<LabCheckEnd labId="gate" labTitle="Gate Lab" onOpen={stop} endGuide={GATE_END_GUIDE /* optional */} />}
/>
```

- `labId` is the same id as the check (and as the `labEndContent` entry, so the recap and next-lab card show automatically).
- `onOpen={stop}` stops the lab's sound when the end layer opens; `endGuide` is optional.
- Today only Binaural, FM, Stereo (FxLabScreen.tsx, Stereo only) and Modular (its own `ModularLabEnd`) pass one.
- **Effect labs:** one change in `src/screens/lab/FxLabScreen.tsx` (the `checkEnd={config.labId === 'stereo' ? … : undefined}` line) turns it on for all of them: `checkEnd={<LabCheckEnd labId={config.labId} labTitle={config.title} onOpen={stop} endGuide={config.labId === 'stereo' ? STEREO_END_GUIDE : undefined} />}`.
- **G7 rack labs** (Oscillators, Noise, Harmonics, Autotune, Harmonograph, Bass): add the same prop in each screen file.
- Separately, S2 proposed a LabShell default (`checkEnd ?? <LabCheckEnd labId={labId} labTitle={checkTitle ?? title} />`; SHARED NEED 1 in S2_REPORT.md) as a safety net. A lab's own `checkEnd` still wins, and is the only way to stop its sound on open.
- PagedLab labs already end the check page with FINISH; nothing to do.

### 3. End screen content: recap and next lab (file: `src/features/lab/labEndContent.ts`)

One entry per lab, keyed by the same id the end screen's host already uses:
- PagedLab → its `labId` (e.g. `envelope`, `mixing-beg`);
- LabCheckEnd → its `labId` (e.g. `stereo`, `fm`, `gate`);
- ReviewLabEnd → its `labKey` (e.g. `af_signal_chain`);
- a lab that draws `<LabEndScreen>` itself → add `labId="<your id>"` to that `<LabEndScreen>` (one prop), or pass `recap` / `next` props directly (props win over the file).

```ts
export const LAB_END_CONTENT = {
  envelope: {
    recap: [
      'An envelope is the shape of a sound’s loudness over time: attack, decay, sustain and release.',
      '…',                                    // 2–5 lines
    ],
    next: { route: 'HarmonicLab', title: 'Harmonics Lab', why: 'what gives a sound its color, beyond its loudness shape' },
  },
};
```

What the learner sees:
- `recap` under **WHAT YOU LEARNED** once the lab is complete, under **WHAT THIS LAB COVERS** before that. Nothing extra shows until a lab supplies lines.
- `next` as a card **UP NEXT** (complete) or **AFTER THIS LAB** (not complete): "<title> — <why> ›". Tapping it leaves this lab and opens that route.

Rules (the S2 test checks every entry):
- `recap`: 2–5 lines, each at most 30 words; KNOWLEDGE, never skills (no "you can now mix / you'll master / you built"); US spelling; nothing the lab does not teach.
- `next.route` must be a real route in `src/navigation/types.ts` (RootStackParamList); `why` at most 16 words, lower-case start, no full stop.

**Can a lab reuse its end Screen Guide's `teaches` lines as the recap?** (asked for Game Audio, `GA_END_GUIDE.teaches` in src/screens/lab/gameaudio/pages/guides/end.ts)
- Use `labEndContent.ts`, not the guide: it is the one place the recap lives, and the S2 test checks every entry there (2–5 lines, ≤ 30 words, knowledge not skills, US spelling, real route).
- Copy the guide lines that are recap: Game Audio's first two `teaches` lines qualify. Leave out guide-only lines: its "You have not opened a real tool in this lab. Page 20 is the map…" is orientation, not something learned.
- Game Audio's key is its PagedLab `labId`: `'game-audio'` (GA_LAB_ID).
- Do not import guide files into labEndContent.ts. It stays pure data, read by every end screen.

### 4. Each unfinished row names what is missing; the shared sentence once

**The exact call (PagedLab labs).** Pass `pageDetail` to `<PagedLab>`: a function from the 0-based page index to that row's own "what is missing" line, or `undefined` for no line. Game Audio already has the shape:

```tsx
const PAGE_DETAIL: Readonly<Record<number, string>> = {
  10: 'Still to do: …the goals of page 11 not met yet, by name…',   // page 11 — EXAMPLE SHAPE ONLY, write the real goals
  19: 'Counts once its six checks are done; NEXT moves on without counting it.',             // page 20
};
const pageDetail = (i: number): string | undefined => PAGE_DETAIL[i];
<PagedLab labId={GA_LAB_ID} … handsOnDetail={HANDS_ON} pageDetail={pageDetail} />
```

- The line is shown only while the page is NOT done; a done or banked page shows none.
- It may also be computed live from the page's own state, as DJ Systems does (`pageDetail={leftDetail}`, which names the unmet goals).
- Name the actual missing piece ("play MIX A and MIX B, then vote"), never a rule shared by every row.
- **`handsOnDetail`** (the rule the hands-on pages share) is printed ONCE above the list under **HOW A PAGE COUNTS** and never under a row. With no `handsOnDetail`, the shared PAGE_TASK_RULE is used.
  - Because it stands alone under a heading, write it as a full sentence. Game Audio's "Counts once its practice goals and its check are done; …" reads better as "A page counts once its practice goals and its check are done; NEXT moves on without counting it."
- **Reading pages:** the rule "A page counts once you press NEXT (or FINISH) at its foot. Jumping to it from CONTENTS does not count it." is added once, automatically.
- **Labs that draw `<LabEndScreen>` themselves:** each unit's `detail` is its missing line, and `howItCounts="…"` gives the once-only sentence.

### 5. A state-aware WHERE TO START

Automatic, nothing to fill in: the end screen draws a **WHERE TO START** card from the learner's state (first unit not started yet / pick up at the first one still listed / only the check is left / everything done). Phase 2 for the end screen's Screen Guide (`endGuide.intro.start`): make that line state-neutral, e.g. "Read WHERE TO START at the top: it names the next thing to do from where you are." (a fixed `start` line that names "the first page still listed" is false once nothing is left, G5c; EQ Lab's "open the first module and work down" is false when only the check is left, G6).

## S3 · Silent learner, bezel captions, header icons, trays, reading well

Owner approval: "Begin fixing all bugs found and do obvious ... fixes as you suggested in the report", then the suggested order items 4 (silent learner line and "needs sound" tags), 7 (header icons) and 8 (trays, bezel captions, reading well).

All of it lives in `src/screens/lab/rack/` (files `silentPath.tsx`, `rackTypes.ts`, `BezelReadouts.tsx`). Everything is OPT-IN per lab except where marked AUTOMATIC.

### 1. The silent-learner frame line (row 3)

```ts
// in your RackStage (LabShell `rack.stage`, PagedLab page `rack.stage`, or a RackUnit `stage`)
stage: { render, bezel, soundOffLine: true }          // the shared line
stage: { render, bezel, soundOffLine: 'Sound off? Every step still works: watch OUT and GR on the strip.' } // your own words
```
- While sound is OFF (the app's AUDIO OUTPUT is not on: `useAudioOutputEnabled()` false), the rack prints the line at the TOP of the well, above `wellTop`. Shared words: `SOUND_OFF_LINE` = "Sound off? You can still do every step. The readouts show what you would hear."
- Put it only in a lab where that is TRUE (every step can be done and seen silently). A lab with listening-only steps tags those steps (2), and may write its own line.
- Outside a rack: `<SoundOffLine />` (same file) renders the same line, only while sound is off. `useSoundOff()` gives you the boolean.

### 2. The "needs sound" tag (row 3)

```tsx
import { NeedsSoundTag, needsSoundA11y } from '../rack/silentPath';
<Text>Step 3 · Play the loop and listen for the click <NeedsSoundTag /></Text>   // inline, inside a Text
<View style={{ flexDirection: 'row' }}><GoalChip …/><NeedsSoundTag /></View>     // or beside a chip
accessibilityLabel={needsSoundA11y('Hear the click')}                            // "Hear the click (needs sound)"
```
- A small grey pill "NEEDS SOUND" (amber while sound is off, so the silent learner sees which steps to skip). 10 pt, never under 9.
- Tag a step or goal chip ONLY when it cannot be done or seen without sound. If the screen shows the result in a readout, do not tag it: show the stored value (3) instead.

### 3. Stored values while sound is off (row 3)

```ts
bezel: [
  { k: 'GR', v: liveGr != null ? `${liveGr.toFixed(1)} dB` : '— dB',
    silent: { v: `${modelGr.toFixed(1)} dB`, sub: 'MODEL' } },   // shown while sound is off
]
```
- `BezelItem.silent` (optional) = what the cell reads while sound is off: a stored, last-heard or modelled value. The cell swaps it in automatically while sound is off; read aloud it gets "(not heard: sound is off)". `sub` is optional (a short tag like MODEL or LAST).
- Outside the bezel: `silentValue(soundOff, live, stored)` returns `{ v, a11y }` with the same rule.

### 4. Bezel captions on first visit (row 7)

```ts
bezel: [
  { k: 'FREQ', v: '1.0 kHz', caption: 'where' },
  { k: 'GAIN', v: '+6.0 dB', caption: 'how much' },
  { k: 'Q', v: '1.4', caption: 'how wide' },
  { k: 'TYPE', v: 'BELL', caption: 'shape' },
],
captionsId: 'equalizer',   // optional: a stable id; default = the captions joined
```
- `BezelItem.caption`: 1-3 plain words (at most 14 characters) printed small under the cell's value, in the student's words: what the number MEANS, never a second unit.
- Shown on the learner's FIRST visit to that stage (per device; `ape:intro:bezelCaptions`, an intro flag that survives the guest wipe and goes with Settings > Reset onboarding hints). From the second visit on, the bezel is as before. A failed read shows the captions and writes nothing.
- AUTOMATIC: a "Hz? dB? WHAT THEY MEAN ›" chip under the bezel when any bezel value shows Hz or dB, until the learner has opened it once (per device). It opens a small popup with one plain line each. Nothing to fill in.
- AUTOMATIC: a bezel value with `vA11y` plus `sub` no longer reads its unit twice ("−8.4 dBFS dBFS" fixed in BezelReadouts).

### 5. Header icons (row 6)

- AUTOMATIC: the app Help key reads **HELP** (a word, no longer "?"); the accuracy chip wears **±** (no longer a second ⓘ); the screen guide keeps the only ⓘ.
- NEW `AccuracyNote variant="about"`: a chip that reads **ABOUT** and opens ONLY your `detail` text under the title you pass (`label`), with none of the phone-calibration, light-meter or tool list. For a concept lesson whose own "about these starting points" note matters (Miking).
- D37: a CONCEPT lab drops the accuracy chip (`accuracy={false}` on LabShell / PagedLab); live tools, measuring labs (room/acoustics, speaker coverage, gain) and calculators keep it.

### 6. Trays (row 8): AUTOMATIC, nothing to fill in

- An open tray no longer greys out and blocks the well. The lesson stays readable and live around the card; the well gets room at its foot so any line (the readout a step points to, NEXT) can be scrolled above the card.
- A tap on the well closes the tray (and still reaches what you tapped); scrolling the well closes a pick-and-close tray (a sticky A/B tray stays open while you scroll and compare).
- An in-tray ⟲ reset needs a second tap ("TAP AGAIN TO RESET") within 3 s: a stray tap never resets work.
- A fader with no `nudges` gets − and + keys at the lane's ends: tap = one step (the next readout value, at least 2 % of travel); hold = jump to that end. A lab that passes `nudges` keeps its own.
- Per-lab, not frame: keep the same dock key ORDER on every page of a lab (the order is your `params` array); a one-shot control is an `action` key (it flashes, never stays lit), not a toggle.

### 7. Reading well (row 9): AUTOMATIC

- On a phone, when the well holds more than it shows and the learner scrolls it, the pinned display folds to a slim strip (the drawing is clipped, never resized; the bezel readouts stay). It opens again on any touch on the display or the dock, on a tray, when the well is scrolled back to the top, or with OPEN DISPLAY. HIDE DISPLAY still works as before.

## S1 · Arrival order, popups, Sound Safety, screen guide

Owner approval: "Begin fixing all bugs found and do obvious ... fixes as you suggested in the report", suggested-order items 2 (arrival order, tap-swallowing) and 3 (Sound Safety). Sound Safety WHEN, owner 2026-11-14: "Once per session (Recommended)": asked on the first sound lab of a session; KEEP SOUND OFF is honoured until the app is closed; a new launch asks again.

### 1. One card on arrival: the lab term rides inside the intro card (AUTOMATIC)

- A lab whose screen has a Screen Guide with `intro` (and a `ScreenGuideHost`) now opens with ONE card: the glossary term and its plain-English line on top, then WHAT YOU'RE LEARNING / WHERE TO START. Closing it (GOT IT, ✕, the dim, BACK, EXPLAIN THIS SCREEN) marks BOTH seen. Nothing to fill in.
- The term arrives on its own sheet only on a screen with no intro card (or one already seen on this device).
- Your job in phase 2: make sure the screen a lab OPENS on has a `guide.intro`, and do not repeat the term's definition in `intro.learning` (the card already shows it above).

### 2. Order and timing (AUTOMATIC)

- `useLabTermIntroOwed()` / `isLabTermIntroOwed()` (src/features/intro/screenIntros.ts) now mean "a first-open card (the term OR the screen's intro card) is still to come on this visit". Everything that already waited for the term popup now also waits for the intro card: useScreenIntro (ProNote), GuestStartReminder, LabShell's arrival audio ask, the ⓘ hint. So popups come one at a time.
- The intro card no longer waits 1.5 s: it is drawn with the page (and right after a popup ahead of it closes), and it ignores taps for its first 0.35 s (`POPUP_ARM_MS`), so a tap aimed at the page never closes it by accident.
- The "New: tap ⓘ" hint never shows on a visit where another popup came; it lets taps through to what is under it (NEXT), retires after 8 s on screen, and retires when the guide is used in ANY way (the ⓘ key, EXPLAIN THIS SCREEN, ‹ INTRO).

### 3. Holding a popup back (how a lab declares a hold)

- `<ScreenGuideHost hold={busy}>`: pass `true` while the screen shows something a card must not cover: an error or sign-in state (Vacuum Tube's "needs an active Academy sign-in"), an intro animation still running (Cable Dressing), your own popup on screen. The card waits, still owed, and comes when `hold` drops. It is the same `hold` prop as before (the frame's one hold mechanism), now documented.
- `useScreenGuideWork(on)` (src/features/lab/screenGuide/introHold.ts), for a view INSIDE the host: report work under way (a tray open, a drag). A Rack Unit already does this. While work is under way an owed intro card AND the lab term card are dropped for this visit (not marked seen, so they come next visit), and a card already up closes. New: `isScreenWorkUnderway()` / `useScreenWorkUnderway()` (src/features/intro/screenIntros.ts) give the same signal app-wide; the host publishes it, and an intro card on screen counts too, so the lab term popup and the Sound Safety arrival ask never open over a tray or a card.
- A screen that owns the whole screen before the lab (the Amplitude orientation): `holdLabTermIntro()` as before.

### 4. Sound Safety: who asks, and how (one switch)

- `src/features/audio/soundSafetyAck.ts`:
  - `SOUND_SAFETY_ASK_AFTER_DECLINE` = `['deliberate']` (owner 2026-11-14). After KEEP SOUND OFF (or BACK) the sheet does not open again in this app session for any request whose kind is not listed: the request answers "sound off" at once, with no sheet. A new launch asks again. To make ▶ re-ask after a decline, add `'play'` to the list.
  - `markSoundAsk(kind)`: call it right before `requestAudioOutput()` when the ask is not a plain ▶: `'auto'` for an ask nobody tapped for (arrival), `'deliberate'` for an explicit "turn sound on" act (Profile › AUDIO OUTPUT hold). Unmarked = `'play'`.
  - An `'auto'` ask while work is under way on the screen, or while an intro card is owed or up, is dropped quietly (answers "sound off", NOT counted as a decline), so the sheet never opens over an open tray or a card.
- The sheet: KEEP SOUND OFF and ENABLE SOUND are pinned below the scroll (always visible; ENABLE stays disabled until the box at the END of the text is ticked); a tap on the dim does nothing (only KEEP SOUND OFF or BACK decline, so it never "vanishes"); no fade (never see-through); taps in its first 0.35 s are ignored; the footnote reads "This warning appears once each time you open the app, until you enable sound."
- Lab agents: nothing to fill in. Do not call `requestAudioOutput()` on arrival or from a timer; only a tap. If a lab must ask without a tap, `markSoundAsk('auto')` first.

## Phase 3 · S3 (owner's decision 3, 2026-11-14: "do your recommendations for these")

All in `src/screens/lab/rack/` and `LabShell.tsx`.

### 1. Rack labs open on LEARN on the first visit: AUTOMATIC
- A LabShell lab with a rack opens on its LEARN tab the first time a learner opens it on this device; every later visit opens on EXPLORE as before. Stored per lab (`ape:intro:labLearnFirst`, an intro flag: kept through the guest wipe, cleared by Settings › Reset onboarding hints). A failed read opens EXPLORE (as before) and writes nothing. Nothing to fill in.

### 2. The plain model note (instead of an all-caps "TEACHING MODEL · NOT A MEASUREMENT" badge)
```ts
stage: { …, modelNote: 'This picture is a model of the EQ, not a meter.' }
```
- `RackStage.modelNote`: ONE plain sentence, sentence case, at most ~90 characters, saying what the picture is and is not. While set, the rack draws it (small, grey, sentence case) where `badge` was drawn, in the inline rack and in full screen. Keep `badge` for a lab that has not moved yet: `modelNote` wins when both are set.
- Outside a rack: `<ModelNote text="…" />` from `rack/ModelNote.tsx` (same look).
- The disclosure must stay on screen (owner rule): do not drop it, rewrite it.
- FX labs: their badge comes from `FxLabScreen.tsx` (`ANIM_BADGE`, `heroBadge`); that file's owner passes `modelNote` there.

### 3. "drawing…" instead of an empty black box
```ts
stage: { …, drawing: !sceneReady }   // true while YOUR drawing is not painted yet
```
- `RackStage.drawing`: while true, the glass shows a calm "drawing…" line over the dark glass; it goes the moment you pass false. AUTOMATIC: the glass also shows it before its first measure (the first frame).
- Outside a rack: `<DrawingPlaceholder />` from `rack/ModelNote.tsx`.

### 4. A visible ⓘ in an open tray: AUTOMATIC
- An options / group tray whose key has a `helpKey` shows an ⓘ beside its ✕. A tap opens the same lesson the long-press opens. Nothing to fill in; give your tray keys a `helpKey`.

### 5. N of total in the frame
- The rack prints no "N of total" progress counter itself (checked: RackUnit, BezelReadouts, DockTray, DockButton, ParamLane, StageFullScreen, LabShell). Lane values such as "FRET 3 of 12" are values, not progress, and stay.

## Phase 3 · S2 (owner's decisions 1, 2 and 3, 2026-11-14): the progress strip, one unit noun, "done = work done"

### 1. No "N of total" in the shared strip: AUTOMATIC
- The strip reads **MODULE 3**, not "MODULE / 3 / 8". In step mode it reads **MODULE 3 · STEP 2**, not "STEP 2 / 4".
- Screen-reader labels drop "of 8" too ("Module 3. Opens the contents").
- Counts of what is LEFT on the end screen stay ("3 modules not done yet"), and so does "✓ 5 DONE".
- Nothing to do in your lab.

### 2. One unit noun per lab: pass it ONCE
Allowed nouns: `'module' | 'lesson' | 'chapter' | 'step'`. The default is `'module'`.

- **PagedLab labs:** `<PagedLab … unitNoun="chapter" />`. The strip ("CHAPTER 3"), CONTENTS (screen-reader rows), the end screen ("3 chapters not done yet", WHERE TO START, HOW A CHAPTER COUNTS) and the next-button words all use it.
  - ⚠ PagedLab's end screen used to say "page" while its strip said "MODULE". With no `unitNoun` both now say "module". If your guides or copy say "page", pick one noun and change the words to match it.
- **Labs that build their own screen with `useLabNav` + `<LabNavBar>` / `<LabEndScreen>`:** wrap the lab once in `<LabNounProvider value="lesson">…</LabNounProvider>` (from `src/screens/lab/kit/LabNavBar`). LabNavBar, CONTENTS and LabEndScreen read it.
  - A `noun="…"` prop you already pass to `<LabEndScreen>` still wins. Remove it unless the end screen counts something else on purpose: LabCheckEnd's single "check", ReviewLabEnd's single "step".
- **Your own words** (guides, captions, buttons): use the same noun. The kit cannot rewrite them.

### 3. "Done = work done" in PagedLab: declare each page's kind
PagedLab has never credited a page on OPENING: a CONTENTS jump marks nothing. It marks a page when NEXT / FINISH leaves it, unless the page marks itself. Each page now says which kind it is:

```ts
{ title: 'Check Yourself', short: 'CHECK', Component: P7, manualDone: true }     // has a goal/check: call ctx.markDone() when it is MET; NEXT never counts it
{ title: 'Common Sound Shapes', short: 'SHAPES', Component: P2, reading: true }   // no goal: reading it through (NEXT at its foot) is the work
```

- A page with a goal or check MUST be `manualDone: true` and call `ctx.markDone()` only when that goal or check is met.
- A page with nothing to do but read is `reading: true`.
- An undeclared page keeps today's behavior (NEXT marks it), so nothing earned is lost and no lab becomes impossible to complete. Declare every page in phase 3.
- `test/labFixes_20261114_S2.test.ts` lists the undeclared pages per lab as a shrink-only ratchet. Remove your lab from it when every page is declared.
- Stored progress and credit are never touched; only NEW marks follow the declaration.
- The end screen's HOW A <NOUN> COUNTS says both rules once.

## Phase 3 · S1 · Step intros: a popup on the first step only, then the same text inline

Owner decision 2026-11-14 (phase 3, item 3: "do your recommendations for these").

- **AUTOMATIC, nothing to fill in.** Any `ScreenGuideHost` that swaps its steps in place (its `resetKey`: steps, chapters, pages, tabs) applies this. Drum Tuning, Tuning, Envelope and Speech already do (PagedLab, LabShell and the step labs all use one host per screen), so no lab edit is needed.
  - The FIRST intro card the host presents on a visit is the popup (with the lab term inside it, if the term is still owed).
  - Every LATER step's intro on the same visit shows the SAME two lines (WHAT YOU'RE LEARNING / WHERE TO START) as an **inline note**: a compact strip just above the dock, in the TRY THIS strip's place. Nothing is dimmed and no tap is held.
  - The note has ✕ to hide it and "ⓘ EXPLAIN THIS SCREEN" to open the full card. It goes on the next step, when a tray opens (work under way), or while the host's `hold` is on.
  - Showing it inline counts as seen.
- **A new visit** (the lab screen opened again) gets one popup again: the first unseen step of that visit.
- **Rule (pure):** `introPresentMode(poppedThisVisit, carriesTerm)` in `src/features/lab/screenGuide/introHold.ts`. A card that carries the lab's glossary term is always the popup.
- **Lab authors:** keep each step's `guide.intro.start` short (≤ 40 words, the existing cap), because it is now read inline above the dock. If a lab needs a step's intro as a popup on purpose, give that step its own ScreenGuideHost; ask S1 first, as no lab needs it today.

### 4. F4's nouns (PAGE / GUIDE / STAGE) and a name in place of the number: LANDED 2026-11-14
- **Nouns now allowed:** `UnitNoun = 'module' | 'lesson' | 'chapter' | 'step' | 'page' | 'screen' | 'guide' | 'stage'` (src/screens/lab/kit/labNav.ts). DJ Systems: `unitNoun="screen"`; Game Audio and De-Esser: `unitNoun="page"`.
- **Both Mixing labs (PagedLab):** `<PagedLab … unitNoun="page" />`. The strip reads PAGE 7 ▾. The end screen, HOW A PAGE COUNTS, WHERE TO START and START OVER all say "page".
- **Mixing Guides, or any lab with its own `useLabNav` + `<LabNavBar>`:** wrap the screen once in `<LabNounProvider value="guide">` (from `src/screens/lab/kit/LabNavBar`).
  - To show the style instead of the number, pass `<LabNavBar nav={nav} posLabel="POP" />`. The readout then shows GUIDE over POP; without it, GUIDE over 7.
  - `posLabel` is ignored on the intro and the end screen.
- **Not on useLabNav:** `useLabNav.ts` is on the do-not-touch list. The noun goes in through the provider (or PagedLab's `unitNoun`), and the strip relabels itself (`relabelView`).
- **Step mode:** reads MODULE 3 · STEP 2 ▾. With `value="page"` it reads PAGE 3 · STEP 2 ▾.
