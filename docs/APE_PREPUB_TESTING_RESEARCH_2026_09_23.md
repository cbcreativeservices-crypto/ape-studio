# Pre-publication mobile testing — what the field says, September 2026

**For:** AP&E Studio, before the next TestFlight round
**Written:** 2026-09-23, overnight
**Method:** web research, then filtered against what actually broke in this app
over the last four days. Where a published lesson matches a real AP&E bug, the
bug is named — those are the ones worth trusting.

---

## 1 · The headline finding

> *"Most production bugs in mobile apps come from unpredictable real-world
> contexts, not from functional logic."* — DeviQA

Every single bug this app shipped in the last four days fits that sentence.
Not one was a wrong calculation or a broken algorithm. They were:

| bug | the "real-world context" that caused it |
|---|---|
| glossary freeze | user left the app to read a text |
| free-account freeze | a network call that stalled rather than failed |
| card titles sliced | a screen size nobody tested |
| progress read 246% | data that grew past what the query assumed |
| overlays stacked | two correct components, same moment |

**The implication for this project:** more unit tests would have caught none of
them. The gap is not test *coverage*, it is test *conditions*.

---

## 2 · The five conditions that find these bugs

Research is unanimous on which conditions surface real failures. Ranked by what
would have caught the most AP&E bugs:

### 2.1 Interruption and lifecycle — HIGHEST VALUE HERE

> *"Interruptions should never result in silent data loss."* — TestGrid
> *"Navigation state recovery catches production bugs that traditional testing
> ignores entirely — users receiving a call while filling out a form, returning,
> and finding their input gone with no explanation."* — Minitap

The checklist:
- incoming call mid-task
- notification banner mid-task
- app switcher, then return
- background **past the OS reclaim window**, then return ← *this was our freeze*
- OS kills the app in the background; user returns expecting state
- screen lock / unlock
- low-power mode

**AP&E status:** this is exactly the SMS freeze. The glossary dropped its corpus
after 60s backgrounded and re-paged 27,000 rows on return. We fixed it after a
user hit it. A 90-second interruption test would have found it in week one.

### 2.2 Network states, not just "offline"

> *"Test transitions from connected to disconnected, Wi-Fi to cellular, and
> foreground to background while operations are underway."* — QASkills

The distinction that matters most, and the one we got wrong:

**A request that FAILS is not the same as a request that HANGS.** A failure
throws and your `catch` runs. A stall never settles, so `try/catch` is useless
and `finally` never executes. Airplane mode tests the first and completely
misses the second.

**AP&E status:** the free-account freeze was precisely this — `statusServer()`
had a try/catch and no timeout. Airplane-mode testing would have passed it.
Simulating a *stalled* connection (throttle to near-zero, or a captive portal)
is the only thing that finds it.

### 2.3 Device and screen fragmentation

> *"Most apps can cover 80% of their audience with around 30–35 key devices."*
> — Drizz
> *"A strong device mix reduces unexpected production issues by 40–60%."*

Three strategies exist; **traffic-weighted** (test what your users actually run,
from analytics) gives the best return.

**AP&E status:** we test on exactly two devices — one iPhone 16 Pro and one
Pixel. The sliced card titles appeared on a 375×667 screen that neither of us
owns. `CARD_H` was a hardcoded 409 and had *already* been reduced from 440 once
for the same complaint. A single small-screen check would have caught both.

### 2.4 Cold deep links

> *"Test every deep link cold — with the app not running at all — as that is the
> path that breaks."* — Hassan Javed, Expo production checklist

The app is running → the link works. The app is dead → navigation isn't mounted
yet, auth hasn't resolved, and the link lands nowhere or on the login screen.

**AP&E status:** we have a known fix in this area already (`1ab0d470`, a late
deep link landing above the login screen), which suggests the class is live.

### 2.5 Accessibility as a correctness check, not a compliance chore

> *"Automated tools miss 60–80% of accessibility issues."* — Userpilot
> *"The most frequent defect is missing labels."*

The under-appreciated part: a screen reader reads the *state* your code
actually published. When the label and the announced value disagree, that is a
**state bug** that happens to be visible through the screen reader.

**AP&E status:** we hit this three times — the LED meter announcing a different
number than it printed; the progress bar with no accessible value at all. Each
was a real discrepancy between what was computed and what was shown.

---

## 3 · Lessons that map directly onto mistakes made here

### 3.1 A hardcoded dimension fixes the device in the room

`CARD_H = 440` → `409` → still broken at 375×667. The second magic number failed
exactly like the first. Derive from the screen, and have the test pin the
*derivation*, not the value.

### 3.2 A clamp that does real work is hiding a bug

`Math.min(100, …)` turned a 246% computation into a confident 100%. It looked
like defensive code and was the only thing concealing the fault for weeks.

**Rule: if a clamp is ever reached in normal use, it is not protecting you — it
is lying for you.** Instrument it.

### 3.3 Busy must never look frozen

> *"A dead screen with no button for nine seconds is indistinguishable from a
> freeze."* — already written in this repo's own `IntroSheet` comment

