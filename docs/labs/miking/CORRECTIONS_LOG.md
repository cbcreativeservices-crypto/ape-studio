# Miking Labs: CORRECTIONS LOG

Owner decision (MIKING_LABS_PLAN_2026_10_04.md §6): Claude fixes source errors in the APP
text and logs each one here (what, why, source) so the owner can update the documents.
Nothing in `docs/labs/miking/source_text/` is edited; those files stay as the owner wrote
them.

Columns: **id** · lesson + line in the source .txt · what the lesson says · what the app says
instead · why · source for the fix · status.

Status: **APPLIED** = the app text already carries the fix (file named) · **OWNER** = needs
the owner's decision or an edit outside this branch.

---

## M01 Kick Drum (`source_text/Kick-Drum-Miking-Technique-Research.txt`)

### From the engine rulings (ENGINE_BLUEPRINT.md §16.14)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K-01 | L27 | Beta 52A "20 to 30 cm from that head if the drum and mic physically allow it" | "20 to 30 cm (8 to 12 in) from the beater head, **on-axis with the beater**" — the "if the drum and mic physically allow it" caveat is kept as the lab's own safety note, not quoted as Shure's | The guide's row includes "on-axis with beater"; the lesson dropped it, and the zone's geometry depends on it (on the beater line, unlike the 5–7.5 cm row). | S-B52-UG p.3: "20 to 30 cm (8 to 12 in.) from beater head, on-axis with beater." | APPLIED (`lessons/m01Kick/model.ts` zone `b52.far`, `lesson.ts`) |
| K-02 | L29-30 | Row "At the resonant-head or port area": "The e 902 manual describes a more resonant result there" | "At the level of the resonant head" — no "port" | The manual's Position B is "at the level of the resonant head"; it never mentions a port. | SN-902-2019 p.4 (archived), SN-902-DOC (04/2026) | APPLIED (`lesson.ts`, zone `e902.reso`) |
| K-03 | L50 | "Sennheiser specifically recommends turning its e 902 away from the beater strike when less attack is wanted" | Kept as a **labelled trial experiment** ("an aiming experiment to try, checked on the real drum"); it is NOT attributed to Sennheiser's current manual. The 2019 archived PDF is listed in the sources with a note that the current manual dropped the sentence. | The sentence is in the 2019 PDF only; the live manual (v1.3, 04/2026) does not have it, and the lesson's link [3] is dead (404). | SN-902-2019 (Internet Archive 2024-05-30), SN-902-DOC | APPLIED (`lesson.ts` page 3 + page 8) |
| K-04 | L101 / ref [3] | Reference [3] URL `…40681-en-e902_manual_01_2019_en.pdf` | Sources page lists the archived copy and the current online manual | The lesson URL returns 404. | kick/SOURCES.md §f | APPLIED (`lesson.ts` sources) · OWNER: replace the link in the document |
| K-05 | L106 / ref [7] | AKG D112 MkII product page | Facts taken from the AKG cutsheet (same specs) | The product page returns 403 from this machine (bot protection). | AKG-CUT | APPLIED · OWNER: open akg.com/D112MkII.html in a browser to confirm it still resolves |

