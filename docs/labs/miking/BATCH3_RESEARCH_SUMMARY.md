# Miking Labs, Lab 3 Aerophones — Batch 3 research summary (A01–A12, 20 lessons)

Date: 2026-10-05. Researcher: Claude (technical-reference pass; no app code, no sub-agents; nothing committed).
Model: `kick/SOURCES.md` + `kick/GEOMETRY_PROPOSAL.md`, `BATCH2_RESEARCH_SUMMARY.md`, `BATCH4_RESEARCH_SUMMARY.md`.
Owner ruling applied: the app shows only suggested starting points; these docs stay exact and sourced; every
UNKNOWN the picture needs is a **drawing default, not a published figure** (`placeholder: true`).

Folders (each SOURCES.md + GEOMETRY_PROPOSAL.md): `trumpet/ flugelhorn/ trombone/ bass_trombone/ french_horn/
tuba/ euphonium/ soprano_sax/ alto_sax/ tenor_sax/ baritone_sax/ flute/ piccolo/ soprano_clarinet/ bass_clarinet/
oboe/ bassoon/ harmonica/ accordion/ pipe_organ/`. Key registers: **Lab 3 general + brass → `trumpet/SOURCES.md` §0**
(incl. §0.1 polar facts, §0.2 measured directivity); **sax family → `alto_sax/SOURCES.md`** (§1 radiation physics);
**reed woodwinds → `soprano_clarinet/SOURCES.md` §0**; **edge-tone → `flute/SOURCES.md`**; amp → SPK module.

New sourced data that did not exist in the lessons: **measured directivity** (Pätynen & Lokki 2010, 22-mic
anechoic study: brass "radiate constantly in the direction of the bell", woodwind patterns "change with the
played tone", tone-hole cutoffs oboe/clarinet 1500 Hz, bassoon 400–500 Hz, tuba 90° main lobe at 1 kHz via
Meyer); UNSW tone-hole physics (first open hole, flute cutoff ~2 kHz, sax bell cut-in 1.8 kHz tenor / 2.6 kHz
soprano); DPA's instrument table (ranges, SPL: trumpet 128 dB extreme forte at 0.5 m; alto/tenor "up to 130 dB"
at the bell); maker bell diameters (trumpet 123, flugelhorn 151.8, tenor trombone 204.4, bass 241.3, euphonium
300, tuba 443 mm); MDAT per-instrument distances (incl. the first bass-clarinet and bassoon numbers).

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | A01a Trumpet (defines the brass family) | **READY** | DPA 30–50, Shure 1–2 ft, DPA 3 m, clip all CONFIRMED; add MDAT 2–4 ft, Royer 2–5 ft/6 in below, DPA "up to 45º". Instrument outline beyond the 123 bell = drawing defaults. |
| 2 | A02a Tenor trombone | **READY** | Slide positions DERIVED from Yamaha's 2.7 m (0…559 mm, proportions shown); slide/bell offsets drawing defaults; the scene proves L45 (front mic inside the 7th-position sweep). |
| 3 | A05a–d Saxophones (one family, 4 rows) | **READY with defaults** | All Shure/DPA positions CONFIRMED; "last open holes" → first-open-hole wording; Martin 8–15 in/45° **UNREACHABLE** (Sweetwater 403; 2024 archive lacks it; archive confirms 12–24 in and "right elbow"). Every modern sax dimension UNKNOWN (bari Met 967 TRIAL). |
| 4 | A06 Flute (metal + wooden) | **READY** | DPA 5–10 cm / behind-head / ~1 m, Shure booklet rows, U-CLIP CONFIRMED; 660 mm length sourced twice; hands/keys drawing defaults; simple-system flute defaults. |
| 5 | A08a Soprano clarinet (defines the reed-woodwind family) | **READY** | DPA 15–20 cm at one third from the bell CONFIRMED; bell "low fingerings" re-cited to UNSW; length Met TRIAL. |
| 6 | A03 French horn | **READY with defaults** | Rear bell, hand, Shure "aiming toward bell", Rostrup 4 m + front spots CONFIRMED; MDAT "behind… closer to the ground" ADD (opposite school, D-HN1); **bell Ø UNKNOWN** (Yamaha prints "M"); pose defaults; rear-wall slider. |
| 7 | A02b Bass trombone | READY | Bell 241.3 sourced; F/G♭ valves sourced; DPA-VIB "bell vibration" wording over-specific. |
| 8 | A01b Flugelhorn | READY | MDAT 2–4 ft CONFIRMED; pickup mute protrudes 3–4 cm (new number). |
| 9 | A04a Tuba | READY | Bell orientations CONFIRMED (survey flag closed, with context); MDAT 2 ft above (ADD); **Royer R-122 tuba example not found** on the cited page. |
| 10 | A04b Euphonium | READY | MDAT 2 ft above CONFIRMED; YEP-211 bell-front CONFIRMED. |
| 11 | A09a Oboe / A09b Bassoon | READY | DPA template + Shure 1 ft CONFIRMED; bassoon "up/down" resolved; MDAT bassoon 3–4 ft right side 45° down (ADD). |
| 12 | A08b Bass clarinet | READY | DPA bell+holes and "4099S… Bass Clarinet" CONFIRMED; MDAT 2–4 ft replaces "no sourced number". |
| 13 | A07 Piccolo | READY | 13 in sourced; all distances flute-transferred (as the lesson says). |
| 14 | A11 Accordion | READY with defaults | All four Shure tests CONFIRMED (18-in garble fixed); AKG two-mic + hypercardioid; all sizes defaults; bellows envelope defaults. |
| 15 | A10 Harmonica | Buildable (SPK reuse) | 520DX fully sourced; **HB52 manual UNREACHABLE (403)**; amp numbers re-based on the SPK module. |
| 16 | A12 Pipe organ | Buildable as a diagram page | Case studies CONFIRMED (Neumann 35 ft + 8 ft high; DPA pairs; Petruskerk 10–15 m); organ layout wholly stylised. |

