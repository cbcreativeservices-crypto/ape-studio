# Bug hunt — Pass 5, agent F: the accessibility work list

**Date:** 2026-09-18 · **Branch:** `audio-tools-engine` · **HEAD:** `695caf8d`
**Input:** `docs/bughunt/pass4-a11y-journey.md` (findings accepted, not re-derived).
**Job:** turn that report into an ordered set of exact edits, and settle the parts it left open.
**Method:** source reading + a JSX-tag scanner over all of `src/` (every opening tag with an
a11y prop, prop text parsed brace/quote-aware), plus the installed `react-native@0.86.3`,
`react-native-svg@15.15.4` and `@shopify/react-native-skia` native sources.
**No file was edited except this one.** No build, no `eas`, no git write.

---

## The three things pass 4 left open — all three are now settled

1. **The paid-lab scrim is a BLOCKER, not a MAJOR — on Android.** Decidable from source, and it
   was. TalkBack's double-tap does **not** synthesise a touch; it reaches `Pressability.onClick`
   through `View.performClick()`, which is never hit-tested against the overlay. A free user with
   TalkBack can operate the whole paid lab through the scrim. On iOS it stays MAJOR (readable,
   not operable). Details in **W1**.
2. **`accessible` is missing at 24 sites that lose real content**, not 17 — and the sweep also
   found a class pass 4 did not look at: **RN `<Image>` does not default `accessible` either**
   (`Image.ios.js:170-171`), which silently removes the quiz and exam **question figures** from
   VoiceOver. Full list in **§1**.
3. **Focus is never moved anywhere** — confirmed, 0 hits. But only **four** places actually break
   a task; the rest are cured more cheaply by an announcement. List in **§3**.

---

# ORDERED WORK LIST

Ordered by (harm removed) ÷ (effort). "Effort" is lines touched by someone who already has the
file open. Everything in Tier 1 is under ~15 lines and removes a named, traced harm.

| # | Sev | What | File:line | Lines |
| --- | --- | --- | --- | --- |
| W1 | **BLOCKER** (Android) | Paid lab operable through the upgrade scrim | `withMembershipPreview.tsx:125` | 5 |
| W2 | MAJOR | Every sign-in error is silent on iOS | `AuthScreen.tsx:77` | 4 |
| W3 | MAJOR | Scenarios: a correct answer gets no verdict on any channel | `ScenariosScreen.tsx:481-487, 560` | 10 |
| W4 | MAJOR | Scenarios: nothing is ever announced | `ScenariosScreen.tsx:282, 259` | 8 |
| W5 | MAJOR | Final Exam has neither of the quiz's two announcements | `FinalExamScreen.tsx:310, ~349` | 10 |
| W6 | MAJOR | Quiz + exam matching: paired state is opacity-only, silent, no undo | `QuizScreen.tsx:517-519, 393-418`; `FinalExamScreen.tsx:509-511, 352-…` | 18 ×2 |
| W7 | MAJOR | The save-failure data-loss alert is silent on iOS | `ProductionStageScreen.tsx:130` | 3 |
| W8 | MAJOR (iOS) | 13 `<Svg>` + 2 Skia `<Canvas>` + 2 `<View>` descriptions dropped for want of `accessible` | §1 table A | 17 |
| W9 | MAJOR (iOS) | The quiz/exam question **figure** is not in the a11y tree | `QuizScreen.tsx:546`, `FinalExamScreen.tsx:548` | 2 |
| W10 | MAJOR | Quiz/exam announce the question *number* but never the question | `QuizScreen.tsx:325`, `FinalExamScreen.tsx:310` | 4 |
| W11 | MAJOR | Fill-in-the-blank auto-advance is silent | `FillInBlankScreen.tsx:321-324` | 3 |
| W12 | MAJOR | Flashcards: flip and card change are silent (14 swipes per definition) | `FlashcardsScreen.tsx:879-886, 888-910` | 8 |
| W13 | MAJOR | Focus is never repaired at the 4 places it actually breaks a task | §3 | ~20 |
| W14 | MAJOR | Matching gives no cue that the board has two sides | `MatchingScreen.tsx:451-456, 465, 482` | 6 |
| W15 | MINOR→MAJOR | SPL brightness / red-night-mode slider reaches no screen reader at all | `SplMeterScreen.tsx:494` | 8 |
| W16 | MINOR | 14 more Android-only live regions with no iOS path | §2 table | ~30 |
| W17 | MINOR | `accessible` on 5 remaining leaf controls / summaries | §1 table B | 5 |
| W18 | MINOR | Auto-advance timers are tuned to sighted reading speed | §3.5 | ~10 |

**If only three things get done:** W1, W2, W3. W1 is a paid feature given away; W2 is the front
door; W3 is a graded method that teaches nothing to a blind learner.

---

# W1 · The paid-lab scrim — BLOCKER on Android, MAJOR on iOS

**This is the finding pass 4 declined to assert, and the code decides it.**

`features/lab/LabPreviewOverlay.tsx` is mounted at `App.tsx:513` as a **root sibling of the
navigator**, and renders `UpgradeSheet` (`features/commercial/UpgradeSheet.tsx:30-32`):

```tsx
<View style={styles.backdrop}>                 {/* :31  position:absolute, inset 0, zIndex 10 */}
  <Pressable style={{ flex: 1 }} onPress={onClose} … />   {/* :32 */}
```

**Touch is genuinely blocked.** The backdrop is `position:'absolute'` inset 0 with default
`pointerEvents:'auto'` (`:90-97`), and the `Pressable` fills everything above the sheet. Nothing
gets through by finger. The header comment's claim is correct *for touch*.

**Accessibility activation is a different code path, and it is not blocked.**

