# Miking Labs, Lab 5 Ensembles and Voice — Batch 5 research summary (E01–E16, 16 lessons)

Date: 2026-10-05. Researcher: Claude (technical-reference pass; no app code, no sub-agents; nothing committed).
Model: `kick/` SOURCES + GEOMETRY, `BATCH3_RESEARCH_SUMMARY.md`. Owner ruling: the app shows suggested starting
points; these docs stay exact and sourced; every UNKNOWN the picture needs is a **drawing default**
(`placeholder: true`). Survey: `survey/lab5.md`.

Folders (SOURCES.md + GEOMETRY_PROPOSAL.md each): `lead_vocal/ background_vocals/ rap_vocal/ duets_small_vocal/
choir/ childrens_choir/ singer_with_instrument/ acoustic_small_group/ rhythm_section_band/ horn_section/
string_section/ percussion_ensemble/ mixed_classical_ensemble/ full_orchestra/ jazz_combo/ jazz_big_band/`.
**Registers**: Lab 5 source keys, polar facts, the 3:1 rule, NOM, no-provocation rule → `lead_vocal/SOURCES.md` §0;
voice/head model → `lead_vocal/`; stereo arrays (XY, ORTF, AB, M/S, NOS/DIN, Decca, outriggers) and orchestra
seating → `full_orchestra/SOURCES.md` §A/§B; choir area mics + risers → `choir/`; big-band seating → `jazz_big_band/`.

New sourced data not in the lessons: SM58 guide placement rows, proximity "6 to 10 dB below 100 Hz … about 6 mm",
and its 3-to-1 wording; Shure live booklet null angles (super 126°, hyper 110°; rear −12/−6 dB), 3-to-1 "12dB",
NOM 3 dB, choir "1 to 3 feet above and 2 to 4 feet in front … 1 microphone per 15-20 people"; Shure recording
booklet choir "6 to 9 feet" lateral + "aimed at the last row", "between the nose and mouth"; Shure church choir
2–3 ft / 4–6 ft apart; DPA choir 60°/1.4× aim and 4.5:1; SM4 table (vocals 1–6 in, guitar 6–12 in, strings/horns
1–6 ft "equal distance"); Neumann pop screen "at least 10 cm"; ORTF **recording angle 95°** (SCHOEPS); SCHOEPS Decca
figure (2 m, 1.5 m, ≥ 1.5 m between capsules, 0–45° outward, centre −4 to −5 dB, ~40 mm sphere); **published
Decca practice dimensions** incl. outriggers (ex-Decca John Pellowe 1997: tree 3.2 m high, outriggers ~20 ft
apart, 5 ft in front of the strings; Abbey Road Institute ~3 m each side; Tape Op 2 m/1.5 m, 8–10 ft above the
conductor); DPA multimiking > 4 m delay threshold and 25 % method; AKG piano 6 in behind the dampers and 1.5–2 m
single/pair; AKG solo violin 1.8–2.5 m height; Wenger riser 8 in rise × 18 in tread; big-band seating orders;
WHO children's-event limits 94 dB LAeq,15min / 120 dB LCpeak; NSPCC safeguarding; ITU mouth reference point 25 mm.

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | E01 Lead vocal (defines voice/head family) | **READY with defaults** | Shure 10–20, Neumann 20–30, DPA ≤ 10 cm/135 dB, pop angle all CONFIRMED; head dimensions UNKNOWN (drawing default); air-jet cone illustrative; default distance (D-LV1). |
| 2 | E14 Full orchestra (defines array tool + seating builder) | **READY with defaults** | DPA AB 3–4 m / 40–60 cm and supports 1–1.5 m CONFIRMED; Decca + outrigger numbers now published (practice, Medium); owner picks Decca default (SCHOEPS vs Pellowe) and outrigger defaults; seating American/German. |
| 3 | E05 Choirs (defines choir zones + risers) | **READY** | All Shure/DPA numbers CONFIRMED (6–9 ft re-cited to the recording booklet); D-CH1 church spacing vs 3:1 shown as a readout; singer pitch defaults. |
| 4 | E13 Mixed classical | **READY** (array tool) | Delete "final item"; Decca CONFIRMED; trials relabelled. |
| 5 | E16 Big band | **READY with defaults** | Royer/DPA/Xepoleas/Breitberg/NOM CONFIRMED; seating Medium; trials relabelled; observation sheet becomes the shared worksheet. |
| 6 | E11 String quartet/sections | **READY** | Stale cross-ref; quartet order drawing default; height now AKG-sourced (solo violin). |
| 7 | E02 Background vocals | READY after **3:1 rewrite** | Shure 1.5–3 in CONFIRMED; bluegrass CONFIRMED; L30 rewrite; arc radius default. |
| 8 | E03 Rap vocal | READY (E01 variant) | Table "2–6 in" fix; "nose and mouth" now sourced. |
| 9 | E04 Duets | READY after **Ex. 4 rewrite** | No body citations — mapping supplied; radius defaults. |
| 10 | E07 Singer with guitar/piano | READY after **3:1 example + L41 rewrites** | Seated posture offset is an owner default. |
| 11 | E06 Children | READY (**plan view only**) | Safeguarding + exposure sources found (NSPCC UK; WHO via AAO-HNS, Medium); wording approval. |
| 12 | E12 Percussion ensemble | Buildable | Shure rows CONFIRMED (mallet row Medium — check printed page); trials relabelled; no date. |
| 13 | E10 Horn section | Buildable (Batch 3 reuse) | 140 dB unsourced → DPA 128/130 dB; sax right-side position needs expert check. |
| 14 | E09 Complete band | Buildable as a stage-plot page | No numbers; spill/NOM readouts DERIVED only. |
| 15 | E15 Jazz combo | Buildable as a stage-plot page | No numbers; Xepoleas amp move CONFIRMED. |
| 16 | E08 Acoustic small group | Buildable (thin) | Only 3:1; SM4 "equal distance" rule added. |

