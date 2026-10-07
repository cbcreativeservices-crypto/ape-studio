/**
 * E09 RHYTHM SECTIONS AND COMPLETE BANDS — the lesson as DATA (the
 * 2026-10-07 journey). Words from the owner's lesson (docs/labs/miking/
 * source_text/Rhythm-Sections-and-Complete-Bands-Miking-Technique.txt;
 * "L<n>" in comments only); research in docs/labs/miking/rhythm_section_band/;
 * corrections G4-E09-* in CORRECTIONS_LOG.md (the academy name and the
 * institutional wording are not carried; the overhead-and-side method is
 * named by what it is and sent to the Drum Overheads lesson, never redrawn).
 * A stage-plot lesson: the spill, open-mic and 3:1 readouts are derived
 * from the drawing (stagePlot.ts). Suggested starting points; no sources on
 * screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { BRAND_REASON, ensembleWords, hearingCheck, POWER_REASON } from '../shared/ensemble/ensembleItems.ts';
import { E09_MODEL, E09_PLACE, E09_SETUPS, E09_WEDGES, E09_ZONES, ROOM_C } from './geometry.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a complete band on a stage plot — drums, bass, guitar, keys and a singer — and see where each one’s sound leaves: the kit from everywhere at once, the guitar and bass from their amps, the keys from a DI. Shown, never played.',
    credit: { scenarios: ['bd.meet.1', 'bd.meet.2', 'bd.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'On a band stage the loud sources are the kit and the amps, and the quietest is the voice. Which way each amp faces, and how loud the stage is, decides what reaches every other mic before any mic goes up.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real plans drawn on the stage plot — a minimal plan, an expanded one, the vocal and its wedge, the bass DI under a cabinet mic; in a studio room, the band tracking together — with what each close mic also hears and what open mics cost.',
    credit: { scenarios: ['bd.set.1', 'bd.set.2', 'bd.hear'], interactive: 'setupsSeen', note: 'Look at every main plan on the drawing, and answer the three checks.' },
    takeaway: 'Start with the fewest channels that give a clear mix. Arrange the band first — amps turned away from the vocal mic, stage volume down — then add only the mics a part needs. Every open mic costs gain before feedback.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose the band’s mics by what they do — directional dynamics close to the loud sources and the voice, condensers for the overheads, a DI where a line output will do.',
    credit: { scenarios: ['bd.mic.1', 'bd.mic.2', 'bd.mic.3', 'bd.rec.1'], note: 'Answer the four checks (one reaches back to where the sound leaves).' },
    takeaway: 'Close, directional pickup is what gives a band stage its gain before feedback. A DI is a separate electrical path, not a mic: it brings no spill, and no cabinet either.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a plan and move the drum pair yourself — lower, higher, over the kit or in front of it — and see what changes.',
    credit: { scenarios: ['bd.place.1', 'bd.place.2', 'bd.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the players, in two different recommended starting points, and answer the three checks. The worked example earns nothing on its own.' },
    takeaway: 'Change one thing at a time and compare at matched level. A pair over the kit hears the whole kit; nearer the snare, more drums; higher, more cymbals and room.',
  },
  context: {
    title: 'Live sound and recording',
    goal: 'Turn the vocal mic so the singer’s wedge sits in its rejection — and give every mic a role: the PA, the wedges, the recording.',
    credit: { scenarios: ['bd.ctx.1', 'bd.ctx.2', 'bd.ctx.studio', 'bd.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the vocal mic (or change its pattern) until the wedge sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'A cardioid, a supercardioid and a hypercardioid each want the wedge at a different angle. Keep room and audience mics out of the wedges, split the mics safely for a recording, and never provoke feedback.',
  },
  twoMic: {
    title: 'Bleed between two mics',
    goal: 'The vocal mic and the kick mic both hear the band: see how much later each source reaches the far mic, what polarity changes and what it does not, and why bleed is judged in the complete mix.',
    credit: { scenarios: ['bd.first', 'bd.two.1', 'bd.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'Bleed arrives late in the far mic. Polarity changes its sign, never its time. Move a mic, change the distance or reduce the overlap before reaching for a delay — and judge in the complete mix, in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all eight symptoms (a retry is explained, never penalised).' },
    takeaway: 'The arrangement and the stage first: amp direction, stage volume, monitor angles, open mics — then distance and polarity — and only then EQ. Lower the level at the first sign of ringing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a band plan in order, choose and justify a plan for two briefs, and say when bleed helps and when it limits.',
    credit: { scenarios: ['bd.prac.order', 'bd.prac.gain', 'bd.prac.setup1', 'bd.prac.setup2', 'bd.prac.3', 'bd.prac.4', 'bd.prac.5'], note: 'Put the plan in order, answer the gain check, complete both briefs, and answer the three reasoning cards. The observation sheet is optional.' },
    takeaway: 'Hear the band first, arrange it, set the stage mix, then the fewest mics that do the job — each with a role — and check bleed, polarity and mono in the complete mix.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L6, L13–L19 · set L6–L7, L27–L33 · mic L13–L19, L31 · place L10–L11, L27 · ctx L31–L33 · two L23, L35–L36 · prac L106–L112. */