- **Android — gets through.** `ReactViewManager.setFocusable` (`:377-390` in the installed RN)
  attaches a real `OnClickListener` to every view with `focusable`, and `Pressable` sets
  `focusable: focusable !== false` (`Pressable.js:258`). TalkBack's double-tap sends
  `ACTION_CLICK`; `ReactAccessibilityDelegate.performAccessibilityAction` (`:220-263`) finds no
  entry in `accessibilityActionsMap` for a component that declared no `accessibilityActions`, so
  it falls through to `super` → `View.performClick()` → `ViewGroupClickEvent` →
  `Pressability.onClick` (`Pressability.js:530-548`) → **`onPress()`**. That path never
  hit-tests. The scrim is irrelevant to it.
- **iOS — does not get through.** `RCTViewComponentView.accessibilityActivate` (`:1601-1609`)
  returns `NO` unless `onAccessibilityTap` is set, which `Pressable` does not set. UIKit then
  synthesises a tap at the element's activation point, which **is** hit-tested, and the scrim's
  `Pressable` takes it.

Nothing hides the lab from either tree: the backdrop has no `accessibilityViewIsModal` (iOS-only
anyway) and no sibling carries `importantForAccessibility="no-hide-descendants"`. So on both
platforms the paid lab's prose, readouts and labels are **readable**, and on Android they are
also **operable** — a paid feature reachable free, which the brief classes as a BLOCKER.

**Confidence: high.** Every link in the chain was read in this repo's `node_modules`.

### The fix — 5 lines, one file

`src/features/lab/withMembershipPreview.tsx:125`. This wrapper already knows exactly when the
lab is behind the scrim (`armedForThis`, `:101`), so hide *that* subtree rather than reasoning
about the root overlay:

```tsx
    if (memberOnly && !resolved) return <GateHold onBack={goBack} />;
    if (gated && !armedForThis) return <GateHold onBack={goBack} />;
    // The scrim is a ROOT SIBLING and cannot trap assistive tech (pass 5, W1):
    // TalkBack's ACTION_CLICK reaches Pressability.onClick via View.performClick()
    // without hit-testing, so the paid lab was operable through the scrim.
    if (armedForThis)
      return (
        <View style={{ flex: 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Screen {...props} />
        </View>
      );
    return <Screen {...props} />;
```

`importantForAccessibility="no-hide-descendants"` removes the descendants from the Android
a11y tree, so TalkBack cannot focus them and therefore cannot `ACTION_CLICK` them.
`accessibilityElementsHidden` does the iOS half.

**Also add, 1 line each, for the same sheet's other call sites** (they cover the Dashboard and
the Ear Lab list, not paid labs, so they are MINOR):
- `features/commercial/UpgradeSheet.tsx:31` — `accessibilityViewIsModal`
- `features/commercial/StudyAccessSheet.tsx:50` — `accessibilityViewIsModal`

**Risk to watch:** the new wrapping `<View style={{flex:1}}>` sits between the navigator's screen
container and the lab root. Every lab root is itself `flex: 1`, so this should be layout-neutral,
but it is the one change in this document that wants a visual smoke test on two labs (one rack,
one paged) before it lands.

---

# W2 · AuthScreen — every sign-in error is silent on iOS

`src/screens/auth/AuthScreen.tsx`. Six live regions, no `announceForAccessibility` anywhere in
the file (`grep` → 0): `:438` and `:482` (error, assertive), `:443` and `:487` (info),
`:449` and `:494` (busy). There are **17** `setError` / `setInfo` call sites (`:183`…`:359`), so
do not patch them individually.

**The fix — 4 lines, at `:77`, right after the state declarations:**

```tsx
  // A11Y (pass 5): accessibilityLiveRegion is ANDROID-ONLY — 0 hits for
  // "liveregion" under node_modules/react-native/React/. On iOS every one of
  // the 17 setError sites rendered in silence: "I pressed Login and nothing
  // happened." One effect per channel covers all of them.
  useEffect(() => { if (error) AccessibilityInfo.announceForAccessibility(error); }, [error]);
  useEffect(() => { if (info) AccessibilityInfo.announceForAccessibility(info); }, [info]);
```

plus `AccessibilityInfo` on the `react-native` import. Keep the existing live regions — on
Android they are the better channel (they do not interrupt); the two are complementary, exactly
as pass 4 argued for the SPL warning.

**Same screen, 1 line, MINOR:** `TextField.tsx:47` renders the visible label as a sibling `<Text>`
and `:68` passes the same string as `accessibilityLabel`, so every field announces twice. Add
`importantForAccessibility="no"` + `accessibilityElementsHidden` to the visible label at `:47`.

---

# W3 · Scenarios — the verdict bug, VERIFIED, and the smallest fix

**Verified exactly as pass 4 described**, and there is a second defect in the same block.

> **Update while this report was being written:** a parallel pass-5 agent has landed the
> **single-choice half** of this fix in the working tree — `ScenariosScreen.tsx:485` now reads
> `feedback?.correct ? 'correctGreen' : 'wrongRed'`. **The other two thirds are still open:**
> multi-select and sequencing still fall out at `:482-483` before `feedback` is ever consulted,
> so they still get no verdict on any channel, and the `disabled` guard at `:560` is unchanged.
> Line numbers below are from `695caf8d` and are now +11 in the working tree.

`src/screens/study/ScenariosScreen.tsx:481-487`:

```tsx
  const cellState = (opt: string): AnswerCellState => {
    if (isSeq)   return sequence.includes(opt) ? 'selectedBlue'   : 'default';   // :482
    if (isMulti) return multiSel.has(opt)      ? 'selectedOrange' : 'default';   // :483
    if (!picked) return 'default';                                               // :484
    if (opt === picked) return feedback?.correct ? 'selectedBlue' : 'wrongRed';  // :485  ← the bug
    return 'dimmed';                                                             // :486
  };
```

`AnswerCell.tsx:63-64` builds its spoken verdict from the state and **only** from
`correctGreen` / `wrongRed`:

```tsx
  const verdict = state === 'correctGreen' ? ', correct' : state === 'wrongRed' ? ', incorrect' : '';
```

