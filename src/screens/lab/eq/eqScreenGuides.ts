/**
 * EQ Lab — "explain this screen" content (owner 2026-10-31, Screen Guide
 * rollout after the Wave Physics pilot). One guide per module (keyed by
 * EqModuleId), one for the lab home and one for the what's-left screen
 * (reached from the home's SEE WHAT'S LEFT and from FINISH on the last
 * module).
 *
 * Every line was written against the module's own code (modules/*.tsx,
 * eqBits, eqMath, eqAudition): names are the on-screen names (bezel keys,
 * dock labels, tray options, labels drawn on the display), and every number
 * quoted in TRY THIS is what the module prints at that setting (default state
 * unless the step says otherwise). Change a module's labels, ranges or
 * defaults → update its guide here; test/screenGuide_eq_20261031.test.ts pins
 * the shape and recomputes the numbers.
 *
 * Colour words: the trainer main curve is coloured on the level ramp (blue
 * when nothing is boosted, warming with the boost), not a fixed amber. The
 * guides and the module legends (fixed 2026-10-31) both say "bold" for it.
 *
 * STEPPED: each section is one step and must fit a 375×812 phone with no
 * scrolling — SCREEN_GUIDE_BUDGET (types.ts) holds every section.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no gear brand names; no "N of total"; "suggest" never "recommend";
 * no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { EqModuleId } from './modules/registry';

export const EQ_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Building on the one-band Equalizer: how EQ reshapes the balance of frequency content — where (frequency), how much (gain), how wide (Q) — and how to diagnose problems with it.',
    start: 'Tap Seeing Frequency to read what it covers, then tap OPEN. Inside any module, tap ⓘ beside its title whenever you want that screen explained.',
  },
  seeing: [
    'This is the EQ Lab menu. Each module shows you one idea about seeing, shaping or diagnosing frequency content.',
    'The top row is your path through the lab: SEE › MANIPULATE › HEAR › IDENTIFY › CORRECT.',
    'Numbered modules in four groups: LEARN, EXPLORE, TRAIN and CHALLENGE.',
    'Below them: CHECK YOUR UNDERSTANDING (this lab’s questions), SEE WHAT’S LEFT and RELATED TOOLS.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Inside most modules, the display is on top, readouts sit on its frame and the controls are in the dock at the bottom. Scroll below for notes and a check. Tap ⓘ beside a module’s title to have that screen explained.',
    'CHECK YOUR UNDERSTANDING: answer every question correctly to complete the lab; a wrong answer can be tried again straight away.',
    'RELATED TOOLS opens the SPECTRUM ANALYZER / RTA, the EQUALIZER EFFECT LAB (the one-band lab you can hear) and the Q & BANDWIDTH CALC.',
    'SEE WHAT’S LEFT lists the modules you have not opened; ‹ leaves the lab.',
  ],
  changes: [
    'Modules 1–3 show what frequency content looks like, what EQ is for, and the three kinds of EQ.',
    'Modules 4–8: frequency, gain and Q, then filter shapes, slopes, and graphic against parametric EQ.',
    'Modules 9–11 run many bands at once, show what a graphic EQ really does, and draw EQ over your room’s sound.',
    'Modules 12–15 put it to work: find the frequency, match the curve, fix the signal, then boost against cut.',
  ],
  teaches: [
    'EQ changes the balance of frequency content: where (frequency), how much (gain), how wide (Q).',
    'Each filter shape suits its own job, and overlapping filters add up to one response.',
    'An uncalibrated phone mic gives Modules 1 and 11 relative levels. Other curves are calculated, not measured; the trainers use a made-up spectrum.',
    'Diagnosing a problem follows one order: where first, then how much, then how wide.',
  ],
  tryThis: [
    'New to EQ? Take the modules in order — each one introduces only what the next needs.',
    'Start with Seeing Frequency: look below 100 Hz, then slide LOW CUT up and watch the low bars drop.',
    'When the modules are done, answer CHECK YOUR UNDERSTANDING on this menu.',
  ],
};

/** The what's-left screen (LabEndScreen, "progress" mode) — home and FINISH. */
export const EQ_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of how the EQ Lab’s ideas connect: seeing frequency content, then where, how much and how wide, then filter shapes, then diagnosing real problems.',
    start: 'Open the first module on the list and work down. To go back over one you found hard, tap REVIEW ▾ and pick it.',
  },
  seeing: [
    'WHAT’S LEFT lists the EQ Lab modules you haven’t opened yet. The CHECK row, for the lab’s questions, is last on the list. You see LAB COMPLETE once every module is opened and the check is passed.',
    'Modules you’ve opened, and the check once you pass it, fold into one ✓ DONE row; tap REVIEW ▾ to list them. CHECK YOUR UNDERSTANDING holds the same short quiz as the lab menu.',
  ],
  control: [
    'Tap a module’s row to open that module. Tapping the CHECK row keeps you here, because the check is on this screen.',
    'PRACTICE AGAIN FROM THE START opens Seeing Frequency — it never clears what you have done.',
    'DONE · BACK TO LABS goes back one screen. If you came from FINISH on the last module, that’s the lab menu; if you came from the menu, it takes you out of the lab.',
  ],
  changes: [
    'A module counts once you open it; its row moves from the list to the ✓ row. The check counts once every answer is right, and stays passed when you practice again.',
    'If your progress cannot be read, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'EQ knowledge builds in layers: first seeing frequency content, then the controls and filter shapes, then using them to diagnose problems.',
    'Find the Frequency and Match the Curve deal a fresh problem when you tap NEW SIGNAL or NEW, so a repeat tests your method — where, how much, how wide — not your memory of one answer.',
  ],
  tryThis: [
    'Open the first module on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard.',
  ],
};

