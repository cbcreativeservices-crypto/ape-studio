# Cable & Connector Fundamentals Lab — Master Build Plan (2026-08-15)

**Status: APPROVED by owner 2026-08-15 — build in progress.**
Owner rulings 2026-08-15: (1) plan approved; (2) BOTH catalog placeholder rows
('Cable Troubleshooting Lab', 'Audio Connectors and Connections Lab') REMOVED as
superseded; (3) FULL CERTIFICATE CREDIT AT LAUNCH — `af_cables` wired client-side AND
owner runs the seed SQL with `area='audio_fundamentals'` at launch (12th required
lab for gs3081; raised bar for existing users accepted).
Owner spec of record: the full lab prompt delivered 2026-08-15 (12 lessons, connector
inventory, §13 acceptance criteria). This plan maps that spec onto the audited app
architecture. A 13-agent parallel audit of the codebase (2026-08-15) is the factual
basis; file/line references below come from it.

**Safety mandate (owner, verbatim intent):** this is a safety-critical instructional
area. Every connector fact, pinout, rating and safety claim must be verified against
multiple authoritative sources before it ships. Human lives depend on the accuracy of
this content. Nothing is guessed; anything unverifiable is labeled equipment-dependent
or flagged for expert review.

---

## 1. Identity, placement, access

| Item | Decision |
|---|---|
| Route | `CableLab` (single stepped screen, `undefined` params) |
| Title / subtitle | "Cable & Connector Fundamentals" / "Identify it. Understand it. Connect it safely." |
| Catalog position | `labCatalog.ts` → `signal` category labs array, inserted **after "Signal Detective", before "Gain Staging"** (line ~124). Satisfies the spec: after signal-flow intro (Signal Chain Builder + Signal Detective), before gain-staging-dependent labs. Fundamentals order is literal array order — nothing else to wire. |
| Access | FREE automatically — gating is per-SECTION (`EarLabScreen.tsx:66` locks only `training`). No per-lab entitlement code, per app pattern. |
| Gate | Route wrapped `withAmplitudeOrientation` in RootNavigator's `Gated` map ONLY (lines 104–146) — MicSelectLab precedent; never inside the screen. |
| Lab key | `af_cables` (client-wired; server seed = owner decision, §8) |

**Registration checklist (5 exact edits):**
1. `src\navigation\types.ts` — add `CableLab: undefined;` to RootStackParamList (~line 230). MUST land before the catalog leaf or tsc fails.
2. `src\navigation\RootNavigator.tsx` — import screen; `CableLab: withAmplitudeOrientation(CableLabScreen)` in `Gated`; `<Stack.Screen name="CableLab" component={Gated.CableLab} />` (~line 237).
3. `src\screens\lab\labCatalog.ts` — LabLeaf in `signal` labs array: `{ name, blurb, route: 'CableLab', key: 'af_cables' }`.
4. `src\features\audio\ExposureCheckin.tsx` — add `'CableLab'` to AUDIO_ROUTES (lines 42–55) so dosimeter check-ins appear in-lab.
5. `src\features\lab\labCompletion.ts` — extend LabKey union with `'af_cables'`; units registered at runtime via `registerLabUnits` (screen-local lesson list) **plus** a static LAB_UNITS entry derived from the lesson registry so boot-time RPC retry works (audit gotcha: `retryUnsent` iterates only static LAB_UNITS).

**OWNER DECISION #1 — placeholder collision:** `labCatalog.ts:301-302` already lists
PLANNED members-only rows "Cable Troubleshooting Lab" and "Audio Connectors and
Connections Lab" (electronics/training). The new free lab covers both topics at
beginner tier. Recommend: **remove both rows as superseded** (the new lab teaches
connectors AND inspection/troubleshooting basics; a future advanced lab can be re-added
under its own ruling). Alternative: keep "Cable Troubleshooting Lab" as an advanced
follow-on. Leaving both as-is advertises duplicate curriculum at two price tiers.

**OWNER DECISION #2 — certificate credit (frozen backend):** the 11 `af_*` keys are
IMMUTABLE and server-seeded; `mark_lab_complete` rejects unseeded keys (graceful:
local ✓ shows, RPC retries forever). Seeding `af_cables` with `area='audio_fundamentals'`
makes it the **12th required lab** for the gs3081 universal credit — users who already
completed the 11 may need this lab before (re)earning the credit; whether already-granted
credit reverts depends on server internals we cannot see. Options:
- **A (recommended): wire the client key now; I draft the seed SQL; you run it when you decide.** Unseeded, everything works locally with no server credit. The draft documents both area choices.
- B: ship with NO key (fully standalone, zero backend touch); add credit later.
- C: seed immediately as the 12th audio_fundamentals lab (accepting the raised bar).