and `AnswerCell.tsx:120-124` draws the ✓/✕ glyph on the same two states. So a **correct**
single-choice answer is announced `"…, selected"` with no glyph, while a **wrong** one gets
`", incorrect"` and a ✕. The one outcome that most needs confirming is the only one that gets
none — on the spoken channel *and* the colour-blind channel.

`isSeq` and `isMulti` are tested at `:482-483` **before** `picked`/`feedback`, so after
`confirmMulti` / `confirmSequence` those cells stay `selectedBlue` / `selectedOrange` forever:
no verdict at all, on any channel.

**Second defect, same block, new here.** `:560`:

```tsx
                disabled={!!feedback && !isSeq && !isMulti}
```

`tapStep` guards on `feedback` (`:334`) and `answerSingle` guards on it (`:287`), but the
**multi-select** branch calls `setMultiSel` inline (`:552-557`) with no guard and `disabled`
false. So during the 3-second explanation banner a multi-select learner can still toggle
checkboxes — the display mutates after the answer is recorded, and `accessibilityState` reports
the cell as enabled. It also breaks any per-option verdict that reads `multiSel`.

### The fix — ~10 lines

```tsx
  const cellState = (opt: string): AnswerCellState => {
    // A11Y (pass 5): the verdict must reach AnswerCell as correctGreen/wrongRed
    // — those are the only two states that produce the spoken ", correct" /
    // ", incorrect" and the ✓/✕ glyph (AnswerCell.tsx:63-64, :120). Returning
    // 'selectedBlue' for a CORRECT answer meant the one outcome that most needs
    // confirming was the only one announced as merely "selected".
    if (feedback) {
      if (isSeq)   return sequence.includes(opt) ? (feedback.correct ? 'correctGreen' : 'wrongRed') : 'dimmed';
      if (isMulti) return item.correct.includes(opt) ? 'correctGreen' : multiSel.has(opt) ? 'wrongRed' : 'dimmed';
      if (opt === picked) return feedback.correct ? 'correctGreen' : 'wrongRed';
      return item.correct.includes(opt) ? 'correctGreen' : 'dimmed';
    }
    if (isSeq)   return sequence.includes(opt) ? 'selectedBlue'   : 'default';
    if (isMulti) return multiSel.has(opt)      ? 'selectedOrange' : 'default';
    if (!picked) return 'default';
    return 'dimmed';
  };
```

and at `:560`:

```tsx
                disabled={!!feedback}
```

Note the multi-select branch also surfaces the **missed** correct options as `correctGreen`,
which is what the explanation text assumes the learner can see. One caveat to record: a
multi-select cell passes `check` ≠ `'none'`, so `showCheck` is true and `AnswerCell:120` draws
no ✓/✕ glyph — the spoken verdict lands, the colour-blind channel is the ☑ plus a green/red
border. Acceptable; adding the glyph to the checkbox variant is a separate, larger call.

**Sequence badge, `:537-541`, 2 lines, MINOR.** The badge is a bare `<View>` holding a `<Text>`
of `"1"` or `"·"`, read on iOS as a stray digit element before the option. Hide it
(`accessibilityElementsHidden importantForAccessibility="no-hide-descendants"`) and fold the
position into the cell — which needs one optional prop on `AnswerCell`:
`a11yPrefix?: string` → `accessibilityLabel={`${a11yPrefix ?? ''}${label}${verdict}`}` (`:79`),
called with `a11yPrefix={isSeq ? (sequence.includes(opt) ? `Step ${sequence.indexOf(opt) + 1}: ` : 'Not placed: ') : undefined}`.

---

# W4 · Scenarios — nothing is ever announced

`grep AccessibilityInfo src/screens/study/ScenariosScreen.tsx` → **0**. The banner at `:578-590`
shows `✓ Correct — {explanation}` for `EXPLANATION_MS = 3000` (`:54`) and auto-advances
(`:283`). It has no live region and no announcement; it is wrapped in a `Pressable` with no
label, so on both platforms it is *reachable by swipe* and never *announced* — and it is gone in
three seconds.

### The fix — ~8 lines

`judge`, at `:282` (immediately after `setFeedback`):

```tsx
      setFeedback({ correct, text: item.explanation });
      // A11Y (pass 5): the banner is the ONLY verdict channel on this screen and
      // it disappears after EXPLANATION_MS. The explanation IS the teaching
      // content of the method — FillInBlankScreen:301 already does exactly this.
      AccessibilityInfo.announceForAccessibility(
        `${correct ? 'Correct.' : 'Not quite.'} ${item.explanation}`,
      );
```

`advance`, at `:259` — in the `else setIdx(nextI)` branch:

```tsx
      AccessibilityInfo.announceForAccessibility(
        `Item ${nextI + 1} of ${roundQuestions.length}. ${roundQuestions[nextI].prompt}`,
      );
```

Plus the `AccessibilityInfo` import (the file has none).

**Timing caveat, and it is the honest one:** a 3 s auto-advance will cut off a long explanation
mid-sentence and then talk over it. Do W4 anyway — a truncated verdict beats no verdict — but
this is the screen that most wants **W18** (hold the auto-advance while a screen reader is on).

---

# W5 · The Final Exam is missing both of the quiz's announcements

`grep AccessibilityInfo src/screens/exam/FinalExamScreen.tsx` → **0**. Verified side by side:

| | `QuizScreen.tsx` | `FinalExamScreen.tsx` |
| --- | --- | --- |
| progress announced on advance | `:325` | `:303-311` — **absent** |
| "One minute left" | `:341-348` | **absent** (`msLeft` exists at `:74`, used only at `:534`) |

The exam runs a hard ten-minute clock, voids on two app switches, and issues the credential.

### The fix — ~10 lines, copied verbatim from the quiz

At `FinalExamScreen.tsx:310`, inside the `else`:

```tsx
    else {
      setQIdx((i) => i + 1);
      AccessibilityInfo.announceForAccessibility(`Question ${qIdx + 2} of ${payload.items.length}`);
    }
```

