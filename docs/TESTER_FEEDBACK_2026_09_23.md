# TestFlight tester feedback — what I fixed tonight
**2026-09-23 · 9 screenshot reports from Jason, Frank and you · all against build 28**

---

## Summary

**ALL 6 fixed and pushed.** Five were bugs; the sixth was a design call you made
("let the display collapse so the lesson can take the screen") and it is now built.

Every fix is committed with the tester's own words in the commit message, so the
reason survives. tsc clean, **1,905 tests** green after each.

| # | Tester | Report | Status |
|---|---|---|---|
| 1 | Frank ×2 | Back button doesn't work / have to close the app | ✅ fixed |
| 2 | Jason + Frank ×2 | Flashcard definition cut off, can't scroll | ✅ fixed |
| 3 | Frank | Full screen hides which section you're reading | ✅ fixed |
| 4 | Frank | Redeem code — keyboard won't go away, tapping outside cancels | ✅ fixed |
| 5 | Jason | "Got stuck here couldn't press any buttons" | ✅ fixed |
| 6 | Frank | Only a small portion of the lesson screen scrolls | ✅ fixed (your ruling) |
| — | You | App froze after a text message | already fixed earlier |

---

## 1. "Back button does not work on multiple progress screens" — it was too small to hit

Frank said it twice, and once as *"you have to close the app to get out."*

The back control is a bare `‹` glyph. At its font size that's about **ten points
of actual ink**, with a touch pad of 10 — roughly a **30×44pt target against
Apple's 44×44pt minimum** — sitting flush at the left edge, which is exactly
where iOS watches for the back-swipe gesture. A tap a few points off, or one iOS
decides might be a swipe, does *nothing*. That is indistinguishable from a broken
button, and on a 667pt iPhone SE it feels like being trapped.

His words "**multiple** progress screens" were the clue: this was **62 controls
across 59 screens**, all the same shape. They now share one constant.

Deliberately lopsided — more room to the right and above/below, not to the left,
because the left strip belongs to the system gesture and it always wins.

**No pixel moved on any of those 59 screens** — only the invisible touch area
grew, which is what made a sweep that wide safe without a device in hand.

## 2 & 3. Flashcards — the definition wouldn't scroll, and full screen hid the section

Three reports, one cause. The card's gesture handler claimed vertical swipes
whenever the card was on "level 0" — but the **open-study (eyeball) view shows
the term *and* the definition together while still at level 0**. So on the one
view whose entire purpose is reading a long definition, the swipe handler took
every drag and the text underneath never got one.

The handler's own comment already stated the right rule — *"on definition views
the vertical axis belongs to the text"* — it just didn't cover that view.

Separately, Frank: *"you can't see the sub category such as definition or common
mistake in full screen."* Correct — full screen drew the term and the body but
dropped the little section label, so you could page between DEFINITION, PLAIN
ENGLISH and COMMON MISTAKES with nothing saying which you were reading. It's back.

## 4. Redeem a code — it threw away what you typed

Frank: *"When you finish typing in the code, you can't make the keyboard
disappear to press the redeem button — if you press anywhere outside the box, it
cancels it."*

Exactly right, and worse on a small screen where the keyboard covers the REDEEM
button. The single gesture everyone uses to dismiss a keyboard — tap the
background — was wired straight to **close and discard**.

Now: the background dismisses the keyboard first and only closes on a second tap,
the card lifts clear of the keyboard, and the keyboard's own **done** key redeems
so the button never has to be reached at all.

## 5. "Got stuck here couldn't press any buttons" — the rack was mute

Jason, on the study rack at 0%. The locked panels *did* already explain
themselves — but only from the little switch cap at the right edge. Everything
that actually looks pressable (the icon, the title, the meter, the whole panel
face) was inert. Tap the panel, get nothing, conclude the screen is dead.

The whole panel now answers a tap with the same explanation. The cap keeps
working as before, so nothing that already worked changed.

---

## 6. "Only that small portion of the screen scrolls" — HIDE DISPLAY ✅

Frank: *"It's hard to go through the lesson and question when it's only that
small portion of the screen that scrolls."*

Measured: the display is pinned at the top and the dock at the bottom, leaving
the lesson roughly **140pt on his iPhone SE** — about six lines, with the
check-yourself question inside the same window.

You chose: *let the display collapse so the lesson can take the screen.* Built.

A **HIDE DISPLAY / SHOW DISPLAY** control now sits on the faceplate between the
display and the lesson — on the faceplate, never floating over the glass, and in
the wording your SPL meter already uses. It's 44pt tall by construction, because
a control invented to fix a reading problem shouldn't repeat the back-button
mistake.

Three details that make it actually work:

- The display is **not rendered** while hidden — a zero-height canvas would still
  be mounted and still drawing frames.
- The lesson grows into the freed space **only** while hidden. Expanded, it still
  wraps its content so the dock rides up under short lessons instead of leaving a
  dead gap.
- **The choice survives moving to the next module.** Labs build a fresh frame per
  module, so plain state would have snapped back to open on every NEXT — collapse,
  read, tap NEXT, display in your way again. It now persists across modules and
  across a relaunch.

⛔ **Hiding the display does not hide a disclosure.** The live readouts and the
honesty badge ("illustrative — not live measurements", "ESTIMATED · UNCALIBRATED")
stay on screen. Buying reading space by tucking away an accuracy notice is exactly
what your standing rule forbids, and the guard test asserts it.

## Also worth knowing

- Your own report — *"App froze after i received text message going in and out of
  this card"* — was the freeze already tracked down earlier; the fixes are in the
  OTA that's now live.
- **All of tonight's fixes are code-only and JS-only**, so they can ship to
  testers as an OTA the same way — no new build, no TestFlight submission.
- I did **not** touch anything else in App Store Connect. No submission, no
  metadata, nothing beyond reading the feedback.

**Commits:** `1223aecf` (back targets) · `c00cc6f5` (flashcards + redeem) ·
`b3a46c21` (rack) · `7455c2c5` (hide display)

---

## Shipped & verified (2026-09-24, on your go)

**Published to both channels.** Fingerprints checked first, so it lands rather
than silently no-ops:

| Channel | Runtime | Reaches |
|---|---|---|
| `production` | iOS `e65788533c…` + Android | your four TestFlight testers, on next launch |
| `preview` | Android `78622e4e4f…` | the Pixel |

**Verified running on the Pixel** — the two-launch proof:

- **Launch 1:** 48/48 assets, 0 failed → `Update available` → `DownloadComplete`
  → `NEW_UPDATE_LOADED` → `Restart`
- **Launch 2:** `CheckCompleteUnavailable` → **`No update available`**

Launch 2 having nothing left to fetch is what proves the new code is the code
running. No build, no submission needed — all six fixes are JS.

⚠️ **What I could NOT do:** the Pixel is locked behind a **fingerprint**, so I
could not take a picture of the new HIDE DISPLAY control in a lab. The update
itself is proven (the app launches and logs behind the lockscreen), but the
*visual* check needs your thumb for ten seconds. Say the word when you're back
and I'll finish it.

I set the screen to stay awake while driving the phone and have **restored that
to its normal setting**.
