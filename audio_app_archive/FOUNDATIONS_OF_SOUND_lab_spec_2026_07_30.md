# Foundations of Sound — Required Gateway Lab Set (spec + status)
_2026-07-30 · Machine A (DB) → for the frontend/ccode team that builds the labs_

## What Booth decided
- **Foundations of Sound** is a **required prerequisite** for all certificates, alongside the existing intended prerequisites (Professional Audio Safety, Workplace Skills, Electricity & Grounding).
- It is **one standalone prerequisite achievement** that lives in the **audio LAB area** — NOT in the glossary/study areas.
- It is **free to everyone**. **An account is required only to save progress.** No tracking of users without their consent — do not create a "free tier" entitlement or log un-consented users.
- Every graduate completes it — part of the total Academy learning experience.
- Lands in **active curriculum v1 (live)**.

## DB record created (Machine A)
- `achievements.id` = **7387db19-2fa5-4536-af25-25a5f725a484**
- name = `Foundations of Sound` · `is_prerequisite = true` · `curriculum_version_id = c689c0c4-1d93-4a92-9159-2af019745c49` (active v1) · `course_id = NULL` (standalone) · `global_sequence = 51`
- **`is_active = false` (STAGED).** It is intentionally NOT live yet, because activating a required gate before the 10 lab screens exist would block every student's certificate progress.
- No `glossary_topics` links → will not appear in the glossary/study UI.

### Go-live (run when the 10 labs ship and the lab-area wiring is done)
```
UPDATE achievements SET is_active = true WHERE id = '7387db19-2fa5-4536-af25-25a5f725a484';
```

## The 10 labs (final titles — build in this order)
1. **What Is Sound?** — mechanical waves; longitudinal waves; compression & rarefaction; mediums; speed of sound; air vs water vs solids; vacuum (why sound doesn't travel).
2. **Wave Fundamentals** — frequency; period; wavelength; amplitude; phase; polarity; crest; trough; zero crossing; wave cycles.
3. **Sound Propagation** — reflection; absorption; diffusion; refraction; diffraction; transmission; interference; resonance; standing waves.
4. **Harmonics & Timbre** — fundamental; harmonics; overtones; partials; timbre; envelope; ADSR; periodic vs aperiodic; pure tones; complex tones.
5. **Human Hearing** — audible range; loudness perception; equal loudness; pitch; localization; masking; dynamic range; temporal resolution.
6. **Measuring Sound** — decibel; SPL; peak; RMS; average; time weighting; frequency weighting; dynamic range; reference levels. (Gateway to the measurement tools.)
7. **The Frequency Spectrum** — bass; midrange; treble; octaves; fractional octaves; bandwidth; frequency regions; spectra; harmonic-series visualization.
8. **Time, Distance & Acoustics** — propagation delay; echo; reverberation; early reflections; arrival time; inverse-square law; distance vs level; time of flight.
9. **Analog & Digital Audio** — continuous vs sampled; sampling; bit depth; quantization; aliasing (conceptual); ADC; DAC; resolution. (Fundamentals only — no DAW material.)
10. **Signals, Noise & Distortion** — signal; noise; SNR; dynamic range; distortion; harmonic distortion; broadband noise; impulse noise.

## Deliberately EXCLUDED (these are applications, belong to later subjects)
Compression, EQ, reverb, delay, mixing, consoles, microphones, loudspeakers, DAWs, MIDI, music theory, studio recording, film audio, RF, networking, vocoder, flanging, chorus, tape machines, live sound, mastering, speaker crossover design.
Test for inclusion: *would a physicist, acoustician, speech scientist, audiologist, music producer, and loudspeaker engineer all agree it's foundational?*

## Frontend/behavior requirements
- Render Foundations in the **audio lab area** (not glossary). Gate certificate award on its completion **once `is_active` is flipped true**.
- Free to open for anyone; when a user without an account interacts, prompt: **"Create an account to save your progress."** Do not persist progress or identifiers for un-consented users.
- Progress saves to `student_achievement_progress` (user_id + achievement_id) for signed-in users — same mechanism as other achievements.

## Open item for Booth (analysis-only, no change made)
The DB prerequisite mechanism is a single boolean `achievements.is_prerequisite`, and **only "Professional Audio Safety" currently has it set.** "Workplace Skills" and "Electricity & Grounding" are NOT flagged (Workplace Skills and Grounding & Electrical exist only as glossary topics; there is no Electricity & Grounding *course*). Certificate gating on those appears to be enforced in the frontend, not the DB. Booth to decide later whether to reconcile all four prerequisites in the DB.