and after the AppState effect (~`:349`), the quiz's latch verbatim:

```tsx
  const minuteWarnedRef = useRef(false);
  useEffect(() => {
    if (msLeft < 60_000 && msLeft > 0 && !minuteWarnedRef.current) {
      minuteWarnedRef.current = true;
      AccessibilityInfo.announceForAccessibility('One minute left');
    }
  }, [msLeft]);
```

Leave the timer `<Text>` at `:534` alone — a plain, non-live clock is the right design, and the
quiz already proved it.

---

# W6 · Quiz and exam MATCHING questions — verified BLOCKED, and the minimum fix

**Verified.** `QuizScreen.tsx:517-519` (identical at `FinalExamScreen.tsx:509-511`):

```tsx
  const leftState  = (i: number): AnswerCellState =>
    pairs.some((p) => p[0] === i) ? 'dimmed' : leftSel === i ? 'selectedBlue' : 'default';
  const rightState = (i: number): AnswerCellState => (pairs.some((p) => p[1] === i) ? 'dimmed' : 'default');
```

`dimmed` in `AnswerCell.tsx:30` is `opacity: 0.38` with the **same** background and border. It
produces `isSelected = false` (`:65`) and an empty `verdict` (`:64`), and the call sites
(`QuizScreen.tsx:594`, `:608`) pass no `disabled`, so `accessibilityState` is
`{selected:false, disabled:false}`. **A paired-off cell announces identically to an untouched
one.** Four confirmations, all traced:

- re-tapping a paired left returns silently — `pickMatch`, `:399` (`if (pairedLeft(idx)) return;`)
  — a control that announces as enabled and does nothing;
- `pairs` is append-only, and `advance()` (`:315-319`) is the only thing that clears it, so
  **there is no undo**;
- nothing announces when a pair is made, and the `PAIR EVERY TERM · 1 / 4` counter (`:614`) is a
  plain `<Text>` with no live region and no announcement;
- the last pair auto-submits the question immediately (`:411-414`), on a timed, forward-only
  attempt (`"Each answer locks when you move on"`, `:540`), and it is graded.

### The fix — ~18 lines, applied identically to both files

**(a) Make "paired" a state, not an opacity.** At `:594` / `:608`, add `disabled` and a prefix.
Using the same optional `a11yPrefix` prop proposed in W3:

```tsx
                    state={leftState(i)}
                    disabled={pairs.some((p) => p[0] === i)}
                    a11yPrefix={pairs.some((p) => p[0] === i) ? 'Paired: ' : undefined}
                    onPress={() => pickMatch('left', i)}
```

`disabled` alone already fixes the worst of it: `AnswerCell:66` folds it into
`accessibilityState.disabled` and `aria-disabled`, so a paired cell stops announcing as an
available button, and the silent no-op becomes an honest disabled control.

**(b) Say what happened.** In `pickMatch`, after `setPairs(nextPairs)` (`:405`):

```tsx
      AccessibilityInfo.announceForAccessibility(
        `Paired ${lefts[leftSel]} with ${rights[idx]}. ${k - nextPairs.length} left.`,
      );
```

(move the `lefts`/`rights`/`k` reads above the `setPairs` call — they are already computed three
lines down at `:406-409`). `MatchingScreen.tsx:356-362` is the working precedent.

**(c) Give it an undo.** Minimum viable: make a **paired left** tappable again and have it break
its own pair, rather than `return`ing. Replace `:399`:

```tsx
      if (pairedLeft(idx)) {
        // A11Y (pass 5): this was a silent no-op on a graded, forward-only,
        // timed question with no other way to correct a mistake.
        setPairs((cur) => cur.filter((p) => p[0] !== idx));
        AccessibilityInfo.announceForAccessibility('Pair removed.');
        return;
      }
```

With (c), (a) must become `a11yPrefix={'Paired — double tap to unpair: '}` and drop `disabled`
on the **left** column only; the right column keeps `disabled`. Decide (a)-only or (a)+(c) as
one call — (a)-only is 4 lines and makes the question *legible*; (c) is 5 more and makes it
*correctable*. On a graded exam I would do both.

**Not a11y, flagged once because it sits in the same lines:** `QuizScreen.tsx:604`/`:611` and
`FinalExamScreen.tsx:597`/`:606` cap matching cells at `numberOfLines={3}` at `fontSize` 13-14.
At iOS AX sizes a graded option truncates mid-clause — and the `accessibilityLabel` carries the
full string, so the screen-reader user is fine and the large-text user is not.

---

# W7 · The production save-failure alert — 3 lines

`src/screens/lab/production/ProductionStageScreen.tsx:130` is a `<View accessibilityRole="alert"
accessibilityLiveRegion="assertive">` carrying *"⚠ THIS DEVICE COULD NOT SAVE YOUR LAST ANSWER.
What you see here has not been written down…"*. On iOS neither prop speaks; the child `<Text>`s
are readable by swipe, so the warning exists but is never raised. It is a **data-loss** warning.

Find where `saveFailed` is set and pair it, or — the one-effect pattern from W2:

```tsx
  useEffect(() => {
    if (saveFailed) AccessibilityInfo.announceForAccessibility(
      'This device could not save your last answer. What you see here has not been written down.',
    );
  }, [saveFailed]);
```

---

# 1 · `accessible` on iOS — the complete sweep

**The mechanic, confirmed in this repo's `node_modules` (not from memory):**

| | |
| --- | --- |
| `ReactCommon/.../view/AccessibilityProps.h:31` | `bool accessible{false};` |
| `React/Fabric/.../RCTViewComponentView.mm:396-398` | `isAccessibilityElement` is set from **that prop and nothing else** |
| `RCTViewComponentView.mm:469-472` | `accessibilityRole` only feeds `accessibilityTraits`, which a non-element never exposes |
| `react-native-svg/apple/Utils/RNSVGFabricConversions.h:104` | `node.isAccessibilityElement = nodeProps.accessible;` |
| `react-native-svg/apple/Elements/RNSVGSvgView.h:20` + `.mm:76,97` | the `<Svg>` **root** is an `RCTViewComponentView` (`RNSVGUIKit.h:17`) and calls `[super updateProps:]` — same rule |
| `@shopify/react-native-skia/apple/SkiaUIView.h:23` | Skia `<Canvas>` is also an `RCTViewComponentView` — same rule |

