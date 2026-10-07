# Mixing Guides lab — 50 music styles (2026-10-07)

Owner request (2026-10-07): *"This one should not be visual, it is more a written reference, so the lab should use a template format and creating it should not be too intensive. It covers 50 different music styles and is intended for mixing engineers to understand and mix/balance/successfully make their audience get what they expect (and not do their mix with no clue)."*

Branch: `mixing-guides-lab` (from `final-lab` df773d33). Hidden on store builds until the owner approves (`MIXING_PUBLIC = false`).

## 1. Source

The owner's 50 guides plus index, `assets/Mixing-Guides-50-Styles/` (`Word/` and `PDF/`, `00-index` + `01-pop` … `50-french-variete-chanson`). Untracked owner material: **read only** — nothing was moved, modified, copied into the bundle or committed. The conversion reads the `.docx` files with `scripts/mixing-guides/extract_docx.py` (zip + WordprocessingML, no extra packages).

The index has the order only (ranked by listening reach) — no families — so the hub keeps that order and adds a filter instead of groups.

## 2. The template (`src/screens/lab/mixingGuides/data/types.ts`)

All 50 guides share one structure; the template keeps it whole, in the owner's order:

| Part | Shape | Shown as |
|---|---|---|
| `expects` | one or two sentences **of the guide's own section 1** | "WHAT THE AUDIENCE EXPECTS" card at the top |
| `glance` | origin, tempo, ensemble, **priority** (mix priority #1), liveSpl, studioLoudness | priority in the top card; the other five as "AT A GLANCE" |
| 1 `purpose` | prose | Purpose & audience expectations |
| 2 `instruments` | bullets with bold run-in labels | Instruments |
| 3 `arrangement` | prose | Ensemble & arrangement |
| 4 `dynamics` | prose | Dynamics |
| 5 `balance` | prose | Balance & blend |
| 6 `eq` | table Source / Cut / Boost / Notes + notes | EQ starting points (one card per row) |
| 7 `compression` | table Source / Use it / Ratio / Attack-release / Gain reduction / Notes + notes | Compression & dynamics processing |
| 8 `fx` | table Effect / Applied to / Setting / Amount + notes | Effects & amounts |
| 9 `vocals` | prose | Vocal treatment |
| 10 `loudness` | prose, split into **Live:** / **Studio / streaming:** | SPL & loudness |
| 11 `liveStudio` | table Area / Live (FOH) / Studio mix + notes | Live vs studio |
| 12 `notes` | bullets (tips, and "Mistake:" items) | Engineer's notes & common mistakes |
| 13 `references` | artist, title, year | Reference recordings |
| `empty` | the sections a guide leaves empty, named | (nothing today — all 50 fill all 13) |

A table note the owner wrote above its table (one: Classical, compression) carries `before: true` and renders above the rows. The guide's **Sources** section is not part of the template: it is in `docs/labs/mixing/SOURCES.md` (918 entries) and never in the app.

Every page also shows the house line `STARTING_POINTS_LINE`: *"Starting points, not rules. Put on a reference track in the style, match its level, listen and adjust to the song, the artist and the room."* and an AccuracyNote (SPL/loudness figures are typical ranges; follow venue limits; measure with calibrated meters).

## 3. Data and loading

- One generated file per style: `src/screens/lab/mixingGuides/data/guides/gNN-<id>.ts` (≈1 MB of text in total).
- `data/index.ts` — id, number, title, priority line, origin (the hub and its filter).
- `data/load.ts` — each guide is `require`d inside a function on first open (cached).
- **App start does not grow**: nothing of the lab is in the start graph (the catalog imports nothing from it; the Labs-menu tile therefore has no count line). Start graph stays at the 260 cap.
- Regenerate: `python scripts/mixing-guides/extract_docx.py <scratch>/raw` → `python scripts/mixing-guides/parse.py <scratch>/raw <scratch>/parsed` → `python scripts/mixing-guides/convert.py <scratch>/parsed . --report <scratch>/report.json` → `python scripts/mixing-guides/sources_doc.py <scratch>/report.json docs/labs/mixing/SOURCES.md`. `convert.py` exits non-zero if an edit no longer matches or a brand/citation survives.

## 4. Conversion (light copy edit)

Per owner ruling 2026-10-04 (starting points; no brands, no citations in learner text). Facts and numbers kept; only the name carrying them changes.

- **370 per-guide edits** (`scripts/mixing-guides/edits.py`, every one must match) plus shared rewrites (`GLOBAL`). 49 guides needed edits; Heavy Metal needed none of its own.
- **Gear → type**: mic models dropped from parentheses or named by type ("handheld condenser", "broadcast-style dynamic"); 1176 → FET-style, LA-2A → opto, SSL → VCA bus-style, Fairchild → vari-mu tube-style, Neve 1073 → transformer-coupled preamp, Pultec/EMT/Lexicon/H3000 → their type; Melodyne → graphical/note-by-note, Auto-Tune → real-time / hard-tune pitch correction; Rhodes/Wurlitzer/Hammond/Leslie/Clavinet/Mellotron/Farfisa → electric piano (tine/reed), tonewheel organ, rotating speaker, clav, tape-replay keyboard, combo organ; Telecaster/Strat/Jazzmaster/JC-120/Marshall/Ampeg/Big Muff → their type; TR-808/909, TB-303 keep the numbers the styles are named by ("808", "909", "303"); CDJs → DJ media players; DAW/playback apps, consoles, PA brands, immersive-format and platform names removed or generalised.
- **Platforms**: Spotify/YouTube/Apple/Tidal/Amazon/Anghami → "most streaming services normalize to about −14 LUFS, some to −16" (values unchanged).
- **Authorities**: WHO → "a widely used safe-listening limit"; NIOSH → "common hearing-safety guidance"; DIN 15905-5 → "German rules"; ARIB/NHK, AAO-HNS, a named delivery spec → generic. Laws kept as local rules (India's noise rules, Jamaica's Noise Abatement Act, the East Java cap).
- **Citations**: named mix/FOH engineers, sound designers, a scholar and publications removed; the advice they carried is kept as plain advice ("Stack several small clip and limiting stages…"). Tour/venue anecdotes used as evidence ("Future's 2023 tour used 21 double-18 subs") → generalised ranges.
- **Kept**: artists, composers and producer-artists as style examples (Kool Herc, Nile Rodgers, J Dilla, Zaytoven…), places, languages, scene/label names that name a sound (Motown, Stax, Fania era, Discos Fuentes-era, Black Ark, 4AD, Blue Note-era, Sarah/K Records), and the reference recordings (record-label credits removed from four classical references). Studio and company names in history lines (Abbey Road, AIR Lyndhurst, Remote Control, King Studios, Sigma Sound, Musicland) removed.
- **Structure fixes** (logged per guide in SOURCES.md): three guides had a heading pasted inside a paragraph as `## 10. SPL & loudness` (Alternative/Indie Rock, Trap, Bluegrass/Americana — Bluegrass twice, so its live-vs-studio table sat under Vocal treatment). Split back into their sections. Every guide now fills all 13 sections.
- **"What the audience expects"**: a sentence (two consecutive sentences for Hip-Hop, Film & Game Score, Blues, Folk) of each guide's own section 1 — 49 verbatim. **French Variété / Chanson** is the one assembled line, from that section's own phrases.

Guides converted cleanly (no structural fix): **47**. Flagged: **3** structural (above) + **1** assembled expects line (French chanson).

## 5. Screens

- **Hub** `MixingGuides` (`MixingGuidesHubScreen.tsx`): LabHeader, intro and starting-points line, a filter (title, mix priority and origin; accents/case/punctuation ignored, "hiphop"/"kpop"/"lofi" match), "n of 50 read" (with the shared loading / unreadable faces), and the 50 styles on the shared GlassTile grid — two across on a phone, three on a tablet, four when ≥1100 wide, full width (same rules as the Labs menu). Tile: number, style, mix priority, ✓ READ.
- **Guide** `MixingGuide { id }` (`MixingGuideScreen.tsx`): the shared lab strip (⏮ / ‹ PREV / CONTENTS readout / NEXT ›) across the 50 styles; top card, starting-points line, at-a-glance rows, then 13 collapsible sections (section 1 open; OPEN ALL / CLOSE ALL), tables as one card per row; reading column 560 on a tablet. Foot: MARK AS READ (or ✓ READ) and "NEXT: <style> ›". FINISH on the last style and WHAT'S LEFT in CONTENTS open the shared what's-left screen. The header ‹ always leaves; nothing blocks.
- **Progress**: `ape:mixingGuides:v1` on `createLocalStore`; NEXT/FINISH and MARK AS READ add the guide; read only grows. Guests/unknown tier are held for the sign-in hand-off (`holdSessionWork`); a members-only preview earns nothing.

## 6. Placement and gating

- Tile **"Mixing Guides"** in Training Labs → **Mixing** (the existing `mixingworkflow` category, after Beginning/Advanced Mixing and Mastering), `member: true`.
- Routes `MixingGuides`, `MixingGuide` through `MemberGated` + `withMembershipPreview`, lazily; both in `MEMBER_ONLY_EXTRA_ROUTES` (members-only even while the tile is hidden). Typed in `navigation/types.ts`; in the `#labpreview` harness (`#labpreview/MixingGuides`, `#labpreview/MixingGuide/<id>`). Route names do not end in `Lab` (silent; out of the audio exposure check-in).
- **Release gate**: `MIXING_PUBLIC = false` in `labCatalog.ts`; the tile shows only when `MIXING_PUBLIC || __DEV__ || EXPO_PUBLIC_MIKING_PREVIEW === '1'` (the owner's Pixel preview update already sets it). On approval: set `MIXING_PUBLIC = true` and publish an update (JS only).

## 7. Tests

`test/mixingGuides.test.ts` (21): 50 styles in order, unique ids, index ↔ files agree, template sections and columns, every section filled or listed empty, every table cell filled, expects is the guide's own words, live/studio loudness split, no brand/model/platform/authority or citation voice in learner text (references exempt), no record-label credits, screens' own words clean, nothing of the lab in the start graph (≤ 260), lazy loader per guide, read record pure functions, store on createLocalStore with guest hold and preview rule, catalog/gate/route/types/navigator/harness wiring, house helpers, release gate false. `test/perfStartTrim_20261004.test.ts` gate receipts updated (+2 members-only routes, Mixing 4 Labs, total 225).

Screenshots: `docs/labs/mixing/screens/` (phone 412×915: Labs-menu tile, hub, filter "brazil", Pop top + EQ scrolled, Salsa top + foot, Classical top + compression; tablet 1024×1366: hub, Heavy Metal top, what's left).

## 8. Owner review items

1. **Approve the lab** to go public (`MIXING_PUBLIC = true`).
2. **Names kept**: artists, scene/label names that name a sound (Motown, Stax, Fania, Black Ark, 4AD…) and reference recordings are kept; product brands, engineers, publications, studios and standards bodies are removed. Confirm this line.
3. **"808" / "909" / "303"** kept as the genre's own words (drum-machine maker names removed).
4. **Streaming and safety figures** kept, unattributed ("most streaming services… −14 LUFS", "a widely used safe-listening limit of 100 dBA LAeq-15").
5. **French chanson's "audience expects" line** is assembled from its section 1 (no single sentence said it).
6. **No families**: the index has none, so the hub is one ranked grid with a filter. Owner may want region/family groups.
7. **Labs-menu tile has no count line** (the catalog is read at app start; showing "50 Style Guides" would add the index to the start graph past the 260 cap). The hub shows the count.
8. **Read credit**: NEXT › / FINISH mark the guide being left as read, as well as MARK AS READ. Owner may prefer the button only.
9. The strip's readout says **MODULE 19 / 50** (the shared strip's fixed noun); the what's-left screen says "guides".
10. The owner's index note that four guides (11, 13, 14, 15) were written on a reduced research budget is kept here, not in the app.

## 9. Expert review 2026-10-07

Audio-engineer + learning-design review: `docs/labs/reviews/REVIEW_2026_10_07_mixing.md` (1 critical, 9 major, 20 minor; 22 fixed, 8 owner decisions). Content fixes live in `scripts/mixing-guides/edits.py` ("Third pass"), four of them correct arithmetic or safety errors in the owner's source (MPB 97 dBA time, Hip-Hop LCpeak, Reggae and Amapiano delay times) — the owner may want to carry them back to the documents. Pinned by `test/mixingGuidesReview20261007.test.ts`.
