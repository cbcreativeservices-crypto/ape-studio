# G6 · LimiterLab — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. **How reached:** LimiterLab is not in the `#labpreview/` harness, so I walked it in the full app: `localhost:8142/` → OPEN LABS → EXPLORE ADVANCED LABS → Dynamics → Limiter (no lock shown). Shared frame judged in G6_EqLab.md. EXPLORE and LEARN walked; CHECK read from `limiterScreenGuides.ts` (same check card as EqLab).

---

## Page 1 · EXPLORE

| Field | Finding |
|---|---|
| Page | Limiter Lab · EXPLORE (full app route LimiterLab) |
| First look | Intro card "**Limiter**" — seven sentences: "an extreme compressor with a very high or infinite ratio… threshold… clipping… lookahead… master bus… safety net on inputs… squash". Then the Sound Safety Warning for the **fourth** time in my walk (semi-transparent for ~2 s while it fades in, so its text and the lab text overlap and are both unreadable), then the WHAT YOU'RE LEARNING popup. Under it: a grey block on IN, a thin blue line on OUT, a green "LIMIT" pill. Thinks: "a box turns into a line?" |
| Overwhelm | **4 / 5.** The longest intro card so far, plus the popup stack. The picture of a steady tone as a solid grey rectangle does not look like sound. |
| Knows what it is learning? | **Partly.** If they did Compression first, "an extreme compressor" helps; if they came here first (the menu does not say to), "ratio", "threshold" are unknown. |
| Knows what to do first? | **Partly.** WHERE TO START: "Set SOURCE to SINE 440 Hz, tap ▶ and drag CEILING to −25 dB: GR reads about 5 dB." Sound-off: dragging CEILING to −40 dB thins the OUT line, but the bezel GR stays "— dB" so the promised "about 5 dB" never appears. |
| Words they would not know | "Brickwall" (subtitle) · "infinite ratio", "clipping", "lookahead", "master bus", "inputs", "squash" (card) · "CEIL", "RLS", "GR" (bezel) · "−20 dBFS", "engage the brickwall", "transient" (caption) · "−5.0 dB NET" · "peaks between samples", "True-peak (inter-sample) detection" (LAB NOTES). |
| Follows / continues? | The caption admits the default is the wrong source ("A steady tone holds GR still, so RLS has nothing to recover from… Choose CLICK 120"). Same GR mismatch as Compression/Gate: bezel "— dB", LAB NOTES "0.0 dB … update the app to see it". |
| What works | Only three dock keys (CEILING · RLS · SOURCE) — the lightest dock in the dynamics set. CHECK YOURSELF "The limiter's GR meter never moves. What does that mean? … it is doing exactly nothing, which is fine" — reassures a beginner. The caption is honest about this limiter having no lookahead. |
| Suggestions | 1. **Card: two sentences** ("A limiter is a ceiling for loudness. Nothing gets past the line you set.") + "New to this? Do Compression first." **S.** 2. **Default SOURCE = CLICK** so RLS and GR both show something. **S.** 3. **Draw the tone as a wave, not a filled block**, so "flattened at the ceiling" is visible as flattened tops. **M.** 4. **Draw the ceiling as a labelled line on OUT** ("CEILING −40 dB") — it is described as "amber dashed lines on OUT" in LEARN but is hard to see at phone size. **S.** 5. Same GR-readout and safety-sheet fixes as Compression (**SHARED**). |
| Hobbyist | Will want a DRIVE/input gain control (LEARN says "Not on this screen") — a limiter without drive feels backwards to someone who has used one on a master. |

---

## Page 2 · LEARN

| Field | Finding |
|---|---|
| Page | Limiter Lab · LEARN |
| First look | Good opening paragraph: "A limiter puts a ceiling on your level. Think of the compressor from Compression with its ratio pushed toward ∞ (infinity)…" |
| Overwhelm | **4 / 5.** CONTROLS lists CEILING and RLS (on screen) and then **five** "Not on this screen" controls: Threshold / Input Gain (Drive), Attack ADV, Lookahead, True-Peak / ISP mode, Character / Style ADV. |
| Knows what it is learning? | **Yes.** |
| Knows what to do first? | **Partly** — popup (source): "Scroll to the CEILING and RLS entries." Reasonable. |
| Words they would not know | "dBTP", "true peak", "inter-sample peaks (ISP)", "samples", "chain", "master". |
| Follows / continues? | Until the "not on this screen" run. |
| What works | "Engineers count on it to catch every peak, so they put nothing after it that could raise the level again." — a real-work reason to care. |
| Suggestions | 1. Fold the five absent controls under "On real limiters (later)". **S.** 2. Define "sample" before "inter-sample". **S.** |
| Hobbyist | The true-peak / −1 dBTP note is what they came for. |

---

## Page 3 · CHECK (from source)
Review of the ceiling rule, working out GR, where a limiter belongs in the chain, why masters leave a margin. Same card frame. Note the same answer-length tell on the EXPLORE CHECK YOURSELF ("A compressor with a very high ratio — peaks held at a ceiling" is the long one). **S.**

---

## Lab verdict — LimiterLab

**Beginner's journey:** The simplest dynamics lab to operate (three keys), but the arrival is the heaviest: a seven-sentence card full of mixing jargon, the safety sheet again, then a picture of a grey block turning into a thin line. The default tone hides release; the bezel never shows the GR number the guide promises. LEARN's first paragraph rescues the idea in plain words.

**3 biggest orientation problems**
1. Overlong, jargon-heavy intro card; no "do Compression first" pointer.
2. Default source and missing GR readout make the guide's first step unverifiable.
3. LEARN lists five absent controls in the main list.

**3 best things**
1. Three-key dock.
2. "GR never moves — it is doing exactly nothing, which is fine" (calms the beginner).
3. LEARN's "nothing after it that could raise the level again" (reason to care).

**First 30 seconds rewrite**
Card: "**Limiter** — a ceiling for loudness. Nothing gets louder than the line you set." SHOW ME → OUT shows a drum hit wave with a dashed CEILING line; pointer on CEILING: "Drag it down. Watch the tops of the hits get flattened at the line."
