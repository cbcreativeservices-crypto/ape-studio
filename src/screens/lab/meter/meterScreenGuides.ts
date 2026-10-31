/**
 * Visual Audio Analysis Lab (+ Signal Detective) — "explain this screen"
 * content (Screen Guide rollout, owner 2026-10-31). One guide per module
 * (keyed by MeterModuleId — Signal Detective is 'detective', the catalog's own
 * Signal Detective entry opens that same module), one for the lab home and one
 * for the what's-left screen both hosts swap in.
 *
 * Every line was written against the module's own code (modMeterA / modMeterB
 * / modMeterC, vizMeters / vizSpectral, meterEngine): the names are the
 * on-screen names (bezel keys, dock labels, tray options, labels drawn on the
 * display), and every number quoted in TRY THIS is what the bezel prints for
 * that setting — worked out from meterEngine (renderSignal, simulateLoudness,
 * spectrumDb, waterfallRt / waterfallRidge, stereoPair / correlationOf) at the
 * module's default state unless the step says otherwise. Change a module's
 * labels, ranges, defaults or teaching signals → update its guide here;
 * test/screenGuide_meter_20261031.test.ts pins the shape and the numbers.
 *
 * Audit pass 2026-10-31 (two independent audits): where a picture and its
 * frame are built from different buffers (Waveform, Peak), a TRY THIS setting
 * is chosen where both agree, and the guide names which number it quotes.
 *
 * STEPPED: each section is one step and must fit a 375×812 phone with no
 * scrolling, so each is held to SCREEN_GUIDE_BUDGET (types.ts).
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never skills;
 * no gear brand names; no "N of total"; no build notes in learner text; units
 * spaced from their numbers ("10.0 dB", "−15.9 LUFS").
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { MeterModuleId } from './modules/registry';

export const METER_HOME_GUIDE: ScreenGuide = {
  seeing: [
    'The Visual Audio Analysis menu: ten displays engineers read every day, one module each — then Signal Detective puts them to work.',
    'Each row is a module. A ✓ marks a module you have opened.',
    'SEE WHAT’S LEFT lists what you have not opened. USE WHAT YOU LEARNED links to the measurement tools and the ⓘ GUIDED LESSON.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Inside a module: the display on top, live numbers on its frame, controls in the dock at the bottom, notes and check questions to scroll below.',
    'The strip under a module’s title moves between modules (‹ PREV, NEXT ›); ‹ at the top left leaves the lab.',
    'OPEN THE MEASUREMENT TOOLS › goes to the tools that show your real sound. Tap ⓘ beside any title to have that screen explained; long-press a control for its guided-lesson entry.',
  ],
  changes: [
    'Opening a module adds its ✓ here, and the list behind SEE WHAT’S LEFT gets shorter.',
    'Inside a module, the controls change only that module’s display — nothing you set there reaches another module.',
    'The order builds: Modules 1–4 are level (each a different "how loud?"), 5–7 frequency, 8–10 stereo and raw voltage, and Module 11 mixes them.',
  ],
  teaches: [
    'What a display’s axes say, and which question each of its numbers answers.',
    'Why peak, average and loudness meters disagree on the same sound — on purpose.',
    'It follows Digital Audio Systems (dBFS, clipping) and comes before Signal Chain Builder.',
    'Every display here runs on built-in teaching signals, not your microphone or a real room.',
  ],
  tryThis: [
    'Work in order, starting with Waveform — each module reuses what the last one showed.',
    'Pick SNARE in VU / RMS Meter: PEAK −1.6, yet NDL MAX only −23.0 — a fast reading and a slow one of the same sound.',
    'Finish with Signal Detective: try to name each display before you read the answers.',
  ],
};

/** The what's-left screen (FINISH on Module 11, or SEE WHAT’S LEFT on the home). */
export const METER_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the modules you have not opened yet, each one a link.',
    'The ones you have opened fold into a single ✓ line.',
    'The title changes to LAB COMPLETE when all eleven are done.',
  ],
  control: [
    'Tap a module that is still left to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the modules you have opened; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START reopens Module 1 and clears nothing.',
    'DONE · BACK TO LABS goes back one screen: to this lab’s menu if you came from it, out of the lab from the menu.',
  ],
  changes: [
    'Opening a module moves it to the ✓ line, so the list shrinks as you go.',
    'Signal Detective also has its own entry in the lab list: it counts once every question of every case has been answered right.',
  ],
  teaches: [
    'Which displays you have read, and which you have not met yet.',
    'Nothing is ever taken away: any module can be opened again for practice.',
  ],
  tryThis: [
    'Jump to a module you have not opened and read its display before you touch a control.',
    'Use PRACTICE AGAIN FROM THE START to run the eleven modules in order once more.',
  ],
};

