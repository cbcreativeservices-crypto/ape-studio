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

