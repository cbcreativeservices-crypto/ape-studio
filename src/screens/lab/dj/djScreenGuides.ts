/**
 * DJ Systems Lab — "explain this screen" content (owner 2026-10-31, the
 * Screen Guide rollout). One guide per screen of the owner's 24-screen
 * outline, keyed by the screen's on-screen TITLE (PageDef.title — the string
 * the header shows); DJSystemsLabScreen hands them to PagedLab's `pageGuide`.
 *
 * Every line was written against the screen's own code (pages/p01…p24,
 * dock.tsx, the booth model): the names are the on-screen names (dock keys,
 * tray headings and chips, bezel keys, labels drawn on the stage). TRY THIS
 * quotes only the screen's own targets and numbers the test works out from
 * the same functions (nioshDose for the safe-level tile, the tempo/pitch
 * relation for key) — test/screenGuide_djsystems_20261031.test.ts.
 *
 * Each section is one step and must fit a 375×812 phone with no scrolling —
 * SCREEN_GUIDE_BUDGET (types.ts). Copy rules: plain language; claims
 * KNOWLEDGE, never skills; no "N of total"; "suggest", never "recommend"; no
 * gear maker names; no build notes in learner text. Every screen keeps the
 * same five steps in its well (UNDERSTAND · EXPLORE · LISTEN & OBSERVE ·
 * PRACTICE · CHECK YOURSELF) and the same ■ STOP key in its dock.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

const STOP = '■ STOP stops every deck and every sound, at any moment.';

export const DJ_SCREEN_GUIDES: Record<string, ScreenGuide> = {
  // ── 1 ──────────────────────────────────────────────────────────────────
  'Welcome and safe operation': {
    seeing: [
      'The DJ booth from above: deck A on the left, the two-channel mixer in the middle, deck B on the right. Under it, who you are listening as.',
      'Readouts: BOOTH (the sound status), LISTENING AS and PLAYBACK (how loud the lab asks the phone to play).',
      'The well holds the five steps, the A LOUD NIGHT, IN NUMBERS tile and a fault to fix.',
    ],
    control: [
      'PLAY A: start deck A.',
      'LISTEN: choose whose ears the phone plays — CROWD (the PA), BOOTH (the booth monitors) or PHONES (your headphones) — and QUIETER / LOUDER.',
      'RESET: put the booth back as it started.',
      STOP,
      'In the tile: pick a level (85 to 100 dBA) and a set length (1, 2 or 4 h).',
    ],
    changes: [
      'Each time you switch who you listen as, playback starts LOW again, so a louder feed never arrives at full level.',
      'The tile’s percentage follows the NIOSH guideline: 85 dBA for 8 hours, and every 3 dB louder halves the safe time — level and time trade off.',
    ],
    teaches: [
      'Safe operation first: low levels to start, STOP within reach, and how quickly a loud booth uses up a day’s hearing allowance.',
      'Screen 1; the gear itself comes on Screen 2.',
    ],
    tryThis: [
      'In the tile pick 4 h set and 88 dBA: 100 % of a day’s allowance. Step up to 91 dBA: 200 %.',
      'Press PLAY A, switch LISTEN from CROWD to BOOTH and watch PLAYBACK drop back to its low start; bring it up slowly with LOUDER.',
    ],
  },
  // ── 2 ──────────────────────────────────────────────────────────────────
  'Meet the DJ equipment': {
    seeing: [
      'A drawing of the piece of gear or the whole system you picked, with its sockets and cables.',
      'Readouts: FIND (which of the four jobs you are looking for) and, for the laptop system, SENDS TO.',
    ],
    control: [
      'EQUIPMENT: step through the gear — TURNTABLE, MEDIA PLAYER, MIXER, CONTROLLER + LAPTOP, STANDALONE SYSTEM, AUDIO INTERFACE, HEADPHONES and POWERED SPEAKER.',
      'SYSTEM: VINYL, LAPTOP + CONTROLLER, STANDALONE or MODULAR PLAYERS.',
      'SENDS TO (laptop system): CONTROLLER OUTPUTS or LAPTOP’S OWN AUDIO.',
      STOP,
    ],
    changes: [
      'Every setup does four jobs: something PLAYS the music, something MIXES it, something lets YOU hear the next track, something lets the ROOM hear the mix.',
      'Each system answers one question: which device makes the sound the room hears?',
    ],
    teaches: [
      'The gear of a DJ system and how different setups split the four jobs.',
      'Screen 2; sockets and signal types come on Screen 3.',
    ],
    tryThis: [
      'Pick SYSTEM → LAPTOP + CONTROLLER and set SENDS TO to LAPTOP’S OWN AUDIO: the controller’s outputs go silent.',
      'Pick STANDALONE and ask which functions still work with no laptop and no internet.',
    ],
  },
  // ── 3 ──────────────────────────────────────────────────────────────────
  'Connections and signal types': {
    seeing: [
      'The back of deck A (or the turntable) above the back of the mixer, with the source’s white and red RCA plugs. From behind, the mixer is mirrored.',
      'A green outline marks the input pair the CH1 INPUT selector is listening to.',
      'Readouts: FIND (or CH1 INPUT), CH1 L GETS and CH1 R GETS.',
    ],
    control: [
      'SOURCE: DECK A (PLAYER) or TURNTABLE.',
      'PATCH: plug the white and red plugs into the mixer.',
      'IDENTIFY: pick a socket by its job; a halo shows it on the drawing.',
      'PLAY: start the source.',
      STOP,
    ],
    changes: [
      'Every socket has a direction, a connector, a signal (audio, data or power), a level and a number of channels — the shape alone never proves two things belong together.',
      'A raw turntable is far quieter than a line source, and records are cut with the bass turned down. PHONO adds about 36 dB and restores the bass (the RIAA curve); into LINE it sounds tiny and thin.',
    ],
    teaches: [
      'How to read a socket, and why a mixer has separate PHONO and LINE inputs.',
      'Screen 3; Screen 4 wires the whole booth.',
    ],
    tryThis: [
      'Patch deck A into CH1 LINE on both sides and play it, then pull the red plug: CH1 R GETS changes from DECK A R to —.',
      'Switch SOURCE to TURNTABLE (switch on PHONO) and compare CH1 LINE with CH1 PHONO.',
    ],
  },
  // ── 4 ──────────────────────────────────────────────────────────────────
  'Build your first DJ system': {
    seeing: [
      'The whole booth from BEHIND, mirrored: the room at the top (PA speakers on stands, the table, decks, mixer, headphones, booth monitors), and below it, full size, everything you plug in.',
      'Cables glow blue while audio flows. Readouts: CABLES, POWERED and PA L · R.',
    ],
    control: [
      'PATCH: pick a cable by the end already in its source, then tap where its loose end goes. VIEW (inside PATCH): FOLLOW THE CABLE or WHOLE BOOTH.',
      'POWER: switch each device — DECK A, DECK B, MIXER, BOOTH L, BOOTH R, PA L, PA R.',
      'DECKS: play a deck and LISTEN.',
      'UNWIRE: start the wiring again.',
      STOP,
    ],
    changes: [
      'You hear the crowd only when the whole path is complete: player → cable → mixer input → channel → mix → MASTER → PA.',
      'Switching the mixer on or off while the speakers are on can send a thump through them — so speakers go on LAST and off FIRST.',
    ],
    teaches: [
      'How a complete DJ system is wired and powered, and the safe power order.',
      'Screen 4; Screen 5 starts playing music on it.',
    ],
    tryThis: [
      'Wire everything, power the players and mixer, then the speakers last, and LISTEN as the CROWD.',
      'Look at the mixer’s rear before patching deck B: seen from behind, channel 2’s inputs are on the LEFT.',
    ],
  },
  // ── 5 ──────────────────────────────────────────────────────────────────
  'Load and play music': {
    seeing: [
      'The deck you operate from above: its screen, jog wheel, CUE and PLAY. A marker at the glass’s corner says which deck the crowd hears.',
      'Readouts: ON AIR, DECK A or B (the loaded track) and STATE (PLAYING, PAUSED or AT CUE).',
    ],
    control: [
      'BROWSE: switch which deck you operate and LOAD a track (read the BPM in the crate).',
      'PLAY and CUE: the operated deck’s transport.',
      'SEARCH: move through the track; ‹ 1 s and 1 s › step a second, ‹ JOG and JOG › a beat.',
      STOP,
    ],
    changes: [
      'Pressing CUE while paused stores a cue point; pressing it while playing jumps back there and stops.',
      'Deck B’s channel fader is down, so the crowd hears none of what you prepare on it.',
    ],
    teaches: [
      'How the next track is prepared on the spare deck while the crowd keeps hearing the other one — and that the player’s CUE is a place in the track, not the mixer’s headphone CUE.',
      'Screen 5; Screen 6 sets its level.',
    ],
    tryThis: [
      'Press PLAY A so ON AIR reads DECK A, then BROWSE to DECK B and load a track with a nearby BPM.',
      'On deck B, SEARCH a little, press CUE, PLAY, then CUE again: STATE reads AT CUE.',
    ],
  },
  // ── 6 ──────────────────────────────────────────────────────────────────
  'Set gain and read meters': {
    seeing: [
      'The mixer from above: two input selectors, TRIM 1 and TRIM 2, the four meters (CH1, master L and R, CH2) with their scale, and the BUS OVER light.',
      'Readouts: CH1 AVG and CH2 AVG (average, with the peak as PK under it), MASTER (peak) and MIX BUS (CLEAN or OVER).',
    ],
    control: [
      'TRIM 1 and TRIM 2: how much of each track comes into its channel (±1 dB steps).',
      'LEVELS: one lane for CH1 FADER, CH2 FADER or MASTER — its key chooses which.',
      'DECKS: play the decks; also each channel’s INPUT SELECTOR (LINE, PHONO, USB) and CUE 2.',
      STOP,
    ],
    changes: [
      'Each channel meter reads after TRIM, before the fader, so pulling a fader down leaves its meter where it was while MASTER falls.',
      'Two clean channels can still overload the mix bus when they add up: BUS OVER lights, and turning MASTER down only makes the damage quieter.',
    ],
    teaches: [
      'Why tracks are matched by their AVERAGE level, with the peak only a ceiling, and where clipping happens in a mixer.',
      'Screen 6; Screen 7 shows how you hear deck B privately while you set it.',
    ],
    tryThis: [
      'Play deck A and ride TRIM 1 until CH1 AVG sits in −21…−15 dBFS with PK under −3.',
      'Play deck B: CH2 reads “—”. Find why in DECKS (its input selector), then set TRIM 2 within 2 dB of CH1 AVG.',
    ],
  },
  // ── 7 ──────────────────────────────────────────────────────────────────
  'Headphone cue and booth monitoring': {
    seeing: [
      'Part of the mixer — its booth, headphone and CUE controls — with your headphones plugged into the PHONES jack, the output meters, and a booth monitor at half scale.',
      'Each headphone cup lights amber for cue and blue for master. Readouts: CUE BUS, PHONES L, PHONES R and LISTENING.',
    ],
    control: [
      'CUE: press CUE 1 or CUE 2, turn SPLIT on, play the decks and set the CH2 FADER.',
      'PHONES: headphone level. BLEND: the cue ↔ master knob.',
      'BOOTH: the booth monitor level.',
      STOP,
    ],
    changes: [
      'CUE is taken before the channel fader, so a cued deck is in your headphones while the crowd hears none of it.',
      'SPLIT puts the cue in your left ear and the room’s mix in your right, each in mono. BOOTH changes only the booth monitors — the crowd hears no change.',
    ],
    teaches: [
      'How you hear the next track privately, and how the booth feed differs from the crowd feed.',
      'Screen 7; Screen 8 blends the two decks.',
    ],
    tryThis: [
      'In CUE press ▶ PLAY B, then CUE 2 with the CH2 fader down: listening as PHONES you hear deck B; the crowd does not.',
      'Ride BLEND from CUE to MASTER, then turn SPLIT on and listen to each ear.',
    ],
  },
  // ── 8 ──────────────────────────────────────────────────────────────────
  'Channel faders and crossfaders': {
    seeing: [
      'The mixer’s channel faders, the crossfader and its assign and curve switches, under a plot of the chosen crossfader curve.',
      'Readouts: CH1 → MIX and CH2 → MIX in dB, and a fourth cell for the summing test.',
    ],
    control: [
      'FADERS: one lane for CH1 (DECK A) or CH2 (DECK B).',
      'X-FADER: the crossfader.',
      'SETUP: assign each channel to side A or B, choose the CURVE (BLEND, DIP or CUT), and PUT THE SAME TRACK ON BOTH DECKS, ALIGNED.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'The curve decides how the two sides trade places: BLEND holds the total steady (each side −3 dB in the middle), DIP sags (−6 dB each), CUT keeps both full until the very ends.',
      'Two identical, aligned copies at full level add up to twice the amplitude: about +6 dB (two different tracks add only about +3 dB).',
    ],
    teaches: [
      'How channel faders and the crossfader share the job, and why a curve suits long blends or quick cuts.',
      'Screen 8; Screen 9 shapes the blend with EQ.',
    ],
    tryThis: [
      'In SETUP put CH1 on A and CH2 on B, play both, and ride the X-FADER slowly on BLEND, then on CUT.',
      'Use PUT THE SAME TRACK ON BOTH DECKS, ALIGNED, pull CH2 down, then back up: TWO COPIES reads about +6 dB.',
    ],
  },
  // ── 9 ──────────────────────────────────────────────────────────────────
  'EQ isolators and filters': {
    seeing: [
      'Both channels’ EQ and filter knobs (CH1 left, CH2 right) under the frequency response of one channel. A ring marks the knob you are moving.',
      'Readouts: CH1 LOW, CH2 LOW, the filter in use and RES (resonance).',
    ],
    control: [
      'LOW 1 and LOW 2: each channel’s low band, side by side for a bass handover.',
      'EQ+FILT: one lane for CH1/CH2 HIGH and MID, CH1/CH2 FILTER or RESONANCE.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'Each band boosts a little and cuts a lot, crossing over at about 250 Hz and 2.5 kHz here; at the end stop a band is killed.',
      'The FILTER is low-pass to the left, high-pass to the right, off in the center. Two bass lines at once mask each other; kill one LOW and the blend clears.',
    ],
    teaches: [
      'How isolator EQ and filters manage two tracks at once — suggested starting points, not rules.',
      'Screen 9; Screen 10 matches the tempos by ear.',
    ],
    tryThis: [
      'Play both and turn LOW 2 down to KILL: the plot’s low end falls away; mids and highs stay.',
      'Sweep CH1 FILTER slowly, then raise RESONANCE and sweep again: you hear the peak ride.',
    ],
  },
  // ── 10 ─────────────────────────────────────────────────────────────────
  'Tempo, beatmatching and phrasing': {
    seeing: [
      'Two zoomed waveforms, deck A over deck B, with their beat grids and a PHASE strip (center and green is together); below, deck B whole, deck A’s tempo fader and the mixer’s faders.',
      'Readouts: A BPM, B BPM, B vs A (in beats) and A PHRASE (the bar of deck A’s 8-bar phrase).',
    ],
    control: [
      'TEMPO B: deck B’s tempo fader, with fine ±0.05 % steps.',
      'JOG B: PUSH › and ‹ BACK nudges (bigger ones too), CUE B BACK TO BAR 1 and the CH2 FADER.',
      'PLAY B: start deck B. DECKS: play deck A.',
      STOP,
    ],
    changes: [
      'DRIFT: the tempos differ, so the beats slide apart steadily — fix it with TEMPO B. OFFSET: the tempos match but the beats land apart — fix it with a nudge.',
      'On these players tempo moves pitch too: slowing deck B lowers its key a little.',
    ],
    teaches: [
      'Beatmatching by ear and by display, telling drift from offset, and starting on a phrase.',
      'Screen 10; Screen 11 shows what SYNC does with a beatgrid.',
    ],
    tryThis: [
      'Play deck A (DECKS), start deck B with PLAY B when A PHRASE turns to bar 1, then move TEMPO B until B BPM matches A BPM.',
      'Line the beats up until B vs A is within a sixteenth of a beat, then listen: a flam (each kick heard twice, a hair apart) means they still need lining up.',
    ],
  },
  // ── 11 ─────────────────────────────────────────────────────────────────
  'Beatgrids, sync and quantize': {
    seeing: [
      'Deck A’s and deck B’s waveforms, about two bars each, with their beatgrids (thin white beat lines, bold amber bar lines) and the kicks tinted violet.',
      'Readouts: B GRID BPM, GRID (its state), REAL BEATS (how far apart the kicks are) and B BPM.',
    ],
    control: [
      'GRID: choose a grid (GRID RIGHT, FIRST BEAT LATE, HALF BPM), move it (◀ ½ BEAT, ◀ ¼ …), BPM ×2 / ÷2, and LOOP 4 BEATS.',
      'SYNC B: match deck B to deck A by its grid.',
      'QUANTIZE: snap presses to the nearest beat.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'SYNC lines up the GRIDS, not the music: on a wrong grid the tempos match but the kicks land apart.',
      'With QUANTIZE on, a late loop press snaps back to a grid line; off, it starts where you pressed.',
    ],
    teaches: [
      'Why a beatgrid must be checked before SYNC or QUANTIZE can be trusted — ears first, then the grid.',
      'Screen 11; Screen 12 uses the grid for cues, loops and samples.',
    ],
    tryThis: [
      'Play both, press SYNC B, and listen as the CROWD: B’s kicks fall between A’s.',
      'In GRID press ◀ ½ BEAT until the lines sit on the kicks and GRID reads RIGHT, then SYNC B again.',
    ],
  },
  // ── 12 ─────────────────────────────────────────────────────────────────
  'Cue points, loops and samples': {
    seeing: [
      'Deck B’s waveform with its cue points and any loop marked green, two small meters (PHONES and CROWD), and deck B’s pads, loop and beat-jump keys and transport CUE.',
      'Readouts: HOT CUES, LOOP and SAMPLER → (ON AIR or PRIVATE).',
    ],
    control: [
      'HOT CUE: store a cue on a pad, press it again to jump back; CLEAR ALL.',
      'LOOP: loop lengths, EXIT, and beat jumps forward and back.',
      'SAMPLER: fire a sample pad.',
      'DECKS: play deck B.',
      STOP,
    ],
    changes: [
      'Pads and loops land on the beat because QUANTIZE is on for deck B.',
      'The sampler lives in deck B’s software, so its sounds come out of channel 2 and obey its fader, CUE and crossfader side.',
    ],
    teaches: [
      'Hot cues, loops and beat jumps in time, and how to keep a sample off the crowd.',
      'Screen 12, the end of Stage 1; effects come on Screen 13.',
    ],
    tryThis: [
      'Store a hot cue on pad 1, let it play on, then press pad 1 again.',
      'Fire a SAMPLER pad with channel 2 cued and its fader down: PHONES moves, CROWD does not.',
    ],
  },
  // ── 13 ─────────────────────────────────────────────────────────────────
  'Effects and their routing': {
    seeing: [
      'The FX SCOPE: the dry sound going into the effect (a white line) and the effect’s own sound coming out (the blue band), above a map of where the effect sits.',
      'Readouts: EFFECT, SITS ON and TIME.',
    ],
    control: [
      'FX: FX ON, the TYPE (ECHO, REVERB, FILTER, FLANGER), WHERE IT SITS (CH SELECT): CH1, CH2, MASTER or SEND, the SEND knobs and RETURN TO.',
      'The second key names its knob: FX TIME (in beats), FEEDBACK, or LEVEL (DRY/WET) — RETURN on a send.',
      'FADER 1; DECKS (with fader 2).',
      STOP,
    ],
    changes: [
      'An effect’s sound depends on where it sits: one channel (an insert), everything the crowd hears (MASTER), or a send whose return is added back.',
      'TIME follows the tempo: at 1 beat the echoes land on the beat lines. FEEDBACK adds repeats. A return fed back into its own channel builds into a roar.',
    ],
    teaches: [
      'Effect routing — insert, master or send — and effect timing in beats.',
      'Screen 13, the start of Stage 2; key and pitch come on Screen 14.',
    ],
    tryThis: [
      'FX ON with an ECHO on CH1, FX TIME at 1 BEAT and some FEEDBACK, then pull FADER 1 down: the echoes ring on.',
      'Move CH SELECT from CH1 to MASTER and listen as the CROWD: now both decks are affected.',
    ],
  },
  // ── 14 ─────────────────────────────────────────────────────────────────
  'Playback speed, pitch and key': {
    seeing: [
      'Deck B’s pitch plotted against its tempo fader, a strip of the twelve semitones with each deck’s key where it SOUNDS, and deck B’s tempo column.',
      'Readouts: B BPM (with A under it), B PITCH (semitones), B KEY and STRETCH.',
    ],
    control: [
      'TEMPO B: deck B’s tempo, with ±0.5 % steps.',
      'KEY LOCK: hold the pitch while the tempo moves.',
      'KEY: MATCH TEMPO TO A, KEY SHIFT (semitones), TEMPO RANGE (±8 % or ±16 %) and TEMPO 0 %.',
      'DECKS: play both; CH1 DOWN / CH1 UP to hear deck B alone.',
      STOP,
    ],
    changes: [
      'Played faster a track sounds higher — about one semitone for every 6 % of tempo.',
      'KEY LOCK keeps the pitch by stretching the sound in time; the bigger the tempo change, the more the stretch smears the kicks.',
    ],
    teaches: [
      'How speed, pitch and key are linked, and what key lock and key shift do.',
      'Screen 14; stems come on Screen 15.',
    ],
    tryThis: [
      'Tap MATCH TEMPO TO A: deck B slows 3.2 % to 122 BPM and B PITCH reads −0.56 — half a semitone flat. Then press KEY LOCK.',
      'Choose ±16 %, pull TEMPO B toward −14 % and listen to deck B alone (CH1 DOWN).',
    ],
  },
  // ── 15 ─────────────────────────────────────────────────────────────────
  'Stems and source separation': {
    seeing: [
      'A deck’s four stems — drums, bass, chords and melody — each as its own waveform under one playhead; a muted part is hatched.',
      'Readouts: A STEMS, B STEMS and where the stems come FROM (ORIGINAL or SEPARATED, SIMULATED).',
    ],
    control: [
      'STEMS: choose the deck and switch each part on or off.',
      'SOURCE: ORIGINAL STEMS or SEPARATED (SIMULATED).',
      'FADER 2; DECKS: play the decks.',
      STOP,
    ],
    changes: [
      'ORIGINAL stems add up to the track, so a muted part is truly gone.',
      'SEPARATED stems are a guess from the finished mix (here a labeled imitation): a muted melody leaves a ghost, and other parts lose a little.',
    ],
    teaches: [
      'What stem mixing can do, and why separated stems need listening before you trust them.',
      'Screen 15; the optional equipment paths (16–18) come next.',
    ],
    tryThis: [
      'Play deck A, open STEMS and turn MELODY off on ORIGINAL STEMS, then switch SOURCE to SEPARATED (SIMULATED).',
      'Bring deck B in on FADER 2 with A’s DRUMS and BASS off and B’s on.',
    ],
  },
  // ── 16 ─────────────────────────────────────────────────────────────────
  'Laptop software and audio interfaces': {
    seeing: [
      'The DJ software’s AUDIO SETUP window above the rig: a controller, the laptop and the mixer, with a USB cable from the laptop to each.',
      'Readouts: DEVICE, LATENCY (with the buffer under it), DROPOUTS and CH2 GETS.',
    ],
    control: [
      'SETUP: OUTPUT DEVICE, BUFFER (samples), SAMPLE RATE and the workload.',
      'OUTPUT: send software deck 1 and 2 to a USB pair, and set each channel’s input selector.',
      'RIG: plug or unplug the controller’s and the mixer’s USB.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'The software works a buffer at a time: too small and it cannot finish in time — a dropout; bigger is safer but adds latency.',
      'The controller sends only control messages; the mixer’s USB carries the audio, so unplugging it silences both channels.',
    ],
    teaches: [
      'How a laptop setup makes its sound, and the buffer, rate and latency trade.',
      'Screen 16, an optional equipment path; vinyl comes on Screen 17.',
    ],
    tryThis: [
      'Play both, then set OUTPUT DEVICE to MIXER USB AUDIO and raise the buffer until DROPOUTS stays still.',
      'In RIG unplug the controller: the music plays on.',
    ],
  },
  // ── 17 ─────────────────────────────────────────────────────────────────
  'Vinyl turntables and phono audio': {
    seeing: [
      'Three views: the tonearm from the side (counterweight and dial), the phono chain from cartridge to channel, or the booth to scale.',
      'Readouts: DIAL, TRUE FORCE, TRACKING, and STAGES (phono stages) or LOOP GAIN in the room view.',
    ],
    control: [
      'ARM: turn the counterweight, the STYLUS SCALE, lift the arm, zero the dial ring, the ANTI-SKATE DIAL.',
      'PHONO: the turntable’s preamp switch, where its plugs go, CH1 INPUT SELECTOR, the GROUND WIRE.',
      'ROOM: BOOTH MONITOR LEVEL, where the monitor stands, what is under the turntable.',
      'PLATTER: start it; FADER 1; LISTEN AS. ' + STOP,
    ],
    changes: [
      'A dial that was never zeroed lies: the true force differs, and too light a force makes the loud moments spit.',
      'A loose ground wire adds hum; two phono stages make it loud and distorted. A close monitor feeds the turntable its own sound until it howls.',
    ],
    teaches: [
      'How a turntable is set up and kept clean: tracking force, one phono stage, ground, and isolation.',
      'Screen 17, an optional equipment path; digital vinyl comes on Screen 18.',
    ],
    tryThis: [
      'Start the PLATTER, then put the STYLUS SCALE under the needle and compare TRUE FORCE with DIAL.',
      'In PHONO set the GROUND WIRE to LOOSE and listen for the buzz; connect it again.',
    ],
  },
  // ── 18 ─────────────────────────────────────────────────────────────────
  'Digital vinyl systems': {
    seeing: [
      'The control signal as the software sees it (a ring), a map of where each signal goes, the turntable with its control record, and the rear cables.',
      'Readouts: ROUND TRIP, SIGNAL (quality and lock), DECK 1 and CROWD.',
    ],
    control: [
      'PLATTER: start or stop it, NEEDLE DROP, and the PLATTER PITCH.',
      'MODE: ABSOLUTE, RELATIVE or INTERNAL.',
      'CH1 IN: USB (the software’s music) or PHONO (the record itself).',
      'SIGNAL: the preamp switch, the ground wire, the control record’s state, and CALIBRATE.',
      STOP,
    ],
    changes: [
      'The software follows the control tone’s speed and direction — and in ABSOLUTE its place, so a needle drop or a skip moves the music.',
      'Hum or a clipped tone deforms the ring and lowers SIGNAL. With CH1 IN on PHONO, the crowd hears the control tone itself.',
    ],
    teaches: [
      'How a digital vinyl system works, its three modes, and how to recover when tracking fails.',
      'Screen 18, the last optional path; microphones come on Screen 19.',
    ],
    tryThis: [
      'Start the PLATTER and stop it: the ring collapses to a dot and the music stops.',
      'NEEDLE DROP in ABSOLUTE, then switch MODE to RELATIVE and drop again.',
    ],
  },
  // ── 19 ─────────────────────────────────────────────────────────────────
  'Microphones, announcements and talkover': {
    seeing: [
      'The mixer’s mic section (or the room, from MIC → ROOM), with a MIC meter and its green bracket.',
      'Readouts: MIC PEAK, MUSIC DIP, FEEDBACK (dB to spare, or RINGING) and VOICE IN (which feeds carry the voice).',
    ],
    control: [
      'GAIN: the mic input gain, with ±1 dB steps.',
      'MIC: which input, which microphone, phantom power, the mic channel level and where the mic is.',
      'ROUTE: TALK OVER, the mic sends, the booth monitors.',
      'TALK: play the music and make the announcement (TALK NOW, SHOUT).',
      STOP,
    ],
    changes: [
      'A mic makes a tiny signal, so its input adds a lot of gain; TALK OVER dips the music while you speak.',
      'Most condensers need +48 V phantom power; pointed at a monitor, the mic feeds back once the loop passes its limit.',
    ],
    teaches: [
      'Mic gain, power, talkover, feedback and which feeds carry the mic.',
      'Screen 19, the start of Stage 2b; the venue PA comes on Screen 20.',
    ],
    tryThis: [
      'Plug the DYNAMIC mic into MIC 1, switch it ON, press TALK NOW and set GAIN so speech peaks sit at −18 to −8 dBFS.',
      'In MIC → ROOM point the mic AT A MONITOR and watch FEEDBACK, then win back 6 dB.',
    ],
  },
  // ── 20 ─────────────────────────────────────────────────────────────────
  'PA speakers, subs and venue connections': {
    seeing: [
      'Three views: the ROOM from above colored by level, the HANDOFF (mixer rear and the venue’s stage box), and the SYSTEM (crossover, tops and sub).',
      'Readouts change with the view: FLOOR, AT THE DECKS, 4-HOUR DOSE and TT LOOP; DJ L · DJ R; AT 100 Hz.',
    ],
    control: [
      'MASTER: your output level.',
      'VIEW: ROOM, HANDOFF or SYSTEM.',
      'VENUE: what the stage box inputs DJ L and DJ R get, the cable run, ASK THE ENGINEER for gain, the booth monitors.',
      'SETUP: where the tops and subs stand, the room map, the processor, the turntable.',
      STOP,
    ],
    changes: [
      'In a venue your MASTER is a line feed to someone else’s system: hand it over balanced at its unity mark and let the engineer set the room.',
      'With the crossover ON, tops and sub meet flat at 100 Hz. Tops aimed from the front corners cover the floor and keep the decks out of their beam.',
    ],
    teaches: [
      'How a DJ feed reaches a venue PA, and how placement and level protect the floor and the DJ.',
      'Screen 20; the Sound Systems Lab covers the PA in depth. Recording comes on Screen 21.',
    ],
    tryThis: [
      'In VENUE put MASTER L into DJ L and MASTER R into DJ R, with MASTER at its unity mark, ASK THE ENGINEER until FLOOR reads about 95 dBA — this model’s suggested level for a busy floor.',
      'Try each placement in SETUP and bring 4-HOUR DOSE to 100 % or less — your dose at the decks from the room alone; headphones add to it.',
    ],
  },
  // ── 21 ─────────────────────────────────────────────────────────────────
  'Recording and streaming': {
    seeing: [
      'The tap the recorder takes, the RECORDER with its meters, and the take’s waveform with green marks where the mic is.',
      'Readouts: REC PEAK, RECORDER (STOPPED, RECORDING or CLIPPING), MASTER PEAK and VOICE IN.',
    ],
    control: [
      'REC GAIN: the recorder’s own input level (±1 dB steps).',
      'MASTER: the room level.',
      'TAP: REC OUT, BOOTH OUT, LOOPBACK or UNPLUG.',
      'REC: the recorder, the music and the mic (MIC → REC), the booth level; RECORD, STOP and PLAY THE TAKE.',
      STOP,
    ],
    changes: [
      'REC OUT does not follow MASTER, so a room move leaves the take alone; BOOTH OUT follows every booth move.',
      'Too much REC GAIN clips the recorder while the room sounds fine.',
    ],
    teaches: [
      'Recording from the right tap at the right level, with the mic in the take — and proving it on playback.',
      'Screen 21; hybrid rigs come on Screen 22.',
    ],
    tryThis: [
      'Pick TAP → REC OUT, press RECORD and ride MASTER: the room changes, but the RECORDER’s level does not.',
      'Set REC GAIN so REC PEAK sits between −12 and −3 dBFS, then PLAY THE TAKE.',
    ],
  },
  // ── 22 ─────────────────────────────────────────────────────────────────
  'Hybrid DJ systems': {
    seeing: [
      'The back of the mixer (MIDI OUT and its CLOCK switch), the drum machine’s back panel, and its top with the step lights.',
      'Readouts: DECK A (BPM), MACHINE (its BPM, EXT or INT), ITS BAR 1 and IN THE ROOM.',
    ],
    control: [
      'TEMPO A: deck A’s tempo.',
      'CLOCK: the mixer’s CLOCK switch, the lead from MIDI OUT, and what the drum machine follows.',
      'START: deck A and the drum machine — PLAY NOW or START ON THE NEXT BAR.',
      'AUDIO: what CH 2’s LINE inputs get, the CH 2 FADER and CUE 2.',
      STOP,
    ],
    changes: [
      'A clock lead carries timing and no sound; an audio lead carries sound and no tempo.',
      'Clock sets the tempo, not the bar: started off the beat, the machine runs in tempo but out of phase.',
    ],
    teaches: [
      'How an extra instrument joins a DJ rig: audio on one cable, clock on another, started on the one.',
      'Screen 22; changeovers come on Screen 23.',
    ],
    tryThis: [
      'In CLOCK set CH 1, 5-PIN MIDI and EXTERNAL, then play deck A: MACHINE reads deck A’s tempo.',
      'Use START ON THE NEXT BAR, then ride TEMPO A and watch MACHINE follow.',
    ],
  },
  // ── 23 ─────────────────────────────────────────────────────────────────
  'Performer changeovers and backup playback': {
    seeing: [
      'The signal-flow board: each laptop and player on the left, the mixer’s channels and master in the middle, speakers and headphones on the right, power cords below.',
      'Readouts: ON AIR, CH 1 AVG, CH 2 AVG and HUM.',
    ],
    control: [
      'TRIM 2: channel 2’s trim.',
      'PLUG: connect DJ 2’s laptop, the input selectors, the charger.',
      'PREDICT: mark which disconnection would stop the music, then check.',
      'MIX: play, the faders, headphone cue, and the frozen-laptop recovery.',
      STOP,
    ],
    changes: [
      'Connecting a laptop whose charger is earthed on another circuit closes a ground loop: a hum on CH 2.',
      'Levels matched in the headphones (CH 2 AVG within 2 dB of CH 1 AVG) let the room change DJs without a jump or a gap.',
    ],
    teaches: [
      'How two DJs share one mixer without the room noticing, and how to recover from a frozen laptop.',
      'Screen 23; the event challenge on Screen 24 puts it all together.',
    ],
    tryThis: [
      'Start DJ 1’s laptop in MIX, then PREDICT which disconnection would stop the music.',
      'Connect DJ 2 with CH 2 down, find the hum’s loop on the board, and break it safely.',
    ],
  },
  // ── 24 ─────────────────────────────────────────────────────────────────
  'Troubleshooting and the complete system challenge': {
    seeing: [
      'SIGNAL FLOW (a board where every card’s meter taps the real signal) or THE BOOTH. Everything is cabled and switched off.',
      'Readouts: EVENT (its number, SETTING UP or DOORS OPEN), POWER, THE ROOM and PLAYING.',
    ],
    control: [
      'FADERS: channel faders, with CH 1 ↓ / CH 1 ↑ steps.',
      'MIXER: inputs, trims, crossfader, headphones, MASTER and BOOTH.',
      'DECKS: play, cue and load.',
      'EVENT: POWER, RECORD, the mic, OPEN THE DOORS, SEE, and a new or replayed event.',
      STOP,
    ],
    changes: [
      'When the doors open something will be wrong: a dark card after a live one shows where the signal stops.',
      'The tempos are matched for you, with key lock on — the lesson here is the system.',
    ],
    teaches: [
      'The whole job in one event: power up, cue, mix, announce, then find and fix a fault from the evidence and debrief it.',
      'Screen 24, the end of the lab; FINISH shows what is left.',
    ],
    tryThis: [
      'In EVENT → POWER switch the decks and mixer on first, the speakers LAST, then start RECORD and OPEN THE DOORS.',
      'When the fault appears, follow the board from the left until a card goes dark.',
    ],
  },
};

/* ── the what's-left screen (PagedLab → LabEndScreen, after FINISH) ────────
 * Written against the code path: PagedLab passes mode 'progress' (this lab
 * hands it no creditLabKey / pageCreditKeys), so finished rows read ✓ DONE;
 * noun 'page'; no appended check row (no understanding check is authored for
 * dj-systems); screens 16–18 are optional (optionalPage); each row's line is
 * leftDetail → goalStore.leftLine; PRACTICE AGAIN → goTo(0); DONE uses the
 * default label and safeGoBack. A screen marks itself (manualDone) through
 * bits.useVisitGoals when every goal chip latches; NEXT never marks it. The
 * whole lab's tr_dj credit is labDoneKey once every REQUIRED screen is done.
 */
