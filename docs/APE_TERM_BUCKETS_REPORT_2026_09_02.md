# APE_TERM_BUCKETS_REPORT — curated daily-term buckets
**Run:** Computer B overnight, 2026-09-01 → 2026-09-02 · **Source:** glossary_rows.csv (full-table export)
**Deliverables:** `misunderstoodTerms.json` (1,095) · `oddTerms.json` (1,095) · this report

## 1. Census (verified before starting)
- 26,847 records · 26,847 unique `term` strings (exact) · **0 empty terms · 0 empty definitions** — matches the brief's verified figures.
- Every row carries a populated `common_mistakes` list (median 3 items) — used as primary evidence for Bucket 1.
- Data note: 15 pairs of terms collide when case/whitespace is normalized (e.g. `Nyquist frequency` / `Nyquist Frequency`, `Quantization` / `quantization`) — see CONCERNS §7.
- 919 rows have a blank `category`; 5,863 distinct categories overall (very granular).

## 2. Method in brief
Scripted scoring built generous candidate pools from the export's own signals (`common_mistakes` misconception strength, `difficulty`, `category` domain, family keyword tagging). Every candidate row was then **individually reviewed and its body written by an editorial pass** (16 worker passes + 8 recalibration passes + a final cross-slice dedup/consistency pass and hand-authored backfill by the coordinating editor). Every body is compressed from that row's own `definition` / `plain_english` / `common_mistakes` text — no outside facts. All hard rules were re-validated by script against a fresh read of the CSV at the end: **zero failures**.

One pipeline error was caught and fixed in review: a drafting pass misassigned one body (`Auxiliary Bus` briefly carried a buffer-size body). A systematic term↔body coherence check across all 2,200+ entries found it to be the only misalignment; the body was rewritten from the correct row.

## 3. Bucket 1 — MISUNDERSTOOD: harvest & filters
Candidate pool: 18,798 rows passed the scripted qualifier gate (core/neutral domain + a real conceptual misconception in `common_mistakes`); the top 1,280 by score were editorially reviewed one by one.

Family harvest tags among reviewed candidates (a term can hit several): confusable-pair myths, everyday-word/technical splits, folk-myth carriers, spec-sheet traps, procedure-done-wrong. Final list family mix (used for play-order variety):

| family | final count |
|---|---|
| confusable pairs | 399 |
| myth carriers | 448 |
| procedure traps | 107 |
| spec-sheet traps | 91 |
| everyday words | 50 |
| **total** | **1,095** |

Scripted pre-filters (before editorial review): 644 rows excluded as safety-critical mains/electrical (an `UNSAFE`-flagged mistake plus mains keywords — excluded per brief, never compressed); 95 rows in product/plugin categories; brand/model-pattern terms; role/job titles; definitions under 70 chars; terms over 44 chars.

Editorial cuts (172 of 1,280 reviewed): brand/product/model 59 · duplicate concept 50 · too niche/obscure 41 (best of these were re-routed to ODD review) · job title/off-domain 9 · too-thin definition 3 · other 10.

Cross-slice consistency pass: 50 further drops — acronym+spelled-out duplicates (kept the form people say: dropped `S/N`, `ECM`, `MIDI Data`, `loudness K-weighted full scale`…) and repeated-myth clusters trimmed to their best 1–3 carriers (the momentary-vs-integrated loudness myth appeared on 6 terms, the inter-sample-peak myth on 8, the monitor-level myth on 4). Replaced from the next-ranked unreviewed candidates with freshly authored bodies (42) so the list holds 1,095 without padding.

