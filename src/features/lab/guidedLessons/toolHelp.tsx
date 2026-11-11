/**
 * toolHelp — per-control "what it does" help for the MEASUREMENT TOOLS (owner
 * request 2026-07-26). The tools aren't LabIds, so their content lives here as
 * LessonContent (the renderable shape the GuidedLessonSheet uses) and rides the
 * SAME two-tier popup as the labs: a small "what this control does / shows on
 * this screen" first, "Learn more" for the full stack.
 *
 * Honesty (§1.7): these describe what a control does and what a readout SHOWS —
 * they never claim a calibrated measurement (the tools already badge their own
 * dBFS/uncalibrated limits).
 */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { GuidedLessonSheet } from './GuidedLessonSheet';
import type { LessonContent } from './types';

export type ToolId =
  | 'signalgen'
  | 'rta'
  | 'spectrogram'
  | 'spl'
  | 'waveform'
  | 'freqcounter'
  | 'rt60'
  | 'multimeter';

export const TOOL_LESSONS: Record<ToolId, LessonContent> = {
  // ── Signal Generator ──────────────────────────────────────────────────────
  signalgen: {
    name: 'Signal Generator',
    tagline: "Make a known test signal.",
    whatItIs:
      "The Signal Generator plays a test signal you choose, so you know exactly what goes in. Send it through a speaker, a room or a cable run, and anything that changes on the way comes from that system, not the source. Pick SIGNAL first: a pure SINE, a noise color, a sweep, CLICK or BURST. The WAVEFORM is a drawing of what you built, not a microphone capture. The frequency it plays is very close to what you set; LEVEL is in dBFS, not a measured sound level.",
    controls: [
      { key: "signal", name: "SIGNAL", range: "SINE · WHITE to VIOLET · SWEEP LIN/LOG · CLICK · BURST", definition: "Picks the test signal. SINE is one pure frequency; WHITE to VIOLET are noise, every frequency at once with a different tilt; SWEEP LIN and SWEEP LOG glide a tone; CLICK and BURST test timing.", practical: "Match the signal to the question: pink noise for overall tonal balance on an analyzer, a slow sweep to find a rattle or a boom, a click to hear echoes and delays." },
      { key: "frequency", name: "FREQ", range: "Fader 63 Hz–6 kHz · FINE 20 Hz–20 kHz · presets to 16 kHz", definition: "Sets the pitch of SINE and BURST in hertz (Hz), cycles per second. Slide the FREQ fader, or open PRESET for ISO PRESETS and FINE steps of one semitone.", practical: "ISO PRESETS are the standard octave centers that analyzers and graphic EQs use, so a preset tone lands right in the middle of a band you can read." },
      { key: "sweep", name: "SWEEP", range: "START 20 Hz–1k · END 2k–20k · 5, 10 or 30 s", definition: "Glides a tone from START to END over the DURATION you pick, once or on REPEAT. SWEEP LOG spends equal time in every octave; SWEEP LIN races through the bass and crawls through the highs.", practical: "Play a slow sweep through a speaker and listen for the point where something rattles, buzzes or booms. Recorded and analyzed, a log sweep is a standard way to measure frequency response." },
      { key: "click_tempo", name: "TEMPO", range: "60 · 90 · 120 · 150 BPM", definition: "Sets how often CLICK repeats, in beats per minute (BPM). Each click is a very short, sharp sound with silence after it, so an echo or a delay stands apart from it.", practical: "A slow tempo leaves a long gap after each click, so you can hear a room’s echoes or a system’s delay before the next click arrives." },
      { key: "output_level", name: "LEVEL", range: "−60 to 0 dBFS in 3 dB steps · default −20", definition: "Sets how strong the signal is, counted down from 0 dBFS, the digital maximum. It is dBFS, not a measured sound level: how loud you hear it depends on your volume and speaker.", practical: "Start low with the volume down, then raise LEVEL only as far as the test needs. Above −12 dBFS you must confirm first, because the tone can then hurt ears or speakers." },
      { key: "safety", name: "SAFETY", definition: "Five warnings to read before any test: low tones can damage speakers, loud tones can damage hearing and tweeters, start low every time, check the gain before a power amplifier, and this output is not a calibrated reference.", practical: "On the phone’s own speaker, the very lowest tones are filtered out to protect its tiny driver, so you don’t hear the whole signal down there. Judge low end on full-range speakers, or on headphones at a low volume." },
      { key: "status", name: "OUTPUT", definition: "Shows the level actually leaving the generator while it plays, in dBFS, not a measured sound level. OUT shows it too, GEN reads RUN or STOP, and CAP −12 dBFS means the cap is on.", practical: "Check GEN and OUT before you touch the volume: GEN tells you whether the signal is really playing, and OUT tells you its digital level." },
    ],
    commonMistakes: [
      "“The phone speaker plays any tone I set.” A phone speaker can’t reproduce deep bass, and pushed hard it distorts or gets damaged. Judge the true low end on full-range speakers, or on headphones with the volume turned down first.",
      "“OUT tells me how loud it is in the room.” OUT is dBFS, not a measured sound level. The same −20 dBFS sounds louder or softer with your volume, your speaker and your distance.",
      "“One look at an analyzer mid-sweep shows the whole response.” A sweep moves: each moment shows only the frequency playing then. Watch the whole pass, or use pink noise for every band at once.",
      "“White noise is the neutral test noise.” White has equal energy per hertz, so the top octaves hold the most: it sounds hissy. Pink has equal energy per octave, and we hear pitch in octaves.",
      "“SWEEP LIN and SWEEP LOG are the same sweep.” LIN moves at constant hertz per second, so it rushes the bass. LOG spends equal time in every octave, so it sounds even.",
      "“A generator’s level is a lab reference.” Here the frequency is very close, but the level isn’t calibrated. For a measurement someone will rely on, engineers use dedicated signal-generation gear.",
    ],
    proTips: [
      "Choose PINK at a low LEVEL, then open the RTA. Pink spreads its energy evenly across octaves, so a bump or dip you see comes from the speaker, the room or the microphone.",
      "Choose CLICK, set TEMPO to 60 BPM and play it in a large, hard-walled room. The silence after each click lets you hear the echoes die away.",
      "Choose SINE and step up through the ISO PRESETS from 63 Hz on the phone speaker. At the same LEVEL the lowest tones sound much weaker: the speaker is losing them, not the signal.",
      "Before you feed a power amplifier, turn the amplifier down and check the gain in between. Then raise LEVEL from low, one 3 dB step at a time.",
    ],
    formula: "Time between clicks = 60 ÷ BPM seconds · FINE step: f × 2^(1/12) · 0 dBFS = digital full scale. Each click arrives 60 divided by the tempo seconds after the last, each FINE step moves the pitch one semitone, and LEVEL counts down from the digital maximum.",
    outcomes: [
      "Why you need a known test signal before you can say what a speaker or a room changed.",
      "Which signal suits which question: a sine, pink noise, a sweep or a click.",
      "Why the generator’s level is dBFS, not a measured sound level, and why every test starts quiet.",
    ],
    steps: [
      { do: "With SIGNAL on SINE, keep LEVEL low and your volume down, then tap START.", notice: "GEN changes from STOP to RUN, and OUT shows the level in dBFS.", why: "Every test starts quiet, and OUT is a digital level, not a measured sound level." },
      { do: "Slide FREQ from the bottom of the fader to the top.", notice: "The tone rises from 63 Hz to 6 kHz, and the WAVEFORM drawing packs in more cycles.", why: "Frequency is cycles per second: more cycles in the same time is a higher pitch." },
      { do: "Push LEVEL toward the top, then tap CANCEL on the warning that appears.", notice: "LEVEL stops at −12 dBFS and asks you to confirm before it goes higher.", why: "The generator can’t know your volume setting, so its digital level has a safe ceiling." },
      { do: "Switch SIGNAL to WHITE, then PINK, then BROWN.", notice: "FREQ in the readouts reads BROADBAND, and the sound slides from hiss toward rumble.", why: "Noise holds every frequency at once; its color is the balance of lows and highs." },
      { do: "Choose SWEEP LOG and tap START.", notice: "The tone glides from 20 Hz to 20 kHz; when a single pass ends, Sweep finished appears under the title.", why: "A sweep visits one frequency at a time, so you hear where a speaker or a room reacts." },
      { do: "Choose CLICK and set TEMPO to 60 BPM.", notice: "One click arrives every second, with silence between.", why: "60 ÷ BPM gives the gap; a long gap leaves room to hear echoes." },
    ],
  },

  // ── RTA (Real-Time Analyzer) ──────────────────────────────────────────────
  rta: {
    name: 'Real-Time Analyzer',
    tagline: "Energy per frequency band, live.",
    whatItIs:
      "The RTA (real-time analyzer) splits the sound reaching your phone’s microphone into frequency bands, lows on the left and highs on the right, and draws each band’s energy as a bar, live. You may have read spectrum shapes in Visual Audio Analysis; here they come from real sound. Read the shape: where energy piles up or falls away. Every level is relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading. The bars show energy, not EQ advice, and where you hold the phone changes them.",
    controls: [
      { key: "banding", name: "BANDS", range: "7 · 10 · 15 · 31 · 61", definition: "Sets how many bars split the spectrum: 7, 10, 15, 31 or 61. Fewer, wider bands read at a glance; more show detail, from one band per octave at 10 to one per third-octave at 31.", practical: "31 bands share the spacing of a 31-band graphic EQ, the live-sound standard, and sit close to how we hear tonal balance. Use 61 to isolate a single problem frequency." },
      { key: "averaging", name: "AVG", range: "FAST · MED · SLOW · 5 SEC · STD / HI-RES", definition: "Opens AVERAGING, which smooths the bars over time: FAST reacts at once, SLOW and 5 SEC settle into a steady shape. RESOLUTION and RESET PEAK HOLD sit in the same tray.", practical: "Use FAST to see what changes, like a kick drum hit; use SLOW or 5 SEC to judge a room’s or a mix’s overall balance. HI-RES sharpens the low bands but responds more slowly." },
      { key: "level", name: "LEVEL", range: "Z-WEIGHTED · A-WEIGHTED · C-WEIGHTED", definition: "The overall level the mic hears right now, in relative dB (dB, dBA or dBC), not a calibrated sound level meter reading. Pick its weighting in VIEW: Z is flat, A turns the lows down hard, C only gently.", practical: "Compare Z and A on the same sound: a big drop means much of the energy is low bass. A copies how the ear hears at quiet levels." },
      { key: "peak_hold", name: "PK HOLD", definition: "The highest instant peak of the whole waveform since the last reset. It turns red once a peak reaches 0 dB (full scale) and stays red until you tap RESET PEAK HOLD in AVG.", practical: "A clap or a bump on the phone can push PK HOLD to 0 while every bar stays low: one very short spike spreads its energy across many bands and is averaged away." },
      { key: "bands", name: "BANDS", definition: "The readout on the display that shows how many bands you are looking at. It always matches the BANDS key at the bottom of the screen." },
      { key: "marks", name: "What the display shows", range: "0 to −90 dB · 0 dB = full scale", definition: "Each bar is one band, lows left and highs right; its height is that band’s level in relative dB. A dash above a bar is its peak, and a gray slot is a band too narrow to measure here.", practical: "Tap or drag on the bars to read one band’s center in Hz and its level. At 61 bands the lowest bars share a reading: the rumble is real, its exact pitch is coarse." },
    ],
    commonMistakes: [
      "“A good system makes the analyzer flat.” Flat is not the goal. The RTA shows where the energy sits; your ears decide whether it sounds right.",
      "“The bars show the room’s sound level.” They are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading. Read the shape across the bands, not the numbers.",
      "“The jumpy picture is the one to judge.” Music and speech change every instant. Set AVERAGING to SLOW or 5 SEC before you judge tonal balance.",
      "“PK HOLD can’t be higher than the tallest bar.” PK HOLD is the whole waveform’s peak. A clap’s energy spreads over many bands and is averaged, so each bar stays low.",
      "“LEVEL in dBA is a sound level reading.” Here A and C only change which frequencies count. The level is still relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading.",
      "“Where I hold the phone doesn’t matter.” Microphone position strongly affects the result: close to a wall, the lows swell. Measure from the same spot each time.",
    ],
    proTips: [
      "Feed pink noise and look for the overall tilt. Pink noise alone reads even across 1/3-octave bands, so any tilt or bump comes from the system and the room.",
      "Use 31 bands for tonal decisions and 10 for a quick glance. Switch to 61 when you need to pin down one ringing frequency.",
      "Open VIEW, turn PIANO ON and play or sing one steady note. The key it lands on lights up, linking a band on the display to a musical pitch.",
      "Clap once near the phone and watch PK HOLD jump while the bars barely move. Then tap RESET PEAK HOLD in AVG before your next reading.",
    ],
    formula: "1/N-octave band: edges = fc × 2^(±1/2N) · band level = 10·log₁₀(Σ power) dB, with 0 dB = full scale. Each band runs from its center frequency divided by 2^(1/2N) to the center times 2^(1/2N), and its bar shows the total power inside it, in relative dB.",
    outcomes: [
      "How an analyzer splits sound into frequency bands, and what band width hides or shows.",
      "Why averaging changes what you can judge on a live display.",
      "Why these levels are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading, so you read the shape rather than the numbers.",
    ],
    steps: [
      { do: "Speak, then clap once near the phone.", notice: "CAPTURE reads LIVE, the bars follow your voice, and PK HOLD jumps on the clap while the bars stay low.", why: "PK HOLD is the whole waveform’s peak; each bar is only one band’s averaged share of the energy." },
      { do: "Play PINK from the Signal Generator at a low LEVEL, with BANDS on 31.", notice: "The bars settle into a row; the bumps and dips show what the speaker, the room and the mic did to it.", why: "Pink reads even across 1/3-octave bands, so the shape you see belongs to the system." },
      { do: "Switch BANDS from 31 to 10, then to 61.", notice: "The line above the bars changes from 1/3 OCT to 1/1 OCT to 1/6 OCT, and the bars get wider, then narrower.", why: "Wide bands average detail away; narrow bands show single peaks." },
      { do: "Open AVG and switch AVERAGING from FAST to 5 SEC while you talk.", notice: "The bars stop jumping and drift slowly toward a steady shape.", why: "Averaging trades speed for a steady picture you can judge." },
      { do: "Play BROWN from the Signal Generator, then in VIEW switch from Z-WEIGHTED to A-WEIGHTED.", notice: "LEVEL drops, because A-weighting turns the lows down hard.", why: "Weighting changes which frequencies count; the level is still relative dB, not a calibrated sound level meter reading." },
    ],
  },

  // ── Spectrogram ───────────────────────────────────────────────────────────
  spectrogram: {
    name: 'Spectrogram',
    tagline: "Frequency over TIME.",
    whatItIs:
      "The Spectrogram draws sound as a scrolling picture. Time runs left to right, with the newest sound at the right edge; frequency runs up; color shows level. It shows how a sound changes: a sweep climbing, a note dying away, harmonics appearing and fading. A single spectrum, like the RTA’s bars, shows only one moment. The colors are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading, with 0 dB (full scale) at the top of the color scale.",
    controls: [
      { key: "db_range", name: "DYN RANGE", range: "40 dB · 60 dB · 80 dB", definition: "Sets how far below 0 dB (full scale) the colors reach. A wider range shows faint detail, and more background noise; a narrower one shows only the strongest sound.", practical: "Widen it to see a reverb tail or a quiet hum; narrow it to pick out the loudest parts of a busy sound. It changes only the colors, not what is captured." },
      { key: "obs_max", name: "OBS MAX", definition: "The loudest level anywhere in the picture you are looking at, in relative dB. The colors never rescale to it: 0 dB (full scale) stays at the top, so older columns keep their color.", practical: "If OBS MAX sits below the bottom of your DYN RANGE, nothing reaches the colors and the picture stays dark. Widen the range or bring the sound closer." },
      { key: "peak", name: "PEAK", definition: "The highest instant level of the whole waveform right now, in relative dB, not a calibrated sound level meter reading.", practical: "A clap can push PEAK near 0 while its colors stay modest, because its energy spreads across every frequency row at once." },
      { key: "history", name: "HISTORY", range: "0/160 to 160/160", definition: "How many time columns the picture holds, out of 160. Each column is one 125 ms slice; once it is full, the oldest slice drops off as each new one arrives.", practical: "SPEED makes each column wider, so the picture scrolls faster and shows fewer seconds. The line under the display says how many seconds are visible." },
      { key: "marks", name: "What the display shows", definition: "Time runs left to right, newest at the right; frequency runs up, low at the bottom; color is level, as on the COLOR = LEVEL strip. A steady tone draws a flat line, a sweep a rising streak.", practical: "A fading tail after a bright onset is the room’s reverb dying away. Faint speckle across the background is the noise floor of the mic and room, not a sound you made." },
    ],
    commonMistakes: [
      "“Higher on the screen means louder.” Up means higher frequency, not more amplitude; level is the color. This view shows frequency over time, not the waveform.",
      "“A narrow DYN RANGE gives the truer picture.” It hides quiet detail like reflections and reverb tails. Widen it to reveal them; it changes only the colors, not the capture.",
      "“The colors show the sound level in the room.” They are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading. Read where the energy sits and how it changes.",
      "“FREEZE pauses the recording so I can carry on later.” Nothing is recorded while frozen, and RESUME starts a fresh timeline. Freeze to study a moment, not to pause a take.",
      "“A spectrogram shows every detail in time and frequency.” Each column is one 125 ms slice, so faster events blur together. The analysis settings always trade time detail against frequency detail.",
    ],
    proTips: [
      "Send a slow SWEEP LOG from the Signal Generator and watch the rising streak. A brighter stretch, or a tail lingering behind it, marks a resonance; a dim stretch marks a dip.",
      "Play CLICK in a large, hard-walled room. Each click draws a bright vertical line; the fading tail after it is the room’s reverb, and a separate repeat later is an echo.",
      "Sing or play one held note. You see a stack of parallel lines: the fundamental at the bottom, its harmonics above. Watch the upper lines fade first as the note dies.",
      "Set SPEED to 3× for short sounds like speech. Each column gets wider, so syllables spread out where you can read them.",
    ],
    formula: "Column = one FFT of 4096 samples · bin k sits at k × fs ÷ N Hz · color = 10·log₁₀(power) dB, with 0 dB = full scale. Each column is one frequency analysis of a short slice of sound, bin k sits at k times the sample rate (fs) divided by the FFT size (N), and its color shows that power in relative dB.",
    outcomes: [
      "How a spectrogram shows time, frequency and level in one picture.",
      "Why a spectrogram shows how a sound changes, which a single spectrum can’t.",
      "Why DYN RANGE changes what you see but not what was captured, and why its levels are relative dB, not a calibrated sound level meter reading.",
    ],
    steps: [
      { do: "Hum or whistle one steady note.", notice: "A flat line appears at the right edge and scrolls left.", why: "A steady pitch is one frequency held over time; height means frequency, not loudness." },
      { do: "Whistle a note that slides upward.", notice: "The line climbs as it scrolls.", why: "Rising pitch over time draws a rising streak." },
      { do: "Clap once.", notice: "A bright vertical line runs from bottom to top with a fading tail, and PEAK jumps.", why: "A clap holds many frequencies at once for a very short time; the tail is the room." },
      { do: "In a quiet room, switch DYN RANGE from 40 dB to 80 dB.", notice: "Faint speckle fills the background of the whole picture, older columns included.", why: "The range sets how far below 0 dB (full scale) the colors reach; that quiet energy was captured all along." },
      { do: "Tap FREEZE, study the picture, then tap RESUME.", notice: "The picture stops while PEAK keeps moving; RESUME clears it and starts a fresh timeline.", why: "Nothing is recorded while frozen, and a gap of unknown length can’t sit on a steady time axis." },
    ],
  },

  // ── SPL Meter ─────────────────────────────────────────────────────────────
  spl: {
    name: 'SPL Meter',
    tagline: "How loud the room is, estimated.",
    whatItIs:
      "Sound pressure level, in dB SPL, measures how hard sound pushes on the air, compared with 20 µPa, about the quietest sound people hear. A phone can’t measure that directly. Its mic gives a digital level in dBFS, counted down from the converter’s ceiling, 0 dBFS. This meter adds an offset to estimate dB SPL. Every number is an estimate from your phone’s mic, not a calibrated sound level meter reading; calibrating against a real one brings it close, but it stays approximate. WEIGHTING and RESPONSE then shape the number.",
    controls: [
      { key: "weighting", name: "WEIGHTING", range: "FS · A · C · SPL (flat)", definition: "Picks the frequency curve applied before measuring. A cuts the lows the way quiet-level hearing does, C is nearly flat, SPL is flat (Z), and FS shows the raw digital level in dBFS.", practical: "Hearing-risk limits are written in dBA, so use A for noise exposure. Use C to set monitor levels or to check loud, bass-heavy sound, where A would hide the lows." },
      { key: "range", name: "RANGE", range: "40 · 60 · 80 · 90 · 100 · AUTO", definition: "Sets the level that reads 0 on the VU; the −20 mark sits 20 dB below it. AUTO follows your room so the needle keeps swinging; RANGE moves the window you watch, never the measurement.", practical: "A needle pinned at either end shows no change at all. Engineers set a meter’s window so the level they care about moves on-scale." },
      { key: "response", name: "RESPONSE", range: "FAST · SLOW · 5 SEC AVG", definition: "Sets how fast the number reacts. FAST (125 ms) follows quick changes, SLOW (1 s) steadies a continuous sound, and 5 SEC AVG averages the sound energy of the last 5 seconds.", practical: "Noise rules name the response they use, so match it when you compare readings. SLOW suits steady noise like an air conditioner; FAST catches short bursts like a slammed door." },
      { key: "calibration", name: "CALIBRATION", range: "UNCALIBRATED · FIELD-CALIBRATED · +offset dB", definition: "Matches this phone to a real sound level meter. Play steady pink noise, tap CALIBRATE, step the reading with −5, −0.5, +0.5 and +5 until both meters agree, then tap SET.", practical: "Engineers check a meter against a reference before readings that matter. This field calibration is stored on this phone only and stays approximate: it is not a certified instrument calibration." },
      { key: "reading", name: "The big number", range: "dBFS · dBA · dBC · dB SPL", definition: "The level right now, with your WEIGHTING and RESPONSE applied. The line under it says uncalibrated estimate, field-calibrated · approximate, or raw digital level · uncalibrated (dBFS); tap the number to see it full screen.", practical: "Always write a level down with its weighting and response, such as dBA and SLOW. Without them, nobody can compare your number with theirs." },
      { key: "peak", name: "PEAK", definition: "The highest instant in the raw, unweighted signal right now, on the same estimated scale. CLIP appears when that peak reaches 0 dBFS: a limit of the phone’s converter, not a measure of the room.", practical: "When CLIP shows, the true peak was higher than any number on screen, so the reading can’t be trusted. Move the phone farther from the source until CLIP stops." },
      { key: "peak_hold", name: "PEAK HOLD", range: "PEAK HOLD key: OFF · 1s to 1 HR", definition: "Keeps the highest peak since you last reset it, so a burst too short to see stays on screen. Tap the PEAK HOLD reading to reset it.", practical: "After a loud moment, such as a drum hit or a cheer, check PEAK HOLD to see how high it went. The PEAK HOLD key sets how long the LED meter’s peak marker lingers." },
      { key: "session_log", name: "SESSION LOG", definition: "Shows Leq, the steady level that would carry the same sound energy as everything measured since RESET LOG. It reads Leq · dBA, Leq in the WEIGHTING you’ve chosen, and ELAPSED; SAVE LOG stores it.", practical: "Noise exposure and venue limits are judged with Leq: one number for how loud it was overall. Because it averages energy, not decibels, loud moments count far more than quiet ones." },
      { key: "control_room", name: "CONTROL-ROOM MONITORING · dB SPL (C-WEIGHTED)", range: "79 small room · 82 medium · 85 large", definition: "Explains the gold band in STUDIO mode and the 79–85 dB(C) monitor calibration levels, set with pink noise at −20 dBFS, one speaker, C-weighted, SLOW. 85 is the SMPTE / THX reference for large rooms; 79 and 82 are common small-room practice. It isn’t a level for the music itself.", practical: "Many engineers mix lower: 70–75 for long sessions, 60–65 for detailed work, with brief 85–95 checks. Very quiet mixing misleads you, because your ears hear less bass at low levels." },
      { key: "gauge", name: "SPL REFERENCE GAUGE", definition: "A round dB SPL scale that always shows the 5-second average, whatever RESPONSE is set to. The center number takes the color of its zone; tap the gauge to see it full screen.", practical: "Use it to see where a level sits against known references at a glance. Its marks are references, not certified readings, and its numbers are estimates until you calibrate." },
      { key: "mode", name: "STUDIO / SPL / OPTIMAL", range: "STUDIO · SPL · OPTIMAL", definition: "Changes what the gauge’s labels describe. STUDIO marks control-room monitoring levels, SPL marks everyday reference sounds, and OPTIMAL marks reference-listening bands from AMBIENT up to LIMIT.", practical: "In SPL and OPTIMAL the arc reads as a loudness scale, rising through the colors to red at the top. Hearing risk starts near 85 dBA over a full working day." },
      { key: "marks", name: "What the display shows", definition: "On SPL METER HOME, watch the VU needle, the tall LED bar with peak and average, and the SPL REFERENCE GAUGE. Tap DIGITAL › for PEAK, PEAK HOLD, the big number, the SESSION LOG and CALIBRATION.", practical: "Each display answers a different question. The VU shows how the level moves, the LED catches peaks, the big number gives a value to write down, and Leq sums up the session." },
    ],
    commonMistakes: [
      "Thinking an uncalibrated phone reading is true dB SPL. It’s an estimate from your phone’s mic, not a calibrated sound level meter reading. Calibrating against a real one brings it close, but it stays approximate.",
      "Thinking dBFS and dB SPL are the same scale. dBFS measures the digital signal below its 0 dBFS ceiling; dB SPL measures air pressure. The same dBFS can mean different room levels on two phones.",
      "Using A to judge loud, bass-heavy sound. A-weighting cuts the lows, so it under-reads a kick drum or a subwoofer. C or flat SPL shows that low-frequency energy.",
      "Comparing a FAST reading with a SLOW one. They average over different times, so a clap reads higher on FAST. Pick one response and keep it for every reading you compare.",
      "Trusting the numbers while CLIP shows. The converter hit 0 dBFS, so the real peak and level were higher than the screen says. Move the phone farther from the source and measure again.",
      "Thinking a phone mic is a measurement mic. It’s built for voices: it loses deep bass, adds noise in quiet rooms, clips at very loud levels, and the phone may process the sound.",
    ],
    proTips: [
      "For a room or background-noise check, use A with SLOW, or tap RESET LOG, let the SESSION LOG run for a while, and read Leq · dBA.",
      "Calibrate against a real sound level meter with steady pink noise, with the same weighting and response on both. The offset stays on this phone, so recheck it now and then.",
      "Before you measure something loud, open DIGITAL › and watch PEAK. If CLIP appears, move back until it stops; only then do the level numbers mean anything.",
      "To set a monitor level, play pink noise at −20 dBFS through one speaker, pick C and SLOW, and raise the speaker until the gauge reads the level for your room size: 79, 82 or 85.",
      "Write each reading down with its weighting, response and your distance from the source. Moving closer to a source raises the level, so a number without a distance can’t be compared.",
    ],
    formula: "SPL = 20·log₁₀(p / p₀), p₀ = 20 µPa; estimated dB SPL = dBFS + calibration offset; FAST = 125 ms, SLOW = 1 s. Sound pressure level compares the air pressure p with 20 µPa, and this meter estimates it by adding an offset to the phone’s digital level, then averaging over the time you chose.",
    outcomes: [
      "Why dBFS (a digital level below the converter’s 0 dBFS ceiling) and dB SPL (air pressure in the room) are different measurements.",
      "What a phone mic can and can’t measure, and what a field calibration does and doesn’t fix.",
      "How weighting (A, C, flat) and response (FAST, SLOW, averaging) change the number for the same sound.",
      "Why Leq sums up how loud a whole session was, and why levels near 85 dBA matter for hearing over a working day.",
    ],
    steps: [
      { do: "On SPL METER HOME, tap RANGE and pick 80, then tap RANGE again and pick AUTO.", notice: "At 80 the VU reads 80 dB at 0 and 60 dB at −20, and a quiet room leaves the needle low. On AUTO the window follows the room and the needle swings near the middle.", why: "The VU shows level relative to RANGE. Changing RANGE moves the window you watch, not what the mic measures." },
      { do: "Tap DIGITAL ›. With RESPONSE on FAST, clap once; then pick SLOW and clap again.", notice: "On FAST the big number jumps and falls back quickly. On SLOW it rises less and settles slowly.", why: "FAST (125 ms) and SLOW (1 s) average over different times, so the same clap gives two different readings." },
      { do: "Play music with plenty of bass, then switch the unit between dBA, dBC and dB SPL.", notice: "dBA usually reads lowest; dBC and dB SPL read closer together.", why: "A-weighting cuts the lows that hearing picks up weakly at quiet levels, so the weighting changes the number for the same sound." },
      { do: "Now tap dBFS.", notice: "The number turns negative and the line under it reads raw digital level · uncalibrated.", why: "dBFS counts down from the converter’s ceiling at 0 dBFS. It is a digital level, not a measured sound level." },
      { do: "Clap close to the phone, then read PEAK HOLD. Tap it to reset.", notice: "PEAK HOLD keeps your loudest clap until you tap it. If CLIP appears, the raw peak reached 0 dBFS.", why: "A clipped converter cuts off the top of the wave, so the true peak was higher than any number shown." },
      { do: "Tap RESET LOG, then talk and pause for a minute while ELAPSED counts up.", notice: "Leq · dBA moves slowly and ends nearer your loud moments than your quiet ones.", why: "Leq averages sound energy, not decibels, so loud moments carry far more weight." },
    ],
  },

  // ── Waveform (oscilloscope-style envelope) ────────────────────────────────
  waveform: {
    name: 'Waveform',
    tagline: "Pressure over time.",
    whatItIs:
      "This is your sound’s amplitude over time, as an oscilloscope draws it. Foundations of Sound teaches amplitude; here you see it live. New sound enters at the right, marked now. Up and down show how far the signal swings from the center line, which is silence. The marks are in dB: 0dB, top and bottom, is full scale, the most the phone can record. Levels are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading. Each sliver sums up a few milliseconds of sound.",
    controls: [
      { key: "envelope", name: "The filled shape (envelope)", definition: "How far the signal swung up and down in each slice of a few milliseconds. Its height shows how the level changes over time: the outline of the sound, not its single cycles.", practical: "Engineers read this outline in every recording program to find where notes start, how they fade, and where the loud spots are, long before they listen to the detail." },
      { key: "rms", name: "The inner band (RMS)", definition: "The fainter band inside the shape: the RMS (root-mean-square) level of each slice, a kind of average. It follows how loud the sound feels more closely than the outer peaks do.", practical: "The gap between the peaks and the RMS is called crest factor. Claps and drums leave a big gap; dense, steady sound, like a held Hammond chord or a heavily compressed mix, leaves a small one." },
      { key: "clip", name: "Clip ticks", definition: "Red marks in the lane along the top. Each marks a moment when the signal hit full scale (0 dB) and was cut off, so the shape and level there are wrong, not just loud.", practical: "A clipped wave has its tops sliced flat, which adds harsh distortion you can’t remove later. Engineers lower the gain or move the mic; here, move the phone back from the source." },
      { key: "peak", name: "PEAK", definition: "The highest sample level right now, in dB. 0 dB is full scale, so a reading at or above 0 means the signal clipped.", practical: "This is a sample peak, not a true peak: the smooth wave rebuilt from the samples can rise a little between them. That’s why finished masters leave some room below 0 dBFS." },
      { key: "clip_runs", name: "CLIP OVERRUNS", definition: "Counts the separate times the signal hit full scale; one long overload counts once. It reads 0 in green until the first one, then turns red; tap it to reset the count.", practical: "Any count above 0 means that capture is damaged, and the damage can’t be undone afterward. Back away from the source, reset the count, and capture again." },
      { key: "window", name: "WINDOW", range: "0.5s · 1s · 2s · 3s · 4s", definition: "How many seconds of sound fit across the display, from the left edge to now. Tap the WINDOW key to pick a length; the readout shows how much is actually on screen.", practical: "A short window lets you study one clap or drum hit; a long one shows the shape of a whole phrase. It changes the view only: capture keeps running." },
      { key: "marks", name: "What the display shows", definition: "Time runs left to right, from seconds ago to now. The center line, marked -∞, is silence; the dB marks above and below (0dB, −6, −12 …) show level, and red ticks in the top lane mean clipping.", practical: "Each −6 dB halves the amplitude, so the marks crowd toward the center line. At ZOOM ×1, a wave reaching about halfway up is only about 6 dB below full scale: still fairly strong." },
    ],
    commonMistakes: [
      "Reading the shape as the wave’s single cycles. At this zoom each sliver sums up a few milliseconds of samples, so you see the outline of the sound, not its individual vibrations.",
      "Thinking more ZOOM makes the sound louder. ZOOM only stretches the picture; the audio, PEAK and CLIP OVERRUNS stay the same.",
      "Ignoring red clip ticks. Once the signal clips, its tops are cut off, and any level or analysis from that moment is wrong. Move the phone back and capture again.",
      "Reading these levels as dB SPL. They are relative dB from your phone’s uncalibrated mic, not a calibrated sound level meter reading: how close the signal comes to the phone’s ceiling.",
      "Thinking the tallest wave sounds the loudest. A short click can peak higher than a held note that sounds far louder. Height shows amplitude, not perceived loudness; watch the RMS band too.",
      "Confusing this with the spectrogram. Here up and down is amplitude, not frequency, so this view can’t tell you whether a sound is bass-heavy or bright.",
    ],
    proTips: [
      "Compare the RMS band with the outer shape. A big gap means sharp transients, like claps or drums; a small gap means dense or compressed sound.",
      "Set WINDOW to 0.5s, clap once and tap FREEZE. You can then study one transient: a sharp rise, a fast decay, and ideally no red ticks.",
      "Talk at your normal distance, then slowly move closer. The first red tick shows you how close is too close for this mic at that volume.",
      "Tap CLIP OVERRUNS to reset it at the start of each take, before you capture and tap SAVE SNAPSHOT, so its count belongs to that take alone.",
    ],
    formula: "Column = min and max of the samples in each ~5 ms slice; RMS = √(mean(x²)) over the slice; level = 20·log₁₀(|x|) dB, where x is a sample value and |x| = 1 is full scale (0 dB); clip flagged at ≥ 3 consecutive samples at or over full scale. Each column keeps the biggest swing up, the biggest swing down and the average power of its slice, all measured against the phone’s full scale.",
    outcomes: [
      "What a waveform shows (amplitude over time) and what it can’t show (frequency balance and perceived loudness).",
      "How to read the dB scale: 0 at full scale, -∞ at the center line, and why −6 dB is half the amplitude.",
      "Why peak and RMS tell different stories, and why a clipped capture can’t be trusted.",
      "Why these levels are relative to the phone’s ceiling (0 dB, full scale), not a calibrated sound level meter reading.",
    ],
    steps: [
      { do: "Talk steadily for a few seconds, then stay silent.", notice: "The filled shape grows while you talk and shrinks to a thin line on the center while you’re quiet.", why: "Height is amplitude: how far the signal swings away from silence." },
      { do: "Set WINDOW to 0.5s, clap once, then tap FREEZE.", notice: "FREEZE reads FROZEN. The clap is a tall, narrow spike, and the RMS band inside it is much shorter.", why: "A transient’s peak sits far above its average, which is why peak and RMS tell different stories." },
      { do: "Tap FREEZE to go back to LIVE, then change ZOOM from ×1 to ×6 while you keep talking.", notice: "The shape grows taller, but PEAK reads about the same.", why: "ZOOM stretches the picture, not the audio." },
      { do: "Hum a low note, then whistle a high one at a similar volume.", notice: "Both draw a band of similar height; nothing in the picture tells low from high.", why: "At this zoom a waveform shows amplitude over time, not frequency." },
      { do: "Clap hard, close to the phone.", notice: "If it clips, red ticks appear in the top lane, PEAK reaches 0 and CLIP OVERRUNS turns red.", why: "At 0 dB (full scale) the converter has no more room, so the tops of the wave are cut off." },
      { do: "Tap CLIP OVERRUNS to reset it, step back, and clap again.", notice: "The count stays at 0 in green and no red ticks appear.", why: "Distance from the source is the simplest way to keep a phone capture below full scale." },
    ],
  },

  // ── Frequency Counter / Pitch ─────────────────────────────────────────────
  freqcounter: {
    name: 'Frequency Counter',
    tagline: "How high — and how fast.",
    whatItIs:
      "Frequency is cycles per second, as Foundations of Sound shows. Here you count it on real sound. Pick a mode: Sound reads one steady tone through the phone’s mic, Tuner names that tone as a note, Tap times a beat you tap along with, and Light Pulse times a flashing light. Frequency depends only on timing, so even an uncalibrated phone mic reads a clear tone well. What it can’t do: measure how loud a sound is, or pull one note out of a chord or speech.",
    controls: [
      { key: "confidence", name: "CONFIDENCE", range: "0–100 %", definition: "How sure the counter is, from 0 to 100 %, that it hears one clear, repeating pitch. Noise, chords, speech or a weak signal pull it down, and then the Hz above can’t be trusted.", practical: "Read CONFIDENCE before you write down any frequency. A held note or a tuning fork should sit high; if it keeps dropping, quiet the room or move the phone closer to the source." },
      { key: "input_level", name: "INPUT LEVEL", range: "below 0 dBFS · uncalibrated", definition: "How strong the signal reaching the phone is, in dBFS: decibels below the loudest value the phone can record, so 0 is the top. It’s a digital level, not a measured sound level.", practical: "It tells you whether the counter has enough signal, nothing more. Phones can process their own mic signal, so never compare this number between phones or rooms; loudness needs a calibrated sound level meter." },
      { key: "status", name: "STATUS", range: "MIC OFF · LISTENING · STABLE · LOW SIGNAL", definition: "Tells you whether to trust the big number right now. STABLE means it has locked onto one clear pitch; LISTENING means still searching; LOW SIGNAL means too quiet; MIC OFF means stopped.", practical: "Only write down a reading while STATUS says STABLE. When the sound stops, the big number dims and shows how many seconds old it is: that’s the last good reading, not a live one." },
      { key: "events_sec", name: "EVENTS / SEC", definition: "In Tap mode: how many times per second the event repeats, worked out from the gaps between your taps. It’s a rate in hertz, not a musical pitch.", practical: "Use it for things far too slow to hear as a pitch: a metronome, a flashing light, a fan with a marked blade. One event every second is 1 Hz." },
      { key: "period", name: "PERIOD", range: "ms", definition: "The time one cycle or one event takes, in milliseconds. It’s frequency turned upside down: period = 1000 ÷ Hz, so a higher frequency always means a shorter period.", practical: "Engineers often think in time instead of Hz, for example when lining up delays. A 440 Hz tone repeats every 2.27 ms; a click every half second has a period of 500 ms." },
      { key: "bpm", name: "BPM", definition: "The repeat rate as beats per minute: events per second × 60. It shows a dash when the rate is far too fast to be a tempo, as with an audio tone.", practical: "Tap along with a song in Tap mode to find its tempo, or check that a click track matches the tempo the drummer expects." },
      { key: "stability", name: "STABILITY", range: "Very stable · Stable · Fair · Unstable · %", definition: "How even the readings have been over the last few seconds, as a word (Very stable, Stable, Fair, Unstable) and a percent. In Tap mode it judges how even your taps are.", practical: "Unstable on a held note means the pitch is really moving: vibrato, a drifting oscillator, a singer running out of breath. Unstable in Tap mode usually means the tapping, not the event." },
      { key: "min", name: "MIN", definition: "In Tap mode: the slowest rate among your recent taps, in Hz, taken from the longest gap. RESET, or a long pause, starts a new measurement.", practical: "Compare MIN with MAX. Close together means a steady event and steady taps; far apart means one of them is wandering." },
      { key: "max", name: "MAX", definition: "In Tap mode: the fastest rate among your recent taps, in Hz, taken from the shortest gap. RESET, or a long pause, starts a new measurement.", practical: "One rushed tap pushes MAX up on its own. If MAX sits far above the big number, tap again more evenly before you trust BPM." },
      { key: "a4", name: "TUNING STANDARD", range: "A4 432–444 Hz · starts at 440", definition: "In Tuner mode, sets the frequency of A4, the A above middle C, from eight choices. Every note name and cents reading is measured against it, so changing it shifts what counts as in tune.", practical: "440 Hz is the modern standard; many orchestras tune to 442 or 443. Baroque groups often use 415 Hz, which isn’t on this list. Tune to whatever the band you play with uses." },
      { key: "marks", name: "What the display shows", definition: "The big green number is the frequency in Hz (in Sound mode, tap it to start or stop), and the cells below tell you how far to trust it. A dimmed number is the last good reading, not live.", practical: "Below the cells, the screen reminds you it reads ONE steady tone, roughly 40 Hz – 4 kHz. Outside that band, or on a chord, treat any number as approximate." },
    ],
    commonMistakes: [
      "Believing any number on screen is real. A chord, speech or noise still gives a number; it only means something while CONFIDENCE is high and STATUS reads STABLE.",
      "Thinking a quiet sound just reads less accurately. Below a certain level the counter stops: STATUS shows LOW SIGNAL. Make the source louder or move the phone closer.",
      "Expecting Sound mode to count clicks or a slow beat. It reads tones from about 40 Hz up. For a metronome, a flashing light or anything slower, use Tap mode.",
      "Reading INPUT LEVEL as how loud the room is. It’s dBFS, the level inside the phone, not a measured sound level. A phone counts frequency well; measuring loudness needs a calibrated sound level meter.",
      "Trusting the octave of a very low note without checking. Phone mics often pick up little deep bass, so the counter can lock onto the second harmonic and read one octave high.",
    ],
    proTips: [
      "Watch CONFIDENCE, not just the Hz: a steady number at 90 % or more is worth writing down; a jumpy number at 20 % is not.",
      "In Sound mode, hum one note and slowly slide it up. Hz rises while PERIOD shrinks: two views of one fact. At 440 Hz, 1000 ÷ 440 gives 2.27 ms.",
      "In Tap mode, tap for several seconds before you read BPM. More taps average out small timing slips, and STABILITY tells you how even you were.",
      "If the Tuner jumps between octaves, use LOW-CUT and HIGH-CUT to narrow the band around your instrument’s notes. This limits which pitches it accepts, not what the mic hears.",
      "Testing a low note? A phone speaker can’t reproduce deep bass, so a low tone played on one is mostly harmonics. Use an instrument or a full-range speaker.",
    ],
    formula: "f = 1 ÷ T (T = period in seconds) · period (ms) = 1000 ÷ f · BPM = events per second × 60 · cents = 1200 × log₂(f ÷ f_note), where f_note is the nearest note’s frequency set by A4. Frequency and period are one fact seen two ways, and cents measure how far a pitch sits from the nearest note, with 100 cents to a semitone.",
    outcomes: [
      "Why frequency, period and BPM are the same fact seen three ways.",
      "Why a phone mic can count frequency well but can’t measure how loud a sound is.",
      "When a frequency reading deserves trust: one steady tone, high CONFIDENCE, STATUS on STABLE.",
      "How a tuner turns a frequency into a note and cents, measured against A4.",
    ],
    steps: [
      { do: "Open Sound mode and hum one steady note close to the phone.", notice: "The big number settles, STATUS reads STABLE and CONFIDENCE climbs. PERIOD shows the same note in milliseconds.", why: "One steady tone repeats at one rate, so the phone can count it no matter how its mic level is calibrated." },
      { do: "Now talk normally, or hum two notes back and forth.", notice: "CONFIDENCE drops, STATUS goes back to LISTENING and a warning asks for ONE steady tone. The last number dims and says “not live”.", why: "Speech and chords hold many frequencies at once, so they don’t reduce to one number." },
      { do: "Hum very softly, or step away from the phone.", notice: "INPUT LEVEL falls in dBFS and STATUS shows LOW SIGNAL.", why: "The counter needs enough signal to find the repeats. INPUT LEVEL is a digital level, not a measured sound level." },
      { do: "Tap ‹ BACK, open Tap, and tap TAP IN TIME along with a song or a ticking clock for several seconds.", notice: "EVENTS / SEC, PERIOD and BPM fill in. STABILITY rates your tapping, and MIN and MAX show the slowest and fastest gaps.", why: "Slow repeats are counted by timing, not by pitch: BPM is just events per second × 60." },
      { do: "Open Tuner, keep TUNING STANDARD on A4 440 and play or sing an A. Then switch TUNING STANDARD to 442.", notice: "The note name, OCTAVE and a cents reading appear. At 442 the same A reads about 8 cents flatter.", why: "A note name is a label on a frequency, and the reference pitch decides which frequency counts as in tune." },
    ],
  },

  // ── RT60 (reverb decay) ───────────────────────────────────────────────────
  rt60: {
    name: 'RT60 Reverb Time',
    tagline: "How long a space rings.",
    whatItIs:
      "Foundations of Sound asks how long a room rings; this tool measures it. RT60 is the time a sound takes to fade by 60 dB after it stops. Tap ARM CAPTURE, make one loud, short sound, and stay still while the phone records 3.5 seconds of the room ringing out. You get one broadband time, the decay curve, and a time for each octave band. Timing doesn’t need a calibrated mic, but the sound must start far above the room’s background noise.",
    controls: [
      { key: "rt60", name: "BROADBAND DECAY", definition: "The headline: how many seconds the room took to fade by 60 dB, all frequencies together. The line below names the fit (T30 or T20) and its R²; INVALID means don’t trust this capture.", practical: "Short times sound dry and clear, like a treated studio; long times sound live, like a gym or a church. It’s the number people quote first, but OCTAVE BANDS tell you more." },
      { key: "edt", name: "EDT", definition: "Early Decay Time: the decay time worked out from only the first 10 dB of the fade, for each band. It matches how live a room sounds to a listener better than RT60 does.", practical: "If EDT is much shorter than RT60, the sound drops fast at first and then lingers quietly. Listeners hear that room as drier than its RT60 suggests." },
      { key: "t20", name: "T20", range: "−5 to −25 dB · × 3", definition: "A tag beside an RT60 value: that number is the time the sound took to fall from −5 to −25 dB, multiplied by 3 to reach 60 dB. The screen uses it when the decay was too short for T30.", practical: "T20 needs the sound to start about 35 dB above the background noise. It copes with noisier rooms, but it judges a shorter piece of the decay." },
      { key: "t30", name: "T30", range: "−5 to −35 dB · × 2", definition: "A tag beside an RT60 value: that number is the time the sound took to fall from −5 to −35 dB, multiplied by 2. It uses more of the decay, so the screen shows it whenever it can.", practical: "T30 needs about 45 dB between the peak and the background noise. Turn off fans and air conditioning, and use a louder sound, to get T30 in every band." },
      { key: "r2", name: "R²", range: "0–1 · needs > 0.90", definition: "How straight the decay was over the part that was measured, from 0 to 1; 1.00 is a perfectly straight line. A result needs R² above 0.90 to count.", practical: "A clean room decay drops in a straight line on a dB scale. A low R² points to noise, a stray sound, or two parts of a space ringing differently: take it again." },
      { key: "decay_range", name: "Decay range", range: "dB available", definition: "How many dB the sound fell before it sank into the background noise. When a band has too little, its row reads “insufficient range” with the dB available instead of a time.", practical: "Each band needs about 35 dB for T20 and 45 dB for T30. The bass bands run short most often, because a clap carries little bass; a balloon pop helps." },
      { key: "band", name: "OCTAVE BANDS", definition: "The table splits the decay into octave bands, one row each, showing BAND, RT60, EDT and R². A dim row tells you why that band has no time.", practical: "Rooms rarely ring the same at every pitch; bass often hangs on longest. Treatment that soaks up only the highs can leave a room boomy, and these rows show it." },
      { key: "marks", name: "What the display shows", definition: "The curve is the room’s sound fading over time, from 0 down to −60 dB. The dashed lines at −5, −25 and −35 dB mark the stretch the T20 and T30 fits read.", practical: "The caption calls it a Schroeder decay: a smooth curve built by adding up the recorded sound backward from the end. A tail that levels off near the bottom is likely background noise, not reverb." },
    ],
    commonMistakes: [
      "Believing every capture gives a real RT60. If R² is under 0.90 or the decay range is too small, you get INVALID or “insufficient range”. Re-arm with a louder, sharper sound.",
      "Quoting one number for the whole room. RT60 changes with frequency, so read OCTAVE BANDS, and it changes with position too: one spot is not the room.",
      "Thinking background noise doesn’t matter. A trustworthy T30 needs the sound about 45 dB above the noise, and T20 about 35 dB. Fans, traffic and air conditioning eat into that.",
      "Treating EDT as the same as RT60. EDT comes from the first 10 dB of the fade and follows how live the room sounds; RT60 describes the whole decay.",
      "Using the phone’s own speaker as the sound source. It’s far too quiet and can’t reproduce deep bass. The room needs one loud, short sound: a hard clap, a balloon pop or a clapper.",
      "Making the sound right next to the phone. Too close can overload the mic and clip, which spoils the capture. Make the sound a few steps away.",
    ],
    proTips: [
      "A balloon pop makes a handy impulse: loud, short and rich in bass. Hold it at arm’s length, away from anyone’s ears. A hand clap is fine for a quick look, but weak in bass.",
      "Read the tag beside each RT60. T30 means the room gave plenty of clean decay; T20 means it had to use a shorter stretch. Retake T20 bands when the room is quieter.",
      "While ARMED, watch the level bar: recording starts by itself when your sound crosses the trigger mark, about −35 dBFS. Then stay silent and still for the full 3.5 seconds.",
      "Capture from several spots with RE-ARM and compare the bands. The room is the pattern they share, not any single number.",
      "On the curve, a straight slide past the dashed lines means an even decay. A bend usually means noise, or two parts of a space ringing at different rates.",
    ],
    formula: "RT60 = 60 ÷ D, where D is the decay rate in dB per second, fitted from −5 to −25 dB (T20: a 20 dB span, × 3) or −5 to −35 dB (T30: a 30 dB span, × 2); EDT uses 0 to −10 dB (× 6). If the sound drops steadily by D dB every second, it takes 60 ÷ D seconds to fall the full 60 dB, so the tool measures part of the slope and stretches it.",
    outcomes: [
      "What RT60 means: the time a sound takes to fade by 60 dB after it stops.",
      "Why RT60 is measured over part of the decay (T20, T30) and stretched to 60 dB.",
      "Why one number isn’t the room: decay time changes with frequency band and with position.",
      "When to trust a result: enough decay range above the background noise, and R² above 0.90.",
    ],
    steps: [
      { do: "Keep the room quiet and tap ARM CAPTURE.", notice: "The panel reads ARMED — MAKE THE SOUND, and the level bar shows a trigger mark at about −35 dBFS.", why: "The capture waits for a sound well above the background, so it catches the decay from the start." },
      { do: "Pop a balloon at arm’s length, or clap hard once, then stay silent and still.", notice: "The panel shows RECORDING — HOLD STILL while it captures 3.5 seconds. Then BROADBAND DECAY shows a time, its fit and R².", why: "RT60 is about what happens after the sound stops: the room’s own fade." },
      { do: "Read the decay curve against the dashed −5, −25 and −35 dB lines.", notice: "A clean capture slides down fairly straight past them, and the result is tagged T30 or T20.", why: "The tool measures the slope over part of the decay and stretches it to the full 60 dB." },
      { do: "Scroll to OCTAVE BANDS and compare the rows.", notice: "Each band has its own RT60, EDT and R², and a weak band reads “insufficient range” with the dB available.", why: "A room decays differently at different frequencies, and a clap gives the bass bands the least to measure." },
      { do: "Tap RE-ARM, move a few steps, and capture again.", notice: "The band times usually shift from spot to spot.", why: "One position is not the room: you compare several spots to describe the whole space." },
    ],
  },

  // ── Pro Audio MultiMeter (Mono) — owner spec 2026-07-29 ──────────────────
  multimeter: {
    name: 'Pro Audio MultiMeter',
    tagline: "Every meter at once.",
    whatItIs:
      "The MultiMeter puts several meters on one live sound from your phone’s microphone, so you can compare them side by side. The top row gives the level, PEAK, RMS and PK HOLD. LIVE SPECTRUM shows how much energy sits at each frequency, SPECTROGRAM shows frequency over time, and OSCILLOSCOPE shows the waveform. FREQUENCY & PITCH names the strongest frequency and note, and SMART DETECTION points to likely problems. Every dBA, dBC or dB SPL level is an estimate from your phone’s mic, not a calibrated sound level meter reading.",
    controls: [
      { key: "spl", name: "SPL·LCF", range: "dBA · dBC · dB SPL · dBFS", definition: "The main level, read Fast and C-weighted (dBC) at first. Long-press it to open READOUT MODE and choose dBA, dBC, dB SPL or dBFS; the label changes to match.", practical: "Weighting is a filter that counts some frequencies less. dBA trims the lows, the way your ears hear quiet sound; dBC keeps more bass. dBFS is a digital level, not a measured sound level." },
      { key: "peak", name: "PEAK", definition: "The highest instantaneous level right now, with no weighting (Z). In dBA or dBC mode its label reads PEAK · Z, because only the main level is weighted.", practical: "Switch to dBFS to judge clipping: 0 dBFS is the ceiling of the phone’s converter. A peak there means the recording is clipping, which tells you nothing certain about how loud the room is." },
      { key: "rms", name: "RMS", definition: "The average level over the last 3 seconds (3 sec avg), with no weighting (Z). The small marker beside the level meter on LIVE SPECTRUM shows the same average.", practical: "The gap between PEAK and RMS is called the crest factor. A big gap means sharp hits, like a snare. A small gap means dense or heavily compressed sound, like a steady tone or a heavily limited song." },
      { key: "pk_hold", name: "PK HOLD", definition: "The highest peak since you last reset it, so a short overload you blinked through stays on screen. Tap the cell (⟲) to reset it; that also clears the peak marks on LIVE SPECTRUM.", practical: "Reset it, then let the band play its loudest song or the drummer hit hardest. PK HOLD tells you the worst moment without your eyes on the meter." },
      { key: "spectrum", name: "LIVE SPECTRUM", range: "20 Hz–20 kHz · 61 bands (1/6 octave)", definition: "Shows how much energy sits at each frequency, from 20 Hz on the left to 20 kHz on the right. Each column is a 1/6-octave band; the small bright dashes mark each band’s peak hold.", practical: "A gray column can’t be resolved at this setting, so it shows nothing rather than a guess. In the lowest bands, neighbors share one reading: the rumble is real, but its exact pitch is coarse." },
      { key: "cursor", name: "CURSOR", definition: "Tap or drag on LIVE SPECTRUM to place a line and read that frequency in Hz and its level in dB. Tap CURSOR ✕ to remove it.", practical: "Use it to put a number on a peak you can see, such as a hum or a ringing tone, before you reach for EQ." },
      // The FULL / LOW / MID / HIGH frequency zoom was REMOVED from the
      // MultiMeter (owner 2026-08-05) and its state has no setter; this
      // entry documented a control that is not on the screen. The scope's
      // own vertical zoom is the one that survives.
      { key: "zoom", name: "×1 / ×2 / ×4", range: "×1 · ×2 · ×4", definition: "Stretches the OSCILLOSCOPE picture up and down so a quiet sound fills the panel. It changes only the picture, never the level or any reading.", practical: "Use ×2 or ×4 to see the shape of a quiet source, like speech across a room. Go back to ×1 before judging clipping: zoomed in, a normal loud wave can hit the panel’s edge." },
      { key: "smoothing", name: "SMOOTH", range: "LOW · MED · HIGH (starts on LOW)", definition: "Sets how quickly the LIVE SPECTRUM columns settle. LOW reacts at once and jumps with every sound; MED and HIGH average over time, so you see the overall shape.", practical: "Use LOW to catch a short event, like a drum hit. Use HIGH to judge the tonal balance of music or noise, where the average matters more than every flicker." },
      { key: "spectrogram", name: "SPECTROGRAM", range: "50 Hz–16 kHz · 60 dB color range", definition: "A scrolling picture of frequency over time: time moves across, newest at the right; frequency runs up; color shows level, from deep blue for quiet through green and yellow to red for loud.", practical: "It shows what one spectrum can’t: when a sound started and how long it lasted. A hum draws a steady line; feedback starting shows as one line growing brighter at one height." },
      { key: "oscilloscope", name: "OSCILLOSCOPE", range: "3 s window", definition: "The waveform over the last 3 seconds. The outer shape is the biggest swing at each moment, the inner band is the RMS (average) energy, and red marks along the top flag clipping.", practical: "The center line is zero. A shape that sits more on one side, even in silence, points to DC offset: a steady shift away from zero that wastes headroom, the space left before clipping." },
      { key: "dominant", name: "DOMINANT", definition: "The strongest frequency right now. The caption says where it comes from: “from pitch tracker” when there is a clear, steady pitch, or “from spectrum peak”, the loudest point on the spectrum.", practical: "On a held note the two usually agree. On noisy sound, like a fan or a crowd, only the spectrum peak is available, and it can jump from one frequency to another." },
      { key: "note", name: "NOTE", definition: "The nearest musical note, with A4 = 440 Hz, and how far off it is in cents. A cent is 1/100 of a semitone.", practical: "It reads only while the pitch is clear and steady. When NOTE dims, you are seeing the last stable pitch, and the caption under the cents bar says how many seconds ago it was." },
      { key: "cents", name: "Cents indicator", range: "±50¢ · in tune within ±5¢", definition: "A needle on a ±50 cent scale, centered on the nearest note. When the pitch is within ±5 cents, the middle zone glows green: in tune.", practical: "Use it on a held note from an instrument or a test tone. Short or noisy sounds don’t give the pitch tracker enough to lock on to." },
      { key: "counter", name: "COUNTER", definition: "The tracked pitch in Hz, with the tracker’s confidence (conf %) under it. When confidence drops, the number dims as a held reading, then turns to dashes.", practical: "Use COUNTER to read an exact frequency, such as a test tone or a held note. If conf stays low, the sound has no clear single pitch to read." },
      { key: "detection", name: "SMART DETECTION", definition: "Watches the sound for common conditions and problems: AC power hum, buzz, pink noise, clipping, mic overload, feedback starting, low rumble and a whistle. Each chip is a likely condition, not a diagnosis.", practical: "Treat a chip as a pointer. Confirm it by ear, then switch sources off one at a time until it clears. That tells you where the problem lives." },
      { key: "snapshot", name: "MEASUREMENT SNAPSHOT", definition: "Saves the current readings, recent spectrogram, detections, date, time and your notes, as numbers, never audio. Find them later under VIEW SAVED MEASUREMENTS ›.", practical: "Take one snapshot before a change, such as moving a speaker or adding EQ, and one after. Note where the phone was, so you compare like with like." },
      { key: "display", name: "What the display shows", definition: "Read the main level, PEAK, RMS and PK HOLD in the top row. Below them, watch LIVE SPECTRUM with its level meter, SPECTROGRAM and OSCILLOSCOPE, FREQUENCY & PITCH, the system facts (SAMPLE RATE, FFT, DISP RANGE, INPUT), and SMART DETECTION.", practical: "Each panel answers a different question about one sound: how loud, which frequencies, when, and what shape. If you’ve worked through Visual Audio Analysis, you’ll recognize each display here, now reading real sound." },
    ],
    commonMistakes: [
      "“The SPL number is the true sound level.” It is an estimate from your phone’s mic, not a calibrated sound level meter reading. Field calibration brings it closer, but it stays approximate.",
      "“PEAK, RMS and PK HOLD share the main level’s weighting.” Only the main level is weighted. The other three are unweighted (Z), and in dBA and dBC the PEAK and RMS labels add · Z.",
      "“A dimmed NOTE or COUNTER is still live.” A dimmed value is the last stable pitch, held for a moment. It is not what is sounding now.",
      "“A detection chip is a diagnosis.” It is a likely condition read from the sound. Confirm it by ear and by isolating the source before you change anything.",
      "“Pink noise should look flat on every display.” It has equal energy per octave, so the 1/6-octave columns read about even. A per-frequency reading, like CURSOR, falls about 3 dB per octave.",
      "“SMOOTH on LOW gives the truest picture.” LOW shows every flicker, which hides the trend. Set SMOOTH to HIGH and let the columns settle before you judge tonal balance.",
    ],
    proTips: [
      "Play pink noise through a speaker and set SMOOTH to HIGH. Pink noise reads about even across the columns, so any tilt or bump comes from the speaker, the room or the phone mic.",
      "Watch PEAK and RMS while the OSCILLOSCOPE runs. Speech or drums show a wide gap and a spiky shape; a steady tone or heavy compression shows a small gap and an even band.",
      "If SMART DETECTION shows feedback starting, read its frequency from the chip, DOMINANT or CURSOR. Turn the mic or speaker down first, then cut that frequency with EQ.",
      "A steady low line with a hum chip usually means AC power hum at 50 or 60 Hz, or buzz at 100 or 120 Hz. Check cables and ground connections; never remove a safety ground.",
      "Keep test noise and tones at a comfortable level, with the phone a step from the speaker. A test doesn’t need to be loud, and a mic overload chip means the reading can’t be trusted.",
    ],
    formula: "Band level (relative dB) = 10·log₁₀(Σ power of the FFT bins in the band); note n = round(12·log₂(f/440)) + 69; cents = 1200·log₂(f/f_note). Each column adds up the power of the narrow frequency slices (bins) inside its band; n numbers the nearest semitone from A4 = 440 Hz (A4 is 69), f_note is that note’s frequency, and cents show how far the pitch sits from it.",
    outcomes: [
      "Why a phone-mic level is an estimate, and what dBA, dBC, dB SPL and dBFS each measure.",
      "How the gap between PEAK and RMS shows whether a sound is sharp or dense.",
      "How a spectrum, a spectrogram and an oscilloscope show one sound as frequency, time and shape.",
      "How hum, feedback and clipping each leave their own mark on these displays.",
    ],
    steps: [
      { do: "Tap START and talk or play music near the phone.", notice: "The top row fills in: SPL·LCF (C-weighted, Fast) in dBC, then PEAK · Z, RMS · Z and PK HOLD.", why: "Only the main level is C-weighted; the other three are unweighted, and the PEAK and RMS labels say so." },
      { do: "Long-press SPL·LCF and choose dBFS in READOUT MODE.", notice: "The label changes to LEVEL·FS, the · Z tags disappear, and the line below reads “relative digital level — not dB SPL”.", why: "dBFS counts down from the converter’s ceiling at 0 dBFS. It is a digital level, not a measured sound level." },
      { do: "Clap once, sharply.", notice: "PEAK jumps and PK HOLD keeps it, while RMS (3 sec avg) rises much less. The OSCILLOSCOPE shows a narrow spike.", why: "A big gap between PEAK and RMS is a high crest factor: a short, sharp sound." },
      { do: "Hum or sing one steady note.", notice: "DOMINANT reads “from pitch tracker”, NOTE names the note, and within ±5 cents the middle of the cents bar glows green.", why: "A clear, steady pitch lets the tracker name the note and measure how far off it is in cents." },
      { do: "With music playing, switch SMOOTH from LOW to HIGH.", notice: "On LOW the LIVE SPECTRUM columns jump with every beat; on HIGH they move slowly and hold a shape.", why: "Averaging hides quick changes so you can read the tonal balance; fast response shows short events." },
      { do: "Drag along LIVE SPECTRUM to the tallest column, read its Hz and dB, then tap CURSOR ✕.", notice: "The chip reads that point’s frequency in Hz and its level in dB; CURSOR ✕ clears it.", why: "Putting a number on a peak is the first step to treating it, such as cutting a ringing frequency with EQ." },
    ],
  },
};

