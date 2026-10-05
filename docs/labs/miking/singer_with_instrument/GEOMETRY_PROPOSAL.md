# E07 Singer With Guitar or Piano: GEOMETRY PROPOSAL

Composite scene = frame V (singer, `lead_vocal/`) + guitar frame G (`acoustic_guitar/GEOMETRY_PROPOSAL.md` §7) or
piano frames P/U (`acoustic_piano/`). The **seated-player posture** (head above guitar) is a drawing default; the
mouth-to-guitar offset is UNKNOWN (owner item) and drives every readout, so it is shown as an adjustable default.

| Zone / object | Geometry | Class |
|---|---|---|
| vocal mic | frame-V `zone.v.shure` r ∈ [101.6, 203.2] | SOURCED S-VOC-REC |
| guitar mic | frame G, r ∈ [152.4, 304.8] aimed at soundhole or 12th fret (bridge alternative) | SOURCED S-SM4-UG |
| null aiming | vocal mic's null toward the guitar, guitar mic's null toward the mouth: readout of each source's off-axis angle in the other mic | geometry |
| 3:1 | ratio d(vocal mic, guitar mic) / max(r_v, r_g); default scene shows it **below 3** on purpose with the rewrite text | §0.2 |
| one-mic | single mic between mouth and guitar; balance readout = 20·log10(r_guitar / r_mouth) dB (DERIVED, free-field) | DERIVED |
| piano pair | AKG: 2 mics 203.2–406.4 above strings, treble/bass, 152.4 behind the dampers; single/pair 1500–2000 high at middle strings | SOURCED AKG-C314 |
| singer at keyboard boom | boom clearance envelope around the pianist's head/hands | drawing default (keep-out) |
| keyboard amp | SPK speaker family (`speaker_leslie/`), placed in the vocal mic's null | reuse |
| wedge | cardioid: on the vocal mic's rear axis (§0.1) | SOURCED |
