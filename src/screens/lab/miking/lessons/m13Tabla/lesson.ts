/**
 * M13 TABLA — the lesson as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Tabla-Miking-Lesson.txt; "L<n>" in comments
 * only), research in docs/labs/miking/tabla/, corrections in
 * CORRECTIONS_LOG.md (TA-01 …). Owner ruling 2026-10-04: suggested starting
 * points, no sources, brands or badges on screen. FULLY SILENT.
 *
 * One documented close distance exists (3–4 in from the heads, L21); every
 * other position is the lesson's own trial. On screen they are simply
 * recommended starting points, with the honest note that every player,
 * pair and room differ.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { TABLA_MODEL, TABLA_ZONES } from './geometry.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the tabla',
    goal: 'Get to know the tabla — the two drums, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'One instrument, two drums: the smaller wooden dayan with its black patch in the middle, and the larger bayan with its patch off-centre. Ringing and damped strokes, the bayan’s pitch glides and quiet finger work all belong to the player’s sound.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a stroke becomes sound on each drum, what the black patch does, and why the bayan’s pitch can move. Shown, never played.',
    credit: { scenarios: ['ta.snd.1', 'ta.snd.2', 'ta.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The black patch’s weight lets the dayan ring with a clear pitch. The bayan’s patch sits off-centre, and pressing the head with the heel of the hand bends its pitch — so the left hand moves across the head all the time.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know how the player sits, where the hands move, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['ta.set.1', 'ta.set.2', 'ta.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The player’s seating, supports and hands come first: the mic fits round them. Ask for their strokes in their own terms, agree the role and the balance between the drums, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose mics for the tabla by their properties — pattern, power, size and mount — not by their brand.',
    credit: { scenarios: ['ta.mic.1', 'ta.mic.2', 'ta.mic.3', 'ta.mic.4', 'ta.rec.1'], note: 'Answer the five checks (one reaches back to how the tabla sounds).' },
    takeaway: 'One condenser for a shared picture, one per drum for separate control, dynamics for a loud stage, a coincident pair for stereo, an omni to compare in a quiet room. The bayan does not need a large diaphragm. A stand is the default.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — from the audience side, clear of both hands — then move the mic and see what changes.',
    credit: { scenarios: ['ta.place.1', 'ta.place.2', 'ta.place.3', 'ta.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the player, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Distance, viewpoint and angle are separate things to try, one at a time. If one drum dominates, move toward the weaker one rather than only turning the mic. Both hands’ paths come before every number.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do.',
    credit: { scenarios: ['ta.ctx.1', 'ta.ctx.2', 'ta.ctx.studio', 'ta.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid rejects most toward the rear sides and hears a little straight behind. Start with the fewest mics that give the balance, and only the monitor level the player needs.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Put one mic on each drum: see what polarity does and does not change, and judge the pair in mono.',
    credit: { scenarios: ['ta.two.1', 'ta.two.2', 'ta.two.3', 'ta.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each mic also hears the other drum. Polarity flips the sign; it does not remove a delay. Check the pair in mono with both drums, the glides and ordinary movement — and keep the setup that holds up across the passage.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for EQ: target, viewpoint and distance first; a filter only after you hear what it removes from the bayan.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up the tabla in the right order, choose and justify a setup for two different briefs, and say why you chose your number of mics.',
    credit: { scenarios: ['ta.prac.order', 'ta.prac.gain', 'ta.prac.setup1', 'ta.prac.setup2', 'ta.prac.3', 'ta.mix.1', 'ta.mix.2', 'ta.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real tabla and player.' },
    takeaway: 'Unobstructed playing, the intended balance between the drums, audible quiet strokes and clean loud passages pass — checked in mono — and more than one setup can pass.',
  },
};

/* Lesson lines in comments only: ta.snd.* L13-L16 · ta.set.* L17-L18 ·
 * ta.mic.* L26-L49 · ta.place.* L51-L59 · ta.ctx.* L76-L83 · ta.two.* L67-L75 ·
 * ta.prac.* / ta.mix.* L115-L124. */
