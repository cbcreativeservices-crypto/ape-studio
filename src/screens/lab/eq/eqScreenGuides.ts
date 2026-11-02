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
  seeing: [
    'The EQ Lab menu: seeing, shaping and diagnosing frequency content, one idea at a time.',
    'The top row is the path: SEE › MANIPULATE › HEAR › IDENTIFY › CORRECT.',
    'Numbered modules in four groups: LEARN, EXPLORE, TRAIN and CHALLENGE.',
    'Below them: CHECK YOUR UNDERSTANDING (this lab’s questions), SEE WHAT’S LEFT and RELATED TOOLS.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Inside most modules: the display on top, readouts on its frame, controls in the dock at the bottom, notes and a check to scroll below. ⓘ beside a module’s title explains that screen.',
    'CHECK YOUR UNDERSTANDING: answer every question correctly to complete the lab; a wrong answer can be tried again straight away.',
    'RELATED TOOLS: SPECTRUM ANALYZER / RTA, EQUALIZER EFFECT LAB (the audible one-band lab) and Q & BANDWIDTH CALC.',
    'SEE WHAT’S LEFT lists the modules you have not opened; ‹ leaves the lab.',
  ],
  changes: [
    'Modules 1–3: what frequency content looks like, what EQ is for, and the three kinds of EQ.',
    'Modules 4–8: frequency, gain and Q; the filter shapes; slopes; graphic against parametric.',
    'Modules 9–11: many bands at once, what a graphic EQ really does, and your room with an EQ drawn over it.',
    'Modules 12–15: find the frequency, match the curve, fix the signal — then boost against cut.',
  ],
  teaches: [
    'EQ changes the balance of frequency content: where (frequency), how much (gain), how wide (Q).',
    'Which filter shape suits which job, and why overlapping filters combine.',
    'Modules 1 and 11 read your phone’s uncalibrated microphone — relative, for learning. The curves are designed responses; the trainers use a synthetic spectrum.',
    'Builds on Visual Audio Analysis and the one-band Equalizer; try Dynamics next.',
  ],
  tryThis: [
    'New to EQ? Take the modules in order — each one introduces only what the next needs.',
    'Start with Seeing Frequency: look below 100 Hz, then slide LOW CUT up and watch the low bars drop.',
    'When the modules are done, answer CHECK YOUR UNDERSTANDING on this menu.',
  ],
};

/** The what's-left screen (LabEndScreen, "progress" mode) — home and FINISH. */
export const EQ_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the EQ Lab modules you have not opened yet, then the check — its CHECK row is the last on the list. LAB COMPLETE once every module is opened and the check is passed.',
    'Opened modules, and the check once passed, fold into one ✓ DONE row; REVIEW ▾ lists them. CHECK YOUR UNDERSTANDING holds the lab’s short quiz, as on the lab menu.',
  ],
  control: [
    'Tap a module’s row to open it; the CHECK row stays here, as the check is on this screen.',
    'PRACTICE AGAIN FROM THE START opens Seeing Frequency — it never clears what you have done.',
    'DONE · BACK TO LABS goes back one screen: to the lab menu after FINISH on the last module, out of the lab from the menu.',
  ],
  changes: [
    'A module counts once you open it; its row moves from the list to the ✓ row. The check counts once every answer is right, and stays passed when you practice again.',
    'If your progress cannot be read, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'Which parts of EQ — seeing, the controls, the shapes, the trainers — are still to explore.',
    'Every module can be redone for practice at any time.',
  ],
  tryThis: [
    'Open the first module on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard.',
  ],
};