**Components that DO default `accessible` true, so they are not on the list** (this is what keeps
the list honest — the raw scan returns 1,311 tags, of which 1,183 are these):

| Component | Where | Behaviour |
| --- | --- | --- |
| `Pressable` (1,059 sites) | `Pressable.js:252` | `accessible: accessible !== false` |
| `Text` (84 sites) | `Text.js:145-148` | iOS `accessible !== false`; Android true when it has a press handler |
| `TextInput` (40) | native | element by default |
| In-house wrappers: `Chip`, `RepeatKey`, `ColorWheelButton`, `HeaderTextButton`, `HoldToRemove`, `HoldHintPressable` | each resolves to a `Pressable` (e.g. `LabShell.tsx:139`, `CenterLockTuner.tsx:1018`) | fine |
| `RackUnit` / `LabShell` / `WaveLayout` / `CymaticsRackLayout` | a11y strings live inside `bezel`/`params` config objects | scanner false positives |

**And one component that does NOT, which pass 4 did not check:**

> `Image.ios.js:170-171` — `const accessible = ariaHidden !== true && (props.alt !== undefined ? true : props.accessible);`
> and `RCTImageComponentView.mm:41` sets `self.contentView = _imageView`, so
> `RCTViewComponentView.isAccessibilityElement` (`:1488-1494`) returns the `UIImageView`'s — `NO`.
> **`<Image accessibilityLabel="…">` with no `accessible` and no `alt` is not in the iOS tree.**

## Table A — real losses (17 sites). The description or the control is the only copy there is.

| File:line | What | Why it is a real loss |
| --- | --- | --- |
| `lab/cableinstall/scenes/CeilingScene.tsx:473` | `<Svg>` — above-ceiling cutaway | children are `RNSVGNode`s, also non-elements: **diagram and description both absent on iOS** |
| `…/CeilingScene.tsx:662` | `<Svg>` — finished room | same |
| `…/EmiScene.tsx:278` | `<Svg>` — EMI cross-section | same |
| `…/FireScene.tsx:315` | `<Svg>` — fire-stopping section | same |
| `…/FloorScene.tsx:347` | `<Svg>` — stage plan | same |
| `…/FloorScene.tsx:517` | `<Svg>` — venue plan | same |
| `…/FloorScene.tsx:571` | `<Svg>` — backstage plan | same |
| `…/FloorScene.tsx:949` | `<Svg>` — coil, N of 6 loops | same |
| `…/LabelScene.tsx:205` | `<Svg>` — installed system w/ label flags | the label is the best prose in the app; **the exercise is to read the cable label** |
| `…/LabelScene.tsx:425` | `<Svg>` — service loop | same |
| `…/MechScene.tsx:486` | `<Svg>` — tension meter vs. spec limit | a numeric readout that exists nowhere else |
| `…/SupportsScene.tsx:522` | `<Svg>` — 12-unit span, sag state | same |
| `…/WallsScene.tsx:399` | `<Svg>` — room elevation, routes A/B/C | same |
| `…/introSceneArt.tsx:162` | Skia `<Canvas>` — installation scene | same class |
| `…/cableArt.tsx:1217` | Skia `<Canvas>` (`CiArtCanvas`, 10 call sites in `CableArtPreview.tsx`) | one fix covers all 10 |
| `lab/cableinstall/scenes/RouteScene.tsx:473` | `<View accessibilityRole="image">` + `MAP_A11Y[…]` prose | children are the map art — **nothing** reaches iOS |
| `lab/HarmonographViewer.tsx:231` | `<View accessibilityLabel="Harmonograph drawing">` | children are the drawing |

**Fix: add `accessible` to each.** For the three `<Svg>` roots that already do it —
`patchbay/art/PatchPairView.tsx:267`, `patchbay/art/StudioBayView.tsx:51`,
`cableinstall/scenes/InspectScene.tsx:319` — the convention is already in the codebase; 13 missed
it. `src/components/LedMeter.tsx:69-81` makes the same point, with `accessible: true` as the
first key of its props object and a comment explaining the opt-in.

**Plus W9, same class, higher stakes:** `QuizScreen.tsx:546` and `FinalExamScreen.tsx:548` —
`<Image … accessibilityRole="image" accessibilityLabel="Figure for this question" />`. On iOS the
learner is not told a figure exists on a **graded** question. Add `accessible`. (The other 13
`<Image>` sites in the sweep — glossary illustrations `GlossaryScreen.tsx:2715, 2898, 3085`,
flashcard art `FlashcardsScreen.tsx:1442, 1676, 1712`, lab photos `labPhoto.tsx:55, 109`,
`micArt.tsx:309, 359`, `connectorCard.tsx:97`, `ProfileScreen.tsx:1129`,
`CredentialWall.tsx:180`, `MultiMeterScreen.tsx:1633`, `ScenariosScreen.tsx:522` — are the same
one-word fix and belong in the same sweep, at MINOR.)

## Table B — worth fixing, lower stakes (5 sites)

| File:line | What | Note |
| --- | --- | --- |
| `screens/tools/SplMeterScreen.tsx:494` | brightness / red-night-mode slider | **W15** — worst of the five, see below |
| `components/JogWheel.tsx:675` | Dashboard topic wheel, `adjustable` + actions | MINOR only because `DashboardScreen.tsx:1580,1589` provide explicit Previous/Next topic buttons |
| `screens/lab/HarmonicStems.tsx:548` | phase track, `adjustable` + increment/decrement | no alternate path; MINOR only because the lab is not gate-bearing |
| `screens/directory/directoryBits.tsx:113` | `role="progressbar"` loading state | the "still loading" signal |
| `screens/lab/amp/kit.tsx:122` | `FaultBanner`, `role="alert"` | children **are** `<Text>` (`:123-128`), so the copy is readable by swipe; what is lost is the alert semantic and any announcement — the real fix is an `announceForAccessibility` when `primary` changes, not `accessible` |