## 2. Corrections to the lesson texts (survey flags resolved first)

1. **Sax "last open holes"** (Sop L6, Alto L6, Tenor L6, Bari L6): the words are Dean Giavaras's quote in Shure's
   sax article. Physics (UNSW-SAX): the **first open tone hole** (nearest the mouthpiece) acts as the end of the
   pipe; it moves toward the mouthpiece as pitch rises; all keys closed → bell; high harmonics also leave the bell.
   Keep the quote attributed; replace the lesson's own sentences (proposed wording in `alto_sax/SOURCES.md` §1).
2. **Supercardioid nulls**: Shure "least sensitive at 125 degrees" → off-rear (cone at 125°), not side. Fix Piccolo
   L38, Sop Clarinet L36, Bass Clarinet L39, Bassoon L37. Shure's hyper/sub article does carry the 125° figure, so
   the citation is fine.
3. **DPA distances**: all CONFIRMED — 30–50 cm brass, 3 m room (**Trumpet L14 "several-meter" → "about 3 m"**),
   flute 5–10 cm (DPA says "mouthpiece") and ~1 m at head level, clarinet/oboe/bassoon 15–20 cm at one third.
4. **Accordion L25** "an 18-inch dynamic microphone facing the grille" → "an SM57 about 18 in (46 cm) from the
   centre of the grille" (Shure test 4).
5. **Harmonica L36** amp numbers: from John Mills's **guitar-amp** article; Mills's 1–2 in (25.4–50.8 mm) is from the
   **dust-cap/cone line of the speaker**, his ½ in is from the grille cloth. "2–5 cm from the grille cloth" mixes
   them → rewrite against the SPK module zones and label as guitar-amp guidance.
6. **One-third-from-bell orientation**: DPA writes "a third of the length up from the bell" on the clarinet, oboe
   **and bassoon** pages (template). Geometry rule for all: one third of the instrument's length from the bell end,
   along the instrument toward the reed → above the bell (clarinet, oboe), below it (bassoon, bell on top; DPA's
   clip "Point it downward"). Bassoon L13 "down" = correct meaning.
7. **Organ L4 dangling Leslie link** → "Speaker Cabinet and Leslie Miking Module (SPK)".

Other wrong or incomplete facts:
- **80 Hz wireless low cut** applies to every 4099S/4099T system (DPA lists 4099G, V, S, T) → add to Soprano/Alto
  sax (and Trumpet clip); on bari it sits above the lowest fundamentals (69.30 / 65.41 Hz, DERIVED).
- **Tenor L9/L15, Bari L9**: Dave Martin's 8–15 in / 45° is unverifiable today; "right elbow" and "12–24 inches… a
  third of the way up the horn" are Sweetwater's own text (2024 archive), not Martin's.
