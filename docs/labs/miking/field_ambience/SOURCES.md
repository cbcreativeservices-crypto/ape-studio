# F06 Natural and Urban Ambience: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/F06-Natural-and-Urban-Ambience-Miking-Technique.txt` (`cat -n` lines).
Checked 2026-10-07 (Claude, preparation pass). Keys and rules: `foley_footsteps/SOURCES.md` §0.
F06 defines the shared FIELD family (frame G, wind protection, weather/wildlife/traffic safety, field log).

## a. Facts read today

| Fact | Value (exact) | Source | Confidence |
|---|---|---|---|
| ORTF | "the critical 17cm distance for ORTF stereo technique"; "110 degrees for ORTF placement" | RODE-BAR | High |
| XY | "90 degrees for X-Y stereo arrays" | RODE-BAR; DPA-STEREO "90° angle (±45°)" | High |
| AB spacing example | "a recording angle of ±70° can be achieved by spacing the cardioid microphones 20 cm" (cardioids); spacing read from DPA's curves | DPA-STEREO | High |
| M/S | L = M + S, R = M − S (÷√2); Side cancels in mono | DPA-STEREO | High |
| High wind (monitoring) | "High wind speeds (greater than 5 m/s or 11 mph), begin to interfere with the acoustic equipment's ability to record sound" (threshold from ANSI S12.9-2013) | NPS-RM47 | High |
| Weather pairing | "NPS collects data about wind direction, and wind speed, and in some cases, air temperature, and humidity" (wind at 1-second intervals) | NPS-RM47 | High |
| Monitoring duration (science only) | "a minimum 25-day measurement period limits the measurement uncertainty of acoustic data" (±3 dB median levels) | NPS-RM47 | High (monitoring protocol, NOT a creative-bed rule) |
| Wildlife distance | "25 yards from most wildlife and 100 yards from predators like bears and wolves" (Olympic NP: 50 yd); "If animals react to your presence you are too close"; "do not use bird calls or wildlife calls and attractants" | NPS-WILD | High (US national parks) |
| Outdoor mic and rain | "Although it's extremely rugged, the SM63 must still be sheltered from rain, sleet, snow, and other precipitation when outdoors." | S-SM63 | High |
| Foam vs open habitat | "A foam windscreen is adequate for recording in protected areas, such as the interior of a forest, but is insufficient for recording in grasslands and other windy open habitats."; a zeppelin with "long-hair windcoat" is "the most effective" (some HF loss) | CORNELL-ACC | High |
| Lightning | "If you hear thunder, you are likely within striking distance of the storm."; "When Thunder Roars, Go Indoors!"; "Substantial buildings and hard-topped vehicles are safe options. Rain shelters, small sheds, and open vehicles are not safe."; "Wait 30 minutes after the last lightning or thunder before going back outside." | NWS-LTG | High |
| Noise exposure | "The NIOSH recommended exposure limit (REL) for occupational noise exposure is 85 A-weighted decibels (dBA) over an eight-hour shift"; 3 dB exchange rate | NIOSH-NOISE | High |

## b. Lesson claims checked

| Claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 NPS: site, time, weather, wind, human sound are consequential [1, 2] | **CONFIRMED** (RM47; NPS-FIELD not re-read) | NPS-RM47 site-selection text. |
| L15 XY "as close as the mount permits" [3] | **CONFIRMED** + angle missing → 90° (F06-C2) | DPA-STEREO, RODE-BAR. |
| L18/L30 ORTF 17 cm, 110° included, "not 110 degrees to each side" [3, 4] | **CONFIRMED** | RODE-BAR; Lab 5 register. (DPA's own "±110°" wording is the slip — D-ORTF in `foley_perspective/SOURCES.md`.) |
| L21 AB "deliberate, documented spacing" [3] | **CONFIRMED (no default given)** | Add DPA's 20 cm / ±70° example as ONE documented choice; AB omni spacing for ambience: drawing default (owner O-8). |
| L24 M/S decode; raw Side ≠ right channel [3, 5] | **CONFIRMED** (DPA-STEREO); SD-MS 403 | — |
| L27 binaural only for headphone/immersive deliverables [6] | NOT RE-READ (DPA-BIN) | Card only; F10 builds binaural. |
| L30 DPA: ORTF wider than XY with reasonable mono; AB mono concern [3] | **CONFIRMED** | DPA-STEREO. |
| L32 do not approach or lure animals; follow local distances [7] | **CONFIRMED + numbers** | NPS-WILD 25 yd / 100 yd (US parks; local rules first) (F06-C3). |
| L34 "Several minutes" is a teaching start, not a standard | UNSOURCED (honest) | Keep. NPS's 25 days is a science protocol — say so only in the science card. |
| L36 foam light wind; fur, basket and suspension for more [8, 9] | **CONFIRMED** (CORNELL-ACC); RODE-WIND/RYC-WS1 not re-read | — |
| L37 NPS excludes high-wind intervals [2, 10] | **CONFIRMED + number** | > 5 m/s (11 mph) (F06-C4). |
| L39 no fixed dBFS/LUFS target; headroom for the loudest event [11] | PRACTICE (SD-7STEPS 403) | Keep (no number to show). |
| L42 open ambience mics near loudspeakers reduce gain before feedback [12] | **CONFIRMED** via S-AUTOMIX / S-LIVE (SD-LIVE 403) | — |
| L45 SM63: shelter from precipitation; windscreen is not waterproofing [13] | **CONFIRMED** | S-SM63. |
| L46 NWS: indoors when thunder is heard; 30 minutes after the last thunder [14] | **CONFIRMED** (NWS: "after the last lightning or thunder") | F06-C5 adds "lightning or". |
| L46 hearing protection under occupational guidance [15] | **CONFIRMED** | NIOSH-NOISE 85 dBA / 8 h, 3 dB. |

## c. Corrections (builder logs each)
- **F06-C1** Institutional wording: header; "Students choose" (L3); "Guided teaching exercise"; "Student field sheet";
  "the student explains" (L54).
- **F06-C2** XY: add 90° between capsules as the starting angle.
- **F06-C3** Wildlife: add NPS's 25 yd (≈ 23 m) / 100 yd (≈ 91 m) as US-park examples; "local rules come first".
- **F06-C4** High wind: add "above about 5 m/s (11 mph)" as the monitoring protocol's line — not a rule for creative
  takes (the lesson's L82 point).
- **F06-C5** NWS wording: "30 minutes after the last lightning or thunder"; add "rain shelters, small sheds and open
  vehicles are not safe".
- **F06-C6** Ref [15] `cdc.gov` → `www.cdc.gov` (record only); cross-links to Lab 7 / F11–F16 → drop until built.

## d. Disagreements
- **D-F06-AB**: AB spacing — DPA's curves (cardioids, 20 cm → ±70°) vs common omni spacings for ambience (not read
  today). No omni default sourced → drawing default 600 mm (inside Lab 5's DPA 400–600 mm orchestra range, which is a
  different use) — owner decision O-8.
