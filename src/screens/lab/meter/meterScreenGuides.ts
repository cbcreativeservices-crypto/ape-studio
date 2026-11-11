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
  intro: {
    learning: 'Why every display answers a different question about the same sound (peak, average, loudness, frequency, decay, stereo), and why you read any display’s axes first.',
    start: 'Tap Waveform, read its one-line description, then tap OPEN to start Module 1. Take the modules in order; Signal Detective at the end hides each meter’s name.',
  },
  seeing: [
    'This lab teaches you to read the ten displays engineers look at every day, one module each. Then Signal Detective puts them to work.',
    'Each row is a module, and a ✓ means you’ve opened it. SEE WHAT’S LEFT lists the ones you haven’t.',
    'The measurement tools measure; this lab shows you what their pictures mean. USE WHAT YOU LEARNED links to those tools and the ⓘ GUIDED LESSON.',
  ],
  control: [
    'Tap a module’s name to read its one-line description, then tap OPEN to start it.',
    'Every module is laid out the same way: the display on top, live numbers on its frame, your controls in the dock at the bottom, and notes and check questions to scroll below.',
    'To move on, use the strip under a module’s title (‹ PREV, NEXT ›) instead of coming back here. ‹ at the top left steps out: from a module to this menu, from this menu out of the lab.',
    'OPEN THE MEASUREMENT TOOLS › takes you to the tools that show your real sound. Stuck on any screen? Tap ⓘ beside its title, or long-press a control for its guided-lesson entry.',
  ],
  changes: [
    'Open a module and its ✓ appears here, and the list behind SEE WHAT’S LEFT gets shorter.',
    'Whatever you set inside a module stays in that module. Nothing you do there reaches another display.',
    'The order builds: Modules 1–4 are level (each a different “how loud?”), 5–7 frequency, 8–10 stereo and raw voltage, and Module 11 mixes them.',
  ],
  teaches: [
    'Each display answers a different question about the same sound: how high it peaks, how loud it feels, which frequencies it holds, how long they last, whether it survives mono.',
    'Peak, average and loudness meters disagree on the same sound on purpose, because each measures something different.',
    'You read any display by starting with its axes: what runs across, what runs up, and what each number measures.',
  ],
  tryThis: [
    'Work in order, starting with Waveform. Each module reuses what the last one showed you.',
    'Pick SNARE in VU / RMS Meter: PEAK −1.6, yet NDL MAX (the needle’s highest) only −23.0. That’s a fast reading and a slow one of the same sound.',
    'Finish with Signal Detective, and try to name each display before you read the answers.',
  ],
};

/** The what's-left screen (FINISH on Module 11, or SEE WHAT’S LEFT on the home). */
export const METER_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the lab’s big idea: each meter answers one question, no single meter tells the whole story, and a reading depends on what it measures and how fast.',
    start: 'Tap any module still listed under WHAT’S LEFT to open it. Or tap REVIEW ▾ on the ✓ line, reopen a module you’ve done, and read its display before you touch a control.',
  },
  seeing: [
    'This is your list for the lab. WHAT’S LEFT shows the modules you haven’t opened yet, and each one is a link.',
    'The ones you’ve opened fold into a single ✓ line, so only the unfinished work stands out.',
    'Once all eleven are done, the title changes to LAB COMPLETE.',
  ],
  control: [
    'Tap a module that’s still left to jump straight to it.',
    'REVIEW ▾ on the ✓ line unfolds the modules you’ve opened. Tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START reopens Module 1 and clears nothing.',
    'DONE · BACK TO LABS goes back one screen. Came here from a module? It returns to this lab’s menu (if you entered through it). Came from the menu? It takes you out of the lab.',
  ],
  changes: [
    'Each module you open moves to the ✓ line, so this list shrinks as you go.',
    'Signal Detective joins the ✓ line as soon as you open it. Its own lab under AUDIO FUNDAMENTALS › Signal counts as finished only once you’ve answered every question of every case right.',
    'Going back into a module takes nothing away, so its ✓ stays.',
  ],
  teaches: [
    'Every meter answers one question. Peak: will it clip? VU and LUFS: how loud does it feel? Spectrum: which frequencies? Correlation: will it survive mono?',
    'No single meter tells the whole story. A sound can pass on one display and fail on another, so engineers read several together.',
    'A reading only means something once you know what the display measures and how fast it reacts.',
  ],
  tryThis: [
    'Jump to a module you haven’t opened and read its display before you touch a control. What can you tell from the picture alone?',
    'Use PRACTICE AGAIN FROM THE START to run the eleven modules in order once more. Your ✓ line stays as it is.',
  ],
};

