# TestFlight tester feedback — what I fixed tonight
**2026-09-23 · 9 screenshot reports from Jason, Frank and you · all against build 28**

---

## Summary

**5 of 6 real issues fixed and pushed. 1 left for you — it's a design call, not a bug.**

Every fix is committed with the tester's own words in the commit message, so the
reason survives. tsc clean, **1,905 tests** green after each.

| # | Tester | Report | Status |
|---|---|---|---|
| 1 | Frank ×2 | Back button doesn't work / have to close the app | ✅ fixed |
| 2 | Jason + Frank ×2 | Flashcard definition cut off, can't scroll | ✅ fixed |
| 3 | Frank | Full screen hides which section you're reading | ✅ fixed |
| 4 | Frank | Redeem code — keyboard won't go away, tapping outside cancels | ✅ fixed |
| 5 | Jason | "Got stuck here couldn't press any buttons" | ✅ fixed |
| 6 | Frank | Only a small portion of the lesson screen scrolls | ⚠️ **your call** |
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

## ⚠️ 6. The one I did NOT fix — I need your call

Frank: *"It's hard to go through the lesson and question when it's only that
small portion of the screen that scrolls."*

He's right, and I measured it. In the lab frame the display is **pinned** at the
top, the dock is pinned at the bottom, and the lesson text gets whatever is left:

- On his **iPhone SE (667pt)**: roughly **140pt** of reading window — about six
  lines of text, with the check-yourself question also inside it
- On a Pixel 7 Pro it's comfortable, which is why neither of us hit it

**I stopped because this is a design decision, not a defect.** The pinned-display
layout is deliberate and tuned by you, and any fix changes how every lab looks:

- **A)** Shrink the display further on short phones — simple, but every lab's
  proportions change on small devices
- **B)** Let the display collapse so the lesson can take the screen — best
  reading experience, but adds a control to every lab
- **C)** Let the whole page scroll on short phones only — most text, but the
  display stops being pinned, which the current design explicitly promises

I didn't want to redesign your labs overnight and unverified. Say which and I'll
do it.

---

## Also worth knowing

- Your own report — *"App froze after i received text message going in and out of
  this card"* — was the freeze already tracked down earlier; the fixes are in the
  OTA that's now live.
- **All of tonight's fixes are code-only and JS-only**, so they can ship to
  testers as an OTA the same way — no new build, no TestFlight submission.
- I did **not** touch anything else in App Store Connect. No submission, no
  metadata, nothing beyond reading the feedback.

**Commits:** `1223aecf` (back targets) · `c00cc6f5` (flashcards + redeem) ·
`b3a46c21` (rack)