export const EQ_SCREEN_GUIDES: Record<EqModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  spectrum: {
    intro: {
      learning: 'A room that seems quiet still carries low-frequency energy, and a low-cut (high-pass) filter removes the unwanted low end while keeping the useful content.',
      start: 'If the bars aren’t moving, tap MIC. Look at the bars left of the dashed line at 100 Hz, then slide LOW CUT up and watch them drop.',
    },
    seeing: [
      'Each bar is a 1/3-octave slice of your room’s sound, live from the phone mic, lows left. Height is dBFS (dB below full scale), 0 to −90.',
      'Color runs blue quiet to red loud; a light mark holds each recent peak. Gray slots can’t be resolved.',
      'LOW CUT off: a dashed amber line marks 100 Hz. On: an amber curve shows the filter.',
      'Read HPF (the LOW CUT), SLOPE 12/OCT, RES 1/3 OCT (bar width), MIC (LIVE, PAUSED or —).',
    ],
    control: [
      'Slide the LOW CUT fader from OFF through 20, 40, 60, 80, 100, 120 or 160 Hz; it snaps to those steps. It’s a high-pass filter (HPF): it lets the highs pass and cuts the lows.',
      'Tap the MIC key, or the display itself, to start or pause the microphone.',
      'Tap ⤢ FULL SCREEN to enlarge the display; the dock comes with it.',
      'Scroll below the display for the notes and a check question.',
    ],
    changes: [
      'With LOW CUT on, the low bars drop by the filter’s amount: 3 dB at the cutoff, about 12 dB one octave below, about 24 dB two octaves below. That’s SLOPE 12/OCT.',
      'The room doesn’t get quieter. The bars show what the sound would look like after the filter.',
      'A quiet room still shows energy below 100 Hz: air handling (HVAC), traffic, handling noise, vibration, wind.',
    ],
    teaches: [
      'A room that seems quiet still carries low-frequency energy.',
      'A low-cut (high-pass) filter removes rumble below its cutoff, which is why mics, consoles, preamps and channel strips have one.',
      'Remove UNWANTED low end, keep useful content — low frequencies are not bad.',
      'A phone mic is uncalibrated: its levels are relative to each other, not a measured sound level. Many phone mics also roll off the deepest bass.',
    ],
    tryThis: [
      'With LOW CUT at OFF, look left of the dashed line at 100 Hz: that energy is your room.',
      'Slide LOW CUT to 80 Hz: HPF reads 80 Hz and the bars below it sink — about 12 dB lower at 40 Hz.',
      'Tap the display: MIC reads PAUSED and the bars hold still. Tap again to go LIVE.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  whyEq: {
    intro: {
      learning: 'EQ changes the balance of frequency content: pick a region, then boost it or cut it. Cutting an unwanted region can work better than raising everything else.',
      start: 'Under PICK A REGION, tap LOW, MID or HIGH. Then drag GAIN above and below the middle and read the line under the graph: BOOST, CUT / ATTENUATION or FLAT.',
    },
    seeing: [
      'EQ RESPONSE draws one EQ band as a curve, lows on the left and highs on the right. Above the center line is a boost; below it is a cut.',
      'Top right reads the region and the gain, such as 1.00 kHz · +6.0 dB.',
      'The line under the graph names the move: BOOST, CUT / ATTENUATION or FLAT.',
      'The curve is what the band is set to do, worked out from the filter’s math. No sound plays and no microphone listens.',
    ],
    control: [
      'Under PICK A REGION, tap LOW (120 Hz), MID (1.00 kHz) or HIGH (6.00 kHz).',
      'Drag the GAIN slider from −12 to +12 dB in 0.5 dB steps. The middle is flat: no change.',
      'Tap ⤢ FULL SCREEN under the graph to enlarge it; the region keys and GAIN slider come with it.',
      'Scroll down for the check question.',
    ],
    changes: [
      'GAIN above 0 raises the region — a BOOST. Below 0 lowers it — a CUT, also called attenuation.',
      'A new region moves the same wide bell to another part of the spectrum.',
      'The curve warms toward red as the boost grows; a cut stays blue.',
      'EQ adds no new frequencies: it only changes the balance between the ones already there.',
    ],
    teaches: [
      'EQ changes the BALANCE of frequency content: pick a region, then raise or lower it.',
      'Boost and cut are both legitimate; cutting an unwanted region can work better than raising everything around it.',
      'The same move sounds different by region: a boost at LOW (120 Hz) adds weight; at HIGH (6.00 kHz) it adds brightness.',
    ],
    tryThis: [
      'At the start — MID, +6.0 dB — the line under the graph reads BOOST.',
      'Drag GAIN to −6.0 dB: the bell flips below the center line and the verdict reads CUT / ATTENUATION.',
      'Set GAIN to 0.0 dB: the curve lies flat and the verdict reads FLAT.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  camera: {
    intro: {
      learning: 'Fixed, semi-parametric and fully parametric EQ differ in the controls they give you: moving the camera is frequency, zooming it is Q, the band’s width.',
      start: 'On FIXED, tap PAN to see why it’s LOCKED. Switch EQ TYPE to SEMI-PARAMETRIC and slide PAN, then to FULLY PARAMETRIC and slide ZOOM.',
    },
    seeing: [
      'At the top is a room — window, chair, person, lamp, speaker on a stand — with a camera whose amber view points into it.',
      'Below it, the EQ curve shares the same frequency axis, so the bell sits right under what the camera sees. Its boost is fixed at +9 dB.',
      'On the frame: EQ TYPE (FIXED, SEMI or FULL), FREQ, Q, and WIDTH in octaves.',
    ],
    control: [
      'Tap the EQ TYPE key to pick FIXED, SEMI-PARAMETRIC or FULLY PARAMETRIC; the tray explains each one.',
      'Slide PAN to move the camera and the bell together, from 20 Hz to 20 kHz. It’s LOCKED on FIXED.',
      'Slide ZOOM to widen or narrow the view, from 4.00 oct (Q 0.27) to 0.25 oct (Q 5.76). It’s LOCKED unless you pick FULLY PARAMETRIC.',
      'Tap a LOCKED key to read why it is locked.',
    ],
    changes: [
      'FIXED: the camera is bolted on the lamp — the EQ works only at 2.00 kHz; Q and WIDTH read FIXED.',
      'SEMI-PARAMETRIC: PAN moves camera and bell together; the width stays the same.',
      'FULLY PARAMETRIC: ZOOM too. Zoom in, see less of the room — a narrower band, a HIGHER Q.',
      'Gain is not part of this analogy — it is the next lesson.',
    ],
    teaches: [
      'Fixed, semi-parametric and fully parametric EQ differ in the controls they give you.',
      'MOVE THE CAMERA = FREQUENCY · ZOOM THE CAMERA = Q / BANDWIDTH.',
      'Q works opposite the apparent width: higher Q, narrower band.',
      'Each step from FIXED to FULLY PARAMETRIC adds one control: first where the band sits, then how wide it is.',
    ],
    tryThis: [
      'On FIXED, tap PAN: it is LOCKED, and FREQ stays at 2.00 kHz on the lamp.',
      'Switch to SEMI and slide PAN: FREQ follows the camera, while Q stays 1.60 and WIDTH 0.89 oct.',
      'Switch to FULL and slide ZOOM to the top: WIDTH 0.25 oct, Q 5.76 — a tight view, a narrow bell.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  parametric: {
    intro: {
      learning: 'The three parametric controls: frequency sets where, gain sets how much, Q sets how wide. Q and octaves are two ways of naming one width.',
      start: 'Slide FREQ to move the bell, then GAIN to raise or lower it. Then slide Q from bottom to top and watch BW in octaves fall as Q rises.',
    },
    seeing: [
      'One EQ band drawn as a curve from 20 Hz to 20 kHz: boost above the center line, cut below. A marker shows where FREQ sits.',
      'Read FREQ, GAIN, Q and BW on the frame. Q and BW show the same width twice: as a Q number and in octaves.',
      'The curve’s color follows GAIN: warmer for more boost, blue for a cut.',
    ],
    control: [
      'Slide FREQ to place the band anywhere from 20 Hz to 20 kHz.',
      'Slide GAIN from −18 to +18 dB in 0.5 dB steps. Double-tap its lane to return to 0 dB.',
      'Slide Q from 0.3 (wide) to 12 (narrow). Its lane shows Q and octaves together: Q 2.00 · 0.71 oct at the start.',
      'Scroll down for the three roles in words and a check question.',
    ],
    changes: [
      'FREQ moves the whole bell left or right — WHERE.',
      'GAIN raises or lowers it — HOW MUCH. At 0 dB the curve is flat whatever FREQ and Q say.',
      'Q sets the width — HOW WIDE. A bigger Q number is a narrower band, so BW in octaves falls as Q rises.',
    ],
    teaches: [
      'The three parametric controls: frequency = where, gain = how much, Q = how wide.',
      'Q and bandwidth in octaves describe the same width in two vocabularies.',
      'Q = center frequency ÷ bandwidth, so one Q setting covers the same number of octaves wherever FREQ sits.',
    ],
    tryThis: [
      'Slide Q to the bottom: Q 0.30, BW 3.70 oct — a broad bell across much of the spectrum.',
      'Slide Q to the top: Q 12.00, BW 0.12 oct — a thin spike at FREQ.',
      'Double-tap the GAIN lane: GAIN reads +0.0 dB and the curve lies flat.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  qband: {
    intro: {
      learning: 'HIGH Q = NARROW · LOW Q = WIDE. Q = center frequency ÷ bandwidth, so a bigger Q number covers a smaller range of frequencies.',
      start: 'Slide the Q fader down until the bell lies on the wide Q 0.5 ghost, then up until it lies on the narrow Q 8 ghost. Watch BW in octaves as you go.',
    },
    seeing: [
      'You’re looking at a +9 dB boost at 1 kHz, with two dashed ghosts to compare against: Q 0.5 (wide) and Q 8 (narrow).',
      'Q and BW change as you move. FREQ (1.00 kHz) and GAIN (+9.0 dB) are grayed: frozen, so width is the only thing that moves.',
      'The banner below: HIGH Q = NARROW · LOW Q = WIDE.',
    ],
    control: [
      'You have one control: slide the Q fader from 0.3 to 12. Its lane reads Q and bandwidth in octaves together, Q 2.00 · 0.71 oct at the start.',
      'Frequency and gain cannot move here, so width is the only thing that changes.',
      'Scroll down for the notes and a check question.',
    ],
    changes: [
      'Q up: the bell narrows toward the Q 8 ghost. Q down: it widens past the Q 0.5 ghost. The peak stays +9 dB at 1 kHz.',
      'Q = center frequency ÷ bandwidth (in Hz), so a bigger Q number means a SMALLER region.',
      'Low Q gives a broad, musical rise; high Q a narrow spike that targets one tone.',
    ],
    teaches: [
      'HIGH Q = NARROW · LOW Q = WIDE — the part that trips almost everyone once.',
      'Q and bandwidth in octaves are two names for one width.',
      'Wide bells suit gentle tone shaping; narrow ones suit a single problem tone, such as a ring or resonance.',
    ],
    tryThis: [
      'Slide Q until it reads about 0.50: BW reads about 2.5 oct and the curve lies on the wide ghost.',
      'Slide Q up to about 8: BW falls to about 0.18 oct and the curve lies on the narrow ghost.',
      'Watch the top of the bell: at any Q it stays +9 dB at 1 kHz — only the width moves.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  shapes: {
    intro: {
      learning: 'The EQ filter family — bell, low and high shelf, high-pass, low-pass and notch — and the job each one does to the sound.',
      start: 'Tap SHAPE and pick LOW SHELF, then raise GAIN. Then pick HIGH-PASS / LOW-CUT and watch GAIN and Q turn to — while the lows fall away.',
    },
    seeing: [
      'One filter drawn as a curve from 20 Hz to 20 kHz, boost above the center line, cut below. Watch its outline change with each shape.',
      'SHAPE, FREQ, GAIN and Q sit on the frame. A dash (—) tells you that control doesn’t exist on this shape.',
      'On HPF and LPF, the line under the display gives the filter’s slope: 12 dB/octave.',
    ],
    control: [
      'Tap SHAPE to pick BELL / PEAK, LOW SHELF, HIGH SHELF, HIGH-PASS / LOW-CUT, LOW-PASS / HIGH-CUT or NOTCH. Each comes with a one-line description.',
      'The frequency fader is named for the shape: FREQ on the bell and shelves, CUTOFF on pass filters, NOTCH on the notch.',
      'Use GAIN (−18 to +18 dB) on the bell and shelves only, and Q on the bell (0.3–12) and the notch (1–12) only.',
    ],
    changes: [
      'BELL raises or lowers a region around its center. A SHELF moves everything below (LOW) or above (HIGH) its corner, set by FREQ, by one amount.',
      'HIGH-PASS keeps the highs and removes the lows; LOW-PASS is its mirror. They have no gain — they only remove.',
      'NOTCH cuts a deep, narrow hole at one frequency and leaves the rest alone.',
    ],
    teaches: [
      'The EQ family — bell, two shelves, two pass filters, notch — and the job of each.',
      'High-pass and low-cut are one filter, named by what it passes or by what it removes.',
      'A shelf suits a broad move on all the bass or all the treble; a bell shapes one region; a notch removes one tone.',
    ],
    tryThis: [
      'Pick LOW SHELF with GAIN at +6.0 dB: everything well below FREQ rises by 6 dB — a shelf, not a bump.',
      'Pick HIGH-PASS / LOW-CUT: GAIN and Q read —, the fader becomes CUTOFF, and the lows fall away.',
      'Pick NOTCH and slide Q from 1.0 up to 12.0: the wide dip shrinks to a thin cut at one frequency.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  slopes: {
    intro: {
      learning: 'Slope is a rate: how fast a filter’s cut grows beyond its cutoff, in dB per octave. Steeper slopes cut harder but shift phase more.',
      start: 'At 12 dB/OCT, read @40 Hz and @20 Hz. Then slide SLOPE up to 48 dB/OCT and down to 6 dB/OCT, and compare the two numbers each time.',
    },
    seeing: [
      'One high-pass (low-cut) filter at 80 Hz, drawn at six slopes: your chosen one bright, the other five as dashed ghosts.',
      'Below 80 Hz the curves fall away; above it they stay near 0 dB. The line under the display names the filter’s order: its number of poles.',
      'On the frame: SLOPE, CUTOFF 80 Hz, and how much is cut @40 Hz (an octave below) and @20 Hz (two octaves below).',
    ],
    control: [
      'Slide SLOPE to step through 6, 12, 18, 24, 36 and 48 dB/OCT.',
      'Tap the SLOPE key for the exact values, each with what it is used for; the tray stays open so you can compare.',
      'The cutoff never moves here — only the steepness changes.',
    ],
    changes: [
      'Each extra 6 dB/OCT adds one pole (one filter order): the skirt, the falling part below 80 Hz, gets steeper.',
      'The −3 dB point stays at 80 Hz at every slope; only how fast the cut grows past it changes. Crossovers (splitting sound between drivers) often sit at −6 dB there.',
      'Steeper slopes carve harder but shift phase more near the corner. Gentle slopes are common on channel low-cuts, steep ones in crossovers.',
    ],
    teaches: [
      'Slope is a RATE: how fast the cut grows beyond the cutoff, in dB per octave.',
      'Slope is not width: a pass filter’s Q shapes its corner, not its rate per octave.',
      'One cutoff can sound very different: at 40 Hz, 6 dB/OCT cuts about 7 dB, but 48 dB/OCT about 48 dB.',
    ],
    tryThis: [
      'At 12 dB/OCT: @40 Hz reads −12.3 dB and @20 Hz −24.1 dB — about 12 dB more per octave.',
      'Slide SLOPE to 48 dB/OCT: @40 Hz reads −48.2 dB and @20 Hz −96.3 dB.',
      'Slide SLOPE to 6 dB/OCT: @40 Hz reads −7.0 dB and @20 Hz −12.3 dB — the gentlest tilt.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  gvp: {
    intro: {
      learning: 'A graphic EQ fixes each band’s frequency and width and moves only gain; a parametric EQ also moves frequency and Q. Both are professional tools.',
      start: 'On the 1-OCTAVE board, push the 1k fader to the top and watch the curve. Then switch BOARD to 1/3-OCTAVE and push one fader to compare the width.',
    },
    seeing: [
      'A graphic EQ board: one vertical fader for each fixed band, with the board’s actual response curve drawn above it.',
      'The line under the display reminds you: the curve is the ACTUAL combined response of the board’s fixed-width bells, not a copy of the faders.',
      'On the frame: BOARD, RANGE ±12 dB, and BAND and LEVEL for the fader under your finger.',
    ],
    control: [
      'Drag a fader up or down: −12 to +12 dB in 0.5 dB steps.',
      'Tap BOARD to switch between 1-OCTAVE · 10 BANDS (31 Hz to 16k) and 1/3-OCTAVE · 31 BANDS (20 Hz to 20k). Swipe the 1/3-octave board sideways to reach every fader.',
      'RESET returns the board you are on to 0 dB. Each board keeps its own settings when you switch.',
    ],
    changes: [
      'A fader changes only its band’s gain; the band’s frequency and width are fixed.',
      'The 1-octave bands are wide (Q about 1.4); the 1/3-octave bands are narrower (Q about 4.3) for finer detail.',
      'Neighboring bands overlap, so the curve is their sum, not a copy of the fader caps.',
    ],
    teaches: [
      'Graphic EQ: fixed frequencies, fixed width, adjustable gain — fast, repeatable control.',
      'Parametric EQ: adjustable frequency, gain and Q — far more precision. Both are professional tools.',
      'Fixed bands are quick to reach, so live engineers often use graphic EQs on PA and monitor systems; a parametric targets one exact problem.',
    ],
    tryThis: [
      'On the 1-octave board, push the 1k fader to the top: while your finger is on it, BAND reads 1.00 kHz and LEVEL +12.0 dB. The bump is still about +2.5 dB at 500 Hz and 2k.',
      'Switch BOARD to 1/3-OCTAVE and push one fader: a much narrower bump than on the 1-octave board.',
      'Tap RESET: every fader on this board returns to 0 dB and the curve lies flat.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  multiband: {
    intro: {
      learning: 'Real EQs run several filters at once, and they interact: overlapping boosts add, a cut inside a boost partly cancels it, and the combined curve is what the signal gets.',
      start: 'Drag the LMF node up to +6 dB and watch its thin curve and the bold COMBINED curve. Then drag the HMF node next to it, also to +6 dB.',
    },
    seeing: [
      'A six-band EQ: HPF, LOW, LMF, HMF, HIGH and LPF. Each band that’s on is a colored dot (node); the selected one is larger.',
      'Each thin colored curve is one band on its own; a bell at 0 dB draws none. The bold COMBINED curve is all bands together, and its color warms with the biggest boost.',
      'On the frame: BAND, FREQ, GAIN (— on HPF/LPF), and EQ: how many bands are ACTIVE, or BYPASS.',
    ],
    control: [
      'Drag on the graph to grab the nearest node: sideways sets frequency, up and down sets gain (bells only).',
      'Use the FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) faders to edit the selected band. HPF and LPF have FREQ only, and an OFF band’s faders are LOCKED.',
      'Tap BAND to select a band (HPF and LPF switch on when you tap them). The same key holds BAND ON / BAND OFF and RESET.',
      'Tap BYP to bypass the whole EQ for a quick before-and-after check. HEAR IT, when shown, plays PINK NOISE or SWEEP through the EQ.',
    ],
    changes: [
      'Overlapping boosts add: the combined curve rises higher than either band alone.',
      'A cut inside a boost’s skirt partly cancels it.',
      'HPF and LPF here are fixed 12 dB/octave filters that remove the extreme lows or highs.',
      'BYP flattens the output; a dim line still shows the combined curve you’d get.',
    ],
    teaches: [
      'Real EQs run several filters at once, and the filters interact.',
      'The combined curve — not any single band — is what the signal gets.',
      'Two modest boosts close together can add up to more than you meant, so judge the combined curve, not each band.',
    ],
    tryThis: [
      'At the start EQ reads 4 ACTIVE and only the flat bold curve shows. Drag the LMF node up to +6 dB: its own thin curve appears and the bold one rises with it.',
      'Drag the HMF node next to it, also at +6 dB: where they overlap the combined curve climbs toward +12 dB.',
      'Tap BYP: EQ reads BYPASS, the output line lies flat and the combined curve stays as a dim line.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  graphic: {
    intro: {
      learning: 'THE SLIDERS ARE NOT THE RESPONSE: a graphic EQ’s overlapping bands add up to a curve that differs from the fader caps, and every boost also shifts phase.',
      start: 'Tap EXAMPLE and compare the dim line joining the caps with the bold ACTUAL curve. Then turn FILTERS on to see the three bells that add up to it.',
    },
    seeing: [
      'A 10-band graphic EQ (31 Hz to 16k) with two curves: a dim line joining the fader caps — what the eye imagines — and the bold ACTUAL response.',
      'THE SLIDERS ARE NOT THE RESPONSE: watch the gap between those two lines.',
      'On the frame: VIEW (MAG or PHASE ±180°), FILTERS (SHOWN or HIDDEN), and BAND and LEVEL for the fader under your finger.',
    ],
    control: [
      'Drag a fader: −12 to +12 dB in 0.5 dB steps.',
      'Tap VIEW to switch between MAGNITUDE (how much each frequency is boosted or cut) and PHASE (how far each one is shifted in phase).',
      'Tap FILTERS to show every band’s own bell under the combined curve, each in its own color.',
      'EXAMPLE sets 125 Hz +3, 250 Hz +6 and 500 Hz +3 dB. CLEAR returns every fader to 0 dB.',
    ],
    changes: [
      'Each band is a real bell with width, so neighbors overlap and their dB add: the actual curve can rise above the highest cap.',
      'In PHASE view a boost pushes phase ahead on one side of its band and behind on the other, shifting those frequencies in time. The dim 0° line is what the sliders imply.',
      'A conventional (minimum-phase) EQ never changes only the level: where it changes level, it shifts phase too.',
    ],
    teaches: [
      'An EQ slider is a control setting, not a drawing of the result.',
      'Overlapping filters combine, and every boost or cut also shifts phase.',
      'Phase shift is a normal part of how EQ works, not a fault; for gentle boosts like EXAMPLE it stays small, about ±24°.',
    ],
    tryThis: [
      'Tap EXAMPLE: the caps top out at +6 dB at 250 Hz, but the actual curve peaks at about +7.1 dB.',
      'Turn FILTERS on: three colored bells appear, and the combined curve is their sum.',
      'With EXAMPLE set, switch VIEW to PHASE: a small but real swing, about ±24° on a ±180° scale, around the 0° line near those bands.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  liveEq: {
    intro: {
      learning: 'How an EQ curve lines up with real frequency content: a low cut, its slope and a parametric band, drawn over your room’s live spectrum.',
      start: 'Tap LOW CUT and pick 80 Hz: the low bars drop under the amber curve. Then touch GAIN and ride FREQ to see which bars your band sits over.',
    },
    seeing: [
      'Your room’s live 1/3-octave spectrum from the phone microphone, with your EQ drawn over it as an amber curve once you touch a band fader or pick a LOW CUT.',
      'Bars: dB below full scale (0 to −90), blue quiet to red loud, with peak marks. Gray slots can’t be resolved.',
      'With no EQ set, the line under the display reads dBFS · UNCALIBRATED APPROXIMATE.',
      'Watch VIEW, LOW CUT, BAND (its frequency, or OFF) and MIC.',
    ],
    control: [
      'FREQ, GAIN (−8 to +8 dB) and Q (0.3–12) shape one parametric bell. Touch any of them and the band switches on.',
      'Tap LOW CUT to pick OFF, 40, 80 or 120 Hz, and a SLOPE of 12, 24 or 48 dB/OCT.',
      'Tap VIEW for SPECTRUM ONLY, EQ ONLY or COMBINED. The same tray holds BAND ON / BAND OFF for the band, and MIC LIVE — PAUSE or MIC PAUSED — RESUME for the microphone.',
      'Tapping the display also pauses or resumes the microphone.',
    ],
    changes: [
      'COMBINED: the bars are redrawn as if your room’s sound had passed through the EQ. Nothing in the room changes.',
      'SPECTRUM ONLY hides the curve; EQ ONLY hides the bars. Moving a band fader in SPECTRUM ONLY returns to COMBINED.',
      'Point the phone around: the bars change, the curve does not — it is your plan, not a measurement.',
    ],
    teaches: [
      'An EQ curve is a plan; laying it over the real spectrum shows which content it will actually touch.',
      'A low cut clears rumble below its cutoff while a parametric bell shapes one region, both on the same sound.',
      'The phone mic is uncalibrated: its levels are relative, not a measured sound level.',
      'One EQ setting treats different sound differently: what it changes depends on what’s there.',
    ],
    tryThis: [
      'Open LOW CUT and pick 80 Hz: LOW CUT reads 80Hz·12 and the low bars drop under the amber curve.',
      'Keep 80 Hz and pick SLOPE 48 dB/OCT: the curve falls far more steeply below 80 Hz.',
      'Set GAIN to +8.0 dB and Q high, then ride FREQ: BAND follows it, and the amber bump shows which bars it sits over.',
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  findFreq: {
    intro: {
      learning: 'Finding a problem on a spectrum: where first (frequency), then how much (gain), then how wide (Q). A boost needs a cut; a hole needs a boost.',
      start: 'On LEVEL 1, find where the bold SIGNAL pokes above the dim REFERENCE. Slide FREQ under it, pull GAIN down, then tap CHECK.',
    },
    seeing: [
      'A made-up spectrum, not a recording: the dim REFERENCE is healthy; the bold SIGNAL has a hidden problem added.',
      'Your band is marked on the graph. The signal warms toward red while it still pokes above the reference.',
      'On the frame: LVL, BAND (on level 5) and RESULT (—, PASS or MISS). Read the brief, and later your result, below.',
    ],
    control: [
      'FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) set your correction band. Double-tap the GAIN lane for 0 dB.',
      'Tap LEVEL to pick LEVEL 1 to LEVEL 5; NEW SIGNAL in the same tray deals a fresh problem at this level.',
      'Tap CHECK to have your move judged. On level 5 a BAND key switches between your two bands.',
      'HEAR IT, when shown below, plays the problem plus your fix through PINK NOISE or SWEEP.',
    ],
    changes: [
      'Your band adds to the signal: cut a boost, fill a hole, and the bold curve settles back onto the reference.',
      'CHECK passes within a third of an octave of the problem, with your gain canceling it to within 3 dB.',
      'The result reads Target, Your selection and Difference, and says what is still wrong. Moving a fader clears it.',
    ],
    teaches: [
      'A method: WHERE first (frequency), then HOW MUCH (gain), then HOW WIDE (Q).',
      'Problems come in kinds — a boost, a cut, a narrow resonance, a tilted balance, or two at once — and each needs its own move.',
      'Fixing a boost needs a cut; fixing a hole needs a boost.',
      'A narrow resonance needs a high Q: a wide cut there also takes away the healthy frequencies beside it.',
    ],
    tryThis: [
      'On LEVEL 1, slide FREQ until your band sits under the bump, pull GAIN down to about −9 dB, then tap CHECK.',
      'After a PASS, tap NEXT LEVEL › under the result to move up a level.',
      'On LEVEL 3 the problem is narrow: raise Q as well, or your cut takes the neighboring frequencies with it.',
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  matchCurve: {
    intro: {
      learning: 'Reading a curve by eye as frequency, gain and Q: where its peak or dip sits, how high or deep it goes, and how wide it spreads.',
      start: 'Tap SCORE before you move anything: MATCH reads 0%. Then line FREQ up under the gray TARGET’s peak or dip, set GAIN, then Q, and tap SCORE again.',
    },
    seeing: [
      'The thin gray TARGET curve is made from one or two hidden bells. Your EQ is the bold line; its color follows its gain.',
      'Your band’s frequency is marked on the graph.',
      'On the frame: MATCH (HIDDEN until you ask), BANDS (how many bells the target uses) and BAND (on two-band targets).',
    ],
    control: [
      'FREQ, GAIN (−15 to +15 dB) and Q (0.3–12) faders shape your band. Double-tap the GAIN lane for 0 dB.',
      'Tap SCORE to show the MATCH score and HIDE to hide it again. Tap NEW for a new target.',
      'You get as many bands as the target uses; two-band targets add a BAND key to switch between them.',
    ],
    changes: [
      'MATCH compares your curve with the target across the spectrum: a flat EQ scores 0%, half the error gone 50%, a perfect match 100%.',
      '90% or more reads EXCELLENT, 75% or more CLOSE; below that, KEEP TRYING.',
      'The score follows every move but stays hidden until you tap SCORE — judge by eye first.',
    ],
    teaches: [
      'Reading a curve as frequency, gain and Q — no hearing needed.',
      'An order of work: WHERE, then HOW MUCH, then HOW WIDE.',
      'Two bells close together blend into one shape, so a two-band target can look like a single odd-shaped bump.',
    ],
    tryThis: [
      'Tap SCORE before moving anything: MATCH reads 0% — a flat EQ matches nothing.',
      'Line FREQ up under the target’s peak or dip, then set GAIN, then Q, and tap SCORE again.',
      'Reach 90% for EXCELLENT, then tap NEW for another target.',
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  fixSignal: {
    intro: {
      learning: 'Everyday complaints — boomy, harsh, rumble, honky, sibilant — point to frequency regions. Real problems don’t announce their frequency: read the complaint, look, then decide.',
      start: 'Tap SCEN and pick BOOMY KICK. Read the complaint, find where the bold SIGNAL bulges above the dim REFERENCE, then set FREQ, GAIN and Q and tap CHECK.',
    },
    seeing: [
      'A made-up spectrum again, not a recording: the dim REFERENCE, and the bold SIGNAL carrying the problem from a real-world story.',
      'Below the display you read the CASE name and the complaint, but no frequency until you tap CHECK.',
      'On the frame: CASE, SCEN (which scenario) and RESULT (—, FIXED or NOT YET).',
    ],
    control: [
      'FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) shape your one correction band.',
      'Tap SCEN to pick BOOMY KICK, HARSH VOCAL, STAGE RUMBLE, HONKY GUITAR or SIBILANT VOCAL, each with its story.',
      'Tap CHECK to have your fix judged. HEAR IT, when shown below, plays the problem plus your fix.',
    ],
    changes: [
      'Cut where the signal bulges above the reference and it settles back onto it.',
      'CHECK passes within a third of an octave of the problem, with your cut canceling it to within 3 dB.',
      'The result names where the problem was and why that region sounds that way. Moving a fader clears it.',
    ],
    teaches: [
      'Everyday complaints — boomy, harsh, rumble, honky, sibilant — point to frequency regions.',
      'Real problems don’t announce their frequency: read the complaint, look, then decide.',
      'Each of these complaints is too much of one region, so the fix is a cut where the signal bulges, not a boost everywhere else.',
    ],
    tryThis: [
      'Read the complaint, then find where the bold SIGNAL bulges above the dim REFERENCE — before you touch a fader.',
      'BOOMY KICK: put FREQ under that bulge, cut by about the same amount, then tap CHECK: RESULT reads FIXED.',
      'Pick STAGE RUMBLE: the bulge sits very low — the classic low-cut situation.',
    ],
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  challenges: {
    intro: {
      learning: 'Cutting a problem and boosting around it can both improve the balance, but boosting raises the overall level and uses up headroom into the next stage.',
      start: 'Tap PROBLEM ONLY to see the extra 250 Hz. Then tap CUT THE PROBLEM and BOOST AROUND IT in turn, and read the overall shift top right each time.',
    },
    seeing: [
      'A made-up spectrum with too much 250 Hz: the dim line is the healthy reference, the bold line the signal.',
      'The panel title names what you’re looking at: THE PROBLEM, STRATEGY: CUT or STRATEGY: BOOST AROUND. Top right reads 250 Hz +6 dB, or the overall shift.',
      'Below: two columns comparing the strategies, CUT −6 @ 250 Hz and BOOST +6 AROUND IT.',
    ],
    control: [
      'Tap PROBLEM ONLY to see the signal as it is.',
      'Tap CUT THE PROBLEM (−6 @ 250) for one −6 dB bell at 250 Hz.',
      'Tap BOOST AROUND IT (+6) for +6 dB bells at 63 Hz and 2.5 kHz instead.',
      '⤢ FULL SCREEN enlarges the graph with the same keys. HEAR IT, when shown, lets you compare by ear.',
    ],
    changes: [
      'The cut lands exactly on the problem: the signal sits back on the reference and the average level drops a little.',
      'The boost lifts both sides of the problem, so the balance improves — but the whole signal gets louder.',
      'The overall shift is the EQ’s average change across the spectrum.',
    ],
    teaches: [
      'EQ is about balance: cutting the unwanted region and boosting around it can both improve it.',
      'Boosting raises the overall level, which uses up headroom — the space left before the next stage clips.',
      'Louder often sounds “better” at first, so compare a boost and a cut at matched level before you judge.',
    ],
    tryThis: [
      'Tap CUT THE PROBLEM: the readout shows overall shift ≈ −1.0 dB.',
      'Tap BOOST AROUND IT: overall shift ≈ +2.9 dB — the whole signal got louder.',
      'Compare the two: the cut puts the signal back on the reference; the boost lifts everything around the bump.',
    ],
  },
};
