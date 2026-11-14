# G7 · EarTrainingLab (Ear Training Lab, hub + 14 modules) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/EarTrainingLab` (hub) and `#labpreview/EarModule/<id>`.
**What was walked and why not more:** the hub (with its term card and intro), and three module drill pages on screen — Frequency Recognition (I answered one trial, without playing, to see the feedback), EQ Recognition and Polarity & Phase. (First pass only — the SECOND PASS at the end of this file opened all 11 remaining modules and WHAT'S LEFT on screen.) In the first pass the other 11 modules (band, noise, defect, stereo, loudness, delay, reverb, compression, pitch, comb, clipping) were not opened one by one: every module is the same drill frame whose only task is to LISTEN and name what you heard — **needs sound**, so a sound-off walk of each would only repeat the frame. I read their "WHAT YOU'RE LEARNING / WHERE TO START" text in `src/screens/lab/eartraining/earTrainingScreenGuides.ts` and judge the words below. (Note for the coordinator: my one answered trial is a normal tap and may have written a "last 20" score for Frequency Recognition in this browser's saved data.)

## Hub · EAR TRAINING LAB
| Field | Finding |
|---|---|
| First look | Term card "Ear training — training your ears the way a musician trains for pitch… It turns vague reactions into clear decisions at the desk." Behind it: a paragraph, a headphones line, and a list of 14 numbered modules (accordion rows), then FINISH · SEE WHAT'S LEFT ›. Thinks: "a course of listening tests". |
| Overwhelm | 2–3 — calm list, but 14 items with no grouping or suggested order beyond the numbers. |
| Knows what it is learning? | Yes. Term card is one of the best in my group (clear, a reason to care: "clear decisions at the desk"). Hub line: "The habit this lab builds is hearing something and knowing what the measurement will say before you look." |
| Knows what to do first? | Yes: intro "Tap Frequency Recognition to read its description, then tap OPEN. Play one ten-trial round, then come back with ‹ and pick your next module." |
| Words they would not know | analyzers, "the level adapts on your last twenty answers at the current level" (adaptive), program beds, emulated processors. |
| Follows / continues? | Yes. |
| What works | Honest coaching ("Short focused sets beat an hour of grinding… give it a full twenty before expecting it to move"). "All fourteen modules are open to you." |
| Suggestions | 1. (M) Group the 14 into 3–4 families with a suggested path: "Tone (1–4) · Level & dynamics (7, 10, 14) · Time & space (6, 8, 9, 12, 13) · Faults & pitch (5, 11)". A beginner cannot tell that Comb Filtering assumes Delay and Polarity. 2. (S) Explain the adaptive level in one line under each row ("Level 1 of 4 — moves up after 20 good answers"). |
| Hobbyist | Exactly what they want; may start at EQ Recognition. |

## Module drill frame (judged on Frequency Recognition, EQ Recognition, Polarity & Phase)
| Field | Finding |
|---|---|
| First look | Title + "Level 1/4 · Octave centers", a "— last 20" score chip, a headphones warning, LISTEN FOR coaching, then "Trial 1 of 10 · Streak 0", a question ("Which clip is 250 Hz?"), ▶ A / ▶ B / ▶ C play buttons and separate answer buttons (Clip A / Clip B / Clip C). |
| Overwhelm | 2 — clean, one question at a time. |
| Knows what it is learning? | Yes (each module's intro is specific: "Where frequencies sit by ear, using 1 kHz as your anchor"). |
| Knows what to do first? | Yes: play, then answer. LISTEN FOR is excellent coaching ("Anchor 1 kHz in your head first. Below it tones gain weight, then boom; above it, edge, then sizzle."; EQ: "Ask what B has MORE of… never which is louder; they are level-matched"). |
| Words they would not know | Hz / kHz, octave centers, sub-bass, level-matched, boost / cut, low-shelf, LF, polarity, summed, "Two mic copies, summed twice". |
| Follows / continues? | You can answer WITHOUT playing anything — I tapped "Clip A" with no sound, got "CORRECT · A = 250 Hz · B = 8 kHz · C = 16 kHz", and the header jumped to "100% · last 20". A beginner who taps before listening (or guesses) gets a score that means nothing and moves the adaptive level. The feedback itself is good: the truth line, "Hear it again with the answer in mind — the ▶ buttons above still play", a SEE IT analyzer, NEXT TRIAL ›. In the web preview the SEE IT chart looked empty (only the A/B/C legend) — likely because nothing played; on a phone it should draw. |
| What works | LISTEN FOR coaching; "hear it again with the answer in mind"; the truth line naming every clip; per-module headphone notes saying when headphones truly matter ("Phone speakers lose most of the low end: 63–80 Hz is absent…") with a tick-box to skip sub-bass trials. |
| Suggestions | 1. (M) Keep answer buttons dimmed until each clip has been played at least once ("Play all clips first"). This protects the score and teaches the habit the lab is about. 2. (S) "100% · last 20" after ONE answer is misleading; show "1 answer so far" until there are 20. 3. (S) "Trial 1 of 10" is an N-of-total counter (owner rule); "Round of 10 · trial 1" or dots. 4. (S) Polarity question "Two mic copies, summed twice. Which sum is fuller?" — say "Two microphones on one drum, mixed together. In one mix a mic is flipped. Which sounds fuller?" |
| Hobbyist | Will love it; the level-matched EQ comparison is a pro habit. |

## The other 11 modules (words only, from their guides — needs sound to walk)
| Module | Beginner reading of WHAT YOU'RE LEARNING / WHERE TO START |
|---|---|
| Band Identification | Clear ("the band names engineers use, from Sub Bass to Air"). |
| Noise & Waveform ID | Clear; "dashed slope guides" needs NoiseLab first — say so. |
| Audio Defect Recognition | Clear; "steady or one-off?" is a great first question. |
| Stereo Recognition | Hard words: goniometer, correlation ("corr") — needs a one-line plain gloss. |
| Loudness Recognition | Excellent hook: "6 dB is obvious, 1 dB is near the smallest change most people notice, and louder usually sounds better." |
| Delay Recognition | Clear (echo → slap → blur). |
| Reverb Recognition | RT60, density, bloom — RT60 unexplained in the intro. |
| Compression Recognition | Clear and honest ("can seem better only because it's louder"). |
| Pitch Recognition | "sing the step between them" — beginners may not know how; offer "or just say higher / lower". |
| Polarity & Phase | See frame row; "summed" is jargon. |
| Comb Filtering | "evenly spaced notches" is jargon; suggest "a hollow, tube-like colour" first (it is in WHERE TO START — move it up). |
| Clipping Recognition | Clear; "gain stage", "headroom" need glosses. |

## Lab verdict — EarTrainingLab
**Beginner's journey:** The best-motivated lab in my group: the term card says why it matters, the hub says how to practise, and each drill coaches what to listen for and then shows the answer on an analyzer. Its whole value is sound, so a sound-off beginner gets almost nothing — and the drill lets them answer without playing, which produces a fake score. The 14-module list has no grouping or path.

**3 biggest orientation problems**
1. Answers accepted before any clip is played; score display after one answer reads like a final percentage.
2. 14 ungrouped modules with hidden prerequisites (Comb needs Delay/Polarity; Noise needs NoiseLab).
3. A few modules lead with jargon (goniometer, RT60, notches, summed).

**3 best things**
1. LISTEN FOR coaching on every drill.
2. Truth line + "hear it again with the answer in mind" + SEE IT.
3. Honest practice advice and per-module headphone notes.

**First 30 seconds rewrite:** "Ear training is like learning to name colours, but for sound. Start with Frequency Recognition: you'll hear three tones and pick the one we name. Play all three first, then answer. Ten tries a round; your level rises as you get them right." Modules shown in four labelled groups with a "start here" badge on module 1.

---
# SECOND PASS — all 14 module pages opened on screen (coordinator: no depth cut for time)
Each page was opened at 390 x 844, its intro and LISTEN FOR read, and its answer controls looked at. The drills themselves need sound (real blocker); I answered one extra trial (Clipping) to see the feedback page, and opened the lab's WHAT'S LEFT page.

| Module | Level / question shown | LISTEN FOR and headphone note (beginner reading) | Notes and suggestions |
|---|---|---|---|
| 3 · Band Identification | "Level 1/4 · ±12 dB, 4 coarse bands"; "Which band changed from A to B?" (Bass / Mid / Presence / Brilliance); SOURCE Synth/Piano/Guitar. | "Name the region, not a number: boom (Bass), mud (Low Mid), honk (Mid), bite (Upper Mid), edge (Presence), sparkle (Brilliance)." — the best plain-word vocabulary in the lab. | Keep. The level subtitle "±12 dB" is the only jargon. |
| 4 · Noise & Waveform ID | "Level 1/3 · Noises vs tones, separated"; one ▶ and three answers (White / Pink / Brown noise). | "Noise: how much rumble versus hiss… Tones: hollow (square), buzzy (saw), or soft (triangle)?" — plain. Note says brown noise loses its rumble on phone speakers. | Good; link to NoiseLab for a refresher ("Never heard noise colours? Noise Lab first"). |
| 5 · Audio Defect Recognition | "Six common defects, solo"; answers Hum / Hiss / Click / Distortion / Clipping / Dropout. | "Steady or one-off? … smooth hum versus edgy buzz." — excellent first question. | DISTORTION and CLIPPING are both answers; a beginner cannot tell them apart and nothing on the page explains the difference before answering. (S) One line each in LISTEN FOR, or merge at Level 1. |
| 6 · Stereo Recognition | A gate: "HEADPHONES REQUIRED — phone speakers collapse it, so scoring only counts on headphones." and an I'M ON HEADPHONES button; nothing else until tapped. | Clear and honest. | A good model for "needs X" gating. (I did not tap I'M ON HEADPHONES — it would self-declare equipment I don't have.) Intro words goniometer and "corr (correlation)" still need a one-line gloss. |
| 7 · Loudness Recognition | "Level 1/4 · 6 dB steps"; "Which is louder?" A / B. | "6 dB is 'obviously', 1 dB is 'I think'." — superb plain anchor for a decibel. | Note line "Relative levels survive any transducer" — "transducer" is jargon; say "any speaker or headphones". |
| 8 · Delay Recognition | "Level 1/4 · 500 ms — with 250 ms comparisons"; "About how long is the delay?" (50 / 100 / 250 / 500 ms). | "Find the repeat after each pluck and feel the gap. Long gaps read as an echo; short ones blur into thickness." — plain. | Note "Temporal, not spectral — any playback works" is jargon; "ms" not spelled out. |
| 9 · Reverb Recognition | "Level 1/5 · Dry vs wet"; "Which clip has reverb on it?" | "Ignore the notes and hear the tail…" — plain. | "Dry vs wet" in the level name is unexplained for a beginner ("dry = no reverb"). |
| 10 · Compression Recognition | "Level 1/4 · None vs heavy"; A / B. | "Same loudness, different shape: do the hits snap, or sit down flat?" — plain and vivid. Honest note: "A drum pattern made by the app… Levels 1–3 play quieter so no hit ever clips." | Keep. |
| 11 · Pitch Recognition | "Level 1/5 · Octave apart + 3 intervals"; "Which note is higher?" A / B. | "Hum the first note, then the second — does it land above or below?" | Friendly; "sing the two notes as one step" for intervals may intimidate; offer "or just say higher / lower". |
| 12 · Polarity & Phase | (first pass) | (first pass) | — |
| 13 · Comb Filtering | "Level 1/4 · Copy at 0 dB — deep combs"; A / B. | "Hollow, phasey, 'in a tube'… evenly spaced bites out of the tone." Note: "Room reflections add their own combs over speakers — genuinely confusing." | Honest. "Copy at 0 dB" in the subtitle is jargon. |
| 14 · Clipping Recognition | "Level 1/4 · Clean vs severe"; A / B. Answered B (no sound): "CORRECT · Severe: 10 dB into the peaks — square-ish, buzzing, unmistakable. Loudness-matched — listen for the buzz, not the volume." + SEE IT caption "Hard clipping sprays new distortion products across the spectrum, most visibly at the top." | "Clipping adds crunch or buzz on the loudest hits only — the softer material between hits stays clean." | Same answer-without-listening issue as Frequency (header jumped to "100% last 20" after one guess). SEE IT drew no chart in the preview (only the A/B legend) — likely because nothing was played. |

**WHAT'S LEFT (from FINISH · SEE WHAT'S LEFT ›):** lists all 14 modules, each with its status and its exact rule — "Not tried yet · clear level 2 at 80 % over 20 answers to count"; Clipping showed "Tried · level 1 of 4 · 1 answer". A clear, honest finish rule (like DrumTuning's). Two notes: (1) my earlier Frequency answer (first pass, before a page reload) showed as "Not tried yet", so the "100% last 20" chip I saw then was not kept — fine for a preview, but a learner who reloads might lose a round. (2) The rule means 14 × at least 20 answers before the lab "counts" — worth saying on the hub up front ("Each module counts after 20 answers at level 2"), not only at the end.

**Second-pass additions to the verdict:** LISTEN FOR is the strongest beginner coaching in my group across all 14 modules (boom/mud/honk/bite/edge/sparkle; 6 dB "obviously" vs 1 dB "I think"; "do the hits snap, or sit down flat?"). The weak spots are the small jargon labels in level subtitles and headphone notes (±12 dB, dry vs wet, copy at 0 dB, temporal not spectral, transducer), the Distortion-vs-Clipping pair in module 5, and — across every module — answers accepted before listening.
Page count for this lab is now: hub + 14 module pages + WHAT'S LEFT = 16 pages on screen.