export const EQ_SCREEN_GUIDES: Record<EqModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  spectrum: {
    seeing: [
      'Your room’s live sound from the phone mic in 1/3-octave bars: lows left, highs right; height in dB below full scale, 0 to −90.',
      'Colour shows level, blue quiet to red loud; a light tick holds each bar’s recent peak. Gray slots can’t be resolved.',
      'LOW CUT off: a dashed amber line marks 100 Hz. On: an amber curve shows the filter.',
      'Readouts: HPF (the LOW CUT), SLOPE 12/OCT, RES 1/3 OCT, MIC (LIVE, PAUSED or —).',
    ],
    control: [
      'LOW CUT fader: OFF, then 20, 40, 60, 80, 100, 120 or 160 Hz — it snaps to those steps. It is a high-pass filter (HPF): it lets the highs pass and cuts the lows.',
      'MIC key: start or pause the microphone. Tapping the display does the same.',
      '⤢ FULL SCREEN enlarges the display, with the dock inside it.',
      'Scroll below the display for the notes and a check question.',
    ],
    changes: [
      'LOW CUT on: bars below the cutoff drop by the filter’s amount — 3 dB at the cutoff, about 12 dB an octave below (12 dB per octave).',
      'Nothing in the room changes: the bars are redrawn as if the sound had passed the filter.',
      'A quiet room still shows energy below 100 Hz: air handling (HVAC), traffic, handling noise, vibration, wind.',
    ],
    teaches: [
      'A room that seems quiet still carries low-frequency energy.',
      'What a low-cut (high-pass) filter removes, and why mics, consoles, preamps and channel strips have one.',
      'Remove UNWANTED low end, keep useful content — low frequencies are not bad.',
      'The phone mic is uncalibrated: relative, for learning. Why We Use EQ comes next.',
    ],
    tryThis: [
      'With LOW CUT at OFF, look left of the dashed line at 100 Hz: that energy is your room.',
      'Slide LOW CUT to 80 Hz: HPF reads 80 Hz and the bars below it sink — about 12 dB lower at 40 Hz.',
      'Tap the display: MIC reads PAUSED and the bars hold still. Tap again to go LIVE.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  whyEq: {
    seeing: [
      'EQ RESPONSE: one EQ band as a curve — lows left, highs right; above the centre line is boost, below is cut.',
      'Top right reads the region and the gain, such as 1.00 kHz · +6.0 dB.',
      'The line under the graph names the move: BOOST, CUT / ATTENUATION or FLAT.',
      'A designed response, worked out from the filter’s maths — no sound or microphone is used.',
    ],
    control: [
      'PICK A REGION: LOW (120 Hz), MID (1.00 kHz) or HIGH (6.00 kHz).',
      'GAIN slider: −12 to +12 dB in 0.5 dB steps; the middle is flat.',
      '⤢ FULL SCREEN under the graph enlarges it, with the same region keys and GAIN slider.',
      'Scroll down for the check question.',
    ],
    changes: [
      'GAIN above 0 raises the region — a BOOST. Below 0 lowers it — a CUT, also called attenuation.',
      'A new region moves the same wide bell to another part of the spectrum.',
      'The curve warms toward red as the boost grows; a cut stays blue.',
      'Only the balance between regions changes.',
    ],
    teaches: [
      'EQ changes the BALANCE of frequency content: pick a region, then raise or lower it.',
      'Boost and cut are both legitimate; cutting an unwanted region can work better than raising everything around it.',
      'Follows Seeing Frequency; The Camera Analogy comes next.',
    ],
    tryThis: [
      'At the start — MID, +6.0 dB — the line under the graph reads BOOST.',
      'Drag GAIN to −6.0 dB: the bell flips below the centre line and the verdict reads CUT / ATTENUATION.',
      'Set GAIN to 0.0 dB: the curve lies flat and the verdict reads FLAT.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  camera: {
    seeing: [
      'Top: a room — window, chair, person, lamp, speaker on a stand — and a camera whose amber view points into it.',
      'Below: the EQ curve on the same frequency axis, so the bell sits under what the camera sees. Its boost is fixed at +9 dB.',
      'Readouts: EQ TYPE (FIXED, SEMI or FULL), FREQ, Q and WIDTH (in octaves).',
    ],
    control: [
      'EQ TYPE key: FIXED, SEMI-PARAMETRIC or FULLY PARAMETRIC — the tray explains each.',
      'PAN fader: moves the camera and the bell, 20 Hz to 20 kHz. LOCKED on FIXED.',
      'ZOOM fader: widens or narrows the view, from 4.00 oct (Q about 0.27; the readout rounds it to 0.3) to 0.25 oct (Q 5.8). LOCKED unless FULLY PARAMETRIC.',
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
      'Follows Why We Use EQ; Parametric Controls adds gain next.',
    ],
    tryThis: [
      'On FIXED, tap PAN: it is LOCKED, and FREQ stays at 2.00 kHz on the lamp.',
      'Switch to SEMI and slide PAN: FREQ follows the camera, while Q stays 1.6 and WIDTH 0.89 oct.',
      'Switch to FULL and slide ZOOM to the top: WIDTH 0.25 oct, Q 5.8 — a tight view, a narrow bell.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  parametric: {
    seeing: [
      'One EQ band as a curve, 20 Hz to 20 kHz: boost above the centre line, cut below; a marker shows FREQ.',
      'Readouts: FREQ, GAIN, Q and BW — the width as a Q number and in octaves, side by side.',
      'The curve’s colour follows GAIN: warmer for more boost, blue for a cut.',
    ],
    control: [
      'FREQ fader: where the band sits, 20 Hz to 20 kHz.',
      'GAIN fader: −18 to +18 dB in 0.5 dB steps. Double-tap its lane to return to 0 dB.',
      'Q fader: 0.3 (wide) to 12 (narrow). Its lane shows Q and octaves together — Q 2.00 · 0.71 oct at the start.',
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
      'Builds on The Camera Analogy (pan = frequency, zoom = Q); Q & Bandwidth looks closer at width next.',
    ],
    tryThis: [
      'Slide Q to the bottom: Q 0.30, BW 3.70 oct — a broad bell across much of the spectrum.',
      'Slide Q to the top: Q 12.00, BW 0.12 oct — a thin spike at FREQ.',
      'Double-tap the GAIN lane: GAIN reads +0.0 dB and the curve lies flat.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  qband: {
    seeing: [
      'A +9 dB boost at 1 kHz as a curve, with two dashed ghosts to compare: Q 0.5 (wide) and Q 8 (narrow).',
      'Readouts: Q and BW change; FREQ (1.00 kHz) and GAIN (+9.0 dB) are grayed — frozen on purpose.',
      'The banner below: HIGH Q = NARROW · LOW Q = WIDE.',
    ],
    control: [
      'One control: the Q fader, 0.3 to 12. Its lane reads Q and bandwidth in octaves together — Q 2.00 · 0.71 oct at the start.',
      'Frequency and gain cannot move here, so width is the only thing that changes.',
      'Scroll down for the notes and a check question.',
    ],
    changes: [
      'Q up: the bell narrows toward the Q 8 ghost. Q down: it widens past the Q 0.5 ghost. The peak stays +9 dB at 1 kHz.',
      'Q = center frequency ÷ bandwidth, so a bigger Q number means a SMALLER region.',
      'Low Q reads as a broad, musical rise; high Q as a surgical spike.',
    ],
    teaches: [
      'HIGH Q = NARROW · LOW Q = WIDE — the part that trips almost everyone once.',
      'Q and bandwidth in octaves are two names for one width.',
      'Follows Parametric Controls; Filter Shapes comes next.',
    ],
    tryThis: [
      'Slide Q until it reads about 0.50: BW reads about 2.5 oct and the curve lies on the wide ghost.',
      'Slide Q up to about 8: BW falls to about 0.18 oct and the curve lies on the narrow ghost.',
      'Watch the top of the bell: at any Q it stays +9 dB at 1 kHz — only the width moves.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  shapes: {
    seeing: [
      'One filter as a curve, 20 Hz to 20 kHz: above the centre line is boost, below is cut.',
      'Readouts: SHAPE, FREQ, GAIN and Q. A dash (—) means that control does not exist on this shape.',
      'On HPF and LPF the line under the display says the curve is drawn at 12 dB/octave.',
    ],
    control: [
      'SHAPE key: BELL / PEAK, LOW SHELF, HIGH SHELF, HIGH-PASS / LOW-CUT, LOW-PASS / HIGH-CUT or NOTCH — each with a one-line description.',
      'The frequency fader is named for the shape: FREQ on the bell and shelves, CUTOFF on pass filters, NOTCH on the notch.',
      'GAIN fader (−18 to +18 dB) on the bell and shelves only. Q fader on the bell (0.3–12) and the notch (1–12) only.',
    ],
    changes: [
      'BELL raises or lowers a region around its centre. A SHELF moves everything below (LOW) or above (HIGH) its corner by one amount.',
      'HIGH-PASS keeps the highs and removes the lows; LOW-PASS is its mirror. They have no gain — they only remove.',
      'NOTCH cuts a deep, narrow hole at one frequency and leaves the rest alone.',
    ],
    teaches: [
      'The EQ family — bell, two shelves, two pass filters, notch — and the job of each.',
      'High-pass and low-cut are one filter, named by what it passes or by what it removes.',
      'Follows Q & Bandwidth; Filter Slopes comes next.',
    ],
    tryThis: [
      'Pick LOW SHELF with GAIN at +6.0 dB: everything well below FREQ rises by 6 dB — a shelf, not a bump.',
      'Pick HIGH-PASS / LOW-CUT: GAIN and Q read —, the fader becomes CUTOFF, and the lows fall away.',
      'Pick NOTCH and slide Q from 1.0 up to 12.0: the wide dip shrinks to a thin cut at one frequency.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  slopes: {
    seeing: [
      'A high-pass (low-cut) filter at 80 Hz drawn at six slopes: the chosen one bright, the other five as dashed ghosts.',
      'Below 80 Hz the curves fall away; above it they stay near 0 dB. The line under the display names the filter’s order.',
      'Readouts: SLOPE, CUTOFF 80 Hz, and the computed cut at @40 Hz (an octave below) and @20 Hz (two octaves below).',
    ],
    control: [
      'SLOPE fader: steps through 6, 12, 18, 24, 36 and 48 dB/OCT.',
      'Tap the SLOPE key for the exact values, each with what it is used for; the tray stays open so you can compare.',
      'The cutoff never moves here — only the steepness changes.',
    ],
    changes: [
      'Each extra 6 dB/OCT adds one filter pole: the skirt below 80 Hz gets steeper.',
      'The −3 dB point stays at 80 Hz for every slope; only how fast the cut grows past it changes.',
      'Steeper slopes carve harder but shift phase more near the corner. Gentle slopes are common on channel low-cuts, steep ones in crossovers.',
    ],
    teaches: [
      'Slope is a RATE: how fast the cut grows beyond the cutoff, in dB per octave.',
      'Slope is not width: a pass filter’s Q shapes its corner, not its rate per octave.',
      'Follows Filter Shapes; Graphic vs. Parametric comes next.',
    ],
    tryThis: [
      'At 12 dB/OCT: @40 Hz reads −12.3 dB and @20 Hz −24.1 dB — about 12 dB more per octave.',
      'Slide SLOPE to 48 dB/OCT: @40 Hz reads −48.2 dB and @20 Hz −96.3 dB.',
      'Slide SLOPE to 6 dB/OCT: @40 Hz reads −7.0 dB and @20 Hz −12.3 dB — the gentlest tilt.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  gvp: {
    seeing: [
      'A graphic EQ board: one vertical fader per fixed band, with the board’s actual response curve above it.',
      'The line under the display: the curve is the ACTUAL combined response of the board’s real fixed-width bells.',
      'Readouts: BOARD, RANGE ±12 dB, and BAND and LEVEL for the fader under your finger.',
    ],
    control: [
      'Drag a fader up or down: −12 to +12 dB in 0.5 dB steps.',
      'BOARD key: 1-OCTAVE · 10 BANDS (31 Hz to 16k) or 1/3-OCTAVE · 31 BANDS (20 Hz to 20k). Swipe the 1/3-octave board sideways to reach every fader.',
      'RESET returns the board you are on to 0 dB. Each board keeps its own settings when you switch.',
    ],
    changes: [
      'A fader changes only its band’s gain; the band’s frequency and width are fixed.',
      'The 1-octave bands are wide (Q about 1.4); the 1/3-octave bands are narrower (Q about 4.3) for finer detail.',
      'Neighbouring bands overlap, so the curve is their sum, not a copy of the fader caps.',
    ],
    teaches: [
      'Graphic EQ: fixed frequencies, fixed width, adjustable gain — fast, repeatable control.',
      'Parametric EQ: adjustable frequency, gain and Q — far more precision. Both are professional tools.',
      'Follows Filter Slopes; Multi-Band Parametric comes next.',
    ],
    tryThis: [
      'On the 1-octave board push the 1k fader to the top: while your finger is on it, BAND 1.00 kHz, LEVEL +12.0 dB; the bump is still about +2.5 dB at 500 Hz and 2k.',
      'Switch BOARD to 1/3-OCTAVE and push one fader: a much narrower bump than on the 1-octave board.',
      'Tap RESET: every fader on this board returns to 0 dB and the curve lies flat.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  multiband: {
    seeing: [
      'A six-band EQ — HPF, LOW, LMF, HMF, HIGH, LPF — each switched-on band a coloured dot (node); the selected one is larger.',
      'Thin coloured curves: each band that is boosting, cutting or filtering, on its own (a bell at 0 dB draws none). Bold curve: COMBINED, all bands together; its colour warms with the biggest boost.',
      'Readouts: BAND, FREQ, GAIN (— on HPF/LPF) and EQ — how many bands are ACTIVE, or BYPASS.',
    ],
    control: [
      'Drag on the graph: the nearest node is grabbed — sideways sets frequency, up and down sets gain (bells only).',
      'FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) faders edit the selected band; HPF and LPF have FREQ only. An OFF band’s faders are LOCKED.',
      'BAND key: tap a band to select it (HPF and LPF switch on when tapped), BAND ON / BAND OFF, and RESET.',
      'BYP key: bypass the whole EQ for an instant before and after. HEAR IT, when shown, plays PINK NOISE or SWEEP through it.',
    ],
    changes: [
      'Overlapping boosts add: the combined curve rises higher than either band alone.',
      'A cut inside a boost’s skirt partly cancels it.',
      'HPF and LPF here are fixed 12 dB/octave filters that remove the extreme lows or highs.',
      'BYP flattens the output; a dim line keeps the would-be combined curve.',
    ],
    teaches: [
      'Real EQs run several filters at once, and the filters interact.',
      'The combined curve — not any single band — is what the signal gets.',
      'Follows Graphic vs. Parametric; What a Graphic EQ Really Does comes next.',
    ],
    tryThis: [
      'At the start EQ reads 4 ACTIVE and only the flat bold curve shows. Drag the LMF node up to +6 dB: its own thin curve appears and the bold one rises with it.',
      'Drag the HMF node next to it, also at +6 dB: where they overlap the combined curve climbs toward +12 dB.',
      'Tap BYP: EQ reads BYPASS, the output line lies flat and the would-be curve stays dim.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  graphic: {
    seeing: [
      'A 10-band graphic EQ (31 Hz to 16k) with two curves: a dim line joining the fader caps — what the eye imagines — and the bold ACTUAL response.',
      'THE SLIDERS ARE NOT THE RESPONSE: the gap between those two lines is the lesson.',
      'Readouts: VIEW (MAG or PHASE ±180°), FILTERS (SHOWN or HIDDEN), BAND and LEVEL for the fader under your finger.',
    ],
    control: [
      'Drag a fader: −12 to +12 dB in 0.5 dB steps.',
      'VIEW key: MAGNITUDE (how much each frequency is boosted or cut) or PHASE (how far each one is shifted in phase).',
      'FILTERS key: every band’s own bell under the combined curve, each in its own colour.',
      'EXAMPLE sets 125 Hz +3, 250 Hz +6 and 500 Hz +3 dB. CLEAR returns every fader to 0 dB.',
    ],
    changes: [
      'Each band is a real bell with width, so neighbours overlap and their dB add: the actual curve can rise above the highest cap.',
      'PHASE view: a boost shifts phase ahead on one side of its band and behind on the other; the dim 0° line is what the sliders imply.',
      'A conventional (minimum-phase) EQ never changes only the level.',
    ],
    teaches: [
      'An EQ slider is a control setting, not a drawing of the result.',
      'Overlapping filters combine, and every boost or cut also shifts phase.',
      'Follows Multi-Band Parametric; Live Spectrum + EQ comes next.',
    ],
    tryThis: [
      'Tap EXAMPLE: the caps top out at +6 dB at 250 Hz, but the actual curve peaks at about +7.1 dB.',
      'Turn FILTERS on: three coloured bells appear, and the combined curve is their sum.',
      'With EXAMPLE set, switch VIEW to PHASE: a small but real swing, about ±24° on a ±180° scale, around the 0° line near those bands.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  liveEq: {
    seeing: [
      'Your room’s live 1/3-octave spectrum from the phone microphone, with your EQ drawn over it as an amber curve once you touch a band fader or pick a LOW CUT.',
      'Bars: dB below full scale (0 to −90), blue quiet to red loud, with peak ticks; gray slots cannot be resolved.',
      'With no EQ set, the line under the display reads dBFS · UNCALIBRATED APPROXIMATE.',
      'Readouts: VIEW, LOW CUT, BAND (its frequency, or OFF) and MIC.',
    ],
    control: [
      'FREQ, GAIN (−8 to +8 dB) and Q (0.3–12) faders: one parametric bell. Touching any of them switches the band on.',
      'LOW CUT key: OFF, 40, 80 or 120 Hz, and a SLOPE of 12, 24 or 48 dB/OCT.',
      'VIEW key: SPECTRUM ONLY, EQ ONLY or COMBINED; BAND ON / BAND OFF; and MIC LIVE — PAUSE or MIC PAUSED — RESUME.',
      'Tapping the display also pauses or resumes the microphone.',
    ],
    changes: [
      'COMBINED: the bars are redrawn as if your room’s sound had passed through the EQ. Nothing in the room changes.',
      'SPECTRUM ONLY hides the curve; EQ ONLY hides the bars. Moving a band fader in SPECTRUM ONLY returns to COMBINED.',
      'Point the phone around: the bars change, the curve does not — it is your plan, not a measurement.',
    ],
    teaches: [
      'How a designed EQ curve lines up with real frequency content.',
      'Low cut, slope and a parametric band, together on real sound.',
      'The phone mic is uncalibrated: read levels as relative, for learning.',
      'Follows What a Graphic EQ Really Does; the trainers start with Find the Frequency.',
    ],
    tryThis: [
      'Open LOW CUT and pick 80 Hz: LOW CUT reads 80Hz·12 and the low bars drop under the amber curve.',
      'Keep 80 Hz and pick SLOPE 48 dB/OCT: the curve falls far more steeply below 80 Hz.',
      'Set GAIN to +8.0 dB and Q high, then ride FREQ: BAND follows it, and the amber bump shows which bars it sits over.',
    ],
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  findFreq: {
    seeing: [
      'A synthetic program spectrum: the dim REFERENCE is healthy; the bold SIGNAL has a hidden problem added.',
      'Your band is marked on the graph. The signal warms toward red while it still pokes above the reference.',
      'Readouts: LVL, BAND (on level 5) and RESULT (—, PASS or MISS). The brief and the result sit below.',
    ],
    control: [
      'FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) faders: your correction band. Double-tap the GAIN lane for 0 dB.',
      'LEVEL key: LEVEL 1 to LEVEL 5; NEW SIGNAL in the same tray deals a fresh problem at this level.',
      'CHECK judges your move. On level 5 a BAND key switches between your two bands.',
      'HEAR IT, when shown below, plays the problem plus your fix through PINK NOISE or SWEEP.',
    ],
    changes: [
      'Your band adds to the signal: cut a boost, fill a hole, and the bold curve settles back onto the reference.',
      'CHECK passes within a third of an octave of the problem, with your gain cancelling it to within 3 dB.',
      'The result reads Target, Your selection and Difference, and says what is still wrong. Moving a fader clears it.',
    ],
    teaches: [
      'A method: WHERE first (frequency), then HOW MUCH (gain), then HOW WIDE (Q).',
      'The levels: a boost, a cut, a narrow resonance, a tilted balance, then two problems at once.',
      'Fixing a boost needs a cut; fixing a hole needs a boost.',
      'Follows Live Spectrum + EQ — the trainers start here; Match the Curve comes next.',
    ],
    tryThis: [
      'On LEVEL 1, slide FREQ until your band sits under the bump, pull GAIN down to about −9 dB, then tap CHECK.',
      'After a PASS, tap NEXT LEVEL › under the result to move up a level.',
      'On LEVEL 3 the problem is narrow: raise Q as well, or your cut takes the neighbouring frequencies with it.',
    ],
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  matchCurve: {
    seeing: [
      'The thin gray TARGET curve, made from one or two hidden bells, and your EQ as the bold line; its colour follows its gain.',
      'Your band’s frequency is marked on the graph.',
      'Readouts: MATCH (HIDDEN until you ask), BANDS (how many the target uses) and BAND (on two-band targets).',
    ],
    control: [
      'FREQ, GAIN (−15 to +15 dB) and Q (0.3–12) faders shape your band. Double-tap the GAIN lane for 0 dB.',
      'SCORE shows the MATCH score; HIDE hides it again. NEW deals a new target.',
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
      'Follows Find the Frequency; Fix the Signal comes next.',
    ],
    tryThis: [
      'Tap SCORE before moving anything: MATCH reads 0% — a flat EQ matches nothing.',
      'Line FREQ up under the target’s peak or dip, then set GAIN, then Q, and tap SCORE again.',
      'Reach 90% for EXCELLENT, then tap NEW for another target.',
    ],
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  fixSignal: {
    seeing: [
      'A synthetic program spectrum: the dim REFERENCE, and the bold SIGNAL carrying the problem from a real-world story.',
      'Below the display: the CASE name and the complaint — no frequency until you tap CHECK.',
      'Readouts: CASE, SCEN (which scenario) and RESULT (—, FIXED or NOT YET).',
    ],
    control: [
      'FREQ, GAIN (−18 to +18 dB) and Q (0.3–12) faders: your one correction band.',
      'SCEN key: BOOMY KICK, HARSH VOCAL, STAGE RUMBLE, HONKY GUITAR or SIBILANT VOCAL, each with its story.',
      'CHECK judges your fix. HEAR IT, when shown below, plays the problem plus your fix.',
    ],
    changes: [
      'Cut where the signal bulges above the reference and it settles back onto it.',
      'CHECK passes within a third of an octave of the problem, with your cut cancelling it to within 3 dB.',
      'The result names where the problem was and why that region sounds that way. Moving a fader clears it.',
    ],
    teaches: [
      'Everyday complaints — boomy, harsh, rumble, honky, sibilant — point to frequency regions.',
      'Real problems don’t announce their frequency: read the complaint, look, then decide.',
      'Follows Match the Curve; EQ Challenges closes the lab.',
    ],
    tryThis: [
      'Read the complaint, then find where the bold SIGNAL bulges above the dim REFERENCE — before you touch a fader.',
      'BOOMY KICK: put FREQ under that bulge, cut by about the same amount, then tap CHECK: RESULT reads FIXED.',
      'Pick STAGE RUMBLE: the bulge sits very low — the classic low-cut situation.',
    ],
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  challenges: {
    seeing: [
      'A synthetic spectrum with too much 250 Hz: the dim line is the healthy reference, the bold line the signal.',
      'The panel title names the state — THE PROBLEM, STRATEGY: CUT or STRATEGY: BOOST AROUND — and top right reads 250 Hz +6 dB or the overall shift.',
      'Below: two columns comparing the strategies, CUT −6 @ 250 Hz and BOOST +6 AROUND IT.',
    ],
    control: [
      'PROBLEM ONLY: the signal as it is.',
      'CUT THE PROBLEM (−6 @ 250): one −6 dB bell at 250 Hz.',
      'BOOST AROUND IT (+6): +6 dB bells at 63 Hz and 2.5 kHz instead.',
      '⤢ FULL SCREEN enlarges the graph with the same keys. HEAR IT, when shown, lets you compare by ear.',
    ],
    changes: [
      'The cut lands exactly on the problem: the signal sits back on the reference and the average level drops a little.',
      'The boost lifts both sides of the problem, so the balance improves — but the whole signal gets louder.',
      'The overall shift is the EQ’s average change across the spectrum.',
    ],
    teaches: [
      'EQ is about balance: cutting the unwanted region and boosting around it can both improve it.',
      'Boosting raises the overall level, which uses up headroom into the next stage.',
      'Follows Fix the Signal and closes the EQ Lab. A good next step: the Dynamics labs (compression, gating, limiting).',
    ],
    tryThis: [
      'Tap CUT THE PROBLEM: the readout shows overall shift ≈ −1.0 dB.',
      'Tap BOOST AROUND IT: overall shift ≈ +2.9 dB — the whole signal got louder.',
      'Compare the two: the cut puts the signal back on the reference; the boost lifts everything around the bump.',
    ],
  },
};
