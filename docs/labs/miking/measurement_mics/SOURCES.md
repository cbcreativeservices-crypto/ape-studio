# F11 Measurement Microphones and Calibration: SOURCES (technical reference) + Lab 6 part 2 source register (§0)

Lab: Miking Labs, Lab 6 Foley, Field & Scientific, scope F11.
Lesson: `docs/labs/miking/source_text/F11-Measurement-Microphones-and-Calibration-Miking-Technique.txt`
(line numbers = `cat -n` of that file). Checked 2026-10-07 by Claude (preparation pass, no app code).
Rules as `kick/SOURCES.md` and `lead_vocal/SOURCES.md`: values copied exactly; conversions mine (conv.);
UNKNOWN stays UNKNOWN. Status words used in every Lab 6b folder:
- **CONFIRMED** — read today at a reachable public page, quote given.
- **PRACTICE** — sound practice, stated by the lesson or a practitioner, not a published number; may be taught as a
  suggested starting point.
- **UNSOURCED** — the lesson states it with no reachable support; never drives geometry; drawing default only.
- **WRONG → correction** — the app text says the correction (log it in CORRECTIONS_LOG.md when building).
- **NOT RE-READ** — page refused (403) or paywalled today; the claim is plausible and kept as the lesson wrote it,
  never quoted as a number on screen unless it is otherwise confirmed.

## §0 Lab 6 part 2 shared source keys (F09–F16 folders cite these keys)

| Key | Source | URL | Status 2026-10-07 |
|---|---|---|---|
| NWS-LTG | NWS Lightning Safety overview (F09 [14], F10 [10], F12 [8]) | https://www.weather.gov/safety/lightning-safety-overview | 200: "If the sky looks threatening or if you hear thunder, get inside a safe place immediately"; "Wait 30 minutes after the last lightning or thunder before going back outside." |
| OSHA-ELEC | OSHA Construction eTool, Electrical Incidents (F09 [10]) | https://www.osha.gov/etools/construction/electrical-incidents/ | 200: "Stay at least 10 feet away from overhead power lines." |
| OSHA-G | OSHA 29 CFR 1910.95 Appendix G (F11 [11], F12 [3]) | https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.95AppG | 200: "it is considered good professional practice to calibrate instruments before and after each use"; area monitoring when "noise levels are relatively constant and employees are not mobile"; personal monitoring where "employees move about … or where the noise intensity tends to fluctuate". |
| OSHA-OTM | OSHA Technical Manual III-5 (F11 [10]) | https://www.osha.gov/otm/section-3-health-hazards/chapter-5 | NOT RE-READ (inspection pre/post calibration requirement, as the lesson says). |
| NTI-CAL | NTi Audio Class 1 sound calibrator (F11 [9]) | https://www.nti-audio.com/en/accessories/class-1-sound-calibrator | 200: "delivers 94 or 114 dB at a frequency of 1 kHz"; "classified for the calibration of class 1 measurement microphones"; optional "1/4″ Calibration Adapter". |
| GRAS-FF | GRAS microphone guide, free field / pressure / random incidence (F11 [3]) | https://www.grasacoustics.com/microphone-guide/free-field | 200: free-field mics "measure the sound pressure as it was before the microphone was introduced"; pressure mics "the actual sound pressure on the surface of the … diaphragm"; random incidence "sound comes from many directions". No pointing angle on the page. |
| GRAS-POL, GRAS-FAQ, GRAS-PWR | GRAS externally polarized vs prepolarized, FAQ, powering manual (F11 [4]–[6]) | lesson URLs | NOT RE-READ (statements are standard measurement-mic facts; no number drives geometry). |
| NIST-FF | NIST, "Importance of the free field calibration of microphones" (F11 [1]) | lesson URL | NOT RE-READ (publication abstract page; claim is textbook). |
| IEC-61672, IEC-60942, IEC-61043 | IEC webstore pages (F11 [2][7][8], F16 [13]) | lesson URLs | NOT RE-READ (webstore). Titles/scopes as the lesson states; consistent with known scopes. |
| FHWA-FG | FHWA Noise Measurement Field Guide (F12 [5]) | https://www.fhwa.dot.gov/ENVIRonment/noise/measurement/field_guide.cfm | 200: "Set microphone height at 5 ft (1.5 m) above the ground"; building positions: ≥ 10 ft from the side, 6.6 ft from the facade midpoint, and one "close to but not touching" the facade; interior mics ≥ 5 ft above floor and 3 ft from any wall. No meter class stated on that page. |
| NPS-RM47 | NPS RM47 part 2 data collection (F12 [7]) | https://www.nps.gov/subjects/sound/rm47-part-2-data.htm | 200: "High wind speeds (greater than 5 m/s or 11 mph) … recordings taken during high wind events are excluded". |
| ISO-1996 | ISO 1996-1 / -2 pages (F12 [1][2]) | lesson URLs | NOT RE-READ (iso.org returns 403 to the fetcher); titles consistent. |
| RA-T | Rational Acoustics, "Reverberation Time: Spilling the T on RT60" (F13 [4]) | https://support.rationalacoustics.com/support/solutions/articles/150000190451 | 200: T20 "between 5dB and 25dB down … multiplied by 3"; T30 "5dB and 35dB … multiplied by 2"; EDT "direct sound arrival to 10dB down, multiplied by 6"; endpoint "at least 10dB above the noise floor" → T30 needs 45 dB, T20 35 dB. |
| ISO-3382 | ISO 3382-1:2009 / 3382-2:2008 (F13 [1][2]) | lesson URLs | NOT RE-READ (403). Revision of part 1 found in search as a Committee Draft ("Spaces for music, speech and communication", geonoise.asia / iso.org 85701), not as a DIS — see F13 correction. |
| MEYER-MAPP | Meyer Sound MAPP 3D user guide (F14 [1][12]) | https://docs.meyersound.com/products/en/user-guide---mapp-3d.html | 200: mic heights "1.2 m (~4 ft.) for seated audience, 1.7 m (~5.6 ft.) for standing audience"; place mics "in logical order, e.g., front to back". The "beginning, middle and end … extra points for deep areas" wording and ground-plane text were NOT found on this page. |
| ISO-3744 | ISO 3744:2025 (F15 [1]) | https://www.iso.org/standard/80866.html (403); confirmed via SIS / Standards NZ listings | CONFIRMED by search: edition 4, published Dec 2025, "essentially free field over a reflecting plane", replaces the 2010 edition. |
| ISO-112xx | ISO 11200/11201/11202 (F15 [2]–[4]) | lesson URLs | NOT RE-READ. |
| DOSITS-AW | DOSITS, "How does sound in air differ from sound in water?" (new; for F16) | https://dosits.org/decision-makers/tutorials/science/air-water | via search: water reference 1 µPa, air 20 µPa; "26 dB of the difference" from the references; equal intensities differ by 61.5 dB in total. |
| PROBE-SPACER | B&K / GRAS intensity-probe data (new; for F16) | https://www.bksv.com/media/doc/bv0048.pdf ; GRAS 50AI-LP page | via search: spacers 12, 25 and 50 mm "to cover the frequency range from 100 Hz to 10 kHz" (one maker); another set 8.5/12/50 mm. Medium (search snippet). |
| MW-ULA | MathWorks, time-delay beamforming of a microphone ULA (F16 [5]) | https://www.mathworks.com/help/phased/ug/time-delay-beamforming-of-microphone-ula-array-gs.html | 200: "omnidirectional microphone elements spaced less than one-half the wavelength"; example spacing 0.01 m. |
| AMBEO-REC | Sennheiser AMBEO VR Mic recording instructions (F10 [5]) | https://docs.cloud.sennheiser.com/en-us/ambeo-vr-mic/manual-recording.html | 200: four capsules "recorded separately on four tracks using identical microphone preamplifiers"; "Set the same gain for each of the four channels"; linked gain recommended. |
| DPA-PLANT | DPA dictionary, plant mic (F09 [6]) | https://www.dpamicrophones.com/dictionary/p/plant-mic/ | 200: "A small microphone for hiding in a fixed place on set …". |
| SHURE-LAV | Shure, how to choose a lavalier (F09 [5]) | https://www.shure.com/en-GB/insights/how-to-choose-the-best-lavalier-microphone | 200: "Place the shirt microphone above the sternum"; no distance from the mouth. |
| RODE-SG | RØDE shotgun distance help article (F09 [3]) | lesson URL | NOT RE-READ (403). |
| CALC-* | app calculators: `leq`, `combine` (splSafety.ts), `rt60`/`eyring`/`drr` (rooms*), sensitivity (micsRf.ts, "94 dB SPL ≈ 1 Pa") | in repo | the lab calls them, never copies constants. |

