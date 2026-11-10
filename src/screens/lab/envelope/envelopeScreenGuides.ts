/**
 * Sound Envelope & Transients Lab — "explain this screen" content (Screen
 * Guide rollout, 2026-10-31; standard = wave/waveScreenGuides.ts, PagedLab
 * pattern = patchbay/patchbayScreenGuides.ts).
 *
 * The lab is a PagedLab: seven pages of its own (EnvelopeLabScreen.tsx PAGES,
 * keyed p1…p7 in page order) plus the understanding check PagedLab appends
 * (understandingChecks.ts ENVELOPE, keyed `check`). The what's-left screen
 * has its own guide, ENVELOPE_END_GUIDE (PagedLab `endGuide`, titled WHERE
 * YOU ARE): progress mode (no creditLabKey / pageCreditKeys, so rows read
 * ✓ DONE), noun "page", PagedLab's default buttons.
 *
 * Every name is the on-screen name in EnvelopeLabScreen.tsx / EnvelopeChart
 * (page titles, slider labels, button labels, chart tags, card eyebrows,
 * duration bands). Every number in TRY THIS is what the page prints at that
 * setting, computed from envelopeModel.ts + sliderMaps.ts (the same functions
 * the page calls):
 *   Explorer: default attack 40 ms → rise 32.0 ms (SNAP 20.5 ms); Attack at
 *     the left end → 0 ms / rise 0.0 ms; at the right end → 1995 ms, printed
 *     "2.0 s", rise 1596.0 ms
 *   Gallery: snare total 122 ms; piano decay 1400 ms, release 500 ms; snare
 *     loaded into the Explorer → attack 2 ms → rise 1.0 ms, ATTACK: SNAP
 *   Transients: rise 1.0 / 48.0 / 320.0 ms (attack 2 / 60 / 400 ms); the
 *     three also settle to different levels (sustain 0.35 / 0.6 / 1.0), so
 *     the guide never says "only the onset changes"
 *   Peak vs Average levels are dB of the model's full scale (envelope top =
 *     1.0, toDb = 20·log10), which is why the snare's peak reads −0.4 dB
 *   Duration: Finger snap "About 12 ms", Pink noise "About 12 s", Piano note
 *     "About 2.5 s" (LONG)
 *   Peak vs Average: snare peak −0.4 · average −15.7 · crest 15.3 dB;
 *     trumpet peak 0.0 · average −4.3 · crest 4.3 dB
 *   Scope: cymbal release 1400 ms
 * test/screenGuide_envelope_20261031.test.ts re-runs every one of them.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The check guides never give away an answer.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** Each page key's title, in page order — pinned against PAGES. */
export const ENVELOPE_GUIDE_PAGE_TITLES: Record<string, string> = {
  p1: 'The Envelope Explorer',
  p2: 'Common Sound Shapes',
  p3: 'Transient Explorer',
  p4: 'How Long Does a Sound Last?',
  p5: 'Peak vs Average Level',
  p6: 'Envelope vs Propagation',
  p7: 'Check Yourself',
  check: 'Check your understanding',
};

export type EnvelopeScreenId = keyof typeof ENVELOPE_GUIDE_PAGE_TITLES;

