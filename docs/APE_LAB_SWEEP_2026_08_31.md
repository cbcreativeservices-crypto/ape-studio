# Lab sweep — 2026-08-31

**Pro Audio Training Academy** · methodical pass over every lab screen and module.
Owner-approved run. Each lab is opened in the running app on web, driven through
its controls, screenshotted, and checked against the house standards.

---

## No source change was needed to reach the member labs

`DEV_BYPASS.bypassAcademyLocks` was flipped to `true` at the start of this run
and **flipped straight back to `false`** on discovering it is the wrong lever:
`EntitlementProvider` computes `isMember` as `entitlement === 'academy'` and
comments that it is *"deliberately NOT"* affected by that bypass. The owner's
2026-08-06 setting is therefore untouched.

The member labs are instead reached the way the app already provides for:
**long-press the "Pro Audio Training Academy" wordmark on Home**, which cycles
the mock entitlement (anonymous → free → academy → lapsed). That is runtime
state only — nothing is written to the repo, and it resets on sign-in/out.

## What this sweep can and cannot see

**Covered:** what renders, whether controls respond and update their readouts,
console and network errors, layout at phone width, accessibility labels and
roles, touch-target sizes, honesty badges, and the house rules (amplitude ramp,
no fake meters, dock blurbs, low-light, keyboard escape).

**Not covered — needs the owner's ears and a phone:** anything audible (mic
input, tone output, DSP correctness), haptics, orientation, native modules,
device performance, and fine visual judgement inside Skia canvases.

---

## Findings

Severity: **BUG** (wrong or broken) · **RISK** (works, but violates a standing
rule) · **NOTE** (suggestion / polish).

### Pre-flight

**BUG · Audio Learning card — a button inside a button.**
`CourseCardView` wraps the whole card in a `Pressable` and puts the "OPEN LAB"
`Pressable` inside it. On web React logs *"In HTML, <button> cannot be a
descendant of <button> … this will cause a hydration error"*. On device it is a
touch target nested in a touch target: the outer press fires wherever the inner
one is missed, and a screen reader announces a button inside a button. Found
before the sweep proper, on the way into Audio Fundamentals.

### Two findings RETRACTED — they were the harness, not the app

My first tap helper searched the whole document with `querySelectorAll`. React
Navigation keeps earlier screens **mounted underneath**, so on the Audio
Fundamentals list there were **31 elements matching "OPEN" but only 1 visible** —
and the helper clicked a hidden Home-screen one, which opened the *topics*
sign-up gate. That produced two confident, wrong findings:

- ~~"A lab labelled FREE cannot be opened"~~ — **wrong.** Re-tested with a
  visibility-scoped tap: *Understanding Level & Amplitude* opens for a guest,
  immediately, with zero console errors.
- ~~"The sign-up gate names the wrong things"~~ — **wrong.** That gate belongs
  to the course list and never fired from the lab list at all.

The harness now scopes every tap to elements that are visible and topmost
(`document.elementFromPoint` under the centre). Recorded here because the same
trap would have poisoned all 110 units.

### FIXED · A button inside a button (every course/lab card)

**Real, and confirmed by React itself** rather than by my clicking. Card bodies
were wrapped in a `Pressable` carrying `accessibilityRole="button"` plus a
label, while the visible key inside (`OPEN LAB`, `INCLUDED FREE`,
`🔒 ACADEMY MODE`, …) is its own `Pressable`. Two consequences:

- On web, react-native-web rendered `<button>` inside `<button>` — invalid HTML,
  and React logged a hydration error for every card on the Home screen.
- For a screen reader the outer `accessibilityLabel` **replaced its children**,
  so the real key was never announced. The user heard *"Audio Fundamentals &
  Advanced Training Labs — open"* and never learned an OPEN LAB button existed.

**Fix:** the card wrapper keeps the whole-card tap but is no longer announced as
a button (`accessible={false}`, no role). The key inside speaks for itself.
Native behaviour is unchanged; the large tap area survives.

