/**
 * M01 KICK DRUM — the lesson's pages as DATA (blueprint §7). The words come
 * from the owner's lesson (docs/labs/miking/source_text/Kick-Drum-Miking-
 * Technique-Research.txt, cited "L<n>" in COMMENTS only — learner text names
 * a source in words) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md applied.
 *
 * House wording: tonal changes are TENDENCIES, never results; no audio (the
 * lab is fully silent); no invented curves; brands only as provenance.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { KICK_MODEL } from './geometry.ts';
import { KICK_DIMS, KICK_ZONES, L } from './model.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the kick drum',
    goal: 'Get to know the kick drum — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The beater strikes the batter head, on the player’s side; the front head faces the audience, with or without a port. Work with the drum as it is: never cut a port to match a diagram.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a strike becomes sound — the beater, the heads, the air inside — and where the sound leaves the drum. Shown, never played.',
    credit: { scenarios: ['k.snd.1', 'k.snd.2', 'k.snd.3'], interactive: 'soundPath', note: 'Step the strike through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Attack starts where the beater meets the batter head. The body — both heads, the air inside and the shell ringing together — leaves mostly through the front head and the port. A mic hears more of whichever it is closer to and faces: a tendency, and drums vary.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the kick’s neighbours on the kit, the player’s space, and what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['k.inst.1', 'k.inst.2', 'k.set.1'], note: 'Answer the three checks.' },
    takeaway: 'The pedal side is the player’s space: no stand, boom or cable goes through it. Live, monitors and spill shape the choice; in a studio the room may help. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for this drum by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['k.mic.1', 'k.mic.2', 'k.mic.3', 'k.mic.4', 'k.rec.1'], note: 'Answer the five checks (one reaches back to how the kick sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. No brand is required, no mic type is universally better, and a mic’s maximum SPL is never a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Place a mic in a documented zone, measured from its stated head, aimed as the source says, clear of every moving part.',
    credit: { scenarios: ['k.place.1', 'k.place.2', 'k.place.3', 'k.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different documented zones, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A documented zone is a starting point for its own product, measured from a named head. Distance, height and angle are separate variables — and clearance always wins.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces a loud unwanted source — and know what a pattern cannot do.',
    credit: { scenarios: ['k.ctx.1', 'k.ctx.2', 'k.ctx.studio', 'k.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the downstage wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most directly behind; a supercardioid has a rear lobe and rejects most off the rear axis. Real nulls are shallower than the ideal and shallowest in the lows. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['k.two.1', 'k.two.2', 'k.two.3', 'k.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Polarity flips the sign; it does not remove a delay. 3:1 is about mics on different sources; it does not make an inside/outside pair coherent. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — angle, clearance, gain staging, levels and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['k.prac.order', 'k.prac.gain', 'k.prac.setup1', 'k.prac.setup2', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real drum.' },
    takeaway: 'Safe placement, correct power and level checks, musical reasoning and an accurate account of polarity versus delay pass. A brand, a bass setting or a genre preset do not — and more than one setup can pass.',
  },
  sources: {
    title: 'Sources',
    goal: 'See where every number in this lesson comes from, what the sources disagree on, and what is still unknown.',
    credit: { scenarios: [], note: 'Credited when you move on from this page.' },
    takeaway: 'Manufacturer positions are documented starting points for particular products — not mandatory positions, and not predictions of another drum.',
  },
};

/*
 * THE CHECKS (reviews C1 / M2, 2026-10-04). Every item tests reasoning, not
 * recall of a brand or a number; every wrong option is a real misconception
 * of about the same length and form as the right one, and has its own
 * explanation (`why`). Lesson line refs live in these comments only:
 * k.inst.1 L7 · k.inst.2 L10 (NIOSH) · k.mic.* L11-L12, L15-L18 · k.place.*
 * L39-L40 · k.ctx.* L55-L69 · k.two.* L71-L72 · k.prac.* / k.mix.* L13,
 * L42-L49, L68, L72, L89.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'k.inst.1',
    page: 'setting',
    prompt: 'The drummer’s front head has no hole, and they want to keep it that way. What are your options?',
    options: ['Mic it from outside, or use an internal mic already properly installed', 'Cut a small port in the front head so a stand mic can reach inside the drum', 'Ask the drummer to swap in a ported head for the show before you start'],
    correct: 'Mic it from outside, or use an internal mic already properly installed',
    explain: 'With an intact front head, outside pickup is a normal option, and an appropriately installed internal mic is another. Never alter the instrument to match a diagram.',
    why: {
      'Cut a small port in the front head so a stand mic can reach inside the drum': 'Never alter the instrument to match a diagram. With an intact head, outside pickup is a normal option.',
      'Ask the drummer to swap in a ported head for the show before you start': 'The heads are the player’s choice, and the lesson works with the drum as it is. Outside pickup suits an intact head.',
    },
  },
  {
    id: 'k.inst.2',
    page: 'setting',
    prompt: 'Your kick mic is rated to 174 dB SPL. Does that tell you how long you can safely stand by the drum during soundcheck?',
    options: ['No — a mic’s max SPL is a distortion limit, not a hearing limit', 'Yes — anything below the mic’s rating is safe for the people next to it', 'Yes, if the mic is inside the drum and you are outside it'],
    correct: 'No — a mic’s max SPL is a distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. Hearing risk depends on the level where a person is and for how long: NIOSH recommends no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time.',
    why: {
      'Yes — anything below the mic’s rating is safe for the people next to it': 'Max SPL tells you when the mic distorts, not what your ears can take. NIOSH’s guideline is 85 dBA averaged over 8 hours.',
      'Yes, if the mic is inside the drum and you are outside it': 'A mic inside the drum is not a hearing meter. Measure where the person listens, and keep levels, repeats and time down.',
    },
  },
  {
    id: 'k.set.1',
    page: 'setting',
    prompt: 'You need a stand for a kick mic. Which space around the drum must its base, boom and cable stay out of?',
    options: ['The pedal, the player’s feet and the path to the throne', 'The front of the drum, so the audience can see the head', 'The area under the floor tom, where its legs stand'],
    correct: 'The pedal, the player’s feet and the path to the throne',
    explain: 'The pedal side is the player’s space, moving all the time. Route stands and cables away from the pedal’s action and the walking path, and stop the drummer before anything moves.',
    why: {
      'The front of the drum, so the audience can see the head': 'Outside the front head is a normal place for a kick mic. The space to protect is the player’s: pedal, feet and walking path.',
      'The area under the floor tom, where its legs stand': 'Neighbours need room too, but the space that moves all the time is the pedal and the player’s feet.',
    },
  },
  {
    id: 'k.snd.1',
    page: 'sound',
    prompt: 'Where does much of the kick’s resonance leave the drum?',
    options: ['Through the front head, and through the port if there is one', 'Mostly through the shell, since it is the largest surface of all', 'Only at the batter head, where the beater strikes it'],
    correct: 'Through the front head, and through the port if there is one',
    explain: 'Both heads, the air inside and the shell ring together; the front head and the port are where much of that resonance leaves the drum — which is why a mic toward the front head tends to hear more of it.',
    why: {
      'Mostly through the shell, since it is the largest surface of all': 'The shell shapes how long the drum rings, but the heads are what move the air most; much of the resonance leaves through the front head and the port.',
      'Only at the batter head, where the beater strikes it': 'The batter head radiates too (toward the player), but the air inside drives the front head, and the port lets air out: much of the resonance leaves there.',
    },
  },
  {
    id: 'k.snd.2',
    page: 'sound',
    prompt: 'The beater strikes the exact centre of the head. Which of the head’s vibration shapes can it set moving?',
    options: ['Only the ring-shaped ones; the rest have a still line there', 'All of them equally, because the whole of the head is struck', 'Only the shapes that have a still line across the centre'],
    correct: 'Only the ring-shaped ones; the rest have a still line there',
    explain: 'A strike sets a shape moving in proportion to how much the head moves at the strike point in that shape. Every shape with a still line across the head is still at the centre, so a centre strike drives only the ring-shaped ones.',
    why: {
      'All of them equally, because the whole of the head is struck': 'The beater touches one small spot. A shape is driven only as much as the head moves at that spot in that shape — not at all on a still line.',
      'Only the shapes that have a still line across the centre': 'The reverse: a still line through the centre means the head does not move there in that shape, so a centre strike cannot push it.',
    },
  },
  {
    id: 'k.snd.3',
    page: 'sound',
    prompt: 'Why can a mic placed at the port pick up a pop or a wind-like burst?',
    options: ['Air pushed out of the drum leaves through the port', 'The port narrows the beater’s click into a tight beam', 'The shell vibrates hardest right around the port'],
    correct: 'Air pushed out of the drum leaves through the port',
    explain: 'Each strike pushes the batter head in and squeezes the air inside; with a port, some of it rushes out there. DPA suggests adjusting the mic’s angle in the hole rather than pushing it farther in.',
    why: {
      'The port narrows the beater’s click into a tight beam': 'A pop or wind-like burst is moving air, not a focused click: the strike squeezes the air inside, and some leaves through the port.',
      'The shell vibrates hardest right around the port': 'The port is a hole in the front head, not part of the shell. The burst is air leaving the drum there.',
    },
  },
  {
    id: 'k.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic inside the drum, close to the batter head and facing it, hears more of which part of the sound?',
    options: ['The attack, where the beater meets the head', 'The ring that leaves through the front head', 'The shell wall, which carries the most sound'],
    correct: 'The attack, where the beater meets the head',
    explain: 'Attack starts where the beater meets the batter head, so a mic close to it and facing it tends to hear more attack — a tendency the guides document, and drums vary.',
    why: {
      'The ring that leaves through the front head': 'That is the body, which leaves mostly through the front head and port — a mic toward the front head hears more of it.',
      'The shell wall, which carries the most sound': 'The heads move the most air; the shell shapes how long the drum rings. Close to the batter head it is the attack you hear more of.',
    },
  },
  {
    id: 'k.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · You move the mic stand to reach a new zone. What must its base and cable stay clear of?',
    options: ['The pedal, the player’s feet and the walking path', 'The front hoop, so the audience can see the head', 'The floor tom, so the mic picks up fewer toms'],
    correct: 'The pedal, the player’s feet and the walking path',
    explain: 'The pedal side is the player’s space. Stop the drummer, move the stand, and route the cable away from the pedal’s action and the walking path.',
    why: {
      'The front hoop, so the audience can see the head': 'How the drum looks is not the safety question. The space that moves all the time is the pedal and the player’s feet.',
      'The floor tom, so the mic picks up fewer toms': 'Spill is a real concern, but the base and cable must first stay out of the player’s space: pedal, feet, path.',
    },
  },
  {
    id: 'k.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic just outside the front head hears more of which part of the sound?',
    options: ['The body leaving the front head and the port', 'The beater’s attack, straight from the struck head', 'Only the room, because the shell blocks the drum'],
    correct: 'The body leaving the front head and the port',
    explain: 'Much of the body leaves through the front head and the port, so an outside mic tends to hear more resonance — and, outside the drum, more of the kit and the room as well.',
    why: {
      'The beater’s attack, straight from the struck head': 'The attack starts at the batter head, on the far side of the drum from an outside mic: inside, close to the batter head, hears more of it.',
      'Only the room, because the shell blocks the drum': 'The front head itself radiates toward the mic, so it hears the drum — plus more of the room and the kit than an inside mic.',
    },
  },
  {
    id: 'k.mic.1',
    page: 'microphone',
    prompt: 'Two kick dynamics are both specified cardioid. You swap one for the other between soundchecks. What should you do?',
    options: ['Re-check the placement and the sound — same pattern, different response', 'Nothing — the same pattern means the same sound in the same spot', 'Move it closer, because a new mic will need more level to match the old one'],
    correct: 'Re-check the placement and the sound — same pattern, different response',
    explain: 'The pattern is one property. Kick dynamics have differently shaped frequency responses, so two cardioid kick mics are not interchangeable references.',
    why: {
      'Nothing — the same pattern means the same sound in the same spot': 'The pattern is only one property. Kick mics have differently shaped responses, so they are not interchangeable.',
      'Move it closer, because a new mic will need more level to match the old one': 'Nothing says the new mic needs to be closer. Change one variable at a time and judge at matched levels.',
    },
  },
  {
    id: 'k.mic.2',
    page: 'microphone',
    prompt: 'DPA recommends its flatter-response condenser for kick. What does that tell you?',
    options: ['It suits one tonal aim; it does not make condensers better in general', 'Condensers are the more accurate choice whatever the drum and the music', 'Dynamic kick mics are no longer a sound choice for this job'],
    correct: 'It suits one tonal aim; it does not make condensers better in general',
    explain: 'A flatter response is a particular aim. Do not claim every condenser is flat or every dynamic less detailed — and DPA’s view that dynamics cannot capture the natural sound is a maker’s judgement.',
    why: {
      'Condensers are the more accurate choice whatever the drum and the music': 'A flatter response is one aim, not a general rule. DPA’s view of dynamics is a maker’s judgement, not a tested comparison.',
      'Dynamic kick mics are no longer a sound choice for this job': 'Shure, Sennheiser and AKG all document dynamic kick mics. Different approaches serve different aims.',
    },
  },
  {
    id: 'k.mic.3',
    page: 'microphone',
    prompt: 'There is no room inside for a stand, and you want a mic resting on the pillow. Which mic may rest there?',
    options: ['Only one whose own manual allows it, such as a boundary plate made for it', 'A small mic, as long as its grille points up at the beater and stays still', 'A dynamic mic, because dynamics can take the level of a kick at close range'],
    correct: 'Only one whose own manual allows it, such as a boundary plate made for it',
    explain: 'The Beta 91A guide allows a pillow or cushioning surface. The Beta 52A guide says “Make sure microphone does not touch drum head or damping inside of the drum.” Do not assume another mic is approved.',
    why: {
      'A small mic, as long as its grille points up at the beater and stays still': 'Size and aim do not make it allowed. Only a mic whose own manual allows it rests on cushioning.',
      'A dynamic mic, because dynamics can take the level of a kick at close range': 'Level is not the question. The Beta 52A guide keeps that mic off the head and the damping.',
    },
  },
  {
    id: 'k.mic.4',
    page: 'microphone',
    prompt: 'The channel you have been given has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two kick dynamics: neither needs power to work', 'The boundary plate, since it rests inside the drum', 'The condenser, if you keep it at a distance from the head'],
    correct: 'The two kick dynamics: neither needs power to work',
    explain: 'Dynamic mics need no power. The boundary plate and the condenser are both condensers and need phantom power.',
    why: {
      'The boundary plate, since it rests inside the drum': 'Where it rests does not matter: the boundary plate is a condenser and needs phantom power.',
      'The condenser, if you keep it at a distance from the head': 'Distance does not change what a condenser needs: the cited example needs P48 phantom power.',
    },
  },
  {
    id: 'k.place.1',
    page: 'placement',
    prompt: 'A guide says 5 to 7.5 cm from the batter head. Your readout says 6 cm from the FRONT head. Are you in that zone?',
    options: ['No — the number only counts from the head the guide names', 'Yes — 6 cm falls inside the 5 to 7.5 cm band', 'Yes, as long as the mic is also pointed straight at the beater'],
    correct: 'No — the number only counts from the head the guide names',
    explain: 'A documented distance only means something with its reference head — which is why every readout here names it.',
    why: {
      'Yes — 6 cm falls inside the 5 to 7.5 cm band': 'Same number, wrong head. 6 cm from the front head is about 40 cm from the batter head on this drum.',
      'Yes, as long as the mic is also pointed straight at the beater': 'Aim is a separate variable. The distance must be measured from the head the guide names.',
    },
  },
  {
    id: 'k.place.2',
    page: 'placement',
    prompt: 'You move the mic from near the batter head toward the front head. What should you expect?',
    options: ['More of the drum’s resonance, as a tendency to check on this drum', 'A steady rise in low bass with each centimetre the mic moves inward', 'A fixed drop in attack, by an amount you can read off a chart'],
    correct: 'More of the drum’s resonance, as a tendency to check on this drum',
    explain: 'Shure and Sennheiser document that tendency, and DPA cautions that drums vary. Proximity effect and the surface a directional mic faces also matter.',
    why: {
      'A steady rise in low bass with each centimetre the mic moves inward': 'Proximity effect and the surface the mic faces change the lows too, so no move changes the bass one way every time.',
      'A fixed drop in attack, by an amount you can read off a chart': 'Guides document tendencies, not fixed amounts. Drums vary — check it on this drum.',
    },
  },
  {
    id: 'k.place.3',
    page: 'placement',
    prompt: 'A friend says: “The deeper into the drum, the more bass — every time.” What is the best reply?',
    options: ['Partly: near a head a directional mic boosts lows, but drums vary', 'Right — the inside of the drum is simply where all the bass is', 'Wrong — the outside of the front head is where the bass really is'],
    correct: 'Partly: near a head a directional mic boosts lows, but drums vary',
    explain: 'A directional mic close to a radiating head boosts its own lows (proximity effect). Which surface it faces, the mic and the drum all matter — check it.',
    why: {
      'Right — the inside of the drum is simply where all the bass is': 'The guide’s “maximum bass” row is close to the batter head: proximity effect, not a rule about depth.',
      'Wrong — the outside of the front head is where the bass really is': 'That is the same oversimplification the other way round. The surface faced, the mic and the drum all matter.',
    },
  },
  {
    id: 'k.ctx.1',
    page: 'context',
    prompt: 'Live, what can favour close, directional pickup on the kick?',
    options: ['Stage spill and the gain available before feedback', 'Directional mics give a louder kick than other types', 'The room sound is usually more useful on a stage'],
    correct: 'Stage spill and the gain available before feedback',
    explain: 'That is the lesson’s live column. In the studio, an outside or more distant perspective may help when the room contributes usefully.',
    why: {
      'Directional mics give a louder kick than other types': 'A pattern decides what a mic rejects, not how loud the kick is. The live reasons are spill and feedback margin.',
      'The room sound is usually more useful on a stage': 'That is the studio column: a more distant perspective helps when the room adds something useful.',
    },
  },
  {
    id: 'k.ctx.2',
    page: 'context',
    prompt: 'The wedge sits directly behind a supercardioid kick mic. Is that where it rejects most?',
    options: ['No — it hears a little behind; its nulls are off the rear axis', 'Yes — a directional mic rejects most of all directly at its back', 'Yes, as long as the mic is placed inside the drum, behind the head'],
    correct: 'No — it hears a little behind; its nulls are off the rear axis',
    explain: 'A supercardioid has a small rear pickup lobe; its deepest rejection is toward the rear but off the axis. Aim nulls by the actual pattern.',
    why: {
      'Yes — a directional mic rejects most of all directly at its back': 'Only a cardioid rejects most directly behind. A supercardioid has a small rear lobe.',
      'Yes, as long as the mic is placed inside the drum, behind the head': 'Inside, the shell shields the mic, but that does not move the pattern’s nulls.',
    },
  },
  {
    id: 'k.ctx.studio',
    page: 'context',
    prompt: 'Studio session, no wedge, a good-sounding room. What could justify moving the mic from inside to outside the front head?',
    options: ['The room adds something useful to the kick in this session', 'An outside mic will pick up a louder kick than an inside one', 'Outside, it removes the spill from the rest of the kit'],
    correct: 'The room adds something useful to the kick in this session',
    explain: 'That is the lesson’s studio column: an outside or more distant perspective may help when the room contributes usefully — checked by ear, at matched levels.',
    why: {
      'An outside mic will pick up a louder kick than an inside one': 'Sometimes it does, sometimes not (DPA) — and louder is not a reason to choose a position.',
      'Outside, it removes the spill from the rest of the kit': 'The reverse: outside the drum, the kit around it is heard more.',
    },
  },
  {
    id: 'k.two.1',
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity inversion reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still the same distance apart.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'k.two.2',
    page: 'twoMic',
    prompt: 'Two mics hear the beater 1 ms apart. Summed at equal level, same polarity: where is the first notch (ideal model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  },
  {
    id: 'k.two.3',
    page: 'twoMic',
    prompt: 'Does a 3:1 spacing make an inside/outside pair on one kick phase-coherent?',
    options: ['No: 3:1 is about separate sources; judge this pair in mono', 'Yes, once the outside mic is three times farther away', 'Yes, provided that both mics share the same cardioid pattern'],
    correct: 'No: 3:1 is about separate sources; judge this pair in mono',
    explain: '3:1 can reduce interacting pickup between mics on different sources. An inside/outside pair aims at different surfaces of ONE source, so it guarantees nothing.',
    why: {
      'Yes, once the outside mic is three times farther away': '3:1 is about spill between mics on DIFFERENT sources. This pair hears one source, so the ratio guarantees nothing.',
      'Yes, provided that both mics share the same cardioid pattern': 'Matching patterns does not line up arrival times. Judge the pair in mono, in both polarity states.',
    },
  },
  {
    id: 'k.two.4',
    page: 'twoMic',
    prompt: 'You flip B’s polarity and the kick suddenly sounds bigger; the sum reads 3 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states again in mono', 'Inverted is the better setting, so keep it that way for the whole show', 'Normal polarity was wrong, because it was quieter'],
    correct: 'Not yet: match the levels, then compare both states again in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono and with the kit, before you decide.',
    why: {
      'Inverted is the better setting, so keep it that way for the whole show': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was quieter': 'Quieter is not wrong. Match levels, then judge which state keeps the body of the kick.',
    },
  },
  {
    id: 'k.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the drummer’s hardest accents light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loudest accents sound clean', 'Ask the drummer to hit the accents a little softer during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest intended strokes and watch the overload indicator. A lowered fader does not undo clipping at the input; use a pad only as the manual permits.',
    why: {
      'Pull the channel fader down until the loudest accents sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the drummer to hit the accents a little softer during the show': 'Set gain for the strongest strokes the player intends to play — not for a gentler soundcheck.',
    },
  },
  {
    id: 'k.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second kick channel?',
    options: ['Each mic works alone, the pair adds something, it holds up in mono', 'Two channels give the mix engineer more to work with later on', 'The kick needs more level in the front-of-house mix than one mic gives'],
    correct: 'Each mic works alone, the pair adds something, it holds up in mono',
    explain: 'Shure’s two-mic method blends different perspectives. If the pair loses body or becomes uneven, adjust position and level — or leave the second mic out.',
    why: {
      'Two channels give the mix engineer more to work with later on': 'More channels also add spill and interactions. A second mic must earn its place in the combined sound.',
      'The kick needs more level in the front-of-house mix than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'k.mix.1',
    page: 'practice',
    prompt: 'You read “20 to 30 cm” in a guide. Before you place the mic, what else must you know?',
    options: ['Which head it is measured from, and how the mic should be aimed', 'The brand of the drum, so the number matches its size', 'Nothing more: the number already tells you exactly where the mic goes'],
    correct: 'Which head it is measured from, and how the mic should be aimed',
    explain: 'A documented distance belongs to its named head; the row may also name an orientation (“on-axis with beater”). Clearance is a separate check again.',
    why: {
      'The brand of the drum, so the number matches its size': 'A guide’s distance belongs to its product and its named head; the drum’s brand does not change that.',
      'Nothing more: the number already tells you exactly where the mic goes': 'A distance means nothing without its reference head; aim and clearance are separate checks.',
    },
  },
  {
    id: 'k.mix.2',
    page: 'practice',
    prompt: 'Your monitor sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; in reality less, and least in the lows', 'Silence from the monitor, because it sits in the null', 'More pickup than straight behind, which is where it rejects the most'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'An ideal null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the monitor, because it sits in the null': 'An ideal null is infinitely deep only on paper. Real mics reject far less, and least in the lows.',
      'More pickup than straight behind, which is where it rejects the most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'k.mix.3',
    page: 'practice',
    prompt: 'Two kick mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.port',
    observation: 'Sharp bursts at the port',
    firstChecks: 'Microphone angle and position relative to escaping air; then physical clearance.',
    src: 'DPA-KICK',
    options: ['Its angle and position against the escaping air, then clearance', 'Push the mic farther into the port so the air no longer reaches it', 'Swap the cable first, since sharp bursts usually sound electrical'],
    correct: 'Its angle and position against the escaping air, then clearance',
    explain: 'DPA: port wind/pop “can be dealt with by simply adjusting the angle of the microphone in the hole.” Never push in farther if it narrows clearance.',
    why: {
      'Push the mic farther into the port so the air no longer reaches it': 'Never push farther in if it narrows the clearance. Adjusting the mic’s angle in the hole often deals with it.',
      'Swap the cable first, since sharp bursts usually sound electrical': 'Test the air first: port wind is a known cause. Rule it out before blaming the cable.',
    },
  },
  {
    id: 's.blend',
    observation: 'Weak or inconsistent sound when two channels are combined',
    firstChecks: 'Relative levels, mono blend, both polarity states, positions, and the overhead or other open microphones.',
    options: ['Levels, the mono blend, both polarity states and other open mics', 'Turn both channels up together until the kick sounds full and solid', 'Invert the inside mic, since that one is usually the wrong one'],
    correct: 'Levels, the mono blend, both polarity states and other open mics',
    explain: 'The pair must be evaluated together, including the overheads and other open mics.',
    why: {
      'Turn both channels up together until the kick sounds full and solid': 'More level does not fix a cancellation; it makes the thin sound louder. Check the pair together first.',
      'Invert the inside mic, since that one is usually the wrong one': 'Neither mic is “usually wrong”. Compare BOTH polarity states at matched level, in mono.',
    },
  },
  {
    id: 's.dist',
    observation: 'Distortion',
    firstChecks: 'Determine whether it starts in the mic, preamp or interface, or at a rattling part of the drum or stand; lower gain where appropriate before changing tonal controls.',
    options: ['Where it starts — mic, preamp, interface or a rattle — then gain', 'Pull the channel fader down until the distorted hits sound cleaner', 'Cut the low end with EQ so the channel has more headroom left'],
    correct: 'Where it starts — mic, preamp, interface or a rattle — then gain',
    explain: 'A lowered fader does not undo earlier clipping, and attenuation after an overloaded capsule cannot restore its sound.',
    why: {
      'Pull the channel fader down until the distorted hits sound cleaner': 'The fader comes after the preamp; if the preamp already clipped, a lower fader just makes the distortion quieter.',
      'Cut the low end with EQ so the channel has more headroom left': 'EQ after the input cannot undo clipping at the input. Find where it starts, and lower gain there first.',
    },
  },
  {
    id: 's.solo',
    observation: 'Attractive solo sound but unclear band sound',
    firstChecks: 'Reevaluate its role against the bass and the rest of the kit at comparable monitoring level.',
    options: ['Its role against the bass and the kit, at a comparable level', 'Solo it again at a higher level to hear what it is doing properly', 'Try another brand of kick mic before anything else'],
    correct: 'Its role against the bass and the kit, at a comparable level',
    explain: 'Keep comparison levels similar so louder does not win automatically, and judge the kick in the band.',
    why: {
      'Solo it again at a higher level to hear what it is doing properly': 'Solo and louder tells you least about the band. Judge it with the bass and kit at similar levels.',
      'Try another brand of kick mic before anything else': 'No brand is required. First judge the channel’s role in context, then its position.',
    },
  },
  {
    id: 's.spill',
    observation: 'Unwanted kit or stage spill',
    firstChecks: 'Reevaluate distance, aiming, actual polar pattern, and whether a second microphone is necessary.',
    options: ['Distance, aim, the actual pattern, and whether two mics are needed', 'Add another mic in closer, so that the kick drowns out the spill', 'Turn the monitors up so that the drummer hears less of the spill'],
    correct: 'Distance, aim, the actual pattern, and whether two mics are needed',
    explain: 'Aim nulls by the actual pattern, and open only the mics you need — extra channels add spill.',
    why: {
      'Add another mic in closer, so that the kick drowns out the spill': 'Extra open mics add spill and interactions. Open only the mics you need.',
      'Turn the monitors up so that the drummer hears less of the spill': 'Louder monitors put more sound on stage — more spill, and less margin before feedback.',
    },
  },
  {
    id: 's.contact',
    observation: 'Movement or contact risk',
    firstChecks: 'Stop the drummer, remount and reroute; do not continue the exercise until clearance is restored.',
    options: ['Stop the drummer, remount and reroute; go on once clearance is back', 'Keep going carefully, and fix the mount once the song is over', 'Tape the cable to the pedal itself so it cannot move during the song'],
    correct: 'Stop the drummer, remount and reroute; go on once clearance is back',
    explain: 'Clearance always comes first: have the drummer stop before any mic moves.',
    why: {
      'Keep going carefully, and fix the mount once the song is over': 'Clearance comes first: have the drummer stop before any mic moves.',
      'Tape the cable to the pedal itself so it cannot move during the song': 'The pedal moves. Route and secure the cable AWAY from the pedal and walking paths.',
    },
  },
];

/** The lesson's one-mic setup procedure (L42-L49), with L12-L13's power and gain rules. */
const orderTasks: OrderTask[] = [
  {
    id: 'k.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: front head intact or ported, and what should the kick do?', early: 'Start with the player and the drum.' },
      { text: 'Choose a mic whose specs and mount suit the drum and the show', early: 'Choose the mic once you know the drum and the sound the player wants.' },
      { text: 'Have the drummer stop; mount the mic; check clearance and the cable path', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on typical AND strongest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Keep the simplest position that works, with safe clearance', early: 'Decide last, after comparing.' },
    ],
    explain: 'That is the lesson’s order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow the actual equipment manual. Gain: set it with headroom for the strongest strokes, watching the overload indicator.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a documented starting point for this kind of mic, from its named head', role: 'required', feedback: 'Say where the position comes from and which head it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of heads, beater, damping and pedal', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on a kick', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position on the drum', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position always gives the most bass.' };

/** The final task (L89): several setups pass; the reasons are what is checked. */
const setupTasks: SetupTask[] = [
  {
    id: 'k.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · An existing port in the front head. A loud club show; the drummer wants a defined attack. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'Supercardioid kick dynamic inside, 5 to 7.5 cm from the batter head, slightly off the beater line', ok: true, power: 'none', feedback: 'A documented starting point (Beta 52A guide), close and directional for a loud stage; attack is its tendency.' },
      { id: 'b', label: 'Boundary plate resting on the pillow, 25 to 152 mm from the batter head, grille uncovered', ok: true, power: 'phantom', feedback: 'Documented by its own manual (Beta 91A guide), low profile inside; it needs the phantom power this channel has.' },
      { id: 'c', label: 'Supercardioid kick dynamic inside, 20 to 30 cm from the batter head, on the beater line', ok: true, power: 'none', feedback: 'Documented (Beta 52A guide): medium attack, balanced — defensible if the whole assembly clears the port edge and damping.' },
      { id: 'd', label: 'Small condenser laid on the pillow inside, so that it cannot move about', ok: false, power: 'phantom', feedback: 'Only a mic whose own manual allows it may rest on cushioning — this one’s does not.' },
      { id: 'e', label: 'Kick dynamic touching the batter head, to get the most attack possible', ok: false, power: 'none', feedback: 'A mic must never touch a head: it is a moving part.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against spill and feedback on stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a documented starting point from its named head, clearance, and power that matches the mic.',
  },
  {
    id: 'k.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Studio session. The front head is intact, and the drummer wants to keep it. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Cardioid kick dynamic outside, at the level of the front head', ok: true, power: 'none', feedback: 'Documented (e 902 manual): a more resonant tendency; a dynamic needs no phantom.' },
      { id: 'b', label: 'Supercardioid kick dynamic just outside, near the edge of the front head', ok: true, power: 'none', feedback: 'DPA documents outside pickup for unported drums, and a dynamic needs no phantom.' },
      { id: 'c', label: 'Condenser just outside the front head, near its edge', ok: false, power: 'phantom', feedback: 'Outside suits an intact head, but this input has no phantom power and a condenser needs it.' },
      { id: 'd', label: 'Boundary plate resting on the pillow inside the drum', ok: false, power: 'phantom', feedback: 'There is no way in without taking the head off — and this input has no phantom power.' },
      { id: 'e', label: 'Cut a small port so a kick dynamic can go inside', ok: false, power: 'none', feedback: 'Never alter the instrument to match a diagram.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'Outside, the room and the head’s ring can add something useful', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two outside positions pass. What passes is the reasoning: documented, clear, and powered by what this input can supply.',
  },
];

/** One ungraded prediction before each rack activity (try before tell). */
const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the beater pushes the batter head into the drum, what does the FRONT head do?', options: ['It moves outward, away from the player', 'It moves inward, toward the beater', 'It stays still — only the struck head moves'], after: 'Now STEP through the strike (or PLAY ONCE) and watch both heads.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch IDEAL PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from near the batter head toward the front head. What changes?', options: ['More attack', 'More resonance', 'It depends on this drum'], after: 'Rest the mic in two zones and read each zone’s tendency.' },
  context: { prompt: 'Where will this supercardioid reject the downstage wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/*
 * THE QUICK CHECK (experienced path, LESSON_JOURNEY §2.5): 6 items, two per
 * foundation page; q.6 (hearing) is critical. Pass = 5 of 6 on the first
 * pick with q.6 right. It opens the activities; it credits NOTHING.
 */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which head does the kick pedal’s beater strike?',
    options: ['The batter head, on the player’s side', 'The front head, on the audience side', 'Either one, depending on how the pedal is set'],
    correct: 'The batter head, on the player’s side',
    explain: 'The pedal sits on the player’s side and drives the beater into the batter head; the front (resonant) head faces the audience.',
    why: {
      'The front head, on the audience side': 'The front head faces the audience and is not struck; the pedal drives the beater into the batter head on the player’s side.',
      'Either one, depending on how the pedal is set': 'The pedal clamps to the batter hoop on the player’s side; its beater strikes the batter head.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What do the two spurs on the sides of the shell do?',
    options: ['Keep the drum from creeping forward as it is played', 'Hold the front head’s hoop tight against the end of the shell', 'Lift the drum so that the port clears the floor'],
    correct: 'Keep the drum from creeping forward as it is played',
    explain: 'Yamaha: legs or “spurs” attached to each side of the shell keep the drum from creeping. The hoops are held by claws and tension rods.',
    why: {
      'Hold the front head’s hoop tight against the end of the shell': 'Claws and tension rods hold the hoops. The spurs are legs that keep the drum from creeping.',
      'Lift the drum so that the port clears the floor': 'The port is in the front head, well clear of the floor; the spurs keep the drum from creeping forward.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A strike exactly at the centre of a drumhead drives which of its vibration shapes?',
    options: ['Only the ring-shaped ones — the rest are still there', 'All of the shapes, each one just as hard', 'Only the shapes split by a line through the centre'],
    correct: 'Only the ring-shaped ones — the rest are still there',
    explain: 'A strike drives a shape only as much as the head moves at the strike point in that shape; a shape with a still line through the centre does not move there.',
    why: {
      'All of the shapes, each one just as hard': 'The beater touches one spot. A shape is driven only as much as the head moves at that spot — not at all on a still line.',
      'Only the shapes split by a line through the centre': 'The reverse: those shapes are still at the centre, so a centre strike cannot drive them.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The beater pushes the batter head into the drum. What does the air inside do to the front head?',
    options: ['Pushes it outward, away from the player', 'Pulls it inward, toward the beater', 'Nothing — the air escapes through the shell'],
    correct: 'Pushes it outward, away from the player',
    explain: 'The batter head squeezes the air inside, and the air pushes the front head outward: the two heads are coupled through the air (with a port, some air also rushes out).',
    why: {
      'Pulls it inward, toward the beater': 'The batter head moving in squeezes the air; squeezed air pushes on the front head, so it moves outward.',
      'Nothing — the air escapes through the shell': 'The shell is closed wood. The air is squeezed and pushes the front head outward; only a port lets some out.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where should the cable for a kick mic run?',
    options: ['Away from the pedal and the player’s walking path', 'Along the pedal, taped down so that it cannot move', 'Under the batter hoop, close to the beater'],
    correct: 'Away from the pedal and the player’s walking path',
    explain: 'Route and secure cables so they do not snag a pedal or a walking path — the pedal side is the player’s space and moves all the time.',
    why: {
      'Along the pedal, taped down so that it cannot move': 'The pedal moves with every stroke. Keep the cable away from its action, not taped to it.',
      'Under the batter hoop, close to the beater': 'That is where the pedal and the beater work. Route the cable away from the player’s side.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'The kick mic is rated to 174 dB SPL. What does that tell you about standing by the drum through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the drum stays below the mic’s 174 dB', 'It is safe as long as the mic itself is inside the drum'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, NIOSH recommends no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the drum stays below the mic’s 174 dB': 'A mic rating is not a hearing limit. NIOSH’s guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic itself is inside the drum': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

export const M01_LESSON: Lesson = {
  id: 'M01',
  labId: 'drums',
  title: 'Kick Drum',
  subtitle: 'Bass drum: inside, outside, one mic or two',
  noun: { one: 'kick', many: 'kicks' },
  model: KICK_MODEL,
  micTypeIds: ['kickDynSuper', 'kickDynCard', 'boundaryHalf', 'sdc'],
  zones: KICK_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The kick, or bass drum, is the drum of a kit that lies on its side on the floor. A foot pedal swings a beater into the head facing the player — the batter head. The other head, facing the audience, is the front (resonant) head.', src: 'DW-9000' },
    { title: 'WHERE YOU MEET IT', text: 'In drum kits across most band music, on stage and in the studio. Yamaha calls 22 and 24 inch drums “standard for just about every other genre of music”. This lesson covers both studio recording and live sound.', src: 'YMH-HUB' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'A supportive pulse, a defined attack, a resonant note — or a mix of these. Which one the player wants decides a lot about the mic and its position, so ask before you start.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'Kit bass drums come in “diameters ranging from 18 to 26 inches, with average depths from 14 to 18 inches” (Yamaha). This lab draws a 22 × 18 in drum from maker dimensions; the parts with no source are drawn ILLUSTRATIVE.', src: 'YMH-HUB' },
  ],
  sound: {
    stages: [
      { title: 'The beater strikes', text: 'The pedal swings the beater into the batter head, on the player’s side. That brief contact is where the ATTACK — the start of the sound — begins.' },
      { title: 'The batter head is pushed in', text: 'The head bows into the drum — most at the centre, not at all at the hoop: its lowest vibration shape, drawn here many times larger than it really moves. Then it springs back and rings.' },
      { title: 'The air pushes the front head', text: 'The batter head squeezes the air inside, and the air pushes the front head outward. The two heads are coupled through the air.', ported: 'The batter head squeezes the air inside; the air pushes the front head outward — and some of it rushes out through the port. That moving air is what can pop a mic placed at the port.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from both heads — the front head toward the audience, the batter head toward the player. The heads, the air and the shell ringing together are the BODY of the sound; the shell, the tuning and any damping shape how long it rings.', ported: 'Sound leaves from both heads and from the port — the front head and port toward the audience, the batter head toward the player. The heads, the air and the shell ringing together are the BODY of the sound; the shell, the tuning and any damping shape how long it rings.' },
    ],
    attack: 'ATTACK — the start of the sound: the beater’s brief contact with the batter head. It begins at the strike, so a mic close to the batter head and facing it tends to hear more of it.',
    body: 'BODY (resonance) — the heads, the air inside and the shell ringing together after the strike. Much of it leaves through the front head and the port, so a mic toward the front head tends to hear more of it. Both are tendencies the guides document, and drums vary. Tuning and damping change how long the drum rings — the Drum Tuning Lab covers that.',
    head: { diameterMm: 22 * 25.4, rods: 10, label: '22 in batter head, seen from the player’s side', strikeSrc: 'DW-9000' },
  },
  setting: {
    items: [
      { id: 'kick', label: 'the kick drum (cut open, as on every page)', short: 'KICK', note: 'Lying on its side, the front head toward the audience. The same drawing as every other page of this lesson.', prov: { kind: 'sourced', src: 'YMH-RC', quote: 'RBB-2218 22"×18"' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'pedal', label: 'bass drum pedal', short: 'PEDAL', note: 'Clamped to the batter hoop. Its footboard, beater and the player’s right foot move with every stroke: stands, booms and cables stay clear of its action.', prov: { kind: 'illustrative', reason: 'no source gives pedal dimensions' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'throne', label: 'drum throne (the player’s seat)', short: 'THRONE', note: 'The space between the throne, the pedals and the drum is the player’s. Nothing of yours goes through it, and the walking path to the throne stays clear.', prov: { kind: 'illustrative', reason: 'a typical right-handed layout; no source gives positions' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'hihat', label: 'hi-hat (left foot)', short: 'HI-HAT', note: 'Played with the left foot and the sticks, to the player’s left. A loud neighbour: a mic outside the drum hears more of the kit around it than one inside.', prov: { kind: 'illustrative', reason: 'a typical right-handed layout; no source gives positions' }, tag: 'SPILL', scene: 'kit' },
      { id: 'snare', label: 'snare drum', short: 'SNARE', note: 'Between the player’s knees, just above the pedal side — a loud neighbour close to the batter side of the kick.', prov: { kind: 'illustrative', reason: 'a typical right-handed layout; no source gives positions' }, tag: 'SPILL', scene: 'kit' },
      { id: 'tom', label: 'rack tom (mounted above the kick)', short: 'RACK TOM', note: 'Often mounted on or above the kick. Its mount takes room over the shell: a boom’s path has to go around it.', prov: { kind: 'illustrative', reason: 'a typical layout; no source gives positions' }, tag: 'BOOM PATH', scene: 'kit' },
      { id: 'floor', label: 'floor tom', short: 'FLOOR TOM', note: 'On the player’s right. Another neighbour a kick mic can hear.', prov: { kind: 'illustrative', reason: 'a typical right-handed layout; no source gives positions' }, tag: 'SPILL', scene: 'kit' },
      { id: 'fill', label: 'the drummer’s fill (monitor)', short: 'DRUM FILL', note: 'A floor monitor beside the throne so the drummer can hear the band. It sits on the drummer’s side of the kick — you will see later why no pattern rejects it there.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'downstage', label: 'a downstage wedge (another player’s monitor)', short: 'WEDGE', note: 'On the audience side of the kick, facing back toward the stage. A loud source an outside kick mic can face away from.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'The front head faces the audience. Live, the PA adds to the kick the audience already hears from the drum itself.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges on the floor, and the room itself can add something useful — one reason a more distant or outside mic may help.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the stage is loud. Stage spill and the gain available before feedback push toward close, directional pickup.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the drummer stops, and the room may contribute usefully — an outside or more distant mic may help.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given drum and performance, describe an alternative position, and explain what would justify a second channel. With a real drum and the drummer’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drum (size, heads, damping)', kind: 'text' },
      { id: 'head', label: 'Front head', kind: 'choice', choices: ['intact', 'ported'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['kick dynamic, supercardioid', 'kick dynamic, cardioid', 'boundary on cushioning', 'condenser', 'other'] },
      { id: 'pattern', label: 'Pattern (from its own spec)', kind: 'text' },
      { id: 'zone', label: 'Starting position and its source', kind: 'text' },
      { id: 'distance', label: 'Distance, from which head', kind: 'text' },
      { id: 'aim', label: 'Aim', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  sources: [
    { key: 'DPA-KICK', label: '[1] DPA Microphones, Bo Brinck, “How to mic a kick (bass) drum”', url: 'https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-kick-drum/', checked: '2026-10-04' },
    { key: 'S-B52-UG', label: '[2] Shure, BETA52A User Guide, version 3.1 (2023-I)', url: 'https://pubs.shure.com/view/guide/BETA52A/en-US.pdf', checked: '2026-10-04' },
    { key: 'SN-902-2019', label: '[3] Sennheiser, e 902 Instruction Manual (01/2019) — the lesson’s link is dead; archived copy', url: 'https://web.archive.org/web/20240530010343/https://www.sennheiser.com/globalassets/digizuite/40681-en-e902_manual_01_2019_en.pdf', checked: '2026-10-04', note: 'The current online manual (v1.3, 04/2026) keeps Positions A/B/C but drops the “turn away from where the beater strikes” sentence.' },
    { key: 'SN-902-DOC', label: '[3, current] Sennheiser e 902 online manual, Operation (v1.3, 04/2026)', url: 'https://docs.cloud.sennheiser.com/en-us/evolution-wired/manual-e902-using.html', checked: '2026-10-04' },
    { key: 'S-B91-UG', label: '[4] Shure, BETA91A User Guide, version 3.1 (2021-B)', url: 'https://pubs.shure.com/view/guide/BETA91A/en-US.pdf', checked: '2026-10-04' },
    { key: 'S-2MIC', label: '[5] Shure, “How to Get a Great Kick Drum Sound Using Two Shure Mics” (June 25, 2026)', url: 'https://www.shure.com/en-US/insights/how-to-get-a-great-kick-drum-sound-using-two-shure-mics', checked: '2026-10-04' },
    { key: 'DPA-PPD', label: '[6] DPA Microphones, “Polarity, phase and delay”', url: 'https://www.dpamicrophones.com/mic-university/technology/polarity-phase-and-delay/', checked: '2026-10-04 (link resolves)' },
    { key: 'AKG-CUT', label: '[7] AKG, D112 MkII cutsheet', url: 'https://support.harmanaudio.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwef0475a5/pdfs/AKG_d112_mkII_cutsheet.pdf', checked: '2026-10-04 (cutsheet read)', note: 'The lesson’s link is the product page, akg.com/D112MkII.html, which could not be reached from here.' },
    { key: 'NIOSH', label: '[8] CDC NIOSH, “Understand Noise Exposure” (Jan. 31, 2024)', url: 'https://www.cdc.gov/niosh/noise/prevent/understand.html', checked: '2026-10-04' },
    { key: 'YMH-ZG01', label: '[9] Yamaha ZG01 manual, phantom-power precautions (an equipment-specific example)', url: 'https://manual.yamaha.com/pa/interfaces/zg01/en-US/7884896267.html', checked: '2026-10-04' },
    { key: 'S-REC1', label: '[10] Shure, “Recording Drums Part 1” (November 6, 2022)', url: 'https://www.shure.com/en-US/insights/recording-drums-part-1-setting-up-and-microphone-technique', checked: '2026-10-04' },
    { key: 'S-LIVE', label: '[11] Shure, Microphone Techniques for Live Sound Reinforcement', url: 'https://www.shure.com/damfiles/default/global/documents/publications/en/performance-production/microphone_techniques_for_live_sound_reinforcement_english.pdf-3df433145fca686a736beeb5da588efa.pdf', checked: '2026-10-04' },
    { key: 'DPA-31', label: '[12a] DPA Microphones, “3:1 rule”', url: 'https://www.dpamicrophones.com/dictionary/0-9/31-rule/', checked: '2026-10-04 (link resolves)' },
    { key: 'S-REC5', label: '[12b] Shure, “Recording Drums Part 5 — Phase Cancellation”', url: 'https://www.shure.com/en-GB/insights/recording-drums-part-5-phase-cancellation', checked: '2026-10-04 (link resolves)' },
    { key: 'LESSON', label: 'This lesson’s research text: “Kick Drum Miking Technique” (research checkpoint 1, October 2026)', checked: '2026-10-04', note: 'The roles of the kick (pulse, attack, resonant note) and the ask-the-player-first step come from it.' },
    { key: 'YMH-HUB', label: 'Yamaha Music Hub, “The Modern Drum Set, Part 2: The Bass Drum” (sizes, spurs, claws)', url: 'https://hub.yamaha.com/drums/studio/part-2-the-bass-drum/', checked: '2026-10-04' },
    { key: 'DW-9000', label: 'DW, 9000 Series Bass Drum Pedals manual (strike point: the centre or 1–2 in above it)', url: 'https://c3.zzounds.com/media/DW9000PedalManual-c60438255a370f0f4d9c3e42aca290d9.pdf', checked: '2026-10-04', note: 'Hosted by a retailer (zZounds).' },
    { key: 'YMH-RC', label: 'Yamaha Recording Custom drum set, specifications (RBB-2218 22 × 18 in)', url: 'https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/drum_sets/recording_custom_2016/specs.html', checked: '2026-10-04' },
    { key: 'MEMBRANE', label: 'Ideal clamped-membrane vibration shapes (Bessel functions) — the same tables the Cymatics and Drum Tuning Labs use', checked: '2026-10-04', note: 'Two-headed drum coupling through the enclosed air: the model the Drum Tuning Lab uses (after Rossing).' },
    { key: 'DRUM', label: 'Drum size and hardware: Yamaha Recording Custom (RBB-2218), TAMA Superstar Classic, DW Design; Remo 5 in offset-port head; DW pedal manuals', checked: '2026-10-04', note: 'Full rows in docs/labs/miking/kick/SOURCES.md.' },
    { key: 'PHYSICS', label: 'Speed of sound (the app’s calculator), comb filtering and first-order polar patterns', checked: '2026-10-04', note: 'Rows in docs/labs/miking/SOURCES_SHARED.md.' },
  ],
  audit: {
    agreement: 'Where they address it, the manufacturer guides support experimenting with position and associate beater-side placement with more attack; the combined-channel sources agree that two mics must be judged together; and the manuals make mounting and orientation part of the outcome.',
    tension: 'DPA says the level just outside a port is sometimes greater than inside, while the Beta 52A guide calls its near-batter row the highest-SPL position of its own choices. Neither supports a rule for every drum. DPA’s claim that dynamics cannot capture the natural sound is a manufacturer judgement without a controlled comparison here — the lesson teaches measured capabilities and listening goals instead.',
    gaps: 'No source gives a universally best position, a predictable response for every mic-and-drum pair, a fixed mix balance, or a hearing-safety limit from a mic rating. Outcomes depend on the drum, the player, the room, the PA and the mics. The lesson asks a drummer and a qualified practitioner to review setups before publishing; the owner reviews this lab on a phone.',
  },
  // Learner text in words; `dims` (code only) ties each line to the
  // placeholder dimensions it covers (review m11: no identifiers on screen).
  unknowns: [
    { text: 'The real shell outside diameter of a “22 in” drum, the hoop height, the hoop-to-shell gap and how far the hoop stands past the head — drawn with placeholders.', dims: ['hHoop', 'cHoop', 'hoopInset'] },
    { text: 'The floor line: whether both hoops touch the floor and how much the spurs lift the drum — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The spurs’ position along the shell, their angle and length — drawn illustratively.', dims: ['spurX'] },
    { text: 'Where an offset port sits (its distance from the centre and its clock angle) — drawn illustratively; never a readout reference.', dims: ['portY', 'portZ'] },
    { text: 'The pedal: shaft length and axle, beater head size, swing and footboard — drawn as an ILLUSTRATIVE envelope.', dims: ['beaterLen', 'beaterHeadR', 'beaterSwingDeg'] },
    { text: 'The pillow’s size and shape — it sets the boundary mic’s height.', dims: ['pillowLen', 'pillowH', 'pillowHalfW'] },
    { text: 'The tension-rod positions: is a rod at bottom centre? (The count — 10 per head — is confirmed.)', dims: ['rodPhaseDeg'] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
    { text: 'Head excursion and every keep-out clearance — ILLUSTRATIVE values for the owner to approve.', dims: ['kick.batter', 'kick.reso', 'kick.resoPorted', 'kick.pillow'] },
  ],
  corrections: [
    { id: 'K-01', text: 'The Beta 52A 20–30 cm row now includes the guide’s “on-axis with beater”.' },
    { id: 'K-02', text: 'The e 902 row reads “at the level of the resonant head” — the manual never mentions a port.' },
    { id: 'K-03', text: '“Turn the e 902 away from the beater strike” is kept as an aiming experiment, not attributed to Sennheiser’s current manual (it is only in the 2019 PDF).' },
    { id: 'K-04', text: 'The e 902 manual link was dead; the archived 2019 copy and the current manual are listed.' },
    { id: 'K-05', text: 'AKG facts come from the D112 MkII cutsheet; the product page could not be reached from here.' },
    { id: 'K-06', text: 'The Beta 52A pattern reads “supercardioid” (Shure’s spec field); “modified supercardioid” is Shure’s description.' },
    { id: 'K-07', text: 'Supercardioid rejection: ≈ 125° in the ideal model; 120° wherever the Beta 52A guide is cited.' },
    { id: 'K-08', text: 'The Beta 91A pattern is stated: half-cardioid, sources within 60° above the surface. No lobe is drawn for it.' },
    { id: 'K-09', text: 'The near row is the guide’s “5 to 7.5 cm … slightly off-center”; the guide never says “inside” — the drawing shows where that is.' },
    { id: 'K-10', text: 'Units are dual everywhere, the source’s own unit first.' },
    { id: 'K-15', text: 'The e 902 manual’s other two positions (a few centimetres from the batter head; midway between the heads) are named in words on the Placement page, not drawn as zones.' },
    { id: 'K-16', text: 'The batter head is part of the resonance: both heads, the air inside and the shell ring together; the front head and port are where much of it leaves the drum.' },
    { id: 'K-17', text: 'A zone whose source names an orientation (“on-axis with beater”, facing the head) counts only while the mic faces that head, within ±30° — the lab’s tolerance.' },
    { id: 'K-18', text: 'The one-mic setup sequence includes the power step from the safety section: mute the outputs and lower monitoring, then switch phantom.' },
    { id: 'K-19', text: 'Studio or live: the monitors stay where a stage puts them (positions drawn by the lab) and you aim the mic; the drummer’s own fill is shown as a case no pattern rejects.' },
    { id: 'K-20', text: 'An ideal null is never printed as a number: real nulls are shallower, and shallowest at low frequencies.' },
    { id: 'K-21', text: 'Maximum-SPL figures are distortion limits under each maker’s own test conditions; none is a listening limit.' },
    { id: 'K-22', text: 'The two-mic graph’s notch depths are illustrative: the levels come from distance alone, which does not hold close to a head.' },
    { id: 'K-23', text: 'A source in a mic’s ideal rear lobe arrives inverted, so the graph follows the inverted notch set even with the switch at +.' },
    { id: 'K-24', text: 'The final task accepts several setups for each brief; the reasons given are what is checked.' },
    { id: 'K-25', text: 'The condenser is called a high-SPL condenser (kick) — the lesson’s own words for it.' },
    { id: 'K-26', text: 'Proximity effect is hedged: how much depends on the source’s size and the mic; close to a large head it is usually less than a point-source chart suggests.' },
  ],
  // Page 4's two monitors (review M2/M7): fixed where a stage puts them; the
  // learner aims the MIC. Positions are ILLUSTRATIVE (no source gives them).
  live: {
    wedges: [
      {
        id: 'downstage',
        label: 'a floor wedge for another player, downstage of the drums, facing upstage',
        short: 'DOWNSTAGE',
        p: { x: L + 900, y: KICK_DIMS.yFloor.mm, z: -450 },
        lift: 150,
        faces: { x: -1, y: 0, z: 0 },
        note: 'It sits on the audience side of the kick, where an outside mic’s rear faces it — the case a pattern’s null can help with.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
      {
        id: 'fill',
        label: 'the drummer’s own fill, on the floor beside the throne',
        short: 'DRUM FILL',
        p: { x: -450, y: KICK_DIMS.yFloor.mm, z: 750 },
        lift: 150,
        faces: { x: -0.2, y: 0, z: -1 },
        note: 'It sits on the drummer’s side, in FRONT of a kick mic aimed at the drum: no pattern null reaches it. The drum itself — shell and heads — is what shields a mic from it.',
        prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
      },
    ],
  },
  accuracyDetail:
    'This lab is SILENT, and it DRAWS a model: a 22 × 18 in kick built from manufacturer dimensions, with the unknown parts (floor, port position, pedal, pillow, hoop details) drawn ILLUSTRATIVE. The placement zones are manufacturers’ documented starting points for particular products, measured from the head each one names; clearances, the boom and the pedal envelope are ILLUSTRATIVE. Distances are rounded to ≈ 5 mm and measured to the mic’s front, not its acoustic centre. Patterns and the two-mic comb are IDEAL models, not measurements of any drum. On the first pages, head motion is drawn EXAGGERATED from the ideal membrane, arrows show the order of events (never speed or level), and the kit plan’s positions are ILLUSTRATIVE. Learn the reasoning here; place real mics with the drummer stopped, and trust the drum, your ears and a calibrated measurement.',
};