---

## 2. File layout (all under `src\screens\lab\cable\`)

Content/render split per the micselect + calc-registry precedent (data = pure .ts, zero React):

```
cable/
  cableTypes.ts          — ConnectorId union (~50), ConnectorRecord, PinDef, CableSectionId,
                           LearningTier ('core'|'recognition'|'qualified-person'),
                           SafetyLevel, HotPlugPolicy, LessonId union, CheckSpec extension
  connectorInks.ts       — Skia-FREE ink registry: tip/ring/sleeve/shield/hot/cold/ground/
                           earth/neutral/line pin+conductor colors (tubeInks pattern);
                           NEVER the amplitude ramp (governance R2)
  data/
    connectors.analog.ts     — XLR3, TS, TRS, TRS35, TRRS35, RCA, comboXlrTrs
    connectors.speaker.ts    — speakON NL2/NL4, binding post, banana, bare wire, legacy TS spkr
    connectors.digital.ts    — USB-A/B/MicroB/C, 8P8C, etherCON-style, BNC, TOSLINK, HDMI, DIN5 MIDI
    connectors.power.ts      — regional mains (NEMA 5-15 first, localizable), IEC C13/14, C19/20,
                               C5/6, C7/8, powerCON XX, powerCON TRUE1, DC barrel, USB-C PD, PoE
    connectors.recognition.ts— TT/bantam, ¼" patch, DB25, EDAC, LK/Veam, Euroblock, mini-XLR,
                               XLR4, XLR5, NL8, opticalCON-style, twist-lock, stage pin,
                               cam-type, Socapex-style (qualified-person flags)
    registry.ts              — import + array-spread aggregation, getConnector(id)  (calc registry idiom)
    lessons.ts               — 12-lesson registry (id/tag/title/intro/glossary[]), prose constants,
                               CheckSpecs incl. required-correct safety flags
    scenarios.ts             — L8 cable-selection scenarios + L11 Challenge A/B data
                               ({correct, accept[], explain} tri-state shape, MicSelect ChallengeStep idiom)
    testerCables.ts          — L10 virtual-tester cable defs + fault wiring maps
    inspection.ts            — L9 inspection-scene items (fault + explanation each)
  art/
    connectorArt.tsx         — DRAWINGS: Record<ConnectorId, () => JSX> in one normalized space,
                               single <ConnectorArt id w h> (micArt clone); split files per family
                               re-exported through one registry if size demands
    pinFaces.tsx             — front contact-view diagrams (accurate count/positions/numbering,
                               EXPLICIT viewing convention labeled on every face — male/female mirror!)
    cableSections.tsx        — 7 cross-sections (balanced shielded / instrument / speaker /
                               3-cond AC / 4-pair Ethernet / coax / fiber) + layered-reveal support
    anatomyArt.tsx           — Lesson 2 master connector+cable anatomy with per-part visibility
                               toggles (tube InsideSection pattern) + jacket-removal reveal
  lessons/
    lesson01.tsx … lesson12.tsx  (or grouped) — Body components consumed by the STEPS array
  CableTester.tsx          — L10 simulated tester (ElevatedFrame/SwitchButton hardware face)
  CableLabScreen.tsx       — stepped shell (STEPS array, top nav, dots, BACK/NEXT, resume)
```

## 3. Connector data model (spec §6 → house conventions)

`ConnectorRecord` (type aliases, JSDoc per field, `Type[]` arrays — NOT `as const`):
id, displayName, aliases[], category, tier ('core'|'recognition'|'qualified-person'),
regionalAvailability?, views (which art exists), contacts: PinDef[] ({num|label, role,
ink, note}), pinoutVariants[] ({context, assignments, verified: 'standard'|'equipment-dependent'}),
carriedSignals[], typicalSources[], typicalDestinations[], cableConstruction (CableSectionId +
prose), balancedCapability, channelCapability, locking ({method, howToConfirm}),
directionality?, hotConnectionPolicy ({policy, rationale — never a universal claim where
it varies}), advantages[], limitations[], commonMistakes[], notInterchangeableWith[]
({id/name, why, consequence — proportionate}), inspectionPoints[], basicTestMethod,
safety ({level, qualifiedPersonOnly?, cautions[]}), glossary[] (DB-verified display names),
relatedLessonIds[], sourceNotes (authoritative-source citations from the verification pass).

