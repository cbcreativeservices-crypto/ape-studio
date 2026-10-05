# C11 Acoustic Piano (grand, baby grand, upright): SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/Acoustic-Piano-Miking-Technique.txt` (L<line>).
Rules and shared keys (S-REC, S-LIVE, S-RHYTHM, DPA-STEREO, OSHA, PHYS-ET): `acoustic_guitar/SOURCES.md` §0.
Checked 2026-10-04 by Claude.

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| DPA-PIANO | DPA, "How to mic a piano" (lesson [1]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-piano/ | 200, read |
| S-PIANIST | Shure, "How to Choose the Best Mic for the Pianist", dated "September 04, 2021" (lesson [5]) | https://www.shure.com/en-IN/insights/how-to-choose-the-best-mic-for-the-pianist | 200 |
| SW-D / SW-B / SW-S | Steinway & Sons model pages, Model D, Model B, Model S | https://www.steinway.com/pianos/steinway/grand/model-d · …/model-b · …/model-s | 200 each |
| SW-K52 | Steinway & Sons upright page (Model K-52) | https://www.steinway.com/pianos/steinway/upright | 200 |
| MET-BECH | The Met, Carl Bechstein grand piano, ca. 1893, obj. 503448 (Collection API) | https://collectionapi.metmuseum.org/public/collection/v1/objects/503448 | 200 (API; the web page gives 429) |

## a. Placement (verifying the lesson)

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Range | "A0 27 Hz to the highest C8 at 4.2 kHz" | DPA-PIANO | 2026-10-04 | High | Physics: A0 = 27.5 Hz, C8 = 4186.0 Hz (PHYS-ET). L6 "27.5 Hz … near 4.19 kHz" is the exact value; keep it. |
| Level near hammers | "loud transients with more than 130 dB close to the hammers" | DPA-PIANO | 2026-10-04 | High | L40 says "very high levels" — **add the number** and a hearing line (no OSHA note in C11). |
| Outside A/B | "An AB placement with a pair of omnis just outside the piano on a microphone stand spaced 30 cm (12 in) apart is a particularly good starting position." | DPA-PIANO | 2026-10-04 | High | L30 CONFIRMED. Height/distance from the case: none ("outside the piano, relatively low") |
| Stage/pit | "Placements like A/B, X/Y or ORTF in the arch in the middle of the grand piano with directional microphones"; "Closing the piano lid or choosing a short stick is also useful for separation." | DPA-PIANO | 2026-10-04 | High | L19/L34 CONFIRMED |
| ORTF over strings | "ORTF stereo set-up using cardioids approximately 30 cm (12 in) over the strings at mid frame. The mics should be pointed at 45° downwards, towards the pianist." | DPA-PIANO | 2026-10-04 | High | L31 CONFIRMED but **omits the 45°**; add it |
| A/B omnis over strings | "A/B with a pair of omnis 30 cm (12 in) over the strings." | DPA-PIANO | 2026-10-04 | High | not in lesson |
| Hanging minis | "hung over the strings i.e., 30-40 cm (12-16 in)… slightly in front of the hammers, with approximately 30 cm (12") between the mics" | DPA-PIANO | 2026-10-04 | High | not in lesson |
| Magnets | wide cardioids "placed inside on the frame at either end of the piano on magnet mounts"; minis "on small magnetic mounts… in or near the sound holes… Place at the high hole and another towards the last (or second to last) octave of low strings" | DPA-PIANO | 2026-10-04 | High | L34 CONFIRMED; gives the frame-hole positions the survey asked for (in words) |
| Wide cardioids behind | "A/B with a pair of wide cardioids placed behind the piano on a music stand pointing away from the pianist" | DPA-PIANO | 2026-10-04 | High | |
| ORTF definition | "two first-order cardioid microphones spaced 17 cm (7 in) and angled ±110°" | DPA-STEREO | 2026-10-04 | High (text) | **D-PN1**: DPA's "±110°" is a slip; ORTF is 110° included (±55°), as Batch 1 used (170 mm / 110°). |
| ORTF in the curve | "placing the ORTF setup in the curve of the pianos with the lid on 'full stick' will usually produce a very direct sound and a good balance" | DPA-STEREO | 2026-10-04 | High | L30 CONFIRMED (ref [4]) |
| Shure grand rows (recording + live booklets, same table) | 1 "12 inches above middle strings, 8 inches horizontally from hammers with lid off or at full stick"; 2 "8 inches above treble strings, as above"; 3 "Aiming into sound holes"; 4 "6 inches over middle strings, 8 inches from hammers, with lid on short stick"; 5 "Next to the underside of raised lid, centered on lid"; 6 "Underneath the piano, aiming up at the soundboard"; 7 "Surface-mount microphone mounted on underside of lid over lower treble strings, horizontally, close to hammers for brighter sound, further from hammers for more mellow sound"; 8 "Two surface-mount microphones positioned on the closed lid, under the edge at its keyboard edge, approximately 2/3 of the distance from middle A to each end of the keyboard"; 9 "Surface-mount microphone placed vertically on the inside of the frame, or rim, of the piano, at or near the apex of the piano's curved wall" | S-REC p.11, S-LIVE p.23–24 | 2026-10-04 | High (text) / Medium (number-to-row mapping read from the PDF text order) | Row 3 is a second Shure source for the one-mic sound-hole option (L35 cites [3], which also has it: see S-RHYTHM row) |
| Shure mono warning | "Place one microphone over bass strings and one over treble strings for stereo. Phase cancellations may occur if the recording is heard in mono." | S-REC / S-LIVE | 2026-10-04 | High | L28 CONFIRMED (ref [2]) |
| Low mic offset | "Moving 'low' mic away from keyboard six inches provides truer reproduction of the bass strings while reducing damper noise. By splaying these two mics outward slightly, the overlap in the middle registers can be minimized." | S-REC / S-LIVE | 2026-10-04 | High | not in lesson; useful |
| Rhythm-section one-mic and clamps | "A single SM58 pointing into one of the soundboard holes will also do the trick if you have only one input and the piano is going through the monitors."; "You could also clamp the mics to the soundboard (using a piece of foam to protect the wood) with LP Claws or similar mic clamps." | S-RHYTHM | 2026-10-04 | High | L35 CONFIRMED (ref [3] is right). **D-PN3**: Shure suggests clamping to the soundboard; the lesson forbids weights on the soundboard and requires owner approval — keep the lesson's rule, note the difference |
| Rhythm-section grand | "Place one mic several inches over the bass strings and the other over the high strings, and angle them apart… The closer you get to the hammers, the more attack" | S-RHYTHM | 2026-10-04 | High | L31 CONFIRMED |
| Upright (S-RHYTHM) | "Open the top and place a split pair of microphones inside, aiming slightly toward the hammers… mic the piano from the back, taking time to find the sweet spot… take the front off by the player's feet and to mic the strings from that angle" | S-RHYTHM | 2026-10-04 | High | L37/L38 CONFIRMED |
| Upright rows (booklets) | "Just over open top, above treble strings"; "…above bass strings"; "Inside top near the bass and treble stings"; "8 inches from bass side of soundboard"; "8 inches from treble side of soundboard"; "Aiming at hammers from front, several inches away (remove front panel)"; "1 foot from center of soundboard on hard floor or one-foot-square plate on carpeted floor, aiming at piano (soundboard should face into room)" | S-REC p.12, S-LIVE p.25 | 2026-10-04 | High | 203.2 / 304.8 mm (conv.). "stings" is Shure's typo. |
| Live lid boundary | "a boundary microphone for piano can be mounted to the underside of the lid, which can then be partially or entirely closed" | S-PIANIST | 2026-10-04 | High | L34 CONFIRMED |