`components/CoachMark.tsx:21` is the same shape (`Animated.View`, `role="alert"`,
`pointerEvents="none"`) and wants the same announcement treatment, not `accessible`.

## Table C — leave alone. Setting `accessible` here would make things WORSE.

Flattening a container swallows its focusable children. These are correct as written:

- **`tablist`** — `tooldemos/{HzCounterDemo:877, Rt60Demo:444, RtaDemo:619, SignalGenDemo:344,
  SpectrogramDemo:741, SplDemo:822, WaveformDemo:787}`, `awards/AwardsScreen:747`,
  `directory/AudioCommunityDirectoryScreen:68`, `enrollment/EnrollmentScreen:1267`,
  `lab/amp/kit:322`, `lab/LabShell:337`, `lab/tube/TubeCardScreen:436`,
  `lab/tuning/components/tuningKeyboard:16`
- **`radiogroup`** — `careerfinder/CareerFinderQuizScreen:130`, `CareerFinderResultsScreen:209`
- **`list`** — `lab/connectorselect/bits:51`, `lab/mixing/kit:169`, `lab/patchbay/bits:52`
- **`summary` / composed row labels whose children are already `<Text>`** —
  `features/celebration/Celebration:71`, `features/lab/FundamentalsCreditBanner:15`,
  `features/study/SessionTimer:123`, `lab/patchbay/pagesB:105`,
  `lab/cableinstall/{bits:208, CableInstallLabScreen:530, scenes/FloorScene:652,
  scenes/RouteScene:564, scenes/LabelScene:348, scenes/EmiScene:655, scenes/FloorScene:1178}`.
  These degrade on iOS from *one sentence* to *several fragments* — annoying, not lost. If you
  want the sentence, the correct edit is `accessible` **plus** hiding the children, which is a
  bigger change than it looks; do it only for `LabelScene:348` (the cable-schedule table, which
  the exercise asks you to read).
- **`CableInstallLabScreen:286`** (`dotsRow`, `"3 of 9 units complete"`) — children are
  `Pressable` step dots. Setting `accessible` would destroy nine controls to gain one sentence.
  Move the sentence to a sibling `<Text>` instead.
- **`ToolsHubScreen:390, 394, 403`** — decorative tile art inside a `Pressable` tile. iOS
  dropping them is the *better* failure mode; if anything, hide them on Android too.
- **`features/credentials/certificateHtml.ts:231, 263`** — that is HTML with `role`/`aria-label`,
  not RN. Correct as written.

---

# 2 · `accessibilityLiveRegion` — 18 files, 23 sites, no iOS path

**Re-verified:** `grep -rni liveregion node_modules/react-native/React/` → **0**. 46 sites in 32
files; 14 files also call `announceForAccessibility` and are fine. The 18 below are the gap,
ranked by consequence. **The standard fix is the W2 pattern** — one `useEffect` on the state the
live region is rendering. **Keep the live region**: on Android it is the better channel because
it does not interrupt.

| Rank | File:line | What it says | iOS equivalent, and the moment |
| --- | --- | --- | --- |
| 1 | `auth/AuthScreen.tsx:438,443,449,482,487,494` | every sign-in / sign-up / reset error and info | **W2** — `useEffect` on `error` and on `info` at `:77` |
| 2 | `lab/production/ProductionStageScreen.tsx:130` | "THIS DEVICE COULD NOT SAVE YOUR LAST ANSWER" | **W7** — `useEffect` on `saveFailed` |
| 3 | `features/celebration/Celebration.tsx:74` | the credential/achievement summary — the terminal reward | announce `body` in the effect that opens the modal. **Check `useOverlaysSuppressed` first** — Low-Light Production Mode says nothing may auto-appear, and a spoken announcement is an appearance |
| 4 | `help/HelpScreen.tsx:95` | "Nothing in the manual matches '…'" | debounced `useEffect` on `results.length === 0 && query` — announcing per keystroke would be worse than silence |
| 5 | `lab/patchbay/art/JackCutaway.tsx:128` | "CONTACTS OPEN — NORMAL BROKEN" | `useEffect` on the `open` boolean — a two-state transition, safe to announce |
| 6 | `lab/patchbay/art/PatchPairView.tsx:379` | the patch-flow status line | `useEffect` on `status` (a bucketed string) |
| 7 | `lab/patchbay/pagesD.tsx:196` | "✓ / △ {verdict.note}" | `useEffect` on `verdict` — a graded verdict, announce it |
| 8 | `lab/mixing/pagesC.tsx:305` | "REVERB (post): SILENT · HEADPHONES (pre): receiving" | `useEffect` on `[verbGain > 0, cueGain > 0]` — booleans, not the gains |
| 9 | `lab/mixing/pagesB.tsx:187` | the risk line for a bad pan/mute | `useEffect` on `badRisks.map(r => r.risk).join()` |
| 10 | `lab/mixing/pagesA.tsx:172` | the signal path built so far | `useEffect` on `placed.length` — announce the newly added station, not the whole chain |
| 11 | `lab/tuning/chapters/ch4Harmonics.tsx:122` | cents / ratio readout, driven by a slider | **do NOT announce on every change.** `useEffect` on the `aligned` boolean only — announce "Just major third, aligned" on the transition |
| 12 | `lab/tuning/TuningLabScreen.tsx:156` | "Rendering: … / ♪ … / Sound: stopped" | `useEffect` on `[status.rendering, status.playing]` |
| 13 | `lab/tuning/chapters/ch12Tradeoffs.tsx:75` | "N of 7 corrections opened" | `useEffect` on `opened.size` |
| 14 | `lab/speech/speechPagesB.tsx:275` | "N of 7 correct · page complete" | `useEffect` on `n` |
| 15 | `lab/cableinstall/scenes/KnowScene.tsx:310` | "N of M reviewed" | `useEffect` on `viewed.size` |
| 16 | `features/lab/withMembershipPreview.tsx:70` | "Checking your membership…" / "Still checking…" | low value — it is the only content on the screen, so both readers read it on arrival. Announce only the `slow` transition, if at all |
| 17 | `features/intro/AppWelcomeOverlay.tsx:67` | "ONE MOMENT…" | skip. Cosmetic, and it is an auto-appearing overlay — Low-Light rules apply |
| 18 | `tools/SkinnedTunerVu.tsx:511` | live note + cents | **leave alone, deliberately.** It already sets `accessible` (`:509`) with a full composed label (`:512`), so iOS users read it on demand. Adding `announceForAccessibility` here would produce the frame-rate interruption the app has carefully avoided everywhere else |