One source of truth per fact (tubeRefs principle): the tester simulation derives its
continuity maps from `contacts`/`pinoutVariants`, never a re-keyed copy.

## 4. Lesson-by-lesson mapping (spec §5 → app patterns)

The shell is the MicSelect stepped idiom: `STEPS: StepDef[]`, only the active Body
mounted, top nav + tappable dots, GlassButton BACK(gold)/NEXT(green), scroll-to-top on
goTo, resume via `ape:cableStep` (guest no-resume rule verbatim). Navigation stays
freely open (app idiom, Foundations ruling); **completion** is what's gated (§8).

| # | Lesson | Primary interaction (existing pattern) |
|---|---|---|
| 1 | What Are We Connecting? | Category cards (Chip grid) + source→destination pairs answered "what travels?" — tap-select, ScenariosScreen-style ✓/✕ + text feedback |
| 2 | Cable & Connector Anatomy | anatomyArt with per-part chips (tube InsideSection visibility pattern) + jacket-removal DragSlider reveal + 7 cross-sections; every term tappable → glossary |
| 3 | Analog Audio Connectors | Connector cards (7): ConnectorArt + PinFace + mating view + full instructional fields; XLR/TS/TRS/RCA required content per spec incl. TRS's 3 assignments (insert marked equipment-dependent) |
| 4 | Same Plug, Different Job | 10 comparison pairs side-by-side; learner answers interchangeable? → tri-state verdict + proportionate consequence (data-driven; ChallengeStep feedback idiom) |
| 5 | Loudspeaker Connections | speakON NL2/NL4 (1+/1− core; 2+/2− noted; assignments beyond 1+/1− equipment-dependent; twist-lock confirm), instrument-vs-speaker cable side-by-side, 5 routing picks |
| 6 | Digital, Network & Control | USB/Ethernet/BNC/TOSLINK/HDMI/MIDI cards + protocol-vs-connector teaching (Dante/AES50/AVB are protocols, not plugs; T568A/B both valid; 50Ω vs 75Ω; ARC/eARC; MIDI direction) |
| 7 | Power & Electrical Safety | Recognition/inspection/safe-use ONLY (no termination teaching). CautionBadge idiom for hazards; prohibited-practices list rendered as never-acceptable items; powerCON XX vs TRUE1 as separate families; qualified-person section (twist-lock, stage pin, cam, Socapex) recognition-only with explicit boundary |
| 8 | Selecting & Connecting | Guided selection flow per scenario (14 scenarios): stepped choices (source→dest→signal→connectors→construction→length→locking→sequence); accept[] lists for all valid solutions + tradeoff explanations |
| 9 | Handling & Inspection | "Cable Inspection" tap-the-fault scene (inspection.ts items) + correct-practice cards (over-under coiling, strain relief, separation, ramps) |
| 10 | Virtual Cable Tester | CableTester.tsx: pick cable → connect → run → continuity map animates → learner identifies fault → internal trace reveal → disposition (repair-by-qualified/relabel/remove). 8 required fault cables. Badged as SIMULATION (§1.7). No live-voltage simulation. |
| 11 | Final System Challenge | Challenge A (live show) + B (studio): tap-to-order sequencing (ScenariosScreen pattern) for signal path + power-up order, cable picks with tri-state verdicts, intentional-fault hunts; feedback names the category mismatch + consequence severity |
| 12 | Final Knowledge Check | CheckQuestion set (AnswerCell visuals + announceForAccessibility): visual ID, matching, routing, contact tracing, construction, balanced/unbalanced, connector-vs-protocol, inspection, troubleshooting, safety. Critical-safety items are individual persisted units (§8) — retry-until-correct by construction. Completion → FundamentalsCreditBanner treatment + Review Connectors / Retry Challenge actions. |

## 5. Visual design

- **OWNER RULING 2026-08-15 (supersedes the Skia-authored plan): connector artwork is
  OWNER-SUPPLIED.** The code-authored XLR exemplar failed owner review; the owner
  provides detailed drawings AFTER the build. Build order therefore: all lessons,
  interactions, tester and challenges ship art-free with clean per-connector art
  mount points (render nothing when no art exists — never a primitive stand-in, R3);
  the art funnel component gets rebuilt around the owner's delivered format
  (bundled PNG per the nav-icon precedent, or storage-bucket raster per the tube-card
  precedent) when the drawings arrive. Pin-face contact diagrams follow the same
  handoff; the face-geometry verification pass runs against the owner's drawings.