const scenarios: MikingScenario[] = [
  {
    id: 'ta.snd.1',
    page: 'sound',
    prompt: 'What does the black patch in the middle of the dayan’s head do?',
    options: ['Its weight lets the dayan ring with a clear pitch', 'It protects the skin from the player’s fingernails', 'It stops the head from ringing, for a dry sound'],
    correct: 'Its weight lets the dayan ring with a clear pitch',
    explain: 'The patch is built up in layers on the head. Its added weight changes how the head vibrates, so the dayan rings with a clear, pitched tone. The player tunes it — never the engineer.',
    why: {
      'It protects the skin from the player’s fingernails': 'Its job is musical: its weight changes how the head vibrates.',
      'It stops the head from ringing, for a dry sound': 'The opposite: the patch is what lets the dayan ring with a clear pitch. The damped strokes come from the hands.',
    },
  },
  {
    id: 'ta.snd.2',
    page: 'sound',
    prompt: 'Where does the bayan’s black patch sit?',
    options: ['Off-centre, unlike the dayan’s', 'In the middle, as on the dayan', 'Nowhere: the bayan’s head is plain'],
    correct: 'Off-centre, unlike the dayan’s',
    explain: 'On the bayan the patch sits off-centre — unlike the dayan’s centred patch. Do not copy one drum’s layout onto the other: look at the drum in front of you.',
    why: {
      'In the middle, as on the dayan': 'That is the dayan. The bayan’s patch is off-centre.',
      'Nowhere: the bayan’s head is plain': 'The bayan has a black patch too — off-centre, beside where the heel of the hand rests and presses.',
    },
  },
  {
    id: 'ta.snd.3',
    page: 'sound',
    prompt: 'The player presses the bayan’s head with the heel of the hand while it rings. What happens?',
    options: ['The pitch bends — it is part of the music', 'The drum mutes, so the next stroke is clear', 'Nothing a mic can pick up: it only feels different'],
    correct: 'The pitch bends — it is part of the music',
    explain: 'Pressing the head raises its tension, so the bayan’s pitch glides. The hand moves across the head all the time: a mic must never force the player to stop doing it.',
    why: {
      'The drum mutes, so the next stroke is clear': 'A press while it rings bends the pitch; damped strokes are a different gesture.',
      'Nothing a mic can pick up: it only feels different': 'The glide is clearly audible — one of the things the mic must keep.',
    },
  },
  {
    id: 'ta.set.1',
    page: 'setting',
    prompt: 'A microphone channel is labelled “right”. Which drum is it?',
    options: ['Check by the drum itself: the dayan or the bayan', 'The dayan, since it sits on the player’s right side', 'The bayan, since right is the audience’s view'],
    correct: 'Check by the drum itself: the dayan or the bayan',
    explain: 'Name each drum by what it is. “Right” can mean the player’s right or the audience’s, and some players set the drums the other way round.',
    why: {
      'The dayan, since it sits on the player’s right side': 'Often — but not always: some players set them the other way, and “right” depends on the viewpoint.',
      'The bayan, since right is the audience’s view': '“Right” depends on who is looking. Label channels by the drum.',
    },
  },
  {
    id: 'ta.set.2',
    page: 'setting',
    prompt: 'The dayan sounds a little dull to you. What do you do about the heads?',
    options: ['Nothing — tuning and the heads are the player’s', 'Wet the head slightly to brighten it up', 'Tap the tuning blocks down a little to raise its pitch'],
    correct: 'Nothing — tuning and the heads are the player’s',
    explain: 'Leave tuning and head treatment to the player. Move the mic, or ask the player what they want to hear — never alter the drum.',
    why: {
      'Wet the head slightly to brighten it up': 'Never wet, heat, tape or alter the heads. They are the player’s.',
      'Tap the tuning blocks down a little to raise its pitch': 'Tuning is the player’s job, not the engineer’s.',
    },
  },
  {
    id: 'ta.set.3',
    page: 'setting',
    prompt: 'Before any mic goes up, what do you ask the player to play?',
    options: ['Ringing, damped and open strokes, glides, and a real passage', 'Both drums struck together as hard as possible, for the gain', 'A single ringing stroke on the dayan, to judge its tone'],
    correct: 'Ringing, damped and open strokes, glides, and a real passage',
    explain: 'A short repeated passage with dayan ringing and damped strokes, bayan open tones and pressure glides, combined strokes and quiet finger work — in the player’s own terms. Hear it unamplified first.',
    why: {
      'Both drums struck together as hard as possible, for the gain': 'The loudest strokes matter for gain, but the quiet ones must survive too.',
      'A single ringing stroke on the dayan, to judge its tone': 'One stroke shows one corner of one drum. Hear the whole vocabulary on both.',
    },
  },
  {
    id: 'ta.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which drum’s player keeps moving the hand across the head?',
    options: ['The bayan’s, pressing to bend the pitch', 'The dayan’s, sliding to change the strokes', 'Neither: both hands stay on the black patches'],
    correct: 'The bayan’s, pressing to bend the pitch',
    explain: 'The heel of the hand presses and slides on the bayan to bend its pitch. A bayan mic needs room for that movement.',
    why: {
      'The dayan’s, sliding to change the strokes': 'The dayan’s fingers move between strokes, but the pressing glide is the bayan’s.',
      'Neither: both hands stay on the black patches': 'The hands move a lot — on the bayan, across the head while it rings.',
    },
  },
  {
    id: 'ta.mic.1',
    page: 'microphone',
    prompt: 'Does the bayan need a large-diaphragm mic for its low tones?',
    options: ['No — compare the whole response and the placement', 'Yes, small diaphragms cannot hear the low tones', 'Yes, unless you place the mic within a few centimetres'],
    correct: 'No — compare the whole response and the placement',
    explain: 'A small diaphragm does not mean weak lows, and a large one is not required for the bayan. Check the actual mic’s response and compare by ear.',
    why: {
      'Yes, small diaphragms cannot hear the low tones': 'Diaphragm size alone does not decide the low end. Check the response.',
      'Yes, unless you place the mic within a few centimetres': 'Moving closer changes the balance, but diaphragm size is not the rule.',
    },
  },
  {
    id: 'ta.mic.2',
    page: 'microphone',
    prompt: 'A clip that grips a drum’s metal hoop would hold a mic close to the dayan. Do you use it?',
    options: ['Not unless it is made for tabla and the player agrees', 'Yes, on the straps, where the clip cannot touch the head', 'Yes, as long as the clip is padded where it grips'],
    correct: 'Not unless it is made for tabla and the player agrees',
    explain: 'A drum-kit hoop clip must not be assumed safe on tabla straps, skin or a decorated shell. Use a low stand or a boom; a clip only when it is approved for the instrument and the player accepts it.',
    why: {
      'Yes, on the straps, where the clip cannot touch the head': 'The straps hold the tuning. A clip there can shift it — and it is not made for them.',
      'Yes, as long as the clip is padded where it grips': 'Padding does not make a hoop clip right for a tabla.',
    },
  },
  {
    id: 'ta.mic.3',
    page: 'microphone',
    prompt: 'Close in, the bayan sounds thicker. Is that always proximity effect?',
    options: ['Not necessarily — the target and the room can do it too', 'Yes, extra low end close in is proximity effect in each case', 'Yes, unless the mic you are using is a condenser'],
    correct: 'Not necessarily — the target and the room can do it too',
    explain: 'A directional mic can lift its lows close to a source, depending on the mic and the source; an omni has no such effect. A different target or a room resonance can also thicken the bayan.',
    why: {
      'Yes, extra low end close in is proximity effect in each case': 'A different target or a room resonance can change the lows too — and an omni has no proximity effect.',
      'Yes, unless the mic you are using is a condenser': 'Proximity effect depends on the pattern, not on whether the mic is a condenser.',
    },
  },
  {
    id: 'ta.mic.4',
    page: 'microphone',
    prompt: 'A small mic needs power through an adapter. Its connector looks like the one on your cable. What do you check?',
    options: ['The correct powering adapter for that mic, from its manual', 'Nothing: if the connector fits, the power is right', 'That phantom is switched off, since small mics do not need power'],
    correct: 'The correct powering adapter for that mic, from its manual',
    explain: 'Confirm the right powering adapter for a miniature mic — do not connect it on the look of the connector alone.',
    why: {
      'Nothing: if the connector fits, the power is right': 'Connectors that look alike can carry different power. Check the manual.',
      'That phantom is switched off, since small mics do not need power': 'Many small condensers do need power — through the right adapter.',
    },
  },
  {
    id: 'ta.place.1',
    page: 'placement',
    prompt: 'One mic, in front of and above the area between the heads. The dayan dominates. What do you try first?',
    options: ['Move the mic toward the bayan, in small steps', 'Turn the mic toward the bayan without moving it', 'Ask the player to play the dayan more softly'],
    correct: 'Move the mic toward the bayan, in small steps',
    explain: 'Move the capsule toward the weaker drum, or change its view in small steps. Turning in place can put one drum further off-axis — compare moving with only turning.',
    why: {
      'Turn the mic toward the bayan without moving it': 'Turning alone can put the dayan further off-axis without improving the bayan. Moving changes the view.',
      'Ask the player to play the dayan more softly': 'The player’s balance is the goal: move the mic.',
    },
  },
  {
    id: 'ta.place.2',
    page: 'placement',
    prompt: 'One mic per drum. Where on the head do you aim first?',
    options: ['Between the patch and the outer head, then one the player suggests', 'Right at the black patch, where the stroke lands', 'At the rim, where the brightest part of the sound leaves the head as well'],
    correct: 'Between the patch and the outer head, then one the player suggests',
    explain: 'Try a target between the loaded area and the outer playing area, then another chosen with the player. The patch, the rim or the centre is not the only useful source.',
    why: {
      'Right at the black patch, where the stroke lands': 'The patch is one area among several; try it as a comparison, not as the rule.',
      'At the rim, where the brightest part of the sound leaves the head as well': 'The rim is one area among several; aiming there can also bring the mic into the hand’s path.',
    },
  },
  {
    id: 'ta.place.3',
    page: 'placement',
    prompt: 'The bayan’s level jumps up and down during the glides. What do you check first?',
    options: ['Whether the hand blocks the capsule, or the drum moves', 'The compressor, to hold the level steady', 'The gain, turned down so the peaks of the glides stay low'],
    correct: 'Whether the hand blocks the capsule, or the drum moves',
    explain: 'Level changes during pitch glides often mean the moving hand shadows the mic, or the drum shifts. Move the mic so the player can perform naturally.',
    why: {
      'The compressor, to hold the level steady': 'Processing can hide a placement problem. Find the cause first.',
      'The gain, turned down so the peaks of the glides stay low': 'Less gain does not stop the hand blocking the mic.',
    },
  },
  {
    id: 'ta.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Placing a bayan mic, what must it leave room for?',
    options: ['The heel of the hand pressing and sliding across the head', 'The black patch, so that it can dry out between the strokes', 'The cloth ring, so the drum can rock freely on it'],
    correct: 'The heel of the hand pressing and sliding across the head',
    explain: 'The pressing glides are part of the music. The mic must never force the player to abandon them — or be knocked by them.',
    why: {
      'The black patch, so that it can dry out between the strokes': 'The patch is part of the head; the hand’s path is what a mic must clear.',
      'The cloth ring, so the drum can rock freely on it': 'The ring holds the drum steady; the hand’s movement is what to leave room for.',
    },
  },
  {
    id: 'ta.ctx.1',
    page: 'context',
    prompt: 'Live, the stage is so loud that the quiet strokes vanish. What do you do?',
    options: ['Talk about stage balance and positions with the players', 'Turn up the gain until the quiet strokes come back', 'Add a gate so that only the tabla’s own strokes come through'],
    correct: 'Talk about stage balance and positions with the players',
    explain: 'Raising gain alone does not solve a stage that is too loud. Keep desired sources close to their mics, give only the monitor level needed, and discuss the stage balance.',
    why: {
      'Turn up the gain until the quiet strokes come back': 'More gain raises the stage sound and the feedback risk with them.',
      'Add a gate so that only the tabla’s own strokes come through': 'A gate can cut the quiet strokes off entirely.',
    },
  },
  {
    id: 'ta.ctx.2',
    page: 'context',
    prompt: 'Your stage mic is a supercardioid. Where should the wedge NOT go?',
    options: ['Straight behind it — that pattern hears a little there', 'Toward its rear sides, where it rejects most of all', 'Anywhere except straight in front of the mic’s grille'],
    correct: 'Straight behind it — that pattern hears a little there',
    explain: 'A supercardioid rejects most toward the rear sides and has a small pickup directly behind. A narrower front pattern is not automatic protection from feedback: check the real pattern.',
    why: {
      'Toward its rear sides, where it rejects most of all': 'That is where it rejects MOST — a good place for a wedge.',
      'Anywhere except straight in front of the mic’s grille': 'A supercardioid still picks up well at its sides; only its rear sides reject strongly.',
    },
  },
  {
    id: 'ta.ctx.studio',
    page: 'context',
    prompt: 'Solo tabla in a good studio. When is a coincident stereo pair worth it?',
    options: ['When the room and the mix want a spatial picture', 'Whenever there are two drums to place left and right', 'In each session, because stereo hears more detail than mono'],
    correct: 'When the room and the mix want a spatial picture',
    explain: 'A coincident pair about 50–80 cm away gives a stereo view of the pair and some room. It is worth it only when stereo serves the music — not to spread the two drums hard left and right.',
    why: {
      'Whenever there are two drums to place left and right': 'Spreading the drums hard apart is not the aim; the pair is one instrument.',
      'In each session, because stereo hears more detail than mono': 'Stereo adds space, not detail — and it must still survive in mono.',
    },
  },
  {
    id: 'ta.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which drum rings with a clear pitch thanks to its centred black patch?',
    options: ['The dayan, the smaller wooden drum', 'The bayan, the larger kettle drum', 'Both drums, since both patches are centred'],
    correct: 'The dayan, the smaller wooden drum',
    explain: 'The dayan’s centred patch lets it ring with a clear pitch; the bayan’s patch is off-centre and its pitch is bent by the hand.',
    why: {
      'The bayan, the larger kettle drum': 'The bayan’s patch is off-centre; its pitch is bent by the hand.',
      'Both drums, since both patches are centred': 'Only the dayan’s patch is centred.',
    },
  },
  {
    id: 'ta.two.1',
    page: 'twoMic',
    prompt: 'You flip the bayan mic’s polarity. What happens to the arrival-time difference between the mics?',
    options: ['Nothing: polarity flips the sign; the delay stays', 'It drops to zero, so the two arrivals line up again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays',
    explain: 'Inverting a channel reverses its sign; it does not remove a difference in arrival time. No tabla mic has to be inverted by rule.',
    why: {
      'It drops to zero, so the two arrivals line up again': 'The mics are still at the same distances: the delay is unchanged.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only a mic’s position changes the delay.',
    },
  },
  {
    id: 'ta.two.2',
    page: 'twoMic',
    prompt: 'Why check the two tabla mics together, not only one at a time?',
    options: ['Each mic also hears the other drum', 'Each mic must be set to the same level', 'Two mics on one source cancel each other in mono'],
    correct: 'Each mic also hears the other drum',
    explain: 'The drums sit close together: each mic hears its own drum and some of the other. Angle and place them to reduce unwanted overlap, then judge the blend in mono.',
    why: {
      'Each mic must be set to the same level': 'Equal levels are not a goal: set the balance the player intends.',
      'Two mics on one source cancel each other in mono': 'They can colour each other, not always cancel. Judge the actual blend.',
    },
  },
  {
    id: 'ta.two.3',
    page: 'twoMic',
    prompt: 'Is one mic per drum the same as a coincident stereo pair?',
    options: ['No — each mic serves one drum; a coincident pair shares one spot', 'Yes, two mics on the pair make a stereo pair whatever their positions', 'Yes, as long as the two are panned hard apart'],
    correct: 'No — each mic serves one drum; a coincident pair shares one spot',
    explain: 'A coincident pair puts two directional capsules at one point, angled apart, for a stereo picture. Close mics on each drum are a different technique — and panning them is a separate decision.',
    why: {
      'Yes, two mics on the pair make a stereo pair whatever their positions': 'Two mics are not stereo by themselves; a coincident pair shares one point.',
      'Yes, as long as the two are panned hard apart': 'Panning is a separate decision — and spreading the drums hard apart is not the aim.',
    },
  },
  {
    id: 'ta.two.4',
    page: 'twoMic',
    prompt: 'Flipping the bayan mic makes one stroke louder in mono. Is that the right setting?',
    options: ['Not yet — compare across both drums, the glides and the whole passage', 'Yes, a louder stroke in mono means the pair is aligned', 'Yes — but only when the two mics are the same distance from their heads'],
    correct: 'Not yet — compare across both drums, the glides and the whole passage',
    explain: 'Keep the combination that holds up across the passage — dayan, bayan, combined strokes, glides and quiet work — not the one that makes one stroke loudest.',
    why: {
      'Yes, a louder stroke in mono means the pair is aligned': 'One stroke is not the passage. Several strokes must improve.',
      'Yes — but only when the two mics are the same distance from their heads': 'Equal distances are not proof of a good blend: each drum reaches each mic differently.',
    },
  },
  {
    id: 'ta.prac.gain',
    page: 'practice',
    prompt: 'Normal strokes sit well below the overload light, but the strongest passage lights it. What do you do?',
    options: ['Lower the input gain, or a pad its manual allows, then re-check', 'Pull the channel fader down until the loud strokes sound clean', 'Ask the player to keep the loudest passage a little softer'],
    correct: 'Lower the input gain, or a pad its manual allows, then re-check',
    explain: 'Find where it overloads and follow the mic or interface manual. A lower fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the loud strokes sound clean': 'The overload is at the input, before the fader; a lower fader only makes it quieter.',
      'Ask the player to keep the loudest passage a little softer': 'Set the gain for what the player intends to play.',
    },
  },
  {
    id: 'ta.prac.3',
    page: 'practice',
    prompt: 'What would justify one mic per drum instead of one shared mic?',
    options: ['The drums need separate balance or more isolation', 'Two drums need two microphones, one for each of them', 'The shared mic is not loud enough on its own'],
    correct: 'The drums need separate balance or more isolation',
    explain: 'Begin with the simplest setup that meets the goal. Use one mic per drum when they need different treatment or the shared mic hears too much spill.',
    why: {
      'Two drums need two microphones, one for each of them': 'One mic can serve the pair well in a quiet room. More mics must earn their place.',
      'The shared mic is not loud enough on its own': 'Level comes from gain, not from another mic.',
    },
  },
  {
    id: 'ta.mix.1',
    page: 'practice',
    prompt: 'The dayan sounds hard and clicky. What do you try before any EQ?',
    options: ['Another head target, angle or a little more distance', 'Ask the player to play the dayan with softer fingers', 'A high-pass filter set as for a kick drum'],
    correct: 'Another head target, angle or a little more distance',
    explain: 'Compare a different target, axis or distance. Keep the change only if the quiet and ringing strokes stay distinct.',
    why: {
      'Ask the player to play the dayan with softer fingers': 'The player’s sound is the goal: move the mic.',
      'A high-pass filter set as for a kick drum': 'A filter does not soften clicks — and never import another drum’s settings.',
    },
  },
  {
    id: 'ta.mix.2',
    page: 'practice',
    prompt: 'Live, your wedge sits about 120° off a supercardioid’s front. What can you expect?',
    options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits right in the null', 'More pickup than straight behind, where it rejects most'],
    correct: 'Strong rejection on paper; less in reality, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the wedge, because it sits right in the null': 'Real nulls are shallow, and shallowest in the lows.',
      'More pickup than straight behind, where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; it rejects most toward the rear sides.',
    },
  },
  {
    id: 'ta.mix.3',
    page: 'practice',
    prompt: 'The two drum mics sound hollow together. Which change removes the arrival-time difference?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning one mic up until it matches the other'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning one mic up until it matches the other': 'Level changes the depth of the notches, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.weak',
    observation: 'The bayan is weak',
    firstChecks: 'Shift the shared mic toward the bayan, or adjust its own channel and target.',
    options: ['Shift the shared mic toward it, or adjust its own mic', 'Boost the lows on its channel until the bayan comes forward', 'Ask the player to hit the bayan harder all through the set'],
    correct: 'Shift the shared mic toward it, or adjust its own mic',
    explain: 'Keep the change only if the glides and the overall pair stay convincing.',
    why: {
      'Boost the lows on its channel until the bayan comes forward': 'EQ thickens the dayan and the room too. Move the mic first.',
      'Ask the player to hit the bayan harder all through the set': 'The player’s balance is the goal: move the mic.',
    },
  },
  {
    id: 's.thick',
    observation: 'The bayan is too thick',
    firstChecks: 'Compare more distance, another target or less room support.',
    options: ['More distance, another target or less room mic', 'A large low cut fixed at a kick drum’s setting', 'Damp the bayan’s head so it rings less'],
    correct: 'More distance, another target or less room mic',
    explain: 'Keep the change only if the intended low tone is preserved.',
    why: {
      'A large low cut fixed at a kick drum’s setting': 'Never import a kick-drum setting; listen to what a filter removes from the bayan.',
      'Damp the bayan’s head so it rings less': 'The heads are the player’s: never alter them.',
    },
  },
  {
    id: 's.click',
    observation: 'The dayan is hard or too clicky',
    firstChecks: 'Compare a different head target, angle or greater distance.',
    options: ['Another target, angle or a little more distance', 'Cut the top end until the clicks soften', 'Ask the player to avoid the ringing strokes'],
    correct: 'Another target, angle or a little more distance',
    explain: 'Keep the change only if the quiet and ringing strokes stay distinct.',
    why: {
      'Cut the top end until the clicks soften': 'Placement first; EQ also dulls the ringing strokes you want to keep.',
      'Ask the player to avoid the ringing strokes': 'Ringing strokes are part of the music, never a defect.',
    },
  },
  {
    id: 's.quiet',
    observation: 'Quiet strokes disappear',
    firstChecks: 'Check the target, the spill and any dynamics processing.',
    options: ['Target, spill and any dynamics processing', 'A gate, so the quiet strokes come through clean', 'More gain until the quiet strokes return'],
    correct: 'Target, spill and any dynamics processing',
    explain: 'Keep the change only if the detail improves without overloading the loud strokes.',
    why: {
      'A gate, so the quiet strokes come through clean': 'A gate can cut quiet strokes off entirely.',
      'More gain until the quiet strokes return': 'More gain raises the spill too, and can overload the loud strokes.',
    },
  },
  {
    id: 's.hollow',
    observation: 'The two-channel blend is hollow',
    firstChecks: 'Test the relative level, position and polarity in mono.',
    options: ['Level, position and polarity — in mono, several strokes', 'Pan the two mics hard apart so that they do not mix together', 'Invert one mic and keep it that way from now on'],
    correct: 'Level, position and polarity — in mono, several strokes',
    explain: 'Keep the change only if several strokes improve, not just one.',
    why: {
      'Pan the two mics hard apart so that they do not mix together': 'Panning hides the problem in stereo; in mono it comes back.',
      'Invert one mic and keep it that way from now on': 'No polarity is correct by rule; compare both states.',
    },
  },
  {
    id: 's.ring',
    observation: 'Live ringing or too much spill',
    firstChecks: 'Lower the relevant send, then revisit the monitor and mic geometry.',
    options: ['Lower the send, then rethink the mic and monitor geometry', 'Keep the level and let the ring settle on its own', 'Turn the wedge up so the player can hear through the ringing'],
    correct: 'Lower the send, then rethink the mic and monitor geometry',
    explain: 'Reduce the send or output promptly, then correct the placement. Never sustain feedback.',
    why: {
      'Keep the level and let the ring settle on its own': 'Ringing grows; reduce the send at once.',
      'Turn the wedge up so the player can hear through the ringing': 'Louder monitors feed the ring: less margin, more feedback.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'ta.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a tabla setup in the order you would do them.',
    steps: [
      { text: 'Identify each drum, the player’s role and the balance they want; agree a passage', early: 'Start with the player and the two drums.' },
      { text: 'Set one shared mic from the audience side; check both hands’ full paths', early: 'Know the drums and the balance before placing a mic.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set gain on the strongest passage and check it is clean', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare two targets, then two distances — one change at a time', early: 'Compare once the level is safe, at matched loudness.' },
      { text: 'Try one mic per drum if needed; check the pair in mono', early: 'Get the simplest setup right first.' },
      { text: 'Ask the player which setup keeps their sound; log it', early: 'Decide last, with the player.' },
    ],
    explain: 'A sensible order: the drums and the player first, the simplest setup next, safe power and gain, one change at a time, a second mic only if it earns its place — and the player decides with you.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channels give the mics the power they need (phantom, or none)', role: 'required', feedback: 'Say how each mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the heads', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mics, stands and cables stay clear of both hands, the knees and the supports', role: 'required', feedback: 'Clearance is part of every passing setup — the bayan hand moves all the time.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers use on tabla', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the bayan the most low end', role: 'wrong', feedback: 'Low-end emphasis is not a passing reason — the player’s balance is.' };

const setupTasks: SetupTask[] = [
  {
    id: 'ta.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Solo tabla in a quiet studio with a good room; the player wants the quiet finger work to carry. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'One cardioid condenser about 30–50 cm in front of and above the area between the heads', ok: true, power: 'phantom', feedback: 'A simple shared picture of the pair; it has the phantom it needs.' },
      { id: 'b', label: 'A coincident cardioid pair about 50–80 cm from the pair, centred on it', ok: true, power: 'phantom', feedback: 'A stereo view with some room — check it in mono.' },
      { id: 'c', label: 'Two cardioid condensers, one per drum, about 15–25 cm from each head', ok: true, power: 'phantom', feedback: 'Separate control of each drum; check the overlap in mono.' },
      { id: 'd', label: 'A drum-kit hoop clip on each drum’s straps, mic over the black patch', ok: false, power: 'phantom', feedback: 'A hoop clip is not safe on tabla straps, and the mic sits in the hands’ path.' },
      { id: 'e', label: 'Two mics panned hard left and right to separate the drums', ok: false, power: 'phantom', feedback: 'Spreading the drums hard apart is not the aim — the pair is one instrument.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good quiet room, the room can add something useful', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point measured from the heads, both hands clear, and power that matches the mics.',
  },
  {
    id: 'ta.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with monitors; the tabla must carry over a band. Two spare inputs, both WITHOUT phantom power.',
    setups: [
      { id: 'a', label: 'Two directional dynamics, one per drum, close in and angled for separation', ok: true, power: 'none', feedback: 'Selective pickup for a loud stage; dynamics need no phantom.' },
      { id: 'b', label: 'One directional dynamic in front of and above the area between the heads', ok: true, power: 'none', feedback: 'Simple; check the balance between the drums and the quiet strokes.' },
      { id: 'c', label: 'Two cardioid condensers, one per drum', ok: false, power: 'phantom', feedback: 'A fair arrangement — but these inputs have no phantom power.' },
      { id: 'd', label: 'A coincident pair about 50–80 cm away for a stereo picture', ok: false, power: 'phantom', feedback: 'Far on a loud stage hears the band and the monitors — and these inputs have no phantom.' },
      { id: 'e', label: 'A dynamic right over the bayan’s patch, where the hand presses', ok: false, power: 'none', feedback: 'The pressing hand comes first: never in its way.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two dynamic setups pass. What passes is the reasoning: a sensible starting point, both hands clear, powered by what these inputs supply.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: which drum’s pitch can the player bend while it rings?', options: ['The bayan', 'The dayan', 'Neither'], after: 'Now STEP through the stroke (or PLAY ONCE) on each DRUM, then try PRESS on the bayan.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: one mic in front of the pair, the dayan dominates. What helps most?', options: ['Moving the mic toward the bayan', 'Only turning the mic toward the bayan', 'Moving it farther back'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this supercardioid reject the wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What are the two drums of the tabla?',
    options: ['The smaller dayan and the larger bayan', 'A high and a low drum of the same size', 'A drum and the frame that holds it up'],
    correct: 'The smaller dayan and the larger bayan',
    explain: 'The dayan (also dahina, or simply tabla) is the smaller, wooden drum; the bayan is the larger kettle-shaped one, metal or clay.',
    why: {
      'A high and a low drum of the same size': 'They differ in size, shape and material: a wooden dayan, a larger kettle bayan.',
      'A drum and the frame that holds it up': 'Both are drums; the cloth rings only steady them.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where is each drum’s black patch?',
    options: ['Centred on the dayan; off-centre on the bayan', 'Centred on both drums, as on the dayan', 'Off-centre on the dayan; centred on the bayan'],
    correct: 'Centred on the dayan; off-centre on the bayan',
    explain: 'The dayan’s patch is in the middle; the bayan’s sits off-centre.',
    why: {
      'Centred on both drums, as on the dayan': 'Only the dayan’s is centred; the bayan’s sits off-centre.',
      'Off-centre on the dayan; centred on the bayan': 'The other way round: centred on the dayan, off-centre on the bayan.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'How does the player bend the bayan’s pitch?',
    options: ['By pressing the head with the heel of the hand', 'By turning a tuning peg between the strokes', 'By striking the patch with more force'],
    correct: 'By pressing the head with the heel of the hand',
    explain: 'Pressing raises the head’s tension, so the pitch glides — the hand moves across the head all the time.',
    why: {
      'By turning a tuning peg between the strokes': 'There are no pegs; the glide comes from the hand pressing the head.',
      'By striking the patch with more force': 'A harder stroke is louder, not a glide. The glide is pressure.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'What lets the dayan ring with a clear pitch?',
    options: ['The weight of its centred black patch', 'Its metal body, ringing like a bell', 'The lacing, which vibrates with the head'],
    correct: 'The weight of its centred black patch',
    explain: 'The patch’s added weight changes how the head vibrates, giving the dayan its clear, pitched ring.',
    why: {
      'Its metal body, ringing like a bell': 'The dayan’s body is wood; the pitch comes from the patched head.',
      'The lacing, which vibrates with the head': 'The lacing holds the tuning; the patch shapes the pitch.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a mic near the bayan, what comes before every distance?',
    options: ['The hand’s full path as it presses and slides across the head', 'The exact distance that the recommended starting point gives you', 'The shortest cable run from the stand to the desk'],
    correct: 'The hand’s full path as it presses and slides across the head',
    explain: 'Hand clearance takes priority over every number. The bayan hand moves across the head all the time; a mic must never force the player to stop.',
    why: {
      'The exact distance that the recommended starting point gives you': 'The numbers are starting points; the hands’ clearance comes first.',
      'The shortest cable run from the stand to the desk': 'A tidy cable matters, but never before the player’s space.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about sitting near a loud stage through a long soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the stage stays below the mic’s rated level', 'It is safe as long as the mic sits closer than you do'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more.',
    why: {
      'It is safe for as long as the stage stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA over 8 hours.',
      'It is safe as long as the mic sits closer than you do': 'Where the mic sits says nothing about your ears.',
    },
  },
];

export const M13_LESSON: Lesson = {
  id: 'M13',
  labId: 'drums',
  title: 'Tabla',
  subtitle: 'Two drums, one instrument: the dayan and the bayan',
  noun: { one: 'tabla', many: 'tablas' },
  model: TABLA_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard'],
  zones: TABLA_ZONES,
  setupPairs: [{ label: 'A mic over each drum', A: { zone: 'ta.dayan.close', typeId: 'sdcCard' }, B: { zone: 'ta.bayan.close', typeId: 'sdcCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The tabla is a pair of hand drums played as one instrument: the smaller, wooden dayan (also called dahina, or simply tabla) and the larger, kettle-shaped bayan, of metal or clay.', src: 'MET-TABLA' },
    { title: 'WHERE YOU MEET IT', text: 'In Hindustani classical music — solo and accompanying voice and instruments — and in many other styles, on stage and in the studio. Look at the pair in front of you: sizes and materials vary.', src: 'MET-ESSAY' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Ringing and damped strokes on the dayan, open tones and pitch glides on the bayan, strokes on both together, and quiet finger work. Let the player name the strokes (bols), and agree how prominent the bayan should be.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'The pair drawn here: a dayan about 31 cm tall and 20 cm across, a bayan about 34 cm and 26 cm across (the largest extents of one museum pair). The player sits on the floor, the drums in cloth rings — a drawing choice; players differ.', src: 'MET-TABLA' },
  ],
  sound: {
    stages: [
      { title: 'A stroke lands', text: 'Fingers strike the dayan, or the bayan — or both at once. Some strokes ring; others are damped by the hand straight away.' },
      { title: 'The head moves', text: 'The head moves in the shapes the stroke can reach — drawn here much larger than it really moves. The black patch’s weight lets the dayan’s shapes ring together as a clear pitch.' },
      { title: 'The bayan glides', text: 'The heel of the hand presses the bayan’s head while it rings: the tension rises and the pitch bends. The hand moves across the head all the time.' },
      { title: 'Sound leaves', text: 'Sound leaves both heads, up and toward the audience; each drum is heard by any mic on the other. The bodies and the air inside shape how they ring.' },
    ],
    attack: 'The start of each stroke: the fingers’ brief contact. A mic close to a head tends to hear more of its attack — and more finger and contact sound.',
    body: 'The ring after the stroke: the dayan’s clear pitch, the bayan’s low tone and its glides. Both drums are heard by every mic. Tendencies only: pairs and players vary.',
    head: { diameterMm: 145, rods: 0, label: 'the dayan’s head, seen from above (drawing default: about 14.5 cm)', strikeSrc: 'MET-ESSAY' },
  },
  setting: {
    items: [
      { id: 'dayan', label: 'the dayan, on the player’s right here', short: 'DAYAN', note: 'The smaller drum, in its ring, tilted toward the audience a little. Some players set the drums the other way round: name each by what it is.', prov: { kind: 'illustrative', reason: 'a right-handed layout: a drawing default' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'bayan', label: 'the bayan, on the player’s left here', short: 'BAYAN', note: 'The larger drum. The heel of the hand presses and slides across its head: its whole path is the player’s space.', prov: { kind: 'illustrative', reason: 'a right-handed layout: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'player', label: 'the player, seated on the floor', short: 'PLAYER', note: 'Knees, supports and the way out stay clear. Low stands or booms from the audience side.', prov: { kind: 'illustrative', reason: 'a player seated on the floor: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'wedge', label: 'the player’s wedge', short: 'WEDGE', note: 'Live, a floor monitor downstage, facing back toward the player. Check the mic’s real pattern before placing it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'louder neighbours', short: 'BAND', note: 'Amplified instruments nearby — the reason to start close and directional, and to talk about stage balance.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Listen from here first, without amplification. The mics come from this side.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'MIC SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good studio, a coincident pair or a room mic can add space — when the music wants it.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors, louder neighbours and a PA. Start with the fewest mics that give the balance, only the monitor level the player needs, and check the mic’s real pattern before placing a wedge.',
    studio: 'STUDIO: time to compare one shared mic with one per drum, and a room that may add space — compare at matched loudness, and ask the player about the balance between the drums.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a given tabla, player and room, describe an alternative, and say why you chose your number of mics. With a real player’s agreement, log what you tried below.',
    fields: [
      { id: 'mic', label: 'Mics and patterns', kind: 'text' },
      { id: 'target', label: 'Targets, approximate distances and angles', kind: 'text' },
      { id: 'posture', label: 'The player’s seating and clearance', kind: 'text' },
      { id: 'gain', label: 'Input gain or pad', kind: 'text' },
      { id: 'balance', label: 'Dayan-to-bayan balance; quiet strokes; glides', kind: 'text' },
      { id: 'mono', label: 'Mono result and polarity', kind: 'text' },
      { id: 'notes', label: 'Monitoring, player feedback, your revision', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The heads’ diameters (dayan 145, bayan 230), the black patches’ sizes and the bayan patch’s offset toward the player: drawing defaults — the museum gives only the drums’ largest extents.', dims: [] },
    { text: 'The player’s seating, the layout (dayan on the right), the drums’ places, the support rings (60) and the tilts (15°, 10°): drawing defaults — a player’s check is needed.', dims: [] },
    { text: 'The hands’ reach, the body and the folded legs: ILLUSTRATIVE keep-outs for the owner to check.', dims: [] },
    { text: 'Only the close distance (3–4 in from the heads) has a source; every other tabla position is the lesson’s own trial.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s wedge, downstage, facing back toward the player', short: 'WEDGE', p: { x: 1400, y: 0, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'Downstage of the player, on the audience side — where a mic aimed back at the pair points its rear.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'side', label: 'a side-fill monitor across the stage', short: 'SIDE FILL', p: { x: 200, y: 0, z: 1500 }, lift: 150, faces: { x: 0, y: 0, z: -1 }, note: 'Off to the player’s right, roughly beside the mic’s front: no pattern’s null reaches it. Distance and level do the work.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Only the close distance comes from a real session; the other starting points are adapted from how microphones behave, and every pair, player and room is different. Move the mics, experiment, and trust your ears and the player. The lab is silent and draws a simplified picture: one pair, a seated layout the player may not use, head motion drawn larger, mic patterns as textbook shapes. Distances are rounded to about 5 mm and measured to the mic’s front. Keep clear of both hands.',
};
