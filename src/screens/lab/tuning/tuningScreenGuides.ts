/**
 * Tuning & Temperament Lab — "explain this screen" content (Screen Guide
 * rollout, 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * One guide per chapter (index 0–13 = chapters/index.ts CHAPTERS order) plus
 * the what's-left screen. Thirteen chapters are Rack Units (rackLayout.tsx);
 * Chapter 12 (Tradeoffs) is a reading page.
 *
 * Every name is the on-screen name in the chapter's own file (bezel keys,
 * dock labels, tray options, the drawings' labels) or the shared kit
 * (LabNavBar, LabEndScreen). Every number in TRY THIS is what the screen
 * prints at the lab's reference pitch (A4 = 440, C4 = 261.63 Hz — the REF
 * key in Chapter 11 changes it for the whole lab, so its step says to set it
 * back), worked from features/tuning/tuningMath.ts; the test re-derives them:
 *   Ch1  fifth snap 701.96 ¢; C3→C4 130.81 Hz, C4→C5 261.63 Hz
 *   Ch2  5/4 = 386.31 ¢; 3:2 solved at 701.96 ¢
 *   Ch3  27/8 = 3.3750 → ÷2 → 27/16 = 1.6875
 *   Ch4  Equal 400.00 ¢ · FROM 5/4 +13.69 ¢ · PARTIALS Δ +10.38 Hz;
 *        Pythagorean 407.82 ¢ · +21.51 ¢ · +16.35 Hz
 *   Ch5  D 9/8 at 203.91 ¢; B♯ at 23.46 ¢
 *   Ch6  ACTUAL B♯ 265.19 Hz, GAP 23.46 ¢, together 3.57 Hz apart
 *   Ch7  E 5/4 386.31 ¢ 327.03 Hz; tonic D: D→A 40/27 21.51 ¢ narrow,
 *        MOVED "2 + 2 new"
 *   Ch8  PYTH E 407.82 ¢, JUST E 386.31 ¢, 81/80 21.51 ¢
 *   Ch9  t 1.118034 / D 193.16 ¢; g 696.58 ¢, NARROWER 5.38 ¢; FIFTH 700 →
 *        g⁴/4 400.00 ¢ FROM 5/4 +13.69 ¢; WOLF 737.64 ¢ WIDER BY 41.06 ¢
 *   Ch10 step 1: 1.059463, 277.18 Hz (+15.56 Hz); last step +29.37 Hz
 *   Ch11 Just E VS EQUAL −13.69 ¢, Pyth. +7.82 ¢; A4 = 442 → C 262.81 Hz
 *   Ch13 9/4 ÷2 → 9/8 1.1250; 4 × RATIO 5.0000; E at 386.31/400.00/407.82 ¢
 * Change a chapter's labels, ranges or defaults → update its guide here;
 * test/screenGuide_tuning_20261031.test.ts pins the names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; KNOWLEDGE, never skills; no gear brand names;
 * no "N of total"; "suggest" never "recommend"; no build notes.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** One guide per chapter, in CHAPTERS order (index 0–13). */
