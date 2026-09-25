/**
 * Sound Systems Lab — the fault library (TROUBLESHOOT mode, chapter 14).
 *
 * Twenty-two faults from the owner's brief, each a pure record: the symptom
 * as reported, the system in play, what a technician READS at every station
 * from the source forward, the one station the fault lives at, and the
 * diagnosis options. The bench renders readings from this file and never
 * re-keys them; test/soundSystemsEngine.test.ts pins that every case is
 * healthy before its fault station, not healthy at it, and solvable by a
 * forward walk.
 *
 * The discipline the mode teaches — start where the signal begins, move
 * toward the listener, and stop at the first station whose reading changes —
 * is graded by `isForwardWalk`, not just the final answer.
 */
import { STATION_ORDER, type GearKind, type Station } from './types';

export type Flag = 'hum' | 'distortion' | 'polarity' | 'intermittent' | 'early' | 'feedback' | 'dropout' | 'clicks' | 'limiting' | 'wrongContent';

export type Reading = {
  signal: 'none' | 'low' | 'ok' | 'hot' | 'clip';
  note: string;
  flags?: readonly Flag[];
};

export type FaultGroup = 'dead' | 'level' | 'routing' | 'time' | 'digital';

export const FAULT_GROUPS: readonly { id: FaultGroup; title: string; blurb: string }[] = [
  { id: 'dead', title: 'Dead signal', blurb: 'Nothing, or nothing from one place. The walk finds where the signal stops.' },
  { id: 'level', title: 'Level, noise and distortion', blurb: 'It plays, but wrong: clipping, hum, squash, a rattle. The walk finds where clean turns dirty.' },
  { id: 'routing', title: 'Routing', blurb: 'The signal exists and arrives somewhere — just not where it should. The console is usually the station.' },
  { id: 'time', title: 'Time, polarity and crossover', blurb: 'Everything is present; the pieces disagree with each other. The processor and the loudspeakers are the stations.' },
  { id: 'digital', title: 'Digital, network and acoustic', blurb: 'Faults that arrive as clicks, dropouts or a ring — and are solved by discipline, not by swapping boxes.' },
];

export type FaultCase = {
  id: string;
  group: FaultGroup;
  title: string;
  /** What was reported, in the words it arrives in. */
  symptom: string;
  /** The system in play. */
  setup: string;
  /** Readings, one per station of STATION_ORDER. */
  reads: Record<Station, Reading>;
  faultAt: Station;
  /** Where a professional STARTS: the symptom already clears everything
   *  before this station (a whole-PA fault starts at the console meters; a
   *  single dead channel starts at its source). */
  startAt: Station;
  /** Station labels for this scenario when the path is not the house path
   *  (a monitor fault walks aux → monitor amp → wedge → performer). */
  labels?: Partial<Record<Station, string>>;
  /** Glyphs for those stations. */
  kinds?: Partial<Record<Station, GearKind | 'listener'>>;
  options: readonly string[];
  correct: number;
  explain: string;
  fix: string;
  /** Why the forward walk found it, in one sentence. */
  forward: string;
};

const OK: Record<Station, string> = {
  source: 'The performer is on; the microphone is live and its switch is on.',
  cable: 'Continuity good — swapping to a known-good cable changes nothing.',
  stagebox: 'Input LED shows signal on the expected channel.',
  consoleIn: 'Channel meter reads a healthy average around −18 dBFS, peaks near −8.',
  consoleOut: 'Main bus meter follows the channels; the output is patched where expected.',
  processor: 'Input and output meters show signal on every band; no limiter light.',
  amp: 'Signal LEDs on, no clip light, both channels alike.',
  speaker: 'Cabinet plays cleanly at the expected level.',
  listener: 'Clean, at the right level, arriving on time.',
};

/** Build the readings: healthy up to `faultAt`, then `after` from there on,
 *  with per-station overrides where the reading needs its own words. */
function reads(faultAt: Station, after: Reading, overrides: Partial<Record<Station, Reading>> = {}): Record<Station, Reading> {
  const idx = STATION_ORDER.indexOf(faultAt);
  const out = {} as Record<Station, Reading>;
  STATION_ORDER.forEach((s, i) => {
    out[s] = overrides[s] ?? (i < idx ? { signal: 'ok', note: OK[s] } : after);
  });
  return out;
}