## 4. Bucket 2 — ODD: harvest & filters
ODD needed two harvests: the first pool over-weighted dry exotic-science jargon and yielded only 473 keeps from 2,200 reviewed — the reviewers were explicitly told never to pad, and they didn't. A second, better-targeted harvest (vintage media, stage/theatre culture, tonal descriptors, instrument lore, psychoacoustic illusions, delightful exotica) reviewed 1,650 more and added 440; a calibrated second pass over borderline cuts reclaimed 201. After dedupe, mutual exclusion and a 17-entry concept-dupe trim (e.g. `AMT` vs `Air-motion transformer`, `Print-through ratio` vs `Print-through`, `Deep sound channel` vs `SOFAR channel`): **1,095**.

| family | final count |
|---|---|
| historical / vintage | 312 |
| exotic strays (underwater, animal, archaeology, space…) | 324 |
| studio/stage slang | 177 |
| psychoacoustic oddities | 143 |
| regional / cross-trade | 89 |
| onomatopoeia & descriptors | 50 |
| **total** | **1,095** |

Editorial cuts across both ODD waves (3,850 reviewed − 913 first-pass keeps): dry/needs-a-lecture 1,012 · too common for this bucket 734 · duplicate concept 480 · brand/product/model 389 · too thin 78 · niche-without-delight 68 · other ~176. (201 of these were reclaimed on the calibrated second pass.)

## 5. Ordering (file order = play order)
Both files were ordered by constraint repair: **no two adjacent entries share a family; no two adjacent entries share a glossary category; no monotone-alphabetical run of 4+ anywhere** (monotone triples reduced to 10 in MIS and 2 in ODD versus ~364 expected from a random shuffle). The strongest entries are stratified across the whole three-year span rather than front-loaded — a year-3 subscriber gets the same hit rate as day 1.

## 6. Validation (scripted, zero failures)
- `term` byte-matches a row in glossary_rows.csv: **2,190 / 2,190**
- body ≤ 160 chars: all (MIS mean 150, max 160; ODD mean 150, max 160); plain text, no markdown/emoji/line breaks
- no term twice within a file; **no term in both files** (checked after case/plural/hyphen normalization)
- title-friendliness: 97.6% of MIS terms and 97.9% of ODD terms are ≤ 32 chars

