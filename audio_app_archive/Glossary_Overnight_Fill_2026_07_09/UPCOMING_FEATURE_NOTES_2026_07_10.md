# AP&E Glossary — Upcoming Feature Notes

*Recorded 2026-07-10. Status: **NOTED / NOT STARTED** — captured for the build backlog per Prof. Booth's request. These are requirements to scope later, not approved specifications and nothing here is implemented.*

Context: these are **client-side (app) features** for the glossary. The glossary data lives in Supabase (`glossary` table, project `yjgolswjggmlpeowvtxr`); the app is Expo / React Native (SDK 57). Neither feature requires new glossary content — both operate on the term/definition data already in the DB.

---

## Feature 1 — In-definition term cross-linking with return navigation

**Goal.** Inside a term's definition (and, TBD, the other text fields), any word or phrase that is itself a glossary term becomes a tappable link that opens that term's entry. From the opened term, the user can return to exactly where they were reading, so they can finish the original definition.

**Why.** If a reader hits a word they don't understand inside a definition, they can jump to learn it, then come back — turning the glossary into a self-service, self-explaining reference. Especially valuable for beginners and international users.

**Requirements (to confirm when scoped):**
- Detect glossary terms that appear within a definition's text and render them as links to the matching term entry.
- Provide a clear "back" affordance that returns the user to the **prior term at the same scroll position**, so a multi-hop trail (A → B → C) can be unwound step by step back to A.
- Visually distinguish links from body text without making dense definitions look cluttered.

**Implementation considerations (suggestions, not decisions):**
- **Matching:** build the link map from the live glossary term list. Use whole-word / longest-match matching (e.g., match "phantom power" before "power"); case-insensitive; skip matching a term inside its own definition.
- **Disambiguation:** the glossary has disambiguated senses (e.g., `Compression (dynamics)` vs `Compression (data)`) and multi-topic terms. Decide how a bare word in text resolves to the right entry (and what to do when it's ambiguous — link to a chooser, or don't link).
- **Navigation:** the app already uses React Navigation; a natural fit is pushing the glossary-term screen onto the stack so the OS/back gesture and an in-app back button both return to the previous entry with state preserved. Confirm this composes with the existing tab-to-root nav rules (see the "never popToTop/targeted-reset for tab-to-root" gotcha).
- **Scope of linking:** decide whether linking applies only to `definition`, or also to plain-English / purpose / practical-application / common-mistakes / scenario-contexts.
- **Performance:** precompute the term index once (not per-render); cap link density if a definition would otherwise be over-linked.

**Decisions (Booth, 2026-07-10):**
- **Link scope = `definition` + `plain_english`.** Both fields carry tappable term links; the other text fields do not (for now).
- **Disambiguation = show a small chooser.** When a plain word matches more than one sense (e.g., `Compression (dynamics)` vs `Compression (data)`), tapping opens a tiny picker of the matching senses; the reader chooses. Unambiguous words link directly.

**Still open:**
- Link only the first occurrence of a term in a field, or every occurrence? (Leaning: first occurrence per field, to limit clutter — confirm.)

---

## Feature 2 — Text-to-speech (device TTS) for terms and definitions

**Goal.** A small speaker icon next to each term (and/or its definition) that, when tapped, reads the text aloud through the device speakers using the **built-in device text-to-speech** engine.

**Why.** Accessibility and comprehension — especially important for **international users** who may read English less fluently than they understand it spoken, plus low-vision and hands-free use.

**Requirements (to confirm when scoped):**
- Speaker icon adjacent to each term and/or definition in the glossary.
- Tap speaks the associated text via on-device TTS through the user's speakers; tap again (or a stop control) stops playback.
- Clear playing/stopped state on the icon; only one utterance plays at a time.

**Implementation considerations (suggestions, not decisions):**
- **Engine:** use the platform's built-in TTS via Expo — `expo-speech` (`Speech.speak` / `Speech.stop` / `isSpeakingAsync`). No cloud service, no audio files, no new backend — this keeps it free and offline-capable, matching "built-in device text-to-speech."
- **Language/voice:** device TTS quality/voices vary by platform and installed language packs. Content is English, so default English voice is the baseline; optionally expose rate/voice later. (Note: device TTS reads English text with an English voice; it does not translate — if translation is ever wanted that's a separate, larger feature.)
- **What gets read:** decide whether the icon reads just the term, just the definition, or term + definition; and whether the plain-English field is the better thing to speak for learners.
- **Interaction with the measurement-tools / audio-capture module:** confirm TTS playback and any audio session settings coexist cleanly (playback vs record categories).
- **Placement/UX:** keep the icon small and consistent with the current glossary card layout and the app's button standards (GlassButton).

**Decisions (Booth, 2026-07-10):**
- **One speaker icon per term.** A single tap reads the **term, then its plain-English explanation** (not the technical definition — plain-English is easier to follow by ear for international users). Tap again / stop control halts playback; only one utterance at a time.
- Ship with **device-default voice/rate** first (English voice; no translation). A rate/voice setting can come later if wanted.

**Still open:**
- None blocking. (Optional later: expose rate/voice; optionally add a second icon if reading the technical definition aloud is ever requested.)

---

### Suggested sequencing
Both are additive, client-only, and independent of each other and of the launch-critical backend work. TTS (Feature 2) is the smaller lift (a self-contained component using `expo-speech`); cross-linking (Feature 1) needs the term-matching + disambiguation decisions above before build. Recommend confirming the open questions, then scoping each as its own work order.
