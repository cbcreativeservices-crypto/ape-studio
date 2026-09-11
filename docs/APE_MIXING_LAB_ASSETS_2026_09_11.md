# Mixing labs — real-stem asset manifest (swap-in spec)

The Beginning Mixing Lab currently runs on an HONEST synthesized 8-track
session (`src/screens/lab/mixing/audio/mixAudio.ts` — deterministic, labeled
on-screen; the LEAD/BGV parts are synth stand-ins for vocals, never fake
vocals). When rights-cleared recorded stems exist, they replace the synthesis
as a pure asset swap. **Do not use copyrighted commercial recordings.**

## Required stems (one consistent performance, used through BOTH labs)

| File | Part | Notes |
|---|---|---|
| `mix_kick.wav` | Kick | Close mic or sample, mono |
| `mix_snare.wav` | Snare | Mono |
| `mix_perc.wav` | Percussion/overheads | Mono or stereo |
| `mix_bass.wav` | Bass | DI or amp, mono |
| `mix_gtr.wav` | Guitar | Comp/rhythm part, mono |
| `mix_keys.wav` | Keys/pad | Mono or stereo |
| `mix_lead.wav` | Lead vocal | The focal part |
| `mix_bgv.wav` | Backing vocal(s) | May be a bounced stack |

## Technical requirements

- **Length**: one loopable 20–30 s section (the synth session is 10 s; longer
  is better — verse-into-chorus feel supports the automation page, which
  treats the FIRST half as “verse” and the SECOND half as “chorus”).
- **Sync**: every file starts at the SAME sample (bar 1 beat 1) and has the
  SAME duration — the renderer sums index-aligned buffers.
- **Format**: WAV, 48 kHz (the DSP pipeline's `SR`), 16- or 24-bit, mono
  preferred (stereo files will be summed or need a small renderer extension).
- **Levels**: peaks ≤ −6 dBFS; the loader RMS-aligns to −20 dB and peak-caps,
  so raw balance need not be careful — headroom must be.
- **Cleanliness**: no clip distortion, no count-in, no bleed loud enough to
  defeat the mute exercises.

## Insertion point

`sessionStems()` in `src/screens/lab/mixing/audio/mixAudio.ts` is the single
seam: replace the eight `synth*()` calls with decoded WAV buffers (the ear
lab's WAV path shows the decode pattern), keep the RMS-align + peak-cap loop,
and update `SESSION_TRACKS[].source` strings in
`engine/mixModel.ts` (drop the “stand-in” labels — they are test-pinned, so
the honesty test will remind you). `LOOP_S`/`BARS`/`BPM` constants describe
the session; update them to the recording's truth. Everything else — pages,
renderer, tests — is unchanged by design.
