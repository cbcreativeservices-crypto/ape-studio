# Checker C2 report (lab fix round 1, 2026-11-14)

Scope: S2 (check card, CONTENTS popup, end screen), S4 (recap + next lab), F4 (Mixing, Mastering, Pre/Post-Production), F3 (Game Audio, Stage Plot), plus the Career Finder text fixes.
Browser: built-in pane, one own tab, 390x844 (320 where width matters). Sound always KEEP SOUND OFF. PRINT / SHARE / DOWNLOAD never pressed.

Summary: (in progress)

| Lab | Fix (group + item #) | Steps | Seen | Result |
|---|---|---|---|---|
| Gate | S2 #1/#2/P2-1 check card | CHECK, Q1 tap "Turns it up…" (1st miss), then "Compresses it…" (2nd different miss); Q2 tap "cut to complete silence" twice (same miss), then right | 1st miss: "NOT QUITE — TRY ANOTHER / A gate never adds level. Watch the quiet tail…" (no explanation). 2nd different miss: reason "A ratio is a compressor's control…" + "THE EXPLANATION …". Same wrong option twice: reason only, no explanation. Right: "CORRECT / Range sets how far…" | PASS |
| Gate | S2 P2-2 balanced lengths | read all 4 options | Right answers 44/37/76 chars; Q4 right is the longest (76 vs 62) but under 1.25x, not obvious | PASS |
| Gate | S2 #8 FINISH after a pass + end screen | answered all 4 right → "Check passed." → FINISH · SEE WHAT'S LEFT | End layer: LAB COMPLETE, WHAT YOU LEARNED (3 lines), WHERE TO START "Everything here is done. Tap REVIEW below…, or try the lab UP NEXT.", UP NEXT "Limiter". Tapping UP NEXT closed the layer but did not change screen: LimiterLab is not registered in the #labpreview harness (webPreviews.tsx:170-260), so the navigate has no target here. Not an app fault | PASS (next-card tap NOT SEEABLE here; seen working on Autotune) |
| Harmonics | S2 check card | CHECK, Q1 150 Hz then 103 Hz; Q4 Sawtooth | Q1 2nd miss: "Harmonics are multiples of the fundamental, not hertz added on…" + THE EXPLANATION. Q4 1st miss: "A saw uses every harmonic, the even ones included. You left out 2, 4, 6…" only | PASS |
| Harmonics | S2 end screen | FINISH (check not passed) | "WHAT'S LEFT / Only the check is left…", WHERE TO START "Start with the check. Tap here to go to it." (tap → back on CHECK, verified), row CHECK with its own line "The CHECK tab at the top of this lab — every answer correct…", WHAT THIS LAB COVERS (4 lines), AFTER THIS LAB "Distortion" | PASS |
| Autotune | S2 check card + P2-3 prompt names | CHECK, Q4 "Exactly in tune" then "40 cents flat" | 1st: "Only 100% lands on the grid line. At 50% the pull stops partway." 2nd: "That would be AMOUNT at OFF…" (AMOUNT 0 reads OFF, AutotuneLabScreen.tsx:94) + THE EXPLANATION. Q2/Q3 prompts say "SPEED at FAST — SNAP" / "SLOW — GLIDE" | PASS |
| Autotune | S2 end screen + S4 next lab | FINISH → AFTER THIS LAB "Tuning & Temperament Lab" tapped | WHAT THIS LAB COVERS (4 lines); the card opened the Tuning & Temperament Lab (title "TuningLab", "Welcome and Listening Setup") | PASS |
| Reverb | S2 P2-1 per-option reasons | code read (no #labpreview route for ReverbLab) | understandingChecks.ts:405-468: every wrong option of all 4 questions has a `why`; control names match fxLabConfigs.tsx:503-536 (RT60 (DECAY TIME), PRE-DELAY, HF DAMPING DARK 2k / BRIGHT 12k, MIX) | PASS by code; NOT SEEABLE on screen |

## FAIL list

(in progress)
