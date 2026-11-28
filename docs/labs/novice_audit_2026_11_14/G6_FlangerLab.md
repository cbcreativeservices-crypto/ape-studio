# G6 · FlangerLab — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. **How reached:** not in the `#labpreview/` harness; full app → OPEN LABS → EXPLORE ADVANCED LABS → Modulation → Flanger (no lock). Shared frame judged in G6_EqLab.md. EXPLORE walked; LEARN / CHECK from `flangerScreenGuides.ts` + on-page cards.

---

## Page 1 · EXPLORE

| Field | Finding |
|---|---|
| Page | Flanger Lab · EXPLORE |
| First look | Intro card "**Flanger**": "blends a sound with a tiny moving delay of itself… a comb of notches that sweeps up and down. It sounds like a jet passing overhead. The name comes from slowing tape reels by hand." Then Sound Safety (8th time), learning popup. Then two graphs: a flat grey block (IN, "PINK NOISE") and a yellow zig-zag (OUT, "SPECTRUM (dB)") whose teeth get tighter to the right. Thinks: "the flat sound became wavy". That reading is actually close. |
| Overwhelm | **3 / 5.** |
| Knows what it is learning? | **Partly.** "Jet passing overhead" lands; "comb of notches" does not until the picture is explained. |
| Knows what to do first? | **Partly.** WHERE TO START: "Tap ▶ to play PINK NOISE and watch the notches slide on OUT. Then drag CENTER from 2.0 ms down to 0.50 ms and see the notches spread apart." The silent half works: at 0.53 ms the teeth visibly spread. The notches also slide on their own (the sweep) without ▶. |
| Words they would not know | "Sweeping comb · The jet" (subtitle) · "comb", "notches" · "spectrum analyzers" / "SPECTRUM (dB)" (first meeting for anyone who skipped EQ Lab) · "PINK NOISE" · "CENTER 2.0 ms" · "LFO" (used in the caption and LAB NOTES without the chorus lab's "slow wobble" gloss) · "spacing is 1/delay" · "FDBK", "MIX 50% EVEN" · "runaway" (CHECK YOURSELF). |
| Follows / continues? | Partly. **Picture vs words disagree:** the text says "evenly spaced notches" (twice), but the frequency axis is logarithmic (100 · 1k · 10k), so on screen the notches look wide on the left and crowded on the right — i.e. NOT evenly spaced. A beginner trusts the picture and then fails the CHECK YOURSELF ("A flanger's comb is EVENLY spaced"). Also the bezel says **RATE 0.2 Hz** while the dock key for the same thing is **SWEEP 0.2·50%**. "Compare with the phaser" (LAB NOTES) refers to a lab not yet seen. |
| What works | The card's "jet" + tape-reel origin story. The dotted input line over OUT for comparison. Dragging CENTER gives an immediate visible change. |
| Suggestions | 1. **Add a "linear" view (or a caption arrow) that shows the notches truly evenly spaced**, or change the words to "evenly spaced in Hz — on this log scale they bunch up to the right". Picture and words must agree. **M.** 2. **Name the moving part the same everywhere**: SWEEP on the key and the bezel ("SWEEP 0.2 Hz · 50 %"), with RATE / DEPTH inside the tray. **S.** 3. **Explain "notch" once on the picture** ("a notch = a frequency the flanger cancels"). **S.** 4. **Gloss LFO here too** ("the slow wobble") — each lab may be the first one opened. **S.** 5. Say what "flange" is in the card ("the rim of a tape reel"). **S.** |
| Hobbyist | Will want through-zero flanging (mentioned on LEARN) and stereo; FDBK toward runaway is fun. |

---

## Page 2 · LEARN (from source)
WHERE TO START: "Scroll to FORMULA / CONCEPT and read it…" — **formula first** (same pattern as Compression, Delay, Phase). Point at the opening paragraph instead. **S.**

## Page 3 · CHECK (from source)
Notch spacing, flanger vs phaser, feedback, the source a comb needs. On-page CHECK YOURSELF: both right answers are the long, self-explaining ones ("A flanger's comb is EVENLY spaced (delay-based); a phaser has a few UNEVEN notches"; "The peaks between the notches grow tall and narrow and ring — the metallic jet builds toward runaway"). **S.**

---

## Lab verdict — FlangerLab

**Beginner's journey:** The "jet" card and the before/after spectrum pair are a reasonable start, and CENTER visibly spreads the teeth. The key teaching claim ("evenly spaced notches") contradicts what the log-scale picture shows, and the same control is called RATE on the frame and SWEEP on the dock.

**3 biggest orientation problems**
1. "Evenly spaced" words vs bunching notches on a log axis.
2. RATE / SWEEP naming mismatch; LFO unexplained here.
3. LEARN starts on the formula.

**3 best things**
1. Jet metaphor + tape-reel origin.
2. Dotted input outline on OUT.
3. CENTER drag = immediate visible change.

**First 30 seconds rewrite**
Card as now (+ "a flange is the rim of a tape reel"). Picture: one spectrum with labelled dips "cancelled here"; pointer on CENTER: "Shorter delay → fewer, wider dips. Drag it." Then SWEEP: "Now the dips move by themselves — that motion is the jet."
