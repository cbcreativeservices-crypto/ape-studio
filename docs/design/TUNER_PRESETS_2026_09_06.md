# CenterLock Stage Tuner — instrument presets (2026-09-06)

Owner brief: the world & folk preset list (ChatGPT report, 2026-09-06) — "build all of it".
Source of truth in code: `src/features/tools/tuner/centerLock.ts` (`INSTRUMENT_DEFS`, `TUNINGS`,
`TRANSPOSITIONS`), tests in `test/centerLock.test.ts`.

## What shipped

**Picker.** The instrument chip opens a picker grouped by family (Guitar, Bass, Bowed, Folk, World,
Chromatic) with the three most recent instruments on top. The last instrument comes back on the next
open (AsyncStorage `ape:centerlock:v1`). Recents also sit in the chip row beside the instrument chip.

**Presets (25).** Sounding pitches, one entry per course, playing order low → high.

| Family | Preset | Open strings | Notes |
|---|---|---|---|
| Guitar | Guitar · 6-string | E2 A2 D3 G3 B3 E4 | Standard, Drop D, E♭, D, Drop C, DADGAD, Open G, Open D · capo |
| Guitar | Guitar · 7-string | B1 E2 A2 D3 G3 B3 E4 | Standard, Drop A, A Standard · capo |
| Guitar | Guitar · 12-string | E2 A2 D3 G3 B3 E4 | octave partners E3 A3 D4 G4 on the low four courses · Standard, E♭, D · capo |
| Bass | Bass · 4-string | E1 A1 D2 G2 | Standard, Drop D, E♭, D, BEAD · capo |
| Bass | Bass · 5-string | B0 E1 A1 D2 G2 | Standard, Drop A · capo |
| Bass | Bass · 6-string | B0 E1 A1 D2 G2 C3 | capo |
| Bass | Double bass | E1 A1 D2 G2 | orchestral / upright |
| Bowed | Violin | G3 D4 A4 E5 | perfect fifths from A (default) or equal |
| Bowed | Viola | C3 G3 D4 A4 | perfect fifths from A (default) or equal |
| Bowed | Cello | C2 G2 D3 A3 | perfect fifths from A through the octave (default) or equal |
| Bowed | Erhu | D4 A4 | inner / outer |
| Folk | Ukulele · high G | G4 C4 E4 A4 | re-entrant |
| Folk | Ukulele · low G | G3 C4 E4 A4 | linear |
| Folk | Ukulele · baritone | D3 G3 B3 E4 | |
| Folk | Mandolin | G3 D4 A4 E5 | four unison pairs · perfect fifths (default) or equal |
| Folk | Banjo · 5-string | D3 G3 B3 D4 + G4 drone | Open G, Double C |
| Folk | Appalachian dulcimer | D3 A3 D4 | DAD, DAA |
| Folk | Bouzouki · Irish | G2 D3 A3 D4 | octave partners G3 D4 on the low two · GDAD, GDAE |
| Folk | Balalaika · prima | E4 (×2) A4 | the two E strings are one key |
| Folk | Charango | G4 C5 E4/E5 A4 E5 | re-entrant, octave E course |
| World | Oud · Arabic | C2 F2 A2 D3 G3 C4 | unison pairs · Low C, Low D |
| World | Oud · Turkish | C#2 F#2 B2 E3 A3 D4 | unison pairs, a step above Arabic |
| World | Pipa | A2 D3 E3 A3 | |
| World | Bouzouki · Greek 3-course | D3 A3 D4 | trichordo, octave low D |
| World | Bouzouki · Greek 4-course | C3 F3 A3 D4 | tetrachordo, octave low C and F |
| Chromatic | Chromatic · winds & brass | any note | see below |

**Double courses.** An octave pair is two targets on one key (`E2·E3`). AUTO targets whichever string
of the pair is played; MANUAL locks the course, not one string. The hint line coaches
"Octave pair: tune one string at a time, mute its partner (E3)". Unison pairs are one target.

**Chromatic / winds & brass.** Nearest semitone with 60 ¢ hysteresis (the note does not flip at the
half-way point). Transposition chips relabel the note as WRITTEN pitch: C (concert), B♭ (+2), E♭ (+9),
F (+7); the identity line says what it SOUNDS. A sustained-tone hold readout replaces the string
strip: hold time, average cents, spread and a steadiness word after 600 ms / 6 samples.

## What was deliberately left out

- Sitar, sarod, saz/bağlama, shamisen, koto, guzheng — wait for a tonic (Sa) / key system. One
  absolute Western preset would mislead.
- Piano — stretched octaves and inharmonicity; a string tuner is the wrong tool.
- Custom per-string tunings and search/favourites — recents plus 25 presets cover launch; revisit
  after device feedback.
- 5-string double bass (low B0/C1) — the 5-string bass preset covers B0 tuning if needed.

## Verified

Web preview 2026-09-06 (portrait 375×812, landscape 812×375): picker, recents, 12-string course keys
and coaching, chromatic with B♭ transposition and the hold readout, strobe. tsc clean, 291 tests.
Owner device pass pending. No native build needed.