export const ENVELOPE_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 · The Envelope Explorer ─────────────────────────────────────────────
  p1: {
    intro: {
      learning: 'A sound’s envelope is its level over time: attack, decay and release are times; sustain is a level. Rise time, from 10 to 90 %, measures how fast it starts.',
      start: 'Tap RESET and read the rise time in the tag at top left. Drag the Attack slider and watch the gold dots move apart. Then drag Sustain level to 0 %.',
    },
    seeing: [
      'One chart: the envelope line (the ADSR you met in Modular Synth) over the 220 Hz wave it shapes. Regions A, D, S, R run along the bottom; the total length sits top right.',
      'Gold dots on the dashed 10% and 90% lines mark the rise time: how long the climb takes between them. The tag at top left prints it.',
      'Below: ▶ SWEEP THE SHAPE, the sliders, two curve buttons and RESET, then the READOUT card and THE WORDS.',
    ],
    control: [
      'Attack, Decay and Release sliders: 0 ms up to about 2 s (Attack) or 3 s, on a log scale, so short times get more room. Sustain level: 0 to 100 %.',
      'Hold (energy still supplied): 0 to 2000 ms at the sustain level, after attack and decay, before release.',
      'ATTACK: LINEAR / SNAP and DECAY: LINEAR / NATURAL switch the curve shapes. RESET brings back the starting shape.',
      '▶ SWEEP THE SHAPE runs a slowed playhead along the shape (the slow-down is printed). ⤢ FULL SCREEN enlarges the chart with the four sliders under it.',
      'In the strip under the title: ⏮ goes to the first page, ‹ PREV and NEXT › step one page, and MODULE ▾ opens the list of pages.',
    ],
    changes: [
      'Lengthen the attack and the climb stretches. The rise time grows with it but stays shorter, because it skips the first and last 10 %.',
      'Sustain is the level held during Hold. At 0 % there’s nothing to hold, so the sound can only decay.',
      'Attack, Decay, Hold and Release set the total length; Sustain doesn’t. An attack under 15 ms reads as a transient; from 120 ms the sound swells in.',
    ],
    teaches: [
      'An envelope is a sound’s level over time, from silence back to silence, in four stages. Here Hold sets how long the sustain lasts.',
      'Attack, decay and release are times; sustain is a level.',
      'Rise time (10 → 90 %) measures an onset, and it’s shorter than the attack.',
      'No real source jumps to full level instantly; even the sharpest hit takes some time to rise.',
    ],
    tryThis: [
      'Drag Attack all the way left: the READOUT card says attack 0 ms → rise time 0.0 ms, an instant step no real source makes. All the way right: attack 2.0 s → rise time 1596.0 ms.',
      'Tap RESET (attack 40 ms): rise time 32.0 ms. Tap ATTACK: LINEAR to switch to SNAP: 20.5 ms. A snap does most of its climbing early.',
      'Drag Sustain level to 0 %: the READOUT card calls the sound percussive, since it can only decay. Through S, the envelope line and the wave flatten onto the center (zero) line.',
    ],
  },

  // ── 2 · Common Sound Shapes ───────────────────────────────────────────────
  p2: {
    intro: {
      learning: 'Sounds fall into families: struck sounds can only decay, while bowed and blown sounds can sustain. Also why a piano has no true sustain and speech needs its onsets.',
      start: 'Tap Snare drum, then Trumpet, and run ▶ SWEEP THE SHAPE on each. Then tap Piano and look for a flat S region.',
    },
    seeing: [
      'Typical shapes for six sounds, plus Speech. The chart draws the chosen shape over its own source: a snare’s shell tone plus its wires’ noise, for example.',
      'The card below: what to notice, the sound’s traits, and its four stage values: attack, decay, sustain, release.',
      'Speech swaps in a chart of seven syllable envelopes: PRO-FES-SION-AL AU-DI-O.',
    ],
    control: [
      'Tap Snare drum, Kick drum, Piano, Violin, Trumpet, Cymbal or Speech.',
      '▶ SWEEP THE SHAPE runs a slowed playhead along the shape. ⤢ FULL SCREEN enlarges it with the six sound buttons under it.',
      'LOAD INTO THE EXPLORER › opens The Envelope Explorer with this shape on its sliders, so you can change it yourself.',
    ],
    changes: [
      'Percussive shapes fall from the moment they peak. Sustained ones (Violin, Trumpet) sit on a flat S region while the bow or breath keeps supplying energy.',
      'The drums show no S or R region at all: nothing is held, so nothing is left to release.',
      'Speech alternates short bursts (many consonants) and held vowels, with near-silences between.',
    ],
    teaches: [
      'Sounds fall into families: struck sounds can only decay; bowed and blown sounds can sustain while energy keeps coming.',
      'A piano has no true sustain: once the hammer strikes, the string only loses energy.',
      'Speech needs its onsets: many consonants are short bursts.',
      'These are typical shapes; real instruments vary with technique, register and room.',
    ],
    tryThis: [
      'Tap Snare drum, then Trumpet, and run ▶ SWEEP THE SHAPE on each. The snare is all falling, over in 122 ms; the trumpet holds near its peak.',
      'Tap Piano: no flat S region. Decay 1400 ms runs straight into release 500 ms, because a struck string can only lose energy.',
      'Pick Snare drum and tap LOAD INTO THE EXPLORER ›: attack 2 ms → rise time 1.0 ms, with ATTACK: SNAP. Stretch Attack past 15 ms and the READOUT card stops calling it a transient.',
    ],
  },

  // ── 3 · Transient Explorer ────────────────────────────────────────────────
  p3: {
    intro: {
      learning: 'The transient is the brief, fast-changing start of a sound. Your ear uses it to place a sound in time and to tell one source from another.',
      start: 'Tap Sharp transient, then Soft transient, then No transient, and read the rise time on the card each time. Then run ▶ SWEEP THE SHAPE on No transient.',
    },
    seeing: [
      'Three onsets drawn to the same peak: Sharp transient, Soft transient, No transient. Gold dots on the 10% and 90% lines mark the rise time.',
      'The card under the chart describes the onset and prints its rise time and attack.',
      'Below: THE WORDS · ONSETS (transient, rise time) and WHY TRANSIENTS MATTER, with six places they count.',
    ],
    control: [
      'Tap Sharp transient, Soft transient or No transient.',
      '▶ SWEEP THE SHAPE runs a slowed playhead along the shape. ⤢ FULL SCREEN enlarges it with the three buttons under it.',
    ],
    changes: [
      'Same peak, but the attack goes from 2 ms to 60 ms to 400 ms, so the rise time jumps from about a millisecond to hundreds. Each also settles to a different level: 35, 60 and 100 % of the peak.',
      'A sharp onset gives your ear a clear moment to lock onto. A slow swell gives none, so it’s hard to place in time.',
    ],
    teaches: [
      'The transient is the brief, fast-changing onset: the part your ear uses to place and identify a sound.',
      'Transients matter for drums, speech and telling instruments apart, and for compressors, limiters and loudspeakers, which all have to react to them.',
      'Rise time puts a number on a transient: about 1 ms is sharp; hundreds of milliseconds is a swell.',
    ],
    tryThis: [
      'Step Sharp → Soft → No transient: the card reads rise time 1.0 ms, then 48.0 ms, then 320.0 ms. Same peak; the onset is the big change.',
      'On No transient, run ▶ SWEEP THE SHAPE: the playhead rides a 400 ms swell with no click to mark where the sound begins.',
    ],
  },

  // ── 4 · How Long Does a Sound Last? ───────────────────────────────────────
  p4: {
    intro: {
      learning: 'Sounds last from about a millisecond to many seconds, so durations are drawn on a log scale. Also why short sounds give compressors and limiters little time to react.',
      start: 'Tap 1 · Finger snap, then 7 · Pink noise, and compare their times. Then tap 5 · Piano note and read which band it falls in.',
    },
    seeing: [
      'A log-time line from 1 ms to 20 s in five bands: IMPULSE, SHORT, MEDIUM, LONG, CONTINUOUS. Seven numbered markers are typical sounds.',
      'The chosen marker shows its name and time on the line; the card below names its band.',
      'TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED: real sounds vary.',
    ],
    control: [
      'Tap a numbered marker on the line, or its button: 1 · Finger snap through 7 · Pink noise.',
      '⤢ FULL SCREEN enlarges the line with the seven buttons under it.',
    ],
    changes: [
      'Each equal step along the axis is ten times longer, so 12 ms and 12 s both fit on one line.',
      'Short sounds are nearly all onset; long ones are mostly body. A processor has less time to react to a short sound; a meter reads a long one by its body.',
    ],
    teaches: [
      'Sound durations span about four orders of magnitude (factors of ten), so they’re drawn on a log scale.',
      'Durations fall into bands, from an impulse to a continuous tone.',
      'Short sounds challenge compressors and limiters: the sound can be nearly over before the processor reacts.',
    ],
    tryThis: [
      'Tap 1 · Finger snap, then 7 · Pink noise: About 12 ms against About 12 s. That’s a thousand times longer, three steps apart on the axis.',
      'Tap 5 · Piano note: About 2.5 s, in the LONG band — long enough to have a clear onset, body and tail.',
    ],
  },

  // ── 5 · Peak vs Average Level ─────────────────────────────────────────────
  p5: {
    intro: {
      learning: 'Peak level follows a sound’s transient; average (RMS) level follows its body. The gap between them, the crest factor, is large for a snare and small for a trumpet.',
      start: 'Tap Percussive (snare) and read peak, average (RMS) and crest factor. Then tap Sustained (trumpet) and watch the two lines move closer together.',
    },
    seeing: [
      'One sound’s waveform with two lines: peak (solid white) and average (RMS) (dashed purple). RMS (root mean square) is a kind of average level over time.',
      'The readout: peak, average (RMS) and crest factor, in dB below the top of the envelope (0 dB). So a peak just under the top reads a little below 0 dB.',
      'Below: a WORKED EXAMPLE of crest factor against dynamic range, and WHY IT MATTERS.',
    ],
    control: [
      'Tap Percussive (snare) or Sustained (trumpet).',
      '⤢ FULL SCREEN enlarges the chart with both buttons and the readout under it.',
    ],
    changes: [
      'A snare spends almost all its time far below its peak, so its average sits low: a big crest factor.',
      'A trumpet holds near its peak, so peak and average nearly agree: a small crest factor.',
      'Crest factor belongs to one sound; dynamic range spans a whole performance or a system.',
    ],
    teaches: [
      'Peak meters follow the transient; average meters follow the body. Both are right — they measure different things.',
      'Crest factor = peak − average, in dB.',
      'Gain staging needs both: peaks decide the headroom you need, and the average is closer to how loud it sounds.',
    ],
    tryThis: [
      'Tap Percussive (snare): peak −0.4 dB, average −15.7 dB, crest factor 15.3 dB. Now Sustained (trumpet): peak 0.0, average −4.3, crest factor 4.3 dB.',
      'Watch the two lines as you switch: far apart on the snare, close together on the trumpet. That gap is the crest factor.',
    ],
  },

  // ── 6 · Envelope vs Propagation ───────────────────────────────────────────
  p6: {
    intro: {
      learning: 'A sound’s envelope belongs to its source; propagation is how the sound travels and meets the room. A long reverb tail comes from the room, not from a long release.',
      start: 'Read SOUND ENVELOPE · THIS LAB, then WAVE PROPAGATION · THE WAVE PHYSICS LAB. Then read the two lines on the classic mix-up and tap GOT IT ›.',
    },
    seeing: [
      'Two cards: SOUND ENVELOPE · THIS LAB, and WAVE PROPAGATION · THE WAVE PHYSICS LAB, from Audio Fundamentals. No chart on this page.',
      'Under them, two lines on the classic mix-up, and GOT IT › to finish the page.',
    ],
    control: [
      'Tap GOT IT › to mark this page done; NEXT › also marks it as it moves on.',
      'MODULE ▾ in the strip opens the list of pages, so you can jump back to any of them.',
    ],
    changes: [
      'Nothing moves here. The page separates two subjects that are easy to blur.',
      'Envelope: how the source changes over time. Propagation: how sound travels and meets the room.',
    ],
    teaches: [
      'ADSR describes the source, not the room. A snare’s envelope at the source is the same whether you stand 1 meter away or 20; farther away, the room adds more of its own tail.',
      'A long reverb tail is not a long release. Release is the source stopping; the tail is the room still returning energy.',
      'Moving away changes the mix of direct and room sound, not the source’s envelope.',
    ],
    tryThis: [
      'Go back to Common Sound Shapes and pick Cymbal: release 1400 ms. In a big hall that release stays the same; the room only adds its own tail.',
      'Picture one snare hit in a small room and in a big hall: the same envelope at the source, a different tail from each room.',
    ],
  },

  // ── 7 · Check Yourself ────────────────────────────────────────────────────
  p7: {
    intro: {
      learning: 'A review of six ideas that are easy to confuse: the transient, piano sustain, rise time, peak versus average, crest factor versus dynamic range, and envelope versus propagation.',
      start: 'Read the first UNDERSTANDING CHECK card and tap the answer you think is right. If it’s wrong, read the explanation and try again.',
    },
    seeing: [
      'Six questions, one for each idea in this lab, each in an UNDERSTANDING CHECK card.',
      'The card at the top shows how many you’ve got right so far and whether the page is complete.',
    ],
    control: [
      'Tap an answer. A wrong pick shows the explanation and stays open, so you can try again.',
      'All six right completes this page. NEXT › then moves on to the lab’s final check.',
    ],
    changes: [
      'A right pick turns green with a ✓ and its explanation, and the card locks.',
      'Each question targets a common mix-up, and its explanation names it.',
    ],
    teaches: [
      'Six ideas in this lab are easy to confuse: the transient, piano sustain, rise time, peak vs average, crest factor vs dynamic range, envelope vs propagation.',
      'Each mix-up has a reason, and the explanation after a wrong pick shows exactly where the thinking slips.',
    ],
    tryThis: [
      'Unsure about rise time? Go back to The Envelope Explorer, tap RESET and read where the two gold dots sit on the climb.',
      'Unsure about peak vs average? Peak vs Average Level shows the gap as two lines on one waveform.',
    ],
  },

  // ── The understanding check (appended by PagedLab) ────────────────────────
  check: {
    intro: {
      learning: 'A last look at four of the lab’s ideas: what sustain is, where rise time is measured, what crest factor is, and what a big hall does to a snare.',
      start: 'Read each question and tap your answer. Read the explanation either way. Unsure? Go back to the page the question comes from, then return.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on what sustain is, where rise time is measured, what crest factor is, and a snare in a big hall.',
      'Above them you see how many are still to get right; a ✓ replaces a question’s number once it’s right.',
      'Every answer opens its explanation: CORRECT, or NOT QUITE — TRY ANOTHER.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'FINISH · SEE WHAT’S LEFT › at the foot of the page (FINISH › in the strip) shows what is left in the lab, at any time.',
      'If you leave this page before all four are right, the questions start fresh.',
    ],
    changes: [
      'Each explanation gives the reason, right or wrong, so every answer teaches something.',
      'Get all four right and the check is passed. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'A sound is described by stages, measured by its onset and its levels, and heard through a room.',
      'A sound’s shape at the source, its onset, its level readings and the room around it are separate things, each described in its own way.',
    ],
    tryThis: [
      'Unsure where rise time is measured? Go back to The Envelope Explorer: the gold dots mark it.',
      'Unsure about the snare in a hall? Envelope vs Propagation draws that line.',
    ],
  },
};

