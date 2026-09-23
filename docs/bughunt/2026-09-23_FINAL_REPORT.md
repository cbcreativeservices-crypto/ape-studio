# Overnight bug hunt — final report
**Three agents, run back to back, 2026-09-23. Everything below is verified.**

---

## The short version

**19 findings raised. 19 confirmed against source. 0 false positives. 17 fixed.**

Two are waiting on you, both marked ⚠️ below. Nothing is published to the phones —
the app changes are committed and pushed but **not** sent to any tester. The
website fixes ARE live (a push deploys it), still behind the pre-launch gate.

- Head: `f28581b7` · 18 commits tonight · **1,881 tests passing** · 127 test files
- Raw findings + my verification: `docs/bughunt/2026-09-23_AGENT{1,2,3}_*.md`

| | Agent 1 — navigation | Agent 2 — stalled waits | Agent 3 — state & scale |
|---|---|---|---|
| Raised | 3 | 9 | 7 |
| Confirmed | 3 | 9 | 7 |
| **Fixed** | **2** | **8** | **6** |
| Waiting on you | 1 | 0 | 1 |
| False positives | 0 | 0 | 0 |

---

## The five that mattered most

**1. A finished quiz could be destroyed.** Submitting a graded quiz had no time
limit. The rescue that saves an attempt when the network fails sits in the error
handler — and a request that *hangs* never reaches an error handler. So a stalled
submit didn't just freeze the screen: the completed attempt was gone. Fixed, and
safe to retry because the server returns the original grade rather than re-marking.

**2. There was no way out of the Final Exam waiting screen on iPhone.** No header,
no back gesture, no button. Force-quit was the only exit. Android was fine, which
is why nobody saw it. Fixed.

**3. The glossary silently stopped opening terms — for members too.** Tapping a
term did *nothing*: no popup, no spinner, no error. Yesterday's fix had bounded the
wrong path; the live one was still open. Fixed, and it now fails *open* — a meter
that can't answer must never lock a paying member out of what they paid for.

**4. The Trophy Case told members they had earned nothing.** If the progress read
failed, the screen said **"0 / 166"** — as a fact, with no error and no retry. Both
screens already had an error message built; one missing line made it unreachable.
Fixed.

**5. The microphone stayed on in the background.** Press START, press Home during
the first few seconds, and recording continued with the phone's mic indicator lit
while the app wasn't in front of you — contradicting your own setting that promises
it "stops immediately". A privacy defect. Fixed.

---

## ⚠️ Two things I need you to decide

### ⚠️ 1. The website's progress panel is wrong for everyone — and it's a rebuild

The website dashboard still reads the **old course model you retired**. I checked
the database rather than guessing:

```
live topics carrying the old course_id link : 0   <- the key the web page joins on
```

Zero. So for **every** signed-in member, the site says:

> *"You're not enrolled in any topics yet. Open the app to get started."*
> **0/0 topics**, 0% progress

Their credentials still show up on the same page, which is exactly what makes the
empty progress read as true rather than broken.

I fixed the two *small* website bugs beside it, but not this one: the fix is to
rebuild the panel on the current enrolment model, which is a rebuild of a website
surface and a decision about what that page should show — your call, not mine at
4am. **Nobody reaches it today** because the site is still gated.

**A)** Rebuild it on the current model  **B)** Hide the progress panel until launch
 **C)** Leave it, it's gated

*My recommendation is A, but it is real work, not a patch.*

### ⚠️ 2. A topic with no terms would lock its credential forever

If a topic is ever switched on *before* its glossary terms are mapped, that topic
sits at 0% permanently — flashcards never complete, so homework never unlocks, so
the quiz never unlocks, and the credential needing it becomes unreachable, with no
message anywhere explaining why.

**It cannot happen on today's data** — I checked: 0 of 166 live topics have zero
terms, and the smallest has 69. So this is a trap for later, not a bug now.

**A)** Treat a genuinely empty topic as complete (app-side, same shape as the
existing scenarios exemption)  **B)** Leave the code alone and make it a
content-ops check before any topic goes live

*B is cheaper and honest; A is safer if content is ever added by someone else.*

---

## What else was fixed (no decision needed)

**Screens that could freeze forever** — the recurring fault in this project, and
now seven instances of one shape. A request that *hangs* is not one that *fails*:
error handling catches a failure, but a request that simply never answers is never
caught, so the "loading" flag stays on for the life of the screen. Airplane-mode
testing passes it completely; only a *slow* connection shows it. Bounded: the
glossary meter, the exam submit, the quiz submit, the glossary term gateway, the
calculator's CALCULATE button, community search, and Delete Account (which went
permanently dead after you'd already confirmed — on the one flow where you can't
just try again). They had been hand-copied six times and drifted apart, so they now
share one piece of code with a test pinning it.

**Numbers that were confidently wrong** — worse than missing numbers, because
they're believed.

- The community directory printed the *server's* total over a single page of 30:
  "212 members" above a list of thirty, the other 182 unreachable by any tap. Now
  pages properly and says "Showing 30 of 212".
- Topic progress was calculated from a count the server silently truncates at 1000
  rows. Live data averages 195 per topic, so it broke at roughly the **sixth**
  enrolled topic — an ordinary member. And a `Math.min(100, …)` was hiding it: the
  wrong number didn't show as an absurd 340%, it showed as a tidy **100% complete**
  on a topic you hadn't finished.
- The website told paying members **"Membership lapsed"** — two separate ways, both
  of which you'd already ruled on for the app and neither of which had reached the
  website.
- A member's public profile showed a prospective employer **no credentials at all**
  when the read failed. The likely trigger isn't a fluke: it's the database
  permission mistake this project has already shipped once, which returns *zero
  rows* instead of an error — every profile, permanently, nothing looking broken.

**Smaller** — "Retake the Career Finder" stacked up duplicate copies of the screen
(three taps of Back to leave what looked like one screen); the topic popup told
paying members their topic "needs Academy membership" before it had finished
checking; the glossary intro drew over the consent dialog; the glossary count reset
on the way in.

---

## What the agents checked and found genuinely fine

Worth as much as the findings, because it says where not to look again: a
136-route sweep for screens that navigate to themselves (zero); error and empty
states across the main screens all carry a way out; cold deep links always have a
screen beneath them; the two user-ID spaces are never confused; the offline
glossary corpus paging, batching and caching; guest/free/member separation; the
offline-member cache; 27 divisions that could have divided by zero, all guarded;
Career Finder scoring with no answers.

---

## The shape of it

The app itself is now hard to break head-on — several audits have left it with
guards and tests that catch the obvious things. **What survived was drift at the
seams.** Nearly every finding tonight is the same story: a fix was made correctly
in one place and its twin was missed. The quiz submit was left when the exam submit
was bounded. The Multi-Meter kept its own copy of the microphone handler. The
calculator was copied from the glossary meter line for line — except the one line
that mattered. And the website holds copies of app logic that were right when
written and were never updated again, one of which literally describes itself as a
mirror of a file it no longer matches.

So the fixes tonight were paired with guards that pin the *rule* rather than the
file — because the pattern isn't "we write bad code", it's "we fix it once and the
copy lives on". That's also the honest argument for **A** on decision 1: the
website will keep telling members things the app stopped believing in until it
stops keeping its own copy.

**Nothing is on the phones.** Say the word and I'll walk you through publishing.