**Verified:** nested `<button>` count on Home went 2 → **0**, and `OPEN LAB` now
appears in the accessibility tree as a labelled button where it previously did
not appear at all.

### Sign-in is not required for the sweep

The web preview auto-enters Guest Mode, and a guest opens the free labs fine.
Member labs are reached by long-pressing the wordmark to set the mock
entitlement. A real account is only needed for things that persist (study
progress, the community directory, the calculator cap, QR) — noted here so the
distinction is not lost if a later lab does need one.

### FIXED · Toggling "Suppress all popups" crashed the entire app

**Severity: crash.** Dev-only in practice, latent in production.

`useOverlaysSuppressed()` in `features/dev/popupSuppressStore.ts` was written as:

```ts
return usePopupsSuppressed() || useLowLight();
```

JavaScript short-circuits `||`. The moment popup suppression became **true**,
`useLowLight()` was never called — the hook count changed between renders and
React tore the whole tree down: *"React has detected a change in the order of
Hooks"*, `#root` emptied, white screen. Found by pressing the dev index's own
"Suppress all popups" switch, which is the one control guaranteed to flip that
first hook true.

It reaches `ScreenIntroOverlay`, `LearningIntroSheet` and
`AmplitudeOrientation` — real screens, not just the dev menu. Today the only
caller of `setPopupsSuppressed` is `DevVisualIndex`, which is `__DEV__`-guarded,
so a release build cannot flip it. But the flag is persisted to AsyncStorage
(`ape:devSuppressPopups`), so the crash is one hydration away from being real.

**Fix:** call both hooks unconditionally, then combine. Swept the codebase for
the same shape (`use…() || use…()`, `&&`, ternary) — no other instance.

**Verified:** the toggle now works with zero console errors where it previously
white-screened instantly.

---

## AUDIO FUNDAMENTALS (13 labs)

### 1 · Understanding Level & Amplitude — **PASS**
Opens instantly, zero console errors, no nested buttons on the screen. The
blue→red ramp reads correctly (quiet = blue, loud = red), all six views draw the
same signal, and the honesty line *"Illustrative training graphics — not live
measurements"* is present. Owner-approved previously; nothing new to report.

### 2 · Foundations of Sound — **PASS, with touch targets**
Module 1/14 renders, zero console errors. Content and honesty badge
(*"CONCEPTUAL MODEL — SLOWED FOR VISIBILITY"*) correct.

**RISK · Header navigation is below the 44 pt touch standard.** Measured with
`hitSlop` accounted for:

| Control | Real target |
|---|---|
| ⏮ START | 67 × 35 |
| ‹ PREV | 55 × 35 |
| NEXT › | 53 × 35 |
| module dot (×14) | **31 × 23** |

The dots are the worst: fourteen of them in a row at 31 × 23 means mis-taps are
routine, and they are the only way to jump modules. Raising the vertical
`hitSlop` fixes START/PREV/NEXT safely; the dots need more room, which is a
layout decision rather than a one-line change — flagged rather than altered.

### 3 · Sound Playground — **PASS, one copy issue**
Correctly gated behind the Level & Amplitude orientation (you must press
UNDERSTOOD — CONTINUE first). The playground itself renders with zero console
errors: waveform, spectrum, λ and period readouts all update.

**NOTE · Developer language in user-facing copy.**
> "This dev build predates the additive engine — audio falls back to a pure
> sine; the drawings stay exact."

The *condition* is right — it only shows when the native additive engine is
absent (`!additiveReady && engineReady`), which is honest. The *words* are
written for a developer. A student on an older app version reads "This dev
build" and has no idea what that means. Suggest: *"This version of the app plays
a pure sine here — the drawings are still exact."*

