# Cable & Connector Lab — Content Fact-Verification Report (2026-08-15)

**Scope:** all 48 connector records in `src\screens\lab\cable\data\connectors.*.ts`.
**Status: VERIFIED WITH OPEN ITEMS TRACKED.** Every claim in the shipped copy is
confirmed, corrected, conservatively hedged, or explicitly tagged — nothing is
silently unverified. No open item blocks shipping: each carries safe-direction
wording pending expert ratification.

## Method (owner mandate: 100% accuracy, human safety)

1. **Authoring** (5 parallel agents + hand-authored XLR exemplar) — every record
   tagged its claims `— VERIFY`; authors surrendered 100+ self-flagged doubts.
2. **Verification** (5 web-armed agents) — every pinout, rating, mating claim,
   hot-plug policy, consequence and caution checked against authoritative
   sources (AES14/AES3/AES11/AES59, IEC 60268-12/60320-1/61938/60958/61169-8/
   60825-2/61300-3-35, ANSI E1.11/E1.24, NEMA WD 6, IEEE 802.3, USB-IF, HDMI
   pinouts, MIDI CA-033, TIA-568, NEC/OSHA/ESFI, Neutrik primary documentation,
   Rane notes). Safety claims required two independent sources.
3. **Adversarial refutation** (5 skeptic agents) — attacked every safety-relevant
   teaching *including the verifiers' confirmations and proposed corrections*.
   Two verifier corrections were themselves corrected (permission-shaped
   wording); several confirmations were narrowed.
4. **Application** (5 agents) — 58 corrections applied, refute-precedence on
   conflicts; every deviation documented. tsc clean.

**Tally:** 93 claim-groups confirmed with citations · 58 corrections applied
(31 safety / 27 accuracy-wording) · 17 in-file `EXPERT REVIEW PENDING` tags ·
11 in-file `VERIFY` tags remain on uncorroborated-but-low-risk claims (each is
non-safety or already conservatively worded).

## The catches that changed shipped copy (highlights)

| Was going to teach | Now teaches | Why |
|---|---|---|
| "Exposed pins only energized once fully inserted" | Partial-insertion blade exposure is real (NEMA blades have no insulating sleeves); one full motion, grip the body | ESFI TRR white paper |
| "Live contacts are never exposed pins" | "Should never be — design rule, NOT a guarantee"; male-to-male backfeed cords exist | CPSC stop-use warning |
| Phantom "not a shock hazard" (alone) | + a tingle from a mic is NEVER phantom — it's a mains ground fault: stop, power down, qualified person | Documented stage fatalities |
| speakON load-break "model-specific rating may exist" | NO speakON is rated to break load — Neutrik marking "NOT FOR INTERRUPTING CURRENT" | Neutrik BDA 114 |
| "PoE energizes only after detection" | Standards-based PoE only — passive injectors energize permanently, no detection, can damage gear | FS/UI documentation |
| TOSLINK check: "look for the light at the free end" | Fiber-safe technique: project onto palm/surface, never toward the eye (habit must not transfer to IR laser systems) | FOA/Fluke fiber safety |
| Multipin "keying prevents cross-mating" | Keying is NOT the safeguard — identical 19-pin connectors serve both mains and speaker feeds; labels govern | Commercial Socapex-audio products |
| IEC couplers "no breaking capacity per IEC 60320" | Accurate CBC-classification framing with the "routine/occasional" permission loophole stripped | IEC 60320-1 cl.19 + refuter pass |
| Speaker lines "unpleasant shock" | ≥100 V rms on high-power outputs = genuine shock hazard (lightning-flash marking; Class 3 wiring modes) | QSC manuals, Rane 136 |
| (absent) | Patch plugs short contacts during insertion — phantom off + drained before repatching mic points | SoS/Focusrite |
| (absent) | Grip the plug body, never pull the cord (mains_wall commonMistakes) | OSHA 1910.334/ESFI |
| 120V-device-on-230V "damaged or fails" | Can fail violently — burst capacitors, smoke, fire risk; breaker will not save it | Multiple engineering refs |
| USB-C "negotiates down, so safe" | True for compliant cables; non-compliant cables have destroyed equipment — buy certified | Benson Leung/Pixel case |
| BNC hot-plug "normally fine" | mute_first (every slaved device unlocks/relocks); + vintage pre-1978 75Ω pin caveat; + bias-tee DC on RF lines | SoS/Sweetwater + IEC 61169-8 history |
| Telephone-jack consequence "mechanical only" | POTS lines carry ~48 V DC / ~90 V AC ringing — identify unknown building jacks first | Sandman/installer guidance |
| HDMI hot-plug unconditional | + equipment-dependent ground-potential edge case (poorly bonded CATV feeds); power down when patching unfamiliar installs | Field-report grade, hedged |

