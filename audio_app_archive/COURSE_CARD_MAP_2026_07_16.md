# Course Card Image Map — FINAL (25 cards)
*Pro Audio Training Academy · 2026-07-16 · SSoT: `ape_course_card_map_FINAL_2026_07_16.json` · bucket: `course-cards`*

Status: **all 25 carousel cards mapped to an image; all 25 files present locally in `coursecards_images_source/`.**
Two things remain before the cards render in-app: (1) upload 16 files to the bucket, (2) decide how the app reads the mapping (see bottom).

## Carousel order → image

| # | Card | Tier | Image file | In bucket? |
|---|------|------|-----------|-----------|
| 1 | Tools | Free | measurement_tools_card.PNG | ✅ (unchanged — existing bucket file) |
| 2 | Glossary | Free | glossay_card.PNG | ✅ |
| 3 | Pro Audio Safety | Free | pro_audio_safety_card.PNG | ✅ |
| 4 | DAW | Free | musi_202_computermusic.PNG | ✅ |
| 5 | Intro to Audio | Course | Card_IntroToAudio.PNG | ⬆️ upload |
| 6 | Sound Reinforcement Systems | Course | sound_reinforcement_systems.PNG | ✅ |
| 7 | Audio System Design & Maint. | Course | audi_204_card.PNG | ✅ |
| 8 | Recording Arts | Course | musi_201_rec_arts_card.PNG | ✅ |
| 9 | Music Production | Course | Card_MusicProductioin.PNG | ⬆️ upload |
| 10 | Career & Business | Course | muii_108_business_card.PNG | ✅ |
| 11 | Podcasting & Broadcast | Single-topic | 205a_card.PNG | ✅ |
| 12 | Film & Game Audio | Single-topic | 205b_card.PNG | ✅ |
| 13 | Assisted Listening | Single-topic | Card_ALS.PNG | ⬆️ upload |
| 14 | Commercial Audio | Single-topic | Card_70v.PNG | ⬆️ upload |
| 15 | Corporate AV | Single-topic | Card_AV.PNG | ⬆️ upload |
| 16 | DJ | Single-topic | Card_DJ.PNG | ⬆️ upload |
| 17 | Architectural | Single-topic | Card_AcousticalAudio.PNG | ⬆️ upload |
| 18 | Vehicle Audio | Single-topic | Card_Automotive.PNG | ⬆️ upload |
| 19 | Hi-Fi Systems | Single-topic | Card_HomeHiFi.PNG | ⬆️ upload |
| 20 | Audio Technician | Single-topic | Card_Technician.PNG | ⬆️ upload |
| 21 | Theatrical | Single-topic | Theatrical.PNG | ⬆️ upload |
| 22 | Audio Electronics | Single-topic | Electronics.PNG | ⬆️ upload |
| 23 | Road Crew | Single-topic | RoadCrew.PNG | ⬆️ upload |
| 24 | Live Sound | Single-topic | Card_LiveSoundMusic.PNG | ⬆️ upload |
| 25 | Worship | Single-topic | Card_Worship.PNG | ⬆️ upload |

## OPTIMIZED — WebP set (2026-07-16)
All 25 cards re-encoded to **WebP q80, 941×1672** in `coursecards_optimized/`. **51.4 MB → 3.07 MB (−94%)**, no visible quality loss (RGB, no transparency). Originals in `coursecards_images_source/` untouched. SSoT: `ape_course_card_map_WEBP_2026_07_16.json`.

## STANDARDIZED names — FINAL (2026-07-16)
Naming standard = **`tier_key.webp`** (filename = card_id with `:`→`_`), so the frontend derives the image name directly from the card. Files in `coursecards_final/`. SSoT: `ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json`.

### Upload — all 25 files from `coursecards_final/` → `course-cards` bucket
**Free:** free_tools.webp · free_glossary.webp · free_safety.webp · free_daw.webp
**Courses:** course_intro-to-audio.webp · course_sound-reinforcement-systems.webp · course_audio-system-design-and-maintenance.webp · course_recording-arts.webp · course_music-production.webp · course_career-and-business.webp
**Single-topic:** topic_podcast.webp · topic_film.webp · topic_assist.webp · topic_commercial.webp · topic_corporate.webp · topic_dj.webp · topic_architectural.webp · topic_vehicle.webp · topic_hifi.webp · topic_audio-tech.webp · topic_theatrical.webp · topic_audio-elect.webp · topic_road-crew.webp · topic_live-sound.webp · topic_worship.webp

### After upload — delete the superseded files from the bucket (36)
- The 25 old-named `.webp` (measurement_tools_card, glossay_card, Card_*, 205a/b_card, audi_204_card, musi_*, muii_108_business_card, Theatrical, Electronics, RoadCrew, sound_reinforcement_systems, pro_audio_safety_card)
- The 11 original `.PNG` (measurement_tools_card.PNG, music-190_card.PNG, etc.)

Frontend derives filename from card_id: `` `${card_id.replace(':','_')}.webp` ``.

## Wiring — OPEN DECISION
There is **no card-image column in the DB**, and Free/coming-topic cards aren't rows anywhere. Options:
1. **Frontend-by-filename (no backend change):** app maps card → bucket filename in code using this manifest. Fastest; matches how the `course-cards` bucket already exists.
2. **DB-driven:** add `public_courses.card_url` (6 courses) + reuse `achievements.icon_url` for the single-topic cards that are achievements (gs17/18/19/20/22/42/44) + a new small table/config for Free + coming cards. More moving parts; needs schema approval.