**QUESTION · dBFS in the readout.** The bezel shows `LEVEL −26 dBFS` and the
fader is labelled `LEVEL (dBFS · relative)`. The standing rule is never to
default to dBFS because users read it as broken. Here it *is* qualified as
relative, and this is a synthesis playground rather than a measurement, so it
may be intentional — but the top bezel drops the qualifier. Owner's call.

### 4 · Microphone Principles — **PASS, one bug FIXED**
Cutaway renders correctly (the Oswald font fix from earlier holds — no label
collisions), all ten section tabs present, zero console errors.

**FIXED · `LabShell` collapsible sections nested a button in a button.** The
section header `Pressable` (expand/collapse) *contained* the ⓘ help `Pressable`.
Unlike the card case, here **both** are legitimate actions — they simply cannot
be nested. On web that is invalid HTML; for a screen reader the header's label
swallowed the ⓘ so the help action was unreachable. The header is now a plain
row holding two sibling buttons. This is `LabShell`, so it affects most labs at
once. Verified: nested count 1 → 0 on the live screen, and the help button is
now a 44 × 44 target (it was smaller and unreachable).

### 5 · Wave Physics Laboratory — **PASS**
Hub of 15 modules + Room Builder. Zero errors.

### 6 · Speaker Placement & Coverage — **PASS**
Coverage map draws on the amplitude ramp; honesty badge present
(*"CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION"*). The
colour legend pairs every swatch with a text label, so it survives colour
blindness without re-visualising the ramp. Zero errors.

### 7 · Digital Audio Systems — **PASS**
Eight modules, seven secondary calculators, guided lesson. Zero errors. Good
honesty line: *"digital audio is NOT made of stair steps."*

### 8 · Visual Audio Analysis — **PASS** · 11 modules. Zero errors.

### 9 · Signal Chain Builder — **PASS**
Canonical chain renders, LEARN/EXPLORE modes present. The "Audio output is off"
gate appears as designed. Zero errors.

### 10 · Signal Detective — **PASS**
Case 1/7, question 1/4, 0/28 solved; honesty badge *"SYNTHESIZED TEACHING SIGNAL
— NOTHING HERE MEASURES REAL AUDIO"*. Zero errors.

### 11 · Cable & Connector Fundamentals — **PASS**
Twelve steps, interactive category picker, safety framing intact. Zero errors.
**Notably this lab already meets the 44 pt touch standard** — its steppers use
`hitSlop {top:14,bottom:14}` for a 45 pt target. It became the reference for the
fix below.

### 12 · Cable Dressing & Installation — **PASS**
The Skia hero art renders correctly. Zero errors.

### 13 · Gain Staging — **PASS**
Learn / Explore / Challenge groups, related-tool links. Zero errors.

---

### FIXED · Foundations of Sound steppers were below the touch standard

Measured with `hitSlop` included, and compared against the Cable lab which had
already solved this:

| Control | Foundations (before) | Cable lab | Foundations (now) |
|---|---|---|---|
| ⏮ START / ‹ PREV / NEXT › | 35 pt tall | **45 pt** | **45 pt** |
| module dot | 31 × 23 | 44 tall | 43 tall |

The steppers were 19 px of text with `hitSlop={8}`. Cable had long since used
`{top:14,bottom:14}`. Foundations simply never got the same treatment; it does
now.

**NOT fixed — a design decision, not a bug.** The dots cannot be 44 pt *wide*:
fourteen of them at 44 pt is 616 px and a phone is 393 px. They gain height
only. If mis-taps matter, the strip wants to become something other than
fourteen dots — a scrubber, or a "jump to module" sheet — which is the owner's
call, not a mechanical fix.

---

## AUDIO FUNDAMENTALS — RESULT

**13 of 13 labs open. Zero console errors in any of them. No crashes.**
Two real bugs found and fixed (`LabShell` nested buttons, Foundations steppers),
plus the two app-wide fixes from the pre-flight (card nesting, the hooks-order
crash). Content, honesty badges and the amplitude ramp were correct everywhere
they were checked.

---

## ADVANCED TRAINING LABS (25 live · 12 marked PLANNED)