## 2. Corrections (survey flags resolved first)

1. **3:1 — ONE definition (lead ruling, now sourced three times)**: mic-to-mic ≥ 3 × each mic-to-source
   (S-LIVE p.17/20, SM58 guide, Shure choir article). App: `d(mic_i, mic_j) ≥ 3·max(r_i, r_j)`. Rewrite **E02 L30**
   (lesson says neighbour mic ≥ 3 units from the singer; Shure [3] says mic-to-mic). E04/E05/E06/E08 examples
   consistent; DPA's source-side factor (≈10 dB; 4.5:1 for line-ups) shown as a note only. Never for stereo arrays.
2. **"Ring out" exercises → no-provocation rule**: rewrite **E04 L111** and **E07 L41** (texts in the folders):
   bring level up only to the agreed performance level; at any ring, lower that send at once and fix geometry; never
   raise level to find the feedback point. App never animates/sonifies feedback.
3. **ORTF** = 170 mm / 110° included (SCHOEPS); add recording angle 95°; Shure 6 in / 7 in and DPA "±110°" stay notes.
4. **Decca Tree / outriggers (E14 gap)**: SCHOEPS 2 m × 1.5 m (E13's figure, CONFIRMED) + ≥ 1.5 m rule, 0–45°
   outward turn, centre −4 to −5 dB; practice outriggers ≈ 6.1 m apart, 1.5 m in front of the strings, tree height
   ≈ 3.2 m (Pellowe; ARI). **D-DT1**: Pellowe's own tree was much smaller (5 ft wide, 2.5 ft deep). Add to E14 L21/L46.
5. **Children (E06)**: plan view only (lead). Safeguarding source: NSPCC Learning (supervision, chaperones, contact)
   + England's 2014 Regulations as an example; exposure metric: WHO 2022 children's-event limits 94 dB LAeq,15min
   / 120 dB LCpeak (via AAO-HNS; WHO PDF not retrievable) — proposed L7/L106 wording in `childrens_choir/SOURCES.md`.
   NIOSH named but missing from refs.
6. **Monitor wording** (E01/E02/E04 "in front of the singer" vs E07 "behind the microphone"): same place, CONFIRMED
   by the SM58 guide; one canonical diagram. Null angles from S-LIVE (126°/110°); D-POL note (S-REC "about 65°"
   from the rear axis = 115°; Batch 3 "125°").
7. **Institutional wording**: "Students/student", "Teaching exercise", "instructor recommendation", "classroom
   trial", "The instructor manages PA level" (E16 L122) → "you", "Practice exercise", "suggested trial", "a qualified
   operator". "Pro Audio Training Academy" stripped from lesson headers/body/refs (app name is fine in app chrome).
8. Other fixes: E01 L91 "about 10 cm" → "within 10 cm"; "10 dBFS of headroom" → "about 10 dB (peaks near −10 dBFS)";
   E01 L10 re-cite to DPA studio article ("up to 90°"); E03 table "2–6 in" → DPA 4 in (2–6) or SM4 1–6 in; E03 L31
   re-cite to [1]; E07 L14 3:1 example rewritten with its own distances (≥ 24 in apart); E10 L37 140 dB → DPA 128/130
   dB; E11 L46 stale cross-ref; E13 L5 false "final item"; E13 L81 name DPA's 25 % method and > 4 m threshold;
   E05/E06 6–9 ft re-cited to the Shure recording booklet; E02 duplicate ref; E09 ref [7] and E16 .docx cross-refs →
   in-app links; dates missing on E12–E16.

## 3. Shared families and tools to build once

1. **Voice/head family (frame V)** — `lead_vocal/GEOMETRY_PROPOSAL.md`: lip-point origin, MRP tick (25 mm),
   line-art head (dimensions drawing default), zones (Shure, Neumann, DPA close/loose, stage ≤ 100, SM58 rows,
   below-axis, overhead), pop screen ≥ 100 mm from the mic and tilted, proximity/plosive/sibilance/direct-room
   indicators (only sourced numbers), headset point (maker's instructions), working-zone envelope (E03).
   Used by E01–E07 and every singer in E08–E16.
2. **Stereo-array tool** — `full_orchestra/GEOMETRY_PROPOSAL.md` §2: presets XY (90–135°), ORTF (locked 170/110,
   95° recording-angle wedge), NOS, DIN, AB (DPA 400–600; Shure 914–3048), M/S (width), Decca (SCHOEPS + Pellowe
   variants, ≥ 1.5 m constraint, centre −4/−5 dB), outriggers (practice defaults); heights/positions; Δt readouts via
   the calculator (CALC-C); "no 3:1 inside an array". Used by 10 lessons. Extends Batch 1/4 stereo builder.
3. **Seating-plan / stage-plot builder (frame S)** — plan + section views, conductor's view labels; presets:
   orchestra (American, German), chamber, string quartet arc, choir on Wenger risers (8 in × 18 in), big band
   (standard rows, horseshoe), horn section, percussion stations + movement path, rock/jazz stage plot; tokens from
   Labs 1–4 families; monitor/PA tokens with **null snap** (S-LIVE angles); spill matrix (free-field inverse
   square), **3:1 ratio readout**, NOM penalty 10·log10(NOM), routing-role matrix (PA/monitor/record/stream),
   rigging keep-outs (text only, no rigging geometry), exportable stage-plot fields.
4. **Lab 5 worksheet** — E16's observation sheet generalised (seating sketch export + two-position comparison).
5. **Gain-margin panel** (no feedback simulation): PAG terms, NOM, monitor-in-null state, "margin" readout.

## 4. Builder grouping (5)

1. **Voice I — solo**: E01 lead vocal (first; builds frame V), E03 rap (variant), E07 singer with guitar/piano
   (frame V + Lab 4 guitar/piano frames).
2. **Voice II — groups**: E02 background vocals, E04 duets, E05 choir (choir zones + risers), E06 children (plan
   view only). Needs the seating builder core from group 3 or builds its choir preset first.
3. **Arrays & orchestra**: stereo-array tool + seating builder core, then E14 full orchestra, E13 mixed classical,
   E11 string quartet/sections.
4. **Bands & stage plots**: E09 complete band, E15 jazz combo, E08 acoustic small group (stage-plot preset, spill
   matrix, routing matrix, DI tokens).
5. **Sections**: E10 horn section, E16 big band (seating presets + worksheet), E12 percussion ensemble (stations,
   movement path) — all reuse Batch 1–3 instrument families.

## 5. Sources not reachable / not re-read

WHO safe-listening PDF (IRIS returned HTML; limits read via AAO-HNS), DPA "Decca Tree" page cited by Wikipedia (not
located), ITU-T P.58 / IEC 60318-7 head dimensions (B&K/GRAS PDFs image-only), Shure SM4 HTML guide (client-side;
PDF read instead), Pellowe interview (live site gone; Internet Archive copy read), Sound On Sound articles, Kronos /
Natalie Merchant / Winkler / Vienna case studies, Neumann KMS 104, Royer ribbon do's and don'ts, CDC/NIDCD/OSHA child
pages, Shure piano article — none of these drives a CONFIRMED geometry value. Quartet seating order: no source read
(drawing default).
