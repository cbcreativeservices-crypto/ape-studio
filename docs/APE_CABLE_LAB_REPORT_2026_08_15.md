# Cable & Connector Fundamentals Lab — Implementation Report (2026-08-15)

Delivered per owner spec §14. Commits: `1579213` (framework) → `fda08a8`
(verified content) → `a3e7bc3` (all 12 lessons) → `6a150a6` (acceptance sweep).

## Files created
- `src/screens/lab/cable/` — `CableLabScreen.tsx` (stepped shell, resume,
  credit wiring, step-nav provider); `cableTypes.ts`; `connectorInks.ts`;
  `lessons/` (12 lesson bodies + `bits.tsx` + `connectorCard.tsx` + registry);
  `data/` (48-record verified connector registry across 5 family files,
  12 lesson datasets, `testerCables.ts`, `glossaryVerified.ts`, `lessons.ts`).
- `scripts/validateCableLab.ts` — data-integrity validation (`npx tsx`).
- `docs/` — plan, verification report, seed SQL, governance log (15B), this report.

## Files modified (all additive except the ruled placeholder removals)
`navigation/types.ts`, `navigation/RootNavigator.tsx` (route + orientation
gate), `screens/lab/labCatalog.ts` (leaf added; 2 superseded planned rows
removed — owner ruling), `features/lab/labCompletion.ts` (`af_cables` 12th
LabKey + static LAB_UNITS), `features/audio/ExposureCheckin.tsx` (AUDIO_ROUTES),
`docs/SCREEN_STATUS.md`.

## Components reused / added
Reused: MicSelect stepped-shell idiom, GlassButton, CheckQuestion
(foundations/bits), tap-to-order sequencing + tri-state challenge patterns,
labCompletion store, entitlement guest rule, amplitude-orientation gate.
Added (lab-local): OptionChip/VerdictBanner/CheckDoneBanner/banners,
ConnectorCard + InkLegend + RecognitionStrip, useReduceMotion + Entrance
animation foundation, CableStepNav context.

## Connector content included
33 core-tier records fully taught (7 analog, 6 loudspeaker, 10
digital/network/control, 10 power); 11 recognition-tier rendered view-only;
4 qualified-person power connectors recognition-only with hard boundaries.
Every record: pinout variants with confidence tiers, construction, locking,
hot-connection policy, advantages/limitations/mistakes, look-alike risks,
inspection, basic test, cautions, per-claim source citations.

## Tests run & results
- `tsc --noEmit` strict: PASS (repeatedly, final at `6a150a6`).
- `scripts/validateCableLab.ts`: PASS — 48 connectors, 12 lessons, 20 units,
  answer-key referential integrity, safety-unit exact match, tester
  dispositions. (Caught and drove one real fix during development.)
- Fact-verification gauntlet: 93 claim-groups confirmed (authoritative
  sources), 58 corrections applied (31 safety) — see
  `APE_CABLE_LAB_VERIFICATION_2026_08_15.md`.
- §13 acceptance sweep (6 adversarial auditors): ZERO blockers; all 22
  findings fixed at `6a150a6`.
- Web bundle + mount: clean. On-device: owner walked all 12 modules
  (2026-08-15) and approved continuing.

## Remaining limitations (all owner-gated)
1. **Artwork** — owner supplies detailed drawings; ART SLOT mount points wait
   empty by ruling. Pin-face geometry verification runs against the drawings.
   Set-piece animations (L2 peel, L10 trace, L11 cascade) land with the art.
2. **Copy pass** — deferred by owner; builder-flag inventory + sweep findings
   are the checklist.
3. **Certificate credit** — owner runs `APE_CABLE_LAB_SEED_2026_08_15.sql`
   AT LAUNCH (12th audio_fundamentals lab; unseeded is graceful).
4. **R5 ruling** — MIN_FONT_SIZE vs the MicSelect chrome idiom (both labs
   move together).
5. Localization: mains content is NA-first; the data model is region-ready.

## Facts still requiring expert verification
None ship as unhedged claims. 17 in-file `EXPERT REVIEW PENDING` tags +
11 open `— VERIFY` tags on low-risk claims; the full 30-item professional
review list (electrician / amplifier tech / Neutrik / standards access)
lives in `APE_CABLE_LAB_VERIFICATION_2026_08_15.md` §Expert-review.
