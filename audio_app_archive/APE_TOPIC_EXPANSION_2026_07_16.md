# AP&E TOPIC EXPANSION — Master Record (2026-07-16)
**Prof. Booth · design/decision record. NO DB writes yet — batch into one migration.** Album % PARKED. Companion: `APE_TOPIC_TITLES_CANONICAL_2026_07_16.md` (single-topic card titles). Term backlogs: `AUDIOLOGY_MASTER_backlog_2026_07_16.csv`, `RECORDERS_backlog_2026_07_16.csv`, `HOME_THEATER_RESIDENTIAL_candidate_terms_2026_07_16.md`.

## Program topic count: 51 → ~74
= 51 base + 4 splits + 19 new topics (folds into existing topics don't add count). *(Loudness & Listening Level + Listening Environments merged → −1; + Power Systems cornerstone topic added 2026-07-16.)*

## Splits — FINAL (4)
- gs3 Connectors & I/O Connections → **Connectors & Cables** (~130) · **I/O Connections** (~72)
- gs7 Mixers & Recorders → **Mixers** · **Recorders**
- gs23 Audio Measurement & Optimization → **Audio Measurement** (~186) · **System Optimization** (~43)
- gs33 Soldering & Repair → **Soldering** (76) · **Repair** (118)

## Renames — FINAL (5)
- gs6 → Loudspeaker Fundamentals · gs13 → Loudspeaker Deployment · gs18 → HiFi Consumer Audio · gs20 → Commercial 70/100V Systems · gs42 → Podcasting & Broadcast

## Amplifier ruling
gs12 Amplifiers = single canonical amp topic; intro course cross-lists gs12; gs6 amp terms fold into gs12.

## New topics — 18
**Commercial single-topic cards (8):** Architectural Audio · Audio Electronics · Audio Technician · DJ Sound · Live Sound · Road Crew · Theatrical Sound · Worship Sound. *(Term lists TBD — Booth to source.)*

**From the "Audio & Music Listening & Hearing" doc (Audiology overhaul):** the 1,041-term Audiology core was too large for one topic → decomposed. 116 clinical terms CUT (deep anatomy, vestibular, clinical tests, clinical voice). Resulting topics + term counts (author = net-new to write; xlist = already in glossary, cross-list):

| New topic | Terms | author | xlist |
|---|---|---|---|
| Hearing & Hearing Health | ~204 | ~197 | ~7 | +42 hearing-protection research adds (incl. OAE Testing, kept per Booth) |
| Psychoacoustics (incl. Auditory Illusions) | 167 | 149 | 18 |
| Critical Listening *(split; Ear Training half → gs27)* | 91 | 68 | 23 |
| Monitoring & Audio Evaluation | 117 | 106 | 11 |
| Spatial Hearing & Localization | 80 | 67 | 13 |
| Speech Intelligibility | 76 | 56 | 20 |
| **Loudness & Listening Environments** *(merged: Loudness & Listening Level + Listening Environments & Audience Experience)* | 128 | 108 | 20 |
| Music Perception | 80 | 80 | 0 |
| Voice & Vocal Perception | ~99 | ~96 | ~3 | +40 research adds (4 borderline + Lead Vocal cut); 8 corrections applied — see VOICE_CORRECTIONS_LEDGER |
| **Home Theater & Residential AV** | ~119 | ~96 | ~23 | +42 research adds; Section F collapsed; acoustic-treatment split |

That's **10 new topics** from this stream (9 from the audiology doc after the Loudness+Listening Environments merge + Home Theater).

**Power Systems (Electrical Power Systems) — NEW cornerstone topic (Booth 2026-07-16):** comprehensive electrical-power curriculum in 10 categories (Electrical Fundamentals · AC Power · Distribution · Batteries · Power Supplies/Conversion · Backup/Emergency · Generators · Power Quality · Electrical Safety · Touring/Live Event Power). 185 explicit terms cross-checked → **50 cross-list / 135 net-new** (`bk_power_systems.csv`). **Category 4 Batteries PENDING** — fold previously-developed battery set here (source TBD from Booth). **Overlap flag:** 27 terms already in gs2 Grounding & Electrical (MUSI190 intro, 75 terms) — default = cross-list the shared basics; open question whether to fold gs2 into Power Systems.

## Fold into EXISTING topics (not new)
- **Assisted Listening & Accessibility** (75; 64 author / 11 xlist) → existing **gs17 Assisted Listening Systems**.
- **Consumer Listening & Playback + streaming** (73; 54 author / 19 xlist) → existing **gs18 HiFi Consumer Audio** (gear + playback + streaming all in gs18).
- **Ear Training** (72; 72 author / 0 xlist) → existing **gs27 Ear Training** (from splitting Critical Listening & Ear Training 2026-07-16; adds depth, not a new topic).

## Recorders term source
`RECORDERS_TERM_SOURCE_2026_07_16.md` → 245 unique (28 xlist / 217 author).

## Authoring backlog (net-new definitions, overnight)
- Recorders: 217
- Audiology decomposition + Music + Voice + gs17/gs18 folds: 1,036
- Home Theater & Residential AV: 60 (81 total / 21 xlist) — APPROVED + cross-checked 2026-07-16
- 8 commercial single-topic cards: term lists not yet sourced (0 so far)
- Home Theater research pass (2 SME agents, 2026-07-16): +58 net-new / +16 cross-list across Home Theater (+42), Room Acoustics gs29 (+14), HiFi Consumer Audio gs18 (+18). 8 corrections applied (Section F room-correction collapse; split "Residential Acoustic Treatment" → isolation vs in-room treatment; THX tiers; HDCP 2.2/2.3; Display Calibration ISF/THX/Calman; Reference Level pinned to THX 105/115 dB; Bass Trap porous vs membrane; Auro-3D elevation note). Findings: `HOME_THEATER_RESEARCH_FINDINGS_2026_07_16.md`; add-backlogs `bk_ht_additions.csv` / `bk_roomacoustics_additions.csv` / `bk_gs18_additions.csv`.
- Voice & Vocal Perception research pass (2 SME agents, 2026-07-16): **+39 net-new / +1 cross-list** (40 additions after Booth cut 4 borderline [Subglottal Pressure, Vowel Formant Space, HNR, VOT] + Lead Vocal). Production terms (Comping [in DAW Skills], Doubling/Stacking, Tuning/Auto-Tune, De-essing, Vocal Riding) NOT in this topic — belong to Recording Arts/Mixing. 8 corrections applied — see `VOICE_CORRECTIONS_LEDGER_2026_07_16.md` (conflict notes recorded for Mixed Voice + chest/head model). Findings: `VOICE_PERCEPTION_RESEARCH_FINDINGS_2026_07_16.md`; backlog `bk_voice_additions_FINAL.csv`.
- Hearing Protection research pass (2 SME agents, 2026-07-16): **+42 net-new / +1 cross-list (Tinnitus)** → Hearing & Hearing Health (162→~204). Occupational rating-science + regulatory numbers + WHO venue/H.870 + IEM ecosystem. OAE Testing KEPT (Booth: early subclinical detection). Findings: `HEARING_PROTECTION_RESEARCH_FINDINGS_2026_07_16.md`; backlog `bk_hearing_protection_additions.csv`. **9 factual corrections PENDING BOOTH REVIEW — not yet applied** (PEL 90 vs Action Level 85, exchange-rate authority, peak C-weighting, NRR derating, double-protection myth, cap-mounted-earmuff rename, stage-volume alias).
- Desk-clear individual terms (Booth, 2026-07-16): +20 net-new across Connectors & Cables (8), Microphones (5), Grounding & Electrical, I/O Connections, Loudspeaker Fundamentals, Loudspeaker Deployment, Recorders, Theatrical Sound, Sound & Acoustics. (speakON Cable already existed.) See `DESK_CLEAR_terms_2026_07_16.csv`.
- Power Systems (Booth 2026-07-16): +135 net-new (185 explicit terms; 50 cross-list; batteries Cat 4 TBD). `bk_power_systems.csv`.
**Running total ≈ 1,607 net-new definitions** (+ batteries TBD) (Recorders 217 + audiology stream 1,036 + Home Theater 60 + HT research 58 + Voice research 39 + Hearing Protection 42) before the 8 unsourced topics.

## STILL OPEN
- Source term lists for the 8 commercial single-topic cards.
- global_sequence numbering for all new topics + split halves.
- Music/Audio diploma-track assignment (all ~73).
- Cards for the new academic topics (Audiology sub-topics, Music/Voice Perception, Home Theater) if they go on Course Select.
- Then: ONE batched migration (create topics, apply splits/renames, insert `(definition pending)` rows, cross-list) → overnight authoring pass.