Every long operation needs a visible state. The glossary re-paged 27,000 rows
behind a fully drawn list with no spinner: indistinguishable from a crash.

### 3.4 One statement per row is a freeze waiting to happen

31,858 sequential awaits across the native bridge. Batch anything that scales
with data volume, and yield between batches.

### 3.5 Test the path the user is actually on

Three separate reasons we missed the free-account freeze:
1. the Pixel had already written its cache, so the expensive path never re-ran
2. the browser preview had `ape:dev:entitlement = academy` — **every test ran as
   a member**
3. the browser never runs SQLite at all

**Rule: enumerate the account states (guest / free / member / lapsed) and run
the critical path in each.** A dev override that silently pins you to one state
is worse than no override.

---

## 4 · Navigation and user-path testing

> *"Pick 5 to 8 journeys that make you money or lose you users, cover those on
> real devices."* — Drizz
> *"Users who feel trapped leave reviews that poison acquisition."*

What to hunt for:
- **dead ends** — a screen with no forward action and no way back
- **loops** — back returns you to where you just were
- **self-navigation** — a button that navigates to the screen you are on
- **platform back** — Android hardware/gesture back vs iOS edge-swipe; a flow
  correct on one often breaks subtly on the other
- **gated goals** — a stated goal the user cannot actually reach

**AP&E status:** we have shipped fixes for *all* of these in the last week —
`244cc811` (buttons navigating to themselves), `deee39ee` (award-progress dead
end), `f9d7d38d` ("Begin Round 3" re-running Round 2 forever). That is a strong
signal the class is under-tested rather than exhausted.

---

## 5 · The pre-publication checklist this produces

Ordered by expected yield for THIS app.

**A · Interruption (highest yield — caught zero of our bugs so far)**
1. background >5 min on every data-heavy screen, return
2. incoming call mid-flow
3. OS-kill while backgrounded, relaunch
4. screen lock/unlock mid-operation

**B · Network**
5. stalled connection, **not** just offline (the failure/hang distinction)
6. wi-fi → cellular mid-request
7. airplane mode on every cached screen
8. first launch on a slow connection

**C · Account state**
9. the critical path as guest, free, member, and lapsed — all four
10. sign-in and sign-out mid-session, then re-enter the same screen

**D · Device**
11. one small screen (≤667pt) — we own none
12. one low-memory device
13. largest text size / display zoom

**E · Navigation**
14. the 5–8 money journeys end to end
15. platform back from every screen
16. every deep link cold

**F · Accessibility**
17. VoiceOver/TalkBack over the money journeys — treating disagreements between
    label and value as state bugs, not copy bugs

---

## 6 · What this suggests for AP&E specifically

1. **We have two devices and need a third** — something small-screened. The card
   bug lived on a size neither of us owns.
2. **The dev entitlement override is a testing hazard.** It silently pinned
   every browser test to `academy`. It should be visible on screen when set.
3. **Interruption testing is the single biggest gap.** It is also the cheapest:
   background the app for six minutes and come back.
4. **Stalled ≠ offline.** Every remaining unbounded `await` on a network call is
   a potential frozen screen. The glossary had three.

---

## Sources

- [DeviQA — Mobile app testing best practices, 2026-ready](https://www.deviqa.com/blog/making-mobile-app-testing-work-for-you-practical-tips-and-techniques/)
- [Drizz — Mobile device fragmentation testing strategy](https://www.drizz.dev/post/mobile-device-fragmentation-testing-strategy)
- [Drizz — User journey testing for mobile apps](https://www.drizz.dev/post/user-journey-testing)
- [Drizz — Interrupt testing: calls, alerts, network drops](https://www.drizz.dev/post/interrupt-testing)
- [Minitap — Mobile feature shipping checklists](https://www.minitap.ai/magazine/mobile-feature-shipping-checklist)
- [Minitap — How to test stateful flows in mobile apps](https://www.minitap.ai/magazine/how-to-test-stateful-mobile-flows)
- [QASkills — Background/foreground lifecycle playbook](https://qaskills.sh/blog/mobile-testing-background-foreground-lifecycle)
- [TestGrid — Interruption testing](https://testgrid.io/blog/interruption-testing/)
- [Hassan Javed — React Native Expo production checklist 2026](https://www.hassanjaved.work/blog/react-native-expo-production-checklist-2026)
- [Superapp — Why apps get rejected from the App Store, 2026](https://www.superappp.com/blog/why-apps-get-rejected-from-the-app-store-2026-guide)
- [Userpilot — Mobile usability testing 2026](https://userpilot.com/blog/mobile-usability-testing/)
- [Userpilot — Mobile UX: the interruption problem](https://userpilot.com/blog/mobile-ux-design/)
- [Accessibility.build — TalkBack screen reader testing](https://accessibility.build/guides/talkback-screen-reader-testing)
- [Ministry of Testing — Testing iOS across lifecycle states](https://www.ministryoftesting.com/insights/10-ways-to-test-ios-apps-across-different-states-and-lifecycle-stages)