export const TUNING_SCREEN_GUIDES: readonly ScreenGuide[] = [
  // ── 0 · Welcome and Listening Setup ───────────────────────────────────────
  {
    intro: {
      learning: 'Every tuning system keeps the octave at exactly 2:1, then has to decide where the notes inside it go. That choice is what this lab is about.',
      start: 'Turn your volume down, then press HEAR IT: the root C sounds, then its octave. Read ROOT and OCTAVE, and tap SCOPE ⓘ before BEGIN LAB ›.',
    },
    seeing: [
      'The pitch rail runs from the root C (1:1) on the left to its octave (2:1) on the right. The eleven faint marks between are the notes still to be placed; after HEAR IT they turn to question marks.',
      'ROOT reads 261.63 Hz and OCTAVE 523.25 Hz. SOUND says ♪ PLAYING or STOPPED.',
      'Below: IN THIS CHAPTER, a volume note, SCOPE ⓘ and BEGIN LAB ›.',
    ],
    control: [
      'Press HEAR IT to hear the root, then its octave; the rail lights each one as it sounds. ■ STOP silences it.',
      'Tap SCOPE ⓘ to see what this lab covers: several influential Western tuning approaches, not every musical culture.',
      'BEGIN LAB › marks this chapter done.',
      'Switch BASIC / MATH (top right) to MATH to see the working-out under the display, in the chapters that have it.',
      'Use ‹ PREV and NEXT › in the strip to move between chapters, or tap its middle for the chapter list. Tap ⓘ on any chapter to have its screen explained.',
    ],
    changes: [
      'Every system in this lab keeps the octave at exactly ×2: 261.63 × 2 ≈ 523.25 Hz. The hertz are rounded to two decimals, so the last digit can look one off.',
      'Where the notes in between go is a choice. Each tuning system answers it differently, keeping some relationships pure and bending others.',
      'Acoustic pianos may stretch the octave slightly wider than 2:1; the Tradeoffs chapter returns to this.',
    ],
    teaches: [
      'Every tuning system answers one question: with the octave fixed at 2:1, where do the notes inside it go?',
      'There is more than one good answer. Pure fifths, Just intonation, meantone and equal temperament each place the notes differently.',
      'The tones here are exact, so any difference you hear comes from the tuning. The Autotune lab’s grid, 100 cents to a semitone, is equal temperament: one answer among several.',
    ],
    tryThis: [
      'Keep the volume low and press HEAR IT: the root lights, then the octave — the same note name at twice the frequency.',
      'Tap SCOPE ⓘ and read what this lab does — and does not — cover before you begin.',
    ],
  },

  // ── 1 · Intervals Are Frequency Relationships ─────────────────────────────
  {
    intro: {
      learning: 'An interval is a frequency ratio, not a fixed number of hertz. Cents measure that ratio: 1200 to every octave, 100 to an equal semitone.',
      start: 'Ride UPPER until INTERVAL reads fifth, then PLAY TOGETHER. Next tap SHOW ME and play C3–C4, then C4–C5: the hertz gap doubles, but the ratio stays 2:1.',
    },
    seeing: [
      'The rail runs from unison (1:1) to the octave (2:1). The marker is your upper note; the root marker lights while a clip with the root plays.',
      'RATIO and CENTS measure the gap; INTERVAL names it (unison, minor 3rd, major 3rd, fourth, fifth, octave — or between). SOUND shows what’s playing.',
      'The ROOT and UPPER NOTE cards give each note in hertz. At the octave you’ll see TWO OCTAVES, TWO REGISTERS.',
    ],
    control: [
      'Ride the UPPER fader or drag the marker, 0 to 1200 ¢. It snaps gently onto the named ratios.',
      'Use the PLAY tray to hear ROOT, UPPER NOTE or TOGETHER. Once you reach the octave, C3–C4 and C4–C5 join them.',
      'SHOW ME slides the marker to the octave. ■ STOP silences.',
    ],
    changes: [
      'RATIO, CENTS and INTERVAL all come from one value: cents = 1200 × log₂(ratio).',
      'Cents turn equal ratios into equal distances, so every octave is 1200 ¢, whatever the hertz.',
      'C3→C4 is 130.81 Hz apart and C4→C5 261.63 Hz — both still 2:1.',
    ],
    teaches: [
      'An interval is a frequency ratio, not a fixed gap in hertz.',
      'Cents: 1200 to an octave, 100 to an equal semitone.',
      'The same interval spans more hertz the higher you go. That’s why musicians and tuners measure intervals in cents, not hertz.',
    ],
    tryThis: [
      'Ride UPPER until INTERVAL reads fifth: RATIO 3/2, CENTS 701.96 ¢.',
      'Tap SHOW ME, then PLAY C3–C4 and C4–C5: the hertz gap doubles (130.81 → 261.63) but both are 2:1, 1200 ¢.',
      'Switch to MATH and ride UPPER: the line c = 1200 · log₂(r) updates as you move.',
    ],
  },

  // ── 2 · Ratio Landmarks ───────────────────────────────────────────────────
  {
    intro: {
      learning: 'The five simplest ratios — 6/5, 5/4, 4/3, 3/2 and 2/1 — by ear, by number and by place. Every tuning system is built from them or measured against them.',
      start: 'Ride RATIO through all five landmarks and PLAY each one. Then ride MARKER, or drag the blue marker, until it lands on 3:2 and turns green.',
    },
    seeing: [
      'One rail holds the root, the landmark you chose, and a blue marker for the mini challenge: place a 3:2.',
      'RATIO and CENTS describe the landmark. MARKER shows where your blue marker sits and turns green when you’ve solved it. SOUND shows what’s playing.',
      'Below: five ratio tiles, the landmark’s card and WHOLE-NUMBER RELATIONSHIP bars.',
    ],
    control: [
      'Ride RATIO through 6/5, 5/4, 4/3, 3/2 and 2: each one lands on the rail. Tap RATIO for the list.',
      'Ride the MARKER fader, or drag the blue marker, to place a 3:2 on the rail. It snaps gently near a landmark.',
      'PLAY sounds the chosen ratio; once you’ve solved the challenge, 3:2 · YOUR ANSWER joins it. SHOW ME slides the marker to 3:2. ■ STOP silences.',
    ],
    changes: [
      'Each landmark is a small whole-number ratio: while the lower note makes 2 cycles, a 3:2 upper note makes 3.',
      'Small ratios line up many harmonics. How strongly you hear that depends on the timbre, the register and the musical context.',
      'A ratio multiplies the root: 261.63 × 3/2 = 392.44 Hz.',
    ],
    teaches: [
      'The five landmarks by ear, number and place: 6/5 just minor third, 5/4 just major third, 4/3 pure fourth, 3/2 pure fifth, 2/1 octave.',
      'These five are the yardsticks: every tuning system is built from them or measured against them.',
    ],
    tryThis: [
      'Ride RATIO to 5/4: CENTS reads 386.31 ¢. PLAY it — the just major third.',
      'Ride MARKER to about 702 ¢: it snaps, MARKER turns green at 701.96 ¢ and the PLAY tray adds 3:2 · YOUR ANSWER.',
    ],
  },

  // ── 3 · Folding Notes Into One Octave ─────────────────────────────────────
  {
    intro: {
      learning: 'Any ratio folds into one octave when you multiply or divide it by 2. Folding changes which octave a note sits in, never which note it is.',
      start: 'Set VIEW to Demo A · reduce 9/4. Tap SHOW OP, then MOVE ÷2, and watch REGION change from ABOVE to INSIDE. Then switch VIEW to Your turn.',
    },
    seeing: [
      'The Octave Elevator has three floors: ABOVE, the COMPARISON OCTAVE (1 ≤ ratio < 2) and BELOW. A ratio tile rides it; SHOW OP marks the next move beside it.',
      'RATIO and VALUE give the tile as a fraction and a decimal. REGION says which floor it’s on (BELOW, INSIDE, ABOVE) and NEXT OP names the move to make. Your moves are listed just below the display.',
    ],
    control: [
      'Pick a VIEW: Demo A · reduce 9/4, Demo B · raise 3/4, or Your turn.',
      'In a demo, SHOW OP shows the move, MOVE ÷2 (or MOVE ×2) makes it, and REPLAY starts again.',
      'In Your turn, press ×2 or ÷2 one move at a time. SHOW ME makes one move for you; RESET restarts the ratio. Once it’s folded, NEXT in LAB NOTES brings the next one: 9/4, 27/8, then 3/4.',
    ],
    changes: [
      '÷2 drops a ratio one octave, ×2 lifts it one. The note’s name (its pitch class) never changes.',
      'Keep going until 1 ≤ ratio < 2: the comparison octave, where every scale in this lab is compared. A ratio of 2 or more sits ABOVE; one below 1 sits BELOW.',
    ],
    teaches: [
      'Octave normalization: any ratio folds into one octave with ×2 and ÷2.',
      'Folding moves octaves only, never the note.',
      'Notes built by stacking intervals, such as fifths, climb out of the octave. Folding brings them back so they can be compared on one rail.',
    ],
    tryThis: [
      'Demo A: SHOW OP, then MOVE ÷2 — 9/4 (VALUE 2.2500, ABOVE) becomes 9/8 (1.1250, INSIDE).',
      'Your turn starts on 9/4. Fold it, then press NEXT: 27/8 › in LAB NOTES. 27/8 arrives (VALUE 3.3750); one ÷2 gives 27/16, VALUE 1.6875, REGION INSIDE.',
      'On 3/4, press ÷2 once to feel the wrong way: 3/8 drops further BELOW. RESET, then ×2.',
    ],
  },

  // ── 4 · Harmonic Alignment and Beating ────────────────────────────────────
  {
    intro: {
      learning: 'Why a pure 5/4 third makes two upper harmonics land on the same frequency, while a wider third makes them beat: a swell and fade you can hear.',
      start: 'Tap THIRD and pick Equal-tempered, then Pythagorean, and read PARTIALS Δ each time. Then set LISTEN to Isolated partials and ▶ PLAY to hear the beat.',
    },
    seeing: [
      'Two harmonic ladders on a LOG-FREQUENCY AXIS: the root C and a major third E. Each rung is a partial, a tone at a whole-number multiple of the note’s frequency. Watch the root’s 5th harmonic and the third’s 4th.',
      'The alignment meter under them shows the third’s cents from 5/4. THIRD, FROM 5/4, PARTIALS Δ (the gap between that pair) and SOUND read it out.',
    ],
    control: [
      'Tap THIRD for Just 5/4, Equal-tempered 2^(1/3) or Pythagorean 81/64. Or ride the lane to set the third yourself, 380–410 ¢ in 0.1 ¢ steps, with a gentle snap onto 5/4.',
      'Set LISTEN to Full tones or Isolated partials (the other rungs fade). ▶ PLAY sounds your pick.',
      'SHOW ME lands the third on 5/4. ■ STOP silences. LAB NOTES hold the BEATING MODEL, which has its own full screen.',
    ],
    changes: [
      'At 5/4 the two partials meet: 4 × 5/4 = 5. PARTIALS Δ reads 0 Hz — no beating.',
      'Move the third and the partials pull apart. Their difference in hertz is the beat rate: the sound swells and fades that many times a second.',
      'The same cents gap is more hertz higher up, so higher pairs of partials beat faster.',
    ],
    teaches: [
      'One tuning ratio makes upper harmonics coincide; another makes them beat, at a rate equal to their difference in hertz.',
      'Whether you hear beating depends on those partials being present and strong: timbre, register, room and playback all matter.',
      'The pure third, 5/4, is the smooth one. The equal-tempered third sits 13.69 ¢ wide of it, so its partials beat.',
    ],
    tryThis: [
      'Tap THIRD and pick Equal-tempered: THIRD 400.00 ¢, FROM 5/4 +13.69 ¢, PARTIALS Δ +10.38 Hz.',
      'Pick Pythagorean: 407.82 ¢, FROM 5/4 +21.51 ¢, PARTIALS Δ +16.35 Hz — a faster beat. Set LISTEN to Isolated partials and ▶ PLAY.',
      'Ride THIRD until FROM 5/4 reads 0 ¢ and the readouts turn green: the two partials are the same frequency.',
    ],
  },

  // ── 5 · Build With Pure Fifths ────────────────────────────────────────────
  {
    intro: {
      learning: 'How one rule — go up a pure fifth (×3/2), then fold into the octave — builds all twelve notes, and why the twelfth fifth misses C.',
      start: 'Press ADD FIFTH a few times and watch where each new note lands on the rail. Then ride FIFTHS to the top and read NEWEST: B♯, in red.',
    },
    seeing: [
      'The cents rail fills with notes made from fifths. Each label carries the step it was built on (3·A is step 3); the newest is highlighted, and B♯, the last, is red.',
      'STEP, NEWEST (the newest note’s name), CENTS and SOUND describe the latest step. Just under the display, the fifth path shows the whole chain.',
    ],
    control: [
      'Press ADD FIFTH to build the next note: ×3/2, every ÷2 it needs, then where it lands.',
      'Ride the FIFTHS fader back to undo or replay, or forward to fill the rest at once. The lane shows the exact fraction.',
      'Turn on BY PITCH to drop the step numbers and re-sort the path from low to high.',
      '▶ C+(newest) plays C with the newest note. ■ STOP silences.',
    ],
    changes: [
      'One rule, applied again and again: × 3/2, then fold into the octave.',
      'The order you build the notes in is not pitch order: each new note lands somewhere else on the rail.',
      'The twelfth fifth makes B♯ — just above C, not on it.',
    ],
    teaches: [
      'How twelve pitch classes come from one rule, the pure fifth.',
      'Why the circle of pure fifths does not quite close.',
      'The miss is small, 23.46 ¢, but real: twelve pure fifths overshoot seven octaves, so B♯ and C are not the same pitch.',
    ],
    tryThis: [
      'Press ADD FIFTH twice: 3/2 × 3/2 = 9/4, one ÷2, and D lands at 203.91 ¢.',
      'Ride FIFTHS to the top: NEWEST reads B♯ at 23.46 ¢, in red — near C, not on it.',
      'Turn BY PITCH on: the step numbers leave the rail and the path below runs low to high.',
    ],
  },

  // ── 6 · The Circle Does Not Close ─────────────────────────────────────────
  {
    intro: {
      learning: 'The Pythagorean comma: twelve pure fifths overshoot seven octaves by about 23.46 cents, so no tuning can keep every fifth pure and still close the circle.',
      start: 'Read EXPECTED C, ACTUAL B♯ and GAP. Then play A → B in the HEAR tray, and finally TOGETHER to hear the two notes beat.',
    },
    seeing: [
      'The fifth spiral winds twelve fifths out from C and ends at B♯, outside C’s spot. Its center reads the gap: EXPECTED C · ACTUAL B♯ and PYTHAGOREAN COMMA. The spiral isn’t to scale; the gap is exact.',
      'EXPECTED C, ACTUAL B♯, GAP and SOUND give the same comparison in numbers.',
    ],
    control: [
      'Use the HEAR tray: A · EXPECTED C, B · ACTUAL B♯, A → B or TOGETHER. The note sounding is circled on the spiral.',
      '■ STOP silences. LAB NOTES hold the two paths, the derivation and a question to think about.',
    ],
    changes: [
      'Twelve pure fifths should land where seven octaves do: (3/2)¹² against 2⁷.',
      'They miss: 531441/524288, about 23.46 cents. Those are exact whole numbers, so the gap is real, not a rounding error.',
      'Two notes 3.57 Hz apart beat about 3.6 times a second.',
    ],
    teaches: [
      'The Pythagorean comma: the exact mismatch between twelve pure fifths and seven octaves.',
      'No tuning can keep every fifth pure AND close the circle — each system decides where the gap goes.',
      'Two nearly equal pitches played together beat at the difference between their frequencies.',
    ],
    tryThis: [
      'Check the readouts: EXPECTED C 261.63 Hz, ACTUAL B♯ 265.19 Hz, GAP 23.46 ¢.',
      'Play A → B: the second note is a shade higher. Then TOGETHER: 3.57 Hz apart, the pair beats about 3.6 times a second.',
    ],
  },

  // ── 7 · Build Harmony With Just Intonation ────────────────────────────────
  {
    intro: {
      learning: 'Just intonation tunes one key with small whole-number ratios, so its chords are pure, and that same set of pitches falls out of tune in another key.',
      start: 'Ride NOTES to reveal the C-major scale a note at a time, and play CHORD 4:5:6. With all eight notes out, set TONIC to D and read IMPURE.',
    },
    seeing: [
      'The cents rail shows one common Just C-major mapping, revealed a note at a time. In RETUNE, a lower lane shows the scale rebuilt in the new key.',
      'First NOTE, CENTS, Hz and SOUND describe the newest note. Later the readouts become TONIC, MODE (KEEP or RETUNE), IMPURE or MOVED, and SOUND.',
    ],
    control: [
      'Ride the NOTES fader to reveal the mapping one note at a time.',
      'The PLAY tray is LOCKED until a second note is out. Then it plays C with the newest note. From G it adds C, E 5/4, G 3/2, CHORD 4:5:6 and ALIGNED PARTIALS, then each pure third you reveal.',
      'TONIC (C, F, G, D) and RETUNE stay LOCKED until all eight notes are out. RETUNE rebuilds the set around the tonic. ■ STOP silences.',
    ],
    changes: [
      'Small ratios give pure chords: C, E, G = 4 : 5 : 6.',
      'KEEP leaves the C-major pitches where they are and tests four intervals the new key needs. IMPURE counts the ones that miss.',
      'RETUNE rebuilds the set: the lower lane shows which notes move and which are new.',
    ],
    teaches: [
      'Just intonation: pure triads from small whole-number ratios, for one chosen key.',
      'Why one fixed set of pitches cannot keep every ratio pure in every key — a singer can retune, a fixed instrument cannot.',
      'In Just C major, D to A is 40/27: 21.51 ¢ narrower than a pure fifth, so a D-major chord on those pitches sounds out of tune.',
    ],
    tryThis: [
      'Ride NOTES to E: NOTE E 5/4, CENTS 386.31 ¢, Hz 327.03 Hz.',
      'With all eight out, set TONIC to D (KEEP): in LAB NOTES, D → A reads 40/27 (−21.51 ¢), and D major needs F♯ and C♯.',
      'Turn RETUNE on: MOVED reads 2 + 2 new — E and A move, F♯ and C♯ are new pitches.',
    ],
  },

  // ── 8 · Spot the Difference: Pythagorean Versus Just ──────────────────────
  {
    intro: {
      learning: 'The syntonic comma, 81/80: two scales can share every note name yet differ in pitch, because stacked fifths put E, A and B higher than pure thirds do.',
      start: 'Press RATIOS to reveal both scales. Ride NOTE through E, A and B and read the bracket. Then pick the C–E–G triad as EXAMPLE and play A → B.',
    },
    seeing: [
      'A two-lane rail. At first you see only note names: both scales read C D E F G A B in the readouts.',
      'After RATIOS, the Pythagorean notes sit on the top lane and the Just E, A and B below, with a bracket measuring the split. PYTH, JUST, 81/80 and SOUND read it out.',
    ],
    control: [
      'Press RATIOS to reveal the ratios and the split.',
      'Then ride NOTE through E, A and B (the bracket follows), or tap a marker on the rail.',
      'Pick an EXAMPLE: C–E major third, C–E–G triad, F–A major third, G–B major third or C-major phrase. Its notes stay lit.',
      'Use the A / B tray: A · PYTHAGOREAN, B · JUST, A → B. ■ STOP silences.',
    ],
    changes: [
      'C, D, F and G match: both scales build them from 2 and 3 alone.',
      'E, A and B differ by 81/80, about 21.51 ¢: stacked fifths put them higher than pure thirds do.',
      'Same note names, same root, same instrument tone — only the ratios change, and with them the pitch of E, A and B.',
    ],
    teaches: [
      'The syntonic comma, 81/80: the gap between a Pythagorean and a Just third.',
      'Two scales can share every note name yet differ in pitch.',
      'A Pythagorean major third is 21.51 ¢ wider than a pure 5/4, so its partials beat where the Just third sounds smooth.',
    ],
    tryThis: [
      'Press RATIOS: PYTH E reads 407.82 ¢, JUST E 386.31 ¢, 81/80 21.51 ¢.',
      'Ride NOTE to A, then B: the bracket follows and reads 21.51 ¢ each time.',
      'Pick the C–E–G triad as EXAMPLE and play A → B: hear the Just chord settle.',
    ],
  },

  // ── 9 · Build Quarter-Comma Meantone ──────────────────────────────────────
  {
    intro: {
      learning: 'Quarter-comma meantone narrows every fifth by about 5.38 ¢ so its major thirds come out pure; the leftover gathers in one badly mistuned fifth, the wolf.',
      start: 'Ride PART from A to E. In Part C, double-tap the FIFTH lane for 700 ¢, then tap SHOW ME and watch FROM 5/4 reach 0 ¢. In Part E, play the wolf.',
    },
    seeing: [
      'You build meantone in five short parts; the display follows PART: the C·D·E rail (A), four fifths on the rail (B), harmonic ladders with a meter (C), the scale (D), the twelve-note chain with the wolf’s two ends in red (E).',
      'The readouts change with the part: FIFTH, g⁴/4 and FROM 5/4 in C (g is the meantone fifth); WOLF, NORMAL and WIDER BY in E.',
    ],
    control: [
      'Ride PART from A to E, or tap it for the list.',
      'In B, PLAY the pure fifth 3/2 or the meantone fifth ⁴√5.',
      'In C, ride the FIFTH fader, 690–705 ¢. It snaps gently near ⁴√5; double-tap the lane for 700 ¢. SHOW ME lands it; ▶ C–E–G plays the triad.',
      'In D, NOTES reveals the scale and ▶ SCALE plays it. In E, PLAY a normal fifth or the wolf. ■ STOP works in every part.',
    ],
    changes: [
      'Narrow every fifth a little, stack four of them, drop two octaves, and you land on a pure 5/4 third.',
      'The fifth that does it is ⁴√5, about 5.38 ¢ narrower than pure.',
      'The circle still has to close, so the leftover gathers in one closing fifth: the wolf, 41.06 ¢ wider than the others.',
    ],
    teaches: [
      'Quarter-comma meantone: pure major thirds bought with narrowed fifths.',
      'A tuning error can be moved, never removed — here into the wolf.',
      'Chords that avoid the wolf sound sweet, with pure thirds; any chord that uses the wolf fifth sounds harsh.',
    ],
    tryThis: [
      'Part A: the readouts give t = 1.118034 (the step from C to D) and D at 193.16 ¢ — halfway to E 5/4 by ratio, not by hertz.',
      'Part C at 700 ¢: g⁴/4 reads 400.00 ¢, FROM 5/4 +13.69 ¢. Tap SHOW ME: FIFTH 696.58 ¢ and FROM 5/4 reads 0 ¢.',
      'Part E: WOLF 737.64 ¢, NORMAL 696.58 ¢, WIDER BY 41.06 ¢. Play the normal fifth, then the wolf.',
    ],
  },

  // ── 10 · Divide the Octave Equally ────────────────────────────────────────
  {
    intro: {
      learning: 'Equal temperament divides the octave into twelve equal ratios, not twelve equal steps in hertz, so the same pattern fits every key.',
      start: 'Press ADD ×r once and read RATIO and Hz. Then ride STEPS all the way right and compare the hertz added by the first and last steps in LAB NOTES.',
    },
    seeing: [
      'The chromatic rail is spaced in cents: twelve positions from C to the octave, filling as you build each step.',
      'STEP, RATIO, Hz and SOUND describe the newest step. While A / B plays, its notes light on the rail.',
    ],
    control: [
      'Press ADD ×r to build the next equal step. OCTAVE ✓ appears when all twelve are built.',
      'Ride the STEPS fader back to start over, or forward to build them all.',
      'Use the A / B tray: A · PATTERN IN C, B · STARTING ON F, A → B. ■ STOP silences.',
    ],
    changes: [
      'Every step multiplies by the same r = 2^(1/12) ≈ 1.059463 — exactly 100 cents.',
      'The hertz added grows as you climb: the same ratio applied to a bigger number.',
      'Moved to F, the pattern keeps its shape, because every step is the same ratio in every key.',
    ],
    teaches: [
      'Equal temperament: twelve equal ratios, not twelve equal hertz.',
      'Its fifth is about 1.96 ¢ narrow and its major third about 13.69 ¢ wide.',
      'Because every step is equal, no key sounds better or worse than another. The comma is spread evenly, and only the octave stays pure.',
    ],
    tryThis: [
      'Press ADD ×r once: RATIO 1.059463, Hz 277.18 Hz; the LAB NOTES card reads +15.56 Hz for this step.',
      'Ride STEPS all the way right: LAB NOTES reads +29.37 Hz for the last step, B to C — same ratio, nearly twice the hertz.',
      'Play A · PATTERN IN C, then B · STARTING ON F: the lit notes move up five steps with the same spacing. A → B plays both in turn.',
    ],
  },

  // ── 11 · Compare Tuning Systems ───────────────────────────────────────────
  {
    intro: {
      learning: 'How Pythagorean, Just, meantone and equal temperament place the same notes, measured in cents from equal temperament, and why no system has the one true E.',
      start: 'Tap the bar for E, then ride SYSTEM through all four and watch VS EQUAL. Then open A / B and play HEAR THE SAME NOTE MOVE.',
    },
    seeing: [
      'The deviation chart: each bar shows how far a note sits from equal temperament (0 ¢ = EQUAL TEMPERAMENT, + HIGHER, − LOWER). Green is exact, gold within 10 ¢, orange beyond.',
      'NOTE (with its ratio), Hz, VS EQUAL and SOUND describe the note you pick. Below the display, a fixed keyboard: C FIXED AT the root.',
    ],
    control: [
      'Flip SYSTEM through Pythagorean, Just, meantone and Equal: every bar moves.',
      'Pick a NOTE, or tap a bar or a key, to inspect one degree of the scale.',
      'REF sets A4 = 440, 442 or 432: the reference pitch for the whole lab.',
      'In A / B, pick an EXAMPLE and SYSTEM B, then ▶ A, ▶ B or A → B. HEAR THE SAME NOTE MOVE plays E over a fixed C in three systems. ■ STOP silences.',
    ],
    changes: [
      'Same C, same keys, same instrument tone: only the ratio given to each note changes.',
      'REF moves every hertz together, but the ratios and the VS EQUAL bars stay put: VS EQUAL is in cents, which measure ratios.',
    ],
    teaches: [
      'How four systems place the same notes, side by side.',
      'No system has the one true E — each is a choice about what to keep pure.',
      'The reference pitch is a convention: changing A4 shifts every note in hertz but leaves every interval the same.',
    ],
    tryThis: [
      'With E selected, ride SYSTEM from Just to Pythagorean: VS EQUAL goes from −13.69 ¢ to +7.82 ¢.',
      'Set REF to A4 = 442: the keyboard reads C FIXED AT 262.81 Hz, but VS EQUAL does not move. Set A4 = 440 again — REF applies to the whole lab.',
      'Open A / B and play HEAR THE SAME NOTE MOVE: three E’s over the same fixed C.',
    ],
  },

  // ── 12 · Tradeoffs, Musical Use, and Misconceptions (reading page) ────────
  {
    intro: {
      learning: 'Every tuning system keeps some intervals pure and gives others up: choices, not winners. Several common beliefs about tuning turn out to be wrong.',
      start: 'Read the four system cards first. Then, before you open each claim under MISCONCEPTIONS, decide if it’s true. Open at least three to light UNDERSTOOD ›.',
    },
    seeing: [
      'This chapter is a reading page, with no display. Four cards, one per system, each with its rule and four points.',
      'Then MISCONCEPTIONS: nine claims to judge, WHERE THIS MEETS PROFESSIONAL AUDIO, and UNDERSTOOD ›. The footer shows the sound line and ■ STOP.',
    ],
    control: [
      'Scroll down the page. Tap a claim to read its correction, and tap again to close it. Claims you’ve opened read “seen · tap to reread ▸”.',
      'UNDERSTOOD › lights once you’ve opened three, and marks the chapter done.',
    ],
    changes: [
      'Opening a claim shows its correction and counts toward the three you need.',
      'Nothing plays here: the page gathers what the earlier chapters let you hear and measure.',
    ],
    teaches: [
      'What each system keeps pure and what it gives up — choices, not winners.',
      'Several common beliefs about tuning don’t hold up once you know the ratios and conventions behind them.',
      'Where tuning meets audio work: pitch correction targets, synth tuning tables, choirs and strings, historical keyboards and piano octave stretch.',
    ],
    tryThis: [
      'Before opening “A4 = 440 Hz is a law of nature.”, decide: true or false? Then tap it.',
      'Read the TWELVE-TONE EQUAL TEMPERAMENT card: fifths −1.96 ¢, major thirds +13.69 ¢ — the numbers from Harmonic Alignment and Divide the Octave.',
    ],
  },

  // ── 13 · Apply What You Learned ───────────────────────────────────────────
  {
    intro: {
      learning: 'Review the lab’s six ideas by using them: fold a ratio, name each system’s rule, spot the comma, align a third, derive 2^(1/12) and hear a note move.',
      start: 'Set FIGURE to 1 · Normalize 9/4 and fold it with ÷2. Then switch FIGURE to 4 · Align the third and ride THIRD onto 5/4.',
    },
    seeing: [
      'Six challenges; three of them use the display. FIGURE picks which: the Octave Elevator (1), the harmonic ladders with a meter (4) or the rail of three E’s over a fixed C (6).',
      'Watch the readouts for each figure (for example RATIO, VALUE, REGION); DONE shows on FOLD (1) and THIRD (4), and E MOVES (6) shows the three E’s and SOUND. Below, do challenge 2 (match the rule) and answer the questions for 3, 5 and 6.',
    ],
    control: [
      'FIGURE: 1 · Normalize 9/4, 4 · Align the third, 6 · Hear E move.',
      'FOLD gives you ×2, ÷2 and RESET. THIRD gives you the THIRD fader (370–430 ¢, snapping onto 5/4; double-tap for 400 ¢) and SHOW ME. E MOVES gives you the PLAY tray.',
      'Below the display, tap a system for each rule (challenge 2) and answer the questions (3, 5, 6). ■ STOP silences.',
      'This is the lab’s last chapter; the Drum Tuning Lab comes next in Pitch & Tuning.',
    ],
    changes: [
      'Each challenge gets a check mark once you get it right. A wrong try costs nothing: just try again. All six checked completes the chapter.',
      'Then WHAT YOU KEEP lists the six ideas, and RETRY THE CHALLENGES runs them again.',
    ],
    teaches: [
      'The lab’s ideas used on purpose: folding a ratio, each system’s rule, the comma, aligning a third, the equal step and a note that moves between systems.',
    ],
    tryThis: [
      'FOLD: press ÷2 once — 9/4 becomes 9/8, VALUE 1.1250, REGION INSIDE.',
      'THIRD: tap SHOW ME — THIRD 386.31 ¢ and 4 × RATIO reads 5.0000.',
      'E MOVES: PLAY each E — JUST E 386.31 ¢, EQUAL E 400.00 ¢, PYTHAGOREAN E 407.82 ¢, over the same C.',
    ],
  },
];