export const FAULTS: readonly FaultCase[] = [
  /* ── DEAD SIGNAL ────────────────────────────────────────────────────── */
  {
    id: 'nothing',
    startAt: 'consoleIn',
    group: 'dead',
    title: 'No sound anywhere',
    symptom: '“Nothing is coming out. Anywhere.”',
    setup: 'Club system: digital stagebox, console at front of house, processor, two amplifier channels, passive tops and subs.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'none', note: 'Dark. Nothing arrives.' },
      {
        consoleIn: { signal: 'ok', note: 'Every channel meter is moving — the band is clearly there in the console.' },
        consoleOut: { signal: 'none', note: 'The MAIN bus meter sits at nothing while the channel meters dance. The main MUTE button is lit.' },
        amp: { signal: 'none', note: 'Signal LEDs dark on every channel. Power is on.' },
        listener: { signal: 'none', note: 'Silence.' },
      },
    ),
    options: ['The main bus is muted at the console', 'The amplifier rack has lost power', 'Every microphone cable has failed', 'The loudspeakers are damaged'],
    correct: 0,
    explain: 'Channel meters alive and the main meter dead put the fault between them — the main bus. The lit MUTE is the confirmation. The amplifiers are dark because nothing is being sent, not because they failed.',
    fix: 'Un-mute the main bus. Then ask how it got muted: a mute group, a scene recall, or a hand.',
    forward: 'Two probes at the console settled it; swapping cables or checking amplifiers would have been guessing at the far end.',
  },
  {
    id: 'one-input',
    startAt: 'source',
    group: 'dead',
    title: 'One input has no sound',
    symptom: '“The lead vocal is dead. Everything else is fine.”',
    setup: 'Vocal mic on a 10 m XLR to the stagebox; the rest of the band is playing normally.',
    faultAt: 'cable',
    reads: reads(
      'cable',
      { signal: 'none', note: 'Nothing on this channel.' },
      {
        cable: { signal: 'none', note: 'Swap in a known-good cable: the channel comes alive. The original reads open on pin 2 on the tester.' },
        stagebox: { signal: 'none', note: 'No input LED on channel 1. Channels 2–16 show signal.' },
        consoleIn: { signal: 'none', note: 'Channel 1 meter flat. Every other channel is normal.' },
        consoleOut: { signal: 'ok', note: 'The main mix carries everything except the vocal.' },
        processor: { signal: 'ok', note: OK.processor },
        amp: { signal: 'ok', note: OK.amp },
        speaker: { signal: 'ok', note: OK.speaker },
        listener: { signal: 'ok', note: 'The band is there. The singer is missing.' },
      },
    ),
    options: ['A faulty microphone cable', 'The main bus is muted', 'An amplifier channel has failed', 'The crossover is set wrong'],
    correct: 0,
    explain: 'The source is fine, the first station after it is not. A single dead channel with a live band is almost always in the first metre of that channel’s own path: the mic, its cable, or its input.',
    fix: 'Replace the cable and tag the bad one so it does not go back in the case.',
    forward: 'One channel down and everything else fine says the fault is upstream of where the channels combine — so start at that channel’s source.',
  },
  {
    id: 'left-dead',
    startAt: 'consoleOut',
    group: 'dead',
    title: 'Left loudspeaker has no sound',
    symptom: '“Only the right side is playing.”',
    setup: 'Stereo mains on a two-channel amplifier fed from the processor.',
    faultAt: 'amp',
    reads: reads(
      'amp',
      { signal: 'none', note: 'Nothing on the left.' },
      {
        consoleOut: { signal: 'ok', note: 'Main L and R meters read the same.' },
        processor: { signal: 'ok', note: 'Left and right outputs both show signal.' },
        amp: { signal: 'none', note: 'Channel A: PROTECT lit, no signal LED. Channel B normal.' },
        speaker: { signal: 'none', note: 'Left cabinet silent; right cabinet fine.' },
        listener: { signal: 'ok', note: 'Everything arrives from the right only.' },
      },
    ),
    options: ['The left amplifier channel is in protect', 'The left console output is muted', 'The left loudspeaker cable is reversed', 'The left microphones are dead'],
    correct: 0,
    explain: 'Console and processor both show left and right — so nothing upstream of the amplifier is the cause. The amplifier’s own PROTECT light names the station. Reversed polarity would still play; muted console output would show on the console meter.',
    fix: 'Find WHY it went into protect before resetting it: a shorted speaker cable, a load below its minimum, or overheating. Clear the cause, then power-cycle the channel.',
    forward: 'Three probes: console, processor, amplifier. The first station whose reading changed was the answer.',
  },
  {
    id: 'subs-dead',
    startAt: 'consoleOut',
    group: 'dead',
    title: 'Subwoofers have no output',
    symptom: '“The tops sound fine but there is no low end at all.”',
    setup: 'Aux-fed subwoofers: Aux 6 on the console feeds the processor’s LOW input; the tops come from the main mix.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'none', note: 'No low end.' },
      {
        consoleOut: { signal: 'none', note: 'Main L/R meters healthy. The AUX 6 SUB master fader is all the way down and its meter is dark.' },
        processor: { signal: 'none', note: 'LOW input meter dark; HIGH inputs normal.' },
        amp: { signal: 'none', note: 'Sub amplifier channel: no signal LED.' },
        speaker: { signal: 'none', note: 'Subs silent. Tops normal.' },
        listener: { signal: 'ok', note: 'Full range from the tops, nothing beneath.' },
      },
    ),
    options: ['The aux-fed subwoofer master is down at the console', 'The subwoofer amplifier has failed', 'The crossover is set too high', 'The kick microphone cable is open'],
    correct: 0,
    explain: 'With aux-fed subs the sub feed is its own bus. The main meters cannot tell you about it — only the aux master can, and it is down. The amplifier is dark because it is being fed nothing.',
    fix: 'Raise the Aux 6 master to its show position. Save it in the scene so a recall cannot lose it again.',
    forward: 'An aux-fed sub adds a station the main mix never passes through. Probe the bus that actually feeds the subs, not the one that feeds the tops.',
  },
  {
    id: 'mixer-not-speaker',
    startAt: 'consoleOut',
    group: 'dead',
    title: 'Signal reaches the mixer but not the loudspeakers',
    symptom: '“Meters are moving on the desk. Nothing from the PA.”',
    setup: 'Console → loudspeaker management processor → amplifiers → passive cabinets.',
    faultAt: 'processor',
    reads: reads(
      'processor',
      { signal: 'none', note: 'Dark.' },
      {
        consoleOut: { signal: 'ok', note: 'Main meters healthy; main outputs patched to the processor inputs.' },
        processor: { signal: 'none', note: 'INPUT meters lit. Every OUTPUT shows MUTE — a preset was recalled with its outputs muted, as many processors do (and as this one was saved).' },
        amp: { signal: 'none', note: 'No signal LEDs.' },
        speaker: { signal: 'none', note: 'Silent.' },
        listener: { signal: 'none', note: 'Silence.' },
      },
    ),
    options: ['The processor outputs are muted (a preset recall)', 'The console main is muted', 'The loudspeaker cables are unplugged', 'The microphones are switched off'],
    correct: 0,
    explain: 'Signal in, nothing out, at one box — that box is the station. Many processors mute their outputs on preset recall precisely so a wrong preset cannot destroy loudspeakers; un-muting is a deliberate act.',
    fix: 'Confirm the preset matches the loudspeakers, then un-mute the outputs one at a time at low level.',
    forward: 'The console meters already proved everything upstream. Starting at the console output and walking forward reached the processor in two probes.',
  },
  {
    id: 'intermittent',
    startAt: 'source',
    group: 'dead',
    title: 'Intermittent cable or connector',
    symptom: '“The bass keeps dropping out. Sometimes it crackles.”',
    setup: 'Bass guitar into a DI box; XLR from the DI to the stagebox.',
    faultAt: 'cable',
    reads: reads(
      'cable',
      { signal: 'ok', note: 'Present, until it is not.', flags: ['intermittent'] },
      {
        source: { signal: 'ok', note: 'The bass amp on stage, fed from the DI’s THRU, is clean and steady — instrument and DI are fine.' },
        cable: { signal: 'ok', note: 'Wiggle the XLR where it enters the DI: the channel crackles and drops. The strain relief spins loose.', flags: ['intermittent'] },
        stagebox: { signal: 'ok', note: 'Input LED flickers with the wiggle.', flags: ['intermittent'] },
        consoleIn: { signal: 'ok', note: 'Channel meter drops to nothing in bursts.', flags: ['intermittent'] },
        listener: { signal: 'ok', note: 'The bass vanishes for a beat whenever the player moves.', flags: ['intermittent'] },
      },
    ),
    options: ['An intermittent cable or connector at the DI', 'The amplifier goes into protect', 'The limiter is closing', 'The channel is patched from the wrong input'],
    correct: 0,
    explain: 'An intermittent hides from a resting test. The tell is that it follows movement — and the first station that moves with the player is the cable at the DI.',
    fix: 'Replace the cable now; repair the strain relief later. Never put an intermittent cable back in service on a promise.',
    forward: 'Wiggle while you watch, from the source forward. The station that flickers under your hand is the fault.',
  },

  /* ── LEVEL, NOISE, DISTORTION ───────────────────────────────────────── */
  {
    id: 'driver',
    startAt: 'consoleOut',
    group: 'level',
    title: 'Loudspeaker produces distortion',
    symptom: '“The left top buzzes on every low note.”',
    setup: 'Two passive tops on one amplifier channel pair; processor limiters set for the cabinets.',
    faultAt: 'speaker',
    reads: reads(
      'speaker',
      { signal: 'ok', note: 'A buzz and a rattle on low notes.', flags: ['distortion'] },
      {
        consoleOut: { signal: 'ok', note: 'Main meters healthy, nowhere near clip.' },
        processor: { signal: 'ok', note: 'No limiter activity. Outputs clean on the analyser.' },
        amp: { signal: 'ok', note: 'No clip light at any level. Both channels show identical drive.' },
        speaker: { signal: 'ok', note: 'The left cabinet buzzes and rattles on low notes at ANY level; the right cabinet on the same drive is clean. Swap the cabinets: the buzz moves with the box.', flags: ['distortion'] },
        listener: { signal: 'ok', note: 'A rattle rides every bass note from the left.', flags: ['distortion'] },
      },
    ),
    options: ['A damaged loudspeaker driver', 'The amplifier is clipping', 'A console preamp is overloaded', 'A ground loop'],
    correct: 0,
    explain: 'Every electrical station reads clean and the buzz moves with the cabinet when you swap them. Distortion that is present at any level and lives in one box is mechanical — a torn cone, a rubbing coil, a loose part.',
    fix: 'Take the cabinet out of service and repair the driver. Check the limiter settings that were supposed to protect it.',
    forward: 'Clean at the console, clean at the processor, clean at the amplifier — the first dirty reading was the last station, so the fault is there and not before.',
  },
  {
    id: 'amp-clip',
    startAt: 'consoleOut',
    group: 'level',
    title: 'Amplifier clips',
    symptom: '“It gets harsh and nasty as soon as the band gets loud.”',
    setup: 'Amplifier input attenuators fully open (full output at +4 dBu in); the processor limiter threshold is set ABOVE that.',
    faultAt: 'amp',
    reads: reads(
      'amp',
      { signal: 'clip', note: 'Harsh on every loud passage.', flags: ['distortion'] },
      {
        consoleOut: { signal: 'ok', note: 'Main meters peak around −6 dBFS — healthy headroom.' },
        processor: { signal: 'ok', note: 'Outputs peak around +16 dBu on loud passages; the limiter threshold reads +20 — it never engages.' },
        amp: { signal: 'clip', note: 'CLIP LEDs flash on every loud passage. With the attenuators open this amplifier is at full output by +4 dBu, so everything above that is flattened — and the limiter upstream is set higher than the amplifier’s clip point, so it never wins.', flags: ['distortion'] },
        speaker: { signal: 'hot', note: 'Harsh, flattened transients; the horns are working hard.', flags: ['distortion'] },
        listener: { signal: 'hot', note: 'Loud and ugly at the same moment.', flags: ['distortion'] },
      },
    ),
    options: ['The amplifier is driven into clipping — set its input level and the system gain structure', 'A loudspeaker is damaged', 'A console channel is clipping', 'A digital clock error'],
    correct: 0,
    explain: 'The console and the processor have headroom; the first station to run out of it is the amplifier. A clipped amplifier delivers flattened, high-frequency-rich waveforms that heat tweeters — the distortion is a warning of damage to come.',
    fix: 'Bring the amplifier attenuators down (or lower the processor output) until the limiter engages before the amplifier clips, and confirm the limiter thresholds match the cabinets. The amplifier must be the last stage to clip.',
    forward: 'Headroom is checked in order. The first station with no headroom left is where the level structure broke.',
  },
  {
    id: 'hum-keys',
    startAt: 'source',
    group: 'level',
    title: 'Loud hum or buzz',
    symptom: '“There is a hum on the keyboards.”',
    setup: 'Keyboard connected on a 20 m unbalanced ¼-inch instrument cable straight to a line input at front of house.',
    faultAt: 'cable',
    reads: reads(
      'cable',
      { signal: 'ok', note: 'Hum under the keys.', flags: ['hum'] },
      {
        source: { signal: 'ok', note: 'On headphones at the keyboard: clean.' },
        cable: { signal: 'ok', note: 'A 20 m UNBALANCED instrument cable. Lift its far end from the input: the hum stops with the keys. Move it near the lighting cable: it gets louder.', flags: ['hum'] },
        stagebox: { signal: 'ok', note: 'Not in this path — the keyboard cable bypasses the box and runs straight to front of house. That is already the clue: no balanced line, no DI.', flags: ['hum'] },
        consoleIn: { signal: 'ok', note: 'Hum on the keys channel only. Mute it: silence.', flags: ['hum'] },
        listener: { signal: 'ok', note: 'A steady hum whenever the keys channel is open.', flags: ['hum'] },
      },
    ),
    options: ['A long unbalanced cable picking up interference — use a DI box', 'A damaged loudspeaker driver', 'The amplifier is clipping', 'The channel is on the wrong bus'],
    correct: 0,
    explain: 'The source is clean; the first station that adds the hum is the cable, and it is unbalanced over a distance no unbalanced cable should run. A DI converts to balanced mic level at the keyboard, and the long run rejects interference.',
    fix: 'DI box at the keyboard, XLR to the stagebox — or, if the keyboard has balanced XLR outputs, run those direct. Ground-lift on the DI if a loop remains.',
    forward: 'The hum was NOT at the source. Probing the source first ruled out the keyboard in one step and pointed at the next station.',
  },
  {
    id: 'ground-loop',
    startAt: 'consoleIn',
    labels: { amp: 'Powered cabinet (amp inside)' },
    kinds: { amp: 'poweredSpeaker' },
    group: 'level',
    title: 'Ground loop',
    symptom: '“A hum that is there even when everything is muted.”',
    setup: 'Console at front of house on one mains circuit; a powered top on the stage circuit; both joined by the signal cable.',
    faultAt: 'speaker',
    reads: reads(
      'speaker',
      { signal: 'ok', note: 'Hum, regardless of the mix.', flags: ['hum'] },
      {
        consoleIn: { signal: 'ok', note: 'Every channel clean. Mute them all: the hum continues.' },
        consoleOut: { signal: 'ok', note: 'Main meter shows nothing with everything muted — the hum is NOT in the console.' },
        processor: { signal: 'ok', note: 'Not in the chain on this side; the tops are powered.' },
        amp: { signal: 'ok', note: 'Powered cabinet — the amplifier is inside it.' },
        speaker: { signal: 'ok', note: 'Unplug the SIGNAL cable at the cabinet: the hum stops. Plug it in through a ground-isolating transformer: the hum stops. Two circuits, two grounds, one cable joining them.', flags: ['hum'] },
        listener: { signal: 'ok', note: 'A hum that has nothing to do with the mix.', flags: ['hum'] },
      },
    ),
    options: ['A ground loop between the console and a powered loudspeaker on a different mains circuit', 'A damaged driver', 'Dimmer noise entering the microphones', 'The console main is clipping'],
    correct: 0,
    explain: 'Hum that survives muting every channel is not signal — it is a current flowing between two grounds through the cable shield. The station where it enters is the cabinet at the far end of that cable.',
    fix: 'Feed audio and lighting from properly grounded distribution on the same reference, or isolate the signal path at the cabinet with a transformer. Never lift a mains safety ground.',
    forward: 'The console proved itself clean with two probes. Walking on to the cabinet found the loop; guessing at the microphones would never have.',
  },
  {
    id: 'limiter',
    startAt: 'consoleOut',
    group: 'level',
    title: 'Excessive limiter activity',
    symptom: '“It will not get loud. It just sounds squashed.”',
    setup: 'Processor preset recalled from a smaller cabinet; limiter thresholds far below what these cabinets need.',
    faultAt: 'processor',
    reads: reads(
      'processor',
      { signal: 'low', note: 'Squashed and quiet.', flags: ['limiting'] },
      {
        consoleOut: { signal: 'ok', note: 'Main meters healthy and well below clip.' },
        processor: { signal: 'low', note: 'LIMIT LEDs solid on the HIGH outputs at moderate level; the threshold reads 0 dBu where this amplifier-and-cabinet pairing needs about +10. The preset name is for a different cabinet.', flags: ['limiting'] },
        amp: { signal: 'low', note: 'Signal present, never near clip.' },
        speaker: { signal: 'low', note: 'Quiet, flattened — every transient shaved off.', flags: ['limiting'] },
        listener: { signal: 'low', note: 'Loud passages do not get louder, they get smaller.', flags: ['limiting'] },
      },
    ),
    options: ['The processor limiter threshold is set far too low', 'The amplifier is clipping', 'The console main fader is too low', 'A loudspeaker is damaged'],
    correct: 0,
    explain: 'The console has level to give and the amplifier is nowhere near clipping; the station shaving the peaks is the processor, and its LIMIT lights say so. A limiter set for a smaller box protects a box you do not have.',
    fix: 'Load the preset for THESE cabinets, or set the limiter thresholds from the manufacturer’s data for this amplifier and cabinet pairing.',
    forward: 'Level was traced in order: enough at the console, too little after the processor. The change happened in one box.',
  },

  /* ── ROUTING ────────────────────────────────────────────────────────── */
  {
    id: 'wrong-patch',
    startAt: 'stagebox',
    group: 'routing',
    title: 'Incorrect digital patch',
    symptom: '“The vocal is plugged in and the box shows signal, but the channel is dead.”',
    setup: 'Digital stagebox. The vocal microphone is plugged into stagebox input 5; console channel 1 is patched from stagebox input 4.',
    faultAt: 'consoleIn',
    reads: reads(
      'consoleIn',
      { signal: 'none', note: 'Nothing on channel 1.' },
      {
        stagebox: { signal: 'ok', note: 'Input 5 LED shows signal every time the singer speaks.' },
        consoleIn: { signal: 'none', note: 'Channel 1 meter flat. Its INPUT PATCH reads “Stagebox 4” — the singer is on input 5.' },
        consoleOut: { signal: 'ok', note: 'The band is in the main mix; the vocal is not.' },
        processor: { signal: 'ok', note: OK.processor },
        amp: { signal: 'ok', note: OK.amp },
        speaker: { signal: 'ok', note: OK.speaker },
        listener: { signal: 'ok', note: 'Band present, vocal absent.' },
      },
    ),
    options: ['The console channel is patched from the wrong stagebox input', 'The microphone is dead', 'The main bus is muted', 'The amplifier is in protect'],
    correct: 0,
    explain: 'The box proves the signal arrived. The first station that does not see it is the console channel — and on a digital system, which physical input a channel listens to is a setting, not a plug.',
    fix: 'Patch channel 1 from stagebox input 5 (or move the cable to input 4 and keep the patch list honest).',
    forward: 'Signal at the box, none at the channel: the fault is the step between them. No cable, microphone or amplifier needed checking.',
  },
  {
    id: 'wrong-bus',
    startAt: 'consoleIn',
    group: 'routing',
    title: 'Wrong output bus selected',
    symptom: '“Guitar meter is moving on the desk but the guitar is not in the PA.”',
    setup: 'The guitar channel is assigned to Subgroup 3. Subgroup 3 is not assigned to the main mix.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'none', note: 'No guitar downstream.' },
      {
        consoleIn: { signal: 'ok', note: 'Guitar channel meter healthy.' },
        consoleOut: { signal: 'none', note: 'The guitar channel is assigned to SUBGROUP 3 only. Subgroup 3’s master has no MAIN assignment — its meter moves, the main mix never receives it.' },
        processor: { signal: 'ok', note: 'The rest of the mix passes normally.' },
        amp: { signal: 'ok', note: OK.amp },
        speaker: { signal: 'ok', note: OK.speaker },
        listener: { signal: 'ok', note: 'Everything but the guitar.' },
      },
    ),
    options: ['The channel is assigned to a subgroup that is not routed to the main mix', 'The guitar cable is open', 'An amplifier channel is down', 'The processor limiter is closed'],
    correct: 0,
    explain: 'A channel meter shows what enters the channel, not where it goes. The bus assignment is the next station — and a subgroup with no path to the main mix is a dead end with a moving meter.',
    fix: 'Assign Subgroup 3 to the main mix (or the channel directly), and check the other subgroups.',
    forward: 'Meter alive, mix missing it: the routing between them is the station. That is where the walk went.',
  },
  {
    id: 'pre-post',
    startAt: 'consoleIn',
    group: 'routing',
    title: 'Pre-fader / post-fader routing error',
    symptom: '“When I pull the vocal down, the reverb stays just as loud.”',
    setup: 'Reverb on Aux 5. The vocal channel’s Aux 5 send is tapped PRE-fader.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'ok', note: 'Reverb present at the same level whatever the vocal fader does.', flags: ['wrongContent'] },
      {
        consoleIn: { signal: 'ok', note: 'Vocal channel meter healthy.' },
        consoleOut: { signal: 'ok', note: 'Pull the vocal fader to −∞: the vocal leaves the main mix, but the AUX 5 send meter holds steady. The send is tapped PRE-fader.', flags: ['wrongContent'] },
        listener: { signal: 'ok', note: 'Dry vocal gone, wet vocal still there — a reverb with no source.', flags: ['wrongContent'] },
      },
    ),
    options: ['The reverb send is tapped pre-fader — switch it to post-fader', 'The reverb unit’s output is too hot', 'The vocal microphone is too far away', 'The polarity is reversed'],
    correct: 0,
    explain: 'An effects send should follow the fader so the wet stays in proportion to the dry. Pre-fader is the monitor convention, and on an effect it produces exactly this: a vocal that vanishes and leaves its reverb behind.',
    fix: 'Set the vocal’s Aux 5 send to post-fader. Check every effects send on the console the same way.',
    forward: 'Move the fader and watch the send meter — the station that does not respond to the control that should govern it is the fault.',
  },
  {
    id: 'monitor-follows-main',
    startAt: 'consoleOut',
    labels: { consoleOut: 'Aux output', processor: 'Monitor EQ', amp: 'Monitor amp', speaker: 'Wedge', listener: 'Performer' },
    kinds: { speaker: 'wedge' },
    group: 'routing',
    title: 'Monitor changes when the main fader moves',
    symptom: '“Every time you touch the house, the wedges change.”',
    setup: 'The wedge amplifier is patched from a MAIN L output instead of an aux output.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'ok', note: 'Wedges follow the house.', flags: ['wrongContent'] },
      {
        consoleOut: { signal: 'ok', note: 'The output patch shows the monitor amplifier fed from MAIN L. Move the main fader: the wedge follows. Aux 1’s output is patched to nothing.', flags: ['wrongContent'] },
        amp: { signal: 'ok', note: 'Monitor amplifier receives the house mix.' },
        speaker: { signal: 'ok', note: 'The wedge plays the audience mix.' },
        listener: { signal: 'ok', note: 'Performers hear the house, at the house level, never their own balance.', flags: ['wrongContent'] },
      },
    ),
    options: ['The monitor amplifier is fed from the main output instead of an aux send', 'The monitor sends are post-fader', 'Feedback in the wedge', 'A DCA is muted'],
    correct: 0,
    explain: 'Monitors must come from a bus the house fader does not control. A wedge fed from the main output can never be a monitor mix; it is the audience mix on the floor.',
    fix: 'Patch the monitor amplifier from Aux 1, build the wedge mix on pre-fader sends, and leave the main outputs to the house.',
    forward: 'The symptom names the control; the walk found the station where that control should have stopped mattering and did not.',
  },
  {
    id: 'vocals-in-subs',
    startAt: 'consoleOut',
    group: 'routing',
    title: 'Subwoofer receives vocals unintentionally',
    symptom: '“The vocal sounds boomy and thick — you can hear it coming from the subs.”',
    setup: 'Aux-fed subs on Aux 6. The lead vocal channel’s Aux 6 send has been turned up.',
    faultAt: 'consoleOut',
    reads: reads(
      'consoleOut',
      { signal: 'ok', note: 'Vocal chest in the low end.', flags: ['wrongContent'] },
      {
        consoleOut: { signal: 'ok', note: 'The AUX 6 SUB send on the LEAD VOCAL channel reads 0 dB. It should be off — only kick, bass, floor tom and keys belong there.', flags: ['wrongContent'] },
        processor: { signal: 'ok', note: 'Crossover correct at 100 Hz; the subs are simply being sent a vocal.' },
        speaker: { signal: 'ok', note: 'Vocal low end audible from the subs.', flags: ['wrongContent'] },
        listener: { signal: 'ok', note: 'Thick, boomy vocal; stage rumble on every plosive.', flags: ['wrongContent'] },
      },
    ),
    options: ['The vocal channel is sending to the aux-fed subwoofer bus', 'The crossover is set too high', 'The subwoofer polarity is reversed', 'The amplifier is clipping'],
    correct: 0,
    explain: 'Aux-fed subs give you the choice of what reaches them — which means an accidental send puts a vocal in the subs with the crossover blameless. The send is the station.',
    fix: 'Turn the vocal’s Aux 6 send off, then walk every channel: only the sources with real low-frequency content feed the subs.',
    forward: 'The processor was checked and cleared in one probe; the console send before it was the change.',
  },

  /* ── TIME, POLARITY, CROSSOVER ──────────────────────────────────────── */
  {
    id: 'polarity',
    startAt: 'consoleOut',
    labels: { amp: 'Powered cabinet (amp inside)' },
    kinds: { amp: 'poweredSpeaker' },
    group: 'time',
    title: 'Reversed polarity',
    symptom: '“Each side alone sounds full. Both together, the bass disappears in the middle.”',
    setup: 'Two powered tops. The cable to the right top has pins 2 and 3 swapped.',
    faultAt: 'speaker',
    reads: reads(
      'speaker',
      { signal: 'ok', note: 'Thin in the centre.', flags: ['polarity'] },
      {
        consoleOut: { signal: 'ok', note: 'Main L and R meters equal and healthy.' },
        processor: { signal: 'ok', note: 'Left and right outputs identical; polarity buttons both normal.' },
        amp: { signal: 'ok', note: 'Powered cabinets — amplifiers inside.' },
        speaker: { signal: 'ok', note: 'Each cabinet alone is full. Both together: the low end cancels on the centre line. Flip the polarity of ONE cabinet: it returns. The right cabinet’s cable tests pins 2 and 3 reversed.', flags: ['polarity'] },
        listener: { signal: 'ok', note: 'Hollow and thin down the middle; fuller off to either side.', flags: ['polarity'] },
      },
    ),
    options: ['One loudspeaker cable has pins 2 and 3 reversed — a polarity flip', 'The crossover is set wrong', 'A delay is set on one side', 'The amplifier is clipping'],
    correct: 0,
    explain: 'Two sources in opposite polarity cancel where they arrive together — the centre — and mostly at low frequencies, where the wavelengths are long enough to cancel over the whole audience. Every electrical station reads normal because a reversed cable IS a normal signal, upside down.',
    fix: 'Replace or re-terminate the cable. Test every cable in the case for pin order before it goes out again.',
    forward: 'Every reading was healthy until the two loudspeakers were compared to EACH OTHER. Some faults live between stations, not in one — the walk still finds them, at the end.',
  },
  {
    id: 'crossover',
    startAt: 'consoleOut',
    group: 'time',
    title: 'Incorrect crossover',
    symptom: '“The subs are muddy and you can hear vocals in them. The tops sound thin.”',
    setup: 'Processor crossover point set at 400 Hz instead of 100 Hz.',
    faultAt: 'processor',
    reads: reads(
      'processor',
      { signal: 'ok', note: 'Wrong content in each band.', flags: ['wrongContent'] },
      {
        consoleOut: { signal: 'ok', note: 'The main mix is correct; no vocal on any sub send — the subs are crossover-fed.' },
        processor: { signal: 'ok', note: 'The LOW/HIGH crossover reads 400 Hz. Vocals, guitars and snare are all being sent below the crossover to the subwoofers; the tops receive nothing beneath 400 Hz.', flags: ['wrongContent'] },
        speaker: { signal: 'ok', note: 'Subs play mids; tops have no body.', flags: ['wrongContent'] },
        listener: { signal: 'ok', note: 'Vocals from the floor; thin, hollow tops.', flags: ['wrongContent'] },
      },
    ),
    options: ['The crossover frequency is set far too high in the processor', 'The subwoofer polarity is reversed', 'A vocal send is feeding the subs', 'The amplifier is clipping'],
    correct: 0,
    explain: 'With crossover-fed subs, the console cannot put vocals in the subs — only the crossover decides what goes where. The processor reading names the number: 400 Hz sends most of the music to the subwoofers.',
    fix: 'Set the crossover for these cabinets (typically 80–120 Hz), then re-check level and alignment between subs and tops.',
    forward: 'The console send was cleared first, which turned a “vocals in the subs” symptom into a processor question in one step.',
  },
  {
    id: 'delay-time',
    startAt: 'consoleOut',
    group: 'time',
    title: 'Delay loudspeaker arriving too early',
    symptom: '“Under the delay towers everything sounds smeared, like a slap echo.”',
    setup: 'Outdoor system: delay loudspeakers 30 m in front of the mains. The processor’s DELAY outputs show 0.0 ms.',
    faultAt: 'processor',
    reads: reads(
      'processor',
      { signal: 'ok', note: 'Two arrivals, far apart.', flags: ['early'] },
      {
        consoleOut: { signal: 'ok', note: 'Main mix healthy.' },
        processor: { signal: 'ok', note: 'The DELAY outputs read 0.0 ms. The delay towers stand 30 m nearer the back rows than the mains — their sound arrives about 87 ms before the mains at 20 °C.', flags: ['early'] },
        amp: { signal: 'ok', note: OK.amp },
        speaker: { signal: 'ok', note: 'Delay cabinets play the same signal as the mains, undelayed.', flags: ['early'] },
        listener: { signal: 'ok', note: 'Two distinct arrivals; the delays first, the mains 87 ms later — a clear echo.', flags: ['early'] },
      },
    ),
    options: ['The delay loudspeakers are not delayed — set ≈ distance ÷ speed of sound', 'The mains are reversed in polarity', 'The delay amplifier is clipping', 'The crossover is wrong'],
    correct: 0,
    explain: 'A delay loudspeaker exists to arrive WITH the mains. Sound needs roughly 2.9 ms per metre, so 30 m is about 87 ms; with 0 ms set, the delay towers lead by that much and the ear hears two events.',
    fix: 'Set the delay outputs to the distance-derived time (the app’s Delay from Distance calculator gives the exact figure for the day’s temperature), then verify by measurement and by ear.',
    forward: 'Level was fine everywhere; TIME was wrong at one station. The processor is where time is set, and its display gave the answer.',
  },

  /* ── DIGITAL, NETWORK, FEEDBACK ─────────────────────────────────────── */
  {
    id: 'clocking',
    startAt: 'stagebox',
    group: 'digital',
    title: 'Digital clocking problem',
    symptom: '“Clicks and pops, every few seconds, on every channel at once.”',
    setup: 'Digital stagebox set to be the clock master; the console has been switched to INTERNAL clock.',
    faultAt: 'consoleIn',
    reads: reads(
      'consoleIn',
      { signal: 'ok', note: 'Periodic clicks on everything.', flags: ['clicks'] },
      {
        stagebox: { signal: 'ok', note: 'Input LEDs normal. The box reports CLOCK: MASTER.' },
        consoleIn: { signal: 'ok', note: 'Every channel clicks at the same instant. The console’s clock page reads INTERNAL — two masters, and the receiver slips a sample whenever they drift apart.', flags: ['clicks'] },
        listener: { signal: 'ok', note: 'A tick through the whole mix every few seconds.', flags: ['clicks'] },
      },
    ),
    options: ['A digital clock mismatch — one clock master, everything else slaved to it', 'A bad microphone cable', 'A ground loop', 'Feedback'],
    correct: 0,
    explain: 'One bad cable affects one channel; a clock fault affects every channel at once, at the same instant. Two devices each believing they are master is the classic cause.',
    fix: 'Choose ONE clock master — on a proprietary link usually the console — and set every other device to slave from it. On Dante or AES67 the network ELECTS the master: the equivalent mistake is two devices forced to preferred master, or one forced to INTERNAL. Confirm the sample rates match.',
    forward: 'Every channel together means the fault is where the channels first share a clock — the console’s digital input, not any microphone.',
  },
  {
    id: 'network',
    startAt: 'stagebox',
    group: 'digital',
    title: 'Network audio interruption',
    symptom: '“The whole PA drops out for a second, then comes back.”',
    setup: 'One network cable from the stagebox to the console, routed through a door hinge to an office switch with Energy-Efficient Ethernet enabled.',
    faultAt: 'stagebox',
    reads: reads(
      'stagebox',
      { signal: 'ok', note: 'Everything drops together.', flags: ['dropout'] },
      {
        stagebox: { signal: 'ok', note: 'The LINK LED blinks off when the door moves. Every input drops together. The cable is crushed at the hinge — and the switch has Energy-Efficient Ethernet enabled, which drops the link between packets.', flags: ['dropout'] },
        consoleIn: { signal: 'ok', note: 'Every channel vanishes and returns as one.', flags: ['dropout'] },
        listener: { signal: 'ok', note: 'A second of silence, then the show returns.', flags: ['dropout'] },
      },
    ),
    options: ['The network link between the stagebox and the console is failing (cable or switch)', 'One microphone cable is intermittent', 'The amplifier is going into protect', 'The limiter is closing'],
    correct: 0,
    explain: 'All inputs dropping as one is a transport fault, not a channel fault. On a networked system the transport is a single cable and whatever it passes through — and a door hinge is where cables die.',
    fix: 'Re-route the cable clear of the door with strain relief, use a switch with Energy-Efficient Ethernet disabled and QoS set for audio, and run the redundant second link if the system supports it.',
    forward: 'The stagebox is the first station where all channels share one path. Its LINK light told the story before a single cable was swapped.',
  },
  {
    id: 'feedback',
    startAt: 'consoleIn',
    labels: { consoleOut: 'Aux output', processor: 'Monitor EQ', amp: 'Monitor amp', speaker: 'Wedge', listener: 'Performer' },
    kinds: { speaker: 'wedge' },
    group: 'digital',
    title: 'Feedback appears during soundcheck',
    symptom: '“A ring starts every time the singer’s wedge comes up.”',
    setup: 'Vocal microphone with a cardioid pattern; the wedge fires up into the FRONT of the capsule — on-axis — and the singer’s monitor send is at +6 dB.',
    faultAt: 'speaker',
    reads: reads(
      'speaker',
      { signal: 'hot', note: 'A rising ring.', flags: ['feedback'] },
      {
        consoleIn: { signal: 'ok', note: 'Vocal preamp gain sensible; no clipping.' },
        consoleOut: { signal: 'ok', note: 'Aux 1 send on the vocal at +6 dB — hotter than anything else in that mix.' },
        processor: { signal: 'ok', note: 'Not in the monitor path.' },
        amp: { signal: 'ok', note: 'Monitor amplifier clean.' },
        speaker: { signal: 'hot', note: 'The wedge sits ON-AXIS, firing into the capsule’s most sensitive angle. Raise the send: a 2.5 kHz ring builds until it howls.', flags: ['feedback'] },
        listener: { signal: 'hot', note: 'Everyone hears the ring before the singer hears the wedge.', flags: ['feedback'] },
      },
    ),
    options: ['Acoustic feedback: the wedge is aimed into the microphone and the send is too hot — reposition, reduce, then notch', 'A faulty cable', 'A digital clock error', 'A ground loop'],
    correct: 0,
    explain: 'Feedback is a loop, not a component: microphone → console → wedge → microphone. Gain-before-feedback is spent first by geometry — a wedge in the pattern’s live angle — then by level. Position and placement come before any equaliser.',
    fix: 'Move the wedge into the microphone’s null — directly behind a cardioid; about 110–125° off-axis for a super- or hypercardioid, which has a small rear lobe — lower the send, then find the ringing frequency on the analyser and apply a narrow cut.',
    forward: 'Electrical stations were all clean; the fault was ACOUSTIC, at the last station, where the loudspeaker meets the microphone again.',
  },
];