Every live lab was opened and its structure checked. **All 25 opened. No
crashes. Zero console errors** except the one web-only warning noted below.

Opened clean: Vacuum Tube Fundamentals · Distortion · Compression ·
Gate / Expander · Limiter · Equalizer · EQ Lab · Bass Guitar Physics ·
Chorus · Flanger · Phaser · Phase · Autotune · Stereo Imaging ·
Binaural Panner · Oscillators · Noise · Harmonics · FM Synthesis · Delay ·
Reverb · Audio Calculator Laboratory.

The 12 PLANNED entries (Patchbay, Amplifier Types, Smart Processors, Instrument
Recording, Mixing Principle, Room Mode Testing, Custom Room Treatment, Tunings,
Cymatics, Sound Envelope, Sample, Speech) are labelled as such and were not
opened — correctly, they announce themselves as not built.

### FIXED · Microphone Selection Lab — **twelve** nested buttons on one screen
Each of the twelve mic-type cards is a button ("select this type") and contained
a second button ("Enlarge … photo") wrapping the thumbnail. Same class as the
`LabShell` case but twelve at once. A 44 × 66 thumbnail cannot usefully hold a
second target anyway, so `MicVisual` gained a `zoomable` prop and the grid opts
out; the lightbox stays reachable from the full-size photo in the detail panel.
**Verified 12 → 0**, cards still select normally.

### FIXED · Harmonograph — the stage hid its own controls
The whole display is a `Pressable` labelled *"Tap to play interval"*, and it
wrapped the machine's FULLSCREEN and RESET buttons. Because an
`accessibilityLabel` replaces its children, **both of those buttons were
invisible to a screen reader**. The stage is no longer announced as a button —
safe here because the header key performs the same play/stop action and *is*
announced (the code comment says so explicitly). **Verified 2 → 0**, and both
inner buttons now appear in the accessibility tree.

### NOTE · Modular Synth — six ignored handlers, web only
React logs *"Unknown event handler property `onPress`. It will be ignored."*
six times. `ModularLabScreen` puts `onPress` on react-native-svg `<G>` elements
to make the patch boxes tappable. That works on native; **react-native-web
ignores it**, so the box taps are dead in the browser preview only. Not changed
— the native code is correct, and "fixing" it for web would mean touching a
working native interaction.

**This is also a coverage gap in this sweep:** any lab whose interactions ride
on SVG `<G onPress>` cannot be exercised here. It needs the device pass.

### NOT a bug — checked and dismissed
The "Audio output is off" gate appeared over the Calculator Lab, which plays
nothing. It turned out to be a leftover modal from the previously visited
Harmonograph: on a fresh entry to the Calculator Lab it does not appear.

---

## LAB MODULES (58)

Every module inside the five module hubs was opened and checked.
**58 of 58 opened. Zero console errors. Zero nested buttons. No crashes.**

| Hub | Modules | Result |
|---|---|---|
| EQ Lab | 15 | all pass |
| Gain Staging | 8 | all pass |
| Digital Audio Systems | 8 | all pass |
| Visual Audio Analysis (Meter) | 11 | all pass |
| Wave Physics | 16 (incl. Room Builder) | all pass |

**Correction to my own earlier count.** I told the owner "72 lab modules". That
came from `grep -c "id:"` across the five registries, which also counted nested
`id` fields inside module *params*. The real figure is 58: the registries hold
61 top-level entries, three of which (`LEARN`, `EXPLORE`, `CHALLENGE` in the
gain registry) are group headers rather than modules.

### Checked and dismissed — the waterfall's "missing" low end
The Waterfall (CSD) surface appears to start near 120 Hz while its axis begins
at 30 Hz, and the gap grows when the room gets more reverberant. That looks
wrong. It is not: `WF_FREQS` spans `F_LO = 20 Hz` to `F_HI = 20 kHz`, and the
front row maps `lgFrac(f)` across the full width — the apparent gap is the 3D
perspective, where each successive time row shifts right, so a longer decay
pushes the visible mass rightward. Settled against the source rather than the
screenshot.

