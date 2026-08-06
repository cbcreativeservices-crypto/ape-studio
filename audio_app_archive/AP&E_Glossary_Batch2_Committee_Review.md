# AP&E Glossary — Batch 2 Committee Review

**Scope:** 50 terms, alphabetical positions 51–100 (*Air Break / Aircheck* → *Audyssey / Auto Room Calibration*)
**Date:** 2026-06-20 · **Status:** Pending Approval
**Committee:** **T** Technical · **L** Learning/Instructional · **R** Readability · **C** Communications — each reviewed all 50 independently; Master Editor consolidated.
**Output depth:** full narrative for Major/Moderate-technical revisions; condensed log for the rest.

---

## Part A — Full committee narrative (Major + key technical revisions)

### all-pass filter  *(AUDI201 · Equalization)* — Major

- **T:** Definition was accurate but bloated and circular (restated "passes all frequencies / shifts phase" three times). No factual error. **Rec:** tighten to one precise statement.
- **R:** The Plain-English was four dense textbook sentences plus a filler closer ("Understanding all-pass filter applications helps engineers…"). **Rec:** rewrite to a "when vs. how loud" framing — it changes *timing*, not *tone*.
- **L:** Reframe as a "timing tool, not a tone tool" to aid retention. **C:** remove redundancy between Concise and Plain-English; Related Terms had non-resolving refs.
- **Consensus:** **Major (style/precision, not fact).** Confidence: High.
- **Applied:** Concise → *"passes all frequencies at equal amplitude while shifting their relative phase, producing a frequency-dependent delay without altering tonal balance — used for phase correction, loudspeaker time alignment, and crossover design."* Plain-English rewritten; Related Terms cleaned; Media → `diagram: flat amplitude across the band overlaid with a phase-shift curve`.

### amplifier classes  *(AUDI201 · Amplifiers)* — Major

- **T:** Class B efficiency stated as "~75%" — corrected to the accepted theoretical maximum **78.5%**; Class A clarified (~25% capacitive vs up to 50% transformer-coupled). Web-verified. **Rec:** fix figure, de-bloat.
- **R / L:** Five-sentence wall of percentages and bias jargon with high cognitive load. **Rec:** lead with the core trade-off (efficiency vs distortion); add an efficiency-ordered memory aid (Class A wastes most heat → Class D least) and a touring-rack example.
- **C:** 8 non-exact cross-references; rebuilt to canonical names.
- **Consensus:** **Major.** Confidence: High.
- **Applied:** Concise + Plain-English rewritten (trade-off first; Class B corrected to "up to about 78%"); Related Terms rebuilt; Scenario made concrete; Media → `infographic: comparison table/bar chart of Class A/B/AB/D showing conduction angle and efficiency`.

### Asymmetrical clipping  *(AUDI201 · Amplifiers)* — Minor (technical)

- **T:** Concise said clipping "produces even-order harmonics." Imprecise: asymmetrical clipping adds **even-order on top of the odd-order** that clipping already produces — that's the distinguishing trait vs symmetrical clipping. Web-verified. **Rec:** correct the harmonic claim.
- **L/R/C:** No readability/structure issues. **Consensus:** **Minor, High confidence.**
- **Applied:** Concise corrected; Scenario made concrete; Media → `diagram: a sine wave clipped more on one peak with its harmonic spectrum`.

---

## Part B — Condensed log (Moderate revisions)

| Term | Change | Owner |
|------|--------|-------|
| Analytics | Removed self-reference; Scenario rewritten to a concrete reporting situation | C, L |
| Antenna distribution | Plain-English tightened; 6 non-resolving cross-refs cleaned; Scenario made concrete | R, C, L |
| Apprenticeship | Removed self-reference; Scenario → real apprenticeship situation | C, L |
| Asset Management | Removed self-reference; Scenario rewritten | C, L |
| Assignment of Rights | Removed self-reference; Related Terms repaired | C |
| ATSC / ATSC 3 | Scenario made concrete; positioned as umbrella vs *ATSC 3.0* deep-dive | L, C |
| ATSC 3.0 | Scenario concrete; Difficulty advanced → intermediate (twin alignment) | L |
| Audience Engagement | Removed self-reference (only had 3 related terms); Scenario rewritten | C, L |
| Audio Installation and Integration | Removed self-reference; linked to installer roles; Scenario concrete | C, L |
| Audio Installer | Removed self-reference; differentiated from Systems Technician | C, L |
| Audio Systems Technician | Removed self-reference; differentiated from Installer | C, L |

## Part C — Minor revisions (condensed)

Scenario Contexts upgraded from telegraphic labels to picture-able situations and/or Related Terms cleaned, Media added: Air Break / Aircheck · Airborne sound · Alarm threshold · Algorithm · Aliasing *(also Plain-English + Difficulty advanced→intermediate)* · Alignment window · Ambient noise · Amplifier *(also Media copy-paste fix)* · Amplitude scale · Analog Recording · Anechoic · Anode / Plate *(HV hazard moved into Scenario)* · ARC / eARC · Architectural acoustics *(Media copy-paste fix)* · Arcing *(HV hazard into Scenario)* · Areas of Expertise · Arrival time · ASCII import · ASIO · ATSC A/85 · Audience absorption *(Media copy-paste fix)* · Audio Bridge · Audio Emitter · Audio Middleware · Audio Occlusion · Audyssey *(Media copy-paste fix)*.

## Part D — No changes required (Media recommendation added; kept *approved*)

Definitions verified accurate and well-written; only the blank Media field was populated:
Acoustic-strong exemplars and clean entries across the batch (10 terms), including those Agent 2 cited as models other cards should follow.

---

## Student Learning Notes (selected)

- **Aliasing memory aid:** the wagon-wheel that appears to spin backward in old films — sampling too slowly makes a high frequency masquerade as a low one.
- **amplifier classes:** efficiency climbs A → AB → D; Class A is the cleanest but runs hottest, Class D runs coolest — which is why touring power racks are Class D.
- **all-pass filter:** think "timing, not tone" — it moves *when* frequencies arrive without changing *how loud* they are.
- **Safety (Anode/Plate, Arcing):** tube plate voltages and arcing are lethal — these cards now put the shock hazard in the scenario, not buried in a footnote.

## Cross-committee flags carried forward

- **Self-reference artifact** is systemic in business/career terms (109 more found across 51–550).
- **Category** issues noted but untouched per your instruction (e.g. *BPM* in "Cables & Connectors").
- **C-weighting** (Batch 4 territory) has a factual error the parallel pass caught; logged for that batch, not changed here.
