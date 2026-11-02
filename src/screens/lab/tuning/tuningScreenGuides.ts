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
    seeing: [
      'A pitch rail: the root C (1:1) on the left, its octave (2:1) on the right, eleven faint marks between. After HEAR IT the marks turn to question marks.',
      'Readouts: ROOT 261.63 Hz, OCTAVE 523.25 Hz, and SOUND (♪ PLAYING or STOPPED).',
      'Below: IN THIS CHAPTER, a volume note, SCOPE ⓘ and BEGIN LAB ›.',
    ],
    control: [
      'HEAR IT: the root sounds, then its octave, and the rail lights each one. ■ STOP silences it.',
      'SCOPE ⓘ: what this lab covers — several influential Western tuning approaches, not every musical culture.',
      'BEGIN LAB › marks this chapter done.',
      'BASIC / MATH (top right): MATH adds the working-out under the display in the chapters that have it.',
      'The strip: ‹ PREV and NEXT › move between chapters; tap the middle for the chapter list. ⓘ explains each chapter’s screen.',
    ],
    changes: [
      'Every system in this lab keeps the octave at exactly ×2: 261.63 × 2 ≈ 523.25 Hz (the hertz are rounded).',
      'Where the notes between go is a choice. Each tuning system answers it differently, keeping some relationships pure and bending others.',
      'Acoustic pianos may stretch the octave slightly; the Tradeoffs chapter returns to this.',
    ],
    teaches: [
      'The one question every tuning system must answer: where do the notes inside an octave go?',
      'The chapters build an answer: ratios, folding, pure fifths, the comma, Just, meantone, equal temperament, then a fair comparison.',
      'Every tone is synthesized exactly — calculated, nothing measured. It follows Autotune in Pitch & Tuning.',
    ],
    tryThis: [
      'Keep the volume low and press HEAR IT: the root lights, then the octave — the same note name at twice the frequency.',
      'Tap SCOPE ⓘ and read what this lab does — and does not — cover before you begin.',
    ],
  },

  // ── 1 · Intervals Are Frequency Relationships ─────────────────────────────
  {
    seeing: [
      'The rail from unison (1:1) to the octave (2:1), with a marker for the upper note. The root marker lights while a clip with the root plays.',
      'Readouts: RATIO, CENTS, INTERVAL (unison, minor 3rd, major 3rd, fourth, fifth, octave — or between) and SOUND.',
      'Below: ROOT and UPPER NOTE cards in hertz; at the octave, TWO OCTAVES, TWO REGISTERS.',
    ],
    control: [
      'UPPER fader, or drag the marker: 0 to 1200 ¢. It snaps gently onto the named ratios.',
      'PLAY tray: ROOT, UPPER NOTE, TOGETHER — and, once you reach the octave, C3–C4 and C4–C5.',
      'SHOW ME slides the marker to the octave. ■ STOP silences.',
    ],
    changes: [
      'RATIO, CENTS and INTERVAL come from one value: cents = 1200 × log₂(ratio).',
      'Cents make equal ratios look like equal distances: every octave is 1200 ¢, whatever the hertz.',
      'C3→C4 is 130.81 Hz apart and C4→C5 261.63 Hz — both still 2:1.',
    ],
    teaches: [
      'An interval is a frequency ratio, not a fixed gap in hertz.',
      'Cents: 1200 to an octave, 100 to an equal semitone.',
      'Next, Ratio Landmarks names the five simplest ratios.',
    ],
    tryThis: [
      'Ride UPPER until INTERVAL reads fifth: RATIO 3/2, CENTS 701.96 ¢.',
      'Tap SHOW ME, then PLAY C3–C4 and C4–C5: the hertz gap doubles (130.81 → 261.63) but both are 2:1, 1200 ¢.',
      'Switch to MATH and ride UPPER: the line c = 1200 · log₂(r) updates as you move.',
    ],
  },

  // ── 2 · Ratio Landmarks ───────────────────────────────────────────────────
  {
    seeing: [
      'One rail: the root, the chosen landmark placed on it, and a blue marker for the mini challenge.',
      'Readouts: RATIO and CENTS (the landmark), MARKER (the challenge marker, green when solved) and SOUND.',
      'Below: five ratio tiles, the landmark’s card and WHOLE-NUMBER RELATIONSHIP bars.',
    ],
    control: [
      'RATIO: flip through 6/5, 5/4, 4/3, 3/2 and 2 — each lands on the rail. Tap it for the list.',
      'MARKER fader, or drag the blue marker: place a 3:2 on the rail. It snaps gently near a landmark.',
      'PLAY: the chosen ratio; once solved, also 3:2 · YOUR ANSWER. SHOW ME slides the marker to 3:2. ■ STOP silences.',
    ],
    changes: [
      'Each landmark is a small whole-number ratio: while the lower note makes 2 cycles, a 3:2 upper note makes 3.',
      'Small ratios line up many harmonics — heard more or less strongly with timbre, register and context.',
      'A ratio multiplies the root: 261.63 × 3/2 = 392.44 Hz.',
    ],
    teaches: [
      'The five landmarks by ear, number and place: 6/5 just minor third, 5/4 just major third, 4/3 pure fourth, 3/2 pure fifth, 2/1 octave.',
      'Every system ahead is built from them or measured against them. Next: folding notes into one octave.',
    ],
    tryThis: [
      'Ride RATIO to 5/4: CENTS reads 386.31 ¢. PLAY it — the just major third.',
      'Ride MARKER to about 702 ¢: it snaps, MARKER turns green at 701.96 ¢ and the PLAY tray adds 3:2 · YOUR ANSWER.',
    ],
  },

  // ── 3 · Folding Notes Into One Octave ─────────────────────────────────────
  {
    seeing: [
      'The Octave Elevator: three floors — ABOVE, COMPARISON OCTAVE (1 ≤ ratio < 2) and BELOW. A ratio tile rides it; SHOW OP marks the next move beside it.',
      'Readouts: RATIO, VALUE, REGION (BELOW, INSIDE, ABOVE) and NEXT OP. The history of moves sits just below the display.',
    ],
    control: [
      'VIEW: Demo A · reduce 9/4, Demo B · raise 3/4, or Your turn.',
      'In a demo: SHOW OP shows the move, MOVE ÷2 (or MOVE ×2) makes it, REPLAY starts again.',
      'Your turn: ×2 and ÷2 one at a time; SHOW ME does one step; RESET restarts the ratio. When it is folded, NEXT (in LAB NOTES) brings the next one: 9/4, 27/8, then 3/4.',
    ],
    changes: [
      '÷2 drops a ratio one octave, ×2 lifts it one. The note’s name (its pitch class) never changes.',
      'Repeat until 1 ≤ ratio < 2 — the comparison octave, where every scale in this lab is compared.',
    ],
    teaches: [
      'Octave normalization: any ratio folds into one octave with ×2 and ÷2.',
      'Folding moves octaves only, never the note.',
      'Build With Pure Fifths folds every fifth this way.',
    ],
    tryThis: [
      'Demo A: SHOW OP, then MOVE ÷2 — 9/4 (VALUE 2.2500, ABOVE) becomes 9/8 (1.1250, INSIDE).',
      'Your turn starts on 9/4. Fold it, press NEXT: 27/8 › in LAB NOTES, and 27/8 arrives (VALUE 3.3750): one ÷2 gives 27/16, VALUE 1.6875 — REGION INSIDE.',
      'On 3/4, press ÷2 once to feel the wrong way: 3/8 drops further BELOW. RESET, then ×2.',
    ],
  },

  // ── 4 · Harmonic Alignment and Beating ────────────────────────────────────
  {
    seeing: [
      'Two harmonic ladders on a LOG-FREQUENCY AXIS: the root C and a major third E. The root’s 5th harmonic and the third’s 4th are the pair compared.',
      'Under them, the alignment meter: cents from 5/4. Readouts: THIRD, FROM 5/4, PARTIALS Δ (the gap between that pair) and SOUND.',
    ],
    control: [
      'THIRD: tap for Just 5/4, Equal-tempered 2^(1/3) or Pythagorean 81/64; ride the lane to set the third yourself, 380–410 ¢ in 0.1 ¢ steps, with a gentle snap onto 5/4.',
      'LISTEN: Full tones or Isolated partials (the other rungs fade). ▶ PLAY sounds the pick.',
      'SHOW ME lands the third on 5/4. ■ STOP silences. LAB NOTES hold the BEATING MODEL, with its own full screen.',
    ],
    changes: [
      'At 5/4 the two partials meet: 4 × 5/4 = 5. PARTIALS Δ reads 0 Hz — no beating.',
      'Move the third and the partials part. Their difference in hertz is the beat rate: the sound swells and fades that many times a second.',
      'The same cents gap is more hertz higher up, so higher pairs of partials beat faster.',
    ],
    teaches: [
      'Why one tuning ratio makes upper harmonics coincide and another makes them beat.',
      'Whether beating is heard depends on the partials being present and strong — timbre, register, room and playback all matter.',
      'Build Harmony With Just Intonation is built on 5/4.',
    ],
    tryThis: [
      'Tap THIRD and pick Equal-tempered: THIRD 400.00 ¢, FROM 5/4 +13.69 ¢, PARTIALS Δ +10.38 Hz.',
      'Pick Pythagorean: 407.82 ¢, FROM 5/4 +21.51 ¢, PARTIALS Δ +16.35 Hz — a faster beat. Set LISTEN to Isolated partials and ▶ PLAY.',
      'Ride THIRD until FROM 5/4 reads 0 ¢ and the readouts turn green: the two partials are the same frequency.',
    ],
  },

  // ── 5 · Build With Pure Fifths ────────────────────────────────────────────
  {
    seeing: [
      'The cents rail, filling with notes made from fifths. In generation order each label carries its step number (3·A); the newest is highlighted and B♯, the last, is red.',
      'Readouts: STEP, NEWEST (its name), CENTS and SOUND. Just under the display, the fifth path shows the chain.',
    ],
    control: [
      'ADD FIFTH: builds the next note — ×3/2, every ÷2 it needs, then where it lands.',
      'FIFTHS fader: ride back to undo or replay, forward to fill the rest at once; the lane shows the exact fraction.',
      'BY PITCH: drops the step numbers and re-sorts the path low to high.',
      '▶ C+(newest) plays C with the newest note. ■ STOP silences.',
    ],
    changes: [
      'One rule, applied again and again: × 3/2, then fold into the octave.',
      'Generation order is not pitch order: the notes land all over the rail.',
      'The twelfth fifth makes B♯ — just above C, not on it.',
    ],
    teaches: [
      'How twelve pitch classes come from one rule, the pure fifth.',
      'Why the circle of pure fifths does not quite close.',
      'The Circle Does Not Close measures that gap exactly.',
    ],
    tryThis: [
      'Press ADD FIFTH twice: 3/2 × 3/2 = 9/4, one ÷2, and D lands at 203.91 ¢.',
      'Ride FIFTHS to the top: NEWEST reads B♯ at 23.46 ¢, in red — near C, not on it.',
      'Turn BY PITCH on: the step numbers leave the rail and the path below runs low to high.',
    ],
  },

  // ── 6 · The Circle Does Not Close ─────────────────────────────────────────
  {
    seeing: [
      'The fifth spiral: twelve fifths wind out from C and end at B♯, outside C’s spot. Its center reads the gap, EXPECTED C · ACTUAL B♯ and PYTHAGOREAN COMMA. The drawing is a model; the gap is exact.',
      'Readouts: EXPECTED C, ACTUAL B♯, GAP and SOUND.',
    ],
    control: [
      'HEAR tray: A · EXPECTED C, B · ACTUAL B♯, A → B, TOGETHER. The note sounding is circled on the spiral.',
      '■ STOP silences. LAB NOTES hold the two paths, the derivation and a question.',
    ],
    changes: [
      'Twelve pure fifths should land where seven octaves do: (3/2)¹² against 2⁷.',
      'They miss: 531441/524288, about 23.46 cents — exact whole numbers, no rounding anywhere.',
      'Two notes 3.57 Hz apart beat about 3.6 times a second.',
    ],
    teaches: [
      'The Pythagorean comma: the exact mismatch between twelve pure fifths and seven octaves.',
      'No tuning can keep every fifth pure AND close the circle — each system decides where the gap goes.',
      'Next, Just intonation tries a different start.',
    ],
    tryThis: [
      'Read the bezel: EXPECTED C 261.63 Hz, ACTUAL B♯ 265.19 Hz, GAP 23.46 ¢.',
      'Play A → B: the second note is a shade higher. Then TOGETHER: 3.57 Hz apart, the pair beats about 3.6 times a second.',
    ],
  },

  // ── 7 · Build Harmony With Just Intonation ────────────────────────────────
  {
    seeing: [
      'The cents rail with one common Just C-major mapping, revealed a note at a time. In RETUNE, a lower lane shows the key rebuilt.',
      'Readouts: NOTE, CENTS, Hz and SOUND — then TONIC, MODE (KEEP or RETUNE), IMPURE or MOVED, and SOUND.',
    ],
    control: [
      'NOTES fader: reveals the mapping one note at a time.',
      'PLAY tray (LOCKED until a second note): C with the newest note; from G, also C, E 5/4, G 3/2, CHORD 4:5:6, ALIGNED PARTIALS; then each pure third you reveal.',
      'TONIC (C, F, G, D) and RETUNE: LOCKED until all eight notes are out. RETUNE rebuilds the set around the tonic. ■ STOP silences.',
    ],
    changes: [
      'Small ratios give pure chords: C, E, G = 4 : 5 : 6.',
      'KEEP leaves the C-major pitches where they are and tests four intervals the new key needs. IMPURE counts the ones that miss.',
      'RETUNE rebuilds the set: the lower lane shows which notes move and which are new.',
    ],
    teaches: [
      'Just intonation: pure triads from small whole-number ratios, for one chosen key.',
      'Why one fixed set of pitches cannot keep every ratio pure in every key — a singer can retune, a fixed instrument cannot.',
      'Next, Spot the Difference sets it beside the Pythagorean scale.',
    ],
    tryThis: [
      'Ride NOTES to E: NOTE E 5/4, CENTS 386.31 ¢, Hz 327.03 Hz.',
      'With all eight out, set TONIC to D (KEEP): in LAB NOTES, D → A reads 40/27 (−21.51 ¢), and D major needs F♯ and C♯.',
      'Turn RETUNE on: MOVED reads 2 + 2 new — E and A move, F♯ and C♯ are new pitches.',
    ],
  },

  // ── 8 · Spot the Difference: Pythagorean Versus Just ──────────────────────
  {
    seeing: [
      'A two-lane rail. At first only note names: both scales read C D E F G A B on the bezel.',
      'After RATIOS: the Pythagorean notes on the top lane, the Just E, A and B below, and a bracket measuring the split. Readouts: PYTH, JUST, 81/80 and SOUND.',
    ],
    control: [
      'RATIOS: reveals the ratios and the split.',
      'Then NOTE flips E, A and B (the bracket follows) — or tap a marker on the rail.',
      'EXAMPLE: C–E major third, C–E–G triad, F–A major third, G–B major third or C-major phrase; its notes stay lit.',
      'A / B tray: A · PYTHAGOREAN, B · JUST, A → B. ■ STOP silences.',
    ],
    changes: [
      'C, D, F and G match: both scales build them from 2 and 3 alone.',
      'E, A and B differ by 81/80, about 21.51 ¢: stacked fifths put them higher than pure thirds do.',
      'Same note names, same root, same instrument tone — only the ratios change, and with them the pitch of E, A and B.',
    ],
    teaches: [
      'The syntonic comma, 81/80: the gap between a Pythagorean and a Just third.',
      'Two scales can share every note name yet differ in pitch.',
      'Next, meantone splits the difference.',
    ],
    tryThis: [
      'Press RATIOS: PYTH E reads 407.82 ¢, JUST E 386.31 ¢, 81/80 21.51 ¢.',
      'Ride NOTE to A, then B: the bracket follows and reads 21.51 ¢ each time.',
      'Pick the C–E–G triad as EXAMPLE and play A → B: hear the Just chord settle.',
    ],
  },

  // ── 9 · Build Quarter-Comma Meantone ──────────────────────────────────────
  {
    seeing: [
      'Five short parts; the display follows PART: the C·D·E rail (A), four fifths on the rail (B), harmonic ladders with a meter (C), the scale (D), the twelve-note chain with the wolf’s two ends in red (E).',
      'The readouts change with the part, e.g. FIFTH, g⁴/4 and FROM 5/4 in C; WOLF, NORMAL and WIDER BY in E.',
    ],
    control: [
      'PART: ride A → E, or tap for the list.',
      'B: PLAY the pure fifth 3/2 or the meantone fifth ⁴√5.',
      'C: FIFTH fader, 690–705 ¢, snapping gently near ⁴√5; double-tap the lane for 700 ¢. SHOW ME lands it; ▶ C–E–G plays the triad.',
      'D: NOTES reveals the scale; ▶ SCALE plays it. E: PLAY a normal fifth or the wolf. ■ STOP on every part.',
    ],
    changes: [
      'Narrow every fifth a little: stack four of them, drop two octaves, and you land on a pure 5/4 third.',
      'The fifth that does it is ⁴√5, about 5.38 ¢ narrower than pure.',
      'The leftover gathers in one closing fifth: the wolf.',
    ],
    teaches: [
      'Quarter-comma meantone: pure major thirds bought with narrowed fifths.',
      'A discrepancy can be moved, never removed — here into the wolf.',
      'Next, Divide the Octave Equally spreads it evenly instead.',
    ],
    tryThis: [
      'Part A: the readouts give t = 1.118034 and D at 193.16 ¢ — halfway to E 5/4 by ratio, not by hertz.',
      'Part C at 700 ¢: g⁴/4 reads 400.00 ¢, FROM 5/4 +13.69 ¢. Tap SHOW ME: FIFTH 696.58 ¢ and FROM 5/4 reads 0 ¢.',
      'Part E: WOLF 737.64 ¢, NORMAL 696.58 ¢, WIDER BY 41.06 ¢. Play the normal fifth, then the wolf.',
    ],
  },

  // ── 10 · Divide the Octave Equally ────────────────────────────────────────
  {
    seeing: [
      'The chromatic rail, cents spaced: twelve positions from C to the octave, filling as steps are built.',
      'Readouts: STEP, RATIO, Hz and SOUND. While A / B plays, its notes light on the rail.',
    ],
    control: [
      'ADD ×r builds the next equal step (OCTAVE ✓ when all twelve are built).',
      'STEPS fader: ride back to start over, forward to build them all.',
      'A / B tray: A · PATTERN IN C, B · STARTING ON F, A → B. ■ STOP silences.',
    ],
    changes: [
      'Every step multiplies by the same r = 2^(1/12) ≈ 1.059463 — exactly 100 cents.',
      'The hertz added grows as you climb: the same ratio on a bigger number.',
      'Moved to F, the pattern keeps its shape: every step is the same ratio in every key.',
    ],
    teaches: [
      'Equal temperament: twelve equal ratios, not twelve equal hertz.',
      'Its fifth is about 1.96 ¢ narrow and its major third about 13.69 ¢ wide.',
      'Next, Compare Tuning Systems puts all four side by side.',
    ],
    tryThis: [
      'Press ADD ×r once: RATIO 1.059463, Hz 277.18 Hz; the LAB NOTES card reads +15.56 Hz for this step.',
      'Ride STEPS all the way right: LAB NOTES reads +29.37 Hz for the last step, B to C — same ratio, nearly twice the hertz.',
      'Play A · PATTERN IN C, then B · STARTING ON F: the lit notes move up five steps with the same spacing. A → B plays both in turn.',
    ],
  },

  // ── 11 · Compare Tuning Systems ───────────────────────────────────────────
  {
    seeing: [
      'The deviation chart: each bar is a note’s distance from equal temperament (0 ¢ = EQUAL TEMPERAMENT, + HIGHER, − LOWER). Green exact, gold within 10 ¢, orange beyond.',
      'Readouts: NOTE (with its ratio), Hz, VS EQUAL and SOUND. Below the display, a fixed keyboard: C FIXED AT the root.',
    ],
    control: [
      'SYSTEM: flip Pythagorean, Just, meantone and Equal — every bar moves.',
      'NOTE (or tap a bar or a key): inspect one degree.',
      'REF: A4 = 440, 442 or 432 — the reference pitch for the whole lab.',
      'A / B: pick an EXAMPLE and SYSTEM B, then ▶ A, ▶ B or A → B; also HEAR THE SAME NOTE MOVE — E over a fixed C in three systems. ■ STOP silences.',
    ],
    changes: [
      'Same C, same keys, same instrument tone: only the ratio given to each note changes.',
      'REF moves every hertz together; the ratios and the VS EQUAL bars stay put.',
    ],
    teaches: [
      'How four systems place the same notes, side by side.',
      'No system has the one true E — each is a choice about what to keep pure.',
      'Next, Tradeoffs sums up what each gives and takes.',
    ],
    tryThis: [
      'With E selected, ride SYSTEM from Just to Pythagorean: VS EQUAL goes from −13.69 ¢ to +7.82 ¢.',
      'Set REF to A4 = 442: the keyboard reads C FIXED AT 262.81 Hz, but VS EQUAL does not move. Set A4 = 440 again — REF applies to the whole lab.',
      'Open A / B and play the three E’s over a fixed C.',
    ],
  },

  // ── 12 · Tradeoffs, Musical Use, and Misconceptions (reading page) ────────
  {
    seeing: [
      'A reading page, no display. Four cards, one per system, each with its rule and four points.',
      'Then MISCONCEPTIONS: nine claims to judge, WHERE THIS MEETS PROFESSIONAL AUDIO, and UNDERSTOOD ›. The footer shows the sound line and ■ STOP.',
    ],
    control: [
      'Scroll. Tap a claim to read its correction; tap again to close it. Opened ones read “seen · tap to reread ▸”.',
      'UNDERSTOOD › lights once you have opened three, and marks the chapter done.',
    ],
    changes: [
      'Opening a claim shows its correction and counts it.',
      'Nothing here plays; it gathers what the chapters showed.',
    ],
    teaches: [
      'What each system keeps and what it gives up — choices, not winners.',
      'Nine common misconceptions, corrected.',
      'Where tuning meets audio work: pitch correction targets, synth tuning tables, choirs and strings, historical keyboards, piano octave stretch.',
    ],
    tryThis: [
      'Before opening “A4 = 440 Hz is a law of nature.”, decide: true or false? Then tap it.',
      'Read the TWELVE-TONE EQUAL TEMPERAMENT card: fifths −1.96 ¢, major thirds +13.69 ¢ — the numbers from Harmonic Alignment and Divide the Octave.',
    ],
  },

  // ── 13 · Apply What You Learned ───────────────────────────────────────────
  {
    seeing: [
      'Six challenges; three have a display. FIGURE picks it: the Octave Elevator (1), the harmonic ladders with a meter (4) or the rail of three E’s over a fixed C (6).',
      'Readouts follow the figure (e.g. RATIO, VALUE, REGION), with DONE on FOLD and THIRD; E MOVES shows the three E’s and SOUND. Below: challenge 2 (match the rule) and the questions for 3, 5 and 6.',
    ],
    control: [
      'FIGURE: 1 · Normalize 9/4, 4 · Align the third, 6 · Hear E move.',
      'FOLD: ×2, ÷2, RESET. THIRD: the THIRD fader (370–430 ¢, snapping onto 5/4; double-tap for 400 ¢) and SHOW ME. E MOVES: the PLAY tray.',
      'Below: tap a system for each rule (2) and answer the questions (3, 5, 6). ■ STOP silences.',
    ],
    changes: [
      'Each challenge ticks once you get it right — a wrong try costs nothing, just try again. All six ticked completes the chapter.',
      'Then WHAT YOU KEEP lists the six ideas, and RETRY THE CHALLENGES runs them again.',
    ],
    teaches: [
      'The lab’s ideas used on purpose: fold, name the rule, spot the comma, align a third, derive 2^(1/12), hear a note move.',
      'Last chapter of the lab; the Drum Tuning Lab comes next in Pitch & Tuning.',
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
  seeing: [
    'WHAT’S LEFT, or LAB COMPLETE once every chapter is done: one row per chapter still to do, with its number.',
    '✓ DONE: the finished chapters — REVIEW ▾ lists them. Once the lab is credited, a line says practicing again never removes that credit.',
  ],
  control: [
    'Tap a chapter’s row to open it.',
    'PRACTICE AGAIN FROM THE START reopens the first chapter. DONE · BACK TO LABS leaves the lab. ■ STOP in the footer silences any sound.',
  ],
  changes: [
    'Each chapter is ticked when its main task is done. The lab is credited once every chapter is done.',
    'START OVER (PRACTICE) at the foot of the chapter list clears the ticks for a fresh run; credit stays.',
  ],
  teaches: [
    'The lab’s path at a glance: ratios, folding, fifths, the comma, Just, meantone, equal temperament, comparison, application.',
    'Next in Pitch & Tuning: the Drum Tuning Lab.',
  ],
  tryThis: [
    'Open any chapter still listed, straight from its row.',
    'Reopen Compare Tuning Systems and compare the four systems by ear with A / B.',
  ],
};
