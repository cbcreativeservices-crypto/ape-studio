# G6 · DelayLab — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. **How reached:** not in the `#labpreview/` harness; full app `localhost:8142/` → OPEN LABS → EXPLORE ADVANCED LABS → Delay (no lock). Shared frame judged in G6_EqLab.md; here only what is specific. EXPLORE walked in full; LEARN and CHECK judged from `delayScreenGuides.ts` and the on-page CHECK YOURSELF cards (the frame and card layout are identical to EqLab / Compression, already walked).

---

## Page 1 · EXPLORE

| Field | Finding |
|---|---|
| Page | Delay Lab · EXPLORE |
| First look | Intro card "**Delay**": "A delay records your sound and plays it back a moment later, creating an echo… from a single tight echo (a slap-back) to long, rhythmic, fading repeats." — clear and friendly. Then the Sound Safety sheet (5th time in my walk), then the learning popup. Then: grey vertical lines (clicks) on IN, a green DELAY pill, and a dense comb of blue lines of different heights on OUT with a "1 s · 2 s · 3 s" ruler. Thinks: "barcode". |
| Overwhelm | **3 / 5.** The card is calm; the default picture is busy: at 90 BPM with 375 ms and 50 % feedback, the echoes of one click overlap the next click's echoes, so OUT is a forest of lines and you cannot tell which echo belongs to which click. |
| Knows what it is learning? | **Yes** — "echo" is a word everyone knows. Best-understood lab topic in the effects set. |
| Knows what to do first? | **Partly.** WHERE TO START: "Set SOURCE to CLICK 90 and tap ▶. Watch the repeats leave on ▸ OUT. Then step FDBK from 25% to 75%…". The source is already CLICK; ▶ is sound. Without sound, FDBK changes ARE visible: at **0 %** the picture becomes perfectly clear (one grey click → one blue echo, evenly spaced). |
| Words they would not know | "Ping-pong" (subtitle) · "FDBK" (key) · "MIX 50%" · "COLOR 6k" (key, never explained on this screen) · "slap-back" · "DESIGNED RESPONSE — ECHO PATTERN" · "quarter-note at 160 BPM" · "REPEAT DAMPING… loses 0.1 dB at 1 kHz, the CLICK's pitch" · "PINK". |
| Follows / continues? | Partly. **Two different tempos on one screen:** the source is "CLICK · 90 BPM" while LAB NOTES says "That spacing = a quarter-note at 160 BPM — match the delay to the song's tempo and repeats land ON the beat." A beginner will think the delay is set wrong or that the two numbers should match. The FDBK tray (0 · 25 · 50 · 75 %) has no one-line meaning per choice, unlike EQ's TYPE tray. |
| What works | The card. The time ruler under OUT ("1 s · 2 s · 3 s"). LAB NOTES' one-line key: "spacing = delay time, shrinking height = feedback, sides = ping-pong." CHECK YOURSELF "What separates a delay from a reverb?" bridges to the next lab. |
| Suggestions | 1. **Open with FDBK 0 % (or 25 %) and a slower click (e.g. 60 BPM)**, so the first picture is "one click → one echo"; then ask the learner to raise FDBK and watch the trail appear. That is the clearest cause → effect in the lab and it works without sound. **S.** 2. **Resolve the tempo clash**: either express TIME relative to the click on screen ("375 ms = one echo between clicks") or move the 160 BPM sentence to LEARN. **S.** 3. **Add one-line meanings to the FDBK, MIX and COLOR trays** ("FDBK — how many echoes: 0 % = one, 75 % = a long trail"; "MIX — how loud the echoes are vs the original"; "COLOR — darker echoes, like an old tape machine"). **S.** 4. Spell out FDBK → FEEDBACK on the key. **S.** 5. Colour the echoes of one chosen click (e.g. the first) so the eye can follow one click's trail. **M.** |
| Hobbyist | Will want tempo sync (note values) as a control, not a sentence; will like COLOR (tape-style darkening). |

---

## Page 2 · LEARN (from source + frame walked in EqLab)
WHERE TO START (popup, `delayScreenGuides.ts` line 88): "Scroll to FORMULA / CONCEPT and work out a quarter note at 120 BPM." — **formula first again** (same as Compression; also Flanger and Phase). For a beginner, start with the paragraph and the first GUIDED STEP. **S.** The LEARN topics listed (time, feedback, wet / dry, slapback, ping-pong, damping, tempo → ms) are the right set; "wet / dry" needs a one-line definition at first use. **S.**

## Page 3 · CHECK (from source)
Review: tempo → delay time, FEEDBACK, slapback, REPEAT DAMPING. The on-page CHECK YOURSELF shows the answer-length tell again ("Each echo is louder relative to the last, so the trail lasts far longer"; "Delay is distinct repeats; reverb is thousands of reflections blurred into a wash"). **S.**

---

## Lab verdict — DelayLab

**Beginner's journey:** The topic is the most familiar in the effects set ("echo") and the card says it perfectly. The default picture, however, is a barcode of overlapping echoes, and a second tempo (160 BPM) in the notes contradicts the 90 BPM source on screen. Setting FDBK to 0 % produces the ideal beginner picture — the lab already has it, it just does not start there.

**3 biggest orientation problems**
1. Busy default picture (overlapping trails from successive clicks).
2. Two tempos on one screen (90 BPM source, "quarter-note at 160 BPM" note).
3. Trays without meanings; FDBK / COLOR abbreviations.

**3 best things**
1. Intro card in everyday words.
2. Time ruler under OUT + "spacing = time, height = feedback" key.
3. Delay-vs-reverb CHECK YOURSELF as a bridge.

**First 30 seconds rewrite**
Card as now. Then picture at FDBK 0 %: pointer on OUT "Each grey click comes back once, in blue — that's the echo. The gap is TIME." Next: "Tap FEEDBACK → 50 % — now each echo makes another, quieter one."
