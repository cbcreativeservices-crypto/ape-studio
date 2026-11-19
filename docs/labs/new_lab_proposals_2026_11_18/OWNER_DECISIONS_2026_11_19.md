# Comp B new-lab proposals: owner decisions (2026-11-19, quick-pick)

Source: COMP_B_TO_CCODE_2026-11-18_NEW_LAB_PROPOSALS.html (this folder; owner's copy E:\).
37 proposals (24 new labs P01-P24, 13 extensions E01-E13), 27 HOLDs.

1. **HOLDs H01-H27: "Accept all defaults".** Every HOLD takes Comp B's suggested default (section 7).
   Before spending money, the owner OKs each cost (H24 buying paid standards; H26 studio sessions / licensed sample library).
   Exception, found by ccode: **H01's premise is wrong.** Every Audio Fundamentals lab (af_*, 15 labs, src/features/lab/labCompletion.ts)
   is ALREADY a universal requirement for every credential (src/data/labRequirements.ts header). Comp B saw only the variable map.
2. **Wave 0: "Add the 3 + wire Room Design"** (owner chose after ccode showed that ~15 of the 23 rows are already universal):
   - add tr_reverb -> cert-archaeoacoustics-and-heritage-v3;
   - add the Ear Training loudness drill (ear_<module>) -> cert-hearing-health-and-conservation-v3;
   - add tr_dj -> cert-electronic-live-performance-v3;
   - give Room Design & Monitoring (route RoomDesignLab) a training-lab key + completion, then require it for:
     room-acoustics-and-treatment, how-sound-behaves-in-a-room, home-studio-starter, consumer-and-home-audio, home-theater-design (all cert-*-v3)
     (Comp B listed it for 8 incl. these; re-check its section 5 table);
   - in-progress learners exempt (H20); credit never removed.
   Mechanics: edit src/data/labRequirements.ts, regenerate the seed with `node scripts/gen-lab-cert-seed.mjs`, ratchet test
   test/labCertRequirements_20261013.test.ts; server rows (labs + requirements) go to Comp A as a SQL brief ZIP; app part by OTA on the owner's word.
3. **First lab specs: "Comp B's top 5"**: P14 MIDI, Sampler & Beat; P12 Electronics Bench & Repair; P01 Networked Audio;
   P06 Loudness, Air Chain & Delivery; P09 Spectrogram & FFT Workbench. Specs only; BUILD waits for the owner's explicit GO (Opus HIGH, D56).
