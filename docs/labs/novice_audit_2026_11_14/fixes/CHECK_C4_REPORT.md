# CHECK C4 report: F7, F8, F9 (lab fix round 1, 2026-11-14)

Checker C4. Own tab only (built-in pane, 390x844). Preview http://localhost:8142. Read-only except this file.

(in progress; saved as I go)

## Log
- EQ Lab module 1 (`#labpreview/EqModule/spectrum`): on arrival bezel MIC "OFF", well "The microphone is off. Tap MIC, or tap the display, to let it listen to your room." After NEXT then PREV (fresh mount) + 6 s: still OFF. getUserMedia was wrapped on my tab: 0 calls. NOTE: the web build has no mic engine at all (no getUserMedia anywhere in src), so a tap on MIC also does nothing on the web; "start only on tap" is phone-only. Code: SeeingFrequency.tsx:313-322 no auto-start, MIC toggle :343. PASS (web) / phone NOT SEEABLE.
- EQ Lab module 11 (`EqModule/liveEq`, reload): bezel MIC OFF, "The microphone is off. Tap the display, or VIEW › MIC OFF — START, to let it listen to your room." VIEW tray lists "MICROPHONE · MIC OFF — START". PASS.
- Equalizer (`EqLab`): TYPE → HIGH-PASS: bezel GAIN "—", Q "—"; dock keys read LOCKED; tap GAIN prints "GAIN — locked: a pass filter has no gain. It cuts everything past the cutoff on a fixed slope"; LOW-PASS: GAIN "—"/LOCKED, Q 1.4 live; PEAK: GAIN +6 dB and Q 1.4 back (values kept). PASS.
- Equalizer CHECK tab → FINISH · SEE WHAT'S LEFT › → "Where you are · EQUALIZER LAB · Only the check is left … WHERE TO START Start with the check." PASS.
- Compression: sound-off line "Sound off? The drawing shows what you would hear: drag THRESH … On SINE 440 Hz, GR shows the MODEL value." SOURCE → SINE 440 Hz: bezel "GR 15.0 dB MODEL" (a11y "not heard: sound is off") = (−20 − −40)·0.75. BUT the GAIN REDUCTION line below still reads "On the web … nothing is measured here and GR reads — dB … On CLICK, the GR PEAK…" → FAIL-1 (two numbers).
- Compression CHECK YOURSELF card 1: wrong "ratio too high" → "A higher RATIO only acts harder once the sound crosses THRESH…" (no answer); second different wrong "broken" → "Broken is not the only way GR sits at 0…" + explanation. PASS.