### From the lesson survey (survey/lab1.md, M01 quality flags) and the kick sources pass

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K-06 | L15 | Beta 52A "has a modified supercardioid pattern" | The pattern field reads **"supercardioid"** (Shure's spec field). "Modified supercardioid" is quoted on the Sources page as Shure's description. The drawn lobe is the IDEAL supercardioid, captioned "ideal model". | Ruling §16.13 D1. Shure uses both words; the spec field is the formal one. | S-B52-UG p.1, p.3, p.5; S-B52-WEB | APPLIED (`data/micTypes.ts`, `lesson.ts`) |
| K-07 | L68 | "a supercardioid has a rear pickup lobe and maximum rejection off the rear axis" (no angle) | Generic supercardioid null "≈ 125° (ideal)"; wherever the Beta 52A is named, the guide's own "120° toward the rear" | Ruling §16.13 D2. Three Shure numbers exist (120°, 125°, 126°); the ideal equation gives 125.26°. | S-B52-UG p.4; S-LIVE p.9; SOURCES_SHARED.md §3 | APPLIED (`physics/polar.ts`, `lesson.ts`) |
| K-08 | L17, L35-36 | Beta 91A: pattern not stated | "Half-cardioid (cardioid in the hemisphere above the mounting surface); keep sound sources within a 60° range above this surface" — and the app draws **no** lobe for it (a half-cardioid is not a first-order free-field pattern; the engine's `unstated`/no-lobe path is used) | The lesson omits the pattern; the survey flagged it; Shure states it. Drawing a full cardioid for a boundary mic would be wrong. | S-B91-UG p.3, p.4, p.6 | APPLIED (`data/micTypes.ts`) |
| K-09 | L23-24 | Row heading "Inside near the batter head" | "Near the batter head (the guide's 5–7.5 cm row)" with the guide's words "slightly off-center from beater" | The Shure guide never says "inside"; "inside" is the lesson's framing. On a ported or intact drum the position is inside the shell only because 5–7.5 cm from the batter head is inside the shell — the app shows that from the geometry instead of asserting it. | kick/SOURCES.md §e (L24) | APPLIED (`lesson.ts`) |
| K-10 | whole lesson | Units mixed (cm in L24/L27, mm in L17/L36) | Dual units everywhere, the source's own unit first: "5 to 7.5 cm (2 to 3 in)", "25 to 152 mm (1 to 6 in)" | Survey flag "Units are mixed"; ruling §16.5. | S-B52-UG p.3 and S-B91-UG p.4 print both units | APPLIED (`engine/model/units.ts`, `lesson.ts`) |
| K-11 | L16 | "DPA recommends its flatter-response condenser approach" (no model) | The cited example is named as provenance only: DPA 4055 ("Open Cardioid", P48), from the article the lesson cites | The lesson leaves the model unnamed; the cited DPA article names it. No brand is drawn. | DPA-KICK; DPA-4055 | APPLIED (`data/micTypes.ts` examples) |
| K-12 | L93 | "DPA's categorical assertion that dynamic mics cannot capture the true natural sound…" | Kept, attributed to DPA as a manufacturer judgement, never taught as fact (as the lesson itself says) | — (no change; recorded so the wording is not "fixed" later by mistake) | DPA-KICK | APPLIED (no change) |
| K-13 | whole lesson | No "no audio examples" statement (the only Lab 1 lesson without one) | The lab is fully silent (owner ruling); the accuracy note says so | Owner decision 2026-10-04 "FULLY SILENT". | plan §6 | APPLIED (`lesson.ts` accuracyDetail) |
| K-14 | L89 | Final task only; no observation sheet | Page 7 adds an OPTIONAL observation sheet (drum, front head, mic type, pattern, zone, distance, aim, notes), kept on the device; it never gates credit | Survey flag "Part 8 is weak". This is an addition, not a correction of a fact. | survey/lab1.md | APPLIED (`pages/PPractice.tsx`) |
| K-15 | L30 / L35 table | e 902 Position A "a few centimeters from the batter head" and Position C "in the middle between the batter head and the resonant head" are not in the lesson's table | Not added as zones in v1; Position B (resonant head) is. A and C are named in words on page 3. | The lesson's table carries only the resonant-head row from the e 902 manual; adding A/C as zones would extend the lesson beyond its own text. | SN-902-2019 p.4 | OWNER: add Positions A and C to the lesson's table? |

## Shared (all lessons)

| id | Where | Says | Correction | Why | Source | Status |
|---|---|---|---|---|---|---|
| C-CALC-1 | Calculator STEREOMIC "3:1 rule minimum spacing" explanation (src/screens/lab/calc/workspaces/micsRf.ts, `threeToOne.explain`, and `mistakes[1]`) | "quiet enough that summing the mics stays clean instead of comb-filtering" / "or bleed combs the mix" | Should say the bleed is about 9.5 dB down, which reduces (does not remove) comb filtering; 3:1 does not guarantee phase coherence | The Kick lesson (L72) and the DPA/Shure references limit the rule; −9.54 dB bleed still combs (dips ≈ −3.5 dB, peaks ≈ +2.5 dB relative to the main mic alone). The Miking Labs never import the calculator's sentence. | Kick L72; lesson ref [12]; SOURCES_SHARED.md §4 | OWNER: ruling §16.10 says fix on `audio-tools-engine` with Comp A's queued items — **not done in this run** (branch rule) |
| C-POL-1 | micspeaker/viz.tsx (0.37/0.63) vs micselect/micSelectData.ts (0.366/0.634) | Two supercardioid coefficient sets | One exact set in the Miking engine; the old labs left alone | Blueprint R10 | SOURCES_SHARED.md §3 | OWNER: separate fix pass |
