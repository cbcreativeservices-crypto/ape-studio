# Comp B brief: fact-check the Cable lab's flagged claims (2026-10-20)

**Status: DRAFT.** The owner asked Comp B to check these (2026-10-20).

## Why
The Cable lab teaches connectors and wiring. Each claim below is tagged in the code as **VERIFY** (needs a standard or document checked) or **EXPERT REVIEW PENDING** (needs a working professional's confirmation). The labs must be grade A: nothing a professional would object to.

## What you have
This brief and the four connector data files (`2_lab_files/`). The claim text is quoted exactly as it is in the code.

## For each claim, reply with ONE of
- **CONFIRMED** — with the source (standard number and clause, maker document, or textbook), and any wording change you suggest;
- **CORRECT IT** — what is wrong, the right statement, and the source;
- **CAN'T CONFIRM** — what you found, and how a learner-facing line should be hedged.
Do not guess. Mark anything uncertain "(verify)". No gear maker or model names in suggested learner text (everyday industry names such as speakON are fine where the lab already uses them).

## Reply format
| # | Verdict | Source | Suggested wording (if any) |
|---|---|---|---|

## The claims
1. **connectors.analog.ts:236** — Tube amplifier driven without a speaker load can damage its output transformer and tubes; power the amplifier off before changing speaker connections: amplifier-technician consensus (diyAudio, Marshall Forum) — EXPERT REVIEW PENDING
2. **connectors.analog.ts:365** — Unbalanced stereo wiring tip = left, ring = right, sleeve = common: universal headphone/stereo convention — VERIFY
3. **connectors.analog.ts:479** — Stereo wiring tip = left, ring = right, sleeve = common: universal consumer convention; 3.5 mm connector family IEC 60603-11 — VERIFY
4. **connectors.digital.ts:579** — Cable categories and their supported speeds/distances: ANSI/TIA-568 series — VERIFY
5. **connectors.digital.ts:690** — PoE behavior unchanged by the shell: IEEE 802.3 — VERIFY
6. **connectors.digital.ts:805** — Word clock distribution commonly implemented as a 75-ohm system; termination practice varies by equipment: AES11 (DARS reference synchronization; word clock practice per equipment documentation) — convention VERIFIED 2026-08-15: Sound On Sound digital interfacing; AES11 citation wording — EXPERT REVIEW PENDING
7. **connectors.digital.ts:807** — Coaxial digital audio interconnection at 75 ohms (AES3id/S-PDIF coax practice): AES-3id / IEC 60958 — VERIFY
8. **connectors.digital.ts:808** — Pre-standard (pre-1978) 75-ohm BNC center-pin diameter variance can mis-mate with or damage the other family: forum/blog-grade broadcast engineering reports + IEC 169-8 standardization history — EXPERT REVIEW PENDING
9. **connectors.digital.ts:809** — Some RF/antenna distribution coax carries always-on DC (bias-tee feeds for remote amplifiers) on the center conductor: data-alliance.net BNC applications + general bias-tee practice — EXPERT REVIEW PENDING
10. **connectors.digital.ts:912** — ADAT optical interface: multichannel protocol distinct from S/PDIF over the same fiber/connector — protocol documentation — VERIFY
11. **connectors.digital.ts:913** — Typical TOSLINK sources are low-power red LEDs (not lasers) and are regarded as eye-safe in normal use: Toshiba TOSLINK Fiber-Optic Devices Product Guide — VERIFIED 2026-08-15; formal IEC 60825 classification per component datasheets — EXPERT REVIEW PENDING
12. **connectors.digital.ts:1036** — Live-replug HDMI port damage via chassis ground-potential difference (equipment/venue-dependent edge case): field-report grade (AVS Forum / All About Circuits) — EXPERT REVIEW PENDING
13. **connectors.recognition.ts:716** — Dual-ear intercom headset and stereo microphone wiring on 5-pin XLR varies by system; documentation governs — VERIFY
14. **connectors.recognition.ts:1017** — Retention is friction-fit via split pins with no positive lock; pin tension is restored with a dedicated pin-splitter tool: ANSI E1.24 + tool manufacturer documentation — VERIFIED 2026-08-15; the qualified-tech-only boundary for pin tensioning is a lab/site-procedure policy statement, not a cited standard — EXPERT REVIEW PENDING
15. **connectors.speaker.ts:141, connectors.speaker.ts:289** — speakON and powerCON are differently keyed families; cross-family non-mating asserted by trade sources, no explicit Neutrik guarantee located — teach label-first, fit-never — EXPERT REVIEW PENDING
16. **connectors.speaker.ts:145** — Full-range feed into a bi-amp-mode cabinet can damage the high-frequency section (a 2-pole lead engages circuit 1 only, which may be the HF section): compression drivers require high-pass protection — EXPERT REVIEW PENDING
17. **connectors.speaker.ts:147, connectors.speaker.ts:293, connectors.speaker.ts:396** — Bridged and floating amplifier outputs drive both terminals; never treat − as ground or ground a speaker output terminal: amplifier manual bridge-mode warnings — EXPERT REVIEW PENDING
18. **connectors.speaker.ts:397, connectors.speaker.ts:503, connectors.speaker.ts:607** — Amplifier outputs can remain driven briefly after power-off (stored energy); confirm silence before handling: verify-de-energized practice (NFPA 70E principle) — EXPERT REVIEW PENDING
19. **connectors.speaker.ts:602** — Conductor sizing versus run length and load (voltage drop / damping): amplifier and loudspeaker documentation, wire-gauge tables — VERIFY
20. **connectors.speaker.ts:605** — Ferrule use for stranded wire in screw-clamp terminals: terminal manufacturer guidance — EXPERT REVIEW PENDING
21. **connectors.speaker.ts:606** — Cable polarity marking schemes (stripe/ribbing/print) are manufacturer conventions, not a standard: cable manufacturer documentation — VERIFY
22. **connectors.speaker.ts:707** — Professional practice favors locking loudspeaker connectors for high-power use: current industry practice, cross-check against pro-audio installation guidance — VERIFY

## What happens next
ccode applies the confirmed and corrected items, removes their VERIFY / EXPERT REVIEW tags, and adds a test. The owner signs off.
