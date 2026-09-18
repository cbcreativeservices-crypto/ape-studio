# Bug hunt — Pass 4, agent E: can a blind student complete this course?

**Date:** 2026-09-18 · **Branch:** `audio-tools-engine` · **HEAD:** `2cdcd53b`
**Axis:** accessibility as a JOURNEY. Not "does this button have a label" — *can a person
using VoiceOver or TalkBack get from signing up to holding a certificate.*
**Method:** source reading only, plus reading the installed `react-native@0.8x` and
`react-native-svg@15.15.4` native sources in `node_modules/` to settle what the props in this
codebase actually do on each platform. No dev server, no build, no `eas`, no git write.
**No file was edited except this one.**

---

## The one-paragraph answer

**On Android: yes, with real difficulty.** On **iOS: no, not through the labs** — and the
reason is a single missing prop repeated four times, not a missing philosophy. This codebase has
done a large amount of genuine, careful accessibility work (73 `announceForAccessibility` sites,
60 `accessibilityRole="header"`, a spoken spectrum summary in the RTA, a fader with real
increment/decrement actions, a certificate PDF with semantic `h1`/`h2` and `aria-hidden` on its
decorative SVG). The failures below are almost all **one of three mechanical mistakes made
repeatedly**, each of which silently deletes work that was already done:

1. `accessibilityRole` / `accessibilityLabel` on a bare `<View>` **without `accessible`** — which
   on iOS means the element does not exist (verified in RN's own source, below). Four
   `adjustable` controls, thirteen described `<Svg>` diagrams.
2. `accessibilityLiveRegion` used as *the* announcement channel — it is **Android-only**; there
   are zero references to it anywhere in RN's iOS layer. 18 files rely on it with no iOS path.
3. **Nothing in the app ever moves focus.** `setAccessibilityFocus` appears 0 times in `src/`,
   and `isScreenReaderEnabled` appears 0 times, so nothing adapts. Every auto-advance and every
   "the thing you were touching just unmounted" is a focus loss the app does not repair.

---

## Verdicts at a glance

| # | Step | iOS | Android |
| --- | --- | --- | --- |
| 1 | Sign up / sign in | **COMPLETABLE WITH DIFFICULTY** (errors silent) | COMPLETABLE |
| 2 | Reach the free topic (Dashboard rack) | COMPLETABLE | COMPLETABLE |
| 3 | Flashcards | COMPLETABLE WITH DIFFICULTY | COMPLETABLE WITH DIFFICULTY |
| 4 | Fill in the Blank | COMPLETABLE WITH DIFFICULTY | COMPLETABLE WITH DIFFICULTY |
| 5 | Matching | COMPLETABLE WITH DIFFICULTY | COMPLETABLE WITH DIFFICULTY |
| 6 | Scenarios | COMPLETABLE WITH DIFFICULTY — *operable but not learnable* | same |
| 7 | Topic quiz — single/multi choice | COMPLETABLE WITH DIFFICULTY | COMPLETABLE WITH DIFFICULTY |
| 7b | Topic quiz — **matching questions** | **BLOCKED** | **BLOCKED** |
| 8 | Quiz result | COMPLETABLE | COMPLETABLE |
| 9 | Final Exam | COMPLETABLE WITH DIFFICULTY (worse than the quiz) | same |
| 10 | Final Exam result | COMPLETABLE | COMPLETABLE |
| 11 | A rack lab (Cymatics / EQ) — the fader | **BLOCKED** | COMPLETABLE |
| 12 | A paged lab | COMPLETABLE WITH DIFFICULTY | COMPLETABLE WITH DIFFICULTY |
| 13 | A measurement tool | COMPLETABLE (SPL / RTA / Tuner); Spectrogram unreadable by design | same |
| 14 | Find, read and share the certificate | COMPLETABLE (failure path is invisible) | same |

---
---

# JOURNEY 1 — Sign up → free topic → flashcards → homework → quiz → result

## Step 1 · Sign up — COMPLETABLE WITH DIFFICULTY (iOS) / COMPLETABLE (Android)

`src/screens/auth/AuthScreen.tsx`

The form is good. `TextField` (`src/components/TextField.tsx:68`) puts the label on the
`TextInput` itself and pairs `accessibilityState` with `aria-disabled`; the SHOW/HIDE toggle is a
real button with a changing label; the reset link was converted from a nested `Text` tap to a
`Pressable` with `hitSlop`; every action is a `StudioButton`.

**The failure: every error the screen can show is silent on iOS.**
`:438`, `:443`, `:449`, `:482`, `:487`, `:494` — six announcement sites, all of this shape:

```tsx
<Text style={styles.error} accessibilityLiveRegion="assertive" accessibilityRole="alert">
```

with the comment above them reading *"A11Y (2026-09-05): every sign-in failure rendered as a
plain Text, so a screen reader never announced it."* The fix was made and it works — **on
Android only**.

`accessibilityLiveRegion` has **no iOS implementation in React Native.** I grepped the installed
copy: `grep -rni liveregion node_modules/react-native/React/` returns **0 results**; the same
grep against `node_modules/react-native/ReactAndroid/.../uimanager/` returns `BaseViewManager.java`,
`BaseViewManagerDelegate.kt` and `ViewProps.kt`. `accessibilityRole="alert"` does not rescue it:
role maps to `accessibilityTraits` on `self.accessibilityElement`
(`RCTViewComponentView.mm:469-472`), and there is no `alert` trait that triggers speech. The
`<Text>` itself *is* readable — the user can find it by swiping — but nothing tells them it
appeared, so the experience is "I pressed Login and nothing happened."

**Fix:** pair each with `AccessibilityInfo.announceForAccessibility(error)` in the effect that
sets it, exactly as `FillInBlankScreen` and `SplMeterScreen` already do.
**Severity: MAJOR** (iOS). **Confidence: high** — verified in the RN source in this repo.

**Minor, same screen:** `TextField` renders the visible label as a sibling `<Text>` (`:47`) *and*
passes it as `accessibilityLabel` (`:68`), so every field is announced twice
("EMAIL … Email, text field"). One `importantForAccessibility="no"` on the visible label fixes it.

## Step 2 · Reaching the free topic — COMPLETABLE

`src/screens/dashboard/DashboardScreen.tsx`. This is the best-executed screen in the app for
assistive tech and it is worth saying so, because the same authors wrote the parts that fail.

- `GlassScreen` (`:427-429`) composes one sentence per rack panel:
  `"${title}, ${off ? 'powered off' : complete ? 'complete' : value}${subtitle}"`. The
  powered-off panels — which the standing product rule says are *not* a bug — announce
  themselves as **"powered off"**, so the sequence gate is legible without sight.
- Every locked switch carries `a11yLabel="Locked — complete the earlier study methods first"`
  (`:1812`, `:1836`, `:1932`).
- The topic carousel has explicit **"Previous topic" / "Next topic"** buttons (`:1580`, `:1589`)
  alongside the jog wheel, so the gesture-only control is not the only path.
- The decorative check glyph is correctly hidden (`:456`).

**One gap, iOS only:** the `JogWheel` overlay (`src/components/JogWheel.tsx:675-682`) declares
`accessibilityRole="adjustable"` with `A11Y_ACTIONS` on a bare `<View>` with **no `accessible`**,
so on iOS it is not an element and the increment/decrement actions are unreachable. It does not
block the journey — the Prev/Next buttons are the alternate path — but it is the same bug as the
one that *does* block the labs (Journey 3).

## Step 3 · Flashcards — COMPLETABLE WITH DIFFICULTY

`src/screens/study/FlashcardsScreen.tsx`

**What works.** The term is the reveal control and it says so
(`:1448-1450`: `accessibilityRole="button"`, `accessibilityHint="Reveals the definition"`) —
the right choice, because the card wrapper holds four real buttons and could not take a button
role itself; the comment at `:1355-1360` explains exactly that trade and it is correct. PREV/NEXT
exist (`:1528-1532`) and the comment above them records that until 2026-09-12 a screen-reader
user opening a 120-term deck was *"permanently stuck on card 1"* — that was a real BLOCKED and it
is genuinely fixed. Bookmark/star/links toggles all announce their new state.

**What does not work: the flip is silent and it throws away your place.**
`onTap` (`:913`) calls `reveal()` and the render switches from the `level === 0` branch to the
`level > 0` branch — **which does not render the term `<Text>` at all** (`:1466-1470`, with the
comment "Term name intentionally omitted here"). The element the user was touching unmounts.
Nothing calls `setAccessibilityFocus`, nothing announces, so VoiceOver focus resets to the top of
the screen. Between the top of the screen and the definition sit the header, the counter, the
session-timer pill and **thirteen filter controls** (`:1244-1320`: ALL, A–Z, Shuffle, Reset deck,
the solo eye, FILTER, fullscreen, BEG, INT, ADV, KNOWN, Bookmarks, Custom list). So the cost of
reading one definition is fourteen swipes, on every card, in a 120-card deck.

`goCard` (`:888`) is the same story in reverse: it changes `idx`, resets `level`, and says
nothing. Press NEXT and you hear nothing at all.

**Fix:** one `announceForAccessibility` in `reveal()` with the revealed section text, and one in
`goCard` with the new term and `"card N of M"`. This is the pattern the study screens next door
already use.
**Severity: MAJOR** (the method is passable, but reading the deck costs ~14× the swipes it should).
**Confidence: high** on the code path; the exact iOS focus-reset destination is the one detail a
device would pin down.

**Focus trap (both platforms):** the FILTERS popup at `:1560` is **not a `<Modal>`** — it is
`<View style={styles.modalBackdrop}>`, a full-screen `position:'absolute'` overlay
(`:2073-2083`). It has no `accessibilityViewIsModal` and nothing hides the deck behind it, so a
screen reader swipes straight out of the dialog into the card underneath. This is *worse* than
the known Community Directory gap, because an RN `<Modal>` is a real Android `Dialog` and gets
trapping for free; an absolutely-positioned `View` gets it on neither platform. Same shape at
`:1729` (`fsGuideBackdrop`) and `:1858` (`linkedRoot`, the in-definition glossary popup).
**Severity: MAJOR** (a11y). **Confidence: high.**

## Step 4 · Fill in the Blank — COMPLETABLE WITH DIFFICULTY

`src/screens/study/FillInBlankScreen.tsx`

**This is the model the rest of the app should copy.** `answer()` at `:301` announces
`'Correct.'` or `` `Not quite. The answer is ${question.item.term}.` `` — and names the right
answer on a miss, which is the whole pedagogical point. `AnswerCell`
(`src/components/AnswerCell.tsx:63-65`) folds the verdict into the spoken label (`", correct"` /
`", incorrect"`) *and* draws a ✓/✕ glyph for colour-blind users, so the same information rides
three channels. This is properly done.

**The gap: the auto-advance is silent.** `:404-406` — after `FEEDBACK_MS` (950 ms) the timer does
`setQIdx(i => i + 1)` with no announcement. The sentence changes, the four cells change, and
VoiceOver focus stays on whatever grid position it was on — so the learner is now focused on
*option 3 of a question they have never heard*. `QuizScreen` solves exactly this one screen away
(`QuizScreen.tsx:325`) and the solution was not carried across.
**Severity: MAJOR. Confidence: high.**

**Minor:** the blank is six literal underscores (`:381`, styled at `:521`). Screen readers do not
reliably speak a run of underscores, so the sentence is read as a fragment with no audible gap,
and with `hasBlank === false` the blank is appended at the end (`:74`) where it is even less
legible. Give the sentence an `accessibilityLabel` that substitutes the word "blank".

## Step 5 · Matching — COMPLETABLE WITH DIFFICULTY

`src/screens/study/MatchingScreen.tsx`

**First, correct the premise: this does not drag.** It is tap-left-then-tap-right
(`pickLeft` `:320`, `pickRight` `:330`), which is the right design for WCAG 2.5.7 and for
switch control. Good.

Verdicts are announced and — better — so is the board state:
`` `Matched. ${remaining} pairs left.` `` / `'Not a match.'` (`:356-362`).

**Gap 1 — nothing says there are two columns.** The comment at `:538-539` is explicit:
*"Column delineation (Booth 2026-07-08, rev 2): **NO text** — two subtle tinted bars over the
columns mark the two sides to be matched."* Those bars are decorative `<View>`s (`:452-454`). A
screen reader therefore reads N clue sentences followed by N terms as one flat list, with no
heading, no `accessibilityHint`, and no indication that the answer requires one from each half.
The clue text (`matchingSentenceV2`, `:266`) is deliberately written *not* to contain the term, so
you cannot infer the split from the content either. A sighted learner gets the structure from two
coloured bars; a blind learner gets nothing.
**Fix:** two `accessibilityRole="header"` labels ("Clues" / "Terms"), or a hint on each cell.
**Severity: MAJOR. Confidence: high.**

**Gap 2 — every match destroys the focus.** A matched pair is filtered out of both columns
(`:465`, `:482`) after `CORRECT_FLASH_MS`, so the cell the user just activated unmounts. Focus is
lost, back to the top of the screen, past the header / LED / counter / fullscreen button — once
per pair, for every pair on every board. The "N pairs left" announcement softens it but does not
replace the lost place.

## Step 6 · Scenarios — COMPLETABLE WITH DIFFICULTY (*operable, but not learnable*)

`src/screens/study/ScenariosScreen.tsx` — **this is the worst screen in the study flow and the
clearest finding in this report.**

There is **not one `AccessibilityInfo` call in the file** (grep: zero). And the verdict is not
carried anywhere else either:

- **The feedback banner** (`:579-590`) is
  `✓ Correct — {explanation}` / `✕ Not quite — {explanation}`, shown for
  `EXPLANATION_MS = 3000` (`:54`) and then auto-advanced (`judge`, `:283`). It has **no
  `accessibilityLiveRegion`, no `announceForAccessibility`, no focus move.** It appears and
  disappears without a sound.
- **The cell label cannot rescue it either.** `cellState` at `:483` returns **`'selectedBlue'`**
  for a correct single-choice answer — *not* `'correctGreen'`. `AnswerCell`'s verdict string
  (`AnswerCell.tsx:64-65`) only fires on `correctGreen` / `wrongRed`. So a **correct** answer in
  Scenarios is announced as `", selected"` and a wrong one as `", incorrect"` — the one case that
  most needs confirming is the one case that gets none.
- **Multi-select and sequence questions get no verdict at all, on any channel.** `cellState`
  tests `isSeq` and `isMulti` *before* it tests `picked` (`:481-482`), so after `confirmMulti` /
  `confirmSequence` the cells stay `selectedBlue` / `selectedOrange` forever. The banner is the
  only verdict, and the banner is silent.
- The sequence position badge (`:537-542`) is a separate unlabelled `<View>` holding `"1"` or
  `"·"`, read as a stray digit next to the option rather than as part of it.

So: a blind learner can tap through all three rounds of Scenarios and satisfy the gate, and will
finish never having learned whether a single answer was right or what the explanation said. The
explanations are the teaching content of the method.

`FillInBlankScreen` and `MatchingScreen` were both fixed for exactly this on 2026-09-05, with
comments naming the problem. Scenarios was missed.
**Severity: MAJOR. Confidence: high** — I traced `judge` → `setFeedback` → render and grepped the
whole file for every announcement mechanism.

---
---

# JOURNEY 2 — The quiz and the Final Exam under a screen reader

## Step 7 · The topic quiz — COMPLETABLE WITH DIFFICULTY, *except matching questions*

`src/screens/quiz/QuizScreen.tsx`

**Progress: announced.** `advance()` at `:325` says `` `Question ${qIdx + 2} of ${length}` ``.

**The timer: handled correctly, and this is the right answer to the question.** It is a plain
`<Text>` (`:535`) with **no** live region, updated from a 250 ms interval (`:275`). So it never
interrupts — and it is readable on demand, because focusing it speaks the current value. The one
thing a silent clock cannot do is warn you, and the code covers that too:
`:341-348` announces **"One minute left"**, once, behind a `minuteWarnedRef` latch. That is
exactly the right shape. Credit where due.

**Gap A — the question text is never announced, and focus never moves.** `advance()` announces
the *number* only. Focus stays on the `AnswerCell` index the user last activated, which is now a
different question's option. The learner hears "Question 4 of 18" and is standing in the middle of
question 4's answers having never heard question 4. Announce the question text (or
`setAccessibilityFocus` to it) alongside the counter.
**Severity: MAJOR. Confidence: high.**

