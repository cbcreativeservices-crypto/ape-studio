# G6b · LimiterLab — CHECK page walked (G6 judged it from source)

Walked 2026-11-14, sound OFF, tab-5 at 390 x 844. **How reached:** not in the `#labpreview` harness; full app `localhost:8142/` → OPEN LABS → EXPLORE ADVANCED LABS → Dynamics → Limiter (no lock). SOUND SAFETY WARNING appeared on arrival again (closed with KEEP SOUND OFF). EXPLORE and LEARN were walked by G6 (G6_LimiterLab.md).

---

## Page 3 · CHECK (walked: every question wrong first, then right; Q4 wrong twice)

| Field | Finding |
|---|---|
| Page | Limiter Lab · CHECK tab |
| First look | Same calm header as the other checks: "Answer all 4 correctly… no score", "4 still to get right". WHAT YOU'RE LEARNING popup slides in ~1 s later ("the ceiling rule, working out GR, where a limiter belongs in a chain, and why masters leave a margin below 0 dBFS"). |
| Overwhelm | **3 / 5** — higher than Gate/Binaural because of the units: "−20 dBFS", "−25 dBFS", "−1 dBTP", "0 dBFS", "lossy encoding" appear in two of four questions. |
| Knows what it is learning? | **Partly.** "The ceiling rule" is clear; "why masters leave a margin below 0 dBFS" assumes the learner knows what a master is and what 0 dBFS means. |
| Knows what to do first? | **Yes** — tap an answer; popup: "If one stumps you, switch to EXPLORE or LEARN to look it up". |
| Words they would not know | "brickwall" · "CEILING" (fine after EXPLORE) · "dBFS" · "gain reduction" (Q2; "GR" abbreviation is in the lab subtitle) · "processing chain" · "gate" (Q3 option, another lab) · "dBTP" (Q4 — never spelled out in the question) · "final master" · "conversion or lossy encoding" · feedback: "infinite ratio", "transfer curve", "inter-sample peaks", "true-peak detection". |
| Follows / continues? | Yes, mechanically. My wrong picks and the replies: Q1 "always sits exactly at it" → "A limiter behaves like a compressor with an infinite ratio: above the ceiling the transfer curve goes flat. Below it the signal passes untouched." (explains with two terms a beginner lacks — "infinite ratio", "transfer curve" — and assumes Compression was done). Q2 "25 dB" → "**The peaks sit 5 dB above the ceiling (−20 vs −25), so the limiter holds them down by 5 dB.**" — the wrong-answer text states the right number outright, so the retry is free. Q3 "First, before any EQ" → "Its job is a guaranteed ceiling. Any stage placed after it could push the level back over, so it normally sits last." (clear, and the best reason in the set). Q4 "It makes the master louder", then "Meters cannot display 0 dBFS" → same text both times: "The real waveform between samples can peak higher than the samples themselves (inter-sample peaks)…" (fine for a hobbyist; a beginner cannot picture "between samples" without a drawing). After the last ✓ the page ends with "Check passed." and nothing else — no FINISH / next step (same as Gate). |
| What works | Q2 is the best kind of check question: a tiny worked sum the learner can do from the EXPLORE readouts (source −20, ceiling −25). Q3's feedback gives a real-world reason ("any stage after it could push the level back over"). Kind framing, counter, retries. Q2's right answer ("5 dB") is the SHORTEST option, which breaks the long-answer pattern seen elsewhere — good. |
| Suggestions | 1. **Q2 wrong feedback must not give the number**: "25 dB would be the ceiling itself. How far ABOVE the ceiling are the peaks?" Keep the worked sum for CORRECT. **S.** 2. **Q1 feedback in plain words first**: "Think of a low ceiling in a room: you can jump as hard as you like, your head never goes above it. Quieter sound below it is left alone." Then (optional) "— like a compressor with an endless ratio". **S.** 3. **Spell out units at first use in the check**: "dBFS (level inside the computer; 0 is the top)", "dBTP (true peak — the real wave between the samples)". **S.** 4. **Q4: add a 2-line picture** (dots = samples, a curve peaking between two dots above the 0 line) to the feedback, or mark Q4 as a "stretch" question. **M.** 5. **Add an end to the check** ("Check passed ✓ — try a −1 ceiling on EXPLORE, or DONE · BACK TO LABS"), matching Binaural/Stereo. **S, SHARED.** |
| Hobbyist | Will enjoy Q2 and Q4 (inter-sample peaks is a real mastering concern). Q1 and Q3 are easy for them. |

## Lab verdict addendum — LimiterLab CHECK
A good, practical check whose Q2 is a model "use the numbers on the screen" question — but the wrong-answer text hands over the answer, two of the four questions lean on units (dBFS, dBTP) a beginner has not been given in plain words, and the page stops at "Check passed." with no next step.