**Also re-confirming pass 4's correction to pass 2:** `SplMeterScreen.tsx:409` (announce) and
`:422` (assertive live region) are **not** a duplicate. On iOS the announce is the only channel;
on Android the live region is. **Leave both.**

---

# 3 · Focus management — the four places it actually breaks a task

`grep -rn "setAccessibilityFocus" src/` → **0**. `grep -rn "isScreenReaderEnabled" src/` → **0**
(against 8 `isReduceMotionEnabled` calls, so the API surface is known).

**API note before anyone writes this.** `AccessibilityInfo.setAccessibilityFocus(reactTag)`
(`AccessibilityInfo.js:450-452`) goes through `legacySendAccessibilityEvent` and needs
`findNodeHandle`. On Fabric (RN 0.86) prefer the ref form:
`AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus')`. The target must itself be an
accessibility element — a `<Text>` qualifies on iOS automatically; a `<View>` needs `accessible`.

Everywhere the app unmounts something under the reader's finger, an **announcement** is the
cheaper cure and it is what W3–W5 and W10–W12 buy. Focus movement is only worth the ref plumbing
where the user is left *standing somewhere actively wrong*:

### 3.1 · Quiz / exam auto-advance — focus lands inside a question never heard

`QuizScreen.tsx:315-326`, `FinalExamScreen.tsx:303-311`. `recordAndAdvance` (`:350-359` /
`:313-…`) fires `advance` after `HIGHLIGHT_MS`; the whole body swaps and VoiceOver focus stays on
the `AnswerCell` *index* the learner last activated — which is now a different question's option.
They are standing in the middle of question 4's answers having never heard question 4.

**Where the call belongs:** a `questionRef` on the `<Text style={styles.questionText}>`
(`QuizScreen.tsx:558`, `FinalExamScreen.tsx:~560`), and in `advance`'s `else` branch, after
`setQIdx`, inside a `requestAnimationFrame` so the new text has mounted:

```tsx
      setQIdx((i) => i + 1);
      requestAnimationFrame(() => {
        if (questionRef.current) AccessibilityInfo.sendAccessibilityEvent(questionRef.current, 'focus');
      });
```

This **replaces** W10's announcement (focus speaks the element), so do one or the other.
Announcement is 2 lines and focus is 6; on the exam I would spend the 6.

### 3.2 · Fill in the Blank auto-advance — same shape, 950 ms

`FillInBlankScreen.tsx:318-324`. `answer()` announces the verdict correctly at `:301` and then
`setQIdx(i => i + 1)` at `:323` says nothing at all: the sentence changes, four cells change,
focus stays on a grid position. The sibling `QuizScreen` solved this one directory away.
Same fix, or the 3-line announcement:

```tsx
        setQIdx((i) => i + 1);
        // A11Y (pass 5): the verdict is announced at :301 and then the whole
        // question silently changes underneath the reader's finger.
        AccessibilityInfo.announceForAccessibility('Next question.');
```

— and better, announce the new sentence once it is computed.

### 3.3 · Flashcards — the flip destroys the user's place, 14 swipes per card

`FlashcardsScreen.tsx:879-886`. `reveal()` switches the render from the `level === 0` branch to
`level > 0`, which **does not render the term `<Text>` at all** (`:1466-1470`, deliberately). The
element the user was touching unmounts; between the top of the screen and the definition sit the
header, the counter, the session pill and **thirteen filter controls** (`:1244-1320`). `goCard`
(`:888-910`) changes `idx`, resets `level`, and says nothing.

**Announcement is the right fix here, not focus** — the definition is what they want, and it is
one string:

```tsx
  const reveal = useCallback((pos: 'first' | 'last' = 'first') => {
    …
    AccessibilityInfo.announceForAccessibility(revealedText);   // the section just shown
```

and in `goCard`, after `setIdx`:

```tsx
      AccessibilityInfo.announceForAccessibility(`${nextCard.term}. Card ${nextIdx + 1} of ${deck.length}.`);
```

**Plus one structural line that pays for itself:** give the card body
`accessibilityRole="header"`. The study-method screens have **zero** of the app's 60 `header`
roles, and a heading is what makes "jump back to the card" one gesture instead of fourteen.

### 3.4 · Matching — the cell you just activated is filtered out

`MatchingScreen.tsx:465` and `:482` (`.filter(({ it }) => !locked.has(it.id) || correctFlash === it.id)`)
drop the matched pair from both columns after `CORRECT_FLASH_MS` (`:55`). The existing
`"Matched. N pairs left."` announcement (`:356-362`) softens it, and the verdict **does** ride
the label here (`rightState` returns real `correctGreen`/`wrongRed`, `:444-448`) — so this is the
one of the four where the announcement already exists and focus repair is genuinely optional.
Put it last.

### 3.5 · W18 — the auto-advance timers are tuned to sighted reading speed

