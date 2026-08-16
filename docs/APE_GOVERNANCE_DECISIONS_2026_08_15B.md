# AP&E — Governance & Decisions Log (2026-08-15 · Session B)

Rulings of record from the **Cable & Connector Fundamentals Lab** build session
(`audio-tools-engine` branch). Successor to
`APE_GOVERNANCE_DECISIONS_2026_08_15.md` (same date, earlier session — the
waveform/RTA display rulings, which stand). R-numbers restart at R1 per house
style.

> Scope: the flagship free Audio Fundamentals connector lab — added of record;
> the owner-supplied-artwork ruling; the content-verification protocol; the
> post-build ratifications; and one systemic conflict flagged for a future
> ruling. Plan of record: `docs/APE_CABLE_LAB_PLAN_2026_08_15.md` (approved).
> Accuracy audit trail: `docs/APE_CABLE_LAB_VERIFICATION_2026_08_15.md`.

## R1 — CABLE & CONNECTOR FUNDAMENTALS LAB ADDED OF RECORD

Route `CableLab`, `src/screens/lab/cable/` (shell + 12 lesson bodies + shared
bits/ConnectorCard + verified data registry). Free Audio Fundamentals, `signal`
category, after Signal Detective, before Gain Staging. 12 lessons: what-travels
categories → anatomy/cross-sections → analog/loudspeaker/digital/power
connector cards → look-alike comparisons → selection scenarios → handling &
inspection → virtual cable tester (simulation-badged) → dual system challenges
→ final knowledge check. **Owner rulings:** the two superseded catalog
placeholder rows ('Cable Troubleshooting Lab', 'Audio Connectors and
Connections Lab') REMOVED; **full certificate credit at launch** — `af_cables`
is the 12th `audio_fundamentals` LabKey (raised gs3081 bar accepted); owner
runs `docs/APE_CABLE_LAB_SEED_2026_08_15.sql` AT LAUNCH, not before (unseeded
= graceful local-only credit). All completion units (9 lesson checks, tester,
two challenges, 7 critical-safety questions, final) clear ONLY on genuine
solves — the required-correct safety mandate is structural (each safety
question is its own persisted unit).

## R2 — CONNECTOR ARTWORK IS OWNER-SUPPLIED (post-build)

The code-authored Skia exemplar failed owner review (2026-08-15). Ruling: the
owner provides detailed drawings AFTER the build; the lab ships art-free with
`/* ART SLOT */` mount points, and NOTHING renders in them until the drawings
land — never a primitive stand-in (R3-2026-08-12 upheld). Pin-face contact
diagrams follow the same handoff; the face-geometry verification pass runs
against the owner's drawings. Strategic ANIMATION direction (owner
2026-08-15): a shared `useReduceMotion` + `Entrance` foundation shipped
(native-driver, static under reduced motion); set-piece animations (L2 peel,
L10 trace, L11 cascade) land WITH the artwork.

## R3 — SAFETY-CRITICAL CONTENT PROTOCOL (precedent for future labs)

All 48 connector records passed: author (claims tagged `— VERIFY`) →
web-armed verification against authoritative sources (2 independent sources
for safety claims) → adversarial refutation (attacking confirmations AND
verifier corrections) → correction application (refute-precedence) →
§13 acceptance sweep (6 dimensions, zero blockers) + data-integrity validator
(`scripts/validateCableLab.ts`, run via `npx tsx`). 93 claim-groups confirmed,
58 corrections applied (31 safety). Open items: 17 in-file `EXPERT REVIEW
PENDING` tags + the 30-item expert list in the verification report — none
shipping-blocking, all conservatively worded.

## R4 — POST-BUILD RATIFICATIONS (owner 2026-08-15)

- L4 answer keys as built (TOSLINK 'depends'; USB-C 'no').
- L11 Challenge B fault substitution (record-backed DC-adapter fault replaces
  the unsourceable phantom-patchbay fault); guitar added to Challenge A.
- L10 'relabel' = taught-against distractor, never a correct bench disposition.
- Copy pass DEFERRED to the owner's later date; the builder-flag inventory +
  sweep findings are the checklist. Sweep-driven copy fixes already applied:
  powerCON de-energize rule made absolute (no experience grading), AVB
  reclassified protocol-neutral (was 'audio-over-IP'), L1 AES50 removed from
  the networked-audio blurb, L10 intro no longer promises the not-yet-present
  wiring animation and lists the true disposition set.

## R5 — MIN_FONT_SIZE vs lab-chrome idiom — RESOLVED 2026-08-16 (chrome exempt; see APE_GOVERNANCE_DECISIONS_2026_08_16 R4)

The sweep found the cable lab's chrome (11.5pt chips, 10.5pt tags/eyebrows)
replicates MicSelect's ratified idiom, which itself sits below the
MIN_FONT_SIZE=12 token comment — a systemic conflict, not a builder error.
Safety-carrying text was raised to 12 (ConnectorCard confidence + tier
badges). Owner ruling wanted: exempt the established chrome idiom, or raise
both labs together. Until ruled, neither lab is patched file-by-file.