## 7. CONCERNS — for the owner's eyes
Nothing in the export looked factually *wrong* in a way that blocked curation, but these data-quality items deserve attention:
1. **15 normalized-duplicate term pairs** (case/spacing variants of the same term under different categories): Auditory-Filter Asymmetry, Binaural Interference, Binaural Sluggishness, Categorical Loudness Scaling, Cone of Confusion, Damping Factor, Diagnostic Rhyme Test, Free Field, Informational Masking, Nyquist Frequency, Out of phase, Quantization, Signal-to-Noise Ratio, Signal-to-Noise-and-Distortion Ratio, Structure-borne noise. Deep-linking by term may behave oddly for these; at most one variant of each was used.
2. **Same concept under multiple term rows** beyond case variants: LUFS exists as `LUFS`, `LUFS (Loudness Units Full Scale)` and `loudness units relative to full scale`; pads as `Pad -6 dB` / `-12` / `-20`; electret power myth on three rows. Harmless for the app, but bloats the glossary.
3. **Off-domain rows** in an audio glossary: `QLED`, `LED`, `pixel`, `Digital light processing`, `Color-grading theater`, `Jacob's ladder`, `Gravity Wave` (fluid physics), `Break-Even Point`, `Accounts Receivable`. Excluded from both buckets.
4. **26 too-thin definitions** among otherwise-qualifying common terms (one-line definitions that can't ground a correction), e.g. `Ring Modulation` ("Multiplying two signals to create inharmonic metallic/bell tones."), `Upstage`, `Green Room`, `USB MIDI`, `Top-Down Mixing`, `Strike`. Excluded; worth expanding in the glossary itself.
5. **644 rows carry `UNSAFE:`-prefixed mains/electrical mistakes** — excluded from MISUNDERSTOOD per the brief's safety rule rather than compressed into one line.
6. `Uncomfortable loudness level` and several audiology rows blur clinical vs studio senses; the few kept were the ones whose one-line correction stands on the row's own text.
7. The two buckets deliberately avoid each other, but the glossary itself files near-identical content under both common and obscure names (e.g. `Larsen effect` vs feedback rows) — the ODD entry was kept only where the odd name is the delight.

## 8. Previews — 20 spread entries each (day number = file position)

### MISUNDERSTOOD
| day | family | term | body |
|---|---|---|---|
| 1 | myth | Snare batter head | Myth: cranking the batter head tighter always adds more crack. Actually over-tightening chokes the drum's tone and stresses the head instead of improving it. |
| 58 | confusable | Fluctuation strength | Studio myth: fluctuation strength and roughness describe the same wobble. Actually fluctuation strength peaks near 4 Hz modulation, roughness near 70 Hz. |
| 115 | myth | Snare layering | The myth: blending a sample under the snare always makes it bigger. Actually without checking phase, the combined hit can sound thinner. |
| 172 | confusable | Short circuit | Myth: a short circuit and an open circuit are the same fault. Actually a short is near-zero resistance where nothing should connect; an open is a break. |
| 229 | myth | Drop impact | Myth: sheer loudness equals impact. Actually heavy limiting can make a drop louder while killing its punch — contrast before it matters more. |
| 286 | confusable | quieting sensitivity | Widely believed: quieting sensitivity is just plain sensitivity. Really, it's tied to a stated noise-reduction level, so mismatched figures aren't comparable. |
| 343 | myth | Pad Switch | Common belief: a pad switch fixes any distortion on loud sources. Actually if the capsule itself overloads, a pad placed after it won't cure the problem. |
| 400 | confusable | Button microphone | The myth: a button microphone means a modern small condenser. Actually the name comes from the noisy carbon-button element, not today's mini condensers. |
| 457 | myth | Gain structure | Common belief: gain structure just means the master volume fader. Actually it's the level set at every stage, mic to output, so each keeps headroom. |
| 514 | confusable | Auxiliary Bus | Myth: an aux send feeds the main mix. It feeds only the auxiliary bus - a separate mix for monitors, headphones or effects, independent of the mains. |
| 571 | myth | Dynamic impact | Myth: louder always means more impact. Actually impact comes from the contrast between loud and quiet - squash that gap and the punch disappears. |
| 628 | procedure | on-air master control | Myth: automation removes the need to monitor a broadcast. Wrong-source and stuck-file failures are exactly what automation misses but a listener catches. |
| 685 | myth | dBZ | dBZ looks like it must mean the same thing every time you see it. In acoustics it's flat Z-weighting; in radar it's an unrelated reflectivity unit. |
| 742 | procedure | Podcast quality control | Common belief: checking peak meters is enough QC before release. Actually integrated loudness (LUFS) against a platform target is what really needs checking. |
| 799 | spec | Dynamic range specification | A 24-bit converter delivers its full 144 dB of dynamic range? Not quite — analog noise limits real converters to roughly 120 dB, spec sheets aside. |
| 856 | spec | Isobar plot | Myth: an isobar's -6 dB line marks an absolute SPL value. Actually it's a relative contour, showing where level drops 6 dB below on-axis, not a fixed loudness. |
| 913 | myth | Networked amplifier monitoring | The myth: amplifier monitoring software can fix a fault. Actually it only reports status like temperature and level - repairs still happen at the rack. |
| 970 | everyday | Double bus | Myth: sending a channel to two mix buses is always harmless. Actually if those buses recombine downstream, the signal doubles and can comb-filter. |
| 1027 | confusable | I2S microphone | Studio myth: I2S and I2C are the same bus. Actually I2S carries digital audio over three lines; I2C is an unrelated chip-control bus with a different job. |
| 1084 | spec | Quantization noise model | Common belief: 6.02N + 1.76 dB gives exact noise for any signal. Actually it's a model built on a full-scale sine — it breaks down for quiet material. |

### ODD
| day | family | term | body |
|---|---|---|---|
| 1 | exotic | Kaval overblow break | On the kaval, a Balkan rim-blown flute, blow too hard and the note doesn't rise smoothly - it jumps straight to the next harmonic, cracking at the break. |
| 58 | historical | MDM | Modular digital multitrack recorders of the 1990s could link together to grow track count - Alesis ADAT on S-VHS tape battled Tascam DTRS on Hi8 for dominance. |
| 115 | exotic | Room impulse signature | Every room stamps recordings with its own reverberant fingerprint, so a sudden change in that print, mid-recording, can betray a hidden edit. |
| 172 | historical | Vactrol | A vactrol pairs a tiny glowing LED with a light-sensitive resistor sealed in one capsule, so one circuit can control another using nothing but light. |
| 229 | exotic | Deep sound channel axis | Sound near the deep sound channel's axis, where ocean sound speed bottoms out, stays trapped and can travel thousands of kilometers - how whales call so far. |
| 286 | historical | Hum-bucking winding | A hum-bucking winding cancels hum via a second, oppositely-wound coil - outside noise cancels across both, while the signal adds: the guitar humbucker's trick. |
| 343 | exotic | Containerless Processing | Containerless processing floats a sample in mid-air on sound so it never touches a wall while it melts or cools - clean, and deeply supercoolable. |
| 400 | exotic | Supersonic bullet crack | A bullet outrunning sound trails its own sonic boom - the crack of that shockwave actually reaches a nearby mic before the gunshot's muzzle blast does. |
| 457 | historical | Bias whistle | Bias whistle: an audible tone born when two tape machines' ultrasonic bias signals secretly beat together during dubbing, conjuring sound from nowhere. |
| 514 | psychoacoustic | Perceptual masking in codecs | A loud sound genuinely blinds your ears to quiet ones nearby - lossy codecs exploit that on purpose, discarding whatever a loud tone would drown out anyway. |
| 571 | psychoacoustic | McGurk effect | Mismatch a mouthed syllable with a different spoken one and most people hear a third sound nobody said - the McGurk effect. Shut your eyes and it disappears. |
| 628 | slang | Hang drum | Everyone calls it a Hang drum, but Hang is one Swiss maker's trademark - the actual family name for these UFO-shaped steel instruments is handpan. |
| 685 | slang | Freeze spray test | Some faults only appear once a part gets hot - technicians blast it with freeze spray mid-fault, and if the problem clears instantly, they've found the culprit. |
| 742 | psychoacoustic | Reflection density growth | Echoes in a room don't trickle in steadily - their count grows with the square of elapsed time, so early reflections thicken fast into a smooth wash. |
| 799 | regional | Bilabial matching | Dubbing writers hunt for the instant an actor's lips visibly close on p, b or m, and place a matching lip-closing sound right there - miss it and it jumps out. |
| 856 | historical | Lacquer disc | The first physical copy of a mastered record isn't vinyl - it's an aluminum disc coated in soft lacquer, later electroplated into the metal press parts. |
| 913 | slang | Fill pumping | Mismatched room-tone levels between edits make a mix's supposed silence visibly breathe - swelling and fading in time with the cuts. |
| 970 | psychoacoustic | Sonic control | There's a name for weaponizing sound against people: sonic control spans calming background music to piercing anti-loitering devices built to drive you away. |
| 1027 | exotic | F-hole radiation | The f-shaped holes on a violin or archtop guitar aren't just decoration - much of the low end escapes through them, acting like the ported vents on a speaker. |
| 1084 | historical | Splice blocking | When old splicing-tape glue softens in storage, it can weld one loop of tape to the next - unwinding fights the very join meant to hold it together. |

---
*All 2,190 bodies are user-facing copy pending owner ratification. The JSON files are drop-in replacements for `src/features/notifications/curated/misunderstoodTerms.json` and `oddTerms.json`.*