*Legibility note, not a bug:* at CATHEDRAL the front (low-frequency) rows are
squeezed into a narrow left region that reads as empty. Worth the owner's eye
during the pending device pass.

---

## SWEEP TOTAL

**96 units opened: 13 Audio Fundamentals labs · 25 Advanced Training Labs ·
58 lab modules. No crashes. No console errors** beyond one web-only warning.

### Fixed (6)
1. **App-killing hooks-order crash** — `useOverlaysSuppressed` short-circuited a hook.
2. **Button-in-button on every course and lab card** — hid "OPEN LAB" from screen readers.
3. **`LabShell` collapsible sections** — help ⓘ nested and unreachable; now a 44 × 44 sibling.
4. **Foundations steppers** below the touch standard — brought to the Cable lab's values.
5. **Microphone Selection Lab** — twelve nested buttons on one screen.
6. **Harmonograph** — the stage's label hid its own FULLSCREEN and RESET buttons.

### Flagged, not changed (owner decisions)
- Foundations module dots: 44 pt targets are geometrically impossible for 14 dots on a phone.
- "This dev build…" copy in the Playground and Harmonograph — right condition, developer wording.
- `LEVEL −26 dBFS` in the Playground bezel drops the "relative" qualifier.
- Modular Synth's SVG `<G onPress>` — correct on native, ignored by react-native-web.

### Three findings RETRACTED after verification
A FREE lab "not opening", a gate "naming the wrong things", and the waterfall's
"missing low end" were all wrong — the first two were my own tap harness hitting
hidden screens, the third was 3D perspective. Recorded because a sweep that only
reports what it *thinks* it saw is worth less than one that checks.

### What this sweep could NOT cover
Anything audible (mic input, tone output, DSP correctness), haptics,
orientation, native modules, device performance, and any interaction riding on
SVG `<G onPress>`. Those need the device pass.

---

## NEEDS A DEVICE CHECK · Audio Learning — the Fundamentals card loses its title

**What you see (web preview, both 375 px and 800 px):** on the AUDIO LEARNING
screen, the **Audio Fundamentals** card renders with **no 📘 icon and no title**
— only a clipped sliver of the FREE TO START badge at its top edge — and a
matching empty strip of artwork at the card's bottom. The Advanced Training Labs
card directly below it renders perfectly. The card that says "start here" does
not say what it is.

**Measured, not eyeballed:**

| | content box top | card frame top | result |
|---|---|---|---|
| Audio Fundamentals | 143 | 198 | content sits **55 px above its own frame**, clipped by `overflow: hidden` |
| Advanced Training Labs | 506 | 505 | aligned |

**What I ruled out:**
- *Scroll artifact* — reproduces with the scroll container forced to 0.
- *Viewport width* — identical at 375 px and 800 px, so not responsive.
- *The images* — `training-labs.png` 1672×941 and `audio-fundamentals.png`
  1677×938 are effectively the same size and aspect.
- *Content height* — hiding the extra "Required for every Academy certificate"
  row live changed the offset not at all (143/198 before and after).

**What I could not do:** root-cause it. The two cards' markup is structurally
identical apart from that one extra row, and nothing in the source offsets the
content. That points at a **react-native-web `ImageBackground` layout artifact**,
which would mean it does **not** occur on a real device — RNW lays
`ImageBackground` out differently from native.

**Deliberately NOT fixed.** Changing layout I cannot reproduce natively risks
breaking a card that is fine on the phone. This needs ten seconds on the Pixel:
open Audio Learning and look at whether the Fundamentals card shows its 📘 and
its title. If it does, this is a web-preview artifact and can be closed. If it
does not, it is a launch-blocking cosmetic bug on the app's main entry card and
I will fix it immediately.


---

## AUDIO MEASUREMENT TOOLS

