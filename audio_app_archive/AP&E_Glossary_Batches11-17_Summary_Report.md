# AP&E Glossary — Batches 11–17 Summary Report

**Scope:** terms 501–850 alphabetically (*HRTF* → *Professional Conduct*)
**Date:** 2026-06-20 · **Status:** CANDIDATE / PENDING APPROVAL
**Master output:** `AP&E_Glossary_v10_Batch17_MASTER.xlsx` (cumulative: Batches 1–17)
**Review method:** full 5-member committee on every batch — Agent 1 Technical, Agent 2 Learning, Agent 3 Readability, Agent 4 Communications (four independent expert subagents) + Master Editor consolidation.

---

## Cumulative position

| | Count |
|---|------:|
| Terms reviewed (Batches 1–17) | **850 of 1,203 (~71%)** |
| Terms revised (file-wide) | **785** |
| Terms still original (`approved`) | 418 |
| Blank Media in reviewed range | 0 |
| Self-references in reviewed range | 0 |
| Residual authoring annotations | 0 |

## Per-batch results (Batches 11–17)

| Batch | Terms | Revised | Media-only | Headline issues |
|------:|------:|--------:|-----------:|-----------------|
| 11 (501–550) | 50 | 47 | 3 | 19 self-refs; 5 copy-paste Media; impulse-response duplicate cluster |
| 12 (551–600) | 50 | 50 | 0 | **K-weighted LUFS** target corrected (~−14, not −13); **Line Level** −10 dBu→**−10 dBV** unit error; KSM8 (dynamic) miscited as a large-diaphragm condenser; malformed term *"Line level (+4 dBu"* |
| 13 (601–650) | 50 | 50 | 0 | **Major: LUFS uses K-weighting, not A-weighting** (BS.1770); Mains-hum remedy fix; M/S "discrete surround" claim removed; MADI channel-count caveat; malformed term *"low-pass,"* |
| 14 (651–700) | 50 | 50 | 0 | **Multipin tube mic cable** "phantom power" error (tube mics aren't phantom-powered); **Mic preamp** is the *first* gain stage, not final; Measurement-interface hardware/software contradiction; mic-sensitivity specs |
| 15 (701–750) | 50 | 50 | 0 | 4 copy-paste Media; **"ohm (Ω)"** symbol corruption (rendered "(W)"); 7 self-refs; Noise Gate / Gate duplicate |
| 16 (751–800) | 50 | 50 | 0 | **phaser** cascaded-all-pass mechanism; **phantom-power fault** ribbon-damage cause; **piezo** high-Z load; 4 copy-paste Media; 9 self-refs; Patch-bay normalling vocabulary undocumented |
| 17 (801–850) | 50 | 50 | 0 | **plug-in power** voltage range (~1.5–5 V); 4 copy-paste Media; 8 self-refs; *Precedence effect* duplicates *Haas Effect / Precedence Effect*; Pot/Potentiometer duplicate |

## Most important technical corrections (High confidence)

- **LUFS / loudness family (the standout).** *LUFS* wrongly stated **A-weighting**; the ITU-R BS.1770 standard uses **K-weighting**. Corrected, and the streaming/broadcast targets were reconciled across the cluster (~−14 LUFS streaming; −23 LUFS EBU R128 / −24 LKFS ATSC A/85). *K-weighted (LUFS)* "YouTube −13" corrected to ~−14.
- **Line Level** — consumer level is **−10 dBV** (not −10 dBu); the entry was internally inconsistent. Corrected.
- **Multipin tube mic cable** — does **not** carry phantom power; it carries the audio pair plus the tube's heater and high-voltage B+/polarizing supply from a dedicated PSU.
- **Microphone preamp** — the **first** gain stage in the chain, not the "final amplification stage."
- **Large-Diaphragm Microphone** — the cited Shure **KSM8 is a dynamic** mic; replaced with genuine large-diaphragm condensers (U87, C414, TLM 103).
- **phaser** — added the defining **cascaded all-pass** notch-generating mechanism.
- Plus precision fixes to Mains-hum remedy, M/S recording, MADI channel count, mic sensitivity (mV/Pa), mic output transformer, phantom-power fault, piezo loading, and plug-in power.

## Systemic patterns (handled)

1. **Self-references** — ~72 more removed across Batches 11–17, again concentrated in MUSI108/205B business/career/legal terms. Reviewed range (1–850) now 0 remaining.
2. **Copy-paste Media drift** — ~28 more wrong-term Media notes corrected; all internal "(ONE … for X)" annotations stripped. Reviewed range now 100% clean.
3. **Telegraphic Scenario Contexts** and **boilerplate "X uses it" Practical Application** — the dominant learning defects; hundreds rewritten into concrete, procedural, workplace-anchored text.
4. **"Plain-English denser than the Concise"** spec-sheet entries — simplified throughout without losing accuracy.

## Data-hygiene issues flagged (NOT auto-fixed — need your decision)

These are **Term-field / encoding artifacts**; I did not rename terms or rewrite headwords without approval, because cross-references point to them:

- **Malformed term labels:** `"Line level (+4 dBu"` (unclosed parenthesis), `"low-pass,"` (trailing comma), `"ohm (W)"` (the Ω/omega symbol mojibaked to "W" — confusable with watt), and a stray `"M&E; Track"` semicolon in some Related fields.
- **Content gap:** the **normalling vocabulary** (*Normalled, Half-Normal, Non-Normalled, TT/Bantam*) that the *Patch bay* entry depends on has **no glossary entries**. Likewise *Mono compatibility*, *Anti-aliasing filter*, *Spectral leakage* are referenced but undefined.

## Duplicate / near-duplicate clusters flagged (NOT merged — pending your decision)

Impulse response cluster · Mic Preamp / Microphone preamp · Measurement-engine / Multi-engine · Noise Gate / Gate · Omnidirectional / Omnidirectional Microphone · Parametric EQ / parametric equalizer · Patch bay / patchbay · Pot / Potentiometer · Pan control / Pan-Panning · Polarity check / Polarity test · **Precedence effect / Haas Effect-Precedence Effect** · Low-Pass Filter / "low-pass," · Line Level / "Line level (+4 dBu".

## Items requiring future review

1. **Duplicate consolidation** and **malformed-headword cleanup** — approve a policy; both need a Term-field edit pass.
2. **Missing terms** — approve adding the normalling vocabulary and the other referenced-but-undefined terms.
3. **Category** — many miscategorizations logged (Loudspeaker under "Dynamics Processing," M/S recording under "Cables & Connectors," etc.) but **left unchanged** per your instruction.
4. **Weight %** — still blank where originally blank.
5. **Remaining scope** — terms 851–1,203 (~353 terms, Batches 18–24) not yet reviewed.

## Verification performed

- Reviewed range (terms 1–850): 0 blank Media · 0 self-references · 0 residual annotations. ✓
- 785 terms flagged *Revised / Pending Approval*; 418 untouched `approved`; no spillover. ✓
- 1,203 data rows and all 3 sheets preserved. ✓
- LUFS K-weighting, Line Level dBV, and tube-cable fixes confirmed in the saved master. ✓

**Nothing marked Final or Production-Ready.** All revisions are *Candidate / Pending Approval*.