## b. Instrument dimensions

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Model D (concert grand) | Length 8' 11¾" (274 cm); Width 61¾" (156 cm); 483 kg | SW-D | 2026-10-04 | High | Steinway prints 8' 11¾"; 274 cm is their metric |
| Model B (grand **default**) | Length 6' 11" (211 cm); Width 58" (148 cm); 364 kg; longest string "Agraffe/bridge: 59¼" (151 cm)" | SW-B | 2026-10-04 | High | |
| Model S (baby grand) | Length 5' 1" (155 cm); Width 57¾" (147 cm); 263 kg; longest string 45½" (116 cm) | SW-S | 2026-10-04 | High | |
| Longest key (D) | 24½" (62.2 cm) | SW-D | 2026-10-04 | High | |
| K-52 upright | Height 52" (132 cm); Width 60" (152.5 cm); Depth 26 ¾" (68 cm); 295 kg | SW-K52 | 2026-10-04 | High | |
| Octave span | "3-octave span 49.2 cm" (Bechstein ca. 1893) → 164 mm per octave | MET-BECH | 2026-10-04 | Medium | TRIAL for a modern keyboard (historic instrument) |
| Bechstein case | "D. of case 35.5 cm w/o lid"; "H. 99.5 cm including lid" | MET-BECH | 2026-10-04 | Medium | TRIAL rim depth / height for the drawing |
| Lid angles (full / short stick), stick lengths, hinge side, frame-hole positions, string-plane height, hammer-line position, keyboard height | UNKNOWN | — | | | drawing defaults in the geometry file |

## c. Hearing

DPA's ">130 dB close to the hammers" + OSHA 85 dBA line (`acoustic_guitar/SOURCES.md` §c): add to C11.

## d. Disagreements

- **D-PN1** DPA-STEREO "angled ±110°" vs ORTF 110° included (Batch 1 standard). Draw 110° included.
- **D-PN3** S-RHYTHM soundboard clamps vs the lesson's no-attachment rule (keep the lesson).
- **D-PN2** DPA "A0 27 Hz" vs exact 27.5 Hz. Lesson already right.