// ── WHAT'S LEFT (LabEndScreen via PagedLab, progress mode) ───────────────────
// Every fact is the code's: titles from labEnd.ts endTitle (+ YOUR PROGRESS
// and the shared unreadable note in place of the lead line when unreadable —
// a failed credit read alone sets it, since this lab has a check); mode
// 'progress' → ✓ DONE (the word CREDITED never shows here); PagedLab's
// buttons (PRACTICE AGAIN FROM THE START = goTo(0), default doneLabel); pages
// 1–5 mark on the first slider / choice button / page-4 numbered marker
// (useTouch) or NEXT, page 6 on GOT IT › or NEXT, Check Yourself (manualDone)
// on all six, the check on all four; a CONTENTS / row jump never marks.
// CONTENTS ends WHAT'S LEFT ›, then START OVER (PRACTICE) (doReset →
// resetPagedProgress): no creditLabKey / pageCreditKeys, so the page ticks
// go; only the banked check (UNDERSTANDING_UNIT) stays. The check's pass is
// the lab's certificate unit (trainingLabKeys tr_envelope, 'understanding').
// Quoted labels use the straight ' the screen draws (labEnd.ts, NAV.whatsLeft).
export const ENVELOPE_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'The lab’s path at a glance: a sound’s envelope, its transient, how long it lasts, peak versus average level, and how the envelope differs from what the room adds.',
    start: 'Tap any page still listed to open it. If only Check your understanding is left, open it and get all four questions right.',
  },
  seeing: [
    'The title reads WHAT\'S LEFT, or LAB COMPLETE once every page and the check are done. The line under it says what’s left and whether it’s saved.',
    'Each page not done yet is listed by name; Check your understanding sits last, marked CHECK. Pages you’ve done fold into one ✓ DONE line.',
    'If saved progress can’t be read, the title reads YOUR PROGRESS, a note replaces the line under it, and every page still opens.',
  ],
  control: [
    'Tap any listed row to jump straight to that page.',
    'REVIEW ▾ on the ✓ DONE line unfolds the finished pages; tap one to open it again.',
    'PRACTICE AGAIN FROM THE START reopens The Envelope Explorer and clears nothing. DONE · BACK TO LABS leaves the lab.',
    'In the strip: ⏮ opens the first page, ‹ PREV returns to the page you came from, and WHAT\'S LEFT ▾ opens the list of pages. START OVER (PRACTICE), at the foot of that list, asks first, then clears the page check marks.',
  ],
  changes: [
    'Pages 1–5 count as done once you move a slider, tap a choice button or numbered marker, or tap NEXT ›. Envelope vs Propagation counts with GOT IT › or NEXT ›.',
    'Check Yourself counts once all six are right, Check your understanding once all four are. Jumping to a page never marks it.',
    'START OVER (PRACTICE) clears the page check marks; reviewing clears nothing. A passed check stays.',
  ],
  teaches: [
    'A sound’s envelope is its level over time, in stages, and rise time puts a number on how fast it starts.',
    'Peak and average level measure different parts of a sound, and the source and the room each shape what you hear.',
  ],
  tryThis: [
    'The Envelope Explorer still listed? Tap it, move any slider, then tap MODULE ▾ and WHAT\'S LEFT ›, just under the page list: it has joined the ✓ DONE line.',
    'Only Check your understanding left? Open it, get all four questions right, then tap FINISH ›: the title reads LAB COMPLETE.',
    'Done Peak vs Average Level? Tap REVIEW ▾, reopen it and switch between snare and trumpet again. Then tap MODULE ▾: its ✓ is still there.',
  ],
};

/** PagedLab's `pageGuide`: page index (0-based) → that page's guide. Index 7
 *  is the appended understanding check; the what's-left screen takes
 *  ENVELOPE_END_GUIDE through PagedLab's `endGuide`. */
export function envelopePageGuide(index: number): ScreenGuide | undefined {
  if (index === 7) return ENVELOPE_SCREEN_GUIDES.check;
  return ENVELOPE_SCREEN_GUIDES[`p${index + 1}`];
}