export const METER_SCREEN_GUIDES: Record<MeterModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  waveform: {
    seeing: [
      'A waveform, as a DAW (recording software) draws it: time left to right, amplitude up and down from the zero line. The scale reads 0, −6, −12 and −24.',
      'Blue near zero turns red near full scale; the whole wave turns red while it clips. PK, RMS and CF (crest factor) inside the picture echo the frame.',
      'Readouts: PEAK and RMS (dBFS), CREST (their gap), DC (center off zero) and CLIP (CLEAN, or how far OVER).',
    ],
    control: [
      'GAIN fader (−12 to +18 dB): turns the signal up or down before it is drawn. It starts at +0.0 dB.',
      'DC fader (−30 % to +30 %): adds a constant that lifts or drops the whole wave. DC→0 snaps it back.',
      'SIGNAL key: SPEECH, KICK DRUM, GUITAR or WHITE NOISE. The tray stays open so you can compare.',
      'Ø POL key: flips the polarity — every push becomes a pull. FULL SCREEN gives the picture the whole phone.',
    ],
    changes: [
      'More GAIN, a taller wave. Past full scale there is no bigger number to store, so tops are cut flat: CLIP reads OVER.',
      'Height is peak; RMS is average energy. Spiky sounds have a big CREST, steady ones a small one.',
      'DC moves the center. It is silent, but RMS counts it, and one side hits full scale sooner.',
      'With DC at 0 %, Ø POL flips the wave and only DC’s sign changes. The fader’s offset is not flipped.',
    ],
    teaches: [
      'Height shows peak level, not loudness.',
      'Flat tops are clipping, and turning down afterwards cannot rebuild them.',
      'A flat line off the center is DC offset; true silence sits on the zero line.',
      'The gap between peak and average (crest factor) is where Modules 2 and 3 pick up.',
    ],
    tryThis: [
      'On SPEECH, raise GAIN to +2.0 dB: CLIP still says CLEAN (PEAK −0.6). At +3.0 dB it reads +0.4 OVER and the wave turns red.',
      'Back at +0.0 dB, switch SPEECH to WHITE NOISE: CREST drops from 10.0 dB to 4.7 dB — a steady sound, little gap.',
      'On SPEECH, slide DC to +30 %: DC reads +31.5 % (the clip carries +1.5 % of its own) and CLIP trips +0.4 OVER — the offset spent the headroom.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  peak: {
    seeing: [
      'A SAMPLE PEAK meter: two segment columns, L and R, in dBFS — 0 at the top is full scale. A floating segment above each bar holds the recent peak.',
      'The OVER lamp at the top lights when full scale is hit. The CREST under the columns can differ by a few tenths from the frame’s.',
      'Readouts: PEAK (highest sample now), PK HOLD (highest so far), OVERS (separate trips past full scale), RMS and CREST.',
    ],
    control: [
      'GAIN fader (−12 to +18 dB): it starts at −6.0 dB.',
      'SIGNAL key: KICK DRUM, SNARE, SPEECH or ORGAN. The tray stays open while the meter reacts.',
      'RESET HOLD key: sets PK HOLD back to the current PEAK.',
    ],
    changes: [
      'The bar jumps up at once and falls slowly so the eye can follow. The hold segment waits at the recent maximum.',
      'At 0 dBFS or above, PEAK shows OVR, OVERS counts each run of clipped samples and the lamp lights.',
      'GAIN moves PEAK and RMS together, so CREST stays put. Only another SIGNAL changes it.',
      'PK HOLD keeps the highest value, even after GAIN comes down.',
    ],
    teaches: [
      'A peak meter answers one question: will it clip?',
      'A lit OVER lamp means full scale was already hit — those samples are flat.',
      'Two sounds with the same peak can carry very different average energy.',
      'Module 1 drew peak and average in one picture; this meter watches the peak. That gap is why the next module’s VU needle exists.',
    ],
    tryThis: [
      'On KICK DRUM, raise GAIN from −6.0 dB to +0.0 dB: PEAK reads +1.6 OVR, OVERS reads 4 and the lamp lights.',
      'Pull GAIN back to −6.0 dB: PEAK returns to −4.4, but PK HOLD keeps the highest peak you reached until you tap RESET HOLD.',
      'At −6.0 dB, switch KICK DRUM to ORGAN: CREST on the frame falls from 16.1 dB to 4.8 dB — over 11 dB less gap.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  vu: {
    seeing: [
      'A classic VU meter: a needle on an arc scale, plus a PEAK lamp that lights on fast peaks.',
      'The needle takes about 300 ms to respond — by design, as the badge says. On this face, 0 VU is an average level of about −7.5 dBFS.',
      'Readouts: PEAK (highest sample), RMS (average energy), CREST (their gap) and NDL MAX (the highest a 300 ms average reached, in dBFS).',
    ],
    control: [
      'GAIN fader (−12 to +12 dB): it starts at +0.0 dB.',
      'SIGNAL key: SNARE, ORGAN, PINK NOISE or SPEECH. The tray stays open so you can compare while the needle answers.',
      'FULL SCREEN shows the meter face at the whole phone.',
    ],
    changes: [
      'The needle averages about 300 ms. A snare crack is over before it moves far; a held organ chord keeps pushing, so the needle climbs and sits.',
      'The PEAK lamp reacts at once: it flashes on the snare while the needle only flicks partway up.',
      'NDL MAX lands near RMS, far below PEAK on spiky sounds. GAIN moves PEAK, RMS and NDL MAX together; CREST stays put — only another SIGNAL changes it.',
    ],
    teaches: [
      'Peak vs average: the needle reads average level, which is closer to how loud a sound feels.',
      'A slow needle is a design choice, not a fault.',
      '0 VU is a reference (nominal) level with headroom above it, not a ceiling.',
      'Module 2 watched the peak; Module 4 replaces the needle with LUFS, a loudness average weighted like the ear.',
    ],
    tryThis: [
      'On SNARE: PEAK −1.6, but NDL MAX only −23.0 — more than 21 dB under the peak.',
      'Switch to ORGAN: PEAK −5.7, NDL MAX −11.3 — a lower peak, yet NDL MAX sits almost 12 dB higher, and the PEAK lamp stays dark.',
      'Pick PINK NOISE: broadband, yet the needle barely moves. Equal energy in every octave makes it the reference for system and room checks.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  loudness: {
    seeing: [
      'A LOUDNESS · LUFS meter: M and S bars (momentary, short-term) at left; in the middle, the big LUFS INTEGRATED number and LRA.',
      'At right, the SHORT-TERM history: about 24 s of program, replayed in about 4 s. STREAMING ≈ −14 marks a common target.',
      'Readouts: INTEGRATED, LRA, SAMPLE PK, TRUE PK and TP GAP. MOMENTARY RANGE, below, gives the lowest and highest momentary reading.',
    ],
    control: [
      'SIGNAL key: SPEECH, MUSIC MIX, ORGAN or KICK DRUM — the only control. The tray stays open so you can compare.',
      'Each signal is a fixed clip, so the meter reads it the same way every time you pick it.',
    ],
    changes: [
      'Each window answers its own question: momentary (400 ms) "loud right now", short-term (3 s) "this section", integrated "the whole program", with silence left out.',
      'LRA is the spread of the short-term readings: it rises when the level changes from section to section, not because single hits are punchy.',
      'Between two samples the rebuilt wave can rise above both, so TRUE PK reads above SAMPLE PK.',
    ],
    teaches: [
      'LUFS (loudness units, weighted like the ear; 1 LU = 1 dB) is the number streaming and broadcast match programs by.',
      'LRA says how dynamic a program is, not how loud.',
      '"No clipped samples" is not "no clipping": delivery specs set a true-peak ceiling, often −1 dBTP (true-peak level).',
      'Modules 1–3 measured level; this one measures loudness. Module 5 turns to "which frequencies".',
    ],
    tryThis: [
      'On MUSIC MIX: INTEGRATED −15.9 LUFS, TP GAP +0.9 dB. Switch to SPEECH: −23.7 LUFS, and a gap of only +0.4 dB.',
      'Compare ORGAN and KICK DRUM: LRA reads 0.8 LU against 6.7 LU — this kick clip gets louder and softer across its length.',
      'On ORGAN, the M bar moves a little while the big number holds still: MOMENTARY RANGE spans only −17.3 to −16.0 LUFS.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  spectrum: {
    seeing: [
      'A spectrum analyzer: frequency runs left to right on a log scale — 20, 100, 1k, 10k, each gridline ten times the last. Level runs up in dB; bar colors follow level.',
      'A marker labels the tallest point with its frequency.',
      'Readouts: PATTERN, PEAK (frequency of the tallest point), LEVEL (its height, dB rel) and TILT (the overall slope, per octave — a doubling).',
    ],
    control: [
      'PATTERN key: SPEECH, CYMBAL, KICK DRUM, GUITAR, MAINS HUM, FEEDBACK or PINK NOISE. Each option describes its shape, and the tray stays open so you can compare.',
      'Nothing else to set: the shape is the lesson. Long-press PATTERN for its guided-lesson entry.',
    ],
    changes: [
      'Each sound puts its energy in different places: voices in the middle, kick and hum low, cymbal high.',
      'Noise draws smooth shapes; a played note draws spikes at whole-number multiples of its pitch, crowding closer toward the right; a lone tone draws one needle.',
      'PINK NOISE (equal energy per octave) falls 3 dB per octave on this FFT-style (equal-width band) display.',
    ],
    teaches: [
      'A spectrum’s meaning is in its shape: where the energy sits, smooth or spiky, what sticks up.',
      'Hum is a family of spikes at the mains frequency and its multiples; feedback is one spike that grows.',
      'A finished mix usually slopes down like pink noise, not flat.',
      'Modules 1–4 asked how loud; this one asks which frequencies. Module 6 films it over time.',
    ],
    tryThis: [
      'Switch between MAINS HUM and FEEDBACK: PEAK jumps from 60 Hz to 1.7 kHz (the plot’s marker says 1.75 kHz) — a low family, then one lone spike.',
      'Pick PINK NOISE: TILT reads −3.0/oct, the reference slope. Then CYMBAL: TILT flips to +5.2/oct.',
      'Pick KICK DRUM: PEAK reads 60 Hz for the thump, and a small second bump sits near 3 kHz — the beater click.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  spectrogram: {
    seeing: [
      'A spectrogram: a spectrum filmed over time. OLDER ← TIME → NOW runs across, FREQUENCY ↑ runs up, and color is LEVEL (the HI / LO strip at right).',
      'The film loops every 5 seconds.',
      'Readouts print the axes: TIME (new → right), FREQ (↑ up), LEVEL (= color) and MODE (SCROLL or SNAP).',
    ],
    control: [
      'PATTERN key: SPEECH, BIRDSONG, CYMBAL DECAY, FEEDBACK, WHISTLE or WHITE NOISE. The tray stays open while the film rolls.',
      'VIEW key: ELAPSED TIME (the picture slides left; NOW is the right edge) or SNAPSHOT — FULL 5 s (the whole 5 seconds, frozen).',
    ],
    changes: [
      'A held pitch draws a flat line; a moving pitch draws a slope; a hit draws a thin vertical stripe across many frequencies.',
      'Louder means brighter, never taller. Height means pitch.',
      'SNAPSHOT shows the whole pattern at once, so its start and its end can be compared.',
    ],
    teaches: [
      'Axes first: time across, frequency up, level as color.',
      'The most common mistake is reading it like a waveform, where up means loud.',
      'A steady line is usually a tone; a line that keeps getting brighter is feedback.',
      'Module 5 showed one moment; this one shows the moments in a row. Module 7 adds decay: how long each frequency lasts.',
    ],
    tryThis: [
      'Compare WHISTLE and FEEDBACK: both draw one thin line, but only FEEDBACK grows brighter as it runs right.',
      'Pick BIRDSONG: the lines slope — the pitch itself is moving.',
      'Pick CYMBAL DECAY, then set VIEW to SNAPSHOT — FULL 5 s: the bright top fades from left to right.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  waterfall: {
    seeing: [
      'A waterfall (CSD, cumulative spectral decay): frequency across (Hz on the front edge), level up (dB), TIME toward you — 0s at the back, later slices in front.',
      'A ridge that outlasts its neighbors is marked RINGS. At the start RIDGE reads none: the room’s 250 Hz mode is just under the mark.',
      'Readouts: RT·125 and RT·4k (RT60, the time to fall 60 dB, low vs high), RIDGE and VS NEARBY (how much longer it rings).',
    ],
    control: [
      'DAMPING fader: CONCRETE → CURTAINS → CARPET → PANELS — everything soft in the room. It starts at CONCRETE · 15%.',
      'EQ fader (−12 to +12 dB): tap EQ to pick its band — 220 Hz · Q6 (narrow), 440 Hz · Q1 (wide) or 1 kHz shelf (everything above). Each band keeps its own gain; FLATTEN ALL BANDS resets them.',
      'ROOM key: CATHEDRAL, CLASSROOM, STUDIO, THEATER or LIVING ROOM; it starts on CLASSROOM. REVERB key: NONE, ROOM, PLATE, HALL or SPRING. Both replay the build.',
      'Q RING key: adds a narrow, ringing filter at 1.2 kHz. REPLAY plays the build again.',
    ],
    changes: [
      'More DAMPING shortens the tail. Highs go first (RT·4k drops fast); lows need thick treatment, so RT·125 hangs on.',
      'EQ changes a region’s height; its decay slope (the RT60) stays the same, so a taller region simply takes longer to reach the floor.',
      'A reverb slower than the room shows; a faster one is hidden — the slower decay wins.',
      'Q RING stores energy in the filter itself, so a thin ridge lingers.',
    ],
    teaches: [
      'Level and decay slope are different things: EQ moves one, absorption the other.',
      'Decay depends on frequency, so one RT60 number never tells the whole story.',
      'A ridge that outlasts its neighbors is ringing: a room mode, a resonant speaker or a high-Q filter.',
      'Modules 5–6 showed which frequencies, and when; this one shows how long each lasts. Module 8 turns to stereo.',
    ],
    tryThis: [
      'At the start, tap Q RING on: RIDGE jumps to 1.2 kHz and VS NEARBY to 3.0× — the filter itself rings. Tap it off again.',
      'Still at the start, boost EQ to +12 dB on 220 Hz · Q6: that region starts taller, yet RT60 · 250 Hz below the display stays at 2.21 s.',
      'Last, slide DAMPING all the way down (CONCRETE · 0%): RIDGE reads 251 Hz and VS NEARBY 1.7× — the classroom’s mode rings.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  phase: {
    seeing: [
      'A phase meter. Top: the CORRELATION bar from −1 to +1 (red, amber, green zones) and its ρ (correlation) reading. Below: the dot cloud on L / R axes.',
      'Under the display, the matching zone lights — MONO-SAFE, WIDE / UNRELATED or MONO-DEATH — over a MONO-FOLD VERDICT.',
      'Readouts: CORR, WIDTH, PHASE and MONO FOLD (the level change when L and R are summed to mono).',
    ],
    control: [
      'PHASE fader (0° to 180°, R vs L): a teaching control, from R moving with L to R polarity-opposite. Read its two ends; in between it is simplified. It starts at 0°.',
      'WIDTH fader (0 to 100 %): how different the two channels are. It starts at 35 %.',
    ],
    changes: [
      'Correlation compares L and R moment by moment: +1 = they move together, 0 = unrelated, −1 = one pushes while the other pulls.',
      'PHASE toward 180°: R opposes L, so CORR dives and MONO FOLD falls — summed, the two cancel.',
      'More WIDTH: the channels share less, so CORR falls toward 0 and the cloud grows fatter. A vertical line is mono, a flat line anti-phase.',
    ],
    teaches: [
      'The bar’s green zone and the SAFE verdict start at +0.5; lower readings are worth a mono check.',
      'Near −1 a mix can sound huge on speakers and collapse on a mono PA or a phone.',
      'Width borrowed from out-of-phase tricks is paid back in mono.',
      'Modules 1–7 read one signal; this one compares two. Module 9 shows them as Mid and Side.',
    ],
    tryThis: [
      'At the start: CORR +0.91, MONO FOLD −0.2 dB — SAFE. Drag PHASE to 180°: CORR −0.91, MONO FOLD −13.6 dB — CANCELLATION.',
      'Set WIDTH to 0 % with PHASE at 180°: CORR −1.00 and MONO FOLD −112.5 dB, the bottom of the meter — the two channels cancel completely.',
      'PHASE back to 0°, WIDTH up to 100 %: CORR −0.01 (unrelated), MONO FOLD −3.1 dB — RISKY: wide, and thinner in mono.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  stereo: {
    seeing: [
      'A stereo image display: where the sound sits across L, C and R, with MID and SIDE bars below it and the preset’s name.',
      'MONO is one point at the center; wider presets spread toward the speakers.',
      'Readouts: PRESET, MID (SHARED) — what both channels have in common — and SIDE (DIFF) — what differs between them.',
    ],
    control: [
      'PRESET key: MONO, NARROW, WIDE, HARD L-R or MID-SIDE. Each option has a description, and the tray stays open while the image changes.',
      'No faders here: each preset is a position, so compare them side by side.',
    ],
    changes: [
      'Mid = L + R, the shared part. Side = L − R, the difference.',
      'More Side compared to Mid: a wider image, less center focus.',
      'A sound in only one speaker is half Mid, half Side; a centered sound has no Side at all.',
      'Summing to mono keeps only the Mid, so whatever lives in Side disappears.',
    ],
    teaches: [
      'Width is the ratio of Side to Mid, not a separate effect.',
      'Wide is a position, not a quality: what the sides gain, the center loses.',
      'Why the anchors of a mix (vocal, bass, kick) usually stay in the Mid.',
      'Module 8 measured how alike L and R are; Module 10 shows the raw voltage, plus an X-Y view of a stereo pair.',
    ],
    tryThis: [
      'Step from MONO to NARROW to WIDE: MID (SHARED) reads 100 %, then ≈85 %, then ≈55 %, as SIDE (DIFF) grows.',
      'Pick HARD L-R: about half and half (≈50 % each), and a hole opens in the middle of the image.',
      'Pick MID-SIDE: the readouts switch to words — shared and difference — the same signal, described another way.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  scope: {
    seeing: [
      'An oscilloscope: the voltage itself against time — no averaging, no weighting. CH 1 · SWEEP LOCK and the TRIG mark hold a repeating wave still.',
      'In X-Y mode (X = L · Y = R) the left channel moves the dot across and the right moves it up.',
      'Readouts: MODE (TIME or X-Y), SIGNAL, and in X-Y only, CORR and WIDTH.',
    ],
    control: [
      'SIGNAL key: SINE, SQUARE, TRIANGLE, SAW, SPEECH or MUSIC. The tray stays open so you can compare traces.',
      'X-Y key: switches between TIME and X-Y.',
      'WIDTH fader (0 to 100 %) and PHASE fader (0° to 180°, R vs L): shape the stereo pair drawn in X-Y. Moving either one switches X-Y on. Both start at 0.',
    ],
    changes: [
      'Each wave’s shape comes from its harmonics: a sine has none, a square has fast edges, this saw ramps down, then snaps back up.',
      'Real signals (SPEECH, MUSIC) never repeat, so there is no single shape to hold still.',
      'In X-Y, identical channels draw a 45° line; PHASE toward 180° tips it onto the opposite diagonal; WIDTH opens it into a cloud.',
    ],
    teaches: [
      'The scope shows what the signal is doing right now — the rawest view there is.',
      'Flat tops a wave was not born with mean it clipped at this point or earlier, whatever later meters say.',
      'A studio goniometer turns the X-Y plot 45°, so there mono stands upright: same data, two conventions.',
      'Modules 1–9 each summed the signal up; this one draws it raw. Module 11 puts seven of these displays to work.',
    ],
    tryThis: [
      'Switch between SINE and SQUARE: one smooth curve, then flat shelves with near-vertical edges.',
      'Tap X-Y: a thin 45° line and CORR +1.00 — mono. Drag PHASE to 180°: the other diagonal, CORR −1.00.',
      'Back at PHASE 0°, raise WIDTH to 100 %: the line opens into a cloud and CORR falls to −0.01 — unrelated channels.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  detective: {
    seeing: [
      'A display with its title removed and a real-world fault in it. Every case uses a display from Modules 1–10.',
      'Below it, one question at a time: WHAT METER IS THIS?, WHAT DOES IT SHOW?, WHAT PROBLEM DO YOU SEE?, then WHAT PROCESSOR/ACTION FIXES IT?',
      'Readouts: CASE (which case), QUESTION (which step) and SOLVED (questions answered right so far).',
    ],
    control: [
      '‹ CASE and CASE › keys in the dock: move between the seven cases. A new case starts at its first question.',
      'Tap an answer. A wrong one shows a hint and you can try again; the right one opens the explanation. The answers are shuffled each time.',
      'Under the question: ‹ PREVIOUS, then NEXT QUESTION › — or NEXT CASE › after the last question.',
    ],
    changes: [
      'Each case swaps in a different display and fault, so the first job is always to name the display.',
      'A right answer adds to SOLVED. Signal Detective is passed once every question of every case has been answered right.',
      'The reading order never changes: name it, read its axes, spot what is wrong, then decide whether — and how — to fix it.',
    ],
    teaches: [
      'Each fault leaves its own picture, and one display shows it best.',
      'Faults live in level, frequency, time or stereo — each needs its own display.',
      'Not every odd reading is a problem: a needle and a peak lamp that disagree can both be honest.',
      'It draws on Modules 1–10; the measurement tools then show the same pictures on real sound.',
    ],
    tryThis: [
      'Before you answer WHAT METER IS THIS?, say what runs across and what runs up — the axes and markings name the meter.',
      'Pick a wrong answer on purpose and read the hint: it points at the clue you missed.',
      'Cycle the deck with CASE › until each display is named at a glance.',
    ],
  },
};