export const DJ_END_GUIDE: ScreenGuide = {
  seeing: [
    'The title reads WHAT’S LEFT, or LAB COMPLETE once every required screen is done (YOUR PROGRESS if saved progress could not be read). The line under it says whether your work is saved.',
    'Each screen still to do is listed by name, usually with Left: and up to three goals your last visit missed, then + n more. Screens 16–18, until done, sit under OPTIONAL PATHS. Finished screens fold into one ✓ DONE line.',
  ],
  control: [
    'Tap any listed screen to jump straight to it.',
    'REVIEW ▾ on the ✓ DONE line unfolds the finished screens; tap one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START reopens Screen 1 and clears nothing.',
    'DONE · BACK TO LABS leaves the lab.',
    'WHAT’S LEFT ▾ at the top opens the list of screens; START OVER (PRACTICE), at its foot, asks first, then clears every ✓ DONE mark and reopens Screen 1 for a fresh run.',
  ],
  changes: [
    'A screen counts once every goal chip on it ticks in one visit: its tasks, its troubleshooting exercise and, on most screens, Pass the check. It marks itself; NEXT never counts it.',
    'Left: is what your last visit this session missed (every goal, if not opened yet). Chips start empty each visit, so a screen counts only when all tick in one visit.',
    'Screens 16–18 are optional and never hold back LAB COMPLETE.',
  ],
  teaches: [
    'Which parts of the DJ booth you have worked through, and which you have not met yet.',
    'With every required screen done, the lab counts toward the DJ credentials that list it. Reopening a screen to practice never clears its ✓ DONE. A fresh run never takes back credential credit already earned.',
  ],
  tryThis: [
    'Jump to the first screen still listed and tick every goal chip on it in that one visit; its Left: line names the ones your last visit missed.',
    'Tap REVIEW ▾ and open a finished screen: its goal chips start empty for practice, and it stays ✓ DONE here.',
  ],
};