- **Soprano L58 "2–5 kHz"**: sourced after all (Mike Schulze in Shure's sax article).
- **Clarinet L6** "bell… particularly for low fingerings": not in DPA's page; cite UNSW ("If you take the bell
  off, it affects the very low notes").
- **Bass clarinet L14/L28** "no sourced number": MDAT gives 2–4 ft in front, aimed at the centre.
- **Bass trombone L25** "DPA observes that an undamped clip can pick up bell vibration": DPA-VIB speaks of clip/holder
  mounts on instruments generally — soften.
- **Tuba L8** Royer R-122 solo tuba: not on the cited Royer page — re-source or drop.
- **Tuba L6** bells up/back/front: CONFIRMED, add Yamaha's context (orchestra up, studio front, historic military back).
- **French horn**: add MDAT's rear/low-stand practice beside Rostrup's front practice (two schools, D-HN1).
- **Flugelhorn L21**: pickup mute protrusion is 3–4 cm (Yamaha).
- **Oboe**: DPA's table lists C4 as the lowest note; the modern oboe goes to B♭3 — don't set filters from the table.
- **Accordion**: Shure's test 7 duct-taped a mic to the grille; the lesson forbids that — keep the lesson rule, note it.
- **Organ**: Shure states ORTF as 110° and "six inches apart" vs the lab's 17 cm (D-ORG1).
- **Headers**: strip "Pro Audio Training Academy"; woodwind/harmonica/accordion/organ headers should name the
  instrument; fix date order (bass trombone, baritone sax, oboe vs bassoon) — survey items, unchanged.
- **Hygiene** (shared harmonica mics, brass water, windscreens): no source in any lesson or in today's reading —
  owner decision.

## 3. Shared families (build once)

1. **Brass bell family** (`trumpet/GEOMETRY_PROPOSAL.md`): frame Bb (origin = bell-rim centre, +x out of the bell),
   world frame W, rows for trumpet / flugelhorn / tenor + bass trombone / euphonium / tuba / horn; zones as distance
   bands on the bell axis with an off-axis angle readout (DPA 300–500, Shure 304.8–609.6, MDAT 609.6–1219.2, DPA
   3000, clip ≤ 140 reach); bell-travel and mute envelopes; **radiation layer** with two sourced bands (near-omni
   low, bell lobe ≥ 1 kHz; tuba's 90° at 1 kHz is the only numeric beam width). Add-ons: **slide envelope**
   (trombones, DERIVED positions), **bell-orientation switch** up/front/back (tuba, euphonium), **rear-bell + wall
   reflection** room (horn).
2. **Sax family** (`alto_sax/GEOMETRY_PROPOSAL.md`): one centre-line path model, four rows (straight soprano vs
   curved alto/tenor/bari; low-A bari), **register selector → first open hole** (semitone rule on DERIVED acoustic
   lengths 826 / 1238 / 1653 / 2476 mm), bell glow above the bell cut-in, hole-vs-bell balance readout; zones
   (Shure ×4, DPA mount, Sweetwater, MDAT, Hill triangle, shoulder, room).
3. **Woodwind family**: edge-tone (`flute/` frame F: embouchure origin, air-jet cone, foot end) for flute and
   piccolo; reed (`soprano_clarinet/` frame R: bell-origin path, P(U/3) rule, section spot, U-CLIP) for clarinet,
   bass clarinet, oboe, bassoon — same register selector as the saxes (clarinet overblows a twelfth).
4. **Free-reed family**: harmonica (hand chamber states, bullet mics, **SPK amp reuse**, hi-Z signal tracer) and
   accordion (two moving sides, bellows-cycle envelope, two-mic Δt over the cycle).
5. **Room-scale page**: pipe organ (stylised façade, divisions, nave, case-study zones, stereo builder from Batch 4).
   Shared everywhere: polar facts §0.1, mono-sum panel, headroom chain, HPF-vs-lowest-note panel (DPA-TABLE ranges
   as context only), NIOSH line.

## 4. Builder grouping (5)

1. **Brass I — bell + slide**: trumpet (first; defines the brass family and radiation layer), flugelhorn, tenor
   trombone (slide envelope), bass trombone.
2. **Brass II — turned bells**: French horn (rear wall room), tuba and euphonium (orientation switch).
3. **Saxophones**: one builder, family file first, then soprano (straight exception), alto, tenor, baritone.
4. **Woodwinds**: flute + piccolo (edge-tone), clarinet (defines the reed family), bass clarinet, oboe, bassoon.
5. **Free reed + distributed**: harmonica (SPK reuse), accordion (bellows), pipe organ (diagram page).

## 5. Sources not reachable today

Sweetwater sax article (403; 2024 archive read — Martin quotes absent), Hohner/sE HB52 manual and product page (403),
Yamaha horn bell diameter (not published — "Bell Size M"), Schoeps CCM manual (not re-read), NIOSH bulletin (not
re-fetched; confirmed in Batch 2), Royer tuba example (page reachable, example absent). Internet Archive
availability API answered 429 once. No CONFIRMED geometry depends on an unreachable page; Martin's 8–15 in zone is
hidden until verified.
