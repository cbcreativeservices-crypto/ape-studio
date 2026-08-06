# AP&E — Frontend (Claude Code) Handoff · 2026-07-16
**From:** Cowork/backend session · **To:** Claude Code (RN/Expo frontend) · **Prod:** `yjgolswjggmlpeowvtxr`
**Status:** backend image pipeline complete + verified. No schema change beyond one `glossary_media.url` rewrite. Governance: STATE r33 / TRACKER r32 / INDEX v35 (CANDIDATE).

Storage public base: `https://yjgolswjggmlpeowvtxr.supabase.co/storage/v1/object/public/`

---

## 1. Course-card images — ACTION NEEDED (frontend wiring)
The Course Select carousel art is now live in bucket **`course-cards`** as optimized WebP. **There is NO DB card-image column** (public_courses has none; Free/coming-topic cards aren't rows), so the client owns the mapping.

**Rule:** every card image filename = the card's id with `:` → `_`, plus `.webp`.
```
imageUrl = `${STORAGE_BASE}course-cards/${cardId.replace(':','_')}.webp`
```
**Carousel order (25 cards, left→right):**
- **Free:** `free:tools`, `free:glossary`, `free:safety`, `free:daw`
- **Courses:** `course:intro-to-audio`, `course:sound-reinforcement-systems`, `course:audio-system-design-and-maintenance`, `course:recording-arts`, `course:music-production`, `course:career-and-business`
- **Single-topic (academy):** `topic:podcast`, `topic:film`, `topic:assist`, `topic:commercial`, `topic:corporate`, `topic:dj`, `topic:architectural`, `topic:vehicle`, `topic:hifi`, `topic:audio-tech`, `topic:theatrical`, `topic:audio-elect`, `topic:road-crew`, `topic:live-sound`, `topic:worship`

Full map (position, tier, name, file) → `ape_course_card_map_FINAL_STANDARDIZED_2026_07_16.json`. Cards are 941×1672 (portrait).

---

## 2. Glossary term images — LIKELY NO CHANGE (DB already rewired)
`glossary_media.url` for all 139 rows was rewritten from `.PNG` to **`glossary-images/<term-slug>.webp`** (bucket `glossary-images`). Images are ~1024px WebP.

- If the app already resolves images by reading `glossary_media.url` and prefixing `${STORAGE_BASE}` → **nothing to do** (URLs just changed extension/name).
- **Only if** any client code hard-codes glossary image filenames or forces a `.PNG` extension → switch to reading `url` from `glossary_media`.
- **3 terms have no art yet** (pre-wired, will 404 until Booth uploads): `XLRM`→`xlrm.webp`, `XLRF`→`xlrf.webp`, `XLR Cable`→`xlr-cable.webp`. Please render a graceful fallback for a missing image.
- Visibility unchanged: `glossary_media` is academy/institutional-only (authenticated SELECT; no anon).

---

## 3. Backend context (no frontend action; for coordination)
Live and verified: v2.13 commercial layer (public_courses/topics, entitlements, users.audience), `register_commercial_user`, `has_academy_access`, `glossary_full_v` (masks `common_mistakes`→NULL for non-academy), `glossary_study_v` (free-topic exception), Option-B commercial progression (inside `submit_quiz` v8.4; `start_quiz_attempt` kept 2-arg — public course derived).

Still OPEN backend (see INDEX v35 §4 / TRACKER): **B-1** study gate = 200 (spec 600) — top pre-provisioning blocker; **A** awards model (no tables); **B** rename Professional Networking→Workplace Professionalism + networking→Music Entrepreneurship (both `is_active=false`); **C** pricing SSoT; **H** per-term hazard flags + (R)/(TM); **I** flashcard `required_passes` 2→1; `security_definer_view` accept-vs-refactor decision; backup tables droppable.

## 4. Prior frontend route-backs still open (from v2.13 handoff)
- Commercial signup calls `register_commercial_user(p_nickname text, p_favorites jsonb)`.
- Catalog reads point at `public_courses` / `public_course_topics` (anon-readable).
- Study/flashcard fetch for free topics uses `glossary_study_v`; `common_mistakes` reads via `glossary_full_v`.

---

## 5. TOPIC OVERHAUL 2026-07-16 (design record — NOT yet in DB) — ccode read
Booth kicked off a topic overhaul (moving off the fixed 50-topic / course-number model; Album % progression **PARKED**). Canonical detail: **`APE_TOPIC_TITLES_CANONICAL_2026_07_16.md`**. Topic count **51 → 62** (2 splits, 3 renames, 9 new). Nothing applied to DB yet — do not code against it until Booth greenlights execution.

**ACTION for ccode — add an Audiology card.** Audiology was added as a new topic *after* the 25-card set, so it has **no card art and no card_id yet**. When it lands:
- Proposed card_id: **`topic:audiology`** → image `topic_audiology.webp` in bucket `course-cards` (same filename rule as §1).
- Add it to the single-topic row of the Course Select carousel and to `ape_course_card_map_*` (currently 25 cards → 26).
- Booth still owes the card art (941×1672 portrait WebP).

Single-topic card TITLE changes to reflect (client labels): `topic:commercial` → **Commercial 70/100V Systems**; `topic:hifi` → **HiFi Consumer Audio**; `topic:podcast` → **Podcasting & Broadcast**; `topic:dj` → **DJ Sound**; `topic:theatrical` → **Theatrical Sound**; `topic:worship` → **Worship Sound**. New topic labels: Architectural Audio, Audio Electronics, Audio Technician, Audiology, Live Sound, Road Crew. Use the exact strings from the canonical doc.

---
**Ask for the frontend session:** implement §1 (course-card wiring by card_id), confirm §2 needs no change (or make the one-line switch), add missing-image fallback for the 3 XLR terms, and note §5 (Audiology card pending; topic titles).
