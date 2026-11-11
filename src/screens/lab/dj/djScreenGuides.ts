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
    intro: {
      learning: 'Why safe listening comes first in a DJ booth: start low, keep STOP in reach, and see how level and time together use up a day’s hearing allowance.',
      start: 'In the A LOUD NIGHT, IN NUMBERS tile, pick a 4 h set at 88 dBA, then 91 dBA, and compare. Then press PLAY A and switch LISTEN from CROWD to BOOTH.',
    },
    seeing: [
      'You’re looking down on a DJ booth: deck A on the left, the two-channel mixer in the middle, deck B on the right. The line under it shows whose ears you’re listening with.',
      'BOOTH shows the sound status and LISTENING AS shows whose ears you hear. PLAYBACK is how loud the lab asks your phone to play, not a measured sound level.',
      'Below sit the five steps, the A LOUD NIGHT, IN NUMBERS tile and a fault to fix.',
    ],
    control: [
      'Press PLAY A to start deck A.',
      'Use LISTEN to choose whose ears your phone plays: CROWD (the PA), BOOTH (the booth monitors) or PHONES (your headphones). QUIETER and LOUDER change the level.',
      'Tap RESET to put the booth back as it started.',
      STOP,
      'In the tile, pick a level from 85 to 100 dBA and a set length of 1, 2 or 4 h.',
    ],
    changes: [
      'Each time you switch who you listen as, PLAYBACK starts LOW again, so a louder feed never arrives at full level.',
      'The tile’s percentage follows the NIOSH guideline: 85 dBA is the limit for 8 hours, and every 3 dB louder halves the safe time.',
      'So level and time trade off: a short set at a high level can use as much of the day as a long, quieter one.',
    ],
    teaches: [
      'Safe operation comes first: start at a low level, keep STOP within reach, and bring sound up slowly.',
      'A dBA level means little without a time. Every 3 dB louder halves how long your ears can safely take it, so a loud booth uses up a day’s hearing allowance quickly.',
      '100 % is a full day’s allowance; anything above it is past the safe limit.',
    ],
    tryThis: [
      'In the tile, pick a 4 h set at 88 dBA: that’s 100 % of a day’s allowance. Step up to 91 dBA and it reads 200 %.',
      'Press PLAY A, switch LISTEN from CROWD to BOOTH and watch PLAYBACK drop back to its low start. Bring it up slowly with LOUDER.',
      'Keep the level fixed and change the set from 4 h to 2 h, then 1 h. Halving the time halves the percentage.',
    ],
  },
  // ── 2 ──────────────────────────────────────────────────────────────────
  'Meet the DJ equipment': {
    intro: {
      learning: 'The four jobs every DJ setup does (play the music, mix it, let the DJ hear the next track, let the room hear the mix) and which device does each.',
      start: 'Step through EQUIPMENT to meet each piece of gear. Then pick a SYSTEM and use FIND to spot which device does each of the four jobs.',
    },
    seeing: [
      'You see a drawing of the gear or the whole system you picked, with its sockets and cables.',
      'FIND names the job you’re looking for. With the laptop system, SENDS TO shows where the music leaves on its way to the room.',
    ],
    control: [
      'Use EQUIPMENT to step through the gear: TURNTABLE, MEDIA PLAYER, MIXER, CONTROLLER + LAPTOP, STANDALONE SYSTEM, AUDIO INTERFACE, HEADPHONES and POWERED SPEAKER.',
      'Use SYSTEM to compare whole setups: VINYL, LAPTOP + CONTROLLER, STANDALONE or MODULAR PLAYERS.',
      'With the laptop system, set SENDS TO to CONTROLLER OUTPUTS or LAPTOP’S OWN AUDIO.',
      STOP,
    ],
    changes: [
      'Every setup does the same four jobs: something PLAYS the music, something MIXES it, something lets YOU hear the next track, and something lets the ROOM hear the mix.',
      'What changes between systems is which device does each job. For each one, ask: which device makes the sound the room hears?',
    ],
    teaches: [
      'A DJ system is a set of jobs, not a set of boxes: play, mix, cue the next track privately, and feed the room.',
      'Different setups split those jobs differently. One box can do several jobs, and in a laptop setup the sound can leave from the controller or from the laptop itself, but only one path feeds the room.',
    ],
    tryThis: [
      'Pick SYSTEM → LAPTOP + CONTROLLER and set SENDS TO to LAPTOP’S OWN AUDIO: the controller’s outputs go silent.',
      'Pick STANDALONE and ask yourself which functions still work with no laptop and no internet.',
    ],
  },
  // ── 3 ──────────────────────────────────────────────────────────────────
  'Connections and signal types': {
    intro: {
      learning: 'How to read a socket by its direction, connector, signal, level and channels, and why a turntable needs a PHONO input rather than LINE.',
      start: 'Use PATCH to plug deck A’s white and red plugs into CH1 LINE, then press PLAY. Pull the red plug and watch CH1 R GETS.',
    },
    seeing: [
      'You’re behind the gear: the back of deck A (or the turntable) above the back of the mixer, with the source’s white and red RCA plugs. Seen from behind, the mixer is mirrored.',
      'A green outline marks the input pair the CH1 INPUT selector is listening to.',
      'FIND (or CH1 INPUT) shows what you’re looking for. CH1 L GETS and CH1 R GETS show what reaches each side of channel 1.',
    ],
    control: [
      'SOURCE picks DECK A (PLAYER) or TURNTABLE.',
      'In PATCH, plug the white and red plugs into the mixer. White carries left, red carries right.',
      'IDENTIFY lets you pick a socket by its job; a halo shows where it is on the drawing.',
      'PLAY starts the source.',
      STOP,
    ],
    changes: [
      'Every socket has a direction, a connector, a signal (audio, data or power), a level and a number of channels. The shape alone never proves two things belong together.',
      'A raw turntable is far quieter than a line source, and records are cut with the bass turned down. PHONO adds about 36 dB and restores the bass (the RIAA curve).',
      'Into LINE, a turntable sounds tiny and thin.',
    ],
    teaches: [
      'Two plugs can fit the same socket and still be wrong: check direction, signal, level and channels, not just the shape.',
      'A turntable needs a phono stage. It lifts a very weak signal by about 36 dB and puts back the bass that was turned down when the record was cut, which is why a mixer has separate PHONO and LINE inputs.',
    ],
    tryThis: [
      'Patch deck A into CH1 LINE on both sides and play it, then pull the red plug: CH1 R GETS changes from DECK A R to —.',
      'Switch SOURCE to TURNTABLE (switch on PHONO), then compare CH1 LINE with CH1 PHONO. Listen for the level and the bass.',
    ],
  },
  // ── 4 ──────────────────────────────────────────────────────────────────
  'Build your first DJ system': {
    intro: {
      learning: 'How a DJ system is wired from player to PA, why the crowd hears nothing until every link is complete, and why speakers power on last and off first.',
      start: 'Open PATCH and connect each cable: tap the end already in its source, then where its loose end goes. Then use POWER: decks and mixer first, speakers last.',
    },
    seeing: [
      'You’re looking at the whole booth from BEHIND, so it’s mirrored. At the top is the room: PA speakers on stands, the table, decks, mixer, headphones and booth monitors.',
      'Below it, full size, is everything you plug in. A cable glows blue while audio flows through it. CABLES, POWERED and PA L · R track your wiring, the power and what reaches each PA speaker.',
    ],
    control: [
      'In PATCH, pick a cable by the end already in its source, then tap where its loose end goes. VIEW switches between FOLLOW THE CABLE and WHOLE BOOTH.',
      'POWER switches each device: DECK A, DECK B, MIXER, BOOTH L, BOOTH R, PA L, PA R.',
      'DECKS plays a deck so you can LISTEN.',
      'UNWIRE clears the wiring so you can start again.',
      STOP,
    ],
    changes: [
      'You hear the crowd only when the whole path is complete: player → cable → mixer input → channel → mix → MASTER → PA. One missing link anywhere means silence.',
      'Switching the mixer on or off while the speakers are on can send a thump through them, so speakers go on LAST and off FIRST.',
      'The first cable that stays dark while music plays shows where the path breaks.',
    ],
    teaches: [
      'A DJ system is one chain from player to PA. When the room is silent, you follow that chain link by link to find where the sound stops.',
      'Power order protects the speakers and the people in front of them: speakers on last and off first, so no switching thump reaches them.',
    ],
    tryThis: [
      'Wire everything, power the decks and mixer, then the speakers last, and LISTEN as the CROWD.',
      'Look at the mixer’s rear before patching deck B: seen from behind, channel 2’s inputs are on the LEFT.',
    ],
  },
  // ── 5 ──────────────────────────────────────────────────────────────────
  'Load and play music': {
    intro: {
      learning: 'How the next track is readied on the spare deck while the crowd hears the other, and why the player’s CUE marks a place in the track.',
      start: 'Press PLAY A so ON AIR reads DECK A. Then use BROWSE to switch to deck B and LOAD a track with a nearby BPM.',
    },
    seeing: [
      'You’re looking down on the deck you operate: its screen, jog wheel, CUE and PLAY. A marker in the corner shows which deck the crowd hears.',
      'ON AIR names the deck the crowd hears. DECK A or B shows the loaded track, and STATE shows PLAYING, PAUSED or AT CUE.',
    ],
    control: [
      'BROWSE switches which deck you operate and LOADs a track. Read each track’s BPM in the crate before you pick.',
      'PLAY and CUE run the deck you’re operating.',
      'SEARCH moves through the track: ‹ 1 s and 1 s › step a second, ‹ JOG and JOG › step a beat.',
      STOP,
    ],
    changes: [
      'Pressing CUE while paused stores a cue point; pressing it while playing jumps back there and stops.',
      'Deck B’s channel fader is down, so the crowd hears none of what you prepare on it.',
    ],
    teaches: [
      'A DJ works one track ahead: the crowd hears one deck while the next track is found, cued and checked on the other.',
      'The player’s CUE is a place in the track. The mixer’s headphone CUE is a different control with the same name.',
      'A track with a nearby BPM needs only a small tempo change to blend.',
    ],
    tryThis: [
      'Press PLAY A so ON AIR reads DECK A, then BROWSE to DECK B and load a track with a nearby BPM.',
      'On deck B, SEARCH a little, press CUE, PLAY, then CUE again: STATE reads AT CUE.',
    ],
  },
  // ── 6 ──────────────────────────────────────────────────────────────────
  'Set gain and read meters': {
    intro: {
      learning: 'Why tracks are matched by their average level, with the peak only a ceiling, and why clipping can happen at the mix bus even when each channel is clean.',
      start: 'Play deck A and ride TRIM 1 until CH1 AVG sits between −21 and −15 dBFS with PK under −3. Then play deck B and find why CH2 reads “—”.',
    },
    seeing: [
      'You’re looking down on the mixer: two input selectors, TRIM 1 and TRIM 2, four meters (CH1, master L and R, CH2) with their scale, and the BUS OVER light.',
      'CH1 AVG and CH2 AVG show each channel’s average level, with its peak as PK under it. MASTER shows the output peak, and MIX BUS reads CLEAN or OVER.',
    ],
    control: [
      'TRIM 1 and TRIM 2 set how much of each track comes into its channel, in ±1 dB steps.',
      'LEVELS gives you one lane for CH1 FADER, CH2 FADER or MASTER; its key chooses which.',
      'DECKS plays the decks. It also holds each channel’s INPUT SELECTOR (LINE, PHONO, USB) and CUE 2.',
      STOP,
    ],
    changes: [
      'Each channel meter reads after TRIM and before the fader. Pull a fader down and its meter stays where it was while MASTER falls.',
      'Two clean channels can still overload the mix bus when they add up: BUS OVER lights, and turning MASTER down only makes the damage quieter.',
    ],
    teaches: [
      'Loudness follows average level, so tracks are matched by AVG; the peak is only the ceiling to stay under.',
      'Trim sets how much signal enters the channel; the fader only sets how much of it goes to the mix.',
      'Signals that add together can clip where they meet, at the mix bus. Turning down after that point can’t undo it.',
    ],
    tryThis: [
      'Play deck A and ride TRIM 1 until CH1 AVG sits in −21…−15 dBFS with PK under −3.',
      'Play deck B: CH2 reads “—”. Look at its input selector in DECKS to find why, then set TRIM 2 within 2 dB of CH1 AVG.',
    ],
  },
  // ── 7 ──────────────────────────────────────────────────────────────────
  'Headphone cue and booth monitoring': {
    intro: {
      learning: 'How you hear the next track privately in your headphones, and how the booth monitor feed is separate from what the crowd hears.',
      start: 'In CUE press ▶ PLAY B, then CUE 2 with the CH2 fader down. Listen as PHONES, then as the CROWD, and compare what each one hears.',
    },
    seeing: [
      'You see part of the mixer: its booth, headphone and CUE controls, with your headphones in the PHONES jack. Beside them are the output meters and a booth monitor at half scale.',
      'Each headphone cup lights amber for cue and blue for master. CUE BUS, PHONES L, PHONES R and LISTENING show what each feed carries.',
    ],
    control: [
      'In CUE, press CUE 1 or CUE 2, turn SPLIT on, play the decks and set the CH2 FADER.',
      'PHONES sets your headphone level. BLEND is the cue ↔ master knob.',
      'BOOTH sets the booth monitor level.',
      STOP,
    ],
    changes: [
      'CUE is taken before the channel fader, so a cued deck is in your headphones while the crowd hears none of it.',
      'SPLIT puts the cue in your left ear and the room’s mix in your right, each in mono.',
      'BOOTH changes only the booth monitors; the crowd hears no change.',
    ],
    teaches: [
      'Headphone cue is a private, pre-fader feed: you can hear and prepare a track the room can’t hear.',
      'BLEND and SPLIT let you compare the next track with what the room hears, side by side.',
      'The booth monitors are a separate feed for the DJ, so turning them up doesn’t change the crowd’s level.',
    ],
    tryThis: [
      'In CUE press ▶ PLAY B, then CUE 2 with the CH2 fader down. Listen as PHONES, then switch to CROWD: what reaches the room?',
      'Ride BLEND from CUE to MASTER, then turn SPLIT on and listen to each ear: the next track on the left, the room on the right.',
    ],
  },
  // ── 8 ──────────────────────────────────────────────────────────────────
  'Channel faders and crossfaders': {
    intro: {
      learning: 'How channel faders and the crossfader share the blend, how each crossfader curve trades the two sides, and why two identical copies add up louder than two different tracks.',
      start: 'In SETUP put CH1 on A and CH2 on B, then play both with DECKS. Ride the X-FADER slowly on BLEND, then on CUT.',
    },
    seeing: [
      'You see the mixer’s channel faders, the crossfader and its assign and curve switches, under a plot of the crossfader curve you chose.',
      'CH1 → MIX and CH2 → MIX show, in dB, how much of each channel reaches the mix. The fourth cell, TWO COPIES, is for the summing test.',
    ],
    control: [
      'FADERS gives you one lane for CH1 (DECK A) or CH2 (DECK B).',
      'X-FADER: the crossfader.',
      'In SETUP, assign each channel to side A or B, choose the CURVE (BLEND, DIP or CUT), or tap PUT THE SAME TRACK ON BOTH DECKS, ALIGNED.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'The curve decides how the two sides trade places. BLEND holds the total steady (each side −3 dB in the middle). DIP sags (−6 dB each). CUT keeps both full until the very ends.',
      'Two identical, aligned copies at full level add up to twice the amplitude: about +6 dB. Two different tracks add only about +3 dB.',
    ],
    teaches: [
      'Channel faders set each deck’s level; the crossfader moves the mix from one side to the other.',
      'A smooth curve like BLEND suits long blends. CUT suits quick cuts, because both sides stay full until the very end.',
      'Matching signals add up more than different ones, so a blend can be louder than either track alone.',
    ],
    tryThis: [
      'In SETUP put CH1 on A and CH2 on B, play both, and ride the X-FADER slowly on BLEND, then on CUT.',
      'Use PUT THE SAME TRACK ON BOTH DECKS, ALIGNED, pull CH2 down, then back up: TWO COPIES reads about +6 dB.',
    ],
  },
  // ── 9 ──────────────────────────────────────────────────────────────────
  'EQ isolators and filters': {
    intro: {
      learning: 'How isolator EQ and filters let two tracks share the room at once, and why two bass lines playing together blur into each other.',
      start: 'Play both decks with DECKS, then turn LOW 2 down to KILL and watch the plot’s low end fall away. Then sweep CH1 FILTER slowly.',
    },
    seeing: [
      'You see both channels’ EQ and filter knobs, CH1 on the left and CH2 on the right, under the frequency response of one channel. A ring marks the knob you’re moving.',
      'CH1 LOW and CH2 LOW show each low band’s setting. You also see the filter in use and RES (resonance).',
    ],
    control: [
      'LOW 1 and LOW 2 sit side by side, so you can hand the bass from one channel to the other.',
      'EQ+FILT gives you one lane for CH1/CH2 HIGH and MID, CH1/CH2 FILTER or RESONANCE.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'Each band boosts a little and cuts a lot, crossing over at about 250 Hz and 2.5 kHz here. At the end stop, a band is killed.',
      'The FILTER is low-pass to the left, high-pass to the right and off in the center.',
      'Two bass lines at once mask each other; kill one LOW and the blend clears.',
    ],
    teaches: [
      'An isolator EQ is built to remove a band, not to polish it, so it cuts much further than it boosts.',
      'Low end from two tracks piles up and blurs, so a common starting point is to let one bass line play at a time.',
      'Resonance adds a peak at the filter’s edge, which makes a sweep stand out. These are suggested starting points, not rules.',
    ],
    tryThis: [
      'Play both and turn LOW 2 down to KILL: the plot’s low end falls away; mids and highs stay.',
      'Sweep CH1 FILTER slowly, then raise RESONANCE and sweep again: you hear the peak ride.',
    ],
  },
  // ── 10 ─────────────────────────────────────────────────────────────────
  'Tempo, beatmatching and phrasing': {
    intro: {
      learning: 'How two tracks are beatmatched by ear and by display: drift means the tempos differ, offset means the beats land apart, and a new track starts on a phrase.',
      start: 'Play deck A with DECKS. When A PHRASE turns to bar 1, press PLAY B, then move TEMPO B until B BPM matches A BPM.',
    },
    seeing: [
      'Two zoomed waveforms, deck A over deck B, show their beat grids. The PHASE strip shows how close the beats are: center and green means together. Below are deck B whole, deck A’s tempo fader and the mixer’s faders.',
      'A BPM and B BPM show each tempo, B vs A how far apart the beats land (in beats), and A PHRASE which bar of deck A’s 8-bar phrase is playing.',
    ],
    control: [
      'TEMPO B is deck B’s tempo fader, with fine ±0.05 % steps.',
      'JOG B holds the PUSH › and ‹ BACK nudges (bigger ones too), CUE B BACK TO BAR 1 and the CH2 FADER.',
      'PLAY B: start deck B. DECKS: play deck A.',
      STOP,
    ],
    changes: [
      'DRIFT: the tempos differ, so the beats slide apart steadily. Fix it with TEMPO B.',
      'OFFSET: the tempos match but the beats land apart. Fix it with a nudge.',
      'On these players tempo moves pitch too: slowing deck B lowers its key a little.',
    ],
    teaches: [
      'Beatmatching needs two things: the same tempo and the beats lined up. Drift and offset can sound alike but need different fixes.',
      'A flam, each kick heard twice a hair apart, is your ear’s clue that the beats aren’t lined up yet.',
      'Music moves in phrases, here 8 bars. Starting the new track on bar 1 keeps its sections in step with the one playing.',
    ],
    tryThis: [
      'Play deck A (DECKS), start deck B with PLAY B when A PHRASE turns to bar 1, then move TEMPO B until B BPM matches A BPM.',
      'Line the beats up until B vs A is within a sixteenth of a beat, then listen: a flam (each kick heard twice, a hair apart) means they still need lining up.',
    ],
  },
  // ── 11 ─────────────────────────────────────────────────────────────────
  'Beatgrids, sync and quantize': {
    intro: {
      learning: 'Why SYNC and QUANTIZE follow the beatgrid, not the music, so a wrong grid gives matching tempos with kicks that still land apart.',
      start: 'Play both decks with DECKS, press SYNC B and listen as the CROWD: B’s kicks fall between A’s. Then fix deck B’s grid in GRID and sync again.',
    },
    seeing: [
      'You see deck A’s and deck B’s waveforms, about two bars each, with their beatgrids: thin white beat lines and bold amber bar lines. The kicks are tinted violet.',
      'B GRID BPM is the tempo deck B’s grid claims, and GRID shows the grid’s state. REAL BEATS shows how far apart the kicks really are. B BPM is deck B’s tempo.',
    ],
    control: [
      'In GRID, choose a grid (GRID RIGHT, FIRST BEAT LATE, HALF BPM), move it (◀ ½ BEAT, ◀ ¼ …), use BPM ×2 / ÷2, or LOOP 4 BEATS.',
      'SYNC B matches deck B to deck A using its grid.',
      'QUANTIZE snaps your presses to the nearest beat.',
      'DECKS: play both.',
      STOP,
    ],
    changes: [
      'SYNC lines up the GRIDS, not the music: on a wrong grid the tempos match but the kicks land apart.',
      'With QUANTIZE on, a late loop press snaps back to a grid line. With it off, the loop starts where you pressed.',
    ],
    teaches: [
      'A beatgrid is the software’s guess at where the beats are, and SYNC and QUANTIZE trust that guess completely.',
      'So your ears come first: if the grid lines don’t sit on the kicks, sync is wrong even when the BPMs agree.',
    ],
    tryThis: [
      'Play both, press SYNC B, and listen as the CROWD: B’s kicks fall between A’s.',
      'In GRID press ◀ ½ BEAT until the lines sit on the kicks and GRID reads RIGHT, then SYNC B again.',
    ],
  },
  // ── 12 ─────────────────────────────────────────────────────────────────
  'Cue points, loops and samples': {
    intro: {
      learning: 'How hot cues, loops and beat jumps stay in time with the music, and how to keep a sample in your headphones and off the crowd.',
      start: 'Play deck B with DECKS, store a hot cue on pad 1, let it play on, then press pad 1 again. Next, try a loop and a beat jump.',
    },
    seeing: [
      'You see deck B’s waveform with its cue points, and any loop marked green. Two small meters show PHONES and CROWD.',
      'Below are deck B’s pads, loop and beat-jump keys and its transport CUE. HOT CUES and LOOP show what’s stored and looping; SAMPLER → shows whether samples go ON AIR or stay PRIVATE.',
    ],
    control: [
      'In HOT CUE, store a cue on a pad and press it again to jump back. CLEAR ALL empties the pads.',
      'LOOP sets loop lengths, EXIT leaves the loop, and the beat jumps move forward and back.',
      'SAMPLER: fire a sample pad.',
      'DECKS: play deck B.',
      STOP,
    ],
    changes: [
      'Pads and loops land on the beat because QUANTIZE is on for deck B.',
      'The sampler lives in deck B’s software, so its sounds come out of channel 2. They obey channel 2’s fader, CUE and crossfader side.',
    ],
    teaches: [
      'Hot cues, loops and beat jumps keep the groove only when they land in time; quantized, they jump on the beat.',
      'A sample follows the channel it plays through, so that channel’s fader and CUE decide whether the crowd hears it or only you do.',
    ],
    tryThis: [
      'Store a hot cue on pad 1, let it play on, then press pad 1 again.',
      'Fire a SAMPLER pad with channel 2 cued and its fader down: PHONES moves, CROWD does not.',
    ],
  },
  // ── 13 ─────────────────────────────────────────────────────────────────
  'Effects and their routing': {
    intro: {
      learning: 'Where an effect sits decides what it changes: one channel, the whole mix, or a send added back. And why DJ effect times are set in beats.',
      start: 'In FX, tap FX ON, pick ECHO as the TYPE and set CH SELECT to CH1. Set FX TIME to 1 BEAT, play deck A and watch the blue band follow the white line.',
    },
    seeing: [
      'The FX SCOPE shows two sounds: the white line is the dry sound going into the effect, and the blue band is the effect’s own sound coming out.',
      'Below it, a map shows where the effect sits in the mixer.',
      'EFFECT names the effect, SITS ON says where it is, and TIME shows its length in beats.',
    ],
    control: [
      'In FX, tap FX ON and pick a TYPE: ECHO, REVERB, FILTER or FLANGER.',
      'Use WHERE IT SITS (CH SELECT) to put it on CH1, CH2, MASTER or SEND. On a send, set the SEND knobs and RETURN TO.',
      'The second key names the knob it turns: FX TIME (in beats), FEEDBACK, or LEVEL (DRY/WET). On a send it becomes RETURN.',
      'FADER 1 is channel 1’s fader. DECKS plays the decks and holds fader 2.',
      STOP,
    ],
    changes: [
      'On CH1 or CH2 the effect is an insert after its fader: it changes only that deck. On MASTER, it changes everything the crowd hears. On a send, a copy goes to the effect and its return is added back.',
      'TIME follows the tempo, so at 1 beat the echoes land on the beat lines. FEEDBACK sends the echo back in for more repeats.',
      'Feed a return back into its own channel and it loops on itself, building into a roar.',
    ],
    teaches: [
      'An insert changes one signal, a master effect changes the whole mix, and a send adds an effected copy beside the dry sound.',
      'Effect times set in beats stay tied to the tempo, so echoes fall in time with the music instead of against it.',
      'A loop that feeds an effect’s output back into its own channel can grow louder on every pass until it roars.',
    ],
    tryThis: [
      'Tap FX ON with an ECHO on CH1, FX TIME at 1 BEAT and some FEEDBACK. Then pull FADER 1 down: the echoes ring on after the track drops out.',
      'Move CH SELECT from CH1 to MASTER and listen as the CROWD. Now both decks go through the effect, not just deck A.',
    ],
  },
  // ── 14 ─────────────────────────────────────────────────────────────────
  'Playback speed, pitch and key': {
    intro: {
      learning: 'Why playing a track faster also makes it sound higher, about one semitone for every 6 % of tempo, and how KEY LOCK holds the pitch at a cost.',
      start: 'Play both decks with DECKS, then open KEY and tap MATCH TEMPO TO A. Watch B BPM and B PITCH change. Then press KEY LOCK and compare.',
    },
    seeing: [
      'The plot shows deck B’s pitch against its tempo fader: as the fader moves, the pitch moves with it.',
      'The strip of the twelve semitones shows each deck’s key where it SOUNDS, so you see a key move when the tempo changes. Deck B’s tempo column sits beside it.',
      'Read B BPM (A’s tempo is under it), B PITCH in semitones, B KEY and STRETCH.',
    ],
    control: [
      'TEMPO B moves deck B’s tempo in ±0.5 % steps.',
      'KEY LOCK holds the pitch while the tempo moves.',
      'In KEY: MATCH TEMPO TO A, KEY SHIFT (semitones) to move the key, TEMPO RANGE (±8 % or ±16 %) and TEMPO 0 % (the track’s own tempo).',
      'DECKS plays both. CH1 DOWN lets you hear deck B alone; CH1 UP brings deck A back.',
      STOP,
    ],
    changes: [
      'Play a track faster and it sounds higher; play it slower and it sounds lower. About 6 % of tempo moves it one semitone.',
      'KEY LOCK keeps the pitch by stretching the sound in time, and STRETCH shows it. The bigger the tempo change, the more the stretch smears the kicks.',
    ],
    teaches: [
      'Speed and pitch are linked: change the playback speed and the pitch moves with it. One semitone is about a 6 % change in speed.',
      'Even half a semitone can make two tracks sound out of tune together.',
      'Key lock holds the pitch at a cost: the further the tempo moves, the more you hear the stretch.',
    ],
    tryThis: [
      'Tap MATCH TEMPO TO A: deck B slows 3.2 % to 122 BPM and B PITCH reads −0.56, about half a semitone flat. Then press KEY LOCK.',
      'Choose ±16 %, pull TEMPO B toward −14 % and press CH1 DOWN to hear deck B alone. Listen to the kicks with KEY LOCK on, then off.',
    ],
  },
  // ── 15 ─────────────────────────────────────────────────────────────────
  'Stems and source separation': {
    intro: {
      learning: 'What stems are: a track’s drums, bass, chords and melody as separate parts. And why stems pulled out of a finished mix are never as clean as the originals.',
      start: 'Play deck A and open STEMS. With SOURCE on ORIGINAL STEMS, switch MELODY off. Then switch SOURCE to SEPARATED (SIMULATED) and listen for what is left.',
    },
    seeing: [
      'Each lane is one stem of the track (drums, bass, chords and melody), all under one playhead. A muted part turns hatched.',
      'A STEMS and B STEMS show which parts of each deck are on.',
      'FROM tells you where the stems come from: ORIGINAL, or SEPARATED, SIMULATED.',
    ],
    control: [
      'In STEMS, choose the deck, then switch each part on or off.',
      'SOURCE picks ORIGINAL STEMS (the parts the track was built from) or SEPARATED (SIMULATED) (parts pulled back out of the finished mix).',
      'FADER 2 brings deck B into the mix. DECKS plays the decks.',
      STOP,
    ],
    changes: [
      'ORIGINAL stems add up exactly to the track, so a part you mute is truly gone.',
      'SEPARATED stems are a guess made from the finished mix. Mute the melody and a ghost of it stays behind, and the other parts lose a little too.',
      'Separation here is imitated and labeled SIMULATED, so you hear those typical flaws.',
    ],
    teaches: [
      'Stems let you mix parts of two tracks, such as one track’s drums and bass under another’s chords and melody.',
      'Original stems come from the recording itself. Separated stems are an estimate, because mixed parts overlap in frequency.',
      'Separated stems need listening before you trust them: leftover sound and lost detail show most when a part is muted.',
    ],
    tryThis: [
      'Play deck A, open STEMS and turn MELODY off on ORIGINAL STEMS. Then switch SOURCE to SEPARATED (SIMULATED) and listen for the ghost.',
      'Turn A’s DRUMS and BASS off and B’s on, then bring deck B in on FADER 2: one track’s rhythm under the other’s chords and melody.',
    ],
  },
  // ── 16 ─────────────────────────────────────────────────────────────────
  'Laptop software and audio interfaces': {
    intro: {
      learning: 'How a laptop DJ setup makes its sound: the software works one buffer at a time, and a bigger buffer trades fewer dropouts for more latency (delay).',
      start: 'Play both decks. In SETUP, set OUTPUT DEVICE to MIXER USB AUDIO, then raise BUFFER until DROPOUTS stays still. Watch LATENCY grow as you go.',
    },
    seeing: [
      'At the top is the DJ software’s AUDIO SETUP window. Below it is the rig: a controller, the laptop and the mixer, with a USB cable from the laptop to the controller and to the mixer.',
      'DEVICE is where the software sends its sound. LATENCY is the delay, with the buffer under it. DROPOUTS counts gaps in the sound. CH2 GETS shows what reaches channel 2.',
    ],
    control: [
      'In SETUP, choose the OUTPUT DEVICE, the BUFFER (samples), the SAMPLE RATE and the workload.',
      'In OUTPUT, send software decks 1 and 2 to a USB pair, and set each channel’s input selector to match.',
      'In RIG, plug or unplug the controller’s USB and the mixer’s USB.',
      'DECKS plays both.',
      STOP,
    ],
    changes: [
      'The software works one buffer at a time. Too small, and it can’t finish in time: you hear a dropout. Bigger is safer but adds latency.',
      'The controller sends only control messages, like button presses and jog moves. The mixer’s USB carries the audio, so unplugging it silences both channels.',
    ],
    teaches: [
      'One buffer of delay is the buffer size divided by the sample rate. LATENCY adds about 1 ms for the converter, so doubling the buffer nearly doubles it.',
      'Small buffers feel instant under your hands; larger ones survive a busy computer without gaps.',
      'Control data and audio travel separately: lose the controller and the music plays on; lose the audio path and the sound stops.',
    ],
    tryThis: [
      'Play both, then set OUTPUT DEVICE to MIXER USB AUDIO and raise the buffer until DROPOUTS stays still. Note how far LATENCY grew.',
      'In RIG unplug the controller: the music plays on. Plug it back, then unplug the mixer’s USB and hear both channels go silent.',
    ],
  },
  // ── 17 ─────────────────────────────────────────────────────────────────
  'Vinyl turntables and phono audio': {
    intro: {
      learning: 'What a turntable needs to play cleanly: the right tracking force, exactly one phono stage, a connected ground wire, and speaker sound kept away from the needle.',
      start: 'Start the PLATTER. In ARM, put the STYLUS SCALE under the needle and compare TRUE FORCE with DIAL. If they differ, zero the dial ring and set it again.',
    },
    seeing: [
      'Pick one of three views: the tonearm from the side with its counterweight and dial, the phono chain from cartridge to channel, or the booth drawn to scale.',
      'DIAL is what the dial says; TRUE FORCE is what the needle really presses with; TRACKING shows how the needle holds the groove.',
      'STAGES counts phono stages in the chain; LOOP GAIN, in the room view, shows speaker-to-needle feedback.',
    ],
    control: [
      'In ARM: turn the counterweight, use the STYLUS SCALE, lift the arm, zero the dial ring and set the ANTI-SKATE DIAL.',
      'In PHONO: the turntable’s own preamp switch, where its plugs go, the CH1 INPUT SELECTOR and the GROUND WIRE.',
      'In ROOM: the BOOTH MONITOR LEVEL, where the monitor stands, and what is under the turntable.',
      'PLATTER starts the record. Use FADER 1 and LISTEN AS to hear it.',
      STOP,
    ],
    changes: [
      'If the dial was never zeroed, TRUE FORCE differs from DIAL. Too light a force makes the loud moments spit.',
      'A loose ground wire adds hum. Two phono stages in a row boost twice, so the sound is loud and distorted.',
      'A monitor too close feeds the turntable its own sound until it howls.',
    ],
    teaches: [
      'Tracking force is measured, not trusted from the dial: too light and the needle loses the groove on loud passages.',
      'A turntable needs exactly one phono stage, and its ground wire keeps hum out.',
      'A needle picks up vibration as well as the groove, so speakers and the surface under a turntable can feed back into it.',
    ],
    tryThis: [
      'Start the PLATTER, then put the STYLUS SCALE under the needle and compare TRUE FORCE with DIAL.',
      'In PHONO set the GROUND WIRE to LOOSE and listen for the buzz. Then connect it again and hear it go.',
    ],
  },
  // ── 18 ─────────────────────────────────────────────────────────────────
  'Digital vinyl systems': {
    intro: {
      learning: 'How a digital vinyl system works: a control record plays a tone the software reads for speed, direction and, in ABSOLUTE, place, then plays the music to match.',
      start: 'Start the PLATTER and watch the ring, then stop it: the ring collapses to a dot and the music stops. Then try a NEEDLE DROP with MODE on ABSOLUTE.',
    },
    seeing: [
      'The ring is the control signal as the software sees it. A clean, round ring means the software can read the record.',
      'The map shows where each signal goes. Below it are the turntable with its control record and the rear cables.',
      'Check ROUND TRIP, SIGNAL (quality and lock), DECK 1 and CROWD.',
    ],
    control: [
      'PLATTER: start or stop it, NEEDLE DROP, and the PLATTER PITCH.',
      'MODE: ABSOLUTE (follows where the needle is), RELATIVE (follows only speed and direction) or INTERNAL (the software plays on its own).',
      'CH1 IN: USB (the software’s music) or PHONO (the record itself), which carries the control tone.',
      'SIGNAL: the preamp switch, the ground wire, the control record’s state, and CALIBRATE.',
      STOP,
    ],
    changes: [
      'The software follows the control tone’s speed and direction. In ABSOLUTE it also follows its place, so a needle drop or a skip moves the music.',
      'Hum or a clipped tone bends the ring out of shape and lowers SIGNAL.',
      'With CH1 IN on PHONO, the crowd hears the control tone itself, not the music.',
    ],
    teaches: [
      'A control record carries no music, only a tone that tells the software how the platter is moving.',
      'ABSOLUTE copies every needle move, skips included; RELATIVE ignores where the needle sits; INTERNAL ignores the record. Changing mode keeps the music going when tracking fails.',
      'The control tone must stay clean: hum and clipping corrupt it.',
    ],
    tryThis: [
      'Start the PLATTER and stop it: the ring collapses to a dot and the music stops.',
      'Do a NEEDLE DROP in ABSOLUTE and hear the music jump. Then switch MODE to RELATIVE and drop again.',
    ],
  },
  // ── 19 ─────────────────────────────────────────────────────────────────
  'Microphones, announcements and talkover': {
    intro: {
      learning: 'Why a mic needs far more gain than a deck, how talkover dips the music under a voice, and what makes a mic feed back through a monitor.',
      start: 'In MIC, plug the DYNAMIC mic into MIC 1 and switch it ON. In TALK, press TALK NOW and set GAIN so speech peaks sit at −18 to −8 dBFS.',
    },
    seeing: [
      'You see the mixer’s mic section, or the room from above when you choose MIC → ROOM. Watch the MIC meter and its green bracket as you speak.',
      'MIC PEAK is your voice’s peak. MUSIC DIP is how far the music drops. FEEDBACK shows the dB to spare, or RINGING. VOICE IN shows which feeds carry your voice.',
    ],
    control: [
      'GAIN sets the mic input gain in ±1 dB steps.',
      'In MIC: choose the input and the microphone, switch phantom power, set the mic channel level and place the mic.',
      'In ROUTE: TALK OVER, the mic sends and the booth monitors.',
      'In TALK: play the music and make the announcement with TALK NOW or SHOUT.',
      STOP,
    ],
    changes: [
      'A mic makes a tiny signal, so its input adds a lot of gain. TALK OVER dips the music while you speak, and MUSIC DIP shows by how much.',
      'Most condenser mics need +48 V phantom power.',
      'Point the mic at a monitor and its own sound loops back in. Once that loop passes its limit, FEEDBACK reads RINGING.',
    ],
    teaches: [
      'Mic gain is set from speech peaks on the meter, leaving room for a shout.',
      'Talkover lowers the music under the voice so an announcement is clear, then lets it back up.',
      'Feedback depends on where the mic points and how loud the monitors are; routing decides which speakers carry the voice.',
    ],
    tryThis: [
      'Plug the DYNAMIC mic into MIC 1, switch it ON, press TALK NOW and set GAIN so speech peaks sit at −18 to −8 dBFS. Then try SHOUT.',
      'In MIC → ROOM point the mic AT A MONITOR and watch FEEDBACK. Then move the mic or lower the monitors to win back 6 dB.',
    ],
  },
  // ── 20 ─────────────────────────────────────────────────────────────────
  'PA speakers, subs and venue connections': {
    intro: {
      learning: 'How a DJ’s MASTER reaches a venue’s PA as a line feed, and how speaker placement and level protect both the dance floor and the DJ’s hearing.',
      start: 'Choose VIEW → HANDOFF. In VENUE, put MASTER L into DJ L and MASTER R into DJ R, set MASTER to its unity mark, then ASK THE ENGINEER for gain.',
    },
    seeing: [
      'Pick a view: the ROOM from above, colored by level; the HANDOFF, your mixer’s rear and the venue’s stage box; or the SYSTEM, the crossover, tops and sub.',
      'Readouts follow the view. ROOM: FLOOR, AT THE DECKS, 4-HOUR DOSE and TT LOOP (turntable feedback). HANDOFF: DJ L · DJ R. SYSTEM: AT 100 Hz.',
      'The Sound Systems Lab covers the PA in depth; here it’s seen from the decks.',
    ],
    control: [
      'MASTER sets your output level.',
      'VIEW switches between ROOM, HANDOFF and SYSTEM.',
      'In VENUE: choose what the stage box inputs DJ L and DJ R get, the cable run, ASK THE ENGINEER for gain, and the booth monitors.',
      'In SETUP: where the tops and subs stand, the room map, the processor and the turntable.',
      STOP,
    ],
    changes: [
      'In a venue your MASTER is a line feed into someone else’s system. Hand it over balanced at its unity mark, and let the engineer set the room.',
      'With the crossover ON, tops and sub meet flat at 100 Hz, with no bump or hole where they hand over.',
      'Tops aimed from the front corners cover the floor and keep the decks out of their beam.',
    ],
    teaches: [
      'A DJ mixer’s MASTER is a line-level feed; in a venue, the engineer owns the gain and the room level.',
      'A crossover sends the lows to the sub and the rest to the tops, so they meet flat at the crossover point.',
      'Where the speakers stand decides who gets the loudest sound: aim at the floor, not the decks, to protect the DJ’s hearing and the turntables.',
    ],
    tryThis: [
      'In VENUE put MASTER L into DJ L and MASTER R into DJ R, with MASTER at its unity mark. Then ASK THE ENGINEER until FLOOR reads about 88 dBA, inside Screen 1’s 4-hour allowance.',
      'Try each placement in SETUP until 4-HOUR DOSE reads 100 % or less. That is your dose at the decks from the room alone; headphones add to it.',
    ],
  },
  // ── 21 ─────────────────────────────────────────────────────────────────
  'Recording and streaming': {
    intro: {
      learning: 'Why a recording is taken from its own tap at its own level, so room moves don’t change the take, and why the mic must be in the recording too.',
      start: 'In TAP, pick REC OUT and press RECORD. Ride MASTER: the room changes, but the RECORDER’s level holds. Then set REC GAIN and PLAY THE TAKE.',
    },
    seeing: [
      'The drawing shows the tap the recorder takes its signal from, the RECORDER with its meters, and the take’s waveform. Green marks show where the mic is in the take.',
      'REC PEAK is the recorder’s peak level. RECORDER reads STOPPED, RECORDING or CLIPPING. MASTER PEAK is the room feed’s peak. VOICE IN shows which feeds carry the mic.',
    ],
    control: [
      'REC GAIN sets the recorder’s own input level in ±1 dB steps.',
      'MASTER sets the room level.',
      'TAP picks where the recorder listens: REC OUT, BOOTH OUT, LOOPBACK or UNPLUG.',
      'In REC: the recorder, the music and the mic (MIC → REC), and the booth level; then RECORD, STOP and PLAY THE TAKE.',
      STOP,
    ],
    changes: [
      'REC OUT doesn’t follow MASTER, so turning the room up or down leaves the take alone.',
      'BOOTH OUT follows every booth move, so your monitor changes end up in the recording.',
      'Too much REC GAIN clips the recorder even while the room sounds fine.',
    ],
    teaches: [
      'A recording needs its own feed at its own level: the room level is set for the crowd, not for the take.',
      'A recorder can clip on its own, so a clean room doesn’t prove a clean take.',
      'Only playback proves a take: it shows whether the level held and the mic made it in.',
    ],
    tryThis: [
      'Pick TAP → REC OUT, press RECORD and ride MASTER: the room changes, but the RECORDER’s level doesn’t.',
      'Set REC GAIN so REC PEAK sits between −12 and −3 dBFS, then PLAY THE TAKE and look for the green mic marks.',
    ],
  },
  // ── 22 ─────────────────────────────────────────────────────────────────
  'Hybrid DJ systems': {
    intro: {
      learning: 'How a drum machine joins a DJ rig: one cable carries its sound, another carries clock for tempo, and starting it on the bar keeps it in step.',
      start: 'In CLOCK, set CH 1, 5-PIN MIDI and EXTERNAL, then play deck A and watch MACHINE take deck A’s tempo. Then use START ON THE NEXT BAR.',
    },
    seeing: [
      'On the back of the mixer are MIDI OUT and its CLOCK switch. Next to it are the drum machine’s back panel and its top, where the step lights show the pattern playing.',
      'DECK A shows its BPM. MACHINE shows the drum machine’s BPM and whether it follows outside clock (EXT) or itself (INT). Also watch ITS BAR 1 and IN THE ROOM.',
    ],
    control: [
      'TEMPO A sets deck A’s tempo.',
      'In CLOCK: the mixer’s CLOCK switch, the cable from MIDI OUT, and what the drum machine follows.',
      'In START: start deck A and the drum machine with PLAY NOW or START ON THE NEXT BAR.',
      'In AUDIO: choose what CH 2’s LINE inputs get, set the CH 2 FADER and use CUE 2.',
      STOP,
    ],
    changes: [
      'A clock cable carries timing and no sound. An audio cable carries sound and no tempo. The machine needs both.',
      'Clock sets the tempo, not the bar. Start the machine off the beat and it runs in tempo but out of phase.',
    ],
    teaches: [
      'MIDI clock is a stream of timing pulses: it tells another device how fast to play, not what to play or where the bar starts.',
      'Two devices can share a tempo and still be out of phase; starting together on the bar’s first beat lines them up.',
      'An instrument reaches the room through a mixer channel, so it gets a cue and a fader like a deck.',
    ],
    tryThis: [
      'In CLOCK set CH 1, 5-PIN MIDI and EXTERNAL, then play deck A: MACHINE reads deck A’s tempo.',
      'Use START ON THE NEXT BAR, then ride TEMPO A and watch MACHINE follow.',
    ],
  },
  // ── 23 ─────────────────────────────────────────────────────────────────
  'Performer changeovers and backup playback': {
    intro: {
      learning: 'How two DJs hand over one mixer without the room hearing a jump, a gap or a hum, and why knowing the signal path keeps the music going.',
      start: 'In MIX, start DJ 1’s laptop. Then use PREDICT to mark which disconnection would stop the music, and check your guess.',
    },
    seeing: [
      'The signal-flow board reads left to right: each laptop and player on the left, the mixer’s channels and master in the middle, speakers and headphones on the right. Power cords run below.',
      'ON AIR shows which source the room hears. CH 1 AVG and CH 2 AVG are each channel’s average level. HUM shows when a ground loop buzzes.',
    ],
    control: [
      'TRIM 2 sets channel 2’s trim.',
      'In PLUG: connect DJ 2’s laptop, set the input selectors and plug in the charger.',
      'In PREDICT: mark which disconnection would stop the music, then check.',
      'In MIX: play, use the faders and headphone cue, and try the frozen-laptop recovery.',
      STOP,
    ],
    changes: [
      'Connect a laptop whose charger is grounded on a different circuit and you close a ground loop: a hum on CH 2.',
      'Match levels in the headphones first. With CH 2 AVG within 2 dB of CH 1 AVG, the room changes DJs without a jump or a gap.',
    ],
    teaches: [
      'A ground loop forms when two devices reach ground by two paths; current flows around it and you hear hum. A safe fix never removes a safety ground.',
      'A changeover is level matching: the incoming DJ is cued and trimmed in the headphones before the fader comes up.',
      'Knowing which cable carries the music tells you what needs a backup.',
    ],
    tryThis: [
      'Start DJ 1’s laptop in MIX, then PREDICT which disconnection would stop the music. Check it.',
      'Connect DJ 2 with CH 2 down. Find the hum’s loop on the board, and break it safely.',
    ],
  },
  // ── 24 ─────────────────────────────────────────────────────────────────
  'Troubleshooting and the complete system challenge': {
    intro: {
      learning: 'How a whole DJ event runs, from safe power-up to the last track, and how a fault is found by following the signal until it stops.',
      start: 'In EVENT → POWER, switch the decks and mixer on first and the speakers LAST. Then start RECORD and tap OPEN THE DOORS.',
    },
    seeing: [
      'Choose SIGNAL FLOW or THE BOOTH. On SIGNAL FLOW, every card’s meter shows the real signal at that point. Everything starts cabled and switched off.',
      'EVENT shows the event’s number and SETTING UP or DOORS OPEN. Watch POWER, THE ROOM and PLAYING as the night goes on.',
    ],
    control: [
      'FADERS: the channel faders, with CH 1 ↓ / CH 1 ↑ steps.',
      'MIXER: inputs, trims, crossfader, headphones, MASTER and BOOTH.',
      'DECKS: play, cue and load.',
      'EVENT: POWER, RECORD, the mic, OPEN THE DOORS, SEE, and a new or replayed event. FINISH shows what is left in the lab.',
      STOP,
    ],
    changes: [
      'When the doors open, something will be wrong. On the board, a dark card right after a live one shows where the signal stops.',
      'The tempos are matched for you, with key lock on, so your attention stays on the system.',
    ],
    teaches: [
      'A live event runs in order: power up safely, cue, mix and announce, with speakers on last.',
      'A fault is found from evidence: follow the signal from the source, and the first place it disappears is where it breaks.',
      'A debrief turns a fault into knowledge: what failed, how it showed, and what would prevent it.',
    ],
    tryThis: [
      'In EVENT → POWER switch the decks and mixer on first, the speakers LAST, then start RECORD and OPEN THE DOORS.',
      'When the fault appears, follow the board from the left until a card goes dark: that is where to look.',
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
  intro: {
    learning: 'A look back over the DJ booth as one system: safe levels, the path from player to PA, and the cueing, blending and timing you’ve worked through so far.',
    start: 'Tap the first screen still listed to go straight to it. Or tap REVIEW ▾ on the ✓ DONE line to reopen a screen you’ve finished.',
  },
  seeing: [
    'The title reads WHAT’S LEFT while you still have required screens to do, and LAB COMPLETE once you’ve done them all. If your saved progress can’t be read, it reads YOUR PROGRESS.',
    'Each screen still to do is listed by name, usually with Left: and up to three goals your last visit missed, then + n more. Screens 16–18, until done, sit under OPTIONAL PATHS. Finished screens fold into one ✓ DONE line.',
  ],
  control: [
    'Tap any listed screen to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ DONE line to see your finished screens, and tap one to open it again. HIDE ▴ folds them away.',
    'PRACTICE AGAIN FROM THE START reopens Screen 1 and clears nothing.',
    'DONE · BACK TO LABS leaves the lab.',
    'WHAT’S LEFT ▾ at the top opens the list of screens. START OVER (PRACTICE), at its foot, clears every ✓ DONE mark and reopens Screen 1 for a fresh run. It asks you first.',
  ],
  changes: [
    'A screen is done when every goal chip on it is ✓ in a single visit: its tasks, its troubleshooting exercise and, on most screens, Pass the check. Tapping NEXT doesn’t finish a screen.',
    'Chips start empty each visit. Left: shows what your last visit this session missed (every goal if unopened).',
    'Optional Screens 16–18 never hold back LAB COMPLETE. Reopening a finished screen to practice never clears its ✓ DONE.',
  ],
  teaches: [
    'The lab follows a real booth in order: safe level and time first, then the path from player through cable and mixer to the PA.',
    'On top of that path sits the DJ’s work: setting gain, cueing in headphones, blending with faders and EQ, and keeping two tracks in time.',
    'Laptop, vinyl and digital vinyl rigs use the same signal flow as the core booth.',
  ],
  tryThis: [
    'Open the first screen still listed and finish every goal on it in that one visit. Its Left: line names the ones your last visit missed.',
    'Tap REVIEW ▾ and open a finished screen. Its goal chips start empty for practice, and it stays ✓ DONE here.',
  ],
};
