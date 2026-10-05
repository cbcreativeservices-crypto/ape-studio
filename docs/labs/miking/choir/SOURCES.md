# E05 Choirs, Choruses, A Cappella: SOURCES (defines the choir/area-mic register)

Lesson: `source_text/Choirs-Choruses-A-Cappella-Miking-Technique.txt` (`cat -n` lines). Keys: `lead_vocal/SOURCES.md` §0.
Checked 2026-10-05. 3:1 = `lead_vocal/SOURCES.md` §0.2 (mic-to-mic). Arrays = `full_orchestra/SOURCES.md` §A.

## a. Area (choir) microphone placement as published

| Fact | Value (exact) | Source | Confidence | Notes |
|---|---|---|---|---|
| Height/aim (live) | "slightly above the choir and aimed toward the center row" | S-CHOIR | High | |
| Height/distance (live booklet) | "Choral groups: 1 to 3 feet above and 2 to 4 feet in front of the first row of the choir, aimed toward the middle row(s) of the choir, approximately 1 microphone per 15-20 people" | S-LIVE | High | 304.8–914.4 above, 609.6–1219.2 in front (conv.). "above" = above the front-row heads? Text says "above … the first row"; read as above the first-row heads (Medium). |
| One mic (recording booklet) | "a few feet in front of, and a few feet above, the heads of the first row. It should be centered in front of the choir and aimed at the last row"; cardioid "can 'cover' up to 15-20 voices, arranged in a rectangular or wedge-shaped section" | S-REC p.6 | High | |
| Lateral coverage | "one microphone for each lateral section of approximately 6 to 9 feet"; "If the choir is unusually deep (more than 6 or 8 rows), it may be divided into two vertical sections"; figure "0.6 - 1m (2 - 3 ft)" and "1.8 - 3m (6 - 9 ft)" (top view) | S-REC p.6 | High | **E05 L11 / E06 L15 CONFIRMED** — the source is the Shure *recording* booklet, not the choir article. 1828.8–2743.2 mm (conv.). |
| Cardioid pickup angle | "approximately 130 degrees for a cardioid" | S-REC p.6 | High | Coverage fan. |
| Church (live) | "position the mic 2-3 feet in front of the choir with the most sensitive point of the mic aimed toward the back row of the choir, and adjacent mics about 4 – 6 feet apart"; hanging: "not to hang the mics over the heads of the singers, rather than 2'-3' in front of their mouths, aimed at the back row" | S-CHURCH | High | **D-CH1**: 4–6 ft spacing at 2–3 ft from the singers does **not** satisfy mic-to-mic 3:1 at 3 ft (needs ≥ 9 ft); it does at 2 ft only if spacing ≥ 6 ft. The tool shows the ratio rather than choosing. |
| Vertical aim (DPA) | point at the back row; front row at "60°" off axis; back row "1.4 times further away than front row" | DPA-CHOIR | High | Gives a sourced section-view geometry check. |
| Mic count vs level (DPA, 12 singers) | 6 mics: "17 dB" loss at 30 cm/45°; 4 mics: "22.5 dB" (50 cm, 60°); 3 mics: "25.5 dB" (±75°, 60 cm); 2 mics: "≈18 dB" (50 cm, ±90°) vs 1 per singer = 0 dB | DPA-CHOIR | High | Optional readout table "DPA example". |
| Large choir (AKG) | "one stereo microphone plus one spot microphone each for the soprano, alto, tenor, and bass sections"; single mic: "place the vocalists in a semicircle in front of the microphone" (cardioid or omni) | AKG-C414 §4.6.2 | High | E05 L105 CONFIRMED. |
| Choir monitors | "never mix choir mic channels into the choir monitors; it's a sure way to cause feedback" | S-CHOIR | High | L36 CONFIRMED. |
| Minimum mics | "use the minimum number of microphones" (S-REC); "as few mics as possible" (S-CHURCH) | Shure | High | |

## b. Risers (seating-plan builder, choir preset)

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Step rise / depth | "Steps are 18" (457 mm) deep and the rise of each step is 8" (203 mm)" | WENGER-SIG | High |
| Unit widths | "3-Step Riser … 6' (1829 mm) wide at back of third step"; 4-step 78" (1981 mm) storage width; drawing labels 74-1/4" (1886 mm), 4' 5-1/2" (1358 mm), 6' 6-1/4" (1988 mm) | WENGER-SIG | High (widths per tier need the drawing; front-tier width Medium) |
| Back rail | "42" (1067 mm) high back rail" | WENGER-SIG | High |
| Layout | "straight or semi-circular configuration" | WENGER-SIG | High |
| Singers per metre, singer spacing | UNKNOWN | — | drawing default |

## c. Lesson claims checked

| Claim (line) | Verdict |
|---|---|
| L10 "slightly above mouth level and aim at the vocal area"; back row for deep groups | CONFIRMED (S-CHOIR center row; S-REC/S-CHURCH/DPA back row; S-LIVE middle rows) — three aims, all Shure/DPA; tool offers back/middle. |
| L11 "6–9 feet of lateral section width", Shure | **CONFIRMED**, re-cite S-REC p.6 |
| L22 3:1 "2 feet → 6 feet" | CONFIRMED as mic-to-mic (§0.2); add Shure's 3 ft → 9 ft example |
| L36 no choir mics into choir monitors | CONFIRMED |
| L37 hanging mics | add S-CHURCH "2'-3' in front of their mouths, aimed at the back row", "not … over the heads" |
| L105 AKG stereo + SATB spots | CONFIRMED |
| L105 "DPA documents … AB, XY, ORTF" | DPA-CHOIR names ST4011A (ORTF) and ST4006A (A-B) products; geometry from §A |
| L14 "Headphones can misrepresent room width" | no source read; keep as practice note, unsourced |
| L4, L97 "Students", "Teaching exercise" | → "you", "Practice exercise" |
| Header L2 | strip "Pro Audio Training Academy" |
