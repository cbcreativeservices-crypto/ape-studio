# AP&E STUDIO — SESSION HAND-OFF · 2026-07-10 (Glossary features + Dashboard panel redesign)
**From:** Claude Code client-build session · **To:** backend/governance (Cowork) project chat
**Scope:** all client work AFTER the Spike-0 report (`APE_SPIKE0_REPORT_2026_07_09_v1.md`).
Everything here is CLIENT-ONLY. No backend, schema, RPC, migration, gating, quiz, progression,
or measurement-engine changes.
**Repo:** `C:\Users\profe\dev\ape-studio` — tsc clean, iOS bundle HTTP 200 at hand-off.

---

## 1. WHAT SHIPPED (from the glossary kickoff `CLAUDE_CODE_KICKOFF_Glossary_Linking_and_TTS_2026_07_10.md`)

### Feature 2 — Text-to-Speech — DONE + APPROVED by Booth
- New `src/components/SpeakButton.tsx` (expo-speech ~57.0.0, NATIVE dep → needed a dev build).
  One utterance app-wide (starting a new one cancels the current; single global owner);
  `en-US` pinned (no translation); amber "playing" state; `stopAllSpeech()` on glossary blur/unmount.
- Speaker icon on every term (list rows, cards, and popup title).
- Follow-ups (all approved): (a) primary definition restyled to match detail-section text
  (15/23/`textSecondary`) — was dimmer; (b) TTS default reads the OFFICIAL definition;
  (c) header **🔊 ADV / 🔊 BEG** toggle picks which definition speakers read (`plain_english`
  when BEG), persisted `ape:ttsBeg`.
- `plain_english` added to the glossary paged SELECT + `Entry` type (read-only, existing source).

### Feature 1 — In-definition cross-linking + return navigation — BUILT (awaiting Booth review)
- Links in the **definition + plain_english** fields ONLY (kickoff ruling). Index built ONCE per
  corpus load (`buildTermIndex`: exact-term map + parenthetical-base map). Matching:
  case-insensitive, whole-word, **longest-match wins**, no self-link, **first occurrence per field**
  (the kickoff's recommended default — noted as the chosen open-question answer).
- Tapping a link opens the term in the card POPUP with a **back trail** (`popupTrail` state);
  each hop remembers its scroll offset and restores it on back — a 3-deep trail unwinds one hop
  at a time (back pill "‹ prev" + tap-body + ✕-closes-all). The list beneath is untouched, so
  closing returns the reader exactly mid-definition.
- Ambiguous words → a bottom-sheet **chooser** (term + course code).
- **DEVIATION from the kickoff's suggestion (noted):** links open the in-screen popup trail
  rather than pushing NEW nav-stack screens — this preserves scroll perfectly AND keeps the
  STUDY-tab nav rules untouchable. Card taps use `openPopupRoot`; inline list expand keeps
  `expandedId`.
- Link color: user-tuned to `#b3d2f2` (halfway between link-blue and body text) so dense text
  still reads smoothly.

### Nav regression #5 (STUDY tab → Glossary) — fixed AGAIN, at the root
- Root cause: the Study stack can MOUNT at Glossary (Home glossary card), making Glossary
  `routes[0]`, so any pop-to-root lands on it.
- Three-layer durable fix: (1) the Home glossary card now navigates **Dashboard first, THEN
  Glossary** (Dashboard is always `routes[0]`); (2) `MainTabs` gives Study + Achievements
  `popToTopOnBlur: true` (RN v7 built-in — uses live navigator keys, no stale-key dispatch);
  (3) prior TabBar-navigate + GlossaryScreen `tabPress` listener layers kept.
- Do NOT reintroduce `popToTop`/targeted `reset(...,{target:route.state.key})` for tab-to-root
  (routes[0] can BE Glossary; the snapshot key goes stale → "action not handled" redbox).

## 2. DASHBOARD — REAL 500-SERIES RACK PANEL REDESIGN (client-only, in progress; user iterating)
The study-method rows + quiz block (all render through `src/components/ElevatedFrame.tsx`) were
reskinned to look like blank/loaded 500-series rack panels, oriented on their side. Current state
after ~5 iteration rounds with Booth:
- `ElevatedFrame` = a powder-coat gray panel: procedural SVG speckle (64px tile, xorshift RNG,
  ~5% shade variance, blown-on spatter mix), near-hard corners (r≈3), no screws on the frame
  itself, metal top-sheen/bottom-settle, top-edge glint. Base gray `#434445`. Depressed (completed
  methods only) = darker edges + no drop shadow, NO seat margins (uniform 4px rack gaps).
- `DashboardScreen`: each panel = left screw · big 48px indented icon well (black 44px sticker,
  ~50% panel height, centered) · title+% in ONE modern LED readout (Barlow Condensed SemiBold,
  amber glow, title-left/%-right) · full-width LED meter in a cutout below (aligned to the readout)
  · 96×58 SwitchButton action · right screw. Screws are BLACK phillips, mostly-cardinal with 2
  slightly off-true. LED segments are raised beveled blocks (crisp glow, gray unlit — VU-meter
  reference), `LedMeter` gained `segWidth`/`fullWidth` props.
- The two inactive methods (Ear Training / Scenarios) render as full normal panels (NOT recessed/
  greyed panels) with unlit-gray readouts + a gray/dead SwitchButton, aligned with the active ones.
- The quiz is the 6th slot in the same rack (same gap); its status/gate lines render in an LED
  screen; its action is a SwitchButton (LOCKED-gray / START / RETRY / PRACTICE), amber pulse
  border while locked.
- **STATUS: cosmetic-only, still being tuned by Booth** — no functional/logic change to gates,
  progress, or navigation. Purely `ElevatedFrame.tsx`, `LedMeter.tsx`, `DashboardScreen.tsx` styles.

## 3. BUILD / DEPLOY STATE
- **Current EAS dev build on Booth's iPhone = `77e77156-4abc-47a0-884a-8d3ec60b86e2`** (contains
  ape-dsp + expo-speech). ALL of §1 Feature 1 and §2 panel work is **JS-only → reload, NO new
  build needed**. Only add a build if a new native dep is introduced.
- Prior builds: `8da2e16a` (Spike-0 watchdog), superseded.

## 4. BACKEND-CHAT ACTION ITEMS (unchanged / carried — none NEW today)
- Nothing new for backend today (client-only session). Still open from prior hand-offs:
  ratify the 35-topic `icon_url` DML + Safety methods; deploy the approved flashcard 1-view gate;
  the 360 s study-gate restore on go-ahead; D-2/D-3, anon grants, media columns, Site URL.
- Measurement tools ENGINE build remains a separate work order (Spike 0 CLOSED / Option A adopted;
  T-1 telemetry deploy deferred to the engine build).

## 5. VERIFICATION
- `npx tsc --noEmit` clean; `http://localhost:8081/index.bundle?platform=ios&dev=true` = 200.
- Glossary content of record: MUSI 190 + AUDI 201 (1,838 terms) fully authored/committee-reviewed
  as of 2026-07-10 (backend/governance-owned; client only reads it).

## 6. OPEN FOR BOOTH REVIEW
- Feature 1 (cross-links) demoable — review the disambiguation chooser + 3-deep back trail.
- Dashboard panel look — still actively iterating; latest round: ±5% texture, single title/% LED
  readout, 48px icon square, screw padding, Barlow Condensed display font.

*End of hand-off.*