/** A section header with a tap-for-help ⓘ — the tools' control-group help
 *  affordance (each tool passes its own header text style so the look is
 *  unchanged). */
export function HelpHead({
  title,
  onHelp,
  style,
}: {
  title: string;
  onHelp: () => void;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={helpHeadStyles.row}>
      <Text style={style}>{title}</Text>
      <Pressable onPress={onHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${title} — what it does`}>
        <Text style={helpHeadStyles.info}>ⓘ</Text>
      </Pressable>
    </View>
  );
}

const helpHeadStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  info: { color: '#ffc64d', fontSize: 13, marginTop: 1 },
});

/** "ⓘ WHAT THE DISPLAY SHOWS" — placed by each tool near its chart/readouts to
 *  open the whole-tool guide (readouts + reference marks + concept). */
export function DisplayGuideButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="What the display shows — readouts and reference marks explained"
      style={guideStyles.btn}
    >
      <Text style={guideStyles.text}>ⓘ WHAT THE DISPLAY SHOWS</Text>
    </Pressable>
  );
}

const guideStyles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: 'rgba(255,198,77,.07)',
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  text: { color: '#ffc64d', fontSize: 11, letterSpacing: 0.8, fontWeight: '600' },
});

/** Derive a readout's help key from its on-screen label (e.g. "PEAK HOLD" →
 *  "peak_hold", "OBS MAX" → "obs_max") — matches the readout control keys above,
 *  so a StatCell can wire long-press-for-help with no per-cell key. */
export const readoutKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** The tool's help content, or undefined for an unknown id. */
export function getToolLesson(id: ToolId): LessonContent | undefined {
  return TOOL_LESSONS[id];
}

/** Per-tool control help — the same two-tier popup as the labs.
 *  • help(key)  — focused: a control's or readout's "what it does / what it shows".
 *  • helpAll()  — the whole-tool DISPLAY GUIDE: what the display shows + every
 *                 readout + reference mark + concept (opens with no focus).
 *  • sheet      — render once at the screen root.
 *  No-op / null for an unknown tool id. */
export function useToolHelp(toolId: ToolId): {
  help: (key: string) => void;
  helpAll: () => void;
  sheet: React.JSX.Element | null;
} {
  const lesson = getToolLesson(toolId);
  const [key, setKey] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const help = useCallback((k: string) => {
    setKey(k);
    setOpen(true);
  }, []);
  const helpAll = useCallback(() => {
    setKey(undefined);
    setOpen(true);
  }, []);
  const sheet = lesson ? (
    <GuidedLessonSheet visible={open} lesson={lesson} controlKey={key} onClose={() => setOpen(false)} />
  ) : null;
  return { help, helpAll, sheet };
}