export const METER_SCREEN_GUIDES: Record<MeterModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  waveform: {
    intro: {
      learning: 'How a waveform shows peak level, not loudness; what clipping looks like and why turning down can’t undo it; and how DC offset pushes the whole wave off center.',
      start: 'On SPEECH, drag GAIN up to +3.0 dB and watch CLIP change from CLEAN to OVER as the wave turns red. Then set GAIN back to +0.0 dB and switch SIGNAL to WHITE NOISE: watch CREST.',
    },
    seeing: [
      'You’re seeing a sound as a DAW (recording software) draws it: time left to right, amplitude up and down from the zero line. Judge height on the 0, −6, −12, −24 scale.',
      'Color warns you: blue near zero, red near full scale, all red while it clips.',
      'On the frame: PEAK, RMS, CREST (their gap), DC (how far the center is off zero), CLIP (CLEAN, or how far OVER). PK, RMS and CF in the picture match until it clips.',
    ],
    control: [
      'GAIN (−12 to +18 dB) turns the signal up or down before it’s drawn, so drag it and watch the wave grow. You start at +0.0 dB.',
      'DC (−30 % to +30 %) adds a constant that lifts or drops the whole wave. Tap DC→0 to snap it back to center.',
      'SIGNAL swaps the sound: SPEECH, KICK DRUM, GUITAR or WHITE NOISE. Leave the tray open to compare their shapes. This KICK DRUM already clips at +0.0 dB; pull GAIN to −2.0 dB to see it clean.',
      'Ø POL flips the polarity, so every push becomes a pull. FULL SCREEN gives the picture the whole phone, which helps when you’re checking for flat tops.',
    ],
    changes: [
      'Push GAIN and the wave grows. Past full scale there’s no bigger number to store, so tops are cut flat and CLIP reads OVER.',
      'Height is peak; RMS is average energy. A spiky sound gives you a big CREST, a steady one a small one.',
      'You can’t hear DC, but it shifts the center, adds to RMS and makes one side clip sooner.',
      'With DC at 0 %, Ø POL flips the wave: every level stays; only the DC readout’s sign flips.',
    ],
    teaches: [
      'Don’t read a tall wave as a loud one. Height shows peak level, not loudness.',
      'Flat tops are clipping, and turning down afterwards can’t rebuild them. That part of the wave was never stored.',
      'Spot a flat line off the center and you’ve found DC offset. True silence sits on the zero line.',
    ],
    tryThis: [
      'On SPEECH, raise GAIN to +2.0 dB: CLIP still says CLEAN (PEAK −0.6). At +3.0 dB it reads +0.4 OVER and the wave turns red.',
      'Back at +0.0 dB, switch SPEECH to WHITE NOISE: CREST drops from 10.0 dB to 4.7 dB. A steady sound leaves little gap.',
      'On SPEECH, slide DC to +30 %: DC reads +31.5 % (the recording carries +1.5 % of its own) and CLIP trips +0.4 OVER. The offset spent your headroom.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  peak: {
    intro: {
      learning: 'What a sample peak meter answers (will it clip?), why peak hold keeps a missed peak on record, and why equal peaks can hide very different average energy.',
      start: 'On KICK DRUM, raise GAIN from −6.0 dB to +0.0 dB and watch the OVER lamp light and OVERS count. Then pull GAIN back down and see PK HOLD keep your highest peak.',
    },
    seeing: [
      'This SAMPLE PEAK meter shows how close your biggest samples get to the ceiling. L and R are segment columns in dBFS, with 0 (full scale) on top.',
      'The segment floating above each bar holds your recent peak. The OVER lamp lights at full scale.',
      'PEAK is your highest sample now, PK HOLD your highest so far, OVERS your separate trips past full scale. CREST under the columns may read a few tenths off the frame’s.',
    ],
    control: [
      'Use GAIN (−12 to +18 dB) to drive the columns up toward the lamp. You start at −6.0 dB, still under it.',
      'SIGNAL gives you KICK DRUM, SNARE, SPEECH or ORGAN. The tray stays open so you can watch the columns react to each one.',
      'RESET HOLD clears your record: it sets PK HOLD back to the current PEAK.',
    ],
    changes: [
      'The bar jumps up at once and falls slowly so your eye can follow. The hold segment waits at the recent maximum.',
      'Hit 0 dBFS or above and PEAK shows OVR, OVERS counts each run of clipped samples and the lamp lights.',
      'GAIN lifts PEAK and RMS together, so CREST, their gap, doesn’t move. You need another SIGNAL to change it.',
      'PK HOLD keeps your highest value after GAIN comes down, so a missed peak stays on record.',
    ],
    teaches: [
      'A peak meter answers one question: will it clip? Don’t ask it how loud a sound feels.',
      'If the OVER lamp is lit, you’re too late: full scale was already hit, and those samples are flat.',
      'Two sounds with the same peak can carry very different average energy.',
    ],
    tryThis: [
      'On KICK DRUM, raise GAIN from −6.0 dB to +0.0 dB: PEAK reads +1.6 OVR, OVERS reads 4 and the lamp lights.',
      'Pull GAIN back to −6.0 dB: PEAK returns to −4.4, but PK HOLD keeps the highest peak you reached until you tap RESET HOLD.',
      'At −6.0 dB, switch KICK DRUM to ORGAN: CREST on the frame falls from 16.1 dB to 4.8 dB. That’s over 11 dB less gap.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  vu: {
    intro: {
      learning: 'Why a VU needle reads average level, which is closer to how loud a sound feels, and why it lags far behind fast peaks on purpose.',
      start: 'Pick SNARE and watch the PEAK lamp flash while the needle only flicks partway up. Then switch SIGNAL to ORGAN and see the needle climb and sit.',
    },
    seeing: [
      'This classic VU meter gives you two answers: a needle on an arc scale for the average, a PEAK lamp for fast peaks. Watch both.',
      'The needle takes about 300 ms to respond, by design, as the badge says. Here, 0 VU sits at an average of about −7.5 dBFS; studios often align it nearer −18 dBFS.',
      'NDL MAX is the highest a 300 ms average reached, in dBFS. Compare it with PEAK, RMS and CREST (their gap).',
    ],
    control: [
      'Push GAIN (−12 to +12 dB) and see how the needle, the lamp and the frame respond. It starts at +0.0 dB.',
      'SIGNAL offers SNARE, ORGAN, PINK NOISE and SPEECH. The tray stays open, so you can swap sounds while the needle answers.',
      'FULL SCREEN shows the meter face across the whole phone, the clearest way to see the needle lag behind the PEAK lamp.',
    ],
    changes: [
      'The needle averages about 300 ms. A snare crack is over before it moves far; a held organ chord keeps pushing, so the needle climbs and sits.',
      'The PEAK lamp reacts at once, so you’ll see it flash on the snare while the needle only flicks partway up.',
      'NDL MAX lands near RMS, far below PEAK on spiky sounds. GAIN moves PEAK, RMS and NDL MAX together; CREST stays put, and only another SIGNAL changes it.',
    ],
    teaches: [
      'The needle reads average level, which is closer to how loud a sound feels. With the PEAK lamp beside it, you see peak vs average at a glance.',
      'If the needle seems broken on drums, it isn’t. A slow needle is a design choice.',
      'Don’t read 0 VU as a ceiling. It’s a reference (nominal) level with headroom above it.',
    ],
    tryThis: [
      'On SNARE: PEAK −1.6, but NDL MAX only −23.0. The needle stays more than 21 dB under the peak.',
      'Switch to ORGAN: PEAK −5.7, NDL MAX −11.3. The peak is lower, yet NDL MAX sits almost 12 dB higher, and the PEAK lamp stays dark.',
      'Now PINK NOISE: broadband and steady, so the needle holds almost still. Equal energy in every octave makes it the reference for system and room checks.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  loudness: {
    intro: {
      learning: 'How LUFS measures loudness the way streaming and broadcast do, over three time windows; why LRA shows dynamics, not loudness; and why true peak can top sample peak.',
      start: 'Pick MUSIC MIX and read the big LUFS INTEGRATED number first. Then switch to SPEECH and compare INTEGRATED and TP GAP. Last, compare LRA on ORGAN and KICK DRUM.',
    },
    seeing: [
      'LOUDNESS · LUFS gives a whole program one number. Read the big LUFS INTEGRATED first, with LRA under it. M and S bars (momentary, short-term) sit at left.',
      'At right, the SHORT-TERM history is about 24 s of program, replayed in about 4 s. STREAMING ≈ −14 marks a common target.',
      'Compare SAMPLE PK with TRUE PK; TP GAP is the difference. MOMENTARY RANGE, below, is the lowest and highest momentary reading.',
    ],
    control: [
      'SIGNAL is your only control: SPEECH, MUSIC MIX, ORGAN or KICK DRUM. Leave the tray open and jump between them to compare the numbers.',
      'Each signal is a fixed clip, so INTEGRATED reads the same every time you pick it.',
      'There’s no GAIN here, so every difference you see comes from the clip itself.',
    ],
    changes: [
      'Three windows, three questions: momentary (400 ms) “loud right now”, short-term (3 s) “this section”, integrated “the whole program”, which skips silence and quiet gaps.',
      'LRA is the spread of the short-term readings. It rises when the level changes from section to section, not because single hits are punchy.',
      'Between two samples the rebuilt wave can rise above both, so TRUE PK can read above SAMPLE PK.',
    ],
    teaches: [
      'LUFS (loudness units, weighted like the ear; 1 LU = 1 dB) is the number streaming and broadcast match programs by.',
      'LRA tells you how dynamic a program is, not how loud.',
      '“No clipped samples” is not “no clipping”: delivery specs set a true-peak ceiling, often −1 dBTP (true-peak level).',
    ],
    tryThis: [
      'On MUSIC MIX: INTEGRATED −15.9 LUFS, TP GAP +0.9 dB. Switch to SPEECH: −23.7 LUFS, and a gap of only +0.4 dB.',
      'Compare ORGAN and KICK DRUM: LRA reads 0.8 LU against 6.7 LU. This kick clip gets louder and softer across its length.',
      'On ORGAN, watch the M bar move a little while the big number holds still: MOMENTARY RANGE spans only −17.3 to −16.0 LUFS.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  spectrum: {
    intro: {
      learning: 'How to read a spectrum by its shape: where the energy sits, smooth noise vs spiky notes, hum from AC power as a family of spikes, feedback as one spike.',
      start: 'Open PATTERN and flip through all seven shapes. Then switch between MAINS HUM and FEEDBACK and watch PEAK jump from 60 Hz to 1.7 kHz.',
    },
    seeing: [
      'A spectrum analyzer shows you where a sound’s energy sits. Frequency runs left to right on a log scale (20, 100, 1k, 10k): 100 to 1k takes the same room as 1k to 10k. Level runs up in dB; bar colors follow it.',
      'The marker labels the tallest point with its frequency.',
      'Careful: PEAK here is a frequency, the tallest point’s. LEVEL is its height (dB rel), and TILT is the overall slope per octave (a doubling).',
    ],
    control: [
      'PATTERN opens SPEECH, CYMBAL, KICK DRUM, GUITAR, MAINS HUM, FEEDBACK and PINK NOISE. Each option describes its shape, and the tray stays open so you can flip through them until each shape looks familiar.',
      'There’s nothing else to set here: the shape is the lesson.',
      'Stuck between two shapes? Long-press PATTERN for its guided-lesson entry.',
    ],
    changes: [
      'Flip through and you’ll see the energy move: voices in the middle, kick and hum low, cymbal high.',
      'Noise draws smooth shapes. A played note draws spikes at whole-number multiples of its pitch, crowding closer toward the right. A lone tone draws one needle.',
      'Don’t expect PINK NOISE (equal energy per octave) to read flat: on this FFT-style (equal-width band) display it falls 3 dB per octave.',
    ],
    teaches: [
      'Read the shape, not each bar: where the energy sits, smooth or spiky, what sticks up.',
      'Beginners call any tall spike hum. Hum from AC power is a family of spikes at the power-line frequency (60 Hz here) and its whole-number multiples; feedback is one spike that grows.',
      'A finished mix usually slopes down like pink noise, not flat.',
    ],
    tryThis: [
      'Switch between MAINS HUM and FEEDBACK: PEAK jumps from 60 Hz to 1.7 kHz (the plot’s marker says 1.75 kHz). You go from a low family to one lone spike.',
      'Pick PINK NOISE: TILT reads −3.0/oct, the reference slope. Then CYMBAL: TILT flips to +5.2/oct.',
      'Pick KICK DRUM: PEAK reads 60 Hz for the thump, and a small second bump sits near 3 kHz. That’s the beater click.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  spectrogram: {
    intro: {
      learning: 'How a spectrogram shows time across, frequency up and level as color, so up means higher pitch, not louder, and why feedback shows as a line growing hotter.',
      start: 'Pick WHISTLE, then FEEDBACK, and compare their single lines: which one gets hotter? Then pick CYMBAL DECAY and set VIEW to SNAPSHOT — FULL 5 s.',
    },
    seeing: [
      'Think of this as a spectrum filmed over time. OLDER ← TIME → NOW runs across, FREQUENCY ↑ runs up, and color is LEVEL, on the HI / LO strip at right.',
      'The film loops every 5 seconds, so a pattern you missed comes around again.',
      'The frame prints the axes so you can’t lose them: TIME (new → right), FREQ (↑ up), LEVEL (= color). MODE says SCROLL or SNAP.',
    ],
    control: [
      'PATTERN paints six sounds: SPEECH, BIRDSONG, CYMBAL DECAY, FEEDBACK, WHISTLE and WHITE NOISE. The tray stays open while the film rolls, so you can see how each one paints.',
      'VIEW sets how you watch. ELAPSED TIME slides the picture left, and NOW is the right edge.',
      'Set VIEW to SNAPSHOT — FULL 5 s to freeze all 5 seconds, so you can read them left to right, like a page.',
    ],
    changes: [
      'Look for three strokes: a held pitch draws a flat line, a moving pitch a slope, and a hit a thin vertical stripe across many frequencies.',
      'Louder means a hotter color, toward HI on the strip, never taller. Height means pitch.',
      'SNAPSHOT shows the whole pattern at once, so you can compare its start with its end.',
    ],
    teaches: [
      'Axes first: time across, frequency up, level as color.',
      'The most common mistake is reading it like a waveform, where up means loud. Here, up means higher pitch.',
      'A steady line is usually a tone. A line that keeps getting hotter is feedback.',
    ],
    tryThis: [
      'Compare WHISTLE and FEEDBACK: both draw one thin line, but only FEEDBACK grows hotter as it runs right. That growth is the danger sign.',
      'Pick BIRDSONG: the lines slope because the pitch itself is moving.',
      'Pick CYMBAL DECAY, then set VIEW to SNAPSHOT — FULL 5 s: the hot top fades from left to right.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  waterfall: {
    intro: {
      learning: 'How a waterfall shows each frequency dying away, why level and decay are different things, and how to spot a ridge that rings longer than its neighbors.',
      start: 'Tap Q RING on and watch RIDGE jump to 1.2 kHz, then tap it off. Slide DAMPING toward PANELS and compare how fast RT·4k and RT·125 fall.',
    },
    seeing: [
      'In this waterfall (CSD, cumulative spectral decay) you watch each frequency die away. Frequency runs across (Hz on the front edge), level up (dB), and TIME toward you: 0s at the back.',
      'Look for a ridge that outlasts its neighbors, marked RINGS. At the start RIDGE reads none: the 250 Hz mode is just under the mark.',
      'RT·125, RT·4k: RT60 (time to fall 60 dB), low vs high. VS NEARBY: how much longer ridges last.',
    ],
    control: [
      'Slide DAMPING through CONCRETE → CURTAINS → CARPET → PANELS: everything soft in the room. You start at CONCRETE · 15%.',
      'EQ (−12 to +12 dB) has three bands. Tap EQ to pick one: 220 Hz · Q6 (narrow), 440 Hz · Q1 (wide) or 1 kHz shelf (everything above). Each band keeps its own gain; FLATTEN ALL BANDS resets them.',
      'ROOM picks the space: CATHEDRAL, CLASSROOM, STUDIO, THEATER or LIVING ROOM. You start on CLASSROOM. REVERB adds NONE, ROOM, PLATE, HALL or SPRING. Both draw the waterfall again from the start.',
      'Q RING adds a narrow, ringing filter at 1.2 kHz. REPLAY draws the waterfall again from the start.',
    ],
    changes: [
      'Add DAMPING and the tail shortens. Highs go first (RT·4k drops fast); lows need thick treatment, so RT·125 hangs on.',
      'EQ changes a region’s height; its decay slope (the RT60) stays the same, so a taller region simply takes longer to reach the floor.',
      'A REVERB decaying slower than the room shows up; a faster one hides under the room’s tail.',
      'Q RING stores energy in the filter itself, so a thin ridge lingers.',
    ],
    teaches: [
      'Taller doesn’t mean longer. Level and decay slope are different things: a broad EQ moves level, absorption moves decay.',
      'Decay depends on frequency, so one RT60 number never tells the whole story.',
      'Any ridge that outlasts its neighbors is ringing: a room mode, a resonant speaker or a high-Q filter.',
    ],
    tryThis: [
      'At the start, tap Q RING on: RIDGE jumps to 1.2 kHz and VS NEARBY to 3.0×. The filter itself rings. Tap it off again.',
      'Still at the start, boost EQ to +12 dB on 220 Hz · Q6: that region starts taller, yet RT60 · 250 Hz below the display stays at 2.21 s.',
      'Last, slide DAMPING all the way down (CONCRETE · 0%): RIDGE reads 251 Hz and VS NEARBY 1.7×. Now the classroom’s mode rings.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  phase: {
    intro: {
      learning: 'How correlation shows whether left and right move together, and why a mix near −1 can sound wide in stereo yet cancel when summed to mono.',
      start: 'Read CORR and MONO FOLD at the start. Drag PHASE to 180° and watch both fall. Then set WIDTH to 0 % and see the two channels cancel completely.',
    },
    seeing: [
      'Here you compare left with right. The CORRELATION bar runs −1 to +1 (red, amber, green zones), with its ρ (correlation) reading.',
      'Below it, a goniometer draws a dot cloud. L and R run on the diagonals, so mono stands upright.',
      'Under the display, the lit zone (MONO-SAFE, WIDE / UNRELATED or MONO-DEATH) and the MONO-FOLD VERDICT say it in words. MONO FOLD is the level change when L and R are summed to mono.',
    ],
    control: [
      'PHASE (0° to 180°, R vs L) takes R from moving with L to polarity-opposite. It starts at 0°. Trust its two ends; the readings in between are only a rough guide.',
      'Use WIDTH (0 to 100 %) to set how different the two channels are. It starts at 35 %.',
      'There’s no sound to pick here. These two faders are the whole experiment.',
    ],
    changes: [
      'Correlation compares L and R moment by moment: +1 = they move together, 0 = unrelated, −1 = one pushes while the other pulls.',
      'Take PHASE to 180° and R opposes L, so CORR dives and MONO FOLD falls. Summed, the two cancel.',
      'Add WIDTH and the channels share less, so CORR falls toward 0 and the cloud grows fatter. A vertical line is mono, a flat line anti-phase.',
    ],
    teaches: [
      'The bar’s green zone and the SAFE verdict start at +0.5. Below that, check the mix in mono.',
      'Near −1 a mix can sound huge on speakers and collapse on a mono PA or a phone, so don’t trust the stereo sound alone.',
      'Width borrowed from out-of-phase tricks is paid back in mono.',
    ],
    tryThis: [
      'At the start: CORR +0.91, MONO FOLD −0.2 dB — SAFE. Drag PHASE to 180°: CORR −0.91, MONO FOLD −13.6 dB — CANCELLATION.',
      'Set WIDTH to 0 % with PHASE at 180°: CORR −1.00 and MONO FOLD −112.5 dB, the bottom of the meter. The two channels cancel completely.',
      'PHASE back to 0°, WIDTH up to 100 %: CORR −0.01 (unrelated), MONO FOLD −3.1 dB — RISKY: wide, and thinner in mono.',
    ],
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  stereo: {
    intro: {
      learning: 'How Mid (what both channels share) and Side (what differs) set stereo width, and why anything in Side disappears when the mix is summed to mono.',
      start: 'Step PRESET from MONO to NARROW to WIDE and watch MID (SHARED) fall as SIDE (DIFF) grows. Then pick HARD L-R and look at the middle of the image.',
    },
    seeing: [
      'Module 8 gave you a number; this display gives you a picture. It shows where the sound sits across L, C and R, with MID and SIDE bars below it and the preset’s name.',
      'MONO is one point at the center. Wider presets spread toward the speakers.',
      'PRESET names your setting. MID (SHARED) is what both channels have in common, and SIDE (DIFF) is what differs between them.',
    ],
    control: [
      'PRESET holds MONO, NARROW, WIDE, HARD L-R and MID-SIDE. Each option has a description, and the tray stays open so you can read it while the image changes.',
      'There are no faders here: each preset is a position, so compare them side by side.',
      'Each tap moves the image and the MID and SIDE bars together, so read both.',
    ],
    changes: [
      'Mid = L + R, the shared part. Side = L − R, the difference.',
      'As Side grows compared to Mid, you get a wider image and less center focus.',
      'A sound in only one speaker is half Mid, half Side; a centered sound has no Side at all.',
      'Summing to mono keeps only the Mid, so whatever lives in Side disappears.',
    ],
    teaches: [
      'Width is the ratio of Side to Mid, not a separate effect you add.',
      'Wide is a position, not a quality: what the sides gain, the center loses.',
      'That’s why the anchors of a mix (vocal, bass, kick) usually stay in the Mid.',
    ],
    tryThis: [
      'Step from MONO to NARROW to WIDE: MID (SHARED) reads 100 %, then ≈85 %, then ≈55 %, as SIDE (DIFF) grows.',
      'Pick HARD L-R: about half and half (≈50 % each), and a hole opens in the middle of the image.',
      'Pick MID-SIDE: the readouts switch to words, shared and difference. It’s the same signal, described another way.',
    ],
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  scope: {
    intro: {
      learning: 'How an oscilloscope shows the raw voltage over time, how harmonics give each wave its shape, and how X-Y mode draws left against right.',
      start: 'Switch SIGNAL between SINE and SQUARE and compare the shapes. Then tap X-Y and drag PHASE to 180°: the line tips onto the other diagonal.',
    },
    seeing: [
      'Nothing is averaged or weighted here: an oscilloscope draws the voltage itself against time. The TRIG mark is the trigger, where each left-to-right sweep starts, so CH 1 · SWEEP LOCK holds a repeating wave still.',
      'In X-Y mode (X = L · Y = R) the left channel moves the dot across and the right moves it up.',
      'MODE tells you which view you’re in, TIME or X-Y. SIGNAL reads in TIME; CORR and WIDTH read only in X-Y.',
    ],
    control: [
      'SIGNAL draws SINE, SQUARE, TRIANGLE, SAW, SPEECH or MUSIC, and the tray stays open so you can compare traces. Picking one in X-Y goes back to TIME: X-Y draws its own stereo pair.',
      'The X-Y key switches between TIME and X-Y.',
      'WIDTH (0 to 100 %) and PHASE (0° to 180°, R vs L) shape that stereo pair. Both start at 0. Moving either one switches X-Y on, so tap X-Y to get back to TIME.',
    ],
    changes: [
      'Each wave’s shape comes from its harmonics: a sine has none, a square has fast edges, this saw ramps down, then snaps back up.',
      'Real signals (SPEECH, MUSIC) never repeat, so there is no single shape to hold still.',
      'In X-Y, identical channels draw a 45° line. PHASE toward 180° tips it onto the opposite diagonal, and WIDTH opens it into a cloud.',
    ],
    teaches: [
      'Peak, VU and loudness meters summarize a signal; the scope shows what it does right now, the rawest view.',
      'Flat tops a wave wasn’t born with mean it clipped here or earlier, whatever later meters say. SQUARE is born flat; SINE isn’t.',
      'A studio goniometer (Module 8) turns this plot 45°, so mono stands upright there. Same data, two conventions.',
    ],
    tryThis: [
      'Switch between SINE and SQUARE: one smooth curve, then flat shelves with near-vertical edges.',
      'Tap X-Y: a thin 45° line and CORR +1.00 — mono. Drag PHASE to 180°: the other diagonal, CORR −1.00.',
      'Back at PHASE 0°, raise WIDTH to 100 %: the line opens into a cloud and CORR falls to −0.01. The channels are now unrelated.',
    ],
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  detective: {
    intro: {
      learning: 'How each fault leaves its own picture in level, frequency, time or stereo, and why you name the display and read its axes before judging what’s wrong.',
      start: 'Answer WHAT METER IS THIS? first: say what runs across and what runs up before you tap. Then work through the other three questions and use CASE › for the next case.',
    },
    seeing: [
      'You’re the detective here. Each case gives you a meter with its name hidden and a real-world fault in the signal. You’ve met every one of these meters in Modules 1–10.',
      'The evidence stays on top. Below it, one question at a time: WHAT METER IS THIS?, WHAT DOES IT SHOW?, WHAT PROBLEM DO YOU SEE?, then WHAT PROCESSOR/ACTION FIXES IT?',
      'CASE and QUESTION keep your place. SOLVED counts your right answers so far.',
    ],
    control: [
      '‹ CASE and CASE › at the bottom of the screen move you between the seven cases. A new case starts at its first question.',
      'Tap an answer. A wrong one gives you a hint and another try; the right one opens the explanation. The answers are shuffled each time.',
      'Under the question, ‹ PREVIOUS steps back and NEXT QUESTION › steps on. After the last question it becomes NEXT CASE ›.',
    ],
    changes: [
      'Each case swaps in a different display and fault, so your first job is always to name the display.',
      'A right answer adds to SOLVED. You pass Signal Detective once every question of every case has been answered right.',
      'The order never changes: name it, read its axes, spot what’s wrong, then decide whether, and how, to fix it.',
    ],
    teaches: [
      'Each fault leaves its own picture, and one display shows it best.',
      'Faults live in level, frequency, time or stereo, and each needs its own display.',
      'A fix comes after the reading: first know what the display measures, then decide whether anything is wrong.',
    ],
    tryThis: [
      'Before you answer WHAT METER IS THIS?, say what runs across and what runs up. The axes and markings name the meter.',
      'Pick a wrong answer on purpose and read the hint: it points at the clue you missed.',
      'Cycle the deck with CASE › until you can name each display at a glance.',
    ],
  },
};