The hub renders correctly at phone width: eight tiles in the 2-column rack,
zero overflow, and every live preview strip drawing (VU, spectrum, waveform,
spectrogram, tone generator, RT60 decay, tuner). Zero console errors.

### REAL BUG · Layout constants are frozen at import — they survive rotation stale

Five screens compute layout from `Dimensions.get('window')` **at module scope**,
so the value is captured once when the file is first imported and never
recomputed. `"orientation": "default"` is set app-wide and **no screen locks
orientation**, so rotating the phone leaves these layouts sized for the previous
orientation until the app is restarted.

| File | Constant |
|---|---|
| `screens/tools/ToolsHubScreen.tsx` | `SCREEN_W` → `TILE_W` → `CHASSIS_L` (the whole rack geometry) |
| `screens/courses/CourseSelectionScreen.tsx` | `SCREEN_W` — **the Home screen** |
| `screens/awards/AwardsScreen.tsx` | `SCREEN_W` |
| `screens/achievements/AchievementsScreen.tsx` | `TILE` |
| `components/TrophyModal.tsx` | `SCREEN_W`, `SCREEN_H` |

**Proven, not inferred.** With the window resized to 375 px but the module still
holding its 1492 px value, ToolsHub drew its tiles **708 px wide inside a 345 px
container** — half a VU meter visible. Reloading at the same 375 px, so module
scope re-ran, produced a perfect hub with **zero elements wider than the screen**.
Same viewport, same code; only the staleness of the constant differed. That is
exactly what a device rotation does.

**Deliberately NOT fixed, and why.** The fix is `useWindowDimensions()` inside
each component, but in ToolsHub `TILE_W` feeds `CHASSIS_L`, which is baked into
five `StyleSheet` entries describing the owner-approved recessed-rack geometry
(`tileFrame`, `displayWell`, plate offsets). Making that reactive means
recomputing an intricate, signed-off visual design per render, across five
files, with no way to check the result on a device tonight. The risk of
silently degrading the app's most design-sensitive screen outweighs fixing a
rotation-only defect at 3am.

**Recipe when it is done:** replace the module constant with
`const { width } = useWindowDimensions();` in the component, derive
`TILE_W`/`CHASSIS_L` with `useMemo(..., [width])`, convert the five affected
`StyleSheet` entries to inline style objects, and check portrait *and* landscape
on the Pixel. The other four files are simpler — none of them feeds a generated
geometry.


### FIXED · SPL Meter — two labels drawn on top of each other at phone width

The digital readout panel's header (`dB SPL · A`) and the `PK` label were
painted over one another, garbling both. Measured at 375 px: header at
x 265–349, PK at x 257–300, y 80 vs 82.

**Cause:** the PK/AVG block is four labels at fixed offsets from `roMid`
(−54, −42, +2, +14). On a short panel — which is exactly what a phone gives this
meter — `roMid − 54` climbs into the header at y 7.

**Fix:** anchor the block to `roTop = Math.max(roMid − 54, 22)` and express all
four positions relative to it. Spacing is byte-for-byte identical; the block
simply cannot rise above the header any more.

**Verified live:** label overlaps 2 → 0, and the panel now reads cleanly —
`dB SPL · A` / `PK 83` / `AVG 64` / `HOLD 1S · MONO`.

### FIXED · SPL Meter — the gauge header hid its own help button
Same shape as `LabShell`, separate implementation: the "SPL REFERENCE GAUGE"
expand `Pressable` contained the ⓘ. Split into siblings; the ⓘ is now a 44 × 44
target and reachable. Verified 1 → 0 nested.

### Worth knowing: the browser preview HAS microphone access
The SPL meter read live input throughout (72 → 83 dB SPL, Leq updating, session
timer running). Earlier I told the owner audio was untestable here — that is
true for *output* and for DSP correctness, but live **mic capture and the
meters driven by it do work** in this harness, which makes the measurement tools
more testable than I first said.

