# CHECK C1 report (lab fix round 1, 2026-11-14): S1, S3, F2

Checker C1. Built-in pane, own tab (tab-33), 390x844. Preview http://localhost:8142.

(in progress; saved as I go)

## Log
- Opened tab-33, set 390x844, loaded #labpreview/NoiseLab.
- NoiseLab first load: EXPLORE intro card was already seen (id inv45xw in ape:intro:screenIntroCards), so the "Noise color" term came alone with CONTINUE (correct: no carrier). REMOVED `inv45xw` from `ape:intro:screenIntroCards` (only that id) and reloaded.
- After reload: ONE card: "NOISE LAB ✕ / Noise color / Noise color tells you how a noise spreads its energy across pitches. White noise sounds hissy, while pink noise sounds fuller and more balanced. / WHAT YOU'RE LEARNING … / WHERE TO START … / ⓘ EXPLAIN THIS SCREEN / GOT IT". No CONTINUE sheet. Header "HELP ⓘ ▶". Well line "Sound off? Each color still shows its tilt: watch the line and SLOPE."
- GOT IT (real click): both flags written (inv45xw back in the card list; term:c4bfb4c2-… = "noise color" added to ape:intro:labTerms). Then SOUND SAFETY WARNING came alone.
- Real-finger dim test (real clicks in the pane): 3 taps above the card 1 s apart, 3 taps below the card, one short press-drag on the dim: the sheet stayed every time. ENABLE aria "Enable sound. Unavailable until you tick the box at the end of the warning." aria-disabled=true; both buttons at y 680-780 of 844 (visible without scrolling). Footnote reads "This warning appears once each time you open the app, until you enable sound. …".
- KEEP SOUND OFF, then header ▶ ("Play noise"): no sheet. Sound-off line stays at the top of the well.