## §1 F11 claims

| # | Line | Claim | Status |
|---|---|---|---|
| 1 | L5 | Free-field, pressure and diffuse sensitivities differ, "particularly at high frequencies" | CONFIRMED in substance (GRAS-FF definitions); NIST page NOT RE-READ |
| 2 | L6 | dBFS is relative to digital maximum, not SPL | CONFIRMED (definition; SOURCES_SHARED / calc) |
| 3 | L6 | IEC 61672-1 specifies complete sound level meters | NOT RE-READ (scope consistent) |
| 4 | L13 | Free-field mic: "defined incidence angle, often 0° on axis" | PRACTICE (GRAS page gives no angle); keep "follow the mic's data" |
| 5 | L15–19 | Pressure mic for couplers/flush; random-incidence for diffuse fields | CONFIRMED (GRAS-FF) |
| 6 | L26 | Externally polarized needs polarization supply; prepolarized often CCP/IEPE; not automatically compatible with 48 V phantom | NOT RE-READ (GRAS-POL); standard fact — safety-relevant wording kept exactly |
| 7 | L28 | IEC 60942:2017 calibrator classes; IEC 61672-3 periodic tests | NOT RE-READ (titles consistent) |
| 8 | L30 | Calibrator "94 dB at 1 kHz, 114 dB at 1 kHz"; 1/4-inch capsule needs adapter | CONFIRMED (NTI-CAL) |
| 9 | L32 | "OSHA requires documented pre- and post-use calibration for its compliance measurements … good professional practice more broadly" | "good professional practice" CONFIRMED (OSHA-G); inspection requirement NOT RE-READ (OSHA-OTM) |
| 10 | L33 | One-frequency check ≠ full response | CONFIRMED (physics; plan wording) |
| 11 | L35 | Operator near the capsule changes the field | PRACTICE (physics) |
| 12 | L40 | Coupler emits a high level; never at a person's ear | PRACTICE, safety — keep exactly |
| 13 | L45 | "instructor supervision" | WRONG (institutional wording) → "with someone qualified on the equipment" |
| 14 | L2, L20, L43 | "Pro Audio Training Academy", "classroom", "Student" | WRONG (wording) → strip / "you" |
| 15 | L36, L89 | Cross-links to F13–F16 | now valid (F13–F16 delivered) |

Numbers available to draw: 94 / 114 dB at 1 kHz (calibrator), 94 dB SPL ≈ 1 Pa (calc). No mic heights or distances.