## Expert-review list (for the owner — none block shipping)

**Electrical / licensed-electrician review:**
1. NEMA 5-15 partial-insertion exposure wording (geometry varies by receptacle design).
2. Ground-fault mic-shock caution placement (record-level now; lab-level safety panel option) + GFCI/RCD reference.
3. GFCI 5 mA vs RCD 30 mA distinction when regional mains records are added.
4. 120V→230V overvoltage consequence — sources are engineering-blog grade (weakest set in the batch); wording is conservative.
5. Twist-lock/stage-pin: keep female-source convention teaching vs replace entirely with "treat all contacts as live."

**Amplifier / loudspeaker specialist:**
6. Tube-amp no-load caution wording ("power off" vs "standby").
7. Bridged/floating outputs caution — ratify against a major-manufacturer bridge-mode manual page.
8. Post-power-off stored-energy: "wait for silence" vs fixed dwell.
9. mute_first vs de_energize_first policy split for speakON family.
10. Bi-amp 2-pole→4-pole HF-driver damage wording.
11. NL8 ">100 V" figure vs the amp classes the curriculum pictures.

**Manufacturer (Neutrik) confirmations:**
12. Explicit statement that speakON/powerCON families physically cannot cross-mate (copy no longer relies on it).
13. Whether any speakON (incl. STX) carries formal breaking-capacity certification (reconciles dealer "arc protection" copy vs BDA 114 marking).
14. NL8 secondary-locking-ring history (claim removed).

**Standards-document access needed (paywalled):**
15. IEC 60320-1:2021 CBC clause number; polarized-C7 sheet status.
16. IEC 60603-11 exact coverage (6.35 mm + 3.5 mm).
17. AES11 annex language for word-clock practice (reworded to DARS framing already).
18. USB-IF chapter-level citations; TOSLINK IEC 60825 class per component datasheet.
19. IEC 62368-1 TNV classification for the telephone ring-voltage note.

**Domain professionals:**
20. HDMI ground-potential hot-plug edge (AV integrator, CTS/CEDIA).
21. DC bias-tee on RF coax citation (broadcast engineer).
22. Pre-1978 75 Ω BNC pin-diameter (connector-manufacturer app notes).
23. PoE Type 3/4 disconnect policy: normally_fine + wear caveat (shipped) vs prefer port-disable.
24. Euroblock 70/100 V wording vs non-US jurisdictions (100 V lines are the norm outside NA).
25. Phantom-off-before-patching as lab POLICY vs caution; drain-time figure (~30 s).
26. DMX re-plug venue-policy framing; optional E1.11 "not for safety-critical control" line.
27. Stage-pin pin-splitter maintenance boundary (policy statement, not cited fact — tagged in-file).
28. Region list of receptacles a bare 4 mm banana pin can enter (hedged "some regions" shipped).
29. Insert/patch prevalence claims ("commonly tip-send") — hedged ceiling confirmed correct.

**Owner style ruling wanted:**
30. The speakON hot-plug rationale now quotes Neutrik's certification marking by name in rendered copy ("Neutrik's own speakON instructions carry…"). This deviates from the no-brands voice rule but is nominative use of the manufacturer's own safety marking. Keep or paraphrase?

## Remaining in-file `— VERIFY` tags (11)

Low-risk, non-safety-gating claims neither confirmed nor corrected by the pass
(e.g. trs_quarter unbalanced-stereo wiring note, bare_wire conductor-sizing
guidance, xlr5 dual-ear intercom wiring variant, ethernet cable-category
details). Each remains visibly tagged in its file; the B9 acceptance sweep
re-checks that none migrated into lesson copy without resolution.

## Where everything lives

- Corrections + confirmations detail: workflow journals `wf_b50d7075-533`
  (verify/refute) and `wf_3ef26daf-aab` (apply), plus per-family sheets in the
  session scratchpad. Citations are embedded per-claim in each record's
  `sourceNotes`.
- This report is the audit trail of record for the lab's §10 accuracy mandate.