- Bodies: layered gradient-formed illustrations, upper-left light, rim highlights, metal
  recipes lifted from tube/viz.tsx helpers. NEVER bare primitives.
- **Pin faces: geometric-but-styled technical diagrams** (allowed for abstract data) with
  contact numbers, explicit viewing-convention caption on EVERY face (e.g. "male plug,
  viewed from the front"). Male/female mirroring is a named check in fact-verification.
- Proportion rule: connectors sharing a scene are sized from one real-world scale
  reference (SCENE_SCALE idiom) — XLR vs 3.5mm must read true.
- **Color rules:** amplitude ramp (blue→red) NEVER used for pins/polarity/safety.
  connectorInks.ts discrete colors + labels + shapes + line styles; never color alone.
  Existing TRS cable idiom colors (gainViz DeviceCable) respected for continuity.
- **Trademark care:** standard names (XLR, speakON, powerCON, etherCON, TOSLINK, HDMI)
  used nominatively — the glossary already does; NO manufacturer logos, no trade-dress
  reproduction; designs technically accurate but generic. Text labels in the UI layer,
  not baked into art. No tiny embedded text (MIN_FONT_SIZE 12 floor applies).
- Honesty: every illustrated panel carries the ILLUSTRATIVE MODEL badge; the tester is
  badged as a simulation.
- Animation: Reanimated clocks (useVizClock/usePhaseClock) gated by useIsFocused; a new
  `useReduceMotion` hook (ExposureCheckin subscription pattern) respected by the tester
  sweep, reveals, and card transitions. Static thumbnails have no clocks.
- Perf: node-budget header comment on the screen (MultiMeter convention); only the
  active lesson mounts; many small static Canvases per step are fine (MicSelect
  precedent); no React.lazy (no precedent) — mount-gating only.

## 6. Accessibility plan (spec §9)

- No listening task anywhere (lab is fully visual; optional audio none in v1).
- Every illustration wrapped `<View accessible accessibilityLabel="…prose…">`
  (AmplitudeOrientation pattern) — Skia/SVG content is invisible to screen readers.
- All interactions tap-based (no drag-only): sequencing = tap-to-order with numbered
  badges; matching = tap-to-pair; jacket-reveal slider gets ±step accessibilityActions
  ('adjustable' HarmonicStems pattern).
- Verdicts: glyph + words + color (ScenariosScreen pattern — explicitly NOT the
  color-only FillInBlank/Matching cells) + announceForAccessibility (announce, never
  move focus — house §23 rule).
- accessibilityRole/State on every Pressable; hitSlop conventions (10 back, 8 icons);
  targets ≥48pt; minHeight (not fixed height) so dynamic type doesn't clip.
- MIN_FONT_SIZE 12; tokens-only colors (contrast governed).

## 7. Glossary integration

- `GlossaryLinkProvider` wraps the lesson host (above ScrollView — EqModuleScreen
  placement); lesson prose in `GlossaryText` single-string blocks.
- The glossary already holds a rich connector corpus (archive-verified: XLR/XLRF/XLRM,
  TRS/TS/TRRS, Speakon, BNC, Banana Plug, IEC, powerCON TRUE1, Camlock, DB25, EDAC,
  5-Pin DIN MIDI, Cable Ramp, Snake, DI box, ~202 terms rehomed to gs160/170/180/580).
  **Link, don't duplicate.**
- Term existence will be **verified against the live DB via read-only SELECT** (Supabase
  MCP) before any LINK_TERMS additions (frozen backend untouched — reads only).
  Multi-word/punctuated names surface via per-lesson "IN THE GLOSSARY" chip rows
  (CalcWorkspace idiom) instead of auto-linking.
- Never navigate to the Glossary tab mid-lab (removed-link ruling 2026-08-09) — in-place
  GlossaryTermPopup only.
- `READY_TERMS_CABLE` + LabRoute registration happens ONLY after the lab is live
  (honesty rule 2026-07-26); first-claim-wins conflicts checked (mic terms stay MicLab's).

## 8. Progress, completion, gating

- Resume: `ape:cableStep` AsyncStorage key; restore on mount unless user navigated;
  anonymous users never persist/resume (verbatim MicSelect guard).
- Units (`af_cables`): one unit per lesson **marked on that lesson's knowledge check
  solve** (not mere viewing — stricter than Foundations, honest for a gated lab), plus
  `tester_pass`, `challenge_a`, `challenge_b`, one unit per critical-safety final
  question (`q_safety_ground_lift`, `q_safety_damaged_cord`, `q_safety_m2m_mains`,
  `q_safety_wet`, `q_safety_mains_mating`, `q_safety_unqualified_wiring`,
  `q_safety_speakon_mains`), plus `final_pass`.
- Persistence via markLabUnit (survives unmount/relaunch — deliberately NOT the
  DetectiveModule in-memory Set, a known weakness). "Pass threshold" = the house rule:
  100% of required units; critical-safety items are retry-until-correct by construction
  and individually persisted → spec's required-correct mandate is structural.
- mark_lab_complete fires when all units clear; unseeded key degrades gracefully
  (local ✓, retry) until Owner Decision #2 lands.

## 9. Fact-verification protocol (before implementation of content-bearing lessons)

1. I author all ~50 ConnectorRecords from standards knowledge, marking every claim.
2. **Verification workflow**: one web-enabled agent per connector family checks every
   pinout/rating/interchangeability/hot-plug/safety claim against authoritative sources
   (AES14/AES3, IEC 60320/60309/61076, USB-IF, HDMI LA, Neutrik speakON/powerCON/
   etherCON/opticalCON docs, TIA-568, MIDI Association, OSHA cord guidance, NEMA).
3. **Adversarial pass**: independent skeptic agents attempt to refute each safety-critical
   claim; anything not confirmed by ≥2 authoritative sources is either (a) reworded as
   equipment-dependent, (b) removed, or (c) listed in the final report under "requires
   expert verification." Citations land in each record's sourceNotes.
4. Visual accuracy: contact counts/positions/orientations in pinFaces are checked against
   the verified pinout data + reference imagery descriptions; the male/female mirror
   convention is a named checklist item per connector.
5. Original prose only — no manufacturer text or diagram reproduction.

Named high-risk items the verification pass must settle explicitly: XLR pin 2 hot
(AES14), TRS insert tip-send convention (equipment-dependent), speakON contact
assignments beyond 1+/1− (system-dependent), TRUE1 breaking capacity vs XX (model/
rating-specific; default teaching = de-energize first), DC barrel polarity (never
assume center-positive), BNC 50/75Ω mixing consequences (proportionate, not
catastrophized), PoE power classes (awareness level only), NEMA 5-15 terminal
identification (recognition/inspection only — no wiring instruction).

## 10. Feedback & copy governance

- Every lesson + final-check question carries SuggestCorrectionButton with Title-Case
  locating context: `{Lab, 'Lesson ID', 'Connector ID', 'Question ID', Section}`.
- Copy: module-top constants with owner-dated attribution headers; no timeline words;
  nothing added to src\lib\copy.ts (labs don't live there); central principle repeated
  per spec: "A connector's shape does not tell you everything… fitting does not prove
  the connection is correct or safe."
- Governance close-out: new dated APE_GOVERNANCE_DECISIONS file (R-numbers restart),
  SCREEN_STATUS row + headline bump, memory update.

## 11. Build order (each increment tsc-clean + web-preview mountable)

| Phase | Deliverable |
|---|---|
| B1 | Types + inks + registration (route/hub/gate/AUDIO_ROUTES) + stepped shell with 12 stub lessons + resume + units wiring — lab navigable end-to-end |
| B2 | Connector data authored (all families) → **fact-verification workflow** → corrections applied |
| B3 | Art: anatomy master + cross-sections + core analog set; Lessons 1–3 complete |
| B4 | Lessons 4–6 (comparisons, loudspeaker, digital/network) + their art |
| B5 | Lesson 7 power/safety + recognition tier + qualified-person boundaries |
| B6 | Lessons 8–9 (selection scenarios, inspection scene) |
| B7 | Lesson 10 Virtual Cable Tester |
| B8 | Lesson 11 challenges + Lesson 12 final check + completion treatment |
| B9 | Targeted tests (data validation, registration, persistence, safety gating, tester fault mapping, challenge validation) + §13 adversarial acceptance sweep + mobile-width visual review |
| B10 | Owner on-device pass (both phones) → sign-off → governance close-out (+ seed SQL if Decision #2 = credit) |

## 12. Acceptance criteria

The owner spec's §13 checklist (integration, content, interaction, visual quality,
accessibility, safety, device checks) is adopted verbatim as the sign-off gate; B9 runs
an adversarial workflow against it item-by-item, and the final implementation report
includes files created/modified, components reused/added, connector content included,
test results, remaining limitations, and any facts still requiring expert verification.