**Gap B — matching questions are BLOCKED.** `:585-612` renders lefts and rights as `AnswerCell`s,
and `pickMatch` (`:393-418`) pairs them. The state of a pair is carried **only by
`'dimmed'`** — `leftState` / `rightState` at `:517-519`. Look at what `dimmed` means in
`AnswerCell.tsx:31`: `opacity: 0.38`, same background, same border. It sets **`isSelected = false`**
(`:66`) and it is not passed `disabled` (`:595`, `:608`), so `accessibilityState` reports
`{selected: false, disabled: false}` and the verdict string is empty. **A paired-off cell is
announced identically to an available one.**

Then:
- Re-tapping a paired left `return`s silently (`:399`) — a button that announces as enabled and
  does nothing.
- There is **no way to undo a pair** (`pairs` is append-only; `advance()` is the only reset).
- There is no announcement when a pair is made; the `PAIR EVERY TERM · 1 / 4` counter (`:615`) is a
  plain `<Text>` with no live region.
- The quiz is timed, forward-only ("Each answer locks when you move on — you can't return to a
  question", `:540`), and the question auto-submits the instant the last pair lands (`:411-414`).

So a blind learner reaches a matching question with no way to know which of the four lefts they
have already used, no way to undo a mistake, and no feedback that anything happened. They cannot
complete it except by luck, and the attempt is graded.
**Severity: MAJOR — a graded question type that cannot be answered without sight.**
**Confidence: high.** The minimal fix is one line: pass `disabled={paired}` and fold "paired"
into the label, plus an announcement in `pickMatch`.

## Step 9 · The Final Exam — worse than the quiz, for no reason

`src/screens/exam/FinalExamScreen.tsx`

The exam screen is a near-exact copy of the quiz screen **minus both of its accessibility
affordances**:

| | QuizScreen | FinalExamScreen |
| --- | --- | --- |
| `advance()` announces progress | `:325` yes | `:303-311` **no** |
| "One minute left" | `:341-348` yes | **absent** — grep for `AccessibilityInfo` in the file returns nothing |
| matching paired-state announced | no (Gap B) | no (`:509-511`, identical) |

The Final Exam is the graded capstone that issues the credential, it runs on a hard ten-minute
clock (`:74`), and it voids on two app switches. A screen-reader user gets a silent clock with no
warning and a silent question change. The identical code one directory away has both.
**Severity: MAJOR. Confidence: high** — the two files sit side by side and diverge exactly here.

## Steps 8 & 10 · The results — COMPLETABLE

`src/screens/results/ResultsScreen.tsx` and `src/screens/exam/FinalExamResultScreen.tsx` are
plain `<Text>` throughout, which on iOS are accessibility elements by default. Score, pass mark,
outcome copy, lockout clock and the whole wrong-answer review list
(`ResultsScreen.tsx:187-193`: question, "Your answer: …", "Correct: …") are all readable. Nothing
is colour-only — the score is always amber regardless of outcome. The pass path routes to
`Celebration`, whose summary line carries `accessibilityRole="summary"` +
`accessibilityLiveRegion="polite"` (`src/features/celebration/Celebration.tsx:73-74`) and whose
`<Modal>` sets `accessibilityViewIsModal` (`:82`).

**Two notes, not blockers:**
- On iOS the Celebration's live region does nothing (see the mechanic above); the text is still
  reachable by swipe, so nothing is lost, only the automatic reading.
- In `ResultsScreen`'s scored branch the words "passed" and "not passed" appear **nowhere** —
  the outcome is inferred from the number and from whether the button reads "Retake for Trophy".
  That is a clarity issue for everyone, but it lands hardest on someone assembling the screen one
  element at a time. (Not strictly a11y; flagging once.)

---
---

# JOURNEY 3 — The labs

## Step 11 · A rack lab (Cymatics, EQ) — the fader is BLOCKED on iOS

### `ParamLane` — the brief is right that it is written properly, and wrong that it works

`src/screens/lab/rack/ParamLane.tsx:135-154`. On the page it is exemplary:

```tsx
<View
  style={styles.lane}
  {...pan.panHandlers}
  accessibilityRole="adjustable"
  accessibilityLabel={`${label}: ${readout}`}
  accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100), text: readout }}
  aria-valuemin={0} aria-valuemax={100} aria-valuenow={…} aria-valuetext={readout}
  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
  onAccessibilityAction={…}   // ±0.05 per step
>
```

It has the role, the value, the text form of the value, the web `aria-` twins, real 5 %
increment/decrement actions, and it even announces the double-tap-to-unity gesture
(`:118`, `` `${label} reset to home` ``). Everything you would want.

**It is missing `accessible`, so on iOS none of it exists.**

Verified in the installed RN source, not from memory:
- `node_modules/react-native/ReactCommon/react/renderer/components/view/AccessibilityProps.h:31`
  — `bool accessible{false};`
- `node_modules/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm:397-398`
  — `if (oldViewProps.accessible != newViewProps.accessible) { self.accessibilityElement.isAccessibilityElement = newViewProps.accessible; }`
  — `isAccessibilityElement` is driven by **that prop and nothing else**; `accessibilityRole`
  only feeds `accessibilityTraits` (`:469-472`), which a non-element never exposes.
- `node_modules/react-native/Libraries/Components/View/View.js` — nothing infers `accessible`
  from role or label.

So on iOS VoiceOver skips the lane container and lands on its two child `<Text>`s (the printed
label at `:210` and the readout at `:213`). The user can **read** "LEVEL" and "−6.0 dB" and
**cannot change either**, because the adjust gesture and the increment/decrement actions have no
host element. On Android it works: `BaseViewManager.setAccessibilityLabel` (`:330-334`) sets a
`contentDescription` on the ViewGroup and `ReactAccessibilityDelegate` maps `adjustable` to the
scroll actions, so TalkBack gets the whole thing.

`RackUnit` binds `ParamLane` as **the single shared continuous control of every rack lab** —
its own header comment lists them: *"foundations, digital, EQ, meter, tube, wave, the FX family,
modular, the oscillator family and more"*, and `initialParam` is **required** because
"the module's teaching parameter costs zero taps… the #1 non-negotiable, structural"
(`RackUnit.tsx:47-49`). The teaching interaction of a rack module *is* this fader. On iOS a blind
learner can read the module and cannot perform it.

**Severity: MAJOR** — the paid flagship labs cannot be operated on iOS. **Confidence: high** on
the mechanism (read in the native source); **the one-line fix is `accessible` on line 135.**

### The codebase already knows this — which is why it reads as an oversight, not a policy

I audited all 15 `accessibilityRole="adjustable"` sites. **Nine set `accessible`, four do not:**

| Sets `accessible` | Does **not** |
| --- | --- |
| `SpectrumColorPicker.tsx:155`, `:184` | **`screens/lab/rack/ParamLane.tsx:139`** ← every rack lab |
| `screens/lab/amp/kit.tsx:230` | `components/JogWheel.tsx:678` (Dashboard topic wheel) |
| `screens/lab/eq/modules/eqBits.tsx:107` | `screens/lab/HarmonicStems.tsx:552` (phase track) |
| `screens/lab/foundations/bits.tsx:248` | `screens/tools/SplMeterScreen.tsx:523` (brightness / red night mode) |
| `screens/lab/kit/gear.tsx:263`, `:421` | |
| `screens/lab/tuning/chapters/ch4Harmonics.tsx:155`, `ch9Meantone.tsx:221` | |
| `screens/lab/tuning/components/dragRail.tsx:112` | |

`src/components/LedMeter.tsx:69-81` makes the point better than I can — it builds its a11y props
object and the **first key is `accessible: true`**, with a comment explaining the opt-in. The
convention exists; four controls missed it, and one of those four is the one every rack lab
shares.

`SplMeterScreen.tsx:523` is worth calling out separately: besides missing `accessible` it has
**no `accessibilityValue` and no `accessibilityActions`** — so even once exposed there would be
no way to operate it. Its children are two unlabelled `<View>`s, so **nothing at all** about the
brightness / red-night-mode control reaches a screen reader today. That control exists for
low-vision and low-light use.

### What the rack gets right

Do not lose this in the above. `BezelReadouts.tsx:34-35` composes `"${k}: ${v}"` per readout with
a long-press hint, and the `DockButton` `a11y` strings in `RackUnit.tsx:225-259` are complete
sentences — `"ROOM WIDTH: 8.4 m. Tap to adjust on the fader."`, `"${label}: on/off. Tap to
toggle."`. **The bezel is the answer to "does the learner know what the visualisation is
showing"**, and it is a good answer: the stage's numbers are printed as text, not only drawn.
`src/screens/lab/cymatics/vizPlate.tsx:564-565` goes further and describes its own canvas
("Plate display, section view, response 62 percent, drag on the plate to move the slice") **with
`accessible` set** — that is the pattern the other visualisations should follow.

### What the rack does not describe

`src/features/lab/fxViz.tsx` — `ResponseCurveGraph` (`:210-245`), the EQ Lab's curve, has no
accessibility props at all. It is `react-native-svg`, whose nodes set
`isAccessibilityElement` from `accessible` too
(`node_modules/react-native-svg/apple/Utils/RNSVGFabricConversions.h:104`), so the curve is simply
absent from the tree rather than noisy — which is the better of the two failure modes, but it
means the EQ Lab's central object is unreadable. The bezel carries `LVL`, `BAND` and `RESULT`
(`FindFrequency.tsx:214-226`), which is enough to *play* the game but not to *see* the curve.

**Also: zero announcements in Cymatics, EQ, digital or foundations.** All 73
`announceForAccessibility` sites are concentrated in the cable, cable-install, connector-select,
mixing and tuning labs (which are genuinely good — `cableinstall/scenes/RackScene.tsx`,
`connectorselect/pagesC.tsx` and `mixing/pagesAdvD.tsx` narrate their state properly). The two
flagship rack labs have none.

## Step 12 · A paged lab — COMPLETABLE WITH DIFFICULTY

`src/screens/lab/kit/PagedLab.tsx`

Labelling is thorough: the page-list toggle carries progress
(`:175`, `"Page list. 3 of 9 complete. Collapsed"`), each row says which page it is and whether
it is current and complete (`:185`), BACK is `accessibilityState.disabled` on page 0 (`:216`),
and the FINISH button's label distinguishes the three states including
`"Finish the lab — complete this page first"` (`:235`). The shell also draws `<AccuracyNote/>`
for every lab built on it (`:207`), which is the standing rule kept structurally.

**The gap is the same one as everywhere else:** `goTo` (`:112-118`) sets the page, scrolls to
top, persists — and says nothing. Press CONTINUE and focus stays on the CONTINUE button while the
entire body of the screen is replaced. One `announceForAccessibility` with the new page title, or
`setAccessibilityFocus` on the page heading, closes it.
**Severity: MINOR** (the content is one swipe-to-top away and the page list gives an explicit
map). **Confidence: high.**

---
---

# JOURNEY 4 — A measurement tool

## Step 13 · COMPLETABLE — and the live-region fear is unfounded

**Can a meter be read without sight? On the three that matter, yes.**

- **SPL** (`src/screens/tools/SplMeterScreen.tsx`): the big readout is a `Pressable` whose label
  is the live value plus the honesty line —
  `` accessibilityLabel={`${bigText} ${readoutHonesty}. Tap to open the readout full screen.`} ``
  (`:1445`). PEAK (`:1384`) and PEAK HOLD (`:1403`) likewise, each including `", clipping"` when
  it clips. Start/stop says which it will do (`:1418`).
- **RTA** (`src/screens/tools/RtaScreen.tsx:384`): `spectrumA11yLabel(bands)` (`:303-317`)
  composes *"Real-time spectrum, 61 bands. Loudest band 1.2 kilohertz at −34 dB"* — a genuine
  textual rendering of a graph, with `accessible` correctly set. **This is the best single piece
  of accessibility work in the app** and it should be the template for the Spectrogram and the EQ
  curve.
- **Tuner** (`CenterLockTuner.tsx`): `magnitudeColor` encodes error size only; direction rides in
  `directionText` and in `aria-valuetext` ("12 cents sharp"); the lock announcement is latched to
  `justConfirmed` (`:632-634`), so it fires once per note, not per frame. `:935-936` deliberately
  chooses `progressbar` over `adjustable` *because the meter is read-only* — a considered call.
- **RT60** (`Rt60Screen.tsx`): all results are ordinary `<Text>` (`:422-478`), so the broadband
  figure, the fit method, R² and the whole per-band table are readable.

**Does the live region make the screen unusable? No.** There are only 4 `accessibilityLiveRegion`
sites across all of `src/screens/tools/`, and each is bucketed rather than frame-rate:
`CenterLockTuner.tsx:793`/`:912` (six possible direction strings), `SkinnedTunerVu.tsx:511`, and
`SplMeterScreen.tsx:422` (a latched warning set, not the level). Pass 2 found the same and it
still holds. The meters themselves are driven from Reanimated `SharedValue`s on the UI thread
(`SplMeterScreen.tsx:952-953`, `:976-1002`) precisely so they do not re-render React.

**Two real gaps:**

1. **The Spectrogram has nothing to read.** `SpectrogramScreen.tsx` labels its chrome (start,
   stop, freeze, save) but the display itself is a heat map with no summary. A blind user can
   operate the tool and receives no measurement from it. RTA already shows how to fix it
   (dominant band + level). **Severity: MINOR** — it is a member tool with readable siblings, but
   it is the one meter that returns nothing.
2. **The RT60 guided capture is silent.** `rtState` walks 0 → armed → recording → done
   (`:276`) on a 300 ms poll, and the stage copy (`:538`, `:556-560`) changes with it with no
   announcement and no live region. The *guidance* in a guided capture never reaches the learner.
   **Severity: MINOR.**

**One risk I want to name honestly, with only moderate confidence.** `displayMeter` is mirrored
into React state at ~10 Hz (`SplMeterScreen.tsx:975`) and the RTA polls at 12.5 Hz
(`:816-823`), which means the `accessibilityLabel` on those readouts changes 10–15 times a
second. On Android, `View.setContentDescription` fires `TYPE_WINDOW_CONTENT_CHANGED`, and TalkBack
re-speaks the *accessibility-focused* node on that event — so parking TalkBack's focus on the big
SPL number or the RTA spectrum may produce a stuttering, self-interrupting readout. It only
affects the focused element (nothing auto-announces), TalkBack does throttle, and this is not the
"live region announcing every frame" failure the brief asks about — but it is the nearest thing
to it and **it is the one finding in this report I would most want settled on a real Pixel.**

---
---

# JOURNEY 5 — The certificate

## Step 14 · COMPLETABLE — but the failure path is invisible to everyone

**Finding it:** `CredentialWall.tsx:136-137` labels each earned row
`` `${c.name}, ${fmtEarned(c.awardedAt).toLowerCase()}` ``; `TrophyModal` sets
`accessibilityViewIsModal` and — correctly — makes the scrim read the trophy rather than just
"close" (`src/components/TrophyModal.tsx:60-66`, with a comment recording that fix). The DOWNLOAD
action carries a proper busy state (`:79-84`: label swaps to "Working, please wait",
`accessibilityState={{disabled, busy}}` + `aria-busy`). `CredentialDetailModal.tsx` composes real
sentences for the topic counts, the "where these skills apply" list and the careers list
(`:166-167`, `:205-206`, `:222-223`). The wall distinguishes a failed read from an empty one and
offers Retry (`:112-121`). This journey is in good shape.

**The document itself is accessible.** `src/features/credentials/certificateHtml.ts:337-348`
emits `<h1 class="document-heading">`, `<h2 class="holder">`, real `<p>` prose, `lang="en"` on
`<html>` (`:269`), `aria-hidden="true"` on the decorative watermark and frame SVGs (`:323`,
`:326`) and `role="img" aria-label="QR code for the public registry"` on the QR (`:231`). Someone
thought about this. The PDF from `expo-print` will not be a *tagged* PDF, but the text is real
text and the structure is sane.

**The bug: when the download fails, nobody is told — sighted or not.**

`CredentialWall.tsx:82-94`. `download()` is invoked from inside the open `TrophyModal`
(`:175`, `action.onPress`). On failure it calls `setMessage(...)`, and `message` is rendered at
**`:110`** — inside the parent `ScrollView`, *underneath* the modal. `download()` never calls
`setOpen(null)`, and `TrophyModal` is `visible={!!open}`, so the full-screen modal
(`TrophyModal.tsx:56`, `styles.scrim` `flex: 1`, 86 % black) stays up and covers it.

What the user experiences: press DOWNLOAD CERTIFICATE → the button says WORKING… → it says
DOWNLOAD CERTIFICATE again → nothing else, ever. The three messages that were written for this —
*"Certificate download needs the next app build."*, *"No app on this device can open a PDF."*,
*"Could not prepare the certificate. Try again."* — are rendered to a view no one can see.

For a screen-reader user it is doubly lost: `styles.message` is a plain `<Text>` with no
`accessibilityRole="alert"` and no announcement, so even with the modal closed it would not be
spoken. The sibling implementation in `ProfileScreen.tsx:1024` does render its message where it is
visible, but it is the same bare `<Text style={styles.rowHint}>` with no announcement.

**Severity: MAJOR** — this is the terminal reward of the whole product, and its only failure
report is unreachable. **Confidence: high** on the code path (modal visibility is not touched by
`download`, and `message` renders in the covered subtree). The only uncertainty is how often
`exportCertificate` fails in the field.

---
---

# MECHANICS — only where they bear on the above

## M1 · `accessible` is required on iOS, and four adjustable controls plus thirteen diagrams omit it

Covered for the faders in Journey 3. The same mistake silently deletes a second body of work:
**thirteen `<Svg>` roots carry a full prose `accessibilityLabel` and no `accessible`**, all in the
Cable Install lab:

```
cableinstall/scenes/CeilingScene.tsx:473, :662   EmiScene.tsx:278    FireScene.tsx:315
FloorScene.tsx:347, :517, :571, :949             LabelScene.tsx:205, :425
MechScene.tsx:486   SupportsScene.tsx:522        WallsScene.tsx:399
```

`LabelScene.tsx:209-213` is representative, and it is *excellent* writing:

> "Installed system, training visualization: rack R1, patch panel PP2, wall plate and stage box,
> with four cables now carrying label flags at both ends: … Interaction happens in the buttons
> below."

It even tells the user where the controls are. `react-native-svg` gates the node on the same prop
(`apple/Utils/RNSVGFabricConversions.h:104`), the `<Svg>` is returned bare from `SystemArt` with
no `accessible` wrapper at its call site (`:634`), and its children are `RNSVGNode`s which are
also not elements — so on iOS the diagram and its description are both absent. Three other `<Svg>`
roots in the codebase *do* set `accessible`, so again: convention exists, one feature missed it.

Same file, same class: `LabelScene.tsx:347-350` puts the composed row sentence
(`"A-012: Stage Input 12 to R1-PP2-12, …"`) on a bare `<View>`, so on iOS the cable-schedule table
— the thing the exercise asks you to read — is heard as five disconnected cell fragments per row
instead of one sentence.

A broader sweep found 43 `<View>`s with an a11y role or label and no `accessible`. Most are
container roles (`tablist`, `radiogroup`, `list`) where **not** setting `accessible` is correct —
flattening them would be worse. The ones that matter are the leaf controls and descriptions listed
above, plus `directory/directoryBits.tsx:113` (`role="progressbar"`, loading state) and
`components/CoachMark.tsx:21` / `lab/amp/kit.tsx:122` (`role="alert"` with no announcement path at
all — the amp lab's FAULT banner appears in total silence).

**Severity: MAJOR (iOS). Confidence: high** on RN and RNSVG; **one device pass would settle it in
five minutes** and it is worth doing before changing 17 call sites.

## M2 · `accessibilityLiveRegion` is Android-only; 18 files have no iOS path

Verified: **0 hits** for `liveregion` under `node_modules/react-native/React/`; 3 files under
`ReactAndroid/.../uimanager/`. The app uses it at 46 sites in 32 files. 14 of those files also
call `announceForAccessibility` and therefore work on both platforms. **18 do not:**

```
auth/AuthScreen.tsx (6 sites — every sign-in error)      features/celebration/Celebration.tsx
lab/production/ProductionStageScreen.tsx (the "THIS DEVICE COULD NOT SAVE YOUR LAST ANSWER" alert)
features/lab/withMembershipPreview.tsx                   features/intro/AppWelcomeOverlay.tsx
help/HelpScreen.tsx   tools/SkinnedTunerVu.tsx           lab/mixing/pagesA|B|C.tsx
lab/patchbay/{art/JackCutaway,art/PatchPairView,pagesD}.tsx
lab/tuning/{TuningLabScreen,chapters/ch4Harmonics,ch12Tradeoffs}.tsx
lab/cableinstall/scenes/KnowScene.tsx  lab/speech/speechPagesB.tsx
```

The two that matter most are the sign-in errors (Journey 1) and `ProductionStageScreen.tsx:130`,
which is a **data-loss warning** — "what you see here has not been written down" — that iOS
VoiceOver will never speak.

**This also corrects pass 2's finding #12.** Pass 2 flagged the SPL hearing-safety warning as
"announced twice" (polish) because `SplMeterScreen.tsx:409` announces *and* `:422` is an
assertive live region. It is only doubled on Android; on iOS the live region does nothing and the
`announceForAccessibility` is the **only** thing that speaks. **Both are needed.** I'd leave it
alone.

**Severity: MAJOR (systemic, iOS). Confidence: high** — verified in source; RN's own docs also
mark the prop Android-only.

## M3 · Nothing in the app ever moves or claims focus

`grep -rn "setAccessibilityFocus" src/` → **0**. `grep -rn "isScreenReaderEnabled" src/` → **0**
(there are 8 `isReduceMotionEnabled` calls, so the team knows the API surface).

This single absence is the common cause behind Journeys 1, 3, 4, 5, 7, 9 and 12. Everywhere the
app auto-advances, reveals, unmounts a matched pair or swaps a page, the element under the
reader's finger disappears and nothing puts the reader anywhere sensible. It is also why the
auto-advance timers (`FEEDBACK_MS = 950`, `EXPLANATION_MS = 3000`, `HIGHLIGHT_MS`) are hostile:
they are tuned to how long a *sighted* learner needs to register a colour, not to how long a
screen reader needs to speak a sentence. `AccessibilityInfo.isScreenReaderEnabled()` — already
mirrored for reduce-motion in `src/features/settings/a11y.ts` — would let the three study screens
hold the verdict until the learner acts, which is the correct behaviour and a small change.

## M4 · Focus traps: the `<Modal>` gap is known; the **overlay** gap is not, and it sits on the paywall

Pass 2's 8 Community Directory modals are **unchanged** — I re-ran the audit: 70 `<Modal>` tags,
9 missing `accessibilityViewIsModal`, the same 8 plus `features/dev/DevVisualIndex.tsx:270`
(dev-only). Verified, not re-reported. As the brief notes, an RN `<Modal>` is a real Android
`Dialog`, so that gap is iOS-only.

**The unreported gap is the dialogs that are not `<Modal>`s at all.** These are full-screen
`position:'absolute'` `<View>`s rendered as siblings, so they get **no trapping on either
platform**:

| File | What it is |
| --- | --- |
| `features/commercial/UpgradeSheet.tsx:30` | the ACADEMY MODE upsell |
| `features/commercial/StudyAccessSheet.tsx:49` | the locked-topic study upsell (Dashboard) |
| `screens/study/FlashcardsScreen.tsx:1563`, `:1729`, `:1858` | FILTERS, fullscreen guide, glossary popup |
| `screens/glossary/GlossaryScreen.tsx:2830`, `:2963`, `:2995`, `:3036` | card popup, chooser, topic overlays |

`CenterLockTuner.tsx:400` shows the right handling of the same pattern — it sets
`accessibilityViewIsModal` on its own scrim.

**The consequence worth taking seriously is `LabPreviewOverlay`.** `withMembershipPreview` gates
~40 paid lab routes by mounting the live lab and drawing `UpgradeSheet` over it. The design note
is explicit (`features/lab/LabPreviewOverlay.tsx:5-7`):

> "UpgradeSheet is already a full-screen grayed backdrop that **intercepts every touch** … so the
> lab keeps running (readouts, animations, mic) behind it, visible but grayed and
> non-interactive."

That is a **touch** claim. It is not an accessibility-tree claim. With no
`accessibilityViewIsModal` and no `importantForAccessibility="no-hide-descendants"` on the
navigator beneath, a screen-reader user swipes straight past the sheet and **reads the entire
paid lab through the scrim** — its prose, its readouts, its labels. For a teaching lab, the text
*is* most of the product.

Whether they can also **operate** it is platform-dependent and **I am not going to assert it**:
on iOS, VoiceOver's activate on an element with no `accessibilityActivate` synthesises a tap at
the activation point, which the scrim's `Pressable` would still intercept; on Android, TalkBack's
`ACTION_CLICK` reaches `ReactAccessibilityDelegate.performAccessibilityAction`
(`ReactAccessibilityDelegate.kt:220-263`) and, for an element with no declared
`accessibilityActions`, falls through to `View.performClick()` — which is not a touch and would
not be hit-tested against the overlay. **That is the single highest-value thing to check on a
device in this report**, because if activation gets through it is a paid feature reachable free
(BLOCKER), and if it does not it is "the paid content is readable through the paywall" (MAJOR).
The fix is the same either way and is one prop on `UpgradeSheet`'s backdrop.

**Severity: MAJOR, possibly BLOCKER. Confidence: high** that the content is readable through the
scrim; **explicitly uncertain** on activation.

## M5 · Headings, touch targets, colour

- **Headings:** 60 `accessibilityRole="header"` sites — used well in the tools
  (`RtaScreen.tsx:367`, `SpectrogramScreen.tsx:510`) and in `CredentialDetailModal.tsx:159`. The
  study-method screens have none, which is part of why re-finding the card body after a focus
  loss is 14 swipes; a heading on the card would let the user jump by heading.
- **Touch targets:** pass 2's list of 18 sub-44 pt controls is unchanged and correct; I did not
  re-derive it. The two that intersect this journey are `CareerFamilyScreen.tsx:123` (32 pt, no
  `hitSlop`, carries the add-to-study-list tap) and `cymatics/ExperimentWell.tsx:71` (32 pt).
- **Colour-only:** pass 2 searched this properly and came back clean; my own reading agrees, with
  **two additions**: `AnswerCell`'s `dimmed` state is opacity-only and is load-bearing in the quiz
  and exam matching questions (M/Journey 7b above), and Scenarios' correct answer is
  `selectedBlue` rather than `correctGreen`, so it gets neither the ✓ glyph nor the spoken verdict
  (Journey 6). Both are the same root cause — a state that means something being expressed only as
  a colour or an opacity.

---
---

# FONT SCALING — how bad it actually is

**The claim checks out, and the number is 55 files / 378 labels.** `react-native-svg@15.15.4`
contains **zero** references to `fontScale` or `allowFontScaling` anywhere in `src/`, `apple/` or
`android/`. SVG text is laid out in user units scaled by the viewBox, and the OS text-size
setting never enters that calculation. Meanwhile RN `<Text>` scales by default and the app
disables `allowFontScaling` nowhere — which is the good news and also the problem: **the two
halves of every instrument diverge.**

Settings (`SettingsScreen.tsx:543-545`) says:

> "These follow your phone's own accessibility settings and **already apply throughout this
> app** — text here grows with your system text size."

The surrounding comment shows the reasoning (`:529-539`): in-app font chips were removed *because*
RN already scales every `Text`. That is true of `Text`. It is not true of the app's meters and
diagrams, and the claim is stated as unconditional.

## Where it actually hurts

The distribution of SVG label sizes (in viewBox units):

| size | count | | size | count |
| --- | --- | --- | --- | --- |
| 5.5–7.5 | 35 | | 10–12 | 80 |
| 8.0–9.5 | 221 | | 13+ | 22 |

**256 of 378 labels are under 10 units.** These are not scaled *up* by the viewBox either — the
common idiom is a viewBox roughly the width of the phone, so the factor is ≈1. Two worked
examples:

- `features/lab/fxViz.tsx` — `const W = 320` (`:155`), `<Svg width="100%" viewBox="0 0 320 …">`
  (`:245`). On a 375 dp phone with 16 dp gutters the container is ~343 dp, so the factor is
  **≈1.07** and the EQ / compressor / delay axis labels (`fontSize={8}`, at `:292`, `:378`,
  `:383`, `:387`, `:390`, `:415`) render at **≈8.6 dp — permanently.** At iOS AX5 the body copy
  around them goes from 14 pt to roughly 43 pt. The graph's frequency and dB scales stay at 8.6.
- `lab/cableinstall/scenes/LabelScene.tsx` — `viewBox="0 0 360 150"` at `width={w}` (`:205-208`),
  so the factor is **≈0.95**. The cable label flags are `fontSize={6}` (`:265`, `:280`) → **≈5.7
  dp**, and the node names are `fontSize={6.5}` (`:290-302`) → ≈6.2 dp. **The exercise is to read
  the cable label.** At 5.7 dp it is hard for a person with ordinary sight and impossible for the
  user the text-size setting exists for — and turning that setting up does nothing to it.

## The screens that actually become unusable

Ranked by "the number you must read is inside the SVG":

1. **Cable Install lab** — `LabelScene` (5.5), `FireScene` (5.5), `EmiScene` (6.5),
   `RackScene` (6.5), `FloorScene` (7.0, 21 labels). The whole lab's content is drawn labels on
   diagrams. **Unusable at any large text size.**
2. **EQ / FX / compressor / delay plots** — `features/lab/fxViz.tsx` (14 labels from 7.0). The
   frequency and dB axes of the EQ Lab's central object.
3. **De-esser and Speech labs** — `deesser/deEsserViz.tsx` (24 labels from 8.5),
   `speech/speechViz.tsx` (16), `speechPagesA/B.tsx` (21). Spectral plots where the band numbers
   are the lesson.
4. **Patchbay art** — `PatchPairView.tsx` (14 at 9.0), `JackCutaway.tsx` (10 at 9.0),
   `StudioBayView.tsx`. The jack/tip/ring/sleeve callouts are the teaching.
5. **Amp lab modules** — `mod5ClassD` (12 at 8.5), `mod2Devices` (11 at 8.5), `mod1What`,
   `mod6Supply`, `mod7RealWorld` — schematic pin and stage labels.
6. **Tool demos and gauges** — `Rt60Demo` (28 at 9.0), `HzCounterDemo` (13), `SignalGenDemo`
   (11 at 8.5), `RtaDemo` (8), `WaveformDemo` (7), `Spl3dGauge` (11), `SkinnedVu` (6). These are
   the free previews a prospective customer sees first.
7. **Tuning lab** — `primitives`, `harmonicLadder`, `ch6Comma`, `ch11Systems` (all 9.0) — cent
   values on the ladders.

**The live tools are mostly safe**, and that is worth saying: SPL's big number, the tuner's note
and cents, RT60's result table and the Multi-Meter readouts are RN `<Text>` and do scale.
`Rt60Screen.tsx` has 3 SVG labels at 8.0 on the decay curve only; `WaveformScreen.tsx` has 3. So
the *measurement* survives the text-size setting; the *teaching diagrams* do not.

## Second-order damage worth naming

Large text does not only fail to reach the SVG — it actively breaks layouts around it:

- `QuizScreen.tsx:604`, `:611` and `FinalExamScreen.tsx:597`, `:606` cap matching cells at
  `numberOfLines={3}` at `fontSize` 13–14. At AX sizes three lines hold far less text, so a
  graded matching option can be **truncated mid-clause on the exam**. The `accessibilityLabel`
  still carries the full string, so a screen-reader user is fine and a large-text user is not —
  which is exactly backwards from where the care has gone.
- `RackUnit.tsx:137` computes the stage height as `min(STAGE_HEIGHTS[size], max(100, winH - 350))`
  — a **fixed** 350 dp chrome reserve. The comment at `:132-134` records that 300 already
  under-counted it and collapsed the well to 0–40 dp on a 550 dp phone. Every element in that
  reserve (header, bezel, badge, dock labels) is scaling `Text`; at AX5 the reserve is far past
  350 and the scroll well — which holds the lab's prose — goes to zero again.
- `FlashcardsScreen.tsx:1455`, `:1488` use `numberOfLines={1} adjustsFontSizeToFit
  minimumFontScale={0.75}` on the coach hint, which explicitly *undoes* up to 25 % of the user's
  chosen size.

**Severity: MAJOR** — because Settings makes an unconditional promise the app does not keep, on
the exact population the promise is for. **Confidence: high** on the mechanism and the counts;
**moderate** on the exact rendered dp, which depends on each SVG's container width (I worked two
out; the other 53 follow the same idiom).

**The honest short-term fix is the copy**, not 55 files: say that diagram and meter labels are
drawn at a fixed size and pinch-to-zoom / the system Zoom is the way to enlarge them. The real
fix is a shared `useSvgFontScale()` multiplier applied at each `fontSize`, which is mechanical.

---
---

# Verified from earlier passes (no new report)

- **`allowFontScaling` is disabled nowhere** in `src/` — still true, still the single best thing
  about this codebase's accessibility.
- **Modal audit:** 70 `<Modal>`s, 9 without `accessibilityViewIsModal` — the same 8 Community
  Directory sheets plus one dev screen. Unchanged since pass 2.
- **Live regions are not frame-rate.** All 46 sites checked; the tool ones are bucketed or
  latched. Pass 2's conclusion holds.
- **Colour-only information** — pass 2's negative result holds, with the two additions in M5.
- **Sound-safety and audio-output gates** (`features/audio/SoundSafetyWarning.tsx:78`,
  `AudioOutputGate.tsx:228`, `:268`) — real `<Modal>`s, `accessibilityViewIsModal` set, checkbox
  roles with `accessibilityState` + `aria-checked`, buttons labelled. Fully operable blind.
- **`GateHold`** (`withMembershipPreview.tsx:74-79`) — the pass-3 fix landed and it announces.
- **The certificate HTML** is semantically structured with `aria-hidden` on decoration.

# What I could not check, and what would settle it

- **Real screen-reader behaviour on a device.** Four claims turn on it, in priority order:
  (1) whether TalkBack's `ACTION_CLICK` operates the lab **through** the `UpgradeSheet` scrim
  (M4 — this is the one that decides BLOCKER vs MAJOR);
  (2) whether the 10–15 Hz `accessibilityLabel` churn on the SPL / RTA readouts makes TalkBack
  stutter (Journey 4);
  (3) that a bare `<View>` with a role and no `accessible` really is skipped by iOS VoiceOver —
  I read this out of RN's and RNSVG's own source and am confident, but 17 call sites should not
  be changed on a source read alone;
  (4) where iOS VoiceOver focus actually lands after an unmount (I assume "top of screen").
- **Rendered dp for 53 of the 55 SVG files.** I computed two exactly; the rest share the idiom.
- **Whether `exportCertificate` fails often enough for the hidden message to matter** in the
  field. The message being unreachable is certain; the frequency is not.
- **Switch Control, Voice Control and external keyboard.** Out of scope for this pass; the
  tap-to-pair Matching design and the PREV/NEXT additions suggest they would fare better than
  average, and `JogWheel` / `ParamLane` would fare the same as under VoiceOver.
- I ran neither `npx tsc --noEmit` nor `npm test`, having changed no source.

---

# Findings by severity

| # | Severity | Finding | Where |
| --- | --- | --- | --- |
| 1 | MAJOR *(possibly BLOCKER)* | The paid-lab entitlement scrim is not modal for assistive tech — the lab is readable through it, and may be operable | `features/commercial/UpgradeSheet.tsx:30`, `LabPreviewOverlay.tsx` |
| 2 | MAJOR | `ParamLane` omits `accessible`, so **every rack lab's fader is inoperable on iOS** | `screens/lab/rack/ParamLane.tsx:135` |
| 3 | MAJOR | Quiz **and** exam matching questions: paired state is opacity-only, no undo, no announcement — unanswerable without sight, and graded | `QuizScreen.tsx:517-519, 393-418`; `FinalExamScreen.tsx:509-511` |
| 4 | MAJOR | Scenarios announces nothing, and a correct answer is `selectedBlue` so it gets no spoken verdict either — the learner never learns the result | `ScenariosScreen.tsx:481-486, 579-590` |
| 5 | MAJOR | The Final Exam has neither of the quiz's two announcements (progress, one-minute warning) | `FinalExamScreen.tsx:303-311` |
| 6 | MAJOR | Certificate download failure renders **underneath** the still-open modal — invisible to everyone | `CredentialWall.tsx:82-94, 110, 175` |
| 7 | MAJOR | `accessibilityLiveRegion` is Android-only; 18 files have no iOS path, including every sign-in error and the production save-failure alert | `AuthScreen.tsx:438…494`; `ProductionStageScreen.tsx:130`; +16 |
| 8 | MAJOR | Font scaling: 378 SVG labels in 55 files are fixed; Settings promises otherwise; the Cable Install lab is the clearest casualty | `SettingsScreen.tsx:543`; `cableinstall/scenes/*`; `features/lab/fxViz.tsx` |
| 9 | MAJOR | Nothing ever announces or moves focus on auto-advance / reveal / page change — 6 screens | `Flashcards:913,888`; `FillInBlank:404`; `Quiz:325`; `Matching:465`; `PagedLab:112` |
| 10 | MAJOR | Matching gives no cue that the board is two columns ("NO text" is deliberate) | `MatchingScreen.tsx:452-454, 538` |
| 11 | MAJOR | Three in-tree overlays in Flashcards and four in the Glossary trap focus on **neither** platform | `FlashcardsScreen.tsx:1563,1729,1858`; `GlossaryScreen.tsx:2830…3036` |
| 12 | MAJOR *(iOS)* | 13 `<Svg>` diagrams carry full prose descriptions that are dropped for want of `accessible` | `cableinstall/scenes/*` |
| 13 | MINOR | `JogWheel`, `HarmonicStems` phase track and the SPL brightness / night-mode slider: same missing `accessible`; the SPL one also has no value and no actions | `JogWheel.tsx:678`; `HarmonicStems.tsx:552`; `SplMeterScreen.tsx:523` |
| 14 | MINOR | Spectrogram has no readable summary; RT60's guided-capture stages are silent | `SpectrogramScreen.tsx`; `Rt60Screen.tsx:276` |
| 15 | MINOR | Fill-in-the-blank's blank is six underscores, which screen readers do not speak | `FillInBlankScreen.tsx:381` |
| 16 | MINOR | `TextField` announces its label twice | `TextField.tsx:47, 68` |
| 17 | MINOR | The amp lab's FAULT banner and the flashcard CoachMark use `role="alert"` with no announcement path at all | `lab/amp/kit.tsx:122`; `CoachMark.tsx:21` |
| — | note | Pass 2's #12 ("SPL warning announced twice") should be **left alone** — the announce is the iOS path, the live region the Android one | `SplMeterScreen.tsx:409, 422` |
