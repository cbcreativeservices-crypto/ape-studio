# Claude Code Kickoff — Glossary Cross-Linking + Text-to-Speech

**For:** the `ape-studio` app build session (Claude Code). **Repo:** `C:\Users\profe\dev\ape-studio` (Expo SDK 57 / RN 0.86 / React 19).
**From:** the backend/governance (Cowork) session, 2026-07-10.
**Scope:** two additive, client-only glossary features. No backend or schema changes. No glossary content changes.

---

## 0. Start-of-session checklist (do this first)
1. Follow the repo's own startup/onboarding docs and load project context before editing.
2. Confirm the app's **existing glossary data source** and reuse it — do **not** add a new one. The glossary lives in Supabase (project `yjgolswjggmlpeowvtxr`, table `public.glossary`); the app already renders term/definition data, so find that path (bundled snapshot `ape_glossary_data_snapshot_*.js` and/or a Supabase read) and build on it.
3. Both features are **launch-independent** and must not touch the mastery-quiz, gating, progression, or the measurement/audio-capture module logic.
4. Honor existing standards: **GlassButton** is the app-wide button standard; follow the current glossary card layout and the visual SSoT (Claude Design bundle).
5. **Nav gotcha (durable rule):** never `popToTop`/targeted-reset for tab-to-root; use plain navigate + the screen-level `tabPress` listener. This matters for Feature 1's back navigation.

---

## Data reference (already in the DB — no changes needed)
`glossary` columns used here: `id` (uuid), `term` (text), `definition` (text), `plain_english` (text), `purpose_function`, `practical_application`, `category`, `difficulty`, `related_terms` (text[]), `common_mistakes` (text[]), `scenario_contexts` (text[]).
- Term list is globally unique on `term`. Disambiguated senses appear as parenthetical terms, e.g. `Compression (dynamics)` vs `Compression (data)`.
- In-scope for launch = MUSI 190 + AUDI 201 (1,838 terms), all fields fully populated and committee-reviewed as of 2026-07-10.

---

## FEATURE 1 — In-definition term cross-linking + return navigation

**User story.** While reading a term, if a word inside the text is itself a glossary term, the reader taps it to open that term's entry, learns it, then returns to exactly where they were to finish the original read. Multi-hop trails (A → B → C) unwind step by step back to A.

**Locked decisions (Prof. Booth, 2026-07-10):**
- **Link scope = the `definition` field AND the `plain_english` field.** No other fields get links (for now).
- **Disambiguation = small chooser.** When a matched word maps to more than one sense, tapping opens a tiny picker listing the matching senses and the reader chooses. Words that map to exactly one entry link directly.

**Requirements / acceptance criteria:**
1. In the definition and plain-English text, words/phrases that match a glossary term render as visually distinct, tappable links (distinct but not so heavy that dense text looks cluttered).
2. Matching uses the live glossary term list, **case-insensitive, longest-match wins** (match "phantom power" before "power"); a term does **not** link to itself within its own entry.
3. Tapping an unambiguous link opens that term's glossary entry. Tapping an ambiguous word opens a **chooser** (sheet/popover) of the candidate senses; selecting one opens it.
4. A **back affordance returns to the previous term at its prior scroll position**, so the reader resumes mid-definition. OS back gesture and an in-app back control both work; a 3-deep trail unwinds one level per back.
5. No changes to glossary data; the term index is **precomputed once** (not rebuilt per render) and cached.

**Implementation guidance (suggestions, adapt to the repo):**
- Build a normalized lookup once: `{ normalizedPhrase -> [termId(s)] }`. Tokenize each field, greedily match longest phrases, and wrap matches in a pressable inline element (rendered `Text` with nested pressable spans).
- Navigation: push the existing glossary-term screen onto the React Navigation stack so back/pop restores the previous screen + scroll state. Keep a lightweight in-app breadcrumb if the OS back alone doesn't preserve scroll.
- Chooser: a small bottom sheet / popover listing candidate senses (show the parenthetical qualifier and topic to disambiguate).
- Guard against over-linking: cap link density if needed.

**Still open (non-blocking — pick a sane default, note it):** link only the **first occurrence** of a term per field, or every occurrence? Default recommendation: **first occurrence per field**.

---

## FEATURE 2 — Device text-to-speech per term

**User story.** A reader (especially an international user who understands spoken English better than written) taps a small speaker icon on a term and hears it read aloud through the device speakers.

**Locked decisions (Prof. Booth, 2026-07-10):**
- **One speaker icon per term.** A tap reads the **term, then its `plain_english` explanation** (plain-English, not the technical `definition` — easier to follow by ear).
- Use the **built-in device TTS** via **`expo-speech`** (no cloud, no audio files, offline-capable). English text in the device's default English voice — **no translation**.
- Ship with **device-default voice and rate**; a rate/voice setting can come later.

**Requirements / acceptance criteria:**
1. A small speaker icon sits next to each term in the glossary, consistent with the card layout.
2. Tap → speaks `"{term}. {plain_english}"` through the speakers. Tapping again (or a stop control) stops playback.
3. **Only one utterance plays at a time** — starting a new one cancels any in-progress speech.
4. The icon shows a clear playing/stopped state.
5. No backend calls; works offline.

**Implementation guidance:**
- `expo-speech`: `Speech.speak(text, opts)`, `Speech.stop()`, `Speech.isSpeakingAsync()`. Add `expo-speech` to the project if not already present (Expo SDK 57 compatible).
- Wrap in a small reusable `SpeakButton` component holding local playing state; stop any current utterance before starting a new one (single global speaking state).
- **Audio session:** confirm TTS playback coexists cleanly with the measurement/audio-capture module — TTS is playback-only; ensure it doesn't fight a record/`.measurement` session if that module is ever active at the same time (glossary and tools are separate screens, so likely fine — verify).
- Accessibility: give the icon an accessible label (e.g., "Play pronunciation and explanation").

---

## Out of scope (do NOT do here)
- No glossary content edits, no schema/RPC/migration changes, no changes to quiz/gating/progression or the measurement engine.
- No translation feature (TTS reads English only).
- No new backend or network dependency for either feature.

## Definition of done
- Both features work on Booth's iPhone via an EAS iOS dev build; `tsc` clean; bundle serves 200.
- Feature 1: links in definition + plain-English; unambiguous links navigate; ambiguous words show the chooser; 3-deep back trail returns to prior terms at prior scroll positions.
- Feature 2: one speaker icon per term reads term + plain-English; second tap stops; only one utterance at a time; offline.
- Suggested a hard-stop for Booth review after Feature 2 (smaller) is demoable, before polishing Feature 1's disambiguation.

## Handy references in this folder
- `UPCOMING_FEATURE_NOTES_2026_07_10.md` — the decisions log these were distilled from.
- Glossary is live and verified in Supabase `yjgolswjggmlpeowvtxr` (MUSI 190 + AUDI 201 fully authored + committee-corrected).
