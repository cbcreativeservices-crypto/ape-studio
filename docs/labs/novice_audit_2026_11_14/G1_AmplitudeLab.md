# G1 · Understanding Level & Amplitude (AmplitudeLab) — beginner audit

Auditor G1, 2026-11-14, web preview at 390 x 844, sound OFF (this lab plays no sound).
Reached by the real app path: `http://localhost:8142/` → OPEN LABS → EXPLORE FUNDAMENTALS → Understanding Level & Amplitude. (AmplitudeLab is not registered in `#labpreview/…`; tapping its tile inside `#labpreview/EarLab` does nothing, so the harness link cannot open it.)
The lab is ONE scrolling page plus the shared "What's left" end screen. Pages audited: 2.

---

## Page 1 · The lab page (term card → intro card → page)

| Field | What |
|---|---|
| Page | AmplitudeLab · the single lab page · real app: Labs → Audio Fundamentals → Understanding Level & Amplitude |
| First look | Two pop-ups before the page. First a gold "Amplitude" word card, then the intro card (WHAT YOU'RE LEARNING / WHERE TO START). Behind them the eye lands on the big title UNDERSTANDING LEVEL & AMPLITUDE and the rainbow colour bar. After closing, the eye goes straight to the colour bar (LOW blue → HIGH red); it reads as "a volume colour key". Good first impression. |
| Overwhelm | 3. The colour bar is calm, but within one scroll there are six dense cards (waveform, oscilloscope, level meter, SPL meter, spectrum, spectrogram) each with its own axis, numbers and arrows, and none of them can be touched. Two pop-ups in a row before seeing anything also adds friction. |
| Knows what it is learning? | Partly. They get "blue means quiet, red means loud" within seconds (the core idea lands). They do NOT get the second half the intro promises ("how amplitude, level, peak, RMS and dB SPL differ"): the page never teaches those differences on screen; it is only in the ⓘ guide. They think: "a colour legend for the app". |
| Knows what to do first? | Partly. The intro says "read the colour bar, scroll the six views, find the short burst in WAVEFORM, then CHECK YOURSELF." They scroll (right). They then look for the burst in WAVEFORM and cannot find it: on screen the waveform bars are all the same green with only a slight bulge (see finding 2). They give up looking and scroll to CHECK YOURSELF, which is the real task and works well. |
| Words they would not know | Term card: "frequency" (used to define amplitude, itself undefined). Intro card: "level" (as distinct from amplitude), "peak", "RMS", "dB SPL". Eyebrow: "THE ACADEMY GLOBAL METHODOLOGY" (sounds like marketing, not a lesson). Colour bar: "pp, mp, f, fff" (unexplained on the page; the guide explains "music marks, very soft to very loud"). SIX VIEWS: "spectrum analyzer", "magnitude", "spectrogram", "harmonic" (glossed "a fainter, higher tone": good), "Instantaneous amplitude", "Spectral magnitude", "RMS (a kind of average)" (glossed, good), "dB SPL", "Sound-pressure level", "SPECTRUM (RTA)" ("RTA" never expanded). LEVEL METER scale 0, −12 … −48: negative numbers with no word about why loudness is negative. CHECK YOURSELF Q2: "hotter". |
| Follows / continues? | Yes. The check is short and forgiving and they finish it. Where they might quit: the middle of SIX VIEWS, where six charts arrive at once with "do not worry about what those tools are yet". After the check the end is clear (UNDERSTOOD — MARK REVIEWED, then FINISH · SEE WHAT'S LEFT). |
| What works | (a) The colour bar with three parallel rows (quiet/loud, LOW/HIGH, less/more) and the colour names spelled out under it: instantly readable. (b) "Do not worry about what those tools are yet — you will learn each of them soon." This is exactly the reassurance a beginner needs. (c) BLUE = LESS / RED = MORE in huge letters right before the check: a perfect "here is the rule" moment. (d) CHECK YOURSELF: three two-choice questions, each a new display; a wrong tap shows "Read it from the ramp: warmer is more." plus a small colour ramp, and costs nothing. Great recovery. (e) The finish line "You just read three displays — one you had never seen" gives a real sense of achievement. (f) The LEARNING CONVENTION box is honest that real gear uses other colours. |
| Suggestions | 1. **Make the six views teach one thing each, with a pointer.** Each card has a caption, but nothing says what to notice. Add one short "Look for:" line per card (e.g. WAVEFORM "taller = louder; the tall spot is the burst"; SPECTROGRAM "each bright band is one tone; the upright streak is the burst"). These lines already exist in the ⓘ guide (TRY THIS); a beginner never opens it. (M) 2. **The burst in WAVEFORM is not visible as "tallest, warmest bars".** On the 390-wide web view the whole waveform is the same green, with only a slight bulge near 70%. The intro tells them to "find the short burst in WAVEFORM", and they fail at the very first task. Either make the burst unmistakable (taller and orange/red) or change the instruction to SPECTROGRAM, where the streak is obvious. Check on a phone too (the waveform is a Skia drawing). (S/M) 3. **Explain the SPL 78 vs PEAK −3 paradox on the page.** A beginner sees 78 drawn green-yellow and −3 drawn orange, right after being told "warmer = more". This contradicts the rule unless they read the guide's "each display colours its own scale". Put one line under the two meter cards: "Each meter colours its own scale: near its top is warm, whatever the number." (S) 4. **Say why the level meter numbers are negative.** One line on the LEVEL METER card: "0 is the loudest a recording can hold; everything below is negative." (S) 5. **Cut the intro card's promise or keep it.** "Also how amplitude, level, peak, RMS and dB SPL differ" sets a goal the page body does not meet. Either drop that sentence from the intro, or add a 4-line "Four words" box (amplitude / level / peak vs RMS / dB SPL) right after the colour bar. (S) 6. **Merge the two opening pop-ups.** The "Amplitude" word card and the intro card arrive back to back. Show the word card after the intro (or fold its line into the intro). Its definition also uses "frequency" without explaining it; say "how low or high the sound is". (S, SHARED: LabTermIntro + intro card order) 7. **Replace the eyebrow "THE ACADEMY GLOBAL METHODOLOGY"** with something a learner can use, e.g. "LESSON 1 · THE COLOUR KEY". (S) 8. **Gloss pp/mp/f/fff on the page** ("music marks: very soft → very loud"). (S) 9. **Give feedback on a right answer.** A correct tap just swaps to the next question; a beginner is not sure it was right. A 1-second "✓ Right — warmer is more" would close the loop. (S) 10. **The "New: tap ⓘ to have this screen explained" bubble** stays on screen after the guide has been used and covers the OSCILLOSCOPE title while scrolling. Hide it once the guide has been opened. (S, SHARED: screen guide) 11. **End screen wording** (see Page 2). |
| Hobbyist | Knows dBFS, peak and RMS, so the colour key takes 10 seconds and the six cards are a pleasant "oh, it's the same everywhere". Would like the SPL vs dBFS point made explicitly (it is the most useful idea here and it is hidden in the guide). Might be bored by the check; it is short enough not to matter. |

## Page 2 · FINISH · SEE WHAT'S LEFT (shared end screen)

| Field | What |
|---|---|
| Page | AmplitudeLab · What's left · reached by FINISH · SEE WHAT'S LEFT › |
| First look | Big gold WHAT'S LEFT, then a card "01 Pass CHECK YOURSELF — THREE QUICK READS, then press UNDERSTOOD — MARK …" (cut off). |
| Overwhelm | 1. Calm and short. |
| Knows what it is learning? | Not addressed. The page does not recap what was learned. |
| Knows what to do first? | Partly. I had just passed the check but had not pressed UNDERSTOOD. The card still says "Pass CHECK YOURSELF …", which reads as "your answers were lost". A beginner would feel they failed. |
| Words they would not know | "counts toward your credit" (what credit?). |
| Follows / continues? | Yes: BACK TO THE LAB, PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, DISCUSS THIS LAB. But nothing says which lab to do next (Foundations of Sound is the natural next step). |
| What works | "Everything you have done is saved." and "Practicing again or reviewing never removes credit you have already earned." Very reassuring. The step card jumps straight to the right place. |
| Suggestions | 1. When the check is already passed, the step should read "Press UNDERSTOOD — MARK REVIEWED (your check is passed)". (S) 2. Add a two-line "You learned" recap and a "Next lab: Foundations of Sound ›" button. (M, SHARED: what's-left screen) 3. The step text is cut off with "…" on a phone; let it wrap. (S, SHARED) |
| Hobbyist | Fine. Would just tap DONE. |

---

## Lab verdict — Understanding Level & Amplitude

**Beginner's journey.** The newcomer gets the main idea (cool colours = less, warm colours = more) within ten seconds, thanks to a very clear colour bar, and leaves with a small win from a forgiving three-question check. In between, the six chart cards are a wall: six unfamiliar displays with axis labels and numbers, nothing to touch, and no "look here" pointer on the page. The intro's first instruction ("find the short burst in WAVEFORM") fails because the burst does not stand out, and the SPL-vs-level-meter colours seem to break the rule just taught. They finish, but with the feeling that "the charts were for someone else".

**3 biggest orientation problems**
1. The six views have captions but no "what to notice" lines; the useful pointers live only in the ⓘ guide.
2. The very first task (find the burst in WAVEFORM) cannot be done by eye on the 390-wide view.
3. The 78 dB SPL (green) vs PEAK −3 (orange) contrast contradicts "warmer = more" unless the beginner opens the guide; and the intro promises peak / RMS / dB SPL differences that the page never teaches.

**3 best things**
1. The colour bar with quiet/loud, LOW/HIGH, less/more rows and the spelled-out colour names.
2. "Do not worry about what those tools are yet — you will learn each of them soon."
3. CHECK YOURSELF: two-choice, wrong answers cost nothing and show a hint plus a ramp.

**First 30 seconds rewrite.** One pop-up only: "This lab teaches one thing: the colour key used on every screen in the Academy. Blue = less, red = more. You'll see it on six kinds of display, then answer three quick questions." Page opens on the colour bar with the music marks glossed. Under it: "Now find the loudest moment on each display below" with each card carrying one "Look for:" line, the burst drawn unmistakably red, and a one-line note under the two meters that each one colours its own scale.