const scenarios: MikingScenario[] = [
  {
    id: 'bd.meet.1',
    page: 'meet',
    prompt: 'Where does an electric guitar’s sound leave, on a band stage?',
    options: ['From its amp’s speaker, along the grille’s axis', 'From the strings and the pickups of the guitar itself', 'Equally from the guitar and the amp together'],
    correct: 'From its amp’s speaker, along the grille’s axis',
    explain: 'The sound is the amp’s: it leaves the speaker strongest on its axis, the highs in the narrowest beam. Which way the amp faces decides which mics hear it.',
    why: {
      'From the strings and the pickups of the guitar itself': 'An electric guitar is nearly silent acoustically; the pickups make a signal for the amp.',
      'Equally from the guitar and the amp together': 'The guitar body adds almost nothing; the amp is the source.',
    },
  },
  {
    id: 'bd.meet.2',
    page: 'meet',
    prompt: 'Why does the vocal mic sit right at the singer’s lips?',
    options: ['The voice is the quietest source there', 'Vocal mics only work right at the lips', 'The singer moves less than the players'],
    correct: 'The voice is the quietest source there',
    explain: 'Drums and amps are far louder than a voice. A close, directional vocal mic keeps the voice well ahead of everything else that reaches it.',
    why: {
      'Vocal mics only work right at the lips': 'They work at other distances too — the band would just be louder in them.',
      'The singer moves less than the players': 'Singers often move more; closeness is about level against the band. (The kick, snare and amp mics sit just as close to their own, much louder, sources.)',
    },
  },
  {
    id: 'bd.meet.3',
    page: 'meet',
    prompt: 'A keyboard runs through a DI box. What does a nearby vocal mic hear of it?',
    options: ['Only what its wedge or the PA plays back', 'The keyboard’s full sound from its keys', 'Its line signal, carried through the air around it'],
    correct: 'Only what its wedge or the PA plays back',
    explain: 'A DI carries the keyboard as an electrical signal. Acoustically the keys make only a little action noise; on stage it is heard from the wedges and the PA.',
    why: {
      'The keyboard’s full sound from its keys': 'An electronic keyboard makes almost no sound of its own.',
      'Its line signal, carried through the air around it': 'A line signal travels in the cable, not the air.',
    },
  },
  {
    id: 'bd.set.1',
    page: 'setups',
    prompt: 'The guitar is too loud in the vocal mic. What do you try first?',
    options: ['Turn the amp away and lower the stage level', 'Add a high-pass and some EQ to the vocal channel', 'Push the vocal up until it clears the guitar'],
    correct: 'Turn the amp away and lower the stage level',
    explain: 'The arrangement is a mixing tool: rotate or move the amp so it does not point at the vocal mic, and bring the backline down, before any processing.',
    why: {
      'Add a high-pass and some EQ to the vocal channel': 'EQ on the vocal cannot separate the guitar that shares its range.',
      'Push the vocal up until it clears the guitar': 'Raising the vocal raises the guitar in it too — and the feedback risk.',
    },
  },
  {
    id: 'bd.set.2',
    page: 'setups',
    prompt: 'Spare channels are available. Which sources get their own mic?',
    options: ['Those that need independent control', 'Each one: more channels mean more control later', 'Each one, as long as its mic is a cardioid'],
    correct: 'Those that need independent control',
    explain: 'Do not add mics simply because inputs are available. Each one adds spill, phase relationships, setup time and another path to feed back.',
    why: {
      'Each one: more channels mean more control later': 'More tracks also bring more crosstalk and phase pairs — not automatically more control.',
      'Each one, as long as its mic is a cardioid': 'A pattern does not remove the cost of another open mic.',
    },
  },
  hearingCheck('bd', 'setups', 'the full band at the loudest passage'),
  {
    id: 'bd.mic.1',
    page: 'microphone',
    prompt: 'Which mic gives the voice the best ratio over the band on stage?',
    options: ['A directional dynamic close to the lips', 'An omni condenser a metre from the singer', 'A pair of overheads above the whole stage'],
    correct: 'A directional dynamic close to the lips',
    explain: 'Close, directional pickup gives the best direct-to-spill ratio and gain before feedback in a full-band room.',
    why: {
      'An omni condenser a metre from the singer': 'At a metre an omni hears the drums and amps nearly as loud as the voice.',
      'A pair of overheads above the whole stage': 'Overheads hear the kit and the room; the voice is buried.',
    },
  },
  {
    id: 'bd.mic.2',
    page: 'microphone',
    prompt: 'What does a bass DI give that a cabinet mic does not?',
    options: ['A steady low end with no stage spill', 'The cabinet’s character and the room', 'More output in the very highest octave'],
    correct: 'A steady low end with no stage spill',
    explain: 'A DI is a consistent electrical foundation that reduces amp spill into the vocal and drum mics. A cabinet mic adds the cabinet’s character — and spill and phase decisions.',
    why: {
      'The cabinet’s character and the room': 'That is what the cabinet mic adds; the DI has neither.',
      'More output in the very highest octave': 'The DI’s value is stability and isolation, not extra highs.',
    },
  },
  {
    id: 'bd.mic.3',
    page: 'microphone',
    prompt: 'A supercardioid replaces a cardioid on the vocal. What changes for the wedge?',
    options: ['Its best place moves off the mic’s back', 'Nothing: they reject the same direction', 'The wedge can now face the mic’s front'],
    correct: 'Its best place moves off the mic’s back',
    explain: 'A cardioid rejects most straight behind; a supercardioid’s null sits well off its back, with a little pickup directly behind. Place the wedge by the real pattern.',
    why: {
      'Nothing: they reject the same direction': 'Their nulls are at different angles — the reason the lesson says the monitor angles differ.',
      'The wedge can now face the mic’s front': 'No pattern rejects its front: that is where it hears most.',
    },
  },
  {
    id: 'bd.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does a bass amp’s low end go on a stage?',
    options: ['All round the stage, not just ahead', 'Only along the straight-ahead axis of each woofer', 'Straight down into the stage floor'],
    correct: 'All round the stage, not just ahead',
    explain: 'Low frequencies spread in every direction from a cabinet — one reason a DI helps the vocal and drum mics.',
    why: {
      'Only along the straight-ahead axis of each woofer': 'Only the highs beam; the lows spread round.',
      'Straight down into the stage floor': 'Some goes into the floor, but most spreads round the stage.',
    },
  },
  {
    id: 'bd.place.1',
    page: 'placement',
    prompt: 'The overhead pair hears too much cymbal and room. First change?',
    options: ['Bring it a little lower over the kit', 'Add a close mic to each drum on the kit', 'Pan the pair narrower in the mix'],
    correct: 'Bring it a little lower over the kit',
    explain: 'Higher tends to bring in more cymbals and room; lower, more drums. Move the pair one step and compare at matched level.',
    why: {
      'Add a close mic to each drum on the kit': 'Close mics add focus but not less cymbal in the pair.',
      'Pan the pair narrower in the mix': 'Width is not the balance; the pair’s height sets that.',
    },
  },
  {
    id: 'bd.place.2',
    page: 'placement',
    prompt: 'Why keep both mics of the spaced pair the same distance from the snare?',
    options: ['So the snare stays solid in the centre', 'So both mics need the same gain setting', 'So the pair passes the 3:1 spacing test'],
    correct: 'So the snare stays solid in the centre',
    explain: 'Equal distances mean the snare reaches both mics together: it images in the middle and sums cleanly in mono.',
    why: {
      'So both mics need the same gain setting': 'Matching gain is a separate step; the distances set the arrival times.',
      'So the pair passes the 3:1 spacing test': '3:1 is for separate mics on separate sources, never one pair.',
    },
  },
  {
    id: 'bd.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does a drum kit’s sound leave?',
    options: ['From every head and cymbal at once', 'Mostly from the kick drum’s front head and port', 'From the snare drum alone'],
    correct: 'From every head and cymbal at once',
    explain: 'The kit is a large, spread source — about two metres of heads and cymbals — which is why a pair above it hears it as one picture.',
    why: {
      'Mostly from the kick drum’s front head and port': 'The kick is one part; the snare, toms and cymbals radiate too.',
      'From the snare drum alone': 'The snare is the drawing’s reference point, not the only source.',
    },
  },
  {
    id: 'bd.ctx.1',
    page: 'context',
    prompt: 'A live show is recorded through a split. Where do the audience mics go?',
    options: ['To the recording only, not the wedges', 'To the wedges, so the band hears the crowd', 'To the PA, to make the room sound bigger'],
    correct: 'To the recording only, not the wedges',
    explain: 'Record audience or room mics when the production needs them, but keep them out of the monitor sends and protect them from feedback.',
    why: {
      'To the wedges, so the band hears the crowd': 'Distant mics in the wedges are an easy path to feedback.',
      'To the PA, to make the room sound bigger': 'A room mic in the PA hears the PA back.',
    },
  },
  {
    id: 'bd.ctx.2',
    page: 'context',
    prompt: 'A mic splitter feeds the PA and a recorder. What do you check?',
    options: ['Phantom power and grounding, with the makers', 'Nothing: a split is just two cables wired together', 'Only that the recorder’s inputs are not clipping'],
    correct: 'Phantom power and grounding, with the makers',
    explain: 'Confirm phantom-power and grounding practice with the splitter and console makers; never improvise a split with unsafe parallel wiring.',
    why: {
      'Nothing: a split is just two cables wired together': 'An improvised parallel split can be unsafe and noisy.',
      'Only that the recorder’s inputs are not clipping': 'Levels matter, but power and grounding come first.',
    },
  },
  {
    id: 'bd.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · The band wants to track together, feel first. Where do you start?',
    options: ['Live in one room, bleed controlled', 'Each player overdubbed alone', 'Each amp in its own room, no eye contact'],
    correct: 'Live in one room, bleed controlled',
    explain: 'When interaction and energy matter more than separation, track together with intentional spill directions — and isolate only what needs it.',
    why: {
      'Each player overdubbed alone': 'That gives control but loses the timing and interaction the band asked for.',
      'Each amp in its own room, no eye contact': 'Isolation without sightlines removes the response between players.',
    },
  },
  {
    id: 'bd.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A singer’s wedge plays the whole band loud. What happens?',
    options: ['The vocal mic hears it, and rings sooner', 'Only the singer hears it, so nothing changes', 'The PA gets quieter to make up for it'],
    correct: 'The vocal mic hears it, and rings sooner',
    explain: 'Avoid sending loud backing into the vocal monitor: the wedge feeds the mic beside it, and gain before feedback drops.',
    why: {
      'Only the singer hears it, so nothing changes': 'The wedge also reaches the vocal mic a metre away.',
      'The PA gets quieter to make up for it': 'Nothing compensates by itself; the margin simply shrinks.',
    },
  },
  {
    id: 'bd.first',
    page: 'twoMic',
    prompt: 'The kick is 3 m from the vocal mic and 4 cm from its own. Which hears it first?',
    options: ['The kick mic, about 9 ms earlier', 'The vocal mic, because it is higher', 'Both at once: one band, one room'],
    correct: 'The kick mic, about 9 ms earlier',
    explain: 'Sound travels about 1 m in 2.9 ms: 3 m is close to 9 ms. That late copy in the vocal mic is bleed — fine in the mix, comb-filtering if the two are summed loud.',
    why: {
      'The vocal mic, because it is higher': 'Height does not make a mic early; distance sets the time.',
      'Both at once: one band, one room': 'Different distances mean different arrival times.',
    },
  },
  {
    id: 'bd.two.1',
    page: 'twoMic',
    prompt: 'Flipping the vocal’s polarity makes the kick fuller. What did it fix?',
    options: ['One relationship, not the arrival time', 'The delay between the two mics, fully and for good', 'The bleed itself, which is now gone'],
    correct: 'One relationship, not the arrival time',
    explain: 'Polarity flips the sign; it does not move the arrival. Reverse it only when it sounds more coherent, and fix timing problems by moving mics or reducing overlap.',
    why: {
      'The delay between the two mics, fully and for good': 'A polarity flip never moves an arrival in time.',
      'The bleed itself, which is now gone': 'The bleed is still there; only its sign changed.',
    },
  },
  {
    id: 'bd.two.2',
    page: 'twoMic',
    prompt: 'What do the natural arrival differences between a band’s mics give?',
    options: ['Part of the ensemble’s depth', 'A band that sounds out of time, to be aligned', 'A low end that cancels in each mix'],
    correct: 'Part of the ensemble’s depth',
    explain: 'Do not time-align every mic automatically: natural arrival differences are part of the ensemble image, and needless alignment can flatten the depth.',
    why: {
      'A band that sounds out of time, to be aligned': 'Milliseconds of arrival are not the band’s timing; alignment is a choice to test, not a rule.',
      'A low end that cancels in each mix': 'Only where two mics overlap strongly — and that is judged by ear, pair by pair.',
    },
  },
  {
    id: 'bd.prac.gain',
    page: 'practice',
    prompt: 'When do you soundcheck the gain and the monitors?',
    options: ['At the loudest full-band passage', 'With each instrument on its own', 'During the quietest verse of the set'],
    correct: 'At the loudest full-band passage',
    explain: 'Soundcheck the loudest full-band passage, not only isolated instruments: set the stage mix, then leave a stable margin before feedback.',
    why: {
      'With each instrument on its own': 'Alone, no instrument shows the spill and level of the whole band.',
      'During the quietest verse of the set': 'The first loud chorus would then overload or ring.',
    },
  },
  {
    id: 'bd.prac.3',
    page: 'practice',
    prompt: 'The band tracks live and the drums are in every mic. What do you do?',
    options: ['Judge the bleed in the complete mix', 'Re-record each of the parts alone, to be safe', 'Swap the mics for ribbons or omnis'],
    correct: 'Judge the bleed in the complete mix',
    explain: 'Bleed is not automatically an error: it can glue a band together. Its cost is that processing one track also processes the others in it.',
    why: {
      'Re-record each of the parts alone, to be safe': 'That can lose the interaction the take had; decide by the complete mix.',
      'Swap the mics for ribbons or omnis': 'A mic type does not make bleed right or wrong.',
    },
  },
  {
    id: 'bd.prac.4',
    page: 'practice',
    prompt: 'You want the over-and-beside drum method. Where do you take its geometry from?',
    options: ['The Drum Overheads lesson, measured', 'From memory, roughly over the middle of the kit', 'A spaced pair at the same height'],
    correct: 'The Drum Overheads lesson, measured',
    explain: 'Treat it as an optional drum branch: open the Drum Overheads lesson for its full geometry, the snare-distance measurement and its checks — never an unverified version from memory.',
    why: {
      'From memory, roughly over the middle of the kit': 'Its distances must be measured; a rough version loses what makes it work.',
      'A spaced pair at the same height': 'It is a different method with its own geometry, not a spaced pair.',
    },
  },
  {
    id: 'bd.prac.5',
    page: 'practice',
    prompt: 'The mix starts to ring as the band gets loud. What comes first?',
    options: ['Lower the level, then check the wedges', 'Turn the PA up to hear where it rings', 'Boost the vocal to stay above the ring'],
    correct: 'Lower the level, then check the wedges',
    explain: 'Lower the level at the first ring, then check monitor spill, stage volume and the open mics. Never raise a level to find feedback.',
    why: {
      'Turn the PA up to hear where it rings': 'Raising a level to find feedback is the one thing never to do.',
      'Boost the vocal to stay above the ring': 'More vocal gain feeds the ring — it gets worse.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'bd.s.buried',
    observation: 'The vocal is buried in the band',
    firstChecks: 'Is stage volume or backline pointed at the vocal mic? Reorient the amps, lower the stage level, move the monitor and improve the vocal mic’s rejection.',
    options: ['Turn the amps away; lower the stage level', 'Boost the vocal’s presence range with a bell EQ', 'Swap to an omni vocal mic'],
    correct: 'Turn the amps away; lower the stage level',
    explain: 'The band is reaching the vocal mic: fix the direction and the level at the source first.',
    why: { 'Boost the vocal’s presence range with a bell EQ': 'EQ also lifts the guitar and cymbals inside the vocal mic.', 'Swap to an omni vocal mic': 'An omni hears more of the band, not less.' },
  },
  {
    id: 'bd.s.mono',
    observation: 'The kick or bass disappears in mono',
    firstChecks: 'Polarity or timing between the drum, room, DI and cabinet mics? Mute-check, compare polarity, move mics, reassess the array.',
    options: ['Mute-check each path; compare polarity', 'Add more low end to the master bus to fill it', 'Widen the stereo image further'],
    correct: 'Mute-check each path; compare polarity',
    explain: 'Something is cancelling when summed: find which pair, then fix placement or polarity.',
    why: { 'Add more low end to the master bus to fill it': 'A boost cannot fill a cancellation.', 'Widen the stereo image further': 'Wider usually makes the mono problem worse.' },
  },
  {
    id: 'bd.s.hollow',
    observation: 'The drum kit sounds hollow',
    firstChecks: 'An overhead and close-mic timing or polarity conflict? Check the overhead geometry, the snare distance, polarity and mono before EQ.',
    options: ['Check the overhead geometry and polarity', 'Cut the mids on each drum channel', 'Add some reverb to fill the kit out more'],
    correct: 'Check the overhead geometry and polarity',
    explain: 'Hollowness is usually two paths fighting; measure and compare before EQ.',
    why: { 'Cut the mids on each drum channel': 'EQ cannot repair a cancellation between mics.', 'Add some reverb to fill the kit out more': 'Reverb hides it without fixing the cause.' },
  },
  {
    id: 'bd.s.gtrspill',
    observation: 'The guitar mic is full of drums',
    firstChecks: 'Is the cabinet pointing toward the kit, or the mic too far away? Reorient the cabinet, move the mic closer, or use a safe gobo.',
    options: ['Reorient the cabinet; move the mic closer', 'Gate the guitar channel hard between notes', 'Pull the guitar mic farther back'],
    correct: 'Reorient the cabinet; move the mic closer',
    explain: 'Closer to its speaker and pointing away from the kit, the guitar mic hears more guitar and less drums.',
    why: { 'Gate the guitar channel hard between notes': 'The drums are in the mic while the guitar plays; a gate cannot remove them.', 'Pull the guitar mic farther back': 'Farther back hears even more of the kit.' },
  },
  {
    id: 'bd.s.blurry',
    observation: 'The bass DI and cabinet sound blurry together',
    firstChecks: 'An arrival-time or polarity mismatch? Compare each path, then adjust placement or delay only after the physical checks.',
    options: ['Compare each path, then polarity', 'Turn the cabinet mic up to cover it', 'Add a chorus to the bass bus'],
    correct: 'Compare each path, then polarity',
    explain: 'The DI arrives first and the cabinet mic later: hear each alone, then the sum in mono.',
    why: { 'Turn the cabinet mic up to cover it': 'More of a late path makes the smear worse.', 'Add a chorus to the bass bus': 'An effect adds more blur, not less.' },
  },
  {
    id: 'bd.s.ring',
    observation: 'The live mix rings when the band gets loud',
    firstChecks: 'Monitor spill, stage volume or too many open mics? Lower the stage level, reposition the monitors, close unused channels and keep a margin.',
    options: ['Lower the level; close the unused mics', 'Notch the ring and push the level up', 'Send the room mics to the wedges too'],
    correct: 'Lower the level; close the unused mics',
    explain: 'Lower the level at once, then fix the monitor angles and the open-mic count.',
    why: { 'Notch the ring and push the level up': 'Mixing on the edge of ringing is unstable; leave a margin.', 'Send the room mics to the wedges too': 'Room mics in the wedges make ringing likelier.' },
  },
  {
    id: 'bd.s.muddy',
    observation: 'The room mics make the mix muddy',
    firstChecks: 'Is the room too reflective, or the room mics too close to loud sources? Move or reduce them, use a more directional pattern, filter only as needed.',
    options: ['Move or reduce the room mics', 'Raise the room mics to blend more', 'Pan the room mics hard into the middle'],
    correct: 'Move or reduce the room mics',
    explain: 'Placement first: farther from the loudest sources, or less of them, before filtering.',
    why: { 'Raise the room mics to blend more': 'More mud in the mix makes it muddier.', 'Pan the room mics hard into the middle': 'Panning changes width, not the mud.' },
  },
  {
    id: 'bd.s.energy',
    observation: 'The band loses energy in isolated tracking',
    firstChecks: 'Can the musicians see and hear one another? Improve sightlines, talkback, cue mixes and the scratch performance before changing mics.',
    options: ['Improve sightlines and the cue mixes', 'Change the mics to brighter models', 'Track faster with fewer takes'],
    correct: 'Improve sightlines and the cue mixes',
    explain: 'Isolation can cut the response between players; restore eye contact and what each hears.',
    why: { 'Change the mics to brighter models': 'The mics are not the cause; the players lost each other.', 'Track faster with fewer takes': 'Rushing does not restore the interaction.' },
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'bd.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A rock band in a 300-seat club, a mono PA and five wedges; a stereo recording is wanted through a splitter. Phantom power on the overheads.',
    setups: [
      { id: 'a', label: 'Overheads, kick, guitar amp mic, vocal; bass and keys by DI', ok: true, power: 'phantom', feedback: 'The minimal plan: few open mics, the DIs carrying bass and keys.' },
      { id: 'b', label: 'The expanded plan, with only the needed mics open per song', ok: true, power: 'phantom', feedback: 'Fair, with the open-mic count managed song by song.' },
      { id: 'c', label: 'A stereo room pair sent to the PA and to every wedge', ok: false, power: 'phantom', feedback: 'Room mics in the wedges invite feedback.' },
      { id: 'd', label: 'An omni on every source, for a natural sound', ok: false, power: 'phantom', feedback: 'Omnis on a loud stage hear everything; gain before feedback suffers.' },
      { id: 'e', label: 'A homemade Y-cable to split the mics', ok: false, power: 'phantom', feedback: 'An improvised parallel split is unsafe; use a proper splitter.' },
    ],
    reasons: [
      { id: 'r.close', label: 'Close, directional mics on the loud sources and the voice', role: 'required', feedback: 'Say why: the most gain before feedback.' },
      { id: 'r.open', label: 'Only the mics a song needs are open', role: 'required', feedback: 'Every open mic costs gain before feedback.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'More than one plan passes. What passes is the reasoning: close directional pickup, the fewest open mics, monitors kept away from distant mics, a safe split.',
  },
  {
    id: 'bd.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A band records an album live in one good-sounding room; they want feel first, with a clean final vocal later. Phantom power available.',
    setups: [
      { id: 'a', label: 'Live in the room, amps to the walls, a scratch vocal, the final vocal later', ok: true, power: 'phantom', feedback: 'Feel from the room, control where it matters: the vocal replaced cleanly.' },
      { id: 'b', label: 'Live in the room with the singer screened by gobos and on headphones', ok: true, power: 'phantom', feedback: 'Fair: less spill in the vocal, eye contact kept.' },
      { id: 'c', label: 'Each player overdubbed alone to a click', ok: false, power: 'phantom', feedback: 'That loses the interaction the band asked for.' },
      { id: 'd', label: 'Everyone live, the final vocal sung beside the drums', ok: false, power: 'phantom', feedback: 'A vocal full of drum spill is hard to keep as the final one.' },
      { id: 'e', label: 'Blankets over the amps to deaden the room', ok: false, power: 'phantom', feedback: 'Never cover hot equipment or block its ventilation.' },
    ],
    reasons: [
      { id: 'r.feel', label: 'The rhythm section live, bleed directed on purpose', role: 'required', feedback: 'Say why: the interaction is the point.' },
      { id: 'r.safe', label: 'Amps ventilated; cables, power and walkways clear', role: 'required', feedback: 'Safe isolation only.' },
      POWER_REASON,
      BRAND_REASON,
    ],
    explain: 'Two plans pass. What passes is the reasoning: feel from playing together, spill aimed on purpose, the vocal protected, nothing hot covered.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the stage behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the overhead pair 20 cm. What changes most?', options: ['More cymbals and more room', 'Only the level', 'More kick and toms'], after: 'Higher, the cymbals and the room come up and the drums go down a little. Compare at matched level.' },
  context: { prompt: 'The wedge sits in front of the singer, below the mic. Can the mic’s rejection reach it?', options: ['Yes — aim the mic’s back toward it', 'No — only an omni can', 'It already sits in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The vocal mic and the kick mic both hear the kick. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE to the singer.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'bd.q.1',
    covers: 'meet',
    prompt: 'Where does an electric bass’s sound leave on stage?',
    options: ['From its amp — and its DI as a signal', 'From the bass body and its neck', 'From the strings at the bridge'],
    correct: 'From its amp — and its DI as a signal',
    explain: 'The amp’s speakers make the sound in the air; the DI carries a clean electrical copy.',
    why: { 'From the bass body and its neck': 'A solid-body bass is nearly silent on its own.', 'From the strings at the bridge': 'The strings drive the pickups; the amp makes the sound.' },
  },
  {
    id: 'bd.q.2',
    covers: 'meet',
    prompt: 'Which is the quietest source on a band stage?',
    options: ['The singer’s voice', 'The drum kit', 'The guitar amp, close up'],
    correct: 'The singer’s voice',
    explain: 'The voice is far quieter than the kit and the amps — so its mic goes right at the lips, where the voice is loudest against the band.',
    why: { 'The drum kit': 'The kit is usually the loudest thing on the stage.', 'The guitar amp, close up': 'An amp is set loud enough to compete with the kit.' },
  },
  {
    id: 'bd.q.3',
    covers: 'setups',
    prompt: 'What do you settle before placing any band mic?',
    options: ['The band’s layout and stage volume', 'The EQ on each of the channels', 'Which brand of mics to buy'],
    correct: 'The band’s layout and stage volume',
    explain: 'The arrangement is a mixing tool: move or turn amps, lower stage volume, then mic.',
    why: { 'The EQ on each of the channels': 'EQ comes after the sound is captured.', 'Which brand of mics to buy': 'Choose by pattern and role, not by brand.' },
  },
  {
    id: 'bd.q.4',
    covers: 'setups',
    prompt: 'What does each extra open mic cost on a live stage?',
    options: ['Gain before feedback', 'Nothing, if it is a cardioid', 'Only setup time'],
    correct: 'Gain before feedback',
    explain: 'Each doubling of open mics costs about 3 dB of gain before feedback — close the ones a song does not need.',
    why: { 'Nothing, if it is a cardioid': 'A cardioid still adds a path for the PA and the wedges.', 'Only setup time': 'It costs feedback margin, phase pairs and noise too.' },
  },
  {
    id: 'bd.q.5',
    covers: 'setups',
    prompt: 'Where do audience mics go when a show is recorded?',
    options: ['The recording, not the wedges', 'The wedges, so the band hears the room', 'The PA, for size'],
    correct: 'The recording, not the wedges',
    explain: 'Keep room and audience mics out of the monitor sends and protect them from feedback.',
    why: { 'The wedges, so the band hears the room': 'Distant mics in the wedges feed back easily.', 'The PA, for size': 'A room mic in the PA hears the PA.' },
  },
  {
    id: 'bd.q.6',
    covers: 'setups',
    critical: true,
    prompt: 'The guitar amp is too loud in the room. What is the safe way to tame it?',
    options: ['A gobo, the amp kept ventilated', 'Thick blankets draped over the amp', 'A blanket over it for short takes'],
    correct: 'A gobo, the amp kept ventilated',
    explain: 'Do not cover hot equipment or block ventilation with improvised blankets; use safe, approved isolation and keep cables and power accessible.',
    why: { 'Thick blankets draped over the amp': 'Blankets trap heat — a fire and damage risk.', 'A blanket over it for short takes': 'A hot amp can overheat in minutes.' },
  },
];

export const E09_LESSON: EnsembleLesson = {
  id: 'E09',
  labId: 'ensembles',
  title: 'Rhythm Sections and Complete Bands',
  subtitle: 'A band on a stage plot: arrange it first, the fewest mics that do the job, every open mic counted',
  noun: { one: 'band', many: 'bands' },
  model: E09_MODEL,
  micTypeIds: ['vocDynSuper', 'vocDynCard', 'kickDynCard', 'instDynCard'],
  zones: E09_ZONES,
  setupPairs: [
    { label: 'The vocal mic and the kick mic', A: { zone: 'bd.voc', typeId: 'vocDynSuper', pattern: 'supercardioid' }, B: { zone: 'bd.kick', typeId: 'kickDynCard', pattern: 'cardioid' }, line: 'Each hears the other’s source late: bleed, judged in the complete mix.' },
  ],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'bd.prac.order',
      page: 'practice',
      prompt: 'A band’s mic plan, in order:',
      steps: [
        { text: 'Hear the band without mics: loudest chorus, quietest verse', early: 'Start by listening to what the band already sounds like.' },
        { text: 'Arrange it: amps turned, stage volume down, sightlines', early: 'The arrangement comes before any mic.' },
        { text: 'The fewest mics and DIs for a clear mix', early: 'Mics come once the band is arranged.' },
        { text: 'Soundcheck the loudest passage; set the stage mix', early: 'Gain and monitors are set with the mics up.' },
        { text: 'Check bleed, polarity and mono in the complete mix', early: 'Checks come once everything is connected.' },
      ],
      explain: 'Hear the band, arrange it, add only the mics it needs, soundcheck the loudest passage with a safe margin — then check bleed, polarity and mono in the full mix.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A complete band: drums, bass, electric or acoustic guitars, keyboards, vocals and percussion playing together — on a stage or in a studio room.', src: 'LESSON-BAND' },
    { title: 'WHAT IT ASKS OF YOU', text: 'Deliberate choices about the image, isolation, bleed, monitor spill, phase and gain before feedback — from a minimal plan to an expanded one.', src: 'LESSON-BAND' },
    { title: 'HOW IT IS LAID OUT', text: 'This lab draws a typical stage plot: drums upstage centre, guitar and bass in front of their amps, keys at the side, the singer downstage — and the same band tracking in one room.', src: 'LESSON-BAND' },
    { title: 'ITS SIZE', text: 'The stage is about 10 m wide; the band fills about 8 m of it. A typical layout, not a particular band.', src: 'LESSON-BAND' },
  ],
  sound: {
    stages: [
      { title: 'The loud sources', text: 'The kit radiates from every head and cymbal at once; the guitar and bass from their amps, along each speaker’s axis.' },
      { title: 'Where they point', text: 'An amp’s highs beam along its axis, its lows spread round; turning an amp changes which mics hear it — before any mic goes up.' },
      { title: 'The quietest source', text: 'The voice is the quietest thing on the stage: its mic goes right at the lips, aimed so the stage reaches its back.' },
    ],
    attack: 'Stick and pick attacks reach a close mic first and clearest; the same attacks reach every other open mic a little later, as bleed.',
    body: 'The sustained band sound blends in the room: the overheads and room mics hear the blend; close mics hear one source and the rest as bleed. Tendencies — bands and rooms vary.',
    head: { diameterMm: 8000, rods: 0, label: 'a band', strikeSrc: 'LESSON-BAND' },
  },
  setting: {
    items: [
      { id: 'amps', label: 'the amps and which way they face', short: 'AMPS', note: 'Aim each cabinet away from the vocal mic and the quieter acoustic sources; keep it close enough to control its direct sound.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Aim the cabinet away from the vocal microphone and quieter acoustic sources (L15)' }, tag: 'SPILL', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUMS', note: 'The loudest, widest source: it reaches every open mic. Start from the overhead plan that suits the music and add close mics only for control.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Start with the drum-overhead plan that matches the music, room, and desired image (L10)' }, tag: 'SPILL', scene: 'all' },
      { id: 'heat', label: 'hot amps, cables and power', short: 'SAFETY', note: 'Never cover hot equipment or block ventilation; keep cables, power and walkways clear and serviceable.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Do not cover hot equipment or block ventilation with improvised blankets (L15)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedges', label: 'the wedges', short: 'WEDGES', note: 'Place each wedge where its mic’s least-sensitive direction is; cardioid, supercardioid and hypercardioid need different angles. No loud backing in the vocal wedge.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'keep monitors aimed at each microphone’s actual null (L31)' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'split', label: 'the mic splitter', short: 'SPLIT', note: 'A splitter feeds the PA and the recording; confirm phantom power and grounding with its maker — never an improvised parallel split.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Confirm phantom-power and grounding practice with the splitter and console manufacturer (L32)' }, tag: 'ROLES', scene: 'stage' },
      { id: 'roomMics', label: 'room and audience mics', short: 'ROOM', note: 'Record them when the production needs them; keep them out of the wedges and protect them from feedback.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'keep them out of monitor sends and protect them from feedback (L32)' }, tag: 'RECORD ONLY', scene: 'stage' },
      { id: 'gobos', label: 'gobos and booths', short: 'GOBOS', note: 'They reduce direct spill but change reflections and sightlines; keep eye contact and a useful cue mix.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Gobos can reduce direct spill without making the room completely dead, but they change reflections and sightlines (L15)' }, tag: 'ISOLATION', scene: 'studio' },
      { id: 'cue', label: 'headphones and cue mixes', short: 'CUE', note: 'Use headphones or low, carefully placed monitors for the players who need a cue mix.', prov: { kind: 'sourced', src: 'LESSON-BAND', quote: 'Use headphones or low-volume, carefully placed monitors (L22)' }, tag: 'PLAYERS', scene: 'studio' },
    ],
    stage: 'LIVE: start with the minimum channels that give a clear, stable front-of-house mix. Directional mics close to the loud sources; monitors aimed at each mic’s real null; set the stage mix first, then leave a stable margin before feedback.',
    studio: 'A RECORDING: decide between playing together with controlled bleed and an isolation-heavy production — or a hybrid: the rhythm section live, a vocal or a featured amp isolated.',
  },
  diagnostic,
  practice: {
    task: 'With the band’s agreement, hear it without mics, arrange it, set the stage mix at the loudest passage, add only the mics each part needs with a role for each, and check bleed, polarity and mono in the complete mix. Log what you tried below.',
    fields: [
      { id: 'band', label: 'The band and its layout', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['live sound', 'recording', 'both'] },
      { id: 'plan', label: 'Minimal or expanded: the mics and DIs', kind: 'text' },
      { id: 'orient', label: 'Where every amp, wedge and main mic faces', kind: 'text' },
      { id: 'roles', label: 'What feeds the PA, the wedges, the recording', kind: 'text' },
      { id: 'notes', label: 'What you heard: bleed, polarity, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Every position on the stage plot is a drawing default: drums upstage centre, the amps about 1.5 m behind their players, keys at the side, the singer 0.4 m behind the band’s front line, wedges 0.9 m in front of each player (1.35 m for the singer, past the mic stand), the PA at the front corners.', dims: [] },
    { text: 'The kit is the shared 5-piece kit of Lab 1; the amps are Lab 4’s cabinets at their published sizes; the singer’s lips at the voice family’s standing height.', dims: [] },
    { text: 'The close mics borrow their distances from the instrument lessons (kick 4 cm out at the port, snare 5 cm over the rim, guitar amp 5 cm and bass woofer 6 cm from the grille, vocal within 10 cm); the overhead pair is 1.4 m wide, each mic 1.2 m from the snare; the room pair 0.6 m up — its height a drawing default.', dims: [] },
  ],
  live: { wedges: E09_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. A band has no single right plan: hear it, arrange it, then add only the mics each part needs. The readouts on the stage plot are calculated from the drawing — equal source levels, straight paths, ideal patterns, no room — to compare plans, not to predict a venue. Every band, room and production is different: experiment, compare at matched level, and trust your ears. Keep hot equipment ventilated, cables and walkways clear, protect your hearing and never provoke feedback.',
  copy: { words: ensembleWords('band') },
  ensemble: {
    seatings: { stage: 'band.stage', room: 'band.room' },
    setups: E09_SETUPS,
    placeZones: E09_PLACE,
    worked: { stage: 'min', room: 'rexp' },
    meet: {
      figureTitle: 'A BAND ON A STAGE',
      figureBadge: 'From above, as the audience sees it · a typical stage plot, not a particular band',
      sectionsNote: 'Drums upstage centre, guitar and bass in front of their amps, keys at the side, the singer downstage — a wedge for each player, the PA at the corners. Switch SEATING for the band in one room. Tap a player or an amp.',
      soundNote: 'The arcs show WHERE each sound leaves — never how loud. The guitar and bass leave from their amps, along each speaker’s axis; the kit from everywhere at once; the keys only through the DI and the wedges.',
      mainAt: ROOM_C,
    },
    before: [
      { title: 'HEAR THE BAND', text: 'Without mics, from the listener’s or control-room position: the loudest chorus, the quietest verse, the stops and any featured instrument.' },
      { title: 'ARRANGE IT', text: 'Move loud amps, rotate cabinets, lower stage volume, change the drum orientation, bring quiet sources nearer the main pickup — before any processing.' },
      { title: 'DECIDE THE APPROACH', text: 'Playing together with controlled bleed, an isolation-heavy production, or a hybrid — the rhythm section live, a vocal or a featured amp isolated.' },
      { title: 'SET THE STAGE', text: 'Monitor and cue-mix needs, sightlines and talkback; cable paths, power and stand clearance safe before the soundcheck.' },
    ],
    safety: 'Never cover hot equipment or block its ventilation; use safe, approved isolation. Keep cables, power and walkways clear and serviceable; split mics only through a proper splitter. Protect your hearing; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a band: the drum pair over the kit, then close mics only where a part needs control — a place to start and compare, not a rule.',
      clearance: 'The boom stand stands in front of the kit, its base clear of the kick pedal and the walkway; the bar above the cymbals’ swing and the sticks’ highest point; the cable dressed flat.',
      height: 'Each mic about 1.2 m (4 ft) from the snare’s centre — the same distance — pointing straight down. Higher tends to more cymbals and room; lower, more drums.',
      forward: 'Centred over the snare, so the snare stays in the middle of the picture; the two mics over the hi-hat side and the other side of the kit.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin with the drum pair — each mic about 1–1.4 m from the snare over the kit — or, in a good room, a low pair about 1 m in front of the kick. Places to start and compare, not measurements of a best place.',
      'Change one thing at a time — height, then where it sits over the kit — and compare at a consistent level on the same passage.',
      'Keep the two mics the same distance from the snare as you move them, so the snare stays centred and the pair sums well in mono.',
    ],
    plot: true,
    placeAxes: { h: { lo: 300, hi: 3000 }, z: { lo: -4800, hi: 1200 }, x: { lo: -2500, hi: 2500 } },
  },
};