`EXPLANATION_MS = 3000` (Scenarios), `FEEDBACK_MS = 950` (Fill in the Blank), `HIGHLIGHT_MS`
(quiz/exam). These are how long a sighted learner needs to register a colour, not how long a
screen reader needs to speak a sentence — and in Scenarios the sentence is the whole lesson.

`src/features/settings/a11y.ts` already has exactly the right shape for this: a module-level
mirror of an OS flag, seeded once and kept current by an event
(`:60-72`, `osReduceMotion`). Add the twin, ~12 lines:

```ts
let osScreenReader = false;
void AccessibilityInfo.isScreenReaderEnabled?.()
  .then((v) => { osScreenReader = !!v; listeners.forEach((l) => l()); })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('screenReaderChanged', (v: boolean) => {
  osScreenReader = !!v; listeners.forEach((l) => l());
});
/** True when VoiceOver/TalkBack is on — study screens hold their auto-advance. */
export function screenReaderOn(): boolean { return osScreenReader; }
```

Then in `ScenariosScreen.tsx:283`, `FillInBlankScreen.tsx:321` and the quiz/exam
`recordAndAdvance`: `screenReaderOn() ? /* wait for the learner */ : setTimeout(advance, MS)`.
Scenarios already has the manual path — its banner is a `Pressable onPress={advance}` (`:578`).
Fill in the Blank and the quiz would need one CONTINUE affordance each, which is why this is
last rather than first, despite being the single change that most improves the three study
methods.

---

# 4 · Matching — the two-column structure (W14)

`MatchingScreen.tsx:451-456`: the only signal that the board has two sides is two decorative
tinted `<View>` bars, and the comment at `:538-539` records that the *absence* of text is a
ratified design decision (Booth 2026-07-08 rev 2). `matchingSentenceV2` (`:266`) is written
deliberately **not** to contain the term, so the split cannot be inferred from the content
either. A screen reader reads N clue sentences then N terms as one flat list.

**Minimum fix that does not touch the visual design** — two visually-hidden headers, one per
column, at `:465` and `:482`:

```tsx
      <View style={styles.column}>
        <Text style={styles.srOnly} accessibilityRole="header">Clues — pick one, then pick its term</Text>
```

If a hidden `<Text>` is unwelcome, the alternative is an `accessibilityHint` on each cell
("Clue. Double tap, then choose a term on the right"), which costs nothing visually and is what
`AnswerCell` would need an extra prop for anyway (the same `a11yPrefix`/hint prop as W3 and W6 —
**three findings share one small `AnswerCell` change, which is the best effort ratio in this
document**).

---

# 5 · W15 · The SPL brightness / red-night-mode slider

`src/screens/tools/SplMeterScreen.tsx:494-524`. Verified — this one is worse than the other
`adjustable` sites and worse than pass 4 stated:

```tsx
    <View
      style={styles.brightTrack}
      … onResponderGrant / onResponderMove / onResponderRelease …
      accessibilityRole="adjustable"                                  // :523
      accessibilityLabel="Screen brightness — slide left to dim, far left for red night mode"
    >
      <View style={styles.brightBase} />
      <View style={[styles.brightThumb, { left: thumbLeft }]} />
    </View>
```

No `accessible`, **no `accessibilityValue`, no `accessibilityActions`, no
`onAccessibilityAction`**, and both children are unlabelled `<View>`s. So:

- **iOS:** the container is not an element and the children have no text — **nothing at all**
  about this control reaches VoiceOver.
- **Android:** `contentDescription` is set so TalkBack can *find* it, and `adjustable` adds the
  scroll actions — but with no `accessibilityActions` declared,
  `ReactAccessibilityDelegate.performAccessibilityAction` (`:220-263`) finds nothing in
  `accessibilityActionsMap` and falls through to `super`, where the scroll does nothing.
  **Readable, inoperable.**

This is the control that exists **for low-vision and low-light use**. Fix it the way `ParamLane`
was just fixed (`ParamLane.tsx:135-160` is now the house pattern, comment and all):
`accessible`, `accessibilityValue={{min:0, max:100, now: Math.round(pos*100), text: …}}`, the
`aria-` twins, `accessibilityActions={[{name:'increment'},{name:'decrement'}]}` and an
`onAccessibilityAction` that steps `onCommit` by ±0.05.

---

# Verified from pass 4, no change needed

- **`ParamLane` is fixed** — `screens/lab/rack/ParamLane.tsx:148` now sets `accessible`, with a
  comment recording why. Every rack lab's fader is operable on iOS again. The comment is good
  enough to be the template for Table A.
- **18 live-region files with no iOS path** — exact, re-derived independently.
- **0 `setAccessibilityFocus`, 0 `isScreenReaderEnabled`** — exact.
- **`AnswerCell`'s `dimmed` is opacity-only** (`AnswerCell.tsx:30`) and load-bearing in the quiz
  and exam — exact.
- **The Scenarios `cellState` bug** — exact, and it has a companion (the missing `feedback` guard
  at `:560`).
- **13 `<Svg>` roots without `accessible`, 3 with** — exact counts.

# What I could not settle from source, and what would

1. **Whether TalkBack can *focus* a node behind the scrim at all.** The activation chain (W1) is
   certain; Android's occlusion handling is the one link I am inferring. `AccessibilityNodeInfo`
   visibility is computed from `getGlobalVisibleRect`, which does not consider sibling overlap,
   and the app's own scrim is `rgba(0,0,0,0.6)` — not opaque — so I expect the nodes to be
   exposed. **Five minutes with TalkBack on a paid lab settles W1's severity.** The fix is the
   same either way, and it is 5 lines, so I would land it regardless.
2. **Where iOS VoiceOver focus actually lands after an unmount.** I assume top of screen; §3
   is written so that the announcements help regardless.
3. **The 10-15 Hz `accessibilityLabel` churn** on the SPL/RTA readouts (pass 4, Journey 4) — still
   the thing I would most want on a real Pixel. Unchanged by anything here.
4. I ran neither `npx tsc --noEmit` nor `npm test`, having changed no source.
