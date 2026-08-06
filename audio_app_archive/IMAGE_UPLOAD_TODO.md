# Image pipeline — STATUS & open items
*Updated 2026-07-16. Two image sets: **course cards** (`course-cards` bucket) and **glossary terms** (`glossary-images` bucket). Both optimized to WebP + standardized + live/verified on prod.*

## ✅ DONE (verified on prod)
- **Course cards (25):** WebP, `tier_key.webp` names, all 25 in `course-cards` bucket, old PNGs deleted. Frontend wiring pending (see handoff).
- **Glossary term images (139 rows):** WebP, `<term-slug>.webp`, `glossary_media.url` rewritten to `.webp`; 136 live, 0 unreferenced, old PNGs + 10 orphans deleted. Backup: `glossary_media_backup_20260716` (droppable on your OK).

## ⏳ OPEN — needs your art (then it auto-displays)
Three glossary terms exist + are **pre-wired** but have **no image file** yet. Drop art into `glossary-images` at these exact names and they display instantly:
- [ ] `xlrm.webp` → term **XLRM** (male XLR)
- [ ] `xlrf.webp` → term **XLRF** (female XLR)
- [ ] `xlr-cable.webp` → term **XLR Cable**

## ⏳ OPTIONAL — terms exist, currently no image
- [ ] generic XLR photo → **XLR Connector** (family term; gender now lives in XLRM/XLRF)
- [ ] real **Zip Cord** photo → **Zip Cord** (zip-ties image correctly lives on **Cable Tie**)
- [ ] male/female pair photo → **Gender (Connector)** concept term

## ⚠️ Orphan images were DELETED in the bucket purge
During the glossary cleanup you deleted all old PNGs, which included 10 unreferenced orphans — among them `Transformer`, `CassetteTape`, `Knob`, `ConsoleButton`, `FreqAdjust`. If you still want terms for those objects, you'll need to **re-supply the art** and tell me the target term; nothing is wired for them now.

## Authoritative reference files (this session)
- Course cards: `COURSE_CARD_MAP_2026_07_16.md`, `ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json`, folder `coursecards_final/`
- Glossary: `ape_glossary_media_rename_2026_07_16.json`, `GLOSSARY_RENAME_REVIEW_2026_07_16.csv`, `glossary_media_url_update_2026_07_16.sql`, folder `glossary_images_final/`
- Frontend handoff: `APE_CLAUDE_CODE_HANDOFF_2026_07_16.md`
- Governance (CANDIDATE): `governance_v213_bump/` STATE r33 / TRACKER r32 / INDEX v35
