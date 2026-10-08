# F02 Clothing and Body Movement: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/F02-Clothing-and-Body-Movement-Miking-Technique.txt` (`cat -n` lines).
Checked 2026-10-07 (Claude, preparation pass). Source keys and rules: `foley_footsteps/SOURCES.md` §0.

## a. Facts read today

| Fact | Value (exact) | Source | Confidence |
|---|---|---|---|
| Cloth mic distance | "We found a 1-1.5 meter mic distance is efficient and optimal for recording cloth tracks." | FF-CLOTH | Medium (practice) |
| Farther for some textures | "Sometimes for textures like a rain cover, this distance can be increased to 3 meters." | FF-CLOTH | Medium |
| Mic type | "I have found shotguns work perfectly for this group of Foley." | FF-CLOTH | Medium |
| Held vs worn | holding fabric in hands (about "90%" of the time) vs dressing in the clothes ("especially applicable to winter synthetic fabrics") | FF-CLOTH | Medium |
| Hecker on distance | "if it's far away, then I'll mic far away and if it cuts to a close-up, I'll bring the mic in super close"; interiors: a close mic and one farther for the room; exteriors: one mic | HECKER | Medium |
| Hecker on cloth | warns against "the ball of cloth" — bunched fabric gives undifferentiated noise; use cloth "very precisely and strategically" | HECKER | Medium |
| Bed scenes | "The only time when it's not a great idea to use a lavalier is for scenes shot in bed … the rustle of bed clothes"; "Traditionally we use a boom only for those scenes." | HAYES | Medium |
| Shotgun indoors | SCH-SHOTGUN quotes (`foley_footsteps/SOURCES.md` §c) | SCH-SHOTGUN | High |

## b. Lesson claims checked

| Claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 held or worn; whole jackets/leather sometimes needed [1] | **CONFIRMED** | FF-CLOTH. |
| L5 Hecker warns indiscriminate crumpling [2] | **CONFIRMED** (paraphrase) | HECKER "the ball of cloth". |
| L6 room noise inspection; close vs far tradeoff | PRACTICE / physics (inverse square, S-LIVE) | Keep in words. |
| L13 close detail: "no universal close distance is established here" | **UNSOURCED (honest)** | No number exists → drawing default for the CLOSE start (owner decision O-5). |
| L16, L25, L53 Foley First 1–1.5 m [1] | **CONFIRMED** | FF-CLOTH. |
| L25 "sometimes farther for a rain cover" | **CONFIRMED + number** | FF-CLOTH "can be increased to 3 meters" (correction F02-C2). |
| L19 Hecker farther for long shot, closer for close-up, room mic for interiors [2] | **CONFIRMED** | HECKER. |
| L22 boom over or to the side of the action | PRACTICE (lesson's own) | Boom geometry drawing default. |
| L25 Schoeps: interference-tube rejection frequency-dependent, colored indoors [3] | **CONFIRMED** | SCH-SHOTGUN (stronger wording available). |
| L27 Hayes: bedding noise makes lavs impractical in bed scenes; boom works better [5] | **CONFIRMED** | HAYES. |
| L28 Rycote: stand- and cable-borne thumps, shock mount [6] | **NOT RE-READ** (429) | General practice; keep in words. |
| L30 Hecker interior close + room, exterior one mic [2] | **CONFIRMED** | HECKER. |
| L33 live: monitors in the pattern's rejection; no deliberate feedback [3, 7] | **CONFIRMED** | S-3REASONS: "Aligning floor monitors and side fills with the directional microphone's angle of rejection will give the maximum gain before feedback". |
| L49 safety: no cloth over hot lights / fixtures / connectors; consent to fasten material; qualified rigging | PRACTICE (exact safety, keep) | — |

## c. Corrections (builder logs each)
- **F02-C1** Institutional wording: header "Pro Audio Training Academy"; "Students will compare" (L3); "Guided
  teaching exercise" → "Practice exercise"; "classroom applications" (L83); "Student observation sheet"; "the
  lesson asks students" (L81) → "you".
- **F02-C2** L25 "sometimes farther for a rain cover" → "up to about 3 m for a rain cover" (FF-CLOTH).
- **F02-C3** Cross-links (L93) B04/B05 are Lab 7 lessons not yet built → drop until they ship; F09 is Lab 6 part 2.
- **F02-C4** Brand in ref title only (CCM 41) — record only.

## d. Disagreements
- **D-F02-TYPE**: Foley First "shotguns work perfectly" vs SCHOEPS "a small supercardioid … might yield equal or
  better results" indoors. The lesson already asks for a comparison (L54) — keep.