/** The what's-left screen (FINISH › on the last chapter). */
export const TUNING_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How the lab’s ideas fit together: intervals are ratios, pure fifths don’t close the circle, and each tuning system decides where that leftover goes.',
    start: 'Tap any chapter still listed under WHAT’S LEFT to open it, or open REVIEW ▾ to see the chapters you’ve finished.',
  },
  seeing: [
    'WHAT’S LEFT lists one row per chapter still to do, with its number. When every chapter is done, it reads LAB COMPLETE.',
    '✓ DONE shows the chapters you’ve finished; REVIEW ▾ lists them. Once the lab is complete, a line says practicing again never undoes that.',
  ],
  control: [
    'Tap a chapter’s row to open it.',
    'PRACTICE AGAIN FROM THE START reopens the first chapter. DONE · BACK TO LABS leaves the lab; the Drum Tuning Lab is next in Pitch & Tuning. ■ STOP in the footer silences any sound.',
  ],
  changes: [
    'A chapter gets its check mark when you finish its main task. The lab is complete once every chapter is done.',
    'START OVER (PRACTICE) at the foot of the chapter list clears the check marks for a fresh run; your completed lab stays complete.',
  ],
  teaches: [
    'The lab’s through-line: intervals are ratios, twelve pure fifths overshoot seven octaves, and every system decides where that comma goes.',
    'Each system keeps different intervals pure and pays for it somewhere else; Compare Tuning Systems and Tradeoffs show where.',
  ],
  tryThis: [
    'Open any chapter still listed under WHAT’S LEFT, straight from its row, and finish its main task.',
    'Reopen Compare Tuning Systems and compare the four systems by ear with A / B.',
  ],
};