export function faultCase(id: string): FaultCase {
  const f = FAULTS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown fault: ${id}`);
  return f;
}

export function faultsInGroup(group: FaultGroup): FaultCase[] {
  return FAULTS.filter((f) => f.group === group);
}

/* ── grading ─────────────────────────────────────────────────────────────── */

/** Was every probe at or after the one before it? Re-probing the same
 *  station is allowed; jumping back is not a forward walk. */
export function isForwardWalk(probes: readonly Station[]): boolean {
  let last = -1;
  for (const p of probes) {
    const i = STATION_ORDER.indexOf(p);
    if (i < last) return false;
    last = i;
  }
  return true;
}

/** The first station whose reading is not healthy — the fault station, or
 *  the first station where the fault becomes visible. */
export function firstAbnormal(c: FaultCase): Station {
  for (const s of STATION_ORDER) {
    const r = c.reads[s];
    if (r.signal !== 'ok' || (r.flags && r.flags.length > 0)) return s;
  }
  return c.faultAt;
}

/** Probes a disciplined forward walk needs: from the station the symptom
 *  leaves in doubt (`startAt`) to the fault station, inclusive. */
export function minimalProbes(c: FaultCase): number {
  return STATION_ORDER.indexOf(c.faultAt) - STATION_ORDER.indexOf(c.startAt) + 1;
}

/** Was the walk forward AND did it start where the symptom says to? A probe
 *  before `startAt` is not wrong, just wasted; only a backward jump breaks
 *  the discipline. */
export function stationLabelFor(c: FaultCase, s: Station, fallback: string): string {
  return c.labels?.[s] ?? fallback;
}

export type AttemptGrade = {
  correct: boolean;
  forward: boolean;
  /** Probed the fault station before answering. */
  sawFault: boolean;
  probes: number;
  minimal: number;
};

export function gradeAttempt(c: FaultCase, probes: readonly Station[], pick: number): AttemptGrade {
  return {
    correct: pick === c.correct,
    forward: isForwardWalk(probes),
    sawFault: probes.includes(c.faultAt),
    probes: probes.length,
    minimal: minimalProbes(c),
  };
}
