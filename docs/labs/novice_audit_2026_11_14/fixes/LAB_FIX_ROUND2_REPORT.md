# Lab fix round 2: your 8 decisions, built and checked (2026-11-14)

**Where it is:** commit 4f878ed1 on ota-after-approval-39-23, pushed to GitHub.
**Phones:** it is NOT on any phone. It goes out with the next OTA, and only when you say so.
**Tests:** 22,838 pass, 0 fail. The type check is clean.

The website SEO work rides in the same commit. Those files are the same ones already live on the site (deploy bb16c61c).

## 1. What changed, decision by decision

| Your answer | What the labs do now |
|---|---|
| **Done = work done** | A module or page turns ✓ only when its goal or its check is done, never just from opening it. Credit you already earned is never removed. WHAT'S LEFT says what is still to do. |
| **Remove the "N of total" counters** | Progress strips show plain names ("MODULE 3", "LESSON 1", "CASE 5"), never "3 / 12" or "5 OF 5". Real values stay, such as VOICES 0/16 or a route score out of 100. The Career Finder quiz reads "Question 7 · 21 to go". |
| **Frame extras: do your recommendations** | (1) On a first visit, a rack lab opens on LEARN. (2) Each "NOT A MEASUREMENT" warning in capitals is now one plain sentence, such as "A drawn cross-section, not measured tube data." (3) "drawing…" shows instead of an empty black box. (4) An open tray shows ⓘ, and tapping it opens the help. (5) A step's intro is a popup only on the first step; later steps show a small note above the controls that never covers a button. (6) Each lab uses one word everywhere: module, lesson, page, step, guide or stage. |
| **Ear Training: play first** | The answers stay locked until the clips have played once. With sound off, it says the round needs sound and offers a way out. |
| **Long pages: beginner core first** | The beginner part comes first. The depth sits under GO DEEPER ▾ (or PART 2), and nothing was removed. Game Audio grew from 22 to 24 pages: page 4 became pages 4 + 5, and page 10 became pages 11 + 12. Saved progress moves to the new page numbers automatically. Wave keeps its teaching text and instructions open; only the number tables fold. |
| **Foundations module 10: keep red** | The line stays red, with the words "CANCELED — SILENT" on it. |
| **Sound Systems fault titles: rename** | "Hum through the system", "Sound cuts in and out", "Vocals coming out of the subwoofer". |
| **Career Finder: show me each one** | All 39 of your tick-list answers are applied. |

Also in this commit:
- The Miking titles now match the server names Comp A changed: "Bass Clarinet" and "Amplified Speakers and Leslie". The certificate list was regenerated to match.

## 2. Independent checkers

Four checkers who had not built anything opened the labs on screen and tested each decision.

| Checker | Checked | Pass | Fail | Could not be seen in the browser |
|---|---|---|---|---|
| K1 | 57 | 53 | 3 | 1 |
| K2 | 49 | 43 | 3 | 3 |
| K3 | 52 | 43 | 8 | 1 |
| K4 | 49 | 45 | 2 | 2 |
| **Total** | **207** | **184** | **16** | **7** |

Every FAIL went back to the group that built it and is now fixed. Most of the fixes were then looked at on screen. The main ones:
- The small intro note covered the NEXT button. It now sits in the page flow and never covers anything.
- Tapping a lab's tab while Sound Safety was about to appear lost the tap. The tab now switches first, and the sheet comes after. iPhone and Android follow the same rule.
- Wave folded away its teaching text. That text now stays open.
- Some capitals warnings and some "n of total" counts were left in Digital, Tube, Mic, Speaker and the two Cable labs. All are gone.
- Stage Plot's folded rows read badly to a screen reader. They are fixed.
- I found one more myself: a plain-sentence note under a drawing switched back to capitals lettering in full screen. It is fixed.

## 3. Two things for you to decide (nothing is waiting on them)

1. **Career Finder: 11 example jobs sit in another family.** Each family page shows example jobs, and these 11 belong to a different family in the job list. For each one: move the job into this family, or pick a different example.

   | Family page | Example shown | The family it is in |
   |---|---|---|
   | Manufacturing, Quality, Calibration & Repair | Audio Test Engineer | Audio Hardware, Transducers & Electronics Engineering |
   | Audio Business, Product, Sales & Operations | Studio Manager | Recording Studios & Music Production |
   | Sonic Branding, UX, Exhibits & Experience Design | Exhibit Audio Designer | Installed AV, Integration & Institutional Systems |
   | Music for Picture, Scoring & Editorial | Orchestrator | Music Creation, DAWs, Synthesis & Sonic Art |
   | Session Performance, Voice & Musical Direction | Vocal Producer | Recording Studios & Music Production |
   | Telecom, Voice Quality & Communications Audio | Telecommunications Audio Engineer | Consumer, Home, Vehicle & Personal Audio |
   | Music Curation, Repertoire, Libraries & Editorial | Music Supervisor | Audio Business, Product, Sales & Operations |
   | Defense, Sonar & Acoustic Intelligence | Underwater Acoustics Engineer | Scientific, Environmental & Applied Acoustics |
   | Accessible Media & Audio Description | Audio Description Narrator | Podcast, Audiobook, Voice & Spoken-Word Production |
   | Music Retail, Rental & Instrument Services | Pro Audio Retail Specialist | Audio Business, Product, Sales & Operations |
   | Music Retail, Rental & Instrument Services | Backline Technician | Stagecraft, Rigging, Power & Production Support |

2. **Speech & Voice lab: the word on its first card.**
   - The card now explains "Source-filter model", which is what the lab teaches.
   - Since October 19 it had explained "miking".
   - If "miking" was your choice, it is a one-line change back.

## 4. Checks that need a real phone

The browser preview cannot show these:
- EQ Lab: the mic starts only when you tap MIC, with no permission prompt before that.
- Android BACK while the Sound Safety sheet is open.
- Miking: no flash on the first frame.
- Game Audio: saved ✓ marks land on the right pages after the 22 → 24 change.
- The drag strips (sliders) under a finger.
- The lab header on a small phone (320 wide).
- The mixing labs' measured numbers with sound off.

## 5. Still open

- **"+ this topic"**: on a Career Finder family page, START HERE can show "+ this topic" in place of a topic name. This happens when the topic list fails to load (seen in the browser preview). It needs one look on a phone, and if it shows there, a fix that covers the whole app.
- **Comp A, website:** re-run Google's Rich Results Test on the live site, and ask Google to re-index the home page and /founder.
- **Phones:** this reaches phones with the next OTA, and only on your word.

The preview's saved data is back as it was before the fixes (25 entries, guest).

## Group reports

All of them are in the repo folder docs/labs/novice_audit_2026_11_14/fixes/:
- the builders: S1–S4 and F2–F9;
- the checkers: CHECK2_K1 to K4.
