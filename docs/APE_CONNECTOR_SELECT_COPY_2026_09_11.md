# Audio Connectors & Cable Selection Lab — copy sheet

**Status: ⏳ PENDING OWNER RATIFICATION** (built 2026-09-11 on the owner's
brief; design + cognition expert passes applied). All page copy is NEW; all
CONNECTOR FACTS are NOT new — they render directly from the Cable &
Connector Fundamentals Lab's verified ConnectorRecords (B2 protocol,
`docs/APE_CABLE_LAB_VERIFICATION_2026_08_15.md`), so nothing in the bench
cards re-opens fact verification. Any copy change re-opens here first once
ratified.

Full text lives in the source (single source of truth):
- `src/screens/lab/connectorselect/pagesA.tsx` (1–4: station 1 + analog and
  loudspeaker benches) · `pagesB.tsx` (5–8: digital/MIDI bench, the jobs
  matrix, declare-before-connect, cross-sections) · `pagesC.tsx` (9–12: the
  12 build-the-system scenarios + the cable tester) · `pagesD.tsx` (13–16:
  fault finder, safety, misconceptions, the job final)
- `src/screens/lab/connectorselect/data/` (roster flags, jobs matrix,
  scenarios, safety rules, misconceptions, assessment bank)
- `src/screens/lab/connectorselect/bits.tsx` (central-lesson card, verdict
  rows)

## The load-bearing sentences (review these first)

1. **The central lesson** (owner brief, verbatim; page 1, header subtitle,
   repeated on 7 and 16): *"A connector’s shape does not determine the
   signal, cable construction, level, or protocol."*
2. **The four questions** (page 1, repeated by every scenario verdict):
   1 · Does it physically fit? · 2 · What signal or protocol does the
   equipment expect? · 3 · Is the cable construction correct? · 4 · Is the
   connection safe?
3. **Three different things** (page 1): "the CONNECTOR you can see, the
   CABLE construction you mostly can’t, and the SIGNAL that isn’t in either
   until the equipment puts it there."
4. **TRS honesty** (page 2): "TRS does not mean stereo, and it does not mean
   balanced. It means three contacts; the equipment decides the rest."
5. **MIDI flag** (page 5 card banner + bench): "MIDI DATA — NOT AUDIO. A
   MIDI cable carries musical instructions (which note, how hard, which
   knob), never recorded sound."
6. **USB-C flag** (page 5): "Capabilities vary by device AND by cable."
7. **ARC/eARC flag** (page 5/scenario 10): return audio is "a port
   capability, not a cable guarantee" — only marked ports support it.
8. **The matrix rule** (page 6): compatibility needs "THREE things the plug
   cannot tell you: what the equipment expects, what the cable is built as,
   and which job this particular connection is doing."
9. **The declare gate** (page 7): "The app will not judge compatibility
   until you declare the signal. That is the point."
10. **The required comparison** (page 8, brief-mandated): "Instrument cable
    and speaker cable may use identical 1/4-inch connectors, but they are
    not interchangeable…"
11. **Tester honesty** (pages 12–13, pinned to the verified records):
    a continuity tester "cannot see the construction" — the wrong-type and
    at-rest-intermittent faults PASS the resting test by design.
12. **Fits-but-verify** (scenarios): a choice can pass all four questions
    visually and still be wrong — "It fits perfectly — and that proves
    nothing."
13. **The one damage case** (scenario 7 + safety rule 3 + final, safety-
    critical): "An amplifier output into any mic or line input can destroy
    the input circuitry."
14. **Price myth correction** (misconceptions): "Correct construction,
    correct specification, good condition and durability matter. Past that,
    price buys longevity and handling — not fidelity."

## Structure and rules (as shipped)

- 16 PagedLab pages = 7 stations + misconceptions + final; every page
  goal-latched (`manualDone`); progress `ape:connector-select:v1`.
- Final: 12 questions drawn from an 18-question bank with composition
  minimums (≥2 fault, ≥2 safety, ≥1 identify/select/same-job), shuffled
  questions AND options, pass = 80% AND every safety-critical answer
  correct, unlimited fresh draws. All pinned in
  `test/connectorSelect.test.ts`.
- Credit: `af_connector_select`, one unit per page (patchbay pattern) —
  inert until the owner runs `docs/APE_CONNECTOR_SELECT_SEED_2026_09_11.sql`.
- Images: 100% reuse of the verified `glossary-images` connector photos —
  ZERO missing assets, ZERO placeholders.
- Advanced connectors (TT/bantam, DB25, Euroblock, mini-XLR, multipin,
  opticalCON, MADI) deliberately excluded; the data model extends without
  UI rewrites (registry-driven).

## Deferred owner decisions (worked around, not blocking)

- **Ratification of this sheet** (page copy new; facts inherited-verified).
- **Device pass** of the 16 pages — Labs → Audio Fundamentals → Signal →
  Audio Connectors & Cable Selection, or web hash `#connectorselectpreview`.
- **Run the seed SQL** (makes the lab required for the gs3081 credit — same
  ruling as Patchbay).
- **Catalog position**: shipped right after Cable & Connector Fundamentals
  in the Signal category, member-only (matching the category) — move at
  will.
